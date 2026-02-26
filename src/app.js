const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", require("./routes/auth"));
app.use("/api/boats", require("./routes/boats"));
app.use("/api/reservations", require("./routes/reservations"));
app.use("/api/gps", require("./routes/gps"));
app.use("/api/simulate", require("./routes/simulator"));

module.exports = app;
