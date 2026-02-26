const mongoose = require("mongoose");

const BoatSchema = new mongoose.Schema({
  name: { type: String, required: true },
  capacity: { type: Number, default: 6 },     // ✅ add
  assignedArea: { type: String, default: "" } // ✅ add (e.g., "Bolinao Bay")
});

module.exports = mongoose.model("Boat", BoatSchema);
