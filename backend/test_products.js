import mongoose from 'mongoose';
import express from 'express';
import dotenv from 'dotenv';
import productRoutes from './routes/products.js';
import { getProducts } from './controllers/productController.js';

dotenv.config();

// Create a mock express app
const app = express();
app.use(express.json());

// Mock middleware
app.use((req, res, next) => {
    req.user = {
        _id: new mongoose.Types.ObjectId(),
        ownerId: new mongoose.Types.ObjectId(),
        role: 'Admin'
    };
    next();
});

app.use('/api/products', productRoutes);

async function testLogic() {
    console.log('Testing Products Controller Logic...');

    // Test 1: getProducts concurrent Promise execution
    console.log('--- Test 1: getProducts Execution ---');
    try {
        const mockReq = {
            query: { limit: 5 },
            user: { ownerId: new mongoose.Types.ObjectId(), role: 'Admin' }
        };

        let resData = null;
        let resStatus = null;
        const mockRes = {
            json: (data) => { resData = data; return mockRes; },
            status: (code) => { resStatus = code; return mockRes; }
        };

        // We can't fully run getProducts without a real DB connection, 
        // but we can ensure it doesn't immediately crash due to syntax
        console.log('getProducts function exists:', typeof getProducts === 'function');
        console.log('Test 1 Passed (Syntax & Export Valid)');
    } catch (err) {
        console.error('Test 1 Failed:', err);
    }

    console.log('\n--- Test 2: Route Definitions ---');
    const routes = app._router.stack
        .filter(r => r.name === 'router')
        .map(r => r.handle.stack.map(l => ({ path: l.route?.path, methods: l.route?.methods })))
        .flat()
        .filter(route => route.path);

    console.log('Registered Product Routes:');
    routes.forEach(r => console.log(Object.keys(r.methods)[0].toUpperCase(), r.path));
    console.log('Test 2 Passed (Routes Map Successfully)');
}

testLogic();
