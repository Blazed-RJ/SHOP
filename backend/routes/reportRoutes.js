
import express from 'express';
import { getTrialBalance, getProfitAndLoss, getBalanceSheet, getLedgerVouchers, getDashboardSummary } from '../controllers/reportController.js';
import { protect, admin } from '../middleware/auth.js';

const router = express.Router();

router.get('/trial-balance', protect, getTrialBalance); // Admin only? Maybe accountant role too
router.get('/profit-and-loss', protect, getProfitAndLoss);
router.get('/balance-sheet', protect, getBalanceSheet);
router.get('/ledger-vouchers', protect, getLedgerVouchers);
router.get('/dashboard-summary', protect, getDashboardSummary);

import Payment from '../models/Payment.js';
router.get('/debug-payments', protect, async (req, res) => {
    try {
        const ownerId = req.user.ownerId;
        const userId = req.user._id;
        const payments = await Payment.find({
            $or: [
                { user: ownerId },
                { user: userId },
                { user: ownerId?.toString() },
                { user: userId?.toString() }
            ]
        }).lean();
        res.json({
            count: payments.length,
            ownerId,
            userId,
            sample: payments.slice(0, 10).map(p => ({
                id: p._id,
                date: p.date,
                amount: p.amount,
                method: p.method,
                type: p.type,
                user: p.user,
                userType: typeof p.user
            }))
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

export default router;
