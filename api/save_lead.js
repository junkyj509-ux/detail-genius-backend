export default async function handler(req, res) {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    const body = req.body;

    // Placeholder for saving lead logic
    return res.status(200).json({
      success: true,
      message: "save_lead endpoint is live",
      received: body
    });
  } catch (err) {
    console.error("Error in save_lead:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
}
