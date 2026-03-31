import express from 'express';
import User from "../models/User.js";
import jwt from "jsonwebtoken";


const router = express.Router();

const genarateToken = (userId) => {
    return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "15d" });
}


router.post("/register", async(req, res) => {
try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({ message: "All fields are required" });
    }
    if (password.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters long" });
    }
    if(username.length < 3) {
        return res.status(400).json({ message: "Username must be at least 3 characters long" });
    }

    //check if user already exists
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
        return res.status(400).json({ message: "Email already in use" });
    }

    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
        return res.status(400).json({ message: "Username already in use" });
    }   

    //get random avatar
    const profileImage = `https://avatars.dicebear.com/api/avataaars/${username}.svg`;
    const user = new User({ 
        username, 
        email, 
        password,
        profileImage,           
    });
    await user.save();

    const token = genarateToken(user._id);

    res.status(201).json({
        token,
        user: {
            _id: user._id,
            username: user.username,
            email: user.email,
            profileImage: user.profileImage,
        }
    });
} catch (error) {
    console.error("Error in /register:", error);
    res.status(500).json({ message: "Server error" });

}});

router.post("/login", async(req, res) => {
    // Login logic here
    try{
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "All fields are required" });
        }

        //check if user exists
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        //check password
        const isPasswordCorrect = await user.matchPassword(password);
        if (!isPasswordCorrect) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        //generate token
        const token = genarateToken(user._id);

        res.status(200).json({
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                profileImage: user.profileImage,
            }
        });
    } catch (error) {
        console.error("Error in /login:", error);
        res.status(500).json({ message: "Server error" });

    }
});

export default router;