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
// import Navbar from "../components/Navbar"
// import Footer from "../components/Footer"
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
  const faqData = [
    {
      category: "orders",
      question: "How do I place an order?",
      answer:
        "To place an order, simply browse our products, select your desired items, choose size and color, add to cart, and proceed to checkout. You'll need to provide shipping details and payment information to complete your order.",
    },
    {
      category: "orders",
      question: "Can I modify or cancel my order after placing it?",
      answer:
        "You can modify or cancel your order within 1 hour of placing it. After that, the order goes into processing and cannot be changed. Please contact our customer service immediately if you need to make changes.",
    },
    {
      category: "orders",
      question: "How do I track my order?",
      answer:
        "Once your order is shipped, you'll receive a tracking number via email and SMS. You can track your order on our website by entering the tracking number, or through the courier partner's website.",
    },
    {
      category: "payments",
      question: "What payment methods do you accept?",
      answer:
        "We accept all major credit/debit cards (Visa, MasterCard, American Express), UPI payments, net banking, and digital wallets like Paytm, PhonePe, and Google Pay. We also offer Cash on Delivery for select locations.",
    },
    {
      category: "payments",
      question: "Is it safe to pay online on your website?",
      answer:
        "Yes, absolutely! We use industry-standard SSL encryption and partner with trusted payment gateways like Razorpay and Stripe. Your payment information is never stored on our servers and is processed securely.",
    },
    {
      category: "payments",
      question: "When will my payment be charged?",
      answer:
        "For prepaid orders, payment is charged immediately upon order confirmation. For Cash on Delivery orders, payment is collected when the order is delivered to you.",
    },
    {
      category: "delivery",
      question: "What are your shipping charges?",
      answer:
        "We offer free shipping on orders above ₹999. For orders below ₹999, standard shipping charges are ₹99. Express delivery charges vary by location and are displayed at checkout.",
    },
    {
      category: "delivery",
      question: "How long does delivery take?",
      answer:
        "Standard delivery takes 5-7 business days across India. Express delivery (1-2 days) is available in major cities like Mumbai, Delhi, Bangalore, Chennai, Hyderabad, and Pune.",
    },
    {
      category: "delivery",
      question: "Do you deliver internationally?",
      answer:
        "Currently, we only deliver within India. We're working on expanding our international shipping and will update you once it's available.",
    },
    {
      category: "returns",
      question: "What is your return policy?",
      answer:
        "We offer a 30-day return policy from the date of delivery. Items must be unused, unwashed, with original tags attached, and in original packaging. Certain items like innerwear, cosmetics, and personalized items are not returnable.",
    },
    {
      category: "returns",
      question: "How do I return an item?",
      answer:
        "To return an item, log into your account, go to 'My Orders', select the item you want to return, choose a reason, and schedule a pickup. Our courier partner will collect the item from your address free of charge.",
    },
    {
      category: "returns",
      question: "When will I receive my refund?",
      answer:
        "Refunds are processed within 5-7 business days after we receive and verify the returned item. The amount will be credited to your original payment method or Kasuni Bliss wallet, as per your preference.",
    },
    {
      category: "returns",
      question: "Can I exchange an item instead of returning it?",
      answer:
        "Yes, you can exchange items for a different size or color (subject to availability). The exchange process is similar to returns - schedule a pickup and our team will arrange the exchange.",
    },
    {
      category: "account",
      question: "How do I create an account?",
      answer:
        "You can create an account by clicking 'Sign Up' on our website or app. We use OTP-based verification through your mobile number for quick and secure registration.",
    },
    {
      category: "account",
      question: "I forgot my password. How do I reset it?",
      answer:
        "We use OTP-based login, so you don't need to remember passwords. Simply enter your mobile number and we'll send you an OTP to log in securely.",
    },
    {
      category: "account",
      question: "How do I update my profile information?",
      answer:
        "Log into your account and go to 'My Profile' to update your personal information, addresses, and preferences. Make sure to save changes after updating.",
    },
    {
      category: "orders",
      question: "What sizes do you offer?",
      answer:
        "We offer sizes from XS to XXL for most items. Each product page has a detailed size chart to help you choose the right fit. If you're unsure, our customer service team can help you select the perfect size.",
    },
    {
      category: "orders",
      question: "Are your products authentic?",
      answer:
        "Yes, all our products are 100% authentic. We source directly from brands and authorized distributors. Each product comes with authenticity guarantee and proper brand tags.",
    },
    {
      category: "delivery",
      question: "Can I change my delivery address after placing an order?",
      answer:
        "You can change your delivery address within 1 hour of placing the order. After that, the order goes into processing and the address cannot be changed. Please contact customer service immediately if needed.",
    },
    {
      category: "payments",
      question: "Do you offer EMI options?",
      answer:
        "Yes, we offer EMI options on orders above ₹3,000 through select credit cards and digital payment platforms. EMI options and tenure will be displayed at checkout based on your payment method.",
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
      {/* <Navbar /> */}
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
            {/* FAQ Items */}
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
      <section className="py-16 bg-white">
        <div className="container px-4 mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto text-center"
          >
            <div className="p-8 text-white bg-gradient-to-br from-red-500 to-red-500 rounded-2xl">
              <MessageCircle className="w-16 h-16 mx-auto mb-6 opacity-90" />
              <h2 className="mb-4 text-3xl font-bold">Still have questions?</h2>
              <p className="mb-8 text-xl opacity-90">
                Can't find what you're looking for? Our customer support team is here to help!
              </p>
              <div className="flex flex-col justify-center gap-4 sm:flex-row">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-8 py-3 font-semibold text-red-500 transition-colors bg-white rounded-lg hover:bg-gray-100"
                >
                  Contact Support
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-8 py-3 font-semibold text-white transition-colors border-2 border-white rounded-lg hover:bg-white hover:text-red-500"
                >
                  Live Chat
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
      {/* <Footer /> */}
    </div>
  );
};
export default FAQPage;