import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";

// ============================================================
// Environment‑safe API base URL
// ============================================================
const getApiBase = () => {
  if (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  if (typeof process !== "undefined" && process.env?.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  return "/api";
};

const API_BASE = getApiBase();

// ============================================================
// Helper functions (from second code)
// ============================================================
const isValidNumber = (val) =>
  val && !isNaN(parseFloat(val)) && parseFloat(val) > 0;

const sanitizeNumberInput = (value, isPercentage = false) => {
  if (value === "") return "";
  let cleaned = value.replace(/[^0-9.]/g, "");
  const parts = cleaned.split(".");
  if (parts.length > 2) cleaned = parts[0] + "." + parts.slice(1).join("");
  if (isPercentage) {
    cleaned = cleaned.split(".")[0];
  }
  return cleaned;
};

const ReferralConfiguration = () => {
  // UI state (same as first design)
  const [referrerActive, setReferrerActive] = useState(true);
  const [discountType, setDiscountType] = useState("percentage"); // 'percentage' or 'fixed'
  const [amountValue, setAmountValue] = useState("");
  const [expiryDays, setExpiryDays] = useState("180");

  // Async states
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Validation errors
  const [amountError, setAmountError] = useState(null);
  const [expiryError, setExpiryError] = useState(null);

  // ---------- API calls (from second code) ----------
  // Fetch current config from backend
  const fetchConfig = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${API_BASE}/referralconfig`);

      if (!response.ok) {
        if (response.status === 404) {
          console.log("No existing config, using defaults");
          return;
        }
        throw new Error(`Failed to fetch: ${response.statusText}`);
      }

      const data = await response.json();
      const referralData = data.referredBy || data.referralby;

      if (referralData) {
        setReferrerActive(referralData.active ?? true);
        setDiscountType(referralData.type ?? "percentage");
        setAmountValue(referralData.value?.toString() ?? "");
        setExpiryDays(referralData.daysUntilExpiry?.toString() ?? "180");
      }
    } catch (err) {
      console.error("Error fetching referral config:", err);
      setError("⚠️ Could not load current configuration. Using defaults.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch users (example from second code – kept as is)
  const handleUserFetch = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE}/admin/users`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
      });
      console.log("Users fetched:", response.data);
      // You can store users in state if needed
    } catch (err) {
      console.error("Failed to fetch users:", err);
    }
  }, []);

  // Save configuration (PUT to /referralconfig/referral)
  const saveConfiguration = async () => {
    // Validate
    let isValid = true;

    const numAmount = parseFloat(amountValue);
    if (!isValidNumber(amountValue)) {
      setAmountError(
        discountType === "percentage"
          ? "Percentage must be greater than 0"
          : "Amount must be greater than 0"
      );
      isValid = false;
    } else {
      setAmountError(null);
    }

    const numDays = parseInt(expiryDays, 10);
    if (isNaN(numDays) || numDays < 1 || numDays > 3650) {
      setExpiryError("Expiry days must be between 1 and 3650");
      isValid = false;
    } else {
      setExpiryError(null);
    }

    if (!isValid) return;

    setSaving(true);
    setError(null);
    setSuccessMsg(null);

    const payload = {
      referredBy: {
        active: referrerActive,
        type: discountType,
        value: parseFloat(amountValue),
        daysUntilExpiry: parseInt(expiryDays, 10),
      },
    };

    try {
      const response = await fetch(`${API_BASE}/referralconfig/referral`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save configuration");
      }

      const updatedData = await response.json();
      const saved = updatedData.referredBy || updatedData.referralby;
      if (saved) {
        setReferrerActive(saved.active);
        setDiscountType(saved.type);
        setAmountValue(saved.value?.toString() ?? "");
        setExpiryDays(saved.daysUntilExpiry?.toString() ?? "180");
      }

      setSuccessMsg("✅ Configuration saved successfully!");
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      console.error("Save error:", err);
      setError(`❌ ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  // Load config on mount & optionally fetch users
  useEffect(() => {
    fetchConfig();
    handleUserFetch(); // optional – remove if not needed
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------- UI Helpers (same as first design) ----------
  const computeValidUntil = (days) => {
    if (isNaN(days) || days <= 0) return "Not set";
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const validUntilDate = computeValidUntil(parseInt(expiryDays, 10) || 180);

  const discountPreview = () => {
    const rawValue = parseFloat(amountValue) || 0;
    if (discountType === "percentage") return `${rawValue}%`;
    return `₮ ${rawValue.toLocaleString()}`;
  };

  const handleAmountChange = (e) => {
    const val = e.target.value;
    const isPercentage = discountType === "percentage";
    const sanitized = sanitizeNumberInput(val, isPercentage);
    setAmountValue(sanitized);
    setAmountError(null);
  };

  const handleExpiryChange = (e) => {
    const val = e.target.value;
    if (val === "" || /^\d+$/.test(val)) {
      setExpiryDays(val);
      setExpiryError(null);
    }
  };

  // Loading skeleton
  if (loading) {
    return (
      <div className="max-w-5xl mx-auto p-6 animate-pulse">
        <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-4 bg-gray-100 rounded w-2/3"></div>
          <div className="space-y-4">
            <div className="h-12 bg-gray-100 rounded"></div>
            <div className="h-12 bg-gray-100 rounded"></div>
          </div>
          <div className="h-32 bg-gray-50 rounded-xl"></div>
        </div>
      </div>
    );
  }

  // Main render – original beautiful two‑column layout
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 py-10 px-4 font-sans">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center md:text-left">
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
            Referral Discount Engine
          </h1>
          <p className="text-slate-500 mt-2 text-sm">
            Configure discount for referrers • Values saved to backend
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/40 overflow-hidden">
          <div className="grid md:grid-cols-2 gap-0 divide-y md:divide-y-0 md:divide-x divide-slate-200">
            {/* LEFT PANEL - Form */}
            <div className="p-6 md:p-8 space-y-6">
              {/* Active Toggle */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-800">
                    Referred By (Referrer)
                  </h2>
                  <p className="text-sm text-slate-500">
                    Toggle status & discount rules
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={referrerActive}
                    onChange={(e) => setReferrerActive(e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-slate-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-slate-700"></div>
                  <span className="ml-3 text-sm font-medium text-slate-700">
                    {referrerActive ? "Active" : "Inactive"}
                  </span>
                </label>
              </div>

              {/* Discount Type Buttons */}
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-slate-700 uppercase tracking-wide">
                  DISCOUNT TYPE
                </label>
                <div className="flex gap-4 bg-slate-100 p-1.5 rounded-xl w-fit">
                  <button
                    type="button"
                    onClick={() => setDiscountType("percentage")}
                    className={`px-5 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                      discountType === "percentage"
                        ? "bg-white shadow-md text-slate-800 ring-1 ring-slate-200"
                        : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    <span>%</span> Percentage (%)
                  </button>
                  <button
                    type="button"
                    onClick={() => setDiscountType("fixed")}
                    className={`px-5 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                      discountType === "fixed"
                        ? "bg-white shadow-md text-slate-800 ring-1 ring-slate-200"
                        : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    <span>₮</span> Fixed Amount (₮)
                  </button>
                </div>
              </div>

              {/* Amount Input */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700 uppercase tracking-wide">
                  {discountType === "percentage" ? "PERCENTAGE (%)" : "AMOUNT (₮)"}
                </label>
                <div className="relative">
                  {discountType === "fixed" && (
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-medium">
                      ₮
                    </span>
                  )}
                  {discountType === "percentage" && (
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 font-medium">
                      %
                    </span>
                  )}
                  <input
                    type="text"
                    inputMode="decimal"
                    value={amountValue}
                    onChange={handleAmountChange}
                    disabled={!referrerActive}
                    className={`w-full px-4 py-3 rounded-xl border ${
                      amountError
                        ? "border-red-300 bg-red-50"
                        : "border-slate-200 focus:border-slate-400"
                    } bg-white focus:outline-none focus:ring-2 focus:ring-slate-200 transition-all ${
                      discountType === "fixed" ? "pl-8" : "pr-8"
                    } ${!referrerActive ? "opacity-60 cursor-not-allowed" : ""}`}
                    placeholder={
                      discountType === "percentage" ? "e.g., 15" : "e.g., 500"
                    }
                  />
                </div>
                {amountError && (
                  <p className="text-xs text-red-500 mt-1">{amountError}</p>
                )}
              </div>

              {/* Expiry Days Input */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700 uppercase tracking-wide">
                  EXPIRES AFTER (DAYS)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={expiryDays}
                    onChange={handleExpiryChange}
                    disabled={!referrerActive}
                    className={`w-full px-4 py-3 rounded-xl border ${
                      expiryError
                        ? "border-red-300 bg-red-50"
                        : "border-slate-200"
                    } bg-white focus:outline-none focus:ring-2 focus:ring-slate-200 ${
                      !referrerActive ? "opacity-60 cursor-not-allowed" : ""
                    }`}
                    placeholder="Days until expiry"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                    days
                  </span>
                </div>
                {expiryError && (
                  <p className="text-xs text-red-500 mt-1">{expiryError}</p>
                )}
                {referrerActive && (
                  <div className="flex items-center gap-2 text-sm text-slate-500 mt-1">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="1.5"
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    <span>✔ Valid until {validUntilDate}</span>
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT PANEL - Summary & Actions */}
            <div className="p-6 md:p-8 bg-gradient-to-br from-slate-50/80 to-white">
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <svg
                    className="w-5 h-5 text-slate-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  Configuration Summary
                </h3>

                <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                    <span className="text-slate-500 text-sm">
                      Referred By (Referrer)
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                        referrerActive
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {referrerActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                  {referrerActive && (
                    <>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500 text-sm">Discount</span>
                        <span className="font-mono font-bold text-slate-800 text-lg">
                          {discountPreview()}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500 text-sm">
                          Expires after
                        </span>
                        <span className="font-medium text-slate-700">
                          {expiryDays || "0"} days
                        </span>
                      </div>
                      <div className="flex justify-between items-center pt-2 text-xs text-slate-400 border-t border-dashed border-slate-200">
                        <span>Valid until</span>
                        <span>{validUntilDate}</span>
                      </div>
                    </>
                  )}
                </div>

                {/* Feedback messages */}
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-2 text-red-700 text-sm">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    {error}
                  </div>
                )}

                {successMsg && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center gap-2 text-emerald-700 text-sm">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    {successMsg}
                  </div>
                )}

                <button
                  onClick={saveConfiguration}
                  disabled={
                    saving || (referrerActive && !isValidNumber(amountValue))
                  }
                  className={`w-full py-3.5 rounded-xl font-semibold text-white shadow-md transition-all transform active:scale-[0.98] flex items-center justify-center gap-2 ${
                    saving ||
                    (referrerActive && !isValidNumber(amountValue))
                      ? "bg-slate-400 cursor-not-allowed"
                      : "bg-slate-800 hover:bg-slate-900 hover:shadow-lg"
                  }`}
                >
                  {saving ? (
                    <>
                      <svg
                        className="animate-spin h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Saving...
                    </>
                  ) : (
                    <>
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
                        />
                      </svg>
                      Save Configuration
                    </>
                  )}
                </button>

                <p className="text-center text-xs text-slate-400 mt-2">
                  Changes are immediately persisted to backend
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* API hint */}
        <div className="mt-6 text-center text-xs text-slate-400 bg-white/40 rounded-lg py-2 px-4 inline-block w-full">
          <span className="flex items-center justify-center gap-1">
            <svg
              className="w-3 h-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            API integration ready:{" "}
            <code className="bg-slate-100 px-1 rounded">
              GET /referralconfig
            </code>{" "}
            •{" "}
            <code className="bg-slate-100 px-1 rounded">
              PUT /referralconfig/referral
            </code>
          </span>
        </div>
      </div>
    </div>
  );
};

export default ReferralConfiguration;