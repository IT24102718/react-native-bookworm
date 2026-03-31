import express from 'express';
import cors from 'cors';
import dotenv from "dotenv";

import authRoutes from "./routes/authRoutes.js";
import bookRoutes from "./routes/bookRoutes.js";

import { connectDB } from "./lib/db.js";


dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json()); // Middleware to parse JSON bodies
app.use(cors()); // Enable CORS for all routes

app.use("/api/auth",authRoutes);
app.use("/api/books",bookRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
    connectDB();
});