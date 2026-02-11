import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db/database';
import { authenticateAdmin } from '../middleware/auth';

const router = Router();

// Types
interface SeasonalTheme {
  id: string;
  name: string;
  slug: string;
  category_slug: string;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  icon: string;
  banner_text: string | null;
  banner_subtext: string | null;
  is_active: number;
  display_order: number;
  created_at: string;
  updated_at: string;
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
  is_box: number;
  box_category: string | null;
  box_size: number | null;
}

// ============================================
// PUBLIC ROUTES
// ============================================

// GET /api/seasonal/themes - Get all seasonal themes (public)
router.get('/themes', (req, res) => {
  try {
    const themes = db.prepare(`
      SELECT * FROM seasonal_themes 
      ORDER BY display_order, name
    `).all() as SeasonalTheme[];
    
    res.json(themes);
  } catch (error) {
    console.error('Error fetching seasonal themes:', error);
    res.status(500).json({ error: 'Failed to fetch seasonal themes' });
  }
});

// GET /api/seasonal/active - Get the currently active seasonal theme with its products
router.get('/active', (req, res) => {
  try {
    const theme = db.prepare(`
      SELECT * FROM seasonal_themes WHERE is_active = 1 LIMIT 1
    `).get() as SeasonalTheme | undefined;
    
    if (!theme) {
      return res.json({ theme: null, products: [] });
    }
    
    // Get products for this seasonal category
    const products = db.prepare(`
      SELECT * FROM products 
      WHERE category = ? AND is_available = 1
      ORDER BY display_order
    `).all(theme.category_slug) as Product[];
    
    res.json({ theme, products });
  } catch (error) {
    console.error('Error fetching active seasonal theme:', error);
    res.status(500).json({ error: 'Failed to fetch active seasonal theme' });
  }
});

// ============================================
// ADMIN ROUTES
// ============================================

// POST /api/seasonal/themes - Create new seasonal theme (admin)
router.post('/themes', authenticateAdmin, (req, res) => {
  try {
    const { 
      name, 
      category_slug, 
      primary_color, 
      secondary_color, 
      accent_color,
      icon, 
      banner_text,
      banner_subtext 
    } = req.body;
    
    if (!name || !category_slug) {
      return res.status(400).json({ error: 'Name and category are required' });
    }
    
    // Generate slug from name
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    
    // Check if slug already exists
    const existing = db.prepare('SELECT * FROM seasonal_themes WHERE slug = ?').get(slug);
    if (existing) {
      return res.status(400).json({ error: 'A theme with this name already exists' });
    }
    
    // Check if category exists
    const category = db.prepare('SELECT * FROM categories WHERE slug = ?').get(category_slug);
    if (!category) {
      return res.status(400).json({ error: 'Category does not exist' });
    }
    
    // Get max display_order
    const maxOrder = db.prepare(`
      SELECT COALESCE(MAX(display_order), 0) as max_order FROM seasonal_themes
    `).get() as { max_order: number };
    
    const id = uuidv4();
    
    db.prepare(`
      INSERT INTO seasonal_themes (
        id, name, slug, category_slug, 
        primary_color, secondary_color, accent_color,
        icon, banner_text, banner_subtext, display_order
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, 
      name, 
      slug, 
      category_slug,
      primary_color || '#FF6B9A',
      secondary_color || '#8B0A1A',
      accent_color || '#FFD700',
      icon || '🎉',
      banner_text || null,
      banner_subtext || null,
      maxOrder.max_order + 1
    );
    
    const newTheme = db.prepare('SELECT * FROM seasonal_themes WHERE id = ?').get(id);
    
    res.status(201).json({ success: true, theme: newTheme });
  } catch (error) {
    console.error('Error creating seasonal theme:', error);
    res.status(500).json({ error: 'Failed to create seasonal theme' });
  }
});

// PATCH /api/seasonal/themes/:id - Update seasonal theme (admin)
router.patch('/themes/:id', authenticateAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const { 
      name,
      category_slug, 
      primary_color, 
      secondary_color, 
      accent_color,
      icon, 
      banner_text,
      banner_subtext,
      display_order 
    } = req.body;
    
    // Build dynamic update query
    const updates: string[] = [];
    const values: any[] = [];
    
    if (name !== undefined) {
      updates.push('name = ?');
      values.push(name);
      // Also update slug
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      updates.push('slug = ?');
      values.push(slug);
    }
    if (category_slug !== undefined) {
      // Verify category exists
      const category = db.prepare('SELECT * FROM categories WHERE slug = ?').get(category_slug);
      if (!category) {
        return res.status(400).json({ error: 'Category does not exist' });
      }
      updates.push('category_slug = ?');
      values.push(category_slug);
    }
    if (primary_color !== undefined) {
      updates.push('primary_color = ?');
      values.push(primary_color);
    }
    if (secondary_color !== undefined) {
      updates.push('secondary_color = ?');
      values.push(secondary_color);
    }
    if (accent_color !== undefined) {
      updates.push('accent_color = ?');
      values.push(accent_color);
    }
    if (icon !== undefined) {
      updates.push('icon = ?');
      values.push(icon);
    }
    if (banner_text !== undefined) {
      updates.push('banner_text = ?');
      values.push(banner_text);
    }
    if (banner_subtext !== undefined) {
      updates.push('banner_subtext = ?');
      values.push(banner_subtext);
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
      UPDATE seasonal_themes 
      SET ${updates.join(', ')}
      WHERE id = ?
    `).run(...values);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Theme not found' });
    }
    
    const updatedTheme = db.prepare('SELECT * FROM seasonal_themes WHERE id = ?').get(id);
    res.json({ success: true, theme: updatedTheme });
  } catch (error) {
    console.error('Error updating seasonal theme:', error);
    res.status(500).json({ error: 'Failed to update seasonal theme' });
  }
});

