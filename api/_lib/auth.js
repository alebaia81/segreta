// Helper per autenticazione admin
export function checkAdminAuth(req, res) {
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
