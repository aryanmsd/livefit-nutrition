async function classifyImage(buffer) {
  console.log("🚀 Starting hybrid classification...");

  // 1. Try local Indian food model
  const pyResult = await classifyWithPython(buffer);

  if (pyResult) {
    console.log("🔍 Local model result:", pyResult);

    // HIGH confidence → trust it
    if (pyResult.confidence >= 0.75) {
      console.log("✅ High confidence Indian classification:", pyResult);
      return [pyResult];
    }

    // LOW confidence → the food is probably NOT Indian, try Roboflow
    console.log("⚠️ Low confidence, probably not Indian food → trying Roboflow...");
  }

  // 2. Roboflow — better for general/non-Indian foods
  const rfResult = await classifyWithRoboflow(buffer);
  if (rfResult && rfResult.confidence >= 0.4) {
    console.log("✅ Roboflow result:", rfResult);
    return [rfResult];
  }

  // 3. If Roboflow also uncertain but has something, use it
  if (rfResult) return [rfResult];

  // 4. Last resort — use the low-confidence Indian result if it's all we have
  if (pyResult) return [pyResult];

  return null;
}