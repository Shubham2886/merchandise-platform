import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../../api/axios";
import OrderTimeline, { STAGES, STAGE_LABELS } from "../../components/OrderTimeline";

export default function AdminOrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = () => api.get(`/orders/${id}`).then(({ data }) => setOrder(data.data)).finally(() => setLoading(false));
  useEffect(() => { load(); }, [id]);

  if (loading) return <p className="text-slate-500">Loading...</p>;
  if (!order) return <p className="text-slate-500">Order not found.</p>;

  const currentIdx = STAGES.indexOf(order.status);
  const nextStage = STAGES[currentIdx + 1];
  const isPacked = order.status === "PACKED";
  const canAdvance = order.status !== "CANCELLED" && nextStage && !isPacked;
  const canCancel = ["ORDER_PLACED", "PAYMENT_VERIFIED", "DESIGN_APPROVED"].includes(order.status);

  const advance = async () => {
    setBusy(true);
    try {
      await api.patch(`/orders/${id}/status`, { status: nextStage });
      toast.success(`Order moved to ${STAGE_LABELS[nextStage]}`);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not update status");
    } finally {
      setBusy(false);
    }
  };

  const createShipment = async () => {
    setBusy(true);
    try {
      await api.post("/shipping/create", { orderId: id });
      toast.success("Shipment created");
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not create shipment");
    } finally {
      setBusy(false);
    }
  };

  const cancelOrder = async () => {
    if (!confirm("Cancel this order?")) return;
    setBusy(true);
    try {
      await api.patch(`/orders/${id}/status`, { status: "CANCELLED", note: "Cancelled by admin" });
      toast.success("Order cancelled");
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not cancel");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid md:grid-cols-3 gap-8">
      <div className="md:col-span-2 space-y-6">
        <div className="card p-6">
          <h1 className="text-xl font-bold text-slate-900">{order.orderNumber}</h1>
          <p className="text-sm text-slate-500">{order.customer?.name} • {order.customer?.email}</p>

          <div className="mt-4 divide-y divide-slate-100">
            {order.items.map((item, i) => (
              <div key={i} className="py-3 flex justify-between text-sm">
                <div>
                  <p className="font-medium text-slate-900">{item.name}</p>
                  <p className="text-xs text-slate-500">{item.size} • {item.color} • {item.printType} ({item.printLocation}) × {item.quantity}</p>
                  {item.designUrl && <p className="text-xs text-indigo-600">Design: {item.designUrl}</p>}
                </div>
                <p className="font-medium">₹{item.unitPrice * item.quantity}</p>
              </div>
            ))}
          </div>

          <p className="mt-3 text-sm font-bold text-slate-900">Total: ₹{order.totalAmount}</p>
        </div>

        <div className="card p-6">
          <h2 className="font-bold text-slate-900 mb-2">Manage Workflow</h2>
          <p className="text-sm text-slate-500 mb-4">
            Current status: <strong>{order.status === "CANCELLED" ? "Cancelled" : STAGE_LABELS[order.status]}</strong>
          </p>
          <div className="flex flex-wrap gap-3">
            {isPacked && (
              <button disabled={busy} onClick={createShipment} className="btn-primary">
                {busy ? "Working..." : "Create Shipment (→ Shipment Created)"}
              </button>
            )}
            {canAdvance && (
              <button disabled={busy} onClick={advance} className="btn-primary">
                {busy ? "Working..." : `Advance to: ${STAGE_LABELS[nextStage]}`}
              </button>
            )}
            {canCancel && (
              <button disabled={busy} onClick={cancelOrder} className="btn-danger">Cancel Order</button>
            )}
            {order.status === "DELIVERED" && <p className="text-sm text-green-700 font-medium">Order fully delivered.</p>}
            {order.status === "CANCELLED" && <p className="text-sm text-red-700 font-medium">Order was cancelled.</p>}
          </div>
          <p className="text-xs text-slate-400 mt-3">Workflow steps cannot be skipped — this mirrors the server-side state machine.</p>
        </div>

        {order.payment && (
          <div className="card p-6">
            <h2 className="font-bold text-slate-900 mb-2">Payment</h2>
            <p className="text-sm text-slate-600">Status: {order.payment.status}</p>
            <p className="text-sm text-slate-600">Payment ID: {order.payment.paymentId}</p>
            {order.payment.transactionId && <p className="text-sm text-slate-600">Transaction ID: {order.payment.transactionId}</p>}
          </div>
        )}

        {order.shipment && (
          <div className="card p-6">
            <h2 className="font-bold text-slate-900 mb-2">Shipment</h2>
            <p className="text-sm text-slate-600">Courier: {order.shipment.courierName}</p>
            <p className="text-sm text-slate-600">Tracking Number: {order.shipment.trackingNumber}</p>
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
