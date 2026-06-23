# Design-Spec: StoreKit-IAP (Lifetime-Unlock)

**Datum:** 2026-06-23
**Branch:** `ios-capacitor`
**Phase:** 1 von 6 der iOS-Store-Roadmap (siehe `docs/IOS-CAPACITOR.md`)
**Status:** Entwurf zur Review

## Ziel

Den einzigen In-App-Kauf der App — `de.kittysort.app.lifetime` (Non-Consumable,
2,99 €, „Forever"-Unlock) — über Apples **StoreKit 2** nativ einlösbar, testbar
und App-Store-konform machen. Die Web-Version (Repo-Root) bleibt vollständig
unberührt.

## Kontext / Ist-Zustand

- Kauf-Mechanik ist bereits vorbereitet:
  - `js/paywall.js` → `purchase('lifetime')` (aus `js/billing.js`).
  - `billing.js` routet bei `BILLING_MODE === 'native'` nach `purchaseNativeFlow`
    → `purchaseNative` (Stub in `js/native-billing.js`).
  - Bei Erfolg: `grantPreview('lifetime')` setzt lokal `sub.lifetime = true`,
    `active = true` und gewährt `WELCOME_BONUS_BONES` (500).
- `isPremium()` (in `js/economy.js`, true bei `sub.lifetime`) ist das zentrale
  Gate. Lifetime schaltet frei: keine Werbung, unendlich Leben, doppelte
  Belohnungen, Premium-Katzen.
- `js/native-billing.js` greift **ausschließlich** über
  `window.Capacitor.Plugins[PLUGIN_NAME]` zu — kein statischer Paket-Import im
  Web-Bundle (Architektur-Prinzip). `PLUGIN_NAME` ist aktuell Platzhalter
  `'InAppPurchase'`.
- **Kein Restore-Button** vorhanden (Apple-Pflicht für Non-Consumables).
- Preis ist hardcodiert (`SUB_TIERS.lifetime.price = '2,99€'`).
- iOS-Projekt ist **reines SPM** (kein Podfile/Workspace).

## Gewählter Ansatz

**Eigenes minimales Capacitor-Plugin in Swift auf Basis StoreKit 2.** Null
Drittabhängigkeiten, passt zum reinen SPM-Projekt, voll im Sinne des
Self-contained-Prinzips. Verworfen: `cordova-plugin-purchase` (bringt CocoaPods
zurück, zu viel API für ein Produkt) und RevenueCat (Drittanbieter/Account/Server
für ein einzelnes 2,99-€-Produkt Overkill).

## Komponenten

### 1. Natives Plugin `PurchasesPlugin.swift` (neu, ~120–150 Zeilen)

Liegt in `ios/App/App/`, registriert als `window.Capacitor.Plugins.Purchases`
(Capacitor-8-Registrierung über `CAPBridgedPlugin`, kein ObjC-`.m` nötig).
StoreKit 2 (iOS 15+).

Methoden:
- `getProducts({ ids: string[] })`
  → `[{ id, displayPrice, displayName }]` via `Product.products(for:)`.
- `purchase({ productId })`
  → `product.purchase()`; Ergebnis auswerten:
    - `.success(verification)` → Transaktion verifizieren
      (`checkVerified`), bei Erfolg `transaction.finish()`,
      Rückgabe `{ status: 'purchased', productId }`.
    - `.userCancelled` → `{ status: 'cancelled' }`.
    - `.pending` → `{ status: 'pending' }` (z. B. „Ask to Buy").
    - Verifikation fehlgeschlagen → Fehler werfen.
- `restorePurchases()`
  → optional `try await AppStore.sync()` anstoßen, dann
    `Transaction.currentEntitlements` durchgehen; Rückgabe
    `{ lifetime: Bool }` (true, wenn ein verifiziertes Entitlement für die
    Lifetime-Produkt-ID existiert).
- `getEntitlements()` (still, ohne `AppStore.sync()`)
  → wie `restorePurchases`, aber ohne Apple-ID-Prompt; für den Launch-Sync.

Zusätzlich: ein `Transaction.updates`-Listener (beim Plugin-Init gestartet), der
asynchron eintreffende, verifizierte Transaktionen `finish()`t und per
Capacitor-Event (`notifyListeners('entitlementChanged', …)`) meldet.

### 2. JS-Bridge `js/native-billing.js` (anpassen)

- `PLUGIN_NAME = 'Purchases'`.
- `purchaseNative(tier)` → `plugin.purchase({ productId })`; Mapping:
  `purchased` → `{ ok: true, tier }`, `cancelled` → `{ ok: false, reason: 'cancelled' }`,
  `pending` → `{ ok: false, reason: 'pending' }`, sonst `{ ok: false, reason: 'purchase_failed' }`.
- `restoreNative()` → `plugin.restorePurchases()` → `!!res.lifetime`.
- **Neu** `getNativeProducts(ids)` → `plugin.getProducts({ ids })` (für Preis).
- **Neu** `syncEntitlementsNative()` → `plugin.getEntitlements()` → `!!res.lifetime`.
- Alle Funktionen liefern bei fehlendem Plugin sauberen Fallback (kein Hard-Fail),
  damit das Web-Bundle unbeeinflusst bleibt.

### 3. `js/billing.js` (anpassen)

- **Entitlement-Pfad von Bonus-Pfad trennen** (Idempotenz):
  - `grantPreview(tier)` bleibt der **Kauf-Pfad** (mit 500-Bones-Bonus), aber nur,
    wenn vorher *nicht* schon `lifetime` aktiv war.
  - Neuer reiner Entitlement-Setter `setEntitlement(tier)` ohne Bonus — für
    Launch-Sync und Restore.
- **Neu** `restorePurchases()`:
  `restoreNative()` → bei `true` `setEntitlement('lifetime')` (kein Bonus) →
  Rückgabe `{ ok: true, restored: true }`; sonst `{ ok: false, reason: 'nothing_to_restore' }`.
- **Neu** `syncEntitlementsOnLaunch()` (nur nativ): `syncEntitlementsNative()` →
  falls Store „lifetime" meldet und lokal fehlt → `setEntitlement('lifetime')`.
  Wird einmal beim Boot aufgerufen (in `main.js`, nur wenn `isNativeApp`).
- **Revocation:** Es wird nur **gewährt**, nie automatisch entzogen (vermeidet
  falsche Negative; Refunds bei 2,99 € selten).

### 4. UI (`js/paywall.js` + `index.html`)

- **Restore-Button** „🔄 Käufe wiederherstellen" als dezenter Button unter dem
  Kauf-Button in der Paywall. Klick → `billing.restorePurchases()`:
  - erfolgreich → `showCelebration`-artige Bestätigung (ohne Bonus-Animation) bzw.
    „Premium wiederhergestellt", Paywall schließen.
  - nichts gefunden → kurzer Hinweis „Kein Kauf gefunden".
- **Lokalisierter Preis:** Beim `showPaywall()` im nativen Build
  `getNativeProducts(['de.kittysort.app.lifetime'])` → Buy-Label und Tier-Preis
  auf `displayPrice` setzen. Fallback: `SUB_TIERS.lifetime.price`.

### 5. Build / Mode-Switch (`tools/build-www.mjs`)

`www/` ist ausschließlich der native Build (Web wird aus Repo-Root deployt).
`build-www.mjs` ersetzt beim Kopieren in der `www/js/constants.js`
`BILLING_MODE = 'preview'` (bzw. `'stripe'`) durch `BILLING_MODE = 'native'`
(robuster, kommentierter String-Replace auf der Kopie — die Quelle bleibt
unverändert). Damit stimmen alle bestehenden `BILLING_MODE === …`-Checks im
nativen Build automatisch.
*(REWARDED_MODE wird in der späteren AdMob-Phase analog behandelt — hier noch nicht.)*

### 6. Natives Projekt / Xcode

- StoreKit-Konfigurationsdatei `ios/App/Products.storekit` mit dem Non-Consumable
  `de.kittysort.app.lifetime` (2,99 €). Im Run-Scheme als StoreKit-Configuration
  hinterlegen (lokaler Test ohne Account/Netz).
- Keine zusätzliche Capability nötig (In-App-Purchase ist Standard); ggf.
  „In-App Purchase" in App Store Connect / Signing prüfen.

### 7. App Store Connect (manuell, kein Code)

Non-Consumable `de.kittysort.app.lifetime` anlegen: Preis ~2,99 €,
Anzeigename/Beschreibung (Lokalisierung), Review-Screenshot, zur Prüfung
einreichen. Sandbox-Tester anlegen.

## Datenfluss (Kauf)

```
Paywall „FÜR IMMER FREISCHALTEN" tippen
  → billing.purchase('lifetime')
  → (nativ) purchaseNativeFlow → native-billing.purchaseNative
  → Capacitor → PurchasesPlugin.purchase → StoreKit Product.purchase()
  → Apple-Kaufdialog → success → verifizieren → finish()
  → { status: 'purchased' }
  → billing: grantPreview('lifetime')  [Entitlement + einmalig 500 Bones]
  → Paywall: showCelebration
```

## Datenfluss (Launch-Sync & Restore)

```
App-Start (nativ)  → billing.syncEntitlementsOnLaunch()
  → getEntitlements() (still) → falls lifetime: setEntitlement (ohne Bonus)

Restore-Button     → billing.restorePurchases()
  → AppStore.sync() + currentEntitlements → falls lifetime: setEntitlement (ohne Bonus)
  → Bestätigung „Premium wiederhergestellt"
```

## Fehlerbehandlung

| Fall | Verhalten |
|------|-----------|
| Plugin nicht verfügbar (z. B. Web) | `{ ok:false, reason:'plugin_unavailable' }`, kein Crash |
| Nutzer bricht Kauf ab | `{ ok:false, reason:'cancelled' }`, kein Fehlerton-Spam, Paywall bleibt |
| Kauf „pending" (Ask to Buy) | `{ ok:false, reason:'pending' }` + Hinweis „Warte auf Freigabe"; `Transaction.updates` schaltet später frei |
| Verifikation schlägt fehl | kein Entitlement, Fehler geloggt |
| Restore ohne Kauf | `{ ok:false, reason:'nothing_to_restore' }` + neutraler Hinweis |
| Offline | `currentEntitlements`/`getEntitlements` funktionieren lokal; Kauf/`AppStore.sync()` brauchen Netz → sauberer Fehler |

## Idempotenz / Missbrauchsschutz

- 500-Bones-Bonus nur beim **ersten** Wechsel zu `lifetime` (Guard: vorher nicht
  premium). Launch-Sync und Restore nutzen den bonusfreien `setEntitlement`.

## Teststrategie

1. **Lokal (sofort, ohne Apple-Account):** `Products.storekit` im Scheme →
   Simulator. Test: Kauf (success), Abbruch, „pending", Restore, „alle
   Transaktionen löschen". Build/Install/Launch/Screenshots automatisiert; der
   Kaufdialog wird per StoreKit-Test-Optionen auf Auto-Approve gestellt oder
   manuell getippt.
2. **Sandbox (mit Developer-Account):** Produkt in App Store Connect + Sandbox-
   Tester → echter StoreKit-Flow auf Gerät/Sim, validiert echte Produkt-ID/Preis.
3. **Regression Web:** `git diff` zeigt nur additive JS-Änderungen; `BILLING_MODE`
   in der Quelle bleibt `preview`/`stripe`; Web-Kauf-Flow unverändert.

## Erfolgskriterien

- [ ] Im Simulator (`.storekit`) lässt sich Lifetime kaufen → `isPremium()` true,
      Werbung weg, unendlich Leben, Celebration mit Bonus.
- [ ] Abbruch und „pending" werden sauber behandelt (kein Crash, korrekte Hinweise).
- [ ] Restore stellt nach Neuinstallation Premium wieder her — **ohne** erneuten Bonus.
- [ ] Launch-Sync setzt Entitlement still, falls Store es kennt.
- [ ] Paywall zeigt lokalisierten Store-Preis.
- [ ] Web-Version unverändert (Repo-Root, `BILLING_MODE` unangetastet).

## Nicht in dieser Phase (YAGNI / spätere Phasen)

- AdMob/Rewarded (`REWARDED_MODE`) — eigene Phase.
- Server-seitige Belegprüfung / Cross-Device-Sync über eigenen Server.
- Abos oder weitere Produkte (Modell ist bewusst ein einzelnes Non-Consumable).
- Privacy-Manifest/ATT — eigene Phase (für IAP allein nicht nötig).

## Offene Punkte für die Umsetzung (im Plan zu klären)

- Exakter Capacitor-8-Registrierungsmechanismus für ein **lokales** Swift-Plugin
  (CAPBridgedPlugin + Eintrag in der Plugin-Liste vs. Package).
- Auto-Approve-Schalter der StoreKit-Test-Konfiguration für headless-Tests.
