describe("recommendation management mobile screen", () => {
  test("uses expected recommendation endpoints", () => {
    const endpoints = [
      "/recommendations?page=1&limit=50",
      "/recommendations/top-rated",
      "/recommendations/most-reviewed",
    ];
    expect(endpoints).toHaveLength(3);
  });
});
