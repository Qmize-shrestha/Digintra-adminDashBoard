const User = require("../models/User");

// @desc    Get all users (Paginated, Searchable, Filterable)
// @route   GET /api/users
// @access  Private (Admin)
const getUsers = async (req, res) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        const skip = (page - 1) * limit;

        const { search, role, status } = req.query;

        const filter = {};

        if (role) {
            filter.role = role;
        }

        if (status) {
            filter.status = status;
        }

        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: "i" } },
                { email: { $regex: search, $options: "i" } },
            ];
        }

        const total = await User.countDocuments(filter);
        const users = await User.find(filter)
            .select("-password")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        res.status(200).json({
            success: true,
            count: users.length,
            total,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            users,
        });
    } catch (error) {
        console.error("Get users error:", error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Get single user by ID
// @route   GET /api/users/:id
// @access  Private (Admin)
const getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select("-password");

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        res.status(200).json({
            success: true,
            user,
        });
    } catch (error) {
        console.error("Get user by ID error:", error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Create user by Admin
// @route   POST /api/users
// @access  Private (Admin)
const createUser = async (req, res) => {
    try {
        const { name, email, password, role, status } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "Name, email, and password are required",
            });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: "User with this email already exists",
            });
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
            message: "User created successfully",
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                status: user.status,
                createdAt: user.createdAt,
            },
        });
    } catch (error) {
        console.error("Create user error:", error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Update user by Admin
// @route   PUT /api/users/:id
// @access  Private (Admin)
const updateUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        const { name, email, role, status, password } = req.body;

        if (email && email !== user.email) {
            const emailExists = await User.findOne({
                email,
                _id: { $ne: user._id },
            });
            if (emailExists) {
                return res.status(400).json({
                    success: false,
                    message: "Email is already taken by another user",
                });
            }
            user.email = email;
        }

        if (name) user.name = name;
        if (role) user.role = role;
        if (status) user.status = status;
        if (password) user.password = password; // pre-save will hash

        await user.save();

        res.status(200).json({
            success: true,
            message: "User updated successfully",
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                status: user.status,
                updatedAt: user.updatedAt,
            },
        });
    } catch (error) {
        console.error("Update user error:", error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Delete user by Admin
// @route   DELETE /api/users/:id
// @access  Private (Admin)
const deleteUser = async (req, res) => {
    try {
        // Prevent admin from deleting themselves
        if (req.user._id.toString() === req.params.id) {
            return res.status(400).json({
                success: false,
                message: "You cannot delete your own admin account",
            });
        }

        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
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
            message: error.message,
        });
    }
};

// @desc    Get current logged in user profile
// @route   GET /api/users/profile/me
// @access  Private
const getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select("-password");

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        res.status(200).json({
            success: true,
            user,
        });
    } catch (error) {
        console.error("Get profile error:", error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Update current logged in user profile
// @route   PUT /api/users/profile/me
// @access  Private
const updateProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select("+password");

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        const { name, email, currentPassword, newPassword } = req.body;

        if (email && email !== user.email) {
            const emailExists = await User.findOne({
                email,
                _id: { $ne: user._id },
            });
            if (emailExists) {
                return res.status(400).json({
                    success: false,
                    message: "Email is already taken",
                });
            }
            user.email = email;
        }

        if (name) user.name = name;

        // If user wants to change password
        if (newPassword) {
            if (!currentPassword) {
                return res.status(400).json({
                    success: false,
                    message: "Current password is required to set a new password",
                });
            }

            const isMatch = await user.matchPassword(currentPassword);
            if (!isMatch) {
                return res.status(400).json({
                    success: false,
                    message: "Current password is incorrect",
                });
            }

            if (newPassword.length < 6) {
                return res.status(400).json({
                    success: false,
                    message: "New password must be at least 6 characters",
                });
            }

            user.password = newPassword;
        }

        await user.save();

        res.status(200).json({
            success: true,
            message: "Profile updated successfully",
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                status: user.status,
            },
        });
    } catch (error) {
        console.error("Update profile error:", error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

module.exports = {
    getUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser,
    getProfile,
    updateProfile,
};
