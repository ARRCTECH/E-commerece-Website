"use client"

import { useSelector } from "react-redux"
import { Link } from "react-router-dom"
import {
  Facebook,
  Instagram,
  Youtube,
  Mail,
  Phone,
  MapPin,
} from "lucide-react"

import { FaPinterest } from "react-icons/fa"

const Footer = () => {
  const { categories } = useSelector((state) => state.categories || {})

  return (
    <footer className="bg-gray-900 text-white py-10 px-6 md:px-12 lg:px-20">
      <div className="max-w-7xl mx-auto space-y-10">
        
        {/* ================= Company Info ================= */}
        <div className="text-center lg:text-left space-y-3">
          <img
            src="/logo1.png"
            alt="Ksauni Bliss Logo"
            className="w-28 h-auto mx-auto lg:mx-0"
          />

          <p className="text-xs sm:text-sm leading-relaxed max-w-md mx-auto lg:mx-0 text-gray-300">
            Factory Sale  is your one-stop destination for trendy and affordable
            fashion. Discover the latest styles and express your unique
            personality with us.
          </p>

          {/* Social Icons */}
          <div className="flex justify-center lg:justify-start space-x-4 mt-4">
            <a
              href="https://www.facebook.com/people/Factory-sale/61568941858515/?mibextid=ZbWKwL"
              target="_blank"
              rel="noreferrer"
              className="hover:text-red-400 transition"
            >
              <Facebook className="w-5 h-5" />
            </a>

            <a
              href="https://www.instagram.com/factorysaleusa?utm_source=qr&igsh=Nm9uNnFjdjhqNnBm"
              target="_blank"
              rel="noreferrer"
              className="hover:text-red-400 transition"
            >
              <Instagram className="w-5 h-5" />
            </a>

            <a
              href="https://www.youtube.com/@factorysale-r5n"
              target="_blank"
              rel="noreferrer"
              className="hover:text-red-400 transition"
            >
              <Youtube className="w-5 h-5" />
            </a>

            <a
              href="https://in.pinterest.com/ksaunibliss0051/?actingBusinessId=1092545328261126096"
              target="_blank"
              rel="noreferrer"
              className="hover:text-red-400 transition"
            >
<FaPinterest className="w-5 h-5" />
            </a>
          </div>
        </div>

        {/* ================= Links Section ================= */}
        <div className="grid grid-cols-3 gap-6 text-center sm:text-left">
          
          {/* Categories */}
          <div className="space-y-3">
            <h3 className="text-sm sm:text-base font-semibold">
              Categories
            </h3>

            <ul className="space-y-2 text-xs sm:text-sm text-gray-300">
              {categories?.length > 0 ? (
                categories.slice(0, 6).map((cat) => (
                  <li key={cat._id}>
                    <Link
                      to={`/products?category=${cat.slug}`}
                      className="hover:text-red-400 transition-colors"
                    >
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
          <div className="space-y-3">
            <h3 className="text-sm sm:text-base font-semibold">
              Quick Links
            </h3>

            <ul className="space-y-2 text-xs sm:text-sm text-gray-300">
              <li>
                <Link
                  to="/about"
                  className="hover:text-red-400 transition-colors"
                >
                  About Us
                </Link>
              </li>
              <li>
                <Link
                  to="/contact"
                  className="hover:text-red-400 transition-colors"
                >
                  Contact
                </Link>
              </li>
              <li>
                <Link
                  to="/shipping"
                  className="hover:text-red-400 transition-colors"
                >
                  Shipping Info
                </Link>
              </li>
              <li>
                <Link
                  to="/returns"
                  className="hover:text-red-400 transition-colors"
                >
                  Returns
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="space-y-3">
            <h3 className="text-sm sm:text-base font-semibold">
              Contact Us
            </h3>

            <ul className="space-y-3 text-xs sm:text-sm text-gray-300">
              <li className="flex justify-center sm:justify-start items-center space-x-2">
                <MapPin className="w-8 h-8 text-red-400" />
                <span>SHOP NO 1 OM SAI GANESH KRIPA CHAWL NEAR CHIRAG HOTEL,NEAR BASANT BAHAR ROAD ULHASNAGR 421095</span>
              </li>

              <li className="flex justify-center sm:justify-start items-center space-x-2">
                <Phone className="w-4 h-4 text-red-400" />
                <span>8369517095</span>
              </li>

              <li className="flex justify-center sm:justify-start items-center space-x-2">
                <Mail className="w-4 h-4 text-red-400" />
                <span>factorysaleusadata@gmail.com</span>
              </li>
            </ul>
          </div>
        </div>

        {/* ================= Bottom Bar ================= */}
        <div className="border-t border-gray-700 pt-5 text-center text-xs sm:text-sm text-gray-400">
          © {new Date().getFullYear()} Factory Sale . All rights reserved.
        </div>
      </div>
    </footer>
  )
}

export default Footer
