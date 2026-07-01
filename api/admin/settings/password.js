import supabase from '../../_lib/supabase.js';
import { checkAdminAuth } from '../../_lib/auth.js';

// POST /api/admin/settings/password — Aggiorna la password dell'admin
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  // Verifica autenticazione (usando la password corrente inviata nell'header)
  if (!await checkAdminAuth(req, res)) return;

  if (!supabase) {
    return res.status(500).json({ success: false, error: 'Supabase non inizializzato.' });
  }

  const { newPassword } = req.body;

  if (!newPassword || newPassword.trim().length < 4) {
    return res.status(400).json({ success: false, error: 'La nuova password deve essere lunga almeno 4 caratteri.' });
  }

  try {
    // Proviamo a fare un upsert nella tabella admin_settings
    // Presumiamo che la tabella contenga una riga con id = 1
    const { error } = await supabase
      .from('admin_settings')
      .upsert({ id: 1, password: newPassword.trim() }, { onConflict: 'id' });

    if (error) {
      // Se l'errore è dovuto alla tabella mancante
      if (error.code === 'PGRST116' || error.message.includes('relation "admin_settings" does not exist') || error.message.includes('non esiste')) {
        return res.status(400).json({ 
          success: false, 
          error: 'Tabella "admin_settings" non trovata su Supabase. Devi prima eseguire il comando SQL di configurazione (leggi la scheda Impostazioni per le istruzioni).' 
        });
      }
      return res.status(500).json({ success: false, error: error.message });
    }

    return res.json({ success: true, message: 'Password aggiornata con successo nel database Supabase!' });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}
