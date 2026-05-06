const Order = require("../models/Order");
const User = require("../models/User");
const Product = require("../models/Product");
const Coupon = require("../models/Coupon");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const shiprocketService = require("../services/shiprocketService");
const { sendEmail } = require("../utils/emailService");

// Unified order shaper for client responses
const shapeOrder = (o) => {
  if (!o) return o;
  const statusRaw = (o.status || "").toString();
  // normalize status to lowercase for client
  const status = statusRaw ? statusRaw.toLowerCase() : "pending";
  const subtotal = o.subtotal ?? (o.pricing && o.pricing.subtotal) ?? 0;
  const shippingCharge = o.shippingCharge ?? (o.pricing && (o.pricing.shippingCharges ?? o.pricing.shippingCharge)) ?? 0;
  const discount = o.discount ?? (o.pricing && o.pricing.discount) ?? 0;
  const total = o.total ?? (o.pricing && o.pricing.total) ?? subtotal + shippingCharge - discount;
  const freediscount = o.freediscount ?? (o.pricing && o.pricing.freediscount) ?? 0

  return {
    ...o.toObject?.() ?? o,
    status,
    pricing: {
      subtotal,
      shipping: shippingCharge,
      discount,
      total,
      freediscount
    },
  };
};

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Email transporter setup
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Enhanced Shiprocket integration function (kept your original style)
const createShiprocketOrder = async (order) => {
  try {
    // Check if Shiprocket service is properly configured
    if (
      !shiprocketService ||
      !process.env.SHIPROCKET_EMAIL ||
      !process.env.SHIPROCKET_PASSWORD
    ) {
      return { success: false, error: "Shiprocket service not configured" };
    }
    // Create order on Shiprocket
    const shiprocketOrderResponse = await shiprocketService.createOrder(order);
    if (shiprocketOrderResponse.status_code === 1) {
      const shipmentId = shiprocketOrderResponse.shipment_id;
      // ✅ Just save shipmentId to the order
      order.shiprocketShipmentId = shipmentId;
      order.shiprocketOrderId = shiprocketOrderResponse.order_id
      // order["shiprocketShipmentId"] = 935898884;
      await order.save();
      return {
        success: true,
        shiprocketOrderId: shiprocketOrderResponse.order_id,
        shipmentId: shipmentId,
        order: order
      };
    }
    throw new Error("Failed to create shipment");
  } catch (error) {
    console.error("❌ Shiprocket integration failed:", error.message);
    // Update order with error info but don't fail the order
    order.trackingInfo = {
      carrier: "Manual Processing",
      currentStatus: "Order Confirmed - Manual Processing",
      lastUpdate: new Date(),
      error: error.message,
    };
    await order.save();
    return { success: false, error: error.message };
  }
};


