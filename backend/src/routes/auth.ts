import { Router, Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import db from '../db/database';
import { AppError } from '../middleware/errorHandler';
import { authenticateAdmin } from '../middleware/auth';

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Bootstrap code - only works when NO devices exist (first-time setup)
const BOOTSTRAP_CODE = process.env.BOOTSTRAP_CODE || 'JOY-BOOTSTRAP-2024';

// Generate a random 6-character alphanumeric code
function generateDeviceCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed confusing chars like 0,O,1,I
  let code = 'JOY-';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Check if any devices are registered (for bootstrap logic)
function hasAnyDevices(): boolean {
  const count = db.prepare('SELECT COUNT(*) as count FROM registered_devices').get() as any;
  return count.count > 0;
}

// Verify device token
function isDeviceRegistered(deviceToken: string): boolean {
  const device = db.prepare('SELECT * FROM registered_devices WHERE token = ? AND is_active = 1').get(deviceToken);
  return !!device;
}

// Login validation
const loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  body('deviceToken')
    .notEmpty()
    .withMessage('Device not registered'),
];

// ============================================
// DEVICE REGISTRATION ENDPOINTS
// ============================================

// Check if bootstrap is available (first-time setup)
router.get('/bootstrap-status', (req: Request, res: Response) => {
  const devicesExist = hasAnyDevices();
  res.json({
    bootstrapAvailable: !devicesExist,
    message: devicesExist 
      ? 'Bootstrap is disabled. Use a device code to register.' 
      : 'Bootstrap available for first device setup.',
  });
});

// Check if a device token is still valid (used for real-time revocation)
router.post('/check-device', (req: Request, res: Response) => {
  const { deviceToken } = req.body;
  
  if (!deviceToken) {
    return res.status(400).json({ valid: false, error: 'Device token required' });
  }
  
  if (isDeviceRegistered(deviceToken)) {
    return res.json({ valid: true });
  } else {
    return res.status(403).json({ valid: false, error: 'Device not authorized' });
  }
});

// Register device with bootstrap code OR one-time device code
router.post('/register-device', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { code, deviceName, browserInfo } = req.body;

    console.log('📥 Device registration request:', { code: code?.substring(0, 4) + '...', deviceName });

    if (!code) {
      throw new AppError('Registration code is required', 400);
    }

    const devicesExist = hasAnyDevices();
    let registeredVia = 'code';
    let usedCodeId: number | null = null;

    // Try bootstrap code first (only if no devices exist)
    if (!devicesExist && code === BOOTSTRAP_CODE) {
      registeredVia = 'bootstrap';
    } else {
      // Check for valid one-time device code
      const deviceCode = db.prepare(`
        SELECT * FROM device_codes 
        WHERE code = ? 
        AND is_used = 0 
        AND expires_at > datetime('now')
      `).get(code) as any;

      if (!deviceCode) {
        // Check if it's an expired or used code
        const anyCode = db.prepare('SELECT * FROM device_codes WHERE code = ?').get(code) as any;
        
        if (anyCode) {
          if (anyCode.is_used) {
            throw new AppError('This code has already been used', 403);
          } else {
            throw new AppError('This code has expired', 403);
          }
        }
        
        throw new AppError('Invalid registration code', 403);
      }

      usedCodeId = deviceCode.id;
      registeredVia = 'code';
    }

    // Create device token
    const deviceToken = uuidv4();
    const name = deviceName || `Device ${new Date().toLocaleDateString()}`;
    const browser = browserInfo || 'Unknown';

    // Insert device
    const result = db.prepare(`
      INSERT INTO registered_devices (token, name, browser_info, is_active, registered_via, created_at)
      VALUES (?, ?, ?, 1, ?, datetime('now'))
    `).run(deviceToken, name, browser, registeredVia);

    // If registered via code, mark the code as used
    if (usedCodeId) {
      db.prepare(`
        UPDATE device_codes 
        SET is_used = 1, used_by_device_id = ? 
        WHERE id = ?
      `).run(result.lastInsertRowid, usedCodeId);
    }

    console.log(`📱 New device registered: ${name} (via ${registeredVia})`);

    res.json({
      success: true,
      deviceToken,
      message: 'Device registered successfully',
    });
  } catch (error) {
    next(error);
  }
});

// ============================================
// DEVICE MANAGEMENT ENDPOINTS (require auth)
// ============================================

// Generate a new one-time device code (24 hour expiry)
router.post('/devices/generate-code', authenticateAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const code = generateDeviceCode();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours

    db.prepare(`
      INSERT INTO device_codes (code, expires_at, created_at)
      VALUES (?, ?, datetime('now'))
    `).run(code, expiresAt);

    console.log(`🎟️ Device code generated: ${code}`);

    res.json({
      success: true,
      code,
      expiresAt,
      expiresIn: '24 hours',
    });
  } catch (error) {
    next(error);
  }
});

// List all registered devices
router.get('/devices', authenticateAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const devices = db.prepare(`
      SELECT id, name, browser_info, is_active, last_used, registered_via, created_at
      FROM registered_devices
      ORDER BY created_at DESC
    `).all();

    res.json({
      success: true,
      devices,
    });
  } catch (error) {
    next(error);
  }
});

