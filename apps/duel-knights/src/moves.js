/* ───────────────────────── poses & attack data ─────────────────────────
   Hand targets live in a frame at the hips, axes aligned with the knight
   (+Z forward, +X the knight's left). rd = weapon direction, ld = shield normal.
   A pose is 18 numbers: rh(3) rd(3) lh(3) ld(3) cy cp cr hy hz sf. */
export const GUARD={rh:[-.30,.26,.30],rd:[.25,.82,.52],lh:[.20,.32,.40],ld:[.15,0,1],cy:-.25,cp:.04,cr:0,hy:0,hz:0,sf:0};
const TUCK={lh:[.27,.30,.22],ld:[.55,0,.83]};
export const P=(o={})=>{const s={...GUARD,...o};return Float32Array.of(...s.rh,...s.rd,...s.lh,...s.ld,s.cy,s.cp,s.cr,s.hy,s.hz,s.sf);};
export const K=(t,o,e=1)=>({t,p:P(o),e});
const A=(t,o,e=0)=>K(t,{...TUCK,...o},e);
export const POSE={
  guard:P(), block:P({cy:-.42,hy:-.07,cp:.08,lh:[.05,.42,.47],ld:[0,.05,1],rh:[-.34,.20,.12],rd:[.2,.9,.38]}),
  taunt:P({cy:.1,cp:-.03,hy:.02,rh:[-.44,.02,.15],rd:[-.45,-.6,.66],lh:[.38,.10,.12],ld:[.85,0,.5]}),
  // sword raised high on a near-straight arm, shield lowered and turned out at the side
  victory:P({cy:.12,cp:-.1,hy:.02,rh:[-.35,1.09,.09],rd:[-.12,1,.2],lh:[.38,.12,.02],ld:[.95,-.05,.3]}),
  rest:P({cy:0,cp:0,rh:[-.34,.02,.1],rd:[-.1,-.75,.65],lh:[.3,.15,.22],ld:[.5,0,.86]}),
  stagger:P({cy:.3,cp:-.32,hy:-.05,rh:[-.6,.35,.05],rd:[-.75,.25,.6],lh:[.5,.25,.08],ld:[.9,0,.4]}),
  broken:P({cy:-.2,cp:-.28,hy:-.1,rh:[-.5,.1,.1],rd:[-.5,-.2,.84],lh:[.55,.5,.0],ld:[.95,.3,.1]}),
  dodge:P({cy:-.1,cp:.4,hy:-.24,rh:[-.32,.2,.2],rd:[-.3,.5,.8],lh:[.22,.25,.3],ld:[.2,0,1]}),
  parryPunch:P({cy:-.6,hy:-.05,cp:.1,lh:[-.02,.5,.56],ld:[-.25,.1,1],rh:[-.36,.3,.05],rd:[.1,.95,.3]}),
};
export const EASE=[u=>u,u=>u*u*(3-2*u),u=>1-(1-u)*(1-u),u=>u*u];
export const PARRY_WINDOW=.2;

/* An attack: wind/act/rec phase lengths (s), dmg, stamina cost, lunge speed,
   stun on hit, knockback, bs = stamina it drains from a blocker,
   chip = health it takes through a block, poise = time after which a heavy shrugs off light hits.
   Optional `charged`: a showpiece blow (see the spear's heavy). */

