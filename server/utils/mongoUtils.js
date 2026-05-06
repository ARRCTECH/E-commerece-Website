/**
 * MongoDB Query Optimization Utilities
 * These utilities help improve MongoDB query performance
 */

/**
 * Optimized projection for Product model
 * Use for list views to reduce payload size
 */
const productListProjection = {
  name: 1,
  price: 1,
  originalPrice: 1,
  discount: 1,
  images: { $slice: 1 }, // Get only first image
  rating: 1,
  category: 1,
  isActive: 1,
  stock: 1,
  tags: 1,
  createdAt: 1,
};

/**
 * Optimized projection for Category model
 * Use for list views to reduce payload size
 */
const categoryListProjection = {
  name: 1,
  slug: 1,
  image: 1,
  isActive: 1,
  productCount: 1,
  parentId: 1,
};

/**
 * Optimized projection for User model
 * Use for admin list views to reduce payload size and exclude sensitive data
 */
const userListProjection = {
  name: 1,
  email: 1,
  phoneNumber: 1,
  role: 1,
  isActive: 1,
  isVerified: 1,
  createdAt: 1,
  lastLogin: 1,
};

/**
 * Optimized projection for Order model
 * Use for list views to reduce payload size
 */
const orderListProjection = {
  orderNumber: 1,
  user: 1,
  status: 1,
  totalAmount: 1,
  paymentStatus: 1,
  shippingStatus: 1,
  createdAt: 1,
  updatedAt: 1,
};

/**
 * Helper function to create standard pagination for MongoDB queries
 * 
 * @param {Object} model - Mongoose model
 * @param {Object} query - MongoDB query object
 * @param {Object} options - Options for pagination, sorting, etc.
 * @param {Object} projection - Fields to include/exclude
 * @returns {Promise<Object>} - Promise resolving to paginated results
 */
const paginateResults = async (model, query = {}, options = {}, projection = {}) => {
  const page = parseInt(options.page) || 1;
  const limit = parseInt(options.limit) || 10;
  const skip = (page - 1) * limit;
  const sort = options.sort || { createdAt: -1 };
  
  const [results, total] = await Promise.all([
    model
      .find(query, projection)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean() // Convert to plain JS objects for better performance
      .exec(),
    model.countDocuments(query),
  ]);
  
  return {
    results,
    pagination: {
      current: page,
      pages: Math.ceil(total / limit),
      total,
      perPage: limit,
    },
  };
};

/**
 * Helper function to efficiently find products with aggregate pipeline
 * - Optimized for filtering, sorting, and pagination
 * - Includes proper category and other relation lookups
 */
const getProductsAggregate = async (query = {}, options = {}) => {
  const page = parseInt(options.page) || 1;
  const limit = parseInt(options.limit) || 12;
  const skip = (page - 1) * limit;
  
  // Convert sort string to sort object
  let sortObj = { createdAt: -1 }; // Default sort
  if (options.sort) {
    switch (options.sort) {
      case 'price-low':
        sortObj = { price: 1 };
        break;
      case 'price-high':
        sortObj = { price: -1 };
        break;
      case 'rating':
        sortObj = { 'rating.average': -1 };
        break;
      case 'newest':
        sortObj = { createdAt: -1 };
        break;
      default:
        sortObj = { createdAt: -1 };
    }
  }
  
  // Build the aggregate pipeline
  const pipeline = [
    { $match: query },
    {
      $lookup: {
        from: 'categories',
        localField: 'category',
        foreignField: '_id',
        as: 'categoryData',
      },
    },
    { $unwind: { path: '$categoryData', preserveNullAndEmptyArrays: true } },
    { $sort: sortObj },
    { $skip: skip },
    { $limit: limit },
    {
      $project: {
        name: 1,
        price: 1,
        originalPrice: 1,
        images: { $slice: ['$images', 1] }, // Only first image
        rating: 1,
        category: '$categoryData._id',
        categoryName: '$categoryData.name',
        categorySlug: '$categoryData.slug',
        isActive: 1,
        stock: 1,
        tags: 1,
        createdAt: 1,
      },
    },
  ];
  
  // Count pipeline (for pagination)
  const countPipeline = [{ $match: query }, { $count: 'total' }];
  
  return {
    pipeline,
    countPipeline,
  };
};

module.exports = {
  productListProjection,
  categoryListProjection,
  userListProjection,
  orderListProjection,
  paginateResults,
  getProductsAggregate,
};
