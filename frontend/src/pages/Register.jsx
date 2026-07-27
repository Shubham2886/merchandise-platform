import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", phone: "" });
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register(form);
      toast.success("Account created!");
      navigate("/products");
    } catch (err) {
      toast.error(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-16 px-4">
      <div className="card p-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-1">Create your account</h1>
        <p className="text-sm text-slate-500 mb-6">Join MerchCraft to start customizing merch</p>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700">Full Name</label>
            <input required className="input mt-1" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Email</label>
            <input type="email" required className="input mt-1" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Phone</label>
            <input className="input mt-1" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Password</label>
            <input type="password" required minLength={6} className="input mt-1" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </div>
          <button disabled={loading} className="btn-primary w-full">{loading ? "Creating..." : "Create Account"}</button>
        </form>

        <p className="text-sm text-slate-500 mt-6 text-center">
          Already have an account? <Link to="/login" className="text-indigo-700 font-medium">Log in</Link>
        </p>
      </div>
    </div>
  );
}
