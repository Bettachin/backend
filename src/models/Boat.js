const mongoose = require("mongoose");

const BoatSchema = new mongoose.Schema({
  name: String,
  assignedArea: String,
  status: String
});

module.exports = mongoose.model("Boat", BoatSchema);
