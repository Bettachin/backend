const express = require("express");
const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");

const router = express.Router();

// ---------------------
// MAILER
// ---------------------
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
    if (!req.body?.email || !req.body?.password) {
      return res.status(400).json({ message: "Missing fields" });
    }

    const email = req.body.email.toLowerCase().trim();

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const hashed = await bcrypt.hash(req.body.password, 10);

    const verificationCode = Math.floor(
      100000 + Math.random() * 900000
    ).toString();

    const user = await User.create({
      name: req.body.name || "",
      email,
      password: hashed,
      role: "researcher",
      isVerified: false,
      verificationCode,
      verificationExpires: Date.now() + 1000 * 60 * 5, // 5 mins
    });

    // ---------------------
    // EMAIL (safe)
    // ---------------------
    try {
      if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        await transporter.sendMail({
          to: user.email,
          subject: "Your verification code",
          html: `<h3>Your OTP is: ${verificationCode}</h3>`,
        });
      } else {
        console.log("Email not configured, skipping email send");
      }
    } catch (emailErr) {
      console.log("Email send failed:", emailErr.message);
    }

    return res.json({
      message: "User created. Check your email for OTP.",
    });
  } catch (err) {
    console.error("REGISTER ERROR:", err);
    return res.status(500).json({ message: err.message });
  }
});

// ---------------------
// VERIFY OTP
// ---------------------
router.post("/verify", async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({ message: "Missing fields" });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    if (user.isVerified) {
      return res.json({ message: "Already verified" });
    }

    if (user.verificationCode !== String(code).trim()) {
      return res.status(400).json({ message: "Invalid code" });
    }

    if (user.verificationExpires < Date.now()) {
      return res.status(400).json({ message: "Code expired" });
    }

    user.isVerified = true;
    user.verificationCode = undefined;
    user.verificationExpires = undefined;

    await user.save();

    return res.json({ message: "Email verified successfully" });
  } catch (err) {
    console.error("VERIFY ERROR:", err);
    return res.status(500).json({ message: err.message });
  }
});

// ---------------------
// LOGIN
// ---------------------
router.post("/login", async (req, res) => {
  try {
    if (!req.body?.email || !req.body?.password) {
      return res.status(400).json({ message: "Missing fields" });
    }

    const email = req.body.email.toLowerCase().trim();

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    if (!user.isVerified) {
      return res.status(403).json({ message: "Please verify your email first" });
    }

    const match = await bcrypt.compare(req.body.password, user.password);

    if (!match) {
      return res.status(400).json({ message: "Wrong password" });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // remove sensitive data before sending
    const { password, verificationCode, verificationExpires, ...safeUser } =
      user.toObject();

    return res.json({
      token,
      user: safeUser,
    });
  } catch (err) {
    console.error("LOGIN ERROR:", err);
    return res.status(500).json({ message: err.message });
  }
});

module.exports = router;