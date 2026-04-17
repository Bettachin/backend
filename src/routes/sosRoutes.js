const express = require("express");
const SOS = require("../models/SOS");
const TripLog = require("../models/TripLog");
const Boat = require("../models/Boat");
const auth = require("../middleware/auth");

const router = express.Router();

// 🚨 POST /api/sos
router.post("/", auth, async (req, res) => {
  try {
    const userId = req.user.id;

    // 1. Find ACTIVE trip for user
    const activeTrip = await TripLog.findOne({
      userId,
      status: "active",
    });

    if (!activeTrip) {
      return res.status(403).json({
        message: "No active trip found. SOS not allowed.",
      });
    }

    // 2. Prevent duplicate SOS
    const existingSOS = await SOS.findOne({
      tripLogId: activeTrip._id,
      status: "active",
    });

    if (existingSOS) {
      return res.status(400).json({
        message: "SOS already active for this trip.",
      });
    }

    // 3. Validate boat exists
    const boat = await Boat.findById(activeTrip.boatId);

    if (!boat) {
      return res.status(404).json({
        message: "Boat not found.",
      });
    }

    // 4. IMPORTANT RULE YOU REQUESTED:
    // ONLY CHECK IF USER HAS ACTIVE TRIP
    // (we do NOT use lat/lng)

    const sos = await SOS.create({
      userId,
      boatId: activeTrip.boatId,
      tripLogId: activeTrip._id,
      status: "active",
    });

    return res.json({
      message: "SOS sent successfully",
      sos,
    });
  } catch (err) {
    console.error("SOS error:", err);
    res.status(500).json({
      message: "Server error while sending SOS",
    });
  }
});

module.exports = router;