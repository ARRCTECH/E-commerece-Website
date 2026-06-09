const Product = require("../models/Product");
const Category = require("../models/Category");
const Counter = require('../models/Counter');
const { uploadToCloudinary, deleteFromCloudinary, uploadToCloudinaryVideoWithRetry } = require("../utils/cloudinary");
const mongoose = require("mongoose");
const slugify = require("slugify");

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

const getNextSequence = async (seqName) => {
  const counter = await Counter.findByIdAndUpdate(
    seqName,
    { $inc: { sequence_value: 1 } },
    { new: true, upsert: true }
  );
  return counter.sequence_value;
};

// ===============================
// CREATE PRODUCT (Updated for color images)
// ===============================
const createProduct = async (req, res) => {
  try {
    console.log("📦 Creating product with color images...");
    
    const {
      name,
      description,
      price,
      originalPrice,
      category,
      subcategory,
      colors,
      tags,
      brand,
      productDetails,
      material,
      fits,
      isBulkProduct,
      bulkConfig,
      weight,
      dimensions,
    } = req.body;

    const newProductId = await getNextSequence('productId');
    
    // Parse colors JSON
    let parsedColors = [];
    try {
      parsedColors = typeof colors === 'string' ? JSON.parse(colors) : (colors || []);
    } catch (e) {
      console.error("Error parsing colors:", e);
    }

    const isBulk = isBulkProduct === true || isBulkProduct === "true";
    const parsedBulkConfig = typeof bulkConfig === 'string' ? JSON.parse(bulkConfig || '{}') : (bulkConfig || {});
    const productSlug = slugify(name, { lower: true });

    // Process each color and upload its images
    const processedColors = [];
    
    for (let i = 0; i < parsedColors.length; i++) {
      const color = parsedColors[i];
      const colorSlug = slugify(color.name, { lower: true });
      
      // Upload color-specific images
      const colorImages = [];
      
      // Check for files in req.files with pattern colorImage_{colorIndex}_{imgIndex}
      if (req.files) {
        for (const [fieldName, files] of Object.entries(req.files)) {
          const match = fieldName.match(/colorImage_(\d+)_(\d+)/);
          if (match && parseInt(match[1]) === i) {
            for (const file of files) {
              const result = await uploadToCloudinary(file.buffer, `products/${productSlug}/${colorSlug}`);
              colorImages.push({
                url: result.secure_url,
                publicId: result.public_id,
                alt: `${name} - ${color.name}`
              });
            }
          }
        }
      }
      
      // Also check for existing images from edit mode
      if (color.existingImages && color.existingImages.length) {
        for (const existingImg of color.existingImages) {
          colorImages.push({
            url: existingImg.url,
            publicId: existingImg.publicId,
            alt: existingImg.alt || `${name} - ${color.name}`
          });
        }
      }
      
      // Process sizes and generate variant IDs
      const sizesWithIds = [];
      for (const size of (color.sizes || [])) {
        const variantId = await getNextSequence('variantId');
        sizesWithIds.push({
          size: size.size,
          stock: Number(size.stock) || 0,
          variantId
        });
      }
      
      processedColors.push({
        name: color.name,
        code: color.code || "#000000",
        images: colorImages,
        sizes: sizesWithIds,
        order: i
      });
    }

    // Handle common product images
    const commonImages = [];
    if (req.files && req.files['commonImages']) {
      for (const file of req.files['commonImages']) {
        const result = await uploadToCloudinary(file.buffer, `products/${productSlug}/common`);
        commonImages.push({
          url: result.secure_url,
          publicId: result.public_id,
          alt: name
        });
      }
    }

    // Handle videos
    const videos = [];
    if (req.files && req.files['videos']) {
      for (const file of req.files['videos']) {
        const result = await uploadToCloudinaryVideoWithRetry(file.buffer, `products/${productSlug}/videos`);
        videos.push({
          url: result.secure_url,
          publicId: result.public_id,
          alt: name
        });
      }
    }

    const productData = {
      productId: newProductId,
      name: name.trim(),
      description: description.trim(),
      price: isBulk ? (parsedBulkConfig.pricePerSet || Number(price)) : Number(price),
      originalPrice: isBulk ? (parsedBulkConfig.originalPricePerSet || Number(originalPrice)) : (originalPrice ? Number(originalPrice) : undefined),
      commonImages,
      videos,
      category,
      subcategory: subcategory || null,
      colors: processedColors,
      tags: parseJson(tags, []),
      brand: brand ? brand.trim() : "",
      productDetails: productDetails ? productDetails.trim() : "",
      material: material ? material.trim() : "",
      fits: fits || "regular",
      weight: weight ? Number(weight) : undefined,
      dimensions: parseJson(dimensions, {}),
    };

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
    
    if (category) {
      await Category.findByIdAndUpdate(category, { $inc: { productCount: 1 } });
    }

    res.status(201).json({ 
      success: true, 
      message: "Product created successfully", 
      product 
    });
    
  } catch (error) {
    console.error("Create product error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create product",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

// ===============================
// UPDATE PRODUCT (Updated for color images)
// ===============================
// controllers/productController.js - Update the updateProduct function

const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    console.log("🔄 Updating product:", id);
    
    const existingProduct = await Product.findById(id);
    if (!existingProduct) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    let updateData = { ...req.body };
    const productSlug = slugify(existingProduct.name, { lower: true });

    // ✅ FIX: Handle subcategory properly
    if (updateData.subcategory === 'null' || updateData.subcategory === 'undefined' || updateData.subcategory === '') {
      updateData.subcategory = null;
    } else if (updateData.subcategory && typeof updateData.subcategory === 'string' && updateData.subcategory.match(/^[0-9a-fA-F]{24}$/)) {
      // Valid ObjectId string, keep as is
    } else if (updateData.subcategory && typeof updateData.subcategory === 'object') {
      // If it's an object, extract the _id or set to null
      updateData.subcategory = updateData.subcategory._id || null;
    } else if (updateData.subcategory && typeof updateData.subcategory === 'string') {
      // Try to extract from string that might be an object string
      try {
        const parsed = JSON.parse(updateData.subcategory);
        updateData.subcategory = parsed._id || null;
      } catch {
        // If not valid JSON, keep as is but validate
        if (!updateData.subcategory.match(/^[0-9a-fA-F]{24}$/)) {
          updateData.subcategory = null;
        }
      }
    }

    // Parse colors if present
    if (updateData.colors) {
      let parsedColors;
      try {
        parsedColors = typeof updateData.colors === 'string' 
          ? JSON.parse(updateData.colors) 
          : updateData.colors;
      } catch (e) {
        parsedColors = [];
      }
      
      // Process each color
      const processedColors = [];
      
      for (let i = 0; i < parsedColors.length; i++) {
        const color = parsedColors[i];
        const colorSlug = slugify(color.name, { lower: true });
        
        let colorImages = [];
        
        // Keep existing images that are not marked for deletion
        if (color.existingImages && color.existingImages.length) {
          colorImages = color.existingImages.filter(img => 
            !color.imagesToDelete?.includes(img.publicId) && 
            !color.imagesToDelete?.includes(img._id)
          );
        }
        
        // Handle new images uploaded for this color
        if (req.files) {
          for (const [fieldName, files] of Object.entries(req.files)) {
            if (fieldName === 'colorImages') {
              for (const file of files) {
                // Extract color index from filename
                const parts = file.originalname.split('_');
                const colorIndex = parseInt(parts[0]);
                if (colorIndex === i) {
                  const result = await uploadToCloudinary(file.buffer, `products/${productSlug}/${colorSlug}`);
                  colorImages.push({
                    url: result.secure_url,
                    publicId: result.public_id,
                    alt: `${existingProduct.name} - ${color.name}`
                  });
                }
              }
            }
          }
        }
        
        // Handle images to delete from Cloudinary
        if (color.imagesToDelete && color.imagesToDelete.length) {
          for (const imgToDelete of color.imagesToDelete) {
            const publicId = typeof imgToDelete === 'string' ? imgToDelete : imgToDelete.publicId;
            if (publicId) {
              try {
                await deleteFromCloudinary(publicId);
                console.log(`✅ Deleted image: ${publicId}`);
              } catch (err) {
                console.error(`Failed to delete image: ${publicId}`, err);
              }
            }
          }
        }
        
        // Process sizes
        const sizes = [];
        for (const size of (color.sizes || [])) {
          let variantId = size.variantId;
          if (!variantId && size.size) {
            variantId = await getNextSequence('variantId');
          }
          sizes.push({
            size: size.size,
            stock: Number(size.stock) || 0,
            variantId
          });
        }
        
        processedColors.push({
          _id: color._id || new mongoose.Types.ObjectId(),
          name: color.name,
          code: color.code || "#000000",
          images: colorImages,
          sizes: sizes,
          order: i
        });
      }
      
      updateData.colors = processedColors;
    }
    
    // Handle common images
    if (req.files && req.files['commonImages']) {
      const newCommonImages = [...(existingProduct.commonImages || [])];
      for (const file of req.files['commonImages']) {
        const result = await uploadToCloudinary(file.buffer, `products/${productSlug}/common`);
        newCommonImages.push({
          url: result.secure_url,
          publicId: result.public_id,
          alt: existingProduct.name
        });
      }
      updateData.commonImages = newCommonImages;
    }
    
    // Handle videos
    if (req.files && req.files['videos']) {
      const newVideos = [...(existingProduct.videos || [])];
      for (const file of req.files['videos']) {
        const result = await uploadToCloudinaryVideoWithRetry(file.buffer, `products/${productSlug}/videos`);
        newVideos.push({
          url: result.secure_url,
          publicId: result.public_id,
          alt: existingProduct.name
        });
      }
      updateData.videos = newVideos;
    }
    
    // Update numeric fields
    if (updateData.price !== undefined) updateData.price = Number(updateData.price);
    if (updateData.originalPrice !== undefined) updateData.originalPrice = Number(updateData.originalPrice);
    if (updateData.weight !== undefined) updateData.weight = Number(updateData.weight);
    
    // Parse JSON fields
    if (updateData.tags) updateData.tags = parseJson(updateData.tags, []);
    if (updateData.dimensions) updateData.dimensions = parseJson(updateData.dimensions, {});
    
    // ✅ Remove any fields that shouldn't be updated
    delete updateData._id;
    delete updateData.__v;
    delete updateData.createdAt;
    
    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );
    
    res.status(200).json({
      success: true,
      message: "Product updated successfully",
      product: updatedProduct
    });
    
  } catch (error) {
    console.error("Update product error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update product",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

// ===============================
// DELETE PRODUCT (Updated with color images cleanup)
// ===============================
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }
    
    // Delete common images from Cloudinary
    for (const image of product.commonImages || []) {
      if (image.publicId) {
        await deleteFromCloudinary(image.publicId);
      }
    }
    
    // Delete videos from Cloudinary
    for (const video of product.videos || []) {
      if (video.publicId) {
        await deleteFromCloudinary(video.publicId);
      }
    }
    
    // Delete color-specific images from Cloudinary
    for (const color of product.colors) {
      for (const image of color.images) {
        if (image.publicId) {
          await deleteFromCloudinary(image.publicId);
        }
      }
    }
    
    await Product.findByIdAndDelete(req.params.id);
    
    if (product.category) {
      await Category.findByIdAndUpdate(product.category, { $inc: { productCount: -1 } });
    }
    
    res.status(200).json({ success: true, message: "Product deleted successfully" });
  } catch (error) {
    console.error("Delete product error:", error);
    res.status(500).json({ success: false, message: "Failed to delete product" });
  }
};

