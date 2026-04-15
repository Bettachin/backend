// approve / reject
router.patch("/:id", auth, async (req, res) => {
  try {
    if (!isAdminRole(req.user.role)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const { status, rejectNote } = req.body;

    if (!["pending", "approved", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    // Prepare update object for approved status
    const update = {
      status,
      rejectNote: status === "rejected" ? (rejectNote || "") : "",
    };

    // If status is approved, check if it's time to transition to active
    if (status === "approved") {
      const reservation = await Reservation.findById(req.params.id);

      if (!reservation) {
        return res.status(404).json({ message: "Reservation not found" });
      }

      // Check if the current time is after the reservation start time
      const currentTime = new Date();
      const reservationStartTime = new Date(`${reservation.date} ${reservation.startTime}`);
      
      // If the reservation's start time has passed, set the status to 'active'
      if (currentTime >= reservationStartTime) {
        update.status = "active";
      }
    }

    // Update the reservation status
    const updated = await Reservation.findByIdAndUpdate(
      req.params.id,
      update,
      { new: true }
    ).populate("boatId", "name");

    if (!updated) {
      return res.status(404).json({ message: "Reservation not found" });
    }

    res.json({
      _id: updated._id,
      date: updated.date || "",
      startTime: updated.startTime || "",
      endTime: updated.endTime || "",
      passengers: typeof updated.passengers === "number" ? updated.passengers : 0,
      status: updated.status || "pending",
      rejectNote: updated.rejectNote || "",
      boat: updated.boatId
        ? {
            id: updated.boatId._id || null,
            name: updated.boatId.name || "Unknown Boat",
          }
        : null,
      createdAt: updated.createdAt || null,
    });
  } catch (e) {
    console.error("[RESERVATIONS/update] failed:", e);
    res.status(500).json({ message: "Failed to update reservation", error: e.message });
  }
});