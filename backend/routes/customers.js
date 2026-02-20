const express = require('express');
const router = express.Router();
const Customer = require('../models/Customer');
const Counter = require('../models/Counter');
const { verifyToken, isBilling, isAdmin } = require('../middleware/auth');
const bwipjs = require('bwip-js');

// Add Customer
router.post('/', async (req, res) => {
    try {
        const { name, phone, email, address, measurements } = req.body;

        // Generate Customer ID
        const counter = await Counter.findOneAndUpdate({ id: 'customer' }, { $inc: { seq: 1 } }, { new: true, upsert: true });
        const customerId = 'CUST' + counter.seq.toString().padStart(4, '0');
        const barcode = customerId;

        const customer = new Customer({ customerId, barcode, name, phone, email, address, measurements });
        await customer.save();
        res.status(201).json(customer);
    } catch (err) {
        res.status(400).send(err.message);
    }
});

// Update Customer (or Measurements)
router.put('/:id', async (req, res) => {
    try {
        const customer = await Customer.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!customer) return res.status(404).send('Customer not found');
        res.json(customer);
    } catch (err) {
        res.status(400).send(err.message);
    }
});

// Get Customers
router.get('/', async (req, res) => {
    try {
        const customers = await Customer.find().sort({ createdAt: -1 });
        res.json(customers);
    } catch (err) {
        res.status(400).send(err.message);
    }
});

// Search Customer
router.get('/search', async (req, res) => {
    const { query } = req.query;
    try {
        const customers = await Customer.find({
            $or: [
                { name: { $regex: query, $options: 'i' } },
                { phone: { $regex: query, $options: 'i' } },
                { customerId: { $regex: query, $options: 'i' } }
            ]
        });
        res.json(customers);
    } catch (err) {
        res.status(400).send(err.message);
    }
});

// Generate Barcode Image
router.get('/:id/barcode', async (req, res) => {
    try {
        const customer = await Customer.findById(req.params.id);
        if (!customer) return res.status(404).send('Customer not found');

        bwipjs.toBuffer({
            bcid: 'code128',       // Barcode type
            text: customer.barcode || customer.customerId, // Text to encode
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

module.exports = router;
