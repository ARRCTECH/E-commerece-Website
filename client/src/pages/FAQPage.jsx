"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  ChevronDown,
  HelpCircle,
  Package,
  CreditCard,
  Truck,
  RotateCcw,
  Shield,
  MessageCircle,
} from "lucide-react";

const FAQPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [openItems, setOpenItems] = useState(new Set());

  const categories = [
    { id: "all", label: "All Questions", icon: HelpCircle },
    { id: "orders", label: "Orders & Shipping", icon: Package },
    { id: "payments", label: "Payments", icon: CreditCard },
    { id: "delivery", label: "Delivery", icon: Truck },
    { id: "returns", label: "Returns & Exchanges", icon: RotateCcw },
    { id: "account", label: "Account & Security", icon: Shield },
  ];

  // Sirf aapke 6 questions - kuch extra nahi
  const faqData = [
    {
      category: "orders",
      question: "Is COD available?",
      answer: "Yes, COD is available with 50% advance payment.",
    },
    {
      category: "orders",
      question: "Is video call available for product consultation?",
      answer: "Yes, video call is available if our agent is free.",
    },
    {
      category: "orders",
      question: "Can I visit your physical store/shop?",
      answer: "Yes, you can visit our store at the given address on our website.",
    },
    {
      category: "payments",
      question: "Is there any discount on prepaid orders?",
      answer: "Yes, you will get special discounts on prepaid orders.",
    },
    {
      category: "delivery",
      question: "How many days will delivery take?",
      answer: "Within Maharashtra, delivery mostly takes 2-3 days. Outside Maharashtra, delivery will take 5-7 days.",
    },
    {
      category: "returns",
      question: "What is your return policy?",
      answer: "Our return policy has been described in the shipping info section. Please refer to the shipping information page for complete details.",
    },
  ];

  const toggleItem = (index) => {
    const newOpenItems = new Set(openItems);
    if (newOpenItems.has(index)) {
      newOpenItems.delete(index);
    } else {
      newOpenItems.add(index);
    }
    setOpenItems(newOpenItems);
  };

  const filteredFAQs = faqData.filter((faq) => {
    const matchesCategory = activeCategory === "all" || faq.category === activeCategory;
    const matchesSearch =
      searchQuery === "" ||
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="py-16 bg-gradient-to-br from-red-50 to-red-50">
        <div className="container px-4 mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-3xl mx-auto text-center"
          >
            <h1 className="mb-6 text-4xl font-bold text-gray-800 md:text-5xl">
              Frequently Asked <span className="text-red-500">Questions</span>
            </h1>
            <p className="mb-8 text-xl text-gray-600">
              Find answers to common questions about shopping, orders, delivery, and more
            </p>
            {/* Search Bar */}
            <div className="relative max-w-2xl mx-auto">
              <Search className="absolute w-5 h-5 text-gray-400 transform -translate-y-1/2 left-4 top-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for answers..."
                className="w-full py-4 pl-12 pr-4 text-lg transition-colors bg-white border-2 border-gray-200 rounded-xl focus:border-red-500 focus:outline-none"
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* FAQ Content */}
      <section className="py-16">
        <div className="container px-4 mx-auto">
          <div className="max-w-6xl mx-auto">
            {/* Category Filters */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="mb-12"
            >
              <div className="flex flex-wrap justify-center gap-4">
                {categories.map((category, index) => (
                  <motion.button
                    key={category.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1, duration: 0.6 }}
                    onClick={() => setActiveCategory(category.id)}
                    className={`flex items-center space-x-2 px-6 py-3 rounded-full transition-all ${
                      activeCategory === category.id
                        ? "bg-red-500 text-white shadow-lg"
                        : "bg-white text-gray-600 hover:bg-red-50 hover:text-red-500 shadow-md"
                    }`}
                  >
                    <category.icon className="w-5 h-5" />
                    <span className="font-medium">{category.label}</span>
                  </motion.button>
                ))}
              </div>
            </motion.div>

            {/* FAQ Items - Sirf 6 Questions */}
            <div className="space-y-4">
              <AnimatePresence>
                {filteredFAQs.map((faq, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.05, duration: 0.4 }}
                    className="overflow-hidden bg-white shadow-md rounded-xl"
                  >
                    <button
                      onClick={() => toggleItem(index)}
                      className="flex items-center justify-between w-full px-6 py-4 text-left transition-colors hover:bg-gray-50"
                    >
                      <h3 className="pr-4 text-lg font-semibold text-gray-800">{faq.question}</h3>
                      <motion.div
                        animate={{ rotate: openItems.has(index) ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                        className="flex-shrink-0"
                      >
                        <ChevronDown className="w-5 h-5 text-gray-500" />
                      </motion.div>
                    </button>
                    <AnimatePresence>
                      {openItems.has(index) && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="overflow-hidden"
                        >
                          <div className="px-6 pb-4 leading-relaxed text-gray-600">{faq.answer}</div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* No Results */}
            {filteredFAQs.length === 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="py-16 text-center">
                <div className="flex items-center justify-center w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full">
                  <HelpCircle className="w-12 h-12 text-gray-400" />
                </div>
                <h2 className="mb-4 text-2xl font-semibold text-gray-800">No questions found</h2>
                <p className="mb-8 text-gray-600">Try adjusting your search or browse different categories</p>
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setActiveCategory("all");
                  }}
                  className="px-6 py-3 text-white transition-colors bg-red-500 rounded-lg hover:bg-red-600"
                >
                  Clear Filters
                </button>
              </motion.div>
            )}
          </div>
        </div>
      </section>

      {/* Contact Support */}
      
    </div>
  );
};

export default FAQPage;