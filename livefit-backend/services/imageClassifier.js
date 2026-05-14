const axios = require("axios");
const FormData = require("form-data");

const PYTHON_CLASSIFIER_URL = process.env.PYTHON_CLASSIFIER_URL || "http://127.0.0.1:5001";

const INDIAN_KEYWORDS = [
  "biryani", "dosa", "idli", "samosa", "paneer", "roti", "naan",
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
    console.error("❌ Python classifier error:", err.response?.data || err.message);
    return null;
  }
}

async function classifyImage(buffer) {
  console.log("🚀 Classifying via Python service...");
  console.log("🔗 Using URL:", PYTHON_CLASSIFIER_URL);

  const pyResult = await classifyWithPython(buffer);

  if (pyResult && pyResult.label) {
    console.log("✅ Python classifier result:", pyResult);
    return [pyResult];
  }

  // Python service failed — do NOT fall back to Roboflow
  // (Roboflow model is Indian-food-only and causes misclassification)
  console.error("❌ Python classifier unavailable. No fallback.");
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