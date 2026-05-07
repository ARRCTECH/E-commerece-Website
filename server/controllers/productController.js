const Product = require("../models/Product");
const Category = require("../models/Category");
const Counter = require('../models/Counter');
const { uploadToCloudinary } = require("../utils/cloudinary");
const mongoose = require("mongoose");

// Helper to parse JSON fields safely
const parseJson = (data, fallback) => {
  try {
    if (typeof data === 'string') {
      return JSON.parse(data);
    }
    return data || fallback;
  } catch {
    return fallback;
  }
};

// Helper function to clean and prepare update data
const prepareUpdateData = (updateData, existingProduct) => {
  const cleanedData = { ...updateData };

  // Trim all string fields
  if (cleanedData.name && typeof cleanedData.name === "string") {
    cleanedData.name = cleanedData.name.trim();
  }
  if (cleanedData.brand && typeof cleanedData.brand === "string") {
    cleanedData.brand = cleanedData.brand.trim();
  }
  if (cleanedData.productDetails && typeof cleanedData.productDetails === "string") {
    cleanedData.productDetails = cleanedData.productDetails.trim();
  }
  if (cleanedData.material && typeof cleanedData.material === "string") {
    cleanedData.material = cleanedData.material.trim();
  }
  if (cleanedData.description && typeof cleanedData.description === "string") {
    cleanedData.description = cleanedData.description.trim();
  }
  if (cleanedData.subcategory && typeof cleanedData.subcategory === "string") {
    cleanedData.subcategory = cleanedData.subcategory.trim();
  }

  // String conversions with defaults
  if (cleanedData.brand !== undefined) {
    cleanedData.brand = String(cleanedData.brand || "");
  }
  if (cleanedData.productDetails !== undefined) {
    cleanedData.productDetails = String(cleanedData.productDetails || "");
  }
  if (cleanedData.material !== undefined) {
    cleanedData.material = String(cleanedData.material || "");
  }
  if (cleanedData.fits !== undefined) {
    cleanedData.fits = String(cleanedData.fits || "regular");
  }

  // Number conversions
  if (cleanedData.price !== undefined) {
    cleanedData.price = Number(cleanedData.price);
  }
  if (cleanedData.originalPrice !== undefined) {
    cleanedData.originalPrice = cleanedData.originalPrice ? Number(cleanedData.originalPrice) : undefined;
  }
  if (cleanedData.stock !== undefined) {
    cleanedData.stock = Number(cleanedData.stock) || 0;
  }
  if (cleanedData.weight !== undefined) {
    cleanedData.weight = cleanedData.weight ? Number(cleanedData.weight) : undefined;
  }

  // Parse JSON data
  if (cleanedData.sizes !== undefined) {
    const newSizes = parseJson(cleanedData.sizes, []);
    // Preserve existing variantIds if they exist
    const updatedSizes = newSizes.map(newSize => {
      const existingSize = existingProduct.sizes.find(s => s.size === newSize.size);
      return {
        ...newSize,
        variantId: existingSize?.variantId || newSize.variantId
      };
    });
    cleanedData.sizes = updatedSizes;
  }
  if (cleanedData.colors !== undefined) {
    cleanedData.colors = parseJson(cleanedData.colors, existingProduct.colors);
  }
  if (cleanedData.tags !== undefined) {
    cleanedData.tags = parseJson(cleanedData.tags, existingProduct.tags);
  }
  if (cleanedData.dimensions !== undefined) {
    cleanedData.dimensions = parseJson(cleanedData.dimensions, existingProduct.dimensions);
  }
  if (cleanedData.modelSizeFit !== undefined) {
    cleanedData.modelSizeFit = parseJson(cleanedData.modelSizeFit, existingProduct.modelSizeFit);
  }
  if (cleanedData.materialCare !== undefined) {
    cleanedData.materialCare = parseJson(cleanedData.materialCare, existingProduct.materialCare);
  }

  // Handle existingImages and imageOrder
  if (cleanedData.existingImages !== undefined) {
    cleanedData.existingImages = parseJson(cleanedData.existingImages, []);
  }
  if (cleanedData.imageOrder !== undefined) {
    cleanedData.imageOrder = parseJson(cleanedData.imageOrder, []);
  }

  return cleanedData;
};

