async function testApi() {
  try {
    const baseURL = 'http://localhost:4000';
    
    console.log('Testing Send OTP...');
    await fetch(`${baseURL}/auth/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: '9999000002' })
    });

    console.log('Testing Verify OTP...');
    const verifyRes = await fetch(`${baseURL}/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: '9999000002', otp: '1234', role: 'customer' })
    });
    const verifyData = await verifyRes.json();
    if (!verifyRes.ok) throw new Error(verifyData.message || 'Verify failed');
    const token = verifyData.token;
    console.log('Token received:', token.substring(0, 20) + '...');

    const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

    console.log('Testing Nearby Stores...');
    const storesRes = await fetch(`${baseURL}/stores/nearby?lat=12.97&lng=77.59`, { headers });
    const storesData = await storesRes.json();
    if (!storesRes.ok) throw new Error(storesData.message || 'Stores failed');
    console.log('Nearby Stores count:', storesData.stores.length);
    const storeId = storesData.stores[0].id;

    console.log('Testing Store Details...');
    const storeDetailRes = await fetch(`${baseURL}/stores/${storeId}?lat=12.97&lng=77.59`, { headers });
    const storeDetailData = await storeDetailRes.json();
    if (!storeDetailRes.ok) throw new Error(storeDetailData.message || 'Store detail failed');
    console.log('Store name:', storeDetailData.store.name);

    console.log('Testing Store Items...');
    const itemsRes = await fetch(`${baseURL}/items?store_id=${storeId}`, { headers });
    const itemsData = await itemsRes.json();
    if (!itemsRes.ok) throw new Error(itemsData.message || 'Items failed');
    console.log('Items count:', itemsData.items.length);
    const itemId = itemsData.items[0].id;

    console.log('Testing Place Order...');
    const orderRes = await fetch(`${baseURL}/orders`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        store_id: storeId,
        delivery_type: 'pickup',
        payment_method: 'cash',
        items: [{ item_id: itemId, quantity: 2 }]
      })
    });
    const orderData = await orderRes.json();
    if (!orderRes.ok) throw new Error(orderData.message || 'Order failed');
    console.log('Order placed successfully! ID:', orderData.order.id);

    console.log('Testing Get Orders...');
    const myOrdersRes = await fetch(`${baseURL}/orders`, { headers });
    const myOrdersData = await myOrdersRes.json();
    if (!myOrdersRes.ok) throw new Error(myOrdersData.message || 'Get orders failed');
    console.log('Orders count:', myOrdersData.orders.length);

    console.log('ALL TESTS PASSED!');
  } catch (err) {
    console.error('TEST FAILED:', err.message);
  }
}

testApi();
