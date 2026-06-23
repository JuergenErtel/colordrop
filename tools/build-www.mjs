// Bündelt die reinen Web-Assets nach ./www — das ist Capacitors `webDir`.
// Wird vor jedem nativen Build/Sync ausgeführt:  npm run build:www
//
// Kopiert NUR, was die App zur Laufzeit braucht. node_modules, docs, tools,
// test, .git, CNAME usw. bleiben außen vor, damit das App-Bundle schlank ist.

import { rm, mkdir, cp, readdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { patchConstantsForNative } from './patch-constants.mjs';

const root = new URL('..', import.meta.url);
const out = new URL('../www/', import.meta.url);

// Einzeldateien + Verzeichnisse, die ins Bundle gehören.
const FILES = ['index.html', 'datenschutz.html', 'impressum.html', 'manifest.json', 'sw.js', 'version.txt'];
const DIRS = ['css', 'js', 'img', 'audio'];

async function main() {
  // Sauberer Neuaufbau, damit gelöschte Assets nicht im Bundle hängenbleiben.
  await rm(out, { recursive: true, force: true });
  await mkdir(out, { recursive: true });

  for (const f of FILES) {
    const src = new URL(f, root);
    if (existsSync(src)) {
      await cp(src, new URL(f, out));
    } else {
      console.warn(`build-www: Datei fehlt, übersprungen: ${f}`);
    }
  }

  for (const d of DIRS) {
    const src = new URL(`${d}/`, root);
    if (existsSync(src)) {
      await cp(src, new URL(`${d}/`, out), { recursive: true });
    } else {
      console.warn(`build-www: Verzeichnis fehlt, übersprungen: ${d}`);
    }
  }

  // BILLING_MODE + REWARDED_MODE im native Bundle auf 'native' setzen
  // (Quelle bleibt unberührt).
  const constUrl = new URL('js/constants.js', out);
  const src = await readFile(constUrl, 'utf8');
  await writeFile(constUrl, patchConstantsForNative(src));
  console.log('build-www: BILLING_MODE + REWARDED_MODE in www/js/constants.js auf "native" gesetzt.');

  const count = (await readdir(out)).length;
  console.log(`build-www: www/ neu erstellt (${count} Einträge auf oberster Ebene).`);
}

main().catch((err) => {
  console.error('build-www fehlgeschlagen:', err);
  process.exit(1);
});
