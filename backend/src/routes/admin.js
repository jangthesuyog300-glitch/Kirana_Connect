const express = require('express');
const jwt = require('jsonwebtoken');
const { query, getClient } = require('../db');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

const normalizePhone = (rawPhone = '') => {
  const digits = String(rawPhone).replace(/\D/g, '');
  if (!digits) return '';
  if (digits.length >= 10) return `+91${digits.slice(-10)}`;
  return `+${digits}`;
};

// Admin = store_owner
router.use(authenticate, requireRole('store_owner'));

/**
 * GET /admin/workers
 * List workers for my store
 */
router.get('/workers', async (req, res, next) => {
  try {
    const storeRes = await query(`SELECT id FROM stores WHERE owner_id = $1 LIMIT 1`, [req.user.id]);
    if (!storeRes.rows.length) return res.status(404).json({ success: false, message: 'Store not found' });
    const storeId = storeRes.rows[0].id;

    const workersRes = await query(
      `SELECT u.id, u.phone, u.name, u.role, sw.is_active,
              ws.is_busy, ws.active_order_id
       FROM store_workers sw
       JOIN users u ON u.id = sw.worker_id
       LEFT JOIN worker_status ws ON ws.worker_id = u.id
       WHERE sw.store_id = $1
       ORDER BY sw.created_at DESC`,
      [storeId]
    );
    res.json({ success: true, workers: workersRes.rows });
  } catch (e) {
    next(e);
  }
});

/**
 * POST /admin/workers
 * Create (or re-activate) a worker for my store.
 * Body: { name, phone }
 */
router.post('/workers', async (req, res, next) => {
  const client = await getClient();
  try {
    const { name, phone } = req.body || {};
    const normalizedPhone = normalizePhone(phone);
    if (!name || !normalizedPhone) {
      return res.status(400).json({ success: false, message: 'name and phone required' });
    }

    const storeRes = await client.query(`SELECT id FROM stores WHERE owner_id = $1 LIMIT 1`, [req.user.id]);
    if (!storeRes.rows.length) return res.status(404).json({ success: false, message: 'Store not found' });
    const storeId = storeRes.rows[0].id;

    await client.query('BEGIN');

    // Upsert worker user
    const userRes = await client.query(
      `INSERT INTO users (phone, name, role)
       VALUES ($1, $2, 'worker')
       ON CONFLICT (phone) DO UPDATE SET
         name = EXCLUDED.name,
         role = 'worker',
         updated_at = NOW()
       RETURNING id, phone, name, role`,
      [normalizedPhone, name]
    );
    const worker = userRes.rows[0];

    // Attach to store
    await client.query(
      `INSERT INTO store_workers (store_id, worker_id, is_active)
       VALUES ($1, $2, TRUE)
       ON CONFLICT (store_id, worker_id) DO UPDATE SET is_active = TRUE`,
      [storeId, worker.id]
    );

    // Ensure worker_status row exists
    await client.query(
      `INSERT INTO worker_status (worker_id, store_id, is_busy, active_order_id)
       VALUES ($1, $2, FALSE, NULL)
       ON CONFLICT (worker_id) DO UPDATE SET store_id = EXCLUDED.store_id`,
      [worker.id, storeId]
    );

    await client.query('COMMIT');

    res.status(201).json({ success: true, worker });
  } catch (e) {
    await client.query('ROLLBACK');
    next(e);
  } finally {
    client.release();
  }
});

/**
 * DELETE /admin/workers/:workerId
 * Soft-remove worker from store
 */
router.delete('/workers/:workerId', async (req, res, next) => {
  try {
    const { workerId } = req.params;
    const storeRes = await query(`SELECT id FROM stores WHERE owner_id = $1 LIMIT 1`, [req.user.id]);
    if (!storeRes.rows.length) return res.status(404).json({ success: false, message: 'Store not found' });
    const storeId = storeRes.rows[0].id;

    await query(
      `UPDATE store_workers SET is_active = FALSE WHERE store_id = $1 AND worker_id = $2`,
      [storeId, workerId]
    );
    res.json({ success: true });
  } catch (e) {
    next(e);
  }
});

module.exports = router;

