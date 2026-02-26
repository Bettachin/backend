const mongoose = require("mongoose");

const GPSLogSchema = new mongoose.Schema({
  boatId: mongoose.Schema.Types.ObjectId,
  rawLat: Number,
  rawLng: Number,
  filteredLat: Number,
  filteredLng: Number,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("GPSLog", GPSLogSchema);
