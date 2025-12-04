import { Client, Environment } from "square";

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
      service_name,
      start_time,
      duration_hours,
      notes
    } = req.body;

    if (!customer_name || !start_time || !duration_hours || !service_name) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: customer_name, service_name, start_time, duration_hours"
      });
    }

    const endTime = new Date(start_time);
    endTime.setHours(endTime.getHours() + duration_hours);

    // Create appointment
    const response = await client.bookingsApi.createBooking({
      booking: {
        locationId: process.env.SQUARE_LOCATION_ID,
        startAt: new Date(start_time).toISOString(),
        customerNote: notes || "",
        sellerNote: `Service: ${service_name} | Duration: ${duration_hours} hours`,
        appointmentSegments: [
          {
            durationMinutes: duration_hours * 60,
            serviceVariationId: "default-service", // Not required in sandbox
            teamMemberId: "default-team-member"
          }
        ],
        customerId: undefined, // Optional: can integrate Square Customers later
        headcount: 1
      }
    });

    return res.status(200).json({
      success: true,
      message: "Appointment created successfully.",
      booking: response.result.booking
    });

  } catch (err) {
    console.error("Error in book_appointment:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
}
