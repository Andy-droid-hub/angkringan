export enum UserRole {
  ADMIN = "ADMIN",
  CUSTOMER = "CUSTOMER"
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  password?: string;
  totalTransactions?: number;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  createdAt: string;
}

export interface Menu {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  stock: number;
  rating: number;
  category: string; // Category slug or id
  status: "Tersedia" | "Habis";
  isBestSeller?: boolean;
  composition?: string;
  createdAt: string;
}

export enum OrderStatus {
  PENDING = "Pesanan Diterima",
  PROCESSING = "Sedang Diproses",
  COOKING = "Sedang Dimasak",
  READY = "Siap Diambil",
  COMPLETED = "Selesai",
  CANCELLED = "Dibatalkan"
}

export interface OrderItem {
  menuId: string;
  name: string;
  price: number;
  quantity: number;
  notes?: string;
}

export interface Order {
  id: string; // Invoice number e.g. INV-20260627-001
  userId: string;
  userName: string;
  userPhone: string;
  address?: string;
  deliveryMethod: "Makan di Tempat" | "Bungkus" | "Delivery";
  paymentMethod: "Cash" | "QRIS" | "Transfer Bank" | "E-Wallet";
  items: OrderItem[];
  totalPrice: number;
  status: OrderStatus;
  promoCode?: string;
  discountAmount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Banner {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  isActive: boolean;
}

export interface Testimonial {
  id: string;
  name: string;
  role: string;
  content: string;
  rating: number;
  avatar: string;
  isActive: boolean;
}

export interface Gallery {
  id: string;
  title: string;
  image: string;
  createdAt: string;
}

export interface Promotion {
  id: string;
  code: string;
  name: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  minTransaction: number;
  description: string;
  isActive: boolean;
  expiryDate: string;
}

export interface AppSettings {
  businessName: string;
  address: string;
  whatsapp: string;
  email: string;
  instagram: string;
  facebook: string;
  openingHours: string;
  gmapsEmbedUrl: string;
}

export interface CartItem {
  menuId: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  notes?: string;
}

export interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  details: string;
  timestamp: string;
}
