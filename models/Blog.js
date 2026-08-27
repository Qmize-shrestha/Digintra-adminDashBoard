const mongoose = require("mongoose");

const blogSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },

    excerpt: {
      type: String,
      trim: true,
    },

    content: {
      type: String,
      required: true,
    },

    featuredImage: {
      type: String,
      default: "",
    },

    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
    },

    subCategorySlug: {
      type: String,
      trim: true,
      default: "",
    },

    tags: [
      {
        type: String,
        trim: true,
      },
    ],

    status: {
      type: String,
      enum: ["draft", "scheduled", "published", "archived"],
      default: "draft",
    },

    scheduledAt: {
      type: Date,
      default: null,
    },

    seo: {
      metaTitle: {
        type: String,
        trim: true,
      },

      metaDescription: {
        type: String,
        trim: true,
      },

      canonicalUrl: {
        type: String,
        trim: true,
      },

      ogTitle: {
        type: String,
        trim: true,
      },

      ogDescription: {
        type: String,
        trim: true,
      },

      ogImage: {
        type: String,
        trim: true,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for query performance & search
blogSchema.index({ status: 1, createdAt: -1 });
blogSchema.index({ author: 1 });
blogSchema.index({ category: 1 });
blogSchema.index({ title: "text", excerpt: "text" });

module.exports = mongoose.model("Blog", blogSchema);
