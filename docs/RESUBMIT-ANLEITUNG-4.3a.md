# Kittysort — 1:1-Anleitung für den 4.3(a)-Resubmit

Stand: 2026-06-28 · Build 13 hochgeladen · App Apple-ID **6783642547** ·
IAP `de.kittysort.app.lifetime` (Apple-ID **6783979860**)

Reihenfolge strikt von oben nach unten abarbeiten. Quelle der Texte:
`docs/STORE-LISTING-v2.md` (Metadaten) + `docs/REVIEW-REPLY-4.3a.md` (Reviewer-Antwort).

---

## PHASE 0 — Voraussetzungen (vor ASC)

1. **Build 13 verarbeitet?** ASC → Meine Apps → Kittysort → TestFlight.
   Warten bis Build 13 nicht mehr „Wird verarbeitet" zeigt (5–30 Min).
2. **Build 13 auf dem iPhone testen** (TestFlight):
   - In der App: **Einstellungen → Spielstand zurücksetzen** (sonst greift der
     neue langsame Katzen-Drip nicht — alte Katzen bleiben sonst freigeschaltet).
   - Level 1 lösen → Begleiter „Whisker" wird freigeschaltet + Fähigkeit wird erklärt.
   - Ab Level 2: Katzen-Button **oben in der Leiste** → Fähigkeit einsetzen (gratis, 1×/Level).
   - IAP testen: Paywall öffnen → „Für immer freischalten 2,99€" → Sandbox-Kauf.
3. **Screenshots neu aufnehmen** (Pflicht, siehe Phase 3) — am besten direkt
   während des TestFlight-Tests auf dem iPhone.

---

## PHASE 1 — Metadaten v2 eintragen (ASC → Vertrieb → Version 1.0)

ASC → Meine Apps → Kittysort → **Vertrieb** → Version „1.0".
Für **Deutsch** und **Englisch (USA)** jeweils (Sprache oben rechts umschalten):

| Feld | Deutsch | Englisch |
|---|---|---|
| **Name** (≤30) | `Kittysort: Katzen-Begleiter` | `Kittysort: Cat Companions` |
| **Untertitel** (≤30) | `Sammle Katzen, knacke Puzzles` | `Collect cats, crack puzzles` |
| **Keywords** (≤100) | `katzen,puzzle,sammeln,begleiter,kätzchen,denkspiel,entspannen,logik,knobeln,offline,räume,zen,hund` | `cats,puzzle,collect,companion,kitten,brain,relax,logic,offline,zen,casual,pets,decorate,cozy,daily` |
| **Werbetext** (≤170) | siehe `STORE-LISTING-v2.md` → „Werbetext" | siehe „Promotional Text" |
| **Beschreibung** (≤4000) | siehe `STORE-LISTING-v2.md` → „Beschreibung" DE | „Description" EN |

> Werbetext + Beschreibung sind lang → 1:1 aus `docs/STORE-LISTING-v2.md` kopieren.
> Wichtig: KEIN „sort/solve/löse/Color Drop/water sort" mehr — das war der 4.3a-Auslöser.

**Speichern** (oben rechts).

---

## PHASE 2 — Screenshots hochladen (Pflicht für 4.3a)

Gleiche Versionsseite → Abschnitt „App-Vorschauen und Screenshots".
Mindestens **6,9"-iPhone** (Pflicht) + **iPad 13"** (da universal).

| # | Pflichtinhalt |
|---|---|
| **1** | Companion-Fähigkeit in Aktion: Katzen-Button **oben** gedrückt, Fähigkeits-Overlay sichtbar |
| **2** | 34-Katzen-Album geöffnet (mehrere Katzen + Fähigkeits-Icons) |
| **3+** | Spielfeld / Modi-Auswahl / Raumdekoration |

> Screenshots 1 + 2 MÜSSEN die Begleiter-Katzen zeigen — sonst ist die
> Differenzierung auf der Produktseite unsichtbar. KEINE Apple-Emoji, kein „SORT".
> (Fertige Vorlagen liegen in `store-assets/screenshots/new/` — ggf. neu mit
> Build 13 aufnehmen, damit der Button oben sichtbar ist.)

