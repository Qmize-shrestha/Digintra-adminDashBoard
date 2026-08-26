const User = require("../models/User");
const Blog = require("../models/Blog");
const Category = require("../models/Category");

// @desc    Get dashboard metrics & stats
// @route   GET /api/admin/stats
// @access  Private (Admin)
const getAdminStats = async (req, res) => {
    try {
        const [
            totalUsers,
            activeUsers,
            totalBlogs,
            publishedBlogs,
            draftBlogs,
            scheduledBlogs,
            totalCategories,
            recentBlogs,
            recentUsers,
        ] = await Promise.all([
            User.countDocuments(),
            User.countDocuments({ status: "active" }),
            Blog.countDocuments(),
            Blog.countDocuments({ status: "published" }),
            Blog.countDocuments({ status: "draft" }),
            Blog.countDocuments({ status: "scheduled" }),
            Category.countDocuments(),
            Blog.find()
                .select("title slug status author createdAt")
                .populate("author", "name email")
                .sort({ createdAt: -1 })
                .limit(5),
            User.find()
                .select("name email role status createdAt")
                .sort({ createdAt: -1 })
                .limit(5),
        ]);

        res.status(200).json({
            success: true,
            data: {
                users: {
                    total: totalUsers,
                    active: activeUsers,
                    inactive: totalUsers - activeUsers,
                },
                blogs: {
                    total: totalBlogs,
                    published: publishedBlogs,
                    draft: draftBlogs,
                    scheduled: scheduledBlogs,
                },
                categories: {
                    total: totalCategories,
                },
                recentBlogs,
                recentUsers,
            },
        });
    } catch (error) {
        console.error("Get admin stats error:", error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

module.exports = { getAdminStats };
