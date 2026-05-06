import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { store } from "./store/store.js";
import App from "./App.jsx";
import "./index.css";

// Import performance utilities
import { preconnect, enablePerformanceMonitoring, preloadResources } from "./utils/performance";

// Preconnect to important domains
preconnect([
  "https://fonts.googleapis.com",
  "https://fonts.gstatic.com",
]);

// ✅ Preload image correctly
// preloadResources([
//   { href: "/logo.webp", as: "image", type: "image/webp" },
// ]);

// Enable performance monitoring in development
if (import.meta.env.MODE === "development") {
  enablePerformanceMonitoring();
}

// Render app
const rootElement = document.getElementById("root");
const root = createRoot(rootElement);

root.render(
  <Provider store={store}>
    <App />
  </Provider>
);
