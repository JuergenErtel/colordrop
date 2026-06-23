# StoreKit-IAP (Lifetime-Unlock) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Den Non-Consumable `de.kittysort.app.lifetime` (2,99 €) über ein eigenes StoreKit-2-Capacitor-Plugin nativ kaufbar, wiederherstellbar und lokal testbar machen — ohne die Web-Version zu verändern.

**Architecture:** Schlankes Swift-Plugin (`PurchasesPlugin`, StoreKit 2) wird über `window.Capacitor.Plugins.Purchases` von der bestehenden JS-Bridge (`js/native-billing.js`) angesprochen. `js/billing.js` trennt Entitlement-Setzen (idempotent, ohne Bonus) vom Kauf-Pfad (mit 500-Bones-Bonus). `tools/build-www.mjs` patcht im native-only `www/`-Bundle `BILLING_MODE='native'`.

**Tech Stack:** Capacitor 8 (SPM), StoreKit 2 (iOS 15+), Swift, ES-Module + `node --test`.

## Global Constraints

- Produkt-ID: `de.kittysort.app.lifetime` (Non-Consumable) — verbatim, muss 1:1 mit App Store Connect übereinstimmen.
- Bundle-ID: `de.kittysort.app` (permanent).
- Native Bridges greifen **nur** über `window.Capacitor.Plugins` zu — **keine** statischen Plugin-Imports im Web-Bundle (`js/`/`www/`).
- Web-Version (Repo-Root) bleibt unverändert; `BILLING_MODE` in der **Quelle** bleibt `'preview'`/`'stripe'`. Nur die `www/`-Kopie wird auf `'native'` gepatcht.
- StoreKit 2, Ziel iOS 15+.
- Plugin-jsName im Capacitor-Registry: `Purchases`.
- Welcome-Bonus (500 Bones) wird **nur beim ersten** Übergang in ein aktives Premium-Entitlement gewährt; Restore/Launch-Sync gewähren **keinen** Bonus.
- Tests laufen mit `npm test` (= `node --test`), ESM, Pure-Functions; native Teile werden per Build + Simulator verifiziert.

---

### Task 1: build-www patcht `BILLING_MODE` für das native Bundle

**Files:**
- Create: `tools/patch-constants.mjs`
- Create: `test/patch-constants.test.mjs`
- Modify: `tools/build-www.mjs` (nach dem Kopieren der `js/`-Dir die Kopie patchen)

**Interfaces:**
- Produces: `patchConstantsForNative(src: string): string` — ersetzt die `BILLING_MODE`-Zuweisung durch `'native'`, lässt alles andere unverändert.

- [ ] **Step 1: Write the failing test**

```js
// test/patch-constants.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { patchConstantsForNative } from '../tools/patch-constants.mjs';

test('patches BILLING_MODE preview -> native', () => {
  const src = "export const BILLING_MODE = 'preview';    // comment\n";
  const out = patchConstantsForNative(src);
  assert.match(out, /export const BILLING_MODE = 'native';/);
  assert.doesNotMatch(out, /'preview'/);
});

test('patches BILLING_MODE stripe -> native', () => {
  const src = "export const BILLING_MODE = 'stripe';\n";
  assert.match(patchConstantsForNative(src), /BILLING_MODE = 'native'/);
});

test('leaves REWARDED_MODE and other lines untouched', () => {
  const src = "export const REWARDED_MODE = 'preview';\nexport const BILLING_MODE = 'preview';\n";
  const out = patchConstantsForNative(src);
  assert.match(out, /REWARDED_MODE = 'preview'/);
  assert.match(out, /BILLING_MODE = 'native'/);
});

test('idempotent when already native', () => {
  const src = "export const BILLING_MODE = 'native';\n";
  assert.equal(patchConstantsForNative(src), src);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test test/patch-constants.test.mjs`
Expected: FAIL — `Cannot find module '../tools/patch-constants.mjs'`.

- [ ] **Step 3: Write minimal implementation**

```js
// tools/patch-constants.mjs
// Setzt BILLING_MODE auf 'native' — nur für die www/-Kopie (native Build).
// Die Quelle bleibt unverändert (Web nutzt 'preview'/'stripe').
export function patchConstantsForNative(src) {
  return src.replace(
    /export const BILLING_MODE = '[^']*';/,
    "export const BILLING_MODE = 'native';",
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test test/patch-constants.test.mjs`
Expected: PASS (4 tests).

- [ ] **Step 5: Wire into build-www.mjs**

In `tools/build-www.mjs` den Import ergänzen und nach der `DIRS`-Kopierschleife (nach Zeile ~38, vor dem `count`) die Kopie patchen:

