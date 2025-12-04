/**
 * SMART UPSALE ENGINE
 * Detail Genius, Wenatchee
 * Returns upgrade suggestions based on service, vehicle, notes, and customer goals.
 */

const ADD_ONS = {
  engine_bay_light: { label: "Engine Bay Cleaning (Light)", price: 75, time: 1 },
  engine_bay_premium: { label: "Premium Engine Bay Cleaning", price: 150, time: 2.5 },
  headlights: { label: "Headlight Restoration", price: 75, time: 1 },
};

// ceramic coatings info
const COATINGS = {
  ceramic_18_month: {
    label: "18-Month Ceramic Coating",
    price: 350,
    time: 3,
    benefit: "Ideal for improved shine, easier washing, and short-term protection.",
  },
  ceramic_5_year: {
    label: "5-Year Ceramic Coating",
    price: 700,
    time: 8.5,
    benefit: "Great for long-term durability, gloss, and strong protection.",
  },
  ceramic_10_year: {
    label: "Graphene 10-Year Coating",
    price: 950,
    time: 8.5,
    benefit: "Maximum gloss, top-tier durability, and premium resale value.",
  },
};

// helper: adds an upgrade if not already selected
function addUpgrade(list, key, reason) {
  if (!list.some(u => u.key === key)) {
    const item = ADD_ONS[key] || COATINGS[key];
    if (item) {
      list.push({
        key,
        label: item.label,
        price: item.price,
        duration_hours: item.time,
        reason,
      });
    }
  }
}

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({
        success: false,
        error: "Use POST.",
      });
    }

    const body = req.body || {};
    const {
      vehicle_size,
      service_category,
      notes = "",
    } = body;

    let upsells = [];

    // Normalize notes for text matching
    const n = notes.toLowerCase();

    // 🔥 VEHICLE-BASED UPSALES
    if (["truck", "full_truck", "large_suv"].includes(vehicle_size)) {
      addUpgrade(upsells, "engine_bay_light", "Trucks & larger vehicles often benefit from a refreshed engine bay for a cleaner look and better resale.");
    }

    // 🔥 SERVICE-BASED UPSALES
    if (service_category.includes("exterior")) {
      addUpgrade(upsells, "headlights", "Headlight restoration pairs well with exterior services and significantly improves nighttime visibility.");
    }

    if (service_category.includes("exterior") || service_category.includes("full_detail")) {
      addUpgrade(upsells, "engine_bay_light", "Engine bay cleaning completes the exterior look and enhances overall presentation.");
    }

    if (service_category.includes("full_detail_presidential")) {
      addUpgrade(upsells, "headlights", "Pairs perfectly with a premium full detail for a like-new look.");
    }

    // 🔥 CONDITION-BASED (text AI triggers)
    if (n.includes("smell") || n.includes("odor") || n.includes("cigarette")) {
      addUpgrade(upsells, "engine_bay_premium", "Full deodorization often requires deeper cleaning; Premium engine bay and interior sanitation pair well for odor issues.");
    }

    if (n.includes("pet") || n.includes("hair") || n.includes("dog")) {
      // note: pet hair is usually a fee, not an upsell, but assistant will handle that part
      addUpgrade(upsells, "engine_bay_light", "Pet-friendly vehicles often benefit from a fresh, clean engine bay as part of the overall restoration.");
    }

    if (n.includes("cloudy") || n.includes("foggy") || n.includes("dim")) {
      addUpgrade(upsells, "headlights", "Cloudy headlights reduce resale value and nighttime safety. Restoration makes a huge difference.");
    }

    // 🔥 CERAMIC COATING LOGIC (smart upgrades)
    if (service_category.includes("exterior") || service_category.includes("full_detail")) {
      addUpgrade(upsells, "ceramic_18_month", "Ideal if you want longer-lasting protection than wax or sealant.");
      addUpgrade(upsells, "ceramic_5_year", "Great upgrade if you want a deeper shine and multi-year durability.");
      addUpgrade(upsells, "ceramic_10_year", "Maximum gloss & protection – top choice for black vehicles or luxury models.");
    }

    // If user mentions coating but selected low-level wash
    if (n.includes("coating") || n.includes("ceramic")) {
      addUpgrade(upsells, "ceramic_5_year", "Excellent choice for long-term shine and protection.");
    }

    // 🔥 UPSALE CLEANING RULE: never overload them
    // Max 4 upsells at a time — keep it smart, not spammy
    upsells = upsells.slice(0, 4);

    return res.status(200).json({
      success: true,
      service_category,
      vehicle_size,
      recommended_upgrades: upsells,
    });

  } catch (err) {
    console.error("Error in get_upgrades:", err);
    return res.status(500).json({
      success: false,
      error: err.message,
    });
  }
}
