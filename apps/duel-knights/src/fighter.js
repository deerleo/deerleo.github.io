import * as THREE from 'three';
import {clamp,rand,damp,angDiff,V,UP,DOWN} from './util.js';
import {scene,disposeTree} from './render.js';
import {Snd} from './audio.js';
import {FX} from './fx.js';
import {ARENA_R} from './arena.js';
import {buildKnight,HIP_Y,UA,FA,TH,SHN,ANKLE,CHEST_OFF,SH_R,SH_L,HJ_L,HJ_R} from './knight.js';
import {WEAPONS} from './weapons.js';
import {P,K,POSE,EASE,buildMoves} from './moves.js';

/** every stat a character may override (see characters.js) */
export const BASE_STATS={
  hp:100, stam:100,            // pools
  speed:3.5, regen:32,         // walk speed (m/s), stamina regained per second
  dodgeCost:20, dodgeSpeed:8.6,
  atkSpeed:1, dmg:1, heavyDmg:1, // attack timing and damage multipliers
  guard:1,                     // multiplier on stamina lost when blocking
  riposte:1.35,                // damage multiplier against a parried or guard-broken foe
};

/* ───────────────────────── two-bone IK ───────────────────────── */
const _ik={d:V(),perp:V(),E:V(),dU:V(),dF:V(),T:V(),qU:new THREE.Quaternion(),qF:new THREE.Quaternion()};
function ik2(upper,fore,S,T,pole,L1,L2,outQ){
  const k=_ik;k.d.subVectors(T,S);let dist=k.d.length();if(dist<1e-4){k.d.set(0,-1,0);dist=.05;}else k.d.divideScalar(dist);
  dist=clamp(dist,.06,(L1+L2)*.999);
  const cosA=clamp((L1*L1+dist*dist-L2*L2)/(2*L1*dist),-1,1),sinA=Math.sqrt(1-cosA*cosA);
  k.perp.copy(pole).addScaledVector(k.d,-pole.dot(k.d));if(k.perp.lengthSq()<1e-6)k.perp.set(0,0,-1);k.perp.normalize();
  k.E.copy(S).addScaledVector(k.d,L1*cosA).addScaledVector(k.perp,L1*sinA);
  k.dU.subVectors(k.E,S).normalize();k.T.copy(S).addScaledVector(k.d,dist);k.dF.subVectors(k.T,k.E).normalize();
  k.qU.setFromUnitVectors(DOWN,k.dU);k.qF.setFromUnitVectors(DOWN,k.dF);
  upper.quaternion.copy(k.qU);fore.quaternion.copy(k.qU).invert().multiply(k.qF);outQ.copy(k.qF);
}

/* ───────────────────────── weapon trail ───────────────────────── */
class Trail{
  constructor(color){
    this.n=18;this.pos=new Float32Array(this.n*6);this.col=new Float32Array(this.n*6);this.str=new Float32Array(this.n);this.color=new THREE.Color(color);
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(this.pos,3));g.setAttribute('color',new THREE.BufferAttribute(this.col,3));
    const idx=[];for(let i=0;i<this.n-1;i++){const a=i*2;idx.push(a,a+1,a+2,a+1,a+3,a+2);}g.setIndex(idx);
    this.mesh=new THREE.Mesh(g,new THREE.MeshBasicMaterial({vertexColors:true,blending:THREE.AdditiveBlending,side:THREE.DoubleSide,depthWrite:false,transparent:true}));
    this.mesh.frustumCulled=false;scene.add(this.mesh);
  }
  push(a,b,s,hot){
    this.pos.copyWithin(6,0,(this.n-1)*6);this.str.copyWithin(1,0,this.n-1);
    this.pos[0]=a.x;this.pos[1]=a.y;this.pos[2]=a.z;this.pos[3]=b.x;this.pos[4]=b.y;this.pos[5]=b.z;this.str[0]=s;
    const c=this.color;
    for(let i=0;i<this.n;i++){const f=this.str[i]*Math.pow(1-i/this.n,2),r=hot?1.6:c.r,g=hot?.7:c.g,bl=hot?.25:c.b;
      this.col[i*6]=r*f*.1;this.col[i*6+1]=g*f*.1;this.col[i*6+2]=bl*f*.1;this.col[i*6+3]=r*f*.6;this.col[i*6+4]=g*f*.6;this.col[i*6+5]=bl*f*.6;}
    this.mesh.geometry.attributes.position.needsUpdate=true;this.mesh.geometry.attributes.color.needsUpdate=true;
  }
  dispose(){scene.remove(this.mesh);this.mesh.geometry.dispose();this.mesh.material.dispose();}
}