```js
// am Dateikopf zu den Imports:
import { readFile, writeFile } from 'node:fs/promises';
import { patchConstantsForNative } from './patch-constants.mjs';

// ... nach der for-Schleife über DIRS, vor `const count = ...`:
  // BILLING_MODE im native Bundle auf 'native' setzen (Quelle bleibt unberührt).
  const constUrl = new URL('js/constants.js', out);
  const src = await readFile(constUrl, 'utf8');
  await writeFile(constUrl, patchConstantsForNative(src));
  console.log('build-www: BILLING_MODE in www/js/constants.js auf "native" gesetzt.');
```

- [ ] **Step 6: Verify build produces native mode in www only**

Run:
```bash
npm run build:www
grep "BILLING_MODE" www/js/constants.js
grep "BILLING_MODE" js/constants.js
```
Expected: `www/js/constants.js` → `'native'`; `js/constants.js` (Quelle) → unverändert `'preview'`.

- [ ] **Step 7: Commit**

```bash
git add tools/patch-constants.mjs test/patch-constants.test.mjs tools/build-www.mjs
git commit -m "feat(ios): patch BILLING_MODE=native in www build"
```

---

### Task 2: JS-Bridge `native-billing.js` auf das echte Plugin-API anpassen

**Files:**
- Modify: `js/native-billing.js` (komplett ersetzen, gleiche Exports + 2 neue)
- Create: `test/native-billing.test.mjs`

**Interfaces:**
- Consumes: `window.Capacitor.Plugins.Purchases` mit `getProducts({ids})→{products:[{id,displayPrice,displayName}]}`, `purchase({productId})→{status:'purchased'|'cancelled'|'pending'}`, `restorePurchases()→{lifetime:bool}`, `getEntitlements()→{lifetime:bool}` (aus Task 4).
- Produces:
  - `purchaseNative(tier): Promise<{ok:boolean, tier?:string, reason?:string}>`
  - `restoreNative(): Promise<boolean>`
  - `getNativeProducts(ids: string[]): Promise<Array<{id,displayPrice,displayName}>>`
  - `syncEntitlementsNative(): Promise<boolean>`
  - `IAP_PRODUCT_IDS` (unverändert)

- [ ] **Step 1: Write the failing test**

```js
// test/native-billing.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';

function withPlugin(plugin) {
  globalThis.window = {
    Capacitor: { isNativePlatform: () => true, Plugins: { Purchases: plugin } },
  };
}
function withoutNative() {
  globalThis.window = { Capacitor: { isNativePlatform: () => false, Plugins: {} } };
}

const mod = await import('../js/native-billing.js');

test('purchaseNative maps purchased -> ok', async () => {
  withPlugin({ purchase: async () => ({ status: 'purchased' }) });
  assert.deepEqual(await mod.purchaseNative('lifetime'), { ok: true, tier: 'lifetime' });
});

test('purchaseNative maps cancelled -> reason cancelled', async () => {
  withPlugin({ purchase: async () => ({ status: 'cancelled' }) });
  assert.deepEqual(await mod.purchaseNative('lifetime'), { ok: false, reason: 'cancelled' });
});

test('purchaseNative maps pending -> reason pending', async () => {
  withPlugin({ purchase: async () => ({ status: 'pending' }) });
  assert.deepEqual(await mod.purchaseNative('lifetime'), { ok: false, reason: 'pending' });
});

test('purchaseNative unknown tier', async () => {
  withPlugin({ purchase: async () => ({ status: 'purchased' }) });
  assert.deepEqual(await mod.purchaseNative('xyz'), { ok: false, reason: 'unknown_tier' });
});

test('purchaseNative no plugin -> plugin_unavailable', async () => {
  withoutNative();
  assert.deepEqual(await mod.purchaseNative('lifetime'), { ok: false, reason: 'plugin_unavailable' });
});

test('restoreNative true when lifetime owned', async () => {
  withPlugin({ restorePurchases: async () => ({ lifetime: true }) });
  assert.equal(await mod.restoreNative(), true);
});

test('restoreNative false without plugin', async () => {
  withoutNative();
  assert.equal(await mod.restoreNative(), false);
});

test('syncEntitlementsNative reads getEntitlements', async () => {
  withPlugin({ getEntitlements: async () => ({ lifetime: true }) });
  assert.equal(await mod.syncEntitlementsNative(), true);
});

test('getNativeProducts returns array', async () => {
  withPlugin({ getProducts: async () => ({ products: [{ id: 'x', displayPrice: '2,99 €', displayName: 'Forever' }] }) });
  const r = await mod.getNativeProducts(['x']);
  assert.equal(r[0].displayPrice, '2,99 €');
});

test('getNativeProducts empty without plugin', async () => {
  withoutNative();
  assert.deepEqual(await mod.getNativeProducts(['x']), []);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test test/native-billing.test.mjs`
