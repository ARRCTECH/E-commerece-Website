"use client"
import { useState, useEffect, useRef } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { useSelector, useDispatch } from "react-redux"
import { motion, AnimatePresence } from "framer-motion"
import { Menu, X, ChevronDown, Search, ShoppingBag, User, Heart, Mic, Clock, Trash2, Shirt } from "lucide-react"
import { useDebounce } from "use-debounce"
import { logout } from "../store/slices/authSlice"
import { fetchCategories } from "../store/slices/categorySlice"
import { fetchCart, selectCartTotalQuantity } from "../store/slices/cartSlice"
import { fetchWishlist, selectWishlistCount } from "../store/slices/wishlistSlice"
import {
  getSearchSuggestions,
  addRecentSearch,
  removeRecentSearch,
  clearRecentSearches,
} from "../store/slices/searchSlice"

import {

  clearCart

} from "../store/slices/cartSlice"
const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [searchFocused, setSearchFocused] = useState(false)
  const [showSearchDropdown, setShowSearchDropdown] = useState(false)
  const searchRef = useRef(null)
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const location = useLocation()
  const { user, token } = useSelector((state) => state.auth || {})
  const { categories } = useSelector((state) => state.categories || {})
  const { suggestions, recentSearches, suggestionsLoading } = useSelector((state) => state.search || {})
  const cartTotalQuantity = useSelector(selectCartTotalQuantity)
  const wishlistCount = useSelector(selectWishlistCount)
  const [debouncedSearchQuery] = useDebounce(searchQuery, 300)
  const placeholders = [
    "Search for Oversize T-shirt",
    "Search for Hoodie",
    "Search for Plain",
    "Search for Acid Wash",
    "Search for Regular",
  ]
  const [index, setIndex] = useState(0)
  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prevIndex) => (prevIndex + 1) % placeholders.length)
    }, 2000) // switch every 2 seconds
    return () => clearInterval(interval)
  }, [])
  useEffect(() => {
    if (token && user != null) {
      dispatch(fetchCart())
      dispatch(fetchWishlist())
    }
  }, [user, dispatch, token])
  useEffect(() => {
    dispatch(fetchCategories({ showOnHomepage: false }))
  }, [dispatch])
  useEffect(() => {
    if (debouncedSearchQuery.trim() && searchFocused) {
      dispatch(getSearchSuggestions(debouncedSearchQuery.trim()))
    }
  }, [debouncedSearchQuery, searchFocused, dispatch])
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearchDropdown(false)
        setSearchFocused(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])
 
  const navigateToCategory = (categorySlug = "") => {
    const base = "/products?"
    navigate(categorySlug ? `${base}category=${categorySlug}` : base)
  }
  const navigateToUnder999 = () => {
    navigate("/products?maxPrice=999")
  }

    const handleClearCart = async () => {
      // if (window.confirm("Are you sure you want to clear your cart?")) {
        try {
          await dispatch(clearCart()).unwrap()
          toast.success("Cart cleared successfully")
        } catch (error) {
          toast.error(error?.message || "Failed to clear cart")
        }
      // }
    }

  const handleLogout = () => {
    dispatch(logout())

    setTimeout(handleClearCart,1000);
    setShowUserMenu(false)
    navigate("/")
  }
  const handleSearch = (e, query = searchQuery) => {
    e?.preventDefault()
    const searchTerm = query.trim()
    if (searchTerm) {
      dispatch(addRecentSearch(searchTerm))
      navigate(`/products?search=${encodeURIComponent(searchTerm)}`)
      setShowSearchDropdown(false)
      setSearchQuery("")
      setSearchFocused(false)
    }
  }
  const handleSearchFocus = () => {
    setSearchFocused(true)
    setShowSearchDropdown(true)
  }
  const handleSuggestionClick = (suggestion) => {
    setSearchQuery(suggestion)
    handleSearch(null, suggestion)
  }
  const handleRecentSearchClick = (recentSearch) => {
    setSearchQuery(recentSearch)
    handleSearch(null, recentSearch)
  }
  const searchVariants = {
    focused: { scale: 1.02 },
    unfocused: { scale: 1 },
  }
  const desiredMobileCategoryNames = ["Oversized", "New Arrival", "Minimalist", "Regular"]
  const categoriesForMobileScroll = []
  desiredMobileCategoryNames.forEach((name) => {
    const foundCat = categories.find((cat) => cat.name === name)
    if (foundCat) {
      //dont push ANIME T-SHIRT this naed category
      if (foundCat.slug === "anime-t-shirt") return
      // dont push Ksauni T-shirts Styles category
      if (foundCat.slug === "ksauni-tshirts-styles") return
      categoriesForMobileScroll.push(foundCat)
    }
  })
  if (categoriesForMobileScroll.length < 5 && categories.length > 0) {
    const existingNames = new Set(categoriesForMobileScroll.map((cat) => cat.name))
    categories.forEach((cat) => {
      if (!existingNames.has(cat.name) && categoriesForMobileScroll.length < 5) {
          // dont push ANIME T-SHIRT and Ksauni T-shirts Styles this named category
          if (cat.slug === "anime-t-shirt") return
          if (cat.slug === "ksauni-tshirts-styles") return
        categoriesForMobileScroll.push(cat)
        existingNames.add(cat.name)
      }
    })
  }
  const cydCategory = {
    _id: "cyd-promo",
    name: "Under ₹999",
    image: { url: "/cydlogo.jpeg", alt: "CYD logo" },
  }
  if (!categoriesForMobileScroll.some((cat) => cat.name === cydCategory.name)) {
    categoriesForMobileScroll.unshift(cydCategory)
  }

  const isProductDetailPage = window.location.pathname.startsWith("/product/")
  const isCartPage = location.pathname === "/cart"
  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
        className="sticky top-0 z-50 bg-white shadow-md"
      >
        <div className="container px-4 mx-auto uppercase  ">
          {/* Top Header Row */}
          <div className="flex items-center justify-between py-4 ">
            {/* Mobile Menu Toggle & Logo */}
            <div className="flex items-center gap-4">
              <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="pt-2 pb-2 pl-2 md:hidden">
                {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
              {/* Logo - Adjusted for better display */}
              <div onClick={() => navigate("/")} className="flex items-center cursor-pointer">
                <div className="hidden md:block">
                  <img src="/KsauniLogo.png" alt="company logo" className="object-cover w-auto h-10" />
                </div>
                <div className="md:hidden">
                  <img src="/KsauniLogo.png" alt="company logo" className="object-cover w-25 h-10" />
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
                    placeholder="Search from Oversized T-shirt"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={handleSearchFocus}
                    className="w-full py-2 pl-10 pr-10 text-sm placeholder-gray-400 transition-all duration-300 border border-gray-200 rounded-full outline-none bg-gray-50 focus:bg-white focus:ring-2 focus:ring-red-600/20"
                    whileFocus={{ scale: 1.02 }}
                  />
                  <Mic className="absolute w-4 h-4 text-gray-400 transform -translate-y-1/2 right-4 top-1/2" />
                </form>
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
                                    e.stopPropagation()
                                    dispatch(removeRecentSearch(search))
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
                              <div className="w-5 h-5 border-2 border-gray-300 rounded-full border-t-red-600 animate-spin" />
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
              </motion.div>
            </div>
            {/* Right-side icons */}
            <div className="flex items-center space-x-4 md:space-x-6">
              {/* Saved icon - visible on mobile, hidden on desktop */}
              {/* <div
                onClick={() => navigate("/saved-items")}
                className="relative flex items-center space-x-1 text-gray-700 cursor-pointer hover:text-red-600 md:hidden"
              >
                <SquarePlus className="w-5 h-5" />
              </div> */}
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
                    if (!token) navigate("/login")
                    else setShowUserMenu(!showUserMenu)
                  }}
                  className="text-sm"
                >
                  {token ? user?.name || "Profile" : "Login"}
                </span>
                <ChevronDown className="w-4 h-4 ml-1" />
                <AnimatePresence>
                  {showUserMenu && token && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute right-0 z-50 w-48 py-2 mt-10 bg-white border rounded shadow-lg"
                    >
                      <div
                        onClick={() => {
                          navigate("/profile")
                          setShowUserMenu(false)
                        }}
                        className="px-4 py-2 text-sm hover:bg-red-50"
                      >
                        My Profile
                      </div>
                      <div
                        onClick={() => {
                          navigate("/orders")
                          setShowUserMenu(false)
                        }}
                        className="px-4 py-2 text-sm hover:bg-red-50"
                      >
                        My Orders
                      </div>
                      {user?.role === "admin" && (
                        <div
                          onClick={() => {
                            navigate("/admin")
                            setShowUserMenu(false)
                          }}
                          className="px-4 py-2 text-sm hover:bg-red-50"
                        >
                          Admin Dashboard
                        </div>
                      )}
                      {user?.role === "digitalMarketer" && (
                        <div
                          onClick={() => {
                            navigate("/digitalMarketer")
                            setShowUserMenu(false)
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
                  placeholder={placeholders[index]}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={handleSearchFocus}
                  className="w-full py-2 pl-10 pr-10 text-sm placeholder-gray-400 transition-all duration-300 border border-gray-200 rounded-full outline-none bg-gray-50 focus:bg-white focus:ring-2 focus:ring-red-600/20"
                  whileFocus={{ scale: 1.02 }}
                />
                <Mic className="absolute w-3 h-3 text-gray-400 transform -translate-y-1/2 right-4 top-1/2" />
              </form>
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
                                  e.stopPropagation()
                                  dispatch(removeRecentSearch(search))
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
            </motion.div>
          </div>
          {/* Desktop Category Navigation */}
          {!isCartPage && (
            <div className="items-center justify-center hidden px-4 py-3 space-x-6 overflow-x-auto border-t border-gray-200 md:flex scrollbar-hide">
              {categories
                .filter(cat => {
                  const excludedSlugs = ["anime-t-shirt", "ksauni-tshirts-styles","ksauni-tshirts-styles"];
                  return !excludedSlugs.includes(cat.slug);
                })
                .map((cat) => (
                  <div
                    key={cat._id}
                    onClick={() => navigateToCategory(cat.slug)}
                    className="flex-shrink-0 font-medium text-gray-700 transition-colors duration-200 cursor-pointer hover:text-red-600 whitespace-nowrap"
                  >
                    {cat.name}
                  </div>
                ))}
            </div>
          )}
          {/* Mobile Horizontal Category Navigation */}
          {!isProductDetailPage && !isCartPage && (
            <div className="flex py-3 space-x-4 overflow-x-auto border-t border-gray-200 md:hidden scrollbar-hide">
              {categoriesForMobileScroll.map((cat) => (
                <div
                  key={cat._id}
                  className="flex flex-col items-center flex-shrink-0 text-gray-700 cursor-pointer hover:text-red-600"
                  onClick={() => {
                    if (cat._id === "cyd-promo") {
                      navigateToUnder999()
                    } else {
                      navigateToCategory(cat.slug)
                    }
                  }}
                >
                  <img
                    src={cat.image?.url || "/placeholder.svg?height=64&width=64&query=category icon"}
                    alt={cat.image?.alt || cat.name}
                    width={64}
                    height={64}
                    className="object-contain w-16 h-16 mb-1 rounded-full"
                  />
                  <span className="text-xs font-medium text-center whitespace-normal">{cat.name}</span>
                </div>
              ))}
            </div>
          )}
          {/* Mobile Menu Content */}
          <AnimatePresence>
            {isMenuOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-white border-t border-gray-200 shadow-md md:hidden"
              >
                <div className="flex flex-col px-4 py-3 space-y-3">
                  {/* Filtered Categories */}
                  {categories
                    .filter(cat => {
                      const excludedSlugs = ["anime-t-shirt", "ksauni-tshirts-styles","ksauni-tshirts-styles"];
                      return !excludedSlugs.includes(cat.slug);
                    })
                    .map((cat) => (
                      <div
                        key={cat._id}
                        onClick={() => {
                          navigateToCategory(cat.slug)
                          setIsMenuOpen(false)
                        }}
                        className="py-2 text-gray-700 border-b border-gray-200 cursor-pointer hover:text-red-600"
                      >
                        {cat.name}
                      </div>
                    ))}

                  {/* Other Menu Items (unchanged) */}
                  <div
                    onClick={() => {
                      navigate("/wishlist")
                      setIsMenuOpen(false)
                    }}
                    className="py-2 text-gray-700 border-b border-gray-200 cursor-pointer hover:text-red-600"
                  >
                    Wishlist
                  </div>
                  <div
                    onClick={() => {
                      navigate("/cart")
                      setIsMenuOpen(false)
                    }}
                    className="py-2 text-gray-700 border-b border-gray-200 cursor-pointer hover:text-red-600"
                  >
                    Cart
                  </div>
                  <div
                    onClick={() => {
                      if (!token) navigate("/login")
                      else setShowUserMenu(!showUserMenu)
                      setIsMenuOpen(false)
                    }}
                    className="py-2 text-gray-700 border-b border-gray-200 cursor-pointer hover:text-red-600"
                  >
                    {token ? user?.name || "Profile" : "Login"}
                  </div>
                  {/* logout button if logged in */}
                  {token && (<div
                    onClick={() => {
                      handleLogout();
                      if (isMenuOpen) {
                        setIsMenuOpen(false)  
                        logout()
                        
                      }
                    }}
                    className="py-2 text-gray-700 border-b border-gray-200 cursor-pointer hover:text-red-600"
                  >
                    Logout
                  </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
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
              <img src="/logo.png" alt="company logo" className="object-contain w-full h-full" />
            </span>
            <span>Home</span>
          </div>
          <div
            onClick={() => navigateToUnder999()}
            className="flex flex-col items-center justify-center px-1 py-1 text-[12px] font-semibold text-gray-700 cursor-pointer hover:text-red-600"
          >
            <div className="flex items-center justify-center">
              <img src="/cydlogo.jpeg" alt="CYD Logo" className="w-8 h-8 object-contain rounded-full" />
            </div>
            <span>Under ₹999</span>
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
              if (token) navigate("/profile")
              else navigate("/login")
            }}
            className="flex flex-col items-center justify-center px-1 py-1 text-[12px] font-semibold text-gray-700 cursor-pointer hover:text-red-600"
          >
            <User className="w-5 h-5 mb-0.5" />
            <span>Profile</span>
          </div>
        </div>
      )}
    </>
  )
}
export default Navbar