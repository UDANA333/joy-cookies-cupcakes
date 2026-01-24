import db, { initDatabase } from './database';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function seed() {
  console.log('🌱 Seeding database...');

  // Initialize database tables first
  initDatabase();

  // Check if admin already exists
  const existingAdmin = db.prepare('SELECT id FROM admins WHERE email = ?').get(process.env.ADMIN_EMAIL || 'admin@joycookiescupcakes.com');

  if (existingAdmin) {
    console.log('👤 Admin user already exists, skipping...');
    return;
  }

  // Create default admin user
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@joycookiescupcakes.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'change-this-password';
  const adminName = process.env.ADMIN_NAME || 'Joy Cookies Admin';
  const passwordHash = await bcrypt.hash(adminPassword, 12);

  const adminId = uuidv4();
  db.prepare(`
    INSERT INTO admins (id, email, password_hash, name)
    VALUES (?, ?, ?, ?)
  `).run(
    adminId,
    adminEmail,
    passwordHash,
    adminName
  );

  console.log('✅ Admin user created');
  console.log(`   Email: ${adminEmail}`);
  console.log('   ⚠️  Remember to change the default password in production!');
}

seed()
  .then(() => {
    console.log('🎉 Seeding complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  });
