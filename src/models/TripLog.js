const mongoose = require("mongoose");

const TripLogSchema = new mongoose.Schema(
  {
    reservationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Reservation",
      default: null,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    boatId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Boat",
      required: true,
    },

    boatName: { type: String, required: true },

    date: { type: String, required: true },
    plannedStartTime: { type: String, required: true },
    plannedEndTime: { type: String, required: true },

    passengers: { type: Number, required: true },

    startedAt: { type: Date, required: true },
    endedAt: { type: Date, default: null },

    status: {
      type: String,
      enum: ["active", "completed"],
      default: "active",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("TripLog", TripLogSchema);