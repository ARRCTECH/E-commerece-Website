"use client";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
const CouponBanner = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
      className="relative flex items-center justify-between p-6 mt-4 bg-red-400 rounded-lg shadow-lg border_2 border_yellow_500 overflow-hidden" // Golden border
    >
      <div className="flex flex-col text-white">
        <h3 className="text-lg font-bold sm:text-xl md:text-2xl">FLAT ₹ 100 OFF</h3>
        <p className="text-sm sm:text-base">ON YOUR FIRST ORDER</p>
      </div>
      <div className="flex items-center space-x-2">
        <div className="px-4 py-2 text-white  bg-red-400 rounded-md font-bold text-sm sm:text-base shadow-md">
          USE CODE <span className="block text-center text-lg sm:text-xl">FLAT100</span>
        </div>
        <img
          src="/images/coupon-graphic.png"
          alt="Coupon Graphic"
          className="w-12 h-12 sm:w-14 sm:h-14 object-contain transition-transform duration-300 transform hover:scale-110" // Added hover effect
        />
      </div>
      <Link to="/products?coupon=flat100" className="absolute inset-0" aria-label="Apply coupon"></Link>
    </motion.div>
  );
};
export default CouponBanner;