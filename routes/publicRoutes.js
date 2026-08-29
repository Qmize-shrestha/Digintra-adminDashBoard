const express = require("express");
const { getPublicBlogs, getPublicBlogBySlug } = require("../controllers/blogController");

const router = express.Router();

router.get("/blogs", getPublicBlogs);
router.get("/blogs/:slug", getPublicBlogBySlug);

module.exports = router;
