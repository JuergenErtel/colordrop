# Color Drop — Game Feel: Design-Spec
**Datum:** 2026-04-06
**Status:** Genehmigt

---

## 1. Ziel

Vier direkte Verbesserungen der Spielqualität ohne Architekturänderungen:
1. Synthesierte Soundeffekte via ZzFX
2. Konfetti-Burst beim Win
3. Farbcodierter Zugzähler (Par-Feedback während des Spiels)
4. 1 leere Röhre ab EXPERT-Tier (erhöhte Schwierigkeit)

Alle Änderungen beschränken sich auf `index.html`.

---

## 2. Sound (ZzFX)

### Integration

ZzFX (~1KB Quellcode) wird direkt in den `<script>`-Block eingebettet — vor allen Spiel-Funktionen. Kein CDN, keine externen Dateien.

ZzFX-Quellcode (minifiziert, direkt einfügen):
```js
// ZzFX - Zuper Zmall Audio Library - v2.0.1 by Frank Force
let zzfx,zzfxX;zzfx=(...t)=>zzfxP(zzfxG(...t));zzfxG=(e=1,f=.05,a=220,b=0,l=0,M=.1,m=0,F=1,N=0,z=0,Y=0,X=0,P=0,I=0,Q=0,R=0,d=0,S=1,c=0,T=0)=>{let q=44100,w=2*Math.PI,L=q*b+9,r=q*l,v=q/a,h=0,n=0,D=0,k=1,A=[],C=zzfxX.createBuffer(1,L+r,q),G=C.getChannelData(0);for(T=c*[0,1,1.07,1.26,1.5,1.77][T|0]*w/q,a=w*a/q;h<L+r;h++){let p=h<L?h/L:1-(h-L)/r;let s=a*(1+(N*Math.sin(2*Math.PI*h/q)+z*Math.sin(h/v*w))+f);s+=T*Math.sin(h/q*2*Math.PI);D+=s;n+=([Math.sin(D),Math.sign(Math.sin(D)),1-2*(Math.floor(2*D/w)%2),((2*D/w%2)-1+2)%2-1][m|0]||Math.sin(D));let u=p*S*(k=Y?k+X/q:1)*e;G[h]=(Math.abs(n/++Q)>1?n/Math.abs(n):n)*u*Math.min(1,1+R*(h/q));Q=m||Q>99?1:Q}return G};zzfxP=(...t)=>{let e=zzfxX.createBuffer(t.length,t[0].length,44100),f=zzfxX.createBufferSource();for(let a in t)e.getChannelData(a).set(t[a]);f.buffer=e;f.connect(zzfxX.destination);f.start();return f};zzfxX=new AudioContext;
```

### `playSound(name)` — implementiert

```js
function playSound(name) {
    try {
        switch (name) {
            case 'select':  zzfx(.4,.05,800,.02,.02,.04,0,1.5);          break;
            case 'pop':     zzfx(.6,.05,300,.01,.05,.08,0,.8,,.1);        break;
            case 'invalid': zzfx(.5,.1,150,.01,.05,.05,3,.5,,-5);         break;
            case 'solved':  zzfx(.5,.05,600,.01,.1,.1,0,1.5,,.5,,,.1);    break;
            case 'win':
                zzfx(.5,.05,523,.01,.1,.1,0,1.5);
                setTimeout(() => zzfx(.5,.05,659,.01,.1,.1,0,1.5), 150);
                setTimeout(() => zzfx(.6,.05,784,.01,.2,.15,0,1.5), 300);
                break;
        }
    } catch(e) {}   // AudioContext blockiert wenn kein User-Interaktion (iOS)
}
```

Der try/catch verhindert Abstürze auf iOS wo AudioContext erst nach User-Geste aktiv wird.

### Aufrufstellen (unverändert, bereits im Code vorhanden)

| Stelle | Sound |
|--------|-------|
| `handleInput` — Kugel selektiert | `playSound('select')` |
| `updateArc` — Arc-Ende (Landung) | `playSound('pop')` |
| `triggerFlash` — ungültiger Zug | `playSound('invalid')` |
| `updateArc` — Röhre gelöst | `playSound('solved')` |
| `updateArc` — `checkWin()` true | `playSound('win')` |

---

## 3. Win-Konfetti

