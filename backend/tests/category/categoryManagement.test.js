import { createMockRes } from "../_utils/mockRes.js";
import { describe, expect, jest, test } from "@jest/globals";

jest.unstable_mockModule("mongoose", () => ({
  default: { Types: { ObjectId: { isValid: jest.fn(() => true) } } },
}));
jest.unstable_mockModule("../../Src/models/Category.js", () => ({ default: {} }));
jest.unstable_mockModule("../../Src/models/Book.js", () => ({ default: {} }));

const { createCategory } = await import("../../Src/controllers/categoryController.js");

describe("category management", () => {
  test("allows only admins to create category", async () => {
    const req = { user: { isAdmin: false }, body: { name: "Fiction" } };
    const res = createMockRes();

    await createCategory(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ message: "Admin access required" });
  });
});
