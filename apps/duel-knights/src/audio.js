import {rand,params} from './util.js';

/* all sound is synthesised with Web Audio — no files */
export const Snd=(()=>{
  let ctx,master,wet,nbuf,muted=false,crackT=0,beatT=0,beat=0,failT=-Infinity;
  function init(){
    if(params.has('silent'))return; // tests: no audio graph at all
    if(ctx){ctx.resume();return;}
    try{ctx=new (window.AudioContext||window.webkitAudioContext)();}catch(e){return;}
    master=ctx.createGain();master.gain.value=muted?0:.85;
    const comp=ctx.createDynamicsCompressor();master.connect(comp);comp.connect(ctx.destination);
    wet=ctx.createGain();wet.gain.value=.4;
    const dl=ctx.createDelay(.5);dl.delayTime.value=.137;const fb=ctx.createGain();fb.gain.value=.34;
    const lp=ctx.createBiquadFilter();lp.type='lowpass';lp.frequency.value=2200;
    wet.connect(dl);dl.connect(lp);lp.connect(fb);fb.connect(dl);lp.connect(master);
    nbuf=ctx.createBuffer(1,ctx.sampleRate*2,ctx.sampleRate);
    const d=nbuf.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;
    // wind bed
    const w=ctx.createBufferSource();w.buffer=nbuf;w.loop=true;
    const wf=ctx.createBiquadFilter();wf.type='bandpass';wf.frequency.value=260;wf.Q.value=.6;
    const wg=ctx.createGain();wg.gain.value=.05;
    const lfo=ctx.createOscillator();lfo.frequency.value=.13;const lg=ctx.createGain();lg.gain.value=120;
    lfo.connect(lg);lg.connect(wf.frequency);lfo.start();
    w.connect(wf);wf.connect(wg);wg.connect(master);w.start();
  }
  function noise(dur,type,f0,f1,q,peak,echo=0,att=.004){
    if(!ctx||muted)return;const t=ctx.currentTime;
    const s=ctx.createBufferSource();s.buffer=nbuf;s.loop=true;
    const f=ctx.createBiquadFilter();f.type=type;f.Q.value=q;
    f.frequency.setValueAtTime(f0,t);f.frequency.exponentialRampToValueAtTime(Math.max(20,f1),t+dur);
    const g=ctx.createGain();g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(peak,t+att);
    g.gain.exponentialRampToValueAtTime(.0001,t+dur);
    s.connect(f);f.connect(g);g.connect(master);if(echo){const e=ctx.createGain();e.gain.value=echo;g.connect(e);e.connect(wet);}
    s.start(t,Math.random());s.stop(t+dur+.05);
  }
  function tone(f0,f1,dur,peak,type='sine',echo=0,delay=0){
    if(!ctx||muted)return;const t=ctx.currentTime+delay;
    const o=ctx.createOscillator();o.type=type;o.frequency.setValueAtTime(f0,t);
    if(f1!==f0)o.frequency.exponentialRampToValueAtTime(Math.max(20,f1),t+dur);
    const g=ctx.createGain();g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(peak,t+.004);
    g.gain.exponentialRampToValueAtTime(.0001,t+dur);
    o.connect(g);g.connect(master);if(echo){const e=ctx.createGain();e.gain.value=echo;g.connect(e);e.connect(wet);}
    o.start(t);o.stop(t+dur+.05);
  }
  const metal=(f,dur,vol,echo)=>{[1,2.76,5.4,8.93,11.3].forEach((m,i)=>tone(f*m*(1+rand(-.01,.01)),f*m,dur/(1+i*.45),vol/(1+i*.7),i%2?'triangle':'sine',echo));};
  return {
    init,
    toggle(){muted=!muted;if(master)master.gain.value=muted?0:.85;return muted;},
    swing(h,blunt){
      if(blunt)noise(h?.42:.28,'bandpass',h?160:260,h?700:1100,1.1,h?.4:.26);
      else noise(h?.34:.2,'bandpass',h?260:520,h?1500:2400,1.4,h?.34:.2);},
    /** a charged blow gathering: a thin rising ring */
    charge(){tone(520,1650,.17,.06,'triangle',.5);noise(.17,'bandpass',900,4600,3,.1,.3,.07);},
    /** …and let go: air torn open over the stamp of a foot */
    drive(){noise(.3,'bandpass',420,3400,1.5,.42,.2);tone(118,40,.24,.5);noise(.15,'lowpass',650,90,.7,.36);},
    clang(p=1){metal(rand(620,900),.5*p,.2*p,.6);noise(.06,'highpass',3000,5000,.7,.3*p,.4);},
    /** a mace on a shield: a dull boom with a short ring */
    thunk(p=1){tone(105,42,.32*p,.65);noise(.22,'lowpass',1600,140,.7,.55*p,.35);metal(rand(260,330),.35*p,.12*p,.5);},
    parry(){metal(rand(1150,1300),1.1,.26,.9);metal(rand(1700,1900),.8,.12,.9);noise(.08,'highpass',4000,7000,.7,.4,.5);},
    hit(h,blunt){
      tone(h?150:190,45,h?.26:.16,h?.7:.5);noise(h?.2:.12,'lowpass',h?1400:1900,200,.8,h?.6:.4,.2);metal(rand(300,420),.12,.07,.2);
      if(blunt){tone(h?72:88,30,h?.4:.28,h?.8:.6);noise(.18,'lowpass',700,90,.7,.5,.25);}},
    guard(){tone(120,50,.3,.6);metal(380,.5,.2,.7);noise(.3,'lowpass',2500,200,.6,.5,.4);},
    step(){noise(.07,'lowpass',500,120,.8,.07);},
    dodge(){noise(.24,'bandpass',300,900,.9,.2);},
    fall(){tone(90,30,.4,.8);noise(.35,'lowpass',900,90,.7,.6,.3);metal(240,.3,.1,.4);},
    clatter(){metal(rand(900,1500),.25,.1,.6);},
    gong(){[1,2.01,2.9,4.2].forEach((m,i)=>tone(98*m,97*m,3.2/(1+i*.5),.3/(1+i),'sine',.5));noise(.5,'bandpass',300,150,2,.2,.4);},
    // A muffled exhale: soft onset, falling breath, no buzzer or echo.
    fail(){
      if(!ctx||muted||ctx.currentTime-failT<.65)return;
      failT=ctx.currentTime;
      noise(.28,'bandpass',650,350,.6,.16,0,.045);
    },
    click(){tone(700,500,.06,.1,'triangle');},
    horn(win){const n=win?[196,247,294,392]:[196,185,165,123];n.forEach((f,i)=>{tone(f,f,.9,.14,'sawtooth',.5,i*.26);tone(f/2,f/2,.9,.14,'triangle',.4,i*.26);});},
    tick(dt,fight,tension){
      if(!ctx||muted)return;
      crackT-=dt;if(crackT<=0){crackT=rand(.03,.3);noise(.03,'highpass',rand(1500,5000),900,.7,rand(.008,.035));}
      if(fight){beatT-=dt;if(beatT<=0){const pat=tension>.5?[1,0,1,1,0,1,1,0]:[1,0,0,1,0,0,1,0];
        beatT=tension>.5?.25:.3;if(pat[beat%8]){const acc=beat%8===0;tone(acc?78:66,38,.3,acc?.34:.2);noise(.09,'lowpass',400,90,.7,.12);}beat++;}}
    }
  };
})();
