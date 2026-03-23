const express = require("express");
const auth = require("../middleware/auth");
const Reservation = require("../models/Reservation");
const TripLog = require("../models/TripLog");
const Boat = require("../models/Boat");

const router = express.Router();

const isAdminRole = (role) => ["main_admin", "sub_admin", "admin", "subadmin"].includes(role);

// Start trip from approved reservation
router.post("/start/:reservationId", auth, async (req, res) => {
  try {
    if (!isAdminRole(req.user.role)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const reservation = await Reservation.findById(req.params.reservationId).populate("boatId", "name");
    if (!reservation) {
      return res.status(404).json({ message: "Reservation not found" });
    }

    if (reservation.status !== "approved") {
      return res.status(400).json({ message: "Only approved reservations can start a trip" });
    }

    const trip = await TripLog.create({
      reservationId: reservation._id,
      userId: reservation.userId,
      boatId: reservation.boatId._id,
      boatName: reservation.boatId.name,
      date: reservation.date,
      plannedStartTime: reservation.startTime,
      plannedEndTime: reservation.endTime,
      passengers: reservation.passengers,
      startedAt: new Date(),
      status: "active",
    });

    await Boat.findByIdAndUpdate(reservation.boatId._id, {
      status: "unavailable",
    });

    await Reservation.findByIdAndDelete(reservation._id);

    res.json({
      message: "Trip started successfully",
      trip,
    });
  } catch (e) {
    console.error("[TRIPS/start] failed:", e);
    res.status(500).json({ message: "Failed to start trip", error: e.message });
  }
});

// End active trip
router.patch("/end/:tripId", auth, async (req, res) => {
  try {
    if (!isAdminRole(req.user.role)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const trip = await TripLog.findById(req.params.tripId);
    if (!trip) {
      return res.status(404).json({ message: "Trip not found" });
    }

    if (trip.status !== "active") {
      return res.status(400).json({ message: "Trip is already completed" });
    }

    trip.status = "completed";
    trip.endedAt = new Date();
    await trip.save();

    await Boat.findByIdAndUpdate(trip.boatId, {
      status: "available",
    });

    res.json({
      message: "Trip ended successfully",
      trip,
    });
  } catch (e) {
    console.error("[TRIPS/end] failed:", e);
    res.status(500).json({ message: "Failed to end trip", error: e.message });
  }
});

// List trip logs
router.get("/", auth, async (req, res) => {
  try {
    if (!isAdminRole(req.user.role)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const trips = await TripLog.find().sort({ createdAt: -1 });

    res.json(trips);
  } catch (e) {
    console.error("[TRIPS/list] failed:", e);
    res.status(500).json({ message: "Failed to load trips", error: e.message });
  }
});

module.exports = router;