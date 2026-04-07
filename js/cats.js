'use strict';

export const CATS = [
  // ── Story Level Milestones ────────────────────────────────────────────────
  {
    id: 'luna',
    name: 'Luna',
    breed: 'Russisch Blau',
    emoji: '😺',
    fact: 'Russisch-Blau-Katzen gelten als hypoallergen – sie produzieren weniger Fel-d-1-Protein als andere Rassen.',
    unlock: { type: 'level', value: 10 },
    premium: false,
  },
  {
    id: 'mochi',
    name: 'Mochi',
    breed: 'Schottische Faltohr',
    emoji: '😸',
    fact: 'Schottische Faltohren kommunizieren mit leisen, melodischen Miau-Lauten und gelten als besonders sanftmütig.',
    unlock: { type: 'level', value: 25 },
    premium: false,
  },
  {
    id: 'felix',
    name: 'Felix',
    breed: 'Maine Coon',
    emoji: '😻',
    fact: 'Maine Coons sind die größte Hauskatzenrasse der Welt – Männchen erreichen oft über 8 kg Körpergewicht.',
    unlock: { type: 'level', value: 50 },
    premium: false,
  },
  {
    id: 'nala',
    name: 'Nala',
    breed: 'Siamkatze',
    emoji: '😽',
    fact: 'Siamkatzen sind für ihre Gesprächigkeit bekannt – sie "unterhalten" sich gerne stundenlang mit ihren Besitzern.',
    unlock: { type: 'level', value: 75 },
    premium: false,
  },
  {
    id: 'kuro',
    name: 'Kuro',
    breed: 'Bombay',
    emoji: '🐱',
    fact: 'Bombay-Katzen werden wegen ihres glänzend-schwarzen Fells und ihrer goldenen Augen oft als "Miniatur-Panther" bezeichnet.',
    unlock: { type: 'level', value: 100 },
    premium: false,
  },
  {
    id: 'freya',
    name: 'Freya',
    breed: 'Norwegische Waldkatze',
    emoji: '😼',
    fact: 'Norwegische Waldkatzen haben ein doppeltes, wasserabweisendes Fell – perfekt für die rauen skandinavischen Winter.',
    unlock: { type: 'level', value: 150 },
    premium: false,
  },
  {
    id: 'sora',
    name: 'Sora',
    breed: 'Türkisch Angora',
    emoji: '😺',
    fact: 'Türkisch-Angora-Katzen sind oft zweifarbig-äugig (Heterochromie) und gehören zu den ältesten Reinzuchtrassen der Welt.',
    unlock: { type: 'level', value: 200 },
    premium: false,
  },
  {
    id: 'mika',
    name: 'Mika',
    breed: 'Britisch Kurzhaar',
    emoji: '😸',
    fact: 'Britisch-Kurzhaar-Katzen haben das dichteste Fell aller Hauskatzenrassen und wurden als Vorbild für den Cheshire Cat verwendet.',
    unlock: { type: 'level', value: 250 },
    premium: false,
  },
  {
    id: 'zenith',
    name: 'Zenith',
    breed: 'Savannah',
    emoji: '🦁',
    fact: 'Savannah-Katzen sind Hybriden aus Serval und Hauskatze – sie können bis zu einem Meter Höhe springen.',
    unlock: { type: 'level', value: 300 },
    premium: false,
  },
  {
    id: 'cosmos',
    name: 'Cosmos',
    breed: 'Ragdoll',
    emoji: '🌌',
    fact: 'Ragdolls werden nach einem Griff hochgenommen schlaff wie eine Puppe – daher ihr Name. Sie gelten als "Hunde unter den Katzen".',
    unlock: { type: 'endless', value: 1 },
    premium: false,
  },

  // ── Achievement-based ─────────────────────────────────────────────────────
  {
    id: 'whisker',
    name: 'Whisker',
    breed: 'Abessinier',
    emoji: '😺',
    fact: 'Abessinier-Katzen sind extrem neugierig und klug – sie öffnen selbstständig Türen und Schubladen.',
    unlock: { type: 'achievement', value: 'first_solve' },
    premium: false,
  },
  {
    id: 'pebble',
    name: 'Pebble',
    breed: 'Devon Rex',
    emoji: '😸',
    fact: 'Devon-Rex-Katzen haben riesige Ohren und krauses Fell – ihr Erbgut unterscheidet sie vollständig von Cornish Rex.',
    unlock: { type: 'achievement', value: 'paw_print' },
    premium: false,
  },
  {
    id: 'simba',
    name: 'Simba',
    breed: 'Löwenkind-Mix',
    emoji: '🦁',
    fact: 'Hauskatzen teilen 95,6 % ihrer DNA mit Tigern – ihr Jagdinstinkt ist evolutionär tief verwurzelt.',
    unlock: { type: 'achievement', value: 'pride_of_lions' },
    premium: false,
  },
  {
    id: 'ember',
    name: 'Ember',
    breed: 'Bengalkatze',
    emoji: '⚡',
    fact: 'Bengalkatzen lieben Wasser und springen freiwillig in die Badewanne – ein sehr unkatzenartiges Verhalten!',
    unlock: { type: 'achievement', value: 'hot_streak' },
    premium: false,
  },
  {
    id: 'starla',
    name: 'Starla',
    breed: 'Türkisch Van',
    emoji: '✨',
    fact: 'Türkisch-Van-Katzen sind als "Schwimmkatzen" bekannt – sie springen von sich aus ins Wasser und schwimmen gerne.',
    unlock: { type: 'achievement', value: 'star_collector' },
    premium: false,
  },
  {
    id: 'tansy',
    name: 'Tansy',
    breed: 'Manx',
    emoji: '😽',
    fact: 'Manx-Katzen sind von Natur aus ohne Schwanz – eine natürliche Mutation, die auf der Isle of Man entstand.',
    unlock: { type: 'achievement', value: 'yarn_ball' },
    premium: false,
  },
  {
    id: 'arrow',
    name: 'Arrow',
    breed: 'Ocicat',
    emoji: '🎨',
    fact: 'Ocicats sehen aus wie Wildkatzen, sind aber vollständig domestiziert – ihr Fleckenmuster entstand durch reinen Zufall.',
    unlock: { type: 'achievement', value: 'sharpshooter' },
    premium: false,
  },
  {
    id: 'bolt',
    name: 'Bolt',
    breed: 'Cornish Rex',
    emoji: '⚡',
    fact: 'Cornish-Rex-Katzen sind die Sprinter unter den Hauskatzen – ihr schlanker Körper und lange Beine machen sie außergewöhnlich schnell.',
    unlock: { type: 'achievement', value: 'lightning_paw' },
    premium: false,
  },
  {
    id: 'rex',
    name: 'Rex',
    breed: 'Selkirk Rex',
    emoji: '👑',
    fact: 'Selkirk-Rex-Katzen haben lockiges Fell – sogar ihre Schnurrhaare sind gewellt. Sie werden liebevoll "Katze im Schafspelz" genannt.',
    unlock: { type: 'achievement', value: 'cat_king' },
    premium: false,
  },

  // ── Daily Streak ──────────────────────────────────────────────────────────
  {
    id: 'sunny',
    name: 'Sunny',
    breed: 'Europäisch Kurzhaar',
    emoji: '😸',
    fact: 'Europäisch-Kurzhaar-Katzen sind die häufigsten Hauskatzen in Europa und für ihre Robustheit und Langlebigkeit bekannt.',
    unlock: { type: 'streak', value: 3 },
    premium: false,
  },
  {
    id: 'lucky',
    name: 'Lucky',
    breed: 'Japanischer Stummelschwanz',
    emoji: '😺',
    fact: 'Japanische Stummelschwanzkatzen (Bobtail) gelten in Japan als Glücksbringer – die berühmte Maneki-Neko-Figur zeigt diese Rasse.',
    unlock: { type: 'streak', value: 7 },
    premium: false,
  },
  {
    id: 'nova',
    name: 'Nova',
    breed: 'Sphynx',
    emoji: '✨',
    fact: 'Sphynx-Katzen sind nicht wirklich haarlos – sie haben einen feinen Flaum und fühlen sich an wie warmes Wildleder.',
    unlock: { type: 'streak', value: 14 },
    premium: false,
  },
  {
    id: 'sage',
    name: 'Sage',
    breed: 'Burmesische Katze',
    emoji: '😻',
    fact: 'Burmesische Katzen haben eine ungewöhnliche Eigenschaft: Sie behalten ihr verspieltes Wesen oft ein Leben lang.',
    unlock: { type: 'streak', value: 30 },
    premium: false,
  },
  {
    id: 'blaze',
    name: 'Blaze',
    breed: 'Somali',
    emoji: '🦁',
    fact: 'Somali-Katzen werden als "Fuchs unter den Katzen" bezeichnet – ihr buschiger Schwanz und das getickte Fell erinnern an einen Fuchs.',
    unlock: { type: 'streak', value: 60 },
    premium: false,
  },
  {
    id: 'legend',
    name: 'Legend',
    breed: 'Persische Katze',
    emoji: '👑',
    fact: 'Persische Katzen wurden bereits im 17. Jahrhundert in Europa als Statussymbole der Adeligen gehalten.',
    unlock: { type: 'streak', value: 100 },
    premium: false,
  },

  // ── Premium-only ──────────────────────────────────────────────────────────
  {
    id: 'aurora',
    name: 'Aurora',
    breed: 'Birma',
    emoji: '👑',
    fact: 'Birma-Katzen (Heilige Birma) haben nach der Legende weiße Pfoten als Symbol der Reinheit – ein Muster, das kein Züchter replizieren kann.',
    unlock: { type: 'premium', value: true },
    premium: true,
  },
  {
    id: 'prism',
    name: 'Prism',
    breed: 'Colorpoint Langhaar',
    emoji: '🎨',
    fact: 'Colorpoint-Katzen entwickeln ihre Farbe erst mit der Körperwärme – kältere Körperstellen wie Ohren und Pfoten sind immer dunkler.',
    unlock: { type: 'premium', value: true },
    premium: true,
  },
  {
    id: 'imperial',
    name: 'Imperial',
    breed: 'Chausie',
    emoji: '👑',
    fact: 'Chausie-Katzen sind Hybride aus Dschungelkatze und Hauskatze – sie können bis zu 15 kg wiegen und brauchen viel Platz.',
    unlock: { type: 'premium', value: true },
    premium: true,
  },
  {
    id: 'galaxy',
    name: 'Galaxy',
    breed: 'Lykoi',
    emoji: '🌌',
    fact: 'Lykoi-Katzen werden "Werwolfkatzen" genannt – eine natürliche Mutation lässt ihr Fell stellenweise fehlen und gibt ihnen ein gruselig-bezauberndes Aussehen.',
    unlock: { type: 'premium', value: true },
    premium: true,
  },
  {
    id: 'diamond',
    name: 'Diamond',
    breed: 'Khao Manee',
    emoji: '💎',
    fact: 'Khao-Manee-Katzen (Weißes Edelsteinauge) waren in Thailand Jahrhunderte lang ausschließlich dem Königshaus vorbehalten.',
    unlock: { type: 'premium', value: true },
    premium: true,
  },
];

/**
 * Check which cats should be newly unlocked.
 * @param {Set<string>} owned - Set of cat IDs already owned
 * @param {{ maxLevel: number, achievements: string[], streak: number, endlessBest: number, isPremium: boolean }} state
 * @returns {string[]} Newly unlocked cat IDs
 */
export function checkCatUnlocks(owned, state) {
  const { maxLevel, achievements, streak, endlessBest, isPremium } = state;
  const newlyUnlocked = [];

  for (const cat of CATS) {
    if (owned.has(cat.id)) continue;

    const { type, value } = cat.unlock;
    let shouldUnlock = false;

    switch (type) {
      case 'level':
        shouldUnlock = maxLevel >= value;
        break;
      case 'endless':
        shouldUnlock = endlessBest >= value;
        break;
      case 'achievement':
        shouldUnlock = Array.isArray(achievements) && achievements.includes(value);
        break;
      case 'streak':
        shouldUnlock = streak >= value;
        break;
      case 'premium':
        shouldUnlock = isPremium === true;
        break;
    }

    if (shouldUnlock) newlyUnlocked.push(cat.id);
  }

  return newlyUnlocked;
}
