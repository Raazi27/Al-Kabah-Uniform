import { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { FiPlus, FiEdit, FiTrash2, FiSearch, FiShoppingCart, FiTag, FiX } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useNavigate } from 'react-router-dom';
import SpotlightCard from '../components/react-bits/SpotlightCard';
import BlurText from '../components/react-bits/BlurText';

const Products = () => {
    const { user } = useAuth();
    const { addToCart, cart } = useCart();
    const navigate = useNavigate();
    const isAdmin = user?.role === 'admin';

    const [products, setProducts] = useState([]);
    const [query, setQuery] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        name: '', category: 'Uniform', size: 'M', price: '', stock: '', lowStockAlert: 10
    });

    useEffect(() => {
        fetchProducts();
    }, [query]);

    const fetchProducts = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('http://localhost:5000/api/products' + (query ? `/search?query=${query}` : ''), {
                headers: token ? { Authorization: `Bearer ${token}` } : {}
            });
            setProducts(res.data);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    const handleSaveProduct = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            if (editingId) {
                const res = await axios.put(`http://localhost:5000/api/products/${editingId}`, formData, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setProducts(products.map(p => p._id === editingId ? res.data : p));
                alert('Product Updated Successfully!');
            } else {
                const res = await axios.post('http://localhost:5000/api/products', formData, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setProducts([res.data, ...products]);
                alert('Product Added Successfully!');
            }
            closeModal();
        } catch (err) {
            alert('Failed to save product: ' + (err.response?.data || err.message));
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure? This action cannot be undone.")) return;
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`http://localhost:5000/api/products/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setProducts(products.filter(p => p._id !== id));
        } catch (err) {
            alert("Error deleting product");
        }
    };

    const openEditModal = (product) => {
        setFormData({
            name: product.name,
            category: product.category,
            size: product.size,
            price: product.price,
            stock: product.stock,
            lowStockAlert: product.lowStockAlert || 10
        });
        setEditingId(product._id);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingId(null);
        setFormData({ name: '', category: 'Uniform', size: 'M', price: '', stock: '', lowStockAlert: 10 });
    };

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const item = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
    };

    return (
        <div className="p-6 bg-slate-50 dark:bg-slate-950 min-h-screen relative transition-colors duration-300">
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                <div>
                    <BlurText
                        text="Product Catalog"
                        className="text-3xl font-extrabold text-slate-800 dark:text-white tracking-tight"
                        delay={50}
                        animateBy="words"
                    />
                    <p className="text-slate-500 dark:text-slate-400 mt-1">Manage and view our exclusive collection</p>
                </div>

                {isAdmin && (
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                            setEditingId(null);
                            setFormData({ name: '', category: 'Uniform', size: 'M', price: '', stock: '', lowStockAlert: 10 });
                            setIsModalOpen(true);
                        }}
                        className="flex items-center bg-gradient-to-r from-primary-600 to-indigo-600 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all"
                    >
                        <FiPlus className="mr-2 text-xl" /> Add New Product
                    </motion.button>
                )}
            </div>

            <SpotlightCard className="p-4 mb-8 flex items-center bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700">
                <FiSearch className="text-slate-400 mr-3 text-xl" />
                <input
                    type="text"
                    placeholder="Search by Name, Category or Barcode..."
                    className="w-full outline-none text-slate-700 dark:text-slate-200 placeholder-slate-400 bg-transparent"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                />
            </SpotlightCard>

            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
            ) : (
                <motion.div
                    variants={container}
                    initial="hidden"
                    animate="show"
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                >
                    <AnimatePresence>
                        {products.map((product) => (
                            <motion.div key={product._id} variants={item} layout>
                                <SpotlightCard className="h-full flex flex-col justify-between p-0 overflow-hidden bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700">
                                    <div className="p-5">
                                        <div className="flex justify-between items-start mb-4">
                                            <span className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold px-2 py-1 rounded-md uppercase tracking-wide">
                                                {product.category}
                                            </span>
                                            {/* Barcode Placeholder or ID */}
                                            <span className="text-xs text-slate-300 dark:text-slate-600 font-mono">#{product.productId || '---'}</span>
                                        </div>

                                        <h3 className="font-bold text-xl text-slate-800 dark:text-white mb-2 truncate" title={product.name}>{product.name}</h3>

                                        <div className="flex items-center text-slate-500 dark:text-slate-400 text-sm mb-4 space-x-4">
                                            <div className="flex items-center"><FiTag className="mr-1" /> Size: {product.size}</div>
                                            <div className={`flex items-center font-medium ${product.stock < (product.lowStockAlert || 10) ? 'text-red-500' : 'text-green-600 dark:text-green-400'}`}>
                                                <FiShoppingCart className="mr-1" /> Stock: {product.stock}
                                            </div>
                                        </div>

                                        <div className="flex justify-between items-end border-t border-slate-100 dark:border-slate-700 pt-4 mt-2">
                                            <div>
                                                <span className="text-sm text-slate-400">Price</span>
                                                <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">₹{product.price}</div>
                                            </div>

                                            <div className="flex space-x-2">
                                                {!isAdmin && product.stock > 0 && (
                                                    <button
                                                        onClick={() => addToCart(product)}
                                                        className="p-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 rounded-lg transition-colors"
                                                        title="Add to Cart"
                                                    >
                                                        <FiShoppingCart size={18} />
                                                    </button>
                                                )}

                                                {isAdmin && (
                                                    <>
                                                        <button
                                                            onClick={() => openEditModal(product)}
                                                            className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                                                            title="Edit Product"
                                                        >
                                                            <FiEdit size={18} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(product._id)}
                                                            className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                                                            title="Delete Product"
                                                        >
                                                            <FiTrash2 size={18} />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </SpotlightCard>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </motion.div>
            )}

            {!isAdmin && cart.length > 0 && (
                <motion.button
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    whileHover={{ scale: 1.1 }}
                    onClick={() => navigate('/checkout')}
                    className="fixed bottom-8 right-8 bg-primary-600 text-white p-4 rounded-full shadow-2xl z-50 flex items-center justify-center shadow-primary-500/30 dark:shadow-primary-900/40"
                >
                    <FiShoppingCart size={24} />
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center border-2 border-white dark:border-slate-800">
                        {cart.length}
                    </span>
                </motion.button>
            )}

            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={closeModal}
                            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-8 w-full max-w-lg relative z-10 border dark:border-slate-700"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-2xl font-bold text-slate-800 dark:text-white">{editingId ? 'Edit Product' : 'Add New Product'}</h3>
                                <button onClick={closeModal} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><FiX size={24} /></button>
                            </div>

                            <form onSubmit={handleSaveProduct} className="space-y-5">
                                <div className="space-y-4">
                                    <input
                                        type="text"
                                        placeholder="Product Name"
                                        className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all text-slate-800 dark:text-white"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        required
                                    />

                                    <div className="grid grid-cols-2 gap-4">
                                        <select
                                            className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none text-slate-800 dark:text-white"
                                            value={formData.category}
                                            onChange={e => setFormData({ ...formData, category: e.target.value })}
                                        >
                                            <option value="Uniform">Uniform</option>
                                            <option value="Fabric">Fabric</option>
                                            <option value="Accessories">Accessories</option>
                                        </select>
                                        <input
                                            type="text"
                                            placeholder="Size (S, M, L, XL)"
                                            className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none text-slate-800 dark:text-white"
                                            value={formData.size}
                                            onChange={e => setFormData({ ...formData, size: e.target.value })}
                                            required
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="relative">
                                            <span className="absolute left-3 top-3 text-slate-400">₹</span>
                                            <input
                                                type="number"
                                                placeholder="Price"
                                                className="w-full pl-8 p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none text-slate-800 dark:text-white"
                                                value={formData.price}
                                                onChange={e => setFormData({ ...formData, price: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <input
                                            type="number"
                                            placeholder="Stock"
                                            className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none text-slate-800 dark:text-white"
                                            value={formData.stock}
                                            onChange={e => setFormData({ ...formData, stock: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <label className="text-sm text-slate-500 dark:text-slate-400 whitespace-nowrap">Low Stock Alert:</label>
                                        <input
                                            type="number"
                                            placeholder="10"
                                            className="w-20 p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm text-slate-800 dark:text-white"
                                            value={formData.lowStockAlert}
                                            onChange={e => setFormData({ ...formData, lowStockAlert: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="flex justify-end space-x-3 mt-8">
                                    <button
                                        type="button"
                                        onClick={closeModal}
                                        className="px-5 py-2.5 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl font-medium transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-5 py-2.5 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 shadow-lg shadow-primary-200 dark:shadow-primary-900/20 transition-all"
                                    >
                                        {editingId ? 'Update Product' : 'Create Product'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Products;