Expected: FAIL — neue Funktionen/Mapping fehlen (`syncEntitlementsNative` undefined; `cancelled`-Mapping falsch).

- [ ] **Step 3: Write implementation**

Ersetze `js/native-billing.js` vollständig durch:

```js
'use strict';

/* Native In-App-Kauf (StoreKit 2) — Bridge für den Capacitor-iOS-Build.
   Zugriff ausschließlich über window.Capacitor.Plugins.Purchases — kein
   statischer Paket-Import (Web-Bundle bleibt unberührt). */

export const IAP_PRODUCT_IDS = {
  lifetime: 'de.kittysort.app.lifetime',
};

const PLUGIN_NAME = 'Purchases';

function getPlugin() {
  const C = typeof window !== 'undefined' ? window.Capacitor : null;
  if (!C || typeof C.isNativePlatform !== 'function' || !C.isNativePlatform()) {
    return null;
  }
  return (C.Plugins && C.Plugins[PLUGIN_NAME]) || null;
}

export async function purchaseNative(tier) {
  const productId = IAP_PRODUCT_IDS[tier];
  if (!productId) return { ok: false, reason: 'unknown_tier' };

  const plugin = getPlugin();
  if (!plugin) {
    console.warn('native-billing: Plugin nicht verfügbar.');
    return { ok: false, reason: 'plugin_unavailable' };
  }
  try {
    const res = await plugin.purchase({ productId });
    if (res && res.status === 'purchased') return { ok: true, tier };
    if (res && res.status === 'cancelled') return { ok: false, reason: 'cancelled' };
    if (res && res.status === 'pending')   return { ok: false, reason: 'pending' };
    return { ok: false, reason: 'purchase_failed' };
  } catch (err) {
    console.warn('native-billing: Kauf fehlgeschlagen:', err);
    return { ok: false, reason: 'purchase_failed' };
  }
}

export async function restoreNative() {
  const plugin = getPlugin();
  if (!plugin) return false;
  try {
    const res = await plugin.restorePurchases();
    return !!(res && res.lifetime);
  } catch (err) {
    console.warn('native-billing: Restore fehlgeschlagen:', err);
    return false;
  }
}

export async function syncEntitlementsNative() {
  const plugin = getPlugin();
  if (!plugin) return false;
  try {
    const res = await plugin.getEntitlements();
    return !!(res && res.lifetime);
  } catch (err) {
    console.warn('native-billing: Entitlement-Sync fehlgeschlagen:', err);
    return false;
  }
}

export async function getNativeProducts(ids) {
  const plugin = getPlugin();
  if (!plugin) return [];
  try {
    const res = await plugin.getProducts({ ids });
    return (res && res.products) || [];
  } catch (err) {
    console.warn('native-billing: getProducts fehlgeschlagen:', err);
    return [];
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test test/native-billing.test.mjs`
Expected: PASS (alle Tests).

- [ ] **Step 5: Commit**

```bash
git add js/native-billing.js test/native-billing.test.mjs
git commit -m "feat(ios): adapt native-billing bridge to Purchases plugin API"
```

---

### Task 3: `billing.js` — Entitlement/Bonus trennen, Restore + Launch-Sync

**Files:**
- Modify: `js/billing.js`
- Create: `test/billing-bonus.test.mjs`

**Interfaces:**
- Consumes: `purchaseNative`, `restoreNative`, `syncEntitlementsNative` (Task 2).
- Produces:
  - `shouldGrantWelcomeBonus(prevSub): boolean` (pure)
  - `buildSub(tier, now?): object` (pure)
  - `restorePurchases(): Promise<{ok:boolean, restored?:boolean, reason?:string}>`
  - `syncEntitlementsOnLaunch(): Promise<boolean>`
  - bestehende Exports bleiben (`purchase`, `isActiveSubscription`, …).

- [ ] **Step 1: Write the failing test**

```js
// test/billing-bonus.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { shouldGrantWelcomeBonus, buildSub } from '../js/billing.js';

test('bonus granted when no previous subscription', () => {
  assert.equal(shouldGrantWelcomeBonus(null), true);
  assert.equal(shouldGrantWelcomeBonus({ active: false }), true);
});

test('no bonus when already lifetime', () => {
  assert.equal(shouldGrantWelcomeBonus({ active: true, lifetime: true }), false);
});

test('buildSub lifetime sets lifetime true and active', () => {
  const s = buildSub('lifetime', new Date('2026-06-23T00:00:00Z'));
  assert.equal(s.lifetime, true);
  assert.equal(s.active, true);
  assert.equal(s.tier, 'lifetime');
  assert.equal(s.expiresAt, null);
});
```

