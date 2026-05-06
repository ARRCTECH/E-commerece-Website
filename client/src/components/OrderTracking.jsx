"use client";
import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { motion } from "framer-motion";
import { Package, Truck, CheckCircle, MapPin, Phone, Mail } from "lucide-react";
import { trackOrder } from "../store/slices/orderSlice";
const OrderTracking = ({ orderId }) => {
  const dispatch = useDispatch();
  // <CHANGE> Added fallback object to prevent destructuring error
  const { currentOrder, loading } = useSelector((state) => state.order || { currentOrder: null, loading: { fetching: false } });
  const [trackingData, setTrackingData] = useState(null);
  useEffect(() => {
    if (orderId) {
      dispatch(trackOrder(orderId)).then((result) => {
        if (result.payload?.trackingData) {
          setTrackingData(result.payload.trackingData);
        }
      });
    }
  }, [dispatch, orderId]);
  const getStatusSteps = () => {
    const steps = [
      { key: "confirmed", label: "Order Confirmed", icon: CheckCircle },
      { key: "processing", label: "Processing", icon: Package },
      { key: "shipped", label: "Shipped", icon: Truck },
      { key: "out_for_delivery", label: "Out for Delivery", icon: Truck },
      { key: "delivered", label: "Delivered", icon: CheckCircle },
    ];
    const currentStatusIndex = steps.findIndex((step) => step.key === currentOrder?.status);
    return steps.map((step, index) => ({
      ...step,
      completed: index <= currentStatusIndex,
      active: index === currentStatusIndex,
    }));
  };
  const getStatusColor = (status) => {
    switch (status) {
      case "confirmed":
        return "text-blue-600 bg-blue-100";
      case "processing":
        return "text-yellow-600 bg-yellow-100";
      case "shipped":
        return "text-purple-600 bg-purple-100";
      case "out_for_delivery":
        return "text-orange-600 bg-orange-100";
      case "delivered":
        return "text-green-600 bg-green-100";
      case "cancelled":
        return "text-red-600 bg-red-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };
  // <CHANGE> Added null check for loading object
  if (loading?.fetching) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="w-8 h-8 border-b-2 border-pink-600 rounded-full animate-spin"></div>
      </div>
    );
  }
  if (!currentOrder) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-600">Order not found</p>
      </div>
    );
  }
  const statusSteps = getStatusSteps();
  return (
    <div className="max-w-4xl p-6 mx-auto">
      {/* Order Header */}
      <div className="p-6 mb-6 bg-white rounded-lg shadow-md">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="mb-2 text-2xl font-bold text-gray-800">Track Your Order</h1>
            <p className="text-gray-600">Order #{currentOrder?.orderNumber || "N/A"}</p>
            <p className="text-sm text-gray-500">
              Placed on {currentOrder?.createdAt ? new Date(currentOrder.createdAt).toLocaleDateString("en-IN") : "N/A"}
            </p>
          </div>
          <div className="mt-4 md:mt-0">
            <span className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(currentOrder?.status)}`}>
              {currentOrder?.status ? currentOrder.status.replace("_", " ").toUpperCase() : "PENDING"}
            </span>
          </div>
        </div>
        {/* Tracking Number */}
        {currentOrder?.trackingInfo?.trackingNumber && (
          <div className="p-4 mt-4 rounded-lg bg-gray-50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Tracking Number</p>
                <p className="font-semibold">{currentOrder.trackingInfo.trackingNumber}</p>
              </div>
              {currentOrder.trackingInfo.trackingUrl && (
                <a
                  href={currentOrder.trackingInfo.trackingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 text-white transition-colors bg-pink-600 rounded-lg hover:bg-pink-700"
                >
                  Track on Shiprocket
                </a>
              )}
            </div>
          </div>
        )}
      </div>
      {/* Tracking Timeline */}
      <div className="p-6 mb-6 bg-white rounded-lg shadow-md">
        <h2 className="mb-6 text-xl font-semibold">Order Progress</h2>
        <div className="relative">
          {statusSteps.map((step, index) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={step.key}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center mb-8 last:mb-0"
              >
                {/* Timeline Line */}
                {index < statusSteps.length - 1 && (
                  <div
                    className={`absolute left-6 top-12 w-0.5 h-16 ${step.completed ? "bg-green-500" : "bg-gray-300"}`}
                  />
                )}
                {/* Status Icon */}
                <div
                  className={`relative z-10 flex items-center justify-center w-12 h-12 rounded-full border-2 ${
                    step.completed
                      ? "bg-green-500 border-green-500 text-white"
                      : step.active
                        ? "bg-blue-500 border-blue-500 text-white"
                        : "bg-white border-gray-300 text-gray-400"
                  }`}
                >
                  <Icon className="w-6 h-6" />
                </div>
                {/* Status Info */}
                <div className="flex-1 ml-4">
                  <h3 className={`font-semibold ${step.completed || step.active ? "text-gray-800" : "text-gray-400"}`}>
                    {step.label}
                  </h3>
                  {step.active && <p className="text-sm text-blue-600">Current Status</p>}
                  {step.completed && step.key === "delivered" && currentOrder?.deliveredAt && (
                    <p className="text-sm text-gray-600">
                      Delivered on {new Date(currentOrder.deliveredAt).toLocaleDateString("en-IN")}
                    </p>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
      {/* Shipping Details */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Shipping Address */}
        <div className="p-6 bg-white rounded-lg shadow-md">
          <h3 className="flex items-center mb-4 font-semibold">
            <MapPin className="w-5 h-5 mr-2 text-pink-600" />
            Shipping Address
          </h3>
          {currentOrder?.shippingAddress ? (
            <div className="text-gray-700">
              <p className="font-medium">{currentOrder.shippingAddress.fullName}</p>
              <p>{currentOrder.shippingAddress.addressLine1}</p>
              {currentOrder.shippingAddress.addressLine2 && <p>{currentOrder.shippingAddress.addressLine2}</p>}
              <p>
                {currentOrder.shippingAddress.city}, {currentOrder.shippingAddress.state} -{" "}
                {currentOrder.shippingAddress.pinCode}
              </p>
              <p className="flex items-center mt-2">
                <Phone className="w-4 h-4 mr-1" />
                {currentOrder.shippingAddress.phoneNumber}
              </p>
            </div>
          ) : (
            <p className="text-gray-500">No shipping address available</p>
          )}
        </div>
        {/* Order Summary */}
        <div className="p-6 bg-white rounded-lg shadow-md">
          <h3 className="mb-4 font-semibold">Order Summary</h3>
          {currentOrder?.items && currentOrder?.pricing ? (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Items ({currentOrder.items.length})</span>
                <span>₹{currentOrder.pricing.subtotal}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping</span>
                <span className={currentOrder.pricing.shippingCharges === 0 ? "text-green-600" : ""}>
                  {currentOrder.pricing.shippingCharges === 0 ? "FREE" : `₹${currentOrder.pricing.shippingCharges}`}
                </span>
              </div>
              {currentOrder.pricing.discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span>-₹{currentOrder.pricing.discount}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Tax</span>
                <span>₹{currentOrder.pricing.tax}</span>
              </div>
              <div className="flex justify-between pt-2 font-semibold border-t">
                <span>Total</span>
                <span>₹{currentOrder.pricing.total}</span>
              </div>
            </div>
          ) : (
            <p className="text-gray-500">No pricing information available</p>
          )}
          {/* Estimated Delivery */}
          {currentOrder?.trackingInfo?.estimatedDelivery && currentOrder.status !== "delivered" && (
            <div className="p-3 mt-4 rounded-lg bg-blue-50">
              <p className="text-sm font-medium text-blue-800">Estimated Delivery</p>
              <p className="text-blue-700">
                {new Date(currentOrder.trackingInfo.estimatedDelivery).toLocaleDateString("en-IN", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
          )}
        </div>
      </div>
      {/* Contact Support */}
      <div className="p-6 mt-6 bg-white rounded-lg shadow-md">
        <h3 className="mb-4 font-semibold">Need Help?</h3>
        <p className="mb-4 text-sm text-gray-600">
          If you have any questions about your order, feel free to contact us.
        </p>
        <div className="flex flex-col gap-4 text-sm sm:flex-row">
          <a href="mailto:order@ksaunibliss.com" className="flex items-center text-pink-600 hover:text-pink-700">
            <Mail className="w-4 h-4 mr-2" />
            order@ksaunibliss.com
          </a>
          <a href="tel:+911234567890" className="flex items-center text-pink-600 hover:text-pink-700">
            <Phone className="w-4 h-4 mr-2" />
            +91 12345 67890
          </a>
        </div>
      </div>
    </div>
  );
};
export default OrderTracking;