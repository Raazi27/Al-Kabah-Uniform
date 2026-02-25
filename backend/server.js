import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';

import authRoutes from './routes/auth.js';
import customerRoutes from './routes/customers.js';
import productRoutes from './routes/products.js';
import invoiceRoutes from './routes/invoices.js';
import tailoringRoutes from './routes/tailoring.js';
import userRoutes from './routes/users.js';
import statsRoutes from './routes/stats.js';
import otpRoutes from './routes/otp.js';
import connectDB from './config/db.js';

const app = express();

// Middleware
app.use(cors());
app.use('/uploads', express.static('uploads'));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/products', productRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/tailoring', tailoringRoutes);
app.use('/api/users', userRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/otp', otpRoutes);

// Health Check
app.get('/', (req, res) => {
    res.send('Tailoring System Backend Running');
});

app.get('/api/test', (req, res) => {
    res.json({ status: 'success', message: 'Backend Server is Online', timestamp: new Date() });
});

// Database Connection
connectDB();
const PORT = process.env.PORT || 5000;
if (process.env.VERCEL !== '1') {
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

export default app;
