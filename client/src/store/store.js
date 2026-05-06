import { configureStore } from "@reduxjs/toolkit";
import { persistStore, persistReducer, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from "redux-persist";
import storage from "redux-persist/lib/storage";
import { errorMiddleware } from "./middleware/errorMiddleware";
import authReducer from "./slices/authSlice";
import productReducer from "./slices/productSlice";
import categoryReducer from "./slices/categorySlice";
import bannerReducer from "./slices/bannerSlice";
import cartReducer from "./slices/cartSlice";
import ordersReducer from "./slices/orderSlice";
import wishlistReducer from "./slices/wishlistSlice";
import reviewReducer from "./slices/reviewSlice";
import couponReducer from "./slices/couponSlice";
import returnReducer from "./slices/returnSlice";
import adminReducer from "./slices/adminSlice";
import digitalMarketerReducer from "./slices/digitalMarketerSlice";
import searchSlice from "./slices/searchSlice";
import popupReducer from "./slices/popupSlice";
import innovationReducer from "./slices/innovationSlice";
import ksauniTshirtReducer from "./slices/ksauniTshirtSlice";
const innovationPersistConfig = {
  key: "innovations",
  storage,
  whitelist: ["innovations"], // persist only the innovations array
};
const persistedInnovationReducer = persistReducer(innovationPersistConfig, innovationReducer);
export const store = configureStore({
  reducer: {
    auth: authReducer,
    products: productReducer,
    categories: categoryReducer,
    banners: bannerReducer,
    cart: cartReducer,
    orders: ordersReducer,
    wishlist: wishlistReducer,
    reviews: reviewReducer,
    coupons: couponReducer,
    returns: returnReducer,
    admin: adminReducer,
    digitalMarketer: digitalMarketerReducer,
    search: searchSlice,
    popup: popupReducer,
    innovations: persistedInnovationReducer,
    ksauniTshirt: ksauniTshirtReducer, // Added missing ksauniTshirt reducer to store
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }).concat(errorMiddleware),
});
export const persistor = persistStore(store);