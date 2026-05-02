# Review & Recommendation API Testing Checklist

Base URL:
- http://localhost:3000/api

Recommended Postman variables:
- `baseUrl` = `http://localhost:3000/api`
- `tokenA` = token for User A
- `tokenB` = token for User B
- `bookId` = target book id
- `reviewId` = target review id

---

## 1) Auth prerequisites

### 1.1 Register User A
- Endpoint: `/auth/register`
- Method: `POST`
- Auth required: `No`
- Body:
```json
{
  "email": "usera@test.com",
  "username": "userA",
  "password": "password123"
}
```
- Expected status: `201`
- Expected result: JSON contains `token` and `user`

### 1.2 Register User B
- Endpoint: `/auth/register`
- Method: `POST`
- Auth required: `No`
- Body:
```json
{
  "email": "userb@test.com",
  "username": "userB",
  "password": "password123"
}
```
- Expected status: `201`
- Expected result: JSON contains `token` and `user`

### 1.3 Login (if needed)
- Endpoint: `/auth/login`
- Method: `POST`
- Auth required: `No`
- Body:
```json
{
  "email": "usera@test.com",
  "password": "password123"
}
```
- Expected status: `200`
- Expected result: JSON contains `token` and `user`

### 1.4 Create a test book (as User A)
- Endpoint: `/books`
- Method: `POST`
- Auth required: `Yes` (`Bearer {{tokenA}}`)
- Body example:
```json
{
  "title": "Clean Code",
  "caption": "Great engineering practices",
  "rating": "5",
  "image": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD..."
}
```
- Expected status: `201`
- Expected result: created book object with `_id` (save as `bookId`)

---

## 2) Create review test
- Endpoint: `/reviews`
- Method: `POST`
- Auth required: `Yes` (`Bearer {{tokenA}}`)
- Body:
```json
{
  "bookId": "{{bookId}}",
  "rating": 5,
  "reviewText": "Excellent read for developers."
}
```
- Expected status: `201`
- Expected result: created review object with populated `userId` and `bookId`

---

## 3) Duplicate review test
- Endpoint: `/reviews`
- Method: `POST`
- Auth required: `Yes` (`Bearer {{tokenA}}`)
- Body:
```json
{
  "bookId": "{{bookId}}",
  "rating": 4,
  "reviewText": "Trying to review again."
}
```
- Expected status: `400`
- Expected result:
```json
{ "message": "You already reviewed this book" }
```

---

## 4) Get reviews by book test
- Endpoint: `/reviews/book/{{bookId}}?page=1&limit=10`
- Method: `GET`
- Auth required: `No`
- Body: none
- Expected status: `200`
- Expected result: JSON object with:
  - `reviews`
  - `currentPage`
  - `totalReviews`
  - `totalPages`
  - `averageRating`
  - `totalRatings`

---

## 5) Get review by id test
- Endpoint: `/reviews/{{reviewId}}`
- Method: `GET`
- Auth required: `No`
- Body: none
- Expected status: `200`
- Expected result: review object (with populated `userId` and `bookId`)

---

## 6) Update own review test
- Endpoint: `/reviews/{{reviewId}}`
- Method: `PUT`
- Auth required: `Yes` (`Bearer {{tokenA}}`)
- Body:
```json
{
  "rating": 4,
  "reviewText": "Updated review text."
}
```
- Expected status: `200`
- Expected result: updated review object

---

## 7) Unauthorized update test
- Endpoint: `/reviews/{{reviewId}}`
- Method: `PUT`
- Auth required: `Yes` (`Bearer {{tokenB}}`)
- Body:
```json
{
  "rating": 3,
  "reviewText": "Should fail"
}
```
- Expected status: `401`
- Expected result:
```json
{ "message": "Unauthorized" }
```

---

## 8) Delete own review test
- Endpoint: `/reviews/{{reviewId}}`
- Method: `DELETE`
- Auth required: `Yes` (`Bearer {{tokenA}}`)
- Body: none
- Expected status: `200`
- Expected result:
```json
{ "message": "Review deleted successfully" }
```

---

## 9) Unauthorized delete test
- Setup: create a new review as User A and save as `reviewId2`
- Endpoint: `/reviews/{{reviewId2}}`
- Method: `DELETE`
- Auth required: `Yes` (`Bearer {{tokenB}}`)
- Body: none
- Expected status: `401`
- Expected result:
```json
{ "message": "Unauthorized" }
```

---

## 10) Book rating summary test
- Endpoint: `/reviews/book/{{bookId}}/summary`
- Method: `GET`
- Auth required: `No`
- Body: none
- Expected status: `200`
- Expected result JSON shape:
```json
{
  "averageRating": 4.5,
  "totalReviews": 2,
  "ratingDistribution": {
    "1": 0,
    "2": 0,
    "3": 0,
    "4": 1,
    "5": 1
  }
}
```
(Values depend on your test data)

---

## 11) Top-rated recommendation test
- Endpoint: `/recommendations/top-rated`
- Method: `GET`
- Auth required: `No`
- Body: none
- Expected status: `200`
- Expected result: array of books sorted by:
  1. `averageRating` descending
  2. `totalReviews` descending
- Expected max length: `10`

---

## 12) Most-reviewed recommendation test
- Endpoint: `/recommendations/most-reviewed`
- Method: `GET`
- Auth required: `No`
- Body: none
- Expected status: `200`
- Expected result: array of books sorted by:
  1. `totalReviews` descending
  2. `averageRating` descending
- Expected max length: `10`

---

## Quick headers reference

For protected endpoints:
- `Authorization: Bearer {{tokenA}}` (or `{{tokenB}}`)
- `Content-Type: application/json` (for POST/PUT)
