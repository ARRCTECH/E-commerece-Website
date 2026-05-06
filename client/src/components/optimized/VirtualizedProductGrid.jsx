"use client";
import { memo, useRef, useState, useEffect, useCallback } from "react";
import PropTypes from "prop-types";
import { useInView } from "react-intersection-observer";
// Import the optimized ProductCard
import ProductCard from "./ProductCard";
const VirtualizedProductGrid = ({
  products,
  wishlistItems,
  onAddToCart,
  onWishlist,
  gridClassName = "grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5",
  loadMoreThreshold = 0.5,
  itemsPerPage = 12
}) => {
  const [visibleProducts, setVisibleProducts] = useState([]);
  const [page, setPage] = useState(1);
  const loadingRef = useRef(null);
  const [ref, inView] = useInView({
    threshold: loadMoreThreshold,
    triggerOnce: false
  });
  // Load more products when user scrolls to the bottom
  const loadMoreProducts = useCallback(() => {
    const nextPage = page + 1;
    const startIndex = 0;
    const endIndex = nextPage * itemsPerPage;
    // Only load more if there are more products to show
    if (endIndex <= products.length) {
      setVisibleProducts(products.slice(startIndex, endIndex));
      setPage(nextPage);
    }
  }, [itemsPerPage, page, products]);
  // Initialize visible products
  useEffect(() => {
    setVisibleProducts(products.slice(0, itemsPerPage));
    setPage(1);
  }, [products, itemsPerPage]);
  // Load more products when the load more element comes into view
  useEffect(() => {
    if (inView) {
      loadMoreProducts();
    }
  }, [inView, loadMoreProducts]);
  return (
    <>
      <div className={gridClassName}>
        {visibleProducts.map((product) => (
          <ProductCard
            key={product._id}
            product={product}
            wishlistItems={wishlistItems}
            onAddToCart={onAddToCart}
            onWishlist={onWishlist}
          />
        ))}
      </div>
      {/* Load more trigger element */}
      {visibleProducts.length < products.length && (
        <div ref={ref} className="flex items-center justify-center w-full h-20 mt-8">
          <div ref={loadingRef} className="w-8 h-8 border-4 border-gray-200 rounded-full border-t-red-500 animate-spin"></div>
        </div>
      )}
    </>
  );
};
VirtualizedProductGrid.propTypes = {
  products: PropTypes.arrayOf(
    PropTypes.shape({
      _id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      price: PropTypes.number.isRequired
    })
  ).isRequired,
  wishlistItems: PropTypes.array,
  onAddToCart: PropTypes.func.isRequired,
  onWishlist: PropTypes.func.isRequired,
  gridClassName: PropTypes.string,
  loadMoreThreshold: PropTypes.number,
  itemsPerPage: PropTypes.number
};
VirtualizedProductGrid.defaultProps = {
  wishlistItems: [],
  gridClassName: "grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5",
  loadMoreThreshold: 0.5,
  itemsPerPage: 12
};
export default memo(VirtualizedProductGrid);