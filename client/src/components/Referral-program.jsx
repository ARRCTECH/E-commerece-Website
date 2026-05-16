"use client";

import { useEffect } from "react";
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
  MessageCircle,
  Mail,
  Facebook,
  Twitter,
  Linkedin,
  Send,
  TrendingUp,
  Award,
  UserPlus,
  Calendar,
  Info,
} from "lucide-react";
import { motion } from "framer-motion";
import { getProfile } from "../store/slices/authSlice";
import { format } from "date-fns";

export default function ReferralProgram() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user, isLoading } = useSelector((state) => state.auth);

  // Always fetch fresh profile when logged in
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
    const shareText = "Join now using my referral link and get exciting rewards! 🚀";
    const shareUrls = {
      whatsapp: `https://wa.me/?text=${encodeURIComponent(`${shareText} ${referralLink}`)}`,
      email: `mailto:?subject=${encodeURIComponent("Join with my referral link")}&body=${encodeURIComponent(
        `${shareText}\n\n${referralLink}`
      )}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralLink)}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(`${shareText} ${referralLink}`)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(referralLink)}`,
      telegram: `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent(shareText)}`,
    };

    const copyToClipboard = () => {
      navigator.clipboard.writeText(referralLink);
      toast.success("Referral link copied to clipboard!");
    };

    return (
      <div className="w-full">
        {/* Premium Referral Banner - Personalized */}
        <section className="relative bg-gradient-to-r from-neutral-900 via-neutral-800 to-neutral-900 overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 -right-32 w-64 h-64 rounded-full bg-amber-500 blur-3xl" />
            <div className="absolute -bottom-32 -left-32 w-80 h-80 rounded-full bg-amber-600 blur-3xl" />
          </div>
          <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.02)_50%,transparent_75%)] bg-[size:20px_20px]" />

          <div className="relative px-4 py-10 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
              <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
                <div className="flex items-center gap-5 flex-1">
                  <div className="relative">
                    <div className="absolute inset-0 bg-amber-500 rounded-full blur-xl opacity-30" />
                    <div className="relative bg-gradient-to-br from-amber-400 to-amber-600 rounded-full p-3">
                      <UserPlus className="w-8 h-8 text-white" strokeWidth={1.5} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-[10px] font-bold tracking-[0.3em] text-amber-400 uppercase">
                        Your Referral Club
                      </span>
                      <div className="h-px w-8 bg-amber-500/50" />
                      <span className="text-[10px] font-medium text-white/60 uppercase flex items-center gap-1">
                        <Crown className="w-3 h-3 text-amber-400" />
                        Active Member
                      </span>
                    </div>
                    <h2 className="text-white text-2xl sm:text-3xl lg:text-4xl font-light tracking-tight">
                      <span className="font-serif italic text-amber-400 font-semibold">
                        Share & Earn
                      </span>{" "}
                      <span className="text-white/90">
                        with your code
                      </span>
                    </h2>
                    <p className="text-white/50 text-sm max-w-md">
                      Every friend you invite brings rewards. Track your earnings and unlock exclusive benefits.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Personalized Referral Content */}
        <section className="relative bg-white overflow-hidden">
          <div className="absolute inset-0 bg-[linear-gradient(60deg,#faf9f6_1px,transparent_1px),linear-gradient(-60deg,#faf9f6_1px,transparent_1px)] bg-[size:40px_40px]" />

          <div className="relative px-4 py-16 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
              {/* Stats Row */}
              {(user.totalReferrals !== undefined || user.referralEarnings !== undefined) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                  {user.totalReferrals !== undefined && (
                    <div className="bg-gradient-to-br from-neutral-50 to-white rounded-2xl p-6 text-center border border-neutral-100 shadow-sm">
                      <TrendingUp className="w-8 h-8 text-amber-500 mx-auto mb-3" />
                      <div className="text-3xl font-bold text-neutral-900">{user.totalReferrals}</div>
                      <div className="text-sm text-neutral-500 mt-1">Total Referrals</div>
                    </div>
                  )}
                  {user.referralEarnings !== undefined && (
                    <div className="bg-gradient-to-br from-neutral-50 to-white rounded-2xl p-6 text-center border border-neutral-100 shadow-sm">
                      <Award className="w-8 h-8 text-amber-500 mx-auto mb-3" />
                      <div className="text-3xl font-bold text-neutral-900">₹{user.referralEarnings}</div>
                      <div className="text-sm text-neutral-500 mt-1">Earned Rewards</div>
                    </div>
                  )}
                </div>
              )}

              {/* Additional Referral Info (from ProfilePage) */}
              {(user.referredBy || user.expireReferralDate) && (
                <div className="bg-amber-50/50 rounded-2xl p-5 mb-8 border border-amber-100">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    {user.referredBy && (
                      <div className="flex items-center gap-2 text-sm text-neutral-700">
                        <Info className="w-4 h-4 text-amber-600" />
                        <span>Invited by: <strong className="font-mono">{user.referredBy}</strong></span>
                      </div>
                    )}
                    {user.expireReferralDate && (
                      <div className="flex items-center gap-2 text-sm text-neutral-700">
                        <Calendar className="w-4 h-4 text-amber-600" />
                        <span>Code valid until: <strong>{format(new Date(user.expireReferralDate), "MMM dd, yyyy")}</strong></span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Referral Link Card */}
              <div className="bg-white rounded-2xl border border-neutral-200 shadow-lg overflow-hidden mb-10">
                <div className="p-6 md:p-8">
                  <h3 className="text-xl font-serif text-neutral-900 mb-2">Your Unique Referral Link</h3>
                  <p className="text-neutral-500 text-sm mb-5">Share this link with friends – they get a discount, you earn rewards!</p>

                  <div className="flex flex-col sm:flex-row gap-3 mb-6">
                    <input
                      type="text"
                      readOnly
                      value={referralLink}
                      className="flex-1 px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm text-neutral-700 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                    />
                    <button
                      onClick={copyToClipboard}
                      className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-neutral-900 to-neutral-800 text-white rounded-xl font-medium hover:shadow-lg transition-all"
                    >
                      <Copy className="w-4 h-4" />
                      Copy Link
                    </button>
                  </div>

                  <div className="text-center mb-6">
                    <span className="text-sm text-neutral-500">Your Referral Code: </span>
                    <span className="inline-block px-3 py-1 bg-amber-50 text-amber-700 font-mono font-bold rounded-lg text-sm tracking-wider">
                      {user.myreferralCode}
                    </span>
                  </div>

                  {/* Social Share Grid (same as ProfilePage) */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                    <a href={shareUrls.whatsapp} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 px-3 py-2.5 bg-neutral-50 hover:bg-neutral-100 rounded-xl text-neutral-700 text-sm font-medium transition border border-neutral-200">
                      <MessageCircle className="w-4 h-4" /> WhatsApp
                    </a>
                    <a href={shareUrls.email} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 px-3 py-2.5 bg-neutral-50 hover:bg-neutral-100 rounded-xl text-neutral-700 text-sm font-medium transition border border-neutral-200">
                      <Mail className="w-4 h-4" /> Email
                    </a>
                    <a href={shareUrls.facebook} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 px-3 py-2.5 bg-neutral-50 hover:bg-neutral-100 rounded-xl text-neutral-700 text-sm font-medium transition border border-neutral-200">
                      <Facebook className="w-4 h-4" /> Facebook
                    </a>
                    <a href={shareUrls.twitter} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 px-3 py-2.5 bg-neutral-50 hover:bg-neutral-100 rounded-xl text-neutral-700 text-sm font-medium transition border border-neutral-200">
                      <Twitter className="w-4 h-4" /> Twitter
                    </a>
                    <a href={shareUrls.linkedin} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 px-3 py-2.5 bg-neutral-50 hover:bg-neutral-100 rounded-xl text-neutral-700 text-sm font-medium transition border border-neutral-200">
                      <Linkedin className="w-4 h-4" /> LinkedIn
                    </a>
                    <a href={shareUrls.telegram} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 px-3 py-2.5 bg-neutral-50 hover:bg-neutral-100 rounded-xl text-neutral-700 text-sm font-medium transition border border-neutral-200">
                      <Send className="w-4 h-4" /> Telegram
                    </a>
                  </div>
                </div>
              </div>

              {/* How It Works Section */}
              <div className="text-center mb-10">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-neutral-100 mb-5">
                  <Shield className="w-3.5 h-3.5 text-amber-600" />
                  <span className="text-[9px] tracking-[0.3em] uppercase text-neutral-700 font-medium">
                    How It Works
                  </span>
                </div>
                <h3 className="text-2xl font-serif text-neutral-900 font-light">
                  <span className="font-semibold text-amber-600">Simple steps</span> to start earning
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="text-center p-6">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-100 text-amber-600 text-2xl font-bold mb-4">1</div>
                  <h4 className="font-semibold text-neutral-900 mb-2">Share Your Link</h4>
                  <p className="text-neutral-500 text-sm">Copy your unique referral link and share it with friends.</p>
                </div>
                <div className="text-center p-6">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-100 text-amber-600 text-2xl font-bold mb-4">2</div>
                  <h4 className="font-semibold text-neutral-900 mb-2">Friend Signs Up</h4>
                  <p className="text-neutral-500 text-sm">Your friend registers using your link and gets a discount.</p>
                </div>
                <div className="text-center p-6">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-100 text-amber-600 text-2xl font-bold mb-4">3</div>
                  <h4 className="font-semibold text-neutral-900 mb-2">Earn Rewards</h4>
                  <p className="text-neutral-500 text-sm">You instantly earn rewards credited to your account.</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  }

  // If user is not logged in, show original marketing version
  return (
    <div className="w-full">
      <section className="relative bg-gradient-to-r from-neutral-900 via-neutral-800 to-neutral-900 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 -right-32 w-64 h-64 rounded-full bg-amber-500 blur-3xl" />
          <div className="absolute -bottom-32 -left-32 w-80 h-80 rounded-full bg-amber-600 blur-3xl" />
        </div>
        <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.02)_50%,transparent_75%)] bg-[size:20px_20px]" />

        <div className="relative px-4 py-10 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
              <div className="flex items-center gap-5 flex-1">
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

      <section className="relative bg-white overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(60deg,#faf9f6_1px,transparent_1px),linear-gradient(-60deg,#faf9f6_1px,transparent_1px)] bg-[size:40px_40px]" />
        
        <div className="relative px-4 py-20 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                viewport={{ once: true }}
                className="group relative"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-amber-50 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative bg-white rounded-2xl p-8 text-center border border-neutral-100 group-hover:border-amber-200 transition-all duration-500 shadow-sm hover:shadow-xl">
                  <div className="relative inline-block mb-6">
                    <div className="absolute inset-0 bg-amber-400 rounded-full blur-xl opacity-20 group-hover:opacity-40 transition-opacity" />
                    <div className="relative bg-gradient-to-br from-neutral-900 to-neutral-800 rounded-full p-4 w-16 h-16 flex items-center justify-center">
                      <Package className="w-7 h-7 text-amber-400" strokeWidth={1.5} />
                    </div>
                  </div>
                  <h4 className="text-neutral-900 font-serif text-xl mb-3 font-medium">Referral Code</h4>
                  <div className="inline-block px-4 py-2 bg-neutral-50 rounded-lg mb-3">
                    <code className="text-sm font-mono text-amber-600 tracking-wider">SHOPWITH10</code>
                  </div>
                  <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 w-8 h-px bg-amber-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </motion.div>

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
                  <h4 className="text-neutral-900 font-serif text-xl mb-3 font-medium">Special Offers</h4>
                  <p className="text-neutral-500 text-sm leading-relaxed">
                    on your first mobile app order<br />
                    <span className="text-amber-600 font-medium">Exclusive app-only deals</span>
                  </p>
                </div>
              </motion.div>

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
                  <h4 className="text-neutral-900 font-serif text-xl mb-3 font-medium">Secure Payment</h4>
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
          </div>
        </div>
      </section>
    </div>
  );
}