# Kittysort Premium-Overhaul — Design-Spec

**Datum:** 2026-04-23
**Status:** Approved (Juergen, 2026-04-23)

---

## 0. Ziel

Kittysort von einem einmaligen 4,99€-Kauf zu einem **wiederkehrenden Abo-Produkt** umbauen. Alle neuen Features werden in dieser Iteration vollständig client-seitig umgesetzt. Payment-Integration (Stripe) wird vorbereitet, bleibt aber im `preview`-Modus bis zur Firmengründung in ~2 Wochen. Umschalten dann per Konstante in `constants.js` — keine Code-Änderung nötig.

---

## 1. Architektur-Prinzip — Launch-Switch

### 1.1 Billing-Abstraktion

Neues Modul `js/billing.js` als **einziger Einstiegspunkt** für Kauf-Aktionen. Zentrale Konstante `BILLING_MODE` in `constants.js`:

```js
export const BILLING_MODE = 'preview';   // 'preview' | 'stripe' | 'native'

export const STRIPE_LINKS = {
  monthly:  '',    // 'https://buy.stripe.com/xxx'  (leer solange preview)
  yearly:   '',
  lifetime: '',
};
```

**Modi:**

| Modus | Verhalten |
|---|---|
| `preview` | Kauf-Klick zeigt "Preview — Premium gratis aktivieren" Bestätigung, setzt Status sofort, volle Celebration |
| `stripe` | Redirect zu Stripe Payment Link. Return-URL `kittysort.de/?success=1&tier=monthly` setzt Status via localStorage |
| `native` | Platzhalter für iOS/Android IAP, throws NotImplementedError (später) |

### 1.2 Storage-Schema

**Neu:**
- `catsort_subscription` — Subscription-Status (siehe 3.3)
- `catsort_season` — Saison-Progress (XP, Tier, Claimed-Rewards)
- `catsort_lives` — Lives-Zustand (count, lastRegen)
- `catsort_leaderboard_id` — Anonyme Profil-ID
- `catsort_paywall_state` — Welche Paywalls schon gezeigt (FOMO-Drip)

**Alt (bleibt kompatibel):**
- `catsort_premium: true` → einmalige Migration zu `catsort_subscription.tier = 'founder'` (Lifetime)
- Alle übrigen Keys unverändert

### 1.3 Migration

`js/storage.js` führt beim ersten Start nach Update eine einmalige Migration durch:
```js
function migrateToSubscriptionModel() {
  const legacy = localStorage.getItem('catsort_premium');
  if (legacy === 'true' && !localStorage.getItem('catsort_subscription')) {
    saveSubscription({
      tier:     'founder',
      since:    new Date().toISOString(),
      lifetime: true,
      active:   true,
    });
  }
}
```

Grandfathering: Alle bestehenden 4,99€-Käufer erhalten **Founder-Status** (Lifetime-Premium + silberner Founder-Badge auf Avatar).

---

## 2. Ökonomie-Rebalance

### 2.1 Reward-Änderungen (`js/constants.js`)

```js
export const REWARDS = {
  levelWin:     2,    // war 5
  threeStarWin: 5,    // war 10
  dailyWin:     15,   // war 25
  blitzWin:     3,    // unchanged
  rewardedAd:   20,   // unchanged
};
```

### 2.2 Hint-Kosten (skaliert nach Difficulty)

Neue Funktion `getHintCost(tier)` in `js/economy.js`:

```js
const HINT_COSTS = { EASY: 10, MEDIUM: 20, HARD: 35, EXPERT: 60, MASTER: 100 };
```

HUD-Hint-Button zeigt aktuellen Difficulty-basierten Preis.

### 2.3 Shop-Preise (`js/skins.js`)

| Item | Alt | Neu |
|---|---|---|
| Glitzer-Skin | 50 | 120 |
| Kristall-Skin | 80 | 200 |
| Goldfaden-Skin | 100 | 350 |
| Garten-BG | 100 | 250 |
| Dachterrasse-BG | 150 | 450 |
| Winter-BG | 200 | 650 |

### 2.4 Bones-Display

