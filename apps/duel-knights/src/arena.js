import * as THREE from 'three';
import {rand,TAU,V} from './util.js';
import {renderer,scene} from './render.js';
import {cv,tex,softTex,groundCanvas,brickCanvas,bannerTex} from './textures.js';
import {buildStarfall} from './starfall.js';
import {buildWyrmfire} from './wyrmfire.js';

/* Every arena shares the same level fighting floor and collision radius. */
export const ARENAS=[
  {id:'courtyard',name:'Ashen Courtyard',tag:'The old proving ground',description:'Firelit stone. Iron gates. The banners of rival houses.',sigil:'♜',orbit:0,fog:0x0a0d18,density:.016,build:buildCourtyard},
  {id:'starfall',name:'Starfall Cloister',tag:'Where fallen stars are kept',description:'A ruined sanctuary above the clouds. An ancient star still turns.',sigil:'✧',orbit:Math.PI+.25,fog:0x101b2a,density:.010,build:buildStarfall},
  {id:'wyrmfire',name:'Wyrmfire Crucible',tag:'Beneath the sleeping wyrm',description:'A dragon-carved forge above a molten chasm. Ancient runes burn in the stone.',sigil:'♢',orbit:Math.PI+.16,fog:0x211119,density:.013,build:buildWyrmfire},
];
let arena=null,activeId=null,animateArena=null,quality=2,skyBuilt=false;
export const arenaId=()=>activeId;

// Only the selected arena lives on the GPU. The sky and reflection map are shared.
function clearArena(){
  if(!arena)return;
  const geometries=new Set(),materials=new Set(),textures=new Set();
  arena.traverse(o=>{
    if(o.geometry)geometries.add(o.geometry);
    if(o.material)for(const m of [].concat(o.material)){
      materials.add(m);for(const v of Object.values(m))if(v?.isTexture&&v!==softTex)textures.add(v);
    }
    if(o.isInstancedMesh)o.dispose();
    if(o.shadow)o.shadow.dispose();
  });
  textures.forEach(t=>t.dispose());materials.forEach(m=>m.dispose());geometries.forEach(g=>g.dispose());
  scene.remove(arena);fires.length=0;banners.length=0;animateArena=null;
  for(const e of embData)e.f=null;
}
export function setArenaQuality(level){
  quality=level;
  fires.forEach((f,i)=>{if(f.light)f.light.castShadow=f.shadow&&level>0&&(level===2||i%2===0);});
}
export function buildArena(id='courtyard'){
  const definition=ARENAS.find(a=>a.id===id)||ARENAS[0];id=definition.id;
  if(id===activeId)return;
  if(!skyBuilt){buildSky();skyBuilt=true;}
  clearArena();arena=new THREE.Group();arena.name='arena:'+id;scene.add(arena);activeId=id;
  scene.fog.color.setHex(definition.fog);scene.fog.density=definition.density;
  animateArena=definition.build(arena,{addFire,addBanner})||null;
  setArenaQuality(quality);
}
function addBanner(x,y,z,angle,slot){
  const g=new THREE.PlaneGeometry(1.3,2.6,6,10);g.translate(0,-1.3,0);
  const m=new THREE.Mesh(g,new THREE.MeshStandardMaterial({map:bannerTex(slot?'ashen':'azure'),alphaTest:.5,side:THREE.DoubleSide,roughness:.9,envMapIntensity:.2}));
  m.position.set(x,y,z);m.rotation.y=angle;m.castShadow=true;arena.add(m);
  banners.push({m,base:g.attributes.position.array.slice(),seed:rand(10),slot});
}
export const ARENA_R=8.6, WALL_R=11.6;
export const fires=[];           // {pos,light,base,sprites[],seed}
const banners=[];                // {m,base,seed,slot} — slot 0 shows your arms, slot 1 your foe's

