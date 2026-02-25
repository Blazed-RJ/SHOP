const BASE = 'https://shop-production-b036.up.railway.app/api';

// Step 1: Login
console.log('1. Logging in as sharogiadigital...');
const loginRes = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'sharogiadigital', password: 'admin123', deviceId: 'test-supplier-debug-001' })
});
const loginData = await loginRes.json();
console.log('Login response:', JSON.stringify(loginData));

// If OTP required, we need to check what's in Railway DB for the OTP
if (loginData.requireOtp) {
    const { MongoClient, ObjectId } = await import('mongodb');
    const client = new MongoClient('mongodb://mongo:ywTpcBRnVIuDMUsmXbPlMQlPitqutIdL@shinkansen.proxy.rlwy.net:22494');
    await client.connect();
    const db = client.db('test');
    const user = await db.collection('users').findOne({ username: 'sharogiadigital' }, { projection: { otp: 1, otpExpires: 1, trustedDevices: 1 } });
    console.log('OTP from DB:', user?.otp, 'Expires:', user?.otpExpires);

    // Verify OTP
    const verifyRes = await fetch(`${BASE}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: loginData.userId, otp: user?.otp, deviceId: 'test-supplier-debug-001' })
    });
    const verifyData = await verifyRes.json();
    console.log('Verify response:', JSON.stringify(verifyData));

    const token = verifyData.token;
    if (token) {
        console.log('\n2. Got token, calling suppliers...');
        const suppRes = await fetch(`${BASE}/suppliers`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const suppData = await suppRes.json();
        console.log('Suppliers response:', JSON.stringify(suppData));
    }
    await client.close();
} else if (loginData.token) {
    const token = loginData.token;
    const suppRes = await fetch(`${BASE}/suppliers`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const suppData = await suppRes.json();
    console.log('Suppliers response:', JSON.stringify(suppData));
}
