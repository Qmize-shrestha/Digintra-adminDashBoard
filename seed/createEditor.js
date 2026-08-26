const dotenv = require("dotenv");
const connectDB = require("../config/db");
const User = require("../models/User");

dotenv.config();

const createEditor = async () => {
    try {
        // Connect to MongoDB
        await connectDB();

        // Check if editor already exists
        const existingUser = await User.findOne({
            email: "editor@digintra.com",
        });

        if (existingUser) {
            console.log("Editor already exists.");
            process.exit(0);
        }

        // Create editor (pre-save hook in User model hashes the password)
        const user = await User.create({
            name: "Digintra Editor",
            email: "editor@digintra.com",
            password: "Editor@123",
            role: "editor",
            status: "active",
        });

        console.log("✅ Editor created successfully!");
        console.log("Email:", user.email);
        console.log("Role:", user.role);

        process.exit(0);
    } catch (error) {
        console.error("❌ Error creating editor:", error.message);
        process.exit(1);
    }
};

createEditor();