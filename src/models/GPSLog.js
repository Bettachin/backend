const mongoose = require("mongoose");

const GPSLogSchema = new mongoose.Schema(
  {
    boatId: { type: mongoose.Schema.Types.Mixed, required: true },

    raw: {
      lat: Number,
      lng: Number,
    },
    filtered: {
      lat: Number,
      lng: Number,
    },

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