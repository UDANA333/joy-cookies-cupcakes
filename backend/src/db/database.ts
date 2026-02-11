import Database, { Database as DatabaseType } from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { execSync } from 'child_process';
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

    -- Seasonal themes table (for limited-time promotions like Valentine, Halloween, etc.)
    CREATE TABLE IF NOT EXISTS seasonal_themes (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      category_slug TEXT NOT NULL,
      primary_color TEXT DEFAULT '#FF6B9A',
      secondary_color TEXT DEFAULT '#8B0A1A',
      accent_color TEXT DEFAULT '#FFD700',
      icon TEXT DEFAULT '🎉',
      banner_text TEXT,
      banner_subtext TEXT,
      is_active INTEGER DEFAULT 0,
      display_order INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (category_slug) REFERENCES categories(slug) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_seasonal_themes_active ON seasonal_themes(is_active);
    CREATE INDEX IF NOT EXISTS idx_seasonal_themes_category ON seasonal_themes(category_slug);

    CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
    CREATE INDEX IF NOT EXISTS idx_products_available ON products(is_available);

    -- Order analytics table for aggregated historical data
    CREATE TABLE IF NOT EXISTS order_analytics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      period_type TEXT NOT NULL,  -- 'monthly' or 'yearly'
      period_start TEXT NOT NULL, -- Start date of the period (YYYY-MM-01 for monthly)
      period_end TEXT NOT NULL,   -- End date of the period
      total_orders INTEGER DEFAULT 0,
      total_revenue REAL DEFAULT 0,
      total_items_sold INTEGER DEFAULT 0,
      orders_by_status TEXT,      -- JSON: { "completed": 10, "cancelled": 2 }
      revenue_by_category TEXT,   -- JSON: { "cookies": 500, "cupcakes": 300 }
      top_products TEXT,          -- JSON: [{ "name": "Chocolate Chip", "quantity": 50 }]
      created_at TEXT DEFAULT (datetime('now')),
      UNIQUE(period_type, period_start)
    );

    CREATE INDEX IF NOT EXISTS idx_analytics_period ON order_analytics(period_type, period_start);
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

  // Add deposit-related columns to orders if they don't exist
  const ordersTableInfo = db.prepare("PRAGMA table_info(orders)").all() as Array<{ name: string }>;
  const ordersColumnNames = ordersTableInfo.map(col => col.name);
  
  if (!ordersColumnNames.includes('deposit_amount')) {
    try {
      db.exec("ALTER TABLE orders ADD COLUMN deposit_amount REAL DEFAULT 0");
      console.log('  ✓ Migration: Added deposit_amount column to orders');
    } catch (e) {
      // Column might already exist
    }
  }
  
  if (!ordersColumnNames.includes('remaining_balance')) {
    try {
      db.exec("ALTER TABLE orders ADD COLUMN remaining_balance REAL DEFAULT 0");
      console.log('  ✓ Migration: Added remaining_balance column to orders');
    } catch (e) {
      // Column might already exist
    }
  }
  
  if (!ordersColumnNames.includes('payment_transaction_id')) {
    try {
      db.exec("ALTER TABLE orders ADD COLUMN payment_transaction_id TEXT");
      console.log('  ✓ Migration: Added payment_transaction_id column to orders');
    } catch (e) {
      // Column might already exist
    }
  }
  
  if (!ordersColumnNames.includes('payer_email')) {
    try {
      db.exec("ALTER TABLE orders ADD COLUMN payer_email TEXT");
      console.log('  ✓ Migration: Added payer_email column to orders');
    } catch (e) {
      // Column might already exist
    }
  }

  // Add deposit_method column to track how deposit was paid (paypal, venmo)
  if (!ordersColumnNames.includes('deposit_method')) {
    try {
      db.exec("ALTER TABLE orders ADD COLUMN deposit_method TEXT");
      console.log('  ✓ Migration: Added deposit_method column to orders');
    } catch (e) {
      // Column might already exist
    }
  }

  // Add balance_method column to track how balance was paid (paypal, venmo, cash)
  if (!ordersColumnNames.includes('balance_method')) {
    try {
      db.exec("ALTER TABLE orders ADD COLUMN balance_method TEXT");
      console.log('  ✓ Migration: Added balance_method column to orders');
    } catch (e) {
      // Column might already exist
    }
  }

  // Migrate existing orders: copy payment_method to deposit_method for orders with deposits
  try {
    const ordersToMigrate = db.prepare(`
      SELECT id, payment_method FROM orders 
      WHERE deposit_amount > 0 AND deposit_method IS NULL AND payment_method IS NOT NULL
    `).all() as Array<{ id: string; payment_method: string }>;
    
    if (ordersToMigrate.length > 0) {
      const updateStmt = db.prepare('UPDATE orders SET deposit_method = ? WHERE id = ?');
      for (const order of ordersToMigrate) {
        // Capitalize the method name for display
        const depositMethod = order.payment_method === 'paypal' ? 'PayPal' 
          : order.payment_method === 'venmo' ? 'Venmo' 
          : order.payment_method;
        updateStmt.run(depositMethod, order.id);
      }
      console.log(`  ✓ Migration: Updated deposit_method for ${ordersToMigrate.length} existing orders`);
    }
  } catch (e) {
    // Migration might have already been applied
  }

  // Migrate existing timestamps to proper ISO format with Z suffix
  // Old format: "2026-01-27 16:10:37" -> "2026-01-27T16:10:37.000Z"
  try {
    // Update orders timestamps
    const ordersWithOldTimestamp = db.prepare(`
      SELECT id, created_at, updated_at FROM orders 
      WHERE created_at NOT LIKE '%T%' AND created_at NOT LIKE '%Z%'
    `).all() as Array<{ id: string; created_at: string; updated_at: string }>;
    
    if (ordersWithOldTimestamp.length > 0) {
      const updateStmt = db.prepare('UPDATE orders SET created_at = ?, updated_at = ? WHERE id = ?');
      for (const order of ordersWithOldTimestamp) {
        const createdAtISO = order.created_at ? order.created_at.replace(' ', 'T') + '.000Z' : null;
        const updatedAtISO = order.updated_at ? order.updated_at.replace(' ', 'T') + '.000Z' : null;
        updateStmt.run(createdAtISO, updatedAtISO, order.id);
      }
      console.log(`  ✓ Migration: Converted ${ordersWithOldTimestamp.length} order timestamps to ISO format`);
    }

    // Update contact_messages timestamps
    const messagesWithOldTimestamp = db.prepare(`
      SELECT id, created_at FROM contact_messages 
      WHERE created_at NOT LIKE '%T%' AND created_at NOT LIKE '%Z%'
    `).all() as Array<{ id: string; created_at: string }>;
    
    if (messagesWithOldTimestamp.length > 0) {
      const updateMsgStmt = db.prepare('UPDATE contact_messages SET created_at = ? WHERE id = ?');
      for (const msg of messagesWithOldTimestamp) {
        const createdAtISO = msg.created_at ? msg.created_at.replace(' ', 'T') + '.000Z' : null;
        updateMsgStmt.run(createdAtISO, msg.id);
      }
      console.log(`  ✓ Migration: Converted ${messagesWithOldTimestamp.length} message timestamps to ISO format`);
    }
  } catch (e) {
    // Migration might have already been applied or no old timestamps exist
  }

  // Add box-related columns to products table
  const productsTableInfo = db.prepare("PRAGMA table_info(products)").all() as Array<{ name: string }>;
  const productsColumnNames = productsTableInfo.map(col => col.name);

  if (!productsColumnNames.includes('is_box')) {
    try {
      db.exec("ALTER TABLE products ADD COLUMN is_box INTEGER DEFAULT 0");
      console.log('  ✓ Migration: Added is_box column to products');
    } catch (e) {
      // Column might already exist
    }
  }

  if (!productsColumnNames.includes('box_category')) {
    try {
      db.exec("ALTER TABLE products ADD COLUMN box_category TEXT");
      console.log('  ✓ Migration: Added box_category column to products');
    } catch (e) {
      // Column might already exist
    }
  }

  if (!productsColumnNames.includes('box_size')) {
    try {
      db.exec("ALTER TABLE products ADD COLUMN box_size INTEGER DEFAULT 6");
      console.log('  ✓ Migration: Added box_size column to products');
    } catch (e) {
      // Column might already exist
    }
  }

  // Note: Boxes category is created dynamically when admin creates a box product
  // It will be auto-deleted when the last box product is removed

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

