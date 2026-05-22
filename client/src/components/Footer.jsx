"use client";

import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { useState } from "react";
import {
  Facebook,
  ChevronDown,
  Instagram,
  Youtube,
  Mail,
  Phone,
  MapPin,
  ArrowUpRight,
  Send,
  ShieldCheck,
  Truck,
  RotateCcw,
  Headphones,
  Sparkles,
} from "lucide-react";
import { FaPinterest } from "react-icons/fa";

const Footer = () => {
  const { categories } = useSelector((state) => state.categories || {});
  const [showShopMenu, setShowShopMenu] = useState(false);
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const trust = [
    { Icon: Truck, title: "Free Shipping", sub:"all orders free shipping" },
    { Icon: RotateCcw, title: "Easy Returns", sub: "7-day window" },
    { Icon: ShieldCheck, title: "Secure Checkout", sub: "100% protected" },
    { Icon: Headphones, title: "24/7 Support", sub: "Always here" },
  ];

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setEmail("");
      setTimeout(() => setSubscribed(false), 3000);
    }
  };

  return (
    <footer className="relative isolate overflow-hidden bg-[#0a0a0c] text-neutral-300">
      {/* Premium ambient lights */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-48 left-1/2 h-[520px] w-[820px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(244,63,94,0.12),transparent_70%)] blur-2xl" />
        <div className="absolute -bottom-40 -left-24 h-[360px] w-[360px] rounded-full bg-[radial-gradient(closest-side,rgba(217,119,6,0.12),transparent_70%)] blur-3xl" />
        <div className="absolute -bottom-32 -right-24 h-[400px] w-[400px] rounded-full bg-[radial-gradient(closest-side,rgba(236,72,153,0.1),transparent_70%)] blur-3xl" />

        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.4) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
      </div>

      {/* Top gradient line */}
      <div className="h-px w-full bg-gradient-to-r from-transparent via-rose-500/50 to-transparent" />

      {/* ============ Trust Strip ============ */}
      <div className="border-b border-white/5 bg-white/[0.02] backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-px overflow-hidden md:grid-cols-4">
            {trust.map(({ Icon, title, sub }) => (
              <div
                key={title}
                className="group flex items-center gap-3 px-4 py-4 transition hover:bg-white/[0.03] sm:px-6"
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-white/10 bg-gradient-to-br from-white/[0.08] to-white/[0.02] text-rose-400 transition group-hover:border-rose-500/40 group-hover:text-rose-300">
                  <Icon className="h-4 w-4" strokeWidth={1.6} />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-white">
                    {title}
                  </p>
                  <p className="truncate text-[10px] uppercase tracking-[0.14em] text-neutral-500">
                    {sub}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-12 pb-8">

        {/* ============ Main Grid ============ */}
        <div className="grid gap-10 lg:grid-cols-12">
          {/* Brand Section */}
          <div className="lg:col-span-4">
            <Link to="/" className="group inline-flex items-baseline gap-2">
              <span className="font-serif text-2xl tracking-tight text-white sm:text-3xl">
                Factory
              </span>
              <span className="font-serif text-2xl italic tracking-tight bg-gradient-to-r from-rose-400 to-amber-300 bg-clip-text text-transparent sm:text-3xl">
                Sale
              </span>
              <span className="ml-1 text-[9px] font-medium uppercase tracking-[0.3em] text-neutral-600">
                ®
              </span>
            </Link>

            <p className="mt-4 max-w-sm text-[13px] leading-relaxed text-neutral-400">
              An independent fashion house pairing considered design with
              honest pricing. Crafted in India, worn everywhere.
            </p>

            {/* Social Links */}
            <div className="mt-6">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-neutral-500">
                Follow the house
              </p>
              <div className="mt-3 flex items-center gap-2">
                {[
                  { Icon: Facebook, href: "https://www.facebook.com/profile.php?id=61568941858515&mibextid=ZbWKwL", label: "Facebook" },
                  { Icon: Instagram, href: "https://www.instagram.com/factorysaleusa?utm_source=qr&igsh=Nm9uNnFjdjhqNnBm", label: "Instagram" },
                  { Icon: Youtube, href: "https://youtube.com/@factorysale-r5n?si=_4Kz0Y4c_xY_mQeu", label: "YouTube" },
                ].map(({ Icon, href, label }) => (
                  <a
                    key={label}
                    href={href}
                    aria-label={label}
                    target="_blank"
                    rel="noreferrer"
                    className="group relative grid h-9 w-9 place-items-center overflow-hidden rounded-full border border-white/10 bg-white/[0.03] text-neutral-300 transition hover:-translate-y-0.5 hover:border-rose-500/50 hover:text-white"
                  >
                    <span className="absolute inset-0 translate-y-full bg-gradient-to-br from-rose-500 to-rose-600 transition-transform duration-300 group-hover:translate-y-0" />
                    <Icon className="relative h-3.5 w-3.5" />
                  </a>
                ))}
              </div>
            </div>
          </div>
          <div className="block md:hidden w-full border-t border-white/10 pt-4">
            <button
              onClick={() => setShowShopMenu(!showShopMenu)}
              className="flex w-full items-center justify-between text-left"
            >
              <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-white">Shop</h3>
              <ChevronDown className={`h-4 w-4 text-neutral-400 transition-transform duration-300 ${showShopMenu ? "rotate-180" : ""}`} />
            </button>

            {showShopMenu && (
              <div className="mt-3 space-y-2 pb-2 max-h-60 overflow-y-auto">
                {categories?.length > 0 ? (
                  categories.slice(0, 10).map((cat) => (
                    <Link
                      key={cat._id || cat.name}
                      to={`/products?category=${cat.slug || cat._id}`}
                      className="block py-2 text-sm text-neutral-400 transition hover:text-rose-400 border-b border-white/5 last:border-0"
                      onClick={() => setShowShopMenu(false)}
                    >
                      {cat.name}
                    </Link>
                  ))
                ) : (
                  <p className="text-sm text-neutral-500 py-2">Loading...</p>
                )}
              </div>
            )}
          </div>

          {/* Link Columns */}
          <div className="lg:col-span-8 grid grid-cols-2 gap-8 sm:grid-cols-3">
            {/* Categories */}
            <div className="hidden sm:block">
              <FooterHeading>Shop</FooterHeading>
              <ul className="mt-5 space-y-2.5 text-[13px]">
                {categories?.length > 0 ? (
                  categories.slice(0, 6).map((cat) => (
                    <li key={cat._id || cat.name}>
                      <FooterLink to={`/products?category=${cat.slug || cat._id}`}>
                        {cat.name}
                      </FooterLink>
                    </li>
                  ))
                ) : (
                  <li className="text-neutral-500">Loading…</li>
                )}
              </ul>
            </div>

            <div className="block md:hidden">
              <FooterHeading>Connect</FooterHeading>
              <ul className="mt-5 space-y-3 text-[13px]">
                <li className="flex items-start gap-3 text-neutral-400">
                  <ContactIcon><MapPin className="h-3.5 w-3.5" /></ContactIcon>
                  <span>ulhasnagar, India</span>
                </li>
                <li>
                  <a
                    href="tel:88301 55383"
                    className="flex items-start gap-3 text-neutral-400 transition hover:text-white"
                  >
                    <ContactIcon><Phone className="h-3.5 w-3.5" /></ContactIcon>
                    <span>+91 88301 55383</span>
                  </a>
                </li>
                <li>
                  <a
                    href="mailto:support@FactorySale.com"
                    className="flex items-start gap-3 break-all text-neutral-400 transition hover:text-white"
                  >
                    <ContactIcon><Mail className="h-3.5 w-3.5" /></ContactIcon>
                    <span>factorysaleusadata@gmail.com</span>
                  </a>
                </li>
              </ul>
            </div>

            {/* Quick Links */}
            <div>
              <FooterHeading>Company</FooterHeading>
              <ul className="mt-5 space-y-2.5 text-[13px]">
                <li><FooterLink to="/about">About Us</FooterLink></li>
                <li><FooterLink to="/contact">Contact</FooterLink></li>
                <li><FooterLink to="/shipping">Shipping Info</FooterLink></li>
                <li><FooterLink to="/returns">Returns</FooterLink></li>
                <li><FooterLink to="/faq">FAQs</FooterLink></li>
              </ul>
            </div>

            {/* Contact */}
            <div className="hidden sm:block col-span-2 sm:col-span-1">
              <FooterHeading>Connect</FooterHeading>
              <ul className="mt-5 space-y-3 text-[13px]">
                <li className="flex items-start gap-3 text-neutral-400">
                  <ContactIcon><MapPin className="h-3.5 w-3.5" /></ContactIcon>
                  <span>Ulhasnagar</span>
                </li>
                <li>
                  <a
                    href="tel:9211891719"
                    className="flex items-start gap-3 text-neutral-400 transition hover:text-white"
                  >
                    <ContactIcon><Phone className="h-3.5 w-3.5" /></ContactIcon>
                    <span>+91 8830155383</span>
                  </a>
                </li>
                <li>
                  <a
                    href="mailto:support@FactorySale.com"
                    className="flex items-start gap-3 break-all text-neutral-400 transition hover:text-white"
                  >
                    <ContactIcon><Mail className="h-3.5 w-3.5" /></ContactIcon>
                    <span>factorysaleusadata@gmail.com</span>
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-6 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-6 sm:flex-row">
          <p className="text-[10px] uppercase tracking-[0.2em] text-neutral-500">
            © {new Date().getFullYear()} Factory Sale · All rights reserved
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 text-[10px] uppercase tracking-[0.2em] text-neutral-500">
            <Link to="/privacy" className="transition hover:text-white">Privacy</Link>
            <span className="h-3 w-px bg-white/15" />
            <Link to="/terms" className="transition hover:text-white">Terms</Link>
            <span className="h-3 w-px bg-white/15" />
            <span className="inline-flex items-center gap-1.5">
              Made with <span className="text-rose-500 animate-pulse">♥</span> in India
            </span>
            <span className="h-3 w-px bg-white/15 hidden sm:inline-block" />
            <a
              href="https://arrctechie.in"
              target="_blank"
              rel="noopener noreferrer"
              className="transition hover:text-white inline-flex items-center gap-1"
            >
              Developed by <span className="font-medium text-rose-400">Arrc Techie</span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

/* ========== Helper Components ========== */
const FooterHeading = ({ children }) => (
  <div>
    <h3 className="text-[10px] font-semibold uppercase tracking-[0.24em] text-white">
      {children}
    </h3>
    <span className="mt-2 block h-px w-8 bg-gradient-to-r from-rose-500 to-amber-500" />
  </div>
);

const FooterLink = ({ to, children }) => (
  <Link
    to={to}
    className="group/link inline-flex items-center gap-1.5 text-neutral-400 transition hover:text-white"
  >
    <span className="relative">
      {children}
      <span className="absolute -bottom-0.5 left-0 h-px w-0 bg-gradient-to-r from-rose-400 to-amber-400 transition-all duration-300 group-hover/link:w-full" />
    </span>
    <ArrowUpRight className="h-3 w-3 -translate-y-0.5 -translate-x-1 opacity-0 transition group-hover/link:translate-x-0 group-hover/link:opacity-100 group-hover/link:text-rose-400" />
  </Link>
);

const ContactIcon = ({ children }) => (
  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-white/10 bg-gradient-to-br from-white/[0.06] to-white/[0.02] text-rose-400">
    {children}
  </span>
);

export default Footer;
