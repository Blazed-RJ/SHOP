import AccountLedger from '../models/AccountLedger.js';
import JournalVoucher from '../models/JournalVoucher.js';
import Payment from '../models/Payment.js';
import Product from '../models/Product.js';
import mongoose from 'mongoose';

/**
 * Helper: Get Closing Balances for all ledgers up to a specific date
 * Returns a Map: ledgerId -> balance (Number)
 * Balance Sign: Debit is Positive, Credit is Negative
 */
const getLedgerBalances = async (endDate) => {
    const aggregator = await JournalVoucher.aggregate([
        { $match: { date: { $lte: new Date(endDate) } } },
        { $unwind: '$entries' },
        {
            $group: {
                _id: '$entries.ledger',
                totalDebit: { $sum: '$entries.debit' },
                totalCredit: { $sum: '$entries.credit' }
            }
        },
        {
            $project: {
                balance: { $subtract: ['$totalDebit', '$totalCredit'] }
            }
        }
    ]);

    const balanceMap = new Map();
    aggregator.forEach(item => {
        balanceMap.set(String(item._id), item.balance);
    });
    return balanceMap;
};

/**
 * Helper: Get Movement (Income/Expense) within a Date Range
 * Returns a Map: ledgerId -> balance (Number)
 * Balance Sign: Debit is Positive, Credit is Negative
 */
const getLedgerMovement = async (startDate, endDate) => {
    const aggregator = await JournalVoucher.aggregate([
        {
            $match: {
                date: {
                    $gte: new Date(startDate),
                    $lte: new Date(endDate)
                }
            }
        },
        { $unwind: '$entries' },
        {
            $group: {
                _id: '$entries.ledger',
                totalDebit: { $sum: '$entries.debit' },
                totalCredit: { $sum: '$entries.credit' }
            }
        },
        {
            $project: {
                balance: { $subtract: ['$totalDebit', '$totalCredit'] }
            }
        }
    ]);

    const balanceMap = new Map();
    aggregator.forEach(item => {
        balanceMap.set(String(item._id), item.balance);
    });
    return balanceMap;
};

