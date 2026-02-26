const express = require("express");
const axios = require("axios");

const router = express.Router();

let lat = 16.388;
let lng = 119.897;

router.get("/send", async (req, res) => {
  lat += (Math.random() - 0.5) * 0.001;
  lng += (Math.random() - 0.5) * 0.001;

  await axios.post("http://localhost:5000/api/gps/receive", {
    boatId: "demoBoat",
    lat,
    lng
  });

  res.json({ lat, lng });
});

module.exports = router;
