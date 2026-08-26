const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please add a category name"],
      trim: true,
      unique: true,
    },
    slug: {
      type: String,
      required: [true, "Please add a category slug"],
      unique: true,
      trim: true,
      lowercase: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  {
    timestamps: true,
  }
);

// Indexing for search & sort performance
categorySchema.index({ slug: 1 });
categorySchema.index({ name: "text" });

module.exports = mongoose.model("Category", categorySchema);
