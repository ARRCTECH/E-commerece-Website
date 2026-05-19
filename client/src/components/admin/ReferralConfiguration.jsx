import React, { useState, useMemo, useEffect } from "react";
import axios from "axios";

const getExpiryFromDays = (days) => {
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + days);
  expiryDate.setHours(23, 59, 59, 999);
  return expiryDate.toISOString();
};
const isExpired = (expiryISO) => {
  return new Date() > new Date(expiryISO);
};
const formatExpiry = (expiryISO) => {
  const date = new Date(expiryISO);
  return date.toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};
const ReferralConfiguration = () => {
  const [referrerActive, setReferrerActive] = useState(true);
  const [referrerType, setReferrerType] = useState("percentage");
  const [referrerValue, setReferrerValue] = useState("");
  const [referrerExpiryDays, setReferrerExpiryDays] = useState(180); // default 180 days
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const isValidNumber = (val) =>
    val && !isNaN(parseFloat(val)) && parseFloat(val) > 0;
  const isFormValid = () => {
    if (referrerActive && !isValidNumber(referrerValue)) return false;
    return true;
  };
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${import.meta.env.VITE_API_URL}/referralconfig`);
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
          setReferrerType(referralData.type ?? "percentage");
          setReferrerValue(referralData.value?.toString() ?? "");
          setReferrerExpiryDays(referralData.daysUntilExpiry ?? 180);
        }
      } catch (err) {
        console.error("Error fetching referral config:", err);
        setError("Could not load current configuration. Using defaults.");
      } finally {
        setLoading(false);
      }
    };
    fetchConfig();
  }, []);



   const handleUserFetch=async ()=>{
      const response=await axios.get(`${import.meta.env.VITE_API_URL}/admin/users`,{
        headers:{
          Authorization:`Bearer ${localStorage.getItem("authToken")}`
        }
      });
      console.log(response.data)
   } 
   useEffect(()=>{
        handleUserFetch();
    },[])


  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid()) {
      alert("Please fix validation errors before saving.");
      return;
    }
    const numericValue = parseFloat(referrerValue);
    const payload = {
      referredBy: {
        active: referrerActive,
        type: referrerType,
        value: numericValue,
        daysUntilExpiry: referrerExpiryDays,
      },
    };
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/referralconfig/referral`, {
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
        setReferrerType(saved.type);
        setReferrerValue(saved.value?.toString() ?? "");
        setReferrerExpiryDays(saved.daysUntilExpiry);
      }
      alert("Referral discount saved successfully!");
    } catch (err) {
      console.error("Save error:", err);
      setError(err.message);
      alert(`Error: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };
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
  const DiscountCard = ({
    title,
    active,
    setActive,
    type,
    setType,
    value,
    setValue,
    expiryDays,
    setExpiryDays,
  }) => {
    const computedExpiryISO = useMemo(
      () => getExpiryFromDays(expiryDays),
      [expiryDays]
    );
    const expired = isExpired(computedExpiryISO);
    const isPercentageType = type === "percentage";

    const handleLocalValueChange = (e) => {
      let rawValue = e.target.value;
      let sanitized = sanitizeNumberInput(rawValue, isPercentageType);
      setValue(sanitized);
    };

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden transition-all hover:shadow-md">
        <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center">
          <h3 className="font-semibold text-gray-800">{title}</h3>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
            />
            <div className="w-10 h-5 bg-gray-200 rounded-full peer peer-checked:bg-red-500 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all"></div>
            <span className="ml-2 text-sm font-medium text-gray-600">
              {active ? "Active" : "Inactive"}
            </span>
          </label>
        </div>
        <div className="p-5 space-y-4">
          {/* Discount Type */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Discount Type
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="radio"
                  value="percentage"
                  checked={type === "percentage"}
                  onChange={() => setType("percentage")}
                  className="w-4 h-4 text-red-500 focus:ring-red-400"
                />
                Percentage (%)
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="radio"
                  value="fixed"
                  checked={type === "fixed"}
                  onChange={() => setType("fixed")}
                  className="w-4 h-4 text-red-500 focus:ring-red-400"
                />
                Fixed Amount (₹)
              </label>
            </div>
          </div>

          {/* Discount Value */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              {type === "percentage" ? "Percentage Value" : "Amount (₹)"}
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                {type === "percentage" ? "%" : "₹"}
              </span>
              <input
                type="text"
                inputMode="decimal"
                value={value}
                onChange={handleLocalValueChange}
                placeholder={type === "percentage" ? "e.g., 15" : "e.g., 200"}
                className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-200 focus:border-red-400 transition"
                disabled={!active}
              />
            </div>
            {active && value && !isValidNumber(value) && (
              <p className="text-red-500 text-xs mt-1">
                Please enter a positive number
              </p>
            )}
          </div>

          {/* Expiry Day Selector (now saved to backend) */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Expires after (days)
            </label>
            <select
              value={expiryDays}
              onChange={(e) => setExpiryDays(parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-200 focus:border-red-400 transition"
              disabled={!active}
            >
              {[30, 90, 150, 180, 210, 240, 270, 365].map((days) => (
                <option key={days} value={days}>
                  {days} day{days !== 1 ? "s" : ""}
                </option>
              ))}
            </select>
            {active && (
              <div className="mt-2 text-xs">
                {expired ? (
                  <span className="text-red-500 flex items-center gap-1">
                    <span>⚠️</span> This expiry date has already passed
                  </span>
                ) : (
                  <span className="text-green-600 flex items-center gap-1">
                    <span>✓</span> Valid until {formatExpiry(computedExpiryISO)}
                  </span>
                )}
                <span className="text-gray-400 text-xs block mt-1">
                  Expiry is saved to the backend.
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Show loading spinner while fetching
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
          <p className="mt-2 text-gray-600">Loading configuration...</p>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">
            Referral <span className="text-red-600">Discount Engine</span>
          </h1>
          <p className="text-gray-500 mt-2">
            Configure discount for referrers • Values saved to backend
          </p>
        </div>
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            ⚠️ {error}
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div className="mb-8">
            <DiscountCard
              title="Referred By (Referrer)"
              active={referrerActive}
              setActive={setReferrerActive}
              type={referrerType}
              setType={setReferrerType}
              value={referrerValue}
              setValue={setReferrerValue}
              expiryDays={referrerExpiryDays}
              setExpiryDays={setReferrerExpiryDays}
            />
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <span className="w-1 h-6 bg-red-500 rounded-full"></span>
              Configuration Summary
            </h3>
            <div className="text-sm">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="font-medium text-gray-700 mb-1">
                  Referred By (Referrer)
                </p>
                <p className="text-gray-600">
                  Status:{" "}
                  <span
                    className={
                      referrerActive
                        ? "text-green-600 font-medium"
                        : "text-red-500"
                    }
                  >
                    {referrerActive ? "Active" : "Inactive"}
                  </span>
                </p>
                {referrerActive && (
                  <>
                    <p className="text-gray-600">
                      Discount:{" "}
                      <span className="font-medium">
                        {referrerType === "percentage"
                          ? `${referrerValue || "0"}%`
                          : `₹${referrerValue || "0"}`}
                      </span>
                    </p>
                    <p className="text-gray-600">
                      Expires after:{" "}
                      <span className="font-medium">
                        {referrerExpiryDays} days
                      </span>
                    </p>
                  </>
                )}
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                type="submit"
                disabled={!isFormValid() || saving}
                className={`px-6 py-2.5 rounded-lg font-semibold text-white transition-all ${
                  isFormValid() && !saving
                    ? "bg-red-600 hover:bg-red-700 shadow-sm hover:shadow-md cursor-pointer"
                    : "bg-gray-300 cursor-not-allowed"
                }`}
              >
                {saving ? "Saving..." : "Save Configuration"}
              </button>
            </div>
          </div>
        </form>

        <div className="text-center text-xs text-gray-400 mt-6">
          Discount value and expiry days are saved to the backend.
        </div>
      </div>
    </div>
  );
};

export default ReferralConfiguration;