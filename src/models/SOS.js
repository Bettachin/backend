const mongoose = require("mongoose");

const SOSSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    boatId: { type: mongoose.Schema.Types.ObjectId, ref: "Boat", required: true },

    // ✅ ADD THIS (important for your system)
    tripLogId: { type: mongoose.Schema.Types.ObjectId, ref: "TripLog", required: true },

    message: { type: String, default: "" },

    raw: { lat: Number, lng: Number },
    filtered: { lat: Number, lng: Number },

    status: { type: String, enum: ["active", "resolved"], default: "active" },
    resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },
    resolvedAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model("SOS", SOSSchema);