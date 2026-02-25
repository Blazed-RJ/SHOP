
import AccountGroup from '../models/AccountGroup.js';
import AccountLedger from '../models/AccountLedger.js';
import JournalVoucher from '../models/JournalVoucher.js';

// --- Groups ---

export const getGroups = async (req, res) => {
    try {
        const groups = await AccountGroup.find().sort({ name: 1 });
        res.json(groups);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const createGroup = async (req, res) => {
    try {
        const { name, parentGroup, nature, description } = req.body;

        const existing = await AccountGroup.findOne({ name });
        if (existing) {
            return res.status(400).json({ message: 'Group with this name already exists' });
        }

        const group = await AccountGroup.create({
            name,
            parentGroup: parentGroup || null,
            nature,
            description
        });

        res.status(201).json(group);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

export const updateGroup = async (req, res) => {
    try {
        const { id } = req.params;
        const group = await AccountGroup.findById(id);

        if (!group) {
            return res.status(404).json({ message: 'Group not found' });
        }

        if (group.isSystem) {
            // System groups can have their description or parent changed, but usually strict on name/nature
            // Allowing updates for now but being cautious
        }

        Object.assign(group, req.body);
        await group.save();
        res.json(group);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// --- Ledgers ---

export const getLedgers = async (req, res) => {
    try {
        const ledgers = await AccountLedger.find()
            .populate('group', 'name nature')
            .sort({ name: 1 });
        res.json(ledgers);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const createLedger = async (req, res) => {
    try {
        const { name, group, openingBalance, openingBalanceType, gstNumber, panNumber, mobile, email, address, linkedType, linkedId } = req.body;

        const existing = await AccountLedger.findOne({ name });
        if (existing) {
            return res.status(400).json({ message: 'Ledger with this name already exists' });
        }

        // Calculate current balance based on opening
        // If Asset/Expense (Dr nature), Dr opening balance is positive. Cr opening is negative (unusual but possible).
        // If Liability/Income (Cr nature), Cr opening balance is positive.
        // For simplicity, we store openingBalance as absolute and use openingBalanceType.
        // currentBalance will be calculated.

        // Initial current balance = opening balance (signed based on type)
        let initialBalance = openingBalance || 0;

        // Logic: Store currentBalance as NET value.
        // It's easier if we strictly follow: Debit is Positive, Credit is Negative for internal math?
        // OR we follow the nature of the group?
        // Let's stick to: Debit (+), Credit (-).

        let netBalance = 0;
        if (openingBalance) {
            if (openingBalanceType === 'Dr') netBalance = openingBalance;
            else netBalance = -openingBalance;
        }

        const ledger = await AccountLedger.create({
            name,
            group,
            openingBalance,
            openingBalanceType,
            currentBalance: netBalance,
            gstNumber, panNumber, mobile, email, address,
            linkedType, linkedId
        });

        res.status(201).json(ledger);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

export const updateLedger = async (req, res) => {
    try {
        const { id } = req.params;
        const ledger = await AccountLedger.findById(id);
        if (!ledger) return res.status(404).json({ message: 'Ledger not found' });

        Object.assign(ledger, req.body);
        await ledger.save();
        res.json(ledger);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

export const deleteLedger = async (req, res) => {
    try {
        const { id } = req.params;
        // Check if used in vouchers
        const used = await JournalVoucher.findOne({ 'entries.ledger': id });
        if (used) {
            return res.status(400).json({ message: 'Cannot delete ledger with existing transactions' });
        }

        await AccountLedger.findByIdAndDelete(id);
        res.json({ message: 'Ledger deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// --- Chart of Accounts (Tree Structure) ---
export const getChartOfAccounts = async (req, res) => {
    try {
        const groups = await AccountGroup.find().lean();
        const ledgers = await AccountLedger.find().lean();

        // Build tree
        // 1. Map groups by string ID (ObjectIds must be stringified as JS object keys)
        const groupMap = {};
        groups.forEach(g => {
            g.children = [];
            g.ledgers = [];
            groupMap[g._id.toString()] = g;
        });

        // 2. Assign ledgers to their parent groups
        ledgers.forEach(l => {
            const groupKey = l.group?.toString();
            if (groupKey && groupMap[groupKey]) {
                groupMap[groupKey].ledgers.push(l);
            }
        });

        // 3. Build hierarchy (root groups have no parentGroup)
        const rootGroups = [];
        groups.forEach(g => {
            const parentKey = g.parentGroup?.toString();
            if (parentKey && groupMap[parentKey]) {
                groupMap[parentKey].children.push(g);
            } else {
                rootGroups.push(g);
            }
        });

        res.json(rootGroups);
    } catch (error) {
        console.error('Chart of Accounts Error:', error);
        res.status(500).json({ message: error.message });
    }
};


// --- Vouchers (Transactions) ---

export const getVouchers = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const query = {};
        if (startDate && endDate) {
            query.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
        }

        const vouchers = await JournalVoucher.find(query)
            .populate('entries.ledger', 'name')
            .populate('user', 'name')
            .sort({ date: -1, createdAt: -1 });

        res.json(vouchers);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const createVoucher = async (req, res) => {
    try {
        const { date, type, narration, entries, referenceType, referenceId } = req.body;

        // generated voucher number logic could be complex (e.g. yearly series)
        // For now, simple timestamp or random
        const count = await JournalVoucher.countDocuments();
        const voucherNo = `${type.charAt(0).toUpperCase()}-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

        // Validate entries
        let totalDebit = 0;
        let totalCredit = 0;
        entries.forEach(e => {
            totalDebit += Number(e.debit || 0);
            totalCredit += Number(e.credit || 0);
        });

        if (Math.abs(totalDebit - totalCredit) > 0.05) {
            return res.status(400).json({ message: `Voucher imbalance: Dr ${totalDebit} != Cr ${totalCredit}` });
        }

        const voucher = await JournalVoucher.create({
            voucherNo,
            date: date || new Date(),
            type,
            narration,
            entries,
            totalAmount: totalDebit,
            referenceType,
            referenceId,
            user: req.user._id
        });

        // Update Ledger Balances
        // Iterate entries
        for (const entry of entries) {
            const ledger = await AccountLedger.findById(entry.ledger);
            if (ledger) {
                // Determine effect based on Ledger nature + Dr/Cr
                // But simpler: Just add (Dr - Cr) to currentBalance?
                // If we store currentBalance as NET (DebitPositive), then:
                // NewBalance = OldBalance + (Debit - Credit)

                const dr = Number(entry.debit || 0);
                const cr = Number(entry.credit || 0);
                const netChange = dr - cr;

                ledger.currentBalance = (ledger.currentBalance || 0) + netChange;

                // Re-evaluate balanceType
                // if currentBalance >= 0 -> Dr, else Cr
                // But wait, Liability accounts usually have Credit balance.
                // If Capital has Cr 1000. It expects to be managed as Cr.
                // If we use Net System: Capital = -1000.
                // UI should show "1000 Cr".

                // Let's stick to Net System in DB.

                await ledger.save();
            }
        }

        res.status(201).json(voucher);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};
