const { calculateRiskAndPremium } = require('../services/premiumService');
const { getWeatherData } = require('../services/weatherService');
const { getAirQualityData } = require('../services/aqiService');
const { fetchTraffic } = require('../services/trafficService');

exports.calculatePremium = (req, res) => {
  try {
    const { rainfall, aqi, traffic } = req.body;

    if (rainfall === undefined || aqi === undefined || traffic === undefined) {
      return res.status(400).json({ success: false, message: "Missing environmental parameters (rainfall, aqi, traffic)" });
    }

    const premiumData = calculateRiskAndPremium({ rainfall, aqi, traffic });
    res.json(premiumData);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.calculateLivePremium = async (req, res) => {
  try {
    const { lat, lon } = req.body;

    if (!lat || !lon) {
      return res.status(400).json({ success: false, message: "Latitude and longitude are required." });
    }

    // Fetch real-time data from all 3 APIs in parallel
    const [weather, aqiData] = await Promise.all([
      getWeatherData(lat, lon, 1),
      getAirQualityData(lat, lon, 1),
    ]);

    // Extract the key indicators
    const rainfall = weather.rainfall_mm || 0;
    const aqi = aqiData.aqi || 0;

    // Traffic: TomTom is optional (requires API key). Fallback to 0 if not available.
    let trafficCongestion = 0;
    const hasTomTomKey = process.env.TOMTOM_API_KEY && process.env.TOMTOM_API_KEY !== 'aH6ogv9NI6pRGBO3aiXG0czKhccT50Ev';
    if (hasTomTomKey) {
      try {
        const trafficData = await fetchTraffic(lat, lon);
        // Convert ratio to congestion %, ratio=1 means free flow (0% congestion), ratio=0 means fully blocked (100%)
        trafficCongestion = Math.round((1 - trafficData.ratio) * 100);
      } catch (trafficErr) {
        console.warn("Traffic fetch failed, defaulting to 0:", trafficErr.message);
      }
    }

    const premiumData = calculateRiskAndPremium({ rainfall, aqi, traffic: trafficCongestion });

    res.json({
      ...premiumData,
      env: {
        rainfall_mm: rainfall,
        rain_status: weather.rain_status,
        weather_condition: weather.weather_condition,
        temperature: weather.temperature,
        aqi: aqi,
        aqi_status: aqiData.aqi_status,
        traffic_congestion: trafficCongestion,
      }
    });
  } catch (err) {
    console.error("Live Premium Error:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
};
