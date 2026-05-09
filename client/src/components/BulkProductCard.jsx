"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, ShoppingCart, Star, Package, X, Minus, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { addToCart, optimisticAddToCart } from "../store/slices/cartSlice";
import { 
  optimisticAddToWishlist, 
  optimisticRemoveFromWishlist,
  addToWishlist,
  removeFromWishlist
} from "../store/slices/wishlistSlice";
import toast from "react-hot-toast";

const BulkProductCard = ({ product, wishlistItems, onWishlist }) => {
  const dispatch = useDispatch();
  const [showModal, setShowModal] = useState(false);
  const [selectedColors, setSelectedColors] = useState([]);
  const [quantity, setQuantity] = useState(1);

  const isInWishlist = wishlistItems?.some((item) => item._id === product._id) || false;

  const piecesPerSet = product.availableSizes?.length * (product.packConfig?.piecesPerSize || 1);
  const totalColors = product.availableColors?.length || 0;
  const minColors = product.packConfig?.minColorsToSelect || 1;
  const maxColors = product.packConfig?.maxColorsToSelect || totalColors;

  const hasDiscount = product.pricing?.originalPricePerSet > product.pricing?.pricePerSet;
  const discountPercent = hasDiscount 
    ? Math.round(((product.pricing.originalPricePerSet - product.pricing.pricePerSet) / product.pricing.originalPricePerSet) * 100)
    : 0;

  const totalSets = selectedColors.length * quantity;
  const totalPieces = piecesPerSet * totalSets;
  const totalPrice = (product.pricing?.pricePerSet || 0) * totalSets;

  const handleColorToggle = (colorName) => {
    if (selectedColors.includes(colorName)) {
      setSelectedColors(selectedColors.filter(c => c !== colorName));
    } else {
      if (selectedColors.length >= maxColors) {
        toast.error(`Maximum ${maxColors} colors can be selected`);
        return;
      }
      setSelectedColors([...selectedColors, colorName]);
    }
  };

  const handleAddToCart = async () => {
    if (selectedColors.length < minColors) {
      toast.error(`Please select at least ${minColors} color(s)`);
      return;
    }

    dispatch(optimisticAddToCart({ 
      product: {
        ...product,
        isBulkProduct: true,
        bulkConfig: { selectedColors, totalPieces, quantity, totalSets }
      }, 
      quantity: 1,
      size: "BULK_PACK",
      color: selectedColors.join(", ")
    }));

    toast.success(`${totalPieces} pieces added to cart!`);
    
    setSelectedColors([]);
    setQuantity(1);
    setShowModal(false);
  };

  const handleWishlistClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (onWishlist) {
      onWishlist(product, e);
    } else {
      if (isInWishlist) {
        dispatch(optimisticRemoveFromWishlist(product._id));
        dispatch(removeFromWishlist(product._id));
        toast.success("Removed from wishlist");
      } else {
        dispatch(optimisticAddToWishlist(product));
        dispatch(addToWishlist(product));
        toast.success("Added to wishlist");
      }
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="pb-1.5 overflow-hidden transition-all duration-300 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md"
      >
        <div className="relative">
          <Link to={`/product/${product.slug || product._id}`}>
            <div className="relative w-full h-64 sm:h-40 md:h-80">
              <img
                src={product.images?.[0]?.url || "/placeholder.svg"}
                alt={product.name}
                className="object-cover w-full h-full rounded-t-xl"
                loading="lazy"
              />
            </div>
          </Link>

          {/* Bulk Badge */}
          <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-1 bg-red-600 rounded-full shadow-xs">
            <Package className="w-3 h-3 text-white" />
            <span className="text-xs font-medium text-white">BULK</span>
          </div>

          {/* Discount Badge */}
          {discountPercent > 0 && (
            <div className="absolute top-2 right-12 px-2 py-1 bg-green-600 rounded-full shadow-xs">
              <span className="text-xs font-bold text-white">{discountPercent}% OFF</span>
            </div>
          )}

          {/* Rating Badge */}
          {(product.rating?.average ?? 0) > 0 && (
            <div className="absolute bottom-2 right-2 flex items-center px-2 py-1 bg-red-100 border border-gray-200 rounded-full shadow-xs">
              <Star className="w-3 h-3 mr-1 text-yellow-400 fill-current" />
              <span className="text-xs font-medium text-gray-800">
                {product.rating.average.toFixed(1)}
              </span>
            </div>
          )}

          {/* Wishlist Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            onClick={handleWishlistClick}
            className="absolute p-1.5 transition-colors bg-white border rounded-full shadow-sm top-2 right-2 border-gray-200 hover:bg-gray-100 hover:text-red-500"
          >
            <Heart className={`w-4 h-4 ${isInWishlist ? "fill-red-500 text-red-500" : "text-gray-400"}`} />
          </motion.button>
        </div>

        <div className="px-3 pt-2">
          <Link to={`/product/${product.slug || product._id}`}>
            <h3 className="text-sm font-medium text-gray-800 line-clamp-2">
              {product.brand }
            </h3>
            <p className="text-xs text-gray-600 line-clamp-1">{product.name}</p>
          </Link>

          <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
            <span>{product.availableSizes?.length || 0} Sizes</span>
            <span>•</span>
            <span>{totalColors} Colors</span>
            <span>•</span>
            <span>{piecesPerSet} pcs/set</span>
          </div>

          {/* Price Section - Same as ProductCard */}
          <div className="flex items-center mt-1 mb-1 space-x-1">
            {hasDiscount && (
              <>
                <span className="text-xs font-medium text-green-600">
                  {discountPercent}% OFF
                </span>
                <span className="text-xs text-gray-500 line-through">₹{product.pricing?.originalPricePerSet}</span>
              </>
            )}
            <span className="text-sm font-bold text-gray-800">₹{product.pricing?.pricePerSet}</span>
          </div>

          {/* Add to Cart Button - SAME STYLE as ProductCard */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowModal(true)}
            className="w-full py-2 text-xs font-medium text-red-600 transition-colors bg-white border border-red-300 rounded-lg hover:bg-red-600 hover:text-white"
          >
            <div className="flex items-center justify-center gap-2">
              <ShoppingCart className="w-3.5 h-3.5" />
              Add to Cart
            </div>
          </motion.button>
        </div>
      </motion.div>

      {/* Color Selection Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="relative w-full max-w-md bg-white rounded-xl shadow-xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white">
                <h3 className="text-lg font-bold">Select Colors</h3>
                <button onClick={() => setShowModal(false)} className="p-1 rounded-full hover:bg-gray-100">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Product Info */}
              <div className="p-4 bg-gray-50 flex gap-3">
                <img src={product.images?.[0]?.url} className="w-16 h-16 object-cover rounded-lg" alt={product.name} />
                <div className="flex-1">
                  <p className="font-medium">{product.name}</p>
                  <p className="text-sm text-gray-500">Sizes: {product.availableSizes?.join(", ")}</p>
                  <p className="text-sm font-bold">₹{product.pricing?.pricePerSet}/set</p>
                </div>
              </div>

              {/* Colors */}
              <div className="p-4 border-b">
                <p className="text-sm font-medium mb-3">Select Colors (Min {minColors}, Max {maxColors})</p>
                <div className="flex flex-wrap gap-2">
                  {product.availableColors?.map((color) => (
                    <button
                      key={color.name}
                      onClick={() => handleColorToggle(color.name)}
                      className={`px-3 py-1.5 rounded-lg text-sm border transition-all ${
                        selectedColors.includes(color.name)
                          ? "border-red-500 bg-red-50 text-red-600"
                          : "border-gray-200 hover:border-red-300"
                      }`}
                    >
                      {color.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quantity */}
              <div className="p-4 border-b">
                <p className="text-sm font-medium mb-3">Quantity (Sets)</p>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-8 h-8 border rounded-lg flex items-center justify-center hover:bg-gray-50"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="font-medium w-8 text-center">{quantity}</span>
                  <button
                    onClick={() => setQuantity(Math.min(10, quantity + 1))}
                    className="w-8 h-8 border rounded-lg flex items-center justify-center hover:bg-gray-50"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Total & Add Button */}
              <div className="p-4 bg-gray-50 flex justify-between items-center sticky bottom-0">
                <div>
                  <p className="text-xs text-gray-500">Total Pieces: {totalPieces}</p>
                  <p className="text-xl font-bold text-red-600">₹{totalPrice.toLocaleString()}</p>
                </div>
                <button
                  onClick={handleAddToCart}
                  disabled={selectedColors.length < minColors}
                  className={`px-6 py-2 rounded-lg font-medium transition-all ${
                    selectedColors.length < minColors
                      ? "bg-gray-300 cursor-not-allowed text-gray-500"
                      : "bg-red-600 text-white hover:bg-red-700"
                  }`}
                >
                  Add to Cart
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default BulkProductCard;