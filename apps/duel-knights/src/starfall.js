import * as THREE from 'three';
import {TAU,rand} from './util.js';
import {cv,tex,groundCanvas,brickCanvas} from './textures.js';

/* Starfall Cloister. Scenery begins outside the 8.6 m combat radius.
   Repeated masonry is instanced; the aurora is one 96-triangle ribbon.
   No new assets, physics, shadow maps beyond the four braziers, or render passes. */
export function buildStarfall(root,{addFire,addBanner}){
  const stone=new THREE.MeshStandardMaterial({color:0x596474,roughness:.93,envMapIntensity:.3});
  const edge=new THREE.MeshStandardMaterial({color:0x7e858a,roughness:.85,envMapIntensity:.35});
  const bronze=new THREE.MeshStandardMaterial({color:0x9e7840,metalness:.72,roughness:.48});
  const dark=new THREE.MeshStandardMaterial({color:0x242a34,metalness:.5,roughness:.65});
  const glow=new THREE.MeshBasicMaterial({color:new THREE.Color(.55,1.5,1.7)});
  const mesh=(g,m,x=0,y=0,z=0)=>{const o=new THREE.Mesh(g,m);o.position.set(x,y,z);root.add(o);return o;};
  const batch=(g,m,poses,shadow=false)=>{
    const o=new THREE.InstancedMesh(g,m,poses.length),dummy=new THREE.Object3D();
    poses.forEach(([x,y,z,ry=0,sx=1,sy=1,sz=1],i)=>{
      dummy.position.set(x,y,z);dummy.rotation.set(0,ry,0);dummy.scale.set(sx,sy,sz);dummy.updateMatrix();o.setMatrixAt(i,dummy.matrix);
    });o.castShadow=shadow;o.receiveShadow=true;root.add(o);return o;
  };
  const ring=(r,w,y,mat)=>{const o=mesh(new THREE.RingGeometry(r-w,r,96),mat,0,y,0);o.rotation.x=-Math.PI/2;return o;};

  // Weathered radial paving with a bronze compass inlaid into the floor texture.
  const paving=groundCanvas(),ctx=paving.getContext('2d');
  ctx.fillStyle='rgba(29,55,73,.24)';ctx.fillRect(0,0,1024,1024);
  ctx.strokeStyle='#a28e60';ctx.lineWidth=2;
  for(const radius of [80,104,345,355]){ctx.beginPath();ctx.arc(512,512,radius,0,TAU);ctx.stroke();}
  for(let i=0;i<16;i++){
    const a=i/16*TAU;ctx.save();ctx.translate(512,512);ctx.rotate(a);
    ctx.fillStyle=i%4===0?'#b7a26d':'#6f7a7d';ctx.beginPath();ctx.moveTo(0,-(i%4===0?305:220));ctx.lineTo(17,-115);ctx.lineTo(0,-138);ctx.lineTo(-17,-115);ctx.closePath();ctx.fill();
    ctx.fillRect(-2,-350,4,i%2?12:23);ctx.restore();
  }
  const floor=mesh(new THREE.CircleGeometry(12,96),new THREE.MeshStandardMaterial({map:tex(paving),bumpMap:tex(paving,false),bumpScale:.85,roughness:.9,metalness:.08,envMapIntensity:.4}));
  floor.rotation.x=-Math.PI/2;floor.receiveShadow=true;
  mesh(new THREE.CylinderGeometry(12,12.6,.8,64),stone,0,-.42,0);
  ring(11.9,.35,.015,bronze);ring(9.05,.055,.018,bronze);
  // Low, continuous parapet makes the level boundary visible without hiding the view.
  const brick=tex(brickCanvas());brick.wrapS=brick.wrapT=THREE.RepeatWrapping;brick.repeat.set(18,.5);
  const parapet=new THREE.MeshStandardMaterial({map:brick,color:0xa3b3c8,roughness:.95,side:THREE.DoubleSide});
  const wall=mesh(new THREE.CylinderGeometry(11.6,11.6,.85,64,1,true),parapet,0,.425,0);wall.receiveShadow=true;
  ring(11.95,.7,.87,edge);

  // Eight open gothic bays, one broken: instanced columns, capitals and arch ribs.
  const columns=[],caps=[],feet=[],spires=[],arches=[];
  const arch=new THREE.Shape();
  arch.moveTo(-2.25,4.5);arch.quadraticCurveTo(-2.35,6.65,0,8.25);
  arch.quadraticCurveTo(2.35,6.65,2.25,4.5);arch.lineTo(1.7,4.5);
  arch.quadraticCurveTo(1.72,6.05,0,7.5);arch.quadraticCurveTo(-1.72,6.05,-1.7,4.5);arch.closePath();
  const archGeo=new THREE.ExtrudeGeometry(arch,{depth:.55,bevelEnabled:false,curveSegments:8});archGeo.translate(0,0,-.275);
  for(let i=0;i<8;i++){
    const a=i/8*TAU,x=Math.sin(a)*12.2,z=Math.cos(a)*12.2;
    if(i!==3)arches.push([x,0,z,a]);
    for(const side of [-1,1]){
      const px=x+Math.cos(a)*side*1.98,pz=z-Math.sin(a)*side*1.98;
      const h=i===3?(side===1?2.8:4):4.5;
      columns.push([px,h/2,pz,a,.58,h,.68]);
      caps.push([px,h,pz,a,.86,.24,.9]);feet.push([px,.25,pz,a,.95,.5,1]);
      if(i!==3)spires.push([px,5.1,pz,a]);
    }
    if(i%2===1&&i!==3){
      const slot=i===1?0:1;
      addBanner(x*.94,4.5,z*.94,a+Math.PI,slot);
      const rod=mesh(new THREE.CylinderGeometry(.04,.04,1.6,6),bronze,x*.94,4.5,z*.94);rod.rotation.set(0,a,Math.PI/2);
    }
  }
  const box=new THREE.BoxGeometry(1,1,1);
  batch(box,stone,columns,true);batch(box,edge,caps);batch(box,stone,feet);
  batch(new THREE.ConeGeometry(.42,1,4),edge,spires);
  batch(archGeo,stone,arches); // decorative overhead ribs do not need six-face fire shadows
  const rubble=[];
  for(let i=0;i<16;i++){const a=2.3+rand(-.15,.15),r=rand(10.7,11.3);rubble.push([Math.sin(a)*r,.18,Math.cos(a)*r,rand(TAU),rand(.25,.65),rand(.2,.55),rand(.3,.65)]);}
  batch(new THREE.DodecahedronGeometry(.6,0),stone,rubble);

  // Four amber braziers keep the steel and heraldry in the original game's palette.
  const stems=[],bowls=[];
  for(let i=0;i<4;i++){
    const a=Math.PI/4+i/4*TAU,x=Math.sin(a)*9.85,z=Math.cos(a)*9.85;
    stems.push([x,.65,z]);bowls.push([x,1.4,z]);
    addFire(new THREE.Vector3(x,1.62,z),1,i%2?32:72,i%2===0);
  }
  batch(new THREE.CylinderGeometry(.16,.34,1.3,8),dark,stems);
  batch(new THREE.CylinderGeometry(.48,.2,.34,10),bronze,bowls);

  // The reliquary: a turning astrolabe, held above a distant altar. All glow is
  // emissive geometry: it works without bloom and never adds a dynamic light.
  mesh(new THREE.CylinderGeometry(2.9,3.5,1.2,8),stone,0,.1,18);
  mesh(new THREE.CylinderGeometry(1.7,2.4,1.8,8),edge,0,1.5,18);
  const halo=new THREE.Group();halo.position.set(0,7.2,18);root.add(halo);
  const torus=(r,t,mat,parent=halo)=>{const o=new THREE.Mesh(new THREE.TorusGeometry(r,t,5,48),mat);parent.add(o);return o;};
  torus(3.5,.16,bronze);torus(3.22,.035,glow);
  const inner=new THREE.Group();halo.add(inner);inner.rotation.y=.7;torus(2.7,.10,bronze,inner);
  const orbit=new THREE.Group();halo.add(orbit);orbit.rotation.x=1.1;torus(2.25,.085,bronze,orbit);
  const star=new THREE.Mesh(new THREE.OctahedronGeometry(.65,0),glow);star.scale.y=1.9;halo.add(star);
  for(let i=0;i<12;i++){
    const a=i/12*TAU,tick=new THREE.Mesh(new THREE.BoxGeometry(.09,i%3===0?.5:.24,.13),bronze);
    tick.position.set(Math.sin(a)*3.5,Math.cos(a)*3.5,0);tick.rotation.z=-a;halo.add(tick);
  }
  const supports=[[-3.9,2.4,18,0,.7,4.8,.8],[3.9,2.4,18,0,.7,4.8,.8]];
  batch(box,stone,supports);

  // Faceted peaks rise out of the fog. One instanced draw for each mountain band.
  const peaks=[],distant=[];
  for(let i=0;i<32;i++){
    const a=i/32*TAU,r=48+(i%3)*12,h=13+(i*17%23);
    peaks.push([Math.sin(a)*r,-12+h/2,Math.cos(a)*r,a,7+(i%4)*2,h,8+(i%3)*3]);
    const r2=105+(i%4)*12,h2=24+(i*13%32);
    distant.push([Math.sin(a+.1)*r2,-20+h2/2,Math.cos(a+.1)*r2,a,13,h2,17]);
  }
  const peakGeo=new THREE.ConeGeometry(1,1,5);
  batch(peakGeo,new THREE.MeshStandardMaterial({color:0x202d40,roughness:1,flatShading:true,envMapIntensity:.1}),peaks);
  batch(peakGeo,new THREE.MeshBasicMaterial({color:0x26394b}),distant);
  // A quiet haze below the ledge; an opaque disk avoids stacked transparent clouds.
  const haze=mesh(new THREE.CircleGeometry(230,64),new THREE.MeshBasicMaterial({color:0x182735}),0,-10,0);haze.rotation.x=-Math.PI/2;

  // Painted light curtain: one small procedural texture, no full-screen effect.
  const c=cv(128,128),g=c.getContext('2d'),gradient=g.createLinearGradient(0,0,0,128);
  gradient.addColorStop(0,'rgba(57,117,144,0)');gradient.addColorStop(.52,'rgba(64,138,157,.06)');
  gradient.addColorStop(.85,'rgba(89,186,172,.24)');gradient.addColorStop(1,'rgba(82,154,180,0)');
  g.fillStyle=gradient;g.fillRect(0,0,128,128);
  const vertices=[],uvs=[],indices=[];
  for(let i=0;i<=48;i++){
    const a=-1.25+i/48*2.5,y=55+Math.sin(a*4)*8;
    vertices.push(Math.sin(a)*145,y,Math.cos(a)*145,Math.sin(a)*145,y+26,Math.cos(a)*145);
    uvs.push(i/48,0,i/48,1);
    if(i<48){const k=i*2;indices.push(k,k+1,k+2,k+1,k+3,k+2);}
  }
  const ribbonGeo=new THREE.BufferGeometry();ribbonGeo.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));
  ribbonGeo.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));ribbonGeo.setIndex(indices);
  const ribbon=mesh(ribbonGeo,new THREE.MeshBasicMaterial({map:tex(c),transparent:true,side:THREE.DoubleSide,depthWrite:false,blending:THREE.AdditiveBlending,fog:false}));
  return (dt,t)=>{
    inner.rotation.y=.7+t*.08;orbit.rotation.y=-t*.045;star.rotation.y=t*.16;
    star.position.y=Math.sin(t*.65)*.16;ribbon.material.opacity=.7+Math.sin(t*.12)*.15;
  };
}
