import * as THREE from 'three';

export const $=s=>document.querySelector(s);
export const clamp=(v,a,b)=>v<a?a:v>b?b:v, lerp=(a,b,t)=>a+(b-a)*t;
export const rand=(a=1,b)=>b===undefined?Math.random()*a:a+Math.random()*(b-a);
export const damp=(a,b,l,dt)=>a+(b-a)*(1-Math.exp(-l*dt));
export const TAU=Math.PI*2;
export const angDiff=(a,b)=>{let d=(b-a)%TAU;if(d>Math.PI)d-=TAU;if(d<-Math.PI)d+=TAU;return d;};
export const V=(x=0,y=0,z=0)=>new THREE.Vector3(x,y,z);
export const UP=V(0,1,0), DOWN=V(0,-1,0);

const _d1=V(),_d2=V(),_r=V(),_c1=V(),_c2=V();
/** closest distance between segments p1q1 and p2q2; writes closest points to c1,c2 */
export function segSeg(p1,q1,p2,q2,c1=_c1,c2=_c2){
  _d1.subVectors(q1,p1);_d2.subVectors(q2,p2);_r.subVectors(p1,p2);
  const a=_d1.dot(_d1),e=_d2.dot(_d2),f=_d2.dot(_r);let s=0,t=0;
  if(a>1e-9||e>1e-9){
    if(a<=1e-9){t=clamp(f/e,0,1);}
    else{const c=_d1.dot(_r);
      if(e<=1e-9){s=clamp(-c/a,0,1);}
      else{const b=_d1.dot(_d2),den=a*e-b*b;
        s=den>1e-9?clamp((b*f-c*e)/den,0,1):0;t=(b*s+f)/e;
        if(t<0){t=0;s=clamp(-c/a,0,1);}else if(t>1){t=1;s=clamp((b-c)/a,0,1);}}}
  }
  c1.copy(p1).addScaledVector(_d1,s);c2.copy(p2).addScaledVector(_d2,t);
  return c1.distanceTo(c2);
}

export const params=new URLSearchParams(location.search);
export const DEMO=params.has('demo');
