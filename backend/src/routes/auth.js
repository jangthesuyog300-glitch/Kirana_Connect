const express = require('express');
const jwt = require('jsonwebtoken');
const { query } = require('../db');
const { generateOTP, sendOTP, verifyOTP } = require('../utils/otp');

const router = express.Router();

const normalizePhone = (rawPhone = '') => {
  const digits = String(rawPhone).replace(/\D/g, '');
  if (!digits) return '';
  // Keep last 10 digits for local Indian numbers and store with +91.
  if (digits.length >= 10) {
    return `+91${digits.slice(-10)}`;
  }
  return `+${digits}`;
};

/**
 * POST /auth/send-otp
 * Send OTP to phone number
 */
router.post('/send-otp', async (req, res, next) => {
  try {
    const normalizedPhone = normalizePhone(req.body?.phone);
    if (!normalizedPhone) {
      return res.status(400).json({ success: false, message: 'Phone number required' });
    }

    const phoneRegex = /^\+?[1-9]\d{9,14}$/;
    if (!phoneRegex.test(normalizedPhone)) {
      return res.status(400).json({ success: false, message: 'Invalid phone number format' });
    }

    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Invalidate old OTPs for this phone
    await query(`UPDATE otps SET used = TRUE WHERE phone = $1 AND used = FALSE`, [normalizedPhone]);

    // Store new OTP
    await query(
      `INSERT INTO otps (phone, otp, expires_at) VALUES ($1, $2, $3)`,
      [normalizedPhone, otp, expiresAt]
    );

    await sendOTP(normalizedPhone, otp);

    res.json({
      success: true,
      message: 'OTP sent successfully',
      ...(process.env.MOCK_OTP === 'true' && { debug_otp: otp })
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /auth/verify-otp
 * Verify OTP and return JWT
 */
router.post('/verify-otp', async (req, res, next) => {
  try {
    const normalizedPhone = normalizePhone(req.body?.phone);
    const { otp, role = 'customer', name } = req.body;
    if (!normalizedPhone || !otp) {
      return res.status(400).json({ success: false, message: 'Phone and OTP required' });
    }

    const valid = await verifyOTP(normalizedPhone, otp);
    if (!valid) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }

    // Mark OTP as used
    await query(`UPDATE otps SET used = TRUE WHERE phone = $1 AND otp = $2`, [normalizedPhone, otp]);

    // Upsert user
    const userRes = await query(
      `INSERT INTO users (phone, name, role)
       VALUES ($1, $2, $3)
       ON CONFLICT (phone) DO UPDATE SET
        role = EXCLUDED.role,
         name = COALESCE(EXCLUDED.name, users.name),
         updated_at = NOW()
       RETURNING id, phone, name, role`,
      [normalizedPhone, name || null, role]
    );

    const user = userRes.rows[0];
    const token = jwt.sign({ userId: user.id, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '30d'
    });

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: { id: user.id, phone: user.phone, name: user.name, role: user.role }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /auth/me
 * Get current user info
 */
router.get('/me', require('../middleware/auth').authenticate, async (req, res) => {
  const result = await query(
    `SELECT id, phone, name, email, role, created_at FROM users WHERE id = $1`,
    [req.user.id]
  );
  res.json({ success: true, user: result.rows[0] });
});

/**
 * PATCH /auth/profile
 * Update profile
 */
router.patch('/profile', require('../middleware/auth').authenticate, async (req, res, next) => {
  try {
    const { name, email, onesignal_id } = req.body;
    const result = await query(
      `UPDATE users SET
         name = COALESCE($1, name),
         email = COALESCE($2, email),
         onesignal_id = COALESCE($3, onesignal_id),
         updated_at = NOW()
       WHERE id = $4
       RETURNING id, phone, name, email, role`,
      [name, email, onesignal_id, req.user.id]
    );
    res.json({ success: true, user: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