// DELETE /api/seasonal/themes/:id - Delete seasonal theme (admin)
router.delete('/themes/:id', authenticateAdmin, (req, res) => {
  try {
    const { id } = req.params;
    
    const result = db.prepare('DELETE FROM seasonal_themes WHERE id = ?').run(id);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Theme not found' });
    }
    
    res.json({ success: true, message: 'Theme deleted' });
  } catch (error) {
    console.error('Error deleting seasonal theme:', error);
    res.status(500).json({ error: 'Failed to delete seasonal theme' });
  }
});

// PATCH /api/seasonal/themes/:id/activate - Activate a seasonal theme (admin)
router.patch('/themes/:id/activate', authenticateAdmin, (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if theme exists
    const theme = db.prepare('SELECT * FROM seasonal_themes WHERE id = ?').get(id) as SeasonalTheme | undefined;
    if (!theme) {
      return res.status(404).json({ error: 'Theme not found' });
    }
    
    // Deactivate all themes first
    db.prepare("UPDATE seasonal_themes SET is_active = 0, updated_at = datetime('now')").run();
    
    // Activate the selected theme
    db.prepare("UPDATE seasonal_themes SET is_active = 1, updated_at = datetime('now') WHERE id = ?").run(id);
    
    const updatedTheme = db.prepare('SELECT * FROM seasonal_themes WHERE id = ?').get(id);
    
    res.json({ success: true, theme: updatedTheme, message: `${theme.name} is now active` });
  } catch (error) {
    console.error('Error activating seasonal theme:', error);
    res.status(500).json({ error: 'Failed to activate seasonal theme' });
  }
});

// PATCH /api/seasonal/deactivate - Deactivate all seasonal themes (admin)
router.patch('/deactivate', authenticateAdmin, (req, res) => {
  try {
    db.prepare("UPDATE seasonal_themes SET is_active = 0, updated_at = datetime('now')").run();
    
    res.json({ success: true, message: 'All seasonal themes deactivated' });
  } catch (error) {
    console.error('Error deactivating seasonal themes:', error);
    res.status(500).json({ error: 'Failed to deactivate seasonal themes' });
  }
});

// GET /api/seasonal/presets - Get preset theme configurations (for admin UI)
router.get('/presets', authenticateAdmin, (req, res) => {
  const presets = [
    {
      name: "Valentine's Day",
      icon: '❤️',
      primary_color: '#FF6B9A',
      secondary_color: '#8B0A1A',
      accent_color: '#FFD700',
      banner_text: "Valentine's Treats Available!",
      banner_subtext: 'Show your love with something sweet'
    },
    {
      name: "St. Patrick's Day",
      icon: '🍀',
      primary_color: '#228B22',
      secondary_color: '#006400',
      accent_color: '#FFD700',
      banner_text: "Lucky Treats for St. Patty's!",
      banner_subtext: 'Get your pot of gold'
    },
    {
      name: 'Easter',
      icon: '🐰',
      primary_color: '#FFB6C1',
      secondary_color: '#87CEEB',
      accent_color: '#DDA0DD',
      banner_text: 'Easter Treats Are Here!',
      banner_subtext: 'Hop into something delicious'
    },
    {
      name: 'Summer',
      icon: '☀️',
      primary_color: '#FF6347',
      secondary_color: '#FFD700',
      accent_color: '#00CED1',
      banner_text: 'Summer Specials!',
      banner_subtext: 'Beat the heat with sweet treats'
    },
    {
      name: 'Independence Day',
      icon: '🎆',
      primary_color: '#B22234',
      secondary_color: '#3C3B6E',
      accent_color: '#FFFFFF',
      banner_text: '4th of July Treats!',
      banner_subtext: 'Celebrate with sweet freedom'
    },
    {
      name: 'Halloween',
      icon: '🎃',
      primary_color: '#FF6600',
      secondary_color: '#4A0080',
      accent_color: '#32CD32',
      banner_text: 'Spooky Treats Available!',
      banner_subtext: 'Frighteningly delicious'
    },
    {
      name: 'Thanksgiving',
      icon: '🦃',
      primary_color: '#D2691E',
      secondary_color: '#8B4513',
      accent_color: '#FFD700',
      banner_text: 'Thanksgiving Specials!',
      banner_subtext: 'Grateful for something sweet'
    },
    {
      name: 'Christmas',
      icon: '🎄',
      primary_color: '#C41E3A',
      secondary_color: '#228B22',
      accent_color: '#FFD700',
      banner_text: 'Holiday Treats Are Here!',
      banner_subtext: 'Make the season sweeter'
    },
    {
      name: 'New Year',
      icon: '🎊',
      primary_color: '#FFD700',
      secondary_color: '#C0C0C0',
      accent_color: '#000000',
      banner_text: 'New Year Specials!',
      banner_subtext: 'Start the year sweet'
    }
  ];
  
  res.json(presets);
});

export default router;
