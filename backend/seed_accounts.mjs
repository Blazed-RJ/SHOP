import mongoose from 'mongoose';

const URI = 'mongodb://mongo:ywTpcBRnVIuDMUsmXbPlMQlPitqutIdL@shinkansen.proxy.rlwy.net:22494/test?authSource=admin';

const defaultGroups = [
    // Top Level
    { name: 'Assets', nature: 'Assets', isSystem: true, parent: null },
    { name: 'Liabilities', nature: 'Liabilities', isSystem: true, parent: null },
    { name: 'Income', nature: 'Income', isSystem: true, parent: null },
    { name: 'Expenses', nature: 'Expenses', isSystem: true, parent: null },

    // Sub Assets
    { name: 'Current Assets', nature: 'Assets', isSystem: true, parent: 'Assets' },
    { name: 'Fixed Assets', nature: 'Assets', isSystem: true, parent: 'Assets' },
    { name: 'Cash-in-Hand', nature: 'Assets', isSystem: true, parent: 'Current Assets' },
    { name: 'Bank Accounts', nature: 'Assets', isSystem: true, parent: 'Current Assets' },
    { name: 'Sundry Debtors', nature: 'Assets', isSystem: true, parent: 'Current Assets' },
    { name: 'Closing Stock', nature: 'Assets', isSystem: true, parent: 'Current Assets' },

    // Sub Liabilities
    { name: 'Current Liabilities', nature: 'Liabilities', isSystem: true, parent: 'Liabilities' },
    { name: 'Capital Account', nature: 'Liabilities', isSystem: true, parent: 'Liabilities' },
    { name: 'Loans (Liability)', nature: 'Liabilities', isSystem: true, parent: 'Liabilities' },
    { name: 'Sundry Creditors', nature: 'Liabilities', isSystem: true, parent: 'Current Liabilities' },
    { name: 'Duties & Taxes', nature: 'Liabilities', isSystem: true, parent: 'Current Liabilities' },

    // Sub Income
    { name: 'Direct Income', nature: 'Income', isSystem: true, parent: 'Income' },
    { name: 'Indirect Income', nature: 'Income', isSystem: true, parent: 'Income' },
    { name: 'Sales Accounts', nature: 'Income', isSystem: true, parent: 'Direct Income' },

    // Sub Expenses
    { name: 'Direct Expenses', nature: 'Expenses', isSystem: true, parent: 'Expenses' },
    { name: 'Indirect Expenses', nature: 'Expenses', isSystem: true, parent: 'Expenses' },
    { name: 'Purchase Accounts', nature: 'Expenses', isSystem: true, parent: 'Direct Expenses' }
];

mongoose.connect(URI)
    .then(async () => {
        const db = mongoose.connection.db;
        console.log("Connected to Railway DB via Proxy for Seeding");

        const groupMap = {}; // name -> _id

        for (const g of defaultGroups) {
            // Check if exists
            let existing = await db.collection('accountgroups').findOne({ name: g.name });

            if (!existing) {
                // Find parent ID
                let parentId = null;
                if (g.parent) {
                    if (groupMap[g.parent]) {
                        parentId = groupMap[g.parent];
                    } else {
                        const p = await db.collection('accountgroups').findOne({ name: g.parent });
                        if (p) parentId = p._id;
                    }
                }

                // Insert
                const result = await db.collection('accountgroups').insertOne({
                    name: g.name,
                    nature: g.nature,
                    isSystem: g.isSystem,
                    parentGroup: parentId,
                    createdAt: new Date(),
                    updatedAt: new Date()
                });

                groupMap[g.name] = result.insertedId;
                console.log(`Created group: ${g.name}`);
            } else {
                groupMap[g.name] = existing._id;
                console.log(`Group already exists: ${g.name}`);
            }
        }

        console.log("\nDefault Account Groups seeded successfully!");
        process.exit();
    }).catch(err => {
        console.error("Seeding failed:", err.message);
        process.exit(1);
    });
