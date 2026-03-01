const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // ✅ for x-www-form-urlencoded trackers
app.use("/api/users", require("./routes/users"));
app.use("/api/auth", require("./routes/auth"));
app.use("/api/reservations", require("./routes/reservationsCheck"));
app.use("/api/boats", require("./routes/boats"));
app.use("/api/reservations", require("./routes/reservations"));
app.use("/api/admin", require("./routes/adminAuth"));
app.use("/api/gps", require("./routes/gps"));
app.use("/api/device", require("./routes/device")); // ✅ ST-901L HTTP ingest route
app.use("/api/simulate", require("./routes/simulator"));
app.use("/api/admin", require("./routes/admin"));

module.exports = app;
