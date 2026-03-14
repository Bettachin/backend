const express = require("express");
const mongoose = require("mongoose");
const GPSLog = require("../models/GPSLog");
const Boat = require("../models/Boat");
const kalman = require("../utils/kalman");

const router = express.Router();

/**
 * Device/Simulator sends GPS here
 * POST /api/gps/receive
 */
router.post("/receive", async (req, res) => {
  try {
    const { boatId, lat, lng } = req.body;

    if (!boatId || lat == null || lng == null) {
      return res.status(400).json({ message: "boatId, lat, lng are required" });
    }

    const filtered = kalman(boatId, Number(lat), Number(lng));

    const log = await GPSLog.create({
      boatId,
      raw: {
        lat: Number(lat),
        lng: Number(lng),
      },
      filtered: {
        lat: filtered.lat,
        lng: filtered.lng,
      },
      timestamp: new Date(),
    });

    res.json({ message: "GPS received", log });
  } catch (e) {
    console.error("[GPS/receive] failed:", e);
    res.status(500).json({ message: "GPS receive failed", error: e.message });
  }
});

/**
 * Mobile/Admin reads latest GPS
 * GET /api/gps/latest?boatId=xxxx
 */
router.get("/latest", async (req, res) => {
  try {
    const { boatId } = req.query;

    console.log("[GPS/latest] incoming boatId:", boatId);

    if (!boatId) {
      return res.status(400).json({ message: "boatId is required" });
    }

    if (!mongoose.Types.ObjectId.isValid(String(boatId))) {
      return res.status(400).json({ message: "Invalid boatId format" });
    }

    const boat = await Boat.findById(boatId);
    if (!boat) {
      return res.status(404).json({ message: "Boat not found" });
    }

    console.log("[GPS/latest] boat:", boat.name, "deviceId:", boat.deviceId || "(none)");

    // First try new-format logs using real Boat._id
    let latest = await GPSLog.findOne({ boatId: boat._id }).sort({ timestamp: -1, createdAt: -1 });
    console.log("[GPS/latest] direct boatId match:", !!latest);

    // Fallback for old-format logs using boat.deviceId
    if (!latest && boat.deviceId) {
      latest = await GPSLog.findOne({ boatId: boat.deviceId }).sort({ timestamp: -1, createdAt: -1 });
      console.log("[GPS/latest] fallback deviceId match:", !!latest);
    }

    if (!latest) {
      return res.status(404).json({ message: "No GPS logs yet for this boat" });
    }

    const raw = latest.raw
      ? latest.raw
      : {
          lat: latest.rawLat ?? null,
          lng: latest.rawLng ?? null,
        };

    const filtered = latest.filtered
      ? latest.filtered
      : {
          lat: latest.filteredLat ?? null,
          lng: latest.filteredLng ?? null,
        };

    console.log("[GPS/latest] raw:", raw);
    console.log("[GPS/latest] filtered:", filtered);

    if (
      raw?.lat == null ||
      raw?.lng == null ||
      filtered?.lat == null ||
      filtered?.lng == null
    ) {
      return res.status(404).json({ message: "GPS log exists but has no coordinates" });
    }

    return res.json({
      boatId: String(boat._id),
      boatName: boat.name,
      status: "On Trip",
      raw,
      filtered,
      timestamp: latest.timestamp || latest.createdAt || null,
    });
  } catch (e) {
    console.error("[GPS/latest] failed:", e);
    return res.status(500).json({ message: "GPS latest failed", error: e.message });
  }
});

module.exports = router;