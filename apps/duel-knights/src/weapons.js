import * as THREE from 'three';
import {TAU} from './util.js';
import {SWORD,MACE,SPEAR,SPEAR_POSES,AXE} from './moves.js';

/* A weapon is held along +Y of the right hand.
   build() returns the weapon group plus two markers: `base` and `tip` bound the
   segment that is swept for hits. `radius` thickens that segment (a mace head is fat);
   `reach` tells the AI how far it can strike relative to a longsword.
   Optional: `poses` replaces stances from POSE (moves.js) that do not suit the weapon;
   `twoHanded` puts the left hand on the haft (pair it with the look's shield:'none');
   `edge` marks a one-edged head, built facing the hand's −Z, that turns to lead each cut.
   build() also gets `arms()`, a material painted with the knight's coat of arms. */
export const WEAPONS={
  sword:{name:'Longsword',moves:SWORD,radius:0,reach:1,blunt:false,
    build({add,grp,cyl,box,sph,m},hand){
      const g=grp(hand);
      add(cyl(.016,.018,.2,8),m.leather,g);add(sph(.03,8,6),m.trim,g,0,-.125,0);
      add(box(.03,.03,.26),m.trim,g,0,.11,0);add(box(.04,.04,.05),m.trim,g,0,.11,0);
      const bl=add(new THREE.CylinderGeometry(.018,.032,.92,4),m.blade,g,0,.585,0);bl.scale.x=.3;
      const tip=add(new THREE.ConeGeometry(.018,.09,4),m.blade,g,0,1.09,0);tip.scale.x=.3;
      return {g,base:grp(g,0,.18,0),tip:grp(g,0,1.13,0)};
    }},
  mace:{name:'Mace',moves:MACE,radius:.052,reach:.88,blunt:true,
    build({add,grp,cyl,sph,box,m},hand){
      const g=grp(hand);
      add(cyl(.018,.02,.2,8),m.leather,g);add(sph(.03,8,6),m.trim,g,0,-.125,0);
      add(cyl(.03,.03,.03,8),m.trim,g,0,.11,0);
      add(cyl(.017,.02,.6,8),m.steel,g,0,.41,0);                 // haft
      add(cyl(.026,.026,.03,8),m.trim,g,0,.7,0);                 // collar under the head
      add(sph(.055,10,8),m.blade,g,0,.79,0);                      // core
      for(let i=0;i<7;i++){const f=grp(g,0,.79,0);f.rotation.y=i/7*TAU;  // flanges
        add(box(.014,.17,.05),m.blade,f,0,0,.058);}
      add(new THREE.ConeGeometry(.022,.08,6),m.blade,g,0,.9,0);   // crown spike
      return {g,base:grp(g,0,.42,0),tip:grp(g,0,.88,0)};
    }},
  spear:{name:'Spear',moves:SPEAR,radius:.012,reach:1.3,blunt:false,twoHanded:true,poses:SPEAR_POSES,
    build({add,grp,cyl,box,m,arms},hand){
      const g=grp(hand);                                                  // gripped near the butt: two metres of ash ahead of the hand
      add(cyl(.015,.017,1.66,8),m.leather,g,0,.61,0);                     // haft
      add(new THREE.ConeGeometry(.02,.07,6),m.trim,g,0,-.25,0,Math.PI);   // butt spike
      add(cyl(.021,.021,.16,8),m.trim,g);add(cyl(.02,.02,.1,8),m.trim,g,0,.42,0); // bindings under each hand
      add(cyl(.016,.024,.09,8),m.trim,g,0,1.44,0);                        // socket
      add(box(.014,.014,.13),m.trim,g,0,1.41,0);                          // lugs
      const sock=add(new THREE.CylinderGeometry(.05,.016,.07,4),m.blade,g,0,1.505,0);sock.scale.x=.3;
      const head=add(new THREE.ConeGeometry(.05,.27,4),m.blade,g,0,1.675,0);head.scale.x=.3;
      const flag=new THREE.PlaneGeometry(.24,.24);flag.rotateY(Math.PI/2);flag.rotateX(Math.PI/2); // a pennon of his arms hung under the head, upright when the spear is levelled
      const fm=arms();fm.side=THREE.DoubleSide;add(flag,fm,g,0,1.25,-.135);
      return {g,base:grp(g,0,.62,0),tip:grp(g,0,1.8,0)};
    }},
  axe:{name:'War axe',moves:AXE,radius:.035,reach:.95,blunt:false,edge:true,
    build({add,grp,cyl,sph,m},hand){
      const g=grp(hand);
      add(cyl(.017,.02,.9,8),m.leather,g,0,.33,0);add(sph(.028,8,6),m.trim,g,0,-.125,0);
      add(cyl(.022,.022,.2,8),m.trim,g);
      add(cyl(.026,.026,.13,8),m.trim,g,0,.7,0);                          // eye of the head
      // bearded blade: its edge leads a downward chop (the hand's −Z)
      const b=new THREE.Shape();b.moveTo(0,.64);b.lineTo(.05,.645);b.quadraticCurveTo(.11,.6,.15,.47);b.quadraticCurveTo(.215,.66,.165,.84);
      b.quadraticCurveTo(.11,.75,.05,.745);b.lineTo(0,.76);b.closePath();
      const bg=new THREE.ExtrudeGeometry(b,{depth:.014,bevelEnabled:false,curveSegments:8});bg.translate(0,0,-.007);
      add(bg,m.blade,g,0,0,0,0,Math.PI/2,0);
      add(new THREE.ConeGeometry(.02,.09,5),m.blade,g,0,.7,.06,Math.PI/2,0,0);   // back spike
      add(new THREE.ConeGeometry(.018,.07,5),m.trim,g,0,.815,0);
      return {g,base:grp(g,0,.36,0),tip:grp(g,0,.74,-.13)};
    }},
};
