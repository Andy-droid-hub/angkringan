import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Star, Plus, Minus, ShoppingBag, ShieldCheck } from "lucide-react";
import { Menu, Category } from "../types";

interface ProductDetailModalProps {
  menu: Menu | null;
  categories: Category[];
  onClose: () => void;
  onAddToCart: (menuId: string, qty: number, notes: string) => void;
}

export default function ProductDetailModal({
  menu,
  categories,
  onClose,
  onAddToCart
}: ProductDetailModalProps) {
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState("");

  if (!menu) return null;

  const handleQtyChange = (val: number) => {
    if (val < 1) return;
    if (val > menu.stock) return;
    setQuantity(val);
  };

  const handleAdd = () => {
    onAddToCart(menu.id, quantity, notes);
    onClose();
    // reset states
    setQuantity(1);
    setNotes("");
  };

  const categoryName = categories.find((c) => c.slug === menu.category)?.name || menu.category;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 overflow-y-auto">
        {/* Backdrop overlay */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.6 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black"
        />

        {/* Modal Card content */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.25 }}
          className="relative max-w-2xl w-full bg-white rounded-3xl overflow-hidden shadow-2xl border flex flex-col md:flex-row max-h-[90vh] md:max-h-none"
        >
          {/* Close trigger absolute button */}
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-sm transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Left Side: Product High Resolution Image */}
          <div className="w-full md:w-1/2 relative bg-gray-100 aspect-video md:aspect-auto">
            <img 
              src={menu.image} 
              alt={menu.name} 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            {/* Rating floating badge */}
            <div className="absolute bottom-4 left-4 bg-white/95 border px-3 py-1 rounded-full text-amber-500 text-xs font-bold flex items-center gap-1 shadow-md backdrop-blur-sm">
              <Star className="w-4 h-4 fill-current shrink-0" />
              <span className="text-gray-700 font-mono font-bold">{menu.rating.toFixed(1)}</span>
            </div>
          </div>

          {/* Right Side: Description and ordering details */}
          <div className="w-full md:w-1/2 p-6 md:p-8 flex flex-col justify-between overflow-y-auto space-y-6">
            <div className="space-y-4">
              <div>
                <span className="text-[10px] uppercase font-mono tracking-widest font-bold text-amber-600 bg-[#FFF8E7] px-2.5 py-1 rounded-md border border-amber-200/50">
                  {categoryName}
                </span>
                <h3 className="font-serif font-bold text-xl md:text-2xl text-[#3E2723] mt-3">{menu.name}</h3>
                <span className="font-mono text-xl font-bold text-[#6F4E37] mt-1.5 block">
                  Rp {menu.price.toLocaleString()}
                </span>
              </div>

              <div className="space-y-1.5">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Tentang Menu</span>
                <p className="text-gray-500 text-xs leading-relaxed font-light">{menu.description}</p>
              </div>

              {menu.composition && (
                <div className="space-y-1.5">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Bahan & Komposisi</span>
                  <p className="text-[#6F4E37] text-xs font-medium bg-[#FFF8E7]/40 px-3 py-2 rounded-xl border border-[#6F4E37]/5">
                    {menu.composition}
                  </p>
                </div>
              )}

              {/* Cooking Health Tag */}
              <div className="flex items-center gap-2 text-emerald-600 text-[10px] font-semibold bg-emerald-50 border border-emerald-100 px-3 py-2 rounded-xl">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span>Dimasak & Disajikan Higienis, Bebas Pengawet</span>
              </div>

              {/* Notes TextArea */}
              <div className="space-y-1.5">
                <span className="text-xs font-bold text-[#3E2723] block">Catatan Tambahan Pelanggan</span>
                <input 
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Contoh: Sate tidak usah dibakar terlalu kering..."
                  className="w-full text-xs px-4 py-2.5 rounded-xl bg-[#FFF8E7]/30 border focus:outline-none focus:border-[#6F4E37] text-[#3E2723]"
                />
              </div>
            </div>

            {/* Price and Add buttons */}
            <div className="pt-4 border-t border-gray-100 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-gray-400 block font-light">Jumlah Porsi</span>
                  <div className="flex items-center gap-3 mt-1.5 bg-gray-50 border rounded-xl p-1">
                    <button 
                      onClick={() => handleQtyChange(quantity - 1)}
                      className="p-1 rounded-lg hover:bg-gray-200 text-gray-500 active:scale-95 transition-all"
                      type="button"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="text-sm font-mono font-bold text-gray-700 w-8 text-center">{quantity}</span>
                    <button 
                      onClick={() => handleQtyChange(quantity + 1)}
                      className="p-1 rounded-lg hover:bg-gray-200 text-gray-500 active:scale-95 transition-all"
                      type="button"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-gray-400 block font-light">Subtotal Hidangan</span>
                  <span className="font-mono text-lg font-bold text-emerald-600">
                    Rp {(menu.price * quantity).toLocaleString()}
                  </span>
                </div>
              </div>

              <button 
                disabled={menu.status === "Habis" || menu.stock <= 0}
                onClick={handleAdd}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#6F4E37] to-[#3E2723] text-white font-bold text-sm shadow-md hover:shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:bg-gray-200 disabled:text-gray-400"
              >
                <ShoppingBag className="w-4 h-4" />
                {menu.status === "Habis" || menu.stock <= 0 ? "Stok Sedang Habis" : "Tambahkan ke Keranjang"}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
