const express = require("express");
const cors = require("cors");

const app = express();

// List of allowed origins including localhost, your production app, and an environment variable (WEB_ORIGIN)
const allowedOrigins = [
  "http://localhost:3000",                   // Localhost for local development
  "https://upbmladmindashboard.vercel.app",  // Production URL from Vercel
  "http://192.168.1.7:3000",                // Local network IP (if applicable)
  process.env.WEB_ORIGIN,                   // Production origin from environment variable
].filter(Boolean);

// CORS options
const corsOptions = {
  origin: (origin, callback) => {
    // If no origin (e.g., Postman, or React Native), allow the request
    if (!origin) return callback(null, true);

    // Check if the origin is allowed
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    // Reject if the origin is not in the allowed list
    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],  // Allowed HTTP methods
  allowedHeaders: ["Content-Type", "Authorization"],              // Allowed headers
  credentials: false,                                             // Whether to include credentials in requests
  optionsSuccessStatus: 204,                                       // Status code for successful OPTIONS requests
};

import sosRoutes from "./routes/sosRoutes.js";

app.use("/sos", sosRoutes);
// Apply CORS middleware
app.use(cors(corsOptions));

// Parse incoming requests with JSON payloads
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint (for debugging and testing)
app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

// Log all incoming requests
app.use((req, _res, next) => {
  console.log(`${req.method} ${req.originalUrl}`);
  next();
});

// Route Handlers
app.use("/api/users", require("./routes/users"));
app.use("/api/auth", require("./routes/auth"));
app.use("/api/boats", require("./routes/boats"));
app.use("/api/reservations", require("./routes/reservations"));

// Admin routes
app.use("/api/admin", require("./routes/adminAuth"));
app.use("/api/admin", require("./routes/admin"));
app.use("/api/admin/users", require("./routes/adminUsers"));
app.use("/api/admin/boats", require("./routes/adminBoats"));

// Additional routes
app.use("/api/gps", require("./routes/gps"));
app.use("/api/device", require("./routes/device"));
app.use("/api/simulate", require("./routes/simulator"));
app.use("/api/sos", require("./routes/sos"));
app.use("/api/admin/sos", require("./routes/adminSOS"));
app.use("/api/sms-tracker", require("./routes/smsTracker"));
app.use("/api/admin/trips", require("./routes/adminTrips"));

// Error handling middleware for unhandled errors
app.use((err, req, res, next) => {
  console.error("App error:", err);
  res.status(500).json({
    message: err.message || "Internal server error",
  });
});

module.exports = app;