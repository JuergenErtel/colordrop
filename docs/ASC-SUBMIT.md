# App Store Connect — Einreichungs-Anleitung (Kittysort: Color Drop)

Klick-für-Klick bis „Submit for Review". Alle Texte/Antworten liegen fertig in:
`STORE-LISTING.md` · `PRIVACY-LABELS.md` · `REVIEW-NOTES.md`. Screenshots in
`store-assets/screenshots/`.

**Login:** https://appstoreconnect.apple.com → mit Apple-ID des Teams
„Coding Brothers UG" anmelden.

> ⚠️ **Wenn noch ein weiterer Build kommt (Build 7):** Teile **A–E** kannst du
> JETZT schon ausfüllen (bleiben über Builds hinweg erhalten). Nur **F (Build
> zuweisen)** und **G (Submit)** ganz zum Schluss mit dem FINALEN Build machen.

---

## Stand (schon erledigt)
- App-Record angelegt: **Kittysort: Color Drop**, Bundle `de.codingbrothers.kittysort`
- In-App-Kauf angelegt: `de.kittysort.app.lifetime`, 2,99 €, „Bereit zur Übermittlung"
- **Build 6 hochgeladen** (verarbeitet ggf. noch ~5–30 Min in TestFlight)
- Datenschutz-URL live: https://kittysort.de/datenschutz.html

---

## A) Version 1.0 — Metadaten
ASC → **Apps → Kittysort: Color Drop**. Links die Version **„1.0 Vorbereitung"** wählen.

1. **Sprachen:** Primär **Deutsch**. (Englisch optional über „+ Sprache".)
2. **Screenshots → iPhone 6.9"**: die PNGs aus `store-assets/screenshots/` hochziehen
   (Reihenfolge = Anzeige): `sc-01-splash`, `sc-02-menu`, `sc-03-gameplay`,
   `sc-04-club`. (5.–6. Bild später beim echten Spielen nachreichen — optional.)
3. **Werbetext / Beschreibung / Keywords / Untertitel:** aus `STORE-LISTING.md`
   kopieren (DE-Block; EN-Block in die EN-Lokalisierung).
4. **Support-URL:** `https://www.kittysort.de` — **Marketing-URL** (optional): dito.
5. **Allgemein (rechts/unten):**
   - **Kategorie:** Primär **Spiele → Puzzle**, Sekundär **Gelegenheitsspiele**
   - **Copyright:** z. B. `2026 Coding Brothers UG`
6. **Versionsfreigabe** (unten): „Manuell freigeben" empfohlen (du entscheidest,
   wann sie nach Genehmigung live geht).

---

## B) App-Datenschutz (Privacy Labels)
Links **„App-Datenschutz" → Bearbeiten**. Antworten **exakt** nach der
Klick-für-Klick-Tabelle in `PRIVACY-LABELS.md`:
- Erfasst Daten? **Ja**
- Datentypen: Standort (ungefähr), Geräte-ID, Produktinteraktion, Werbedaten →
  je **Tracking: Ja**, **Mit Identität verknüpft: Nein**
- Diagnose (Absturz-/Leistungsdaten) → **Tracking: Nein**
- Datenschutz-URL eintragen: `https://kittysort.de/datenschutz.html`

---

## C) Altersfreigabe
Links **„Altersfreigabe" → Bearbeiten** → Fragebogen alles **„Keine/Nein"** →
Ergebnis **4+**. Speichern.

---

## D) In-App-Kauf prüfen
Links **„In-App-Käufe"** → `Kittysort Club Lifetime` (`de.kittysort.app.lifetime`):
- Status **„Bereit zur Übermittlung"**
- **Review-Screenshot** hinterlegt? Falls leer: `store-assets/iap-review-1242x2208.png` hochladen
- Anzeigename + Beschreibung gesetzt, Preis **2,99 €**

---

## E) Preisgestaltung
Links **„Preise und Verfügbarkeit"**: **Gratis** (Kostenlos). Verfügbarkeit: alle
Länder (oder nach Wunsch). Der IAP-Preis (2,99 €) ist separat im IAP gesetzt.

---

## F) Build zuweisen
In der Version **„1.0 Vorbereitung"** → Abschnitt **„Build"** → **„+ Build
auswählen"** → **Build 6** (bzw. finalen Build) wählen.
- Export-Compliance-Frage entfällt (Info.plist-Key gesetzt).
- **In-App-Kauf anhängen:** im Build-/Version-Bereich den IAP zur Einreichung
  hinzufügen (sonst wird er NICHT mitgeprüft).

---

## G) App-Review-Infos + Einreichen
1. Abschnitt **„App-Review-Informationen"**:
   - Kontakt: Vorname/Nachname, **info@codingbrothers.de**, Telefon
   - **Anmeldedaten erforderlich? Nein** (kein Login in der App)
   - **Notizen:** Text aus `REVIEW-NOTES.md` (DE oder EN) einfügen
2. Oben rechts **„Zur Überprüfung hinzufügen" / „Speichern"** → dann **„Senden" /
   „Submit for Review"**.

Danach: Status **„Warten auf Überprüfung"** → Apple prüft (i. d. R. 1–3 Tage).

---

## Vorher empfohlen (nicht Pflicht)
- **TestFlight-Sandbox-Test:** Build 6 intern freigeben, IAP-Kauf **und**
  „Wiederherstellen" mit einem Sandbox-Account einmal durchspielen.
- Sandbox-Tester anlegen: ASC → **Benutzer und Zugriff → Sandbox → Tester**.
  Am iPhone: Einstellungen → App Store → Sandbox-Account (ganz unten).
