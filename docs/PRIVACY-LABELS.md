# App Store Connect — App-Datenschutz („Privacy Labels")

Exakte Antworten für den App-Privacy-Fragebogen in App Store Connect.
Grundlage: Kittysort sammelt selbst **keine** personenbezogenen Daten (kein Konto,
Spielstand nur lokal). Die deklarierten Daten stammen **ausschließlich aus Google
AdMob** (Rewarded Video). Quelle: Googles App-Store-Datenschutz-Leitfaden für AdMob.

> Reihenfolge im Formular: pro Datentyp → „Wird erfasst?" → Zweck → „Mit Identität
> verknüpft?" → „Zum Tracking verwendet?".

## Zu deklarierende Datentypen (alle via AdMob)

| Apple-Kategorie | Datentyp | Zweck | Mit Nutzer verknüpft | Tracking |
|---|---|---|---|---|
| **Standort** | Ungefährer Standort | Drittanbieter-Werbung | Nein | **Ja** |
| **Identifikatoren** | Geräte-ID (IDFA) | Drittanbieter-Werbung | Nein | **Ja** |
| **Nutzungsdaten** | Produktinteraktion | Drittanbieter-Werbung, Analyse | Nein | **Ja** |
| **Nutzungsdaten** | Werbedaten | Drittanbieter-Werbung | Nein | **Ja** |
| **Diagnose** | Absturzdaten | App-Funktionalität | Nein | Nein |
| **Diagnose** | Leistungsdaten | App-Funktionalität | Nein | Nein |

## „Zum Tracking deiner Person verwendet" (App Tracking Transparency)
**Ja** — die App nutzt IDFA/Werbedaten für geräteübergreifende Werbung, sofern der
Nutzer im ATT-Dialog zustimmt. Deshalb ist `NSUserTrackingUsageDescription` gesetzt
und der ATT-Dialog implementiert.

## NICHT deklarieren
- **Käufe / Zahlungsdaten:** Apple wickelt In-App-Käufe ab; wir erhalten keine
  Zahlungs-/Kontaktdaten, der Kauf-Status liegt nur lokal. → keine Erhebung durch uns.
- **Kontaktdaten, Kontakte, Gesundheitsdaten, Nachrichten, Browserverlauf, Konto:**
  nichts davon wird verarbeitet.

## Pflicht-URL im Formular
- **Datenschutz-URL:** `https://kittysort.de/datenschutz.html` (Seite liegt im Repo).

## Wichtig vor Einreichung
- Werte gelten für die **Standard-AdMob-Einrichtung**. Wenn du in AdMob zusätzliche
  Features (z. B. bestimmte Mediation-Netzwerke) aktivierst, ggf. Datentypen ergänzen —
  aktuelle Liste: developers.google.com/admob/ios/data-disclosure.
- Solange `ADMOB.testing = true` (Test-Ads) werden technisch dieselben Datentypen
  berührt → Labels schon jetzt korrekt.
