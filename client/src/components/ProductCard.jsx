"use client";
import { memo, useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Heart, Star, Package, ShoppingCart, X, Minus, Plus, 
  AlertCircle, Check, Shield, Truck, Sparkles, Loader2, 
  Layers, Tag, Zap, Cpu, Battery, Wifi 
} from "lucide-react";
import { Link } from "react-router-dom";
import { useDispatch } from "react-redux";
import { addToCart, optimisticAddToCart } from "../store/slices/cartSlice";
import toast from "react-hot-toast";

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

  const hasDiscount = product.originalPrice > product.price;
  const discountPercent = hasDiscount
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  const piecesPerSet = isBulkProduct 
    ? (product.sizes?.length || 0) * (product.bulkConfig?.piecesPerSize || 1)
    : 0;
  const totalColors = isBulkProduct ? product.colors?.length || 0 : 0;
  const minColors = isBulkProduct ? product.bulkConfig?.minColorsToSelect || 1 : 1;
  const maxColors = isBulkProduct ? product.bulkConfig?.maxColorsToSelect || totalColors : totalColors;
  const isLowStock = !isBulkProduct && product.stock > 0 && product.stock <= 5;

  const features = product.features || product.highlights || [];
  const defaultFeatures = ["Premium", "Fast Ship", "7 Day Returns"];
  const displayFeatures = features.length > 0 ? features.slice(0, 3) : defaultFeatures;

  const avgRating = product.rating?.average || 0;
  const reviewCount = product.rating?.count || 0;
  const stockStatus = product.stock > 0 ? "In Stock" : "Out of Stock";
  const stockColor = product.stock > 0 ? "text-green-600" : "text-red-500";

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape' && showBulkModal) setShowBulkModal(false);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [showBulkModal]);

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
      if (product.stock === 0) {
        toast.error("Out of stock!");
        return;
      }
      setIsAddingToCart(true);
      try {
        await onAddToCart(product, e);
        toast.success("Added to cart!");
      } catch (error) {
        toast.error("Failed to add to cart");
      } finally {
        setIsAddingToCart(false);
      }
    }
  }, [isBulkProduct, onAddToCart, product]);

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

  const productImage = !imageError && product.images?.[0]?.url 
    ? product.images[0].url 
    : "/placeholder.svg";

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        whileHover={{ y: -2 }}
        className={`group relative bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 flex flex-col h-full overflow-hidden ${
          isBulkProduct 
            ? "border-l-4 border border-gray-100" 
            : "border border-gray-100"
        }`}
      >
        <Link to={`/product/${product.slug}`} className="block relative overflow-hidden">
          <div className="relative aspect-[4/3] bg-gray-100">
            <img
              src={productImage}
              alt={product.name}
              className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
              onError={() => setImageError(true)}
            />
          </div>

          <div className="absolute top-1 left-1 flex flex-col gap-0.5">
            {isBulkProduct && (
              <div className="flex items-center gap-0.5 px-1 py-0.5 rounded-full bg-red-600 text-white shadow-sm">
                <Layers className="w-2 h-2" />
                <span className="text-[8px] font-bold">BULK</span>
              </div>
            )}
            {hasDiscount && !isBulkProduct && (
              <div className="flex items-center gap-0.5 px-1 py-0.5 rounded-full bg-red-600 text-white shadow-sm">
                <Zap className="w-2 h-2" />
                <span className="text-[8px] font-bold">{discountPercent}%</span>
              </div>
            )}
            {!isBulkProduct && product.stock > 0 && product.stock <= 5 && (
              <div className="flex items-center gap-0.5 px-1 py-0.5 rounded-full bg-orange-500 text-white text-[8px] shadow-sm">
                <AlertCircle className="w-2 h-2" />
                Low stock
              </div>
            )}
          </div>

          <button
            onClick={handleWishlistClick}
            className="absolute top-1 right-1 p-1 bg-white/90 backdrop-blur-sm rounded-full shadow-sm hover:bg-white transition"
            aria-label={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
          >
            <Heart className={`w-3 h-3 transition-all ${inWishlist ? "fill-red-500 text-red-500" : "text-gray-600 group-hover:text-red-500"}`} />
          </button>
        </Link>

        <div className="p-2 flex flex-col flex-grow">
          <Link to={`/product/${product.slug}`} className="block">
            <h3 className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider">
              {product.brand || (isBulkProduct ? "BULK" : "KSAUNI")}
            </h3>
            <p className="text-[11px] font-medium text-gray-800 line-clamp-2 min-h-[2rem] group-hover:text-red-600 transition-colors">
              {product.name}
            </p>
          </Link>

          {!isBulkProduct && displayFeatures.length > 0 && (
            <div className="flex flex-wrap gap-0.5 mt-1">
              {displayFeatures.map((feature, idx) => (
                <span key={idx} className="inline-flex items-center gap-0.5 px-1 py-0.5 bg-gray-100 text-gray-600 text-[8px] font-medium rounded-full">
                  {idx === 0 && <Cpu className="w-2 h-2" />}
                  {idx === 1 && <Battery className="w-2 h-2" />}
                  {idx === 2 && <Wifi className="w-2 h-2" />}
                  {feature}
                </span>
              ))}
            </div>
          )}

          {isBulkProduct && (
            <div className="flex items-center gap-1 mt-1 text-[8px] bg-red-50 text-red-700 px-1 py-0.5 rounded border border-red-200 w-fit">
              <Package className="w-2 h-2" />
              <span>{product.sizes?.length || 0}s</span>
              <span className="w-0.5 h-0.5 rounded-full bg-red-300" />
              <span>{totalColors}c</span>
              <span className="w-0.5 h-0.5 rounded-full bg-red-300" />
              <span>{piecesPerSet}p/set</span>
            </div>
          )}

          <div className="mt-1 mb-0.5">
            {!isBulkProduct && (
              <div className="flex items-baseline gap-1 flex-wrap">
                {hasDiscount && (
                  <span className="text-[9px] text-gray-400 line-through">₹{product.originalPrice?.toLocaleString()}</span>
                )}
                <span className="text-base font-bold text-gray-900">₹{product.price?.toLocaleString()}</span>
                {hasDiscount && (
                  <span className="text-[8px] font-semibold text-red-600 bg-red-50 px-1 py-0.5 rounded-full">
                    Save ₹{(product.originalPrice - product.price).toLocaleString()}
                  </span>
                )}
              </div>
            )}
            {isBulkProduct && (
              <div className="flex items-baseline gap-1 flex-wrap">
                {product.bulkConfig?.originalPricePerSet > product.bulkConfig?.pricePerSet && (
                  <span className="text-[9px] text-gray-400 line-through">₹{product.bulkConfig.originalPricePerSet?.toLocaleString()}</span>
                )}
                <span className="text-base font-bold text-red-600">₹{product.bulkConfig?.pricePerSet?.toLocaleString()}</span>
                <span className="text-[8px] text-gray-500 bg-gray-100 px-1 py-0.5 rounded-full">/set</span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between mt-0.5 mb-1">
            <div className="flex items-center gap-0.5">
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-2 h-2 ${star <= Math.round(avgRating) ? "text-yellow-400 fill-current" : "text-gray-300"}`}
                  />
                ))}
              </div>
              <span className="text-[9px] text-gray-500">{reviewCount}</span>
            </div>
            <div className={`text-[9px] font-medium ${stockColor}`}>
              {stockStatus}
            </div>
          </div>

          {/* UPDATED BUTTONS: RED & LARGER */}
          <div className="mt-auto flex justify-center align-middle">
            {!isBulkProduct && (
              <>
                {product.stock === 0 ? (
                  <div className="w-full  py-2 bg-gray-100 text-gray-500 text-xs font-semibold rounded-lg text-center">
                    Out of Stock
                  </div>
                ) : (
                  <button
                    onClick={handleAddToCartClick}
                    disabled={isAddingToCart}
                    className="w-full py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-60"
                  >
                    {isAddingToCart ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <ShoppingCart className="w-4 h-4" />
                    )}
                    {isAddingToCart ? "Adding..." : "Add to Cart"}
                  </button>
                )}
              </>
            )}

            {isBulkProduct && (
              <button
                onClick={handleAddToCartClick}
                className="w-full py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-all flex items-center justify-center gap-2 text-sm"
              >
                <Package className="w-4 h-4" />
                Customize
              </button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Bulk Modal (unchanged) */}
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
              className="relative w-full max-w-md bg-white rounded-xl shadow-2xl max-h-[90vh] overflow-hidden border-t-4 border-t-red-500"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 z-10 flex items-center justify-between p-4 bg-white/95 backdrop-blur-sm border-b border-gray-100">
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
                    <span className="flex items-center gap-0.5"><Shield className="w-3 h-3" /> {product.sizes?.length} sizes</span>
                    <span className="flex items-center gap-0.5"><Palette className="w-3 h-3" /> {totalColors} colors</span>
                    <span className="flex items-center gap-0.5"><Package className="w-3 h-3" /> {piecesPerSet} pcs/set</span>
                  </div>
                  <div className="mt-1">
                    <span className="text-lg font-bold text-red-600">₹{product.bulkConfig?.pricePerSet?.toLocaleString()}</span>
                    <span className="text-xs text-gray-500 ml-0.5">/set</span>
                  </div>
                </div>
              </div>

              <div className="overflow-y-auto max-h-[50vh]">
                {totalColors > 0 && (
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
                      : "bg-red-600 hover:bg-red-700 text-white shadow-sm"
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