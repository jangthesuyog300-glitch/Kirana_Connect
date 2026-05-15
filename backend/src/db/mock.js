const stores = [
  {
    id: 'store-1',
    owner_id: 'owner-456',
    name: "Ramesh General Store",
    category: "Grocery",
    description: "Your friendly neighborhood grocery store",
    address: "12 MG Road, Bangalore",
    location: { lat: 12.9716, lng: 77.5946 },
    rating: 4.5,
    total_ratings: 128,
    is_open: true,
    delivery_enabled: true,
    delivery_radius: 3,
    min_order_amount: 100,
    opening_time: '08:00',
    closing_time: '22:00',
    distance_km: 1.2,
    is_favourite: false,
    image_url: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?q=80&w=300&h=200&auto=format&fit=crop'
  },
  {
    id: 'store-2',
    owner_id: 'owner-789',
    name: "Shri Laxmi Kirana",
    category: "Grocery",
    description: "Quality grains and spices",
    address: "45 Brigade Road, Bangalore",
    location: { lat: 12.9741, lng: 77.6100 },
    rating: 4.2,
    total_ratings: 85,
    is_open: true,
    delivery_enabled: true,
    delivery_radius: 4,
    min_order_amount: 200,
    opening_time: '09:00',
    closing_time: '21:00',
    distance_km: 2.5,
    is_favourite: false,
    image_url: 'https://images.unsplash.com/photo-1583258292688-d0213dc5a3a8?q=80&w=300&h=200&auto=format&fit=crop'
  },
  {
    id: 'store-3',
    owner_id: 'owner-101',
    name: "City Pharma",
    category: "Pharmacy",
    description: "All medicines available 24/7",
    address: "88 Commercial Street, Bangalore",
    location: { lat: 12.9800, lng: 77.6050 },
    rating: 4.8,
    total_ratings: 250,
    is_open: true,
    delivery_enabled: true,
    delivery_radius: 5,
    min_order_amount: 50,
    opening_time: '00:00',
    closing_time: '23:59',
    distance_km: 1.8,
    is_favourite: false,
    image_url: 'https://images.unsplash.com/photo-1587854692152-cbe660dbbb88?q=80&w=300&h=200&auto=format&fit=crop'
  },
  {
    id: 'store-4',
    owner_id: 'owner-102',
    name: "Spice Garden Restaurant",
    category: "Restaurant",
    description: "Authentic Indian cuisine",
    address: "10 Indiranagar, Bangalore",
    location: { lat: 12.9719, lng: 77.6412 },
    rating: 4.6,
    total_ratings: 500,
    is_open: true,
    delivery_enabled: true,
    delivery_radius: 5,
    min_order_amount: 150,
    opening_time: '11:00',
    closing_time: '23:00',
    distance_km: 3.2,
    is_favourite: false,
    image_url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=300&h=200&auto=format&fit=crop'
  },
  {
    id: 'store-5',
    owner_id: 'owner-103',
    name: "Fresh Fruits & Veggies",
    category: "Grocery",
    description: "Farm fresh organic produce",
    address: "56 Lavelle Road, Bangalore",
    location: { lat: 12.9698, lng: 77.5990 },
    rating: 4.4,
    total_ratings: 120,
    is_open: true,
    delivery_enabled: true,
    delivery_radius: 4,
    min_order_amount: 80,
    opening_time: '07:00',
    closing_time: '20:00',
    distance_km: 0.8,
    is_favourite: false,
    image_url: 'https://images.unsplash.com/photo-1610348725531-843dff563e2c?q=80&w=300&h=200&auto=format&fit=crop'
  },
  {
    id: 'store-6',
    owner_id: 'owner-104',
    name: "Healthy Life Pharmacy",
    category: "Pharmacy",
    description: "Wellness and health products",
    address: "22 Cunningham Road, Bangalore",
    location: { lat: 12.9850, lng: 77.5950 },
    rating: 4.1,
    total_ratings: 65,
    is_open: false,
    delivery_enabled: false,
    delivery_radius: 0,
    min_order_amount: 0,
    opening_time: '09:00',
    closing_time: '21:00',
    distance_km: 2.1,
    is_favourite: false,
    image_url: 'https://images.unsplash.com/photo-1631549916768-4119b2e5f926?q=80&w=300&h=200&auto=format&fit=crop'
  }
];

