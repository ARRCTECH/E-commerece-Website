"use client";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

import { fetchTrendingProducts } from "../store/slices/productSlice";
import LoadingSpinner from "./LoadingSpinner";

export default function TopPicksShowcase() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { trendingProducts = [], isLoading } = useSelector((state) => state.products);
  const scrollContainerRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    dispatch(fetchTrendingProducts())
      .unwrap()
      .catch(() => {
        setHasError(true);
      });
  }, [dispatch]);

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
  }, [trendingProducts]);

  const scrollLeft = () => {
    if (!scrollContainerRef.current) return;
    scrollContainerRef.current.scrollBy({ left: -320, behavior: "smooth" });
  };

  const scrollRight = () => {
    if (!scrollContainerRef.current) return;
    scrollContainerRef.current.scrollBy({ left: 320, behavior: "smooth" });
  };

  if (isLoading) {
    return (
      <div className="w-full bg-white py-1 px-1">
        <div
          className="w-full mx-auto"
          style={{ maxWidth: "1800px" }}
        >
          <div className="px-2 sm:px-4 md:px-6 lg:px-8 xl:px-12 2xl:px-16 3xl:px-24">
            <div className="text-center mb-8">
              <h1 className="text-xl sm:text-2xl font-black italic">
                TOP 7 <span className="text-red-600">PICKS</span> OF THE WEEK
              </h1>
              <p className="text-gray-700 text-sm sm:text-base font-medium mt-1">
                Best Favorite Styles: Shop the Top Picks
              </p>
            </div>
            <LoadingSpinner />
          </div>
        </div>
      </div>
    );
  }

  if (!trendingProducts.length || hasError) {
    return (
      <div className="w-full bg-white py-3 px-1">
        <div
          className="w-full mx-auto"
          style={{ maxWidth: "1800px" }}
        >
          <div className="px-2 sm:px-4 md:px-6 lg:px-8 xl:px-12 2xl:px-16 3xl:px-24">
            <div className="text-center">
              <h1 className="text-xl sm:text-2xl font-black italic">
                TOP 7 <span className="text-red-600">PICKS</span> OF THE WEEK
              </h1>
              {hasError ? (
                <button
                  onClick={() => {
                    setHasError(false);
                    dispatch(fetchTrendingProducts());
                  }}
                  className="mt-4 px-6 py-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
                >
                  Try Again
                </button>
              ) : (
                <p className="text-gray-400 text-sm text-muted sm:text-base font-sm ">
                  No trending products available at the moment.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const topPicks = trendingProducts.slice(0, 7);

  return (
    <div className="w-full bg-white pt-1 pb-2 px-1">
      <div
        className="w-full mx-auto"
        style={{ maxWidth: "1800px" }}
      >
        <div className="px-2 sm:px-4 md:px-6 lg:px-8 xl:px-12 2xl:px-16 3xl:px-24">
          <div className="flex items-center mb-3 ">
            <div className="text-center flex-1">
              <h1 className="text-xl sm:text-2xl font-black">
                TOP 7 <span className="text-red-600 italic">PICKS</span> OF THE WEEK
              </h1>
              <p className=" text-gray-600 text-sm sm:text-base mt-1">
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
            <div ref={scrollContainerRef} className="flex gap-4 overflow-x-auto scrollbar-hide">
              {topPicks.map((product, index) => {
                const categoryName = product.category?.name || "";
                return (
                  <motion.div
                    key={product._id}
                    initial={{ opacity: 0, x: 40 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.05 }}
                    viewport={{ once: true }}
                    className="flex-shrink-0 w-[48%] sm:w-[18%] border border-gray-300 rounded-lg bg-white relative overflow-hidden"
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
                      {index + 1}
                    </div>

                    {/* Inner content */}
                    <div className="pt-1 px-1 flex flex-col h-auto border-t">
                      <div className="relative aspect-[3/4] overflow-hidden rounded-xl bg-gray-100">
                        <Link to={`/product/${product.slug}`}>
                          <img
                            src={`${product.images?.[0]?.url || "/placeholder.svg"}?t=${new Date(
                              product.updatedAt
                            ).getTime()}`}
                            alt={product.name}
                            className="object-cover w-full h-full"
                          />
                        </Link>
                        {categoryName && (
                          <div
                            className="absolute bottom-2 right-1 px-1 py-0.5 text-[9px] font-semibold text-white rounded"
                            style={{
                              background: "linear-gradient(90deg, #000, #555)",
                            }}
                          >
                            {categoryName}
                          </div>
                        )}
                      </div>

                      <Link to={`/product/${product.slug}`} className="flex-grow">
                        <h3 className="text-[11px] text-black mt-1 mx-1 line-clamp-2 uppercase">
                          {product.name}
                        </h3>
                      </Link>
                      <div className="flex items-center justify-between mt-0.5">
                        <span className="text-xs font-bold">₹{product.price}</span>
                        {product.originalPrice && product.originalPrice > product.price && (
                          <span className="text-[10px] text-red-500 line-through">
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
    </div>
  );
}
