import React from "react";
import { motion } from "framer-motion";
import { FileText, Shield, CreditCard, Truck, RotateCcw, AlertTriangle, CheckCircle, Globe } from "lucide-react";
const TermsPage = () => {
  const sections = [
    {
      id: "acceptance",
      title: "Acceptance of Terms",
      icon: FileText,
      content: "By accessing or using the Ksauni Bliss website (www.ksaunibliss.com), you agree to be bound by these Terms of Service and any other terms that may apply. If you do not agree to these terms, please do not use the website or purchase products.",
    },
    {
      id: "changes",
      title: "Changes to Terms",
      icon: AlertTriangle,
      content: "Ksauni Bliss reserves the right to update, modify, or change these Terms of Service at any time. Any changes will take effect immediately upon posting on this page. Please check periodically for updates. Your continued use of the site after changes have been made constitutes your acceptance of the revised terms.",
    },
    {
      id: "eligibility",
      title: "Eligibility",
      icon: Shield,
      content: "You must be at least 18 years of age to use this website and make a purchase. If you are under 18, you must have the consent of a parent or guardian to use the site and place orders.",
    },
    {
      id: "account",
      title: "Account Responsibility",
      icon: Shield,
      content: "If you create an account on our website, you are responsible for maintaining the confidentiality of your account details, including your username and password. You are also responsible for all activities that occur under your account. If you suspect any unauthorized use of your account, please contact us immediately.",
    },
    {
      id: "products",
      title: "Product Information",
      icon: FileText,
      content: "We make every effort to provide accurate descriptions, images, and information about the products on our website. However, we cannot guarantee that all product descriptions, pricing, or availability are completely accurate or error-free. Prices and availability are subject to change without notice.",
    },
    {
      id: "orders",
      title: "Orders and Payment",
      icon: CreditCard,
      content: "When you place an order, you are making an offer to buy the selected items. We reserve the right to accept or decline your order. All prices are listed in INR, and you are responsible for paying any applicable taxes, shipping charges, or duties. We accept various payment methods, including credit/debit cards and other payment processors, as indicated on our site.",
    },
    {
      id: "shipping",
      title: "Shipping and Delivery",
      icon: Truck,
      content: "Ksauni Bliss strives to ship orders promptly. However, shipping times and availability are subject to stock and delivery service providers. Shipping fees are calculated at checkout and may vary depending on your location and the shipping method selected. We are not responsible for any delays caused by third-party delivery services.",
    },
    {
      id: "returns",
      title: "Returns and Refunds",
      icon: RotateCcw,
      content: "Please refer to our Return and Refund Policy for detailed information regarding returns, exchanges, and refunds. By placing an order, you agree to our return and refund conditions.",
    },
    {
      id: "intellectual",
      title: "Intellectual Property",
      icon: Shield,
      content: "All content on the Ksauni Bliss website, including logos, designs, text, images, and trademarks, is the property of Ksauni Bliss or its licensors and is protected by intellectual property laws. You may not use, reproduce, or distribute any of our content without prior written permission.",
    },
    {
      id: "conduct",
      title: "User Conduct",
      icon: AlertTriangle,
      content: `By using our website, you agree not to:
• Engage in any unlawful, fraudulent, or harmful activities.
• Use the website in a way that could damage, disable, or impair the functionality of the site or interfere with other users.
• Post or transmit any harmful or offensive content, including viruses, malware, or hate speech.
• Use the website for unauthorized commercial purposes or solicitations.`,
    },
    {
      id: "liability",
      title: "Limitation of Liability",
      icon: Shield,
      content: "Ksauni Bliss is not liable for any indirect, incidental, special, or consequential damages arising from your use of the website or our products. Our liability is limited to the amount you paid for the product(s) in question.",
    },
    {
      id: "indemnification",
      title: "Indemnification",
      icon: Shield,
      content: "You agree to indemnify and hold harmless Ksauni Bliss, its employees, affiliates, and partners from any claims, damages, or expenses (including legal fees) arising from your use of the website, violation of these terms, or infringement of any third-party rights.",
    },
    {
      id: "privacy",
      title: "Privacy",
      icon: Shield,
      content: "Your privacy is important to us. Please review our Privacy Policy to understand how we collect, use, and protect your personal information.",
    },
    {
      id: "third-party",
      title: "Third-Party Links",
      icon: Globe,
      content: "The Ksauni Bliss website may contain links to third-party websites or services that are not controlled by us. We are not responsible for the content or privacy practices of third-party websites. Clicking on those links is done at your own risk.",
    },
    {
      id: "governing",
      title: "Governing Law",
      icon: FileText,
      content: "These Terms of Service are governed by the laws of India. Any legal action arising from these terms will be subject to the jurisdiction of the courts in India.",
    },
    {
      id: "dispute",
      title: "Dispute Resolution",
      icon: CheckCircle,
      content: "In the event of any dispute, we encourage you to first contact us directly to resolve the issue. If we are unable to resolve the dispute informally, you agree to submit any unresolved disputes to binding arbitration or mediation, as per the laws in your jurisdiction.",
    },
    {
      id: "termination",
      title: "Termination",
      icon: AlertTriangle,
      content: "We reserve the right to suspend or terminate your access to the website if we believe you have violated these terms or engaged in any unauthorized or harmful activity. This includes, but is not limited to, engaging in fraudulent or illegal activities, or violating intellectual property rights.",
    },
  ];
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="py-16 bg-gradient-to-br from-orange-50 to-red-50">
        <div className="container px-4 mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-3xl mx-auto text-center"
          >
            <h1 className="mb-6 text-4xl font-bold text-gray-800 md:text-5xl">
              Terms & <span className="text-orange-500">Conditions</span>
            </h1>
            <p className="mb-8 text-xl text-gray-600">
              Please read these terms and conditions carefully before using our services
            </p>
            <div className="inline-block p-4 bg-white rounded-lg shadow-md">
              <p className="text-sm text-gray-600">
                <strong>Last Updated:</strong> January 15, 2024
              </p>
            </div>
          </motion.div>
        </div>
      </section>
      {/* Terms Content */}
      <section className="py-16">
        <div className="container px-4 mx-auto">
          <div className="max-w-4xl mx-auto">
            {/* Introduction */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="p-8 mb-8 bg-white shadow-lg rounded-xl"
            >
              <h2 className="mb-4 text-2xl font-bold text-gray-800">Welcome to Ksauni Bliss</h2>
              <p className="mb-4 leading-relaxed text-gray-600">
                Welcome to Ksauni Bliss! By using our website, making purchases, or interacting with our services, you agree to follow these Terms of Service. Please read them carefully.
              </p>
            </motion.div>
            {/* Terms Sections */}
            <div className="space-y-6">
              {sections.map((section, index) => (
                <motion.div
                  key={section.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.6 }}
                  viewport={{ once: true }}
                  className="overflow-hidden bg-white shadow-lg rounded-xl"
                >
                  <div className="p-6">
                    <div className="flex items-center mb-4">
                      <div className="p-3 mr-4 bg-orange-100 rounded-full">
                        <section.icon className="w-6 h-6 text-orange-500" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-800">{section.title}</h3>
                    </div>
                    <div className="leading-relaxed text-gray-600 whitespace-pre-line">{section.content}</div>
                  </div>
                </motion.div>
              ))}
            </div>
            {/* Important Notice */}
          </div>
        </div>
      </section>
    </div>
  );
};
export default TermsPage;