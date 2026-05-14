from fastapi import FastAPI, File, UploadFile
from fastapi.responses import JSONResponse
from transformers import (
    AutoImageProcessor,
    AutoModelForImageClassification
)
from PIL import Image
import torch
import io

app = FastAPI()

# ============================================
# MODELS
# ============================================

GENERAL_MODEL_NAME = "nateraw/food"
INDIAN_MODEL_NAME = "rajistics/finetuned-indian-food"

# ============================================
# LAZY MODEL REGISTRY
# Models are loaded on first use, not at boot.
# This keeps startup RAM low so Render doesn't
# kill the process before the port opens.
# ============================================

_models = {}

def get_model(name):
    if name not in _models:
        print(f"🔄 Loading model: {name}")
        processor = AutoImageProcessor.from_pretrained(name)
        model = AutoModelForImageClassification.from_pretrained(
            name,
            torch_dtype=torch.float16,
            low_cpu_mem_usage=True
        )
        model.eval()
        _models[name] = (processor, model)
        print(f"✅ Model loaded: {name}")
    return _models[name]

# ============================================
# INDIAN FOOD KEYWORDS
# NOTE: "curry" intentionally excluded —
# Food101 uses it for non-Indian dishes too.
# ============================================

INDIAN_KEYWORDS = [
    "biryani", "dosa", "idli", "samosa", "paneer",
    "roti", "naan", "pav bhaji", "chole", "vada",
    "uttapam", "poha", "halwa", "kheer", "gulab jamun",
    "jalebi", "paratha", "dal", "tikka", "korma",
    "pakora", "rasgulla", "laddu", "barfi", "khichdi",
    "upma", "puri", "bhaji", "rajma", "palak paneer",
    "butter chicken", "kachori", "sev puri", "pani puri",
    "golgappa", "dahi puri"
]

# ============================================
# HELPERS
# ============================================

def is_indian_food(label: str) -> bool:
    if not label:
        return False
    label_lower = label.lower().strip()
    return any(keyword in label_lower for keyword in INDIAN_KEYWORDS)


def clean_label(label: str) -> str:
    if not label:
        return ""
    return label.lower().replace("_", " ").strip()


def run_model(processor, model, image):
    inputs = processor(images=image, return_tensors="pt")

    inputs = {k: v.half() if v.dtype == torch.float32 else v
              for k, v in inputs.items()}

    with torch.no_grad():
        outputs = model(**inputs)

    probs = torch.nn.functional.softmax(
        outputs.logits.float(),
        dim=-1
    )[0]

    top_prob, top_idx = torch.max(probs, dim=0)
    label = model.config.id2label[int(top_idx)]
    confidence = round(float(top_prob), 4)

    return clean_label(label), confidence

# ============================================
# ROUTES
# ============================================

@app.get("/wake")
def wake():
    return {"status": "awake"}


@app.post("/classify")
async def classify(file: UploadFile = File(...)):

    try:
        print("\n====================================")
        print("🚀 Starting food classification")
        print("====================================")

        contents = await file.read()
        image = Image.open(io.BytesIO(contents)).convert("RGB")

        # STEP 1: General model (lazy loaded)
        general_processor, general_model = get_model(GENERAL_MODEL_NAME)
        general_label, general_conf = run_model(
            general_processor, general_model, image
        )
        print(f"🌍 General model: {general_label} ({general_conf})")

        # STEP 2: Non-Indian → return immediately, no confidence gate
        if not is_indian_food(general_label):
            print(f"✅ Non-Indian food: {general_label}")
            return {
                "label": general_label,
                "confidence": general_conf,
                "source": "general-model"
            }

        # STEP 3: Indian food path (lazy load Indian model only now)
        print("🇮🇳 Possible Indian food, running Indian classifier...")
        indian_processor, indian_model = get_model(INDIAN_MODEL_NAME)
        indian_label, indian_conf = run_model(
            indian_processor, indian_model, image
        )
        print(f"🇮🇳 Indian model: {indian_label} ({indian_conf})")

        if indian_conf >= 0.65:
            print(f"✅ Indian food confirmed: {indian_label}")
            return {
                "label": indian_label,
                "confidence": indian_conf,
                "source": "indian-model"
            }

        # STEP 4: Fallback
        print("⚠️ Indian confidence too low, falling back to general")
        return {
            "label": general_label,
            "confidence": general_conf,
            "source": "general-fallback"
        }

    except Exception as e:
        print(f"\n❌ CLASSIFIER ERROR: {e}")
        return JSONResponse(
            status_code=500,
            content={"error": str(e)}
        )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5001)