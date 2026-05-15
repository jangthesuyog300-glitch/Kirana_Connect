const { query } = require('./index');
require('dotenv').config();

const CATEGORIES = [
  'Biscuits & Snacks', 'Wafers & Chips', 'Beverages', 'Dairy',
  'Grocery Staples', 'Cleaning & Washing', 'Personal Care',
  'Packaged Foods', 'Spices', 'Oils & Ghee'
];

async function seed() {
  try {
    console.log('🌱 Seeding database...');

    // ─── Seed Master Products ───────────────────────────────────────────────
    const masterProducts = [
      { name: 'Parle-G Biscuits', category: 'Biscuits & Snacks', unit: 'piece', image: 'https://images.unsplash.com/photo-1621939514649-280e2ee25f60?q=80&w=300' },
      { name: 'Amul Butter 500g', category: 'Dairy', unit: 'piece', image: 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?q=80&w=300' },
      { name: 'Coca-Cola 1L', category: 'Beverages', unit: 'piece', image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?q=80&w=300' },
      { name: 'Basmati Rice', category: 'Grocery Staples', unit: 'kg', image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?q=80&w=300' },
      { name: 'Surf Excel 1kg', category: 'Cleaning & Washing', unit: 'piece', image: 'https://images.unsplash.com/photo-1626818191500-2445833075c3?q=80&w=300' },
      { name: 'Lay\'s Classic Salted', category: 'Wafers & Chips', unit: 'piece', image: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?q=80&w=300' },
    ];

    const masterProductIds = {};
    for (const p of masterProducts) {
      const res = await query(
        `INSERT INTO master_products (name, category, default_unit, default_image)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT DO NOTHING
         RETURNING id`,
        [p.name, p.category, p.unit, p.image]
      );
      if (res.rows.length) {
        masterProductIds[p.name] = res.rows[0].id;
      }
    }

    // ─── Seed Owners ────────────────────────────────────────────────────────
    const owners = [
      { phone: '+919999000001', name: 'Ramesh Kumar', email: 'ramesh@example.com' },
      { phone: '+919999000003', name: 'Suresh Raina', email: 'suresh@example.com' },
      { phone: '+919999000004', name: 'Anita Desai', email: 'anita@example.com' },
    ];

    const ownerIds = [];
    for (const o of owners) {
      const res = await query(
        `INSERT INTO users (phone, name, email, role)
         VALUES ($1, $2, $3, 'store_owner')
         ON CONFLICT (phone) DO UPDATE SET name = EXCLUDED.name
         RETURNING id`,
        [o.phone, o.name, o.email]
      );
      ownerIds.push(res.rows[0].id);
    }

    // ─── Seed Customer ──────────────────────────────────────────────────────
    await query(
      `INSERT INTO users (phone, name, email, role)
       VALUES ($1, $2, $3, 'customer')
       ON CONFLICT (phone) DO UPDATE SET name = EXCLUDED.name`,
      ['+919999000002', 'Priya Sharma', 'priya@example.com']
    );

    // ─── Seed Stores (One per owner) ────────────────────────────────────────
    const stores = [
      {
        ownerId: ownerIds[0], name: "Ramesh General Store", category: "Grocery", address: "12 MG Road, Bangalore",
        lat: 12.9716, lng: 77.5946, delivery: true, radius: 3, image: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?q=80&w=300'
      },
      {
        ownerId: ownerIds[1], name: "Suresh Kirana", category: "Grocery", address: "45 Brigade Road, Bangalore",
        lat: 12.9741, lng: 77.6100, delivery: true, radius: 4, image: 'https://images.unsplash.com/photo-1583258292688-d0213dc5a3a8?q=80&w=300'
      },
      {
        ownerId: ownerIds[2], name: "Anita Supermarket", category: "Grocery", address: "7 Indiranagar, Bangalore",
        lat: 12.9784, lng: 77.6408, delivery: false, radius: 2, image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=300'
      },
    ];

    for (const store of stores) {
      const storeRes = await query(
        `INSERT INTO stores (owner_id, name, category, address, location, delivery_enabled, delivery_radius, image_url)
         VALUES ($1, $2, $3, $4, ST_SetSRID(ST_MakePoint($5, $6), 4326)::geography, $7, $8, $9)
         ON CONFLICT (owner_id) DO UPDATE SET name = EXCLUDED.name
         RETURNING id`,
        [store.ownerId, store.name, store.category, store.address, store.lng, store.lat, store.delivery, store.radius, store.image]
      );
      const storeId = storeRes.rows[0].id;

      // ─── Seed Store Items (Mix of Master and Custom) ──────────────────────
      const items = [
        { masterName: 'Parle-G Biscuits', price: 10, stock: 100 },
        { masterName: 'Amul Butter 500g', price: 250, stock: 20 },
        { masterName: 'Coca-Cola 1L', price: 65, stock: 50 },
        { name: 'Handmade Mango Pickle', category: 'Packaged Foods', price: 120, stock: 15, isCustom: true, unit: 'piece' },
      ];

      for (const item of items) {
        if (item.isCustom) {
          await query(
            `INSERT INTO store_items (store_id, name, category, price_per_unit, is_weight_based, unit, stock_qty, is_custom)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [storeId, item.name, item.category, item.price, false, item.unit, item.stock, true]
          );
        } else {
          const productId = masterProductIds[item.masterName];
          if (productId) {
            await query(
              `INSERT INTO store_items (store_id, product_id, price_per_unit, stock_qty, is_available)
               VALUES ($1, $2, $3, $4, true)`,
              [storeId, productId, item.price, item.stock]
            );
          }
        }
      }
      console.log(`✅ Seeded store: ${store.name}`);
    }

    console.log('✅ Seeding complete!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  }
}

seed();
