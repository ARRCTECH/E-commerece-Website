"use client";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { motion } from "framer-motion";
import { Calculator, Truck, Clock, Package } from "lucide-react";
import { getShippingRates } from "../store/slices/orderSlice";
import LoadingSpinner from "./LoadingSpinner";
import { selectShippingRates, selectOrderLoading, selectOrderError } from "../store/slices/orderSlice";
const ShippingRateCalculator = ({ onRateSelect, cartWeight = 0.5, cartValue = 0 }) => {
  const dispatch = useDispatch();
  // Use memoized selectors
  const shippingRates = useSelector(selectShippingRates);
  const loading = useSelector(selectOrderLoading);
  const error = useSelector(selectOrderError);
  const [pincode, setPincode] = useState("");
  const [selectedRate, setSelectedRate] = useState(null);
  const calculateRates = async () => {
    if (!pincode || pincode.length !== 6) {
      alert("Please enter a valid 6-digit pincode");
      return;
    }
    dispatch(
      getShippingRates({
        deliveryPincode: pincode,
        weight: cartWeight,
        cod: 0, // Set to cart value if COD
      }),
    );
  };
  const handleRateSelect = (rate) => {
    setSelectedRate(rate);
    if (onRateSelect) {
      onRateSelect(rate);
    }
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 bg-white rounded-lg shadow-md"
    >
      <div className="flex items-center mb-4">
        <Calculator className="w-5 h-5 mr-2 text-pink-600" />
        <h2 className="text-xl font-semibold">Check Shipping Rates</h2>
      </div>
      {error && <div className="p-3 mb-4 text-red-700 border border-red-200 rounded-lg bg-red-50">{error}</div>}
      {shippingRates.length > 0 && (
        <div className="space-y-3">
          <h4 className="flex items-center gap-2 font-medium">
            <Truck className="w-4 h-4" />
            Available Shipping Options
          </h4>
          {shippingRates.map((rate, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`border rounded-lg p-3 cursor-pointer transition-all ${
                selectedRate?.courier_company_id === rate.courier_company_id
                  ? "border-pink-500 bg-pink-50"
                  : "border-gray-200 hover:border-pink-300 hover:bg-gray-50"
              }`}
              onClick={() => handleRateSelect(rate)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h5 className="font-medium text-gray-900">{rate.courier_name}</h5>
                  <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{rate.etd}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Package className="w-3 h-3" />
                      <span>Weight: {cartWeight}kg</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-gray-900">₹{rate.total_charge}</div>
                  <div className="text-xs text-gray-500">
                    Freight: ₹{rate.freight_charge}
                    {rate.cod_charge > 0 && ` + COD: ₹${rate.cod_charge}`}
                  </div>
                </div>
              </div>
              {selectedRate?.courier_company_id === rate.courier_company_id && (
                <div className="p-2 mt-2 text-sm text-pink-800 bg-pink-100 rounded">✓ Selected shipping option</div>
              )}
            </motion.div>
          ))}
        </div>
      )}
      {shippingRates.length === 0 && pincode.length === 6 && !loading.shippingRates && !error && (
        <div className="py-4 text-center text-gray-500">
          <Package className="w-12 h-12 mx-auto mb-2 text-gray-300" />
          <p>No shipping options available for this pincode</p>
        </div>
      )}
    </motion.div>
  );
};
export default ShippingRateCalculator;