HUD-Bones-Counter bleibt unverändert. Premium-Multiplikator (2x) wirkt auf alle Bones-Einnahmen außer Rewarded-Ad (dort 1x).

---

## 3. Subscription-System

### 3.1 Tier-Definitionen (`js/billing.js`)

```js
export const TIERS = {
  monthly:  { price: '3,99€',   cycle: 'month',    label: 'Monatlich' },
  yearly:   { price: '29,99€',  cycle: 'year',     label: 'Jährlich',   highlight: '-37% RABATT' },
  lifetime: { price: '39,99€',  cycle: 'lifetime', label: 'Forever' },
};
```

### 3.2 Paywall-UI (`js/paywall.js`)

Neuer Fullscreen-Overlay `#paywallScreen`. Tab-loses Layout:

```
┌─────────────────────────────────────┐
│  🐾 KITTYSORT CLUB                  │
│  ───────────────────────────────    │
│                                     │
│  [Monatlich] [Jährlich★] [Forever]  │
│   3,99€       29,99€       39,99€   │
│   /Monat      (2,50/Mo)    einmalig │
│                -37% RABATT          │
│                                     │
│  ✓ Saison-Pass (monatlich neu)      │
│  ✓ Exklusive Saison-Katzen          │
│  ✓ Keine Werbung                    │
│  ✓ Unbegrenzte Hints & Undos        │
│  ✓ 2× Fischgräten                   │
│  ✓ Premium Avatar-Rahmen            │
│  ✓ Unbegrenzte Lives                │
│                                     │
│  [ 7 TAGE KOSTENLOS TESTEN ]        │
│                                     │
│  Zahlung später · AGB · Widerruf    │
└─────────────────────────────────────┘
```

Jährlich-Tier ist vor-ausgewählt (`active` class), sticht visuell heraus (Gold-Border + "BELIEBT"-Badge).

### 3.3 Subscription-Datensatz

```js
catsort_subscription = {
  tier:      'monthly' | 'yearly' | 'lifetime' | 'founder' | 'trial' | null,
  since:     ISO8601,
  trialEnd:  ISO8601 | null,
  expiresAt: ISO8601 | null,
  stripeCustomerId: null,
  active:    true,
};
```

**Active-Check (`isPremium()`):**
```js
export function isPremium() {
  const sub = loadSubscription();
  if (!sub || !sub.active) return false;
  if (sub.lifetime) return true;
  if (sub.expiresAt && new Date(sub.expiresAt) < new Date()) {
    sub.active = false;
    saveSubscription(sub);
    return false;
  }
  return true;
}
```

### 3.4 Trial-Flow

Klick auf "7 TAGE KOSTENLOS TESTEN" → `purchase('trial')`:
```js
{
  tier:      'trial',
  trialEnd:  now + 7 Tage,
  expiresAt: now + 7 Tage,
  active:    true,
}
```

Nach Trial-Ende automatisch `active: false`, Non-Premium-Status, Reminder-Banner: "Dein Trial ist vorbei — bleib im Club für 3,99€/Monat".

---

## 4. Season Pass — "Kittysort Club"

### 4.1 Saison-Grundlagen

- **Start/Ende:** 1. des Monats 00:00 → Ende des Monats 23:59
- **Tiers:** 50
- **XP-Quellen:**

| Aktion | XP |
|---|---|
| Level gelöst | 10 |
| 3-Sterne-Level | 20 (statt 10) |
| Daily Challenge | 50 |
| Weekly Challenge (1 Stufe) | 40 |
| Blitzrunde gewonnen | 30 |
| Mini-Game (Sortier-Regen, Mäusejagd, Strolch) | 40 |
| Achievement freigeschaltet | 100 |

- **XP pro Tier:** Tier 1 = 20 XP, dann +15 XP pro Tier (linear). Tier 50 = 755 XP. Gesamt = ~19.000 XP.
- **Realistischer Spieler:** 5 Level/Tag × 10 XP + 1 Daily × 50 XP = 100 XP/Tag × 30 Tage = 3.000 XP → Tier ~18-20 ohne Mini-Games. Aktiver Spieler mit Mini-Games erreicht Tier 40-50.

