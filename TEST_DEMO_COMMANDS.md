# Unit Test Demo Commands

## Backend (7 management components)

Run all backend tests:

```bash
cd backend
npm test
```

Run an individual backend component test:

```bash
npm test -- tests/recommendation/recommendationManagement.test.js
npm test -- tests/review/reviewManagement.test.js
npm test -- tests/stock/stockManagement.test.js
npm test -- tests/order/orderManagement.test.js
npm test -- tests/cart/cartManagement.test.js
npm test -- tests/category/categoryManagement.test.js
npm test -- tests/book/bookManagement.test.js
```

## Mobile (7 management components)

Run all mobile tests:

```bash
cd mobile
npm test -- --runInBand
```

Run an individual mobile component test:

```bash
npm test -- --runInBand tests/recommendation/recommendationManagement.test.js
npm test -- --runInBand tests/review/reviewManagement.test.js
npm test -- --runInBand tests/stock/stockManagement.test.js
npm test -- --runInBand tests/order/orderManagement.test.js
npm test -- --runInBand tests/cart/cartManagement.test.js
npm test -- --runInBand tests/category/categoryManagement.test.js
npm test -- --runInBand tests/book/bookManagement.test.js
```
