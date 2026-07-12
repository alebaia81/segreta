import { createSupabaseClient } from './supabase.js';

/**
 * Verifica autenticazione admin per Cloudflare Pages Functions.
 * La password arriva nell'header x-admin-password o Authorization Bearer.
 * @param {Request} request
 * @param {object} env - context.env
 * @returns {boolean} true se autenticato, false altrimenti (risponde già con 401)
 */
export async function checkAdminAuth(request, env) {
  const password =
    request.headers.get('x-admin-password') ||
    request.headers.get('authorization')?.replace('Bearer ', '');

  let correctPassword =
    env.VITE_ADMIN_PASSWORD || env.ADMIN_PASSWORD || 'Segreta2026';

  // Tenta di leggere la password personalizzata dal DB
  try {
    const supabase = createSupabaseClient(env);
    const { data, error } = await supabase
      .from('admin_settings')
      .select('password')
      .eq('id', 1)
      .maybeSingle();

    if (!error && data?.password) {
      correctPassword = data.password;
    }
  } catch {
    // Fallback silenzioso se il DB non è raggiungibile
  }

  return password === correctPassword;
}

/**
 * Risponde con 401 Unauthorized
 */
export function unauthorizedResponse() {
  return new Response(
    JSON.stringify({ success: false, error: 'Password amministratore non corretta o mancante.' }),
    { status: 401, headers: { 'Content-Type': 'application/json' } }
  );
}
