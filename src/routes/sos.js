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

/**
 * 📊 GET ALL SOS (ADMIN DASHBOARD)
 */
router.get("/", async (req, res) => {
  try {
    const sosList = await SOS.find()
      .populate("userId", "name email")
      .populate("boatId", "name")
      .sort({ createdAt: -1 });

    const formatted = sosList.map((s) => ({
      _id: s._id,
      status: s.status,
      message: s.message,
      createdAt: s.createdAt,

      user: s.userId
        ? {
            id: s.userId._id,
            name: s.userId.name,
            email: s.userId.email,
          }
        : null,

      boat: s.boatId
        ? {
            id: s.boatId._id,
            name: s.boatId.name,
          }
        : null,
    }));

    res.json(formatted);
  } catch (err) {
    console.error("GET SOS error:", err);
    res.status(500).json({ message: "Failed to fetch SOS" });
  }
});

/**
 * ✅ RESOLVE SOS
 */
router.patch("/:id/resolve", auth, async (req, res) => {
  try {
    const sos = await SOS.findById(req.params.id);

    if (!sos) {
      return res.status(404).json({ message: "SOS not found" });
    }

    sos.status = "resolved";
    sos.resolvedAt = new Date();
    sos.resolvedBy = req.user.id;

    await sos.save();

    return res.json({
      message: "SOS resolved successfully",
      sos,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to resolve SOS" });
  }
});

module.exports = router;