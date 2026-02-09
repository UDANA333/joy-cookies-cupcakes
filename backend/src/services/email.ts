import nodemailer from 'nodemailer';

// Gmail SMTP configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

const BUSINESS_EMAIL = process.env.GMAIL_USER || 'joycookiescupcakes@gmail.com';
const FROM_NAME = 'Joy Cookies & Cupcakes';

interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  category: string;
}

interface OrderEmailData {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  pickupDate: string;
  pickupTime: string;
  items: OrderItem[];
  total: number;
  depositAmount?: number;
  remainingBalance?: number;
  paymentMethod?: string;
  transactionId?: string;
}

interface ContactEmailData {
  name: string;
  email: string;
  message: string;
}

// Format date for display
function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

// Generate items HTML for email
function generateItemsHtml(items: OrderItem[]): string {
  return items
    .map(
      (item) => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #f0e6e6;">${item.name}</td>
        <td style="padding: 12px; border-bottom: 1px solid #f0e6e6; text-align: center;">${item.quantity}</td>
        <td style="padding: 12px; border-bottom: 1px solid #f0e6e6; text-align: right;">$${(item.price * item.quantity).toFixed(2)}</td>
      </tr>
    `
    )
    .join('');
}

// Send order confirmation to customer
export async function sendOrderConfirmation(data: OrderEmailData) {
  const itemsHtml = generateItemsHtml(data.items);

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #fdf8f8;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <!-- Header -->
        <div style="text-align: center; padding: 30px 20px; background: linear-gradient(135deg, #e8a4a4 0%, #f5c6c6 100%); border-radius: 16px 16px 0 0;">
          <h1 style="margin: 0; color: #4a3333; font-size: 28px;">🍪 Joy Cookies & Cupcakes</h1>
          <p style="margin: 10px 0 0; color: #6b5555; font-size: 14px;">Fresh-baked treats made with love</p>
        </div>
        
        <!-- Content -->
        <div style="background: white; padding: 30px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
          <h2 style="color: #4a3333; margin: 0 0 20px; font-size: 24px;">Order Confirmed! 🎉</h2>
          
          <p style="color: #6b5555; font-size: 16px; line-height: 1.6;">
            Hi ${data.customerName || 'there'}! Thank you for your order. Your sweet treats are being prepared with love!
          </p>
          
          <!-- Order Number -->
          <div style="background: #fff5f5; border: 2px dashed #e8a4a4; border-radius: 12px; padding: 20px; margin: 20px 0; text-align: center;">
            <p style="margin: 0 0 5px; color: #6b5555; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Order Number</p>
            <p style="margin: 0; color: #4a3333; font-size: 24px; font-weight: bold;">${data.orderNumber}</p>
          </div>
          
          <!-- Pickup Info -->
          <div style="background: #f8f4f0; border-radius: 12px; padding: 20px; margin: 20px 0;">
            <h3 style="margin: 0 0 15px; color: #4a3333; font-size: 18px;">📍 Pickup Details</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #6b5555;">Date:</td>
                <td style="padding: 8px 0; color: #4a3333; font-weight: 500;">${formatDate(data.pickupDate)}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b5555;">Time:</td>
                <td style="padding: 8px 0; color: #4a3333; font-weight: 500;">${data.pickupTime}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b5555;">Location:</td>
                <td style="padding: 8px 0; color: #4a3333; font-weight: 500;">Joy Cookies & Cupcakes</td>
              </tr>
            </table>
            <a href="https://maps.app.goo.gl/z3BufPyu399hN2Dw9" style="display: inline-block; margin-top: 15px; color: #e8a4a4; text-decoration: none; font-weight: 500;">
              📍 Get Directions →
            </a>
          </div>
          
          <!-- Order Items -->
          <h3 style="margin: 25px 0 15px; color: #4a3333; font-size: 18px;">🛒 Your Order</h3>
          <table style="width: 100%; border-collapse: collapse; background: #fafafa; border-radius: 8px; overflow: hidden;">
            <thead>
              <tr style="background: #f0e6e6;">
                <th style="padding: 12px; text-align: left; color: #4a3333; font-weight: 600;">Item</th>
                <th style="padding: 12px; text-align: center; color: #4a3333; font-weight: 600;">Qty</th>
                <th style="padding: 12px; text-align: right; color: #4a3333; font-weight: 600;">Price</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
            <tfoot>
              <tr style="background: #f0e6e6;">
                <td colspan="2" style="padding: 15px; text-align: right; font-weight: bold; color: #4a3333;">Total:</td>
                <td style="padding: 15px; text-align: right; font-weight: bold; color: #e8a4a4; font-size: 18px;">$${data.total.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>
          
          <!-- Payment Summary -->
          ${data.depositAmount && data.depositAmount > 0 ? `
          <div style="background: #e8f5e9; border-radius: 12px; padding: 20px; margin: 25px 0;">
            <h3 style="margin: 0 0 15px; color: #2e7d32; font-size: 18px;">✅ Payment Summary</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #6b5555;">Deposit Paid (${data.paymentMethod || 'Online'}):</td>
                <td style="padding: 8px 0; color: #2e7d32; font-weight: bold; text-align: right;">$${data.depositAmount.toFixed(2)}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b5555;">Remaining Balance Due at Pickup:</td>
                <td style="padding: 8px 0; color: #e65100; font-weight: bold; text-align: right;">$${(data.remainingBalance || 0).toFixed(2)}</td>
              </tr>
            </table>
          </div>
          
          <!-- Remaining Balance Payment Options -->
          <div style="background: #fff3e0; border-radius: 12px; padding: 20px; margin: 25px 0;">
            <h3 style="margin: 0 0 15px; color: #e65100; font-size: 18px;">💵 Pay Remaining Balance ($${(data.remainingBalance || 0).toFixed(2)})</h3>
            <p style="margin: 0 0 15px; color: #6b5555; font-size: 14px;">
              You can pay the remaining balance online or at pickup:
            </p>
            <div style="margin-bottom: 10px;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/pay-balance?order=${data.orderNumber}" style="display: inline-block; background: #008CFF; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 500; margin-bottom: 8px;">
                💳 Pay Now Online (Venmo/PayPal)
              </a>
            </div>
            <p style="margin: 10px 0 0; color: #6b5555; font-size: 13px;">
              💵 Cash is also accepted at pickup
            </p>
          </div>
          ` : `
          <!-- Payment Reminder -->
          <div style="background: #fff5f5; border-left: 4px solid #e8a4a4; border-radius: 0 8px 8px 0; padding: 15px 20px; margin: 25px 0;">
            <p style="margin: 0; color: #6b5555; font-size: 14px;">
              <strong>💳 Payment:</strong> Please complete your payment via Venmo when you arrive for pickup.
            </p>
          </div>
          `}
          
          <!-- Footer Message -->
          <p style="color: #6b5555; font-size: 14px; line-height: 1.6; margin: 25px 0 0;">
            If you have any questions, feel free to reply to this email or contact us at ${BUSINESS_EMAIL}
          </p>
          
          <p style="color: #e8a4a4; font-size: 16px; margin: 25px 0 0; text-align: center;">
            Thank you for choosing Joy Cookies & Cupcakes! 💕
          </p>
        </div>
        
        <!-- Footer -->
        <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
          <p style="margin: 0;">© ${new Date().getFullYear()} Joy Cookies & Cupcakes. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    // Check if Gmail credentials are configured
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
      console.log('📧 [DEV] Gmail not configured. Would send order confirmation to:', data.customerEmail);
      console.log('   Order:', data.orderNumber);
      return { success: true, dev: true };
    }

    const result = await transporter.sendMail({
      from: `"${FROM_NAME}" <${BUSINESS_EMAIL}>`,
      to: data.customerEmail,
      subject: `Order Confirmed! #${data.orderNumber} - Joy Cookies & Cupcakes`,
      html,
    });

    console.log('📧 Order confirmation sent to:', data.customerEmail);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('❌ Failed to send order confirmation:', error);
    return { success: false, error };
  }
}

