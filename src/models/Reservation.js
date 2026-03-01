const mongoose = require("mongoose");

const ReservationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    boatId: { type: mongoose.Schema.Types.ObjectId, ref: "Boat", required: true },

    date: { type: String, required: true },       // "YYYY-MM-DD"
    startTime: { type: String, required: true },  // "HH:mm" stored in 24h for consistency
    endTime: { type: String, required: true },

    passengers: { type: Number, required: true, min: 1, max: 4 },

    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Reservation", ReservationSchema);