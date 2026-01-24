import { Router, Request, Response, NextFunction } from 'express';
import { body, query, validationResult } from 'express-validator';
import db from '../db/database';
import { AppError } from '../middleware/errorHandler';
import { authenticateAdmin } from '../middleware/auth';

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
  body('status').isIn(['pending', 'confirmed', 'ready', 'completed', 'cancelled']),
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

      db.prepare('UPDATE orders SET order_status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(
        status,
        id
      );

      console.log(`📦 Order ${order.order_number} status updated to: ${status}`);

      res.json({
        success: true,
        message: `Order status updated to ${status}`,
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
    db.prepare('UPDATE orders SET payment_status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(
      paymentStatus,
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

    // Total revenue
    const { total: totalRevenue } = db
      .prepare("SELECT COALESCE(SUM(total), 0) as total FROM orders WHERE payment_status = 'paid'")
      .get() as any;

    // Today's revenue
    const { total: todayRevenue } = db
      .prepare("SELECT COALESCE(SUM(total), 0) as total FROM orders WHERE payment_status = 'paid' AND DATE(created_at) = ?")
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

export default router;
