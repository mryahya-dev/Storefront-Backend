# Storefront Backend API

Storefront Backend built with **Node.js, Express, TypeScript, PostgreSQL, JWT authentication, Cloudinary image uploads, and RBAC**.

This backend supports user authentication with role-based authorization, product management with images, order creation, and pagination for listing users, products, and orders. It also includes role-based access control to ensure only authorized users can perform certain actions.

---

## **Tech Stack**

- **Backend:** Node.js, Express, TypeScript
- **Database:** PostgreSQL
- **Migrations:** **Flyway** for automated SQL schema migrations
- **Authentication:** JWT stored in **HttpOnly cookies**
- **File Storage:** Cloudinary for product images
- **Security:** bcrypt for password hashing, express-rate-limit, password + JWT length validation
- **Testing:** Jasmine, Supertest
- **Deployment:** Docker-ready backend, CI/CD with automated test → build → deploy

---

## **Authentication**

- JWT is sent via **HttpOnly cookie**.
- Users can update **their own info only**.
- Admins can update **any user info**, but **role cannot be updated by anyone**.

---

## **API Endpoints**

### **Users**

#### GET /api/users

- **Admin only**
- Supports `limit` and `offset` for pagination

**Query Parameters:**

- `limit` (optional) — number of users per page, default `20`
- `offset` (optional) — offset for pagination, default `0`

**Response:**

```json
{
  "items": [
    {
      "id": "1",
      "name": "Alice",
      "email": "alice@example.com",
      "role": "admin"
    }
  ],
  "limit": 20,
  "offset": 0
}
```

#### GET /api/users/:id

- **Admin** can get any user
- **User** can get their own info

**Response:**

```json
{
  "id": "1",
  "name": "Alice",
  "email": "alice@example.com",
  "role": "admin"
}
```

#### PUT /api/users/:id

- **Admin** can update any user
- **User** can update their own info
- **Role cannot be changed**

**Body (any combination):**

```json
{
  "name": "New Name",
  "email": "newemail@example.com",
  "password": "newpassword123"
}
```

**Response:**

```json
{
  "id": "1",
  "name": "New Name",
  "email": "newemail@example.com",
  "role": "admin"
}
```

---

### **Products**

#### GET /api/products

- Supports `limit` and `offset` for pagination

**Response:**

```json
{
  "items": [
    {
      "id": "1",
      "name": "Product 1",
      "price": 12.5,
      "quantity": 50,
      "remaining_items": 50,
      "category": "Clothes",
      "image_url": "https://res.cloudinary.com/...",
      "image_public_id": "xyz123"
    }
  ],
  "limit": 20,
  "offset": 0
}
```

#### POST /api/products

- **Admin only**
- Uploads an image file with `multipart/form-data` under `image` field

**Body Example:**

```json
{
  "name": "New Product",
  "price": 20.0,
  "quantity": 100,
  "remaining_items": 100,
  "category": "Electronics"
}
```

**Response:**

```json
{
  "id": "2",
  "name": "New Product",
  "price": 20.0,
  "quantity": 100,
  "remaining_items": 100,
  "category": "Electronics",
  "image_url": "https://res.cloudinary.com/...",
  "image_public_id": "abc123"
}
```

#### PUT /api/products/:id

- **Admin only**
- **Optional image upload**
- Old Cloudinary image is deleted if replaced

**Body Example:**

```json
{
  "name": "Updated Product",
  "price": 25.0,
  "quantity": 50,
  "remaining_items": 50,
  "category": "Electronics"
}
```

**Response:**

```json
{
  "id": "2",
  "name": "Updated Product",
  "price": 25.0,
  "quantity": 50,
  "remaining_items": 50,
  "category": "Electronics",
  "image_url": "https://res.cloudinary.com/...",
  "image_public_id": "newabc123"
}
```

#### DELETE /api/products/:id

- **Admin only**
- Deletes Cloudinary asset and product row

**Response:**

```json
{
  "message": "Product deleted"
}
```

---

### **Orders**

#### GET /api/orders

- **Admin** sees all orders
- **User** sees only their own orders
- Supports `limit` and `offset` for pagination

**Response:**

```json
{
  "items": [
    {
      "id": "1",
      "user_id": "3",
      "items": [
        {
          "product_id": "2",
          "name": "Updated Product",
          "quantity": 2,
          "price": 25.0,
          "line_total": 50.0
        }
      ],
      "total": 50.0,
      "created_at": "2025-11-14T12:00:00Z"
    }
  ],
  "limit": 20,
  "offset": 0
}
```