/* the longsword — a three-cut chain and an overhead */
export const SWORD={
  l1:{kind:'light',next:'l2',wind:.28,act:.12,rec:.34,dmg:10,cost:11,lunge:2.4,stun:.30,kb:2.2,bs:13,chip:0,keys:[
    A(.28,{cy:-.7,cp:-.04,hy:-.03,rh:[-.50,.50,-.15],rd:[-.75,.50,-.43]},2),
    A(.34,{cy:-.05,cp:.1,rh:[-.25,.42,.42],rd:[-.50,.08,.86]},3),
    A(.37,{cy:.25,cp:.14,hz:.06,rh:[-.02,.38,.50],rd:[.12,0,.99]}),
    A(.40,{cy:.55,cp:.16,hy:-.06,hz:.08,sf:.15,rh:[.20,.34,.36],rd:[.78,-.08,.62]}),
    A(.50,{cy:.62,cp:.16,hy:-.06,hz:.08,sf:.15,rh:[.26,.30,.28],rd:[.86,-.12,.45]},2),K(.74,{})]},
  l2:{kind:'light',next:'l3',wind:.22,act:.12,rec:.36,dmg:11,cost:11,lunge:2.2,stun:.30,kb:2.2,bs:13,chip:0,keys:[
    A(.22,{cy:.6,cp:.05,rh:[.22,.48,.18],rd:[.78,.45,-.43]},2),
    A(.275,{cy:.15,cp:.1,rh:[0,.40,.48],rd:[.35,.05,.93]},3),
    A(.31,{cy:-.2,cp:.14,hz:.06,rh:[-.25,.36,.46],rd:[-.3,0,.95]}),
    A(.34,{cy:-.55,cp:.15,hy:-.05,hz:.08,rh:[-.50,.30,.22],rd:[-.85,-.08,.5]}),
    A(.44,{cy:-.62,cp:.15,hy:-.05,hz:.08,rh:[-.54,.27,.14],rd:[-.9,-.12,.38]},2),K(.70,{})]},
  l3:{kind:'light',next:null,wind:.26,act:.10,rec:.50,dmg:15,cost:13,lunge:3.2,stun:.36,kb:3.6,bs:16,chip:0,keys:[
    A(.26,{cy:-.6,hy:-.06,rh:[-.36,.34,-.02],rd:[.05,.04,1]},2),
    A(.33,{cy:.45,cp:.22,hy:-.12,hz:.22,sf:.3,rh:[-.08,.40,.56],rd:[.02,0,1]},3),
    A(.46,{cy:.45,cp:.22,hy:-.12,hz:.22,sf:.3,rh:[-.08,.40,.56],rd:[.02,0,1]}),K(.86,{})]},
  heavy:{kind:'heavy',next:null,wind:.62,act:.14,rec:.60,dmg:28,cost:26,lunge:3.0,stun:.62,kb:5.5,bs:42,chip:4,poise:.3,keys:[
    A(.26,{cy:-.35,cp:-.08,rh:[-.34,.75,-.02],rd:[-.2,.9,-.35]},1),
    A(.62,{cy:-.3,cp:-.22,hy:.03,rh:[-.28,1.06,-.2],rd:[-.12,.62,-.78]},2),
    A(.68,{cy:0,cp:.1,rh:[-.2,1.0,.3],rd:[0,.75,.66]},3),
    A(.72,{cy:.1,cp:.3,hy:-.1,hz:.08,rh:[-.12,.62,.52],rd:[0,.15,.99]}),
    A(.76,{cy:.2,cp:.45,hy:-.18,hz:.12,sf:.25,rh:[-.08,.22,.50],rd:[.04,-.5,.86]}),
    A(.94,{cy:.2,cp:.45,hy:-.18,hz:.12,sf:.25,rh:[-.08,.22,.50],rd:[.04,-.5,.86]}),K(1.36,{})]},
};

/** stretch an attack's timing by f (keys and phases together) and override fields */
const slow=(a,f,o={})=>({...a,wind:a.wind*f,act:a.act*f,rec:a.rec*f,poise:a.poise&&a.poise*f,keys:a.keys.map(k=>({...k,t:k.t*f})),...o});

/* the flanged mace — shorter, slower, two swings instead of three.
   Every blow drains a guard hard and bleeds through the shield. */
