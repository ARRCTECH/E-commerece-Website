// "use client";
// import { Link } from "react-router-dom";
// import { useEffect, useState } from "react";
// import { useDispatch, useSelector } from "react-redux";
// import { fetchNewArrivals } from "../store/slices/productSlice"; // ✅ import thunk
// import {fetchOversizedProducts} from "../store/slices/productSlice";
// export default function NewArrivals() {
//   const dispatch = useDispatch();
//   const { newArrivals, loading } = useSelector((state) => state.products) || {
//     newArrivals: [],
//     loading: false,
//   };
//   const [productsToShow, setProductsToShow] = useState([]);
//   // ✅ Fetch from API when page loads
//   useEffect(() => {
//     dispatch(fetchNewArrivals());
//   }, [dispatch]);
//   // ✅ Update local state whenever newArrivals changes
//   useEffect(() => {
//     if (newArrivals && newArrivals.length > 0) {
//       setProductsToShow(newArrivals);
//     }
//   }, [newArrivals]);
//   if (loading) {
//     return <p className="text-center text-sm text-gray-500">Loading new arrivals...</p>;
//   }
//   if (!productsToShow || productsToShow.length === 0) {
//     return null;
//   }
//   return (
//     <section className="bg-white ml-2 sm:ml-4">
//       <div className="px-1">
//         {/* Heading */}
//         <div className="flex items-center justify-between mb-1">
//           <h2 className="text-[18px] font-bold text-black mb-2 pt-3 mx-1">New Arrivals</h2>
//           <Link to="/products" className="text-black text-[18px] font-bold leading-none">
//             +
//           </Link>
//         </div>
//         {/* Products Scroll */}
//         <div className="flex overflow-x-auto gap-2 pb-1 scrollbar-hide -mx-3 px-3">
//           {productsToShow.map((product) => {
//             const discountPercentage =
//               product.originalPrice && product.originalPrice > product.price
//                 ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
//                 : 0;
//             return (
//               <div
//                 key={product._id}
//                 className="
//                   flex-shrink-0
//                   border border-gray-500/80 hover:border-gray-800/80 transition-colors duration-200
//                   rounded-[5px] bg-white overflow-hidden shadow-sm
//                   w-[calc(50%-4px)]   /* mobile: 2 per row */
//                   sm:w-[calc(33.333%-5.33px)]
//                   md:w-[calc(25%-6px)]
//                   lg:w-[calc(20%-6.4px)] /* desktop: 5 per row */
//                 "
//               >
//                 {/* Product Image */}
//                 {/* <Link to={`/product/${product._id}`}> */}
//                 <Link to={`/product/${product.slug}`}>
//                   <div className="w-full aspect-[3.5/3.8] bg-gray-100">
//                     <img
//                       src={product.images?.[0]?.url || "/placeholder.svg"}
//                       alt={product.name}
//                       className="w-full h-full object-cover"
//                     />
//                   </div>
//                 </Link>
//                 {/* Product Info */}
//                 <div className="p-1.5">
//                   <p className="text-[9px] font-semibold text-black uppercase">
//                     {product.brand || "EXAMPLE BRAND"}
//                   </p>
//                   {/* <Link to={`/product/${product._id}`}> */}
//                   <Link to={`/product//${product.slug}`}>
//                     <p className="text-[10px] text-black leading-tight mb-0.5 line-clamp-2 uppercase">
//                       {product.name}
//                     </p>
//                   </Link>
//                   {/* Price */}
//                   <div className="flex items-center gap-1">
//                     <span className="text-[12px] font-sans font-bold text-black">₹{product.price}</span>
//                     {discountPercentage > 0 && (
//                       <>
//                         <span className="text-[10px] text-gray-500 line-through">₹{product.originalPrice}</span>
//                         <span className="text-[10px] text-red-500 font-semibold">{discountPercentage}% off</span>
//                       </>
//                     )}
//                   </div>
//                 </div>
//               </div>
//             );
//           })}
//         </div>
//       </div>
//     </section>
//   );
// }

"use client";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchNewArrivals } from "../store/slices/productSlice";

export default function NewArrivals() {
  const dispatch = useDispatch();
  const { newArrivals, loading } = useSelector((state) => state.products) || {
    newArrivals: [],
    loading: false,
  };
  const [productsToShow, setProductsToShow] = useState([]);

  useEffect(() => {
    dispatch(fetchNewArrivals());
  }, [dispatch]);

  useEffect(() => {
    if (newArrivals && newArrivals.length > 0) {
      setProductsToShow(newArrivals);
    }
  }, [newArrivals]);

  if (loading) {
    return <p className="text-center text-sm text-gray-500">Loading new arrivals...</p>;
  }

  if (!productsToShow || productsToShow.length === 0) {
    return null;
  }

  return (
    <section className="bg-white ml-2 sm:ml-4">
      <div className="px-1">
        {/* Heading */}
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-[18px] font-bold text-black mb-2 pt-3 mx-1">New Arrivals</h2>
          <Link to="/products" className="text-black text-[18px] font-bold leading-none">
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
                    w-[calc(50%-4px)]   /* mobile: 2 per row */
                    sm:w-[calc(33.333%-5.33px)]
                    md:w-[calc(25%-6px)]
                    lg:w-[calc(20%-6.4px)] /* desktop: 5 per row */
                  "
                >
                  {/* Product Image */}
                  <Link to={`/product/${product.slug}`}>
                    <div className="w-full aspect-[3.5/3.8] bg-gray-100">
                      <img
                        src={product.images?.[0]?.url || "/placeholder.svg"}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </Link>
                  
                  {/* Product Info */}
                  <div className="p-1.5">
                    <p className="text-[9px] font-semibold text-black uppercase">
                      {product.brand || "EXAMPLE BRAND"}
                    </p>
                    <Link to={`/product/${product.slug}`}>
                      <p className="text-[10px] text-black leading-tight mb-0.5 line-clamp-2 uppercase">
                        {product.name}
                      </p>
                    </Link>
                    
                    {/* Price */}
                    <div className="flex items-center gap-1">
                      <span className="text-[12px] font-sans font-bold text-black">₹{product.price}</span>
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