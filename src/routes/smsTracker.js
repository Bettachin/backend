const express = require("express");
const axios = require("axios");
const Boat = require("../models/Boat");
const auth = require("../middleware/auth");

const router = express.Router();

/**
 * POST /api/sms-tracker/request-location
 * body: { boatId }
 */
router.post("/request-location", auth, async (req, res) => {
  try {
    const { boatId } = req.body;
    if (!boatId) {
      return res.status(400).json({ message: "boatId is required" });
    }

    const boat = await Boat.findById(boatId);
    if (!boat) {
      return res.status(404).json({ message: "Boat not found" });
    }

    if (!boat.simNumber) {
      return res.status(400).json({ message: "Boat has no simNumber configured" });
    }

    // Example SMS gateway API call
    await axios.post(
      `${process.env.SMS_GATEWAY_BASE_URL}/send`,
      {
        to: boat.simNumber,
        message: "WHERE#"
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.SMS_GATEWAY_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    res.json({ ok: true, message: `WHERE# sent to ${boat.name}` });
  } catch (e) {
    console.error("[SMS/request-location] failed:", e?.response?.data || e.message);
    res.status(500).json({ message: "Failed to send WHERE#", error: e.message });
  }
});

module.exports = router;