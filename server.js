const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const connectDB = require("./config/db");
const User = require("./models/User");
const authRoutes = require("./routes/authRoutes");
const { protect } = require("./middleware/authMiddleware");
const { authorize } = require("./middleware/authorizationMiddleware");
const blogRoutes = require("./routes/blogRoutes");

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// Security middleware
app.use(helmet());

// CORS
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: "Too many requests. Please try again later.",
});

app.use("/api", limiter);

// Body parser
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Cookie parser
app.use(cookieParser());

// Test route
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Digintra Admin Backend is running",
  });
});
app.get("/api/protected", protect, (req, res) => {
  res.json({
    success: true,
    message: "You are authenticated.",
    user: req.user,
  });
});

app.get(
  "/api/test/delete-blog",
  protect,
  authorize("blog.delete"),
  (req, res) => {
    res.json({
      success: true,
      message: "You can delete blogs",
      role: req.user.role,
    });
  }
);
app.get(
  "/api/test/publish-blog",
  protect,
  authorize("blog.publish"),
  (req, res) => {
    res.json({
      success: true,
      message: "You can publish blogs",
      role: req.user.role,
    });
  }
);



// API test route
app.use("/api/auth", authRoutes);
app.use("/api/blogs", blogRoutes);

// Server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});