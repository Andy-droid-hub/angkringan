import fs from "fs";
import path from "path";
import { User, Category, Menu, Order, Banner, Testimonial, Gallery, Promotion, AppSettings, ActivityLog } from "../types";

export interface DatabaseSchema {
  users: User[];
  categories: Category[];
  menus: Menu[];
  orders: Order[];
  banners: Banner[];
  testimonials: Testimonial[];
  galleries: Gallery[];
  promotions: Promotion[];
  settings: AppSettings;
  activityLogs: ActivityLog[];
}

const DB_PATH = path.join(process.cwd(), "data", "db.json");

// Ensure the directory and file exist
export function initDb() {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

export function readDb(): DatabaseSchema {
  initDb();
  if (!fs.existsSync(DB_PATH)) {
    throw new Error(`Database file not found at ${DB_PATH}. Please create it first.`);
  }
  const data = fs.readFileSync(DB_PATH, "utf-8");
  return JSON.parse(data) as DatabaseSchema;
}

export function writeDb(data: DatabaseSchema): void {
  initDb();
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), "utf-8");
}

// Helper to log activities
export function logActivity(userId: string, userName: string, action: string, details: string) {
  try {
    const db = readDb();
    const newLog: ActivityLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      userId,
      userName,
      action,
      details,
      timestamp: new Date().toISOString()
    };
    db.activityLogs.unshift(newLog);
    // Keep logs up to 100 entries to optimize performance
    if (db.activityLogs.length > 100) {
      db.activityLogs = db.activityLogs.slice(0, 100);
    }
    writeDb(db);
  } catch (err) {
    console.error("Failed to log activity:", err);
  }
}
