# iOS / App Store — Capacitor-Wrapper

KittySort wird per **Capacitor** in ein natives iOS-Binary verpackt. Das
vorhandene Web-Spiel (`index.html` + `js/` + `css/` + Assets) läuft unverändert
in einer WKWebView; native Funktionen (IAP, AdMob, Haptik, Splash) kommen über
Capacitor-Plugins dazu.

## Was bereits eingerichtet ist (plattformübergreifend, auf Windows erledigt)

- `@capacitor/core`, `@capacitor/cli`, `@capacitor/ios` + Plugins
  (`app`, `haptics`, `splash-screen`, `status-bar`) installiert.
- `capacitor.config.json` — **appId `de.kittysort.app`** (= Bundle Identifier,
  nach Veröffentlichung permanent!), appName `Kittysort`, `webDir: www`.
- `tools/build-www.mjs` — bündelt nur die echten Web-Assets nach `www/`
  (kein `node_modules`/`docs`/`tools`/`test`). `www/` ist in `.gitignore`.
- npm-Scripts:
  - `npm run build:www` — Web-Bundle neu erzeugen
  - `npm run cap:sync` — `build:www` + `cap sync ios`
  - `npm run cap:open` — Xcode-Projekt öffnen

## Mac-Schritte (einmalig, braucht macOS + Xcode + CocoaPods)

```bash
# 1. Repo klonen/pullen, Abhängigkeiten holen
npm install

# 2. Native iOS-Plattform erzeugen (legt den ios/-Ordner mit Xcode-Projekt an)
npm run build:www
npx cap add ios

# 3. Bei jeder Web-Änderung: Bundle bauen + in die native App synchronisieren
npm run cap:sync

# 4. In Xcode öffnen
npm run cap:open
```

In Xcode dann:
- **Signing & Capabilities** → Team auswählen (Apple-Developer-Account),
  Bundle Identifier auf `de.kittysort.app` prüfen.
- Auf Simulator/Gerät starten und das Spiel auf Funktion testen.

> **Hinweis Service Worker:** Die App lädt nativ von `capacitor://localhost`.
> Der vorhandene `sw.js` (network-first für Navigation) sollte funktionieren,
> aber im nativen Build explizit testen (Offline-Start!). Falls er stört, im
> nativen Kontext die SW-Registrierung überspringen.

## Noch offene iOS-Phasen (Reihenfolge)

1. **Native In-App-Käufe (StoreKit)** — Lifetime 2,99 € MUSS über Apple IAP
   laufen, nicht Stripe. `js/billing.js` ist mit `BILLING_MODE = 'native'`
   bereits vorbereitet; native Bridge + Produkt in App Store Connect anlegen.
   Plugin-Kandidat: `@capacitor-community/in-app-purchases` o. ä.
2. **AdMob statt AdSense** — Rewarded Video über `@capacitor-community/admob`
   (v8, SPM-nativ). **Code-Integration erledigt:**
   - Plugin installiert + via `cap:sync` registriert (`AdMobPlugin` in
     `Package.swift` + `packageClassList`).
   - `js/native-rewarded.js`: Consent (UMP/DSGVO) → ATT → SDK-Init → Rewarded,
     idempotenter Warm-up `initNativeAds()`, von `main.js` beim nativen Launch
     aufgerufen (nur Nicht-Premium).
   - `js/constants.js` → `ADMOB`-Block (IDs + `testing`-Flag). `REWARDED_MODE`
     wird im www-Build auf `'native'` gepatcht (`tools/patch-constants.mjs`).
   - `Info.plist`: `GADApplicationIdentifier`, `NSUserTrackingUsageDescription`,
     `SKAdNetworkItems`. `PrivacyInfo.xcprivacy` angelegt.

   **Noch offen (braucht AdMob-Konto / Xcode-Klick):**
   - [ ] AdMob-App + Rewarded-Ad-Unit anlegen → **echte IDs** in `js/constants.js`
     (`ADMOB.appId`, `ADMOB.rewardedUnitId`) **und** `Info.plist`
     (`GADApplicationIdentifier`) eintragen; `ADMOB.testing = false`.
   - [ ] `SKAdNetworkItems` mit der **aktuellen vollständigen Google-Liste**
     ersetzen (developers.google.com/admob/ios/3p-skadnetwork-ids).
   - [ ] `PrivacyInfo.xcprivacy` in Xcode dem **App-Target hinzufügen**
     (Copy Bundle Resources) + `NSPrivacyTrackingDomains` füllen, falls
     personalisierte Werbung.
   - [ ] Auf Gerät testen: Consent-Dialog + ATT erscheinen, Test-Rewarded läuft,
     Belohnung wird gebucht (Premium-Nutzer sehen **nichts** davon).
3. **Privacy** — Datenschutz-URL, App-Privacy-Label in App Store Connect,
   ATT-Begründungstext.
4. **Native Politur (Guideline 4.2)** — Launch-Screen, Haptik, Safe-Areas
   (Web-Seite hat sie schon), Status-Bar-Styling.
5. **Store-Assets/Metadaten** — Icon 1024², Screenshots (6.9"/6.7" iPhone),
   Beschreibung, Keywords, Kategorie, Altersfreigabe **4+ (keine Kids-Kategorie)**.
6. **TestFlight → Review → Launch.**

## Strategie-Entscheidungen (fix)

- **Werbung:** AdMob beibehalten (Rewarded Video).
- **Altersfreigabe:** 4+, **nicht** in der Kids-Kategorie.