function buildSky(){
  // image-based light so the armour has something to reflect
  const pm=new THREE.PMREMGenerator(renderer),es=new THREE.Scene();
  es.add(new THREE.Mesh(new THREE.SphereGeometry(50,16,8),new THREE.MeshBasicMaterial({color:0x0b1020,side:THREE.BackSide})));
  for(let i=0;i<6;i++){const m=new THREE.Mesh(new THREE.SphereGeometry(3,8,8),new THREE.MeshBasicMaterial({color:new THREE.Color(5,1.8,.45)}));
    const a=i/6*TAU;m.position.set(Math.cos(a)*24,rand(-2,5),Math.sin(a)*24);es.add(m);}
  const mo=new THREE.Mesh(new THREE.SphereGeometry(6,8,8),new THREE.MeshBasicMaterial({color:new THREE.Color(2.5,3.2,5)}));mo.position.set(-18,34,22);es.add(mo);
  scene.environment=pm.fromScene(es,.05).texture;
  pm.dispose();es.traverse(o=>{if(o.geometry)o.geometry.dispose();if(o.material)o.material.dispose();});

  // sky, stars, moon
  const sc=cv(4,256),sg=sc.getContext('2d'),gr=sg.createLinearGradient(0,0,0,256);
  gr.addColorStop(0,'#02030a');gr.addColorStop(.45,'#070b1a');gr.addColorStop(.52,'#121a33');gr.addColorStop(.6,'#0a0d18');gr.addColorStop(1,'#0a0d18');
  sg.fillStyle=gr;sg.fillRect(0,0,4,256);
  scene.add(new THREE.Mesh(new THREE.SphereGeometry(400,24,16),new THREE.MeshBasicMaterial({map:tex(sc),side:THREE.BackSide,fog:false,depthWrite:false})));
  const sp=[];for(let i=0;i<900;i++){const a=rand(TAU),e=rand(.06,1.5);sp.push(Math.cos(a)*Math.cos(e)*380,Math.sin(e)*380,Math.sin(a)*Math.cos(e)*380);}
  const sgm=new THREE.BufferGeometry();sgm.setAttribute('position',new THREE.Float32BufferAttribute(sp,3));
  scene.add(new THREE.Points(sgm,new THREE.PointsMaterial({color:0xbfd0ff,size:1.6,sizeAttenuation:false,fog:false,transparent:true,opacity:.8,depthWrite:false})));
  const moonDir=V(-.42,.62,.56).normalize();
  const moon=new THREE.Sprite(new THREE.SpriteMaterial({map:softTex,color:0xcfdcff,fog:false,depthWrite:false}));
  moon.position.copy(moonDir).multiplyScalar(360);moon.scale.setScalar(70);scene.add(moon);
  const moon2=new THREE.Mesh(new THREE.CircleGeometry(11,32),new THREE.MeshBasicMaterial({color:0xeef2ff,fog:false}));
  moon2.position.copy(moonDir).multiplyScalar(358);moon2.lookAt(0,0,0);scene.add(moon2);

  // lights
  scene.add(new THREE.HemisphereLight(0x4a62a0,0x1a120a,.7));
  const ml=new THREE.DirectionalLight(0x8ea6ff,1.5);ml.position.copy(moonDir).multiplyScalar(30);
  ml.castShadow=true;ml.shadow.mapSize.set(2048,2048);
  Object.assign(ml.shadow.camera,{left:-13,right:13,top:13,bottom:-13,near:5,far:60});ml.shadow.bias=-.0006;ml.shadow.normalBias=.03;
  scene.add(ml);

}