// Send order notification to business owner
export async function sendOrderNotification(data: OrderEmailData) {
  const itemsList = data.items
    .map((item) => `• ${item.name} x${item.quantity} - $${(item.price * item.quantity).toFixed(2)}`)
    .join('\n');

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
    </head>
    <body style="margin: 0; padding: 20px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
      <div style="max-width: 500px; margin: 0 auto; background: white; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); overflow: hidden;">
        <div style="background: #e8a4a4; padding: 20px; text-align: center;">
          <h1 style="margin: 0; color: white; font-size: 20px;">🔔 New Order Received!</h1>
        </div>
        <div style="padding: 25px;">
          <p style="margin: 0 0 5px; color: #666; font-size: 12px;">ORDER NUMBER</p>
          <p style="margin: 0 0 20px; color: #333; font-size: 24px; font-weight: bold;">${data.orderNumber}</p>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          
          <h3 style="margin: 0 0 10px; color: #333;">Customer</h3>
          <p style="margin: 0; color: #666;">
            ${data.customerName || 'Not provided'}<br>
            📧 ${data.customerEmail}<br>
            ${data.customerPhone ? `📱 ${data.customerPhone}` : ''}
          </p>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          
          <h3 style="margin: 0 0 10px; color: #333;">Pickup</h3>
          <p style="margin: 0; color: #666;">
            📅 ${formatDate(data.pickupDate)}<br>
            ⏰ ${data.pickupTime}
          </p>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          
          <h3 style="margin: 0 0 10px; color: #333;">Items</h3>
          <pre style="margin: 0; color: #666; font-family: inherit; white-space: pre-wrap;">${itemsList}</pre>
          
          <div style="background: #f8f8f8; border-radius: 8px; padding: 15px; margin-top: 20px; text-align: center;">
            <p style="margin: 0; color: #333; font-size: 20px; font-weight: bold;">Total: $${data.total.toFixed(2)}</p>
          </div>
          
          ${data.depositAmount && data.depositAmount > 0 ? `
          <div style="background: #e8f5e9; border-radius: 8px; padding: 15px; margin-top: 15px;">
            <p style="margin: 0 0 8px; color: #2e7d32; font-weight: bold;">💳 Payment Status</p>
            <p style="margin: 0; color: #666; font-size: 14px;">
              ✅ Deposit Paid: <strong>$${data.depositAmount.toFixed(2)}</strong> via ${data.paymentMethod || 'Online'}<br>
              💵 Balance Due at Pickup: <strong style="color: #e65100;">$${(data.remainingBalance || 0).toFixed(2)}</strong>
              ${data.transactionId ? `<br>Transaction ID: ${data.transactionId}` : ''}
            </p>
          </div>
          ` : ''}
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
      console.log('📧 [DEV] Gmail not configured. Would send order notification to:', BUSINESS_EMAIL);
      return { success: true, dev: true };
    }

    const result = await transporter.sendMail({
      from: `"${FROM_NAME}" <${BUSINESS_EMAIL}>`,
      to: BUSINESS_EMAIL,
      replyTo: data.customerEmail,
      subject: `🔔 New Order #${data.orderNumber} - $${data.total.toFixed(2)}`,
      html,
    });

    console.log('📧 Order notification sent to:', BUSINESS_EMAIL);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('❌ Failed to send order notification:', error);
    return { success: false, error };
  }
}

