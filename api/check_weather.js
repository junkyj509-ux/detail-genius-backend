export default async function handler(req, res) {
  try {
    const body = req.body;

    // Placeholder for weather logic
    return res.status(200).json({
      success: true,
      message: "check_weather endpoint is live",
      received: body
    });
  } catch (err) {
    console.error("Error in check_weather:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
}
