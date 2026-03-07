const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function askAI(message, username = "User", nutrition = {}) {
  try {
    const model = genAI.getGenerativeModel({
      model: "models/gemini-2.5-flash"
    });

    // Default nutrition values (safe fallback)
    const calories = nutrition.calories || 0;
    const protein = nutrition.protein || 0;
    const carbs = nutrition.carbs || 0;
    const fats = nutrition.fats || 0;

    const prompt = `
You are LiveFit AI, a personal nutrition and fitness assistant.

User name: ${username}

Today's nutrition intake:
- Calories: ${calories} kcal
- Protein: ${protein} g
- Carbs: ${carbs} g
- Fats: ${fats} g

General healthy targets (for reference):
- Calories: ~2000 kcal
- Protein: ~120 g
- Carbs: ~300 g
- Fats: ~90 g

Rules:
- Personalize advice
- Mention deficiencies or excess clearly
- Suggest simple food options
- Be concise and friendly
- DO NOT give medical diagnoses

User question:
${message}
`;

    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (err) {
    console.error("❌ Gemini AI error:", err.message);
    return "⚠️ LiveFit AI is temporarily unavailable. Please try again later.";
  }
}

module.exports = { askAI };
