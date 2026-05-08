"use client"
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Menu, X, Search, ShoppingBag, User, Heart 
} from "lucide-react"

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const navigate = useNavigate()

  const mainCategories = ["Men", "Women", "Accessories", "New Arrivals", "Deals"]

  return (
    <nav className="sticky top-0 z-50 w-full bg-gray-900 border-b border-gray-800 shadow-2xl">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="flex items-center justify-between h-24 gap-4"> {/* Increased height to h-24 to accommodate larger logo */}
          
          {/* --- LOGO SECTION --- */}
          <div className="flex items-center gap-10">
            <div 
              onClick={() => navigate("/")} 
              className="cursor-pointer transition-transform hover:scale-105 active:scale-95"
            >
              <img 
                src="/logo1.png" 
                alt="Store Logo" 
                // Increased h-12 to h-16 or h-20 depending on your image aspect ratio
                className="h-16 md:h-20 w-auto object-contain brightness-110 drop-shadow-[0_0_10px_rgba(255,255,255,0.15)]" 
              />
            </div>

            {/* Navigation Links */}
            <div className="hidden xl:flex items-center gap-8">
              {mainCategories.map((item) => (
                <button 
                  key={item}
                  className="text-gray-400 hover:text-red-500 text-sm font-bold transition-all uppercase tracking-widest border-b-2 border-transparent hover:border-red-500 pb-1"
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          {/* Search Bar */}
          <div className="hidden md:flex flex-1 max-w-md relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="text-gray-500 group-focus-within:text-red-500 transition-colors" size={18} />
            </div>
            <input
              type="text"
              placeholder="Search for styles..."
              className="w-full bg-gray-800/40 text-gray-100 border border-gray-700 py-3 pl-12 pr-4 rounded-xl text-sm focus:ring-2 focus:ring-red-500/40 focus:border-red-500/50 outline-none transition-all"
            />
          </div>

          {/* Icons */}
          <div className="flex items-center gap-2 md:gap-6">
            <button className="p-3 text-gray-400 hover:text-white hover:bg-gray-800 rounded-2xl transition-all">
              <Heart size={24} />
            </button>
            
            <div className="relative cursor-pointer group" onClick={() => navigate("/cart")}>
              <div className="p-3 text-gray-400 group-hover:text-white group-hover:bg-gray-800 rounded-2xl transition-all">
                <ShoppingBag size={24} />
              </div>
              <span className="absolute top-1 right-1 bg-red-600 text-white text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full ring-4 ring-gray-900">
                2
              </span>
            </div>

            <button className="hidden lg:flex items-center gap-2 bg-white text-gray-900 px-6 py-3 rounded-xl transition-all font-bold text-sm hover:bg-red-600 hover:text-white">
              <User size={18} />
              <span>Sign In</span>
            </button>

            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 lg:hidden text-gray-400">
              <Menu size={30} />
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar