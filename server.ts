import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("crm.db");

// Initialize Database Schema
db.exec(`
  CREATE TABLE IF NOT EXISTS roles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE,
    level INTEGER,
    permissions TEXT -- JSON string
  );

  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT,
    role_id INTEGER,
    department TEXT,
    FOREIGN KEY(role_id) REFERENCES roles(id)
  );

  CREATE TABLE IF NOT EXISTS leads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    contact_person TEXT,
    phone TEXT,
    email TEXT,
    source TEXT,
    level TEXT,
    status TEXT DEFAULT '未跟进',
    owner_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_deleted INTEGER DEFAULT 0,
    deleted_at DATETIME,
    FOREIGN KEY(owner_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    type TEXT,
    industry TEXT,
    contact_person TEXT,
    phone TEXT,
    address TEXT,
    level TEXT,
    status TEXT DEFAULT '合作中',
    owner_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_deleted INTEGER DEFAULT 0,
    deleted_at DATETIME,
    FOREIGN KEY(owner_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS opportunities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    customer_id INTEGER,
    stage TEXT,
    probability INTEGER,
    amount REAL,
    expected_date DATE,
    description TEXT,
    owner_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_deleted INTEGER DEFAULT 0,
    deleted_at DATETIME,
    FOREIGN KEY(customer_id) REFERENCES customers(id),
    FOREIGN KEY(owner_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS contracts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    contract_no TEXT UNIQUE,
    name TEXT,
    customer_id INTEGER,
    opportunity_id INTEGER,
    type TEXT,
    amount REAL,
    payment_method TEXT,
    sign_date DATE,
    expiry_date DATE,
    status TEXT DEFAULT '草稿',
    owner_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_deleted INTEGER DEFAULT 0,
    deleted_at DATETIME,
    FOREIGN KEY(customer_id) REFERENCES customers(id),
    FOREIGN KEY(opportunity_id) REFERENCES opportunities(id),
    FOREIGN KEY(owner_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS activities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    type TEXT,
    channel TEXT,
    start_time DATETIME,
    end_time DATETIME,
    location TEXT,
    details TEXT,
    budget REAL,
    status TEXT DEFAULT '策划中',
    owner_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_deleted INTEGER DEFAULT 0,
    deleted_at DATETIME,
    FOREIGN KEY(owner_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    entity_type TEXT, -- 'lead', 'customer', 'opportunity', 'contract', 'activity'
    entity_id INTEGER,
    user_id INTEGER,
    content TEXT,
    parent_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS follow_ups (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    entity_type TEXT,
    entity_id INTEGER,
    method TEXT,
    result TEXT,
    content TEXT,
    next_step_time DATETIME,
    user_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );
`);

