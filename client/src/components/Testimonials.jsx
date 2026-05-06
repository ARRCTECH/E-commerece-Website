"use client";
import React, { useState, useEffect } from "react";
const Testimonials = () => {
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const testimonials = [
    {
      id: 1,
      name: "Sarah Johnson",
      role: "Fashion Blogger",
      image: "/placeholder-user.jpg",
      content:
        "Amazing quality and fast delivery! I love the variety of styles available. This has become my go-to store for all fashion needs.",
      rating: 5,
    },
    {
      id: 2,
      name: "Michael Chen",
      role: "Designer",
      image: "/placeholder-user.jpg",
      content:
        "The customer service is exceptional and the products always exceed my expectations. Highly recommended for anyone looking for quality fashion.",
      rating: 5,
    },
    {
      id: 3,
      name: "Emily Davis",
      role: "Student",
      image: "/placeholder-user.jpg",
      content:
        "Great prices and trendy styles! Perfect for someone on a budget who still wants to look fashionable. Love the frequent sales too.",
      rating: 4,
    },
    {
      id: 4,
      name: "David Wilson",
      role: "Professional",
      image: "/placeholder-user.jpg",
      content:
        "Professional attire that fits perfectly. The quality is outstanding and the shopping experience is seamless. Will definitely shop again.",
      rating: 5,
    },
  ];
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [testimonials.length]);
  return (
    <section className="py-16 bg-gray-50">
      <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-3xl font-bold text-gray-900">What Our Customers Say</h2>
          <p className="max-w-2xl mx-auto text-lg text-gray-600">
            Don't just take our word for it - hear from our satisfied customers about their experience
          </p>
        </div>
        <div className="relative max-w-4xl mx-auto">
          <div className="p-8 text-center bg-red-600 rounded-lg shadow-lg">
            <div className="flex justify-center mb-6">
              {[...Array(testimonials[currentTestimonial].rating)].map((_, i) => (
                <svg key={i} className="w-6 h-6 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <blockquote className="mb-6 text-xl italic text-gray-700">
              "{testimonials[currentTestimonial].content}"
            </blockquote>
            <div className="flex items-center justify-center">
              <img
                src={testimonials[currentTestimonial].image || "/placeholder.svg"}
                alt={testimonials[currentTestimonial].name}
                className="object-cover w-12 h-12 mr-4 rounded-full"
              />
              <div className="text-left">
                <div className="font-semibold text-black-900">{testimonials[currentTestimonial].name}</div>
                <div className="text-sm text-black-600">{testimonials[currentTestimonial].role}</div>
              </div>
            </div>
          </div>
          {/* Navigation dots */}
          <div className="flex justify-center mt-8 space-x-2">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentTestimonial(index)}
                className={`w-3 h-3 rounded-full transition-colors duration-200 ${
                  index === currentTestimonial ? "bg-black" : "bg-gray-300"
                }`}
              />
            ))}
          </div>
        </div>
        {/* Customer stats */}
        <div className="grid grid-cols-2 gap-8 mt-16 md:grid-cols-4">
          <div className="text-center">
            <div className="mb-2 text-3xl font-bold text-black">4.8/5</div>
            <div className="text-gray-600">Average Rating</div>
          </div>
          <div className="text-center">
            <div className="mb-2 text-3xl font-bold text-black">10,000+</div>
            <div className="text-gray-600">Reviews</div>
          </div>
          <div className="text-center">
            <div className="mb-2 text-3xl font-bold text-black">98%</div>
            <div className="text-gray-600">Satisfaction Rate</div>
          </div>
          <div className="text-center">
            <div className="mb-2 text-3xl font-bold text-black">50,000+</div>
            <div className="text-gray-600">Happy Customers</div>
          </div>
        </div>
      </div>
    </section>
  );
};
export default Testimonials;