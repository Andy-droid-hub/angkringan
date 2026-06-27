import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  BarChart3, Plus, Edit, Trash2, Check, X, ShieldAlert, Users, 
  ShoppingBag, ClipboardList, Settings, Ticket, Star, FileSpreadsheet, 
  LogOut, ArrowUpRight, ArrowDownRight, Package, Grid, CheckCircle, 
  Search, Printer, AlertCircle, RefreshCw, Upload, Image as ImageIcon,
  Menu as MenuIcon
} from "lucide-react";
import { 
  User, Menu, Category, Order, OrderStatus, Promotion, Testimonial, 
  AppSettings, ActivityLog, UserRole 
} from "../types";

interface AdminPanelProps {
  settings: AppSettings;
  menus: Menu[];
  categories: Category[];
  orders: Order[];
  promotions: Promotion[];
  testimonials: Testimonial[];
  user: User | null;
  token: string | null;
  onLogout: () => void;
  onRefreshData: () => void;
  addToast: (msg: string, type: "success" | "error" | "warning" | "info") => void;
  onSetAppSettings: (settings: AppSettings) => void;
}

interface AdminStats {
  customersCount: number;
  totalOrdersCount: number;
  revenueToday: number;
  revenueMonth: number;
  bestSellers: { name: string; sales: number; revenue: number }[];
  recentLogs: ActivityLog[];
  salesTrend: { date: string; label: string; revenue: number; orders: number }[];
}

