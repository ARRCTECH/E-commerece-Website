const nodemailer = require("nodemailer");

// Create transporter (same config for dev/prod, but use env vars)
const createTransport = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

// Email templates
const templates = {
  welcome: (data) => ({
    subject: "Welcome to Fashion Store!",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #ec4899, #be185d); padding: 40px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to Fashion Store!</h1>
        </div>
        <div style="padding: 40px; background: #f9fafb;">
          <h2 style="color: #1f2937; margin-bottom: 20px;">Hello ${data.name}!</h2>
          <p style="color: #4b5563; line-height: 1.6; margin-bottom: 20px;">
            Thank you for joining Fashion Store! We're excited to have you as part of our community.
          </p>
          <p style="color: #4b5563; line-height: 1.6; margin-bottom: 30px;">
            Your account has been created with the email: <strong>${data.email}</strong>
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL || "http://localhost:3000"}" 
               style="background: #ec4899; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">
              Start Shopping
            </a>
          </div>
          <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
            If you have any questions, feel free to contact our support team.
          </p>
        </div>
        <div style="background: #1f2937; padding: 20px; text-align: center;">
          <p style="color: #9ca3af; margin: 0; font-size: 14px;">
            © 2024 Fashion Store. All rights reserved.
          </p>
        </div>
      </div>
    `,
  }),

  passwordReset: (data) => ({
    subject: "Reset Your Password - Fashion Store",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #ec4899, #be185d); padding: 40px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Password Reset</h1>
        </div>
        <div style="padding: 40px; background: #f9fafb;">
          <h2 style="color: #1f2937; margin-bottom: 20px;">Hello ${data.name}!</h2>
          <p style="color: #4b5563; line-height: 1.6; margin-bottom: 20px;">
            We received a request to reset your password for your Fashion Store account.
          </p>
          <p style="color: #4b5563; line-height: 1.6; margin-bottom: 30px;">
            Click the button below to reset your password. This link will expire in 1 hour.
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${data.resetLink}" 
               style="background: #ec4899; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">
              Reset Password
            </a>
          </div>
          <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
            If you didn't request this password reset, please ignore this email.
          </p>
        </div>
        <div style="background: #1f2937; padding: 20px; text-align: center;">
          <p style="color: #9ca3af; margin: 0; font-size: 14px;">
            © 2024 Fashion Store. All rights reserved.
          </p>
        </div>
      </div>
    `,
  }),

  referralConfirmation: (data) => ({
    subject: `${data.referrer_name || "Someone"} invited you to Fashion Store!`,
    html: `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>You're invited!</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f7fb; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0" align="center" bgcolor="#f4f7fb">
        <tr>
            <td align="center" style="padding: 40px 20px;">
                <table width="100%" max-width="600" cellpadding="0" cellspacing="0" border="0" align="center" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); overflow: hidden;">
                    <tr>
                        <td align="center" bgcolor="#1E2A5E" style="padding: 40px 20px 30px;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">🎁 ${data.referrer_name} invited you!</h1>
                            <p style="margin: 12px 0 0; color: #d9e2ff; font-size: 16px;">Join now and get a special reward</p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 32px 30px 24px;">
                            <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.5; color: #2c3e50;">Hi ${data.friend_name || "there"},</p>
                            <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.5; color: #2c3e50;">
                                Your friend <strong>${data.referrer_name}</strong> thinks you'll love <strong>${data.product_name || "Fashion Store"}</strong>. 
                                They've shared their personal referral code so you can get started with an exclusive bonus.
                            </p>
                            <table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#F8FAFE" style="background-color: #F8FAFE; border-radius: 12px; border: 1px solid #E2E8F0; margin: 24px 0;">
                                <tr>
                                    <td align="center" style="padding: 20px;">
                                        <p style="margin: 0 0 8px; font-size: 14px; color: #4a5568; letter-spacing: 1px;">YOUR REFERRAL CODE</p>
                                        <p style="margin: 0; font-size: 32px; font-weight: 800; letter-spacing: 4px; color: #1E2A5E;">${data.referral_code}</p>
                                    </td>
                                </tr>
                            </table>
                            <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                <tr>
                                    <td align="center" style="padding: 8px 0 24px;">
                                        <a href="${data.signup_link}" style="display: inline-block; background-color: #3B82F6; color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; padding: 14px 32px; border-radius: 40px; box-shadow: 0 2px 6px rgba(0,0,0,0.1);">Claim Your Reward →</a>
                                    </td>
                                </tr>
                            </table>
                            <p style="margin: 0 0 8px; font-size: 14px; line-height: 1.4; color: #4a5568;">
                                <strong>How it works:</strong>
                            </p>
                            <ul style="margin: 0 0 20px; padding-left: 20px; font-size: 14px; line-height: 1.5; color: #4a5568;">
                                <li>Sign up using the button above</li>
                                <li>Enter code <strong>${data.referral_code}</strong> during registration</li>
                                <li>You both get <strong>${data.reward_description}</strong> (${data.reward_value})</li>
                            </ul>
                            <p style="margin: 0 0 8px; font-size: 14px; color: #718096;">
                                This offer expires on <strong>${data.expiry_date}</strong>.
                            </p>
                        </td>
                    </tr>
                    <tr>
                        <td bgcolor="#F9FAFB" style="padding: 20px 30px; border-top: 1px solid #E2E8F0;">
                            <p style="margin: 0 0 6px; font-size: 12px; color: #94a3b8; text-align: center;">
                                You received this email because ${data.referrer_name} invited you to join ${data.product_name || "Fashion Store"}.
                            </p>
                            <p style="margin: 0; font-size: 12px; color: #94a3b8; text-align: center;">
                                <a href="${data.unsubscribe_link}" style="color: #94a3b8; text-decoration: underline;">Unsubscribe</a> from future invites.
                            </p>
                            <p style="margin: 16px 0 0; font-size: 12px; color: #94a3b8; text-align: center;">
                                © ${data.year || new Date().getFullYear()} ${data.company_name || "Fashion Store"}. All rights reserved.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`,
  }),

  orderConfirmation: (data) => ({
    subject: `Order Confirmation - ${data.orderNumber || "Your Order"}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #ec4899, #be185d); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">✅ Order Confirmed!</h1>
          <p style="color: white; margin: 10px 0 0 0; opacity: 0.9; font-size: 16px;">Thank you for shopping with Fashion Store</p>
        </div>

        <!-- Main Content -->
        <div style="padding: 30px; background: #f9fafb;">
          <h2 style="color: #1f2937; margin-bottom: 20px;">Hello ${data.customerName || "Valued Customer"}!</h2>
          
          <p style="color: #4b5563; line-height: 1.6; margin-bottom: 25px; font-size: 16px;">
            Great news! Your order has been confirmed and is now being processed. We'll send you tracking information once your order ships.
          </p>

          <!-- Order Summary Card -->
          <div style="background: white; border-radius: 12px; border: 2px solid #ec4899; padding: 25px; margin: 25px 0; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <h3 style="color: #ec4899; margin-top: 0; margin-bottom: 20px; font-size: 20px; text-align: center;">📦 Order Details</h3>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px;">
              <div>
                <p style="margin: 8px 0; color: #374151;"><strong>Order Number:</strong><br><span style="color: #ec4899; font-weight: bold;">${data.orderNumber || "—"}</span></p>
                <p style="margin: 8px 0; color: #374151;"><strong>Order Date:</strong><br>${data.orderDate || new Date().toLocaleDateString()}</p>
              </div>
              <div>
                <p style="margin: 8px 0; color: #374151;"><strong>Total Amount:</strong><br><span style="color: #059669; font-weight: bold; font-size: 18px;">${data.total || "₹0.00"}</span></p>
                <p style="margin: 8px 0; color: #374151;"><strong>Payment Method:</strong><br>${data.paymentMethod || "—"}</p>
              </div>
            </div>

            ${data.trackingNumber ? `
              <div style="background: #f0f9ff; padding: 15px; border-radius: 8px; border-left: 4px solid #0369a1; margin: 15px 0;">
                <p style="margin: 0; color: #0369a1;"><strong>🚚 Tracking Number:</strong> ${data.trackingNumber}</p>
                ${data.estimatedDelivery ? `<p style="margin: 5px 0 0 0; color: #0369a1;"><strong>📅 Estimated Delivery:</strong> ${data.estimatedDelivery}</p>` : ""}
              </div>
            ` : `
              <div style="background: #fef2f2; padding: 15px; border-radius: 8px; border-left: 4px solid #dc2626; margin: 15px 0;">
                <p style="margin: 0; color: #dc2626;"><strong>📋 Status:</strong> Processing - Tracking information will be provided soon</p>
              </div>
            `}
          </div>

          ${data.items && data.items.length > 0 ? `
            <div style="background: white; border-radius: 12px; padding: 25px; margin: 25px 0; border: 1px solid #e5e7eb;">
              <h3 style="color: #1f2937; margin-top: 0; margin-bottom: 20px;">🛍️ Items Ordered</h3>
              ${data.items.map(item => `
                <div style="display: flex; align-items: center; padding: 15px 0; border-bottom: 1px solid #f3f4f6;">
                  ${item.image ? `<img src="${item.image}" alt="${item.name}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 8px; margin-right: 15px;">` : ""}
                  <div style="flex-grow: 1;">
                    <h4 style="margin: 0 0 5px 0; color: #1f2937; font-size: 16px;">${item.name || "Product"}</h4>
                    <p style="margin: 0; color: #6b7280; font-size: 14px;">Qty: ${item.quantity || 1} × ${item.price || "₹0"}</p>
                    ${item.size || item.color ? `<p style="margin: 5px 0 0 0; color: #9ca3af; font-size: 12px;">${item.size || ""} ${item.color || ""}</p>` : ""}
                  </div>
                  <div style="text-align: right;">
                    <p style="margin: 0; color: #059669; font-weight: bold;">${item.totalPrice || "₹0"}</p>
                  </div>
                </div>
              `).join("")}
            </div>
          ` : ""}

          <div style="background: white; border-radius: 12px; padding: 25px; margin: 25px 0; border: 1px solid #e5e7eb;">
            <h3 style="color: #1f2937; margin-top: 0; margin-bottom: 15px;">🏠 Shipping Address</h3>
            <div style="color: #4b5563; line-height: 1.6;">
              <p style="margin: 5px 0; font-weight: bold;">${data.shippingAddress?.fullName || ""}</p>
              <p style="margin: 5px 0;">${data.shippingAddress?.addressLine1 || ""}</p>
              ${data.shippingAddress?.addressLine2 ? `<p style="margin: 5px 0;">${data.shippingAddress.addressLine2}</p>` : ""}
              <p style="margin: 5px 0;">${data.shippingAddress?.city || ""}, ${data.shippingAddress?.state || ""} - ${data.shippingAddress?.pinCode || ""}</p>
              ${data.shippingAddress?.phoneNumber ? `<p style="margin: 5px 0;">📞 ${data.shippingAddress.phoneNumber}</p>` : ""}
              ${data.shippingAddress?.email ? `<p style="margin: 5px 0;">✉️ ${data.shippingAddress.email}</p>` : ""}
            </div>
          </div>

          <div style="background: linear-gradient(135deg, #f0f9ff, #e0f2fe); padding: 20px; border-radius: 12px; margin: 25px 0; border-left: 4px solid #0369a1;">
            <h3 style="color: #0369a1; margin-top: 0; margin-bottom: 15px;">🎯 What's Next?</h3>
            <ul style="color: #1e40af; margin: 0; padding-left: 20px; line-height: 1.8;">
              <li>We'll process your order within 24 hours</li>
              <li>You'll receive tracking information via email once shipped</li>
              <li>Expected delivery: ${data.estimatedDelivery || "3-5 business days"}</li>
            </ul>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL || "http://localhost:3000"}/orders/${data.orderId}" 
               style="background: #ec4899; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin-right: 15px; display: inline-block;">
              📋 Track Order
            </a>
            <a href="${process.env.FRONTEND_URL || "http://localhost:3000"}/shop" 
               style="background: white; color: #ec4899; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; border: 2px solid #ec4899; display: inline-block;">
              🛍️ Continue Shopping
            </a>
          </div>

          <div style="background: #fefce8; padding: 20px; border-radius: 8px; border-left: 4px solid #eab308; margin: 25px 0;">
            <p style="margin: 0; color: #92400e; font-size: 14px;">
              <strong>Need Help?</strong> Contact our customer support team at 
              <a href="mailto:support@fashionstore.com" style="color: #92400e; text-decoration: underline;">support@fashionstore.com</a>
              or call us at <strong>+91-XXXXXXXXXX</strong>
            </p>
          </div>

          <p style="color: #6b7280; font-size: 16px; text-align: center; margin-top: 30px;">
            Thank you for choosing <strong style="color: #ec4899;">Fashion Store</strong>! ❤️
          </p>
        </div>

        <div style="background: #1f2937; padding: 25px; text-align: center;">
          <p style="color: #9ca3af; margin: 0 0 10px 0; font-size: 14px;">
            © 2024 Fashion Store. All rights reserved.
          </p>
          <p style="color: #6b7280; margin: 0; font-size: 12px;">
            You received this email because you placed an order with us. If you have any questions, please contact support.
          </p>
        </div>
      </div>
    `,
  }),
};

// Send email function
const sendEmail = async ({ to, subject, template, data, html, text }) => {
  try {
    const transporter = createTransport();

    let emailContent = {};

    if (template && templates[template]) {
      const templateContent = templates[template](data);
      emailContent = {
        subject: templateContent.subject,
        html: templateContent.html,
      };
    } else {
      emailContent = {
        subject,
        html,
        text,
      };
    }

    const mailOptions = {
      from: `"Fashion Store" <${process.env.SMTP_USER || "orders@fashionstore.com"}>`,
      to,
      ...emailContent,
    };

    const result = await transporter.sendMail(mailOptions);

    // Log test URL only in development and if using Ethereal
    if (process.env.NODE_ENV === "development" && result.messageId && nodemailer.getTestMessageUrl) {
      console.log("Preview URL:", nodemailer.getTestMessageUrl(result));
    }

    return result;
  } catch (error) {
    console.error("Email sending error:", error);
    throw error;
  }
};

module.exports = {
  sendEmail,
};