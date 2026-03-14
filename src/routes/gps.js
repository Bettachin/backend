const express = require("express");
const mongoose = require("mongoose");
const GPSLog = require("../models/GPSLog");
const Boat = require("../models/Boat");
const kalman = require("../utils/kalman");

const router = express.Router();

/**
 * POST /api/gps/receive
 * body: { boatId, lat, lng }
 */
router.post("/receive", async (req, res) => {
  try {
    const { boatId, lat, lng } = req.body;

    if (!boatId || lat == null || lng == null) {
      return res.status(400).json({ message: "boatId, lat, lng are required" });
    }

    const filtered = kalman(String(boatId), Number(lat), Number(lng));

    const log = await GPSLog.create({
      boatId: String(boatId),
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

    const candidates = [String(boat._id)];
    if (boat.deviceId) candidates.push(String(boat.deviceId));

    const latest = await GPSLog.findOne({
      boatId: { $in: candidates },
      $or: [
        { "raw.lat": { $ne: null } },
        { rawLat: { $ne: null } },
        { lat: { $ne: null } }
      ]
    }).sort({ timestamp: -1, createdAt: -1, _id: -1 });

    console.log("[GPS/latest] match found:", !!latest);

    if (!latest) {
      return res.status(404).json({ message: "No GPS logs yet for this boat" });
    }

    const raw =
      latest.raw && latest.raw.lat != null && latest.raw.lng != null
        ? latest.raw
        : latest.rawLat != null || latest.rawLng != null
        ? {
            lat: latest.rawLat ?? null,
            lng: latest.rawLng ?? null,
          }
        : latest.lat != null || latest.lng != null
        ? {
            lat: latest.lat ?? null,
            lng: latest.lng ?? null,
          }
        : null;

    const filtered =
      latest.filtered && latest.filtered.lat != null && latest.filtered.lng != null
        ? latest.filtered
        : latest.filteredLat != null || latest.filteredLng != null
        ? {
            lat: latest.filteredLat ?? null,
            lng: latest.filteredLng ?? null,
          }
        : latest.lat != null || latest.lng != null
        ? {
            lat: latest.lat ?? null,
            lng: latest.lng ?? null,
          }
        : raw;

    console.log("[GPS/latest] raw:", raw);
    console.log("[GPS/latest] filtered:", filtered);

    if (!raw?.lat || !raw?.lng) {
      return res.status(404).json({ message: "GPS log exists but has no coordinates" });
    }

    res.json({
      boatId: String(boat._id),
      boatName: boat.name,
      status: "On Trip",
      raw,
      filtered,
      timestamp: latest.timestamp || latest.createdAt || null,
    });
  } catch (e) {
    console.error("[GPS/latest] failed:", e);
    res.status(500).json({ message: "GPS latest failed", error: e.message });
  }
});

module.exports = router;