### 4.2 Tier-Rewards

**Free-Track** (alle 5 Tiers, 10 Rewards gesamt):
- Tier 5: 10 Bones
- Tier 10: 15 Bones
- Tier 15: **Saison-Common-Katze** (z.B. "Mochi-Sakura")
- Tier 20: 20 Bones
- Tier 25: 1 Free Hint
- Tier 30: 25 Bones
- Tier 35: 1 Free Undo-Refill
- Tier 40: 30 Bones
- Tier 45: 1 Rewarded-Ad-Skip-Token
- Tier 50: 50 Bones (Free-Track-Finale)

**Premium-Track** (jeder Tier, 50 Rewards gesamt):
- Tier 1-9: je 10 Bones
- Tier 10: **Saison-BG "Kirschblüte"**
- Tier 11-19: je 15 Bones
- Tier 20: **Saison-Ball-Skin "Sakura"**
- Tier 21-29: je 20 Bones + kleine Drops (Hint, Undo)
- Tier 30: **Premium-Saison-Katze 1 (z.B. "Sakura")**
- Tier 31-39: je 25 Bones
- Tier 40: **Premium-Saison-Katze 2 (z.B. "Tsubaki")**
- Tier 41-49: je 30 Bones
- Tier 50: **Premium-Saison-Katze 3 (z.B. "Hoshi") + Gold-Avatar-Rahmen "Hanami"**

Gesamt-Wert Premium-Track ≈ 1000 Bones + 3 Katzen + 1 BG + 1 Skin + 1 Rahmen.

### 4.3 Erste Saison — "Kirschblüte" (Mai 2026)

**Theme:** Japan, Frühling, Rosa/Weiß, fallende Blüten.

**Neue Katzen (3, prozedural gerendert in Stil von `cat-renderer.js`):**

| ID | Name | Rasse | Fact | Fell-Farbpalette |
|---|---|---|---|---|
| `sakura` | Sakura | Japanisch Bobtail | "Japanische Bobtails galten im Kaiserreich als Glücksbringer — ihre kurzen Schwänze sollen Dämonen fernhalten." | Cremeweiß mit rosa Akzenten |
| `tsubaki` | Tsubaki | Kurilian Bobtail | "Kurilian Bobtails sind natürliche Schwimmer und jagen Fische aus sibirischen Flüssen." | Weiß-rot gescheckt |
| `hoshi` | Hoshi | Japanisch Langhaar | "'Hoshi' bedeutet 'Stern' — diese Katzen haben oft sternförmige Markierungen auf der Stirn." | Dunkelgrau mit weißem Stern |

**Saison-Common-Katze (Free Tier 15):**
| `mochi-sakura` | Mochi-Sakura | Faltohr-Variante | Spezielle Sakura-Färbung der bestehenden Mochi | Cremeweiß mit rosa Blüten-Muster |

**Saison-BG "Kirschblüte":** Canvas-gezeichneter Kirschbaum vor Ginkaku-ji-Pagode, fallende Sakura-Blüten-Partikel, warmes Frühlingslicht.

**Saison-Ball-Skin "Sakura":** Weiße Bälle mit rosa Sakura-Blüten-Muster, leichtes Shimmering.

**Saison-Avatar-Rahmen "Hanami":** Gold-Border mit Sakura-Blüten-Ornamenten an den Ecken, animiertes Blüten-Treiben.

### 4.4 Saison-Skelett für Juni & Juli

Vollständige Code-Struktur, aber Content-Slots leer. Definiert in `js/season-content.js`:

```js
export const SEASONS = {
  '2026-05': { /* Kirschblüte — voll ausgearbeitet */ },
  '2026-06': { theme: 'Sommer-Strand', palette: ['#00B8D4','#FFD54F','#FFAB00'], /* TODO */ },
  '2026-07': { theme: 'Sternennacht',   palette: ['#1A237E','#9FA8DA','#FFF59D'], /* TODO */ },
};
```

### 4.5 Pass-Screen UI

