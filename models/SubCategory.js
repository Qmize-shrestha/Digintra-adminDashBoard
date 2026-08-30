const mongoose = require("mongoose");

const subCategorySchema = new mongoose.Schema(
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
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "Parent category is required"],
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
subCategorySchema.index({ category: 1, slug: 1 }, { unique: true });
subCategorySchema.index({ category: 1, name: 1 });
subCategorySchema.index({ name: "text" });

module.exports = mongoose.model("SubCategory", subCategorySchema);
