const router = require("express").Router();
const Shop = require("../models/Shop");

const DEFAULT_SHOPS = [
  { id: "b25", name: "Block 25 Basement – Tack Shop", block: "Block 25" },
  { id: "b26", name: "Block 26 Basement – Tack Shop", block: "Block 26" },
  { id: "b28", name: "Block 28 – Tack Shop", block: "Block 28" },
  { id: "b29", name: "Block 29 – Tack Shop", block: "Block 29" },
  { id: "b31", name: "Block 31 – Tack Shop", block: "Block 31" },
  { id: "b32", name: "Block 32 – Tack Shop", block: "Block 32" },
  { id: "b33", name: "Block 33 – Tack Shop", block: "Block 33" },
];

// Seed shops if not present
async function seedShops() {
  const count = await Shop.countDocuments();
  if (count === 0) await Shop.insertMany(DEFAULT_SHOPS);
}
seedShops();

// GET /api/shops
router.get("/", async (req, res) => {
  try {
    const shops = await Shop.find({ isActive: true });
    res.json(shops);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
