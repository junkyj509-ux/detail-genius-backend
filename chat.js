export default async function handler(req, res) {
  // ---------------------------
  // CORS HEADERS (REQUIRED)
  // ---------------------------
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
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Missing message" });
    }

    // ------------------------------------------------
    // TEMPORARY REPLY (we will replace with AI later)
    // ------------------------------------------------
    const reply = "You said: " + message;

    return res.status(200).json({ reply });

  } catch (err) {
    console.error("CHAT ERROR:", err);
    return res.status(500).json({ error: "Server error" });
  }
}
