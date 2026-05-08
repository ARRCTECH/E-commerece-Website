"use client";
import { memo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Star, ArrowDown, Package, ShoppingCart, X, Minus, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { useDispatch } from "react-redux";
import { addToCart, optimisticAddToCart } from "../store/slices/cartSlice";
import toast from "react-hot-toast";

const ProductCard = ({ product, wishlistItems, user, onAddToCart, onWishlist }) => {
  const dispatch = useDispatch();
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [selectedColors, setSelectedColors] = useState([]);
  const [quantity, setQuantity] = useState(1);

  const inWishlist = wishlistItems?.some((item) => item._id === product._id) || false;
  const isBulkProduct = product.isBulkProduct === true;

  // Regular product calculations
  const hasDiscount = product.originalPrice > product.price;
  const discountPercent = hasDiscount
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  // Bulk product calculations
  const piecesPerSet = isBulkProduct 
    ? (product.sizes?.length || 0) * (product.bulkConfig?.piecesPerSize || 1)
    : 0;
  const totalColors = isBulkProduct ? product.colors?.length || 0 : 0;
  const minColors = isBulkProduct ? product.bulkConfig?.minColorsToSelect || 1 : 1;
  const maxColors = isBulkProduct ? product.bulkConfig?.maxColorsToSelect || totalColors : totalColors;
  
  const totalSets = selectedColors.length * quantity;
  const totalPieces = piecesPerSet * totalSets;
  const totalPrice = (product.bulkConfig?.pricePerSet || product.price) * totalSets;

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

  // ✅ FIXED: Add to cart with modal (for Add to Cart button only)
  const handleAddToCartClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isBulkProduct) {
      setShowBulkModal(true);
    } else if (onAddToCart) {
      onAddToCart(product, e);
    }
  };

  const handleAddBulkToCart = async () => {
    if (selectedColors.length < minColors) {
      toast.error(`Please select at least ${minColors} color(s)`);
      return;
    }

    const calculatedTotalSets = selectedColors.length * quantity;
    const calculatedTotalPieces = piecesPerSet * calculatedTotalSets;

    const bulkPayload = {
      productId: product._id,
      isBulkProduct: true,
      selectedColors: selectedColors,
      totalSets: calculatedTotalSets,
      totalPieces: calculatedTotalPieces,
      piecesPerSet: piecesPerSet,
      pricePerSet: product.bulkConfig?.pricePerSet || product.price,
      quantity: calculatedTotalSets
    };

    dispatch(optimisticAddToCart({ 
      product: product,
      isBulkProduct: true,
      selectedColors: selectedColors,
      totalSets: calculatedTotalSets,
      totalPieces: calculatedTotalPieces,
      piecesPerSet: piecesPerSet,
      pricePerSet: product.bulkConfig?.pricePerSet || product.price,
      quantity: calculatedTotalSets
    }));

    try {
      await dispatch(addToCart(bulkPayload)).unwrap();
      toast.success(`${calculatedTotalPieces} pieces added to cart!`);
      setSelectedColors([]);
      setQuantity(1);
      setShowBulkModal(false);
    } catch (error) {
      toast.error(error || "Failed to add to cart");
    }
  };

  // ✅ FIXED: Card click - Always navigate to detail page
  const handleCardClick = (e) => {
    // Do nothing special, Link will handle navigation
    // Modal only opens on Add to Cart button click
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="pb-1.5 overflow-hidden transition-all duration-300 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md"
      >
        <div className="relative">
          {/* ✅ ALWAYS NAVIGATE TO DETAIL PAGE ON CARD CLICK */}
          <Link to={`/product/${product.slug}`} onClick={handleCardClick}>
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
          {isBulkProduct && (
            <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-1 bg-red-600 rounded-full shadow-xs">
              <Package className="w-3 h-3 text-white" />
              <span className="text-xs font-medium text-white">BULK</span>
            </div>
          )}

          {/* Rating Badge */}
          {(product.rating?.average ?? 0) > 0 && (
            <div className="absolute flex items-center px-2 py-1 border border-gray-200 rounded-full shadow-xs bottom-2 right-2 bg-red-100">
              <Star className="w-3 h-3 mr-1 text-yellow-400 fill-current" />
              <span className="text-xs font-medium text-gray-800">
                {product.rating.average.toFixed(1)}
              </span>
            </div>
          )}

          {/* Wishlist Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            onClick={(e) => onWishlist && onWishlist(product, e)}
            className="absolute p-1.5 transition-colors bg-white border rounded-full shadow-sm top-2 right-2 border-gray-200 hover:bg-gray-100 hover:text-red-500"
            aria-label={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
          >
            <Heart className={`w-4 h-4 ${inWishlist ? "fill-red-500 text-red-500" : "text-gray-400"}`} />
          </motion.button>
        </div>

        <div className="px-3 pt-2">
          <Link to={`/product/${product.slug}`} onClick={handleCardClick}>
            <h3 className="text-sm font-medium text-gray-800 line-clamp-2">
              {product.brand || "Ksauni Bliss"}
            </h3>
            <p className="text-xs text-gray-600 line-clamp-1">
              {product.name}
            </p>
          </Link>

          {/* Bulk Info Line */}
          {isBulkProduct && (
            <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
              <span>{product.sizes?.length || 0} Sizes</span>
              <span>•</span>
              <span>{totalColors} Colors</span>
              <span>•</span>
              <span>{piecesPerSet} pcs/set</span>
            </div>
          )}

          {/* Price Section */}
          <div className="flex items-center mt-1 mb-1 space-x-1">
            {!isBulkProduct && hasDiscount && (
              <>
                <span className="flex items-center text-xs font-medium text-green-600">
                  <ArrowDown className="w-3 h-3 mr-0.5" />
                  {discountPercent}%
                </span>
                <span className="text-xs text-gray-500 line-through">₹{product.originalPrice}</span>
              </>
            )}
            {isBulkProduct && product.bulkConfig?.originalPricePerSet > product.bulkConfig?.pricePerSet && (
              <>
                <span className="flex items-center text-xs font-medium text-green-600">
                  <ArrowDown className="w-3 h-3 mr-0.5" />
                  {Math.round(((product.bulkConfig.originalPricePerSet - product.bulkConfig.pricePerSet) / product.bulkConfig.originalPricePerSet) * 100)}%
                </span>
                <span className="text-xs text-gray-500 line-through">₹{product.bulkConfig.originalPricePerSet}</span>
              </>
            )}
            <span className="text-sm font-bold text-gray-800">
              ₹{isBulkProduct ? product.bulkConfig?.pricePerSet : product.price}
            </span>
            {isBulkProduct && <span className="text-xs text-gray-500">/set</span>}
          </div>

          {/* ✅ Add to Cart Button - Only this opens modal for bulk */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleAddToCartClick}
            disabled={!isBulkProduct && product.stock === 0}
            className="w-full py-2 text-xs font-medium text-red-600 transition-colors bg-white border border-red-300 rounded-lg hover:bg-red-600 hover:text-white disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
          >
            <div className="flex items-center justify-center gap-2">
              <ShoppingCart className="w-3.5 h-3.5" />
              Add to Cart
            </div>
          </motion.button>
        </div>
      </motion.div>

      {/* Bulk Product Modal - Only shown on Add to Cart button click */}
      <AnimatePresence>
        {showBulkModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
            onClick={() => setShowBulkModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="relative w-full max-w-md bg-white rounded-xl shadow-xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white">
                <div className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-red-600" />
                  <h3 className="text-lg font-bold">Select Colors</h3>
                </div>
                <button onClick={() => setShowBulkModal(false)} className="p-1 rounded-full hover:bg-gray-100">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Product Info */}
              <div className="p-4 bg-gray-50 flex gap-3">
                <img src={product.images?.[0]?.url} alt={product.name} className="w-16 h-16 object-cover rounded-lg" />
                <div>
                  <p className="font-medium">{product.name}</p>
                  <p className="text-sm text-gray-500">Sizes: {product.sizes?.map(s => s.size).join(", ")}</p>
                  <p className="text-sm font-bold">₹{product.bulkConfig?.pricePerSet}/set</p>
                </div>
              </div>

              {/* Color Selection */}
              {totalColors > 0 && (
                <div className="p-4 border-b">
                  <p className="text-sm font-medium mb-3">Select Colors (Min {minColors}, Max {maxColors})</p>
                  <div className="flex flex-wrap gap-2">
                    {product.colors?.map((color) => (
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
              )}

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

              {/* Summary */}
              <div className="p-4 bg-gray-50">
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Selected Colors:</span>
                    <span className="font-medium">{selectedColors.length} color(s)</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Sets:</span>
                    <span className="font-medium">{selectedColors.length * quantity}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Total Pieces:</span>
                    <span className="font-medium">{piecesPerSet * selectedColors.length * quantity} pcs</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold pt-2 border-t">
                    <span>Total Price:</span>
                    <span className="text-red-600">₹{(product.bulkConfig?.pricePerSet || product.price) * selectedColors.length * quantity}</span>
                  </div>
                </div>

                <button
                  onClick={handleAddBulkToCart}
                  disabled={selectedColors.length < minColors}
                  className={`w-full py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors ${
                    selectedColors.length < minColors
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : "bg-red-600 text-white hover:bg-red-700"
                  }`}
                >
                  <ShoppingCart className="w-5 h-5" />
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

export default memo(ProductCard);