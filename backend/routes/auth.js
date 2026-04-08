const router = require("express").Router();
const jwt = require("jsonwebtoken");
const User = require("../models/User");

function signToken(user) {
  return jwt.sign(
    { id: user._id, role: user.role, shopId: user.shopId, name: user.name, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

// POST /api/auth/signup
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password, role, shopId } = req.body;
    if (!name || !email || !password) return res.status(400).json({ message: "All fields required" });

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: "Email already registered" });

    const user = await User.create({ name, email, password, role: role || "student", shopId: shopId || null });
    res.status(201).json({ token: signToken(user), user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password)))
      return res.status(401).json({ message: "Invalid email or password" });

    res.json({ token: signToken(user), user: { id: user._id, name: user.name, email: user.email, role: user.role, shopId: user.shopId } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
