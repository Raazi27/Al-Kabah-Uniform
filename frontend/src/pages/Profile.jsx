import { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { FiUser, FiMail, FiPhone, FiMapPin, FiLock, FiSave, FiCamera } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import SpotlightCard from '../components/react-bits/SpotlightCard';
import BlurText from '../components/react-bits/BlurText';

const Profile = () => {
    const { logout } = useAuth();
    const [profile, setProfile] = useState({
        name: '',
        email: '',
        phone: '',
        address: '',
        pincode: '',
        password: '',
        confirmPassword: '',
        profilePicture: ''
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(null);

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('http://localhost:5000/api/auth/profile', {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = res.data;

            if (data) {
                setProfile({
                    name: data.name || '',
                    email: data.email || '',
                    // Prefer direct fields (User model), fallback to customerDetails (Legacy/Customer model)
                    phone: data.phone || data.customerDetails?.phone || '',
                    address: data.address || data.customerDetails?.address || '',
                    pincode: data.pincode || data.customerDetails?.pincode || '',
                    password: '',
                    confirmPassword: '',
                    profilePicture: data.profilePicture || ''
                });
            }
            setLoading(false);
        } catch (err) {
            console.error("Error fetching profile:", err);
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setProfile({ ...profile, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        setFile(file);
        if (file) {
            setPreview(URL.createObjectURL(file));
        }
    };

    const getProfileImageUrl = () => {
        if (preview) return preview;
        if (profile.profilePicture && typeof profile.profilePicture === 'string') {
            const cleanPath = profile.profilePicture.replace(/\\/g, '/');
            return `http://localhost:5000/${cleanPath}`;
        }
        return null; // Should trigger fallback
    };

    const imageUrl = getProfileImageUrl();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');
        setSaving(true);

        if (profile.password && profile.password !== profile.confirmPassword) {
            setError("Passwords don't match");
            setSaving(false);
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const formData = new FormData();
            formData.append('name', profile.name);
            formData.append('email', profile.email);
            formData.append('phone', profile.phone);
            formData.append('address', profile.address);
            formData.append('pincode', profile.pincode);
            if (profile.password) formData.append('password', profile.password);
            if (file) formData.append('profilePicture', file);

            const res = await axios.put('http://localhost:5000/api/auth/profile', formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });

            setMessage('Profile updated successfully!');
            setProfile(prev => ({
                ...prev,
                password: '',
                confirmPassword: '',
                profilePicture: res.data.profilePicture // Update with new path from backend
            }));
            setFile(null); // Clear selected file
            setPreview(null); // Clear preview

            // Optional: If you want to update the global auth context with new name/pic immediately
            // You might need to reload or expose a setUser method from AuthContext
            // window.location.reload(); // Simple brute force update for sidebar
        } catch (err) {
            setError(err.response?.data || 'Failed to update profile');
        } finally {
            setSaving(false);
        }
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
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
            className="max-w-4xl mx-auto p-6 transition-colors duration-300"
        >
            <motion.div variants={itemVariants} className="mb-8">
                <BlurText
                    text="Account Settings"
                    className="text-3xl font-bold text-slate-800 dark:text-white tracking-tight"
                    delay={50}
                    animateBy="words"
                />
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Profile Card */}
                <motion.div
                    variants={itemVariants}
                    className="col-span-1"
                >
                    <SpotlightCard className="p-0 flex flex-col items-center text-center relative overflow-hidden bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 rounded-3xl h-full shadow-lg dark:shadow-none transition-colors">
                        <div className="w-full relative p-8 flex flex-col items-center z-10">
                            <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-primary-500 to-indigo-600 z-0"></div>

                            <div className="relative z-10 -mt-2 mb-4 group cursor-pointer">
                                <motion.div
                                    whileHover={{ scale: 1.05 }}
                                    className="w-32 h-32 rounded-full overflow-hidden border-4 border-white dark:border-slate-800 shadow-xl bg-white dark:bg-slate-700 relative"
                                >
                                    {imageUrl ? (
                                        <img
                                            src={imageUrl}
                                            alt="Profile"
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-300 dark:text-slate-500">
                                            <FiUser size={48} />
                                        </div>
                                    )}
                                </motion.div>
                                <label className="absolute bottom-1 right-1 bg-white dark:bg-slate-700 text-primary-600 dark:text-primary-400 p-2.5 rounded-full shadow-lg border border-slate-100 dark:border-slate-600 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-600 transition-all hover:scale-110">
                                    <FiCamera size={18} />
                                    <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                                </label>
                            </div>

                            <h2 className="text-xl font-bold text-slate-800 dark:text-white mt-2">{profile.name}</h2>
                            <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">{profile.email}</p>

                            <div className="w-full border-t border-slate-100 dark:border-slate-700 pt-6 mt-2 flex flex-col gap-3">
                                <div className="flex items-center text-sm text-slate-600 dark:text-slate-300 text-left w-full pl-4">
                                    <FiPhone className="mr-3 text-primary-500 min-w-[16px]" />
                                    <span className="truncate">{profile.phone || 'No phone added'}</span>
                                </div>
                                <div className="flex items-center text-sm text-slate-600 dark:text-slate-300 text-left w-full pl-4">
                                    <FiMapPin className="mr-3 text-primary-500 min-w-[16px]" />
                                    <span className="line-clamp-2 text-left">{profile.address ? `${profile.address}${profile.pincode ? `, ${profile.pincode}` : ''}` : 'No address added'}</span>
                                </div>
                            </div>
                        </div>
                    </SpotlightCard>
                </motion.div>

                {/* Edit Form */}
                <motion.div
                    variants={itemVariants}
                    className="col-span-1 lg:col-span-2"
                >
                    <SpotlightCard className="p-8 bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 rounded-3xl shadow-lg dark:shadow-none transition-colors">
                        <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100 dark:border-slate-700">
                            <h3 className="text-xl font-bold text-slate-800 dark:text-white">Edit Details</h3>
                            <span className="text-xs font-medium px-3 py-1 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full border border-primary-100 dark:border-primary-800">Personal Information</span>
                        </div>

                        {message && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 p-4 rounded-xl mb-6 flex items-center border border-emerald-100 dark:border-emerald-800"
                            >
                                <FiSave className="mr-2" /> {message}
                            </motion.div>
                        )}
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 p-4 rounded-xl mb-6 border border-red-100 dark:border-red-800"
                            >
                                {error}
                            </motion.div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <motion.div variants={containerVariants} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <motion.div variants={itemVariants} className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Full Name</label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={profile.name}
                                        onChange={handleChange}
                                        className="w-full p-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary-500 focus:bg-white dark:focus:bg-slate-800 outline-none transition-all text-slate-900 dark:text-white placeholder-slate-400"
                                        required
                                    />
                                </motion.div>

                                <motion.div variants={itemVariants} className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Email Address</label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={profile.email}
                                        onChange={handleChange}
                                        className="w-full p-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary-500 focus:bg-white dark:focus:bg-slate-800 outline-none transition-all text-slate-900 dark:text-white placeholder-slate-400"
                                        required
                                    />
                                </motion.div>

                                <motion.div variants={itemVariants} className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Phone Number</label>
                                    <input
                                        type="tel"
                                        name="phone"
                                        value={profile.phone}
                                        onChange={handleChange}
                                        placeholder="+91..."
                                        className="w-full p-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary-500 focus:bg-white dark:focus:bg-slate-800 outline-none transition-all text-slate-900 dark:text-white placeholder-slate-400"
                                    />
                                </motion.div>

                                <motion.div variants={itemVariants} className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Pincode</label>
                                    <input
                                        type="text"
                                        name="pincode"
                                        value={profile.pincode}
                                        onChange={handleChange}
                                        placeholder="110001"
                                        className="w-full p-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary-500 focus:bg-white dark:focus:bg-slate-800 outline-none transition-all text-slate-900 dark:text-white placeholder-slate-400"
                                    />
                                </motion.div>

                                <motion.div variants={itemVariants} className="space-y-2 md:col-span-2">
                                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Address</label>
                                    <textarea
                                        name="address"
                                        value={profile.address}
                                        onChange={handleChange}
                                        placeholder="Street, City, State..."
                                        rows="3"
                                        className="w-full p-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary-500 focus:bg-white dark:focus:bg-slate-800 outline-none transition-all text-slate-900 dark:text-white placeholder-slate-400 resize-none"
                                    />
                                </motion.div>
                            </motion.div>

                            <div className="border-t border-slate-100 dark:border-slate-700 pt-8 mt-4">
                                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6">Security (Optional)</h3>
                                <motion.div variants={containerVariants} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <motion.div variants={itemVariants} className="space-y-2">
                                        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">New Password</label>
                                        <div className="relative">
                                            <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                            <input
                                                type="password"
                                                name="password"
                                                value={profile.password}
                                                onChange={handleChange}
                                                placeholder="••••••••"
                                                className="w-full pl-10 p-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary-500 focus:bg-white dark:focus:bg-slate-800 outline-none transition-all text-slate-900 dark:text-white placeholder-slate-400"
                                            />
                                        </div>
                                    </motion.div>
                                    <motion.div variants={itemVariants} className="space-y-2">
                                        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Confirm Password</label>
                                        <div className="relative">
                                            <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                            <input
                                                type="password"
                                                name="confirmPassword"
                                                value={profile.confirmPassword}
                                                onChange={handleChange}
                                                placeholder="••••••••"
                                                className="w-full pl-10 p-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary-500 focus:bg-white dark:focus:bg-slate-800 outline-none transition-all text-slate-900 dark:text-white placeholder-slate-400"
                                            />
                                        </div>
                                    </motion.div>
                                </motion.div>
                            </div>

                            <motion.div variants={itemVariants} className="flex justify-end pt-6">
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="bg-primary-600 text-white px-8 py-3.5 rounded-xl font-bold shadow-lg shadow-primary-200 dark:shadow-primary-900/30 hover:bg-primary-700 hover:shadow-primary-300 transition-all flex items-center gap-2 disabled:opacity-50 disabled:shadow-none translate-y-0 active:translate-y-0.5"
                                >
                                    {saving ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                            Saving...
                                        </>
                                    ) : (
                                        <><FiSave /> Save Changes</>
                                    )}
                                </button>
                            </motion.div>
                        </form>
                    </SpotlightCard>
                </motion.div>
            </div>
        </motion.div>
    );
};

export default Profile;
