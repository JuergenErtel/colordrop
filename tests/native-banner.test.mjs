import { pathToFileURL } from 'node:url';
import { ADMOB } from '../js/constants.js';
const MOD = pathToFileURL('js/native-banner.js').href;

async function fresh(opts = {}) {
  const calls = [];
  const AdMob = {
    requestConsentInfo: async () => ({ status: 'NOT_REQUIRED', canRequestAds: opts.canRequestAds !== false, isConsentFormAvailable: false }),
    initialize:   async () => ({}),
    showBanner:   async (o) => { calls.push(['show', o]); },
    hideBanner:   async () => { calls.push(['hide']); },
    resumeBanner: async () => { calls.push(['resume']); },
  };
  global.window = { Capacitor: { isNativePlatform: () => !opts.web, Plugins: { AdMob } } };
  const mod = await import(MOD + '?n=' + Math.random().toString(36).slice(2));
  return { mod, calls };
}

let pass = 0, total = 0;
const check = (n, got, exp) => { total++; const ok = got === exp; console.log(`${ok ? 'PASS' : 'FAIL'}  ${n} → ${got} (exp ${exp})`); if (ok) pass++; };
const show = (calls) => calls.filter(c => c[0] === 'show').length;

// 1) Web (kein native) → kein showBanner (Web-Bundle unberührt)
ADMOB.bannerUnitId = 'ca-app-pub-x/1';
{ const { mod, calls } = await fresh({ web: true }); await mod.showBanner(); check('web → no show', calls.length, 0); }

// 2) leere bannerUnitId → deaktiviert, kein show
ADMOB.bannerUnitId = '';
{ const { mod, calls } = await fresh(); await mod.showBanner(); check('no id → no show', show(calls), 0); }

// 3) native + id + consent → genau ein show, adaptiv/bottom
ADMOB.bannerUnitId = 'ca-app-pub-x/1';
{ const { mod, calls } = await fresh(); await mod.showBanner();
  check('native → 1 show', show(calls), 1);
  const o = calls.find(c => c[0] === 'show')?.[1] || {};
  check('adaptiv', o.adSize, 'ADAPTIVE_BANNER');
  check('bottom', o.position, 'BOTTOM_CENTER'); }

// 4) zweiter Aufruf derselben Instanz → resume statt zweitem show
{ const { mod, calls } = await fresh(); await mod.showBanner(); await mod.showBanner();
  check('2. show → resume', calls.filter(c => c[0] === 'resume').length, 1);
  check('2. show → nur 1 show', show(calls), 1); }

console.log(`${pass}/${total}`);
process.exit(pass === total ? 0 : 1);
