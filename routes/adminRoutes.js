const express = require("express");
const { getAdminStats } = require("../controllers/adminController");
const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/authorizationMiddleware");

const router = express.Router();

router.get("/stats", protect, authorize("admin.dashboard"), getAdminStats);

module.exports = router;
