"use client";

import { useNavigate } from "react-router-dom";
import { Gift, Sparkles, Crown, ArrowUpRight, Lock, Shield, Users, Wallet, UserPlus, ShoppingBag, CreditCard } from "lucide-react";
import { motion } from "framer-motion";

export default function ReferralProgram() {
  const navigate = useNavigate();

  const handleSignUp = () => {
    navigate("/signup");
  };

  const steps = [
    { 
      step: "01", 
      title: "Share", 
      description: "Share your unique referral link with friends",
      icon: <Users className="w-5 h-5" />
    },
    { 
      step: "02", 
      title: "Friend Signs Up", 
      description: "Your friend creates an account using your link",
      icon: <UserPlus className="w-5 h-5" />
    },
    { 
      step: "03", 
      title: "Places Order", 
      description: "Your friend completes their first purchase",
      icon: <ShoppingBag className="w-5 h-5" />
    },
    { 
      step: "04", 
      title: "You Earn", 
      description: "Get ₹ credited to your wallet instantly",
      icon: <Wallet className="w-5 h-5" />
    },
  ];

  return (
    <div className="w-full bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900">
      {/* Single Section - Everything in one background */}
      <div className="relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 -right-32 w-96 h-96 rounded-full bg-amber-500 blur-[100px]" />
          <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-amber-600 blur-[100px]" />
        </div>
        
        {/* Subtle pattern overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.02)_50%,transparent_75%)] bg-[size:20px_20px]" />

        <div className="relative px-4 py-10 sm:py-10 lg:py-14">
          <div className="max-w-7xl mx-auto">
            
            {/* Header Section */}
            <div className="text-center mb-12">
              {/* Premium Badge */}
              <div className="inline-flex items-center gap-2 mb-4">
                <span className="w-8 h-px bg-amber-500/60" />
                <span className="text-[10px] tracking-[0.3em] uppercase text-amber-400">
                  Exclusive Access
                </span>
                <Sparkles className="w-3 h-3 text-amber-400" />
              </div>

              {/* Main Title */}
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-light text-white tracking-tight">
                Refer &{" "}
                <span className="font-medium bg-gradient-to-r from-amber-400 to-amber-300 bg-clip-text text-transparent">
                  Earn
                </span>
              </h2>
              
              <p className="mt-4 text-white/50 text-sm max-w-md mx-auto">
                Share the love, earn rewards together
              </p>
            </div>

            {/* Steps Grid - 4 Steps */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              {steps.map((item, idx) => (
                <div key={idx} className="group">
                  <div className="text-center">
                    {/* Step Circle */}
                    <div className="relative mb-4">
                      <div className="w-16 h-16 mx-auto rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center group-hover:bg-amber-500/20 group-hover:border-amber-500/50 transition-all duration-300">
                        <div className="text-amber-400 group-hover:text-amber-300 transition-colors">
                          {item.icon}
                        </div>
                      </div>
                      {/* Connector Line */}
                      {idx < steps.length - 1 && (
                        <div className="hidden lg:block absolute top-8 left-[calc(50%+2rem)] right-0 h-px bg-gradient-to-r from-white/20 to-transparent" />
                      )}
                      <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-amber-500/30 backdrop-blur-sm flex items-center justify-center">
                        <span className="text-[9px] font-bold text-amber-300">{item.step}</span>
                      </div>
                    </div>
                    
                    {/* Step Content */}
                    <h4 className="text-sm font-semibold text-white mb-1">{item.title}</h4>
                    <p className="text-[11px] text-white/40 leading-relaxed max-w-xs mx-auto">
                      {item.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>


            {/* CTA Button */}
            <div className="text-center mt-10">
              <motion.button
                onClick={handleSignUp}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="group relative overflow-hidden bg-gradient-to-r from-amber-500 to-amber-600 text-white px-8 py-4 font-semibold transition-all duration-300 cursor-pointer rounded-full shadow-lg hover:shadow-amber-500/25"
              >
                <span className="relative z-10 flex items-center gap-2 text-sm uppercase tracking-[0.15em]">
                  Get Your Referral Link
                  <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-amber-600 to-amber-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </motion.button>
            </div>

            {/* Terms */}
            <div className="flex items-center justify-center gap-4 mt-8">
              <div className="flex items-center gap-1.5">
                <Lock className="w-3 h-3 text-white/80" />
                <span className="text-[9px] text-white/80 uppercase tracking-wide">Secure & Verified</span>
              </div>
              <div className="w-px h-3 bg-white/10" />
              <div className="flex items-center gap-1.5">
                <Shield className="w-3 h-3 text-white/80" />
                <span className="text-[9px] text-white/80 uppercase tracking-wide">Terms Apply</span>
              </div>
            </div>
            <p className="text-[8px] text-white/80 text-center mt-3">
              *Reward credited after friend completes first purchase.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}