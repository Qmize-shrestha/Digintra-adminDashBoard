const express = require("express");

const {
    createBlog,
    getBlogs,
    getBlogById,
    updateBlog,
    deleteBlog,
    publishBlog,
} = require("../controllers/blogController");

const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/authorizationMiddleware");

const router = express.Router();


// GET ALL BLOGS
router.get(
    "/",
    protect,
    authorize("blog.read"),
    getBlogs
);


// GET SINGLE BLOG
router.get(
    "/:id",
    protect,
    authorize("blog.read"),
    getBlogById
);


// CREATE BLOG
router.post(
    "/",
    protect,
    authorize("blog.create"),
    createBlog
);


// UPDATE BLOG
router.put(
    "/:id",
    protect,
    authorize("blog.update"),
    updateBlog
);


// DELETE BLOG
router.delete(
    "/:id",
    protect,
    authorize("blog.delete"),
    deleteBlog
);


// PUBLISH BLOG
router.patch(
    "/:id/publish",
    protect,
    authorize("blog.publish"),
    publishBlog
);


module.exports = router;