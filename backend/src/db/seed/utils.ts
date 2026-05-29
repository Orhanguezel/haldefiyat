// SQL'i karakter karakter tarar; string literal (' " `) ve escape ('' veya \)
// durumunu izler. Yorum/ayrac islemleri YALNIZCA string disinda yapilir.
// Boylece report seed'lerindeki gomulu HTML/CSS (var(--x), <!--, ;) bozulmaz.
type SqlScanHandlers = {
  onChar: (ch: string) => void;
  onLineComment?: () => void; // string disinda '--' gorulunce (satir sonuna kadar atlanir)
  onBlockComment?: () => void; // string disinda '/* ... */' gorulunce
  onSemicolon?: () => void; // string disinda ';' gorulunce
};

function scanSql(sql: string, h: SqlScanHandlers): void {
  let inSingle = false;
  let inDouble = false;
  let inBacktick = false;
  for (let i = 0; i < sql.length; i++) {
    const ch = sql[i]!;
    const next = sql[i + 1];

    if (inSingle || inDouble) {
      const quote = inSingle ? "'" : '"';
      if (ch === "\\" && next !== undefined) {
        h.onChar(ch);
        h.onChar(next);
        i++;
        continue;
      }
      if (ch === quote && next === quote) {
        h.onChar(ch);
        h.onChar(next);
        i++;
        continue;
      }
      if (ch === quote) {
        inSingle = inDouble = false;
      }
      h.onChar(ch);
      continue;
    }
    if (inBacktick) {
      if (ch === "`") inBacktick = false;
      h.onChar(ch);
      continue;
    }

    if (ch === "'") { inSingle = true; h.onChar(ch); continue; }
    if (ch === '"') { inDouble = true; h.onChar(ch); continue; }
    if (ch === "`") { inBacktick = true; h.onChar(ch); continue; }

    // MySQL satir yorumu: '--' + bosluk/EOL. var(--x) gibi bosluksuz '--' yorum DEGIL.
    if (ch === "-" && next === "-" && /\s|^$/.test(sql[i + 2] ?? "\n")) {
      while (i < sql.length && sql[i] !== "\n") i++;
      h.onLineComment?.();
      continue;
    }
    if (ch === "/" && next === "*") {
      i += 2;
      while (i < sql.length && !(sql[i] === "*" && sql[i + 1] === "/")) i++;
      i++; // '*/' un '/' ini atla
      h.onBlockComment?.();
      continue;
    }
    if (ch === ";") { h.onSemicolon?.(); continue; }

    h.onChar(ch);
  }
}

export function cleanSql(input: string): string {
  let out = "";
  scanSql(input, {
    onChar: (ch) => { out += ch; },
    onLineComment: () => { out += "\n"; },
    onSemicolon: () => { out += ";"; },
  });
  return out;
}

export function splitStatements(sql: string): string[] {
  const statements: string[] = [];
  let current = "";
  scanSql(sql, {
    onChar: (ch) => { current += ch; },
    onLineComment: () => { current += "\n"; },
    onSemicolon: () => {
      const trimmed = current.trim();
      if (trimmed) statements.push(`${trimmed};`);
      current = "";
    },
  });
  const tail = current.trim();
  if (tail) statements.push(tail.endsWith(";") ? tail : `${tail};`);
  return statements;
}

export function logStep(msg: string) {
  const ts = new Date().toISOString().replace("T", " ").replace("Z", "");
  console.log(`[${ts}] ${msg}`);
}
