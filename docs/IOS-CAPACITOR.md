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
   - [x] Im Simulator getestet (2026-06-23, iPhone 17): ATT-Dialog erscheint beim
     Launch mit korrektem Text, Test-Rewarded läuft, Belohnung wird gebucht.
     UMP-Consent nur in EEA-Region (Simulator = NOT_REQUIRED → übersprungen).
3. **Privacy** ✅ — `datenschutz.html` + `impressum.html` (im www-Bundle, im
   Einstellungs-Screen verlinkt), Privacy-Label-Checkliste in
   `docs/PRIVACY-LABELS.md`, ATT-Text in Info.plist.
   - [x] Deployed (2026-06-23, Vercel prod): https://www.kittysort.de/datenschutz.html
     + /impressum.html (beide HTTP 200, im Einstellungs-Screen verlinkt).
   - [ ] App-Privacy-Labels in App Store Connect setzen (siehe Doku).
4. **Native Politur (Guideline 4.2)** ✅ (Simulator getestet 2026-06-23):
   - **Status-Bar**: dunkler Text auf hellem BG (`js/native-ui.js`,
     `StatusBar.setStyle LIGHT` beim nativen Launch) — verifiziert.
   - **Launch-Screen**: Hintergrund auf App-Beige `#fdf6ec` (statt Weiß →
     kein Flash), `LaunchScreen.storyboard`.
   - **Haptik**: dezentes Feedback zentral an `playSound` (`js/native-haptics.js`):
     LIGHT bei select/tap/drop/click, SUCCESS bei win/solved, WARNING bei invalid.
     Nur auf echtem Gerät spürbar (Simulator = No-op).
   - **Safe-Areas**: im Web bereits via `env(safe-area-inset-*)` (base/panels.css).
5. **Store-Assets/Metadaten** — größtenteils fertig:
   - **Icon 1024²** ✅ — `AppIcon-512@2x.png` (1024×1024, kein Alpha, valide).
   - **Texte** ✅ — `docs/STORE-LISTING.md` (DE+EN: Name, Untertitel, Keywords,
     Beschreibung, Kategorie Puzzle, 4+).
   - **Screenshots** — 2 von 6.9" aufgenommen (`store-assets/screenshots/`,
     1320×2868), Leitfaden + Restliste in `docs/STORE-SCREENSHOTS.md`.
   - [ ] Finalen Screenshot-Satz (5–6) beim echten Spielen aufnehmen.
   - [ ] Metadaten in App Store Connect eintragen.
6. **TestFlight → Review → Launch** — Projekt archive-ready (Signing-Team
   gesetzt, Release-Build grün, Export-Compliance `ITSAppUsesNonExemptEncryption
   = false`). Vollständige Schritt-für-Schritt-Anleitung: `docs/TESTFLIGHT.md`.
   - [ ] `PrivacyInfo.xcprivacy` in Xcode ans App-Target hängen.
   - [ ] App-Record + IAP in App Store Connect anlegen.
   - [ ] Archive (Any iOS Device) → Upload → TestFlight.

## Strategie-Entscheidungen (fix)

- **Werbung:** AdMob beibehalten (Rewarded Video).
- **Altersfreigabe:** 4+, **nicht** in der Kids-Kategorie.