function buildCourtyard(){
  // ground
  const gc=groundCanvas(),gt=tex(gc),gb=tex(gc,false);
  const ground=new THREE.Mesh(new THREE.CircleGeometry(WALL_R+.4,72),new THREE.MeshStandardMaterial({map:gt,bumpMap:gb,bumpScale:1.6,roughness:.86,metalness:.05,envMapIntensity:.35}));
  ground.rotation.x=-Math.PI/2;ground.receiveShadow=true;arena.add(ground);

  // wall
  const bc=brickCanvas(),bt=tex(bc),bb=tex(bc,false);[bt,bb].forEach(t=>{t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(18,1.5);});
  const stone=new THREE.MeshStandardMaterial({map:bt,bumpMap:bb,bumpScale:2,roughness:.95,metalness:0,envMapIntensity:.2,side:THREE.BackSide});
  const wall=new THREE.Mesh(new THREE.CylinderGeometry(WALL_R,WALL_R,5.2,64,1,true),stone);wall.position.y=2.6;wall.receiveShadow=true;arena.add(wall);
  const stone2=new THREE.MeshStandardMaterial({color:0x3a3632,roughness:.95,envMapIntensity:.2});
  const dark=new THREE.MeshStandardMaterial({color:0x121114,roughness:1,envMapIntensity:.1});
  const rim=new THREE.Mesh(new THREE.RingGeometry(WALL_R-.25,WALL_R+.6,64),new THREE.MeshStandardMaterial({color:0x3a3632,roughness:.95,side:THREE.DoubleSide}));rim.rotation.x=-Math.PI/2;rim.position.y=5.45;arena.add(rim);
  const hole=new THREE.Mesh(new THREE.CylinderGeometry(WALL_R-.25,WALL_R-.25,.4,64,1,true),new THREE.MeshStandardMaterial({color:0x2c2926,roughness:1,side:THREE.BackSide}));hole.position.y=5.3;arena.add(hole);
  const merlon=new THREE.BoxGeometry(.9,.8,.5);
  for(let i=0;i<36;i++){const a=i/36*TAU,m=new THREE.Mesh(merlon,stone2);m.position.set(Math.sin(a)*(WALL_R+.25),5.85,Math.cos(a)*(WALL_R+.25));m.rotation.y=a;arena.add(m);}
  // bench ring at the foot of the wall
  const bench=new THREE.Mesh(new THREE.RingGeometry(WALL_R-.9,WALL_R,64),stone2);bench.rotation.x=-Math.PI/2;bench.position.y=.3;bench.receiveShadow=true;arena.add(bench);
  const benchF=new THREE.Mesh(new THREE.CylinderGeometry(WALL_R-.9,WALL_R-.9,.3,64,1,true),stone2);benchF.position.y=.15;arena.add(benchF);

  // pillars, torches, banners
  const iron=new THREE.MeshStandardMaterial({color:0x1b1b1f,roughness:.6,metalness:.7});
  const pg=new THREE.BoxGeometry(.9,5.2,.7),cap=new THREE.BoxGeometry(1.15,.3,.95);
  for(let i=0;i<12;i++){
    const a=(i+.5)/12*TAU,sx=Math.sin(a),cz=Math.cos(a);
    const p=new THREE.Mesh(pg,stone2);p.position.set(sx*(WALL_R-.3),2.6,cz*(WALL_R-.3));p.rotation.y=a;p.castShadow=true;p.receiveShadow=true;arena.add(p);
    const c1=new THREE.Mesh(cap,stone2);c1.position.set(sx*(WALL_R-.3),4.6,cz*(WALL_R-.3));c1.rotation.y=a;arena.add(c1);
    const c2=c1.clone();c2.position.y=.45;arena.add(c2);
    if(i%2===0){ // wall torch
      const tp=V(sx*(WALL_R-.95),3.1,cz*(WALL_R-.95));
      const br=new THREE.Mesh(new THREE.CylinderGeometry(.05,.035,.7,6),iron);br.position.copy(tp).y-=.3;br.rotation.set(.35*cz,0,-.35*sx);arena.add(br);
      const cup=new THREE.Mesh(new THREE.CylinderGeometry(.11,.06,.14,8),iron);cup.position.copy(tp).y+=.02;arena.add(cup);
      addFire(V(tp.x,tp.y+.14,tp.z),.55,i%4===0?16:0,false);
    }else{ // banner
      const slot=i%4===1?0:1;
      const g=new THREE.PlaneGeometry(1.3,2.6,6,10);g.translate(0,-1.3,0);
      const m=new THREE.Mesh(g,new THREE.MeshStandardMaterial({map:bannerTex(slot?'ashen':'azure'),alphaTest:.5,side:THREE.DoubleSide,roughness:.9,envMapIntensity:.2}));
      m.position.set(sx*(WALL_R-.72),4.35,cz*(WALL_R-.72));m.rotation.y=a+Math.PI;m.castShadow=true;arena.add(m);
      const rod=new THREE.Mesh(new THREE.CylinderGeometry(.03,.03,1.5,6),iron);rod.rotation.z=Math.PI/2;rod.position.copy(m.position);rod.rotation.y=a;arena.add(rod);
      banners.push({m,base:g.attributes.position.array.slice(),seed:rand(10),slot});
    }
  }
  // gates behind each fighter
  for(const s of [1,-1]){
    const gz=s*(WALL_R-.12);
    const rec=new THREE.Mesh(new THREE.BoxGeometry(3,3.6,.3),dark);rec.position.set(0,1.8,gz);arena.add(rec);
    const arch=new THREE.Mesh(new THREE.BoxGeometry(3.8,.55,.8),stone2);arch.position.set(0,3.85,gz-s*.2);arena.add(arch);
    for(const x of [-1.75,1.75]){const j=new THREE.Mesh(new THREE.BoxGeometry(.5,3.6,.8),stone2);j.position.set(x,1.8,gz-s*.2);j.castShadow=true;arena.add(j);}
    for(let k=-5;k<=5;k++){const b=new THREE.Mesh(new THREE.CylinderGeometry(.035,.035,3.6,5),iron);b.position.set(k*.27,1.8,gz-s*.28);arena.add(b);}
    for(let k=0;k<5;k++){const b=new THREE.Mesh(new THREE.BoxGeometry(3,.05,.05),iron);b.position.set(0,.5+k*.72,gz-s*.3);arena.add(b);}
  }
  // braziers — the shadow-casting firelight
  for(let i=0;i<4;i++){
    const a=i/4*TAU+Math.PI/4,x=Math.sin(a)*9.7,z=Math.cos(a)*9.7;
    for(let k=0;k<3;k++){const leg=new THREE.Mesh(new THREE.CylinderGeometry(.03,.03,1.25,5),iron);const la=k/3*TAU;
      leg.position.set(x+Math.sin(la)*.2,.6,z+Math.cos(la)*.2);leg.rotation.set(Math.cos(la)*.3,0,-Math.sin(la)*.3);arena.add(leg);}
    const bowl=new THREE.Mesh(new THREE.CylinderGeometry(.42,.2,.3,10,1,true),new THREE.MeshStandardMaterial({color:0x1b1b1f,roughness:.6,metalness:.7,side:THREE.DoubleSide}));bowl.position.set(x,1.3,z);arena.add(bowl);
    const coal=new THREE.Mesh(new THREE.CylinderGeometry(.36,.3,.08,10),new THREE.MeshBasicMaterial({color:new THREE.Color(3.2,.9,.15)}));coal.position.set(x,1.36,z);arena.add(coal);
    addFire(V(x,1.5,z),1,58,true);
  }
  // distant keep silhouettes beyond the wall
  const far=new THREE.MeshStandardMaterial({color:0x10131f,roughness:1,envMapIntensity:0});
  const win=new THREE.MeshBasicMaterial({color:new THREE.Color(2.2,1.1,.3)});
  [[.4,30,16,3.2],[1.5,36,22,4],[2.6,28,13,2.6],[3.7,40,26,4.6],[4.6,32,17,3],[5.6,38,20,3.6]].forEach(([a,r,h,w])=>{
    const t=new THREE.Mesh(new THREE.CylinderGeometry(w,w*1.1,h,10),far);t.position.set(Math.sin(a)*r,h/2,Math.cos(a)*r);arena.add(t);
    const roof=new THREE.Mesh(new THREE.ConeGeometry(w*1.25,w*1.8,10),far);roof.position.set(t.position.x,h+w*.9,t.position.z);arena.add(roof);
    for(let k=0;k<3;k++){const wn=new THREE.Mesh(new THREE.PlaneGeometry(.35,.7),win);const wa=a+Math.PI+rand(-.5,.5);
      wn.position.set(t.position.x+Math.sin(wa)*(w*1.06),rand(8,h-1.5),t.position.z+Math.cos(wa)*(w*1.06));wn.rotation.y=wa;arena.add(wn);}
  });
}

