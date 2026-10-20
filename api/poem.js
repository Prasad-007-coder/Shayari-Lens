export const config = { maxDuration: 60, api: { bodyParser: { sizeLimit: '3mb' } } };

const LANGS = {
  hi: { k: ['hindi_title', 'hindi'], p: 'Hindi (Devanagari) mein ek kavita' },
  mr: { k: ['marathi_title', 'marathi'], p: 'Marathi (Devanagari) mein ek alag, mool kavita jo wahi manzar dikhaye lekin translation jaisi na lage, Marathi ki apni lay ke saath' },
  ur: { k: ['urdu_title', 'urdu'], p: 'Urdu andaaz ki ghazal/nazm jaisi kavita, nafees Urdu alfaaz (ishq, nazar, khwaab, mehfil, dilkash) ke saath, lekin poori Devanagari lipi mein (Urdu script nahi)' }
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  const key = process.env.GEMINI_API_KEY;
  if (!key) return res.status(500).json({ error: 'GEMINI_API_KEY set nahi hai' });
  const model = process.env.GEMINI_MODEL || 'gemini-flash-latest';

  const { image, tone, len, about, langs } = req.body || {};
  if (!image || typeof image !== 'string' || image.length > 2_800_000)
    return res.status(400).json({ error: 'Photo chhoti karke bhejo' });

  let sel = (Array.isArray(langs) ? langs : []).filter(k => LANGS[k]);
  sel = [...new Set(sel)];
  if (!sel.length) sel = ['hi', 'mr'];

  const t = String(tone || '').slice(0, 120);
  const l = String(len || '').slice(0, 160);
  const a = String(about || '').slice(0, 300);

  const shape = '{' + sel.map(k => `"${LANGS[k].k[0]}":"...","${LANGS[k].k[1]}":"..."`).join(',') + ',"caption":"photo ka ek chhota line description Hinglish mein"}';

  const prompt =
    'Is
