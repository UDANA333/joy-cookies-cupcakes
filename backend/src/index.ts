import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { initDatabase } from './db/database';
import { errorHandler } from './middleware/errorHandler';
import orderRoutes from './routes/orders';
import contactRoutes from './routes/contact';
import authRoutes from './routes/auth';
import adminRoutes from './routes/admin';
import productRoutes from './routes/products';

const app = express();
const PORT = process.env.PORT || 3001;

// Build CORS origins list
const corsOrigins: (string | RegExp)[] = [
  'http://localhost:8080', 
  'http://localhost:5173', 
  'http://127.0.0.1:8080',
  /^http:\/\/192\.168\.\d{1,3}\.\d{1,3}:\d+$/  // Allow any 192.168.x.x network IP
];

// Add production frontend URL if configured
if (process.env.FRONTEND_URL) {
  corsOrigins.push(process.env.FRONTEND_URL);
  // Also allow www subdomain
  const url = new URL(process.env.FRONTEND_URL);
  if (!url.hostname.startsWith('www.')) {
    corsOrigins.push(`${url.protocol}//www.${url.hostname}${url.port ? ':' + url.port : ''}`);
  }
}

// CORS configuration - MUST be before other middleware
app.use(cors({
  origin: corsOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Security middleware (after CORS) - disable CSP for development
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: false, // Disable CSP in development
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Stricter rate limit for login attempts
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 login attempts per windowMs
  message: { error: 'Too many login attempts, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for non-login auth routes (device registration, etc.)
    return !req.path.includes('/login');
  },
});

// Body parsing
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Debug: Check if routes are loaded
app.get('/api/debug', (req, res) => {
  res.json({ 
    routes: 'loaded',
    orderRoutes: !!orderRoutes,
    contactRoutes: !!contactRoutes,
    authRoutes: !!authRoutes,
    adminRoutes: !!adminRoutes
  });
});

// API Routes
console.log('📍 Mounting routes...');
app.use('/api/orders', orderRoutes);
console.log('  ✓ /api/orders mounted');
app.use('/api/contact', contactRoutes);
console.log('  ✓ /api/contact mounted');
app.use('/api/auth', authLimiter, authRoutes);
console.log('  ✓ /api/auth mounted');
app.use('/api/admin', adminRoutes);
console.log('  ✓ /api/admin mounted');
app.use('/api/products', productRoutes);
console.log('  ✓ /api/products mounted');

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Global error handler
app.use(errorHandler);

// Initialize database and start server
async function startServer() {
  try {
    // Initialize database
    initDatabase();
    console.log('✅ Database initialized');

    // Start server
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📧 Business email: ${process.env.GMAIL_USER}`);
      console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

export default app;
