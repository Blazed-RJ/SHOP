import Invoice from '../models/Invoice.js';
import Product from '../models/Product.js';
import Customer from '../models/Customer.js';
import Payment from '../models/Payment.js';
import moment from 'moment-timezone';

// @desc    Get dashboard statistics
// @route   GET /api/dashboard/stats
// @access  Private
export const getDashboardStats = async (req, res) => {
    try {
        const ownerId = req.user.ownerId;
        const todayStart = moment().tz("Asia/Kolkata").startOf('day').toDate();
        const todayEnd = moment().tz("Asia/Kolkata").endOf('day').toDate();
        const yesterdayStart = moment().tz("Asia/Kolkata").subtract(1, 'days').startOf('day').toDate();
        const yesterdayEnd = moment().tz("Asia/Kolkata").subtract(1, 'days').endOf('day').toDate();

        const stats = await Invoice.aggregate([
            { $match: { user: ownerId } },
            {
                $facet: {
                    "totalSales": [
                        { $group: { _id: null, total: { $sum: "$grandTotal" }, count: { $sum: 1 } } }
                    ],
                    "todaySales": [
                        { $match: { createdAt: { $gte: todayStart, $lte: todayEnd } } },
                        { $group: { _id: null, total: { $sum: "$grandTotal" } } }
                    ],
                    "yesterdaySales": [
                        { $match: { createdAt: { $gte: yesterdayStart, $lte: yesterdayEnd } } },
                        { $group: { _id: null, total: { $sum: "$grandTotal" } } }
                    ],
                    "recentInvoices": [
                        { $sort: { createdAt: -1 } },
                        { $limit: 5 },
                        {
                            $project: {
                                invoiceNo: 1,
                                customerName: 1,
                                grandTotal: 1,
                                status: 1,
                                createdAt: 1
                            }
                        }
                    ],
                    "statusCounts": [
                        { $group: { _id: "$status", count: { $sum: 1 } } }
                    ]
                }
            }
        ]);

        const customerStats = await Customer.aggregate([
            { $match: { user: ownerId } },
            {
                $group: {
                    _id: null,
                    totalParties: { $sum: 1 },
                    totalReceivables: { $sum: "$balance" }
                }
            }
        ]);

        const productStats = await Product.aggregate([
            { $match: { user: ownerId, isActive: true } },
            {
                $group: {
                    _id: null,
                    totalItems: { $sum: 1 },
                    stockValue: { $sum: { $multiply: ["$costPrice", "$stock"] } },
                    potentialProfit: { $sum: { $multiply: [{ $subtract: ["$sellingPrice", "$costPrice"] }, "$stock"] } }
                }
            }
        ]);

        // Collection breakdown (Cash vs Online for today)
        const collections = await Payment.aggregate([
            {
                $match: {
                    user: ownerId,
                    createdAt: { $gte: todayStart, $lte: todayEnd }
                }
            },
            {
                $group: {
                    _id: "$method",
                    total: { $sum: "$amount" }
                }
            }
        ]);

        const cashCollection = collections.find(c => c._id === 'Cash')?.total || 0;
        const onlineCollection = collections
            .filter(c => ['UPI', 'Card', 'Bank Transfer'].includes(c._id))
            .reduce((sum, c) => sum + c.total, 0);

        const result = {
            totalSales: stats[0].totalSales[0]?.total || 0,
            totalInvoices: stats[0].totalSales[0]?.count || 0,
            todaySales: stats[0].todaySales[0]?.total || 0,
            yesterdaySales: stats[0].yesterdaySales[0]?.total || 0,
            recentInvoices: stats[0].recentInvoices,
            statusCounts: stats[0].statusCounts,
            totalParties: customerStats[0]?.totalParties || 0,
            totalReceivables: customerStats[0]?.totalReceivables || 0,
            totalItems: productStats[0]?.totalItems || 0,
            totalStockValue: productStats[0]?.stockValue || 0,
            potentialProfit: productStats[0]?.potentialProfit || 0,
            cashCollection,
            onlineCollection,
            todayCollections: cashCollection + onlineCollection
        };

        res.json(result);
    } catch (error) {
        console.error('Dashboard Stats Error:', error);
        res.status(500).json({ message: error.message });
    }
};
