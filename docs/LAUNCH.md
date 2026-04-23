# Kittysort Premium — Launch-Prozedur

## Voraussetzungen

- [ ] Firma gegründet, Stripe-Account verifiziert, Bankverbindung hinterlegt, USt-ID eingetragen
- [ ] AGB und Widerrufsbelehrung auf kittysort.de verlinkt (Footer)
- [ ] Impressum mit Unternehmensdaten aktuell

## Schritte

### 1. Stripe Payment Links erstellen

Im Stripe Dashboard → Payment Links → Neu erstellen:

| Produkt                   | Preis   | Intervall  | Trial   |
|---------------------------|---------|------------|---------|
| Kittysort Club Monatlich  | 3,99€   | Monat      | 7 Tage  |
| Kittysort Club Jährlich   | 29,99€  | Jahr       | 7 Tage  |
| Kittysort Club Lifetime   | 39,99€  | einmalig   | —       |

**Success URL pro Produkt:**
```
https://kittysort.de/?success=1&tier=monthly
https://kittysort.de/?success=1&tier=yearly
https://kittysort.de/?success=1&tier=lifetime
```

- E-Mail-Erfassung aktivieren (für Kündigungs-Support)
- Optional: 7-Tage-Trial direkt in Stripe (zusätzlich zum clientseitigen Trial; bietet Kartenverifizierung)

### 2. Konfiguration umschalten

In `js/constants.js`:

```javascript
export const BILLING_MODE = 'stripe';
export const STRIPE_LINKS = {
  monthly:  'https://buy.stripe.com/XXXXXXX',
  yearly:   'https://buy.stripe.com/YYYYYYY',
  lifetime: 'https://buy.stripe.com/ZZZZZZZ',
};
```

Commit + deploy.

### 3. Testen

- Test-Karte: `4242 4242 4242 4242`, beliebiges zukünftiges Ablaufdatum, beliebige CVC
- Stripe Dashboard → Test-Modus
- Nach erfolgreicher Test-Zahlung: Browser-DevTools → `localStorage.getItem('catsort_subscription')` → sollte Tier + `active: true` zeigen
- Test alle drei Tier-Varianten
- Test auch den Return-URL-Handler: direkte Navigation zu `https://kittysort.de/?success=1&tier=monthly` ohne echten Kauf → setzt ebenfalls den Status (bewusst, fürs clientseitige Szenario)

### 4. Go-Live

- In Stripe Dashboard: Live-Modus aktivieren
- Echte Zahlung mit eigener Karte testen (kleiner Betrag, z.B. Monatsabo 3,99€)
- Bei Erfolg: in Stripe Widerruf ausführen, dann Launch kommunizieren

### 5. Post-Launch-Monitoring

- **Stripe Dashboard** täglich checken (Umsatz, Abos, Refunds)
- **Paywall-Trigger-Effizienz** beobachten: Browser-Analytics-Tool später einbinden (Amplitude/Mixpanel/Plausible), die Trigger-IDs (`level5`, `level15`, `hint3rd`, `streak7`, `lives0`, `seasonEnd3d`) sind bereits als Events in paywall.js vorbereitet
- **Bones-Ökonomie** beobachten: falls Spieler zu schnell zu viel sparen, Rewards weiter anpassen

## Grandfathering-Hinweis

Alle bestehenden 4,99€-Käufer (`catsort-premium: true`) werden bei ihrem nächsten App-Start automatisch zu **Founder-Tier** migriert:
- Lifetime-Premium ohne Ablaufdatum
- Silberner FOUNDER-Badge auf Avatar-Rahmen und im Menü
- Kein Kauf-Reminder, keine Trial-Einladung

Diese Nutzer kennen wir nicht namentlich, aber der Status wird clientseitig in `js/storage.js::migrateToSubscriptionModel()` gesetzt. Keine manuelle Intervention nötig.

## Rollback

Bei kritischen Issues direkt im BILLING_MODE zurück auf `'preview'`:

```javascript
export const BILLING_MODE = 'preview';
```

Commit + deploy. Bestehende aktive Abos im System bleiben aktiv (die Subscription-Records sind clientseitig), nur neue Käufe fallen wieder in den Mock-Modus.

Für echte Abo-Cancelations → Stripe Dashboard → Customer.

## Native IAP (iOS/Android) — später

Für App-Store-Veröffentlichung mit In-App-Purchase:
1. `BILLING_MODE = 'native'`
2. Neues Modul `js/native-billing.js` mit Plattform-Bridge (Capacitor/Cordova)
3. `js/billing.js::purchase()` erweitern um `if (BILLING_MODE === 'native') return nativeBilling.buy(tier);`

Dieser Zweig ist strukturell vorbereitet, aber nicht implementiert.
