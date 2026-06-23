# Pre-Release Bug-Log

Rollender Bugfix-Workstream vor dem iOS-Release. Pro Bug: Symptom → Ursache → Fix → Status.
Fixes landen auf der Web-Quelle (Repo-Root) und wirken via `cap:sync` auch im nativen Build.

| # | Symptom | Ursache (Root Cause) | Fix | Status |
|---|---------|----------------------|-----|--------|
| 1 | Ab ~Level 70/80: Antippen trifft oft die **benachbarte** (linke) Röhre → Frust | Einreihiges Layout mit fixer `TUBE_W=68` in fixer `CW=420`; ab ~8 Röhren wird der Abstand negativ → Röhren **überlappen** (bei 11–12 Röhren um 24–30px). `tubeAt` gab das **erste** passende (überlappende) Rechteck zurück → systematisch die **linke** Röhre. | `tubeAt` löst jetzt auf das **nächstgelegene Röhren-Zentrum** auf (wie der Tetris-Modus); Deselect bei Taps klar außerhalb bleibt erhalten. Pure Geometrie nach `js/layout.js` extrahiert + Unit-Tests. | ⚠️ gefixt `620eaac` (Test 39/39), **live auf www.kittysort.de**. Playtest 2026-06-23: **spürbar besser & spielbar**, aber **noch nicht perfekt** — Restmis-Taps bei sehr vielen Röhren. Root Cause (Überlappung) bleibt; vollständige Lösung = Option B (Zwei-Reihen). |

## Offene / spätere Ideen
- **Zwei-Reihen-Layout für hohe Level (Option B) — GEPARKT (2026-06-23):** Der
  `tubeAt`-Fix kaschiert die Überlappung nur, beseitigt sie aber spielbar genug.
  Entscheidung: für den Launch **nicht** umsetzen, das Spiel läuft so. Bleibt als
  Reserve-Idee, falls Spieler-Feedback später doch Mis-Taps häuft.
