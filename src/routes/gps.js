router.get("/latest", async (req, res) => {
  try {
    const { boatId } = req.query;

    console.log("[GPS/latest] incoming boatId:", boatId);

    if (!boatId) {
      return res.status(400).json({ message: "boatId is required" });
    }

    const boat = await Boat.findById(boatId);
    if (!boat) {
      return res.status(404).json({ message: "Boat not found" });
    }

    console.log("[GPS/latest] boat:", boat.name, "deviceId:", boat.deviceId || "(none)");

    // Try all known possible boatId formats
    const boatIdCandidates = [String(boat._id)];
    if (boat.deviceId) boatIdCandidates.push(String(boat.deviceId));

    let latest = await GPSLog.findOne({
      boatId: { $in: boatIdCandidates },
    }).sort({ timestamp: -1, createdAt: -1, _id: -1 });

    console.log("[GPS/latest] match found:", !!latest);

    if (!latest) {
      return res.status(404).json({ message: "No GPS logs yet for this boat" });
    }

    // Normalize all possible GPS shapes
    const raw = latest.raw
      ? latest.raw
      : latest.rawLat != null || latest.rawLng != null
      ? {
          lat: latest.rawLat ?? null,
          lng: latest.rawLng ?? null,
        }
      : latest.lat != null || latest.lng != null
      ? {
          lat: latest.lat ?? null,
          lng: latest.lng ?? null,
        }
      : null;

    const filtered = latest.filtered
      ? latest.filtered
      : latest.filteredLat != null || latest.filteredLng != null
      ? {
          lat: latest.filteredLat ?? null,
          lng: latest.filteredLng ?? null,
        }
      : latest.lat != null || latest.lng != null
      ? {
          lat: latest.lat ?? null,
          lng: latest.lng ?? null,
        }
      : null;

    console.log("[GPS/latest] raw:", raw);
    console.log("[GPS/latest] filtered:", filtered);

    if (!raw?.lat || !raw?.lng) {
      return res.status(404).json({ message: "GPS log exists but has no coordinates" });
    }

    res.json({
      boatId: String(boat._id),
      boatName: boat.name,
      status: "On Trip",
      raw,
      filtered: filtered || raw,
      timestamp: latest.timestamp || latest.createdAt || latest._id?.getTimestamp?.() || null,
    });
  } catch (e) {
    console.error("[GPS/latest] failed:", e);
    res.status(500).json({ message: "GPS latest failed", error: e.message });
  }
});