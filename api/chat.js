import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  // CORS support
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { message, history } = req.body;

    if (!message) {
      return res.status(400).json({ error: "No message provided" });
    }

    // Build the conversation for OpenAI
    const messages = [
      {
        role: "system",
        content: `
          You are the Detail Genius AI assistant.
          You answer questions about interior/exterior detailing,
          ceramic coatings, paint correction, pricing, recommendations,
          service descriptions, and scheduling guidance.
          Keep the tone friendly and helpful.
        `,
      },
    ];

    if (Array.isArray(history)) {
      history.forEach((m) => {
        if (m.role && m.content) {
          messages.push({
            role: m.role,
            content: m.content,
          });
        }
      });
    }

    messages.push({
      role: "user",
      content: message,
    });

    // AI Request
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
      max_tokens: 300,
    });

    const reply =
      completion.choices?.[0]?.message?.content ||
      "I'm here — ask me anything about detailing!";

    return res.status(200).json({ reply });
  } catch (error) {
    console.error("CHAT FUNCTION ERROR:", error);
    return res.status(500).json({
      error: "Server error",
      detail: error?.message || error.toString(),
    });
  }
}
