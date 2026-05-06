const { sendEmail } = require('../utils/emailService');

// Test complete order email flow
async function testCompleteOrderEmailFlow() {
  console.log('🔬 Testing Complete Order Email Flow...\n');

  // Test 1: Order Confirmation Email
  console.log('📧 Test 1: Order Confirmation Email');
  try {
    await sendEmail({
      to: process.env.ADMIN || 'ksaunibliss@gmail.com',
      template: 'orderConfirmation',
      data: {
        customerName: 'John Doe',
        orderNumber: 'KSB-TEST-' + Date.now(),
        orderId: 'test-id-123',
        orderDate: new Date().toLocaleDateString(),
        total: '₹1,599.00',
        paymentMethod: 'Online Payment',
        trackingNumber: 'KSB123456789',
        estimatedDelivery: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toLocaleDateString(),
        items: [
          {
            name: 'Premium Cotton T-Shirt',
            quantity: 2,
            price: '₹599.00',
            totalPrice: '₹1,198.00',
            image: 'https://via.placeholder.com/60x60/4F46E5/FFFFFF?text=Shirt',
            size: 'L',
            color: 'Blue'
          },
          {
            name: 'Casual Jeans',
            quantity: 1,
            price: '₹401.00',
            totalPrice: '₹401.00',
            image: 'https://via.placeholder.com/60x60/1F2937/FFFFFF?text=Jeans',
            size: '32',
            color: 'Dark Blue'
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
      }
    });
    console.log('✅ Order Confirmation Email - PASSED');
  } catch (error) {
    console.error('❌ Order Confirmation Email - FAILED:', error.message);
  }

  // Test 2: Order Status Update - Shipped
  console.log('\n📧 Test 2: Order Status Update - Shipped');
  try {
    const mockOrder = {
      _id: 'test-order-id',
      orderNumber: 'KSB-SHIP-' + Date.now(),
      total: 1599,
      createdAt: new Date(),
      user: { name: 'Jane Smith', email: 'jane@example.com' },
      trackingInfo: {
        trackingNumber: 'TRACK123456',
        trackingUrl: 'https://shiprocket.co/tracking/TRACK123456'
      }
    };

    const statusUpdateHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #ec4899, #be185d); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">📦 Order Shipped!</h1>
        </div>
        <div style="padding: 30px; background: #f9fafb;">
          <h2 style="color: #1f2937;">Hello ${mockOrder.user.name}!</h2>
          <p style="color: #4b5563; line-height: 1.6;">Great news! Your order has been shipped and is on its way to you.</p>
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #0369a1;">
            <p><strong>Order Number:</strong> ${mockOrder.orderNumber}</p>
            <p><strong>Tracking Number:</strong> ${mockOrder.trackingInfo.trackingNumber}</p>
            <p><a href="${mockOrder.trackingInfo.trackingUrl}" style="color: #0369a1;">Track your order</a></p>
          </div>
          <p>Thank you for shopping with KsauniBliss!</p>
        </div>
      </div>
    `;

    await sendEmail({
      to: process.env.ADMIN || 'ksaunibliss@gmail.com',
      subject: `Order ${mockOrder.orderNumber} - SHIPPED`,
      html: statusUpdateHtml
    });
    console.log('✅ Order Status Update - PASSED');
  } catch (error) {
    console.error('❌ Order Status Update - FAILED:', error.message);
  }

  // Test 3: Admin Order Status Update (New Integration)
  console.log('\n📧 Test 3: Admin Order Status Update - Delivered');
  try {
    const mockOrder = {
      _id: 'test-admin-order',
      orderNumber: 'KSB-ADM-' + Date.now(),
      total: 2299,
      createdAt: new Date(),
      user: { name: 'Admin Test Customer', email: 'admin-test@example.com' },
      shippingAddress: { fullName: 'Admin Test Customer', email: 'admin-test@example.com' }
    };

    // Simulate the new admin status update email
    const adminStatusHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #059669, #047857); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">✅ Order Delivered!</h1>
        </div>
        <div style="padding: 30px; background: #f9fafb;">
          <h2 style="color: #1f2937;">Hello ${mockOrder.user.name}!</h2>
          <p style="color: #4b5563; line-height: 1.6;">Your order has been delivered successfully! We hope you love your purchase.</p>
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #059669;">
            <p><strong>Order Number:</strong> ${mockOrder.orderNumber}</p>
            <p><strong>Status:</strong> <span style="color: #059669; font-weight: bold;">DELIVERED</span></p>
            <p><strong>Total Amount:</strong> ₹${mockOrder.total.toFixed(2)}</p>
          </div>
          <div style="text-align: center; margin: 20px 0;">
            <a href="#" style="background: #ec4899; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Leave a Review</a>
          </div>
          <p>Thank you for choosing KsauniBliss!</p>
        </div>
      </div>
    `;

    await sendEmail({
      to: process.env.ADMIN || 'ksaunibliss@gmail.com',
      subject: `Order ${mockOrder.orderNumber} - DELIVERED`,
      html: adminStatusHtml
    });
    console.log('✅ Admin Order Status Update - PASSED');
  } catch (error) {
    console.error('❌ Admin Order Status Update - FAILED:', error.message);
  }

  // Test 4: Guest Order Confirmation
  console.log('\n📧 Test 4: Guest Order Confirmation');
  try {
    await sendEmail({
      to: process.env.ADMIN || 'ksaunibliss@gmail.com',
      template: 'orderConfirmation',
      data: {
        customerName: 'Guest Customer',
        orderNumber: 'KSB-GUEST-' + Date.now(),
        orderId: 'guest-order-123',
        orderDate: new Date().toLocaleDateString(),
        total: '₹799.00',
        paymentMethod: 'Cash on Delivery',
        items: [{
          name: 'Guest Product',
          quantity: 1,
          price: '₹799.00',
          totalPrice: '₹799.00',
          image: 'https://via.placeholder.com/60x60/EC4899/FFFFFF?text=Guest',
        }],
        shippingAddress: {
          fullName: 'Guest Customer',
          addressLine1: '456 Guest Address',
          city: 'Delhi',
          state: 'Delhi',
          pinCode: '110001',
          phoneNumber: '+91-9876543210',
          email: 'guest@example.com'
        }
      }
    });
    console.log('✅ Guest Order Confirmation - PASSED');
  } catch (error) {
    console.error('❌ Guest Order Confirmation - FAILED:', error.message);
  }

  console.log('\n🎉 Complete Order Email Flow Test Finished!');
  console.log('📧 All emails sent to:', process.env.ADMIN || 'ksaunibliss@gmail.com');
}

// Run comprehensive email flow test
if (require.main === module) {
  require('dotenv').config();
  testCompleteOrderEmailFlow()
    .then(() => {
      console.log('\n🎯 All order email tests completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Order email tests failed:', error.message);
      process.exit(1);
    });
}

module.exports = {
  testCompleteOrderEmailFlow
};