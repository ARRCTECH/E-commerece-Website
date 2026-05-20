"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import {
  Menu, X, ChevronDown, Search, ShoppingBag, User, Heart, Mic,
  Clock, Trash2, Shirt, LogOut, UserCircle, Tag, TrendingUp, Home, Gift
} from "lucide-react";
import { useDebounce } from "use-debounce";
import { logout } from "../store/slices/authSlice";
import { fetchCategories } from "../store/slices/categorySlice";
import { fetchCart, selectCartTotalQuantity, clearCart } from "../store/slices/cartSlice";
import { fetchWishlist, selectWishlistCount } from "../store/slices/wishlistSlice";
import {
  getSearchSuggestions,
  addRecentSearch,
  removeRecentSearch,
  clearRecentSearches,
} from "../store/slices/searchSlice";
import toast from "react-hot-toast";
const Navbar = () => {

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const searchRef = useRef(null);
  const userMenuRef = useRef(null);
  const abortControllerRef = useRef(null);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();
  const { user, token } = useSelector((state) => state.auth || {});
  const { categories = [] } = useSelector((state) => state.categories || {});
  const { suggestions = [], recentSearches = [], suggestionsLoading = false } = useSelector((state) => state.search || {});
  const cartTotalQuantity = useSelector(selectCartTotalQuantity);
  const wishlistCount = useSelector(selectWishlistCount);
  const [debouncedSearchQuery] = useDebounce(searchQuery, 300);
  const [showMobileSearch, setShowMobileSearch] = useState(true);

  const placeholders = [
    "Search for Oversize T-shirt",
    "Search for Hoodie",
    "Search for Plain",
    "Search for Acid Wash",
    "Search for Regular",
  ];
  const [placeholderIndex, setPlaceholderIndex] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 30;

      setScrolled(isScrolled);

      if (isScrolled) {
        setShowMobileSearch(false);
      } else {
        setShowMobileSearch(true);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % placeholders.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);
  useEffect(() => {
    if (token && user) {
      dispatch(fetchCart());
      dispatch(fetchWishlist());
    }
  }, [user, token, dispatch]);
  useEffect(() => {
    dispatch(fetchCategories({ showOnHomepage: false }));
  }, [dispatch]);
  useEffect(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    if (debouncedSearchQuery.trim() && searchFocused) {
      abortControllerRef.current = new AbortController();
      dispatch(getSearchSuggestions({
        query: debouncedSearchQuery.trim(),
        signal: abortControllerRef.current.signal
      })).catch((error) => {
        if (error.name !== 'AbortError') {
          console.error("Search suggestions error:", error);
        }
      });
    }
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [debouncedSearchQuery, searchFocused, dispatch]);
  useEffect(() => {
    const handleClickOutsideSearch = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearchDropdown(false);
        setSearchFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutsideSearch);
    return () => document.removeEventListener("mousedown", handleClickOutsideSearch);
  }, []);
  useEffect(() => {
    const handleClickOutsideUserMenu = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutsideUserMenu);
    return () => document.removeEventListener("mousedown", handleClickOutsideUserMenu);
  }, []);

  const navigateToCategory = useCallback((categorySlug = "") => {
    const base = "/products?";
    navigate(categorySlug ? `${base}category=${categorySlug}` : base);
  }, [navigate]);
  const handleSearch = useCallback((e, query = searchQuery) => {
    e?.preventDefault();
    const searchTerm = query.trim();
    if (searchTerm) {
      dispatch(addRecentSearch(searchTerm));
      navigate(`/products?search=${encodeURIComponent(searchTerm)}`);
      setShowSearchDropdown(false);
      setSearchQuery("");
      setSearchFocused(false);
    }
  }, [searchQuery, dispatch, navigate]);
  const handleSuggestionClick = useCallback((suggestion) => {
    setSearchQuery(suggestion);
    handleSearch(null, suggestion);
  }, [handleSearch]);

  const handleRecentSearchClick = useCallback((recentSearch) => {
    setSearchQuery(recentSearch);
    handleSearch(null, recentSearch);
  }, [handleSearch]);

  const handleLogout = useCallback(() => {
    // Clear local cart state immediately (synchronous)
    dispatch(clearCart()); // assumes clearCart is a synchronous action
    dispatch(logout());
    setShowUserMenu(false);
    navigate("/");
    toast.success("Logged out successfully");
  }, [dispatch, navigate]);

  const handleClearCart = useCallback(async () => {
    try {
      await dispatch(clearCart()).unwrap();
      toast.success("Cart cleared successfully");
    } catch (error) {
      toast.error(error?.message || "Failed to clear cart");
    }
  }, [dispatch]);

  // Mobile categories logic (safe with fallback)
  const desiredMobileCategoryNames = ["Oversized", "New Arrival", "Minimalist", "Regular"];
  const categoriesForMobileScroll = [];
  
  desiredMobileCategoryNames.forEach((name) => {
    const foundCat = categories.find((cat) => cat.name === name);
    if (foundCat && !["anime-t-shirt", "ksauni-tshirts-styles"].includes(foundCat.slug)) {
      categoriesForMobileScroll.push(foundCat);
    }
  });
  
  if (categoriesForMobileScroll.length < 5 && categories.length > 0) {
    const existingNames = new Set(categoriesForMobileScroll.map((cat) => cat.name));
    for (const cat of categories) {
      if (!existingNames.has(cat.name) && categoriesForMobileScroll.length < 5) {
        if (!["anime-t-shirt", "ksauni-tshirts-styles"].includes(cat.slug)) {
          categoriesForMobileScroll.push(cat);
          existingNames.add(cat.name);
        }
      }
    }
  }

  const isProductDetailPage = location.pathname.startsWith("/product/");
  const isCartPage = location.pathname === "/cart";

  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-50">

        {/* ROW 1: White Navbar with Logo, Search, Icons */}
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4 }}
          className={`transition-all duration-300 ${scrolled
            ? "bg-white/95 backdrop-blur-xl border-b border-red-500/30 shadow-2xl shadow-red-500/10"
            : "bg-white border-b border-gray-200"
            }`}
        >
          <div className="max-w-7xl mx-auto px-4 lg:px-6">

            {/* Main Row: Logo (Left) + Empty Space (Center) + Search + Icons (Right) */}
            <div className="flex items-center justify-between py-3 gap-4">

              {/* LEFT - Logo */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="p-2 -ml-2 rounded-full text-gray-600 hover:text-red-500 hover:bg-red-50 transition md:hidden"
                  aria-label="Menu"
                >
                  {isMenuOpen ? <X size={22} /> : <Menu size={22} />}
                </button>
                <div onClick={() => navigate("/")} className="flex items-center cursor-pointer group">
                  <img src="/navbar_logo.png" alt="Factory Sale Logo" className="h-10 w-auto object-contain" />
                </div>
              </div>

              <div className="flex-1 hidden md:block"></div>

              {/* Desktop Icons */}
              <div className="flex items-center gap-2 md:gap-4">
                {/* Desktop Search */}

                {/* Search Bar Desktop */}
                <div className="relative hidden md:block" ref={searchRef}>
                  <form onSubmit={handleSearch} className="relative">
                    <Search size={18} className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${searchFocused ? 'text-red-500' : 'text-gray-400'}`} />
                    <input
                      type="text"
                      placeholder={placeholders[placeholderIndex]}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onFocus={() => {
                        setSearchFocused(true);
                        setShowSearchDropdown(true);
                      }}
                      className="w-72 lg:w-96 py-2 pl-11 pr-11 text-sm text-gray-700 placeholder-gray-600 bg-gray-50 border border-gray-700 rounded-full outline-none focus:border-red-400 focus:ring-2 focus:ring-red-500/20 transition-all"
                      aria-label="Search"
                    />
                    <Mic size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 cursor-pointer hover:text-red-500 transition" />
                  </form>

                  <AnimatePresence>
                    {showSearchDropdown && searchFocused && (
                      <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -5, scale: 0.95 }}
                        className="absolute right-0 z-50 mt-2 w-96 bg-white border border-gray-200 rounded-2xl shadow-2xl max-h-96 overflow-y-auto"
                      >
                        {recentSearches.length > 0 && !searchQuery && (
                          <div className="p-4 border-b border-gray-100">
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-xs font-semibold text-gray-500 flex items-center gap-1.5">
                                <Clock size={14} className="text-red-500" /> Recent Searches
                              </span>
                              <button onClick={() => dispatch(clearRecentSearches())} className="text-xs text-gray-400 hover:text-red-500 transition">
                                Clear All
                              </button>
                            </div>
                            {recentSearches.map((search, idx) => (
                              <div key={idx} onClick={() => handleRecentSearchClick(search)} className="flex items-center justify-between p-2 rounded-xl cursor-pointer hover:bg-gray-50 group">
                                <div className="flex items-center gap-2">
                                  <Clock size={14} className="text-gray-400" />
                                  <span className="text-sm text-gray-700">{search}</span>
                                </div>
                                <Trash2 size={14} onClick={(e) => { e.stopPropagation(); dispatch(removeRecentSearch(search)); }} className="text-gray-400 opacity-0 group-hover:opacity-100 hover:text-red-500 transition" />
                              </div>
                            ))}
                          </div>
                        )}
                        {searchQuery && (
                          <div className="p-4">
                            {suggestionsLoading ? (
                              <div className="flex justify-center py-6">
                                <div className="w-5 h-5 border-2 border-gray-200 border-t-red-500 rounded-full animate-spin" />
                              </div>
                            ) : suggestions.length > 0 ? (
                              <div>
                                <span className="text-xs font-semibold text-gray-500 flex items-center gap-1.5 mb-3">
                                  <Tag size={14} className="text-red-500" /> Suggestions
                                </span>
                                {suggestions.map((s, i) => (
                                  <div key={i} onClick={() => handleSuggestionClick(s)} className="flex items-center gap-2 p-2 rounded-xl cursor-pointer hover:bg-gray-50">
                                    <Search size={14} className="text-gray-400" />
                                    <span className="text-sm text-gray-700">{s}</span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="py-8 text-sm text-center text-gray-400">No suggestions found</div>
                            )}
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Mobile Search Icon - visible only after scroll */}
                {scrolled && !showMobileSearch && (
                  <div
                    onClick={() => setShowMobileSearch(true)}
                    className="relative p-2 rounded-full text-gray-600 cursor-pointer hover:text-red-500 hover:bg-red-50 transition md:hidden"
                  >
                    <Search size={22} />
                  </div>
                )}

                {/* Wishlist */}
                <div onClick={() => navigate("/wishlist")} className="relative p-2 rounded-full text-gray-600 cursor-pointer hover:text-red-500 hover:bg-red-50 transition group">
                  <Heart size={22} />
                  {wishlistCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 text-[10px] font-bold text-white bg-gradient-to-r from-red-500 to-red-600 rounded-full shadow-md">
                      {wishlistCount}
                    </span>
                  )}
                </div>

                {/* Cart */}
                <div onClick={() => navigate("/cart")} className="relative p-2 rounded-full text-gray-600 cursor-pointer hover:text-red-500 hover:bg-red-50 transition group">
                  <ShoppingBag size={22} />
                  {cartTotalQuantity > 0 && (
                    <span className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 text-[10px] font-bold text-white bg-gradient-to-r from-red-500 to-red-600 rounded-full shadow-md">
                      {cartTotalQuantity}
                    </span>
                  )}
                </div>

                {/* User Menu */}
                <div className="relative hidden md:block" ref={userMenuRef}>
                  <button
                    onClick={() => {
                      if (!token) navigate("/login");
                      else setShowUserMenu(!showUserMenu);
                    }}
                    className="flex items-center gap-2 px-3 py-2 rounded-full text-gray-600 hover:text-red-500 hover:bg-red-50 transition group"
                    aria-label="User menu"
                  >
                    <div className="relative">
                      <UserCircle size={22} />
                      {token && (
                        <span className="absolute -bottom-1 -right-1 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white" />
                      )}
                    </div>
                    <span className="text-sm font-medium hidden lg:inline">
                      {token ? user?.name?.split(" ")[0] || "Hi" : "Login"}
                    </span>
                    <ChevronDown size={16} className={`transition-transform duration-200 ${showUserMenu ? 'rotate-180 text-red-500' : ''}`} />
                  </button>

                  <AnimatePresence>
                    {showUserMenu && token && (
                      <motion.div
                        initial={{ opacity: 0, y: -15, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="absolute right-0 z-50 w-80 mt-3 overflow-hidden"
                      >
                        <div className="relative bg-white rounded-2xl shadow-2xl">
                          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-red-500 via-orange-500 to-red-500 opacity-75 blur-sm"></div>
                          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-red-500 via-orange-500 to-red-500 opacity-100"></div>
                          <div className="relative bg-white rounded-2xl m-[1px] overflow-hidden">

                    

                            {/* User Info */}
                            <div className="pt-3 px-4 pb-3 border-b border-gray-100">
                              <h3 className="text-base font-bold text-gray-800">{user?.name}</h3>
                              <p className="text-xs text-gray-500 mt-0.5">{user?.email}</p>
                            </div>

                            {/* Menu Items */}
                            <div className="p-2">
                              <button onClick={() => { navigate("/profile"); setShowUserMenu(false); }} className="flex items-center gap-3 w-full px-3 py-2.5 text-sm text-gray-700 rounded-xl hover:bg-red-50 hover:text-red-600 transition group">
                                <div className="w-8 h-8 rounded-lg bg-gray-100 group-hover:bg-red-100 flex items-center justify-center transition">
                                  <User size={16} className="text-gray-600 group-hover:text-red-500" />
                                </div>
                                <div className="flex-1 text-left">
                                  <p className="font-medium">My Profile</p>
                                  <p className="text-[10px] text-gray-400">View and edit profile</p>
                                </div>
                              </button>

                              <button onClick={() => { navigate("/orders"); setShowUserMenu(false); }} className="flex items-center gap-3 w-full px-3 py-2.5 text-sm text-gray-700 rounded-xl hover:bg-red-50 hover:text-red-600 transition group">
                                <div className="w-8 h-8 rounded-lg bg-gray-100 group-hover:bg-red-100 flex items-center justify-center transition">
                                  <ShoppingBag size={16} className="text-gray-600 group-hover:text-red-500" />
                                </div>
                                <div className="flex-1 text-left">
                                  <p className="font-medium">My Orders</p>
                                  <p className="text-[10px] text-gray-400">Track your orders</p>
                                </div>
                              </button>



                              {(user?.role === "admin" || user?.role === "digitalMarketer") && (
                                <button onClick={() => { navigate(user?.role === "admin" ? "/admin" : "/digitalMarketer"); setShowUserMenu(false); }} className="flex items-center gap-3 w-full px-3 py-2.5 text-sm text-gray-700 rounded-xl hover:bg-red-50 hover:text-red-600 transition group">
                                  <div className="w-8 h-8 rounded-lg bg-gray-100 group-hover:bg-red-100 flex items-center justify-center transition">
                                    <TrendingUp size={16} className="text-gray-600 group-hover:text-red-500" />
                                  </div>
                                  <div className="flex-1 text-left">
                                    <p className="font-medium">Dashboard</p>
                                    <p className="text-[10px] text-gray-400">Analytics & reports</p>
                                  </div>
                                </button>
                              )}
                              <button onClick={handleLogout} className="flex items-center gap-3 w-full px-3 py-2.5 text-sm text-red-600 rounded-xl hover:bg-red-50 transition group">
                                <div className="w-8 h-8 rounded-lg bg-red-50 group-hover:bg-red-100 flex items-center justify-center transition">
                                  <LogOut size={16} className="text-red-500" />
                                </div>
                                <div className="flex-1 text-left">
                                  <p className="font-medium">Logout</p>
                                  <p className="text-[10px] text-gray-400">Sign out of your account</p>
                                </div>
                              </button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>

            {/* Mobile Search Bar */}
            {/* Mobile Search Bar */}
            <AnimatePresence>
              {showMobileSearch && !isProductDetailPage && (
                <motion.div
                  initial={{ opacity: 1, height: "auto" }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="pb-3 md:hidden overflow-hidden"
                >
                  <div ref={searchRef} className="relative">
                    <form onSubmit={handleSearch}>
                      <Search
                        size={18}
                        className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${searchFocused ? "text-red-500" : "text-gray-400"
                          }`}
                      />

                      <input
                        type="text"
                        placeholder={placeholders[placeholderIndex]}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full py-3 pl-12 pr-12 text-sm text-gray-700 placeholder-gray-600 bg-gray-50 border border-gray-700 rounded-full outline-none focus:border-red-400 focus:ring-2 focus:ring-red-500/20 transition-all"
                      />

                      <Mic
                        size={18}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500"
                      />
                    </form>

                    <AnimatePresence>
                      {showSearchDropdown && searchFocused && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -5 }}
                          className="absolute left-0 right-0 z-50 mt-2 bg-white border border-gray-200 rounded-2xl shadow-xl max-h-80 overflow-y-auto"
                        >
                          {recentSearches.length > 0 && !searchQuery && (
                            <div className="p-3">
                              <div className="flex justify-between text-xs text-gray-400 mb-2 px-2">
                                <span>Recent</span>
                                <button
                                  onClick={() => dispatch(clearRecentSearches())}
                                  className="hover:text-red-500"
                                >
                                  Clear
                                </button>
                              </div>

                              {recentSearches.map((s, idx) => (
                                <div
                                  key={idx}
                                  onClick={() => handleRecentSearchClick(s)}
                                  className="flex justify-between items-center p-3 text-sm text-gray-700 border-b border-gray-50"
                                >
                                  <span>{s}</span>
                                  <Trash2
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      dispatch(removeRecentSearch(s));
                                    }}
                                    size={14}
                                    className="text-gray-400"
                                  />
                                </div>
                              ))}
                            </div>
                          )}

                          {searchQuery && (
                            <div className="p-3">
                              {suggestionsLoading ? (
                                <div className="py-4 text-center">...</div>
                              ) : (
                                suggestions.map((s, i) => (
                                  <div
                                    key={i}
                                    onClick={() => handleSuggestionClick(s)}
                                    className="p-3 text-sm text-gray-700 border-b border-gray-50"
                                  >
                                    {s}
                                  </div>
                                ))
                              )}
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Desktop Categories Bar */}
        {!isCartPage && (
          <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 border-b border-red-500/30 shadow-lg">
            <div className="max-w-7xl mx-auto px-4 lg:px-6">
              <div className="hidden md:flex items-center justify-center gap-8 py-3 overflow-x-auto">
                {categories
                  .filter(cat => !["anime-t-shirt", "ksauni-tshirts-styles"].includes(cat.slug))
                  .map((cat) => (
                    <button
                      key={cat._id}
                      onClick={() => navigateToCategory(cat.slug)}
                      className="relative text-sm font-medium text-gray-200 hover:text-red-400 transition-colors py-1.5 group whitespace-nowrap"
                    >
                      {cat.name}
                      <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-red-500 to-red-600 group-hover:w-full transition-all duration-300 rounded-full" />
                    </button>
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* Mobile Horizontal Categories - Hide on scroll */}
        <AnimatePresence>
          {!scrolled && !isProductDetailPage && !isCartPage && (
            <motion.div
              initial={{ opacity: 1, height: "auto" }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-white md:hidden overflow-hidden"
            >
              <div className="px-4">
                <div className="flex gap-5 py-3 overflow-x-auto scrollbar-hide">
                  {categoriesForMobileScroll.map((cat) => (
                    <div
                      key={cat._id}
                      onClick={() => navigateToCategory(cat.slug)}
                      className="flex flex-col items-center flex-shrink-0 cursor-pointer group"
                    >
                      <div className="w-14 h-14 rounded-full bg-gray-800 border-2 border-red-500/30 group-hover:border-red-500 overflow-hidden shadow-md transition-all">
                        <img
                          src={cat.image?.url || "/placeholder.svg"}
                          alt={cat.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <span className="text-[10px] font-medium text-gray-700 mt-1.5 group-hover:text-red-400 transition whitespace-nowrap">
                        {cat.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mobile Menu Drawer */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden overflow-hidden bg-white border-t border-gray-100 shadow-xl"
            >
              <div className="max-h-[70vh] overflow-y-auto">

                <div onClick={() => { navigate("/wishlist"); setIsMenuOpen(false); }} className="flex items-center gap-3 py-3.5 px-5 text-gray-600 border-b border-gray-50 cursor-pointer hover:text-red-500 hover:bg-red-50 transition">
                  <Heart size={18} /> Wishlist
                </div>
                <div onClick={() => { navigate("/cart"); setIsMenuOpen(false); }} className="flex items-center gap-3 py-3.5 px-5 text-gray-600 border-b border-gray-50 cursor-pointer hover:text-red-500 hover:bg-red-50 transition">
                  <ShoppingBag size={18} /> Cart
                </div>
                <div onClick={() => { if (!token) navigate("/login"); else { navigate("/profile"); setIsMenuOpen(false); } }} className="flex items-center gap-3 py-3.5 px-5 text-gray-600 border-b border-gray-50 cursor-pointer hover:text-red-500 hover:bg-red-50 transition">
                  <User size={18} /> {token ? user?.name || "Profile" : "Login"}
                </div>
                {token && (
                  <div onClick={() => { handleLogout(); setIsMenuOpen(false); }} className="flex items-center gap-3 py-3.5 px-5 text-red-500 cursor-pointer hover:bg-red-50 transition">
                    <LogOut size={18} /> Logout
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Spacer for fixed nav */}
      <div className="h-[72px] md:h-[80px] lg:h-[88px]" />

      {/* Mobile Bottom Bar */}
      {!isProductDetailPage && !isCartPage && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t border-gray-200 shadow-lg md:hidden">
          <div className="flex justify-around py-2">
            <button onClick={() => navigate("/")} className={`flex flex-col items-center py-1.5 transition ${location.pathname === "/" ? "text-red-500" : "text-gray-500"}`}>
              <Home size={22} />
              <span className="text-[10px] mt-0.5">Home</span>
            </button>
            <button onClick={() => navigate("/products")} className="flex flex-col items-center py-1.5 text-gray-500 hover:text-red-500 transition">
              <Shirt size={22} />
              <span className="text-[10px] mt-0.5">Shop</span>
            </button>
            <button onClick={() => navigate("/wishlist")} className="flex flex-col items-center py-1.5 text-gray-500 hover:text-red-500 transition">
              <Heart size={22} />
              <span className="text-[10px] mt-0.5">Wishlist</span>
            </button>
            <button onClick={() => token ? navigate("/profile") : navigate("/login")} className="flex flex-col items-center py-1.5 text-gray-500 hover:text-red-500 transition">
              <User size={22} />
              <span className="text-[10px] mt-0.5">Profile</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;