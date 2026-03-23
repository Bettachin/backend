const mongoose = require("mongoose");

const BoatSchema = new mongoose.Schema(
  {
    name: { type: String, unique: true, required: true },
    status: { type: String, enum: ["available", "unavailable"], default: "available" },
    maxPassengers: { type: Number, default: 4 },
    deviceId: { type: String, default: "" },
    simNumber: { type: String, default: "" } // tracker SIM number
  },
  { timestamps: true }
);

module.exports = mongoose.model("Boat", BoatSchema);