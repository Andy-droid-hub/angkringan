import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  ShoppingBag, Search, Filter, ArrowUpDown, User as UserIcon, LogIn, 
  UserPlus, LogOut, Check, ChevronRight, ShoppingCart, Plus, Minus, 
  Trash2, X, Clipboard, ArrowRight, Heart, Star, Phone, MapPin, 
  Calendar, Receipt, HelpCircle, Sparkles, Tag, ArrowLeft, ShieldAlert 
} from "lucide-react";
import { User, Menu, Category, Order, OrderStatus, Promotion, AppSettings } from "../types";

interface CustomerPanelProps {
  settings: AppSettings;
  menus: Menu[];
  categories: Category[];
  promotions: Promotion[];
  user: User | null;
  token: string | null;
  activeTab?: string; // "dashboard" | "menu" | "orders" | "profile"
  onSetTab?: (tab: string) => void;
  onLogin: (user: User, token: string) => void;
  onLogout: () => void;
  onUpdateProfile: (updatedUser: User) => void;
  addToast: (msg: string, type: "success" | "error" | "warning" | "info") => void;
  cart: { menuId: string; quantity: number; notes: string }[];
  onUpdateCart: (cart: { menuId: string; quantity: number; notes: string }[]) => void;
  onOpenProductDetail: (menu: Menu) => void;
}

