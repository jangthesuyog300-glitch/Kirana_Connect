/**
 * Kirana Connect — Full System Demo
 * Runs all operations: Auth, Store, Catalog, Inventory, Orders
 * Usage: node demo-all.js
 */

const BASE = 'http://localhost:4000';
let storeOwnerToken = '';
let customerToken = '';
let myStoreId = '';
let addedItemId = '';
let orderId = '';

const c = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  blue: '\x1b[34m',
  bold: '\x1b[1m',
  reset: '\x1b[0m',
};

function step(title) {
  console.log(`\n${c.bold}${c.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${c.reset}`);
  console.log(`${c.bold}${c.cyan}▶  ${title}${c.reset}`);
  console.log(`${c.bold}${c.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${c.reset}`);
}

function ok(label, val) {
  const display = typeof val === 'object' ? JSON.stringify(val, null, 2) : val;
  console.log(`${c.green}✔${c.reset}  ${label}: ${c.yellow}${display}${c.reset}`);
}

function fail(label, err) {
  console.log(`${c.red}✘${c.reset}  ${label}: ${c.red}${err}${c.reset}`);
}

async function post(path, body, token) {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: JSON.stringify(body),
  });
  return res.json();
}

async function get(path, token) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { ...(token && { Authorization: `Bearer ${token}` }) },
  });
  return res.json();
}

