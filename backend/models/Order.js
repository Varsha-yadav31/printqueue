const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  shopId: { type: String, required: true },
  fileName: { type: String, required: true },
  fileUrl: { type: String, required: true },
  pages: { type: Number, required: true },
  copies: { type: Number, default: 1 },
  color: { type: String, enum: ["bw", "color"], default: "bw" },
  orientation: { type: String, enum: ["portrait", "landscape"], default: "portrait" },
  pageRange: { type: String, default: "all" },
  slot: { type: String, required: true },
  status: {
    type: String,
    enum: ["queue", "printing", "ready", "completed", "rejected"],
    default: "queue",
  },
  paymentStatus: { type: String, enum: ["pending", "paid", "failed"], default: "pending" },
  paymentId: { type: String, default: null },
  price: { type: Number, required: true },
  workerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
}, { timestamps: true });

module.exports = mongoose.model("Order", orderSchema);