Neuer Button im Hauptmenü: **"🎫 Season Pass"** mit Timer-Unterzeile "Saison endet in 14d 3h".

Pass-Screen (Fullscreen sheet-panel):

```
┌─────────────────────────────────────┐
│  🌸 KIRSCHBLÜTE                     │
│  Saison endet in 14 Tagen           │
│                                     │
│  XP: 340 / 19.000    TIER 12 / 50   │
│  [██████░░░░░░░░░░░░░░░░░░░░░░░]    │
│                                     │
│  TIER 10  [BG Kirschblüte] (claimed)│
│  TIER 11  [15 Bones]       (claimed)│
│  TIER 12  [15 Bones]       ◉ CLAIM  │
│  TIER 13  [🔒 Free only]  ○ locked  │
│  ...                                │
│                                     │
│  [DEIN KLUB-STATUS: FREE]           │
│  [ UPGRADE ZUM CLUB → ]             │
└─────────────────────────────────────┘
```

Horizontale Scroll-Liste durch 50 Tiers. Jeder Tier = 2 Zellen nebeneinander (Free + Premium). Premium-Zellen für Nicht-Abonnenten blurred mit Lock-Icon. Claim-Button erscheint sobald Tier erreicht + noch nicht eingesammelt.

### 4.6 Saison-Wechsel

Beim Monatswechsel:
1. Nicht-abgeholte Rewards aus alter Saison werden **komplett gutgeschrieben** (kein Wegfall als Fairness-Signal)
2. Neue Saison-State initialisiert mit XP 0, Tier 1
3. Show-Once-Overlay: "Neue Saison: [Theme]! Hier sind deine unabgeholten Belohnungen"

---

## 5. Lives-System (sanft)

### 5.1 Regeln

- **Max Lives:** 5
- **Regen-Rate:** 1 Leben / 20 Minuten
- **Scope:** NUR für Mini-Games (Sortier-Regen, Mäusejagd, Strolch-Level) + Blitzrunden. Standard-Puzzle unlimited.
- **Verbrauch:** 1 Leben bei Start eines Mini-Games/Blitz. Bei Fail zusätzlich 0 (nur Start zählt — keine Bestrafung für Versuch).
- **Bei 0 Lives:** Mini-Game-Start gesperrt, Overlay zeigt:
  - Countdown bis nächstes Leben
  - Button "Rewarded Ad schauen → +1 Leben"
  - Button "50 Bones → Full Refill"
  - Button "Club beitreten → unbegrenzt" (Paywall-Trigger)

### 5.2 Lives-Display

In HUD neben Bones-Counter: **🐾 5/5** (Pfoten-Icon). Bei Premium: **🐾 ∞**.

### 5.3 State

```js
catsort_lives = {
  count:      5,             // aktuell verfügbar
  lastRegen:  ISO8601,       // letzter Regen-Zeitpunkt
}
```

Regen-Berechnung beim App-Start und bei jedem Lives-Check:
```js
function checkRegen() {
  const { count, lastRegen } = loadLives();
  if (count >= MAX_LIVES) return;
  const elapsed = Date.now() - new Date(lastRegen).getTime();
  const regens  = Math.floor(elapsed / REGEN_MS);
  if (regens > 0) {
    const newCount = Math.min(MAX_LIVES, count + regens);
    const carryOver = elapsed - (regens * REGEN_MS);
    saveLives({
      count: newCount,
      lastRegen: new Date(Date.now() - carryOver).toISOString(),
    });
  }
}
```

---

## 6. Contextual Paywalls & Celebration

### 6.1 Trigger-Matrix

`js/paywall.js` exportiert `maybeShowPaywall(trigger)`:

| Trigger-ID | Bedingung | Häufigkeit |
|---|---|---|
| `level5` | Erstmals Level 5 gelöst | 1× |
| `level15` | Erstmals Level 15 gelöst | 1× |
| `hint3rd` | 3. bezahlter Hint in einer Session | 1× pro 72h |
| `streak7` | 7-Tage-Streak erreicht | 1× pro Streak-Milestone |
| `lives0` | Mini-Game-Start bei 0 Lives | max 1× pro Stunde |
| `seasonEnd3d` | Saison endet in 3 Tagen, nicht Premium | 1× pro Saison |

