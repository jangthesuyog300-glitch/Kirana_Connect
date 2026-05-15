const express = require('express');
const { query } = require('../db');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

/**
 * GET /stores/nearby
 * Fetch nearby stores within radius (default 5km)
 * Query: lat, lng, radius (km), limit
 */
router.get('/nearby', authenticate, async (req, res, next) => {
  try {
    const { lat, lng, radius = 5, limit = 30 } = req.query;
    if (!lat || !lng) {
      return res.status(400).json({ success: false, message: 'lat and lng required' });
    }

    const result = await query(
      `SELECT
         s.id, s.name, s.category, s.description, s.image_url, s.address,
         s.rating, s.total_ratings, s.is_open,
         s.delivery_enabled, s.delivery_radius, s.min_order_amount,
         s.opening_time, s.closing_time,
         ST_Distance(s.location, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography) / 1000 AS distance_km,
         EXISTS(SELECT 1 FROM favourites f WHERE f.store_id = s.id AND f.customer_id = $5) AS is_favourite
       FROM stores s
       WHERE ST_DWithin(
         s.location,
         ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
         $3 * 1000
       )
       ORDER BY s.rating DESC, distance_km ASC
       LIMIT $4`,
      [lng, lat, radius, limit, req.user.id]
    );

    res.json({ success: true, stores: result.rows });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /stores/:id
 * Get single store details
 */
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { lat, lng } = req.query;

    const distanceExpr = lat && lng
      ? `ST_Distance(s.location, ST_SetSRID(ST_MakePoint(${parseFloat(lng)}, ${parseFloat(lat)}), 4326)::geography) / 1000`
      : 'NULL';

    const result = await query(
      `SELECT s.*, u.name AS owner_name, u.phone AS owner_phone,
              ${distanceExpr} AS distance_km,
              EXISTS(SELECT 1 FROM favourites f WHERE f.store_id = s.id AND f.customer_id = $2) AS is_favourite
       FROM stores s
       JOIN users u ON u.id = s.owner_id
       WHERE s.id = $1`,
      [id, req.user.id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ success: false, message: 'Store not found' });
    }

    res.json({ success: true, store: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /stores
 * Create a store (store_owner only)
 */
router.post('/', authenticate, requireRole('store_owner'), async (req, res, next) => {
  try {
    const { name, description, address, lat, lng, phone, opening_time, closing_time } = req.body;
    if (!name || !lat || !lng) {
      return res.status(400).json({ success: false, message: 'name, lat, lng required' });
    }

    // Check if user already has a store
    const existing = await query(`SELECT id FROM stores WHERE owner_id = $1`, [req.user.id]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'You can only manage one store with this account.' 
      });
    }

    const result = await query(
      `INSERT INTO stores (owner_id, name, description, address, location, phone, opening_time, closing_time)
       VALUES ($1, $2, $3, $4, ST_SetSRID(ST_MakePoint($5, $6), 4326)::geography, $7, $8, $9)
       RETURNING *`,
      [req.user.id, name, description, address, lng, lat, phone, opening_time || '08:00', closing_time || '22:00']
    );

    res.status(201).json({ success: true, store: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /stores/:id
 * Update store settings (owner only)
 */
router.patch('/:id', authenticate, requireRole('store_owner'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      name, description, address, phone,
      is_open, delivery_enabled, delivery_radius,
      min_order_amount, opening_time, closing_time, image_url
    } = req.body;

    // Verify ownership
    const ownership = await query(`SELECT id FROM stores WHERE id = $1 AND owner_id = $2`, [id, req.user.id]);
    if (!ownership.rows.length) {
      return res.status(403).json({ success: false, message: 'Not your store' });
    }

    const result = await query(
      `UPDATE stores SET
         name = COALESCE($1, name),
         description = COALESCE($2, description),
         address = COALESCE($3, address),
         phone = COALESCE($4, phone),
         is_open = COALESCE($5, is_open),
         delivery_enabled = COALESCE($6, delivery_enabled),
         delivery_radius = COALESCE($7, delivery_radius),
         min_order_amount = COALESCE($8, min_order_amount),
         opening_time = COALESCE($9, opening_time),
         closing_time = COALESCE($10, closing_time),
         image_url = COALESCE($11, image_url),
         updated_at = NOW()
       WHERE id = $12
       RETURNING *`,
      [name, description, address, phone, is_open, delivery_enabled, delivery_radius,
       min_order_amount, opening_time, closing_time, image_url, id]
    );

    // Emit real-time update
    if (req.io) {
      req.io.to(`store:${id}`).emit('store:updated', result.rows[0]);
    }

    res.json({ success: true, store: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /stores/my/store
 * Get the store owned by the current user
 */
router.get('/my/store', authenticate, requireRole('store_owner'), async (req, res, next) => {
  try {
    const result = await query(
      `SELECT * FROM stores WHERE owner_id = $1 ORDER BY created_at DESC LIMIT 1`,
      [req.user.id]
    );
    if (!result.rows.length) {
      return res.status(404).json({ success: false, message: 'No store found for this owner' });
    }
    res.json({ success: true, store: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /stores/:id/favourite
 * Toggle favourite store
 */
router.post('/:id/favourite', authenticate, requireRole('customer'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await query(
      `SELECT id FROM favourites WHERE customer_id = $1 AND store_id = $2`,
      [req.user.id, id]
    );

    if (existing.rows.length) {
      await query(`DELETE FROM favourites WHERE customer_id = $1 AND store_id = $2`, [req.user.id, id]);
      res.json({ success: true, is_favourite: false });
    } else {
      await query(`INSERT INTO favourites (customer_id, store_id) VALUES ($1, $2)`, [req.user.id, id]);
      res.json({ success: true, is_favourite: true });
    }
  } catch (error) {
    next(error);
  }
});

/**
 * GET /stores/my/favourites
 * Get favourite stores
 */
router.get('/my/favourites', authenticate, requireRole('customer'), async (req, res, next) => {
  try {
    const result = await query(
      `SELECT s.*, f.created_at AS favourited_at
       FROM stores s
       JOIN favourites f ON f.store_id = s.id
       WHERE f.customer_id = $1
       ORDER BY f.created_at DESC`,
      [req.user.id]
    );
    res.json({ success: true, stores: result.rows });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
