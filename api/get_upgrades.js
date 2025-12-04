export default async function handler(req, res) {
  try {
    const body = req.body;

    // Placeholder for upsell logic
    return res.status(200).json({
      success: true,
      message: "get_upgrades endpoint is live",
      received: body
    });
  } catch (err) {
    console.error("Error in get_upgrades:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
}
