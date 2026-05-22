"use client";
import { Sparkles, CheckCircle, Factory, Truck, Shield, Eye, Phone, Mail, MapPin } from "lucide-react";
import img from "../../public/01.webp";

const AboutUs = () => {
  return (
    <section className="w-full bg-gradient-to-b from-red-50 to-white py-16 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center p-2 bg-red-100 rounded-full mb-4">
            <Sparkles className="w-6 h-6 text-red-600" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-3">
            About <span className="text-red-600">Factory Sale</span>
          </h1>
          <p className="text-gray-500 text-lg">India’s Trusted Direct Factory Fashion Store</p>
          <div className="w-24 h-1 bg-red-500 mx-auto mt-4 rounded-full"></div>
        </div>

        {/* Hero Section with Image and Intro */}
        <div className="flex flex-col lg:flex-row items-center gap-10 mb-16">
          <div className="lg:w-1/2">
            <div className="relative">
              <div className="absolute -top-4 -left-4 w-24 h-24 bg-red-200 rounded-full opacity-50 blur-2xl"></div>
              <img
                src={img}
                alt="Factory Sale T-shirt"
                className="w-full rounded-2xl shadow-2xl border-4 border-red-200 object-cover relative z-10"
              />
              <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-red-300 rounded-full opacity-40 blur-2xl"></div>
            </div>
          </div>
          
          <div className="lg:w-1/2 space-y-4">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <Factory className="w-6 h-6 text-red-600" />
              Welcome to Factory Sale
            </h2>
            <p className="text-gray-600 leading-relaxed">
              Factory Sale is a platform created to provide premium-quality fashion products directly from the manufacturer to customers at genuine factory prices.
            </p>
            <p className="text-gray-600 leading-relaxed">
              Our company is engaged in the manufacturing of all types of clothing products including Jeans, T-Shirts, Shirts, Formal Trousers, Joggers, Baggy Jeans, Mom Fit Jeans, and many more fashion wear products.
            </p>
            <div className="bg-red-50 p-4 rounded-xl border-l-4 border-red-500">
              <p className="text-gray-700 italic">
                "For many years, our main business has been supplying products from factory to wholesalers. Now, for the first time, we have launched direct online sales for customers."
              </p>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-center text-gray-800 mb-8 flex items-center justify-center gap-2">
            <Shield className="w-6 h-6 text-red-600" />
            Why Choose Factory Sale?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white p-5 rounded-xl shadow-md hover:shadow-lg transition-shadow border border-gray-100">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-3">
                <Factory className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">Direct Factory Rates</h3>
              <p className="text-gray-500 text-sm">No middlemen, no extra charges. Get products at genuine factory prices.</p>
            </div>
            
            <div className="bg-white p-5 rounded-xl shadow-md hover:shadow-lg transition-shadow border border-gray-100">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-3">
                <Sparkles className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">Premium Quality Products</h3>
              <p className="text-gray-500 text-sm">Manufactured using premium-quality fabrics and modern designs.</p>
            </div>
            
            <div className="bg-white p-5 rounded-xl shadow-md hover:shadow-lg transition-shadow border border-gray-100">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-3">
                <Truck className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">Online Order Facility</h3>
              <p className="text-gray-500 text-sm">Easy and secure online ordering with doorstep delivery.</p>
            </div>
            
            <div className="bg-white p-5 rounded-xl shadow-md hover:shadow-lg transition-shadow border border-gray-100">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-3">
                <Shield className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">Customized Manufacturing</h3>
              <p className="text-gray-500 text-sm">Manufacture products as per customer requirements and provide customized solutions.</p>
            </div>
            
            <div className="bg-white p-5 rounded-xl shadow-md hover:shadow-lg transition-shadow border border-gray-100">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-3">
                <CheckCircle className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">Safe & Verified Shopping</h3>
              <p className="text-gray-500 text-sm">Enjoy a secure and verified shopping experience with us.</p>
            </div>
            
            <div className="bg-white p-5 rounded-xl shadow-md hover:shadow-lg transition-shadow border border-gray-100">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-3">
                <Eye className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">Video Call Factory Inspection</h3>
              <p className="text-gray-500 text-sm">Connect with us, view our factory through video call, and place orders with confidence.</p>
            </div>
          </div>
        </div>
       
        {/* Footer Note */}
        <div className="text-center pt-8 border-t border-gray-200">
          <p className="text-gray-500">
            ✨ Thank you for visiting Factory Sale. We value your trust and support.
          </p>
        </div>
      </div>
    </section>
  );
};

export default AboutUs;