const Review = require("../models/Review")
const Product = require("../models/Product")
const Order = require("../models/Order")
const mongoose = require("mongoose") // Import mongoose to fix undeclared variable error
const { uploadToCloudinary } = require("../utils/cloudinary")

// Get product reviews
const getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;
    const { page = 1, limit = 10, sort = "newest", rating } = req.query;

    // ✅ Validate productId format
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    const query = { product: productId, status: "active" };

    if (rating) {
      query.rating = Number(rating);
    }

    // Sorting logic
    let sortOption = {};
    switch (sort) {
      case "newest":
        sortOption = { createdAt: -1 };
        break;
      case "oldest":
        sortOption = { createdAt: 1 };
        break;
      case "highest":
        sortOption = { rating: -1, createdAt: -1 };
        break;
      case "lowest":
        sortOption = { rating: 1, createdAt: -1 };
        break;
      case "helpful":
        sortOption = { "helpful.count": -1, createdAt: -1 };
        break;
      default:
        sortOption = { createdAt: -1 };
    }

    const skip = (page - 1) * limit;

    // Fetch paginated reviews
    const reviews = await Review.find(query)
      .populate("user", "name avatar")
      .sort(sortOption)
      .skip(skip)
      .limit(Number(limit));

    const totalReviews = await Review.countDocuments(query);

    // ✅ Fix: Use `new` keyword with ObjectId
    const ratingStats = await Review.aggregate([
      {
        $match: {
          product: new mongoose.Types.ObjectId(productId),
          status: "active",
        },
      },
      {
        $group: {
          _id: "$rating",
          count: { $sum: 1 },
        },
      },
    ]);

    const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    ratingStats.forEach((stat) => {
      ratingDistribution[stat._id] = stat.count;
    });

    const averageRating = await Review.aggregate([
      {
        $match: {
          product: new mongoose.Types.ObjectId(productId),
          status: "active",
        },
      },
      {
        $group: {
          _id: null,
          average: { $avg: "$rating" },
          total: { $sum: 1 },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      reviews,
      pagination: {
        currentPage: Number(page),
        totalPages: Math.ceil(totalReviews / limit),
        totalReviews,
        hasNext: page < Math.ceil(totalReviews / limit),
        hasPrev: page > 1,
      },
      stats: {
        averageRating: averageRating[0]?.average || 0,
        totalReviews: averageRating[0]?.total || 0,
        ratingDistribution,
      },
    });
  } catch (error) {
    console.error("Get product reviews error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch reviews",
      error: error.message,
    });
  }
};

// Create review
const createReview = async (req, res) => {
  try {
    const { productId, rating, title, comment } = req.body
    const userId = req.user.userId

    // Check if product exists
    const product = await Product.findById(productId)
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      })
    }


    // Check if user has purchased this product (optional verification)
    const hasPurchased = await Order.findOne({
      user: userId,
      "items.product": productId,
      status: { $in: ["delivered", "completed"] },
    })

    // Upload review images if provided
    const reviewImages = []
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const result = await uploadToCloudinary(file.buffer, "reviews")
        reviewImages.push({
          url: result.secure_url,
          alt: `Review image for ${product.name}`,
        })
      }
    }

    // Create review
    const review = new Review({
      user: userId,
      product: productId,
      rating: Number(rating),
      title: title?.trim(),
      comment: comment.trim(),
      images: reviewImages,
      verified: !!hasPurchased,
    })

    await review.save()

    // Update product rating
    const allReviews = await Review.find({
      product: productId,
      status: "active",
    })

    const totalRating = allReviews.reduce((sum, review) => sum + review.rating, 0)
    const averageRating = totalRating / allReviews.length

    await Product.findByIdAndUpdate(productId, {
      "rating.average": averageRating,
      "rating.count": allReviews.length,
    })

    // Populate user data for response
    await review.populate("user", "name avatar")

    res.status(201).json({
      success: true,
      message: "Review created successfully",
      review,
    })
  } catch (error) {
    console.error("Create review error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to create review",
    })
  }
}

