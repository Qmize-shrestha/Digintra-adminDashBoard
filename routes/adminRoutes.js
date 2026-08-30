const express = require("express");
const { 
    getAdminStats,
    getEditorStats,
    getAllUsers,
    createUser,
    updateUser,
    deleteUser
} = require("../controllers/adminController");
const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/authorizationMiddleware");

const router = express.Router();

router.get("/stats", protect, authorize("admin.dashboard"), getAdminStats);
router.get("/editor-stats", protect, authorize("editor.dashboard"), getEditorStats);

// User Management Routes
router.get("/users", protect, authorize("user.read"), getAllUsers);
router.post("/users", protect, authorize("user.create"), createUser);
router.put("/users/:id", protect, authorize("user.update"), updateUser);
router.delete("/users/:id", protect, authorize("user.delete"), deleteUser);

module.exports = router;
