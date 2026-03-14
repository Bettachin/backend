const mongoose = require("mongoose");

const GPSPointSchema = new mongoose.Schema(
  {
    lat: Number,
    lng: Number,
  },
  { _id: false }
);

const GPSLogSchema = new mongoose.Schema(
  {
    boatId: { type: mongoose.Schema.Types.Mixed, required: true },

    raw: { type: GPSPointSchema, default: undefined },
    filtered: { type: GPSPointSchema, default: undefined },

    rawLat: Number,
    rawLng: Number,
    filteredLat: Number,
    filteredLng: Number,

    lat: Number,
    lng: Number,

    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model("GPSLog", GPSLogSchema);