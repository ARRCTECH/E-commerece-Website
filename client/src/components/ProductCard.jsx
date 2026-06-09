"use client";

import { memo, useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Heart, Star, Package, ShoppingCart, X, Minus, Plus, 
  AlertCircle, Check, Shield, Truck, Sparkles, Loader2, 
  Layers, Tag, Zap, Cpu, Battery, Wifi, ArrowUpRight
} from "lucide-react";
import { Link } from "react-router-dom";
import { useDispatch } from "react-redux";
import { addToCart, optimisticAddToCart } from "../store/slices/cartSlice";
import toast from "react-hot-toast";

// ✅ Helper function to get product image (supports new schema)
const getProductImage = (product) => {
  if (!product) return "/placeholder.svg";
  
  // Check commonImages (new schema)
  if (product.commonImages && product.commonImages.length > 0) {
    return product.commonImages[0].url || product.commonImages[0];
  }
  
  // Check first color's images (new schema)
  if (product.colors && product.colors.length > 0) {
    const firstColor = product.colors[0];
    if (firstColor.images && firstColor.images.length > 0) {
      return firstColor.images[0].url || firstColor.images[0];
    }
  }
  
  // Fallback to old images array (if exists)
  if (product.images && product.images.length > 0) {
    return product.images[0].url || product.images[0];
  }
  
  return "/placeholder.svg";
};

// ✅ Helper to get stock (supports new schema)
const getProductStock = (product) => {
  if (!product) return 0;
  
  // For bulk products, return a default value
  if (product.isBulkProduct) return 999;
  
  // Check if product has colors with sizes
  if (product.colors && product.colors.length > 0) {
    let totalStock = 0;
    product.colors.forEach(color => {
      if (color.sizes && color.sizes.length > 0) {
        color.sizes.forEach(size => {
          totalStock += size.stock || 0;
        });
      }
    });
    if (totalStock > 0) return totalStock;
  }
  
  // Fallback to old stock field
  return product.stock || 0;
};

// ✅ Helper to get total sizes count
const getTotalSizes = (product) => {
  if (!product) return 0;
  
  if (product.sizes && product.sizes.length > 0) {
    return product.sizes.length;
  }
  
  if (product.colors && product.colors.length > 0) {
    const sizesSet = new Set();
    product.colors.forEach(color => {
      if (color.sizes) {
        color.sizes.forEach(size => {
          sizesSet.add(size.size);
        });
      }
    });
    return sizesSet.size;
  }
  
  return 0;
};

// ✅ Helper to get total colors count
const getTotalColors = (product) => {
  if (!product) return 0;
  return product.colors?.length || 0;
};

const getColorStyle = (colorName) => {
  const colorMap = {
    red: "#EF4444", blue: "#3B82F6", green: "#10B981", yellow: "#F59E0B",
    purple: "#8B5CF6", pink: "#EC4899", black: "#1F2937", white: "#F9FAFB",
    gray: "#6B7280", orange: "#F97316", teal: "#14B89B", navy: "#1E3A8A",
    brown: "#92400E", beige: "#F5F5DC", lavender: "#E9D8FD", mint: "#D1FAE5"
  };
  const key = colorName?.toLowerCase() || "";
  for (const [name, hex] of Object.entries(colorMap)) {
    if (key.includes(name)) return hex;
  }
  return "#D1D5DB";
};

const Palette = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/>
    <circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/>
    <circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/>
    <circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/>
    <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/>
  </svg>
);

