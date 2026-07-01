import supabase from './supabase.js';

// Helper per autenticazione admin (Async)
export async function checkAdminAuth(req, res) {
  const password =
    req.headers['x-admin-password'] ||
    req.headers['authorization']?.split(' ')[1];
  
  let correctPassword =
    process.env.VITE_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD || 'Segreta2026';

  // Tentativo di leggere la password personalizzata dal DB
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('admin_settings')
        .select('password')
        .eq('id', 1)
        .maybeSingle(); // Usiamo maybeSingle così non lancia eccezione se vuoto
      
      if (!error && data && data.password) {
        correctPassword = data.password;
      }
    } catch (dbErr) {
      // Fallback silenzioso se la tabella non esiste ancora
      console.log('Database auth fallback:', dbErr.message);
    }
  }

  if (password !== correctPassword) {
    res.status(401).json({ success: false, error: 'Password amministratore non corretta o mancante.' });
    return false;
  }
  return true;
}
