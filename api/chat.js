import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export default async function handler(req, res) {
  // CORS
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

    // Build conversation
    const messages = [
      {
        role: "system",
        content: `
          You are the Detail Genius AI assistant for an auto detailing business.
          You answer questions about interior/exterior detailing, ceramic coatings, paint correction,
          pricing, availability, and recommendations. Keep responses friendly, concise, and useful.
        `
      }
    ];

    if (Array.isArray(history)) {
      for (const msg of history) {
        messages.push({ role: msg.role, content: msg.content });
      }
    }

    messages.push({ role: "user", content: message });

    // Request to OpenAI
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
      max_tokens: 300
    });

    const reply = completion.choices?.[0]?.message?.content || "I’m here to help!";

    return res.status(200).json({ reply });

  } catch (err) {
    console.error("CHAT ERROR:", err);
    return res.status(500).json({
      error: "Server error",
      detail: err.message
    });
  }
}
