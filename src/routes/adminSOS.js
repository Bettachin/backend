const express = require("express");
const SOS = require("../models/SOS");
const auth = require("../middleware/auth");

const router = express.Router();

// 🔐 GET ALL ACTIVE SOS (ADMIN)
router.get("/", auth, async (req, res) => {
  try {
    const sosList = await SOS.find({ status: "active" })
      .populate("userId", "name email")
      .populate("boatId", "name")
      .populate("tripLogId")
      .sort({ createdAt: -1 });

    res.json(sosList);
  } catch (err) {
    console.error("ADMIN SOS ERROR:", err);
    res.status(500).json({ message: "Failed to fetch SOS" });
  }
});

module.exports = router;