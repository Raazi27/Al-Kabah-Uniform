const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');

// Multer Config
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});
const upload = multer({ storage });

// Register
router.post('/register', async (req, res) => {
    try {
        const { name, email, password, role, phone, address, pincode } = req.body;
        // Default role is customer if not specified or restricted
        const userRole = role || 'customer';

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).send('Email already exists');
        }

        // Check Admin Limit
        if (userRole === 'admin') {
            const adminCount = await User.countDocuments({ role: 'admin' });
            if (adminCount >= 2) {
                return res.status(403).send('Admin limit reached. Only 2 admins allowed.');
            }
        }

        const user = new User({
            name,
            email,
            password,
            role: userRole,
            phone,
            address,
            pincode
        });
        await user.save();

        // If user is a customer, create a Customer profile linked to them
        if (userRole === 'customer') {
            const Customer = require('../models/Customer');
            const Counter = require('../models/Counter'); // To generate customer ID sequence

            let customerId = `CUST-${Date.now().toString().slice(-4)}`; // Simple fallback

            try {
                const counter = await Counter.findOneAndUpdate(
                    { id: 'customerId' },
                    { $inc: { seq: 1 } },
                    { new: true, upsert: true } // Create if not exists
                );
                customerId = `CUST-${String(counter.seq).padStart(3, '0')}`;
            } catch (e) {
                console.log('Counter error, using timestamp fallback');
            }

            const customer = new Customer({
                name,
                email,
                phone: phone || 'N/A',
                address: address || '',
                pincode: pincode || '',
                customerId,
                userId: user._id
            });
            await customer.save();
        }

        res.status(201).send('User Created');
    } catch (err) {
        console.error(err);
        res.status(400).send(err.message);
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(400).send('Email not found');

        const isMatch = await user.matchPassword(password);
        if (!isMatch) return res.status(400).send('Invalid Password');

        const token = jwt.sign({ _id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.header('auth-token', token).json({
            token,
            role: user.role,
            name: user.name,
            email: user.email,
            profilePicture: user.profilePicture,
            _id: user._id,
            phone: user.phone || '', // Include phone in login response too if needed
            address: user.address || ''
        });
    } catch (err) {
        res.status(400).send(err.message);
    }
});

// Forgot Password
const nodemailer = require('nodemailer');
const otpGenerator = require('otp-generator');
const bcrypt = require('bcryptjs');

// Email Transporter (Configure with your email service)
const transporter = nodemailer.createTransport({
    service: 'gmail', // or your email provider
    auth: {
        user: process.env.EMAIL_USER || 'farmanraazi2006@gmail.com', // Your email
        pass: process.env.EMAIL_PASS || 'your-app-password' // App Password (not login password)
    }
});

router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(404).send('User not found');

        // Generate OTP
        const otp = otpGenerator.generate(6, { upperCaseAlphabets: false, specialChars: false, lowerCaseAlphabets: false });

        // Save OTP to user (valid for 10 mins)
        user.resetOtp = otp;
        user.resetOtpExpires = Date.now() + 10 * 60 * 1000;
        await user.save();

        // Send Email
        const mailOptions = {
            from: process.env.EMAIL_USER || 'farmanraazi2006@gmail.com',
            to: email,
            subject: 'Password Reset OTP - Al-Kabah Uniforms',
            text: `Your OTP for password reset is: ${otp}\n\nThis OTP is valid for 10 minutes.`
        };

        transporter.sendMail(mailOptions, (err, info) => {
            if (err) {
                console.error(err);
                return res.status(500).send('Error sending email');
            }
            res.send('OTP sent to your email.');
        });

    } catch (err) {
        res.status(500).send(err.message);
    }
});

// Reset Password
router.post('/reset-password', async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;
        const user = await User.findOne({
            email,
            resetOtp: otp,
            resetOtpExpires: { $gt: Date.now() }
        });

        if (!user) return res.status(400).send('Invalid or expired OTP');

        // Hash new password - schema pre-save handles hashing if modified
        user.password = newPassword;
        user.resetOtp = undefined;
        user.resetOtpExpires = undefined;

        await user.save(); // pre-save middleware will hash the password

        res.send('Password reset successful. You can now login.');

    } catch (err) {
        res.status(500).send(err.message);
    }
});

// Get Current User Profile
router.get('/profile', async (req, res) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).send('Access Denied');

    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(verified._id).select('-password');

        // If customer, fetch customer details too
        let profile = { ...user.toObject() };
        if (user.role === 'customer') {
            const Customer = require('../models/Customer');
            const customer = await Customer.findOne({ userId: user._id });
            if (customer) {
                profile = { ...profile, customerDetails: customer };
            }
        }

        res.json(profile);
    } catch (err) {
        res.status(400).send('Invalid Token');
    }
});

// Update Profile
router.put('/profile', upload.single('profilePicture'), async (req, res) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).send('Access Denied');

    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET);
        const { name, email, phone, address, pincode, password } = req.body;
        const profilePicture = req.file ? req.file.path : undefined;

        const user = await User.findById(verified._id);
        if (!user) return res.status(404).send('User not found');

        // Check if email is being updated and if it's already taken
        if (email && email !== user.email) {
            const existingUser = await User.findOne({ email });
            if (existingUser) {
                return res.status(400).send('Email already exists');
            }
        }

        // Update User Model fields
        if (name) user.name = name;
        if (email) user.email = email;
        if (phone) user.phone = phone;
        if (address) user.address = address;
        if (pincode) user.pincode = pincode;

        if (password) user.password = password;
        if (profilePicture) user.profilePicture = profilePicture;

        await user.save();

        // If customer, update Customer Model fields
        if (user.role === 'customer') {
            const Customer = require('../models/Customer');
            const updateFields = { name };
            if (email) updateFields.email = email;
            if (phone) updateFields.phone = phone;
            if (address) updateFields.address = address;
            if (pincode) updateFields.pincode = pincode;

            await Customer.findOneAndUpdate(
                { userId: user._id },
                { $set: updateFields },
                { new: true, upsert: true } // upsert ensures it's created if missing
            );
        }

        res.json({ message: 'Profile updated successfully', profilePicture: user.profilePicture });

    } catch (err) {
        console.error(err);
        res.status(400).send(err.message);
    }
});

module.exports = router;
