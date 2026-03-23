const Reservation = require("../models/Reservation");
const TripLog = require("../models/TripLog");
const Boat = require("../models/Boat");

function toDateTime(dateStr, timeStr) {
  return new Date(`${dateStr}T${timeStr}:00`);
}

async function syncTrips() {
  const now = new Date();

  // 1) Start trips automatically from approved reservations
  const approvedReservations = await Reservation.find({ status: "approved" }).populate("boatId", "name");

  for (const reservation of approvedReservations) {
    const plannedStart = toDateTime(reservation.date, reservation.startTime);

    if (now >= plannedStart) {
      // avoid duplicate trip creation
      const existingTrip = await TripLog.findOne({ reservationId: reservation._id });
      if (existingTrip) continue;

      await TripLog.create({
        reservationId: reservation._id,
        userId: reservation.userId,
        boatId: reservation.boatId._id,
        boatName: reservation.boatId.name,
        date: reservation.date,
        plannedStartTime: reservation.startTime,
        plannedEndTime: reservation.endTime,
        passengers: reservation.passengers,
        startedAt: plannedStart,
        status: "active",
      });

      await Boat.findByIdAndUpdate(reservation.boatId._id, {
        status: "unavailable",
      });

      await Reservation.findByIdAndDelete(reservation._id);
    }
  }

  // 2) End trips automatically when end time passes
  const activeTrips = await TripLog.find({ status: "active" });

  for (const trip of activeTrips) {
    const plannedEnd = toDateTime(trip.date, trip.plannedEndTime);

    if (now >= plannedEnd) {
      trip.status = "completed";
      trip.endedAt = plannedEnd;
      await trip.save();

      await Boat.findByIdAndUpdate(trip.boatId, {
        status: "available",
      });
    }
  }
}

module.exports = syncTrips;