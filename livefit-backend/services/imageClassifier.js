const axios = require("axios");
const FormData = require("form-data");

const PYTHON_CLASSIFIER_URL = process.env.PYTHON_CLASSIFIER_URL;

// ============================================================
// These keywords determine whether to trust the Indian model.
// Keep this list TIGHT — only use it to decide routing,
// NOT to gate whether a result is returned at all.
// ============================================================
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

  // Step 1: Try Python service
  const pyResult = await classifyWithPython(buffer);

  if (pyResult && pyResult.label) {
    console.log("🔍 Python classifier result:", pyResult);

    // ✅ FIX: Non-Indian food → ALWAYS return immediately.
    // Do NOT gate on confidence. Low-confidence pizza is still pizza,
    // not biryani. The USDA search will handle ambiguous labels.
    if (!isIndianLabel(pyResult.label)) {
      console.log("✅ Non-Indian food detected:", pyResult.label);
      return [pyResult];
    }

    // Indian food with good confidence → return it
    if (isIndianLabel(pyResult.label) && pyResult.confidence >= 0.65) {
      console.log("✅ Indian food detected:", pyResult.label);
      return [pyResult];
    }

    // Indian label but low confidence → try Roboflow before trusting it
    console.log("⚠️ Indian label but low confidence, trying Roboflow...");
  }

  // Step 2: Fallback to Roboflow
  console.log("⚠️ Falling back to Roboflow...");
  const rfResult = await classifyWithRoboflow(buffer);
  if (rfResult && rfResult.confidence >= 0.5) {
    console.log("✅ Roboflow result:", rfResult);
    return [rfResult];
  }

  // Step 3: Return whatever we have, even if low confidence
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