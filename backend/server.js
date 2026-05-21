import express from 'express';
import cors from 'cors';
import sqlite3 from 'sqlite3';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import path from 'path';

const dataDir = './data';
const uploadsDir = './data/uploads';
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const app = express();
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(process.cwd(), 'data', 'uploads')));

const JWT_SECRET = 'erp-secret-key-2026';

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({ storage });

const db = new sqlite3.Database('./data/database.sqlite', (err) => {
  if (err) console.error("Error opening database " + err.message);
  else {
    db.serialize(() => {
      db.run(`CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'user',
        color TEXT,
        avatar TEXT,
        resetToken TEXT,
        resetTokenExpiry INTEGER
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS clients (id TEXT PRIMARY KEY, name TEXT NOT NULL)`);

      db.run(`CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY,
        clientId TEXT,
        name TEXT NOT NULL,
        type TEXT NOT NULL, 
        assignedHours REAL,
        startDate TEXT,
        endDate TEXT,
        FOREIGN KEY(clientId) REFERENCES clients(id)
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        userIds TEXT,
        projectId TEXT,
        content TEXT NOT NULL,
        description TEXT,
        priority TEXT DEFAULT 'Media',
        deadline TEXT,
        estimatedTime REAL DEFAULT 0,
        status TEXT NOT NULL,
        attachments TEXT,
        tags TEXT,
        archived INTEGER DEFAULT 0,
        statusChangedAt TEXT,
        FOREIGN KEY(projectId) REFERENCES projects(id)
      )`);

      // Migraciones manuales para bases de datos existentes
      db.run("ALTER TABLE tasks ADD COLUMN archived INTEGER DEFAULT 0", () => {});
      db.run("ALTER TABLE tasks ADD COLUMN statusChangedAt TEXT", () => {});
      db.run("ALTER TABLE tasks ADD COLUMN tags TEXT", () => {});
      db.run("ALTER TABLE projects ADD COLUMN archived INTEGER DEFAULT 0", () => {});

      db.run(`CREATE TABLE IF NOT EXISTS time_entries (
        id TEXT PRIMARY KEY,
        taskId TEXT NOT NULL,
        userId TEXT NOT NULL,
        timeAdded REAL NOT NULL,
        createdAt TEXT NOT NULL,
        FOREIGN KEY(taskId) REFERENCES tasks(id),
        FOREIGN KEY(userId) REFERENCES users(id)
      )`);

      // Índices para mejorar rendimiento
      db.run("CREATE INDEX IF NOT EXISTS idx_tasks_status_archived ON tasks(status, archived)");
      db.run("CREATE INDEX IF NOT EXISTS idx_time_entries_taskId ON time_entries(taskId)");
      db.run("CREATE INDEX IF NOT EXISTS idx_time_entries_userId ON time_entries(userId)");
    });
  }
});

let lastArchiveCheck = 0;

