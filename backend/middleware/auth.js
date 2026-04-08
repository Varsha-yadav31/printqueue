const jwt = require("jsonwebtoken");

function auth(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "No token provided" });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ message: "Invalid token" });
  }
}

function adminOnly(req, res, next) {
  if (req.user.role !== "admin") return res.status(403).json({ message: "Admin access required" });
  next();
}

function workerOrAdmin(req, res, next) {
  if (!["admin", "worker"].includes(req.user.role))
    return res.status(403).json({ message: "Worker or Admin access required" });
  next();
}

module.exports = { auth, adminOnly, workerOrAdmin };
