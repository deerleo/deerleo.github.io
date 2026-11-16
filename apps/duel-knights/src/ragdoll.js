import {lerp,rand,damp,V,UP,DOWN} from './util.js';
import {scene} from './render.js';
import {Snd} from './audio.js';
import {FX} from './fx.js';
import {WALL_R} from './arena.js';
import * as THREE from 'three';

const _d1=V(),_d2=V(),_t=V(),_x=V(),_y=V(),_z=V(),_m=new THREE.Matrix4();
/* ───────────────────────── ragdoll (verlet) ───────────────────────── */
export class Ragdoll{
  constructor(f,dir,power){
    this.f=f;const b=f.b,wp=o=>o.getWorldPosition(V());this.t=0;this.acc=0;this.thud=false;
    const hd=wp(b.head);hd.y+=.18;
    const defs=[['hd',hd,.14,1.25],['sL',wp(b.uaL),.11,1],['sR',wp(b.uaR),.11,1],['eL',wp(b.faL),.06,.9],['eR',wp(b.faR),.06,.9],['hL',wp(b.hL),.07,.8],['hR',wp(b.hR),.06,.8],
      ['pL',wp(b.thL),.13,.55],['pR',wp(b.thR),.13,.55],['kL',wp(b.shL),.08,.3],['kR',wp(b.shR),.08,.3],['fL',wp(b.ftL),.07,.08],['fR',wp(b.ftR),.07,.08]];
    this.p={};this.pts=[];
    for(const [n,pos,r,w] of defs){const v=V().copy(dir).multiplyScalar(power*w).add(f.vel);v.y+=1.2*w+rand(.3);v.x+=rand(-.5,.5);v.z+=rand(-.5,.5);
      const pt={p:pos,q:pos.clone().addScaledVector(v,-1/120),r};this.p[n]=pt;this.pts.push(pt);}
    this.cons=[];const P_=this.p,link=(a,b,min)=>this.cons.push({a:P_[a],b:P_[b],d:P_[a].p.distanceTo(P_[b].p),min});
    [['sL','sR'],['pL','pR'],['sL','pL'],['sR','pR'],['sL','pR'],['sR','pL'],['hd','sL'],['hd','sR'],['hd','pL'],['hd','pR'],
     ['sL','eL'],['eL','hL'],['sR','eR'],['eR','hR'],['pL','kL'],['kL','fL'],['pR','kR'],['kR','fR']].forEach(([a,b])=>link(a,b));
    this.mins=[[P_.hL,P_.sL,.2],[P_.hR,P_.sR,.2],[P_.fL,P_.pL,.5],[P_.fR,P_.pR,.5],[P_.kL,P_.kR,.17],[P_.fL,P_.fR,.16],[P_.kL,P_.sL,.4],[P_.kR,P_.sR,.4],[P_.eL,P_.pL,.2],[P_.eR,P_.pR,.2]];
    // the weapon tumbles free
    const g=wp(b.weapon),tp=wp(b.bTip),sv=V().copy(dir).multiplyScalar(power*.9).add(V(rand(-2,2),3.5,rand(-2,2)));
    this.sw=[{p:g,q:g.clone().addScaledVector(sv,-1/120),r:.03},{p:tp,q:tp.clone().addScaledVector(sv,-1/120).add(V(rand(-.04,.04),-.03,rand(-.04,.04))),r:.02}];
    this.swLen=g.distanceTo(tp);this.swHit=0;
    for(const k of ['hips','uaR','faR','hR','uaL','faL','hL','thL','shL','ftL','thR','shR','ftR','weapon'])scene.attach(b[k]);
    b.chest.rotation.set(0,0,0);
    this.apply();
  }
  step(h){
    const all=this.pts.concat(this.sw);
    for(const pt of all){const vx=(pt.p.x-pt.q.x)*.992,vy=(pt.p.y-pt.q.y)*.992,vz=(pt.p.z-pt.q.z)*.992;pt.q.copy(pt.p);pt.p.x+=vx;pt.p.y+=vy-13*h*h;pt.p.z+=vz;}
    for(let it=0;it<8;it++){
      for(const c of this.cons){_d1.subVectors(c.b.p,c.a.p);const l=_d1.length()||1e-5,df=(l-c.d)/l*.5;c.a.p.addScaledVector(_d1,df);c.b.p.addScaledVector(_d1,-df);}
      for(const [a,b,m] of this.mins){_d1.subVectors(b.p,a.p);const l=_d1.length()||1e-5;if(l<m){const df=(l-m)/l*.5;a.p.addScaledVector(_d1,df);b.p.addScaledVector(_d1,-df);}}
      {const [a,b]=this.sw;_d1.subVectors(b.p,a.p);const l=_d1.length()||1e-5,df=(l-this.swLen)/l*.5;a.p.addScaledVector(_d1,df);b.p.addScaledVector(_d1,-df);}
      for(const pt of all){
        if(pt.p.y<pt.r){
          if(pt.q.y-pt.p.y>.02){if(pt.r<.05){if(this.swHit++<4)Snd.clatter();}else if(!this.thud&&pt.r>.1){this.thud=true;Snd.fall();FX.dust(pt.p,5);FX.shake(.25);}}
          pt.p.y=pt.r;pt.q.x=lerp(pt.q.x,pt.p.x,.35);pt.q.z=lerp(pt.q.z,pt.p.z,.35);}
        const r=Math.hypot(pt.p.x,pt.p.z),mx=WALL_R-1.1;if(r>mx){pt.p.x*=mx/r;pt.p.z*=mx/r;}
      }
    }
  }
  update(dt){this.t+=dt;if(this.t>7)return;this.acc+=dt;let n=0;while(this.acc>=1/120&&n++<8){this.acc-=1/120;this.step(1/120);}this.apply();}
  apply(){
    const b=this.f.b,p=this.p,X=_x,Y=_y,Z=_z;
    const c=_t.addVectors(p.pL.p,p.pR.p).multiplyScalar(.5);
    Y.addVectors(p.sL.p,p.sR.p).multiplyScalar(.5).sub(c).normalize();X.subVectors(p.sL.p,p.sR.p).normalize();Z.crossVectors(X,Y).normalize();X.crossVectors(Y,Z);
    b.hips.quaternion.setFromRotationMatrix(_m.makeBasis(X,Y,Z));b.hips.position.copy(c).addScaledVector(Y,.03);
    b.head.rotation.x=damp(b.head.rotation.x,.35,.1,1);
    const bone=(o,a,bb)=>{o.position.copy(a.p);_d2.subVectors(bb.p,a.p).normalize();o.quaternion.setFromUnitVectors(DOWN,_d2);};
    bone(b.uaL,p.sL,p.eL);bone(b.faL,p.eL,p.hL);bone(b.uaR,p.sR,p.eR);bone(b.faR,p.eR,p.hR);
    bone(b.thL,p.pL,p.kL);bone(b.shL,p.kL,p.fL);bone(b.thR,p.pR,p.kR);bone(b.shR,p.kR,p.fR);
    b.hL.position.copy(p.hL.p);b.hL.quaternion.copy(b.faL.quaternion);b.hR.position.copy(p.hR.p);b.hR.quaternion.copy(b.faR.quaternion);
    b.ftL.position.copy(p.fL.p);b.ftL.quaternion.copy(b.shL.quaternion);b.ftR.position.copy(p.fR.p);b.ftR.quaternion.copy(b.shR.quaternion);
    b.weapon.position.copy(this.sw[0].p);_d2.subVectors(this.sw[1].p,this.sw[0].p).normalize();b.weapon.quaternion.setFromUnitVectors(UP,_d2);
  }
  restore(){for(const r of this.f.b.rest){r.parent.add(r.b);r.b.position.copy(r.pos);r.b.quaternion.identity();r.b.scale.setScalar(1);}
    this.f.b.head.rotation.set(0,0,0);}
}
