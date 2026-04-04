const axios = require("axios");
const { TOMTOM_API_KEY } = require("../config/config");

const fetchTraffic = async (lat, lon) => {
  const url = `https://api.tomtom.com/traffic/services/4/flowSegmentData/absolute/10/json?point=${lat},${lon}&key=${TOMTOM_API_KEY}`;

  const response = await axios.get(url);
  const data = response.data.flowSegmentData;

  const currentSpeed = data.currentSpeed;
  const freeFlowSpeed = data.freeFlowSpeed;

  // 🔥 Traffic Ratio Logic
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
};

module.exports = { fetchTraffic };