State-Tracking in `catsort_paywall_state = { shown: [trigger-ids], lastHint3rd: timestamp, ... }`

### 6.2 Celebration-Flow (nach Kauf)

Ersetzt `alert('Premium aktiviert!')` vollständig. 3-Sekunden-Timeline:

| Zeit | Aktion |
|---|---|
| 0 ms | Screen-Flash Gold (`.premium-flash` Overlay) |
| 100 ms | Konfetti-Burst aus Mitte (re-use `startConfetti`) |
| 300 ms | Krone-Icon fliegt von oben rein (CSS animation) |
| 600 ms | Saison-Katzen-Silhouetten flyn-in von rechts (gestaffelt 200ms) |
| 1800 ms | Text: "Willkommen im Club, [Leaderboard-Name]!" fade-in |
| 2000 ms | Bones-Counter zählt von 0 auf 500 (Welcome-Bonus, bereits gutgeschrieben) |
| 2500 ms | Avatar-Rahmen wird animiert angeheftet |
| 3000 ms | "Dein Saison-Pass wartet" CTA-Button erscheint |

Overlay geschlossen mit Button "Zum Season Pass" (führt direkt zum Pass-Screen) oder "Erst mal weiterspielen".

### 6.3 Welcome-Bonus

Bei jedem **neuen** Abo (nicht bei Trial):
- 500 Bones gutgeschrieben
- Alle Saison-Premium-Rewards bis zum aktuellen Tier sofort claimbar

---

## 7. Premium-Status-Signale

### 7.1 HUD

- Gold-Krone-Icon links vom Bones-Counter (CSS pseudo-element)
- Bones-Counter erhält subtle Gold-Glow
- Lives-Display: statt "5/5" wird "∞" angezeigt

### 7.2 Menu

- Subtle Gold-Tint im Hintergrund (overlay layer mit 8% Gold bei Premium-Status)
- Logo-Bereich erhält Gold-Sparkle-Partikel (re-use `particles.js`, nur 2-3 gleichzeitig)
- "KLUB-MITGLIED" Badge unter Logo (silber für Founder, Gold für neue Abonnenten)

### 7.3 Album

- Premium-freigeschaltete Katzen haben Gold-Rahmen statt Standard
- Saison-Katzen haben zusätzlich Saison-Motiv-Rahmen (z.B. Kirschblüten)
- Founder-Katzen haben silbernen "FOUNDER"-Badge in Ecke

### 7.4 Maskottchen

- Premium-Spieler: dezenter Gold-Aura um Mascot-Katze (pulsierender radialer Schein)
- Founder: statt Gold silberner Aura

### 7.5 Splash

Bei Premium-Status beim nächsten Splash:
- Kurzer Text unter Logo: "Willkommen zurück, Club-Mitglied"
- Bei Founder: "Willkommen zurück, Founder seit [Datum]"

---

## 8. Pseudo-Leaderboard

### 8.1 User-Profil

Bei erstem Start:
```js
catsort_leaderboard_id = {
  nick: 'WuscheligerKater-4782',   // deterministisch aus Katzen-Adjektiven + 4-stellige Nummer
  joinedAt: ISO8601,
}
```

### 8.2 Bot-Profile

`js/leaderboard.js` generiert pro Woche (Seed = ISO-Wochennummer + Jahr) **199 Bot-Profile**:
```js
function generateBots(weekSeed) {
  const rng = seedRandom(weekSeed);
  return Array.from({ length: 199 }, () => ({
    nick: randomCatNick(rng),
    score: generateRealisticScore(rng, userMaxLevel),
    isBot: true,
  }));
}
```

Score-Verteilung: Gauss-ähnlich um `userMaxLevel × 0.9`, Standardabweichung 15%. 10% der Bots sind "Ausreißer" (2x-3x Score), um Top-Bereiche zu füllen.

Nick-Generator: 100 Adjektive × 50 Cat-Substantive × 9999 Nummern → ~50M Kombinationen.