// @desc    Get Trial Balance
// @route   GET /api/reports/trial-balance?date=YYYY-MM-DD
export const getTrialBalance = async (req, res) => {
    try {
        const date = req.query.date ? new Date(req.query.date) : new Date();
        // Set to end of day
        date.setHours(23, 59, 59, 999);

        const [balanceMap, ledgers] = await Promise.all([
            getLedgerBalances(date),
            AccountLedger.find()
                .populate('group', 'name nature')
                .sort({ 'group.name': 1, name: 1 })
        ]);

        const report = ledgers.map(l => {
            const bal = balanceMap.get(String(l._id)) || 0;
            return {
                _id: l._id,
                name: l.name,
                groupName: l.group?.name,
                nature: l.group?.nature,
                debit: bal > 0 ? bal : 0,
                credit: bal < 0 ? Math.abs(bal) : 0
            };
        }).filter(l => l.debit !== 0 || l.credit !== 0);

        const totalDebit = report.reduce((sum, item) => sum + item.debit, 0);
        const totalCredit = report.reduce((sum, item) => sum + item.credit, 0);

        res.json({
            date: date.toISOString().split('T')[0],
            entries: report,
            totalDebit,
            totalCredit,
            diff: totalDebit - totalCredit
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get Profit & Loss
// @route   GET /api/reports/profit-and-loss?from=YYYY-MM-DD&to=YYYY-MM-DD
export const getProfitAndLoss = async (req, res) => {
    try {
        const from = req.query.from ? new Date(req.query.from) : new Date(new Date().getFullYear(), 3, 1); // Default April 1st
        const to = req.query.to ? new Date(req.query.to) : new Date();
        to.setHours(23, 59, 59, 999);

        const [movementMap, ledgers] = await Promise.all([
            getLedgerMovement(from, to),
            AccountLedger.find().populate('group', 'name nature')
        ]);

        let income = [];
        let expenses = [];

        ledgers.forEach(l => {
            const bal = movementMap.get(String(l._id)) || 0;
            if (bal === 0) return;

            // Expenses: Debit Balance (Positive)
            // Income: Credit Balance (Negative)

            if (l.group.nature === 'Expenses') {
                expenses.push({
                    _id: l._id, // Added ID for drill-down
                    name: l.name,
                    group: l.group.name,
                    amount: bal // Expected positive
                });
            } else if (l.group.nature === 'Income') {
                income.push({
                    _id: l._id, // Added ID for drill-down
                    name: l.name,
                    group: l.group.name,
                    amount: Math.abs(bal) // Expected negative, show absolute
                });
            }
        });

        const totalExpenses = expenses.reduce((sum, item) => sum + item.amount, 0);
        const totalIncome = income.reduce((sum, item) => sum + item.amount, 0);
        const netProfit = totalIncome - totalExpenses;

        res.json({
            period: { from: from.toISOString().split('T')[0], to: to.toISOString().split('T')[0] },
            income,
            expenses,
            totalIncome,
            totalExpenses,
            netProfit
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get Balance Sheet
// @route   GET /api/reports/balance-sheet?date=YYYY-MM-DD
export const getBalanceSheet = async (req, res) => {
    try {
        const date = req.query.date ? new Date(req.query.date) : new Date();
        date.setHours(23, 59, 59, 999);

        // Balance Sheet requires Accumulative Balances for Assets/Liabilities
        const [balanceMap, plMovementMap, allLedgers] = await Promise.all([
            getLedgerBalances(date),
            getLedgerMovement(fiscalYearStart, date),
            AccountLedger.find().populate('group', 'name nature')
        ]);

        // 1. Calculate Net Profit for the period (to add to Reserves & Surplus)
        let pl_income = 0;
        let pl_expenses = 0;
        allLedgers.forEach(l => {
            if (l.group.nature === 'Income' || l.group.nature === 'Expenses') {
                const bal = plMovementMap.get(String(l._id)) || 0;
                if (l.group.nature === 'Income') pl_income += Math.abs(bal);
                if (l.group.nature === 'Expenses') pl_expenses += bal;
            }
        });
        const netProfit = pl_income - pl_expenses;

        // 2. Assets & Liabilities (Accumulated Balances)
        let assets = [];
        let liabilities = [];

        allLedgers.forEach(l => {
            const bal = balanceMap.get(String(l._id)) || 0;
            if (bal === 0) return;

            if (l.group.nature === 'Assets') {
                assets.push({
                    _id: l._id, // Added ID for drill-down
                    name: l.name,
                    group: l.group.name,
                    amount: bal // Debit is positive
                });
            } else if (l.group.nature === 'Liabilities') {
                liabilities.push({
                    _id: l._id, // Added ID for drill-down
                    name: l.name,
                    group: l.group.name,
                    amount: Math.abs(bal) // Credit is negative
                });
            }
        });

        // Add P&L to Liabilities
        if (netProfit !== 0) {
            liabilities.push({
                _id: null, // P&L result is not a single ledger, so no drill-down to a specific ledger here yet.
                name: 'Profit & Loss A/c',
                group: 'Reserves & Surplus',
                amount: netProfit
            });
        }

        const totalAssets = assets.reduce((sum, item) => sum + item.amount, 0);
        const totalLiabilities = liabilities.reduce((sum, item) => sum + item.amount, 0);

        res.json({
            date: date.toISOString().split('T')[0],
            assets,
            liabilities,
            totalAssets,
            totalLiabilities,
            diff: totalAssets - totalLiabilities
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get Specific Ledger Vouchers (Drill-down)
// @route   GET /api/reports/ledger-vouchers?ledgerId=ID&from=YYYY-MM-DD&to=YYYY-MM-DD
export const getLedgerVouchers = async (req, res) => {
    try {
        const { ledgerId } = req.query;
        const from = req.query.from ? new Date(req.query.from) : new Date(new Date().getFullYear(), 3, 1);
        const to = req.query.to ? new Date(req.query.to) : new Date();
        to.setHours(23, 59, 59, 999);

        // 1. Get Opening Balance (Sum of all moves BEFORE 'from' date)
        const [openingAgg, vouchers] = await Promise.all([
            JournalVoucher.aggregate([
                {
                    $match: {
                        date: { $lt: new Date(from) },
                        'entries.ledger': new mongoose.Types.ObjectId(ledgerId)
                    }
                },
                { $unwind: '$entries' },
                { $match: { 'entries.ledger': new mongoose.Types.ObjectId(ledgerId) } },
                {
                    $group: {
                        _id: null,
                        totalDebit: { $sum: '$entries.debit' },
                        totalCredit: { $sum: '$entries.credit' }
                    }
                }
            ]),
            JournalVoucher.find({
                'entries.ledger': ledgerId,
                date: { $gte: from, $lte: to }
            }).sort({ date: 1 }).populate('entries.ledger', 'name')
        ]);

        const openingBal = openingAgg.length > 0 ? (openingAgg[0].totalDebit - openingAgg[0].totalCredit) : 0;

        // Transform for frontend
        let runningBalance = openingBal;
        const result = vouchers.map(v => {
            const entry = v.entries.find(e => e.ledger._id.toString() === ledgerId);
            if (!entry) return null;

            runningBalance += (entry.debit - entry.credit);

            return {
                _id: v._id,
                date: v.date,
                voucherNo: v.voucherNo,
                type: v.type,
                narration: v.narration,
                debit: entry.debit,
                credit: entry.credit,
                runningBalance
            };
        }).filter(v => v !== null);

        res.json({
            openingBalance: openingBal,
            entries: result,
            closingBalance: runningBalance
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get Dashboard Financial Summary
// @route   GET /api/reports/dashboard-summary
// @access  Private
export const getDashboardSummary = async (req, res) => {
    try {
        const ownerId = new mongoose.Types.ObjectId(req.user.ownerId);
        const userId = new mongoose.Types.ObjectId(req.user._id);

        // Match payments belonging to this owner (support both ObjectId and String forms for legacy records)
        const userMatch = {
            user: {
                $in: [
                    ownerId,
                    userId,
                    ownerId.toString(),
                    userId.toString()
                ]
            }
        };

        // Bank methods (explicit allowlist — avoids capturing 'Credit' method as bank)
        const bankMethods = ['UPI', 'Card', 'Cheque', 'Bank Transfer', 'Online'];

        // 1. Calculate Cash In Hand, Cash In Bank, and Product Value
        const [cashPayments, bankPayments, productValueAgg] = await Promise.all([
            // Cash In Hand: all Cash-method payments for this owner
            Payment.aggregate([
                { $match: { ...userMatch, method: 'Cash' } },
                {
                    $group: {
                        _id: null,
                        totalDebit: {
                            $sum: { $cond: [{ $eq: ['$type', 'Debit'] }, '$amount', 0] }
                        },
                        totalCredit: {
                            $sum: { $cond: [{ $eq: ['$type', 'Credit'] }, '$amount', 0] }
                        }
                    }
                }
            ]),
            // Cash In Bank: only genuine bank-method payments for this owner
            Payment.aggregate([
                { $match: { ...userMatch, method: { $in: bankMethods } } },
                {
                    $group: {
                        _id: null,
                        totalDebit: {
                            $sum: { $cond: [{ $eq: ['$type', 'Debit'] }, '$amount', 0] }
                        },
                        totalCredit: {
                            $sum: { $cond: [{ $eq: ['$type', 'Credit'] }, '$amount', 0] }
                        }
                    }
                }
            ]),
            Product.aggregate([
                { $match: { user: ownerId, isActive: true } },
                {
                    $group: {
                        _id: null,
                        totalValue: { $sum: { $multiply: ['$stock', '$costPrice'] } }
                    }
                }
            ])
        ]);

        const cashInHand = cashPayments.length > 0 ? (cashPayments[0].totalDebit - cashPayments[0].totalCredit) : 0;
        const cashInBank = bankPayments.length > 0 ? (bankPayments[0].totalDebit - bankPayments[0].totalCredit) : 0;
        const productValue = productValueAgg.length > 0 ? productValueAgg[0].totalValue : 0;

        console.log(`[Dashboard Summary] Owner: ${req.user.ownerId} | CashInHand=${cashInHand}, Bank=${cashInBank}, Stock=${productValue}`);

        res.json({
            cashInHand,
            cashInBank,
            productValue
        });

    } catch (error) {
        console.error('Dashboard Summary Error:', error);
        res.status(500).json({ message: error.message });
    }
};
