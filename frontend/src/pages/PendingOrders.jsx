import { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { FiClock, FiCheckCircle, FiXCircle, FiFilter, FiUser, FiPackage, FiDollarSign } from 'react-icons/fi';
import SpotlightCard from '../components/react-bits/SpotlightCard';
import BlurText from '../components/react-bits/BlurText';

const PendingOrders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('All');

    useEffect(() => {
        fetchPendingOrders();
    }, []);

    const fetchPendingOrders = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('http://localhost:5000/api/invoices/pending', {
                headers: token ? { Authorization: `Bearer ${token}` } : {}
            });
            setOrders(res.data);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    const updateStatus = async (id, newStatus) => {
        try {
            const token = localStorage.getItem('token');
            await axios.put(`http://localhost:5000/api/invoices/${id}/status`, { status: newStatus }, {
                headers: token ? { Authorization: `Bearer ${token}` } : {}
            });
            setOrders(orders.filter(order => order._id !== id));
            // Optional: Show success toast
        } catch (err) {
            alert('Failed to update status');
        }
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };

    if (loading) return (
        <div className="flex justify-center items-center h-64">
            <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    return (
        <motion.div
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="p-6 max-w-7xl mx-auto transition-colors duration-300"
        >
            <div className="flex items-center mb-8">
                <BlurText
                    text="Pending Orders"
                    className="text-3xl font-bold text-slate-800 dark:text-white tracking-tight"
                    delay={50}
                    animateBy="words"
                />
                <span className="ml-4 px-3 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-300 rounded-full text-xs font-bold uppercase tracking-wider">
                    {orders.length} New
                </span>
            </div>

            {orders.length === 0 ? (
                <SpotlightCard className="text-center py-16 bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700">
                    <div className="w-20 h-20 bg-green-50 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <FiCheckCircle size={40} className="text-green-500 dark:text-green-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">All Caught Up!</h2>
                    <p className="text-slate-500 dark:text-slate-400">There are no pending orders to process right now.</p>
                </SpotlightCard>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {orders.map((order) => (
                        <motion.div variants={itemVariants} key={order._id}>
                            <SpotlightCard className="h-full flex flex-col justify-between bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 transition-colors">
                                <div>
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-2">
                                            <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg text-xs font-mono font-medium">
                                                #{order.invoiceId}
                                            </span>
                                            <span className="text-xs text-slate-400 dark:text-slate-500">
                                                {new Date(order.invoiceDate).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${order.paymentMethod === 'UPI' ? 'bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300' : 'bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-300'
                                            }`}>
                                            {order.paymentMethod}
                                        </span>
                                    </div>

                                    <div className="mb-4">
                                        <h3 className="flex items-center gap-2 font-bold text-slate-800 dark:text-white text-lg">
                                            <FiUser className="text-slate-400" size={18} />
                                            {order.customerId ? order.customerId.name : 'Guest Customer'}
                                        </h3>
                                        <div className="mt-2 space-y-1">
                                            {order.items.slice(0, 3).map((item, idx) => (
                                                <div key={idx} className="flex justify-between text-sm text-slate-600 dark:text-slate-300">
                                                    <span>{item.quantity}x {item.name}</span>
                                                    <span className="text-slate-400 dark:text-slate-500">₹{item.price * item.quantity}</span>
                                                </div>
                                            ))}
                                            {order.items.length > 3 && (
                                                <p className="text-xs text-slate-400 italic">+{order.items.length - 3} more items</p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <div className="flex justify-between items-center py-3 border-t border-slate-100 dark:border-slate-700 mb-4">
                                        <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Amount</span>
                                        <span className="text-lg font-bold text-slate-800 dark:text-white">₹{order.grandTotal}</span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            onClick={() => updateStatus(order._id, 'Paid')}
                                            className="flex items-center justify-center gap-2 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 py-2.5 rounded-xl hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors font-semibold text-sm"
                                        >
                                            <FiCheckCircle /> Mark Paid
                                        </button>
                                        <button
                                            onClick={() => updateStatus(order._id, 'Delivered')}
                                            className="flex items-center justify-center gap-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 py-2.5 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors font-semibold text-sm"
                                        >
                                            <FiPackage /> Deliver
                                        </button>
                                    </div>
                                    <button
                                        onClick={() => updateStatus(order._id, 'Cancelled')}
                                        className="w-full mt-3 flex items-center justify-center gap-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 py-2 rounded-xl transition-colors font-medium text-sm"
                                    >
                                        <FiXCircle /> Cancel Order
                                    </button>
                                </div>
                            </SpotlightCard>
                        </motion.div>
                    ))}
                </div>
            )}
        </motion.div>
    );
};

export default PendingOrders;