export default function CustomerPanel({
  settings,
  menus,
  categories,
  promotions,
  user,
  token,
  activeTab: activeTabProp,
  onSetTab: onSetTabProp,
  onLogin,
  onLogout,
  onUpdateProfile,
  addToast,
  cart,
  onUpdateCart,
  onOpenProductDetail
}: CustomerPanelProps) {
  // Navigation states
  const [localActiveTab, setLocalActiveTab] = useState("dashboard");
  const activeTab = activeTabProp || localActiveTab;
  const onSetTab = onSetTabProp || setLocalActiveTab;

  const [authView, setAuthView] = useState<"login" | "register">("login");
  const [showLoginErrorModal, setShowLoginErrorModal] = useState(false);
  const [loginErrorMsg, setLoginErrorMsg] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // Search, Filter and Sorting states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [maxPrice, setMaxPrice] = useState(15000);
  const [sortBy, setSortBy] = useState<"name" | "price-asc" | "price-desc" | "rating">("rating");

  // Cart & Checkout states
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  
  // Checkout Form
  const [checkoutName, setCheckoutName] = useState("");
  const [checkoutPhone, setCheckoutPhone] = useState("");
  const [checkoutAddress, setCheckoutAddress] = useState("");
  const [deliveryMethod, setDeliveryMethod] = useState<"Makan di Tempat" | "Bungkus" | "Delivery">("Makan di Tempat");
  const [paymentMethod, setPaymentMethod] = useState<"Cash" | "QRIS" | "Transfer Bank" | "E-Wallet">("QRIS");
  const [couponCode, setCouponCode] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<Promotion | null>(null);

  // Auth Inputs
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regPassword, setRegPassword] = useState("");

  // Edit profile state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editPassword, setEditPassword] = useState("");

  // Auto populate profile data
  useEffect(() => {
    if (user) {
      setCheckoutName(user.name);
      setCheckoutPhone(user.phone);
      setEditName(user.name);
      setEditEmail(user.email);
      setEditPhone(user.phone);
    }
  }, [user]);

  // Load orders if logged in
  const fetchOrders = async () => {
    if (!token) return;
    setLoadingOrders(true);
    try {
      const res = await fetch("/api/orders", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setOrders(data.reverse()); // latest first
      }
    } catch (err) {
      console.error("Gagal memuat pesanan:", err);
    } finally {
      setLoadingOrders(false);
    }
  };

  useEffect(() => {
    if (user && token) {
      fetchOrders();
    }
  }, [user, token, activeTab]);

  // Handle Login
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (authView === "login") {
      try {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: loginEmail, password: loginPassword })
        });
        const data = await res.json();
        if (res.ok) {
          onLogin(data.user, data.token);
          addToast(data.message, "success");
          onSetTab("dashboard");
        } else {
          setLoginErrorMsg(data.message || "Kredensial salah atau tidak terdaftar. Periksa kembali nama akun atau password Anda.");
          setShowLoginErrorModal(true);
        }
      } catch (err) {
        addToast("Koneksi gagal. Silakan coba lagi.", "error");
      }
    } else {
      try {
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: regName,
            email: regEmail,
            phone: regPhone,
            password: regPassword
          })
        });
        const data = await res.json();
        if (res.ok) {
          onLogin(data.user, data.token);
          addToast(data.message, "success");
          onSetTab("dashboard");
        } else {
          addToast(data.message || "Pendaftaran gagal.", "error");
        }
      } catch (err) {
        addToast("Koneksi gagal. Silakan coba lagi.", "error");
      }
    }
  };

  // Handle Profile Update
  const handleProfileUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: editName,
          email: editEmail,
          phone: editPhone,
          password: editPassword || undefined
        })
      });
      const data = await res.json();
      if (res.ok) {
        onUpdateProfile(data.user);
        setIsEditingProfile(false);
        setEditPassword("");
        addToast(data.message, "success");
      } else {
        addToast(data.message || "Gagal memperbarui profil.", "error");
      }
    } catch (err) {
      addToast("Terjadi kesalahan koneksi.", "error");
    }
  };

  // Cart operations
  const handleAddToCart = (menuId: string, quantity = 1, notes = "") => {
    const existing = cart.find((item) => item.menuId === menuId);
    let newCart = [...cart];
    if (existing) {
      newCart = cart.map((item) =>
        item.menuId === menuId
          ? { ...item, quantity: item.quantity + quantity, notes: notes || item.notes }
          : item
      );
    } else {
      newCart.push({ menuId, quantity, notes });
    }
    onUpdateCart(newCart);
    addToast("Menu berhasil ditambahkan ke keranjang!", "success");
  };

  const updateCartQty = (menuId: string, qty: number) => {
    if (qty <= 0) {
      const newCart = cart.filter((item) => item.menuId !== menuId);
      onUpdateCart(newCart);
      addToast("Menu dihapus dari keranjang.", "info");
    } else {
      const newCart = cart.map((item) =>
        item.menuId === menuId ? { ...item, quantity: qty } : item
      );
      onUpdateCart(newCart);
    }
  };

  const removeCartItem = (menuId: string) => {
    const newCart = cart.filter((item) => item.menuId !== menuId);
    onUpdateCart(newCart);
    addToast("Menu dihapus dari keranjang.", "info");
  };

  const handleApplyCoupon = () => {
    if (!couponCode) {
      addToast("Mohon masukkan kode kupon terlebih dahulu.", "warning");
      return;
    }
    const promo = promotions.find(
      (p) => p.code.toUpperCase() === couponCode.toUpperCase() && p.isActive
    );
    if (!promo) {
      addToast("Kode kupon tidak valid atau sudah tidak aktif.", "error");
      setAppliedPromo(null);
      return;
    }
    // Check expiry
    if (new Date(promo.expiryDate).getTime() < Date.now()) {
      addToast("Maaf, kupon promo ini sudah kedaluwarsa.", "error");
      setAppliedPromo(null);
      return;
    }
    // Check minimum transaction
    const subtotal = calculateSubtotal();
    if (subtotal < promo.minTransaction) {
      addToast(`Minimal belanja untuk kupon ini adalah Rp ${promo.minTransaction.toLocaleString()}`, "warning");
      setAppliedPromo(null);
      return;
    }

    setAppliedPromo(promo);
    addToast(`Kupon "${promo.name}" berhasil dipasang!`, "success");
  };

  // Calculate prices
  const calculateSubtotal = () => {
    return cart.reduce((sum, item) => {
      const m = menus.find((menu) => menu.id === item.menuId);
      return sum + (m ? m.price * item.quantity : 0);
    }, 0);
  };

  const getDiscountAmount = () => {
    if (!appliedPromo) return 0;
    const subtotal = calculateSubtotal();
    if (appliedPromo.discountType === "percentage") {
      return Math.round((subtotal * appliedPromo.discountValue) / 100);
    }
    return appliedPromo.discountValue;
  };

  const getFinalTotal = () => {
    const subtotal = calculateSubtotal();
    const discount = getDiscountAmount();
    return Math.max(0, subtotal - discount);
  };

  // Handle Checkout Submit
  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkoutName || !checkoutPhone) {
      addToast("Nama dan Nomor HP penerima wajib diisi.", "warning");
      return;
    }
    if (deliveryMethod === "Delivery" && !checkoutAddress) {
      addToast("Alamat pengiriman wajib diisi untuk metode Delivery.", "warning");
      return;
    }

    const orderItems = cart.map((item) => ({
      menuId: item.menuId,
      quantity: item.quantity,
      notes: item.notes
    }));

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          address: deliveryMethod === "Delivery" ? checkoutAddress : (deliveryMethod === "Makan di Tempat" ? `Meja/Tempat: ${checkoutAddress || "Ditentukan Kasir"}` : "Bungkus Bawa Pulang"),
          deliveryMethod,
          paymentMethod,
          items: orderItems,
          promoCode: appliedPromo?.code || undefined
        })
      });
      const data = await res.json();
      if (res.ok) {
        addToast(data.message, "success");
        onUpdateCart([]); // Clear cart
        setAppliedPromo(null);
        setCouponCode("");
        setIsCheckoutOpen(false);
        setIsCartOpen(false);
        fetchOrders();
        onSetTab("orders"); // redirect to order status
      } else {
        addToast(data.message || "Gagal memproses pesanan.", "error");
      }
    } catch (err) {
      addToast("Koneksi gagal saat checkout.", "error");
    }
  };

  // Filter & sort menus
  const processedMenus = menus
    .filter((m) => {
      const matchesSearch = m.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            m.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === "all" || m.category === selectedCategory;
      const matchesPrice = m.price <= maxPrice;
      return matchesSearch && matchesCategory && matchesPrice;
    })
    .sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "price-asc") return a.price - b.price;
      if (sortBy === "price-desc") return b.price - a.price;
      return b.rating - a.rating; // rating default
    });

  // Render Authentication View if no token
  if (!token || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-[#FFF8E7] relative overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#6F4E37]/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#FF9800]/5 rounded-full blur-3xl" />

        <div className="max-w-md w-full bg-white/95 backdrop-blur-md rounded-3xl border border-[#6F4E37]/10 shadow-2xl p-8 relative z-10">
          <div className="text-center space-y-2 mb-8">
            <h2 className="font-serif text-3xl font-bold text-[#3E2723]">
              {authView === "login" ? "Selamat Datang" : "Daftar Akun Baru"}
            </h2>
            <p className="text-xs text-gray-500 font-light leading-relaxed">
              {authView === "login" 
                ? "Masuk untuk menikmati menu angkringan terlezat dan melacak pesanan Anda secara real-time." 
                : "Bergabung bersama ribuan penikmat kuliner tradisional Indonesia."}
            </p>
          </div>

          <form onSubmit={handleAuthSubmit} className="space-y-4">
            {authView === "register" && (
              <>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#3E2723]">Nama Lengkap</label>
                  <input 
                    type="text" 
                    value={regName} 
                    onChange={e => setRegName(e.target.value)} 
                    placeholder="Masukkan nama lengkap" 
                    className="w-full text-sm px-4 py-3 rounded-xl bg-[#FFF8E7]/40 border border-[#6F4E37]/15 focus:outline-none focus:border-[#6F4E37] transition-all text-[#3E2723]"
                    required 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#3E2723]">Nomor WhatsApp (Aktif)</label>
                  <input 
                    type="tel" 
                    value={regPhone} 
                    onChange={e => setRegPhone(e.target.value)} 
                    placeholder="Contoh: 081234567890" 
                    className="w-full text-sm px-4 py-3 rounded-xl bg-[#FFF8E7]/40 border border-[#6F4E37]/15 focus:outline-none focus:border-[#6F4E37] transition-all text-[#3E2723]"
                    required 
                  />
                </div>
              </>
            )}

            {authView === "login" ? (
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#3E2723]">Username atau No HP</label>
                <input 
                  type="text" 
                  value={loginEmail} 
                  onChange={e => setLoginEmail(e.target.value)} 
                  placeholder="Contoh: budisantoso atau 081234567890" 
                  className="w-full text-sm px-4 py-3 rounded-xl bg-[#FFF8E7]/40 border border-[#6F4E37]/15 focus:outline-none focus:border-[#6F4E37] transition-all text-[#3E2723]"
                  required 
                />
              </div>
            ) : (
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#3E2723]">Alamat Email</label>
                <input 
                  type="email" 
                  value={regEmail} 
                  onChange={e => setRegEmail(e.target.value)} 
                  placeholder="nama@email.com" 
                  className="w-full text-sm px-4 py-3 rounded-xl bg-[#FFF8E7]/40 border border-[#6F4E37]/15 focus:outline-none focus:border-[#6F4E37] transition-all text-[#3E2723]"
                  required 
                />
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-bold text-[#3E2723]">Password</label>
              <input 
                type="password" 
                value={authView === "login" ? loginPassword : regPassword} 
                onChange={e => authView === "login" ? setLoginPassword(e.target.value) : setRegPassword(e.target.value)} 
                placeholder="••••••••" 
                className="w-full text-sm px-4 py-3 rounded-xl bg-[#FFF8E7]/40 border border-[#6F4E37]/15 focus:outline-none focus:border-[#6F4E37] transition-all text-[#3E2723]"
                required 
              />
            </div>

            <button 
              type="submit"
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#6F4E37] to-[#3E2723] text-white font-bold hover:shadow-lg hover:shadow-amber-950/20 active:scale-95 transition-all text-sm mt-2 flex items-center justify-center gap-2 cursor-pointer"
            >
              {authView === "login" ? <LogIn className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
              {authView === "login" ? "Masuk ke Akun" : "Daftar Sekarang"}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-100 flex flex-col gap-2 text-center text-xs">
            <button 
              onClick={() => setAuthView(authView === "login" ? "register" : "login")}
              className="text-[#6F4E37] font-semibold hover:underline cursor-pointer"
            >
              {authView === "login" ? "Belum punya akun? Daftar di sini" : "Sudah punya akun? Masuk di sini"}
            </button>
            <button 
              onClick={() => addToast("Silakan hubungi admin via WhatsApp untuk menyetel ulang kata sandi Anda.", "info")}
              className="text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              Lupa Password?
            </button>
          </div>

          {/* Preset Demo Login Accounts for testing */}
          {authView === "login" && (
            <div className="mt-4 p-4 rounded-2xl bg-[#FFF8E7]/60 border border-[#6F4E37]/10 space-y-2 text-left">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block text-center">Akses Demo Cepat</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setLoginEmail("admin");
                    setLoginPassword("admin");
                    addToast("Kredensial Admin siap digunakan. Klik 'Masuk ke Akun'.", "info");
                  }}
                  className="px-3 py-2.5 rounded-xl bg-amber-100 hover:bg-amber-200 text-[#3E2723] text-[11px] font-bold border border-amber-200 transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5"
                >
                  <span className="font-bold">🔑 Admin Demo</span>
                  <span className="text-[9px] text-gray-500 font-normal">admin (admin)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLoginEmail("081234567890");
                    setLoginPassword("123");
                    addToast("Kredensial Pelanggan siap digunakan. Klik 'Masuk ke Akun'.", "info");
                  }}
                  className="px-3 py-2.5 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-600 text-[11px] font-bold border border-gray-200 transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5"
                >
                  <span className="font-bold">👤 Pelanggan Demo</span>
                  <span className="text-[9px] text-gray-500 font-normal">081234567890 (123)</span>
                </button>
              </div>
            </div>
          )}

          {/* POPUP MODAL LOGIN ERROR */}
          <AnimatePresence>
            {showLoginErrorModal && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-[#3E2723]/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4"
              >
                <motion.div
                  initial={{ scale: 0.9, y: 20 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0.9, y: 20 }}
                  className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl border border-red-50 flex flex-col items-center relative"
                >
                  <button 
                    onClick={() => setShowLoginErrorModal(false)}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>

                  <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center text-red-500 mb-4 animate-bounce">
                    <ShieldAlert className="w-8 h-8" />
                  </div>

                  <h3 className="font-sans font-extrabold text-[#3E2723] text-xl mb-2">
                    Akses Ditolak
                  </h3>
                  
                  <p className="text-xs text-gray-500 leading-relaxed font-semibold mb-6">
                    {loginErrorMsg}
                  </p>

                  <button
                    onClick={() => setShowLoginErrorModal(false)}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 text-white font-sans font-bold text-xs shadow-md hover:brightness-110 active:scale-95 transition-all cursor-pointer"
                  >
                    Coba Lagi
                  </button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFF8E7] pb-16 flex flex-col">
      {/* HEADER BAR FOR LOGGED-IN CUSTOMER */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-[#6F4E37]/10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center">
          <div>
            <h2 className="font-sans font-extrabold text-lg md:text-xl text-[#3E2723] leading-tight tracking-normal">{settings.businessName}</h2>
            <span className="text-[10px] text-gray-500 uppercase font-mono tracking-widest mt-1 block font-semibold opacity-85">Panel Pelanggan</span>
          </div>
        </div>

        {/* Customer Nav Links */}
        <div className="hidden md:flex items-center gap-1.5">
          {[
            { id: "dashboard", label: "Dashboard" },
            { id: "menu", label: "Cari Menu" },
            { id: "orders", label: "Pesanan Saya" },
            { id: "profile", label: "Profil Akun" }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => onSetTab(tab.id)}
              className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                activeTab === tab.id 
                  ? "bg-[#6F4E37] text-white shadow-sm" 
                  : "text-[#6F4E37] hover:bg-[#6F4E37]/10"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-3">
          {/* Cart Icon trigger */}
          <button 
            onClick={() => setIsCartOpen(true)}
            className="relative p-2.5 rounded-xl bg-[#FFF8E7] text-[#6F4E37] hover:bg-[#6F4E37]/10 transition-colors cursor-pointer"
          >
            <ShoppingCart className="w-5 h-5" />
            {cart.length > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-[#FF9800] text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-md animate-pulse">
                {cart.reduce((sum, item) => sum + item.quantity, 0)}
              </span>
            )}
          </button>

          <button 
            onClick={onLogout}
            className="p-2.5 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
            title="Keluar"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* MOBILE NAV BOTTOM BAR */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-40 px-4 py-2 flex justify-around">
        {[
          { id: "dashboard", label: "Beranda", icon: <Receipt className="w-5 h-5" /> },
          { id: "menu", label: "Menu", icon: <Search className="w-5 h-5" /> },
          { id: "orders", label: "Pesanan", icon: <ShoppingCart className="w-5 h-5" /> },
          { id: "profile", label: "Profil", icon: <UserIcon className="w-5 h-5" /> }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => onSetTab(tab.id)}
            className={`flex flex-col items-center gap-1 p-1.5 cursor-pointer ${
              activeTab === tab.id ? "text-[#6F4E37]" : "text-gray-400"
            }`}
          >
            {tab.icon}
            <span className="text-[9px] font-medium">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* MAIN PANEL VIEW */}
      <main className="flex-grow max-w-7xl mx-auto w-full px-6 py-8">
        
        {/* TAB 1: DASHBOARD */}
        {activeTab === "dashboard" && (
          <div className="space-y-8">
            {/* Elegant Welcome Banner */}
            <div className="p-8 rounded-3xl bg-gradient-to-r from-[#6F4E37] to-[#3E2723] text-[#FFF8E7] flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden">
              <div className="absolute inset-0 bg-radial-gradient from-amber-500/10 to-transparent pointer-events-none" />
              <div className="space-y-2 relative z-10">
                <span className="inline-block bg-amber-400/20 border border-amber-300/20 text-amber-300 text-[10px] font-mono tracking-widest uppercase px-3 py-1 rounded-full">Pelanggan Setia</span>
                <h1 className="font-serif text-3xl md:text-4xl font-bold">Sugeng Rawuh, {user.name}!</h1>
                <p className="text-amber-100/80 text-sm font-light">Mau makan apa malam hari ini? Menu sate dan wedangan hangat kami siap dinikmati.</p>
              </div>
              <button 
                onClick={() => onSetTab("menu")}
                className="px-6 py-3.5 rounded-xl bg-[#FF9800] hover:bg-orange-600 text-white font-bold text-sm shadow-md transition-all active:scale-95 shrink-0 z-10 cursor-pointer"
              >
                Pesan Makan Malam
              </button>
            </div>

            {/* Active Orders Tracker */}
            {orders.some(o => o.status !== OrderStatus.COMPLETED && o.status !== OrderStatus.CANCELLED) && (
              <div className="space-y-4">
                <h3 className="font-serif font-bold text-xl text-[#3E2723]">Pesanan Aktif Anda</h3>
                <div className="grid grid-cols-1 gap-6">
                  {orders.filter(o => o.status !== OrderStatus.COMPLETED && o.status !== OrderStatus.CANCELLED).map((order) => (
                    <div key={order.id} className="p-6 rounded-3xl bg-white border border-[#6F4E37]/10 shadow-sm space-y-6">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <span className="text-xs text-gray-400 block font-light">Invoice</span>
                          <span className="font-mono text-sm font-bold text-[#6F4E37]">{order.id}</span>
                        </div>
                        <div>
                          <span className="text-xs text-gray-400 block font-light">Metode</span>
                          <span className="text-xs font-semibold text-gray-700 bg-gray-50 border px-3 py-1 rounded-full">{order.deliveryMethod}</span>
                        </div>
                        <div>
                          <span className="text-xs text-gray-400 block font-light">Total Pembayaran</span>
                          <span className="font-mono text-sm font-bold text-emerald-600">Rp {order.totalPrice.toLocaleString()}</span>
                        </div>
                      </div>

                      {/* Visual Order Progress step line */}
                      <div className="relative pt-6 pb-2">
                        {/* Track bar */}
                        <div className="absolute top-8 left-4 right-4 h-1 bg-gray-100 rounded-full -z-10" />
                        <div 
                          className="absolute top-8 left-4 h-1 bg-[#FF9800] rounded-full transition-all duration-500 -z-10" 
                          style={{
                            width: 
                              order.status === OrderStatus.PENDING ? "0%" :
                              order.status === OrderStatus.PROCESSING ? "25%" :
                              order.status === OrderStatus.COOKING ? "50%" :
                              order.status === OrderStatus.READY ? "75%" : "100%"
                          }}
                        />

                        {/* Tracker Steps */}
                        <div className="flex justify-between text-center">
                          {[
                            { name: "Diterima", enumVal: OrderStatus.PENDING },
                            { name: "Diproses", enumVal: OrderStatus.PROCESSING },
                            { name: "Dimasak", enumVal: OrderStatus.COOKING },
                            { name: "Siap Ambil", enumVal: OrderStatus.READY },
                            { name: "Selesai", enumVal: OrderStatus.COMPLETED }
                          ].map((step, idx) => {
                            const stepsOrder = [
                              OrderStatus.PENDING,
                              OrderStatus.PROCESSING,
                              OrderStatus.COOKING,
                              OrderStatus.READY,
                              OrderStatus.COMPLETED
                            ];
                            const currentIdx = stepsOrder.indexOf(order.status);
                            const stepIdx = stepsOrder.indexOf(step.enumVal);
                            const isDone = stepIdx <= currentIdx;
                            const isActive = step.enumVal === order.status;

                            return (
                              <div key={idx} className="flex flex-col items-center flex-1">
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border-2 transition-all ${
                                  isActive ? "bg-[#FF9800] border-[#FF9800] text-white ring-4 ring-orange-100" :
                                  isDone ? "bg-[#6F4E37] border-[#6F4E37] text-white" : "bg-white border-gray-200 text-gray-300"
                                }`}>
                                  {isDone && !isActive ? <Check className="w-3.5 h-3.5" /> : idx + 1}
                                </div>
                                <span className={`text-[10px] mt-2 font-medium tracking-tight ${
                                  isActive ? "text-[#FF9800] font-bold" :
                                  isDone ? "text-[#3E2723]" : "text-gray-400"
                                }`}>
                                  {step.name}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div className="pt-4 border-t border-gray-100 flex justify-between items-center text-xs text-gray-400">
                        <span className="font-light">Update terakhir: {new Date(order.updatedAt).toLocaleTimeString("id-ID")}</span>
                        <span className="text-[#6F4E37] font-semibold cursor-pointer flex items-center gap-1" onClick={() => onSetTab("orders")}>
                          Lihat Detail Pesanan <ChevronRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Action Bento Grid & Promos */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Promotions Cards */}
              <div className="lg:col-span-2 space-y-4">
                <h3 className="font-serif font-bold text-xl text-[#3E2723]">Promo Spesial Hari Ini</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {promotions.filter(p => p.isActive).map((promo) => (
                    <div key={promo.id} className="p-6 rounded-3xl bg-amber-50 border border-amber-200/50 relative overflow-hidden flex flex-col justify-between h-48">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-amber-200/20 rounded-full blur-2xl pointer-events-none" />
                      <div className="space-y-2">
                        <span className="bg-[#6F4E37] text-white font-mono text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full">
                          {promo.discountType === "percentage" ? `Potongan ${promo.discountValue}%` : `Diskon Rp ${promo.discountValue.toLocaleString()}`}
                        </span>
                        <h4 className="font-serif font-bold text-base text-[#3E2723]">{promo.name}</h4>
                        <p className="text-gray-500 text-xs font-light line-clamp-2 leading-relaxed">{promo.description}</p>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-amber-200/30">
                        <div className="bg-white/80 border border-[#6F4E37]/10 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                          <Tag className="w-3.5 h-3.5 text-[#6F4E37]" />
                          <span className="font-mono text-xs font-bold text-[#3E2723]">{promo.code}</span>
                        </div>
                        <button 
                          onClick={() => {
                            setCouponCode(promo.code);
                            addToast(`Kode kupon ${promo.code} disalin ke clipboard!`, "info");
                          }}
                          className="text-xs font-bold text-[#6F4E37] hover:underline cursor-pointer"
                        >
                          Salin Kode
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Simple User Stats */}
              <div className="p-6 rounded-3xl bg-white border border-[#6F4E37]/10 shadow-sm flex flex-col justify-between">
                <div className="space-y-4">
                  <h3 className="font-serif font-bold text-lg text-[#3E2723] border-b pb-3">Statistik Transaksi</h3>
                  <div className="space-y-4 pt-1">
                    <div>
                      <span className="text-xs text-gray-400 block font-light">Total Pembelian Selama Ini</span>
                      <span className="font-mono text-3xl font-bold text-[#6F4E37] block mt-1">
                        Rp {(user.totalTransactions || 0).toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-xs text-gray-400 block font-light">Jumlah Semua Pesanan</span>
                      <span className="text-sm font-semibold text-gray-700 block mt-1">{orders.length} Transaksi</span>
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-gray-100 flex gap-2">
                  <button 
                    onClick={() => onSetTab("menu")}
                    className="w-full py-3 rounded-xl bg-[#6F4E37] text-white text-xs font-bold text-center active:scale-95 transition-all cursor-pointer"
                  >
                    Mulai Order
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: MENU EXPLORER */}
        {activeTab === "menu" && (
          <div className="space-y-8">
            <div className="text-center max-w-xl mx-auto space-y-3">
              <h2 className="font-serif text-3xl font-bold text-[#3E2723]">Cari Hidangan Favorit</h2>
              <p className="text-gray-500 text-xs font-light">Jelajahi kelezatan sate bakar, nasi kucing porsi mini, dan wedang tradisional kami.</p>
            </div>

            {/* Filter and Search Bar */}
            <div className="bg-white p-6 rounded-3xl border border-[#6F4E37]/10 shadow-sm space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Search Input */}
                <div className="relative md:col-span-1">
                  <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input 
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Cari sate, nasi kucing, kopi..."
                    className="w-full text-sm pl-11 pr-4 py-3 rounded-xl bg-[#FFF8E7]/30 border border-[#6F4E37]/15 focus:outline-none focus:border-[#6F4E37] transition-all text-[#3E2723]"
                  />
                </div>

                {/* Sorting Dropdown */}
                <div className="relative">
                  <ArrowUpDown className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  <select
                    value={sortBy}
                    onChange={e => setSortBy(e.target.value as any)}
                    className="w-full text-sm pl-11 pr-4 py-3 rounded-xl bg-[#FFF8E7]/30 border border-[#6F4E37]/15 focus:outline-none focus:border-[#6F4E37] transition-all text-[#3E2723] appearance-none"
                  >
                    <option value="rating">Urutkan: Rating Tertinggi</option>
                    <option value="name">Urutkan: Nama A-Z</option>
                    <option value="price-asc">Urutkan: Harga Termurah</option>
                    <option value="price-desc">Urutkan: Harga Termahal</option>
                  </select>
                </div>

                {/* Price Filter Slider */}
                <div className="flex flex-col justify-center px-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-gray-500 mb-1">
                    <span>Maks. Harga</span>
                    <span className="font-mono text-[#6F4E37]">Rp {maxPrice.toLocaleString()}</span>
                  </div>
                  <input 
                    type="range"
                    min="1500"
                    max="15000"
                    step="500"
                    value={maxPrice}
                    onChange={e => setMaxPrice(Number(e.target.value))}
                    className="w-full accent-[#6F4E37] h-1.5 bg-gray-100 rounded-lg cursor-pointer"
                  />
                </div>
              </div>

              {/* Categories chips filter */}
              <div className="flex flex-wrap gap-1.5 pt-2 border-t border-gray-100">
                <button 
                  onClick={() => setSelectedCategory("all")}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                    selectedCategory === "all" 
                      ? "bg-[#6F4E37] text-white shadow-sm" 
                      : "bg-[#FFF8E7]/50 text-[#6F4E37] hover:bg-[#6F4E37]/10"
                  }`}
                >
                  Semua Kategori
                </button>
                {categories.map(cat => (
                  <button 
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.slug)}
                    className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                      selectedCategory === cat.slug 
                        ? "bg-[#6F4E37] text-white shadow-sm" 
                        : "bg-[#FFF8E7]/50 text-[#6F4E37] hover:bg-[#6F4E37]/10"
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Results Grid */}
            {processedMenus.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {processedMenus.map((menu) => (
                  <div 
                    key={menu.id}
                    className="rounded-3xl bg-white border border-[#6F4E37]/10 overflow-hidden shadow-sm flex flex-col h-full group hover:shadow-md transition-all"
                  >
                    {/* Image frame */}
                    <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
                      <img 
                        src={menu.image} 
                        alt={menu.name} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        referrerPolicy="no-referrer"
                      />
                      {/* Rating star on image */}
                      <div className="absolute top-3 left-3 bg-white/90 border px-2 py-0.5 rounded-full text-amber-500 text-[10px] font-bold flex items-center gap-0.5 shadow-sm backdrop-blur-sm">
                        <Star className="w-3.5 h-3.5 fill-current" />
                        <span className="text-gray-700 font-mono font-bold">{menu.rating.toFixed(1)}</span>
                      </div>
                      
                      {/* Stock badge */}
                      <span className={`absolute bottom-3 right-3 text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-sm backdrop-blur-sm ${
                        menu.status === "Habis" || menu.stock <= 0 
                          ? "bg-red-50 border border-red-200 text-red-600" 
                          : "bg-emerald-50 border border-emerald-200 text-emerald-600"
                      }`}>
                        {menu.status === "Habis" || menu.stock <= 0 ? "Habis" : `Stok: ${menu.stock}`}
                      </span>
                    </div>

                    {/* Content area */}
                    <div className="p-5 flex flex-col flex-grow space-y-4">
                      <div className="space-y-1 flex-grow">
                        <h3 className="font-serif font-bold text-base text-[#3E2723] line-clamp-1">{menu.name}</h3>
                        <p className="text-gray-500 text-[11px] font-light line-clamp-2 leading-relaxed">{menu.description}</p>
                      </div>

                      <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] text-gray-400 block font-light">Harga</span>
                          <span className="font-mono text-base font-bold text-[#6F4E37]">Rp {menu.price.toLocaleString()}</span>
                        </div>

                        <div className="flex gap-1.5">
                          <button 
                            onClick={() => onOpenProductDetail(menu)}
                            className="px-3 py-2 text-xs font-semibold rounded-lg bg-gray-50 border text-gray-600 hover:bg-gray-100 transition-colors"
                            title="Detail"
                          >
                            Detail
                          </button>
                          <button 
                            disabled={menu.status === "Habis" || menu.stock <= 0}
                            onClick={() => handleAddToCart(menu.id, 1)}
                            className="px-3 py-2 text-xs font-bold rounded-lg bg-[#6F4E37] text-white hover:bg-[#3E2723] disabled:bg-gray-200 disabled:text-gray-400 transition-colors cursor-pointer"
                          >
                            + Keranjang
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center bg-white border border-[#6F4E37]/10 rounded-3xl space-y-4 max-w-md mx-auto">
                <HelpCircle className="w-12 h-12 text-[#6F4E37]/30 mx-auto" />
                <h3 className="font-serif font-bold text-lg text-[#3E2723]">Menu Tidak Ditemukan</h3>
                <p className="text-gray-500 text-xs font-light leading-relaxed">Maaf, kami tidak menemukan menu yang sesuai dengan pencarian atau filter harga Anda saat ini. Silakan atur kembali kata kunci pencarian.</p>
                <button 
                  onClick={() => { setSearchQuery(""); setSelectedCategory("all"); setMaxPrice(15000); }}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-[#FFF8E7] text-[#6F4E37]"
                >
                  Reset Filter
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: ORDER HISTORY & DETAIL */}
        {activeTab === "orders" && (
          <div className="space-y-8">
            <div className="text-center max-w-xl mx-auto space-y-3">
              <h2 className="font-serif text-3xl font-bold text-[#3E2723]">Riwayat Pesanan Saya</h2>
              <p className="text-gray-500 text-xs font-light">Pantau status hidangan yang sedang dimasak dan lihat struk belanja lama Anda.</p>
            </div>

            {loadingOrders ? (
              <div className="py-12 text-center font-mono text-xs text-gray-400">Sedang memuat data pesanan...</div>
            ) : orders.length > 0 ? (
              <div className="space-y-6">
                {orders.map((order) => (
                  <div 
                    key={order.id}
                    className="p-6 rounded-3xl bg-white border border-[#6F4E37]/10 shadow-sm space-y-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-4 border-gray-100">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-[#FF9800]">
                          <Receipt className="w-5 h-5" />
                        </div>
                        <div>
                          <span className="font-mono font-bold text-sm text-[#3E2723] block">{order.id}</span>
                          <span className="text-[10px] text-gray-400 block font-light">{new Date(order.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                        </div>
                      </div>

                      {/* Status badge */}
                      <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${
                        order.status === OrderStatus.COMPLETED ? "bg-emerald-50 text-emerald-600 border border-emerald-200" :
                        order.status === OrderStatus.CANCELLED ? "bg-red-50 text-red-600 border border-red-200" :
                        "bg-orange-50 text-orange-600 border border-orange-200 animate-pulse"
                      }`}>
                        {order.status}
                      </span>
                    </div>

                    {/* Order Items list inside card */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                      {/* Left: Items list */}
                      <div className="space-y-3">
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Item Hidangan</h4>
                        <div className="divide-y divide-gray-50 space-y-2">
                          {order.items.map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between text-sm pt-2">
                              <div>
                                <span className="font-bold text-[#3E2723]">{item.name}</span>
                                <span className="text-xs text-gray-400 font-light block font-mono">Rp {item.price.toLocaleString()} x {item.quantity}</span>
                                {item.notes && <p className="text-[10px] text-amber-600 font-light italic">Catatan: "{item.notes}"</p>}
                              </div>
                              <span className="font-mono font-bold text-gray-700">Rp {(item.price * item.quantity).toLocaleString()}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Right: Checkout Summary Info */}
                      <div className="space-y-4 p-5 rounded-2xl bg-gray-50 border">
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Detail Pembayaran & Lokasi</h4>
                        <div className="space-y-2 text-xs">
                          <div className="flex justify-between">
                            <span className="text-gray-400 font-light">Penerima</span>
                            <span className="font-semibold text-gray-700">{order.userName} ({order.userPhone})</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400 font-light">Pengambilan</span>
                            <span className="font-semibold text-gray-700">{order.deliveryMethod}</span>
                          </div>
                          {order.address && (
                            <div className="flex justify-between">
                              <span className="text-gray-400 font-light">Lokasi/Keterangan</span>
                              <span className="font-semibold text-gray-700 text-right max-w-xs">{order.address}</span>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <span className="text-gray-400 font-light">Pembayaran</span>
                            <span className="font-semibold text-[#6F4E37]">{order.paymentMethod}</span>
                          </div>
                          {order.promoCode && (
                            <div className="flex justify-between text-amber-600">
                              <span className="font-light">Kupon Promo</span>
                              <span className="font-semibold font-mono">{order.promoCode} (-Rp {order.discountAmount?.toLocaleString()})</span>
                            </div>
                          )}
                          <div className="flex justify-between pt-2 border-t font-bold text-sm text-[#3E2723]">
                            <span>Total Akhir</span>
                            <span className="font-mono text-emerald-600">Rp {order.totalPrice.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center bg-white border border-[#6F4E37]/10 rounded-3xl space-y-4 max-w-md mx-auto">
                <Receipt className="w-12 h-12 text-[#6F4E37]/30 mx-auto" />
                <h3 className="font-serif font-bold text-lg text-[#3E2723]">Belum Ada Pesanan</h3>
                <p className="text-gray-500 text-xs font-light leading-relaxed">Anda belum melakukan pemesanan hidangan apa pun lewat akun ini. Mulailah memesan sate dan nasi kucing hangat sekarang.</p>
                <button 
                  onClick={() => onSetTab("menu")}
                  className="px-6 py-3 rounded-xl bg-[#6F4E37] text-white font-semibold text-xs transition-all active:scale-95"
                >
                  Pesan Menu Sekarang
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: PROFILE SETTINGS */}
        {activeTab === "profile" && (
          <div className="max-w-xl mx-auto space-y-8">
            <div className="text-center space-y-3">
              <h2 className="font-serif text-3xl font-bold text-[#3E2723]">Profil Akun Saya</h2>
              <p className="text-gray-500 text-xs font-light">Perbarui data nama, kontak nomor WhatsApp, dan kata sandi Anda dengan aman.</p>
            </div>

            <div className="p-8 rounded-3xl bg-white border border-[#6F4E37]/10 shadow-sm space-y-6">
              {/* Profile Card View */}
              {!isEditingProfile ? (
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-[#FFF8E7] border border-[#6F4E37]/20 flex items-center justify-center text-[#6F4E37]">
                      <UserIcon className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="font-serif font-bold text-xl text-[#3E2723]">{user.name}</h3>
                      <span className="text-xs text-gray-400 block font-light">{user.email}</span>
                    </div>
                  </div>

                  <div className="divide-y divide-gray-50 border-t border-b py-2 text-sm">
                    <div className="flex justify-between py-3">
                      <span className="text-gray-400 font-light">WhatsApp</span>
                      <span className="font-semibold text-gray-700">{user.phone}</span>
                    </div>
                    <div className="flex justify-between py-3">
                      <span className="text-gray-400 font-light">Status Akun</span>
                      <span className="font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100 text-xs">Aktif</span>
                    </div>
                    <div className="flex justify-between py-3">
                      <span className="text-gray-400 font-light">Bergabung Pada</span>
                      <span className="font-semibold text-gray-700">{new Date(user.createdAt).toLocaleDateString("id-ID")}</span>
                    </div>
                  </div>

                  <button 
                    onClick={() => setIsEditingProfile(true)}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-[#6F4E37] to-[#3E2723] text-white font-bold text-xs"
                  >
                    Edit Profil Akun
                  </button>
                </div>
              ) : (
                /* Profile Edit Form */
                <form onSubmit={handleProfileUpdateSubmit} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#3E2723]">Nama Lengkap</label>
                    <input 
                      type="text" 
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      className="w-full text-sm px-4 py-3 rounded-xl bg-[#FFF8E7]/30 border border-[#6F4E37]/15 focus:outline-none focus:border-[#6F4E37] transition-all text-[#3E2723]"
                      required 
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#3E2723]">Alamat Email</label>
                    <input 
                      type="email" 
                      value={editEmail}
                      onChange={e => setEditEmail(e.target.value)}
                      className="w-full text-sm px-4 py-3 rounded-xl bg-[#FFF8E7]/30 border border-[#6F4E37]/15 focus:outline-none focus:border-[#6F4E37] transition-all text-[#3E2723]"
                      required 
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#3E2723]">Nomor WhatsApp</label>
                    <input 
                      type="tel" 
                      value={editPhone}
                      onChange={e => setEditPhone(e.target.value)}
                      className="w-full text-sm px-4 py-3 rounded-xl bg-[#FFF8E7]/30 border border-[#6F4E37]/15 focus:outline-none focus:border-[#6F4E37] transition-all text-[#3E2723]"
                      required 
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#3E2723]">Kata Sandi Baru (Kosongkan jika tidak diubah)</label>
                    <input 
                      type="password" 
                      value={editPassword}
                      onChange={e => setEditPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full text-sm px-4 py-3 rounded-xl bg-[#FFF8E7]/30 border border-[#6F4E37]/15 focus:outline-none focus:border-[#6F4E37] transition-all text-[#3E2723]"
                    />
                  </div>

                  <div className="flex gap-3 pt-3">
                    <button 
                      type="button"
                      onClick={() => { setIsEditingProfile(false); setEditPassword(""); }}
                      className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-500 font-semibold text-xs hover:bg-gray-50"
                    >
                      Batal
                    </button>
                    <button 
                      type="submit"
                      className="flex-1 py-3 rounded-xl bg-[#6F4E37] text-white font-bold text-xs hover:bg-[#3E2723]"
                    >
                      Simpan Profil
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </main>

      {/* --- CART OVERLAY MODAL PANEL --- */}
      <AnimatePresence>
        {isCartOpen && (
          <div className="fixed inset-0 z-50 overflow-hidden">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCartOpen(false)}
              className="absolute inset-0 bg-black/60"
            />

            {/* Slide over */}
            <motion.div 
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "tween", duration: 0.3 }}
              className="absolute top-0 right-0 h-full max-w-md w-full bg-white shadow-2xl flex flex-col z-10"
            >
              {/* Header */}
              <div className="px-6 py-5 border-b flex items-center justify-between bg-[#FFF8E7]">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-[#6F4E37]" />
                  <h3 className="font-serif font-bold text-lg text-[#3E2723]">Keranjang Belanja</h3>
                </div>
                <button 
                  onClick={() => setIsCartOpen(false)}
                  className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Items scroll container */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {cart.length > 0 ? (
                  cart.map((item) => {
                    const m = menus.find(menu => menu.id === item.menuId);
                    if (!m) return null;

                    return (
                      <div key={item.menuId} className="flex gap-4 p-3 rounded-2xl border border-gray-100 shadow-sm bg-white relative">
                        <img 
                          src={m.image} 
                          alt={m.name} 
                          className="w-16 h-16 rounded-xl object-cover border"
                          referrerPolicy="no-referrer"
                        />
                        <div className="flex-1 space-y-1">
                          <h4 className="font-serif font-bold text-sm text-[#3E2723] line-clamp-1">{m.name}</h4>
                          <span className="font-mono text-xs text-[#6F4E37] block font-semibold">Rp {m.price.toLocaleString()}</span>
                          
                          {/* Notes input */}
                          <div className="pt-1 flex items-center gap-1">
                            <input 
                              type="text" 
                              value={item.notes}
                              onChange={e => {
                                const notesVal = e.target.value;
                                const newCart = cart.map(c => c.menuId === item.menuId ? { ...c, notes: notesVal } : c);
                                onUpdateCart(newCart);
                              }}
                              placeholder="Tambah catatan rasa (pedas, manis)..."
                              className="text-[10px] text-gray-500 bg-[#FFF8E7]/40 px-2 py-1 rounded w-full border border-gray-100 focus:outline-none focus:border-amber-400"
                            />
                          </div>

                          {/* Qty controller */}
                          <div className="flex items-center gap-2 pt-2">
                            <button 
                              onClick={() => updateCartQty(item.menuId, item.quantity - 1)}
                              className="p-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-500"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="text-xs font-mono font-bold text-gray-700 w-6 text-center">{item.quantity}</span>
                            <button 
                              onClick={() => {
                                if (item.quantity >= m.stock) {
                                  addToast(`Batas stok tercapai. Sisa stok: ${m.stock}`, "warning");
                                  return;
                                }
                                updateCartQty(item.menuId, item.quantity + 1);
                              }}
                              className="p-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-500"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </div>

                        {/* Delete button */}
                        <button 
                          onClick={() => removeCartItem(item.menuId)}
                          className="absolute top-3 right-3 text-gray-300 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })
                ) : (
                  <div className="py-16 text-center space-y-3">
                    <ShoppingCart className="w-12 h-12 text-gray-200 mx-auto" />
                    <p className="text-gray-400 text-xs font-light">Keranjang belanja Anda masih kosong.</p>
                  </div>
                )}
              </div>

              {/* Checkout area summary */}
              {cart.length > 0 && (
                <div className="p-6 border-t border-gray-100 bg-gray-50 space-y-4">
                  <div className="space-y-1.5 text-xs text-gray-500">
                    <div className="flex justify-between">
                      <span>Subtotal Belanja</span>
                      <span className="font-mono font-semibold text-gray-700">Rp {calculateSubtotal().toLocaleString()}</span>
                    </div>
                    {appliedPromo && (
                      <div className="flex justify-between text-amber-600 font-semibold">
                        <span>Potongan Kupon ({appliedPromo.code})</span>
                        <span className="font-mono">-Rp {getDiscountAmount().toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-sm text-[#3E2723] pt-2 border-t">
                      <span>Total Pembayaran</span>
                      <span className="font-mono text-emerald-600 text-base">Rp {getFinalTotal().toLocaleString()}</span>
                    </div>
                  </div>

                  <button 
                    onClick={() => { setIsCheckoutOpen(true); setIsCartOpen(false); }}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#6F4E37] to-[#3E2723] text-white font-bold text-sm hover:shadow-lg active:scale-95 transition-all text-center flex items-center justify-center gap-2 cursor-pointer"
                  >
                    Lanjut ke Checkout
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- CHECKOUT FULL MODAL PAGE --- */}
      <AnimatePresence>
        {isCheckoutOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="min-h-screen flex items-center justify-center p-4 bg-black/60 md:p-10">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="max-w-4xl w-full bg-white rounded-3xl overflow-hidden shadow-2xl border"
              >
                {/* Header */}
                <div className="px-6 py-5 border-b flex items-center justify-between bg-[#FFF8E7]">
                  <div className="flex items-center gap-2">
                    <Receipt className="w-5 h-5 text-[#6F4E37]" />
                    <h3 className="font-serif font-bold text-lg text-[#3E2723]">Formulir Checkout Hidangan</h3>
                  </div>
                  <button 
                    onClick={() => setIsCheckoutOpen(false)}
                    className="p-1 rounded-lg text-gray-400 hover:text-[#3E2723]"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleCheckoutSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8 p-8 max-h-[80vh] overflow-y-auto">
                  {/* Left: Input Form */}
                  <div className="space-y-5">
                    <h4 className="font-serif font-bold text-[#3E2723] border-b pb-2 text-base">Data Pengambilan & Pembayaran</h4>
                    
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-[#3E2723]">Nama Penerima / Pemesan</label>
                      <input 
                        type="text"
                        value={checkoutName}
                        onChange={e => setCheckoutName(e.target.value)}
                        placeholder="Contoh: Budi Santoso"
                        className="w-full text-sm px-4 py-3 rounded-xl bg-gray-50 border focus:outline-none focus:border-[#6F4E37] text-[#3E2723]"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-[#3E2723]">Nomor HP WhatsApp</label>
                      <input 
                        type="tel"
                        value={checkoutPhone}
                        onChange={e => setCheckoutPhone(e.target.value)}
                        placeholder="Contoh: 081234567890"
                        className="w-full text-sm px-4 py-3 rounded-xl bg-gray-50 border focus:outline-none focus:border-[#6F4E37] text-[#3E2723]"
                        required
                      />
                    </div>

                    {/* Delivery Method Selector */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-[#3E2723] block">Metode Pengambilan</label>
                      <div className="grid grid-cols-3 gap-2">
                        {["Makan di Tempat", "Bungkus", "Delivery"].map((method) => (
                          <button
                            key={method}
                            type="button"
                            onClick={() => {
                              setDeliveryMethod(method as any);
                              // Reset address label placeholder
                              setCheckoutAddress("");
                            }}
                            className={`py-3 text-xs font-bold rounded-xl border transition-all cursor-pointer text-center ${
                              deliveryMethod === method
                                ? "bg-[#6F4E37] text-white border-[#6F4E37] shadow-sm"
                                : "bg-white text-gray-500 border-gray-100 hover:bg-gray-50"
                            }`}
                          >
                            {method}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Dynamic Address/Table number input based on delivery method */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-[#3E2723]">
                        {deliveryMethod === "Makan di Tempat" ? "Nomor Meja Anda (Opsional)" : 
                         deliveryMethod === "Delivery" ? "Alamat Pengiriman Lengkap" : "Keterangan Bungkus (Opsional)"}
                      </label>
                      <input 
                        type="text"
                        value={checkoutAddress}
                        onChange={e => setCheckoutAddress(e.target.value)}
                        placeholder={
                          deliveryMethod === "Makan di Tempat" ? "Contoh: Meja No. 5" : 
                          deliveryMethod === "Delivery" ? "Masukkan jalan, nomor rumah, RT/RW..." : "Contoh: Dibungkus kuah dipisah"
                        }
                        className="w-full text-sm px-4 py-3 rounded-xl bg-gray-50 border focus:outline-none focus:border-[#6F4E37] text-[#3E2723]"
                        required={deliveryMethod === "Delivery"}
                      />
                    </div>

                    {/* Payment Method Selector */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-[#3E2723] block">Metode Pembayaran</label>
                      <div className="grid grid-cols-4 gap-1.5">
                        {["QRIS", "Cash", "Transfer Bank", "E-Wallet"].map((pay) => (
                          <button
                            key={pay}
                            type="button"
                            onClick={() => setPaymentMethod(pay as any)}
                            className={`py-2.5 text-[10px] font-bold rounded-lg border transition-all cursor-pointer text-center ${
                              paymentMethod === pay
                                ? "bg-[#FF9800] text-white border-[#FF9800] shadow-sm"
                                : "bg-white text-gray-500 border-gray-100 hover:bg-gray-50"
                            }`}
                          >
                            {pay}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Right: Checkout Summary */}
                  <div className="space-y-6 flex flex-col justify-between">
                    <div className="space-y-4">
                      <h4 className="font-serif font-bold text-[#3E2723] border-b pb-2 text-base">Rincian Belanja</h4>
                      
                      {/* Promo Code Input */}
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-[#3E2723]">Gunakan Kupon Promo</label>
                        <div className="flex gap-2">
                          <input 
                            type="text"
                            value={couponCode}
                            onChange={e => setCouponCode(e.target.value.toUpperCase())}
                            placeholder="Contoh: BALARAJAKENYANG"
                            className="flex-1 text-sm px-4 py-2.5 rounded-xl bg-gray-50 border focus:outline-none focus:border-[#6F4E37] font-mono text-[#3E2723]"
                          />
                          <button 
                            type="button"
                            onClick={handleApplyCoupon}
                            className="px-4 py-2.5 rounded-xl bg-[#6F4E37] text-white font-bold text-xs"
                          >
                            Gunakan
                          </button>
                        </div>
                      </div>

                      {/* Items list inside checkout */}
                      <div className="max-h-36 overflow-y-auto divide-y divide-gray-50 pr-2">
                        {cart.map((item) => {
                          const m = menus.find(menu => menu.id === item.menuId);
                          if (!m) return null;
                          return (
                            <div key={item.menuId} className="flex justify-between py-2 text-xs">
                              <div>
                                <span className="font-semibold text-gray-700">{m.name}</span>
                                <span className="text-gray-400 block font-mono">Rp {m.price.toLocaleString()} x {item.quantity}</span>
                              </div>
                              <span className="font-mono font-bold text-gray-700">Rp {(m.price * item.quantity).toLocaleString()}</span>
                            </div>
                          );
                        })}
                      </div>

                      {/* Price box summary */}
                      <div className="p-4 rounded-2xl bg-[#FFF8E7] border border-[#6F4E37]/10 space-y-2 text-xs">
                        <div className="flex justify-between text-gray-600">
                          <span>Subtotal Belanja</span>
                          <span className="font-mono font-semibold">Rp {calculateSubtotal().toLocaleString()}</span>
                        </div>
                        {appliedPromo && (
                          <div className="flex justify-between text-amber-700 font-semibold">
                            <span>Diskon Kupon ({appliedPromo.code})</span>
                            <span className="font-mono">-Rp {getDiscountAmount().toLocaleString()}</span>
                          </div>
                        )}
                        <div className="flex justify-between font-bold text-sm text-[#3E2723] pt-2 border-t border-amber-900/10">
                          <span>Total Akhir</span>
                          <span className="font-mono text-emerald-600 text-base">Rp {getFinalTotal().toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3 pt-4 border-t">
                      {paymentMethod === "QRIS" && (
                        <div className="p-3 bg-white border border-dashed border-[#6F4E37]/20 rounded-xl flex flex-col items-center gap-2">
                          {/* Simulated QR Code for cool factor */}
                          <div className="w-24 h-24 bg-gray-50 border p-2 rounded-lg flex items-center justify-center relative">
                            {/* Simple dynamic QR layout with CSS */}
                            <div className="grid grid-cols-4 gap-1 w-full h-full opacity-70">
                              {Array.from({ length: 16 }).map((_, i) => (
                                <div key={i} className={`rounded-sm ${i % 3 === 0 || i % 5 === 0 ? "bg-black" : "bg-transparent"}`} />
                              ))}
                            </div>
                            <span className="absolute inset-0 flex items-center justify-center font-mono text-[8px] font-bold bg-white/95 px-1 rounded border shadow text-center text-emerald-600">
                              QRIS DISETUJUI
                            </span>
                          </div>
                          <span className="text-[9px] text-gray-400 font-light text-center">Scan QRIS di atas & masukkan nominal yang sesuai.</span>
                        </div>
                      )}

                      <div className="flex gap-3">
                        <button 
                          type="button"
                          onClick={() => setIsCheckoutOpen(false)}
                          className="flex-1 py-3 rounded-xl border font-semibold text-xs text-gray-500 hover:bg-gray-50"
                        >
                          Kembali
                        </button>
                        <button 
                          type="submit"
                          className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#FF9800] to-amber-500 text-white font-bold text-xs shadow-md shadow-orange-500/10 active:scale-95 transition-all text-center"
                        >
                          Konfirmasi & Bayar
                        </button>
                      </div>
                    </div>
                  </div>
                </form>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
