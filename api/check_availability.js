import { Client, Environment } from "square";

// Load env vars
const LOCATION_ID = process.env.SQUARE_LOCATION_ID;
const TEAM_MEMBER_ID = process.env.SQUARE_TEAM_MEMBER_ID;
const SERVICE_VARIATION_ID = process.env.SQUARE_SERVICE_VARIATION_ID;

const client = new Client({
  accessToken: process.env.SQUARE_ACCESS_TOKEN,
  environment: Environment.Sandbox,
});

// Generate 30-minute time slots for the day based on business hours
function generateSlots(date, durationHours) {
  const slots = [];
  const start = new Date(date);
  start.setHours(6, 0, 0, 0); // Business open
  const end = new Date(date);
  end.setHours(22, 0, 0, 0); // Business close

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

    // Create datetime range for Square query
    const startAtMin = `${date}T00:00:00Z`;
    const startAtMax = `${date}T23:59:59Z`;

    // Ask Square for availability for the team member
    const { result } = await client.bookingsApi.searchAvailability({
      query: {
        filter: {
          startAtRange: {
            startAt: startAtMin,
            endAt: startAtMax
          },
          locationId: LOCATION_ID,
          segmentFilters: [
            {
              serviceVariationId: SERVICE_VARIATION_ID,
              teamMemberIdFilter: { any: [TEAM_MEMBER_ID] }
            }
          ]
        }
      }
    });

    const availableBlocks = result.availabilities || [];

    // Generate candidate slots
    const candidateSlots = generateSlots(date, duration_hours);

    // Filter out unavailable time blocks
    const finalSlots = candidateSlots.filter(slot => {
      return availableBlocks.some(block => {
        const blockStart = new Date(block.startAt);
        const blockEnd = new Date(block.endAt);
        return (
          slot.start >= blockStart &&
          slot.end <= blockEnd
        );
      });
    });

    return res.status(200).json({
      success: true,
      date,
      duration_hours,
      available_slots: finalSlots.map(s => ({
        start: s.start.toISOString(),
        end: s.end.toISOString()
      }))
    });

  } catch (err) {
    console.error("Error in check_availability:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
}