const maceHeavy={...SWORD.heavy,keys:SWORD.heavy.keys.slice()};
maceHeavy.keys[1]=A(.62,{cy:-.4,cp:-.3,hy:.04,rh:[-.24,1.1,-.2],rd:[-.1,.4,-.91]},2); // hoisted higher behind the head
export const MACE={
  l1:slow(SWORD.l1,1.18,{dmg:12,cost:14,lunge:2.9,stun:.36,kb:3.2,bs:18,chip:1}),
  l2:slow(SWORD.l2,1.18,{next:null,dmg:14,cost:15,lunge:2.8,stun:.42,kb:3.8,bs:20,chip:1}),
  heavy:slow(maceHeavy,1.1,{dmg:30,cost:30,lunge:3.5,stun:.72,kb:6.8,bs:50,chip:5}),
};

/* the spear — held in both hands, no shield: the right hand at the butt drives it, the haft slides through the left.
   Three thrusts from well outside sword reach. The heavy is taken from the old spear plays: the spear is
   couched beside the head in both hands, point on the foe, then driven down through the chest on a long step.
   Light on stamina and it shoves the foe back, but each wound is small and a shield turns it easily. */
const SG={cy:-.55,rh:[-.2,.1,0],rd:[.24,.32,.92]};                    // on guard: butt at the right hip, point at the foe's throat
const S=(t,o={},e=0)=>({t,p:P({...SG,...o}),e});
const JAB={cy:-.45,cp:.14,hy:-.08,hz:.16,sf:.22,rh:[-.1,.3,.28],rd:[.04,.04,1]},
  JAB2={cy:-.45,cp:.12,hy:-.06,hz:.14,sf:.2,rh:[-.1,.4,.28],rd:[.02,.08,1]},
  LUNGE={cy:-.4,cp:.26,hy:-.16,hz:.28,sf:.36,rh:[-.08,.3,.3],rd:[.03,0,1]},
  DRIVE={cy:-.3,cp:.32,hy:-.15,hz:.3,sf:.42,rh:[-.08,.5,.34],rd:[.03,-.15,.99]};
export const SPEAR_POSES={
  guard:P(SG),
  block:P({cy:-.3,cp:.06,hy:-.06,rh:[-.27,.26,.28],rd:[.86,.34,.38]}),       // the haft thrown across the body
  parryPunch:P({cy:-.5,cp:.1,hy:-.05,rh:[-.26,.32,.4],rd:[.84,.3,.45]}),
  dodge:P({cy:-.3,cp:.4,hy:-.24,rh:[-.2,.1,.04],rd:[.2,.26,.94]}),
  // one-handed: planted upright at the side, the free hand open
  taunt:P({cy:.1,cp:-.03,hy:.02,rh:[-.46,.12,.14],rd:[-.32,.9,.28],lh:[.38,.10,.12],ld:[.85,0,.5]}),
  rest:P({cy:0,cp:0,rh:[-.42,.2,.12],rd:[-.05,1,.07],lh:[.3,.15,.22],ld:[.5,0,.86]}),
};
export const SPEAR={
  l1:{kind:'light',next:'l2',wind:.27,act:.10,rec:.40,dmg:7,cost:10,lunge:2.6,stun:.28,kb:3.0,bs:10,chip:0,keys:[
    S(.27,{cy:-.8,hy:-.04,rh:[-.3,.16,-.2],rd:[.14,.16,.98]},2),S(.33,JAB,3),S(.44,JAB),S(.77,{},1)]},
  l2:{kind:'light',next:'l3',wind:.21,act:.10,rec:.42,dmg:8,cost:10,lunge:2.4,stun:.28,kb:3.0,bs:10,chip:0,keys:[
    S(.21,{cy:-.8,hy:-.03,rh:[-.3,.24,-.18],rd:[.12,.1,.99]},2),S(.27,JAB2,3),S(.38,JAB2),S(.73,{},1)]},
  l3:{kind:'light',next:null,wind:.30,act:.12,rec:.60,dmg:12,cost:13,lunge:3.6,stun:.36,kb:4.4,bs:14,chip:0,keys:[
    S(.30,{cy:-.9,hy:-.1,rh:[-.3,.12,-.24],rd:[.14,.14,.98]},2),S(.37,LUNGE,3),S(.56,LUNGE),S(1.02,{},1)]},
  // `charged`: the head kindles through the windup, rings as it settles, and the release stamps and shakes
  heavy:{kind:'heavy',next:null,charged:true,wind:.60,act:.14,rec:.64,dmg:23,cost:25,lunge:4.0,stun:.6,kb:6.4,bs:34,chip:3,poise:.3,keys:[
    S(.24,{cy:-.55,cp:-.03,hy:.02,rh:[-.2,.46,-.02],rd:[.16,.12,.98]},1),              // lifted to the shoulder…
    S(.60,{cy:-.8,cp:-.1,hy:.04,hz:-.07,rh:[-.2,.7,-.15],rd:[.1,-.05,.99]},2),         // …and couched by the ear, drawn right back
    S(.66,{cy:-.5,cp:.14,hy:-.06,hz:.12,sf:.2,rh:[-.14,.62,.12],rd:[.05,-.1,.99]},3),
    S(.72,DRIVE),S(.96,DRIVE),S(1.40,{},1)]},
};

