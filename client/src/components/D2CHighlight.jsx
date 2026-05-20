import { useEffect, useState } from "react";
import { Factory, Truck, ShieldCheck, ArrowUpRight, Sparkles } from "lucide-react";

export default function D2CHighlight() {
  const [time, setTime] = useState(new Date());
  
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const steps = [
    { icon: Factory, title: "Make", desc: "In-house workshop" },
    { icon: ShieldCheck, title: "Price", desc: "No markup" },
    { icon: Truck, title: "Ship", desc: "48hr delivery" }
  ];

  return (
    <section className="min-h-screen bg-black text-white p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-16">
        
        </div>
        

      {/* Hero */}
      <div className="text-center mb-16">
        <h1 className="text-5xl sm:text-7xl font-bold mb-4">
          Factory <span className="text-purple-500">fresh.</span>
          <br />
          Retail free.
        </h1>
        <p className="text-gray-400 max-w-md mx-auto">
          No middlemen. Just quality products at fair prices.
        </p>
        
        <button className="mt-8 px-8 py-3 bg-purple-600 rounded-full font-semibold hover:bg-purple-700 inline-flex items-center gap-2">
          Shop now <ArrowUpRight className="h-4 w-4" />
        </button>
      </div>

      {/* Stats */}
      {/* <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto mb-16">
        {[
          { label: "Savings", value: "50%" },
          { label: "Delivery", value: "48h" },
          { label: "Middlemen", value: "0" },
          { label: "Customers", value: "25k+" }
        ].map(stat => (
          <div key={stat.label} className="text-center p-4 bg-white/5 rounded-xl">
            <div className="text-2xl font-bold text-purple-500">{stat.value}</div>
            <div className="text-xs text-gray-400">{stat.label}</div>
          </div>
        ))}
      </div> */}

      {/* Process */}
      <div className="grid sm:grid-cols-3 gap-4 max-w-4xl mx-auto">
        {steps.map((step, i) => (
          <div key={i} className="text-center p-4 bg-white/5 rounded-xl">
            <step.icon className="h-8 w-8 text-purple-500 mx-auto mb-3" />
            <h3 className="font-semibold">{step.title}</h3>
            <p className="text-sm text-gray-400">{step.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}