// =============================================================
// AI Content Generation — Groq/OpenAI compatible
// Admin panelden girilmis API key varsa onu kullanir,
// yoksa .env'deki GROQ_API_KEY kullanilir.
// =============================================================

import type { FastifyRequest, FastifyReply } from 'fastify';
import { env } from '../../core/env';

type ContentRequest = {
  title?: string;
  summary?: string;
  content?: string;
  tags?: string;
  locale: string;
  target_locales?: string[];
  module_key?: string;
  action: 'enhance' | 'translate' | 'generate_meta' | 'full';
};

type LocaleContent = {
  locale: string;
  title: string;
  slug: string;
  summary: string;
  content: string;
  meta_title: string;
  meta_description: string;
  tags: string;
};

async function getAIConfig(req: FastifyRequest) {
  try {
    const db = (req.server as any).db || (req.server as any).mysql;
    if (db) {
      const [rows] = await db.query(
        "SELECT `value` FROM site_settings WHERE `key` = 'api_settings' AND locale = '*' LIMIT 1"
      ).catch(() => [[]]);
      if (rows?.[0]?.value) {
        const val = typeof rows[0].value === 'string' ? JSON.parse(rows[0].value) : rows[0].value;
        if (val?.groq_api_key) {
          return {
            apiKey: val.groq_api_key,
            model: val.groq_model || env.GROQ_MODEL,
            base: val.groq_api_base || env.GROQ_API_BASE,
          };
        }
      }
    }
  } catch { /* ignore */ }

  return {
    apiKey: env.GROQ_API_KEY,
    model: env.GROQ_MODEL,
    base: env.GROQ_API_BASE,
  };
}