// Seed Initial Data
app.get('/reset', async (req, res) => {
  db.serialize(async () => {
    db.run("DELETE FROM time_entries");
    db.run("DELETE FROM tasks");
    db.run("DELETE FROM projects");
    db.run("DELETE FROM users");
    db.run("DELETE FROM clients");

    const adminHash = bcrypt.hashSync("admin123", 10);
    const userHash = bcrypt.hashSync("user123", 10);

    const uAdmin = uuidv4(); const uLuis = uuidv4(); const uPablo = uuidv4(); const uGerman = uuidv4(); const uJordi = uuidv4();

    db.run("INSERT INTO users (id, name, email, password, role, color) VALUES (?, ?, ?, ?, ?, ?)", [uAdmin, "Jaime (Boss)", "jaime@pyramica.com", adminHash, "admin", "#ff79c6"]);
    db.run("INSERT INTO users (id, name, email, password, role, color) VALUES (?, ?, ?, ?, ?, ?)", [uLuis, "Luis", "luis@pyramica.com", userHash, "user", "#50fa7b"]);
    db.run("INSERT INTO users (id, name, email, password, role, color) VALUES (?, ?, ?, ?, ?, ?)", [uPablo, "Pablo", "pablo@pyramica.com", userHash, "user", "#8be9fd"]);
    db.run("INSERT INTO users (id, name, email, password, role, color) VALUES (?, ?, ?, ?, ?, ?)", [uGerman, "Germán", "german@pyramica.com", userHash, "user", "#ffb86c"]);
    db.run("INSERT INTO users (id, name, email, password, role, color) VALUES (?, ?, ?, ?, ?, ?)", [uJordi, "Jordi", "jordi@pyramica.com", userHash, "user", "#bd93f9"]);

    const c1 = uuidv4();
    db.run("INSERT INTO clients (id, name) VALUES (?, ?)", [c1, "Pyramica S.L."]);

    const pMantenimiento1 = uuidv4(); const pMantenimiento2 = uuidv4(); const pDesarrollo1 = uuidv4(); const pDesarrollo2 = uuidv4();

    db.run("INSERT INTO projects (id, clientId, name, type, assignedHours) VALUES (?, ?, ?, ?, ?)", [pMantenimiento1, c1, "Mantenimiento Servidores", "maintenance", 20]);
    db.run("INSERT INTO projects (id, clientId, name, type, assignedHours) VALUES (?, ?, ?, ?, ?)", [pMantenimiento2, c1, "Soporte Redes Sociales", "maintenance", 10]);
    db.run("INSERT INTO projects (id, clientId, name, type, startDate, endDate) VALUES (?, ?, ?, ?, ?, ?)", [pDesarrollo1, c1, "Nueva Web E-commerce", "development", "2026-05-01", "2026-08-01"]);
    db.run("INSERT INTO projects (id, clientId, name, type, startDate, endDate) VALUES (?, ?, ?, ?, ?, ?)", [pDesarrollo2, c1, "App Móvil Interna", "development", "2026-06-15", "2026-12-01"]);

    const taskTemplates = [
      { p: pMantenimiento1, c: "Revisar logs del servidor", u: [uPablo, uLuis], s: "done", t: [{uid: uPablo, s: 3600*2}, {uid: uLuis, s: 3600*1.5}] },
      { p: pMantenimiento1, c: "Actualizar parches de seguridad", u: [uPablo, uAdmin], s: "inProgress", t: [{uid: uPablo, s: 3600*1}, {uid: uAdmin, s: 3600*0.2}] },
      { p: pMantenimiento1, c: "Optimizar base de datos", u: [uJordi], s: "todo", t: [] },
      { p: pMantenimiento2, c: "Crear posts de Instagram", u: [uGerman, uJordi], s: "todo", t: [] },
      { p: pMantenimiento2, c: "Responder comentarios FB", u: [uGerman], s: "done", t: [{uid: uGerman, s: 3600*4.1}] },
      { p: pMantenimiento2, c: "Diseñar banners publicitarios", u: [uJordi], s: "inProgress", t: [{uid: uJordi, s: 3600*5.8}] },
      { p: pDesarrollo1, c: "Diseño UX/UI de la tienda", u: [uLuis, uGerman], s: "done", t: [{uid: uGerman, s: 3600*15.5}, {uid: uLuis, s: 3600*5}] },
      { p: pDesarrollo1, c: "Programar carrito", u: [uPablo], s: "inProgress", t: [{uid: uPablo, s: 3600*8.2}] },
      { p: pDesarrollo1, c: "Integrar pasarela de pago", u: [uPablo, uAdmin], s: "todo", t: [] },
      { p: pDesarrollo1, c: "Testing pasarela", u: [uJordi, uLuis], s: "todo", t: [] },
      { p: pDesarrollo2, c: "Reunión de requisitos App", u: [uAdmin, uLuis, uGerman, uJordi, uPablo], s: "done", t: [{uid: uAdmin, s: 3600}, {uid: uLuis, s: 3600}, {uid: uGerman, s: 3600}, {uid: uJordi, s: 3600}, {uid: uPablo, s: 3600}] },
      { p: pDesarrollo2, c: "Configurar React Native", u: [uPablo, uLuis], s: "inProgress", t: [{uid: uPablo, s: 3600*2}, {uid: uLuis, s: 3600*1}] },
      { p: pDesarrollo2, c: "Mockups de la App", u: [uGerman], s: "inProgress", t: [{uid: uGerman, s: 3600*3.5}] },
    ];

    taskTemplates.forEach(tt => {
      const id = uuidv4();
      const userIdsStr = JSON.stringify(tt.u);
      db.run(`INSERT INTO tasks (id, userIds, projectId, content, status, priority) VALUES (?, ?, ?, ?, ?, ?)`, 
        [id, userIdsStr, tt.p, tt.c, tt.s, ['Alta', 'Media', 'Baja'][Math.floor(Math.random()*3)]]
      );
      tt.t.forEach(entry => {
        db.run(`INSERT INTO time_entries (id, taskId, userId, timeAdded, createdAt) VALUES (?, ?, ?, ?, ?)`,
          [uuidv4(), id, entry.uid, entry.s, new Date().toISOString()]
        );
      });
    });
    
    res.json({ message: "Seed completado. Mock Data Masivo Generado con TimeEntries." });
  });
});

// Auth Routes
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  db.get("SELECT * FROM users WHERE email = ?", [email], (err, user) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!user) return res.status(401).json({ error: "Usuario no encontrado" });
    if (!bcrypt.compareSync(password, user.password)) return res.status(401).json({ error: "Contraseña incorrecta" });
    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
    const { password: _, resetToken, resetTokenExpiry, ...safeUser } = user;
    res.json({ token, user: safeUser });
  });
});

