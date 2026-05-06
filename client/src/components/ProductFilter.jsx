"use client";
import { useState, useEffect, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, X, Tag, DollarSign, Star } from "lucide-react";
const ProductFilters = memo(({ filters, categories, onFilterChange, onClearFilters, onClose }) => {
  const [expandedSections, setExpandedSections] = useState({
    categories: true,
    price: true,
    rating: true,
  });
  const [selectedRatings, setSelectedRatings] = useState([]);
  useEffect(() => {
    if (filters.minRating) {
      // Convert minRating back to selected ratings
      const rating = Number.parseFloat(filters.minRating);
      const ratingsToSelect = [4, 3, 2, 1].filter((r) => r >= rating);
      setSelectedRatings(ratingsToSelect);
    } else {
      setSelectedRatings([]);
    }
  }, [filters.minRating]);
  const toggleSection = (section) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };
  const priceRanges = [
    { label: "Under ₹500", min: "", max: "500" },
    { label: "₹500 - ₹1000", min: "500", max: "1000" },
    { label: "₹1000 - ₹2000", min: "1000", max: "2000" },
    { label: "₹2000 - ₹5000", min: "2000", max: "5000" },
    { label: "Above ₹5000", min: "5000", max: "" },
  ];
  const ratings = [4, 3, 2, 1];
  const handlePriceChange = (field, value) => {
    onFilterChange({
      ...filters,
      [field]: value,
    });
  };
  const handleRatingChange = (rating) => {
    const newRatings = selectedRatings.includes(rating)
      ? selectedRatings.filter((r) => r !== rating)
      : [...selectedRatings, rating];
    // Calculate the minimum rating from selected ratings
    const minRating = newRatings.length > 0 ? Math.max(...newRatings) : null;
    setSelectedRatings(newRatings);
    onFilterChange({
      minRating: minRating ? minRating.toString() : "",
    });
  };
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="p-6 space-y-6 bg-white border border-gray-100 shadow-lg rounded-xl"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Filters</h2>
        {onClose && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClose}
            className="p-2 transition-colors rounded-full hover:bg-gray-100"
          >
            <X className="w-6 h-6 text-gray-600" />
          </motion.button>
        )}
      </div>
      <div className="pb-4 border-b border-gray-100">
        <motion.button
          whileHover={{ scale: 1.01 }}
          onClick={() => toggleSection("categories")}
          className="flex items-center justify-between w-full py-2 text-left"
        >
          <h3 className="flex items-center text-lg font-semibold text-gray-800">
            <Tag className="w-5 h-5 mr-2 text-ksauni-red" />
            Categories
          </h3>
          <motion.div animate={{ rotate: expandedSections.categories ? 180 : 0 }}>
            <ChevronDown className="w-5 h-5 text-gray-500" />
          </motion.div>
        </motion.button>
        <AnimatePresence>
          {expandedSections.categories && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-3 space-y-2">
                <motion.label
                  whileHover={{ scale: 1.01 }}
                  className="flex items-center text-gray-700 transition-colors cursor-pointer hover:text-ksauni-red"
                >
                  <input
                    type="radio"
                    name="category"
                    checked={!filters.category}
                    onChange={() => onFilterChange({ category: "" })}
                    className="w-4 h-4 border-gray-300 rounded text-ksauni-red focus:ring-ksauni-red"
                  />
                  <span className="ml-2">All Categories</span>
                </motion.label>
                {categories
                  .filter(cat => {
                    const excludedSlugs = ["anime-t-shirt", "ksauni-tshirts-styles"];
                    return !excludedSlugs.includes(cat.slug);
                  })
                  .map((category) => (
                    <motion.label
                      key={category._id}
                      whileHover={{ scale: 1.01 }}
                      className="flex items-center text-gray-700 transition-colors cursor-pointer hover:text-ksauni-red"
                    >
                      <input
                        type="radio"
                        name="category"
                        checked={filters.category === category.slug}
                        onChange={() => onFilterChange({ category: category.slug })}
                        className="w-4 h-4 border-gray-300 rounded text-ksauni-red focus:ring-ksauni-red"
                      />
                      <span className="ml-2">{category.name}</span>
                      <span className="ml-auto text-sm text-gray-500">({category.productCount || 0})</span>
                    </motion.label>
                  ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <div className="pb-4 border-b border-gray-100">
        <motion.button
          whileHover={{ scale: 1.01 }}
          onClick={() => toggleSection("price")}
          className="flex items-center justify-between w-full py-2 text-left"
        >
          <h3 className="flex items-center text-lg font-semibold text-gray-800">
            Price Range
          </h3>
          <motion.div animate={{ rotate: expandedSections.price ? 180 : 0 }}>
            <ChevronDown className="w-5 h-5 text-gray-500" />
          </motion.div>
        </motion.button>
        <AnimatePresence>
          {expandedSections.price && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-3 space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block mb-1 text-sm text-gray-600">Min Price</label>
                    <input
                      type="number"
                      placeholder="₹0"
                      value={filters.minPrice || ""}
                      onChange={(e) => handlePriceChange("minPrice", e.target.value)}
                      className="w-full px-3 py-2 text-sm transition-colors border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-ksauni-red focus:border-ksauni-red"
                    />
                  </div>
                  <div>
                    <label className="block mb-1 text-sm text-gray-600">Max Price</label>
                    <input
                      type="number"
                      placeholder="₹∞"
                      value={filters.maxPrice || ""}
                      onChange={(e) => handlePriceChange("maxPrice", e.target.value)}
                      className="w-full px-3 py-2 text-sm transition-colors border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-ksauni-red focus:border-ksauni-red"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  {priceRanges.map((range, index) => (
                    <motion.label
                      key={index}
                      whileHover={{ scale: 1.01 }}
                      className="flex items-center text-gray-700 transition-colors cursor-pointer hover:text-ksauni-red"
                    >
                      <input
                        type="radio"
                        name="priceRange"
                        checked={filters.minPrice === range.min && filters.maxPrice === range.max}
                        onChange={() => onFilterChange({ minPrice: range.min, maxPrice: range.max })}
                        className="w-4 h-4 border-gray-300 rounded text-ksauni-red focus:ring-ksauni-red"
                      />
                      <span className="ml-2">{range.label}</span>
                    </motion.label>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <div>
        <motion.button
          whileHover={{ scale: 1.01 }}
          onClick={() => toggleSection("rating")}
          className="flex items-center justify-between w-full py-2 text-left"
        >
          {/* <h3 className="flex items-center text-lg font-semibold text-gray-800">
            <Star className="w-5 h-5 mr-2 text-ksauni-red" />
            Customer Rating
          </h3> */}
          {/* <motion.div animate={{ rotate: expandedSections.rating ? 180 : 0 }}>
            <ChevronDown className="w-5 h-5 text-gray-500" />
          </motion.div> */}
        </motion.button>
        {/* <AnimatePresence>
          {expandedSections.rating && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-3 space-y-2">
                {ratings.map((rating) => (
                  <motion.label
                    key={rating}
                    whileHover={{ scale: 1.01 }}
                    className="flex items-center text-gray-700 transition-colors cursor-pointer hover:text-ksauni-red"
                  >
                    <input
                      type="checkbox"
                      checked={selectedRatings.includes(rating)}
                      onChange={() => handleRatingChange(rating)}
                      className="w-4 h-4 border-gray-300 rounded text-ksauni-red focus:ring-ksauni-red"
                    />
                    <div className="flex items-center ml-2">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${i < rating ? "text-yellow-400 fill-current" : "text-gray-300"}`}
                        />
                      ))}
                      <span className="ml-2 text-gray-700">& Up</span>
                      {selectedRatings.includes(rating) && (
                        <span className="ml-2 text-xs text-gray-500">(selected)</span>
                      )}
                    </div>
                  </motion.label>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence> */}
      </div>
    </motion.div>
  );
});
ProductFilters.displayName = "ProductFilters";
export default ProductFilters;