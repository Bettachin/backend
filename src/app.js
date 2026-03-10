const express = require("express");
const cors = require("cors");

const app = express();

app.use(
  cors({
    origin: true,
    credentials: true,
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.options(/.*/, cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/health", (_req, res) => {
  res.status(200).json({ ok: true });
});

app.use((req, _res, next) => {
  console.log(`${req.method} ${req.originalUrl}`);
  next();
});

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