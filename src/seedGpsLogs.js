require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("./config/db");
const Boat = require("./models/Boat");
const GPSLog = require("./models/GPSLog");

async function run() {
  await connectDB();

  const boats = await Boat.find({
    name: { $in: ["Kalayaan", "GEF", "Zoox", "Dorado"] }
  });

  if (boats.length < 4) {
    console.log("❌ Missing boats. Seed boats first.");
    process.exit(1);
  }

  const byName = Object.fromEntries(boats.map((b) => [b.name, b]));

  // optional: clear old demo logs
  await GPSLog.deleteMany({
    boatId: { $in: boats.map((b) => b._id) }
  });

  const docs = [
    // Kalayaan
    { boatId: byName["Kalayaan"]._id, raw: { lat: 16.38810, lng: 119.89740 }, filtered: { lat: 16.38810, lng: 119.89740 }, timestamp: new Date("2026-03-09T08:00:00.000Z") },
    { boatId: byName["Kalayaan"]._id, raw: { lat: 16.38832, lng: 119.89761 }, filtered: { lat: 16.38818, lng: 119.89747 }, timestamp: new Date("2026-03-09T08:00:05.000Z") },
    { boatId: byName["Kalayaan"]._id, raw: { lat: 16.38818, lng: 119.89795 }, filtered: { lat: 16.38818, lng: 119.89761 }, timestamp: new Date("2026-03-09T08:00:10.000Z") },
    { boatId: byName["Kalayaan"]._id, raw: { lat: 16.38855, lng: 119.89821 }, filtered: { lat: 16.38829, lng: 119.89779 }, timestamp: new Date("2026-03-09T08:00:15.000Z") },
    { boatId: byName["Kalayaan"]._id, raw: { lat: 16.38844, lng: 119.89846 }, filtered: { lat: 16.38834, lng: 119.89800 }, timestamp: new Date("2026-03-09T08:00:20.000Z") },

    // GEF
    { boatId: byName["GEF"]._id, raw: { lat: 16.38690, lng: 119.89580 }, filtered: { lat: 16.38690, lng: 119.89580 }, timestamp: new Date("2026-03-09T08:01:00.000Z") },
    { boatId: byName["GEF"]._id, raw: { lat: 16.38722, lng: 119.89605 }, filtered: { lat: 16.38702, lng: 119.89589 }, timestamp: new Date("2026-03-09T08:01:05.000Z") },
    { boatId: byName["GEF"]._id, raw: { lat: 16.38705, lng: 119.89642 }, filtered: { lat: 16.38703, lng: 119.89605 }, timestamp: new Date("2026-03-09T08:01:10.000Z") },
    { boatId: byName["GEF"]._id, raw: { lat: 16.38744, lng: 119.89660 }, filtered: { lat: 16.38715, lng: 119.89621 }, timestamp: new Date("2026-03-09T08:01:15.000Z") },
    { boatId: byName["GEF"]._id, raw: { lat: 16.38731, lng: 119.89690 }, filtered: { lat: 16.38720, lng: 119.89642 }, timestamp: new Date("2026-03-09T08:01:20.000Z") },

    // Zoox
    { boatId: byName["Zoox"]._id, raw: { lat: 16.39020, lng: 119.89920 }, filtered: { lat: 16.39020, lng: 119.89920 }, timestamp: new Date("2026-03-09T08:02:00.000Z") },
    { boatId: byName["Zoox"]._id, raw: { lat: 16.39045, lng: 119.89948 }, filtered: { lat: 16.39028, lng: 119.89929 }, timestamp: new Date("2026-03-09T08:02:05.000Z") },
    { boatId: byName["Zoox"]._id, raw: { lat: 16.39038, lng: 119.89979 }, filtered: { lat: 16.39031, lng: 119.89943 }, timestamp: new Date("2026-03-09T08:02:10.000Z") },
    { boatId: byName["Zoox"]._id, raw: { lat: 16.39070, lng: 119.90010 }, filtered: { lat: 16.39043, lng: 119.89963 }, timestamp: new Date("2026-03-09T08:02:15.000Z") },
    { boatId: byName["Zoox"]._id, raw: { lat: 16.39061, lng: 119.90035 }, filtered: { lat: 16.39048, lng: 119.89984 }, timestamp: new Date("2026-03-09T08:02:20.000Z") },

    // Dorado
    { boatId: byName["Dorado"]._id, raw: { lat: 16.38470, lng: 119.89460 }, filtered: { lat: 16.38470, lng: 119.89460 }, timestamp: new Date("2026-03-09T08:03:00.000Z") },
    { boatId: byName["Dorado"]._id, raw: { lat: 16.38496, lng: 119.89486 }, filtered: { lat: 16.38478, lng: 119.89469 }, timestamp: new Date("2026-03-09T08:03:05.000Z") },
    { boatId: byName["Dorado"]._id, raw: { lat: 16.38483, lng: 119.89515 }, filtered: { lat: 16.38480, lng: 119.89483 }, timestamp: new Date("2026-03-09T08:03:10.000Z") },
    { boatId: byName["Dorado"]._id, raw: { lat: 16.38515, lng: 119.89541 }, filtered: { lat: 16.38490, lng: 119.89500 }, timestamp: new Date("2026-03-09T08:03:15.000Z") },
    { boatId: byName["Dorado"]._id, raw: { lat: 16.38502, lng: 119.89567 }, filtered: { lat: 16.38494, lng: 119.89520 }, timestamp: new Date("2026-03-09T08:03:20.000Z") },
  ];

  await GPSLog.insertMany(docs);

  console.log(`✅ Inserted ${docs.length} GPS demo logs`);
  process.exit(0);
}

run().catch((e) => {
  console.error("❌ seedGpsLogs failed:", e);
  process.exit(1);
});