from fastapi import FastAPI, File, UploadFile
from fastapi.responses import JSONResponse
from transformers import AutoImageProcessor, AutoModelForImageClassification
from PIL import Image
import torch
import io

app = FastAPI()

# General food classifier (Food101 - knows pizza, burger, pasta, sushi etc.)
GENERAL_MODEL_NAME = "nateraw/food"
# Indian food classifier
INDIAN_MODEL_NAME = "rajistics/finetuned-indian-food"

INDIAN_KEYWORDS = [
    "biryani", "dosa", "idli", "samosa", "paneer", "curry", "roti", "naan",
    "pav bhaji", "chole", "vada", "uttapam", "poha", "halwa", "kheer",
    "gulab jamun", "jalebi", "paratha", "dal", "tikka", "korma", "pakora",
    "rasgulla", "laddu", "barfi", "khichdi", "upma", "puri", "bhaji"
]

print(f"🔄 Loading general model {GENERAL_MODEL_NAME}...")
general_processor = AutoImageProcessor.from_pretrained(GENERAL_MODEL_NAME)
general_model = AutoModelForImageClassification.from_pretrained(GENERAL_MODEL_NAME)

print(f"🔄 Loading Indian model {INDIAN_MODEL_NAME}...")
indian_processor = AutoImageProcessor.from_pretrained(INDIAN_MODEL_NAME)
indian_model = AutoModelForImageClassification.from_pretrained(INDIAN_MODEL_NAME)

print("✅ Both models loaded!")


def is_indian_food(label: str) -> bool:
    label_lower = label.lower()
    return any(keyword in label_lower for keyword in INDIAN_KEYWORDS)


def run_model(processor, model, image):
    inputs = processor(images=image, return_tensors="pt")
    with torch.no_grad():
        outputs = model(**inputs)
    probs = torch.nn.functional.softmax(outputs.logits, dim=-1)[0]
    top_prob, top_idx = torch.max(probs, dim=0)
    label = model.config.id2label[int(top_idx)]
    confidence = round(float(top_prob), 4)
    return label, confidence


@app.post("/classify")
async def classify(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        image = Image.open(io.BytesIO(contents)).convert("RGB")

        # Step 1: Run general model first
        general_label, general_conf = run_model(general_processor, general_model, image)
        print(f"🌍 General model: {general_label} ({general_conf})")

        # Step 2: If general model is confident it's NOT Indian → return immediately
        if general_conf >= 0.5 and not is_indian_food(general_label):
            print(f"✅ Non-Indian food detected: {general_label}")
            return { "label": general_label, "confidence": general_conf }

        # Step 3: Looks Indian or general model unsure → run Indian model
        indian_label, indian_conf = run_model(indian_processor, indian_model, image)
        print(f"🇮🇳 Indian model: {indian_label} ({indian_conf})")

        # Step 4: Indian model confident → use it
        if indian_conf >= 0.65:
            print(f"✅ Indian food confirmed: {indian_label}")
            return { "label": indian_label, "confidence": indian_conf }

        # Step 5: Both uncertain → trust whichever is more confident
        if general_conf >= indian_conf:
            print(f"✅ Using general model (more confident): {general_label}")
            return { "label": general_label, "confidence": general_conf }
        else:
            return { "label": indian_label, "confidence": indian_conf }

    except Exception as e:
        print("❌ Classifier error:", e)
        return JSONResponse(status_code=500, content={"error": str(e)})
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5001)