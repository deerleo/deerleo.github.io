(function(){
'use strict';
const $=id=>document.getElementById(id);
const canvas=$('view'), overlay=$('overlay'), hud=$('hud');
const fail=t=>{ $('brief').textContent=t; $('go').hidden=true; $('load').hidden=true; };
if(!window.THREE||!THREE.GLTFLoader||!THREE.EffectComposer){ fail('The 3D engine could not be loaded. Check your connection and reload the page.'); return; }
const rand=(a,b)=>a+Math.random()*(b-a), clamp=(v,a,b)=>Math.max(a,Math.min(b,v)), lerp=(a,b,t)=>a+(b-a)*t;

/* ---------- renderer & scene ---------- */
let renderer;
try{ renderer=new THREE.WebGLRenderer({canvas,antialias:false,powerPreference:'high-performance'}); }
catch(e){ fail('This browser could not start WebGL. Try Chrome or Safari with hardware acceleration on.'); return; }
const LOWQ=/[?&#]lowq/.test(location.href); let PR=LOWQ?.5:Math.min(window.devicePixelRatio||1,1.5);
renderer.setPixelRatio(PR);
renderer.outputEncoding=THREE.sRGBEncoding;
renderer.toneMapping=THREE.ACESFilmicToneMapping; renderer.toneMappingExposure=.37;
renderer.physicallyCorrectLights=false;
renderer.shadowMap.enabled=true; renderer.shadowMap.type=THREE.PCFSoftShadowMap;
const scene=new THREE.Scene();
scene.fog=new THREE.FogExp2(0x4b4a55,0.0085);
const camera=new THREE.PerspectiveCamera(72,1,0.04,900);
camera.rotation.order='YXZ'; scene.add(camera);
const maxAniso=renderer.capabilities.getMaxAnisotropy();

/* ---------- post-processing ---------- */
const FinalShader={ uniforms:{tDiffuse:{value:null},time:{value:0},hurt:{value:0},sunUv:{value:new THREE.Vector2(.5,.5)},sunVis:{value:0},aspect:{value:1}},
  vertexShader:'varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }',
  fragmentShader:`uniform sampler2D tDiffuse; uniform float time; uniform float hurt; uniform vec2 sunUv; uniform float sunVis; uniform float aspect; varying vec2 vUv;
  void main(){ vec2 c=vUv-.5; float r2=dot(c,c); float ca=.006*r2;
    vec3 col=clamp(vec3(texture2D(tDiffuse,vUv+c*ca).r,texture2D(tDiffuse,vUv).g,texture2D(tDiffuse,vUv-c*ca).b),0.,4.);
    if(sunVis>.001){ // screen-space light shafts: march toward the sun, bright sky leaks past dark occluders
      vec2 dlt=(sunUv-vUv)/24.; vec2 p=vUv; float acc=0., wgt=1.; float jit=fract(sin(dot(vUv,vec2(41.3,289.1))+time)*4375.5);
      p+=dlt*jit;
      for(int i=0;i<24;i++){ p+=dlt; vec3 s=min(texture2D(tDiffuse,clamp(p,0.,1.)).rgb,vec3(1.)); acc+=smoothstep(.62,.95,dot(s,vec3(.3,.5,.2)))*wgt; wgt*=.955; }
      vec2 sd=(vUv-sunUv)*vec2(aspect,1.); float near=exp(-dot(sd,sd)*2.2);
      col+=vec3(1.,.62,.32)*acc/24.*sunVis*(.07+.26*near); col+=vec3(1.,.6,.3)*near*near*.05*sunVis; }
    col=clamp(col,0.,1.);
    col*=mix(1.,.42,smoothstep(.1,.6,r2));
    float l=dot(col,vec3(.2126,.7152,.0722)); col=mix(vec3(l),col,.96-hurt*.5);
    col=mix(col*vec3(.86,1.,1.1),col*vec3(1.1,1.,.86),smoothstep(.05,.6,l));
    col=mix(col,col*col*(3.-2.*col),.35); col=col*.97+vec3(.006,.011,.013);
    col=pow(max(col,0.),vec3(1./2.2));
    float n=fract(sin(dot(vUv*vec2(1731.,977.)+fract(time)*61.,vec2(12.9898,78.233)))*43758.5453);
    col+=(n-.5)*.028; gl_FragColor=vec4(col,1.); }` };
let composer=null, finalPass=null;
(function(){ try{
  const gl2=renderer.capabilities.isWebGL2, hf=gl2&&!!renderer.extensions.get('EXT_color_buffer_float');
  const RT=gl2?THREE.WebGLMultisampleRenderTarget:THREE.WebGLRenderTarget;
  const rt=new RT(4,4,{type:hf?THREE.HalfFloatType:THREE.UnsignedByteType,format:THREE.RGBAFormat,minFilter:THREE.LinearFilter,magFilter:THREE.LinearFilter});
  composer=new THREE.EffectComposer(renderer,rt);
  composer.addPass(new THREE.RenderPass(scene,camera));
  composer.addPass(new THREE.UnrealBloomPass(new THREE.Vector2(4,4),.3,.7,.82));
  finalPass=new THREE.ShaderPass(FinalShader); composer.addPass(finalPass);
}catch(e){ composer=null; } })();
function resize(){ const w=window.innerWidth,h=window.innerHeight; renderer.setSize(w,h,false); if(composer) composer.setSize(Math.floor(w*PR),Math.floor(h*PR)); camera.aspect=w/h; camera.updateProjectionMatrix(); }
window.addEventListener('resize',resize); resize();

/* ---------- asset loading ---------- */
const A={}, mgr=THREE.DefaultLoadingManager; let ready=false, loadErr=false;
mgr.onProgress=(u,n,t)=>{ $('loadbar').style.width=Math.round(n/t*100)+'%'; };
mgr.onError=u=>{ if(!ready&&!loadErr){ loadErr=true; fail('Some game files could not be loaded ('+u.split('/').pop()+'). Reload the page to try again.'); } };
const gltf=new THREE.GLTFLoader(), TL=new THREE.TextureLoader();
['bolt_action_rifle_7_62','service_pistol','stick_grenade','old_military_crate','wooden_military_crate','concrete_road_barrier_02','Barrel_01','barrel_03','ammo_box','vintage_radio_transceiver'].forEach(n=>gltf.load('assets/m/'+n+'/'+n+'.json',g=>{A[n]=g.scene;}));
gltf.load('assets/m/soldier/soldier.json',g=>{A.soldier=g;});
mgr.itemStart('sky');
fetch('assets/sky.txt').then(r=>{ if(!r.ok) throw new Error('sky'); return r.text(); }).then(b64=>{
  const bin=atob(b64), u8=new Uint8Array(bin.length); for(let i=0;i<bin.length;i++) u8[i]=bin.charCodeAt(i);
  const d=new THREE.RGBELoader().setDataType(THREE.FloatType).parse(u8.buffer);
  const t=new THREE.DataTexture(d.data,d.width,d.height,d.format,d.type); t.encoding=THREE.LinearEncoding; t.minFilter=t.magFilter=THREE.LinearFilter; t.generateMipmaps=false; t.flipY=true; t.needsUpdate=true;
  A.hdr=t; mgr.itemEnd('sky');
}).catch(()=>{ mgr.itemError('sky.txt'); });
function pbr(name,opts){
  const d=TL.load('assets/t/'+name+'_diff.jpg'), n=TL.load('assets/t/'+name+'_nor.jpg'), a=TL.load('assets/t/'+name+'_arm.jpg');
  [d,n,a].forEach(t=>{ t.wrapS=t.wrapT=THREE.RepeatWrapping; t.anisotropy=maxAniso; }); d.encoding=THREE.sRGBEncoding;
  return new THREE.MeshStandardMaterial(Object.assign({map:d,normalMap:n,roughnessMap:a,metalnessMap:a,aoMap:a,roughness:1,metalness:1},opts||{}));
}
const mSand=pbr('asphalt_02'), mPlaster=pbr('damaged_plaster',{roughness:.85}), mConc=pbr('concrete_wall_008',{roughness:.8,color:0xb8b2a8});
const contTint=(r,g,b)=>{ const m=pbr('container_side',{roughness:.6}); m.color.setRGB(r*.6,g*.6,b*.6); return m; };
const mCont=[contTint(1,1,1),pbr('rusty_painted_metal',{roughness:.65}),contTint(.5,.8,1.7),contTint(1.9,.8,.5),contTint(1.5,1.5,1.6),contTint(1.7,1.25,.45),contTint(.45,.55,.6)];
const mSteel=new THREE.MeshStandardMaterial({color:0x2c3236,roughness:.55,metalness:.6}), mLamp=new THREE.MeshBasicMaterial({color:0xffd9a0});
// wet ground: puddles and damp patches are generated in the shader from world position; rain rings animate inside the puddles
const wet={time:{value:0}};
mSand.onBeforeCompile=sh=>{ sh.uniforms.uTime=wet.time;
  sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vWp;').replace('#include <project_vertex>','#include <project_vertex>\nvWp=(modelMatrix*vec4(transformed,1.)).xyz;');
  sh.fragmentShader=sh.fragmentShader.replace('#include <common>',`#include <common>
    varying vec3 vWp; uniform float uTime;
    float h21(vec2 p){ p=fract(p*vec2(123.34,456.21)); p+=dot(p,p+45.32); return fract(p.x*p.y); }
    float vn(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f); return mix(mix(h21(i),h21(i+vec2(1,0)),f.x),mix(h21(i+vec2(0,1)),h21(i+vec2(1,1)),f.x),f.y); }
    float fbm(vec2 p){ float a=.5, s=0.; for(int i=0;i<4;i++){ s+=a*vn(p); p=p*2.03+17.; a*=.5; } return s; }
    vec2 ring(vec2 p,float t){ vec2 c=floor(p), f=fract(p)-.5; float h=h21(c); float ph=fract(t*.8+h*7.); vec2 d=f-(vec2(h21(c+7.),h21(c+13.))-.5)*.6; float r=length(d), w=r-ph*.42;
      return d/max(r,1e-3)*sin(w*46.)*smoothstep(.07,0.,abs(w))*(1.-ph); }
    float gPud, gDamp;`)
   .replace('#include <map_fragment>',`#include <map_fragment>
    { float n=fbm(vWp.xz*.11)+.25*vn(vWp.xz*.9)-.125; gPud=smoothstep(.56,.6,n); gDamp=smoothstep(.36,.56,n);
      diffuseColor.rgb*=mix(.8,.42,gDamp); diffuseColor.rgb=mix(diffuseColor.rgb,diffuseColor.rgb*.5,gPud); }`)
   .replace('#include <roughnessmap_fragment>',`#include <roughnessmap_fragment>
    roughnessFactor=mix(roughnessFactor*mix(.75,.4,gDamp),.035,gPud);`)
   .replace('#include <normal_fragment_maps>',`#include <normal_fragment_maps>
    { vec3 up=normalize(vNormal); normal=normalize(mix(normal,up,gPud*.97+gDamp*.3));
      vec2 rp=ring(vWp.xz*1.7,uTime)+ring(vWp.xz*2.9+5.3,uTime*1.3+.4); normal=normalize(normal+(viewMatrix*vec4(rp.x,0.,rp.y,0.)).xyz*.22*gPud); }`); };
mgr.onLoad=()=>{ if(ready||loadErr) return; ready=true; try{ init(); }catch(e){ console.error(e); fail('The game could not start: '+e.message); } };

/* ---------- soft sprite textures ---------- */
function canvasTex(size,draw){ const c=document.createElement('canvas'); c.width=c.height=size; draw(c.getContext('2d'),size); return new THREE.CanvasTexture(c); }
const tGlow=canvasTex(128,(g,s)=>{ const gr=g.createRadialGradient(64,64,0,64,64,64); gr.addColorStop(0,'rgba(255,250,225,1)'); gr.addColorStop(.25,'rgba(255,200,110,.8)'); gr.addColorStop(1,'rgba(255,140,40,0)'); g.fillStyle=gr; g.fillRect(0,0,s,s); });
const tFlash=canvasTex(128,(g,s)=>{ const gr=g.createRadialGradient(64,64,0,64,64,64); gr.addColorStop(0,'rgba(255,252,235,1)'); gr.addColorStop(.3,'rgba(255,205,120,.85)'); gr.addColorStop(1,'rgba(255,140,40,0)'); g.fillStyle=gr; g.beginPath(); for(let i=0;i<16;i++){ const a=i/16*Math.PI*2, r=i%2?64:rand(14,26); g.lineTo(64+Math.cos(a)*r,64+Math.sin(a)*r);} g.fill(); });
const tSmoke=canvasTex(128,(g,s)=>{ for(let i=0;i<26;i++){ const x=rand(34,94),y=rand(34,94),r=rand(14,34); const gr=g.createRadialGradient(x,y,0,x,y,r); gr.addColorStop(0,'rgba(255,255,255,.22)'); gr.addColorStop(1,'rgba(255,255,255,0)'); g.fillStyle=gr; g.fillRect(0,0,s,s);} });
const tHole=canvasTex(64,(g,s)=>{ const gr=g.createRadialGradient(32,32,0,32,32,32); gr.addColorStop(0,'rgba(10,8,6,1)'); gr.addColorStop(.3,'rgba(20,16,12,.9)'); gr.addColorStop(.6,'rgba(40,34,28,.35)'); gr.addColorStop(1,'rgba(40,34,28,0)'); g.fillStyle=gr; g.fillRect(0,0,s,s); });

/* ---------- world data ---------- */
const cols=[], worldMeshes=[];
function addCol(x,z,w,d,h){ cols.push({x0:x-w/2,x1:x+w/2,z0:z-d/2,z1:z+d/2,h}); }
function boxGeo(w,h,d,ts){ const g=new THREE.BoxGeometry(w,h,d), uv=g.attributes.uv, dm=[[d,h],[d,h],[w,d],[w,d],[w,h],[w,h]];
  for(let f=0;f<6;f++)for(let i=0;i<4;i++){ const k=f*4+i; uv.setXY(k,uv.getX(k)*dm[f][0]/ts,uv.getY(k)*dm[f][1]/ts);} g.setAttribute('uv2',uv.clone()); return g; }
function box(x,z,w,d,h,mat,ts){ const m=new THREE.Mesh(boxGeo(w,h,d,ts||3),mat); m.position.set(x,h/2,z); m.castShadow=m.receiveShadow=true; scene.add(m); worldMeshes.push(m); addCol(x,z,w,d,h); }
// normalise a loaded model: centred on x/z, base at y=0, unwanted nodes dropped
function proto(src,keep){
  const root=src.clone(true), drop=[]; root.traverse(o=>{ if(o!==root&&keep&&o.isMesh&&!keep(o.name)) drop.push(o); }); drop.forEach(o=>o.parent.remove(o));
  root.updateMatrixWorld(true); const b=new THREE.Box3().setFromObject(root), c=b.getCenter(new THREE.Vector3()), size=b.getSize(new THREE.Vector3());
  root.position.set(-c.x,-b.min.y,-c.z); const g=new THREE.Group(); g.add(root);
  g.traverse(o=>{ if(o.isMesh){ o.castShadow=o.receiveShadow=true; } }); return {g,size};
}
function place(p,x,y,z,ry,sx,sy,sz){ const o=p.g.clone(true); o.position.set(x,y,z); o.rotation.y=ry; o.scale.set(sx,sy===undefined?sx:sy,sz===undefined?sx:sz); scene.add(o); o.traverse(m=>{ if(m.isMesh) worldMeshes.push(m); }); return o; }

function resolve(p,r,feet){
  for(let i=0;i<cols.length;i++){ const c=cols[i]; if(feet>=c.h-0.05) continue;
    const nx=clamp(p.x,c.x0,c.x1), nz=clamp(p.z,c.z0,c.z1); let dx=p.x-nx, dz=p.z-nz; const d2=dx*dx+dz*dz;
    if(d2>=r*r) continue;
    if(d2>1e-8){ const d=Math.sqrt(d2); p.x=nx+dx/d*r; p.z=nz+dz/d*r; }
    else { const a=p.x-c.x0,b=c.x1-p.x,e=p.z-c.z0,f=c.z1-p.z,m=Math.min(a,b,e,f); if(m===a)p.x=c.x0-r; else if(m===b)p.x=c.x1+r; else if(m===e)p.z=c.z0-r; else p.z=c.z1+r; }
  }
}
function groundAt(x,z,feet){ let g=0; for(let i=0;i<cols.length;i++){ const c=cols[i]; if(c.h<=feet+0.35&&c.h>g&&x>c.x0-.2&&x<c.x1+.2&&z>c.z0-.2&&z<c.z1+.2) g=c.h; } return g; }
function segBlocked(ax,ay,az,bx,by,bz){
  const dx=bx-ax,dy=by-ay,dz=bz-az;
  for(let i=0;i<cols.length;i++){ const c=cols[i]; let t0=0,t1=1,a,b,inv;
    if(Math.abs(dx)<1e-9){ if(ax<c.x0||ax>c.x1) continue; } else { inv=1/dx; a=(c.x0-ax)*inv; b=(c.x1-ax)*inv; if(a>b){const s=a;a=b;b=s;} t0=Math.max(t0,a); t1=Math.min(t1,b); if(t0>t1) continue; }
    if(Math.abs(dz)<1e-9){ if(az<c.z0||az>c.z1) continue; } else { inv=1/dz; a=(c.z0-az)*inv; b=(c.z1-az)*inv; if(a>b){const s=a;a=b;b=s;} t0=Math.max(t0,a); t1=Math.min(t1,b); if(t0>t1) continue; }
    if(Math.abs(dy)<1e-9){ if(ay>c.h) continue; } else { inv=1/dy; a=(0-ay)*inv; b=(c.h-ay)*inv; if(a>b){const s=a;a=b;b=s;} t0=Math.max(t0,a); t1=Math.min(t1,b); if(t0>t1) continue; }
    return true;
  } return false;
}

/* ---------- flow field for enemy navigation ---------- */
const N=80, blocked=new Uint8Array(N*N), fdist=new Int16Array(N*N), queue=new Int32Array(N*N);
const cell=v=>clamp(Math.floor(v+40),0,N-1);
function buildGrid(){ for(let z=0;z<N;z++)for(let x=0;x<N;x++){ const wx=x-39.5,wz=z-39.5; for(const c of cols){ if(wx>c.x0-.45&&wx<c.x1+.45&&wz>c.z0-.45&&wz<c.z1+.45){ blocked[z*N+x]=1; break; } } } }
function flood(px,pz,fd){ const fdist=fd; fdist.fill(-1); let h=0,t=0; const s=cell(pz)*N+cell(px); fdist[s]=0; queue[t++]=s;
  while(h<t){ const k=queue[h++], x=k%N, z=(k/N)|0, d=fdist[k]+1;
    if(x>0&&fdist[k-1]<0&&!blocked[k-1]){fdist[k-1]=d;queue[t++]=k-1;}
    if(x<N-1&&fdist[k+1]<0&&!blocked[k+1]){fdist[k+1]=d;queue[t++]=k+1;}
    if(z>0&&fdist[k-N]<0&&!blocked[k-N]){fdist[k-N]=d;queue[t++]=k-N;}
    if(z<N-1&&fdist[k+N]<0&&!blocked[k+N]){fdist[k+N]=d;queue[t++]=k+N;}
  } }
function flowDir(x,z,out,fd){ const fdist=fd; const cx=cell(x),cz=cell(z); let best=fdist[cz*N+cx]; if(best<0||blocked[cz*N+cx]) best=1e9; let bx=0,bz=0;
  for(let dz=-1;dz<=1;dz++)for(let dx=-1;dx<=1;dx++){ if(!dx&&!dz) continue; const nx=cx+dx,nz=cz+dz; if(nx<0||nz<0||nx>=N||nz>=N) continue; const k=nz*N+nx; if(blocked[k]&&fdist[k]!==0) continue;
    if(dx&&dz&&(blocked[cz*N+nx]||blocked[nz*N+cx])) continue; const d=fdist[k]; if(d>=0&&d<best){best=d;bx=dx;bz=dz;} }
  if(!bx&&!bz){ out.x=0; out.z=0; return; }
  const tx=cx+bx-39.5-x, tz=cz+bz-39.5-z, l=Math.hypot(tx,tz)||1; out.x=tx/l; out.z=tz/l; }

/* ---------- audio ---------- */
let AC=null, master=null, noise=null;
function initAudio(){ if(AC){ if(AC.state==='suspended') AC.resume(); return; }
  try{ AC=new (window.AudioContext||window.webkitAudioContext)(); master=AC.createGain(); master.gain.value=.55; master.connect(AC.destination);
    noise=AC.createBuffer(1,AC.sampleRate,AC.sampleRate); const d=noise.getChannelData(0); for(let i=0;i<d.length;i++) d[i]=Math.random()*2-1; }catch(e){ AC=null; } }
function rainBed(){ if(!AC||rainSnd) return; rainSnd=true; const s=AC.createBufferSource(); s.buffer=noise; s.loop=true; const hp=AC.createBiquadFilter(); hp.type='highpass'; hp.frequency.value=1800; const lp=AC.createBiquadFilter(); lp.type='lowpass'; lp.frequency.value=7000; const g=AC.createGain(); g.gain.value=.045; s.connect(hp); hp.connect(lp); lp.connect(g); g.connect(master); s.start(); }
function boom(vol,dur,lp,thump){ if(!AC||vol<=0.003) return; const t=AC.currentTime;
  const s=AC.createBufferSource(); s.buffer=noise; s.playbackRate.value=rand(.8,1.2); const f=AC.createBiquadFilter(); f.type='lowpass'; f.frequency.setValueAtTime(lp,t); f.frequency.exponentialRampToValueAtTime(Math.max(80,lp*.15),t+dur);
  const g=AC.createGain(); g.gain.setValueAtTime(vol,t); g.gain.exponentialRampToValueAtTime(.001,t+dur); s.connect(f); f.connect(g); g.connect(master); s.start(t,Math.random()*.5,dur+.05);
  if(thump){ const o=AC.createOscillator(), og=AC.createGain(); o.frequency.setValueAtTime(thump,t); o.frequency.exponentialRampToValueAtTime(thump*.3,t+dur*.7); og.gain.setValueAtTime(vol*.9,t); og.gain.exponentialRampToValueAtTime(.001,t+dur*.7); o.connect(og); og.connect(master); o.start(t); o.stop(t+dur); } }
function tick(freq,vol,dur,type){ if(!AC) return; const t=AC.currentTime, o=AC.createOscillator(), g=AC.createGain(); o.type=type||'square'; o.frequency.value=freq; g.gain.setValueAtTime(vol,t); g.gain.exponentialRampToValueAtTime(.001,t+(dur||.05)); o.connect(g); g.connect(master); o.start(t); o.stop(t+(dur||.05)+.01); }

/* ---------- effects ---------- */
const fx=[], decals=[], pGeo=new THREE.BoxGeometry(.035,.035,.035), mSpark=new THREE.MeshBasicMaterial({color:0xffd27a});
const trGeo=new THREE.BoxGeometry(.025,.025,1), holeGeo=new THREE.PlaneGeometry(.1,.1);
const mHole=new THREE.MeshBasicMaterial({map:tHole,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-4});
function spr(tex,p,size,life,o){ o=o||{}; if(fx.length>260) return;
  const m=new THREE.Sprite(new THREE.SpriteMaterial({map:tex,color:o.color||0xffffff,transparent:true,opacity:o.op||1,depthWrite:false,blending:o.add?THREE.AdditiveBlending:THREE.NormalBlending,rotation:Math.random()*6}));
  m.position.copy(p); m.scale.setScalar(size); scene.add(m); fx.push({m,life,max:life,op:o.op||1,v:o.v||null,g:o.g||0,grow:o.grow||0,drag:o.drag||0,own:true}); }
function sparks(p,n,spd,nrm){ for(let i=0;i<n&&fx.length<260;i++){ const m=new THREE.Mesh(pGeo,mSpark); m.position.copy(p); const v=new THREE.Vector3(rand(-1,1),rand(-.2,1.2),rand(-1,1)).multiplyScalar(spd*rand(.3,1)); if(nrm) v.addScaledVector(nrm,spd*.7); scene.add(m); fx.push({m,v,life:rand(.15,.4),max:1,g:9,bounce:true}); } }
function dust(p,nrm,col,n,size){ for(let i=0;i<n;i++){ const v=new THREE.Vector3(rand(-.5,.5),rand(.2,1),rand(-.5,.5)); if(nrm) v.addScaledVector(nrm,rand(.6,1.8)); spr(tSmoke,p,size*rand(.6,1),rand(.5,1.1),{color:col,op:.75,v,grow:size*2.2,drag:2}); } }
function tracer(a,b,col){ const len=a.distanceTo(b); if(len<.5) return; const m=new THREE.Mesh(trGeo,new THREE.MeshBasicMaterial({color:col,transparent:true,opacity:.7,blending:THREE.AdditiveBlending,depthWrite:false}));
  m.position.copy(a).lerp(b,.5); m.lookAt(b); m.scale.z=len; scene.add(m); fx.push({m,life:.06,max:.06,op:.7,own:true}); }
function decal(p,n){ const m=new THREE.Mesh(holeGeo,mHole); m.position.copy(p).addScaledVector(n,.006); m.lookAt(p.clone().add(n)); m.rotation.z=Math.random()*6; m.scale.setScalar(rand(.8,1.5)); scene.add(m); decals.push(m); if(decals.length>60) scene.remove(decals.shift()); }
function explode(p){
  const l=new THREE.PointLight(0xffa040,14,34); l.position.copy(p); l.position.y+=1; scene.add(l); fx.push({m:l,life:.35,max:.35,light:14});
  const c=p.clone(); c.y+=.6;
  for(let i=0;i<5;i++) spr(tGlow,c.clone().add(new THREE.Vector3(rand(-1,1),rand(0,1.2),rand(-1,1))),rand(1.8,3.2),rand(.2,.38),{add:true,op:.8,grow:7,v:new THREE.Vector3(rand(-2,2),rand(1,4),rand(-2,2))});
  for(let i=0;i<14;i++) spr(tSmoke,c.clone().add(new THREE.Vector3(rand(-1.2,1.2),rand(0,1.5),rand(-1.2,1.2))),rand(2,3.5),rand(1.6,3.2),{color:i%3?0x3a352f:0x8a7a66,op:.85,grow:2.2,drag:1.5,v:new THREE.Vector3(rand(-3,3),rand(1.5,5),rand(-3,3))});
  sparks(c,26,13);
}
function updateFx(dt){ for(let i=fx.length-1;i>=0;i--){ const f=fx[i]; f.life-=dt;
    if(f.v){ f.v.y-=f.g*dt; if(f.drag) f.v.multiplyScalar(Math.max(0,1-f.drag*dt)); f.m.position.addScaledVector(f.v,dt); if(f.bounce&&f.m.position.y<.03){ f.m.position.y=.03; f.v.multiplyScalar(.3); } }
    if(f.op) f.m.material.opacity=Math.max(0,f.life/f.max)*f.op;
    if(f.grow) f.m.scale.addScalar(f.grow*dt);
    if(f.light) f.m.intensity=f.light*Math.max(0,f.life/f.max);
    if(f.life<=0){ scene.remove(f.m); if(f.own) f.m.material.dispose(); fx.splice(i,1); } } }

/* ---------- player state ---------- */
const WPN=[
  {name:'M91 SCOPED RIFLE',mag:5,res:20,max:35,rate:1.2,dmg:170,spread:.028,ads:.0002,auto:false,reload:2.6,kick:.03,pick:10,fov:17},
  {name:'SERVICE PISTOL',mag:12,res:60,max:96,rate:.15,dmg:46,spread:.011,ads:.004,auto:true,reload:1.5,kick:.016,pick:24,fov:56}
];
const P={pos:new THREE.Vector3(),vel:new THREE.Vector3(),yaw:0,pitch:0,hp:100,onGround:true,eye:1.65,w:0,ammo:[5,12],res:[35,72],nades:3,
  cool:0,reload:0,swap:0,bloom:0,bob:0,lastHit:99,kickV:0,ads:0,step:0};
const vm=new THREE.Group(); camera.add(vm); vm.visible=false;
const guns=[null,null], MUZ=[new THREE.Vector3(),new THREE.Vector3()], HIP=[new THREE.Vector3(.13,-.15,-.5),new THREE.Vector3(.17,-.14,-.46)], ADS=[new THREE.Vector3(0,-.075,-.3),new THREE.Vector3(0,-.079,-.44)];
let boltA=null, boltB=null, slide=null, flash=null, flashT=0;
const flashLight=new THREE.PointLight(0xffb060,0,16); flashLight.position.set(0,.05,-1.2); camera.add(flashLight);

/* ---------- soldiers: enemies and echoes share one rig ---------- */
const enemies=[], pickups=[], nades=[], echoes=[];
const RELAYS=[{id:'A',x:-21,z:-20},{id:'B',x:21,z:20},{id:'C',x:28,z:-25}];
const LOOP=70, CAP=32, MAXL=6;
const mHit=new THREE.MeshBasicMaterial({visible:false});
const hitGeo={body:new THREE.BoxGeometry(.52,.7,.34),head:new THREE.BoxGeometry(.25,.3,.27),leg:new THREE.BoxGeometry(.2,.87,.24)};
let PR_={}, heavyMats=null, ghostMats=null, soldierFlip=0, soldierScale=1;
const BONES=['RightArm','RightForeArm','LeftArm','LeftForeArm'];
// arm directions in the soldier's own frame (+z forward, -x is the soldier's right)
const POSE=[new THREE.Vector3(-.22,-.72,.45).normalize(),new THREE.Vector3(.5,.32,.8).normalize(),new THREE.Vector3(.02,-.5,.86).normalize(),new THREE.Vector3(-.62,.2,.76).normalize()];
function makeSoldier(kind){
  const g=new THREE.Group(); g.rotation.order='YXZ'; const o={g,bones:[],act:{},spd:0};
  const model=THREE.SkeletonUtils.clone(A.soldier.scene); model.rotation.y=soldierFlip; model.scale.setScalar(soldierScale); g.add(model);
  const swap=kind==='heavy'?heavyMats:kind==='echo'?ghostMats:null;
  model.traverse(c=>{ if(c.isMesh){ c.castShadow=true; c.receiveShadow=kind!=='echo'; c.frustumCulled=false; if(swap) c.material=swap[c.material.uuid]||c.material; }
    if(c.isBone){ const i=BONES.findIndex(b=>c.name==='mixamorig'+b); if(i>=0){ const k=c.children.find(n=>n.isBone); c.userData.axis=k?k.position.clone().normalize():new THREE.Vector3(0,1,0); o.bones[i]=c; } } });
  o.mixer=new THREE.AnimationMixer(model);
  A.soldier.animations.forEach(c=>{ if(c.name==='Idle'||c.name==='Walk'||c.name==='Run'){ const a=o.mixer.clipAction(c); a.play(); a.setEffectiveWeight(c.name==='Idle'?1:0); o.act[c.name]=a; } });
  o.mixer.update(Math.random()*2);
  const gun=PR_.erifle.g.clone(true); gun.rotation.y=-Math.PI/2; gun.position.set(-.13,1.1,.42); g.add(gun);
  scene.add(g); return o;
}
const _pq=new THREE.Quaternion(), _d=new THREE.Vector3();
function animate(o,moved,dt){ o.spd=lerp(o.spd,moved,Math.min(1,dt*8));
  const wRun=clamp((o.spd-1.8)/1.2,0,1), wWalk=clamp(o.spd/1.2,0,1)*(1-wRun);
  o.act.Run.setEffectiveWeight(wRun); o.act.Walk.setEffectiveWeight(wWalk); o.act.Idle.setEffectiveWeight(1-wRun-wWalk);
  o.act.Run.timeScale=clamp(o.spd/3.6,.7,1.6); o.act.Walk.timeScale=clamp(o.spd/1.5,.6,1.5); o.mixer.update(dt);
  for(let i=0;i<4;i++){ const b=o.bones[i]; if(!b) continue; b.parent.getWorldQuaternion(_pq); _d.copy(POSE[i]).applyQuaternion(o.g.quaternion).applyQuaternion(_pq.invert()).normalize(); b.quaternion.setFromUnitVectors(b.userData.axis,_d); } }
function fall(o,dt){ o.deadT+=dt; const k=Math.min(1,o.deadT/.45); o.g.rotation.x=-k*k*Math.PI/2; o.g.position.y=lerp(o.baseY||0,(o.baseY||0)+.16,k); }
function makeEnemy(heavy,goal){
  const e=Object.assign(makeSoldier(heavy?'heavy':'enemy'),{heavy,goal,parts:[],hp:heavy?320:100,speed:heavy?2.5:rand(3.4,4.1),range:rand(10,22),strafe:Math.random()<.5?1:-1,strafeT:rand(1,2.5),
    seen:0,react:rand(.6,1.2),cool:rand(.3,1),burst:heavy?5:3,dead:false,deadT:0,flow:{x:0,z:0},think:0,tgt:null});
  const hb=(geo,x,y,z,kind)=>{ const m=new THREE.Mesh(geo,mHit); m.position.set(x,y,z); m.userData.e=e; m.userData.part=kind; e.g.add(m); e.parts.push(m); };
  hb(hitGeo.body,0,1.18,0,'body'); hb(hitGeo.head,0,1.68,.02,'head'); hb(hitGeo.leg,-.13,.435,0,'body'); hb(hitGeo.leg,.13,.435,0,'body');
  if(heavy) e.g.scale.setScalar(1.18);
  return e;
}
function spawnEnemy(heavy,x,z,goal){ const e=makeEnemy(!!heavy,goal===undefined?-1:goal); e.g.position.set((x===undefined?0:x)+rand(-1.2,1.2),0,(z===undefined?-30:z)+rand(-1.2,1.2)); enemies.push(e); return e; }
// a "body" is anything the hostiles can see and shoot: you, or one of your echoes
const PB={player:true};
const bx=b=>b.player?P.pos.x:b.g.position.x, bz=b=>b.player?P.pos.z:b.g.position.z, bEye=b=>b.player?P.pos.y+P.eye-.15:b.g.position.y+1.5, bAlive=b=>b.player?P.hp>0:b.alive;
function liveBodies(){ const l=[]; if(P.hp>0) l.push(PB); for(const c of echoes) if(c.alive) l.push(c); return l; }
const tmpV=new THREE.Vector3(), tmpV2=new THREE.Vector3();
function updateEnemies(dt){
  const bl=liveBodies();
  for(let i=enemies.length-1;i>=0;i--){ const e=enemies[i], p=e.g.position;
    if(e.dead){ fall(e,dt); if(e.deadT>7) p.y-=(e.deadT-7)*.25; if(e.deadT>9){ scene.remove(e.g); enemies.splice(i,1);} continue; }
    const s=e.heavy?1.18:1, eyeY=1.6*s;
    e.think-=dt; if(e.think<=0||(e.tgt&&!bAlive(e.tgt))){ e.think=.25; let best=null,bd=1e9;
      for(const b of bl){ const dd=Math.hypot(bx(b)-p.x,bz(b)-p.z); if(dd<75&&dd<bd&&!segBlocked(p.x,eyeY,p.z,bx(b),bEye(b),bz(b))){ bd=dd; best=b; } } e.tgt=best; }
    const t=e.tgt; let dx=0,dz=1,d=1e9; if(t){ dx=bx(t)-p.x; dz=bz(t)-p.z; d=Math.hypot(dx,dz)||1; e.seen+=dt; } else e.seen=0;
    let mx=0,mz=0,sp=e.speed;
    if(t&&d<e.range){ e.strafeT-=dt; if(e.strafeT<=0){ e.strafe=Math.random()<.25?0:(Math.random()<.5?1:-1); e.strafeT=rand(1,2.6);} mx=-dz/d*e.strafe; mz=dx/d*e.strafe; sp*=.4; if(d<5){ mx-=dx/d; mz-=dz/d; } }
    else { const R=e.goal>=0?RELAYS[e.goal]:null; if(!(R&&Math.hypot(R.x-p.x,R.z-p.z)<2.6)){ flowDir(p.x,p.z,e.flow,R?R.field:fdist); mx=e.flow.x; mz=e.flow.z; } }
    for(let j=0;j<enemies.length;j++){ const o=enemies[j]; if(o===e||o.dead) continue; const ox=p.x-o.g.position.x, oz=p.z-o.g.position.z, od=ox*ox+oz*oz; if(od<1.2&&od>1e-4){ const k=.9/Math.sqrt(od); mx+=ox*k; mz+=oz*k; } }
    const ml=Math.hypot(mx,mz); if(ml>1){ mx/=ml; mz/=ml; }
    const ox=p.x, oz=p.z; p.x+=mx*sp*dt; p.z+=mz*sp*dt; resolve(p,.4,0); p.x=clamp(p.x,-39.4,39.4); p.z=clamp(p.z,-39.4,39.4);
    const face=t?Math.atan2(dx,dz):(ml>.1?Math.atan2(mx,mz):e.g.rotation.y); let da=face-e.g.rotation.y; da=Math.atan2(Math.sin(da),Math.cos(da)); e.g.rotation.y+=da*Math.min(1,dt*8);
    animate(e,Math.hypot(p.x-ox,p.z-oz)/dt,dt);
    if(t&&e.seen>e.react&&d<70){ e.cool-=dt; if(e.cool<=0){ enemyShoot(e,t,d,s); e.burst--; if(e.burst>0) e.cool=e.heavy?.1:.14; else { e.burst=e.heavy?5:3; e.cool=rand(1.4,2.6); } } }
  }
}
function enemyShoot(e,t,d,s){
  const p=e.g.position, fy=e.g.rotation.y, lx=-.17*s, lz=1.05*s; tmpV.set(p.x+lx*Math.cos(fy)+lz*Math.sin(fy),1.15*s,p.z-lx*Math.sin(fy)+lz*Math.cos(fy));
  let ch=clamp(.34-d*.006,.06,.32); if(t.player){ const spd=Math.hypot(P.vel.x,P.vel.z); if(spd>6) ch*=.6; else if(spd>2.5) ch*=.8; if(P.crouch) ch*=.8; } else ch*=.8;
  const hit=Math.random()<ch;
  tmpV2.set(bx(t),bEye(t)-.15,bz(t)); if(!hit) tmpV2.add(new THREE.Vector3(rand(-1,1),rand(-.2,.9),rand(-1,1)).multiplyScalar(1.1)).addScaledVector(tmpV2.clone().sub(tmpV).normalize(),6);
  tracer(tmpV.clone(),tmpV2.clone(),0xffc890); spr(tFlash,tmpV,rand(.5,.8),.05,{add:true}); spr(tSmoke,tmpV,.25,.5,{color:0xbbbbbb,op:.35,grow:.9,v:new THREE.Vector3(0,.4,0)});
  const dp=Math.hypot(p.x-P.pos.x,p.z-P.pos.z); boom(clamp(.5-dp*.007,.04,.5),.18,1700,110);
  if(!hit){ if(t.player&&Math.random()<.4) tick(rand(1800,3200),.04,.06,'sine'); return; }
  const dmg=e.heavy?rand(9,13):rand(7,11); if(t.player) hurt(dmg,p.x,p.z); else echoHurt(t,dmg);
}
function hurt(dmg,sx,sz){
  if(P.hp<=0) return; P.hp-=dmg; P.lastHit=0; G.shake=Math.min(1,G.shake+.25); G.vig=1; tick(140,.2,.09,'sawtooth');
  if(sx!==undefined){ const dx=sx-P.pos.x,dz=sz-P.pos.z; const fwd=-Math.sin(P.yaw)*dx-Math.cos(P.yaw)*dz, rt=Math.cos(P.yaw)*dx-Math.sin(P.yaw)*dz; G.dmgAng=Math.atan2(rt,fwd); G.dmgT=1; }
  if(P.hp<=0){ P.hp=0; if(!G.pend) G.pend='died'; }
}
function damageEnemy(e,dmg,head,byEcho){
  if(e.dead) return; e.hp-=dmg; e.range=Math.max(e.range,30); if(!byEcho){ G.hitT=.18; G.hitKill=false; tick(head?1500:1100,.07,.04); }
  if(e.hp<=0){ e.dead=true; e.deadT=0; e.baseY=0; G.kills++; if(byEcho){ G.echoKills++; feed('ECHO KILL'); } else { feed(e.heavy?'HEAVY DOWN':head?'HEADSHOT':'HOSTILE DOWN'); G.hitKill=true; G.hitT=.3; tick(700,.1,.12,'triangle'); }
    if(Math.random()<.3) dropPickup(e.g.position); }
}
function dropPickup(p){ const m=PR_.ammo.g.clone(true); m.scale.setScalar(2.2); m.position.set(p.x,.3,p.z); scene.add(m); pickups.push({m,t:0}); }

/* ---------- echoes: recordings of your earlier runs, replayed in the same loop ---------- */
let recs=[], rec=null, recT=0;
function makeEcho(r,n){ const s=r.s[0]; const c=Object.assign(makeSoldier('echo'),{rec:r,n,alive:true,hp:100,i:0,ev:0,deadT:0}); c.g.position.set(s[1],s[2],s[3]); c.g.rotation.y=s[4]+Math.PI; echoes.push(c); }
function echoHurt(c,dmg){ if(!c.alive) return; c.hp-=dmg; if(c.hp<=0) killEcho(c,'ECHO '+c.n+' DOWN'); }
function killEcho(c,msg){ c.alive=false; c.deadT=0; c.baseY=c.g.position.y; if(msg) feed(msg); }
const eRay=new THREE.Raycaster(); eRay.far=300;
function echoFire(c,ev){
  if(ev.k==='n'){ spawnNade(new THREE.Vector3(ev.p[0],ev.p[1],ev.p[2]),new THREE.Vector3(ev.v[0],ev.v[1],ev.v[2])); return; }
  const w=WPN[ev.k], o=new THREE.Vector3(ev.o[0],ev.o[1],ev.o[2]), dir=new THREE.Vector3(ev.d[0],ev.d[1],ev.d[2]);
  const targets=worldMeshes.slice(); for(const e of enemies) if(!e.dead) for(const m of e.parts) targets.push(m);
  eRay.set(o,dir); const h=eRay.intersectObjects(targets,false)[0], end=h?h.point:o.clone().addScaledVector(dir,150);
  const mz=o.clone().addScaledVector(dir,1).add(new THREE.Vector3(0,-.25,0)); tracer(mz,end.clone(),0x8fe0ff); spr(tFlash,mz,.5,.05,{add:true,color:0x9fdcff});
  if(h){ const u=h.object.userData; if(u.e){ const head=u.part==='head'; damageEnemy(u.e,w.dmg*(head?2.6:1),head,true); dust(h.point,dir.clone().negate(),0x5a0f0a,2,.25); } else { const n=h.face?h.face.normal.clone().transformDirection(h.object.matrixWorld):new THREE.Vector3(0,1,0); dust(h.point,n,0xb8a58c,2,.3); } }
  const dp=o.distanceTo(P.pos); boom(clamp((ev.k===0?.6:.35)-dp*.008,.03,.6),ev.k===0?.4:.16,ev.k===0?1500:2400,ev.k===0?80:160);
}
function updateEchoes(dt,el){
  for(const c of echoes){ if(!c.alive){ if(c.deadT<.5) fall(c,dt); continue; }
    const r=c.rec, S=r.s; while(c.i<S.length-2&&S[c.i+1][0]<=el) c.i++;
    const a=S[c.i], b=S[Math.min(c.i+1,S.length-1)], k=clamp((el-a[0])/((b[0]-a[0])||1),0,1), p=c.g.position, ox=p.x, oz=p.z;
    p.set(lerp(a[1],b[1],k),lerp(a[2],b[2],k),lerp(a[3],b[3],k)); let dy=b[4]-a[4]; dy=Math.atan2(Math.sin(dy),Math.cos(dy)); c.g.rotation.y=a[4]+dy*k+Math.PI;
    animate(c,Math.hypot(p.x-ox,p.z-oz)/dt,dt);
    while(c.ev<r.e.length&&r.e[c.ev].t<=el) echoFire(c,r.e[c.ev++]);
    if(r.died&&el>=r.end) killEcho(c,'ECHO '+c.n+' FELL, AS BEFORE');
  }
}

/* ---------- game state: the loop ---------- */
const G={state:'menu',loop:1,t:LOOP,si:0,pend:null,kills:0,echoKills:0,shots:0,hits:0,shake:0,vig:0,dmgT:0,dmgAng:0,hitT:0,hitKill:false,flowT:0,time:0,best:0,bestLocked:0,rumble:0};
try{ G.best=+localStorage.getItem('dustline-strikes')||0; }catch(e){}
const keys={}; let fire=false, trigger=false, adsHeld=false, adsToggle=false, locked=false, everLocked=false, fallback=false;
function feed(t){ const s=document.createElement('span'); s.textContent=t; $('feed').appendChild(s); setTimeout(()=>s.remove(),1650); while($('feed').children.length>4) $('feed').firstChild.remove(); }
let bannerTimer=0;
function banner(s,t,dur){ $('bs').textContent=s; $('bt').textContent=t; $('banner').style.opacity=1; clearTimeout(bannerTimer); bannerTimer=setTimeout(()=>{$('banner').style.opacity=0;},(dur||2.4)*1000); }
function showGun(){ guns[0].visible=P.w===0; guns[1].visible=P.w===1; }
// the same hostiles arrive at the same times every loop, so each run can be planned around the last
const SCHED=(()=>{ const S=[], sp=[[[-35,-35],[-36,-2]],[[35,35],[36,6]],[[0,-36],[36,-6]]];
  RELAYS.forEach((R,k)=>[[5,1],[17,2],[31,2],[47,2]].forEach((g,gi)=>{ for(let j=0;j<g[1];j++) S.push({t:g[0]+j*1.2+k*1.5,goal:k,heavy:false,p:sp[k][(gi+j)%2]}); }));
  S.push({t:14,goal:-1,heavy:false,p:[-8,36]},{t:40,goal:-1,heavy:false,p:[-35,35]},{t:44,goal:1,heavy:true,p:[35,35]});
  return S.sort((a,b)=>a.t-b.t); })();
function clearWorld(){ enemies.forEach(e=>scene.remove(e.g)); enemies.length=0; echoes.forEach(e=>scene.remove(e.g)); echoes.length=0; pickups.forEach(p=>scene.remove(p.m)); pickups.length=0; nades.forEach(n=>scene.remove(n.m)); nades.length=0; }
function startLoop(){
  clearWorld();
  P.pos.set(0,0,2); P.vel.set(0,0,0); P.yaw=0; P.pitch=0; P.hp=100; P.w=0; P.ammo=[WPN[0].mag,WPN[1].mag]; P.res=[WPN[0].res,WPN[1].res]; P.nades=2; P.cool=0; P.reload=0; P.swap=0; P.lastHit=99; P.crouch=false; P.eye=1.65; P.ads=0;
  adsToggle=false; showGun(); G.t=LOOP; G.si=0; G.pend=null; G.vig=0; G.dmgT=0; G.rumble=0;
  RELAYS.forEach(R=>{ R.prog=0; R.state='idle'; });
  rec={s:[],e:[],died:false,end:0}; recT=1;
  recs.forEach((r,i)=>makeEcho(r,i+1));
  if(G.loop===1) banner('Strike 1 of '+MAXL,'Lock all three relays',3.2);
  else banner('Strike '+G.loop+' of '+MAXL,recs.length===1?'Your echo repeats your last run':recs.length+' echoes are with you',3.2);
}
function reset(){ recs=[]; Object.assign(G,{loop:1,kills:0,echoKills:0,shots:0,hits:0,shake:0,time:0,bestLocked:0}); $('feed').textContent=''; startLoop(); }
function strike(){ const f=$('flash'); f.style.transition='none'; f.style.opacity=1; void f.offsetWidth; f.style.transition='opacity 1.1s ease-out'; f.style.opacity=0;
  boom(1,2.4,260,38); setTimeout(()=>boom(.5,2.6,140,30),350); G.shake=1.4; }
function endLoop(died){
  rec.died=died; rec.end=LOOP-G.t; G.bestLocked=Math.max(G.bestLocked,RELAYS.filter(R=>R.prog>=1).length);
  if(G.loop>=MAXL){ G.state='over'; fire=false; strike(); if(document.pointerLockElement) document.exitPointerLock(); showOverlay(); return; }
  if(rec.s.length>30) recs.push(rec);
  G.loop++; strike(); startLoop(); if(died) feed('YOU FELL · THAT RUN STILL HAPPENED');
}
function win(){ G.state='won'; fire=false; if(!G.best||G.loop<G.best){ G.best=G.loop; try{ localStorage.setItem('dustline-strikes',G.best); }catch(e){} }
  tick(660,.12,.2,'triangle'); setTimeout(()=>tick(880,.12,.25,'triangle'),180); setTimeout(()=>tick(1320,.12,.5,'triangle'),360);
  if(document.pointerLockElement) document.exitPointerLock(); showOverlay(); }
function spawnLogic(el){ while(G.si<SCHED.length&&SCHED[G.si].t<=el){ const s=SCHED[G.si++]; spawnEnemy(s.heavy,s.p[0],s.p[1],s.goal); } }
const RCOL={idle:0x8a98a8,uplink:0xffb23e,contested:0xff3b22,hostile:0xff3b22,locked:0x4dff9a};
function updateRelays(dt){
  const bl=liveBodies(); let done=0;
  for(const R of RELAYS){
    if(R.prog<1){ let friend=false, foe=false;
      for(const b of bl) if(Math.hypot(bx(b)-R.x,bz(b)-R.z)<5){ friend=true; break; }
      for(const e of enemies) if(!e.dead&&Math.hypot(e.g.position.x-R.x,e.g.position.z-R.z)<6.5){ foe=true; break; }
      R.state=friend?(foe?'contested':'uplink'):(foe?'hostile':'idle');
      if(friend&&!foe){ R.prog=Math.min(1,R.prog+dt/CAP); if(R.prog>=1){ R.state='locked'; feed('RELAY '+R.id+' LOCKED'); tick(990,.1,.3,'triangle'); } } }
    if(R.prog>=1) done++;
    const c=RCOL[R.state], pulse=R.state==='contested'?(.5+.5*Math.sin(G.time*14)):1;
    R.beacon.material.color.setHex(c); R.beacon.material.opacity=.95*pulse; R.beam.material.color.setHex(c); R.beam.material.opacity=(R.state==='idle'?.07:.16)*pulse; R.ring.material.color.setHex(c);
  }
  if(done===RELAYS.length&&!G.pend) G.pend='win';
}
function showOverlay(){
  overlay.hidden=false; const over=G.state==='over', won=G.state==='won', paused=G.state==='pause';
  $('title').innerHTML=won?'Signal <em>out</em>':over?'The storm <em>passed</em>':paused?'Stand <em>by</em>':'Dustline <em>Outpost</em>';
  $('stats').hidden=!(over||won||paused);
  $('stats').textContent=won?('LOCKED ON STRIKE '+G.loop+' OF '+MAXL+' · '+G.kills+' HOSTILES DOWN, '+G.echoKills+' BY ECHOES · BEST '+G.best)
    :over?('NO SIGNAL · '+G.bestLocked+' OF 3 RELAYS AT BEST · '+G.kills+' HOSTILES DOWN')
    :('STRIKE '+G.loop+' OF '+MAXL+' · '+recs.length+' ECHOES · '+RELAYS.filter(R=>R.prog>=1).length+' OF 3 RELAYS LOCKED');
  $('brief').hidden=over||won||paused; $('keys').hidden=over||won; $('go').textContent=!ready?'Loading':(over||won)?'Run it again':paused?'Resume':'Deploy'; $('again').hidden=!paused;
  hud.hidden=!paused; $('note').textContent=paused&&everLocked?'If the mouse does not lock right away, wait a second and click Resume again.':'Needs a keyboard and a mouse or trackpad. Sound starts when you deploy.';
}
function play(){ G.state='play'; overlay.hidden=true; hud.hidden=false; last=performance.now(); canvas.focus(); }
function requestLock(){ try{ const r=canvas.requestPointerLock(); if(r&&r.catch) r.catch(lockFail); }catch(e){ lockFail(); } }
function lockFail(){ if(!everLocked&&G.state==='starting'){ fallback=true; play(); $('msg').textContent='Mouse lock unavailable · move the mouse or use arrow keys to look · P to pause'; setTimeout(()=>{$('msg').textContent='';},6000); } else if(G.state==='starting'){ G.state='pause'; } }
document.addEventListener('pointerlockchange',()=>{ locked=document.pointerLockElement===canvas;
  if(locked){ everLocked=true; fallback=false; if(G.state==='starting') play(); }
  else if(G.state==='play'&&!fallback){ G.state='pause'; fire=false; showOverlay(); } });
document.addEventListener('pointerlockerror',lockFail);
function start(fresh){ if(!ready) return; initAudio(); rainBed(); if(fresh||G.state==='menu'||G.state==='over'||G.state==='won') reset(); G.state='starting'; if(fallback) play(); else requestLock(); }
$('go').addEventListener('click',()=>start(false)); $('again').addEventListener('click',()=>start(true));
function pause(){ if(G.state!=='play') return; if(locked) document.exitPointerLock(); else { G.state='pause'; fire=false; showOverlay(); } }
window.addEventListener('blur',()=>{ for(const k in keys) keys[k]=false; fire=false; adsHeld=false; if(G.state==='play'&&fallback) pause(); });

/* ---------- input ---------- */
document.addEventListener('keydown',e=>{
  if(G.state!=='play') return; const k=e.code; if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Tab'].includes(k)) e.preventDefault();
  if(e.repeat) return; keys[k]=true;
  if(k==='KeyR') startReload(); else if(k==='Digit1') swapTo(0); else if(k==='Digit2') swapTo(1); else if(k==='KeyG') throwNade(); else if(k==='KeyF') adsToggle=!adsToggle;
  else if(k==='KeyP'||(k==='Escape'&&fallback)) pause(); else if(k==='KeyC') P.crouch=!P.crouch; else if(k==='KeyT'&&LOOP-G.t>3&&!G.pend) G.pend='call';
});
document.addEventListener('keyup',e=>{ keys[e.code]=false; });
document.addEventListener('mousemove',e=>{ if(G.state!=='play'||!(locked||fallback)||Math.abs(e.movementX)>300||Math.abs(e.movementY)>300) return; const s=.0022*lerp(1,camera.fov/72*.9,P.ads); P.yaw-=e.movementX*s; P.pitch=clamp(P.pitch-e.movementY*s,-1.5,1.5); });
canvas.addEventListener('mousedown',e=>{ if(G.state!=='play') return; if(e.button===0){ fire=true; trigger=true; } else if(e.button===2) adsHeld=true; e.preventDefault(); });
document.addEventListener('mouseup',e=>{ if(e.button===0) fire=false; else if(e.button===2) adsHeld=false; });
document.addEventListener('contextmenu',e=>e.preventDefault());
canvas.addEventListener('wheel',()=>{ if(G.state==='play') swapTo(1-P.w); },{passive:true});

function startReload(){ const w=WPN[P.w]; if(P.reload>0||P.swap>0||P.ammo[P.w]>=w.mag||P.res[P.w]<=0) return; P.reload=w.reload; adsToggle=false; tick(300,.08,.04); setTimeout(()=>tick(220,.1,.05),w.reload*450); setTimeout(()=>tick(520,.1,.04),w.reload*900); }
function swapTo(i){ if(i===P.w||P.swap>0) return; P.reload=0; P.swap=.5; P.next=i; adsToggle=false; tick(260,.06,.05); }
const ray=new THREE.Raycaster(); ray.far=300;
function shoot(){
  const w=WPN[P.w]; if(P.ammo[P.w]<=0){ if(trigger){ tick(900,.06,.03); startReload(); } return; }
  P.ammo[P.w]--; P.cool=w.rate; G.shots++;
  const moving=Math.hypot(P.vel.x,P.vel.z)/8, sp=lerp(w.spread*(1+moving*1.6)+P.bloom,w.ads+P.bloom*.3,P.ads);
  const targets=worldMeshes.slice(); for(const e of enemies) if(!e.dead) for(const m of e.parts) targets.push(m);
  camera.updateMatrixWorld(); const muzzle=flash.getWorldPosition(new THREE.Vector3());
  const a=Math.random()*Math.PI*2, r=Math.sqrt(Math.random())*sp; const dir=new THREE.Vector3(Math.cos(a)*r,Math.sin(a)*r,-1).normalize().applyQuaternion(camera.quaternion);
  ray.set(camera.position,dir); const h=ray.intersectObjects(targets,false)[0]; const end=h?h.point:camera.position.clone().addScaledVector(dir,150);
  rec.e.push({t:LOOP-G.t,k:P.w,o:camera.position.toArray(),d:dir.toArray()});
  if(P.ads<.9||P.w===1) tracer(muzzle,end.clone(),0xffe2a0);
  if(h){ const u=h.object.userData; if(u.e){ const head=u.part==='head'; damageEnemy(u.e,w.dmg*(head?2.6:1),head,false); G.hits++; dust(h.point,dir.clone().negate(),0x5a0f0a,3,.25); }
    else { const n=h.face?h.face.normal.clone().transformDirection(h.object.matrixWorld):new THREE.Vector3(0,1,0); dust(h.point,n,0xb8a58c,3,.3); sparks(h.point,P.w===0?4:2,3,n); decal(h.point,n); } }
  P.pitch=clamp(P.pitch+w.kick*lerp(1,.7,P.ads),-1.5,1.5); P.yaw+=rand(-1,1)*w.kick*.4; P.kickV=1; P.bloom=Math.min(.03,P.bloom+.006); G.shake=Math.min(1,G.shake+(P.w===0?.5:.12));
  flash.visible=true; flash.material.rotation=Math.random()*6; flash.scale.setScalar(P.w===0?rand(.5,.65):rand(.24,.32)); flashT=.05; flashLight.intensity=5;
  spr(tSmoke,muzzle,.2,.7,{color:0xcccccc,op:.3,grow:1.2,v:dir.clone().multiplyScalar(1.5)});
  if(P.w===0){ boom(.8,.45,1500,80); setTimeout(()=>tick(240,.07,.05),420); setTimeout(()=>tick(330,.07,.05),760); } else boom(.45,.16,2400,160);
  if(P.ammo[P.w]<=0&&P.res[P.w]>0) setTimeout(()=>{ if(G.state==='play') startReload(); },P.w===0?500:250);
}
function spawnNade(pos,vel){ const m=PR_.nade.g.clone(true); m.scale.setScalar(1.2); m.position.copy(pos); scene.add(m); nades.push({m,v:vel,t:2.3}); }
function throwNade(){ if(P.nades<=0||P.swap>0) return; P.nades--; const d=new THREE.Vector3(0,0,-1).applyQuaternion(camera.quaternion);
  const pos=camera.position.clone().addScaledVector(d,.6), vel=d.multiplyScalar(17).add(new THREE.Vector3(P.vel.x,3.5,P.vel.z));
  rec.e.push({t:LOOP-G.t,k:'n',p:pos.toArray(),v:vel.toArray()}); spawnNade(pos,vel); tick(200,.07,.08,'sine'); }
function updateNades(dt){ for(let i=nades.length-1;i>=0;i--){ const n=nades[i], p=n.m.position; n.t-=dt; n.v.y-=18*dt; const ox=p.x, oz=p.z; p.addScaledVector(n.v,dt);
    const sp=n.v.length(); n.m.rotation.x+=sp*dt*1.2; n.m.rotation.z+=sp*dt*.7;
    if(p.y<.09){ p.y=.09; if(Math.abs(n.v.y)>2) tick(320,.04,.03,'sine'); n.v.y*=-.35; n.v.x*=.7; n.v.z*=.7; }
    for(const c of cols){ if(p.y<c.h&&p.x>c.x0&&p.x<c.x1&&p.z>c.z0&&p.z<c.z1){ if(ox<=c.x0||ox>=c.x1) n.v.x*=-.4; else if(oz<=c.z0||oz>=c.z1) n.v.z*=-.4; else { n.v.y=Math.abs(n.v.y)*.3; p.y=c.h+.09; continue; } p.x=ox; p.z=oz; break; } }
    if(n.t<=0){ scene.remove(n.m); nades.splice(i,1); explode(p); const pd=p.distanceTo(P.pos); boom(clamp(1.1-pd*.02,.25,1),.9,900,55); G.shake=Math.min(1.5,G.shake+clamp(1.4-pd*.05,0,1.2));
      for(const e of enemies){ if(e.dead) continue; const d=Math.hypot(e.g.position.x-p.x,e.g.position.z-p.z); if(d<8) damageEnemy(e,260*(1-d/8)+40,false,false); }
      if(pd<6.5) hurt(70*(1-pd/6.5),p.x,p.z); } } }

function updatePlayer(dt){
  const w=WPN[P.w];
  if(fallback){ const t=1.9*dt; if(keys.ArrowLeft) P.yaw+=t; if(keys.ArrowRight) P.yaw-=t; if(keys.ArrowUp) P.pitch=clamp(P.pitch+t,-1.5,1.5); if(keys.ArrowDown) P.pitch=clamp(P.pitch-t,-1.5,1.5); }
  const f=(keys.KeyW?1:0)-(keys.KeyS?1:0), r=(keys.KeyD?1:0)-(keys.KeyA?1:0);
  const cycling=P.w===0&&P.cool>.25;
  const wantAds=(adsHeld||adsToggle)&&P.reload<=0&&P.swap<=0&&!cycling;
  const sprint=(keys.ShiftLeft||keys.ShiftRight)&&f>0&&!wantAds&&!fire&&!P.crouch&&P.reload<=0;
  P.sprint=sprint; P.ads=clamp(P.ads+(wantAds?1:-1)*dt*6,0,1);
  let sp=sprint?8.2:(wantAds?2.6:(P.crouch?2.6:5.2)); const sy=Math.sin(P.yaw), cy=Math.cos(P.yaw);
  let wx=-sy*f+cy*r, wz=-cy*f-sy*r; const wl=Math.hypot(wx,wz); if(wl>0){ wx/=wl; wz/=wl; }
  const acc=P.onGround?12:3; P.vel.x=lerp(P.vel.x,wx*sp,Math.min(1,acc*dt)); P.vel.z=lerp(P.vel.z,wz*sp,Math.min(1,acc*dt));
  if(keys.Space&&P.onGround){ P.vel.y=6; P.onGround=false; P.crouch=false; }
  P.vel.y-=16*dt; P.pos.x+=P.vel.x*dt; P.pos.z+=P.vel.z*dt; P.pos.y+=P.vel.y*dt;
  resolve(P.pos,.4,P.pos.y); const g=groundAt(P.pos.x,P.pos.z,P.pos.y);
  if(P.pos.y<=g){ if(!P.onGround&&P.vel.y<-5){ boom(.12,.1,300,70); } P.pos.y=g; P.vel.y=0; P.onGround=true; } else if(P.pos.y>g+.05) P.onGround=false;
  const hs=Math.hypot(P.vel.x,P.vel.z); if(P.onGround&&hs>1){ P.bob+=hs*dt*1.5; P.step+=hs*dt; if(P.step>(sprint?3.1:2.4)){ P.step=0; boom(.05,.07,500,0); } }
  P.eye=lerp(P.eye,P.crouch?1.05:1.65,Math.min(1,dt*10));
  P.cool-=dt; P.bloom=Math.max(0,P.bloom-dt*.05);
  if(P.swap>0){ const before=P.swap; P.swap-=dt; if(before>.25&&P.swap<=.25){ P.w=P.next; showGun(); } }
  if(P.reload>0){ P.reload-=dt; if(P.reload<=0){ const need=Math.min(w.mag-P.ammo[P.w],P.res[P.w]); P.ammo[P.w]+=need; P.res[P.w]-=need; } }
  if(P.cool<=0&&P.reload<=0&&P.swap<=0&&!sprint&&(w.auto?fire:trigger)) shoot();
  trigger=false;
  recT+=dt; if(recT>=.05){ recT=0; rec.s.push([LOOP-G.t,P.pos.x,P.pos.y,P.pos.z,P.yaw,P.pitch]); }
  P.lastHit+=dt; if(P.lastHit>5&&P.hp<100) P.hp=Math.min(100,P.hp+22*dt);
  for(let i=pickups.length-1;i>=0;i--){ const k=pickups[i]; k.t+=dt; k.m.rotation.y+=dt*1.5; k.m.position.y=.3+Math.sin(k.t*3)*.06;
    if(Math.hypot(k.m.position.x-P.pos.x,k.m.position.z-P.pos.z)<1.3){ P.res[0]=Math.min(WPN[0].max,P.res[0]+WPN[0].pick); P.res[1]=Math.min(WPN[1].max,P.res[1]+WPN[1].pick); feed('AMMO +'); tick(880,.08,.08,'triangle'); scene.remove(k.m); pickups.splice(i,1); }
    else if(k.t>30){ scene.remove(k.m); pickups.splice(i,1); } }
  // camera + view model
  G.shake=Math.max(0,G.shake-dt*3.5); const sh=G.shake*.012, bobA=P.onGround?Math.min(1,hs/5)*lerp(1,.15,P.ads):0;
  camera.position.set(P.pos.x,P.pos.y+P.eye+Math.sin(P.bob*2)*.035*bobA,P.pos.z);
  camera.rotation.set(P.pitch+rand(-1,1)*sh,P.yaw+rand(-1,1)*sh,Math.cos(P.bob)*.006*bobA);
  const fov=lerp(sprint?77:72,w.fov,P.ads*P.ads); if(Math.abs(camera.fov-fov)>.05){ camera.fov=lerp(camera.fov,fov,Math.min(1,dt*14)); camera.updateProjectionMatrix(); }
  P.kickV=Math.max(0,P.kickV-dt*(P.w===0?4:10));
  const cyc=cycling?Math.sin(clamp((w.rate-P.cool-.2)/(w.rate-.45),0,1)*Math.PI):0;
  const low=P.swap>0?Math.sin((1-Math.abs(P.swap-.25)/.25)*Math.PI/2):(P.reload>0?Math.sin(Math.min(1,(w.reload-P.reload)*4,P.reload*4)*Math.PI/2):0);
  const tgt=tmpV.copy(HIP[P.w]).lerp(ADS[P.w],P.ads); tgt.x+=Math.cos(P.bob)*.01*bobA; tgt.y+=Math.abs(Math.sin(P.bob))*.01*bobA-low*.25-(sprint?.04:0)-cyc*.03; tgt.z+=P.kickV*(P.w===0?.07:.04);
  vm.position.lerp(tgt,Math.min(1,dt*18)); vm.rotation.set(P.kickV*(P.w===0?.07:.1)+low*-.7-(sprint?.2:0),sprint?.45:0,low*.4-cyc*.35);
  if(boltA){ const bx=-cyc*.07; boltA.position.x=boltA.userData.x+bx; boltB.position.x=boltB.userData.x+bx; }
  if(slide) slide.position.x=slide.userData.x-(P.w===1&&P.cool>.08?.022:0)-(P.ammo[1]===0?.022:0);
  const scoped=P.w===0&&P.ads>.93; $('scope').hidden=!scoped; vm.visible=!scoped;
  if(flashT>0){ flashT-=dt; if(flashT<=0) flash.visible=false; } flashLight.intensity=Math.max(0,flashLight.intensity-dt*80);
}

/* ---------- HUD ---------- */
const rc=$('radar').getContext('2d'); let hudT=0; const chips=[], marks=[];
RELAYS.forEach(R=>{ const c=document.createElement('div'); c.className='chip'; c.innerHTML='<b>'+R.id+'</b><i><u></u></i><span></span>'; $('relays').appendChild(c); chips.push(c);
  const m=document.createElement('div'); m.className='mk'; m.innerHTML='<i></i><b>'+R.id+'</b><span></span>'; $('marks').appendChild(m); marks.push(m); });
const RTXT={idle:'IDLE',uplink:'UPLINK',contested:'CONTESTED',hostile:'HOSTILES',locked:'LOCKED'};
const _mk=new THREE.Vector3(), _cf=new THREE.Vector3();
function updateHud(dt){
  const w=WPN[P.w];
  $('ammo').textContent=P.reload>0?'··':P.ammo[P.w]; $('ammo').style.color=P.ammo[P.w]<=w.mag*.25?'var(--alert)':''; $('res').textContent='/ '+P.res[P.w]; $('wname').textContent=w.name;
  $('wave').textContent=G.loop; $('left').textContent=echoes.filter(c=>c.alive).length;
  const tt=Math.max(0,Math.ceil(G.t)); $('score').textContent=Math.floor(tt/60)+':'+(tt%60<10?'0':'')+tt%60; $('score').style.color=G.t<10?'var(--alert)':'';
  $('hpnum').textContent=Math.ceil(P.hp); $('hpfill').style.transform='scaleX('+P.hp/100+')'; $('hpfill').className=P.hp<35?'low':'';
  const nd=$('nades'); if(nd.children.length!==P.nades){ nd.textContent=''; for(let i=0;i<P.nades;i++) nd.appendChild(document.createElement('i')); }
  const moving=Math.hypot(P.vel.x,P.vel.z)/8, gap=(lerp(w.spread*(1+moving*1.6)+P.bloom,0,P.ads))*700+5, a=1-P.ads, L=9;
  const set=(el,x,y,ww,hh)=>{ el.style.cssText='left:'+x+'px;top:'+y+'px;width:'+ww+'px;height:'+hh+'px;opacity:'+a; };
  set($('c0'),-gap-L,-1,L,2); set($('c1'),gap,-1,L,2); set($('c2'),-1,-gap-L,2,L); set($('c3'),-1,gap,2,L);
  G.hitT=Math.max(0,G.hitT-dt); $('hit').style.opacity=Math.min(1,G.hitT*8); $('hit').className=G.hitKill?'kill':'';
  G.dmgT=Math.max(0,G.dmgT-dt*.9); $('dmg').style.opacity=G.dmgT; $('dmg').style.transform='rotate('+G.dmgAng+'rad)';
  G.vig=Math.max(0,G.vig-dt*1.4); $('vig').style.opacity=Math.max(G.vig*.7,(1-P.hp/100)*.85);
  if(P.reload>0) $('msg').textContent='Reloading'; else if(P.ammo[P.w]===0&&P.res[P.w]===0) $('msg').textContent='Out of ammo · press '+(2-P.w)+' to switch'; else if(G.t<10) $('msg').textContent='The strike is coming'; else if(!fallback||G.time>6) $('msg').textContent='';
  // relay markers pinned to the world
  camera.getWorldDirection(_cf); const W=window.innerWidth, H=window.innerHeight;
  RELAYS.forEach((R,i)=>{ const m=marks[i]; _mk.set(R.x,3.4,R.z); const dist=Math.hypot(R.x-P.pos.x,R.z-P.pos.z), behind=_mk.clone().sub(camera.position).dot(_cf)<0; _mk.project(camera);
    let x=(_mk.x*.5+.5)*W, y=(-_mk.y*.5+.5)*H; if(behind){ x=W-x; y=H-70; } x=clamp(x,40,W-40); y=clamp(y,96,H-150);
    m.style.transform='translate('+x.toFixed(0)+'px,'+y.toFixed(0)+'px)'; m.className='mk '+R.state; m.lastChild.textContent=R.prog>=1?'LOCKED':Math.round(dist)+' m'; m.style.opacity=P.w===0&&P.ads>.93?0:(dist<6?.35:1); });
  hudT-=dt; if(hudT>0) return; hudT=.05;
  RELAYS.forEach((R,i)=>{ const c=chips[i]; c.className='chip '+R.state; c.querySelector('u').style.width=Math.round(R.prog*100)+'%'; c.lastChild.textContent=R.prog>=1?'LOCKED':RTXT[R.state]; });
  rc.clearRect(0,0,264,264); rc.strokeStyle='rgba(236,220,192,.25)'; rc.lineWidth=2; rc.beginPath(); rc.arc(132,132,66,0,7); rc.moveTo(132,10); rc.lineTo(132,254); rc.moveTo(10,132); rc.lineTo(254,132); rc.stroke();
  rc.fillStyle='#ecdcc0'; rc.beginPath(); rc.moveTo(132,120); rc.lineTo(141,142); rc.lineTo(123,142); rc.fill();
  const sy=Math.sin(P.yaw), cy=Math.cos(P.yaw);
  const dot=(wx,wz,col,r,label)=>{ const dx=wx-P.pos.x, dz=wz-P.pos.z; let rx=(cy*dx-sy*dz)*3, ry=(-sy*dx-cy*dz)*3; const l=Math.hypot(rx,ry); if(l>118){ rx*=118/l; ry*=118/l; }
    rc.fillStyle=col; if(label){ rc.font='700 22px sans-serif'; rc.textAlign='center'; rc.textBaseline='middle'; rc.fillText(label,132+rx,132-ry); } else { rc.beginPath(); rc.arc(132+rx,132-ry,r,0,7); rc.fill(); } };
  for(const R of RELAYS) dot(R.x,R.z,R.prog>=1?'#4dff9a':'#ffb23e',0,R.id);
  for(const c of echoes) if(c.alive) dot(c.g.position.x,c.g.position.z,'#8fe0ff',6);
  for(const e of enemies) if(!e.dead) dot(e.g.position.x,e.g.position.z,e.heavy?'#ffb23e':'#ff4a36',e.heavy?8:6);
}

/* ---------- build everything once assets are in ---------- */
function init(){
  // sky + image-based lighting; the sun direction is read out of the HDR itself
  const hdr=A.hdr; hdr.mapping=THREE.EquirectangularReflectionMapping; scene.background=hdr;
  const img=hdr.image, D=img.data, ch=D.length/(img.width*img.height); let mx=0; for(let i=0;i<D.length;i+=ch){ const l=D[i]+D[i+1]+D[i+2]; if(l>mx) mx=l; }
  const sunDir=new THREE.Vector3(); for(let y=0;y<img.height;y++)for(let x=0;x<img.width;x++){ const i=(y*img.width+x)*ch, l=D[i]+D[i+1]+D[i+2]; if(l>mx*.5){ const u=(x+.5)/img.width, v=(y+.5)/img.height, ph=(u-.5)*Math.PI*2, th=(v-.5)*Math.PI; sunDir.add(new THREE.Vector3(Math.cos(th)*Math.cos(ph),Math.sin(th),Math.cos(th)*Math.sin(ph))); } }
  // ambient light comes from the sky with the sun disc clipped out, so the directional light can own the sun and its shadows
  const E=new Float32Array(D.length); for(let i=0;i<D.length;i++) E[i]=Math.min(D[i],3.5);
  const envTex=new THREE.DataTexture(E,img.width,img.height,hdr.format,THREE.FloatType); envTex.mapping=THREE.EquirectangularReflectionMapping; envTex.minFilter=envTex.magFilter=THREE.LinearFilter; envTex.flipY=hdr.flipY; envTex.encoding=THREE.LinearEncoding; envTex.needsUpdate=true;
  const pm=new THREE.PMREMGenerator(renderer); scene.environment=pm.fromEquirectangular(envTex).texture; pm.dispose(); envTex.dispose();
  sunDir.normalize(); if(sunDir.y<0) sunDir.y=-sunDir.y; G.sunSky=sunDir.clone();
  // the real sun sits on the horizon; the light is lifted a little so shadows stay readable inside the walls
  if(sunDir.y<.27){ sunDir.y=.27; sunDir.normalize(); } G.sunDir=sunDir;
  const sun=new THREE.DirectionalLight(0xffa868,5.5); sun.position.copy(sunDir).multiplyScalar(110); sun.castShadow=true;
  sun.shadow.mapSize.set(LOWQ?1024:4096,LOWQ?1024:4096); const sc=sun.shadow.camera; sc.left=-62; sc.right=62; sc.top=45; sc.bottom=-45; sc.near=1; sc.far=300; sun.shadow.bias=-0.0004; sun.shadow.normalBias=0.04; scene.add(sun);

  // ground and structures
  const gm=new THREE.Mesh(new THREE.PlaneGeometry(900,900),mSand); gm.geometry.setAttribute('uv2',gm.geometry.attributes.uv.clone()); [mSand.map,mSand.normalMap,mSand.roughnessMap].forEach(t=>t.repeat.set(225,225));
  gm.rotation.x=-Math.PI/2; gm.receiveShadow=true; scene.add(gm); worldMeshes.push(gm);
  box(0,-40.5,82,1,5,mConc); box(0,40.5,82,1,5,mConc); box(-40.5,0,1,82,5,mConc); box(40.5,0,1,82,5,mConc);
  box(-21,-26,14,.5,3.2,mPlaster); box(-28,-20,.5,12.5,3.2,mPlaster); box(-25.5,-14,5,.5,3.2,mPlaster); box(-17,-14,6,.5,2.4,mPlaster); box(-14,-23.5,.5,5,3.2,mPlaster); box(-14,-16,.5,4,1.8,mPlaster);
  box(18,14,8,.5,3,mPlaster); box(26.5,14,3,.5,2.2,mPlaster); box(28,20,.5,12.5,3,mPlaster); box(21,26,14,.5,3,mPlaster); box(14,17,.5,6,3,mPlaster); box(14,24.5,.5,3,1.6,mPlaster);
  const deco=(x,y,z,w,h,d,mat,ts,sh)=>{ const m=new THREE.Mesh(boxGeo(w,h,d,ts||3),mat); m.position.set(x,y+h/2,z); m.castShadow=!!sh; m.receiveShadow=!!sh; scene.add(m); return m; };
  [[10,-18,6,2.5,0,1],[12.5,-22.5,2.5,6,1,2],[-16,12,6,2.5,2,2],[-22,18,2.5,6,1,1],[26,-6,2.5,6,3,2],[-30,0,6,2.5,4,2],[4,26,6,2.5,5,1],[-33,-14,2.5,6,3,2],[33,24,2.5,6,2,1]].forEach(c=>{
    box(c[0],c[1],c[2],c[3],2.6,mCont[c[4]],2.6);
    if(c[5]>1){ worldMeshes.push(deco(c[0]+rand(-.1,.1),2.6,c[1]+rand(-.1,.1),c[2],2.6,c[3],mCont[(c[4]+3)%7],2.6,true)); cols[cols.length-1].h=5.2; } });
  // container stacks beyond the walls
  for(let side=0;side<4;side++) for(let row=0;row<2;row++) for(let k=-5;k<=5;k++){ if(Math.random()<.12) continue;
    const along=k*12.6+rand(-.2,.2), out=44.5+row*3.1, lv=1+((Math.random()*(row?5:4))|0), horiz=side<2;
    for(let j=0;j<lv;j++){ const x=horiz?along:(side===2?-out:out), z=horiz?(side===0?-out:out):along; deco(x,j*2.6,z,horiz?12.2:2.44,2.6,horiz?2.44:12.2,mCont[(Math.random()*7)|0],2.6,false); } }
  // gantry cranes against the sunset
  const az=Math.atan2(G.sunSky.z,G.sunSky.x);
  [[-.55,95],[.1,120],[.6,100],[2.6,110]].forEach(c=>{ const g=new THREE.Group(), a=az+c[0]; g.position.set(Math.cos(a)*c[1],0,Math.sin(a)*c[1]); g.rotation.y=-a+rand(-.3,.3);
    const b=(x,y,z,w,h,d)=>{ const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mSteel); m.position.set(x,y,z); g.add(m); };
    for(const sx of [-9,9]) for(const sz of [-7,7]) b(sx,21,sz,1.4,42,1.4);
    for(const sz of [-7,7]){ b(0,41,sz,19.4,1.6,1.6); b(0,16,sz,19.4,1,1); } for(const sx of [-9,9]){ b(sx,41,0,1.4,1.6,15.4); b(sx,28,0,.8,.8,15.4); }
    b(0,44,8,3,3.2,58); b(0,43,-34,3,2,26); b(0,52,0,1,14,1); b(0,58.6,10,.5,.5,40); b(4,40.5,10,3.4,2.6,4);
    const guy=new THREE.Mesh(new THREE.BoxGeometry(.35,.35,31),mSteel); guy.position.set(0,51.5,20); guy.rotation.x=.42; g.add(guy);
    const bl=new THREE.Sprite(new THREE.SpriteMaterial({map:tGlow,color:0xff2a1a,blending:THREE.AdditiveBlending,depthWrite:false})); bl.scale.setScalar(5); bl.position.set(0,60,0); g.add(bl);
    scene.add(g); });
  // sodium yard lamps
  [[-8,-2.5],[13,11],[-13,21],[17,-15]].forEach(l=>{ deco(l[0],0,l[1],.22,7,.22,mSteel,3,true); deco(l[0]+.7,6.9,l[1],1.6,.14,.2,mSteel,3,false); const hd=deco(l[0]+1.4,6.72,l[1],.5,.12,.3,mLamp,3,false);
    addCol(l[0],l[1],.3,.3,7); const pl=new THREE.PointLight(0xffa850,2.6,26,1.6); pl.position.set(l[0]+1.4,6.4,l[1]); scene.add(pl);
    const gl=new THREE.Sprite(new THREE.SpriteMaterial({map:tGlow,color:0xffb060,blending:THREE.AdditiveBlending,depthWrite:false,opacity:.9})); gl.scale.setScalar(2.6); gl.position.copy(hd.position); scene.add(gl); });
  // rain
  { const NR=1400, pos=new Float32Array(NR*6); rain={n:NR,pos,seed:new Float32Array(NR*3)}; for(let i=0;i<NR;i++){ rain.seed[i*3]=rand(-14,14); rain.seed[i*3+1]=rand(0,14); rain.seed[i*3+2]=rand(-14,14); }
    const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.BufferAttribute(pos,3)); rain.mesh=new THREE.LineSegments(g,new THREE.LineBasicMaterial({color:0xcfd6dd,transparent:true,opacity:.22,depthWrite:false})); rain.mesh.frustumCulled=false; scene.add(rain.mesh); }

  // scanned props
  const crate=proto(A.wooden_military_crate), mil=proto(A.old_military_crate,n=>/_a$/.test(n)&&!/cloth/.test(n)), barrier=proto(A.concrete_road_barrier_02), bar1=proto(A.Barrel_01), bar3=proto(A.barrel_03);
  PR_.ammo=proto(A.ammo_box); PR_.nade=proto(A.stick_grenade);
  const CS=1.5, cw=crate.size.x*CS, chh=crate.size.y*CS, cd=crate.size.z*CS;
  [[4.5,-4.2,0,2],[6.3,-5,1,1],[-5,-12.5,1,3],[-3.4,-12.2,0,1],[18.5,-10,0,2],[-20,-2,1,2],[-8.5,22,0,3],[-8.2,23.3,0,1],[8,31,0,2],[30.5,10.4,0,3],[30.2,12,1,1],[-34,20,1,2],[.5,14,0,2],[-22,-20,0,1],[21.5,20,1,2],[-12,-32,0,2],[32,-32,1,3]].forEach(c=>{
    for(let k=0;k<c[3];k++) place(crate,c[0]+(k?rand(-.05,.05):0),k*chh,c[1]+(k?rand(-.05,.05):0),c[2]*Math.PI/2+(k?rand(-.07,.07):0),CS);
    addCol(c[0],c[1],c[2]?cd:cw,c[2]?cw:cd,chh*c[3]); });
  [[-3.3,-13.6,0],[19.9,-11.3,1],[2.1,12.9,0],[-21,-18.6,1],[9.4,29.8,0],[6.6,7.6,1]].forEach(c=>{ place(mil,c[0],0,c[1],c[2]*Math.PI/2,CS); const w=mil.size.x*CS,d=mil.size.z*CS; addCol(c[0],c[1],c[2]?d:w,c[2]?w:d,mil.size.y*CS); });
  const bl=barrier.size.x, bh=.94, bsy=bh/barrier.size.y, bd=barrier.size.z;
  [[0,-8,0],[-6,5,1],[7,6,0],[-10,-6,0],[16,2,1],[-4,18,0],[3,-28,0],[-12,28,0],[22,-28,0],[-30,-30,0],[30,30,1],[-34,10,1],[34,-18,1]].forEach(b=>{
    for(const o of [-.5,.5]) place(barrier,b[0]+(b[2]?0:o*bl*1.01),0,b[1]+(b[2]?o*bl*1.01:0),b[2]*Math.PI/2+(o>0?Math.PI:0),1,bsy,1);
    addCol(b[0],b[1],b[2]?bd:bl*2,b[2]?bl*2:bd,bh); });
  [[2,8],[2.8,8.5],[-14,-10],[20,8],[-26,26],[-26.8,26.4],[9,-13],[-2,-20]].forEach((b,i)=>{ const p=i%2?bar3:bar1; place(p,b[0],0,b[1],rand(0,6),1.15); addCol(b[0],b[1],p.size.x*1.05,p.size.x*1.05,p.size.y*1.15); });
  // relays: a field radio on a crate, a mast, a beacon, a beam you can see over the walls, and a ring marking the hold radius
  const radio=proto(A.vintage_radio_transceiver);
  RELAYS.forEach(R=>{ const cx=R.x+1.4; place(mil,cx,0,R.z,Math.PI/2,CS); addCol(cx,R.z,mil.size.z*CS,mil.size.x*CS,mil.size.y*CS); place(radio,cx,mil.size.y*CS,R.z,rand(-.4,.4)+Math.PI/2,1.7);
    deco(cx+.1,0,R.z+1.1,.09,6.4,.09,mSteel,3,true);
    R.beacon=new THREE.Sprite(new THREE.SpriteMaterial({map:tGlow,color:0x8a98a8,blending:THREE.AdditiveBlending,depthWrite:false})); R.beacon.scale.setScalar(2.4); R.beacon.position.set(cx+.1,6.6,R.z+1.1); scene.add(R.beacon);
    R.beam=new THREE.Mesh(new THREE.CylinderGeometry(.22,.22,70,10,1,true),new THREE.MeshBasicMaterial({color:0x8a98a8,transparent:true,opacity:.1,blending:THREE.AdditiveBlending,depthWrite:false,fog:false,side:THREE.DoubleSide})); R.beam.position.set(cx+.1,41.5,R.z+1.1); scene.add(R.beam);
    R.ring=new THREE.Mesh(new THREE.RingGeometry(4.86,5,72),new THREE.MeshBasicMaterial({color:0x8a98a8,transparent:true,opacity:.55,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide})); R.ring.rotation.x=-Math.PI/2; R.ring.position.set(R.x,.05,R.z); scene.add(R.ring);
    R.prog=0; R.state='idle'; R.field=new Int16Array(N*N); });
  buildGrid(); RELAYS.forEach(R=>flood(R.x,R.z,R.field));

  // soldier: measure, orient, prepare heavy variant
  const sb=new THREE.Box3().setFromObject(A.soldier.scene); soldierScale=1.82/Math.max(.01,sb.max.y-sb.min.y); soldierFlip=SOLDIER_FLIP;
  heavyMats={}; A.soldier.scene.traverse(o=>{ if(o.isMesh&&!heavyMats[o.material.uuid]){ const m=o.material.clone(); m.color.multiplyScalar(.42); heavyMats[o.material.uuid]=m; } });
  ghostMats={}; A.soldier.scene.traverse(o=>{ if(o.isMesh&&!ghostMats[o.material.uuid]){ const m=o.material.clone(); m.color.setRGB(.45,.8,1); m.emissive=new THREE.Color(0x1a6f96); m.emissiveIntensity=.9; m.transparent=true; m.opacity=.6; ghostMats[o.material.uuid]=m; } });
  PR_.erifle=proto(A.bolt_action_rifle_7_62,n=>!/bullet/.test(n)); PR_.erifle.g.children[0].position.set(0,0,0);

  // first-person weapons: models point along +x, turned to face -z
  const r=A.bolt_action_rifle_7_62; r.traverse(o=>{ if(o.isMesh){ o.frustumCulled=false; if(/bullet/.test(o.name)) o.visible=false; } if(/bolt_a$/.test(o.name)) boltA=o; if(/bolt_b$/.test(o.name)) boltB=o; });
  boltA.userData.x=boltA.position.x; boltB.userData.x=boltB.position.x;
  const g0=new THREE.Group(); r.rotation.y=Math.PI/2; r.position.set(0,0,-.2); g0.add(r); vm.add(g0); guns[0]=g0; MUZ[0].set(0,.03,-.84);
  const ps=A.service_pistol; ps.traverse(o=>{ if(o.isMesh){ o.frustumCulled=false; if(!/_a$/.test(o.name)) o.visible=false; } if(/slide_a$/.test(o.name)) slide=o; }); slide.userData.x=slide.position.x;
  const g1=new THREE.Group(); ps.rotation.y=Math.PI/2; g1.add(ps); vm.add(g1); guns[1]=g1; MUZ[1].set(0,.06,-.2);
  flash=new THREE.Sprite(new THREE.SpriteMaterial({map:tFlash,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,depthTest:false})); flash.visible=false; vm.add(flash);
  showGun(); rec={s:[],e:[],died:false,end:0};
  $('go').disabled=false; $('load').hidden=true; showOverlay();
}
const SOLDIER_FLIP=Math.PI; let rain=null, rainSnd=false;
function updateRain(dt,t){ if(!rain) return; const p=rain.pos, s=rain.seed, c=camera.position;
  for(let i=0;i<rain.n;i++){ let y=s[i*3+1]-dt*19; if(y<0) y+=14; s[i*3+1]=y;
    const x=c.x+((s[i*3]-c.x)%28+42)%28-14, z=c.z+((s[i*3+2]-c.z)%28+42)%28-14, yy=c.y-5+y, k=i*6;
    p[k]=x; p[k+1]=yy; p[k+2]=z; p[k+3]=x+.05; p[k+4]=yy+.55; p[k+5]=z+.03; }
  rain.mesh.geometry.attributes.position.needsUpdate=true; wet.time.value=t; }
const _sv=new THREE.Vector3(), _fw=new THREE.Vector3();
function updateSunUniforms(){ if(!finalPass||!G.sunSky) return; _sv.copy(G.sunSky).multiplyScalar(500).add(camera.position).project(camera); camera.getWorldDirection(_fw);
  const f=_fw.dot(G.sunSky); finalPass.uniforms.sunUv.value.set(_sv.x*.5+.5,_sv.y*.5+.5); finalPass.uniforms.sunVis.value=clamp((f-.25)/.5,0,1); finalPass.uniforms.aspect.value=camera.aspect; }

/* ---------- loop ---------- */
let last=performance.now(), slowAcc=.016, slowAt=0;
function sim(dt){
  G.time+=dt; G.t-=dt; const el=LOOP-G.t;
  updatePlayer(dt); flash.position.copy(MUZ[P.w]);
  G.flowT-=dt; if(G.flowT<=0){ G.flowT=.35; flood(P.pos.x,P.pos.z,fdist); }
  spawnLogic(el); updateEchoes(dt,el); updateEnemies(dt); updateNades(dt); updateRelays(dt); updateFx(dt); updateHud(dt);
  if(G.t<10){ G.rumble-=dt; if(G.rumble<=0){ G.rumble=lerp(.9,2.6,G.t/10); boom(lerp(.4,.12,G.t/10),1.4,150,34); G.shake=Math.min(1,G.shake+lerp(.35,.05,G.t/10)); } }
  if(G.t<=0&&!G.pend) G.pend='time';
  if(G.pend){ const p=G.pend; G.pend=null; if(p==='win') win(); else endLoop(p==='died'); }
}
function frame(now){
  requestAnimationFrame(frame);
  const dt=Math.min(.05,(now-last)/1000); last=now;
  if(!ready) return;
  if(G.state==='play'&&!LOWQ){ slowAcc=lerp(slowAcc,dt,.02); if(slowAcc>.03&&PR>.7&&now-slowAt>3000){ slowAt=now; PR=Math.max(.7,PR-.25); renderer.setPixelRatio(PR); resize(); } }
  if(G.state==='play'&&!G.freeze) sim(dt);
  else if(G.state==='menu'||G.state==='over'||G.state==='won'){ const t=now/11000; camera.position.set(Math.cos(t)*26,7,Math.sin(t)*26); camera.lookAt(0,1.2,0); updateFx(dt); vm.visible=false; }
  if(G.state==='pause') vm.visible=!(P.w===0&&P.ads>.93);
  updateRain(dt,now/1000); updateSunUniforms();
  if(composer){ finalPass.uniforms.time.value=now/1000; finalPass.uniforms.hurt.value=clamp(1-P.hp/60,0,1); composer.render(); } else renderer.render(scene,camera);
}
window.__dustline={G,P,enemies,echoes,RELAYS,start,scene,camera,A,spawnEnemy,WPN,recs:()=>recs,step:n=>{ for(let i=0;i<n&&G.state==='play';i++) sim(1/60); }};
showOverlay(); requestAnimationFrame(frame);
})();
