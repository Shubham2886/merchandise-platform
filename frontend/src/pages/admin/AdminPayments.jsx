import { useEffect, useState } from "react";
import api from "../../api/axios";

export default function AdminPayments() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/payments").then(({ data }) => setPayments(data.data)).finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Payments</h1>
      {loading ? (
        <p className="text-slate-500">Loading...</p>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr><th className="p-3">Order</th><th>Customer</th><th>Amount</th><th>Status</th><th>Payment ID</th><th className="p-3">Date</th></tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p._id} className="border-t border-slate-100">
                  <td className="p-3">{p.order?.orderNumber}</td>
                  <td>{p.customer?.name}</td>
                  <td>₹{p.amount}</td>
                  <td>
                    <span className={`badge ${p.status === "SUCCESSFUL" ? "bg-green-100 text-green-700" : p.status === "FAILED" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="text-xs">{p.paymentId}</td>
                  <td className="p-3">{new Date(p.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
