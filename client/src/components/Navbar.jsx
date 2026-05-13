"use client"
import { useState, useEffect, useRef } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { useSelector, useDispatch } from "react-redux"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Menu, X, ChevronDown, Search, ShoppingBag, User, Heart, Mic, 
  Clock, Trash2, Shirt, Flame, LogOut, UserCircle, Tag, TrendingUp, Home, Sparkles 
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
  
  // Animation variants
  const navVariants = {
    hidden: { y: -100, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.4, ease: "easeOut" } }
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
      <motion.nav
        variants={navVariants}
        initial="hidden"
        animate="visible"
        className="sticky top-0 z-50 bg-slate-900 border-b border-red-500/20 shadow-xl"
      >
        <div className="container px-4 mx-auto lg:px-6">
          {/* Top Header Row */}
          <div className="flex items-center justify-between py-2 md:py-3">
            {/* Mobile Menu Toggle */}
            <motion.button 
              whileTap={{ scale: 0.92 }}
              onClick={() => setIsMenuOpen(!isMenuOpen)} 
              className="p-1.5 -ml-1 rounded-full text-gray-300 hover:text-white hover:bg-red-500/20 transition md:hidden"
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </motion.button>
            
            {/* Logo - Bold Red */}
            <motion.div 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate("/")} 
              className="flex items-center cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <div className="relative flex items-center justify-center w-9 h-9 bg-gradient-to-br from-red-500 to-red-700 rounded-full shadow-lg shadow-red-500/30 overflow-hidden">
                  <Flame className="w-5 h-5 text-white drop-shadow-sm" />
                  <div className="absolute inset-0 bg-white/10 animate-pulse" />
                </div>
                <div>
                  <span className="text-xl font-black tracking-tight text-white">
                    FACTORY<span className="text-red-500">SALE</span>
                  </span>
                  <p className="text-[9px] text-gray-400 -mt-0.5 tracking-wider">OFFICIAL STORE</p>
                </div>
              </div>
            </motion.div>
            
            {/* Desktop Search Bar - Rounded Pill with Red Focus */}
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
                    className="w-full py-2 pl-10 pr-10 text-sm text-white placeholder-gray-400 bg-slate-800 border border-gray-700 rounded-full outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/30 transition-all"
                  />
                  <Mic className={`absolute w-4 h-4 transform -translate-y-1/2 cursor-pointer transition-colors right-4 top-1/2 ${searchFocused ? 'text-red-500' : 'text-gray-400 hover:text-red-500'}`} />
                </form>
                
                {/* Search Dropdown */}
                <AnimatePresence>
                  {showSearchDropdown && searchFocused && (
                    <motion.div
                      variants={dropdownVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      className="absolute left-0 right-0 z-50 mt-2 overflow-hidden bg-slate-800 border border-gray-700 rounded-xl shadow-2xl top-full max-h-96 overflow-y-auto"
                    >
                      {recentSearches.length > 0 && !searchQuery && (
                        <div className="p-4 border-b border-gray-700">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="text-xs font-semibold text-gray-300 flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-red-500" />
                              Recent
                            </h4>
                            <button onClick={() => dispatch(clearRecentSearches())} className="text-xs text-gray-400 hover:text-red-500">Clear</button>
                          </div>
                          {recentSearches.map((search, idx) => (
                            <div key={idx} onClick={() => handleRecentSearchClick(search)} className="flex items-center justify-between p-2 rounded-lg cursor-pointer hover:bg-slate-700/50 group">
                              <div className="flex items-center gap-2">
                                <Clock className="w-3.5 h-3.5 text-gray-500" />
                                <span className="text-sm text-gray-200">{search}</span>
                              </div>
                              <Trash2 onClick={(e) => { e.stopPropagation(); dispatch(removeRecentSearch(search)) }} className="w-3.5 h-3.5 text-gray-500 hover:text-red-500" />
                            </div>
                          ))}
                        </div>
                      )}
                      {searchQuery && (
                        <div className="p-4">
                          {suggestionsLoading ? (
                            <div className="flex justify-center py-6"><div className="w-5 h-5 border-2 border-gray-600 border-t-red-500 rounded-full animate-spin" /></div>
                          ) : suggestions.length > 0 ? (
                            <div>
                              <h4 className="text-xs font-semibold text-gray-300 mb-2 flex items-center gap-1.5">
                                <Tag className="w-3.5 h-3.5 text-red-500" />
                                Suggestions
                              </h4>
                              {suggestions.map((s, i) => (
                                <div key={i} onClick={() => handleSuggestionClick(s)} className="flex items-center gap-2 p-2 rounded-lg cursor-pointer hover:bg-slate-700/50">
                                  <Search className="w-3.5 h-3.5 text-gray-500" />
                                  <span className="text-sm text-gray-200">{s}</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="py-6 text-sm text-center text-gray-400">No suggestions</div>
                          )}
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </div>
            
            {/* Right Icons - Red Accents */}
            <div className="flex items-center gap-3 md:gap-5">
              {/* Wishlist */}
              <motion.div
                whileTap={{ scale: 0.92 }}
                onClick={() => navigate("/wishlist")}
                className="relative flex items-center gap-1 text-gray-300 cursor-pointer hover:text-red-500 transition-colors group"
              >
                <div className="p-1.5 rounded-full group-hover:bg-red-500/10 transition">
                  <Heart className="w-5 h-5" />
                </div>
                <span className="hidden text-sm font-medium md:inline">Wishlist</span>
                {wishlistCount > 0 && (
                  <motion.span
                    variants={badgeVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    className="absolute flex items-center justify-center w-5 h-5 text-[10px] font-bold text-white bg-red-500 rounded-full -top-1 -right-1.5 shadow-md"
                  >
                    {wishlistCount}
                  </motion.span>
                )}
              </motion.div>
              
              {/* Cart */}
              <motion.div
                whileTap={{ scale: 0.92 }}
                onClick={() => navigate("/cart")}
                className="relative flex items-center gap-1 text-gray-300 cursor-pointer hover:text-red-500 transition-colors group"
              >
                <div className="p-1.5 rounded-full group-hover:bg-red-500/10 transition">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <span className="hidden text-sm font-medium md:inline">Cart</span>
                {cartTotalQuantity > 0 && (
                  <motion.span
                    variants={badgeVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    className="absolute flex items-center justify-center w-5 h-5 text-[10px] font-bold text-white bg-red-500 rounded-full -top-1 -right-1.5 shadow-md"
                  >
                    {cartTotalQuantity}
                  </motion.span>
                )}
              </motion.div>
              
              {/* User Menu - Red Dropdown */}
              <div className="relative hidden md:flex items-center" ref={userMenuRef}>
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={() => {
                    if (!token) navigate("/login")
                    else setShowUserMenu(!showUserMenu)
                  }}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-gray-300 hover:text-white hover:bg-red-500/10 transition"
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
                      className="absolute right-0 z-50 w-56 mt-72 overflow-hidden bg-slate-800 border border-gray-700 rounded-xl shadow-2xl"
                    >
                      <div className="p-3 border-b border-gray-700">
                        <p className="text-sm font-semibold text-white">{user?.name}</p>
                        <p className="text-xs text-gray-400 truncate">{user?.email}</p>
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
                        <div className="h-px bg-gray-700 my-1" />
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
                  className="w-full py-2 pl-9 pr-9 text-sm text-white placeholder-gray-400 bg-slate-800 border border-gray-700 rounded-full outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/30"
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
                    className="absolute left-0 right-0 z-50 mt-1 overflow-hidden bg-slate-800 border border-gray-700 rounded-xl shadow-xl max-h-80 overflow-y-auto"
                  >
                    {/* Same dropdown content as desktop */}
                    {recentSearches.length > 0 && !searchQuery && (
                      <div className="p-3">
                        <div className="flex justify-between text-xs text-gray-400 mb-1">
                          <span>Recent</span>
                          <button onClick={() => dispatch(clearRecentSearches())} className="hover:text-red-500">Clear</button>
                        </div>
                        {recentSearches.map((s, idx) => (
                          <div key={idx} onClick={() => handleRecentSearchClick(s)} className="flex justify-between items-center p-2 text-sm text-gray-200">
                            <span>{s}</span>
                            <Trash2 onClick={(e) => { e.stopPropagation(); dispatch(removeRecentSearch(s)) }} className="w-3 h-3 text-gray-500" />
                          </div>
                        ))}
                      </div>
                    )}
                    {searchQuery && (
                      <div className="p-3">
                        {suggestionsLoading ? <div className="py-2 text-center">...</div> : suggestions.map((s, i) => (
                          <div key={i} onClick={() => handleSuggestionClick(s)} className="p-2 text-sm text-gray-200">{s}</div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
          
          {/* Desktop Category Navigation - Red underline */}
          {!isCartPage && (
            <div className="hidden md:flex items-center justify-center gap-8 py-2 border-t border-gray-800">
              {categories
                .filter(cat => !["anime-t-shirt", "ksauni-tshirts-styles"].includes(cat.slug))
                .map((cat) => (
                  <button
                    key={cat._id}
                    onClick={() => navigateToCategory(cat.slug)}
                    className="relative text-sm font-medium text-gray-300 hover:text-white transition-colors pb-1 group"
                  >
                    {cat.name}
                    <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-red-500 group-hover:w-full transition-all duration-300" />
                  </button>
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
          
          {/* Mobile Horizontal Scroll - Red bordered circles */}
          {!isProductDetailPage && !isCartPage && (
            <div className="flex gap-5 py-2 overflow-x-auto border-t border-gray-800 md:hidden scrollbar-hide">
              {categoriesForMobileScroll.map((cat) => (
                <div
                  key={cat._id}
                  onClick={() => cat._id === "cyd-promo" ? navigateToUnder999() : navigateToCategory(cat.slug)}
                  className="flex flex-col items-center flex-shrink-0 cursor-pointer group"
                >
                  <div className="w-14 h-14 rounded-full bg-slate-800 border-2 border-red-500/30 group-hover:border-red-500 overflow-hidden shadow-lg transition-all">
                    <img src={cat.image?.url || "/placeholder.svg"} alt={cat.name} className="w-full h-full object-cover" />
                  </div>
                  <span className="text-[10px] font-medium text-gray-300 mt-1.5 group-hover:text-red-500 transition">{cat.name}</span>
                </div>
              ))}
            </div>
          )}
          
          {/* Mobile Menu Panel - Dark theme with red accents */}
          <AnimatePresence>
            {isMenuOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="md:hidden overflow-hidden bg-slate-900 border-t border-gray-800"
              >
                <div className="flex flex-col py-2 space-y-0.5">
                  {categories.filter(cat => !["anime-t-shirt", "ksauni-tshirts-styles"].includes(cat.slug)).map(cat => (
                    <div key={cat._id} onClick={() => { navigateToCategory(cat.slug); setIsMenuOpen(false) }} className="py-3 px-4 text-gray-300 border-b border-gray-800 cursor-pointer hover:text-red-500 hover:bg-slate-800 transition">
                      {cat.name}
                    </div>
                  ))}
                  <div onClick={() => { navigate("/wishlist"); setIsMenuOpen(false) }} className="flex items-center gap-3 py-3 px-4 text-gray-300 border-b border-gray-800 cursor-pointer hover:text-red-500 hover:bg-slate-800 transition">
                    <Heart className="w-4 h-4" /> Wishlist
                  </div>
                  <div onClick={() => { navigate("/cart"); setIsMenuOpen(false) }} className="flex items-center gap-3 py-3 px-4 text-gray-300 border-b border-gray-800 cursor-pointer hover:text-red-500 hover:bg-slate-800 transition">
                    <ShoppingBag className="w-4 h-4" /> Cart
                  </div>
                  <div onClick={() => { if (!token) navigate("/login"); else setShowUserMenu(!showUserMenu); setIsMenuOpen(false) }} className="flex items-center gap-3 py-3 px-4 text-gray-300 border-b border-gray-800 cursor-pointer hover:text-red-500 hover:bg-slate-800 transition">
                    <User className="w-4 h-4" /> {token ? user?.name || "Profile" : "Login"}
                  </div>
                  {token && (
                    <div onClick={() => { handleLogout(); setIsMenuOpen(false) }} className="flex items-center gap-3 py-3 px-4 text-red-400 border-b border-gray-800 cursor-pointer hover:bg-red-500/10 transition">
                      <LogOut className="w-4 h-4" /> Logout
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.nav>
      
      {/* Mobile Bottom Navigation - Dark with red active state */}
      {!isProductDetailPage && !isCartPage && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-slate-900 border-t border-red-500/30 shadow-2xl md:hidden">
          <div className="flex justify-around py-1.5">
            <BottomNavItem icon={<Home className="w-5 h-5" />} label="Home" onClick={() => navigate("/")} isActive={location.pathname === "/"} />
            <BottomNavItem icon={<img src="/cydlogo.jpeg" alt="CYD" className="w-5 h-5 rounded-full object-cover" />} label="Under ₹999" onClick={navigateToUnder999} />
            <BottomNavItem icon={<Shirt className="w-5 h-5" />} label="T-Shirts" onClick={() => navigate("/products")} />
            <BottomNavItem icon={<User className="w-5 h-5" />} label="Profile" onClick={() => token ? navigate("/profile") : navigate("/login")} />
          </div>
        </div>
      )}
    </>
  )
}

// Helper Components
const NavMenuItem = ({ icon, label, onClick, isDanger = false }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-3 w-full px-3 py-2 text-sm text-left rounded-lg transition-colors ${
      isDanger ? 'text-red-400 hover:bg-red-500/10' : 'text-gray-300 hover:bg-slate-700/50'
    }`}
  >
    {icon}
    <span>{label}</span>
  </button>
)

const BottomNavItem = ({ icon, label, onClick, isActive = false }) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center py-1.5 transition-colors ${
      isActive ? 'text-red-500' : 'text-gray-400 hover:text-red-500'
    }`}
  >
    {icon}
    <span className="text-[10px] font-medium mt-0.5">{label}</span>
  </button>
)

export default Navbar