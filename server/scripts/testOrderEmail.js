const { sendEmail } = require('../utils/emailService');

// Test order confirmation email functionality
async function testOrderConfirmationEmail() {
  console.log('🧪 Testing Order Confirmation Email...');

  // Mock order data for testing
  const mockEmailData = {
    customerName: 'Test Customer',
    orderNumber: 'TEST-ORD-' + Date.now(),
    orderId: 'test-order-id-123',
    orderDate: new Date().toLocaleDateString(),
    total: '₹1,299.00',
    paymentMethod: 'Online Payment (Test)',
    trackingNumber: 'TEST-TRACK-123456',
    estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString(), // 7 days from now
    items: [
      {
        name: 'Test Product 1',
        quantity: 2,
        price: '₹499.00',
        totalPrice: '₹998.00',
        image: 'https://via.placeholder.com/60x60',
        size: 'M',
        color: 'Blue'
      },
      {
        name: 'Test Product 2',
        quantity: 1,
        price: '₹301.00',
        totalPrice: '₹301.00',
        image: 'https://via.placeholder.com/60x60',
        size: 'L',
        color: 'Red'
      }
    ],
    shippingAddress: {
      fullName: 'John Doe',
      addressLine1: '123 Main Street',
      addressLine2: 'Apartment 4B',
      city: 'Mumbai',
      state: 'Maharashtra',
      pinCode: '400001',
      phoneNumber: '+91-7020542266',
      email: 'knikam2037@gmail.com'
    }
  };

  try {
    // Test sending order confirmation email
    await sendEmail({
      to: process.env.FALLBACK_TEST_EMAIL || 'Factory Sale@gmail.com', // Fallback to admin email
      template: 'orderConfirmation',
      data: mockEmailData
    });

    console.log('✅ Order confirmation email test sent successfully!');
    console.log('📧 Email sent to:', process.env.FALLBACK_TEST_EMAIL || 'Factory Sale@gmail.com');
    console.log('📦 Test Order Number:', mockEmailData.orderNumber);
    
  } catch (error) {
    console.error('❌ Order confirmation email test failed:', error.message);
    console.error('🔧 Please check your email configuration in .env file:');
    console.error('   - SMTP_HOST:', process.env.SMTP_HOST);
    console.error('   - SMTP_PORT:', process.env.SMTP_PORT);
    console.error('   - SMTP_USER:', process.env.SMTP_USER);
    console.error('   - SMTP_PASS:', process.env.SMTP_PASS ? '✓ Set' : '❌ Not Set');
  }
}

// Test other email templates as well
async function testAllEmailTemplates() {
  console.log('\n🧪 Testing All Email Templates...\n');

  // Test Welcome Email
  try {
    await sendEmail({
      to: process.env.FALLBACK_TEST_EMAIL || 'Factory Sale@gmail.com',
      template: 'welcome',
      data: {
        name: 'Test User',
        email: 'knikam2037@gmail.com'
      }
    });
    console.log('✅ Welcome email template test passed');
  } catch (error) {
    console.error('❌ Welcome email template test failed:', error.message);
  }

  // Test Password Reset Email
  try {
    await sendEmail({
      to: process.env.FALLBACK_TEST_EMAIL || 'Factory Sale@gmail.com',
      template: 'passwordReset',
      data: {
        name: 'Test User',
        resetLink: 'https://Factory Sale.com/reset-password?token=test-token'
      }
    });
    console.log('✅ Password reset email template test passed');
  } catch (error) {
    console.error('❌ Password reset email template test failed:', error.message);
  }

  // Test Order Confirmation Email
  await testOrderConfirmationEmail();
}

// Run the tests if this script is executed directly
if (require.main === module) {
  require('dotenv').config();
  testAllEmailTemplates()
    .then(() => {
      console.log('\n🎉 Email testing completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Email testing failed:', error.message);
      process.exit(1);
    });
}

module.exports = {
  testOrderConfirmationEmail,
  testAllEmailTemplates
};