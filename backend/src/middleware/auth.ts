import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from './errorHandler';
import db from '../db/database';

interface JwtPayload {
  id: string;
  email: string;
  deviceToken?: string;
}

declare global {
  namespace Express {
    interface Request {
      admin?: JwtPayload;
    }
  }
}

// Check if device is still registered and active
function isDeviceValid(deviceToken: string | undefined): boolean {
  // For backward compatibility: if no deviceToken in JWT (old sessions), allow but they'll need to re-login eventually
  if (!deviceToken) return true;
  const device = db.prepare('SELECT * FROM registered_devices WHERE token = ? AND is_active = 1').get(deviceToken);
  return !!device;
}

export function authenticateAdmin(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Authentication required', 401);
    }

    const token = authHeader.split(' ')[1];
    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
      throw new AppError('JWT secret not configured', 500);
    }

    const decoded = jwt.verify(token, jwtSecret) as JwtPayload;
    
    // Check if device is still valid (not deleted or disabled)
    if (!isDeviceValid(decoded.deviceToken)) {
      throw new AppError('Device access revoked', 403);
    }
    
    req.admin = decoded;
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new AppError('Invalid or expired token', 401));
    } else {
      next(error);
    }
  }
}
