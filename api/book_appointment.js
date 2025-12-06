import { Client, Environment } from "square";
import crypto from "crypto";

const LOCATION_ID = process.env.SQUARE_LOCATION_ID;
const TEAM_MEMBER_ID = process.env.SQUARE_TEAM_MEMBER_ID;
const SERVICE_VARIATION_ID = process.env.SQUARE_SERVICE_VARIATION_ID;

const client = new Client({
  accessToken: process.env.SQUARE_ACCESS_TOKEN,
  environment: process.env.SQUARE_ENVIRONMENT === 'production'
    ? Environment.Production
    : Environment.Sandbox,
});

// Format phone number to E.164 format for Square
function formatPhoneNumber(phone) {
  if (!phone) return undefined;
  // Remove all non-digits
  const digits = phone.replace(/\D/g, "");
  // If 10 digits, assume US and add +1
  if (digits.length === 10) {
    return `+1${digits}`;
  }
  // If 11 digits starting with 1, add +
  if (digits.length === 11 && digits.startsWith("1")) {
    return `+${digits}`;
  }
  // If already has country code, just add +
  if (digits.length > 10) {
    return `+${digits}`;
  }
  // Return undefined if invalid
  return undefined;
}

// Get or create customer
async function getOrCreateCustomer(name, email, phone) {
  // Split name into first and last
  const nameParts = name.trim().split(" ");
  const givenName = nameParts[0] || "Customer";
  const familyName = nameParts.slice(1).join(" ") || "";

  // Search for existing customer by email
  if (email) {
    try {
      const { result } = await client.customersApi.searchCustomers({
        query: {
          filter: {
            emailAddress: { exact: email }
          }
        }
      });
      if (result.customers?.length > 0) {
        return result.customers[0].id;
      }
    } catch (err) {
      console.log("Customer search failed, creating new:", err.message);
    }
  }

  // Format phone number
  const formattedPhone = formatPhoneNumber(phone);

  // Create new customer (try with phone, fallback without)
  try {
    const { result } = await client.customersApi.createCustomer({
      idempotencyKey: crypto.randomUUID(),
      givenName,
      familyName,
      emailAddress: email || undefined,
      phoneNumber: formattedPhone
    });
    return result.customer.id;
  } catch (err) {
    // If phone number is invalid, try without it
    if (err.errors?.some(e => e.code === "INVALID_PHONE_NUMBER")) {
      console.log("Invalid phone number, creating customer without phone");
      const { result } = await client.customersApi.createCustomer({
        idempotencyKey: crypto.randomUUID(),
        givenName,
        familyName,
        emailAddress: email || undefined
      });
      return result.customer.id;
    }
    throw err;
  }
}

// Get service variation version
async function getServiceVariationVersion() {
  const { result } = await client.catalogApi.retrieveCatalogObject(SERVICE_VARIATION_ID);
  return result.object?.version;
}

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

    // Get customer ID (create if needed)
    const customerId = await getOrCreateCustomer(customer_name, email, phone);

    // Get service variation version
    const serviceVariationVersion = await getServiceVariationVersion();

    // Create booking
    const { result } = await client.bookingsApi.createBooking({
      idempotencyKey: crypto.randomUUID(),
      booking: {
        locationId: LOCATION_ID,
        customerId: customerId,
        startAt: new Date(start_time).toISOString(),
        customerNote: notes || "",
        sellerNote: `Service: ${service_name} | Duration: ${duration_hours} hours`,
        appointmentSegments: [
          {
            durationMinutes: duration_hours * 60,
            serviceVariationId: SERVICE_VARIATION_ID,
            serviceVariationVersion: serviceVariationVersion,
            teamMemberId: TEAM_MEMBER_ID
          }
        ]
      }
    });
	
	// Convert BigInt values to strings for JSON serialization
const bookingData = JSON.parse(
JSON.stringify(result.booking, (_, v) => typeof v === 'bigint' ? v.toString() : v)
);

    return res.status(200).json({
      success: true,
      message: "Appointment created successfully.",
      booking: bookingData
    });

  } catch (err) {
    console.error("Error in book_appointment:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
}
