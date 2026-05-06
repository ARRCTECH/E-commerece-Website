"use client";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import HeroBanner from "../components/HeroBanner";
import PriceSelection from "../components/PriceSelection";
import FeaturedCategories from "../components/FeaturedCategories";
import TrendingProducts from "../components/TrendingProducts";
import FandomShop from "../components/FandomShop";
import NewArrivals from "../components/NewArrivals";
import Oversized899 from "../components/Oversized899";
import PromoBanners from "../components/PromoBanners";
import CategoryBanner from "../components/CategoryBanner";
import InnovationList from "../components/admin/InnovationList";
import KsauniTshirtStyle from "../components/admin/KsauniTshirtStyle";
import FeaturedHighlight from "../components/FeaturedHighlight";
import Testimonials from "../components/Testimonials";
import Popup from "../components/Popup";
import BrandIndia from "../components/BrandIndia";
import TopPicksShowcase from "../components/TopPicksShowCase";
import FlatDiscount from "../components/FlatDiscount";
import {
  fetchTrendingProducts,
  fetchNewArrivals,
  fetchProducts,
  fetchOversizedProducts
} from "../store/slices/productSlice";
import { fetchCategories } from "../store/slices/categorySlice";
import {
  fetchHeroBanners,
  fetchPromoBanners,
  fetchCategoryBanners,
} from "../store/slices/bannerSlice";
import { fetchPopupSetting } from "../store/slices/popupSlice";

const HomePage = () => {
  const dispatch = useDispatch();

  // Get necessary slices of state with safe defaults
  const {
    trendingProducts = [],
    newArrivals = [],
    oversizedProducts = [], // Add default value
  } = useSelector((state) => state.products) || {};

  const { categories = [] } = useSelector((state) => state.categories) || {};
  const {
    heroBanners = [],
    promoBanners = [],
    categoryBanners = []
  } = useSelector((state) => state.banners) || {};

  const { showSalePopup, popupBanners = [] } = useSelector((state) => state.popup) || {};

  const [popupVisible, setPopupVisible] = useState(false);
  const [popupBanner, setPopupBanner] = useState(null);

  // Fetch hero, promo and category banners only if not already loaded
  useEffect(() => {
    if (!heroBanners.length) {
      dispatch(fetchHeroBanners());
    }
    if (!promoBanners.length) {
      dispatch(fetchPromoBanners());
    }
    if (!categoryBanners.length) {
      dispatch(fetchCategoryBanners());
    }
  }, [dispatch, heroBanners.length, promoBanners.length, categoryBanners.length]);

  // Fetch categories only if not already loaded
  useEffect(() => {
    if (!categories.length) {
      dispatch(fetchCategories({ showOnHomepage: true }));
    }
  }, [dispatch, categories.length]);

  // Fetch trending, new arrival, oversized, and all products only if not already loaded
  useEffect(() => {
    if (!trendingProducts.length) {
      dispatch(fetchTrendingProducts());
    }
    if (!newArrivals.length) {
      dispatch(fetchNewArrivals());
    }
    if (!oversizedProducts.length) {
      dispatch(fetchOversizedProducts());
    }
    dispatch(fetchProducts());
  }, [dispatch, trendingProducts.length, newArrivals.length, oversizedProducts.length]);

  // Fetch popup setting on mount
  useEffect(() => {
    dispatch(fetchPopupSetting());
  }, [dispatch]);

  // Enhanced popup banner handling with better error management
  useEffect(() => {
    if (popupBanners.length > 0) {
      // Find the first active popup banner
      const activePopup = popupBanners.find(pb => pb.isActive);
      if (activePopup) {
        // Create a comprehensive list of all available banners
        const allBanners = [...heroBanners, ...promoBanners, ...categoryBanners];
        // Find banner details from all available banners
        const banner = allBanners.find(b => b._id === activePopup.bannerId);
        if (banner) {
          // Valid banner found
          setPopupBanner(banner);
          setPopupVisible(true);
        } else {
          // Banner not found - log for debugging but don't show popup
          console.warn(`Popup banner not found: bannerId ${activePopup.bannerId} is missing from all banner collections`);
          setPopupBanner(null);
          setPopupVisible(false);
        }
      } else {
        // No active popup found
        setPopupBanner(null);
        setPopupVisible(false);
      }
    } else {
      // No popup banners configured
      setPopupBanner(null);
      setPopupVisible(false);
    }
  }, [popupBanners, heroBanners, promoBanners, categoryBanners]);

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <PromoBanners />
      <FlatDiscount />
      <HeroBanner />
      <KsauniTshirtStyle />
      <PriceSelection />
      <FeaturedCategories />
      <TrendingProducts />

      {/* <TopPicksShowcase/> */}

      <FandomShop />
      <NewArrivals />
      <Oversized899 />
      <InnovationList />

      {/* Brand of India Banner - moved to last position before footer */}
      <div className="mx-auto w-full max-w-md sm:max-w-lg md:max-w-3xl lg:max-w-5xl xl:max-w-7xl 2xl:max-w-screen-2xl">
        <div className="my-8 bg-red-600">
          <BrandIndia />
        </div>
      </div>




      {popupVisible && popupBanner && (
        <Popup
          banner={popupBanner}
          visible={popupVisible}
          onClose={() => setPopupVisible(false)}
        />
      )}
    </div>
  );
};

export default HomePage;