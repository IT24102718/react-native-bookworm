
import jwt from "jsonwebtoken";
import User from "../models/User.js";

// const response = await fetch(`http://localhost:3000/api/recommendations`, {
//   method: "POST",
//   body: JSON.stringify({
//     title,
//     caption
//   }),
//   headers: { Authorization: `Bearer ${token}` },
// });

const protectRoute = async (req, res, next) => {
  try {
    // get token
    const authHeader = req.header("Authorization");
    if (!authHeader) {
      return res.status(401).json({ message: "No authentication token, access denied" });
    }

    const token = authHeader.replace("Bearer ", "");
    if (!token) return res.status(401).json({ message: "No authentication token, access denied" });

    // verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // find user
    const user = await User.findById(decoded.userId).select("-password");
    if (!user) return res.status(401).json({ message: "Token is not valid" });

    if (user.isActive === false) {
      return res.status(403).json({ message: "Account is deactivated" });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("Authentication error:", error.message);
    res.status(401).json({ message: "Token is not valid" });
  }
};

export const protectAdmin = (req, res, next) => {
  protectRoute(req, res, () => {
    if (!req.user?.isAdmin) {
      return res.status(403).json({ message: "Admin access required" });
    }

    next();
  });
};

export default protectRoute;
