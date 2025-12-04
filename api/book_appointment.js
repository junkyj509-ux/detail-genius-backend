export default async function handler(req, res) {
  try {
    const body = req.body;

    // Placeholder logic — real booking logic with Square will go here
    return res.status(200).json({
      success: true,
      message: "book_appointment endpoint is live",
      received: body
    });
  } catch (err) {
    console.error("Error in book_appointment:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
}