async function testStoreRegistration() {
  try {
    const baseURL = 'http://localhost:4000';
    
    console.log('Testing Send OTP for Store Owner...');
    await fetch(`${baseURL}/auth/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: '9130974599' }) // This phone number isn't special, but we will use 'owner-456' id
    });

    console.log('Testing Verify OTP for Store Owner...');
    // We pass role: 'store_owner'. Our mock checks if role === 'store_owner' then sets id to 'owner-456'
    const verifyRes = await fetch(`${baseURL}/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: '9130974599', otp: '1234', role: 'store_owner' })
    });
    const verifyData = await verifyRes.json();
    if (!verifyRes.ok) throw new Error(verifyData.message || 'Verify failed');
    const token = verifyData.token;
    console.log('Token received:', token.substring(0, 20) + '...');

    const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

    console.log('Testing Get My Store (Should be 404)...');
    const myStoreRes = await fetch(`${baseURL}/stores/my/store`, { headers });
    if (myStoreRes.status === 404) {
      console.log('Got 404 as expected (No store registered yet)');
    } else {
      throw new Error(`Expected 404, got ${myStoreRes.status}`);
    }

    console.log('Testing Create Store...');
    const createRes = await fetch(`${baseURL}/stores`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        name: 'My Kirana Shop',
        description: 'Best grocery store in town',
        address: '123 Main Street, Mumbai',
        lat: 19.0760,
        lng: 72.8777,
        phone: '9999888877',
        opening_time: '09:00',
        closing_time: '21:00'
      })
    });
    const createData = await createRes.json();
    if (!createRes.ok) throw new Error(createData.message || 'Create store failed');
    console.log('Store created successfully! ID:', createData.store.id);

    console.log('Testing Get My Store Again (Should be 200)...');
    const myStoreRes2 = await fetch(`${baseURL}/stores/my/store`, { headers });
    const myStoreData = await myStoreRes2.json();
    if (!myStoreRes2.ok) throw new Error(myStoreData.message || 'Get my store failed');
    console.log('Got store:', myStoreData.store.name);

    console.log('Testing Add New Item...');
    const addItemRes = await fetch(`${baseURL}/items`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        store_id: myStoreData.store.id,
        name: 'Fresh Tomatoes',
        category: 'Vegetables',
        price_per_kg: 40,
        is_weight_based: true,
        is_available: true
      })
    });
    const addItemData = await addItemRes.json();
    if (!addItemRes.ok) throw new Error(addItemData.message || 'Add item failed');
    console.log('Item added successfully! Item ID:', addItemData.item.id);

    console.log('ALL STORE TESTS PASSED!');
  } catch (err) {
    console.error('TEST FAILED:', err.message);
  }
}

testStoreRegistration();
