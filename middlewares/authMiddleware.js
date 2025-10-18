import jwt from "jsonwebtoken";

export function authenticateUser(req, res, next) {
  try {
    const token = req.headers?.authorization?.split(" ")[1];
    if (!token) {
      return res.status(403).json({ message: "Auth token missing" });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.userId; // or decoded.sub (for clerk)
    next();
  } catch (e) {
    console.log(e.message);
    if (e.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token expired" });
    }
    if (e.name === "JsonWebTokenError") {
      return res.status(401).json({ message: "Invalid token" });
    }
    res.status(500).json({ message: e.message });
  }
}
