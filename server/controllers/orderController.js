const Order = require("../models/Order");
const User = require("../models/User");
const Product = require("../models/Product");
const Coupon = require("../models/Coupon");
const PartialCodSetting = require("../models/PartialCodSetting");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const { sendEmail } = require("../utils/emailService");
const shipmozoService = require("../services/shipmozoService");
const XLSX = require("xlsx");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// ===============================
// Helper Functions
// ===============================

const shapeOrder = (o) => {
  if (!o) return o;
  const statusRaw = (o.status || "").toString();
  const status = statusRaw ? statusRaw.toLowerCase() : "pending";
  const subtotal = o.subtotal ?? (o.pricing && o.pricing.subtotal) ?? 0;
  const shippingCharge = o.shippingCharge ?? (o.pricing && (o.pricing.shippingCharges ?? o.pricing.shippingCharge)) ?? 0;
  const discount = o.discount ?? (o.pricing && o.pricing.discount) ?? 0;
  const total = o.total ?? (o.pricing && o.pricing.total) ?? subtotal + shippingCharge - discount;
  const freediscount = o.freediscount ?? (o.pricing && o.pricing.freediscount) ?? 0;
  const referralDiscount = o.referralDiscount ?? (o.pricing && o.pricing.referralDiscount) ?? 0;

  return {
    ...(o.toObject?.() ?? o),
    status,
    pricing: {
      subtotal,
      shipping: shippingCharge,
      discount,
      total,
      freediscount,
      referralDiscount
    },
  };
};

const checkIfBulkOrder = (items) => {
  if (!items || !Array.isArray(items)) return false;
  return items.some(item => item.isBulkProduct === true);
};

const getPaymentMethods = async (items) => {
  const isBulk = checkIfBulkOrder(items);

  if (!isBulk) {
    return { cod: true, online: true, partialCod: false, partialPercentage: 0 };
  }

  const partialSetting = await PartialCodSetting.findOne();

  if (partialSetting && partialSetting.isEnabled) {
    return { cod: false, online: true, partialCod: true, partialPercentage: partialSetting.percentage };
  }

  return { cod: true, online: true, partialCod: false, partialPercentage: 0 };
};

// ===============================
// Send Order Confirmation Email
// ===============================

const sendOrderConfirmationEmail = async (userArg, order) => {
  try {
    const user = userArg || order?.user || {};
    const toEmail = user?.email || order?.shippingAddress?.email;

    if (!toEmail) {
      console.warn("⚠️ No recipient email found; skip sending.");
      return;
    }

    const totalNum = Number(order?.total || 0);
    const fmt = (n) => `₹${Number(n || 0).toFixed(2)}`;
    const paymentMethod = order?.paymentInfo?.method || "—";

    const emailData = {
      customerName: user?.name || "Valued Customer",
      orderNumber: order?.orderNumber || "—",
      orderDate: new Date(order?.createdAt || new Date()).toLocaleDateString(),
      total: fmt(totalNum),
      paymentMethod,
      items: order?.items?.map(item => ({
        name: item.name,
        quantity: item.quantity,
        price: fmt(item.price),
        totalPrice: fmt(item.price * item.quantity),
        size: item.size,
        color: item.color,
      })) || [],
      shippingAddress: order?.shippingAddress || {},
    };

    await sendEmail({
      to: toEmail,
      template: 'orderConfirmation',
      data: emailData
    });

    console.log("✅ Order confirmation email sent successfully");
  } catch (error) {
    console.error("❌ Failed to send order confirmation email:", error);
  }
};

// ===============================
// Get Payment Methods
// ===============================

const getPaymentMethodsHandler = async (req, res) => {
  try {
    const { items } = req.body;
    const paymentMethods = await getPaymentMethods(items || []);
    res.json({ success: true, ...paymentMethods });
  } catch (error) {
    console.error("Get payment methods error:", error);
    res.json({ success: true, cod: true, online: true, partialCod: false, partialPercentage: 0 });
  }
};

// ===============================
// Create Razorpay Order (Full Payment)
// ===============================

