"use client";
import { Toaster } from "react-hot-toast";
const ToastProvider = () => {
  return (
    <Toaster
      position="top-right"
      reverseOrder={false}
      gutter={8}
      containerClassName=""
      containerStyle={{
        top: 80,
        right: 20,
      }}
      toastOptions={{
        // Define default options
        className: "",
        duration: 4000,
        style: {
          background: "#363636",
          color: "#fff",
          borderRadius: "16px",
          padding: "16px 20px",
          fontSize: "14px",
          fontWeight: "500",
          boxShadow: "0 10px 25px rgba(0, 0, 0, 0.1)",
          maxWidth: "400px",
        },
        // Default options for specific types
        success: {
          duration: 3000,
          style: {
            background: "linear-gradient(135deg, #FF6B35 0%, #F7931E 100%)",
            color: "#FFFFFF",
            border: "none",
            borderRadius: "16px",
            padding: "16px 20px",
            fontWeight: "600",
            boxShadow: "0 10px 25px rgba(255, 107, 53, 0.3)",
          },
          iconTheme: {
            primary: "#FFFFFF",
            secondary: "#FF6B35",
          },
        },
        error: {
          duration: 4000,
          style: {
            display: 'none'  // This will hide the unexpected error toast
          }
        },
        loading: {
          style: {
            background: "#F3F4F6",
            color: "#374151",
            border: "1px solid #E5E7EB",
            borderRadius: "16px",
            padding: "16px 20px",
            fontWeight: "500",
            boxShadow: "0 10px 25px rgba(0, 0, 0, 0.1)",
          },
        },
      }}
    />
  );
};
export default ToastProvider;