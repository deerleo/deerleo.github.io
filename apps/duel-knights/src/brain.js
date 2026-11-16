import {clamp,rand,damp,angDiff} from './util.js';
import {ARENA_R} from './arena.js';

/* ───────────────────────── AI ─────────────────────────
   DIFF sets how sharp the AI is (reaction time, parry odds…).
   Each character's `ai` block sets its *style*: how often it picks each plan. */
const AI_BASE={circle:.8,pressure:1.3,heavy:.3,feint:.3,bait:.45};
export const DIFF={
  squire:{react:[.30,.44],block:.42,parryL:.03,parryH:.10,dodge:.08,punish:.5,gap:[.8,1.6],feint:.3,bait:.5,interrupt:.08},
  knight:{react:[.20,.31],block:.52,parryL:.11,parryH:.30,dodge:.16,punish:.85,gap:[.4,1.0],feint:.8,bait:1,interrupt:.2},
  warlord:{react:[.13,.21],block:.50,parryL:.22,parryH:.52,dodge:.20,punish:1,gap:[.2,.6],feint:1.2,bait:1.3,interrupt:.3},
};
export class Brain{
  constructor(me,foe,cfg){this.me=me;this.foe=foe;this.cfg=cfg;this.reset();}
  reset(){this.q=[];this.react=null;this.plan=null;this.gap=.7;this.strafe=Math.random()<.5?1:-1;this.strafeT=1.5;
    this.hab={agg:0,blk:0,dodge:0};this.blockedStreak=0;this.wantPunish=0;}
  notify(type,data){let d=rand(this.cfg.react[0],this.cfg.react[1]);if(type==='whiff')d*=.55;if(type==='myBlocked'||type==='gotHit'||type==='landed')d=0;
    this.q.push({type,data,at:this.me.t+d});}
  setPlan(type,o={}){this.plan={type,t:0,phase:0,t1:0,serial:this.me.serial,...o};}
  done(){this.plan=null;this.gap=rand(this.cfg.gap[0],this.cfg.gap[1])*(this.foe.stam<30?.5:1);}
  handle(ev,dist){
    const me=this.me,foe=this.foe,c=this.cfg,h=this.hab;
    switch(ev.type){
      case 'attackStart':{
        h.agg=Math.min(3,h.agg+.4);
        if(foe.state!=='attack'||dist>3.7)return;
        const a=foe.atk,until=a.wind-foe.st,kind=ev.data;
        if(me.state==='attack'){ // already committed: maybe abort a heavy into a guard
          if(me.atk.kind==='heavy'&&me.phase==='wind'&&me.st<me.atk.wind*.6&&kind==='light'&&Math.random()<c.block){me.intent.blockPressed=true;this.react={type:'block',hold:.2};this.plan=null;}
          return;}
        if(me.state!=='free')return;
        if(this.plan&&this.plan.type==='bait'&&this.plan.phase===1){this.react={type:'dodge',at:me.t+Math.max(0,until-.16),dir:'back'};this.wantPunish=me.t+1.3;this.plan=null;return;}
        const r=Math.random();
        if(kind==='heavy'){
          const blunt=foe.weapon.blunt,pp=c.parryH,pd=c.dodge*2.2*(blunt?1.6:1),pi=dist<2.3&&until>.38?c.interrupt:0;
          if(r<pp)this.react={type:'parry',at:me.t+Math.max(0,until-.09)};
          else if(r<pp+pd){this.react={type:'dodge',at:me.t+Math.max(0,until-.13),dir:'side'};this.wantPunish=me.t+1.4;}
          else if(r<pp+pd+pi)this.react={type:'interrupt'};
          else if(r<pp+pd+pi+c.block*(blunt?.5:.8))this.react={type:'block',hold:.2};
          else return;
        }else{
          const pp=c.parryL*(1+h.agg*.25);
          if(r<pp)this.react={type:'parry',at:me.t+Math.max(0,until-.08)};
          else if(r<pp+c.block+this.hab.agg*.05)this.react={type:'block',hold:.22};
          else if(r<pp+c.block+c.dodge)this.react={type:'dodge',at:me.t,dir:'back'};
          else return;
        }
        this.plan=null;break;}
      case 'whiff':
        if(Math.random()<c.punish*(ev.data==='heavy'?1:.45))this.wantPunish=me.t+.8;break;
      case 'dodge':h.dodge=Math.min(3,h.dodge+.5);break;
      case 'myBlocked':this.blockedStreak++;break;
      case 'landed':this.blockedStreak=0;break;
      case 'gotHit':this.plan=null;this.react=null;break;
    }
  }
  choose(dist){
    const me=this.me,foe=this.foe,c=this.cfg,h=this.hab;
    const P={...AI_BASE,...me.char.ai};
    const w={circle:P.circle,pressure:P.pressure,heavy:P.heavy,feint:P.feint*c.feint,bait:P.bait*c.bait,retreat:0};
    if(h.blk>.45||this.blockedStreak>=2){w.heavy+=1.5;w.feint+=1*c.feint;w.pressure*=.5;}
    if(foe.stam<32){w.pressure+=1.6;w.heavy+=.6;w.bait=0;w.circle=.2;}
    if(h.agg>1){w.bait+=1.2*c.bait;w.circle+=.4;w.pressure*=.7;}
    if(h.dodge>1){w.feint+=.6*c.feint;w.heavy*=.5;}
    if(me.stam<34){w.retreat=3.5;w.pressure=.15;w.heavy=0;w.feint=0;}
    else if(me.stam<55){w.heavy*=.3;w.circle+=.6;}
    if(me.hp<30&&foe.hp>50)w.bait+=.5*c.bait;
    const R=me.reach;let tot=0;for(const k in w)tot+=w[k];let r=Math.random()*tot,pick='circle';
    for(const k in w){r-=w[k];if(r<=0){pick=k;break;}}
    switch(pick){
      case 'circle':this.setPlan('circle',{dur:rand(.7,1.7),guard:Math.random()<.45});break;
      case 'pressure':this.setPlan('pressure',{n:1+((Math.random()*3)|0),reach:rand(1.85,2.25)*R});break;
      case 'heavy':this.setPlan('heavy',{reach:2.2*R});break;
      case 'feint':this.setPlan('heavy',{reach:2.4*R,feint:true,feintAt:rand(.26,.4)*(me.moves.heavy.wind/.62)});break;
      case 'bait':this.setPlan('bait',{dur:rand(.8,1.5),range:rand(2.75,2.95)*foe.reach});break;
      case 'retreat':this.setPlan('retreat');break;
    }
  }
  drift(dist,ux,uz,dt,want=3.3,strafeAmt=.55){
    const me=this.me,I=me.intent;this.strafeT-=dt;if(this.strafeT<=0){this.strafeT=rand(.8,2.4);if(Math.random()<.6)this.strafe*=-1;}
    const rad=clamp((dist-want)*1.6,-1,1)*.8;let mx=ux*rad+-uz*this.strafe*strafeAmt,mz=uz*rad+ux*this.strafe*strafeAmt;
    const pr=Math.hypot(me.pos.x,me.pos.z);if(pr>ARENA_R-1.6){mx-=me.pos.x/pr*.8;mz-=me.pos.z/pr*.8;}
    const m=Math.hypot(mx,mz);if(m>1){mx/=m;mz/=m;}I.mx=mx;I.mz=mz;
  }
  chain(p){ // returns true when the attack string is finished
    const me=this.me,started=me.serial-p.serial;
    if(me.state==='attack'){if(started<p.n&&!me.chainLock&&me.atk.next)me.intent.light=true;return false;}
    return started>0||p.t>p.t1+.3;
  }
  update(dt){
    const me=this.me,foe=this.foe,I=me.intent,c=this.cfg,h=this.hab;
    I.mx=I.mz=0;I.block=false;I.taunt=false;
    const dx=foe.pos.x-me.pos.x,dz=foe.pos.z-me.pos.z,dist=Math.hypot(dx,dz)||1e-3,ux=dx/dist,uz=dz/dist;
    I.face=Math.atan2(dx,dz);
    h.agg=Math.max(0,h.agg-dt*.14);h.blk=damp(h.blk,foe.blocking?1:0,.9,dt);h.dodge=Math.max(0,h.dodge-dt*.12);
    while(this.q.length&&this.q[0].at<=me.t)this.handle(this.q.shift(),dist);
    if(foe.state==='dead'||me.state==='dead')return;
    if(me.state!=='free'&&me.state!=='attack'){this.react=null;if(me.state!=='dodge')this.plan=null;return;}
    // ── reactive layer
    if(this.react&&me.state==='free'){
      const r=this.react;
      if(r.type==='block'){
        I.block=true;I.mx=-ux*.3;I.mz=-uz*.3;
        if(!(foe.state==='attack'&&foe.phase!=='recover')){r.hold-=dt;if(r.hold<=0){this.react=null;
          if(foe.state==='attack'&&dist<2.7&&me.stam>25&&Math.random()<c.punish*.85)this.setPlan('pressure',{n:1+((Math.random()*2)|0),reach:2.3*me.reach});}}
      }else if(r.type==='parry'){
        if(me.t>=r.at){I.block=true;if(me.t>r.at+.42||foe.state!=='attack')this.react=null;}
      }else if(r.type==='dodge'){
        if(me.t>=r.at){I.dodge=true;
          if(r.dir==='back'){I.mx=-ux;I.mz=-uz;}else{const s=this.strafe;I.mx=-uz*s-ux*.25;I.mz=ux*s-uz*.25;}
          this.react=null;}
      }else{I.light=true;this.react=null;}
      if(this.react||I.dodge)return;
    }
    // ── opportunism
    const open=foe.state==='parried'||foe.state==='broken';
    if(me.state==='free'&&(!this.plan||this.plan.type!=='punish')){
      if(open)this.setPlan('punish',{heavy:foe.stDur-foe.st>.8&&dist<2.7,n:2});
      else if(this.wantPunish>me.t&&foe.state==='attack'&&foe.phase==='recover'){
        const left=foe.atk.wind+foe.atk.act+foe.atk.rec-foe.st;if(left>.18){this.setPlan('punish',{heavy:false,n:left>.4?3:2});this.wantPunish=0;}}
      else if(foe.state==='free'&&!foe.blocking&&dist<2.3&&Math.abs(angDiff(foe.yaw,Math.atan2(-dx,-dz)))>1.5&&me.stam>20)this.setPlan('punish',{heavy:false,n:2}); // flanked
    }
    if(!this.plan){
      if(me.state==='attack')return;
      this.gap-=dt;this.drift(dist,ux,uz,dt);
      if(dist<2.8&&foe.state==='free'&&h.agg>.8)I.block=true;
      if(this.gap<=0)this.choose(dist);return;
    }
    const p=this.plan;p.t+=dt;
    switch(p.type){
      case 'circle':
        this.drift(dist,ux,uz,dt);if(p.guard&&dist<2.9)I.block=true;if(p.t>p.dur)this.done();break;
      case 'pressure':
        if(p.phase===0){
          this.drift(dist,ux,uz,dt,1.5,.2);
          if(dist<=p.reach&&me.state==='free'){I.light=true;p.phase=1;p.t1=p.t;p.serial=me.serial;}
          else if(p.t>2.6)this.done();
        }else if(this.chain(p))this.done();
        break;
      case 'heavy':
        if(p.phase===0){
          this.drift(dist,ux,uz,dt,1.5,.15);
          if(dist<=p.reach&&me.state==='free'){I.heavy=true;p.phase=1;p.t1=p.t;p.serial=me.serial;}
          else if(p.t>2.6)this.done();
        }else if(me.state==='attack'){
          if(p.feint&&me.phase==='wind'&&me.st>=p.feintAt){I.blockPressed=true;
            if(Math.random()<.7)this.setPlan('pressure',{n:2,reach:2.4*me.reach});else this.setPlan('heavy',{reach:2.4*me.reach});}
        }else if(p.t>p.t1+.3)this.done();
        break;
      case 'bait':
        if(p.phase===0){
          this.drift(dist,ux,uz,dt,p.range,.3);
          if(Math.abs(dist-p.range)<.25){p.phase=1;p.t1=p.t;}else if(p.t>2.4)this.done();
        }else{ // drop the guard, shimmy at the edge of reach, wait for the bite
          I.taunt=true;const s=Math.sin(p.t*5.5)*.4+clamp((dist-p.range)*2,-1,1)*.6;I.mx=ux*s;I.mz=uz*s;
          if(p.t-p.t1>p.dur){if(Math.random()<.6)this.setPlan('pressure',{n:2,reach:2.2*me.reach});else this.done();}
        }
        break;
      case 'punish':
        if(p.phase===0){
          if(dist>1.6){I.mx=ux;I.mz=uz;}
          if(dist<=(p.heavy?2.2:2.15)*me.reach&&me.state==='free'){if(p.heavy)I.heavy=true;else I.light=true;p.phase=1;p.t1=p.t;p.serial=me.serial;}
          else if(p.t>1.5||(foe.state==='free'&&foe.blocking&&p.t>.3))this.done();
        }else if(p.heavy?(me.state!=='attack'&&p.t>p.t1+.3):this.chain(p)){this.plan=null;this.gap=rand(.1,.4);}
        break;
      case 'retreat':
        this.drift(dist,ux,uz,dt,4.8,.7);if(dist<3.2&&(foe.state==='attack'||h.agg>.6))I.block=true;
        if(me.stam>58||p.t>2.6)this.done();break;
    }
  }
}
