const express = require("express");
const auth = require("../middleware/auth");
const SOS = require("../models/SOS");

const router = express.Router();

// Admin list SOS alerts
router.get("/", auth, async (req, res) => {
  const isAdmin = ["main_admin", "sub_admin"].includes(req.user.role);
  if (!isAdmin) return res.status(403).json({ message: "Forbidden" });

  const list = await SOS.find()
    .populate("boatId", "name")
    .populate("userId", "name email")
    .sort({ createdAt: -1 });

  res.json(
    list.map((x) => ({
      _id: x._id,
      status: x.status,
      createdAt: x.createdAt,
      message: x.message,
      boat: x.boatId ? { id: x.boatId._id, name: x.boatId.name } : null,
      user: x.userId ? { id: x.userId._id, name: x.userId.name, email: x.userId.email } : null,
      raw: x.raw || null,
      filtered: x.filtered || null,
      resolvedAt: x.resolvedAt || null,
    }))
  );
});

// Admin resolve SOS
router.patch("/:id/resolve", auth, async (req, res) => {
  const isAdmin = ["main_admin", "sub_admin"].includes(req.user.role);
  if (!isAdmin) return res.status(403).json({ message: "Forbidden" });

  const updated = await SOS.findByIdAndUpdate(
    req.params.id,
    { status: "resolved", resolvedAt: new Date(), resolvedBy: req.user.id },
    { new: true }
  );

  if (!updated) return res.status(404).json({ message: "SOS not found" });

  res.json({ ok: true });
});

module.exports = router;