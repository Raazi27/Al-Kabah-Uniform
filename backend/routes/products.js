const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const Counter = require('../models/Counter');
const bwipjs = require('bwip-js');
const { verifyToken, isAdmin, isBilling } = require('../middleware/auth');

// Add Product
router.post('/', verifyToken, isAdmin, async (req, res) => {
    try {
        const { name, category, size, price, stock, lowStockAlert } = req.body;

        // Generate Product ID
        try {
            var counter = await Counter.findOneAndUpdate({ id: 'product' }, { $inc: { seq: 1 } }, { new: true, upsert: true });
        } catch (e) {
            // Mock fallback
            var counter = { seq: Date.now() };
        }

        const productId = 'PROD' + (counter.seq || '0').toString().padStart(4, '0');
        const barcode = productId;

        const product = new Product({ productId, barcode, name, category, size, price, stock, lowStockAlert });
        await product.save();
        res.status(201).json(product);
    } catch (err) {
        res.status(400).send(err.message);
    }
});

// Get all products (with pagination if needed, but for now just all)
router.get('/', async (req, res) => {
    try {
        const products = await Product.find().sort({ createdAt: -1 });
        res.json(products);
    } catch (err) {
        res.status(400).send(err.message);
    }
});

// Search
router.get('/search', async (req, res) => {
    const { query } = req.query;
    try {
        const products = await Product.find({
            $or: [
                { name: { $regex: query, $options: 'i' } },
                { barcode: { $regex: query, $options: 'i' } },
                { productId: { $regex: query, $options: 'i' } }
            ]
        });
        res.json(products);
    } catch (err) {
        res.status(400).send(err.message);
    }
});

// Update stock (Admin or Billing can update)
router.put('/:id', verifyToken, isBilling, async (req, res) => {
    try {
        const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!product) return res.status(404).json({ message: 'Product not found' });
        res.json(product);
    } catch (err) {
        res.status(400).send(err.message);
    }
});

// Generate Barcode Image
router.get('/:id/barcode', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).send('Product not found');

        bwipjs.toBuffer({
            bcid: 'code128',       // Barcode type
            text: product.barcode, // Text to encode
            scale: 3,               // 3x scaling factor
            height: 10,              // Bar height, in millimeters
            includetext: true,            // Show human-readable text
            textxalign: 'center',        // Always good to set this
        }, function (err, png) {
            if (err) {
                res.status(500).send(err);
            } else {
                res.set('Content-Type', 'image/png');
                res.send(png);
            }
        });
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// Delete
router.delete('/:id', verifyToken, isAdmin, async (req, res) => {
    try {
        await Product.findByIdAndDelete(req.params.id);
        res.json({ message: 'Product deleted' });
    } catch (err) {
        res.status(400).send(err.message);
    }
});

module.exports = router;
