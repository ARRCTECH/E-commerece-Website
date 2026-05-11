"use client"
import { useState, useEffect, useRef } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { useSelector, useDispatch } from "react-redux"
import { motion, AnimatePresence } from "framer-motion"
import { Menu, X, ChevronDown, Search, ShoppingBag, User, Heart, Mic, Clock, Trash2, Shirt, Sparkles, Tag, TrendingUp } from "lucide-react"
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
import { clearCart } from "../store/slices/cartSlice"
import toast from "react-hot-toast"

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [searchFocused, setSearchFocused] = useState(false)
  const [showSearchDropdown, setShowSearchDropdown] = useState(false)
  const [scrolled, setScrolled] = useState(false)
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

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

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
    }, 2000)
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
    setIsMenuOpen(false)
  }

  const navigateToUnder999 = () => {
    navigate("/products?maxPrice=999")
    setIsMenuOpen(false)
  }

  const handleClearCart = async () => {
    try {
      await dispatch(clearCart()).unwrap()
      toast.success("Cart cleared successfully")
    } catch (error) {
      toast.error(error?.message || "Failed to clear cart")
    }
  }

  const handleLogout = () => {
    dispatch(logout())
    setTimeout(handleClearCart, 1000)
    setShowUserMenu(false)
    navigate("/")
    toast.success("Logged out successfully")
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
    focused: { scale: 1.02, boxShadow: "0 0 0 3px rgba(220, 38, 38, 0.1)" },
    unfocused: { scale: 1, boxShadow: "0 0 0 0px rgba(220, 38, 38, 0)" },
  }

  const desiredMobileCategoryNames = ["Oversized", "New Arrival", "Minimalist", "Regular"]
  const categoriesForMobileScroll = []
  desiredMobileCategoryNames.forEach((name) => {
    const foundCat = categories.find((cat) => cat.name === name)
    if (foundCat) {
      if (foundCat.slug === "anime-t-shirt") return
      if (foundCat.slug === "ksauni-tshirts-styles") return
      categoriesForMobileScroll.push(foundCat)
    }
  })
  
  if (categoriesForMobileScroll.length < 5 && categories.length > 0) {
    const existingNames = new Set(categoriesForMobileScroll.map((cat) => cat.name))
    categories.forEach((cat) => {
      if (!existingNames.has(cat.name) && categoriesForMobileScroll.length < 5) {
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

  const isProductDetailPage = location.pathname.startsWith("/product/")
  const isCartPage = location.pathname === "/cart"

  return (
    <>
      <motion.nav
        initial={{ y: -50 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
        className={`sticky top-0 z-50 transition-all duration-300 ${
          scrolled ? "bg-white/95 backdrop-blur-md shadow-lg" : "bg-white shadow-md"
        }`}
      >
        <div className="container px-4 mx-auto">
          {/* Top Header Row */}
          <div className="flex items-center justify-between py-3">
            {/* Logo Section - Properly Aligned */}
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)} 
                className="p-2 transition-colors rounded-lg hover:bg-gray-100 md:hidden"
              >
                {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
              
              {/* Logo with proper alignment */}
              <div 
                onClick={() => navigate("/")} 
                className="flex items-center gap-2 cursor-pointer group"
              >
                <div className="relative">
                  <img 
                    src="/logo1.png" 
                    alt="Factory Sale" 
                    className="object-contain w-10 h-10 transition-transform group-hover:scale-105"
                  />
                  <span className="absolute -top-1 -right-2 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                  </span>
                </div>
                <div className="hidden md:block">
                  <h1 className="text-xl font-bold tracking-tight text-gray-800">
                    FACTORY <span className="text-red-600">SALE</span>
                  </h1>
                  <p className="text-[10px] text-gray-500 -mt-1">Premium Menswear</p>
                </div>
              </div>
            </div>

            {/* Desktop Search Bar */}
            <div className="hidden md:flex justify-center flex-1 max-w-xl mx-6">
              <motion.div
                ref={searchRef}
                className="relative w-full"
                variants={searchVariants}
                animate={searchFocused ? "focused" : "unfocused"}
              >
                <form onSubmit={handleSearch}>
                  <Search className="absolute w-4 h-4 text-gray-400 transform -translate-y-1/2 left-4 top-1/2" />
                  <input
                    type="text"
                    placeholder={placeholders[index]}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={handleSearchFocus}
                    className="w-full py-2.5 pl-11 pr-12 text-sm text-gray-700 placeholder-gray-400 transition-all duration-300 border border-gray-200 rounded-full outline-none bg-gray-50 focus:bg-white focus:border-red-300"
                  />
                  <Mic className="absolute w-4 h-4 text-gray-400 transform -translate-y-1/2 right-4 top-1/2 cursor-pointer hover:text-red-500 transition-colors" />
                </form>
                
                {/* Search Dropdown */}
                <AnimatePresence>
                  {showSearchDropdown && searchFocused && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute left-0 right-0 z-50 mt-2 overflow-y-auto bg-white border rounded-xl shadow-xl top-full max-h-80"
                    >
                      {recentSearches.length > 0 && !searchQuery && (
                        <div className="p-4 border-b">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="text-sm font-semibold text-gray-700">Recent Searches</h4>
                            <button
                              onClick={() => dispatch(clearRecentSearches())}
                              className="text-xs text-red-500 hover:text-red-600"
                            >
                              Clear All
                            </button>
                          </div>
                          <div className="space-y-2">
                            {recentSearches.map((search, idx) => (
                              <div
                                key={idx}
                                className="flex items-center justify-between p-2 rounded-lg cursor-pointer hover:bg-gray-50"
                                onClick={() => handleRecentSearchClick(search)}
                              >
                                <div className="flex items-center space-x-3">
                                  <Clock className="w-4 h-4 text-gray-400" />
                                  <span className="text-sm text-gray-700">{search}</span>
                                </div>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    dispatch(removeRecentSearch(search))
                                  }}
                                  className="p-1 text-gray-400 rounded hover:bg-gray-100"
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
                              <h4 className="text-sm font-semibold text-gray-700">Suggestions</h4>
                              {suggestions.map((suggestion, idx) => (
                                <div
                                  key={idx}
                                  className="flex items-center p-2 space-x-3 rounded-lg cursor-pointer hover:bg-gray-50"
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

            {/* Right Icons */}
            <div className="flex items-center gap-4">
              {/* Wishlist */}
              <div
                onClick={() => navigate("/wishlist")}
                className="relative p-2 transition-colors rounded-lg cursor-pointer hover:bg-red-50 group"
              >
                <Heart className="w-5 h-5 text-gray-600 group-hover:text-red-600 transition-colors" />
                {wishlistCount > 0 && (
                  <motion.span
                    key={wishlistCount}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full shadow-lg"
                  >
                    {wishlistCount}
                  </motion.span>
                )}
              </div>

              {/* Cart */}
              <div
                onClick={() => navigate("/cart")}
                className="relative p-2 transition-colors rounded-lg cursor-pointer hover:bg-red-50 group"
              >
                <ShoppingBag className="w-5 h-5 text-gray-600 group-hover:text-red-600 transition-colors" />
                {cartTotalQuantity > 0 && (
                  <motion.span
                    key={cartTotalQuantity}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full shadow-lg"
                  >
                    {cartTotalQuantity}
                  </motion.span>
                )}
              </div>

              {/* User Menu */}
              <div className="relative">
                <div
                  onClick={() => {
                    if (!token) navigate("/login")
                    else setShowUserMenu(!showUserMenu)
                  }}
                  className="flex items-center gap-1 p-2 transition-colors rounded-lg cursor-pointer hover:bg-red-50 group"
                >
                  <User className="w-5 h-5 text-gray-600 group-hover:text-red-600 transition-colors" />
                  <span className="hidden text-sm font-medium text-gray-700 lg:inline">
                    {token ? (user?.name?.split(" ")[0] || "Profile") : "Login"}
                  </span>
                  <ChevronDown className="hidden w-4 h-4 text-gray-400 lg:inline" />
                </div>

                <AnimatePresence>
                  {showUserMenu && token && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute right-0 z-50 w-56 mt-2 overflow-hidden bg-white border rounded-xl shadow-xl"
                    >
                      <div className="p-3 border-b bg-gradient-to-r from-red-50 to-white">
                        <p className="text-sm font-semibold text-gray-800">{user?.name}</p>
                        <p className="text-xs text-gray-500">{user?.email}</p>
                      </div>
                      <div className="py-2">
                        <div
                          onClick={() => {
                            navigate("/profile")
                            setShowUserMenu(false)
                          }}
                          className="px-4 py-2 text-sm transition-colors cursor-pointer hover:bg-red-50 hover:text-red-600"
                        >
                          My Profile
                        </div>
                        <div
                          onClick={() => {
                            navigate("/orders")
                            setShowUserMenu(false)
                          }}
                          className="px-4 py-2 text-sm transition-colors cursor-pointer hover:bg-red-50 hover:text-red-600"
                        >
                          My Orders
                        </div>
                        <div
                          onClick={() => {
                            navigate("/wishlist")
                            setShowUserMenu(false)
                          }}
                          className="px-4 py-2 text-sm transition-colors cursor-pointer hover:bg-red-50 hover:text-red-600"
                        >
                          Wishlist
                        </div>
                        {user?.role === "admin" && (
                          <div
                            onClick={() => {
                              navigate("/admin")
                              setShowUserMenu(false)
                            }}
                            className="px-4 py-2 text-sm transition-colors cursor-pointer hover:bg-red-50 hover:text-red-600"
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
                            className="px-4 py-2 text-sm transition-colors cursor-pointer hover:bg-red-50 hover:text-red-600"
                          >
                            Marketer Dashboard
                          </div>
                        )}
                        <div className="border-t my-1"></div>
                        <div
                          onClick={handleLogout}
                          className="px-4 py-2 text-sm text-red-600 transition-colors cursor-pointer hover:bg-red-50"
                        >
                          Logout
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Mobile Search Bar */}
          <div className="pb-3 md:hidden">
            <motion.div
              ref={searchRef}
              className="relative w-full"
              variants={searchVariants}
              animate={searchFocused ? "focused" : "unfocused"}
            >
              <form onSubmit={handleSearch}>
                <Search className="absolute w-4 h-4 text-gray-400 transform -translate-y-1/2 left-4 top-1/2" />
                <input
                  type="text"
                  placeholder={placeholders[index]}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={handleSearchFocus}
                  className="w-full py-2.5 pl-11 pr-10 text-sm text-gray-700 placeholder-gray-400 transition-all duration-300 border border-gray-200 rounded-full outline-none bg-gray-50 focus:bg-white focus:border-red-300"
                />
              </form>
              
              <AnimatePresence>
                {showSearchDropdown && searchFocused && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute left-0 right-0 z-50 mt-2 overflow-y-auto bg-white border rounded-xl shadow-xl top-full max-h-80"
                  >
                    {/* Same dropdown content as desktop */}
                    {recentSearches.length > 0 && !searchQuery && (
                      <div className="p-4 border-b">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-sm font-semibold text-gray-700">Recent Searches</h4>
                          <button
                            onClick={() => dispatch(clearRecentSearches())}
                            className="text-xs text-red-500"
                          >
                            Clear All
                          </button>
                        </div>
                        <div className="space-y-2">
                          {recentSearches.map((search, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between p-2 rounded-lg cursor-pointer hover:bg-gray-50"
                              onClick={() => handleRecentSearchClick(search)}
                            >
                              <div className="flex items-center space-x-3">
                                <Clock className="w-4 h-4 text-gray-400" />
                                <span className="text-sm text-gray-700">{search}</span>
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  dispatch(removeRecentSearch(search))
                                }}
                                className="p-1 text-gray-400 rounded hover:bg-gray-100"
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
                            <h4 className="text-sm font-semibold text-gray-700">Suggestions</h4>
                            {suggestions.map((suggestion, idx) => (
                              <div
                                key={idx}
                                className="flex items-center p-2 space-x-3 rounded-lg cursor-pointer hover:bg-gray-50"
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
            <div className="items-center justify-center hidden px-4 py-2 space-x-8 overflow-x-auto border-t border-gray-100 md:flex scrollbar-hide">
              {categories
                .filter(cat => {
                  const excludedSlugs = ["anime-t-shirt", "ksauni-tshirts-styles"]
                  return !excludedSlugs.includes(cat.slug)
                })
                .map((cat) => (
                  <div
                    key={cat._id}
                    onClick={() => navigateToCategory(cat.slug)}
                    className="relative flex-shrink-0 text-sm font-medium text-gray-600 transition-all duration-300 cursor-pointer group hover:text-red-600"
                  >
                    {cat.name}
                    <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-red-600 transition-all duration-300 group-hover:w-full"></span>
                  </div>
                ))}
              <div
                onClick={navigateToUnder999}
                className="relative flex-shrink-0 text-sm font-medium text-red-600 transition-all duration-300 cursor-pointer group"
              >
                <Tag className="inline w-3 h-3 mr-1" />
                Under ₹999
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-red-600 transition-all duration-300 group-hover:w-full"></span>
              </div>
            </div>
          )}

          {/* Mobile Horizontal Category Navigation */}
          {!isProductDetailPage && !isCartPage && (
            <div className="flex py-3 space-x-4 overflow-x-auto border-t border-gray-100 md:hidden scrollbar-hide">
              {categoriesForMobileScroll.map((cat) => (
                <div
                  key={cat._id}
                  className="flex flex-col items-center flex-shrink-0 transition-transform transform cursor-pointer hover:scale-105"
                  onClick={() => {
                    if (cat._id === "cyd-promo") {
                      navigateToUnder999()
                    } else {
                      navigateToCategory(cat.slug)
                    }
                  }}
                >
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center overflow-hidden shadow-md">
                    <img
                      src={cat.image?.url || "/placeholder.svg"}
                      alt={cat.image?.alt || cat.name}
                      className="object-cover w-full h-full"
                    />
                  </div>
                  <span className="mt-1 text-[10px] font-medium text-center text-gray-700">{cat.name}</span>
                </div>
              ))}
            </div>
          )}

          {/* Mobile Menu Drawer */}
          <AnimatePresence>
            {isMenuOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden bg-white border-t border-gray-100 md:hidden"
              >
                <div className="flex flex-col px-4 py-4 space-y-2">
                  {categories
                    .filter(cat => {
                      const excludedSlugs = ["anime-t-shirt", "ksauni-tshirts-styles"]
                      return !excludedSlugs.includes(cat.slug)
                    })
                    .map((cat) => (
                      <div
                        key={cat._id}
                        onClick={() => navigateToCategory(cat.slug)}
                        className="py-3 text-sm font-medium text-gray-700 border-b border-gray-100 cursor-pointer hover:text-red-600"
                      >
                        {cat.name}
                      </div>
                    ))}
                  <div
                    onClick={navigateToUnder999}
                    className="py-3 text-sm font-medium text-red-600 border-b border-gray-100 cursor-pointer"
                  >
                    <Tag className="inline w-3 h-3 mr-2" />
                    Under ₹999
                  </div>
                  <div
                    onClick={() => {
                      navigate("/wishlist")
                      setIsMenuOpen(false)
                    }}
                    className="py-3 text-sm font-medium text-gray-700 border-b border-gray-100 cursor-pointer hover:text-red-600"
                  >
                    Wishlist
                  </div>
                  <div
                    onClick={() => {
                      navigate("/cart")
                      setIsMenuOpen(false)
                    }}
                    className="py-3 text-sm font-medium text-gray-700 border-b border-gray-100 cursor-pointer hover:text-red-600"
                  >
                    Cart
                  </div>
                  {!token ? (
                    <div
                      onClick={() => {
                        navigate("/login")
                        setIsMenuOpen(false)
                      }}
                      className="py-3 text-sm font-medium text-gray-700 border-b border-gray-100 cursor-pointer hover:text-red-600"
                    >
                      Login / Sign Up
                    </div>
                  ) : (
                    <>
                      <div
                        onClick={() => {
                          navigate("/profile")
                          setIsMenuOpen(false)
                        }}
                        className="py-3 text-sm font-medium text-gray-700 border-b border-gray-100 cursor-pointer hover:text-red-600"
                      >
                        My Profile
                      </div>
                      <div
                        onClick={() => {
                          navigate("/orders")
                          setIsMenuOpen(false)
                        }}
                        className="py-3 text-sm font-medium text-gray-700 border-b border-gray-100 cursor-pointer hover:text-red-600"
                      >
                        My Orders
                      </div>
                      <div
                        onClick={handleLogout}
                        className="py-3 text-sm font-medium text-red-600 cursor-pointer"
                      >
                        Logout
                      </div>
                    </>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.nav>

      {/* Bottom Navigation Bar for Mobile */}
      {!isProductDetailPage && !isCartPage && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-gray-200 shadow-lg md:hidden">
          <div className="grid grid-cols-4 py-2">
            <div
              onClick={() => navigate("/")}
              className="flex flex-col items-center gap-1 transition-colors cursor-pointer group"
            >
              <div className="p-1 rounded-lg group-hover:bg-red-50">
                <img src="/logo.png" alt="Home" className="w-5 h-5 object-contain" />
              </div>
              <span className="text-[10px] font-medium text-gray-600 group-hover:text-red-600">Home</span>
            </div>
            
            <div
              onClick={navigateToUnder999}
              className="flex flex-col items-center gap-1 transition-colors cursor-pointer group"
            >
              <div className="p-1 rounded-lg group-hover:bg-red-50">
                <Tag className="w-5 h-5 text-gray-600 group-hover:text-red-600" />
              </div>
              <span className="text-[10px] font-medium text-gray-600 group-hover:text-red-600">Under ₹999</span>
            </div>
            
            <div
              onClick={() => navigate("/products")}
              className="flex flex-col items-center gap-1 transition-colors cursor-pointer group"
            >
              <div className="p-1 rounded-lg group-hover:bg-red-50">
                <Shirt className="w-5 h-5 text-gray-600 group-hover:text-red-600" />
              </div>
              <span className="text-[10px] font-medium text-gray-600 group-hover:text-red-600">T-Shirts</span>
            </div>
            
            <div
              onClick={() => token ? navigate("/profile") : navigate("/login")}
              className="flex flex-col items-center gap-1 transition-colors cursor-pointer group"
            >
              <div className="p-1 rounded-lg group-hover:bg-red-50">
                <User className="w-5 h-5 text-gray-600 group-hover:text-red-600" />
              </div>
              <span className="text-[10px] font-medium text-gray-600 group-hover:text-red-600">Profile</span>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default Navbar