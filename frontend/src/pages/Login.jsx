import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";

export default function Login() {
  const { login } = useAuth();
  const { fetchCart } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      await fetchCart();
      toast.success(`Welcome back, ${user.name.split(" ")[0]}!`);
      navigate(user.role === "admin" ? "/admin/dashboard" : location.state?.from || "/products");
    } catch (err) {
      toast.error(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-16 px-4">
      <div className="card p-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-1">Welcome back</h1>
        <p className="text-sm text-slate-500 mb-6">Log in to your MerchCraft account</p>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700">Email</label>
            <input type="email" required className="input mt-1" value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Password</label>
            <input type="password" required className="input mt-1" value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="••••••••" />
          </div>
          <button disabled={loading} className="btn-primary w-full">{loading ? "Logging in..." : "Log In"}</button>
        </form>

        <p className="text-sm text-slate-500 mt-6 text-center">
          No account? <Link to="/register" className="text-indigo-700 font-medium">Register</Link>
        </p>

        <div className="mt-6 pt-6 border-t border-slate-100 text-xs text-slate-500 space-y-1">
          <p className="font-semibold text-slate-600">Demo credentials</p>
          <p>Admin: admin@merchstore.com / Admin@123</p>
          <p>Customer: customer@merchstore.com / Customer@123</p>
        </div>
      </div>
    </div>
  );
}
