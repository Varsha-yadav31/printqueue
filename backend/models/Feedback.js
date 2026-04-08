const mongoose = require("mongoose");

const feedbackSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true },
  shopId: { type: String, required: true },
  rating: { type: Number, min: 1, max: 5, required: true },
  comment: { type: String, default: "" },
}, { timestamps: true });

module.exports = mongoose.model("Feedback", feedbackSchema);
