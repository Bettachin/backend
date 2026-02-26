router.post("/receive", async (req, res) => {

  // Some GPS devices send different field names
  const lat = parseFloat(req.body.lat || req.body.latitude);
  const lng = parseFloat(req.body.lng || req.body.longitude);
  const boatId = req.body.deviceId || req.body.boatId || "defaultBoat";

  if (!lat || !lng) {
    return res.status(400).json({ error: "Invalid GPS data" });
  }

  const filtered = kalman(lat, lng);

  await GPSLog.create({
    boatId,
    rawLat: lat,
    rawLng: lng,
    filteredLat: filtered.lat,
    filteredLng: filtered.lng
  });

  res.json({ success: true });
});
