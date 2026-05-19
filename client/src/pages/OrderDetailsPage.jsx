"use client";

import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import InvoiceDownloadButton from "./InvoiceDownloadButton";
import {
  ArrowLeft,
  Package,
  CheckCircle,
  Clock,
  Truck,
  X,
  CreditCard,
  MapPin,
  Info,
  AlertCircle,
  Tag,
  IndianRupee,
  Layers,
  Palette,
  Ruler,
  ShoppingBag,
  Sparkles,
  Calendar,
  Phone,
  Mail,
  Home,
  Receipt,
  ShieldCheck,
} from "lucide-react";
import { fetchOrderDetails, clearError } from "../store/slices/orderSlice";
import LoadingSpinner from "../components/LoadingSpinner";

const OrderDetailsPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { orderId } = useParams();

  const {
    currentOrder: order,
    loading,
    error,
  } = useSelector((state) => state.orders || {});

  const [activeSection, setActiveSection] = useState("items");

  useEffect(() => {
    if (orderId) dispatch(fetchOrderDetails(orderId));
  }, [dispatch, orderId]);

  useEffect(() => {
    if (error) setTimeout(() => dispatch(clearError()), 5000);
  }, [error, dispatch]);

  const isBulkOrder = () => order?.items?.some((i) => i.isBulkProduct === true);

  const getBulkItemDisplay = (item) => {
    if (item.isBulkProduct) {
      const pieces = item.totalPieces || (item.piecesPerSet * (item.totalSets || item.quantity));
      const sets = item.totalSets || item.quantity;
      return `${pieces} pieces (${sets} set${sets > 1 ? "s" : ""})`;
    }
    return `Qty: ${item.quantity}`;
  };

  const getItemPrice = (item) =>
    item.isBulkProduct && item.pricePerSet ? `₹${item.pricePerSet}/set` : `₹${item.price}`;

  const getItemTotal = (item) => {
    if (item.isBulkProduct) {
      const sets = item.totalSets || item.quantity || 1;
      const pricePerSet = item.pricePerSet || item.price || 0;
      return pricePerSet * sets;
    }
    return (item.price || 0) * (item.quantity || 1);
  };

  const statusMap = {
    confirmed: { label: "Order Confirmed", icon: CheckCircle, color: "emerald" },
    processing: { label: "Processing", icon: Clock, color: "amber" },
    shipped: { label: "Shipped", icon: Truck, color: "violet" },
    delivered: { label: "Delivered", icon: CheckCircle, color: "emerald" },
    cancelled: { label: "Cancelled", icon: X, color: "rose" },
  };
  const getStatus = (s) => statusMap[s?.toLowerCase()] || { label: "Pending", icon: Clock, color: "neutral" };

  const statusBadgeClass = (s) => {
    const map = {
      emerald: "bg-emerald-50 text-emerald-700 ring-emerald-200",
      amber: "bg-amber-50 text-amber-700 ring-amber-200",
      violet: "bg-violet-50 text-violet-700 ring-violet-200",
      rose: "bg-rose-50 text-rose-700 ring-rose-200",
      neutral: "bg-neutral-100 text-neutral-700 ring-neutral-200",
    };
    return map[getStatus(s).color];
  };

  if (loading?.fetching) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#faf7f5]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#faf7f5] p-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md rounded-3xl border border-neutral-200/70 bg-white p-10 text-center shadow-[0_20px_60px_-15px_rgba(220,38,38,0.15)]"
        >
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-50 to-red-100">
            <AlertCircle className="h-10 w-10 text-red-600" />
          </div>
          <h2 className="mb-2 text-2xl font-bold tracking-tight text-neutral-900">Order Not Found</h2>
          <p className="mb-8 text-sm text-neutral-500">
            {error || "We couldn't retrieve this order. Please try again."}
          </p>
          <button
            onClick={() => navigate("/orders")}
            className="inline-flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-red-600 to-red-700 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-red-600/20 transition-all hover:shadow-xl hover:shadow-red-600/30"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Orders
          </button>
        </motion.div>
      </div>
    );
  }

  const isBulk = isBulkOrder();
  const StatusIcon = getStatus(order.status).icon;

  const cardBase =
    "rounded-3xl border border-neutral-200/70 bg-white shadow-[0_4px_24px_-8px_rgba(0,0,0,0.06)]";

  return (
    <div className="min-h-screen bg-[#faf7f5]">
      {/* Decorative top gradient */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-red-50/80 via-rose-50/30 to-transparent" />

      <div className="relative mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
        {/* Top bar */}
        <div className="mb-6 flex items-center justify-between gap-3">
          <button
            onClick={() => navigate("/orders")}
            className="group inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white/80 px-4 py-2 text-sm font-medium text-neutral-700 shadow-sm backdrop-blur transition-all hover:border-red-200 hover:bg-white hover:text-red-600"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
            <span className="hidden sm:inline">Back to Orders</span>
            <span className="sm:hidden">Back</span>
          </button>

          <div className="flex items-center gap-2 rounded-full border border-neutral-200 bg-white/80 px-3 py-1.5 text-xs text-neutral-600 shadow-sm backdrop-blur">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
            Secure Order
          </div>
        </div>

        {/* Hero Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`${cardBase} relative mb-6 overflow-hidden`}
        >
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-gradient-to-br from-red-100 to-rose-200/50 blur-3xl" />
          <div className="absolute -bottom-32 -left-20 h-64 w-64 rounded-full bg-gradient-to-tr from-orange-100 to-red-100/50 blur-3xl" />

          <div className="relative p-6 sm:p-8 lg:p-10">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex-1">
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-600">
                    <Receipt className="h-3 w-3" />
                    Order
                  </span>
                  {isBulk && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-red-600 to-rose-600 px-3 py-1 text-xs font-semibold text-white shadow-sm">
                      <Sparkles className="h-3 w-3" />
                      BULK ORDER
                    </span>
                  )}
                </div>

                <h1 className="text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl lg:text-4xl">
                  #{order.orderNumber || "N/A"}
                </h1>

                <div className="mt-3 flex items-center gap-2 text-sm text-neutral-500">
                  <Calendar className="h-4 w-4" />
                  Placed on{" "}
                  {new Date(order.createdAt).toLocaleDateString("en-IN", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </div>

                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <span
                    className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-semibold ring-1 ${statusBadgeClass(order.status)}`}
                  >
                    <StatusIcon className="h-4 w-4" />
                    {getStatus(order.status).label}
                  </span>
                </div>
              </div>

              <div className="flex flex-col items-start gap-1 rounded-2xl border border-red-100 bg-gradient-to-br from-red-50 to-rose-50/50 p-5 lg:items-end lg:text-right">
                <span className="text-xs font-medium uppercase tracking-wider text-red-600/80">
                  Total Amount
                </span>
                <span className="flex items-center text-3xl font-bold text-neutral-900 sm:text-4xl">
                  <IndianRupee className="h-7 w-7" />
                  {order.pricing?.total || order.total || 0}
                </span>
                <span className="text-xs text-neutral-500">
                  {order.items?.length || 0} item{(order.items?.length || 0) !== 1 ? "s" : ""}
                </span>
              </div>
            </div>

            {/* Partial COD - Fixed syntax */}
            {order.partialCod?.enabled && (
              <div className="mt-6 flex items-start gap-3 rounded-2xl border border-blue-100 bg-blue-50/70 p-4">
                <Info className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600" />
                <p className="text-sm text-blue-800">
                  <strong>Partial COD:</strong> {order.partialCod.percentage}% (₹
                  {order.partialCod.onlineAmount}) paid online, ₹{order.partialCod.codAmount} on delivery
                </p>
              </div>
            )}

            {order.status === "cancelled" && order.cancelReason && (
              <div className="mt-6 flex items-start gap-3 rounded-2xl border border-rose-100 bg-rose-50/70 p-4">
                <Info className="mt-0.5 h-5 w-5 flex-shrink-0 text-rose-600" />
                <p className="text-sm text-rose-800">
                  <strong>Cancelled:</strong> "{order.cancelReason}"
                </p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={`${cardBase} overflow-hidden`}
        >
          <div className="border-b border-neutral-100 bg-neutral-50/50 p-2">
            <div className="flex gap-1 overflow-x-auto">
              {[
                { id: "items", label: "Items", icon: ShoppingBag },
                { id: "address", label: "Shipping & Payment", icon: MapPin },
                { id: "tracking", label: "Tracking", icon: Truck },
              ].map((tab) => {
                const Icon = tab.icon;
                const active = activeSection === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveSection(tab.id)}
                    className={`relative flex flex-1 min-w-fit items-center justify-center gap-2 whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-medium transition-all ${
                      active
                        ? "bg-white text-red-600 shadow-sm ring-1 ring-neutral-200/70"
                        : "text-neutral-600 hover:text-neutral-900"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="p-5 sm:p-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeSection}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {/* ITEMS */}
                {activeSection === "items" && (
                  <div className="space-y-8">
                    <div>
                      <h2 className="mb-1 text-lg font-bold text-neutral-900">Order Items</h2>
                      <p className="text-sm text-neutral-500">
                        {isBulk ? "Includes bulk items" : "Items in this order"}
                      </p>
                    </div>

                    {order.items?.length > 0 ? (
                      <div className="space-y-3">
                        {order.items.map((item, idx) => (
                          <motion.div
                            key={idx}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className="group relative flex gap-4 rounded-2xl border border-neutral-200/70 bg-white p-4 transition-all hover:border-red-200 hover:shadow-md sm:p-5"
                          >
                            {item.isBulkProduct && (
                              <div className="absolute -right-1.5 -top-1.5 z-10 rounded-full bg-gradient-to-r from-red-600 to-rose-600 px-2 py-0.5 text-[10px] font-bold text-white shadow-md">
                                BULK
                              </div>
                            )}

                            <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl bg-neutral-100 sm:h-24 sm:w-24">
                              <img
                                src={
                                  item?.product?.images?.[0]?.url ||
                                  "https://placehold.co/120x120/f5f5f5/999?text=No+Image"
                                }
                                alt={item?.name || "Product"}
                                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = "https://placehold.co/120x120/f5f5f5/999?text=No+Image";
                                }}
                              />
                            </div>

                            <div className="flex flex-1 flex-col justify-between min-w-0">
                              <div>
                                <h4 className="truncate text-sm font-semibold text-neutral-900 sm:text-base">
                                  {item?.name || "N/A"}
                                </h4>

                                <div className="mt-2 flex flex-wrap gap-1.5">
                                  {item.isBulkProduct ? (
                                    <>
                                      <span className="inline-flex items-center gap-1 rounded-md bg-neutral-100 px-2 py-0.5 text-xs text-neutral-700">
                                        <Layers className="h-3 w-3" />
                                        {getBulkItemDisplay(item)}
                                      </span>
                                      {item.selectedColors?.length > 0 && (
                                        <span className="inline-flex items-center gap-1 rounded-md bg-neutral-100 px-2 py-0.5 text-xs text-neutral-700">
                                          <Palette className="h-3 w-3" />
                                          {item.selectedColors.join(", ")}
                                        </span>
                                      )}
                                    </>
                                  ) : (
                                    <>
                                      <span className="inline-flex items-center gap-1 rounded-md bg-neutral-100 px-2 py-0.5 text-xs text-neutral-700">
                                        Qty: {item?.quantity || 0}
                                      </span>
                                      {item?.size && (
                                        <span className="inline-flex items-center gap-1 rounded-md bg-neutral-100 px-2 py-0.5 text-xs text-neutral-700">
                                          <Ruler className="h-3 w-3" />
                                          {item.size}
                                        </span>
                                      )}
                                      {item?.color && (
                                        <span className="inline-flex items-center gap-1 rounded-md bg-neutral-100 px-2 py-0.5 text-xs text-neutral-700">
                                          <Palette className="h-3 w-3" />
                                          {item.color}
                                        </span>
                                      )}
                                    </>
                                  )}
                                </div>

                                <p className="mt-2 text-xs text-neutral-500">{getItemPrice(item)}</p>
                              </div>
                            </div>

                            <div className="flex flex-col items-end justify-center">
                              <span className="text-lg font-bold text-neutral-900 sm:text-xl">
                                ₹{getItemTotal(item)}
                              </span>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    ) : (
                      <p className="py-12 text-center text-sm text-neutral-500">No items found.</p>
                    )}

                    {/* Pricing */}
                    <div className="rounded-2xl border border-neutral-200/70 bg-gradient-to-br from-neutral-50 to-white p-6">
                      <h3 className="mb-5 flex items-center gap-2 text-base font-bold text-neutral-900">
                        <Receipt className="h-5 w-5 text-red-600" />
                        Pricing Summary
                      </h3>

                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between text-neutral-600">
                          <span>Subtotal</span>
                          <span className="font-medium text-neutral-900">
                            ₹{order.pricing?.subtotal || order.subtotal || 0}
                          </span>
                        </div>
                        <div className="flex justify-between text-neutral-600">
                          <span>Shipping</span>
                          <span className="font-medium text-neutral-900">
                            ₹{order.pricing?.shipping || order.shippingCharge || 0}
                          </span>
                        </div>
                        {(order.pricing?.freediscount || order.freediscount) > 0 && (
                          <div className="flex justify-between text-neutral-600">
                            <span>Free Discount</span>
                            <span className="font-medium text-blue-600">
                              − ₹{order.pricing?.freediscount || order.freediscount || 0}
                            </span>
                          </div>
                        )}
                        {(order.pricing?.referralDiscount || order.referralDiscount) > 0 && (
                          <div className="flex justify-between text-neutral-600">
                            <span>Referral Discount</span>
                            <span className="font-medium text-purple-600">
                              − ₹{order.pricing?.referralDiscount || order.referralDiscount || 0}
                            </span>
                          </div>
                        )}
                        {order.discount > 0 && (
                          <div className="flex justify-between text-neutral-600">
                            <span>Coupon Discount</span>
                            <span className="font-medium text-emerald-600">− ₹{order.discount}</span>
                          </div>
                        )}
                        {order.couponCode && (
                          <div className="flex justify-between text-neutral-600">
                            <span className="flex items-center gap-1.5">
                              <Tag className="h-3.5 w-3.5" />
                              Coupon
                            </span>
                            <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                              {order.couponCode}
                            </span>
                          </div>
                        )}
                        <div className="my-3 border-t border-dashed border-neutral-200" />
                        <div className="flex items-center justify-between">
                          <span className="text-base font-bold text-neutral-900">Total Paid</span>
                          <span className="flex items-center text-2xl font-bold text-red-600">
                            <IndianRupee className="h-5 w-5" />
                            {order.pricing?.total || order.total || 0}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ADDRESS */}
                {activeSection === "address" && (
                  <div className="grid gap-5 lg:grid-cols-2">
                    <div className="rounded-2xl border border-neutral-200/70 bg-white p-6">
                      <div className="mb-5 flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50">
                          <MapPin className="h-5 w-5 text-red-600" />
                        </div>
                        <h3 className="text-base font-bold text-neutral-900">Shipping Address</h3>
                      </div>

                      <div className="space-y-3 text-sm">
                        {[
                          { icon: null, label: "Name", value: order.shippingAddress?.fullName },
                          { icon: Phone, label: "Phone", value: order.shippingAddress?.phoneNumber },
                          { icon: Mail, label: "Email", value: order.shippingAddress?.email || order.user?.email },
                          {
                            icon: Home,
                            label: "Address",
                            value: `${order.shippingAddress?.addressLine1 || "N/A"}${order.shippingAddress?.addressLine2 ? `, ${order.shippingAddress.addressLine2}` : ""}`,
                          },
                          {
                            icon: null,
                            label: "City / State",
                            value: `${order.shippingAddress?.city || "N/A"}, ${order.shippingAddress?.state || "N/A"}`,
                          },
                          { icon: null, label: "Pincode", value: order.shippingAddress?.pinCode },
                          ...(order.shippingAddress?.landmark
                            ? [{ icon: null, label: "Landmark", value: order.shippingAddress.landmark }]
                            : []),
                        ].map((row, i) => (
                          <div key={i} className="flex items-start justify-between gap-4 border-b border-neutral-100 pb-3 last:border-0 last:pb-0">
                            <span className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-neutral-500">
                              {row.icon && <row.icon className="h-3.5 w-3.5" />}
                              {row.label}
                            </span>
                            <span className="text-right text-sm font-medium text-neutral-900">
                              {row.value || "N/A"}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Invoice and Payment Section */}
                    <div className="space-y-5">
                      {/* Invoice Download */}
                      <div className="rounded-2xl border border-neutral-200/70 bg-white p-6">
                        <div className="mb-5 flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50">
                            <Receipt className="h-5 w-5 text-red-600" />
                          </div>
                          <h3 className="text-base font-bold text-neutral-900">Download Invoice</h3>
                        </div>
                        <InvoiceDownloadButton order={order} />
                      </div>

                      {/* Payment Information */}
                      <div className="rounded-2xl border border-neutral-200/70 bg-white p-6">
                        <div className="mb-5 flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50">
                            <CreditCard className="h-5 w-5 text-red-600" />
                          </div>
                          <h3 className="text-base font-bold text-neutral-900">Payment Information</h3>
                        </div>

                        <div className="space-y-3 text-sm">
                          <div className="flex items-start justify-between gap-4 border-b border-neutral-100 pb-3">
                            <span className="text-xs font-medium uppercase tracking-wide text-neutral-500">Method</span>
                            <span className="text-sm font-medium text-neutral-900">
                              {order.paymentInfo?.method || "N/A"}
                            </span>
                          </div>
                          <div className="flex items-start justify-between gap-4 border-b border-neutral-100 pb-3">
                            <span className="text-xs font-medium uppercase tracking-wide text-neutral-500">Status</span>
                            <span
                              className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${
                                order.paymentInfo?.status === "PAID" || order.paymentInfo?.status === "PARTIALLY_PAID"
                                  ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                                  : "bg-rose-50 text-rose-700 ring-rose-200"
                              }`}
                            >
                              {order.paymentInfo?.status || "N/A"}
                            </span>
                          </div>
                          {order.paymentInfo?.razorpayOrderId && (
                            <div className="border-b border-neutral-100 pb-3">
                              <span className="block text-xs font-medium uppercase tracking-wide text-neutral-500">
                                Razorpay Order ID
                              </span>
                              <span className="mt-1 block break-all font-mono text-xs text-neutral-700">
                                {order.paymentInfo.razorpayOrderId}
                              </span>
                            </div>
                          )}
                          {order.paymentInfo?.razorpayPaymentId && (
                            <div className="border-b border-neutral-100 pb-3">
                              <span className="block text-xs font-medium uppercase tracking-wide text-neutral-500">
                                Razorpay Payment ID
                              </span>
                              <span className="mt-1 block break-all font-mono text-xs text-neutral-700">
                                {order.paymentInfo.razorpayPaymentId}
                              </span>
                            </div>
                          )}

                          {order.partialCod?.enabled && (
                            <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50/60 p-4">
                              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-blue-700">
                                Partial COD Breakdown
                              </p>
                              <div className="space-y-1 text-xs text-blue-800">
                                <p>
                                  {order.partialCod.percentage}% online: <strong>₹{order.partialCod.onlineAmount}</strong>
                                </p>
                                <p>
                                  On delivery: <strong>₹{order.partialCod.codAmount}</strong>
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* TRACKING */}
                {activeSection === "tracking" && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="mb-1 text-lg font-bold text-neutral-900">Order Tracking</h2>
                      <p className="text-sm text-neutral-500">Follow your order journey</p>
                    </div>

                    {/* Vertical timeline (mobile) / Horizontal (desktop) */}
                    <div className="rounded-2xl border border-neutral-200/70 bg-gradient-to-br from-neutral-50 to-white p-6 sm:p-8">
                      {(() => {
                        const steps = [
                          { key: "placed", label: "Placed", icon: CheckCircle, date: order.createdAt },
                          { key: "processed", label: "Processed", icon: Package },
                          { key: "shipped", label: "Shipped", icon: Truck, date: order.shippedAt },
                          { key: "delivered", label: "Delivered", icon: CheckCircle, date: order.deliveredAt },
                        ];
                        const statusLevel = {
                          confirmed: 1,
                          processing: 1,
                          shipped: 2,
                          delivered: 3,
                          cancelled: 0,
                        }[order.status?.toLowerCase()] ?? 0;

                        return (
                          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between sm:gap-2">
                            {steps.map((step, i) => {
                              const Icon = step.icon;
                              const done = i <= statusLevel && order.status !== "cancelled";
                              return (
                                <div key={step.key} className="flex flex-1 items-start gap-4 sm:flex-col sm:items-center sm:text-center">
                                  <div className="relative flex flex-col items-center sm:w-full">
                                    <div
                                      className={`relative z-10 flex h-11 w-11 items-center justify-center rounded-full ring-4 transition-all ${
                                        done
                                          ? "bg-gradient-to-br from-red-600 to-rose-600 text-white ring-red-100 shadow-lg shadow-red-600/20"
                                          : "bg-white text-neutral-400 ring-neutral-100"
                                      }`}
                                    >
                                      <Icon className="h-5 w-5" />
                                    </div>
                                    {i < steps.length - 1 && (
                                      <div
                                        className={`absolute left-1/2 top-11 -translate-x-1/2 sm:left-[calc(50%+22px)] sm:top-5 sm:h-0.5 sm:w-[calc(100%-22px)] sm:translate-x-0 ${
                                          i < statusLevel && order.status !== "cancelled"
                                            ? "bg-gradient-to-r from-red-500 to-rose-500"
                                            : "bg-neutral-200"
                                        } h-12 w-0.5 sm:h-0.5 sm:w-full`}
                                      />
                                    )}
                                  </div>
                                  <div className="flex-1 sm:mt-3 sm:flex-none">
                                    <p className={`text-sm font-semibold ${done ? "text-neutral-900" : "text-neutral-400"}`}>
                                      {step.label}
                                    </p>
                                    {step.date && done && (
                                      <p className="mt-0.5 text-xs text-neutral-500">
                                        {new Date(step.date).toLocaleDateString("en-IN", {
                                          day: "numeric",
                                          month: "short",
                                        })}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })()}
                    </div>

                    {/* Status Message */}
                    <div
                      className={`rounded-2xl border p-6 text-center ${
                        order.status === "delivered"
                          ? "border-emerald-100 bg-emerald-50/60"
                          : order.status === "shipped"
                          ? "border-violet-100 bg-violet-50/60"
                          : order.status === "cancelled"
                          ? "border-rose-100 bg-rose-50/60"
                          : "border-amber-100 bg-amber-50/60"
                      }`}
                    >
                      {order.status === "delivered" ? (
                        <>
                          <CheckCircle className="mx-auto mb-3 h-10 w-10 text-emerald-600" />
                          <h3 className="text-base font-bold text-emerald-900">Delivered Successfully!</h3>
                          <p className="mt-1 text-sm text-emerald-700">Thank you for shopping with us.</p>
                        </>
                      ) : order.status === "shipped" ? (
                        <>
                          <Truck className="mx-auto mb-3 h-10 w-10 text-violet-600" />
                          <h3 className="text-base font-bold text-violet-900">On the Way!</h3>
                          <p className="mt-1 text-sm text-violet-700">Your order has been shipped.</p>
                        </>
                      ) : order.status === "cancelled" ? (
                        <>
                          <X className="mx-auto mb-3 h-10 w-10 text-rose-600" />
                          <h3 className="text-base font-bold text-rose-900">Order Cancelled</h3>
                          {order.cancelReason && (
                            <p className="mt-1 text-sm text-rose-700">{order.cancelReason}</p>
                          )}
                        </>
                      ) : (
                        <>
                          <Clock className="mx-auto mb-3 h-10 w-10 text-amber-600" />
                          <h3 className="text-base font-bold text-amber-900">Being Processed</h3>
                          <p className="mt-1 text-sm text-amber-700">Tracking details will be shared soon.</p>
                        </>
                      )}
                    </div>

                    {order.status !== "delivered" && order.status !== "cancelled" && (
                      <div className="flex items-center justify-center gap-2 rounded-2xl border border-red-100 bg-gradient-to-r from-red-50 to-rose-50 px-4 py-3 text-sm">
                        <Calendar className="h-4 w-4 text-red-600" />
                        <span className="text-neutral-700">
                          Estimated delivery:{" "}
                          <strong className="text-red-600">
                            {new Date(
                              new Date(order.createdAt).getTime() + 7 * 24 * 60 * 60 * 1000
                            ).toLocaleDateString("en-IN", { day: "numeric", month: "long" })}
                          </strong>
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default OrderDetailsPage;