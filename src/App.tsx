import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  ShoppingBag, ShieldCheck, Heart, User as UserIcon, ShieldAlert, 
  MapPin, Clock, Phone, AlertTriangle, Menu as MenuIcon, X 
} from "lucide-react";
import { 
  User, Menu, Category, Order, Promotion, Testimonial, AppSettings, 
  CartItem, UserRole, OrderStatus 
} from "./types";
import LandingPage from "./components/LandingPage";
import CustomerPanel from "./components/CustomerPanel";
import AdminPanel from "./components/AdminPanel";
import ProductDetailModal from "./components/ProductDetailModal";
import Toast, { ToastItem } from "./components/Toast";

export default function App() {
  // Global States
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  
  const [settings, setSettings] = useState<AppSettings>({
    businessName: "Angkringan Songo",
    address: "Jl. Raya Serang KM 24, Balaraja, Tangerang, Banten",
    whatsapp: "628123456789",
    email: "kontak@angkringansongo.com",
    facebook: "angkringansongo.id",
    instagram: "angkringansongo",
    openingHours: "17:00 - 01:00 WIB",
    gmapsEmbedUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3966.5721111977797!2d106.462828!3d-6.187903!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e420067cb4ca9c3%3A0x401576d14fed460!2sBalaraja%2C%20Tangerang%20Regency%2C%20Banten!5e0!3m2!1sid!2sid!4v1719412345678!5m2!1sid!2sid"
  });

  const [menus, setMenus] = useState<Menu[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  
  // App UI state
  const [currentView, setCurrentView] = useState<"landing" | "customer" | "admin">("landing");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Menu | null>(null);

  // Initialize: load local user, local cart, then fetch app API
  useEffect(() => {
    const storedUser = localStorage.getItem("angkringan_user");
    const storedToken = localStorage.getItem("angkringan_token");
    const storedCart = localStorage.getItem("angkringan_cart");

    if (storedUser && storedToken) {
      try {
        setUser(JSON.parse(storedUser));
        setToken(storedToken);
      } catch (e) {
        localStorage.removeItem("angkringan_user");
        localStorage.removeItem("angkringan_token");
      }
    }

    if (storedCart) {
      try {
        setCart(JSON.parse(storedCart));
      } catch (e) {
        localStorage.removeItem("angkringan_cart");
      }
    }

    // Initial fetch API
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      // Parallel fetch for speed
      const [resSettings, resMenus, resCats, resPromos, resTestis] = await Promise.all([
        fetch("/api/settings"),
        fetch("/api/menus"),
        fetch("/api/categories"),
        fetch("/api/promotions"),
        fetch("/api/testimonials")
      ]);

      if (resSettings.ok) {
        const data = await resSettings.json();
        setSettings(data.settings || data);
      }
      if (resMenus.ok) setMenus(await resMenus.json());
      if (resCats.ok) setCategories(await resCats.json());
      if (resPromos.ok) setPromotions(await resPromos.json());
      if (resTestis.ok) setTestimonials(await resTestis.json());
    } catch (err) {
      console.error("Gagal sinkronisasi data awal API:", err);
    }
  };

  // Fetch admin-level orders if token exists or updates
  useEffect(() => {
    if (token && user?.role === UserRole.ADMIN) {
      fetchAdminOrders();
    } else if (token && user?.role === UserRole.CUSTOMER) {
      fetchCustomerOrders();
    }
  }, [token, user]);

  const fetchAdminOrders = async () => {
    try {
      const res = await fetch("/api/orders", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    } catch (err) {
      console.error("Gagal memuat daftar pesanan admin:", err);
    }
  };

  const fetchCustomerOrders = async () => {
    try {
      const res = await fetch("/api/orders", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    } catch (err) {
      console.error("Gagal memuat riwayat belanja pelanggan:", err);
    }
  };

  const handleRefreshAllData = () => {
    fetchInitialData();
    if (token) {
      if (user?.role === UserRole.ADMIN) {
        fetchAdminOrders();
      } else if (user?.role === UserRole.CUSTOMER) {
        fetchCustomerOrders();
      }
    }
  };

  // Update Cart LocalStorage helper
  const saveCartToLocal = (newCart: CartItem[]) => {
    setCart(newCart);
    localStorage.setItem("angkringan_cart", JSON.stringify(newCart));
  };

  // TOAST NOTIFICATIONS CORE
  const addToast = (message: string, type: "success" | "error" | "warning" | "info") => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // AUTH ACTIONS
  const handleLogin = async (userData: User, userToken: string) => {
    setUser(userData);
    setToken(userToken);
    localStorage.setItem("angkringan_user", JSON.stringify(userData));
    localStorage.setItem("angkringan_token", userToken);

    addToast(`Wilujeng sumping, ${userData.name}!`, "success");

    // Route properly
    if (userData.role === UserRole.ADMIN) {
      setCurrentView("admin");
    } else {
      setCurrentView("customer");
    }
  };

  const handleLogout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("angkringan_user");
    localStorage.removeItem("angkringan_token");
    setOrders([]);
    addToast("Anda berhasil keluar dari akun.", "info");
    setCurrentView("landing");
  };

  // CART ACTIONS
  const handleAddToCart = (menuId: string, quantity: number, notes: string) => {
    const targetMenu = menus.find((m) => m.id === menuId);
    if (!targetMenu) return;

    if (targetMenu.stock < quantity) {
      addToast(`Sisa stok harian untuk ${targetMenu.name} tersisa ${targetMenu.stock} porsi.`, "warning");
      return;
    }

    const existingIndex = cart.findIndex((item) => item.menuId === menuId);
    const newCart = [...cart];

    if (existingIndex > -1) {
      const combinedQty = newCart[existingIndex].quantity + quantity;
      if (targetMenu.stock < combinedQty) {
        addToast(`Gagal menambahkan. Total porsi di keranjang Anda melebihi batas stok.`, "warning");
        return;
      }
      newCart[existingIndex].quantity = combinedQty;
      newCart[existingIndex].notes = notes || newCart[existingIndex].notes;
    } else {
      newCart.push({
        menuId,
        name: targetMenu.name,
        price: targetMenu.price,
        image: targetMenu.image,
        quantity,
        notes
      });
    }

    saveCartToLocal(newCart);
    addToast(`Berhasil menambahkan ${quantity} porsi ${targetMenu.name}!`, "success");
  };

  const handleUpdateCartQty = (menuId: string, qty: number) => {
    const targetMenu = menus.find((m) => m.id === menuId);
    if (!targetMenu) return;

    if (qty > targetMenu.stock) {
      addToast(`Gagal. Stok harian ${targetMenu.name} hanya tersedia ${targetMenu.stock} porsi.`, "warning");
      return;
    }

    if (qty <= 0) {
      handleRemoveFromCart(menuId);
      return;
    }

    const newCart = cart.map((item) => 
      item.menuId === menuId ? { ...item, quantity: qty } : item
    );
    saveCartToLocal(newCart);
  };

  const handleRemoveFromCart = (menuId: string) => {
    const newCart = cart.filter((item) => item.menuId !== menuId);
    saveCartToLocal(newCart);
    addToast("Hidangan dihapus dari keranjang belanja.", "info");
  };

  const handleClearCart = () => {
    saveCartToLocal([]);
  };

  const handleUpdateCart = (updatedCart: { menuId: string; quantity: number; notes: string }[]) => {
    const enrichedCart: CartItem[] = updatedCart.map(item => {
      const targetMenu = menus.find(m => m.id === item.menuId);
      return {
        menuId: item.menuId,
        name: targetMenu?.name || "",
        price: targetMenu?.price || 0,
        image: targetMenu?.image || "",
        quantity: item.quantity,
        notes: item.notes
      };
    });
    saveCartToLocal(enrichedCart);
  };

  // Trigger Detail Product Modal View from Landing / Customer
  const handleOpenDetailModal = (menuId: string) => {
    const target = menus.find((m) => m.id === menuId);
    if (target) {
      setSelectedProduct(target);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#FFF8E7] antialiased text-[#3E2723]">
      
      {/* GLOBAL HEADER HEADER - HIDDEN IN ADMIN MODE OR IF PRINTING */}
      {currentView !== "admin" && (
        <header className="sticky top-0 z-[100] w-full bg-[#3E2723] text-[#FFF8E7] border-b border-amber-950/20 backdrop-blur-md shadow-md py-4 px-6 md:px-10 flex items-center justify-between transition-all print:hidden">
          <div className="flex items-center">
            <div className="cursor-pointer select-none" onClick={() => setCurrentView("landing")}>
              <h1 className="font-sans font-extrabold text-lg md:text-2xl tracking-normal leading-snug text-[#FFF8E7] hover:text-amber-300 transition-colors">
                {settings.businessName}
              </h1>
              <span className="text-[10px] md:text-xs text-amber-300 font-mono tracking-[0.2em] uppercase mt-1 block font-medium opacity-90">
                Cita Rasa Tradisional
              </span>
            </div>
          </div>

          {/* User Session Profile / Login actions */}
          <div className="flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-3">
                <div className="text-right leading-none hidden sm:block">
                  <span className="text-xs font-bold text-white block">{user.name}</span>
                  <span className="text-[9px] text-amber-300 font-mono uppercase mt-0.5 block">{user.role}</span>
                </div>
                <button 
                  onClick={() => {
                    if (user.role === UserRole.ADMIN) setCurrentView("admin");
                    else setCurrentView("customer");
                  }}
                  title={user.role === UserRole.ADMIN ? "Buka Panel Admin" : "Buka Panel Pelanggan"}
                  className="w-10 h-10 rounded-full bg-[#6F4E37] border border-amber-300/30 flex items-center justify-center text-amber-100 hover:scale-105 transition-all cursor-pointer shadow"
                >
                  <UserIcon className="w-5 h-5" />
                </button>
                <button 
                  onClick={handleLogout}
                  title="Logout"
                  className="px-2.5 py-1.5 rounded-lg bg-red-600/20 text-red-300 hover:bg-red-600 hover:text-white text-[10px] font-bold transition-all cursor-pointer"
                >
                  Logout
                </button>
              </div>
            ) : (
              <button 
                onClick={() => setCurrentView("customer")}
                className="px-5 py-2.5 rounded-xl bg-amber-400 text-[#3E2723] font-bold text-xs hover:bg-amber-300 shadow active:scale-95 transition-all cursor-pointer"
              >
                Login/Daftar
              </button>
            )}
          </div>
        </header>
      )}

      {/* CORE VIEWPORT PAGES RENDERING CHANGER */}
      <main className="flex-grow">
        <AnimatePresence mode="wait">
          {currentView === "landing" && (
            <motion.div 
              key="landing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <LandingPage 
                settings={settings}
                menus={menus}
                categories={categories}
                testimonials={testimonials}
                promotions={promotions}
                onOpenProductDetail={(menu) => setSelectedProduct(menu)}
                onNavigateToCustomer={() => setCurrentView("customer")}
              />
            </motion.div>
          )}

          {currentView === "customer" && (
            <motion.div 
              key="customer"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <CustomerPanel 
                settings={settings}
                menus={menus}
                categories={categories}
                promotions={promotions}
                user={user}
                token={token}
                onLogin={handleLogin}
                onLogout={handleLogout}
                onUpdateProfile={(updatedUser) => {
                  setUser(updatedUser);
                  localStorage.setItem("angkringan_user", JSON.stringify(updatedUser));
                }}
                addToast={addToast}
                cart={cart.map(item => ({ menuId: item.menuId, quantity: item.quantity, notes: item.notes || "" }))}
                onUpdateCart={handleUpdateCart}
                onOpenProductDetail={(menu) => setSelectedProduct(menu)}
              />
            </motion.div>
          )}

          {currentView === "admin" && user?.role === UserRole.ADMIN && (
            <motion.div 
              key="admin"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <AdminPanel 
                settings={settings}
                menus={menus}
                categories={categories}
                orders={orders}
                promotions={promotions}
                testimonials={testimonials}
                user={user}
                token={token}
                onLogout={handleLogout}
                onRefreshData={handleRefreshAllData}
                addToast={addToast}
                onSetAppSettings={setSettings}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* --- DETAIL PRODUCT FLOATING MODAL OVERLAY --- */}
      <ProductDetailModal 
        menu={selectedProduct}
        categories={categories}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={handleAddToCart}
      />

      {/* --- GLOBAL APP TOAST SYSTEM LAYER --- */}
      <Toast toasts={toasts} removeToast={removeToast} />

    </div>
  );
}
