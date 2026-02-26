const mongoose = require("mongoose");

const ReservationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  boatId: { type: mongoose.Schema.Types.ObjectId, ref: "Boat", required: true },
  date: { type: String, required: true },        // "2026-02-10"
  startTime: { type: String, required: true },   // "08:00"
  endTime: { type: String, required: true },     // "16:00"
  passengers: { type: Number, default: 1 },
  status: { type: String, default: "pending" },  // pending/approved/rejected
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Reservation", ReservationSchema);
