import { useState, useEffect, useCallback } from 'react';
import { Package, ClipboardList, PlusCircle, Trash, ToggleLeft, ToggleRight, Lock, Upload, Loader, LogOut, Archive, Download, Pencil, Settings, ExternalLink, Home, MessageCircle } from 'lucide-react';
import { supabase as supabaseClient } from '../lib/supabaseClient.js';

const TARGET_CATEGORIES = {
  Donna: [
    'ABITI',
    'GONNE',
    'CAMICE-BLUSE',
    'T-SHIRT-FELPE',
    'JEANS',
    'PANTALONI',
    'CAPPOTTI-GIACCHE',
    'SCARPE',
    'BORSE'
  ]
};

const PRESET_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '38', '40', '42', '44', '46', '48', 'Unica'];

const safeParseJSON = (data, fallback = []) => {
  if (!data) return fallback;
  if (Array.isArray(data)) return data;
  if (typeof data === 'object') return data;
  try {
    const parsed = JSON.parse(data);
    return parsed !== null && parsed !== undefined ? parsed : fallback;
  } catch {
    return fallback;
  }
};

const getWhatsAppUrl = (ord) => {
  if (!ord || !ord.telefono) return '#';
  let cleanPhone = String(ord.telefono).replace(/\D/g, '');
  if (cleanPhone.length === 10 && !cleanPhone.startsWith('39')) {
    cleanPhone = '39' + cleanPhone;
  }

  const metodoPag = ord.metodo_pagamento || 'Satispay';
  const nomeCliente = ord.nome_cliente ? ord.nome_cliente.split(' ')[0] : 'Cliente';
  const totale = parseFloat(ord.totale || 0).toFixed(2);
  const orderId = ord.id;

  let messaggio = '';

  switch (ord.stato) {
    case 'Verifica Pagamento':
      messaggio = `Ciao ${nomeCliente}, grazie per il tuo ordine #${orderId} su Segreta Style! 🌸\nStiamo effettuando la verifica del tuo pagamento di €${totale} inviato tramite ${metodoPag}. Ti confermeremo l'accredito a brevissimo!`;
      break;

    case 'Pagamento Ricevuto - In Lavorazione':
    case 'Pagamento Ricevuto':
    case 'In Lavorazione':
      messaggio = `Ciao ${nomeCliente}! 🌸\nAbbiamo ricevuto e verificato con successo il tuo pagamento di €${totale} via ${metodoPag} per l'ordine #${orderId}.\nIl tuo ordine è ora in lavorazione e stiamo preparando i tuoi articoli! ✨`;
      break;

    case 'Spedito':
      messaggio = `Ciao ${nomeCliente}! 🚚\nOttime notizie: il tuo ordine #${orderId} è stato spedito ed è in viaggio verso l'indirizzo da te indicato!`;
      break;

    case 'Pronto al Ritiro':
      messaggio = `Ciao ${nomeCliente}! 🛍️\nIl tuo ordine #${orderId} è PRONTO per il ritiro in negozio presso Segreta Style a Monticelli d'Ongina! Ti aspettiamo negli orari di apertura.`;
      break;

    case 'Completato':
      messaggio = `Ciao ${nomeCliente}! ✨\nIl tuo ordine #${orderId} è stato completato con successo. Grazie di cuore per aver scelto Segreta Style! Per qualsiasi cosa siamo a disposizione.`;
      break;

    case 'Annullato':
      messaggio = `Ciao ${nomeCliente}, ti informiamo che l'ordine #${orderId} è stato annullato. Per qualsiasi dubbio siamo a tua disposizione.`;
      break;

    default:
      messaggio = `Ciao ${nomeCliente}! Ti contattiamo da Segreta Style in merito al tuo ordine #${orderId} di €${totale}.`;
      break;
  }

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(messaggio)}`;
};

export default function AdminDashboard({ articoli, onAddArticolo, onToggleArticolo, onNavigateToHome }) {
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



  // Categorie predefinite di base per il catalogo
  const DEFAULT_CATEGORIES_DONNA = [
    'ABITI',
    'GONNE',
    'CAMICE-BLUSE',
    'T-SHIRT-FELPE',
    'JEANS',
    'PANTALONI',
    'CAPPOTTI-GIACCHE',
    'SCARPE',
    'BORSE'
  ];

  // Stati locali per la selezione delle taglie tramite checkbox/flag
  const [selectedSizes, setSelectedSizes] = useState({});
  const [customSizesList, setCustomSizesList] = useState([]);
  const [newCustomSizeInput, setNewCustomSizeInput] = useState('');

  // Stato categorie personalizzate (salvate in localStorage per persistenza)
  const [customCategories, setCustomCategories] = useState(() => {
    try {
      const saved = localStorage.getItem('segreta_custom_categories');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [newCategoryInput, setNewCategoryInput] = useState('');

  // Calcolo di tutte le categorie disponibili (predefinite + personalizzate + estratte dai prodotti)
  const categoriesFromItems = (articoliAPI && articoliAPI.length > 0 ? articoliAPI : (articoli || []))
    .map(item => item.categoria ? item.categoria.trim().toUpperCase() : '')
    .filter(Boolean);

  const availableCategories = Array.from(new Set([
    ...DEFAULT_CATEGORIES_DONNA,
    ...customCategories.map(c => c.trim().toUpperCase()),
    ...categoriesFromItems
  ]));

  const handleAddCustomCategory = (e) => {
    if (e) e.preventDefault();
    const formatted = newCategoryInput.trim().toUpperCase();
    if (!formatted) return;

    if (availableCategories.includes(formatted)) {
      alert(`La categoria "${formatted}" è già presente.`);
      setNewCategoryInput('');
      return;
    }

    const updated = [...customCategories, formatted];
    setCustomCategories(updated);
    try {
      localStorage.setItem('segreta_custom_categories', JSON.stringify(updated));
    } catch (err) {
      console.warn('Impossibile salvare nel localStorage', err);
    }
    setNuovoArticolo(prev => ({ ...prev, categoria: formatted }));
    setNewCategoryInput('');
  };

  const handleDeleteCustomCategory = (catToDelete) => {
    const updated = customCategories.filter(c => c.toUpperCase() !== catToDelete.toUpperCase());
    setCustomCategories(updated);
    try {
      localStorage.setItem('segreta_custom_categories', JSON.stringify(updated));
    } catch (err) {
      console.warn('Errore aggiornamento localStorage', err);
    }
    if (nuovoArticolo.categoria.toUpperCase() === catToDelete.toUpperCase()) {
      setNuovoArticolo(prev => ({ ...prev, categoria: '' }));
    }
  };

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
    taglie: '',
    sconto: ''
  });

  // Stato per la gestione delle varianti colore
  const [variantiState, setVariantiState] = useState([]);
  const [uploadingVariante, setUploadingVariante] = useState(null); // indice variante in upload, o null

  const handleAddVariante = () => {
    setVariantiState(prev => [
      ...prev,
      { colore: '', hex: '#E295AB', immagini: [], taglie: [] }
    ]);
  };

  const handleUpdateVariante = (index, updatedFields) => {
    setVariantiState(prev => prev.map((v, i) => i === index ? { ...v, ...updatedFields } : v));
  };

  const handleRemoveVariante = (index) => {
    setVariantiState(prev => prev.filter((_, i) => i !== index));
  };

  // Upload foto per una specifica variante colore
  const handleVarianteImageUpload = async (e, variantIndex) => {
    const files = Array.from(e.target.files);
    if (!files || files.length === 0) return;

    setUploadingVariante(variantIndex);

    try {
      const uploadedUrls = [];
      const pass = sessionStorage.getItem('segreta_admin_password') || password;

      for (const imageFile of files) {
        let publicUrl = null;

        // ── Tentativo 1: API serverless ──────────────────────────────────
        try {
          const base64data = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(imageFile);
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
          });

          const response = await fetch('/api/admin/upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-admin-password': pass },
            body: JSON.stringify({
              imageData: base64data,
              fileName: imageFile.name || `variante-${Date.now()}.jpg`,
              mimeType: imageFile.type || 'image/jpeg'
            })
          });

          if (response.ok) {
            const json = await response.json();
            if (json.success && json.url) publicUrl = json.url;
          }
        } catch { /* API non disponibile in locale */ }

        // ── Tentativo 2: Upload diretto Supabase ─────────────────────────
        if (!publicUrl && supabaseClient) {
          const ext = (imageFile.name.split('.').pop() || 'jpg').toLowerCase();
          const uniqueName = `var-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
          const { error: uploadErr } = await supabaseClient.storage
            .from('immagini-prodotti')
            .upload(uniqueName, imageFile, { contentType: imageFile.type || 'image/jpeg', upsert: false });
          if (!uploadErr) {
            const { data: urlData } = supabaseClient.storage.from('immagini-prodotti').getPublicUrl(uniqueName);
            publicUrl = urlData?.publicUrl || null;
          }
        }

        if (!publicUrl) {
          alert('❌ Impossibile caricare la foto.\nIn locale usa: npm run dev:api\nIn produzione funziona automaticamente.');
          return;
        }
        uploadedUrls.push(publicUrl);
      }

      if (uploadedUrls.length === 0) return;

      // Aggiunge le nuove foto a quelle già presenti nella variante
      setVariantiState(prev => prev.map((v, i) => {
        if (i !== variantIndex) return v;
        const existing = Array.isArray(v.immagini) ? v.immagini : [];
        const unique = [...new Set([...existing, ...uploadedUrls])];
        return { ...v, immagini: unique };
      }));

    } catch (error) {
      alert(`❌ Errore: ${error.message}`);
    } finally {
      setUploadingVariante(null);
      if (e.target) e.target.value = '';
    }
  };

  const [editingId, setEditingId] = useState(null);
  const [newDashboardPassword, setNewDashboardPassword] = useState('');
  const [confirmDashboardPassword, setConfirmDashboardPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const ARCHIVE_STATUSES = ['Completato', 'Annullato', 'Archiviato'];
  const ordiniAttiviList = ordini.filter(o => !ARCHIVE_STATUSES.includes(o.stato));

  const filteredOrdini = ordini.filter(ord => {
    const isArchivedStatus = ARCHIVE_STATUSES.includes(ord.stato);
    if (activeTab === 'ordini' && isArchivedStatus) return false;
    if (activeTab === 'archivio' && !isArchivedStatus) return false;

    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      (ord.nome_cliente || '').toLowerCase().includes(query) ||
      (ord.telefono || '').includes(query) ||
      (ord.id || '').toString().includes(query)
    );
  });

  const getTabTitle = () => {
    switch (activeTab) {
      case 'ordini': return 'Ordini Ricevuti';
      case 'archivio': return 'Archivio Ordini';
      case 'articoli': return 'Catalogo Articoli';
      case 'nuovo': return editingId ? 'Modifica Articolo' : 'Nuovo Articolo';
      case 'impostazioni': return 'Impostazioni Dashboard';
      default: return 'Pannello di Controllo';
    }
  };

  const getTabSubtitle = () => {
    switch (activeTab) {
      case 'ordini': return 'Visualizza ed elabora gli ordini attivi ricevuti dal sito.';
      case 'archivio': return 'Elenco storico di tutti gli ordini archiviati o annullati.';
      case 'articoli': return 'Gestisci, attiva/disattiva ed elimina i prodotti esposti nello shop.';
      case 'nuovo': return editingId ? `Modifica i dettagli del prodotto ID: ${editingId}` : 'Aggiungi un nuovo abito o accessorio al tuo catalogo.';
      case 'impostazioni': return 'Configura le credenziali di accesso per Greta.';
      default: return 'Gestisci il negozio Segreta Style.';
    }
  };

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
      const cacheBuster = `_t=${Date.now()}`;
      const url = `/api/admin/ordini?${cacheBuster}${archivio ? '&archivio=true' : ''}`;
      const response = await fetch(url, {
        headers: {
          'x-admin-password': pass,
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        }
      });
      if (response.status === 401) {
        return;
      }
      const json = await response.json();
      if (json.success && Array.isArray(json.data)) {
        const saved = localStorage.getItem('segreta_ordini');
        const localList = saved ? JSON.parse(saved) : [];
        const existingIds = new Set(json.data.map(o => String(o.id)));
        const missingLocal = localList.filter(l => !existingIds.has(String(l.id)));
        setOrdini([...json.data, ...missingLocal]);
      }
    } catch (err) {
      console.warn('Connessione API per ordini fallita. Fallback su localStorage.', err);
      const saved = localStorage.getItem('segreta_ordini');
      setOrdini(saved ? JSON.parse(saved) : []);
    }
  }, [password]);

  // Effetto per caricare i dati non appena si è loggati + Polling automatico ogni 5 secondi
  useEffect(() => {
    if (isLoggedIn) {
      fetchArticoli();
      fetchOrdini(mostraArchivio);

      // Polling rapido ogni 5 secondi per aggiornare gli ordini quasi all'istante
      const interval = setInterval(() => {
        fetchOrdini(mostraArchivio);
      }, 5000);

      // Listener per aggiornamenti tra schede del browser in tempo reale
      const handleStorageChange = (e) => {
        if (e.key === 'segreta_ordini' || e.key === 'segreta_last_order') {
          fetchOrdini(mostraArchivio);
        }
      };
      window.addEventListener('storage', handleStorageChange);

      return () => {
        clearInterval(interval);
        window.removeEventListener('storage', handleStorageChange);
      };
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
        const json = await response.json().catch(() => ({ success: false }));
        if (json.data) setArticoliAPI(json.data);
        setIsAPIAvailable(true);
      } else if (response.status === 401) {
        setLoginError(true);
        setPassword('');
      } else {
        // Fallback locale in caso di API non raggiungibile (es. 404/502/504 in dev mode)
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
    if (onNavigateToHome) {
      onNavigateToHome();
    } else {
      window.location.href = '/';
    }
  };

  // --- CARICAMENTO IMMAGINI MULTIPLE ---
  // Strategia: 1° tenta API serverless /api/admin/upload (funziona in produzione)
  //            2° se API non disponibile, tenta upload diretto Supabase Storage dal browser
  //            3° se entrambi falliscono, mostra errore (mai salva base64 in DB)
  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files || files.length === 0) return;

    setUploading(true);

    try {
      const uploadedUrls = [];
      const pass = sessionStorage.getItem('segreta_admin_password') || password;

      for (const imageFile of files) {
        let publicUrl = null;

        // ── Tentativo 1: API serverless (Vercel / Cloudflare) ───────────────
        try {
          const base64data = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(imageFile);
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
          });

          const response = await fetch('/api/admin/upload', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-admin-password': pass
            },
            body: JSON.stringify({
              imageData: base64data,
              fileName: imageFile.name || `foto-${Date.now()}.jpg`,
              mimeType: imageFile.type || 'image/jpeg'
            })
          });

          if (response.ok) {
            const json = await response.json();
            if (json.success && json.url) {
              publicUrl = json.url; // ✅ Successo via API serverless
            }
          }
        } catch {
          // API non raggiungibile in locale (npm run dev senza backend)
        }

        // ── Tentativo 2: Upload diretto Supabase Storage dal browser ──────────
        if (!publicUrl && supabaseClient) {
          const ext = (imageFile.name.split('.').pop() || 'jpg').toLowerCase();
          const uniqueName = `art-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

          const { error: uploadErr } = await supabaseClient.storage
            .from('immagini-prodotti')
            .upload(uniqueName, imageFile, {
              contentType: imageFile.type || 'image/jpeg',
              upsert: false,
            });

          if (!uploadErr) {
            const { data: urlData } = supabaseClient.storage
              .from('immagini-prodotti')
              .getPublicUrl(uniqueName);
            publicUrl = urlData?.publicUrl || null;
          } else {
            console.warn('Upload diretto Supabase fallito:', uploadErr.message);
          }
        }

        // ── Nessun metodo disponibile: errore chiaro (mai base64 in DB) ─────
        if (!publicUrl) {
          alert(
            '❌ Impossibile caricare la foto.\n\n' +
            'In locale usa: npm run dev:api (avvia il backend su porta 3000)\n' +
            'In produzione l\'upload funziona automaticamente.'
          );
          return;
        }

        uploadedUrls.push(publicUrl);
      }

      if (uploadedUrls.length === 0) return;

      // ✅ SOSTITUISCE le foto esistenti con le nuove (non accumula)
      // Questo risolve il bug: 2 foto caricate → 4 nella preview
      setNuovoArticolo(prev => ({
        ...prev,
        immagine_url: uploadedUrls.join(',')
      }));

    } catch (error) {
      console.error('Errore imprevisto durante il caricamento:', error);
      alert(`❌ Errore: ${error.message}`);
    } finally {
      setUploading(false);
      if (e.target) e.target.value = '';
    }
  };

  const rimuoviImmagine = (urlToRemove) => {
    setNuovoArticolo(prev => {
      const raw = prev.immagine_url;
      const urlsList = raw
        ? (Array.isArray(raw) ? raw : String(raw).split(',').map(u => u.trim()).filter(Boolean))
        : [];
      const cleanUrls = urlsList.filter(u => u !== urlToRemove);
      return { ...prev, immagine_url: cleanUrls.join(',') };
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

  const resetNuovoArticoloForm = () => {
    setNuovoArticolo({
      titolo: '',
      descrizione: '',
      prezzo: '',
      immagine_url: '',
      target: 'Donna',
      categoria: '',
      taglie: '',
      sconto: ''
    });
    setSelectedSizes({});
    setCustomSizesList([]);
    setNewCustomSizeInput('');
    setVariantiState([]);
    setEditingId(null);
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

    let descrizioneFinale = nuovoArticolo.descrizione || '';
    const scontoNum = parseInt(nuovoArticolo.sconto);
    if (!isNaN(scontoNum) && scontoNum > 0) {
      descrizioneFinale = `[SCONTO:${scontoNum}] ${descrizioneFinale}`.trim();
    }

    const firstVarImg = (variantiState.length > 0 && variantiState[0].immagini && variantiState[0].immagini.length > 0)
      ? variantiState[0].immagini[0]
      : null;

    const articoloDaSalvare = {
      titolo: nuovoArticolo.titolo,
      descrizione: descrizioneFinale,
      prezzo: parseFloat(nuovoArticolo.prezzo),
      immagine_url: nuovoArticolo.immagine_url || (firstVarImg || ''),
      target: nuovoArticolo.target || 'Donna',
      categoria: nuovoArticolo.categoria,
      taglie: taglieFinali,
      varianti: variantiState.length > 0 ? variantiState : null,
      attivo: true
    };

    const saveLocalFallback = () => {
      if (editingId) {
        const updatedItem = { ...articoloDaSalvare, id: editingId, attivo: true };
        setArticoliAPI(prev => prev.map(a => a.id === editingId ? updatedItem : a));
        if (onAddArticolo) onAddArticolo(updatedItem);
      } else {
        const mockNew = { ...articoloDaSalvare, id: Date.now(), attivo: true, created_at: new Date().toISOString() };
        setArticoliAPI(prev => [mockNew, ...prev]);
        if (onAddArticolo) onAddArticolo(mockNew);
      }
      alert('Articolo salvato con successo!');
      resetNuovoArticoloForm();
      setActiveTab('articoli');
    };

    if (isAPIAvailable) {
      setLoading(true);
      try {
        const pass = sessionStorage.getItem('segreta_admin_password') || password;
        const method = editingId ? 'PUT' : 'POST';
        const url = editingId ? `/api/admin/prodotti/${editingId}` : '/api/admin/prodotti';

        const response = await fetch(url, {
          method,
          headers: { 
            'Content-Type': 'application/json',
            'x-admin-password': pass
          },
          body: JSON.stringify(articoloDaSalvare)
        });
        const json = await response.json().catch(() => ({ success: false }));
        if (json.success && json.data) {
          if (editingId) {
            setArticoliAPI(prev => prev.map(a => a.id === editingId ? json.data : a));
            if (onAddArticolo) onAddArticolo(json.data);
            alert('✅ Articolo modificato con successo sul database!');
          } else {
            setArticoliAPI(prev => [json.data, ...prev]);
            if (onAddArticolo) onAddArticolo(json.data);
            alert('✅ Articolo salvato sul database!');
          }
          resetNuovoArticoloForm();
          setActiveTab('articoli');
        } else {
          alert(`❌ Salvataggio fallito sul database: ${json.error || 'Password admin non valida o sessione scaduta.'}`);
        }
      } catch (err) {
        alert(`❌ Errore di rete durante il salvataggio: ${err.message}`);
      } finally {
        setLoading(false);
      }
    } else {
      saveLocalFallback();
    }
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
          },
          body: JSON.stringify({ action: 'toggle' })
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

  const handleAvviaModifica = (art) => {
    setEditingId(art.id);
    let desc = art.descrizione || '';

    // Estrarre varianti da B64 o testo se presenti in descrizione
    let variantiFromDesc = null;
    const matchB64 = desc.match(/\[VARIANTI_B64:([A-Za-z0-9+/=]+)\]/);
    if (matchB64) {
      try {
        const jsonStr = decodeURIComponent(escape(atob(matchB64[1])));
        variantiFromDesc = JSON.parse(jsonStr);
        desc = desc.replace(matchB64[0], '').trim();
      } catch {}
    }
    if (!variantiFromDesc) {
      const matchPlain = desc.match(/\[VARIANTI:([\s\S]+?)\](?=\s*$|\s+[A-Za-z0-9])/);
      if (matchPlain) {
        try {
          variantiFromDesc = JSON.parse(matchPlain[1]);
          desc = desc.replace(matchPlain[0], '').trim();
        } catch {}
      }
    }

    const matchSconto = desc.match(/\[SCONTO:(\d+)\]/);
    const scontoValue = matchSconto ? matchSconto[1] : '';
    const descrizionePulita = desc.replace(/\[SCONTO:\d+\]/g, '').replace(/\[VARIANTI_B64:[A-Za-z0-9+/=]+\]/g, '').trim();

    setNuovoArticolo({
      titolo: art.titolo,
      descrizione: descrizionePulita,
      prezzo: art.prezzo.toString(),
      immagine_url: art.immagine_url || '',
      target: art.target || 'Donna',
      categoria: art.categoria || '',
      taglie: art.taglie || '',
      sconto: scontoValue
    });

    // Imposta le taglie selezionate
    const taglieArray = art.taglie ? art.taglie.split(',').map(s => s.trim()) : [];
    const newSelectedSizes = {};
    const newCustomSizes = [];

    taglieArray.forEach(size => {
      if (PRESET_SIZES.includes(size)) {
        newSelectedSizes[size] = true;
      } else {
        newCustomSizes.push(size);
        newSelectedSizes[size] = true;
      }
    });

    setSelectedSizes(newSelectedSizes);
    setCustomSizesList(newCustomSizes);

    // Imposta varianti da colonna nativa o da fallback in descrizione
    const rawVarianti = art.varianti || variantiFromDesc;
    if (rawVarianti) {
      try {
        const parsed = Array.isArray(rawVarianti) ? rawVarianti : JSON.parse(rawVarianti);
        setVariantiState(parsed);
      } catch {
        setVariantiState([]);
      }
    } else {
      setVariantiState([]);
    }

    setActiveTab('nuovo'); // Vai al form
  };

  const handleChangePasswordSubmit = async (e) => {
    e.preventDefault();
    if (newDashboardPassword !== confirmDashboardPassword) {
      alert('Le due password non coincidono.');
      return;
    }
    if (newDashboardPassword.trim().length < 4) {
      alert('La password deve contenere almeno 4 caratteri.');
      return;
    }

    setLoading(true);
    try {
      const pass = sessionStorage.getItem('segreta_admin_password') || password;
      const response = await fetch('/api/admin/settings/password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': pass
        },
        body: JSON.stringify({ newPassword: newDashboardPassword.trim() })
      });
      const json = await response.json();
      if (json.success) {
        alert(json.message);
        sessionStorage.setItem('segreta_admin_password', newDashboardPassword.trim());
        setPassword(newDashboardPassword.trim());
        setNewDashboardPassword('');
        setConfirmDashboardPassword('');
        setShowNewPassword(false);
        setShowConfirmPassword(false);
        setActiveTab('ordini'); setMostraArchivio(false); fetchOrdini(false);
      } else {
        alert('Errore: ' + json.error);
      }
    } catch (err) {
      alert('Errore di connessione durante l\'aggiornamento.');
    } finally {
      setLoading(false);
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
      } catch (err) {
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

  const handleDeleteOrdine = async (ordineId) => {
    if (!window.confirm(`Sei sicura di voler eliminare definitivamente l'ordine #${ordineId}? L'azione non potrà essere annullata.`)) {
      return;
    }

    if (isAPIAvailable) {
      try {
        const pass = sessionStorage.getItem('segreta_admin_password') || password;
        const response = await fetch(`/api/admin/ordini/${ordineId}`, {
          method: 'DELETE',
          headers: {
            'x-admin-password': pass
          }
        });
        const json = await response.json();
        if (json.success) {
          setOrdini(prev => prev.filter(o => o.id !== ordineId));
        } else {
          alert(`Errore eliminazione: ${json.error || 'Impossibile eliminare l\'ordine.'}`);
        }
      } catch (err) {
        console.error('Errore durante l\'eliminazione dell\'ordine su DB.', err);
        setOrdini(prev => prev.filter(o => o.id !== ordineId));
      }
    } else {
      const nuoviOrdini = ordini.filter(o => o.id !== ordineId);
      setOrdini(nuoviOrdini);
      localStorage.setItem('segreta_ordini', JSON.stringify(nuoviOrdini));
    }
  };


  const handlePrintRicevuta = (o) => {
    const win = window.open('', '_blank');
    const items = safeParseJSON(o.dettaglio_articoli || o.articoli);
    const righe = items.map(i => `<tr><td>${i.titolo} (Taglia: ${i.taglia || i.tagliaSelezionata || 'U'})</td><td>x${i.quantita || 1}</td><td>€${parseFloat((i.prezzo || 0) * (i.quantita || 1)).toFixed(2)}</td></tr>`).join('');
    win.document.write(`<!DOCTYPE html><html lang="it"><head><meta charset="UTF-8"><title>Ricevuta #${o.id}</title>
      <style>body{font-family:sans-serif;padding:20px;color:#333;width:300px;margin:0 auto}table{width:100%;border-collapse:collapse}td{padding:4px 0}</style>
      </head><body>
      <h2 style="text-align:center">Segreta Style</h2>
      <p style="text-align:center">Ordine #${o.id}<br>${new Date(o.created_at).toLocaleString('it-IT')}</p>
      <hr>
      <p><strong>Cliente:</strong> ${o.nome_cliente}<br><strong>Tel:</strong> ${o.telefono}</p>
      <hr>
      <table>${righe}</table>
      <hr>
      <h3 style="text-align:right">Totale: €${parseFloat(o.totale).toFixed(2)}</h3>
      </body></html>`);
    win.document.close();
    win.print();
  };

  const printFilteredOrders = (type, ordine = null) => {
    if (type === 'PDF_LISTA') {
      handleDownloadPDF();
    } else if (type === 'RICEVUTA' && ordine) {
      handlePrintRicevuta(ordine);
    }
  };

  const handleDownloadPDF = () => {
    if (ordini.length === 0) return;
    const win = window.open('', '_blank');
    const titolo = mostraArchivio ? 'Archivio Ordini' : 'Ordini Attivi';
    const righe = ordini.map(o => {
      const items = safeParseJSON(o.dettaglio_articoli || o.articoli);
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
    <div className="admin-dashboard-layout fade-in">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <span className="brand-logo">SEGRETA</span>
          <span className="brand-subtitle">Style • Admin</span>
        </div>

        <nav className="admin-nav">
          <button
            className={`nav-item ${activeTab === 'ordini' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('ordini'); setMostraArchivio(false); fetchOrdini(false);
              fetchOrdini(false);
            }}
          >
            <ClipboardList size={18} />
            <span>Ordini Attivi</span>
            {ordiniAttiviList.length > 0 && activeTab !== 'archivio' && (
              <span className="nav-badge">{ordiniAttiviList.length}</span>
            )}
          </button>

          <button
            className={`nav-item ${activeTab === 'archivio' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('archivio'); setMostraArchivio(true); fetchOrdini(true);
              fetchOrdini(true);
            }}
          >
            <Archive size={18} />
            <span>Archivio Ordini</span>
          </button>

          <button
            className={`nav-item ${activeTab === 'articoli' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('articoli');
              setEditingId(null);
            }}
          >
            <Package size={18} />
            <span>Catalogo Articoli</span>
          </button>

          <button
            className={`nav-item ${activeTab === 'nuovo' ? 'active' : ''}`}
            onClick={() => {
              if (!editingId) {
                resetNuovoArticoloForm();
              }
              setActiveTab('nuovo');
            }}
          >
            <PlusCircle size={18} />
            <span>{editingId ? 'Modifica Articolo' : 'Nuovo Articolo'}</span>
          </button>

          <button
            className={`nav-item ${activeTab === 'impostazioni' ? 'active' : ''}`}
            onClick={() => setActiveTab('impostazioni')}
          >
            <Settings size={18} />
            <span>Impostazioni</span>
          </button>
        </nav>

        <div className="admin-sidebar-footer">
          <div className="db-status">
            {isAPIAvailable ? (
              <span className="status-dot online">● DB Connesso</span>
            ) : (
              <span className="status-dot offline">● Offline</span>
            )}
          </div>
          <button className="btn-logout-sidebar" onClick={handleLogout} aria-label="Scollegati dalla dashboard">
            <LogOut size={16} />
            <span>Scollegati</span>
          </button>
        </div>
      </aside>

      <main className="admin-main-content">
        <header className="admin-content-header">
          <div>
            <h2>{getTabTitle()}</h2>
            <p className="dashboard-sub">{getTabSubtitle()}</p>
          </div>
          <div className="admin-header-actions" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            {activeTab === 'nuovo' && (
              <button
                type="button"
                onClick={() => { resetNuovoArticoloForm(); setActiveTab('articoli'); }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: '#E295AB',
                  color: '#FFFFFF',
                  fontWeight: 600,
                  border: 'none',
                  borderRadius: '8px',
                  padding: '8px 16px',
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  boxShadow: '0 2px 5px rgba(226, 149, 171, 0.4)',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#d48197'; }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#E295AB'; }}
              >
                ← Torna al Catalogo Articoli
              </button>
            )}
            <a 
              href="/" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="btn-view-site"
              title="Apri il sito in una nuova scheda per verificare le modifiche"
            >
              <Home size={16} />
              <span>Vedi Sito (Home)</span>
              <ExternalLink size={14} style={{ opacity: 0.8 }} />
            </a>
          </div>
        </header>

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
          <div className="orders-toolbar">
            <div className="search-input-wrapper">
              <input
                type="text"
                placeholder="Cerca per cliente, telefono o ID..."
                className="form-control"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Cerca ordini"
              />
            </div>
            
            <div className="orders-download-group">
              <button 
                className="download-btn"
                onClick={() => printFilteredOrders('PDF_LISTA')}
                title="Stampa lista ordini filtrata"
              >
                <Download size={16} /> PDF Lista
              </button>
            </div>
          </div>

          {filteredOrdini.length === 0 ? (
            <div className="no-data-msg">Nessun ordine attivo trovato.</div>
          ) : (
            <div className="orders-admin-list">
              {filteredOrdini.map(ord => (
                <div key={ord.id} className="order-admin-card">
                  <div className="order-admin-header">
                    <div className="order-admin-title" style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                      <h4>Ordine #{ord.id}</h4>
                      <span className={`payment-method-badge ${(ord.metodo_pagamento || 'Satispay').toLowerCase().includes('paypal') ? 'paypal' : 'satispay'}`}>
                        {(ord.metodo_pagamento || 'Satispay').toLowerCase().includes('paypal') ? '🟡 PayPal / Carta' : '🔴 Satispay'}
                      </span>
                      <div className="order-admin-meta">
                        <span>{new Date(ord.created_at).toLocaleString('it-IT')}</span>
                      </div>
                    </div>
                    <div className="order-admin-status-area">
                      <select 
                        className="select-status"
                        value={ord.stato || 'Verifica Pagamento'}
                        onChange={(e) => handleUpdateStatoOrdine(ord.id, e.target.value)}
                        aria-label="Stato ordine"
                      >
                        <option value="Verifica Pagamento">🔍 Verifica Pagamento</option>
                        <option value="Pagamento Ricevuto - In Lavorazione">💳 Pagamento Ricevuto - In Lavorazione 📦</option>
                        <option value="Spedito">🚚 Spedito</option>
                        <option value="Pronto al Ritiro">🛍️ Ritiro Pronto</option>
                        <option value="Completato">✅ Completato</option>
                        <option value="Annullato">❌ Annullato</option>
                      </select>
                      
                      <button 
                        className="download-btn"
                        onClick={() => printFilteredOrders('RICEVUTA', ord)}
                        title="Stampa ricevuta ordine"
                      >
                        <Download size={14} /> Ricevuta
                      </button>

                      <button 
                        className="btn-delete-order"
                        onClick={() => handleDeleteOrdine(ord.id)}
                        title="Elimina definitivamente ordine"
                      >
                        <Trash size={14} /> Elimina
                      </button>
                    </div>
                  </div>
                  
                  <div className="order-admin-body">
                    <div className="order-info-section">
                      <h5>Cliente e Consegna</h5>
                      <div className="order-info-grid">
                        <span className="info-label">Nome:</span>
                        <span className="info-value">{ord.nome_cliente}</span>
                        
                        <span className="info-label">Telefono:</span>
                        <div className="info-value-with-action">
                          <span>{ord.telefono}</span>
                          <a
                            href={getWhatsAppUrl(ord)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-whatsapp-direct"
                            title={`Avvisa ${ord.nome_cliente} su WhatsApp`}
                          >
                            <MessageCircle size={14} />
                            <span>WhatsApp</span>
                          </a>
                        </div>
                        
                        <span className="info-label">Metodo:</span>
                        <span className="info-value" style={{fontWeight: 600}}>{ord.metodo_consegna}</span>
                        
                        <span className="info-label">Indirizzo:</span>
                        <span className="info-value">{ord.indirizzo_spedizione || ord.indirizzo || (ord.metodo_consegna === 'Ritiro in negozio' ? 'Ritiro in negozio' : '⚠️ Da confermare')}</span>
                        
                        {ord.email && (
                          <>
                            <span className="info-label">Email:</span>
                            <span className="info-value">{ord.email}</span>
                          </>
                        )}
                        
                        {ord.note && (
                          <>
                            <span className="info-label">Note:</span>
                            <span className="info-value" style={{fontStyle: 'italic'}}>{ord.note}</span>
                          </>
                        )}
                      </div>
                    </div>
                    
                    <div className="order-info-section">
                      <h5>Articoli Acquistati</h5>
                      <div style={{ fontSize: '0.88rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {safeParseJSON(ord.dettaglio_articoli || ord.articoli).map((item, idx) => (
                            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '4px' }}>
                              <span>
                                {item.titolo} (x{item.quantita || 1}) - Taglia: {item.taglia || item.tagliaSelezionata || 'U'}
                              </span>
                              <span style={{ fontWeight: 600 }}>€{parseFloat((item.prezzo || 0) * (item.quantita || 1)).toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', fontWeight: 'bold', fontSize: '0.95rem' }}>
                          <span>Totale Ordine:</span>
                          <span style={{ color: 'var(--accent-gold-hover)' }}>€{parseFloat(ord.totale).toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Archivio Ordini */}
      {activeTab === 'archivio' && !loading && (
        <div className="dashboard-content fade-in">
          <div className="orders-toolbar">
            <div className="search-input-wrapper">
              <input
                type="text"
                placeholder="Cerca in archivio..."
                className="form-control"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Cerca in archivio"
              />
            </div>
            <div className="orders-download-group">
              <button 
                className="download-btn"
                onClick={() => printFilteredOrders('PDF_LISTA')}
                title="Stampa lista ordini archiviata"
              >
                <Download size={16} /> PDF Lista
              </button>
            </div>
          </div>

          {filteredOrdini.length === 0 ? (
            <div className="no-data-msg">Nessun ordine archiviato trovato.</div>
          ) : (
            <div className="orders-admin-list">
              {filteredOrdini.map(ord => (
                <div key={ord.id} className="order-admin-card" style={{ opacity: 0.85 }}>
                  <div className="order-admin-header">
                    <div className="order-admin-title" style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                      <h4>Ordine #{ord.id}</h4>
                      <span className={`payment-method-badge ${(ord.metodo_pagamento || 'Satispay').toLowerCase().includes('paypal') ? 'paypal' : 'satispay'}`}>
                        {(ord.metodo_pagamento || 'Satispay').toLowerCase().includes('paypal') ? '🟡 PayPal / Carta' : '🔴 Satispay'}
                      </span>
                      <div className="order-admin-meta">
                        <span>{new Date(ord.created_at).toLocaleString('it-IT')}</span>
                      </div>
                    </div>
                    <div className="order-admin-status-area">
                      <select 
                        className="select-status"
                        value={ord.stato || 'Verifica Pagamento'}
                        onChange={(e) => handleUpdateStatoOrdine(ord.id, e.target.value)}
                        aria-label="Stato ordine"
                      >
                        <option value="Verifica Pagamento">🔍 Verifica Pagamento</option>
                        <option value="Pagamento Ricevuto - In Lavorazione">💳 Pagamento Ricevuto - In Lavorazione 📦</option>
                        <option value="Spedito">🚚 Spedito</option>
                        <option value="Pronto al Ritiro">🛍️ Ritiro Pronto</option>
                        <option value="Completato">✅ Completato</option>
                        <option value="Annullato">❌ Annullato</option>
                      </select>
                      
                      <button 
                        className="download-btn"
                        onClick={() => printFilteredOrders('RICEVUTA', ord)}
                        title="Stampa ricevuta"
                      >
                        <Download size={14} /> Ricevuta
                      </button>

                      <button 
                        className="btn-delete-order"
                        onClick={() => handleDeleteOrdine(ord.id)}
                        title="Elimina definitivamente ordine"
                      >
                        <Trash size={14} /> Elimina
                      </button>
                    </div>
                  </div>
                  
                  <div className="order-admin-body">
                    <div className="order-info-section">
                      <h5>Dettagli Spedizione</h5>
                      <div className="order-info-grid">
                        <span className="info-label">Nome:</span>
                        <span className="info-value">{ord.nome_cliente}</span>
                        <span className="info-label">Telefono:</span>
                        <div className="info-value-with-action">
                          <span>{ord.telefono}</span>
                          <a
                            href={getWhatsAppUrl(ord)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-whatsapp-direct"
                            title={`Avvisa ${ord.nome_cliente} su WhatsApp`}
                          >
                            <MessageCircle size={14} />
                            <span>WhatsApp</span>
                          </a>
                        </div>
                        <span className="info-label">Metodo:</span>
                        <span className="info-value">{ord.metodo_consegna}</span>
                        <span className="info-label">Indirizzo:</span>
                        <span className="info-value">{ord.indirizzo_spedizione || ord.indirizzo || (ord.metodo_consegna === 'Ritiro in negozio' ? 'Ritiro in negozio' : '⚠️ Da confermare')}</span>
                        
                        {ord.email && (
                          <>
                            <span className="info-label">Email:</span>
                            <span className="info-value">{ord.email}</span>
                          </>
                        )}
                      </div>
                    </div>
                    
                    <div className="order-info-section">
                      <h5>Prodotti acquistati</h5>
                      <div style={{ fontSize: '0.88rem' }}>
                        {safeParseJSON(ord.dettaglio_articoli || ord.articoli).map((item, idx) => (
                          <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '4px', marginBottom: '4px' }}>
                            <span>{item.titolo} (x{item.quantita || 1}) - Taglia: {item.taglia || item.tagliaSelezionata || 'U'}</span>
                            <span style={{ fontWeight: 600 }}>€{parseFloat((item.prezzo || 0) * (item.quantita || 1)).toFixed(2)}</span>
                          </div>
                        ))}
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', fontWeight: 'bold' }}>
                          <span>Totale:</span>
                          <span>€{parseFloat(ord.totale).toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Gestione Catalogo */}
      {activeTab === 'articoli' && !loading && (
        <div className="dashboard-content fade-in">
          <div className="table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Foto</th>
                  <th>Titolo</th>
                  <th>Categoria</th>
                  <th>Target</th>
                  <th>Prezzo</th>
                  <th>Taglie</th>
                  <th>Stato</th>
                  <th>Azioni</th>
                </tr>
              </thead>
              <tbody>
                {listaArticoliVisualizzati.map(art => (
                  <tr key={art.id}>
                    <td>
                      <img 
                        src={(() => {
                          if (art.immagine_url) {
                            const raw = Array.isArray(art.immagine_url) ? art.immagine_url[0] : String(art.immagine_url).split(',')[0];
                            if (raw && raw.trim()) return raw.trim();
                          }
                          if (art.varianti) {
                            try {
                              const vars = Array.isArray(art.varianti) ? art.varianti : JSON.parse(art.varianti);
                              if (vars.length > 0 && vars[0].immagini && vars[0].immagini.length > 0) return vars[0].immagini[0];
                            } catch {}
                          }
                          return 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=600&q=80';
                        })()} 
                        alt={art.titolo} 
                        style={{ width: '40px', height: '50px', objectFit: 'cover', borderRadius: '4px' }}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=600&q=80';
                        }} 
                      />
                    </td>
                    <td style={{ fontWeight: 600 }}>{art.titolo}</td>
                    <td>{art.categoria}</td>
                    <td>{art.target}</td>
                    <td className="price-td">
                      €{parseFloat(art.prezzo).toFixed(2)}
                      {(() => {
                        const match = art.descrizione ? art.descrizione.match(/\[SCONTO:(\d+)\]/) : null;
                        return match ? (
                          <span style={{ marginLeft: '6px', color: '#E295AB', fontSize: '0.8rem', fontWeight: 700 }}>
                            (-{match[1]}%)
                          </span>
                        ) : null;
                      })()}
                    </td>
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
                    <td style={{ verticalAlign: 'middle' }}>
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <button
                          className="edit-art-btn"
                          onClick={() => handleAvviaModifica(art)}
                          aria-label={`Modifica ${art.titolo}`}
                          style={{ color: 'var(--accent-gold-hover)', border: 'none', background: 'none', cursor: 'pointer', padding: '4px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          className="delete-art-btn"
                          onClick={() => handleEliminaArticolo(art.id)}
                          aria-label={`Elimina ${art.titolo}`}
                          style={{ border: 'none', background: 'none', cursor: 'pointer', padding: '4px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                          <Trash size={16} />
                        </button>
                      </div>
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

            {/* ── Pulsante Torna Indietro ── */}
            <div style={{ marginBottom: '20px' }}>
              <button
                type="button"
                onClick={() => { resetNuovoArticoloForm(); setActiveTab('articoli'); }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'var(--bg-secondary, #F4F4F5)',
                  border: '1.5px solid var(--border-color, #E4E4E7)',
                  borderRadius: '8px',
                  padding: '10px 18px',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  color: 'var(--text-primary, #2C2520)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#E295AB'; e.currentTarget.style.color = '#E295AB'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-color, #E4E4E7)'; e.currentTarget.style.color = 'var(--text-primary, #2C2520)'; }}
              >
                ← Torna al Catalogo Articoli
              </button>
            </div>

            <div className="form-group" style={{ marginBottom: '15px' }}>
              <label className="form-label" htmlFor="new_titolo">Titolo Articolo *</label>
              <input
                type="text"
                id="new_titolo"
                className="form-control"
                value={nuovoArticolo.titolo}
                onChange={(e) => setNuovoArticolo(prev => ({...prev, titolo: e.target.value}))}
                required
                placeholder="Es. Gonna Plissé Rosa"
              />
            </div>

            <div className="form-grid-3" style={{ marginBottom: '15px' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="new_prezzo">Prezzo Originale (€) *</label>
                <input
                  type="number"
                  id="new_prezzo"
                  step="0.01"
                  className="form-control"
                  value={nuovoArticolo.prezzo}
                  onChange={(e) => setNuovoArticolo(prev => ({...prev, prezzo: e.target.value}))}
                  required
                  placeholder="Es. 29.90"
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="new_sconto">Sconto (%)</label>
                <input
                  type="number"
                  id="new_sconto"
                  min="0"
                  max="99"
                  className="form-control"
                  value={nuovoArticolo.sconto}
                  onChange={(e) => setNuovoArticolo(prev => ({...prev, sconto: e.target.value}))}
                  placeholder="Es. 20"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Prezzo Scontato (€)</label>
                <input
                  type="text"
                  className="form-control"
                  disabled
                  value={(() => {
                    const price = parseFloat(nuovoArticolo.prezzo);
                    const disc = parseInt(nuovoArticolo.sconto);
                    if (isNaN(price)) return '';
                    if (isNaN(disc) || disc <= 0) return `€${price.toFixed(2)}`;
                    const finalPrice = price - (price * disc) / 100;
                    return `€${finalPrice.toFixed(2)}`;
                  })()}
                  style={{
                    backgroundColor: 'rgba(226, 149, 171, 0.08)',
                    borderColor: '#E295AB',
                    color: '#E295AB',
                    fontWeight: '700',
                    cursor: 'not-allowed'
                  }}
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
                  onChange={(e) => setNuovoArticolo(prev => ({...prev, target: e.target.value, categoria: ''}))}
                  required
                  disabled
                  style={{ minHeight: '44px' }}
                >
                  <option value="Donna">Donna</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="select_categoria">Categoria *</label>
                <select
                  id="select_categoria"
                  className="form-control"
                  value={nuovoArticolo.categoria}
                  onChange={(e) => setNuovoArticolo(prev => ({...prev, categoria: e.target.value}))}
                  required
                  style={{ minHeight: '44px' }}
                >
                  <option value="" disabled>-- Seleziona una Categoria --</option>
                  {availableCategories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>

                {/* Form inline veloce per aggiungere una nuova categoria al volo */}
                <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Nuova categoria (es. GONNE)..."
                    value={newCategoryInput}
                    onChange={(e) => setNewCategoryInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCustomCategory();
                      }
                    }}
                    style={{ fontSize: '0.85rem', padding: '6px 12px' }}
                  />
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={handleAddCustomCategory}
                    style={{ whiteSpace: 'nowrap', fontSize: '0.85rem', padding: '6px 14px', height: 'auto' }}
                  >
                    + Aggiungi
                  </button>
                </div>
                {customCategories.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', width: '100%' }}>Personalizzate:</span>
                    {customCategories.map(cat => (
                      <span
                        key={cat}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          background: '#F3E8EE',
                          color: '#2C2520',
                          padding: '3px 8px',
                          borderRadius: '12px',
                          fontSize: '0.8rem',
                          fontWeight: '600'
                        }}
                      >
                        {cat}
                        <button
                          type="button"
                          onClick={() => handleDeleteCustomCategory(cat)}
                          title={`Rimuovi categoria ${cat}`}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: '#999',
                            fontSize: '1rem',
                            lineHeight: '1',
                            padding: '0 2px'
                          }}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
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

            {/* ── Gestione Varianti Colore (Opzionale per capi multicolore) ── */}
            <div className="varianti-section-card" style={{
              background: 'var(--bg-secondary, #F8F8FA)',
              border: '1px dashed #E295AB',
              borderRadius: '8px',
              padding: '18px',
              margin: '20px 0'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <h4 style={{ margin: 0, fontSize: '1rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  🎨 Varianti Colore e Foto Dedicate (Opzionale)
                </h4>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleAddVariante}
                  style={{ fontSize: '0.85rem', padding: '6px 14px' }}
                >
                  + Aggiungi Colore
                </button>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '14px', lineHeight: '1.4' }}>
                Se questo capo è disponibile in più colori (es. <em>Rosa, Nero, Beige</em>), aggiungi qui le varianti per associare la foto ed il gruppo di taglie disponibili a ciascun colore.
              </p>

              {variantiState.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {variantiState.map((varItem, vIdx) => (
                    <div
                      key={vIdx}
                      style={{
                        background: 'var(--bg-primary, #FFFFFF)',
                        border: '1px solid var(--border-color, #E4E4E7)',
                        borderRadius: '8px',
                        padding: '14px',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                      }}
                    >
                      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '12px' }}>
                        <div style={{ flex: '1 1 200px' }}>
                          <label className="form-label" style={{ fontSize: '0.8rem', marginBottom: '4px' }}>Nome Colore *</label>
                          <input
                            type="text"
                            className="form-control"
                            placeholder="Es. Rosa CIPRIA, Nero NOTTE..."
                            value={varItem.colore}
                            onChange={(e) => handleUpdateVariante(vIdx, { colore: e.target.value })}
                            required
                          />
                        </div>
                        <div>
                          <label className="form-label" style={{ fontSize: '0.8rem', marginBottom: '4px' }}>Colore Pallino</label>
                          <input
                            type="color"
                            value={varItem.hex || '#E295AB'}
                            onChange={(e) => handleUpdateVariante(vIdx, { hex: e.target.value })}
                            style={{ width: '44px', height: '38px', padding: 0, border: '1px solid #DDD', borderRadius: '4px', cursor: 'pointer' }}
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveVariante(vIdx)}
                          title="Rimuovi questa variante colore"
                          style={{ background: 'none', border: 'none', color: '#C0392B', cursor: 'pointer', marginTop: '18px', padding: '6px' }}
                        >
                          <Trash size={18} />
                        </button>
                      </div>

                      {/* Upload Foto variante */}
                      <div style={{ marginBottom: '12px' }}>
                        <label className="form-label" style={{ fontSize: '0.8rem', marginBottom: '6px' }}>
                          Foto per colore {varItem.colore || `#${vIdx+1}`}
                        </label>
                        <div className="upload-btn-wrapper">
                          <button type="button" className="btn-secondary upload-btn-trigger" style={{ fontSize: '0.8rem', padding: '8px 14px' }}>
                            {uploadingVariante === vIdx ? (
                              <div className="upload-placeholder loading">
                                <Loader className="spin" size={16} />
                                <span>Caricamento...</span>
                              </div>
                            ) : (
                              <>
                                <Upload size={14} style={{ marginRight: '6px' }} />
                                Carica foto {varItem.colore || 'colore'} (anche multiple)
                              </>
                            )}
                          </button>
                          <input
                            type="file"
                            multiple
                            accept="image/*"
                            className="file-input-hidden"
                            disabled={uploadingVariante === vIdx}
                            onChange={(e) => handleVarianteImageUpload(e, vIdx)}
                            aria-label={`Carica foto per variante ${varItem.colore || vIdx+1}`}
                          />
                        </div>

                        {/* Preview miniature foto variante */}
                        {varItem.immagini && varItem.immagini.length > 0 && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '10px' }}>
                            {varItem.immagini.map((url, imgIdx) => (
                              <div key={imgIdx} style={{ position: 'relative', width: '70px', height: '84px', borderRadius: '6px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                                <img src={url} alt={`Foto ${imgIdx+1} - ${varItem.colore}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newImgs = varItem.immagini.filter((_, i) => i !== imgIdx);
                                    handleUpdateVariante(vIdx, { immagini: newImgs });
                                  }}
                                  style={{ position: 'absolute', top: '3px', right: '3px', background: 'rgba(0,0,0,0.55)', color: 'white', border: 'none', borderRadius: '50%', width: '20px', height: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}
                                >
                                  <Trash size={11} />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Selection Taglie per colore */}
                      <div>
                        <label className="form-label" style={{ fontSize: '0.8rem', marginBottom: '6px' }}>Taglie disponibili per {varItem.colore || 'questo colore'}</label>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                          {[...PRESET_SIZES, ...customSizesList].map(sz => {
                            const isChecked = varItem.taglie ? varItem.taglie.includes(sz) : false;
                            return (
                              <label key={sz} style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '0.8rem', cursor: 'pointer', background: isChecked ? '#F3E8EE' : 'var(--bg-secondary, #F4F4F5)', padding: '4px 10px', borderRadius: '6px', border: isChecked ? '1px solid #E295AB' : '1px solid #DDD' }}>
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={(e) => {
                                    const currentTaglie = varItem.taglie || [];
                                    const newTaglie = e.target.checked
                                      ? [...currentTaglie, sz]
                                      : currentTaglie.filter(t => t !== sz);
                                    handleUpdateVariante(vIdx, { taglie: newTaglie });
                                  }}
                                />
                                {sz}
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
                  {[...new Set((Array.isArray(nuovoArticolo.immagine_url) ? nuovoArticolo.immagine_url : String(nuovoArticolo.immagine_url).split(',')).map(u => u.trim()).filter(Boolean))].map((url, idx) => (
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
                onChange={(e) => setNuovoArticolo(prev => ({...prev, descrizione: e.target.value}))}
                placeholder="Inserisci i dettagli del materiale, vestibilità..."
              ></textarea>
            </div>

            <button type="submit" className="btn-primary" disabled={uploading}>
              {editingId ? 'Salva Modifiche' : 'Salva Articolo'}
            </button>
          </form>
        </div>
      )}

      {/* Tab 5: Impostazioni */}
      {activeTab === 'impostazioni' && !loading && (
        <div className="dashboard-content fade-in">
          <div className="settings-box" style={{ maxWidth: '500px' }}>
            <h3>Gestione Password Dashboard</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>
              Da qui puoi cambiare la password di accesso a questo pannello di controllo. La nuova password verrà salvata in modo sicuro nel database Supabase.
            </p>
            
            <form onSubmit={handleChangePasswordSubmit}>
              <div className="form-group" style={{ marginBottom: '15px' }}>
                <label className="form-label" htmlFor="new_password_input">Nuova Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showNewPassword ? "text" : "password"}
                    id="new_password_input"
                    className="form-control"
                    value={newDashboardPassword}
                    onChange={(e) => setNewDashboardPassword(e.target.value)}
                    placeholder="Inserisci la nuova password..."
                    required
                    style={{ paddingRight: '40px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
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
                    {showNewPassword ? (
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
              </div>
              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label className="form-label" htmlFor="confirm_password_input">Conferma Nuova Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    id="confirm_password_input"
                    className="form-control"
                    value={confirmDashboardPassword}
                    onChange={(e) => setConfirmDashboardPassword(e.target.value)}
                    placeholder="Ripeti la password..."
                    required
                    style={{ paddingRight: '40px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
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
                    {showConfirmPassword ? (
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
              </div>
              <button type="submit" className="btn-primary">
                Aggiorna Password
              </button>
            </form>
          </div>

          {/* Card Gestione Categorie Catalogo */}
          <div className="settings-box" style={{ maxWidth: '500px', marginTop: '30px' }}>
            <h3>Gestione Categorie Catalogo</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>
              Gestisci le categorie dei prodotti del negozio. Aggiungi nuove categorie in totale autonomia; appariranno subito sia nel pannello che nello Shop.
            </p>

            <form onSubmit={handleAddCustomCategory} style={{ marginBottom: '20px' }}>
              <div className="form-group" style={{ marginBottom: '15px' }}>
                <label className="form-label" htmlFor="settings_new_category_input">Aggiungi Nuova Categoria</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input
                    type="text"
                    id="settings_new_category_input"
                    className="form-control"
                    placeholder="Es. GONNE, ACCESSORI, BODY..."
                    value={newCategoryInput}
                    onChange={(e) => setNewCategoryInput(e.target.value)}
                    style={{ flex: 1 }}
                  />
                  <button type="submit" className="btn-primary" style={{ whiteSpace: 'nowrap' }}>
                    + Aggiungi
                  </button>
                </div>
              </div>
            </form>

            <h4 style={{ fontSize: '0.95rem', marginBottom: '12px', color: 'var(--text-primary)' }}>Tutte le Categorie Attive:</h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {availableCategories.map(cat => {
                const isCustom = customCategories.some(c => c.toUpperCase() === cat.toUpperCase());
                return (
                  <span
                    key={cat}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      background: isCustom ? '#F3E8EE' : 'var(--bg-secondary, #F4F4F5)',
                      color: 'var(--text-primary, #2C2520)',
                      padding: '6px 14px',
                      borderRadius: '16px',
                      fontSize: '0.85rem',
                      fontWeight: isCustom ? '600' : '500',
                      border: isCustom ? '1px solid #E295AB' : '1px solid var(--border-color, #E4E4E7)'
                    }}
                  >
                    {cat}
                    {isCustom && (
                      <button
                        type="button"
                        onClick={() => handleDeleteCustomCategory(cat)}
                        title={`Rimuovi categoria personalizzata ${cat}`}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: '#C0392B',
                          fontSize: '1.1rem',
                          lineHeight: '1',
                          padding: '0 2px',
                          fontWeight: 'bold'
                        }}
                      >
                        ×
                      </button>
                    )}
                  </span>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </main>
    <style>{`
    /* Layout a due colonne (Sidebar + Content) */
    .admin-dashboard-layout {
      display: flex;
      min-height: 100vh;
      background-color: var(--bg-primary);
      color: var(--text-primary);
      font-family: var(--font-sans);
    }

    /* Sidebar elegantissima */
    .admin-sidebar {
      width: 260px;
      background-color: var(--bg-secondary);
      border-right: 1px solid var(--border-color);
      display: flex;
      flex-direction: column;
      padding: var(--spacing-lg) var(--spacing-md);
      flex-shrink: 0;
      position: sticky;
      top: 0;
      height: 100vh;
    }

    .admin-brand {
      display: flex;
      flex-direction: column;
      margin-bottom: var(--spacing-xl);
      padding: 0 var(--spacing-sm);
    }

    .brand-logo {
      font-family: var(--font-serif);
      font-size: 1.5rem;
      font-weight: 700;
      letter-spacing: 0.1em;
      color: var(--text-primary);
    }

    .brand-subtitle {
      font-size: 0.72rem;
      text-transform: uppercase;
      letter-spacing: 0.15em;
      color: var(--accent-gold);
      margin-top: 4px;
      font-weight: 600;
    }

    .admin-nav {
      display: flex;
      flex-direction: column;
      gap: 6px;
      flex-grow: 1;
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 14px;
      border-radius: var(--radius-md);
      color: var(--text-secondary);
      background: none;
      border: none;
      font-size: 0.9rem;
      font-weight: 500;
      cursor: pointer;
      text-align: left;
      transition: all 0.2s ease;
      position: relative;
    }

    .nav-item:hover {
      background-color: var(--bg-tertiary);
      color: var(--text-primary);
    }

    .nav-item.active {
      background-color: var(--accent-soft-gold);
      color: var(--accent-gold-hover);
      font-weight: 600;
    }

    .nav-badge {
      margin-left: auto;
      background-color: var(--accent-gold);
      color: white;
      font-size: 0.72rem;
      padding: 2px 6px;
      border-radius: var(--radius-full);
      font-weight: 700;
    }

    .admin-sidebar-footer {
      border-top: 1px solid var(--border-color);
      padding-top: var(--spacing-md);
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .db-status {
      font-size: 0.75rem;
      padding: 0 var(--spacing-sm);
    }

    .status-dot {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-weight: 600;
    }

    .status-dot.online {
      color: var(--success);
    }

    .status-dot.offline {
      color: var(--error);
    }

    .btn-logout-sidebar {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      width: 100%;
      background: none;
      border: 1px solid var(--border-color);
      color: var(--text-secondary);
      padding: 8px 12px;
      border-radius: var(--radius-md);
      font-size: 0.85rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .btn-logout-sidebar:hover {
      background-color: var(--error);
      color: white;
      border-color: var(--error);
    }

    /* Main Content */
    .admin-main-content {
      flex-grow: 1;
      padding: var(--spacing-xl) var(--spacing-xxl);
      overflow-y: auto;
      height: 100vh;
      background-color: var(--bg-primary);
    }

    .admin-content-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--spacing-xl);
      border-bottom: 1px solid var(--border-color);
      padding-bottom: var(--spacing-md);
      flex-wrap: wrap;
      gap: var(--spacing-md);
    }

    .btn-view-site {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      background-color: var(--bg-secondary);
      color: var(--text-primary);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      font-size: 0.88rem;
      font-weight: 600;
      text-decoration: none;
      transition: var(--transition-fast);
      box-shadow: var(--shadow-sm);
    }

    .btn-view-site:hover {
      background-color: var(--accent-gold);
      color: #ffffff;
      border-color: var(--accent-gold);
      transform: translateY(-1px);
      box-shadow: var(--shadow-md);
    }

    .admin-content-header h2 {
      font-family: var(--font-serif);
      font-size: 1.8rem;
      color: var(--text-primary);
      margin: 0;
    }

    .dashboard-sub {
      font-size: 0.9rem;
      color: var(--text-secondary);
      margin: 4px 0 0 0;
    }

    /* Struttura della Dashboard Content */
    .dashboard-content {
      animation: fadeIn 0.3s ease;
    }

    /* Toolbar per la ricerca e filtri */
    .orders-toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: var(--spacing-md);
      margin-bottom: var(--spacing-lg);
      flex-wrap: wrap;
    }

    .search-input-wrapper {
      position: relative;
      flex: 1;
      min-width: 250px;
    }

    .orders-download-group {
      display: flex;
      gap: var(--spacing-xs);
    }

    .download-btn {
      display: inline-flex;
      align-items: center;
      gap: var(--spacing-xs);
      background-color: var(--bg-secondary);
      border: 1px solid var(--border-color);
      padding: 0.5rem 1rem;
      border-radius: var(--radius-md);
      font-size: 0.82rem;
      cursor: pointer;
      transition: all 0.2s ease;
      color: var(--text-primary);
    }

    .download-btn:hover {
      background-color: var(--bg-tertiary);
    }

    /* Lista degli ordini */
    .orders-admin-list {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-md);
    }

    .order-admin-card {
      background-color: var(--bg-secondary);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);
      overflow: hidden;
      box-shadow: var(--shadow-sm);
    }

    .order-admin-header {
      padding: var(--spacing-md) var(--spacing-lg);
      background-color: var(--bg-tertiary);
      border-bottom: 1px solid var(--border-color);
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: var(--spacing-sm);
    }

    .order-admin-title h4 {
      margin: 0;
      font-size: 1.05rem;
      color: var(--text-primary);
    }

    .order-admin-meta {
      font-size: 0.8rem;
      color: var(--text-secondary);
      margin-top: 2px;
    }

    .order-admin-status-area {
      display: flex;
      align-items: center;
      gap: var(--spacing-md);
    }

    .select-status {
      min-height: 34px;
      padding: 0 10px;
      font-size: 0.82rem;
      font-weight: 600;
      border-radius: var(--radius-md);
      border: 1px solid var(--border-color);
      background-color: var(--bg-primary);
      color: var(--text-primary);
      cursor: pointer;
      outline: none;
      transition: all 0.2s ease;
    }

    .payment-method-badge {
      font-size: 0.75rem;
      font-weight: 700;
      padding: 3px 10px;
      border-radius: 12px;
      text-transform: uppercase;
      letter-spacing: 0.03em;
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }

    .payment-method-badge.satispay {
      background-color: #ffe6e8;
      color: #e50014;
      border: 1px solid #ffccd0;
    }

    .payment-method-badge.paypal {
      background-color: #fff8e6;
      color: #b7791f;
      border: 1px solid #fbd38d;
    }

    .info-value-with-action {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
    }

    .btn-whatsapp-direct {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      background-color: #25D366;
      color: #ffffff;
      padding: 3px 8px;
      border-radius: 6px;
      font-size: 0.78rem;
      font-weight: 700;
      text-decoration: none;
      transition: all 0.2s ease;
      box-shadow: 0 2px 4px rgba(37, 211, 102, 0.25);
    }

    .btn-whatsapp-direct:hover {
      background-color: #1eb956;
      color: #ffffff;
      transform: translateY(-1px);
    }

    .btn-delete-order {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      background-color: transparent;
      color: #d32f2f;
      border: 1px solid #ffcdd2;
      padding: 0 10px;
      min-height: 34px;
      border-radius: var(--radius-md);
      font-size: 0.8rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .btn-delete-order:hover {
      background-color: #ffebee;
      border-color: #e57373;
    }

    .order-admin-body {
      padding: var(--spacing-md) var(--spacing-lg);
      display: grid;
      grid-template-columns: 1.2fr 1fr;
      gap: var(--spacing-lg);
    }

    .order-info-section h5 {
      margin: 0 0 var(--spacing-sm) 0;
      font-size: 0.9rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--accent-gold);
    }

    .order-info-grid {
      display: grid;
      grid-template-columns: 80px 1fr;
      gap: var(--spacing-xs) var(--spacing-sm);
      font-size: 0.88rem;
    }

    .info-label {
      color: var(--text-secondary);
      font-weight: 500;
    }

    .info-value {
      color: var(--text-primary);
    }

    /* Tabella Articoli */
    .table-container {
      background-color: var(--bg-secondary);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);
      overflow-x: auto;
      box-shadow: var(--shadow-sm);
    }

    .admin-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
      font-size: 0.9rem;
    }

    .admin-table th, .admin-table td {
      padding: var(--spacing-md) var(--spacing-lg);
      border-bottom: 1px solid var(--border-color);
    }

    .admin-table th {
      background-color: var(--bg-tertiary);
      font-weight: 600;
      color: var(--text-secondary);
      text-transform: uppercase;
      font-size: 0.78rem;
      letter-spacing: 0.05em;
    }

    .admin-table tr:last-child td {
      border-bottom: none;
    }

    .admin-table tr:hover td {
      background-color: var(--bg-tertiary);
    }

    .price-td {
      font-weight: 600;
      color: var(--text-primary);
    }

    /* Form e inputs */
    .new-article-form {
      background-color: var(--bg-secondary);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);
      padding: var(--spacing-xl);
      box-shadow: var(--shadow-sm);
      display: flex;
      flex-direction: column;
      gap: var(--spacing-lg);
    }

    .form-grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--spacing-lg);
    }

    .form-grid-3 {
      display: grid;
      grid-template-columns: 2fr 1fr 1fr;
      gap: var(--spacing-lg);
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .form-label {
      font-size: 0.88rem;
      font-weight: 600;
      color: var(--text-primary);
    }

    .form-control {
      min-height: 44px;
      padding: 0.6rem 0.9rem;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      background-color: var(--bg-primary);
      color: var(--text-primary);
      font-size: 0.95rem;
      transition: border-color 0.2s ease, box-shadow 0.2s ease;
      width: 100%;
    }

    .form-control:focus {
      outline: none;
      border-color: var(--accent-gold);
      box-shadow: 0 0 0 3px var(--accent-soft-gold);
    }

    textarea.form-control {
      min-height: auto;
      resize: vertical;
    }

    /* Taglie checkboxes */
    .sizes-checkbox-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(70px, 1fr));
      gap: var(--spacing-xs);
      background-color: var(--bg-tertiary);
      padding: var(--spacing-md);
      border-radius: var(--radius-md);
      border: 1px solid var(--border-color);
    }

    .size-checkbox-label {
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      position: relative;
    }

    .size-checkbox-input {
      position: absolute;
      opacity: 0;
      width: 0;
      height: 0;
    }

    .size-checkbox-box {
      width: 100%;
      height: 38px;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-sm);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.82rem;
      font-weight: 600;
      background-color: var(--bg-secondary);
      color: var(--text-secondary);
      transition: all 0.2s ease;
      user-select: none;
    }

    .size-checkbox-input:checked + .size-checkbox-box {
      background-color: var(--accent-soft-gold);
      border-color: var(--accent-gold);
      color: var(--accent-gold-hover);
      font-weight: 700;
    }

    /* Active/Inactive tags */
    .active-tag, .inactive-tag {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 0.85rem;
      font-weight: 600;
    }

    .active-tag {
      color: var(--success);
    }

    .inactive-tag {
      color: var(--text-muted);
    }

    .toggle-active-btn {
      background: none;
      border: none;
      cursor: pointer;
      padding: 4px;
      display: flex;
      align-items: center;
      color: var(--text-secondary);
      transition: color 0.2s ease;
    }

    .toggle-active-btn:hover {
      color: var(--accent-gold);
    }

    .icon-active {
      color: var(--success);
    }

    .icon-inactive {
      color: var(--text-muted);
    }

    /* Action buttons (edit/delete) */
    .edit-art-btn, .delete-art-btn {
      background: none;
      border: none;
      cursor: pointer;
      padding: 4px;
      display: flex;
      align-items: center;
      color: var(--text-secondary);
      transition: color 0.2s ease;
    }

    .edit-art-btn:hover {
      color: var(--accent-gold);
    }

    .delete-art-btn:hover {
      color: var(--error);
    }

    /* Upload Foto */
    .upload-btn-wrapper {
      position: relative;
      overflow: hidden;
      display: inline-block;
      width: 100%;
    }

    .upload-btn-trigger {
      width: 100%;
      min-height: 50px;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 2px dashed var(--border-color);
      background-color: var(--bg-tertiary);
      border-radius: var(--radius-md);
      cursor: pointer;
      transition: all 0.2s ease;
      font-weight: 600;
    }

    .upload-btn-trigger:hover {
      border-color: var(--accent-gold);
      background-color: var(--accent-soft-gold);
    }

    .file-input-hidden {
      position: absolute;
      font-size: 100px;
      left: 0;
      top: 0;
      opacity: 0;
      cursor: pointer;
      height: 100%;
      width: 100%;
    }

    /* Loader globale */
    .global-loader-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: var(--spacing-xxl) 0;
      gap: var(--spacing-sm);
      color: var(--text-secondary);
    }

    .spin-icon {
      animation: spin 1s linear infinite;
      color: var(--accent-gold);
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(4px); }
      to { opacity: 1; transform: translateY(0); }
    }

    /* Responsive */
    @media (max-width: 992px) {
      .admin-dashboard-layout {
        flex-direction: column;
      }

      .admin-sidebar {
        width: 100%;
        height: auto;
        border-right: none;
        border-bottom: 1px solid var(--border-color);
        position: relative;
        padding: var(--spacing-md);
      }

      .admin-nav {
        flex-direction: row;
        overflow-x: auto;
        padding-bottom: 8px;
      }

      .nav-item {
        white-space: nowrap;
      }

      .admin-sidebar-footer {
        flex-direction: row;
        justify-content: space-between;
        align-items: center;
        border-top: none;
        padding-top: 8px;
        margin-top: 8px;
        border-top: 1px solid var(--border-color);
      }

      .admin-main-content {
        height: auto;
        padding: var(--spacing-md);
      }
    }

    @media (max-width: 768px) {
      .order-admin-body {
        grid-template-columns: 1fr;
      }

      .form-grid-2,
      .form-grid-3 {
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
    </div>
  );
}
