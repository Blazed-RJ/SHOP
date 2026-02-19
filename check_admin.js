import mongoose from 'mongoose';
import User from './backend/models/User.js';
import dotenv from 'dotenv';
dotenv.config();

const checkAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const user = await User.findOne({ username: 'admin' });
        console.log('User found:', user ? { username: user.username, role: user.role } : 'Not Found');

        if (user && !user.role) {
            console.log('Updating user role to Admin...');
            user.role = 'Admin';
            await user.save();
            console.log('User role updated.');
        }
        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

checkAdmin();
