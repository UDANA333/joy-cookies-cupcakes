import Database, { Database as DatabaseType } from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_PATH = process.env.DATABASE_PATH || './data/database.sqlite';

// Ensure data directory exists
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Create database connection
const db: DatabaseType = new Database(DB_PATH);

// Enable foreign keys and WAL mode for better performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function initDatabase() {
  // Create tables
  db.exec(`
    -- Admin users table
    CREATE TABLE IF NOT EXISTS admins (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    -- Registered devices table (for admin access control)
    CREATE TABLE IF NOT EXISTS registered_devices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      token TEXT UNIQUE NOT NULL,
      name TEXT,
      browser_info TEXT,
      is_active INTEGER DEFAULT 1,
      last_used TEXT,
      registered_via TEXT DEFAULT 'code',
      created_at TEXT DEFAULT (datetime('now'))
    );

    -- Device access codes (one-time codes for registering new devices)
    CREATE TABLE IF NOT EXISTS device_codes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      is_used INTEGER DEFAULT 0,
      used_by_device_id INTEGER,
      expires_at TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (used_by_device_id) REFERENCES registered_devices(id)
    );

    -- Orders table
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      order_number TEXT UNIQUE NOT NULL,
      customer_name TEXT NOT NULL,
      customer_email TEXT NOT NULL,
      customer_phone TEXT,
      pickup_date TEXT NOT NULL,
      pickup_time TEXT NOT NULL,
      payment_method TEXT NOT NULL DEFAULT 'venmo',
      payment_status TEXT NOT NULL DEFAULT 'pending',
      order_status TEXT NOT NULL DEFAULT 'pending',
      items TEXT NOT NULL,
      subtotal REAL NOT NULL,
      total REAL NOT NULL,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    -- Contact messages table
    CREATE TABLE IF NOT EXISTS contact_messages (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      message TEXT NOT NULL,
      is_read INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    -- Create indexes for common queries
    CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(order_status);
    CREATE INDEX IF NOT EXISTS idx_orders_pickup_date ON orders(pickup_date);
    CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
    CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);
    CREATE INDEX IF NOT EXISTS idx_contact_is_read ON contact_messages(is_read);
    CREATE INDEX IF NOT EXISTS idx_devices_token ON registered_devices(token);
  `);

  // Run migrations for existing databases
  runMigrations();

  console.log('📦 Database tables created/verified');
}

// Migration function to add new columns to existing tables
function runMigrations() {
  // Check if browser_info column exists in registered_devices
  const tableInfo = db.prepare("PRAGMA table_info(registered_devices)").all() as Array<{ name: string }>;
  const columnNames = tableInfo.map(col => col.name);

  // Add browser_info column if it doesn't exist
  if (!columnNames.includes('browser_info')) {
    try {
      db.exec("ALTER TABLE registered_devices ADD COLUMN browser_info TEXT");
      console.log('  ✓ Migration: Added browser_info column');
    } catch (e) {
      // Column might already exist
    }
  }

  // Add registered_via column if it doesn't exist
  if (!columnNames.includes('registered_via')) {
    try {
      db.exec("ALTER TABLE registered_devices ADD COLUMN registered_via TEXT DEFAULT 'code'");
      console.log('  ✓ Migration: Added registered_via column');
    } catch (e) {
      // Column might already exist
    }
  }

  // Check if device_codes table exists
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='device_codes'").all();
  if (tables.length === 0) {
    db.exec(`
      CREATE TABLE device_codes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT UNIQUE NOT NULL,
        is_used INTEGER DEFAULT 0,
        used_by_device_id INTEGER,
        expires_at TEXT NOT NULL,
        created_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (used_by_device_id) REFERENCES registered_devices(id)
      )
    `);
    console.log('  ✓ Migration: Created device_codes table');
  }
}

export default db;
