a module.exports = async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    // TEMP DEBUG: Intentionally require OpenAI in a try/catch so we can SEE the error
    let OpenAI;
    try {
      OpenAI = require("openai");
    } catch (e) {
      return res.status(500).json({
        debug: "Failed to require('openai')",
        error: e.toString()
      });
    }

    return res.status(200).json({
      success: true,
      message: "OpenAI module loaded successfully.",
      note: "Next step will be testing full AI call."
    });

  } catch (err) {
    // FINAL CATCH — show the actual error raw
    return res.status(500).json({
      debug: "FINAL CATCH BLOCK",
      error: err.toString(),
      stack: err.stack
    });
  }
};