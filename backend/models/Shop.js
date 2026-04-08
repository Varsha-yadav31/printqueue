const mongoose = require("mongoose");

const shopSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  block: { type: String, required: true },
  adminId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model("Shop", shopSchema);
