const express = require('express');
const PDFDocument = require('pdfkit');
const { format: csvFormat, write: csvWrite } = require('@fast-csv/format');
const { query } = require('../db');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

/**
 * GET /reports/monthly
 * Monthly report for a store
 * Query: store_id, month (YYYY-MM)
 */
router.get('/monthly', authenticate, requireRole('store_owner'), async (req, res, next) => {
  try {
    const { store_id, month } = req.query; // month = "2024-05"
    if (!store_id || !month) {
      return res.status(400).json({ success: false, message: 'store_id and month required' });
    }

    // Verify ownership
    const ownershipRes = await query(`SELECT id FROM stores WHERE id = $1 AND owner_id = $2`, [store_id, req.user.id]);
    if (!ownershipRes.rows.length) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const monthStart = `${month}-01`;

    // Summary
    const summaryRes = await query(
      `SELECT
         COUNT(*)::int AS total_orders,
         COALESCE(SUM(total_amount), 0) AS total_revenue,
         COALESCE(SUM(commission_amount), 0) AS total_commission,
         COALESCE(SUM(net_amount), 0) AS net_earnings,
         COALESCE(SUM(CASE WHEN payment_method IN ('upi','card') THEN total_amount ELSE 0 END), 0) AS online_revenue,
         COALESCE(SUM(CASE WHEN payment_method = 'cash' THEN total_amount ELSE 0 END), 0) AS cash_revenue
       FROM store_transactions
       WHERE store_id = $1
         AND DATE_TRUNC('month', created_at) = DATE_TRUNC('month', $2::date)`,
      [store_id, monthStart]
    );

    // Order status breakdown
    const statusRes = await query(
      `SELECT status, COUNT(*)::int AS count
       FROM orders
       WHERE store_id = $1
         AND DATE_TRUNC('month', created_at) = DATE_TRUNC('month', $2::date)
       GROUP BY status`,
      [store_id, monthStart]
    );

    // Daily revenue (for chart)
    const dailyRes = await query(
      `SELECT
         DATE(created_at) AS date,
         COALESCE(SUM(total_amount), 0) AS revenue,
         COALESCE(SUM(net_amount), 0) AS net_earnings,
         COUNT(*)::int AS orders
       FROM store_transactions
       WHERE store_id = $1
         AND DATE_TRUNC('month', created_at) = DATE_TRUNC('month', $2::date)
       GROUP BY DATE(created_at)
       ORDER BY date`,
      [store_id, monthStart]
    );

    // Top selling items
    const topItemsRes = await query(
      `SELECT
         oi.item_name,
         oi.category,
         SUM(oi.quantity) AS total_qty,
         SUM(oi.total_price) AS total_revenue,
         COUNT(DISTINCT oi.order_id)::int AS order_count
       FROM order_items oi
       JOIN orders o ON o.id = oi.order_id
       WHERE o.store_id = $1
         AND o.status IN ('delivered', 'collected')
         AND DATE_TRUNC('month', o.created_at) = DATE_TRUNC('month', $2::date)
       GROUP BY oi.item_name, oi.category
       ORDER BY total_revenue DESC
       LIMIT 10`,
      [store_id, monthStart]
    );

    res.json({
      success: true,
      month,
      summary: summaryRes.rows[0],
      status_breakdown: statusRes.rows,
      daily_revenue: dailyRes.rows,
      top_items: topItemsRes.rows,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /reports/transactions
 * List all transactions for a store (paginated)
 */
router.get('/transactions', authenticate, requireRole('store_owner'), async (req, res, next) => {
  try {
    const { store_id, month, payment_method, limit = 20, offset = 0 } = req.query;
    if (!store_id) {
      return res.status(400).json({ success: false, message: 'store_id required' });
    }

    const ownershipRes = await query(`SELECT id FROM stores WHERE id = $1 AND owner_id = $2`, [store_id, req.user.id]);
    if (!ownershipRes.rows.length) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    let sql = `
      SELECT st.*, o.status AS order_status, o.delivery_type,
             u.name AS customer_name, u.phone AS customer_phone
      FROM store_transactions st
      JOIN orders o ON o.id = st.order_id
      JOIN users u ON u.id = o.customer_id
      WHERE st.store_id = $1`;
    const params = [store_id];
    let idx = 2;

    if (month) {
      sql += ` AND DATE_TRUNC('month', st.created_at) = DATE_TRUNC('month', $${idx++}::date)`;
      params.push(`${month}-01`);
    }
    if (payment_method) {
      sql += ` AND st.payment_method = $${idx++}`;
      params.push(payment_method);
    }
    sql += ` ORDER BY st.created_at DESC LIMIT $${idx++} OFFSET $${idx++}`;
    params.push(limit, offset);

    const result = await query(sql, params);
    res.json({ success: true, transactions: result.rows });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /reports/low-stock
 * Items below alert level
 */
router.get('/low-stock', authenticate, requireRole('store_owner'), async (req, res, next) => {
  try {
    const { store_id } = req.query;
    const ownershipRes = await query(`SELECT id FROM stores WHERE id = $1 AND owner_id = $2`, [store_id, req.user.id]);
    if (!ownershipRes.rows.length) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const result = await query(
      `SELECT * FROM items WHERE store_id = $1 AND stock_qty <= low_stock_alert ORDER BY stock_qty ASC`,
      [store_id]
    );
    res.json({ success: true, items: result.rows });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /reports/export
 * Export as PDF or CSV
 */
router.get('/export', authenticate, requireRole('store_owner'), async (req, res, next) => {
  try {
    const { store_id, month, format = 'csv' } = req.query;
    if (!store_id || !month) {
      return res.status(400).json({ success: false, message: 'store_id and month required' });
    }

    const ownershipRes = await query(`SELECT * FROM stores WHERE id = $1 AND owner_id = $2`, [store_id, req.user.id]);
    if (!ownershipRes.rows.length) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    const store = ownershipRes.rows[0];

    const monthStart = `${month}-01`;

    const txRes = await query(
      `SELECT st.id, st.created_at, st.total_amount, st.commission_amount,
              st.net_amount, st.payment_method, st.payment_status,
              o.status AS order_status, u.name AS customer_name
       FROM store_transactions st
       JOIN orders o ON o.id = st.order_id
       JOIN users u ON u.id = o.customer_id
       WHERE st.store_id = $1
         AND DATE_TRUNC('month', st.created_at) = DATE_TRUNC('month', $2::date)
       ORDER BY st.created_at ASC`,
      [store_id, monthStart]
    );

    if (format === 'pdf') {
      // PDF export
      const doc = new PDFDocument({ margin: 50 });
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="report_${month}.pdf"`);
      doc.pipe(res);

      // Header
      doc.fontSize(22).font('Helvetica-Bold').text('Kirana Connect', { align: 'center' });
      doc.fontSize(14).font('Helvetica').text(`${store.name} — Monthly Report: ${month}`, { align: 'center' });
      doc.moveDown();

      // Summary
      const total = txRes.rows.reduce((s, r) => s + parseFloat(r.total_amount), 0);
      const commission = txRes.rows.reduce((s, r) => s + parseFloat(r.commission_amount), 0);
      const net = txRes.rows.reduce((s, r) => s + parseFloat(r.net_amount), 0);

      doc.fontSize(12).font('Helvetica-Bold').text('Summary');
      doc.font('Helvetica');
      doc.text(`Total Orders: ${txRes.rows.length}`);
      doc.text(`Total Revenue: ₹${total.toFixed(2)}`);
      doc.text(`Commission Deducted: ₹${commission.toFixed(2)}`);
      doc.text(`Net Earnings: ₹${net.toFixed(2)}`);
      doc.moveDown();

      // Table header
      doc.font('Helvetica-Bold').text('Transactions', { underline: true });
      doc.font('Helvetica').fontSize(9);

      const cols = ['Date', 'Amount', 'Commission', 'Net', 'Method', 'Status'];
      const colWidths = [90, 70, 80, 70, 60, 70];
      let x = 50;
      const tableTop = doc.y + 10;
      cols.forEach((col, i) => {
        doc.text(col, x, tableTop, { width: colWidths[i], align: 'left' });
        x += colWidths[i];
      });

      let y = tableTop + 15;
      for (const row of txRes.rows) {
        if (y > 700) { doc.addPage(); y = 50; }
        x = 50;
        const rowData = [
          new Date(row.created_at).toLocaleDateString('en-IN'),
          `₹${parseFloat(row.total_amount).toFixed(2)}`,
          `₹${parseFloat(row.commission_amount).toFixed(2)}`,
          `₹${parseFloat(row.net_amount).toFixed(2)}`,
          row.payment_method,
          row.payment_status
        ];
        rowData.forEach((val, i) => {
          doc.text(val, x, y, { width: colWidths[i], align: 'left' });
          x += colWidths[i];
        });
        y += 15;
      }

      doc.end();
    } else {
      // CSV export
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="report_${month}.csv"`);

      const csvStream = csvFormat({ headers: true });
      csvStream.pipe(res);
      for (const row of txRes.rows) {
        csvStream.write({
          'Transaction ID': row.id,
          'Date': new Date(row.created_at).toLocaleDateString('en-IN'),
          'Customer': row.customer_name,
          'Total Amount': row.total_amount,
          'Commission': row.commission_amount,
          'Net Earnings': row.net_amount,
          'Payment Method': row.payment_method,
          'Payment Status': row.payment_status,
          'Order Status': row.order_status,
        });
      }
      csvStream.end();
    }
  } catch (error) {
    next(error);
  }
});

module.exports = router;
