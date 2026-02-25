import { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { FiPlus, FiMinus, FiTrash2, FiSearch, FiShoppingCart } from 'react-icons/fi';

const Billing = () => {
    const [products, setProducts] = useState([]);
    const [cart, setCart] = useState([]);
    const [query, setQuery] = useState('');
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [customers, setCustomers] = useState([]);
    const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

    useEffect(() => {
        // Fetch products or mock
        const fetchProducts = async () => {
            try {
                const res = await axios.get(`http://localhost:5000/api/products/search?query=${query}`);
                setProducts(res.data);
            } catch (err) {
                // Mock products
                setProducts([
                    { _id: '1', name: 'Waiters Uniform', price: 1200, stock: 50, category: 'Uniform' },
                    { _id: '2', name: 'Chef Coat', price: 1500, stock: 20, category: 'Uniform' },
                    { _id: '3', name: 'Apron', price: 300, stock: 100, category: 'Accessories' }
                ]);
            }
        };
        if (query) fetchProducts();
    }, [query]);

    const addToCart = (product) => {
        const existing = cart.find(item => item._id === product._id);
        if (existing) {
            setCart(cart.map(item => item._id === product._id ? { ...item, quantity: item.quantity + 1 } : item));
        } else {
            setCart([...cart, { ...product, quantity: 1 }]);
        }
    };

    const updateQuantity = (id, delta) => {
        setCart(cart.map(item => {
            if (item._id === id) {
                const newQty = Math.max(1, item.quantity + delta);
                return { ...item, quantity: newQty };
            }
            return item;
        }));
    };

    const removeFromCart = (id) => {
        setCart(cart.filter(item => item._id !== id));
    };

    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tax = subtotal * 0.18; // 18% GST example
    const total = subtotal + tax;

    return (
        <div className="flex flex-col lg:flex-row gap-6 lg:h-[calc(100vh-100px)]">
            {/* Left: Product Selection */}
            <div className="flex-1 bg-white dark:bg-slate-800 rounded-lg shadow dark:shadow-none border border-slate-100 dark:border-slate-700 p-4 flex flex-col transition-colors min-h-[400px]">
                <div className="mb-4 relative">
                    <FiSearch className="absolute left-3 top-3 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Scan Barcode or Search Product..."
                        className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-slate-900 text-slate-800 dark:text-white placeholder-slate-400"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        autoFocus
                    />
                </div>

                <div className="flex-1 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 p-2">
                    {products.map(product => (
                        <motion.div
                            key={product._id}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => addToCart(product)}
                            className="bg-gray-50 dark:bg-slate-700 p-4 rounded-lg border border-slate-200 dark:border-slate-600 cursor-pointer hover:bg-blue-50 dark:hover:bg-slate-600/80 transition-colors"
                        >
                            <h3 className="font-bold text-gray-800 dark:text-white text-sm sm:text-base">{product.name}</h3>
                            <p className="text-xs sm:text-sm text-gray-500 dark:text-slate-300">{product.category}</p>
                            <div className="flex justify-between items-center mt-2">
                                <span className="font-bold text-primary-600 dark:text-primary-400">₹{product.price}</span>
                                <span className={`text-[10px] px-2 py-1 rounded ${product.stock < 10 ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' : 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'}`}>
                                    In Stock: {product.stock}
                                </span>
                            </div>
                        </motion.div>
                    ))}
                    {products.length === 0 && <p className="text-gray-500 dark:text-slate-400 text-center col-span-full mt-10">Search for products to add to cart</p>}
                </div>
            </div>

            {/* Right: Cart & Checkout */}
            <div className="w-full lg:w-1/3 bg-white dark:bg-slate-800 rounded-lg shadow dark:shadow-none border border-slate-100 dark:border-slate-700 flex flex-col h-full transition-colors">
                <div className="p-4 border-b border-slate-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/50 rounded-t-lg">
                    <h2 className="font-bold text-lg flex items-center text-slate-800 dark:text-white"><FiShoppingCart className="mr-2" /> Current Order</h2>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {cart.map(item => (
                        <motion.div
                            key={item._id}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="flex justify-between items-center border-b border-slate-100 dark:border-slate-700 pb-2"
                        >
                            <div>
                                <h4 className="font-medium text-slate-800 dark:text-white">{item.name}</h4>
                                <p className="text-sm text-gray-500 dark:text-slate-400">₹{item.price} x {item.quantity}</p>
                            </div>
                            <div className="flex items-center space-x-2">
                                <button onClick={() => updateQuantity(item._id, -1)} className="p-1 bg-gray-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded hover:bg-gray-300 dark:hover:bg-slate-600 transition-colors"><FiMinus size={12} /></button>
                                <span className="w-6 text-center text-slate-800 dark:text-white">{item.quantity}</span>
                                <button onClick={() => updateQuantity(item._id, 1)} className="p-1 bg-gray-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded hover:bg-gray-300 dark:hover:bg-slate-600 transition-colors"><FiPlus size={12} /></button>
                                <button onClick={() => removeFromCart(item._id)} className="p-1 text-red-500 hover:text-red-700 ml-2 transition-colors"><FiTrash2 /></button>
                            </div>
                        </motion.div>
                    ))}
                    {cart.length === 0 && <div className="text-center text-gray-400 dark:text-slate-500 mt-10">Cart is empty</div>}
                </div>

                <div className="p-4 bg-gray-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-700 rounded-b-lg">
                    <div className="space-y-2 mb-4">
                        <div className="flex justify-between text-sm text-slate-600 dark:text-slate-300"><span>Subtotal</span><span>₹{subtotal.toFixed(2)}</span></div>
                        <div className="flex justify-between text-sm text-slate-600 dark:text-slate-300"><span>Tax (18%)</span><span>₹{tax.toFixed(2)}</span></div>
                        <div className="flex justify-between font-bold text-lg text-slate-800 dark:text-white"><span>Total</span><span>₹{total.toFixed(2)}</span></div>
                    </div>
                    <button
                        className="w-full bg-primary-600 text-white py-3 rounded-lg font-bold shadow-lg shadow-primary-500/30 hover:bg-primary-700 transition disabled:opacity-50 disabled:shadow-none"
                        disabled={cart.length === 0}
                        onClick={() => alert("Checkout Logic Implementation")}
                    >
                        Checkout & Print Invoice
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Billing;