### 8.3 Leaderboard-Screen

Neuer Screen `#leaderboardScreen` (accessible via `📅 Wochen-Rangliste` Button im Menü). Zeigt:
- User's aktueller Rang (hervorgehoben)
- Top 10
- 5 Einträge um User herum (scrollable auf Wunsch)
- Timer: "Woche endet in 3d 14h"

### 8.4 Belohnungen

Am Montag 00:00 (seeded berechnet):
- Rang 1-10: 50 Bones
- Rang 11-50: 20 Bones
- Rang 51-100: 10 Bones
- Rest: 5 Bones

Auto-credited beim nächsten App-Start mit Overlay "🏆 Wochen-Ergebnis: Platz 47 → 20 Bones".

### 8.5 Score-Berechnung

User-Score pro Woche:
- 1 Punkt pro gelöstem Level
- 3 Punkte pro 3-Star-Level
- 10 Punkte pro Daily Challenge
- 20 Punkte pro Weekly-Challenge-Stufe
- 5 Punkte pro Mini-Game

Reset Montag 00:00. Verbleibender wöchentlicher Score wird archiviert in `catsort_leaderboard_history`.

---

## 9. Visual Premium-Polish

### 9.1 Splash-Cinematic

Bestehender `splash-bg.png` bleibt. Neu hinzu:
- **Ken-Burns-Effekt**: Langsamer Zoom-In 1.0 → 1.08 über 4 Sekunden (CSS animation)
- **Fade-In-Sequenz**: Logo erscheint nach 0.5s, Play-Button nach 1.5s
- **Blink-Animation**: Vorhandene Katze (SVG) blinzelt alle 3-5 Sekunden (CSS keyframe)
- **Skippable**: Tap auf Canvas überspringt zu Play-Button sofort

### 9.2 Menu-Filz-Textur

SVG-Pattern als `background-image` zusätzlich zum bestehenden Gradient:
```css
.ls-inner::before {
  content: '';
  position: absolute; inset: 0;
  background: url('data:image/svg+xml,...filz-noise...') repeat;
  opacity: 0.04;
  mix-blend-mode: overlay;
  pointer-events: none;
}
```

### 9.3 Gold-Foil auf Premium-CTAs

CSS-only Shimmer-Animation für Premium-Buttons:
```css
.premium-cta {
  background: linear-gradient(110deg,
    #FFD700 0%, #FFF8DC 45%, #FFD700 50%, #FFB800 55%, #FFD700 100%);
  background-size: 200% 100%;
  animation: shimmer 3s linear infinite;
}
@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

### 9.4 Ambient Menu-Motion

2-3 Partikel (Staub/Glitzer) im Menu-Hintergrund, re-use `particles.js` engine. Nur im Menu-State, nicht im Puzzle.

---

## 10. Datei-Struktur

### 10.1 Neue Dateien

| Datei | Zweck | Größe (geschätzt) |
|---|---|---|
| `js/billing.js` | Payment-Abstraktion, TIERS, purchase(), mock/stripe/native-Modi | ~180 LOC |
| `js/paywall.js` | Paywall-UI, Trigger-Logik, Celebration-Flow | ~420 LOC |
| `js/season.js` | Season-Pass-Kernlogik (XP, Tier, Rewards, Claim) | ~380 LOC |
| `js/season-content.js` | Saison-Definitionen (Kirschblüte voll, Juni/Juli Skelett) | ~280 LOC |
| `js/lives.js` | Lives-System (Regen, Consume, UI-Hook) | ~140 LOC |
| `js/leaderboard.js` | Pseudo-Leaderboard (Bot-Generation, Ranking, Rewards) | ~320 LOC |
| `css/premium.css` | Premium-Styling (Gold-Foil, Status-Signale, Paywall-UI) | ~280 LOC |
| `css/season.css` | Season-Pass-UI-Styling | ~220 LOC |

### 10.2 Erweiterte Dateien

| Datei | Änderung |
|---|---|
| `js/constants.js` | BILLING_MODE, STRIPE_LINKS, REWARDS-Rebalance, HINT_COSTS |
| `js/storage.js` | loadSubscription, saveSubscription, loadSeason, saveSeason, loadLives, saveLives, loadPaywallState, savePaywallState, loadLeaderboardId, loadLeaderboardHistory, Migration |
| `js/economy.js` | Auf Subscription-Modell umgestellt, getHintCost(tier) |
| `js/main.js` | Paywall-Trigger-Hooks, Season-XP-Hooks, Lives-Checks, Leaderboard-Score-Tracking, Pass-Button, Leaderboard-Button |
| `js/skins.js` | Shop-Preise erhöht |
| `js/cats.js` | 5 neue Saison-Katzen (sakura, tsubaki, hoshi, mochi-sakura + 1 weitere), neue Unlock-Typen ('season', 'founder') |
| `js/cat-renderer.js` | 4 neue CAT_PARAMS-Einträge für Saison-Katzen |
| `js/background.js` | drawKirschbluteBg (Saison-BG) |
| `js/balls.js` | drawSakuraBall (Saison-Skin) |
| `js/splash.js` | Ken-Burns, Blink, Skip |
| `index.html` | Paywall-Screen, Season-Screen, Leaderboard-Screen, Lives-Display, Premium-Crown, Celebration-Overlay |
| `css/panels.css` | Neuer Menu-Button-Layout (Tower), Filz-Textur |
| `css/game.css` | Lives-Display, Crown-Icon, Gold-Glow |

### 10.3 Entfernt/Ersetzt

- `#premiumBanner` (alter Bottom-Streifen) → ersetzt durch kontextuelle Paywalls
- Alter `alert('Premium aktiviert!')` → ersetzt durch Celebration-Flow
- `#adOverlay` bleibt, aber Premium-Button führt zum neuen Paywall-Screen

