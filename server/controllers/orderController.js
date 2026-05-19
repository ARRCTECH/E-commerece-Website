const Order = require("../models/Order");
const User = require("../models/User");
const Product = require("../models/Product");
const Coupon = require("../models/Coupon");
const PartialCodSetting = require("../models/PartialCodSetting");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const { sendEmail } = require("../utils/emailService");
const shipmozoService = require("../services/shipmozoService");

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

    // const shippingCharges = subtotal >= 399 ? 0 : 99;
    const shippingCharges = 0;
    const total = Math.round(amount || (subtotal + shippingCharges - discount));
    const orderNumber = `FH-${Date.now()}`;

    console.log("💰 Order Summary:", { subtotal, shippingCharges, discount, total, freediscount, referralDiscount });

    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(total * 100),
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
      notes: { 
        userId: userId || "guest", 
        couponCode: couponCode || "",
        type: "full_payment"
      },
    });

    console.log("✅ Razorpay order created:", razorpayOrder.id);

    const order = new Order({
      user: userId,
      orderNumber,
      items: validatedItems,
      shippingAddress,
      subtotal,
      shippingCharge: shippingCharges,
      freediscount: freediscount || 0,
      referralDiscount: referralDiscount || 0,
      discount,
      total,
      pricing: { 
        subtotal, 
        shippingCharges, 
        tax: 0, 
        discount, 
        total, 
        freediscount: freediscount || 0, 
        referralDiscount: referralDiscount || 0,  
        selectedShippingRate 
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

    if (userId) {
      await User.findByIdAndUpdate(userId, {
        tempOrderData: {
          user: userId,
          orderNumber,
          items: validatedItems.map(({ _id, __v, ...rest }) => rest),
          shippingAddress,
          pricing: { subtotal, shippingCharges, tax: 0, discount, total, freediscount: freediscount || 0, referralDiscount: referralDiscount || 0, selectedShippingRate },
          coupon: couponDetails,
          paymentInfo: { razorpayOrderId: razorpayOrder.id, method: "RAZORPAY", status: "pending" },
          status: "PLACED",
          total,
          subtotal,
          discount,
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
        items: validatedItems.length, 
        isGuest: !userId 
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
    const validatedItems = [];
    
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
    
    // const shippingCharges = subtotal >= 399 ? 0 : 99;
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
    
    const finalTotal = Math.round(subtotal + shippingCharges - discount);
    const orderNumber = `FH-${Date.now()}`;
    
    console.log("💰 Order Summary:", { subtotal, shippingCharges, discount, finalTotal });
    
    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(onlineAmount * 100),
      currency: "INR",
      receipt: `partial_${orderNumber}`,
      notes: { 
        type: "partial_cod", 
        codAmount: codAmount,
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
        onlineAmount: onlineAmount,
        codAmount: codAmount,
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
        onlineAmount,
        codAmount,
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

    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      console.log("🔴 Signature mismatch");
      return res.status(400).json({ success: false, message: "Payment verification failed" });
    }

    let order;

    if (userId) {
      const user = await User.findById(userId).lean();
      if (!user?.tempOrderData) {
        return res.status(400).json({ success: false, message: "Order data not found" });
      }
      order = await Order.findOne({ _id: user.tempOrderData.temp_order_id, user: userId });
    } else {
      order = await Order.findOne({ "paymentInfo.razorpayOrderId": razorpay_order_id });
    }

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    order.status = "CONFIRMED";
    order.shippingStatus = "PROCESSING";
    order.paymentInfo = {
      ...order.paymentInfo,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
      status: "PAID",
      paidAt: new Date(),
      method: "RAZORPAY",
    };
    await order.save();

    for (const item of order.items) {
      if (!item.isBulkProduct) {
        await Product.findByIdAndUpdate(item.product, { $inc: { stock: -item.quantity } });
      }
    }

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

    if (userId) {
      await User.findByIdAndUpdate(userId, { cart: [], tempOrderData: null });
    }

    // ✅ Send response immediately
    res.json({
      success: true,
      message: "Order placed successfully",
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
      },
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
          referralDiscount: freshOrder.pricing?.referralDiscount || 0,
          paymentType: "PREPAID",
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
    console.error("Verify payment error:", error);
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
    const validatedItems = [];

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

    // const shippingCharges = subtotal >= 399 ? 0 : 99;
    const shippingCharges = 0;
    const total = Math.round(amount);
    const orderNumber = `FH-${Date.now()}`;

    const order = new Order({
      user: userId,
      orderNumber,
      items: validatedItems,
      shippingAddress,
      subtotal,
      shippingCharge: shippingCharges,
      freediscount: freediscount || 0,
      referralDiscount:referralDiscount || 0,
      discount,
      total,
      pricing: { subtotal, shippingCharges, tax: 0, discount, total, freediscount, referralDiscount, selectedShippingRate },
      coupon: couponDetails,
      paymentInfo: { method: "COD", status: "PENDING", razorpayOrderId: orderNumber },
      status: "CONFIRMED",
      shippingStatus: "PROCESSING",
      shipmozoDetails: { status: "PENDING" },
      trackingInfo: { awbStatus: "PENDING" },
    });

    await order.save();

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

    // ✅ BACKGROUND: Push order to Shipmozo (DRAFT mode - NO auto-assign)
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
          console.log(`✅ COD order pushed to Shipmozo (DRAFT). Order ID: ${pushResult.orderId}`);
          console.log(`📋 Client must login to Shipmozo dashboard to generate AWB`);
        } else {
          console.error(`❌ Shipmozo push failed for COD:`, pushResult.error);
          freshOrder.shipmozoDetails = {
            status: "FAILED",
            errorMessage: pushResult.error,
            lastSyncAt: new Date()
          };
          await freshOrder.save();
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
    const { orderId } = req.params;
    const { reason } = req.body;
    const userId = req.user.userId;

    const order = await Order.findOne({ _id: orderId, user: userId });
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    const status = String(order.status || "").toUpperCase();
    const cancellable = ["PLACED", "CONFIRMED", "PROCESSING"];
    const terminal = ["SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED", "RETURNED"];

    if (terminal.includes(status)) {
      return res.status(400).json({ success: false, message: "Order cannot be cancelled after shipping/delivery" });
    }
    if (!cancellable.includes(status)) {
      return res.status(400).json({ success: false, message: "Order cannot be cancelled at this stage" });
    }

    // Cancel in Shipmozo if AWB exists
    if (order.shipmozoDetails?.awbNumber && order.shipmozoDetails?.orderId) {
      try {
        await shipmozoService.cancelOrder(order.shipmozoDetails.orderId, order.shipmozoDetails.awbNumber);
        console.log(`✅ Order cancelled in Shipmozo: ${order.shipmozoDetails.orderId}`);
      } catch (cancelError) {
        console.error("Shipmozo cancel error:", cancelError);
      }
    }

    // Refund if prepaid
    try {
      const method = order.paymentInfo?.method;
      const pStatus = order.paymentInfo?.status;
      if ((method === "RAZORPAY" || method === "PARTIAL_COD") && pStatus === "PAID") {
        const amountPaise = Math.max(0, Math.round((order.total || 0) * 100));
        const refund = await razorpay.payments.refund(order.paymentInfo.razorpayPaymentId, {
          amount: amountPaise,
          speed: "optimum",
          notes: { orderNumber: order.orderNumber || String(order._id) },
        });
        order.paymentInfo.status = "REFUNDED";
        order.paymentInfo.razorpayRefundId = refund?.id;
      }
    } catch (refundErr) {
      console.error("Refund error:", refundErr);
      order.paymentInfo.refundInitiated = true;
      order.paymentInfo.refundError = refundErr.message;
    }

    order.status = "CANCELLED";
    order.shippingStatus = "CANCELLED";
    order.cancelReason = reason || "Cancelled by user";
    order.cancelledAt = new Date();
    await order.save();

    // Restock items
    for (const item of order.items) {
      if (item?.product && item?.quantity) {
        await Product.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity } });
      }
    }

    res.json({ success: true, message: "Order cancelled successfully", order });
  } catch (error) {
    console.error("Cancel order error:", error);
    res.status(500).json({ success: false, message: "Failed to cancel order" });
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
  verifyPartialCodPayment
};