> Hinweis: `shouldGrantWelcomeBonus` nutzt `isActiveSubscription` (bereits in `billing.js`). Diese Tests brauchen kein `localStorage`, da nur pure Funktionen importiert werden.

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test test/billing-bonus.test.mjs`
Expected: FAIL — `shouldGrantWelcomeBonus`/`buildSub` nicht exportiert.

- [ ] **Step 3: Refactor billing.js**

In `js/billing.js`:

a) Import erweitern (Zeile 31):
```js
import { purchaseNative, restoreNative, syncEntitlementsNative } from './native-billing.js';
```

b) Pure Helfer hinzufügen (vor `grantPreview`):
```js
export function shouldGrantWelcomeBonus(prevSub) {
  return !isActiveSubscription(prevSub);
}

export function buildSub(tier, now = new Date()) {
  let expiresAt = null;
  let lifetime  = false;
  if (tier === 'monthly')  expiresAt = new Date(now.getTime() + 30 * 86400000).toISOString();
  if (tier === 'yearly')   expiresAt = new Date(now.getTime() + 365 * 86400000).toISOString();
  if (tier === 'lifetime') lifetime  = true;
  return {
    tier, since: now.toISOString(), trialEnd: null,
    expiresAt, lifetime, active: true, stripeCustomerId: null,
  };
}

function setEntitlement(tier) {
  const def = SUB_TIERS[tier];
  if (!def) return { ok: false, reason: 'unknown_tier' };
  saveSubscription(buildSub(tier));
  return { ok: true, tier };
}
```

c) `grantPreview` ersetzen (Zeilen 106–129) durch die idempotente Variante:
```js
function grantPreview(tier) {
  const def = SUB_TIERS[tier];
  if (!def) return { ok: false, reason: 'unknown_tier' };

  const prev  = loadSubscription();
  const bonus = shouldGrantWelcomeBonus(prev) ? WELCOME_BONUS_BONES : 0;

  saveSubscription(buildSub(tier));
  if (bonus) earn(bonus);

  return { ok: true, tier, welcomeBonus: bonus };
}
```

d) Restore + Launch-Sync hinzufügen (nach `purchaseNativeFlow`):
```js
// Käufe wiederherstellen (Apple-Pflicht) — kein Bonus.
export async function restorePurchases() {
  const owned = await restoreNative();
  if (!owned) return { ok: false, reason: 'nothing_to_restore' };
  setEntitlement('lifetime');
  return { ok: true, restored: true };
}

