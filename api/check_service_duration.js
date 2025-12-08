/**
 * SERVICE DURATION ENGINE
 * Based on the same pricing/duration rules used in get_quote.js
 * This endpoint returns:
 * - total hours required
 * - drop-off suggestions
 * - shop vs mobile recommendations
 * - warnings for coatings, long jobs, or multi-add-on stacks
 */

const DURATIONS = {
  interior_quick: {
    coupe: 2,
    sedan: 2,
    car: 2,
    small_suv: 2.25,
    large_suv: 2.5,
    minivan: 2.5,
    van: 2.5,
  },

  interior_deep: {
    coupe: 4,
    sedan: 4,
    car: 4,
    small_suv: 4,
    truck: 4,
    full_truck: 4,
    large_suv: 4,
    minivan: 4,
    van: 4,
  },

  full_detail_presidential: {
    coupe: 6,
    sedan: 7.5,
    car: 7.5,
    truck: 7.5,
    full_truck: 7,
    large_suv: 8.5,
    minivan: 8.5,
    van: 10,
  },

  exterior_basic_wash: {
    any: 1.5,
  },

  exterior_premium_wash: {
    coupe: 1.75,
    sedan: 1.75,
    car: 1.75,
    small_suv: 2,
    truck: 2.5,
    full_truck: 2.5,
    large_suv: 2.5,
    minivan: 2.5,
    van: 2.5,
  },

  exterior_scratch_swirl: {
    coupe: 3,
    sedan: 3.25,
    car: 3.25,
    small_suv: 3.5,
    truck: 3.5,
    full_truck: 4.5,
    large_suv: 4.5,
    minivan: 4.5,
    van: 5,
  },

  ceramic_18_month: {
    base: 3,
  },
  ceramic_5_year: {
    base: 8.5,
  },
  ceramic_10_year: {
    base: 8.5,
  },

  add_ons: {
    headlights: 1,
    engine_bay_light: 1,
    engine_bay_premium: 2.5,
  }
};

function lookupDuration(service_category, vehicle_size) {
  const s = DURATIONS[service_category];
  if (!s) return { found: false };

  // direct match
  if (s[vehicle_size]) return { found: true, hours: s[vehicle_size] };

  // "any" for simple services
  if (s.any) return { found: true, hours: s.any };

  // "base" for coatings
  if (s.base) return { found: true, hours: s.base };

  return { found: false };
}

export default async function handler(req, res) {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    if (req.method !== "POST") {
      return res.status(405).json({
        success: false,
        error: "Use POST."
      });
    }

    const body = req.body || {};
    const {
      service_category,
      vehicle_size,
      add_ons = [],
      preferred_start = null, // optional: assistant may send date/time later
      is_mobile = true,       // assistant sets this
    } = body;

    if (!service_category || !vehicle_size) {
      return res.status(400).json({
        success: false,
        error: "Missing service_category or vehicle_size"
      });
    }

    let base = lookupDuration(service_category, vehicle_size);
    if (!base.found) {
      return res.status(400).json({
        success: false,
        error: "No duration rule found for this service & vehicle"
      });
    }

    let totalHours = base.hours;

    // Add-ons
    for (const key of add_ons) {
      if (DURATIONS.add_ons[key]) {
        totalHours += DURATIONS.add_ons[key];
      }
    }

    // Recommendations
    let recommendations = [];

    // 1) Long jobs
    if (totalHours >= 6) {
      recommendations.push(
        "This is a longer service. We recommend drop-off for best results and easier scheduling."
      );
    }

    if (totalHours >= 8) {
      recommendations.push(
        "This service may need most of the day. Drop-off strongly recommended."
      );
    }

    // 2) Coatings MUST be shop-based
    if (service_category.includes("ceramic")) {
      recommendations.push(
        "Ceramic coatings require controlled indoor conditions. Drop-off at the shop is required."
      );
    }

    // 3) Scratch & swirl — safer indoors if windy or cold
    if (service_category.includes("scratch_swirl")) {
      recommendations.push(
        "Scratch & swirl removal should be done in controlled conditions. Mobile OK only if weather allows."
      );
    }

    // 4) Exterior only — mobile OK unless weather is bad (assistant will check weather)
    if (is_mobile && service_category.includes("exterior")) {
      recommendations.push(
        "Mobile service OK depending on weather. The assistant will check weather automatically."
      );
    }

    return res.status(200).json({
      success: true,
      service_category,
      vehicle_size,
      add_ons,
      total_hours: totalHours,
      recommendations,
    });

  } catch (err) {
    console.error("Error in check_service_duration:", err);
    return res.status(500).json({
      success: false,
      error: err.message,
    });
  }
}