app.post('/api/auth/register', (req, res) => {
  const { name, email, password, role } = req.body;
  const id = uuidv4();
  const hash = bcrypt.hashSync(password, 10);
  db.run("INSERT INTO users (id, name, email, password, role, color) VALUES (?, ?, ?, ?, ?, ?)", 
    [id, name, email, hash, role || 'user', '#f8f8f2'], 
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id, name, email, role: role || 'user' });
    }
  );
});

app.put('/api/users/:id', (req, res) => {
  const { name, email, password, avatar, role } = req.body;
  const targetRole = role || 'user'; // Defaults to user if not provided, but we don't always update it if it's a self-profile update.
  
  if (password) {
    const hash = bcrypt.hashSync(password, 10);
    if (role) {
      db.run("UPDATE users SET name=?, email=?, password=?, avatar=?, role=? WHERE id=?", [name, email, hash, avatar || null, role, req.params.id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ updated: true });
      });
    } else {
      db.run("UPDATE users SET name=?, email=?, password=?, avatar=? WHERE id=?", [name, email, hash, avatar || null, req.params.id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ updated: true });
      });
    }
  } else {
    if (role) {
      db.run("UPDATE users SET name=?, email=?, avatar=?, role=? WHERE id=?", [name, email, avatar || null, role, req.params.id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ updated: true });
      });
    } else {
      db.run("UPDATE users SET name=?, email=?, avatar=? WHERE id=?", [name, email, avatar || null, req.params.id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ updated: true });
      });
    }
  }
});

app.put('/api/users/:id/password', (req, res) => {
  const { password } = req.body;
  if (!password) return res.status(400).json({ error: "Contraseña requerida" });
  const hash = bcrypt.hashSync(password, 10);
  db.run("UPDATE users SET password=? WHERE id=?", [hash, req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "Contraseña actualizada correctamente" });
  });
});

app.post('/api/auth/recover-password', (req, res) => {
  const { email } = req.body;
  db.get("SELECT id FROM users WHERE email = ?", [email], (err, user) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!user) return res.status(404).json({ error: "Si el correo existe, se han enviado las instrucciones." });
    console.log(`[Recuperación Simulada] Correo enviado a ${email}`);
    res.json({ message: "Si el correo existe, se han enviado las instrucciones." });
  });
});

// GET All Data
app.get('/data', (req, res) => {
  const result = { users: [], clients: [], projects: [], tasks: [], timeEntries: [] };
  
  // Auto-archive logic: run only once per hour to avoid Disk I/O contention on Windows/Docker
  const now = Date.now();
  if (now - lastArchiveCheck > 3600000) { 
    lastArchiveCheck = now;
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    db.run("UPDATE tasks SET archived = 1 WHERE status = 'done' AND archived = 0 AND (statusChangedAt < ? OR statusChangedAt IS NULL)", [sevenDaysAgo.toISOString()]);
  }

  db.all("SELECT id, name, email, role, color, avatar FROM users", [], (err, rows) => {
    result.users = rows || [];
    db.all("SELECT * FROM clients", [], (err, rows) => {
      result.clients = rows || [];
      db.all("SELECT * FROM projects", [], (err, rows) => {
        result.projects = rows || [];
        db.all("SELECT * FROM tasks", [], (err, rows) => {
          result.tasks = rows || [];
          db.all("SELECT * FROM time_entries", [], (err, rows) => {
            result.timeEntries = rows || [];
            res.json(result);
          });
        });
      });
    });
  });
});

// --- PROJECTS ---
app.post('/projects', (req, res) => {
  const { name, type, assignedHours, clientId, startDate, endDate } = req.body;
  const id = uuidv4();
  db.run(`INSERT INTO projects (id, clientId, name, type, assignedHours, startDate, endDate) VALUES (?, ?, ?, ?, ?, ?, ?)`, 
    [id, clientId || null, name, type || 'general', assignedHours || 0, startDate || null, endDate || null], 
    function(err) {
      if (err) return res.status(500).json({error: err.message});
      res.json({ id, clientId: clientId || null, name, type: type || 'general', assignedHours: assignedHours || 0, startDate: startDate || null, endDate: endDate || null });
    }
  );
});

app.put('/projects/:id', (req, res) => {
  const { name, type, assignedHours, startDate, endDate } = req.body;
  db.run(`UPDATE projects SET name=?, type=?, assignedHours=?, startDate=?, endDate=? WHERE id=?`, 
    [name, type, assignedHours || 0, startDate || null, endDate || null, req.params.id], 
    function(err) {
      if (err) return res.status(500).json({error: err.message});
      res.json({ updated: true });
    }
  );
});

