require("dotenv").config();
const app = require("./app");
const connectDB = require("./config/db");
const { startH02Server } = require("./tcp/h02Server");

connectDB();

const HTTP_PORT = process.env.PORT || 8080;
const TCP_PORT = process.env.TRACKER_TCP_PORT || 9000;

// HTTP API (Railway public port)
app.listen(HTTP_PORT, "0.0.0.0", () => {
  console.log("HTTP API running on", HTTP_PORT);
});

// TCP GPS tracker (internal port)
startH02Server({
  host: "0.0.0.0",
  port: TCP_PORT,
});