const User = require('../models/User');
const Claim = require('../models/Claim');

const { getAirQualityData } = require('../services/aqiService');
const { getWeatherData } = require('../services/weatherService');
const { fetchTraffic } = require('../services/trafficService');

exports.reportClaim = async (req, res) => {
  try {
    const { userId, disruptionType, lat, lon, duration } = req.body;
    
    // Default duration to 1 if missing
    const claimDuration = duration ? Number(duration) : 1;
    
    if (!lat || !lon) {
       return res.status(400).json({ success: false, message: 'Location data (lat, lon) is required for verification.' });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // Fraud Check: No policy -> reject
    if (!user.policyActive) {
      const claim = new Claim({ userId, disruptionType, duration: claimDuration, status: 'Rejected', reason: 'No active policy' });
      await claim.save();
      return res.json({ success: true, claim });
    }



    let disruptionValid = false;
    let verificationReason = "Disruption could not be verified by live API sources.";

    // Active Verification Modules
    if (disruptionType === 'Rain') {
       const weather = await getWeatherData(lat, lon, claimDuration);
       if (weather.is_raining) {
          disruptionValid = true;
       } else {
          verificationReason = `No rainfall detected in your location during the past ${claimDuration} hour(s).`;
       }
    } else if (disruptionType === 'Pollution') {
       const aqi = await getAirQualityData(lat, lon, claimDuration);
       if (aqi.is_polluted) {
          disruptionValid = true;
       } else {
          verificationReason = `Air conditions were moderate/good in your zone during the past ${claimDuration} hour(s).`;
       }
    } else if (disruptionType === 'Traffic') {
       // Only allow traffic claims if TOMTOM_API_KEY is configured
       if (!process.env.TOMTOM_API_KEY || process.env.TOMTOM_API_KEY === 'your_tom_tom_api_key_here') {
          return res.status(500).json({ success: false, message: "Server misconfiguration: Traffic API key not set." });
       }
       // Traffic is verified instantaneously for the claimed duration per user specification
       const traffic = await fetchTraffic(lat, lon);
       if (traffic.ratio <= 0.5) {
          disruptionValid = true;
       } else {
          verificationReason = "Current traffic is classified as smooth or moderate in your sector.";
       }
    } else if (disruptionType === 'Crowd') {
       // Crowd: approved if policy is active (real-time image capture is handled separately)
       disruptionValid = true;
    }

    if (disruptionValid) {
      // Loss Calculation Module
      const predictedIncomePerHour = 120;
      const amount = predictedIncomePerHour * claimDuration;

      const claim = new Claim({ 
        userId, 
        disruptionType, 
        duration: claimDuration, 
        status: 'Approved', 
        amount, 
        reason: `Verified explicitly by AI/API over ${claimDuration} hour(s)` 
      });
      await claim.save();
      return res.json({ success: true, claim });
    } else {
      const claim = new Claim({ 
        userId, 
        disruptionType, 
        duration: claimDuration, 
        status: 'Rejected', 
        reason: verificationReason 
      });
      await claim.save();
      return res.json({ success: true, claim });
    }

  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getUserClaims = async (req, res) => {
  try {
    const claims = await Claim.find({ userId: req.params.userId }).sort({ createdAt: -1 });
    res.json({ success: true, claims });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
