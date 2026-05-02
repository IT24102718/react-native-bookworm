import { createMockRes } from "../_utils/mockRes.js";
import { beforeEach, describe, expect, jest, test } from "@jest/globals";

const selectMock = jest.fn();
const limitMock = jest.fn(() => ({ select: selectMock }));
const sortMock = jest.fn(() => ({ limit: limitMock }));
const findMock = jest.fn(() => ({ sort: sortMock }));

jest.unstable_mockModule("../../Src/models/Recommendation.js", () => ({
  default: { find: findMock },
}));

const { getTopRatedBooks } = await import(
  "../../Src/controllers/recommendationController.js"
);

describe("recommendation management", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("returns top-rated recommendations", async () => {
    const payload = [{ _id: "1", title: "Book A" }];
    selectMock.mockResolvedValue(payload);
    const res = createMockRes();

    await getTopRatedBooks({}, res);

    expect(findMock).toHaveBeenCalledTimes(1);
    expect(sortMock).toHaveBeenCalledWith({ averageRating: -1, totalReviews: -1 });
    expect(limitMock).toHaveBeenCalledWith(10);
    expect(res.json).toHaveBeenCalledWith(payload);
  });
});
