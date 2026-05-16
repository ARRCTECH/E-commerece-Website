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
  Mail,
  Facebook,
  Twitter,
  Linkedin,
  Send,
  TrendingUp,
  Award,
  UserPlus,
  CheckCircle,
  Share2,
  Users,
  Wallet,
} from "lucide-react";
import { motion, useInView } from "framer-motion";
import { getProfile } from "../store/slices/authSlice";

// CountUp component with proper React imports
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

  // Logged-in user with referral code
  if (user && user.myreferralCode) {
    const referralLink = `${window.location.origin}/register?ref=${user.myreferralCode}`;
    const shareText = "Join me on this platform and get exclusive rewards! 🎁";

    const copyToClipboard = (text) => {
      navigator.clipboard.writeText(text);
      toast.success("Copied to clipboard!");
    };

    const shareUrls = {
      whatsapp: `https://wa.me/?text=${encodeURIComponent(`${shareText} ${referralLink}`)}`,
      telegram: `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent(shareText)}`,
      email: `mailto:?subject=${encodeURIComponent("Join me")}&body=${encodeURIComponent(`${shareText}\n\n${referralLink}`)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralLink)}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(`${shareText} ${referralLink}`)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(referralLink)}`,
    };

    const handleActiveButton = (id) => {
      localStorage.setItem("activeButton", id);
    }

    return (
      <div className="w-full bg-neutral-50">
        {/* Hero Section with Glass Effect */}
        <section className="relative bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.03)_1px,_transparent_1px)] bg-[length:20px_20px]" />
          <div className="absolute top-0 -right-32 w-72 h-72 bg-amber-500 rounded-full blur-[100px] opacity-20" />
          <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-amber-600 rounded-full blur-[120px] opacity-20" />

          <div className="relative px-4 py-12 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
              <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
                <div className="flex items-center gap-5">
                  <div className="relative">
                    <div className="absolute inset-0 bg-amber-500 rounded-full blur-xl opacity-50 animate-pulse" />
                    <div className="relative bg-gradient-to-br from-amber-400 to-amber-600 rounded-full p-4 shadow-xl">
                      <UserPlus className="w-8 h-8 text-white" />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-3 flex-wrap mb-2">
                      <span className="text-xs font-bold tracking-wider text-amber-400 uppercase bg-white/10 px-3 py-1 rounded-full backdrop-blur-sm">
                        Your Referral Club
                      </span>
                      <span className="text-xs font-medium text-white/60 flex items-center gap-1">
                        <Crown className="w-3 h-3 text-amber-400" />
                        Active Member
                      </span>
                    </div>
                    <h1 className="text-white text-3xl sm:text-4xl lg:text-5xl font-light tracking-tight">
                      <span className="font-serif italic text-amber-400 font-semibold">Share & Earn</span>{" "}
                      <span className="text-white/90">rewards</span>
                    </h1>
                    <p className="text-white/50 text-sm max-w-md mt-2">
                      Invite friends, get up to <strong className="text-amber-400">₹500 per referral</strong>.
                      Track your earnings in real time.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => navigate("/profile") || handleActiveButton("referral")}
                  className="group relative overflow-hidden bg-gradient-to-r from-amber-500 to-amber-600 text-white px-6 py-3 font-semibold rounded-full shadow-lg hover:shadow-amber-500/30 transition-all duration-300 flex items-center gap-2 text-sm"
                >
                  <span>Get Your Referral Link</span>
                  <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition" />
                </button>
              </div>
            </div>
          </div>
        </section>
        {/* How It Works */}
        <section className="px-4 py-16 sm:px-6 lg:px-8 bg-white">
          <div className="max-w-7xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-100 text-amber-700 text-xs font-semibold tracking-wide mb-6">
              <Shield className="w-3.5 h-3.5" />
              SIMPLE PROCESS
            </div>
            <h2 className="text-3xl sm:text-4xl font-serif text-neutral-900 mb-4">
              How <span className="text-amber-600">It Works</span>
            </h2>
            <p className="text-neutral-500 max-w-2xl mx-auto mb-12">
              Three easy steps to start earning rewards
            </p>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                { icon: <Share2 />, title: "Share Your Link", desc: "Send your unique referral link to friends via social media, email, or direct message." },
                { icon: <UserPlus />, title: "Friend Signs Up", desc: "They register using your link and get a welcome discount." },
                { icon: <Award />, title: "Earn Rewards", desc: "You receive rewards instantly credited to your account balance." },
              ].map((step, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  viewport={{ once: true }}
                  className="group relative bg-neutral-50 rounded-2xl p-8 border border-neutral-100 hover:border-amber-200 hover:shadow-xl transition-all duration-300"
                >
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-amber-500 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shadow-lg">
                    {idx + 1}
                  </div>
                  <div className="text-amber-500 w-12 h-12 mx-auto mb-4 group-hover:scale-110 transition">
                    {step.icon}
                  </div>
                  <h3 className="text-xl font-semibold text-neutral-800 mb-2">{step.title}</h3>
                  <p className="text-neutral-500 text-sm">{step.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </div>
    );
  }

  // Non-logged-in marketing version with interactive mock
  return (
    <div className="w-full bg-neutral-50">
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.03)_1px,_transparent_1px)] bg-[length:20px_20px]" />
        <div className="relative px-4 py-16 sm:px-6 lg:px-8 text-center">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-1.5 mb-6"
            >
              <Gift className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-medium text-white">Limited time offer</span>
            </motion.div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-light text-white tracking-tight">
              Refer & Earn <span className="font-serif italic text-amber-400 font-semibold">₹7500</span>
            </h1>
            <p className="text-white/60 text-lg max-w-2xl mx-auto mt-4 mb-8">
              Invite your friends, earn rewards on every successful signup.
              They get a welcome bonus, you get credits.
            </p>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSignUp}
              className="bg-gradient-to-r from-amber-500 to-amber-600 text-white px-8 py-4 rounded-full font-semibold shadow-xl hover:shadow-amber-500/30 transition flex items-center gap-2 mx-auto"
            >
              Sign Up <ArrowUpRight className="w-4 h-4" />
            </motion.button>
          </div>
        </div>
      </section>

      {/* Feature Cards */}
      <section className="px-4 py-20 max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-serif text-neutral-900">Why join our referral program?</h2>
          <p className="text-neutral-500 mt-2">Exclusive perks for early members</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { icon: <Package />, title: "Referral Code", value: "SHOPWITH10", desc: "Share this code with friends" },
            { icon: <Sparkles />, title: "Special Offers", desc: "App‑only deals & first order discount" },
            { icon: <Lock />, title: "Secure Payment", desc: "128‑bit SSL encryption" },
          ].map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              viewport={{ once: true }}
              className="bg-white rounded-2xl p-8 text-center border border-neutral-200 shadow-sm hover:shadow-lg transition"
            >
              <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4 text-amber-600">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              {feature.value && (
                <div className="bg-neutral-100 inline-block px-4 py-1 rounded-full text-sm font-mono text-amber-700 mb-3">
                  {feature.value}
                </div>
              )}
              <p className="text-neutral-500 text-sm">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}