// Get all products with filters
const getProducts = async (req, res) => {
  try {
    const {
      category,
      tag,
      minPrice,
      maxPrice,
      sort,
      page = 1,
      limit = 12,
      search,
      sizes,
      colors,
      rating,
    } = req.query;

    const query = { isActive: true };

    if (category) {
      let categoryId = category;

      // If it's not a valid ObjectId, treat it as a slug:
      if (!mongoose.Types.ObjectId.isValid(category)) {
        const catDoc = await Category.findOne({ slug: category, isActive: true }).select("_id");
        if (!catDoc) {
          return res.status(404).json({ success: false, message: "Category not found" });
        }
        categoryId = catDoc._id;
      }

      query.category = categoryId;
    }

    if (tag) query.tags = { $in: [tag] };
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }
    if (sizes) {
      const arr = Array.isArray(sizes) ? sizes : [sizes];
      query["sizes.size"] = { $in: arr };
    }
    if (colors) {
      const arr = Array.isArray(colors) ? colors : [colors];
      query["colors.name"] = { $in: arr };
    }
    if (rating) {
      query["rating.average"] = { $gte: Number(rating) };
    }

    const sortOptions = {
      "price-low": { price: 1 },
      "price-high": { price: -1 },
      rating: { "rating.average": -1 },
      newest: { createdAt: -1 },
    };
    const sortOption = sortOptions[sort] || { createdAt: -1 };

    const [products, total] = await Promise.all([
      Product.find(query)
        .populate("category", "name slug")
        .sort(sortOption)
        .skip((page - 1) * limit)
        .limit(Number(limit)),
      Product.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      products,
      pagination: {
        current: Number(page),
        pages: Math.ceil(total / limit),
        total,
      },
    });
  } catch (error) {
    console.error("Get products error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch products" });
  }
};

const getProductsByCategorySlug = async (req, res) => {
  try {
    const cat = await Category.findOne({ slug: req.params.slug, isActive: true }).select("_id");
    if (!cat) return res.status(404).json({ success: false, message: "Category not found" });

    const products = await Product.find({
      category: cat._id,
      isActive: true
    }).populate("category", "name slug");

    res.status(200).json({ success: true, products });
  } catch (error) {
    console.error("Get products by category slug error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch category products" });
  }
};

// Get trending products
const getTrendingProducts = async (req, res) => {
  try {
    const products = await Product.find({
      isActive: true,
      tags: { $in: ["trending"] },
    })
      .populate("category", "name slug")
      .sort({ "rating.average": -1, createdAt: -1 })
      .limit(12);

    res.status(200).json({ success: true, products });
  } catch (error) {
    console.error("Get trending products error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch trending products" });
  }
};

// Get new arrivals
const getNewArrivals = async (req, res) => {
  try {
    const products = await Product.find({
      isActive: true,
      tags: { $in: ["new-arrival"] },
    })
      .populate("category", "name slug")
      .sort({ createdAt: -1 })
      .limit(12);

    res.status(200).json({ success: true, products });
  } catch (error) {
    console.error("Get new arrivals error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch new arrivals" });
  }
};

//get only oversized products
const getOversizedProducts = async (req, res) => {
  try {
    const products = await Product.find({
      isActive: true,
      fits: "oversized"
    })
      .populate("category", "name slug")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, products });
  } catch (error) {
    console.error("Get oversized products error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch oversized products" });
  }
};

// Get single product by ID
const getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate("category", "name slug")
      .populate("reviews.user", "name");

    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    res.status(200).json({ success: true, product });
  } catch (error) {
    console.error("Get product error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch product" });
  }
};

// Get single product by slug
const getProductBySlug = async (req, res) => {
  try {
    const product = await Product.findOne({ slug: req.params.slug })
      .populate("category", "name slug")
      .populate("reviews.user", "name");

    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    res.status(200).json({ success: true, product });
  } catch (error) {
    console.error("Get product by slug error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch product" });
  }
};