/* the war axe — two hewing cuts into a chop. It bites deepest of all on flesh,
   but it is short, costly to swing and takes little out of a raised shield. */
const CHOP={cy:.3,cp:.42,hy:-.16,hz:.12,sf:.25,rh:[-.04,.2,.48],rd:[.1,-.55,.83]};
export const AXE={
  l1:slow(SWORD.l1,1.03,{dmg:13,cost:12,lunge:2.8,stun:.33,kb:2.6,bs:13}),
  l2:slow(SWORD.l2,1.03,{dmg:14,cost:12,lunge:2.6,stun:.33,kb:2.6,bs:13}),
  l3:{kind:'light',next:null,wind:.31,act:.12,rec:.54,dmg:19,cost:14,lunge:3.1,stun:.42,kb:4.2,bs:17,chip:0,keys:[
    A(.31,{cy:-.45,cp:-.12,hy:.02,rh:[-.32,.92,-.1],rd:[-.1,.8,-.6]},2),
    A(.37,{cy:0,cp:.12,rh:[-.2,.8,.34],rd:[0,.6,.8]},3),
    A(.41,{cy:.2,cp:.32,hy:-.1,hz:.1,rh:[-.1,.5,.52],rd:[.05,0,1]}),
    A(.45,CHOP),A(.60,CHOP),K(.97,{})]},
  heavy:slow(SWORD.heavy,1.04,{dmg:34,cost:27,lunge:3.3,stun:.66,kb:6,bs:40,chip:3}),
};

/** the axis an attack's weapon turns about while it can wound, in the knight's frame (null for a thrust).
    A one-edged head is kept square to it, so the edge always leads the arc: see `edge` in weapons.js. */
function swingAxis(a){
  const dir=t=>{const k=a.keys;let i=1;while(i<k.length-1&&t>k[i].t)i++;const A=k[i-1].p,B=k[i].p,u=Math.min(1,Math.max(0,(t-k[i-1].t)/(k[i].t-k[i-1].t||1)));
    const q=j=>A[j]+(B[j]-A[j])*u,l=Math.hypot(q(3),q(4),q(5))||1;return [q(3)/l,q(4)/l,q(5)/l];};
  const X=(p,q)=>[p[1]*q[2]-p[2]*q[1],p[2]*q[0]-p[0]*q[2],p[0]*q[1]-p[1]*q[0]];
  const d0=dir(a.wind-.02),dm=dir(a.wind+a.act/2),d1=dir(a.wind+a.act+.02),n=X(d0,dm).map((v,i)=>v+X(dm,d1)[i]),l=Math.hypot(...n);
  return l>.15?n.map(v=>v/l):null;
}
/** a fighter's own copy of a moveset, scaled by their attack speed and damage */
export function buildMoves(base,{atkSpeed=1,dmg=1,heavyDmg=1}={}){
  const out={},f=1/atkSpeed;
  for(const id in base){const a=base[id];
    out[id]=slow(a,f,{dmg:a.dmg*dmg*(a.kind==='heavy'?heavyDmg:1),axis:swingAxis(a)});}
  return out;
}
