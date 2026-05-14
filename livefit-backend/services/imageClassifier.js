const axios = require("axios");
const FormData = require("form-data");

const PYTHON_CLASSIFIER_URL = process.env.PYTHON_CLASSIFIER_URL || "http://127.0.0.1:5001";

const INDIAN_KEYWORDS = [
  "biryani", "dosa", "idli", "samosa", "paneer", "curry", "roti", "naan",
  "pav bhaji", "chole", "vada", "uttapam", "poha", "halwa", "kheer",
  "gulab jamun", "jalebi", "paratha", "dal", "tikka", "korma", "pakora"
];

function isIndianLabel(label) {
  return INDIAN_KEYWORDS.some(k => label.toLowerCase().includes(k));
}

async function classifyWithPython(buffer) {
  try {
    const form = new FormData();
    form.append("file", buffer, { filename: "upload.jpg" });
    const response = await axios.post(
      `${PYTHON_CLASSIFIER_URL}/classify`,
      form,
      { headers: form.getHeaders(), timeout: 30000 }
    );
    return response.data;
  } catch (err) {
    console.error("❌ Local classifier error:", err.response?.data || err.message);
    return null;
  }
}

async function classifyWithRoboflow(buffer) {
  const apiKey = process.env.ROBOFLOW_API_KEY;
  const modelId = process.env.ROBOFLOW_MODEL;
  const modelVersion = process.env.ROBOFLOW_VERSION || "1";

  if (!apiKey || !modelId) {
    console.error("❌ Roboflow API key or model not configured");
    return null;
  }

  try {
    const base64Image = buffer.toString("base64");
    const response = await axios({
      method: "POST",
      url: `https://detect.roboflow.com/${modelId}/${modelVersion}?api_key=${apiKey}`,
      data: base64Image,
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      timeout: 30000
    });

    const predictions = response.data?.predictions;
    if (predictions?.length > 0) {
      const best = predictions[0];
      return { label: best.class, confidence: best.confidence };
    }
    return null;
  } catch (err) {
    console.error("❌ Roboflow error:", err.message);
    return null;
  }
}

async function classifyImage(buffer) {
  console.log("🚀 Starting hybrid classification...");

  // Step 1: Try Python service (uses HF Inference API internally)
  const pyResult = await classifyWithPython(buffer);

  if (pyResult) {
    console.log("🔍 Python classifier result:", pyResult);

    // Non-Indian food with good confidence → go straight to USDA
    if (!isIndianLabel(pyResult.label) && pyResult.confidence >= 0.5) {
      console.log("✅ Non-Indian food detected:", pyResult.label);
      return [pyResult];
    }

    // Indian food with good confidence → use IFCT
    if (isIndianLabel(pyResult.label) && pyResult.confidence >= 0.65) {
      console.log("✅ Indian food detected:", pyResult.label);
      return [pyResult];
    }
  }

  // Step 2: Fallback to Roboflow
  console.log("⚠️ Falling back to Roboflow...");
  const rfResult = await classifyWithRoboflow(buffer);
  if (rfResult && rfResult.confidence >= 0.5) {
    console.log("✅ Roboflow result:", rfResult);
    return [rfResult];
  }

  if (rfResult) return [rfResult];
  if (pyResult) return [pyResult];

  return null;
}

function cleanFoodLabel(label) {
  if (!label) return label;
  return label
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .replace(/[^a-z0-9\s]/g, "")
    .trim();
}

module.exports = {
  classifyImage,
  cleanFoodLabel,
  cleanFoodName: cleanFoodLabel,
};