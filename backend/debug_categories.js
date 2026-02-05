import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env vars
// Load env vars manually
import fs from 'fs';
const envPath = path.join(__dirname, '.env');
console.log('Loading .env manually from:', envPath);

if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    const match = content.match(/MONGODB_URI=(.*)/);
    if (match && match[1]) {
        process.env.MONGODB_URI = match[1].trim();
        console.log('MONGODB_URI extracted successfully.');
    } else {
        console.error('MONGODB_URI not found in .env content.');
    }
} else {
    console.error('File not found:', envPath);
}

// Ensure no quotes remain if user used quotes
if (process.env.MONGODB_URI && (process.env.MONGODB_URI.startsWith('"') || process.env.MONGODB_URI.startsWith("'"))) {
    process.env.MONGODB_URI = process.env.MONGODB_URI.slice(1, -1);
}

console.log('MONGODB_URI exists now?', !!process.env.MONGODB_URI);

const checkCategories = async () => {
    try {
        console.log('Connecting to MongoDB...');
        if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is undefined');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected.');

        // Define generic schema to read everything
        const CatSchema = new mongoose.Schema({}, { strict: false });
        const Category = mongoose.model('Category', CatSchema);

        const allCats = await Category.find({});
        console.log(`Found ${allCats.length} total categories.`);

        let errorCount = 0;

        // map for lookup
        const catMap = {};
        allCats.forEach(c => {
            catMap[c._id.toString()] = c;
        });

        console.log('\n--- Analyzing Parent References ---');

        for (const cat of allCats) {
            if (cat.parentCategory) {
                const parentId = cat.parentCategory.toString();
                const parentExists = catMap[parentId];

                if (!parentExists) {
                    console.error(`❌ Category "${cat.name}" (ID: ${cat._id}) has ORPHANED parent reference: ${cat.parentCategory}`);
                    errorCount++;
                }

                // Check Type
                if (typeof cat.parentCategory === 'string') {
                    console.warn(`⚠️ Category "${cat.name}" has String parentCategory. Should be ObjectId.`);
                }
            }
        }

        console.log('\n--- Analyzing Sub-Category Linkages for "41512" (Category) -> "456" (Sub) ---');

        // Find 41512
        const mainCat = allCats.find(c => c.name === '41512');
        if (mainCat) {
            console.log(`Found Main Category "41512" (ID: ${mainCat._id})`);
            const subs = allCats.filter(c => c.parentCategory && c.parentCategory.toString() === mainCat._id.toString());
            console.log(`Children of "41512": ${subs.map(s => `"${s.name}" (${s._id})`).join(', ')}`);

            const sub456 = subs.find(s => s.name === '456');
            if (sub456) {
                console.log(`Found Sub Category "456" (ID: ${sub456._id})`);
                const subSubs = allCats.filter(c => c.parentCategory && c.parentCategory.toString() === sub456._id.toString());
                console.log(`Children of "456":`);
                if (subSubs.length === 0) {
                    console.error(`❌ "456" has NO children in the database! (But user sees "cfgb" in products?)`);
                } else {
                    subSubs.forEach(s => console.log(`   - "${s.name}" (${s._id})`));
                }
            } else {
                console.error('❌ Sub Category "456" NOT found as a child of "41512". checking global...');
                const global456 = allCats.find(c => c.name === '456');
                if (global456) {
                    console.log(`Found "456" globally (ID: ${global456._id}), but its parent is: ${global456.parentCategory}`);
                } else {
                    console.error('❌ "456" does not exist anywhere.');
                }
            }
        } else {
            console.log('Category "41512" not found.');
        }

        console.log('\n--- Done ---');
        process.exit();
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
};

checkCategories();
