"use client";

import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import {
  Gift,
  Package,
  Sparkles,
  Crown,
  Shield,
  Star,
  ArrowUpRight,
  Lock,
  Copy,
  Award,
  UserPlus,
  Share2,
  Users,
  Wallet,
  CheckCircle,
} from "lucide-react";
import { motion, useInView } from "framer-motion";
import { getProfile } from "../store/slices/authSlice";

const CountUp = ({ value, duration = 1 }) => {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  useEffect(() => {
    if (isInView) {
      let start = 0;
      const end = parseInt(value) || 0;
      if (start === end) return;
      const incrementTime = (duration * 1000) / end;
      const timer = setInterval(() => {
        start += 1;
        setCount(start);
        if (start === end) clearInterval(timer);
      }, incrementTime);
      return () => clearInterval(timer);
    }
  }, [isInView, value, duration]);

  return <span ref={ref}>{count.toLocaleString()}</span>;
};

export default function ReferralProgram() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user, isLoading } = useSelector((state) => state.auth);

  useEffect(() => {
    if (user) {
      dispatch(getProfile());
    }
  }, [user, dispatch]);

  const handleSignUp = () => {
    navigate("/register");
  };

  if (user && user.myreferralCode) {
    const referralLink = `${window.location.origin}/register?ref=${user.myreferralCode}`;
    const shareText = "Join me and get exclusive rewards! 🎁";

    const copyToClipboard = (text) => {
      navigator.clipboard.writeText(text);
      toast.success("Copied to clipboard!");
    };

    const handleActiveButton = (id) => {
      localStorage.setItem("activeButton", id);
    };

    return (
      <div className="w-full bg-neutral-50">
        {/* Hero Section - Logged In */}
        <section className="relative bg-gradient-to-r from-neutral-900 to-neutral-800 overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
              <div className="text-center lg:text-left">
                <div className="inline-flex items-center gap-2 bg-amber-500/10 rounded-full px-3 py-1 mb-4">
                  <Gift className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-[10px] font-medium text-amber-400 uppercase tracking-wider">Refer & Earn</span>
                </div>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-light text-white tracking-tight">
                  Share & Earn{" "}
                  <span className="font-serif italic text-red-400 font-semibold">Rewards</span>
                </h1>
                <p className="text-white/50 text-sm max-w-md mt-3">
                  Invite friends, earn <span className="text-red-400">Rewards per referral</span>. Track earnings in real time.
                </p>
                <button
                  onClick={() => navigate("/profile") || handleActiveButton("referral")}
                  className="mt-6 bg-gradient-to-r from-red-500 to-red-600 text-white px-6 py-2.5 rounded-full font-semibold text-sm shadow-lg hover:shadow-amber-500/30 transition-all duration-300 inline-flex items-center gap-2"
                >
                  Get Your Link <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-5 w-full max-w-sm">
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
                  <span className="text-white/60 text-xs uppercase tracking-wider">Referral Stats</span>
                  <span className="text-red-600 text-[10px] font-mono">LIVE</span>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-white/50 text-xs">Your Code</span>
                    <div className="flex items-center gap-2">
                      <code className="bg-white/10 px-2 py-1 rounded text-red-400 text-xs font-mono">
                        {user?.myreferralCode}
                      </code>
                      <button onClick={() => copyToClipboard(user?.myreferralCode)} className="p-1 rounded bg-white/10 hover:bg-white/20">
                        <Copy className="w-3 h-3 text-white/60" />
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white/50 text-xs">Referrals</span>
                    <span className="text-white font-semibold text-sm">
                      <CountUp value={user?.referralCount || 0} /> / 10
                    </span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px]">
                      <span className="text-white/50">Progress</span>
                      <span className="text-red-400">{Math.min(100, ((user?.referralCount || 0) / 10) * 100)}%</span>
                    </div>
                    <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-red-500 to-red-600 rounded-full transition-all duration-500" style={{ width: `${Math.min(100, ((user?.referralCount || 0) / 10) * 100)}%` }} />
                    </div>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-white/10">
                    <span className="text-white/50 text-xs">Earnings</span>
                    <span className="text-red-400 font-bold text-lg">₹<CountUp value={user?.referralEarnings || 0} /></span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works - 3 cards in a single row on ALL devices (including mobile) */}
        <section className="px-4 py-12 max-w-7xl mx-auto">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-100 text-red-700 text-[10px] font-semibold tracking-wide mb-4">
              <Shield className="w-3 h-3" /> SIMPLE PROCESS
            </div>
            <h2 className="text-2xl font-serif text-neutral-900">How It Works</h2>
          </div>

          {/* Three columns forced on all screens, with responsive padding/text sizes */}
          <div className="grid grid-cols-3 gap-2 sm:gap-6">
            {[
              { icon: <Share2 className="w-4 h-4 sm:w-5 sm:h-5" />, title: "Share Link", desc: "Send your unique referral link to friends" },
              { icon: <UserPlus className="w-4 h-4 sm:w-5 sm:h-5" />, title: "Friend Signs Up", desc: "They register using your link" },
              { icon: <Award className="w-4 h-4 sm:w-5 sm:h-5" />, title: "Earn Rewards", desc: "Get upto ₹100 credited to your wallet" },
            ].map((step, idx) => (
              <div key={idx} className="text-center p-2 sm:p-6 bg-white rounded-2xl border border-neutral-100 hover:border-amber-200 hover:shadow-lg transition">
                <div className="w-8 h-8 sm:w-12 sm:h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-1 sm:mb-3 text-amber-600">
                  {step.icon}
                </div>
                <h3 className="font-semibold text-neutral-800 text-xs sm:text-base mb-0.5 sm:mb-1">
                  {step.title}
                </h3>
                <p className="text-neutral-500 text-[10px] sm:text-sm leading-tight sm:leading-normal">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
    );
  }

  // Non-logged in view (sign-up prompt)
  return (
    <div className="w-full bg-neutral-50">
      <section className="relative bg-gradient-to-r from-neutral-900 to-neutral-800">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between w-full max-w-5xl mx-auto">
            {/* Left Side */}
            <div className="max-w-md text-center sm:text-left mx-auto sm:mx-0">
              <div className="inline-flex items-center gap-2 bg-red-500/10 rounded-full px-3 py-0.5 mb-2">
                <Gift className="w-3 h-3 text-red-400" />
                <span className="text-[9px] font-medium text-red-400 uppercase tracking-wider">
                  Limited Time
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-light text-white tracking-tight">
                Refer & Earn{" "}
                <span className="font-serif italic text-red-400 font-semibold">
                  ₹7500
                </span>
              </h1>
              <p className="text-white/50 text-xs sm:text-sm mt-1 max-w-md mx-auto sm:mx-0">
                Invite friends, earn rewards on every successful signup.
              </p>
            </div>

            {/* Right Side */}
            <div className="flex-shrink-0 mt-4 sm:mt-0 flex justify-center sm:justify-end">
              <button
                onClick={handleSignUp}
                className="bg-gradient-to-r from-red-500 to-red-600 text-white px-7 py-3 rounded-full font-semibold text-sm shadow-lg hover:shadow-amber-500/30 transition inline-flex items-center gap-2 whitespace-nowrap"
              >
                Sign Up <ArrowUpRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-12 max-w-7xl mx-auto">
        <div className="text-center mb-6 sm:mb-8">
          <h2 className="text-xl sm:text-2xl font-serif text-neutral-900">Why Join?</h2>
        </div>

        {/* 3 cards in a row on mobile as well */}
        <div className="grid grid-cols-3 gap-2 sm:gap-5">
          {[
            { icon: <Package className="w-4 h-4 sm:w-5 sm:h-5" />, title: "Referral Code", desc: "Share this code with friends" },
            { icon: <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />, title: "Special Offers", desc: "First order discount" },
            { icon: <Lock className="w-4 h-4 sm:w-5 sm:h-5" />, title: "Secure Payment", desc: "128‑bit SSL encryption" },
          ].map((feature, i) => (
            <div
              key={i}
              className="text-center p-2 sm:p-5 bg-white rounded-xl border border-amber-200 transition hover:shadow-md"
            >
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-1 sm:mb-2 text-amber-600">
                {feature.icon}
              </div>
              <h3 className="font-semibold text-neutral-800 text-[10px] sm:text-sm mb-0.5 sm:mb-1">
                {feature.title}
              </h3>
              <p className="hidden sm:block text-neutral-500 text-xs">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}