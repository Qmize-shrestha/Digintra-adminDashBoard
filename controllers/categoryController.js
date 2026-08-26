const Category = require("../models/Category");
const Blog = require("../models/Blog");

// @desc    Create a new category
// @route   POST /api/categories
// @access  Private (Admin)
const createCategory = async (req, res) => {
    try {
        const { name, slug, description, status } = req.body;

        if (!name) {
            return res.status(400).json({
                success: false,
                message: "Category name is required",
            });
        }

        // Auto-generate slug from name if not provided
        const finalSlug = slug
            ? slug.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")
            : name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

        // Check for duplicate category by name or slug
        const existingCategory = await Category.findOne({
            $or: [{ name: name.trim() }, { slug: finalSlug }],
        });

        if (existingCategory) {
            return res.status(400).json({
                success: false,
                message: "Category with this name or slug already exists",
            });
        }

        const category = await Category.create({
            name: name.trim(),
            slug: finalSlug,
            description: description ? description.trim() : "",
            status: status || "active",
        });

        res.status(201).json({
            success: true,
            message: "Category created successfully",
            category,
        });
    } catch (error) {
        console.error("Create category error:", error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Get all categories (with optional search and blog counts)
// @route   GET /api/categories
// @access  Private
const getCategories = async (req, res) => {
    try {
        const { search, status } = req.query;

        const filter = {};
        if (status) {
            filter.status = status;
        }

        if (search) {
            filter.name = { $regex: search, $options: "i" };
        }

        const categories = await Category.find(filter).sort({ name: 1 });

        // Optionally attach blog counts per category
        const categoriesWithCounts = await Promise.all(
            categories.map(async (cat) => {
                const blogCount = await Blog.countDocuments({ category: cat._id });
                return {
                    ...cat.toObject(),
                    blogCount,
                };
            })
        );

        res.status(200).json({
            success: true,
            count: categoriesWithCounts.length,
            categories: categoriesWithCounts,
        });
    } catch (error) {
        console.error("Get categories error:", error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Get single category by ID
// @route   GET /api/categories/:id
// @access  Private
const getCategoryById = async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);

        if (!category) {
            return res.status(404).json({
                success: false,
                message: "Category not found",
            });
        }

        const blogCount = await Blog.countDocuments({ category: category._id });

        res.status(200).json({
            success: true,
            category: {
                ...category.toObject(),
                blogCount,
            },
        });
    } catch (error) {
        console.error("Get category by ID error:", error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Update category
// @route   PUT /api/categories/:id
// @access  Private (Admin)
const updateCategory = async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);

        if (!category) {
            return res.status(404).json({
                success: false,
                message: "Category not found",
            });
        }

        const { name, slug, description, status } = req.body;

        // Check if new name or slug conflicts with existing category
        if (slug || name) {
            const checkSlug = slug
                ? slug.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")
                : undefined;

            const duplicate = await Category.findOne({
                _id: { $ne: category._id },
                $or: [
                    ...(name ? [{ name: name.trim() }] : []),
                    ...(checkSlug ? [{ slug: checkSlug }] : []),
                ],
            });

            if (duplicate) {
                return res.status(400).json({
                    success: false,
                    message: "A category with this name or slug already exists",
                });
            }

            if (checkSlug) category.slug = checkSlug;
        }

        if (name) category.name = name.trim();
        if (description !== undefined) category.description = description.trim();
        if (status) category.status = status;

        const updatedCategory = await category.save();

        res.status(200).json({
            success: true,
            message: "Category updated successfully",
            category: updatedCategory,
        });
    } catch (error) {
        console.error("Update category error:", error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Delete category
// @route   DELETE /api/categories/:id
// @access  Private (Admin)
const deleteCategory = async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);

        if (!category) {
            return res.status(404).json({
                success: false,
                message: "Category not found",
            });
        }

        // Check if any blogs are linked to this category
        const linkedBlogsCount = await Blog.countDocuments({ category: category._id });
        if (linkedBlogsCount > 0) {
            return res.status(400).json({
                success: false,
                message: `Cannot delete category. It is assigned to ${linkedBlogsCount} blog(s). Reassign or delete those blogs first.`,
            });
        }

        await category.deleteOne();

        res.status(200).json({
            success: true,
            message: "Category deleted successfully",
        });
    } catch (error) {
        console.error("Delete category error:", error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

module.exports = {
    createCategory,
    getCategories,
    getCategoryById,
    updateCategory,
    deleteCategory,
};
