import { createMockRes } from "../_utils/mockRes.js";
import { describe, expect, jest, test } from "@jest/globals";

const isValidMock = jest.fn(() => false);

jest.unstable_mockModule("mongoose", () => ({
  default: { Types: { ObjectId: { isValid: isValidMock } } },
}));
jest.unstable_mockModule("../../Src/models/Cart.js", () => ({ default: {} }));
jest.unstable_mockModule("../../Src/models/Book.js", () => ({ default: {} }));
jest.unstable_mockModule("../../Src/models/Stock.js", () => ({ default: {} }));
jest.unstable_mockModule("../../Src/lib/stockValidation.js", () => ({
  validateBookStockForRequest: jest.fn(),
  getStockStatus: jest.fn(() => "in_stock"),
}));

const { addToCart } = await import("../../Src/controllers/cartController.js");

describe("cart management", () => {
  test("rejects invalid book id when adding to cart", async () => {
    const req = { body: { bookId: "x", quantity: 1 }, user: { _id: "u1" } };
    const res = createMockRes();

    await addToCart(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: "Valid bookId is required" });
  });
});
