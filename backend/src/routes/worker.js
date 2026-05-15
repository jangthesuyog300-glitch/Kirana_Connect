const express = require('express');
const { query, getClient } = require('../db');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

const OTP_EXPIRY_HOURS = parseInt(process.env.PICKUP_OTP_EXPIRY_HOURS || '24', 10);
const generatePickupOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

router.use(authenticate, requireRole('worker'));

async function getWorkerStoreId(workerId) {
  const res = await query(
    `SELECT store_id FROM store_workers WHERE worker_id = $1 AND is_active = TRUE LIMIT 1`,
    [workerId]
  );
  return res.rows[0]?.store_id || null;
}

/**
 * GET /worker/orders
 * Workers see:
 * - their assigned active order (if busy)
 * - otherwise, placed orders (unassigned) + assigned to self
 */
router.get('/orders', async (req, res, next) => {
  try {
    const storeId = await getWorkerStoreId(req.user.id);
    if (!storeId) return res.status(403).json({ success: false, message: 'Worker not linked to a store' });

    const status = req.query.status;

    const ws = await query(`SELECT is_busy, active_order_id FROM worker_status WHERE worker_id = $1`, [req.user.id]);
    const isBusy = ws.rows[0]?.is_busy === true;
    const activeOrderId = ws.rows[0]?.active_order_id || null;

    let sql = `SELECT o.*, u.name AS customer_name, u.phone AS customer_phone,
                      (SELECT json_agg(oi.*) FROM order_items oi WHERE oi.order_id = o.id) AS items
               FROM orders o
               JOIN users u ON u.id = o.customer_id
               WHERE o.store_id = $1`;
    const params = [storeId];

    if (isBusy && activeOrderId) {
      sql += ` AND o.id = $2`;
      params.push(activeOrderId);
    } else {
      sql += ` AND (o.status = 'placed' OR o.assigned_worker_id = $2)`;
      params.push(req.user.id);
      if (status) {
        sql += ` AND o.status = $3`;
        params.push(status);
      }
    }
    sql += ` ORDER BY o.created_at DESC LIMIT 50`;

    const ordersRes = await query(sql, params);
    res.json({ success: true, is_busy: isBusy, active_order_id: activeOrderId, orders: ordersRes.rows });
  } catch (e) {
    next(e);
  }
});

/**
 * PATCH /worker/orders/:id/accept
 * Accept order + assign to worker + set busy + generate pickup OTP (if pickup)
 */
