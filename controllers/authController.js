const crypto = require("crypto");
const User = require("../models/User");
const generateToken = require("../utils/generateToken");
const sendEmail = require("../utils/sendEmail");

// @desc    User login
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check required fields
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required",
            });
        }

        // Find user with password
        const user = await User.findOne({ email }).select("+password");

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password",
            });
        }

        // Check account status
        if (user.status !== "active") {
            return res.status(403).json({
                success: false,
                message: "Your account is inactive. Please contact an administrator.",
            });
        }

        // Compare password
        const isPasswordCorrect = await user.matchPassword(password);

        if (!isPasswordCorrect) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password",
            });
        }

        // Generate JWT
        const token = generateToken(user);

        res.status(200).json({
            success: true,
            message: "Login successful",
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                status: user.status,
            },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    User registration
// @route   POST /api/auth/signup
// @access  Public
const signup = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Check required fields
        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "Name, email, and password are required",
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: "User already exists with this email",
            });
        }

        // Create new user (pre-save hook hashes password, role defaults to 'editor')
        const user = await User.create({
            name,
            email,
            password,
        });

        // Generate JWT
        const token = generateToken(user);

        res.status(201).json({
            success: true,
            message: "User registered successfully",
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                status: user.status,
            },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Forgot password
// @route   POST /api/auth/forgotpassword
// @access  Public
const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Please provide an email address",
            });
        }

        const user = await User.findOne({ email });

        // Generic response to prevent email enumeration
        if (!user) {
            return res.status(200).json({
                success: true,
                message: "If an account with that email exists, a password reset link has been sent.",
            });
        }

        // Get reset token
        const resetToken = user.getResetPasswordToken();
        await user.save({ validateBeforeSave: false });

        // Construct frontend reset URL
        const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
        const resetUrl = `${clientUrl}/reset-password/${resetToken}`;

        const message = `You are receiving this email because you (or someone else) requested a password reset for your Digintra account.\n\nPlease click the link below or paste it into your browser to reset your password:\n\n${resetUrl}\n\nThis link will expire in 10 minutes.\n\nIf you did not request this, please ignore this email.`;

        try {
            await sendEmail({
                email: user.email,
                subject: "Digintra Account - Password Reset Request",
                message,
            });

            res.status(200).json({
                success: true,
                message: "If an account with that email exists, a password reset link has been sent.",
            });
        } catch (error) {
            console.error("Email send error:", error);
            user.resetPasswordToken = undefined;
            user.resetPasswordExpire = undefined;
            await user.save({ validateBeforeSave: false });

            return res.status(500).json({
                success: false,
                message: "Password reset email could not be sent. Please try again later.",
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Reset password
// @route   PUT /api/auth/resetpassword/:resettoken
// @access  Public
const resetPassword = async (req, res) => {
    try {
        const { password } = req.body;

        if (!password || password.length < 6) {
            return res.status(400).json({
                success: false,
                message: "Password is required and must be at least 6 characters",
            });
        }

        // Hash token from param to compare with database
        const resetPasswordToken = crypto
            .createHash("sha256")
            .update(req.params.resettoken)
            .digest("hex");

        const user = await User.findOne({
            resetPasswordToken,
            resetPasswordExpire: { $gt: Date.now() },
        });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: "Invalid or expired password reset token",
            });
        }

        // Set new password (pre-save hook will hash it)
        user.password = password;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;

        await user.save();

        const token = generateToken(user);

        res.status(200).json({
            success: true,
            message: "Password updated successfully",
            token,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

module.exports = {
    login,
    signup,
    forgotPassword,
    resetPassword,
};