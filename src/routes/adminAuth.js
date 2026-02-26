const express = require("express");
const jwt = require("jsonwebtoken");

const router = express.Router();

router.post("/login", (req, res) => {
  const { username, password } = req.body;

  if (!process.env.ADMIN_USERNAME || !process.env.ADMIN_PASSWORD || !process.env.ADMIN_JWT_SECRET) {
    return res.status(500).json({ message: "Admin auth not configured" });
  }

  const ok =
    String(username) === String(process.env.ADMIN_USERNAME) &&
    String(password) === String(process.env.ADMIN_PASSWORD);

  if (!ok) return res.status(401).json({ message: "Invalid admin credentials" });

  const token = jwt.sign(
    { role: "admin", username },
    process.env.ADMIN_JWT_SECRET,
    { expiresIn: "12h" }
  );

  return res.json({
    token,
    admin: { username, role: "admin" },
  });
});

module.exports = router;
