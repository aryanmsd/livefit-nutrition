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

# Better general food classifier
# Handles pizza, burger, pasta, sushi, steak, etc.
GENERAL_MODEL_NAME = "dima806/food-image-classification"

# Specialized Indian food classifier
INDIAN_MODEL_NAME = "rajistics/finetuned-indian-food"

# ============================================
# INDIAN FOOD KEYWORDS
# ============================================

INDIAN_KEYWORDS = [
    "biryani",
    "dosa",
    "idli",
    "samosa",
    "paneer",
    "curry",
    "roti",
    "naan",
    "pav bhaji",
    "chole",
    "vada",
    "uttapam",
    "poha",
    "halwa",
    "kheer",
    "gulab jamun",
    "jalebi",
    "paratha",
    "dal",
    "tikka",
    "korma",
    "pakora",
    "rasgulla",
    "laddu",
    "barfi",
    "khichdi",
    "upma",
    "puri",
    "bhaji",
    "rajma",
    "palak paneer",
    "butter chicken",
    "kachori",
    "sev puri",
    "pani puri",
    "golgappa",
    "dahi puri"
]

# ============================================
# LOAD MODELS
# ============================================

print(f"\n🔄 Loading general model: {GENERAL_MODEL_NAME}")

general_processor = AutoImageProcessor.from_pretrained(
    GENERAL_MODEL_NAME
)

general_model = AutoModelForImageClassification.from_pretrained(
    GENERAL_MODEL_NAME
)

print(f"🔄 Loading Indian model: {INDIAN_MODEL_NAME}")

indian_processor = AutoImageProcessor.from_pretrained(
    INDIAN_MODEL_NAME
)

indian_model = AutoModelForImageClassification.from_pretrained(
    INDIAN_MODEL_NAME
)

print("✅ Both models loaded successfully!\n")

# ============================================
# HELPERS
# ============================================

def is_indian_food(label: str) -> bool:
    """
    Detect whether a predicted label
    appears to be Indian food.
    """

    if not label:
        return False

    label_lower = label.lower().strip()

    return any(
        keyword in label_lower
        for keyword in INDIAN_KEYWORDS
    )


def clean_label(label: str) -> str:
    """
    Normalize labels.
    """

    if not label:
        return ""

    return (
        label.lower()
        .replace("_", " ")
        .strip()
    )


def run_model(processor, model, image):
    """
    Run inference using HuggingFace model.
    """

    inputs = processor(
        images=image,
        return_tensors="pt"
    )

    with torch.no_grad():
        outputs = model(**inputs)

    probs = torch.nn.functional.softmax(
        outputs.logits,
        dim=-1
    )[0]

    top_prob, top_idx = torch.max(
        probs,
        dim=0
    )

    label = model.config.id2label[
        int(top_idx)
    ]

    confidence = round(
        float(top_prob),
        4
    )

    return clean_label(label), confidence

# ============================================
# ROUTES
# ============================================

@app.get("/wake")
def wake():
    return {
        "status": "awake"
    }


@app.post("/classify")
async def classify(file: UploadFile = File(...)):

    try:

        print("\n====================================")
        print("🚀 Starting food classification")
        print("====================================")

        # ====================================
        # READ IMAGE
        # ====================================

        contents = await file.read()

        image = Image.open(
            io.BytesIO(contents)
        ).convert("RGB")

        # ====================================
        # STEP 1:
        # GENERAL FOOD MODEL
        # ====================================

        general_label, general_conf = run_model(
            general_processor,
            general_model,
            image
        )

        print(
            f"🌍 General model prediction: "
            f"{general_label} ({general_conf})"
        )

        # ====================================
        # STEP 2:
        # NON-INDIAN FOOD
        # RETURN IMMEDIATELY
        # ====================================
        #
        # IMPORTANT FIX:
        #
        # LOW CONFIDENCE DOES NOT MEAN
        # INDIAN FOOD.
        #
        # Pizza with 0.42 confidence
        # should STILL remain pizza.
        #
        # ====================================

        if not is_indian_food(general_label):

            print(
                f"✅ Non-Indian food detected: "
                f"{general_label}"
            )

            return {
                "label": general_label,
                "confidence": general_conf,
                "source": "general-model"
            }

        # ====================================
        # STEP 3:
        # POSSIBLE INDIAN FOOD
        # ====================================

        print(
            "🇮🇳 Possible Indian food detected"
        )

        print(
            "🇮🇳 Running Indian classifier..."
        )

        indian_label, indian_conf = run_model(
            indian_processor,
            indian_model,
            image
        )

        print(
            f"🇮🇳 Indian model prediction: "
            f"{indian_label} ({indian_conf})"
        )

        # ====================================
        # STEP 4:
        # USE INDIAN RESULT
        # ONLY IF CONFIDENT
        # ====================================

        if indian_conf >= 0.65:

            print(
                f"✅ Indian food confirmed: "
                f"{indian_label}"
            )

            return {
                "label": indian_label,
                "confidence": indian_conf,
                "source": "indian-model"
            }

        # ====================================
        # STEP 5:
        # FALLBACK TO GENERAL MODEL
        # ====================================

        print(
            "⚠️ Indian confidence too low"
        )

        print(
            "➡️ Falling back to general model"
        )

        return {
            "label": general_label,
            "confidence": general_conf,
            "source": "general-fallback"
        }

    except Exception as e:

        print("\n❌ CLASSIFIER ERROR")
        print(str(e))

        return JSONResponse(
            status_code=500,
            content={
                "error": str(e)
            }
        )

# ============================================
# RUN SERVER
# ============================================

if __name__ == "__main__":

    import uvicorn

    uvicorn.run(
        app,
        host="0.0.0.0",
        port=5001
    )