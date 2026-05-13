const Groq = require("groq-sdk");
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function askAI(message, username = "User", nutrition = {}) {
  try {
    const calories = nutrition.calories || 0;
    const protein = nutrition.protein || 0;
    const carbs = nutrition.carbs || 0;
    const fats = nutrition.fats || 0;

    const prompt = `You are LiveFit AI, a personal nutrition and fitness assistant.

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

User question: ${message}`;

    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 1024
    });

    return completion.choices[0].message.content;
  } catch (err) {
    console.error("❌ Groq AI error:", err.message);
    return "⚠️ LiveFit AI is temporarily unavailable. Please try again later.";
  }
}

module.exports = { askAI };