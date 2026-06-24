# Interstitial-Werbung (Variante B) — Design

**Datum:** 2026-06-24
**Status:** freigegeben (Design), wartet auf Spec-Review

## Ziel

Echte native AdMob-Interstitial-Werbung zwischen Levels für Nicht-Premium-Spieler.
Ersetzt den nicht funktionalen Platzhalter-Schirm (`adOverlay`), der „WERBUNG"
anzeigt, aber keine Werbung lädt.

**Variante B:** Erst der Belohnungs-/Gewinn-Bildschirm (Sterne), dann beim Tippen
auf „Weiter → (nächstes Level)" die Vollbild-Werbung, danach das nächste Level.

## Nicht-Ziele (YAGNI)

- Keine echten AdMob-IDs (Test-IDs bis zum Launch; `ADMOB.testing` bleibt true).
- Keine Werbung beim „Menü"-Tippen, nur beim Vorrücken ins nächste Level.
- Keine Änderung der Anzeige-Frequenz (`shouldShowAd()` bleibt wie ist).
- Kein Interstitial im Web/Preview-Build (nur nativ).

## Architektur

Geteilter AdMob-Init in ein neues Modul auslagern, damit Consent/ATT/SDK-Init
nur **einmal** läuft (nicht je Ad-Typ erneut).

### Neue/geänderte Dateien

- **`js/constants.js`** — `ADMOB.interstitialUnitId` ergänzen:
  `'ca-app-pub-3940256099942544/4411468910'` (offizielle iOS-Test-Interstitial-Unit).

- **`js/native-ads.js`** (neu) — geteilte Basis, aus `native-rewarded.js` extrahiert:
  - `getAdMob()` — Plugin-Handle oder null (nur native Plattform).
  - `ensureInit(AdMob)` — dedupliziert Consent (UMP) → ATT → `initialize()`,
    liefert `{ canRequestAds }`.
  - `initNativeAds()` — best-effort Warm-up beim App-Start.

- **`js/native-rewarded.js`** — nutzt künftig `native-ads.js` für Init
  (Logik unverändert, nur Init-Teil importiert statt dupliziert).

- **`js/native-interstitial.js`** (neu):
  - `prepareInterstitial()` — lädt im Voraus (best-effort), setzt internen
    `ready`-Status. No-op ohne Native/Consent.
  - `showInterstitialIfReady()` — wenn bereit: `showInterstitial()` aufrufen,
    Abschluss über Events `interstitialAdDismissed` / `interstitialAdFailedToShow`
    + Timeout-Sicherheitsnetz (kein Hängen), danach nächstes Interstitial
    vorladen; **Promise resolved erst, wenn die Ad geschlossen ist**.
    Wenn nicht bereit: sofort `false` zurück (Spieler nicht blockieren).

- **`js/main.js`**:
  - Win-Flow auf Variante B: den `adOverlay`-Trigger (aktuell ~Zeile 1206–1220)
    entfernen. Stattdessen bei `shouldShowAd()` nur ein Flag setzen
    (`G.adDueOnAdvance = true`) und den **normalen** Gewinn-Bildschirm zeigen.
  - `nextLevelBtn`-Handler: wenn `G.adDueOnAdvance` → Flag löschen, `markAdShown()`,
    `await showInterstitialIfReady()`, dann wie bisher ins nächste Level. Wenn
    kein Ad gezeigt wurde (nicht bereit), trotzdem normal weiter.
  - Beim App-Start zusätzlich zu `initNativeAds()` ein erstes
    `prepareInterstitial()` auslösen.

### Plugin-API (verifiziert, @capacitor-community/admob 8.0.0)

- `prepareInterstitial(options)` → lädt; `showInterstitial(): Promise<void>`.
- Events: `interstitialAdLoaded`, `interstitialAdFailedToLoad`,
  `interstitialAdShowed`, `interstitialAdFailedToShow`, `interstitialAdDismissed`.

## Datenfluss

```
Level gelöst
  → shouldShowAd()? ──ja──► G.adDueOnAdvance = true
  → normaler Gewinn-Bildschirm (Sterne) anzeigen
"Weiter →" getippt
  → adDueOnAdvance && Interstitial ready?
        ja → markAdShown(); showInterstitial(); warte auf Dismissed/Fail/Timeout
             → prepareInterstitial() (nächste vorladen)
        nein → direkt weiter
  → generateLevel(LEVEL.current + 1)
```

## Fehlerbehandlung (Spieler nie blockieren)

| Fall | Verhalten |
|---|---|
| Kein Native (Web/Preview) | Werbung überspringen, weiter |
| Consent verweigert (`canRequestAds=false`) | überspringen, weiter |
| Kein Fill / nicht vorgeladen | überspringen, weiter |
| `showInterstitial` resolved nicht | Timeout-Netz → weiter |
| Premium | `shouldShowAd()` → false, gar kein Flag |

## Verifikation

- **Mock-Test** (Node, wie beim Rewarded-Fix): Event-Settlement von
  `showInterstitialIfReady()` — Szenarien: dismissed→true, failed→false,
  show-hängt+dismissed→true, nicht-bereit→false(sofort).
- **Syntax-Check** aller geänderten JS-Dateien.
- **Browser-Smoke** (Preview-Pfad): Win → „Weiter" rückt normal vor, kein
  Platzhalter-Schirm, keine Blockade.
- **Echt-Test auf dem Gerät** im nächsten TestFlight-Build (native Test-Ads).

## Offene Punkte / Risiken

- Alter `adOverlay`-HTML-Block + `adSkipBtn`/`adPremiumBtn`-Handler werden
  ungenutzt; vorerst liegen lassen (schadet nicht), später aufräumen.
- Reihenfolge ATT/Consent beim allerersten Interstitial: durch geteilten
  `ensureInit` abgedeckt (dedupe mit Rewarded).
