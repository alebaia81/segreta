import { useState, useEffect, useCallback } from 'react';
import { Package, ClipboardList, PlusCircle, Trash, ToggleLeft, ToggleRight, Lock, Upload, Loader, LogOut, Archive, Download, RotateCcw } from 'lucide-react';
import imageCompression from 'browser-image-compression';

const TARGET_CATEGORIES = {
  Donna: [
    'Abiti',
    'Accessori',
    'Camicie e Bluse',
    'Giacche e Cappotti',
    'Gonne',
    'Maglieria',
    'Pantaloni',
    'T-Shirt'
  ],
  Uomo: [
    'Accessori',
    'Camicie',
    'Giacche e Cappotti',
    'Maglieria',
    'Pantaloni',
    'T-Shirt'
  ]
};

const PRESET_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '38', '40', '42', '44', '46', '48', 'Unica'];

export default function AdminDashboard({ articoli, onAddArticolo, onToggleArticolo }) {
  const [activeTab, setActiveTab] = useState('ordini');
  const [isLoggedIn, setIsLoggedIn] = useState(() => sessionStorage.getItem('segreta_admin_logged') === 'true');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState(false);

  // Stati locali per gestione CRUD via API PHP
  const [articoliAPI, setArticoliAPI] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isAPIAvailable, setIsAPIAvailable] = useState(true);



  // Stati locali per la selezione delle taglie tramite checkbox/flag
  const [selectedSizes, setSelectedSizes] = useState({
    S: true,
    M: true,
    L: true
  });
  const [customSizesList, setCustomSizesList] = useState([]);
  const [newCustomSizeInput, setNewCustomSizeInput] = useState('');

  // Ordini caricati dall'API Node (o localStorage in caso di fallback offline)
  const [ordini, setOrdini] = useState([]);
  const [mostraArchivio, setMostraArchivio] = useState(false);

  // Stato per l'inserimento di un nuovo articolo
  const [nuovoArticolo, setNuovoArticolo] = useState({
    titolo: '',
    descrizione: '',
    prezzo: '',
    immagine_url: '',
    target: 'Donna',
    categoria: '',
    taglie: 'S,M,L'
  });

  // --- ACCESSIBILITÀ & SEO (noindex/nofollow) ---
  useEffect(() => {
    // Aggiungi meta tag noindex, nofollow all'head quando si monta il pannello admin
    const metaRobots = document.createElement('meta');
    metaRobots.name = 'robots';
    metaRobots.content = 'noindex, nofollow';
    metaRobots.id = 'admin-noindex-meta';
    document.head.appendChild(metaRobots);

    return () => {
      // Pulisci il meta tag robots allo smontaggio del componente
      const meta = document.getElementById('admin-noindex-meta');
      if (meta) {
        document.head.removeChild(meta);
      }
    };
  }, []);

  const fetchArticoli = useCallback(async () => {
    setLoading(true);
    try {
      const pass = sessionStorage.getItem('segreta_admin_password') || password;
      const response = await fetch('/api/admin/prodotti', {
        headers: {
          'x-admin-password': pass
        }
      });
      if (response.status === 401) {
        setIsAPIAvailable(true);
        return;
      }
      const json = await response.json();
      if (json.success) {
        setArticoliAPI(json.data);
        setIsAPIAvailable(true);
      } else {
        throw new Error('API non riuscita');
      }
    } catch (err) {
      console.warn('Connessione API fallita. Fallback su dati locali/localStorage.', err);
      setIsAPIAvailable(false);
    } finally {
      setLoading(false);
    }
  }, [password]);

  const fetchOrdini = useCallback(async (archivio = false) => {
    try {
      const pass = sessionStorage.getItem('segreta_admin_password') || password;
      const url = `/api/admin/ordini${archivio ? '?archivio=true' : ''}`;
      const response = await fetch(url, {
        headers: {
          'x-admin-password': pass
        }
      });
      if (response.status === 401) {
        return;
      }
      const json = await response.json();
      if (json.success) {
        setOrdini(json.data);
      }
    } catch (err) {
      console.warn('Connessione API per ordini fallita. Fallback su localStorage.', err);
      const saved = localStorage.getItem('segreta_ordini');
      setOrdini(saved ? JSON.parse(saved) : []);
    }
  }, [password]);

  // Effetto per caricare i dati non appena si è loggati
  useEffect(() => {
    if (isLoggedIn) {
      const timer = setTimeout(() => {
        fetchArticoli();
        fetchOrdini(mostraArchivio);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [isLoggedIn, fetchArticoli, fetchOrdini, mostraArchivio]);

  // --- AUTENTICAZIONE ---
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch('/api/admin/prodotti', {
        headers: {
          'x-admin-password': password
        }
      });
      if (response.ok) {
        setIsLoggedIn(true);
        sessionStorage.setItem('segreta_admin_logged', 'true');
        sessionStorage.setItem('segreta_admin_password', password);
        setLoginError(false);
        const json = await response.json();
        setArticoliAPI(json.data);
        setIsAPIAvailable(true);
      } else {
        const errJson = await response.json().catch(() => ({}));
        if (response.status === 500) {
          alert(`Errore Database Supabase: ${errJson.error || 'Errore sconosciuto. Controlla i log.'}`);
        }
        setLoginError(true);
        setPassword('');
      }
    } catch (err) {
      console.warn('Connessione al server fallita durante login. Fallback locale.', err);
      const correctPassword = import.meta.env.VITE_ADMIN_PASSWORD || 'Segreta2026';
      if (password === correctPassword) {
        setIsLoggedIn(true);
        sessionStorage.setItem('segreta_admin_logged', 'true');
        sessionStorage.setItem('segreta_admin_password', password);
        setLoginError(false);
        setIsAPIAvailable(false);
      } else {
        setLoginError(true);
        setPassword('');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('segreta_admin_logged');
    sessionStorage.removeItem('segreta_admin_password');
    setIsLoggedIn(false);
    setPassword('');
  };

  // --- CARICAMENTO IMMAGINI MULTIPLE (Nativo) ---
  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files || files.length === 0) return;

    setUploading(true);

    try {
      const uploadedUrls = [];
      const pass = sessionStorage.getItem('segreta_admin_password') || password;

      for (const imageFile of files) {
        const finalMimeType = imageFile.type || 'image/avif';
        const finalFileName = imageFile.name || `prodotto-${Date.now()}.avif`;

        // Conversione diretta del file nativo in Base64 (senza compressione)
        const base64data = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(imageFile);
          reader.onloadend = () => resolve(reader.result);
          reader.onerror = reject;
        });
        
        if (!isAPIAvailable) {
          const localBlobUrl = URL.createObjectURL(imageFile);
          uploadedUrls.push(localBlobUrl);
          continue;
        }

        // Invio al backend Vercel/Supabase
        const response = await fetch('/api/admin/upload', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-admin-password': pass
          },
          body: JSON.stringify({
            imageData: base64data,
            fileName: finalFileName,
            mimeType: finalMimeType
          })
        });

        let json;
        try {
          json = await response.json();
        } catch (parseErr) {
          throw new Error('Il server ha risposto con un formato non valido (forse errore 500). Controlla se le foto superano il limite Vercel.');
        }

        if (json.success) {
          uploadedUrls.push(json.url);
        } else {
          throw new Error(json.error || 'Errore sconosciuto dal server.');
        }
      }

      setNuovoArticolo(prev => {
        const existingUrls = prev.immagine_url ? prev.immagine_url.split(',').map(u => u.trim()).filter(Boolean) : [];
        const newUrlsString = [...existingUrls, ...uploadedUrls].join(',');
        return {
          ...prev,
          immagine_url: newUrlsString
        };
      });
      
      alert(`Caricate con successo ${uploadedUrls.length} immagin${uploadedUrls.length === 1 ? 'e' : 'i'} su Supabase!`);
    } catch (error) {
      console.error('Errore durante il caricamento delle immagini:', error);
      alert(`Impossibile completare il caricamento. Motivo: ${error.message}`);
    } finally {
      setUploading(false);
      e.target.value = ''; // Reset input file
    }
  };

  const rimuoviImmagine = (urlToRemove) => {
    setNuovoArticolo(prev => {
      const urls = prev.immagine_url.split(',').filter(u => u.trim() !== urlToRemove);
      return { ...prev, immagine_url: urls.join(',') };
    });
  };

  // Aggiunge una taglia personalizzata all'elenco dei flag
  const handleAddCustomSize = (e) => {
    e.preventDefault();
    const size = newCustomSizeInput.trim().toUpperCase();
    if (size && !PRESET_SIZES.includes(size) && !customSizesList.includes(size)) {
      setCustomSizesList(prev => [...prev, size]);
      setSelectedSizes(prev => ({ ...prev, [size]: true }));
      setNewCustomSizeInput('');
    }
  };

  // --- CRUD OPERAZIONI ---
  const handleCreateArticolo = async (e) => {
    e.preventDefault();
    
    // Calcola la stringa delle taglie finali dai flag selezionati
    const taglieFinali = Object.keys(selectedSizes)
      .filter(size => selectedSizes[size])
      .join(',');

    if (!nuovoArticolo.titolo || !nuovoArticolo.prezzo || !nuovoArticolo.categoria || !nuovoArticolo.target) {
      alert('Per favore compila i campi obbligatori (Titolo, Prezzo, Target, Categoria)');
      return;
    }

    const articoloDaAggiungere = {
      ...nuovoArticolo,
      taglie: taglieFinali,
      prezzo: parseFloat(nuovoArticolo.prezzo),
      immagine_url: nuovoArticolo.immagine_url || 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=600&q=80'
    };

    if (isAPIAvailable) {
      setLoading(true);
      try {
        const pass = sessionStorage.getItem('segreta_admin_password') || password;
        const response = await fetch('/api/admin/prodotti', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'x-admin-password': pass
          },
          body: JSON.stringify(articoloDaAggiungere)
        });
        const json = await response.json();
        if (json.success) {
          // Aggiunge allo stato locale degli articoli API
          setArticoliAPI(prev => [json.data, ...prev]);
          // Sincronizza anche lo stato dell'app principale passatogli dal padre
          onAddArticolo(json.data);
          alert('Articolo salvato sul database SQLite!');
        } else {
          alert('Errore dal database: ' + json.error);
        }
      } catch {
        alert('Errore di rete durante il salvataggio.');
      } finally {
        setLoading(false);
      }
    } else {
      // Fallback locale nel LocalStorage
      const nuovoId = Math.floor(Math.random() * 10000) + 1;
      const artConId = { ...articoloDaAggiungere, id: nuovoId, attivo: true, created_at: new Date().toISOString() };
      onAddArticolo(artConId);
      alert('Articolo salvato in locale tramite localStorage (sviluppo locale).');
    }

    // Reset Form
    setNuovoArticolo({
      titolo: '',
      descrizione: '',
      prezzo: '',
      immagine_url: '',
      target: 'Donna',
      categoria: '',
      taglie: 'S,M,L'
    });
    setSelectedSizes({ S: true, M: true, L: true });
    setCustomSizesList([]);
    setNewCustomSizeInput('');
  };

  const handleToggleActive = async (artId) => {
    // Aggiorna prima lo stato del genitore
    onToggleArticolo(artId);

    if (isAPIAvailable) {
      try {
        const pass = sessionStorage.getItem('segreta_admin_password') || password;
        const response = await fetch(`/api/admin/prodotti/${artId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'x-admin-password': pass
          }
        });
        const json = await response.json();
        if (json.success) {
          // Aggiorna lo stato locale degli articoli API
          setArticoliAPI(prev => prev.map(a => 
            a.id === artId ? { ...a, attivo: json.attivo } : a
          ));
        }
      } catch (err) {
        console.error('Errore durante l\'aggiornamento dello stato su database.', err);
      }
    } else {
      // Sincronizza lo stato degli articoli API se in fallback
      setArticoliAPI(prev => prev.map(a => 
        a.id === artId ? { ...a, attivo: !a.attivo } : a
      ));
    }
  };

  const handleEliminaArticolo = async (artId) => {
    if (!window.confirm('Sei sicuro di voler eliminare permanentemente questo articolo?')) {
      return;
    }

    if (isAPIAvailable) {
      setLoading(true);
      try {
        const pass = sessionStorage.getItem('segreta_admin_password') || password;
        const response = await fetch(`/api/admin/prodotti/${artId}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'x-admin-password': pass
          }
        });
        const json = await response.json();
        if (json.success) {
          setArticoliAPI(prev => prev.filter(a => a.id !== artId));
          // Ricarica la lista per sicurezza
          fetchArticoli();
          alert('Articolo eliminato dal database.');
        } else {
          alert('Errore database: ' + json.error);
        }
      } catch {
        alert('Impossibile completare l\'eliminazione.');
      } finally {
        setLoading(false);
      }
    } else {
      // Fallback locale: rimuove da localStorage resettando la lista articoli
      const saved = localStorage.getItem('segreta_articoli');
      if (saved) {
        const list = JSON.parse(saved).filter(a => a.id !== artId);
        localStorage.setItem('segreta_articoli', JSON.stringify(list));
        alert('Articolo rimosso localmente. Ricarica la pagina per sincronizzare.');
        window.location.reload();
      }
    }
  };

  // --- ORDINI CONTROLLI ---
  const handleUpdateStatoOrdine = async (ordineId, nuovoStato) => {
    if (isAPIAvailable) {
      try {
        const pass = sessionStorage.getItem('segreta_admin_password') || password;
        const response = await fetch(`/api/admin/ordini/${ordineId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'x-admin-password': pass
          },
          body: JSON.stringify({ action: 'stato', stato: nuovoStato })
        });
        const json = await response.json();
        if (json.success) {
          setOrdini(prev => prev.map(o => 
            o.id === ordineId ? { ...o, stato: nuovoStato } : o
          ));
        }
      } catch (err) {
        console.error('Errore durante l\'aggiornamento dello stato dell\'ordine su database.', err);
      }
    } else {
      const nuoviOrdini = ordini.map(o => 
        o.id === ordineId ? { ...o, stato: nuovoStato } : o
      );
      setOrdini(nuoviOrdini);
      localStorage.setItem('segreta_ordini', JSON.stringify(nuoviOrdini));
    }
  };

  const handleCancellaOrdine = async (ordineId) => {
    if (!window.confirm('Sei sicuro di voler eliminare questo ordine?')) {
      return;
    }

    if (isAPIAvailable) {
      try {
        const pass = sessionStorage.getItem('segreta_admin_password') || password;
        const response = await fetch(`/api/admin/ordini/${ordineId}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'x-admin-password': pass
          }
        });
        const json = await response.json();
        if (json.success) {
          setOrdini(prev => prev.filter(o => o.id !== ordineId));
        }
      } catch (err) {
        console.error('Errore durante l\'eliminazione dell\'ordine su database.', err);
      }
    } else {
      const nuoviOrdini = ordini.filter(o => o.id !== ordineId);
      setOrdini(nuoviOrdini);
      localStorage.setItem('segreta_ordini', JSON.stringify(nuoviOrdini));
    }
  };

  const handleArchivia = async (ordineId) => {
    if (!window.confirm('Archiviare questo ordine? Sarà visibile nella cronologia.')) return;
    if (isAPIAvailable) {
      try {
        const pass = sessionStorage.getItem('segreta_admin_password') || password;
        const response = await fetch(`/api/admin/ordini/${ordineId}`, {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json',
            'x-admin-password': pass 
          },
          body: JSON.stringify({ action: 'archivia' })
        });
        const json = await response.json();
        if (json.success) {
          setOrdini(prev => prev.filter(o => o.id !== ordineId));
        }
      } catch (err) {
        console.error('Errore durante l\'archiviazione dell\'ordine.', err);
      }
    } else {
      const updated = ordini.map(o => o.id === ordineId ? { ...o, stato: 'Archiviato' } : o);
      setOrdini(updated.filter(o => o.stato !== 'Archiviato'));
      localStorage.setItem('segreta_ordini', JSON.stringify(updated));
    }
  };

  const handleToggleArchivio = () => {
    const nuovoValore = !mostraArchivio;
    setMostraArchivio(nuovoValore);
    fetchOrdini(nuovoValore);
  };

  const handleDownloadCSV = () => {
    if (ordini.length === 0) return;
    const headers = ['ID','Cliente','Telefono','Consegna','Indirizzo','Pagamento','Totale','Stato','Data'];
    const rows = ordini.map(o => [
      o.id,
      `"${o.nome_cliente}"`,
      `"${o.telefono}"`,
      `"${o.metodo_consegna}"`,
      `"${o.indirizzo_spedizione}"`,
      `"${o.metodo_pagamento}"`,
      o.totale,
      `"${o.stato}"`,
      `"${new Date(o.created_at).toLocaleString('it-IT')}"`
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ordini_${mostraArchivio ? 'archivio' : 'attivi'}_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadPDF = () => {
    if (ordini.length === 0) return;
    const win = window.open('', '_blank');
    const titolo = mostraArchivio ? 'Archivio Ordini' : 'Ordini Attivi';
    const righe = ordini.map(o => {
      let items = [];
      try { items = JSON.parse(o.dettaglio_articoli); } catch { items = []; }
      return `
        <tr style="border-bottom:1px solid #eee">
          <td style="padding:8px">#${o.id}</td>
          <td style="padding:8px">${o.nome_cliente}</td>
          <td style="padding:8px">${o.telefono}</td>
          <td style="padding:8px">${o.metodo_consegna}</td>
          <td style="padding:8px">${items.map(i => `${i.titolo} x${i.quantita}`).join(', ')}</td>
          <td style="padding:8px">€${parseFloat(o.totale).toFixed(2)}</td>
          <td style="padding:8px">${o.stato}</td>
          <td style="padding:8px">${new Date(o.created_at).toLocaleString('it-IT')}</td>
        </tr>`;
    }).join('');
    win.document.write(`<!DOCTYPE html><html lang="it"><head><meta charset="UTF-8"><title>${titolo} - Segreta Style</title>
      <style>body{font-family:sans-serif;padding:20px;color:#333}table{width:100%;border-collapse:collapse}th{background:#1a1a2e;color:#fff;padding:10px;text-align:left}</style>
      </head><body>
      <h1 style="color:#1a1a2e">Segreta Style — ${titolo}</h1>
      <p>Data export: ${new Date().toLocaleString('it-IT')}</p>
      <table><thead><tr><th>#</th><th>Cliente</th><th>Telefono</th><th>Consegna</th><th>Articoli</th><th>Totale</th><th>Stato</th><th>Data</th></tr></thead>
      <tbody>${righe}</tbody></table></body></html>`);
    win.document.close();
    win.print();
  };

  // Se l'utente non è loggato, mostra la schermata di login Light Mode elegantissima
  if (!isLoggedIn) {
    return (
      <section className="admin-login-section container fade-in">
        <div className="login-card">
          <div className="login-icon-box">
            <Lock size={32} />
          </div>
          <h2>Accesso Amministratore</h2>
          <div className="accent-line"></div>
          <p className="login-subtitle">Inserisci la password impostata per gestire il negozio.</p>

          <form onSubmit={handleLoginSubmit} className="login-form">
            <div className="form-group">
              <label className="form-label" htmlFor="admin_pass">Password di Accesso</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? "text" : "password"}
                  id="admin_pass"
                  className={`form-control ${loginError ? 'input-error' : ''}`}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Digita la password..."
                  required
                  autoFocus
                  style={{ paddingRight: '40px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center',
                    color: '#666'
                  }}
                >
                  {showPassword ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                      <line x1="1" y1="1" x2="23" y2="23"></line>
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                  )}
                </button>
              </div>
              {loginError && <p className="error-text">Password errata. Riprova.</p>}
            </div>
            <button type="submit" className="btn-primary login-btn">
              Accedi al Pannello
            </button>
          </form>
        </div>

        <style>{`
          .admin-login-section {
            padding: var(--spacing-xxl) var(--spacing-lg);
            display: flex;
            justify-content: center;
          }
          .login-card {
            background-color: var(--bg-secondary);
            border: 1px solid var(--border-color);
            border-radius: var(--radius-lg);
            padding: var(--spacing-xl);
            box-shadow: var(--shadow-md);
            max-width: 420px;
            width: 100%;
            text-align: center;
            display: flex;
            flex-direction: column;
            align-items: center;
          }
          .login-icon-box {
            width: 64px;
            height: 64px;
            border-radius: var(--radius-full);
            background-color: var(--accent-soft-gold);
            color: var(--accent-gold-hover);
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: var(--spacing-md);
          }
          .login-card h2 {
            font-size: 1.8rem;
          }
          .accent-line {
            width: 40px;
            height: 2px;
            background-color: var(--accent-gold);
            margin: var(--spacing-xs) auto var(--spacing-md);
          }
          .login-subtitle {
            font-size: 0.88rem;
            color: var(--text-secondary);
            margin-bottom: var(--spacing-lg);
          }
          .login-form {
            width: 100%;
            text-align: left;
          }
          .login-btn {
            width: 100%;
            margin-top: var(--spacing-sm);
          }
          .input-error {
            border-color: var(--error) !important;
            box-shadow: 0 0 0 3px rgba(201, 42, 42, 0.15) !important;
          }
          .error-text {
            color: var(--error);
            font-size: 0.8rem;
            margin-top: 4px;
            font-weight: 600;
          }
        `}</style>
      </section>
    );
  }

  // Lista articoli da mostrare: usa articoliAPI se disponibile, altrimenti fa il fallback sugli articoli passati dal padre
  const listaArticoliVisualizzati = isAPIAvailable ? articoliAPI : articoli;



  return (
    <section className="admin-dashboard-container container fade-in">
      <div className="dashboard-header">
        <div className="header-flex-row">
          <div>
            <h2>Pannello di Controllo</h2>
            <div className="accent-line-left"></div>
            <p className="dashboard-sub">Gestisci il catalogo e gli ordini di Segreta Style.</p>
          </div>
          <div className="header-actions">
            {isAPIAvailable ? (
              <span className="status-badge online" title="Database SQLite Connesso">● Database Collegato</span>
            ) : (
              <span className="status-badge offline" title="Database SQLite non raggiungibile. Dati salvati in locale.">● Modalità Sviluppo Locale</span>
            )}
            <button className="btn-logout" onClick={handleLogout} aria-label="Scollegati dalla dashboard">
              <LogOut size={16} style={{ marginRight: '6px' }} />
              Scollegati
            </button>
          </div>
        </div>
      </div>

      {/* Tabs di Navigazione Interna */}
      <div className="dashboard-tabs" role="tablist">
        <button
          className={`tab-btn ${activeTab === 'ordini' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('ordini');
            fetchOrdini(false);
          }}
          role="tab"
          aria-selected={activeTab === 'ordini'}
        >
          <ClipboardList size={18} style={{ marginRight: '8px' }} />
          Ordini Ricevuti ({ordini.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'articoli' ? 'active' : ''}`}
          onClick={() => setActiveTab('articoli')}
          role="tab"
          aria-selected={activeTab === 'articoli'}
        >
          <Package size={18} style={{ marginRight: '8px' }} />
          Catalogo Articoli ({listaArticoliVisualizzati.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'nuovo' ? 'active' : ''}`}
          onClick={() => setActiveTab('nuovo')}
          role="tab"
          aria-selected={activeTab === 'nuovo'}
        >
          <PlusCircle size={18} style={{ marginRight: '8px' }} />
          Nuovo Articolo
        </button>
        <button
          className={`tab-btn ${activeTab === 'archivio' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('archivio');
            fetchOrdini(true);
          }}
          role="tab"
          aria-selected={activeTab === 'archivio'}
        >
          <Archive size={18} style={{ marginRight: '8px' }} />
          Archivio Ordini
        </button>
      </div>

      {/* Loader globale */}
      {loading && (
        <div className="global-loader-container">
          <Loader className="spin-icon" size={32} />
          <span>Sincronizzazione database...</span>
        </div>
      )}

      {/* Tab 1: Ordini Ricevuti */}
      {activeTab === 'ordini' && !loading && (
        <div className="dashboard-content fade-in">
          {/* Download rapido */}
          <div className="orders-toolbar">
            <span className="orders-toolbar-title">Ordini attivi</span>
            <div className="orders-download-group">
              <button
                className="download-btn"
                onClick={handleDownloadCSV}
                disabled={ordini.length === 0}
                title="Scarica CSV"
              >
                <Download size={14} /> CSV
              </button>
              <button
                className="download-btn"
                onClick={handleDownloadPDF}
                disabled={ordini.length === 0}
                title="Stampa / Salva PDF"
              >
                <Download size={14} /> PDF
              </button>
            </div>
          </div>

          {ordini.length === 0 ? (
            <p className="no-data-msg">Nessun ordine ricevuto al momento.</p>
          ) : (
            <div className="orders-list">
              {ordini.map(ordine => {
                let dettagli = [];
                try { dettagli = JSON.parse(ordine.dettaglio_articoli); } catch { dettagli = []; }
                return (
                  <div key={ordine.id} className="order-admin-card">
                    <div className="order-admin-header">
                      <div>
                        <h4>Ordine #{ordine.id}</h4>
                        <span className="order-date">{new Date(ordine.created_at).toLocaleString('it-IT')}</span>
                      </div>
                      <div className="order-actions-row">
                        <select
                          className="form-control state-select"
                          value={ordine.stato}
                          onChange={(e) => handleUpdateStatoOrdine(ordine.id, e.target.value)}
                          aria-label="Stato dell'ordine"
                        >
                          <option value="In attesa">In attesa</option>
                          <option value="Spedito">Spedito / Consegnato</option>
                          <option value="Annullato">Annullato</option>
                        </select>
                        {ordine.stato !== 'In attesa' && (
                          <button
                            className="archive-order-btn"
                            onClick={() => handleArchivia(ordine.id)}
                            aria-label={`Archivia ordine #${ordine.id}`}
                            title="Sposta in Archivio"
                          >
                            <Archive size={15} />
                            <span>Archivia</span>
                          </button>
                        )}
                        <button
                          className="delete-order-btn"
                          onClick={() => handleCancellaOrdine(ordine.id)}
                          aria-label="Cancella ordine"
                        >
                          <Trash size={16} />
                        </button>
                      </div>
                    </div>

                    <div className="order-admin-body">
                      <div className="customer-info-box">
                        <p><strong>Cliente:</strong> {ordine.nome_cliente}</p>
                        <p><strong>Telefono:</strong> <a href={`tel:${ordine.telefono}`}>{ordine.telefono}</a></p>
                        <p><strong>Consegna:</strong> {ordine.metodo_consegna}</p>
                        <p><strong>Indirizzo:</strong> {ordine.indirizzo_spedizione}</p>
                        <p><strong>Pagamento:</strong> {ordine.metodo_pagamento}</p>
                      </div>

                      <div className="order-items-box">
                        <h5>Prodotti Acquistati:</h5>
                        <ul className="items-list-admin">
                          {dettagli.map((item, idx) => (
                            <li key={idx} className="item-li-admin">
                              <span>{item.titolo} (Taglia {item.taglia}) <strong>x{item.quantita}</strong></span>
                              <span>€{(item.prezzo * item.quantita).toFixed(2)}</span>
                            </li>
                          ))}
                        </ul>
                        <div className="order-total-admin">
                          <span>Totale Ordine:</span>
                          <strong>€{ordine.totale.toFixed(2)}</strong>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab Archivio Ordini */}
      {activeTab === 'archivio' && !loading && (
        <div className="dashboard-content fade-in">
          <div className="orders-toolbar">
            <span className="orders-toolbar-title">Cronologia ordini archiviati</span>
            <div className="orders-download-group">
              <button
                className="download-btn"
                onClick={handleDownloadCSV}
                disabled={ordini.length === 0}
                title="Scarica CSV archivio"
              >
                <Download size={14} /> CSV
              </button>
              <button
                className="download-btn"
                onClick={handleDownloadPDF}
                disabled={ordini.length === 0}
                title="Stampa / Salva PDF archivio"
              >
                <Download size={14} /> PDF
              </button>
            </div>
          </div>

          {ordini.length === 0 ? (
            <p className="no-data-msg">Nessun ordine archiviato.</p>
          ) : (
            <div className="orders-list">
              {ordini.map(ordine => {
                let dettagli = [];
                try { dettagli = JSON.parse(ordine.dettaglio_articoli); } catch { dettagli = []; }
                return (
                  <div key={ordine.id} className="order-admin-card archived-card">
                    <div className="order-admin-header">
                      <div>
                        <h4>Ordine #{ordine.id}</h4>
                        <span className="order-date">{new Date(ordine.created_at).toLocaleString('it-IT')}</span>
                      </div>
                      <div className="order-actions-row">
                        <span className="badge badge-archived">Archiviato</span>
                        <button
                          className="delete-order-btn"
                          onClick={() => handleCancellaOrdine(ordine.id)}
                          aria-label="Elimina ordine archiviato"
                        >
                          <Trash size={16} />
                        </button>
                      </div>
                    </div>

                    <div className="order-admin-body">
                      <div className="customer-info-box">
                        <p><strong>Cliente:</strong> {ordine.nome_cliente}</p>
                        <p><strong>Telefono:</strong> <a href={`tel:${ordine.telefono}`}>{ordine.telefono}</a></p>
                        <p><strong>Consegna:</strong> {ordine.metodo_consegna}</p>
                        <p><strong>Indirizzo:</strong> {ordine.indirizzo_spedizione}</p>
                        <p><strong>Pagamento:</strong> {ordine.metodo_pagamento}</p>
                      </div>

                      <div className="order-items-box">
                        <h5>Prodotti Acquistati:</h5>
                        <ul className="items-list-admin">
                          {dettagli.map((item, idx) => (
                            <li key={idx} className="item-li-admin">
                              <span>{item.titolo} (Taglia {item.taglia}) <strong>x{item.quantita}</strong></span>
                              <span>€{(item.prezzo * item.quantita).toFixed(2)}</span>
                            </li>
                          ))}
                        </ul>
                        <div className="order-total-admin">
                          <span>Totale Ordine:</span>
                          <strong>€{ordine.totale.toFixed(2)}</strong>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Lista Articoli */}
      {activeTab === 'articoli' && !loading && (
        <div className="dashboard-content fade-in">
          <div className="articles-table-container">
            <table className="articles-table">
              <thead>
                <tr>
                  <th>Prodotto</th>
                  <th>Target</th>
                  <th>Categoria</th>
                  <th>Prezzo</th>
                  <th>Taglie</th>
                  <th>Stato</th>
                  <th>Azioni</th>
                </tr>
              </thead>
              <tbody>
                {listaArticoliVisualizzati.map(art => (
                  <tr key={art.id} className={!art.attivo ? 'inactive-row' : ''}>
                    <td className="art-title-td">
                      <img 
                        src={art.immagine_url.startsWith('http') || art.immagine_url.startsWith('blob:') ? art.immagine_url : (art.immagine_url.startsWith('/') ? art.immagine_url : `/${art.immagine_url}`)} 
                        alt="" 
                        className="table-art-img"
                        onError={(e) => {
                          e.target.src = 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=600&q=80';
                        }}
                      />
                      <div>
                        <strong>{art.titolo}</strong>
                        <span className="art-id-span">ID: {art.id}</span>
                      </div>
                    </td>
                    <td>
                      <span 
                        className="badge" 
                        style={{ 
                          backgroundColor: art.target === 'Uomo' ? 'rgba(30, 136, 229, 0.1)' : 'rgba(216, 27, 96, 0.1)', 
                          color: art.target === 'Uomo' ? '#1E88E5' : '#D81B60',
                          border: art.target === 'Uomo' ? '1px solid rgba(30, 136, 229, 0.2)' : '1px solid rgba(216, 27, 96, 0.2)'
                        }}
                      >
                        {art.target || 'Donna'}
                      </span>
                    </td>
                    <td><span className="badge">{art.categoria}</span></td>
                    <td className="price-td">€{parseFloat(art.prezzo).toFixed(2)}</td>
                    <td>{art.taglie || 'Unica'}</td>
                    <td>
                      <button
                        className="toggle-active-btn"
                        onClick={() => handleToggleActive(art.id)}
                        aria-label={art.attivo ? 'Nascondi articolo' : 'Mostra articolo'}
                      >
                        {art.attivo ? (
                          <span className="active-tag"><ToggleRight size={24} className="icon-active" /> Attivo</span>
                        ) : (
                          <span className="inactive-tag"><ToggleLeft size={24} className="icon-inactive" /> Nascosto</span>
                        )}
                      </button>
                    </td>
                    <td>
                      <button
                        className="delete-art-btn"
                        onClick={() => handleEliminaArticolo(art.id)}
                        aria-label={`Elimina ${art.titolo}`}
                      >
                        <Trash size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Nuovo Articolo */}
      {activeTab === 'nuovo' && !loading && (
        <div className="dashboard-content fade-in">
          <form onSubmit={handleCreateArticolo} className="new-article-form">
            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label" htmlFor="new_titolo">Titolo Articolo *</label>
                <input
                  type="text"
                  id="new_titolo"
                  className="form-control"
                  value={nuovoArticolo.titolo}
                  onChange={(e) => setNuovoArticolo({...nuovoArticolo, titolo: e.target.value})}
                  required
                  placeholder="Es. Gonna Plissé Rosa"
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="new_prezzo">Prezzo (€) *</label>
                <input
                  type="number"
                  id="new_prezzo"
                  step="0.01"
                  className="form-control"
                  value={nuovoArticolo.prezzo}
                  onChange={(e) => setNuovoArticolo({...nuovoArticolo, prezzo: e.target.value})}
                  required
                  placeholder="Es. 29.90"
                />
              </div>
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label" htmlFor="select_target">Target *</label>
                <select
                  id="select_target"
                  className="form-control"
                  value={nuovoArticolo.target}
                  onChange={(e) => setNuovoArticolo({...nuovoArticolo, target: e.target.value, categoria: ''})}
                  required
                  style={{ minHeight: '44px' }}
                >
                  <option value="Donna">Donna</option>
                  <option value="Uomo">Uomo</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="select_categoria">Categoria *</label>
                <select
                  id="select_categoria"
                  className="form-control"
                  value={nuovoArticolo.categoria}
                  onChange={(e) => setNuovoArticolo({...nuovoArticolo, categoria: e.target.value})}
                  required
                  style={{ minHeight: '44px' }}
                >
                  <option value="" disabled>-- Seleziona una Categoria --</option>
                  {(TARGET_CATEGORIES[nuovoArticolo.target] || []).map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>

              <div className="form-group">
                <label className="form-label" style={{ marginBottom: '8px' }}>Taglie Disponibili *</label>
                <div className="sizes-checkbox-grid">
                  {[...PRESET_SIZES, ...customSizesList].map(size => {
                    const isChecked = !!selectedSizes[size];
                    return (
                      <label key={size} className="size-checkbox-label">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            const val = e.target.checked;
                            setSelectedSizes(prev => ({ ...prev, [size]: val }));
                          }}
                          className="size-checkbox-input"
                        />
                        <span className="size-checkbox-box">{size}</span>
                      </label>
                    );
                  })}
                </div>

                <div className="add-custom-size-row" style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Altra taglia (es: 37, XXXL)"
                    value={newCustomSizeInput}
                    onChange={(e) => setNewCustomSizeInput(e.target.value)}
                    style={{ maxWidth: '220px', minHeight: '36px', height: '36px', padding: '0.4rem 0.8rem', fontSize: '0.88rem' }}
                    aria-label="Aggiungi un'altra taglia personalizzata"
                  />
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={handleAddCustomSize}
                    style={{ minHeight: '36px', height: '36px', fontSize: '0.85rem', padding: '0 12px' }}
                  >
                    Aggiungi
                  </button>
                </div>
              </div>

            <div className="form-group">
              <label className="form-label">Foto Prodotto (Puoi selezionare più foto insieme) *</label>
              <div className="upload-btn-wrapper">
                <button type="button" className="btn-secondary upload-btn-trigger">
                  {uploading ? (
                    <div className="upload-placeholder loading">
                      <Loader className="spin" size={24} />
                      <span>CARICAMENTO IN CORSO...</span>
                    </div>
                  ) : (
                    <>
                      <Upload size={18} style={{ marginRight: '8px' }} />
                      Seleziona Foto (anche multiple)
                    </>
                  )}
                </button>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploading}
                  className="file-input-hidden"
                  aria-label="Carica foto prodotto"
                />
              </div>
              
              {nuovoArticolo.immagine_url && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '15px' }}>
                  {nuovoArticolo.immagine_url.split(',').filter(Boolean).map((url, idx) => (
                    <div key={idx} style={{ position: 'relative', width: '100px', height: '120px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                      <img src={url} alt={`Preview ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <button 
                        type="button" 
                        onClick={() => rimuoviImmagine(url)}
                        style={{ position: 'absolute', top: '4px', right: '4px', background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', borderRadius: '50%', width: '24px', height: '24px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Trash size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="new_descrizione">Descrizione Articolo</label>
              <textarea
                id="new_descrizione"
                className="form-control"
                rows="4"
                value={nuovoArticolo.descrizione}
                onChange={(e) => setNuovoArticolo({...nuovoArticolo, descrizione: e.target.value})}
                placeholder="Inserisci i dettagli del materiale, vestibilità..."
              ></textarea>
            </div>

            <button type="submit" className="btn-primary" disabled={uploading}>
              Salva Articolo
            </button>
          </form>
        </div>
      )}

      <style>{`
        .admin-dashboard-container {
          padding: var(--spacing-xl) var(--spacing-lg);
          margin-bottom: var(--spacing-xxl);
        }

        .dashboard-header {
          margin-bottom: var(--spacing-xl);
        }

        .header-flex-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: var(--spacing-md);
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: var(--spacing-md);
          flex-wrap: wrap;
        }

        .btn-logout {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background-color: transparent;
          color: var(--text-secondary);
          border: 1.5px solid var(--border-color);
          padding: 0.45rem 0.9rem;
          border-radius: var(--radius-md);
          font-size: 0.82rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.20s ease;
          min-height: 38px;
        }

        .btn-logout:hover {
          background-color: var(--border-color);
          color: var(--text-primary);
        }

        .btn-logout:focus-visible {
          outline: 2px solid var(--accent-gold);
          outline-offset: 2px;
        }

        .status-badge-container {
          display: flex;
        }

        .status-badge {
          font-size: 0.8rem;
          font-weight: 700;
          padding: 0.35rem 0.75rem;
          border-radius: var(--radius-full);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .status-badge.online {
          background-color: rgba(46, 125, 50, 0.1);
          color: var(--success);
        }

        .status-badge.offline {
          background-color: rgba(197, 168, 128, 0.1);
          color: var(--accent-gold-hover);
        }

        .dashboard-sub {
          color: var(--text-secondary);
        }

        .dashboard-tabs {
          display: flex;
          border-bottom: 1px solid var(--border-color);
          margin-bottom: var(--spacing-lg);
          gap: var(--spacing-xs);
          flex-wrap: wrap;
        }

        .tab-btn {
          padding: 0.8rem 1.4rem;
          font-size: 0.9rem;
          font-weight: 600;
          color: var(--text-secondary);
          border-bottom: 2px solid transparent;
          border-radius: var(--radius-sm) var(--radius-sm) 0 0;
          min-height: 44px;
        }

        .tab-btn:hover {
          color: var(--text-primary);
          background-color: var(--bg-tertiary);
        }

        .tab-btn.active {
          color: var(--text-primary);
          border-bottom-color: var(--accent-gold);
          background-color: var(--bg-secondary);
        }

        .dashboard-content {
          background-color: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          padding: var(--spacing-lg);
          box-shadow: var(--shadow-sm);
        }

        .global-loader-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: var(--spacing-xxl);
          color: var(--text-secondary);
          gap: var(--spacing-md);
          background-color: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
        }

        .spin-icon {
          animation: spin 1.5s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .no-data-msg {
          text-align: center;
          padding: var(--spacing-xl) 0;
          color: var(--text-secondary);
        }

        /* Order Admin Cards */
        .orders-list {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-md);
        }

        .order-admin-card {
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          overflow: hidden;
          background-color: var(--bg-primary);
        }

        .order-admin-header {
          background-color: var(--bg-secondary);
          padding: var(--spacing-md);
          border-bottom: 1px solid var(--border-color);
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: var(--spacing-sm);
        }

        .order-admin-header h4 {
          font-family: var(--font-sans);
          font-weight: 700;
        }

        .order-date {
          font-size: 0.8rem;
          color: var(--text-secondary);
        }

        .order-actions-row {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
        }

        .state-select {
          min-height: 44px;
          padding: 0.4rem var(--spacing-md);
          font-size: 0.85rem;
          background-color: var(--bg-secondary);
        }

        .delete-order-btn {
          width: 44px;
          height: 44px;
          color: var(--text-secondary);
          border-radius: var(--radius-sm);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .delete-order-btn:hover {
          color: var(--error);
          background-color: rgba(201, 42, 42, 0.05);
        }

        .order-admin-body {
          padding: var(--spacing-md);
          display: grid;
          grid-template-columns: 1fr 1.2fr;
          gap: var(--spacing-lg);
        }

        .customer-info-box {
          font-size: 0.9rem;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .customer-info-box a {
          color: var(--accent-gold-hover);
          text-decoration: underline;
        }

        .order-items-box h5 {
          font-family: var(--font-sans);
          font-weight: 600;
          font-size: 0.9rem;
          margin-bottom: var(--spacing-sm);
        }

        .items-list-admin {
          list-style: none;
          font-size: 0.85rem;
          margin-bottom: var(--spacing-md);
        }

        .item-li-admin {
          display: flex;
          justify-content: space-between;
          border-bottom: 1px dashed var(--border-color);
          padding: 4px 0;
        }

        .order-total-admin {
          display: flex;
          justify-content: space-between;
          font-size: 1rem;
          font-weight: 700;
          border-top: 1px solid var(--border-color);
          padding-top: var(--spacing-sm);
        }

        /* Articles Table */
        .articles-table-container {
          overflow-x: auto;
        }

        .articles-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.9rem;
          text-align: left;
        }

        .articles-table th {
          border-bottom: 2px solid var(--border-color);
          padding: var(--spacing-sm) var(--spacing-md);
          color: var(--text-secondary);
          font-weight: 600;
        }

        .articles-table td {
          border-bottom: 1px solid var(--border-color);
          padding: var(--spacing-md);
          color: var(--text-primary);
        }

        .art-title-td {
          display: flex;
          align-items: center;
          gap: var(--spacing-md);
        }

        .table-art-img {
          width: 50px;
          height: 60px;
          object-fit: cover;
          border-radius: var(--radius-sm);
          border: 1px solid var(--border-color);
        }

        .art-id-span {
          display: block;
          font-size: 0.75rem;
          color: var(--text-secondary);
        }

        .price-td {
          font-weight: 700;
          font-family: var(--font-serif);
        }

        .toggle-active-btn {
          min-height: 44px;
          min-width: 80px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: none;
          border: none;
          cursor: pointer;
        }

        .active-tag {
          color: var(--success);
          display: flex;
          align-items: center;
          gap: 4px;
          font-weight: 600;
        }

        .inactive-tag {
          color: var(--text-muted);
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .icon-active {
          color: var(--success);
        }
        
        .icon-inactive {
          color: var(--text-muted);
        }

        .delete-art-btn {
          width: 44px;
          height: 44px;
          color: var(--text-secondary);
          border-radius: var(--radius-sm);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: none;
          border: none;
          cursor: pointer;
        }

        .delete-art-btn:hover {
          color: var(--error);
          background-color: rgba(201, 42, 42, 0.05);
        }

        .inactive-row {
          opacity: 0.6;
          background-color: rgba(0,0,0,0.02);
        }

        /* New Article Form */
        .new-article-form {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-md);
          max-width: 700px;
        }

        .form-grid-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: var(--spacing-md);
        }

        /* Size Checkbox Styles */
        .sizes-checkbox-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .size-checkbox-label {
          position: relative;
          cursor: pointer;
          user-select: none;
        }
        .size-checkbox-input {
          position: absolute;
          opacity: 0;
          cursor: pointer;
          height: 0;
          width: 0;
        }
        .size-checkbox-box {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 44px;
          height: 44px;
          padding: 0 10px;
          border-radius: var(--radius-sm);
          border: 1px solid var(--border-color);
          background-color: var(--bg-secondary);
          color: var(--text-primary);
          font-size: 0.85rem;
          font-weight: 600;
          transition: var(--transition-fast);
        }
        .size-checkbox-label:hover .size-checkbox-box {
          border-color: var(--text-primary);
          background-color: var(--bg-tertiary);
        }
        .size-checkbox-input:checked + .size-checkbox-box {
          background-color: var(--text-primary);
          color: var(--bg-secondary);
          border-color: var(--text-primary);
        }
        .size-checkbox-input:focus-visible + .size-checkbox-box {
          outline: 2px solid var(--accent-gold);
          outline-offset: 2px;
        }

        /* Upload Image Area styles */
        .upload-btn-wrapper {
          position: relative;
          overflow: hidden;
          display: inline-block;
        }

        .upload-btn-trigger {
          min-height: 44px;
        }

        .file-input-hidden {
          font-size: 100px;
          position: absolute;
          left: 0;
          top: 0;
          opacity: 0;
          cursor: pointer;
          height: 100%;
          width: 100%;
        }

        .upload-preview-box {
          margin-top: var(--spacing-md);
          padding: var(--spacing-md);
          border: 1px dashed var(--border-color);
          border-radius: var(--radius-md);
          background-color: var(--bg-primary);
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: var(--spacing-sm);
          position: relative;
        }

        .preview-badge {
          position: absolute;
          top: var(--spacing-sm);
          left: var(--spacing-sm);
        }

        .img-preview {
          width: 120px;
          height: 150px;
          object-fit: cover;
          border-radius: var(--radius-sm);
          border: 1px solid var(--border-color);
          margin-top: var(--spacing-md);
        }

        .preview-path-text {
          font-size: 0.75rem;
          color: var(--text-secondary);
          word-break: break-all;
          margin-bottom: 0;
        }

        /* Orders Toolbar */
        .orders-toolbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: var(--spacing-sm);
          margin-bottom: var(--spacing-md);
          padding: var(--spacing-sm) var(--spacing-md);
          background-color: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
        }

        .orders-toolbar-title {
          font-size: 0.82rem;
          font-weight: 600;
          color: var(--text-secondary);
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }

        .orders-download-group {
          display: flex;
          gap: var(--spacing-sm);
        }

        .download-btn {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          min-height: 44px;
          padding: 0 var(--spacing-md);
          border: 1.5px solid var(--border-color);
          border-radius: var(--radius-sm);
          background: var(--bg-primary);
          color: var(--text-secondary);
          font-size: 0.82rem;
          font-weight: 600;
          cursor: pointer;
          transition: var(--transition-fast);
        }

        .download-btn:hover:not(:disabled) {
          border-color: var(--text-primary);
          color: var(--text-primary);
        }

        .download-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        /* Archive order action button */
        .archive-order-btn {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          min-height: 44px;
          min-width: 44px;
          padding: 0 var(--spacing-sm);
          border: 1.5px solid transparent;
          border-radius: var(--radius-sm);
          background: transparent;
          color: var(--text-secondary);
          font-size: 0.82rem;
          font-weight: 600;
          cursor: pointer;
          transition: var(--transition-fast);
        }

        .archive-order-btn:hover {
          border-color: var(--accent-gold);
          color: var(--accent-gold);
          background-color: rgba(var(--accent-gold-rgb, 180, 141, 92), 0.07);
        }

        /* Archived card visual state */
        .archived-card {
          opacity: 0.75;
          border-style: dashed;
        }

        .archived-card .order-admin-header {
          background-color: rgba(0,0,0,0.04);
        }

        .badge-archived {
          display: inline-block;
          padding: 4px 10px;
          border-radius: var(--radius-sm);
          font-size: 0.75rem;
          font-weight: 700;
          background-color: rgba(120,120,120,0.12);
          color: var(--text-secondary);
          border: 1px solid var(--border-color);
          letter-spacing: 0.04em;
        }

        @media (max-width: 768px) {
          .order-admin-body {
            grid-template-columns: 1fr;
          }
          
          .form-grid-2 {
            grid-template-columns: 1fr;
          }

          .orders-toolbar {
            flex-direction: column;
            align-items: flex-start;
          }

          .orders-download-group {
            width: 100%;
          }

          .download-btn {
            flex: 1;
            justify-content: center;
          }
        }
      `}</style>
    </section>
  );
}
