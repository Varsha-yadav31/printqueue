const router = require("express").Router();
const Feedback = require("../models/Feedback");
const Order = require("../models/Order");
const { auth, adminOnly } = require("../middleware/auth");

// POST /api/feedback
router.post("/", auth, async (req, res) => {
  try {
    const { orderId, rating, comment } = req.body;
    if (!orderId || !rating) return res.status(400).json({ message: "orderId and rating required" });

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });

    const fb = await Feedback.create({
      userId: req.user.id,
      orderId,
      shopId: order.shopId,
      rating,
      comment: comment || "",
    });
    res.status(201).json(fb);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/feedback  — admin sees shop feedback
router.get("/", auth, adminOnly, async (req, res) => {
  try {
    const feedback = await Feedback.find({ shopId: req.user.shopId })
      .populate("userId", "name")
      .populate("orderId", "fileName")
      .sort({ createdAt: -1 });

    const avg = feedback.length
      ? (feedback.reduce((s, f) => s + f.rating, 0) / feedback.length).toFixed(1)
      : 0;

    res.json({ feedback, averageRating: avg });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
