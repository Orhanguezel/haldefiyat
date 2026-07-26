# English Expansion Feasibility — “Turkey Vegetable Prices”

Date: 27 July 2026
Decision: **Conditional GO for a narrow pilot; NO-GO for full-site translation**

## Evidence

### Existing organic demand

Google Search Console was queried for 26 April–24 July 2026:

- 5,107 query rows inspected.
- A broad English-token filter returned 39 rows, but most were Turkish queries
  containing “market” or false positives.
- Genuine English examples were isolated, low-volume rows such as
  `cherries per lb price`, `cherry fruit 1kg price`,
  `dried apricots price per kg`, `flax price trend in turkey` and
  `price.garlic`.
- These genuine English rows produced only single-digit impressions and zero
  clicks in the retained query set.

There is no evidence for launching hundreds of translated URLs today.

### Search landscape

- TURKSTAT publishes English agricultural price/index explanations, but they
  are official-statistics releases rather than a daily city/product wholesale
  comparison:
  `https://veriportali.tuik.gov.tr/en/press/57970`
- Tridge provides English Turkey/Türkiye product market and supplier price
  views, with commercial positioning:
  `https://www.tridge.com/market-overview/fresh-cocktail-tomato/TR`
- Selina Wamucii ranks product-specific “price in Turkey” pages:
  `https://www.selinawamucii.com/insights/prices/turkey/tomatoes/`
- EU Agri-food Data exposes fruit/vegetable price APIs, but not HalDeFiyat's
  municipal Turkish wholesale-market coverage:
  `https://agridata.ec.europa.eu/extensions/API_Documentation/fruitandvegetables.html`

Opportunity exists in current, dated, source-attributed Turkish municipal
wholesale prices. It is a narrow B2B/research/export-data niche, not yet a
proven mass English search opportunity.

### Query ambiguity

“Turkey prices” often means prices for turkey meat, especially in US/UK
results. Target copy must consistently use:

- `Türkiye wholesale vegetable prices`
- `Turkish fresh produce wholesale prices`
- `Istanbul wholesale market tomato prices`
- `Türkiye fruit and vegetable market data`

Bare `turkey prices` is excluded.

## Technical readiness and cost

- `appLocales = ["tr"]`; only `frontend/messages/tr.json` exists.
- Proxy code recognizes `en` in one defensive set, but routing does not expose
  English as an application locale.
- Public pages contain substantial hard-coded Turkish copy and Turkish locale
  sorting/casing.
- CMS editorial content is Turkish; falling back to it under `/en` would create
  mixed-language/thin pages.
- Current locale utilities, canonical and hreflang code can support a second
  locale only after routing/messages/content are complete.

Enabling `en` globally now would expose partially translated duplicates and is
therefore rejected.

## Proposed eight-week pilot

### Indexable pilot surface

Only these pages:

1. `/en/turkiye-wholesale-produce-prices`
2. `/en/methodology`
3. `/en/api-docs`
4. Ten manually reviewed product pages:
   tomato, potato, onion, lemon, cherry, apricot, watermelon, peach, plum and
   green beans.
5. Three market pages: Istanbul, Ankara and Izmir.

All other `/en` routes remain unavailable or `noindex`; Turkish content must
not silently render under an English canonical.

### Content contract

- Use `Türkiye` in prose; retain “Turkey” once where search clarification is
  useful.
- Explain wholesale vs retail and TRY/kg units.
- Show exact source and latest data date.
- Translate product display names manually; do not machine-translate raw ETL
  variants.
- Include methodology, missing-data and stale-data warnings.
- English URL self-canonical; reciprocal `tr-TR`, `en` and `x-default`
  hreflang only after both pages return 200/indexable.
- English JSON-LD text must match visible English copy; price numbers and dates
  may share the same database source.

## Go/no-go gates

### Before indexing

- 100% human language review for the 17 pilot pages.
- 0 mixed-language navigation/H1/meta/schema fields.
- 17/17 self-canonical, reciprocal hreflang and sitemap checks.
- 17/17 HTTP 200, index/follow and schema validator error 0.
- English support/contact and data caveat visible.

### After eight weeks

Continue and expand only if at least two are met:

- ≥500 English GSC impressions in the last 28 days.
- ≥20 English organic clicks and ≥2% CTR.
- ≥3 independent English referring domains/citations.
- ≥5 qualified API/data leads or ≥25 engaged API-doc sessions.
- At least 30% of the 20-query English AI benchmark cites HalDeFiyat.

Stop expansion, retain only methodology/API landing, or noindex product pages
if impressions remain <100/28 days with no qualified lead/citation.

## Measurement set

Use 20 fixed queries across:

- `Türkiye wholesale vegetable prices`
- `Turkey fresh produce wholesale market data`
- `[product] wholesale price in Türkiye`
- `[city] wholesale fruit and vegetable market prices`
- `Türkiye produce price API`

Record GSC country/device/page/query, GA4 engaged sessions/API conversions,
AI citation and earned English referring domains. English and Turkish series
must never be combined in one CTR/citation rate.

## Effort and risk

| Work | Estimate |
|---|---:|
| Routing/messages/navigation foundations | 3–5 days |
| 17 manually reviewed pages and metadata/schema | 5–8 days |
| English product dictionary and unit/source glossary | 2–3 days |
| hreflang/sitemap/schema/crawl tests | 2–3 days |
| Measurement and 20-query benchmark | 1–2 days |

Main risks: mixed-language pages, translation drift, `Turkey` poultry
ambiguity, thin translated variants, unsupported freshness claims and
splitting crawl equity before demand is proven.

## Final recommendation

Do not enable `en` globally. Run the 17-page pilot only after an owner approves
the English terminology and editorial review capacity. The current evidence
supports testing an English data/API niche, not a full international rollout.