app.delete('/projects/:id', (req, res) => {
  db.serialize(() => {
    db.run(`DELETE FROM time_entries WHERE taskId IN (SELECT id FROM tasks WHERE projectId = ?)`, [req.params.id]);
    db.run(`DELETE FROM tasks WHERE projectId = ?`, [req.params.id]);
    db.run(`DELETE FROM projects WHERE id = ?`, [req.params.id], function(err) {
      if (err) return res.status(500).json({error: err.message});
      res.json({ deleted: true });
    });
  });
});

app.put('/api/projects/:id/archive', (req, res) => {
  const { archived } = req.body;
  db.run(`UPDATE projects SET archived = ? WHERE id = ?`, [archived ? 1 : 0, req.params.id], function(err) {
    if (err) return res.status(500).json({error: err.message});
    res.json({ updated: true, archived: archived ? 1 : 0 });
  });
});

// --- TASKS ---
app.post('/tasks', (req, res) => {
  const { content, userIds, projectId, status, description, priority, deadline, estimatedTime, tags } = req.body;
  const id = uuidv4();
  const userIdsStr = JSON.stringify(userIds || []);
  const tagsStr = JSON.stringify(tags || []);
  const now = new Date().toISOString();
  db.run(`INSERT INTO tasks (id, userIds, projectId, content, description, priority, deadline, estimatedTime, status, statusChangedAt, tags) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
    [id, userIdsStr, projectId, content, description || '', priority || 'Media', deadline || null, estimatedTime || 0, status, now, tagsStr], 
    function(err) {
      if (err) return res.status(500).json({error: err.message});
      res.json({ id, userIds: userIds || [], projectId, content, description: description || '', priority: priority || 'Media', deadline: deadline || null, estimatedTime: estimatedTime || 0, status, attachments: null, tags: tags || [] });
    }
  );
});

app.put('/tasks/:id', (req, res) => {
  const { content, userIds, description, priority, deadline, estimatedTime, tags } = req.body;
  const userIdsStr = JSON.stringify(userIds || []);
  const tagsStr = JSON.stringify(tags || []);
  db.run(`UPDATE tasks SET content=?, userIds=?, description=?, priority=?, deadline=?, estimatedTime=?, tags=? WHERE id=?`, 
    [content, userIdsStr, description || '', priority, deadline, estimatedTime, tagsStr, req.params.id], 
    function(err) {
      if (err) return res.status(500).json({error: err.message});
      res.json({ updated: true });
    }
  );
});

app.post('/tasks/:id/attachments', upload.array('files'), (req, res) => {
  const newPaths = req.files.map(f => `/uploads/${f.filename}`);
  db.get(`SELECT attachments FROM tasks WHERE id = ?`, [req.params.id], (err, row) => {
    if (err) return res.status(500).json({error: err.message});
    let current = [];
    if (row && row.attachments) { try { current = JSON.parse(row.attachments); } catch(e){} }
    const updatedAttachments = JSON.stringify([...current, ...newPaths]);
    db.run(`UPDATE tasks SET attachments = ? WHERE id = ?`, [updatedAttachments, req.params.id], function(err) {
      if (err) return res.status(500).json({error: err.message});
      res.json({ attachments: updatedAttachments });
    });
  });
});

app.put('/tasks/:id/status', (req, res) => {
  const { status } = req.body;
  const now = new Date().toISOString();
  db.run(`UPDATE tasks SET status = ?, statusChangedAt = ? WHERE id = ?`, [status, now, req.params.id], function(err) {
    if (err) return res.status(500).json({error: err.message});
    res.json({ updated: req.params.id, status, statusChangedAt: now });
  });
});

app.put('/api/tasks/:id/archive', (req, res) => {
  const { archived } = req.body;
  db.run(`UPDATE tasks SET archived = ? WHERE id = ?`, [archived ? 1 : 0, req.params.id], function(err) {
    if (err) return res.status(500).json({error: err.message});
    res.json({ updated: true, archived: archived ? 1 : 0 });
  });
});

// --- TIME ENTRIES ---
app.post('/tasks/:id/time-entries', (req, res) => {
  const { userId, timeAdded } = req.body;
  const entryId = uuidv4();
  const createdAt = new Date().toISOString();
  db.run(`INSERT INTO time_entries (id, taskId, userId, timeAdded, createdAt) VALUES (?, ?, ?, ?, ?)`, 
    [entryId, req.params.id, userId, timeAdded, createdAt], 
    function(err) {
      if (err) return res.status(500).json({error: err.message});
      res.json({ id: entryId, taskId: req.params.id, userId, timeAdded, createdAt });
    }
  );
});

app.delete('/time-entries/:id', (req, res) => {
  db.run(`DELETE FROM time_entries WHERE id = ?`, [req.params.id], function(err) {
    if (err) return res.status(500).json({error: err.message});
    res.json({ deleted: true });
  });
});

app.listen(3000, () => {
    console.log('Backend listening on port 3000');
});
