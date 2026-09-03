const Blog = require("../models/Blog");

// @desc    Create a new blog
// @route   POST /api/blogs
// @access  Private (Admin, Editor)
const createBlog = async (req, res) => {
    try {
        const {
            title,
            slug,
            excerpt,
            content,
            featuredImage,
            category,
            subCategory,
            tags,
            status,
            scheduledAt,
            seo,
        } = req.body;

        // Basic validation
        if (!title || !content) {
            return res.status(400).json({
                success: false,
                message: "Title and content are required",
            });
        }

        // Generate or sanitize slug
        const finalSlug = slug
            ? slug.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")
            : title.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

        // Check duplicate slug
        const existingBlog = await Blog.findOne({ slug: finalSlug });

        if (existingBlog) {
            return res.status(400).json({
                success: false,
                message: "A blog with this slug already exists",
            });
        }

        // Handle Category resolving (convert string name from frontend into an ObjectId)
        let resolvedCategoryId = null;
        if (category && typeof category === 'string' && category.trim() !== '') {
            const mongoose = require('mongoose');
            if (mongoose.Types.ObjectId.isValid(category)) {
                resolvedCategoryId = category;
            } else {
                const Category = require('../models/Category');
                let existingCategory = await Category.findOne({ name: new RegExp('^' + category.trim() + '$', 'i') });
                if (existingCategory) {
                    resolvedCategoryId = existingCategory._id;
                } else {
                    const catSlug = category.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
                    const newCat = await Category.create({ name: category.trim(), slug: catSlug });
                    resolvedCategoryId = newCat._id;
                }
            }
        }

        // Create blog
        const blog = await Blog.create({
            title: title.trim(),
            slug: finalSlug,
            excerpt: excerpt ? excerpt.trim() : "",
            content,
            featuredImage: featuredImage || "",
            author: req.user._id,
            category: category || null,
            subCategory: subCategory || null,
            tags: Array.isArray(tags) ? tags : [],
            status: status || "draft",
            scheduledAt: scheduledAt || null,
            seo: seo || {},
        });

        // Populate author, category & subCategory before returning
        const populatedBlog = await Blog.findById(blog._id)
            .populate("author", "name email role")
            .populate("category", "name slug")
            .populate("subCategory", "name slug");

        res.status(201).json({
            success: true,
            message: "Blog created successfully",
            blog: populatedBlog,
        });
    } catch (error) {
        console.error("Create blog error:", error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Get all blogs (Paginated, Searchable, Filterable)
// @route   GET /api/blogs
// @access  Private
const getBlogs = async (req, res) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        const skip = (page - 1) * limit;

        const { status, category, subCategory, author, search, tag, sort } = req.query;

        const filter = {};

        if (status) {
            filter.status = status;
        }

        if (category) {
            filter.category = category;
        }

        if (subCategory) {
            filter.subCategory = subCategory;
        }

        if (author) {
            filter.author = author;
        }

        if (tag) {
            filter.tags = { $in: [tag] };
        }

        if (search) {
            filter.$or = [
                { title: { $regex: search, $options: "i" } },
                { excerpt: { $regex: search, $options: "i" } },
            ];
        }

        // Sorting options
        let sortOption = { createdAt: -1 };
        if (sort === "oldest") sortOption = { createdAt: 1 };
        if (sort === "title_asc") sortOption = { title: 1 };
        if (sort === "title_desc") sortOption = { title: -1 };

        const total = await Blog.countDocuments(filter);
        const blogs = await Blog.find(filter)
            .populate("author", "name email role")
            .populate("category", "name slug")
            .populate("subCategory", "name slug")
            .sort(sortOption)
            .skip(skip)
            .limit(limit);

        res.status(200).json({
            success: true,
            count: blogs.length,
            total,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            blogs,
        });
    } catch (error) {
        console.error("Get blogs error:", error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Get single blog by ID or slug
// @route   GET /api/blogs/:id
// @access  Private
const getBlogById = async (req, res) => {
    try {
        const query = req.params.id.match(/^[0-9a-fA-F]{24}$/)
            ? { _id: req.params.id }
            : { slug: req.params.id };

        const blog = await Blog.findOne(query)
            .populate("author", "name email role")
            .populate("category", "name slug")
            .populate("subCategory", "name slug");

        if (!blog) {
            return res.status(404).json({
                success: false,
                message: "Blog not found",
            });
        }

        res.status(200).json({
            success: true,
            blog,
        });
    } catch (error) {
        console.error("Get blog error:", error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Update blog
// @route   PUT /api/blogs/:id
// @access  Private (Admin, Author/Editor)
const updateBlog = async (req, res) => {
    try {
        const blog = await Blog.findById(req.params.id);

        if (!blog) {
            return res.status(404).json({
                success: false,
                message: "Blog not found",
            });
        }

        // Any authorized user can update the blog

        const {
            title,
            slug,
            excerpt,
            content,
            featuredImage,
            category,
            subCategory,
            tags,
            status,
            scheduledAt,
            seo,
        } = req.body;

        // Check duplicate slug if slug is changed
        if (slug && slug !== blog.slug) {
            const finalSlug = slug.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
            const existingBlog = await Blog.findOne({
                slug: finalSlug,
                _id: { $ne: blog._id },
            });

            if (existingBlog) {
                return res.status(400).json({
                    success: false,
                    message: "A blog with this slug already exists",
                });
            }
            blog.slug = finalSlug;
        }

        if (title !== undefined) blog.title = title.trim();
        if (excerpt !== undefined) blog.excerpt = excerpt.trim();
        if (content !== undefined) blog.content = content;
        if (featuredImage !== undefined) blog.featuredImage = featuredImage;
        if (category !== undefined) blog.category = category || null;
        if (subCategory !== undefined) blog.subCategory = subCategory || null;
        if (tags !== undefined) blog.tags = Array.isArray(tags) ? tags : blog.tags;
        if (status !== undefined) blog.status = status;
        if (scheduledAt !== undefined) blog.scheduledAt = scheduledAt;
        if (seo !== undefined) blog.seo = seo;

        const updatedBlog = await blog.save();

        const populatedBlog = await Blog.findById(updatedBlog._id)
            .populate("author", "name email role")
            .populate("category", "name slug")
            .populate("subCategory", "name slug");

        res.status(200).json({
            success: true,
            message: "Blog updated successfully",
            blog: populatedBlog,
        });
    } catch (error) {
        console.error("Update blog error:", error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Delete blog
// @route   DELETE /api/blogs/:id
// @access  Private (Admin, Author/Editor)
const deleteBlog = async (req, res) => {
    try {
        const blog = await Blog.findById(req.params.id);

        if (!blog) {
            return res.status(404).json({
                success: false,
                message: "Blog not found",
            });
        }

        // Any authorized user can delete the blog

        await blog.deleteOne();

        res.status(200).json({
            success: true,
            message: "Blog deleted successfully",
        });
    } catch (error) {
        console.error("Delete blog error:", error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Publish blog
// @route   PATCH /api/blogs/:id/publish
// @access  Private (Admin)
const publishBlog = async (req, res) => {
    try {
        const blog = await Blog.findById(req.params.id);

        if (!blog) {
            return res.status(404).json({
                success: false,
                message: "Blog not found",
            });
        }

        blog.status = "published";
        blog.scheduledAt = null;

        await blog.save();

        const populatedBlog = await Blog.findById(blog._id)
            .populate("author", "name email role")
            .populate("category", "name slug")
            .populate("subCategory", "name slug");

        res.status(200).json({
            success: true,
            message: "Blog published successfully",
            blog: populatedBlog,
        });
    } catch (error) {
        console.error("Publish blog error:", error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};
// @desc    Get all published blogs (Public)
// @route   GET /api/public/blogs
// @access  Public
const getPublicBlogs = async (req, res) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        const skip = (page - 1) * limit;

        const { category, search, tag } = req.query;

        // Force status to be published for public endpoints
        const filter = { status: "published" };

        if (category) {
            filter.category = category;
        }
        if (tag) {
            filter.tags = { $in: [tag] };
        }
        if (search) {
            filter.$or = [
                { title: { $regex: search, $options: "i" } },
                { excerpt: { $regex: search, $options: "i" } },
            ];
        }

        const total = await Blog.countDocuments(filter);
        const blogs = await Blog.find(filter)
            .populate("author", "name")
            .populate("category", "name slug")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        res.status(200).json({
            success: true,
            total,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            blogs,
        });
    } catch (error) {
        console.error("Get public blogs error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch blogs",
        });
    }
};

// @desc    Get single published blog by slug (Public)
// @route   GET /api/public/blogs/:slug
// @access  Public
const getPublicBlogBySlug = async (req, res) => {
    try {
        const blog = await Blog.findOne({ slug: req.params.slug, status: "published" })
            .populate("author", "name")
            .populate("category", "name slug");

        if (!blog) {
            return res.status(404).json({
                success: false,
                message: "Blog not found",
            });
        }

        res.status(200).json({
            success: true,
            blog,
        });
    } catch (error) {
        console.error("Get public blog error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch blog",
        });
    }
};

module.exports = {
    createBlog,
    getBlogs,
    getBlogById,
    updateBlog,
    deleteBlog,
    publishBlog,
    getPublicBlogs,
    getPublicBlogBySlug,
};