require("dotenv").config();
const app = require("./app");
const connectDB = require("./config/db");
const { startH02Server } = require("./tcp/h02Server");

connectDB();

const PORT = Number(process.env.PORT || 5000);

// HTTP API for web/mobile
app.listen(PORT, "0.0.0.0", () => {
  console.log("HTTP API running on", PORT);
});

// TCP tracker server for real GPS device
if (process.env.ENABLE_TCP_TRACKER === "true") {
  const TCP_PORT = Number(process.env.TRACKER_TCP_PORT || 9000);
  startH02Server({ host: "0.0.0.0", port: TCP_PORT });
  console.log("[TCP] H02 server started on", TCP_PORT);
} else {
  console.log("[TCP] Disabled");
}

// Better error visibility
process.on("unhandledRejection", (reason) => {
  console.error("Unhandled Rejection:", reason);
});

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
});