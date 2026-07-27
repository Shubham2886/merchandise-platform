import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import { STAGE_LABELS } from "../components/OrderTimeline";

export default function OrderHistory() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/orders").then(({ data }) => setOrders(data.data.orders)).finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-center py-20 text-slate-500">Loading orders...</p>;
  if (!orders.length) return <p className="text-center py-20 text-slate-500">You haven't placed any orders yet.</p>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">My Orders</h1>
      <div className="space-y-3">
        {orders.map((o) => (
          <Link to={`/orders/${o._id}`} key={o._id} className="card p-4 flex items-center justify-between hover:shadow-md transition-shadow">
            <div>
              <p className="font-semibold text-slate-900">{o.orderNumber}</p>
              <p className="text-xs text-slate-500">{new Date(o.createdAt).toLocaleDateString()} • {o.items?.length} item(s)</p>
            </div>
            <div className="text-right">
              <p className="font-semibold text-slate-900">₹{o.totalAmount}</p>
              <span className={`badge ${o.status === "CANCELLED" ? "bg-red-100 text-red-700" : o.status === "DELIVERED" ? "bg-green-100 text-green-700" : "bg-indigo-100 text-indigo-700"}`}>
                {o.status === "CANCELLED" ? "Cancelled" : STAGE_LABELS[o.status]}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
