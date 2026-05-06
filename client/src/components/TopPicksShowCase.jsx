
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
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
import adminAPI from "../store/api/adminApi"; // Import the adminAPI
import LoadingSpinner from "./LoadingSpinner";
export default function TopPicksShowcase() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items: wishlistItems } = useSelector((state) => state.wishlist);
  const isAddingToCart = useSelector(selectIsAddingToCart);
  const isAddingToWishlist = useSelector(selectIsAddingToWishlist);
  const isRemovingFromWishlist = useSelector(selectIsRemovingFromWishlist);
  // State to manage top 10 products and loading status
  const [top10Products, setTop10Products] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const scrollContainerRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  // New useEffect to fetch Top 10 products from the database
  useEffect(() => {
    const fetchTopPicks = async () => {
      setIsLoading(true);
      try {
        const response = await adminAPI.getAllTop10Products();
        if (response.data?.top10) {
          // Sort by position before setting the state
          const sortedProducts = response.data.top10.sort((a, b) => a.position - b.position);
          setTop10Products(sortedProducts);
        }
      } catch (err) {
        console.error("Failed to fetch top 10 products:", err);
        setError("Failed to load top picks. Please try again later.");
        toast.error("Failed to load top picks.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchTopPicks();
  }, []);
  const checkScrollPosition = () => {
    const c = scrollContainerRef.current;
    if (!c) return;
    setCanScrollLeft(c.scrollLeft > 0);
    setCanScrollRight(c.scrollLeft < c.scrollWidth - c.clientWidth - 10);
  };
  useEffect(() => {
    const c = scrollContainerRef.current;
    if (!c) return;
    c.addEventListener("scroll", checkScrollPosition, { passive: true });
    checkScrollPosition();
    return () => c.removeEventListener("scroll", checkScrollPosition);
  }, [top10Products]);
  const scrollLeft = () => {
    if (!scrollContainerRef.current) return;
    scrollContainerRef.current.scrollBy({ left: -320, behavior: "smooth" });
  };
  const scrollRight = () => {
    if (!scrollContainerRef.current) return;
    scrollContainerRef.current.scrollBy({ left: 320, behavior: "smooth" });
  };
  const handleAddToCart = async (product) => {
    try {
      // Prevent rapid clicks
      const now = Date.now()
      const lastClick = window.lastTopPicksAddToCartClick || 0
      if (now - lastClick < 1000) {
        return
      }
      window.lastTopPicksAddToCartClick = now
      
      const rawSize = product.sizes?.[0]?.size || "";
      const size = rawSize.includes(",") ? rawSize.split(",")[0].trim() : rawSize;
      const rawColor = product.colors?.[0]?.name || "";
      const color = rawColor.includes(",") ? rawColor.split(",")[0].trim() : rawColor;
      const payload = {
        productId: product._id,
        quantity: 1,
        size: size || undefined,
        color: color || undefined,
      };
      dispatch(optimisticAddToCart({ product, quantity: 1, size, color }));
      toast.success(`${product.name} added to cart!`);
      await dispatch(addToCart(payload)).unwrap();
    } catch (err) {
      toast.error(err?.message || "Failed to add item to cart.");
    }
  };
  const handleWishlistToggle = async (product) => {
    try {
      const isInWishlist = wishlistItems.some((i) => i._id === product._id);
      if (isInWishlist) {
        dispatch(optimisticRemoveFromWishlist(product._id));
        toast.success(`${product.name} removed from wishlist!`);
        await dispatch(removeFromWishlist(product._id)).unwrap();
      } else {
        dispatch(optimisticAddToWishlist(product));
        toast.success(`${product.name} added to wishlist!`);
        await dispatch(addToWishlist(product)).unwrap();
      }
    } catch (err) {
      toast.error(err?.message || "Failed to update wishlist.");
    }
  };
  if (isLoading) {
    return (
      <div className="w-full bg-white py-4 mb-4 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8 py-4">
            <h3 className="text-xl sm:text-2xl font-black italic">
              TOP 7 <span className="text-red-600">PICKS</span> OF THE WEEK
            </h3>
            <p className="text-gray-200 text-sm sm:text-base font-small mt-1">
              Best Favorite Styles: Shop the Top Picks
            </p>
          </div>
          <LoadingSpinner />
        </div>
      </div>
    );
  }
  if (!top10Products.length) {
    return (
      <div className="w-full bg-white py-1 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <h3 className="text-xl sm:text-2xl font-black italic">
            TOP 7<span className="text-red-600">PICKS</span> OF THE WEEK
          </h3>
          <p className="text-gray-400 text-sm text-muted sm:text-base font-sm ">
              No top 7 products available at the moment.
          </p>
        </div>
      </div>
    );
  }
  return (
    <div className="w-full bg-white pt-2 pb-3 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6 ">
          <div className="text-center flex-1">
            <h1 className="text-xl sm:text-2xl font-black italic">
              TOP 7 <span className="text-red-600">PICKS</span> OF THE WEEK
            </h1>
            <p className="text-gray-700 text-sm sm:text-base font-medium mt-1">
              Best Favorite Styles: Shop the Top Picks
            </p>
          </div>
          <div className="hidden md:flex space-x-2 ml-6">
            <button
              onClick={scrollLeft}
              disabled={!canScrollLeft}
              className="p-2 border rounded-full disabled:opacity-50"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={scrollRight}
              disabled={!canScrollRight}
              className="p-2 border rounded-full disabled:opacity-50"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="relative">
          <div
            ref={scrollContainerRef}
            className="flex gap-4 overflow-x-auto scrollbar-hide"
          >
            {top10Products.map((item, index) => {
              const product = item.product;
              const isInWishlist = wishlistItems.some((i) => i._id === product._id);
              const categoryName = product.category?.name || "";
              return (
                <motion.div
                  key={product._id}
                  initial={{ opacity: 0, x: 40 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.05 }}
                  viewport={{ once: true }}
                  className="flex-shrink-0 w-[42%] sm:w-48 border border-gray-300 rounded-lg bg-white relative overflow-hidden md:h-[280px]"
                >
                  {/* Counter at top right */}
                  <div
                    className="absolute right-[-5px] top-[-10px] z-30 font-black text-gray-200"
                    style={{
                      fontSize: "4rem",
                      WebkitTextStroke: "1.5px black",
                      textStroke: "1.5px black",
                      lineHeight: 1,
                    }}
                  >
                    {item.position}
                  </div>
                  {/* Inner content */}
                  <div className="pt-[1px] pl-1 pr-5 flex flex-col h-auto border-t">
                    <div className="relative aspect-[3/4] overflow-hidden rounded-md bg-gray-100">
                      {/* <Link to={`/product/${product._id}`}> */}
                      <Link to={`/product/${product.slug}`}>
                        <img
                          src={product.images?.[0]?.url || "/placeholder.svg"}
                          alt={product.name}
                          className="object-cover w-full h-full"
                        />
                      </Link>
                      {categoryName && (
                        <div
                          className="absolute bottom-2 right-1 px-1 py-0.2 text-[9px] font-semibold text-white rounded"
                          style={{
                            background: "linear-gradient(90deg, #000, #555)",
                          }}
                        >
                          {categoryName}
                        </div>
                      )}
                    </div>
                   <Link to={`/product/${product.slug}`} className="flex-grow">
                      <h3 className="text-[11px] font-medium text-black mt-1 mr-1 ml-1 line-clamp-2">
                        {product.name}
                      </h3>
                    </Link>
                    <div className="flex items-center justify-between mt-0.5">
                      <span className="text-xs font-bold">₹{product.price}</span>
                      {product.originalPrice &&
                        product.originalPrice > product.price && (
                          <span className="text-[10px] text-gray-500 line-through">
                            ₹{product.originalPrice}
                          </span>
                        )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}