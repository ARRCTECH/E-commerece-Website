"use client";
import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { motion } from "framer-motion";
import { ArrowLeft, Upload, X, Package, AlertCircle, CheckCircle } from "lucide-react";
import { createReturnRequest, clearSuccess } from "../store/slices/returnSlice";
import { fetchOrderDetails } from "../store/slices/orderSlice";
const ReturnRequest = ({ orderId, onBack }) => {
  const dispatch = useDispatch();
  const { currentOrder } = useSelector((state) => state.order);
  const { loading, error, success } = useSelector((state) => state.returns);
  const [formData, setFormData] = useState({
    type: "return",
    reason: "",
    description: "",
    items: [],
  });
  const [selectedImages, setSelectedImages] = useState([]);
  const [imagePreview, setImagePreview] = useState([]);
  useEffect(() => {
    if (orderId) {
      dispatch(fetchOrderDetails(orderId));
    }
  }, [dispatch, orderId]);
  useEffect(() => {
    if (success.returnCreated) {
      // Reset form and show success message
      setFormData({
        type: "return",
        reason: "",
        description: "",
        items: [],
      });
      setSelectedImages([]);
      setImagePreview([]);
      setTimeout(() => {
        dispatch(clearSuccess());
        onBack();
      }, 2000);
    }
  }, [success.returnCreated, dispatch, onBack]);
  const returnReasons = [
    { value: "defective_product", label: "Defective Product" },
    { value: "wrong_item", label: "Wrong Item Received" },
    { value: "size_issue", label: "Size Issue" },
    { value: "quality_issue", label: "Quality Issue" },
    { value: "not_as_described", label: "Not as Described" },
    { value: "damaged_packaging", label: "Damaged Packaging" },
    { value: "changed_mind", label: "Changed Mind" },
    { value: "other", label: "Other" },
  ];
  const handleItemSelection = (item, quantity) => {
    const existingItemIndex = formData.items.findIndex((i) => i.orderItemId === item._id);
    if (quantity === 0) {
      // Remove item
      setFormData((prev) => ({
        ...prev,
        items: prev.items.filter((i) => i.orderItemId !== item._id),
      }));
    } else if (existingItemIndex >= 0) {
      // Update existing item
      setFormData((prev) => ({
        ...prev,
        items: prev.items.map((i, index) => (index === existingItemIndex ? { ...i, quantity } : i)),
      }));
    } else {
      // Add new item
      setFormData((prev) => ({
        ...prev,
        items: [
          ...prev.items,
          {
            orderItemId: item._id,
            quantity,
            reason: formData.reason,
          },
        ],
      }));
    }
  };
  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + selectedImages.length > 5) {
      alert("You can upload maximum 5 images");
      return;
    }
    setSelectedImages((prev) => [...prev, ...files]);
    // Create preview URLs
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview((prev) => [...prev, e.target.result]);
      };
      reader.readAsDataURL(file);
    });
  };
  const removeImage = (index) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index));
    setImagePreview((prev) => prev.filter((_, i) => i !== index));
  };
  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.items.length === 0) {
      alert("Please select at least one item to return");
      return;
    }
    if (!formData.reason) {
      alert("Please select a reason for return");
      return;
    }
    const returnData = {
      orderId,
      type: formData.type,
      reason: formData.reason,
      description: formData.description,
      items: formData.items,
      images: selectedImages,
    };
    dispatch(createReturnRequest(returnData));
  };
  const canReturnOrder = () => {
    if (!currentOrder || currentOrder.status !== "delivered") {
      return false;
    }
    const deliveryDate = currentOrder.deliveredAt || currentOrder.createdAt;
    const daysSinceDelivery = Math.floor((new Date() - new Date(deliveryDate)) / (1000 * 60 * 60 * 24));
    return daysSinceDelivery <= 7;
  };
  if (!currentOrder) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="w-8 h-8 border-b-2 border-pink-600 rounded-full animate-spin"></div>
      </div>
    );
  }
  if (!canReturnOrder()) {
    return (
      <div className="max-w-2xl p-6 mx-auto">
        <div className="p-6 bg-white rounded-lg shadow-md">
          <div className="text-center">
            <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
            <h2 className="mb-2 text-2xl font-bold text-gray-800">Return Not Available</h2>
            <p className="mb-4 text-gray-600">
              {currentOrder.status !== "delivered"
                ? "Order must be delivered to request a return"
                : "Return window has expired. Returns are only allowed within 7 days of delivery."}
            </p>
            <button
              onClick={onBack}
              className="px-6 py-2 text-white transition-colors bg-pink-600 rounded-lg hover:bg-pink-700"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="max-w-4xl p-6 mx-auto">
      {/* Header */}
      <div className="flex items-center mb-6">
        <button onClick={onBack} className="flex items-center mr-4 text-gray-600 hover:text-gray-800">
          <ArrowLeft className="w-5 h-5 mr-1" />
          Back
        </button>
        <h1 className="text-2xl font-bold text-gray-800">Return Request</h1>
      </div>
      {/* Success Message */}
      {success.returnCreated && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center px-4 py-3 mb-6 text-green-700 border border-green-200 rounded-lg bg-green-50"
        >
          <CheckCircle className="w-5 h-5 mr-2" />
          Return request submitted successfully! Redirecting...
        </motion.div>
      )}
      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="px-4 py-3 mb-6 text-red-700 border border-red-200 rounded-lg bg-red-50"
        >
          {error}
        </motion.div>
      )}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Order Info */}
        <div className="p-6 bg-white rounded-lg shadow-md">
          <h2 className="mb-4 text-xl font-semibold">Order Information</h2>
          <div className="grid gap-4 text-sm md:grid-cols-2">
            <div>
              <p className="text-gray-600">Order Number</p>
              <p className="font-semibold">{currentOrder.orderNumber}</p>
            </div>
            <div>
              <p className="text-gray-600">Order Date</p>
              <p className="font-semibold">{new Date(currentOrder.createdAt).toLocaleDateString("en-IN")}</p>
            </div>
            <div>
              <p className="text-gray-600">Total Amount</p>
              <p className="font-semibold">₹{currentOrder.pricing.total}</p>
            </div>
            <div>
              <p className="text-gray-600">Status</p>
              <p className="font-semibold capitalize">{currentOrder.status.replace("_", " ")}</p>
            </div>
          </div>
        </div>
        {/* Return Type */}
        <div className="p-6 bg-white rounded-lg shadow-md">
          <h2 className="mb-4 text-xl font-semibold">Return Type</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {["return", "exchange", "refund"].map((type) => (
              <label key={type} className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="type"
                  value={type}
                  checked={formData.type === type}
                  onChange={(e) => setFormData((prev) => ({ ...prev, type: e.target.value }))}
                  className="mr-3"
                />
                <div>
                  <p className="font-medium capitalize">{type}</p>
                  <p className="text-sm text-gray-600">
                    {type === "return" && "Return items for refund"}
                    {type === "exchange" && "Exchange for different size/color"}
                    {type === "refund" && "Get money back"}
                  </p>
                </div>
              </label>
            ))}
          </div>
        </div>
        {/* Select Items */}
        <div className="p-6 bg-white rounded-lg shadow-md">
          <h2 className="mb-4 text-xl font-semibold">Select Items to Return</h2>
          <div className="space-y-4">
            {currentOrder.items.map((item) => {
              const selectedItem = formData.items.find((i) => i.orderItemId === item._id);
              const selectedQuantity = selectedItem?.quantity || 0;
              return (
                <div key={item._id} className="flex items-center p-4 space-x-4 border rounded-lg">
                  <img
                    src={item.image || "/placeholder.svg"}
                    alt={item.name}
                    className="object-cover w-16 h-16 rounded-lg"
                  />
                  <div className="flex-1">
                    <h3 className="font-medium">{item.name}</h3>
                    <p className="text-sm text-gray-600">
                      Size: {item.size} | Color: {item.color} | Price: ₹{item.price}
                    </p>
                    <p className="text-sm text-gray-600">Ordered Quantity: {item.quantity}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <label className="text-sm text-gray-600">Return Qty:</label>
                    <select
                      value={selectedQuantity}
                      onChange={(e) => handleItemSelection(item, Number.parseInt(e.target.value))}
                      className="px-2 py-1 border border-gray-300 rounded"
                    >
                      <option value={0}>0</option>
                      {Array.from({ length: item.quantity }, (_, i) => i + 1).map((qty) => (
                        <option key={qty} value={qty}>
                          {qty}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        {/* Return Reason */}
        <div className="p-6 bg-white rounded-lg shadow-md">
          <h2 className="mb-4 text-xl font-semibold">Reason for Return</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {returnReasons.map((reason) => (
              <label
                key={reason.value}
                className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
              >
                <input
                  type="radio"
                  name="reason"
                  value={reason.value}
                  checked={formData.reason === reason.value}
                  onChange={(e) => setFormData((prev) => ({ ...prev, reason: e.target.value }))}
                  className="mr-3"
                />
                <span>{reason.label}</span>
              </label>
            ))}
          </div>
          <div className="mt-4">
            <label className="block mb-2 text-sm font-medium text-gray-700">Additional Details (Optional)</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Please provide additional details about your return request"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
              rows={4}
            />
          </div>
        </div>
        {/* Upload Images */}
        <div className="p-6 bg-white rounded-lg shadow-md">
          <h2 className="mb-4 text-xl font-semibold">Upload Images (Optional)</h2>
          <p className="mb-4 text-sm text-gray-600">
            Upload photos to support your return request (Max 5 images, 5MB each)
          </p>
          <div className="p-6 text-center border-2 border-gray-300 border-dashed rounded-lg">
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
              id="image-upload"
            />
            <label htmlFor="image-upload" className="cursor-pointer">
              <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <p className="text-gray-600">Click to upload images</p>
            </label>
          </div>
          {/* Image Preview */}
          {imagePreview.length > 0 && (
            <div className="grid grid-cols-2 gap-4 mt-4 md:grid-cols-5">
              {imagePreview.map((preview, index) => (
                <div key={index} className="relative">
                  <img
                    src={preview || "/placeholder.svg"}
                    alt={`Preview ${index + 1}`}
                    className="object-cover w-full h-24 rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute p-1 text-white bg-red-500 rounded-full -top-2 -right-2 hover:bg-red-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        {/* Submit Button */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={onBack}
            className="px-6 py-3 transition-colors border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading.creating || formData.items.length === 0 || !formData.reason}
            className="flex items-center px-6 py-3 text-white transition-colors bg-pink-600 rounded-lg hover:bg-pink-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading.creating ? (
              <>
                <div className="w-4 h-4 mr-2 border-b-2 border-white rounded-full animate-spin"></div>
                Submitting...
              </>
            ) : (
              <>
                <Package className="w-4 h-4 mr-2" />
                Submit Return Request
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
export default ReturnRequest;