"use client";
import { useState, useEffect, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ChevronDown, X, Tag, DollarSign, Star, Filter, 
  Sliders, ShoppingBag, Zap, TrendingUp, Award, 
  Sparkles, Palette, Layers, Clock 
} from "lucide-react";

const ProductFilters = memo(({ filters, categories, onFilterChange, onClearFilters, onClose }) => {
  const [expandedSections, setExpandedSections] = useState({
    categories: true,
    price: true,
    rating: true,
  });
  const [selectedRatings, setSelectedRatings] = useState([]);
  const [priceRangeValue, setPriceRangeValue] = useState({ min: filters.minPrice || 0, max: filters.maxPrice || 10000 });

  useEffect(() => {
    if (filters.minRating) {
      const rating = Number.parseFloat(filters.minRating);
      const ratingsToSelect = [4, 3, 2, 1].filter((r) => r >= rating);
      setSelectedRatings(ratingsToSelect);
    } else {
      setSelectedRatings([]);
    }
  }, [filters.minRating]);

  useEffect(() => {
    setPriceRangeValue({
      min: filters.minPrice || 0,
      max: filters.maxPrice || 10000
    });
  }, [filters.minPrice, filters.maxPrice]);

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const handlePriceRangeChange = (type, value) => {
    const numValue = value === "" ? "" : Number(value);
    const newRange = { ...priceRangeValue, [type]: numValue };
    setPriceRangeValue(newRange);
    onFilterChange({
      ...filters,
      minPrice: newRange.min === 0 ? "" : newRange.min,
      maxPrice: newRange.max === 10000 ? "" : newRange.max,
    });
  };

  const handleRatingChange = (rating) => {
    const newRatings = selectedRatings.includes(rating)
      ? selectedRatings.filter((r) => r !== rating)
      : [...selectedRatings, rating];
    const minRating = newRatings.length > 0 ? Math.max(...newRatings) : null;
    setSelectedRatings(newRatings);
    onFilterChange({
      ...filters,
      minRating: minRating ? minRating.toString() : "",
    });
  };

  const clearAllFilters = () => {
    setSelectedRatings([]);
    setPriceRangeValue({ min: 0, max: 10000 });
    if (onClearFilters) onClearFilters();
  };

  const activeFiltersCount = [
    filters.category ? 1 : 0,
    filters.minPrice || filters.maxPrice ? 1 : 0,
    filters.minRating ? 1 : 0
  ].reduce((a, b) => a + b, 0);

  const getCategoryIcon = (categoryName) => {
    const name = categoryName.toLowerCase();
    if (name.includes("men") || name.includes("male")) return <Zap className="w-3.5 h-3.5" />;
    if (name.includes("women") || name.includes("female")) return <Sparkles className="w-3.5 h-3.5" />;
    if (name.includes("kid") || name.includes("child")) return <Palette className="w-3.5 h-3.5" />;
    if (name.includes("access")) return <Layers className="w-3.5 h-3.5" />;
    return <Tag className="w-3.5 h-3.5" />;
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="relative bg-gradient-to-br from-white via-white to-gray-50 rounded-[12px] shadow-xl border border-gray-100 overflow-hidden"
    >
      {/* Header – compact */}
      <div className="relative px-4 pt-4 pb-3 bg-gradient-to-r from-red-600 to-red-500">
        <div className="absolute top-0 right-0 w-24 h-20 bg-white/10 rounded-full -mr-12 -mt-12" />
        <div className="absolute bottom-0 left-0 w-20 h-12 bg-white/5 rounded-full -ml-10 -mb-10" />
        
        <div className="relative flex items-center justify-between rounded-md">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-white/20 rounded-md backdrop-blur-sm">
              <Sliders className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Filters</h2>
              {activeFiltersCount > 0 && (
                <p className="text-[11px] text-white/80 mt-0">{activeFiltersCount} active</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {activeFiltersCount > 0 && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={clearAllFilters}
                className="px-2 py-1 text-[11px] font-medium text-white bg-white/20 rounded-md hover:bg-white/30 transition"
              >
                Clear all
              </motion.button>
            )}
            {onClose && (
              <motion.button
                whileHover={{ scale: 1.05, rotate: 90 }}
                whileTap={{ scale: 0.95 }}
                onClick={onClose}
                className="p-1 text-white/80 hover:text-white rounded-full hover:bg-white/20 transition"
              >
                <X className="w-4 h-4" />
              </motion.button>
            )}
          </div>
        </div>
      </div>

      {/* Filter sections – reduced padding */}
      <div className="p-3 space-y-3 max-h-[calc(100vh-180px)] overflow-y-auto custom-scrollbar">
        {/* Categories Section */}
        <div className="bg-white rounded-lg border border-gray-100 shadow-sm overflow-hidden">
          <motion.button
            whileHover={{ backgroundColor: "#F9FAFB" }}
            onClick={() => toggleSection("categories")}
            className="flex items-center justify-between w-full px-3 py-2 text-left transition-colors"
          >
            <div className="flex items-center gap-1.5">
              <div className="p-1 bg-red-50 rounded-md">
                <ShoppingBag className="w-3.5 h-3.5 text-red-600" />
              </div>
              <h3 className="text-sm font-semibold text-gray-800">Categories</h3>
            </div>
            <motion.div
              animate={{ rotate: expandedSections.categories ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
            </motion.div>
          </motion.button>
          
          <AnimatePresence>
            {expandedSections.categories && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="px-3 pb-3 space-y-1">
                  <label className="flex items-center justify-between p-1.5 rounded-md cursor-pointer hover:bg-gray-50 transition group">
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="category"
                        checked={!filters.category}
                        onChange={() => onFilterChange({ category: "" })}
                        className="w-3.5 h-3.5 text-red-600 border-gray-300"
                      />
                      <span className="text-xs text-gray-700 group-hover:text-red-600 transition">All Categories</span>
                    </div>
                    <span className="text-[11px] text-gray-400">All</span>
                  </label>
                  
                  {categories
                    .filter(cat => {
                      const excludedSlugs = ["anime-t-shirt", "ksauni-tshirts-styles"];
                      return !excludedSlugs.includes(cat.slug);
                    })
                    .map((category) => (
                      <label
                        key={category._id}
                        className="flex items-center justify-between p-1.5 rounded-md cursor-pointer hover:bg-gray-50 transition group"
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="category"
                            checked={filters.category === category.slug}
                            onChange={() => onFilterChange({ category: category.slug })}
                            className="w-3.5 h-3.5 text-red-600 border-gray-300"
                          />
                          <span className="flex items-center gap-1 text-xs text-gray-700 group-hover:text-red-600 transition">
                            {getCategoryIcon(category.name)}
                            {category.name}
                          </span>
                        </div>
                        <span className="text-[10px] font-medium text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">
                          {category.productCount || 0}
                        </span>
                      </label>
                    ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Price Range Section */}
        <div className="bg-white rounded-lg border border-gray-100 shadow-sm overflow-hidden">
          <motion.button
            whileHover={{ backgroundColor: "#F9FAFB" }}
            onClick={() => toggleSection("price")}
            className="flex items-center justify-between w-full px-3 py-2 text-left transition-colors"
          >
            <div className="flex items-center gap-1.5">
              <div className="p-1 bg-green-50 rounded-md">
                <DollarSign className="w-3.5 h-3.5 text-green-600" />
              </div>
              <h3 className="text-sm font-semibold text-gray-800">Price Range</h3>
            </div>
            <motion.div
              animate={{ rotate: expandedSections.price ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
            </motion.div>
          </motion.button>
          
          <AnimatePresence>
            {expandedSections.price && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="px-3 pb-3 space-y-3">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <label className="block text-[10px] text-gray-500 mb-0.5">Min (₹)</label>
                        <input
                          type="number"
                          value={priceRangeValue.min === 0 ? "" : priceRangeValue.min}
                          onChange={(e) => handlePriceRangeChange("min", e.target.value)}
                          placeholder="0"
                          className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition"
                        />
                      </div>
                      <span className="text-gray-400 mt-4">—</span>
                      <div className="flex-1">
                        <label className="block text-[10px] text-gray-500 mb-0.5">Max (₹)</label>
                        <input
                          type="number"
                          value={priceRangeValue.max === 10000 ? "" : priceRangeValue.max}
                          onChange={(e) => handlePriceRangeChange("max", e.target.value)}
                          placeholder="10000+"
                          className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition"
                        />
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {[
                        { label: "Under ₹500", min: "", max: "500" },
                        { label: "₹500-1000", min: "500", max: "1000" },
                        { label: "₹1000-2000", min: "1000", max: "2000" },
                        { label: "₹2000-5000", min: "2000", max: "5000" },
                        { label: "Above ₹5000", min: "5000", max: "" },
                      ].map((range, idx) => {
                        const isActive = filters.minPrice === range.min && filters.maxPrice === range.max;
                        return (
                          <motion.button
                            key={idx}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => {
                              setPriceRangeValue({
                                min: range.min === "" ? 0 : Number(range.min),
                                max: range.max === "" ? 10000 : Number(range.max)
                              });
                              onFilterChange({ minPrice: range.min, maxPrice: range.max });
                            }}
                            className={`px-2 py-1 text-[11px] font-medium rounded-full transition ${
                              isActive
                                ? "bg-red-600 text-white shadow-sm"
                                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                            }`}
                          >
                            {range.label}
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Rating Section */}
        <div className="bg-white rounded-lg border border-gray-100 shadow-sm overflow-hidden">
          <motion.button
            whileHover={{ backgroundColor: "#F9FAFB" }}
            onClick={() => toggleSection("rating")}
            className="flex items-center justify-between w-full px-3 py-2 text-left transition-colors"
          >
            <div className="flex items-center gap-1.5">
              <div className="p-1 bg-yellow-50 rounded-md">
                <Star className="w-3.5 h-3.5 text-yellow-600" />
              </div>
              <h3 className="text-sm font-semibold text-gray-800">Customer Rating</h3>
            </div>
            <motion.div
              animate={{ rotate: expandedSections.rating ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
            </motion.div>
          </motion.button>
          
          <AnimatePresence>
            {expandedSections.rating && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="px-3 pb-3 space-y-1.5">
                  {[4, 3, 2, 1].map((rating) => {
                    const isSelected = selectedRatings.includes(rating);
                    return (
                      <label
                        key={rating}
                        className={`flex items-center justify-between p-1.5 rounded-md cursor-pointer transition ${
                          isSelected ? "bg-yellow-50 border border-yellow-200" : "hover:bg-gray-50"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleRatingChange(rating)}
                            className="w-3.5 h-3.5 text-yellow-600 border-gray-300 rounded focus:ring-yellow-500 focus:ring-2"
                          />
                          <div className="flex items-center gap-0.5">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-3 h-3 ${i < rating ? "text-yellow-400 fill-current" : "text-gray-300"}`}
                              />
                            ))}
                            <span className="text-xs text-gray-700 ml-1">& Up</span>
                          </div>
                        </div>
                        {isSelected && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="w-1.5 h-1.5 rounded-full bg-yellow-500"
                          />
                        )}
                      </label>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Active filters summary */}
        {activeFiltersCount > 0 && (
          <div className="pt-1">
            <div className="flex flex-wrap gap-1.5">
              {filters.category && (
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[11px] bg-red-50 text-red-700 rounded-full">
                  <Tag className="w-2.5 h-2.5" />
                  {categories.find(c => c.slug === filters.category)?.name || filters.category}
                  <button
                    onClick={() => onFilterChange({ category: "" })}
                    className="ml-0.5 hover:text-red-900"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </span>
              )}
              {(filters.minPrice || filters.maxPrice) && (
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[11px] bg-green-50 text-green-700 rounded-full">
                  <DollarSign className="w-2.5 h-2.5" />
                  ₹{filters.minPrice || "0"} - ₹{filters.maxPrice || "∞"}
                  <button
                    onClick={() => {
                      setPriceRangeValue({ min: 0, max: 10000 });
                      onFilterChange({ minPrice: "", maxPrice: "" });
                    }}
                    className="ml-0.5 hover:text-green-900"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </span>
              )}
              {filters.minRating && (
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[11px] bg-yellow-50 text-yellow-700 rounded-full">
                  <Star className="w-2.5 h-2.5 fill-current" />
                  {filters.minRating}+ Stars
                  <button
                    onClick={() => {
                      setSelectedRatings([]);
                      onFilterChange({ minRating: "" });
                    }}
                    className="ml-0.5 hover:text-yellow-900"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Apply button – smaller */}
      <div className="sticky bottom-0 p-3 bg-white/80 backdrop-blur-sm border-t border-gray-100">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onClose}
          className="w-full py-2 bg-gradient-to-r from-red-600 to-red-500 text-white font-semibold text-sm rounded-lg shadow-md hover:shadow-lg transition-all"
        >
          Apply Filters
        </motion.button>
      </div>
    </motion.div>
  );
});

ProductFilters.displayName = "ProductFilters";
export default ProductFilters;