# TestFlight → App Review — Checkliste

Phase 6. Archive, Upload und Review erfordern den Apple-Developer-Account und
interaktive Schritte in Xcode + App Store Connect (ASC) — können nicht
automatisiert werden. Diese Liste führt durch alles.

## ✅ Bereits erledigt (Code/Projekt)
- Signing: `DEVELOPMENT_TEAM = WRQVS25R62`, `CODE_SIGN_STYLE = Automatic`.
- Version `1.0`, Build `1` (`MARKETING_VERSION` / `CURRENT_PROJECT_VERSION`).
- Bundle ID `de.codingbrothers.kittysort`, Deployment Target iOS 15.0.
  (Alt `de.kittysort.app` war global blockiert → gewechselt 2026-06-24.)
- App-Icon 1024² (kein Alpha), Launch-Screen, Status-Bar, Haptik.
- **Export-Compliance**: `ITSAppUsesNonExemptEncryption = false` → kein Prompt.
- Release-Build kompiliert sauber (geprüft 2026-06-23).
- Datenschutz-URL live: https://www.kittysort.de/datenschutz.html

## ⚠️ Vor dem Archive unbedingt erledigen
1. **`PrivacyInfo.xcprivacy` ans App-Target hängen** (liegt in `ios/App/App/`,
   ist aber evtl. noch nicht im Target): Xcode → Datei auswählen → File Inspector
   → Target Membership „App" anhaken. Ohne das fehlt das Privacy-Manifest.
2. **Echte AdMob-IDs** (falls schon vorhanden): `ADMOB.appId` + `rewardedUnitId`
   in `js/constants.js`, `GADApplicationIdentifier` in `Info.plist`,
   `ADMOB.testing = false`, dann `npm run cap:sync`.
   → Für **internes** TestFlight reichen die Test-IDs (App startet, Test-Ads).
     Für **öffentliche** Review echte IDs einsetzen.
   ⚠️ `GADApplicationIdentifier` darf nie leer/ungültig sein — sonst **Crash beim
     Start**. Die aktuelle Test-App-ID ist gültig.
3. **`npm run cap:sync`** ausführen, damit `www/` aktuell im Bundle liegt.

## App Store Connect — App anlegen
1. ASC → Apps → **+** → Neue App: Plattform iOS, Name **Kittysort: Color Drop**
   (reines „Kittysort" ist im Store vergeben), Primärsprache **Deutsch**,
   Bundle ID `de.codingbrothers.kittysort`, SKU frei wählbar.
   ✅ Erledigt 2026-06-24 — App-Record angelegt, erster Build hochgeladen.
2. **In-App-Kauf** anlegen: Non-Consumable, Produkt-ID `de.kittysort.app.lifetime`,
   Preis 2,99 €, Anzeigename + Beschreibung. (Muss mit dem ersten Build zur
   Review eingereicht werden.)
3. **App-Datenschutz**: Labels nach `docs/PRIVACY-LABELS.md` setzen
   (Tracking: Ja; Standort/IDFA/Nutzungsdaten via AdMob). Datenschutz-URL eintragen.
4. **Altersfreigabe**: Fragebogen → Ergebnis **4+** (keine Kids-Kategorie).
5. Metadaten aus `docs/STORE-LISTING.md`, Screenshots aus `store-assets/` /
   `docs/STORE-SCREENSHOTS.md`.

## Xcode — Archive & Upload
1. Schema **App**, Ziel **„Any iOS Device (arm64)"** (nicht Simulator!).
2. Falls Signing meckert: Signing & Capabilities → Team `WRQVS25R62`, „Automatically
   manage signing" an. Bundle ID muss im Developer-Portal existieren (legt Xcode
   automatisch an).
3. **Product → Archive** (baut Release).
4. Organizer → **Distribute App → App Store Connect → Upload**.
5. Export-Compliance-Frage entfällt (Info.plist-Key gesetzt).
6. Verarbeitung in ASC abwarten (~5–30 min).

## TestFlight
1. ASC → TestFlight → Build erscheint nach Verarbeitung.
2. **Test Information** ausfüllen: Beta-Beschreibung, Feedback-E-Mail
   (info@codingbrothers.de), „Was ist zu testen".
3. **Interne Tester** (eigenes Team, bis 100) → sofort testbar, keine Review.
4. **Externe Tester** (bis 10.000) → erfordern eine kurze Beta-App-Review.
5. Für die Ad-/Kauf-Tests: Sandbox-Apple-ID nutzen; Test-Rewarded läuft auch
   ohne echte AdMob-IDs.

## Danach: Einreichung zur Store-Review
1. Build der App-Version zuweisen, IAP mit einreichen.
2. **App Review Notes**: Hinweis, dass Rewarded-Ads freiwillig sind und der
   einmalige IAP werbefrei schaltet; Demo-Hinweise falls nötig.
3. Submit for Review.

## Folge-Uploads
Jeder neue Build braucht eine **höhere Build-Nummer** →
`CURRENT_PROJECT_VERSION` hochzählen (1 → 2 → …); `MARKETING_VERSION` nur bei
echten Versionssprüngen ändern.
