import { Router, Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { v4 as uuidv4 } from 'uuid';
import db from '../db/database';
import { AppError } from '../middleware/errorHandler';
import { sendOrderConfirmation, sendOrderNotification } from '../services/email';

const router = Router();

// Generate unique order number (JOY-XXXXXX)
function generateOrderNumber(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `JOY-${code}`;
}

// Validation rules for order
const orderValidation = [
  body('customerName')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Name must be less than 100 characters'),
  body('customerEmail')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('customerPhone')
    .optional()
    .trim()
    .matches(/^\(\d{3}\) \d{3}-\d{4}$/)
    .withMessage('Phone must be in format (XXX) XXX-XXXX'),
  body('pickupDate')
    .isISO8601()
    .withMessage('Please provide a valid pickup date'),
  body('pickupTime')
    .trim()
    .notEmpty()
    .withMessage('Please select a pickup time'),
  body('items')
    .isArray({ min: 1 })
    .withMessage('Order must contain at least one item'),
  body('items.*.id')
    .notEmpty()
    .withMessage('Item ID is required'),
  body('items.*.name')
    .trim()
    .notEmpty()
    .withMessage('Item name is required'),
  body('items.*.price')
    .isFloat({ min: 0 })
    .withMessage('Item price must be a positive number'),
  body('items.*.quantity')
    .isInt({ min: 1 })
    .withMessage('Quantity must be at least 1'),
  body('total')
    .isFloat({ min: 0 })
    .withMessage('Total must be a positive number'),
];

// Create new order
router.post('/', orderValidation, async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const messages = errors.array().map((err) => err.msg).join(', ');
      throw new AppError(messages, 400);
    }

    const {
      customerName,
      customerEmail,
      customerPhone,
      pickupDate,
      pickupTime,
      items,
      total,
      depositAmount,
      remainingBalance,
      paymentDetails,
    } = req.body;

    // Generate unique order number
    let orderNumber: string;
    let attempts = 0;
    do {
      orderNumber = generateOrderNumber();
      attempts++;
      if (attempts > 10) {
        throw new AppError('Failed to generate unique order number', 500);
      }
    } while (
      db.prepare('SELECT 1 FROM orders WHERE order_number = ?').get(orderNumber)
    );

    // Determine payment method and status based on deposit payment
    const paymentMethod = paymentDetails?.paymentMethod || 'pending';
    const paymentStatus = paymentDetails?.depositPaid ? 'deposit_paid' : 'pending';
    // Capitalize the payment method for display (e.g., 'paypal' -> 'PayPal')
    const depositMethod = paymentDetails?.depositPaid 
      ? (paymentMethod === 'paypal' ? 'PayPal' : paymentMethod === 'venmo' ? 'Venmo' : paymentMethod)
      : null;

    // Insert order into database with proper UTC timestamp
    const id = uuidv4();
    const nowUTC = new Date().toISOString(); // ISO format with 'Z' suffix for UTC
    const stmt = db.prepare(`
      INSERT INTO orders (
        id, order_number, customer_name, customer_email, customer_phone,
        pickup_date, pickup_time, items, subtotal, total,
        deposit_amount, remaining_balance, payment_method, payment_status,
        payment_transaction_id, payer_email, deposit_method, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      orderNumber,
      customerName || '',
      customerEmail,
      customerPhone || null,
      pickupDate,
      pickupTime,
      JSON.stringify(items),
      total,
      total,
      depositAmount || 0,
      remainingBalance || total,
      paymentMethod,
      paymentStatus,
      paymentDetails?.transactionId || null,
      paymentDetails?.payerEmail || null,
      depositMethod,
      nowUTC,
      nowUTC
    );

    console.log(`✅ Order created: ${orderNumber} (Deposit: $${depositAmount?.toFixed(2) || '0.00'} via ${paymentMethod})`);

    // Send emails (non-blocking)
    const emailData = {
      orderNumber,
      customerName,
      customerEmail,
      customerPhone,
      pickupDate,
      pickupTime,
      items,
      total,
      depositAmount: depositAmount || 0,
      remainingBalance: remainingBalance || total,
      paymentMethod,
      transactionId: paymentDetails?.transactionId,
    };

    // Send confirmation to customer
    sendOrderConfirmation(emailData).catch((err) => {
      console.error('Email error (customer):', err);
    });

    // Send notification to business
    sendOrderNotification(emailData).catch((err) => {
      console.error('Email error (business):', err);
    });

    res.status(201).json({
      success: true,
      orderNumber,
      message: 'Order placed successfully! Check your email for confirmation.',
    });
  } catch (error) {
    next(error);
  }
});

// Get order by order number (for confirmation page and pay balance page)
router.get('/:orderNumber', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { orderNumber } = req.params;

    const order = db.prepare(`
      SELECT order_number, customer_name, customer_email, pickup_date, pickup_time, 
             items, total, deposit_amount, remaining_balance, payment_status, created_at
      FROM orders WHERE order_number = ?
    `).get(orderNumber) as any;

    if (!order) {
      throw new AppError('Order not found', 404);
    }

    // Parse items JSON
    order.items = JSON.parse(order.items);

    res.json({
      success: true,
      order: {
        orderNumber: order.order_number,
        customerName: order.customer_name,
        customerEmail: order.customer_email,
        pickupDate: order.pickup_date,
        pickupTime: order.pickup_time,
        items: order.items,
        total: order.total,
        depositAmount: order.deposit_amount || 0,
        remainingBalance: order.remaining_balance || order.total,
        paymentStatus: order.payment_status || 'pending',
        createdAt: order.created_at,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Pay remaining balance for an order
router.post('/:orderNumber/pay-balance', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { orderNumber } = req.params;
    const { transactionId, paymentMethod, payerEmail } = req.body;

    // Get the order
    const order = db.prepare(`
      SELECT id, payment_status, remaining_balance FROM orders WHERE order_number = ?
    `).get(orderNumber) as any;

    if (!order) {
      throw new AppError('Order not found', 404);
    }

    if (order.payment_status === 'paid') {
      throw new AppError('Order has already been fully paid', 400);
    }

    // Format the balance method for display (e.g., 'paypal' -> 'PayPal')
    const balanceMethod = paymentMethod === 'paypal' ? 'PayPal' 
      : paymentMethod === 'venmo' ? 'Venmo' 
      : paymentMethod || 'Online';

    // Update the order to fully paid with proper UTC timestamp
    const nowUTC = new Date().toISOString();
    db.prepare(`
      UPDATE orders 
      SET payment_status = 'paid',
          remaining_balance = 0,
          balance_method = ?,
          payment_transaction_id = COALESCE(payment_transaction_id || ', ', '') || ?,
          payer_email = COALESCE(?, payer_email),
          updated_at = ?
      WHERE order_number = ?
    `).run(balanceMethod, transactionId, payerEmail, nowUTC, orderNumber);

    console.log(`✅ Remaining balance paid for ${orderNumber} via ${balanceMethod} (${transactionId})`);

    res.json({
      success: true,
      message: 'Payment successful! Your order is fully paid.',
    });
  } catch (error) {
    next(error);
  }
});

export default router;
