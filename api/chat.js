export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    // Try loading OpenAI so we can see the exact failure
    let OpenAI;
    try {
      OpenAI = await import("openai");
    } catch (err) {
      return res.status(500).json({
        debug: "FAILED TO IMPORT OPENAI",
        error: err.message,
        stack: err.stack
      });
    }

    return res.status(200).json({
      debug: "OpenAI imported successfully",
      nextStep: "We will add AI logic once this import is stable."
    });

  } catch (err) {
    return res.status(500).json({
      debug: "MAIN CATCH BLOCK ERROR",
      error: err.message,
      stack: err.stack
    });
  }
}
