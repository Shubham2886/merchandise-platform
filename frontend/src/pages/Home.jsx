import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div>
      <section className="bg-gradient-to-br from-indigo-950 to-indigo-800 text-white">
        <div className="max-w-7xl mx-auto px-4 py-24 text-center">
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
            Custom Merch, <span className="text-amber-400">Your Design.</span>
          </h1>
          <p className="mt-4 text-indigo-200 max-w-xl mx-auto">
            T-shirts, hoodies, caps, mugs and more — printed exactly how you imagine it. Pick a product, upload your artwork, and we handle the rest.
          </p>
          <Link to="/products" className="inline-block mt-8 bg-amber-500 hover:bg-amber-400 text-indigo-950 font-semibold px-6 py-3 rounded-md">
            Start Shopping
          </Link>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 py-16 grid sm:grid-cols-3 gap-8 text-center">
        {[
          { title: "1. Choose & Customize", desc: "Pick your product, size, color, print type and upload your design." },
          { title: "2. Checkout Securely", desc: "Add to cart, review pricing, and pay through our secure checkout." },
          { title: "3. Track Your Order", desc: "Follow every stage — from printing to delivery — in real time." },
        ].map((s) => (
          <div key={s.title} className="card p-6">
            <h3 className="font-bold text-indigo-900">{s.title}</h3>
            <p className="text-sm text-slate-500 mt-2">{s.desc}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
