import {rand,angDiff,segSeg,V} from './util.js';
import {Snd} from './audio.js';
import {FX} from './fx.js';
import {Ragdoll} from './ragdoll.js';
import {PARRY_WINDOW} from './moves.js';

/* combat resolution. `game` supplies stats, callouts, the vignette and endRound(). */
let game;
export function initCombat(g){game=g;}

const _hp=V(),_hq=V(),_dir=V(),_a=V(),_b=V();
const inFront=(D,A)=>Math.abs(angDiff(D.yaw,Math.atan2(A.pos.x-D.pos.x,A.pos.z-D.pos.z)))<1.4;
const side=f=>f.isPlayer?0:1;

function kill(D,A,dir,atk){
  D.hp=0;D.state='dead';D.blocking=false;D.iframes=false;D.atk=null;
  D.ragdoll=new Ragdoll(D,dir,(atk.kind==='heavy'?6.5:4.2)*(A.weapon.blunt?1.15:1));
  FX.stop(.2);FX.slow(1.5,.22);FX.shake(.8);FX.kick(7);
  game.endRound(A);
}
function resolveHit(A,D,pt,atk){
  A.swingHit=A.swingContact=true;
  const open=D.state==='parried'||D.state==='broken',heavy=atk.kind==='heavy',blunt=A.weapon.blunt;
  const dmg=atk.dmg*(open?A.stats.riposte:1)*(inFront(D,A)?1:1.15);
  D.hp-=dmg;D.ghostT=.5;D.regenDelay=Math.max(D.regenDelay,.5);
  const si=side(A);game.stats.hits[si]++;game.stats.dmg[si]+=Math.min(dmg,D.hp+dmg);
  _dir.subVectors(D.pos,A.pos).setY(0).normalize();
  if(blunt){ // a mace crumples rather than cuts: fewer, duller sparks and a bigger jolt
    FX.sparks(pt,heavy?14:8,heavy?5:3.5,[2.2,1.1,.35],_dir);FX.sparks(pt,heavy?16:8,2.6,[1.4,.05,.03],_dir,.7);
    FX.burst(pt,heavy?18:9);FX.stop(heavy?.16:.09);FX.shake(heavy?.75:.42);FX.kick(heavy?5:1.5);FX.dust(D.pos,2);
  }else{
    FX.sparks(pt,heavy?26:14,heavy?7:5,[3,1.4,.4],_dir);FX.sparks(pt,heavy?22:10,3.5,[1.6,.05,.03],_dir,.8);
    FX.burst(pt,heavy?26:12);FX.stop(heavy?.13:.07);FX.shake(heavy?.6:.32);if(heavy)FX.kick(4);
  }
  Snd.hit(heavy,blunt);if(D.isPlayer)game.vig=Math.min(1,game.vig+(heavy?.9:.5));
  if(open)game.callout('Riposte');
  A.emit('gotHit');D.emit('landed');
  if(D.hp<=0){kill(D,A,_dir.clone(),atk);return;}
  D.flPv-=heavy?7:4;D.flRv+=rand(-4,4);
  const poised=D.state==='attack'&&D.atk.kind==='heavy'&&D.st>D.atk.poise&&!heavy;
  if(!poised){D.stun('hit',atk.stun+(open?.05:0));D.vel.copy(_dir).multiplyScalar(atk.kb);}
}
function resolveBlock(A,D,pt,atk){
  A.swingHit=A.swingContact=true;const heavy=atk.kind==='heavy',si=side(D),blunt=A.weapon.blunt;
  _dir.subVectors(D.pos,A.pos).setY(0).normalize();
  if(D.parryOK&&D.blockT<=PARRY_WINDOW){ // parry
    D.parryOK=false;D.stam=Math.min(D.maxSt,D.stam+20);D.regenDelay=0;game.stats.parries[si]++;
    A.stun('parried',heavy?1.1:.95);A.vel.copy(_dir).multiplyScalar(-3);A.flPv-=6;
    D.setClip([{t:.07,p:D.poseOf('parryPunch'),e:2},{t:.3,p:D.poseOf('block'),e:1}]);D.stance='block';
    FX.sparks(pt,46,9,[3,2.4,1.2]);FX.burst(pt,40);FX.stop(.15);FX.slow(.35,.3);FX.shake(.5);FX.kick(3);
    Snd.parry();game.callout('Parry');return;
  }
  game.stats.blocks[si]++;
  D.stam-=atk.bs*D.stats.guard;D.regenDelay=.95;D.vel.addScaledVector(_dir,atk.kb*.55);D.flPv-=heavy?4:(blunt?3:1.5);
  if(atk.chip){const c=Math.min(atk.chip,D.hp-1);if(c>0){D.hp-=c;D.ghostT=.5;game.stats.dmg[side(A)]+=c;}}
  A.chainLock=true;A.emit('landed');D.emit('myBlocked');
  FX.sparks(pt,heavy?26:12,heavy?7:5,[3,1.7,.55],_dir.multiplyScalar(-1));FX.burst(pt,heavy?20:9);
  if(D.stam<=0){
    D.stam=0;D.regenDelay=1.7;D.stun('broken',1.15);FX.stop(.12);FX.shake(.55);Snd.guard();game.callout('Guard broken');
  }else if(blunt){FX.stop(heavy?.1:.06);FX.shake(heavy?.5:.28);Snd.thunk(heavy?1.2:.85);}
  else{FX.stop(heavy?.08:.04);FX.shake(heavy?.4:.18);Snd.clang(heavy?1.2:.8);}
}
function clash(A,D,pt){
  A.swingHit=D.swingHit=A.swingContact=D.swingContact=true;
  _dir.subVectors(D.pos,A.pos).setY(0).normalize();
  A.stun('clash',.4);D.stun('clash',.4);A.vel.copy(_dir).multiplyScalar(-3.2);D.vel.copy(_dir).multiplyScalar(3.2);
  FX.sparks(pt,40,8,[3,2.2,1]);FX.burst(pt,34);FX.stop(.11);FX.shake(.45);Snd.clang(1.3);game.callout('Clash');
}
/** sweep the attacker's weapon from last step to this one against the defender's body */
export function sweep(A,D){
  if(A.state!=='attack'||A.phase!=='active'||A.swingHit||D.state==='dead')return;
  const vols=D.volumes(),SUB=4,wr=A.wr;
  for(let s=1;s<=SUB;s++){
    const k=s/SUB;_a.lerpVectors(A.pBlade[0],A.blade[0],k);_b.lerpVectors(A.pBlade[1],A.blade[1],k);
    if(D.state==='attack'&&D.phase==='active'&&!D.swingHit&&segSeg(_a,_b,D.blade[0],D.blade[1],_hp,_hq)<.07+wr+D.wr){clash(A,D,_hp.clone());return;}
    if(D.iframes)continue;
    if(D.blocking&&inFront(D,A)){
      D.b.shieldC.getWorldPosition(_hq);
      if(segSeg(_a,_b,_hq,_hq,_hp)<.36+wr){resolveBlock(A,D,_hp.clone(),A.atk);return;}
    }
    for(const v of vols){
      if(segSeg(_a,_b,v.a,v.b,_hp,_hq)<v.r+wr){
        if(D.blocking&&inFront(D,A)){D.b.shieldC.getWorldPosition(_hq);resolveBlock(A,D,_hq.clone(),A.atk);}
        else resolveHit(A,D,_hp.clone(),A.atk);
        return;}
    }
  }
}
