"use client";
import { Sparkles } from "lucide-react";
import img from "../../public/01.webp";
const AboutUs = () => {
  return (
    <section className="w-full min-h-screen bg-red-50 py-16 px-6 flex items-center justify-center">
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center gap-10">
        {/* Left Side - Image / Logo */}
        <div className="flex-1 flex justify-center">
          <img
            src={img}
            alt="Ksauni Bliss T-shirt"
            className="w-full md:w-96 rounded-2xl shadow-lg border-4 border-red-200 object-cover"
          />
        </div>
        {/* Right Side - Text */}
        <div className="flex-1 space-y-6">
          <h2 className="text-3xl md:text-4xl font-bold text-red-600 flex items-center gap-2">
            <Sparkles className="w-8 h-8 text-red-500" />
            About Ksauni Bliss
          </h2>
          <p className="text-gray-700 text-lg leading-relaxed">
            At <span className="font-semibold text-red-600">Ksauni Bliss</span>, we don’t just create T-shirts—we create a vibe.
            A vibe of effortless style, unmatched comfort, and a genuine connection to who you are.
            Rooted in the heart of modern life, our designs are crafted for those who want to stand out
            while feeling at home in their own skin.
          </p>
          <p className="text-gray-700 text-lg leading-relaxed">
            Every Ksauni Bliss T-shirt is made with <span className="font-semibold">premium, breathable fabrics</span>
            that feel just as good as they look. We blend contemporary aesthetics with timeless comfort,
            offering designs that range from bold statements to clean, minimalist looks.
          </p>
          <p className="text-gray-700 text-lg leading-relaxed">
            Whether you're exploring the city, enjoying quiet moments, or hanging with friends,
            <span className="font-semibold text-red-600"> Ksauni Bliss </span> is designed for those who live life with intention, passion,
            and a little bit of bliss.
          </p>
          <p className="text-gray-800 font-medium text-xl">
            ✨ Wear what feels right. Because when you wear Ksauni Bliss,
            it’s not just about what’s on your shirt—it’s about how it makes you feel.
          </p>
        </div>
      </div>
    </section>
  );
};
export default AboutUs;