"use client";

import { useState } from "react";

const ContactUsPage = () => {
  const businessHours = [
    { day: "Monday - Saturday", hours: "10:00 AM - 7:00 PM" },
    { day: "Sunday", hours: "Closed" },
  ];

  const mapsLink = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
    "Shop No. 1, Om Sai Ganesh Kpira Chawl, Near Chirag Hotel, Near Basant Bahar Road, Ulhasnagar 421005, India"
  )}`;

  return (
    <section className="w-full min-h-screen bg-gradient-to-br from-red-50 via-white to-red-50 py-12 px-4 md:py-16">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-red-700 mb-4 tracking-tight">
            Contact Us
          </h1>
          <div className="w-24 h-1 bg-red-500 mx-auto rounded-full mb-6"></div>
          <p className="text-gray-600 max-w-2xl mx-auto text-lg">
            We're here to assist you with any questions about our products or
            services. Reach out to us through any channel below.
          </p>
        </div>

        {/* Two column layout */}
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Left column – contact info (unchanged) */}
          <div className="space-y-8">
            <div className="bg-white rounded-2xl shadow-lg border border-red-100 p-6 md:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-red-100 rounded-lg">
                  <span className="text-red-600 font-bold text-xl">RJ</span>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">Revon Jeans</h2>
                  <p className="text-red-600 text-sm font-medium">
                    Premium Denim Manufacturers
                  </p>
                </div>
              </div>

              <div className="space-y-5">
                <div className="border-l-4 border-red-500 pl-4">
                  <p className="text-sm text-gray-500 uppercase tracking-wide">
                    Manufactured & Packed By
                  </p>
                  <p className="font-semibold text-gray-800 text-lg">Revon Jeans</p>
                </div>

                <div className="flex gap-3">
                  <span className="text-xl flex-shrink-0">📍</span>
                  <div>
                    <p className="font-semibold text-gray-800 mb-1">Office Address</p>
                    <p className="text-gray-600 leading-relaxed">
                      Shop No. 1, Om Sai Ganesh Kpira Chawl,
                      <br />
                      Near Chirag Hotel, Near Basant Bahar Road,
                      <br />
                      Ulhasnagar - 421005, Maharashtra, India
                    </p>
                    <a
                      href={mapsLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-red-600 hover:text-red-700 font-medium mt-2"
                    >
                      Get Directions →
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="text-xl flex-shrink-0">📞</span>
                  <div>
                    <p className="font-semibold text-gray-800 mb-1">Phone Number</p>
                    <a
                      href="tel:+918830155383"
                      className="text-gray-600 hover:text-red-600 transition-colors block"
                    >
                      +91 8830155383
                    </a>
                    <p className="text-xs text-gray-400 mt-1">
                      Mon-Sat, 10 AM - 7 PM
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="text-xl flex-shrink-0">✉️</span>
                  <div>
                    <p className="font-semibold text-gray-800 mb-1">Email Address</p>
                    <a
                      href="mailto:factorysaleusadata@gmail.com"
                      className="text-gray-600 hover:text-red-600 transition-colors break-all"
                    >
                      factorysaleusadata@gmail.com
                    </a>
                    <p className="text-xs text-gray-400 mt-1">
                      We respond within 24 hours
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="text-xl flex-shrink-0">📷</span>
                  <div>
                    <p className="font-semibold text-gray-800 mb-1">Social Media</p>
                    <a
                      href="https://instagram.com/revonjeans"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-600 hover:text-red-600"
                    >
                      @revonjeans
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3 pt-2 border-t border-gray-100">
                  <span className="text-xl flex-shrink-0">🕒</span>
                  <div>
                    <p className="font-semibold text-gray-800 mb-2">Business Hours</p>
                    <div className="space-y-1">
                      {businessHours.map((schedule, idx) => (
                        <div key={idx} className="flex justify-between gap-4 text-sm">
                          <span className="text-gray-600">{schedule.day}</span>
                          <span className="font-medium text-gray-800">
                            {schedule.hours}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right column – replaced with contact image */}
          <div className="bg-white rounded-2xl shadow-lg border border-red-100 p-6 md:p-8 flex items-center justify-center">
            <img
              src="https://images.unsplash.com/photo-1556742049-0cfed6f4c5f1?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600&q=80"
              alt="Contact us - Customer support illustration"
              className="w-full h-auto rounded-xl object-cover"
            />
          </div>
        </div>

        <div className="mt-12 text-center">
          <p className="text-gray-500 text-sm bg-white/60 backdrop-blur-sm inline-block px-6 py-3 rounded-full shadow-sm border border-red-100">
            We're always happy to assist you with any questions or support you may need.
          </p>
        </div>
      </div>
    </section>
  );
};

export default ContactUsPage;