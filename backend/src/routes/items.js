const express = require('express');
const { query } = require('../db');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

/**
 * GET /items
 * Get items for a store, optionally filtered by category
 */
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { store_id, category, search, available_only, limit, offset } = req.query;
    if (!store_id) {
      return res.status(400).json({ success: false, message: 'store_id required' });
    }

    let sql = `
      SELECT 
        si.*,
        COALESCE(si.name, mp.name) as name,
        COALESCE(si.category, mp.category) as category,
        COALESCE(si.image_url, mp.default_image) as image_url,
        COALESCE(si.description, mp.default_description) as description,
        COALESCE(si.unit, mp.default_unit) as unit
      FROM store_items si
      LEFT JOIN master_products mp ON si.product_id = mp.id
      WHERE si.store_id = $1
    `;
    const params = [store_id];
    let idx = 2;

    if (category) {
      sql += ` AND (si.category = $${idx} OR mp.category = $${idx})`;
      params.push(category);
      idx++;
    }
    if (search) {
      sql += ` AND (si.name ILIKE $${idx} OR mp.name ILIKE $${idx})`;
      params.push(`%${search}%`);
      idx++;
    }
    if (available_only === 'true') {
      sql += ` AND si.is_available = TRUE`;
    }
    sql += ` ORDER BY category, name`;

    if (limit) {
      sql += ` LIMIT $${idx}`;
      params.push(parseInt(limit, 10));
      idx++;
    }
    if (offset) {
      sql += ` OFFSET $${idx}`;
      params.push(parseInt(offset, 10));
      idx++;
    }

    const result = await query(sql, params);
    res.json({ success: true, items: result.rows });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /items/:id
 */
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const result = await query(`
      SELECT 
        si.*,
        COALESCE(si.name, mp.name) as name,
        COALESCE(si.category, mp.category) as category,
        COALESCE(si.image_url, mp.default_image) as image_url,
        COALESCE(si.description, mp.default_description) as description,
        COALESCE(si.unit, mp.default_unit) as unit
      FROM store_items si
      LEFT JOIN master_products mp ON si.product_id = mp.id
      WHERE si.id = $1`, [req.params.id]);
    if (!result.rows.length) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }
    res.json({ success: true, item: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /items
 * Create item (store_owner only)
 */
router.post('/', authenticate, requireRole('store_owner'), async (req, res, next) => {
  try {
    const {
      store_id, product_id, name, description, category,
      price_per_kg, price_per_unit, is_weight_based,
      unit, stock_qty, low_stock_alert, image_url, is_custom = false
    } = req.body;

    // Verify ownership
    const ownership = await query(
      `SELECT id FROM stores WHERE id = $1 AND owner_id = $2`,
      [store_id, req.user.id]
    );
    if (!ownership.rows.length) {
      return res.status(403).json({ success: false, message: 'Not your store' });
    }

    const result = await query(
      `INSERT INTO store_items (store_id, product_id, name, description, category, price_per_kg, price_per_unit,
                                is_weight_based, unit, stock_qty, low_stock_alert, image_url, is_custom)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
       RETURNING *`,
      [store_id, product_id, name, description, category, price_per_kg, price_per_unit,
       is_weight_based !== false, unit || 'kg', stock_qty || 0, low_stock_alert || 1, image_url, is_custom]
    );

    if (req.io) {
      req.io.to(`store:${store_id}`).emit('item:new', result.rows[0]);
    }

    res.status(201).json({ success: true, item: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /items/:id
 * Update item (store_owner only)
 */
router.patch('/:id', authenticate, requireRole('store_owner'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      name, description, category, price_per_kg, price_per_unit,
      is_weight_based, unit, stock_qty, low_stock_alert, is_available, image_url
    } = req.body;

    // Verify ownership via store
    const ownership = await query(
      `SELECT si.id, si.store_id FROM store_items si
       JOIN stores s ON s.id = si.store_id
       WHERE si.id = $1 AND s.owner_id = $2`,
      [id, req.user.id]
    );
    if (!ownership.rows.length) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const result = await query(
      `UPDATE store_items SET
         name = COALESCE($1, name),
         description = COALESCE($2, description),
         category = COALESCE($3::item_category, category),
         price_per_kg = COALESCE($4, price_per_kg),
         price_per_unit = COALESCE($5, price_per_unit),
         is_weight_based = COALESCE($6, is_weight_based),
         unit = COALESCE($7, unit),
         stock_qty = COALESCE($8, stock_qty),
         low_stock_alert = COALESCE($9, low_stock_alert),
         is_available = COALESCE($10, is_available),
         image_url = COALESCE($11, image_url),
         updated_at = NOW()
       WHERE id = $12
       RETURNING *`,
      [name, description, category, price_per_kg, price_per_unit, is_weight_based,
       unit, stock_qty, low_stock_alert, is_available, image_url, id]
    );

    const item = result.rows[0];

    // Emit availability change in real-time
    if (req.io && is_available !== undefined) {
      req.io.to(`store:${item.store_id}`).emit('item:availability_change', {
        item_id: item.id, is_available: item.is_available
      });
    }

    res.json({ success: true, item });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /items/:id
 * Delete item (store_owner only)
 */
router.delete('/:id', authenticate, requireRole('store_owner'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const ownership = await query(
      `SELECT si.id FROM store_items si JOIN stores s ON s.id = si.store_id WHERE si.id = $1 AND s.owner_id = $2`,
      [id, req.user.id]
    );
    if (!ownership.rows.length) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    await query(`DELETE FROM store_items WHERE id = $1`, [id]);
    res.json({ success: true, message: 'Item deleted' });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /items/categories/list
 * Return all categories
 */
router.get('/categories/list', authenticate, async (req, res) => {
  const categories = [
    'Biscuits & Snacks', 'Wafers & Chips', 'Beverages', 'Dairy',
    'Grocery Staples', 'Cleaning & Washing', 'Personal Care',
    'Packaged Foods', 'Spices', 'Oils & Ghee'
  ];
  res.json({ success: true, categories });
});

module.exports = router;