// Create Razorpay order (unchanged)
const createRazorpayOrder = async (req, res) => {
  try {

    // Allow guest checkout → userId will be null if not logged in
    const userId = req.user?.userId || null;
    const { items, shippingAddress, couponCode, selectedShippingRate, amount, freediscount } = req.body;

    // Validate required fields
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Cart items are required",
      });
    }

    if (
      !shippingAddress ||
      !shippingAddress.fullName ||
      !shippingAddress.phoneNumber ||
      !shippingAddress.pinCode
    ) {
      return res.status(400).json({
        success: false,
        message: "Complete shipping address is required",
      });
    }

    // Validate and calculate order total
    let subtotal = 0;
    const validatedItems = [];

    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) {
        return res.status(400).json({
          success: false,
          message: `Product not found: ${item.productId}`,
        });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${product.name}`,
        });
      }

      const itemTotal = product.price * item.quantity;
      subtotal += itemTotal;

      validatedItems.push({
        product: product._id,
        name: product.name,
        price: product.price,
        quantity: item.quantity,
        size: item.size,
        color: item.color || "Default",
        image: product.images[0]?.url,
        itemTotal,
      });
    }

    // Apply coupon logic
    let discount = 0;
    let couponDetails = null;
    if (couponCode) {
      const coupon = await Coupon.findOne({ code: couponCode, isActive: true });
      if (coupon && new Date() <= coupon.validUntil) {
        if (subtotal >= coupon.minOrderValue) {
          if (coupon.discountType === "percentage") {
            discount = Math.min(
              (subtotal * coupon.discountValue) / 100,
              coupon.maxDiscountAmount || discount
            );
          } else {
            discount = coupon.discountValue;
          }
          couponDetails = {
            code: coupon.code,
            discountAmount: discount,
            discountType: coupon.discountType,
          };
        }
      }
    }

    const shippingCharges = subtotal >= 399 ? 0 : 99;
    const tax = 0;
    const total = Math.round(amount);

    // Generate order number
    const orderNumber = `FH-${Date.now()}`;

    // Create Razorpay order
    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(amount * 100),
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
      notes: { userId: userId || "guest", couponCode: couponCode || "" },
    });

    // Create order in DB
    const order = new Order({
      user: userId, // will be null for guests
      orderNumber,
      items: validatedItems,
      shippingAddress,
      subtotal,
      shippingCharge: shippingCharges,
      freediscount: freediscount,
      discount,
      total:total,
      pricing: { subtotal, shippingCharges, tax, discount, total, freediscount, selectedShippingRate },
      coupon: couponDetails,
      paymentInfo: {
        razorpayOrderId: razorpayOrder.id,
        method: "RAZORPAY",
        status: "PENDING",
      },
      status: "ABANDONED", // safe default
      trackingInfo: { awbStatus: "PENDING" },
      createdAt: new Date(),
    });


    await order.save();


    // Store temp order only for logged-in users
    if (userId) {

      const tempOrderData = {
        user: userId,
        orderNumber,
        items: validatedItems.map(({ _id, __v, ...rest }) => rest),
        shippingAddress,
        pricing: { subtotal, shippingCharges, tax, discount, total, freediscount, selectedShippingRate },
        coupon: couponDetails,
        freediscount: freediscount,
        paymentInfo: {
          razorpayOrderId: razorpayOrder.id,
          method: "RAZORPAY",
          status: "pending",
        },
        status: "CONFIRMED",
        createdAt: new Date(),
        total : total,
        subtotal,
        discount,
        temp_order_id: order._id,
      };

      await User.findByIdAndUpdate(userId, { tempOrderData }, { new: true });
    }

    res.status(200).json({
      success: true,
      razorpayOrder: {
        id: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
      },
      orderSummary: {
        orderNumber,
        total,
        freediscount:freediscount,
        items: validatedItems.length,
        isGuest: !userId, // helpful to know if guest checkout
      },
    });
  } catch (error) {
    console.error("Create Razorpay order error:", error);
    res.status(500).json({ success: false, message: "Failed to create order" });
  }
};


// Enhanced payment verification — now responds first, Shiprocket/email later
const verifyPaymentAndCreateOrder = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    const userId = req.user?.userId || null; // ✅ optional

    // 1) Verify Razorpay signature
    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Payment verification failed",
      });
    }

    let order;

    if (userId) {
      // ✅ Logged-in user flow → get temp order from user
      const user = await User.findById(userId).lean();
      if (!user?.tempOrderData) {
        return res
          .status(400)
          .json({ success: false, message: "Order data not found" });
      }

      const temp_order_id = user.tempOrderData?.temp_order_id;
      order = await Order.findOne({ _id: temp_order_id, user: userId });
      if (!order) {
        return res
          .status(404)
          .json({ success: false, message: "Order not found" });
      }
    } else {
      // ✅ Guest flow → find by razorpayOrderId directly
      order = await Order.findOne({
        "paymentInfo.razorpayOrderId": razorpay_order_id,
      });
      if (!order) {
        return res
          .status(404)
          .json({ success: false, message: "Guest order not found" });
      }
    }

    // 2) Update order payment info
    order.status = "CONFIRMED";
    order.paymentInfo = {
      ...order.paymentInfo,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
      status: "PAID",
      paidAt: new Date(),
      method: "RAZORPAY",
    };

    await order.save();

    // 3) Update stock
    await Promise.all(
      order.items.map((item) =>
        Product.findByIdAndUpdate(item.product, {
          $inc: { stock: -item.quantity },
        })
      )
    );

    // 4) Update coupon usage (only if logged in and coupon exists)
    if (userId && order.coupon?.code) {
      const coupon = await Coupon.findOne({ code: order.coupon.code });
      if (coupon) {
        coupon.usedCount += 1;
        const userUsage = coupon.usedBy.find(
          (u) => u.user.toString() === userId
        );
        if (userUsage) {
          userUsage.usedCount += 1;
          userUsage.lastUsed = new Date();
        } else {
          coupon.usedBy.push({
            user: userId,
            usedCount: 1,
            lastUsed: new Date(),
          });
        }
        await coupon.save();
      }
    }

    // 5) Respond immediately
    res.status(200).json({
      success: true,
      message: "Order placed successfully",
      order: {
        id: order._id,
        orderNumber: order.orderNumber,
        total: order.total,
        status: order.status,
        trackingNumber: order.trackingInfo?.trackingNumber,
        estimatedDelivery: order.trackingInfo?.estimatedDelivery,
        shiprocketIntegration: "Pending",
        pricing: {
          subtotal: order.subtotal,
          shipping: order.shippingCharge,
          discount: order.discount,
          total: order.total,
          freediscount: order.freediscount,
          selectedShippingRate: order.selectedShippingRate,
        },
      },
    });

    // 6) Background tasks → Shiprocket, email, clear cart (if logged in)
    setImmediate(async () => {
      try {
        const populatedOrder = await Order.findById(order._id).populate(
          "user",
          "name email phoneNumber total"
        );

        const shiprocketResult = await createShiprocketOrder(populatedOrder);

        if (userId) {
          await User.findByIdAndUpdate(userId, { cart: [], tempOrderData: null });
          try {
            await sendOrderConfirmationEmail(populatedOrder.user, populatedOrder);
          } catch (emailError) {
            console.error("Email sending failed:", emailError);
          }
        } else {
          // Guest order → maybe send email if address has email field
          if (order.shippingAddress?.email) {
            try {
              await sendOrderConfirmationEmail(
                { email: order.shippingAddress.email, name: order.shippingAddress.fullName },
                populatedOrder
              );
            } catch (emailError) {
              console.error("Guest email sending failed:", emailError);
            }
          }
        }


      } catch (bgErr) {
        console.error("Background SR/email error:", bgErr);
      }
    });
  } catch (error) {
    console.error("Verify payment error:", error);
    res.status(500).json({ success: false, message: "Payment verification failed" });
  }
};


// COD order — respond first, run Shiprocket/email in background
const placeCodOrder = async (req, res) => {
  try {
      const userId = req.user?.userId || null; // ✅ allow guest
      const { items, shippingAddress, couponCode, selectedShippingRate, amount, freediscount,} = req.body;

    // Validate cart
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: "Cart items are required" });
    }

    // Validate address
    if (
      !shippingAddress ||
      !shippingAddress.fullName ||
      !shippingAddress.phoneNumber ||
      !shippingAddress.pinCode
    ) {
      return res.status(400).json({
        success: false,
        message: "Complete shipping address is required",
      });
    }

    // Validate and calculate using DB prices
    let subtotal = 0;
    const validatedItems = [];
    for (const it of items) {
      const product = await Product.findById(it.productId).select("name price images stock");
      if (!product) {
        return res.status(400).json({ success: false, message: `Product not found: ${it.productId}` });
      }
      if (product.stock < it.quantity) {
        return res.status(400).json({ success: false, message: `Insufficient stock for ${product.name}` });
      }

      const quantity = Number(it.quantity || 1);
      const price = Number(product.price || 0);
      const itemTotal = price * quantity;
      subtotal += itemTotal;

      validatedItems.push({
        product: product._id,
        name: product.name,
        price,
        quantity,
        size: it.size || "",
        color: it.color || "Default",
        image: product.images?.[0],
        itemTotal,
      });
    }

    // Coupon logic
    let discount = 0;
    let couponDetails = null;
    if (couponCode) {
      const coupon = await Coupon.findOne({ code: couponCode, isActive: true });
      if (coupon && new Date() <= coupon.validUntil && subtotal >= (coupon.minOrderValue || 0)) {
        discount =
          coupon.discountType === "percentage"
            ? Math.min((subtotal * coupon.discountValue) / 100, coupon.maxDiscountAmount || Infinity)
            : coupon.discountValue || 0;

        couponDetails = {
          code: coupon.code,
          discountAmount: discount,
          discountType: coupon.discountType,
        };
      }
    }

    const shippingCharges = subtotal >= 399 ? 0 : 99;
    const tax = 0;
    const total =  Math.round(amount);

    // Build order
    const orderNumber = `FH-${Date.now()}`;
    const order = new Order({
      user: userId, // ✅ null if guest
      orderNumber,
      items: validatedItems,
      shippingAddress,
      subtotal,
      shippingCharge: shippingCharges,
      freediscount: freediscount,
      discount,
      total: total,
      pricing: { subtotal, shippingCharges, tax, discount, total, freediscount, selectedShippingRate },
      coupon: couponDetails,
      paymentInfo: {
        method: "COD",
        status: "PENDING",
        razorpayOrderId: orderNumber, // keep for consistency
      },
      status: "CONFIRMED",
      trackingInfo: { awbStatus: "PENDING" },
      createdAt: new Date(),
    });

    await order.save();

    // Decrement stock
    await Promise.all(
      validatedItems.map((it) =>
        Product.findByIdAndUpdate(it.product, { $inc: { stock: -it.quantity } })
      )
    );

    // Respond immediately
    res.status(200).json({
      success: true,
      message: "COD order placed successfully",
      order: {
        id: order._id,
        orderNumber: order.orderNumber,
        total: order.total,
        status: order.status,
        trackingNumber: order.trackingInfo?.trackingNumber,
        estimatedDelivery: order.trackingInfo?.estimatedDelivery,
        shiprocketIntegration: "Pending",
        pricing: {
          subtotal: order.subtotal,
          shipping: order.shippingCharge,
          discount: order.discount,
          total: order.total,
          freediscount: order.freediscount,
          selectedShippingRate: order.selectedShippingRate,
        },
        isGuest: !userId, // ✅ helpful flag
      },
    });

    // Background jobs
    setImmediate(async () => {
      try {
        const populatedOrder = await Order.findById(order._id).populate("user", "name email phoneNumber");
        const sr = await createShiprocketOrder(populatedOrder).catch((e) => {
          console.error("Shiprocket error:", e?.message || e);
          return { success: false };
        });

        if (userId) {
          // ✅ logged-in user → clear cart + save tempOrderData
          if (sr.success) {
            await User.findByIdAndUpdate(userId, { tempOrderData: sr.order }, { new: true });
          }
          await User.findByIdAndUpdate(userId, { cart: [], tempOrderData: null });
          try {
            await sendOrderConfirmationEmail(populatedOrder.user, populatedOrder);
          } catch (emailErr) {
            console.error("Email sending failed:", emailErr?.message || emailErr);
          }
        } else {
          // ✅ guest → send email only if provided
          if (order.shippingAddress?.email) {
            try {
              await sendOrderConfirmationEmail(
                { email: order.shippingAddress.email, name: shippingAddress.fullName },
                populatedOrder
              );
            } catch (emailErr) {
              console.error("Guest email sending failed:", emailErr?.message || emailErr);
            }
          }
        }

      } catch (bgErr) {
        console.error("Background COD flow error:", bgErr?.message || bgErr);
      }
    });
  } catch (error) {
    console.error("Create COD order error:", error);
    return res.status(500).json({ success: false, message: "Failed to create COD order" });
  }
};


// Get shipping rates for checkout (unchanged)
const getShippingRates = async (req, res) => {
  try {

    const { deliveryPincode, weight = 0.5, cod = 0 } = req.body;

    if (!deliveryPincode) {
      return res.status(400).json({
        success: false,
        message: "Delivery pincode is required",
      });
    }

    // Validate pincode format
    if (!/^[1-9][0-9]{5}$/.test(deliveryPincode)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid 6-digit pincode",
      });
    }

    if (
      shiprocketService &&
      process.env.SHIPROCKET_EMAIL &&
      process.env.SHIPROCKET_PASSWORD
    ) {
      try {
        const pickupPincode = process.env.PICKUP_PINCODE || "110001";
        const rates = await shiprocketService.getShippingRates(
          pickupPincode,
          deliveryPincode,
          weight,
          cod
        );

        if (rates && rates.data && rates.data.available_courier_companies) {
          return res.status(200).json({
            success: true,
            rates: rates.data.available_courier_companies,
            source: "shiprocket",
          });
        }
      } catch (shiprocketError) {
        // Continue to fallback rates instead of failing
      }
    } else {
    }

    // Fallback mock rates (unchanged)
    const firstDigit = parseInt(deliveryPincode.charAt(0));
    let baseRate = 50;
    let expressRate = 80;
    if (firstDigit >= 1 && firstDigit <= 3) {
      baseRate = 40;
      expressRate = 70;
    } else if (firstDigit >= 4 && firstDigit <= 6) {
      baseRate = 50;
      expressRate = 80;
    } else if (firstDigit >= 7 && firstDigit <= 8) {
      baseRate = 60;
      expressRate = 90;
    } else if (firstDigit === 9) {
      baseRate = 55;
      expressRate = 85;
    }

    const mockRates = [
      {
        courier_company_id: 1,
        courier_name: "Standard Delivery",
        freight_charge: baseRate,
        cod_charge: cod > 0 ? 25 : 0,
        other_charges: 0,
        total_charge: baseRate + (cod > 0 ? 25 : 0),
        etd: "4-6 days",
        min_weight: 0.5,
        rate_type: "surface",
      },
      {
        courier_company_id: 2,
        courier_name: "Express Delivery",
        freight_charge: expressRate,
        cod_charge: cod > 0 ? 25 : 0,
        other_charges: 5,
        total_charge: expressRate + (cod > 0 ? 25 : 0) + 5,
        etd: "2-3 days",
        min_weight: 0.5,
        rate_type: "air",
      },
      {
        courier_company_id: 3,
        courier_name: "Same Day Delivery",
        freight_charge: 150,
        cod_charge: cod > 0 ? 25 : 0,
        other_charges: 10,
        total_charge: 150 + (cod > 0 ? 25 : 0) + 10,
        etd: "Same day",
        min_weight: 0.5,
        rate_type: "premium",
        available: firstDigit >= 1 && firstDigit <= 4,
      },
    ].filter((rate) => rate.available !== false);

    res.status(200).json({
      success: true,
      rates: mockRates,
      source: "fallback",
      message: "Shipping rates calculated (Shiprocket service unavailable)",
    });
  } catch (error) {
    console.error("❌ Get shipping rates error:", error);
    res
      .status(500)
      .json({
        success: false,
        message: "Failed to get shipping rates",
        error: error.message,
      });
  }
};

// Enhanced order tracking (unchanged)
const trackOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.userId;

    const order = await Order.findOne({ _id: orderId, user: userId }).populate(
      "items.product",
      "name images"
    );

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    let trackingData = null;
    let shiprocketTracking = null;

    if (order.trackingInfo?.trackingNumber && shiprocketService) {
      try {
        shiprocketTracking = await shiprocketService.trackShipment(
          order.trackingInfo.trackingNumber
        );

        if (shiprocketTracking.tracking_data?.track_status) {
          const trackStatus = shiprocketTracking.tracking_data.track_status;
          let newStatus = order.status;

          switch (trackStatus.toLowerCase()) {
            case "shipped":
            case "in transit":
              newStatus = "shipped";
              break;
            case "out for delivery":
              newStatus = "out_for_delivery";
              break;
            case "delivered":
              newStatus = "delivered";
              if (!order.deliveredAt) order.deliveredAt = new Date();
              break;
          }

          if (newStatus !== order.status) {
            order.status = newStatus;
            order.trackingInfo.currentStatus = trackStatus;
            order.trackingInfo.lastUpdate = new Date();
            await order.save();
          }
        }

        trackingData = shiprocketTracking.tracking_data;
      } catch (trackingError) {
        console.error("Tracking error:", trackingError);
      }
    }

    res
      .status(200)
      .json({ success: true, order, trackingData, shiprocketTracking });
  } catch (error) {
    console.error("Track order error:", error);
    res.status(500).json({ success: false, message: "Failed to track order" });
  }
};

// Enhanced order cancellation (unchanged)
// Cancel order (user)
const cancelOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { reason } = req.body;
    const userId = req.user.userId;

    // 1) Fetch order owned by user
    const order = await Order.findOne({ _id: orderId, user: userId });
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    // 2) Status guards (DB enum is UPPERCASE)
    const status = String(order.status || "").toUpperCase();
    const cancellable = ["PLACED", "CONFIRMED", "PROCESSING"]; // allow cancel before shipping
    const terminal = ["SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED", "RETURNED"];

    if (terminal.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Order cannot be cancelled after shipping/delivery",
      });
    }
    if (!cancellable.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Order cannot be cancelled at this stage",
      });
    }


    if (order?.shiprocketOrderId) {

      try {
        await shiprocketService.handleShiprocketOrderCancel(order);
      } catch (e) {
        console.error("❌ Shiprocket cancellation error:", e?.message || e);
        // continue; order cancellation should still proceed
      }

    }


    // 4) If prepaid (Razorpay) and paid, attempt refund (optional but recommended)
    try {
      const method = order.paymentInfo?.method;
      const pStatus = order.paymentInfo?.status;
      if (method === "RAZORPAY" && pStatus === "PAID" && razorpay?.payments?.refund) {
        const rupees =
          order.total ??
          order.pricing?.total ??
          ((order.subtotal || 0) + (order.shippingCharge || 0) - (order.discount || 0));
        const amountPaise = Math.max(0, Math.round((rupees || 0) * 100));

        const refund = await razorpay.payments.refund(order.paymentInfo.razorpayPaymentId, {
          amount: amountPaise,
          speed: "optimum",
          notes: { orderNumber: order.orderNumber || String(order._id) },
        });

        order.paymentInfo.status = "REFUNDED";
        order.paymentInfo.razorpayRefundId = refund?.id;
      }
    } catch (refundErr) {
      console.error("❌ Razorpay refund error:", refundErr?.message || refundErr);
      // mark for manual follow-up (do NOT break cancellation)
      order.paymentInfo = {
        ...(order.paymentInfo || {}),
        refundInitiated: true,
        refundError: (refundErr?.message || String(refundErr)).slice(0, 200),
      };
    }

    // 5) Apply cancellation
    order.status = "CANCELLED"; // enum uppercase
    order.cancelReason = reason || "Cancelled by user";
    order.cancelledAt = new Date();

    if (order.trackingInfo) {
      order.trackingInfo.currentStatus = "Cancelled";
      order.trackingInfo.lastUpdate = new Date();
    }

    await order.save();

    // 6) Restock items
    if (Array.isArray(order.items)) {
      for (const item of order.items) {
        if (item?.product && item?.quantity) {
          await Product.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity } });
        }
      }
    }

    return res.status(200).json({
      success: true,
      message: "Order cancelled successfully",
      order,
    });
  } catch (error) {
    console.error("Cancel order error:", error);
    return res.status(500).json({ success: false, message: "Failed to cancel order" });
  }
};


// Send order confirmation email using centralized email service
const sendOrderConfirmationEmail = async (userArg, order) => {
  try {
    // Fallbacks in case caller passed null/lean docs
    const user = userArg || order?.user || {};
    const toEmail = user?.email || process.env.FALLBACK_TEST_EMAIL; // Optional fallback

    if (!toEmail) {
      console.warn("⚠️ No recipient email found; skip sending.");
      return;
    }

    // Resolve totals robustly (supports both "pricing.total" and root "total")
    const totalNum = Number(
      (order && order.pricing && order.pricing.total != null
        ? order.pricing.total
        : order && order.total != null
          ? order.total
          : 0)
    );
    const fmt = (n) => `₹${Number(n || 0).toFixed(2)}`;

    // Resolve payment method (old/new field names)
    const paymentMethod =
      (order && order.paymentInfo && (order.paymentInfo.method || order.paymentInfo.method)) || "—";

    // Resolve tracking details regardless of field name
    const trackingNumber =
      (order && order.trackingInfo && (order.trackingInfo.trackingNumber || order.trackingInfo.awbCode)) || "";
    const estimatedDelivery =
      (order && order.trackingInfo && order.trackingInfo.estimatedDelivery) || null;

    // Format order items for email template
    const formattedItems = order?.items ? order.items.map(item => ({
      name: item.name || item.productName || "Product",
      quantity: item.quantity || 1,
      price: fmt(item.price || 0),
      totalPrice: fmt((item.price || 0) * (item.quantity || 1)),
      image: item.image || item.imageUrl,
      size: item.size,
      color: item.color,
    })) : [];

    // Prepare email data for customer
    const emailData = {
      customerName: user?.name || "Valued Customer",
      orderNumber: order?.orderNumber || "—",
      orderId: order?._id || order?.id,
      orderDate: new Date(order?.createdAt || new Date()).toLocaleDateString(),
      total: fmt(totalNum),
      paymentMethod,
      trackingNumber,
      estimatedDelivery: estimatedDelivery ? new Date(estimatedDelivery).toLocaleDateString() : null,
      items: formattedItems,
      shippingAddress: order?.shippingAddress || {},
    };

    // Send customer confirmation email using new template
    await sendEmail({
      to: toEmail,
      template: 'orderConfirmation',
      data: emailData
    });

    // Send admin notification email (using existing detailed template)
    const adminEmailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto; background: #ffffff;">
        <!-- Admin Header -->
        <div style="background: #dc2626; color: white; padding: 20px; text-align: center;">
          <h2 style="margin: 0; font-size: 24px;">🛎️ NEW ORDER RECEIVED - ADMIN NOTIFICATION</h2>
          <p style="margin: 5px 0 0 0; opacity: 0.9;">Order requires processing and fulfillment</p>
        </div>

        <div style="padding: 25px;">
          <!-- Quick Action Buttons -->
          <div style="background: #fef2f2; padding: 15px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #dc2626;">
            <h3 style="color: #dc2626; margin-top: 0;">Quick Actions</h3>
            <div style="display: flex; gap: 10px; flex-wrap: wrap;">
              <a href="${process.env.ADMIN_DASHBOARD_URL || '#'}/orders/${order?.id}" 
                 style="background: #dc2626; color: white; padding: 8px 16px; text-decoration: none; border-radius: 4px; font-size: 14px;">
                📋 View Order in Dashboard
              </a>
              <a href="${process.env.ADMIN_DASHBOARD_URL || '#'}/orders/${order?.id}/process" 
                 style="background: #059669; color: white; padding: 8px 16px; text-decoration: none; border-radius: 4px; font-size: 14px;">
                🚚 Process Order
              </a>
            </div>
          </div>

          <!-- Customer & Order Information -->
          <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h3 style="color: #1e293b; margin-top: 0;">👤 Customer & Order Information</h3>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
              <div>
                <p style="margin: 8px 0;"><strong>Customer:</strong> ${user?.name || "—"}</p>
                <p style="margin: 8px 0;"><strong>Email:</strong> ${user?.email || "—"}</p>
                <p style="margin: 8px 0;"><strong>Phone:</strong> ${user?.phone || order?.shippingAddress?.phoneNumber || "—"}</p>
              </div>
              <div>
                <p style="margin: 8px 0;"><strong>Order Number:</strong> ${order?.orderNumber || "—"}</p>
                <p style="margin: 8px 0;"><strong>Total Amount:</strong> <span style="color: #059669; font-weight: bold;">${fmt(totalNum)}</span></p>
                <p style="margin: 8px 0;"><strong>Payment Method:</strong> ${paymentMethod}</p>
              </div>
            </div>
          </div>

          <!-- Order Items -->
          ${formattedItems.length > 0 ? `
            <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h3 style="color: #1e293b; margin-top: 0;">🛍️ Order Items</h3>
              ${formattedItems.map(item => `
                <div style="padding: 10px 0; border-bottom: 1px solid #e5e7eb;">
                  <p style="margin: 5px 0;"><strong>${item.name}</strong></p>
                  <p style="margin: 5px 0; color: #6b7280;">Qty: ${item.quantity} × ${item.price} = ${item.totalPrice}</p>
                  ${item.size || item.color ? `<p style="margin: 5px 0; color: #9ca3af; font-size: 14px;">${item.size || ""} ${item.color || ""}</p>` : ""}
                </div>
              `).join("")}
            </div>
          ` : ""}

          <!-- Shipping Address -->
          <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h3 style="color: #1e293b; margin-top: 0;">🏠 Shipping Address</h3>
            <p style="margin: 5px 0;">${order?.shippingAddress?.fullName || ""}</p>
            <p style="margin: 5px 0;">${order?.shippingAddress?.addressLine1 || ""}</p>
            ${order?.shippingAddress?.addressLine2 ? `<p style="margin: 5px 0;">${order.shippingAddress.addressLine2}</p>` : ""}
            <p style="margin: 5px 0;">${order?.shippingAddress?.city || ""}, ${order?.shippingAddress?.state || ""} - ${order?.shippingAddress?.pinCode || ""}</p>
            ${order?.shippingAddress?.phoneNumber ? `<p style="margin: 5px 0;">📞 ${order.shippingAddress.phoneNumber}</p>` : ""}
          </div>

          <!-- Tracking Info -->
          ${trackingNumber ? `
            <div style="background: #f0f9ff; padding: 15px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #0369a1;">
              <h4 style="color: #0369a1; margin-top: 0;">🚚 Tracking Information</h4>
              <p style="margin: 0; color: #0369a1;"><strong>Tracking Number:</strong> ${trackingNumber}</p>
              ${estimatedDelivery ? `<p style="margin: 5px 0 0 0; color: #0369a1;"><strong>Estimated Delivery:</strong> ${new Date(estimatedDelivery).toLocaleDateString()}</p>` : ""}
            </div>
          ` : `
            <div style="background: #fef2f2; padding: 15px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #dc2626;">
              <p style="margin: 0; color: #dc2626;"><strong>⚠️ Tracking not yet assigned - Please process for shipping</strong></p>
            </div>
          `}

          <!-- Footer -->
          <div style="text-align: center; padding: 20px; background: #f1f5f9; border-radius: 8px; margin-top: 20px;">
            <p style="margin: 0; color: #64748b; font-size: 14px;">
              Order received: ${new Date().toLocaleString()}<br>
              Please process within 24 hours for timely delivery.
            </p>
          </div>
        </div>
      </div>
    `;

    // Send admin notification
    if (process.env.ADMIN) {
      await sendEmail({
        to: process.env.ADMIN,
        subject: `🛎️ NEW ORDER: ${order?.orderNumber || "Unknown"} - ${fmt(totalNum)}`,
        html: adminEmailHtml
      });
    }

    console.log("✅ Order confirmation emails sent successfully");

  } catch (error) {
    console.error("❌ Failed to send order confirmation email:", error);
  }
};