/** hang the two duellists' arms on the arena banners */
export function setBannerEmblems(mine,theirs){
  const cache={},old=new Set();
  for(const b of banners){const k=b.slot?theirs:mine,mat=b.m.material;
    if(mat.userData.kind===k){cache[k]=mat.map;continue;}
    if(mat.map)old.add(mat.map);
    mat.map=cache[k]||(cache[k]=bannerTex(k));mat.userData.kind=k;mat.needsUpdate=true;}
  const used=new Set(banners.map(b=>b.m.material.map));
  old.forEach(t=>{if(!used.has(t))t.dispose();});
}

function addFire(pos,size,intensity,shadow){
  const f={pos,size,base:intensity,shadow,light:null,sprites:[],seed:rand(100)};
  if(intensity){
    const l=new THREE.PointLight(0xff8436,intensity,34,1.55);l.position.copy(pos).y+=.25;
    if(shadow){l.castShadow=true;l.shadow.mapSize.set(512,512);l.shadow.bias=-.004;l.shadow.normalBias=.04;l.shadow.camera.near=.3;l.shadow.camera.far=30;}
    arena.add(l);f.light=l;
  }
  const n=shadow?9:6;
  for(let i=0;i<n;i++){const s=new THREE.Sprite(new THREE.SpriteMaterial({map:softTex,blending:THREE.AdditiveBlending,depthWrite:false,transparent:true}));
    arena.add(s);f.sprites.push({s,life:i/n,ox:0,oz:0,sp:rand(.8,1.3)});}
  fires.push(f);
}

