import Database, { Database as DatabaseType } from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

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

    -- Products/Menu table
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      price REAL NOT NULL,
      category TEXT NOT NULL,
      description TEXT,
      image_path TEXT,
      is_available INTEGER DEFAULT 1,
      display_order INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    -- Categories table
    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      display_order INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
    CREATE INDEX IF NOT EXISTS idx_products_available ON products(is_available);
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

  // Add replied_at column to contact_messages if it doesn't exist
  const messagesTableInfo = db.prepare("PRAGMA table_info(contact_messages)").all() as Array<{ name: string }>;
  const messagesColumnNames = messagesTableInfo.map(col => col.name);
  if (!messagesColumnNames.includes('replied_at')) {
    try {
      db.exec("ALTER TABLE contact_messages ADD COLUMN replied_at TEXT");
      console.log('  ✓ Migration: Added replied_at column to contact_messages');
    } catch (e) {
      // Column might already exist
    }
  }

  // Seed products if table is empty
  seedProducts();
}

// Default products to seed
const defaultProducts = [
  // Cookies - $2.50 each
  { id: "1", name: "Chocolate Chip", price: 2.50, category: "cookies", description: "Our classic chocolate chip cookie is crispy on the edges and chewy in the center, loaded with premium semi-sweet chocolate chips.", image_path: "cookies/Chocolate Chip.webp", display_order: 1 },
  { id: "2", name: "Sugar Cookie", price: 2.50, category: "cookies", description: "A soft and buttery sugar cookie with a delicate sweetness. Perfect for those who love simple, classic flavors.", image_path: "cookies/Sugar Cookie.webp", display_order: 2 },
  { id: "3", name: "German Chocolate Cookie", price: 2.50, category: "cookies", description: "Rich chocolate cookie inspired by German chocolate cake, featuring coconut and pecan notes in every bite.", image_path: "cookies/German Chocolate Cookie.webp", display_order: 3 },
  { id: "4", name: "Double Chocolate Cookie", price: 2.50, category: "cookies", description: "For the ultimate chocolate lover - a rich, fudgy chocolate cookie packed with chocolate chips for double the indulgence.", image_path: "cookies/Double Chocolate Cookie.webp", display_order: 4 },
  { id: "5", name: "Biscoff Cookie", price: 2.50, category: "cookies", description: "Inspired by the beloved European speculoos, this cookie features warm cinnamon and caramelized sugar flavors.", image_path: "cookies/Biscoff Cookie.webp", display_order: 5 },
  { id: "6", name: "Oatmeal Raisin Cookie", price: 2.50, category: "cookies", description: "A wholesome, chewy cookie with hearty oats and plump raisins, lightly spiced with cinnamon.", image_path: "cookies/Oatmeal Raisin Cookie.webp", display_order: 6 },
  { id: "7", name: "White Chocolate Macadamia Cookie", price: 2.50, category: "cookies", description: "Buttery cookie studded with creamy white chocolate chips and crunchy roasted macadamia nuts.", image_path: "cookies/White Chocolate Macadamia Cookie.webp", display_order: 7 },
  { id: "8", name: "Peanut Butter Cookie", price: 2.50, category: "cookies", description: "Rich and crumbly peanut butter cookie with the classic crosshatch pattern. A peanut butter lover's dream!", image_path: "cookies/Peanut Butter Cookie.webp", display_order: 8 },
  // Cupcakes - $3.50 each
  { id: "9", name: "Vanilla Cupcake", price: 3.50, category: "cupcakes", description: "Light and fluffy vanilla cupcake topped with smooth vanilla buttercream frosting. Simple perfection.", image_path: "cupcakes/Vanilla Cupcake.webp", display_order: 1 },
  { id: "10", name: "Chocolate Cupcake", price: 3.50, category: "cupcakes", description: "Moist, rich chocolate cupcake crowned with silky chocolate buttercream. Pure chocolate bliss.", image_path: "cupcakes/Chocolate Cupcake.webp", display_order: 2 },
  { id: "11", name: "Lemon Blueberry Cupcake", price: 3.50, category: "cupcakes", description: "Bright, zesty lemon cupcake bursting with fresh blueberries, topped with lemon cream cheese frosting.", image_path: "cupcakes/Lemon Blueberry Cupcake.webp", display_order: 3 },
  { id: "12", name: "Cookies & Cream Cupcake", price: 3.50, category: "cupcakes", description: "Vanilla cupcake loaded with crushed chocolate sandwich cookies, topped with cookies and cream frosting.", image_path: "cupcakes/Cookies and Cream Cupcake.webp", display_order: 4 },
  { id: "13", name: "Salted Caramel Cupcake", price: 3.50, category: "cupcakes", description: "Buttery caramel cupcake with a caramel center, topped with salted caramel buttercream and a drizzle of caramel sauce.", image_path: "cupcakes/Salted Caramel Cupcake.webp", display_order: 5 },
  { id: "14", name: "Funfetti Cupcake", price: 3.50, category: "cupcakes", description: "Cheerful vanilla cupcake filled with colorful sprinkles, topped with vanilla buttercream and more sprinkles!", image_path: "cupcakes/Funfetti Cupcake.webp", display_order: 6 },
  // Cake Pops - $1.50 each
  { id: "15", name: "Chocolate Cake Pop", price: 1.50, category: "cakepops", description: "Rich chocolate cake mixed with chocolate frosting, dipped in smooth chocolate coating. A bite-sized treat!", image_path: "cakepops/Chocolate Cake Pop.webp", display_order: 1 },
  { id: "16", name: "Vanilla Cake Pop", price: 1.50, category: "cakepops", description: "Moist vanilla cake blended with vanilla frosting, coated in white chocolate. Sweet and delightful!", image_path: "cakepops/Vanilla Cake Pop.webp", display_order: 2 },
];

