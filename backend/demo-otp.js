/**
 * ============================================================
 *  KIRANA CONNECT — OTP FLOW DEMO (PICKUP)
 *  Demonstrates: Order -> Accept -> OTP Generation -> Verify
 * ============================================================
 */

const http = require('http');

const BASE = 'http://localhost:4000';
let ownerToken = '';
let customerToken = '';
let storeId = 'store-1';
let orderId = '';
let otpCode = '';

const c = {
  reset: '\x1b[0m',
  bold:  '\x1b[1m',
  green: '\x1b[32m',
  cyan:  '\x1b[36m',
  yellow:'\x1b[33m',
  blue:  '\x1b[34m',
};

function banner(text) {
  console.log(`\n${c.cyan}${c.bold}=== ${text} ===${c.reset}\n`);
}

function step(n, text) {
  console.log(`${c.yellow}${c.bold}[STEP ${n}]${c.reset} ${c.bold}${text}${c.reset}`);
}

function ok(label, value) {
  console.log(`  ${c.green}✓ ${label}:${c.reset} ${value}`);
}

function info(text) {
  console.log(`  ${c.blue}ℹ ${text}${c.reset}`);
}

function request(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    
    const url = new URL(BASE + path);
    const opts = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method,
      headers,
    };

    const req = http.request(opts, (res) => {
      let data = '';
      res.on('data', chunk => (data += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function run() {
  banner('KIRANA CONNECT — OTP & PICKUP DEMO');

  // 1. Auth
  step(1, 'Login as Customer & Owner');
  const oAuth = await request('POST', '/auth/verify-otp', { phone: '+919999000001', otp: '123456', role: 'store_owner' });
  ownerToken = oAuth.body.token;
  const cAuth = await request('POST', '/auth/verify-otp', { phone: '+919999000002', otp: '123456', role: 'customer' });
  customerToken = cAuth.body.token;
  ok('Tokens obtained', 'Success');

  // 2. Place Pickup Order
  step(2, 'Customer: Place PICKUP order');
  const orderRes = await request('POST', '/orders', {
    store_id: storeId,
    items: [{ item_id: 'item-1', quantity: 1 }],
    delivery_type: 'pickup', // CRITICAL
    payment_method: 'cash',
  }, customerToken);
  orderId = orderRes.body.order.id;
  ok('Order Placed', orderId);
  ok('Delivery Type', 'pickup');

  // 3. Accept Order
  step(3, 'Store Owner: Accept order & Generate OTP');
  const acceptRes = await request('PATCH', `/orders/${orderId}/accept`, {
    prep_time_minutes: 10
  }, ownerToken);
  
  if (acceptRes.status === 200) {
    otpCode = acceptRes.body.order.otp_code;
    ok('Order Accepted', 'Status: ' + acceptRes.body.order.status);
    console.log(`\n  ${c.bold}${c.yellow}🔑 SHARED OTP: ${otpCode}${c.reset}\n`);
    info('This OTP is now visible to the customer and required by the owner for pickup.');
  } else {
    console.log('Failed to accept:', acceptRes.body);
    process.exit(1);
  }

  // 4. Mark Ready
  step(4, 'Store Owner: Mark as READY');
  await request('PATCH', `/orders/${orderId}/status`, { status: 'preparing' }, ownerToken);
  const readyRes = await request('PATCH', `/orders/${orderId}/status`, { status: 'ready' }, ownerToken);
  ok('Status Updated', readyRes.body.order.status);

  // 5. Verify OTP
  step(5, 'Store Owner: Verify Customer OTP to complete pickup');
  info(`Verifying with OTP: ${otpCode}`);
  const verifyRes = await request('POST', `/orders/${orderId}/verify-otp`, {
    otp: otpCode
  }, ownerToken);

  if (verifyRes.status === 200) {
    ok('OTP Verified', 'Order Completed!');
    ok('Final Status', verifyRes.body.order.status);
    console.log(`\n${c.green}${c.bold}🎉 PICKUP FLOW COMPLETED SUCCESSFULLY${c.reset}\n`);
  } else {
    console.log('OTP Verification Failed:', verifyRes.body);
  }
}

run().catch(console.error);
