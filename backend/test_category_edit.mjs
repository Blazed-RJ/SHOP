// Test category edit API on Railway
const BASE = 'https://shop-production-b036.up.railway.app/api';

// Login
console.log('1. Logging in...');
const loginRes = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'sharogiadigital', password: 'admin123', deviceId: 'test-category-debug-999' })
});
const loginData = await loginRes.json();
const token = loginData.token;
if (!token) { console.log('Need OTP - checking DB...'); process.exit(0); }

// Get categories
console.log('2. Getting categories...');
const catRes = await fetch(`${BASE}/categories`, { headers: { Authorization: `Bearer ${token}` } });
const cats = await catRes.json();
console.log(`Total categories: ${cats.length}`);
if (cats.length === 0) { console.log('No categories!'); process.exit(0); }

// Try editing the first category
const firstCat = cats[0];
console.log(`\n3. Trying to edit category: ${firstCat.name} (${firstCat._id})`);
const editRes = await fetch(`${BASE}/categories/${firstCat._id}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: firstCat.name, description: firstCat.description || '' })
});
console.log('Edit status:', editRes.status);
const editData = await editRes.json();
console.log('Edit response:', JSON.stringify(editData));