// Beim App-Start (nativ) still abgleichen — kein Bonus.
export async function syncEntitlementsOnLaunch() {
  const owned = await syncEntitlementsNative();
  if (owned && !isActiveSubscription(loadSubscription())) {
    setEntitlement('lifetime');
    return true;
  }
  return false;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test test/billing-bonus.test.mjs`
Expected: PASS (3 Tests).

- [ ] **Step 5: Run full JS suite (keine Regression)**

Run: `npm test`
Expected: alle Tests grün (inkl. Task 1 & 2).

- [ ] **Step 6: Commit**

```bash
git add js/billing.js test/billing-bonus.test.mjs
git commit -m "feat(ios): split entitlement vs bonus, add restore + launch sync"
```

---

### Task 4: Natives Plugin `PurchasesPlugin.swift` (StoreKit 2)

**Files:**
- Create: `ios/App/App/PurchasesPlugin.swift`

**Interfaces:**
- Produces (an JS, via `window.Capacitor.Plugins.Purchases`): `getProducts`, `purchase`, `restorePurchases`, `getEntitlements` mit den in Task 2 konsumierten Rückgaben.

- [ ] **Step 1: Plugin-Datei anlegen**

```swift
// ios/App/App/PurchasesPlugin.swift
import Foundation
import Capacitor
import StoreKit

@objc(PurchasesPlugin)
public class PurchasesPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "PurchasesPlugin"
    public let jsName = "Purchases"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "getProducts", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "purchase", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "restorePurchases", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getEntitlements", returnType: CAPPluginReturnPromise),
    ]

    private let lifetimeId = "de.kittysort.app.lifetime"
    private var updatesTask: Task<Void, Never>?

    public override func load() {
        // Asynchrone Transaktionen (z. B. Ask-to-Buy-Freigabe) abfangen.
        updatesTask = Task.detached { [weak self] in
            for await update in Transaction.updates {
                if case .verified(let transaction) = update {
                    await transaction.finish()
                    self?.notifyListeners("entitlementChanged",
                                          data: ["productId": transaction.productID])
                }
            }
        }
    }

    deinit { updatesTask?.cancel() }

    @objc func getProducts(_ call: CAPPluginCall) {
        guard let ids = call.getArray("ids", String.self), !ids.isEmpty else {
            call.reject("ids required"); return
        }
        Task {
            do {
                let products = try await Product.products(for: ids)
                let arr = products.map { p -> [String: String] in
                    ["id": p.id, "displayPrice": p.displayPrice, "displayName": p.displayName]
                }
                call.resolve(["products": arr])
            } catch {
                call.reject("getProducts failed: \(error.localizedDescription)")
            }
        }
    }

    @objc func purchase(_ call: CAPPluginCall) {
        guard let productId = call.getString("productId") else {
            call.reject("productId required"); return
        }
        Task {
            do {
                let products = try await Product.products(for: [productId])
                guard let product = products.first else { call.reject("product not found"); return }
                let result = try await product.purchase()
                switch result {
                case .success(let verification):
                    if case .verified(let transaction) = verification {
                        await transaction.finish()
                        call.resolve(["status": "purchased", "productId": productId])
                    } else {
                        call.reject("verification failed")
                    }
                case .userCancelled:
                    call.resolve(["status": "cancelled"])
                case .pending:
                    call.resolve(["status": "pending"])
                @unknown default:
                    call.reject("unknown purchase result")
                }
            } catch {
                call.reject("purchase failed: \(error.localizedDescription)")
            }
        }
    }

    @objc func restorePurchases(_ call: CAPPluginCall) {
        Task {
            try? await AppStore.sync()
            let owned = await ownedProductIds()
            call.resolve(["lifetime": owned.contains(lifetimeId)])
        }
    }

    @objc func getEntitlements(_ call: CAPPluginCall) {
        Task {
            let owned = await ownedProductIds()
            call.resolve(["lifetime": owned.contains(lifetimeId)])
        }
    }

    private func ownedProductIds() async -> Set<String> {
        var ids = Set<String>()
        for await result in Transaction.currentEntitlements {
            if case .verified(let transaction) = result {
                ids.insert(transaction.productID)
            }
        }
        return ids
    }
}
```

- [ ] **Step 2: Build verifizieren (Plugin kompiliert)**

Run:
```bash
eval "$(/opt/homebrew/bin/brew shellenv)"
xcodebuild -project ios/App/App.xcodeproj -scheme App -sdk iphonesimulator -configuration Debug \
  -destination 'platform=iOS Simulator,name=iPhone 17' -derivedDataPath build/dd CODE_SIGNING_ALLOWED=NO build 2>&1 | tail -5
```
Expected: `** BUILD SUCCEEDED **`. (Die `.swift`-Datei wird vom App-Target automatisch erfasst, da sie in `ios/App/App/` liegt.)

- [ ] **Step 3: Commit**

```bash
git add ios/App/App/PurchasesPlugin.swift
git commit -m "feat(ios): add StoreKit 2 Purchases plugin"
```

---

### Task 5: StoreKit-Testkonfiguration + Plugin-Registrierung im Simulator prüfen

**Files:**
- Create: `ios/App/Products.storekit`
- Manual: Xcode-Scheme „App" → Run → Options → StoreKit Configuration = `Products.storekit`

**Interfaces:**
- Consumes: `PurchasesPlugin` (Task 4).
- Produces: lokal testbarer Store mit Produkt `de.kittysort.app.lifetime`.

- [ ] **Step 1: StoreKit-Config anlegen**

```json
// ios/App/Products.storekit
{
  "identifier": "KITTYSORT-LOCAL",
  "nonRenewingSubscriptions": [],
  "products": [
    {
      "displayPrice": "2.99",
      "familyShareable": false,
      "internalID": "lifetime-001",
      "localizations": [
        {
          "description": "Alle Premium-Features für immer freischalten.",
          "displayName": "Kittysort Forever",
          "locale": "de_DE"
        }
      ],
      "productID": "de.kittysort.app.lifetime",
      "referenceName": "Lifetime Forever",
      "type": "NonConsumable"
    }
  ],
  "settings": { "_failTransactionsEnabled": false },
  "subscriptionGroups": [],
  "version": { "major": 3, "minor": 0 }
}
```

- [ ] **Step 2: Scheme-Konfiguration setzen (manuell in Xcode)**

In Xcode: Product → Scheme → Edit Scheme → Run → Options → „StoreKit Configuration" → `Products.storekit` auswählen. Schließen.

> Hinweis: Diese Scheme-Einstellung wird in `ios/App/App.xcodeproj/xcshareddata/xcschemes/App.xcscheme` gespeichert (`StoreKitConfigurationFileReference`). Falls die Datei fehlt, „Shared" im Scheme-Manager aktivieren, damit sie eingecheckt wird.

- [ ] **Step 3: Build, installieren, starten und Plugin-Präsenz prüfen**

Run:
```bash
eval "$(/opt/homebrew/bin/brew shellenv)"
npm run cap:sync
xcodebuild -project ios/App/App.xcodeproj -scheme App -sdk iphonesimulator -configuration Debug \
  -destination 'platform=iOS Simulator,name=iPhone 17' -derivedDataPath build/dd CODE_SIGNING_ALLOWED=NO build 2>&1 | tail -3
