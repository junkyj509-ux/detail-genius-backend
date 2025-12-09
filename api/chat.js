const OpenAI = require("openai");

// Initialize OpenAI client
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

module.exports = async function handler(req, res) {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { message, history, lead } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Missing message" });
    }

    // Build messages list
    const messages = [
      {
        role: "system",
        content: `
          You are the Detail Genius AI assistant.
          You help customers with:
          • Detailing questions
          • Ceramic coatings
          • Quotes
          • Recommendations
          • Booking help
          Always respond friendly, clear, and concise.
        `
      }
    ];

    if (Array.isArray(history)) {
      history.forEach(entry => {
        messages.push({
          role: entry.role,
          content: entry.content
        });
      });
    }

    messages.push({
      role: "user",
      content: message
    });

    // Call OpenAI
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
      max_tokens: 300
    });

    const reply = completion.choices[0].message.content;

    return res.status(200).json({ reply });

  } catch (err) {
    console.error("CHAT ERROR:", err);
    return res.status(500).json({ error: "Server error" });
  }
};