// Create product (Admin only)
const createProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      originalPrice,
      category,
      subcategory,
      sizes,
      colors,
      tags,
      stock,
      weight,
      dimensions,
      brand,
      productDetails,
      material,
      fits,
    } = req.body;

    // ========== 🆕 ID GENERATION CODE (फक्त हा भाग add केला) ==========
    const getNextSequence = async (seqName) => {
      const counter = await Counter.findByIdAndUpdate(
        seqName,
        { $inc: { sequence_value: 1 } },
        { new: true, upsert: true }
      );
      return counter.sequence_value;
    };

    // Product ID generate कर
    const newProductId = await getNextSequence('productId');

    // Variant IDs generate कर (sizes साठी)
    const parsedSizes = parseJson(sizes, []);
    const sizesWithIds = [];
    for (const size of parsedSizes) {
      const newVariantId = await getNextSequence('variantId');
      sizesWithIds.push({
        ...size,
        variantId: newVariantId
      });
    }
    // ========== 🆕 ID GENERATION CODE END ==========


    // Handle images
    const images = [];
    if (req.files && req.files.images && req.files.images.length) {
      for (const file of req.files.images) {
        const result = await uploadToCloudinary(file.buffer, "products");
        images.push({ url: result.secure_url, alt: name });
      }
    }

    // Handle multiple videos
    const videos = [];
    if (req.files && req.files.video && req.files.video.length > 0) {
      for (const file of req.files.video) {
        const result = await uploadToCloudinary(file.buffer, "products", { resource_type: "video" });
        videos.push({ url: result.secure_url, alt: name });
      }
    }

    const product = new Product({
      productId: newProductId,                    // 🆕 ही line add केली
      name: name.trim(),
      description: description.trim(),
      price: Number(price),
      originalPrice: originalPrice ? Number(originalPrice) : undefined,
      images,
      videos,
      category,
      subcategory: subcategory ? subcategory.trim() : "",
      sizes: sizesWithIds,                       // 🆕 बदलले (पूर्वी: sizes)
      colors: parseJson(colors, []),
      tags: parseJson(tags, []),
      stock: Number(stock) || 0,
      weight: weight ? Number(weight) : undefined,
      dimensions: parseJson(dimensions, undefined),
      brand: brand ? brand.trim() : "",
      productDetails: productDetails ? productDetails.trim() : "",
      material: material ? material.trim() : "",
      fits: fits || "regular",
    });

    await product.save();
    await Category.findByIdAndUpdate(category, { $inc: { productCount: 1 } });

    res.status(201).json({ success: true, message: "Product created successfully", product });
  } catch (error) {
    console.error("Create product error:", error);

    if (error.code === 11000) {
      if (error.keyPattern && error.keyPattern.slug) {
        return res.status(400).json({
          success: false,
          message: "Slug conflict. Please try again."
        });
      }
      if (error.keyPattern && error.keyPattern.name) {
        return res.status(400).json({
          success: false,
          message: "Product name already exists"
        });
      }
    }

    res.status(500).json({
      success: false,
      message: "Failed to create product",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

// Update product (Admin only)
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    let updateData = req.body;

    // Find the existing product
    const existingProduct = await Product.findById(id);
    if (!existingProduct) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }


    // Prepare and clean update data
    updateData = prepareUpdateData(updateData, existingProduct);

    // Check if name is actually being changed
    const currentName = existingProduct.name ? existingProduct.name.trim() : "";
    const newName = updateData.name ? updateData.name.trim() : "";
    const isNameActuallyChanged = newName && currentName !== newName;



    // Handle image uploads (update)
    if (req.files && req.files.images && req.files.images.length > 0) {
      const newImages = [];
      for (const file of req.files.images) {
        try {
          const result = await uploadToCloudinary(file.buffer, "products");
          newImages.push({
            url: result.secure_url,
            alt: updateData.name || existingProduct.name
          });
        } catch (uploadError) {
          console.error("❌ Image upload failed:", uploadError);
        }
      }
      if (newImages.length > 0) {
        updateData.images = [...existingProduct.images, ...newImages];
      }
    }

    // Handle multiple video uploads (update)
    if (req.files && req.files.video && req.files.video.length > 0) {
      const newVideos = [];
      for (const file of req.files.video) {
        try {
          const result = await uploadToCloudinary(file.buffer, "products", { resource_type: "video" });
          newVideos.push({
            url: result.secure_url,
            alt: updateData.name || existingProduct.name
          });
        } catch (uploadError) {
          console.error("❌ Video upload failed:", uploadError);
        }
      }
      // Append new videos to existing ones
      updateData.videos = [...(existingProduct.videos || []), ...newVideos];
    }

    // Handle existing images reordering
    if (updateData.imageOrder && updateData.imageOrder.length > 0) {
      const orderedImages = [];

      for (const item of updateData.imageOrder) {
        if (item.type === 'existing') {
          const existingImage = existingProduct.images.find(img =>
            img._id.toString() === item.id
          );
          if (existingImage) {
            orderedImages.push(existingImage);
          }
        }
      }

      // Add any new images that weren't in the order list
      if (updateData.images) {
        for (const newImage of updateData.images) {
          if (!orderedImages.find(img => img.url === newImage.url)) {
            orderedImages.push(newImage);
          }
        }
      }

      updateData.images = orderedImages;
    }

    let updatedProduct;

    if (isNameActuallyChanged) {

      // Use the document save method to ensure pre-save hooks are triggered
      const productToUpdate = await Product.findById(id);
      if (!productToUpdate) {
        return res.status(404).json({
          success: false,
          message: "Product not found during update"
        });
      }

      // Update all fields except slug (let the hook handle it)
      Object.keys(updateData).forEach(key => {
        if (key !== "slug" && updateData[key] !== undefined) {
          productToUpdate[key] = updateData[key];
        }
      });

      // Mark name as modified to ensure slug regeneration
      productToUpdate.markModified("name");

      updatedProduct = await productToUpdate.save();

    } else {

      // Use findByIdAndUpdate for better performance when name doesn't change
      updatedProduct = await Product.findByIdAndUpdate(
        id,
        updateData,
        {
          new: true,
          runValidators: true,
          context: "query",
        }
      );
    }

    // Populate category data
    await updatedProduct.populate("category", "name slug");

    res.status(200).json({
      success: true,
      message: "Product updated successfully",
      product: updatedProduct
    });

  } catch (error) {
    console.error("❌ Update product error:", error);

    // Handle specific errors
    if (error.code === 11000) {
      if (error.keyPattern && error.keyPattern.slug) {
        return res.status(400).json({
          success: false,
          message: "Slug already exists. Please try again."
        });
      }
      if (error.keyPattern && error.keyPattern.name) {
        return res.status(400).json({
          success: false,
          message: "Product name already exists"
        });
      }
      if (error.keyPattern && error.keyPattern.sku) {
        return res.status(400).json({
          success: false,
          message: "SKU already exists"
        });
      }
    }

    // Mongoose validation error
    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to update product",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

// Delete product (Admin only)
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    await Product.findByIdAndDelete(req.params.id);
    await Category.findByIdAndUpdate(product.category, { $inc: { productCount: -1 } });

    res.status(200).json({ success: true, message: "Product deleted successfully" });
  } catch (error) {
    console.error("Delete product error:", error);
    res.status(500).json({ success: false, message: "Failed to delete product" });
  }
};

