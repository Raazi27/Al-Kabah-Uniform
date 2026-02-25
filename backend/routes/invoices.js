import express from 'express';
import Invoice from '../models/Invoice.js';
import Product from '../models/Product.js';
import Counter from '../models/Counter.js';
import Customer from '../models/Customer.js';
import User from '../models/User.js';
import { verifyToken } from '../middleware/auth.js';
import PDFDocument from 'pdfkit';
import fs from 'fs';

import jwt from 'jsonwebtoken';

const router = express.Router();

// Create Invoice
router.post('/', verifyToken, async (req, res) => {
    try {
        const { customerId, items, subtotal, tax, grandTotal, paymentMethod, discountPercentage, discountAmount } = req.body;

        let finalCustomerId = customerId;
        let finalCustomerName = req.body.customerName || 'Guest Customer';

        // Try to identify customer from req.user (populated by verifyToken)
        if (req.user) {
            finalCustomerName = req.user.name || finalCustomerName;
            if (req.user.role === 'customer') {
                const customer = await Customer.findOne({ userId: req.user._id });
                if (customer) {
                    finalCustomerId = customer._id;
                } else {
                    // Fallback to userId if customer record doesn't exist yet
                    finalCustomerId = req.user._id;
                }
            }
        }

        // Validate stock
        for (const item of items) {
            const product = await Product.findById(item.productId);
            if (!product) return res.status(404).json({ message: `Product ${item.name || 'Unknown'} not found` });
            if (product.stock < item.quantity) {
                return res.status(400).json({ message: `Insufficient stock for ${product.name}. Available: ${product.stock}` });
            }
        }

        // Reduce stock
        for (const item of items) {
            await Product.findByIdAndUpdate(item.productId, { $inc: { stock: -item.quantity } });
        }

        // Generate Invoice ID
        let invoiceId;
        try {
            const counter = await Counter.findOneAndUpdate({ id: 'invoice' }, { $inc: { seq: 1 } }, { new: true, upsert: true });
            invoiceId = 'INV' + (counter.seq || '0').toString().padStart(4, '0');
        } catch (e) {
            invoiceId = 'INV' + Date.now().toString().slice(-4);
        }

        const invoice = new Invoice({
            invoiceId,
            customerId: finalCustomerId || null,
            customerName: finalCustomerName,
            items: items.map(i => ({
                productId: i.productId,
                name: i.name,
                price: i.price,
                quantity: i.quantity,
                discount: i.discount || 0
            })),
            subtotal,
            discountPercentage: discountPercentage || 0,
            discountAmount: discountAmount || 0,
            tax,
            grandTotal,
            paymentMethod
        });

        await invoice.save();
        res.status(201).json(invoice);
    } catch (err) {
        console.error(err);
        res.status(400).send(err.message);
    }
});

// Get Pending Invoices (Filtered by customer if applicable)
router.get('/pending', verifyToken, async (req, res) => {
    try {
        let query = { status: { $in: ['Pending', 'Paid'] } };

        // If user is a customer, only show their invoices (including Delivered and Cancelled)
        if (req.user.role === 'customer') {
            query.status = { $in: ['Pending', 'Paid', 'Delivered', 'Cancelled'] };
            const customer = await Customer.findOne({ userId: req.user._id });
            if (!customer) return res.json([]);
            query.customerId = customer._id;
        }

        const invoices = await Invoice.find(query).populate('customerId').sort({ invoiceDate: -1 });
        res.json(invoices);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// Get Active Invoices for Tracking (Pending or Paid)
router.get('/active', verifyToken, async (req, res) => {
    try {
        let query = { status: { $in: ['Pending', 'Paid'] } };

        if (req.user.role === 'customer') {
            const customer = await Customer.findOne({ userId: req.user._id });
            if (!customer) return res.json([]);
            query.customerId = customer._id;
        }

        const invoices = await Invoice.find(query).populate('customerId').sort({ invoiceDate: -1 });
        res.json(invoices);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// Update Invoice Status
router.put('/:id/status', async (req, res) => {
    try {
        const { status, isPaid } = req.body;
        const update = { status };
        if (isPaid !== undefined) update.isPaid = isPaid;

        // If status is marked as 'Paid', also set isPaid to true
        if (status === 'Paid') update.isPaid = true;
        // If status is marked as 'Delivered', auto-mark as paid if requested or by default
        if (status === 'Delivered') update.isPaid = true;

        const invoice = await Invoice.findByIdAndUpdate(req.params.id, update, { new: true });
        if (!invoice) return res.status(404).send('Invoice not found');
        res.json(invoice);
    } catch (err) {
        res.status(400).send(err.message);
    }
});

// Get Invoice by ID
router.get('/:id', async (req, res) => {
    try {
        const invoice = await Invoice.findById(req.params.id).populate('customerId').populate('items.productId');
        if (!invoice) return res.status(404).send('Invoice not found');
        res.json(invoice);
    } catch (err) {
        res.status(400).send(err.message);
    }
});

// Submit Feedback for Invoice
router.put('/:id/feedback', verifyToken, async (req, res) => {
    try {
        const { rating, feedback } = req.body;
        const invoice = await Invoice.findById(req.params.id);

        if (!invoice) return res.status(404).json({ message: 'Invoice not found' });

        if (invoice.status !== 'Delivered') {
            return res.status(400).json({ message: 'Can only provide feedback for delivered orders' });
        }

        invoice.rating = rating;
        invoice.feedback = feedback;
        await invoice.save();

        res.json({ message: 'Feedback submitted successfully', invoice });
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// Generate PDF
router.get('/:id/pdf', async (req, res) => {
    try {
        const invoice = await Invoice.findById(req.params.id).populate('customerId');
        if (!invoice) return res.status(404).send('Invoice not found');

        const doc = new PDFDocument();

        // Set headers
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=invoice-${invoice.invoiceId}.pdf`);

        doc.pipe(res);

        // Add content
        doc.fontSize(20).text('Al Kabah Tailors', { align: 'center' });
        doc.fontSize(12).text(`Invoice ID: ${invoice.invoiceId}`, { align: 'right' });
        doc.text(`Date: ${new Date(invoice.invoiceDate).toLocaleDateString()}`, { align: 'right' });

        doc.moveDown();
        doc.text(`Customer: ${invoice.customerId ? invoice.customerId.name : 'Guest'}`);

        doc.moveDown();
        doc.text('Items:', { underline: true });
        invoice.items.forEach(item => {
            doc.text(`${item.name} x ${item.quantity} - ${item.price * item.quantity}`);
        });

        doc.moveDown();
        doc.text(`Subtotal: ${invoice.subtotal}`);
        doc.text(`Tax: ${invoice.tax}`);
        doc.fontSize(14).text(`Total: ${invoice.grandTotal}`, { bold: true });

        doc.end();
    } catch (err) {
        res.status(400).send(err.message);
    }
});

export default router;
