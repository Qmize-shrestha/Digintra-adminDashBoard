# Digintra Backend: Category & Subcategory Architecture & Implementation Documentation

This document provides an end-to-end breakdown of how the **Category** and **Subcategory** hierarchy and business logic are implemented in the Digintra Backend (`Digintra-Backend`).

---

## 1. High-Level Architectural Model

The database relationship is built using MongoDB reference-based modeling with referential integrity checks:

```
+------------------------------------+
|            Category                |
|  -------------------------------   |
|  _id: ObjectId                     |
|  name: String (Unique)             |
|  slug: String (Unique, Lowercase)  |
|  description: String               |
|  status: 'active' | 'inactive'     |
+-----------------+------------------+
                  | 1
                  | (has many)
                  |
                  v *
+-----------------+------------------+
|           SubCategory              |
|  -------------------------------   |
|  _id: ObjectId                     |
|  name: String                      |
|  slug: String                      |
|  category: ObjectId (ref Category) |
|  description: String               |
+-----------------+------------------+
                  | 1
                  | (assigned to)
                  |
                  v *
+-----------------+------------------+
|              Blog                  |
|  -------------------------------   |
|  _id: ObjectId                     |
|  title: String                     |
|  category: ObjectId (ref Category) |
|  subCategory: ObjectId (ref SubCat)|
|  ...                               |
+------------------------------------+
```

---

## 2. Database Models & Schema Design

### 2.1 Category Schema (`models/Category.js`)
- **Collection**: `categories`
- **Fields**:
  - `name`: Category display name (Unique, trimmed).
  - `slug`: URL slug (Unique, lowercase, trimmed).
  - `description`: Optional category description.
  - `status`: Enum (`'active'`, `'inactive'`), default `'active'`.
  - `timestamps`: `createdAt`, `updatedAt`.
- **Indexing**:
  - Index on `slug: 1` for fast URL resolution.
  - Text index on `name: "text"` for keyword search.

### 2.2 SubCategory Schema (`models/SubCategory.js`)
- **Collection**: `subcategories`
- **Fields**:
  - `name`: Subcategory name (e.g., *"Bulk SMS Provider"*).
  - `slug`: URL slug (e.g., *"bulk-sms-provider"*).
  - `category`: ObjectId reference (`ref: 'Category'`), required.
  - `description`: Optional text.
  - `timestamps`: `createdAt`, `updatedAt`.
- **Indexing & Uniqueness Constraints**:
  - Compound Unique Index: `{ category: 1, slug: 1 }` (Enforces unique slugs per parent category).
  - Compound Index: `{ category: 1, name: 1 }` (Accelerates filtering subcategories by category).
  - Text index: `{ name: "text" }` for search.

### 2.3 Blog Model Linking (`models/Blog.js`)
- Linked fields:
  ```javascript
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category",
  },
  subCategory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "SubCategory",
    default: null,
  }
  ```
- **Indexes**:
  - `blogSchema.index({ category: 1 });`
  - `blogSchema.index({ subCategory: 1 });`

---

## 3. Controller Business Logic

### 3.1 SubCategory Controller (`controllers/subCategoryController.js`)

#### A. Create Subcategory (`POST /api/subcategories`)
1. **Validation**: Checks that `name` and `category` (parent ID) are provided.
2. **Parent Verification**: Queries `Category.findById(category)` to ensure the parent category actually exists.
3. **Slug Auto-generation**: Sanitizes the name into a hyphenated, lowercase slug if not provided.
4. **Collision Check**: Verifies that no other subcategory under the *same parent category* has the same name or slug.
5. **Persistence & Population**: Creates the document and immediately runs `.populate("category", "name slug")` before returning.

#### B. Read / Query Subcategories (`GET /api/subcategories`)
1. **Filtering**: Supports query parameters:
   - `?category=<categoryId>` (Filter by specific parent)
   - `?status=active|inactive`
   - `?search=<keyword>` (Regex case-insensitive search)
2. **Aggregation / Counts**: Uses `Promise.all` + `Blog.countDocuments({ subCategory: sub._id })` to attach a computed `blogCount` to each subcategory.
3. **Population**: Automatically populates `category` with its `name` and `slug`.