// Add product review
const addReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;
    const userId = req.user.userId;

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    const existingReview = product.reviews.find(r => r.user.toString() === userId);
    if (existingReview) {
      return res.status(400).json({ success: false, message: "You have already reviewed this product" });
    }

    const reviewImages = [];
    if (req.files && req.files.length) {
      for (const file of req.files) {
        const result = await uploadToCloudinary(file.buffer, "reviews");
        reviewImages.push(result.secure_url);
      }
    }

    product.reviews.push({
      user: userId,
      rating: Number(rating),
      comment,
      images: reviewImages,
    });

    const totalRating = product.reviews.reduce((sum, r) => sum + r.rating, 0);
    product.rating = {
      average: totalRating / product.reviews.length,
      count: product.reviews.length,
    };

    await product.save();

    res.status(201).json({ success: true, message: "Review added successfully", product });
  } catch (error) {
    console.error("Add review error:", error);
    res.status(500).json({ success: false, message: "Failed to add review" });
  }
};

// Search products
const getSearchedProducts = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.status(400).json({ success: false, message: "Query string is required" });

    const products = await Product.find({
      isActive: true,
      $or: [
        { name: { $regex: q, $options: "i" } },
        { description: { $regex: q, $options: "i" } },
      ],
    }).populate("category", "name slug");

    res.status(200).json({ success: true, products });
  } catch (error) {
    console.error("Search products error:", error);
    res.status(500).json({ success: false, message: "Failed to search products" });
  }
};

// Get products by category ID
const getProductsByCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const {
      sort,
      page = 1,
      limit = 12,
      sizes,
      colors,
      minPrice,
      maxPrice,
      rating,
    } = req.query;

    const query = { category: categoryId, isActive: true };

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }
    if (sizes) {
      const arr = Array.isArray(sizes) ? sizes : [sizes];
      query["sizes.size"] = { $in: arr };
    }
    if (colors) {
      const arr = Array.isArray(colors) ? colors : [colors];
      query["colors.name"] = { $in: arr };
    }
    if (rating) {
      query["rating.average"] = { $gte: Number(rating) };
    }

    const sortOptions = {
      "price-low": { price: 1 },
      "price-high": { price: -1 },
      rating: { "rating.average": -1 },
      newest: { createdAt: -1 },
    };
    const sortOption = sortOptions[sort] || { createdAt: -1 };

    const [products, total] = await Promise.all([
      Product.find(query)
        .populate("category", "name slug")
        .sort(sortOption)
        .skip((page - 1) * limit)
        .limit(Number(limit)),
      Product.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      products,
      pagination: {
        current: Number(page),
        pages: Math.ceil(total / limit),
        total,
      },
    });
  } catch (error) {
    console.error("Get products by category error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch category products" });
  }
};

module.exports = {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  addReview,
  getTrendingProducts,
  getNewArrivals,
  getOversizedProducts,
  getSearchedProducts,
  getProductsByCategory,
  getProductsByCategorySlug,
  getProductBySlug,
};