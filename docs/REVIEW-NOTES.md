# App Review Notes — Kittysort: Cat Companions

Fertiger Text für das Feld **„Notizen für den Prüfer / App Review Information →
Notes”** in App Store Connect. Hilft dem Apple-Reviewer, das differenzierende
Begleiter-Feature, Werbung + In-App-Kauf korrekt einzuordnen → weniger Rückfragen /
Ablehnungen.

Kein Demo-Account nötig (kein Login, Spielstand nur lokal).

---

## 🇩🇪 Deutsch

```
Kittysort: Katzen-Begleiter ist ein gemütliches Katzen-Sammelspiel mit
Puzzle-Einlagen. Kein Benutzerkonto, keine Anmeldung — der Spielstand wird
ausschließlich lokal auf dem Gerät gespeichert. Die App ist vollständig
offline spielbar.

BEGLEITER-KATZEN (differenzierendes Gameplay-Feature):
Das zentrale Alleinstellungsmerkmal ist das Begleiter-Katzen-System:
34 Katzen können gesammelt und als Begleiter mit ins Level genommen werden.
Jede Katze hat eine von drei Helfer-Fähigkeiten (🧺 Nickerchen-Korb: extra
leerer Korb, 🐾 Pfoten-Trick: ein regelfreier Zug, 🧲 Magnet-Schnurren: zieht
eine Farbe zusammen). Die Fähigkeit ist KOSTENLOS einmal pro Level nutzbar —
keine Spielwährung nötig. Wer die Fähigkeit nutzt, erhält höchstens 2 von 3
Sternen (Skill bleibt belohnt).

So kommt der Prüfer zum Feature:
1. Level 1 abschließen.
2. Direkt danach wird Begleiter-Katze „Whisker” (Fähigkeit: Magnet) freigeschaltet
   und automatisch als aktiver Begleiter gesetzt.
3. Ab Level 2 erscheint der Katzen-Button im unteren HUD (rechts).
4. Button antippen → Fähigkeit auswählen → kostenlos einsetzen.

WERBUNG (AdMob):
- Es gibt ausschließlich FREIWILLIGE Rewarded-Videos (z. B. „Video ansehen
  für +1 Leben / +5 Züge”). Werbung wird nie erzwungen, um weiterzuspielen.
- Gelegentlich erscheint ein Interstitial zwischen Leveln.
- Beim ersten Start zeigt iOS den App-Tracking-Transparency-Dialog (ATT)
  sowie ggf. einen Consent-Dialog (UMP/DSGVO). Beides ist gewollt.

IN-APP-KAUF (StoreKit 2):
- Ein einmaliger, nicht-verbrauchbarer Kauf „Kittysort Club Lifetime”
  (Produkt-ID: de.kittysort.app.lifetime, 2,99 €) schaltet werbefrei,
  unbegrenzte Leben/Hinweise und Saison-Inhalte frei. Kein Abo.
- „Käufe wiederherstellen” ist auf dem Kauf-Bildschirm (Paywall) vorhanden.
- Der Kauf lässt sich im Sandbox-Account vollständig testen.

So zum Kauf gelangen: Hauptmenü → Krone/„Club”-Symbol (oder ein Premium-
Hinweis im Spiel) öffnet die Paywall mit Preis, Funktionsliste,
„Wiederherstellen” sowie Links zu Datenschutz und Nutzungsbedingungen.

Kontakt bei Fragen: info@codingbrothers.de
```

---

## 🇬🇧 English

```
Kittysort: Cat Companions is a cozy cat-collecting puzzle game. No user
account, no sign-in — progress is stored locally on the device only. The app
is fully playable offline.

COMPANION CATS (differentiating gameplay feature):
The core distinguishing feature is the Companion Cat system: 34 cats can be
collected and brought into any level as a companion. Each cat has one of three
helper abilities (🧺 Nap Basket: extra empty basket, 🐾 Paw Trick: one move
that ignores the color rule, 🧲 Magnet Purr: pulls one color together). The
ability is FREE to use — once per level, no in-game currency required. Using
the ability caps that level's rating at 2 stars (skill is still rewarded).

How to reach the feature:
1. Complete level 1.
2. Companion cat “Whisker” (ability: magnet) is immediately unlocked and
   automatically set as your active companion.
3. From level 2 onwards, a cat button appears in the bottom HUD (right side).
4. Tap the button → choose her ability → it's free, once per level.

ADVERTISING (AdMob):
- Only OPTIONAL rewarded videos exist (e.g. “watch a video for +1 life /
  +5 moves”). Ads are never forced in order to continue playing.
- An occasional interstitial may appear between levels.
- On first launch iOS shows the App Tracking Transparency (ATT) prompt and,
  where applicable, a consent dialog (UMP/GDPR). Both are intended.

IN-APP PURCHASE (StoreKit 2):
- A single non-consumable purchase “Kittysort Club Lifetime”
  (product id: de.kittysort.app.lifetime, EUR 2.99) removes ads and unlocks
  unlimited lives/hints and season content. Not a subscription.
- “Restore Purchases” is available on the purchase screen (paywall).
- The purchase can be fully tested with a sandbox account.

How to reach the purchase: Main menu → crown/”Club” icon (or an in-game
premium prompt) opens the paywall showing price, feature list, “Restore”,
and links to Privacy Policy and Terms of Use.

Contact: info@codingbrothers.de
```

---

## ⚠️ Vor dem Einreichen prüfen
- Produkt-ID `de.kittysort.app.lifetime` stimmt mit dem in ASC angelegten IAP überein.
- IAP-Status „Bereit zur Übermittlung“ und der Version 1.0 zur Review angehängt.
- Sandbox-Kauf + Restore einmal selbst getestet.
