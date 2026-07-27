import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../api/axios";
import ProductCard from "../components/ProductCard";

export default function ProductList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, pages: 1 });

  const search = searchParams.get("search") || "";
  const category = searchParams.get("category") || "";
  const sort = searchParams.get("sort") || "";
  const page = searchParams.get("page") || "1";

  useEffect(() => {
    api.get("/categories").then(({ data }) => setCategories(data.data));
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = { page, limit: 12 };
    if (search) params.search = search;
    if (category) params.category = category;
    if (sort) params.sort = sort;

    api
      .get("/products", { params })
      .then(({ data }) => {
        setProducts(data.data.products);
        setPagination(data.data.pagination);
      })
      .finally(() => setLoading(false));
  }, [search, category, sort, page]);

  const update = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    next.set("page", "1");
    setSearchParams(next);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <input
          className="input sm:max-w-xs"
          placeholder="Search products..."
          defaultValue={search}
          onKeyDown={(e) => e.key === "Enter" && update("search", e.target.value)}
        />
        <select className="input sm:max-w-xs" value={category} onChange={(e) => update("category", e.target.value)}>
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c._id} value={c._id}>{c.name}</option>
          ))}
        </select>
        <select className="input sm:max-w-xs" value={sort} onChange={(e) => update("sort", e.target.value)}>
          <option value="">Sort: Newest</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
          <option value="rating">Top Rated</option>
        </select>
      </div>

      {loading ? (
        <p className="text-slate-500">Loading products...</p>
      ) : products.length === 0 ? (
        <p className="text-slate-500">No products found.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
          {products.map((p) => <ProductCard key={p._id} product={p} />)}
        </div>
      )}

      {pagination.pages > 1 && (
        <div className="flex justify-center gap-2 mt-8">
          {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => update("page", String(p))}
              className={`w-8 h-8 rounded-md text-sm ${String(p) === page ? "bg-indigo-900 text-white" : "bg-white border border-slate-300"}`}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
