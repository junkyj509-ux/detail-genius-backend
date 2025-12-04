export default async function handler(req, res) {
  try {
    const body = req.body;

    // Placeholder for quote logic
    return res.status(200).json({
      success: true,
      message: "get_quote endpoint is live",
      received: body
    });
  } catch (err) {
    console.error("Error in get_quote:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
}
