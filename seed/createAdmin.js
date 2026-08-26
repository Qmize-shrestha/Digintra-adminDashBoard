const dotenv = require("dotenv");
const connectDB = require("../config/db");
const User = require("../models/User");

dotenv.config();

const createAdmin = async () => {
    try {
        // Connect to MongoDB
        await connectDB();

        // Check if Super Admin already exists
        const existingUser = await User.findOne({
            email: "admin@digintra.com",
        });

        if (existingUser) {
            console.log("Admin already exists.");
            process.exit(0);
        }

        // Create Admin (pre-save hook in User model hashes the password)
        const user = await User.create({
            name: "Digintra Admin",
            email: "admin@digintra.com",
            password: "Admin@123",
            role: "admin",
            status: "active",
        });

        console.log("✅ Admin created successfully!");
        console.log("Email:", user.email);
        console.log("Role:", user.role);

        process.exit(0);
    } catch (error) {
        console.error("❌ Error creating Admin:", error.message);
        process.exit(1);
    }
};

createAdmin();