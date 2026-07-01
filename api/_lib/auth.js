// Helper per autenticazione admin
export function checkAdminAuth(req, res) {
  console.log("DEBUG ENV VARS:");
  console.log("SUPABASE_URL:", process.env.SUPABASE_URL ? "IMPOSTATA" : "MANCANTE");
  console.log("SUPABASE_SECRET_KEY:", process.env.SUPABASE_SECRET_KEY ? "IMPOSTATA" : "MANCANTE");

  const password =
    req.headers['x-admin-password'] ||
    req.headers['authorization']?.split(' ')[1];
  const correctPassword =
    process.env.VITE_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD || 'Segreta2026';

  if (password !== correctPassword) {
    res.status(401).json({ success: false, error: 'Password amministratore non corretta o mancante.' });
    return false;
  }
  return true;
}
