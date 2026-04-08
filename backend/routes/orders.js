const router = require("express").Router();
const Order = require("../models/Order");
const { auth, adminOnly, workerOrAdmin } = require("../middleware/auth");

const MAX_SLOT_ORDERS = 20;
const BW_PRICE = 1;
const COLOR_PRICE = 4;
const PLATFORM_FEE = 3;

function calcPrice(pages, copies, color) {
  return pages * copies * (color === "color" ? COLOR_PRICE : BW_PRICE) + PLATFORM_FEE;
}

// POST /api/orders  — student places order
router.post("/", auth, async (req, res) => {
  try {
    const { shopId, fileName, fileUrl, pages, copies, color, orientation, pageRange, slot } = req.body;
    if (!shopId || !fileName || !fileUrl || !pages || !slot)
      return res.status(400).json({ message: "Missing required fields" });

    // Slot capacity check
    const slotCount = await Order.countDocuments({ shopId, slot, status: { $nin: ["completed", "rejected"] } });
    if (slotCount >= MAX_SLOT_ORDERS)
      return res.status(400).json({ message: "This slot is full. Please choose another slot." });

    const price = calcPrice(pages, copies || 1, color || "bw");
    const order = await Order.create({
      userId: req.user.id,
      shopId, fileName, fileUrl,
      pages, copies: copies || 1,
      color: color || "bw",
      orientation: orientation || "portrait",
      pageRange: pageRange || "all",
      slot, price,
      paymentStatus: "pending",
    });

    res.status(201).json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/orders/user  — student's own orders
router.get("/user", auth, async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/orders/admin  — all orders for admin's shop (FIFO)
router.get("/admin", auth, adminOnly, async (req, res) => {
  try {
    const orders = await Order.find({ shopId: req.user.shopId })
      .populate("userId", "name email")
      .sort({ createdAt: 1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/orders/worker  — orders assigned to worker
router.get("/worker", auth, async (req, res) => {
  try {
    const orders = await Order.find({ workerId: req.user.id })
      .populate("userId", "name email")
      .sort({ createdAt: 1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/orders/:id/status  — update order status
router.put("/:id/status", auth, workerOrAdmin, async (req, res) => {
  try {
    const { status, workerId } = req.body;
    const update = { status };
    if (workerId) update.workerId = workerId;

    const order = await Order.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!order) return res.status(404).json({ message: "Order not found" });
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/orders/:id/payment  — mark payment done
router.put("/:id/payment", auth, async (req, res) => {
  try {
    const { paymentId } = req.body;
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { paymentStatus: "paid", paymentId, status: "queue" },
      { new: true }
    );
    if (!order) return res.status(404).json({ message: "Order not found" });
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/orders/admin/stats  — dashboard stats
router.get("/admin/stats", auth, adminOnly, async (req, res) => {
  try {
    const shopId = req.user.shopId;
    const [total, active, completed, orders] = await Promise.all([
      Order.countDocuments({ shopId }),
      Order.countDocuments({ shopId, status: { $in: ["queue", "printing"] } }),
      Order.countDocuments({ shopId, status: "completed" }),
      Order.find({ shopId, paymentStatus: "paid" }, "price"),
    ]);
    const earnings = orders.reduce((sum, o) => sum + o.price, 0);
    res.json({ total, active, completed, earnings });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
