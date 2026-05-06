"use client";
import { motion } from "framer-motion";
import { DollarSign, Headset, ShoppingCart, Award } from "lucide-react"; // Import specific Lucide icons
const features = [
  {
    title: "Money Guarantee",
    description: "With A 30 Days",
    icon: DollarSign, // Use Lucide Icon component
    alt: "Money bag icon",
  },
  {
    title: "Best Online Support",
    description: "Hour: 10:00AM - 5:00PM",
    icon: Headset, // Use Lucide Icon component
    alt: "Headset person icon",
  },
  {
    title: "Win $100 To Shop",
    description: "Enter Now",
    icon: ShoppingCart, // Use Lucide Icon component
    alt: "Shopping cart icon",
  },
  {
    title: "Manage Quality",
    description: "Best Quality Guarantee",
    icon: Award, // Use Lucide Icon component
    alt: "Quality badge icon",
  },
];
const itemVariants = {
  hidden: { opacity: 0, y: 50 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};
const iconContainerVariants = {
  hidden: { scale: 0, rotate: -180 },
  visible: { scale: 1, rotate: 0, transition: { type: "spring", stiffness: 260, damping: 20, delay: 0.2 } },
  hover: { scale: 1.1, rotate: 10, transition: { duration: 0.3 } },
};
const FeatureHighlights = () => {
  return (
    <section className="py-12 text-white bg-gray-900">
      <div className="container px-4 mx-auto sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, index) => {
            const IconComponent = feature.icon; // Get the Lucide icon component
            return (
              <motion.div
                key={index}
                variants={itemVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.5 }}
                whileHover="hover" // Apply hover animation
                className="flex flex-col items-center p-6 text-center transition-all duration-300 bg-gray-800 shadow-lg rounded-xl hover:bg-gray-700 hover:shadow-xl" // Enhanced card styling
              >
                <motion.div
                  variants={iconContainerVariants}
                  className="flex items-center justify-center w-20 h-20 mb-4 rounded-full shadow-md bg-gradient-to-br from-ksauni-red to-ksauni-dark-red" // Stylish icon container
                >
                  <IconComponent className="w-10 h-10 text-white" aria-label={feature.alt} /> {/* Render Lucide Icon */}
                </motion.div>
                <h3 className="mb-1 text-xl font-bold">{feature.title}</h3>
                <p className="text-gray-400">{feature.description}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
export default FeatureHighlights;