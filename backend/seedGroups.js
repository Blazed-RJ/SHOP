
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import AccountGroup from './models/AccountGroup.js';

dotenv.config();

const groups = [
    // Primary Groups
    { name: 'Assets', nature: 'Assets', isSystem: true },
    { name: 'Liabilities', nature: 'Liabilities', isSystem: true },
    { name: 'Income', nature: 'Income', isSystem: true },
    { name: 'Expenses', nature: 'Expenses', isSystem: true },

    // Secondary Groups (Assets)
    { name: 'Current Assets', nature: 'Assets', parent: 'Assets', isSystem: true },
    { name: 'Fixed Assets', nature: 'Assets', parent: 'Assets', isSystem: true },
    { name: 'Investments', nature: 'Assets', parent: 'Assets', isSystem: true },
    { name: 'Misc. Expenses (ASSET)', nature: 'Assets', parent: 'Assets', isSystem: true },
    { name: 'Suspense A/c', nature: 'Assets', parent: 'Assets', isSystem: true },

    // Tertiary Groups (Current Assets)
    { name: 'Bank Accounts', nature: 'Assets', parent: 'Current Assets', isSystem: true },
    { name: 'Cash-in-Hand', nature: 'Assets', parent: 'Current Assets', isSystem: true },
    { name: 'Stock-in-Hand', nature: 'Assets', parent: 'Current Assets', isSystem: true },
    { name: 'Sundry Debtors', nature: 'Assets', parent: 'Current Assets', isSystem: true },
    { name: 'Loans & Advances (Asset)', nature: 'Assets', parent: 'Current Assets', isSystem: true },
    { name: 'Deposits (Asset)', nature: 'Assets', parent: 'Current Assets', isSystem: true },

    // Secondary Groups (Liabilities)
    { name: 'Capital Account', nature: 'Liabilities', parent: 'Liabilities', isSystem: true },
    { name: 'Current Liabilities', nature: 'Liabilities', parent: 'Liabilities', isSystem: true },
    { name: 'Loans (Liability)', nature: 'Liabilities', parent: 'Liabilities', isSystem: true },
    { name: 'Branch / Divisions', nature: 'Liabilities', parent: 'Liabilities', isSystem: true },

    // Tertiary Groups (Current Liabilities)
    { name: 'Duties & Taxes', nature: 'Liabilities', parent: 'Current Liabilities', isSystem: true },
    { name: 'Provisions', nature: 'Liabilities', parent: 'Current Liabilities', isSystem: true },
    { name: 'Sundry Creditors', nature: 'Liabilities', parent: 'Current Liabilities', isSystem: true },

    // Tertiary Groups (Loans)
    { name: 'Bank OD A/c', nature: 'Liabilities', parent: 'Loans (Liability)', isSystem: true },
    { name: 'Secured Loans', nature: 'Liabilities', parent: 'Loans (Liability)', isSystem: true },
    { name: 'Unsecured Loans', nature: 'Liabilities', parent: 'Loans (Liability)', isSystem: true },

    // Secondary Groups (Income)
    { name: 'Sales Accounts', nature: 'Income', parent: 'Income', isSystem: true },
    { name: 'Direct Income', nature: 'Income', parent: 'Income', isSystem: true },
    { name: 'Indirect Income', nature: 'Income', parent: 'Income', isSystem: true },

    // Secondary Groups (Expenses)
    { name: 'Purchase Accounts', nature: 'Expenses', parent: 'Expenses', isSystem: true },
    { name: 'Direct Expenses', nature: 'Expenses', parent: 'Expenses', isSystem: true },
    { name: 'Indirect Expenses', nature: 'Expenses', parent: 'Expenses', isSystem: true },
];

const seedGroups = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        for (const group of groups) {
            let parentId = null;
            if (group.parent) {
                const parent = await AccountGroup.findOne({ name: group.parent });
                if (parent) {
                    parentId = parent._id;
                } else {
                    console.warn(`Parent group ${group.parent} not found for ${group.name}, skipping parent link.`);
                }
            }

            const existing = await AccountGroup.findOne({ name: group.name });
            if (!existing) {
                await AccountGroup.create({
                    name: group.name,
                    nature: group.nature,
                    parentGroup: parentId,
                    isSystem: group.isSystem
                });
                console.log(`Created group: ${group.name}`);
            } else {
                console.log(`Group already exists: ${group.name}`);
            }
        }

        console.log('Seeding completed!');
        process.exit(0);
    } catch (error) {
        console.error('Seeding failed:', error);
        process.exit(1);
    }
};

seedGroups();