const ProductCard = ({ product, wishlistItems, user, onAddToCart, onWishlist }) => {
  const dispatch = useDispatch();
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [selectedColors, setSelectedColors] = useState([]);
  const [quantity, setQuantity] = useState(1);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [imageError, setImageError] = useState(false);
  const modalRef = useRef(null);

  const inWishlist = wishlistItems?.some((item) => item._id === product._id) || false;
  const isBulkProduct = product.isBulkProduct === true;

  // ✅ Use helper functions
  const productImage = getProductImage(product);
  const totalStock = getProductStock(product);
  const totalSizes = getTotalSizes(product);
  const totalColorsCount = getTotalColors(product);

  const hasDiscount = product.originalPrice > product.price;
  const discountPercent = hasDiscount
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  const piecesPerSet = isBulkProduct 
    ? (totalSizes) * (product.bulkConfig?.piecesPerSize || 1)
    : 0;
  
  const minColors = isBulkProduct ? product.bulkConfig?.minColorsToSelect || 1 : 1;
  const maxColors = isBulkProduct ? product.bulkConfig?.maxColorsToSelect || totalColorsCount : totalColorsCount;
  const isLowStock = !isBulkProduct && totalStock > 0 && totalStock <= 5;

  const features = product.features || product.highlights || [];
  const defaultFeatures = ["Premium", "Fast Ship", "7 Day Returns"];
  const displayFeatures = features.length > 0 ? features.slice(0, 3) : defaultFeatures;

  const avgRating = product.rating?.average || 0;
  const reviewCount = product.rating?.count || 0;
  const stockStatus = totalStock > 0 ? "In Stock" : "Out of Stock";
  const stockColor = totalStock > 0 ? "text-green-600" : "text-red-500";

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape' && showBulkModal) setShowBulkModal(false);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [showBulkModal]);

  useEffect(() => {
    if (showBulkModal && isBulkProduct && product?.colors?.length > 0) {
      const allColors = product.colors.map(color => color.name);
      setSelectedColors(allColors);
    }
  }, [showBulkModal, isBulkProduct, product?._id]);

  useEffect(() => {
    if (showBulkModal && modalRef.current) {
      const focusable = modalRef.current.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
      if (focusable.length) focusable[0].focus();
    }
  }, [showBulkModal]);

  const handleColorToggle = useCallback((colorName) => {
    if (selectedColors.includes(colorName)) {
      setSelectedColors(prev => prev.filter(c => c !== colorName));
    } else {
      if (selectedColors.length >= maxColors) {
        toast.error(`Maximum ${maxColors} colors can be selected`);
        return;
      }
      setSelectedColors(prev => [...prev, colorName]);
    }
  }, [selectedColors, maxColors]);

  const handleAddToCartClick = useCallback(async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isBulkProduct) {
      setShowBulkModal(true);
    } else if (onAddToCart) {
      if (totalStock === 0) {
        toast.error("Out of stock!");
        return;
      }
      setIsAddingToCart(true);
      try {
        await onAddToCart(product, e);
      } catch (error) {
        toast.error("Failed to add to cart");
      } finally {
        setIsAddingToCart(false);
      }
    }
  }, [isBulkProduct, onAddToCart, product, totalStock]);

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

  const handleWishlistClick = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (onWishlist) onWishlist(product, e);
  }, [onWishlist, product]);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        whileHover={{ y: -2 }}
        className="group relative bg-white rounded-2xl overflow-hidden border border-neutral-200/80 hover:border-neutral-900/40 transition-all duration-500 flex flex-col h-full"
      >
        <Link to={`/product/${product.slug}`} className="block relative overflow-hidden">
          <div className="relative aspect-[3/4] bg-gradient-to-br from-neutral-100 to-neutral-200">
            <img
              src={!imageError ? productImage : "/placeholder.svg"}
              alt={product.name}
              className="object-cover w-full h-full transition-transform duration-700 group-hover:scale-110"
              loading="lazy"
              onError={() => setImageError(true)}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-neutral-900/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          </div>

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-1">
            {isBulkProduct && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-600 text-white text-[9px] font-bold shadow-sm">
                <Layers className="w-2.5 h-2.5" />
                BULK
              </span>
            )}
            {hasDiscount && !isBulkProduct && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-neutral-900 text-white text-[9px] font-bold shadow-sm">
                <Zap className="w-2.5 h-2.5" />
                {discountPercent}%
              </span>
            )}
            {!isBulkProduct && totalStock > 0 && totalStock <= 5 && (
              <span className="px-2 py-0.5 rounded-full bg-orange-500 text-white text-[9px] font-semibold shadow-sm">
                Low stock
              </span>
            )}
          </div>

          {/* Wishlist Button */}
          <button
            onClick={handleWishlistClick}
            className="absolute top-3 right-3 p-1.5 bg-white/90 backdrop-blur-sm rounded-full shadow-sm hover:bg-white transition"
            aria-label={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
          >
            <Heart className={`w-3.5 h-3.5 transition-all ${inWishlist ? "fill-red-500 text-red-500" : "text-gray-600"}`} />
          </button>

          {/* Quick CTA */}
          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
            <span className="text-[10px] uppercase tracking-[0.18em] text-white font-medium">
              View Details
            </span>
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-neutral-900">
              <ArrowUpRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </Link>

        <div className="p-3 flex flex-col flex-grow">
          <p className="text-[9px] font-semibold tracking-[0.18em] text-neutral-500 uppercase mb-1">
            {product.brand || (isBulkProduct ? "BULK COLLECTION" : "EXAMPLE BRAND")}
          </p>
          <Link to={`/product/${product.slug}`}>
            <h3 className="text-[12px] font-medium text-neutral-900 leading-snug line-clamp-2 mb-2 group-hover:text-neutral-700 transition-colors">
              {product.name}
            </h3>
          </Link>

          {/* Rating */}
          <div className="flex items-center gap-1 mb-2">
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-2.5 h-2.5 ${star <= Math.round(avgRating) ? "text-yellow-400 fill-current" : "text-gray-300"}`}
                />
              ))}
            </div>
            <span className="text-[9px] text-gray-500">({reviewCount})</span>
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-1.5 flex-wrap mt-auto">
            {hasDiscount && !isBulkProduct && (
              <span className="text-[10px] text-gray-400 line-through">₹{product.originalPrice?.toLocaleString()}</span>
            )}
            <span className="text-base font-semibold text-neutral-900">
              ₹{product.price?.toLocaleString()}
            </span>
            {isBulkProduct && (
              <span className="text-[9px] text-gray-500">/set</span>
            )}
          </div>

          {/* Add to Cart Button */}
          {!isBulkProduct && (
            <button
              onClick={handleAddToCartClick}
              disabled={isAddingToCart || totalStock === 0}
              className={`mt-3 w-full py-2 rounded-full text-xs font-semibold transition-all duration-300 ${
                totalStock === 0
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-red-700 text-white hover:bg-red-600 hover:scale-[1.02]"
              }`}
            >
              {isAddingToCart ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin mx-auto" />
              ) : totalStock === 0 ? (
                "Out of Stock"
              ) : (
                "Add to Cart"
              )}
            </button>
          )}

          {isBulkProduct && (
            <button
              onClick={handleAddToCartClick}
              className="mt-3 w-full py-2 rounded-full bg-red-700 text-white text-xs font-semibold hover:bg-red-600 hover:scale-[1.02] transition-all duration-300"
            >
              Customize Set
            </button>
          )}
        </div>
      </motion.div>

      {/* Bulk Modal */}
      <AnimatePresence>
        {showBulkModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
            onClick={() => setShowBulkModal(false)}
          >
            <motion.div
              ref={modalRef}
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative w-full max-w-md bg-white rounded-xl shadow-2xl max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 z-10 flex items-center justify-between p-4 bg-white border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-full bg-red-100">
                    <Package className="w-4 h-4 text-red-600" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-gray-900">Customize Bulk Set</h3>
                    <p className="text-xs text-gray-500">Mix & match colors</p>
                  </div>
                </div>
                <button onClick={() => setShowBulkModal(false)} className="p-1.5 rounded-full hover:bg-gray-100">
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>

              <div className="p-4 bg-red-50/30 flex gap-3 border-b border-gray-100">
                <div className="w-16 h-16 rounded-lg overflow-hidden shadow-sm flex-shrink-0">
                  <img src={productImage} alt={product.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900 text-sm line-clamp-1">{product.name}</p>
                  <div className="flex flex-wrap gap-1.5 mt-1 text-xs text-gray-500">
                    <span className="flex items-center gap-0.5"><Shield className="w-3 h-3" /> {totalSizes} sizes</span>
                    <span className="flex items-center gap-0.5"><Palette className="w-3 h-3" /> {totalColorsCount} colors</span>
                    <span className="flex items-center gap-0.5"><Package className="w-3 h-3" /> {piecesPerSet} pcs/set</span>
                  </div>
                  <div className="mt-1">
                    <span className="text-lg font-bold text-red-600">₹{product.bulkConfig?.pricePerSet?.toLocaleString()}</span>
                    <span className="text-xs text-gray-500 ml-0.5">/set</span>
                  </div>
                </div>
              </div>

              <div className="overflow-y-auto max-h-[50vh]">
                {totalColorsCount > 0 && (
                  <div className="p-4 border-b border-gray-100">
                    <div className="flex justify-between items-center mb-2">
                      <p className="text-sm font-semibold text-gray-800">Select Colors</p>
                      <span className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-full">Min {minColors} | Max {maxColors}</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {product.colors?.map((color) => {
                        const isSelected = selectedColors.includes(color.name);
                        const colorHex = color.code || getColorStyle(color.name);
                        return (
                          <button
                            key={color.name}
                            onClick={() => handleColorToggle(color.name)}
                            className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium border transition-all ${
                              isSelected
                                ? "border-red-500 bg-red-50 text-red-700"
                                : "border-gray-200 hover:border-red-300"
                            }`}
                          >
                            <span className="w-3 h-3 rounded-full shadow-inner" style={{ backgroundColor: colorHex }} />
                            {color.name}
                            {isSelected && <Check className="w-3 h-3" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="p-4 border-b border-gray-100">
                  <p className="text-sm font-semibold text-gray-800 mb-2">Number of Sets</p>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                      <button onClick={() => setQuantity(Math.max(1, quantity - 1))} disabled={quantity <= 1} className="w-8 h-8 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50">
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-10 text-center text-sm font-bold text-gray-900">{quantity}</span>
                      <button onClick={() => setQuantity(Math.min(10, quantity + 1))} className="w-8 h-8 flex items-center justify-center hover:bg-gray-50">
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    <span className="text-xs text-gray-500">Max 10 sets</span>
                  </div>
                </div>
              </div>

              <div className="sticky bottom-0 p-4 bg-white border-t border-gray-100">
                <div className="space-y-1.5 mb-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Color combos:</span>
                    <span className="font-semibold">{selectedColors.length} × {quantity} sets</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Total sets:</span>
                    <span className="font-semibold">{selectedColors.length * quantity}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Total pieces:</span>
                    <span className="font-semibold">{piecesPerSet * selectedColors.length * quantity}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-gray-200">
                    <span className="text-base font-bold text-gray-900">Total:</span>
                    <span className="text-xl font-bold text-red-600">
                      ₹{((product.bulkConfig?.pricePerSet || product.price) * selectedColors.length * quantity).toLocaleString()}
                    </span>
                  </div>
                </div>
                <button
                  onClick={handleAddBulkToCart}
                  disabled={selectedColors.length < minColors}
                  className={`w-full py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all ${
                    selectedColors.length < minColors
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-red-700 hover:bg-red-600 text-white"
                  }`}
                >
                  <ShoppingCart className="w-4 h-4" />
                  {selectedColors.length < minColors 
                    ? `Select ${minColors - selectedColors.length} more color(s)` 
                    : `Add to Cart • ₹${((product.bulkConfig?.pricePerSet || product.price) * selectedColors.length * quantity).toLocaleString()}`
                  }
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