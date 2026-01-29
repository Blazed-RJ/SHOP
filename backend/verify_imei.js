
// Verification Script for Dual IMEI Feature (Using http module + Demo Login)
// Run with: node verify_imei.js

import http from 'http';

const HOST = '127.0.0.1';
const PORT = 5000;

function request(method, path, body = null, headers = {}) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: HOST,
            port: PORT,
            path: '/api' + path,
            method: method,
            headers: {
                'Content-Type': 'application/json',
                ...headers
            }
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    resolve({ status: res.statusCode, data: parsed });
                } catch (e) {
                    resolve({ status: res.statusCode, data });
                }
            });
        });

        req.on('error', (e) => reject(e));

        if (body) {
            req.write(JSON.stringify(body));
        }
        req.end();
    });
}

async function verify() {
    try {
        console.log('--- Starting Verification (Node HTTP + Demo) ---');

        // 1. Login as Demo Admin
        console.log('1. Logging in as Demo Admin...');
        const loginRes = await request('POST', '/auth/login', {
            username: 'demo',
            password: 'demo'
        });

        if (loginRes.status !== 200) {
            throw new Error(`Login failed (${loginRes.status}): ${JSON.stringify(loginRes.data)}`);
        }
        const token = loginRes.data.token;
        console.log('   -> Logged in as Demo Admin.');

        // 2. Customer - Use random phone to ensure uniqueness
        const randPhone = Math.floor(Math.random() * 10000000000).toString().padStart(10, '0');
        console.log(`2. Creating Test Customer (Phone: ${randPhone})...`);

        const custRes = await request('POST', '/customers', {
            name: 'Dual IMEI Customer',
            phone: randPhone,
            email: 'dual@test.com'
        }, { 'Authorization': `Bearer ${token}` });

        let customerId;
        if (custRes.status === 201) {
            customerId = custRes.data._id;
            console.log(`   -> Unique Customer created: ${customerId}`);
        } else {
            // Fallback: try to fetch an existing customer or just fail
            // Assuming creation works if phone is unique
            throw new Error(`Customer creation failed: ${JSON.stringify(custRes.data)}`);
        }

        // 3. Invoice with Dual IMEI
        console.log('3. Creating Invoice with Dual IMEI...');
        const invoicePayload = {
            customer: customerId,
            customerName: 'Dual IMEI Customer',
            customerPhone: randPhone,
            invoiceType: 'Tax Invoice',
            invoiceDate: new Date().toISOString(),
            totalTaxable: 1000,
            totalGST: 180,
            grandTotal: 1180,
            items: [{
                itemName: 'Test Dual Phone',
                quantity: 1,
                pricePerUnit: 1000,
                gstPercent: 18,
                taxableValue: 1000,
                gstAmount: 180,
                totalAmount: 1180,
                imei: 'TEST-IMEI-1',
                imei2: 'TEST-IMEI-2'
            }],
            payments: []
        };

        const invRes = await request('POST', '/invoices', {
            ...invoicePayload
        }, { 'Authorization': `Bearer ${token}` });

        if (invRes.status !== 201) throw new Error(`Invoice failed: ${JSON.stringify(invRes.data)}`);
        const invoiceId = invRes.data._id;
        console.log(`   -> Invoice created: ${invoiceId}`);

        // 4. Verify
        console.log('4. Fetching Invoice...');
        const getRes = await request('GET', `/invoices/${invoiceId}`, null, { 'Authorization': `Bearer ${token}` });

        const savedItem = getRes.data.items[0];
        console.log(`   -> Saved IMEI 1: ${savedItem.imei}`);
        console.log(`   -> Saved IMEI 2: ${savedItem.imei2}`);

        if (savedItem.imei === 'TEST-IMEI-1' && savedItem.imei2 === 'TEST-IMEI-2') {
            console.log('\n✅ SUCCESS: Both IMEIs were saved correctly!');
        } else {
            console.error('\n❌ FAILURE: IMEI mismatch.');
            console.error(`Expected: TEST-IMEI-1 / TEST-IMEI-2`);
            console.error(`Actual:   ${savedItem.imei} / ${savedItem.imei2}`);
            process.exit(1);
        }

    } catch (error) {
        console.error('\n❌ ERROR:', error.message);
        process.exit(1);
    }
}

verify();
