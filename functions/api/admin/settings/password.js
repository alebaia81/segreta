import { createSupabaseClient } from '../../../_lib/supabase.js';
import { checkAdminAuth, unauthorizedResponse } from '../../../_lib/auth.js';

// POST /api/admin/settings/password — Aggiorna la password dell'admin
export async function onRequestPost({ request, env }) {
  if (!await checkAdminAuth(request, env)) {
    return unauthorizedResponse();
  }

  try {
    const supabase = createSupabaseClient(env);
    const body = await request.json();
    const { newPassword } = body;

    if (!newPassword || newPassword.trim().length < 4) {
      return new Response(
        JSON.stringify({ success: false, error: 'La nuova password deve essere lunga almeno 4 caratteri.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { error } = await supabase
      .from('admin_settings')
      .upsert({ id: 1, password: newPassword.trim() }, { onConflict: 'id' });

    if (error) {
      if (
        error.code === 'PGRST116' ||
        error.message.includes('relation "admin_settings" does not exist') ||
        error.message.includes('non esiste')
      ) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Tabella "admin_settings" non trovata su Supabase. Esegui prima il comando SQL di configurazione.',
          }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      return new Response(JSON.stringify({ success: false, error: error.message }), {
        status: 500, headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Password aggiornata con successo nel database Supabase!' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }
}
