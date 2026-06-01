// Stempelt das Build-Badge in index.html mit Git-SHA + Deploy-Zeitpunkt.
// Vor jedem Deploy ausführen:  node tools/stamp-build.mjs
//
// Hinweis: Die angezeigte SHA ist die von HEAD zum Stempel-Zeitpunkt (also der
// Inhalts-Commit). Der anschließende Stempel-Commit hat eine andere SHA – das
// ist gewollt und für die "ist es live?"-Kontrolle ohne Belang.

import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

// Statische Argumente, kein Shell, kein User-Input → keine Injection-Fläche.
const sha = execFileSync('git', ['rev-parse', '--short', 'HEAD']).toString().trim();

const d = new Date();
const pad = (n) => String(n).padStart(2, '0');
const when = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ` +
             `${pad(d.getHours())}:${pad(d.getMinutes())}`;

const stamp = `${sha} · ${when}`;

const htmlFile = new URL('../index.html', import.meta.url);
let html = readFileSync(htmlFile, 'utf8');

const re = /(<div[^>]*id="buildBadge"[^>]*>)([\s\S]*?)(<\/div>)/;
if (!re.test(html)) {
  console.error('FEHLER: #buildBadge-Element in index.html nicht gefunden.');
  process.exit(1);
}
html = html.replace(re, `$1${stamp}$3`);
writeFileSync(htmlFile, html);

// Klartext-Datei für geräteunabhängige Live-Kontrolle: kittysort.de/version.txt
writeFileSync(new URL('../version.txt', import.meta.url), stamp + '\n');

console.log('Build gestempelt:', stamp);
