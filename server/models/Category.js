const mongoose = require("mongoose");
const slugify = require("slugify");

const categorySchema = new mongoose.Schema(
  {
    categoryId: {                           
      type: Number,
      unique: true,
      sparse: true
    },
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    description: String,
    image: {
      url: String,
      alt: String,
    },
    parentCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      default: null,
    },
    subcategories: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
      },
    ],
    isActive: { type: Boolean, default: true },
    showOnHomepage: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
    seoTitle: String,
    seoDescription: String,
    productCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// 🔹 Indexes
categorySchema.index({ slug: 1 }, { unique: true, collation: { locale: "en", strength: 2 } });
categorySchema.index({ showOnHomepage: 1 });
categorySchema.index({ categoryId: 1 });

// 🔹 Generate unique slug before saving
categorySchema.pre("save", async function (next) {
  if (this.isModified("name")) {
    this.name = this.name.trim().replace(/\s+/g, " ");
    let baseSlug = slugify(this.name, { lower: true, strict: true });
    if (!baseSlug) baseSlug = "category-" + Date.now().toString().slice(-6);

    let newSlug = baseSlug;
    let suffix = 1;

    // Ensure unique slug
    let slugExists = await mongoose.models.Category.findOne({ slug: newSlug, _id: { $ne: this._id } });
    while (slugExists) {
      newSlug = `${baseSlug}-${suffix}`;
      slugExists = await mongoose.models.Category.findOne({ slug: newSlug, _id: { $ne: this._id } });
      suffix++;
    }

    this.slug = newSlug;
  }

  // Default SEO fields
  if (!this.seoTitle) this.seoTitle = this.name;
  if (!this.seoDescription) this.seoDescription = `Shop ${this.name} products online.`;

  next();
});

module.exports = mongoose.model("Category", categorySchema);
