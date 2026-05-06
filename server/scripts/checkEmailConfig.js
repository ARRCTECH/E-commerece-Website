require('dotenv').config();
console.log('🔧 Email Configuration Check\n');
// Check all required environment variables
const requiredEnvVars = {
  'SMTP_HOST': process.env.SMTP_HOST,
  'SMTP_PORT': process.env.SMTP_PORT,
  'SMTP_USER': process.env.SMTP_USER,
  'SMTP_PASS': process.env.SMTP_PASS ? '***HIDDEN***' : undefined,
  'EMAIL_FROM': process.env.EMAIL_FROM,
  'ADMIN': process.env.ADMIN,
  'FROM_NAME': process.env.FROM_NAME,
  'SMTP_SECURE': process.env.SMTP_SECURE
};
console.log('📋 Environment Variables:');
Object.entries(requiredEnvVars).forEach(([key, value]) => {
  const status = value ? '✅' : '❌';
  console.log(`   ${key}: ${status} ${value || 'NOT SET'}`);
});
console.log('\n🧪 Testing Email Service Import...');
try {
  const { sendEmail } = require('../utils/emailService');
  console.log('✅ Email service imported successfully');
  console.log('\n📧 Testing Simple Email Send...');
  sendEmail({
    to: process.env.ADMIN || 'ksaunibliss@gmail.com',
    subject: 'Email Configuration Test - ' + new Date().toLocaleString(),
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #059669;">✅ Email Configuration Test Successful</h2>
        <p>This is a test email to verify your email configuration is working correctly.</p>
        <div style="background: #f0f9ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #0369a1; margin-top: 0;">Configuration Details:</h3>
          <p><strong>SMTP Host:</strong> ${process.env.SMTP_HOST}</p>
          <p><strong>SMTP Port:</strong> ${process.env.SMTP_PORT}</p>
          <p><strong>SMTP User:</strong> ${process.env.SMTP_USER}</p>
          <p><strong>From Name:</strong> ${process.env.FROM_NAME}</p>
        </div>
        <p style="color: #6b7280; font-size: 14px;">
          Test completed at: ${new Date().toLocaleString()}
        </p>
      </div>
    `
  }).then(() => {
    console.log('✅ Simple email test sent successfully!');
    console.log('📧 Email sent to:', process.env.ADMIN || 'ksaunibliss@gmail.com');
  }).catch((error) => {
    console.error('❌ Simple email test failed:', error.message);
  });
} catch (error) {
  console.error('❌ Failed to import email service:', error.message);
}