import { createMockRes } from "../_utils/mockRes.js";
import { beforeEach, describe, expect, jest, test } from "@jest/globals";

const isValidMock = jest.fn(() => true);
const findBookByIdMock = jest.fn();
const findReviewOneMock = jest.fn();
const recalculateMock = jest.fn();

jest.unstable_mockModule("mongoose", () => ({
  default: { Types: { ObjectId: { isValid: isValidMock } } },
}));

jest.unstable_mockModule("../../Src/models/Book.js", () => ({
  default: { findById: findBookByIdMock },
}));

jest.unstable_mockModule("../../Src/models/Review.js", () => ({
  default: { findOne: findReviewOneMock },
}));

jest.unstable_mockModule("../../Src/lib/reviewStats.js", () => ({
  recalculateBookRatingStats: recalculateMock,
}));

const { createReview } = await import("../../Src/controllers/reviewController.js");

describe("review management", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("rejects when rating is missing", async () => {
    const req = { body: { bookId: "book-1" }, user: { _id: "user-1" } };
    const res = createMockRes();

    await createReview(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: "Book and rating are required" });
  });

  test("rejects duplicate review from same user", async () => {
    findBookByIdMock.mockResolvedValue({ _id: "book-1" });
    findReviewOneMock.mockResolvedValue({ _id: "review-1" });
    const req = {
      body: { bookId: "book-1", rating: 5 },
      user: { _id: "user-1" },
    };
    const res = createMockRes();

    await createReview(req, res);

    expect(findReviewOneMock).toHaveBeenCalledWith({ userId: "user-1", bookId: "book-1" });
    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({ message: "You have already reviewed this book" });
  });
});
