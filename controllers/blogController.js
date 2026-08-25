const Blog = require("../models/Blog");

// CREATE BLOG
const createBlog = async (req, res) => {
    try {
        const {
            title,
            slug,
            excerpt,
            content,
            featuredImage,
            category,
            tags,
            status,
            scheduledAt,
            seo,
        } = req.body;

        // Basic validation
        if (!title || !slug || !content) {
            return res.status(400).json({
                success: false,
                message: "Title, slug and content are required",
            });
        }

        // Check duplicate slug
        const existingBlog = await Blog.findOne({ slug });

        if (existingBlog) {
            return res.status(400).json({
                success: false,
                message: "A blog with this slug already exists",
            });
        }

        // Create blog
        const blog = await Blog.create({
            title,
            slug,
            excerpt,
            content,
            featuredImage,
            author: req.user._id,
            category,
            tags,
            status: status || "draft",
            scheduledAt,
            seo,
        });

        res.status(201).json({
            success: true,
            message: "Blog created successfully",
            blog,
        });
    } catch (error) {
        console.error("Create blog error:", error);

        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};


// GET ALL BLOGS
const getBlogs = async (req, res) => {
    try {
        const blogs = await Blog.find()
            .populate("author", "name email")// by the use of author id we get the author name and email
            .populate("category", "name")// by the use of category id we get the category name
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: blogs.length,
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


// GET SINGLE BLOG
const getBlogById = async (req, res) => {
    try {
        const blog = await Blog.findById(req.params.id)
            .populate("author", "name email")
            .populate("category", "name");

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


// UPDATE BLOG
const updateBlog = async (req, res) => {
    try {
        const blog = await Blog.findById(req.params.id);

        if (!blog) {
            return res.status(404).json({
                success: false,
                message: "Blog not found",
            });
        }

        const {
            title,
            slug,
            excerpt,
            content,
            featuredImage,
            category,
            tags,
            status,
            scheduledAt,
            seo,
        } = req.body;

        // Check duplicate slug
        if (slug && slug !== blog.slug) {
            const existingBlog = await Blog.findOne({
                slug,
                _id: { $ne: blog._id },
            });

            if (existingBlog) {
                return res.status(400).json({
                    success: false,
                    message: "A blog with this slug already exists",
                });
            }
        }

        blog.title = title ?? blog.title;
        blog.slug = slug ?? blog.slug;
        blog.excerpt = excerpt ?? blog.excerpt;
        blog.content = content ?? blog.content;
        blog.featuredImage = featuredImage ?? blog.featuredImage;
        blog.category = category ?? blog.category;
        blog.tags = tags ?? blog.tags;
        blog.status = status ?? blog.status;
        blog.scheduledAt = scheduledAt ?? blog.scheduledAt;
        blog.seo = seo ?? blog.seo;

        const updatedBlog = await blog.save();

        res.status(200).json({
            success: true,
            message: "Blog updated successfully",
            blog: updatedBlog,
        });
    } catch (error) {
        console.error("Update blog error:", error);

        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};


// DELETE BLOG
const deleteBlog = async (req, res) => {
    try {
        const blog = await Blog.findById(req.params.id);

        if (!blog) {
            return res.status(404).json({
                success: false,
                message: "Blog not found",
            });
        }

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


// PUBLISH BLOG
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

        res.status(200).json({
            success: true,
            message: "Blog published successfully",
            blog,
        });
    } catch (error) {
        console.error("Publish blog error:", error);

        res.status(500).json({
            success: false,
            message: error.message,
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
};