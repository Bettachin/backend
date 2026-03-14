require("dotenv").config();
const connectDB = require("./config/db");
const Boat = require("./models/Boat");

async function seed() {
  await connectDB();

  const boats = [
    {
      name: "Kalayaan",
      deviceId: "111111111111111"
    },
    {
      name: "GEF",
      deviceId: "222222222222222"
    },
    {
      name: "Zoox",
      deviceId: "333333333333333"
    },
    {
      name: "Dorado",
      deviceId: "444444444444444"
    }
  ];

  for (const boat of boats) {
    await Boat.updateOne(
      { name: boat.name },
      {
        $setOnInsert: {
          name: boat.name,
          deviceId: boat.deviceId,
          status: "available",
          maxPassengers: 4
        }
      },
      { upsert: true }
    );
  }

  console.log("✅ Boats seeded successfully");
  process.exit(0);
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});