import Recommendation from "../models/Recommendation.js";

const RECOMMENDATION_LIMIT = 10;
const MOBILE_PROJECTION = "title caption image averageRating totalReviews";

export const getTopRatedBooks = async (req, res) => {
  try {
    const books = await Recommendation.find()
      .sort({ averageRating: -1, totalReviews: -1 })
      .limit(RECOMMENDATION_LIMIT)
      .select(MOBILE_PROJECTION);

    res.json(books);
  } catch (error) {
    console.log("Error getting top rated books", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getMostReviewedBooks = async (req, res) => {
  try {
    const books = await Recommendation.find()
      .sort({ totalReviews: -1, averageRating: -1 })
      .limit(RECOMMENDATION_LIMIT)
      .select(MOBILE_PROJECTION);

    res.json(books);
  } catch (error) {
    console.log("Error getting most reviewed books", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getRecommendationsByCategory = async (req, res) => {
  try {
    const { category } = req.params;

    res.json({
      category,
      recommendations: [],
      message: "Category based recommendation is not available yet",
    });
  } catch (error) {
    console.log("Error getting category recommendations", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
