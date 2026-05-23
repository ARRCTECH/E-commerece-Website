"use client";
import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import { Swiper, SwiperSlide } from "swiper/react";
import { FreeMode, Navigation, Thumbs, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/free-mode";
import "swiper/css/navigation";
import "swiper/css/thumbs";
import "swiper/css/pagination";
import {
  Heart,
  Minus,
  Plus,
  X,
  AlertCircle,
  Ruler,
  ShoppingCart,
  Share2,
} from "lucide-react";
import { fetchProductById, fetchProductBySlug } from "../store/slices/productSlice";
import {
  addToCart,
  optimisticAddToCart,
  selectIsAddingToCart,
} from "../store/slices/cartSlice";
import {
  addToWishlist,
  removeFromWishlist,
  optimisticAddToWishlist,
  optimisticRemoveFromWishlist,
  selectIsAddingToWishlist,
  selectIsRemovingFromWishlist,
} from "../store/slices/wishlistSlice";
import ProductReviews from "../components/ProductReviews";
import RelatedProducts from "../components/RelatedProducts";
import toast from "react-hot-toast";

const ProductDetailPage = () => {
  const { slug } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { currentProduct, isLoading, error } = useSelector((state) => state.products);
  const { items: wishlistItems } = useSelector((state) => state.wishlist);
  const { user } = useSelector((state) => state.auth);
  const isAddingToCart = useSelector(selectIsAddingToCart);
  const isAddingToWishlist = useSelector(selectIsAddingToWishlist);
  const isRemovingFromWishlist = useSelector(selectIsRemovingFromWishlist);

  const [selectedMediaIndex, setSelectedMediaIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [showImageModal, setShowImageModal] = useState(false);
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const [thumbsSwiper, setThumbsSwiper] = useState(null);
  const [showBuyNowSizeModal, setShowBuyNowSizeModal] = useState(false);
  const [showAddToCartSizeModal, setShowAddToCartSizeModal] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [selectedColors, setSelectedColors] = useState([]);
  const [bulkQuantity, setBulkQuantity] = useState(1);

  const isInWishlist = wishlistItems.some((item) => item._id === currentProduct?._id);
  const isBulkProduct = currentProduct?.isBulkProduct === true;
  const piecesPerSet = isBulkProduct
    ? (currentProduct?.sizes?.length || 0) * (currentProduct?.bulkConfig?.piecesPerSize || 1)
    : 0;
  const totalColors = isBulkProduct ? currentProduct?.colors?.length || 0 : 0;
  const minColors = isBulkProduct ? currentProduct?.bulkConfig?.minColorsToSelect || 1 : 1;
  const maxColors = isBulkProduct ? currentProduct?.bulkConfig?.maxColorsToSelect || totalColors : totalColors;

  const totalSets = selectedColors.length * bulkQuantity;
  const totalPieces = piecesPerSet * totalSets;
  const totalPrice = (currentProduct?.bulkConfig?.pricePerSet || currentProduct?.price) * totalSets;

  const mediaItems = [
    ...(currentProduct?.images?.map((img) => ({ type: "image", url: img?.url, alt: currentProduct.name, id: img._id })) || []),
    ...(currentProduct?.videos?.map((vid) => ({ type: "video", url: vid?.url, alt: currentProduct.name, id: vid._id })) || []),
  ];

  const formatDescription = (description) => {
    if (!description) return "";
    return description
      .replace(/(•\s*)/g, "\n• ")
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .join("\n");
  };

  const handleReferralShare = () => {
    if (!user) {
      toast.error("Please login to get your referral link");
      return;
    }
    const referralLink = `${window.location.origin}/register?ref=${user.myreferralCode}`;
    if (navigator.share) {
      navigator
        .share({
          title: "Check out this product!",
          text: `Buy ${currentProduct.name} using my referral link and get rewards!`,
          url: referralLink,
        })
        .catch(() => toast.error("Sharing failed"));
    } else {
      navigator.clipboard.writeText(referralLink);
      toast.success("Referral link copied!");
    }
  };

  useEffect(() => {
    if (slug) {
      dispatch(fetchProductBySlug(slug));
    }
  }, [dispatch, slug]);

  useEffect(() => {
    setSelectedSize("");
  }, [currentProduct?._id]);

  useEffect(() => {
    if (currentProduct && !isBulkProduct) {
      if (currentProduct.colors?.length > 0) setSelectedColor(currentProduct.colors[0].name);
    }
  }, [currentProduct, isBulkProduct]);

  const getDiscountPercentage = () => {
    if (isBulkProduct) {
      const original = currentProduct?.bulkConfig?.originalPricePerSet;
      const current = currentProduct?.bulkConfig?.pricePerSet;
      if (original && original > current) {
        return Math.round(((original - current) / original) * 100);
      }
      return 0;
    }
    if (currentProduct?.originalPrice && currentProduct.originalPrice > currentProduct.price) {
      return Math.round(((currentProduct.originalPrice - currentProduct.price) / currentProduct.originalPrice) * 100);
    }
    return 0;
  };

  const getSelectedSizeStock = () => {
    if (!selectedSize || !currentProduct?.sizes) return currentProduct?.stock || 0;
    const sizeData = currentProduct.sizes.find((s) => s.size === selectedSize);
    return sizeData?.stock || 0;
  };

  const handleColorToggle = (colorName) => {
    if (selectedColors.includes(colorName)) {
      setSelectedColors(selectedColors.filter((c) => c !== colorName));
    } else {
      if (selectedColors.length >= maxColors) {
        toast.error(`Maximum ${maxColors} colors can be selected`);
        return;
      }
      setSelectedColors([...selectedColors, colorName]);
    }
  };

  const handleAddToCartClick = () => {
    if (isBulkProduct) {
      setShowBulkModal(true);
      return;
    }
    if (currentProduct.sizes?.length > 0 && !selectedSize) {
      setShowAddToCartSizeModal(true);
      return false;
    }
    if (currentProduct.colors?.length && !selectedColor) {
      toast.error("Please select a color");
      return false;
    }
    const sizeStock = getSelectedSizeStock();
    if (quantity > sizeStock) {
      return toast.error(`Only ${sizeStock} items available in stock`);
    }
    handleAddToCart();
  };

  const handleAddToCart = async () => {
    if (isBulkProduct) {
      if (selectedColors.length < minColors) {
        toast.error(`Please select at least ${minColors} color(s)`);
        return;
      }
      const bulkPayload = {
        productId: currentProduct._id,
        isBulkProduct: true,
        selectedColors: selectedColors,
        totalSets: totalSets,
        totalPieces: totalPieces,
        piecesPerSet: piecesPerSet,
        pricePerSet: currentProduct?.bulkConfig?.pricePerSet || currentProduct?.price,
        quantity: totalSets,
      };
      dispatch(
        optimisticAddToCart({
          product: currentProduct,
          isBulkProduct: true,
          selectedColors: selectedColors,
          totalSets: totalSets,
          totalPieces: totalPieces,
          piecesPerSet: piecesPerSet,
          pricePerSet: currentProduct?.bulkConfig?.pricePerSet || currentProduct?.price,
          quantity: totalSets,
        })
      );
      toast.success(`${totalPieces} pieces added to cart!`);
      const bag = document.querySelector("#bag");
      if (bag) bag.style.transform = "scale(1.2)";
      try {
        await dispatch(addToCart(bulkPayload)).unwrap();
        setTimeout(() => {
          if (bag) bag.style.transform = "scale(1)";
        }, 200);
        setSelectedColors([]);
        setBulkQuantity(1);
        setShowBulkModal(false);
      } catch (err) {
        toast.error(err?.message || "Failed to add to cart");
        setTimeout(() => {
          if (bag) bag.style.transform = "scale(1)";
        }, 200);
      }
      return;
    }
    const payload = { productId: currentProduct._id, quantity, size: selectedSize, color: selectedColor };
    dispatch(optimisticAddToCart({ product: currentProduct, quantity, size: selectedSize, color: selectedColor }));
    toast.success(`${currentProduct.name} added to cart!`);
    const bag = document.querySelector("#bag");
    if (bag) bag.style.transform = "scale(1.2)";
    try {
      const result = await dispatch(addToCart(payload));
      if (result.type.endsWith("/fulfilled")) {
        setTimeout(() => {
          if (bag) bag.style.transform = "scale(1)";
        }, 200);
      } else {
        toast.error(result.payload?.message || "Failed to add to cart");
        setTimeout(() => {
          if (bag) bag.style.transform = "scale(1)";
        }, 200);
      }
    } catch (err) {
      toast.error(err?.message || "Failed to add to cart");
      setTimeout(() => {
        if (bag) bag.style.transform = "scale(1)";
      }, 200);
    }
  };

  const handleBuyNowClick = () => {
    if (isBulkProduct) {
      if (selectedColors.length < minColors) {
        toast.error(`Please select at least ${minColors} color(s)`);
        return;
      }
      navigate("/checkout", {
        state: {
          buyNow: true,
          isBulkProduct: true,
          buyNowProduct: {
            product: currentProduct,
            quantity: bulkQuantity,
            selectedColors: selectedColors,
            totalSets: selectedColors.length * bulkQuantity,
            totalPieces: piecesPerSet * selectedColors.length * bulkQuantity,
            totalPrice: (currentProduct?.bulkConfig?.pricePerSet || currentProduct?.price) * selectedColors.length * bulkQuantity,
            isBulkProduct: true,
            bulkConfig: currentProduct?.bulkConfig,
            availableSizes: currentProduct?.sizes,
            availableColors: currentProduct?.colors,
            pricePerSet: currentProduct?.bulkConfig?.pricePerSet || currentProduct?.price,
          },
        },
      });
      return;
    }
    if (currentProduct.sizes?.length > 0 && !selectedSize) {
      setShowBuyNowSizeModal(true);
      return;
    }
    if (currentProduct.colors?.length && !selectedColor) {
      toast.error("Please select a color");
      return;
    }
    const sizeStock = getSelectedSizeStock();
    if (quantity > sizeStock) {
      toast.error(`Only ${sizeStock} items available in stock`);
      return;
    }
    handleProceedToCheckout();
  };

  const handleProceedToCheckout = () => {
    navigate("/checkout", {
      state: {
        product: currentProduct,
        quantity,
        size: selectedSize,
        color: selectedColor,
        buyNow: true,
        buyNowProduct: {
          product: currentProduct,
          quantity,
          size: selectedSize,
          color: selectedColor,
          price: currentProduct.price,
          originalPrice: currentProduct.originalPrice,
          images: currentProduct.images,
          name: currentProduct.name,
          brand: currentProduct.brand,
        },
      },
    });
    setShowBuyNowSizeModal(false);
  };

  const handleProceedToAddToCart = () => {
    handleAddToCart();
    setShowAddToCartSizeModal(false);
  };

  const handleWishlistToggle = async () => {
    try {
      if (isInWishlist) {
        dispatch(optimisticRemoveFromWishlist(currentProduct._id));
        toast.success(`${currentProduct.name} removed from wishlist!`);
        await dispatch(removeFromWishlist(currentProduct._id)).unwrap();
      } else {
        dispatch(optimisticAddToWishlist(currentProduct));
        toast.success(`${currentProduct.name} added to wishlist!`);
        await dispatch(addToWishlist(currentProduct)).unwrap();
      }
      const wish = document.querySelector("#wish");
      if (wish) wish.style.transform = "scale(1.2)";
      setTimeout(() => {
        if (wish) wish.style.transform = "scale(1)";
      }, 200);
    } catch (err) {
      if (err?.response?.status !== 401) {
        toast.error(err?.message || "Failed to update wishlist");
      }
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: currentProduct.name,
          text: currentProduct.description,
          url: window.location.href,
        });
      } catch {
        toast.error("Failed to share product");
      }
    } else {
      try {
        await navigator.clipboard.writeText(window.location.href);
        toast.success("Link copied");
      } catch {
        toast.error("Failed to copy");
      }
    }
  };

  const handleViewSimilar = () => {
    if (currentProduct?.category?.slug) {
      navigate(`/products?category=${currentProduct.category.slug}`);
    } else {
      navigate("/products");
    }
  };

  const tagText =
    (Array.isArray(currentProduct?.tags) && currentProduct.tags[0]) ||
    (currentProduct?.isTrending && "TRENDING") ||
    (currentProduct?.isNewArrival && "NEW ARRIVAL") ||
    (currentProduct?.isFeatured && "FEATURED") ||
    "DESIGN OF THE WEEK";

  const fitText =
    typeof currentProduct?.fits === "string"
      ? `${currentProduct.fits} FIT`
      : currentProduct?.fits
      ? `${String(currentProduct.fits)} FIT`
      : "REGULAR FIT";

  const materialText =
    typeof currentProduct?.material === "string"
      ? currentProduct.material
      : currentProduct?.material
      ? String(currentProduct.material)
      : "COTTON";

  if (error || !currentProduct) {
    return (
      <div className="text-center py-20">
        <div className="text-red-500">Product not found</div>
      </div>
    );
  }

  const displayPrice = isBulkProduct
    ? currentProduct?.bulkConfig?.pricePerSet || currentProduct?.price
    : currentProduct?.price;
  const displayOriginalPrice = isBulkProduct
    ? currentProduct?.bulkConfig?.originalPricePerSet
    : currentProduct?.originalPrice;

  return (
    <div className="min-h-screen bg-gray-50 pb-32 sm:pb-24 md:pb-0">
      {/* Desktop Breadcrumb */}
      <div className="hidden md:block bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <nav className="flex items-center text-sm text-gray-600 space-x-2 overflow-x-auto">
            <Link to="/" className="hover:text-primary transition-colors">
              Home
            </Link>
            <span className="text-gray-400">/</span>
            <Link to="/products" className="hover:text-primary transition-colors">
              Products
            </Link>
            <span className="text-gray-400">/</span>
            <Link
              to={`/products/${currentProduct.category?.slug}`}
              className="hover:text-primary transition-colors"
            >
              {currentProduct.category?.name}
            </Link>
            <span className="text-gray-400">/</span>
            <span className="text-gray-800 font-medium truncate">{currentProduct.name}</span>
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        <div className="flex flex-col lg:flex-row lg:gap-8 xl:gap-12">
          {/* LEFT COLUMN - Images & Videos */}
          <div className="lg:w-1/2">
            {/* Mobile Carousel */}
            <div className="lg:hidden relative -mx-4 sm:mx-0 sm:rounded-xl overflow-hidden">
              <div className="absolute top-4 right-4 z-20 flex gap-2">
                <button
                  onClick={handleWishlistToggle}
                  disabled={isAddingToWishlist || isRemovingFromWishlist}
                  className={`p-2.5 rounded-full bg-white/90 backdrop-blur-sm shadow-md ${
                    isInWishlist ? "text-red-500" : "text-gray-700"
                  }`}
                >
                  <Heart id="wish" className={`w-5 h-5 ${isInWishlist ? "fill-current" : ""}`} />
                </button>
                {user && (
                  <button
                    onClick={handleReferralShare}
                    className="p-2.5 rounded-full bg-white/90 backdrop-blur-sm shadow-md text-gray-700"
                  >
                    <Share2 className="w-5 h-5" />
                  </button>
                )}
              </div>
              <Swiper
                spaceBetween={0}
                pagination={{ clickable: true, dynamicBullets: true }}
                modules={[Pagination]}
                className="rounded-none sm:rounded-xl"
              >
                {mediaItems.map((item, idx) => (
                  <SwiperSlide key={idx}>
                    <div className="relative bg-gray-100">
                      {item.type === "image" ? (
                        <img
                          src={item?.url}
                          alt={item.alt}
                          className="w-full aspect-square object-cover"
                          loading="lazy"
                          onClick={() => {
                            setSelectedMediaIndex(idx);
                            setShowImageModal(true);
                          }}
                        />
                      ) : (
                        <video
                          src={item?.url}
                          controls
                          className="w-full aspect-square object-cover"
                          poster={currentProduct.images?.[0]?.url || ""}
                          onClick={(e) => e.stopPropagation()}
                        />
                      )}
                    </div>
                  </SwiperSlide>
                ))}
              </Swiper>
              {/* Mobile product info summary under carousel */}
              <div className="px-4 pt-4 pb-2 bg-white">
                <p className="text-base font-medium text-gray-800">{currentProduct.brand || "Factory Sale"}</p>
                <h1 className="text-xl font-bold text-gray-900 mt-1">{currentProduct.name}</h1>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-2xl font-bold text-gray-900">₹{displayPrice?.toLocaleString()}</span>
                  {displayOriginalPrice && displayOriginalPrice > displayPrice && (
                    <span className="text-base text-gray-500 line-through">₹{displayOriginalPrice?.toLocaleString()}</span>
                  )}
                  {getDiscountPercentage() > 0 && (
                    <span className="text-sm font-semibold text-green-600">{getDiscountPercentage()}% OFF</span>
                  )}
                  {isBulkProduct && <span className="text-sm text-gray-500">/set</span>}
                </div>
              </div>
            </div>

            {/* Desktop Gallery */}
            <div className="hidden lg:block">
              <div className="flex flex-row-reverse gap-4">
                <div className="flex-1 bg-gray-50 rounded-2xl overflow-hidden">
                  <div className="relative group">
                    {mediaItems[selectedMediaIndex]?.type === "image" ? (
                      <img
                        src={mediaItems[selectedMediaIndex]?.url}
                        alt={currentProduct.name}
                        className="w-full h-auto object-contain cursor-zoom-in"
                        onClick={() => setShowImageModal(true)}
                      />
                    ) : (
                      <video
                        src={mediaItems[selectedMediaIndex]?.url}
                        controls
                        className="w-full h-auto object-contain"
                        poster={currentProduct.images?.[0]?.url || ""}
                      />
                    )}
                    {getSelectedSizeStock() === 0 && !isBulkProduct && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                        <span className="bg-white text-gray-800 px-5 py-2 rounded-full font-semibold">Out of Stock</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="w-24 space-y-3">
                  {mediaItems.map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedMediaIndex(idx)}
                      className={`w-24 rounded-xl overflow-hidden border-2 transition-all ${
                        selectedMediaIndex === idx
                          ? "border-primary ring-2 ring-primary/30 shadow-md"
                          : "border-gray-200 hover:border-gray-400"
                      }`}
                    >
                      {item.type === "image" ? (
                        <img
                          src={item?.url}
                          alt={`${item.alt} ${idx + 1}`}
                          className="w-full aspect-square object-cover"
                        />
                      ) : (
                        <div className="relative w-full aspect-square bg-gray-900 flex items-center justify-center">
                          <video src={item?.url} className="w-full h-full object-cover" muted preload="metadata" />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M8 5v14l11-7z" />
                            </svg>
                          </div>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN - Product Info */}
          <div className="lg:w-1/2 mt-6 lg:mt-0">
            {/* Desktop header */}
            <div className="hidden lg:block mb-6">
              <p className="text-lg font-medium text-gray-700">{currentProduct.brand || "Factory Sale"}</p>
              <h1 className="text-2xl font-bold text-gray-900 mt-1">{currentProduct.name}</h1>
              <div className="flex items-center gap-3 mt-3">
                <span className="text-3xl font-bold text-gray-900">₹{displayPrice?.toLocaleString()}</span>
                {displayOriginalPrice && displayOriginalPrice > displayPrice && (
                  <span className="text-xl text-gray-500 line-through">₹{displayOriginalPrice?.toLocaleString()}</span>
                )}
                {getDiscountPercentage() > 0 && (
                  <span className="text-base font-semibold text-green-600">{getDiscountPercentage()}% OFF</span>
                )}
                {isBulkProduct && <span className="text-sm text-gray-500">/ set</span>}
              </div>
            </div>

            {/* Tags - Mobile & Desktop */}
            <div className="flex flex-wrap gap-2 mb-5">
              <div className="text-[11px] sm:text-xs font-bold uppercase tracking-wide px-3 py-1.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                {String(tagText).replace(/-/g, " ")}
              </div>
              <div className="text-[11px] sm:text-xs font-bold uppercase tracking-wide px-3 py-1.5 rounded-full bg-gray-100 text-gray-700 border border-gray-200">
                {String(fitText).replace(/-/g, " ")}
              </div>
              <div className="text-[11px] sm:text-xs font-bold uppercase tracking-wide px-3 py-1.5 rounded-full bg-white text-gray-700 border border-gray-300">
                {String(materialText).replace(/-/g, " ")}
              </div>
            </div>

            {/* Colors */}
            {!isBulkProduct ? (
              currentProduct.colors?.length > 0 && (
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-base font-semibold text-gray-800">
                      Color: <span className="font-normal text-gray-600">{selectedColor}</span>
                    </h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {currentProduct.colors.map((color) => (
                      <motion.button
                        key={color.name}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setSelectedColor(color.name)}
                        className={`relative w-10 h-10 rounded-full border-2 ${
                          selectedColor === color.name ? "border-primary shadow-md" : "border-gray-200"
                        }`}
                      >
                        <div
                          className="w-full h-full rounded-full"
                          style={{ backgroundColor: color.hex || color.name.toLowerCase() }}
                        />
                        {selectedColor === color.name && (
                          <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full border-2 border-white" />
                        )}
                      </motion.button>
                    ))}
                  </div>
                </div>
              )
            ) : (
              totalColors > 0 && (
                <div className="mb-6">
                  <h3 className="text-base font-semibold text-gray-800 mb-3">
                    Select Colors <span className="text-sm font-normal text-gray-500">(Min {minColors} | Max {maxColors})</span>
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {currentProduct.colors.map((color) => (
                      <button
                        key={color.name}
                        onClick={() => handleColorToggle(color.name)}
                        className={`px-3 py-1.5 rounded-full text-sm border ${
                          selectedColors.includes(color.name)
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        {color.name}
                      </button>
                    ))}
                  </div>
                  {selectedColors.length > 0 && (
                    <p className="text-xs text-gray-500 mt-2">Selected: {selectedColors.join(", ")}</p>
                  )}
                </div>
              )
            )}

            {/* Sizes */}
            {!isBulkProduct ? (
              currentProduct.sizes?.length > 0 && (
                <div className="mb-6" data-size-section>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-base font-semibold text-gray-800">
                      Size:{" "}
                      <span className={`font-normal ${!selectedSize ? "text-red-500" : "text-gray-600"}`}>
                        {selectedSize || "Please select"}
                      </span>
                    </h3>
                    <button
                      onClick={() => setShowSizeGuide(true)}
                      className="text-sm font-medium text-primary flex items-center gap-1"
                    >
                      <Ruler className="w-4 h-4" /> Size Guide
                    </button>
                  </div>
                  {!selectedSize && (
                    <div className="mb-3 p-2.5 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-600 font-medium flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" /> Please select a size to continue
                      </p>
                    </div>
                  )}
                  <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                    {currentProduct.sizes.map((s) => (
                      <button
                        key={s.size}
                        onClick={() => setSelectedSize(s.size)}
                        disabled={s.stock === 0}
                        className={`py-2.5 rounded-lg border font-medium text-sm transition-all ${
                          selectedSize === s.size
                            ? "border-primary bg-primary/10 text-primary"
                            : s.stock === 0
                            ? "border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed"
                            : "border-gray-300 hover:border-primary hover:text-primary"
                        }`}
                      >
                        {s.size}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    {selectedSize ? `${getSelectedSizeStock()} available in ${selectedSize}` : "Select a size to see availability"}
                  </p>
                </div>
              )
            ) : (
              currentProduct.sizes?.length > 0 && (
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-base font-semibold text-gray-800">Sizes Included:</h3>
                    <button onClick={() => setShowSizeGuide(true)} className="text-sm font-medium text-primary flex items-center gap-1">
                      <Ruler className="w-4 h-4" /> Size Guide
                    </button>
                  </div>
                  <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 p-3 bg-gray-50 rounded-xl">
                    {currentProduct.sizes.map((s) => (
                      <div key={s.size} className="py-2 text-center rounded-lg border border-gray-200 bg-white text-sm font-medium">
                        {s.size}
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    ✓ You will get {currentProduct.bulkConfig?.piecesPerSize || 1} piece(s) of each size per set
                  </p>
                </div>
              )
            )}

            {/* Quantity */}
            {!isBulkProduct ? (
              <div className="mb-6">
                <h3 className="text-base font-semibold text-gray-800 mb-3">Quantity</h3>
                <div className="flex items-center gap-4">
                  <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={quantity <= 1}
                      className="p-2.5 hover:bg-gray-50 text-gray-600 disabled:opacity-50"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-12 text-center font-medium">{quantity}</span>
                    <button
                      onClick={() => setQuantity(Math.min(getSelectedSizeStock(), quantity + 1))}
                      disabled={quantity >= getSelectedSizeStock()}
                      className="p-2.5 hover:bg-gray-50 text-gray-600 disabled:opacity-50"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <span className="text-sm text-gray-500">{getSelectedSizeStock()} in stock</span>
                </div>
              </div>
            ) : (
              <div className="mb-6">
                <h3 className="text-base font-semibold text-gray-800 mb-3">Quantity (Sets)</h3>
                <div className="flex items-center gap-4">
                  <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                    <button
                      onClick={() => setBulkQuantity(Math.max(1, bulkQuantity - 1))}
                      disabled={bulkQuantity <= 1}
                      className="p-2.5 hover:bg-gray-50 text-gray-600 disabled:opacity-50"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-12 text-center font-medium">{bulkQuantity}</span>
                    <button
                      onClick={() => setBulkQuantity(Math.min(10, bulkQuantity + 1))}
                      disabled={bulkQuantity >= 10}
                      className="p-2.5 hover:bg-gray-50 text-gray-600 disabled:opacity-50"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <span className="text-sm text-gray-500">Max 10 sets</span>
                </div>
              </div>
            )}

            {/* Action Buttons - Desktop */}
            <div className="hidden md:flex gap-3 mt-8 pt-4 border-t border-gray-200">
              <button
                onClick={handleAddToCartClick}
                disabled={
                  isAddingToCart ||
                  (!isBulkProduct && selectedSize && getSelectedSizeStock() === 0) ||
                  (isBulkProduct && selectedColors.length < minColors)
                }
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm border-2 transition-all disabled:cursor-not-allowed bg-white border-gray-300 text-gray-800 hover:border-gray-400 hover:bg-gray-50"
              >
                <ShoppingCart className="w-5 h-5" /> ADD TO CART
              </button>
              <button
                onClick={handleBuyNowClick}
                disabled={
                  isAddingToCart ||
                  (!isBulkProduct && selectedSize && getSelectedSizeStock() === 0) ||
                  (isBulkProduct && selectedColors.length < minColors)
                }
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm bg-red-600 text-white hover:bg-red-700 transition-all disabled:bg-gray-400"
              >
                <img src="/buynow1.svg" className="w-5 h-5" alt="buy now" /> BUY NOW
              </button>
            </div>

            {/* Description */}
            <div className="mt-6">
              <h3 className="text-base font-semibold text-gray-800 mb-2">Product Description</h3>
              <div className={`text-sm text-gray-600 leading-relaxed ${showFullDescription ? "" : "line-clamp-4"}`}>
                <div className="whitespace-pre-wrap font-sans">{formatDescription(currentProduct?.description)}</div>
              </div>
              <button
                onClick={() => setShowFullDescription(!showFullDescription)}
                className="text-primary text-sm font-medium mt-1 hover:underline"
              >
                {showFullDescription ? "Show Less" : "Read More"}
              </button>
            </div>

            {/* Product Details */}
            <div className="mt-6 pt-4 border-t border-gray-100 space-y-3">
              {currentProduct.material && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-800">Material & Care</h4>
                  <p className="text-sm text-gray-600 mt-1">{currentProduct.material}</p>
                </div>
              )}
              {currentProduct.fits && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-800">Fit</h4>
                  <p className="text-sm text-gray-600 mt-1">{currentProduct.fits} Fit</p>
                </div>
              )}
              {currentProduct.care && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-800">Care Instructions</h4>
                  <p className="text-sm text-gray-600 mt-1">{currentProduct.care}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Badge Section */}
        <div className="mt-10">
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
            <img src="/badge.jpeg" className="w-full h-auto" alt="badge" />
          </div>
        </div>

        {/* Reviews & Related Products */}
        <div id="reviews" className="mt-10">
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <ProductReviews productId={currentProduct._id} />
          </div>
        </div>
        <div className="mt-10">
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <RelatedProducts currentProduct={currentProduct} />
          </div>
        </div>
      </div>

      {/* Mobile Fixed Bottom Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-3 z-40 shadow-lg">
        <div className="flex gap-3">
          <button
            onClick={handleAddToCartClick}
            disabled={
              isAddingToCart ||
              (!isBulkProduct && selectedSize && getSelectedSizeStock() === 0) ||
              (isBulkProduct && selectedColors.length < minColors)
            }
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm bg-white border border-gray-300 text-gray-800"
          >
            <ShoppingCart className="w-5 h-5" /> ADD
          </button>
          <button
            onClick={handleBuyNowClick}
            disabled={
              isAddingToCart ||
              (!isBulkProduct && selectedSize && getSelectedSizeStock() === 0) ||
              (isBulkProduct && selectedColors.length < minColors)
            }
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm bg-red-600 text-white"
          >
            <img src="/buynow1.svg" className="w-5 h-5" alt="buy" /> BUY NOW
          </button>
        </div>
      </div>

      {/* ==================== ALL MODALS ==================== */}

      {/* Bulk Modal */}
      <AnimatePresence>
        {showBulkModal && isBulkProduct && (
          <motion.div
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowBulkModal(false)}
          >
            <motion.div
              className="relative bg-white rounded-xl w-full max-w-md max-h-[85vh] overflow-y-auto"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900">Select Colors</h3>
                  <button onClick={() => setShowBulkModal(false)} className="p-1 rounded-full hover:bg-gray-100">
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
                <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-100">
                  <img
                    src={currentProduct.images[0]?.url || "/placeholder.svg"}
                    alt={currentProduct.name}
                    className="w-14 h-14 object-cover rounded-lg"
                  />
                  <div>
                    <h4 className="font-semibold text-gray-900 text-sm">{currentProduct.name}</h4>
                    <p className="text-lg font-bold text-gray-900">₹{displayPrice?.toLocaleString()}/set</p>
                  </div>
                </div>
                <div className="mb-4">
                  <p className="text-sm text-gray-600">Sizes: {currentProduct.sizes?.map((s) => s.size).join(", ")}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    ✓ {currentProduct.bulkConfig?.piecesPerSize || 1} piece(s) of each size per set
                  </p>
                </div>
                <div className="mb-5">
                  <p className="text-sm font-medium mb-3">
                    Select Colors (Min {minColors}, Max {maxColors})
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {currentProduct.colors?.map((color) => (
                      <button
                        key={color.name}
                        onClick={() => handleColorToggle(color.name)}
                        className={`px-3 py-1.5 rounded-lg text-sm border ${
                          selectedColors.includes(color.name)
                            ? "border-red-500 bg-red-50 text-red-600"
                            : "border-gray-200"
                        }`}
                      >
                        {color.name}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="mb-5">
                  <p className="text-sm font-medium mb-3">Quantity (Sets)</p>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setBulkQuantity(Math.max(1, bulkQuantity - 1))}
                      className="p-1.5 border rounded-lg px-3"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="font-medium w-8 text-center">{bulkQuantity}</span>
                    <button
                      onClick={() => setBulkQuantity(Math.min(10, bulkQuantity + 1))}
                      className="p-1.5 border rounded-lg px-3"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-gray-600">Total Pieces:</span>
                    <span className="font-medium">{totalPieces} pcs</span>
                  </div>
                  <div className="flex justify-between mb-4">
                    <span className="text-sm text-gray-600">Total Price:</span>
                    <span className="text-xl font-bold text-red-600">₹{totalPrice.toLocaleString()}</span>
                  </div>
                  <button
                    onClick={handleAddToCart}
                    disabled={selectedColors.length < minColors}
                    className="w-full py-2.5 rounded-lg font-medium bg-red-600 text-white disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    Add to Cart
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Buy Now Size Modal */}
      <AnimatePresence>
        {showBuyNowSizeModal && !isBulkProduct && (
          <motion.div
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowBuyNowSizeModal(false)}
          >
            <motion.div
              className="relative bg-white rounded-xl w-full max-w-md max-h-[85vh] overflow-y-auto"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900">Select Size</h3>
                  <button onClick={() => setShowBuyNowSizeModal(false)} className="p-1 rounded-full hover:bg-gray-100">
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
                <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-100">
                  <img
                    src={currentProduct.images[0]?.url || "/placeholder.svg"}
                    alt={currentProduct.name}
                    className="w-14 h-14 object-cover rounded-lg"
                  />
                  <div>
                    <h4 className="font-semibold text-gray-900 text-sm">{currentProduct.name}</h4>
                    <p className="text-lg font-bold text-gray-900">₹{currentProduct.price.toLocaleString()}</p>
                  </div>
                </div>
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-base font-semibold text-gray-800">Select Size</h4>
                    <button
                      onClick={() => {
                        setShowBuyNowSizeModal(false);
                        setShowSizeGuide(true);
                      }}
                      className="text-sm font-medium text-primary flex items-center gap-1"
                    >
                      <Ruler className="w-4 h-4" /> Size Guide
                    </button>
                  </div>
                  <div className="grid grid-cols-4 gap-2 mb-4">
                    {currentProduct.sizes.map((s) => (
                      <button
                        key={s.size}
                        onClick={() => setSelectedSize(s.size)}
                        disabled={s.stock === 0}
                        className={`py-2.5 rounded-lg border font-medium text-sm ${
                          selectedSize === s.size
                            ? "border-red-500 bg-red-50 text-red-600"
                            : s.stock === 0
                            ? "border-gray-200 bg-gray-100 text-gray-400"
                            : "border-gray-300 hover:border-red-400"
                        }`}
                      >
                        {s.size}
                      </button>
                    ))}
                  </div>
                  <p className="text-sm text-gray-600 text-center">
                    {selectedSize ? `Selected: ${selectedSize} - ${getSelectedSizeStock()} available` : "Please select a size"}
                  </p>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setShowBuyNowSizeModal(false)} className="flex-1 py-3 border border-gray-300 rounded-lg">
                    Cancel
                  </button>
                  <button
                    onClick={handleProceedToCheckout}
                    disabled={!selectedSize}
                    className="flex-1 py-3 rounded-lg bg-red-600 text-white disabled:bg-gray-400"
                  >
                    Buy Now
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add to Cart Size Modal */}
      <AnimatePresence>
        {showAddToCartSizeModal && !isBulkProduct && (
          <motion.div
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowAddToCartSizeModal(false)}
          >
            <motion.div
              className="relative bg-white rounded-xl w-full max-w-md max-h-[85vh] overflow-y-auto"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900">Select Size</h3>
                  <button onClick={() => setShowAddToCartSizeModal(false)} className="p-1 rounded-full hover:bg-gray-100">
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
                <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-100">
                  <img
                    src={currentProduct.images[0]?.url || "/placeholder.svg"}
                    alt={currentProduct.name}
                    className="w-14 h-14 object-cover rounded-lg"
                  />
                  <div>
                    <h4 className="font-semibold text-gray-900 text-sm">{currentProduct.name}</h4>
                    <p className="text-lg font-bold text-gray-900">₹{currentProduct.price.toLocaleString()}</p>
                  </div>
                </div>
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-base font-semibold text-gray-800">Select Size</h4>
                    <button
                      onClick={() => {
                        setShowAddToCartSizeModal(false);
                        setShowSizeGuide(true);
                      }}
                      className="text-sm font-medium text-primary flex items-center gap-1"
                    >
                      <Ruler className="w-4 h-4" /> Size Guide
                    </button>
                  </div>
                  <div className="grid grid-cols-4 gap-2 mb-4">
                    {currentProduct.sizes.map((s) => (
                      <button
                        key={s.size}
                        onClick={() => setSelectedSize(s.size)}
                        disabled={s.stock === 0}
                        className={`py-2.5 rounded-lg border font-medium text-sm ${
                          selectedSize === s.size
                            ? "border-red-500 bg-red-50 text-red-600"
                            : s.stock === 0
                            ? "border-gray-200 bg-gray-100 text-gray-400"
                            : "border-gray-300 hover:border-red-400"
                        }`}
                      >
                        {s.size}
                      </button>
                    ))}
                  </div>
                  <p className="text-sm text-gray-600 text-center">
                    {selectedSize ? `Selected: ${selectedSize} - ${getSelectedSizeStock()} available` : "Please select a size"}
                  </p>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setShowAddToCartSizeModal(false)} className="flex-1 py-3 border border-gray-300 rounded-lg">
                    Cancel
                  </button>
                  <button
                    onClick={handleProceedToAddToCart}
                    disabled={!selectedSize}
                    className="flex-1 py-3 rounded-lg bg-red-600 text-white disabled:bg-gray-400"
                  >
                    Add to Cart
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Image Modal */}
      <AnimatePresence>
        {showImageModal && mediaItems[selectedMediaIndex]?.type === "image" && (
          <motion.div
            className="fixed inset-0 bg-black z-50 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowImageModal(false)}
          >
            <button
              onClick={() => setShowImageModal(false)}
              className="absolute top-4 right-4 p-2 text-white bg-black/50 rounded-full z-10"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={mediaItems[selectedMediaIndex]?.url}
              alt={currentProduct.name}
              className="w-full h-auto max-h-screen object-contain p-4"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Size Guide Modal */}
      <AnimatePresence>
        {showSizeGuide && (
          <motion.div
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowSizeGuide(false)}
          >
            <motion.div
              className="relative bg-white rounded-xl w-full max-w-md max-h-[85vh] overflow-y-auto"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-bold text-gray-900">Size Guide</h3>
                  <button onClick={() => setShowSizeGuide(false)} className="p-1 rounded-full hover:bg-gray-100">
                    <X className="w-5 h-5 text-gray-700" />
                  </button>
                </div>
                <img src="/6.webp" alt="Size Guide" className="w-full h-auto rounded-lg" />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProductDetailPage;