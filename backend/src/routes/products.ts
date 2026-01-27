import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db/database';
import { authenticateAdmin } from '../middleware/auth';

const router = Router();

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
    const { name, price, category, description, image_path } = req.body;
    
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
      INSERT INTO products (id, name, price, category, description, image_path, display_order)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, name, price, category, description || '', image_path || '', maxOrder.max_order + 1);
    
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
    const { name, description, price, category, image_path, is_available, display_order } = req.body;
    
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
    
    const result = db.prepare('DELETE FROM products WHERE id = ?').run(id);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Product not found' });
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

export default router;
