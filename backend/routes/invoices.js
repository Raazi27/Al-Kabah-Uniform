const express = require('express');
const router = express.Router();
const Invoice = require('../models/Invoice');
const Product = require('../models/Product');
const Counter = require('../models/Counter');
const { verifyToken } = require('../middleware/auth');

// Create Invoice
router.post('/', async (req, res) => {
    try {
        const { customerId, items, subtotal, tax, grandTotal, paymentMethod, discountPercentage, discountAmount } = req.body;

        // items should be [{ productId, quantity, price, name }]

        // Validate stock & Calculate totals server-side (good practice, though we trust client for now)
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
        try {
            var counter = await Counter.findOneAndUpdate({ id: 'invoice' }, { $inc: { seq: 1 } }, { new: true, upsert: true });
        } catch (e) {
            var counter = { seq: Date.now() }; // Fallback
        }

        const invoiceId = 'INV' + (counter.seq || '0').toString().padStart(4, '0');

        const invoice = new Invoice({
            invoiceId,
            customerId: customerId || null, // Allow guest checkout
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

// Get Pending Invoices (Admin/Billing only usually, but open for now or add middleware)
router.get('/pending', async (req, res) => {
    try {
        const invoices = await Invoice.find({ status: 'Pending' }).populate('customerId').sort({ invoiceDate: -1 });
        res.json(invoices);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// Update Invoice Status
router.put('/:id/status', async (req, res) => {
    try {
        const { status } = req.body;
        const invoice = await Invoice.findByIdAndUpdate(req.params.id, { status }, { new: true });
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

// Generate PDF
const PDFDocument = require('pdfkit');
const fs = require('fs');

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

module.exports = router;
