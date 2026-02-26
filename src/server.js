require("dotenv").config();
const app = require("./app");
const connectDB = require("./config/db");
const { startH02Server } = require("./tcp/h02Server");

connectDB();

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log("HTTP API running on", PORT));

// TCP Port for tracker
startH02Server({ port: Number(process.env.TRACKER_TCP_PORT || 9000) });