#### C. Get by Parent Category (`GET /api/subcategories/by-category/:categoryId`)
- Fast endpoint tailored for dropdowns:
  ```javascript
  SubCategory.find({ category: categoryId, status: "active" }).sort({ name: 1 })
  ```

#### D. Update Subcategory (`PUT /api/subcategories/:id`)
1. Finds the existing subcategory.
2. If `name`, `slug`, or `category` changes:
   - Performs duplicate validation within the target parent category.
3. Updates `name`, `slug`, `description`, `category`, and `status`.
4. Returns the updated populated record.

#### E. Safe Delete Subcategory (`DELETE /api/subcategories/:id`)
- **Referential Integrity Protection**:
  ```javascript
  const linkedBlogsCount = await Blog.countDocuments({ subCategory: subCategory._id });
  if (linkedBlogsCount > 0) {
      return res.status(400).json({
          success: false,
          message: `Cannot delete subcategory. It is assigned to ${linkedBlogsCount} blog(s). Reassign or delete those blogs first.`,
      });
  }
  ```
  Prevents orphaned blog posts.

---

### 3.2 Category Safe Deletion (`controllers/categoryController.js`)

When an admin attempts to delete a top-level Category:
1. **Child Subcategory Check**:
   ```javascript
   const linkedSubCategoriesCount = await SubCategory.countDocuments({ category: category._id });
   if (linkedSubCategoriesCount > 0) {
       return res.status(400).json({
           success: false,
           message: `Cannot delete category. It contains ${linkedSubCategoriesCount} subcategory/subcategories. Reassign or delete them first.`,
       });
   }
   ```
2. **Blog Check**: Checks if any direct blogs are linked to the category.

---

### 3.3 Blog Controller Integration (`controllers/blogController.js`)

- **Creation (`createBlog`)**: Receives `category` and `subCategory` IDs and saves them.
- **Update (`updateBlog`)**: Updates `category` and `subCategory` pointers.
- **Querying (`getBlogs`)**:
  - Accepts `?category=<id>` and `?subCategory=<id>`.
  - Populates both levels:
    ```javascript
    .populate("category", "name slug")
    .populate("subCategory", "name slug")
    ```

---

## 4. RBAC & Security (`utils/permission.js` & `middleware/`)

Endpoints are guarded by JWT authentication middleware (`protect`) and Role-Based Access Control (`authorize`):

| Role | Category Permissions | Subcategory Permissions | Blog Permissions |
| :--- | :--- | :--- | :--- |
| **Admin** | `category.create`, `category.read`, `category.update`, `category.delete` | `subcategory.create`, `subcategory.read`, `subcategory.update`, `subcategory.delete` | Full access (`blog.*`) |
| **Editor** | `category.read` | `subcategory.read`, `subcategory.create`, `subcategory.update` | Create/Read/Update own blogs |

---

## 5. API Endpoint Reference

| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/categories` | List all categories with blog counts | Authenticated (`category.read`) |
| `POST` | `/api/categories` | Create new category | Admin (`category.create`) |
| `PUT` | `/api/categories/:id` | Update category details | Admin (`category.update`) |
| `DELETE` | `/api/categories/:id` | Delete category (checks subcats & blogs) | Admin (`category.delete`) |
| `GET` | `/api/subcategories` | List all subcategories with blog counts | Authenticated (`subcategory.read`) |
| `GET` | `/api/subcategories/by-category/:categoryId` | Fast fetch subcategories for a category | Authenticated (`subcategory.read`) |
| `GET` | `/api/subcategories/:id` | Get single subcategory | Authenticated (`subcategory.read`) |
| `POST` | `/api/subcategories` | Create subcategory linked to a category | Authenticated (`subcategory.create`) |
| `PUT` | `/api/subcategories/:id` | Update subcategory | Authenticated (`subcategory.update`) |
| `DELETE` | `/api/subcategories/:id` | Delete subcategory (checks blogs) | Admin (`subcategory.delete`) |

---

## 6. Server Route Registration (`server.js`)

In `Digintra-Backend/server.js`:
```javascript
const categoryRoutes = require("./routes/categoryRoutes");
const subCategoryRoutes = require("./routes/subCategoryRoutes");

// ...
app.use("/api/categories", categoryRoutes);
app.use("/api/subcategories", subCategoryRoutes);
```
