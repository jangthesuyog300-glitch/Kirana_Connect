const express = require('express');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

/**
 * POST /payments/initiate
 * Stub for initiating payment (e.g. Cashfree)
 */
router.post('/initiate', authenticate, async (req, res, next) => {
  try {
    const { order_id, amount } = req.body;
    
    // In a real implementation, you would call the payment gateway API here
    // e.g., Cashfree API to create an order and get a payment session ID
    
    console.log(`[PAYMENT STUB] Initiating payment for order ${order_id}, amount: ${amount}`);
    
    res.json({
      success: true,
      payment_session_id: `mock_session_${Date.now()}`,
      order_id
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /payments/webhook
 * Stub for payment gateway webhook
 */
router.post('/webhook', express.raw({type: 'application/json'}), async (req, res, next) => {
  try {
    // 1. Verify webhook signature
    // 2. Parse payload
    // 3. Update order payment_status
    
    console.log(`[PAYMENT STUB] Received webhook`);
    
    res.status(200).send('OK');
  } catch (error) {
    next(error);
  }
});

module.exports = router;
