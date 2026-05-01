const express = require("express");
const router = express.Router();
const {
  createBook,
  getAllBooks,
  getBookById,
  updateBook,
  deleteBook,
} = require("../controllers/bookController");
const upload = require("../middleware/uploadMiddleware");

router.get("/", getAllBooks);
router.get("/:id", getBookById);
router.post("/", upload.single("coverImage"), createBook);
router.put("/:id", upload.single("coverImage"), updateBook);
router.delete("/:id", deleteBook);

module.exports = router;