### Neue Partikelfelder

Bestehende Partikel (`ANIM.particles`) haben folgende Felder: `x, y, vx, vy, life, maxLife, color, r`.

Konfetti-Partikel erweitern das um: `confetti, w, h, angle, spin` (für Rechteck-Rendering). Das `confetti: true`-Flag ist der eindeutige Typ-Indikator — der existierende Kreisrenderer überspringt Partikel mit diesem Flag.

### `spawnConfetti()` — neue Funktion

```js
function spawnConfetti() {
    const colors = Object.values(PALETTE).map(p => p.base);
    const cx = canvas.width / 2;
    for (let i = 0; i < 80; i++) {
        const angle = (Math.random() - .5) * Math.PI;     // –90°…+90° Streuung
        const speed = 6 + Math.random() * 8;
        ANIM.particles.push({
            x:        cx + (Math.random() - .5) * canvas.width * .6,
            y:        canvas.height * .3,
            vx:       Math.cos(angle) * speed * .5,
            vy:       -speed,
            life:     1,
            maxLife:  1,
            color:    colors[Math.floor(Math.random() * colors.length)],
            confetti: true,                                // Typ-Flag: Rechteck statt Kreis
            w:        6,
            h:        10,
            angle:    Math.random() * Math.PI * 2,
            spin:     (Math.random() - .5) * .3,
        });
    }
}
```

Aufruf: direkt in `checkWin()` nach `G.won = true`.

### Rendering in `render()`

Nach dem bestehenden Partikel-Rendercode wird ein Branch ergänzt: wenn ein Partikel ein `w`-Feld hat (Konfetti-Typ), wird es als rotiertes Rechteck gerendert statt als Kreis.

```js
// Konfetti-Partikel (Rechteck) — vom Kreisrenderer übersprungen
if (p.confetti) {
    p.vy += 0.25;                  // Schwerkraft
    p.vx *= 0.99;                  // Luftwiderstand
    p.angle += p.spin;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.angle);
    ctx.globalAlpha = p.life;
    ctx.fillStyle = p.color;
    ctx.fillRect(-p.w/2, -p.h/2, p.w, p.h);
    ctx.restore();
}
```

Das bestehende Kreispartikel-Rendering bleibt unverändert.

---

## 4. Farbcodierter Zugzähler

### CSS

Drei neue Utility-Klassen für den `#moveCount`-Span:

```css
.move-good    { color: #b2ff59; }   /* ≤ par          */
.move-ok      { color: #ff7043; }   /* ≤ par × 1.5    */
.move-over    { color: #f50057; }   /* > par × 1.5    */
```

Kein Klassenname = neutrales `var(--muted)` (vor dem ersten Zug).

### `updateHUD()` — Ergänzung

```js
const mc = document.getElementById('moveCount');
if (G.moves === 0) {
    mc.className = '';
} else {
    const par = parForLevel(LEVEL.current);
    mc.className = G.moves <= par       ? 'move-good' :
                   G.moves <= par * 1.5 ? 'move-ok'   : 'move-over';
}
```

---

## 5. Schwierigkeit: 1 leere Röhre ab EXPERT

`levelConfig(n)` wird angepasst:

```js
function levelConfig(n) {
    if (n <=  3) return { colors: ['cyan','magenta'],                                    empty: 2, tier: 'EASY'   };
    if (n <=  8) return { colors: ['cyan','magenta','lime'],                             empty: 2, tier: 'MEDIUM' };
    if (n <= 15) return { colors: ['cyan','magenta','lime','yellow'],                    empty: 2, tier: 'HARD'   };
    if (n <= 25) return { colors: ['cyan','magenta','lime','yellow','orange'],           empty: 1, tier: 'EXPERT' };
    return           { colors: ['cyan','magenta','lime','yellow','orange','pink'], empty: 1, tier: 'MASTER' };
}
```

Konsequenz: Level 16+ haben 6 resp. 7 Röhren statt 7 resp. 8. Bestehende Level 1–15 unverändert. Level 16+ erhalten neue Puzzles (anderes `empty` → andere Shuffle-Kandidaten).

---

## 6. Nicht im Scope

- Hintergrundmusik
- Lautstärke-Einstellung
- Vibrations-Feedback (Haptic API)
- Weitere Partikeltypen
