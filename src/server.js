require("dotenv").config();
const app = require("./app");
const connectDB = require("./config/db");

async function start() {
  try {
    await connectDB();

    const PORT = Number(process.env.PORT || 5000);

    app.listen(PORT, "0.0.0.0", () => {
      console.log("HTTP API running on", PORT);
    });
  } catch (err) {
    console.error("Startup failed:", err);
    process.exit(1);
  }
}

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled Rejection:", reason);
});

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
});

start();