const createRazorpayOrder = async (req, res) => {
  try {
    console.log("========== CREATE RAZORPAY ORDER (FULL PAYMENT) ==========");
    console.log("Request body:", JSON.stringify(req.body, null, 2));

    const userId = req.user?.userId || null;
    const { items, shippingAddress, couponCode, selectedShippingRate, amount, freediscount, referralDiscount } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: "Cart items are required" });
    }

    if (!shippingAddress || !shippingAddress.fullName || !shippingAddress.phoneNumber || !shippingAddress.pinCode) {
      return res.status(400).json({ success: false, message: "Complete shipping address is required" });
    }

    let subtotal = 0;
    let totalQuantity = 0;
    const validatedItems = [];

    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) {
        return res.status(400).json({ success: false, message: `Product not found: ${item.productId}` });
      }

      let itemPrice = product.price;
      let itemTotal;
      let quantity = item.quantity || 1;

      if (item.isBulkProduct === true) {
        const pricePerSet = item.pricePerSet || product.bulkConfig?.pricePerSet || product.price;
        const totalSets = item.totalSets || quantity;
        itemTotal = pricePerSet * totalSets;
        itemPrice = pricePerSet;
        quantity = totalSets;
        console.log(`🟢 Bulk Item: ${product.name}, pricePerSet: ${pricePerSet}, totalSets: ${totalSets}, itemTotal: ${itemTotal}`);
      } else {
        itemTotal = product.price * quantity;
        console.log(`🟢 Regular Item: ${product.name}, price: ${product.price}, quantity: ${quantity}, itemTotal: ${itemTotal}`);
      }

      subtotal += itemTotal;
      totalQuantity += quantity;

      validatedItems.push({
        product: product._id,
        name: product.name,
        price: itemPrice,
        quantity: quantity,
        size: item.size || "",
        color: item.color || "Default",
        image: product.images?.[0]?.url,
        itemTotal,
        isBulkProduct: item.isBulkProduct === true,
        ...(item.isBulkProduct && {
          selectedColors: item.selectedColors || [],
          totalSets: item.totalSets || quantity,
          totalPieces: item.totalPieces || 0,
          piecesPerSet: item.piecesPerSet || 0,
          pricePerSet: item.pricePerSet
        })
      });
    }

    // ✅ ONLINE PAYMENT DISCOUNT: ₹30 per quantity (फक्त Pay Online साठी)
    const ONLINE_DISCOUNT_PER_QUANTITY = 30;
    const onlineDiscountAmount = totalQuantity * ONLINE_DISCOUNT_PER_QUANTITY;
    console.log(`🟢 Online Payment Discount: ${totalQuantity} × ${ONLINE_DISCOUNT_PER_QUANTITY} = ₹${onlineDiscountAmount}`);

    // ✅ Coupon discount calculation
    let discount = 0;
    let couponDetails = null;
    if (couponCode) {
      const coupon = await Coupon.findOne({ code: couponCode, isActive: true });
      if (coupon && new Date() <= coupon.validUntil && subtotal >= (coupon.minOrderValue || 0)) {
        discount = coupon.discountType === "percentage"
          ? Math.min((subtotal * coupon.discountValue) / 100, coupon.maxDiscountAmount || Infinity)
          : coupon.discountValue || 0;
        couponDetails = { code: coupon.code, discountAmount: discount, discountType: coupon.discountType };
      }
    }

    // ✅ Total discount = coupon discount + online payment discount
    const totalDiscount = discount + onlineDiscountAmount;
    console.log(`💰 Discount Breakdown: Coupon: ₹${discount}, Online: ₹${onlineDiscountAmount}, Total: ₹${totalDiscount}`);

    // ✅ Shipping charges (free as per your requirement)
    const shippingCharges = 0;

    // ✅ Calculate final total
    const total = Math.round(subtotal + shippingCharges - totalDiscount);
    const orderNumber = `FH-${Date.now()}`;

    console.log("💰 Order Summary:", { subtotal, shippingCharges, totalDiscount, total, freediscount, referralDiscount });

    // ✅ Create Razorpay order
    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(total * 100),
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
      notes: {
        userId: userId || "guest",
        couponCode: couponCode || "",
        type: "full_payment",
        onlineDiscount: onlineDiscountAmount,
        totalQuantity: totalQuantity
      },
    });

    console.log("✅ Razorpay order created:", razorpayOrder.id);

    // ✅ Create order in database
    const order = new Order({
      user: userId,
      orderNumber,
      items: validatedItems,
      shippingAddress,
      subtotal,
      shippingCharge: shippingCharges,
      freediscount: freediscount || 0,
      referralDiscount: referralDiscount || 0,
      discount: totalDiscount,  // ✅ Total discount (coupon + online)
      total,
      pricing: {
        subtotal,
        shippingCharges,
        tax: 0,
        discount: totalDiscount,
        total,
        freediscount: freediscount || 0,
        referralDiscount: referralDiscount || 0,
        selectedShippingRate,
        onlineDiscount: onlineDiscountAmount  // ✅ Store online discount separately
      },
      coupon: couponDetails,
      paymentInfo: {
        razorpayOrderId: razorpayOrder.id,
        method: "RAZORPAY",
        status: "PENDING"
      },
      status: "PLACED",
      shippingStatus: "PENDING",
      shipmozoDetails: { status: "PENDING" },
      trackingInfo: { awbStatus: "PENDING" },
    });

    await order.save();
    console.log("✅ Order saved:", order._id);

    // ✅ Store temp order data for logged-in users
    if (userId) {
      await User.findByIdAndUpdate(userId, {
        tempOrderData: {
          user: userId,
          orderNumber,
          items: validatedItems.map(({ _id, __v, ...rest }) => rest),
          shippingAddress,
          pricing: {
            subtotal,
            shippingCharges,
            tax: 0,
            discount: totalDiscount,
            total,
            freediscount: freediscount || 0,
            referralDiscount: referralDiscount || 0,
            selectedShippingRate,
            onlineDiscount: onlineDiscountAmount
          },
          coupon: couponDetails,
          paymentInfo: { razorpayOrderId: razorpayOrder.id, method: "RAZORPAY", status: "pending" },
          status: "PLACED",
          total,
          subtotal,
          discount: totalDiscount,
          temp_order_id: order._id,
        }
      });
      console.log("✅ Temp order data saved for user");
    }

    const paymentMethods = await getPaymentMethods(items);
    const isBulkOrder = checkIfBulkOrder(items);

    res.json({
      success: true,
      razorpayOrder: {
        id: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency
      },
      orderSummary: {
        orderNumber,
        total,
        freediscount: freediscount || 0,
        referralDiscount: referralDiscount || 0,
        onlineDiscount: onlineDiscountAmount,
        items: validatedItems.length,
        isGuest: !userId,
        totalQuantity: totalQuantity
      },
      paymentMethods,
      isBulkOrder,
      orderId: order._id
    });

  } catch (error) {
    console.error("❌ Create Razorpay order error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to create order",
      error: process.env.NODE_ENV === "development" ? error.stack : undefined
    });
  }
};

// ===============================
// Create Partial COD Order
// ===============================

