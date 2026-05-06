"use client";
import { memo } from "react";
import { motion } from "framer-motion";
import { Heart, Star, ArrowDown } from "lucide-react";
import { Link } from "react-router-dom";
import PropTypes from "prop-types";
import { optimizeImage } from "../../utils/performance";
const ProductCard = ({ product, wishlistItems, onAddToCart, onWishlist }) => {
  const inWishlist = wishlistItems.some((item) => item._id === product._id);
  const hasDiscount = product.originalPrice > product.price;
  const discountPercent = hasDiscount
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="pb-3 overflow-hidden transition-all duration-300 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md"
    >
      <div className="relative aspect-[4/4]">
        <Link to={`/product/${product._id}`}>
          <img
            src={optimizeImage(product.images?.[0]?.url || "/placeholder.svg", {
              width: 300,
              height: 300,
              format: "webp",
              quality: 85
            })}
            alt={product.name}
            className="object-cover w-full h-full rounded-xl"
            loading="lazy"
            width={300}
            height={300}
          />
        </Link>
        {(product.rating?.average ?? 0) > 0 && (
          <div className="absolute flex items-center px-2 py-1 border border-gray-200 rounded-full shadow-xs bottom-2 right-2 bg-white/90">
            <Star className="w-3 h-3 mr-1 text-yellow-400 fill-current" />
            <span className="text-xs font-medium text-gray-800">
              {product.rating.average.toFixed(1)}
            </span>
          </div>
        )}
        <motion.button
          whileHover={{ scale: 1.05 }}
          onClick={(e) => onWishlist(product, e)}
          className="absolute p-1.5 transition-colors bg-white border rounded-full shadow-sm top-2 right-2 border-gray-200 hover:bg-gray-100 hover:text-red-500"
          aria-label={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
        >
          <Heart className={`w-4 h-4 ${inWishlist ? "fill-red-500 text-red-500" : "text-gray-400"}`} />
        </motion.button>
      </div>
      <div className="px-3 pt-2">
        <Link to={`/product/${product._id}`}>
          <h3 className="text-sm font-medium text-gray-800 line-clamp-2">
            {product.brand}
          </h3>
          <p className="text-xs text-gray-600 line-clamp-1">
            {product.name}
          </p>
        </Link>
        <div className="flex items-center mt-2 mb-2 space-x-1">
          {hasDiscount && (
            <>
              <span className="flex items-center text-xs font-medium text-green-600">
                <ArrowDown className="w-3 h-3 mr-0.5" />
                {discountPercent}%
              </span>
              <span className="text-xs text-gray-500 line-through">₹{product.originalPrice}</span>
            </>
          )}
          <span className="text-sm font-bold text-gray-800">
            ₹{product.price}
          </span>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={(e) => onAddToCart(product, e)}
          disabled={product.stock === 0}
          className="w-full py-2 text-xs font-medium text-red-600 transition-colors bg-white border border-red-300 rounded-lg hover:bg-red-600 hover:text-white disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
        >
          {product.stock === 0 ? "Out of Stock" : "Add to Cart"}
        </motion.button>
      </div>
    </motion.div>
  );
};
ProductCard.propTypes = {
  product: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    brand: PropTypes.string,
    price: PropTypes.number.isRequired,
    originalPrice: PropTypes.number,
    stock: PropTypes.number,
    images: PropTypes.arrayOf(
      PropTypes.shape({
        url: PropTypes.string,
        alt: PropTypes.string
      })
    ),
    rating: PropTypes.shape({
      average: PropTypes.number
    })
  }).isRequired,
  wishlistItems: PropTypes.array.isRequired,
  onAddToCart: PropTypes.func.isRequired,
  onWishlist: PropTypes.func.isRequired
};
ProductCard.defaultProps = {
  wishlistItems: []
};
export default memo(ProductCard);