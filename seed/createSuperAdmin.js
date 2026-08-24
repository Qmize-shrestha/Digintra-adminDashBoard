const dotenv = require("dotenv");
const bcrypt = require("bcryptjs");

const connectDB = require("../config/db");
const User = require("../models/User");

dotenv.config();

const createSuperAdmin = async () => {
    try {
        // Connect to MongoDB
        await connectDB();

        // Check if Super Admin already exists
        const existingUser = await User.findOne({
            email: "admin@digintra.com",
        });

        if (existingUser) {
            console.log("Super Admin already exists.");
            process.exit(0);
        }

        // Hash password
        const hashedPassword = await bcrypt.hash("Admin@123", 10);

        // Create Super Admin
        const user = await User.create({
            name: "Digintra Super Admin",
            email: "admin@digintra.com",
            password: hashedPassword,
            role: "superadmin",
            status: "active",
        });

        console.log("Super Admin created successfully!");
        console.log("Email:", user.email);
        console.log("Role:", user.role);

        process.exit(0);
    } catch (error) {
        console.error("Error creating Super Admin:", error.message);
        process.exit(1);
    }
};

createSuperAdmin();