import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";

const API_ORIGIN = (import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/v1").replace("/api/v1", "");

export default function Cart() {
  const { cart, totals, updateItem, removeItem } = useCart();
  const navigate = useNavigate();

  if (!cart.items?.length) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <p className="text-slate-500 mb-4">Your cart is empty.</p>
        <Link to="/products" className="btn-primary">Browse Products</Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 grid lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-4">
        {cart.items.map((item) => (
          <div key={item._id} className="card p-4 flex gap-4">
            <div className="w-20 h-20 bg-slate-100 rounded-md overflow-hidden shrink-0 flex items-center justify-center">
              {item.product?.images?.[0] && (
                <img
                  src={item.product.images[0].startsWith("http") ? item.product.images[0] : `${API_ORIGIN}${item.product.images[0]}`}
                  className="w-full h-full object-cover" alt={item.product?.name}
                  onError={(e) => (e.target.style.display = "none")}
                />
              )}
            </div>
            <div className="flex-1">
              <p className="font-semibold text-slate-900">{item.product?.name}</p>
              <p className="text-xs text-slate-500 mt-1">
                {item.size} • {item.color} • {item.printType} ({item.printLocation})
              </p>
              {item.designUrl && <p className="text-xs text-green-600 mt-1">✓ Custom design attached</p>}
              <div className="flex items-center gap-3 mt-2">
                <input type="number" min={1} value={item.quantity} className="input w-16 py-1"
                  onChange={(e) => updateItem(item._id, Math.max(1, Number(e.target.value)))} />
                <button onClick={() => removeItem(item._id)} className="text-xs text-red-600 hover:underline">Remove</button>
              </div>
            </div>
            <p className="font-semibold text-slate-900">₹{item.unitPrice * item.quantity}</p>
          </div>
        ))}
      </div>

      <div className="card p-6 h-fit">
        <h2 className="font-bold text-slate-900 mb-4">Order Summary</h2>
        <div className="space-y-2 text-sm text-slate-600">
          <div className="flex justify-between"><span>Subtotal</span><span>₹{totals.subtotal}</span></div>
          <div className="flex justify-between"><span>Tax (18% GST)</span><span>₹{totals.tax}</span></div>
          <div className="flex justify-between"><span>Shipping</span><span>{totals.shippingCharge === 0 ? "Free" : `₹${totals.shippingCharge}`}</span></div>
          <div className="flex justify-between font-bold text-slate-900 text-base pt-2 border-t border-slate-200">
            <span>Total</span><span>₹{totals.totalAmount}</span>
          </div>
        </div>
        <button onClick={() => navigate("/checkout")} className="btn-primary w-full mt-6">Proceed to Checkout</button>
      </div>
    </div>
  );
}
