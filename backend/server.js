const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

// ── Routes ──────────────────────────────────────────────────────────────────
app.use("/api/auth", require("./routes/auth"));
app.use("/api/shops", require("./routes/shops"));
app.use("/api/orders", require("./routes/orders"));
app.use("/api/workers", require("./routes/workers"));
app.use("/api/feedback", require("./routes/feedback"));

app.get("/", (req, res) => res.send("PrintQueue Backend 🚀"));

// ── Connect & Start ──────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("✅ MongoDB connected");
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error("❌ MongoDB connection failed:", err.message);
    console.error("👉 Check your MONGODB_URI in .env — make sure <db_password> is replaced with your real password");
    process.exit(1);
  });
