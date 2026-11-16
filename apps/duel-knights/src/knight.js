import * as THREE from 'three';
import {V} from './util.js';
import {scene} from './render.js';
import {tex,emblemCanvas,capeCanvas,tabardCanvas} from './textures.js';
import {WEAPONS} from './weapons.js';

/* ───────────────────────── knight model ─────────────────────────
   Every knight shares one skeleton; the look options change the armour.
   o: steel, rough, trim, mail, cloth, blade (colours) · emblem · crest (fin colour)
      helm ('plume'|'horned'|'crest'|'great'|'sun'|'beak'|'boar') · mantle ('fur'|'feather': what lies over the shoulders)
      shield ('heater'|'round'|'kite'|'none') · scale (whole body) · bulk (pauldron size) · weapon (key into WEAPONS)
      capeW, capeL (cape size; its design comes from the emblem, see CAPES in textures.js) */
export const HIP_Y=.88, UA=.29, FA=.27, TH=.45, SHN=.43, ANKLE=.07;
export const CHEST_OFF=V(0,.10,0), SH_R=V(-.25,.45,0), SH_L=V(.25,.45,0), HJ_L=V(.11,-.03,0), HJ_R=V(-.11,-.03,0);

/* shield outlines, drawn in the shield's own plane; w/top/bot are the bounds the coat of arms is stretched over */
const SHIELDS={
  heater:{w:.5,top:.28,bot:-.38,draw(p){p.moveTo(-.25,.28);p.lineTo(.25,.28);p.lineTo(.25,.02);p.quadraticCurveTo(.24,-.22,0,-.38);p.quadraticCurveTo(-.24,-.22,-.25,.02);}},
  round:{w:.58,top:.26,bot:-.32,draw(p){p.absarc(0,-.03,.29,0,Math.PI*2);}},
  kite:{w:.46,top:.31,bot:-.53,draw(p){p.moveTo(-.23,.12);p.quadraticCurveTo(-.23,.31,0,.31);p.quadraticCurveTo(.23,.31,.23,.12);p.quadraticCurveTo(.2,-.26,0,-.53);p.quadraticCurveTo(-.2,-.26,-.23,.12);}},
};

/** Build many small pieces with `build(group)`, then bake them into one mesh per material under `parent`:
    a crest of fifteen rays costs one draw call (and one per shadow pass) instead of fifteen. */
function baked(parent,build){
  const tmp=new THREE.Group(),by=new Map();build(tmp);tmp.updateMatrixWorld(true);
  tmp.traverse(o=>{if(!o.isMesh)return;const g=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();g.applyMatrix4(o.matrixWorld);
    (by.get(o.material)||by.set(o.material,[]).get(o.material)).push(g);o.geometry.dispose();});
  for(const [mat,geos] of by){
    const out=new THREE.BufferGeometry();
    for(const k of ['position','normal','uv']){const size=k==='uv'?2:3,arr=new Float32Array(geos.reduce((n,g)=>n+g.attributes[k].array.length,0));let at=0;
      for(const g of geos){arr.set(g.attributes[k].array,at);at+=g.attributes[k].array.length;}
      out.setAttribute(k,new THREE.BufferAttribute(arr,size));}
    geos.forEach(g=>g.dispose());
    const me=new THREE.Mesh(out,mat);me.castShadow=true;me.receiveShadow=true;parent.add(me);
  }
}

