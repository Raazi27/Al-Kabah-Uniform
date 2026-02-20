import { useState, useEffect } from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    PointElement,
    LineElement,
    Filler
} from 'chart.js';
import { Bar, Pie, Line } from 'react-chartjs-2';
import { FiDownload, FiDollarSign, FiShoppingBag, FiUsers, FiTrendingUp } from 'react-icons/fi';
import SpotlightCard from '../components/react-bits/SpotlightCard';
import BlurText from '../components/react-bits/BlurText';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    PointElement,
    LineElement,
    Filler
);

const Reports = () => {
    const [isDark, setIsDark] = useState(false);

    useEffect(() => {
        const checkDarkMode = () => {
            // Check if 'dark' class is present on html element
            setIsDark(document.documentElement.classList.contains('dark'));
        };

        // Initial check
        checkDarkMode();

        // Listen for changes
        const observer = new MutationObserver(checkDarkMode);
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

        return () => observer.disconnect();
    }, []);

    // Common Chart Options for Dark/Light Mode
    const getChartOptions = (title) => ({
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                labels: {
                    color: isDark ? '#e2e8f0' : '#475569',
                    font: { family: "'Inter', sans-serif" }
                }
            },
            title: {
                display: false,
                text: title,
                color: isDark ? '#f8fafc' : '#1e293b'
            },
            tooltip: {
                backgroundColor: isDark ? '#1e293b' : '#ffffff',
                titleColor: isDark ? '#f8fafc' : '#1e293b',
                bodyColor: isDark ? '#cbd5e1' : '#475569',
                borderColor: isDark ? '#334155' : '#e2e8f0',
                borderWidth: 1,
                padding: 10,
                displayColors: true,
                usePointStyle: true,
            }
        },
        scales: {
            y: {
                ticks: { color: isDark ? '#94a3b8' : '#64748b' },
                grid: { color: isDark ? '#334155' : '#f1f5f9' },
                border: { display: false }
            },
            x: {
                ticks: { color: isDark ? '#94a3b8' : '#64748b' },
                grid: { display: false }, // Cleaner look
                border: { display: false }
            }
        }
    });

    // Mock Data
    const salesData = {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [
            {
                label: 'Revenue (₹)',
                data: [15000, 22000, 18000, 28000, 24000, 35000],
                backgroundColor: isDark ? 'rgba(99, 102, 241, 0.8)' : 'rgba(79, 70, 229, 0.8)',
                borderRadius: 4,
                hoverBackgroundColor: isDark ? 'rgba(129, 140, 248, 1)' : 'rgba(67, 56, 202, 1)',
            },
        ],
    };

    const categoryData = {
        labels: ['Uniforms', 'Suits', 'Fabrics', 'Alterations'],
        datasets: [
            {
                label: 'Orders',
                data: [45, 20, 15, 10],
                backgroundColor: [
                    'rgba(244, 63, 94, 0.8)',   // Rose
                    'rgba(59, 130, 246, 0.8)',  // Blue
                    'rgba(16, 185, 129, 0.8)',  // Emerald
                    'rgba(245, 158, 11, 0.8)',  // Amber
                ],
                borderColor: isDark ? '#1e293b' : '#ffffff',
                borderWidth: 2,
            },
        ],
    };

    const kpiStats = [
        { label: 'Total Revenue', value: '₹1,42,000', change: '+12.5%', icon: FiDollarSign, color: 'text-emerald-600', bg: 'bg-emerald-100 dark:bg-emerald-900/20' },
        { label: 'Total Orders', value: '384', change: '+8.2%', icon: FiShoppingBag, color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/20' },
        { label: 'New Customers', value: '142', change: '+5.4%', icon: FiUsers, color: 'text-purple-600', bg: 'bg-purple-100 dark:bg-purple-900/20' },
        { label: 'Avg. Order Value', value: '₹2,450', change: '+2.1%', icon: FiTrendingUp, color: 'text-orange-600', bg: 'bg-orange-100 dark:bg-orange-900/20' },
    ];

    return (
        <div className="p-6 transition-colors duration-300">
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                <BlurText
                    text="Reports & Analytics"
                    className="text-3xl font-extrabold text-slate-800 dark:text-white tracking-tight"
                    delay={50}
                    animateBy="words"
                />
                <div className="flex gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition shadow-sm">
                        <FiDownload /> Export CSV
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition shadow-lg shadow-primary-500/30">
                        <FiDownload /> Download PDF
                    </button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {kpiStats.map((stat, index) => (
                    <SpotlightCard key={index} className="bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{stat.label}</p>
                                <h3 className="text-2xl font-bold text-slate-800 dark:text-white mt-1">{stat.value}</h3>
                            </div>
                            <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}>
                                <stat.icon size={20} />
                            </div>
                        </div>
                        <div className="mt-4 flex items-center text-sm">
                            <span className="text-green-600 dark:text-green-400 font-medium">{stat.change}</span>
                            <span className="text-slate-400 dark:text-slate-500 ml-2">from last month</span>
                        </div>
                    </SpotlightCard>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                {/* Sales Chart */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-lg text-slate-800 dark:text-white">Revenue Overview</h3>
                        <select className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm rounded-lg p-2 outline-none">
                            <option>Last 6 Months</option>
                            <option>This Year</option>
                        </select>
                    </div>
                    <div className="h-[300px]">
                        {/* Key force re-render on theme change */}
                        <Bar key={`bar-${isDark}`} options={getChartOptions('Revenue')} data={salesData} />
                    </div>
                </div>

                {/* Category Chart */}
                <div className="lg:col-span-1 bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                    <h3 className="font-bold text-lg text-slate-800 dark:text-white mb-6">Sales by Category</h3>
                    <div className="h-[300px] flex items-center justify-center">
                        <Pie key={`pie-${isDark}`} options={{
                            maintainAspectRatio: false,
                            plugins: {
                                legend: {
                                    position: 'bottom',
                                    labels: { color: isDark ? '#cbd5e1' : '#475569', padding: 20 }
                                }
                            }
                        }} data={categoryData} />
                    </div>
                </div>
            </div>

            {/* Recent Transactions Table */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
                <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
                    <h3 className="font-bold text-lg text-slate-800 dark:text-white">Recent Transactions</h3>
                    <button className="text-primary-600 dark:text-primary-400 text-sm font-medium hover:underline">View All</button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider font-semibold">
                                <th className="p-4 pl-6">Invoice ID</th>
                                <th className="p-4">Customer</th>
                                <th className="p-4">Date</th>
                                <th className="p-4 text-right">Amount</th>
                                <th className="p-4 text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                            {[1024, 1025, 1026, 1027, 1028].map((id, index) => (
                                <tr key={id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                                    <td className="p-4 pl-6 font-medium text-slate-700 dark:text-slate-200">#INV-{id}</td>
                                    <td className="p-4 text-slate-600 dark:text-slate-400 flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-500 dark:text-slate-400">
                                            {String.fromCharCode(65 + index)}
                                        </div>
                                        Customer {String.fromCharCode(65 + index)}
                                    </td>
                                    <td className="p-4 text-slate-500 dark:text-slate-500 text-sm">Oct {12 + index}, 2023</td>
                                    <td className="p-4 text-right font-medium text-slate-800 dark:text-white">₹{(1500 + index * 250).toLocaleString()}</td>
                                    <td className="p-4 text-center">
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${index % 2 === 0
                                                ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800'
                                                : 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-800'
                                            }`}>
                                            {index % 2 === 0 ? 'Completed' : 'Pending'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Reports;
