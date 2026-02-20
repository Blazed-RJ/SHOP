import mongoose from 'mongoose';

async function run() {
    await mongoose.connect('mongodb://127.0.0.1:27017/mobile_pos_db');

    // Check categories
    const Cat = mongoose.model('Category', new mongoose.Schema({ name: String, parentCategory: mongoose.Schema.Types.ObjectId, user: mongoose.Schema.Types.ObjectId }));
    const cats = await Cat.find({ name: { $in: ['Audio', 'Cable', 'Chargers', 'Glass', 'Phone'] } });
    console.log('Categories:', cats);

    // Check products
    const Prod = mongoose.model('Product', new mongoose.Schema({ name: String, category: String, subCategory: String, subSubCategory: String }));
    const prods = await Prod.find({ category: { $in: ['Audio', 'Cable', 'Chargers', 'Glass', 'Phone'] } });
    console.log('Product count for these categories:', prods.length);

    // Look at an example product to see if it has a subcategory
    if (prods.length > 0) {
        console.log('Example product:', prods[0]);
    }

    process.exit(0);
}
run();
