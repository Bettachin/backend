const express = require("express");
const Boat = require("../models/Boat");
const router = express.Router();

router.get("/", async (_req, res) => {
  const boats = await Boat.find().sort({ name: 1 });
  res.json(boats);
});

module.exports = router;