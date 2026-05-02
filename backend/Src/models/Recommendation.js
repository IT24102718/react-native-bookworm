import mongoose from "mongoose"; 

const recommendationSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    caption: {
        type: String,
        required: true,
    },
    image: {
        type: String,
        required: true,
    },
    rating: {
        type: Number,
        required: true,
        min :1,
        max: 5,
    },
    averageRating: {
        type: Number,
        default: 0,
    },
    totalReviews: {
        type: Number,
        default: 0,
    },
    user:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
}, { timestamps: true });

const Recommendation = mongoose.model("Recommendation", recommendationSchema);

export default Recommendation;