import { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { FiClock, FiCheckCircle, FiXCircle, FiFilter, FiUser, FiPackage, FiDollarSign, FiSearch, FiInfo } from 'react-icons/fi';
import SpotlightCard from '../components/react-bits/SpotlightCard';
import BlurText from '../components/react-bits/BlurText';
import TrackingModal from '../components/TrackingModal';
import CustomerInfoModal from '../components/CustomerInfoModal';
import { useAuth } from '../context/AuthContext';

const PendingOrders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('All');
    const [trackingOrder, setTrackingOrder] = useState(null);
    const [infoCustomer, setInfoCustomer] = useState(null);
    const { user } = useAuth();
    const isCustomer = user?.role === 'customer';

    useEffect(() => {
        fetchAllOrders();
    }, []);

    const fetchAllOrders = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const headers = token ? { Authorization: `Bearer ${token}` } : {};

            // Fetch Invoice Orders
            const invoiceRes = await axios.get('https://al-kabah-uniform.vercel.app/api/invoices/pending', { headers });
            let allOrders = invoiceRes.data.map(o => ({ ...o, orderType: 'invoice' }));

            // If customer, also fetch tailoring orders
            if (isCustomer) {
                const tailoringRes = await axios.get('https://al-kabah-uniform.vercel.app/api/tailoring', { headers });
                const tailoringOrders = tailoringRes.data.map(o => ({ ...o, orderType: 'tailoring', invoiceId: o._id.slice(-6).toUpperCase() }));
                allOrders = [...allOrders, ...tailoringOrders];
            }

            setOrders(allOrders.sort((a, b) => new Date(b.createdAt || b.invoiceDate) - new Date(a.createdAt || a.invoiceDate)));
            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    const updateStatus = async (id, newStatus) => {
        try {
            const token = localStorage.getItem('token');
            await axios.put(`https://al-kabah-uniform.vercel.app/api/invoices/${id}/status`, {
                status: newStatus,
                isPaid: newStatus === 'Delivered' || newStatus === 'Paid'
            }, {
                headers: token ? { Authorization: `Bearer ${token}` } : {}
            });

            // Only remove from view if it's no longer "active" (Delivered or Cancelled for admins/staff)
            const shouldRemove = (newStatus === 'Cancelled' || newStatus === 'Delivered') && !isCustomer;

            if (shouldRemove) {
                setOrders(prev => prev.filter(order => order._id !== id));
            } else {
                // Update the status in the local list so the UI reflects it
                setOrders(prev => prev.map(order =>
                    order._id === id ? { ...order, status: newStatus } : order
                ));
            }
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
            <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    return (
        <motion.div
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className={`p-6 min-h-screen transition-colors duration-300 ${isCustomer ? 'bg-[#f5f0eb] dark:bg-[#111827]' : ''}`}
        >
            <div className="max-w-7xl mx-auto">
                <div className="flex items-center mb-10">
                    <BlurText
                        text="Order Ledger"
                        className={`text-3xl font-black italic uppercase tracking-tighter ${isCustomer ? 'text-stone-800 dark:text-teal-300' : 'text-slate-800 dark:text-white'}`}
                        delay={50}
                        animateBy="words"
                    />
                    <span className={`ml-6 px-4 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest border ${isCustomer ? 'bg-teal-500 text-white border-teal-400/30' : 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-300'}`}>
                        {orders.length} Active
                    </span>
                </div>

                {orders.length === 0 ? (
                    <SpotlightCard className={`text-center py-20 rounded-[3rem] shadow-2xl border ${isCustomer ? 'bg-white dark:bg-[#1e293b] border-teal-100/40 dark:border-teal-800/20' : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700'}`}>
                        <div className={`w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-xl ${isCustomer ? 'bg-teal-50 dark:bg-teal-900/30 text-teal-500' : 'bg-green-50 dark:bg-green-900/20 text-green-500'}`}>
                            <FiCheckCircle size={48} />
                        </div>
                        <h2 className={`text-3xl font-black italic uppercase tracking-tighter mb-4 ${isCustomer ? 'text-slate-900 dark:text-white' : 'text-slate-800 dark:text-white'}`}>Perfectly Curated</h2>
                        <p className={`font-medium uppercase tracking-[0.2em] text-xs ${isCustomer ? 'text-stone-400 dark:text-stone-500' : 'text-slate-500 dark:text-slate-400'}`}>Your record is clear. No pending items await your attention.</p>
                    </SpotlightCard>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                        {orders.map((order) => (
                            <motion.div variants={itemVariants} key={order._id}>
                                <SpotlightCard className={`h-full flex flex-col justify-between p-8 rounded-[2.5rem] shadow-2xl transition-all duration-500 border group ${isCustomer ? 'bg-white dark:bg-[#1e293b] border-teal-100/40 dark:border-teal-800/20 hover:border-teal-300/50 dark:hover:border-teal-600/30' : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700'}`}>
                                    <div>
                                        <div className="flex justify-between items-start mb-6">
                                            <div className="flex items-center gap-3">
                                                <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black border tracking-widest ${isCustomer ? 'bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 border-teal-200/30' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
                                                    #{order.invoiceId}
                                                </span>
                                                <span className={`text-[10px] font-black uppercase tracking-widest ${isCustomer ? 'text-stone-400 dark:text-stone-500' : 'text-slate-400'}`}>
                                                    {new Date(order.invoiceDate).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg ${order.paymentMethod === 'UPI' ? 'bg-teal-500 text-white' : 'bg-stone-700 text-teal-300 border border-teal-700/30'}`}>
                                                {order.paymentMethod}
                                            </span>
                                        </div>

                                        <div className="mb-8">
                                            <div className="flex items-center justify-between gap-4">
                                                <h3 className={`flex items-center gap-3 font-black italic uppercase tracking-tighter text-xl ${isCustomer ? 'text-stone-800 dark:text-white' : 'text-slate-800 dark:text-white'}`}>
                                                    <FiUser className={isCustomer ? 'text-teal-500' : 'text-slate-400'} size={22} />
                                                    {order.customerName || (order.customerId ? order.customerId.name : 'Guest')}
                                                </h3>
                                                <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest shadow-sm ${order.status === 'Paid'
                                                    ? 'bg-emerald-500 text-black'
                                                    : 'bg-amber-500 text-black'
                                                    }`}>
                                                    {order.status}
                                                </span>
                                            </div>
                                            <div className="mt-6 space-y-3">
                                                {order.items.slice(0, 3).map((item, idx) => (
                                                    <div key={idx} className={`flex justify-between text-xs font-black uppercase tracking-widest ${isCustomer ? 'text-stone-400 dark:text-stone-500' : 'text-slate-600 dark:text-slate-300'}`}>
                                                        <span>{item.quantity}x {item.name}</span>
                                                        <span className={isCustomer ? 'text-stone-700 dark:text-teal-300' : 'text-slate-400 dark:text-slate-500'}>₹{item.price * item.quantity}</span>
                                                    </div>
                                                ))}
                                                {order.items.length > 3 && (
                                                    <p className="text-[10px] text-teal-600 dark:text-teal-500 italic font-black uppercase tracking-widest pt-2">+{order.items.length - 3} more curated items</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <div className={`flex justify-between items-center py-4 border-t mb-6 ${isCustomer ? 'border-teal-100/40 dark:border-teal-800/20' : 'border-slate-100 dark:border-slate-700'}`}>
                                            <span className={`text-[10px] font-black uppercase tracking-widest ${isCustomer ? 'text-teal-600 dark:text-teal-500' : 'text-slate-500'}`}>Total Investment</span>
                                            <span className={`text-2xl font-black italic tracking-tighter ${isCustomer ? 'text-stone-800 dark:text-teal-300' : 'text-slate-800 dark:text-white'}`}>₹{order.grandTotal}</span>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <button
                                                onClick={() => setTrackingOrder(order)}
                                                className={`flex items-center justify-center gap-3 py-4 rounded-2xl transition-all font-black uppercase tracking-widest text-xs border ${isCustomer ? 'bg-teal-500 text-white border-teal-400/30 hover:bg-teal-600 shadow-xl shadow-teal-400/15' : 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 hover:bg-primary-100'}`}
                                            >
                                                <FiSearch size={18} /> Trace
                                            </button>
                                            {!isCustomer ? (
                                                <button
                                                    onClick={() => setInfoCustomer(order.customerId || { name: order.customerName, isGuest: true })}
                                                    className="flex items-center justify-center gap-2 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 py-2.5 rounded-xl hover:bg-amber-100 transition-colors font-semibold text-sm"
                                                >
                                                    <FiInfo /> Info
                                                </button>
                                            ) : (
                                                <div className="h-full w-full bg-amber-500/5 rounded-2xl border border-dashed border-amber-500/20" /> // Aesthetic placeholder
                                            )}
                                        </div>
                                        {!isCustomer && (
                                            <div className="grid grid-cols-2 gap-3 mt-3">
                                                <button
                                                    onClick={() => updateStatus(order._id, 'Delivered')}
                                                    className="flex items-center justify-center gap-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 py-2.5 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors font-semibold text-sm"
                                                >
                                                    <FiPackage /> Deliver
                                                </button>
                                                <div className="grid grid-rows-2 gap-1.5">
                                                    {order.status !== 'Paid' && (
                                                        <button
                                                            onClick={() => updateStatus(order._id, 'Paid')}
                                                            className="flex items-center justify-center gap-1 bg-green-50 dark:bg-green-900/20 text-green-600 font-semibold text-[10px] rounded-lg h-full"
                                                        >
                                                            <FiCheckCircle /> Paid
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => updateStatus(order._id, 'Cancelled')}
                                                        className="flex items-center justify-center gap-1 bg-red-50 dark:bg-red-900/20 text-red-500 font-semibold text-[10px] rounded-lg h-full"
                                                    >
                                                        <FiXCircle /> Cancel
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </SpotlightCard>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
            <TrackingModal
                isOpen={!!trackingOrder}
                onClose={() => setTrackingOrder(null)}
                order={trackingOrder}
                type={trackingOrder?.orderType}
            />
            <CustomerInfoModal
                isOpen={infoCustomer !== null}
                onClose={() => setInfoCustomer(null)}
                customer={infoCustomer}
            />
        </motion.div>
    );
};

export default PendingOrders;
