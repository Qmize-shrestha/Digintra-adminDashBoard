const express = require("express");
const {
    createCategory,
    getCategories,
    getCategoryById,
    updateCategory,
    deleteCategory,
} = require("../controllers/categoryController");
const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/authorizationMiddleware");

const router = express.Router();

// GET ALL CATEGORIES
router.get("/", protect, authorize("category.read"), getCategories);

// GET SINGLE CATEGORY
router.get("/:id", protect, authorize("category.read"), getCategoryById);

// CREATE CATEGORY (Admin)
router.post("/", protect, authorize("category.create"), createCategory);

// UPDATE CATEGORY (Admin)
router.put("/:id", protect, authorize("category.update"), updateCategory);

// DELETE CATEGORY (Admin)
router.delete("/:id", protect, authorize("category.delete"), deleteCategory);

module.exports = router;
