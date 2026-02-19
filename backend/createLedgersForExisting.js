
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import AccountGroup from './models/AccountGroup.js';
import AccountLedger from './models/AccountLedger.js';
import Customer from './models/Customer.js';
import Supplier from './models/Supplier.js';

dotenv.config();

const migrate = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // 1. Get Groups
        const debtorsGroup = await AccountGroup.findOne({ name: 'Sundry Debtors' });
        const creditorsGroup = await AccountGroup.findOne({ name: 'Sundry Creditors' });

        if (!debtorsGroup || !creditorsGroup) {
            throw new Error('Required groups (Sundry Debtors/Creditors) not found. Run seedGroups.js first.');
        }

        console.log('Groups found.');

        // 2. Migrate Customers
        const customers = await Customer.find();
        console.log(`Found ${customers.length} customers.`);

        let customersCreated = 0;
        for (const customer of customers) {
            const existing = await AccountLedger.findOne({ linkedType: 'Customer', linkedId: customer._id });
            if (!existing) {
                // Check for name duplicate
                let name = customer.name;
                const nameCheck = await AccountLedger.findOne({ name: name });
                if (nameCheck) {
                    name = `${customer.name} (${customer.phone.slice(-4)})`;
                }

                await AccountLedger.create({
                    name: name,
                    group: debtorsGroup._id,
                    openingBalance: customer.balance || 0,
                    openingBalanceType: 'Dr',
                    currentBalance: customer.balance || 0, // Dr is positive
                    balanceType: 'Dr',
                    linkedType: 'Customer',
                    linkedId: customer._id,
                    gstNumber: customer.gstNumber,
                    mobile: customer.phone,
                    email: customer.email,
                    address: customer.address
                });
                customersCreated++;
                process.stdout.write('.');
            }
        }
        console.log(`\nCreated ${customersCreated} Customer Ledgers.`);

        // 3. Migrate Suppliers
        const suppliers = await Supplier.find();
        console.log(`Found ${suppliers.length} suppliers.`);

        let suppliersCreated = 0;
        for (const supplier of suppliers) {
            const existing = await AccountLedger.findOne({ linkedType: 'Supplier', linkedId: supplier._id });
            if (!existing) {
                // Check for name duplicate
                let name = supplier.name;
                // If company name exists, maybe append it? 
                // supplier.company is optional.

                let nameCheck = await AccountLedger.findOne({ name: name });
                if (nameCheck) {
                    name = `${supplier.name} (${supplier.phone?.slice(-4) || 'SUP'})`;
                }

                const balance = supplier.balance || 0;

                await AccountLedger.create({
                    name: name,
                    group: creditorsGroup._id,
                    openingBalance: balance,
                    openingBalanceType: 'Cr', // We owe them -> Liability -> Credit
                    currentBalance: -balance, // Cr is negative
                    balanceType: 'Cr',
                    linkedType: 'Supplier',
                    linkedId: supplier._id,
                    gstNumber: supplier.gstNumber,
                    mobile: supplier.phone,
                    email: supplier.email,
                    address: supplier.address
                });
                suppliersCreated++;
                process.stdout.write('.');
            }
        }
        console.log(`\nCreated ${suppliersCreated} Supplier Ledgers.`);

        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
};

migrate();
