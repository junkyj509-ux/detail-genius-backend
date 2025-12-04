export default async function handler(req, res) {
  try {
    const { location_city, date_time } = req.body || {};

    if (!location_city || !date_time) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: location_city or date_time"
      });
    }

    // TEMP STUB:
    // We are skipping the real weather API for now.
    // Always return "safe: true" so the assistant can keep working.
    return res.status(200).json({
      success: true,
      safe: true,
      reason: "Weather API temporarily disabled; assume conditions are acceptable.",
      conditions: {
        temp_f: null,
        chance_of_rain: null,
        chance_of_snow: null,
        wind_mph: null,
        condition_text: "Unknown (stubbed)"
      }
    });
  } catch (err) {
    console.error("Error in check_weather:", err);
    return res.status(500).json({
      success: false,
      error: err.message
    });
  }
}
