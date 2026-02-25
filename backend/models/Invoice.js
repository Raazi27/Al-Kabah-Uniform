import mongoose from 'mongoose';

const invoiceSchema = new mongoose.Schema({
    invoiceId: { type: String, unique: true },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
    customerName: String,
    items: [{
        productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        name: String,
        price: Number,
        quantity: Number,
        discount: Number,
    }],
    subtotal: { type: Number, required: true },
    discountPercentage: { type: Number, default: 0 },
    discountAmount: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    grandTotal: { type: Number, required: true },
    paymentMethod: { type: String, enum: ['Cash', 'Card', 'UPI'], required: true },
    status: { type: String, enum: ['Pending', 'Paid', 'Delivered', 'Cancelled'], default: 'Pending' },
    isPaid: { type: Boolean, default: false },
    rating: { type: Number, min: 1, max: 5 },
    feedback: { type: String },
    invoiceDate: { type: Date, default: Date.now },
});

export default mongoose.model('Invoice', invoiceSchema);
