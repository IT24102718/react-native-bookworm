import express from "express";
import cloudinary, { isCloudinaryConfigured } from "../lib/cloudinary.js";
import Recommendation from "../models/Recommendation.js";
import protectRoute from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/", protectRoute, async (req, res) => {
  try {
    const { title, caption, rating, image } = req.body;

    if (!image || !title || !caption || !rating) {
      return res.status(400).json({ message: "Please provide all fields" });
    }

    if (!isCloudinaryConfigured) {
      return res.status(500).json({ message: "Cloudinary is not configured on server" });
    }

    // upload the image to cloudinary
    const uploadResponse = await cloudinary.uploader.upload(image);
    const imageUrl = uploadResponse.secure_url;

    // save to the database
    const newRecommendation = new Recommendation({
      title,
      caption,
      rating,
      image: imageUrl,
      user: req.user._id,
    });

    await newRecommendation.save();

    res.status(201).json(newRecommendation);
  } catch (error) {
    console.log("Error creating book", error);
    res.status(500).json({ message: error.message });
  }
});

// pagination => infinite loading
router.get("/", protectRoute, async (req, res) => {
  // example call from react native - frontend
  // const response = await fetch("http://localhost:3000/api/recommendations?page=1&limit=5");
  try {
    const page = req.query.page || 1;
    const limit = req.query.limit || 2;
    const skip = (page - 1) * limit;

    const books = await Recommendation.find()
      .sort({ createdAt: -1 }) // desc
      .skip(skip)
      .limit(limit)
      .populate("user", "username profileImage");

    const totalBooks = await Recommendation.countDocuments();

    res.send({
      books,
      currentPage: page,
      totalBooks,
      totalPages: Math.ceil(totalBooks / limit),
    });
  } catch (error) {
    console.log("Error in get all books route", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// get recommended books by the logged in user
router.get("/user", protectRoute, async (req, res) => {
  try {
    const books = await Recommendation.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(books);
  } catch (error) {
    console.error("Get user books error:", error.message);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/:id", protectRoute, async (req, res) => {
  try {
    const book = await Recommendation.findById(req.params.id).populate("user", "username profileImage");
    if (!book) return res.status(404).json({ message: "Book not found" });

    res.json(book);
  } catch (error) {
    console.log("Error getting book", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.put("/:id", protectRoute, async (req, res) => {
  try {
    const { title, caption, rating, image } = req.body;

    const trimmedTitle = typeof title === "string" ? title.trim() : undefined;
    const trimmedCaption = typeof caption === "string" ? caption.trim() : undefined;

    if (trimmedTitle !== undefined && !trimmedTitle) {
      return res.status(400).json({ message: "Title cannot be empty" });
    }

    if (trimmedCaption !== undefined && !trimmedCaption) {
      return res.status(400).json({ message: "Caption cannot be empty" });
    }

    if (rating !== undefined && rating !== null) {
      const parsedRating = Number(rating);
      if (Number.isNaN(parsedRating) || parsedRating < 1 || parsedRating > 5) {
        return res.status(400).json({ message: "Rating must be between 1 and 5" });
      }
    }

    const book = await Recommendation.findById(req.params.id);
    if (!book) return res.status(404).json({ message: "Book not found" });

    if (book.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (trimmedTitle !== undefined) book.title = trimmedTitle;
    if (trimmedCaption !== undefined) book.caption = trimmedCaption;
    if (rating !== undefined && rating !== null) book.rating = Number(rating);

    if (image) {
      if (!isCloudinaryConfigured) {
        return res.status(500).json({ message: "Cloudinary is not configured on server" });
      }

      if (book.image && book.image.includes("cloudinary")) {
        try {
          const publicId = book.image.split("/").pop().split(".")[0];
          await cloudinary.uploader.destroy(publicId);
        } catch (deleteError) {
          console.log("Error deleting old image from cloudinary", deleteError);
        }
      }

      const uploadResponse = await cloudinary.uploader.upload(image);
      book.image = uploadResponse.secure_url;
    }

    await book.save();

    res.json(book);
  } catch (error) {
    console.log("Error updating book", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.delete("/:id", protectRoute, async (req, res) => {
  try {
    const book = await Recommendation.findById(req.params.id);
    if (!book) return res.status(404).json({ message: "Book not found" });

    // check if user is the creator of the book
    if (book.user.toString() !== req.user._id.toString())
      return res.status(401).json({ message: "Unauthorized" });

    // https://res.cloudinary.com/de1rm4uto/image/upload/v1741568358/qyup61vejflxxw8igvi0.png
    // delete image from cloduinary as well
    if (book.image && book.image.includes("cloudinary")) {
      try {
        const publicId = book.image.split("/").pop().split(".")[0];
        await cloudinary.uploader.destroy(publicId);
      } catch (deleteError) {
        console.log("Error deleting image from cloudinary", deleteError);
      }
    }

    await book.deleteOne();

    res.json({ message: "Book deleted successfully" });
  } catch (error) {
    console.log("Error deleting book", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;