export default function AdminPanel({
  settings,
  menus,
  categories,
  orders,
  promotions,
  testimonials,
  user,
  token,
  onLogout,
  onRefreshData,
  addToast,
  onSetAppSettings
}: AdminPanelProps) {
  // Navigation
  const [activeMenu, setActiveMenu] = useState<
    "dashboard" | "menus" | "categories" | "orders" | "customers" | "promos" | "testimonials" | "reports" | "settings"
  >("dashboard");
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  // Stats State
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);

  // Search/Filters inside tabs
  const [menuSearch, setMenuSearch] = useState("");
  const [orderFilter, setOrderFilter] = useState<"all" | OrderStatus>("all");
  const [reportFilter, setReportFilter] = useState<"hari" | "minggu" | "bulan" | "tahun">("hari");

  // CRUD MODALS / FORMS STATES
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"menu" | "category" | "promo" | "testimonial" | "orderDetail">("menu");
  const [editId, setEditId] = useState<string | null>(null);

  // Active Selected Order for Detailed Invoice View / Print
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // --- FORM STATES ---
  // Menu Form
  const [formMenuName, setFormMenuName] = useState("");
  const [formMenuDesc, setFormMenuDesc] = useState("");
  const [formMenuPrice, setFormMenuPrice] = useState(0);
  const [formMenuImage, setFormMenuImage] = useState("");
  const [formMenuStock, setFormMenuStock] = useState(0);
  const [formMenuCategory, setFormMenuCategory] = useState("");
  const [formMenuStatus, setFormMenuStatus] = useState<"Tersedia" | "Habis">("Tersedia");
  const [formMenuBest, setFormMenuBest] = useState(false);
  const [formMenuComposition, setFormMenuComposition] = useState("");

  // Category Form
  const [formCatName, setFormCatName] = useState("");
  const [formCatSlug, setFormCatSlug] = useState("");
  const [formCatDesc, setFormCatDesc] = useState("");

  // Promo Form
  const [formPromoCode, setFormPromoCode] = useState("");
  const [formPromoName, setFormPromoName] = useState("");
  const [formPromoType, setFormPromoType] = useState<"percentage" | "fixed">("percentage");
  const [formPromoValue, setFormPromoValue] = useState(0);
  const [formPromoMin, setFormPromoMin] = useState(0);
  const [formPromoDesc, setFormPromoDesc] = useState("");
  const [formPromoActive, setFormPromoActive] = useState(true);
  const [formPromoExpiry, setFormPromoExpiry] = useState("");

  // Settings Fields Form
  const [settBusinessName, setSettBusinessName] = useState("");
  const [settAddress, setSettAddress] = useState("");
  const [settWhatsapp, setSettWhatsapp] = useState("");
  const [settEmail, setSettEmail] = useState("");
  const [settInstagram, setSettInstagram] = useState("");
  const [settFacebook, setSettFacebook] = useState("");
  const [settHours, setSettHours] = useState("");
  const [settGmaps, setSettGmaps] = useState("");

  // Load Admin stats on Mount / refresh
  const fetchStats = async () => {
    if (!token) return;
    setLoadingStats(true);
    try {
      const res = await fetch("/api/admin/stats", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setStats(data);
      }
    } catch (err) {
      console.error("Gagal memuat statistik admin:", err);
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchStats();
    }
  }, [token, orders, menus, promotions, testimonials, activeMenu]);

  // Load Settings Fields on select Settings Tab
  useEffect(() => {
    if (activeMenu === "settings") {
      setSettBusinessName(settings.businessName);
      setSettAddress(settings.address);
      setSettWhatsapp(settings.whatsapp);
      setSettEmail(settings.email);
      setSettInstagram(settings.instagram);
      setSettFacebook(settings.facebook);
      setSettHours(settings.openingHours);
      setSettGmaps(settings.gmapsEmbedUrl);
    }
  }, [activeMenu, settings]);

  // Handle Base64 Local Image Upload Conversion
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      addToast("Batas ukuran foto adalah 2MB.", "warning");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setFormMenuImage(base64String);
      addToast("Foto berhasil dimuat secara lokal!", "success");
    };
    reader.readAsDataURL(file);
  };

  // --- CRUD SUBMISSIONS ---
  // Category Submit
  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCatName || !formCatSlug) {
      addToast("Nama Kategori dan Slug wajib diisi.", "warning");
      return;
    }
    try {
      const url = editId ? `/api/categories/${editId}` : "/api/categories";
      const method = editId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ name: formCatName, slug: formCatSlug, description: formCatDesc })
      });
      const data = await res.json();
      if (res.ok) {
        addToast(data.message, "success");
        setIsModalOpen(false);
        setEditId(null);
        onRefreshData();
      } else {
        addToast(data.message || "Gagal menyimpan kategori.", "error");
      }
    } catch (err) {
      addToast("Koneksi gagal.", "error");
    }
  };

  const handleEditCategory = (cat: Category) => {
    setEditId(cat.id);
    setFormCatName(cat.name);
    setFormCatSlug(cat.slug);
    setFormCatDesc(cat.description || "");
    setModalType("category");
    setIsModalOpen(true);
  };

  const handleDeleteCategory = async (catId: string) => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus kategori ini? Seluruh menu berkategori ini mungkin terpengaruh.")) return;
    try {
      const res = await fetch(`/api/categories/${catId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        addToast(data.message, "success");
        onRefreshData();
      } else {
        addToast(data.message, "error");
      }
    } catch (err) {
      addToast("Gagal menghapus kategori.", "error");
    }
  };

  // Menu Submit
  const handleMenuSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formMenuName || !formMenuPrice || !formMenuCategory) {
      addToast("Nama menu, harga, dan kategori wajib dipilih.", "warning");
      return;
    }

    try {
      const url = editId ? `/api/menus/${editId}` : "/api/menus";
      const method = editId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: formMenuName,
          description: formMenuDesc,
          price: formMenuPrice,
          image: formMenuImage,
          stock: formMenuStock,
          category: formMenuCategory,
          status: formMenuStatus,
          isBestSeller: formMenuBest,
          composition: formMenuComposition
        })
      });
      const data = await res.json();
      if (res.ok) {
        addToast(data.message, "success");
        setIsModalOpen(false);
        setEditId(null);
        onRefreshData();
      } else {
        addToast(data.message || "Gagal menyimpan menu.", "error");
      }
    } catch (err) {
      addToast("Terjadi kesalahan koneksi.", "error");
    }
  };

  const handleEditMenu = (menu: Menu) => {
    setEditId(menu.id);
    setFormMenuName(menu.name);
    setFormMenuDesc(menu.description);
    setFormMenuPrice(menu.price);
    setFormMenuImage(menu.image);
    setFormMenuStock(menu.stock);
    setFormMenuCategory(menu.category);
    setFormMenuStatus(menu.status);
    setFormMenuBest(!!menu.isBestSeller);
    setFormMenuComposition(menu.composition || "");
    setModalType("menu");
    setIsModalOpen(true);
  };

  const handleDeleteMenu = async (menuId: string) => {
    if (!window.confirm("Hapus menu hidangan ini?")) return;
    try {
      const res = await fetch(`/api/menus/${menuId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        addToast(data.message, "success");
        onRefreshData();
      } else {
        addToast(data.message, "error");
      }
    } catch (err) {
      addToast("Gagal menghapus menu.", "error");
    }
  };

  // Promotion Submit
  const handlePromoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formPromoCode || !formPromoName || !formPromoValue) {
      addToast("Kode, Nama, dan Nilai Diskon wajib diisi.", "warning");
      return;
    }
    try {
      const url = editId ? `/api/promotions/${editId}` : "/api/promotions";
      const method = editId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          code: formPromoCode,
          name: formPromoName,
          discountType: formPromoType,
          discountValue: formPromoValue,
          minTransaction: formPromoMin,
          description: formPromoDesc,
          isActive: formPromoActive,
          expiryDate: formPromoExpiry
        })
      });
      const data = await res.json();
      if (res.ok) {
        addToast(data.message, "success");
        setIsModalOpen(false);
        setEditId(null);
        onRefreshData();
      } else {
        addToast(data.message || "Gagal menyimpan promo.", "error");
      }
    } catch (err) {
      addToast("Koneksi gagal.", "error");
    }
  };

  const handleEditPromo = (promo: Promotion) => {
    setEditId(promo.id);
    setFormPromoCode(promo.code);
    setFormPromoName(promo.name);
    setFormPromoType(promo.discountType);
    setFormPromoValue(promo.discountValue);
    setFormPromoMin(promo.minTransaction);
    setFormPromoDesc(promo.description);
    setFormPromoActive(promo.isActive);
    setFormPromoExpiry(promo.expiryDate.split("T")[0]); // YYYY-MM-DD format
    setModalType("promo");
    setIsModalOpen(true);
  };

  const handleDeletePromo = async (id: string) => {
    if (!window.confirm("Hapus promo diskon ini?")) return;
    try {
      const res = await fetch(`/api/promotions/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        addToast(data.message, "success");
        onRefreshData();
      } else {
        addToast(data.message, "error");
      }
    } catch (err) {
      addToast("Gagal menghapus kupon.", "error");
    }
  };

  // Testimonial Delete
  const handleDeleteTestimonial = async (id: string) => {
    if (!window.confirm("Sembunyikan / Hapus testimonial dari beranda?")) return;
    try {
      const res = await fetch(`/api/testimonials/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        addToast(data.message, "success");
        onRefreshData();
      } else {
        addToast(data.message, "error");
      }
    } catch (err) {
      addToast("Gagal menghapus.", "error");
    }
  };

  // Order Status Change by Admin
  const handleUpdateOrderStatus = async (orderId: string, nextStatus: OrderStatus) => {
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: nextStatus })
      });
      const data = await res.json();
      if (res.ok) {
        addToast(data.message, "success");
        onRefreshData();
        // Update local open invoice view if matching
        if (selectedOrder && selectedOrder.id === orderId) {
          setSelectedOrder({ ...selectedOrder, status: nextStatus, updatedAt: new Date().toISOString() });
        }
      } else {
        addToast(data.message, "error");
      }
    } catch (err) {
      addToast("Gagal memperbarui status.", "error");
    }
  };

  // Settings Save
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          businessName: settBusinessName,
          address: settAddress,
          whatsapp: settWhatsapp,
          email: settEmail,
          instagram: settInstagram,
          facebook: settFacebook,
          openingHours: settHours,
          gmapsEmbedUrl: settGmaps
        })
      });
      const data = await res.json();
      if (res.ok) {
        onSetAppSettings(data.settings);
        addToast(data.message, "success");
      } else {
        addToast(data.message, "error");
      }
    } catch (err) {
      addToast("Gagal menyimpan konfigurasi.", "error");
    }
  };

  // --- REPORT GENERATION HELPERS ---
  const getFilteredReportOrders = () => {
    const today = new Date().toISOString().slice(0, 10);
    const successOrders = orders.filter((o) => o.status !== OrderStatus.CANCELLED);

    if (reportFilter === "hari") {
      return successOrders.filter((o) => o.createdAt.startsWith(today));
    } else if (reportFilter === "minggu") {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      return successOrders.filter((o) => new Date(o.createdAt) >= sevenDaysAgo);
    } else if (reportFilter === "bulan") {
      const currentMonth = new Date().toISOString().slice(0, 7);
      return successOrders.filter((o) => o.createdAt.startsWith(currentMonth));
    } else {
      const currentYear = new Date().getFullYear().toString();
      return successOrders.filter((o) => o.createdAt.startsWith(currentYear));
    }
  };

  // Print Report Handler
  const handlePrintReport = () => {
    window.print();
  };

  // Filter Orders for table
  const filteredOrdersTable = orderFilter === "all" 
    ? orders 
    : orders.filter((o) => o.status === orderFilter);

  // Filter Menus for list
  const filteredMenusTable = menus.filter((m) =>
    m.name.toLowerCase().includes(menuSearch.toLowerCase()) ||
    m.category.toLowerCase().includes(menuSearch.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#FFF8E7] flex flex-col md:flex-row antialiased relative">
      {/* Mobile Top Navbar with Hamburger Menu */}
      <div className="md:hidden bg-[#3E2723] text-[#FFF8E7] px-6 py-4 flex items-center justify-between border-b border-amber-950/20 sticky top-0 z-[100] shadow-sm">
        <div>
          <h2 className="font-sans font-extrabold text-white text-base leading-tight">{settings.businessName}</h2>
          <span className="text-[9px] text-amber-300 font-mono tracking-wider uppercase block opacity-80">Panel Admin</span>
        </div>
        <button 
          onClick={() => setIsMobileNavOpen(!isMobileNavOpen)}
          className="p-2 -mr-2 text-amber-100 hover:text-white transition-colors focus:outline-none cursor-pointer"
        >
          {isMobileNavOpen ? <X className="w-6 h-6" /> : <MenuIcon className="w-6 h-6" />}
        </button>
      </div>

      {/* SIDEBAR NAVIGATION PANEL */}
      <aside className={`
        fixed inset-y-0 left-0 z-[110] w-64 bg-[#3E2723] text-[#FFF8E7] border-r border-amber-950/20 p-6 flex flex-col justify-between transition-transform duration-300 ease-in-out md:static md:translate-x-0 shrink-0
        ${isMobileNavOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
      `}>
        <div className="space-y-8">
          {/* Admin profile / Brand (hidden on mobile header) */}
          <div className="hidden md:flex items-center border-b border-white/10 pb-6">
            <div className="select-none">
              <h2 className="font-sans font-extrabold text-[#FFF8E7] text-lg leading-tight tracking-normal">{settings.businessName}</h2>
              <span className="text-[10px] text-amber-300 font-mono tracking-widest uppercase mt-2 block opacity-80 font-medium">Panel Administrasi</span>
            </div>
          </div>

          {/* Nav menu links */}
          <nav className="space-y-1.5">
            {[
              { id: "dashboard", label: "Dashboard Ringkasan", icon: <BarChart3 className="w-4.5 h-4.5" /> },
              { id: "menus", label: "Kelola Menu", icon: <Package className="w-4.5 h-4.5" /> },
              { id: "categories", label: "Kelola Kategori", icon: <Grid className="w-4.5 h-4.5" /> },
              { id: "orders", label: "Daftar Pesanan", icon: <ClipboardList className="w-4.5 h-4.5" /> },
              { id: "customers", label: "Database Pelanggan", icon: <Users className="w-4.5 h-4.5" /> },
              { id: "promos", label: "Kupon Promo", icon: <Ticket className="w-4.5 h-4.5" /> },
              { id: "testimonials", label: "Testimoni", icon: <Star className="w-4.5 h-4.5" /> },
              { id: "reports", label: "Laporan & Log", icon: <FileSpreadsheet className="w-4.5 h-4.5" /> },
              { id: "settings", label: "Pengaturan Toko", icon: <Settings className="w-4.5 h-4.5" /> }
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveMenu(item.id as any);
                  setSelectedOrder(null);
                  setIsMobileNavOpen(false); // Close drawer on menu click
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 text-xs font-semibold rounded-xl transition-all text-left cursor-pointer ${
                  activeMenu === item.id 
                    ? "bg-[#6F4E37] text-white shadow-md shadow-amber-950/45" 
                    : "text-amber-100/70 hover:bg-white/5 hover:text-white"
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Footer logout button */}
        <div className="pt-6 border-t border-white/10 mt-8 space-y-4">
          <div className="text-[10px] text-amber-100/50 font-mono">
            <span>Staf: {user?.name || "Admin"}</span>
          </div>
          <button 
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-red-600/10 hover:bg-red-600 text-red-400 hover:text-white text-xs font-bold transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout Sesi</span>
          </button>
        </div>
      </aside>

      {/* Backdrop overlay for mobile menu drawer */}
      {isMobileNavOpen && (
        <div 
          onClick={() => setIsMobileNavOpen(false)}
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[105] md:hidden"
        />
      )}

      {/* MAIN CONTAINER CONTENT */}
      <main className="flex-grow p-6 md:p-10 space-y-8 min-w-0 overflow-y-auto print:bg-white print:p-0">
        
        {/* TAB 1: DASHBOARD RINGKASAN */}
        {activeMenu === "dashboard" && (
          <div className="space-y-8 print:hidden">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="space-y-1">
                <h1 className="font-serif text-3xl font-bold text-[#3E2723]">Ringkasan Toko Hari Ini</h1>
                <p className="text-gray-500 text-xs font-light">Analisis arus transaksi, performa sate terlaris, dan log aktivitas operasional secara komprehensif.</p>
              </div>
              <button 
                onClick={fetchStats}
                disabled={loadingStats}
                className="px-4 py-2 text-xs font-semibold bg-[#6F4E37] hover:bg-[#3E2723] text-white rounded-xl shadow-sm transition-all flex items-center gap-1.5"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingStats ? "animate-spin" : ""}`} />
                Segarkan Data
              </button>
            </div>

            {/* Metrics Grid */}
            {stats ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { label: "Pendapatan Hari Ini", val: `Rp ${stats.revenueToday.toLocaleString()}`, change: "+12.4%", changeType: "up", desc: "Order lunas hari ini", color: "border-orange-200 bg-orange-50/40 text-orange-600" },
                  { label: "Pendapatan Bulan Ini", val: `Rp ${stats.revenueMonth.toLocaleString()}`, change: "+8.2%", changeType: "up", desc: "Dari 1 Juni 2026", color: "border-emerald-200 bg-emerald-50/40 text-emerald-600" },
                  { label: "Total Pesanan", val: `${stats.totalOrdersCount} Order`, change: "+15.6%", changeType: "up", desc: "Semua status invoice", color: "border-blue-200 bg-blue-50/40 text-blue-600" },
                  { label: "Pelanggan Setia", val: `${stats.customersCount} Jiwa`, change: "+4.1%", changeType: "up", desc: "Terdaftar di sistem", color: "border-amber-200 bg-amber-50/40 text-[#6F4E37]" }
                ].map((metric, idx) => (
                  <div key={idx} className="p-6 bg-[#FAF3E0] shadow-sm rounded-3xl flex flex-col justify-between hover:bg-[#F5ECD2] transition-all duration-200">
                    <div className="space-y-1">
                      <span className="text-xs text-gray-400 block font-light">{metric.label}</span>
                      <h3 className="font-mono text-2xl font-bold text-[#3E2723] tracking-tight">{metric.val}</h3>
                    </div>
                    <div className="flex items-center gap-2 pt-4 border-t border-amber-950/10 mt-4">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${metric.color}`}>
                        {metric.change}
                      </span>
                      <span className="text-[10px] text-gray-400 font-light">{metric.desc}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-gray-400 font-mono text-xs">Sedang menyiapkan ringkasan statistik...</div>
            )}

            {/* Chart and Best Sellers Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Custom SVG/CSS Bar Chart (Weekly) */}
              <div className="lg:col-span-2 p-6 bg-[#FAF3E0] shadow-sm rounded-3xl flex flex-col justify-between">
                <div className="space-y-1 border-b pb-4">
                  <h3 className="font-serif font-bold text-lg text-[#3E2723]">Grafik Penjualan 7 Hari Terakhir</h3>
                  <p className="text-gray-400 text-xs font-light">Tren harian omzet rupiah (Khusus pesanan berhasil).</p>
                </div>

                {stats && stats.salesTrend ? (
                  <div className="pt-6">
                    <div className="flex items-end justify-between h-48 gap-3 px-2">
                      {stats.salesTrend.map((day, idx) => {
                        const maxTrendRevenue = Math.max(...stats.salesTrend.map(d => d.revenue)) || 50000;
                        const pctHeight = `${(day.revenue / maxTrendRevenue) * 100}%`;

                        return (
                          <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group relative">
                            {/* Hover tooltip */}
                            <span className="absolute bottom-full mb-1 opacity-0 group-hover:opacity-100 transition-opacity bg-[#3E2723] text-white text-[9px] font-mono p-1.5 rounded-lg shadow border border-amber-300/10 pointer-events-none text-center">
                              Rp {day.revenue.toLocaleString()}<br />
                              <span className="text-amber-300 font-bold">{day.orders} Pesanan</span>
                            </span>

                            {/* Bar stick */}
                            <div 
                              className="w-full bg-gradient-to-t from-[#6F4E37] to-[#FF9800] rounded-t-lg transition-all duration-700 min-h-[4px]"
                              style={{ height: pctHeight }}
                            />
                            
                            {/* Day label */}
                            <span className="text-[10px] font-bold text-[#3E2723] font-mono tracking-tight shrink-0">{day.label}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="h-48 flex items-center justify-center text-gray-400 text-xs">Menyiapkan diagram batang...</div>
                )}
              </div>

              {/* Best selling list */}
              <div className="p-6 bg-[#FAF3E0] shadow-sm rounded-3xl flex flex-col justify-between">
                <div className="space-y-1 border-b border-amber-950/10 pb-4">
                  <h3 className="font-serif font-bold text-lg text-[#3E2723]">5 Menu Terlaris</h3>
                  <p className="text-gray-400 text-xs font-light">Paling banyak dipesan pelanggan setia.</p>
                </div>

                {stats && stats.bestSellers.length > 0 ? (
                  <div className="divide-y divide-amber-950/5 flex-grow pt-2">
                    {stats.bestSellers.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between py-3 text-xs">
                        <div className="space-y-0.5">
                          <span className="font-bold text-[#3E2723] block">{item.name}</span>
                          <span className="text-gray-400 font-mono text-[10px] block">{item.sales} Tusuk/Porsi Terjual</span>
                        </div>
                        <span className="font-mono font-bold text-emerald-600">Rp {item.revenue.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-12 text-center text-gray-400 text-xs">Belum ada sate terlaris terdata.</div>
                )}
              </div>
            </div>

            {/* Recent Staf Activity Logs */}
            <div className="p-6 bg-[#FAF3E0] shadow-sm rounded-3xl">
              <div className="space-y-1 border-b border-amber-950/10 pb-4 mb-4">
                <h3 className="font-serif font-bold text-lg text-[#3E2723]">Log Aktivitas Operasional</h3>
                <p className="text-gray-400 text-xs font-light font-mono">Riwayat login, input menu baru, dan pembuatan transaksi.</p>
              </div>

              {stats && stats.recentLogs.length > 0 ? (
                <div className="space-y-3 font-mono text-xs max-h-60 overflow-y-auto pr-2">
                  {stats.recentLogs.map((log) => (
                    <div key={log.id} className="flex items-start justify-between gap-4 py-2 border-b border-gray-50">
                      <div className="space-y-0.5">
                        <span className="font-bold text-gray-600 block">[{log.action}] {log.details}</span>
                        <span className="text-[10px] text-gray-400 block font-light">Oleh: {log.userName}</span>
                      </div>
                      <span className="text-[10px] text-gray-400 shrink-0">{new Date(log.timestamp).toLocaleTimeString("id-ID")}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center text-gray-400 text-xs">Log aktivitas operasional kosong.</div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: KELOLA MENU HIDANGAN */}
        {activeMenu === "menus" && (
          <div className="space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-6">
              <div className="space-y-1">
                <h1 className="font-serif text-3xl font-bold text-[#3E2723]">Kelola Menu Hidangan</h1>
                <p className="text-gray-500 text-xs font-light">Tambah, perbarui harga, pasang rating, oles bumbu bakar, dan atur stok hidangan harian.</p>
              </div>
              <button 
                onClick={() => {
                  setEditId(null);
                  setFormMenuName("");
                  setFormMenuDesc("");
                  setFormMenuPrice(0);
                  setFormMenuImage("");
                  setFormMenuStock(0);
                  setFormMenuCategory(categories[0]?.slug || "");
                  setFormMenuStatus("Tersedia");
                  setFormMenuBest(false);
                  setFormMenuComposition("");
                  setModalType("menu");
                  setIsModalOpen(true);
                }}
                className="px-5 py-3 text-xs font-bold bg-[#6F4E37] hover:bg-[#3E2723] text-white rounded-xl shadow-md shadow-amber-950/20 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Tambah Menu Baru
              </button>
            </div>

            {/* Filter Search Input */}
            <div className="relative max-w-sm">
              <Search className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input 
                type="text"
                value={menuSearch}
                onChange={e => setMenuSearch(e.target.value)}
                placeholder="Cari nama menu hidangan..."
                className="w-full text-xs pl-11 pr-4 py-3 rounded-xl bg-[#FAF3E0] shadow-sm focus:outline-none focus:bg-[#FAF3E0]/80"
              />
            </div>

            {/* Menu List Table */}
            <div className="bg-[#FAF3E0] rounded-3xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-[#3E2723]">
                  <thead className="bg-[#FFF8E7] text-gray-500 uppercase tracking-wider font-mono text-[10px] border-b">
                    <tr>
                      <th className="p-4 pl-6">Hidangan</th>
                      <th className="p-4">Kategori</th>
                      <th className="p-4">Harga</th>
                      <th className="p-4 text-center">Stok</th>
                      <th className="p-4 text-center">Status</th>
                      <th className="p-4 text-right pr-6">Kelola</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-medium">
                    {filteredMenusTable.map((menu) => (
                      <tr key={menu.id} className="hover:bg-gray-50/40">
                        <td className="p-4 pl-6 flex items-center gap-3">
                          <img 
                            src={menu.image} 
                            alt={menu.name} 
                            className="w-10 h-10 rounded-xl object-cover border"
                            referrerPolicy="no-referrer"
                          />
                          <div>
                            <span className="font-bold text-[#3E2723] block text-sm">{menu.name}</span>
                            {menu.isBestSeller && <span className="bg-amber-400 text-[#3E2723] text-[9px] px-2 py-0.5 rounded-full font-bold">Best Seller</span>}
                          </div>
                        </td>
                        <td className="p-4 text-gray-500 uppercase text-[10px] font-mono">
                          {categories.find(c => c.slug === menu.category)?.name || menu.category}
                        </td>
                        <td className="p-4 font-mono font-bold text-[#6F4E37]">Rp {menu.price.toLocaleString()}</td>
                        <td className="p-4 text-center font-mono">{menu.stock}</td>
                        <td className="p-4 text-center">
                          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                            menu.status === "Tersedia" && menu.stock > 0 
                              ? "bg-emerald-50 text-emerald-600 border border-emerald-100" 
                              : "bg-red-50 text-red-600 border border-red-100"
                          }`}>
                            {menu.status === "Tersedia" && menu.stock > 0 ? "Tersedia" : "Habis"}
                          </span>
                        </td>
                        <td className="p-4 text-right pr-6 whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button 
                              onClick={() => handleEditMenu(menu)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleDeleteMenu(menu.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: KELOLA KATEGORI */}
        {activeMenu === "categories" && (
          <div className="space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-6">
              <div className="space-y-1">
                <h1 className="font-serif text-3xl font-bold text-[#3E2723]">Kelola Kategori Hidangan</h1>
                <p className="text-gray-500 text-xs font-light">Atur wadah menu (Nasi, Sate, Gorengan, Wedang) demi navigasi penjelajahan pelanggan.</p>
              </div>
              <button 
                onClick={() => {
                  setEditId(null);
                  setFormCatName("");
                  setFormCatSlug("");
                  setFormCatDesc("");
                  setModalType("category");
                  setIsModalOpen(true);
                }}
                className="px-5 py-3 text-xs font-bold bg-[#6F4E37] hover:bg-[#3E2723] text-white rounded-xl shadow-md active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Tambah Kategori
              </button>
            </div>

            {/* Categories Table */}
            <div className="bg-[#FAF3E0] rounded-3xl overflow-hidden shadow-sm max-w-4xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-[#3E2723]">
                  <thead className="bg-[#FFF8E7] text-gray-500 uppercase tracking-wider font-mono text-[10px] border-b">
                    <tr>
                      <th className="p-4 pl-6">Nama Kategori</th>
                      <th className="p-4">Slug Kategori</th>
                      <th className="p-4">Deskripsi Ringkas</th>
                      <th className="p-4 text-right pr-6">Kelola</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-medium">
                    {categories.map((cat) => (
                      <tr key={cat.id} className="hover:bg-gray-50/40">
                        <td className="p-4 pl-6 font-bold text-sm text-[#3E2723]">{cat.name}</td>
                        <td className="p-4 font-mono text-[10px] text-gray-400 uppercase">{cat.slug}</td>
                        <td className="p-4 text-gray-500 font-light max-w-xs truncate">{cat.description || "Tidak ada deskripsi"}</td>
                        <td className="p-4 text-right pr-6 whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button 
                              onClick={() => handleEditCategory(cat)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleDeleteCategory(cat.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: DAFTAR PESANAN & UPDATE STATUS */}
        {activeMenu === "orders" && (
          <div className="space-y-8 print:hidden">
            <div className="border-b pb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="space-y-1">
                <h1 className="font-serif text-3xl font-bold text-[#3E2723]">Kelola Pesanan Pelanggan</h1>
                <p className="text-gray-500 text-xs font-light">Proses pesanan baru, batalkan, cetak struk invoice belanja, dan pantau status memasak.</p>
              </div>

              {/* Status Chips Filter */}
              <div className="flex flex-wrap gap-1 bg-[#FAF3E0] p-1 rounded-xl shadow-sm">
                {[
                  { id: "all", label: "Semua" },
                  { id: OrderStatus.PENDING, label: "Diterima" },
                  { id: OrderStatus.PROCESSING, label: "Diproses" },
                  { id: OrderStatus.COOKING, label: "Dimasak" },
                  { id: OrderStatus.READY, label: "Siap Ambil" },
                  { id: OrderStatus.COMPLETED, label: "Selesai" },
                  { id: OrderStatus.CANCELLED, label: "Batal" }
                ].map((chip) => (
                  <button
                    key={chip.id}
                    onClick={() => setOrderFilter(chip.id as any)}
                    className={`px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                      orderFilter === chip.id 
                        ? "bg-[#6F4E37] text-white" 
                        : "text-gray-500 hover:bg-gray-100"
                    }`}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Orders List Table */}
            {filteredOrdersTable.length > 0 ? (
              <div className="bg-[#FAF3E0] rounded-3xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-[#3E2723]">
                    <thead className="bg-[#FFF8E7] text-gray-500 uppercase tracking-wider font-mono text-[10px] border-b">
                      <tr>
                        <th className="p-4 pl-6">Invoice</th>
                        <th className="p-4">Pemesan</th>
                        <th className="p-4">Tanggal</th>
                        <th className="p-4 text-center">Metode</th>
                        <th className="p-4">Total</th>
                        <th className="p-4">Status</th>
                        <th className="p-4 text-right pr-6">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 font-medium">
                      {filteredOrdersTable.map((order) => (
                        <tr key={order.id} className="hover:bg-gray-50/40">
                          <td className="p-4 pl-6 font-mono font-bold text-gray-700">{order.id}</td>
                          <td className="p-4">
                            <span className="font-bold text-[#3E2723] block">{order.userName}</span>
                            <span className="text-[10px] text-gray-400 font-light block">{order.userPhone}</span>
                          </td>
                          <td className="p-4 text-gray-400 font-light text-[10px]">
                            {new Date(order.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                          </td>
                          <td className="p-4 text-center">
                            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap inline-flex items-center gap-1 ${
                              order.deliveryMethod === "Makan di Tempat" ? "bg-amber-100 text-amber-800" :
                              order.deliveryMethod === "Bungkus" ? "bg-orange-100 text-orange-800" :
                              order.deliveryMethod === "Delivery" ? "bg-sky-100 text-sky-800" :
                              "bg-gray-100 text-gray-800"
                            }`}>
                              {order.deliveryMethod === "Makan di Tempat" && "🍽️ "}
                              {order.deliveryMethod === "Bungkus" && "🛍️ "}
                              {order.deliveryMethod === "Delivery" && "🛵 "}
                              {order.deliveryMethod}
                            </span>
                          </td>
                          <td className="p-4 font-mono font-bold text-emerald-600">Rp {order.totalPrice.toLocaleString()}</td>
                          <td className="p-4">
                            <select
                              value={order.status}
                              onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value as OrderStatus)}
                              className={`text-[11px] font-bold px-2 py-1.5 rounded-xl border focus:outline-none cursor-pointer font-sans transition-all shadow-sm ${
                                order.status === OrderStatus.COMPLETED ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                                order.status === OrderStatus.CANCELLED ? "bg-red-50 text-red-700 border-red-200" :
                                order.status === OrderStatus.READY ? "bg-blue-50 text-blue-700 border-blue-200" :
                                order.status === OrderStatus.COOKING ? "bg-amber-50 text-amber-700 border-amber-200" :
                                "bg-orange-50 text-orange-700 border-orange-200"
                              }`}
                            >
                              <option value={OrderStatus.PENDING} className="bg-white text-gray-800">📥 Diterima</option>
                              <option value={OrderStatus.PROCESSING} className="bg-white text-gray-800">⚙️ Diproses</option>
                              <option value={OrderStatus.COOKING} className="bg-white text-gray-800">🍳 Dimasak</option>
                              <option value={OrderStatus.READY} className="bg-white text-gray-800">✅ Siap Ambil</option>
                              <option value={OrderStatus.COMPLETED} className="bg-white text-gray-800">🎉 Selesai</option>
                              <option value={OrderStatus.CANCELLED} className="bg-white text-gray-800">❌ Batal</option>
                            </select>
                          </td>
                          <td className="p-4 text-right pr-6 whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Detailed Invoice modal print option */}
                              <button 
                                onClick={() => setSelectedOrder(order)}
                                className="p-2 hover:bg-gray-50 border rounded-lg text-gray-500 hover:text-[#3E2723] cursor-pointer"
                                title="Cetak Invoice"
                              >
                                <Printer className="w-4 h-4" />
                              </button>

                              {/* Cancel button */}
                              {order.status !== OrderStatus.COMPLETED && order.status !== OrderStatus.CANCELLED && (
                                <button 
                                  onClick={() => handleUpdateOrderStatus(order.id, OrderStatus.CANCELLED)}
                                  className="p-2 hover:bg-red-50 border rounded-lg text-red-600 cursor-pointer"
                                  title="Batalkan Pesanan"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="p-12 text-center bg-[#FAF3E0] rounded-3xl max-w-sm mx-auto space-y-3">
                <AlertCircle className="w-12 h-12 text-[#6F4E37]/20 mx-auto" />
                <h3 className="font-serif font-bold text-lg text-[#3E2723]">Tidak Ada Pesanan</h3>
                <p className="text-gray-400 text-xs font-light">Tidak ada pesanan masuk dengan status kriteria filter ini saat ini.</p>
              </div>
            )}
          </div>
        )}

        {/* TAB 5: DATABASE PELANGGAN SETIA */}
        {activeMenu === "customers" && (
          <div className="space-y-8">
            <div className="border-b pb-6">
              <h1 className="font-serif text-3xl font-bold text-[#3E2723]">Database Pelanggan Setia</h1>
              <p className="text-gray-500 text-xs font-light">Riwayat pendaftaran, nomor WhatsApp, serta total omzet transaksi kumulatif seluruh pelanggan.</p>
            </div>

            <div className="bg-[#FAF3E0] rounded-3xl overflow-hidden shadow-sm max-w-4xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-[#3E2723]">
                  <thead className="bg-[#FFF8E7] text-gray-500 uppercase tracking-wider font-mono text-[10px] border-b">
                    <tr>
                      <th className="p-4 pl-6">Nama Pelanggan</th>
                      <th className="p-4">Email Akun</th>
                      <th className="p-4">Nomor WhatsApp</th>
                      <th className="p-4">Total Transaksi</th>
                      <th className="p-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-medium">
                    {orders.reduce((acc: User[], o) => {
                      // Collect loyal customers with mock metrics
                      if (!acc.some(u => u.id === o.userId)) {
                        acc.push({
                          id: o.userId,
                          name: o.userName,
                          email: `${o.userName.toLowerCase().replace(/\s+/g, "")}@gmail.com`,
                          phone: o.userPhone,
                          role: UserRole.CUSTOMER,
                          totalTransactions: orders.filter(ord => ord.userId === o.userId && ord.status !== OrderStatus.CANCELLED).reduce((sum, ord) => sum + ord.totalPrice, 0),
                          createdAt: o.createdAt
                        });
                      }
                      return acc;
                    }, []).map((customer) => (
                      <tr key={customer.id} className="hover:bg-gray-50/40">
                        <td className="p-4 pl-6 font-bold text-sm text-[#3E2723]">{customer.name}</td>
                        <td className="p-4 text-gray-500 font-light">{customer.email}</td>
                        <td className="p-4 font-mono font-bold text-gray-600">{customer.phone}</td>
                        <td className="p-4 font-mono font-bold text-[#6F4E37]">Rp {(customer.totalTransactions || 0).toLocaleString()}</td>
                        <td className="p-4">
                          <span className="bg-emerald-50 text-emerald-600 border border-emerald-100 text-[10px] font-bold px-2.5 py-0.5 rounded-full">Loyal</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: KELOLA KUPON PROMO */}
        {activeMenu === "promos" && (
          <div className="space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-6">
              <div className="space-y-1">
                <h1 className="font-serif text-3xl font-bold text-[#3E2723]">Kelola Kupon Promo</h1>
                <p className="text-gray-500 text-xs font-light">Terbitkan diskon persentase, direct cashbacks, tetapkan transaksi minimal, dan pasang tanggal jatuh tempo.</p>
              </div>
              <button 
                onClick={() => {
                  setEditId(null);
                  setFormPromoCode("");
                  setFormPromoName("");
                  setFormPromoType("percentage");
                  setFormPromoValue(0);
                  setFormPromoMin(0);
                  setFormPromoDesc("");
                  setFormPromoActive(true);
                  setFormPromoExpiry(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]);
                  setModalType("promo");
                  setIsModalOpen(true);
                }}
                className="px-5 py-3 text-xs font-bold bg-[#6F4E37] hover:bg-[#3E2723] text-white rounded-xl shadow-md active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Terbitkan Kupon Baru
              </button>
            </div>

            {/* Promos Table */}
            <div className="bg-[#FAF3E0] rounded-3xl overflow-hidden shadow-sm max-w-4xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-[#3E2723]">
                  <thead className="bg-[#FFF8E7] text-gray-500 uppercase tracking-wider font-mono text-[10px] border-b">
                    <tr>
                      <th className="p-4 pl-6">Kode Kupon</th>
                      <th className="p-4">Nama Promo</th>
                      <th className="p-4">Diskon</th>
                      <th className="p-4">Minimal Belanja</th>
                      <th className="p-4 text-center">Status</th>
                      <th className="p-4 text-right pr-6">Kelola</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-medium">
                    {promotions.map((promo) => (
                      <tr key={promo.id} className="hover:bg-gray-50/40">
                        <td className="p-4 pl-6 font-mono font-bold text-gray-700">{promo.code}</td>
                        <td className="p-4 text-[#3E2723] font-bold">{promo.name}</td>
                        <td className="p-4 font-mono">
                          {promo.discountType === "percentage" ? `${promo.discountValue}%` : `Rp ${promo.discountValue.toLocaleString()}`}
                        </td>
                        <td className="p-4 font-mono text-gray-400">Rp {promo.minTransaction.toLocaleString()}</td>
                        <td className="p-4 text-center">
                          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                            promo.isActive 
                              ? "bg-emerald-50 text-emerald-600 border border-emerald-100" 
                              : "bg-red-50 text-red-600 border border-red-100"
                          }`}>
                            {promo.isActive ? "Aktif" : "Nonaktif"}
                          </span>
                        </td>
                        <td className="p-4 text-right pr-6 whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button 
                              onClick={() => handleEditPromo(promo)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleDeletePromo(promo.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 7: KELOLA TESTIMONI LANDING PAGE */}
        {activeMenu === "testimonials" && (
          <div className="space-y-8">
            <div className="border-b pb-6">
              <h1 className="font-serif text-3xl font-bold text-[#3E2723]">Ulasan & Testimoni Pelanggan</h1>
              <p className="text-gray-500 text-xs font-light">Saring kritik atau review kepuasan masakan yang tampil di korsel landing page utama.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
              {testimonials.map((test) => (
                <div key={test.id} className="p-6 rounded-3xl bg-[#FAF3E0] shadow-sm flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <img 
                        src={test.avatar} 
                        alt={test.name} 
                        className="w-12 h-12 rounded-full object-cover border"
                        referrerPolicy="no-referrer"
                      />
                      <div>
                        <h4 className="font-bold text-[#3E2723] text-sm">{test.name}</h4>
                        <span className="text-[10px] text-gray-400 font-light block">{test.role}</span>
                      </div>
                    </div>
                    {/* Stars */}
                    <div className="flex text-amber-400 gap-0.5">
                      {Array.from({ length: test.rating }).map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-current shrink-0" />
                      ))}
                    </div>
                    <p className="text-gray-500 italic text-xs leading-relaxed font-light">"{test.content}"</p>
                  </div>

                  <div className="pt-4 border-t flex justify-end gap-2">
                    <button 
                      onClick={() => handleDeleteTestimonial(test.id)}
                      className="px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 text-[10px] font-bold"
                    >
                      Hapus / Sembunyikan
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 8: LAPORAN KEUANGAN */}
        {activeMenu === "reports" && (
          <div className="space-y-8">
            <div className="border-b pb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print:hidden">
              <div className="space-y-1">
                <h1 className="font-serif text-3xl font-bold text-[#3E2723]">Laporan Keuangan & Penjualan</h1>
                <p className="text-gray-500 text-xs font-light">Lihat omzet harian/mingguan/bulanan, simulasikan ekspor data, dan lakukan pencetakan.</p>
              </div>

              {/* Range Selector */}
              <div className="flex items-center gap-1.5 bg-[#FAF3E0] p-1 rounded-xl shadow-sm">
                {[
                  { id: "hari", label: "Harian" },
                  { id: "minggu", label: "Mingguan" },
                  { id: "bulan", label: "Bulanan" },
                  { id: "tahun", label: "Tahunan" }
                ].map((chip) => (
                  <button
                    key={chip.id}
                    onClick={() => setReportFilter(chip.id as any)}
                    className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      reportFilter === chip.id ? "bg-[#6F4E37] text-white" : "text-gray-500 hover:bg-gray-100"
                    }`}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Printing Layout Wrapper */}
            <div className="p-8 rounded-3xl bg-[#FAF3E0] shadow-sm space-y-6 max-w-4xl">
              {/* Header inside Report print */}
              <div className="flex items-center justify-between border-b border-amber-950/10 pb-6">
                <div className="space-y-1">
                  <h2 className="font-serif font-bold text-xl text-[#3E2723]">{settings.businessName}</h2>
                  <p className="text-[10px] text-gray-400 font-mono tracking-widest uppercase">Laporan Penjualan ({reportFilter.toUpperCase()})</p>
                </div>
                <div className="text-right text-xs text-gray-400">
                  <span>Dicetak Pada: {new Date().toLocaleDateString("id-ID")}</span>
                </div>
              </div>

              {/* Analytics row */}
              <div className="grid grid-cols-3 gap-6 pt-2">
                <div className="p-4 rounded-2xl bg-[#F5ECD2]">
                  <span className="text-[10px] text-gray-400 block font-light">Omzet Penjualan Bersih</span>
                  <span className="font-mono text-lg font-bold text-emerald-600">
                    Rp {getFilteredReportOrders().reduce((sum, o) => sum + o.totalPrice, 0).toLocaleString()}
                  </span>
                </div>
                <div className="p-4 rounded-2xl bg-[#F5ECD2]">
                  <span className="text-[10px] text-gray-400 block font-light">Jumlah Sukses Transaksi</span>
                  <span className="text-sm font-semibold text-gray-700">{getFilteredReportOrders().length} Transaksi</span>
                </div>
                <div className="p-4 rounded-2xl bg-[#F5ECD2]">
                  <span className="text-[10px] text-gray-400 block font-light">Rata-rata Keranjang Belanja</span>
                  <span className="font-mono text-lg font-bold text-[#6F4E37]">
                    Rp {getFilteredReportOrders().length > 0 
                      ? Math.round(getFilteredReportOrders().reduce((sum, o) => sum + o.totalPrice, 0) / getFilteredReportOrders().length).toLocaleString() 
                      : 0}
                  </span>
                </div>
              </div>

              {/* Items details table */}
              <table className="w-full text-left text-xs text-[#3E2723]">
                <thead className="bg-[#FFF8E7] text-gray-500 uppercase tracking-wider font-mono text-[9px] border-b">
                  <tr>
                    <th className="p-3">Invoice</th>
                    <th className="p-3">Pelanggan</th>
                    <th className="p-3">Metode Ambil</th>
                    <th className="p-3 text-right">Nilai Transaksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium">
                  {getFilteredReportOrders().map((o) => (
                    <tr key={o.id}>
                      <td className="p-3 font-mono font-bold text-gray-600">{o.id}</td>
                      <td className="p-3">{o.userName}</td>
                      <td className="p-3 text-gray-500">{o.deliveryMethod}</td>
                      <td className="p-3 text-right font-mono font-bold text-[#6F4E37]">Rp {o.totalPrice.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Action Buttons inside Report Tab */}
              <div className="pt-6 border-t flex justify-end gap-3 print:hidden">
                <button 
                  onClick={() => addToast("Laporan berhasil diekspor ke Microsoft Excel (Simulated)!", "success")}
                  className="px-5 py-3 text-xs font-semibold rounded-xl border border-emerald-300 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 flex items-center gap-1.5"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  Ekspor ke Excel
                </button>
                <button 
                  onClick={handlePrintReport}
                  className="px-5 py-3 text-xs font-semibold rounded-xl bg-[#6F4E37] text-white hover:bg-[#3E2723] flex items-center gap-1.5"
                >
                  <Printer className="w-4 h-4" />
                  Cetak Laporan PDF
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 9: PENGATURAN TOKO */}
        {activeMenu === "settings" && (
          <div className="space-y-8 print:hidden">
            <div className="border-b pb-6">
              <h1 className="font-serif text-3xl font-bold text-[#3E2723]">Pengaturan Website Toko</h1>
              <p className="text-gray-500 text-xs font-light">Atur nama usaha, kontak WhatsApp, jam operasional, koordinat Google Maps, dan tautan sosial media.</p>
            </div>

            <form onSubmit={handleSaveSettings} className="p-8 rounded-3xl bg-[#FAF3E0] shadow-sm max-w-2xl space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#3E2723]">Nama Usaha Angkringan</label>
                  <input 
                    type="text" 
                    value={settBusinessName}
                    onChange={e => setSettBusinessName(e.target.value)}
                    className="w-full text-sm px-4 py-3 rounded-xl bg-[#FFF8E7]/30 border border-[#6F4E37]/15 focus:outline-none focus:border-[#6F4E37] text-[#3E2723]"
                    required 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#3E2723]">WhatsApp Admin (Format: 628xxx)</label>
                  <input 
                    type="text" 
                    value={settWhatsapp}
                    onChange={e => setSettWhatsapp(e.target.value)}
                    className="w-full text-sm px-4 py-3 rounded-xl bg-[#FFF8E7]/30 border border-[#6F4E37]/15 focus:outline-none focus:border-[#6F4E37] text-[#3E2723]"
                    required 
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#3E2723]">Alamat Lengkap Rombong</label>
                <textarea 
                  value={settAddress}
                  onChange={e => setSettAddress(e.target.value)}
                  className="w-full text-sm px-4 py-3 rounded-xl bg-[#FFF8E7]/30 border border-[#6F4E37]/15 focus:outline-none focus:border-[#6F4E37] text-[#3E2723] h-20"
                  required 
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#3E2723]">Email Kontak Toko</label>
                  <input 
                    type="email" 
                    value={settEmail}
                    onChange={e => setSettEmail(e.target.value)}
                    className="w-full text-sm px-4 py-3 rounded-xl bg-[#FFF8E7]/30 border border-[#6F4E37]/15 focus:outline-none focus:border-[#6F4E37] text-[#3E2723]"
                    required 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#3E2723]">Jam Operasional Buka</label>
                  <input 
                    type="text" 
                    value={settHours}
                    onChange={e => setSettHours(e.target.value)}
                    className="w-full text-sm px-4 py-3 rounded-xl bg-[#FFF8E7]/30 border border-[#6F4E37]/15 focus:outline-none focus:border-[#6F4E37] text-[#3E2723]"
                    required 
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#3E2723]">Username Instagram (Tanpa @)</label>
                  <input 
                    type="text" 
                    value={settInstagram}
                    onChange={e => setSettInstagram(e.target.value)}
                    className="w-full text-sm px-4 py-3 rounded-xl bg-[#FFF8E7]/30 border border-[#6F4E37]/15 focus:outline-none focus:border-[#6F4E37] text-[#3E2723]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#3E2723]">Username Facebook</label>
                  <input 
                    type="text" 
                    value={settFacebook}
                    onChange={e => setSettFacebook(e.target.value)}
                    className="w-full text-sm px-4 py-3 rounded-xl bg-[#FFF8E7]/30 border border-[#6F4E37]/15 focus:outline-none focus:border-[#6F4E37] text-[#3E2723]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#3E2723]">URL Embed Google Maps (Iframe Src)</label>
                <input 
                  type="text" 
                  value={settGmaps}
                  onChange={e => setSettGmaps(e.target.value)}
                  className="w-full text-sm px-4 py-3 rounded-xl bg-[#FFF8E7]/30 border border-[#6F4E37]/15 focus:outline-none focus:border-[#6F4E37] text-[#3E2723]"
                  required 
                />
              </div>

              <div className="pt-4 border-t flex justify-end">
                <button 
                  type="submit"
                  className="px-6 py-3.5 rounded-xl bg-[#6F4E37] hover:bg-[#3E2723] text-white font-bold text-xs"
                >
                  Simpan Semua Pengaturan
                </button>
              </div>
            </form>
          </div>
        )}
      </main>

      {/* --- FLOATING PRINTABLE INVOICE / STRUK MODAL VIEW --- */}
      <AnimatePresence>
        {selectedOrder && (
          <div className="fixed inset-0 z-50 overflow-y-auto print:static print:h-auto print:overflow-visible">
            {/* Backdrop in screen, hidden in print */}
            <div 
              onClick={() => setSelectedOrder(null)}
              className="absolute inset-0 bg-black/60 print:hidden"
            />

            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative max-w-md mx-auto my-10 bg-white p-8 rounded-3xl border shadow-2xl space-y-6 print:static print:border-none print:shadow-none print:my-0 print:p-0"
            >
              {/* Header inside Invoice modal */}
              <div className="text-center space-y-2 pb-4 border-b border-dashed border-gray-200">
                <h3 className="font-serif text-2xl font-bold text-[#3E2723]">{settings.businessName}</h3>
                <p className="text-[10px] text-gray-500 font-light max-w-xs mx-auto leading-relaxed">{settings.address}</p>
                <p className="text-[10px] text-[#6F4E37] font-mono">WhatsApp: +{settings.whatsapp}</p>
              </div>

              {/* Invoice Meta */}
              <div className="space-y-1.5 text-xs font-medium text-gray-600">
                <div className="flex justify-between">
                  <span>No. Invoice</span>
                  <span className="font-mono font-bold text-[#3E2723]">{selectedOrder.id}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tanggal Transaksi</span>
                  <span className="font-mono">{new Date(selectedOrder.createdAt).toLocaleString("id-ID")}</span>
                </div>
                <div className="flex justify-between">
                  <span>Penerima</span>
                  <span className="font-semibold text-gray-700">{selectedOrder.userName} ({selectedOrder.userPhone})</span>
                </div>
                <div className="flex justify-between">
                  <span>Metode Pengambilan</span>
                  <span className="font-bold text-[#3E2723]">{selectedOrder.deliveryMethod}</span>
                </div>
                {selectedOrder.address && (
                  <div className="flex justify-between items-start">
                    <span>Meja/Alamat</span>
                    <span className="font-semibold text-gray-700 text-right max-w-[200px]">{selectedOrder.address}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Metode Pembayaran</span>
                  <span className="font-semibold text-gray-700">{selectedOrder.paymentMethod}</span>
                </div>
              </div>

              {/* Items divider list */}
              <div className="border-t border-b border-dashed py-3 space-y-2">
                <span className="text-[10px] text-gray-400 font-mono tracking-widest uppercase block mb-1">Daftar Hidangan</span>
                {selectedOrder.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-start text-xs font-medium">
                    <div className="space-y-0.5">
                      <span className="font-bold text-[#3E2723]">{item.name}</span>
                      {item.notes && <span className="text-[9px] text-amber-600 italic block">"Catatan: {item.notes}"</span>}
                      <span className="text-gray-400 font-mono block">{item.price.toLocaleString()} x {item.quantity}</span>
                    </div>
                    <span className="font-mono font-bold text-[#3E2723]">Rp {(item.price * item.quantity).toLocaleString()}</span>
                  </div>
                ))}
              </div>

              {/* Calculation Summary Box */}
              <div className="space-y-2 text-xs font-medium text-gray-600">
                <div className="flex justify-between">
                  <span>Subtotal Belanja</span>
                  <span className="font-mono">Rp {(selectedOrder.items.reduce((sum, item) => sum + item.price * item.quantity, 0)).toLocaleString()}</span>
                </div>
                {selectedOrder.promoCode && (
                  <div className="flex justify-between text-amber-700 font-semibold">
                    <span>Kupon ({selectedOrder.promoCode})</span>
                    <span className="font-mono">-Rp {selectedOrder.discountAmount?.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t font-bold text-sm text-[#3E2723]">
                  <span>Total Tagihan</span>
                  <span className="font-mono text-emerald-600 text-base">Rp {selectedOrder.totalPrice.toLocaleString()}</span>
                </div>
              </div>

               {/* Footer inside Invoice */}
              <div className="text-center space-y-2 pt-4 border-t border-dashed border-gray-200">
                <div className="flex flex-col items-center gap-1">
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider print:hidden">Ubah Status Pesanan:</span>
                  <select
                    value={selectedOrder.status}
                    onChange={(e) => handleUpdateOrderStatus(selectedOrder.id, e.target.value as OrderStatus)}
                    className={`text-xs font-bold px-3 py-1.5 rounded-xl border focus:outline-none cursor-pointer font-sans transition-all shadow-sm print:border-none print:appearance-none print:bg-transparent print:p-0 print:shadow-none ${
                      selectedOrder.status === OrderStatus.COMPLETED ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                      selectedOrder.status === OrderStatus.CANCELLED ? "bg-red-50 text-red-700 border-red-200" :
                      selectedOrder.status === OrderStatus.READY ? "bg-blue-50 text-blue-700 border-blue-200" :
                      selectedOrder.status === OrderStatus.COOKING ? "bg-amber-50 text-amber-700 border-amber-200" :
                      "bg-orange-50 text-orange-700 border-orange-200"
                    }`}
                  >
                    <option value={OrderStatus.PENDING}>📥 Diterima</option>
                    <option value={OrderStatus.PROCESSING}>⚙️ Diproses</option>
                    <option value={OrderStatus.COOKING}>🍳 Dimasak</option>
                    <option value={OrderStatus.READY}>✅ Siap Ambil</option>
                    <option value={OrderStatus.COMPLETED}>🎉 Selesai</option>
                    <option value={OrderStatus.CANCELLED}>❌ Batal</option>
                  </select>
                </div>
                <p className="text-[10px] text-gray-400 font-light pt-1">Matur Nuwun Atas Kunjungan Anda!</p>
              </div>

              {/* Print buttons on screen, hidden in print */}
              <div className="flex gap-2 pt-2 print:hidden">
                <button 
                  onClick={() => setSelectedOrder(null)}
                  className="flex-1 py-3 text-xs font-semibold rounded-xl border hover:bg-gray-50"
                >
                  Tutup Struk
                </button>
                <button 
                  onClick={() => window.print()}
                  className="flex-1 py-3 text-xs font-semibold rounded-xl bg-[#6F4E37] text-white hover:bg-[#3E2723] flex items-center justify-center gap-1.5"
                >
                  <Printer className="w-4 h-4" />
                  Cetak Struk (Printer)
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- FORM SUBMISSION GENERAL DIALOG MODAL --- */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="min-h-screen flex items-center justify-center p-4 bg-black/60">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="max-w-md w-full bg-white rounded-3xl p-6 shadow-2xl border"
              >
                {/* Modal Title */}
                <div className="flex justify-between items-center pb-4 border-b mb-4">
                  <h3 className="font-serif font-bold text-lg text-[#3E2723]">
                    {modalType === "menu" ? (editId ? "Edit Menu Hidangan" : "Tambah Menu Hidangan") :
                     modalType === "category" ? (editId ? "Edit Kategori" : "Tambah Kategori") :
                     modalType === "promo" ? (editId ? "Edit Kupon Promo" : "Terbitkan Kupon Promo") : ""}
                  </h3>
                  <button onClick={() => { setIsModalOpen(false); setEditId(null); }} className="text-gray-400 hover:text-gray-600">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* MODAL 1: MENU FORM */}
                {modalType === "menu" && (
                  <form onSubmit={handleMenuSubmit} className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-[#3E2723]">Nama Menu Hidangan</label>
                      <input 
                        type="text" 
                        value={formMenuName}
                        onChange={e => setFormMenuName(e.target.value)}
                        placeholder="Contoh: Nasi Kucing Sambal Teri"
                        className="w-full text-sm px-4 py-2.5 rounded-xl bg-gray-50 border focus:outline-none focus:border-[#6F4E37] text-[#3E2723]"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-[#3E2723]">Harga (Rupiah)</label>
                        <input 
                          type="number" 
                          value={formMenuPrice || ""}
                          onChange={e => setFormMenuPrice(Number(e.target.value))}
                          placeholder="4000"
                          className="w-full text-sm px-4 py-2.5 rounded-xl bg-gray-50 border focus:outline-none focus:border-[#6F4E37] text-[#3E2723]"
                          required
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-[#3E2723]">Stok Harian</label>
                        <input 
                          type="number" 
                          value={formMenuStock || ""}
                          onChange={e => setFormMenuStock(Number(e.target.value))}
                          placeholder="50"
                          className="w-full text-sm px-4 py-2.5 rounded-xl bg-gray-50 border focus:outline-none focus:border-[#6F4E37] text-[#3E2723]"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-[#3E2723]">Kategori Menu</label>
                        <select 
                          value={formMenuCategory}
                          onChange={e => setFormMenuCategory(e.target.value)}
                          className="w-full text-sm px-4 py-2.5 rounded-xl bg-gray-50 border focus:outline-none focus:border-[#6F4E37] text-[#3E2723]"
                          required
                        >
                          <option value="">-- Pilih --</option>
                          {categories.map(c => <option key={c.id} value={c.slug}>{c.name}</option>)}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-[#3E2723]">Status Penjualan</label>
                        <select 
                          value={formMenuStatus}
                          onChange={e => setFormMenuStatus(e.target.value as any)}
                          className="w-full text-sm px-4 py-2.5 rounded-xl bg-gray-50 border focus:outline-none focus:border-[#6F4E37] text-[#3E2723]"
                          required
                        >
                          <option value="Tersedia">Tersedia</option>
                          <option value="Habis">Habis</option>
                        </select>
                      </div>
                    </div>

                    {/* Image conversion frame */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-[#3E2723] block">Foto Menu Hidangan</label>
                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          value={formMenuImage}
                          onChange={e => setFormMenuImage(e.target.value)}
                          placeholder="Salin/Paste URL gambar atau klik upload"
                          className="flex-1 text-xs px-3 py-2 rounded-xl bg-gray-50 border focus:outline-none text-gray-500"
                        />
                        <div className="relative shrink-0">
                          <input 
                            type="file" 
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                          />
                          <button type="button" className="px-3 py-2 rounded-xl border bg-gray-100 flex items-center gap-1 hover:bg-gray-200">
                            <Upload className="w-4.5 h-4.5 text-gray-500" />
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-[#3E2723]">Deskripsi Menu</label>
                      <textarea 
                        value={formMenuDesc}
                        onChange={e => setFormMenuDesc(e.target.value)}
                        placeholder="Deskripsikan cita rasa menu di sini..."
                        className="w-full text-xs px-4 py-2 rounded-xl bg-gray-50 border focus:outline-none focus:border-[#6F4E37] text-[#3E2723] h-14"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-[#3E2723]">Komposisi (Opsional)</label>
                      <input 
                        type="text" 
                        value={formMenuComposition}
                        onChange={e => setFormMenuComposition(e.target.value)}
                        placeholder="Contoh: Nasi, sambal teri daun pisang"
                        className="w-full text-xs px-4 py-2 rounded-xl bg-gray-50 border focus:outline-none focus:border-[#6F4E37] text-[#3E2723]"
                      />
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                      <input 
                        type="checkbox" 
                        id="best"
                        checked={formMenuBest}
                        onChange={e => setFormMenuBest(e.target.checked)}
                        className="w-4 h-4 accent-[#6F4E37] rounded border-gray-300"
                      />
                      <label htmlFor="best" className="text-xs font-bold text-[#3E2723] cursor-pointer">Pasang Badge "Best Seller" di Beranda</label>
                    </div>

                    <div className="flex gap-2 pt-4">
                      <button 
                        type="button" 
                        onClick={() => { setIsModalOpen(false); setEditId(null); }}
                        className="flex-1 py-2.5 text-xs font-semibold rounded-xl border text-gray-500 hover:bg-gray-50"
                      >
                        Batal
                      </button>
                      <button 
                        type="submit" 
                        className="flex-1 py-2.5 text-xs font-bold rounded-xl bg-[#6F4E37] text-white hover:bg-[#3E2723]"
                      >
                        Simpan Menu
                      </button>
                    </div>
                  </form>
                )}

                {/* MODAL 2: CATEGORY FORM */}
                {modalType === "category" && (
                  <form onSubmit={handleCategorySubmit} className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-[#3E2723]">Nama Kategori</label>
                      <input 
                        type="text" 
                        value={formCatName}
                        onChange={e => {
                          setFormCatName(e.target.value);
                          // Auto slugify
                          setFormCatSlug(e.target.value.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""));
                        }}
                        placeholder="Contoh: Sate Bakar"
                        className="w-full text-sm px-4 py-2.5 rounded-xl bg-gray-50 border focus:outline-none focus:border-[#6F4E37] text-[#3E2723]"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-[#3E2723]">Slug Kategori (Batas Huruf Kecil & Strip)</label>
                      <input 
                        type="text" 
                        value={formCatSlug}
                        onChange={e => setFormCatSlug(e.target.value)}
                        placeholder="sate-bakar"
                        className="w-full text-sm px-4 py-2.5 rounded-xl bg-gray-50 border focus:outline-none focus:border-[#6F4E37] font-mono text-[#3E2723]"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-[#3E2723]">Deskripsi Kategori</label>
                      <textarea 
                        value={formCatDesc}
                        onChange={e => setFormCatDesc(e.target.value)}
                        placeholder="Deskripsi singkat jenis menu kategori..."
                        className="w-full text-xs px-4 py-2 rounded-xl bg-gray-50 border focus:outline-none focus:border-[#6F4E37] text-[#3E2723] h-16"
                      />
                    </div>

                    <div className="flex gap-2 pt-4">
                      <button 
                        type="button" 
                        onClick={() => { setIsModalOpen(false); setEditId(null); }}
                        className="flex-1 py-2.5 text-xs font-semibold rounded-xl border text-gray-500 hover:bg-gray-50"
                      >
                        Batal
                      </button>
                      <button 
                        type="submit" 
                        className="flex-1 py-2.5 text-xs font-bold rounded-xl bg-[#6F4E37] text-white hover:bg-[#3E2723]"
                      >
                        Simpan Kategori
                      </button>
                    </div>
                  </form>
                )}

                {/* MODAL 3: PROMO FORM */}
                {modalType === "promo" && (
                  <form onSubmit={handlePromoSubmit} className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-[#3E2723]">Kode Kupon Promo (Otomatis Kapital)</label>
                      <input 
                        type="text" 
                        value={formPromoCode}
                        onChange={e => setFormPromoCode(e.target.value.toUpperCase())}
                        placeholder="Contoh: BALARAJAKENYANG"
                        className="w-full text-sm px-4 py-2.5 rounded-xl bg-gray-50 border focus:outline-none focus:border-[#6F4E37] font-mono text-[#3E2723]"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-[#3E2723]">Nama Promo</label>
                      <input 
                        type="text" 
                        value={formPromoName}
                        onChange={e => setFormPromoName(e.target.value)}
                        placeholder="Contoh: Diskon Tradisi Kenyang"
                        className="w-full text-sm px-4 py-2.5 rounded-xl bg-gray-50 border focus:outline-none focus:border-[#6F4E37] text-[#3E2723]"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-[#3E2723]">Tipe Kupon</label>
                        <select 
                          value={formPromoType}
                          onChange={e => setFormPromoType(e.target.value as any)}
                          className="w-full text-sm px-4 py-2.5 rounded-xl bg-gray-50 border focus:outline-none focus:border-[#6F4E37] text-[#3E2723]"
                          required
                        >
                          <option value="percentage">Persentase (%)</option>
                          <option value="fixed">Nominal (Rupiah)</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-[#3E2723]">Nilai Potongan</label>
                        <input 
                          type="number" 
                          value={formPromoValue || ""}
                          onChange={e => setFormPromoValue(Number(e.target.value))}
                          placeholder={formPromoType === "percentage" ? "10" : "5000"}
                          className="w-full text-sm px-4 py-2.5 rounded-xl bg-gray-50 border focus:outline-none focus:border-[#6F4E37] text-[#3E2723]"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-[#3E2723]">Transaksi Minimum (Rp)</label>
                        <input 
                          type="number" 
                          value={formPromoMin || ""}
                          onChange={e => setFormPromoMin(Number(e.target.value))}
                          placeholder="20000"
                          className="w-full text-sm px-4 py-2.5 rounded-xl bg-gray-50 border focus:outline-none focus:border-[#6F4E37] text-[#3E2723]"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-[#3E2723]">Batas Kedaluwarsa</label>
                        <input 
                          type="date" 
                          value={formPromoExpiry}
                          onChange={e => setFormPromoExpiry(e.target.value)}
                          className="w-full text-sm px-4 py-2.5 rounded-xl bg-gray-50 border focus:outline-none focus:border-[#6F4E37] text-[#3E2723]"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-[#3E2723]">Keterangan Promo</label>
                      <textarea 
                        value={formPromoDesc}
                        onChange={e => setFormPromoDesc(e.target.value)}
                        placeholder="Rincian informasi diskon..."
                        className="w-full text-xs px-4 py-2 rounded-xl bg-gray-50 border focus:outline-none focus:border-[#6F4E37] text-[#3E2723] h-14"
                      />
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <input 
                        type="checkbox" 
                        id="active"
                        checked={formPromoActive}
                        onChange={e => setFormPromoActive(e.target.checked)}
                        className="w-4 h-4 accent-[#6F4E37]"
                      />
                      <label htmlFor="active" className="text-xs font-bold text-[#3E2723] cursor-pointer">Pasang Status Kupon Sebagai AKTIF</label>
                    </div>

                    <div className="flex gap-2 pt-4">
                      <button 
                        type="button" 
                        onClick={() => { setIsModalOpen(false); setEditId(null); }}
                        className="flex-1 py-2.5 text-xs font-semibold rounded-xl border text-gray-500 hover:bg-gray-50"
                      >
                        Batal
                      </button>
                      <button 
                        type="submit" 
                        className="flex-1 py-2.5 text-xs font-bold rounded-xl bg-[#6F4E37] text-white hover:bg-[#3E2723]"
                      >
                        Terbitkan Kupon
                      </button>
                    </div>
                  </form>
                )}
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
