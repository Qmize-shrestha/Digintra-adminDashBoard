const User = require("../models/User");
const Blog = require("../models/Blog");

const getAdminStats = async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalBlogs = await Blog.countDocuments();
        
        res.status(200).json({
            success: true,
            data: {
                totalUsers,
                totalBlogs,
                activeSessions: 342, // Placeholder
                totalRevenue: 12450 // Placeholder
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = { getAdminStats };
