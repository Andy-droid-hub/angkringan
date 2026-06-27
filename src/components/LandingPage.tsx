import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Coffee, Utensils, ShieldCheck, Heart, Sparkles, Clock, MapPin, 
  ChevronLeft, ChevronRight, Award, Flame, Star, ShoppingBag, 
  Smartphone, Eye 
} from "lucide-react";
import { Menu, Category, Testimonial, Gallery, AppSettings, Promotion } from "../types";

const getGmapsUrl = (urlOrIframe: string): string => {
  if (!urlOrIframe) return "";
  // If it's a full iframe HTML string, extract the src attribute value
  if (urlOrIframe.includes("<iframe")) {
    const match = urlOrIframe.match(/src=["']([^"']+)["']/);
    if (match && match[1]) {
      return match[1];
    }
  }
  return urlOrIframe;
};

interface LandingPageProps {
  settings: AppSettings;
  menus: Menu[];
  categories: Category[];
  testimonials: Testimonial[];
  galleries?: Gallery[];
  promotions: Promotion[];
  onNavigateToCustomer: (view?: string) => void;
  onNavigateToAdmin?: () => void;
  onOpenProductDetail: (menu: Menu) => void;
}

export default function LandingPage({
  settings,
  menus,
  categories,
  testimonials,
  galleries = [
    { id: "g1", title: "Suasana Hangat Rombong Songo", image: "https://images.unsplash.com/photo-1544025162-d76694265947?w=600", createdAt: "" },
    { id: "g2", title: "Pilihan Tusukan Sate Lengkap", image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600", createdAt: "" },
    { id: "g3", title: "Wedangan Jos Hangat Bara Api", image: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600", createdAt: "" },
    { id: "g4", title: "Momen Santai Bersama Sahabat", image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600", createdAt: "" }
  ],
  promotions,
  onNavigateToCustomer,
  onNavigateToAdmin,
  onOpenProductDetail
}: LandingPageProps) {
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [currentTestimonialIndex, setCurrentTestimonialIndex] = useState(0);

  // Filter menus for "Menu Favorit" section
  const filteredMenus = activeCategory === "all" 
    ? menus.slice(0, 6) 
    : menus.filter(m => m.category === activeCategory).slice(0, 6);

  // Automatically slide testimonials
  useEffect(() => {
    if (testimonials.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentTestimonialIndex((prev) => (prev + 1) % testimonials.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [testimonials]);

  const handleNextTestimonial = () => {
    setCurrentTestimonialIndex((prev) => (prev + 1) % testimonials.length);
  };

  const handlePrevTestimonial = () => {
    setCurrentTestimonialIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  return (
    <div className="min-h-screen font-sans bg-[#FFF8E7]">
      {/* 1. HERO SECTION */}
      <section className="relative h-[90vh] flex items-center justify-center text-white overflow-hidden">
        {/* Background image with dark overlay */}
        <div 
          className="absolute inset-0 bg-cover bg-center transition-all duration-1000 transform scale-105"
          style={{ 
            backgroundImage: `linear-gradient(rgba(31, 15, 10, 0.75), rgba(31, 15, 10, 0.85)), url('/src/assets/images/gerobak_angkringan_banner_1782580485231.jpg')` 
          }}
        />
        
        {/* Glowing lanterns effect */}
        <div className="absolute top-10 left-10 w-24 h-24 bg-amber-500/20 rounded-full blur-2xl animate-pulse" />
        <div className="absolute top-20 right-20 w-32 h-32 bg-orange-500/10 rounded-full blur-3xl animate-pulse delay-75" />
 
        <div className="relative max-w-4xl mx-auto text-center px-6 z-10">
          <motion.div 
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#6F4E37]/40 border border-amber-400/30 text-amber-300 text-sm font-medium mb-6 backdrop-blur-md"
          >
            <Sparkles className="w-4 h-4 text-amber-400 animate-spin" />
            <span>Kearifan Lokal dalam Balutan Modern</span>
          </motion.div>
 
          <motion.h1 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="font-serif text-5xl md:text-7xl font-bold tracking-tight text-white mb-6 leading-[1.15]"
          >
            {settings.businessName || "Angkringan Tanjakan"}
          </motion.h1>
 
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-lg md:text-2xl text-amber-100/95 max-w-2xl mx-auto font-semibold leading-relaxed mb-10 font-sans tracking-wide drop-shadow-sm"
          >
            Nongkrong & Ngobrol. Harga Tetap Akrab
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <button 
              onClick={() => onNavigateToCustomer("menu")}
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-[#FF9800] to-amber-500 text-white font-semibold hover:shadow-lg hover:shadow-orange-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer text-base"
            >
              <ShoppingBag className="w-5 h-5" />
              Pesan Sekarang
            </button>
            <a 
              href="#menu-favorit"
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-white/10 hover:bg-white/15 text-white border border-white/20 font-medium active:scale-95 transition-all text-center backdrop-blur-sm cursor-pointer text-base"
            >
              Lihat Menu Kami
            </a>
          </motion.div>
        </div>

        {/* Dynamic Wave Border */}
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-[#FFF8E7]" style={{ clipPath: "polygon(0 60%, 100% 0, 100% 100%, 0 100%)" }} />
      </section>

      {/* 2. TENTANG KAMI */}
      <section className="py-24 max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <motion.div 
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative"
          >
            {/* Elegant double border frame around beautiful image */}
            <div className="absolute inset-0 border-2 border-[#6F4E37] translate-x-4 translate-y-4 rounded-2xl -z-10" />
            <img 
              src="https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=800&auto=format&fit=crop&q=80" 
              alt="Suasana Angkringan" 
              className="rounded-2xl shadow-xl w-full object-cover h-[450px] border border-[#6F4E37]/10"
            />
            <div className="absolute -bottom-6 -right-6 bg-gradient-to-br from-[#6F4E37] to-[#3E2723] text-[#FFF8E7] p-6 rounded-2xl shadow-xl border border-amber-300/20 flex items-center gap-4">
              <Award className="w-12 h-12 text-amber-400 shrink-0" />
              <div>
                <p className="text-xs text-amber-300/80 uppercase tracking-widest font-mono">Didirikan Pada</p>
                <p className="font-serif text-xl font-bold">Tahun 2018</p>
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="space-y-6"
          >
            <div className="space-y-2">
              <p className="text-xs uppercase font-mono tracking-widest text-[#FF9800] font-semibold">Tentang Kami</p>
              <h2 className="font-serif text-4xl md:text-5xl font-bold text-[#3E2723]">Warisan Kelezatan Rasa yang Autentik</h2>
            </div>
            <p className="text-[#5D4037] leading-relaxed text-base font-light">
              Berawal dari sebuah rombong kayu sederhana di pinggir jalan Balaraja, <strong>{settings.businessName}</strong> kini bertransformasi menjadi angkringan modern bernuansa nyaman tanpa menghilangkan rasa asli hidangan tradisional. Kami percaya bahwa kebersamaan terbaik dimulai dari kehangatan meja angkringan.
            </p>
            
            {/* Core Values / Keunggulan */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6">
              <div className="p-5 rounded-2xl bg-white border border-[#6F4E37]/10 shadow-sm flex flex-col items-center text-center space-y-2">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 text-[#4CAF50] flex items-center justify-center">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-[#3E2723] text-sm">Bahan Berkualitas</h3>
                <p className="text-xs text-gray-500 font-light">Semua bahan segar dipilih langsung setiap hari.</p>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-[#6F4E37]/10 shadow-sm flex flex-col items-center text-center space-y-2">
                <div className="w-12 h-12 rounded-xl bg-amber-50 text-[#FF9800] flex items-center justify-center">
                  <Flame className="w-6 h-6 animate-pulse" />
                </div>
                <h3 className="font-bold text-[#3E2723] text-sm">Harga Terjangkau</h3>
                <p className="text-xs text-gray-500 font-light">Rasa berkelas restoran, harga merakyat.</p>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-[#6F4E37]/10 shadow-sm flex flex-col items-center text-center space-y-2">
                <div className="w-12 h-12 rounded-xl bg-orange-50 text-[#6F4E37] flex items-center justify-center">
                  <Heart className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-[#3E2723] text-sm">Suasana Nyaman</h3>
                <p className="text-xs text-gray-500 font-light">Tempat kumpul asyik dengan wifi dan kebersihan prima.</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* PROMO BANNER (If exists) */}
      {promotions.some(p => p.isActive) && (
        <section className="bg-gradient-to-r from-[#6F4E37] to-[#3E2723] text-[#FFF8E7] py-12 relative overflow-hidden">
          <div className="absolute inset-0 bg-radial-gradient from-amber-500/10 to-transparent" />
          <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
            <div className="space-y-2 text-center md:text-left">
              <span className="bg-[#FF9800] text-[#3E2723] text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full">Kupon Promo Spesial</span>
              <h3 className="text-2xl md:text-3xl font-serif font-bold">Gunakan Kode Kupon & Hemat Lebih Banyak!</h3>
              <p className="text-amber-100/80 text-sm max-w-xl font-light">
                Gunakan kode <span className="font-mono bg-[#3E2723] px-2 py-0.5 rounded text-amber-300 font-semibold">{promotions.filter(p => p.isActive)[0]?.code}</span> saat melakukan pemesanan untuk mendapatkan diskon spesial.
              </p>
            </div>
            <button 
              onClick={() => onNavigateToCustomer("menu")}
              className="px-6 py-3 rounded-xl bg-white text-[#3E2723] font-bold shadow-md hover:bg-amber-100 active:scale-95 transition-all text-sm shrink-0"
            >
              Klaim Kupon Sekarang
            </button>
          </div>
        </section>
      )}

      {/* 3. MENU FAVORIT */}
      <section id="menu-favorit" className="py-24 bg-[#FFFDFA]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-xl mx-auto space-y-3 mb-16">
            <p className="text-xs uppercase font-mono tracking-widest text-[#FF9800] font-semibold">Sajian Utama Kami</p>
            <h2 className="font-serif text-4xl font-bold text-[#3E2723]">Menu Favorit Pelanggan</h2>
            <div className="w-20 h-1 bg-[#6F4E37] mx-auto rounded" />
            <p className="text-gray-500 font-light text-sm">
              Kami menyajikan ragam hidangan angkringan klasik dengan standar rasa bintang lima yang diolah secara higienis.
            </p>
          </div>

          {/* Categories Tab */}
          <div className="flex flex-wrap justify-center gap-2 mb-12">
            <button 
              onClick={() => setActiveCategory("all")}
              className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                activeCategory === "all" 
                  ? "bg-[#6F4E37] text-white shadow-md shadow-amber-950/20" 
                  : "bg-[#FFF8E7] text-[#6F4E37] hover:bg-[#6F4E37]/10"
              }`}
            >
              Semua Menu
            </button>
            {categories.map((cat) => (
              <button 
                key={cat.id}
                onClick={() => setActiveCategory(cat.slug)}
                className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                  activeCategory === cat.slug 
                    ? "bg-[#6F4E37] text-white shadow-md shadow-amber-950/20" 
                    : "bg-[#FFF8E7] text-[#6F4E37] hover:bg-[#6F4E37]/10"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Menus Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredMenus.map((menu) => (
              <motion.div 
                layout
                key={menu.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="group rounded-3xl bg-white border border-[#6F4E37]/10 overflow-hidden shadow-sm hover:shadow-xl hover:border-[#6F4E37]/25 transition-all flex flex-col h-full"
              >
                {/* Product Image and Badges */}
                <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
                  <img 
                    src={menu.image} 
                    alt={menu.name} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                  {/* Category Badge */}
                  <span className="absolute top-4 left-4 text-[10px] uppercase tracking-wider font-bold text-white bg-[#3E2723]/80 px-3 py-1 rounded-full backdrop-blur-sm">
                    {categories.find(c => c.slug === menu.category)?.name || menu.category}
                  </span>
                  {/* Best Seller Badge */}
                  {menu.isBestSeller && (
                    <span className="absolute top-4 right-4 flex items-center gap-1 text-[10px] font-bold text-[#3E2723] bg-amber-400 px-3 py-1 rounded-full shadow-md animate-bounce">
                      <Star className="w-3 h-3 fill-current shrink-0" />
                      Best Seller
                    </span>
                  )}
                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                    <button 
                      onClick={() => onOpenProductDetail(menu)}
                      className="p-3 bg-white text-[#3E2723] rounded-full hover:bg-amber-100 shadow-md active:scale-95 transition-all"
                      title="Lihat Detail"
                    >
                      <Eye className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => onNavigateToCustomer("menu")}
                      className="p-3 bg-[#FF9800] text-white rounded-full hover:bg-orange-600 shadow-md active:scale-95 transition-all"
                      title="Pesan Sekarang"
                    >
                      <ShoppingBag className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 flex flex-col flex-grow space-y-4">
                  <div className="space-y-1.5 flex-grow">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-serif font-bold text-lg text-[#3E2723] line-clamp-1">{menu.name}</h3>
                      <div className="flex items-center gap-1 text-amber-500 shrink-0">
                        <Star className="w-4 h-4 fill-current" />
                        <span className="text-xs font-bold text-gray-700">{menu.rating.toFixed(1)}</span>
                      </div>
                    </div>
                    <p className="text-gray-500 text-xs font-light line-clamp-2 leading-relaxed">{menu.description}</p>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div>
                      <span className="text-xs text-gray-400 block font-light">Harga</span>
                      <span className="font-mono text-lg font-bold text-[#6F4E37]">Rp {menu.price.toLocaleString()}</span>
                    </div>
                    
                    <button 
                      onClick={() => onNavigateToCustomer("menu")}
                      className="px-4 py-2 text-xs font-semibold rounded-xl bg-[#FFF8E7] text-[#6F4E37] hover:bg-[#6F4E37] hover:text-white transition-all active:scale-95 cursor-pointer"
                    >
                      Pesan
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-12">
            <button 
              onClick={() => onNavigateToCustomer("menu")}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-[#6F4E37] text-[#6F4E37] hover:bg-[#6F4E37] hover:text-white font-semibold transition-all active:scale-95 cursor-pointer text-sm"
            >
              Lihat Seluruh Menu Kami
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* 4. KENAPA MEMILIH KAMI */}
      <section className="py-24 max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-center">
          <div className="space-y-4">
            <p className="text-xs uppercase font-mono tracking-widest text-[#FF9800] font-semibold">Keunggulan Layanan</p>
            <h2 className="font-serif text-4xl font-bold text-[#3E2723] leading-tight">Mengapa Angkringan Kami Begitu Spesial?</h2>
            <p className="text-[#5D4037] text-sm leading-relaxed font-light">
              Kami memadukan atmosfer kesederhanaan tradisional dengan manajemen higienis modern yang terkomputerisasi demi menyajikan kenyamanan terbaik untuk Anda.
            </p>
            <div className="pt-4">
              <button 
                onClick={() => onNavigateToCustomer("menu")}
                className="px-6 py-3 rounded-xl bg-[#6F4E37] text-white font-semibold shadow-md shadow-amber-950/20 hover:bg-[#3E2723] active:scale-95 transition-all text-sm cursor-pointer"
              >
                Pesan Lewat HP
              </button>
            </div>
          </div>

          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="p-6 rounded-3xl bg-white border border-[#6F4E37]/10 shadow-sm space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-orange-100 text-[#FF9800] flex items-center justify-center">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="font-serif font-bold text-lg text-[#3E2723]">Sajian Cepat Hangat</h3>
              <p className="text-gray-500 text-xs font-light leading-relaxed">
                Setiap sate dibakar secara langsung sesaat setelah Anda memesannya agar sampai ke meja dalam keadaan panas krispi.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-white border border-[#6F4E37]/10 shadow-sm space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-[#4CAF50] flex items-center justify-center">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="font-serif font-bold text-lg text-[#3E2723]">Higienitas Terjamin</h3>
              <p className="text-gray-500 text-xs font-light leading-relaxed">
                Proses penyajian bersih, bebas debu jalanan, dengan pengemasan daun pisang steril berkualitas prima.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-white border border-[#6F4E37]/10 shadow-sm space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-[#6F4E37] flex items-center justify-center">
                <Coffee className="w-6 h-6 animate-pulse" />
              </div>
              <h3 className="font-serif font-bold text-lg text-[#3E2723]">Kopi & Wedang Otentik</h3>
              <p className="text-gray-500 text-xs font-light leading-relaxed">
                Kopi robusta berkualitas dan racikan jahe seduh asli, bukan produk perisa buatan pabrik.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-white border border-[#6F4E37]/10 shadow-sm space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-500 flex items-center justify-center">
                <Smartphone className="w-6 h-6" />
              </div>
              <h3 className="font-serif font-bold text-lg text-[#3E2723]">Pemesanan QR Code</h3>
              <p className="text-gray-500 text-xs font-light leading-relaxed">
                Tinggal scan di meja, pesan menu kesukaan, bayar dengan QRIS tanpa harus mengantre lama di kasir.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. TESTIMONIALS SLIDER */}
      {testimonials.length > 0 && (
        <section className="py-24 bg-[#FFFDFA] relative overflow-hidden">
          <div className="absolute top-10 left-10 w-44 h-44 bg-amber-100/30 rounded-full blur-3xl" />
          
          <div className="max-w-4xl mx-auto px-6 text-center space-y-8 relative z-10">
            <div className="space-y-2">
              <p className="text-xs uppercase font-mono tracking-widest text-[#FF9800] font-semibold">Testimoni Pelanggan</p>
              <h2 className="font-serif text-4xl font-bold text-[#3E2723]">Kisah Hangat dari Mereka</h2>
            </div>

            <div className="relative p-8 md:p-12 rounded-3xl bg-white border border-[#6F4E37]/10 shadow-sm">
              <span className="font-serif text-7xl text-[#6F4E37]/20 absolute top-4 left-6 pointer-events-none">“</span>
              
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentTestimonialIndex}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  <p className="text-gray-600 text-base md:text-lg italic leading-relaxed font-light">
                    {testimonials[currentTestimonialIndex].content}
                  </p>

                  <div className="flex flex-col items-center space-y-2">
                    <img 
                      src={testimonials[currentTestimonialIndex].avatar} 
                      alt={testimonials[currentTestimonialIndex].name} 
                      className="w-14 h-14 rounded-full object-cover border-2 border-[#6F4E37]"
                      referrerPolicy="no-referrer"
                    />
                    <div>
                      <h4 className="font-bold text-[#3E2723] text-sm">{testimonials[currentTestimonialIndex].name}</h4>
                      <p className="text-xs text-gray-400 font-light">{testimonials[currentTestimonialIndex].role}</p>
                    </div>
                    {/* Rating stars */}
                    <div className="flex items-center gap-0.5 text-amber-400">
                      {Array.from({ length: testimonials[currentTestimonialIndex].rating }).map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-current shrink-0" />
                      ))}
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* Slider Controls */}
              <div className="flex items-center justify-center gap-3 mt-8">
                <button 
                  onClick={handlePrevTestimonial}
                  className="p-2.5 rounded-full border border-gray-100 bg-white hover:bg-gray-50 shadow-sm hover:border-gray-200 text-gray-600 transition-all active:scale-90"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <div className="flex gap-1.5">
                  {testimonials.map((_, idx) => (
                    <button 
                      key={idx}
                      onClick={() => setCurrentTestimonialIndex(idx)}
                      className={`w-2.5 h-2.5 rounded-full transition-all ${
                        currentTestimonialIndex === idx ? "bg-[#6F4E37] w-6" : "bg-gray-200"
                      }`}
                    />
                  ))}
                </div>
                <button 
                  onClick={handleNextTestimonial}
                  className="p-2.5 rounded-full border border-gray-100 bg-white hover:bg-gray-50 shadow-sm hover:border-gray-200 text-gray-600 transition-all active:scale-90"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 6. GALERI GRID */}
      {galleries.length > 0 && (
        <section className="py-24 max-w-7xl mx-auto px-6">
          <div className="text-center max-w-xl mx-auto space-y-3 mb-16">
            <p className="text-xs uppercase font-mono tracking-widest text-[#FF9800] font-semibold font-bold">Galeri Angkringan</p>
            <h2 className="font-serif text-4xl font-bold text-[#3E2723]">Potret Hangat Suasana Malam</h2>
            <div className="w-20 h-1 bg-[#6F4E37] mx-auto rounded" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {galleries.map((item, idx) => (
              <motion.div 
                key={item.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="group relative rounded-3xl overflow-hidden aspect-square border border-[#6F4E37]/10 bg-gray-100 shadow-sm hover:shadow-xl transition-all"
              >
                <img 
                  src={item.image} 
                  alt={item.title} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-6">
                  <h4 className="text-white font-serif font-bold text-base leading-snug">{item.title}</h4>
                  <p className="text-amber-300 text-xs font-mono font-light mt-1">Sudut Songo</p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* 7. LOKASI (GOOGLE MAPS EMBED) */}
      <section className="bg-white border-t border-b border-[#6F4E37]/10">
        <div className="grid grid-cols-1 lg:grid-cols-2 items-stretch">
          <div className="p-10 md:p-16 flex flex-col justify-center space-y-8 bg-[#FFF8E7]/50">
            <div className="space-y-3">
              <p className="text-xs uppercase font-mono tracking-widest text-[#FF9800] font-semibold">Tempat Berkumpul</p>
              <h2 className="font-serif text-4xl font-bold text-[#3E2723]">Kunjungi Rombong Kami</h2>
              <div className="w-16 h-1 bg-[#6F4E37] rounded" />
            </div>

            <div className="space-y-6">
              <div className="flex gap-4">
                <MapPin className="w-6 h-6 text-[#FF9800] shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-[#3E2723] text-sm">Alamat Lengkap</h4>
                  <p className="text-gray-600 text-xs font-light leading-relaxed mt-1">{settings.address}</p>
                </div>
              </div>

              <div className="flex gap-4">
                <Clock className="w-6 h-6 text-[#FF9800] shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-[#3E2723] text-sm">Jam Operasional</h4>
                  <p className="text-gray-600 text-xs font-light leading-relaxed mt-1">{settings.openingHours}</p>
                </div>
              </div>

              <div className="flex gap-4">
                <Smartphone className="w-6 h-6 text-[#FF9800] shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-[#3E2723] text-sm">Hubungi Kontak Kami</h4>
                  <p className="text-gray-600 text-xs font-light leading-relaxed mt-1">WhatsApp: +{settings.whatsapp}</p>
                  <p className="text-gray-600 text-xs font-light leading-relaxed">Email: {settings.email}</p>
                </div>
              </div>
            </div>

            <div className="pt-2 flex flex-wrap gap-4">
              <a 
                href={`https://wa.me/${settings.whatsapp}`}
                target="_blank"
                rel="noreferrer"
                className="px-6 py-3 rounded-xl bg-[#4CAF50] text-white font-semibold shadow-md shadow-emerald-950/20 hover:bg-emerald-600 transition-all active:scale-95 text-sm inline-flex items-center gap-2"
              >
                Chat WhatsApp
              </a>
              <button 
                onClick={() => onNavigateToCustomer("menu")}
                className="px-6 py-3 rounded-xl bg-[#6F4E37] text-white font-semibold hover:bg-[#3E2723] transition-all active:scale-95 text-sm cursor-pointer"
              >
                Pesan Makan Malam
              </button>
            </div>
          </div>

          <div className="min-h-[400px] bg-gray-100 relative">
            {/* Embedded Google Maps */}
            <iframe 
              src={getGmapsUrl(settings.gmapsEmbedUrl)} 
              width="100%" 
              height="100%" 
              style={{ border: 0 }} 
              allowFullScreen={true} 
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="absolute inset-0 w-full h-full"
            />
          </div>
        </div>
      </section>

      {/* 8. FOOTER */}
      <footer className="bg-[#3E2723] text-[#FFF8E7] pt-16 pb-8 border-t border-amber-950/20">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12 pb-12 border-b border-white/10">
          <div className="space-y-4">
            <h3 className="font-serif text-2xl font-bold tracking-tight text-white">{settings.businessName}</h3>
            <p className="text-amber-100/70 text-xs font-light leading-relaxed">
              Warisan kuliner tradisional yang diolah dengan higienis modern. Nikmati hidangan lezat nan hemat untuk menemani obrolan hangat malam Anda.
            </p>
            <div className="flex gap-3 pt-2">
              <a href={`https://instagram.com/${settings.instagram}`} target="_blank" rel="noreferrer" className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-amber-200 hover:text-white transition-all">
                <span className="text-sm font-semibold">IG</span>
              </a>
              <a href={`https://facebook.com/${settings.facebook}`} target="_blank" rel="noreferrer" className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-amber-200 hover:text-white transition-all">
                <span className="text-sm font-semibold">FB</span>
              </a>
              <a href={`https://wa.me/${settings.whatsapp}`} target="_blank" rel="noreferrer" className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-amber-200 hover:text-white transition-all">
                <span className="text-sm font-semibold">WA</span>
              </a>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-serif font-bold text-white text-base">Menu Unggulan</h4>
            <ul className="space-y-2 text-xs text-amber-100/70 font-light">
              <li className="hover:text-amber-300 transition-colors cursor-pointer" onClick={() => onNavigateToCustomer("menu")}>Nasi Kucing Teri</li>
              <li className="hover:text-amber-300 transition-colors cursor-pointer" onClick={() => onNavigateToCustomer("menu")}>Sate Telur Puyuh Bacem</li>
              <li className="hover:text-amber-300 transition-colors cursor-pointer" onClick={() => onNavigateToCustomer("menu")}>Sate Kulit Ayam Bakar</li>
              <li className="hover:text-amber-300 transition-colors cursor-pointer" onClick={() => onNavigateToCustomer("menu")}>Tempe Mendoan Banyumas</li>
              <li className="hover:text-amber-300 transition-colors cursor-pointer" onClick={() => onNavigateToCustomer("menu")}>Kopi Jos Arang Membara</li>
              <li className="hover:text-amber-300 transition-colors cursor-pointer" onClick={() => onNavigateToCustomer("menu")}>Wedang Uwuh Kraton</li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="font-serif font-bold text-white text-base">Tautan Pintas</h4>
            <ul className="space-y-2 text-xs text-amber-100/70 font-light">
              <li className="hover:text-amber-300 transition-colors"><a href="#menu-favorit">Menu Favorit</a></li>
              <li className="hover:text-amber-300 transition-colors"><a href="#menu-favorit">Lokasi Rombong</a></li>
              <li className="hover:text-amber-300 transition-colors cursor-pointer" onClick={() => onNavigateToCustomer("dashboard")}>Dashboard Pelanggan</li>
              <li className="hover:text-amber-300 transition-colors cursor-pointer" onClick={() => onNavigateToCustomer("orders")}>Riwayat Pesanan</li>
              <li className="hover:text-amber-300 transition-colors cursor-pointer" onClick={onNavigateToAdmin}>Kelola Toko (Admin)</li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="font-serif font-bold text-white text-base">Jam Buka</h4>
            <p className="text-xs text-amber-100/70 font-light leading-relaxed">
              Kami siap melayani Anda mulai dari sore hari hingga larut malam.<br /><br />
              <span className="text-white font-semibold font-mono">{settings.openingHours}</span>
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-amber-100/50 font-light">
          <p>© 2026 {settings.businessName}. Hak Cipta Dilindungi Undang-Undang.</p>
          <div className="flex gap-4">
            <span className="hover:text-amber-300 cursor-pointer">Syarat & Ketentuan</span>
            <span>•</span>
            <span className="hover:text-amber-300 cursor-pointer">Kebijakan Privasi</span>
            <span>•</span>
            <span className="hover:text-amber-300 cursor-pointer" onClick={onNavigateToAdmin}>Login Staf</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
