import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { CartProvider, useCart } from "./context/CartContext";
import { useEffect } from "react";

import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ProductList from "./pages/ProductList";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import OrderHistory from "./pages/OrderHistory";
import OrderDetail from "./pages/OrderDetail";

import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminCategories from "./pages/admin/AdminCategories";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminOrderDetail from "./pages/admin/AdminOrderDetail";
import AdminPayments from "./pages/admin/AdminPayments";

function CartSync() {
  const { user } = useAuth();
  const { fetchCart } = useCart();
  useEffect(() => {
    if (user && user.role === "customer") fetchCart();
  }, [user]);
  return null;
}

function AppRoutes() {
  return (
    <BrowserRouter>
      <CartSync />
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/products" element={<ProductList />} />
            <Route path="/products/:id" element={<ProductDetail />} />
            <Route path="/cart" element={<ProtectedRoute role="customer"><Cart /></ProtectedRoute>} />
            <Route path="/checkout" element={<ProtectedRoute role="customer"><Checkout /></ProtectedRoute>} />
            <Route path="/orders" element={<ProtectedRoute role="customer"><OrderHistory /></ProtectedRoute>} />
            <Route path="/orders/:id" element={<ProtectedRoute><OrderDetail /></ProtectedRoute>} />

            <Route path="/admin" element={<ProtectedRoute role="admin"><AdminLayout /></ProtectedRoute>}>
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="products" element={<AdminProducts />} />
              <Route path="categories" element={<AdminCategories />} />
              <Route path="orders" element={<AdminOrders />} />
              <Route path="orders/:id" element={<AdminOrderDetail />} />
              <Route path="payments" element={<AdminPayments />} />
            </Route>

            <Route path="*" element={<div className="text-center py-20 text-slate-500">404 - Page not found</div>} />
          </Routes>
        </main>
        <footer className="bg-indigo-950 text-indigo-200 text-center text-sm py-6 mt-10">
          MerchCraft — Custom Merchandise E-commerce Platform (Assessment Project)
        </footer>
      </div>
      <Toaster position="top-right" />
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <AppRoutes />
      </CartProvider>
    </AuthProvider>
  );
}
