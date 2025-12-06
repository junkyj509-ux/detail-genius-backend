import { Client, Environment } from "square";

const LOCATION_ID = process.env.SQUARE_LOCATION_ID;

const client = new Client({
  accessToken: process.env.SQUARE_ACCESS_TOKEN,
  environment: Environment.Sandbox, // change to Production when you go live
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Use POST." });
  }

  if (!LOCATION_ID) {
    return res.status(500).json({
      success: false,
      error: "SQUARE_LOCATION_ID is not set in environment variables.",
    });
  }

  try {
    const body = {
      location: {
        business_hours: {
          periods: [
            { day_of_week: "MON", start_local_time: "08:00", end_local_time: "18:00" },
            { day_of_week: "TUE", start_local_time: "08:00", end_local_time: "18:00" },
            { day_of_week: "WED", start_local_time: "08:00", end_local_time: "18:00" },
            { day_of_week: "THU", start_local_time: "08:00", end_local_time: "18:00" },
            { day_of_week: "FRI", start_local_time: "08:00", end_local_time: "18:00" },
            { day_of_week: "SAT", start_local_time: "08:00", end_local_time: "18:00" },
            { day_of_week: "SUN", start_local_time: "08:00", end_local_time: "18:00" },
          ],
        },
      },
    };

    const response = await client.locationsApi.updateLocation(LOCATION_ID, body);

    return res.status(200).json({
      success: true,
      message: "Business hours updated",
      location: response.result.location,
    });
  } catch (error) {
    console.error("Error updating business hours:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to update business hours.",
    });
  }
}