// Send contact form message to business
export async function sendContactNotification(data: ContactEmailData) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
    </head>
    <body style="margin: 0; padding: 20px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
      <div style="max-width: 500px; margin: 0 auto; background: white; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); overflow: hidden;">
        <div style="background: #7ec8e3; padding: 20px; text-align: center;">
          <h1 style="margin: 0; color: white; font-size: 20px;">💬 New Contact Message</h1>
        </div>
        <div style="padding: 25px;">
          <h3 style="margin: 0 0 10px; color: #333;">From</h3>
          <p style="margin: 0 0 20px; color: #666;">
            ${data.name}<br>
            📧 <a href="mailto:${data.email}" style="color: #7ec8e3;">${data.email}</a>
          </p>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          
          <h3 style="margin: 0 0 10px; color: #333;">Message</h3>
          <p style="margin: 0; color: #666; line-height: 1.6; white-space: pre-wrap;">${data.message}</p>
          
          <div style="margin-top: 25px;">
            <a href="mailto:${data.email}?subject=Re: Your message to Joy Cookies %26 Cupcakes" 
               style="display: inline-block; background: #7ec8e3; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 500;">
              Reply to ${data.name}
            </a>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
      console.log('📧 [DEV] Gmail not configured. Would send contact notification to:', BUSINESS_EMAIL);
      return { success: true, dev: true };
    }

    const result = await transporter.sendMail({
      from: `"${FROM_NAME}" <${BUSINESS_EMAIL}>`,
      to: BUSINESS_EMAIL,
      replyTo: data.email,
      subject: `💬 New message from ${data.name}`,
      html,
    });

    console.log('📧 Contact notification sent to:', BUSINESS_EMAIL);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('❌ Failed to send contact notification:', error);
    return { success: false, error };
  }
}

