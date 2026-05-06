import { useNavigate } from "react-router-dom";
const ShopByFandom = () => {
  const navigate = useNavigate();
  const mockProducts = [
    { id: 1, name: "Joker", image: "/JOKER.webp" },
    { id: 2, name: "DeathNote", image: "/deathnote.webp" },
    { id: 3, name: "Naruto", image: "/NARUTO.webp" },
    { id: 4, name: "Attack on Titan", image: "/AttackonTitan.webp" },
    { id: 5, name: "Solo Leveling Shirt", image: "/SoloLeveling.webp" },
    { id: 6, name: "Kaijya", image: "/KaijuNo.webp" },
    { id: 7, name: "Venom", image: "/VENOM.webp" },
    { id: 8, name: "Zoro", image: "/ZORO.webp" },
    { id: 9, name: "Demon Slayer", image: "/demonslayer.webp" },
  ];
  const handleProductClick = () => {
    navigate("/products?category=anime-t-shirt");
  };
  return (
    <section className="bg-white">
      <div className="mb-4 text-center">
        <h3 className="text-xl font-black text-black sm:text-2xl md:text-2xl">
          SHOP BY <span className="text-red-600 italic">FANDOM</span>
        </h3>
        <p className="mt-1 text-sm text-gray-600 sm:text-base">
          Shop for every fandom. Every style.
        </p>
      </div>
      {/* Always horizontal scroll (mobile + desktop) */}
      <div className="relative">
        <div className="flex gap-4 overflow-x-auto scrollbar-thin scrollbar-thumb-red-600 scrollbar-track-gray-200 px-2 pb-1 scroll-px-4">
          {mockProducts.map((product) => (
            <div
              key={product.id}
              className="flex-shrink-0 cursor-pointer group w-[160px] sm:w-[200px] md:w-[220px] lg:w-[240px]"
              onClick={handleProductClick}
            >
              <div className="relative overflow-hidden transition-all duration-300 rounded-lg shadow-md hover:shadow-xl group-hover:scale-105">
                <img
                  src={product.image || "/placeholder.svg"}
                  alt=""
                  className="object-cover w-full h-[200px] sm:h-[240px] md:h-[280px] lg:h-[300px]"
                />
              </div>
            </div>
          ))}
        </div>
        {/* Scroll indicators */}
        <div className="absolute hidden md:flex items-center justify-between w-full top-1/2 -translate-y-1/2 pointer-events-none px-2">
          <div className="w-12 h-12 bg-gradient-to-r from-white to-transparent"></div>
          <div className="w-12 h-12 bg-gradient-to-l from-white to-transparent"></div>
        </div>
      </div>
    </section>
  );
};
export default ShopByFandom;