// drifting embers
const EMB_N=140,embPos=new Float32Array(EMB_N*3),embData=[];
let embers;
export function buildEmbers(){
  for(let i=0;i<EMB_N;i++)embData.push({f:null,life:rand(),sp:rand(.5,1.2),dx:0,dz:0});
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(embPos,3));
  embers=new THREE.Points(g,new THREE.PointsMaterial({map:softTex,color:new THREE.Color(3,1.1,.25),size:.07,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false}));
  embers.frustumCulled=false;scene.add(embers);
}
export function updateEnvironment(dt,t){
  if(animateArena)animateArena(dt,t);
  for(const f of fires){
    const n=Math.sin(t*11+f.seed)*.5+Math.sin(t*23.7+f.seed*2)*.3+Math.sin(t*5.1+f.seed*3)*.2;
    if(f.light){f.light.intensity=f.base*(1+n*.16);f.light.position.x=f.pos.x+Math.sin(t*9+f.seed)*.05;f.light.position.z=f.pos.z+Math.cos(t*7.3+f.seed)*.05;}
    for(const p of f.sprites){
      p.life+=dt*p.sp*1.6;
      if(p.life>=1){p.life=0;p.ox=rand(-.12,.12)*f.size;p.oz=rand(-.12,.12)*f.size;}
      const k=p.life,sc=f.size*(.75-.5*k)*(1+.15*Math.sin(t*20+p.sp*9));
      p.s.position.set(f.pos.x+p.ox*(1-k),f.pos.y+k*.85*f.size,f.pos.z+p.oz*(1-k));
      p.s.scale.set(sc,sc*1.5,1);
      p.s.material.color.setRGB(2.6,1.5-k*1.2,.5-k*.45);p.s.material.opacity=Math.min(1,k*8)*(1-k);
    }
  }
  for(let i=0;i<EMB_N;i++){
    const e=embData[i];e.life+=dt*e.sp*.3;
    if(e.life>=1||!e.f){e.life=0;e.f=fires[(Math.random()*fires.length)|0];e.dx=rand(-.5,.5);e.dz=rand(-.5,.5);e.ph=rand(TAU);}
    const k=e.life;embPos[i*3]=e.f.pos.x+e.dx*k*2+Math.sin(t*2+e.ph)*.2*k;embPos[i*3+1]=e.f.pos.y+k*4.5;embPos[i*3+2]=e.f.pos.z+e.dz*k*2+Math.cos(t*1.7+e.ph)*.2*k;
  }
  embers.geometry.attributes.position.needsUpdate=true;
  for(const b of banners){const p=b.m.geometry.attributes.position,a=p.array;
    for(let i=0;i<a.length;i+=3){const y=-b.base[i+1]/2.6;a[i+2]=Math.sin(t*1.6+b.seed+y*4+b.base[i]*1.5)*.09*y;}
    p.needsUpdate=true;}
}
