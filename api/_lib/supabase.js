import { createClient } from '@supabase/supabase-js';

// Client server-side con service_role key (bypass RLS)
// Usato SOLO nelle Vercel API Routes — mai esposto al browser
const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
);

export default supabase;
