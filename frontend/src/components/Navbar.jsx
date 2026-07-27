import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const { cart } = useCart();
  const navigate = useNavigate();
  const itemCount = cart?.items?.length || 0;

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <header className="bg-indigo-950 text-white sticky top-0 z-30 shadow-md">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="text-xl font-bold tracking-tight">
          Merch<span className="text-amber-400">Craft</span>
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          <Link to="/products" className="hover:text-amber-400">Shop</Link>
          {user?.role === "customer" && <Link to="/orders" className="hover:text-amber-400">My Orders</Link>}
          {user?.role === "admin" && <Link to="/admin/dashboard" className="hover:text-amber-400">Admin Panel</Link>}
        </nav>

        <div className="flex items-center gap-4">
          {user?.role !== "admin" && (
            <Link to="/cart" className="relative hover:text-amber-400">
              Cart
              {itemCount > 0 && (
                <span className="absolute -top-2 -right-3 bg-amber-500 text-indigo-950 text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </Link>
          )}
          {user ? (
            <div className="flex items-center gap-3">
              <span className="text-sm hidden sm:inline">Hi, {user.name.split(" ")[0]}</span>
              <button onClick={handleLogout} className="text-sm bg-indigo-800 hover:bg-indigo-700 px-3 py-1.5 rounded-md">
                Logout
              </button>
            </div>
          ) : (
            <Link to="/login" className="text-sm bg-amber-500 text-indigo-950 font-semibold px-3 py-1.5 rounded-md hover:bg-amber-400">
              Login
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
