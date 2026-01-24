import { Router, Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/database';
import { AppError } from '../middleware/errorHandler';
import { sendContactNotification } from '../services/email';

const router = Router();

// Validation rules for contact form
const contactValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('message')
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage('Message must be between 10 and 2000 characters'),
];

// Submit contact form
router.post('/', contactValidation, async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const messages = errors.array().map((err) => err.msg).join(', ');
      throw new AppError(messages, 400);
    }

    const { name, email, message } = req.body;

    // Insert into database
    const id = uuidv4();
    const stmt = db.prepare(`
      INSERT INTO contact_messages (id, name, email, message)
      VALUES (?, ?, ?, ?)
    `);

    stmt.run(id, name, email, message);

    console.log(`📬 Contact message received from: ${name} <${email}>`);

    // Send email notification (non-blocking)
    sendContactNotification({ name, email, message }).catch((err) => {
      console.error('Email error (contact):', err);
    });

    res.status(201).json({
      success: true,
      message: 'Thank you for your message! We\'ll get back to you soon.',
    });
  } catch (error) {
    next(error);
  }
});

export default router;
