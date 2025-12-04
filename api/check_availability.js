export default async function handler(req, res) {
  try {
    const body = req.body;

    return res.status(200).json({
      success: true,
      message: "check_availability endpoint is live",
      data: body
    });
  } catch (err) {
    console.error("Error in check_availability:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
}
