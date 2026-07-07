import http from 'http';
import { parse } from 'url';
import dotenv from 'dotenv';
import path from 'path';

// Carica le variabili d'ambiente da .env
dotenv.config();

const PORT = 3000;

const server = http.createServer(async (req, res) => {
  // Configurazione CORS per sviluppo locale
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-admin-password');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  const parsedUrl = parse(req.url, true);
  const pathname = parsedUrl.pathname;

  console.log(`[API] ${req.method} ${pathname}`);

  let handlerPath = null;
  let query = { ...parsedUrl.query };

  // Mapping dei percorsi alle funzioni serverless Vercel
  if (pathname === '/api/prodotti' || pathname === '/api/prodotti/') {
    handlerPath = './api/prodotti/index.js';
  } else if (pathname === '/api/prodotti/novita') {
    handlerPath = './api/prodotti/novita.js';
  } else if (pathname === '/api/prodotti/shop') {
    handlerPath = './api/prodotti/shop.js';
  } else if (pathname === '/api/ordini' || pathname === '/api/ordini/') {
    handlerPath = './api/ordini.js';
  } else if (pathname === '/api/admin/prodotti' || pathname === '/api/admin/prodotti/') {
    handlerPath = './api/admin/prodotti/index.js';
  } else if (pathname.startsWith('/api/admin/prodotti/')) {
    const parts = pathname.split('/');
    const id = parts[4];
    if (id === 'index') {
      handlerPath = './api/admin/prodotti/index.js';
    } else {
      handlerPath = './api/admin/prodotti/[id].js';
      query.id = id;
    }
  } else if (pathname === '/api/admin/ordini' || pathname === '/api/admin/ordini/') {
    handlerPath = './api/admin/ordini/index.js';
  } else if (pathname.startsWith('/api/admin/ordini/')) {
    const parts = pathname.split('/');
    const id = parts[4];
    if (id === 'index') {
      handlerPath = './api/admin/ordini/index.js';
    } else {
      handlerPath = './api/admin/ordini/[id].js';
      query.id = id;
    }
  } else if (pathname === '/api/admin/upload') {
    handlerPath = './api/admin/upload.js';
  } else if (pathname === '/api/admin/settings/password') {
    handlerPath = './api/admin/settings/password.js';
  }

  if (!handlerPath) {
    res.statusCode = 404;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ success: false, error: `Route non trovata: ${pathname}` }));
    return;
  }

  // Parsing del Body JSON
  let body = {};
  if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
    try {
      const buffers = [];
      for await (const chunk of req) {
        buffers.push(chunk);
      }
      const data = Buffer.concat(buffers).toString();
      if (data) {
        body = JSON.parse(data);
      }
    } catch (err) {
      console.error('Errore parsing body JSON:', err.message);
    }
  }

  // Wrapper per rendere req e res compatibili con le funzioni serverless di Vercel
  const wrappedReq = {
    method: req.method,
    headers: req.headers,
    query,
    body
  };

  const wrappedRes = {
    statusCode: 200,
    status(code) {
      this.statusCode = code;
      res.statusCode = code;
      return this;
    },
    json(data) {
      res.statusCode = this.statusCode;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(data));
      return this;
    },
    send(data) {
      res.statusCode = this.statusCode;
      res.end(data);
      return this;
    }
  };

  // Import dinamico ed esecuzione dell'handler
  try {
    const absolutePath = path.resolve(handlerPath);
    // Aggiunge timestamp per invalidare la cache del modulo se aggiornato in dev
    const module = await import(`${absolutePath}?update=${Date.now()}`);
    const handler = module.default;
    await handler(wrappedReq, wrappedRes);
  } catch (err) {
    console.error(`Errore nell'esecuzione dell'handler per ${pathname}:`, err);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ success: false, error: `Errore Interno del Server: ${err.message}` }));
  }
});

server.listen(PORT, () => {
  console.log(`[DevServer] Mock Server Vercel in esecuzione su http://localhost:${PORT}`);
});
