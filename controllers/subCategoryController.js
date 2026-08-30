const SubCategory = require("../models/SubCategory");
const Category = require("../models/Category");
const Blog = require("../models/Blog");

// @desc    Create a new subcategory
// @route   POST /api/subcategories
// @access  Private (Admin)
const createSubCategory = async (req, res) => {
    try {
        const { name, slug, category, description } = req.body;

        if (!name || !category) {
            return res.status(400).json({
                success: false,
                message: "SubCategory name and parent category are required",
            });
        }

        // Validate parent category exists
        const parentCategory = await Category.findById(category);
        if (!parentCategory) {
            return res.status(404).json({
                success: false,
                message: "Parent category not found",
            });
        }

        // Auto-generate slug from name if not provided
        const finalSlug = slug
            ? slug.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")
            : name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

        // Check for duplicate subcategory under the same parent category
        const existingSubCategory = await SubCategory.findOne({
            category,
            $or: [{ name: name.trim() }, { slug: finalSlug }],
        });

        if (existingSubCategory) {
            return res.status(400).json({
                success: false,
                message: "A subcategory with this name or slug already exists in this category",
            });
        }

        const subCategory = await SubCategory.create({
            name: name.trim(),
            slug: finalSlug,
            category,
            description: description ? description.trim() : "",
        });

        const populatedSubCategory = await SubCategory.findById(subCategory._id).populate(
            "category",
            "name slug"
        );

        res.status(201).json({
            success: true,
            message: "SubCategory created successfully",
            subCategory: populatedSubCategory,
        });
    } catch (error) {
        console.error("Create subcategory error:", error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Get all subcategories (Filterable by category, search)
// @route   GET /api/subcategories
// @access  Private
const getSubCategories = async (req, res) => {
    try {
        const { category, search } = req.query;

        const filter = {};
        if (category) {
            filter.category = category;
        }
        if (search) {
            filter.name = { $regex: search, $options: "i" };
        }

        const subCategories = await SubCategory.find(filter)
            .populate("category", "name slug")
            .sort({ name: 1 });

        // Optionally attach blog counts per subcategory
        const subCategoriesWithCounts = await Promise.all(
            subCategories.map(async (sub) => {
                const blogCount = await Blog.countDocuments({ subCategory: sub._id });
                return {
                    ...sub.toObject(),
                    blogCount,
                };
            })
        );

        res.status(200).json({
            success: true,
            count: subCategoriesWithCounts.length,
            subCategories: subCategoriesWithCounts,
        });
    } catch (error) {
        console.error("Get subcategories error:", error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Get subcategories by parent category ID
// @route   GET /api/subcategories/by-category/:categoryId
// @access  Private
const getSubCategoriesByCategory = async (req, res) => {
    try {
        const { categoryId } = req.params;
        const subCategories = await SubCategory.find({
            category: categoryId,
        }).sort({ name: 1 });

        res.status(200).json({
            success: true,
            count: subCategories.length,
            subCategories,
        });
    } catch (error) {
        console.error("Get subcategories by category error:", error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Get single subcategory by ID
// @route   GET /api/subcategories/:id
// @access  Private
const getSubCategoryById = async (req, res) => {
    try {
        const subCategory = await SubCategory.findById(req.params.id).populate(
            "category",
            "name slug"
        );

        if (!subCategory) {
            return res.status(404).json({
                success: false,
                message: "SubCategory not found",
            });
        }

        const blogCount = await Blog.countDocuments({ subCategory: subCategory._id });

        res.status(200).json({
            success: true,
            subCategory: {
                ...subCategory.toObject(),
                blogCount,
            },
        });
    } catch (error) {
        console.error("Get subcategory by ID error:", error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Update subcategory
// @route   PUT /api/subcategories/:id
// @access  Private (Admin)
const updateSubCategory = async (req, res) => {
    try {
        const subCategory = await SubCategory.findById(req.params.id);

        if (!subCategory) {
            return res.status(404).json({
                success: false,
                message: "SubCategory not found",
            });
        }

        const { name, slug, category, description } = req.body;
        const targetCategory = category || subCategory.category;

        // If name or slug is changed, check duplicates within category
        if (
            (name && name.trim() !== subCategory.name) ||
            (slug && slug.trim().toLowerCase() !== subCategory.slug) ||
            (category && category.toString() !== subCategory.category.toString())
        ) {
            const checkName = name ? name.trim() : subCategory.name;
            const checkSlug = slug
                ? slug.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")
                : (name ? name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") : subCategory.slug);

            const duplicate = await SubCategory.findOne({
                category: targetCategory,
                _id: { $ne: subCategory._id },
                $or: [{ name: checkName }, { slug: checkSlug }],
            });

            if (duplicate) {
                return res.status(400).json({
                    success: false,
                    message: "A subcategory with this name or slug already exists in the target category",
                });
            }

            subCategory.slug = checkSlug;
        }

        if (name) subCategory.name = name.trim();
        if (category) subCategory.category = category;
        if (description !== undefined) subCategory.description = description.trim();

        const updatedSubCategory = await subCategory.save();
        const populated = await SubCategory.findById(updatedSubCategory._id).populate(
            "category",
            "name slug"
        );

        res.status(200).json({
            success: true,
            message: "SubCategory updated successfully",
            subCategory: populated,
        });
    } catch (error) {
        console.error("Update subcategory error:", error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Delete subcategory
// @route   DELETE /api/subcategories/:id
// @access  Private (Admin)
const deleteSubCategory = async (req, res) => {
    try {
        const subCategory = await SubCategory.findById(req.params.id);

        if (!subCategory) {
            return res.status(404).json({
                success: false,
                message: "SubCategory not found",
            });
        }

        // Check if any blogs are linked to this subcategory
        const linkedBlogsCount = await Blog.countDocuments({ subCategory: subCategory._id });
        if (linkedBlogsCount > 0) {
            return res.status(400).json({
                success: false,
                message: `Cannot delete subcategory. It is assigned to ${linkedBlogsCount} blog(s). Reassign or delete those blogs first.`,
            });
        }

        await subCategory.deleteOne();

        res.status(200).json({
            success: true,
            message: "SubCategory deleted successfully",
        });
    } catch (error) {
        console.error("Delete subcategory error:", error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

module.exports = {
    createSubCategory,
    getSubCategories,
    getSubCategoriesByCategory,
    getSubCategoryById,
    updateSubCategory,
    deleteSubCategory,
};
