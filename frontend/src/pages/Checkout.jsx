import { useState } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FiTrash2, FiMinus, FiPlus, FiArrowLeft } from 'react-icons/fi';
import { motion } from 'framer-motion';

const Checkout = () => {
    const { cart, removeFromCart, updateQuantity, clearCart } = useCart();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    const [discountPercentage, setDiscountPercentage] = useState(0);
    const [paymentMethod, setPaymentMethod] = useState('Cash');

    const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
    const discountAmount = (subtotal * discountPercentage) / 100;
    const discountedSubtotal = subtotal - discountAmount;
    const tax = discountedSubtotal * 0.18; // 18% GST Mock
    const total = discountedSubtotal + tax;

    const handleCheckout = async () => {
        if (cart.length === 0) return alert("Cart is empty!");
        setLoading(true);

        try {
            const token = localStorage.getItem('token');
            const customerId = user.role === 'customer' ? user._id : null;

            await axios.post('http://localhost:5000/api/invoices', {
                items: cart.map(item => ({
                    productId: item._id, // Products page sends _id
                    name: item.name,
                    price: item.price,
                    quantity: item.quantity
                })),
                subtotal,
                discountPercentage,
                discountAmount,
                tax,
                grandTotal: total,
                paymentMethod,
                customerId: null
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            clearCart();
            alert('Order Placed Successfully!');
            navigate('/products');
        } catch (err) {
            alert('Checkout Failed: ' + (err.response?.data?.message || err.message));
        } finally {
            setLoading(false);
        }
    };

    if (cart.length === 0) {
        return (
            <div className="p-8 text-center min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white transition-colors">
                <h2 className="text-2xl font-bold mb-4">Your Cart is Empty</h2>
                <button onClick={() => navigate('/products')} className="text-blue-600 dark:text-blue-400 hover:underline">
                    Go back to Products
                </button>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-4xl mx-auto transition-colors duration-300">
            <button onClick={() => navigate('/products')} className="flex items-center text-slate-600 dark:text-slate-400 mb-6 hover:text-slate-900 dark:hover:text-white transition-colors">
                <FiArrowLeft className="mr-2" /> Continue Shopping
            </button>

            <h1 className="text-3xl font-bold mb-8 text-slate-800 dark:text-white">Checkout</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Cart Items */}
                <div className="md:col-span-2 space-y-4">
                    {cart.map((item) => (
                        <motion.div
                            layout
                            key={item._id}
                            className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm border border-slate-100 dark:border-slate-700 flex justify-between items-center transition-colors"
                        >
                            <div className="flex-1">
                                <h3 className="font-semibold text-lg text-slate-800 dark:text-white">{item.name}</h3>
                                <p className="text-slate-500 dark:text-slate-400 text-sm">₹{item.price} x {item.quantity}</p>
                            </div>

                            <div className="flex items-center space-x-4">
                                <div className="flex items-center border border-slate-200 dark:border-slate-600 rounded-lg">
                                    <button onClick={() => updateQuantity(item._id, item.quantity - 1)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"><FiMinus size={14} /></button>
                                    <span className="px-4 font-medium text-slate-800 dark:text-white">{item.quantity}</span>
                                    <button onClick={() => updateQuantity(item._id, item.quantity + 1)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"><FiPlus size={14} /></button>
                                </div>
                                <span className="font-bold w-20 text-right text-slate-800 dark:text-white">₹{item.price * item.quantity}</span>
                                <button onClick={() => removeFromCart(item._id)} className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 p-2 rounded-full transition-colors"><FiTrash2 /></button>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Order Summary */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md border border-slate-100 dark:border-slate-700 h-fit sticky top-20 transition-colors">
                    <h2 className="text-xl font-bold mb-4 text-slate-800 dark:text-white">Order Summary</h2>
                    <div className="space-y-2 mb-4 text-slate-600 dark:text-slate-300">
                        <div className="flex justify-between">
                            <span>Subtotal</span>
                            <span>₹{subtotal.toFixed(2)}</span>
                        </div>

                        {(user?.role === 'admin' || user?.role === 'billing') && (
                            <div className="flex justify-between items-center py-2">
                                <span>Discount (%)</span>
                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={discountPercentage}
                                    onChange={(e) => setDiscountPercentage(Number(e.target.value))}
                                    className="w-16 p-1 border border-slate-200 dark:border-slate-600 rounded text-right bg-white dark:bg-slate-900 text-slate-800 dark:text-white"
                                />
                            </div>
                        )}

                        {discountPercentage > 0 && (
                            <div className="flex justify-between text-green-600 dark:text-green-400">
                                <span>Discount Amount</span>
                                <span>-₹{discountAmount.toFixed(2)}</span>
                            </div>
                        )}

                        <div className="flex justify-between">
                            <span>Tax (18%)</span>
                            <span>₹{tax.toFixed(2)}</span>
                        </div>
                    </div>

                    <div className="mb-6">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Payment Method</label>
                        <select
                            value={paymentMethod}
                            onChange={(e) => setPaymentMethod(e.target.value)}
                            className="w-full p-2 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-900 text-slate-800 dark:text-white"
                        >
                            <option value="Cash">Cash / COD</option>
                            <option value="UPI">UPI</option>
                            <option value="Card">Card</option>
                        </select>
                    </div>

                    <div className="border-t border-slate-200 dark:border-slate-700 pt-4 mb-6">
                        <div className="flex justify-between text-xl font-bold text-slate-800 dark:text-white">
                            <span>Total</span>
                            <span>₹{total.toFixed(2)}</span>
                        </div>
                    </div>

                    <button
                        onClick={handleCheckout}
                        disabled={loading}
                        className="w-full bg-indigo-600 text-white py-3 rounded-lg font-bold hover:bg-indigo-700 transition disabled:opacity-50"
                    >
                        {loading ? 'Processing...' : 'Place Order'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Checkout;
