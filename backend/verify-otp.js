
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5003/api/auth';

async function verify() {
    console.log('--- Verifying OTP ---');
    try {
        const res = await fetch(`${BASE_URL}/verify-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: '69838cb7b61e58b6a12bacfb',
                otp: '990585',
                deviceId: 'device_test_001'
            })
        });
        const data = await res.json();
        if (data.token) {
            console.log('SUCCESS: Token received:', data.token.substring(0, 20) + '...');
        } else {
            console.log('FAILURE:', data);
        }
    } catch (e) {
        console.log('Verify Error:', e.message);
    }
}

verify();
