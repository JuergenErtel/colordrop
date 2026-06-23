// Setzt BILLING_MODE auf 'native' — nur für die www/-Kopie (native Build).
// Die Quelle bleibt unverändert (Web nutzt 'preview'/'stripe').
export function patchConstantsForNative(src) {
  return src.replace(
    /export const BILLING_MODE = '[^']*';/,
    "export const BILLING_MODE = 'native';",
  );
}
