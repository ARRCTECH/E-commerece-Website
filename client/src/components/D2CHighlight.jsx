import { Factory, Truck, ShieldCheck, ArrowUpRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function D2CHighlight() {
  const navigate = useNavigate();

  const steps = [
    { icon: Factory, title: "Make", desc: "In-house" },
    { icon: ShieldCheck, title: "Price", desc: "No markup" },
    { icon: Truck, title: "Ship", desc: "48hr" },
  ];

  const handleShopNow = () => {
    navigate("/products");
  };

  const handleOurStory = () => {
    navigate("/about");
  };

  return (
    <section className="overflow-hidden bg-[#f5f1ea] text-neutral-900 font-sans relative">
      {/* Ambient warm glow effects */}
      <div className="pointer-events-none absolute -top-32 left-1/2 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(212,175,55,0.25),transparent_70%)] blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-[300px] w-[300px] rounded-full bg-[radial-gradient(circle,rgba(200,150,90,0.18),transparent_70%)] blur-3xl" />

      <div className="mx-auto flex max-w-7xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="flex flex-1 flex-col items-center justify-center py-12 text-center sm:py-16 lg:py-20">
          <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-neutral-900/10 bg-white/60 px-3 py-1 text-[9px] uppercase tracking-[0.25em] text-neutral-600 backdrop-blur">
            <span className="h-1 w-1 rounded-full bg-[#b8902c]" />
            Direct to you
          </span>

          <h1 className="font-serif text-[clamp(2.25rem,11vw,4.5rem)] font-light leading-[0.95] tracking-tight text-neutral-900">
            Factory{" "}
            <em className="bg-gradient-to-r from-[#c9a14a] via-[#b8902c] to-[#8a6a1f] bg-clip-text not-italic text-transparent">
              fresh.
            </em>
            <br />
            <span className="text-neutral-700">Retail</span>{" "}
            <span className="italic text-neutral-400">free.</span>
          </h1>

          <p className="mt-5 max-w-xs text-xs leading-relaxed text-neutral-500 sm:text-sm lg:max-w-md">
            No middlemen. Just quality products at fair prices.
          </p>

          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:gap-4">
            <button
              onClick={handleShopNow}
              className="group inline-flex items-center gap-2 rounded-full bg-neutral-900 px-6 py-3 text-xs font-medium text-white transition-all hover:bg-[#b8902c] hover:shadow-lg"
            >
              Shop now
              <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </button>
            <button
              onClick={handleOurStory}
              className="text-[10px] uppercase tracking-[0.25em] text-neutral-500 underline-offset-8 transition-all hover:text-neutral-900 hover:underline"
            >
              Our story
            </button>
          </div>
        </div>

        {/* Process Cards — 3 columns on ALL screen sizes (including mobile) */}
        <div className="mt-auto grid grid-cols-3 gap-2 sm:gap-4">
          {steps.map((step, i) => (
            <div
              key={step.title}
              className="group relative overflow-hidden rounded-xl border border-neutral-900/10 bg-white/70 p-3 backdrop-blur-sm transition-all hover:border-[#b8902c]/50 hover:bg-white hover:shadow-md sm:p-5"
            >
              <div className="flex items-center justify-between">
                <step.icon
                  className="h-4 w-4 text-[#b8902c] sm:h-6 sm:w-6"
                  strokeWidth={1.5}
                />
                <span className="font-serif text-[10px] italic text-neutral-400 sm:text-sm">
                  0{i + 1}
                </span>
              </div>
              <h3 className="mt-2 font-serif text-lg font-light text-neutral-900 sm:mt-3 sm:text-2xl lg:text-3xl">
                {step.title}
              </h3>
              <p className="mt-0.5 text-[8px] uppercase tracking-[0.2em] text-neutral-500 sm:mt-1 sm:text-xs">
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}