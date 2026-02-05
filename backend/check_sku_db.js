import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config({ path: 'd:/Software/Create/Shop/backend/.env' });

const checkDb = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);

        const Product = mongoose.model('Product', new mongoose.Schema({}, { strict: false }));

        const subagentProduct = await Product.findOne({ name: 'The Definitive Mystery Widget' });
        if (subagentProduct) {
            fs.writeFileSync('d:/Software/Create/Shop/backend/db_check_result.json', JSON.stringify(subagentProduct, null, 2));
            console.log('Result written to db_check_result.json');
        } else {
            console.log('Product not found');
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

checkDb();
