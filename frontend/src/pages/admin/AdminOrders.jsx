import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/axios";
import { STAGE_LABELS } from "../../components/OrderTimeline";

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get("/orders", { params: status ? { status, limit: 100 } : { limit: 100 } })
      .then(({ data }) => setOrders(data.data.orders))
      .finally(() => setLoading(false));
  }, [status]);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Orders</h1>
        <select className="input w-56" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All Statuses</option>
          {Object.entries(STAGE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      {loading ? (
        <p className="text-slate-500">Loading...</p>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr><th className="p-3">Order #</th><th>Customer</th><th>Amount</th><th>Status</th><th>Date</th><th className="p-3"></th></tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o._id} className="border-t border-slate-100">
                  <td className="p-3 font-medium">{o.orderNumber}</td>
                  <td>{o.customer?.name}</td>
                  <td>₹{o.totalAmount}</td>
                  <td>
                    <span className={`badge ${o.status === "CANCELLED" ? "bg-red-100 text-red-700" : "bg-indigo-100 text-indigo-700"}`}>
                      {o.status === "CANCELLED" ? "Cancelled" : STAGE_LABELS[o.status]}
                    </span>
                  </td>
                  <td>{new Date(o.createdAt).toLocaleDateString()}</td>
                  <td className="p-3"><Link to={`/admin/orders/${o._id}`} className="text-indigo-700 hover:underline">Manage</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
