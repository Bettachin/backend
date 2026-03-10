const express = require("express");
const cors = require("cors");

const app = express();

const allowedOrigins = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(null, true); // fastest fix for demo
  },
  credentials: true,
  methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, _res, next) => {
  console.log(`${req.method} ${req.originalUrl}`);
  next();
});

app.get("/health", (_req, res) => {
  res.status(200).json({ ok: true });
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