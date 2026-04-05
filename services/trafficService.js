const axios = require("axios");
const { TOMTOM_API_KEY } = require("../config/config");

const fetchTraffic = async (lat, lon) => {
  try {
    const url = `https://api.tomtom.com/traffic/services/4/flowSegmentData/absolute/10/json?point=${lat},${lon}&key=${TOMTOM_API_KEY}`;

    console.log("🚗 Calling Traffic API:", { lat, lon });

    const response = await axios.get(url);

    const data = response.data?.flowSegmentData;

    // ❗ SAFETY CHECK
    if (!data || !data.currentSpeed || !data.freeFlowSpeed) {
      console.warn("⚠ No valid traffic data");

      return {
        ratio: 0.5, // simulate moderate traffic
        traffic: "Estimated Traffic ⚠️"
      };
    }

    const currentSpeed = data.currentSpeed;
    const freeFlowSpeed = data.freeFlowSpeed;

    // ❗ Avoid division issues
    if (freeFlowSpeed === 0) {
      console.warn("⚠ Invalid freeFlowSpeed");

      return {
        ratio: 0.5,
        traffic: "Estimated Traffic ⚠️"
      };
    }

    const ratio = currentSpeed / freeFlowSpeed;

    let trafficStatus = "";

    if (ratio > 0.8) {
      trafficStatus = "Smooth Traffic ✅";
    } else if (ratio > 0.5) {
      trafficStatus = "Moderate Traffic ⚠️";
    } else {
      trafficStatus = "Heavy Traffic 🚦";
    }

    return {
      latitude: lat,
      longitude: lon,
      currentSpeed,
      freeFlowSpeed,
      confidence: data.confidence,
      roadClosure: data.roadClosure,
      traffic: trafficStatus,
      ratio: ratio
    };

  } catch (err) {
    console.error("❌ Traffic API Error:", err.response?.data || err.message);

    // 🔥 FALLBACK
    return {
      ratio: 0.5,
      traffic: "Fallback Traffic"
    };
  }
};

module.exports = { fetchTraffic };