import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import multer from 'multer';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import db from '../db/database';
import { authenticateAdmin } from '../middleware/auth';

const router = Router();

// Configure multer for image uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.'));
    }
  },
});

// Get the uploads directory path (frontend/public/uploads)
function getUploadsDir(): string {
  // In production, this should be configurable
  const uploadsDir = process.env.UPLOADS_DIR || path.join(__dirname, '../../../frontend/public/uploads');
  
  // Ensure directory exists
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  
  return uploadsDir;
}

interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  description: string;
  image_path: string;
  is_available: number;
  display_order: number;
  created_at: string;
  updated_at: string;
  is_box: number;
  box_category: string | null;
  box_size: number | null;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  display_order: number;
  created_at: string;
}

// GET /api/products - Get all available products (public)
router.get('/', (req, res) => {
  try {
    const products = db.prepare(`
      SELECT * FROM products 
      WHERE is_available = 1 
      ORDER BY category, display_order
    `).all() as Product[];
    
    res.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// GET /api/products/categories - Get all categories (public)
router.get('/categories', (req, res) => {
  try {
    const categories = db.prepare(`
      SELECT * FROM categories ORDER BY display_order
    `).all() as Category[];
    
    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// GET /api/products/all - Get all products including unavailable (admin)
router.get('/all', authenticateAdmin, (req, res) => {
  try {
    const products = db.prepare(`
      SELECT * FROM products 
      ORDER BY category, display_order
    `).all() as Product[];
    
    res.json(products);
  } catch (error) {
    console.error('Error fetching all products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// POST /api/products - Create new product (admin)
router.post('/', authenticateAdmin, (req, res) => {
  try {
    const { name, price, category, description, image_path, is_box, box_category, box_size } = req.body;
    
    if (!name || typeof price !== 'number' || !category) {
      return res.status(400).json({ error: 'Name, price, and category are required' });
    }
    
    // Get max display_order for this category
    const maxOrder = db.prepare(`
      SELECT COALESCE(MAX(display_order), 0) as max_order 
      FROM products WHERE category = ?
    `).get(category) as { max_order: number };
    
    const id = uuidv4();
    
    db.prepare(`
      INSERT INTO products (id, name, price, category, description, image_path, display_order, is_box, box_category, box_size)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, name, price, category, description || '', image_path || '', maxOrder.max_order + 1, is_box ? 1 : 0, box_category || null, box_size || 6);
    
    const newProduct = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
    
    res.status(201).json({ success: true, product: newProduct });
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

// PATCH /api/products/:id - Update product (admin)
router.patch('/:id', authenticateAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, category, image_path, is_available, display_order, is_box, box_category, box_size } = req.body;
    
    // Build dynamic update query
    const updates: string[] = [];
    const values: any[] = [];
    
    if (name !== undefined) {
      updates.push('name = ?');
      values.push(name);
    }
    if (description !== undefined) {
      updates.push('description = ?');
      values.push(description);
    }
    if (price !== undefined) {
      if (typeof price !== 'number' || price < 0) {
        return res.status(400).json({ error: 'Price must be a positive number' });
      }
      updates.push('price = ?');
      values.push(price);
    }
    if (category !== undefined) {
      updates.push('category = ?');
      values.push(category);
    }
    if (image_path !== undefined) {
      updates.push('image_path = ?');
      values.push(image_path);
    }
    if (is_available !== undefined) {
      updates.push('is_available = ?');
      values.push(is_available ? 1 : 0);
    }
    if (display_order !== undefined) {
      updates.push('display_order = ?');
      values.push(display_order);
    }
    if (is_box !== undefined) {
      updates.push('is_box = ?');
      values.push(is_box ? 1 : 0);
    }
    if (box_category !== undefined) {
      updates.push('box_category = ?');
      values.push(box_category);
    }
    if (box_size !== undefined) {
      updates.push('box_size = ?');
      values.push(box_size);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }
    
    updates.push("updated_at = datetime('now')");
    values.push(id);
    
    const result = db.prepare(`
      UPDATE products 
      SET ${updates.join(', ')}
      WHERE id = ?
    `).run(...values);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    const updatedProduct = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
    res.json({ success: true, product: updatedProduct });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// DELETE /api/products/:id - Delete product (admin)
router.delete('/:id', authenticateAdmin, (req, res) => {
  try {
    const { id } = req.params;
    
    // Get the product's category before deleting
    const product = db.prepare('SELECT category FROM products WHERE id = ?').get(id) as { category: string } | undefined;
    
    const result = db.prepare('DELETE FROM products WHERE id = ?').run(id);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    // Check if this was the last product in the category - if so, delete the category
    if (product) {
      const remainingProducts = db.prepare(
        'SELECT COUNT(*) as count FROM products WHERE category = ?'
      ).get(product.category) as { count: number };
      
      if (remainingProducts.count === 0) {
        // Delete the empty category
        db.prepare('DELETE FROM categories WHERE slug = ?').run(product.category);
        console.log(`Deleted empty category: ${product.category}`);
      }
    }
    
    res.json({ success: true, message: 'Product deleted' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

// ============================================
// CATEGORY ROUTES
// ============================================

// POST /api/products/categories - Create new category (admin)
router.post('/categories', authenticateAdmin, (req, res) => {
  try {
    const { name } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Category name is required' });
    }
    
    // Generate slug from name
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '').replace(/\s+/g, '');
    
    // Check if slug already exists
    const existing = db.prepare('SELECT * FROM categories WHERE slug = ?').get(slug);
    if (existing) {
      return res.status(400).json({ error: 'Category already exists' });
    }
    
    // Get max display_order
    const maxOrder = db.prepare(`
      SELECT COALESCE(MAX(display_order), 0) as max_order FROM categories
    `).get() as { max_order: number };
    
    const id = uuidv4();
    
    db.prepare(`
      INSERT INTO categories (id, name, slug, display_order)
      VALUES (?, ?, ?, ?)
    `).run(id, name, slug, maxOrder.max_order + 1);
    
    const newCategory = db.prepare('SELECT * FROM categories WHERE id = ?').get(id);
    
    res.status(201).json({ success: true, category: newCategory });
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ error: 'Failed to create category' });
  }
});

// PATCH /api/products/categories/:id - Update category (admin)
router.patch('/categories/:id', authenticateAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const { name, display_order } = req.body;
    
    const updates: string[] = [];
    const values: any[] = [];
    
    if (name !== undefined) {
      updates.push('name = ?');
      values.push(name);
      // Update slug too
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '').replace(/\s+/g, '');
      updates.push('slug = ?');
      values.push(slug);
    }
    if (display_order !== undefined) {
      updates.push('display_order = ?');
      values.push(display_order);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }
    
    values.push(id);
    
    const result = db.prepare(`
      UPDATE categories SET ${updates.join(', ')} WHERE id = ?
    `).run(...values);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }
    
    const updatedCategory = db.prepare('SELECT * FROM categories WHERE id = ?').get(id);
    res.json({ success: true, category: updatedCategory });
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({ error: 'Failed to update category' });
  }
});

// DELETE /api/products/categories/:id - Delete category (admin)
router.delete('/categories/:id', authenticateAdmin, (req, res) => {
  try {
    const { id } = req.params;
    
    // Get category to check products
    const category = db.prepare('SELECT * FROM categories WHERE id = ?').get(id) as Category | undefined;
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }
    
    // Check if category has products
    const productCount = db.prepare('SELECT COUNT(*) as count FROM products WHERE category = ?').get(category.slug) as { count: number };
    if (productCount.count > 0) {
      return res.status(400).json({ 
        error: `Cannot delete category with ${productCount.count} products. Delete or move products first.` 
      });
    }
    
    db.prepare('DELETE FROM categories WHERE id = ?').run(id);
    
    res.json({ success: true, message: 'Category deleted' });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

// PATCH /api/products/category/:category/price - Update all prices for a category (admin)
router.patch('/category/:category/price', authenticateAdmin, (req, res) => {
  try {
    const { category } = req.params;
    const { price } = req.body;
    
    if (typeof price !== 'number' || price < 0) {
      return res.status(400).json({ error: 'Price must be a positive number' });
    }
    
    const result = db.prepare(`
      UPDATE products 
      SET price = ?, updated_at = datetime('now')
      WHERE category = ?
    `).run(price, category);
    
    res.json({ 
      success: true, 
      message: `Updated ${result.changes} products in ${category}` 
    });
  } catch (error) {
    console.error('Error updating category prices:', error);
    res.status(500).json({ error: 'Failed to update prices' });
  }
});

// POST /api/products/upload - Upload product image (admin)
router.post('/upload', authenticateAdmin, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    const { category } = req.body;
    if (!category) {
      return res.status(400).json({ error: 'Category is required' });
    }
    
    // Validate category exists in database OR is a valid slug format
    const existingCategory = db.prepare('SELECT * FROM categories WHERE slug = ?').get(category);
    // Allow if category exists OR if it's a valid slug format (for newly created categories)
    const isValidSlug = /^[a-z0-9]+$/.test(category);
    if (!existingCategory && !isValidSlug) {
      return res.status(400).json({ error: 'Invalid category' });
    }

    // Generate filename from original name, sanitized
    const originalName = path.parse(req.file.originalname).name;
    const sanitizedName = originalName.replace(/[^a-zA-Z0-9\s-]/g, '').trim();
    const filename = `${sanitizedName}.webp`;
    
    // Create category subfolder
    const uploadsDir = getUploadsDir();
    const categoryDir = path.join(uploadsDir, category);
    if (!fs.existsSync(categoryDir)) {
      fs.mkdirSync(categoryDir, { recursive: true });
    }

    const filepath = path.join(categoryDir, filename);

    // Process and save image as WebP
    await sharp(req.file.buffer)
      .resize(800, 800, { 
        fit: 'inside', 
        withoutEnlargement: true 
      })
      .webp({ quality: 85 })
      .toFile(filepath);

    // Return the path relative to public folder (for use in image_path)
    const relativePath = `uploads/${category}/${filename}`;
    
    console.log(`📷 Image uploaded: ${relativePath}`);

    res.json({ 
      success: true, 
      image_path: relativePath,
      filename: filename
    });
  } catch (error: any) {
    console.error('Error uploading image:', error);
    res.status(500).json({ error: error.message || 'Failed to upload image' });
  }
});

export default router;
