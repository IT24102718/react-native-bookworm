import { createMockRes } from "../_utils/mockRes.js";
import { describe, expect, jest, test } from "@jest/globals";

jest.unstable_mockModule("../../Src/models/Order.js", () => ({
  default: {},
}));
jest.unstable_mockModule("../../Src/models/Cart.js", () => ({
  default: {},
}));
jest.unstable_mockModule("../../Src/models/Stock.js", () => ({
  default: {},
}));
jest.unstable_mockModule("../../Src/models/Book.js", () => ({
  default: {},
}));
jest.unstable_mockModule("../../Src/lib/stockValidation.js", () => ({
  validateBookStockForRequest: jest.fn(),
}));

const { createOrder } = await import("../../Src/controllers/orderController.js");

describe("order management", () => {
  test("rejects order creation with empty items", async () => {
    const req = { body: { items: [] }, user: { _id: "user-1" } };
    const res = createMockRes();

    await createOrder(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "No items provided",
    });
  });
});
