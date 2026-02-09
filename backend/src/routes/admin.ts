import { Router, Request, Response, NextFunction } from 'express';
import { body, query, validationResult } from 'express-validator';
import db, { getStorageUsage, aggregateOldOrders, getHistoricalAnalytics } from '../db/database';
import { AppError } from '../middleware/errorHandler';
import { authenticateAdmin } from '../middleware/auth';
import { sendReplyEmail, sendReadyForPickupNotification } from '../services/email';

const router = Router();

// All admin routes require authentication
router.use(authenticateAdmin);

// ==================== ORDERS ====================

// Get all orders with pagination and filters
router.get('/orders', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as string;
    const search = req.query.search as string;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    const params: any[] = [];

    if (status) {
      whereClause += ' AND order_status = ?';
      params.push(status);
    }

    if (search) {
      whereClause += ' AND (order_number LIKE ? OR customer_email LIKE ? OR customer_name LIKE ?)';
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }

    // Get total count
    const countStmt = db.prepare(`SELECT COUNT(*) as count FROM orders ${whereClause}`);
    const { count: total } = countStmt.get(...params) as any;

    // Get orders
    const ordersStmt = db.prepare(`
      SELECT * FROM orders 
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `);

    const orders = ordersStmt.all(...params, limit, offset) as any[];

    // Parse items JSON for each order
    const parsedOrders = orders.map((order) => ({
      ...order,
      items: JSON.parse(order.items),
    }));

    res.json({
      success: true,
      orders: parsedOrders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
});

// Get single order by ID
router.get('/orders/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id) as any;

    if (!order) {
      throw new AppError('Order not found', 404);
    }

    order.items = JSON.parse(order.items);

    res.json({
      success: true,
      order,
    });
  } catch (error) {
    next(error);
  }
});

// Update order status
router.patch(
  '/orders/:id/status',
  body('status').isIn(['pending', 'ready', 'picked_up', 'cancelled']),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new AppError('Invalid status', 400);
      }

      const { id } = req.params;
      const { status } = req.body;

      const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id) as any;

      if (!order) {
        throw new AppError('Order not found', 404);
      }

      const nowUTC = new Date().toISOString();
      db.prepare('UPDATE orders SET order_status = ?, updated_at = ? WHERE id = ?').run(
        status,
        nowUTC,
        id
      );

      // Send email notification when order is ready for pickup
      if (status === 'ready') {
        sendReadyForPickupNotification({
          orderNumber: order.order_number,
          customerName: order.customer_name,
          customerEmail: order.customer_email,
          pickupDate: order.pickup_date,
          pickupTime: order.pickup_time,
          total: order.total,
          remainingBalance: order.remaining_balance,
        }).catch((err) => {
          console.error('Failed to send ready notification:', err);
        });
      }

      const statusLabels: Record<string, string> = {
        pending: 'Pending',
        ready: 'Ready for Pickup',
        picked_up: 'Picked Up',
        cancelled: 'Cancelled',
      };

      console.log(`📦 Order ${order.order_number} status updated to: ${statusLabels[status] || status}`);

      res.json({
        success: true,
        message: `Order status updated to ${statusLabels[status] || status}`,
        emailSent: status === 'ready',
      });
    } catch (error) {
      next(error);
    }
  }
);

// Mark order as paid
router.patch('/orders/:id/paid', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { paid } = req.body;

    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id) as any;

    if (!order) {
      throw new AppError('Order not found', 404);
    }

    const paymentStatus = paid ? 'paid' : 'pending';
    const nowUTC = new Date().toISOString();
    db.prepare('UPDATE orders SET payment_status = ?, updated_at = ? WHERE id = ?').run(
      paymentStatus,
      nowUTC,
      id
    );

    console.log(`💰 Order ${order.order_number} payment status: ${paymentStatus.toUpperCase()}`);

    res.json({
      success: true,
      message: paid ? 'Order marked as paid' : 'Order marked as unpaid',
    });
  } catch (error) {
    next(error);
  }
});

