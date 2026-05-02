global.fetch = jest.fn(async () => ({
  ok: true,
  json: async () => ({}),
}));
