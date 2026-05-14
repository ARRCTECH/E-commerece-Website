const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const { sendEmail } = require('../utils/emailService');

// =============================================================
// SHIPMOZO WEBHOOK RECEIVER
// Shipmozo हा endpoint call करेल जेव्हा:
// - Order pushed successfully
// - AWB generated
// - Courier assigned
// - Order shipped
// - Order delivered
// - Order cancelled
// =============================================================

router.post('/order-update', async (req, res) => {
  try {
    console.log('='.repeat(60));
    console.log('📦 SHIPMOZO WEBHOOK RECEIVED');
    console.log('='.repeat(60));
    console.log('Request Body:', JSON.stringify(req.body, null, 2));
    
    const { 
      order_id,           // Shipmozo order_id (same as your orderNumber)
      reference_id,       // Reference ID (your orderNumber)
      awb_number,         // AWB Number
      courier_name,       // Courier name (e.g., Delhivery, XpressBees)
      courier_service,    // Courier service type
      status,             // Order status in Shipmozo
      delivery_status,    // Delivery status (SHIPPED, OUT_FOR_DELIVERY, DELIVERED)
      label_url,          // Label PDF URL (if available)
      timestamp,          // Event timestamp
      message,            // Additional message
      scan_history        // Array of tracking updates (if provided)
    } = req.body;
    
    // ✅ Find order by orderNumber (which is same as Shipmozo's order_id)
    let order = null;
    
    // Try to find by orderNumber first
    if (order_id) {
      order = await Order.findOne({ orderNumber: order_id });
    }
    
    // If not found, try by shipmozoDetails.orderId
    if (!order && reference_id) {
      order = await Order.findOne({ 'shipmozoDetails.orderId': reference_id });
    }
    
    if (!order) {
      console.log(`❌ Order not found for order_id: ${order_id || reference_id}`);
      // Still return 200 to avoid webhook retries
      return res.status(200).json({ success: false, message: 'Order not found' });
    }
    
    console.log(`✅ Order found: ${order.orderNumber}`);
    let isUpdated = false;
    
    // ✅ 1. Update AWB if provided
    if (awb_number && !order.shipmozoDetails?.awbNumber) {
      order.shipmozoDetails = {
        ...order.shipmozoDetails,
        awbNumber: awb_number,
        courierCompany: courier_name || order.shipmozoDetails?.courierCompany,
        courierService: courier_service || order.shipmozoDetails?.courierService,
        labelUrl: label_url || order.shipmozoDetails?.labelUrl,
        status: status || 'AWB_GENERATED',
        lastSyncAt: new Date()
      };
      order.shippingStatus = 'PROCESSING';
      isUpdated = true;
      console.log(`✨ AWB Saved: ${awb_number} (${courier_name})`);
      
      // ✅ Send email to customer with AWB
      if (order.shippingAddress?.email) {
        try {
          await sendEmail({
            to: order.shippingAddress.email,
            subject: `Your order ${order.orderNumber} has been processed!`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px;">
                <h2 style="color: #22c55e;">Order Processed! 🚚</h2>
                <p>Dear ${order.shippingAddress.fullName || 'Customer'},</p>
                <p>Your order <strong>${order.orderNumber}</strong> has been processed and is ready for shipping.</p>
                <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 15px 0;">
                  <p><strong>AWB Number:</strong> ${awb_number}</p>
                  <p><strong>Courier:</strong> ${courier_name || 'To be updated'}</p>
                  <p><strong>Tracking:</strong> You can track your order in "My Orders" section.</p>
                </div>
                <p>Thank you for shopping with FactorySale!</p>
              </div>
            `
          });
          console.log(`📧 AWB email sent to ${order.shippingAddress.email}`);
        } catch (emailError) {
          console.error('❌ Email sending failed:', emailError.message);
        }
      }
    }
    
    // ✅ 2. Update Scan History if provided
    if (scan_history && Array.isArray(scan_history) && scan_history.length > 0) {
      order.trackingHistory = scan_history.map(scan => ({
        status: scan.scan_status,
        location: scan.scan_location,
        timestamp: scan.scan_datetime,
        remark: scan.scan_remarks
      }));
      isUpdated = true;
      console.log(`📋 Tracking history updated: ${scan_history.length} entries`);
    }
    
    // ✅ 3. Update Delivery Status
    if (delivery_status) {
      const statusUpper = delivery_status.toUpperCase();
      
      if (statusUpper === 'SHIPPED' && order.status !== 'SHIPPED') {
        order.status = 'SHIPPED';
        order.shippingStatus = 'SHIPPED';
        isUpdated = true;
        console.log(`🚚 Order ${order.orderNumber} status: SHIPPED`);
        
        // Send shipping notification
        if (order.shippingAddress?.email && order.shipmozoDetails?.awbNumber) {
          try {
            await sendEmail({
              to: order.shippingAddress.email,
              subject: `Your order ${order.orderNumber} has been shipped!`,
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px;">
                  <h2 style="color: #3b82f6;">Order Shipped! 🚚</h2>
                  <p>Dear ${order.shippingAddress.fullName || 'Customer'},</p>
                  <p>Your order <strong>${order.orderNumber}</strong> is on the way!</p>
                  <p><strong>AWB:</strong> ${order.shipmozoDetails.awbNumber}</p>
                  <p><strong>Courier:</strong> ${order.shipmozoDetails.courierCompany}</p>
                  <p>Track your order in "My Orders" section.</p>
                </div>
              `
            });
          } catch (e) {}
        }
      }
      
      if (statusUpper === 'OUT_FOR_DELIVERY') {
        order.shippingStatus = 'SHIPPED';
        isUpdated = true;
        console.log(`🚪 Order ${order.orderNumber} status: OUT FOR DELIVERY`);
      }
      
      if (statusUpper === 'DELIVERED' && order.status !== 'DELIVERED') {
        order.status = 'DELIVERED';
        order.shippingStatus = 'DELIVERED';
        order.deliveredAt = new Date();
        isUpdated = true;
        console.log(`✅ Order ${order.orderNumber} status: DELIVERED`);
        
        // Send delivery confirmation email
        if (order.shippingAddress?.email) {
          try {
            await sendEmail({
              to: order.shippingAddress.email,
              subject: `Your order ${order.orderNumber} has been delivered!`,
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px;">
                  <h2 style="color: #22c55e;">Order Delivered! 🎉</h2>
                  <p>Dear ${order.shippingAddress.fullName || 'Customer'},</p>
                  <p>Your order <strong>${order.orderNumber}</strong> has been successfully delivered.</p>
                  <p>We hope you love your purchase! ❤️</p>
                  <p>Thank you for shopping with FactorySale!</p>
                </div>
              `
            });
            console.log(`📧 Delivery email sent to ${order.shippingAddress.email}`);
          } catch (e) {}
        }
      }
      
      if (statusUpper === 'CANCELLED' && order.status !== 'CANCELLED') {
        order.status = 'CANCELLED';
        order.shippingStatus = 'CANCELLED';
        isUpdated = true;
        console.log(`❌ Order ${order.orderNumber} status: CANCELLED`);
      }
      
      if (statusUpper === 'RTO_DELIVERED') {
        order.status = 'CANCELLED';
        order.shippingStatus = 'RTO';
        order.rtoAt = new Date();
        isUpdated = true;
        console.log(`🔄 Order ${order.orderNumber} status: RTO (Return to Origin)`);
      }
    }
    
    // ✅ 4. Update general status
    if (status && !order.shipmozoDetails?.status) {
      order.shipmozoDetails.status = status;
      isUpdated = true;
      console.log(`📋 Shipmozo status: ${status}`);
    }
    
    // ✅ Save if any update happened
    if (isUpdated) {
      order.shipmozoDetails.lastSyncAt = new Date();
      await order.save();
      console.log(`💾 Order ${order.orderNumber} updated successfully`);
    } else {
      console.log(`ℹ️ No updates needed for order ${order.orderNumber}`);
    }
    
    // ✅ Always send success response to Shipmozo
    res.status(200).json({ 
      success: true, 
      message: 'Webhook processed successfully',
      orderId: order.orderNumber
    });
    
  } catch (error) {
    console.error('❌ Webhook processing error:', error);
    // Always return 200 to avoid webhook retries
    res.status(200).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// =============================================================
// HEALTH CHECK ENDPOINT (for Shipmozo to verify)
// =============================================================

router.get('/health', (req, res) => {
  console.log('🏥 Shipmozo webhook health check called');
  res.status(200).json({ 
    success: true, 
    status: 'active',
    service: 'Shipmozo Webhook Receiver',
    timestamp: new Date().toISOString()
  });
});

// =============================================================
// TEST ENDPOINT (for manual testing)
// =============================================================

router.post('/test', (req, res) => {
  console.log('🧪 Test webhook received');
  console.log('Body:', JSON.stringify(req.body, null, 2));
  res.status(200).json({ success: true, message: 'Test received' });
});

module.exports = router;