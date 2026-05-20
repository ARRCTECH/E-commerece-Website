const Product = require("../models/Product");
const Category = require("../models/Category");
const Counter = require('../models/Counter');
const { uploadToCloudinary, uploadToCloudinaryVideo,deleteFromCloudinary} = require("../utils/cloudinary");
const mongoose = require("mongoose");


const extractPublicIdFromUrl = (url) => {
  if (!url || !url.includes("cloudinary.com")) return null;
  
  const parts = url.split('/');
  const uploadIndex = parts.findIndex(part => part === 'upload');
  if (uploadIndex === -1) return null;
  
  let publicId = parts.slice(uploadIndex + 2).join('/');
  const dotIndex = publicId.lastIndexOf('.');
  if (dotIndex !== -1) {
    publicId = publicId.substring(0, dotIndex);
  }
  
  return publicId;
};


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

  // 🆕 Bulk config parsing
  if (cleanedData.isBulkProduct !== undefined) {
    cleanedData.isBulkProduct = cleanedData.isBulkProduct === true || cleanedData.isBulkProduct === "true";
  }
  if (cleanedData.bulkConfig !== undefined) {
    cleanedData.bulkConfig = parseJson(cleanedData.bulkConfig, {});
  }

  return cleanedData;
};

// ===============================
// Get all products with filters (Regular + Bulk both)
// ===============================
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
      type, // 🆕 'bulk', 'regular', or 'all'
    } = req.query;

    const query = { isActive: true };

    // 🆕 Filter by product type
    if (type === 'bulk') {
      query.isBulkProduct = true;
    } else if (type === 'regular') {
      query.isBulkProduct = false;
    }

    if (category) {
      let categoryId = category;
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

    // 🆕 Price filter - handle regular and bulk differently
    if (minPrice || maxPrice) {
      if (type === 'bulk') {
        query["bulkConfig.pricePerSet"] = {};
        if (minPrice) query["bulkConfig.pricePerSet"].$gte = Number(minPrice);
        if (maxPrice) query["bulkConfig.pricePerSet"].$lte = Number(maxPrice);
      } else {
        query.price = {};
        if (minPrice) query.price.$gte = Number(minPrice);
        if (maxPrice) query.price.$lte = Number(maxPrice);
      }
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
      "price-low": type === 'bulk' ? { "bulkConfig.pricePerSet": 1 } : { price: 1 },
      "price-high": type === 'bulk' ? { "bulkConfig.pricePerSet": -1 } : { price: -1 },
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

// ===============================
// 🆕 Get only Bulk Products
// ===============================
const getBulkProducts = async (req, res) => {
  try {
    const {
      category,
      minPrice,
      maxPrice,
      sort,
      page = 1,
      limit = 12,
      search,
    } = req.query;

    const query = { isActive: true, isBulkProduct: true };

    if (category) {
      let categoryId = category;
      if (!mongoose.Types.ObjectId.isValid(category)) {
        const catDoc = await Category.findOne({ slug: category, isActive: true }).select("_id");
        if (!catDoc) {
          return res.status(404).json({ success: false, message: "Category not found" });
        }
        categoryId = catDoc._id;
      }
      query.category = categoryId;
    }

    if (minPrice || maxPrice) {
      query["bulkConfig.pricePerSet"] = {};
      if (minPrice) query["bulkConfig.pricePerSet"].$gte = Number(minPrice);
      if (maxPrice) query["bulkConfig.pricePerSet"].$lte = Number(maxPrice);
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    const sortOptions = {
      "price-low": { "bulkConfig.pricePerSet": 1 },
      "price-high": { "bulkConfig.pricePerSet": -1 },
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
    console.error("Get bulk products error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch bulk products" });
  }
};

// ===============================
// 🆕 Get only Regular Products
// ===============================
const getRegularProducts = async (req, res) => {
  try {
    const {
      category,
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

    const query = { isActive: true, isBulkProduct: false };

    if (category) {
      let categoryId = category;
      if (!mongoose.Types.ObjectId.isValid(category)) {
        const catDoc = await Category.findOne({ slug: category, isActive: true }).select("_id");
        if (!catDoc) {
          return res.status(404).json({ success: false, message: "Category not found" });
        }
        categoryId = catDoc._id;
      }
      query.category = categoryId;
    }

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
    console.error("Get regular products error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch regular products" });
  }
};

// ===============================
// Create product (Admin only) - Updated for Bulk
// ===============================
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
      isBulkProduct,      // 🆕
      bulkConfig,      // 🆕
    } = req.body;

    const getNextSequence = async (seqName) => {
      const counter = await Counter.findByIdAndUpdate(
        seqName,
        { $inc: { sequence_value: 1 } },
        { new: true, upsert: true }
      );
      return counter.sequence_value;
    };

    const newProductId = await getNextSequence('productId');
    const parsedSizes = parseJson(sizes, []);
    const parsedBulkConfig = parseJson(bulkConfig, {});
    const isBulk = isBulkProduct === true || isBulkProduct === "true";

    const sizesWithIds = [];
    for (const size of parsedSizes) {
      const newVariantId = await getNextSequence('variantId');
      sizesWithIds.push({
        ...size,
        variantId: newVariantId
      });
    }

    // Images
    const images = [];
    if (req.files['images'] && req.files['images'].length) {
      for (const file of req.files['images']) {
        const result = await uploadToCloudinary(file.buffer, "productsimage");
        images.push({ url: result.secure_url }); // use actual product name
      }
    }

    // Videos
    const videos = [];
    if (req.files['videos'] && req.files['videos'].length) {
      for (const file of req.files['videos']) {
        // Use a separate function that trims first 30 seconds
        const result = await uploadToCloudinaryVideo(file.buffer, "productsvideo");
        videos.push({ url: result.secure_url });
      }
    }

    const productData = {
      productId: newProductId,
      name: name.trim(),
      description: description.trim(),
      price: isBulk ? (parsedBulkConfig.pricePerSet || Number(price)) : Number(price),
      originalPrice: isBulk ? (parsedBulkConfig.originalPricePerSet || Number(originalPrice)) : (originalPrice ? Number(originalPrice) : undefined),
      images,
      videos,
      category,
      subcategory: subcategory ? subcategory.trim() : "",
      sizes: sizesWithIds,
      colors: parseJson(colors, []),
      tags: parseJson(tags, []),
      stock: Number(stock) || 0,
      weight: weight ? Number(weight) : undefined,
      dimensions: parseJson(dimensions, undefined),
      brand: brand ? brand.trim() : "",
      productDetails: productDetails ? productDetails.trim() : "",
      material: material ? material.trim() : "",
      fits: fits || "regular",
    };

    // 🆕 Add bulk fields if product is bulk
    if (isBulk) {
      productData.isBulkProduct = true;
      productData.bulkConfig = {
        piecesPerSize: parsedBulkConfig.piecesPerSize || 1,
        minColorsToSelect: parsedBulkConfig.minColorsToSelect || 1,
        maxColorsToSelect: parsedBulkConfig.maxColorsToSelect || null,
        pricePerSet: parsedBulkConfig.pricePerSet || Number(price),
        originalPricePerSet: parsedBulkConfig.originalPricePerSet || (originalPrice ? Number(originalPrice) : undefined),
      };
    }

    const product = new Product(productData);
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

const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    let updateData = req.body;

    console.log("📝 UPDATE PRODUCT - Request received");
    console.log("Product ID:", id);
    console.log("Update data:", JSON.stringify(updateData, null, 2));

    if (Array.isArray(updateData.price)) {
      updateData.price = updateData.price[0];
      console.log("✅ Converted price from array to:", updateData.price);
    }
    if (Array.isArray(updateData.originalPrice)) {
      updateData.originalPrice = updateData.originalPrice[0];
      console.log("✅ Converted originalPrice from array to:", updateData.originalPrice);
    }

    if (updateData.price !== undefined && updateData.price !== null && updateData.price !== "") {
      updateData.price = Number(updateData.price);
    }
    if (updateData.originalPrice !== undefined && updateData.originalPrice !== null && updateData.originalPrice !== "") {
      updateData.originalPrice = Number(updateData.originalPrice);
    }
    if (updateData.stock !== undefined && updateData.stock !== null && updateData.stock !== "") {
      updateData.stock = Number(updateData.stock);
    }
    if (updateData.weight !== undefined && updateData.weight !== null && updateData.weight !== "") {
      updateData.weight = Number(updateData.weight);
    }

    const existingProduct = await Product.findById(id);
    if (!existingProduct) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    updateData = prepareUpdateData(updateData, existingProduct);

    if (existingProduct.isBulkProduct && updateData.bulkConfig?.pricePerSet) {
      updateData.price = updateData.bulkConfig.pricePerSet;
      console.log("✅ Synced price with bulkConfig.pricePerSet:", updateData.price);
    }

    const currentName = existingProduct.name ? existingProduct.name.trim() : "";
    const newName = updateData.name ? updateData.name.trim() : "";
    const isNameActuallyChanged = newName && currentName !== newName;

    if (req.files) {
      if (req.files['images'] && req.files['images'].length > 0) {
        const newImages = [];
        for (const file of req.files['images']) {
          try {
            const result = await uploadToCloudinary(file.buffer, "productsimage");
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
      
      if (req.files['videos'] && req.files['videos'].length > 0) {
        const newVideos = [];
        for (const file of req.files['videos']) {
          try {
            const result = await uploadToCloudinaryVideo(file.buffer, "productsvideo");
            newVideos.push({
              url: result.secure_url
            });
          } catch (uploadError) {
            console.error("❌ Video upload failed:", uploadError);
          }
        }
        if (newVideos.length > 0) {
          updateData.videos = [...existingProduct.videos, ...newVideos];
        }
      }
    }

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
      const productToUpdate = await Product.findById(id);
      if (!productToUpdate) {
        return res.status(404).json({
          success: false,
          message: "Product not found during update"
        });
      }
      Object.keys(updateData).forEach(key => {
        if (key !== "slug" && updateData[key] !== undefined) {
          productToUpdate[key] = updateData[key];
        }
      });
      productToUpdate.markModified("name");
      updatedProduct = await productToUpdate.save();
    } else {
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

    await updatedProduct.populate("category", "name slug");

    res.status(200).json({
      success: true,
      message: "Product updated successfully",
      product: updatedProduct
    });

  } catch (error) {
    console.error("❌ Update product error:", error);

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

const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    if (product.images && product.images.length > 0) {
      for (const image of product.images) {
        if (image.url) {
          const publicId = extractPublicIdFromUrl(image.url);
          if (publicId) {
            await deleteFromCloudinary(publicId);
            console.log(`✅ Deleted product image: ${publicId}`);
          }
        }
      }
    }

    if (product.videos && product.videos.length > 0) {
      for (const video of product.videos) {
        if (video.url) {
          const publicId = extractPublicIdFromUrl(video.url);
          if (publicId) {
            await deleteFromCloudinary(publicId);
            console.log(`✅ Deleted product video: ${publicId}`);
          }
        }
      }
    }

    await Product.findByIdAndDelete(req.params.id);
    await Category.findByIdAndUpdate(product.category, { $inc: { productCount: -1 } });

    res.status(200).json({ success: true, message: "Product deleted successfully" });
  } catch (error) {
    console.error("Delete product error:", error);
    res.status(500).json({ success: false, message: "Failed to delete product" });
  }
};


// ===============================
// Add product review
// ===============================
const addReview = async (req, res) => {
  // Existing code - unchanged
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

// ===============================
// Search products
// ===============================
const getSearchedProducts = async (req, res) => {
  // Existing code - works for both regular and bulk
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

// ===============================
// Get products by category ID
// ===============================
const getProductsByCategory = async (req, res) => {
  // Existing code - works for both regular and bulk
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

// Get only oversized products
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
  getBulkProducts,
  getRegularProducts,
};