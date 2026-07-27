import { Link } from "react-router-dom";

export default function ProductCard({ product }) {
  return (
    <Link to={`/products/${product._id}`} className="card overflow-hidden hover:shadow-md transition-shadow group">
      <div className="aspect-square bg-slate-100 overflow-hidden flex items-center justify-center">
        {product.images?.[0] ? (
          <img
            src={product.images[0].startsWith("http") ? product.images[0] : `${import.meta.env.VITE_API_BASE_URL?.replace("/api/v1", "") || "http://localhost:5000"}${product.images[0]}`}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
            onError={(e) => (e.target.style.display = "none")}
          />
        ) : (
          <span className="text-slate-400 text-sm">No image</span>
        )}
      </div>
      <div className="p-3">
        <p className="text-xs text-indigo-600 font-medium uppercase tracking-wide">{product.category?.name}</p>
        <h3 className="font-semibold text-slate-800 truncate">{product.name}</h3>
        <div className="flex items-center justify-between mt-1">
          <span className="font-bold text-slate-900">₹{product.price}</span>
          {product.stock <= 5 && product.stock > 0 && (
            <span className="badge bg-amber-100 text-amber-700">Only {product.stock} left</span>
          )}
          {product.stock === 0 && <span className="badge bg-red-100 text-red-700">Out of stock</span>}
        </div>
      </div>
    </Link>
  );
}
