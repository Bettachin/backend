const express = require("express");
const Boat = require("../models/Boat");
const auth = require("../middleware/auth");

const router = express.Router();

// ✅ Get all boats (mobile + admin)
router.get("/", async (req, res) => {
  try {
    const boats = await Boat.find().sort({ name: 1 });
    res.json(boats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ✅ Admin-only: Create boat
router.post("/", auth, async (req, res) => {
  try {
    if (!["main_admin", "sub_admin"].includes(req.user.role)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const boat = await Boat.create({
      name: req.body.name,
      status: req.body.status || "available",
      maxPassengers: req.body.maxPassengers ?? 4
    });

    res.json(boat);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ✅ Admin-only: Update boat (including status)
router.patch("/:id", auth, async (req, res) => {
  try {
    if (!["main_admin", "sub_admin"].includes(req.user.role)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    // Only allow these fields to be updated
    const allowed = {};
    if (req.body.name !== undefined) allowed.name = req.body.name;
    if (req.body.status !== undefined) allowed.status = req.body.status;
    if (req.body.maxPassengers !== undefined) allowed.maxPassengers = req.body.maxPassengers;

    const updated = await Boat.findByIdAndUpdate(req.params.id, allowed, { new: true });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;