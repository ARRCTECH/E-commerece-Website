import React, { useState } from "react";

const ReferralDiscountManager = () => {
  // Helper to get date 7 days from now (with current time)
  const getDefaultExpiry = () => {
    const date = new Date();
    date.setDate(date.getDate() + 7);
    // Format: YYYY-MM-DDThh:mm (datetime-local required format)
    return date.toISOString().slice(0, 16);
  };

  // State for Referred By (referrer) discount
  const [referrerActive, setReferrerActive] = useState(true);
  const [referrerType, setReferrerType] = useState("percentage"); // 'percentage' or 'fixed'
  const [referrerValue, setReferrerValue] = useState("");
  const [referrerExpiry, setReferrerExpiry] = useState(getDefaultExpiry());

  // State for Referred To (new user) discount
  const [referredActive, setReferredActive] = useState(true);
  const [referredType, setReferredType] = useState("percentage");
  const [referredValue, setReferredValue] = useState("");
  const [referredExpiry, setReferredExpiry] = useState(getDefaultExpiry());

  // Helpers
  const formatExpiryLabel = (isoString) => {
    if (!isoString) return "Not set";
    const date = new Date(isoString);
    return date.toLocaleString();
  };

  const isExpired = (expiryIso) => {
    return new Date(expiryIso) < new Date();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      referredBy: {
        active: referrerActive,
        type: referrerType,
        value: referrerValue,
        expiry: referrerExpiry,
        expired: isExpired(referrerExpiry),
      },
      referredTo: {
        active: referredActive,
        type: referredType,
        value: referredValue,
        expiry: referredExpiry,
        expired: isExpired(referredExpiry),
      },
    };
    console.log("Saved referral configuration:", payload);
    alert("Referral discounts saved! Check console for details.");
  };

  // Validation (ensure value is positive number)
  const isValidNumber = (val) => val && !isNaN(parseFloat(val)) && parseFloat(val) > 0;
  const isFormValid = () => {
    if (referrerActive && !isValidNumber(referrerValue)) return false;
    if (referredActive && !isValidNumber(referredValue)) return false;
    return true;
  };

  return (
    <div className="max-w-5xl mx-auto p-6 bg-gray-50 min-h-screen font-sans">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-extrabold text-gray-800">
          Referral <span className="text-indigo-600">Discount Engine</span>
        </h1>
        <p className="text-gray-500 mt-2">
          Manage discounts for referrer and new user • Percentage or Fixed • Expiry date & time
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Two column layout */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Referred By (Referrer) Card */}
          <div className="bg-white rounded-2xl shadow-md overflow-hidden border border-gray-200 transition-all hover:shadow-lg">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-5 py-3 flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <i className="fas fa-user-plus text-white text-xl"></i>
                <h2 className="text-white font-bold text-lg">Referred By (Referrer)</h2>
              </div>
              {/* Active toggle */}
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={referrerActive}
                  onChange={(e) => setReferrerActive(e.target.checked)}
                />
                <div className="w-11 h-6 bg-gray-300 rounded-full peer peer-checked:bg-emerald-500 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                <span className="ml-2 text-sm font-medium text-white">
                  {referrerActive ? "Active" : "Inactive"}
                </span>
              </label>
            </div>
            <div className="p-5 space-y-4">
              {/* Discount type */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Discount Type
                </label>
                <div className="flex space-x-4">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      value="percentage"
                      checked={referrerType === "percentage"}
                      onChange={() => setReferrerType("percentage")}
                      className="w-4 h-4 text-indigo-600"
                    />
                    <span className="text-gray-700">Percentage (%)</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      value="fixed"
                      checked={referrerType === "fixed"}
                      onChange={() => setReferrerType("fixed")}
                      className="w-4 h-4 text-indigo-600"
                    />
                    <span className="text-gray-700">Direct Money ($)</span>
                  </label>
                </div>
              </div>

              {/* Discount value */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  {referrerType === "percentage" ? "Percentage (%)" : "Fixed Amount ($)"}
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                    {referrerType === "percentage" ? "%" : "$"}
                  </span>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={referrerValue}
                    onChange={(e) => setReferrerValue(e.target.value)}
                    placeholder={referrerType === "percentage" ? "e.g., 15" : "e.g., 20.00"}
                    className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                    disabled={!referrerActive}
                  />
                </div>
                {referrerActive && referrerValue && !isValidNumber(referrerValue) && (
                  <p className="text-red-500 text-xs mt-1">Please enter a positive number</p>
                )}
              </div>

              {/* Expiry Date & Time */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Expiry Date & Time <span className="text-gray-400 text-xs">(7 days default)</span>
                </label>
                <input
                  type="datetime-local"
                  value={referrerExpiry}
                  onChange={(e) => setReferrerExpiry(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-400"
                  disabled={!referrerActive}
                />
                {referrerActive && referrerExpiry && (
                  <div className="mt-1 text-xs">
                    {isExpired(referrerExpiry) ? (
                      <span className="text-red-500 flex items-center gap-1">
                        <i className="fas fa-exclamation-circle"></i> Expired
                      </span>
                    ) : (
                      <span className="text-green-600 flex items-center gap-1">
                        <i className="fas fa-clock"></i> Valid until: {formatExpiryLabel(referrerExpiry)}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Referred To (New User) Card */}
          <div className="bg-white rounded-2xl shadow-md overflow-hidden border border-gray-200 transition-all hover:shadow-lg">
            <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-5 py-3 flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <i className="fas fa-user-check text-white text-xl"></i>
                <h2 className="text-white font-bold text-lg">Referred To (New User)</h2>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={referredActive}
                  onChange={(e) => setReferredActive(e.target.checked)}
                />
                <div className="w-11 h-6 bg-gray-300 rounded-full peer peer-checked:bg-emerald-500 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                <span className="ml-2 text-sm font-medium text-white">
                  {referredActive ? "Active" : "Inactive"}
                </span>
              </label>
            </div>
            <div className="p-5 space-y-4">
              {/* Discount type */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Discount Type
                </label>
                <div className="flex space-x-4">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      value="percentage"
                      checked={referredType === "percentage"}
                      onChange={() => setReferredType("percentage")}
                      className="w-4 h-4 text-indigo-600"
                    />
                    <span className="text-gray-700">Percentage (%)</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      value="fixed"
                      checked={referredType === "fixed"}
                      onChange={() => setReferredType("fixed")}
                      className="w-4 h-4 text-indigo-600"
                    />
                    <span className="text-gray-700">Direct Money ($)</span>
                  </label>
                </div>
              </div>

              {/* Discount value */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  {referredType === "percentage" ? "Percentage (%)" : "Fixed Amount ($)"}
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                    {referredType === "percentage" ? "%" : "$"}
                  </span>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={referredValue}
                    onChange={(e) => setReferredValue(e.target.value)}
                    placeholder={referredType === "percentage" ? "e.g., 10" : "e.g., 15.00"}
                    className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-400"
                    disabled={!referredActive}
                  />
                </div>
                {referredActive && referredValue && !isValidNumber(referredValue) && (
                  <p className="text-red-500 text-xs mt-1">Enter a positive number</p>
                )}
              </div>

              {/* Expiry Date & Time */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Expiry Date & Time <span className="text-gray-400 text-xs">(7 days default)</span>
                </label>
                <input
                  type="datetime-local"
                  value={referredExpiry}
                  onChange={(e) => setReferredExpiry(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-400"
                  disabled={!referredActive}
                />
                {referredActive && referredExpiry && (
                  <div className="mt-1 text-xs">
                    {isExpired(referredExpiry) ? (
                      <span className="text-red-500 flex items-center gap-1">
                        <i className="fas fa-exclamation-circle"></i> Expired
                      </span>
                    ) : (
                      <span className="text-green-600 flex items-center gap-1">
                        <i className="fas fa-hourglass-half"></i> Valid until: {formatExpiryLabel(referredExpiry)}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Summary & Save Section */}
        <div className="bg-white rounded-xl shadow-md p-5 border border-gray-200">
          <h3 className="font-semibold text-gray-800 text-lg flex items-center gap-2 mb-3">
            <i className="fas fa-receipt text-indigo-500"></i> Discount Summary
          </h3>
          <div className="grid sm:grid-cols-2 gap-4 text-sm">
            <div className="bg-gray-50 p-3 rounded-xl">
              <p className="font-medium text-blue-700">Referred By (Referrer)</p>
              <p className="text-gray-600">
                Status:{" "}
                <span className={referrerActive ? "text-green-600 font-semibold" : "text-red-500"}>
                  {referrerActive ? "Active" : "Inactive"}
                </span>
              </p>
              {referrerActive && (
                <>
                  <p>
                    Discount: {referrerType === "percentage" ? `${referrerValue || "0"}%` : `$${referrerValue || "0"}`}
                  </p>
                  <p>
                    Expiry:{" "}
                    {isExpired(referrerExpiry) ? (
                      <span className="text-red-500">Expired</span>
                    ) : (
                      <span className="text-gray-700">{formatExpiryLabel(referrerExpiry)}</span>
                    )}
                  </p>
                </>
              )}
            </div>
            <div className="bg-gray-50 p-3 rounded-xl">
              <p className="font-medium text-purple-700">Referred To (New User)</p>
              <p className="text-gray-600">
                Status:{" "}
                <span className={referredActive ? "text-green-600 font-semibold" : "text-red-500"}>
                  {referredActive ? "Active" : "Inactive"}
                </span>
              </p>
              {referredActive && (
                <>
                  <p>
                    Discount: {referredType === "percentage" ? `${referredValue || "0"}%` : `$${referredValue || "0"}`}
                  </p>
                  <p>
                    Expiry:{" "}
                    {isExpired(referredExpiry) ? (
                      <span className="text-red-500">Expired</span>
                    ) : (
                      <span className="text-gray-700">{formatExpiryLabel(referredExpiry)}</span>
                    )}
                  </p>
                </>
              )}
            </div>
          </div>
          <div className="mt-5 flex justify-end">
            <button
              type="submit"
              disabled={!isFormValid()}
              className={`px-6 py-2.5 rounded-xl font-bold text-white transition-all ${
                isFormValid()
                  ? "bg-indigo-600 hover:bg-indigo-700 shadow-md cursor-pointer"
                  : "bg-gray-400 cursor-not-allowed"
              }`}
            >
              <i className="fas fa-save mr-2"></i> Save Referral Configuration
            </button>
          </div>
        </div>
      </form>

      <div className="text-center text-xs text-gray-400 mt-6">
        Each discount can be independently activated, switched between % / fixed amount, and has its own expiry date & time.
      </div>
    </div>
  );
};

export default ReferralDiscountManager;