// Get database storage usage
export function getStorageUsage() {
  const dbPath = path.resolve(DB_PATH);
  const dbDir = path.dirname(dbPath);
  
  let totalSize = 0;
  const files: { name: string; size: number }[] = [];
  
  // Get all database-related files
  const dbFiles = ['database.sqlite', 'database.sqlite-wal', 'database.sqlite-shm'];
  for (const file of dbFiles) {
    const filePath = path.join(dbDir, file);
    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);
      files.push({ name: file, size: stats.size });
      totalSize += stats.size;
    }
  }
  
  // Get table row counts
  const tables = db.prepare(`
    SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'
  `).all() as { name: string }[];
  
  const tableCounts: Record<string, number> = {};
  for (const { name } of tables) {
    const result = db.prepare(`SELECT COUNT(*) as count FROM ${name}`).get() as { count: number };
    tableCounts[name] = result.count;
  }
  
  // Run checkpoint to optimize WAL file
  db.pragma('wal_checkpoint(PASSIVE)');
  
  // Get server disk space
  const diskSpace = getDiskSpace(dbDir);
  
  return {
    totalSize,
    files,
    tableCounts,
    formattedSize: formatBytes(totalSize),
    diskSpace,
  };
}

// Get disk space for the partition containing the given path
function getDiskSpace(dirPath: string): { total: number; free: number; used: number; usedPercent: number } | null {
  try {
    const isWindows = process.platform === 'win32';
    
    if (isWindows) {
      // Windows: Use WMIC which is more reliable than PowerShell in child processes
      const driveLetter = path.resolve(dirPath).charAt(0).toUpperCase();
      const output = execSync(
        `wmic logicaldisk where "DeviceID='${driveLetter}:'" get FreeSpace,Size /format:csv`,
        { encoding: 'utf-8', timeout: 5000, windowsHide: true }
      ).trim();
      
      // Parse CSV output: Node,FreeSpace,Size
      const lines = output.split(/\r?\n/).filter(l => l.trim() && !l.startsWith('Node'));
      if (lines.length > 0) {
        const parts = lines[0].split(',');
        if (parts.length >= 3) {
          const free = parseInt(parts[1], 10);
          const total = parseInt(parts[2], 10);
          const used = total - free;
          return {
            total,
            free,
            used,
            usedPercent: total > 0 ? Math.round((used / total) * 100) : 0,
          };
        }
      }
    } else {
      // Linux/Mac: Use df command
      const output = execSync(`df -B1 "${dirPath}" | tail -1`, { encoding: 'utf-8', timeout: 5000 }).trim();
      const parts = output.split(/\s+/);
      if (parts.length >= 4) {
        const total = parseInt(parts[1], 10);
        const used = parseInt(parts[2], 10);
        const free = parseInt(parts[3], 10);
        return {
          total,
          free,
          used,
          usedPercent: total > 0 ? Math.round((used / total) * 100) : 0,
        };
      }
    }
  } catch (error) {
    console.error('Error getting disk space:', error);
  }
  return null;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Aggregate orders older than specified months into analytics
export function aggregateOldOrders(monthsOld: number = 6) {
  const cutoffDate = new Date();
  cutoffDate.setMonth(cutoffDate.getMonth() - monthsOld);
  const cutoffStr = cutoffDate.toISOString().slice(0, 10);
  
  // Get orders to aggregate (grouped by month)
  const ordersToAggregate = db.prepare(`
    SELECT 
      strftime('%Y-%m-01', created_at) as period_start,
      COUNT(*) as total_orders,
      COALESCE(SUM(total), 0) as total_revenue,
      GROUP_CONCAT(items) as all_items,
      GROUP_CONCAT(order_status) as all_statuses
    FROM orders 
    WHERE DATE(created_at) < ?
    GROUP BY strftime('%Y-%m', created_at)
  `).all(cutoffStr) as any[];
  
  if (ordersToAggregate.length === 0) {
    return { aggregated: 0, deleted: 0 };
  }
  
  let aggregatedCount = 0;
  let deletedCount = 0;
  
  const insertAnalytics = db.prepare(`
    INSERT OR REPLACE INTO order_analytics 
    (period_type, period_start, period_end, total_orders, total_revenue, total_items_sold, orders_by_status, revenue_by_category, top_products)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  const deleteOldOrders = db.prepare(`
    DELETE FROM orders WHERE DATE(created_at) < ? AND strftime('%Y-%m', created_at) = ?
  `);
  
  const transaction = db.transaction(() => {
    for (const monthData of ordersToAggregate) {
      // Calculate period end (last day of month)
      const periodStart = new Date(monthData.period_start);
      const periodEnd = new Date(periodStart.getFullYear(), periodStart.getMonth() + 1, 0);
      const periodEndStr = periodEnd.toISOString().slice(0, 10);
      
      // Parse all items to calculate totals
      let totalItems = 0;
      const categoryRevenue: Record<string, number> = {};
      const productCounts: Record<string, number> = {};
      
      const allItemsArrays = monthData.all_items.split('],[').map((chunk: string) => {
        try {
          if (!chunk.startsWith('[')) chunk = '[' + chunk;
          if (!chunk.endsWith(']')) chunk = chunk + ']';
          return JSON.parse(chunk);
        } catch {
          return [];
        }
      });
      
      for (const items of allItemsArrays) {
        for (const item of items) {
          if (item && item.quantity) {
            totalItems += item.quantity;
            const itemRevenue = (item.price || 0) * item.quantity;
            categoryRevenue[item.category || 'other'] = (categoryRevenue[item.category || 'other'] || 0) + itemRevenue;
            productCounts[item.name || 'Unknown'] = (productCounts[item.name || 'Unknown'] || 0) + item.quantity;
          }
        }
      }
      
      // Calculate orders by status
      const statusCounts: Record<string, number> = {};
      const allStatuses = monthData.all_statuses.split(',');
      for (const status of allStatuses) {
        statusCounts[status] = (statusCounts[status] || 0) + 1;
      }
      
      // Get top 10 products
      const topProducts = Object.entries(productCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([name, quantity]) => ({ name, quantity }));
      
      // Insert aggregated data
      insertAnalytics.run(
        'monthly',
        monthData.period_start,
        periodEndStr,
        monthData.total_orders,
        monthData.total_revenue,
        totalItems,
        JSON.stringify(statusCounts),
        JSON.stringify(categoryRevenue),
        JSON.stringify(topProducts)
      );
      
      // Delete the old orders
      const yearMonth = monthData.period_start.slice(0, 7);
      const result = deleteOldOrders.run(cutoffStr, yearMonth);
      
      aggregatedCount++;
      deletedCount += result.changes;
    }
  });
  
  transaction();
  
  // Vacuum to reclaim space
  db.exec('VACUUM');
  
  console.log(`📊 Aggregated ${aggregatedCount} months, deleted ${deletedCount} old orders`);
  
  return { aggregated: aggregatedCount, deleted: deletedCount };
}

// Get historical analytics (from aggregated data)
export function getHistoricalAnalytics() {
  return db.prepare(`
    SELECT * FROM order_analytics 
    WHERE period_type = 'monthly'
    ORDER BY period_start DESC
    LIMIT 24
  `).all();
}

export default db;
