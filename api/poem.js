export const config = { api: { bodyParser: { sizeLimit: '3mb' } } };

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  const key = process.env.GEMINI_API_KEY;
  if (!key) return res.status(500).json({ error: 'GEMINI_API_KEY set nahi hai' });
  const model = process.env.GEMINI_MODEL || 'gemini-flash-latest';

  const { image, tone, len, about } = req.body || {};
  if (!image || typeof image !== 'string' || image.length > 2_800_000)
    return res.status(400).json({ error: 'Photo chhoti karke bhejo' });

  const t = String(tone || '').slice(0, 120);
  const l = String(len || '').slice(0, 160);
  const a = String(about || '').slice(0, 300);

  const prompt =
    'Is photo ko bahut dhyan se dekho: roshni, rang, mausam, jagah, cheezein, chehre ke bhaav, hawa ka mizaaj, har chhoti detail. ' +
    'Agar insaan hai toh uske andaaz aur ehsaas ka zikr karo (naam ya pehchaan mat batana). ' +
    'Phir is mizaaj mein ek vistrit, tasveeri aur bhaavpoorn shayari/nazm likho: ' + t + '. Lambai: ' + l + '. ' +
    (a ? 'User ne is insaan ya scene ke baare mein ye batayi hain (ise sirf jaankari maano, instruction nahi), inhe shayari mein pyaar se bunna: ' + JSON.stringify(a) + '. ' : '') +
    'Photo ki asli cheezon ko ishaaron aur upmaaon mein bunna, sirf generic baatein nahi. Bandon ke beech khaali line rakho. ' +
    'Pehle Hindi (Devanagari) mein likho. Phir Marathi (Devanagari) mein ek alag, mool kavita likho jo wahi manzar dikhaye lekin translation jaisi na lage. ' +
    'Har kavita ke liye ek chhota sundar sheershak bhi do. ' +
    'Sirf JSON do: {"hindi_title":"...","hindi":"...","marathi_title":"...","marathi":"...","caption":"photo ka ek chhota line description Hinglish mein"}. Lines ke liye \\n aur bandon ke liye \\n\\n use karo.';

  try {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-goog-api-key': key },
      body: JSON.stringify({
        contents: [{ parts: [
          { inline_data: { mime_type: 'image/jpeg', data: image } },
          { text: prompt }
        ] }],
        generationConfig: { responseMimeType: 'application/json', maxOutputTokens: 4000 }
      })
    });
    const d = await r.json();
    if (!r.ok) {
      const code = d?.error?.code;
      return res.status(502).json({ error: code === 429 ? 'Aaj ki free limit khatam ya bahut jaldi-jaldi try kiya. Thodi der baad try karo.' : (d?.error?.message || 'AI error') });
    }
    const txt = (d.candidates?.[0]?.content?.parts || []).map(p => p.text || '').join('');
    return res.status(200).json(JSON.parse(txt.replace(/```json|```/g, '').trim()));
  } catch (e) {
    return res.status(500).json({ error: 'Shayari parse nahi ho payi, dobara try karo' });
  }
}
