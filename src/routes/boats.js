const express = require("express");
const Boat = require("../models/Boat");

const router = express.Router();

// Create boat
router.post("/", async (req, res) => {
  try {
    const boat = await Boat.create(req.body);
    res.json(boat);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all boats
router.get("/", async (req, res) => {
  try {
    const boats = await Boat.find();
    res.json(boats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update boat info
router.patch("/:id", async (req, res) => {
  try {
    const updated = await Boat.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;