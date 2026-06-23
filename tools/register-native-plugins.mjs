// Re-registers app-local native Capacitor plugins that `cap sync` strips from
// the generated (gitignored) iOS capacitor.config.json packageClassList.
// Run automatically by `npm run cap:sync`; run manually after any bare `cap sync`.
import { readFileSync, writeFileSync } from 'node:fs';

const CONFIG = 'ios/App/App/capacitor.config.json';
const LOCAL_PLUGINS = ['PurchasesPlugin'];

const cfg = JSON.parse(readFileSync(CONFIG, 'utf8'));
cfg.packageClassList ??= [];
let added = 0;
for (const p of LOCAL_PLUGINS) {
  if (!cfg.packageClassList.includes(p)) { cfg.packageClassList.push(p); added++; }
}
writeFileSync(CONFIG, JSON.stringify(cfg, null, '\t') + '\n');
console.log(`register-native-plugins: ensured [${LOCAL_PLUGINS.join(', ')}] in packageClassList (${added} added).`);