---

## PHASE 3 — Altersfreigabe (ENTSCHEIDUNG nötig)

Versionsseite → „Altersfreigabe" → Bearbeiten.
- **Aktuell geplant:** 4+.
- **Audit-Empfehlung:** 9+ oder 12+, weil die App Werbung zeigt. 4+ + Werbung/
  Tracking kann erneut auffallen. Tracking ist zwar aus (NSPrivacyTracking=false)
  und Ads laufen G-rated — 4+ ist damit vertretbar, 9+ ist die sichere Variante.
- **Empfehlung:** auf Nummer sicher → **9+** wählen (oder 4+ bewusst beibehalten).

---

## PHASE 4 — Build 13 zuweisen

Versionsseite → Abschnitt „Build" → „+" / „Build auswählen" → **Build 13** wählen.
(Erscheint erst, wenn Phase 0/1 = verarbeitet.)

---

## PHASE 5 — IAP prüfen

ASC → Monetarisierung → In-App-Käufe → `de.kittysort.app.lifetime`:
1. **Bild (optional):** Falls noch ein Paywall-Screenshot hinterlegt ist → entfernen
   ODER `store-assets/iap-promo-1024-clean.png` hochladen (kein Preis/Button/Screenshot).
2. **Status:** Muss „Bereit zur Übermittlung" sein. Steht er auf
   „Entwickleraktion erforderlich" → auf der IAP-Seite **„Zur Prüfung übermitteln"**.
   (Der erste IAP wird mit der Version automatisch mitgeprüft — er erscheint
   NICHT als zweites Element in der Einreichung.)

---

## PHASE 6 — Reviewer-Antwort senden (Resolution Center)

Das ist der Kern des 4.3a-Resubmits.
ASC → die **abgelehnte Einreichung** öffnen (Einreichungs-Detailseite,
`reviewsubmissions/details/242b4807-…`) → **„Nachrichten" → „Auf App-Prüfung antworten"**.
→ Den **englischen** Text aus `docs/REVIEW-REPLY-4.3a.md` (Abschnitt „English (paste this)")
**1:1 einfügen** und senden.

> Der Text erklärt: erste App des Accounts (kein Klon-Cluster), eigener
> Vanilla-JS-Code, neues Begleiter-Feature, Schritt-für-Schritt-Walkthrough
> (Button **oben**, gratis 1×/Level). Reviewer-Notiz braucht keinen Sandbox-Account
> für den IAP — die Companion-Fähigkeit ist ohne Kauf zugänglich.

---

## PHASE 7 — Erneut zur Prüfung übermitteln

Versionsseite → „Prüfung aktualisieren" / auf der Einreichungs-Detailseite wird
**„Erneut zur App-Prüfung übermitteln"** blau → klicken.
→ Version geht auf „Warten auf Prüfung". Veröffentlichung: „automatisch nach Genehmigung"
(oder manuell, je nach Wunsch).

---

## NACH der Freigabe

- `js/constants.js`: `APP_STORE_LIVE = false → true`
- Service-Worker-Cache-Version bumpen
- `vercel --prod` (Projekt `colordrop`) → Web zeigt dann Store-Badge/Link.

---

## Checkliste (kurz)

- [ ] Build 13 verarbeitet + auf iPhone getestet (Spielstand zurückgesetzt)
- [ ] Screenshots 1–2 zeigen Begleiter-Katzen (Button oben)
- [ ] Metadaten DE+EN aus STORE-LISTING-v2.md eingetragen + gespeichert
- [ ] Altersfreigabe-Entscheidung getroffen (4+ vs 9+)
- [ ] Build 13 der Version zugewiesen
- [ ] IAP-Bild clean + Status „Bereit zur Übermittlung"
- [ ] Reviewer-Reply (EN) im Resolution Center gesendet
- [ ] „Erneut zur App-Prüfung übermitteln" geklickt
