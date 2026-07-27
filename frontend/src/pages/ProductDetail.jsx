import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";

const API_ORIGIN = (import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/v1").replace("/api/v1", "");

export default function ProductDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [adding, setAdding] = useState(false);

  const [selection, setSelection] = useState({
    size: "",
    color: "",
    printType: "",
    printLocation: "",
    designUrl: "",
    quantity: 1,
  });

  useEffect(() => {
    api.get(`/products/${id}`).then(({ data }) => {
      const p = data.data;
      setProduct(p);
      setSelection((s) => ({
        ...s,
        size: p.sizes?.[0] || "",
        color: p.colors?.[0] || "",
        printType: p.printTypes?.[0] || "",
        printLocation: p.printLocations?.[0] || "",
      }));
      setLoading(false);
    });
  }, [id]);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const { data } = await api.post("/upload", formData, { headers: { "Content-Type": "multipart/form-data" } });
      setSelection((s) => ({ ...s, designUrl: data.data.url }));
      toast.success("Design uploaded");
    } catch (err) {
      toast.error(err.response?.data?.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!user) {
      navigate("/login", { state: { from: `/products/${id}` } });
      return;
    }
    setAdding(true);
    try {
      await addToCart({ productId: product._id, ...selection });
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not add to cart");
    } finally {
      setAdding(false);
    }
  };

  if (loading) return <p className="text-center py-20 text-slate-500">Loading...</p>;
  if (!product) return <p className="text-center py-20 text-slate-500">Product not found.</p>;

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 grid md:grid-cols-2 gap-10">
      <div className="aspect-square bg-slate-100 rounded-lg overflow-hidden flex items-center justify-center">
        {product.images?.[0] ? (
          <img
            src={product.images[0].startsWith("http") ? product.images[0] : `${API_ORIGIN}${product.images[0]}`}
            alt={product.name}
            className="w-full h-full object-cover"
            onError={(e) => (e.target.style.display = "none")}
          />
        ) : (
          <span className="text-slate-400">No image</span>
        )}
      </div>

      <div>
        <p className="text-sm text-indigo-600 font-medium uppercase">{product.category?.name}</p>
        <h1 className="text-3xl font-bold text-slate-900 mt-1">{product.name}</h1>
        <p className="text-2xl font-bold text-indigo-900 mt-2">₹{product.price}</p>
        <p className="text-slate-600 mt-4">{product.description}</p>
        <p className="text-sm text-slate-500 mt-1">SKU: {product.sku} • {product.stock} in stock</p>

        <div className="mt-6 space-y-5">
          {product.sizes?.length > 0 && (
            <div>
              <label className="text-sm font-semibold text-slate-700">Size</label>
              <div className="flex flex-wrap gap-2 mt-2">
                {product.sizes.map((s) => (
                  <button key={s} onClick={() => setSelection({ ...selection, size: s })}
                    className={`px-3 py-1.5 rounded-md border text-sm ${selection.size === s ? "bg-indigo-900 text-white border-indigo-900" : "border-slate-300"}`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {product.colors?.length > 0 && (
            <div>
              <label className="text-sm font-semibold text-slate-700">Color</label>
              <div className="flex flex-wrap gap-2 mt-2">
                {product.colors.map((c) => (
                  <button key={c} onClick={() => setSelection({ ...selection, color: c })}
                    className={`px-3 py-1.5 rounded-md border text-sm ${selection.color === c ? "bg-indigo-900 text-white border-indigo-900" : "border-slate-300"}`}>
                    {c}
                  </button>
                ))}
              </div>
            </div>
          )}

          {product.printTypes?.length > 0 && (
            <div>
              <label className="text-sm font-semibold text-slate-700">Print Type</label>
              <select className="input mt-2" value={selection.printType} onChange={(e) => setSelection({ ...selection, printType: e.target.value })}>
                {product.printTypes.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          )}

          {product.printLocations?.length > 0 && (
            <div>
              <label className="text-sm font-semibold text-slate-700">Print Location</label>
              <select className="input mt-2" value={selection.printLocation} onChange={(e) => setSelection({ ...selection, printLocation: e.target.value })}>
                {product.printLocations.map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
          )}

          <div>
            <label className="text-sm font-semibold text-slate-700">Upload Your Design/Artwork</label>
            <input type="file" accept="image/*,.pdf" onChange={handleFileUpload} className="mt-2 text-sm" />
            {uploading && <p className="text-xs text-slate-500 mt-1">Uploading...</p>}
            {selection.designUrl && <p className="text-xs text-green-600 mt-1">✓ Design attached</p>}
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-700">Quantity</label>
            <input type="number" min={1} max={product.stock} className="input mt-2 w-24"
              value={selection.quantity}
              onChange={(e) => setSelection({ ...selection, quantity: Math.max(1, Number(e.target.value)) })} />
          </div>

          <button
            disabled={adding || product.stock === 0}
            onClick={handleAddToCart}
            className="btn-primary w-full py-3"
          >
            {product.stock === 0 ? "Out of Stock" : adding ? "Adding..." : "Add to Cart"}
          </button>
        </div>
      </div>
    </div>
  );
}
