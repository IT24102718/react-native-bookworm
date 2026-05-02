import express from 'express';
import cors from 'cors';
import dotenv from "dotenv";
import job from "./lib/cron.js";

import authRoutes from "./routes/authRoutes.js";
import bookRoutes from "./routes/bookRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import recommendationCrudRoutes from "./routes/recommendationCrudRoutes.js";
import reviewRoutes from "./routes/reviewRoutes.js";
import recommendationRoutes from "./routes/recommendationRoutes.js";
import stockRoutes from "./routes/stockRoutes.js";
import cartRoutes from "./routes/cartRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import userRoutes from "./routes/userRoutes.js";

import { connectDB } from "./lib/db.js";


dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

job.start(); // Start the cron job

app.use(cors()); // Enable CORS for all routes
app.use(express.json({ limit: "10mb" })); // Allow base64 image payloads from mobile
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.get("/", (req, res) => {
  res.json({ message: "BookWorm backend is running" });
});

app.get("/api", (req, res) => {
  res.json({ message: "BookWorm API is running" });
});

app.use("/api/auth",authRoutes);
app.use("/api/books", bookRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/recommendations", recommendationRoutes);
app.use("/api/recommendations", recommendationCrudRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/stock", stockRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/users", userRoutes);

app.use((err, req, res, next) => {
  if (err?.type === "entity.too.large") {
    return res.status(413).json({ message: "Payload too large. Please upload a smaller image." });
  }

  next(err);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
    connectDB();
});