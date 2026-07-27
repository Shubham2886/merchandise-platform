import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../api/axios";
import OrderTimeline from "../components/OrderTimeline";
import { useAuth } from "../context/AuthContext";

export default function OrderDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  const load = () => api.get(`/orders/${id}`).then(({ data }) => setOrder(data.data)).finally(() => setLoading(false));

  useEffect(() => { load(); }, [id]);

  const cancelOrder = async () => {
    if (!confirm("Cancel this order? This cannot be undone.")) return;
    setCancelling(true);
    try {
      await api.patch(`/orders/${id}/status`, { status: "CANCELLED" });
      toast.success("Order cancelled");
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not cancel order");
    } finally {
      setCancelling(false);
    }
  };

  if (loading) return <p className="text-center py-20 text-slate-500">Loading...</p>;
  if (!order) return <p className="text-center py-20 text-slate-500">Order not found.</p>;

  const canCancel = ["ORDER_PLACED", "PAYMENT_VERIFIED", "DESIGN_APPROVED"].includes(order.status);

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 grid md:grid-cols-3 gap-8">
      <div className="md:col-span-2 space-y-6">
        <div className="card p-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-xl font-bold text-slate-900">{order.orderNumber}</h1>
              <p className="text-sm text-slate-500">Placed {new Date(order.createdAt).toLocaleString()}</p>
            </div>
            {user?.role !== "admin" && canCancel && (
              <button onClick={cancelOrder} disabled={cancelling} className="btn-danger text-sm">
                {cancelling ? "Cancelling..." : "Cancel Order"}
              </button>
            )}
          </div>

          <div className="mt-6 divide-y divide-slate-100">
            {order.items.map((item, i) => (
              <div key={i} className="py-3 flex justify-between text-sm">
                <div>
                  <p className="font-medium text-slate-900">{item.name}</p>
                  <p className="text-xs text-slate-500">{item.size} • {item.color} • {item.printType} ({item.printLocation}) × {item.quantity}</p>
                </div>
                <p className="font-medium">₹{item.unitPrice * item.quantity}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 space-y-1 text-sm text-slate-600">
            <div className="flex justify-between"><span>Subtotal</span><span>₹{order.subtotal}</span></div>
            <div className="flex justify-between"><span>Tax</span><span>₹{order.tax}</span></div>
            <div className="flex justify-between"><span>Shipping</span><span>₹{order.shippingCharge}</span></div>
            <div className="flex justify-between font-bold text-slate-900"><span>Total</span><span>₹{order.totalAmount}</span></div>
          </div>
        </div>

        <div className="card p-6">
          <h2 className="font-bold text-slate-900 mb-2">Shipping Address</h2>
          <p className="text-sm text-slate-600">
            {order.shippingAddress?.line1}, {order.shippingAddress?.line2 && `${order.shippingAddress.line2}, `}
            {order.shippingAddress?.city}, {order.shippingAddress?.state} - {order.shippingAddress?.pincode}
          </p>
          <p className="text-sm text-slate-600">Phone: {order.shippingAddress?.phone}</p>
        </div>

        {order.shipment && (
          <div className="card p-6">
            <h2 className="font-bold text-slate-900 mb-2">Shipment</h2>
            <p className="text-sm text-slate-600">Courier: {order.shipment.courierName}</p>
            <p className="text-sm text-slate-600">Tracking Number: {order.shipment.trackingNumber}</p>
            <p className="text-sm text-slate-600">Est. Delivery: {new Date(order.shipment.estimatedDeliveryDate).toLocaleDateString()}</p>
          </div>
        )}
      </div>

      <div className="card p-6">
        <h2 className="font-bold text-slate-900 mb-4">Order Tracking</h2>
        <OrderTimeline status={order.status} timeline={order.timeline} />
      </div>
    </div>
  );
}
