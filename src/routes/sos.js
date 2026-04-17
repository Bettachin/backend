const express = require("express");
const auth = require("../middleware/auth");
const TripLog = require("../models/TripLog");
const SOS = require("../models/SOS");

const router = express.Router();

/**
 * 🚨 CREATE SOS
 */
router.post("/", auth, async (req, res) => {
  try {
    const userId = req.user.id;

    // 1. Find ACTIVE trip
    const activeTrip = await TripLog.findOne({
      userId,
      status: "active",
    });

    if (!activeTrip) {
      return res.status(403).json({
        message: "No active trip found. SOS not allowed.",
      });
    }

    // 2. Prevent duplicate SOS for same trip
    const existingSOS = await SOS.findOne({
      tripLogId: activeTrip._id,
      status: "active",
    });

    if (existingSOS) {
      return res.status(400).json({
        message: "SOS already active for this trip.",
      });
    }

    // 3. Create SOS
    const sos = await SOS.create({
      userId,
      boatId: activeTrip.boatId,
      tripLogId: activeTrip._id,
      message: req.body.message || "Emergency SOS triggered",
      status: "active",
    });

    console.log("🚨 SOS TRIGGERED:", sos._id);

    // 🔥 FUTURE: real-time alerts (admin dashboard)
    // io.emit("sos:new", sos);

    return res.json({
      message: "SOS sent successfully",
      sos,
    });
  } catch (err) {
    console.error("SOS error:", err);
    return res.status(500).json({
      message: "Failed to send SOS",
    });
  }
});

module.exports = router;