export default async function handler(req, res) {
  try {
    const { location_city, date_time } = req.body;

    if (!location_city || !date_time) {
      return res.status(400).json({ 
        success: false, 
        error: "Missing required fields: location_city or date_time" 
      });
    }

    // Convert city to a format WeatherAPI uses
    const query = encodeURIComponent(location_city);

    // Format date as YYYY-MM-DD
    const date = date_time.split("T")[0];

    const url = `https://api.weatherapi.com/v1/forecast.json?key=${process.env.WEATHER_API_KEY}&q=${query}&dt=${date}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.error) {
      return res.status(500).json({
        success: false,
        error: data.error.message
      });
    }

    // Extract forecast data
    const forecastDay = data.forecast.forecastday[0];

    // Hour-by-hour conditions
    const serviceHour = new Date(date_time).getHours();
    const hourData = forecastDay.hour.find(h => h.time.includes(`${serviceHour}:`));

    // Evaluate conditions
    const conditions = {
      temp_f: hourData.temp_f,
      chance_of_rain: hourData.chance_of_rain,
      chance_of_snow: hourData.chance_of_snow,
      wind_mph: hourData.wind_mph,
      condition_text: hourData.condition.text
    };

    let safe = true;
    let reason = "Weather conditions acceptable.";

    if (hourData.chance_of_rain > 40) {
      safe = false;
      reason = "Rain expected during the service window.";
    }

    if (hourData.chance_of_snow > 20) {
      safe = false;
      reason = "Snow expected during the service window.";
    }

    if (hourData.temp_f <= 34) {
      safe = false;
      reason = "Temperature too cold for mobile exterior work.";
    }

    if (hourData.temp_f >= 95) {
      safe = false;
      reason = "Temperatures too hot for safe exterior work.";
    }

    if (hourData.wind_mph >= 18) {
      safe = false;
      reason = "Winds too strong for polishing or coatings outdoors.";
    }

    return res.status(200).json({
      success: true,
      safe,
      reason,
      conditions
    });

  } catch (err) {
    console.error("Error in check_weather:", err);
    return res.status(500).json({ 
      success: false, 
      error: err.message 
    });
  }
}
