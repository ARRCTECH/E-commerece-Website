const nodemailer = require("nodemailer");

// Create transporter (updated for Hostinger SMTP)
const createTransport = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT, 10),
    secure: process.env.SMTP_SECURE === 'true', // important for port 465
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

// Email templates (unchanged)
const templates = {
  welcome: (data) => ({
    subject: "Welcome to Factory Sale!",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #ec4899, #be185d); padding: 40px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to Factory Sale!</h1>
        </div>
        <div style="padding: 40px; background: #f9fafb;">
          <h2 style="color: #1f2937; margin-bottom: 20px;">Hello ${data.name}!</h2>
          <p style="color: #4b5563; line-height: 1.6; margin-bottom: 20px;">
            Thank you for joining Factory Sale! We're excited to have you as part of our community.
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
            © 2024 Factory Sale. All rights reserved.
          </p>
        </div>
      </div>
    `,
  }),

  passwordReset: (data) => ({
    subject: "Reset Your Password - Factory Sale",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #ec4899, #be185d); padding: 40px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Password Reset</h1>
        </div>
        <div style="padding: 40px; background: #f9fafb;">
          <h2 style="color: #1f2937; margin-bottom: 20px;">Hello ${data.name}!</h2>
          <p style="color: #4b5563; line-height: 1.6; margin-bottom: 20px;">
            We received a request to reset your password for your Factory Sale account.
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
            © 2024 Factory Sale. All rights reserved.
          </p>
        </div>
      </div>
    `,
  }),

  // Fixed Referrer Congratulation Email Template
  getReferrerCongratulationEmail: (data) => {
    const discountDisplay = data.discountType === 'percentage' 
      ? `${data.discountValue}% OFF` 
      : `₹${data.discountValue} OFF`;
    const expiryFormatted = new Date(data.expiryDate).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    return {
      subject: `🎉 You earned ${discountDisplay} on your next order!`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Congratulations! You've Earned a Referral Reward</title>
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              line-height: 1.6;
              color: #333;
              margin: 0;
              padding: 0;
              background-color: #f4f4f4;
            }
            .container {
              max-width: 600px;
              margin: 20px auto;
              padding: 0;
              background-color: #ffffff;
              border-radius: 10px;
              overflow: hidden;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            .header {
              background: linear-gradient(135deg, #dc3545 0%, #c82333 100%);
              color: white;
              padding: 30px 20px;
              text-align: center;
            }
            .header h1 {
              margin: 0;
              font-size: 28px;
            }
            .content {
              padding: 30px;
            }
            .discount-badge {
              background: linear-gradient(135deg, #dc3545 0%, #bd2130 100%);
              color: white;
              text-align: center;
              padding: 20px;
              border-radius: 10px;
              margin: 20px 0;
            }
            .discount-badge h2 {
              margin: 0;
              font-size: 36px;
            }
            .discount-badge p {
              margin: 10px 0 0;
              opacity: 0.9;
            }
            .expiry-box {
              background-color: #fff5f5;
              border: 1px solid #dc3545;
              border-radius: 5px;
              padding: 10px;
              margin-top: 15px;
              text-align: center;
            }
            .expiry-text {
              color: #dc3545;
              font-weight: bold;
            }
            .button {
              display: inline-block;
              padding: 12px 30px;
              background: linear-gradient(135deg, #dc3545 0%, #c82333 100%);
              color: white;
              text-decoration: none;
              border-radius: 5px;
              margin: 20px 0;
              font-weight: bold;
            }
            .footer {
              background-color: #f8f9fa;
              padding: 20px;
              text-align: center;
              font-size: 12px;
              color: #666;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Congratulations! 🎉</h1>
              <p>Someone joined using your referral link</p>
            </div>
            <div class="content">
              <p><strong>${data.referredUserName}</strong> has successfully registered using your referral link.</p>
              <div class="discount-badge">
                <h2>${discountDisplay}</h2>
                <p>on your next purchase</p>
              </div>
              <div class="expiry-box">
                <p style="margin: 0;">
                  ⏰ <strong class="expiry-text">Make purchase till ${expiryFormatted}</strong> ⏰
                </p>
              </div>
              <center>
                <a href="${process.env.FRONTEND_URL || 'https://yourstore.com'}/shop" class="button">
                  🛍️ Shop Now & Save
                </a>
              </center>
              <p style="margin-top: 20px; font-size: 14px; color: #666;">
                The discount will be automatically applied at checkout. Keep referring friends to earn more rewards!
              </p>
            </div>
            <div class="footer">
              <p>Thank you for being a valued customer!</p>
            </div>
          </div>
        </body>
        </html>
      `
    };
  },

  orderConfirmation: (data) => ({
    subject: `Order Confirmation - ${data.orderNumber || "Your Order"}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
        <div style="background: linear-gradient(135deg, #ec4899, #be185d); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">✅ Order Confirmed!</h1>
          <p style="color: white; margin: 10px 0 0 0; opacity: 0.9; font-size: 16px;">Thank you for shopping with Factory Sale</p>
        </div>
        <div style="padding: 30px; background: #f9fafb;">
          <h2 style="color: #1f2937; margin-bottom: 20px;">Hello ${data.customerName || "Valued Customer"}!</h2>
          <p style="color: #4b5563; line-height: 1.6; margin-bottom: 25px; font-size: 16px;">
            Great news! Your order has been confirmed and is now being processed. We'll send you tracking information once your order ships.
          </p>
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
              <a href="mailto:
info@factorysaleusa.com" style="color: #92400e; text-decoration: underline;">
info@factorysaleusa.com</a>
              or call us at <strong>+91 8830155383</strong>
            </p>
          </div>
          <p style="color: #6b7280; font-size: 16px; text-align: center; margin-top: 30px;">
            Thank you for choosing <strong style="color: #ec4899;">Fashion Store</strong>! ❤️
          </p>
        </div>
        <div style="background: #1f2937; padding: 25px; text-align: center;">
          <p style="color: #9ca3af; margin: 0 0 10px 0; font-size: 14px;">
            © 2024 Factory Sale. All rights reserved.
          </p>
          <p style="color: #6b7280; margin: 0; font-size: 12px;">
            You received this email because you placed an order with us. If you have any questions, please contact support.
          </p>
        </div>
      </div>
    `,
  }),
};

// Send email function (updated from address)
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
      from: `"${process.env.FROM_NAME || 'Factory Sale'}" <${process.env.SMTP_USER}>`,
      to,
      ...emailContent,
    };

    const result = await transporter.sendMail(mailOptions);

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