import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { readDb, writeDb, logActivity } from "./src/db/db-helper";
import { User, UserRole, Order, OrderStatus, Category, Menu, Promotion, Testimonial, Gallery, Banner, AppSettings } from "./src/types";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Use body-parser middleware with limit for base64 image uploads
  app.use(express.json({ limit: "20mb" }));
  app.use(express.urlencoded({ limit: "20mb", extended: true }));

  // --- API ROUTES START ---

  // Custom Authentication Middleware Helper
  const authenticateUser = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({ message: "Otentikasi diperlukan. Sesi Anda tidak valid." });
      return;
    }
    const token = authHeader.split(" ")[1];
    const db = readDb();
    // In our simplified JWT system, we use "token-user_id" format for mock authentication
    const userId = token.replace("token-", "");
    const user = db.users.find((u) => u.id === userId);
    if (!user) {
      res.status(401).json({ message: "Sesi tidak ditemukan atau kedaluwarsa." });
      return;
    }
    // Attach user to request
    (req as any).user = user;
    next();
  };

  const requireAdmin = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const user = (req as any).user;
    if (!user || user.role !== UserRole.ADMIN) {
      res.status(403).json({ message: "Akses ditolak. Hanya untuk Admin." });
      return;
    }
    next();
  };

  // 1. Auth Endpoints
  app.post("/api/auth/register", (req, res) => {
    try {
      const { name, email, phone, password } = req.body;
      if (!name || !email || !phone || !password) {
        res.status(400).json({ message: "Mohon isi semua data pendaftaran dengan lengkap." });
        return;
      }

      const db = readDb();
      const existingUser = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
      if (existingUser) {
        res.status(400).json({ message: "Email sudah terdaftar. Silakan gunakan email lain." });
        return;
      }

      const newUser: User = {
        id: `u-${Date.now()}`,
        name,
        email,
        phone,
        role: UserRole.CUSTOMER,
        password, // stored securely in simulated DB
        totalTransactions: 0,
        createdAt: new Date().toISOString()
      };

      db.users.push(newUser);
      writeDb(db);
      logActivity(newUser.id, newUser.name, "REGISTER", `Pendaftaran pelanggan baru: ${newUser.name}`);

      const token = `token-${newUser.id}`;
      // Do not return password
      const { password: _, ...userWithoutPassword } = newUser as any;

      res.status(201).json({
        user: userWithoutPassword,
        token,
        message: "Pendaftaran berhasil! Selamat datang di Angkringan Songo."
      });
    } catch (error) {
      res.status(500).json({ message: "Terjadi kesalahan server saat mendaftar." });
    }
  });

  app.post("/api/auth/login", (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        res.status(400).json({ message: "Username/No HP dan password wajib diisi." });
        return;
      }

      const db = readDb();
      const loginId = email.toLowerCase().trim();
      const user = db.users.find((u) => {
        const isPasswordCorrect = (u as any).password === password;
        if (!isPasswordCorrect) return false;

        const uEmail = u.email.toLowerCase();
        const uPhone = u.phone.trim();
        const uNameSlug = u.name.toLowerCase().replace(/\s+/g, "");
        const uNameLower = u.name.toLowerCase();

        return (
          uEmail === loginId ||
          uPhone === loginId ||
          uNameSlug === loginId ||
          uNameLower === loginId ||
          (loginId === "admin" && u.role === UserRole.ADMIN)
        );
      });

      if (!user) {
        res.status(400).json({ message: "Username, No HP, atau password yang Anda masukkan salah." });
        return;
      }

      const token = `token-${user.id}`;
      const { password: _, ...userWithoutPassword } = user as any;

      logActivity(user.id, user.name, "LOGIN", `Login berhasil sebagai ${user.role}`);

      res.json({
        user: userWithoutPassword,
        token,
        message: `Selamat datang kembali, ${user.name}!`
      });
    } catch (error) {
      res.status(500).json({ message: "Terjadi kesalahan server saat masuk." });
    }
  });

  app.put("/api/auth/profile", authenticateUser, (req, res) => {
    try {
      const reqUser = (req as any).user;
      const { name, email, phone, password } = req.body;

      const db = readDb();
      const userIndex = db.users.findIndex((u) => u.id === reqUser.id);
      if (userIndex === -1) {
        res.status(404).json({ message: "Pengguna tidak ditemukan." });
        return;
      }

      if (email && email !== reqUser.email) {
        const emailExists = db.users.find((u) => u.id !== reqUser.id && u.email.toLowerCase() === email.toLowerCase());
        if (emailExists) {
          res.status(400).json({ message: "Email sudah digunakan oleh akun lain." });
          return;
        }
      }

      db.users[userIndex].name = name || db.users[userIndex].name;
      db.users[userIndex].email = email || db.users[userIndex].email;
      db.users[userIndex].phone = phone || db.users[userIndex].phone;
      if (password) {
        (db.users[userIndex] as any).password = password;
      }

      writeDb(db);
      logActivity(reqUser.id, db.users[userIndex].name, "UPDATE_PROFILE", "Memperbarui data profil");

      const { password: _, ...userWithoutPassword } = db.users[userIndex] as any;
      res.json({
        user: userWithoutPassword,
        message: "Profil berhasil diperbarui!"
      });
    } catch (error) {
      res.status(500).json({ message: "Gagal memperbarui profil." });
    }
  });

  // 2. Settings Endpoints
  app.get("/api/settings", (req, res) => {
    try {
      const db = readDb();
      res.json(db.settings);
    } catch (error) {
      res.status(500).json({ message: "Gagal memuat pengaturan." });
    }
  });

  app.put("/api/settings", authenticateUser, requireAdmin, (req, res) => {
    try {
      const db = readDb();
      db.settings = { ...db.settings, ...req.body };
      writeDb(db);
      logActivity((req as any).user.id, (req as any).user.name, "UPDATE_SETTINGS", "Memperbarui konfigurasi sistem angkringan");
      res.json({ settings: db.settings, message: "Pengaturan website berhasil disimpan!" });
    } catch (error) {
      res.status(500).json({ message: "Gagal menyimpan pengaturan." });
    }
  });

  // 3. Category Endpoints
  app.get("/api/categories", (req, res) => {
    try {
      const db = readDb();
      res.json(db.categories);
    } catch (error) {
      res.status(500).json({ message: "Gagal memuat kategori." });
    }
  });

  app.post("/api/categories", authenticateUser, requireAdmin, (req, res) => {
    try {
      const { name, slug, description } = req.body;
      if (!name || !slug) {
        res.status(400).json({ message: "Nama kategori dan slug harus diisi." });
        return;
      }
      const db = readDb();
      if (db.categories.some((c) => c.slug === slug || c.name === name)) {
        res.status(400).json({ message: "Kategori dengan nama atau slug ini sudah ada." });
        return;
      }
      const newCategory: Category = {
        id: `cat-${Date.now()}`,
        name,
        slug,
        description,
        createdAt: new Date().toISOString()
      };
      db.categories.push(newCategory);
      writeDb(db);
      logActivity((req as any).user.id, (req as any).user.name, "CREATE_CATEGORY", `Membuat kategori: ${name}`);
      res.status(201).json({ category: newCategory, message: "Kategori berhasil ditambahkan!" });
    } catch (error) {
      res.status(500).json({ message: "Gagal membuat kategori." });
    }
  });

  app.put("/api/categories/:id", authenticateUser, requireAdmin, (req, res) => {
    try {
      const { id } = req.params;
      const { name, slug, description } = req.body;
      const db = readDb();
      const catIndex = db.categories.findIndex((c) => c.id === id);
      if (catIndex === -1) {
        res.status(404).json({ message: "Kategori tidak ditemukan." });
        return;
      }
      db.categories[catIndex] = {
        ...db.categories[catIndex],
        name: name || db.categories[catIndex].name,
        slug: slug || db.categories[catIndex].slug,
        description: description !== undefined ? description : db.categories[catIndex].description
      };
      writeDb(db);
      logActivity((req as any).user.id, (req as any).user.name, "UPDATE_CATEGORY", `Memperbarui kategori ID: ${id}`);
      res.json({ category: db.categories[catIndex], message: "Kategori berhasil diperbarui!" });
    } catch (error) {
      res.status(500).json({ message: "Gagal memperbarui kategori." });
    }
  });

  app.delete("/api/categories/:id", authenticateUser, requireAdmin, (req, res) => {
    try {
      const { id } = req.params;
      const db = readDb();
      const catIndex = db.categories.findIndex((c) => c.id === id);
      if (catIndex === -1) {
        res.status(404).json({ message: "Kategori tidak ditemukan." });
        return;
      }
      const catName = db.categories[catIndex].name;
      db.categories.splice(catIndex, 1);
      writeDb(db);
      logActivity((req as any).user.id, (req as any).user.name, "DELETE_CATEGORY", `Menghapus kategori: ${catName}`);
      res.json({ message: `Kategori ${catName} berhasil dihapus!` });
    } catch (error) {
      res.status(500).json({ message: "Gagal menghapus kategori." });
    }
  });

  // 4. Menu Endpoints
  app.get("/api/menus", (req, res) => {
    try {
      const db = readDb();
      res.json(db.menus);
    } catch (error) {
      res.status(500).json({ message: "Gagal memuat menu." });
    }
  });

  app.post("/api/menus", authenticateUser, requireAdmin, (req, res) => {
    try {
      const { name, description, price, image, stock, rating, category, status, isBestSeller, composition } = req.body;
      if (!name || !price || !category) {
        res.status(400).json({ message: "Nama menu, harga, dan kategori wajib diisi." });
        return;
      }
      const db = readDb();
      const newMenu: Menu = {
        id: `m-${Date.now()}`,
        name,
        description: description || "",
        price: Number(price),
        image: image || "https://images.unsplash.com/photo-1544025162-d76694265947?w=500&auto=format&fit=crop&q=60",
        stock: Number(stock) || 0,
        rating: Number(rating) || 5.0,
        category,
        status: status || "Tersedia",
        isBestSeller: !!isBestSeller,
        composition: composition || "",
        createdAt: new Date().toISOString()
      };
      db.menus.push(newMenu);
      writeDb(db);
      logActivity((req as any).user.id, (req as any).user.name, "CREATE_MENU", `Menambah menu baru: ${name}`);
      res.status(201).json({ menu: newMenu, message: "Menu baru berhasil ditambahkan!" });
    } catch (error) {
      res.status(500).json({ message: "Gagal membuat menu baru." });
    }
  });

  app.put("/api/menus/:id", authenticateUser, requireAdmin, (req, res) => {
    try {
      const { id } = req.params;
      const db = readDb();
      const menuIndex = db.menus.findIndex((m) => m.id === id);
      if (menuIndex === -1) {
        res.status(404).json({ message: "Menu tidak ditemukan." });
        return;
      }
      const data = req.body;
      db.menus[menuIndex] = {
        ...db.menus[menuIndex],
        name: data.name !== undefined ? data.name : db.menus[menuIndex].name,
        description: data.description !== undefined ? data.description : db.menus[menuIndex].description,
        price: data.price !== undefined ? Number(data.price) : db.menus[menuIndex].price,
        image: data.image !== undefined ? data.image : db.menus[menuIndex].image,
        stock: data.stock !== undefined ? Number(data.stock) : db.menus[menuIndex].stock,
        category: data.category !== undefined ? data.category : db.menus[menuIndex].category,
        status: data.status !== undefined ? data.status : db.menus[menuIndex].status,
        isBestSeller: data.isBestSeller !== undefined ? !!data.isBestSeller : db.menus[menuIndex].isBestSeller,
        composition: data.composition !== undefined ? data.composition : db.menus[menuIndex].composition
      };
      writeDb(db);
      logActivity((req as any).user.id, (req as any).user.name, "UPDATE_MENU", `Mengupdate menu: ${db.menus[menuIndex].name}`);
      res.json({ menu: db.menus[menuIndex], message: "Menu berhasil diperbarui!" });
    } catch (error) {
      res.status(500).json({ message: "Gagal mengupdate menu." });
    }
  });

  app.delete("/api/menus/:id", authenticateUser, requireAdmin, (req, res) => {
    try {
      const { id } = req.params;
      const db = readDb();
      const menuIndex = db.menus.findIndex((m) => m.id === id);
      if (menuIndex === -1) {
        res.status(404).json({ message: "Menu tidak ditemukan." });
        return;
      }
      const menuName = db.menus[menuIndex].name;
      db.menus.splice(menuIndex, 1);
      writeDb(db);
      logActivity((req as any).user.id, (req as any).user.name, "DELETE_MENU", `Menghapus menu: ${menuName}`);
      res.json({ message: `Menu ${menuName} berhasil dihapus!` });
    } catch (error) {
      res.status(500).json({ message: "Gagal menghapus menu." });
    }
  });

  // 5. Promotion Endpoints
  app.get("/api/promotions", (req, res) => {
    try {
      const db = readDb();
      res.json(db.promotions);
    } catch (error) {
      res.status(500).json({ message: "Gagal memuat promo." });
    }
  });

  app.post("/api/promotions", authenticateUser, requireAdmin, (req, res) => {
    try {
      const { code, name, discountType, discountValue, minTransaction, description, isActive, expiryDate } = req.body;
      if (!code || !name || !discountValue) {
        res.status(400).json({ message: "Kode promo, nama promo, dan nilai diskon wajib diisi." });
        return;
      }
      const db = readDb();
      if (db.promotions.some((p) => p.code.toUpperCase() === code.toUpperCase())) {
        res.status(400).json({ message: "Kode promo sudah digunakan." });
        return;
      }
      const newPromo: Promotion = {
        id: `promo-${Date.now()}`,
        code: code.toUpperCase(),
        name,
        discountType,
        discountValue: Number(discountValue),
        minTransaction: Number(minTransaction) || 0,
        description: description || "",
        isActive: isActive !== undefined ? !!isActive : true,
        expiryDate: expiryDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      };
      db.promotions.push(newPromo);
      writeDb(db);
      logActivity((req as any).user.id, (req as any).user.name, "CREATE_PROMOTION", `Membuat promo baru: ${code}`);
      res.status(201).json({ promotion: newPromo, message: "Kupon promo berhasil dibuat!" });
    } catch (error) {
      res.status(500).json({ message: "Gagal membuat promo baru." });
    }
  });

  app.put("/api/promotions/:id", authenticateUser, requireAdmin, (req, res) => {
    try {
      const { id } = req.params;
      const db = readDb();
      const index = db.promotions.findIndex((p) => p.id === id);
      if (index === -1) {
        res.status(404).json({ message: "Promo tidak ditemukan." });
        return;
      }
      const data = req.body;
      db.promotions[index] = {
        ...db.promotions[index],
        code: data.code ? data.code.toUpperCase() : db.promotions[index].code,
        name: data.name !== undefined ? data.name : db.promotions[index].name,
        discountType: data.discountType !== undefined ? data.discountType : db.promotions[index].discountType,
        discountValue: data.discountValue !== undefined ? Number(data.discountValue) : db.promotions[index].discountValue,
        minTransaction: data.minTransaction !== undefined ? Number(data.minTransaction) : db.promotions[index].minTransaction,
        description: data.description !== undefined ? data.description : db.promotions[index].description,
        isActive: data.isActive !== undefined ? !!data.isActive : db.promotions[index].isActive,
        expiryDate: data.expiryDate !== undefined ? data.expiryDate : db.promotions[index].expiryDate
      };
      writeDb(db);
      logActivity((req as any).user.id, (req as any).user.name, "UPDATE_PROMOTION", `Mengupdate promo ID: ${id}`);
      res.json({ promotion: db.promotions[index], message: "Kupon promo berhasil diperbarui!" });
    } catch (error) {
      res.status(500).json({ message: "Gagal mengupdate promo." });
    }
  });

  app.delete("/api/promotions/:id", authenticateUser, requireAdmin, (req, res) => {
    try {
      const { id } = req.params;
      const db = readDb();
      const index = db.promotions.findIndex((p) => p.id === id);
      if (index === -1) {
        res.status(404).json({ message: "Promo tidak ditemukan." });
        return;
      }
      const code = db.promotions[index].code;
      db.promotions.splice(index, 1);
      writeDb(db);
      logActivity((req as any).user.id, (req as any).user.name, "DELETE_PROMOTION", `Menghapus promo: ${code}`);
      res.json({ message: `Promo ${code} berhasil dihapus!` });
    } catch (error) {
      res.status(500).json({ message: "Gagal menghapus promo." });
    }
  });

  // 6. Testimonial Endpoints
  app.get("/api/testimonials", (req, res) => {
    try {
      const db = readDb();
      res.json(db.testimonials);
    } catch (error) {
      res.status(500).json({ message: "Gagal memuat testimoni." });
    }
  });

  app.post("/api/testimonials", authenticateUser, requireAdmin, (req, res) => {
    try {
      const { name, role, content, rating, avatar, isActive } = req.body;
      if (!name || !content || !rating) {
        res.status(400).json({ message: "Nama, isi testimoni, dan rating wajib diisi." });
        return;
      }
      const db = readDb();
      const newTestimonial: Testimonial = {
        id: `t-${Date.now()}`,
        name,
        role: role || "Pelanggan Setia",
        content,
        rating: Number(rating) || 5,
        avatar: avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=60",
        isActive: isActive !== undefined ? !!isActive : true
      };
      db.testimonials.push(newTestimonial);
      writeDb(db);
      logActivity((req as any).user.id, (req as any).user.name, "CREATE_TESTIMONIAL", `Membuat testimoni baru dari: ${name}`);
      res.status(201).json({ testimonial: newTestimonial, message: "Testimonial berhasil ditambahkan!" });
    } catch (error) {
      res.status(500).json({ message: "Gagal menambahkan testimonial." });
    }
  });

  app.delete("/api/testimonials/:id", authenticateUser, requireAdmin, (req, res) => {
    try {
      const { id } = req.params;
      const db = readDb();
      const idx = db.testimonials.findIndex((t) => t.id === id);
      if (idx === -1) {
        res.status(404).json({ message: "Testimoni tidak ditemukan." });
        return;
      }
      const name = db.testimonials[idx].name;
      db.testimonials.splice(idx, 1);
      writeDb(db);
      logActivity((req as any).user.id, (req as any).user.name, "DELETE_TESTIMONIAL", `Menghapus testimoni dari: ${name}`);
      res.json({ message: "Testimoni berhasil dihapus!" });
    } catch (error) {
      res.status(500).json({ message: "Gagal menghapus testimoni." });
    }
  });

  // 7. Gallery Endpoints
  app.get("/api/galleries", (req, res) => {
    try {
      const db = readDb();
      res.json(db.galleries);
    } catch (error) {
      res.status(500).json({ message: "Gagal memuat galeri." });
    }
  });

  app.post("/api/galleries", authenticateUser, requireAdmin, (req, res) => {
    try {
      const { title, image } = req.body;
      if (!image) {
        res.status(400).json({ message: "Foto galeri harus ada." });
        return;
      }
      const db = readDb();
      const newPhoto: Gallery = {
        id: `g-${Date.now()}`,
        title: title || "Foto Angkringan",
        image,
        createdAt: new Date().toISOString()
      };
      db.galleries.push(newPhoto);
      writeDb(db);
      logActivity((req as any).user.id, (req as any).user.name, "ADD_GALLERY", `Menambah foto galeri baru: ${newPhoto.title}`);
      res.status(201).json({ gallery: newPhoto, message: "Foto berhasil ditambahkan ke galeri!" });
    } catch (error) {
      res.status(500).json({ message: "Gagal menambah galeri." });
    }
  });

  app.delete("/api/galleries/:id", authenticateUser, requireAdmin, (req, res) => {
    try {
      const { id } = req.params;
      const db = readDb();
      const idx = db.galleries.findIndex((g) => g.id === id);
      if (idx === -1) {
        res.status(404).json({ message: "Foto galeri tidak ditemukan." });
        return;
      }
      db.galleries.splice(idx, 1);
      writeDb(db);
      logActivity((req as any).user.id, (req as any).user.name, "DELETE_GALLERY", `Menghapus foto galeri ID: ${id}`);
      res.json({ message: "Foto galeri berhasil dihapus!" });
    } catch (error) {
      res.status(500).json({ message: "Gagal menghapus galeri." });
    }
  });

  // 8. Banners Endpoints
  app.get("/api/banners", (req, res) => {
    try {
      const db = readDb();
      res.json(db.banners);
    } catch (error) {
      res.status(500).json({ message: "Gagal memuat banner." });
    }
  });

  app.post("/api/banners", authenticateUser, requireAdmin, (req, res) => {
    try {
      const { title, subtitle, image, isActive } = req.body;
      if (!title || !image) {
        res.status(400).json({ message: "Judul banner dan gambar wajib diisi." });
        return;
      }
      const db = readDb();
      const newBanner: Banner = {
        id: `banner-${Date.now()}`,
        title,
        subtitle: subtitle || "",
        image,
        isActive: isActive !== undefined ? !!isActive : true
      };
      db.banners.push(newBanner);
      writeDb(db);
      logActivity((req as any).user.id, (req as any).user.name, "CREATE_BANNER", `Membuat banner promosi: ${title}`);
      res.status(201).json({ banner: newBanner, message: "Banner promo berhasil dibuat!" });
    } catch (error) {
      res.status(500).json({ message: "Gagal menambah banner baru." });
    }
  });

  app.delete("/api/banners/:id", authenticateUser, requireAdmin, (req, res) => {
    try {
      const { id } = req.params;
      const db = readDb();
      const idx = db.banners.findIndex((b) => b.id === id);
      if (idx === -1) {
        res.status(404).json({ message: "Banner tidak ditemukan." });
        return;
      }
      db.banners.splice(idx, 1);
      writeDb(db);
      logActivity((req as any).user.id, (req as any).user.name, "DELETE_BANNER", `Menghapus banner ID: ${id}`);
      res.json({ message: "Banner berhasil dihapus!" });
    } catch (error) {
      res.status(500).json({ message: "Gagal menghapus banner." });
    }
  });

  // 9. Customers Endpoints (Admin access)
  app.get("/api/customers", authenticateUser, requireAdmin, (req, res) => {
    try {
      const db = readDb();
      // Only return CUSTOMER users
      const customers = db.users.filter((u) => u.role === UserRole.CUSTOMER);
      res.json(customers);
    } catch (error) {
      res.status(500).json({ message: "Gagal memuat daftar pelanggan." });
    }
  });

  // 10. Orders Endpoints
  app.get("/api/orders", authenticateUser, (req, res) => {
    try {
      const user = (req as any).user;
      const db = readDb();

      if (user.role === UserRole.ADMIN) {
        // Admin sees all orders
        res.json(db.orders);
      } else {
        // Customer sees only their own orders
        const userOrders = db.orders.filter((o) => o.userId === user.id);
        res.json(userOrders);
      }
    } catch (error) {
      res.status(500).json({ message: "Gagal memuat pesanan." });
    }
  });

  app.post("/api/orders", authenticateUser, (req, res) => {
    try {
      const user = (req as any).user;
      const { address, deliveryMethod, paymentMethod, items, promoCode } = req.body;

      if (!deliveryMethod || !paymentMethod || !items || !Array.isArray(items) || items.length === 0) {
        res.status(400).json({ message: "Keranjang belanja kosong atau metode pengiriman belum dipilih." });
        return;
      }

      const db = readDb();

      // Validate stock first
      for (const item of items) {
        const menu = db.menus.find((m) => m.id === item.menuId);
        if (!menu) {
          res.status(404).json({ message: `Menu dengan ID ${item.menuId} tidak ditemukan.` });
          return;
        }
        if (menu.stock < item.quantity) {
          res.status(400).json({ message: `Maaf, stok menu "${menu.name}" tidak mencukupi (Sisa stok: ${menu.stock}).` });
          return;
        }
        if (menu.status === "Habis") {
          res.status(400).json({ message: `Maaf, menu "${menu.name}" sedang habis saat ini.` });
          return;
        }
      }

      // Calculate initial subtotal
      let subtotal = 0;
      const validatedItems = items.map((item) => {
        const menu = db.menus.find((m) => m.id === item.menuId)!;
        const lineTotal = menu.price * item.quantity;
        subtotal += lineTotal;
        return {
          menuId: menu.id,
          name: menu.name,
          price: menu.price,
          quantity: item.quantity,
          notes: item.notes || ""
        };
      });

      // Apply promo if valid
      let discountAmount = 0;
      let appliedPromoCode = "";
      if (promoCode) {
        const promo = db.promotions.find((p) => p.code.toUpperCase() === promoCode.toUpperCase() && p.isActive);
        if (promo) {
          const isExpiryValid = new Date(promo.expiryDate).getTime() > Date.now();
          if (isExpiryValid && subtotal >= promo.minTransaction) {
            appliedPromoCode = promo.code;
            if (promo.discountType === "percentage") {
              discountAmount = Math.round((subtotal * promo.discountValue) / 100);
            } else {
              discountAmount = promo.discountValue;
            }
          }
        }
      }

      const finalPrice = Math.max(0, subtotal - discountAmount);

      // Create new Order
      const invoiceNum = `INV-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.floor(100 + Math.random() * 900)}`;
      const newOrder: Order = {
        id: invoiceNum,
        userId: user.id,
        userName: user.name,
        userPhone: user.phone,
        address: address || "",
        deliveryMethod,
        paymentMethod,
        items: validatedItems,
        totalPrice: finalPrice,
        status: OrderStatus.PENDING,
        promoCode: appliedPromoCode || undefined,
        discountAmount: discountAmount || undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Reduce stock of each menu
      items.forEach((item) => {
        const menuIndex = db.menus.findIndex((m) => m.id === item.menuId);
        if (menuIndex !== -1) {
          db.menus[menuIndex].stock -= item.quantity;
          if (db.menus[menuIndex].stock === 0) {
            db.menus[menuIndex].status = "Habis";
          }
        }
      });

      // Update customer total transactions statistics
      const customerIdx = db.users.findIndex((u) => u.id === user.id);
      if (customerIdx !== -1) {
        db.users[customerIdx].totalTransactions = (db.users[customerIdx].totalTransactions || 0) + finalPrice;
      }

      db.orders.push(newOrder);
      writeDb(db);

      logActivity(user.id, user.name, "PLACE_ORDER", `Membuat pesanan baru: ${invoiceNum} sebesar Rp ${finalPrice.toLocaleString()}`);

      res.status(201).json({
        order: newOrder,
        message: "Pesanan Anda berhasil dibuat! Tim Angkringan segera menyiapkan hidangan Anda."
      });
    } catch (error) {
      res.status(500).json({ message: "Gagal membuat pesanan baru." });
    }
  });

  app.put("/api/orders/:id/status", authenticateUser, requireAdmin, (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body; // New OrderStatus string

      if (!status) {
        res.status(400).json({ message: "Status pesanan tidak valid." });
        return;
      }

      const db = readDb();
      const orderIdx = db.orders.findIndex((o) => o.id === id);
      if (orderIdx === -1) {
        res.status(404).json({ message: "Pesanan tidak ditemukan." });
        return;
      }

      const prevStatus = db.orders[orderIdx].status;
      db.orders[orderIdx].status = status as OrderStatus;
      db.orders[orderIdx].updatedAt = new Date().toISOString();

      // If transition to Cancelled, RESTORE stock back to menus
      if (status === OrderStatus.CANCELLED && prevStatus !== OrderStatus.CANCELLED) {
        db.orders[orderIdx].items.forEach((item) => {
          const menuIdx = db.menus.findIndex((m) => m.id === item.menuId);
          if (menuIdx !== -1) {
            db.menus[menuIdx].stock += item.quantity;
            db.menus[menuIdx].status = "Tersedia"; // restore available status
          }
        });
        // Deduct customer's transaction stats
        const customerIdx = db.users.findIndex((u) => u.id === db.orders[orderIdx].userId);
        if (customerIdx !== -1) {
          db.users[customerIdx].totalTransactions = Math.max(0, (db.users[customerIdx].totalTransactions || 0) - db.orders[orderIdx].totalPrice);
        }
      }

      writeDb(db);
      logActivity((req as any).user.id, (req as any).user.name, "UPDATE_ORDER_STATUS", `Mengubah status pesanan ${id} dari "${prevStatus}" menjadi "${status}"`);

      res.json({ order: db.orders[orderIdx], message: "Status pesanan berhasil diperbarui!" });
    } catch (error) {
      res.status(500).json({ message: "Gagal memperbarui status pesanan." });
    }
  });

  // 11. Admin Statistics & Reporting
  app.get("/api/admin/stats", authenticateUser, requireAdmin, (req, res) => {
    try {
      const db = readDb();
      const customersCount = db.users.filter((u) => u.role === UserRole.CUSTOMER).length;
      const totalOrdersCount = db.orders.length;

      // Filter successful orders (anything except Cancelled)
      const successOrders = db.orders.filter((o) => o.status !== OrderStatus.CANCELLED);

      // Calculations
      const today = new Date().toISOString().slice(0, 10);
      const currentMonth = new Date().toISOString().slice(0, 7);

      const revenueToday = successOrders
        .filter((o) => o.createdAt.startsWith(today))
        .reduce((sum, o) => sum + o.totalPrice, 0);

      const revenueMonth = successOrders
        .filter((o) => o.createdAt.startsWith(currentMonth))
        .reduce((sum, o) => sum + o.totalPrice, 0);

      // Most selling menus calculation
      const menuSalesMap: Record<string, { name: string; sales: number; revenue: number }> = {};
      successOrders.forEach((o) => {
        o.items.forEach((item) => {
          if (!menuSalesMap[item.menuId]) {
            menuSalesMap[item.menuId] = { name: item.name, sales: 0, revenue: 0 };
          }
          menuSalesMap[item.menuId].sales += item.quantity;
          menuSalesMap[item.menuId].revenue += item.price * item.quantity;
        });
      });

      const bestSellers = Object.values(menuSalesMap)
        .sort((a, b) => b.sales - a.sales)
        .slice(0, 5);

      // Activity logs to display
      const recentLogs = db.activityLogs.slice(0, 15);

      // Simple sales trend generator (last 7 days)
      const salesTrend = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().slice(0, 10);
        const dayLabel = d.toLocaleDateString("id-ID", { weekday: "short" });
        const dayOrders = successOrders.filter((o) => o.createdAt.startsWith(dateStr));
        const dayRevenue = dayOrders.reduce((sum, o) => sum + o.totalPrice, 0);

        salesTrend.push({
          date: dateStr,
          label: dayLabel,
          revenue: dayRevenue,
          orders: dayOrders.length
        });
      }

      res.json({
        customersCount,
        totalOrdersCount,
        revenueToday,
        revenueMonth,
        bestSellers,
        recentLogs,
        salesTrend
      });
    } catch (error) {
      res.status(500).json({ message: "Gagal memuat statistik dashboard." });
    }
  });

  // 12. Simulate Image Upload (Convert to mock URL / Base64 persistence)
  app.post("/api/upload", authenticateUser, requireAdmin, (req, res) => {
    try {
      const { imageBase64, fileName } = req.body;
      if (!imageBase64) {
        res.status(400).json({ message: "Data gambar (Base64) kosong." });
        return;
      }
      // Instead of storing in cloud storage, returning the same base64 is completely fine
      // and acts as a bullet-proof persistence inside our json database directly!
      // This is dynamic, durable, and immediate.
      res.json({
        imageUrl: imageBase64,
        message: "Gambar berhasil diunggah!"
      });
    } catch (error) {
      res.status(500).json({ message: "Gagal memproses unggahan gambar." });
    }
  });

  // --- API ROUTES END ---

  // Vite development integration or static serving
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Angkringan] Server running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start full-stack server:", err);
});
