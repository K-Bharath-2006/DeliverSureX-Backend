const apiClient = require("../utils/apiClient");

const getRainStatus = (rainfall) => {
  if (rainfall === 0) return "No Rain";
  if (rainfall <= 2.5) return "Light Rain";
  if (rainfall <= 7.6) return "Moderate Rain";
  return "Heavy Rain";
};

const getWeatherCondition = (code) => {
  if (code === 0) return "Clear Sky ☀️";
  if ([1, 2, 3].includes(code)) return "Partly Cloudy ☁️";
  if ([45, 48].includes(code)) return "Fog 🌫";
  if ([51, 53, 55].includes(code)) return "Drizzle 🌦";
  if ([61, 63, 65].includes(code)) return "Rain 🌧";
  if ([71, 73, 75].includes(code)) return "Snow ❄️";
  if ([95, 96, 99].includes(code)) return "Thunderstorm ⛈";
  return "Unknown";
};

const getWeatherData = async (lat, lon, duration = 1) => {
  try {
    const url = "https://api.open-meteo.com/v1/forecast";

    const response = await apiClient.get(url, {
      params: {
        latitude: lat,
        longitude: lon,
        current_weather: true,
        hourly: "rain",
        timezone: "auto",
      },
    });

    const data = response.data;

    // ❌ Validate API response
    if (!data || !data.current_weather) {
      throw new Error("Invalid weather data received");
    }

    const current = data.current_weather;
    let rainfall = data.hourly?.rain?.[0] || 0; // fallback if hourly is empty
    let isRaining = rainfall > 0;

    // Check historical duration
    if (data.hourly && data.hourly.time && data.hourly.rain) {
        const currentTimeString = current.time;
        const currentIndex = data.hourly.time.indexOf(currentTimeString);
        
        if (currentIndex !== -1) {
            // Check past 'duration' hours
            const startIndex = Math.max(0, currentIndex - duration + 1);
            let maxRainfallInWindow = 0;
            
            for (let i = startIndex; i <= currentIndex; i++) {
                const hourlyRain = data.hourly.rain[i];
                if (hourlyRain > maxRainfallInWindow) {
                    maxRainfallInWindow = hourlyRain;
                }
            }
            
            rainfall = maxRainfallInWindow;
            isRaining = maxRainfallInWindow > 0;
        }
    }

    // 🌧 Rain logic
    const rainStatus = getRainStatus(rainfall);

    // 🌦 Weather condition
    const weatherCondition = getWeatherCondition(current.weathercode);

    // ✅ Final structured response
    return {
      location: {
        lat: data.latitude,
        lon: data.longitude,
      },
      temperature: current.temperature,
      windspeed: current.windspeed,
      rainfall_mm: rainfall,
      rain_status: rainStatus,
      is_raining: isRaining,
      weather_code: current.weathercode,
      weather_condition: weatherCondition,
      timestamp: current.time,
    };

  } catch (error) {
    console.error("Weather Service Error:", error.message);
    throw new Error("Failed to fetch weather data");
  }
};

module.exports = {
  getWeatherData,
};
