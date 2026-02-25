import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { SpeedInsights } from '@vercel/speed-insights/react'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Customers from './pages/Customers'
import Products from './pages/Products'
import Billing from './pages/Billing'
import Tailoring from './pages/Tailoring'
import Reports from './pages/Reports'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import AdminUsers from './pages/AdminUsers'
import Checkout from './pages/Checkout'
import ForgotPassword from './pages/ForgotPassword'
import PendingOrders from './pages/PendingOrders'
import Profile from './pages/Profile'
import { AuthProvider } from './context/AuthContext'
import { CartProvider } from './context/CartContext'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <BrowserRouter>
            <AuthProvider>
                <CartProvider>
                    <Routes>
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />
                        <Route path="/forgot-password" element={<ForgotPassword />} />
                        <Route
                            path="/"
                            element={
                                <ProtectedRoute>
                                    <Layout />
                                </ProtectedRoute>
                            }
                        >
                            <Route index element={<Dashboard />} />
                            <Route path="customers" element={<Customers />} />
                            <Route path="products" element={<Products />} />
                            <Route path="billing" element={<Billing />} />
                            <Route path="tailoring" element={<Tailoring />} />
                            <Route path="reports" element={<Reports />} />
                            <Route path="users" element={<AdminUsers />} />
                            <Route path="checkout" element={<Checkout />} />
                            <Route path="pending-orders" element={<PendingOrders />} />
                            <Route path="profile" element={<Profile />} />
                        </Route>
                    </Routes>
                    <SpeedInsights />
                </CartProvider>
            </AuthProvider>
        </BrowserRouter>
    </React.StrictMode>,
)

