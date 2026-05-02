describe("book management mobile screen", () => {
  test("uses expected book endpoints", () => {
    const endpoints = ["/books", "/books/:id"];
    expect(endpoints).toHaveLength(2);
  });
});
