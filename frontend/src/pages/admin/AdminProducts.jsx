import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import api from "../../api/axios";

const PRINT_TYPES = ["Screen Printing", "DTF Printing", "Sublimation", "Embroidery", "UV Printing"];
const emptyForm = {
  name: "", description: "", category: "", price: "", sku: "", stock: "",
  sizes: "", colors: "", printTypes: [], printLocations: "", images: "",
};

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = () => {
    api.get("/products", { params: { limit: 100 } }).then(({ data }) => setProducts(data.data.products));
    api.get("/categories").then(({ data }) => setCategories(data.data));
  };
  useEffect(load, []);

  const openCreate = () => { setForm(emptyForm); setEditingId(null); setShowForm(true); };
  const openEdit = (p) => {
    setForm({
      name: p.name, description: p.description, category: p.category?._id || p.category,
      price: p.price, sku: p.sku, stock: p.stock,
      sizes: p.sizes.join(", "), colors: p.colors.join(", "),
      printTypes: p.printTypes, printLocations: p.printLocations.join(", "),
      images: p.images.join(", "),
    });
    setEditingId(p._id);
    setShowForm(true);
  };

  const togglePrintType = (t) => {
    setForm((f) => ({ ...f, printTypes: f.printTypes.includes(t) ? f.printTypes.filter((x) => x !== t) : [...f.printTypes, t] }));
  };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      ...form,
      price: Number(form.price),
      stock: Number(form.stock),
      sizes: form.sizes.split(",").map((s) => s.trim()).filter(Boolean),
      colors: form.colors.split(",").map((s) => s.trim()).filter(Boolean),
      printLocations: form.printLocations.split(",").map((s) => s.trim()).filter(Boolean),
      images: form.images.split(",").map((s) => s.trim()).filter(Boolean),
    };
    try {
      if (editingId) {
        await api.put(`/products/${editingId}`, payload);
        toast.success("Product updated");
      } else {
        await api.post("/products", payload);
        toast.success("Product created");
      }
      setShowForm(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    if (!confirm("Delete this product?")) return;
    await api.delete(`/products/${id}`);
    toast.success("Product deleted");
    load();
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Products</h1>
        <button onClick={openCreate} className="btn-primary">+ New Product</button>
      </div>

      {showForm && (
        <form onSubmit={submit} className="card p-6 mb-6 space-y-3">
          <h2 className="font-bold">{editingId ? "Edit Product" : "New Product"}</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            <input required placeholder="Name" className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <select required className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              <option value="">Select Category</option>
              {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          </div>
          <textarea required placeholder="Description" className="input" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <div className="grid sm:grid-cols-3 gap-3">
            <input required type="number" placeholder="Price" className="input" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
            <input required type="number" placeholder="Stock" className="input" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
            <input required placeholder="SKU" className="input" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <input placeholder="Sizes (comma-separated)" className="input" value={form.sizes} onChange={(e) => setForm({ ...form, sizes: e.target.value })} />
            <input placeholder="Colors (comma-separated)" className="input" value={form.colors} onChange={(e) => setForm({ ...form, colors: e.target.value })} />
          </div>
          <input placeholder="Print Locations (comma-separated)" className="input" value={form.printLocations} onChange={(e) => setForm({ ...form, printLocations: e.target.value })} />
          <input placeholder="Image URLs (comma-separated, e.g. /uploads/xyz.jpg)" className="input" value={form.images} onChange={(e) => setForm({ ...form, images: e.target.value })} />
          <div>
            <p className="text-sm font-medium text-slate-700 mb-1">Print Types</p>
            <div className="flex flex-wrap gap-2">
              {PRINT_TYPES.map((t) => (
                <button type="button" key={t} onClick={() => togglePrintType(t)}
                  className={`px-3 py-1 rounded-md border text-sm ${form.printTypes.includes(t) ? "bg-indigo-900 text-white border-indigo-900" : "border-slate-300"}`}>
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-3">
            <button disabled={saving} className="btn-primary">{saving ? "Saving..." : "Save Product"}</button>
            <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
          </div>
        </form>
      )}

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-500">
            <tr><th className="p-3">Name</th><th>SKU</th><th>Category</th><th>Price</th><th>Stock</th><th className="p-3">Actions</th></tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p._id} className="border-t border-slate-100">
                <td className="p-3">{p.name}</td>
                <td>{p.sku}</td>
                <td>{p.category?.name}</td>
                <td>₹{p.price}</td>
                <td className={p.stock <= 5 ? "text-red-600 font-medium" : ""}>{p.stock}</td>
                <td className="p-3 space-x-3">
                  <button onClick={() => openEdit(p)} className="text-indigo-700 hover:underline">Edit</button>
                  <button onClick={() => remove(p._id)} className="text-red-600 hover:underline">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