// Reply to a contact message
interface ReplyEmailData {
  customerName: string;
  customerEmail: string;
  originalMessage: string;
  replyMessage: string;
}

export async function sendReplyEmail(data: ReplyEmailData) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #fdf8f8;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <!-- Header -->
        <div style="text-align: center; padding: 30px 20px; background: linear-gradient(135deg, #e8a4a4 0%, #f5c6c6 100%); border-radius: 16px 16px 0 0;">
          <h1 style="margin: 0; color: #4a3333; font-size: 28px;">🍪 Joy Cookies & Cupcakes</h1>
          <p style="margin: 10px 0 0; color: #6b5555; font-size: 14px;">Fresh-baked treats made with love</p>
        </div>
        
        <!-- Content -->
        <div style="background: white; padding: 30px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
          <p style="color: #6b5555; font-size: 16px; line-height: 1.6;">
            Hi ${data.customerName || 'there'}!
          </p>
          
          <p style="color: #6b5555; font-size: 16px; line-height: 1.6;">
            Thank you for reaching out to us. Here's our response to your message:
          </p>
          
          <!-- Reply Message -->
          <div style="background: #f8f4f0; border-radius: 12px; padding: 20px; margin: 20px 0;">
            <p style="margin: 0; color: #4a3333; font-size: 16px; line-height: 1.8; white-space: pre-wrap;">${data.replyMessage}</p>
          </div>
          
          <!-- Original Message -->
          <div style="background: #f5f5f5; border-left: 4px solid #e8a4a4; border-radius: 0 8px 8px 0; padding: 15px 20px; margin: 25px 0;">
            <p style="margin: 0 0 10px; color: #999; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Your original message:</p>
            <p style="margin: 0; color: #666; font-size: 14px; line-height: 1.6; font-style: italic; white-space: pre-wrap;">${data.originalMessage}</p>
          </div>
          
          <!-- Footer Message -->
          <p style="color: #6b5555; font-size: 14px; line-height: 1.6; margin: 25px 0 0;">
            If you have any more questions, feel free to reply to this email!
          </p>
          
          <p style="color: #e8a4a4; font-size: 16px; margin: 25px 0 0; text-align: center;">
            Thank you for choosing Joy Cookies & Cupcakes! 💕
          </p>
        </div>
        
        <!-- Footer -->
        <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
          <p style="margin: 0;">© ${new Date().getFullYear()} Joy Cookies & Cupcakes. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
      console.log('📧 [DEV] Gmail not configured. Would send reply to:', data.customerEmail);
      return { success: true, dev: true };
    }

    const result = await transporter.sendMail({
      from: `"${FROM_NAME}" <${BUSINESS_EMAIL}>`,
      to: data.customerEmail,
      subject: `Re: Your message to Joy Cookies & Cupcakes`,
      html,
    });

    console.log('📧 Reply sent to:', data.customerEmail);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('❌ Failed to send reply:', error);
    return { success: false, error };
  }
}

