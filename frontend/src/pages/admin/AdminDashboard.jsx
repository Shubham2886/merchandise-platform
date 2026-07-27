import { useEffect, useState } from "react";
import api from "../../api/axios";

const StatCard = ({ label, value, tone = "indigo" }) => (
  <div className="card p-5">
    <p className="text-xs text-slate-500 uppercase tracking-wide">{label}</p>
    <p className={`text-2xl font-bold mt-1 text-${tone}-900`}>{value}</p>
  </div>
);

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get("/admin/dashboard").then(({ data }) => setStats(data.data));
  }, []);

  if (!stats) return <p className="text-slate-500">Loading dashboard...</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Sales Dashboard</h1>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Revenue" value={`₹${stats.totalRevenue.toLocaleString()}`} />
        <StatCard label="Total Orders" value={stats.totalOrders} />
        <StatCard label="Total Products" value={stats.totalProducts} />
        <StatCard label="Total Customers" value={stats.totalCustomers} />
        <StatCard label="Pending Orders" value={stats.pendingOrders} />
        <StatCard label="Printing In Progress" value={stats.printingOrders} />
        <StatCard label="Delivered Orders" value={stats.deliveredOrders} />
        <StatCard label="Low Stock Items" value={stats.lowStockProducts.length} />
      </div>

      {stats.lowStockProducts.length > 0 && (
        <div className="card p-5 mt-6">
          <h2 className="font-bold text-slate-900 mb-3">Low Stock Products (≤ 5 units)</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 border-b border-slate-100">
                <th className="py-2">Name</th><th>SKU</th><th>Stock</th>
              </tr>
            </thead>
            <tbody>
              {stats.lowStockProducts.map((p) => (
                <tr key={p._id} className="border-b border-slate-50">
                  <td className="py-2">{p.name}</td><td>{p.sku}</td><td className="text-red-600 font-medium">{p.stock}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
