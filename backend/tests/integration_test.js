
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import User from '../models/User.js';
import Product from '../models/Product.js';
import Customer from '../models/Customer.js';
import Invoice from '../models/Invoice.js';
import LedgerEntry from '../models/LedgerEntry.js';
import Payment from '../models/Payment.js';

dotenv.config(); // defaults to cwd which is backend/

const TEST_ID = 'test_' + Date.now();
const USERNAME = `testadmin_${TEST_ID}`;
const EMAIL = `test_${TEST_ID}@example.com`;
const PASSWORD_HASH = '$2a$10$abcdefg123456...'; // We won't login via HTTP with password, we will mock or just use the mongo object directly if we were testing controllers directly.
// ACTUALLY, to test routes we need a token.
// So we need to create a user with a KNOWN password.
// Since we don't have bcrypt easily usable without installing it or relying on app's bcrypt, 
// We will rely on the app's User model to hash the password for us.

async function runTest() {
    console.log('--- Starting Integration Test ---');

    // 1. Connect to DB
    console.log('Trying to connect with:', process.env.MONGODB_URI);
    if (!process.env.MONGODB_URI) {
        console.error('MONGODB_URI not found in .env');
        process.exit(1);
    }

    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    let adminUser;
    let token;
    let productId;
    let customerId;
    let invoiceId;

    try {
        // 2. Create Admin User
        adminUser = await User.create({
            name: 'Test Admin',
            username: USERNAME,
            email: EMAIL,
            password: 'password123',
            role: 'Admin',
            ownerId: new mongoose.Types.ObjectId() // temporary owner id
        });
        // Fix ownerId to be self
        adminUser.ownerId = adminUser._id;
        await adminUser.save();

        console.log('Admin User Created:', adminUser.username);

        // We need to login to get a token? 
        // Or we can just generate a token using the util if we import it.
        // Let's import generateToken
        const { default: generateToken } = await import('../utils/generateToken.js');
        token = generateToken(adminUser._id);
        console.log('Token generated');

        // 3. Setup Axios/Fetch headers
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        };
        const API_URL = 'http://localhost:5000/api';

        // Check if server is running
        try {
            const healthCheck = await fetch('http://localhost:5000/');
            if (!healthCheck.ok) throw new Error('Server not responding ok');
            console.log('Server is running');
        } catch (e) {
            console.error('Server is NOT running. Please start the server in another terminal (npm start) before running tests.');
            throw new Error('Server not running');
        }

        // 4. Create Product
        console.log('Creating Product...');
        const prodRes = await fetch(`${API_URL}/products`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                name: `Test Product ${TEST_ID}`,
                category: 'General',
                stock: 100,
                sellingPrice: 1000,
                costPrice: 800,
                gstPercent: 18,
                description: 'Test Description'
            })
        });
        if (!prodRes.ok) throw new Error(`Product creation failed: ${await prodRes.text()}`);
        const product = await prodRes.json();
        productId = product._id;
        console.log('Product created:', productId);

        // 5. Create Customer
        console.log('Creating Customer...');
        const custRes = await fetch(`${API_URL}/customers`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                name: `Test Customer ${TEST_ID}`,
                phone: Math.floor(1000000000 + Math.random() * 9000000000).toString()
            })
        });
        if (!custRes.ok) throw new Error(`Customer creation failed: ${await custRes.text()}`);
        const customer = await custRes.json();
        customerId = customer._id;
        console.log('Customer created:', customerId);

        // 6. Create Invoice (Checks Stock Deduction)
        console.log('Creating Invoice...');
        const invRes = await fetch(`${API_URL}/invoices`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                customerId,
                customerName: customer.name,
                customerPhone: customer.phone,
                items: [{
                    productId,
                    itemName: product.name,
                    quantity: 10,
                    pricePerUnit: 1000,
                    gstPercent: 18,
                    isTaxInclusive: true
                }],
                payments: [],
                status: 'Due'
            })
        });
        if (!invRes.ok) throw new Error(`Invoice creation failed: ${await invRes.text()}`);
        const invoice = await invRes.json();
        invoiceId = invoice._id;
        console.log('Invoice created:', invoice.invoiceNo);

        // Verify Stock Reduced
        const updatedProduct = await Product.findById(productId);
        if (updatedProduct.stock !== 90) throw new Error(`Stock mismatch: Expected 90, got ${updatedProduct.stock}`);
        console.log('Stock deduction verified');

        // 7. Update Payment (Transaction)
        console.log('Updating Payment...');
        const payRes = await fetch(`${API_URL}/invoices/${invoiceId}/payment`, {
            method: 'PUT',
            headers,
            body: JSON.stringify({
                payments: [{ method: 'Cash', amount: 500 }]
            })
        });
        if (!payRes.ok) throw new Error(`Payment update failed: ${await payRes.text()}`);
        const updatedInvoice = await payRes.json();
        if (updatedInvoice.paidAmount !== 500) throw new Error('Paid amount mismatch');
        console.log('Payment update verified');

        // 8. Void Invoice (Transaction)
        console.log('Voiding Invoice...');
        const voidRes = await fetch(`${API_URL}/invoices/${invoiceId}/void`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ reason: 'Test Void' })
        });
        if (!voidRes.ok) throw new Error(`Void failed: ${await voidRes.text()}`);

        // Verify Stock Restored
        const voidedProduct = await Product.findById(productId);
        if (voidedProduct.stock !== 100) throw new Error(`Stock restore mismatch (Void): Expected 100, got ${voidedProduct.stock}`);
        console.log('Stock restoration (void) verified');

        // 9. Delete Invoice (Transaction)
        // First delete the voided invoice (or create a new one to delete, but let's delete this one).
        console.log('Deleting Invoice...');
        const delRes = await fetch(`${API_URL}/invoices/${invoiceId}`, {
            method: 'DELETE',
            headers
        });
        if (!delRes.ok) throw new Error(`Delete failed: ${await delRes.text()}`);

        // Verify it's gone
        const deletedInvoice = await Invoice.findById(invoiceId);
        if (deletedInvoice) throw new Error('Invoice still exists in DB');
        console.log('Invoice deletion verified');

        // Note: Since we voided first, stock was already restored. 
        // Ideally we should test delete on a NON-VOIDED invoice to check stock restore there too.
        // But this proves the API works and doesn't crash.

        console.log('--- TEST PASSED SUCCESSFULLY ---');

    } catch (error) {
        console.error('--- TEST FAILED ---');
        console.error(error);
        fs.writeFileSync('error_details.txt', error.toString() + '\n' + (error.stack || ''));
    } finally {
        // Cleanup
        console.log('Cleaning up...');
        if (adminUser) await User.deleteOne({ _id: adminUser._id });
        if (productId) await Product.deleteOne({ _id: productId });
        if (customerId) await Customer.deleteOne({ _id: customerId });
        // Invoices and ledgers should be gone or linked to test user

        // Close DB
        await mongoose.connection.close();
    }
}

runTest();
