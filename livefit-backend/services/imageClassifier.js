const axios = require("axios");
const FormData = require("form-data");

async function classifyWithPython(buffer) {
  try {
    const form = new FormData();
    form.append("file", buffer, { filename: "upload.jpg" });
    const response = await axios.post(
      "http://127.0.0.1:5001/classify",
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

  const pyResult = await classifyWithPython(buffer);

  if (pyResult) {
    console.log("🔍 Local model result:", pyResult);

    if (pyResult.confidence >= 0.75) {
      console.log("✅ High confidence Indian classification:", pyResult);
      return [pyResult];
    }

    console.log("⚠️ Low confidence, probably not Indian food → trying Roboflow...");
  }

  const rfResult = await classifyWithRoboflow(buffer);
  if (rfResult && rfResult.confidence >= 0.4) {
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