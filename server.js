/* global process */
import express from 'express';
import cors from 'cors';
import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import multer from 'multer';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Ensure persistent folders exist
const dbDir = path.join(__dirname, 'data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Serve uploads folder statically
app.use('/uploads', express.static(uploadsDir));

// SQLite connection
const dbPath = path.join(dbDir, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

// Promisified SQL helpers
const dbRun = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
};

const dbAll = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

const dbGet = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

// Initialize DB schema & seed data
const initDb = async () => {
  try {
    // Create 'articoli' table with target column
    await dbRun(`
      CREATE TABLE IF NOT EXISTS articoli (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        titolo TEXT NOT NULL,
        descrizione TEXT,
        prezzo REAL NOT NULL,
        immagine_url TEXT,
        target TEXT DEFAULT 'Donna',
        categoria TEXT,
        taglie TEXT,
        attivo INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Check if target column exists for backward compatibility (migration)
    const columns = await dbAll("PRAGMA table_info(articoli)");
    const hasTarget = columns.some(c => c.name === 'target');
    if (!hasTarget) {
      await dbRun("ALTER TABLE articoli ADD COLUMN target TEXT DEFAULT 'Donna'");
      console.log("Database migrated: added 'target' column to 'articoli' table.");
    }

    // Create 'ordini' table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS ordini (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome_cliente TEXT NOT NULL,
        telefono TEXT NOT NULL,
        indirizzo_spedizione TEXT NOT NULL,
        metodo_pagamento TEXT NOT NULL,
        metodo_consegna TEXT NOT NULL,
        totale REAL NOT NULL,
        dettaglio_articoli TEXT NOT NULL,
        stato TEXT DEFAULT 'In attesa',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Seed initial data if articles table is empty
    const articlesCount = await dbGet('SELECT COUNT(*) as count FROM articoli');
    if (articlesCount.count === 0) {
      console.log('Seeding database with default products...');
      const seedProducts = [
        {
          titolo: 'Abito Lungo Floreale Spring',
          descrizione: 'Abito lungo fresco e colorato, ideale per le serate estive. Fantasia floreale accesa.',
          prezzo: 39.90,
          immagine_url: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=600&q=80',
          target: 'Donna',
          categoria: 'Abiti',
          taglie: 'S,M,L'
        },
        {
          titolo: 'Blusa Frizzante Pastel',
          descrizione: 'Blusa in cotone leggero con maniche a sbuffo, colore pastello alla moda.',
          prezzo: 24.90,
          immagine_url: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=600&q=80',
          target: 'Donna',
          categoria: 'Camicie e Bluse',
          taglie: 'M,L'
        },
        {
          titolo: 'Jeans Skinny High Waste',
          descrizione: 'Jeans denim elasticizzato a vita alta, vestibilità perfetta che valorizza la silhouette.',
          prezzo: 34.90,
          immagine_url: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=600&q=80',
          target: 'Donna',
          categoria: 'Pantaloni',
          taglie: 'S,M,L,XL'
        },
        {
          titolo: 'Giacca Kimono Chic',
          descrizione: 'Giacca stile kimono con ricami floreali, perfetta per arricchire un look casual.',
          prezzo: 45.00,
          immagine_url: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=600&q=80',
          target: 'Donna',
          categoria: 'Giacche',
          taglie: 'Unica'
        },
        {
          titolo: 'T-Shirt Segreta Style',
          descrizione: 'T-shirt in cotone biologico con stampa logo e dettagli ricamati in filo dorato.',
          prezzo: 19.90,
          immagine_url: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=600&q=80',
          target: 'Donna',
          categoria: 'T-Shirt',
          taglie: 'S,M,L'
        }
      ];

      for (const prod of seedProducts) {
        await dbRun(
          'INSERT INTO articoli (titolo, descrizione, prezzo, immagine_url, target, categoria, taglie, attivo) VALUES (?, ?, ?, ?, ?, ?, ?, 1)',
          [prod.titolo, prod.descrizione, prod.prezzo, prod.immagine_url, prod.target, prod.categoria, prod.taglie]
        );
      }
      console.log('Seeding completed successfully.');
    }
  } catch (err) {
    console.error('Error during DB initialization:', err);
  }
};

initDb();

// Multer storage setup for image upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname) || '.webp';
    cb(null, 'art-' + uniqueSuffix + ext);
  }
});
const upload = multer({ storage });

// Authentication middleware for admin routes
const adminAuth = (req, res, next) => {
  const password = req.headers['x-admin-password'] || req.headers['authorization']?.split(' ')[1];
  const correctPassword = process.env.VITE_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD || 'Segreta2026';
  
  if (password === correctPassword) {
    next();
  } else {
    res.status(401).json({ success: false, error: 'Password amministratore non corretta o mancante.' });
  }
};

// ==========================================
// PUBLIC ENDPOINTS
// ==========================================

// GET: 8 latest active articles
app.get('/api/prodotti/novita', async (req, res) => {
  try {
    const products = await dbAll('SELECT * FROM articoli WHERE attivo = 1 ORDER BY created_at DESC LIMIT 8');
    res.json({ success: true, data: products });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET: All active articles
app.get('/api/prodotti/shop', async (req, res) => {
  try {
    const products = await dbAll('SELECT * FROM articoli WHERE attivo = 1 ORDER BY id DESC');
    res.json({ success: true, data: products });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST: Place a new order
app.post('/api/ordini', async (req, res) => {
  const {
    nome_cliente,
    telefono,
    indirizzo_spedizione,
    metodo_pagamento,
    metodo_consegna,
    totale,
    dettaglio_articoli
  } = req.body;

  if (!nome_cliente || !telefono || !dettaglio_articoli || totale === undefined) {
    return res.status(400).json({ success: false, error: 'Campi obbligatori dell\'ordine mancanti.' });
  }

  try {
    const result = await dbRun(
      `INSERT INTO ordini (nome_cliente, telefono, indirizzo_spedizione, metodo_pagamento, metodo_consegna, totale, dettaglio_articoli)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [nome_cliente, telefono, indirizzo_spedizione, metodo_pagamento, metodo_consegna, totale, dettaglio_articoli]
    );

    const orderId = result.lastID;
    const newOrder = await dbGet('SELECT * FROM ordini WHERE id = ?', [orderId]);

    res.status(201).json({ success: true, data: newOrder });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==========================================
// ADMIN ENDPOINTS (Protected)
// ==========================================

// GET: All articles (active & inactive)
app.get('/api/admin/prodotti', adminAuth, async (req, res) => {
  try {
    const products = await dbAll('SELECT * FROM articoli ORDER BY id DESC');
    res.json({ success: true, data: products });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST: Add a new article
app.post('/api/admin/prodotti', adminAuth, async (req, res) => {
  const { titolo, descrizione, prezzo, immagine_url, target, categoria, taglie } = req.body;

  if (!titolo || prezzo === undefined || !categoria || !target) {
    return res.status(400).json({ success: false, error: 'Campi obbligatori mancanti (Titolo, Prezzo, Target, Categoria).' });
  }

  const validTarget = target === 'Uomo' ? 'Uomo' : 'Donna';

  try {
    const result = await dbRun(
      'INSERT INTO articoli (titolo, descrizione, prezzo, immagine_url, target, categoria, taglie, attivo) VALUES (?, ?, ?, ?, ?, ?, ?, 1)',
      [titolo, descrizione, parseFloat(prezzo), immagine_url, validTarget, categoria, taglie]
    );

    const newProductId = result.lastID;
    const newProduct = await dbGet('SELECT * FROM articoli WHERE id = ?', [newProductId]);

    res.json({ success: true, data: newProduct });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT: Toggle active status
app.put('/api/admin/prodotti/:id/toggle', adminAuth, async (req, res) => {
  const { id } = req.params;

  try {
    const product = await dbGet('SELECT attivo FROM articoli WHERE id = ?', [id]);
    if (!product) {
      return res.status(404).json({ success: false, error: 'Articolo non trovato.' });
    }

    const nextState = product.attivo ? 0 : 1;
    await dbRun('UPDATE articoli SET attivo = ? WHERE id = ?', [nextState, id]);

    res.json({ success: true, id: Number(id), attivo: nextState === 1 });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE: Delete a product
app.delete('/api/admin/prodotti/:id', adminAuth, async (req, res) => {
  const { id } = req.params;

  try {
    const product = await dbGet('SELECT * FROM articoli WHERE id = ?', [id]);
    if (!product) {
      return res.status(404).json({ success: false, error: 'Articolo non trovato.' });
    }

    await dbRun('DELETE FROM articoli WHERE id = ?', [id]);
    res.json({ success: true, message: 'Articolo eliminato con successo.' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST: Upload image
app.post('/api/admin/upload', adminAuth, upload.single('immagine'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, error: 'File immagine non ricevuto.' });
  }

  const relativeUrl = 'uploads/' + req.file.filename;
  res.json({ success: true, url: relativeUrl });
});

// GET: List all orders (supports ?archivio=true to fetch archived orders only)
app.get('/api/admin/ordini', adminAuth, async (req, res) => {
  try {
    const showArchive = req.query.archivio === 'true';
    const orders = showArchive
      ? await dbAll("SELECT * FROM ordini WHERE stato = 'Archiviato' ORDER BY id DESC")
      : await dbAll("SELECT * FROM ordini WHERE stato != 'Archiviato' ORDER BY id DESC");
    res.json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT: Archive an order (set stato = 'Archiviato')
app.put('/api/admin/ordini/:id/archiviare', adminAuth, async (req, res) => {
  const { id } = req.params;
  try {
    const order = await dbGet('SELECT id, stato FROM ordini WHERE id = ?', [id]);
    if (!order) {
      return res.status(404).json({ success: false, error: 'Ordine non trovato.' });
    }
    await dbRun("UPDATE ordini SET stato = 'Archiviato' WHERE id = ?", [id]);
    res.json({ success: true, id: Number(id), stato: 'Archiviato' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT: Update order state
app.put('/api/admin/ordini/:id/stato', adminAuth, async (req, res) => {
  const { id } = req.params;
  const { stato } = req.body;

  if (!stato) {
    return res.status(400).json({ success: false, error: 'Stato ordine mancante.' });
  }

  try {
    const order = await dbGet('SELECT id FROM ordini WHERE id = ?', [id]);
    if (!order) {
      return res.status(404).json({ success: false, error: 'Ordine non trovato.' });
    }

    await dbRun('UPDATE ordini SET stato = ? WHERE id = ?', [stato, id]);
    res.json({ success: true, id: Number(id), stato });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE: Cancel/delete order
app.delete('/api/admin/ordini/:id', adminAuth, async (req, res) => {
  const { id } = req.params;

  try {
    const order = await dbGet('SELECT id FROM ordini WHERE id = ?', [id]);
    if (!order) {
      return res.status(404).json({ success: false, error: 'Ordine non trovato.' });
    }

    await dbRun('DELETE FROM ordini WHERE id = ?', [id]);
    res.json({ success: true, message: 'Ordine eliminato con successo.' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==========================================
// PRODUCTION FRONTEND SERVING
// ==========================================
const distPath = path.join(__dirname, 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.use((req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// Start Server
app.listen(PORT, () => {
  console.log(`Server Express in esecuzione su http://localhost:${PORT}`);
});
