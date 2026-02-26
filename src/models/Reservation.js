const mongoose = require("mongoose");

const ReservationSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  boatId: mongoose.Schema.Types.ObjectId,
  date: String,
  startTime: String,
  endTime: String,
  status: { type: String, default: "pending" }
});

module.exports = mongoose.model("Reservation", ReservationSchema);