// List all device codes (for admin visibility)
router.get('/devices/codes', authenticateAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const codes = db.prepare(`
      SELECT id, code, is_used, expires_at, created_at,
             CASE WHEN expires_at < datetime('now') THEN 1 ELSE 0 END as is_expired
      FROM device_codes
      ORDER BY created_at DESC
      LIMIT 20
    `).all();

    res.json({
      success: true,
      codes,
    });
  } catch (error) {
    next(error);
  }
});

// Rename a device
router.patch('/devices/:id/name', authenticateAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    if (!name || name.trim().length === 0) {
      throw new AppError('Device name is required', 400);
    }

    const result = db.prepare('UPDATE registered_devices SET name = ? WHERE id = ?').run(name.trim(), id);

    if (result.changes === 0) {
      throw new AppError('Device not found', 404);
    }

    console.log(`📝 Device ${id} renamed to: ${name}`);

    res.json({
      success: true,
      message: 'Device renamed successfully',
    });
  } catch (error) {
    next(error);
  }
});

// Toggle device active status (enable/disable)
router.patch('/devices/:id/toggle', authenticateAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    // Get current status
    const device = db.prepare('SELECT is_active FROM registered_devices WHERE id = ?').get(id) as any;

    if (!device) {
      throw new AppError('Device not found', 404);
    }

    const newStatus = device.is_active ? 0 : 1;
    db.prepare('UPDATE registered_devices SET is_active = ? WHERE id = ?').run(newStatus, id);

    console.log(`🔄 Device ${id} ${newStatus ? 'enabled' : 'disabled'}`);

    res.json({
      success: true,
      isActive: !!newStatus,
      message: newStatus ? 'Device enabled' : 'Device disabled',
    });
  } catch (error) {
    next(error);
  }
});

// Delete a device permanently
router.delete('/devices/:id', authenticateAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    // First, remove the foreign key reference from device_codes
    db.prepare('UPDATE device_codes SET used_by_device_id = NULL WHERE used_by_device_id = ?').run(id);

    // Now delete the device
    const result = db.prepare('DELETE FROM registered_devices WHERE id = ?').run(id);

    if (result.changes === 0) {
      throw new AppError('Device not found', 404);
    }

    console.log(`🗑️ Device ${id} deleted`);

    res.json({
      success: true,
      message: 'Device deleted successfully',
    });
  } catch (error) {
    next(error);
  }
});

// ============================================
// AUTH ENDPOINTS
// ============================================

// Admin login (requires registered device)
router.post('/login', loginValidation, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError('Invalid credentials', 401);
    }

    const { email, password, deviceToken } = req.body;

    // Check device registration first
    if (!isDeviceRegistered(deviceToken)) {
      throw new AppError('Device not authorized', 403);
    }

    // Find admin by email
    const admin = db.prepare('SELECT * FROM admins WHERE email = ?').get(email) as any;

    if (!admin) {
      throw new AppError('Invalid credentials', 401);
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, admin.password_hash);

    if (!isValidPassword) {
      throw new AppError('Invalid credentials', 401);
    }

    // SECURITY: Regenerate device token on each login
    // This invalidates any copied tokens
    const newDeviceToken = uuidv4();
    db.prepare('UPDATE registered_devices SET token = ?, last_used = datetime(\'now\') WHERE token = ?')
      .run(newDeviceToken, deviceToken);

    // Generate JWT token (include NEW deviceToken for revocation checks)
    const token = jwt.sign(
      {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        deviceToken: newDeviceToken,
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    console.log(`🔐 Admin logged in: ${admin.email}`);

    res.json({
      success: true,
      token,
      newDeviceToken, // Frontend must update localStorage with this
      admin: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Change password (requires authentication)
router.post('/change-password', authenticateAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const adminId = (req as any).admin.id;

    if (!currentPassword || !newPassword) {
      throw new AppError('Current and new password are required', 400);
    }

    if (newPassword.length < 8) {
      throw new AppError('New password must be at least 8 characters', 400);
    }

    // Get admin
    const admin = db.prepare('SELECT * FROM admins WHERE id = ?').get(adminId) as any;

    if (!admin) {
      throw new AppError('Admin not found', 404);
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, admin.password_hash);

    if (!isValidPassword) {
      throw new AppError('Current password is incorrect', 401);
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 12);

    // Update password
    db.prepare('UPDATE admins SET password_hash = ?, updated_at = datetime(\'now\') WHERE id = ?')
      .run(newPasswordHash, adminId);

    console.log(`🔑 Password changed for: ${admin.email}`);

    res.json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    next(error);
  }
});

// Verify token (used by frontend to check if logged in)
router.get('/verify', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('No token provided', 401);
    }

    const token = authHeader.substring(7);

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;

      // Check if admin still exists
      const admin = db.prepare('SELECT id, email, name FROM admins WHERE id = ?').get(decoded.id) as any;

      if (!admin) {
        throw new AppError('Admin not found', 401);
      }

      res.json({
        success: true,
        admin: {
          id: admin.id,
          email: admin.email,
          name: admin.name,
        },
      });
    } catch (jwtError) {
      throw new AppError('Invalid token', 401);
    }
  } catch (error) {
    next(error);
  }
});

export default router;
