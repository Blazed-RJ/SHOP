
import express from 'express';
import {
    getGroups,
    createGroup,
    updateGroup,
    getLedgers,
    createLedger,
    updateLedger,
    deleteLedger,
    getChartOfAccounts,
    getVouchers,
    createVoucher
} from '../controllers/accountingController.js';
import { protect, admin } from '../middleware/auth.js';

const router = express.Router();

router.route('/groups').get(protect, getGroups).post(protect, admin, createGroup);
router.route('/groups/:id').put(protect, admin, updateGroup);

router.route('/ledgers').get(protect, getLedgers).post(protect, admin, createLedger);
router.route('/ledgers/:id')
    .put(protect, admin, updateLedger)
    .delete(protect, admin, deleteLedger);

router.get('/chart-of-accounts', protect, getChartOfAccounts);

router.route('/vouchers').get(protect, getVouchers).post(protect, createVoucher);

export default router;
