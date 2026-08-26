const express = require("express");
const {
    getUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser,
    getProfile,
    updateProfile,
} = require("../controllers/userController");
const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/authorizationMiddleware");

const router = express.Router();

// Current user profile endpoints
router.get("/profile", protect, getProfile);
router.put("/profile", protect, updateProfile);

// Admin User Management endpoints
router.get("/", protect, authorize("user.read"), getUsers);
router.get("/:id", protect, authorize("user.read"), getUserById);
router.post("/", protect, authorize("user.create"), createUser);
router.put("/:id", protect, authorize("user.update"), updateUser);
router.delete("/:id", protect, authorize("user.delete"), deleteUser);

module.exports = router;