// Update review
const updateReview = async (req, res) => {
  try {
    const { reviewId } = req.params
    const { rating, title, comment } = req.body
    const userId = req.user.userId

    const review = await Review.findOne({
      _id: reviewId,
      user: userId,
    })

    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found or unauthorized",
      })
    }

    // Update review fields
    if (rating) review.rating = Number(rating)
    if (title !== undefined) review.title = title.trim()
    if (comment) review.comment = comment.trim()

    // Handle new images if provided
    if (req.files && req.files.length > 0) {
      const newImages = []
      for (const file of req.files) {
        const result = await uploadToCloudinary(file.buffer, "reviews")
        newImages.push({
          url: result.secure_url,
          alt: `Review image`,
        })
      }
      review.images = [...review.images, ...newImages]
    }

    await review.save()

    // Recalculate product rating
    const allReviews = await Review.find({
      product: review.product,
      status: "active",
    })

    const totalRating = allReviews.reduce((sum, r) => sum + r.rating, 0)
    const averageRating = totalRating / allReviews.length

    await Product.findByIdAndUpdate(review.product, {
      "rating.average": averageRating,
      "rating.count": allReviews.length,
    })

    await review.populate("user", "name avatar")

    res.status(200).json({
      success: true,
      message: "Review updated successfully",
      review,
    })
  } catch (error) {
    console.error("Update review error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to update review",
    })
  }
}

// Delete review

const deleteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;

    const review = await Review.findById(reviewId);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found",
      });
    }
    //i dont want soft delete here
    await Review.findByIdAndDelete(reviewId);
    // Recalculate product rating
    const allReviews = await Review.find({
      product: review.product,
      status: "active",
    });
    const totalRating = allReviews.reduce((sum, r) => sum + r.rating, 0);
    const averageRating = allReviews.length > 0 ? totalRating / allReviews.length : 0;
    await Product.findByIdAndUpdate(review.product, {
      "rating.average": averageRating,
      "rating.count": allReviews.length,
    });

    res.status(200).json({
      success: true,
      message: "Review deleted successfully",
    });
  } catch (error) {
    console.error("Delete review error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete review",
    });
  }
}


// Toggle helpful vote
const toggleHelpful = async (req, res) => {
  try {
    const { reviewId } = req.params
    const userId = req.user.userId

    const review = await Review.findById(reviewId)
    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found",
      })
    }

    const hasVoted = review.helpful.users.includes(userId)

    if (hasVoted) {
      // Remove vote
      review.helpful.users = review.helpful.users.filter((id) => id.toString() !== userId)
      review.helpful.count = Math.max(0, review.helpful.count - 1)
    } else {
      // Add vote
      review.helpful.users.push(userId)
      review.helpful.count += 1
    }

    await review.save()

    res.status(200).json({
      success: true,
      message: hasVoted ? "Vote removed" : "Vote added",
      helpful: {
        count: review.helpful.count,
        hasVoted: !hasVoted,
      },
    })
  } catch (error) {
    console.error("Toggle helpful error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to update vote",
    })
  }
}

// Report review
const reportReview = async (req, res) => {
  try {
    const { reviewId } = req.params
    const { reason, description } = req.body
    const userId = req.user.userId

    const review = await Review.findById(reviewId)
    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found",
      })
    }

    // Check if user already reported this review
    const hasReported = review.reported.reasons.some((report) => report.user.toString() === userId)

    if (hasReported) {
      return res.status(400).json({
        success: false,
        message: "You have already reported this review",
      })
    }

    // Add report
    review.reported.reasons.push({
      user: userId,
      reason,
      description: description?.trim(),
    })
    review.reported.count += 1

    await review.save()

    res.status(200).json({
      success: true,
      message: "Review reported successfully",
    })
  } catch (error) {
    console.error("Report review error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to report review",
    })
  }
}

// Get user reviews
const getUserReviews = async (req, res) => {
  try {
    const userId = req.user.userId
    const { page = 1, limit = 10 } = req.query

    const skip = (page - 1) * limit

    const reviews = await Review.find({
      user: userId,
      status: { $ne: "deleted" },
    })
      .populate("product", "name images")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))

    const totalReviews = await Review.countDocuments({
      user: userId,
      status: { $ne: "deleted" },
    })

    res.status(200).json({
      success: true,
      reviews,
      pagination: {
        currentPage: Number(page),
        totalPages: Math.ceil(totalReviews / limit),
        totalReviews,
        hasNext: page < Math.ceil(totalReviews / limit),
        hasPrev: page > 1,
      },
    })
  } catch (error) {
    console.error("Get user reviews error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to fetch user reviews",
    })
  }
}

module.exports = {
  getProductReviews,
  createReview,
  updateReview,
  deleteReview,
  toggleHelpful,
  reportReview,
  getUserReviews,
}