APP=$(find build/dd/Build/Products -name App.app -maxdepth 3 | head -1)
xcrun simctl terminate booted de.kittysort.app 2>/dev/null
xcrun simctl install booted "$APP"
xcrun simctl launch booted de.kittysort.app
```
Expected: App startet. Verifikation des Plugins über das App-Log:
```bash
xcrun simctl spawn booted log show --last 30s --predicate 'process == "App"' 2>&1 | grep -i "Purchases\|loaded plugin" | head
```
Erwartet: Capacitor lädt das Plugin `Purchases` (Log „Loading plugin … Purchases" o. ä.). Alternativ in Safari-Web-Inspector `window.Capacitor.Plugins.Purchases` prüfen.

- [ ] **Step 4: Commit**

```bash
git add ios/App/Products.storekit ios/App/App.xcodeproj/xcshareddata/xcschemes/App.xcscheme
git commit -m "test(ios): add local StoreKit configuration for IAP testing"
```

---

### Task 6: Paywall-UI — Restore-Button + lokalisierter Preis

**Files:**
- Modify: `index.html` (Paywall-Bereich um Zeile 598–603: Restore-Button ergänzen)
- Modify: `js/paywall.js` (Restore verdrahten, Preis nativ laden)

**Interfaces:**
- Consumes: `restorePurchases`, `purchase`, `isActiveSubscription` (billing.js); `getNativeProducts` (native-billing.js); `IAP_PRODUCT_IDS`.

- [ ] **Step 1: Restore-Button im HTML ergänzen**

In `index.html` direkt nach dem Buy-Button (nach Zeile 600, `</button>` von `paywallBuyBtn`) einfügen:
```html
        <button class="paywall-restore" id="paywallRestoreBtn" type="button">🔄 Käufe wiederherstellen</button>
        <p class="paywall-restore-hint" id="paywallRestoreHint" hidden></p>
```

- [ ] **Step 2: paywall.js — Imports erweitern**

`js/paywall.js` Zeile 3–4 ersetzen:
```js
import { SUB_TIERS, BILLING_MODE, WELCOME_BONUS_BONES } from './constants.js';
import { purchase, isActiveSubscription, restorePurchases } from './billing.js';
import { getNativeProducts, IAP_PRODUCT_IDS } from './native-billing.js';
```

- [ ] **Step 3: Lokalisierten Preis beim Öffnen laden**

In `showPaywall` (nach `selectTier(...)`, vor `playSound`) ergänzen:
```js
  applyLocalizedPrice();
```
Und neue Funktion ergänzen:
```js
async function applyLocalizedPrice() {
  const products = await getNativeProducts([IAP_PRODUCT_IDS.lifetime]);
  const p = products.find(x => x.id === IAP_PRODUCT_IDS.lifetime);
  if (!p) return; // Fallback: hardcodierter Preis bleibt
  const priceEl = document.querySelector('.paywall-tier[data-tier="lifetime"] .paywall-tier-price');
  if (priceEl) priceEl.textContent = p.displayPrice;
  const label = document.getElementById('paywallBuyLabel');
  if (label && !isActiveSubscription(loadSubscription())) {
    label.textContent = 'FÜR IMMER FREISCHALTEN · ' + p.displayPrice;
  }
}
```

- [ ] **Step 4: Restore-Handler verdrahten**

In `initPaywallUI` ergänzen:
```js
  document.getElementById('paywallRestoreBtn')?.addEventListener('click', handleRestoreClick);
```
Und Handler hinzufügen:
```js
async function handleRestoreClick() {
  const hint = document.getElementById('paywallRestoreHint');
  const res = await restorePurchases();
  if (res && res.ok && res.restored) {
    hidePaywall();
    showCelebration({ tier: 'lifetime', welcomeBonus: 0 });
  } else if (hint) {
    hint.hidden = false;
    hint.textContent = 'Kein früherer Kauf gefunden.';
    playSound('invalid');
  }
}
```

> `showCelebration({ tier:'lifetime', welcomeBonus:0 })` zeigt die Bestätigung ohne Bonus-Animation (Counter zählt von 0 auf 0).

- [ ] **Step 5: Verifizieren (Build + Simulator)**

Run:
```bash
eval "$(/opt/homebrew/bin/brew shellenv)"
npm test
npm run cap:sync
xcodebuild -project ios/App/App.xcodeproj -scheme App -sdk iphonesimulator -configuration Debug \
  -destination 'platform=iOS Simulator,name=iPhone 17' -derivedDataPath build/dd CODE_SIGNING_ALLOWED=NO build 2>&1 | tail -3
