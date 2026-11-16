import * as THREE from 'three';
import {rand,damp,V} from './util.js';
import {scene} from './render.js';
import {softTex} from './textures.js';

/* sparks, dust, firelight flashes and the timing tricks: hit-stop, slow-motion, shake, FOV kick */
export const FX=(()=>{
  const N=420,pos=new Float32Array(N*6),col=new Float32Array(N*6),sp=[];let cur=0;
  for(let i=0;i<N;i++)sp.push({p:V(),v:V(),life:0,max:1,c:[1,1,1]});
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(pos,3));g.setAttribute('color',new THREE.BufferAttribute(col,3));
  const lines=new THREE.LineSegments(g,new THREE.LineBasicMaterial({vertexColors:true,blending:THREE.AdditiveBlending,transparent:true,depthWrite:false}));
  lines.frustumCulled=false;scene.add(lines);
  const flash=new THREE.PointLight(0xffc070,0,9,1.6);scene.add(flash);
  const dusts=[];for(let i=0;i<26;i++){const s=new THREE.Sprite(new THREE.SpriteMaterial({map:softTex,color:0x8a7f70,transparent:true,opacity:0,depthWrite:false}));s.visible=false;scene.add(s);dusts.push({s,life:0,v:V()});}
  let dcur=0,trauma=0,hitStop=0,slowT=0,slowS=1,fovKick=0;
  return {
    sparks(p,n,speed,c=[3,1.6,.5],dir=null,spread=1){
      for(let i=0;i<n;i++){const s=sp[cur=(cur+1)%N];s.p.copy(p);
        s.v.set(rand(-1,1),rand(-.4,1.2),rand(-1,1)).normalize().multiplyScalar(speed*rand(.25,1)*spread);
        if(dir)s.v.addScaledVector(dir,speed*rand(.2,.8));s.max=s.life=rand(.25,.7);s.c=c;}
    },
    burst(p,power){flash.position.copy(p);flash.intensity=Math.max(flash.intensity,power);},
    dust(p,n){for(let i=0;i<n;i++){const d=dusts[dcur=(dcur+1)%dusts.length];d.s.visible=true;d.life=1;d.s.position.set(p.x+rand(-.25,.25),.12+rand(.15),p.z+rand(-.25,.25));d.v.set(rand(-.6,.6),rand(.2,.6),rand(-.6,.6));d.s.scale.setScalar(.3);}},
    shake(a){trauma=Math.min(1,trauma+a);},
    stop(t){hitStop=Math.max(hitStop,t);},
    slow(t,s){slowT=t;slowS=s;},
    kick(a){fovKick=Math.max(fovKick,a);},
    get trauma(){return trauma;},get fovKick(){return fovKick;},
    /** returns the simulation dt for this frame after hit-stop and slow-motion */
    time(real){
      trauma=Math.max(0,trauma-real*1.7);fovKick=damp(fovKick,0,7,real);
      if(hitStop>0){hitStop-=real;return 0;}
      if(slowT>0){slowT-=real;return real*slowS;}
      return real;
    },
    update(dt,real){
      flash.intensity=damp(flash.intensity,0,16,real);
      for(let i=0;i<N;i++){const s=sp[i],o=i*6;
        if(s.life<=0){pos[o]=pos[o+3]=0;pos[o+1]=pos[o+4]=-9;pos[o+2]=pos[o+5]=0;continue;}
        s.life-=dt;s.v.y-=13*dt;s.p.addScaledVector(s.v,dt);
        if(s.p.y<.02){s.p.y=.02;s.v.y*=-.4;s.v.x*=.6;s.v.z*=.6;}
        const k=Math.max(0,s.life/s.max),tl=.035;
        pos[o]=s.p.x;pos[o+1]=s.p.y;pos[o+2]=s.p.z;pos[o+3]=s.p.x-s.v.x*tl;pos[o+4]=s.p.y-s.v.y*tl;pos[o+5]=s.p.z-s.v.z*tl;
        col[o]=s.c[0]*k;col[o+1]=s.c[1]*k*k;col[o+2]=s.c[2]*k*k;col[o+3]=s.c[0]*k*.3;col[o+4]=s.c[1]*k*k*.3;col[o+5]=s.c[2]*k*k*.3;}
      g.attributes.position.needsUpdate=true;g.attributes.color.needsUpdate=true;
      for(const d of dusts){if(!d.s.visible)continue;d.life-=dt*1.5;if(d.life<=0){d.s.visible=false;continue;}
        d.s.position.addScaledVector(d.v,dt);d.s.scale.setScalar(.3+(1-d.life)*.9);d.s.material.opacity=d.life*.22;}
    }
  };
})();
