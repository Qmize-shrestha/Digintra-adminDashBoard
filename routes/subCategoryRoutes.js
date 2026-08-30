const express = require("express");
const {
    createSubCategory,
    getSubCategories,
    getSubCategoriesByCategory,
    getSubCategoryById,
    updateSubCategory,
    deleteSubCategory,
} = require("../controllers/subCategoryController");
const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/authorizationMiddleware");

const router = express.Router();

// GET ALL SUBCATEGORIES
router.get("/", protect, authorize("subcategory.read"), getSubCategories);

// GET SUBCATEGORIES BY PARENT CATEGORY ID
router.get("/by-category/:categoryId", protect, authorize("subcategory.read"), getSubCategoriesByCategory);

// GET SINGLE SUBCATEGORY
router.get("/:id", protect, authorize("subcategory.read"), getSubCategoryById);

// CREATE SUBCATEGORY (Admin)
router.post("/", protect, authorize("subcategory.create"), createSubCategory);

// UPDATE SUBCATEGORY (Admin)
router.put("/:id", protect, authorize("subcategory.update"), updateSubCategory);

// DELETE SUBCATEGORY (Admin)
router.delete("/:id", protect, authorize("subcategory.delete"), deleteSubCategory);

module.exports = router;
