import { createMockRes } from "../_utils/mockRes.js";
import { beforeEach, describe, expect, jest, test } from "@jest/globals";

const isValidMock = jest.fn(() => false);

jest.unstable_mockModule("mongoose", () => ({
  default: { Types: { ObjectId: { isValid: isValidMock } } },
}));

jest.unstable_mockModule("../../Src/models/Book.js", () => ({
  default: {},
}));

jest.unstable_mockModule("../../Src/models/Stock.js", () => ({
  default: {},
}));

jest.unstable_mockModule("../../Src/lib/stockValidation.js", () => ({
  getStockStatus: jest.fn(() => "in_stock"),
}));

const { getStockById } = await import("../../Src/controllers/stockController.js");

describe("stock management", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    isValidMock.mockReturnValue(false);
  });

  test("rejects invalid book id", async () => {
    const req = { params: { id: "bad-id" } };
    const res = createMockRes();

    await getStockById(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: "Invalid book id" });
  });
});