// Seed initial data if empty
const roleCount = db.prepare("SELECT COUNT(*) as count FROM roles").get() as { count: number };
if (roleCount.count === 0) {
  const insertRole = db.prepare("INSERT INTO roles (name, level, permissions) VALUES (?, ?, ?)");
  insertRole.run("超级管理员", 1, JSON.stringify({ all: true }));
  insertRole.run("部门管理员", 2, JSON.stringify({ dept: true }));
  insertRole.run("普通员工", 3, JSON.stringify({ self: true }));
  insertRole.run("只读用户", 4, JSON.stringify({ read: true }));

  const adminRole = db.prepare("SELECT id FROM roles WHERE name = '超级管理员'").get() as { id: number };
  db.prepare("INSERT INTO users (username, password, role_id, department) VALUES (?, ?, ?, ?)").run("admin", "admin123", adminRole.id, "总部");

  // Seed some leads
  const insertLead = db.prepare("INSERT INTO leads (name, contact_person, phone, email, source, level, status, owner_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
  insertLead.run("Tech Solutions Inc", "Alice Smith", "123-456-7890", "alice@tech.com", "官网", "A", "跟进中", 1);
  insertLead.run("Green Energy Co", "Bob Brown", "098-765-4321", "bob@green.com", "推荐", "B", "未跟进", 1);

  // Seed some customers
  const insertCustomer = db.prepare("INSERT INTO customers (name, type, industry, contact_person, phone, address, level, status, owner_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
  insertCustomer.run("Global Logistics", "企业", "物流", "Charlie Davis", "555-0199", "123 Main St", "VIP", "合作中", 1);

  // Seed some opportunities
  const insertOpportunity = db.prepare("INSERT INTO opportunities (name, customer_id, stage, probability, amount, expected_date, owner_id) VALUES (?, ?, ?, ?, ?, ?, ?)");
  insertOpportunity.run("Q1 Software Upgrade", 1, "初步沟通", 20, 50000, "2026-06-01", 1);
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/me", (req, res) => {
    // Mocked auth for demo
    const user = db.prepare(`
      SELECT u.*, r.name as role_name, r.level as role_level, r.permissions 
      FROM users u 
      JOIN roles r ON u.role_id = r.id 
      WHERE u.username = 'admin'
    `).get();
    res.json(user);
  });

  // Generic List API
  app.get("/api/:module", (req, res) => {
    const { module } = req.params;
    const validModules = ['leads', 'customers', 'opportunities', 'contracts', 'activities'];
    if (!validModules.includes(module)) return res.status(404).json({ error: "Invalid module" });

    const { q, status, owner_id, is_deleted = 0 } = req.query;
    let sql = `SELECT * FROM ${module} WHERE is_deleted = ?`;
    const params: any[] = [is_deleted];

    if (q) {
      sql += ` AND (name LIKE ? OR contact_person LIKE ?)`;
      params.push(`%${q}%`, `%${q}%`);
    }
    if (status) {
      sql += ` AND status = ?`;
      params.push(status);
    }

    sql += ` ORDER BY created_at DESC`;
    const data = db.prepare(sql).all(...params);
    res.json(data);
  });

  // Create API
  app.post("/api/:module", (req, res) => {
    const { module } = req.params;
    const fields = Object.keys(req.body);
    const placeholders = fields.map(() => "?").join(",");
    const values = Object.values(req.body);

    const sql = `INSERT INTO ${module} (${fields.join(",")}) VALUES (${placeholders})`;
    const result = db.prepare(sql).run(...values);
    res.json({ id: result.lastInsertRowid });
  });

  // Update API
  app.put("/api/:module/:id", (req, res) => {
    const { module, id } = req.params;
    const fields = Object.keys(req.body);
    const setClause = fields.map(f => `${f} = ?`).join(",");
    const values = [...Object.values(req.body), id];

    const sql = `UPDATE ${module} SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
    db.prepare(sql).run(...values);
    res.json({ success: true });
  });

  // Soft Delete API
  app.delete("/api/:module/:id", (req, res) => {
    const { module, id } = req.params;
    const sql = `UPDATE ${module} SET is_deleted = 1, deleted_at = CURRENT_TIMESTAMP WHERE id = ?`;
    db.prepare(sql).run(id);
    res.json({ success: true });
  });

  // Comments API
  app.get("/api/comments/:type/:id", (req, res) => {
    const { type, id } = req.params;
    const comments = db.prepare(`
      SELECT c.*, u.username 
      FROM comments c 
      JOIN users u ON c.user_id = u.id 
      WHERE entity_type = ? AND entity_id = ? 
      ORDER BY created_at DESC
    `).all(type, id);
    res.json(comments);
  });

  app.post("/api/comments", (req, res) => {
    const { entity_type, entity_id, user_id, content, parent_id } = req.body;
    const result = db.prepare(`
      INSERT INTO comments (entity_type, entity_id, user_id, content, parent_id) 
      VALUES (?, ?, ?, ?, ?)
    `).run(entity_type, entity_id, user_id, content, parent_id);
    res.json({ id: result.lastInsertRowid });
  });

  // Stats API
  app.get("/api/stats/opportunities", (req, res) => {
    const stats = db.prepare(`
      SELECT stage, COUNT(*) as count, SUM(amount) as total_amount 
      FROM opportunities 
      WHERE is_deleted = 0 
      GROUP BY stage
    `).all();
    res.json(stats);
  });

  // Restore API
  app.post("/api/:module/:id/restore", (req, res) => {
    const { module, id } = req.params;
    const sql = `UPDATE ${module} SET is_deleted = 0, deleted_at = NULL WHERE id = ?`;
    db.prepare(sql).run(id);
    res.json({ success: true });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
