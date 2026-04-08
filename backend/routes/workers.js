const router = require("express").Router();
const User = require("../models/User");
const { auth, adminOnly } = require("../middleware/auth");

// POST /api/workers  — admin creates a worker
router.post("/", auth, adminOnly, async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ message: "All fields required" });

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: "Email already in use" });

    const worker = await User.create({
      name, email, password,
      role: "worker",
      shopId: req.user.shopId,
    });
    res.status(201).json({ id: worker._id, name: worker.name, email: worker.email, shopId: worker.shopId });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/workers  — get workers for admin's shop
router.get("/", auth, adminOnly, async (req, res) => {
  try {
    const workers = await User.find({ role: "worker", shopId: req.user.shopId }, "-password");
    res.json(workers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
