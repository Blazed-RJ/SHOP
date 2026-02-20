const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
    try {
        const Product = require('./backend/models/Product.js').default;
        const products = await Product.find({ isActive: true });
        console.log('Active Products count:', products.length);

        const stats = await Product.aggregate([
            { $match: { isActive: true } },
            {
                $group: {
                    _id: null,
                    totalItems: { $sum: 1 },
                    stockValue: { $sum: { $multiply: ["$costPrice", "$stock"] } }
                }
            }
        ]);
        console.log('Stats:', JSON.stringify(stats, null, 2));
    } catch (e) {
        console.error(e);
    }
    process.exit(0);
}).catch(console.error);