// Update payment status (pending, deposit_paid, paid)
router.patch('/orders/:id/payment-status', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { status, balanceMethod } = req.body;

    if (!['pending', 'deposit_paid', 'paid'].includes(status)) {
      throw new AppError('Invalid payment status', 400);
    }

    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id) as any;

    if (!order) {
      throw new AppError('Order not found', 404);
    }

    // If marking as fully paid and a balance method is provided, save it
    const nowUTC = new Date().toISOString();
    if (status === 'paid' && balanceMethod) {
      db.prepare(`
        UPDATE orders 
        SET payment_status = ?, balance_method = ?, remaining_balance = 0, updated_at = ? 
        WHERE id = ?
      `).run(status, balanceMethod, nowUTC, id);
    } else if (status === 'paid') {
      // Default to 'Cash' if no method specified when marking as paid
      db.prepare(`
        UPDATE orders 
        SET payment_status = ?, balance_method = 'Cash', remaining_balance = 0, updated_at = ? 
        WHERE id = ?
      `).run(status, nowUTC, id);
    } else {
      db.prepare('UPDATE orders SET payment_status = ?, updated_at = ? WHERE id = ?').run(
        status,
        nowUTC,
        id
      );
    }

    const statusLabels: Record<string, string> = {
      pending: 'Unpaid',
      deposit_paid: 'Deposit Paid',
      paid: 'Fully Paid',
    };

    const methodInfo = status === 'paid' && balanceMethod ? ` (${balanceMethod})` : status === 'paid' ? ' (Cash)' : '';
    console.log(`💰 Order ${order.order_number} payment status: ${statusLabels[status]}${methodInfo}`);

    res.json({
      success: true,
      message: `Payment status updated to ${statusLabels[status]}`,
    });
  } catch (error) {
    next(error);
  }
});

// Delete order
router.delete('/orders/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id) as any;

    if (!order) {
      throw new AppError('Order not found', 404);
    }

    db.prepare('DELETE FROM orders WHERE id = ?').run(id);

    console.log(`🗑️ Order ${order.order_number} deleted`);

    res.json({
      success: true,
      message: 'Order deleted',
    });
  } catch (error) {
    next(error);
  }
});

// Get order statistics
router.get('/stats', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    // Total orders
    const { total: totalOrders } = db.prepare('SELECT COUNT(*) as total FROM orders').get() as any;

    // Today's orders
    const { total: todayOrders } = db
      .prepare('SELECT COUNT(*) as total FROM orders WHERE DATE(created_at) = ?')
      .get(today) as any;

    // Total revenue (from fully paid and deposit paid orders)
    const { total: totalRevenue } = db
      .prepare("SELECT COALESCE(SUM(total), 0) as total FROM orders WHERE payment_status IN ('paid', 'deposit_paid')")
      .get() as any;

    // Today's revenue (from fully paid and deposit paid orders)
    const { total: todayRevenue } = db
      .prepare("SELECT COALESCE(SUM(total), 0) as total FROM orders WHERE payment_status IN ('paid', 'deposit_paid') AND DATE(created_at) = ?")
      .get(today) as any;

    // Pending orders
    const { total: pendingOrders } = db
      .prepare('SELECT COUNT(*) as total FROM orders WHERE order_status = ?')
      .get('pending') as any;

    // Orders by status
    const statusCounts = db
      .prepare(
        `SELECT order_status, COUNT(*) as count FROM orders GROUP BY order_status`
      )
      .all() as any[];

    // Recent orders (last 5)
    const recentOrders = db
      .prepare(
        `SELECT order_number, customer_name, total, order_status, created_at 
         FROM orders ORDER BY created_at DESC LIMIT 5`
      )
      .all() as any[];

    // Unread messages count
    const { total: unreadMessages } = db
      .prepare('SELECT COUNT(*) as total FROM contact_messages WHERE is_read = 0')
      .get() as any;

    res.json({
      success: true,
      stats: {
        totalOrders,
        todayOrders,
        totalRevenue,
        todayRevenue,
        pendingOrders,
        unreadMessages,
        statusCounts: statusCounts.reduce(
          (acc, { order_status, count }) => ({ ...acc, [order_status]: count }),
          {}
        ),
        recentOrders,
      },
    });
  } catch (error) {
    next(error);
  }
});

