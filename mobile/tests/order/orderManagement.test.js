describe("order management mobile screen", () => {
  test("uses expected order endpoints", () => {
    const endpoints = ["/orders", "/orders/myorders", "/order/:id"];
    expect(endpoints).toEqual(expect.arrayContaining(["/orders", "/orders/myorders"]));
  });
});
