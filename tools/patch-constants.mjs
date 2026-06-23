// Setzt BILLING_MODE und REWARDED_MODE auf 'native' — nur für die www/-Kopie
// (nativer Capacitor-Build). Die Quelle bleibt unverändert (Web nutzt
// 'preview'/'stripe' für Billing bzw. 'preview'/'adsense' für Rewarded).
export function patchConstantsForNative(src) {
  return src
    .replace(
      /export const BILLING_MODE = '[^']*';/,
      "export const BILLING_MODE = 'native';",
    )
    .replace(
      /export const REWARDED_MODE = '[^']*';/,
      "export const REWARDED_MODE = 'native';",
    );
}
