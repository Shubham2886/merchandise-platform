import { NavLink, Outlet } from "react-router-dom";

const links = [
  { to: "/admin/dashboard", label: "Dashboard" },
  { to: "/admin/products", label: "Products" },
  { to: "/admin/categories", label: "Categories" },
  { to: "/admin/orders", label: "Orders" },
  { to: "/admin/payments", label: "Payments" },
];

export default function AdminLayout() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8 grid md:grid-cols-[200px_1fr] gap-8">
      <aside className="space-y-1">
        {links.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            className={({ isActive }) =>
              `block px-3 py-2 rounded-md text-sm font-medium ${isActive ? "bg-indigo-900 text-white" : "text-slate-600 hover:bg-slate-100"}`
            }
          >
            {l.label}
          </NavLink>
        ))}
      </aside>
      <div>
        <Outlet />
      </div>
    </div>
  );
}
