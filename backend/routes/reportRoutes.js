
import express from 'express';
import { getTrialBalance, getProfitAndLoss, getBalanceSheet, getLedgerVouchers } from '../controllers/reportController.js';
import { protect, admin } from '../middleware/auth.js';

const router = express.Router();

router.get('/trial-balance', protect, getTrialBalance); // Admin only? Maybe accountant role too
router.get('/profit-and-loss', protect, getProfitAndLoss);
router.get('/balance-sheet', protect, getBalanceSheet);
router.get('/ledger-vouchers', protect, getLedgerVouchers);

export default router;
