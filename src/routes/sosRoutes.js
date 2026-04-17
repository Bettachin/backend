import express from "express";
import SOS from "../models/SOS.js";
import TripLog from "../models/TripLog.js";
import Boat from "../models/Boat.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// 🚨 POST /sos
router.post("/", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    // 1. Find ACTIVE trip for this user
    const activeTrip = await TripLog.findOne({
      userId,
      status: "active",
    });

    if (!activeTrip) {
      return res.status(403).json({
        message: "No active trip found. SOS not allowed.",
      });
    }

    // 2. OPTIONAL: check if SOS already exists for this trip
    const existingSOS = await SOS.findOne({
      tripLogId: activeTrip._id,
      status: "active",
    });

    if (existingSOS) {
      return res.status(400).json({
        message: "SOS already active for this trip.",
      });
    }

    // 3. Validate boat (optional but good)
    const boat = await Boat.findById(activeTrip.boatId);

    if (!boat) {
      return res.status(404).json({
        message: "Boat not found.",
      });
    }

    // 4. Create SOS
    const sos = await SOS.create({
      userId,
      boatId: activeTrip.boatId,
      tripLogId: activeTrip._id,
    });

    // 🚨 FUTURE: emit socket here
    // io.emit("new_sos", sos);

    res.json({
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

export default router;