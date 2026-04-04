const calculateRiskAndPremium = ({ rainfall, aqi, traffic }) => {
  // Weather Risk: rainfall > 80 -> 0.8, rainfall > 40 -> 0.5, else -> 0.2
  let weatherRisk = 0.2;
  if (rainfall > 80) weatherRisk = 0.8;
  else if (rainfall > 40) weatherRisk = 0.5;

  // AQI Risk: aqi > 300 -> 0.7, aqi > 150 -> 0.4, else -> 0.2
  let aqiRisk = 0.2;
  if (aqi > 300) aqiRisk = 0.7;
  else if (aqi > 150) aqiRisk = 0.4;

  // Traffic Risk: traffic > 85 -> 0.7, traffic > 60 -> 0.4, else -> 0.2
  let trafficRisk = 0.2;
  if (traffic > 85) trafficRisk = 0.7;
  else if (traffic > 60) trafficRisk = 0.4;

  // Combine Risk Scores
  let riskScore = (weatherRisk * 0.4) + (aqiRisk * 0.3) + (trafficRisk * 0.3);
  
  // Format risk score to 2 decimal places max
  riskScore = Math.round(riskScore * 100) / 100;

  let premium = 30;
  let riskLevel = "Low";
  
  // Convert Risk Score -> Premium
  if (riskScore > 0.7) {
    premium = 50;
    riskLevel = "High";
  } else if (riskScore > 0.4) {
    premium = 40;
    riskLevel = "Medium";
  }

  let note = "Standard environmental risk";

  // Smart Adjustment
  if (riskScore < 0.3) {
    premium -= 2;
    note = "Safe zone - discounted coverage";
  }
  if (riskScore > 0.7) {
    note = "High risk zone - increased coverage";
  }

  return {
    riskScore,
    riskLevel,
    premium,
    coverage: "Standard",
    note
  };
};

module.exports = { calculateRiskAndPremium };