---

## 11. Launch-Checkliste (Phase B in 2 Wochen)

Wenn Firma gegründet und Stripe-Account aktiv:

1. Stripe-Dashboard: 3 Payment Links erstellen (3,99€/Monat, 29,99€/Jahr, 39,99€/Lifetime)
2. Return-URL konfigurieren: `https://kittysort.de/?success=1&tier={CHECKOUT_SESSION_ID}`
3. In `js/constants.js`:
   ```js
   export const BILLING_MODE = 'stripe';
   export const STRIPE_LINKS = {
     monthly:  'https://buy.stripe.com/xxx',
     yearly:   'https://buy.stripe.com/yyy',
     lifetime: 'https://buy.stripe.com/zzz',
   };
   ```
4. In `js/main.js` Return-URL-Handler (bereits vorhanden im Code, nur Parameter-Parsing-Aktivierung)
5. Testen mit Stripe-Test-Karten `4242 4242 4242 4242`
6. Live-Deploy. Fertig.

---

## 12. Nicht im Scope

- **Echte Server-Backends** (Leaderboard, Friends, Gifting) — wäre Phase C
- **Push-Notifications** — brauchen Web-Push-Server + Permission-UX
- **Offline-First** — App bleibt online-only (ist aber Static-HTML → funktioniert offline wenn Cache warm)
- **iOS/Android IAP** (native-Modus) — Skelett vorhanden, Implementierung später
- **Mehrsprachigkeit jenseits DE** — bleibt wie heute (nur DE)
- **Analytics** (Amplitude, Mixpanel) — nicht in Scope, aber Paywall-Events loggen via `console.log` vorbereitet

---

## 13. Offene Testing-Punkte vor Launch

1. Migration von bestehenden 4,99€-Käufern (Founder-Grandfathering) manuell verifizieren
2. Saison-Wechsel zum 1. Mai testen (Edge-Case: App zum Monatswechsel offen)
3. Lives-Regen über Tageswechsel + Zeitzonen testen
4. Paywall-Trigger: kein Spam (Tracking-State korrekt)
5. Pseudo-Leaderboard: Bot-Scores fühlen sich realistisch an (nicht zu leicht, nicht zu schwer)
6. Stripe-Return-URL: Status-Update funktioniert bei Refresh / Back-Button
