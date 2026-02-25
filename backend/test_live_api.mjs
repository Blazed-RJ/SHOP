const BASE = 'https://shop-production-b036.up.railway.app/api';

console.log('Logging in...');
const loginRes = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'sharogiadigital', password: 'admin123', deviceId: 'test-dashboard-debug' })
});
const loginData = await loginRes.json();
console.log('Login Response:', JSON.stringify(loginData));

if (loginData.requireOtp) {
    const { MongoClient } = await import('mongodb');
    const client = new MongoClient('mongodb://mongo:ywTpcBRnVIuDMUsmXbPlMQlPitqutIdL@shinkansen.proxy.rlwy.net:22494');
    await client.connect();
    const db = client.db('test');
    const user = await db.collection('users').findOne({ username: 'sharogiadigital' });

    console.log('Found OTP:', user?.otp);
    const verifyRes = await fetch(`${BASE}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: loginData.userId, otp: user.otp, deviceId: 'test-dashboard-debug' })
    });
    const verifyData = await verifyRes.json();
    console.log('Verify Response:', JSON.stringify(verifyData));
    const token = verifyData.token;
    await client.close();

    if (!token) process.exit();

    const res = await fetch(`${BASE}/reports/dashboard-summary`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log("\nDashboard response:", JSON.stringify(await res.json(), null, 2));

    const debugRes = await fetch(`${BASE}/reports/debug-payments`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log("\nDebug output:", JSON.stringify(await debugRes.json(), null, 2));

} else {
    // If it didn't require OTP
    if (loginData.token) {
        const token = loginData.token;
        const res = await fetch(`${BASE}/reports/dashboard-summary`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        console.log("\nDashboard response:", JSON.stringify(await res.json(), null, 2));

        const debugRes = await fetch(`${BASE}/reports/debug-payments`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        console.log("\nDebug output:", JSON.stringify(await debugRes.json(), null, 2));
    }
}
