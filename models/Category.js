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
      trim: true,
      lowercase: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    subCategories: [
      {
        name: {
          type: String,
          required: [true, "Please add a subcategory name"],
          trim: true,
        },
        slug: {
          type: String,
          required: [true, "Please add a subcategory slug"],
          trim: true,
          lowercase: true,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Indexing for search & sort performance
categorySchema.index({ name: "text" });

module.exports = mongoose.model("Category", categorySchema);
