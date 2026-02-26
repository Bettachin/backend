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
      rawLat: Number(lat),
      rawLng: Number(lng),
      filteredLat: filtered.lat,
      filteredLng: filtered.lng,
    });

    res.json({ message: "GPS received", log });
  } catch (e) {
    res.status(500).json({ message: "GPS receive failed", error: e.message });
  }
});

/**
 * Mobile app reads latest filtered GPS
 * GET /api/gps/latest?boatId=xxxx
 */
router.get("/latest", async (req, res) => {
  try {
    const { boatId } = req.query;
    const query = boatId ? { boatId } : {};

    const latest = await GPSLog.findOne(query).sort({ createdAt: -1 });
    if (!latest) return res.status(404).json({ message: "No GPS logs yet" });

    let boatName = "Unknown";
    let status = "On Trip";

    if (boatId) {
      const boat = await Boat.findById(boatId);
      if (boat) boatName = boat.name;
    }

    res.json({
      lat: latest.filteredLat,
      lng: latest.filteredLng,
      boatId: latest.boatId,
      boatName,
      status,
      timestamp: latest.createdAt,
    });
  } catch (e) {
    res.status(500).json({ message: "GPS latest failed", error: e.message });
  }
});

module.exports = router;
