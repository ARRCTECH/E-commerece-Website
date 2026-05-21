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
    videos: [
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
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",  
    },
    sizes: [
      {
        size: String,
        stock: {
          type: Number,
          default: 0,
        },
        variantId: {
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

    // ========== 🆕 BULK PRODUCT FIELDS ==========
    isBulkProduct: {
      type: Boolean,
      default: false,
      index: true,
    },
    bulkConfig: {
      piecesPerSize: {
        type: Number,
        default: 1,
        min: 1,
        max: 100,
      },
      minColorsToSelect: {
        type: Number,
        default: 1,
        min: 1,
      },
      maxColorsToSelect: {
        type: Number,
        default: null,
      },
      pricePerSet: {
        type: Number,
        min: 0,
      },
      originalPricePerSet: {
        type: Number,
        min: 0,
      },
    },
    // ========== BULK FIELDS END ==========

    tags: [
      {
        type: String,
        enum: ["trending", "new-arrival", "sale", "featured", "bulk"],
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

// ========== VIRTUAL FIELDS ==========

productSchema.virtual("piecesPerSet").get(function () {
  if (!this.isBulkProduct) return 0;
  return (this.sizes?.length || 0) * (this.bulkConfig?.piecesPerSize || 1);
});

productSchema.virtual("isBulk").get(function () {
  return this.isBulkProduct === true;
});

productSchema.virtual("totalColors").get(function () {
  return this.colors?.length || 0;
});

productSchema.virtual("totalSizes").get(function () {
  return this.sizes?.length || 0;
});

// ========== PRE-SAVE HOOKS ==========

// Enhanced slug generation
productSchema.pre("save", async function (next) {
  try {
    if (this.name && typeof this.name === "string") {
      const trimmedName = this.name.trim();
      if (trimmedName !== this.name) {
        this.name = trimmedName;
      }
    }

    const isNameModified = this.isModified("name");
    let actualNameChange = false;

    if (!this.isNew && isNameModified) {
      const currentDoc = await this.constructor.findById(this._id).select("name");
      if (currentDoc) {
        const currentName = currentDoc.name ? currentDoc.name.trim() : "";
        const newName = this.name ? this.name.trim() : "";
        actualNameChange = currentName !== newName;
      }
    }

    if (this.isNew || isNameModified || actualNameChange) {
      const baseSlug = slugify(this.name, {
        lower: true,
        strict: true,
        trim: true,
      });

      if (!baseSlug) {
        this.slug = "product-" + Date.now().toString().slice(-6);
        return next();
      }

      let newSlug = baseSlug;
      let isUnique = false;
      let attempts = 0;
      const maxAttempts = 10;

      while (!isUnique && attempts < maxAttempts) {
        const randomSuffix = Math.floor(100 + Math.random() * 900);

        if ((isNameModified || actualNameChange) && !this.isNew) {
          newSlug = `${baseSlug}-${randomSuffix}`;
        } else {
          newSlug = attempts === 0 ? baseSlug : `${baseSlug}-${randomSuffix}`;
        }

        const existingProduct = await mongoose.model("Product").findOne({
          slug: newSlug,
          _id: { $ne: this._id },
        });

        if (!existingProduct) {
          isUnique = true;
        }
        attempts++;
      }

      if (!isUnique) {
        const timestampSuffix = Date.now().toString().slice(-6);
        newSlug = `${baseSlug}-${timestampSuffix}`;
      }

      this.slug = newSlug;
    }
    next();
  } catch (error) {
    console.error("❌ Slug generation error:", error);
    next(error);
  }
});

// SKU generation
productSchema.pre("save", function (next) {
  if (this.isNew && !this.sku) {
    this.sku = "FH" + Date.now() + Math.floor(Math.random() * 1000);
  }
  next();
});

// ========== INDEXES ==========

productSchema.index({ name: 1, slug: 1 }, { unique: true });
productSchema.index({ isBulkProduct: 1 });
productSchema.index({ category: 1, isActive: 1 });
productSchema.index({ tags: 1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ price: 1 });
productSchema.index({ "rating.average": -1 });

// Compound indexes
productSchema.index({ isActive: 1, isBulkProduct: 1 });
productSchema.index({ category: 1, isActive: 1, isBulkProduct: 1 });

// Text search index
productSchema.index({ name: "text", description: "text" });

// ========== INSTANCE METHODS ==========

productSchema.methods.isInStock = function (quantity = 1) {
  return this.stock >= quantity;
};

productSchema.methods.decreaseStock = async function (quantity) {
  this.stock -= quantity;
  this.totalSold = (this.totalSold || 0) + quantity;
  await this.save();
  return this;
};

productSchema.methods.increaseStock = async function (quantity) {
  this.stock += quantity;
  await this.save();
  return this;
};

// Calculate bulk price (for bulk products)
productSchema.methods.calculateBulkPrice = function (selectedColorCount, sets = 1) {
  if (!this.isBulkProduct) {
    return {
      totalPrice: this.price * sets,
      totalPieces: sets,
      totalSets: sets,
      pricePerUnit: this.price
    };
  }

  const totalSets = selectedColorCount * sets;
  const totalPrice = (this.bulkConfig?.pricePerSet || this.price) * totalSets;
  const piecesPerSet = (this.sizes?.length || 0) * (this.bulkConfig?.piecesPerSize || 1);
  const totalPieces = piecesPerSet * totalSets;

  return {
    totalPrice,
    totalPieces,
    totalSets,
    piecesPerSet,
    pricePerSet: this.bulkConfig?.pricePerSet || this.price,
    selectedColors: selectedColorCount
  };
};

// Get available colors (in stock)
productSchema.methods.getAvailableColors = function () {
  return this.colors.filter(color => color.inStock !== false);
};

// ========== STATIC METHODS ==========

productSchema.statics.getActiveProducts = async function (filters = {}) {
  const query = { isActive: true, ...filters };
  return this.find(query)
    .populate("category", "name slug")
    .sort({ createdAt: -1 });
};

productSchema.statics.getBulkProducts = async function (filters = {}) {
  const query = { isActive: true, isBulkProduct: true, ...filters };
  return this.find(query)
    .populate("category", "name slug")
    .sort({ createdAt: -1 });
};

productSchema.statics.getRegularProducts = async function (filters = {}) {
  const query = { isActive: true, isBulkProduct: false, ...filters };
  return this.find(query)
    .populate("category", "name slug")
    .sort({ createdAt: -1 });
};

productSchema.statics.searchProducts = async function (searchTerm) {
  return this.find(
    { $text: { $search: searchTerm }, isActive: true },
    { score: { $meta: "textScore" } }
  )
    .sort({ score: { $meta: "textScore" } })
    .populate("category", "name slug");
};

module.exports = mongoose.model("Product", productSchema);