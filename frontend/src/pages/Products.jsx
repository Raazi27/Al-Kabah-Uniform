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
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const API_BASE = window.location.hostname === 'localhost' ? '' : `http://${window.location.hostname}:5000`;
    const [formData, setFormData] = useState({
        name: '',
        school: '',
        category: 'Uniform',
        subCategory: '',
        size: 'M',
        price: '',
        stock: '',
        lowStockAlert: 10,
        isUpcoming: false,
        releaseDate: ''
    });

    useEffect(() => {
        fetchProducts();
    }, [query]);

    const fetchProducts = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API_BASE}/api/products` + (query ? `/search?query=${query}` : ''), {
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
            const data = new FormData();
            Object.keys(formData).forEach(key => data.append(key, formData[key]));
            if (selectedFile) data.append('image', selectedFile);

            const config = {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            };

            if (editingId) {
                const res = await axios.put(`${API_BASE}/api/products/${editingId}`, data, config);
                setProducts(products.map(p => p._id === editingId ? res.data : p));
                alert('Product Updated Successfully!');
            } else {
                const res = await axios.post(`${API_BASE}/api/products`, data, config);
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
            await axios.delete(`${API_BASE}/api/products/${id}`, {
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
            school: product.school || '',
            category: product.category,
            subCategory: product.subCategory || '',
            size: product.size,
            price: product.price,
            stock: product.stock,
            lowStockAlert: product.lowStockAlert || 10,
            isUpcoming: product.isUpcoming || false,
            releaseDate: product.releaseDate ? new Date(product.releaseDate).toISOString().split('T')[0] : ''
        });
        setEditingId(product._id);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingId(null);
        setSelectedFile(null);
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
        setFormData({ name: '', school: '', category: 'Uniform', subCategory: '', size: 'M', price: '', stock: '', lowStockAlert: 10, isUpcoming: false, releaseDate: '' });
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
        <div className={`p-6 min-h-screen relative transition-colors duration-300 ${!isAdmin ? 'bg-[#f5f0eb] dark:bg-[#111827]' : 'bg-slate-50 dark:bg-slate-950'}`}>
            <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-8 gap-4">
                <div>
                    <BlurText
                        text="Product Catalog"
                        className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${!isAdmin ? 'text-stone-800 dark:text-teal-300 font-black' : 'text-slate-800 dark:text-white'}`}
                        delay={50}
                        animateBy="words"
                    />
                    <p className={`${!isAdmin ? 'text-teal-700 dark:text-teal-500/70 font-bold uppercase text-[9px] sm:text-[10px] tracking-widest mt-2' : 'text-slate-500 dark:text-slate-400 mt-1 text-sm sm:text-base'}`}>
                        {!isAdmin ? 'Exclusively curated for Al-Kabah Private Clients' : 'Manage and view our exclusive collection'}
                    </p>
                </div>

                {isAdmin && (
                    <div className="flex gap-3">
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => {
                                setEditingId(null);
                                setFormData({ name: '', school: '', category: 'Uniform', subCategory: '', size: 'M', price: 0, stock: 0, lowStockAlert: 10, isUpcoming: true, releaseDate: '' });
                                setIsModalOpen(true);
                            }}
                            className="flex items-center bg-amber-500 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all font-bold"
                        >
                            <FiPlus className="mr-2 text-xl" /> Add Upcoming Product
                        </motion.button>
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => {
                                setEditingId(null);
                                setFormData({ name: '', school: '', category: 'Uniform', subCategory: '', size: 'M', price: '', stock: '', lowStockAlert: 10, isUpcoming: false, releaseDate: '' });
                                setIsModalOpen(true);
                            }}
                            className="flex items-center bg-gradient-to-r from-primary-600 to-indigo-600 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all"
                        >
                            <FiPlus className="mr-2 text-xl" /> Add New Product
                        </motion.button>
                    </div>
                )}
            </div>

            <SpotlightCard className={`p-5 mb-10 flex items-center border-teal-200/20 shadow-xl ${!isAdmin ? 'bg-white dark:bg-[#1e293b] backdrop-blur-xl' : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700'}`}>
                <FiSearch className={`${!isAdmin ? 'text-teal-500' : 'text-slate-400'} mr-4 text-xl`} />
                <input
                    type="text"
                    placeholder="Search by Name, Category or Barcode..."
                    className={`w-full outline-none bg-transparent placeholder-stone-400/50 dark:placeholder-stone-600 font-medium ${!isAdmin ? 'text-stone-800 dark:text-teal-300' : 'text-slate-700 dark:text-slate-200'}`}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                />
            </SpotlightCard>

            {loading ? (
                <div className="flex justify-center py-20">
                    <div className={`w-12 h-12 border-4 border-t-transparent rounded-full animate-spin ${!isAdmin ? 'border-teal-500' : 'border-primary-500'}`}></div>
                </div>
            ) : (
                <motion.div
                    variants={container}
                    initial="hidden"
                    animate="show"
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-8"
                >
                    <AnimatePresence>
                        {products.map((product) => (
                            <motion.div key={product._id} variants={item} layout>
                                <SpotlightCard className={`h-full flex flex-col justify-between p-0 overflow-hidden border transition-all duration-500 group shadow-xl ${!isAdmin ? 'bg-white dark:bg-[#1e293b] border-teal-100/40 dark:border-teal-800/20 hover:border-teal-300/50 dark:hover:border-teal-600/30 rounded-[2.5rem]' : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700'}`}>
                                    <div className="p-6">
                                        <div className="relative group/img">
                                            <div className="w-full h-40 sm:h-64 rounded-2xl sm:rounded-3xl overflow-hidden bg-slate-100 dark:bg-black relative">
                                                {product.image ? (
                                                    <img
                                                        src={`${API_BASE}${product.image}`}
                                                        alt={product.name}
                                                        className="w-full h-full object-cover transition-transform duration-700 group-hover/img:scale-110"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-stone-300 dark:text-teal-700/30">
                                                        <FiTag size={window.innerWidth < 640 ? 32 : 48} />
                                                    </div>
                                                )}

                                                {/* Labels positioned as background elements */}
                                                <div className="absolute top-2 left-2 sm:top-4 sm:left-4 flex flex-col gap-1 sm:gap-2">
                                                    <span className="bg-stone-900/80 backdrop-blur-md text-teal-300 border border-teal-500/30 text-[7px] sm:text-[9px] font-black px-2 py-0.5 sm:px-3 sm:py-1 rounded-md sm:rounded-lg uppercase tracking-[0.1em] sm:tracking-[0.2em] w-fit shadow-xl">
                                                        {product.school}
                                                    </span>
                                                    <span className="bg-teal-500 text-white text-[7px] sm:text-[9px] font-black px-2 py-0.5 sm:px-3 sm:py-1 rounded-md sm:rounded-lg uppercase tracking-widest w-fit shadow-lg">
                                                        {product.category}
                                                    </span>
                                                </div>

                                                <div className="absolute bottom-2 left-2 sm:bottom-4 sm:left-4 sm:right-4 text-white z-20">
                                                    <h3 className="font-black text-sm sm:text-xl italic uppercase tracking-tighter drop-shadow-2xl truncate max-w-[120px] sm:max-w-none" title={product.name}>{product.name}</h3>
                                                    <span className="text-[8px] sm:text-[10px] text-white/50 font-black tracking-widest uppercase mt-0.5 sm:mt-1 block">#{product.productId || '---'}</span>
                                                </div>
                                                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-60" />
                                            </div>
                                        </div>

                                        <div className="flex items-center text-stone-400 dark:text-teal-600/60 text-xs font-black uppercase tracking-widest my-6 space-x-6">
                                            <div className="flex items-center gap-2 underline decoration-teal-400/30 underline-offset-4"><FiTag /> {product.size}</div>
                                            <div className={`flex items-center gap-2 ${product.stock < (product.lowStockAlert || 10) ? 'text-red-500' : 'text-slate-500 dark:text-emerald-500/80'}`}>
                                                <FiShoppingCart /> {product.stock} Available
                                            </div>
                                        </div>

                                        <div className={`flex justify-between items-center border-t pt-6 mt-2 ${!isAdmin ? 'border-teal-100/40 dark:border-teal-800/20' : 'border-slate-100 dark:border-slate-700'}`}>
                                            <div>
                                                <span className="text-[8px] sm:text-[9px] text-teal-600 dark:text-teal-500 font-black uppercase tracking-widest block mb-0.5 sm:mb-1">List Price</span>
                                                <div className={`text-xl sm:text-3xl font-black italic tracking-tighter ${!isAdmin ? 'text-stone-800 dark:text-teal-300' : 'text-primary-600 dark:text-primary-400'}`}>₹{product.price}</div>
                                            </div>

                                            <div className="flex space-x-2">
                                                {!isAdmin && product.stock > 0 && (
                                                    <motion.button
                                                        whileHover={{ scale: 1.1 }}
                                                        whileTap={{ scale: 0.9 }}
                                                        onClick={() => addToCart(product)}
                                                        className="p-3 sm:p-4 bg-teal-500 text-white rounded-xl sm:rounded-2xl shadow-xl hover:shadow-teal-400/30 hover:bg-teal-600 transition-all border border-teal-400/20"
                                                        title="Add to Cart"
                                                    >
                                                        <FiShoppingCart size={window.innerWidth < 640 ? 18 : 22} />
                                                    </motion.button>
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
                    className={`fixed bottom-8 right-8 p-6 rounded-full shadow-2xl z-50 flex items-center justify-center border ${!isAdmin ? 'bg-teal-500 text-white border-teal-400/30 shadow-teal-400/30' : 'bg-primary-600 text-white shadow-primary-500/30 dark:shadow-primary-900/40'}`}
                >
                    <FiShoppingCart size={28} />
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

                                    <input
                                        type="text"
                                        placeholder="School Name"
                                        className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all text-slate-800 dark:text-white"
                                        value={formData.school}
                                        onChange={e => setFormData({ ...formData, school: e.target.value })}
                                        required
                                    />

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="flex flex-col gap-1">
                                            <label className="text-xs text-slate-500 ml-1">Category</label>
                                            <select
                                                className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none text-slate-800 dark:text-white"
                                                value={formData.category}
                                                onChange={e => setFormData({ ...formData, category: e.target.value })}
                                            >
                                                <option value="Uniform">Uniform</option>
                                                <option value="Fabric">Fabric</option>
                                                <option value="Accessories">Accessories</option>
                                            </select>
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <label className="text-xs text-slate-500 ml-1">Sub-Category (Optional)</label>
                                            <input
                                                type="text"
                                                placeholder="e.g. Cotton, Button"
                                                className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none text-slate-800 dark:text-white"
                                                value={formData.subCategory}
                                                onChange={e => setFormData({ ...formData, subCategory: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-1">
                                        <label className="text-xs text-slate-500 ml-1">Product Photo</label>
                                        <div className="flex items-center gap-4">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={e => {
                                                    const file = e.target.files[0];
                                                    setSelectedFile(file);
                                                    if (file) {
                                                        const url = URL.createObjectURL(file);
                                                        setPreviewUrl(url);
                                                    }
                                                }}
                                                className="flex-1 p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none text-slate-800 dark:text-white text-sm"
                                            />
                                            {(previewUrl || (editingId && products.find(p => p._id === editingId)?.image)) && (
                                                <div className="w-16 h-16 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 flex-shrink-0">
                                                    <img
                                                        src={previewUrl || `${API_BASE}${products.find(p => p._id === editingId)?.image}`}
                                                        className="w-full h-full object-cover"
                                                        alt="Preview"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <input
                                            type="text"
                                            placeholder="Size (S, M, L, XL)"
                                            className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none text-slate-800 dark:text-white"
                                            value={formData.size}
                                            onChange={e => setFormData({ ...formData, size: e.target.value })}
                                            required
                                        />
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
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                id="isUpcoming"
                                                className="w-4 h-4 text-primary-600 rounded"
                                                checked={formData.isUpcoming}
                                                onChange={e => setFormData({ ...formData, isUpcoming: e.target.checked })}
                                            />
                                            <label htmlFor="isUpcoming" className="text-sm font-medium text-slate-700 dark:text-slate-200">Upcoming Product</label>
                                        </div>
                                        {formData.isUpcoming && (
                                            <div className="flex flex-col gap-1">
                                                <label className="text-[10px] text-slate-500 uppercase font-bold ml-1">Release Date</label>
                                                <input
                                                    type="date"
                                                    className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-800 dark:text-white"
                                                    value={formData.releaseDate}
                                                    onChange={e => setFormData({ ...formData, releaseDate: e.target.value })}
                                                    required={formData.isUpcoming}
                                                />
                                            </div>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <input
                                            type="number"
                                            placeholder="Stock"
                                            className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none text-slate-800 dark:text-white"
                                            value={formData.stock}
                                            onChange={e => setFormData({ ...formData, stock: e.target.value })}
                                            required={!formData.isUpcoming}
                                        />
                                        <div className="flex items-center gap-2">
                                            <label className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">Low Stock:</label>
                                            <input
                                                type="number"
                                                className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm text-slate-800 dark:text-white"
                                                value={formData.lowStockAlert}
                                                onChange={e => setFormData({ ...formData, lowStockAlert: e.target.value })}
                                            />
                                        </div>
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
