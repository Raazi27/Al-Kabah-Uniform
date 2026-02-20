import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FiUsers, FiShoppingBag, FiScissors, FiDollarSign, FiBarChart2 } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import SpotlightCard from '../components/react-bits/SpotlightCard';
import BlurText from '../components/react-bits/BlurText';

const DashboardCard = ({ title, value, icon, color, trend }) => (
    <SpotlightCard className="h-full p-0 flex flex-col relative overflow-hidden group bg-white dark:bg-slate-800 border-white/20 dark:border-slate-700">
        <div className="relative p-6 h-full flex flex-col justify-between z-10">
            <div className={`absolute top-0 right-0 w-24 h-24 bg-${color}-50 dark:bg-${color}-900/20 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110 z-0`}></div>

            <div className="relative z-10 flex flex-col h-full justify-between">
                <div className="flex justify-between items-start mb-4">
                    <div className={`p-3 rounded-xl bg-${color}-50 dark:bg-${color}-900/30 text-${color}-600 dark:text-${color}-400`}>
                        {icon}
                    </div>
                    {trend && (
                        <span className="text-xs font-semibold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 px-2 py-1 rounded-full flex items-center">
                            +{trend}%
                        </span>
                    )}
                </div>

                <div>
                    <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1">{title}</p>
                    <h3 className="text-3xl font-bold text-slate-800 dark:text-white tracking-tight">{value}</h3>
                </div>
            </div>
        </div>
    </SpotlightCard>
);

const Dashboard = () => {
    const { user } = useAuth();
    const isAdmin = user?.role === 'admin';
    const isCustomer = user?.role === 'customer';

    const [stats, setStats] = useState({
        sales: 0,
        customers: 0,
        orders: 0,
        products: 0
    });

    useEffect(() => {
        // Fetch stats from backend
        // For now mock data or fetch
        const fetchStats = async () => {
            try {
                // In a real app, we would fetch different endpoints based on role
                if (isCustomer) {
                    setStats({
                        sales: 2500, // Total spent
                        customers: 1, // Self
                        orders: 2, // Own orders
                        products: 0 // Not relevant
                    });
                } else {
                    setStats({
                        sales: 125000,
                        customers: 154,
                        orders: 12,
                        products: 45
                    });
                }
            } catch (err) {
                console.error(err);
            }
        };
        fetchStats();
    }, [isCustomer]);

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
                delayChildren: 0.2
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { type: "spring", stiffness: 100 }
        }
    };

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            <motion.div variants={itemVariants} className="flex justify-between items-end mb-8">
                <div>
                    <BlurText
                        text={isCustomer ? 'My Dashboard' : 'Dashboard Overview'}
                        className="text-3xl font-bold text-slate-800 dark:text-white tracking-tight mb-2"
                        delay={50}
                        animateBy="words"
                    />
                    <p className="text-slate-500 dark:text-slate-400 mt-2">Here is what's happening with your business today.</p>
                </div>

                {!isCustomer && (
                    <div className="flex gap-3">
                        <button className="bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-4 py-2 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">Last 30 Days</button>
                        <button className="bg-primary-600 text-white px-4 py-2 rounded-xl shadow-lg shadow-primary-200 dark:shadow-primary-900/20 text-sm font-medium hover:bg-primary-700 hover:scale-105 transition-all">Download Report</button>
                    </div>
                )}
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {!isCustomer && (
                    <>
                        <motion.div variants={itemVariants}><DashboardCard title="Total Revenue" value={`₹${stats.sales.toLocaleString()}`} icon={<FiDollarSign size={24} />} color="emerald" trend="12.5" /></motion.div>
                        <motion.div variants={itemVariants}><DashboardCard title="Active Customers" value={stats.customers} icon={<FiUsers size={24} />} color="blue" trend="4.3" /></motion.div>
                    </>
                )}
                {isCustomer && (
                    <motion.div variants={itemVariants}><DashboardCard title="Total Spent" value={`₹${stats.sales.toLocaleString()}`} icon={<FiDollarSign size={24} />} color="emerald" /></motion.div>
                )}

                <motion.div variants={itemVariants}><DashboardCard title={isCustomer ? "My Active Orders" : "Pending Orders"} value={stats.orders} icon={<FiScissors size={24} />} color="amber" trend={!isCustomer ? "8.2" : null} /></motion.div>

                {!isCustomer && (
                    <motion.div variants={itemVariants}><DashboardCard title="Total Products" value={stats.products} icon={<FiShoppingBag size={24} />} color="violet" /></motion.div>
                )}
            </div>

            {/* Charts Section Placeholder */}
            {!isCustomer && (
                <motion.div variants={itemVariants} className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <SpotlightCard className="col-span-2 min-h-[400px] bg-white dark:bg-slate-800 border-white/20 dark:border-slate-700">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white">Revenue Analytics</h3>
                            <div className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-700 flex items-center justify-center text-slate-400 dark:text-slate-300">
                                <FiBarChart2 />
                            </div>
                        </div>
                        <div className="h-full flex items-center justify-center bg-slate-50/50 dark:bg-slate-900/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 group">
                            <motion.p
                                animate={{ scale: [1, 1.05, 1] }}
                                transition={{ duration: 2, repeat: Infinity }}
                                className="text-slate-400 dark:text-slate-500 font-medium group-hover:text-primary-500 transition-colors"
                            >
                                Chart Integration Coming Soon
                            </motion.p>
                        </div>
                    </SpotlightCard>

                    <SpotlightCard className="bg-white dark:bg-slate-800 border-white/20 dark:border-slate-700">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6">Recent Activity</h3>
                        <div className="space-y-6">
                            {[1, 2, 3, 4].map((i) => (
                                <motion.div
                                    key={i}
                                    initial={{ x: -20, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    transition={{ delay: i * 0.1 + 0.5 }}
                                    className="flex items-start"
                                >
                                    <div className="w-2 h-2 mt-2 rounded-full bg-primary-500 shrink-0 mr-3 animate-pulse"></div>
                                    <div>
                                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">New order #102{i} received</p>
                                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">2 hours ago</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </SpotlightCard>
                </motion.div>
            )}

            {isCustomer && (
                <motion.div variants={itemVariants} className="mt-8 bg-gradient-to-br from-indigo-500 to-purple-600 p-10 rounded-3xl shadow-xl text-center text-white relative overflow-hidden group">
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                        className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-white/10 rounded-full blur-3xl"
                    />
                    <motion.div
                        animate={{ rotate: -360 }}
                        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                        className="absolute bottom-0 left-0 -ml-20 -mb-20 w-64 h-64 bg-white/10 rounded-full blur-3xl"
                    />

                    <div className="relative z-10 max-w-2xl mx-auto">
                        <motion.h3
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.3 }}
                            className="text-2xl font-bold mb-4"
                        >
                            Welcome to Al-Kabah Uniforms!
                        </motion.h3>
                        <motion.p
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.4 }}
                            className="text-indigo-100 mb-8 text-lg"
                        >
                            Track your orders, view our latest collection, and update your profile all in one place.
                        </motion.p>
                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.5 }}
                            className="flex justify-center gap-4"
                        >
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="bg-white text-indigo-600 px-8 py-3 rounded-xl font-bold hover:bg-indigo-50 transition shadow-lg"
                            >
                                Browse Products
                            </motion.button>
                        </motion.div>
                    </div>
                </motion.div>
            )}
        </motion.div>
    );
};

export default Dashboard;
