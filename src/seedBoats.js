require("dotenv").config();
const connectDB = require("./config/db");
const Boat = require("./models/Boat");

async function seed() {
  await connectDB();

  const names = ["Kalayaan", "GEF", "Zoox", "Dorado"];

  for (const name of names) {
    await Boat.updateOne(
      { name },
      { $setOnInsert: { name, status: "available", maxPassengers: 4 } },
      { upsert: true }
    );
  }

  console.log("✅ Boats seeded:", names.join(", "));
  process.exit(0);
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});