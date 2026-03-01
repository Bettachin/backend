const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  // Mobile users (optional for admins)
  email: { type: String, unique: true, sparse: true },

  // Admin web users
  username: { type: String, unique: true, sparse: true },

  name: String,
  password: { type: String, required: true },

  role: {
    type: String,
    enum: ["main_admin", "sub_admin", "researcher"],
    default: "researcher",
  },

  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("User", UserSchema);