# 🚀 Digintra Admin Backend — Complete Postman API Testing Guide

This guide contains everything you need to test all API endpoints of the **Digintra Admin Backend** in Postman, including environment setup, authentication flows, role-based authorization, request bodies, and expected responses.

---

## 📑 Table of Contents
1. [⚙️ Prerequisites & Server Setup](#1-prerequisites--server-setup)
2. [🌐 Postman Setup & Environment Variables](#2-postman-setup--environment-variables)
3. [🔐 Authentication & Workflow Architecture](#3-authentication--workflow-architecture)
4. [📡 API Endpoints Reference](#4-api-endpoints-reference)
   - [A. Authentication APIs (`/api/auth`)](#a-authentication-apis)
   - [B. User Management APIs (`/api/users`)](#b-user-management-apis)
   - [C. Category Management APIs (`/api/categories`)](#c-category-management-apis)
   - [D. Blog Management APIs (`/api/blogs`)](#d-blog-management-apis)
   - [E. Admin Dashboard Stats (`/api/admin`)](#e-admin-dashboard-stats)
5. [⚠️ Error Codes & Troubleshooting](#5-error-codes--troubleshooting)

---

## 1. ⚙️ Prerequisites & Server Setup

### Step 1: Start MongoDB
Ensure MongoDB is running locally on port `27017` or through MongoDB Compass / Atlas.

### Step 2: Seed Default Admin & Editor Accounts
Open terminal in the `Digintra-Backend` folder and run:
```bash
# Seed Super Admin (admin@digintra.com / Admin@123)
node seed/createAdmin.js

# Seed Editor (editor@digintra.com / Editor@123)
node seed/createEditor.js
```

### Step 3: Start the Backend Server
```bash
npm run dev
# Server will run at: http://localhost:5000
```

---

## 2. 🌐 Postman Setup & Environment Variables

### Create a Postman Environment
In Postman, click **Environments** -> **Create Environment** (name it `Digintra Local`) and set the following variables:

| Variable | Initial Value | Current Value | Description |
| :--- | :--- | :--- | :--- |
| `baseUrl` | `http://localhost:5000` | `http://localhost:5000` | Backend Base URL |
| `adminToken` | *(leave blank)* | *(auto-populated on login)* | JWT Token for Admin |
| `editorToken` | *(leave blank)* | *(auto-populated on login)* | JWT Token for Editor |
| `blogId` | *(leave blank)* | *(store created blog ID)* | ID for Blog CRUD testing |
| `categoryId` | *(leave blank)* | *(store created category ID)* | ID for Category CRUD testing |
| `userId` | *(leave blank)* | *(store created user ID)* | ID for User CRUD testing |

### Auto-save Token in Postman (Optional Pro-Tip)
In Postman, under the **Tests** tab of your `POST /api/auth/login` request, paste:
```javascript
if (pm.response.code === 200) {
    const data = pm.response.json();
    if (data.user.role === 'admin') {
        pm.environment.set("adminToken", data.token);
    } else {
        pm.environment.set("editorToken", data.token);
    }
}
```

---

## 3. 🔐 Authentication & Workflow Architecture

```
[ Client / Postman ]
        │
        ▼
   [ Server ] ──▶ [ Rate Limiter ] ──▶ [ Helmet & CORS ]
        │
        ▼
 [ Auth Middleware (protect) ]
   ├── Reads "Authorization: Bearer <token>"
   ├── Decodes JWT & verifies secret
   └── Attaches user object: req.user
        │
        ▼
 [ Authorization Middleware (authorize) ]
   ├── Checks role in permissions dictionary:
   │     • Admin: Full access (blog.*, category.*, user.*, admin.dashboard, seo.*)
   │     • Editor: blog.create/read/update, category.read, seo.update
   └── Validates resource ownership (Editors can only edit their own blogs)
        │
        ▼
 [ Controller Action ] ──▶ [ MongoDB / Mongoose ]
```

---

## 4. 📡 API Endpoints Reference

---

### A. Authentication APIs

#### 1. Server Health Check
- **Method:** `GET`
- **URL:** `{{baseUrl}}/`
- **Auth:** None
- **Response (200 OK):**
```json
{
  "success": true,
  "message": "Digintra Admin Backend API is running",
  "timestamp": "2026-08-26T17:30:00.000Z"
}
```

---

#### 2. Admin Login
- **Method:** `POST`
- **URL:** `{{baseUrl}}/api/auth/login`
- **Headers:** `Content-Type: application/json`
- **Body (raw JSON):**
```json
{
  "email": "admin@digintra.com",
  "password": "Admin@123"
}
```
- **Response (200 OK):**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "665c829e1c2...",
    "name": "Digintra Admin",
    "email": "admin@digintra.com",
    "role": "admin",
    "status": "active"
  }
}
```

---

#### 3. Editor Login
- **Method:** `POST`
- **URL:** `{{baseUrl}}/api/auth/login`
- **Headers:** `Content-Type: application/json`
- **Body (raw JSON):**
```json
{
  "email": "editor@digintra.com",
  "password": "Editor@123"
}
```

---

#### 4. Register New User (Signup)
- **Method:** `POST`
- **URL:** `{{baseUrl}}/api/auth/signup`
- **Headers:** `Content-Type: application/json`
- **Body (raw JSON):**
```json
{
  "name": "John Doe",
  "email": "johndoe@example.com",
  "password": "Password@123"
}
```
- **Response (201 Created):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIsIn...",
  "user": {
    "id": "665c83...",
    "name": "John Doe",
    "email": "johndoe@example.com",
    "role": "editor",
    "status": "active"
  }
}
```

---

#### 5. Forgot Password
- **Method:** `POST`
- **URL:** `{{baseUrl}}/api/auth/forgotpassword`
- **Headers:** `Content-Type: application/json`
- **Body (raw JSON):**
```json
{
  "email": "admin@digintra.com"
}
```
- **Response (200 OK):**
```json
{
  "success": true,
  "message": "If an account with that email exists, a password reset link has been sent."
}
```

---

#### 6. Reset Password
- **Method:** `PUT`
- **URL:** `{{baseUrl}}/api/auth/resetpassword/<RESET_TOKEN_HERE>`
- **Headers:** `Content-Type: application/json`
- **Body (raw JSON):**
```json
{
  "password": "NewSecretPassword@123"
}
```
- **Response (200 OK):**
```json
{
  "success": true,
  "message": "Password updated successfully",
  "token": "eyJhbGciOiJIUz..."
}
```

---

### B. User Management APIs

> 🔑 All routes in this section require:
> `Authorization: Bearer {{adminToken}}` (or `{{editorToken}}` for Profile)

#### 1. Get Current User Profile (Me)
- **Method:** `GET`
- **URL:** `{{baseUrl}}/api/users/profile`
- **Headers:**
  - `Authorization`: `Bearer {{adminToken}}`
- **Response (200 OK):**
```json
{
  "success": true,
  "user": {
    "_id": "665c829e1c2...",
    "name": "Digintra Admin",
    "email": "admin@digintra.com",
    "role": "admin",
    "status": "active"
  }
}
```

---

#### 2. Update Current User Profile
- **Method:** `PUT`
- **URL:** `{{baseUrl}}/api/users/profile`
- **Headers:**
  - `Authorization`: `Bearer {{adminToken}}`
  - `Content-Type`: `application/json`
- **Body (raw JSON):**
```json
{
  "name": "Digintra Super Admin"
}
```

---

#### 3. Get All Users (Admin Only — Paginated & Filterable)
- **Method:** `GET`
- **URL:** `{{baseUrl}}/api/users?page=1&limit=10&role=editor&status=active&search=john`
- **Headers:**
  - `Authorization`: `Bearer {{adminToken}}`
- **Response (200 OK):**
```json
{
  "success": true,
  "count": 1,
  "total": 1,
  "totalPages": 1,
  "currentPage": 1,
  "users": [
    {
      "_id": "665c83...",
      "name": "John Doe",
      "email": "johndoe@example.com",
      "role": "editor",
      "status": "active",
      "createdAt": "2026-08-26T17:35:00.000Z"
    }
  ]
}
```

---

#### 4. Create User by Admin
- **Method:** `POST`
- **URL:** `{{baseUrl}}/api/users`
- **Headers:**
  - `Authorization`: `Bearer {{adminToken}}`
  - `Content-Type`: `application/json`
- **Body (raw JSON):**
```json
{
  "name": "Staff Editor",
  "email": "staff@digintra.com",
  "password": "Staff@Password123",
  "role": "editor",
  "status": "active"
}
```

---

#### 5. Update User by Admin
- **Method:** `PUT`
- **URL:** `{{baseUrl}}/api/users/{{userId}}`
- **Headers:**
  - `Authorization`: `Bearer {{adminToken}}`
  - `Content-Type`: `application/json`
- **Body (raw JSON):**
```json
{
  "name": "Senior Staff Editor",
  "status": "inactive"
}
```

---

#### 6. Delete User by Admin
- **Method:** `DELETE`
- **URL:** `{{baseUrl}}/api/users/{{userId}}`
- **Headers:**
  - `Authorization`: `Bearer {{adminToken}}`
- **Response (200 OK):**
```json
{
  "success": true,
  "message": "User deleted successfully"
}
```
*(Note: Admins cannot delete their own account).*

---

### C. Category Management APIs

#### 1. Create Category (Admin Only)
- **Method:** `POST`
- **URL:** `{{baseUrl}}/api/categories`
- **Headers:**
  - `Authorization`: `Bearer {{adminToken}}`
  - `Content-Type`: `application/json`
- **Body (raw JSON):**
```json
{
  "name": "Technology & AI",
  "slug": "technology-ai",
  "description": "Articles covering modern software engineering and artificial intelligence",
  "status": "active"
}
```
- **Response (201 Created):**
```json
{
  "success": true,
  "message": "Category created successfully",
  "category": {
    "_id": "665c84a1...",
    "name": "Technology & AI",
    "slug": "technology-ai",
    "description": "Articles covering modern software engineering and artificial intelligence",
    "status": "active"
  }
}
```

---

#### 2. Get All Categories (Admin & Editor)
- **Method:** `GET`
- **URL:** `{{baseUrl}}/api/categories?status=active&search=tech`
- **Headers:**
  - `Authorization`: `Bearer {{adminToken}}` (or `Bearer {{editorToken}}`)
- **Response (200 OK):**
```json
{
  "success": true,
  "count": 1,
  "categories": [
    {
      "_id": "665c84a1...",
      "name": "Technology & AI",
      "slug": "technology-ai",
      "description": "Articles covering modern software engineering...",
      "status": "active",
      "blogCount": 5
    }
  ]
}
```

---

#### 3. Update Category (Admin Only)
- **Method:** `PUT`
- **URL:** `{{baseUrl}}/api/categories/{{categoryId}}`
- **Headers:**
  - `Authorization`: `Bearer {{adminToken}}`
  - `Content-Type`: `application/json`
- **Body (raw JSON):**
```json
{
  "name": "Tech & Generative AI",
  "description": "Updated category description"
}
```

---

#### 4. Delete Category (Admin Only)
- **Method:** `DELETE`
- **URL:** `{{baseUrl}}/api/categories/{{categoryId}}`
- **Headers:**
  - `Authorization`: `Bearer {{adminToken}}`
- **Response (200 OK):**
```json
{
  "success": true,
  "message": "Category deleted successfully"
}
```
*(Note: Protected against deleting categories that are currently linked to blogs).*

---

### D. Blog Management APIs

#### 1. Create Blog Post (Admin or Editor)
- **Method:** `POST`
- **URL:** `{{baseUrl}}/api/blogs`
- **Headers:**
  - `Authorization`: `Bearer {{adminToken}}` (or `Bearer {{editorToken}}`)
  - `Content-Type`: `application/json`
- **Body (raw JSON):**
```json
{
  "title": "Getting Started with Digintra Admin Backend",
  "slug": "getting-started-with-digintra",
  "excerpt": "A complete guide on exploring and running Digintra Admin CMS.",
  "content": "<h2>Introduction</h2><p>Digintra provides full RBAC, Blog and Category management.</p>",
  "featuredImage": "https://images.unsplash.com/photo-1518770660439-4636190af475",
  "category": "{{categoryId}}",
  "tags": ["nodejs", "express", "mongodb", "tutorial"],
  "status": "draft",
  "seo": {
    "metaTitle": "Getting Started with Digintra Admin Backend",
    "metaDescription": "Learn how to use Digintra Admin CMS effectively.",
    "canonicalUrl": "https://digintra.com/blog/getting-started-with-digintra"
  }
}
```
- **Response (201 Created):**
```json
{
  "success": true,
  "message": "Blog created successfully",
  "blog": {
    "_id": "665c85b2...",
    "title": "Getting Started with Digintra Admin Backend",
    "slug": "getting-started-with-digintra",
    "excerpt": "A complete guide on exploring and running Digintra Admin CMS.",
    "status": "draft",
    "author": {
      "_id": "665c829e1c2...",
      "name": "Digintra Admin",
      "email": "admin@digintra.com",
      "role": "admin"
    },
    "category": {
      "_id": "665c84a1...",
      "name": "Technology & AI",
      "slug": "technology-ai"
    }
  }
}
```

---

#### 2. Get All Blogs (Paginated, Searchable & Filterable)
- **Method:** `GET`
- **URL:** `{{baseUrl}}/api/blogs?page=1&limit=10&status=draft&search=Digintra&sort=createdAt`
- **Query Parameters Available:**
  - `page`: Page number (default `1`)
  - `limit`: Items per page (default `10`)
  - `status`: `draft` | `scheduled` | `published` | `archived`
  - `category`: Category ObjectID
  - `author`: Author ObjectID
  - `tag`: Filter by specific tag
  - `search`: Search keywords in title & excerpt
  - `sort`: `createdAt` (desc), `oldest`, `title_asc`, `title_desc`
- **Headers:**
  - `Authorization`: `Bearer {{adminToken}}` (or `Bearer {{editorToken}}`)
- **Response (200 OK):**
```json
{
  "success": true,
  "count": 1,
  "total": 1,
  "totalPages": 1,
  "currentPage": 1,
  "blogs": [ ... ]
}
```

---

#### 3. Get Single Blog (by ID or Slug)
- **Method:** `GET`
- **URL:** `{{baseUrl}}/api/blogs/{{blogId}}` *(or `{{baseUrl}}/api/blogs/getting-started-with-digintra`)*
- **Headers:**
  - `Authorization`: `Bearer {{adminToken}}` (or `Bearer {{editorToken}}`)

---

#### 4. Update Blog
- **Method:** `PUT`
- **URL:** `{{baseUrl}}/api/blogs/{{blogId}}`
- **Headers:**
  - `Authorization`: `Bearer {{adminToken}}` (or `Bearer {{editorToken}}` for author)
  - `Content-Type`: `application/json`
- **Body (raw JSON):**
```json
{
  "title": "Getting Started with Digintra Admin Backend (Updated 2026)",
  "status": "published"
}
```
*(Note: Editors can only update their own blogs. Admins can update any blog).*

---

#### 5. Publish Blog (Admin Only Shortcut)
- **Method:** `PATCH`
- **URL:** `{{baseUrl}}/api/blogs/{{blogId}}/publish`
- **Headers:**
  - `Authorization`: `Bearer {{adminToken}}`
- **Response (200 OK):**
```json
{
  "success": true,
  "message": "Blog published successfully",
  "blog": {
    "status": "published",
    "scheduledAt": null
  }
}
```

---

#### 6. Delete Blog
- **Method:** `DELETE`
- **URL:** `{{baseUrl}}/api/blogs/{{blogId}}`
- **Headers:**
  - `Authorization`: `Bearer {{adminToken}}` (or `Bearer {{editorToken}}` for author)
- **Response (200 OK):**
```json
{
  "success": true,
  "message": "Blog deleted successfully"
}
```

---

### E. Admin Dashboard Stats

#### 1. Get Dashboard Metrics (Admin Only)
- **Method:** `GET`
- **URL:** `{{baseUrl}}/api/admin/stats`
- **Headers:**
  - `Authorization`: `Bearer {{adminToken}}`
- **Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "users": {
      "total": 3,
      "active": 3,
      "inactive": 0
    },
    "blogs": {
      "total": 12,
      "published": 8,
      "draft": 3,
      "scheduled": 1
    },
    "categories": {
      "total": 4
    },
    "recentBlogs": [ ... ],
    "recentUsers": [ ... ]
  }
}
```

---

## 5. ⚠️ Error Codes & Troubleshooting

| HTTP Status | Message Scenario | Fix / Resolution |
| :--- | :--- | :--- |
| `400 Bad Request` | `"Duplicate value entered for email/slug"` | Use a unique email or slug. |
| `400 Bad Request` | `"Invalid ID format for resource"` | Ensure the ID parameter is a 24-character hexadecimal MongoDB ObjectId. |
| `401 Unauthorized` | `"Not authorized. Token required."` | Add header `Authorization: Bearer <token>`. |
| `401 Unauthorized` | `"Invalid or expired token."` | Login again to generate a fresh JWT token. |
| `403 Forbidden` | `"You do not have permission to perform this action"` | Your role (e.g. Editor) does not have permission for this route. Switch to Admin token. |
| `403 Forbidden` | `"Not authorized to update another user's blog"` | Editors can only update their own blogs. |
| `429 Too Many Requests` | `"Too many requests from this IP..."` | Wait 15 minutes or adjust `express-rate-limit` settings. |
