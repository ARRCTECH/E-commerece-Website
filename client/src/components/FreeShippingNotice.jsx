import React from "react";
import { Truck } from "lucide-react";
const FreeShippingNotice = () => {
  return (
    <div className="flex items-center justify-center px-4 py-2 space-x-2 bg-green-100 text-white">
      <Truck className="w-5 h-5 text-red-600" />
      <span className="text-base text-red-600 font-semibold text-center">FREE SHIPPING on all orders above ₹399</span>
    </div>
  );
};
export default FreeShippingNotice;