export function buildKnight(o){
  const m={
    steel:new THREE.MeshStandardMaterial({color:o.steel,metalness:.82,roughness:o.rough,envMapIntensity:1.1,side:THREE.DoubleSide}),
    trim:new THREE.MeshStandardMaterial({color:o.trim,metalness:.9,roughness:.35,envMapIntensity:1.2}),
    mail:new THREE.MeshStandardMaterial({color:o.mail,metalness:.45,roughness:.7,envMapIntensity:.6}),
    cloth:new THREE.MeshStandardMaterial({color:o.cloth,roughness:.85,metalness:0,envMapIntensity:.3,side:THREE.DoubleSide}),
    leather:new THREE.MeshStandardMaterial({color:0x2a1c12,roughness:.8,envMapIntensity:.3}),
    black:new THREE.MeshBasicMaterial({color:0x020202}),
    blade:new THREE.MeshStandardMaterial({color:o.blade,metalness:.95,roughness:.2,envMapIntensity:1.6,flatShading:true}),
    feather:new THREE.MeshStandardMaterial({color:0x15131c,metalness:.35,roughness:.45,envMapIntensity:.9,flatShading:true}),
  };
  const {steel,trim,mail,cloth,leather,black}=m;
  const add=(geo,mat,parent,x=0,y=0,z=0,rx=0,ry=0,rz=0)=>{const me=new THREE.Mesh(geo,mat);me.position.set(x,y,z);me.rotation.set(rx,ry,rz);me.castShadow=true;me.receiveShadow=true;parent.add(me);return me;};
  const grp=(parent,x=0,y=0,z=0)=>{const g=new THREE.Group();g.position.set(x,y,z);parent.add(g);return g;};
  const cyl=(a,b,h,s=10)=>new THREE.CylinderGeometry(a,b,h,s), box=(x,y,z)=>new THREE.BoxGeometry(x,y,z), sph=(r,w=12,h=10)=>new THREE.SphereGeometry(r,w,h);
  const helm=o.helm||'plume',bulk=o.bulk||1,spiky=helm==='horned';
  const cone=(r,h,s=6)=>new THREE.ConeGeometry(r,h,s);

  const root=new THREE.Group();scene.add(root);
  const hips=grp(root,0,HIP_Y,0);
  const chest=grp(hips,0,.10,0);chest.rotation.order='YXZ';
  // pelvis
  add(cyl(.2,.17,.18,12),mail,hips,0,-.02,0).scale.z=.74;
  // the surcoat: curved cloth that sits just outside the armour (flat panels let the plate poke through)
  const coat=new THREE.MeshStandardMaterial({map:tex(tabardCanvas(o)),roughness:.85,metalness:0,envMapIntensity:.3,side:THREE.DoubleSide});
  const arc=(rt,rb,h,half,sz)=>{const g=new THREE.CylinderGeometry(rt,rb,h,8,1,true,-half,half*2);g.scale(1,1,sz);return g;};
  // front skirt, hinged at the belt; animate() swings it forward with the thighs
  const skirtM=coat.clone();skirtM.map=tex(tabardCanvas(o,false)); // the skirt carries the pale but not the cross-bar
  const skirt=grp(hips,0,-.035,0);{const g=arc(.205,.24,.34,.56,.78);g.translate(0,-.17,0);add(g,skirtM,skirt).castShadow=true;}
  // faulds: curved hip plates (flat ones mirrored the braziers as a glaring rectangle)
  for(const sd of [1,-1]){const g=new THREE.CylinderGeometry(.214,.236,.22,7,1,true,sd*Math.PI/2-.6,1.2);g.scale(1,1,.76);add(g,steel,hips,0,-.09,0);}
  // torso
  add(cyl(.235,.195,.44,14),steel,chest,0,.2,0).scale.z=.72;
  add(sph(.2),steel,chest,0,.33,.015).scale.set(1.25,.8,.78);
  add(arc(.25,.228,.44,.42,.72),coat,chest,0,.19,0);                    // surcoat front
  add(cyl(.232,.232,.06,14),leather,chest,0,-.01,0).scale.z=.75;add(box(.06,.07,.03),trim,chest,0,-.01,.177); // belt over it
  add(cyl(.1,.135,.09,10),steel,chest,0,.5,0);
  // neck: a mail column from the gorget up into the helm, with a standing collar around its base.
  // It belongs to the chest, so the helm can turn and nod on it without a gap opening underneath.
  add(cyl(.086,.098,.2,12),mail,chest,0,.59,0);
  add(cyl(.106,.102,.04,12),steel,chest,0,.56,0);add(cyl(.109,.109,.012,12),trim,chest,0,.583,0);
  if(o.mantle==='fur'){ // a shaggy pelt around the collar: two rings of tufts, the outer one drooping onto the shoulders
    const fur=[0x3d2b1d,0x4d3826].map(color=>new THREE.MeshStandardMaterial({color,roughness:1,metalness:0,flatShading:true,envMapIntensity:.12}));
    baked(chest,g=>{for(let ring=0;ring<2;ring++)for(let i=0,n=ring?13:9;i<n;i++){const a=(i+ring*.5)/n*Math.PI*2,back=Math.cos(a)<-.2?1:0,r=ring?1:.66;
      add(new THREE.IcosahedronGeometry(.062+back*.014,0),fur[(i+ring)%2],g,Math.sin(a)*.235*r,.505-ring*.045+back*.012,Math.cos(a)*.15*r-.012,i*1.7,i*2.3+ring,i*.9).scale.set(1.25,.8,1.1);}});
  }
  // head
  const head=grp(chest,0,.55,0);head.rotation.order='YXZ';
  if(helm==='great'){ // flat-topped great helm with a cross of brass
    add(cyl(.15,.145,.32,14),steel,head,0,.17,0);
    add(cyl(.153,.153,.025,14),trim,head,0,.33,0);
    add(box(.25,.024,.03),black,head,0,.2,.146);
    add(box(.026,.24,.03),trim,head,0,.16,.15);add(box(.16,.026,.03),trim,head,0,.13,.15);
    for(let i=0;i<6;i++)add(box(.012,.012,.02),black,head,.045+(i%3)*.028,.07-((i/3)|0)*.03,.15);
  }else{
    const open=helm==='boar',visor=!open&&helm!=='beak'; // which helms keep the plain barrel, eye slit and nose ridge
    add(cyl(open?.134:.132,.142,open?.15:.25,14),steel,head,0,open?.1:.15,0);
    if(!open)add(sph(.134,14,8),steel,head,0,.27,0).scale.y=.6;
    add(cyl(.136,.146,.03,14),trim,head,0,.04,0);
    if(visor){
      add(box(.21,.024,.03),black,head,0,.17,.128);
      add(box(.022,.2,.03),trim,head,0,.14,.135);
      for(let i=0;i<4;i++)add(box(.012,.012,.02),black,head,.04+(i%2)*.035,.09-((i/2)|0)*.03,.136);
    }
  }
  if(helm==='horned'){
    for(const s of [1,-1]){const h=grp(head,s*.12,.27,0);h.rotation.z=-s*.9;add(new THREE.ConeGeometry(.04,.3,7),trim,h,0,.14,0);
      const h2=grp(h,0,.26,0);h2.rotation.z=s*.75;add(new THREE.ConeGeometry(.028,.2,7),trim,h2,0,.08,0);}
    for(let i=0;i<5;i++){const a=(i-2)*.5;add(new THREE.ConeGeometry(.02,.11,5),trim,head,Math.sin(a)*.115,.37,Math.cos(a)*.115-.02);}
  }else if(helm==='plume'){
    for(let i=0;i<7;i++){const k=i/6;add(sph(.05-.02*k,8,6),cloth,head,0,.36+.06*Math.sin(k*2.6),.03-k*.3).scale.x=.55;}
    add(cyl(.02,.03,.08,6),trim,head,0,.335,.03);
  }else if(helm==='crest'){ // a half-moon fin in enamelled metal (o.crest colour)
    const crestM=new THREE.MeshStandardMaterial({color:o.crest??o.trim,metalness:.9,roughness:.28,envMapIntensity:1.4});
    add(new THREE.CylinderGeometry(.14,.14,.016,18,1,false,0,Math.PI),crestM,head,0,.29,-.01,0,0,Math.PI/2).scale.x=.9;
  }
  if(helm==='sun')baked(head,h=>{ // a gilt-browed sallet under a rayed halo
    add(cyl(.143,.143,.024,16),trim,h,0,.235,0);
    const halo=grp(h,0,.2,-.105);add(new THREE.TorusGeometry(.172,.011,6,28),trim,halo);
    for(let i=0;i<15;i++){const a=-.62+i/14*(Math.PI+1.24),l=i%2?.09:.15;
      add(cone(.017,l,4),trim,halo,Math.cos(a)*(.176+l/2),Math.sin(a)*(.176+l/2),0,0,0,a-Math.PI/2).scale.z=.35;}
  });
  else if(helm==='beak')baked(head,h=>{ // hounskull bascinet: a pointed skull and a long beaked visor, black feathers swept back
    add(sph(.133,14,10),steel,h,0,.2,-.006).scale.set(1,1.22,1.04);
    add(cone(.094,.3,10),steel,h,0,.128,.2,Math.PI/2+.14,0,0).scale.x=.78;
    add(cone(.03,.31,4),trim,h,0,.15,.2,Math.PI/2+.14,0,0).scale.x=.3;         // ridge along the top of the beak
    for(const sd of [1,-1])add(box(.07,.017,.03),black,h,sd*.06,.212,.123,0,sd*.42,-sd*.3);
    for(let i=-2;i<=2;i++)add(cone(.04,.34-.05*Math.abs(i),4),m.feather,h,i*.026,.36-.02*Math.abs(i),-.1,-(1.05+.12*Math.abs(i)),0,i*.2).scale.x=.22;
  });
  else if(helm==='boar')baked(head,h=>{ // an open-faced spangenhelm: nasal bar, mail aventail and a pair of tusks
    add(cyl(.05,.137,.15,14),steel,h,0,.25,0);add(sph(.05,8,6),trim,h,0,.325,0);
    add(cyl(.145,.147,.03,14),trim,h,0,.178,0);
    for(let i=0;i<4;i++){const r=grp(h,0,.178,0);r.rotation.y=i*Math.PI/2+Math.PI/4;add(box(.022,.17,.012),trim,r,0,.076,.096,-.545);}
    add(new THREE.CylinderGeometry(.145,.148,.115,10,1,true,-.68,1.36),black,h,0,.1,0);   // the open face, lost in shadow
    add(box(.032,.16,.022),trim,h,0,.105,.148);
    add(cyl(.146,.205,.13,14),mail,h,0,-.03,0).scale.z=.84;
    const bone=new THREE.MeshStandardMaterial({color:0xe9dfc4,roughness:.45,metalness:.05,envMapIntensity:.5});
    for(const sd of [1,-1]){const t=grp(h,sd*.118,.045,.085);t.rotation.set(.55,0,-sd*.3);
      add(cone(.024,.1,6),bone,t,0,.05,0);const t2=grp(t,0,.095,0);t2.rotation.x=-.75;add(cone(.019,.09,6),bone,t2,0,.035,0);}
  });
  if(o.eyes||helm==='horned'){ // glowing eye slits — they flare during a heavy windup
    const eyeM=new THREE.MeshBasicMaterial({color:new THREE.Color(6,.5,.2)}),z=helm==='great'?.144:.122,y=helm==='great'?.2:.17;
    add(sph(.014,6,6),eyeM,head,.042,y,z);add(sph(.014,6,6),eyeM,head,-.042,y,z);root.userData.eyes=eyeM;
  }
  // cape
  const CW=o.capeW||.42,CL=o.capeL||.78;
  const capeG=new THREE.PlaneGeometry(CW,CL,4,9);capeG.translate(0,-CL/2,0);
  const capeMat=new THREE.MeshStandardMaterial({map:tex(capeCanvas(o)),alphaTest:.5,roughness:.85,metalness:0,envMapIntensity:.3,side:THREE.DoubleSide});
  const cape=new THREE.Mesh(capeG,capeMat);cape.position.set(0,.47,-.165);cape.castShadow=true;chest.add(cape);
  // arms
  const arm=(s,SH)=>{
    const ua=grp(chest,SH.x,SH.y,SH.z);
    add(cyl(.062,.052,UA,10),mail,ua,0,-UA/2,0);
    const pa=add(sph(.105,12,8),steel,ua,s*.01,.01,0);pa.scale.set(bulk,.82*bulk,1.05*bulk);
    add(cyl(.108*bulk,.108*bulk,.02,12),trim,ua,s*.01,-.045,0);
    if(spiky)add(new THREE.ConeGeometry(.03,.14,6),trim,ua,s*.07,.1,0,0,0,-s*.6);
    if(o.mantle==='feather')baked(ua,g=>{for(let row=0;row<2;row++)for(let j=-2;j<=2;j++){ // two rows of black feathers lying over the pauldron
      const f=grp(g,s*.01,.03-row*.05,0);f.rotation.y=(s>0?0:Math.PI)+(j+row*.5-.25)*.52;
      add(cone(.05,.2+row*.04,4),m.feather,f,.1*bulk+.012-row*.012,-.07,0,0,0,Math.PI+.42-row*.22).scale.x=.22;}});
    const fa=grp(ua,0,-UA,0);add(sph(.062,10,8),steel,fa);add(cyl(.054,.044,.24,10),steel,fa,0,-.135,0);add(cyl(.057,.057,.025,10),trim,fa,0,-.04,0);
    const hand=grp(fa,0,-FA,0);add(box(.085,.1,.09),steel,hand);add(box(.09,.03,.095),trim,hand,0,-.045,0);
    return {ua,fa,hand};
  };
  const aR=arm(-1,SH_R),aL=arm(1,SH_L);
  // legs
  const leg=(s,HJ)=>{
    const th=grp(hips,HJ.x,HJ.y,HJ.z);add(cyl(.088,.07,TH,10),mail,th,0,-TH/2,0);add(new THREE.CylinderGeometry(.102,.088,.28,8,1,true,-1.05,2.1),steel,th,0,-.2,0);
    const sh=grp(th,0,-TH,0);add(sph(.076,10,8),steel,sh,0,0,.01);add(cyl(.066,.05,.4,10),steel,sh,0,-.22,0);add(cyl(.07,.07,.025,10),trim,sh,0,-.07,0);
    const ft=grp(sh,0,-SHN,0);add(box(.095,.075,.25),steel,ft,0,-.03,.055);add(box(.08,.05,.08),steel,ft,0,-.045,.2);
    return {th,sh,ft};
  };
  const lL=leg(1,HJ_L),lR=leg(-1,HJ_R);
  // weapon (grip along +Y of the hand)
  const arms=()=>new THREE.MeshStandardMaterial({map:tex(emblemCanvas(o.emblem)),roughness:.7,metalness:.1,envMapIntensity:.4});
  const WD=WEAPONS[o.weapon||'sword'],W=WD.build({add,grp,cyl,box,sph,m,arms},aR.hand);
  if(Object.values(WD.moves).some(a=>a.charged)){ // its steel kindles during a charged blow (driven from main.js)
    m.blade.emissive.set(o.trailColor??0xffffff);m.blade.emissiveIntensity=0;root.userData.charge=m.blade;}
  // shield (faces +Z of the left hand). shieldC is the centre of the guard that blows are tested against;
  // a knight with no shield guards with the weapon itself, between the hands.
  const shield=grp(aL.hand,0,.02,.075);let shieldC;
  if(o.shield==='none')shieldC=grp(W.g,0,.3,0);
  else{
    const SK=SHIELDS[o.shield]||SHIELDS.heater,sh=SK.top-SK.bot,round=o.shield==='round';
    const shp=new THREE.Shape();SK.draw(shp);shp.closePath();
    const fm=arms();fm.roughness=.55;fm.metalness=.25;fm.envMapIntensity=.6;
    fm.map.repeat.set(1/SK.w,1/sh);fm.map.offset.set(.5,-SK.bot/sh); // shape coordinates → the whole coat of arms
    const face=new THREE.Mesh(new THREE.ShapeGeometry(shp,round?16:10),fm);face.position.z=.033;face.castShadow=true;shield.add(face);
    const body=add(new THREE.ExtrudeGeometry(shp,{depth:.03,bevelEnabled:false,curveSegments:round?16:10}),steel,shield);body.scale.set(1.05,1.05,1);body.position.y=round?-.0015:-.002;
    if(round){add(new THREE.TorusGeometry(.292,.014,6,28),trim,shield,0,-.03,.03); // an iron rim and studs; no boss, so the arms stay whole
      baked(shield,g=>{for(let i=0;i<8;i++){const a=i/8*Math.PI*2+.39;add(sph(.014,6,5),steel,g,Math.sin(a)*.262,-.03+Math.cos(a)*.262,.036);}});}
    else add(sph(.05,10,8),trim,shield,0,-.02,.035).scale.z=.6;
    shieldC=grp(shield,0,-.03,.02);
  }
  const bones={root,hips,chest,head,cape,skirt,uaR:aR.ua,faR:aR.fa,hR:aR.hand,uaL:aL.ua,faL:aL.fa,hL:aL.hand,
    thL:lL.th,shL:lL.sh,ftL:lL.ft,thR:lR.th,shR:lR.sh,ftR:lR.ft,weapon:W.g,bBase:W.base,bTip:W.tip,shield,shieldC};
  // remember rest transforms so the ragdoll can be undone
  const rest=[];for(const k of ['hips','uaR','faR','hR','uaL','faL','hL','thL','shL','ftL','thR','shR','ftR','weapon']){const b=bones[k];rest.push({b,parent:b.parent,pos:b.position.clone()});}
  bones.rest=rest;bones.capeBase=capeG.attributes.position.array.slice();bones.capeLen=CL;
  if(o.scale)root.scale.setScalar(o.scale);
  return bones;
}
