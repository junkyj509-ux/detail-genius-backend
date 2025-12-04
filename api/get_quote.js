const PRICING = {
  // Interior Quick Clean (Interior Packages.pdf)
  interior_quick: {
    coupe: { price: 100, duration_hours: 2 },
    sedan: { price: 125, duration_hours: 2 }, // "Cars"
    car: { price: 125, duration_hours: 2 },
    large_suv: { price: 175, duration_hours: 2.5 },
    minivan: { price: 175, duration_hours: 2.5 },
    van: { price: 200, duration_hours: 2.5 },
  },

  // Interior Deep Clean (Interior Packages.pdf)
  interior_deep: {
    coupe: { price: 250, duration_hours: 4 },
    sedan: { price: 300, duration_hours: 4 },
    car: { price: 300, duration_hours: 4 },
    small_suv: { price: 325, duration_hours: 4 },
    truck: { price: 325, duration_hours: 4 },
    full_truck: { price: 325, duration_hours: 4 },
    large_suv: { price: 350, duration_hours: 4 },
    minivan: { price: 350, duration_hours: 4 },
    van: { price: 400, duration_hours: 4 },
  },

  // Presidential Full Detail (Full Detail Inside & Out.pdf)
  full_detail_presidential: {
    coupe: { price: 400, duration_hours: 6 },
    sedan: { price: 450, duration_hours: 7.5 }, // Sedan / Small Trucks
    car: { price: 450, duration_hours: 7.5 },
    truck: { price: 450, duration_hours: 7.5 }, // small trucks
    full_truck: { price: 525, duration_hours: 7 }, // Full size truck
    large_suv: { price: 600, duration_hours: 8.5 },
    minivan: { price: 600, duration_hours: 8.5 },
    van: { price: 680, duration_hours: 10 },
  },

  // Exterior: Basic Wash (same price for all sizes)
  exterior_basic_wash: {
    any: { price: 75, duration_hours: 1.5 },
  },

  // Exterior: Premium Wash & Protect (Exterior Packages.pdf)
  exterior_premium_wash: {
    coupe: { price: 125, duration_hours: 1.75 },
    sedan: { price: 150, duration_hours: 1.75 },
    car: { price: 150, duration_hours: 1.75 },
    small_suv: { price: 150, duration_hours: 2 },
    truck: { price: 175, duration_hours: 2.5 },
    full_truck: { price: 175, duration_hours: 2.5 },
    large_suv: { price: 175, duration_hours: 2.5 },
    minivan: { price: 175, duration_hours: 2.5 },
    van: { price: 175, duration_hours: 2.5 },
  },

  // Exterior: Scratch & Swirl Removal (Exterior Packages.pdf)
  exterior_scratch_swirl: {
    coupe: { price: 200, duration_hours: 3 },
    sedan: { price: 225, duration_hours: 3.25 },
    car: { price: 225, duration_hours: 3.25 },
    small_suv: { price: 250, duration_hours: 3.5 },
    truck: { price: 250, duration_hours: 3.5 },
    full_truck: { price: 325, duration_hours: 4.5 },
    large_suv: { price: 350, duration_hours: 4.5 },
    minivan: { price: 350, duration_hours: 4.5 },
    van: { price: 400, duration_hours: 5 },
  },

  // Ceramic Coatings (base sedan pricing)
  // Note: larger vehicles should be quoted as "starting at" with manual adjustment.
  ceramic_18_month: {
    base: { price: 350, duration_hours: 3 }, // sedan base
  },
  ceramic_5_year: {
    base: { price: 700, duration_hours: 8.5 },
  },
  ceramic_10_year: {
    base: { price: 950, duration_hours: 8.5 },
  },

  // Add-ons (Add Ons.pdf)
  add_ons: {
    engine_bay_light: { price: 75, duration_hours: 1 },
    engine_bay_premium: { price: 150, duration_hours: 2.5 },
    headlights: { price: 75, duration_hours: 1 },
  },
};

// Helper to look up price safely
function lookupPricing(service_category, vehicle_size) {
  const service = PRICING[service_category];
  if (!service) {
    return { found: false, reason: "Unknown service_category" };
  }

  // direct match
  if (service[vehicle_size]) {
    return { found: true, ...service[vehicle_size], approximate: false };
  }

  // for services that use "any"
  if (service.any) {
    return { found: true, ...service.any, approximate: true };
  }

  // coatings use "base"
  if (service.base) {
    return {
      found: true,
      ...service.base,
      approximate: true,
      note: "Price shown is for a 4-door sedan. Larger vehicles are typically higher and may need manual confirmation."
    };
  }

  return { found: false, reason: "No pricing for this vehicle_size" };
}

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ success: false, error: "Method not allowed. Use POST." });
    }

    const body = req.body || {};
    const {
      vehicle_size,          // e.g. "sedan", "small_suv", "full_truck", "van"
      service_category,      // e.g. "interior_quick", "interior_deep", "full_detail_presidential", "exterior_basic_wash", etc.
      add_ons = [],          // e.g. ["headlights", "engine_bay_light"]
      notes = "",            // free text from assistant about condition, pet hair, etc.
    } = body;

    if (!vehicle_size || !service_category) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: vehicle_size and service_category."
      });
    }

    const main = lookupPricing(service_category, vehicle_size);
    if (!main.found) {
      return res.status(400).json({
        success: false,
        error: `No pricing found for service_category='${service_category}' and vehicle_size='${vehicle_size}'.`,
      });
    }

    // Calculate add-on totals
    let addOnsDetail = [];
    let addOnsTotal = 0;
    let addOnsHours = 0;

    for (const key of add_ons) {
      const addon = PRICING.add_ons[key];
      if (addon) {
        addOnsDetail.push({
          key,
          price: addon.price,
          duration_hours: addon.duration_hours,
        });
        addOnsTotal += addon.price;
        addOnsHours += addon.duration_hours;
      }
    }

    const basePrice = main.price;
    const baseHours = main.duration_hours;

    const totalPrice = basePrice + addOnsTotal;
    const totalHours = baseHours + addOnsHours;

    return res.status(200).json({
      success: true,
      service_category,
      vehicle_size,
      base_price: basePrice,
      base_duration_hours: baseHours,
      add_ons: addOnsDetail,
      total_price: totalPrice,
      total_duration_hours: totalHours,
      approximate: !!main.approximate,
      notes: [
        ...(main.note ? [main.note] : []),
        "Additional charges may apply for extreme pet hair, heavy soil, or severe condition. Final pricing is always confirmed with the customer before starting."
      ],
      raw_notes_from_assistant: notes,
    });
  } catch (err) {
    console.error("Error in get_quote:", err);
    return res.status(500).json({
      success: false,
      error: err.message,
    });
  }
}
