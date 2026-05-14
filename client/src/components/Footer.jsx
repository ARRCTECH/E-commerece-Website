"use client";

import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import {
  Facebook,
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
} from "lucide-react";
import { FaPinterest } from "react-icons/fa";

const Footer = () => {
  const { categories } = useSelector((state) => state.categories || {});

  const trust = [
    { Icon: Truck, title: "Free Shipping", sub: "On orders ₹999+" },
    { Icon: RotateCcw, title: "Easy Returns", sub: "7-day window" },
    { Icon: ShieldCheck, title: "Secure Checkout", sub: "100% protected" },
    { Icon: Headphones, title: "24/7 Support", sub: "Always here" },
  ];

  return (
    <footer className="relative isolate overflow-hidden bg-[#0b0b10] text-neutral-300">
      {/* Layered ambient lights */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-48 left-1/2 h-[520px] w-[820px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(244,63,94,0.18),transparent_70%)] blur-2xl" />
        <div className="absolute -bottom-40 -left-24 h-[360px] w-[360px] rounded-full bg-[radial-gradient(closest-side,rgba(217,119,6,0.18),transparent_70%)] blur-3xl" />
        <div className="absolute -bottom-32 -right-24 h-[400px] w-[400px] rounded-full bg-[radial-gradient(closest-side,rgba(236,72,153,0.16),transparent_70%)] blur-3xl" />
        {/* subtle grid */}
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.6) 1px, transparent 1px)",
            backgroundSize: "44px 44px",
            maskImage:
              "radial-gradient(ellipse at center, black 35%, transparent 75%)",
          }}
        />
      </div>

      {/* Top hairline */}
      <div className="h-px w-full bg-gradient-to-r from-transparent via-rose-400/60 to-transparent" />

      {/* ============ Trust Strip ============ */}
      <div className="border-b border-white/5 bg-white/[0.015] backdrop-blur-sm">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-px overflow-hidden md:grid-cols-4">
          {trust.map(({ Icon, title, sub }) => (
            <div
              key={title}
              className="group flex items-center gap-3 px-5 py-5 transition hover:bg-white/[0.03] sm:px-7"
            >
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-white/10 bg-gradient-to-br from-white/[0.08] to-white/[0.02] text-rose-300 shadow-inner shadow-white/5 transition group-hover:border-rose-400/40 group-hover:text-rose-200">
                <Icon className="h-4.5 w-4.5" strokeWidth={1.6} />
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-white">
                  {title}
                </p>
                <p className="truncate text-[11px] uppercase tracking-[0.14em] text-neutral-500">
                  {sub}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="relative mx-auto max-w-7xl px-6 sm:px-10 lg:px-12 pt-16 pb-10">
        {/* ============ Editorial Newsletter ============ */}
       

        {/* ============ Main Grid ============ */}
        <div className="grid gap-12 lg:grid-cols-12">
          {/* Brand */}
          <div className="lg:col-span-4">
            <Link to="/" className="group inline-flex items-baseline gap-2">
              <span className="font-serif text-3xl tracking-tight text-white">
                Factory 
              </span>
              <span className="font-serif text-3xl italic tracking-tight bg-gradient-to-r from-rose-300 to-amber-200 bg-clip-text text-transparent">
                Sale
              </span>
              <span className="ml-1 text-[10px] font-medium uppercase tracking-[0.3em] text-neutral-500">
                ®
              </span>
            </Link>

            <p className="mt-5 max-w-sm text-sm leading-relaxed text-neutral-400">
              An independent fashion house pairing considered design with
              honest pricing. Crafted in India, worn everywhere.
            </p>

            {/* Socials */}
            <div className="mt-7">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-neutral-500">
                Follow the house
              </p>
              <div className="mt-3 flex items-center gap-2.5">
                {[
                  { Icon: Facebook, href: "#", label: "Facebook" },
                  { Icon: Instagram, href: "#", label: "Instagram" },
                  {
                    Icon: FaPinterest,
                    href: "https://www.pinterest.com/@FactorySale",
                    label: "Pinterest",
                    external: true,
                  },
                  { Icon: Youtube, href: "#", label: "YouTube" },
                ].map(({ Icon, href, label, external }) => (
                  <a
                    key={label}
                    href={href}
                    aria-label={label}
                    target={external ? "_blank" : undefined}
                    rel={external ? "noreferrer" : undefined}
                    className="group relative grid h-10 w-10 place-items-center overflow-hidden rounded-full border border-white/10 bg-white/[0.03] text-neutral-300 transition hover:-translate-y-0.5 hover:border-rose-400/50 hover:text-white"
                  >
                    <span className="absolute inset-0 translate-y-full bg-gradient-to-br from-rose-500 to-red-600 transition-transform duration-300 group-hover:translate-y-0" />
                    <Icon className="relative h-4 w-4" />
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Link columns */}
          <div className="lg:col-span-8 grid grid-cols-2 gap-10 sm:grid-cols-3">
            {/* Categories */}
            <div>
              <FooterHeading>Boutique</FooterHeading>
              <ul className="mt-6 space-y-3.5 text-[13.5px]">
                {categories?.length > 0 ? (
                  categories.slice(0, 6).map((cat) => (
                    <li key={cat._id || cat.name}>
                      <FooterLink to={`/category/${cat.slug || cat._id}`}>
                        {cat.name}
                      </FooterLink>
                    </li>
                  ))
                ) : (
                  <li className="text-neutral-500">Loading…</li>
                )}
              </ul>
            </div>

            {/* Quick Links */}
            <div>
              <FooterHeading>The House</FooterHeading>
              <ul className="mt-6 space-y-3.5 text-[13.5px]">
                <li><FooterLink to="/about">About Us</FooterLink></li>
                <li><FooterLink to="/contact">Contact</FooterLink></li>
                <li><FooterLink to="/shipping">Shipping Info</FooterLink></li>
                <li><FooterLink to="/returns">Returns</FooterLink></li>
              </ul>
            </div>

            {/* Contact */}
            <div className="col-span-2 sm:col-span-1">
              <FooterHeading>Atelier</FooterHeading>
              <ul className="mt-6 space-y-4 text-[13.5px]">
                <li className="flex items-start gap-3 text-neutral-400">
                  <ContactIcon><MapPin className="h-3.5 w-3.5" /></ContactIcon>
                  <span className="pt-1.5">Delhi, India</span>
                </li>
                <li>
                  <a
                    href="tel:9211891719"
                    className="flex items-start gap-3 text-neutral-400 transition hover:text-white"
                  >
                    <ContactIcon><Phone className="h-3.5 w-3.5" /></ContactIcon>
                    <span className="pt-1.5">+91 9211 891 719</span>
                  </a>
                </li>
                <li>
                  <a
                    href="mailto:support@FactorySale.com"
                    className="flex items-start gap-3 break-all text-neutral-400 transition hover:text-white"
                  >
                    <ContactIcon><Mail className="h-3.5 w-3.5" /></ContactIcon>
                    <span className="pt-1.5">support@FactorySale.com</span>
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Oversize wordmark */}
        <div className="pointer-events-none mt-16 select-none overflow-hidden">
          <p className="bg-gradient-to-b from-white/[0.07] to-transparent bg-clip-text text-center font-serif text-[18vw] leading-[0.85] tracking-tight text-transparent sm:text-[14vw] lg:text-[160px]">
            Factory  Sale
          </p>
        </div>

        {/* ============ Bottom Bar ============ */}
        <div className="mt-6 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-6 sm:flex-row">
          <p className="text-[11px] uppercase tracking-[0.2em] text-neutral-500">
            © {new Date().getFullYear()} Factory  Sale · All rights reserved
          </p>
          <div className="flex items-center gap-5 text-[11px] uppercase tracking-[0.2em] text-neutral-500">
            <Link to="/privacy" className="transition hover:text-white">Privacy</Link>
            <span className="h-3 w-px bg-white/10" />
            <Link to="/terms" className="transition hover:text-white">Terms</Link>
            <span className="h-3 w-px bg-white/10" />
            <span className="inline-flex items-center gap-1.5">
              Made with <span className="text-rose-400">♥</span> in India
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

/* ---------- Small presentational helpers ---------- */
const FooterHeading = ({ children }) => (
  <div>
    <h3 className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white">
      {children}
    </h3>
    <span className="mt-2 block h-px w-10 bg-gradient-to-r from-rose-400 via-rose-400/60 to-transparent" />
  </div>
);

const FooterLink = ({ to, children }) => (
  <Link
    to={to}
    className="group/link inline-flex items-center gap-1.5 text-neutral-400 transition hover:text-white"
  >
    <span className="relative">
      {children}
      <span className="absolute -bottom-0.5 left-0 h-px w-0 bg-gradient-to-r from-rose-400 to-amber-300 transition-all duration-300 group-hover/link:w-full" />
    </span>
    <ArrowUpRight className="h-3 w-3 -translate-y-0.5 -translate-x-1 opacity-0 transition group-hover/link:translate-x-0 group-hover/link:opacity-100 group-hover/link:text-rose-300" />
  </Link>
);

const ContactIcon = ({ children }) => (
  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-white/10 bg-gradient-to-br from-white/[0.08] to-white/[0.02] text-rose-300">
    {children}
  </span>
);

export default Footer;
