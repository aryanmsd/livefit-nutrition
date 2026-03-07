from fastapi import FastAPI, File, UploadFile
from fastapi.responses import JSONResponse
from transformers import AutoImageProcessor, AutoModelForImageClassification
from PIL import Image
import torch
import io

app = FastAPI()

MODEL_NAME = "rajistics/finetuned-indian-food"
print(f"🔄 Loading model {MODEL_NAME}...")

processor = AutoImageProcessor.from_pretrained(MODEL_NAME)
model = AutoModelForImageClassification.from_pretrained(MODEL_NAME)


@app.post("/classify")
async def classify(file: UploadFile = File(...)):
    try:
        # ✅ Correct way to read file
        contents = await file.read()

        # Convert to PIL image
        image = Image.open(io.BytesIO(contents)).convert("RGB")

        # Preprocess image
        inputs = processor(images=image, return_tensors="pt")

        # Run model
        with torch.no_grad():
            outputs = model(**inputs)

        logits = outputs.logits
        probs = torch.nn.functional.softmax(logits, dim=-1)[0]

        # Get top prediction
        top_prob, top_idx = torch.max(probs, dim=0)

        label = model.config.id2label[int(top_idx)]
        confidence = round(float(top_prob), 4)

        print(f"✅ Prediction: {label} ({confidence})")

        return {
            "label": label,
            "confidence": confidence
        }

    except Exception as e:
        print("❌ Classifier error:", e)
        return JSONResponse(
            status_code=500,
            content={"error": str(e)}
        )