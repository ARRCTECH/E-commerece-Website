import React, { useState, useMemo } from "react";

const ReferralDiscountManager = () => {
  // Helper: compute expiry ISO string from days (end of that day local)
  const getExpiryFromDays = (days) => {
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + days);
    expiry.setHours(23, 59, 59, 999);
    return expiry.toISOString();
  };

  // Default expiry days = 7
  const defaultExpiryDays = 7;

  // Referrer state
  const [referrerActive, setReferrerActive] = useState(true);
  const [referrerType, setReferrerType] = useState("percentage");
  const [referrerValue, setReferrerValue] = useState("");
  const [referrerExpiryDays, setReferrerExpiryDays] = useState(defaultExpiryDays);

  // Computed expiry ISO (for display & saving)
  const referrerExpiryISO = useMemo(
    () => getExpiryFromDays(referrerExpiryDays),
    [referrerExpiryDays]
  );

  const formatExpiry = (iso) => (iso ? new Date(iso).toLocaleString() : "Not set");
  const isExpired = (iso) => new Date(iso) < new Date();

  const isValidNumber = (val) => val && !isNaN(parseFloat(val)) && parseFloat(val) > 0;
  const isFormValid = () => {
    if (referrerActive) {
      if (!isValidNumber(referrerValue)) return false;
      if (referrerExpiryDays < 1 || referrerExpiryDays > 7) return false;
    }
    return true;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isFormValid()) {
      alert("Please fix validation errors before saving.");
      return;
    }
    // Use the current computed expiry ISO (based on selected days)
    const payload = {
      referredBy: {
        active: referrerActive,
        type: referrerType,
        value: referrerValue,
        expiry: referrerExpiryISO,
        expired: isExpired(referrerExpiryISO),
      },
    };
    console.log("Saved referral configuration:", payload);
    alert("Referral discount saved successfully!");
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
    // Compute expiry date from days for display
    const computedExpiryISO = useMemo(() => getExpiryFromDays(expiryDays), [expiryDays]);
    const expired = isExpired(computedExpiryISO);

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
                type="number"
                step={type === "percentage" ? "1" : "0.01"}
                min="0"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={type === "percentage" ? "e.g., 15" : "e.g., 200"}
                className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-200 focus:border-red-400 transition"
                disabled={!active}
              />
            </div>
            {active && value && !isValidNumber(value) && (
              <p className="text-red-500 text-xs mt-1">Please enter a positive number</p>
            )}
          </div>

          {/* Expiry Day Selector (1 to 7 days) */}
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
              {[1, 2, 3, 4, 5, 6, 7].map((days) => (
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
                  Expiry will be set to 11:59:59 PM on that day.
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">
            Referral <span className="text-red-600">Discount Engine</span>
          </h1>
          <p className="text-gray-500 mt-2">
            Configure discount for referrers • Percentage or fixed amount • Choose expiry in days (1–7)
          </p>
        </div>

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

          {/* Summary & Save */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <span className="w-1 h-6 bg-red-500 rounded-full"></span>
              Configuration Summary
            </h3>
            <div className="text-sm">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="font-medium text-gray-700 mb-1">Referred By (Referrer)</p>
                <p className="text-gray-600">
                  Status:{" "}
                  <span className={referrerActive ? "text-green-600 font-medium" : "text-red-500"}>
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
                      Expires after: <span className="font-medium">{referrerExpiryDays} day{referrerExpiryDays !== 1 ? "s" : ""}</span>
                    </p>
                    <p className="text-gray-600">
                      Expiry date:{" "}
                      {isExpired(referrerExpiryISO) ? (
                        <span className="text-red-500">Expired</span>
                      ) : (
                        <span className="text-gray-700">{formatExpiry(referrerExpiryISO)}</span>
                      )}
                    </p>
                  </>
                )}
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                type="submit"
                disabled={!isFormValid()}
                className={`px-6 py-2.5 rounded-lg font-semibold text-white transition-all ${
                  isFormValid()
                    ? "bg-red-600 hover:bg-red-700 shadow-sm hover:shadow-md cursor-pointer"
                    : "bg-gray-300 cursor-not-allowed"
                }`}
              >
                Save Configuration
              </button>
            </div>
          </div>
        </form>

        <div className="text-center text-xs text-gray-400 mt-6">
          Discount expiry is set to 11:59 PM on the selected day (relative to today). Only 1–7 days allowed.
        </div>
      </div>
    </div>
  );
};

export default ReferralDiscountManager;