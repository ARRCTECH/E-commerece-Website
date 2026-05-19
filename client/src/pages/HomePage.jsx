"use client";
import HeroBanner from "../components/HeroBanner";
import FeaturedCategories from "../components/FeaturedCategories";
import TrendingProducts from "../components/TrendingProducts";
import NewArrivals from "../components/NewArrivals";
import Oversized899 from "../components/Oversized899";
import PromoBanners from "../components/PromoBanners";
import CategoryBanner from "../components/CategoryBanner";
import InnovationList from "../components/admin/InnovationList";
import ReferralProgram from "../components/Referral-program";
import D2CHighlight from "../components/D2CHighlight";

const HomePage = () => {
  return (
    <div className="flex flex-col">
      <PromoBanners />
            <HeroBanner />
<D2CHighlight/>
      {/* <FlatDiscount /> */}
      <FeaturedCategories />
      <HeroBanner />
      <TrendingProducts />
      {/* <KsauniTshirtStyle /> */}
      {/* <PriceSelection /> */}
      <NewArrivals />
      <CategoryBanner />
      <Oversized899 />
      <ReferralProgram />
      <InnovationList />
      {/* <TopPicksShowcase/> */}
      {/* <FandomShop /> */}
    </div>
  );
};
export default HomePage;