async function callAI(
  config: { apiKey: string; model: string; base: string },
  systemPrompt: string,
  userPrompt: string,
): Promise<string> {
  if (!config.apiKey) throw new Error('AI API key tanimli degil. .env veya admin panelden ayarlayin.');

  const res = await fetch(`${config.base}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: 4000,
      temperature: 0.7,
    }),
    signal: AbortSignal.timeout(30000),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`AI API error: ${res.status} — ${err.slice(0, 200)}`);
  }

  const data = await res.json() as any;
  return data?.choices?.[0]?.message?.content || '';
}

function extractJSON(text: string): any {
  // AI bazen JSON string icinde literal newline donduruyor — temizle
  const clean = (s: string) => s.replace(/\n\s*/g, ' ').replace(/\r/g, '');

  try { return JSON.parse(text); } catch { /* ignore */ }
  try { return JSON.parse(clean(text)); } catch { /* ignore */ }

  const match = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (match) {
    try { return JSON.parse(match[1].trim()); } catch { /* ignore */ }
    try { return JSON.parse(clean(match[1].trim())); } catch { /* ignore */ }
  }

  const jsonMatch = text.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
  if (jsonMatch) {
    try { return JSON.parse(jsonMatch[1]); } catch { /* ignore */ }
    try { return JSON.parse(clean(jsonMatch[1])); } catch { /* ignore */ }
  }

  throw new Error('AI yanitindan JSON cikarilamadi');
}

const SYSTEM_PROMPT = `Sen kurumsal web sitesi icin profesyonel icerik yazarisin.

Kurallar:
- Profesyonel, guvenilir ve sektore uygun bir ton kullan
- SEO dostu icerik uret (anahtar kelime yogunlugu dogal olsun)
- HTML formatinda icerik uret (<p>, <h2>, <h3>, <ul>, <li>, <strong> taglari kullan)
- Basliklar kisa ve etkileyici olsun
- Meta description 155 karakter sinirinda olsun
- Slug Turkce karaktersiz, kucuk harf, tire ile ayrilmis olsun
- Tags virgul ile ayrilmis olsun
- Yaniti SADECE JSON olarak don, aciklama ekleme`;

export async function aiContentAssist(req: FastifyRequest, reply: FastifyReply) {
  const body = req.body as ContentRequest;

  if (!body?.action) {
    return reply.code(400).send({ error: { message: 'action alani gerekli' } });
  }

  const locales = body.target_locales?.length ? body.target_locales : [body.locale || 'tr'];

  try {
    const config = await getAIConfig(req);
    let userPrompt = '';

    if (body.action === 'full') {
      userPrompt = `Mevcut bilgiler:
- Baslik: ${body.title || '(bos)'}
- Ozet: ${body.summary || '(bos)'}
- Icerik: ${body.content ? body.content.replace(/<[^>]*>/g, '').slice(0, 500) : '(bos)'}
- Etiketler: ${body.tags || '(bos)'}
- Modul: ${body.module_key || 'blog'}

Gorev: Bu bilgileri TEMEL ALARAK yeni, zengin ve detayli icerik URET.
- Mevcut icerigi KOPYALAMA, yeniden ve genisletilmis sekilde yaz
- En az 3-4 paragraf HTML icerik olustur
- Basliga uygun profesyonel bir yazi yaz
- Ozeti 1-2 cumle olarak olustur
- meta_title max 60 karakter, meta_description max 155 karakter olsun
- tags en az 5 anahtar kelime icersin
Hedef diller: ${locales.join(', ')}

SADECE su JSON formatinda yanit ver:
{
  "locales": [
    { "locale": "tr", "title": "...", "slug": "...", "summary": "...", "content": "<p>...</p><p>...</p><p>...</p>", "meta_title": "...", "meta_description": "...", "tags": "etiket1, etiket2, etiket3" }
  ]
}`;
    } else if (body.action === 'enhance') {
      userPrompt = `Mevcut icerik:
- Baslik: ${body.title || '(bos)'}
- Icerik: ${body.content ? body.content.replace(/<[^>]*>/g, '').slice(0, 1500) : '(bos)'}

Gorev: Bu icerigi YENIDEN YAZ ve GENISLET:
- Mevcut icerigi oldugu gibi kopyalama, daha detayli ve zengin hale getir
- En az 4-5 paragraf HTML icerik uret
- Alt basliklar (<h2>, <h3>) ekle
- Liste (<ul><li>) ve vurgulu (<strong>) ifadeler kullan
- SEO dostu, profesyonel bir dil kullan
Dil: ${body.locale || 'tr'}

SADECE su JSON formatinda yanit ver:
{
  "locales": [{ "locale": "${body.locale || 'tr'}", "title": "...", "slug": "...", "summary": "...", "content": "<h2>...</h2><p>...</p><p>...</p>", "meta_title": "...", "meta_description": "...", "tags": "..." }]
}`;
    } else if (body.action === 'translate') {
      userPrompt = `Kaynak icerik (${body.locale || 'tr'}):
- Baslik: ${body.title}
- Ozet: ${body.summary}
- Icerik: ${body.content?.slice(0, 2000)}
- Etiketler: ${body.tags}

Gorev: Bu icerigi su dillere cevir: ${locales.filter(l => l !== body.locale).join(', ')}

SADECE su JSON formatinda yanit ver:
{
  "locales": [
    { "locale": "en", "title": "...", "slug": "...", "summary": "...", "content": "<p>...</p>", "meta_title": "...", "meta_description": "...", "tags": "..." }
  ]
}`;
    } else if (body.action === 'generate_meta') {
      userPrompt = `Icerik:
- Baslik: ${body.title}
- Icerik: ${body.content?.slice(0, 1000)}

Gorev: SEO meta bilgilerini olustur.
Dil: ${body.locale || 'tr'}

SADECE su JSON formatinda yanit ver:
{
  "locales": [{ "locale": "${body.locale || 'tr'}", "title": "${body.title}", "slug": "...", "summary": "...", "content": "", "meta_title": "...", "meta_description": "...", "tags": "..." }]
}`;
    }

    const raw = await callAI(config, SYSTEM_PROMPT, userPrompt);

    let result: any;
    try {
      result = extractJSON(raw);
    } catch {
      req.log.error({ rawAI: raw.slice(0, 500) }, 'AI JSON parse failed');
      // Fallback: eger parse edilemezse bos locales don
      return reply.send({ ok: true, data: { locales: [] } });
    }

    // result { locales: [...] } veya dogrudan [...] olabilir
    const normalized = Array.isArray(result) ? { locales: result } : result;

    return reply.send({ ok: true, data: normalized });
  } catch (err: any) {
    return reply.code(500).send({ error: { message: err.message || 'AI icerik hatasi' } });
  }
}
