const express = require('express');
const router = express.Router();
const Order = require('../models/Order');

router.post('/order-update', async (req, res) => {
  try {
    console.log('='.repeat(60));
    console.log('📦 SHIPMOZO WEBHOOK RECEIVED');
    console.log('='.repeat(60));
    console.log('Request Body:', JSON.stringify(req.body, null, 2));
    
    const { 
      order_id,
      reference_id,
      awb_number,
      courier_name,
      courier_service,
      status,
      delivery_status,
      label_url,
      timestamp,
      message,
      scan_history
    } = req.body;
    
    let order = null;
    
    if (order_id && order_id.startsWith('FH-')) {
      order = await Order.findOne({ orderNumber: order_id });
    }
    
    if (!order && order_id) {
      order = await Order.findOne({ 'shipmozoDetails.orderId': order_id });
    }
    
    if (!order && awb_number) {
      order = await Order.findOne({ 'shipmozoDetails.awbNumber': awb_number });
    }
    
    if (!order && reference_id) {
      order = await Order.findOne({ orderNumber: reference_id });
    }
    
    if (!order) {
      console.log(`❌ Order not found for order_id: ${order_id || reference_id || awb_number}`);
      return res.status(200).json({ success: false, message: 'Order not found' });
    }
    
    console.log(`✅ Order found: ${order.orderNumber}`);
    let isUpdated = false;
    
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
    }
    
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
    
    if (delivery_status) {
      const statusUpper = delivery_status.toUpperCase();
      
      if (statusUpper === 'SHIPPED' && order.status !== 'SHIPPED') {
        order.status = 'SHIPPED';
        order.shippingStatus = 'SHIPPED';
        isUpdated = true;
        console.log(`🚚 Order ${order.orderNumber} status: SHIPPED`);
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
    
    if (status && !order.shipmozoDetails?.status) {
      order.shipmozoDetails.status = status;
      isUpdated = true;
      console.log(`📋 Shipmozo status: ${status}`);
    }
    
    if (isUpdated) {
      order.shipmozoDetails.lastSyncAt = new Date();
      await order.save();
      console.log(`💾 Order ${order.orderNumber} updated successfully`);
    } else {
      console.log(`ℹ️ No updates needed for order ${order.orderNumber}`);
    }
    
    res.status(200).json({ 
      success: true, 
      message: 'Webhook processed successfully',
      orderId: order.orderNumber
    });
    
  } catch (error) {
    console.error('❌ Webhook processing error:', error);
    res.status(200).json({ 
      success: false, 
      message: error.message 
    });
  }
});

router.get('/health', (req, res) => {
  console.log('🏥 Shipmozo webhook health check called');
  res.status(200).json({ 
    success: true, 
    status: 'active',
    service: 'Shipmozo Webhook Receiver',
    timestamp: new Date().toISOString()
  });
});

router.post('/test', (req, res) => {
  console.log('🧪 Test webhook received');
  console.log('Body:', JSON.stringify(req.body, null, 2));
  res.status(200).json({ success: true, message: 'Test received' });
});

module.exports = router;