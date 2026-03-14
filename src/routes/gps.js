const express = require("express");
const GPSLog = require("../models/GPSLog");
const Boat = require("../models/Boat");
const kalman = require("../utils/kalman");

const router = express.Router();

/**
 * Device/Simulator sends GPS here
 * POST /api/gps/receive
 * body: { boatId, lat, lng }
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

    if (!boatId) {
      return res.status(400).json({ message: "boatId is required" });
    }

    // First: try new-format logs where GPSLog.boatId = actual Boat._id
    let latest = await GPSLog.findOne({ boatId }).sort({ timestamp: -1, createdAt: -1 });

    // If not found, try old-format logs where GPSLog.boatId = boat.deviceId
    let boat = await Boat.findById(boatId);
    if (!latest && boat?.deviceId) {
      latest = await GPSLog.findOne({ boatId: boat.deviceId }).sort({ timestamp: -1, createdAt: -1 });
    }

    if (!latest) {
      return res.status(404).json({ message: "No GPS logs yet for this boat" });
    }

    // normalize old/new schema
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

    res.json({
      boatId,
      boatName: boat?.name || "Unknown",
      status: "On Trip",
      raw,
      filtered,
      timestamp: latest.timestamp || latest.createdAt || null,
    });
  } catch (e) {
    res.status(500).json({ message: "GPS latest failed", error: e.message });
  }
});

module.exports = router;