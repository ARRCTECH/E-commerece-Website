"use client";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, ShoppingBag, ArrowLeft } from "lucide-react";
import {
  fetchWishlist,
  removeFromWishlist,
  clearWishlist,
  optimisticRemoveFromWishlist,
  selectWishlistItems,
  selectWishlistIsLoading,
  selectWishlistError,
} from "../store/slices/wishlistSlice";
import { addToCart, optimisticAddToCart } from "../store/slices/cartSlice";
import ProductCard from "../components/ProductCard";
import toast from "react-hot-toast";

const WishlistPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const items = useSelector(selectWishlistItems);
  const isLoading = useSelector(selectWishlistIsLoading);
  const error = useSelector(selectWishlistError);
  const { items: wishlistItems } = useSelector((state) => state.wishlist);
  const [removingItems, setRemovingItems] = useState(new Set());

  useEffect(() => {
    dispatch(fetchWishlist());
  }, [dispatch]);

  const handleRemoveFromWishlist = async (productId, productName, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    dispatch(optimisticRemoveFromWishlist(productId));
    setRemovingItems((prev) => new Set(prev).add(productId));
    
    const wish = document.getElementById("wish");
    if (wish) wish.click();
    
    try {
      await dispatch(removeFromWishlist(productId)).unwrap();
      toast.success(`${productName} removed from wishlist`);
    } catch (error) {
      dispatch(fetchWishlist());
      toast.error(error.message || "Failed to remove from wishlist");
    } finally {
      setRemovingItems((prev) => {
        const newSet = new Set(prev);
        newSet.delete(productId);
        return newSet;
      });
    }
  };

  const handleAddToCart = async (product, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    const isBulk = product.isBulkProduct === true;

    if (isBulk) {
      // Bulk product - Modal handled by ProductCard
      return;
    }

    const regularPayload = {
      productId: product._id,
      quantity: 1,
      size: product.sizes?.[0]?.size || "",
      color: product.colors?.[0]?.name || "",
      isBulkProduct: false
    };

    dispatch(optimisticAddToCart({ 
      product: product,
      quantity: 1,
      size: regularPayload.size,
      color: regularPayload.color,
      isBulkProduct: false
    }));
    
    const bag = document.getElementById("bag");
    if (bag) bag.click();
    
    try {
      await dispatch(addToCart(regularPayload)).unwrap();
      toast.success(`${product.name} added to cart!`);
    } catch (error) {
      toast.error(error.message || "Failed to add to cart");
    }
  };

  const handleWishlist = async (product, e) => {
    // On wishlist page, heart icon click removes from wishlist
    await handleRemoveFromWishlist(product._id, product.name, e);
  };

  const handleClearWishlist = async () => {
    if (window.confirm("Are you sure you want to clear your wishlist?")) {
      try {
        await dispatch(clearWishlist()).unwrap();
        toast.success("Wishlist cleared successfully");
        const wish = document.getElementById("wish");
        if (wish) wish.click();
      } catch (error) {
        toast.error(error.message || "Failed to clear wishlist");
      }
    }
  };

  if (isLoading && items.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-b-2 border-red-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => dispatch(fetchWishlist())}
            className="px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container px-4 py-8 mx-auto pt-4 md:pt-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 transition-colors rounded-full hover:bg-gray-100"
              aria-label="Go back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-800 md:text-3xl">My Wishlist</h1>
              <p className="text-gray-600">
                {items.length} {items.length === 1 ? "item" : "items"} saved for later
              </p>
            </div>
          </div>
          {items.length > 0 && (
            <button
              onClick={handleClearWishlist}
              className="font-medium text-red-600 transition-colors hover:text-red-700"
            >
              Clear Wishlist
            </button>
          )}
        </div>

        {items.length === 0 ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="py-16 text-center">
            <div className="flex items-center justify-center w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full">
              <Heart className="w-12 h-12 text-gray-400" />
            </div>
            <h2 className="mb-4 text-2xl font-semibold text-gray-800">Your wishlist is empty</h2>
            <p className="max-w-md mx-auto mb-8 text-gray-600">
              Save items you love by clicking the heart icon. They'll appear here for easy shopping later!
            </p>
            <Link
              to="/products"
              className="inline-flex items-center px-6 py-3 space-x-2 text-white transition-colors rounded-lg shadow-md bg-red-600 hover:bg-red-700"
            >
              <ShoppingBag className="w-5 h-5" />
              <span>Start Shopping</span>
            </Link>
          </motion.div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            <AnimatePresence>
              {items.map((product, index) => (
                <div key={product._id}>
                  <ProductCard
                    product={product}
                    wishlistItems={wishlistItems}
                    user={null}
                    onAddToCart={handleAddToCart}
                    onWishlist={handleWishlist}
                  />
                </div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {items.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-12 text-center"
          >
            <Link
              to="/products"
              className="inline-flex items-center px-6 py-3 space-x-2 transition-colors border rounded-lg text-red-600 border-red-600 hover:bg-red-600 hover:text-white"
            >
              <ShoppingBag className="w-5 h-5" />
              <span>Continue Shopping</span>
            </Link>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default WishlistPage;