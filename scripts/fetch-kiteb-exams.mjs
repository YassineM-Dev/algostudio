import fs from 'node:fs';
import path from 'node:path';

function stripComments(html) {
  return html.replace(/<!--[\s\S]*?-->/g, '');
}

function cleanText(s) {
  return s
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&eacute;/gi, 'é')
    .replace(/&egrave;/gi, 'è')
    .replace(/&ecirc;/gi, 'ê')
    .replace(/&agrave;/gi, 'à')
    .replace(/&ccedil;/gi, 'ç')
    .replace(/&ocirc;/gi, 'ô')
    .replace(/&ucirc;/gi, 'û')
    .replace(/&icirc;/gi, 'î')
    .replace(/&rsquo;/gi, "'")
    .replace(/&#039;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

function detectSection(text) {
  const t = text.toLowerCase();
  if (/sciences?\s*(de\s*l['’]?)?\s*info|section\s+info|bac\s+info|scinfo|sc\.?\s*info|algorithmique|\bsti\b|base\s*de\s*donn|\bbd\b/.test(t)) {
    if (/math|technique|exp[ée]rimentale/.test(t) && !/sciences?\s*(de\s*l['’]?)?\s*info|scinfo/.test(t)) {
      return 'Math / Sc. Exp / Tech';
    }
    return "Sciences de l'Informatique";
  }
  if (/math|technique|exp[ée]rimentale|scientifique/.test(t)) return 'Math / Sc. Exp / Tech';
  if (/[ée]conomie|gestion|eco/.test(t)) return 'Économie & Gestion';
  if (/lettres?/.test(t)) return 'Lettres';
  if (/sport/.test(t)) return 'Sport';
  return "Sciences de l'Informatique";
}

function detectMatiere(text, epreuve) {
  const t = text.toLowerCase();
  if (/algo|prog/.test(t)) return 'Algorithmique & Programmation';
  if (/\bsti\b|syst[èe]mes?\s+et\s+technologies/.test(t)) return 'STI';
  if (/base\s*de\s*donn|\bbd\b/.test(t)) return 'Bases de Données';
  if (/\btic\b/.test(t)) return 'TIC';
  if (/syst[èe]me\s*d['’]?exploitation/.test(t)) return 'Systèmes';
  if (epreuve === 'Pratique') return 'Pratique';
  return 'Informatique';
}

function extractColumnHeader(html, matchIndex) {
  // Check if this link sits inside a 2-row Pratique table (headers in row 1, download links in row 2)
  const tableStart = html.lastIndexOf('<table', matchIndex);
  if (tableStart < 0 || matchIndex - tableStart > 3500) return '';
  const tableEnd = html.indexOf('</table>', matchIndex);
  if (tableEnd < 0) return '';
  const tableHtml = html.slice(tableStart, tableEnd + 8);
  const rows = [...tableHtml.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)].map((m) => m[1]);
  if (rows.length < 2) return '';

  // Find which row & td column contains our link
  const relPos = matchIndex - tableStart;
  let running = 0;
  for (let r = 1; r < rows.length; r++) {
    const rowIdx = tableHtml.indexOf(rows[r], running);
    if (rowIdx < 0) continue;
    running = rowIdx + rows[r].length;
    if (relPos >= rowIdx && relPos <= rowIdx + rows[r].length) {
      const tds = [...rows[r].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)];
      const prevTds = [...rows[r - 1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)];
      if (tds.length !== prevTds.length) return '';
      let tdOffset = rowIdx;
      for (let c = 0; c < tds.length; c++) {
        const posInRow = tableHtml.indexOf(tds[c][0], tdOffset);
        if (posInRow >= 0 && relPos >= posInRow && relPos <= posInRow + tds[c][0].length) {
          const headerTxt = cleanText(prevTds[c][1]);
          if (headerTxt && headerTxt.length <= 60 && !/t[ée]l[ée]ch/i.test(headerTxt)) {
            return headerTxt;
          }
        }
        if (posInRow >= 0) tdOffset = posInRow + tds[c][0].length;
      }
    }
  }
  return '';
}

function buildTitle(blockText, colHeader, prevHeadingText, matiere, section, isCorrige, epreuve) {
  const cleaned = blockText
    .replace(/Date d['’]ajout\s*:?\s*[\d-]+/gi, '')
    .replace(/t[ée]l[ée]ch\.?\s*\d*\s*fois/gi, '')
    .replace(/Enonc[ée]s?\s+des\s+[ée]preuves?/gi, '')
    .replace(/Corrig[ée]s?\s+des\s+[ée]preuves?/gi, '')
    .replace(/\s+/g, ' ')
    .trim();

  const dateMatch =
    cleaned.match(/((?:lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche)?\s*\d{1,2}\s*(?:mai|juin|juillet)\s*(?:20\d\d)?(?:\s*:?\s*\([^)]+\))?)/i) ||
    prevHeadingText.match(/((?:lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche)?\s*\d{1,2}\s*(?:mai|juin|juillet)\s*(?:20\d\d)?)/i);
  const slot = dateMatch ? dateMatch[1].replace(/\s*:\s*$/, '').trim() : '';

  const prefix = isCorrige ? 'Corrigé' : 'Sujet';
  const parts = [`${prefix} ${matiere}`];
  if (slot) parts.push(slot);
  if (colHeader) parts.push(colHeader);
  if (parts.length === 1) {
    parts.push(epreuve === 'Pratique' ? 'Pratique' : section);
  }
  return parts.join(' — ');
}

async function scrapePage(year, epreuve) {
  const url =
    epreuve === 'Théorique'
      ? `https://www.kiteb.net/education/informatique/bac/bacinfo${year}/epreuves-bac-theorique-${year}.php`
      : year >= 2014
        ? `https://www.kiteb.net/education/informatique/bac/bacinfo${year}/`
        : `https://www.kiteb.net/education/informatique/bac/bacinfo${year}/epreuves-bac-pratique-${year}.php`;

  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  if (!res.ok) return { year, epreuve, pageUrl: url, items: [] };

  const html = stripComments(await res.text());
  const items = [];
  const seen = new Set();

  const regex = /\/inc\.php\?ind=(\d+)/gi;
  let match;
  while ((match = regex.exec(html)) !== null) {
    const ind = match[1];
    if (seen.has(ind)) continue;
    seen.add(ind);

    const fullBefore = html.slice(0, match.index);
    const before = html.slice(Math.max(0, match.index - 800), match.index);
    const after = html.slice(match.index, Math.min(html.length, match.index + 240));

    // Session detection
    const sessMatches = [
      ...fullBefore.matchAll(
        /(session\s+de\s+contr[ôo]le|session\s+principale|contr[ôo]le\s*20\d\d|principale\s*20\d\d)/gi
      ),
    ];
    const lastSess = sessMatches.length
      ? sessMatches[sessMatches.length - 1][1].toLowerCase()
      : 'principale';
    const session = /contr/.test(lastSess) ? 'Contrôle' : 'Principale';

    // Corrigé section detection
    const headingMatches = [
      ...fullBefore.matchAll(
        /(enonc[ée]s?\s+des\s+[ée]preuves?|corrig[ée]s?\s+des\s+[ée]preuves?|propositions?\s+de\s+correction)/gi
      ),
    ];
    const inCorrigeSection =
      headingMatches.length > 0 &&
      /corrig|correction/i.test(headingMatches[headingMatches.length - 1][1]);

    // Section heading detection (green bold text used across kiteb.net!)
    const greenSectionMatches = [...fullBefore.matchAll(/<font[^>]+color=["']?green["']?[^>]*>([\s\S]*?)<\/font>/gi)];
    const lastGreenSection = greenSectionMatches.length
      ? cleanText(greenSectionMatches[greenSectionMatches.length - 1][1])
      : '';

    // Closest preceding underlined/bold subject or date heading before the table
    const tableStart = html.lastIndexOf('<table', match.index);
    const preTableHtml =
      tableStart >= 0 ? html.slice(Math.max(0, tableStart - 450), tableStart) : before;
    const preTableText = cleanText(preTableHtml);

    const lastTable = before.lastIndexOf('<table');
    const blockText = cleanText(lastTable >= 0 ? before.slice(lastTable) : before.slice(-450));
    const afterText = cleanText(after.slice(0, 140));
    const colHeader = epreuve === 'Pratique' ? extractColumnHeader(html, match.index) : '';

    const isCorrige =
      inCorrigeSection ||
      /corrig[ée]|correction/i.test(blockText) ||
      /corrig[ée]|correction/i.test(colHeader) ||
      /^\s*corrig[ée]|correction/i.test(afterText);

    const sectionSource = lastGreenSection || blockText || preTableText;
    const section = detectSection(sectionSource);
    const matiereSource =
      /Mati[èe]re/i.test(blockText) ? blockText : `${preTableText.slice(-180)} ${blockText}`;
    const matiere = detectMatiere(matiereSource, epreuve);
    const title = buildTitle(
      blockText,
      colHeader,
      preTableText,
      matiere,
      section,
      isCorrige,
      epreuve
    );

    items.push({
      id: `kiteb-${year}-${ind}`,
      ind,
      year,
      epreuve,
      session,
      section,
      matiere,
      kind: isCorrige ? 'Corrigé' : 'Énoncé',
      title,
      downloadUrl: `https://www.kiteb.net/inc.php?ind=${ind}`,
      pageUrl: url,
    });
  }

  return { year, epreuve, pageUrl: url, items };
}

async function resolveDirectPdfUrl(item) {
  try {
    const r = await fetch(item.downloadUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0', Referer: item.pageUrl },
      signal: AbortSignal.timeout(5000),
    });
    if (!r.ok) return;
    const ct = r.headers.get('content-type') || '';
    if (ct.includes('pdf') || ct.includes('zip')) return;
    const html = await r.text();
    const pdfMatch = html.match(/["'](\/education\/informatique\/bac\/[^"']+\.(?:pdf|zip|rar))["']/i);
    if (pdfMatch) {
      const pdfPath = pdfMatch[1];
      item.downloadUrl = `https://www.kiteb.net${pdfPath}`;
      if (/corrig|corr[_\-.]|_c\.pdf/i.test(pdfPath)) {
        item.kind = 'Corrigé';
        if (item.title.startsWith('Sujet ')) {
          item.title = 'Corrigé ' + item.title.slice(6);
        }
      }
      if (item.matiere === 'Pratique' || item.matiere === 'Informatique') {
        if (/algo|prog/i.test(pdfPath)) item.matiere = 'Algorithmique & Programmation';
        else if (/sti/i.test(pdfPath)) item.matiere = 'STI';
        else if (/bd|base/i.test(pdfPath)) item.matiere = 'Bases de Données';
        else if (/tic/i.test(pdfPath)) item.matiere = 'TIC';
      }
    }
  } catch {
    // Keep inc.php fallback URL
  }
}

async function runPool(items, concurrency, worker) {
  let idx = 0;
  let done = 0;
  const runners = Array.from({ length: concurrency }, async () => {
    while (idx < items.length) {
      const current = items[idx++];
      await worker(current);
      done++;
      if (done % 150 === 0) console.log(`  resolved ${done}/${items.length}...`);
    }
  });
  await Promise.all(runners);
}

async function main() {
  const allItems = [];
  const yearPages = [];

  for (let year = 2026; year >= 2006; year--) {
    const [th, pr] = await Promise.all([
      scrapePage(year, 'Théorique'),
      scrapePage(year, 'Pratique'),
    ]);
    yearPages.push({
      year,
      theoriqueUrl: th.pageUrl,
      pratiqueUrl: pr.pageUrl,
      theoriqueCount: th.items.length,
      pratiqueCount: pr.items.length,
    });
    allItems.push(...th.items, ...pr.items);
  }

  console.log(`Scraped ${allItems.length} exams across 2006-2026. Resolving direct PDF URLs...`);
  await runPool(allItems, 12, resolveDirectPdfUrl);

  const directPdfCount = allItems.filter((i) => /\.(pdf|zip|rar)$/i.test(i.downloadUrl)).length;
  console.log(`Resolved ${directPdfCount}/${allItems.length} direct PDF/ZIP URLs!`);

  // Strip temporary `ind` property before serializing
  const cleanedItems = allItems.map(({ ind: _ind, ...rest }) => rest);

  const tsContent = `// Archive officielle Bac Informatique Tunisie (2006–2026) — Source : kiteb.net
export type ExamEpreuve = 'Théorique' | 'Pratique';
export type ExamSession = 'Principale' | 'Contrôle';
export type ExamKind = 'Énoncé' | 'Corrigé';

export interface BacExamItem {
  id: string;
  year: number;
  epreuve: ExamEpreuve;
  session: ExamSession;
  section: string;
  matiere: string;
  kind: ExamKind;
  title: string;
  downloadUrl: string;
  pageUrl: string;
}

export interface BacYearArchive {
  year: number;
  theoriqueUrl: string;
  pratiqueUrl: string;
  theoriqueCount: number;
  pratiqueCount: number;
}

export const KITEB_BASE_URL = 'https://www.kiteb.net/education/informatique/bac/';

export const BAC_YEAR_ARCHIVES: BacYearArchive[] = ${JSON.stringify(yearPages, null, 2)};

export const BAC_EXAMS: BacExamItem[] = ${JSON.stringify(cleanedItems, null, 2)};
`;

  const outPath = path.resolve('src/data/bacExams.ts');
  fs.writeFileSync(outPath, tsContent, 'utf-8');
  console.log(`Saved ${outPath} (${Math.round(tsContent.length / 1024)} KB)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
