/* ───────────────────────── the roster ─────────────────────────
   Add a knight by adding an entry here. Fields:
     look    armour colours and shape (see knight.js) — alt is used when both sides pick the same knight
     weapon  a key into WEAPONS (weapons.js)
     stats   overrides of BASE_STATS (fighter.js); anything left out stays at the default
     ai      overrides of the AI's plan weights (brain.js): circle, pressure, heavy, feint, bait
     rating  1–5 pips shown on the select screen (display only)
     lines   end-screen text: `fall` when you beat them, `win` when they beat you */
export const ROSTER=[
  {
    id:'caldwin',name:'Ser Caldwin',title:'the Azure',
    blurb:'A steady blade. Three-cut combo, sound guard, nothing to hide.',
    look:{steel:0x9aa3b0,rough:.34,trim:0xc9a24a,mail:0x4a4f58,cloth:0x2a6be0,blade:0xdde4ee,emblem:'azure',helm:'plume',trailColor:0x9fc4ff},
    alt:{cloth:0x8a2a2a,trailColor:0xffb0a0},
    weapon:'sword',
    stats:{stam:106,regen:34},
    ai:{},
    rating:{health:3,power:3,speed:3,guard:3},
    lines:{fall:'The Azure banner is lowered',win:'The Azure banner holds'},
  },
  {
    id:'varkos',name:'Varkos',title:'the Ashen King',
    blurb:'Broad and patient. His overheads land harder and his guard barely gives.',
    look:{steel:0x2c2c33,rough:.38,trim:0x9a6b2a,mail:0x1c1c20,cloth:0x7a1210,blade:0xb8b0aa,emblem:'ashen',helm:'horned',scale:1.06,capeL:.84,trailColor:0xff9a70},
    alt:{cloth:0x3a3a44,trim:0x8a8f99,trailColor:0xc0c8ff},
    weapon:'sword',
    stats:{hp:104,speed:3.4,atkSpeed:.96,heavyDmg:1.08,guard:.86},
    ai:{heavy:.55,feint:.45,pressure:1.1},
    rating:{health:4,power:4,speed:2,guard:4},
    lines:{fall:'The Ashen King falls',win:'The crown stays cold'},
  },
  {
    id:'ysolde',name:'Ysolde',title:'the Thorn',
    blurb:'Quick cuts, cheap dodges, and a riposte that punishes every mistake. She cannot take much.',
    look:{steel:0xb6bbb4,rough:.28,trim:0xa7b2ae,mail:0x3a403a,cloth:0x1f5a34,blade:0xe8ecef,emblem:'thorn',helm:'crest',crest:0x2e9a52,scale:.96,bulk:.85,capeW:.38,capeL:.64,trailColor:0x9dffc0},
    alt:{cloth:0x5a1f4e,crest:0x9a2e86,trailColor:0xffa0e8},
    weapon:'sword',
    stats:{hp:86,stam:110,speed:3.9,regen:36,dodgeCost:15,dodgeSpeed:9.4,atkSpeed:1.1,dmg:.85,riposte:1.5},
    ai:{pressure:1.6,bait:.8,heavy:.15,circle:.9},
    rating:{health:2,power:2,speed:5,guard:2},
    lines:{fall:'The Thorn is cut down',win:'Too quick for your guard'},
  },
  {
    id:'brann',name:'Brann',title:'the Bellbreaker',
    blurb:'Slow, huge, and armed with a flanged mace. Every blow drains your guard and bleeds through the shield.',
    look:{steel:0x6e5c4a,rough:.5,trim:0xb07a3a,mail:0x2e2620,cloth:0x5a3a1c,blade:0x8f8b86,emblem:'bell',helm:'great',scale:1.1,bulk:1.25,capeW:.46,capeL:.76,eyes:false,trailColor:0xffc070},
    alt:{cloth:0x24343e,trim:0x8a96a0,trailColor:0xa0d8ff},
    weapon:'mace',
    stats:{hp:110,speed:3.05,regen:28,dodgeCost:24,dodgeSpeed:7.8},
    ai:{heavy:.7,pressure:1.2,bait:.2,feint:.2},
    rating:{health:5,power:5,speed:1,guard:3},
    lines:{fall:'The Bellbreaker falls silent',win:'The bell tolls for you'},
  },
  {
    id:'oriel',name:'Dame Oriel',title:'the Sunsworn',
    blurb:'Tireless behind her shield. She hits lightly, but her guard outlasts yours and her riposte is the hardest in the ring.',
    look:{steel:0xd9d5c8,rough:.22,trim:0xe2b13c,mail:0x8d8873,cloth:0xe4d9bd,blade:0xf4ecd0,emblem:'sun',helm:'sun',capeW:.44,capeL:.82,trailColor:0xffe9a8},
    alt:{cloth:0x9db4d6,trim:0xc8ccd4,trailColor:0xc8e0ff},
    weapon:'sword',
    stats:{hp:98,stam:116,regen:36,dmg:.93,guard:.88,riposte:1.6},
    ai:{circle:1,pressure:1.05,bait:.9,heavy:.25},
    rating:{health:3,power:2,speed:3,guard:5},
    lines:{fall:'The sun sets on the Sunsworn',win:'Dawn breaks over your grave'},
  },
  {
    id:'corvin',name:'Corvin',title:'the Gallows Crow',
    blurb:'No shield: both hands on a long spear. Three thrusts from beyond sword reach keep you off him, and his heavy drives the point down from beside his head; get inside the point and he has little to give.',
    look:{steel:0x56608c,rough:.27,trim:0xc3c6d2,mail:0x262a3a,cloth:0x4c35a0,blade:0xd8dcec,emblem:'crow',helm:'beak',mantle:'feather',shield:'none',bulk:.92,capeW:.44,capeL:.74,trailColor:0xc9a8ff},
    alt:{cloth:0x7a1f30,trim:0xb8a06a,trailColor:0xffa8b8},
    weapon:'spear',
    stats:{hp:88,speed:3.65,dodgeCost:18,guard:1.1},
    ai:{circle:1.1,pressure:1.45,heavy:.25,bait:.6},
    rating:{health:2,power:3,speed:4,guard:2},
    lines:{fall:'The Crow is brought to ground',win:'The crows will have you'},
  },
  {
    id:'sigrun',name:'Sigrun',title:'the Red Tusk',
    blurb:'All attack. Her war axe bites deeper than any blade, but it is short, tiring to swing, and she is easy to hit back.',
    look:{steel:0x868a8c,rough:.52,trim:0x34343a,mail:0x45423d,cloth:0xb8491a,blade:0xb9bbb8,emblem:'boar',helm:'boar',mantle:'fur',shield:'round',scale:1.02,bulk:1.1,capeW:.46,capeL:.58,trailColor:0xffa860},
    alt:{cloth:0x2c5d6c,trailColor:0xa0e8ff},
    weapon:'axe',
    stats:{hp:102,speed:3.65,guard:1.05},
    ai:{pressure:1.7,heavy:.5,circle:.5,bait:.2,feint:.3},
    rating:{health:3,power:5,speed:3,guard:1},
    lines:{fall:'The Red Tusk is broken',win:'Gored and left in the dust'},
  },
];
export const CHARACTERS=Object.fromEntries(ROSTER.map(c=>[c.id,c]));
