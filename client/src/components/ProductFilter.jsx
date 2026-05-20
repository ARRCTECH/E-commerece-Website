"use client";
import { useState, useEffect, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ChevronDown, X, Tag, DollarSign, Star, Filter, 
  Sliders, ShoppingBag, Zap, TrendingUp, Award, 
  Sparkles, Palette, Layers, Clock, Gem, Shield
} from "lucide-react";

const ProductFilters = memo(({ filters, categories, onFilterChange, onClearFilters, onClose }) => {
  const [expandedSections, setExpandedSections] = useState({
    categories: true,
    price: true,
    rating: true,
  });
  const [selectedRatings, setSelectedRatings] = useState([]);
  const [priceRangeValue, setPriceRangeValue] = useState({ min: filters.minPrice || 0, max: filters.maxPrice || 10000 });

  // ✅ Initialize selected ratings from filters
  useEffect(() => {
    if (filters.minRating && filters.minRating !== "") {
      const rating = Number.parseFloat(filters.minRating);
      // Select all ratings >= the min rating
      const ratingsToSelect = [];
      if (rating <= 4) ratingsToSelect.push(4);
      if (rating <= 3) ratingsToSelect.push(3);
      if (rating <= 2) ratingsToSelect.push(2);
      if (rating <= 1) ratingsToSelect.push(1);
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

  // ✅ UNCOMMENTED AND FIXED: Rating change handler
  const handleRatingChange = (rating) => {
    let newRatings;
    const currentMinRating = filters.minRating ? parseFloat(filters.minRating) : null;
    
    // If the clicked rating is already the active one, clear it
    if (currentMinRating === rating) {
      newRatings = [];
      setSelectedRatings(newRatings);
      onFilterChange({
        ...filters,
        minRating: "",
      });
      return;
    }
    
    // Otherwise, set the new rating
    newRatings = [];
    for (let i = rating; i <= 4; i++) {
      newRatings.push(i);
    }
    
    setSelectedRatings(newRatings);
    
    // Send the minRating to parent
    onFilterChange({
      ...filters,
      minRating: rating.toString(),
    });
  };

  const clearAllFilters = () => {
    setSelectedRatings([]);
    setPriceRangeValue({ min: 0, max: 10000 });
    if (onClearFilters) onClearFilters();
  };

  // ✅ Fixed active filters count
  const activeFiltersCount = () => {
    let count = 0;
    
    if (filters.category && filters.category !== "" && filters.category !== null && filters.category !== undefined) {
      count++;
    }
    
    if ((filters.minPrice && filters.minPrice !== "") || (filters.maxPrice && filters.maxPrice !== "")) {
      count++;
    }
    
    if (filters.minRating && filters.minRating !== "" && filters.minRating !== null && filters.minRating !== undefined) {
      count++;
    }
    
    if (filters.search && filters.search !== "") {
      count++;
    }
    
    if (filters.sizes && filters.sizes.length > 0) {
      count++;
    }
    
    if (filters.colors && filters.colors.length > 0) {
      count++;
    }
    
    if (filters.gender && filters.gender !== "") {
      count++;
    }
    
    if (filters.brands && filters.brands.length > 0) {
      count++;
    }
    
    return count;
  };

  const getActiveCount = activeFiltersCount();

  const getCategoryIcon = (categoryName) => {
    const name = categoryName.toLowerCase();
    if (name.includes("men") || name.includes("male")) return <Zap className="w-3.5 h-3.5" />;
    if (name.includes("women") || name.includes("female")) return <Sparkles className="w-3.5 h-3.5" />;
    if (name.includes("kid") || name.includes("child")) return <Palette className="w-3.5 h-3.5" />;
    if (name.includes("access")) return <Layers className="w-3.5 h-3.5" />;
    return <Tag className="w-3.5 h-3.5" />;
  };

  // ✅ Helper to check if rating is selected
  const isRatingSelected = (rating) => {
    if (!filters.minRating || filters.minRating === "") return false;
    const minRating = parseFloat(filters.minRating);
    return rating === minRating;
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="relative bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden"
    >
      {/* Premium Header */}
      <div className="px-5 pt-2 pb-4 mb-10 bg-gradient-to-r from-gray-900 to-gray-800">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full -ml-12 -mb-12 blur-2xl" />
        
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-xl">
              <Sliders className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">Filters</h2>
              {getActiveCount > 0 && (
                <p className="text-[11px] text-white/60 mt-0.5">{getActiveCount} active filter{getActiveCount > 1 ? 's' : ''}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {getActiveCount > 0 && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={clearAllFilters}
                className="px-3 py-1.5 text-[11px] font-medium text-white bg-white/10 rounded-full hover:bg-white/20 transition"
              >
                Clear all
              </motion.button>
            )}
            {onClose && (
              <motion.button
                whileHover={{ scale: 1.05, rotate: 90 }}
                whileTap={{ scale: 0.95 }}
                onClick={onClose}
                className="p-1.5 text-white/60 hover:text-white rounded-full hover:bg-white/10 transition"
              >
                <X className="w-4 h-4" />
              </motion.button>
            )}
          </div>
        </div>
      </div>

      {/* Filter sections */}
      <div className="p-4 space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto custom-scrollbar">
        
        {/* Categories Section */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <motion.button
            whileHover={{ backgroundColor: "#F9FAFB" }}
            onClick={() => toggleSection("categories")}
            className="flex items-center justify-between w-full px-4 py-3 text-left transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-red-50 rounded-lg">
                <ShoppingBag className="w-3.5 h-3.5 text-red-600" />
              </div>
              <h3 className="text-sm font-semibold text-gray-800">Categories</h3>
            </div>
            <motion.div
              animate={{ rotate: expandedSections.categories ? 180 : 0 }}
              transition={{ duration: 0.3 }}
              className="p-1 rounded-full bg-gray-100"
            >
              <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
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
                <div className="px-4 pb-4 space-y-1.5">
                  <label className="flex items-center justify-between p-2 rounded-lg cursor-pointer hover:bg-gray-50 transition group">
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="category"
                        checked={!filters.category || filters.category === ""}
                        onChange={() => onFilterChange({ category: "" })}
                        className="w-4 h-4 text-red-600 border-gray-300 focus:ring-red-500"
                      />
                      <span className="text-sm text-gray-700 group-hover:text-red-600 transition">All Categories</span>
                    </div>
                    <span className="text-[11px] text-gray-400 bg-gray-100 px-2 py-1 rounded-full">All</span>
                  </label>
                  
                  {categories
                    .filter(cat => {
                      const excludedSlugs = ["anime-t-shirt", "ksauni-tshirts-styles"];
                      return !excludedSlugs.includes(cat.slug);
                    })
                    .map((category) => (
                      <label
                        key={category._id}
                        className="flex items-center justify-between p-2 rounded-lg cursor-pointer hover:bg-gray-50 transition group"
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="category"
                            checked={filters.category === category.slug}
                            onChange={() => onFilterChange({ category: category.slug })}
                            className="w-4 h-4 text-red-600 border-gray-300 focus:ring-red-500"
                          />
                          <span className="flex items-center gap-2 text-sm text-gray-700 group-hover:text-red-600 transition">
                            {getCategoryIcon(category.name)}
                            {category.name}
                          </span>
                        </div>
                        <span className="text-[11px] font-medium text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
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
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <motion.button
            whileHover={{ backgroundColor: "#F9FAFB" }}
            onClick={() => toggleSection("price")}
            className="flex items-center justify-between w-full px-4 py-3 text-left transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-green-50 rounded-lg">
                <DollarSign className="w-3.5 h-3.5 text-green-600" />
              </div>
              <h3 className="text-sm font-semibold text-gray-800">Price Range</h3>
            </div>
            <motion.div
              animate={{ rotate: expandedSections.price ? 180 : 0 }}
              transition={{ duration: 0.3 }}
              className="p-1 rounded-full bg-gray-100"
            >
              <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
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
                <div className="px-4 pb-4 space-y-3">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <label className="block text-[10px] text-gray-500 mb-1">Min (₹)</label>
                        <input
                          type="number"
                          value={priceRangeValue.min === 0 ? "" : priceRangeValue.min}
                          onChange={(e) => handlePriceRangeChange("min", e.target.value)}
                          placeholder="0"
                          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition"
                        />
                      </div>
                      <span className="text-gray-400 mt-5">—</span>
                      <div className="flex-1">
                        <label className="block text-[10px] text-gray-500 mb-1">Max (₹)</label>
                        <input
                          type="number"
                          value={priceRangeValue.max === 10000 ? "" : priceRangeValue.max}
                          onChange={(e) => handlePriceRangeChange("max", e.target.value)}
                          placeholder="10000+"
                          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition"
                        />
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 pt-2">
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
                            className={`px-3 py-1.5 text-[11px] font-medium rounded-full transition ${
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

        

        {/* Active filters summary */}
        {getActiveCount > 0 && (
          <div className="pt-2">
            <div className="flex flex-wrap gap-2">
              {filters.category && filters.category !== "" && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] bg-red-50 text-red-700 rounded-full border border-red-200">
                  <Tag className="w-3 h-3" />
                  {categories.find(c => c.slug === filters.category)?.name || filters.category}
                  <button onClick={() => onFilterChange({ category: "" })} className="ml-0.5 hover:text-red-900">
                    <X className="w-2.5 h-2.5" />
                  </button>
                </span>
              )}
              {((filters.minPrice && filters.minPrice !== "") || (filters.maxPrice && filters.maxPrice !== "")) && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] bg-green-50 text-green-700 rounded-full border border-green-200">
                  <DollarSign className="w-3 h-3" />
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
              {filters.minRating && filters.minRating !== "" && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] bg-yellow-50 text-yellow-700 rounded-full border border-yellow-200">
                  <Star className="w-3 h-3 fill-current" />
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

      {/* Apply button */}
      <div className="sticky bottom-0 p-4 bg-white/95 backdrop-blur-sm border-t border-gray-100">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onClose}
          className="w-full py-2.5 bg-gradient-to-r from-gray-900 to-gray-800 text-white font-semibold text-sm rounded-xl shadow-md hover:shadow-lg transition-all"
        >
          Apply Filters
        </motion.button>
      </div>
    </motion.div>
  );
});

ProductFilters.displayName = "ProductFilters";
export default ProductFilters;