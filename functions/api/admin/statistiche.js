import { createSupabaseClient } from '../../_lib/supabase.js';
import { checkAdminAuth, unauthorizedResponse } from '../../_lib/auth.js';

const SQL_CREATE_TABLE = `CREATE TABLE IF NOT EXISTS public.visite (
  id BIGSERIAL PRIMARY KEY,
  pagina TEXT NOT NULL,
  articolo_id BIGINT REFERENCES public.articoli(id) ON DELETE SET NULL,
  sessione_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_visite_created_at ON public.visite (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_visite_articolo_id ON public.visite (articolo_id);
CREATE INDEX IF NOT EXISTS idx_visite_sessione_pagina ON public.visite (sessione_id, pagina, created_at);

ALTER TABLE public.visite ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public insert to visite" ON public.visite
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow service role read visite" ON public.visite
  FOR SELECT USING (true);`;

// GET /api/admin/statistiche — Metriche aggregate traffico e vendite per Cloudflare Pages
export async function onRequestGet({ request, env }) {
  if (!await checkAdminAuth(request, env)) {
    return unauthorizedResponse();
  }

  try {
    const supabase = createSupabaseClient(env);
    const now = new Date();

    // Calcolo range date
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const startOfYesterday = new Date(startOfToday.getTime() - 24 * 60 * 60 * 1000);
    const startOf7DaysAgo = new Date(startOfToday.getTime() - 6 * 24 * 60 * 60 * 1000);
    const startOf30DaysAgo = new Date(startOfToday.getTime() - 29 * 24 * 60 * 60 * 1000);

    // 1. Lettura visite ultimi 30 giorni
    const { data: visite, error: visiteError } = await supabase
      .from('visite')
      .select('id, pagina, articolo_id, sessione_id, created_at')
      .gte('created_at', startOf30DaysAgo.toISOString())
      .order('created_at', { ascending: true });

    if (visiteError) {
      if (visiteError.code === 'PGRST205' || visiteError.message?.includes('visite')) {
        return new Response(JSON.stringify({
          success: true,
          tableConfigured: false,
          sqlScript: SQL_CREATE_TABLE
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
        });
      }
      return new Response(JSON.stringify({ success: false, error: visiteError.message }), {
        status: 500, headers: { 'Content-Type': 'application/json' }
      });
    }

    // 2. Lettura totale storico conteggio visite
    const { count: totalVisitsCount } = await supabase
      .from('visite')
      .select('*', { count: 'exact', head: true });

    // 3. Elaborazione metriche visite
    const allVisits = visite || [];

    const sessionsOggi = new Set();
    let pageViewsOggi = 0;

    const sessionsIeri = new Set();
    let pageViewsIeri = 0;

    const sessions7gg = new Set();
    const sessions30gg = new Set();

    const articoloViewCounts = {};
    const paginaViewCounts = {};

    // Inizializza array 7 giorni per il grafico
    const trend7gg = [];
    const dayNames = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'];
    const monthNames = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'];

    for (let i = 0; i < 7; i++) {
      const d = new Date(startOf7DaysAgo.getTime() + i * 24 * 60 * 60 * 1000);
      const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const label = `${d.getDate()} ${monthNames[d.getMonth()]}`;
      const dayName = dayNames[d.getDay()];
      trend7gg.push({
        key: dateKey,
        label,
        dayName,
        visiteUniche: 0,
        pagineViste: 0,
        _sessions: new Set()
      });
    }

    allVisits.forEach(v => {
      const vDate = new Date(v.created_at);
      const vTime = vDate.getTime();
      const sess = v.sessione_id;

      if (vTime >= startOfToday.getTime()) {
        sessionsOggi.add(sess);
        pageViewsOggi++;
      } else if (vTime >= startOfYesterday.getTime() && vTime < startOfToday.getTime()) {
        sessionsIeri.add(sess);
        pageViewsIeri++;
      }

      if (vTime >= startOf7DaysAgo.getTime()) {
        sessions7gg.add(sess);

        const dateKey = `${vDate.getFullYear()}-${String(vDate.getMonth() + 1).padStart(2, '0')}-${String(vDate.getDate()).padStart(2, '0')}`;
        const dayEntry = trend7gg.find(d => d.key === dateKey);
        if (dayEntry) {
          dayEntry._sessions.add(sess);
          dayEntry.pagineViste++;
        }
      }

      sessions30gg.add(sess);

      if (v.articolo_id) {
        articoloViewCounts[v.articolo_id] = (articoloViewCounts[v.articolo_id] || 0) + 1;
      }

      const pag = v.pagina || '/';
      paginaViewCounts[pag] = (paginaViewCounts[pag] || 0) + 1;
    });

    const trendFinal = trend7gg.map(({ key, label, dayName, pagineViste, _sessions }) => ({
      date: key,
      label,
      dayName,
      visiteUniche: _sessions.size,
      pagineViste
    }));

    const countOggi = sessionsOggi.size;
    const countIeri = sessionsIeri.size;
    let diffIeri = null;
    if (countIeri > 0) {
      diffIeri = Math.round(((countOggi - countIeri) / countIeri) * 100);
    }

    // 4. Recupero dettagli dei top 5 articoli più visti
    const sortedArticoloIds = Object.entries(articoloViewCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    let topCapi = [];
    if (sortedArticoloIds.length > 0) {
      const ids = sortedArticoloIds.map(([id]) => Number(id));
      const { data: articoliData } = await supabase
        .from('articoli')
        .select('id, titolo, prezzo, immagine_url, categoria, attivo')
        .in('id', ids);

      const articoliMap = (articoliData || []).reduce((acc, curr) => {
        acc[curr.id] = curr;
        return acc;
      }, {});

      topCapi = sortedArticoloIds.map(([id, views]) => {
        const art = articoliMap[Number(id)] || {};
        const rawImg = art.immagine_url || '';
        const primaryImg = Array.isArray(rawImg) ? rawImg[0] : String(rawImg).split(',')[0].trim();
        return {
          id: Number(id),
          titolo: art.titolo || `Capo #${id}`,
          prezzo: art.prezzo || 0,
          immagine_url: primaryImg,
          categoria: art.categoria || '',
          attivo: art.attivo ?? true,
          views
        };
      });
    }

    const topPagine = Object.entries(paginaViewCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([pagina, views]) => ({ pagina, views }));

    // 5. Metriche ordini / vendite
    let ordiniStats = {
      totaleOrdini: 0,
      ordiniMese: 0,
      incassoMese: 0,
      scontrinoMedio: 0
    };

    try {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0).toISOString();
      const { data: ordiniData } = await supabase
        .from('ordini')
        .select('id, totale, stato, created_at');

      if (ordiniData && ordiniData.length > 0) {
        ordiniStats.totaleOrdini = ordiniData.length;
        
        const validStatuses = ['Pagamento Ricevuto - In Lavorazione', 'In Lavorazione', 'Spedito', 'Completato'];
        const ordiniValidiMese = ordiniData.filter(o => 
          validStatuses.includes(o.stato) && 
          o.created_at && 
          o.created_at >= startOfMonth
        );

        ordiniStats.ordiniMese = ordiniValidiMese.length;
        const incasso = ordiniValidiMese.reduce((sum, o) => sum + (Number(o.totale) || 0), 0);
        ordiniStats.incassoMese = Number(incasso.toFixed(2));
        ordiniStats.scontrinoMedio = ordiniValidiMese.length > 0 ? Number((incasso / ordiniValidiMese.length).toFixed(2)) : 0;
      }
    } catch {
      // Ignora silenziosamente
    }

    return new Response(JSON.stringify({
      success: true,
      tableConfigured: true,
      data: {
        panoramica: {
          visiteOggi: sessionsOggi.size,
          pagineVisteOggi: pageViewsOggi,
          visiteIeri: sessionsIeri.size,
          pagineVisteIeri: pageViewsIeri,
          diffIeriPercentuale: diffIeri,
          visite7Giorni: sessions7gg.size,
          visite30Giorni: sessions30gg.size,
          visiteTotaliStoriche: totalVisitsCount || allVisits.length
        },
        trend7Giorni: trendFinal,
        topCapi,
        topPagine,
        ordiniStats
      }
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0'
      }
    });

  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500, headers: { 'Content-Type': 'application/json' }
    });
  }
}
