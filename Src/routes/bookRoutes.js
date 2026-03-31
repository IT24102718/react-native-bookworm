import express from "express";
import cloudinary from "../lib/cloudinary.js";
import Book from "../models/Book.js";
import e from "express";
import protectRoute from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/",protectRoute, async (req, res) => {
    try {
        const {title, caption,rating,images} = req.body;

        if(!title || !caption || !rating || !images){
            return res.status(400).json({message: "All fields are required"});
        }

        //upload images to cloudinary
        const uploadResponse = await cloudinary.uploader.upload(images);
        const imageUrl = uploadResponse.secure_url;


        //save book details to database

        const newBook = new Book({
            title,
            caption,
            rating,
            images: imageUrl,
            user: req.user._id,
            
        });

        await newBook.save();
        res.status(201).json({message: "Book created successfully", book: newBook});
    } catch (error) {
        console.error("Error creating book:", error);
        res.status(500).json({message: error.message});
    }
});


//pagination  => infinite scroll
router.get("/", protectRoute, async (req, res) => {
    //example call from react native - frontend
    //const response = await fetch("http://localhost:300/api/books?page=3&limit=5");
    try {
        const page=req.query.page || 1;
        const limit=req.query.limit || 5;
        const skip=(page-1)*limit;  


        const books = await Book.find()
        .sort({createdAt: -1}) // desending order
        .skip(skip)
        .limit(limit)
        .populate("user","username profileImage"); 

        const totalBooks = await Book.countDocuments();

        res.send({
            books,
            currentPage: page,
            totalBooks,
            totalPages: Math.ceil(totalBooks/limit),
        });

    } catch (error) {
        console.error("Error in get all books route", error);
        res.status(500).json({ message: "internal server error" });
    }
});

//get recommended books by the logged in user
router.get("/user",protectRoute, async (req, res) => {
    try {
        const userBooks = await Book.find({user: req.user._id}).sort({createdAt: -1});
        res.json(books);
    } catch (error) {
        console.error("Error fetching user books:", error.message);
        res.status(500).json({message: "Internal server error"});
    }
});


router.delete("/:id", protectRoute, async (req, res) => {
    try {
        const book = await Book.findById(req.params.id);
        if(!book){
            return res.status(404).json({message: "Book not found"});
        }

        //check if the user is the owner of the book
        if(book.user.toString() !== req.user._id.toString()){
            return res.status(401).json({message: "Unauthorizesd"});
        }

        //delete image from cloudinary as well
        if(book.image && book.image.includes("cloudinary")){
            try{
                const publicId = book.image.split("/").pop().split(".")[0];
                await cloudinary.uploader.destroy(publicId);
                
            } catch(deleteError){
                console.log("Error deleting image from cloudinary", deleteError);
            }
        }
        
        await book.deleteOne();

        res.json({message: "Book deleted successfully"});
    } catch (error) {
        console.error("Error deleting book:", error);
        res.status(500).json({message: "Internal server error"});
    }
});

export default router;  