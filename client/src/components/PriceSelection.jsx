"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { ArrowRight } from "lucide-react";
// Redux
import { setFilters } from "../store/slices/productSlice";

const PriceSelection = ({ selectedPrice }) => {
  const [selectedOption, setSelectedOption] = useState(selectedPrice || null);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const priceOptions = [
    { id: "under649", label: "UNDER", sublabel: "₹649", value: 649 },
    { id: "under799", label: "UNDER", sublabel: "₹799", value: 799 },
    { id: "under999", label: "UNDER", sublabel: "₹999", value: 999 },
    { id: "under1499", label: "UNDER", sublabel: "₹1499", value: 1499 },
  ];

  const handleOptionClick = (option) => {
    setSelectedOption(option.id);
    // ✅ Update global Redux filters
    dispatch(
      setFilters({
        minPrice: "", // reset min
        maxPrice: option.value,
      })
    );
    // ✅ Navigate with query param for persistence
    navigate(`/products?maxPrice=${option.value}`);
  };

  return (
    <section className="relative w-full mt-4 px-2 sm:px-4 md:px-6 lg:px-8 xl:px-12 2xl:px-16">
      {/* ✅ Limit width only on extra-large screens (like PromoBanners) */}
      <div
        className="relative w-full mx-auto"
        style={{
          maxWidth: "1600px", // only affects xl+ screens
        }}
      >
        {/* Header */}
        <div className="mb-2 text-center">
          <h3 className="text-xl italic font-black sm:text-2xl md:text-3xl uppercase">
            <span className="text-red-600">PRICE</span>{" "}
            <span className="text-black">SELECTION</span>
          </h3>
          <p className="text-sm text-gray-600 sm:text-base">
            Styles ab Budget mee
          </p>
        </div>

        {/* Price Options */}
        <div className="grid grid-cols-4 gap-3 sm:gap-6">
          {priceOptions.map((option) => (
            <motion.button
              key={option.id}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleOptionClick(option)}
              className={`relative w-full text-xl cursor-pointer transition-all duration-300 ${
                selectedOption === option.id ? "ring-4 ring-red-800" : ""
              }`}
            >
              <div className="relative bg-red-600 text-white aspect-[4/5] flex flex-col items-center justify-center font-black text-center overflow-hidden hover:bg-red-700 transition-colors rounded-xl shadow-md">
                {/* White border inside */}
                <div className="absolute inset-[6%] border-2 border-white rounded-xl z-10"></div>

                {/* Zigzag Left */}
                <div className="absolute inset-y-0 left-0 w-3 overflow-hidden z-0">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 10 100"
                    preserveAspectRatio="none"
                    className="h-full w-full fill-white opacity-40"
                  >
                    <path d="M0 0 L10 10 L0 20 L10 30 L0 40 L10 50 L0 60 L10 70 L0 80 L10 90 L0 100 Z" />
                  </svg>
                </div>

                {/* Zigzag Right */}
                <div className="absolute inset-y-0 right-0 w-3 overflow-hidden z-0">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 10 100"
                    preserveAspectRatio="none"
                    className="h-full w-full fill-white opacity-40"
                  >
                    <path d="M10 0 L0 10 L10 20 L0 30 L10 40 L0 50 L10 60 L0 70 L10 80 L0 90 L10 100 Z" />
                  </svg>
                </div>

                {/* Content */}
                <div className="z-20">
                  <div className="mb-1 text-sm sm:text-lg md:text-2xl font-semibold leading-tight uppercase">
                    {option.label}
                  </div>
                  <div className="mb-1 text-[20px] sm:text-base md:text-lg font-small">
                    {option.sublabel}
                  </div>
                  <div className="flex items-center justify-center w-5 h-5 bg-white rounded-full sm:w-6 sm:h-6 mx-auto">
                    <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 text-red-800" />
                  </div>
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PriceSelection;
