const BASE = 'http://localhost:5000/api';

// Step 1: Login locally
console.log('1. Logging in locally...');
const loginRes = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'sharogiadigital', password: 'admin123', deviceId: 'local-supplier-test-001' })
});
const loginData = await loginRes.json();
console.log('Login response status:', loginRes.status, JSON.stringify(loginData).slice(0, 200));

const token = loginData.token;
if (!token) {
    console.log('No token — OTP required or login failed. Trying to get OTP from local DB...');
    // Try admin instead
    const adminLogin = await fetch(`${BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'admin', password: 'admin123', deviceId: 'local-supplier-test-admin-001' })
    });
    const adminData = await adminLogin.json();
    console.log('Admin login:', JSON.stringify(adminData).slice(0, 200));

    if (adminData.token) {
        console.log('\n2. Testing suppliers as admin...');
        const suppRes = await fetch(`${BASE}/suppliers`, {
            headers: { 'Authorization': `Bearer ${adminData.token}` }
        });
        console.log('Suppliers status:', suppRes.status);
        const suppData = await suppRes.json();
        console.log('Suppliers:', JSON.stringify(suppData));
    }
} else {
    console.log('\n2. Testing suppliers...');
    const suppRes = await fetch(`${BASE}/suppliers`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log('Suppliers status:', suppRes.status);
    const suppData = await suppRes.json();
    console.log('Suppliers:', JSON.stringify(suppData));
}
