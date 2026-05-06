"use client";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchOversizedProducts } from "../store/slices/productSlice";

export default function Oversized899() {
  const dispatch = useDispatch();
  const { oversizedProducts, loading } = useSelector((state) => state.products) || {
    oversizedProducts: [],
    loading: false,
  };
  const [productsToShow, setProductsToShow] = useState([]);

  useEffect(() => {
    dispatch(fetchOversizedProducts());
  }, [dispatch]);

  useEffect(() => {
    if (oversizedProducts && oversizedProducts.length > 0) {
      // Filter out duplicate products based on name
      const uniqueProducts = oversizedProducts.filter((product, index, self) =>
        index === self.findIndex((p) => p.name === product.name)
      );
      setProductsToShow(uniqueProducts);
    }
  }, [oversizedProducts]);

  if (loading) {
    return <p className="text-center text-sm text-gray-500">Loading oversized products...</p>;
  }

  if (!productsToShow || productsToShow.length === 0) {
    return null;
  }

  return (
    <section className="bg-white px-2 py-3 ml-2 sm:ml-5">
      <div>
        {/* Heading */}
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-[16px] uppercase font-bold text-black mb-2">Oversized Products</h3>
          <Link to="/products" className="text-black text-[18px] leading-none">
            +
          </Link>
        </div>
        
        {/* Products Scroll - Fixed horizontal scrollbar issue */}
        <div className="relative">
          <div className="flex overflow-x-auto gap-2 pb-1 scrollbar-hide px-3">
            {productsToShow.map((product) => {
              const discountPercentage =
                product.originalPrice && product.originalPrice > product.price
                  ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
                  : 0;
              return (
                <div
                  key={product._id}
                  className="
                    flex-shrink-0
                    border border-gray-500/80 hover:border-gray-800/80 transition-colors duration-200
                    rounded-[5px] bg-white overflow-hidden shadow-sm
                    w-[calc(50%-4px)]   /* mobile: 2 items */
                    sm:w-[calc(20%-6px)] /* desktop: 5 items */
                  "
                >
                  {/* Product Image */}
                  <Link to={`/product/${product.slug}`}>
                    <div className="w-full aspect-[3.5/3.8] bg-gray-100">
                      <img
                        src={
                          product.images?.[0]?.url ||
                          "/placeholder.svg?height=400&width=400&query=product%20image%20placeholder"
                        }
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </Link>
                  
                  {/* Product Info */}
                  <div className="p-1.5">
                    <p className="text-[9px] font-semibold text-black uppercase">{product.brand || "EXAMPLE BRAND"}</p>
                    <Link to={`/product/${product.slug}`}>
                      <p className="text-[10px] text-black uppercase leading-tight mb-0.5 line-clamp-2">
                        {product.name}
                      </p>
                    </Link>
                    
                    {/* Price */}
                    <div className="flex items-center gap-1">
                      <span className="text-[12px] text-black font-bold">₹{product.price}</span>
                      {discountPercentage > 0 && (
                        <>
                          <span className="text-[10px] text-gray-500 line-through">₹{product.originalPrice}</span>
                          <span className="text-[10px] text-red-500 font-semibold">{discountPercentage}% off</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}