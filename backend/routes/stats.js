import express from 'express';
import Invoice from '../models/Invoice.js';
import TailoringOrder from '../models/TailoringOrder.js';
import Customer from '../models/Customer.js';
import Product from '../models/Product.js';
import { verifyToken, isAdmin } from '../middleware/auth.js';

const router = express.Router();

// Get Dashboard Stats
router.get('/dashboard', verifyToken, async (req, res) => {
    try {
        const isAdmin = req.user.role === 'admin';
        const isCustomer = req.user.role === 'customer';

        let stats = {
            sales: 0,
            customers: 0,
            orders: 0,
            products: 0,
            recentActivity: [],
            upcomingDeliveries: [],
            recentItems: [],
            upcomingProducts: []
        };

        if (isCustomer) {
            // Find customer record
            const customer = await Customer.findOne({ userId: req.user._id });
            if (customer) {
                // Total Spent
                const invoices = await Invoice.find({ customerId: customer._id });
                stats.sales = invoices.reduce((acc, curr) => acc + curr.grandTotal, 0);

                // Purchase History Stats
                stats.totalPurchaseCount = invoices.length;

                const frequencies = {};
                invoices.forEach(inv => {
                    inv.items.forEach(item => {
                        frequencies[item.name] = (frequencies[item.name] || 0) + item.quantity;
                    });
                });

                stats.productFrequency = Object.entries(frequencies)
                    .map(([name, count]) => ({ name, count }))
                    .sort((a, b) => b.count - a.count)
                    .slice(0, 5);

                // Recent Unique Items with Context for Feedback
                const recentInvoicesWithItems = await Invoice.find({
                    $or: [
                        { customerId: customer._id },
                        { customerId: customer.userId } // Fallback for mismatched IDs
                    ]
                })
                    .sort({ invoiceDate: -1 })
                    .limit(20);

                // Recent Unique Items with Context for Feedback
                const recentItems = [];
                const seenItems = new Set();

                recentInvoicesWithItems.forEach(inv => {
                    inv.items.forEach(item => {
                        if (!seenItems.has(item.name)) {
                            recentItems.push({
                                name: item.name,
                                orderId: inv.invoiceId,
                                mongoId: inv._id,
                                status: inv.status,
                                feedback: inv.feedback,
                                rating: inv.rating,
                                date: inv.invoiceDate
                            });
                            seenItems.add(item.name);
                        }
                    });
                });
                stats.recentItems = recentItems.slice(0, 10);

                // My Active Orders
                // Include both Invoices and Tailoring orders for "Active Orders" count if needed
                const pendingInvoices = await Invoice.countDocuments({ customerId: customer._id, status: { $in: ['Pending', 'Paid'] } });
                const pendingTailoring = await TailoringOrder.countDocuments({ customerId: customer._id, status: { $ne: 'Delivered' } });
                stats.orders = pendingInvoices + pendingTailoring;

                // Recent Activity
                const recentInvoices = await Invoice.find({ customerId: customer._id })
                    .sort({ invoiceDate: -1 })
                    .limit(3);

                const recentTailoring = await TailoringOrder.find({ customerId: customer._id })
                    .sort({ createdAt: -1 })
                    .limit(3);

                const activity = [
                    ...recentInvoices.map(i => ({ message: `Order #${i.invoiceId} Status: ${i.status}`, time: i.invoiceDate })),
                    ...recentTailoring.map(o => ({ message: `Tailoring Order Status: ${o.status}`, time: o.createdAt }))
                ].sort((a, b) => b.time - a.time).slice(0, 5);

                stats.recentActivity = activity;

                // Upcoming Deliveries
                const upcoming = await TailoringOrder.find({
                    customerId: customer._id,
                    status: { $ne: 'Delivered' },
                    deliveryDate: { $gte: new Date() }
                }).sort({ deliveryDate: 1 }).limit(3);
                stats.upcomingDeliveries = upcoming;

                // Upcoming Products
                const upcomingProducts = await Product.find({ isUpcoming: true }).sort({ releaseDate: 1 }).limit(5);
                stats.upcomingProducts = upcomingProducts;
            }
        } else {
            // Admin/Staff Stats
            const invoices = await Invoice.find({});
            stats.sales = invoices.reduce((acc, curr) => acc + curr.grandTotal, 0);
            stats.customers = await Customer.countDocuments();
            stats.orders = await TailoringOrder.countDocuments({ status: 'Pending' });
            stats.products = await Product.countDocuments();

            // Recent Activity
            const recentInvoices = await Invoice.find({}).sort({ invoiceDate: -1 }).limit(3).populate('customerId');
            const recentOrders = await TailoringOrder.find({}).sort({ createdAt: -1 }).limit(3).populate('customerId');

            const activity = [
                ...recentInvoices.map(i => ({ message: `New Invoice #${i.invoiceId} generated for ${i.customerId?.name || 'Guest'}`, time: i.invoiceDate })),
                ...recentOrders.map(o => ({ message: `New Tailoring Order for ${o.customerId?.name || 'Customer'}`, time: o.createdAt }))
            ].sort((a, b) => b.time - a.time).slice(0, 5);

            stats.recentActivity = activity;

            // Upcoming Deliveries (Orders with future delivery date)
            const upcoming = await TailoringOrder.find({
                status: { $ne: 'Delivered' },
                deliveryDate: { $gte: new Date() }
            }).sort({ deliveryDate: 1 }).limit(5).populate('customerId');
            stats.upcomingDeliveries = upcoming;

            // Upcoming Products
            const upcomingProducts = await Product.find({ isUpcoming: true }).sort({ releaseDate: 1 }).limit(10);
            stats.upcomingProducts = upcomingProducts;
        }

        res.json(stats);
    } catch (err) {
        console.error(err);
        res.status(500).send(err.message);
    }
});

