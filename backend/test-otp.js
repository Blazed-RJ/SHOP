
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5003/api/auth';

async function test() {
    try {
        const loginRes = await fetch(`${BASE_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: 'otp_user_final',
                password: 'password123',
                deviceId: 'device_test_001'
            })
        });
        const loginData = await loginRes.json();
        console.log('USER_ID:', loginData.userId);
    } catch (e) {
        console.log('Login Error:', e.message);
    }
}

test();
