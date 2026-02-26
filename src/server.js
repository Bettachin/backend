require("dotenv").config();
const app = require("./app");
const connectDB = require("./config/db");
const { startH02Server } = require("./tcp/h02Server");

connectDB();

const PORT = Number(process.env.PORT || 5000);

// HTTP API
app.listen(PORT, "0.0.0.0", () => console.log("HTTP API running on", PORT));

// TCP tracker (internal by default unless you enable TCP Proxy)
const TCP_PORT = Number(process.env.TRACKER_TCP_PORT || 9000);
startH02Server({ host: "0.0.0.0", port: TCP_PORT });