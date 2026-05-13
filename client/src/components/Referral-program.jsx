"use client";

import { useNavigate } from "react-router-dom";
import { Gift, Package, Sparkles, Scissors, Crown, Shield, Star, ArrowUpRight, Lock } from "lucide-react";
import { motion } from "framer-motion";

export default function ReferralProgram() {
  const navigate = useNavigate();

  const handleSignUp = () => {
    navigate("/signup");
  };

  return (
    <div className="w-full">
      {/* Premium Referral Banner */}
      <section className="relative bg-gradient-to-r from-neutral-900 via-neutral-800 to-neutral-900 overflow-hidden">
        {/* Premium decorative elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 -right-32 w-64 h-64 rounded-full bg-amber-500 blur-3xl" />
          <div className="absolute -bottom-32 -left-32 w-80 h-80 rounded-full bg-amber-600 blur-3xl" />
        </div>
        
        {/* Subtle pattern overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.02)_50%,transparent_75%)] bg-[size:20px_20px]" />

        <div className="relative px-4 py-10 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
              <div className="flex items-center gap-5 flex-1">
                {/* Premium Gift Icon with gradient */}
                <div className="relative">
                  <div className="absolute inset-0 bg-amber-500 rounded-full blur-xl opacity-30" />
                  <div className="relative bg-gradient-to-br from-amber-400 to-amber-600 rounded-full p-3">
                    <Gift className="w-8 h-8 text-white" strokeWidth={1.5} />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-[10px] font-bold tracking-[0.3em] text-amber-400 uppercase">
                      Exclusive Access
                    </span>
                    <div className="h-px w-8 bg-amber-500/50" />
                    <span className="text-[10px] font-medium text-white/60 uppercase flex items-center gap-1">
                      <Crown className="w-3 h-3 text-amber-400" />
                      Limited Time
                    </span>
                  </div>
                  
                  <h2 className="text-white text-2xl sm:text-3xl lg:text-4xl font-light tracking-tight">
                    <span className="font-serif italic text-amber-400 font-semibold">
                      Refer & Earn
                    </span>{" "}
                    <span className="text-white/90">
                      with The Invite Club
                    </span>
                  </h2>

                  <p className="text-white/50 text-sm max-w-md">
                    Invite your circle and unlock up to <span className="text-amber-400 font-semibold">₹7500</span> in exclusive rewards. 
                    Every friend joins, every benefit grows.
                  </p>
                </div>
              </div>

              {/* Premium CTA Button */}
              <motion.button
                onClick={handleSignUp}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="group relative overflow-hidden bg-gradient-to-r from-amber-500 to-amber-600 text-white px-8 py-4 font-semibold tracking-wide transition-all duration-300 cursor-pointer rounded-full shadow-lg hover:shadow-amber-500/25"
              >
                <span className="relative z-10 flex items-center gap-2 text-sm uppercase tracking-[0.15em]">
                  Sign up Now
                  <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-amber-600 to-amber-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </motion.button>
            </div>
          </div>
        </div>
      </section>

      {/* Premium Features Grid Section */}
      <section className="relative bg-white overflow-hidden">
        {/* Elegant background pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(60deg,#faf9f6_1px,transparent_1px),linear-gradient(-60deg,#faf9f6_1px,transparent_1px)] bg-[size:40px_40px]" />
        
        <div className="relative px-4 py-20 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            {/* Section Header */}
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-neutral-100 mb-5">
                <Shield className="w-3.5 h-3.5 text-amber-600" />
                <span className="text-[9px] tracking-[0.3em] uppercase text-neutral-700 font-medium">
                  Premium Benefits
                </span>
              </div>
              <h3 className="text-3xl sm:text-4xl font-serif text-neutral-900 font-light">
                What <span className="font-semibold text-amber-600">awaits</span> you
              </h3>
              <div className="mt-4 h-px w-16 bg-gradient-to-r from-amber-500 to-transparent mx-auto" />
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
              {/* Feature 1 - Referral Code */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                viewport={{ once: true }}
                className="group relative"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-amber-50 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative bg-white rounded-2xl p-8 text-center border border-neutral-100 group-hover:border-amber-200 transition-all duration-500 shadow-sm hover:shadow-xl">
                  {/* Icon Container */}
                  <div className="relative inline-block mb-6">
                    <div className="absolute inset-0 bg-amber-400 rounded-full blur-xl opacity-20 group-hover:opacity-40 transition-opacity" />
                    <div className="relative bg-gradient-to-br from-neutral-900 to-neutral-800 rounded-full p-4 w-16 h-16 flex items-center justify-center">
                      <Package className="w-7 h-7 text-amber-400" strokeWidth={1.5} />
                    </div>
                  </div>

                  <h4 className="text-neutral-900 font-serif text-xl mb-3 font-medium">
                    Refer Code
                  </h4>
                  
                  <div className="inline-block px-4 py-2 bg-neutral-50 rounded-lg mb-3">
                    <code className="text-sm font-mono text-amber-600 tracking-wider">SHOPWITH10</code>
                  </div>

                  {/* Hover indicator */}
                  <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 w-8 h-px bg-amber-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </motion.div>

              {/* Feature 2 - Special Offers */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                viewport={{ once: true }}
                className="group relative"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-amber-50 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative bg-white rounded-2xl p-8 text-center border border-neutral-100 group-hover:border-amber-200 transition-all duration-500 shadow-sm hover:shadow-xl">
                  <div className="relative inline-block mb-6">
                    <div className="absolute inset-0 bg-amber-400 rounded-full blur-xl opacity-20 group-hover:opacity-40 transition-opacity" />
                    <div className="relative bg-gradient-to-br from-neutral-900 to-neutral-800 rounded-full p-4 w-16 h-16 flex items-center justify-center">
                      <Sparkles className="w-7 h-7 text-amber-400" strokeWidth={1.5} />
                    </div>
                  </div>

                  <h4 className="text-neutral-900 font-serif text-xl mb-3 font-medium">
                    Special Offers
                  </h4>
                  
                  <p className="text-neutral-500 text-sm leading-relaxed">
                    on your first mobile app order<br />
                    <span className="text-amber-600 font-medium">Exclusive app-only deals</span>
                  </p>
                </div>
              </motion.div>

              {/* Feature 3 - Secure Payment */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                viewport={{ once: true }}
                className="group relative"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-amber-50 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative bg-white rounded-2xl p-8 text-center border border-neutral-100 group-hover:border-amber-200 transition-all duration-500 shadow-sm hover:shadow-xl">
                  <div className="relative inline-block mb-6">
                    <div className="absolute inset-0 bg-amber-400 rounded-full blur-xl opacity-20 group-hover:opacity-40 transition-opacity" />
                    <div className="relative bg-gradient-to-br from-neutral-900 to-neutral-800 rounded-full p-4 w-16 h-16 flex items-center justify-center">
                      <Lock className="w-7 h-7 text-amber-400" strokeWidth={1.5} />
                    </div>
                  </div>

                  <h4 className="text-neutral-900 font-serif text-xl mb-3 font-medium">
                    Secure Payment
                  </h4>
                  
                  <div className="flex items-center justify-center gap-1 mb-3">
                    <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                    <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                    <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                    <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                    <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                  </div>
                  
                  <p className="text-neutral-500 text-sm leading-relaxed">
                    128-bit SSL encrypted<br />
                    <span className="text-amber-600 font-medium">100% secure transactions</span>
                  </p>
                </div>
              </motion.div>
            </div>

            {/* Trust Badge Section - Simplified */}
           
          </div>
        </div>
      </section>
    </div>
  );
}