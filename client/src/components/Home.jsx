"use client";
import { motion } from "framer-motion";
const features = [
  {
    title: "Money Guarantee",
    description: "With A 30 Days",
    iconPosition: "0% center", // Position for the first icon (money bag)
    alt: "Money bag icon",
  },
  {
    title: "Best Online Support",
    description: "Hour: 10:00AM - 5:00PM",
    iconPosition: "33.33% center", // Position for the second icon (headset person)
    alt: "Headset person icon",
  },
  {
    title: "Win $100 To Shop",
    description: "Enter Now",
    iconPosition: "66.66% center", // Position for the third icon (shopping cart)
    alt: "Shopping cart icon",
  },
  {
    title: "Manage Quality",
    description: "Best Quality Guarantee",
    iconPosition: "100% center", // Position for the fourth icon (quality badge)
    alt: "Quality badge icon",
  },
];
const itemVariants = {
  hidden: { opacity: 0, y: 50 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};
const FeatureHighlights = () => {
  return (
    <section className="py-12 text-white bg-gray-900">
      <div className="container px-4 mx-auto sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.5 }}
              whileHover={{ scale: 1.05, transition: { duration: 0.3 } }}
              className="flex flex-col items-center p-4 text-center"
            >
              <div
                className="w-20 h-20 mb-4 bg-no-repeat"
                style={{
                  backgroundImage: "url('/images/feature-icons.png')",
                  backgroundSize: "400% auto", // Scale the sprite to fit 4 icons horizontally
                  backgroundPosition: feature.iconPosition,
                }}
                role="img"
                aria-label={feature.alt}
              />
              <h3 className="mb-1 text-xl font-bold">{feature.title}</h3>
              <p className="text-gray-400">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
export default FeatureHighlights;