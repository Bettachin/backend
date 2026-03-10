const express = require("express");
const cors = require("cors");

const app = express();

const allowedOrigins = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  // add your deployed frontend here later:
  // "https://your-admin-dashboard.vercel.app",
];

const corsOptions = {
  origin: function (origin, callback) {
    // allow requests without origin (Postman, mobile app, server-to-server)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
  methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));

// handle preflight requests explicitly
app.options(/.*/, cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// optional: request logger for debugging
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