// ==================== CONTACT MESSAGES ====================

// Get all contact messages
router.get('/messages', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const unreadOnly = req.query.unread === 'true';
    const offset = (page - 1) * limit;

    let whereClause = '';
    if (unreadOnly) {
      whereClause = 'WHERE is_read = 0';
    }

    const { count: total } = db
      .prepare(`SELECT COUNT(*) as count FROM contact_messages ${whereClause}`)
      .get() as any;

    const messages = db
      .prepare(
        `SELECT * FROM contact_messages ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`
      )
      .all(limit, offset) as any[];

    res.json({
      success: true,
      messages,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
});

// Mark message as read
router.patch('/messages/:id/read', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const message = db.prepare('SELECT * FROM contact_messages WHERE id = ?').get(id) as any;

    if (!message) {
      throw new AppError('Message not found', 404);
    }

    db.prepare('UPDATE contact_messages SET is_read = 1 WHERE id = ?').run(id);

    res.json({
      success: true,
      message: 'Message marked as read',
    });
  } catch (error) {
    next(error);
  }
});

// Delete message
router.delete('/messages/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const message = db.prepare('SELECT * FROM contact_messages WHERE id = ?').get(id) as any;

    if (!message) {
      throw new AppError('Message not found', 404);
    }

    db.prepare('DELETE FROM contact_messages WHERE id = ?').run(id);

    res.json({
      success: true,
      message: 'Message deleted',
    });
  } catch (error) {
    next(error);
  }
});

// Reply to a message
router.post(
  '/messages/:id/reply',
  body('reply').trim().isLength({ min: 1, max: 5000 }).withMessage('Reply message is required'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new AppError('Reply message is required', 400);
      }

      const { id } = req.params;
      const { reply } = req.body;

      const message = db.prepare('SELECT * FROM contact_messages WHERE id = ?').get(id) as any;

      if (!message) {
        throw new AppError('Message not found', 404);
      }

      // Send reply email
      const result = await sendReplyEmail({
        customerName: message.name,
        customerEmail: message.email,
        originalMessage: message.message,
        replyMessage: reply,
      });

      if (!result.success && !result.dev) {
        throw new AppError('Failed to send reply email', 500);
      }

      // Mark message as read and set replied_at after replying
      const nowUTC = new Date().toISOString();
      db.prepare('UPDATE contact_messages SET is_read = 1, replied_at = ? WHERE id = ?').run(nowUTC, id);

      console.log(`📧 Reply sent to ${message.email} for message from ${message.name}`);

      res.json({
        success: true,
        message: 'Reply sent successfully',
      });
    } catch (error) {
      next(error);
    }
  }
);

// ==================== STORAGE & MAINTENANCE ====================

// Get storage usage statistics
router.get('/storage', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const usage = getStorageUsage();
    
    res.json({
      success: true,
      storage: usage,
    });
  } catch (error) {
    next(error);
  }
});

// Aggregate old orders and clean up (manual trigger)
router.post('/maintenance/cleanup', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const monthsOld = parseInt(req.body.monthsOld as string) || 6;
    
    if (monthsOld < 1 || monthsOld > 24) {
      throw new AppError('monthsOld must be between 1 and 24', 400);
    }
    
    const result = aggregateOldOrders(monthsOld);
    
    // Get updated storage after cleanup
    const storage = getStorageUsage();
    
    res.json({
      success: true,
      message: `Aggregated ${result.aggregated} months of data, deleted ${result.deleted} old orders`,
      result,
      storage,
    });
  } catch (error) {
    next(error);
  }
});

// Get historical analytics (aggregated data)
router.get('/analytics/historical', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const historicalData = getHistoricalAnalytics();
    
    res.json({
      success: true,
      analytics: historicalData,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
