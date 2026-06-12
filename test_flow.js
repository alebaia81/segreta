/* global Buffer, process */
import fs from 'fs';
import path from 'path';
import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API_BASE = 'http://localhost:3000/api';
const ADMIN_PASSWORD = 'Segreta2026';

async function runTests() {
  console.log('=== INIZIO SCENARIO DI TEST Segreta Style ===\n');

  try {
    // 1. Simula la compressione client-side
    console.log('[1/6] Simulazione compressione client-side...');
    // In un browser reale, browser-image-compression prende un file e restituisce un Blob WebP.
    // Simuliamo questo creando un buffer binario finto con estensione .webp.
    const mockWebpBuffer = Buffer.from('RIFF....WEBPVP8 ', 'utf-8');
    const mockWebpBlob = new Blob([mockWebpBuffer], { type: 'image/webp' });
    console.log(' -> Creato Blob finto di tipo image/webp, dimensione:', mockWebpBlob.size, 'bytes');

    // 2. Invio immagine compressa al backend (Upload)
    console.log('\n[2/6] Invio richiesta multipart/form-data (Upload)...');
    const formData = new FormData();
    formData.append('immagine', mockWebpBlob, 'abito-frizzante.webp');

    const uploadRes = await fetch(`${API_BASE}/admin/upload`, {
      method: 'POST',
      headers: {
        'x-admin-password': ADMIN_PASSWORD
      },
      body: formData
    });

    const uploadJson = await uploadRes.json();
    if (!uploadJson.success) {
      throw new Error(`Upload fallito: ${uploadJson.error}`);
    }
    console.log(' -> Upload riuscito con successo!');
    console.log(' -> URL immagine restituito:', uploadJson.url);
    const uploadedImageUrl = uploadJson.url;

    // 3. Creazione prodotto "Abito Frizzante Estivo"
    console.log('\n[3/6] Inserimento nuovo articolo via API...');
    const nuovoProdotto = {
      titolo: 'Abito Frizzante Estivo',
      descrizione: 'Abito leggero in cotone biologico, perfetto per le giornate calde.',
      prezzo: 49.90,
      immagine_url: uploadedImageUrl,
      target: 'Donna',
      categoria: 'Abiti',
      taglie: 'S,M,L'
    };

    const addRes = await fetch(`${API_BASE}/admin/prodotti`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-password': ADMIN_PASSWORD
      },
      body: JSON.stringify(nuovoProdotto)
    });

    const addJson = await addRes.json();
    if (!addJson.success) {
      throw new Error(`Inserimento prodotto fallito: ${addJson.error}`);
    }
    console.log(' -> Prodotto inserito con successo!');
    console.log(' -> Dati prodotto:', JSON.stringify(addJson.data, null, 2));
    const prodottoId = addJson.data.id;

    // 4. Verifica nel database SQLite
    console.log('\n[4/6] Verifica diretta nel database SQLite...');
    const dbPath = path.join(__dirname, 'data', 'database.sqlite');
    const db = new sqlite3.Database(dbPath);

    const getProductFromDb = () => {
      return new Promise((resolve, reject) => {
        db.get('SELECT * FROM articoli WHERE id = ?', [prodottoId], (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
      });
    };

    const dbRow = await getProductFromDb();
    console.log(' -> Riga trovata nel database SQLite:');
    console.log(JSON.stringify(dbRow, null, 2));

    if (dbRow && dbRow.titolo === 'Abito Frizzante Estivo' && dbRow.attivo === 1) {
      console.log(' -> VERIFICA OK: Prodotto salvato correttamente e impostato come ATTIVO.');
    } else {
      throw new Error('VERIFICA FALLITA: Dati nel database non corrispondenti o non attivo.');
    }

    // 5. Test Toggle Stato (Stock esaurito)
    console.log(`\n[5/6] Test switch dello stock (Toggle Attivo) per ID ${prodottoId}...`);
    const toggleRes = await fetch(`${API_BASE}/admin/prodotti/${prodottoId}/toggle`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-password': ADMIN_PASSWORD
      }
    });

    const toggleJson = await toggleRes.json();
    if (!toggleJson.success) {
      throw new Error(`Toggle fallito: ${toggleJson.error}`);
    }
    console.log(' -> Risposta Toggle API:', JSON.stringify(toggleJson, null, 2));

    // 6. Verifica dello stato modificato sul DB
    console.log('\n[6/6] Verifica dello stato modificato nel database SQLite...');
    const updatedDbRow = await getProductFromDb();
    console.log(' -> Riga aggiornata nel database SQLite:');
    console.log(JSON.stringify(updatedDbRow, null, 2));

    if (updatedDbRow && updatedDbRow.attivo === 0) {
      console.log(' -> VERIFICA OK: Lo stato del prodotto è stato disattivato correttamente sul DB (attivo = 0).');
    } else {
      throw new Error('VERIFICA FALLITA: Lo stato del prodotto non è cambiato sul DB.');
    }

    // Pulisci il database rimuovendo l'articolo di test per non sporcare il catalogo
    console.log('\n[PULIZIA] Rimozione dell\'articolo di test dal database...');
    await new Promise((resolve, reject) => {
      db.run('DELETE FROM articoli WHERE id = ?', [prodottoId], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    console.log(' -> Riga eliminata dal database.');

    // Rimuovi anche l'immagine di test
    const localImgPath = path.join(__dirname, uploadedImageUrl);
    if (fs.existsSync(localImgPath)) {
      fs.unlinkSync(localImgPath);
      console.log(' -> File immagine di test rimosso da uploads.');
    }

    db.close();
    console.log('\n=== TEST COMPLETATO CON SUCCESSO! IL FLUSSO È STABILE ===');

  } catch (error) {
    console.error('\n❌ ERRORE DURANTE IL TEST DI FLUSSO:', error.message);
    process.exit(1);
  }
}

runTests();
