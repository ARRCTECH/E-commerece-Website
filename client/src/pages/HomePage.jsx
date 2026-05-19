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
const HomePage = () => {
  return (
    <div className="flex flex-col">
      <PromoBanners />
      <HeroBanner />
      <FeaturedCategories />
      <CategoryBanner />
      <TrendingProducts />
      <ReferralProgram />
      <NewArrivals />
      <InnovationList />
      <Oversized899 />
      <InnovationList />
    </div>
  );
};
export default HomePage;