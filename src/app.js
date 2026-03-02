const express = require("express");
const cors = require("cors");
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/users", require("./routes/users"));
app.use("/api/auth", require("./routes/auth"));

app.use("/api/boats", require("./routes/boats"));
app.use("/api/reservations", require("./routes/reservations"));

app.use("/api/admin", require("./routes/adminAuth"));
app.use("/api/admin", require("./routes/admin"));
app.use("/api/admin/users", require("./routes/adminUsers"));
app.use("/api/admin/boats", require("./routes/adminBoats"));

app.use("/api/gps", require("./routes/gps"));
app.use("/api/device", require("./routes/device"));
app.use("/api/simulate", require("./routes/simulator"));
app.use("/api/sos", require("./routes/sos"));
app.use("/api/admin/sos", require("./routes/adminSOS"));

module.exports = app;