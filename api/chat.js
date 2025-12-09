import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export default async function handler(req, res) {
  // ---------------------------
  // CORS (required for browser)
  // ---------------------------
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Handle preflight
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

    // ---------------------------
    // Build the message history
    // ---------------------------
    const messages = [
      {
        role: "system",
        content: `
          You are the Detail Genius AI assistant for a professional automotive detailing business.
          You help customers with:
          • Interior detailing
          • Exterior detailing
          • Full detail packages
          • Paint correction
          • Ceramic coatings
          • Boats & RV detailing
          • Pricing questions
          • Recommendations
          • Availability
          • Upsells
          
          Be friendly, concise, and helpful.
          Always answer like a real assistant working for Justin at Detail Genius Mobile Detailing.
        `
      }
    ];

    // Add previous conversation messages, if any
    if (Array.isArray(history)) {
      history.forEach(msg => {
        messages.push({
          role: msg.role,
          content: msg.content
        });
      });
    }

    // Add the new user message
    messages.push({
      role: "user",
      content: message
    });

    // ---------------------------
    // AI response
    // ---------------------------
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
}
