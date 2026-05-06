const mongoose = require("mongoose");
const slugify = require("slugify");

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    productId: {
      type: Number,
      unique: true,
      sparse: true
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      index: true,
    },
    description: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    originalPrice: {
      type: Number,
    },
    images: [
      {
        url: String,
        alt: String,
      },
    ],
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    subcategory: {
      type: String,
    },
    sizes: [
      {
        size: String,
        stock: {
          type: Number,
          default: 0,
        },
        variantId: {        // ← नवीन फील्ड
          type: Number,
          unique: true,
          sparse: true
        }
      },
    ],
    colors: [
      {
        name: String,
        code: String,
        images: [String],
      },
    ],
    tags: [
      {
        type: String,
        enum: ["trending", "new-arrival", "sale", "featured"],
      },
    ],
    rating: {
      average: {
        type: Number,
        default: 0,
      },
      count: {
        type: Number,
        default: 0,
      },
    },
    reviews: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        rating: {
          type: Number,
          min: 1,
          max: 5,
        },
        comment: String,
        images: [String],
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
    stock: {
      type: Number,
      default: 0,
    },
    sku: {
      type: String,
      unique: true,
    },
    weight: Number,
    dimensions: {
      length: Number,
      width: Number,
      height: Number,
    },
    brand: {
      type: String,
      trim: true,
      default: "",
    },
    productDetails: {
      type: String,
      default: "",
    },
    material: {
      type: String,
      default: "",
    },
    fits: {
      type: String,
      enum: ["regular", "slim", "oversized", "loose", "fitted", "crop"],
      default: "regular",
    },
    modelSizeFit: {
      modelHeight: String,
      modelChest: String,
      modelWaist: String,
      modelHips: String,
      modelSizeWorn: String,
      fitType: {
        type: String,
        enum: ["regular", "slim", "oversized", "loose", "fitted"],
        default: "regular",
      },
    },
    materialCare: {
      material: [String],
      careInstructions: [String],
      features: [String],
    },
  },
  {
    timestamps: true,
  }
);

// 🔹 Enhanced slug generation with robust name change detection
productSchema.pre("save", async function (next) {
  try {
    // Trim the name first to handle whitespace issues
    if (this.name && typeof this.name === "string") {
      const trimmedName = this.name.trim();
      // Only update if trimming actually changed something
      if (trimmedName !== this.name) {
        this.name = trimmedName;
      }
    }

    // Check if name is modified according to Mongoose
    const isNameModified = this.isModified("name");

    // For existing documents, check if the trimmed name actually changed
    let actualNameChange = false;
    if (!this.isNew && isNameModified) {
      const currentDoc = await this.constructor.findById(this._id).select("name");
      if (currentDoc) {
        const currentName = currentDoc.name ? currentDoc.name.trim() : "";
        const newName = this.name ? this.name.trim() : "";
        actualNameChange = currentName !== newName;

      }
    }

    // Generate slug for new documents or if name has been actually modified
    if (this.isNew || isNameModified || actualNameChange) {
      // Generate base slug from name
      const baseSlug = slugify(this.name, {
        lower: true,
        strict: true,
        trim: true,
      });

      // If base slug is empty, use fallback
      if (!baseSlug) {
        this.slug = "product-" + Date.now().toString().slice(-6);
        return next();
      }

      let newSlug = baseSlug;
      let isUnique = false;
      let attempts = 0;
      const maxAttempts = 10;

      // Keep trying until we find a unique slug
      while (!isUnique && attempts < maxAttempts) {
        // Generate random 3-digit number (100-999)
        const randomSuffix = Math.floor(100 + Math.random() * 900);

        // For updates where name changed, always generate new slug with random suffix
        if ((isNameModified || actualNameChange) && !this.isNew) {
          newSlug = `${baseSlug}-${randomSuffix}`;
        } else {
          // For new products, try without suffix first, then with suffix if needed
          newSlug = attempts === 0 ? baseSlug : `${baseSlug}-${randomSuffix}`;
        }

        // Check if slug already exists
        const existingProduct = await mongoose.model("Product").findOne({
          slug: newSlug,
          _id: { $ne: this._id },
        });

        if (!existingProduct) {
          isUnique = true;
        } else {
        }

        attempts++;
      }

      // If still not unique after max attempts, use timestamp as fallback
      if (!isUnique) {
        const timestampSuffix = Date.now().toString().slice(-6);
        newSlug = `${baseSlug}-${timestampSuffix}`;
      }

      this.slug = newSlug;
    } else {
    }
    next();
  } catch (error) {
    console.error("❌ Slug generation error:", error);
    next(error);
  }
});

// 🔹 SKU generate before saving (only for new products)
productSchema.pre("save", function (next) {
  if (this.isNew && !this.sku) {
    this.sku = "FH" + Date.now() + Math.floor(Math.random() * 1000);
  }
  next();
});

// 🔹 Compound index to ensure name and slug uniqueness together
productSchema.index({ name: 1, slug: 1 }, { unique: true });

module.exports = mongoose.model("Product", productSchema);