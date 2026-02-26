const express = require("express");
const GPSLog = require("../models/GPSLog");
const kalman = require("../utils/kalman");

// Map deviceId -> boatId (simple approach)
const deviceBoatMap = {
  // "ST901L-IMEI-HERE": "BOAT_OBJECT_ID_HERE"
};

const router = express.Router();

/**
 * ST-901L HTTP INGEST
 * Supports:
 *  - GET /api/device/gps?deviceId=...&lat=...&lng=...
 *  - GET /api/device/gps?id=...&lat=...&lon=...
 *  - POST /api/device/gps (body can be json or form-url-encoded)
 */
router.all("/gps", async (req, res) => {
  try {
    const q = req.method === "GET" ? req.query : req.body;

    // Accept common parameter variants
    const deviceId = q.deviceId || q.imei || q.id || q.device || q.unit;
    const lat = q.lat || q.latitude;
    const lng = q.lng || q.lon || q.longitude;

    if (!deviceId || lat == null || lng == null) {
      return res.status(400).send("missing deviceId/lat/lng");
    }

    const boatId = deviceBoatMap[String(deviceId)];
    if (!boatId) {
      // If you want, we can auto-register unknown devices here
      return res.status(400).send("unknown deviceId (not mapped to boat)");
    }

    const filtered = kalman(boatId, Number(lat), Number(lng));

    await GPSLog.create({
      boatId,
      rawLat: Number(lat),
      rawLng: Number(lng),
      filteredLat: filtered.lat,
      filteredLng: filtered.lng,
    });

    // Trackers usually expect a plain "OK"
    return res.status(200).send("OK");
  } catch (e) {
    return res.status(500).send("ERROR");
  }
});

module.exports = router;