const master_products = [
  { id: 'mp-1', name: 'Parle-G Biscuits', category: 'Biscuits & Snacks', default_unit: 'piece', default_image: 'https://images.unsplash.com/photo-1621939514649-280e2ee25f60?q=80&w=300', default_description: 'The world\'s largest selling biscuit brand.' },
  { id: 'mp-2', name: 'Amul Butter 500g', category: 'Dairy', default_unit: 'piece', default_image: 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?q=80&w=300', default_description: 'Utterly Butterly Delicious.' },
  { id: 'mp-3', name: 'Coca-Cola 1L', category: 'Beverages', default_unit: 'piece', default_image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?q=80&w=300', default_description: 'Refreshing cold drink.' },
  { id: 'mp-4', name: 'Basmati Rice', category: 'Grocery Staples', default_unit: 'kg', default_image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?q=80&w=300', default_description: 'Long grain aromatic rice.' },
  { id: 'mp-5', name: 'Surf Excel 1kg', category: 'Cleaning & Washing', default_unit: 'piece', default_image: 'https://images.unsplash.com/photo-1626818191500-2445833075c3?q=80&w=300', default_description: 'Stain removal expert.' },
];

const items = [
  { id: 'item-1', store_id: 'store-1', product_id: 'mp-1', price_per_unit: 10, stock_qty: 100, is_available: true, is_custom: false },
  { id: 'item-2', store_id: 'store-1', product_id: 'mp-2', price_per_unit: 250, stock_qty: 20, is_available: true, is_custom: false },
  { id: 'item-3', store_id: 'store-1', name: 'Local Mango Pickle', category: 'Packaged Foods', price_per_unit: 120, stock_qty: 15, is_available: true, is_custom: true, unit: 'piece', image_url: 'https://images.unsplash.com/photo-1588143242085-f50fc7582c5f?w=300&q=80' },
  { id: 'item-4', store_id: 'store-1', product_id: 'mp-3', price_per_unit: 40, stock_qty: 50, is_available: true, is_custom: false },
  { id: 'item-5', store_id: 'store-1', product_id: 'mp-4', price_per_kg: 80, is_weight_based: true, unit: 'kg', stock_qty: 200, is_available: true, is_custom: false },
  { id: 'item-6', store_id: 'store-1', product_id: 'mp-5', price_per_unit: 150, stock_qty: 30, is_available: true, is_custom: false },
  { id: 'item-7', store_id: 'store-1', name: 'Fresh Paneer', category: 'Dairy', price_per_kg: 300, is_weight_based: true, unit: 'kg', stock_qty: 10, is_available: true, is_custom: true, image_url: 'https://images.unsplash.com/photo-1588143242085-f50fc7582c5f?w=300&q=80' },
  { id: 'item-8', store_id: 'store-1', name: 'Atta 5kg', category: 'Grocery Staples', price_per_unit: 200, stock_qty: 40, is_available: true, is_custom: true, unit: 'piece', image_url: 'https://images.unsplash.com/photo-1621939514649-280e2ee25f60?w=300&q=80' },
  { id: 'item-9', store_id: 'store-1', name: 'Tata Salt 1kg', category: 'Grocery Staples', price_per_unit: 20, stock_qty: 100, is_available: true, is_custom: true, unit: 'piece', image_url: 'https://images.unsplash.com/photo-1621939514649-280e2ee25f60?w=300&q=80' },
  { id: 'item-10', store_id: 'store-1', name: 'Turmeric Powder 200g', category: 'Spices', price_per_unit: 45, stock_qty: 60, is_available: true, is_custom: true, unit: 'piece', image_url: 'https://images.unsplash.com/photo-1588143242085-f50fc7582c5f?w=300&q=80' },
  { id: 'item-11', store_id: 'store-1', name: 'Red Chilli Powder 200g', category: 'Spices', price_per_unit: 50, stock_qty: 55, is_available: true, is_custom: true, unit: 'piece', image_url: 'https://images.unsplash.com/photo-1588143242085-f50fc7582c5f?w=300&q=80' },
];

const orders = [];
const store_workers = []; // { store_id, worker_id, is_active, created_at }
const worker_status = []; // { worker_id, store_id, is_busy, active_order_id, updated_at }

const upsertWorkerStatus = (workerId, storeId) => {
  const idx = worker_status.findIndex(w => w.worker_id === workerId);
  if (idx === -1) {
    const row = { worker_id: workerId, store_id: storeId, is_busy: false, active_order_id: null, updated_at: new Date() };
    worker_status.push(row);
    return row;
  }
  worker_status[idx].store_id = storeId;
  worker_status[idx].updated_at = new Date();
  return worker_status[idx];
};

const query = async (text, params) => {
  console.log('MOCK QUERY:', text.substring(0, 60), params);
  
  // Master Products list
  if (text.includes('FROM master_products')) {
    if (params && params[0]) { // search filter
      const search = params[0].replace(/%/g, '').toLowerCase();
      return { rows: master_products.filter(p => p.name.toLowerCase().includes(search) || p.category.toLowerCase().includes(search)) };
    }
    return { rows: master_products };
  }

  // Nearby stores
  if (text.includes('ST_DWithin')) {
    const radius = params[2];
    const filtered = stores.filter(s => s.distance_km <= radius);
    return { rows: filtered.sort((a, b) => b.rating - a.rating || a.distance_km - b.distance_km) };
  }
  
  // Single store detail
  if (text.includes('FROM stores s') && text.includes('WHERE s.id = $1')) {
    const store = stores.find(s => s.id === params[0]);
    if (store) {
      return { rows: [{ ...store, owner_name: 'Ramesh Kumar', owner_phone: '9876543210' }] };
    }
    return { rows: [] };
  }

  // Store ownership check: SELECT id FROM stores WHERE id = $1 AND owner_id = $2
  if (text.includes('FROM stores') && text.includes('owner_id = $2')) {
    const store = stores.find(s => s.id === params[0] && s.owner_id === params[1]);
    return { rows: store ? [store] : [] };
  }

  // GET /stores/my/store — find store by owner_id = $1
  if (text.includes('FROM stores') && text.includes('owner_id = $1')) {
    const ownerId = params[0];
    const found = stores.filter(s => s.owner_id === ownerId);
    return { rows: found };
  }

  // Create store (with one-store constraint check)
  if (text.includes('INSERT INTO stores')) {
    const ownerId = params[0];
    const existing = stores.find(s => s.owner_id === ownerId);
    if (existing) {
      throw new Error('You can only manage one store with this account.');
    }

    const newStore = {
      id: 'store-' + Math.random().toString(36).substr(2, 5),
      owner_id: ownerId,
      name: params[1],
      description: params[2],
      address: params[3],
      phone: params[6],
      opening_time: params[7],
      closing_time: params[8],
      rating: 0,
      total_ratings: 0,
      is_open: true,
      delivery_enabled: true,
      delivery_radius: 3,
      min_order_amount: 100,
      distance_km: 0,
      is_favourite: false,
      created_at: new Date()
    };
    stores.push(newStore);
    return { rows: [newStore] };
  }

  // Store items list (with join to master_products)
  if (text.includes('FROM store_items') || text.includes('FROM items')) {
    // ownership check: SELECT id FROM stores WHERE id=$1 AND owner_id=$2
    if (text.includes('WHERE id = $1 AND owner_id = $2') || text.includes('WHERE id=$1 AND owner_id=$2')) {
      const store = stores.find(s => s.id === params[0] && s.owner_id === params[1]);
      return { rows: store ? [store] : [] };
    }

    // ownership check via join: SELECT si.id, si.store_id FROM store_items si JOIN stores...
    if (text.includes('JOIN stores') && text.includes('owner_id = $2')) {
      const item = items.find(i => i.id === params[0]);
      if (!item) return { rows: [] };
      const store = stores.find(s => s.id === item.store_id && s.owner_id === params[1]);
      return { rows: store ? [{ ...item, store_id: item.store_id }] : [] };
    }

    // order placement check: SELECT * FROM items WHERE id = $1 AND store_id = $2 AND is_available = TRUE
    if (text.includes('id = $1 AND store_id = $2 AND is_available = TRUE')) {
      const item = items.find(i => i.id === params[0] && i.store_id === params[1] && i.is_available === true);
      if (item) {
        let enriched = { ...item };
        if (item.product_id) {
          const mp = master_products.find(p => p.id === item.product_id);
          if (mp) {
            enriched = { ...mp, ...item, name: mp.name, category: mp.category, image_url: mp.default_image, description: mp.default_description };
          }
        }
        return { rows: [enriched] };
      }
      return { rows: [] };
    }

    const storeId = params[0];
    const storeItems = items.filter(i => i.store_id === storeId);
    
    let enrichedItems = storeItems.map(item => {
      if (item.product_id) {
        const mp = master_products.find(p => p.id === item.product_id);
        return mp ? { ...mp, ...item, name: mp.name, category: mp.category, image_url: mp.default_image, description: mp.default_description } : item;
      }
      return item;
    });

    const categoryMatch = text.match(/category = \$(\d+)/);
    if (categoryMatch) {
      const catParam = params[parseInt(categoryMatch[1]) - 1];
      enrichedItems = enrichedItems.filter(i => i.category === catParam);
    }
    
    const limitMatch = text.match(/LIMIT \$(\d+)/);
    const offsetMatch = text.match(/OFFSET \$(\d+)/);
    
    if (offsetMatch) {
      const offset = params[parseInt(offsetMatch[1]) - 1];
      enrichedItems = enrichedItems.slice(offset);
    }
    if (limitMatch) {
      const limit = params[parseInt(limitMatch[1]) - 1];
      enrichedItems = enrichedItems.slice(0, limit);
    }

    return { rows: enrichedItems };
  }

  // Categories
  if (text.includes('DISTINCT category')) {
    const allCats = [...new Set([...items.map(i => i.category), ...master_products.map(p => p.category)])].filter(Boolean);
    return { rows: allCats.map(c => ({ category: c })) };
  }

  // User auth upsert
  if (text.includes('INSERT INTO users')) {
    // Support multiple insert shapes:
    // - auth.js upsert: params = [phone, name, role]
    // - admin.js worker upsert: params = [phone, name]
    const phone = params[0];
    const name = params[1];
    const role = params.length >= 3 ? (params[2] || 'customer') : (text.includes("'worker'") ? 'worker' : 'customer');

    const id =
      role === 'store_owner' ? 'owner-456' :
      role === 'worker' ? 'worker-111' :
      'user-123';

    return { rows: [{ id, phone, name, role }] };
  }

  // User lookup (auth middleware)
  if (text.includes('SELECT id, phone, name, role FROM users')) {
    const userId = params[0] || 'user-123';
    const role =
      userId === 'owner-456' ? 'store_owner' :
      userId === 'worker-111' ? 'worker' :
      'customer';
    const phone =
      userId === 'owner-456' ? '+919999000001' :
      userId === 'worker-111' ? '+919999000005' :
      '+919999000002';
    return { rows: [{ id: userId, phone, name: 'Mock User', role }] };
  }

  // store_workers lookup
  if (text.includes('FROM store_workers') && text.includes('worker_id = $1')) {
    const workerId = params[0];
    const rows = store_workers.filter(sw => sw.worker_id === workerId && sw.is_active === true);
    return { rows };
  }

  // List workers for store
  if (text.includes('FROM store_workers sw') && text.includes('JOIN users u')) {
    const storeId = params[0];
    const rows = store_workers
      .filter(sw => sw.store_id === storeId)
      .map(sw => {
        const ws = worker_status.find(w => w.worker_id === sw.worker_id);
        return {
          id: sw.worker_id,
          phone: sw.worker_id === 'worker-111' ? '+919999000005' : '+919999000000',
          name: sw.worker_id === 'worker-111' ? 'Worker One' : 'Worker',
          role: 'worker',
          is_active: sw.is_active,
          is_busy: ws?.is_busy ?? false,
          active_order_id: ws?.active_order_id ?? null,
        };
      });
    return { rows };
  }

  // Insert store_workers
  if (text.includes('INSERT INTO store_workers')) {
    const storeId = params[0];
    const workerId = params[1];
    const existing = store_workers.find(sw => sw.store_id === storeId && sw.worker_id === workerId);
    if (existing) {
      existing.is_active = true;
      return { rows: [] };
    }
    store_workers.push({ store_id: storeId, worker_id: workerId, is_active: true, created_at: new Date() });
    return { rows: [] };
  }

  // Ensure worker_status exists
  if (text.includes('INSERT INTO worker_status')) {
    const workerId = params[0];
    const storeId = params[1];
    upsertWorkerStatus(workerId, storeId);
    return { rows: [] };
  }

  // Read worker_status
  if (text.includes('SELECT is_busy') && text.includes('FROM worker_status')) {
    const workerId = params[0];
    const row = worker_status.find(w => w.worker_id === workerId);
    return { rows: row ? [row] : [{ is_busy: false, active_order_id: null }] };
  }

  // Lock worker_status row (FOR UPDATE)
  if (text.includes('SELECT is_busy FROM worker_status') && text.includes('FOR UPDATE')) {
    const workerId = params[0];
    const row = worker_status.find(w => w.worker_id === workerId) || upsertWorkerStatus(workerId, 'store-1');
    return { rows: [row] };
  }

  // Update worker_status busy/active order
  if (text.includes('UPDATE worker_status') && text.includes('SET is_busy = TRUE')) {
    const orderId = params[0];
    const workerId = params[1];
    const row = worker_status.find(w => w.worker_id === workerId) || upsertWorkerStatus(workerId, 'store-1');
    row.is_busy = true;
    row.active_order_id = orderId;
    row.updated_at = new Date();
    return { rows: [] };
  }
  if (text.includes('UPDATE worker_status') && text.includes('SET is_busy = FALSE')) {
    const workerId = params[0];
    const row = worker_status.find(w => w.worker_id === workerId) || upsertWorkerStatus(workerId, 'store-1');
    row.is_busy = false;
    row.active_order_id = null;
    row.updated_at = new Date();
    return { rows: [] };
  }

  // OTP verification (always succeed for mock)
  if (text.includes('FROM otps')) {
    return { rows: [{ id: 1 }] };
  }
  
  // Order placement
  if (text.includes('INSERT INTO orders')) {
    const newOrder = { 
      id: 'order-' + Math.random().toString(36).substr(2, 9),
      customer_id: params[0],
      store_id: params[1],
      delivery_type: params[2],
      payment_method: params[4],
      total_amount: params[7],
      status: 'placed',
      otp_code: null,
      otp_expiry: null,
      assigned_worker_id: null,
      created_at: new Date()
    };
    orders.push(newOrder);
    return { rows: [newOrder] };
  }

  // Accept order + generate OTP
  if (text.includes("SET status = 'accepted'") && text.includes('otp_code = $2')) {
    const prepTime = params[0];
    const otpCode = params[1];
    const otpExpiry = params[2];
    const id = params[3];
    const idx = orders.findIndex(o => o.id === id);
    if (idx !== -1) {
      orders[idx].status = 'accepted';
      orders[idx].prep_time_minutes = prepTime ?? orders[idx].prep_time_minutes;
      orders[idx].otp_code = otpCode || null;
      orders[idx].otp_expiry = otpExpiry || null;
      return { rows: [orders[idx]] };
    }
    return { rows: [] };
  }

  // Worker accept (includes assigned_worker_id)
  if (text.includes("SET status = 'accepted'") && text.includes('assigned_worker_id = $2')) {
    const prepTime = params[0];
    const workerId = params[1];
    const otpCode = params[2];
    const otpExpiry = params[3];
    const id = params[4];
    const idx = orders.findIndex(o => o.id === id);
    if (idx !== -1) {
      orders[idx].status = 'accepted';
      orders[idx].prep_time_minutes = prepTime ?? orders[idx].prep_time_minutes;
      orders[idx].assigned_worker_id = workerId;
      orders[idx].otp_code = otpCode || null;
      orders[idx].otp_expiry = otpExpiry || null;
      return { rows: [orders[idx]] };
    }
    return { rows: [] };
  }

  // Update item
  if (text.includes('UPDATE store_items') || text.includes('UPDATE items')) {
    const idParam = params[params.length - 1]; // last param is always id
    const idx = items.findIndex(i => i.id === idParam);
    if (idx === -1) return { rows: [] };
    const updated = { ...items[idx] };
    if (params[0] !== undefined && params[0] !== null) updated.name = params[0];
    if (params[9] !== undefined && params[9] !== null) updated.is_available = params[9];
    items[idx] = updated;
    return { rows: [updated] };
  }

  // Add Item (from catalog or custom)
  if (text.includes('INSERT INTO store_items') || text.includes('INSERT INTO items')) {
    // Param order: $1=store_id, $2=product_id, $3=name, $4=description, $5=category,
    //              $6=price_per_kg, $7=price_per_unit, $8=is_weight_based, $9=unit,
    //              $10=stock_qty, $11=low_stock_alert, $12=image_url, $13=is_custom
    const newItem = {
      id: 'item-' + Math.random().toString(36).substr(2, 6),
      store_id: params[0],
      product_id: params[1],
      name: params[2],
      description: params[3],
      category: params[4],
      price_per_kg: params[5],
      price_per_unit: params[6],
      unit: params[8] || 'piece',
      stock_qty: params[9],
      is_available: true,
      is_custom: params[12] !== undefined ? params[12] : !params[1]
    };
    // If linked to master product, pull in master details
    if (newItem.product_id) {
      const mp = master_products.find(p => p.id === newItem.product_id);
      if (mp) {
        newItem.name = mp.name;
        newItem.category = mp.category;
        newItem.image_url = mp.default_image;
        newItem.description = mp.default_description;
      }
    }
    items.push(newItem);
    return { rows: [newItem] };
  }

  // My Orders
  if (text.includes('FROM orders o')) {
    return {
      rows: orders.map(o => ({
        ...o,
        store_name: 'Ramesh General Store',
        accepted_by_name: o.assigned_worker_id ? 'Worker One' : null,
        accepted_by_phone: o.assigned_worker_id ? '+919999000005' : null,
      }))
    };
  }

  // Update order status
  if (text.includes('UPDATE orders SET status = $1')) {
    const status = params[0];
    const prep_time = params[1];
    const id = params[2];
    const idx = orders.findIndex(o => o.id === id);
    if (idx !== -1) {
      orders[idx].status = status;
      if (prep_time) orders[idx].prep_time_minutes = prep_time;
      return { rows: [orders[idx]] };
    }
    return { rows: [] };
  }

  // Mark collected/delivered and clear OTP
  if (text.includes("SET status = $1") && text.includes('otp_code = NULL')) {
    const newStatus = params[0];
    const id = params[1];
    const idx = orders.findIndex(o => o.id === id);
    if (idx !== -1) {
      orders[idx].status = newStatus;
      orders[idx].otp_code = null;
      orders[idx].otp_expiry = null;
      return { rows: [orders[idx]] };
    }
    return { rows: [] };
  }

  // Order by ID
  if (text.includes('FROM orders WHERE id = $1') || text.includes('FROM orders o JOIN stores')) {
    const id = params[0];
    const order = orders.find(o => o.id === id);
    if (order) return { rows: [order] };
    return { rows: [] };
  }

  return { rows: [] };
};

const getClient = async () => ({
  query: (text, params) => query(text, params),
  release: () => {}
});

module.exports = { query, getClient, pool: { on: () => {} } };
