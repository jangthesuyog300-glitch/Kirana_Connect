const express = require('express');
const router = express.Router();
const { query } = require('../db');

/**
 * @route   GET /api/catalog
 * @desc    Get master products (with optional search)
 * @access  Private (Store Owner)
 */
router.get('/', async (req, res) => {
  try {
    const { search, category } = req.query;
    
    let sql = 'SELECT * FROM master_products';
    let params = [];
    
    if (search || category) {
      sql += ' WHERE 1=1';
      if (search) {
        params.push(`%${search}%`);
        sql += ` AND (name ILIKE $${params.length} OR default_description ILIKE $${params.length})`;
      }
      if (category) {
        params.push(category);
        sql += ` AND category = $${params.length}`;
      }
    }
    
    sql += ' ORDER BY name ASC';
    
    const result = await query(sql, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching catalog:', error);
    res.status(500).json({ error: 'Server error fetching catalog' });
  }
});

/**
 * @route   GET /api/catalog/categories
 * @desc    Get all categories from master products
 * @access  Private
 */
router.get('/categories', async (req, res) => {
  try {
    const result = await query('SELECT DISTINCT category FROM master_products ORDER BY category ASC');
    res.json(result.rows.map(r => r.category));
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
