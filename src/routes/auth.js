const express = require("express");
const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const router = express.Router();

const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ---------------------
// REGISTER
// ---------------------
router.post("/register", async (req, res) => {
  try {
    const hashed = await bcrypt.hash(req.body.password, 10);

    const email = req.body.email.toLowerCase().trim();

    const verificationCode = Math.floor(
      100000 + Math.random() * 900000
    ).toString();

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const user = await User.create({
      name: req.body.name,
      email,
      password: hashed,
      role: "researcher",
      isVerified: false,
      verificationCode,
      verificationExpires: Date.now() + 1000 * 60 * 5,
    });

    // send email
    await transporter.sendMail({
      to: user.email,
      subject: "Your verification code",
      html: `<h3>Your OTP is: ${verificationCode}</h3>`,
    });

    return res.json({
      message: "User created. Check your email for OTP.",
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

// ---------------------
// VERIFY OTP
// ---------------------
router.post("/verify", async (req, res) => {
  try {
    const { email, code } = req.body;

    const normalizedEmail = email.toLowerCase().trim();

    const user = await User.findOne({ email: normalizedEmail });

    if (!user) return res.status(400).json({ message: "User not found" });

    if (user.isVerified)
      return res.json({ message: "Already verified" });

    if (user.verificationCode !== String(code).trim())
      return res.status(400).json({ message: "Invalid code" });

    if (user.verificationExpires < Date.now())
      return res.status(400).json({ message: "Code expired" });

    user.isVerified = true;
    user.verificationCode = undefined;
    user.verificationExpires = undefined;

    await user.save();

    return res.json({ message: "Email verified successfully" });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

// ---------------------
// LOGIN
// ---------------------
router.post("/login", async (req, res) => {
  try {
    const email = req.body.email.toLowerCase().trim();

    const user = await User.findOne({ email });

    if (!user) return res.status(400).send("User not found");

    if (!user.isVerified)
      return res.status(403).send("Please verify your email first");

    const match = await bcrypt.compare(req.body.password, user.password);
    if (!match) return res.status(400).send("Wrong password");

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.json({ token, user });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

module.exports = router;