// Default categories to seed
const defaultCategories = [
  { id: "1", name: "Cookies", slug: "cookies", display_order: 1 },
  { id: "2", name: "Cupcakes", slug: "cupcakes", display_order: 2 },
  { id: "3", name: "Cake Pops", slug: "cakepops", display_order: 3 },
];

function seedProducts() {
  // Seed categories
  const catCount = db.prepare("SELECT COUNT(*) as count FROM categories").get() as { count: number };
  if (catCount.count === 0) {
    const insertCat = db.prepare(`
      INSERT INTO categories (id, name, slug, display_order)
      VALUES (@id, @name, @slug, @display_order)
    `);
    for (const cat of defaultCategories) {
      insertCat.run(cat);
    }
    console.log('  ✓ Seeded categories table');
  }

  // Seed products
  const count = db.prepare("SELECT COUNT(*) as count FROM products").get() as { count: number };
  if (count.count === 0) {
    const insert = db.prepare(`
      INSERT INTO products (id, name, price, category, description, image_path, display_order)
      VALUES (@id, @name, @price, @category, @description, @image_path, @display_order)
    `);
    
    const insertMany = db.transaction((products: typeof defaultProducts) => {
      for (const product of products) {
        insert.run(product);
      }
    });
    
    insertMany(defaultProducts);
    console.log('  ✓ Seeded products table with default menu items');
  }

  // Seed admin user
  seedAdmin();
}

function seedAdmin() {
  const adminCount = db.prepare("SELECT COUNT(*) as count FROM admins").get() as { count: number };
  if (adminCount.count === 0) {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@joycookiescupcakes.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'JoyCookies2024!';
    const adminName = process.env.ADMIN_NAME || 'Joy Cookies Admin';
    const passwordHash = bcrypt.hashSync(adminPassword, 12);
    const adminId = uuidv4();

    db.prepare(`
      INSERT INTO admins (id, email, password_hash, name)
      VALUES (?, ?, ?, ?)
    `).run(adminId, adminEmail, passwordHash, adminName);

    console.log('  ✓ Seeded admin user');
    console.log(`    Email: ${adminEmail}`);
    console.log(`    Password: ${adminPassword}`);
  }
}

export default db;