// ===============================
// GET ALL PRODUCTS (Updated with color filtering)
// ===============================
// ===============================
// GET ALL PRODUCTS (With category name support)
// ===============================
const getProducts = async (req, res) => {
  try {
    const {
      category,
      subcategory,
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
      type,
    } = req.query;

    const query = { isActive: true };

    if (type === 'bulk') {
      query.isBulkProduct = true;
    } else if (type === 'regular') {
      query.isBulkProduct = false;
    }

    // ✅ FIX: Handle category as name or ID
    if (category) {
      const isValidObjectId = mongoose.Types.ObjectId.isValid(category);
      if (isValidObjectId) {
        query.category = category;
      } else {
        const categoryDoc = await Category.findOne({ 
          $or: [
            { name: { $regex: new RegExp(`^${category}$`, 'i') } },
            { slug: category }
          ]
        });
        if (categoryDoc) {
          query.category = categoryDoc._id;
        } else {
          return res.status(200).json({
            success: true,
            products: [],
            pagination: { current: Number(page), pages: 1, total: 0 }
          });
        }
      }
    }

    // ✅ FIX: Handle subcategory as name or ID
    if (subcategory) {
      const isValidObjectId = mongoose.Types.ObjectId.isValid(subcategory);
      if (isValidObjectId) {
        query.subcategory = subcategory;
      } else {
        const subcategoryDoc = await Category.findOne({ 
          $or: [
            { name: { $regex: new RegExp(`^${subcategory}$`, 'i') } },
            { slug: subcategory }
          ]
        });
        if (subcategoryDoc) {
          query.subcategory = subcategoryDoc._id;
        }
      }
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
      query["colors.sizes.size"] = { $in: arr };
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
      oldest: { createdAt: 1 },
      name: { name: 1 },
    };
    const sortOption = sortOptions[sort] || { createdAt: -1 };

    const [products, total] = await Promise.all([
      Product.find(query)
        .populate("category", "name slug")
        .populate("subcategory", "name slug")
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
// GET SINGLE PRODUCT
// ===============================
const getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate("category", "name slug")
      .populate("subcategory", "name slug");

    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    res.status(200).json({ success: true, product });
  } catch (error) {
    console.error("Get product error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch product" });
  }
};

// ===============================
// GET PRODUCT BY SLUG
// ===============================
const getProductBySlug = async (req, res) => {
  try {
    const product = await Product.findOne({ slug: req.params.slug })
      .populate("category", "name slug")
      .populate("subcategory", "name slug");

    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    res.status(200).json({ success: true, product });
  } catch (error) {
    console.error("Get product by slug error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch product" });
  }
};