router.patch('/orders/:id/accept', async (req, res, next) => {
  const client = await getClient();
  try {
    const { id } = req.params;
    const { prep_time_minutes } = req.body || {};

    const storeId = await getWorkerStoreId(req.user.id);
    if (!storeId) return res.status(403).json({ success: false, message: 'Worker not linked to a store' });

    const wsRes = await client.query(`SELECT is_busy FROM worker_status WHERE worker_id = $1 FOR UPDATE`, [req.user.id]);
    if (wsRes.rows[0]?.is_busy) {
      return res.status(400).json({ success: false, message: 'Finish current order first' });
    }

    const orderRes = await client.query(`SELECT * FROM orders WHERE id = $1 FOR UPDATE`, [id]);
    if (!orderRes.rows.length) return res.status(404).json({ success: false, message: 'Order not found' });
    const order = orderRes.rows[0];

    if (order.store_id !== storeId) {
      return res.status(403).json({ success: false, message: 'Not your store' });
    }
    if (order.status !== 'placed') {
      return res.status(400).json({ success: false, message: `Cannot accept order from '${order.status}' state` });
    }

    const otpCode = order.delivery_type === 'pickup' ? generatePickupOtp() : null;
    const otpExpiry = otpCode ? new Date(Date.now() + OTP_EXPIRY_HOURS * 60 * 60 * 1000) : null;

    await client.query('BEGIN');
    const updated = await client.query(
      `UPDATE orders
       SET status = 'accepted',
           prep_time_minutes = COALESCE($1, prep_time_minutes),
           assigned_worker_id = $2,
           otp_code = $3,
           otp_expiry = $4,
           updated_at = NOW()
       WHERE id = $5
       RETURNING *`,
      [prep_time_minutes ?? null, req.user.id, otpCode, otpExpiry, id]
    );

    await client.query(
      `UPDATE worker_status
       SET is_busy = TRUE, active_order_id = $1, updated_at = NOW()
       WHERE worker_id = $2`,
      [id, req.user.id]
    );

    await client.query('COMMIT');

    const updatedOrder = updated.rows[0];
    if (req.io) {
      req.io.to(`store:${storeId}`).emit('order:assigned', { order_id: id, worker_id: req.user.id });
      req.io.to(`order:${id}`).emit('order:accepted', {
        order_id: id,
        status: 'accepted',
        prep_time_minutes: updatedOrder.prep_time_minutes,
        otp_code: updatedOrder.otp_code || null,
        otp_expiry: updatedOrder.otp_expiry || null,
        accepted_by_name: req.user.name || null,
        accepted_by_phone: req.user.phone || null,
      });
      req.io.to(`order:${id}`).emit('order:status_update', {
        order_id: id,
        status: 'accepted',
        prep_time_minutes: updatedOrder.prep_time_minutes,
      });
    }

    res.json({ success: true, order: updatedOrder });
  } catch (e) {
    await client.query('ROLLBACK');
    next(e);
  } finally {
    client.release();
  }
});

/**
 * PATCH /worker/orders/:id/status
 * Worker can do: accepted->preparing->ready
 * When ready: unlock worker
 */
router.patch('/orders/:id/status', async (req, res, next) => {
  const client = await getClient();
  try {
    const { id } = req.params;
    const { status, prep_time_minutes } = req.body || {};
    if (!status) return res.status(400).json({ success: false, message: 'status required' });

    const storeId = await getWorkerStoreId(req.user.id);
    if (!storeId) return res.status(403).json({ success: false, message: 'Worker not linked to a store' });

    await client.query('BEGIN');
    const orderRes = await client.query(`SELECT * FROM orders WHERE id = $1 FOR UPDATE`, [id]);
    if (!orderRes.rows.length) return res.status(404).json({ success: false, message: 'Order not found' });
    const order = orderRes.rows[0];

    if (order.store_id !== storeId) return res.status(403).json({ success: false, message: 'Not your store' });
    if (order.assigned_worker_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Order not assigned to you' });
    }

    const validTransitions = {
      accepted: ['preparing'],
      preparing: ['ready'],
    };
    const allowed = validTransitions[order.status] || [];
    if (!allowed.includes(status)) {
      return res.status(400).json({ success: false, message: `Cannot transition from '${order.status}' to '${status}'` });
    }

    const updated = await client.query(
      `UPDATE orders SET status = $1, prep_time_minutes = COALESCE($2, prep_time_minutes), updated_at = NOW()
       WHERE id = $3 RETURNING *`,
      [status, prep_time_minutes ?? null, id]
    );
    const updatedOrder = updated.rows[0];

    if (status === 'ready') {
      await client.query(
        `UPDATE worker_status
         SET is_busy = FALSE, active_order_id = NULL, updated_at = NOW()
         WHERE worker_id = $1`,
        [req.user.id]
      );
    }

    await client.query('COMMIT');

    if (req.io) {
      if (status === 'ready') {
        req.io.to(`order:${id}`).emit('order:ready', { order_id: id, status: 'ready' });
      }
      req.io.to(`order:${id}`).emit('order:status_update', {
        order_id: id,
        status,
        prep_time_minutes: updatedOrder.prep_time_minutes,
      });
    }

    res.json({ success: true, order: updatedOrder });
  } catch (e) {
    await client.query('ROLLBACK');
    next(e);
  } finally {
    client.release();
  }
});

module.exports = router;

