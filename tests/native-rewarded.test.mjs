import { pathToFileURL } from 'node:url';
const MOD = pathToFileURL('js/native-rewarded.js').href;

async function run(name, emit) {
  const listeners = {};
  let showResolve, showReject;
  const AdMob = {
    requestConsentInfo: async () => ({ status: 'NOT_REQUIRED', canRequestAds: true, isConsentFormAvailable: false }),
    requestTrackingAuthorization: async () => ({ status: 'authorized' }),
    initialize: async () => ({}),
    prepareRewardVideoAd: async () => ({ adUnitId: 'x' }),
    addListener: (evt, fn) => { (listeners[evt] ||= []).push(fn); return Promise.resolve({ remove() {} }); },
    showRewardVideoAd: () => new Promise((res, rej) => { showResolve = res; showReject = rej; }),
  };
  global.window = { Capacitor: { isNativePlatform: () => true, Plugins: { AdMob } } };
  const mod = await import(MOD + '?n=' + encodeURIComponent(name));
  const p = mod.playNativeRewarded('life');
  await new Promise(r => setTimeout(r, 30));
  const fire = (e, d) => (listeners[e] || []).forEach(f => f(d));
  emit({ fire, resolveShow: (v) => showResolve && showResolve(v) });
  return await p;
}

const cases = [
  ['reward+resolve+dismiss', ({fire,resolveShow}) => { fire('onRewardedVideoAdReward',{type:'',amount:1}); resolveShow({type:'',amount:1}); fire('onRewardedVideoAdDismissed'); }, true],
  ['dismiss only',           ({fire}) => fire('onRewardedVideoAdDismissed'), false],
  ['show hangs + events',    ({fire}) => { fire('onRewardedVideoAdReward',{type:'',amount:1}); fire('onRewardedVideoAdDismissed'); }, true],
  ['failed to show',         ({fire}) => fire('onRewardedVideoAdFailedToShow',{code:3}), false],
];
let pass = 0;
for (const [name, emit, expected] of cases) {
  const { completed } = await run(name, emit);
  const ok = completed === expected;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name} → ${completed} (exp ${expected})`);
  if (ok) pass++;
}
console.log(`${pass}/${cases.length}`);
process.exit(pass === cases.length ? 0 : 1);
