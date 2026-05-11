"use client";

import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import {
  Facebook,
  Instagram,
  Youtube,
  Mail,
  Phone,
  MapPin,
} from "lucide-react";
import { FaPinterest } from "react-icons/fa";

const Footer = () => {
  const { categories } = useSelector((state) => state.categories || {});

  return (
    <footer className="bg-gray-900 text-white py-4 px-6 md:px-12 lg:px-20">
      <div className="max-w-7xl mx-auto space-y-3">
        {/* ================= Row layout on md+ ================= */}
        <div className="flex flex-col md:flex-row md:justify-between md:gap-8 space-y-6 md:space-y-0">
          {/* Company Info - left side on desktop */}
          <div className="md:w-1/3 text-center md:text-left space-y-1">
            <img
              src="/logo.webp"
              alt="Ksauni Bliss Logo"
              className="w-24 h-auto mx-auto md:mx-0"
            />
            <p className="text-[11px] sm:text-xs leading-relaxed text-gray-300 max-w-xs mx-auto md:mx-0">
              Ksauni Bliss – trendy & affordable fashion.
            </p>
            {/* Social Icons */}
            <div className="flex justify-center md:justify-start space-x-3 mt-1">
              <a href="https://facebook.com" target="_blank" rel="noreferrer" className="hover:text-red-400 transition">
                <Facebook className="w-4 h-4" />
              </a>
              <a href="https://instagram.com" target="_blank" rel="noreferrer" className="hover:text-red-400 transition">
                <Instagram className="w-4 h-4" />
              </a>
              <a href="https://youtube.com/@Factory Sale?si=wDSr5h_upC5gfIWC" target="_blank" rel="noreferrer" className="hover:text-red-400 transition">
                <Youtube className="w-4 h-4" />
              </a>
              <a href="https://in.pinterest.com/Factory Sale0051/" target="_blank" rel="noreferrer" className="hover:text-red-400 transition">
                <FaPinterest className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Links Grid - right side on desktop */}
          <div className="grid grid-cols-3 gap-4 text-center md:text-left md:flex-1">
            {/* Categories */}
            <div className="space-y-1">
              <h3 className="text-xs sm:text-sm font-semibold">Categories</h3>
              <ul className="space-y-1 text-[11px] sm:text-xs text-gray-300">
                {categories?.length > 0 ? (
                  categories.slice(0, 6).map((cat) => (
                    <li key={cat._id}>
                      <Link to={`/products?category=${cat.slug}`} className="hover:text-red-400 transition-colors">
                        {cat.name}
                      </Link>
                    </li>
                  ))
                ) : (
                  <li className="text-gray-500">Loading...</li>
                )}
              </ul>
            </div>

            {/* Quick Links */}
            <div className="space-y-1">
              <h3 className="text-xs sm:text-sm font-semibold">Quick Links</h3>
              <ul className="space-y-1 text-[11px] sm:text-xs text-gray-300">
                <li><Link to="/about" className="hover:text-red-400">About Us</Link></li>
                <li><Link to="/contact" className="hover:text-red-400">Contact</Link></li>
                <li><Link to="/shipping" className="hover:text-red-400">Shipping Info</Link></li>
                <li><Link to="/returns" className="hover:text-red-400">Returns</Link></li>
              </ul>
            </div>

            {/* Contact Info */}
            <div className="space-y-1">
              <h3 className="text-xs sm:text-sm font-semibold">Contact Us</h3>
              <ul className="space-y-2 text-[11px] sm:text-xs text-gray-300">
                <li className="flex justify-center md:justify-start items-center space-x-1">
                  <MapPin className="w-3 h-3 text-red-400" />
                  <span>Delhi, India</span>
                </li>
                <li className="flex justify-center md:justify-start items-center space-x-1">
                  <Phone className="w-3 h-3 text-red-400" />
                  <span>9211891719</span>
                </li>
                <li className="flex justify-center md:justify-start items-center space-x-1">
                  <Mail className="w-3 h-3 text-red-400" />
                  <span>support@Factory Sale.com</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* ================= Bottom Bar ================= */}
        <div className="border-t border-gray-700 pt-2 text-center text-[10px] sm:text-xs text-gray-400">
          © {new Date().getFullYear()} Ksauni Bliss. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;