/* ───────────────────────── fighter ───────────────────────── */
const _q={hInv:new THREE.Quaternion(),cInv:new THREE.Quaternion(),all:new THREE.Quaternion(),d:new THREE.Quaternion(),f:new THREE.Quaternion(),
  m:new THREE.Matrix4(),x:V(),y:V(),z:V(),t:V(),pole:V(),e:new THREE.Euler(0,0,0,'YXZ'),
  wq:new THREE.Quaternion(),wr:V(),wy:V(),g:V(),v:V()};
const smooth=u=>{u=clamp(u,0,1);return u*u*(3-2*u);};
/** where an elbow points. Low hands keep it down and back; as the hand rises past the shoulder it swings
    out to the front, so a raised arm folds forward over the shoulder instead of bending behind the head. */
const elbow=(pole,side,handY)=>{const k=smooth((handY-SH_R.y+.12)/.42);return pole.set(side*(.55+.25*k),-1+.9*k,-.35+1.05*k);};
/* a two-handed weapon: the left hand takes the haft nearest this point in front of the chest (chest frame),
   lets it slide between GRIP[0] and GRIP[1] from the right hand, and lets go when the haft is out of reach */
const GRIP_AT=V(.15,.2,.34),GRIP=[.12,.55];
const EDGE_AXIS=V(1,0,0); // the axis an overhead chop turns about (the knight's left): the default for a one-edged weapon
export class Fighter{
  /** char: an entry from characters.js · look: optional overrides (used for mirror matches) */
  constructor(char,isPlayer,look={}){
    this.char=char;this.isPlayer=isPlayer;
    const L={...char.look,...look};
    this.weapon=WEAPONS[char.weapon];this.wr=this.weapon.radius;this.reach=this.weapon.reach*(L.scale||1);
    this.stats={...BASE_STATS,...char.stats};this.maxHp=this.stats.hp;this.maxSt=this.stats.stam;
    this.moves=buildMoves(this.weapon.moves,this.stats);
    this.b=buildKnight({...L,weapon:char.weapon});this.root=this.b.root;
    this.pos=this.root.position;this.vel=V();this.yaw=0;this.seed=rand(10);
    this.pose=P();this.clip={t:0,keys:[{t:0,p:P(),e:0},{t:0,p:P(),e:0}]};
    this.intent={mx:0,mz:0,face:0,block:false,blockPressed:false,light:false,heavy:false,dodge:false,taunt:false};
    this.trail=new Trail(L.trailColor);
    this.blade=[V(),V()];this.pBlade=[V(),V()];
    this.vols=[];for(let i=0;i<10;i++)this.vols.push({a:V(),b:V(),r:.1});
    this.other=null;this.brain=null;this.ragdoll=null;this.emit=()=>{};this.onStamFail=()=>{};
    this.reset(V(),0);
  }
  /** remove from the scene and free GPU memory */
  dispose(){
    if(this.ragdoll){this.ragdoll.restore();this.ragdoll=null;}
    scene.remove(this.root);disposeTree(this.root);this.trail.dispose();
  }
  reset(pos,yaw){
    if(this.ragdoll){this.ragdoll.restore();this.ragdoll=null;}
    this.pos.copy(pos);this.vel.set(0,0,0);this.yaw=yaw;this.root.rotation.y=yaw;
    this.hp=this.maxHp;this.ghost=this.maxHp;this.ghostT=0;this.stam=this.maxSt;this.regenDelay=0;
    this.state='free';this.st=0;this.stDur=0;this.atk=null;this.phase='';this.serial=0;
    this.blocking=false;this.blockT=9;this.lastBlockDown=-9;this.parryOK=false;this.iframes=false;
    this.buf=null;this.bufT=0;this.swingHit=false;this.swingContact=false;this.chainLock=false;
    this.flP=0;this.flPv=0;this.flR=0;this.flRv=0;this.walk=0;this.t=0;this.stance=null;this.stepSide=0;this.victory=false;this.rest=false;
    this.dodgeDir=V();this.edge=V(0,0,1);this.gripW=0;this.trail.str.fill(0);this.setStance('guard',.01);this.clip.t=1;
    this.animate(0);this.root.updateMatrixWorld(true);this.readBlade();this.pBlade[0].copy(this.blade[0]);this.pBlade[1].copy(this.blade[1]);
  }
  get fwd(){return _q.t.set(Math.sin(this.yaw),0,Math.cos(this.yaw));}
  setClip(keys){this.clip={t:0,keys:[{t:0,p:this.pose.slice(),e:0},...keys]};}
  /** a named pose, as this fighter's weapon holds it */
  poseOf(n){return this.weapon.poses?.[n]||POSE[n];}
  setStance(n,t=.16){if(this.stance!==n){this.stance=n;this.setClip([{t,p:this.poseOf(n),e:1}]);}}
  useStam(c){if(this.stam<=0){if(this.isPlayer)this.onStamFail();return false;}
    this.stam-=c;this.regenDelay=.85;if(this.stam<=0){this.stam=0;this.regenDelay=1.6;}return true;}
  startAttack(id){
    const a=this.moves[id];if(!this.useStam(a.cost))return false;
    this.state='attack';this.atk=a;this.atkId=id;this.st=0;this.phase='wind';this.swingHit=false;this.swingContact=false;this.chainLock=false;
    this.blocking=false;this.lastBlockDown=this.t;this.serial++;this.stance=null;this.buf=null;this.setClip(a.keys);
    this.emit('attackStart',a.kind);return true;
  }
  startDodge(){
    if(!this.useStam(this.stats.dodgeCost))return false;
    const I=this.intent,m=Math.hypot(I.mx,I.mz);
    if(m>.25)this.dodgeDir.set(I.mx/m,0,I.mz/m);else this.dodgeDir.copy(this.fwd).multiplyScalar(-1);
    this.state='dodge';this.st=0;this.stDur=.44;this.blocking=false;this.lastBlockDown=this.t;this.stance=null;this.buf=null;
    const side=this.dodgeDir.x*Math.cos(this.yaw)-this.dodgeDir.z*Math.sin(this.yaw);
    const dp=this.poseOf('dodge').slice();dp[14]=-side*.35;
    this.setClip([{t:.1,p:dp,e:2},{t:.3,p:dp,e:0},{t:.44,p:this.poseOf('guard'),e:1}]);
    Snd.dodge();FX.dust(this.pos,3);this.emit('dodge');return true;
  }
  stun(kind,dur){
    this.state=kind;this.st=0;this.stDur=dur;this.blocking=false;this.lastBlockDown=this.t;this.stance=null;this.buf=null;this.atk=null;this.iframes=false;
    const G=(t,e=1)=>({t,p:this.poseOf('guard'),e}); // every stagger ends back in this weapon's guard
    if(kind==='hit'){const s=Math.random()<.5?1:-1;this.setClip([K(.08,{cy:s*.4,cp:-.26,hy:-.04,rh:[-.52,.2,.1],rd:[-.5,.5,.7],lh:[.4,.25,.2],ld:[.6,0,.8]},2),G(dur+.1)]);}
    else if(kind==='parried')this.setClip([{t:.12,p:POSE.stagger,e:2},K(dur-.25,{cy:.36,cp:-.24,hy:-.08,rh:[-.62,.22,.0],rd:[-.8,.05,.6],lh:[.5,.2,.1],ld:[.9,0,.4]},0),G(dur)]);
    else if(kind==='broken')this.setClip([{t:.12,p:POSE.broken,e:2},{t:dur-.25,p:POSE.broken,e:0},G(dur)]);
    else this.setClip([K(.08,{cy:-.5,cp:-.15,rh:[-.55,.55,-.05],rd:[-.5,.8,-.2]},2),G(dur)]);
  }
  turn(rate,dt){const d=angDiff(this.yaw,this.intent.face),m=rate*dt;this.yaw+=clamp(d,-m,m);}
  update(dt){
    const I=this.intent,S=this.stats;this.t+=dt;
    if(this.state==='dead'){I.light=I.heavy=I.dodge=I.blockPressed=false;return;}
    this.regenDelay-=dt;
    if(this.regenDelay<=0&&this.state!=='attack'&&this.state!=='dodge')this.stam=Math.min(this.maxSt,this.stam+(this.blocking?S.regen*.3125:S.regen)*dt);
    if(I.dodge){this.buf='dodge';this.bufT=.3;}else if(I.heavy){this.buf='heavy';this.bufT=.3;}else if(I.light){this.buf='light';this.bufT=.3;}
    this.bufT-=dt;if(this.bufT<=0)this.buf=null;
    this.ghostT-=dt;if(this.ghostT<=0)this.ghost=Math.max(this.hp,this.ghost-60*dt);
    const f=this.fwd,fx=f.x,fz=f.z;
    switch(this.state){
      case 'free':{
        this.turn(this.isPlayer&&!this.brain?18:6.5,dt); // a human turns faster than the AI
        const wantBlock=I.block&&this.stam>0;
        if(wantBlock&&!this.blocking){this.blocking=true;this.blockT=0;this.parryOK=(this.t-this.lastBlockDown)>.32;this.emit('blockUp');}
        else if(!wantBlock&&this.blocking){this.blocking=false;this.lastBlockDown=this.t;}
        this.blockT+=dt;
        let sp=this.blocking?S.speed*.486:S.speed;const back=I.mx*fx+I.mz*fz;if(back<-.3)sp*=.82;
        this.vel.x=damp(this.vel.x,I.mx*sp,12,dt);this.vel.z=damp(this.vel.z,I.mz*sp,12,dt);
        if(this.buf==='dodge'){this.startDodge();}
        else if(this.buf==='heavy'){this.startAttack('heavy');}
        else if(this.buf==='light'){this.startAttack('l1');}
        if(this.state==='free')this.setStance(this.victory?'victory':this.rest?'rest':I.taunt?'taunt':this.blocking?'block':'guard',this.blocking?.09:.18);
        break;}
      case 'attack':{
        const a=this.atk,prev=this.phase,st0=this.st;this.st+=dt;
        this.phase=this.st<a.wind?'wind':this.st<a.wind+a.act?'active':'recover';
        const ring=a.wind*.74; // a charged blow rings once it can no longer be feinted
        if(a.charged&&st0<ring&&this.st>=ring)Snd.charge();
        this.turn(this.phase==='wind'?(this.isPlayer&&!this.brain?2.4:1.7):this.phase==='active'?.4:1.2,dt);
        if(a.kind==='heavy'&&this.phase==='wind'&&this.st<a.wind*.72&&this.st>.08&&I.blockPressed){ // feint
          this.state='free';this.atk=null;this.stam=Math.min(this.maxSt,this.stam+12);this.emit('feint');break;}
        if(this.st>a.wind-.1&&this.phase!=='recover'){this.vel.x=fx*a.lunge;this.vel.z=fz*a.lunge;}
        else{this.vel.x=damp(this.vel.x,0,9,dt);this.vel.z=damp(this.vel.z,0,9,dt);}
        if(prev==='wind'&&this.phase==='active'){
          if(a.charged){Snd.drive();FX.dust(this.pos,5);FX.shake(.22);FX.kick(2.5);} // the stamp of the leading foot
          else Snd.swing(a.kind==='heavy',this.weapon.blunt);}
        if(prev==='active'&&this.phase==='recover'&&!this.swingContact)this.emit('whiff',a.kind);
        const tot=a.wind+a.act+a.rec+(this.chainLock?.14:0);
        if(this.phase==='recover'){
          if(a.next&&this.buf==='light'&&!this.chainLock&&this.st>a.wind+a.act+.06){this.startAttack(a.next);break;}
          if(this.buf==='dodge'&&this.st>a.wind+a.act+a.rec*.55){this.startDodge();break;}
        }
        if(this.st>=tot){this.state='free';this.atk=null;this.phase='';}
        break;}
      case 'dodge':{
        this.st+=dt;const k=Math.min(1,this.st/this.stDur),sp=S.dodgeSpeed*Math.pow(1-k,1.25);
        this.vel.x=this.dodgeDir.x*sp;this.vel.z=this.dodgeDir.z*sp;this.iframes=this.st>.03&&this.st<.3;
        this.turn(4,dt);
        if(this.st>=this.stDur){this.state='free';this.iframes=false;}
        break;}
      default:{ // hit / parried / broken / clash
        this.st+=dt;this.vel.x=damp(this.vel.x,0,7,dt);this.vel.z=damp(this.vel.z,0,7,dt);
        if(this.st>=this.stDur)this.state='free';
      }
    }
    I.light=I.heavy=I.dodge=I.blockPressed=false;
    this.pos.x+=this.vel.x*dt;this.pos.z+=this.vel.z*dt;
    const r=Math.hypot(this.pos.x,this.pos.z);if(r>ARENA_R){this.pos.x*=ARENA_R/r;this.pos.z*=ARENA_R/r;}
    this.root.rotation.y=this.yaw;
  }
  /** evaluate the pose clip and drive every bone */
  animate(dt){
    const c=this.clip,k=c.keys,p=this.pose,b=this.b;c.t+=dt;
    let i=1;while(i<k.length-1&&c.t>k[i].t)i++;
    const ka=k[i-1],kb=k[i];let u=kb.t>ka.t?clamp((c.t-ka.t)/(kb.t-ka.t),0,1):1;u=EASE[kb.e](u);
    for(let j=0;j<18;j++)p[j]=ka.p[j]+(kb.p[j]-ka.p[j])*u;
    // flinch springs
    this.flPv+=(-this.flP*150-this.flPv*13)*dt;this.flP+=this.flPv*dt;this.flRv+=(-this.flR*150-this.flRv*13)*dt;this.flR+=this.flRv*dt;
    const sn=Math.sin(this.yaw),cs=Math.cos(this.yaw),lz=this.vel.x*sn+this.vel.z*cs,lx=this.vel.x*cs-this.vel.z*sn,sp=Math.hypot(lx,lz);
    const amp=clamp(sp/3.5,0,1.35),prevW=this.walk;
    if(sp>.25)this.walk+=dt*(5.5+sp*1.7);
    if(sp>1&&Math.floor(prevW/Math.PI)!==Math.floor(this.walk/Math.PI)&&this.state!=='dodge'){if(this.isPlayer||Math.random()<.6)Snd.step();}
    const breathe=Math.sin(this.t*1.8+this.seed)*.007;
    b.hips.position.set(0,HIP_Y+p[15]+breathe-.03*amp*Math.abs(Math.cos(this.walk)),p[16]);
    b.hips.rotation.set(0,p[12]*.3,0);
    b.chest.rotation.set(p[13]+this.flP+lz*.022+breathe*2,p[12]*.7,p[14]+this.flR-lx*.03);
    b.head.rotation.set(-p[13]*.6-this.flP*.6,-p[12]*.78,-this.flR*.5);
    const Q=_q;Q.hInv.copy(b.hips.quaternion).invert();Q.cInv.copy(b.chest.quaternion).invert();Q.all.copy(Q.cInv).multiply(Q.hInv);
    // right arm → weapon
    Q.t.set(p[0],p[1],p[2]).applyQuaternion(Q.hInv).sub(CHEST_OFF).applyQuaternion(Q.cInv);
    Q.y.set(p[3],p[4],p[5]).normalize();Q.x.crossVectors(Q.y,UP);if(Q.x.lengthSq()<1e-4)Q.x.set(1,0,0);Q.x.normalize();Q.z.crossVectors(Q.x,Q.y);
    if(this.weapon.edge){ // a one-edged head (built facing the hand's −Z) is aimed, not left to the frame above:
      // that frame turns over whenever the weapon passes through vertical, which spun the head about its own haft.
      // Instead the edge is carried from frame to frame and eased round the haft toward where it should lead:
      // the way the head travels turning about the cut's own axis, or about the chop's axis when not cutting
      // (so a raised axe already faces the foe). It never jumps, and holds still where that is undefined.
      const a=this.atk,e=this.edge,cut=this.state==='attack'&&a&&a.axis&&this.st>a.wind*.15&&this.st<a.wind+a.act+a.rec*.35;
      const want=Q.v.crossVectors(cut?Q.g.fromArray(a.axis):EDGE_AXIS,Q.y);
      e.addScaledVector(Q.y,-e.dot(Q.y));if(e.lengthSq()<1e-6)e.copy(Q.z).negate();e.normalize();
      if(want.lengthSq()>.03){want.normalize();const ang=Math.atan2(Q.g.crossVectors(e,want).dot(Q.y),e.dot(want));
        e.applyAxisAngle(Q.y,dt>0?ang*(1-Math.exp(-16*dt)):ang);}
      Q.z.copy(e).negate();Q.x.crossVectors(Q.y,Q.z);
    }
    Q.d.setFromRotationMatrix(Q.m.makeBasis(Q.x,Q.y,Q.z)).premultiply(Q.all);
    Q.wr.copy(Q.t);Q.wq.copy(Q.d);Q.wy.copy(Q.y).applyQuaternion(Q.all); // the weapon in the chest's frame, for a second hand
    ik2(b.uaR,b.faR,SH_R,Q.t,elbow(Q.pole,-1,Q.t.y),UA,FA,Q.f);b.hR.quaternion.copy(Q.f).invert().multiply(Q.d);
    // left arm → shield, or the haft of a two-handed weapon
    Q.t.set(p[6],p[7],p[8]).applyQuaternion(Q.hInv).sub(CHEST_OFF).applyQuaternion(Q.cInv);
    Q.z.set(p[9],p[10],p[11]).normalize();Q.x.crossVectors(UP,Q.z).normalize();Q.y.crossVectors(Q.z,Q.x);
    Q.d.setFromRotationMatrix(Q.m.makeBasis(Q.x,Q.y,Q.z)).premultiply(Q.all);
    if(this.weapon.twoHanded){
      const g=clamp(Q.g.copy(GRIP_AT).sub(Q.wr).dot(Q.wy),GRIP[0],GRIP[1]);Q.g.copy(Q.wr).addScaledVector(Q.wy,g);
      const w=this.gripW=smooth((Q.g.distanceTo(SH_L)-(UA+FA)*.97)/.14); // 0 = holding the haft, 1 = let go (the pose's own left hand)
      Q.t.lerpVectors(Q.g,Q.t,w);Q.d.slerpQuaternions(Q.wq,Q.d,w);
    }
    ik2(b.uaL,b.faL,SH_L,Q.t,elbow(Q.pole,1,Q.t.y),UA,FA,Q.f);b.hL.quaternion.copy(Q.f).invert().multiply(Q.d);
    // legs: planted stance + stride cycle
    const A_=.25*amp,dxl=sp>.01?lx/sp:0,dzl=sp>.01?lz/sp:0;
    for(let s=0;s<2;s++){
      const L=s===0,ph=this.walk+(L?0:Math.PI),off=A_*Math.sin(ph),lift=A_*.42*Math.max(0,Math.cos(ph));
      Q.t.set((L?.17:-.17)+dxl*off,ANKLE+lift,(L?.20+p[17]:-.18)+dzl*off);
      Q.t.sub(b.hips.position).applyQuaternion(Q.hInv);
      Q.pole.set(L?.25:-.3,0,1).applyQuaternion(Q.hInv);
      ik2(L?b.thL:b.thR,L?b.shL:b.shR,L?HJ_L:HJ_R,Q.t,Q.pole,TH,SHN,Q.f);
      Q.e.set(lift*2.2,L?.3:-.42,0);Q.d.setFromEuler(Q.e).premultiply(Q.hInv);
      (L?b.ftL:b.ftR).quaternion.copy(Q.f).invert().multiply(Q.d);
    }
    // skirt: swing forward with whichever thigh is further forward, so knees never poke through
    {let f=0;for(const th of [b.thL,b.thR]){_q.t.copy(DOWN).applyQuaternion(th.quaternion);f=Math.max(f,Math.atan2(_q.t.z,-_q.t.y));}
      b.skirt.rotation.x=damp(b.skirt.rotation.x,-clamp(f*.8,0,.95),dt>0?22:1e9,dt||1);} // damped, so it trails like cloth
    // cape
    const cp=b.cape.geometry.attributes.position,ca=cp.array,cb=b.capeBase,lift=clamp(lz*.11+Math.abs(lx)*.04,-.05,.5)+Math.abs(this.flP)*.5;
    for(let j=0;j<ca.length;j+=3){const y=-cb[j+1]/b.capeLen;
      ca[j+2]=-(y*(.1+lift*y)+Math.sin(this.t*3.2+y*5+cb[j]*3+this.seed)*.025*y*(1+amp*2));ca[j]=cb[j]*(1+y*.25)+lx*.03*y*y;}
    cp.needsUpdate=true;b.cape.geometry.computeVertexNormals();
  }
  readBlade(){this.b.bBase.getWorldPosition(this.blade[0]);this.b.bTip.getWorldPosition(this.blade[1]);}
  /** capsule hit volumes from the live skeleton */
  volumes(){
    const b=this.b,v=this.vols,sc=this.root.scale.x;
    b.head.getWorldPosition(v[0].a).y+=.16*sc;v[0].b.copy(v[0].a);v[0].r=.16*sc;
    b.hips.getWorldPosition(v[1].a);b.head.getWorldPosition(v[1].b);v[1].r=.24*sc;
    const seg=(i,o1,o2,r)=>{o1.getWorldPosition(v[i].a);o2.getWorldPosition(v[i].b);v[i].r=r*sc;};
    seg(2,b.uaR,b.faR,.08);seg(3,b.faR,b.hR,.07);seg(4,b.uaL,b.faL,.08);seg(5,b.faL,b.hL,.07);
    seg(6,b.thL,b.shL,.1);seg(7,b.shL,b.ftL,.08);seg(8,b.thR,b.shR,.1);seg(9,b.shR,b.ftR,.08);
    return v;
  }
}