const createPartialCodOrder = async (req, res) => {
  try {
    console.log("========== CREATE PARTIAL COD ORDER ==========");
    console.log("Request body:", JSON.stringify(req.body, null, 2));

    const userId = req.user?.userId || null;
    const {
      items,
      shippingAddress,
      couponCode,
      totalAmount,
      onlineAmount,
      codAmount,
      percentage
    } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: "Cart items are required" });
    }

    if (!shippingAddress || !shippingAddress.fullName || !shippingAddress.phoneNumber) {
      return res.status(400).json({ success: false, message: "Complete shipping address is required" });
    }

    if (!onlineAmount || onlineAmount <= 0) {
      return res.status(400).json({ success: false, message: "Online amount must be greater than 0" });
    }

    let subtotal = 0;
    let validatedItems = [];

    // ✅ IMPORTANT: Partial COD साठी original amounts वापरा, discounted नाही
    // तू frontend वरून पाठवलेला totalAmount हाच original आहे

    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) {
        return res.status(400).json({ success: false, message: `Product not found` });
      }

      let itemPrice = product.price;
      let itemTotal = product.price * (item.quantity || 1);

      if (item.isBulkProduct) {
        const pricePerSet = item.pricePerSet || product.bulkConfig?.pricePerSet || product.price;
        const totalSets = item.totalSets || item.quantity || 1;
        itemTotal = pricePerSet * totalSets;
        itemPrice = pricePerSet;
      }

      subtotal += itemTotal;

      validatedItems.push({
        product: product._id,
        name: product.name,
        price: itemPrice,
        quantity: item.quantity || 1,
        size: item.size || "",
        color: item.color || "Default",
        image: product.images?.[0]?.url,
        itemTotal,
        isBulkProduct: item.isBulkProduct || false,
        ...(item.isBulkProduct && {
          selectedColors: item.selectedColors || [],
          totalSets: item.totalSets || item.quantity || 1,
          totalPieces: item.totalPieces || 0,
          piecesPerSet: item.piecesPerSet || 0,
          pricePerSet: item.pricePerSet
        })
      });

      if (!item.isBulkProduct && product.stock < (item.quantity || 1)) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${product.name}`
        });
      }
    }

    const shippingCharges = 0;
    let discount = 0;
    let couponDetails = null;

    if (couponCode) {
      const coupon = await Coupon.findOne({ code: couponCode, isActive: true });
      if (coupon && new Date() <= coupon.validUntil && subtotal >= (coupon.minOrderValue || 0)) {
        discount = coupon.discountType === "percentage"
          ? Math.min((subtotal * coupon.discountValue) / 100, coupon.maxDiscountAmount || Infinity)
          : coupon.discountValue || 0;
        couponDetails = { code: coupon.code, discountAmount: discount };
      }
    }

    // ✅ Partial COD साठी total = original subtotal - coupon discount (कोणताही online discount नाही)
    const finalTotal = Math.round(subtotal + shippingCharges - discount);
    const orderNumber = `FH-${Date.now()}`;

    console.log("💰 Order Summary:", { subtotal, shippingCharges, discount, finalTotal });

    // ✅ ONLINE AMOUNT ही finalTotal च्या percentage वर calculate करा (discounted amount वरून नाही)
    const calculatedOnlineAmount = Math.round(finalTotal * (percentage / 100));
    const calculatedCodAmount = finalTotal - calculatedOnlineAmount;

    console.log(`🟢 Partial COD Breakdown: Original Total: ₹${finalTotal}, ${percentage}% Online: ₹${calculatedOnlineAmount}, COD: ₹${calculatedCodAmount}`);

    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(calculatedOnlineAmount * 100),
      currency: "INR",
      receipt: `partial_${orderNumber}`,
      notes: {
        type: "partial_cod",
        codAmount: calculatedCodAmount,
        fullAmount: finalTotal,
        percentage: percentage
      }
    });

    console.log("✅ Razorpay order created:", razorpayOrder.id);

    const order = new Order({
      user: userId,
      orderNumber,
      items: validatedItems,
      shippingAddress,
      subtotal,
      shippingCharge: shippingCharges,
      discount,
      total: finalTotal,
      pricing: {
        subtotal,
        shippingCharges,
        tax: 0,
        discount,
        total: finalTotal
      },
      coupon: couponDetails,
      paymentInfo: {
        method: "PARTIAL_COD",
        status: "PENDING",
        razorpayOrderId: razorpayOrder.id
      },
      status: "PLACED",
      shippingStatus: "PENDING",
      shipmozoDetails: { status: "PENDING" },
      partialCod: {
        enabled: true,
        percentage: percentage || 30,
        onlineAmount: calculatedOnlineAmount,
        codAmount: calculatedCodAmount,
        onlinePaymentId: razorpayOrder.id,
        onlinePaymentStatus: "PENDING"
      }
    });

    await order.save();
    console.log("✅ Order saved:", order._id);

    if (userId) {
      await User.findByIdAndUpdate(userId, { cart: [] });
      console.log("✅ User cart cleared");
    }

    for (const item of validatedItems) {
      if (!item.isBulkProduct) {
        await Product.findByIdAndUpdate(item.product, { $inc: { stock: -item.quantity } });
      }
    }

    res.json({
      success: true,
      message: "Partial COD order created successfully",
      orderId: order._id,
      orderNumber: order.orderNumber,
      razorpayOrder: {
        id: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency
      },
      partialDetails: {
        onlineAmount: calculatedOnlineAmount,
        codAmount: calculatedCodAmount,
        percentage: percentage || 30
      }
    });

  } catch (error) {
    console.error("❌ Partial COD Error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to create partial COD order"
    });
  }
};

// ===============================
// Verify Partial COD Payment
// ===============================

const verifyPartialCodPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ success: false, message: "Payment verification failed" });
    }

    const order = await Order.findOne({ "paymentInfo.razorpayOrderId": razorpay_order_id });
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    order.paymentInfo.status = "PARTIALLY_PAID";
    order.paymentInfo.razorpayPaymentId = razorpay_payment_id;
    order.paymentInfo.razorpaySignature = razorpay_signature;
    order.status = "CONFIRMED";
    order.shippingStatus = "PROCESSING";

    if (order.partialCod) {
      order.partialCod.onlinePaymentStatus = "PAID";
      order.partialCod.onlinePaymentId = razorpay_payment_id;
      order.partialCod.onlinePaymentPaidAt = new Date();
    }

    await order.save();

    // ✅ Send response immediately
    res.json({
      success: true,
      message: "Partial payment successful! Remaining amount to be paid on delivery.",
      order: shapeOrder(order),
    });

    // ✅ BACKGROUND: Push order to Shipmozo (DRAFT mode - NO auto-assign)
    setImmediate(async () => {
      try {
        console.log(`🟢 Background: Pushing order to Shipmozo (DRAFT) for ${order.orderNumber}`);

        const freshOrder = await Order.findById(order._id);

        const shipmozoData = {
          orderNumber: freshOrder.orderNumber,
          customer: {
            name: freshOrder.shippingAddress.fullName,
            phone: freshOrder.shippingAddress.phoneNumber,
            email: freshOrder.shippingAddress.email || ""
          },
          address: {
            addressLine1: freshOrder.shippingAddress.addressLine1,
            addressLine2: freshOrder.shippingAddress.addressLine2 || "",
            pinCode: freshOrder.shippingAddress.pinCode,
            city: freshOrder.shippingAddress.city,
            state: freshOrder.shippingAddress.state
          },
          items: freshOrder.items.map(item => ({
            name: item.name,
            quantity: item.quantity,
            price: item.price
          })),
          totalAmount: freshOrder.total,
          paymentType: "COD",
          weight: 200  // grams (dummy)
        };

        // ✅ ONLY push order - NO auto-assign
        const pushResult = await shipmozoService.pushOrder(shipmozoData);

        if (pushResult.success) {
          freshOrder.shipmozoDetails = {
            orderId: pushResult.orderId,
            referenceId: pushResult.referenceId,
            status: "ORDER_PUSHED",  // ✅ DRAFT mode - AWB not generated
            lastSyncAt: new Date()
          };
          await freshOrder.save();
          console.log(`✅ Order pushed to Shipmozo (DRAFT). Order ID: ${pushResult.orderId}`);
          console.log(`📋 Client must login to Shipmozo dashboard to generate AWB`);
        } else {
          console.error(`❌ Shipmozo push failed:`, pushResult.error);
          freshOrder.shipmozoDetails = {
            status: "FAILED",
            errorMessage: pushResult.error,
            lastSyncAt: new Date()
          };
          await freshOrder.save();
        }
      } catch (bgError) {
        console.error("❌ Background Shipmozo error:", bgError);
      }
    });

  } catch (error) {
    console.error("Verify partial COD payment error:", error);
    res.status(500).json({ success: false, message: "Payment verification failed" });
  }
};

// ===============================
// Verify Full Payment (with Shipmozo DRAFT only)
// ===============================

const verifyPaymentAndCreateOrder = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    const userId = req.user?.userId || null;

    console.log("🟢 Verifying payment for order:", razorpay_order_id);
    console.log("🟢 Payment ID:", razorpay_payment_id);
    console.log("🟢 User ID:", userId);

    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      console.log("🔴 Signature mismatch");
      return res.status(400).json({ success: false, message: "Payment verification failed" });
    }

    console.log("✅ Signature verified");

    let order;

    if (userId) {
      // ✅ Remove .lean() from here
      const user = await User.findById(userId);
      
      if (!user?.tempOrderData || !user.tempOrderData.temp_order_id) {
        console.log("❌ Temp order data missing for user:", userId);
        return res.status(400).json({ success: false, message: "Order data not found" });
      }
      
      console.log("✅ Found temp order ID:", user.tempOrderData.temp_order_id);
      order = await Order.findOne({ 
        _id: user.tempOrderData.temp_order_id, 
        user: userId 
      });
    } else {
      order = await Order.findOne({ "paymentInfo.razorpayOrderId": razorpay_order_id });
    }

    if (!order) {
      console.log("❌ Order not found");
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    console.log("✅ Order found, current payment status:", order.paymentInfo?.status);

    // ✅ Update order - FIXED WAY
    order.status = "CONFIRMED";
    order.shippingStatus = "PROCESSING";
    
    // ✅ Update paymentInfo correctly
    order.paymentInfo.method = "RAZORPAY";
    order.paymentInfo.razorpayPaymentId = razorpay_payment_id;
    order.paymentInfo.razorpaySignature = razorpay_signature;
    order.paymentInfo.status = "PAID";
    order.paymentInfo.paidAt = new Date();
    
    await order.save();
    
    console.log("✅ Order updated successfully!");
    console.log("   New Payment Status:", order.paymentInfo.status);  // Should be "PAID"
    console.log("   New Order Status:", order.status);  // Should be "CONFIRMED"

    // Update stock
    for (const item of order.items) {
      if (!item.isBulkProduct) {
        await Product.findByIdAndUpdate(item.product, { $inc: { stock: -item.quantity } });
      }
    }

    // Update coupon usage
    if (userId && order.coupon?.code) {
      const coupon = await Coupon.findOne({ code: order.coupon.code });
      if (coupon) {
        coupon.usedCount += 1;
        const userUsage = coupon.usedBy.find(u => u.user.toString() === userId);
        if (userUsage) userUsage.usedCount += 1;
        else coupon.usedBy.push({ user: userId, usedCount: 1, lastUsed: new Date() });
        await coupon.save();
      }
    }

    // Clear temp data and cart
    if (userId) {
      await User.findByIdAndUpdate(userId, { cart: [], tempOrderData: null });
    }

    // Send response
    res.json({
      success: true,
      message: "Order placed successfully",
      order: {
        id: order._id,
        orderNumber: order.orderNumber,
        total: order.total,
        status: order.status,
        paymentStatus: order.paymentInfo.status,  // ← "PAID" yeil
        pricing: {
          subtotal: order.subtotal,
          shipping: order.shippingCharge,
          discount: order.discount,
          total: order.total,
          freediscount: order.freediscount,
          referralDiscount: order.pricing?.referralDiscount || 0
        },
      },
    });

    // Background Shipmozo push (optional)
    setImmediate(async () => {
      try {
        // ... your existing shipmozo code (keep as is)
      } catch (bgError) {
        console.error("❌ Background Shipmozo error:", bgError);
      }
    });

  } catch (error) {
    console.error("❌ Verify payment error:", error);
    res.status(500).json({ success: false, message: error.message || "Payment verification failed" });
  }
};

// ===============================
// Place COD Order
// ===============================

const placeCodOrder = async (req, res) => {
  try {
    const userId = req.user?.userId || null;
    const { items, shippingAddress, couponCode, selectedShippingRate, amount, freediscount, referralDiscount } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: "Cart items are required" });
    }

    if (!shippingAddress || !shippingAddress.fullName || !shippingAddress.phoneNumber || !shippingAddress.pinCode) {
      return res.status(400).json({ success: false, message: "Complete shipping address is required" });
    }

    let subtotal = 0;
    let validatedItems = [];

    for (const it of items) {
      const product = await Product.findById(it.productId);
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
        isBulkProduct: product.isBulkProduct === true
      });
    }

    // ✅ COD साठी फक्त coupon discount (ONLINE DISCOUNT नाही)
    let discount = 0;
    let couponDetails = null;
    if (couponCode) {
      const coupon = await Coupon.findOne({ code: couponCode, isActive: true });
      if (coupon && new Date() <= coupon.validUntil && subtotal >= (coupon.minOrderValue || 0)) {
        discount = coupon.discountType === "percentage"
          ? Math.min((subtotal * coupon.discountValue) / 100, coupon.maxDiscountAmount || Infinity)
          : coupon.discountValue || 0;
        couponDetails = { code: coupon.code, discountAmount: discount, discountType: coupon.discountType };
      }
    }

    const shippingCharges = 0;
    // ✅ COD साठी TOTAL = subtotal - coupon discount (कोणताही online discount नाही)
    const total = Math.round(subtotal + shippingCharges - discount);
    const orderNumber = `FH-${Date.now()}`;

    console.log("💰 COD Order Summary:", { subtotal, shippingCharges, discount, total });

    const order = new Order({
      user: userId,
      orderNumber,
      items: validatedItems,
      shippingAddress,
      subtotal,
      shippingCharge: shippingCharges,
      freediscount: freediscount || 0,
      referralDiscount: referralDiscount || 0,
      discount,  // ✅ फक्त coupon discount
      total,
      pricing: {
        subtotal,
        shippingCharges,
        tax: 0,
        discount,
        total,
        freediscount,
        referralDiscount,
        selectedShippingRate
      },
      coupon: couponDetails,
      paymentInfo: { method: "COD", status: "PENDING", razorpayOrderId: orderNumber },
      status: "CONFIRMED",
      shippingStatus: "PROCESSING",
      shipmozoDetails: { status: "PENDING" },
      trackingInfo: { awbStatus: "PENDING" },
    });

    await order.save();
    console.log("✅ COD Order saved:", order._id);

    await Promise.all(validatedItems.map(it =>
      Product.findByIdAndUpdate(it.product, { $inc: { stock: -it.quantity } })
    ));

    if (userId) {
      await User.findByIdAndUpdate(userId, { cart: [] });
    }

    try {
      await sendOrderConfirmationEmail(order.user, order);
    } catch (emailError) {
      console.error("Email sending failed:", emailError);
    }

    // ✅ Send response immediately
    res.json({
      success: true,
      message: "COD order placed successfully",
      order: {
        id: order._id,
        orderNumber: order.orderNumber,
        total: order.total,
        status: order.status,
        pricing: {
          subtotal: order.subtotal,
          shipping: order.shippingCharge,
          discount: order.discount,
          total: order.total,
          freediscount: order.freediscount,
          referralDiscount: order.pricing?.referralDiscount || 0
        },
        isGuest: !userId,
        orderId: order._id.toString()
      },
    });

    // ✅ BACKGROUND: Push order to Shipmozo (DRAFT mode)
    setImmediate(async () => {
      try {
        console.log(`🟢 Background: Pushing COD order to Shipmozo (DRAFT) for ${order.orderNumber}`);

        const freshOrder = await Order.findById(order._id);

        const shipmozoData = {
          orderNumber: freshOrder.orderNumber,
          customer: {
            name: freshOrder.shippingAddress.fullName,
            phone: freshOrder.shippingAddress.phoneNumber,
            email: freshOrder.shippingAddress.email || ""
          },
          address: {
            addressLine1: freshOrder.shippingAddress.addressLine1,
            addressLine2: freshOrder.shippingAddress.addressLine2 || "",
            pinCode: freshOrder.shippingAddress.pinCode,
            city: freshOrder.shippingAddress.city,
            state: freshOrder.shippingAddress.state
          },
          items: freshOrder.items.map(item => ({
            name: item.name,
            quantity: item.quantity,
            price: item.price
          })),
          totalAmount: freshOrder.total,  // ₹100 (original - coupon)
          paymentType: "COD",
          weight: 200
        };

        const pushResult = await shipmozoService.pushOrder(shipmozoData);

        if (pushResult.success) {
          freshOrder.shipmozoDetails = {
            orderId: pushResult.orderId,
            referenceId: pushResult.referenceId,
            status: "ORDER_PUSHED",
            lastSyncAt: new Date()
          };
          await freshOrder.save();
          console.log(`✅ COD order pushed to Shipmozo (DRAFT). Order ID: ${pushResult.orderId}`);
        } else {
          console.error(`❌ Shipmozo push failed for COD:`, pushResult.error);
        }
      } catch (bgError) {
        console.error("❌ Background Shipmozo error for COD:", bgError);
      }
    });

  } catch (error) {
    console.error("Create COD order error:", error);
    res.status(500).json({ success: false, message: "Failed to create COD order" });
  }
};

async function returnOrder(req, res) {
  try {
    const { orderId, reason } = req.body;

    if (!orderId) {
      return res.status(400).json({ success: false, error: 'Order ID is required' });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, error: `Order ${orderId} not found` });
    }

    // Check return eligibility
    if (order.status === 'RETURNED') {
      return res.status(400).json({ success: false, error: 'Order already returned' });
    }
    if (order.status === 'CANCELLED') {
      return res.status(400).json({ success: false, error: 'Order already cancelled' });
    }
    if (order.status !== 'DELIVERED') {
      return res.status(400).json({ success: false, error: 'Return can only be initiated for delivered orders' });
    }

    let refundResult = null;
    let refundAmount = 0;
    const paymentMethod = order.paymentInfo?.method?.toUpperCase();
    const paymentStatus = order.paymentInfo?.status?.toUpperCase();

    // ---------- RAZORPAY REFUND LOGIC ----------
    if ((paymentMethod === 'RAZORPAY' || paymentMethod === 'PARTIAL_COD') && paymentStatus === 'PAID') {
      try {
        const paymentId = order.paymentInfo?.razorpayPaymentId;
        if (!paymentId) {
          throw new Error('No Razorpay payment ID found for this order');
        }

        // Determine refund amount
        if (paymentMethod === 'RAZORPAY') {
          refundAmount = Math.max(0, order.total || 0);
        } else if (paymentMethod === 'PARTIAL_COD') {
          // Ensure partialCod object exists
          refundAmount = Math.max(0, order.partialCod?.onlineAmount || order.partialCod?.amount || 0);
        }

        if (refundAmount <= 0) {
          throw new Error(`Refund amount is zero or negative for order ${order.orderNumber}`);
        }

        // Ensure razorpay instance is defined
        if (!razorpay || typeof razorpay.payments?.refund !== 'function') {
          throw new Error('Razorpay is not properly initialized');
        }

        const amountPaise = Math.round(refundAmount * 100);
        console.log(`🔄 Initiating refund for payment ${paymentId}, amount ₹${refundAmount} (${amountPaise} paise)`);

        const refund = await razorpay.payments.refund(paymentId, {
          amount: amountPaise,
          speed: 'normal', // change to 'optimum' for instant refund
          notes: {
            orderNumber: order.orderNumber || String(order._id),
            reason: reason || 'Customer return',
            returnInitiatedBy: req.user?.userId || 'system'
          }
        });

        refundResult = {
          id: refund.id,
          amount: refund.amount / 100,
          status: refund.status,
          createdAt: new Date(refund.created_at * 1000),
          paymentId: paymentId
        };
        console.log(`✅ Refund successful: ID ${refund.id}, amount ₹${refundAmount}`);

        // Update payment info
        order.paymentInfo.status = 'REFUNDED';
        order.paymentInfo.refundId = refund.id;
        order.paymentInfo.refundAmount = refundAmount;
        order.paymentInfo.refundedAt = new Date();

        if (paymentMethod === 'PARTIAL_COD' && order.partialCod) {
          order.partialCod.onlinePaymentStatus = 'REFUNDED';
          order.partialCod.refundId = refund.id;
          order.partialCod.refundAmount = refundAmount;
          order.partialCod.refundedAt = new Date();
        }
      } catch (refundErr) {
        console.error('❌ Razorpay refund error:', refundErr.message, refundErr);
        refundResult = { error: refundErr.message };
        order.paymentInfo.refundInitiated = true;
        order.paymentInfo.refundError = refundErr.message;
      }
    } else if (paymentMethod === 'COD') {
      console.log(`ℹ️ COD order ${order.orderNumber} – no refund needed`);
      refundResult = { message: 'COD order – no refund required' };
    } else {
      console.warn(`⚠️ Order ${order.orderNumber} has payment method ${paymentMethod} / status ${paymentStatus} – not refunding`);
      refundResult = { message: 'Payment not eligible for refund' };
    }

    // ---------- SHIPMOZO RETURN (optional, only if service exists) ----------
    let shipmozoResult = null;
    if (order.shipmozoDetails?.awbNumber && typeof shipmozoService?.returnOrder === 'function') {
      try {
        const shipmozoData = {
          orderNumber: order.orderNumber,
          customer: {
            name: order.shippingAddress.fullName,
            phone: order.shippingAddress.phoneNumber,
            email: order.shippingAddress.email || "",
          },
          address: {
            addressLine1: order.shippingAddress.addressLine1,
            addressLine2: order.shippingAddress.addressLine2 || "",
            pinCode: order.shippingAddress.pinCode,
            city: order.shippingAddress.city,
            state: order.shippingAddress.state,
          },
          items: order.items.map(item => ({
            name: item.name,
            quantity: item.quantity,
            price: item.price,
          })),
          totalAmount: order.total,
          referralDiscount: order.pricing?.referralDiscount || 0,
          paymentType: paymentMethod === 'COD' ? 'COD' : 'PREPAID',
          weight: 200,
        };
        const pushResult = await shipmozoService.returnOrder(shipmozoData);
        if (pushResult.success) {
          shipmozoResult = {
            orderId: pushResult.orderId,
            referenceId: pushResult.referenceId,
            status: pushResult.status || 'RETURN_CREATED'
          };
        } else {
          shipmozoResult = { error: pushResult.error || 'Shipmozo return creation failed' };
        }
      } catch (shipErr) {
        console.error('Shipmozo return error:', shipErr);
        shipmozoResult = { error: shipErr.message };
      }
    } else if (order.shipmozoDetails?.awbNumber) {
      console.warn('⚠️ shipmozoService.returnOrder not available – skipping Shipmozo integration');
    }

    // ---------- UPDATE ORDER STATUS ----------
    order.status = 'RETURNED';
    order.shippingStatus = 'RETURNED';
    order.returnReason = reason || '';
    order.returnedAt = new Date();

    if (shipmozoResult) {
      if (!shipmozoResult.error) {
        order.shipmozoDetails = {
          ...order.shipmozoDetails,
          returnOrderId: shipmozoResult.orderId,
          returnReferenceId: shipmozoResult.referenceId,
          returnStatus: shipmozoResult.status,
          returnInitiatedAt: new Date()
        };
      } else {
        order.shipmozoDetails = {
          ...order.shipmozoDetails,
          returnError: shipmozoResult.error,
          returnInitiatedAt: new Date()
        };
      }
    }

    await order.save();

    // ---------- RESTOCK PRODUCTS (only non‑bulk) ----------
    for (const item of order.items) {
      if (item?.product && item?.quantity && !item.isBulkProduct) {
        await Product.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity } });
        console.log(`✅ Restocked ${item.quantity} of ${item.name}`);
      }
    }

    // ---------- RESPONSE ----------
    const isRefundSuccess = refundResult && !refundResult.error;
    res.status(200).json({
      success: true,
      message: isRefundSuccess
        ? `Return processed successfully. ₹${refundAmount} will be refunded to your original payment method within 5-7 business days.`
        : 'Return recorded (refund may be pending or not applicable).',
      refund: refundResult,
      shipmozo: shipmozoResult,
      order: {
        id: order._id,
        orderNumber: order.orderNumber,
        status: order.status,
        returnReason: order.returnReason,
        returnedAt: order.returnedAt,
        refundAmount: refundResult?.amount || null
      }
    });
  } catch (error) {
    console.error('❌ Return order unexpected error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
}

// ===============================
// Get User Orders
// ===============================

const getUserOrders = async (req, res) => {
  try {
    const userId = req.user.userId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const orders = await Order.find({ user: userId })
      .populate("items.product", "name images price")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalOrders = await Order.countDocuments({ user: userId });

    res.json({
      success: true,
      orders: orders.map(shapeOrder),
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalOrders / limit),
        totalOrders,
        hasNext: page < Math.ceil(totalOrders / limit),
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error("Get user orders error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch orders" });
  }
};

// ===============================
// Get Order Details
// ===============================

const getOrderDetails = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user?.userId;

    const query = { _id: orderId };
    if (userId) query.user = userId;

    const order = await Order.findOne(query).populate("items.product", "name images price");

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    res.json({ success: true, order: shapeOrder(order) });
  } catch (error) {
    console.error("Get order details error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch order details" });
  }
};

// ===============================
// Track Order (Shipmozo)
// ===============================

const trackOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user?.userId;

    const query = { _id: orderId };
    if (userId) query.user = userId;

    const order = await Order.findOne(query);

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    let trackingData = null;

    if (order.shipmozoDetails?.awbNumber) {
      const trackingResult = await shipmozoService.trackOrder(order.shipmozoDetails.awbNumber);
      if (trackingResult.success) {
        trackingData = trackingResult;

        if (trackingResult.scanHistories && trackingResult.scanHistories.length > 0) {
          order.trackingHistory = trackingResult.scanHistories;

          const latestStatus = trackingResult.scanHistories[0]?.status;
          if (latestStatus === "Delivered") {
            order.shippingStatus = "DELIVERED";
            order.status = "DELIVERED";
          } else if (latestStatus === "Out for Delivery" || latestStatus === "In-Transit") {
            order.shippingStatus = "SHIPPED";
          }
          await order.save();
        }
      }
    }

    res.json({ success: true, order: shapeOrder(order), trackingData });
  } catch (error) {
    console.error("Track order error:", error);
    res.status(500).json({ success: false, message: "Failed to track order" });
  }
};

// ===============================
// Get Shipping Rates (Fallback)
// ===============================

const getShippingRates = async (req, res) => {
  try {
    const { deliveryPincode, weight = 0.5, cod = 0 } = req.body;

    if (!deliveryPincode) {
      return res.status(400).json({ success: false, message: "Delivery pincode is required" });
    }

    if (!/^[1-9][0-9]{5}$/.test(deliveryPincode)) {
      return res.status(400).json({ success: false, message: "Please enter a valid 6-digit pincode" });
    }

    // Try Shipmozo rate calculator first
    try {
      const pickupPincode = process.env.SHIPMOZO_PICKUP_PINCODE || "421005";
      const ratesResult = await shipmozoService.getShippingRates(
        pickupPincode,
        deliveryPincode,
        weight * 1000, // convert to grams
        1000, // order amount
        cod > 0 ? "COD" : "PREPAID"
      );

      if (ratesResult.success && ratesResult.rates && ratesResult.rates.length > 0) {
        const formattedRates = ratesResult.rates.map(rate => ({
          courier_company_id: rate.courier_id,
          courier_name: rate.courier_name,
          freight_charge: rate.total_shipping_charges,
          cod_charge: cod > 0 ? rate.cod_charge || 25 : 0,
          total_charge: rate.total_shipping_charges,
          etd: rate.tat ? `${rate.tat} days` : "3-5 days",
          rate_type: rate.courier_type || "surface"
        }));

        return res.status(200).json({ success: true, rates: formattedRates, source: "shipmozo" });
      }
    } catch (e) {
      console.log("Shipmozo rate calculator failed, using fallback");
    }

    // Fallback: Simple flat rates
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
    ];

    res.status(200).json({ success: true, rates: mockRates, source: "fallback" });
  } catch (error) {
    console.error("Get shipping rates error:", error);
    res.status(500).json({ success: false, message: "Failed to get shipping rates" });
  }
};

// ===============================
// Public Order Lookup
// ===============================

const getPublicOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findOne({
      $or: [
        { orderNumber: orderId },
        { "shipmozoDetails.awbNumber": orderId }
      ]
    }).populate('items.product');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    res.json({ success: true, order: shapeOrder(order) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ===============================
// Cancel Order (with Shipmozo)
// ===============================

const cancelOrder = async (req, res) => {
  try {
    console.log('='.repeat(60));
    console.log('🟢 CANCEL ORDER FUNCTION STARTED');
    console.log('='.repeat(60));
    console.log('📌 Order ID:', req.params.orderId);
    console.log('📌 User ID:', req.user.userId);
    console.log('📌 Cancel Reason:', req.body.reason);
    
    const { orderId } = req.params;
    const { reason } = req.body;
    const userId = req.user.userId;

    console.log('🔍 Step 1: Finding order in database...');
    const order = await Order.findOne({ _id: orderId, user: userId });
    
    if (!order) {
      console.log('❌ Order not found for ID:', orderId);
      return res.status(404).json({ success: false, message: "Order not found" });
    }
    
    console.log('✅ Order found:', {
      orderNumber: order.orderNumber,
      currentStatus: order.status,
      shippingStatus: order.shippingStatus,
      paymentMethod: order.paymentInfo?.method,
      paymentStatus: order.paymentInfo?.status,
      totalAmount: order.total,
      shipmozoOrderId: order.shipmozoDetails?.orderId,
      shipmozoStatus: order.shipmozoDetails?.status
    });

    const status = String(order.status || "").toUpperCase();
    const cancellable = ["PLACED", "CONFIRMED", "PROCESSING"];
    const terminal = ["SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED", "RETURNED"];

    console.log('🔍 Step 2: Checking if order can be cancelled...');
    console.log('   Current Status:', status);
    console.log('   Cancellable Statuses:', cancellable);
    console.log('   Terminal Statuses:', terminal);

    if (terminal.includes(status)) {
      console.log('❌ Order cannot be cancelled - Terminal status:', status);
      return res.status(400).json({ success: false, message: "Order cannot be cancelled after shipping/delivery" });
    }
    
    if (!cancellable.includes(status)) {
      console.log('❌ Order cannot be cancelled - Not in cancellable status:', status);
      return res.status(400).json({ success: false, message: "Order cannot be cancelled at this stage" });
    }
    
    console.log('✅ Order is eligible for cancellation');

    // ✅ NEW: Cancel in Shipmozo if orderId exists (even without AWB)
    if (order.shipmozoDetails?.orderId) {
      console.log('🔍 Step 3: Cancelling order in Shipmozo...');
      console.log('   Shipmozo Order ID:', order.shipmozoDetails.orderId);
      console.log('   Shipmozo Status:', order.shipmozoDetails.status);
      
      try {
        // Try to cancel using cancelOrder API (works for both DRAFT and AWB orders)
        const cancelResult = await shipmozoService.cancelOrder(
          order.shipmozoDetails.orderId, 
          order.shipmozoDetails.awbNumber || null
        );
        
        if (cancelResult.success) {
          console.log('✅ Order cancelled in Shipmozo successfully');
          order.shipmozoDetails.status = "CANCELLED";
        } else {
          console.log('⚠️ Shipmozo cancel returned:', cancelResult);
        }
      } catch (cancelError) {
        console.error('❌ Shipmozo cancel error:', cancelError.message);
        console.log('⚠️ Continuing with local cancellation...');
      }
    } else {
      console.log('ℹ️ No Shipmozo order found, skipping Shipmozo cancellation');
    }

    // Refund if prepaid
    console.log('🔍 Step 4: Checking refund eligibility...');
    const method = order.paymentInfo?.method;
    const pStatus = order.paymentInfo?.status;
    console.log('   Payment Method:', method);
    console.log('   Payment Status:', pStatus);
    
    if ((method === "RAZORPAY" || method === "PARTIAL_COD") && pStatus === "PAID") {
      console.log('✅ Order is eligible for refund');
      const amountPaise = Math.max(0, Math.round((order.total || 0) * 100));
      console.log('   Refund Amount:', order.total);
      console.log('   Refund Amount in Paise:', amountPaise);
      
      try {
        console.log('   Attempting Razorpay refund...');
        const refund = await razorpay.payments.refund(order.paymentInfo.razorpayPaymentId, {
          amount: amountPaise,
          speed: "optimum",
          notes: { orderNumber: order.orderNumber || String(order._id) },
        });
        
        console.log('✅ Refund successful:', {
          refundId: refund.id,
          amount: refund.amount / 100,
          status: refund.status
        });
        
        order.paymentInfo.status = "REFUNDED";
        order.paymentInfo.razorpayRefundId = refund?.id;
      } catch (refundErr) {
        console.error('❌ Refund error:', refundErr.message);
        if (refundErr.response) {
          console.error('   Response status:', refundErr.response.status);
          console.error('   Response data:', JSON.stringify(refundErr.response.data, null, 2));
        }
        order.paymentInfo.refundInitiated = true;
        order.paymentInfo.refundError = refundErr.message;
      }
    } else {
      console.log('ℹ️ Order not eligible for refund (Payment Method:', method, ', Payment Status:', pStatus, ')');
    }

    // Update order status
    console.log('🔍 Step 5: Updating order status...');
    order.status = "CANCELLED";
    order.shippingStatus = "CANCELLED";
    order.cancelReason = reason || "Cancelled by user";
    order.cancelledAt = new Date();
    
    console.log('   New Status:', order.status);
    console.log('   New Shipping Status:', order.shippingStatus);
    console.log('   Cancel Reason:', order.cancelReason);
    
    await order.save();
    console.log('✅ Order status updated in database');

    // Restock items
    console.log('🔍 Step 6: Restocking items...');
    let restockCount = 0;
    for (const item of order.items) {
      if (item?.product && item?.quantity) {
        console.log(`   Restocking product ${item.product} with quantity ${item.quantity}`);
        await Product.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity } });
        restockCount++;
      }
    }
    console.log(`✅ Restocked ${restockCount} items`);

    console.log('='.repeat(60));
    console.log('✅ ORDER CANCELLED SUCCESSFULLY');
    console.log('='.repeat(60));
    
    res.json({ success: true, message: "Order cancelled successfully", order });
  } catch (error) {
    console.error('='.repeat(60));
    console.error('❌ CANCEL ORDER ERROR');
    console.error('='.repeat(60));
    console.error('Error Message:', error.message);
    console.error('Error Stack:', error.stack);
    if (error.response) {
      console.error('Response Status:', error.response.status);
      console.error('Response Data:', JSON.stringify(error.response.data, null, 2));
    }
    res.status(500).json({ success: false, message: error.message || "Failed to cancel order" });
  }
};


// ===============================
// EXPORT ORDERS TO EXCEL (Admin Only)
// ===============================

const exportOrdersToExcel = async (req, res) => {
  try {
    console.log("=".repeat(60));
    console.log("📊 EXPORT ORDERS TO EXCEL");
    console.log("=".repeat(60));

    const { startDate, endDate } = req.body;

    if (!startDate || !endDate) {
      return res.status(400).json({ 
        success: false, 
        message: "Please provide both startDate and endDate" 
      });
    }

    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);

    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    console.log(`📅 Date Range: ${start.toISOString()} to ${end.toISOString()}`);

    // Fetch orders in date range
    const orders = await Order.find({
      createdAt: { $gte: start, $lte: end }
    })
      .populate("user", "name email")
      .sort({ createdAt: -1 });

    console.log(`✅ Found ${orders.length} orders`);

    if (orders.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: "No orders found in this date range" 
      });
    }

    // Prepare Excel data
    const excelData = orders.map((order, index) => {
      const onlineDiscount = order.pricing?.onlineDiscount || 0;
      const couponDiscount = order.discount || 0;
      const totalDiscount = onlineDiscount + couponDiscount;

      let paymentMethodDisplay = "—";
      if (order.paymentInfo?.method === "RAZORPAY") paymentMethodDisplay = "Online (Full)";
      else if (order.paymentInfo?.method === "COD") paymentMethodDisplay = "Cash on Delivery";
      else if (order.paymentInfo?.method === "PARTIAL_COD") paymentMethodDisplay = "Partial COD";

      let paymentStatusDisplay = "—";
      if (order.paymentInfo?.status === "PAID") paymentStatusDisplay = "Paid";
      else if (order.paymentInfo?.status === "PARTIALLY_PAID") paymentStatusDisplay = "Partially Paid";
      else if (order.paymentInfo?.status === "PENDING") paymentStatusDisplay = "Pending";
      else if (order.paymentInfo?.status === "REFUNDED") paymentStatusDisplay = "Refunded";

      const shippingStatus = order.shippingStatus || "PENDING";

      const awbNumber = order.shipmozoDetails?.awbNumber || order.trackingInfo?.awbCode || "—";

      const courierName = order.shipmozoDetails?.courierCompany || order.trackingInfo?.courierName || "—";

      const itemsList = order.items.map(item => 
        `${item.name} (${item.quantity} × ₹${item.price})${item.isBulkProduct ? ' [BULK]' : ''}`
      ).join(" | ");

      const sizesList = order.items.map(item => item.size || "—").join(", ");

      const colorsList = order.items.map(item => item.color || "—").join(", ");

      return {
        "Sr. No.": index + 1,
        "Order Number": order.orderNumber,
        "Order Date": new Date(order.createdAt).toLocaleString("en-IN", { 
          day: "2-digit", 
          month: "2-digit", 
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit"
        }),
        "Customer Name": order.shippingAddress?.fullName || "—",
        "Phone": order.shippingAddress?.phoneNumber || "—",
        "Email": order.shippingAddress?.email || order.user?.email || "—",
        "Address": `${order.shippingAddress?.addressLine1 || ""} ${order.shippingAddress?.addressLine2 || ""}, ${order.shippingAddress?.city || ""}, ${order.shippingAddress?.state || ""} - ${order.shippingAddress?.pinCode || ""}`,
        "Items": itemsList,
        "Sizes": sizesList,
        "Colors": colorsList,
        "Quantity": order.items.reduce((sum, item) => sum + item.quantity, 0),
        "Subtotal (₹)": order.subtotal || 0,
        "Coupon Discount (₹)": couponDiscount,
        "Online Discount (₹)": onlineDiscount,
        "Total Discount (₹)": totalDiscount,
        "Shipping Charges (₹)": order.shippingCharge || 0,
        "Total Amount (₹)": order.total || 0,
        "Payment Method": paymentMethodDisplay,
        "Payment Status": paymentStatusDisplay,
        "Order Status": order.status || "—",
        "Shipping Status": shippingStatus,
        "AWB Number": awbNumber,
        "Courier Name": courierName,
        "Tracking URL": order.shipmozoDetails?.trackingUrl || order.trackingInfo?.trackingUrl || "—",
        "Cancel Reason": order.cancelReason || "—",
        "Return Reason": order.returnReason || "—",
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(excelData);

    // Auto-size columns (set column widths)
    const colWidths = [
      { wch: 8 },   // Sr. No.
      { wch: 20 },  // Order Number
      { wch: 20 },  // Order Date
      { wch: 25 },  // Customer Name
      { wch: 15 },  // Phone
      { wch: 30 },  // Email
      { wch: 50 },  // Address
      { wch: 60 },  // Items
      { wch: 15 },  // Sizes
      { wch: 15 },  // Colors
      { wch: 10 },  // Quantity
      { wch: 15 },  // Subtotal
      { wch: 15 },  // Coupon Discount
      { wch: 15 },  // Online Discount
      { wch: 15 },  // Total Discount
      { wch: 15 },  // Shipping Charges
      { wch: 15 },  // Total Amount
      { wch: 18 },  // Payment Method
      { wch: 15 },  // Payment Status
      { wch: 15 },  // Order Status
      { wch: 15 },  // Shipping Status
      { wch: 20 },  // AWB Number
      { wch: 20 },  // Courier Name
      { wch: 40 },  // Tracking URL
      { wch: 30 },  // Cancel Reason
      { wch: 30 },  // Return Reason
    ];
    worksheet["!cols"] = colWidths;

    const headerRange = XLSX.utils.decode_range(worksheet["!ref"] || "A1:Z1");
    for (let C = headerRange.s.c; C <= headerRange.e.c; ++C) {
      const address = XLSX.utils.encode_cell({ r: 0, c: C });
      if (!worksheet[address]) continue;
      worksheet[address].s = {
        font: { bold: true, sz: 11 },
        fill: { fgColor: { rgb: "D3D3D3" }, patternType: "solid" },
        alignment: { horizontal: "center", vertical: "center" }
      };
    }

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, `Orders_${startDate}_to_${endDate}`);

    const excelBuffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    const fileName = `orders_${startDate}_to_${endDate}.xlsx`;
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename=${fileName}`);

    console.log(`✅ Excel file generated: ${fileName}`);
    console.log("=".repeat(60));

    return res.send(excelBuffer);

  } catch (error) {
    console.error("❌ Export orders error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to export orders",
      error: error.message 
    });
  }
};


// ===============================
// Exports
// ===============================

module.exports = {
  createRazorpayOrder,
  placeCodOrder,
  verifyPaymentAndCreateOrder,
  getUserOrders,
  getOrderDetails,
  cancelOrder,
  trackOrder,
  getShippingRates,
  getPublicOrder,
  getPaymentMethodsHandler,
  createPartialCodOrder,
  verifyPartialCodPayment,
  returnOrder,
  exportOrdersToExcel
};