APP=$(find build/dd/Build/Products -name App.app -maxdepth 3 | head -1)
xcrun simctl terminate booted de.kittysort.app 2>/dev/null; xcrun simctl install booted "$APP"; xcrun simctl launch booted de.kittysort.app
xcrun simctl io booted screenshot .tmp/paywall.png
```
Expected: `npm test` grün; Build OK. Paywall (öffnen über einen Trigger/Shop) zeigt Restore-Button und den Preis aus der `.storekit`-Config (`2,99 €`).

- [ ] **Step 6: Commit**

```bash
git add index.html js/paywall.js
git commit -m "feat(ios): paywall restore button + localized StoreKit price"
```

---

### Task 7: Launch-Sync beim App-Start verdrahten

**Files:**
- Modify: `js/main.js` (Boot-Bereich um Zeile 3377–3388, wo `isNativeApp` schon ermittelt wird)

**Interfaces:**
- Consumes: `syncEntitlementsOnLaunch` (billing.js), `isNativeApp` (bereits in main.js).

- [ ] **Step 1: Import ergänzen**

In `js/main.js` den bestehenden billing-Import (Zeile 20) erweitern:
```js
import { handleStripeReturn, isFounder, syncEntitlementsOnLaunch } from './billing.js';
```

- [ ] **Step 2: Sync im nativen Boot aufrufen**

Direkt nach der `isNativeApp`-Berechnung (nach Zeile 3381) ergänzen:
```js
// Nativ: Entitlements still mit dem Store abgleichen (Neuinstallation/anderes Gerät).
if (isNativeApp) {
  syncEntitlementsOnLaunch()
    .then((changed) => { if (changed && typeof updateMenuPremiumSignals === 'function') updateMenuPremiumSignals(); })
    .catch((err) => console.warn('entitlement sync failed:', err));
}
```

- [ ] **Step 3: Verifizieren (Build + Simulator, kein JS-Fehler beim Start)**

Run:
```bash
eval "$(/opt/homebrew/bin/brew shellenv)"
npm run cap:sync
xcodebuild -project ios/App/App.xcodeproj -scheme App -sdk iphonesimulator -configuration Debug \
  -destination 'platform=iOS Simulator,name=iPhone 17' -derivedDataPath build/dd CODE_SIGNING_ALLOWED=NO build 2>&1 | tail -3
APP=$(find build/dd/Build/Products -name App.app -maxdepth 3 | head -1)
xcrun simctl terminate booted de.kittysort.app 2>/dev/null; xcrun simctl install booted "$APP"; xcrun simctl launch booted de.kittysort.app
xcrun simctl spawn booted log show --last 20s --predicate 'process == "App"' 2>&1 | grep -i "sync\|error" | head
```
Expected: App startet sauber; kein „entitlement sync failed". (Ohne vorigen Kauf bleibt der Status unverändert.)

- [ ] **Step 4: Commit**

```bash
git add js/main.js
git commit -m "feat(ios): sync StoreKit entitlements on native launch"
```

---

### Task 8: End-to-End-Kauffluss im Simulator (lokale StoreKit-Config)

**Files:** keine (Verifikations-Task).

- [ ] **Step 1: Frischer Build + Installation**

```bash
eval "$(/opt/homebrew/bin/brew shellenv)"
npm run cap:sync
xcodebuild -project ios/App/App.xcodeproj -scheme App -sdk iphonesimulator -configuration Debug \
  -destination 'platform=iOS Simulator,name=iPhone 17' -derivedDataPath build/dd CODE_SIGNING_ALLOWED=NO build 2>&1 | tail -3
