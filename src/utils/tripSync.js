const Reservation = require("../models/Reservation");
const TripLog = require("../models/TripLog");
const Boat = require("../models/Boat");

function toDateTime(dateStr, timeStr) {
  if (!dateStr || !timeStr) return null;

  const dt = new Date(`${dateStr}T${timeStr}:00`);
  if (Number.isNaN(dt.getTime())) return null;

  return dt;
}

async function syncTrips() {
  const now = new Date();

  // 1) Start trips automatically from approved reservations
  const approvedReservations = await Reservation.find({ status: "approved" }).populate("boatId", "name");

  for (const reservation of approvedReservations) {
    try {
      // skip broken reservation rows safely
      if (!reservation) continue;
      if (!reservation.boatId || !reservation.boatId._id) {
        console.warn("[TRIP SYNC] Skipping reservation with missing boat:", reservation._id);
        continue;
      }

      const plannedStart = toDateTime(reservation.date, reservation.startTime);
      if (!plannedStart) {
        console.warn("[TRIP SYNC] Skipping reservation with invalid start date/time:", reservation._id);
        continue;
      }

      if (now >= plannedStart) {
        const existingTrip = await TripLog.findOne({ reservationId: reservation._id });
        if (existingTrip) continue;

        await TripLog.create({
          reservationId: reservation._id,
          userId: reservation.userId,
          boatId: reservation.boatId._id,
          boatName: reservation.boatId.name || "Unknown Boat",
          date: reservation.date || "",
          plannedStartTime: reservation.startTime || "",
          plannedEndTime: reservation.endTime || "",
          passengers: typeof reservation.passengers === "number" ? reservation.passengers : 0,
          startedAt: plannedStart,
          status: "active",
        });

        await Boat.findByIdAndUpdate(reservation.boatId._id, {
          status: "unavailable",
        });

        await Reservation.findByIdAndDelete(reservation._id);
      }
    } catch (err) {
      console.error("[TRIP SYNC] Failed starting reservation:", reservation?._id, err);
    }
  }

  // 2) End trips automatically when end time passes
  const activeTrips = await TripLog.find({ status: "active" });

  for (const trip of activeTrips) {
    try {
      if (!trip) continue;

      const plannedEnd = toDateTime(trip.date, trip.plannedEndTime);
      if (!plannedEnd) {
        console.warn("[TRIP SYNC] Skipping trip with invalid end date/time:", trip._id);
        continue;
      }

      if (now >= plannedEnd) {
        trip.status = "completed";
        trip.endedAt = plannedEnd;
        await trip.save();

        if (trip.boatId) {
          await Boat.findByIdAndUpdate(trip.boatId, {
            status: "available",
          });
        }
      }
    } catch (err) {
      console.error("[TRIP SYNC] Failed ending trip:", trip?._id, err);
    }
  }
}

module.exports = syncTrips;