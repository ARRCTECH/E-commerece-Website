// Environment validation utility
export const validateEnvironment = () => {
  const requiredEnvVars = [
    "VITE_FIREBASE_API_KEY",
    "VITE_FIREBASE_AUTH_DOMAIN",
    "VITE_FIREBASE_PROJECT_ID",
    "VITE_API_URL",
  ];
  const missingVars = requiredEnvVars.filter((varName) => {
    const value = import.meta.env[varName];
    return !value || value === "undefined";
  });
  if (missingVars.length > 0) {
    console.error("❌ Missing environment variables:", missingVars);
    missingVars.forEach((varName) => {
    });
    return false;
  }
  return true;
};
// Debug function to log all environment variables (development only)
export const debugEnvironment = () => {
  if (import.meta.env.MODE === "development") {
    console.log("🔍 Environment Variables:");
  }
};