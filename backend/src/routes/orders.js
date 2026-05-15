const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { query } = require('../db');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

const COMMISSION_RATE = parseFloat(process.env.COMMISSION_RATE || '0.02');
const OTP_EXPIRY_HOURS = parseInt(process.env.PICKUP_OTP_EXPIRY_HOURS || '24', 10);
const generatePickupOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

/**
 * POST /orders
 * Place a new order
 */
router.post('/', authenticate, requireRole('customer'), async (req, res, next) => {
  const client = (await require('../db').getClient());
  try {
    await client.query('BEGIN');

    const { store_id, items, delivery_type, delivery_address, payment_method, notes } = req.body;
    if (!store_id || !items?.length) {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, message: 'store_id and items required' });
    }

    // Fetch and validate items + compute totals
    let subtotal = 0;
    const orderLines = [];
    for (const lineItem of items) {
      const itemRes = await client.query(
        `SELECT * FROM items WHERE id = $1 AND store_id = $2 AND is_available = TRUE`,
        [lineItem.item_id, store_id]
      );
      if (!itemRes.rows.length) {
        await client.query('ROLLBACK');
        return res.status(400).json({ success: false, message: `Item ${lineItem.item_id} not available` });
      }
      const item = itemRes.rows[0];
      let unitPrice;
      if (item.is_weight_based) {
        unitPrice = (item.price_per_kg / 1000) * lineItem.quantity; // quantity in grams
      } else {
        unitPrice = item.price_per_unit * lineItem.quantity;
      }
      const totalPrice = unitPrice;
      subtotal += totalPrice;
      orderLines.push({
        item_id: item.id,
        item_name: item.name,
        category: item.category,
        quantity: lineItem.quantity,
        unit: item.unit,
        price_per_kg: item.price_per_kg,
        unit_price: unitPrice,
        total_price: totalPrice,
      });
    }

    const deliveryFee = delivery_type === 'delivery' ? 20 : 0; // flat delivery fee
    const totalAmount = subtotal + deliveryFee;

    // Create order
    const orderRes = await client.query(
      `INSERT INTO orders (customer_id, store_id, delivery_type, delivery_address, payment_method,
                           subtotal, delivery_fee, total_amount, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       RETURNING *`,
      [req.user.id, store_id, delivery_type, delivery_address, payment_method,
       subtotal, deliveryFee, totalAmount, notes]
    );
    const order = orderRes.rows[0];

    // Insert order items
    for (const line of orderLines) {
      await client.query(
        `INSERT INTO order_items (order_id, item_id, item_name, category, quantity, unit, price_per_kg, unit_price, total_price)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [order.id, line.item_id, line.item_name, line.category, line.quantity,
         line.unit, line.price_per_kg, line.unit_price, line.total_price]
      );
    }

    await client.query('COMMIT');

    // Emit to store owner via socket
    if (req.io) {
      console.log(`[NOTIFICATION] Sending New Order notification to Store: ${store_id}`);
      req.io.to(`store:${store_id}`).emit('order:new', {
        ...order,
        items: orderLines,
        customer_name: req.user.name || 'Mock Customer'
      });
    }

    res.status(201).json({
      success: true,
      message: 'Order placed successfully',
      order: { ...order, items: orderLines }
    });
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
});

/**
 * GET /orders
 * Get orders (customer sees own orders, store_owner sees store orders)
 */
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { status, store_id, limit = 20, offset = 0 } = req.query;
    let sql, params;

    if (req.user.role === 'customer') {
      sql = `SELECT o.*, s.name AS store_name, s.image_url AS store_image,
                    w.name AS accepted_by_name, w.phone AS accepted_by_phone,
                    (SELECT json_agg(oi.*) FROM order_items oi WHERE oi.order_id = o.id) AS items
             FROM orders o
             JOIN stores s ON s.id = o.store_id
             LEFT JOIN users w ON w.id = o.assigned_worker_id
             WHERE o.customer_id = $1`;
      params = [req.user.id];
    } else {
      // store_owner
      if (!store_id) {
        // Get owner's store id
        const storeRes = await query(`SELECT id FROM stores WHERE owner_id = $1 LIMIT 1`, [req.user.id]);
        if (!storeRes.rows.length) return res.json({ success: true, orders: [] });
        params = [storeRes.rows[0].id];
      } else {
        params = [store_id];
      }
      sql = `SELECT o.*, u.name AS customer_name, u.phone AS customer_phone,
                    (SELECT json_agg(oi.*) FROM order_items oi WHERE oi.order_id = o.id) AS items
             FROM orders o JOIN users u ON u.id = o.customer_id
             WHERE o.store_id = $1`;
    }

    if (status) {
      sql += ` AND o.status = $${params.length + 1}`;
      params.push(status);
    }
    sql += ` ORDER BY o.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await query(sql, params);
    res.json({ success: true, orders: result.rows });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /orders/:id
 * Get single order with items
 */
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const orderRes = await query(
      `SELECT o.*, s.name AS store_name, s.image_url AS store_image,
              u.name AS customer_name, u.phone AS customer_phone,
              w.name AS accepted_by_name, w.phone AS accepted_by_phone
       FROM orders o
       JOIN stores s ON s.id = o.store_id
       JOIN users u ON u.id = o.customer_id
       LEFT JOIN users w ON w.id = o.assigned_worker_id
       WHERE o.id = $1`,
      [id]
    );
    if (!orderRes.rows.length) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    const order = orderRes.rows[0];

    // Check access
    if (req.user.role === 'customer' && order.customer_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const itemsRes = await query(`SELECT * FROM order_items WHERE order_id = $1`, [id]);
    res.json({ success: true, order: { ...order, items: itemsRes.rows } });
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /orders/:id/accept
 * Accept order and generate OTP
 */
router.patch('/:id/accept', authenticate, requireRole('store_owner'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { prep_time_minutes } = req.body;

    const orderRes = await query(`SELECT * FROM orders WHERE id = $1`, [id]);
    if (!orderRes.rows.length) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    const order = orderRes.rows[0];

    const storeRes = await query(`SELECT id FROM stores WHERE id = $1 AND owner_id = $2`, [order.store_id, req.user.id]);
    if (!storeRes.rows.length) {
      return res.status(403).json({ success: false, message: 'Not your store' });
    }
    if (order.status !== 'placed') {
      return res.status(400).json({ success: false, message: `Cannot accept order from '${order.status}' state` });
    }

    const otpCode = generatePickupOtp();
    const otpExpiry = new Date(Date.now() + OTP_EXPIRY_HOURS * 60 * 60 * 1000);

    const result = await query(
      `UPDATE orders
       SET status = 'accepted',
           prep_time_minutes = COALESCE($1, prep_time_minutes),
           otp_code = $2,
           otp_expiry = $3,
           updated_at = NOW()
       WHERE id = $4
       RETURNING *`,
      [prep_time_minutes ?? null, otpCode, otpExpiry, id]
    );
    const updatedOrder = result.rows[0];

    if (req.io) {
      req.io.to(`order:${id}`).emit('order:accepted', {
        order_id: id,
        status: 'accepted',
        prep_time_minutes: updatedOrder.prep_time_minutes,
        otp_code: updatedOrder.otp_code || null,
        otp_expiry: updatedOrder.otp_expiry || null,
      });
      req.io.to(`order:${id}`).emit('order:status_update', {
        order_id: id,
        status: 'accepted',
        prep_time_minutes: updatedOrder.prep_time_minutes,
      });
    }

    res.json({ success: true, order: updatedOrder });
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /orders/:id/status
 * Update order status (store_owner)
 */
router.patch('/:id/status', authenticate, requireRole('store_owner'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, prep_time_minutes } = req.body;

    const validTransitions = {
      placed: ['rejected'],
      accepted: ['preparing'],
      preparing: ['ready'],
      ready: ['dispatched', 'collected'],
      dispatched: ['delivered'],
    };

    // Fetch order
    const orderRes = await query(`SELECT * FROM orders WHERE id = $1`, [id]);
    if (!orderRes.rows.length) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    const order = orderRes.rows[0];

    // Verify ownership
    const storeRes = await query(`SELECT id FROM stores WHERE id = $1 AND owner_id = $2`, [order.store_id, req.user.id]);
    if (!storeRes.rows.length) {
      return res.status(403).json({ success: false, message: 'Not your store' });
    }

    const allowed = validTransitions[order.status] || [];
    if (!allowed.includes(status)) {
      if (order.status === 'placed' && status === 'accepted') {
        return res.status(400).json({
          success: false,
          message: "Use '/orders/:id/accept' to accept and generate OTP",
        });
      }
      return res.status(400).json({
        success: false,
        message: `Cannot transition from '${order.status}' to '${status}'`
      });
    }

    const result = await query(
      `UPDATE orders SET status = $1, prep_time_minutes = COALESCE($2, prep_time_minutes), updated_at = NOW()
       WHERE id = $3 RETURNING *`,
      [status, prep_time_minutes, id]
    );
    const updatedOrder = result.rows[0];

    // If delivered or collected — create financial transaction and reduce stock
    if (status === 'delivered' || status === 'collected') {
      const commissionAmount = updatedOrder.total_amount * COMMISSION_RATE;
      const netAmount = updatedOrder.total_amount - commissionAmount;
      
      // Use transaction to ensure data consistency
      const client = await require('../db').getClient();
      try {
        await client.query('BEGIN');
        
        // 1. Create financial transaction
        await client.query(
          `INSERT INTO store_transactions
             (store_id, order_id, total_amount, commission_amount, net_amount, payment_method, payment_status)
           VALUES ($1,$2,$3,$4,$5,$6,$7)
           ON CONFLICT DO NOTHING`,
          [updatedOrder.store_id, updatedOrder.id, updatedOrder.total_amount,
           commissionAmount, netAmount, updatedOrder.payment_method, updatedOrder.payment_status]
        );

        // 2. Reduce stock for each item
        const orderItems = await client.query(`SELECT item_id, quantity FROM order_items WHERE order_id = $1`, [id]);
        for (const item of orderItems.rows) {
          await client.query(
            `UPDATE items SET stock_qty = GREATEST(0, stock_qty - $1) WHERE id = $2`,
            [item.quantity, item.item_id]
          );
        }
        
        await client.query('COMMIT');
      } catch (e) {
        await client.query('ROLLBACK');
        console.error('Failed to complete order stock reduction:', e);
      } finally {
        client.release();
      }
    }

    // Emit real-time update to customer
    if (req.io) {
      if (status === 'ready') {
        console.log(`[NOTIFICATION] Sending 'Ready for Pickup' notification to Customer: ${order.customer_id}`);
        req.io.to(`order:${id}`).emit('order:ready', {
          order_id: id,
          status: 'ready',
        });
      }
      if (status === 'collected') {
        req.io.to(`order:${id}`).emit('order:collected', {
          order_id: id,
          status: 'collected',
        });
      }
      req.io.to(`order:${id}`).emit('order:status_update', {
        order_id: id, status, prep_time_minutes
      });
    }

    res.json({ success: true, order: updatedOrder });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /orders/:id/verify-otp
 * Verify OTP (for pickup or delivery)
 */
router.post('/:id/verify-otp', authenticate, requireRole('store_owner'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { otp } = req.body;

    const orderRes = await query(`SELECT * FROM orders WHERE id = $1`, [id]);
    if (!orderRes.rows.length) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    const order = orderRes.rows[0];

    // Verify ownership
    const storeRes = await query(`SELECT id FROM stores WHERE id = $1 AND owner_id = $2`, [order.store_id, req.user.id]);
    if (!storeRes.rows.length) {
      return res.status(403).json({ success: false, message: 'Not your store' });
    }

    if (order.delivery_type === 'pickup' && order.status !== 'ready') {
      return res.status(400).json({ success: false, message: 'Pickup order must be in ready state before OTP verification' });
    }
    if (order.delivery_type === 'delivery' && order.status !== 'dispatched') {
      return res.status(400).json({ success: false, message: 'Delivery order must be dispatched before OTP verification' });
    }
    if (!order.otp_code || order.otp_code !== otp) {
      return res.status(400).json({ success: false, message: 'Invalid OTP' });
    }
    if (order.otp_expiry && new Date(order.otp_expiry) < new Date()) {
      return res.status(400).json({ success: false, message: 'OTP expired' });
    }

    const newStatus = order.delivery_type === 'pickup' ? 'collected' : 'delivered';

    const updatedRes = await query(
      `UPDATE orders
       SET status = $1,
           otp_code = NULL,
           otp_expiry = NULL,
           updated_at = NOW()
       WHERE id = $2 RETURNING *`,
      [newStatus, id]
    );
    const updatedOrder = updatedRes.rows[0];

    // Complete financial transaction + stock reduction for collected orders
    const commissionAmount = updatedOrder.total_amount * COMMISSION_RATE;
    const netAmount = updatedOrder.total_amount - commissionAmount;
    const client = await require('../db').getClient();
    try {
      await client.query('BEGIN');
      await client.query(
        `INSERT INTO store_transactions
           (store_id, order_id, total_amount, commission_amount, net_amount, payment_method, payment_status)
         VALUES ($1,$2,$3,$4,$5,$6,$7)
         ON CONFLICT DO NOTHING`,
        [updatedOrder.store_id, updatedOrder.id, updatedOrder.total_amount,
         commissionAmount, netAmount, updatedOrder.payment_method, updatedOrder.payment_status]
      );

      const orderItems = await client.query(`SELECT item_id, quantity FROM order_items WHERE order_id = $1`, [id]);
      for (const item of orderItems.rows) {
        await client.query(
          `UPDATE items SET stock_qty = GREATEST(0, stock_qty - $1) WHERE id = $2`,
          [item.quantity, item.item_id]
        );
      }
      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
      console.error('Failed to complete pickup stock reduction:', e);
    } finally {
      client.release();
    }

    // Emit real-time update to customer
    if (req.io) {
      if (updatedOrder.status === 'collected') {
        req.io.to(`order:${id}`).emit('order:collected', {
          order_id: id,
          status: 'collected',
        });
      } else {
        req.io.to(`order:${id}`).emit('order:delivered', {
          order_id: id,
          status: 'delivered',
        });
      }
      req.io.to(`order:${id}`).emit('order:status_update', {
        order_id: id,
        status: updatedOrder.status,
      });
    }

    res.json({ success: true, message: 'Order successfully delivered.', order: updatedOrder });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /orders/:id/rate
 * Customer rates an order/store
 */
router.post('/:id/rate', authenticate, requireRole('customer'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rating, review } = req.body;

    const orderRes = await query(
      `SELECT * FROM orders WHERE id = $1 AND customer_id = $2 AND status IN ('delivered','collected')`,
      [id, req.user.id]
    );
    if (!orderRes.rows.length) {
      return res.status(400).json({ success: false, message: 'Cannot rate this order' });
    }
    const order = orderRes.rows[0];

    await query(
      `INSERT INTO ratings (store_id, customer_id, order_id, rating, review)
       VALUES ($1,$2,$3,$4,$5)
       ON CONFLICT (order_id, customer_id) DO UPDATE SET rating=$4, review=$5`,
      [order.store_id, req.user.id, id, rating, review]
    );

    // Update store avg rating
    await query(
      `UPDATE stores SET
         rating = (SELECT ROUND(AVG(rating)::numeric, 2) FROM ratings WHERE store_id = $1),
         total_ratings = (SELECT COUNT(*) FROM ratings WHERE store_id = $1)
       WHERE id = $1`,
      [order.store_id]
    );

    res.json({ success: true, message: 'Rating submitted' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