// Get Reports Data
router.get('/reports', verifyToken, isAdmin, async (req, res) => {
    try {
        // Revenue Analytics (last 6 months)
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const currentMonth = new Date().getMonth();

        // Simplified monthly aggregation for this year
        const invoices = await Invoice.find({
            invoiceDate: { $gte: new Date(new Date().getFullYear(), 0, 1) }
        });

        const monthlyRevenue = Array(12).fill(0);
        invoices.forEach(inv => {
            const m = new Date(inv.invoiceDate).getMonth();
            monthlyRevenue[m] += inv.grandTotal;
        });

        const labels = [];
        const data = [];
        for (let i = 5; i >= 0; i--) {
            const m = (currentMonth - i + 12) % 12;
            labels.push(months[m]);
            data.push(monthlyRevenue[m]);
        }

        // Sales by Category
        // Note: Currently TailoringOrder has items as [String]. We'd need to aggregate these.
        // For now, let's just count instances of items.
        const allOrders = await TailoringOrder.find({});
        const categories = {};
        allOrders.forEach(o => {
            o.items.forEach(item => {
                categories[item] = (categories[item] || 0) + 1;
            });
        });

        const catLabels = Object.keys(categories);
        const catData = Object.values(categories);

        // Recent Transactions
        const recentTransactions = await Invoice.find({})
            .sort({ invoiceDate: -1 })
            .limit(10)
            .populate('customerId');

        res.json({
            revenueAnalytics: { labels, data },
            categoryData: { labels: catLabels, data: catData },
            recentTransactions
        });
    } catch (err) {
        console.error(err);
        res.status(500).send(err.message);
    }
});

// Reset All Reports Data
router.delete('/reset', verifyToken, isAdmin, async (req, res) => {
    try {
        await Invoice.deleteMany({});
        await TailoringOrder.deleteMany({});
        res.json({ message: 'All reports data has been reset successfully.' });
    } catch (err) {
        console.error(err);
        res.status(500).send(err.message);
    }
});

// Export Monthly Reports (CSV)
router.get('/export', verifyToken, isAdmin, async (req, res) => {
    try {
        const { month, year } = req.query;
        if (!month || !year) {
            return res.status(400).send('Month and year are required.');
        }

        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59);

        const invoices = await Invoice.find({
            invoiceDate: { $gte: startDate, $lte: endDate }
        }).populate('customerId');

        // Simple CSV generation
        const header = ['Invoice ID', 'Date', 'Customer', 'Items', 'Grand Total', 'Payment Method', 'Status'];
        const csvRows = [header.join(',')];

        invoices.forEach(inv => {
            const items = inv.items.map(item => `${item.name}(${item.quantity})`).join('; ');
            const row = [
                inv.invoiceId,
                new Date(inv.invoiceDate).toLocaleDateString(),
                inv.customerId?.name || 'Guest',
                `"${items}"`,
                inv.grandTotal,
                inv.paymentMethod,
                inv.status
            ];
            csvRows.push(row.join(','));
        });

        const csvContent = csvRows.join('\n');
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=Report_${year}_${month}.csv`);
        res.status(200).send(csvContent);

    } catch (err) {
        console.error(err);
        res.status(500).send(err.message);
    }
});

export default router;
