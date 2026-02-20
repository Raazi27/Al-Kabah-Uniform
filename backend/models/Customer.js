const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
    customerId: { type: String, unique: true },
    name: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String },
    address: { type: String },
    pincode: { type: String },
    measurements: {
        chest: Number,
        waist: Number,
        shoulder: Number,
        sleeveLength: Number,
        shirtLength: Number,
        pantWaist: Number,
        pantLength: Number,
        hip: Number,
        notes: String,
        deliveryDate: Date
    },
    createdAt: { type: Date, default: Date.now },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

module.exports = mongoose.model('Customer', customerSchema);
