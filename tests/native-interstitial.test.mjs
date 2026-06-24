import { pathToFileURL } from 'node:url';
const MOD = pathToFileURL('js/native-interstitial.js').href;

async function fresh(opts = {}) {
  const listeners = {};
  let showReject;
  const AdMob = {
    requestConsentInfo: async () => ({ status: 'NOT_REQUIRED', canRequestAds: opts.canRequestAds !== false, isConsentFormAvailable: false }),
    requestTrackingAuthorization: async () => ({ status: 'authorized' }),
    initialize: async () => ({}),
    prepareInterstitial: async () => { if (opts.prepareFails) throw new Error('no fill'); return { adUnitId: 'x' }; },
    addListener: (evt, fn) => { (listeners[evt] ||= []).push(fn); return Promise.resolve({ remove() {} }); },
    showInterstitial: () => new Promise((_res, rej) => { showReject = rej; }),
  };
  global.window = { Capacitor: { isNativePlatform: () => !opts.web, Plugins: { AdMob } } };
  const mod = await import(MOD + '?n=' + Math.random().toString(36).slice(2));
  const fire = (e, d) => (listeners[e] || []).forEach(f => f(d));
  return { mod, fire, rejectShow: (e) => showReject && showReject(e) };
}

let pass = 0, total = 0;
const check = (name, got, exp) => { total++; const ok = got === exp; console.log(`${ok?'PASS':'FAIL'}  ${name} → ${got} (exp ${exp})`); if (ok) pass++; };

// 1) prepare + dismissed → true
{
  const { mod, fire } = await fresh();
  await mod.prepareInterstitial();
  const p = mod.showInterstitialIfReady();
  await new Promise(r => setTimeout(r, 20));
  fire('interstitialAdDismissed');
  check('prepared → dismissed', await p, true);
}
// 2) not prepared → false (sofort)
{
  const { mod } = await fresh();
  check('not prepared → skip', await mod.showInterstitialIfReady(), false);
}
// 3) prepared, show "hängt", failedToShow → false
{
  const { mod, fire } = await fresh();
  await mod.prepareInterstitial();
  const p = mod.showInterstitialIfReady();
  await new Promise(r => setTimeout(r, 20));
  fire('interstitialAdFailedToShow', { code: 3 });
  check('prepared → failedToShow', await p, false);
}
// 4) web/preview (kein Native) → false
{
  const { mod } = await fresh({ web: true });
  await mod.prepareInterstitial();
  check('web → skip', await mod.showInterstitialIfReady(), false);
}

console.log(`${pass}/${total}`);
process.exit(pass === total ? 0 : 1);
