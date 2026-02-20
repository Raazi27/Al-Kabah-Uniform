require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const customerRoutes = require('./routes/customers');
const productRoutes = require('./routes/products');
const invoiceRoutes = require('./routes/invoices');
const tailoringRoutes = require('./routes/tailoring');

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
app.use('/api/users', require('./routes/users'));

// Health Check
app.get('/', (req, res) => {
    res.send('Tailoring System Backend Running');
});

app.get('/api/test', (req, res) => {
    res.json({ status: 'success', message: 'Backend Server is Online', timestamp: new Date() });
});

// Database Connection
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
    .then(() => console.log('MongoDB Connected'))
    .catch(err => {
        console.error('MongoDB Connection Error:', err.message);
        console.log('Server continuing without DB connection (Expect API errors)');
    });

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
