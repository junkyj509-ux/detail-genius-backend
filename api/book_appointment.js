import { Client, Environment } from "square";

const LOCATION_ID = process.env.SQUARE_LOCATION_ID;
const TEAM_MEMBER_ID = process.env.SQUARE_TEAM_MEMBER_ID;
const SERVICE_VARIATION_ID = process.env.SQUARE_SERVICE_VARIATION_ID;

const client = new Client({
  accessToken: process.env.SQUARE_ACCESS_TOKEN,
  environment: Environment.Sandbox,
});

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ success: false, error: "Use POST." });
    }

    const {
      customer_name,
      phone,
      email,
      start_time,
      duration_hours,
      service_name,
      notes
    } = req.body;

    if (!customer_name || !start_time || !duration_hours || !service_name) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: customer_name, service_name, start_time, duration_hours"
      });
    }

    const end = new Date(start_time);
    end.setHours(end.getHours() + duration_hours);

    const { result } = await client.bookingsApi.createBooking({
      booking: {
        locationId: LOCATION_ID,
        startAt: new Date(start_time).toISOString(),
        customerNote: notes || "",
        sellerNote: `Service: ${service_name} | Duration: ${duration_hours} hours`,
        appointmentSegments: [
          {
            durationMinutes: duration_hours * 60,
            serviceVariationId: SERVICE_VARIATION_ID,
            teamMemberId: TEAM_MEMBER_ID
          }
        ],
        customerId: undefined, // Optional
        headcount: 1
      }
    });

    return res.status(200).json({
      success: true,
      message: "Appointment created successfully.",
      booking: result.booking
    });

  } catch (err) {
    console.error("Error in book_appointment:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
}
