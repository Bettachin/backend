const express = require("express");
const cors = require("cors");

const app = express();

const allowedOrigins = [
  "http://localhost:3000",
  "http://192.168.1.7:3000",
  process.env.WEB_ORIGIN,
].filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    // allow non-browser clients and tools like Postman / React Native
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: false,
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
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
// app.use("/api/admin", require("./routes/admin"));
app.use("/api/admin/users", require("./routes/adminUsers"));
app.use("/api/admin/boats", require("./routes/adminBoats"));

app.use("/api/gps", require("./routes/gps"));
app.use("/api/device", require("./routes/device"));
app.use("/api/simulate", require("./routes/simulator"));
app.use("/api/sos", require("./routes/sos"));
app.use("/api/admin/sos", require("./routes/adminSOS"));

app.use((err, req, res, next) => {
  console.error("App error:", err);
  res.status(500).json({
    message: err.message || "Internal server error",
  });
});
module.exports = app;