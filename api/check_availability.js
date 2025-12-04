import { Client, Environment } from "square";

const client = new Client({
  accessToken: process.env.SQUARE_ACCESS_TOKEN,
  environment: Environment.Sandbox,
});

const BUSINESS_HOURS = {
  start: 6,  // 6:00 AM
  end: 22,   // 10:00 PM official close
  flex_end: 24 // allow a job to spill 2 hours past closing
};

// Generate time slots in 30-minute increments
function generateSlots(date, durationHours) {
  const slots = [];
  const start = new Date(date);
  start.setHours(BUSINESS_HOURS.start, 0, 0, 0);

  const end = new Date(date);
  end.setHours(BUSINESS_HOURS.flex_end, 0, 0, 0);

  for (let time = new Date(start); time < end; time.setMinutes(time.getMinutes() + 30)) {
    const endTime = new Date(time);
    endTime.setMinutes(endTime.getMinutes() + durationHours * 60);

    if (endTime <= end) {
      slots.push({
        start: new Date(time),
        end: endTime
      });
    }
  }

  return slots;
}

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ success: false, error: "Use POST." });
    }

    const { date, duration_hours } = req.body;

    if (!date || !duration_hours) {
      return res.status(400).json({
        success: false,
        error: "Missing 'date' or 'duration_hours'."
      });
    }

    // Pull Square busy times
    const { result } = await client.bookingsApi.searchAvailability({
      query: {
        filter: {
          startAtRange: {
            startAt: `${date}T00:00:00Z`,
            endAt: `${date}T23:59:59Z`
          }
        }
      }
    });

    // Convert unavailable times into blocks
    const unavailable = (result.availabilities || [])
      .filter(a => !a.available)
      .map(a => ({
        start: new Date(a.startAt),
        end: new Date(a.endAt)
      }));

    // Generate all possible slots
    let slots = generateSlots(date, duration_hours);

    // Remove slots that overlap with unavailable times
    slots = slots.filter(slot => {
      return !unavailable.some(busy =>
        (slot.start >= busy.start && slot.start < busy.end) ||
        (slot.end > busy.start && slot.end <= busy.end)
      );
    });

    return res.status(200).json({
      success: true,
      date,
      duration_hours,
      available_slots: slots.map(s => ({
        start: s.start.toISOString(),
        end: s.end.toISOString()
      }))
    });

  } catch (err) {
    console.error("Error in check_availability:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
}