// Send "Ready for Pickup" notification to customer
export async function sendReadyForPickupNotification(data: {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  pickupDate: string;
  pickupTime: string;
  total: number;
  remainingBalance?: number;
}) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #fdf8f8;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <!-- Header -->
        <div style="text-align: center; padding: 30px 20px; background: linear-gradient(135deg, #4CAF50 0%, #81C784 100%); border-radius: 16px 16px 0 0;">
          <h1 style="margin: 0; color: white; font-size: 28px;">🍪 Joy Cookies & Cupcakes</h1>
          <p style="margin: 10px 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">Your order is ready!</p>
        </div>
        
        <!-- Content -->
        <div style="background: white; padding: 30px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
          <h2 style="color: #4CAF50; margin: 0 0 20px; font-size: 24px; text-align: center;">🎉 Ready for Pickup!</h2>
          
          <p style="color: #6b5555; font-size: 16px; line-height: 1.6; text-align: center;">
            Hi ${data.customerName || 'there'}! Great news - your sweet treats are ready and waiting for you!
          </p>
          
          <!-- Order Number -->
          <div style="background: #e8f5e9; border: 2px dashed #4CAF50; border-radius: 12px; padding: 20px; margin: 20px 0; text-align: center;">
            <p style="margin: 0 0 5px; color: #6b5555; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Order Number</p>
            <p style="margin: 0; color: #2e7d32; font-size: 24px; font-weight: bold;">${data.orderNumber}</p>
          </div>
          
          <!-- Pickup Info -->
          <div style="background: #f8f4f0; border-radius: 12px; padding: 20px; margin: 20px 0;">
            <h3 style="margin: 0 0 15px; color: #4a3333; font-size: 18px;">📍 Pickup Details</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #6b5555;">Date:</td>
                <td style="padding: 8px 0; color: #4a3333; font-weight: 500;">${formatDate(data.pickupDate)}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b5555;">Time:</td>
                <td style="padding: 8px 0; color: #4a3333; font-weight: 500;">${data.pickupTime}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b5555;">Location:</td>
                <td style="padding: 8px 0; color: #4a3333; font-weight: 500;">Joy Cookies & Cupcakes</td>
              </tr>
            </table>
            <a href="https://maps.app.goo.gl/z3BufPyu399hN2Dw9" style="display: inline-block; margin-top: 15px; color: #4CAF50; text-decoration: none; font-weight: 500;">
              📍 Get Directions →
            </a>
          </div>
          
          ${data.remainingBalance && data.remainingBalance > 0 ? `
          <!-- Remaining Balance Reminder -->
          <div style="background: #fff3e0; border-radius: 12px; padding: 20px; margin: 20px 0; text-align: center;">
            <h3 style="margin: 0 0 10px; color: #e65100; font-size: 18px;">💰 Balance Due</h3>
            <p style="margin: 0; color: #4a3333; font-size: 28px; font-weight: bold;">$${data.remainingBalance.toFixed(2)}</p>
            <p style="margin: 15px 0; color: #6b5555; font-size: 14px;">
              Pay online now or bring cash to pickup:
            </p>
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/pay-balance?order=${data.orderNumber}" style="display: inline-block; background: linear-gradient(135deg, #008CFF 0%, #0056b3 100%); color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              💳 Pay Now Online
            </a>
            <p style="margin: 15px 0 0; color: #6b5555; font-size: 13px;">
              💵 Cash is also accepted at pickup
            </p>
          </div>
          ` : ''}
          
          <div style="background: #e8f5e9; border-radius: 12px; padding: 20px; margin: 20px 0; text-align: center;">
            <p style="margin: 0; color: #2e7d32; font-size: 18px; font-weight: 500;">
              ✨ We can't wait to see you!
            </p>
          </div>
          
          <p style="color: #6b5555; font-size: 14px; line-height: 1.6; margin: 25px 0 0;">
            If you have any questions, feel free to reply to this email or contact us at ${BUSINESS_EMAIL}
          </p>
          
          <p style="color: #e8a4a4; font-size: 16px; margin: 25px 0 0; text-align: center;">
            Thank you for choosing Joy Cookies & Cupcakes! 💕
          </p>
        </div>
        
        <!-- Footer -->
        <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
          <p style="margin: 0;">© ${new Date().getFullYear()} Joy Cookies & Cupcakes. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
      console.log('📧 [DEV] Gmail not configured. Would send "Ready for Pickup" email to:', data.customerEmail);
      return { success: true, dev: true };
    }

    const result = await transporter.sendMail({
      from: `"${FROM_NAME}" <${BUSINESS_EMAIL}>`,
      to: data.customerEmail,
      subject: `🎉 Your order ${data.orderNumber} is ready for pickup!`,
      html,
    });

    console.log('📧 Ready for pickup notification sent to:', data.customerEmail);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('❌ Failed to send ready notification:', error);
    return { success: false, error };
  }
}