APP=$(find build/dd/Build/Products -name App.app -maxdepth 3 | head -1)
xcrun simctl uninstall booted de.kittysort.app 2>/dev/null; xcrun simctl install booted "$APP"; xcrun simctl launch booted de.kittysort.app
```

- [ ] **Step 2: Kauf durchführen (manuell im Simulator)**

Paywall öffnen (Shop/Trigger) → „FÜR IMMER FREISCHALTEN" → im StoreKit-Test-Dialog bestätigen.
Expected: Celebration mit 500 Bones; danach keine Werbung, unendliche Leben (`isPremium()` true).

> Falls headless gewünscht: In `Products.storekit`/Scheme „Ask to Buy" aus und ggf. Transaktionen über Xcode → Debug → StoreKit verwalten. Der Bestätigungs-Tap selbst ist UI-gebunden.

- [ ] **Step 3: Restore-/Reinstall-Test**

```bash
xcrun simctl uninstall booted de.kittysort.app; xcrun simctl install booted "$APP"; xcrun simctl launch booted de.kittysort.app
```
Dann Paywall → „🔄 Käufe wiederherstellen".
Expected: Premium wieder aktiv, **ohne** erneuten 500-Bones-Bonus (Bones-Stand unverändert gegenüber vor dem Reinstall, abzüglich nichts). Launch-Sync kann den Status sogar schon vor dem Tippen gesetzt haben.

- [ ] **Step 4: Abbruch-Test**

Premium-Status zurücksetzen (App-Daten löschen via uninstall/install), Kauf starten, Dialog **abbrechen**.
Expected: kein Premium, kein Crash, Paywall bleibt offen, kein wiederholter Fehlerton.

- [ ] **Step 5: Ergebnis dokumentieren (kein Commit nötig)**

Screenshots in `.tmp/` ablegen; Resultate (Kauf/Restore/Abbruch) festhalten.

---

### Task 9: App Store Connect & Sandbox (manuell, kein Code)

**Files:**
- Modify: `docs/IOS-CAPACITOR.md` (Abschnitt „Erledigt" um StoreKit-Status ergänzen)

- [ ] **Step 1: Produkt anlegen**

In App Store Connect → App „Kittysort" → Monetarisierung → In-App-Käufe → **Non-Consumable**:
- Produkt-ID: `de.kittysort.app.lifetime`
- Referenzname: `Lifetime Forever`
- Preis: Stufe ~2,99 €
- Lokalisierung (de): Anzeigename + Beschreibung
- Review-Screenshot der Paywall hochladen
- Status „Zur Prüfung bereit"

- [ ] **Step 2: Sandbox-Tester**

App Store Connect → Benutzer und Zugriff → Sandbox → Tester anlegen (separate E-Mail).

- [ ] **Step 3: Sandbox-Kauf testen**

Im Simulator/Gerät mit Sandbox-Account anmelden (Einstellungen → Developer → Sandbox Apple Account), Scheme-StoreKit-Config **deaktivieren** (damit echter Sandbox-Store greift), App starten, Kauf + Restore durchführen.
Expected: realer StoreKit-Flow mit echter Produkt-ID/Preis funktioniert.

- [ ] **Step 4: Doku aktualisieren + Commit**

`docs/IOS-CAPACITOR.md`: Phase 1 (StoreKit) als umgesetzt markieren, Produkt-ID/Teststatus notieren.
```bash
git add docs/IOS-CAPACITOR.md
git commit -m "docs(ios): StoreKit IAP phase complete, ASC product live"
```

---

## Self-Review

**Spec-Abdeckung:**
- Plugin (getProducts/purchase/restore/getEntitlements/Tx.updates) → Task 4 ✓
- Bridge-Anpassung + neue Funktionen → Task 2 ✓
- Entitlement/Bonus-Trennung, Restore, Launch-Sync, Revocation (nur gewähren) → Task 3 + 7 ✓
- BILLING_MODE-Patch nur in www → Task 1 ✓
- Restore-Button + lokalisierter Preis → Task 6 ✓
- .storekit-Test + Sandbox → Task 5 + 8 + 9 ✓
- Web unverändert (Quelle BILLING_MODE bleibt) → Task 1 Step 6 + Task 3 Step 5 ✓
- Erfolgskriterien der Spec → Task 8 deckt Kauf/Abbruch/Restore/Sync; Task 6 den Preis ✓

**Platzhalter-Scan:** Keine TBD/TODO; alle Code-Schritte enthalten vollständigen Code und konkrete Pfade/Befehle.

**Typ-Konsistenz:** `purchase({productId})→{status}`, `restorePurchases()→{lifetime}`, `getEntitlements()→{lifetime}`, `getProducts({ids})→{products:[…]}` sind in Task 4 (Swift) und Task 2 (JS-Tests/Impl) identisch. `shouldGrantWelcomeBonus`/`buildSub`/`setEntitlement` konsistent zwischen Task 3-Definition und Verwendung. JS-Funktionsnamen (`restorePurchases`, `syncEntitlementsOnLaunch`, `getNativeProducts`, `syncEntitlementsNative`) durchgängig gleich in Tasks 2/3/6/7.

Keine offenen Lücken gefunden.
