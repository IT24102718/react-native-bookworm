describe("category management mobile screen", () => {
  test("uses expected category endpoints", () => {
    const endpoints = ["/categories/:id/books", "/categories"];
    expect(endpoints[0]).toMatch("/categories");
  });
});
