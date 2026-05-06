import { useLocation } from "react-router-dom";
export const useProductDetailPage = () => {
  const location = useLocation();
  const isProductDetailPage = location.pathname.startsWith("/product/");
  return isProductDetailPage;
};