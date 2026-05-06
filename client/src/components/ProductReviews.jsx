"use client";
import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  Star,
  ThumbsUp,
  Plus,
  X,
  Camera,
  CheckCircle,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  MoreHorizontal,
} from "lucide-react";
import { fetchProductReviews, likeReview } from "../store/slices/reviewSlice";
import { formatDistanceToNow } from "date-fns";
import reviewAPI from "../store/api/reviewAPI";
import { toast } from "react-toastify";

const ProductReviews = ({ productId }) => {
  const dispatch = useDispatch();
  const currentProductReviews = useSelector(
    (state) => state.reviews?.currentProductReviews || []
  );
  const reviewStats = useSelector(
    (state) =>
      state.reviews?.reviewStats || {
        averageRating: 0,
        totalReviews: 0,
        ratingDistribution: {},
      }
  );
  const loading = useSelector((state) => state.reviews?.loading || false);
  const { user } = useSelector((state) => state.auth);

  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    title: "",
    comment: "",
    pros: "",
    cons: "",
  });
  const [images, setImages] = useState([]);
  const [expandedReviews, setExpandedReviews] = useState({});
  const [showAllReviews, setShowAllReviews] = useState(false);

  const REVIEWS_TO_SHOW = 2;

  useEffect(() => {
    if (productId) {
      dispatch(fetchProductReviews(productId));
    }
  }, [dispatch, productId]);

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files).slice(0, 5);
    setImages(files);
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("productId", productId);
    formData.append("rating", reviewForm.rating);
    formData.append("title", reviewForm.title);
    formData.append("comment", reviewForm.comment);
    formData.append("pros", reviewForm.pros);
    formData.append("cons", reviewForm.cons);
    images.forEach((img) => formData.append("images", img));

    try {
      const { data } = await reviewAPI.createReview(formData);
      if (data.success) {
        toast.success("Review submitted!");
        setShowReviewForm(false);
        setReviewForm({ rating: 5, title: "", comment: "", pros: "", cons: "" });
        setImages([]);
        dispatch(fetchProductReviews(productId));
      }
    } catch (error) {
      console.error("Review submit error:", error);
      toast.error("Failed to submit review");
    }
  };

  // ✅ FIX 1: Like refresh
  const handleLikeReview = async (reviewId) => {
    if (!user) {
      toast.info("Please login to like reviews");
      return;
    }
    try {
      await dispatch(likeReview(reviewId)).unwrap();
      dispatch(fetchProductReviews(productId)); // refresh likes
    } catch (err) {
      toast.error("Failed to like review");
    }
  };

  const toggleReviewExpansion = (reviewId) => {
    setExpandedReviews((prev) => ({
      ...prev,
      [reviewId]: !prev[reviewId],
    }));
  };

  const renderStars = (rating, size = "w-4 h-4", interactive = false, onStarClick = null) => (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type={interactive ? "button" : undefined}
          onClick={interactive ? () => onStarClick?.(star) : undefined}
          className={`${interactive ? "hover:scale-110 transition-transform cursor-pointer" : ""} focus:outline-none`}
          disabled={!interactive}
        >
          <Star
            className={`${size} transition-colors ${
              star <= rating
                ? "text-yellow-400 fill-yellow-400"
                : interactive
                ? "text-gray-300 hover:text-red-200"
                : "text-gray-300"
            }`}
          />
        </button>
      ))}
    </div>
  );

  const handleDeleteReview = async (reviewId) => {
    if (!user || user.role !== "admin") {
      toast.error("Only admins can delete reviews");
      return;
    }
    try {
      const { data } = await reviewAPI.deleteReview(reviewId);
      if (data.success) {

        // ask are sure do you want to delete
        if (!window.confirm("Are you sure you want to delete this review?")) {
          return;
        }
        toast.success("Review deleted");
        dispatch(fetchProductReviews(productId));
      }
    } catch (error) {
      console.error("Delete review error:", error);
      toast.error("Failed to delete review");
    }
  };


  const renderRatingDistribution = () => {
    const { ratingDistribution, totalReviews } = reviewStats;
    return (
      <div className="space-y-2">
        {[5, 4, 3, 2, 1].map((rating) => {
          const count = ratingDistribution[rating] || 0;
          const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
          return (
            <div key={rating} className="flex items-center gap-2">
              <div className="flex items-center gap-1 min-w-[40px]">
                <span className="text-sm font-medium text-gray-700">{rating}</span>
                <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
              </div>
              <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-red-400 to-red-500 rounded-full"
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <span className="text-sm text-gray-600 min-w-[30px] text-right">{count}</span>
            </div>
          );
        })}
      </div>
    );
  };

  const getDisplayedReviews = () => {
    if (showAllReviews || currentProductReviews.length <= REVIEWS_TO_SHOW) {
      return currentProductReviews;
    }
    return currentProductReviews.slice(0, REVIEWS_TO_SHOW);
  };

  const displayedReviews = getDisplayedReviews();

  // ✅ FIX 2: Only show "Show More" if > 2 reviews
  const hasMoreReviews = currentProductReviews.length > REVIEWS_TO_SHOW && currentProductReviews.length > 2;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm text-gray-600">Loading reviews...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-4">
      {/* Review Summary */}
      <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
        <div className="flex flex-col sm:flex-row items-center gap-4">
          {/* Overall Rating */}
          <div className="flex items-center gap-3">
            <div className="text-4xl font-bold bg-gradient-to-r from-red-500 to-red-600 bg-clip-text text-transparent">
              {reviewStats.averageRating.toFixed(1)}
            </div>
            <div className="space-y-1">
              {renderStars(Math.round(reviewStats.averageRating), "w-5 h-5")}
              <div className="text-sm text-gray-600">
                {reviewStats.totalReviews} {reviewStats.totalReviews === 1 ? "review" : "reviews"}
              </div>
            </div>
          </div>
          {/* Rating Distribution */}
          <div className="flex-1 w-full sm:w-auto">
            <h4 className="text-sm font-semibold text-gray-900 mb-2">Rating Breakdown</h4>
            {renderRatingDistribution()}
          </div>
        </div>
      </div>

      {/* Write Review Button */}
      {user && (
        <button
          onClick={() => setShowReviewForm(!showReviewForm)}
          className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl transition-all ${
            showReviewForm
              ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
              : "bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-700 hover:to-red-800"
          }`}
        >
          {showReviewForm ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
          {showReviewForm ? "Cancel Review" : "Write a Review"}
        </button>
      )}

      {/* Review Form */}
      {showReviewForm && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <form onSubmit={handleSubmitReview} className="p-4 space-y-4">
            {/* Rating */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Your Rating</label>
              {renderStars(
                reviewForm.rating,
                "w-6 h-6",
                true,
                (rating) => setReviewForm({ ...reviewForm, rating })
              )}
            </div>

            {/* Title */}
            {/* <div>
              <label className="block text-sm font-semibold text-gray-900 mb-1">Review Title</label>
              <input
                type="text"
                value={reviewForm.title}
                onChange={(e) => setReviewForm({ ...reviewForm, title: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="Summarize your experience..."
                required
              />
            </div> */}

            {/* Comment */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-1">Your Review</label>
              <textarea
                value={reviewForm.comment}
                onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                placeholder="Share your detailed experience..."
                required
              />
            </div>

            {/* Pros and Cons */}
            {/* <div className="grid grid-cols-1 gap-3">
              <div>
                <label className="flex items-center gap-1 text-sm font-semibold text-gray-900 mb-1">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Pros (Optional)
                </label>
                <input
                  value={reviewForm.pros}
                  onChange={(e) => setReviewForm({ ...reviewForm, pros: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="What did you like?"
                />
              </div>
              <div>
                <label className="flex items-center gap-1 text-sm font-semibold text-gray-900 mb-1">
                  <AlertCircle className="w-4 h-4 text-red-500" />
                  Cons (Optional)
                </label>
                <input
                  value={reviewForm.cons}
                  onChange={(e) => setReviewForm({ ...reviewForm, cons: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="What could be improved?"
                />
              </div>
            </div> */}

            {/* Image Upload */}
            {/* <div>
              <label className="flex items-center gap-1 text-sm font-semibold text-gray-900 mb-1">
                <Camera className="w-4 h-4 text-gray-500" />
                Add Photos (up to 5)
              </label>
              <div className="border border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gray-400 transition-colors">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                  id="image-upload"
                />
                <label htmlFor="image-upload" className="cursor-pointer">
                  <Camera className="w-6 h-6 text-gray-400 mx-auto mb-1" />
                  <p className="text-xs text-gray-600">Click to upload images</p>
                </label>
              </div>
              {images.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {images.map((img, idx) => (
                    <div key={idx} className="relative">
                      <img
                        src={URL.createObjectURL(img) || "/placeholder.svg"}
                        alt={`Preview ${idx + 1}`}
                        className="w-12 h-12 object-cover rounded border border-gray-200"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div> */}

            <button
              type="submit"
              className="w-full py-2.5 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 transition-all text-sm font-semibold shadow-sm"
            >
              Submit Review
            </button>
          </form>
        </div>
      )}

      {/* Reviews List */}
      <div className="space-y-3">
        {currentProductReviews.length === 0 ? (
          <div className="text-center py-6 bg-gray-50 rounded-lg">
            <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-2">
              <Star className="w-5 h-5 text-gray-400 bg-yellow-400" />
            </div>
            <p className="text-gray-500 text-sm">No reviews yet</p>
            <p className="text-gray-400 text-xs mt-1">Be the first to share your experience!</p>
          </div>
        ) : (
          <>
            {displayedReviews.map((review) => (
              <div key={review._id} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                {/* Review Header */}
                <div className="flex items-start justify-between p-3 border-b border-gray-200">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                      {review.user?.name?.charAt(0) || "U"}
                    </div>
                    <div>
                      <div className="flex items-center gap-1">
                        {renderStars(review.rating, "w-3 h-3")}
                        <span className="text-xs text-gray-500">
                          {formatDistanceToNow(new Date(review.createdAt))} ago
                        </span>
                      </div>
                      <p className="text-xs text-gray-600">{review.user?.name || "Anonymous"}</p>
                    </div>
                    {/* i want here delete review option for admin only */}
                    {/* crete delete review option for admin only */}

                  </div>
                {user?.role === "admin" && (
                  <button
                    onClick={() => handleDeleteReview(review._id)}
                    className="flex items-center gap-1 px-2 py-1 text-xs text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                  >
                    <X className="w-3 h-3" />
                    Delete
                  </button>
                )}
                </div>

                {/* Review Content */}
                <div className="p-3">
                  {/* <h4 className="text-sm font-semibold text-gray-900 mb-1">{review.title}</h4> */}
                  <div className="relative">
                    <p className={`text-xs text-gray-700 ${expandedReviews[review._id] ? "" : "line-clamp-2"}`}>
                      {review.comment}
                    </p>
                    {review.comment.length > 100 && (
                      <button
                        onClick={() => toggleReviewExpansion(review._id)}
                        className="text-xs text-red-600 hover:text-red-800 mt-1 flex items-center"
                      >
                        {expandedReviews[review._id] ? (
                          "Show less"
                        ) : (
                          <>
                            <span>Read more</span>
                            <MoreHorizontal className="w-3 h-3 ml-0.5" />
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  {/* Pros and Cons */}
                  {/* {(review.pros || review.cons) && (
                    <div className="grid grid-cols-1 gap-2 mt-2">
                      {review.pros && (
                        <div className="bg-green-50 border border-green-200 rounded p-2">
                          <div className="flex items-center gap-1">
                            <CheckCircle className="w-3 h-3 text-green-600" />
                            <span className="text-xs font-semibold text-green-800">Pros</span>
                          </div>
                          <p className="text-xs text-green-700 mt-0.5">{review.pros}</p>
                        </div>
                      )}
                      {review.cons && (
                        <div className="bg-red-50 border border-red-200 rounded p-2">
                          <div className="flex items-center gap-1">
                            <AlertCircle className="w-3 h-3 text-red-600" />
                            <span className="text-xs font-semibold text-red-800">Cons</span>
                          </div>
                          <p className="text-xs text-red-700 mt-0.5">{review.cons}</p>
                        </div>
                      )}
                    </div>
                  )} */}

                  {/* Review Images */}
                  {/* {review.images?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {review.images.slice(0, 3).map((img, idx) => (
                        <img
                          key={idx}
                          src={img || "/placeholder.svg"}
                          alt={`Review image ${idx + 1}`}
                          className="w-12 h-12 object-cover rounded border border-gray-200 hover:scale-105 transition-transform cursor-pointer"
                        />
                      ))}
                      {review.images.length > 3 && (
                        <div className="w-12 h-12 bg-gray-100 rounded border border-gray-200 flex items-center justify-center text-xs text-gray-500">
                          +{review.images.length - 3}
                        </div>
                      )}
                    </div>
                  )} */}
                </div>
              </div>
            ))}

            {hasMoreReviews && (
              <div className="flex justify-center pt-4">
                <button
                  onClick={() => setShowAllReviews(!showAllReviews)}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:from-red-700 hover:to-red-800 transition-all font-medium shadow-sm"
                >
                  {showAllReviews ? (
                    <>
                      <ChevronUp className="w-4 h-4" />
                      Show Less Reviews
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-4 h-4" />
                      Show More Reviews ({currentProductReviews.length - REVIEWS_TO_SHOW} more)
                    </>
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ProductReviews;
