const mongoose = require("mongoose");
const slugify = require("slugify");

// 🆕 Color Size Schema (nested inside color)
const colorSizeSchema = new mongoose.Schema({
  size: { type: String, required: true },
  stock: { type: Number, default: 0, min: 0 },
  variantId: { type: Number, unique: true, sparse: true }
});

// 🆕 Color Schema with its own images and sizes
const colorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  code: { type: String, default: "#000000" },
  images: [
    {
      url: { type: String, required: true },
      publicId: { type: String, required: true },
      alt: { type: String }
    }
  ],
  sizes: [colorSizeSchema],
  order: { type: Number, default: 0 }
});

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
    // 🆕 Common images (fallback/extra images)
    commonImages: [
      {
        url: String,
        publicId: String,
        alt: String,
      },
    ],
    videos: [
      {
        url: String,
        publicId: String,
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
    // 🆕 REMOVED: separate sizes array, separate colors array
    // 🆕 NEW: colors with nested sizes and images
    colors: [colorSchema],
    
    // 🆕 Auto-generated from colors (for filtering)
    availableSizes: [{ type: String }],

    // Bulk Product Fields
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
    // 🆕 REMOVED: stock field (now inside color.sizes)
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
      enum: ["regular", "slim", "oversized", "loose", "fitted", "crop", "Mom", "Baggy", "Barel", "Curve", "Straight", "Wide leg", "Super baggy", "Korean baggy", "Narrow", "Boot cut"],
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

// 🆕 Total stock across all colors and sizes
productSchema.virtual("totalStock").get(function () {
  return this.colors.reduce((total, color) => {
    return total + color.sizes.reduce((sizeTotal, size) => sizeTotal + (size.stock || 0), 0);
  }, 0);
});

productSchema.virtual("piecesPerSet").get(function () {
  if (!this.isBulkProduct) return 0;
  const totalSizes = this.colors.reduce((sum, color) => sum + (color.sizes?.length || 0), 0);
  return totalSizes * (this.bulkConfig?.piecesPerSize || 1);
});

productSchema.virtual("isBulk").get(function () {
  return this.isBulkProduct === true;
});

productSchema.virtual("totalColors").get(function () {
  return this.colors?.length || 0;
});

// ========== PRE-SAVE HOOKS ==========

// Auto-generate availableSizes from colors
productSchema.pre("save", async function (next) {
  if (this.isModified("colors")) {
    const sizesSet = new Set();
    this.colors.forEach(color => {
      color.sizes.forEach(size => {
        if (size.size) sizesSet.add(size.size);
      });
    });
    this.availableSizes = Array.from(sizesSet);
  }
  next();
});

// Generate variant IDs for new sizes
productSchema.pre("save", async function (next) {
  const Counter = require("./Counter");
  
  const getNextSequence = async (seqName) => {
    const counter = await Counter.findByIdAndUpdate(
      seqName,
      { $inc: { sequence_value: 1 } },
      { new: true, upsert: true }
    );
    return counter.sequence_value;
  };

  for (const color of this.colors) {
    for (const size of color.sizes) {
      if (!size.variantId && size.size) {
        size.variantId = await getNextSequence('variantId');
      }
    }
  }
  next();
});

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
productSchema.index({ "colors.sizes.variantId": 1 });
productSchema.index({ availableSizes: 1 });

// Compound indexes
productSchema.index({ isActive: 1, isBulkProduct: 1 });
productSchema.index({ category: 1, isActive: 1, isBulkProduct: 1 });

// Text search index
productSchema.index({ name: "text", description: "text" });

// ========== INSTANCE METHODS ==========

// 🆕 Updated: Check stock for specific color and size
productSchema.methods.isInStock = function (colorName, size, quantity = 1) {
  const color = this.colors.find(c => c.name === colorName);
  if (!color) return false;
  const sizeObj = color.sizes.find(s => s.size === size);
  if (!sizeObj) return false;
  return sizeObj.stock >= quantity;
};

// 🆕 Updated: Decrease stock for specific color and size
productSchema.methods.decreaseStock = async function (colorName, size, quantity) {
  const color = this.colors.find(c => c.name === colorName);
  if (color) {
    const sizeObj = color.sizes.find(s => s.size === size);
    if (sizeObj) {
      sizeObj.stock -= quantity;
    }
  }
  await this.save();
  return this;
};

// 🆕 Updated: Increase stock for specific color and size
productSchema.methods.increaseStock = async function (colorName, size, quantity) {
  const color = this.colors.find(c => c.name === colorName);
  if (color) {
    const sizeObj = color.sizes.find(s => s.size === size);
    if (sizeObj) {
      sizeObj.stock += quantity;
    }
  }
  await this.save();
  return this;
};

// Calculate bulk price
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
  const piecesPerSet = this.colors.reduce((sum, color) => sum + (color.sizes?.length || 0), 0) * (this.bulkConfig?.piecesPerSize || 1);
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

// Get available colors (with stock)
productSchema.methods.getAvailableColors = function () {
  return this.colors.filter(color => 
    color.sizes.some(size => size.stock > 0)
  );
};

// Get sizes with stock for a specific color
productSchema.methods.getAvailableSizesForColor = function (colorName) {
  const color = this.colors.find(c => c.name === colorName);
  if (!color) return [];
  return color.sizes.filter(size => size.stock > 0).map(size => size.size);
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