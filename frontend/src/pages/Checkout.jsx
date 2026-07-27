import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";

const steps = ["Address", "Review & Pay"];

export default function Checkout() {
  const { user } = useAuth();
  const { cart, totals, clearLocal } = useCart();
  const navigate = useNavigate();

  const [step, setStep] = useState(0);
  const [address, setAddress] = useState({
    line1: user?.address?.line1 || "",
    line2: user?.address?.line2 || "",
    city: user?.address?.city || "",
    state: user?.address?.state || "",
    pincode: user?.address?.pincode || "",
    country: "India",
    phone: user?.address?.phone || user?.phone || "",
  });

  const [order, setOrder] = useState(null);
  const [paymentId, setPaymentId] = useState(null);
  const [placing, setPlacing] = useState(false);
  const [paying, setPaying] = useState(false);

  const placeOrder = async (e) => {
    e.preventDefault();
    setPlacing(true);
    try {
      const { data } = await api.post("/orders", { shippingAddress: address });
      setOrder(data.data);
      const payRes = await api.post("/payments/create", { orderId: data.data._id });
      setPaymentId(payRes.data.data.paymentId);
      setStep(1);
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not place order");
    } finally {
      setPlacing(false);
    }
  };

  const completePayment = async (result) => {
    setPaying(true);
    try {
      await api.post("/payments/verify", { paymentId, simulateResult: result });
      if (result === "success") {
        clearLocal();
        toast.success("Payment successful! Order confirmed.");
        navigate(`/orders/${order._id}`);
      } else {
        toast.error("Payment failed. You can retry from your order history.");
        navigate(`/orders/${order._id}`);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Payment verification failed");
    } finally {
      setPaying(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="flex gap-4 mb-8">
        {steps.map((s, i) => (
          <div key={s} className={`flex items-center gap-2 text-sm font-medium ${i <= step ? "text-indigo-900" : "text-slate-400"}`}>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${i <= step ? "bg-indigo-900 text-white" : "bg-slate-200"}`}>{i + 1}</span>
            {s}
          </div>
        ))}
      </div>

      {step === 0 && (
        <form onSubmit={placeOrder} className="card p-6 space-y-4">
          <h2 className="font-bold text-slate-900">Shipping Address</h2>
          <input required placeholder="Address Line 1" className="input" value={address.line1} onChange={(e) => setAddress({ ...address, line1: e.target.value })} />
          <input placeholder="Address Line 2 (optional)" className="input" value={address.line2} onChange={(e) => setAddress({ ...address, line2: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <input required placeholder="City" className="input" value={address.city} onChange={(e) => setAddress({ ...address, city: e.target.value })} />
            <input required placeholder="State" className="input" value={address.state} onChange={(e) => setAddress({ ...address, state: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input required placeholder="Pincode" className="input" value={address.pincode} onChange={(e) => setAddress({ ...address, pincode: e.target.value })} />
            <input required placeholder="Phone" className="input" value={address.phone} onChange={(e) => setAddress({ ...address, phone: e.target.value })} />
          </div>
          <div className="pt-2 border-t border-slate-100 text-sm text-slate-600 flex justify-between font-semibold">
            <span>Total to pay</span><span>₹{totals.totalAmount}</span>
          </div>
          <button disabled={placing} className="btn-primary w-full">{placing ? "Placing order..." : "Place Order"}</button>
        </form>
      )}

      {step === 1 && order && (
        <div className="card p-6 text-center space-y-4">
          <h2 className="font-bold text-slate-900">Order #{order.orderNumber} placed</h2>
          <p className="text-sm text-slate-500">Complete payment to confirm your order. (This is a mock gateway simulating Razorpay/Stripe.)</p>
          <p className="text-2xl font-bold text-indigo-900">₹{order.totalAmount}</p>
          <div className="flex gap-3 justify-center">
            <button disabled={paying} onClick={() => completePayment("success")} className="btn-primary">
              {paying ? "Processing..." : "Simulate Successful Payment"}
            </button>
            <button disabled={paying} onClick={() => completePayment("failure")} className="btn-secondary">
              Simulate Failed Payment
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
