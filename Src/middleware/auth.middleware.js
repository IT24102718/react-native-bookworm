import jwt from "jsonwebtoken";
import User from "../models/User.js";

const protectRoute = async (req, res, next) => {
    try {
        //get token from header
        const token = req.headers("Authorization").replace("Bearer ", "");

        if(!token){
            return res.status(401).json({message: "Unauthorized, no token provided"});
        }

        //verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        //get user from database
        const user = await User.findById(decoded.userId).select("-password");
        if(!user){
            return res.status(401).json({message: "User not found"});
        }

        req.user = user;
        next();

    }catch (error) {
        console.error("Error in protectRoute:", error);
        res.status(500).json({message: "Server error"});
    }

};

export default protectRoute;