// Get user orders (unchanged)
const getUserOrders = async (req, res) => {
  try {
    const userId = req.user.userId;
    const page = Number.parseInt(req.query.page) || 1;
    const limit = Number.parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const orders = await Order.find({ user: userId })
      .populate("items.product", "name images price")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalOrders = await Order.countDocuments({ user: userId });
    const totalPages = Math.ceil(totalOrders / limit);

    res.status(200).json({
      success: true,
      orders: orders.map(shapeOrder),
      pagination: {
        currentPage: page,
        totalPages,
        totalOrders,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error("Get user orders error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch orders" });
  }
};

// Get order details (unchanged)
const getOrderDetails = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user?.userId;

    // Build query dynamically
    const query = { _id: orderId };
    if (userId) {
      query.user = userId;
    }

    const order = await Order.findOne(query).populate(
      "items.product",
      "name images price"
    );


    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    res.status(200).json({ success: true, order: shapeOrder(order) });
  } catch (error) {
    console.error("Get order details error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch order details" });
  }
};

const fetchAndSetTrackingInfo = async (req, res) => {
  try {

    const userId = req.user.userId;
    const { shiprocketShipmentId, _id } = req.body;


    if (!shiprocketShipmentId) {
      return res.status(400).json({ success: false, message: "Shipment ID is required" });
    }

    if (!shiprocketService || !process.env.SHIPROCKET_EMAIL || !process.env.SHIPROCKET_PASSWORD) {
      return res.status(500).json({ success: false, message: "Shiprocket not configured" });
    }

    // Fetch tracking info from Shiprocket
    const shiprocketTrackingResponse = await shiprocketService.trackShiprocketShipment(shiprocketShipmentId);

    const trackUrl = shiprocketTrackingResponse?.tracking_data?.track_url || null;

    const update_order = await Order.findOne({ _id: _id, user: userId });
    if (!update_order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    if (!trackUrl) {
      update_order.trackingInfo = {
        // ...update_order.trackingInfo,
        // ...shiprocketTrackingResponse.tracking_data,
        trackingUrl: trackUrl,
        message: "No tracking info yet"
      };

      await update_order.save();
      return res.status(200).json({ success: false, message: "No tracking info yet" });
    }
    // Update the order document
    update_order.trackingUrl = trackUrl;
    update_order.trackingInfo = {
      // ...update_order.trackingInfo,
      // ...shiprocketTrackingResponse.tracking_data,
      trackingUrl: trackUrl

    };
    await update_order.save();
    res.status(200).json({ success: true, order: shapeOrder(update_order), trackingUrl: trackUrl });

  } catch (error) {
    console.error("❌ Shiprocket tracking failed:", error.message);
    res.status(500).json({ success: false, message: "Failed to fetch tracking info" });
  }
};
module.exports = {
  createRazorpayOrder,
  placeCodOrder,
  verifyPaymentAndCreateOrder,
  getUserOrders,
  getOrderDetails,
  cancelOrder,
  trackOrder,
  getShippingRates,
  fetchAndSetTrackingInfo,
};