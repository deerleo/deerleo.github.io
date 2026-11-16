import * as THREE from 'three';
import {TAU} from './util.js';
import {cv,tex,groundCanvas} from './textures.js';

/* Wyrmfire Crucible: a dragon-carved forge above a molten chasm.
   All scenery is outside the existing combat radius. Repeated pieces share
   instance batches; lava moves by a UV offset, never by repainting a canvas.
   Decorative glow has no lights, shadows, particles or postprocessing of its own. */
export function buildWyrmfire(root,{addFire,addBanner}){
  const basalt=new THREE.MeshStandardMaterial({color:0x35313b,roughness:.88,metalness:.12,envMapIntensity:.3});
  const carved=new THREE.MeshStandardMaterial({color:0x69626b,roughness:.83,metalness:.16,envMapIntensity:.4});
  const bronze=new THREE.MeshStandardMaterial({color:0x98703b,roughness:.48,metalness:.7});
  const iron=new THREE.MeshStandardMaterial({color:0x252029,roughness:.6,metalness:.75});
  const black=new THREE.MeshBasicMaterial({color:0x10080a});
  const ember=new THREE.MeshBasicMaterial({color:new THREE.Color(2.8,.85,.15)});
  const pale=new THREE.MeshStandardMaterial({color:0xb1a18a,roughness:.75,metalness:.12});
  const box=new THREE.BoxGeometry(1,1,1),rock=new THREE.IcosahedronGeometry(1,0);
  const cone=new THREE.ConeGeometry(1,1,6),column=new THREE.CylinderGeometry(.72,1,1,6);
  const groups=new Map(),dummy=new THREE.Object3D();
  const piece=(geo,mat,pos,scale=[1,1,1],rot=[0,0,0],shadow=false)=>{
    const key=geo.uuid+mat.uuid+shadow;
    if(!groups.has(key))groups.set(key,{geo,mat,shadow,poses:[]});
    groups.get(key).poses.push({pos,scale,rot});
  };
  const mesh=(geo,mat,pos=[0,0,0])=>{const m=new THREE.Mesh(geo,mat);m.position.set(...pos);root.add(m);return m;};
  const beam=(a,b,width,depth,mat=bronze)=>{
    const start=new THREE.Vector3(...a),end=new THREE.Vector3(...b),direction=end.clone().sub(start);
    const q=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),direction.clone().normalize());
    const e=new THREE.Euler().setFromQuaternion(q);
    piece(box,mat,start.add(end).multiplyScalar(.5).toArray(),[width,direction.length(),depth],[e.x,e.y,e.z]);
  };
  const horizontalRing=(inner,outer,y,mat)=>{
    const m=mesh(new THREE.RingGeometry(inner,outer,64),mat,[0,y,0]);m.rotation.x=-Math.PI/2;return m;
  };
  // Local seeded decoration keeps repeated previews consistent, independent of combat randomness.
  let seed=1961;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};

  // Basalt paving and a hammered bronze seal. The arena is still level and unobstructed.
  const paving=groundCanvas(),g=paving.getContext('2d');
  g.fillStyle='rgba(20,15,28,.48)';g.fillRect(0,0,1024,1024);
  g.strokeStyle='#a7793d';g.lineWidth=4;
  for(const r of [90,116,347,355]){g.beginPath();g.arc(512,512,r,0,TAU);g.stroke();}
  for(let i=0;i<8;i++){
    const a=i/8*TAU;g.save();g.translate(512,512);g.rotate(a);
    g.beginPath();g.moveTo(-23,-122);g.lineTo(0,-265);g.lineTo(23,-122);g.lineTo(0,-153);g.closePath();
    g.fillStyle='#6b4b31';g.fill();g.stroke();
    g.lineWidth=2;g.beginPath();g.moveTo(-15,-319);g.lineTo(0,-339);g.lineTo(15,-319);g.moveTo(0,-339);g.lineTo(0,-298);g.stroke();g.restore();
  }
  const floor=mesh(new THREE.CircleGeometry(12,80),new THREE.MeshStandardMaterial({map:tex(paving),bumpMap:tex(paving,false),bumpScale:.85,roughness:.86,metalness:.12,envMapIntensity:.35}));
  floor.rotation.x=-Math.PI/2;floor.receiveShadow=true;
  mesh(new THREE.CylinderGeometry(12,13,1.25,48),basalt,[0,-.65,0]);
  horizontalRing(11.25,11.95,.7,bronze);
  const wall=mesh(new THREE.CylinderGeometry(11.6,11.6,.7,64,1,true),new THREE.MeshStandardMaterial({color:0x403540,roughness:.85,side:THREE.DoubleSide}),[0,.35,0]);wall.receiveShadow=true;
  horizontalRing(8.98,9.04,.015,bronze);
  // Hot seams are beyond the fighting floor, never mistaken for a damaging hazard.
  horizontalRing(12.02,12.13,-.25,ember);

  // A cavern dome occludes the shared outdoor sky without changing or rebuilding it.
  const sky=cv(4,128),sg=sky.getContext('2d'),gradient=sg.createLinearGradient(0,0,0,128);
  gradient.addColorStop(0,'#08080f');gradient.addColorStop(.45,'#100b15');gradient.addColorStop(.7,'#29121a');gradient.addColorStop(1,'#4b2018');
  sg.fillStyle=gradient;sg.fillRect(0,0,4,128);
  mesh(new THREE.SphereGeometry(95,20,12),new THREE.MeshBasicMaterial({map:tex(sky),side:THREE.BackSide,fog:false}));

  // Lava crust: one opaque surface, with warm fissures painted between irregular cells.
  const lavaCanvas=cv(512,512),lg=lavaCanvas.getContext('2d');
  lg.fillStyle='#d74b12';lg.fillRect(0,0,512,512);lg.strokeStyle='#ffad36';lg.lineWidth=3;
  for(let y=-1;y<9;y++)for(let x=-1;x<9;x++){
    const cx=x*68+(y%2)*30,cy=y*62;
    lg.beginPath();for(let k=0;k<6;k++){const a=k/6*TAU,r=24+random()*13;lg.lineTo(cx+Math.cos(a)*r,cy+Math.sin(a)*r);}
    lg.closePath();lg.fillStyle=['#29131a','#451a19','#61231a'][Math.floor(random()*3)];lg.fill();lg.stroke();
  }
  const lavaMap=tex(lavaCanvas);lavaMap.wrapS=lavaMap.wrapT=THREE.RepeatWrapping;lavaMap.repeat.set(9,9);
  const lavaMat=new THREE.MeshBasicMaterial({map:lavaMap,color:new THREE.Color(1.5,.75,.38)});
  const lake=mesh(new THREE.CircleGeometry(85,64),lavaMat,[0,-3.8,0]);lake.rotation.x=-Math.PI/2;
  // Lavafalls use a single shared, repeating texture. Six ribbons cost one draw.
  const fallCanvas=cv(64,128),fg=fallCanvas.getContext('2d');fg.fillStyle='#962b13';fg.fillRect(0,0,64,128);
  for(let i=0;i<70;i++){
    fg.fillStyle=i%3?'#df631c':'#ffc15d';const x=random()*64,y=random()*128,w=1+random()*5,h=8+random()*28;
    fg.fillRect(x,y,w,h);fg.fillRect(x,y-128,w,h);
  }
  const fallMap=tex(fallCanvas);fallMap.wrapT=THREE.RepeatWrapping;fallMap.repeat.y=3;
  const fallMat=new THREE.MeshBasicMaterial({map:fallMap,color:new THREE.Color(1.6,.9,.55),side:THREE.DoubleSide});
  const fallGeo=new THREE.PlaneGeometry(1,1);
  for(let i=0;i<6;i++){
    const a=(i+.5)/6*TAU,r=27+(i%2)*6,h=10+(i%3)*3,x=Math.sin(a)*r,z=Math.cos(a)*r;
    piece(column,basalt,[x,(h-4)/2,z],[3,h+4,3]);
    piece(fallGeo,fallMat,[Math.sin(a)*(r-2.9),h/2-3.7,Math.cos(a)*(r-2.9)],[1.1,h,1],[0,a+Math.PI,0]);
  }
  // Basalt organ pipes and hanging stalactites are instanced and never cast shadows.
  for(let i=0;i<48;i++){
    const a=i/48*TAU,r=34+random()*25,h=8+random()*19;
    piece(column,basalt,[Math.sin(a)*r,h/2-4,Math.cos(a)*r],[2+random()*3,h,2+random()*3],[0,a,0]);
    if(i%2===0)piece(cone,basalt,[Math.sin(a)*r,28+random()*8,Math.cos(a)*r],[2,8+random()*6,2],[Math.PI,0,a*.1]);
  }

  // Six runic stelae frame the ring; their light is painted, not a point light.
  const runeCanvas=cv(128,256),rg=runeCanvas.getContext('2d');rg.strokeStyle='#ffe0a0';rg.lineWidth=6;rg.lineCap='square';
  for(let i=0;i<3;i++){
    const y=35+i*78;rg.beginPath();rg.moveTo(64,y-18);rg.lineTo(64,y+32);
    rg.moveTo(40,y);rg.lineTo(64,y-18);rg.lineTo(88,y);rg.moveTo(40,y+15);rg.lineTo(64,y+32);rg.lineTo(88,y+15);rg.stroke();
  }
  const runeMat=new THREE.MeshBasicMaterial({map:tex(runeCanvas),color:new THREE.Color(2.2,1,.4),alphaTest:.3});
  for(let i=0;i<6;i++){
    const a=(i+.5)/6*TAU,x=Math.sin(a)*11.2,z=Math.cos(a)*11.2;
    piece(column,carved,[x,2.45,z],[.65,4.9,.65],[0,a,0],true);
    piece(box,bronze,[x,.35,z],[1.25,.4,1.25],[0,a,0]);piece(box,bronze,[x,4.6,z],[1.05,.2,1.05],[0,a,0]);
    piece(cone,iron,[x,5.2,z],[.8,.85,.8],[0,a,0]);
    piece(fallGeo,runeMat,[Math.sin(a)*10.58,3,Math.cos(a)*10.58],[.65,1.8,1],[0,a+Math.PI,0]);
  }
  const bowl=new THREE.CylinderGeometry(.43,.22,.3,8);
  for(let i=0;i<4;i++){
    const a=Math.PI/4+i/4*TAU,x=Math.sin(a)*9.85,z=Math.cos(a)*9.85;
    piece(column,iron,[x,.65,z],[.35,1.3,.35]);piece(bowl,bronze,[x,1.4,z]);
    addFire(new THREE.Vector3(x,1.6,z),1,i%2?32:72,i%2===0);
    const bx=Math.sin(a)*11.1,bz=Math.cos(a)*11.1;
    piece(box,iron,[bx,2.1,bz],[.1,4.2,.1]);
    beam([bx-Math.cos(a)*.8,4.2,bz+Math.sin(a)*.8],[bx+Math.cos(a)*.8,4.2,bz-Math.sin(a)*.8],.07,.07);
    addBanner(bx,4.2,bz,a+Math.PI,i%2);
  }

  // The Wyrm Gate: a monumental dragon effigy, visibly carved from the same stone
  // as the arena. Horns, cheek armour and fangs surround the open furnace mouth.
  piece(column,basalt,[0,-.2,20],[7,2.8,5]);
  piece(box,basalt,[0,1.5,20],[12,1,6]);
  piece(rock,carved,[0,8.1,20],[4.7,3.5,2.8]);
  for(const s of [-1,1]){
    piece(rock,carved,[s*3.3,6.6,18.8],[1.5,2.2,1.8],[0,0,s*.18]);
    piece(box,carved,[s*2.65,4.4,18.2],[1.2,3.2,2],[0,0,-s*.16]);
    piece(rock,carved,[s*1.65,6.5,16.7],[1.9,.85,2.1]);
    piece(box,carved,[s*2.1,8.1,17.6],[2.6,.48,1.2],[0,0,s*.20]);
    piece(rock,black,[s*2.1,7.75,17.13],[1.18,.65,.4],[0,0,s*.2]);
    piece(rock,ember,[s*2.1,7.8,16.83],[.72,.22,.12],[0,0,s*.2]);
    piece(rock,black,[s*.85,6.75,14.9],[.35,.2,.16]);
    // Swept, tapered horns: four low-poly sections, one instance batch.
    const points=[[s*3.2,9.5,20],[s*4.1,11,20.5],[s*4.65,12.6,21.2],[s*4.8,14.1,22.1],[s*4.4,15,23.1]];
    for(let i=0;i<4;i++){
      const a=new THREE.Vector3(...points[i]),b=new THREE.Vector3(...points[i+1]),d=b.clone().sub(a),q=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),d.clone().normalize());
      const e=new THREE.Euler().setFromQuaternion(q),radius=.8-i*.18;
      piece(column,i%2?bronze:carved,a.add(b).multiplyScalar(.5).toArray(),[radius,d.length()+.14,radius],[e.x,e.y,e.z]);
    }
    for(let i=0;i<3;i++)piece(cone,carved,[s*(3.8+i*.3),7.7-i*.8,20.2],[.55,1.8,.6],[0,0,-s*1.15]);
  }
  piece(rock,carved,[0,6.5,16],[2.5,.85,1.5]);
  piece(rock,carved,[0,3.25,17.4],[3.7,.8,2.3]);
  piece(box,bronze,[0,2.6,17.7],[6.5,.28,3]);
  // Hanging upper fangs and smaller lower teeth, with a clear mouth opening.
  for(let i=0;i<8;i++){
    const x=(i-3.5)*.7,h=i===0||i===7?1.4:.7;
    piece(cone,pale,[x,5.85-h/2,15.7],[.22,h,.32],[Math.PI,0,0]);
    if(i%2===0)piece(cone,pale,[x,3.8,15.8],[.18,.65,.25]);
  }
  // A bound ember hangs in the furnace, turning and bobbing without casting shadows.
  const heart=mesh(new THREE.OctahedronGeometry(.85,0),ember,[0,4.65,16.6]);heart.scale.set(.8,1.1,.8);
  const links=new THREE.TorusGeometry(.28,.07,4,8);
  for(const s of [-1,1])for(let i=0;i<18;i++){
    const u=i/17;piece(links,iron,[s*(3.6+u*5.1),10.2-u*6.7-Math.sin(u*Math.PI)*1.8,21-u*3],[1,1,1],[0,i%2?Math.PI/2:0,s*.4]);
  }
  for(const s of [-1,1])piece(column,carved,[s*8.7,1.6,18],[1.1,4,1.1]);

  // Commit repeated geometry once per geometry/material/shadow combination.
  for(const {geo,mat,shadow,poses} of groups.values()){
    const batch=new THREE.InstancedMesh(geo,mat,poses.length);batch.castShadow=shadow;batch.receiveShadow=true;
    poses.forEach(({pos,scale,rot},i)=>{dummy.position.set(...pos);dummy.scale.set(...scale);dummy.rotation.set(...rot);dummy.updateMatrix();batch.setMatrixAt(i,dummy.matrix);});
    root.add(batch);
  }
  return (dt,t)=>{
    fallMap.offset.y=t*.075;heart.rotation.y=t*.22;heart.position.y=4.65+Math.sin(t*.8)*.12;
    const pulse=1+Math.sin(t*.7)*.035;lavaMat.color.setRGB(1.5*pulse,.75*pulse,.38*pulse);
  };
}
