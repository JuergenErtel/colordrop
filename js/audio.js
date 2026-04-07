'use strict';

// ── ZzFX — Full Micro Sound Synthesizer v2.0.1 ──────────────────────────
// By Frank Force — MIT License — https://github.com/KilledByAPixel/ZzFX
// Complete version with noise, pitchJump, tremolo, modulation, bitCrush.
/* global AudioContext */

let _sfxVolume  = 0.7;
let _sfxEnabled = true;

export function setSfxVolume(vol)      { _sfxVolume = Math.max(0, Math.min(1, vol)); }
export function getSfxVolume()         { return _sfxVolume; }
export function setSfxEnabled(enabled) { _sfxEnabled = !!enabled; }
export function isSfxEnabled()         { return _sfxEnabled; }

let zzfxX;  // AudioContext — created lazily

function zzfxG(e=1,f=.05,a=220,b=0,l=0,M=.1,m=0,F=1,N=0,z=0,Y=0,X=0,P=0,I=0,Q=0,R=0,d=0,S=1,c=0,T=0){
  let q=44100,w=2*Math.PI,L=q*b+9,r=q*l,v=q/a,h=0,n=0,D=0,k=1,A=[],
      C,G;
  try {
    if(!zzfxX) zzfxX=new(window.AudioContext||window.webkitAudioContext)();
    C=zzfxX.createBuffer(1,L+r,q);
    G=C.getChannelData(0);
  } catch { return null; }
  for(T=c*[0,1,1.07,1.26,1.5,1.77][T|0]*w/q,a=w*a/q;h<L+r;h++){
    let p=h<L?h/L:1-(h-L)/r;
    let s=a*(1+(N*Math.sin(2*Math.PI*h/q)+z*Math.sin(h/v*w))+f);
    s+=T*Math.sin(h/q*2*Math.PI);
    D+=s;
    n+=([Math.sin(D),Math.sign(Math.sin(D)),1-2*(Math.floor(2*D/w)%2),((2*D/w%2)-1+2)%2-1][m|0]||Math.sin(D));
    let u=p*S*(k=Y?k+X/q:1)*e;
    G[h]=(Math.abs(n/++Q)>1?n/Math.abs(n):n)*u*Math.min(1,1+R*(h/q));
    Q=m||Q>99?1:Q;
  }
  return C;
}

function zzfxP(buffer){
  if(!buffer||!zzfxX) return;
  let f=zzfxX.createBufferSource();
  f.buffer=buffer;
  f.connect(zzfxX.destination);
  f.start();
  return f;
}

function zzfx(...t){ return zzfxP(zzfxG(...t)); }

// ── Public API ────────────────────────────────────────────────────────────
// ZzFX params: volume, randomness, frequency, attack, sustain, release,
//   shape, shapeCurve, slide, deltaSlide, pitchJump, pitchJumpTime,
//   repeatTime, noise, modulation, bitCrush, delay, sustainVolume, decay, tremolo

export function playSound(name) {
  if (!_sfxEnabled) return;
  const v = _sfxVolume;
  try {
    switch (name) {

      case 'select':
        // Soft "Miau" — sine sliding upward, short and cute
        zzfx(0.3*v,.04,500,.01,.06,.08,0,1,80);
        break;

      case 'pop':
        // Gentle plop + tiny collar bell
        zzfx(0.35*v,.02,160,0,.03,.1,0,1,-25);
        setTimeout(() => zzfx(0.18*v,.01,2200,0,.01,.12,0,1,0), 50);
        break;

      case 'invalid':
        // Cat hiss — noise burst
        zzfx(0.3*v,.1,120,.01,.04,.06,3,.5,0,0,0,0,0,0.5);
        break;

      case 'solved':
        // Satisfied purr (low rumble + tremolo) + warm bell chime
        zzfx(0.2*v,.02,80,.05,.3,.4,3,1,0,0,0,0,.05,0,0,0,0,.6,0,.6);
        setTimeout(() => zzfx(0.25*v,.01,880,.01,.06,.15,0,1,0), 120);
        break;

      case 'tick':
        // Soft tick
        zzfx(0.15*v,.01,650,0,.005,.04,0,1.5);
        break;

      case 'win':
        // Long purr + bell arpeggio (Schnurren + Glöckchen-Melodie)
        zzfx(0.18*v,.02,75,.05,.5,.7,3,1,0,0,0,0,.04,0,0,0,0,.5,0,.5);
        setTimeout(() => zzfx(0.3*v,.01,880,.01,.08,.2,0,1), 100);
        setTimeout(() => zzfx(0.3*v,.01,1100,.01,.08,.2,0,1), 250);
        setTimeout(() => zzfx(0.35*v,.01,1320,.01,.12,.25,0,1), 400);
        break;

      case 'undo':
        // Soft "Mew" — short downward slide
        zzfx(0.2*v,.03,700,0,.04,.06,0,1,-120);
        break;

      case 'hint':
        // Curious "Prrt?" — chirp with upward pitch jump
        zzfx(0.25*v,.04,400,.01,.04,.08,0,1,60,0,200,.04);
        break;

      case 'cat_unlock':
        // Excited "Mrrp!" + jingle cascade
        zzfx(0.3*v,.05,450,.01,.06,.1,0,1,40,0,300,.03);
        setTimeout(() => zzfx(0.2*v,.01,1200,0,.03,.1,0,1), 130);
        setTimeout(() => zzfx(0.2*v,.01,1500,0,.03,.1,0,1), 250);
        setTimeout(() => zzfx(0.2*v,.01,1800,0,.03,.1,0,1), 360);
        setTimeout(() => zzfx(0.25*v,.01,2100,0,.05,.15,0,1), 470);
        break;

      default:
        break;
    }
  } catch { /* audio blocked or not supported */ }
}
