const User = require("../models/User");
const Blog = require("../models/Blog");
const Category = require("../models/Category");
const SubCategory = require("../models/SubCategory");

// @desc    Get editor specific dashboard metrics & stats
// @route   GET /api/admin/editor-stats
// @access  Private (Editor, Admin)
const getEditorStats = async (req, res) => {
    try {
        const editorId = req.user._id;

        const [
            myTotalBlogs,
            myPublishedBlogs,
            myDraftBlogs,
            totalCategories,
            totalSubCategories,
            recentBlogs,
        ] = await Promise.all([
            Blog.countDocuments({ author: editorId }),
            Blog.countDocuments({ author: editorId, status: "published" }),
            Blog.countDocuments({ author: editorId, status: "draft" }),
            Category.countDocuments(),
            SubCategory.countDocuments(),
            Blog.find({ author: editorId })
                .select("title slug status featuredImage createdAt")
                .populate("category", "name slug")
                .populate("subCategory", "name slug")
                .sort({ createdAt: -1 })
                .limit(5),
        ]);

        res.status(200).json({
            success: true,
            data: {
                blogs: {
                    total: myTotalBlogs,
                    published: myPublishedBlogs,
                    draft: myDraftBlogs,
                },
                categories: {
                    total: totalCategories,
                },
                subCategories: {
                    total: totalSubCategories,
                },
                recentBlogs,
            },
        });
    } catch (error) {
        console.error("Get editor stats error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch editor dashboard metrics",
        });
    }
};

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
            totalCategories,
            recentBlogs,
            recentUsers,
        ] = await Promise.all([
            User.countDocuments(),
            Promise.resolve(0), // Replaced commented query to keep array indexes aligned
            Blog.countDocuments(),
            Blog.countDocuments({ status: "published" }),
            Blog.countDocuments({ status: "draft" }),
            Category.countDocuments(),
            Blog.find()
                .select("title slug status author featuredImage createdAt")
                .populate("author", "name email")
                .sort({ createdAt: -1 })
                .limit(5),
            User.find({ role: { $ne: 'admin' } })
                .select("name email role status isOnline createdAt")
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

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private (Admin)
const getAllUsers = async (req, res) => {
    try {
        const users = await User.find({ role: { $ne: 'admin' } }).sort({ createdAt: -1 });
        res.status(200).json({
            success: true,
            data: users,
        });
    } catch (error) {
        console.error("Get all users error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch users",
        });
    }
};

// @desc    Create a new user
// @route   POST /api/admin/users
// @access  Private (Admin)
const createUser = async (req, res) => {
    try {
        const { name, email, password, role, status } = req.body;

        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ success: false, message: "User already exists" });
        }

        const user = await User.create({
            name,
            email,
            password,
            role: role || "editor",
            status: status || "active",
        });

        res.status(201).json({
            success: true,
            data: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                status: user.status
            }
        });
    } catch (error) {
        console.error("Create user error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to create user",
        });
    }
};

// @desc    Update a user
// @route   PUT /api/admin/users/:id
// @access  Private (Admin)
const updateUser = async (req, res) => {
    try {
        const { name, email, role, status, password } = req.body;

        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        user.name = name || user.name;
        user.email = email || user.email;
        user.role = role || user.role;
        user.status = status || user.status;

        if (password) {
            user.password = password;
        }

        await user.save();

        res.status(200).json({
            success: true,
            data: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                status: user.status
            }
        });
    } catch (error) {
        console.error("Update user error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to update user",
        });
    }
};

// @desc    Delete a user
// @route   DELETE /api/admin/users/:id
// @access  Private (Admin)
const deleteUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        await user.deleteOne();

        res.status(200).json({
            success: true,
            message: "User deleted successfully",
        });
    } catch (error) {
        console.error("Delete user error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to delete user",
        });
    }
};

module.exports = {
    getAdminStats,
    getEditorStats,
    getAllUsers,
    createUser,
    updateUser,
    deleteUser
};
