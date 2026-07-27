import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import api from "../../api/axios";

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

 const load = async () => {
  const { data } = await api.get("/categories");
  setCategories(data.data);
};

useEffect(() => {
  load();
}, []);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post("/categories", { name, description });
      toast.success("Category created");
      setName(""); setDescription("");
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    if (!confirm("Deactivate this category?")) return;
    await api.delete(`/categories/${id}`);
    toast.success("Category deactivated");
    load();
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Categories</h1>
      <form onSubmit={submit} className="card p-6 mb-6 flex gap-3 items-end flex-wrap">
        <div className="flex-1 min-w-[180px]">
          <label className="text-sm font-medium text-slate-700">Name</label>
          <input required className="input mt-1" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="flex-1 min-w-[180px]">
          <label className="text-sm font-medium text-slate-700">Description</label>
          <input className="input mt-1" value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <button disabled={saving} className="btn-primary">{saving ? "Adding..." : "Add Category"}</button>
      </form>

      <div className="card divide-y divide-slate-100">
        {categories.map((c) => (
          <div key={c._id} className="p-4 flex justify-between items-center">
            <div>
              <p className="font-medium text-slate-900">{c.name}</p>
              <p className="text-xs text-slate-500">{c.description}</p>
            </div>
            <button onClick={() => remove(c._id)} className="text-red-600 text-sm hover:underline">Deactivate</button>
          </div>
        ))}
      </div>
    </div>
  );
}
