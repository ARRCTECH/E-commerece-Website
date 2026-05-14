import { useState, useEffect, useRef } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { useSelector, useDispatch } from "react-redux"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Menu, X, ChevronDown, Search, ShoppingBag, User, Heart, Mic, 
  Clock, Trash2, Shirt, Flame, LogOut, UserCircle, Tag, TrendingUp, Home, Sparkles, Truck, Gift, Shield 
} from "lucide-react"
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
  const userMenuRef = useRef(null)
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
  
  // Scroll effect for premium look
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])
  
  // Click outside handlers
  useEffect(() => {
    const handleClickOutsideSearch = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearchDropdown(false)
        setSearchFocused(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutsideSearch)
    return () => document.removeEventListener("mousedown", handleClickOutsideSearch)
  }, [])
  
  useEffect(() => {
    const handleClickOutsideUserMenu = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutsideUserMenu)
    return () => document.removeEventListener("mousedown", handleClickOutsideUserMenu)
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
  
  // Mobile categories logic
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
  
  // Animation variants for premium look
  const navVariants = {
    hidden: { y: -100, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } }
  }
  
  const dropdownVariants = {
    hidden: { opacity: 0, y: -10, scale: 0.95 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.2, ease: "easeOut" } },
    exit: { opacity: 0, y: -5, scale: 0.95, transition: { duration: 0.15 } }
  }
  
  const badgeVariants = {
    initial: { scale: 0 },
    animate: { scale: 1, transition: { type: "spring", stiffness: 500, damping: 30 } },
    exit: { scale: 0 }
  }
  
  return (
    <>
      {/* Premium Announcement Bar */}
      <div className="relative overflow-hidden bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-white">
        <div className="absolute inset-0 bg-black/20"></div>
        <motion.div
          initial={{ x: "0%" }}
          animate={{ x: "-50%" }}
          transition={{ repeat: Infinity, duration: 22, ease: "linear" }}
          className="flex whitespace-nowrap py-3 text-xs tracking-[0.25em] uppercase backdrop-blur-sm"
        >
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="flex shrink-0 items-center gap-10 px-6">
              <span className="inline-flex items-center gap-2">
                <Truck className="h-3.5 w-3.5" /> Free shipping over ₹999
              </span>
              <span className="text-white/40">✦</span>
              <span>New drop · Autumn / Winter '26</span>
              <span className="text-white/40">✦</span>
              <span className="inline-flex items-center gap-2">
                <Gift className="h-3.5 w-3.5" /> Sign up & get 10% off
              </span>
              <span className="text-white/40">✦</span>
              <span className="inline-flex items-center gap-2">
                <Shield className="h-3.5 w-3.5" /> Crafted in limited runs
              </span>
              <span className="text-white/40">✦</span>
            </div>
          ))}
        </motion.div>
      </div>
      
      <motion.nav
        variants={navVariants}
        initial="hidden"
        animate="visible"
        className={`sticky top-0 z-50 transition-all duration-500 ${
          scrolled
            ? "bg-white/95 backdrop-blur-xl shadow-2xl border-b border-gray-100"
            : "bg-white/80 backdrop-blur-md border-b border-gray-100/50"
        }`}
      >
        <div className="container px-4 mx-auto lg:px-6">
          {/* Top Header Row */}
          <div className="flex items-center justify-between py-2 md:py-3">
            {/* Mobile Menu Toggle */}
            <motion.button 
              whileTap={{ scale: 0.92 }}
              onClick={() => setIsMenuOpen(!isMenuOpen)} 
              className="p-1.5 -ml-1 rounded-full text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition md:hidden"
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </motion.button>
            
            {/* Premium Logo */}
            <motion.div 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate("/")} 
              className="flex items-center cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 blur-xl opacity-50 group-hover:opacity-75 transition-opacity"></div>
                  <div className="relative grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-gray-900 to-gray-700 shadow-xl">
                    <Flame className="w-5 h-5 text-white drop-shadow-sm" />
                  </div>
                </div>
                <div>
                  <span className="text-xl font-black tracking-tight bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                    FACTORY<span className="bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent">SALE</span>
                  </span>
                  <p className="text-[9px] text-gray-400 -mt-0.5 tracking-wider">OFFICIAL STORE</p>
                </div>
              </div>
            </motion.div>
            
            {/* Desktop Search Bar - Premium Design */}
            <div className="hidden md:flex justify-center flex-1 max-w-md mx-6">
              <motion.div
                ref={searchRef}
                className="relative w-full"
              >
                <form onSubmit={handleSearch} className="relative">
                  <Search className={`absolute w-4 h-4 transform -translate-y-1/2 left-4 top-1/2 transition-colors ${searchFocused ? 'text-red-500' : 'text-gray-400'}`} />
                  <input
                    type="text"
                    placeholder={placeholders[index]}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={handleSearchFocus}
                    className="w-full py-2.5 pl-10 pr-10 text-sm text-gray-700 placeholder-gray-400 bg-gray-50 border border-gray-200 rounded-full outline-none focus:border-red-400 focus:ring-2 focus:ring-red-400/30 transition-all"
                  />
                  <Mic className={`absolute w-4 h-4 transform -translate-y-1/2 cursor-pointer transition-colors right-4 top-1/2 ${searchFocused ? 'text-red-500' : 'text-gray-400 hover:text-red-500'}`} />
                </form>
                
                {/* Search Dropdown - Premium */}
                <AnimatePresence>
                  {showSearchDropdown && searchFocused && (
                    <motion.div
                      variants={dropdownVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      className="absolute left-0 right-0 z-50 mt-2 overflow-hidden bg-white border border-gray-200 rounded-xl shadow-2xl top-full max-h-96 overflow-y-auto"
                    >
                      {recentSearches.length > 0 && !searchQuery && (
                        <div className="p-4 border-b border-gray-100">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="text-xs font-semibold text-gray-500 flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-red-500" />
                              Recent
                            </h4>
                            <button onClick={() => dispatch(clearRecentSearches())} className="text-xs text-gray-400 hover:text-red-500 transition">Clear</button>
                          </div>
                          {recentSearches.map((search, idx) => (
                            <div key={idx} onClick={() => handleRecentSearchClick(search)} className="flex items-center justify-between p-2 rounded-lg cursor-pointer hover:bg-gray-50 transition group">
                              <div className="flex items-center gap-2">
                                <Clock className="w-3.5 h-3.5 text-gray-400" />
                                <span className="text-sm text-gray-700">{search}</span>
                              </div>
                              <Trash2 onClick={(e) => { e.stopPropagation(); dispatch(removeRecentSearch(search)) }} className="w-3.5 h-3.5 text-gray-400 hover:text-red-500 transition" />
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
                              <h4 className="text-xs font-semibold text-gray-500 mb-2 flex items-center gap-1.5">
                                <Tag className="w-3.5 h-3.5 text-red-500" />
                                Suggestions
                              </h4>
                              {suggestions.map((s, i) => (
                                <div key={i} onClick={() => handleSuggestionClick(s)} className="flex items-center gap-2 p-2 rounded-lg cursor-pointer hover:bg-gray-50 transition">
                                  <Search className="w-3.5 h-3.5 text-gray-400" />
                                  <span className="text-sm text-gray-700">{s}</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="py-6 text-sm text-center text-gray-400">No suggestions found</div>
                          )}
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </div>
            
            {/* Right Icons - Premium Design */}
            <div className="flex items-center gap-2 md:gap-3">
              {/* Wishlist */}
              <motion.div
                whileTap={{ scale: 0.92 }}
                onClick={() => navigate("/wishlist")}
                className="relative flex items-center gap-1 text-gray-600 cursor-pointer hover:text-red-500 transition-colors group"
              >
                <div className="p-1.5 rounded-full group-hover:bg-red-50 transition">
                  <Heart className="w-5 h-5" />
                </div>
                <span className="hidden text-sm font-medium md:inline">Wishlist</span>
                {wishlistCount > 0 && (
                  <motion.span
                    variants={badgeVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    className="absolute flex items-center justify-center w-5 h-5 text-[10px] font-bold text-white bg-gradient-to-r from-red-500 to-orange-500 rounded-full -top-1 -right-1.5 shadow-md"
                  >
                    {wishlistCount}
                  </motion.span>
                )}
              </motion.div>
              
              {/* Cart */}
              <motion.div
                whileTap={{ scale: 0.92 }}
                onClick={() => navigate("/cart")}
                className="relative flex items-center gap-1 text-gray-600 cursor-pointer hover:text-red-500 transition-colors group"
              >
                <div className="p-1.5 rounded-full group-hover:bg-red-50 transition">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <span className="hidden text-sm font-medium md:inline">Cart</span>
                {cartTotalQuantity > 0 && (
                  <motion.span
                    variants={badgeVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    className="absolute flex items-center justify-center w-5 h-5 text-[10px] font-bold text-white bg-gradient-to-r from-red-500 to-orange-500 rounded-full -top-1 -right-1.5 shadow-md"
                  >
                    {cartTotalQuantity}
                  </motion.span>
                )}
              </motion.div>
              
              {/* User Menu - Premium Dropdown */}
              <div className="relative hidden md:flex items-center" ref={userMenuRef}>
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={() => {
                    if (!token) navigate("/login")
                    else setShowUserMenu(!showUserMenu)
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition"
                >
                  <UserCircle className="w-5 h-5" />
                  <span className="text-sm font-medium">
                    {token ? user?.name?.split(" ")[0] || "Hi" : "Login"}
                  </span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showUserMenu ? 'rotate-180' : ''}`} />
                </motion.button>
                <AnimatePresence>
                  {showUserMenu && token && (
                    <motion.div
                      variants={dropdownVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      className="absolute right-0 z-50 w-56 mt-72 overflow-hidden bg-white border border-gray-200 rounded-xl shadow-2xl"
                    >
                      <div className="p-3 border-b border-gray-100">
                        <p className="text-sm font-semibold text-gray-900">{user?.name}</p>
                        <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                      </div>
                      <div className="p-2">
                        <NavMenuItem icon={<User className="w-4 h-4" />} label="My Profile" onClick={() => { navigate("/profile"); setShowUserMenu(false) }} />
                        <NavMenuItem icon={<ShoppingBag className="w-4 h-4" />} label="My Orders" onClick={() => { navigate("/orders"); setShowUserMenu(false) }} />
                        {user?.role === "admin" && (
                          <NavMenuItem icon={<TrendingUp className="w-4 h-4" />} label="Admin Dashboard" onClick={() => { navigate("/admin"); setShowUserMenu(false) }} />
                        )}
                        {user?.role === "digitalMarketer" && (
                          <NavMenuItem icon={<TrendingUp className="w-4 h-4" />} label="Marketer Dashboard" onClick={() => { navigate("/digitalMarketer"); setShowUserMenu(false) }} />
                        )}
                        <div className="h-px bg-gray-100 my-1" />
                        <NavMenuItem icon={<LogOut className="w-4 h-4" />} label="Logout" onClick={handleLogout} isDanger />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
          
          {/* Mobile Search Bar */}
          <div className={`py-1.5 md:hidden ${isProductDetailPage ? "hidden" : ""}`}>
            <motion.div ref={searchRef} className="relative">
              <form onSubmit={handleSearch}>
                <Search className={`absolute w-4 h-4 transform -translate-y-1/2 left-3 top-1/2 transition-colors ${searchFocused ? 'text-red-500' : 'text-gray-400'}`} />
                <input
                  type="text"
                  placeholder={placeholders[index]}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={handleSearchFocus}
                  className="w-full py-2 pl-9 pr-9 text-sm text-gray-700 placeholder-gray-400 bg-gray-50 border border-gray-200 rounded-full outline-none focus:border-red-400 focus:ring-1 focus:ring-red-400/30"
                />
                <Mic className={`absolute w-4 h-4 transform -translate-y-1/2 cursor-pointer transition-colors right-3 top-1/2 ${searchFocused ? 'text-red-500' : 'text-gray-400'}`} />
              </form>
              
              <AnimatePresence>
                {showSearchDropdown && searchFocused && (
                  <motion.div
                    variants={dropdownVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="absolute left-0 right-0 z-50 mt-1 overflow-hidden bg-white border border-gray-200 rounded-xl shadow-xl max-h-80 overflow-y-auto"
                  >
                    {recentSearches.length > 0 && !searchQuery && (
                      <div className="p-3">
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span>Recent</span>
                          <button onClick={() => dispatch(clearRecentSearches())} className="hover:text-red-500">Clear</button>
                        </div>
                        {recentSearches.map((s, idx) => (
                          <div key={idx} onClick={() => handleRecentSearchClick(s)} className="flex justify-between items-center p-2 text-sm text-gray-700">
                            <span>{s}</span>
                            <Trash2 onClick={(e) => { e.stopPropagation(); dispatch(removeRecentSearch(s)) }} className="w-3 h-3 text-gray-400" />
                          </div>
                        ))}
                      </div>
                    )}
                    {searchQuery && (
                      <div className="p-3">
                        {suggestionsLoading ? <div className="py-2 text-center">...</div> : suggestions.map((s, i) => (
                          <div key={i} onClick={() => handleSuggestionClick(s)} className="p-2 text-sm text-gray-700">{s}</div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
          
          {/* Desktop Category Navigation - Premium Underline */}
          {!isCartPage && (
            <div className="hidden md:flex items-center justify-center gap-8 py-2 border-t border-gray-100">
              {categories
                .filter(cat => !["anime-t-shirt", "ksauni-tshirts-styles"].includes(cat.slug))
                .map((cat) => (
                  <button
                    key={cat._id}
                    onClick={() => navigateToCategory(cat.slug)}
                    className="relative text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors pb-1 group"
                  >
                    {cat.name}
                    <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-red-500 to-orange-500 group-hover:w-full transition-all duration-300" />
                  </button>
                ))}
              <div
                onClick={navigateToUnder999}
                className="relative flex-shrink-0 text-sm font-medium text-red-600 transition-all duration-300 cursor-pointer group"
              >
                <Tag className="inline w-3 h-3 mr-1" />
                Under ₹999
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-red-500 to-orange-500 transition-all duration-300 group-hover:w-full"></span>
              </div>
            </div>
          )}
          
          {/* Mobile Horizontal Scroll - Premium Design */}
          {!isProductDetailPage && !isCartPage && (
            <div className="flex gap-5 py-2 overflow-x-auto border-t border-gray-100 md:hidden scrollbar-hide">
              {categoriesForMobileScroll.map((cat) => (
                <div
                  key={cat._id}
                  onClick={() => cat._id === "cyd-promo" ? navigateToUnder999() : navigateToCategory(cat.slug)}
                  className="flex flex-col items-center flex-shrink-0 cursor-pointer group"
                >
                  <div className="w-14 h-14 rounded-full bg-gray-100 border-2 border-red-200 group-hover:border-red-500 overflow-hidden shadow-md transition-all group-hover:shadow-lg">
                    <img src={cat.image?.url || "/placeholder.svg"} alt={cat.name} className="w-full h-full object-cover" />
                  </div>
                  <span className="text-[10px] font-medium text-gray-600 mt-1.5 group-hover:text-red-500 transition">{cat.name}</span>
                </div>
              ))}
            </div>
          )}
          
          {/* Mobile Menu Panel - Premium Design */}
          <AnimatePresence>
            {isMenuOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="md:hidden overflow-hidden bg-white border-t border-gray-100"
              >
                <div className="flex flex-col py-2 space-y-0.5">
                  {categories.filter(cat => !["anime-t-shirt", "ksauni-tshirts-styles"].includes(cat.slug)).map(cat => (
                    <div key={cat._id} onClick={() => { navigateToCategory(cat.slug); setIsMenuOpen(false) }} className="py-3 px-4 text-gray-600 border-b border-gray-100 cursor-pointer hover:text-red-500 hover:bg-gray-50 transition">
                      {cat.name}
                    </div>
                  ))}
                  <div onClick={() => { navigate("/wishlist"); setIsMenuOpen(false) }} className="flex items-center gap-3 py-3 px-4 text-gray-600 border-b border-gray-100 cursor-pointer hover:text-red-500 hover:bg-gray-50 transition">
                    <Heart className="w-4 h-4" /> Wishlist
                  </div>
                  <div onClick={() => { navigate("/cart"); setIsMenuOpen(false) }} className="flex items-center gap-3 py-3 px-4 text-gray-600 border-b border-gray-100 cursor-pointer hover:text-red-500 hover:bg-gray-50 transition">
                    <ShoppingBag className="w-4 h-4" /> Cart
                  </div>
                  <div onClick={() => { if (!token) navigate("/login"); else setShowUserMenu(!showUserMenu); setIsMenuOpen(false) }} className="flex items-center gap-3 py-3 px-4 text-gray-600 border-b border-gray-100 cursor-pointer hover:text-red-500 hover:bg-gray-50 transition">
                    <User className="w-4 h-4" /> {token ? user?.name || "Profile" : "Login"}
                  </div>
                  {token && (
                    <div onClick={() => { handleLogout(); setIsMenuOpen(false) }} className="flex items-center gap-3 py-3 px-4 text-red-600 border-b border-gray-100 cursor-pointer hover:bg-red-50 transition">
                      <LogOut className="w-4 h-4" /> Logout
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.nav>
      
      {/* Bottom Navigation Bar for Mobile - Premium Design */}
      {!isProductDetailPage && !isCartPage && (
        <div className="fixed bottom-0 left-0 right-0 z-50 grid grid-cols-4 gap-0 py-2 bg-white border-t border-gray-200 shadow-lg md:hidden">
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

// NavMenuItem component for user dropdown
const NavMenuItem = ({ icon, label, onClick, isDanger }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-all ${
      isDanger 
        ? "text-red-600 hover:bg-red-50" 
        : "text-gray-700 hover:bg-gray-100"
    }`}
  >
    {icon}
    <span>{label}</span>
  </button>
)

export default Navbar