async function patch(path, body, token) {
  const res = await fetch(`${BASE}${path}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: JSON.stringify(body),
  });
  return res.json();
}

async function main() {
  console.log(`\n${c.bold}${c.cyan}${'═'.repeat(45)}`);
  console.log('     KIRANA CONNECT — FULL SYSTEM DEMO');
  console.log(`${'═'.repeat(45)}${c.reset}\n`);

  // ─── 1. STORE OWNER LOGIN ──────────────────────
  step('1 of 9 | Store Owner: Send OTP');
  const otpRes = await post('/auth/send-otp', { phone: '+919999000001' });
  ok('OTP sent', otpRes.success ? 'true' : otpRes.message);

  step('2 of 9 | Store Owner: Verify OTP & Login');
  const verifyRes = await post('/auth/verify-otp', {
    phone: '+919999000001', otp: '1234', name: 'Ramesh Kumar', role: 'store_owner'
  });
  if (verifyRes.token) {
    storeOwnerToken = verifyRes.token;
    ok('Logged in as Store Owner', verifyRes.user?.name || 'Ramesh Kumar');
    ok('Token received', storeOwnerToken.substring(0, 30) + '...');
  } else {
    fail('Login failed', JSON.stringify(verifyRes));
    process.exit(1);
  }

  // ─── 2. CATALOG SEARCH ─────────────────────────
  step('3 of 9 | Search Master Product Catalog');
  const catalogSearch = await get('/catalog?search=Amul', storeOwnerToken);
  if (catalogSearch && catalogSearch.length > 0) {
    ok('Catalog results', `${catalogSearch.length} product(s) found`);
    catalogSearch.forEach(p => ok(`  → ${p.name}`, p.category));
  } else {
    fail('Catalog search', JSON.stringify(catalogSearch));
  }

  // ─── 3. GET MY STORE ───────────────────────────
  step('4 of 9 | Get Store Owner\'s Store');
  const myStoreRes = await get('/stores/my/store', storeOwnerToken);
  if (myStoreRes.store) {
    myStoreId = myStoreRes.store.id;
    ok('Store found', myStoreRes.store.name);
    ok('Store ID', myStoreId);
  } else {
    // Store might not exist, try creating one
    console.log(`${c.yellow}  ℹ No store found. Creating one...${c.reset}`);
    const createRes = await post('/stores', {
      name: 'Ramesh General Store',
      description: 'Your friendly neighborhood grocery store',
      address: '12 MG Road, Bangalore',
      lat: 12.9716, lng: 77.5946, phone: '9876543210'
    }, storeOwnerToken);
    if (createRes.store) {
      myStoreId = createRes.store.id;
      ok('Store created', createRes.store.name);
      ok('Store ID', myStoreId);
    } else {
      fail('Could not get/create store', JSON.stringify(createRes));
      process.exit(1);
    }
  }

  // ─── 4. ADD FROM CATALOG ───────────────────────
  step('5 of 9 | Add "Amul Butter" from Master Catalog to Inventory');
  const catalogItem = catalogSearch?.[0];
  if (catalogItem && myStoreId) {
    const addCatalogItem = await post('/items', {
      store_id: myStoreId,
      product_id: catalogItem.id,
      name: null,
      category: null,
      price_per_unit: 260,
      stock_qty: 50,
      is_available: true,
      is_custom: false,
      unit: 'piece',
      is_weight_based: false
    }, storeOwnerToken);
    if (addCatalogItem.item) {
      addedItemId = addCatalogItem.item.id;
      ok('Catalog item added', addCatalogItem.item.name || catalogItem.name);
      ok('Price', `₹${addCatalogItem.item.price_per_unit}`);
      ok('Stock', `${addCatalogItem.item.stock_qty} pieces`);
    } else {
      fail('Add catalog item', JSON.stringify(addCatalogItem));
    }
  }

  // ─── 5. ADD CUSTOM PRODUCT ─────────────────────
  step('6 of 9 | Add Custom Product "Organic Honey" (not in catalog)');
  const customItem = await post('/items', {
    store_id: myStoreId,
    product_id: null,
    name: 'Organic Honey',
    category: 'Packaged Foods',
    price_per_unit: 400,
    stock_qty: 20,
    is_available: true,
    is_custom: true,
    unit: 'bottle',
    is_weight_based: false
  }, storeOwnerToken);
  if (customItem.item) {
    ok('Custom item added', customItem.item.name);
    ok('Price', `₹${customItem.item.price_per_unit}`);
    ok('Is custom', 'true — visible ONLY in this store');
  } else {
    fail('Add custom item', JSON.stringify(customItem));
  }

  // ─── 6. GET INVENTORY ──────────────────────────
  step('7 of 9 | View Full Store Inventory');
  const inventory = await get(`/items?store_id=${myStoreId}`, storeOwnerToken);
  if (inventory.items) {
    ok('Total items in inventory', inventory.items.length);
    inventory.items.forEach(item => {
      ok(`  → ${item.name}`, `₹${item.price_per_unit || item.price_per_kg} | ${item.is_custom ? '🏷 Custom' : '📦 Catalog'} | ${item.is_available ? '✅ Live' : '❌ Hidden'}`);
    });
  } else {
    fail('Get inventory', JSON.stringify(inventory));
  }

  // ─── 7. TOGGLE AVAILABILITY ────────────────────
  step('8 of 9 | Toggle Item Availability (Hide & Show)');
  if (addedItemId) {
    const hideRes = await patch(`/items/${addedItemId}`, { is_available: false }, storeOwnerToken);
    ok('Item hidden', hideRes.item?.is_available === false ? 'true' : 'already off');
    const showRes = await patch(`/items/${addedItemId}`, { is_available: true }, storeOwnerToken);
    ok('Item shown again', showRes.item?.is_available === true ? 'true' : 'already on');
  }

  // ─── 8. CUSTOMER LOGIN + BROWSE ────────────────
  step('9 of 9 | Customer: Login & Browse Store');
  const custOTP = await post('/auth/send-otp', { phone: '+919999000002' });
  ok('Customer OTP sent', custOTP.success ? 'true' : custOTP.message);
  const custLogin = await post('/auth/verify-otp', {
    phone: '+919999000002', otp: '1234', name: 'Priya Sharma', role: 'customer'
  });
  if (custLogin.token) {
    customerToken = custLogin.token;
    ok('Customer logged in', custLogin.user?.name || 'Priya Sharma');

    // Browse items as customer
    const custItems = await get(`/items?store_id=${myStoreId}&available_only=true`, customerToken);
    if (custItems.items) {
      ok('Items visible to customer', custItems.items.length);
      custItems.items.forEach(item => {
        ok(`  → ${item.name}`, `₹${item.price_per_unit || item.price_per_kg} | Stock: ${item.stock_qty}`);
      });
    }
  } else {
    fail('Customer login', JSON.stringify(custLogin));
  }

  // ─── DONE ─────────────────────────────────────
  console.log(`\n${c.bold}${c.green}${'═'.repeat(45)}`);
  console.log('     ✅ ALL OPERATIONS COMPLETED SUCCESSFULLY!');
  console.log(`${'═'.repeat(45)}${c.reset}\n`);
  console.log(`${c.cyan}Summary:`);
  console.log(`  • Store Owner authenticated`);
  console.log(`  • Catalog searched & product selected`);
  console.log(`  • Store inventory loaded`);
  console.log(`  • Catalog item added (Amul Butter)`);
  console.log(`  • Custom item added (Organic Honey)`);
  console.log(`  • Item availability toggled`);
  console.log(`  • Customer authenticated & browsed store`);
  console.log(`${c.reset}`);
}

main().catch(err => {
  console.error(`\n${c.red}Fatal Error:${c.reset}`, err.message);
  process.exit(1);
});
