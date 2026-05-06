const { sendEmail } = require('../utils/emailService');

// Simulate the actual order confirmation email process
async function testActualOrderConfirmation() {
  console.log('🔬 Testing Actual Order Confirmation Process...\n');

  // Mock order and user data as it would come from the database
  const mockOrder = {
    _id: '6756789012345678901234ab',
    orderNumber: 'KSB-' + Date.now(),
    total: 1599,
    subtotal: 1299,
    shippingCharge: 150,
    discount: 0,
    freediscount: 50,
    status: 'confirmed',
    createdAt: new Date(),
    paymentInfo: {
      method: 'razorpay',
      transactionId: 'pay_test123456'
    },
    trackingInfo: {
      trackingNumber: 'KSB' + Date.now(),
      estimatedDelivery: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      carrier: 'Shiprocket'
    },
    items: [
      {
        name: 'Premium Cotton T-Shirt',
        productName: 'Premium Cotton T-Shirt',
        quantity: 2,
        price: 599,
        size: 'M',
        color: 'Navy Blue',
        image: 'https://via.placeholder.com/300x300/4F46E5/FFFFFF?text=T-Shirt'
      },
      {
        name: 'Casual Jeans',
        productName: 'Casual Jeans',
        quantity: 1,
        price: 1099,
        size: '32',
        color: 'Dark Blue',
        image: 'https://via.placeholder.com/300x300/1F2937/FFFFFF?text=Jeans'
      }
    ],
    shippingAddress: {
      fullName: 'John Doe',
      addressLine1: '123 Fashion Street',
      addressLine2: 'Bandra West',
      city: 'Mumbai',
      state: 'Maharashtra',
      pinCode: '400050',
      phoneNumber: '+91-9876543210',
      email: 'customer@example.com'
    }
  };

  const mockUser = {
    _id: '6756789012345678901234aa',
    name: 'John Doe',
    email: 'customer@example.com',
    phoneNumber: '+91-9876543210'
  };

  console.log('📋 Mock Order Details:');
  console.log('   Order Number:', mockOrder.orderNumber);
  console.log('   Total Amount:', `₹${mockOrder.total}`);
  console.log('   Items Count:', mockOrder.items.length);
  console.log('   Customer:', mockUser.name, '(' + mockUser.email + ')');
  console.log('');

  try {
    // Test the same logic as used in orderController.js
    const totalNum = Number(mockOrder.total || 0);
    const fmt = (n) => `₹${Number(n || 0).toFixed(2)}`;
    const paymentMethod = mockOrder.paymentInfo?.method || 'Unknown';
    const trackingNumber = mockOrder.trackingInfo?.trackingNumber || '';
    const estimatedDelivery = mockOrder.trackingInfo?.estimatedDelivery || null;

    // Format order items for email template
    const formattedItems = mockOrder.items.map(item => ({
      name: item.name || item.productName || "Product",
      quantity: item.quantity || 1,
      price: fmt(item.price || 0),
      totalPrice: fmt((item.price || 0) * (item.quantity || 1)),
      image: item.image || item.imageUrl,
      size: item.size,
      color: item.color,
    }));

    // Prepare email data exactly as in orderController
    const emailData = {
      customerName: mockUser.name || "Valued Customer",
      orderNumber: mockOrder.orderNumber || "—",
      orderId: mockOrder._id,
      orderDate: new Date(mockOrder.createdAt || new Date()).toLocaleDateString(),
      total: fmt(totalNum),
      paymentMethod,
      trackingNumber,
      estimatedDelivery: estimatedDelivery ? new Date(estimatedDelivery).toLocaleDateString() : null,
      items: formattedItems,
      shippingAddress: mockOrder.shippingAddress || {},
    };

    console.log('📧 Email Data Prepared:');
    console.log('   Customer Name:', emailData.customerName);
    console.log('   Order Number:', emailData.orderNumber);
    console.log('   Total:', emailData.total);
    console.log('   Items:', emailData.items.length, 'products');
    console.log('   Tracking:', emailData.trackingNumber || 'Not assigned');
    console.log('');

    // Send customer confirmation email using the same method as orderController
    console.log('📤 Sending customer confirmation email...');
    await sendEmail({
      to: process.env.ADMIN || 'ksaunibliss@gmail.com', // Send to admin for testing
      template: 'orderConfirmation',
      data: emailData
    });

    console.log('✅ Customer confirmation email sent successfully!');

    // Also test admin notification (simplified version)
    console.log('📤 Sending admin notification email...');
    await sendEmail({
      to: process.env.ADMIN || 'ksaunibliss@gmail.com',
      subject: `🛎️ NEW ORDER: ${mockOrder.orderNumber} - ${fmt(totalNum)}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #dc2626;">🛎️ New Order Received</h2>
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>Order Information</h3>
            <p><strong>Order Number:</strong> ${mockOrder.orderNumber}</p>
            <p><strong>Customer:</strong> ${mockUser.name} (${mockUser.email})</p>
            <p><strong>Total Amount:</strong> ${fmt(totalNum)}</p>
            <p><strong>Items:</strong> ${mockOrder.items.length} products</p>
            <p><strong>Payment:</strong> ${paymentMethod}</p>
          </div>
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>Shipping Address</h3>
            <p>${mockOrder.shippingAddress.fullName}</p>
            <p>${mockOrder.shippingAddress.addressLine1}</p>
            ${mockOrder.shippingAddress.addressLine2 ? `<p>${mockOrder.shippingAddress.addressLine2}</p>` : ''}
            <p>${mockOrder.shippingAddress.city}, ${mockOrder.shippingAddress.state} - ${mockOrder.shippingAddress.pinCode}</p>
            <p>📞 ${mockOrder.shippingAddress.phoneNumber}</p>
          </div>
          <p style="color: #059669; font-weight: bold;">✅ Order requires processing within 24 hours</p>
        </div>
      `
    });

    console.log('✅ Admin notification email sent successfully!');
    console.log('');
    console.log('🎉 Complete order confirmation process test successful!');
    console.log('📧 Both customer and admin emails sent successfully');

  } catch (error) {
    console.error('❌ Order confirmation process test failed:', error.message);
    console.error('🔧 Error details:', error);
  }
}

// Run the comprehensive test
if (require.main === module) {
  require('dotenv').config();
  testActualOrderConfirmation()
    .then(() => {
      console.log('\n🎯 Comprehensive testing completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Comprehensive testing failed:', error.message);
      process.exit(1);
    });
}

module.exports = {
  testActualOrderConfirmation
};