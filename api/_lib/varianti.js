// Fallback per quando la colonna 'varianti' non esiste su Supabase:
// le varianti vengono codificate in base64 e inserite nella descrizione come [VARIANTI_B64:...]
// (stesso comportamento delle Cloudflare Functions in produzione).

export function isVariantiColumnError(error) {
  return !!error && (error.code === 'PGRST204' || (error.message && error.message.includes('varianti')));
}

export function descrizioneConVarianti(descrizione, variantiData) {
  const descPulita = (descrizione || '')
    .replace(/\[VARIANTI_B64:[A-Za-z0-9+/=]+\]/g, '')
    .replace(/\[VARIANTI:[\s\S]+?\](?=\s*$|\s+[A-Za-z0-9])/g, '')
    .trim();

  let b64 = '';
  if (variantiData) {
    try {
      b64 = Buffer.from(variantiData, 'utf-8').toString('base64');
    } catch (e) {
      console.error('Errore codifica b64 varianti:', e);
    }
  }

  return b64 ? `[VARIANTI_B64:${b64}] ${descPulita}`.trim() : descPulita;
}
