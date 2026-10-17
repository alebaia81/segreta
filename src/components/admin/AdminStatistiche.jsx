import { useState, useEffect, useCallback } from 'react';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  Eye,
  ShoppingBag,
  Sparkles,
  Copy,
  Check,
  RefreshCw,
  AlertCircle,
  ExternalLink,
  Award,
  Compass,
  ShieldCheck
} from 'lucide-react';

export default function AdminStatistiche({ adminPassword }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statsData, setStatsData] = useState(null);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  const fetchStats = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const pass = adminPassword || sessionStorage.getItem('segreta_admin_password') || 'Segreta2026';
      const res = await fetch('/api/admin/statistiche', {
        headers: {
          'x-admin-password': pass,
          'Cache-Control': 'no-cache'
        }
      });

      if (res.status === 401) {
        throw new Error('Accesso non autorizzato. Ricarica la pagina e reinserisci la password.');
      }

      const json = await res.json();
      if (!json.success && json.error) {
        throw new Error(json.error);
      }

      setStatsData(json);
    } catch (err) {
      console.error('Errore caricamento statistiche:', err);
      setError(err.message || 'Impossibile caricare le statistiche');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [adminPassword]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handleCopySQL = (sqlText) => {
    if (!sqlText) return;
    navigator.clipboard.writeText(sqlText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  if (loading) {
    return (
      <div className="stats-loading-box">
        <RefreshCw className="spin-icon" size={32} />
        <p>Caricamento statistiche in corso...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="stats-error-box">
        <AlertCircle size={28} className="error-icon" />
        <div className="error-content">
          <h4>Si è verificato un errore</h4>
          <p>{error}</p>
          <button className="btn-retry" onClick={() => fetchStats(true)}>
            <RefreshCw size={14} /> Riprova
          </button>
        </div>
      </div>
    );
  }

  const isTableConfigured = statsData?.tableConfigured !== false;
  const sqlScript = statsData?.sqlScript;
  const data = statsData?.data || {};
  const pan = data.panoramica || {};
  const trend = data.trend7Giorni || [];
  const topCapi = data.topCapi || [];
  const topPagine = data.topPagine || [];
  const ordiniStats = data.ordiniStats || {};

  // Massimo di visite nel trend per scalare l'altezza delle barre
  const maxTrendVisite = Math.max(...trend.map(t => t.visiteUniche || 0), 1);
  const maxCapoViews = topCapi.length > 0 ? Math.max(...topCapi.map(c => c.views || 0), 1) : 1;

  return (
    <div className="admin-statistiche-container">
      {/* Intestazione Sezione */}
      <div className="stats-header">
        <div>
          <div className="stats-title-row">
            <h2 className="stats-title">Statistiche Negozio</h2>
            <span className="badge-gdpr">
              <ShieldCheck size={14} /> 100% GDPR • Zero Cookie
            </span>
          </div>
          <p className="stats-subtitle">
            Visualizza in tempo reale le visite reali delle tue clienti, l'interesse per i tuoi vestiti e le vendite.
          </p>
        </div>

        <button
          className="btn-refresh-stats"
          onClick={() => fetchStats(true)}
          disabled={refreshing}
          title="Aggiorna i numeri in tempo reale"
        >
          <RefreshCw size={16} className={refreshing ? 'spin-icon' : ''} />
          <span>{refreshing ? 'Aggiornamento...' : 'Aggiorna Dati'}</span>
        </button>
      </div>

      {/* Banner se la tabella Supabase non è ancora stata creata */}
      {!isTableConfigured && (
        <div className="stats-setup-banner">
          <div className="setup-banner-header">
            <Sparkles className="sparkle-icon" size={24} />
            <div>
              <h3>Attiva il Contatore Visite su Supabase (Richiede 1 Minuto)</h3>
              <p>
                Per iniziare a salvare le visite delle clienti sul tuo database Supabase, copia ed esegui questo comando nel modulo <strong>SQL Editor</strong> di Supabase.
              </p>
            </div>
          </div>

          <div className="sql-box-wrapper">
            <pre className="sql-code-block">{sqlScript}</pre>
            <button className="btn-copy-sql" onClick={() => handleCopySQL(sqlScript)}>
              {copied ? <Check size={16} color="#2E7D32" /> : <Copy size={16} />}
              <span>{copied ? 'Copiato negli Appunti!' : 'Copia Comando SQL'}</span>
            </button>
          </div>

          <div className="setup-instructions">
            <ol>
              <li>Vai sulla dashboard di <a href="https://supabase.com/dashboard" target="_blank" rel="noreferrer">Supabase.com <ExternalLink size={12} /></a></li>
              <li>Nel menu a sinistra, clicca sull'icona <strong>SQL Editor</strong></li>
              <li>Clicca su <strong>New query</strong>, incolla il codice sopra e premi il tasto verde <strong>Run</strong></li>
              <li>Torna qui e clicca sul tasto <strong>"Ho eseguito il comando, Aggiorna"</strong></li>
            </ol>
            <button className="btn-verify-setup" onClick={() => fetchStats(true)}>
              <RefreshCw size={15} /> Ho eseguito il comando, Aggiorna
            </button>
          </div>
        </div>
      )}

      {/* KPI Cards Principali */}
      <div className="stats-kpi-grid">
        {/* Card 1: Visite Oggi */}
        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-label">Visite di Oggi</span>
            <div className="kpi-icon-wrap gold">
              <Eye size={20} />
            </div>
          </div>
          <div className="kpi-value">{pan.visiteOggi ?? 0}</div>
          <div className="kpi-footer">
            {pan.diffIeriPercentuale !== null && pan.diffIeriPercentuale !== undefined ? (
              <span className={`kpi-diff ${pan.diffIeriPercentuale >= 0 ? 'positive' : 'negative'}`}>
                {pan.diffIeriPercentuale >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                {pan.diffIeriPercentuale >= 0 ? `+${pan.diffIeriPercentuale}%` : `${pan.diffIeriPercentuale}%`} vs ieri
              </span>
            ) : (
              <span className="kpi-subtext">Visite uniche</span>
            )}
            <span className="kpi-pagine">({pan.pagineVisteOggi ?? 0} visualizzazioni)</span>
          </div>
        </div>

        {/* Card 2: Ultimi 7 Giorni */}
        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-label">Ultimi 7 Giorni</span>
            <div className="kpi-icon-wrap gold">
              <Users size={20} />
            </div>
          </div>
          <div className="kpi-value">{pan.visite7Giorni ?? 0}</div>
          <div className="kpi-footer">
            <span className="kpi-subtext">Visitatori unici questa settimana</span>
          </div>
        </div>

        {/* Card 3: Visite Totali Storiche */}
        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-label">Visite Totali</span>
            <div className="kpi-icon-wrap gold">
              <BarChart3 size={20} />
            </div>
          </div>
          <div className="kpi-value">{(pan.visiteTotaliStoriche ?? 0).toLocaleString('it-IT')}</div>
          <div className="kpi-footer">
            <span className="kpi-subtext">Dall'avvio del contatore</span>
          </div>
        </div>

        {/* Card 4: Ordini del Mese */}
        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-label">Vendite Mese in Corso</span>
            <div className="kpi-icon-wrap green">
              <ShoppingBag size={20} />
            </div>
          </div>
          <div className="kpi-value">
            € {(ordiniStats.incassoMese ?? 0).toFixed(2).replace('.', ',')}
          </div>
          <div className="kpi-footer">
            <span className="kpi-subtext">
              {ordiniStats.ordiniMese ?? 0} ordini confermati • Media: € {(ordiniStats.scontrinoMedio ?? 0).toFixed(2).replace('.', ',')}
            </span>
          </div>
        </div>
      </div>

      {/* Grafico Andamento 7 Giorni */}
      <div className="stats-section-box">
        <div className="section-box-header">
          <div>
            <h3 className="section-title">Andamento Visite degli Ultimi 7 Giorni</h3>
            <p className="section-desc">Numero di clienti uniche entrate sul sito giorno per giorno</p>
          </div>
        </div>

        <div className="trend-chart-wrapper">
          {trend.length === 0 || trend.every(t => (t.visiteUniche || 0) === 0) ? (
            <div className="chart-empty-state">
              <BarChart3 size={36} color="var(--accent-gold)" />
              <p>Nessuna visita registrata negli ultimi 7 giorni.</p>
              <span>Non appena le clienti navigheranno il sito, vedrai qui il grafico giornaliero!</span>
            </div>
          ) : (
            <div className="bars-container">
              {trend.map((day, idx) => {
                const heightPercent = maxTrendVisite > 0 ? Math.max((day.visiteUniche / maxTrendVisite) * 100, 6) : 6;
                const isToday = idx === trend.length - 1;

                return (
                  <div key={day.date} className={`bar-col ${isToday ? 'today-col' : ''}`}>
                    <div className="bar-tooltip">
                      <strong>{day.label} ({day.dayName})</strong>
                      <div>{day.visiteUniche} visite uniche</div>
                      <div className="tooltip-sub">{day.pagineViste} pagine viste</div>
                    </div>
                    <div className="bar-track">
                      <div
                        className={`bar-fill ${isToday ? 'bar-today' : ''}`}
                        style={{ height: `${heightPercent}%` }}
                      >
                        <span className="bar-val-badge">{day.visiteUniche}</span>
                      </div>
                    </div>
                    <div className="bar-legend">
                      <span className="bar-day-name">{day.dayName}</span>
                      <span className="bar-date-label">{day.label.split(' ')[0]}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Sezione Capi Più Visti + Pagine Più Cliccate */}
      <div className="stats-two-cols">
        {/* Colonna Sinistra: Top Capi */}
        <div className="stats-section-box flex-1">
          <div className="section-box-header">
            <div>
              <div className="title-with-badge">
                <h3 className="section-title">I 5 Capi Più Amati</h3>
                <span className="badge-pill">I più cliccati</span>
              </div>
              <p className="section-desc">I capi del catalogo che hanno attirato più visualizzazioni</p>
            </div>
          </div>

          <div className="top-capi-list">
            {topCapi.length === 0 ? (
              <div className="empty-sub-state">
                <Award size={32} color="var(--accent-gold)" />
                <p>Nessun capo visualizzato di recente.</p>
                <span>Quando le clienti apriranno le schede dei vestiti, troverai qui la classifica dei capi preferiti.</span>
              </div>
            ) : (
              topCapi.map((capo, index) => {
                const percent = Math.round((capo.views / maxCapoViews) * 100);
                const firstImg = capo.immagine_url
                  ? (Array.isArray(capo.immagine_url) ? capo.immagine_url[0] : String(capo.immagine_url).split(',')[0].trim())
                  : null;

                return (
                  <div key={capo.id} className="capo-row">
                    <div className={`capo-rank rank-${index + 1}`}>
                      {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}°`}
                    </div>

                    <div className="capo-thumb">
                      {firstImg ? (
                        <img
                          src={firstImg}
                          alt={capo.titolo}
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="capo-no-thumb">👗</div>
                      )}
                    </div>

                    <div className="capo-details">
                      <div className="capo-title-row">
                        <span className="capo-title">{capo.titolo}</span>
                        <span className="capo-price">€ {Number(capo.prezzo).toFixed(2).replace('.', ',')}</span>
                      </div>
                      {capo.categoria && <span className="capo-cat">{capo.categoria}</span>}

                      <div className="capo-progress-wrapper">
                        <div className="capo-progress-bar">
                          <div className="capo-progress-fill" style={{ width: `${percent}%` }} />
                        </div>
                        <span className="capo-views-count">
                          <strong>{capo.views}</strong> {capo.views === 1 ? 'visita' : 'visite'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Colonna Destra: Pagine Più Visitate & Guida Privacy */}
        <div className="stats-section-box flex-1">
          <div className="section-box-header">
            <div>
              <div className="title-with-badge">
                <h3 className="section-title">Pagine del Sito</h3>
                <Compass size={18} color="var(--accent-gold)" />
              </div>
              <p className="section-desc">Le sezioni più navigate del tuo e-commerce</p>
            </div>
          </div>

          <div className="top-pagine-list">
            {topPagine.length === 0 ? (
              <div className="empty-sub-state">
                <Compass size={32} color="var(--accent-gold)" />
                <p>Nessun dato di navigazione al momento.</p>
              </div>
            ) : (
              topPagine.map((item, idx) => {
                let readableName = item.pagina;
                if (item.pagina === '/') readableName = '🏠 Vetrina Principale (Home)';
                else if (item.pagina === '/shop') readableName = '🛍️ Catalogo Completo (Shop)';
                else if (item.pagina.startsWith('/prodotto/')) readableName = `👗 Scheda Vestito (${item.pagina})`;
                else if (item.pagina === '/checkout') readableName = '💳 Cassa / Checkout';
                else if (item.pagina === '/thank-you') readableName = '✨ Conferma Ordine';

                return (
                  <div key={idx} className="pagina-row">
                    <span className="pagina-name">{readableName}</span>
                    <span className="pagina-badge">{item.views} click</span>
                  </div>
                );
              })
            )}
          </div>

          {/* Box Informativo Privacy & Funzionamento */}
          <div className="privacy-info-card">
            <div className="privacy-info-title">
              <ShieldCheck size={18} color="#2E7D32" />
              <span>Come viene conteggiato il traffico?</span>
            </div>
            <p className="privacy-info-text">
              Questo contatore è realizzato su misura per Segreta Style:
            </p>
            <ul className="privacy-info-list">
              <li><strong>Zero Cookie invasivi:</strong> non richiede l'approvazione del cookie banner e rispetta il 100% della privacy.</li>
              <li><strong>Esclusione Amministratore:</strong> quando Greta è collegata in questa Dashboard, le sue visite <em>non</em> vengono conteggiate per non alterare i dati reali.</li>
              <li><strong>Filtro Anti-Refresh:</strong> ricaricare la pagina più volte non gonfia le statistiche: conta le persone uniche reali.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Stili CSS dedicati alla sezione statistiche */}
      <style>{`
        .admin-statistiche-container {
          padding: 1.5rem 2rem 3rem 2rem;
          max-width: 1400px;
          margin: 0 auto;
        }

        .stats-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 1.5rem;
          margin-bottom: 2rem;
          flex-wrap: wrap;
        }

        .stats-title-row {
          display: flex;
          align-items: center;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .stats-title {
          font-family: var(--font-serif);
          font-size: 1.8rem;
          font-weight: 700;
          color: var(--text-primary);
          margin: 0;
        }

        .badge-gdpr {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          background: #E8F5E9;
          color: #2E7D32;
          font-size: 0.75rem;
          font-weight: 600;
          padding: 0.25rem 0.65rem;
          border-radius: var(--radius-full);
          border: 1px solid rgba(46, 125, 50, 0.2);
        }

        .stats-subtitle {
          color: var(--text-secondary);
          font-size: 0.95rem;
          margin-top: 0.35rem;
        }

        .btn-refresh-stats {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background: var(--bg-secondary);
          color: var(--text-primary);
          border: 1px solid var(--border-color);
          padding: 0.6rem 1.1rem;
          border-radius: var(--radius-md);
          font-size: 0.88rem;
          font-weight: 600;
          cursor: pointer;
          transition: var(--transition-fast);
          box-shadow: var(--shadow-sm);
        }

        .btn-refresh-stats:hover:not(:disabled) {
          border-color: var(--accent-gold);
          color: var(--accent-gold);
          transform: translateY(-1px);
        }

        .btn-refresh-stats:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        /* Banner Setup Supabase */
        .stats-setup-banner {
          background: linear-gradient(135deg, #FFF9F2 0%, #FFF4E5 100%);
          border: 1px solid #F5D2A4;
          border-radius: var(--radius-lg);
          padding: 1.5rem;
          margin-bottom: 2rem;
          box-shadow: var(--shadow-sm);
        }

        .setup-banner-header {
          display: flex;
          align-items: flex-start;
          gap: 1rem;
          margin-bottom: 1rem;
        }

        .sparkle-icon {
          color: #D97706;
          flex-shrink: 0;
          margin-top: 0.2rem;
        }

        .setup-banner-header h3 {
          font-size: 1.15rem;
          color: #92400E;
          margin-bottom: 0.25rem;
        }

        .setup-banner-header p {
          color: #78350F;
          font-size: 0.92rem;
        }

        .sql-box-wrapper {
          position: relative;
          background: #1E1B18;
          border-radius: var(--radius-md);
          padding: 1rem;
          margin-bottom: 1.25rem;
          overflow: hidden;
        }

        .sql-code-block {
          color: #F6F1EB;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          font-size: 0.82rem;
          line-height: 1.5;
          margin: 0;
          max-height: 160px;
          overflow-y: auto;
          white-space: pre-wrap;
          word-break: break-all;
        }

        .btn-copy-sql {
          position: absolute;
          top: 0.75rem;
          right: 0.75rem;
          background: #FAF8F5;
          color: #2C2520;
          border: none;
          padding: 0.45rem 0.85rem;
          border-radius: var(--radius-sm);
          font-size: 0.8rem;
          font-weight: 600;
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          cursor: pointer;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
          transition: var(--transition-fast);
        }

        .btn-copy-sql:hover {
          background: #FFFFFF;
          transform: translateY(-1px);
        }

        .setup-instructions ol {
          padding-left: 1.25rem;
          color: #78350F;
          font-size: 0.88rem;
          line-height: 1.6;
          margin-bottom: 1rem;
        }

        .setup-instructions a {
          color: #B45309;
          font-weight: 600;
          text-decoration: underline;
        }

        .btn-verify-setup {
          background: #B45309;
          color: #FFFFFF;
          border: none;
          padding: 0.6rem 1.2rem;
          border-radius: var(--radius-md);
          font-size: 0.88rem;
          font-weight: 600;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;
          transition: var(--transition-fast);
        }

        .btn-verify-setup:hover {
          background: #92400E;
        }

        /* KPI Grid */
        .stats-kpi-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 1.25rem;
          margin-bottom: 2rem;
        }

        .kpi-card {
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-lg);
          padding: 1.25rem 1.5rem;
          box-shadow: var(--shadow-sm);
          transition: var(--transition-smooth);
        }

        .kpi-card:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-md);
          border-color: rgba(197, 168, 128, 0.5);
        }

        .kpi-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.75rem;
        }

        .kpi-label {
          font-size: 0.85rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--text-muted);
        }

        .kpi-icon-wrap {
          width: 38px;
          height: 38px;
          border-radius: var(--radius-md);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .kpi-icon-wrap.gold {
          background: var(--accent-soft-gold);
          color: var(--accent-gold-hover);
        }

        .kpi-icon-wrap.green {
          background: #E8F5E9;
          color: #2E7D32;
        }

        .kpi-value {
          font-family: var(--font-serif);
          font-size: 2rem;
          font-weight: 700;
          color: var(--text-primary);
          line-height: 1.1;
          margin-bottom: 0.5rem;
        }

        .kpi-footer {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.82rem;
          flex-wrap: wrap;
        }

        .kpi-diff {
          display: inline-flex;
          align-items: center;
          gap: 0.2rem;
          font-weight: 700;
        }

        .kpi-diff.positive {
          color: #2E7D32;
        }

        .kpi-diff.negative {
          color: #C92A2A;
        }

        .kpi-subtext {
          color: var(--text-secondary);
        }

        .kpi-pagine {
          color: var(--text-muted);
        }

        /* Sezioni Box */
        .stats-section-box {
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-lg);
          padding: 1.5rem;
          margin-bottom: 2rem;
          box-shadow: var(--shadow-sm);
        }

        .section-box-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1.5rem;
        }

        .section-title {
          font-family: var(--font-serif);
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: 0.25rem;
        }

        .section-desc {
          color: var(--text-secondary);
          font-size: 0.88rem;
        }

        .title-with-badge {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .badge-pill {
          background: var(--accent-soft-gold);
          color: var(--accent-gold-hover);
          font-size: 0.72rem;
          font-weight: 700;
          text-transform: uppercase;
          padding: 0.2rem 0.5rem;
          border-radius: var(--radius-full);
        }

        /* Grafico Trend 7 Giorni */
        .trend-chart-wrapper {
          min-height: 220px;
          display: flex;
          align-items: flex-end;
          padding: 1.5rem 0.5rem 0.5rem 0.5rem;
        }

        .chart-empty-state {
          width: 100%;
          text-align: center;
          padding: 2.5rem 1rem;
          color: var(--text-muted);
        }

        .chart-empty-state p {
          font-weight: 600;
          font-size: 1rem;
          margin: 0.5rem 0 0.2rem 0;
          color: var(--text-primary);
        }

        .chart-empty-state span {
          font-size: 0.85rem;
        }

        .bars-container {
          display: flex;
          width: 100%;
          height: 190px;
          gap: 1.5rem;
          align-items: flex-end;
          justify-content: space-between;
        }

        .bar-col {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          height: 100%;
          position: relative;
        }

        .bar-track {
          flex: 1;
          width: 100%;
          max-width: 44px;
          display: flex;
          align-items: flex-end;
          background: rgba(226, 149, 171, 0.14);
          border-radius: 6px 6px 0 0;
          position: relative;
        }

        .bar-fill {
          width: 100%;
          background: linear-gradient(180deg, #F5CAD6 0%, #E295AB 100%);
          border-radius: 6px 6px 0 0;
          transition: height 0.6s cubic-bezier(0.16, 1, 0.3, 1);
          position: relative;
          display: flex;
          justify-content: center;
        }

        .bar-fill.bar-today {
          background: linear-gradient(180deg, #E295AB 0%, #D47993 100%);
          box-shadow: 0 3px 10px rgba(226, 149, 171, 0.45);
        }

        .bar-val-badge {
          position: absolute;
          top: -22px;
          font-size: 0.75rem;
          font-weight: 700;
          color: var(--text-primary);
        }

        .bar-legend {
          margin-top: 0.65rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          line-height: 1.2;
        }

        .bar-day-name {
          font-size: 0.82rem;
          font-weight: 600;
          color: var(--text-primary);
        }

        .bar-date-label {
          font-size: 0.72rem;
          color: var(--text-muted);
        }

        .today-col .bar-day-name {
          color: #D47993;
          font-weight: 800;
        }

        /* Tooltip al passaggio */
        .bar-tooltip {
          position: absolute;
          bottom: 100%;
          background: #2C2520;
          color: #FAF8F5;
          padding: 0.4rem 0.6rem;
          border-radius: var(--radius-sm);
          font-size: 0.75rem;
          white-space: nowrap;
          pointer-events: none;
          opacity: 0;
          transform: translateY(4px);
          transition: var(--transition-fast);
          z-index: 10;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .bar-col:hover .bar-tooltip {
          opacity: 1;
          transform: translateY(-4px);
        }

        .tooltip-sub {
          color: #C5A880;
          font-size: 0.7rem;
        }

        /* Due Colonne */
        .stats-two-cols {
          display: flex;
          gap: 1.5rem;
          align-items: stretch;
        }

        .flex-1 {
          flex: 1;
        }

        /* Top Capi */
        .top-capi-list {
          display: flex;
          flex-direction: column;
          gap: 0.85rem;
        }

        .capo-row {
          display: flex;
          align-items: center;
          gap: 0.85rem;
          padding: 0.75rem;
          border-radius: var(--radius-md);
          background: var(--bg-primary);
          border: 1px solid var(--border-color);
          transition: var(--transition-fast);
        }

        .capo-row:hover {
          border-color: var(--accent-gold);
          transform: translateX(2px);
        }

        .capo-rank {
          font-size: 1.1rem;
          font-weight: 800;
          width: 28px;
          text-align: center;
        }

        .capo-thumb {
          width: 48px;
          height: 60px;
          border-radius: var(--radius-sm);
          overflow: hidden;
          background: #EDE8E2;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .capo-thumb img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .capo-details {
          flex: 1;
          min-width: 0;
        }

        .capo-title-row {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          gap: 0.5rem;
          margin-bottom: 0.2rem;
        }

        .capo-title {
          font-weight: 600;
          font-size: 0.92rem;
          color: var(--text-primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .capo-price {
          font-weight: 700;
          color: var(--accent-gold-hover);
          font-size: 0.9rem;
          flex-shrink: 0;
        }

        .capo-cat {
          display: inline-block;
          font-size: 0.72rem;
          text-transform: uppercase;
          color: var(--text-muted);
          margin-bottom: 0.4rem;
        }

        .capo-progress-wrapper {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .capo-progress-bar {
          flex: 1;
          height: 6px;
          background: rgba(226, 149, 171, 0.18);
          border-radius: var(--radius-full);
          overflow: hidden;
        }

        .capo-progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #F5CAD6 0%, #E295AB 100%);
          border-radius: var(--radius-full);
          transition: width 0.5s ease;
        }

        .capo-views-count {
          font-size: 0.78rem;
          color: var(--text-secondary);
          white-space: nowrap;
        }

        /* Top Pagine */
        .top-pagine-list {
          display: flex;
          flex-direction: column;
          gap: 0.65rem;
          margin-bottom: 1.5rem;
        }

        .pagina-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.65rem 0.85rem;
          background: var(--bg-primary);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
        }

        .pagina-name {
          font-size: 0.88rem;
          font-weight: 500;
          color: var(--text-primary);
        }

        .pagina-badge {
          background: var(--accent-soft-gold);
          color: var(--accent-gold-hover);
          font-size: 0.78rem;
          font-weight: 700;
          padding: 0.2rem 0.6rem;
          border-radius: var(--radius-full);
        }

        /* Privacy Info Card */
        .privacy-info-card {
          background: #F8FAF8;
          border: 1px solid #D1E7DD;
          border-radius: var(--radius-md);
          padding: 1rem 1.15rem;
        }

        .privacy-info-title {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          font-weight: 700;
          font-size: 0.88rem;
          color: #2E7D32;
          margin-bottom: 0.4rem;
        }

        .privacy-info-text {
          font-size: 0.82rem;
          color: #4A5568;
          margin-bottom: 0.4rem;
        }

        .privacy-info-list {
          padding-left: 1.1rem;
          font-size: 0.8rem;
          color: #4A5568;
          line-height: 1.5;
        }

        /* Empty States & Loading */
        .empty-sub-state {
          text-align: center;
          padding: 2rem 1rem;
          color: var(--text-muted);
        }

        .empty-sub-state p {
          font-weight: 600;
          font-size: 0.92rem;
          margin-top: 0.5rem;
          color: var(--text-primary);
        }

        .empty-sub-state span {
          font-size: 0.8rem;
        }

        .stats-loading-box,
        .stats-error-box {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 4rem 2rem;
          background: var(--bg-secondary);
          border-radius: var(--radius-lg);
          border: 1px solid var(--border-color);
          margin: 2rem;
          text-align: center;
          gap: 1rem;
        }

        .stats-error-box {
          border-color: #F8D7DA;
          background: #FFF5F5;
        }

        .error-icon {
          color: #C92A2A;
        }

        .error-content h4 {
          color: #C92A2A;
          margin-bottom: 0.35rem;
        }

        .btn-retry {
          background: #C92A2A;
          color: white;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: var(--radius-md);
          font-weight: 600;
          font-size: 0.85rem;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          margin-top: 0.5rem;
        }

        .spin-icon {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @media (max-width: 992px) {
          .stats-two-cols {
            flex-direction: column;
          }
          .admin-statistiche-container {
            padding: 1rem;
          }
        }
      `}</style>
    </div>
  );
}
