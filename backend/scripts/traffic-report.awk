# Nginx access-log trafik analizi. Parametreler -v ile gelir:
#   MON  = ay kisaltmasi (Jan..Dec, log formatindaki)
#   YEAR = yil (2026)
#   FROM = baslangic gunu (1-31)
#   TO   = bitis gunu (1-31)
# Combined log format: IP - - [DD/Mon/YYYY:HH:MM:SS +TZ] "req" code bytes "ref" "ua"
BEGIN {
  FS = "\"";
  DATE_RE = "\\[[0-9][0-9]/" MON "/" YEAR ":[0-9][0-9]";
  BOT_RE = "[Bb]ot|[Cc]rawl|[Ss]pider|[Ss]lurp|bingpreview|facebookexternalhit|[Pp]etal|[Yy]andex|[Aa]pplebot|[Aa]hrefs|GPTBot|ClaudeBot|OAI-SearchBot|[Pp]ython-requests|curl|[Ww]get|[Hh]eadless|[Ss]emrush|DataForSeo|MJ12|DotBot|[Bb]ytespider|Go-http|[Ss]craper|meta-external";
  MOB_RE = "Mobile|Android|iPhone|iPad|Opera Mini|IEMobile";
}
{
  meta = $1; req = $2; ref = $4; ua = $6;
  st = $3; gsub(/^[ ]+/, "", st); split(st, sa, " "); code = sa[1];
  split(meta, ma, " "); ip = ma[1];
  if (!match(meta, DATE_RE)) next;
  ds = substr(meta, RSTART + 1, RLENGTH - 1);   # DD/Mon/YYYY:HH
  day = substr(ds, 1, 2) + 0;
  hour = substr(ds, length(ds) - 1, 2);
  if (day < FROM || day > TO) next;

  total[day]++; gtotal++;
  isbot = (ua ~ BOT_RE);
  if (isbot) { bot[day]++; gbot++ }
  else {
    human[day]++; ghuman++;
    if (ua ~ MOB_RE) { mob[day]++; gmob++ }
    ipd[day SUBSEP ip] = 1;
    hh[hour]++;
  }
  scode[code]++;

  if (ua ~ /[Pp]etal/) bn["petalbot"]++;
  else if (ua ~ /[Yy]andex/) bn["yandex"]++;
  else if (ua ~ /Googlebot/) bn["googlebot"]++;
  else if (ua ~ /Applebot/) bn["applebot"]++;
  else if (ua ~ /AhrefsBot/) bn["ahrefsbot"]++;
  else if (ua ~ /bingbot/) bn["bingbot"]++;
  if (ua ~ /GPTBot/) ai["gptbot"]++;
  if (ua ~ /OAI-SearchBot/) ai["oai-searchbot"]++;
  if (ua ~ /ClaudeBot/) ai["claudebot"]++;

  if (req ~ /gclid=/) {
    gclid_total++; gclid_ip[ip] = 1;
    p = req; sub(/^[A-Z]+ /, "", p); sub(/ HTTP.*/, "", p); sub(/\?.*/, "", p);
    gland[p]++;
  }
  if (req ~ /\/api\/v1\/track\/pageview/) { pv[day]++; gpv++ }

  if (ref != "-" && ref != "" && ref !~ /haldefiyat\.com/) {
    rh = ref; sub(/^https?:\/\//, "", rh); sub(/\/.*/, "", rh);
    rhc[rh]++;
  }
}
END {
  print "## DAILY";
  for (d = FROM; d <= TO; d++) if (total[d] > 0) {
    uc = 0; for (k in ipd) { split(k, kk, SUBSEP); if (kk[1] == d) uc++; }
    mp = human[d] > 0 ? sprintf("%.0f", mob[d] * 100 / human[d]) : 0;
    printf "%d|human=%d|bot=%d|total=%d|uniqIP=%d|mob%%=%s|pv=%d\n", d, human[d], bot[d], total[d], uc, mp, pv[d];
  }
  printf "TOTAL|human=%d|bot=%d|total=%d|mob=%d|pv=%d\n", ghuman, gbot, gtotal, gmob, gpv;
  print "## STATUS";  for (c in scode) printf "%s=%d\n", c, scode[c];
  print "## BOTNAMES"; for (b in bn) printf "%s=%d\n", b, bn[b];
  print "## AI";       for (a in ai) printf "%s=%d\n", a, ai[a];
  gi = 0; for (x in gclid_ip) gi++;
  print "## GCLID";    printf "gclid_total=%d|uniqIP=%d\n", gclid_total, gi;
  print "## GCLID_LAND"; for (p in gland) printf "%s=%d\n", p, gland[p];
  print "## REFERRER";  for (r in rhc) printf "%s=%d\n", r, rhc[r];
  print "## HOURLY";    for (h = 0; h < 24; h++) if (hh[sprintf("%02d", h)] > 0) printf "%02d=%d\n", h, hh[sprintf("%02d", h)];
}
