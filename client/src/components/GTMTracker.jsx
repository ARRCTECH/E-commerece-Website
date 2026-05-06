import { useEffect } from "react";
import { useLocation, useParams } from "react-router-dom";

export default function GTMTracker() {
  const location = useLocation();

  useEffect(() => {
    window.dataLayer = window.dataLayer || [];

    const pageData = {
      event: "pageview",
      page: location.pathname + location.search,
    };

    // If route is product detail, also pass productId
    const productMatch = location.pathname.match(/^\/product\/([^/]+)/);
    if (productMatch) {
      pageData.pageType = "product";
      pageData.productId = productMatch[1];
    }

    window.dataLayer.push(pageData);

  }, [location]);

  return null;
}
