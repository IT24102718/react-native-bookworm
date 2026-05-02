import { createMockRes } from "../_utils/mockRes.js";
import { describe, expect, jest, test } from "@jest/globals";

jest.unstable_mockModule("../../Src/lib/cloudinary.js", () => ({
  default: { uploader: { upload: jest.fn(), destroy: jest.fn() } },
  isCloudinaryConfigured: true,
}));
jest.unstable_mockModule("mongoose", () => ({
  default: { Types: { ObjectId: { isValid: jest.fn(() => true) } } },
}));
jest.unstable_mockModule("../../Src/models/Book.js", () => ({ default: {} }));
jest.unstable_mockModule("../../Src/models/Category.js", () => ({ default: {} }));
jest.unstable_mockModule("../../Src/models/Stock.js", () => ({
  default: {},
}));
jest.unstable_mockModule("../../Src/lib/stockValidation.js", () => ({
  getStockStatus: jest.fn(() => "in_stock"),
}));

const { createBook } = await import("../../Src/controllers/bookController.js");

describe("book management", () => {
  test("rejects create request with missing fields", async () => {
    const req = {
      body: { title: "", author: "", description: "", image: "" },
      user: { _id: "u1", isAdmin: true },
    };
    const res = createMockRes();

    await createBook(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: "Please provide all fields" });
  });
});
