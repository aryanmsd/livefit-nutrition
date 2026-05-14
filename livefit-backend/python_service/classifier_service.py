from fastapi import FastAPI, File, UploadFile
from fastapi.responses import JSONResponse
import httpx
import os

app = FastAPI()

HF_TOKEN = os.getenv("HF_TOKEN")

GENERAL_MODEL = "nateraw/food"
INDIAN_MODEL = "rajistics/finetuned-indian-food"

INDIAN_KEYWORDS = [
    "biryani", "dosa", "idli", "samosa", "paneer", "curry", "roti", "naan",
    "pav bhaji", "chole", "vada", "uttapam", "poha", "halwa", "kheer",
    "gulab jamun", "jalebi", "paratha", "dal", "tikka", "korma", "pakora"
]

def is_indian(label: str) -> bool:
    return any(k in label.lower() for k in INDIAN_KEYWORDS)

async def query_hf(model: str, image_bytes: bytes):
    url = f"https://api-inference.huggingface.co/models/{model}"
    headers = {"Authorization": f"Bearer {HF_TOKEN}"} if HF_TOKEN else {}
    async with httpx.AsyncClient(timeout=30) as client:
        response = await client.post(url, content=image_bytes, headers=headers)
        response.raise_for_status()
        return response.json()

@app.get("/wake")
def wake():
    return {"status": "awake"}

@app.post("/classify")
async def classify(file: UploadFile = File(...)):
    try:
        contents = await file.read()

        # Step 1: General model first
        general_results = await query_hf(GENERAL_MODEL, contents)
        if general_results and len(general_results) > 0:
            top = general_results[0]
            label = top["label"]
            confidence = round(top["score"], 4)
            print(f"🌍 General model: {label} ({confidence})")

            # Not Indian → return immediately, will go to USDA
            if confidence >= 0.5 and not is_indian(label):
                print(f"✅ Non-Indian food: {label}")
                return {"label": label, "confidence": confidence}

        # Step 2: Looks Indian → refine with Indian model
        indian_results = await query_hf(INDIAN_MODEL, contents)
        if indian_results and len(indian_results) > 0:
            top = indian_results[0]
            label = top["label"]
            confidence = round(top["score"], 4)
            print(f"🇮🇳 Indian model: {label} ({confidence})")
            return {"label": label, "confidence": confidence}

        return JSONResponse(status_code=400, content={"error": "Could not classify"})

    except Exception as e:
        print("❌ Classifier error:", e)
        return JSONResponse(status_code=500, content={"error": str(e)})