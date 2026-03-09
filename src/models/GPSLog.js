const mongoose = require("mongoose");

const GPSLogSchema = new mongoose.Schema(
  {
    boatId: { type: mongoose.Schema.Types.ObjectId, ref: "Boat", required: true },
    raw: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
    },
    filtered: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
    },
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model("GPSLog", GPSLogSchema);