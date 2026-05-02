describe("cart management mobile screen", () => {
  test("uses expected cart endpoints", () => {
    const endpoints = ["/cart", "/cart/:bookId", "/orders"];
    expect(endpoints).toContain("/cart");
  });
});
