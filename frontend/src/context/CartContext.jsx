import { createContext, useContext, useState, useCallback } from "react";
import api from "../api/axios";
import toast from "react-hot-toast";

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [cart, setCart] = useState({ items: [] });
  const [totals, setTotals] = useState({ subtotal: 0, tax: 0, shippingCharge: 0, totalAmount: 0 });
  const [loading, setLoading] = useState(false);

  const fetchCart = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/cart");
      setCart(data.data.cart);
      setTotals(data.data.totals);
    } catch {
      // not logged in yet - fine, cart just stays empty
    } finally {
      setLoading(false);
    }
  }, []);

  const addToCart = async (payload) => {
    const { data } = await api.post("/cart", payload);
    setCart(data.data.cart);
    setTotals(data.data.totals);
    toast.success("Added to cart");
  };

  const updateItem = async (itemId, quantity) => {
    const { data } = await api.put(`/cart/${itemId}`, { quantity });
    setCart(data.data.cart);
    setTotals(data.data.totals);
  };

  const removeItem = async (itemId) => {
    const { data } = await api.delete(`/cart/${itemId}`);
    setCart(data.data.cart);
    setTotals(data.data.totals);
    toast.success("Item removed");
  };

  const clearLocal = () => {
    setCart({ items: [] });
    setTotals({ subtotal: 0, tax: 0, shippingCharge: 0, totalAmount: 0 });
  };

  return (
    <CartContext.Provider
      value={{ cart, totals, loading, fetchCart, addToCart, updateItem, removeItem, clearLocal }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