#### POST /api/orders

- Create a new order

**Body Example:**

```json
{
  "items": [{ "product_id": "2", "quantity": 2, "price": 25.0 }]
}
```

**Response:**

```json
{
  "id": "1",
  "user_id": "3",
  "items": [
    {
      "product_id": "2",
      "name": "Updated Product",
      "quantity": 2,
      "price": 25.0,
      "line_total": 50.0
    }
  ],
  "total": 50.0,
  "created_at": "2025-11-14T12:00:00Z"
}
```

---

### **Security**

- JWT is stored in **HttpOnly cookie**
- Passwords are hashed with **bcrypt + pepper**
- Requests are **rate-limited** using `express-rate-limit`
- Password length is validated before hashing, and JWT token length is validated before verification to prevent CPU abuse.
- Request body size is limited (`express.json({ limit: "10mb" })`)
- HTTP headers are limited using Node’s `--max-http-header-size` flag to prevent oversized header attacks

---

### **Testing**

- **Jasmine** is used for unit tests
- **Supertest** is used for API request testing

---

### **Environment Variables**

```env
PORT=3000
DATABASE_URL=postgres://user:password@localhost:5432/storefront
JWT_SECRET=your_jwt_secret
PEPPER=your_pepper
BCRYPT_SALT_ROUNDS=10
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CLOUDINARY_UPLOAD_FOLDER=storefront_products
```

---

**Deployment & CI/CD**

- Backend Server: Deployed on Sevella
- Frontend: Deployed on **Cloudflare Pages**
- Continuous Integration & Deployment: CircleCI ![CircleCI](https://circleci.com/gh/mryahya-dev/Storefront-Backend.svg?style=svg)

  - Runs automated **tests**
  - Builds **Docker image**
  - Pushes image to **Docker Hub**
  - Deployment is triggered automatically

> **Note:** it has ready-to-use Dockerfile for containerized deployment.

## **Live Demo**

- [Backend API Live Demo](https://storefrontbackend-8kj4i.sevalla.app/api)

## **Example cURL Requests**

**User Registration:**

```bash
curl -X POST https://storefrontbackend-8kj4i.sevalla.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name": "John Doe", "email": "john@example.com", "password": "password123"}'
```

**Login:**

```bash
curl -X POST https://storefrontbackend-8kj4i.sevalla.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password123"}'
```

**Get Products (Paginated):**

```bash
curl https://storefrontbackend-8kj4i.sevalla.app/api/products?limit=10&offset=0
```

**Create Product (Admin only, with image):**

```bash
curl -X POST https://storefrontbackend-8kj4i.sevalla.app/api/products \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -F "name=New Product" \
  -F "price=20.0" \
  -F "quantity=100" \
  -F "remaining_items=100" \
  -F "category=Electronics" \
  -F "image=@/path/to/image.jpg"
```

**Update Product (Admin only, optional image):**

```bash
curl -X PUT https://storefrontbackend-8kj4i.sevalla.app/api/products/2 \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -F "name=Updated Product" \
  -F "price=25.0" \
  -F "quantity=50" \
  -F "remaining_items=50" \
  -F "category=Electronics" \
  -F "image=@/path/to/new_image.jpg"
```

**Delete Product (Admin only):**

```bash
curl -X DELETE https://storefrontbackend-8kj4i.sevalla.app/api/products/2 \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

**Get Orders (Paginated):**

```bash
curl -H "Authorization: Bearer <JWT_TOKEN>" https://storefrontbackend-8kj4i.sevalla.app/api/orders?limit=10&offset=0
```

**Create Order:**

```bash
curl -X POST https://storefrontbackend-8kj4i.sevalla.app/api/orders \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"items": [{"product_id": "2", "quantity": 2, "price": 25.0}]}'
```

**Get Users (Admin only, paginated):**

```bash
curl -H "Authorization: Bearer <JWT_TOKEN>" https://storefrontbackend-8kj4i.sevalla.app/api/users?limit=10&offset=0
```

**Update User Info:**

```bash
curl -X PUT https://storefrontbackend-8kj4i.sevalla.app/api/users/1 \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"name": "Updated Name", "email": "newemail@example.com", "password": "newpassword123"}'
```