// ===============================
// GET BULK PRODUCTS
// ===============================
// ===============================
// GET BULK PRODUCTS (With category name support)
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

    // ✅ FIX: Handle category as name or ID
    if (category) {
      const isValidObjectId = mongoose.Types.ObjectId.isValid(category);
      if (isValidObjectId) {
        query.category = category;
      } else {
        const categoryDoc = await Category.findOne({ 
          $or: [
            { name: { $regex: new RegExp(`^${category}$`, 'i') } },
            { slug: category }
          ]
        });
        if (categoryDoc) {
          query.category = categoryDoc._id;
        } else {
          return res.status(200).json({
            success: true,
            products: [],
            pagination: { current: Number(page), pages: 1, total: 0 }
          });
        }
      }
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
// GET REGULAR PRODUCTS
// ===============================
// ===============================
// GET REGULAR PRODUCTS (With category name support)
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

    // ✅ FIX: Handle category as name or ID
    if (category) {
      const isValidObjectId = mongoose.Types.ObjectId.isValid(category);
      if (isValidObjectId) {
        query.category = category;
      } else {
        const categoryDoc = await Category.findOne({ 
          $or: [
            { name: { $regex: new RegExp(`^${category}$`, 'i') } },
            { slug: category }
          ]
        });
        if (categoryDoc) {
          query.category = categoryDoc._id;
        } else {
          return res.status(200).json({
            success: true,
            products: [],
            pagination: { current: Number(page), pages: 1, total: 0 }
          });
        }
      }
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
      query["colors.sizes.size"] = { $in: arr };
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
// ADD REVIEW (No changes needed)
// ===============================
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

// ===============================
// OTHER FUNCTIONS (No changes needed)
// ===============================
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

const getSearchedProducts = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.trim() === "") {
      return res.status(400).json({ success: false, message: "Query string is required" });
    }

    const searchRegex = new RegExp(q.trim(), "i");

    const products = await Product.find({
      isActive: true,
      $or: [
        { name: searchRegex },
        { description: searchRegex },
      ],
    }).populate("category", "name slug");

    res.status(200).json({ success: true, products });
  } catch (error) {
    console.error("Search products error:", error);
    res.status(500).json({ success: false, message: "Failed to search products" });
  }
};

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
      query["colors.sizes.size"] = { $in: arr };
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

    const subCategories = await Category.find({ parentCategory: cat._id }).select("_id");
    const subCategoryIds = subCategories.map(sub => sub._id);
    const allCategoryIds = [cat._id, ...subCategoryIds];

    const products = await Product.find({
      category: { $in: allCategoryIds },
      isActive: true
    }).populate("category", "name slug");

    res.status(200).json({ success: true, products });
  } catch (error) {
    console.error("Get products by category slug error:", error);
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
  getBulkProducts,
  getRegularProducts,
};