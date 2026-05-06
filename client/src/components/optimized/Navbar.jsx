"use client";
import { useState, useEffect, useRef, useCallback, memo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ChevronDown, Search, ShoppingBag, User, Heart, Mic, Clock, Trash2, Shirt } from "lucide-react";
import { useDebounce } from "use-debounce";
import PropTypes from "prop-types";
import { logout } from "../../store/slices/authSlice";
import { fetchCategories } from "../../store/slices/categorySlice";
import { fetchCart, selectCartTotalQuantity } from "../../store/slices/cartSlice";
import { fetchWishlist, selectWishlistCount } from "../../store/slices/wishlistSlice";
import {
  getSearchSuggestions,
  addRecentSearch,
  removeRecentSearch,
  clearRecentSearches,
} from "../../store/slices/searchSlice";
import { optimizeImage } from "../../utils/performance";
// Lazy-loaded components
const DesktopNavigation = memo(({ categories, navigateToCategory }) => (
  <div className="items-center justify-center hidden px-4 py-3 space-x-6 overflow-x-auto border-t border-gray-200 md:flex scrollbar-hide">
    {categories.map((cat) => (
      <div
        key={cat._id}
        onClick={() => navigateToCategory(cat._id)}
        className="flex-shrink-0 font-medium text-gray-700 transition-colors duration-200 cursor-pointer hover:text-red-600 whitespace-nowrap"
      >
        {cat.name}
      </div>
    ))}
  </div>
));
DesktopNavigation.displayName = "DesktopNavigation";
DesktopNavigation.propTypes = {
  categories: PropTypes.arrayOf(
    PropTypes.shape({
      _id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired
    })
  ).isRequired,
  navigateToCategory: PropTypes.func.isRequired
};
const MobileNavigation = memo(({ categoriesForMobileScroll, navigateToCategory, navigateToUnder999 }) => (
  <div className="flex py-3 space-x-4 overflow-x-auto border-t border-gray-200 md:hidden scrollbar-hide">
    {categoriesForMobileScroll.map((cat) => (
      <div
        key={cat._id}
        className="flex flex-col items-center flex-shrink-0 text-gray-700 cursor-pointer hover:text-red-600"
        onClick={() => {
          if (cat._id === "cyd-promo") {
            navigateToUnder999();
          } else {
            navigateToCategory(cat._id);
          }
        }}
      >
        <img
          src={optimizeImage(cat.image?.url || "/placeholder.svg?height=64&width=64&query=category icon", { width: 64, height: 64 })}
          alt={cat.image?.alt || cat.name}
          width={64}
          height={64}
          className="object-cover w-16 h-16 mb-1 rounded-full"
          loading="lazy"
        />
        <span className="text-xs font-medium text-center whitespace-normal">{cat.name}</span>
      </div>
    ))}
  </div>
));
MobileNavigation.displayName = "MobileNavigation";
MobileNavigation.propTypes = {
  categoriesForMobileScroll: PropTypes.arrayOf(
    PropTypes.shape({
      _id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      image: PropTypes.shape({
        url: PropTypes.string,
        alt: PropTypes.string
      })
    })
  ).isRequired,
  navigateToCategory: PropTypes.func.isRequired,
  navigateToUnder999: PropTypes.func.isRequired
};
const SearchDropdown = memo(({
  showSearchDropdown,
  searchFocused,
  searchQuery,
  recentSearches,
  suggestions,
  suggestionsLoading,
  handleRecentSearchClick,
  handleSuggestionClick,
  dispatch,
}) => (
  <AnimatePresence>
    {showSearchDropdown && searchFocused && (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="absolute left-0 right-0 z-50 mt-2 overflow-y-auto bg-white border rounded-lg shadow-lg top-full max-h-80"
      >
        {recentSearches.length > 0 && !searchQuery && (
          <div className="p-4 border-b">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-gray-700">Recent Searches</h4>
              <button
                onClick={() => dispatch(clearRecentSearches())}
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                Clear All
              </button>
            </div>
            <div className="space-y-2">
              {recentSearches.map((search, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 rounded cursor-pointer hover:bg-gray-50"
                  onClick={() => handleRecentSearchClick(search)}
                >
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-700">{search}</span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      dispatch(removeRecentSearch(search));
                    }}
                    className="p-1 text-gray-400 hover:text-gray-600"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
        {searchQuery && (
          <div className="p-4">
            {suggestionsLoading ? (
              <div className="flex items-center justify-center py-4">
                <div className="w-4 h-4 border-2 border-gray-300 rounded-full border-t-red-600 animate-spin" />
              </div>
            ) : suggestions.length > 0 ? (
              <div className="space-y-2">
                <h4 className="mb-3 text-sm font-medium text-gray-700">Suggestions</h4>
                {suggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    className="flex items-center p-2 space-x-2 rounded cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSuggestionClick(suggestion)}
                  >
                    <Search className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-700">{suggestion}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-4 text-sm text-center text-gray-500">No suggestions found</div>
            )}
          </div>
        )}
      </motion.div>
    )}
  </AnimatePresence>
));
SearchDropdown.displayName = "SearchDropdown";
SearchDropdown.propTypes = {
  showSearchDropdown: PropTypes.bool.isRequired,
  searchFocused: PropTypes.bool.isRequired,
  searchQuery: PropTypes.string.isRequired,
  recentSearches: PropTypes.arrayOf(PropTypes.string).isRequired,
  suggestions: PropTypes.arrayOf(PropTypes.string).isRequired,
  suggestionsLoading: PropTypes.bool.isRequired,
  handleRecentSearchClick: PropTypes.func.isRequired,
  handleSuggestionClick: PropTypes.func.isRequired,
  dispatch: PropTypes.func.isRequired
};
const UserMenu = memo(({ showUserMenu, user, navigate, handleLogout, setShowUserMenu }) => (
  <AnimatePresence>
    {showUserMenu && (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="absolute right-0 z-50 w-48 py-2 mt-10 bg-white border rounded shadow-lg"
      >
        <div
          onClick={() => {
            navigate("/profile");
            setShowUserMenu(false);
          }}
          className="px-4 py-2 text-sm hover:bg-red-50"
        >
          My Profile
        </div>
        <div
          onClick={() => {
            navigate("/orders");
            setShowUserMenu(false);
          }}
          className="px-4 py-2 text-sm hover:bg-red-50"
        >
          My Orders
        </div>
        {user?.role === "admin" && (
          <div
            onClick={() => {
              navigate("/admin");
              setShowUserMenu(false);
            }}
            className="px-4 py-2 text-sm hover:bg-red-50"
          >
            Admin Dashboard
          </div>
        )}
        {user?.role === "digitalMarketer" && (
          <div
            onClick={() => {
              navigate("/digitalMarketer");
              setShowUserMenu(false);
            }}
            className="px-4 py-2 text-sm hover:bg-red-50"
          >
            Marketer Dashboard
          </div>
        )}
        <div onClick={handleLogout} className="px-4 py-2 text-sm text-red-600 hover:bg-red-50">
          Logout
        </div>
      </motion.div>
    )}
  </AnimatePresence>
));
UserMenu.displayName = "UserMenu";
UserMenu.propTypes = {
  showUserMenu: PropTypes.bool.isRequired,
  user: PropTypes.shape({
    name: PropTypes.string,
    role: PropTypes.string
  }),
  navigate: PropTypes.func.isRequired,
  handleLogout: PropTypes.func.isRequired,
  setShowUserMenu: PropTypes.func.isRequired
};
const MobileMenu = memo(({ isMenuOpen, categories, navigateToCategory, navigate, token, user, setShowUserMenu, setIsMenuOpen }) => (
  <AnimatePresence>
    {isMenuOpen && (
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: "auto" }}
        exit={{ opacity: 0, height: 0 }}
        className="bg-white border-t border-gray-200 shadow-md md:hidden"
      >
        <div className="flex flex-col px-4 py-3 space-y-3">
          {categories.map((cat) => (
            <div
              key={cat._id}
              onClick={() => {
                navigateToCategory(cat._id);
                setIsMenuOpen(false);
              }}
              className="py-2 text-gray-700 border-b border-gray-200 cursor-pointer hover:text-red-600"
            >
              {cat.name}
            </div>
          ))}
          <div
            onClick={() => {
              navigate("/wishlist");
              setIsMenuOpen(false);
            }}
            className="py-2 text-gray-700 border-b border-gray-200 cursor-pointer hover:text-red-600"
          >
            Wishlist
          </div>
          <div
            onClick={() => {
              navigate("/cart");
              setIsMenuOpen(false);
            }}
            className="py-2 text-gray-700 border-b border-gray-200 cursor-pointer hover:text-red-600"
          >
            Cart
          </div>
          <div
            onClick={() => {
              if (!token) navigate("/login");
              else setShowUserMenu(true);
              setIsMenuOpen(false);
            }}
            className="py-2 text-gray-700 border-b border-gray-200 cursor-pointer hover:text-red-600"
          >
            {token ? (user && user.name) || "Profile" : "Login"}
          </div>
        </div>
      </motion.div>
    )}
  </AnimatePresence>
));
MobileMenu.displayName = "MobileMenu";
MobileMenu.propTypes = {
  isMenuOpen: PropTypes.bool.isRequired,
  categories: PropTypes.arrayOf(
    PropTypes.shape({
      _id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired
    })
  ).isRequired,
  navigateToCategory: PropTypes.func.isRequired,
  navigate: PropTypes.func.isRequired,
  token: PropTypes.string,
  user: PropTypes.shape({
    name: PropTypes.string,
    role: PropTypes.string
  }),
  setShowUserMenu: PropTypes.func.isRequired,
  setIsMenuOpen: PropTypes.func.isRequired
};
// Main component
const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const searchRef = useRef(null);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();
  const { user, token } = useSelector((state) => state.auth || {});
  const { categories } = useSelector((state) => state.categories || {});
  const { suggestions, recentSearches, suggestionsLoading } = useSelector((state) => state.search || {});
  const cartTotalQuantity = useSelector(selectCartTotalQuantity);
  const wishlistCount = useSelector(selectWishlistCount);
  const [debouncedSearchQuery] = useDebounce(searchQuery, 300);
  // Path-based conditions - memoized
  const isProductDetailPage = location.pathname.startsWith("/product/");
  const isCartPage = location.pathname === "/cart";
  // Fetch data when user is authenticated
  useEffect(() => {
    if (token && user != null) {
      dispatch(fetchCart());
      dispatch(fetchWishlist());
    }
  }, [user, dispatch, token]);
  // Fetch categories once
  useEffect(() => {
    dispatch(fetchCategories({ showOnHomepage: true }));
  }, [dispatch]);
  // Get search suggestions when query changes
  useEffect(() => {
    if (debouncedSearchQuery.trim() && searchFocused) {
      dispatch(getSearchSuggestions(debouncedSearchQuery.trim()));
    }
  }, [debouncedSearchQuery, searchFocused, dispatch]);
  // Close search dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearchDropdown(false);
        setSearchFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  // Memoized handlers
  const navigateToCategory = useCallback((categoryId = "") => {
    const base = "/products?";
    navigate(categoryId ? `${base}category=${categoryId}` : base);
  }, [navigate]);
  const navigateToUnder999 = useCallback(() => {
    navigate("/products?maxPrice=999");
  }, [navigate]);
  const handleLogout = useCallback(() => {
    dispatch(logout());
    setShowUserMenu(false);
    navigate("/");
  }, [dispatch, navigate]);
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
  }, [dispatch, navigate, searchQuery]);
  const handleSearchFocus = useCallback(() => {
    setSearchFocused(true);
    setShowSearchDropdown(true);
  }, []);
  const handleSuggestionClick = useCallback((suggestion) => {
    setSearchQuery(suggestion);
    handleSearch(null, suggestion);
  }, [handleSearch]);
  const handleRecentSearchClick = useCallback((recentSearch) => {
    setSearchQuery(recentSearch);
    handleSearch(null, recentSearch);
  }, [handleSearch]);
  // Search animation variants
  const searchVariants = {
    focused: { scale: 1.02 },
    unfocused: { scale: 1 },
  };
  // Prepare categories for mobile display
  const desiredMobileCategoryNames = ["Oversized", "New Arrival", "Minimalist", "Regular"];
  const categoriesForMobileScroll = [];
  desiredMobileCategoryNames.forEach((name) => {
    const foundCat = categories.find((cat) => cat.name === name);
    if (foundCat) {
      categoriesForMobileScroll.push(foundCat);
    }
  });
  if (categoriesForMobileScroll.length < 5 && categories.length > 0) {
    const existingNames = new Set(categoriesForMobileScroll.map((cat) => cat.name));
    categories.forEach((cat) => {
      if (!existingNames.has(cat.name) && categoriesForMobileScroll.length < 5) {
        categoriesForMobileScroll.push(cat);
        existingNames.add(cat.name);
      }
    });
  }
  const cydCategory = {
    _id: "cyd-promo",
    name: "Under ₹999",
    image: { url: "cydlogo.jpeg", alt: "CYD logo" },
  };
  if (!categoriesForMobileScroll.some((cat) => cat.name === cydCategory.name)) {
    categoriesForMobileScroll.unshift(cydCategory);
  }
  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
        className="sticky top-0 z-50 bg-white shadow-md"
      >
        <div className="container px-4 mx-auto uppercase">
          {/* Top Header Row */}
          <div className="flex items-center justify-between py-4">
            {/* Mobile Menu Toggle & Logo */}
            <div className="flex items-center gap-4">
              <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="pt-2 pb-2 pl-2 md:hidden">
                {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
              {/* Logo - Adjusted for better display */}
              <div onClick={() => navigate("/")} className="flex items-center cursor-pointer">
                <div className="hidden md:block">
                  <img
                    src={optimizeImage("KsauniLogo.png", { width: 120, height: 48, format: "webp" })}
                    alt="company logo"
                    className="object-contain w-auto h-12"
                    width={120}
                    height={48}
                  />
                </div>
                <div className="md:hidden">
                  <img
                    src={optimizeImage("logo.png", { width: 40, height: 40, format: "webp" })}
                    alt="company logo"
                    className="object-contain w-10 h-10"
                    width={40}
                    height={40}
                  />
                </div>
              </div>
            </div>
            {/* Search Bar (hidden on mobile in this row, shown below) */}
            <div
              className={`hidden md:flex justify-center flex-1 w-full md:w-auto md:max-w-xl mx-4 ${isProductDetailPage ? "hidden" : ""}`}
            >
              <motion.div
                ref={searchRef}
                className="relative w-full"
                variants={searchVariants}
                animate={searchFocused ? "focused" : "unfocused"}
              >
                <form onSubmit={handleSearch}>
                  <Search className="absolute w-4 h-4 text-gray-400 transform -translate-y-1/2 left-4 top-1/2" />
                  <motion.input
                    type="text"
                    placeholder="What are you looking for?"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={handleSearchFocus}
                    className="w-full py-2 pl-10 pr-10 text-sm placeholder-gray-400 transition-all duration-300 border border-gray-200 rounded-full outline-none bg-gray-50 focus:bg-white focus:ring-2 focus:ring-red-600/20"
                    whileFocus={{ scale: 1.02 }}
                  />
                  <Mic className="absolute w-4 h-4 text-gray-400 transform -translate-y-1/2 right-4 top-1/2" />
                </form>
                <SearchDropdown
                  showSearchDropdown={showSearchDropdown}
                  searchFocused={searchFocused}
                  searchQuery={searchQuery}
                  recentSearches={recentSearches}
                  suggestions={suggestions}
                  suggestionsLoading={suggestionsLoading}
                  handleRecentSearchClick={handleRecentSearchClick}
                  handleSuggestionClick={handleSuggestionClick}
                  dispatch={dispatch}
                />
              </motion.div>
            </div>
            {/* Right-side icons */}
            <div className="flex items-center space-x-4 md:space-x-6">
              {/* Wishlist icon - always visible */}
              <div
                onClick={() => navigate("/wishlist")}
                className="relative flex items-center space-x-1 text-gray-700 cursor-pointer hover:text-red-600"
              >
                <Heart className="w-5 h-5" />
                <span className="hidden text-sm md:inline">Wishlist</span>
                {wishlistCount > 0 && (
                  <motion.span
                    key={wishlistCount}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    className="absolute flex items-center justify-center w-5 h-5 text-xs text-white bg-red-500 rounded-full -top-2 -right-2"
                  >
                    {wishlistCount}
                  </motion.span>
                )}
              </div>
              {/* Cart icon - always visible */}
              <div
                onClick={() => navigate("/cart")}
                className="relative flex items-center space-x-1 text-gray-700 cursor-pointer hover:text-red-600"
              >
                <ShoppingBag className="w-5 h-5" />
                <span className="hidden text-sm md:inline">Cart</span>
                {cartTotalQuantity > 0 && (
                  <motion.span
                    key={cartTotalQuantity}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    className="absolute flex items-center justify-center w-5 h-5 text-xs text-white bg-red-500 rounded-full -top-2 -right-2"
                  >
                    {cartTotalQuantity}
                  </motion.span>
                )}
              </div>
              {/* User/Login icon - hidden on mobile, visible on desktop */}
              <div className="relative items-center hidden text-gray-700 cursor-pointer md:flex hover:text-red-600">
                <User className="w-5 h-5 mr-1" />
                <span
                  onClick={() => {
                    if (!token) navigate("/login");
                    else setShowUserMenu(!showUserMenu);
                  }}
                  className="text-sm"
                >
                  {token ? user?.name || "Profile" : "Login"}
                </span>
                <ChevronDown className="w-4 h-4 ml-1" />
                <UserMenu
                  showUserMenu={showUserMenu}
                  user={user}
                  navigate={navigate}
                  handleLogout={handleLogout}
                  setShowUserMenu={setShowUserMenu}
                />
              </div>
            </div>
          </div>
          {/* Mobile Search Bar - visible only on mobile, below the top row */}
          <div className={`flex justify-center w-full py-2 md:hidden ${isProductDetailPage ? "hidden" : ""}`}>
            <motion.div
              ref={searchRef}
              className="relative w-full"
              variants={searchVariants}
              animate={searchFocused ? "focused" : "unfocused"}
            >
              <form onSubmit={handleSearch}>
                <Search className="absolute w-3 h-3 text-gray-400 transform -translate-y-1/2 left-4 top-1/2" />
                <motion.input
                  type="text"
                  placeholder="Search From Oversized T-Shirt"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={handleSearchFocus}
                  className="w-full py-2 pl-10 pr-10 text-sm placeholder-gray-400 transition-all duration-300 border border-gray-200 rounded-full outline-none bg-gray-50 focus:bg-white focus:ring-2 focus:ring-red-600/20"
                  whileFocus={{ scale: 1.02 }}
                />
                <Mic className="absolute w-3 h-3 text-gray-400 transform -translate-y-1/2 right-4 top-1/2" />
              </form>
              <SearchDropdown
                showSearchDropdown={showSearchDropdown}
                searchFocused={searchFocused}
                searchQuery={searchQuery}
                recentSearches={recentSearches}
                suggestions={suggestions}
                suggestionsLoading={suggestionsLoading}
                handleRecentSearchClick={handleRecentSearchClick}
                handleSuggestionClick={handleSuggestionClick}
                dispatch={dispatch}
              />
            </motion.div>
          </div>
          {/* Desktop Category Navigation */}
          {!isCartPage && <DesktopNavigation categories={categories} navigateToCategory={navigateToCategory} />}
          {/* Mobile Horizontal Category Navigation */}
          {!isProductDetailPage && !isCartPage && (
            <MobileNavigation
              categoriesForMobileScroll={categoriesForMobileScroll}
              navigateToCategory={navigateToCategory}
              navigateToUnder999={navigateToUnder999}
            />
          )}
          {/* Mobile Menu Content */}
          <MobileMenu
            isMenuOpen={isMenuOpen}
            categories={categories}
            navigateToCategory={navigateToCategory}
            navigate={navigate}
            token={token}
            user={user}
            setShowUserMenu={setShowUserMenu}
            setIsMenuOpen={setIsMenuOpen}
          />
        </div>
      </motion.nav>
      {/* Bottom Navigation Bar for Mobile */}
      {!isProductDetailPage && !isCartPage && (
        <div className="fixed bottom-0 left-0 right-0 z-50 grid grid-cols-4 gap-0 py-1 bg-white border-t border-gray-200 shadow-lg md:hidden">
          <div
            onClick={() => navigate("/")}
            className="flex flex-col items-center justify-center px-1 py-1 text-[12px] font-semibold text-red-600 cursor-pointer"
          >
            <span className="text-xl font-bold mb-0.5 w-6 h-6">
              <img
                src={optimizeImage("logo.png", { width: 24, height: 24, format: "webp" })}
                alt="company logo"
                className="object-contain w-full h-full"
                width={24}
                height={24}
              />
            </span>
            <span>Home</span>
          </div>
          <div
            onClick={() => navigateToUnder999()}
            className="flex flex-col items-center justify-center px-1 py-1 text-[4px] font-semibold text-gray-700 cursor-pointer hover:text-red-600"
          >
            <img
              src={optimizeImage("/cyd.svg", { width: 32, height: 24 })}
              alt="CYD Logo"
              width={32}
              height={24}
            />
          </div>
          <div
            onClick={() => navigate("/products")}
            className="flex flex-col items-center justify-center px-1 py-1 text-[12px] font-semibold text-gray-700 cursor-pointer hover:text-red-600"
          >
            <Shirt className="w-5 h-5 mb-0.5" />
            <span>T-Shirts</span>
          </div>
          <div
            onClick={() => {
              if (token) navigate("/profile");
              else navigate("/login");
            }}
            className="flex flex-col items-center justify-center px-1 py-1 text-[12px] font-semibold text-gray-700 cursor-pointer hover:text-red-600"
          >
            <User className="w-5 h-5 mb-0.5" />
            <span>Profile</span>
          </div>
        </div>
      )}
    </>
  );
};
export default memo(Navbar);