var fh=0,yl=1,ph=2;var rr=1,mh=2,Ms=3,Ti=0,sn=1,Tn=2,Wi=0,bs=1,Ss=2,Ml=3,bl=4,gh=5;var Xi=100,xh=101,vh=102,_h=103,yh=104,Mh=200,bh=201,Sh=202,wh=203,Sl=204,wl=205,Th=206,Eh=207,Ah=208,Rh=209,Ch=210,Ph=211,Ih=212,Lh=213,Dh=214,ta=0,na=1,ia=2,ds=3,sa=4,ra=5,aa=6,oa=7,Tl=0,Nh=1,Uh=2,qn=0,El=1,Al=2,Rl=3,Cl=4,Pl=5,Il=6,Ll=7;var Dl=300,qi=301,ws=302,La=303,Da=304,fs=1e3,Vn=1001,la=1002,Ut=1003,Fh=1004;var ar=1005;var Mt=1006,Na=1007;var En=1008;var fn=1009,Nl=1010,Ul=1011,Ts=1012,Ua=1013,Nn=1014,Un=1015,Fn=1016,Fa=1017,Oa=1018,$i=1020,Fl=35902,Ol=35899,kl=1021,zl=1022,On=1023,ri=1026,li=1027,Bl=1028,ka=1029,Ei=1030,za=1031;var Ba=1033,or=33776,lr=33777,cr=33778,hr=33779,Ga=35840,Va=35841,Ha=35842,Wa=35843,Xa=36196,qa=37492,$a=37496,Ya=37488,Za=37489,ur=37490,Ja=37491,Ka=37808,ja=37809,Qa=37810,eo=37811,to=37812,no=37813,io=37814,so=37815,ro=37816,ao=37817,oo=37818,lo=37819,co=37820,ho=37821,uo=36492,fo=36494,po=36495,mo=36283,go=36284,dr=36285,xo=36286;var Hs=2300,ca=2301,Qr=2302,pl=2303,ml=2400,gl=2401,xl=2402;var Oh=3200;var Gl=0,kh=1,ci="",un="srgb",Ws="srgb-linear",Xs="linear",nt="srgb";var ea=7680;var zh=519,Bh=512,Gh=513,Vh=514,Vl=515,Hh=516,Wh=517,Hl=518,Wl=519,Xh=35044,Xl=35048;var ql="300 es",yn=2e3,qs=2001;function ef(i){for(let e=i.length-1;e>=0;--e)if(i[e]>=65535)return!0;return!1}function tf(i){return ArrayBuffer.isView(i)&&!(i instanceof DataView)}function $s(i){return document.createElementNS("http://www.w3.org/1999/xhtml",i)}function qh(){let i=$s("canvas");return i.style.display="block",i}var qc={},ps=null;function $l(...i){let e="THREE."+i.shift();ps?ps("log",e,...i):console.log(e,...i)}function $h(i){let e=i[0];if(typeof e=="string"&&e.startsWith("TSL:")){let t=i[1];t&&t.isStackTrace?i[0]+=" "+t.getLocation():i[1]='Stack trace not available. Enable "THREE.Node.captureStackTrace" to capture stack traces.'}return i}function Le(...i){i=$h(i);let e="THREE."+i.shift();if(ps)ps("warn",e,...i);else{let t=i[0];t&&t.isStackTrace?console.warn(t.getError(e)):console.warn(e,...i)}}function De(...i){i=$h(i);let e="THREE."+i.shift();if(ps)ps("error",e,...i);else{let t=i[0];t&&t.isStackTrace?console.error(t.getError(e)):console.error(e,...i)}}function Vs(...i){let e=i.join(" ");e in qc||(qc[e]=!0,Le(...i))}function Yh(i,e,t){return new Promise(function(n,s){function r(){switch(i.clientWaitSync(e,i.SYNC_FLUSH_COMMANDS_BIT,0)){case i.WAIT_FAILED:s();break;case i.TIMEOUT_EXPIRED:setTimeout(r,t);break;default:n()}}setTimeout(r,t)})}var Zh={[ta]:ta,[ia]:aa,[sa]:sa,[ds]:ra,[na]:na,[aa]:ia,[oa]:oa,[ra]:ds},Hn=class{addEventListener(e,t){this._listeners===void 0&&(this._listeners={});let n=this._listeners;n[e]===void 0&&(n[e]=[]),n[e].indexOf(t)===-1&&n[e].push(t)}hasEventListener(e,t){let n=this._listeners;return n===void 0?!1:n[e]!==void 0&&n[e].indexOf(t)!==-1}removeEventListener(e,t){let n=this._listeners;if(n===void 0)return;let s=n[e];if(s!==void 0){let r=s.indexOf(t);r!==-1&&s.splice(r,1)}}dispatchEvent(e){let t=this._listeners;if(t===void 0)return;let n=t[e.type];if(n!==void 0){e.target=this;let s=n.slice(0);for(let r=0,a=s.length;r<a;r++)s[r].call(this,e);e.target=null}}},qt=["00","01","02","03","04","05","06","07","08","09","0a","0b","0c","0d","0e","0f","10","11","12","13","14","15","16","17","18","19","1a","1b","1c","1d","1e","1f","20","21","22","23","24","25","26","27","28","29","2a","2b","2c","2d","2e","2f","30","31","32","33","34","35","36","37","38","39","3a","3b","3c","3d","3e","3f","40","41","42","43","44","45","46","47","48","49","4a","4b","4c","4d","4e","4f","50","51","52","53","54","55","56","57","58","59","5a","5b","5c","5d","5e","5f","60","61","62","63","64","65","66","67","68","69","6a","6b","6c","6d","6e","6f","70","71","72","73","74","75","76","77","78","79","7a","7b","7c","7d","7e","7f","80","81","82","83","84","85","86","87","88","89","8a","8b","8c","8d","8e","8f","90","91","92","93","94","95","96","97","98","99","9a","9b","9c","9d","9e","9f","a0","a1","a2","a3","a4","a5","a6","a7","a8","a9","aa","ab","ac","ad","ae","af","b0","b1","b2","b3","b4","b5","b6","b7","b8","b9","ba","bb","bc","bd","be","bf","c0","c1","c2","c3","c4","c5","c6","c7","c8","c9","ca","cb","cc","cd","ce","cf","d0","d1","d2","d3","d4","d5","d6","d7","d8","d9","da","db","dc","dd","de","df","e0","e1","e2","e3","e4","e5","e6","e7","e8","e9","ea","eb","ec","ed","ee","ef","f0","f1","f2","f3","f4","f5","f6","f7","f8","f9","fa","fb","fc","fd","fe","ff"];var $o=Math.PI/180,ha=180/Math.PI;function fr(){let i=Math.random()*4294967295|0,e=Math.random()*4294967295|0,t=Math.random()*4294967295|0,n=Math.random()*4294967295|0;return(qt[i&255]+qt[i>>8&255]+qt[i>>16&255]+qt[i>>24&255]+"-"+qt[e&255]+qt[e>>8&255]+"-"+qt[e>>16&15|64]+qt[e>>24&255]+"-"+qt[t&63|128]+qt[t>>8&255]+"-"+qt[t>>16&255]+qt[t>>24&255]+qt[n&255]+qt[n>>8&255]+qt[n>>16&255]+qt[n>>24&255]).toLowerCase()}function Ke(i,e,t){return Math.max(e,Math.min(t,i))}function nf(i,e){return(i%e+e)%e}function Yo(i,e,t){return(1-t)*i+t*e}function Jh(i){return Math.pow(2,Math.floor(Math.log(i)/Math.LN2))}function Yl(i){switch(i.constructor){case Uint32Array:return 4294967295;case Uint16Array:return 65535;case Uint8Array:case Uint8ClampedArray:return 255;case Int32Array:return 2147483647;case Int16Array:return 32767;case Int8Array:return 127;default:return}}function sf(i,e){if(e.constructor===Float32Array)return i;let t=Yl(e);if(t===void 0)throw new Error("THREE.MathUtils: Invalid component type.");return Math.max(i/t,-1)}function rf(i,e){if(e.constructor===Float32Array)return i;let t=Yl(e);if(t===void 0)throw new Error("THREE.MathUtils: Invalid component type.");return Math.round(i*t)}var Xe=class{static{this.prototype.isVector2=!0}constructor(e=0,t=0){this.x=e,this.y=t}get width(){return this.x}set width(e){this.x=e}get height(){return this.y}set height(e){this.y=e}set(e,t){return this.x=e,this.y=t,this}setScalar(e){return this.x=e,this.y=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;default:throw new Error("THREE.Vector2: index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;default:throw new Error("THREE.Vector2: index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y)}copy(e){return this.x=e.x,this.y=e.y,this}add(e){return this.x+=e.x,this.y+=e.y,this}addScalar(e){return this.x+=e,this.y+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this}subScalar(e){return this.x-=e,this.y-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this}multiply(e){return this.x*=e.x,this.y*=e.y,this}multiplyScalar(e){return this.x*=e,this.y*=e,this}divide(e){return this.x/=e.x,this.y/=e.y,this}divideScalar(e){return this.multiplyScalar(1/e)}applyMatrix3(e){let t=this.x,n=this.y,s=e.elements;return this.x=s[0]*t+s[3]*n+s[6],this.y=s[1]*t+s[4]*n+s[7],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this}clamp(e,t){return this.x=Ke(this.x,e.x,t.x),this.y=Ke(this.y,e.y,t.y),this}clampScalar(e,t){return this.x=Ke(this.x,e,t),this.y=Ke(this.y,e,t),this}clampLength(e,t){let n=this.length();return this.divideScalar(n||1).multiplyScalar(Ke(n,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(e){return this.x*e.x+this.y*e.y}cross(e){return this.x*e.y-this.y*e.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(e){let t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;let n=this.dot(e)/t;return Math.acos(Ke(n,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){let t=this.x-e.x,n=this.y-e.y;return t*t+n*n}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this}equals(e){return e.x===this.x&&e.y===this.y}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this}rotateAround(e,t){let n=Math.cos(t),s=Math.sin(t),r=this.x-e.x,a=this.y-e.y;return this.x=r*n-a*s+e.x,this.y=r*s+a*n+e.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}},bn=class{constructor(e=0,t=0,n=0,s=1){this.isQuaternion=!0,this._x=e,this._y=t,this._z=n,this._w=s}static slerpFlat(e,t,n,s,r,a,o){let l=n[s+0],c=n[s+1],h=n[s+2],f=n[s+3],u=r[a+0],p=r[a+1],d=r[a+2],_=r[a+3];if(f!==_||l!==u||c!==p||h!==d){let m=l*u+c*p+h*d+f*_;m<0&&(u=-u,p=-p,d=-d,_=-_,m=-m);let g=1-o;if(m<.9995){let y=Math.acos(m),v=Math.sin(y);g=Math.sin(g*y)/v,o=Math.sin(o*y)/v,l=l*g+u*o,c=c*g+p*o,h=h*g+d*o,f=f*g+_*o}else{l=l*g+u*o,c=c*g+p*o,h=h*g+d*o,f=f*g+_*o;let y=1/Math.sqrt(l*l+c*c+h*h+f*f);l*=y,c*=y,h*=y,f*=y}}e[t]=l,e[t+1]=c,e[t+2]=h,e[t+3]=f}static multiplyQuaternionsFlat(e,t,n,s,r,a){let o=n[s],l=n[s+1],c=n[s+2],h=n[s+3],f=r[a],u=r[a+1],p=r[a+2],d=r[a+3];return e[t]=o*d+h*f+l*p-c*u,e[t+1]=l*d+h*u+c*f-o*p,e[t+2]=c*d+h*p+o*u-l*f,e[t+3]=h*d-o*f-l*u-c*p,e}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get w(){return this._w}set w(e){this._w=e,this._onChangeCallback()}set(e,t,n,s){return this._x=e,this._y=t,this._z=n,this._w=s,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(e){return this._x=e.x,this._y=e.y,this._z=e.z,this._w=e.w,this._onChangeCallback(),this}setFromEuler(e,t=!0){let n=e._x,s=e._y,r=e._z,a=e._order,o=Math.cos,l=Math.sin,c=o(n/2),h=o(s/2),f=o(r/2),u=l(n/2),p=l(s/2),d=l(r/2);switch(a){case"XYZ":this._x=u*h*f+c*p*d,this._y=c*p*f-u*h*d,this._z=c*h*d+u*p*f,this._w=c*h*f-u*p*d;break;case"YXZ":this._x=u*h*f+c*p*d,this._y=c*p*f-u*h*d,this._z=c*h*d-u*p*f,this._w=c*h*f+u*p*d;break;case"ZXY":this._x=u*h*f-c*p*d,this._y=c*p*f+u*h*d,this._z=c*h*d+u*p*f,this._w=c*h*f-u*p*d;break;case"ZYX":this._x=u*h*f-c*p*d,this._y=c*p*f+u*h*d,this._z=c*h*d-u*p*f,this._w=c*h*f+u*p*d;break;case"YZX":this._x=u*h*f+c*p*d,this._y=c*p*f+u*h*d,this._z=c*h*d-u*p*f,this._w=c*h*f-u*p*d;break;case"XZY":this._x=u*h*f-c*p*d,this._y=c*p*f-u*h*d,this._z=c*h*d+u*p*f,this._w=c*h*f+u*p*d;break;default:Le("Quaternion: .setFromEuler() encountered an unknown order: "+a)}return t===!0&&this._onChangeCallback(),this}setFromAxisAngle(e,t){let n=t/2,s=Math.sin(n);return this._x=e.x*s,this._y=e.y*s,this._z=e.z*s,this._w=Math.cos(n),this._onChangeCallback(),this}setFromRotationMatrix(e){let t=e.elements,n=t[0],s=t[4],r=t[8],a=t[1],o=t[5],l=t[9],c=t[2],h=t[6],f=t[10],u=n+o+f;if(u>0){let p=.5/Math.sqrt(u+1);this._w=.25/p,this._x=(h-l)*p,this._y=(r-c)*p,this._z=(a-s)*p}else if(n>o&&n>f){let p=2*Math.sqrt(1+n-o-f);this._w=(h-l)/p,this._x=.25*p,this._y=(s+a)/p,this._z=(r+c)/p}else if(o>f){let p=2*Math.sqrt(1+o-n-f);this._w=(r-c)/p,this._x=(s+a)/p,this._y=.25*p,this._z=(l+h)/p}else{let p=2*Math.sqrt(1+f-n-o);this._w=(a-s)/p,this._x=(r+c)/p,this._y=(l+h)/p,this._z=.25*p}return this._onChangeCallback(),this}setFromUnitVectors(e,t){let n=e.dot(t)+1;return n<1e-8?(n=0,Math.abs(e.x)>Math.abs(e.z)?(this._x=-e.y,this._y=e.x,this._z=0,this._w=n):(this._x=0,this._y=-e.z,this._z=e.y,this._w=n)):(this._x=e.y*t.z-e.z*t.y,this._y=e.z*t.x-e.x*t.z,this._z=e.x*t.y-e.y*t.x,this._w=n),this.normalize()}angleTo(e){return 2*Math.acos(Math.abs(Ke(this.dot(e),-1,1)))}rotateTowards(e,t){let n=this.angleTo(e);if(n===0)return this;let s=Math.min(1,t/n);return this.slerp(e,s),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(e){return this._x*e._x+this._y*e._y+this._z*e._z+this._w*e._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let e=this.length();return e===0?(this._x=0,this._y=0,this._z=0,this._w=1):(e=1/e,this._x=this._x*e,this._y=this._y*e,this._z=this._z*e,this._w=this._w*e),this._onChangeCallback(),this}multiply(e){return this.multiplyQuaternions(this,e)}premultiply(e){return this.multiplyQuaternions(e,this)}multiplyQuaternions(e,t){let n=e._x,s=e._y,r=e._z,a=e._w,o=t._x,l=t._y,c=t._z,h=t._w;return this._x=n*h+a*o+s*c-r*l,this._y=s*h+a*l+r*o-n*c,this._z=r*h+a*c+n*l-s*o,this._w=a*h-n*o-s*l-r*c,this._onChangeCallback(),this}slerp(e,t){let n=e._x,s=e._y,r=e._z,a=e._w,o=this.dot(e);o<0&&(n=-n,s=-s,r=-r,a=-a,o=-o);let l=1-t;if(o<.9995){let c=Math.acos(o),h=Math.sin(c);l=Math.sin(l*c)/h,t=Math.sin(t*c)/h,this._x=this._x*l+n*t,this._y=this._y*l+s*t,this._z=this._z*l+r*t,this._w=this._w*l+a*t,this._onChangeCallback()}else this._x=this._x*l+n*t,this._y=this._y*l+s*t,this._z=this._z*l+r*t,this._w=this._w*l+a*t,this.normalize();return this}slerpQuaternions(e,t,n){return this.copy(e).slerp(t,n)}random(){let e=2*Math.PI*Math.random(),t=2*Math.PI*Math.random(),n=Math.random(),s=Math.sqrt(1-n),r=Math.sqrt(n);return this.set(s*Math.sin(e),s*Math.cos(e),r*Math.sin(t),r*Math.cos(t))}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._w===this._w}fromArray(e,t=0){return this._x=e[t],this._y=e[t+1],this._z=e[t+2],this._w=e[t+3],this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._w,e}fromBufferAttribute(e,t){return this._x=e.getX(t),this._y=e.getY(t),this._z=e.getZ(t),this._w=e.getW(t),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}},G=class{static{this.prototype.isVector3=!0}constructor(e=0,t=0,n=0){this.x=e,this.y=t,this.z=n}set(e,t,n){return n===void 0&&(n=this.z),this.x=e,this.y=t,this.z=n,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;default:throw new Error("THREE.Vector3: index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw new Error("THREE.Vector3: index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this}multiplyVectors(e,t){return this.x=e.x*t.x,this.y=e.y*t.y,this.z=e.z*t.z,this}applyEuler(e){return this.applyQuaternion($c.setFromEuler(e))}applyAxisAngle(e,t){return this.applyQuaternion($c.setFromAxisAngle(e,t))}applyMatrix3(e){let t=this.x,n=this.y,s=this.z,r=e.elements;return this.x=r[0]*t+r[3]*n+r[6]*s,this.y=r[1]*t+r[4]*n+r[7]*s,this.z=r[2]*t+r[5]*n+r[8]*s,this}applyNormalMatrix(e){return this.applyMatrix3(e).normalize()}applyMatrix4(e){let t=this.x,n=this.y,s=this.z,r=e.elements,a=1/(r[3]*t+r[7]*n+r[11]*s+r[15]);return this.x=(r[0]*t+r[4]*n+r[8]*s+r[12])*a,this.y=(r[1]*t+r[5]*n+r[9]*s+r[13])*a,this.z=(r[2]*t+r[6]*n+r[10]*s+r[14])*a,this}applyQuaternion(e){let t=this.x,n=this.y,s=this.z,r=e.x,a=e.y,o=e.z,l=e.w,c=2*(a*s-o*n),h=2*(o*t-r*s),f=2*(r*n-a*t);return this.x=t+l*c+a*f-o*h,this.y=n+l*h+o*c-r*f,this.z=s+l*f+r*h-a*c,this}project(e){return this.applyMatrix4(e.matrixWorldInverse).applyMatrix4(e.projectionMatrix)}unproject(e){return this.applyMatrix4(e.projectionMatrixInverse).applyMatrix4(e.matrixWorld)}transformDirection(e){let t=this.x,n=this.y,s=this.z,r=e.elements;return this.x=r[0]*t+r[4]*n+r[8]*s,this.y=r[1]*t+r[5]*n+r[9]*s,this.z=r[2]*t+r[6]*n+r[10]*s,this.normalize()}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this}divideScalar(e){return this.multiplyScalar(1/e)}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this}clamp(e,t){return this.x=Ke(this.x,e.x,t.x),this.y=Ke(this.y,e.y,t.y),this.z=Ke(this.z,e.z,t.z),this}clampScalar(e,t){return this.x=Ke(this.x,e,t),this.y=Ke(this.y,e,t),this.z=Ke(this.z,e,t),this}clampLength(e,t){let n=this.length();return this.divideScalar(n||1).multiplyScalar(Ke(n,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this.z=e.z+(t.z-e.z)*n,this}cross(e){return this.crossVectors(this,e)}crossVectors(e,t){let n=e.x,s=e.y,r=e.z,a=t.x,o=t.y,l=t.z;return this.x=s*l-r*o,this.y=r*a-n*l,this.z=n*o-s*a,this}projectOnVector(e){let t=e.lengthSq();if(t===0)return this.set(0,0,0);let n=e.dot(this)/t;return this.copy(e).multiplyScalar(n)}projectOnPlane(e){return Zo.copy(this).projectOnVector(e),this.sub(Zo)}reflect(e){return this.sub(Zo.copy(e).multiplyScalar(2*this.dot(e)))}angleTo(e){let t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;let n=this.dot(e)/t;return Math.acos(Ke(n,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){let t=this.x-e.x,n=this.y-e.y,s=this.z-e.z;return t*t+n*n+s*s}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)+Math.abs(this.z-e.z)}setFromSpherical(e){return this.setFromSphericalCoords(e.radius,e.phi,e.theta)}setFromSphericalCoords(e,t,n){let s=Math.sin(t)*e;return this.x=s*Math.sin(n),this.y=Math.cos(t)*e,this.z=s*Math.cos(n),this}setFromCylindrical(e){return this.setFromCylindricalCoords(e.radius,e.theta,e.y)}setFromCylindricalCoords(e,t,n){return this.x=e*Math.sin(t),this.y=n,this.z=e*Math.cos(t),this}setFromMatrixPosition(e){let t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this}setFromMatrixScale(e){let t=this.setFromMatrixColumn(e,0).length(),n=this.setFromMatrixColumn(e,1).length(),s=this.setFromMatrixColumn(e,2).length();return this.x=t,this.y=n,this.z=s,this}setFromMatrixColumn(e,t){return this.fromArray(e.elements,t*4)}setFromMatrix3Column(e,t){return this.fromArray(e.elements,t*3)}setFromEuler(e){return this.x=e._x,this.y=e._y,this.z=e._z,this}setFromColor(e){return this.x=e.r,this.y=e.g,this.z=e.b,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){let e=Math.random()*Math.PI*2,t=Math.random()*2-1,n=Math.sqrt(1-t*t);return this.x=n*Math.cos(e),this.y=t,this.z=n*Math.sin(e),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}},Zo=new G,$c=new bn,Ue=class{static{this.prototype.isMatrix3=!0}constructor(e,t,n,s,r,a,o,l,c){this.elements=[1,0,0,0,1,0,0,0,1],e!==void 0&&this.set(e,t,n,s,r,a,o,l,c)}set(e,t,n,s,r,a,o,l,c){let h=this.elements;return h[0]=e,h[1]=s,h[2]=o,h[3]=t,h[4]=r,h[5]=l,h[6]=n,h[7]=a,h[8]=c,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(e){let t=this.elements,n=e.elements;return t[0]=n[0],t[1]=n[1],t[2]=n[2],t[3]=n[3],t[4]=n[4],t[5]=n[5],t[6]=n[6],t[7]=n[7],t[8]=n[8],this}extractBasis(e,t,n){return e.setFromMatrix3Column(this,0),t.setFromMatrix3Column(this,1),n.setFromMatrix3Column(this,2),this}setFromMatrix4(e){let t=e.elements;return this.set(t[0],t[4],t[8],t[1],t[5],t[9],t[2],t[6],t[10]),this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){let n=e.elements,s=t.elements,r=this.elements,a=n[0],o=n[3],l=n[6],c=n[1],h=n[4],f=n[7],u=n[2],p=n[5],d=n[8],_=s[0],m=s[3],g=s[6],y=s[1],v=s[4],M=s[7],b=s[2],w=s[5],x=s[8];return r[0]=a*_+o*y+l*b,r[3]=a*m+o*v+l*w,r[6]=a*g+o*M+l*x,r[1]=c*_+h*y+f*b,r[4]=c*m+h*v+f*w,r[7]=c*g+h*M+f*x,r[2]=u*_+p*y+d*b,r[5]=u*m+p*v+d*w,r[8]=u*g+p*M+d*x,this}multiplyScalar(e){let t=this.elements;return t[0]*=e,t[3]*=e,t[6]*=e,t[1]*=e,t[4]*=e,t[7]*=e,t[2]*=e,t[5]*=e,t[8]*=e,this}determinant(){let e=this.elements,t=e[0],n=e[1],s=e[2],r=e[3],a=e[4],o=e[5],l=e[6],c=e[7],h=e[8];return t*a*h-t*o*c-n*r*h+n*o*l+s*r*c-s*a*l}invert(){let e=this.elements,t=e[0],n=e[1],s=e[2],r=e[3],a=e[4],o=e[5],l=e[6],c=e[7],h=e[8],f=h*a-o*c,u=o*l-h*r,p=c*r-a*l,d=t*f+n*u+s*p;if(d===0)return this.set(0,0,0,0,0,0,0,0,0);let _=1/d;return e[0]=f*_,e[1]=(s*c-h*n)*_,e[2]=(o*n-s*a)*_,e[3]=u*_,e[4]=(h*t-s*l)*_,e[5]=(s*r-o*t)*_,e[6]=p*_,e[7]=(n*l-c*t)*_,e[8]=(a*t-n*r)*_,this}transpose(){let e,t=this.elements;return e=t[1],t[1]=t[3],t[3]=e,e=t[2],t[2]=t[6],t[6]=e,e=t[5],t[5]=t[7],t[7]=e,this}getNormalMatrix(e){return this.setFromMatrix4(e).invert().transpose()}transposeIntoArray(e){let t=this.elements;return e[0]=t[0],e[1]=t[3],e[2]=t[6],e[3]=t[1],e[4]=t[4],e[5]=t[7],e[6]=t[2],e[7]=t[5],e[8]=t[8],this}setUvTransform(e,t,n,s,r,a,o){let l=Math.cos(r),c=Math.sin(r);return this.set(n*l,n*c,-n*(l*a+c*o)+a+e,-s*c,s*l,-s*(-c*a+l*o)+o+t,0,0,1),this}scale(e,t){return Vs("Matrix3: .scale() is deprecated. Use .makeScale() instead."),this.premultiply(Jo.makeScale(e,t)),this}rotate(e){return Vs("Matrix3: .rotate() is deprecated. Use .makeRotation() instead."),this.premultiply(Jo.makeRotation(-e)),this}translate(e,t){return Vs("Matrix3: .translate() is deprecated. Use .makeTranslation() instead."),this.premultiply(Jo.makeTranslation(e,t)),this}makeTranslation(e,t){return e.isVector2?this.set(1,0,e.x,0,1,e.y,0,0,1):this.set(1,0,e,0,1,t,0,0,1),this}makeRotation(e){let t=Math.cos(e),n=Math.sin(e);return this.set(t,-n,0,n,t,0,0,0,1),this}makeScale(e,t){return this.set(e,0,0,0,t,0,0,0,1),this}equals(e){let t=this.elements,n=e.elements;for(let s=0;s<9;s++)if(t[s]!==n[s])return!1;return!0}fromArray(e,t=0){for(let n=0;n<9;n++)this.elements[n]=e[n+t];return this}toArray(e=[],t=0){let n=this.elements;return e[t]=n[0],e[t+1]=n[1],e[t+2]=n[2],e[t+3]=n[3],e[t+4]=n[4],e[t+5]=n[5],e[t+6]=n[6],e[t+7]=n[7],e[t+8]=n[8],e}clone(){return new this.constructor().fromArray(this.elements)}},Jo=new Ue,Yc=new Ue().set(.4123908,.3575843,.1804808,.212639,.7151687,.0721923,.0193308,.1191948,.9505322),Zc=new Ue().set(3.2409699,-1.5373832,-.4986108,-.9692436,1.8759675,.0415551,.0556301,-.203977,1.0569715);function af(){let i={enabled:!0,workingColorSpace:Ws,spaces:{},convert:function(s,r,a){return this.enabled===!1||r===a||!r||!a||(this.spaces[r].transfer===nt&&(s.r=si(s.r),s.g=si(s.g),s.b=si(s.b)),this.spaces[r].primaries!==this.spaces[a].primaries&&(s.applyMatrix3(this.spaces[r].toXYZ),s.applyMatrix3(this.spaces[a].fromXYZ)),this.spaces[a].transfer===nt&&(s.r=us(s.r),s.g=us(s.g),s.b=us(s.b))),s},workingToColorSpace:function(s,r){return this.convert(s,this.workingColorSpace,r)},colorSpaceToWorking:function(s,r){return this.convert(s,r,this.workingColorSpace)},getPrimaries:function(s){return this.spaces[s].primaries},getTransfer:function(s){return s===ci?Xs:this.spaces[s].transfer},getToneMappingMode:function(s){return this.spaces[s].outputColorSpaceConfig.toneMappingMode||"standard"},getLuminanceCoefficients:function(s,r=this.workingColorSpace){return s.fromArray(this.spaces[r].luminanceCoefficients)},define:function(s){Object.assign(this.spaces,s)},_getMatrix:function(s,r,a){return s.copy(this.spaces[a].fromXYZ).multiply(this.spaces[r].toXYZ)},_getDrawingBufferColorSpace:function(s){return this.spaces[s].outputColorSpaceConfig.drawingBufferColorSpace},_getUnpackColorSpace:function(s=this.workingColorSpace){return this.spaces[s].workingColorSpaceConfig.unpackColorSpace}},e=[.64,.33,.3,.6,.15,.06],t=[.2126,.7152,.0722],n=[.3127,.329];return i.define({[Ws]:{primaries:e,whitePoint:n,transfer:Xs,toXYZ:Yc,fromXYZ:Zc,luminanceCoefficients:t,workingColorSpaceConfig:{unpackColorSpace:un},outputColorSpaceConfig:{drawingBufferColorSpace:un}},[un]:{primaries:e,whitePoint:n,transfer:nt,toXYZ:Yc,fromXYZ:Zc,luminanceCoefficients:t,outputColorSpaceConfig:{drawingBufferColorSpace:un}}}),i}var Ze=af();function si(i){return i<.04045?i*.0773993808:Math.pow(i*.9478672986+.0521327014,2.4)}function us(i){return i<.0031308?i*12.92:1.055*Math.pow(i,.41666)-.055}var ji,ua=class{static getDataURL(e,t="image/png"){if(/^data:/i.test(e.src)||typeof HTMLCanvasElement>"u")return e.src;let n;if(e instanceof HTMLCanvasElement)n=e;else{ji===void 0&&(ji=$s("canvas")),ji.width=e.width,ji.height=e.height;let s=ji.getContext("2d");e instanceof ImageData?s.putImageData(e,0,0):s.drawImage(e,0,0,e.width,e.height),n=ji}return n.toDataURL(t)}static sRGBToLinear(e){if(typeof HTMLImageElement<"u"&&e instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&e instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&e instanceof ImageBitmap){let t=$s("canvas");t.width=e.width,t.height=e.height;let n=t.getContext("2d");n.drawImage(e,0,0,e.width,e.height);let s=n.getImageData(0,0,e.width,e.height),r=s.data;for(let a=0;a<r.length;a++)r[a]=si(r[a]/255)*255;return n.putImageData(s,0,0),t}else if(e.data){let t=e.data.slice(0);for(let n=0;n<t.length;n++)t instanceof Uint8Array||t instanceof Uint8ClampedArray?t[n]=Math.floor(si(t[n]/255)*255):t[n]=si(t[n]);return{data:t,width:e.width,height:e.height}}else return Le("ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied."),e}},of=0,ms=class{constructor(e=null){this.isTextureSource=!0,Object.defineProperty(this,"id",{value:of++}),this.uuid=fr(),this.data=e,this.dataReady=!0,this.version=0}getSize(e){let t=this.data;return typeof HTMLVideoElement<"u"&&t instanceof HTMLVideoElement?e.set(t.videoWidth,t.videoHeight,0):typeof VideoFrame<"u"&&t instanceof VideoFrame?e.set(t.displayWidth,t.displayHeight,0):t!==null?e.set(t.width||0,t.height||0,t.depth||0):e.set(0,0,0),e}set needsUpdate(e){e===!0&&this.version++}toJSON(e){let t=e===void 0||typeof e=="string";if(!t&&e.images[this.uuid]!==void 0)return e.images[this.uuid];let n={uuid:this.uuid,url:""},s=this.data;if(s!==null){let r;if(Array.isArray(s)){r=[];for(let a=0,o=s.length;a<o;a++)s[a].isDataTexture?r.push(Ko(s[a].image)):r.push(Ko(s[a]))}else r=Ko(s);n.url=r}return t||(e.images[this.uuid]=n),n}};function Ko(i){return typeof HTMLImageElement<"u"&&i instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&i instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&i instanceof ImageBitmap?ua.getDataURL(i):i.data?{data:Array.from(i.data),width:i.width,height:i.height,type:i.data.constructor.name}:(Le("Texture: Unable to serialize Texture."),{})}var lf=0,jo=new G,tn=class i extends Hn{constructor(e=i.DEFAULT_IMAGE,t=i.DEFAULT_MAPPING,n=Vn,s=Vn,r=Mt,a=En,o=On,l=fn,c=i.DEFAULT_ANISOTROPY,h=ci){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:lf++}),this.uuid=fr(),this.name="",this.source=new ms(e),this.mipmaps=[],this.mapping=t,this.channel=0,this.wrapS=n,this.wrapT=s,this.magFilter=r,this.minFilter=a,this.anisotropy=c,this.format=o,this.internalFormat=null,this.type=l,this.offset=new Xe(0,0),this.repeat=new Xe(1,1),this.center=new Xe(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new Ue,this.generateMipmaps=!0,this.mipmapsAutoUpdate=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,this.colorSpace=h,this.userData={},this.updateRanges=[],this.version=0,this.onUpdate=null,this.renderTarget=null,this.isRenderTargetTexture=!1,this.isArrayTexture=!!(e&&e.depth&&e.depth>1),this.pmremVersion=0,this.isPMREMTexture=!1,this.normalized=!1}get width(){return this.source.getSize(jo).x}get height(){return this.source.getSize(jo).y}get depth(){return this.source.getSize(jo).z}get image(){return this.source.data}set image(e){this.source.data=e}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}clone(){return new this.constructor().copy(this)}copy(e){return this.name=e.name,this.source=e.source,this.mipmaps=e.mipmaps.slice(0),this.mapping=e.mapping,this.channel=e.channel,this.wrapS=e.wrapS,this.wrapT=e.wrapT,this.magFilter=e.magFilter,this.minFilter=e.minFilter,this.anisotropy=e.anisotropy,this.format=e.format,this.internalFormat=e.internalFormat,this.type=e.type,this.normalized=e.normalized,this.offset.copy(e.offset),this.repeat.copy(e.repeat),this.center.copy(e.center),this.rotation=e.rotation,this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrix.copy(e.matrix),this.generateMipmaps=e.generateMipmaps,this.mipmapsAutoUpdate=e.mipmapsAutoUpdate,this.premultiplyAlpha=e.premultiplyAlpha,this.flipY=e.flipY,this.unpackAlignment=e.unpackAlignment,this.colorSpace=e.colorSpace,this.renderTarget=e.renderTarget,this.isRenderTargetTexture=e.isRenderTargetTexture,this.isPMREMTexture=e.isPMREMTexture,this.isArrayTexture=e.isArrayTexture,this.userData=JSON.parse(JSON.stringify(e.userData)),this.needsUpdate=!0,this}setValues(e){for(let t in e){let n=e[t];if(n===void 0){Le(`Texture.setValues(): parameter '${t}' has value of undefined.`);continue}let s=this[t];if(s===void 0){Le(`Texture.setValues(): property '${t}' does not exist.`);continue}s&&n&&s.isVector2&&n.isVector2||s&&n&&s.isVector3&&n.isVector3||s&&n&&s.isMatrix3&&n.isMatrix3?s.copy(n):this[t]=n}}toJSON(e){let t=e===void 0||typeof e=="string";if(!t&&e.textures[this.uuid]!==void 0)return e.textures[this.uuid];let n={metadata:{version:4.7,type:"Texture",generator:"Texture.toJSON"},uuid:this.uuid,name:this.name,image:this.source.toJSON(e).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,normalized:this.normalized,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,mipmapsAutoUpdate:this.mipmapsAutoUpdate,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(n.userData=this.userData),t||(e.textures[this.uuid]=n),n}dispose(){this.dispatchEvent({type:"dispose"})}transformUv(e){if(this.mapping!==Dl)return e;if(e.applyMatrix3(this.matrix),e.x<0||e.x>1)switch(this.wrapS){case fs:e.x=e.x-Math.floor(e.x);break;case Vn:e.x=e.x<0?0:1;break;case la:Math.abs(Math.floor(e.x)%2)===1?e.x=Math.ceil(e.x)-e.x:e.x=e.x-Math.floor(e.x);break}if(e.y<0||e.y>1)switch(this.wrapT){case fs:e.y=e.y-Math.floor(e.y);break;case Vn:e.y=e.y<0?0:1;break;case la:Math.abs(Math.floor(e.y)%2)===1?e.y=Math.ceil(e.y)-e.y:e.y=e.y-Math.floor(e.y);break}return this.flipY&&(e.y=1-e.y),e}set needsUpdate(e){e===!0&&(this.version++,this.source.needsUpdate=!0)}set needsPMREMUpdate(e){e===!0&&this.pmremVersion++}};tn.DEFAULT_IMAGE=null;tn.DEFAULT_MAPPING=Dl;tn.DEFAULT_ANISOTROPY=1;var lt=class{static{this.prototype.isVector4=!0}constructor(e=0,t=0,n=0,s=1){this.x=e,this.y=t,this.z=n,this.w=s}get width(){return this.z}set width(e){this.z=e}get height(){return this.w}set height(e){this.w=e}set(e,t,n,s){return this.x=e,this.y=t,this.z=n,this.w=s,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this.w=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setW(e){return this.w=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;case 3:this.w=t;break;default:throw new Error("THREE.Vector4: index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw new Error("THREE.Vector4: index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this.w=e.w!==void 0?e.w:1,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this.w+=e.w,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this.w+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this.w=e.w+t.w,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this.w+=e.w*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this.w-=e.w,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this.w-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this.w=e.w-t.w,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this.w*=e.w,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this.w*=e,this}applyMatrix4(e){let t=this.x,n=this.y,s=this.z,r=this.w,a=e.elements;return this.x=a[0]*t+a[4]*n+a[8]*s+a[12]*r,this.y=a[1]*t+a[5]*n+a[9]*s+a[13]*r,this.z=a[2]*t+a[6]*n+a[10]*s+a[14]*r,this.w=a[3]*t+a[7]*n+a[11]*s+a[15]*r,this}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this.w/=e.w,this}divideScalar(e){return this.multiplyScalar(1/e)}setAxisAngleFromQuaternion(e){this.w=2*Math.acos(e.w);let t=Math.sqrt(1-e.w*e.w);return t<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=e.x/t,this.y=e.y/t,this.z=e.z/t),this}setAxisAngleFromRotationMatrix(e){let t,n,s,r,l=e.elements,c=l[0],h=l[4],f=l[8],u=l[1],p=l[5],d=l[9],_=l[2],m=l[6],g=l[10];if(Math.abs(h-u)<.01&&Math.abs(f-_)<.01&&Math.abs(d-m)<.01){if(Math.abs(h+u)<.1&&Math.abs(f+_)<.1&&Math.abs(d+m)<.1&&Math.abs(c+p+g-3)<.1)return this.set(1,0,0,0),this;t=Math.PI;let v=(c+1)/2,M=(p+1)/2,b=(g+1)/2,w=(h+u)/4,x=(f+_)/4,S=(d+m)/4;return v>M&&v>b?v<.01?(n=0,s=.707106781,r=.707106781):(n=Math.sqrt(v),s=w/n,r=x/n):M>b?M<.01?(n=.707106781,s=0,r=.707106781):(s=Math.sqrt(M),n=w/s,r=S/s):b<.01?(n=.707106781,s=.707106781,r=0):(r=Math.sqrt(b),n=x/r,s=S/r),this.set(n,s,r,t),this}let y=Math.sqrt((m-d)*(m-d)+(f-_)*(f-_)+(u-h)*(u-h));return Math.abs(y)<.001&&(y=1),this.x=(m-d)/y,this.y=(f-_)/y,this.z=(u-h)/y,this.w=Math.acos((c+p+g-1)/2),this}setFromMatrixPosition(e){let t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this.w=t[15],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this.w=Math.min(this.w,e.w),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this.w=Math.max(this.w,e.w),this}clamp(e,t){return this.x=Ke(this.x,e.x,t.x),this.y=Ke(this.y,e.y,t.y),this.z=Ke(this.z,e.z,t.z),this.w=Ke(this.w,e.w,t.w),this}clampScalar(e,t){return this.x=Ke(this.x,e,t),this.y=Ke(this.y,e,t),this.z=Ke(this.z,e,t),this.w=Ke(this.w,e,t),this}clampLength(e,t){let n=this.length();return this.divideScalar(n||1).multiplyScalar(Ke(n,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z+this.w*e.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this.w+=(e.w-this.w)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this.z=e.z+(t.z-e.z)*n,this.w=e.w+(t.w-e.w)*n,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z&&e.w===this.w}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this.w=e[t+3],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e[t+3]=this.w,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this.w=e.getW(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}},da=class extends Hn{constructor(e=1,t=1,n={}){super(),n=Object.assign({generateMipmaps:!1,internalFormat:null,minFilter:Mt,depthBuffer:!0,stencilBuffer:!1,resolveColorBuffer:!0,resolveDepthBuffer:!0,resolveStencilBuffer:!0,storeMultisampledColorBuffer:!0,storeMultisampledDepthBuffer:!0,storeMultisampledStencilBuffer:!0,depthTexture:null,samples:0,count:1,depth:1,multiview:!1,useArrayDepthTexture:!1},n),this.isRenderTarget=!0,this.width=e,this.height=t,this.depth=n.depth,this.scissor=new lt(0,0,e,t),this.scissorTest=!1,this.viewport=new lt(0,0,e,t),this.textures=[];let s=n.count;for(let r=0;r<s;r++)this.textures[r]=new tn({width:e,height:t,depth:n.depth}),this.textures[r].isRenderTargetTexture=!0,this.textures[r].renderTarget=this;this._setTextureOptions(n),this.depthBuffer=n.depthBuffer,this.stencilBuffer=n.stencilBuffer,this.resolveColorBuffer=n.resolveColorBuffer,this.resolveDepthBuffer=n.resolveDepthBuffer,this.resolveStencilBuffer=n.resolveStencilBuffer,this.storeMultisampledColorBuffer=n.storeMultisampledColorBuffer,this.storeMultisampledDepthBuffer=n.storeMultisampledDepthBuffer,this.storeMultisampledStencilBuffer=n.storeMultisampledStencilBuffer,this._depthTexture=null,this.depthTexture=n.depthTexture,this.samples=n.samples,this.multiview=n.multiview,this.useArrayDepthTexture=n.useArrayDepthTexture}_setTextureOptions(e={}){let t={minFilter:Mt,generateMipmaps:!1,flipY:!1,internalFormat:null};e.mapping!==void 0&&(t.mapping=e.mapping),e.wrapS!==void 0&&(t.wrapS=e.wrapS),e.wrapT!==void 0&&(t.wrapT=e.wrapT),e.wrapR!==void 0&&(t.wrapR=e.wrapR),e.magFilter!==void 0&&(t.magFilter=e.magFilter),e.minFilter!==void 0&&(t.minFilter=e.minFilter),e.format!==void 0&&(t.format=e.format),e.type!==void 0&&(t.type=e.type),e.anisotropy!==void 0&&(t.anisotropy=e.anisotropy),e.colorSpace!==void 0&&(t.colorSpace=e.colorSpace),e.flipY!==void 0&&(t.flipY=e.flipY),e.generateMipmaps!==void 0&&(t.generateMipmaps=e.generateMipmaps),e.mipmapsAutoUpdate!==void 0&&(t.mipmapsAutoUpdate=e.mipmapsAutoUpdate),e.internalFormat!==void 0&&(t.internalFormat=e.internalFormat);for(let n=0;n<this.textures.length;n++)this.textures[n].setValues(t)}get texture(){return this.textures[0]}set texture(e){this.textures[0]=e}set depthTexture(e){this._depthTexture!==null&&this._depthTexture.renderTarget===this&&(this._depthTexture.renderTarget=null),e!==null&&e.renderTarget===null&&(e.renderTarget=this),this._depthTexture=e}get depthTexture(){return this._depthTexture}setSize(e,t,n=1){if(this.width!==e||this.height!==t||this.depth!==n){this.width=e,this.height=t,this.depth=n;for(let s=0,r=this.textures.length;s<r;s++)this.textures[s].image.width=e,this.textures[s].image.height=t,this.textures[s].image.depth=n,this.textures[s].isData3DTexture!==!0&&(this.textures[s].isArrayTexture=this.textures[s].image.depth>1);this.dispose()}this.viewport.set(0,0,e,t),this.scissor.set(0,0,e,t)}clone(){return new this.constructor().copy(this)}copy(e){this.width=e.width,this.height=e.height,this.depth=e.depth,this.scissor.copy(e.scissor),this.scissorTest=e.scissorTest,this.viewport.copy(e.viewport),this.textures.length=0;for(let t=0,n=e.textures.length;t<n;t++){this.textures[t]=e.textures[t].clone(),this.textures[t].isRenderTargetTexture=!0,this.textures[t].renderTarget=this;let s=Object.assign({},e.textures[t].image);this.textures[t].source=new ms(s)}if(this.depthBuffer=e.depthBuffer,this.stencilBuffer=e.stencilBuffer,this.resolveColorBuffer=e.resolveColorBuffer,this.resolveDepthBuffer=e.resolveDepthBuffer,this.resolveStencilBuffer=e.resolveStencilBuffer,this.storeMultisampledColorBuffer=e.storeMultisampledColorBuffer,this.storeMultisampledDepthBuffer=e.storeMultisampledDepthBuffer,this.storeMultisampledStencilBuffer=e.storeMultisampledStencilBuffer,e.depthTexture!==null)if(e.depthTexture.renderTarget===e){let t=e.depthTexture.clone();t.renderTarget=null,this.depthTexture=t}else this.depthTexture=e.depthTexture;else this.depthTexture=null;return this.samples=e.samples,this.multiview=e.multiview,this.useArrayDepthTexture=e.useArrayDepthTexture,this}dispose(){this.dispatchEvent({type:"dispose"})}},nn=class extends da{constructor(e=1,t=1,n={}){super(e,t,n),this.isWebGLRenderTarget=!0}},Ys=class extends tn{constructor(e=null,t=1,n=1,s=1){super(null),this.isDataArrayTexture=!0,this.image={data:e,width:t,height:n,depth:s},this.magFilter=Ut,this.minFilter=Ut,this.wrapR=Vn,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1,this.layerUpdates=new Set}copy(e){return super.copy(e),this.wrapR=e.wrapR,this}addLayerUpdate(e){this.layerUpdates.add(e)}clearLayerUpdates(){this.layerUpdates.clear()}};var fa=class extends tn{constructor(e=null,t=1,n=1,s=1){super(null),this.isData3DTexture=!0,this.image={data:e,width:t,height:n,depth:s},this.magFilter=Ut,this.minFilter=Ut,this.wrapR=Vn,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}copy(e){return super.copy(e),this.wrapR=e.wrapR,this}};var xt=class i{static{this.prototype.isMatrix4=!0}constructor(e,t,n,s,r,a,o,l,c,h,f,u,p,d,_,m){this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],e!==void 0&&this.set(e,t,n,s,r,a,o,l,c,h,f,u,p,d,_,m)}set(e,t,n,s,r,a,o,l,c,h,f,u,p,d,_,m){let g=this.elements;return g[0]=e,g[4]=t,g[8]=n,g[12]=s,g[1]=r,g[5]=a,g[9]=o,g[13]=l,g[2]=c,g[6]=h,g[10]=f,g[14]=u,g[3]=p,g[7]=d,g[11]=_,g[15]=m,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new i().fromArray(this.elements)}copy(e){let t=this.elements,n=e.elements;return t[0]=n[0],t[1]=n[1],t[2]=n[2],t[3]=n[3],t[4]=n[4],t[5]=n[5],t[6]=n[6],t[7]=n[7],t[8]=n[8],t[9]=n[9],t[10]=n[10],t[11]=n[11],t[12]=n[12],t[13]=n[13],t[14]=n[14],t[15]=n[15],this}copyPosition(e){let t=this.elements,n=e.elements;return t[12]=n[12],t[13]=n[13],t[14]=n[14],this}setFromMatrix3(e){let t=e.elements;return this.set(t[0],t[3],t[6],0,t[1],t[4],t[7],0,t[2],t[5],t[8],0,0,0,0,1),this}extractBasis(e,t,n){return this.determinantAffine()===0?(e.set(1,0,0),t.set(0,1,0),n.set(0,0,1),this):(e.setFromMatrixColumn(this,0),t.setFromMatrixColumn(this,1),n.setFromMatrixColumn(this,2),this)}makeBasis(e,t,n){return this.set(e.x,t.x,n.x,0,e.y,t.y,n.y,0,e.z,t.z,n.z,0,0,0,0,1),this}extractRotation(e){if(e.determinantAffine()===0)return this.identity();let t=this.elements,n=e.elements,s=1/Qi.setFromMatrixColumn(e,0).length(),r=1/Qi.setFromMatrixColumn(e,1).length(),a=1/Qi.setFromMatrixColumn(e,2).length();return t[0]=n[0]*s,t[1]=n[1]*s,t[2]=n[2]*s,t[3]=0,t[4]=n[4]*r,t[5]=n[5]*r,t[6]=n[6]*r,t[7]=0,t[8]=n[8]*a,t[9]=n[9]*a,t[10]=n[10]*a,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromEuler(e){let t=this.elements,n=e.x,s=e.y,r=e.z,a=Math.cos(n),o=Math.sin(n),l=Math.cos(s),c=Math.sin(s),h=Math.cos(r),f=Math.sin(r);if(e.order==="XYZ"){let u=a*h,p=a*f,d=o*h,_=o*f;t[0]=l*h,t[4]=-l*f,t[8]=c,t[1]=p+d*c,t[5]=u-_*c,t[9]=-o*l,t[2]=_-u*c,t[6]=d+p*c,t[10]=a*l}else if(e.order==="YXZ"){let u=l*h,p=l*f,d=c*h,_=c*f;t[0]=u+_*o,t[4]=d*o-p,t[8]=a*c,t[1]=a*f,t[5]=a*h,t[9]=-o,t[2]=p*o-d,t[6]=_+u*o,t[10]=a*l}else if(e.order==="ZXY"){let u=l*h,p=l*f,d=c*h,_=c*f;t[0]=u-_*o,t[4]=-a*f,t[8]=d+p*o,t[1]=p+d*o,t[5]=a*h,t[9]=_-u*o,t[2]=-a*c,t[6]=o,t[10]=a*l}else if(e.order==="ZYX"){let u=a*h,p=a*f,d=o*h,_=o*f;t[0]=l*h,t[4]=d*c-p,t[8]=u*c+_,t[1]=l*f,t[5]=_*c+u,t[9]=p*c-d,t[2]=-c,t[6]=o*l,t[10]=a*l}else if(e.order==="YZX"){let u=a*l,p=a*c,d=o*l,_=o*c;t[0]=l*h,t[4]=_-u*f,t[8]=d*f+p,t[1]=f,t[5]=a*h,t[9]=-o*h,t[2]=-c*h,t[6]=p*f+d,t[10]=u-_*f}else if(e.order==="XZY"){let u=a*l,p=a*c,d=o*l,_=o*c;t[0]=l*h,t[4]=-f,t[8]=c*h,t[1]=u*f+_,t[5]=a*h,t[9]=p*f-d,t[2]=d*f-p,t[6]=o*h,t[10]=_*f+u}return t[3]=0,t[7]=0,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromQuaternion(e){return this.compose(cf,e,hf)}lookAt(e,t,n){let s=this.elements;return cn.subVectors(e,t),cn.lengthSq()===0&&(cn.z=1),cn.normalize(),mi.crossVectors(n,cn),mi.lengthSq()===0&&(Math.abs(n.z)===1?cn.x+=1e-4:cn.z+=1e-4,cn.normalize(),mi.crossVectors(n,cn)),mi.normalize(),Dr.crossVectors(cn,mi),s[0]=mi.x,s[4]=Dr.x,s[8]=cn.x,s[1]=mi.y,s[5]=Dr.y,s[9]=cn.y,s[2]=mi.z,s[6]=Dr.z,s[10]=cn.z,this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){let n=e.elements,s=t.elements,r=this.elements,a=n[0],o=n[4],l=n[8],c=n[12],h=n[1],f=n[5],u=n[9],p=n[13],d=n[2],_=n[6],m=n[10],g=n[14],y=n[3],v=n[7],M=n[11],b=n[15],w=s[0],x=s[4],S=s[8],P=s[12],R=s[1],C=s[5],D=s[9],F=s[13],L=s[2],V=s[6],$=s[10],H=s[14],te=s[3],X=s[7],ee=s[11],Q=s[15];return r[0]=a*w+o*R+l*L+c*te,r[4]=a*x+o*C+l*V+c*X,r[8]=a*S+o*D+l*$+c*ee,r[12]=a*P+o*F+l*H+c*Q,r[1]=h*w+f*R+u*L+p*te,r[5]=h*x+f*C+u*V+p*X,r[9]=h*S+f*D+u*$+p*ee,r[13]=h*P+f*F+u*H+p*Q,r[2]=d*w+_*R+m*L+g*te,r[6]=d*x+_*C+m*V+g*X,r[10]=d*S+_*D+m*$+g*ee,r[14]=d*P+_*F+m*H+g*Q,r[3]=y*w+v*R+M*L+b*te,r[7]=y*x+v*C+M*V+b*X,r[11]=y*S+v*D+M*$+b*ee,r[15]=y*P+v*F+M*H+b*Q,this}multiplyScalar(e){let t=this.elements;return t[0]*=e,t[4]*=e,t[8]*=e,t[12]*=e,t[1]*=e,t[5]*=e,t[9]*=e,t[13]*=e,t[2]*=e,t[6]*=e,t[10]*=e,t[14]*=e,t[3]*=e,t[7]*=e,t[11]*=e,t[15]*=e,this}determinant(){let e=this.elements,t=e[0],n=e[4],s=e[8],r=e[12],a=e[1],o=e[5],l=e[9],c=e[13],h=e[2],f=e[6],u=e[10],p=e[14],d=e[3],_=e[7],m=e[11],g=e[15],y=l*p-c*u,v=o*p-c*f,M=o*u-l*f,b=a*p-c*h,w=a*u-l*h,x=a*f-o*h;return t*(_*y-m*v+g*M)-n*(d*y-m*b+g*w)+s*(d*v-_*b+g*x)-r*(d*M-_*w+m*x)}determinantAffine(){let e=this.elements,t=e[0],n=e[4],s=e[8],r=e[1],a=e[5],o=e[9],l=e[2],c=e[6],h=e[10];return t*(a*h-o*c)-n*(r*h-o*l)+s*(r*c-a*l)}transpose(){let e=this.elements,t;return t=e[1],e[1]=e[4],e[4]=t,t=e[2],e[2]=e[8],e[8]=t,t=e[6],e[6]=e[9],e[9]=t,t=e[3],e[3]=e[12],e[12]=t,t=e[7],e[7]=e[13],e[13]=t,t=e[11],e[11]=e[14],e[14]=t,this}setPosition(e,t,n){let s=this.elements;return e.isVector3?(s[12]=e.x,s[13]=e.y,s[14]=e.z):(s[12]=e,s[13]=t,s[14]=n),this}invert(){let e=this.elements,t=e[0],n=e[1],s=e[2],r=e[3],a=e[4],o=e[5],l=e[6],c=e[7],h=e[8],f=e[9],u=e[10],p=e[11],d=e[12],_=e[13],m=e[14],g=e[15],y=t*o-n*a,v=t*l-s*a,M=t*c-r*a,b=n*l-s*o,w=n*c-r*o,x=s*c-r*l,S=h*_-f*d,P=h*m-u*d,R=h*g-p*d,C=f*m-u*_,D=f*g-p*_,F=u*g-p*m,L=y*F-v*D+M*C+b*R-w*P+x*S;if(L===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);let V=1/L;return e[0]=(o*F-l*D+c*C)*V,e[1]=(s*D-n*F-r*C)*V,e[2]=(_*x-m*w+g*b)*V,e[3]=(u*w-f*x-p*b)*V,e[4]=(l*R-a*F-c*P)*V,e[5]=(t*F-s*R+r*P)*V,e[6]=(m*M-d*x-g*v)*V,e[7]=(h*x-u*M+p*v)*V,e[8]=(a*D-o*R+c*S)*V,e[9]=(n*R-t*D-r*S)*V,e[10]=(d*w-_*M+g*y)*V,e[11]=(f*M-h*w-p*y)*V,e[12]=(o*P-a*C-l*S)*V,e[13]=(t*C-n*P+s*S)*V,e[14]=(_*v-d*b-m*y)*V,e[15]=(h*b-f*v+u*y)*V,this}scale(e){let t=this.elements,n=e.x,s=e.y,r=e.z;return t[0]*=n,t[4]*=s,t[8]*=r,t[1]*=n,t[5]*=s,t[9]*=r,t[2]*=n,t[6]*=s,t[10]*=r,t[3]*=n,t[7]*=s,t[11]*=r,this}getMaxScaleOnAxis(){let e=this.elements,t=e[0]*e[0]+e[1]*e[1]+e[2]*e[2],n=e[4]*e[4]+e[5]*e[5]+e[6]*e[6],s=e[8]*e[8]+e[9]*e[9]+e[10]*e[10];return Math.sqrt(Math.max(t,n,s))}makeTranslation(e,t,n){return e.isVector3?this.set(1,0,0,e.x,0,1,0,e.y,0,0,1,e.z,0,0,0,1):this.set(1,0,0,e,0,1,0,t,0,0,1,n,0,0,0,1),this}makeRotationX(e){let t=Math.cos(e),n=Math.sin(e);return this.set(1,0,0,0,0,t,-n,0,0,n,t,0,0,0,0,1),this}makeRotationY(e){let t=Math.cos(e),n=Math.sin(e);return this.set(t,0,n,0,0,1,0,0,-n,0,t,0,0,0,0,1),this}makeRotationZ(e){let t=Math.cos(e),n=Math.sin(e);return this.set(t,-n,0,0,n,t,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(e,t){let n=Math.cos(t),s=Math.sin(t),r=1-n,a=e.x,o=e.y,l=e.z,c=r*a,h=r*o;return this.set(c*a+n,c*o-s*l,c*l+s*o,0,c*o+s*l,h*o+n,h*l-s*a,0,c*l-s*o,h*l+s*a,r*l*l+n,0,0,0,0,1),this}makeScale(e,t,n){return this.set(e,0,0,0,0,t,0,0,0,0,n,0,0,0,0,1),this}makeShear(e,t,n,s,r,a){return this.set(1,n,r,0,e,1,a,0,t,s,1,0,0,0,0,1),this}compose(e,t,n){let s=this.elements,r=t._x,a=t._y,o=t._z,l=t._w,c=r+r,h=a+a,f=o+o,u=r*c,p=r*h,d=r*f,_=a*h,m=a*f,g=o*f,y=l*c,v=l*h,M=l*f,b=n.x,w=n.y,x=n.z;return s[0]=(1-(_+g))*b,s[1]=(p+M)*b,s[2]=(d-v)*b,s[3]=0,s[4]=(p-M)*w,s[5]=(1-(u+g))*w,s[6]=(m+y)*w,s[7]=0,s[8]=(d+v)*x,s[9]=(m-y)*x,s[10]=(1-(u+_))*x,s[11]=0,s[12]=e.x,s[13]=e.y,s[14]=e.z,s[15]=1,this}decompose(e,t,n){let s=this.elements;e.x=s[12],e.y=s[13],e.z=s[14];let r=this.determinantAffine();if(r===0)return n.set(1,1,1),t.identity(),this;let a=Qi.set(s[0],s[1],s[2]).length(),o=Qi.set(s[4],s[5],s[6]).length(),l=Qi.set(s[8],s[9],s[10]).length();r<0&&(a=-a),Pn.copy(this);let c=1/a,h=1/o,f=1/l;return Pn.elements[0]*=c,Pn.elements[1]*=c,Pn.elements[2]*=c,Pn.elements[4]*=h,Pn.elements[5]*=h,Pn.elements[6]*=h,Pn.elements[8]*=f,Pn.elements[9]*=f,Pn.elements[10]*=f,t.setFromRotationMatrix(Pn),n.x=a,n.y=o,n.z=l,this}makePerspective(e,t,n,s,r,a,o=yn,l=!1){let c=this.elements,h=2*r/(t-e),f=2*r/(n-s),u=(t+e)/(t-e),p=(n+s)/(n-s),d,_;if(l)d=r/(a-r),_=a*r/(a-r);else if(o===yn)d=-(a+r)/(a-r),_=-2*a*r/(a-r);else if(o===qs)d=-a/(a-r),_=-a*r/(a-r);else throw new Error("THREE.Matrix4.makePerspective(): Invalid coordinate system: "+o);return c[0]=h,c[4]=0,c[8]=u,c[12]=0,c[1]=0,c[5]=f,c[9]=p,c[13]=0,c[2]=0,c[6]=0,c[10]=d,c[14]=_,c[3]=0,c[7]=0,c[11]=-1,c[15]=0,this}makeOrthographic(e,t,n,s,r,a,o=yn,l=!1){let c=this.elements,h=2/(t-e),f=2/(n-s),u=-(t+e)/(t-e),p=-(n+s)/(n-s),d,_;if(l)d=1/(a-r),_=a/(a-r);else if(o===yn)d=-2/(a-r),_=-(a+r)/(a-r);else if(o===qs)d=-1/(a-r),_=-r/(a-r);else throw new Error("THREE.Matrix4.makeOrthographic(): Invalid coordinate system: "+o);return c[0]=h,c[4]=0,c[8]=0,c[12]=u,c[1]=0,c[5]=f,c[9]=0,c[13]=p,c[2]=0,c[6]=0,c[10]=d,c[14]=_,c[3]=0,c[7]=0,c[11]=0,c[15]=1,this}equals(e){let t=this.elements,n=e.elements;for(let s=0;s<16;s++)if(t[s]!==n[s])return!1;return!0}fromArray(e,t=0){for(let n=0;n<16;n++)this.elements[n]=e[n+t];return this}toArray(e=[],t=0){let n=this.elements;return e[t]=n[0],e[t+1]=n[1],e[t+2]=n[2],e[t+3]=n[3],e[t+4]=n[4],e[t+5]=n[5],e[t+6]=n[6],e[t+7]=n[7],e[t+8]=n[8],e[t+9]=n[9],e[t+10]=n[10],e[t+11]=n[11],e[t+12]=n[12],e[t+13]=n[13],e[t+14]=n[14],e[t+15]=n[15],e}},Qi=new G,Pn=new xt,cf=new G(0,0,0),hf=new G(1,1,1),mi=new G,Dr=new G,cn=new G,Jc=new xt,Kc=new bn,Wn=class i{constructor(e=0,t=0,n=0,s=i.DEFAULT_ORDER){this.isEuler=!0,this._x=e,this._y=t,this._z=n,this._order=s}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get order(){return this._order}set order(e){this._order=e,this._onChangeCallback()}set(e,t,n,s=this._order){return this._x=e,this._y=t,this._z=n,this._order=s,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(e){return this._x=e._x,this._y=e._y,this._z=e._z,this._order=e._order,this._onChangeCallback(),this}setFromRotationMatrix(e,t=this._order,n=!0){let s=e.elements,r=s[0],a=s[4],o=s[8],l=s[1],c=s[5],h=s[9],f=s[2],u=s[6],p=s[10];switch(t){case"XYZ":this._y=Math.asin(Ke(o,-1,1)),Math.abs(o)<.9999999?(this._x=Math.atan2(-h,p),this._z=Math.atan2(-a,r)):(this._x=Math.atan2(u,c),this._z=0);break;case"YXZ":this._x=Math.asin(-Ke(h,-1,1)),Math.abs(h)<.9999999?(this._y=Math.atan2(o,p),this._z=Math.atan2(l,c)):(this._y=Math.atan2(-f,r),this._z=0);break;case"ZXY":this._x=Math.asin(Ke(u,-1,1)),Math.abs(u)<.9999999?(this._y=Math.atan2(-f,p),this._z=Math.atan2(-a,c)):(this._y=0,this._z=Math.atan2(l,r));break;case"ZYX":this._y=Math.asin(-Ke(f,-1,1)),Math.abs(f)<.9999999?(this._x=Math.atan2(u,p),this._z=Math.atan2(l,r)):(this._x=0,this._z=Math.atan2(-a,c));break;case"YZX":this._z=Math.asin(Ke(l,-1,1)),Math.abs(l)<.9999999?(this._x=Math.atan2(-h,c),this._y=Math.atan2(-f,r)):(this._x=0,this._y=Math.atan2(o,p));break;case"XZY":this._z=Math.asin(-Ke(a,-1,1)),Math.abs(a)<.9999999?(this._x=Math.atan2(u,c),this._y=Math.atan2(o,r)):(this._x=Math.atan2(-h,p),this._y=0);break;default:Le("Euler: .setFromRotationMatrix() encountered an unknown order: "+t)}return this._order=t,n===!0&&this._onChangeCallback(),this}setFromQuaternion(e,t,n){return Jc.makeRotationFromQuaternion(e),this.setFromRotationMatrix(Jc,t,n)}setFromVector3(e,t=this._order){return this.set(e.x,e.y,e.z,t)}reorder(e){return Kc.setFromEuler(this),this.setFromQuaternion(Kc,e)}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._order===this._order}fromArray(e){return this._x=e[0],this._y=e[1],this._z=e[2],e[3]!==void 0&&(this._order=e[3]),this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._order,e}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}};Wn.DEFAULT_ORDER="XYZ";var Zs=class{constructor(){this.mask=1}set(e){this.mask=(1<<e|0)>>>0}enable(e){this.mask|=1<<e|0}enableAll(){this.mask=-1}toggle(e){this.mask^=1<<e|0}disable(e){this.mask&=~(1<<e|0)}disableAll(){this.mask=0}test(e){return(this.mask&e.mask)!==0}isEnabled(e){return(this.mask&(1<<e|0))!==0}},uf=0,jc=new G,es=new bn,Qn=new xt,Nr=new G,ks=new G,df=new G,ff=new bn,Qc=new G(1,0,0),eh=new G(0,1,0),th=new G(0,0,1),nh={type:"added"},pf={type:"removed"},ts={type:"childadded",child:null},Qo={type:"childremoved",child:null},Sn=class i extends Hn{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:uf++}),this.uuid=fr(),this.name="",this.type="Object3D",this.parent=null,this.children=[],this.up=i.DEFAULT_UP.clone();let e=new G,t=new Wn,n=new bn,s=new G(1,1,1);function r(){n.setFromEuler(t,!1)}function a(){t.setFromQuaternion(n,void 0,!1)}t._onChange(r),n._onChange(a),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:e},rotation:{configurable:!0,enumerable:!0,value:t},quaternion:{configurable:!0,enumerable:!0,value:n},scale:{configurable:!0,enumerable:!0,value:s},modelViewMatrix:{value:new xt},normalMatrix:{value:new Ue}}),this.matrix=new xt,this.matrixWorld=new xt,this.matrixAutoUpdate=i.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=i.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new Zs,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.customDepthMaterial=void 0,this.customDistanceMaterial=void 0,this.static=!1,this.userData={},this.pivot=null}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(e){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(e),this.matrix.decompose(this.position,this.quaternion,this.scale),this.pivot!==null&&this.position.copy(this.pivot).applyMatrix4(this.matrix).sub(this.pivot)}applyQuaternion(e){return this.quaternion.premultiply(e),this}setRotationFromAxisAngle(e,t){this.quaternion.setFromAxisAngle(e,t)}setRotationFromEuler(e){this.quaternion.setFromEuler(e,!0)}setRotationFromMatrix(e){this.quaternion.setFromRotationMatrix(e)}setRotationFromQuaternion(e){this.quaternion.copy(e)}rotateOnAxis(e,t){return es.setFromAxisAngle(e,t),this.quaternion.multiply(es),this}rotateOnWorldAxis(e,t){return es.setFromAxisAngle(e,t),this.quaternion.premultiply(es),this}rotateX(e){return this.rotateOnAxis(Qc,e)}rotateY(e){return this.rotateOnAxis(eh,e)}rotateZ(e){return this.rotateOnAxis(th,e)}translateOnAxis(e,t){return jc.copy(e).applyQuaternion(this.quaternion),this.position.add(jc.multiplyScalar(t)),this}translateX(e){return this.translateOnAxis(Qc,e)}translateY(e){return this.translateOnAxis(eh,e)}translateZ(e){return this.translateOnAxis(th,e)}localToWorld(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(this.matrixWorld)}worldToLocal(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(Qn.copy(this.matrixWorld).invert())}lookAt(e,t,n){e.isVector3?Nr.copy(e):Nr.set(e,t,n);let s=this.parent;this.updateWorldMatrix(!0,!1),ks.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?Qn.lookAt(ks,Nr,this.up):Qn.lookAt(Nr,ks,this.up),this.quaternion.setFromRotationMatrix(Qn),s&&(Qn.extractRotation(s.matrixWorld),es.setFromRotationMatrix(Qn),this.quaternion.premultiply(es.invert()))}add(e){if(arguments.length>1){for(let t=0;t<arguments.length;t++)this.add(arguments[t]);return this}return e===this?(De("Object3D.add: object can't be added as a child of itself.",e),this):(e&&e.isObject3D?(e.removeFromParent(),e.parent=this,this.children.push(e),e.dispatchEvent(nh),ts.child=e,this.dispatchEvent(ts),ts.child=null):De("Object3D.add: object not an instance of THREE.Object3D.",e),this)}remove(e){if(arguments.length>1){for(let n=0;n<arguments.length;n++)this.remove(arguments[n]);return this}let t=this.children.indexOf(e);return t!==-1&&(e.parent=null,this.children.splice(t,1),e.dispatchEvent(pf),Qo.child=e,this.dispatchEvent(Qo),Qo.child=null),this}removeFromParent(){let e=this.parent;return e!==null&&e.remove(this),this}clear(){return this.remove(...this.children)}attach(e){return this.updateWorldMatrix(!0,!1),Qn.copy(this.matrixWorld).invert(),e.parent!==null&&(e.parent.updateWorldMatrix(!0,!1),Qn.multiply(e.parent.matrixWorld)),e.applyMatrix4(Qn),e.removeFromParent(),e.parent=this,this.children.push(e),e.updateWorldMatrix(!1,!0),e.dispatchEvent(nh),ts.child=e,this.dispatchEvent(ts),ts.child=null,this}getObjectById(e){return this.getObjectByProperty("id",e)}getObjectByName(e){return this.getObjectByProperty("name",e)}getObjectByProperty(e,t){if(this[e]===t)return this;for(let n=0,s=this.children.length;n<s;n++){let a=this.children[n].getObjectByProperty(e,t);if(a!==void 0)return a}}getObjectsByProperty(e,t,n=[]){this[e]===t&&n.push(this);let s=this.children;for(let r=0,a=s.length;r<a;r++)s[r].getObjectsByProperty(e,t,n);return n}getWorldPosition(e){return this.updateWorldMatrix(!0,!1),e.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(ks,e,df),e}getWorldScale(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(ks,ff,e),e}getWorldDirection(e){this.updateWorldMatrix(!0,!1);let t=this.matrixWorld.elements;return e.set(t[8],t[9],t[10]).normalize()}raycast(){}intersectsFrustum(){return!0}traverse(e){e(this);let t=this.children;for(let n=0,s=t.length;n<s;n++)t[n].traverse(e)}traverseVisible(e){if(this.visible===!1)return;e(this);let t=this.children;for(let n=0,s=t.length;n<s;n++)t[n].traverseVisible(e)}traverseAncestors(e){let t=this.parent;t!==null&&(e(t),t.traverseAncestors(e))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale);let e=this.pivot;if(e!==null){let t=e.x,n=e.y,s=e.z,r=this.matrix.elements;r[12]+=t-r[0]*t-r[4]*n-r[8]*s,r[13]+=n-r[1]*t-r[5]*n-r[9]*s,r[14]+=s-r[2]*t-r[6]*n-r[10]*s}this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(e){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||e)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,e=!0);let t=this.children;for(let n=0,s=t.length;n<s;n++)t[n].updateMatrixWorld(e)}updateWorldMatrix(e,t,n=!1){let s=this.parent;if(e===!0&&s!==null&&s.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||n)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,n=!0),t===!0){let r=this.children;for(let a=0,o=r.length;a<o;a++)r[a].updateWorldMatrix(!1,!0,n)}}toJSON(e){let t=e===void 0||typeof e=="string",n={};t&&(e={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},n.metadata={version:4.7,type:"Object",generator:"Object3D.toJSON"});let s={};s.uuid=this.uuid,s.type=this.type,s.name=this.name,s.castShadow=this.castShadow,s.receiveShadow=this.receiveShadow,s.visible=this.visible,s.frustumCulled=this.frustumCulled,s.renderOrder=this.renderOrder,s.static=this.static,s.matrixAutoUpdate=this.matrixAutoUpdate,Object.keys(this.userData).length>0&&(s.userData=this.userData),s.layers=this.layers.mask,s.matrix=this.matrix.toArray(),s.up=this.up.toArray(),this.pivot!==null&&(s.pivot=this.pivot.toArray()),this.morphTargetDictionary!==void 0&&(s.morphTargetDictionary=Object.assign({},this.morphTargetDictionary)),this.morphTargetInfluences!==void 0&&(s.morphTargetInfluences=this.morphTargetInfluences.slice()),this.isInstancedMesh&&(s.type="InstancedMesh",s.count=this.count,s.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(s.instanceColor=this.instanceColor.toJSON())),this.isBatchedMesh&&(s.type="BatchedMesh",s.perObjectFrustumCulled=this.perObjectFrustumCulled,s.sortObjects=this.sortObjects,s.drawRanges=this._drawRanges,s.reservedRanges=this._reservedRanges,s.geometryInfo=this._geometryInfo.map(o=>({...o,boundingBox:o.boundingBox?o.boundingBox.toJSON():void 0,boundingSphere:o.boundingSphere?o.boundingSphere.toJSON():void 0})),s.instanceInfo=this._instanceInfo.map(o=>({...o})),s.availableInstanceIds=this._availableInstanceIds.slice(),s.availableGeometryIds=this._availableGeometryIds.slice(),s.nextIndexStart=this._nextIndexStart,s.nextVertexStart=this._nextVertexStart,s.geometryCount=this._geometryCount,s.maxInstanceCount=this._maxInstanceCount,s.maxVertexCount=this._maxVertexCount,s.maxIndexCount=this._maxIndexCount,s.geometryInitialized=this._geometryInitialized,s.matricesTexture=this._matricesTexture.toJSON(e),s.indirectTexture=this._indirectTexture.toJSON(e),this._colorsTexture!==null&&(s.colorsTexture=this._colorsTexture.toJSON(e)),this.boundingSphere!==null&&(s.boundingSphere=this.boundingSphere.toJSON()),this.boundingBox!==null&&(s.boundingBox=this.boundingBox.toJSON()));function r(o,l){return o[l.uuid]===void 0&&(o[l.uuid]=l.toJSON(e)),l.uuid}if(this.isScene)this.background&&(this.background.isColor?s.background=this.background.toJSON():this.background.isTexture&&(s.background=this.background.toJSON(e).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(s.environment=this.environment.toJSON(e).uuid);else if(this.isMesh||this.isLine||this.isPoints){s.geometry=r(e.geometries,this.geometry);let o=this.geometry.parameters;if(o!==void 0&&o.shapes!==void 0){let l=o.shapes;if(Array.isArray(l))for(let c=0,h=l.length;c<h;c++){let f=l[c];r(e.shapes,f)}else r(e.shapes,l)}}if(this.isSkinnedMesh&&(s.bindMode=this.bindMode,s.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(r(e.skeletons,this.skeleton),s.skeleton=this.skeleton.uuid)),this.material!==void 0)if(Array.isArray(this.material)){let o=[];for(let l=0,c=this.material.length;l<c;l++)o.push(r(e.materials,this.material[l]));s.material=o}else s.material=r(e.materials,this.material);if(this.children.length>0){s.children=[];for(let o=0;o<this.children.length;o++)s.children.push(this.children[o].toJSON(e).object)}if(this.animations.length>0){s.animations=[];for(let o=0;o<this.animations.length;o++){let l=this.animations[o];s.animations.push(r(e.animations,l))}}if(t){let o=a(e.geometries),l=a(e.materials),c=a(e.textures),h=a(e.images),f=a(e.shapes),u=a(e.skeletons),p=a(e.animations),d=a(e.nodes);o.length>0&&(n.geometries=o),l.length>0&&(n.materials=l),c.length>0&&(n.textures=c),h.length>0&&(n.images=h),f.length>0&&(n.shapes=f),u.length>0&&(n.skeletons=u),p.length>0&&(n.animations=p),d.length>0&&(n.nodes=d)}return n.object=s,n;function a(o){let l=[];for(let c in o){let h=o[c];delete h.metadata,l.push(h)}return l}}clone(e){return new this.constructor().copy(this,e)}copy(e,t=!0){if(this.name=e.name,this.up.copy(e.up),this.position.copy(e.position),this.rotation.order=e.rotation.order,this.quaternion.copy(e.quaternion),this.scale.copy(e.scale),this.pivot=e.pivot!==null?e.pivot.clone():null,this.matrix.copy(e.matrix),this.matrixWorld.copy(e.matrixWorld),this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrixWorldAutoUpdate=e.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=e.matrixWorldNeedsUpdate,this.layers.mask=e.layers.mask,this.visible=e.visible,this.castShadow=e.castShadow,this.receiveShadow=e.receiveShadow,this.frustumCulled=e.frustumCulled,this.renderOrder=e.renderOrder,this.static=e.static,this.animations=e.animations.slice(),this.userData=JSON.parse(JSON.stringify(e.userData)),t===!0)for(let n=0;n<e.children.length;n++){let s=e.children[n];this.add(s.clone())}return this}dispose(){this.dispatchEvent({type:"dispose"})}};Sn.DEFAULT_UP=new G(0,1,0);Sn.DEFAULT_MATRIX_AUTO_UPDATE=!0;Sn.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;var Bi=class extends Sn{constructor(){super(),this.isGroup=!0,this.type="Group"}},mf={type:"move"},gs=class{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){return this._hand===null&&(this._hand=new Bi,this._hand.matrixAutoUpdate=!1,this._hand.visible=!1,this._hand.joints={},this._hand.inputState={pinching:!1}),this._hand}getTargetRaySpace(){return this._targetRay===null&&(this._targetRay=new Bi,this._targetRay.matrixAutoUpdate=!1,this._targetRay.visible=!1,this._targetRay.hasLinearVelocity=!1,this._targetRay.linearVelocity=new G,this._targetRay.hasAngularVelocity=!1,this._targetRay.angularVelocity=new G),this._targetRay}getGripSpace(){return this._grip===null&&(this._grip=new Bi,this._grip.matrixAutoUpdate=!1,this._grip.visible=!1,this._grip.hasLinearVelocity=!1,this._grip.linearVelocity=new G,this._grip.hasAngularVelocity=!1,this._grip.angularVelocity=new G,this._grip.eventsEnabled=!1),this._grip}dispatchEvent(e){return this._targetRay!==null&&this._targetRay.dispatchEvent(e),this._grip!==null&&this._grip.dispatchEvent(e),this._hand!==null&&this._hand.dispatchEvent(e),this}connect(e){if(e&&e.hand){let t=this._hand;if(t)for(let n of e.hand.values())this._getHandJoint(t,n)}return this.dispatchEvent({type:"connected",data:e}),this}disconnect(e){return this.dispatchEvent({type:"disconnected",data:e}),this._targetRay!==null&&(this._targetRay.visible=!1),this._grip!==null&&(this._grip.visible=!1),this._hand!==null&&(this._hand.visible=!1),this}update(e,t,n){let s=null,r=null,a=null,o=this._targetRay,l=this._grip,c=this._hand;if(e&&t.session.visibilityState!=="visible-blurred"){if(c&&e.hand){a=!0;for(let _ of e.hand.values()){let m=t.getJointPose(_,n),g=this._getHandJoint(c,_);m!==null&&(g.matrix.fromArray(m.transform.matrix),g.matrix.decompose(g.position,g.quaternion,g.scale),g.matrixWorldNeedsUpdate=!0,g.jointRadius=m.radius),g.visible=m!==null}let h=c.joints["index-finger-tip"],f=c.joints["thumb-tip"],u=h.position.distanceTo(f.position),p=.02,d=.005;c.inputState.pinching&&u>p+d?(c.inputState.pinching=!1,this.dispatchEvent({type:"pinchend",handedness:e.handedness,target:this})):!c.inputState.pinching&&u<=p-d&&(c.inputState.pinching=!0,this.dispatchEvent({type:"pinchstart",handedness:e.handedness,target:this}))}else l!==null&&e.gripSpace&&(r=t.getPose(e.gripSpace,n),r!==null&&(l.matrix.fromArray(r.transform.matrix),l.matrix.decompose(l.position,l.quaternion,l.scale),l.matrixWorldNeedsUpdate=!0,r.linearVelocity?(l.hasLinearVelocity=!0,l.linearVelocity.copy(r.linearVelocity)):l.hasLinearVelocity=!1,r.angularVelocity?(l.hasAngularVelocity=!0,l.angularVelocity.copy(r.angularVelocity)):l.hasAngularVelocity=!1,l.eventsEnabled&&l.dispatchEvent({type:"gripUpdated",data:e,target:this})));o!==null&&(s=t.getPose(e.targetRaySpace,n),s===null&&r!==null&&(s=r),s!==null&&(o.matrix.fromArray(s.transform.matrix),o.matrix.decompose(o.position,o.quaternion,o.scale),o.matrixWorldNeedsUpdate=!0,s.linearVelocity?(o.hasLinearVelocity=!0,o.linearVelocity.copy(s.linearVelocity)):o.hasLinearVelocity=!1,s.angularVelocity?(o.hasAngularVelocity=!0,o.angularVelocity.copy(s.angularVelocity)):o.hasAngularVelocity=!1,this.dispatchEvent(mf)))}return o!==null&&(o.visible=s!==null),l!==null&&(l.visible=r!==null),c!==null&&(c.visible=a!==null),this}_getHandJoint(e,t){if(e.joints[t.jointName]===void 0){let n=new Bi;n.matrixAutoUpdate=!1,n.visible=!1,e.joints[t.jointName]=n,e.add(n)}return e.joints[t.jointName]}},Kh={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},gi={h:0,s:0,l:0},Ur={h:0,s:0,l:0};function el(i,e,t){return t<0&&(t+=1),t>1&&(t-=1),t<1/6?i+(e-i)*6*t:t<1/2?e:t<2/3?i+(e-i)*6*(2/3-t):i}var je=class{constructor(e,t,n){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(e,t,n)}set(e,t,n){if(t===void 0&&n===void 0){let s=e;s&&s.isColor?this.copy(s):typeof s=="number"?this.setHex(s):typeof s=="string"&&this.setStyle(s)}else this.setRGB(e,t,n);return this}setScalar(e){return this.r=e,this.g=e,this.b=e,this}setHex(e,t=un){return e=Math.floor(e),this.r=(e>>16&255)/255,this.g=(e>>8&255)/255,this.b=(e&255)/255,Ze.colorSpaceToWorking(this,t),this}setRGB(e,t,n,s=Ze.workingColorSpace){return this.r=e,this.g=t,this.b=n,Ze.colorSpaceToWorking(this,s),this}setHSL(e,t,n,s=Ze.workingColorSpace){if(e=nf(e,1),t=Ke(t,0,1),n=Ke(n,0,1),t===0)this.r=this.g=this.b=n;else{let r=n<=.5?n*(1+t):n+t-n*t,a=2*n-r;this.r=el(a,r,e+1/3),this.g=el(a,r,e),this.b=el(a,r,e-1/3)}return Ze.colorSpaceToWorking(this,s),this}setStyle(e,t=un){function n(r){r!==void 0&&parseFloat(r)<1&&Le("Color: Alpha component of "+e+" will be ignored.")}let s;if(s=/^(\w+)\(([^\)]*)\)/.exec(e)){let r,a=s[1],o=s[2];switch(a){case"rgb":case"rgba":if(r=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d+(?:\.\d+)?|\.\d+)\s*)?$/.exec(o))return n(r[4]),this.setRGB(Math.min(255,parseInt(r[1],10))/255,Math.min(255,parseInt(r[2],10))/255,Math.min(255,parseInt(r[3],10))/255,t);if(r=/^\s*(\d+(?:\.\d+)?|\.\d+)\%\s*,\s*(\d+(?:\.\d+)?|\.\d+)\%\s*,\s*(\d+(?:\.\d+)?|\.\d+)\%\s*(?:,\s*(\d+(?:\.\d+)?|\.\d+)\s*)?$/.exec(o))return n(r[4]),this.setRGB(Math.min(100,parseFloat(r[1]))/100,Math.min(100,parseFloat(r[2]))/100,Math.min(100,parseFloat(r[3]))/100,t);break;case"hsl":case"hsla":if(r=/^\s*([+-]?(?:\d+(?:\.\d+)?|\.\d+))\s*,\s*(\d+(?:\.\d+)?|\.\d+)\%\s*,\s*(\d+(?:\.\d+)?|\.\d+)\%\s*(?:,\s*(\d+(?:\.\d+)?|\.\d+)\s*)?$/.exec(o))return n(r[4]),this.setHSL(parseFloat(r[1])/360,parseFloat(r[2])/100,parseFloat(r[3])/100,t);break;default:Le("Color: Unknown color model "+e)}}else if(s=/^\#([A-Fa-f\d]+)$/.exec(e)){let r=s[1],a=r.length;if(a===3)return this.setRGB(parseInt(r.charAt(0),16)/15,parseInt(r.charAt(1),16)/15,parseInt(r.charAt(2),16)/15,t);if(a===6)return this.setHex(parseInt(r,16),t);Le("Color: Invalid hex color "+e)}else if(e&&e.length>0)return this.setColorName(e,t);return this}setColorName(e,t=un){let n=Kh[e.toLowerCase()];return n!==void 0?this.setHex(n,t):Le("Color: Unknown color "+e),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(e){return this.r=e.r,this.g=e.g,this.b=e.b,this}copySRGBToLinear(e){return this.r=si(e.r),this.g=si(e.g),this.b=si(e.b),this}copyLinearToSRGB(e){return this.r=us(e.r),this.g=us(e.g),this.b=us(e.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(e=un){return Ze.workingToColorSpace($t.copy(this),e),Math.round(Ke($t.r*255,0,255))*65536+Math.round(Ke($t.g*255,0,255))*256+Math.round(Ke($t.b*255,0,255))}getHexString(e=un){return("000000"+this.getHex(e).toString(16)).slice(-6)}getHSL(e,t=Ze.workingColorSpace){Ze.workingToColorSpace($t.copy(this),t);let n=$t.r,s=$t.g,r=$t.b,a=Math.max(n,s,r),o=Math.min(n,s,r),l,c,h=(o+a)/2;if(o===a)l=0,c=0;else{let f=a-o;switch(c=h<=.5?f/(a+o):f/(2-a-o),a){case n:l=(s-r)/f+(s<r?6:0);break;case s:l=(r-n)/f+2;break;case r:l=(n-s)/f+4;break}l/=6}return e.h=l,e.s=c,e.l=h,e}getRGB(e,t=Ze.workingColorSpace){return Ze.workingToColorSpace($t.copy(this),t),e.r=$t.r,e.g=$t.g,e.b=$t.b,e}getStyle(e=un){Ze.workingToColorSpace($t.copy(this),e);let t=$t.r,n=$t.g,s=$t.b;return e!==un?`color(${e} ${t.toFixed(3)} ${n.toFixed(3)} ${s.toFixed(3)})`:`rgb(${Math.round(t*255)},${Math.round(n*255)},${Math.round(s*255)})`}offsetHSL(e,t,n){return this.getHSL(gi),this.setHSL(gi.h+e,gi.s+t,gi.l+n)}add(e){return this.r+=e.r,this.g+=e.g,this.b+=e.b,this}addColors(e,t){return this.r=e.r+t.r,this.g=e.g+t.g,this.b=e.b+t.b,this}addScalar(e){return this.r+=e,this.g+=e,this.b+=e,this}sub(e){return this.r=Math.max(0,this.r-e.r),this.g=Math.max(0,this.g-e.g),this.b=Math.max(0,this.b-e.b),this}multiply(e){return this.r*=e.r,this.g*=e.g,this.b*=e.b,this}multiplyScalar(e){return this.r*=e,this.g*=e,this.b*=e,this}lerp(e,t){return this.r+=(e.r-this.r)*t,this.g+=(e.g-this.g)*t,this.b+=(e.b-this.b)*t,this}lerpColors(e,t,n){return this.r=e.r+(t.r-e.r)*n,this.g=e.g+(t.g-e.g)*n,this.b=e.b+(t.b-e.b)*n,this}lerpHSL(e,t){this.getHSL(gi),e.getHSL(Ur);let n=Yo(gi.h,Ur.h,t),s=Yo(gi.s,Ur.s,t),r=Yo(gi.l,Ur.l,t);return this.setHSL(n,s,r),this}setFromVector3(e){return this.r=e.x,this.g=e.y,this.b=e.z,this}applyMatrix3(e){let t=this.r,n=this.g,s=this.b,r=e.elements;return this.r=r[0]*t+r[3]*n+r[6]*s,this.g=r[1]*t+r[4]*n+r[7]*s,this.b=r[2]*t+r[5]*n+r[8]*s,this}equals(e){return e.r===this.r&&e.g===this.g&&e.b===this.b}fromArray(e,t=0){return this.r=e[t],this.g=e[t+1],this.b=e[t+2],this}toArray(e=[],t=0){return e[t]=this.r,e[t+1]=this.g,e[t+2]=this.b,e}fromBufferAttribute(e,t){return this.r=e.getX(t),this.g=e.getY(t),this.b=e.getZ(t),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}},$t=new je;je.NAMES=Kh;var ai=class extends Sn{constructor(){super(),this.isScene=!0,this.type="Scene",this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.backgroundRotation=new Wn,this.environmentIntensity=1,this.environmentRotation=new Wn,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}copy(e,t){return super.copy(e,t),this.background=e.background!==null?e.background.clone():null,this.environment=e.environment!==null?e.environment.clone():null,this.fog=e.fog!==null?e.fog.clone():null,this.backgroundBlurriness=e.backgroundBlurriness,this.backgroundIntensity=e.backgroundIntensity,this.backgroundRotation.copy(e.backgroundRotation),this.environmentIntensity=e.environmentIntensity,this.environmentRotation.copy(e.environmentRotation),this.overrideMaterial=e.overrideMaterial!==null?e.overrideMaterial.clone():null,this.matrixAutoUpdate=e.matrixAutoUpdate,this}toJSON(e){let t=super.toJSON(e);return this.fog!==null&&(t.object.fog=this.fog.toJSON()),t.object.backgroundBlurriness=this.backgroundBlurriness,t.object.backgroundIntensity=this.backgroundIntensity,t.object.backgroundRotation=this.backgroundRotation.toArray(),t.object.environmentIntensity=this.environmentIntensity,t.object.environmentRotation=this.environmentRotation.toArray(),t}},In=new G,ei=new G,tl=new G,ti=new G,ns=new G,is=new G,ih=new G,nl=new G,il=new G,sl=new G,rl=new lt,al=new lt,ol=new lt,yi=class i{constructor(e=new G,t=new G,n=new G){this.a=e,this.b=t,this.c=n}static getNormal(e,t,n,s){s.subVectors(n,t),In.subVectors(e,t),s.cross(In);let r=s.lengthSq();return r>0?s.multiplyScalar(1/Math.sqrt(r)):s.set(0,0,0)}static getBarycoord(e,t,n,s,r){In.subVectors(s,t),ei.subVectors(n,t),tl.subVectors(e,t);let a=In.dot(In),o=In.dot(ei),l=In.dot(tl),c=ei.dot(ei),h=ei.dot(tl),f=a*c-o*o;if(f===0)return r.set(0,0,0),null;let u=1/f,p=(c*l-o*h)*u,d=(a*h-o*l)*u;return r.set(1-p-d,d,p)}static containsPoint(e,t,n,s){return this.getBarycoord(e,t,n,s,ti)===null?!1:ti.x>=0&&ti.y>=0&&ti.x+ti.y<=1}static getInterpolation(e,t,n,s,r,a,o,l){return this.getBarycoord(e,t,n,s,ti)===null?(l.x=0,l.y=0,"z"in l&&(l.z=0),"w"in l&&(l.w=0),null):(l.setScalar(0),l.addScaledVector(r,ti.x),l.addScaledVector(a,ti.y),l.addScaledVector(o,ti.z),l)}static getInterpolatedAttribute(e,t,n,s,r,a){return rl.setScalar(0),al.setScalar(0),ol.setScalar(0),rl.fromBufferAttribute(e,t),al.fromBufferAttribute(e,n),ol.fromBufferAttribute(e,s),a.setScalar(0),a.addScaledVector(rl,r.x),a.addScaledVector(al,r.y),a.addScaledVector(ol,r.z),a}static isFrontFacing(e,t,n,s){return In.subVectors(n,t),ei.subVectors(e,t),In.cross(ei).dot(s)<0}set(e,t,n){return this.a.copy(e),this.b.copy(t),this.c.copy(n),this}setFromPointsAndIndices(e,t,n,s){return this.a.copy(e[t]),this.b.copy(e[n]),this.c.copy(e[s]),this}setFromAttributeAndIndices(e,t,n,s){return this.a.fromBufferAttribute(e,t),this.b.fromBufferAttribute(e,n),this.c.fromBufferAttribute(e,s),this}clone(){return new this.constructor().copy(this)}copy(e){return this.a.copy(e.a),this.b.copy(e.b),this.c.copy(e.c),this}getArea(){return In.subVectors(this.c,this.b),ei.subVectors(this.a,this.b),In.cross(ei).length()*.5}getMidpoint(e){return e.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(e){return i.getNormal(this.a,this.b,this.c,e)}getPlane(e){return e.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(e,t){return i.getBarycoord(e,this.a,this.b,this.c,t)}getInterpolation(e,t,n,s,r){return i.getInterpolation(e,this.a,this.b,this.c,t,n,s,r)}containsPoint(e){return i.containsPoint(e,this.a,this.b,this.c)}isFrontFacing(e){return i.isFrontFacing(this.a,this.b,this.c,e)}intersectsBox(e){return e.intersectsTriangle(this)}closestPointToPoint(e,t){let n=this.a,s=this.b,r=this.c,a,o;ns.subVectors(s,n),is.subVectors(r,n),nl.subVectors(e,n);let l=ns.dot(nl),c=is.dot(nl);if(l<=0&&c<=0)return t.copy(n);il.subVectors(e,s);let h=ns.dot(il),f=is.dot(il);if(h>=0&&f<=h)return t.copy(s);let u=l*f-h*c;if(u<=0&&l>=0&&h<=0&&l-h>0)return a=l/(l-h),t.copy(n).addScaledVector(ns,a);sl.subVectors(e,r);let p=ns.dot(sl),d=is.dot(sl);if(d>=0&&p<=d)return t.copy(r);let _=p*c-l*d;if(_<=0&&c>=0&&d<=0)return o=c/(c-d),t.copy(n).addScaledVector(is,o);let m=h*d-p*f;if(m<=0&&f-h>=0&&p-d>=0)return ih.subVectors(r,s),o=(f-h)/(f-h+(p-d)),t.copy(s).addScaledVector(ih,o);let g=1/(m+_+u);return a=_*g,o=u*g,t.copy(n).addScaledVector(ns,a).addScaledVector(is,o)}equals(e){return e.a.equals(this.a)&&e.b.equals(this.b)&&e.c.equals(this.c)}},Mi=class{constructor(e=new G(1/0,1/0,1/0),t=new G(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=e,this.max=t}set(e,t){return this.min.copy(e),this.max.copy(t),this}setFromArray(e){this.makeEmpty();for(let t=0,n=e.length;t<n;t+=3)this.expandByPoint(Ln.fromArray(e,t));return this}setFromBufferAttribute(e){this.makeEmpty();for(let t=0,n=e.count;t<n;t++)this.expandByPoint(Ln.fromBufferAttribute(e,t));return this}setFromPoints(e){this.makeEmpty();for(let t=0,n=e.length;t<n;t++)this.expandByPoint(e[t]);return this}setFromCenterAndSize(e,t){let n=Ln.copy(t).multiplyScalar(.5);return this.min.copy(e).sub(n),this.max.copy(e).add(n),this}setFromObject(e,t=!1){return this.makeEmpty(),this.expandByObject(e,t)}clone(){return new this.constructor().copy(this)}copy(e){return this.min.copy(e.min),this.max.copy(e.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(e){return this.isEmpty()?e.set(0,0,0):e.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(e){return this.isEmpty()?e.set(0,0,0):e.subVectors(this.max,this.min)}expandByPoint(e){return this.min.min(e),this.max.max(e),this}expandByVector(e){return this.min.sub(e),this.max.add(e),this}expandByScalar(e){return this.min.addScalar(-e),this.max.addScalar(e),this}expandByObject(e,t=!1){e.updateWorldMatrix(!1,!1);let n=e.geometry;if(n!==void 0){let r=n.getAttribute("position");if(t===!0&&r!==void 0&&e.isInstancedMesh!==!0&&e.isBatchedMesh!==!0)for(let a=0,o=r.count;a<o;a++)e.isMesh===!0?e.getVertexPosition(a,Ln):Ln.fromBufferAttribute(r,a),Ln.applyMatrix4(e.matrixWorld),this.expandByPoint(Ln);else e.boundingBox!==void 0?(e.boundingBox===null&&e.computeBoundingBox(),Fr.copy(e.boundingBox)):(n.boundingBox===null&&n.computeBoundingBox(),Fr.copy(n.boundingBox)),Fr.applyMatrix4(e.matrixWorld),this.union(Fr)}let s=e.children;for(let r=0,a=s.length;r<a;r++)this.expandByObject(s[r],t);return this}containsPoint(e){return e.x>=this.min.x&&e.x<=this.max.x&&e.y>=this.min.y&&e.y<=this.max.y&&e.z>=this.min.z&&e.z<=this.max.z}containsBox(e){return this.min.x<=e.min.x&&e.max.x<=this.max.x&&this.min.y<=e.min.y&&e.max.y<=this.max.y&&this.min.z<=e.min.z&&e.max.z<=this.max.z}getParameter(e,t){return t.set((e.x-this.min.x)/(this.max.x-this.min.x),(e.y-this.min.y)/(this.max.y-this.min.y),(e.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(e){return e.max.x>=this.min.x&&e.min.x<=this.max.x&&e.max.y>=this.min.y&&e.min.y<=this.max.y&&e.max.z>=this.min.z&&e.min.z<=this.max.z}intersectsSphere(e){return this.clampPoint(e.center,Ln),Ln.distanceToSquared(e.center)<=e.radius*e.radius}intersectsPlane(e){let t,n;return e.normal.x>0?(t=e.normal.x*this.min.x,n=e.normal.x*this.max.x):(t=e.normal.x*this.max.x,n=e.normal.x*this.min.x),e.normal.y>0?(t+=e.normal.y*this.min.y,n+=e.normal.y*this.max.y):(t+=e.normal.y*this.max.y,n+=e.normal.y*this.min.y),e.normal.z>0?(t+=e.normal.z*this.min.z,n+=e.normal.z*this.max.z):(t+=e.normal.z*this.max.z,n+=e.normal.z*this.min.z),t<=-e.constant&&n>=-e.constant}intersectsTriangle(e){if(this.isEmpty())return!1;this.getCenter(zs),Or.subVectors(this.max,zs),ss.subVectors(e.a,zs),rs.subVectors(e.b,zs),as.subVectors(e.c,zs),xi.subVectors(rs,ss),vi.subVectors(as,rs),Fi.subVectors(ss,as);let t=[0,-xi.z,xi.y,0,-vi.z,vi.y,0,-Fi.z,Fi.y,xi.z,0,-xi.x,vi.z,0,-vi.x,Fi.z,0,-Fi.x,-xi.y,xi.x,0,-vi.y,vi.x,0,-Fi.y,Fi.x,0];return!ll(t,ss,rs,as,Or)||(t=[1,0,0,0,1,0,0,0,1],!ll(t,ss,rs,as,Or))?!1:(kr.crossVectors(xi,vi),t=[kr.x,kr.y,kr.z],ll(t,ss,rs,as,Or))}clampPoint(e,t){return t.copy(e).clamp(this.min,this.max)}distanceToPoint(e){return this.clampPoint(e,Ln).distanceTo(e)}getBoundingSphere(e){return this.isEmpty()?e.makeEmpty():(this.getCenter(e.center),e.radius=this.getSize(Ln).length()*.5),e}intersect(e){return this.min.max(e.min),this.max.min(e.max),this.isEmpty()&&this.makeEmpty(),this}union(e){return this.min.min(e.min),this.max.max(e.max),this}applyMatrix4(e){return this.isEmpty()?this:(ni[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(e),ni[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(e),ni[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(e),ni[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(e),ni[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(e),ni[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(e),ni[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(e),ni[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(e),this.setFromPoints(ni),this)}translate(e){return this.min.add(e),this.max.add(e),this}equals(e){return e.min.equals(this.min)&&e.max.equals(this.max)}toJSON(){return{min:this.min.toArray(),max:this.max.toArray()}}fromJSON(e){return this.min.fromArray(e.min),this.max.fromArray(e.max),this}},ni=[new G,new G,new G,new G,new G,new G,new G,new G],Ln=new G,Fr=new Mi,ss=new G,rs=new G,as=new G,xi=new G,vi=new G,Fi=new G,zs=new G,Or=new G,kr=new G,Oi=new G;function ll(i,e,t,n,s){for(let r=0,a=i.length-3;r<=a;r+=3){Oi.fromArray(i,r);let o=s.x*Math.abs(Oi.x)+s.y*Math.abs(Oi.y)+s.z*Math.abs(Oi.z),l=e.dot(Oi),c=t.dot(Oi),h=n.dot(Oi);if(Math.max(-Math.max(l,c,h),Math.min(l,c,h))>o)return!1}return!0}var Tt=new G,zr=new Xe,gf=0,Yt=class extends Hn{constructor(e,t,n=!1){if(super(),Array.isArray(e))throw new TypeError("THREE.BufferAttribute: array should be a Typed Array.");this.isBufferAttribute=!0,Object.defineProperty(this,"id",{value:gf++}),this.name="",this.array=e,this.itemSize=t,this.count=e!==void 0?e.length/t:0,this.normalized=n,this.usage=Xh,this.updateRanges=[],this.gpuType=Un,this.version=0,this._normalizationScale=e!==void 0?Yl(e):void 0}onUploadCallback(){}set needsUpdate(e){e===!0&&this.version++}setUsage(e){return this.usage=e,this}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}copy(e){return this.name=e.name,this.array=new e.array.constructor(e.array),this.itemSize=e.itemSize,this.count=e.count,this.normalized=e.normalized,this.usage=e.usage,this.gpuType=e.gpuType,this._normalizationScale=e._normalizationScale,this}copyAt(e,t,n){e*=this.itemSize,n*=t.itemSize;for(let s=0,r=this.itemSize;s<r;s++)this.array[e+s]=t.array[n+s];return this}copyArray(e){return this.array.set(e),this}applyMatrix3(e){if(this.itemSize===2)for(let t=0,n=this.count;t<n;t++)zr.fromBufferAttribute(this,t),zr.applyMatrix3(e),this.setXY(t,zr.x,zr.y);else if(this.itemSize===3)for(let t=0,n=this.count;t<n;t++)Tt.fromBufferAttribute(this,t),Tt.applyMatrix3(e),this.setXYZ(t,Tt.x,Tt.y,Tt.z);return this}applyMatrix4(e){for(let t=0,n=this.count;t<n;t++)Tt.fromBufferAttribute(this,t),Tt.applyMatrix4(e),this.setXYZ(t,Tt.x,Tt.y,Tt.z);return this}applyNormalMatrix(e){for(let t=0,n=this.count;t<n;t++)Tt.fromBufferAttribute(this,t),Tt.applyNormalMatrix(e),this.setXYZ(t,Tt.x,Tt.y,Tt.z);return this}transformDirection(e){for(let t=0,n=this.count;t<n;t++)Tt.fromBufferAttribute(this,t),Tt.transformDirection(e),this.setXYZ(t,Tt.x,Tt.y,Tt.z);return this}set(e,t=0){return this.array.set(e,t),this}getComponent(e,t){let n=this.array[e*this.itemSize+t];return this.normalized&&(n=this._denormalize(n)),n}setComponent(e,t,n){return this.normalized&&(n=this._normalize(n)),this.array[e*this.itemSize+t]=n,this}getX(e){let t=this.array[e*this.itemSize];return this.normalized&&(t=this._denormalize(t)),t}setX(e,t){return this.normalized&&(t=this._normalize(t)),this.array[e*this.itemSize]=t,this}getY(e){let t=this.array[e*this.itemSize+1];return this.normalized&&(t=this._denormalize(t)),t}setY(e,t){return this.normalized&&(t=this._normalize(t)),this.array[e*this.itemSize+1]=t,this}getZ(e){let t=this.array[e*this.itemSize+2];return this.normalized&&(t=this._denormalize(t)),t}setZ(e,t){return this.normalized&&(t=this._normalize(t)),this.array[e*this.itemSize+2]=t,this}getW(e){let t=this.array[e*this.itemSize+3];return this.normalized&&(t=this._denormalize(t)),t}setW(e,t){return this.normalized&&(t=this._normalize(t)),this.array[e*this.itemSize+3]=t,this}setXY(e,t,n){return e*=this.itemSize,this.normalized&&(t=this._normalize(t),n=this._normalize(n)),this.array[e+0]=t,this.array[e+1]=n,this}setXYZ(e,t,n,s){return e*=this.itemSize,this.normalized&&(t=this._normalize(t),n=this._normalize(n),s=this._normalize(s)),this.array[e+0]=t,this.array[e+1]=n,this.array[e+2]=s,this}setXYZW(e,t,n,s,r){return e*=this.itemSize,this.normalized&&(t=this._normalize(t),n=this._normalize(n),s=this._normalize(s),r=this._normalize(r)),this.array[e+0]=t,this.array[e+1]=n,this.array[e+2]=s,this.array[e+3]=r,this}onUpload(e){return this.onUploadCallback=e,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){let e={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return e.name=this.name,e.usage=this.usage,e.gpuType=this.gpuType,e}dispose(){this.dispatchEvent({type:"dispose"})}_denormalize(e){let t=this._normalizationScale;return t!==void 0?Math.max(e/t,-1):sf(e,this.array)}_normalize(e){let t=this._normalizationScale;return t!==void 0?Math.round(e*t):rf(e,this.array)}};var Js=class extends Yt{constructor(e,t,n){super(new Uint16Array(e),t,n)}};var Ks=class extends Yt{constructor(e,t,n){super(new Uint32Array(e),t,n)}};var Mn=class extends Yt{constructor(e,t,n){super(new Float32Array(e),t,n)}},xf=new Mi,Bs=new G,cl=new G,xs=class{constructor(e=new G,t=-1){this.isSphere=!0,this.center=e,this.radius=t}set(e,t){return this.center.copy(e),this.radius=t,this}setFromPoints(e,t){let n=this.center;t!==void 0?n.copy(t):xf.setFromPoints(e).getCenter(n);let s=0;for(let r=0,a=e.length;r<a;r++)s=Math.max(s,n.distanceToSquared(e[r]));return this.radius=Math.sqrt(s),this}copy(e){return this.center.copy(e.center),this.radius=e.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(e){return e.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(e){return e.distanceTo(this.center)-this.radius}intersectsSphere(e){let t=this.radius+e.radius;return e.center.distanceToSquared(this.center)<=t*t}intersectsBox(e){return e.intersectsSphere(this)}intersectsPlane(e){return Math.abs(e.distanceToPoint(this.center))<=this.radius}clampPoint(e,t){let n=this.center.distanceToSquared(e);return t.copy(e),n>this.radius*this.radius&&(t.sub(this.center).normalize(),t.multiplyScalar(this.radius).add(this.center)),t}getBoundingBox(e){return this.isEmpty()?(e.makeEmpty(),e):(e.set(this.center,this.center),e.expandByScalar(this.radius),e)}applyMatrix4(e){return this.center.applyMatrix4(e),this.radius=this.radius*e.getMaxScaleOnAxis(),this}translate(e){return this.center.add(e),this}expandByPoint(e){if(this.isEmpty())return this.center.copy(e),this.radius=0,this;Bs.subVectors(e,this.center);let t=Bs.lengthSq();if(t>this.radius*this.radius){let n=Math.sqrt(t),s=(n-this.radius)*.5;this.center.addScaledVector(Bs,s/n),this.radius+=s}return this}union(e){return e.isEmpty()?this:this.isEmpty()?(this.copy(e),this):(this.center.equals(e.center)===!0?this.radius=Math.max(this.radius,e.radius):(cl.subVectors(e.center,this.center).setLength(e.radius),this.expandByPoint(Bs.copy(e.center).add(cl)),this.expandByPoint(Bs.copy(e.center).sub(cl))),this)}equals(e){return e.center.equals(this.center)&&e.radius===this.radius}clone(){return new this.constructor().copy(this)}toJSON(){return{radius:this.radius,center:this.center.toArray()}}fromJSON(e){return this.radius=e.radius,this.center.fromArray(e.center),this}},vf=0,_n=new xt,hl=new Sn,os=new G,hn=new Mi,Gs=new Mi,Nt=new G,wn=class i extends Hn{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:vf++}),this.uuid=fr(),this.name="",this.type="BufferGeometry",this.index=null,this.indirect=null,this.indirectOffset=0,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={},this._transformed=!1}getIndex(){return this.index}setIndex(e){return Array.isArray(e)?this.index=new(ef(e)?Ks:Js)(e,1):this.index=e,this}setIndirect(e,t=0){return this.indirect=e,this.indirectOffset=t,this}getIndirect(){return this.indirect}getAttribute(e){return this.attributes[e]}setAttribute(e,t){return this.attributes[e]=t,this}deleteAttribute(e){return delete this.attributes[e],this}hasAttribute(e){return this.attributes[e]!==void 0}addGroup(e,t,n=0){this.groups.push({start:e,count:t,materialIndex:n})}clearGroups(){this.groups=[]}setDrawRange(e,t){this.drawRange.start=e,this.drawRange.count=t}applyMatrix4(e){let t=this.attributes.position;t!==void 0&&(t.applyMatrix4(e),t.needsUpdate=!0);let n=this.attributes.normal;if(n!==void 0){let r=new Ue().getNormalMatrix(e);n.applyNormalMatrix(r),n.needsUpdate=!0}let s=this.attributes.tangent;return s!==void 0&&(s.transformDirection(e),s.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this._transformed=!0,this}applyQuaternion(e){return _n.makeRotationFromQuaternion(e),this.applyMatrix4(_n),this}rotateX(e){return _n.makeRotationX(e),this.applyMatrix4(_n),this}rotateY(e){return _n.makeRotationY(e),this.applyMatrix4(_n),this}rotateZ(e){return _n.makeRotationZ(e),this.applyMatrix4(_n),this}translate(e,t,n){return _n.makeTranslation(e,t,n),this.applyMatrix4(_n),this}scale(e,t,n){return _n.makeScale(e,t,n),this.applyMatrix4(_n),this}lookAt(e){return hl.lookAt(e),hl.updateMatrix(),this.applyMatrix4(hl.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(os).negate(),this.translate(os.x,os.y,os.z),this}setFromPoints(e){let t=this.getAttribute("position");if(t===void 0){let n=[];for(let s=0,r=e.length;s<r;s++){let a=e[s];n.push(a.x,a.y,a.z||0)}this.setAttribute("position",new Mn(n,3))}else{let n=Math.min(e.length,t.count);for(let s=0;s<n;s++){let r=e[s];t.setXYZ(s,r.x,r.y,r.z||0)}e.length>t.count&&Le("BufferGeometry: Buffer size too small for points data. Use .dispose() and create a new geometry."),t.needsUpdate=!0}return this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new Mi);let e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){De("BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box.",this),this.boundingBox.set(new G(-1/0,-1/0,-1/0),new G(1/0,1/0,1/0));return}if(e!==void 0){if(this.boundingBox.setFromBufferAttribute(e),t)for(let n=0,s=t.length;n<s;n++){let r=t[n];hn.setFromBufferAttribute(r),this.morphTargetsRelative?(Nt.addVectors(this.boundingBox.min,hn.min),this.boundingBox.expandByPoint(Nt),Nt.addVectors(this.boundingBox.max,hn.max),this.boundingBox.expandByPoint(Nt)):(this.boundingBox.expandByPoint(hn.min),this.boundingBox.expandByPoint(hn.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&De('BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.',this)}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new xs);let e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){De("BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere.",this),this.boundingSphere.set(new G,1/0);return}if(e){let n=this.boundingSphere.center;if(hn.setFromBufferAttribute(e),t)for(let r=0,a=t.length;r<a;r++){let o=t[r];Gs.setFromBufferAttribute(o),this.morphTargetsRelative?(Nt.addVectors(hn.min,Gs.min),hn.expandByPoint(Nt),Nt.addVectors(hn.max,Gs.max),hn.expandByPoint(Nt)):(hn.expandByPoint(Gs.min),hn.expandByPoint(Gs.max))}hn.getCenter(n);let s=0;for(let r=0,a=e.count;r<a;r++)Nt.fromBufferAttribute(e,r),s=Math.max(s,n.distanceToSquared(Nt));if(t)for(let r=0,a=t.length;r<a;r++){let o=t[r],l=this.morphTargetsRelative;for(let c=0,h=o.count;c<h;c++)Nt.fromBufferAttribute(o,c),l&&(os.fromBufferAttribute(e,c),Nt.add(os)),s=Math.max(s,n.distanceToSquared(Nt))}this.boundingSphere.radius=Math.sqrt(s),isNaN(this.boundingSphere.radius)&&De('BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.',this)}}computeTangents(){let e=this.index,t=this.attributes;if(e===null||t.position===void 0||t.normal===void 0||t.uv===void 0){De("BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)");return}let n=t.position,s=t.normal,r=t.uv,a=this.getAttribute("tangent");(a===void 0||a.count!==n.count)&&(a=new Yt(new Float32Array(4*n.count),4),this.setAttribute("tangent",a));let o=[],l=[],c=new Uint8Array(n.count);for(let P=0;P<n.count;P++)o[P]=new G,l[P]=new G;let h=new G,f=new G,u=new G,p=new Xe,d=new Xe,_=new Xe,m=new G,g=new G;function y(P,R,C){c[P]=c[R]=c[C]=1,h.fromBufferAttribute(n,P),f.fromBufferAttribute(n,R),u.fromBufferAttribute(n,C),p.fromBufferAttribute(r,P),d.fromBufferAttribute(r,R),_.fromBufferAttribute(r,C),f.sub(h),u.sub(h),d.sub(p),_.sub(p);let D=1/(d.x*_.y-_.x*d.y);isFinite(D)&&(m.copy(f).multiplyScalar(_.y).addScaledVector(u,-d.y).multiplyScalar(D),g.copy(u).multiplyScalar(d.x).addScaledVector(f,-_.x).multiplyScalar(D),o[P].add(m),o[R].add(m),o[C].add(m),l[P].add(g),l[R].add(g),l[C].add(g))}let v=this.groups;v.length===0&&(v=[{start:0,count:e.count}]);for(let P=0,R=v.length;P<R;++P){let C=v[P],D=C.start,F=C.count;for(let L=D,V=D+F;L<V;L+=3)y(e.getX(L+0),e.getX(L+1),e.getX(L+2))}let M=new G,b=new G,w=new G,x=new G;function S(P){w.fromBufferAttribute(s,P),x.copy(w);let R=o[P];M.copy(R),M.sub(w.multiplyScalar(w.dot(R))).normalize(),b.crossVectors(x,R);let D=b.dot(l[P])<0?-1:1;a.setXYZW(P,M.x,M.y,M.z,D)}for(let P=0,R=n.count;P<R;++P)c[P]&&S(P);this._transformed=!0}computeVertexNormals(){let e=this.index,t=this.getAttribute("position");if(t!==void 0){let n=this.getAttribute("normal");if(n===void 0||n.count!==t.count)n=new Yt(new Float32Array(t.count*3),3),this.setAttribute("normal",n);else for(let u=0,p=n.count;u<p;u++)n.setXYZ(u,0,0,0);let s=new G,r=new G,a=new G,o=new G,l=new G,c=new G,h=new G,f=new G;if(e)for(let u=0,p=e.count;u<p;u+=3){let d=e.getX(u+0),_=e.getX(u+1),m=e.getX(u+2);s.fromBufferAttribute(t,d),r.fromBufferAttribute(t,_),a.fromBufferAttribute(t,m),h.subVectors(a,r),f.subVectors(s,r),h.cross(f),o.fromBufferAttribute(n,d),l.fromBufferAttribute(n,_),c.fromBufferAttribute(n,m),o.add(h),l.add(h),c.add(h),n.setXYZ(d,o.x,o.y,o.z),n.setXYZ(_,l.x,l.y,l.z),n.setXYZ(m,c.x,c.y,c.z)}else for(let u=0,p=t.count;u<p;u+=3)s.fromBufferAttribute(t,u+0),r.fromBufferAttribute(t,u+1),a.fromBufferAttribute(t,u+2),h.subVectors(a,r),f.subVectors(s,r),h.cross(f),n.setXYZ(u+0,h.x,h.y,h.z),n.setXYZ(u+1,h.x,h.y,h.z),n.setXYZ(u+2,h.x,h.y,h.z);this.normalizeNormals(),n.needsUpdate=!0}}normalizeNormals(){let e=this.attributes.normal;for(let t=0,n=e.count;t<n;t++)Nt.fromBufferAttribute(e,t),Nt.normalize(),e.setXYZ(t,Nt.x,Nt.y,Nt.z)}toNonIndexed(){function e(o,l){let c=o.array,h=o.itemSize,f=o.normalized,u=new c.constructor(l.length*h),p=0,d=0;for(let _=0,m=l.length;_<m;_++){o.isInterleavedBufferAttribute?p=l[_]*o.data.stride+o.offset:p=l[_]*h;for(let g=0;g<h;g++)u[d++]=c[p++]}return new Yt(u,h,f)}if(this.index===null)return Le("BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed."),this;let t=new i,n=this.index.array,s=this.attributes;for(let o in s){let l=s[o],c=e(l,n);t.setAttribute(o,c)}let r=this.morphAttributes;for(let o in r){let l=[],c=r[o];for(let h=0,f=c.length;h<f;h++){let u=c[h],p=e(u,n);l.push(p)}t.morphAttributes[o]=l}t.morphTargetsRelative=this.morphTargetsRelative;let a=this.groups;for(let o=0,l=a.length;o<l;o++){let c=a[o];t.addGroup(c.start,c.count,c.materialIndex)}return t}toJSON(){let e={metadata:{version:4.7,type:"BufferGeometry",generator:"BufferGeometry.toJSON"}};if(e.uuid=this.uuid,e.type=this.parameters!==void 0&&this._transformed===!0?"BufferGeometry":this.type,e.name=this.name,Object.keys(this.userData).length>0&&(e.userData=this.userData),this.parameters!==void 0&&this._transformed!==!0){let l=this.parameters;for(let c in l)l[c]!==void 0&&(e[c]=l[c]);return e}e.data={attributes:{}};let t=this.index;t!==null&&(e.data.index={type:t.array.constructor.name,array:Array.prototype.slice.call(t.array)});let n=this.attributes;for(let l in n){let c=n[l];e.data.attributes[l]=c.toJSON(e.data)}let s={},r=!1;for(let l in this.morphAttributes){let c=this.morphAttributes[l],h=[];for(let f=0,u=c.length;f<u;f++){let p=c[f];h.push(p.toJSON(e.data))}h.length>0&&(s[l]=h,r=!0)}r&&(e.data.morphAttributes=s,e.data.morphTargetsRelative=this.morphTargetsRelative);let a=this.groups;a.length>0&&(e.data.groups=JSON.parse(JSON.stringify(a)));let o=this.boundingSphere;return o!==null&&(e.data.boundingSphere=o.toJSON()),e}clone(){return new this.constructor().copy(this)}copy(e){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;let t={};this.name=e.name;let n=e.index;n!==null&&this.setIndex(n.clone());let s=e.attributes;for(let c in s){let h=s[c];this.setAttribute(c,h.clone(t))}let r=e.morphAttributes;for(let c in r){let h=[],f=r[c];for(let u=0,p=f.length;u<p;u++)h.push(f[u].clone(t));this.morphAttributes[c]=h}this.morphTargetsRelative=e.morphTargetsRelative;let a=e.groups;for(let c=0,h=a.length;c<h;c++){let f=a[c];this.addGroup(f.start,f.count,f.materialIndex)}let o=e.boundingBox;o!==null&&(this.boundingBox=o.clone());let l=e.boundingSphere;return l!==null&&(this.boundingSphere=l.clone()),this.drawRange.start=e.drawRange.start,this.drawRange.count=e.drawRange.count,this.userData=e.userData,this._transformed=e._transformed,this}dispose(){this.dispatchEvent({type:"dispose"})}};var ul=new G,_f=new G,yf=new Ue,Dn=class{constructor(e=new G(1,0,0),t=0){this.isPlane=!0,this.normal=e,this.constant=t}set(e,t){return this.normal.copy(e),this.constant=t,this}setComponents(e,t,n,s){return this.normal.set(e,t,n),this.constant=s,this}setFromNormalAndCoplanarPoint(e,t){return this.normal.copy(e),this.constant=-t.dot(this.normal),this}setFromCoplanarPoints(e,t,n){let s=ul.subVectors(n,t).cross(_f.subVectors(e,t)).normalize();return this.setFromNormalAndCoplanarPoint(s,e),this}copy(e){return this.normal.copy(e.normal),this.constant=e.constant,this}normalize(){let e=1/this.normal.length();return this.normal.multiplyScalar(e),this.constant*=e,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(e){return this.normal.dot(e)+this.constant}distanceToSphere(e){return this.distanceToPoint(e.center)-e.radius}projectPoint(e,t){return t.copy(e).addScaledVector(this.normal,-this.distanceToPoint(e))}intersectLine(e,t,n=!0){let s=e.delta(ul),r=this.normal.dot(s);if(r===0)return this.distanceToPoint(e.start)===0?t.copy(e.start):null;let a=-(e.start.dot(this.normal)+this.constant)/r;return n===!0&&(a<0||a>1)?null:t.copy(e.start).addScaledVector(s,a)}intersectsLine(e){let t=this.distanceToPoint(e.start),n=this.distanceToPoint(e.end);return t<0&&n>0||n<0&&t>0}intersectsBox(e){return e.intersectsPlane(this)}intersectsSphere(e){return e.intersectsPlane(this)}coplanarPoint(e){return e.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(e,t){let n=t||yf.getNormalMatrix(e),s=this.coplanarPoint(ul).applyMatrix4(e),r=this.normal.applyMatrix3(n).normalize();return this.constant=-s.dot(r),this}translate(e){return this.constant-=e.dot(this.normal),this}equals(e){return e.normal.equals(this.normal)&&e.constant===this.constant}clone(){return new this.constructor().copy(this)}toJSON(){return{normal:this.normal.toArray(),constant:this.constant}}fromJSON(e){return this.normal.fromArray(e.normal),this.constant=e.constant,this}},Mf=0,Gi=class extends Hn{constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:Mf++}),this.uuid=fr(),this.name="",this.type="Material",this.blending=bs,this.side=Ti,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=Sl,this.blendDst=wl,this.blendEquation=Xi,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new je(0,0,0),this.blendAlpha=0,this.depthFunc=ds,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=zh,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=ea,this.stencilZFail=ea,this.stencilZPass=ea,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.allowOverride=!0,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(e){this._alphaTest>0!=e>0&&this.version++,this._alphaTest=e}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(e){if(e!==void 0)for(let t in e){let n=e[t];if(n===void 0){Le(`Material: parameter '${t}' has value of undefined.`);continue}let s=this[t];if(s===void 0){Le(`Material: '${t}' is not a property of THREE.${this.type}.`);continue}s&&s.isColor?s.set(n):s&&s.isVector2&&n&&n.isVector2||s&&s.isEuler&&n&&n.isEuler||s&&s.isVector3&&n&&n.isVector3?s.copy(n):this[t]=n}}toJSON(e){let t=e===void 0||typeof e=="string";t&&(e={textures:{},images:{}});let n={metadata:{version:4.7,type:"Material",generator:"Material.toJSON"}};n.uuid=this.uuid,n.type=this.type,n.blending=this.blending,n.side=this.side,n.shadowSide=this.shadowSide,n.vertexColors=this.vertexColors,n.opacity=this.opacity,n.transparent=this.transparent,n.blendSrc=this.blendSrc,n.blendDst=this.blendDst,n.blendEquation=this.blendEquation,n.blendSrcAlpha=this.blendSrcAlpha,n.blendDstAlpha=this.blendDstAlpha,n.blendEquationAlpha=this.blendEquationAlpha,n.blendColor=this.blendColor.getHex(),n.blendAlpha=this.blendAlpha,n.depthFunc=this.depthFunc,n.depthTest=this.depthTest,n.depthWrite=this.depthWrite,n.colorWrite=this.colorWrite,n.clipIntersection=this.clipIntersection,n.clipShadows=this.clipShadows,n.stencilWriteMask=this.stencilWriteMask,n.stencilFunc=this.stencilFunc,n.stencilRef=this.stencilRef,n.stencilFuncMask=this.stencilFuncMask,n.stencilFail=this.stencilFail,n.stencilZFail=this.stencilZFail,n.stencilZPass=this.stencilZPass,n.stencilWrite=this.stencilWrite,n.polygonOffset=this.polygonOffset,n.polygonOffsetFactor=this.polygonOffsetFactor,n.polygonOffsetUnits=this.polygonOffsetUnits,n.dithering=this.dithering,n.alphaTest=this.alphaTest,n.alphaHash=this.alphaHash,n.alphaToCoverage=this.alphaToCoverage,n.premultipliedAlpha=this.premultipliedAlpha,n.forceSinglePass=this.forceSinglePass,n.allowOverride=this.allowOverride,n.visible=this.visible,n.toneMapped=this.toneMapped,n.name=this.name,this.color&&this.color.isColor&&(n.color=this.color.getHex()),this.roughness!==void 0&&(n.roughness=this.roughness),this.metalness!==void 0&&(n.metalness=this.metalness),this.sheen!==void 0&&(n.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(n.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(n.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(n.emissive=this.emissive.getHex()),this.emissiveIntensity!==void 0&&(n.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(n.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(n.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(n.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(n.shininess=this.shininess),this.clearcoat!==void 0&&(n.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(n.clearcoatRoughness=this.clearcoatRoughness),this.diffuseRoughness!==void 0&&(n.diffuseRoughness=this.diffuseRoughness),this.diffuseRoughnessMap&&this.diffuseRoughnessMap.isTexture&&(n.diffuseRoughnessMap=this.diffuseRoughnessMap.toJSON(e).uuid),this.clearcoatMap&&this.clearcoatMap.isTexture&&(n.clearcoatMap=this.clearcoatMap.toJSON(e).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(n.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(e).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(n.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(e).uuid,n.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.sheenColorMap&&this.sheenColorMap.isTexture&&(n.sheenColorMap=this.sheenColorMap.toJSON(e).uuid),this.sheenRoughnessMap&&this.sheenRoughnessMap.isTexture&&(n.sheenRoughnessMap=this.sheenRoughnessMap.toJSON(e).uuid),this.dispersion!==void 0&&(n.dispersion=this.dispersion),this.retroreflectivity!==void 0&&(n.retroreflectivity=this.retroreflectivity),this.iridescence!==void 0&&(n.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(n.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessMinimum!==void 0&&(n.iridescenceThicknessMinimum=this.iridescenceThicknessMinimum),this.iridescenceThicknessMaximum!==void 0&&(n.iridescenceThicknessMaximum=this.iridescenceThicknessMaximum),this.iridescenceMap&&this.iridescenceMap.isTexture&&(n.iridescenceMap=this.iridescenceMap.toJSON(e).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(n.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(e).uuid),this.anisotropy!==void 0&&(n.anisotropy=this.anisotropy),this.anisotropyRotation!==void 0&&(n.anisotropyRotation=this.anisotropyRotation),this.anisotropyMap&&this.anisotropyMap.isTexture&&(n.anisotropyMap=this.anisotropyMap.toJSON(e).uuid),this.map&&this.map.isTexture&&(n.map=this.map.toJSON(e).uuid),this.matcap&&this.matcap.isTexture&&(n.matcap=this.matcap.toJSON(e).uuid),this.alphaMap&&this.alphaMap.isTexture&&(n.alphaMap=this.alphaMap.toJSON(e).uuid),this.lightMap&&this.lightMap.isTexture&&(n.lightMap=this.lightMap.toJSON(e).uuid,n.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(n.aoMap=this.aoMap.toJSON(e).uuid,n.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(n.bumpMap=this.bumpMap.toJSON(e).uuid,n.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(n.normalMap=this.normalMap.toJSON(e).uuid,n.normalMapType=this.normalMapType,n.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(n.displacementMap=this.displacementMap.toJSON(e).uuid,n.displacementScale=this.displacementScale,n.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(n.roughnessMap=this.roughnessMap.toJSON(e).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(n.metalnessMap=this.metalnessMap.toJSON(e).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(n.emissiveMap=this.emissiveMap.toJSON(e).uuid),this.specularMap&&this.specularMap.isTexture&&(n.specularMap=this.specularMap.toJSON(e).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(n.specularIntensityMap=this.specularIntensityMap.toJSON(e).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(n.specularColorMap=this.specularColorMap.toJSON(e).uuid),this.envMap&&this.envMap.isTexture&&(n.envMap=this.envMap.toJSON(e).uuid,this.combine!==void 0&&(n.combine=this.combine)),this.envMapRotation!==void 0&&(n.envMapRotation=this.envMapRotation.toArray()),this.envMapIntensity!==void 0&&(n.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(n.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(n.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(n.gradientMap=this.gradientMap.toJSON(e).uuid),this.transmission!==void 0&&(n.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(n.transmissionMap=this.transmissionMap.toJSON(e).uuid),this.thickness!==void 0&&(n.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(n.thicknessMap=this.thicknessMap.toJSON(e).uuid),this.attenuationDistance!==void 0&&(n.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(n.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(n.size=this.size),this.sizeAttenuation!==void 0&&(n.sizeAttenuation=this.sizeAttenuation),Array.isArray(this.clippingPlanes)&&this.clippingPlanes.length>0&&(n.clippingPlanes=this.clippingPlanes.map(r=>r.toJSON())),this.rotation!==void 0&&(n.rotation=this.rotation),this.depthPacking!==void 0&&(n.depthPacking=this.depthPacking),this.linewidth!==void 0&&(n.linewidth=this.linewidth),this.linecap!==void 0&&(n.linecap=this.linecap),this.linejoin!==void 0&&(n.linejoin=this.linejoin),this.dashSize!==void 0&&(n.dashSize=this.dashSize),this.gapSize!==void 0&&(n.gapSize=this.gapSize),this.scale!==void 0&&(n.scale=this.scale),this.wireframe!==void 0&&(n.wireframe=this.wireframe),this.wireframeLinewidth!==void 0&&(n.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!==void 0&&(n.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!==void 0&&(n.wireframeLinejoin=this.wireframeLinejoin),this.flatShading!==void 0&&(n.flatShading=this.flatShading),this.fog!==void 0&&(n.fog=this.fog),Object.keys(this.userData).length>0&&(n.userData=this.userData);function s(r){let a=[];for(let o in r){let l=r[o];delete l.metadata,a.push(l)}return a}if(t){let r=s(e.textures),a=s(e.images);r.length>0&&(n.textures=r),a.length>0&&(n.images=a)}return n}fromJSON(e,t){if(e.uuid!==void 0&&(this.uuid=e.uuid),e.name!==void 0&&(this.name=e.name),e.color!==void 0&&this.color!==void 0&&this.color.setHex(e.color),e.roughness!==void 0&&(this.roughness=e.roughness),e.metalness!==void 0&&(this.metalness=e.metalness),e.sheen!==void 0&&(this.sheen=e.sheen),e.sheenColor!==void 0&&(this.sheenColor=new je().setHex(e.sheenColor)),e.sheenRoughness!==void 0&&(this.sheenRoughness=e.sheenRoughness),e.emissive!==void 0&&this.emissive!==void 0&&this.emissive.setHex(e.emissive),e.specular!==void 0&&this.specular!==void 0&&this.specular.setHex(e.specular),e.specularIntensity!==void 0&&(this.specularIntensity=e.specularIntensity),e.specularColor!==void 0&&this.specularColor!==void 0&&this.specularColor.setHex(e.specularColor),e.shininess!==void 0&&(this.shininess=e.shininess),e.clearcoat!==void 0&&(this.clearcoat=e.clearcoat),e.clearcoatRoughness!==void 0&&(this.clearcoatRoughness=e.clearcoatRoughness),e.diffuseRoughness!==void 0&&(this.diffuseRoughness=e.diffuseRoughness),e.dispersion!==void 0&&(this.dispersion=e.dispersion),e.retroreflectivity!==void 0&&(this.retroreflectivity=e.retroreflectivity),e.iridescence!==void 0&&(this.iridescence=e.iridescence),e.iridescenceIOR!==void 0&&(this.iridescenceIOR=e.iridescenceIOR),e.iridescenceThicknessMinimum!==void 0&&(this.iridescenceThicknessMinimum=e.iridescenceThicknessMinimum),e.iridescenceThicknessMaximum!==void 0&&(this.iridescenceThicknessMaximum=e.iridescenceThicknessMaximum),e.iridescenceThicknessRange!==void 0&&(this.iridescenceThicknessMinimum=e.iridescenceThicknessRange[0],this.iridescenceThicknessMaximum=e.iridescenceThicknessRange[1]),e.transmission!==void 0&&(this.transmission=e.transmission),e.thickness!==void 0&&(this.thickness=e.thickness),e.attenuationDistance!==void 0&&(this.attenuationDistance=e.attenuationDistance),e.attenuationColor!==void 0&&this.attenuationColor!==void 0&&this.attenuationColor.setHex(e.attenuationColor),e.anisotropy!==void 0&&(this.anisotropy=e.anisotropy),e.anisotropyRotation!==void 0&&(this.anisotropyRotation=e.anisotropyRotation),e.fog!==void 0&&(this.fog=e.fog),e.flatShading!==void 0&&(this.flatShading=e.flatShading),e.blending!==void 0&&(this.blending=e.blending),e.combine!==void 0&&(this.combine=e.combine),e.side!==void 0&&(this.side=e.side),e.shadowSide!==void 0&&(this.shadowSide=e.shadowSide),e.opacity!==void 0&&(this.opacity=e.opacity),e.transparent!==void 0&&(this.transparent=e.transparent),e.alphaTest!==void 0&&(this.alphaTest=e.alphaTest),e.alphaHash!==void 0&&(this.alphaHash=e.alphaHash),e.depthFunc!==void 0&&(this.depthFunc=e.depthFunc),e.depthTest!==void 0&&(this.depthTest=e.depthTest),e.depthWrite!==void 0&&(this.depthWrite=e.depthWrite),e.colorWrite!==void 0&&(this.colorWrite=e.colorWrite),e.clippingPlanes!==void 0&&(this.clippingPlanes=e.clippingPlanes.map(n=>new Dn().fromJSON(n))),e.clipIntersection!==void 0&&(this.clipIntersection=e.clipIntersection),e.clipShadows!==void 0&&(this.clipShadows=e.clipShadows),e.depthPacking!==void 0&&(this.depthPacking=e.depthPacking),e.blendSrc!==void 0&&(this.blendSrc=e.blendSrc),e.blendDst!==void 0&&(this.blendDst=e.blendDst),e.blendEquation!==void 0&&(this.blendEquation=e.blendEquation),e.blendSrcAlpha!==void 0&&(this.blendSrcAlpha=e.blendSrcAlpha),e.blendDstAlpha!==void 0&&(this.blendDstAlpha=e.blendDstAlpha),e.blendEquationAlpha!==void 0&&(this.blendEquationAlpha=e.blendEquationAlpha),e.blendColor!==void 0&&this.blendColor!==void 0&&this.blendColor.setHex(e.blendColor),e.blendAlpha!==void 0&&(this.blendAlpha=e.blendAlpha),e.stencilWriteMask!==void 0&&(this.stencilWriteMask=e.stencilWriteMask),e.stencilFunc!==void 0&&(this.stencilFunc=e.stencilFunc),e.stencilRef!==void 0&&(this.stencilRef=e.stencilRef),e.stencilFuncMask!==void 0&&(this.stencilFuncMask=e.stencilFuncMask),e.stencilFail!==void 0&&(this.stencilFail=e.stencilFail),e.stencilZFail!==void 0&&(this.stencilZFail=e.stencilZFail),e.stencilZPass!==void 0&&(this.stencilZPass=e.stencilZPass),e.stencilWrite!==void 0&&(this.stencilWrite=e.stencilWrite),e.wireframe!==void 0&&(this.wireframe=e.wireframe),e.wireframeLinewidth!==void 0&&(this.wireframeLinewidth=e.wireframeLinewidth),e.wireframeLinecap!==void 0&&(this.wireframeLinecap=e.wireframeLinecap),e.wireframeLinejoin!==void 0&&(this.wireframeLinejoin=e.wireframeLinejoin),e.rotation!==void 0&&(this.rotation=e.rotation),e.linewidth!==void 0&&(this.linewidth=e.linewidth),e.linecap!==void 0&&(this.linecap=e.linecap),e.linejoin!==void 0&&(this.linejoin=e.linejoin),e.dashSize!==void 0&&(this.dashSize=e.dashSize),e.gapSize!==void 0&&(this.gapSize=e.gapSize),e.scale!==void 0&&(this.scale=e.scale),e.polygonOffset!==void 0&&(this.polygonOffset=e.polygonOffset),e.polygonOffsetFactor!==void 0&&(this.polygonOffsetFactor=e.polygonOffsetFactor),e.polygonOffsetUnits!==void 0&&(this.polygonOffsetUnits=e.polygonOffsetUnits),e.dithering!==void 0&&(this.dithering=e.dithering),e.alphaToCoverage!==void 0&&(this.alphaToCoverage=e.alphaToCoverage),e.premultipliedAlpha!==void 0&&(this.premultipliedAlpha=e.premultipliedAlpha),e.forceSinglePass!==void 0&&(this.forceSinglePass=e.forceSinglePass),e.allowOverride!==void 0&&(this.allowOverride=e.allowOverride),e.visible!==void 0&&(this.visible=e.visible),e.toneMapped!==void 0&&(this.toneMapped=e.toneMapped),e.userData!==void 0&&(this.userData=e.userData),e.vertexColors!==void 0&&(typeof e.vertexColors=="number"?this.vertexColors=e.vertexColors>0:this.vertexColors=e.vertexColors),e.size!==void 0&&(this.size=e.size),e.sizeAttenuation!==void 0&&(this.sizeAttenuation=e.sizeAttenuation),e.map!==void 0&&(this.map=t[e.map]||null),e.matcap!==void 0&&(this.matcap=t[e.matcap]||null),e.alphaMap!==void 0&&(this.alphaMap=t[e.alphaMap]||null),e.bumpMap!==void 0&&(this.bumpMap=t[e.bumpMap]||null),e.bumpScale!==void 0&&(this.bumpScale=e.bumpScale),e.normalMap!==void 0&&(this.normalMap=t[e.normalMap]||null),e.normalMapType!==void 0&&(this.normalMapType=e.normalMapType),e.normalScale!==void 0){let n=e.normalScale;Array.isArray(n)===!1&&(n=[n,n]),this.normalScale=new Xe().fromArray(n)}return e.displacementMap!==void 0&&(this.displacementMap=t[e.displacementMap]||null),e.displacementScale!==void 0&&(this.displacementScale=e.displacementScale),e.displacementBias!==void 0&&(this.displacementBias=e.displacementBias),e.roughnessMap!==void 0&&(this.roughnessMap=t[e.roughnessMap]||null),e.metalnessMap!==void 0&&(this.metalnessMap=t[e.metalnessMap]||null),e.emissiveMap!==void 0&&(this.emissiveMap=t[e.emissiveMap]||null),e.emissiveIntensity!==void 0&&(this.emissiveIntensity=e.emissiveIntensity),e.specularMap!==void 0&&(this.specularMap=t[e.specularMap]||null),e.specularIntensityMap!==void 0&&(this.specularIntensityMap=t[e.specularIntensityMap]||null),e.specularColorMap!==void 0&&(this.specularColorMap=t[e.specularColorMap]||null),e.envMap!==void 0&&(this.envMap=t[e.envMap]||null),e.envMapRotation!==void 0&&this.envMapRotation.fromArray(e.envMapRotation),e.envMapIntensity!==void 0&&(this.envMapIntensity=e.envMapIntensity),e.reflectivity!==void 0&&(this.reflectivity=e.reflectivity),e.refractionRatio!==void 0&&(this.refractionRatio=e.refractionRatio),e.lightMap!==void 0&&(this.lightMap=t[e.lightMap]||null),e.lightMapIntensity!==void 0&&(this.lightMapIntensity=e.lightMapIntensity),e.aoMap!==void 0&&(this.aoMap=t[e.aoMap]||null),e.aoMapIntensity!==void 0&&(this.aoMapIntensity=e.aoMapIntensity),e.gradientMap!==void 0&&(this.gradientMap=t[e.gradientMap]||null),e.clearcoatMap!==void 0&&(this.clearcoatMap=t[e.clearcoatMap]||null),e.clearcoatRoughnessMap!==void 0&&(this.clearcoatRoughnessMap=t[e.clearcoatRoughnessMap]||null),e.clearcoatNormalMap!==void 0&&(this.clearcoatNormalMap=t[e.clearcoatNormalMap]||null),e.clearcoatNormalScale!==void 0&&(this.clearcoatNormalScale=new Xe().fromArray(e.clearcoatNormalScale)),e.diffuseRoughnessMap!==void 0&&(this.diffuseRoughnessMap=t[e.diffuseRoughnessMap]||null),e.iridescenceMap!==void 0&&(this.iridescenceMap=t[e.iridescenceMap]||null),e.iridescenceThicknessMap!==void 0&&(this.iridescenceThicknessMap=t[e.iridescenceThicknessMap]||null),e.transmissionMap!==void 0&&(this.transmissionMap=t[e.transmissionMap]||null),e.thicknessMap!==void 0&&(this.thicknessMap=t[e.thicknessMap]||null),e.anisotropyMap!==void 0&&(this.anisotropyMap=t[e.anisotropyMap]||null),e.sheenColorMap!==void 0&&(this.sheenColorMap=t[e.sheenColorMap]||null),e.sheenRoughnessMap!==void 0&&(this.sheenRoughnessMap=t[e.sheenRoughnessMap]||null),this}clone(){return new this.constructor().copy(this)}copy(e){this.name=e.name,this.blending=e.blending,this.side=e.side,this.vertexColors=e.vertexColors,this.opacity=e.opacity,this.transparent=e.transparent,this.blendSrc=e.blendSrc,this.blendDst=e.blendDst,this.blendEquation=e.blendEquation,this.blendSrcAlpha=e.blendSrcAlpha,this.blendDstAlpha=e.blendDstAlpha,this.blendEquationAlpha=e.blendEquationAlpha,this.blendColor.copy(e.blendColor),this.blendAlpha=e.blendAlpha,this.depthFunc=e.depthFunc,this.depthTest=e.depthTest,this.depthWrite=e.depthWrite,this.stencilWriteMask=e.stencilWriteMask,this.stencilFunc=e.stencilFunc,this.stencilRef=e.stencilRef,this.stencilFuncMask=e.stencilFuncMask,this.stencilFail=e.stencilFail,this.stencilZFail=e.stencilZFail,this.stencilZPass=e.stencilZPass,this.stencilWrite=e.stencilWrite;let t=e.clippingPlanes,n=null;if(t!==null){let s=t.length;n=new Array(s);for(let r=0;r!==s;++r)n[r]=t[r].clone()}return this.clippingPlanes=n,this.clipIntersection=e.clipIntersection,this.clipShadows=e.clipShadows,this.shadowSide=e.shadowSide,this.colorWrite=e.colorWrite,this.precision=e.precision,this.polygonOffset=e.polygonOffset,this.polygonOffsetFactor=e.polygonOffsetFactor,this.polygonOffsetUnits=e.polygonOffsetUnits,this.dithering=e.dithering,this.alphaTest=e.alphaTest,this.alphaHash=e.alphaHash,this.alphaToCoverage=e.alphaToCoverage,this.premultipliedAlpha=e.premultipliedAlpha,this.forceSinglePass=e.forceSinglePass,this.allowOverride=e.allowOverride,this.visible=e.visible,this.toneMapped=e.toneMapped,this.userData=JSON.parse(JSON.stringify(e.userData)),this}dispose(){this.dispatchEvent({type:"dispose"})}set needsUpdate(e){e===!0&&this.version++}};var ii=new G,dl=new G,Br=new G,Gr=new G,pa=class{constructor(e=new G,t=new G(0,0,-1)){this.origin=e,this.direction=t}set(e,t){return this.origin.copy(e),this.direction.copy(t),this}copy(e){return this.origin.copy(e.origin),this.direction.copy(e.direction),this}at(e,t){return t.copy(this.origin).addScaledVector(this.direction,e)}lookAt(e){return this.direction.copy(e).sub(this.origin).normalize(),this}recast(e){return this.origin.copy(this.at(e,ii)),this}closestPointToPoint(e,t){t.subVectors(e,this.origin);let n=t.dot(this.direction);return n<0?t.copy(this.origin):t.copy(this.origin).addScaledVector(this.direction,n)}distanceToPoint(e){return Math.sqrt(this.distanceSqToPoint(e))}distanceSqToPoint(e){let t=ii.subVectors(e,this.origin).dot(this.direction);return t<0?this.origin.distanceToSquared(e):(ii.copy(this.origin).addScaledVector(this.direction,t),ii.distanceToSquared(e))}distanceSqToSegment(e,t,n,s){dl.copy(e).add(t).multiplyScalar(.5),Br.copy(t).sub(e).normalize(),Gr.copy(this.origin).sub(dl);let r=e.distanceTo(t)*.5,a=-this.direction.dot(Br),o=Gr.dot(this.direction),l=-Gr.dot(Br),c=Gr.lengthSq(),h=Math.abs(1-a*a),f,u,p,d;if(h>0)if(f=a*l-o,u=a*o-l,d=r*h,f>=0)if(u>=-d)if(u<=d){let _=1/h;f*=_,u*=_,p=f*(f+a*u+2*o)+u*(a*f+u+2*l)+c}else u=r,f=Math.max(0,-(a*u+o)),p=-f*f+u*(u+2*l)+c;else u=-r,f=Math.max(0,-(a*u+o)),p=-f*f+u*(u+2*l)+c;else u<=-d?(f=Math.max(0,-(-a*r+o)),u=f>0?-r:Math.min(Math.max(-r,-l),r),p=-f*f+u*(u+2*l)+c):u<=d?(f=0,u=Math.min(Math.max(-r,-l),r),p=u*(u+2*l)+c):(f=Math.max(0,-(a*r+o)),u=f>0?r:Math.min(Math.max(-r,-l),r),p=-f*f+u*(u+2*l)+c);else u=a>0?-r:r,f=Math.max(0,-(a*u+o)),p=-f*f+u*(u+2*l)+c;return n&&n.copy(this.origin).addScaledVector(this.direction,f),s&&s.copy(dl).addScaledVector(Br,u),p}intersectSphere(e,t){if(e.radius<0)return null;ii.subVectors(e.center,this.origin);let n=ii.dot(this.direction),s=ii.dot(ii)-n*n,r=e.radius*e.radius;if(s>r)return null;let a=Math.sqrt(r-s),o=n-a,l=n+a;return l<0?null:o<0?this.at(l,t):this.at(o,t)}intersectsSphere(e){return e.radius<0?!1:this.distanceSqToPoint(e.center)<=e.radius*e.radius}distanceToPlane(e){let t=e.normal.dot(this.direction);if(t===0)return e.distanceToPoint(this.origin)===0?0:null;let n=-(this.origin.dot(e.normal)+e.constant)/t;return n>=0?n:null}intersectPlane(e,t){let n=this.distanceToPlane(e);return n===null?null:this.at(n,t)}intersectsPlane(e){let t=e.distanceToPoint(this.origin);return t===0||e.normal.dot(this.direction)*t<0}intersectBox(e,t){let n,s,r,a,o,l,c=1/this.direction.x,h=1/this.direction.y,f=1/this.direction.z,u=this.origin;return c>=0?(n=(e.min.x-u.x)*c,s=(e.max.x-u.x)*c):(n=(e.max.x-u.x)*c,s=(e.min.x-u.x)*c),h>=0?(r=(e.min.y-u.y)*h,a=(e.max.y-u.y)*h):(r=(e.max.y-u.y)*h,a=(e.min.y-u.y)*h),n>a||r>s||((r>n||isNaN(n))&&(n=r),(a<s||isNaN(s))&&(s=a),f>=0?(o=(e.min.z-u.z)*f,l=(e.max.z-u.z)*f):(o=(e.max.z-u.z)*f,l=(e.min.z-u.z)*f),n>l||o>s)||((o>n||n!==n)&&(n=o),(l<s||s!==s)&&(s=l),s<0)?null:this.at(n>=0?n:s,t)}intersectsBox(e){return this.intersectBox(e,ii)!==null}intersectTriangle(e,t,n,s,r){let a=this.origin,o=this.direction,l=o.x,c=o.y,h=o.z,f=e.x-a.x,u=e.y-a.y,p=e.z-a.z,d=t.x-a.x,_=t.y-a.y,m=t.z-a.z,g=n.x-a.x,y=n.y-a.y,v=n.z-a.z,M=Math.abs(l),b=Math.abs(c),w=Math.abs(h),x,S,P,R,C,D,F,L,V,$,H,te;if(M>=b&&M>=w?(P=l,D=f,V=d,te=g,l>=0?(x=c,S=h,R=u,C=p,F=_,L=m,$=y,H=v):(x=h,S=c,R=p,C=u,F=m,L=_,$=v,H=y)):b>=w?(P=c,D=u,V=_,te=y,c>=0?(x=h,S=l,R=p,C=f,F=m,L=d,$=v,H=g):(x=l,S=h,R=f,C=p,F=d,L=m,$=g,H=v)):(P=h,D=p,V=m,te=v,h>=0?(x=l,S=c,R=f,C=u,F=d,L=_,$=g,H=y):(x=c,S=l,R=u,C=f,F=_,L=d,$=y,H=g)),P===0)return null;let X=x/P,ee=S/P,Q=1/P,_e=R-X*D,Ne=C-ee*D,Z=F-X*V,me=L-ee*V,Me=$-X*te,Ce=H-ee*te,ge=Me*me-Ce*Z,ze=_e*Ce-Ne*Me,St=Z*Ne-me*_e;if(s){if(ge<0||ze<0||St<0)return null}else if((ge<0||ze<0||St<0)&&(ge>0||ze>0||St>0))return null;let Ie=ge+ze+St;if(Ie===0)return null;let at=Q*(ge*D+ze*V+St*te);return(Ie>0?at<0:at>0)?null:this.at(at/Ie,r)}applyMatrix4(e){return this.origin.applyMatrix4(e),this.direction.transformDirection(e),this}equals(e){return e.origin.equals(this.origin)&&e.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}},ma=class extends Gi{constructor(e){super(),this.isMeshBasicMaterial=!0,this.type="MeshBasicMaterial",this.color=new je(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new Wn,this.combine=Tl,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.specularMap=e.specularMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.combine=e.combine,this.reflectivity=e.reflectivity,this.refractionRatio=e.refractionRatio,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.fog=e.fog,this}},sh=new xt,ki=new pa,Vr=new xs,rh=new G,Hr=new G,Wr=new G,Xr=new G,fl=new G,qr=new G,ah=new G,$r=new G,Ft=class extends Sn{constructor(e=new wn,t=new ma){super(),this.isMesh=!0,this.type="Mesh",this.geometry=e,this.material=t,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.count=1,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),e.morphTargetInfluences!==void 0?this.morphTargetInfluences=e.morphTargetInfluences.slice():this.morphTargetInfluences=void 0,e.morphTargetDictionary!==void 0?this.morphTargetDictionary=Object.assign({},e.morphTargetDictionary):this.morphTargetDictionary=void 0,this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}updateMorphTargets(){let t=this.geometry.morphAttributes,n=Object.keys(t);if(n.length>0){let s=t[n[0]];if(s!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,a=s.length;r<a;r++){let o=s[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[o]=r}}}}getVertexPosition(e,t){let n=this.geometry,s=n.attributes.position,r=n.morphAttributes.position,a=n.morphTargetsRelative;t.fromBufferAttribute(s,e);let o=this.morphTargetInfluences;if(r&&o){qr.set(0,0,0);for(let l=0,c=r.length;l<c;l++){let h=o[l],f=r[l];h!==0&&(fl.fromBufferAttribute(f,e),a?qr.addScaledVector(fl,h):qr.addScaledVector(fl.sub(t),h))}t.add(qr)}return t}intersectsFrustum(e){return e.intersectsObject(this)}raycast(e,t){let n=this.geometry,s=this.material,r=this.matrixWorld;s!==void 0&&(n.boundingSphere===null&&n.computeBoundingSphere(),Vr.copy(n.boundingSphere),Vr.applyMatrix4(r),ki.copy(e.ray).recast(e.near),!(Vr.containsPoint(ki.origin)===!1&&(ki.intersectSphere(Vr,rh)===null||ki.origin.distanceToSquared(rh)>(e.far-e.near)**2))&&(sh.copy(r).invert(),ki.copy(e.ray).applyMatrix4(sh),!(n.boundingBox!==null&&ki.intersectsBox(n.boundingBox)===!1)&&this._computeIntersections(e,t,ki)))}_computeIntersections(e,t,n){let s,r=this.geometry,a=this.material,o=r.index,l=r.attributes.position,c=r.attributes.uv,h=r.attributes.uv1,f=r.attributes.normal,u=r.groups,p=r.drawRange;if(o!==null)if(Array.isArray(a))for(let d=0,_=u.length;d<_;d++){let m=u[d],g=a[m.materialIndex],y=Math.max(m.start,p.start),v=Math.min(o.count,Math.min(m.start+m.count,p.start+p.count));for(let M=y,b=v;M<b;M+=3){let w=o.getX(M),x=o.getX(M+1),S=o.getX(M+2);s=Yr(this,g,e,n,c,h,f,w,x,S),s&&(s.faceIndex=Math.floor(M/3),s.face.materialIndex=m.materialIndex,t.push(s))}}else{let d=Math.max(0,p.start),_=Math.min(o.count,p.start+p.count);for(let m=d,g=_;m<g;m+=3){let y=o.getX(m),v=o.getX(m+1),M=o.getX(m+2);s=Yr(this,a,e,n,c,h,f,y,v,M),s&&(s.faceIndex=Math.floor(m/3),t.push(s))}}else if(l!==void 0)if(Array.isArray(a))for(let d=0,_=u.length;d<_;d++){let m=u[d],g=a[m.materialIndex],y=Math.max(m.start,p.start),v=Math.min(l.count,Math.min(m.start+m.count,p.start+p.count));for(let M=y,b=v;M<b;M+=3){let w=M,x=M+1,S=M+2;s=Yr(this,g,e,n,c,h,f,w,x,S),s&&(s.faceIndex=Math.floor(M/3),s.face.materialIndex=m.materialIndex,t.push(s))}}else{let d=Math.max(0,p.start),_=Math.min(l.count,p.start+p.count);for(let m=d,g=_;m<g;m+=3){let y=m,v=m+1,M=m+2;s=Yr(this,a,e,n,c,h,f,y,v,M),s&&(s.faceIndex=Math.floor(m/3),t.push(s))}}}};function bf(i,e,t,n,s,r,a,o){let l;if(e.side===sn?l=n.intersectTriangle(a,r,s,!0,o):l=n.intersectTriangle(s,r,a,e.side===Ti,o),l===null)return null;$r.copy(o),$r.applyMatrix4(i.matrixWorld);let c=t.ray.origin.distanceTo($r);return c<t.near||c>t.far?null:{distance:c,point:$r.clone(),object:i}}function Yr(i,e,t,n,s,r,a,o,l,c){i.getVertexPosition(o,Hr),i.getVertexPosition(l,Wr),i.getVertexPosition(c,Xr);let h=bf(i,e,t,n,Hr,Wr,Xr,ah);if(h){let f=new G;yi.getBarycoord(ah,Hr,Wr,Xr,f),s&&(h.uv=yi.getInterpolatedAttribute(s,o,l,c,f,new Xe)),r&&(h.uv1=yi.getInterpolatedAttribute(r,o,l,c,f,new Xe)),a&&(h.normal=yi.getInterpolatedAttribute(a,o,l,c,f,new G),h.normal.dot(n.direction)>0&&h.normal.multiplyScalar(-1));let u={a:o,b:l,c,normal:new G,materialIndex:0};yi.getNormal(Hr,Wr,Xr,u.normal),h.face=u,h.barycoord=f}return h}var ga=class extends tn{constructor(e=null,t=1,n=1,s,r,a,o,l,c=Ut,h=Ut,f,u){super(null,a,o,l,c,h,s,r,f,u),this.isDataTexture=!0,this.image={data:e,width:t,height:n},this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}};var js=class extends Yt{constructor(e,t,n,s=1){super(e,t,n),this.isInstancedBufferAttribute=!0,this.meshPerAttribute=s}copy(e){return super.copy(e),this.meshPerAttribute=e.meshPerAttribute,this}toJSON(){let e=super.toJSON();return e.meshPerAttribute=this.meshPerAttribute,e.isInstancedBufferAttribute=!0,e}};var zi=new xs,Sf=new Xe(.5,.5),Zr=new G,Vi=class{constructor(e=new Dn,t=new Dn,n=new Dn,s=new Dn,r=new Dn,a=new Dn){this.planes=[e,t,n,s,r,a]}set(e,t,n,s,r,a){let o=this.planes;return o[0].copy(e),o[1].copy(t),o[2].copy(n),o[3].copy(s),o[4].copy(r),o[5].copy(a),this}copy(e){let t=this.planes;for(let n=0;n<6;n++)t[n].copy(e.planes[n]);return this}setFromProjectionMatrix(e,t=yn,n=!1){let s=this.planes,r=e.elements,a=r[0],o=r[1],l=r[2],c=r[3],h=r[4],f=r[5],u=r[6],p=r[7],d=r[8],_=r[9],m=r[10],g=r[11],y=r[12],v=r[13],M=r[14],b=r[15];if(s[0].setComponents(c-a,p-h,g-d,b-y).normalize(),s[1].setComponents(c+a,p+h,g+d,b+y).normalize(),s[2].setComponents(c+o,p+f,g+_,b+v).normalize(),s[3].setComponents(c-o,p-f,g-_,b-v).normalize(),n)s[4].setComponents(l,u,m,M).normalize(),s[5].setComponents(c-l,p-u,g-m,b-M).normalize();else if(s[4].setComponents(c-l,p-u,g-m,b-M).normalize(),t===yn)s[5].setComponents(c+l,p+u,g+m,b+M).normalize();else if(t===qs)s[5].setComponents(l,u,m,M).normalize();else throw new Error("THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: "+t);return this}intersectsObject(e){if(e.boundingSphere!==void 0)e.boundingSphere===null&&e.computeBoundingSphere(),zi.copy(e.boundingSphere).applyMatrix4(e.matrixWorld);else{let t=e.geometry;t.boundingSphere===null&&t.computeBoundingSphere(),zi.copy(t.boundingSphere).applyMatrix4(e.matrixWorld)}return this.intersectsSphere(zi)}intersectsSprite(e){zi.center.set(0,0,0);let t=Sf.distanceTo(e.center);return zi.radius=.7071067811865476+t,zi.applyMatrix4(e.matrixWorld),this.intersectsSphere(zi)}intersectsSphere(e){let t=this.planes,n=e.center,s=-e.radius;for(let r=0;r<6;r++)if(t[r].distanceToPoint(n)<s)return!1;return!0}intersectsBox(e){let t=this.planes;for(let n=0;n<6;n++){let s=t[n];if(Zr.x=s.normal.x>0?e.max.x:e.min.x,Zr.y=s.normal.y>0?e.max.y:e.min.y,Zr.z=s.normal.z>0?e.max.z:e.min.z,s.distanceToPoint(Zr)<0)return!1}return!0}containsPoint(e){let t=this.planes;for(let n=0;n<6;n++)if(t[n].distanceToPoint(e)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}},oh=new xt,xa=class i{constructor(){this.coordinateSystem=yn,this._frustums=[],this._count=0}setFromArrayCamera(e){let t=e.cameras,n=this._frustums;for(let s=0;s<t.length;s++){let r=t[s];oh.multiplyMatrices(r.projectionMatrix,r.matrixWorldInverse),n[s]===void 0&&(n[s]=new Vi),n[s].setFromProjectionMatrix(oh,r.coordinateSystem,r.reversedDepth)}return this._count=t.length,this}getFrustum(e){return this._frustums[e]}intersectsObject(e){let t=this._frustums;for(let n=0;n<this._count;n++)if(t[n].intersectsObject(e))return!0;return!1}intersectsSprite(e){let t=this._frustums;for(let n=0;n<this._count;n++)if(t[n].intersectsSprite(e))return!0;return!1}intersectsSphere(e){let t=this._frustums;for(let n=0;n<this._count;n++)if(t[n].intersectsSphere(e))return!0;return!1}intersectsBox(e){let t=this._frustums;for(let n=0;n<this._count;n++)if(t[n].intersectsBox(e))return!0;return!1}containsPoint(e){let t=this._frustums;for(let n=0;n<this._count;n++)if(t[n].containsPoint(e))return!0;return!1}copy(e){this.coordinateSystem=e.coordinateSystem;let t=this._frustums,n=e._frustums;for(let s=0;s<e._count;s++)t[s]===void 0&&(t[s]=new Vi),t[s].copy(n[s]);return this._count=e._count,this}clone(){return new i().copy(this)}};var Qs=class extends tn{constructor(e=[],t=qi,n,s,r,a,o,l,c,h){super(e,t,n,s,r,a,o,l,c,h),this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(e){this.image=e}},vs=class extends tn{constructor(e,t,n,s,r,a,o,l,c){super(e,t,n,s,r,a,o,l,c),this.isCanvasTexture=!0,this.needsUpdate=!0}};var oi=class extends tn{constructor(e,t,n=Nn,s,r,a,o=Ut,l=Ut,c,h=ri,f=1){if(h!==ri&&h!==li)throw new Error("THREE.DepthTexture: format must be either THREE.DepthFormat or THREE.DepthStencilFormat");let u={width:e,height:t,depth:f};super(u,s,r,a,o,l,h,n,c),this.isDepthTexture=!0,this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(e){return super.copy(e),this.source=new ms(Object.assign({},e.image)),this.compareFunction=e.compareFunction,this}toJSON(e){let t=super.toJSON(e);return t.compareFunction=this.compareFunction,t}},er=class extends oi{constructor(e,t=Nn,n=qi,s,r,a=Ut,o=Ut,l,c=ri){let h={width:e,height:e,depth:1},f=[h,h,h,h,h,h];super(e,e,t,n,s,r,a,o,l,c),this.image=f,this.isCubeDepthTexture=!0,this.isCubeTexture=!0}get images(){return this.image}set images(e){this.image=e}},tr=class extends tn{constructor(e=null){super(),this.sourceTexture=e,this.isExternalTexture=!0}copy(e){return super.copy(e),this.sourceTexture=e.sourceTexture,this}},Xn=class i extends wn{constructor(e=1,t=1,n=1,s=1,r=1,a=1){super(),this.type="BoxGeometry",this.parameters={width:e,height:t,depth:n,widthSegments:s,heightSegments:r,depthSegments:a};let o=this;s=Math.floor(s),r=Math.floor(r),a=Math.floor(a);let l=[],c=[],h=[],f=[],u=0,p=0;d("z","y","x",-1,-1,n,t,e,a,r,0),d("z","y","x",1,-1,n,t,-e,a,r,1),d("x","z","y",1,1,e,n,t,s,a,2),d("x","z","y",1,-1,e,n,-t,s,a,3),d("x","y","z",1,-1,e,t,n,s,r,4),d("x","y","z",-1,-1,e,t,-n,s,r,5),this.setIndex(l),this.setAttribute("position",new Mn(c,3)),this.setAttribute("normal",new Mn(h,3)),this.setAttribute("uv",new Mn(f,2));function d(_,m,g,y,v,M,b,w,x,S,P){let R=M/x,C=b/S,D=M/2,F=b/2,L=w/2,V=x+1,$=S+1,H=0,te=0,X=new G;for(let ee=0;ee<$;ee++){let Q=ee*C-F;for(let _e=0;_e<V;_e++){let Ne=_e*R-D;X[_]=Ne*y,X[m]=Q*v,X[g]=L,c.push(X.x,X.y,X.z),X[_]=0,X[m]=0,X[g]=w>0?1:-1,h.push(X.x,X.y,X.z),f.push(_e/x),f.push(1-ee/S),H+=1}}for(let ee=0;ee<S;ee++)for(let Q=0;Q<x;Q++){let _e=u+Q+V*ee,Ne=u+Q+V*(ee+1),Z=u+(Q+1)+V*(ee+1),me=u+(Q+1)+V*ee;l.push(_e,Ne,me),l.push(Ne,Z,me),te+=6}o.addGroup(p,te,P),p+=te,u+=H}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new i(e.width,e.height,e.depth,e.widthSegments,e.heightSegments,e.depthSegments)}};var Hi=class i extends wn{constructor(e=1,t=1,n=1,s=1){super(),this.type="PlaneGeometry",this.parameters={width:e,height:t,widthSegments:n,heightSegments:s};let r=e/2,a=t/2,o=Math.floor(n),l=Math.floor(s),c=o+1,h=l+1,f=e/o,u=t/l,p=[],d=[],_=[],m=[];for(let g=0;g<h;g++){let y=g*u-a;for(let v=0;v<c;v++){let M=v*f-r;d.push(M,-y,0),_.push(0,0,1),m.push(v/o),m.push(1-g/l)}}for(let g=0;g<l;g++)for(let y=0;y<o;y++){let v=y+c*g,M=y+c*(g+1),b=y+1+c*(g+1),w=y+1+c*g;p.push(v,M,w),p.push(M,b,w)}this.setIndex(p),this.setAttribute("position",new Mn(d,3)),this.setAttribute("normal",new Mn(_,3)),this.setAttribute("uv",new Mn(m,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new i(e.width,e.height,e.widthSegments,e.heightSegments)}};function Yi(i){let e={};for(let t in i){e[t]={};for(let n in i[t]){let s=i[t][n];if(lh(s))s.isRenderTargetTexture?(Le("UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms()."),e[t][n]=null):e[t][n]=s.clone();else if(Array.isArray(s))if(lh(s[0])){let r=[];for(let a=0,o=s.length;a<o;a++)r[a]=s[a].clone();e[t][n]=r}else e[t][n]=s.slice();else e[t][n]=s}}return e}function Zt(i){let e={};for(let t=0;t<i.length;t++){let n=Yi(i[t]);for(let s in n)e[s]=n[s]}return e}function lh(i){return i&&(i.isColor||i.isMatrix3||i.isMatrix4||i.isVector2||i.isVector3||i.isVector4||i.isTexture||i.isQuaternion)}function wf(i){let e=[];for(let t=0;t<i.length;t++)e.push(i[t].clone());return e}function Zl(i){let e=i.getRenderTarget();return e===null?i.outputColorSpace:e.isXRRenderTarget===!0?e.texture.colorSpace:Ze.workingColorSpace}var jh={clone:Yi,merge:Zt},Tf=`void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,Ef=`void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}`,Ot=class extends Gi{constructor(e){super(),this.isShaderMaterial=!0,this.type="ShaderMaterial",this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=Tf,this.fragmentShader=Ef,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.forceSinglePass=!0,this.extensions={clipCullDistance:!1,multiDraw:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv1:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,e!==void 0&&this.setValues(e)}copy(e){return super.copy(e),this.fragmentShader=e.fragmentShader,this.vertexShader=e.vertexShader,this.uniforms=Yi(e.uniforms),this.uniformsGroups=wf(e.uniformsGroups),this.defines=Object.assign({},e.defines),this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.fog=e.fog,this.lights=e.lights,this.clipping=e.clipping,this.extensions=Object.assign({},e.extensions),this.glslVersion=e.glslVersion,this.defaultAttributeValues=Object.assign({},e.defaultAttributeValues),this.index0AttributeName=e.index0AttributeName,this.uniformsNeedUpdate=e.uniformsNeedUpdate,this}toJSON(e){let t=super.toJSON(e);t.glslVersion=this.glslVersion,t.uniforms={};for(let s in this.uniforms){let a=this.uniforms[s].value;a&&a.isTexture?t.uniforms[s]={type:"t",value:a.toJSON(e).uuid}:a&&a.isColor?t.uniforms[s]={type:"c",value:a.getHex()}:a&&a.isVector2?t.uniforms[s]={type:"v2",value:a.toArray()}:a&&a.isVector3?t.uniforms[s]={type:"v3",value:a.toArray()}:a&&a.isVector4?t.uniforms[s]={type:"v4",value:a.toArray()}:a&&a.isMatrix3?t.uniforms[s]={type:"m3",value:a.toArray()}:a&&a.isMatrix4?t.uniforms[s]={type:"m4",value:a.toArray()}:t.uniforms[s]={value:a}}Object.keys(this.defines).length>0&&(t.defines=this.defines),t.vertexShader=this.vertexShader,t.fragmentShader=this.fragmentShader,t.lights=this.lights,t.clipping=this.clipping;let n={};for(let s in this.extensions)this.extensions[s]===!0&&(n[s]=!0);return Object.keys(n).length>0&&(t.extensions=n),t}fromJSON(e,t){if(super.fromJSON(e,t),e.uniforms!==void 0)for(let n in e.uniforms){let s=e.uniforms[n];switch(this.uniforms[n]={},s.type){case"t":this.uniforms[n].value=t[s.value]||null;break;case"c":this.uniforms[n].value=new je().setHex(s.value);break;case"v2":this.uniforms[n].value=new Xe().fromArray(s.value);break;case"v3":this.uniforms[n].value=new G().fromArray(s.value);break;case"v4":this.uniforms[n].value=new lt().fromArray(s.value);break;case"m3":this.uniforms[n].value=new Ue().fromArray(s.value);break;case"m4":this.uniforms[n].value=new xt().fromArray(s.value);break;default:this.uniforms[n].value=s.value}}if(e.defines!==void 0&&(this.defines=e.defines),e.vertexShader!==void 0&&(this.vertexShader=e.vertexShader),e.fragmentShader!==void 0&&(this.fragmentShader=e.fragmentShader),e.glslVersion!==void 0&&(this.glslVersion=e.glslVersion),e.extensions!==void 0)for(let n in e.extensions)this.extensions[n]=e.extensions[n];return e.lights!==void 0&&(this.lights=e.lights),e.clipping!==void 0&&(this.clipping=e.clipping),this}},va=class extends Ot{constructor(e){super(e),this.isRawShaderMaterial=!0,this.type="RawShaderMaterial"}};var _a=class extends Gi{constructor(e){super(),this.isMeshDepthMaterial=!0,this.type="MeshDepthMaterial",this.depthPacking=Oh,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(e)}copy(e){return super.copy(e),this.depthPacking=e.depthPacking,this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this}},ya=class extends Gi{constructor(e){super(),this.isMeshDistanceMaterial=!0,this.type="MeshDistanceMaterial",this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(e)}copy(e){return super.copy(e),this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this}};function ls(i,e){return!i||i.constructor===e?i:typeof e.BYTES_PER_ELEMENT=="number"?new e(i):Array.prototype.slice.call(i)}function Jr(i){return i!==void 0&&i.inTangents!==void 0&&i.outTangents!==void 0}var bi=class{constructor(e,t,n,s){this.parameterPositions=e,this._cachedIndex=0,this.resultBuffer=s!==void 0?s:new t.constructor(n),this.sampleValues=t,this.valueSize=n,this.settings=null,this.DefaultSettings_={}}evaluate(e){let t=this.parameterPositions,n=this._cachedIndex,s=t[n],r=t[n-1];n:{e:{let a;t:{i:if(!(e<s)){for(let o=n+2;;){if(s===void 0){if(e<r)break i;return n=t.length,this._cachedIndex=n,this.copySampleValue_(n-1)}if(n===o)break;if(r=s,s=t[++n],e<s)break e}a=t.length;break t}if(!(e>=r)){let o=t[1];e<o&&(n=2,r=o);for(let l=n-2;;){if(r===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(n===l)break;if(s=r,r=t[--n-1],e>=r)break e}a=n,n=0;break t}break n}for(;n<a;){let o=n+a>>>1;e<t[o]?a=o:n=o+1}if(s=t[n],r=t[n-1],r===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(s===void 0)return n=t.length,this._cachedIndex=n,this.copySampleValue_(n-1)}this._cachedIndex=n,this.intervalChanged_(n,r,s)}return this.interpolate_(n,r,e,s)}getSettings_(){return this.settings||this.DefaultSettings_}copySampleValue_(e){let t=this.resultBuffer,n=this.sampleValues,s=this.valueSize,r=e*s;for(let a=0;a!==s;++a)t[a]=n[r+a];return t}interpolate_(){throw new Error("THREE.Interpolant: Call to abstract method.")}intervalChanged_(){}},Ma=class extends bi{constructor(e,t,n,s){super(e,t,n,s),this._weightPrev=-0,this._offsetPrev=-0,this._weightNext=-0,this._offsetNext=-0,this.DefaultSettings_={endingStart:ml,endingEnd:ml}}intervalChanged_(e,t,n){let s=this.parameterPositions,r=e-2,a=e+1,o=s[r],l=s[a];if(o===void 0)switch(this.getSettings_().endingStart){case gl:r=e,o=2*t-n;break;case xl:r=s.length-2,o=t+s[r]-s[r+1];break;default:r=e,o=n}if(l===void 0)switch(this.getSettings_().endingEnd){case gl:a=e,l=2*n-t;break;case xl:a=1,l=n+s[1]-s[0];break;default:a=e-1,l=t}let c=(n-t)*.5,h=this.valueSize;this._weightPrev=c/(t-o),this._weightNext=c/(l-n),this._offsetPrev=r*h,this._offsetNext=a*h}interpolate_(e,t,n,s){let r=this.resultBuffer,a=this.sampleValues,o=this.valueSize,l=e*o,c=l-o,h=this._offsetPrev,f=this._offsetNext,u=this._weightPrev,p=this._weightNext,d=(n-t)/(s-t),_=d*d,m=_*d,g=-u*m+2*u*_-u*d,y=(1+u)*m+(-1.5-2*u)*_+(-.5+u)*d+1,v=(-1-p)*m+(1.5+p)*_+.5*d,M=p*m-p*_;for(let b=0;b!==o;++b)r[b]=g*a[h+b]+y*a[c+b]+v*a[l+b]+M*a[f+b];return r}},ba=class extends bi{constructor(e,t,n,s){super(e,t,n,s)}interpolate_(e,t,n,s){let r=this.resultBuffer,a=this.sampleValues,o=this.valueSize,l=e*o,c=l-o,h=(n-t)/(s-t),f=1-h;for(let u=0;u!==o;++u)r[u]=a[c+u]*f+a[l+u]*h;return r}},Sa=class extends bi{constructor(e,t,n,s){super(e,t,n,s)}interpolate_(e){return this.copySampleValue_(e-1)}},wa=class extends bi{interpolate_(e,t,n,s){let r=this.resultBuffer,a=this.sampleValues,o=this.valueSize,l=e*o,c=l-o,h=this.inTangents,f=this.outTangents;if(!h||!f){let d=(n-t)/(s-t),_=1-d;for(let m=0;m!==o;++m)r[m]=a[c+m]*_+a[l+m]*d;return r}let u=o*2,p=e-1;for(let d=0;d!==o;++d){let _=a[c+d],m=a[l+d],g=p*u+d*2,y=f[g],v=f[g+1],M=e*u+d*2,b=h[M],w=h[M+1],x=Rf(n,t,y,b,s);r[d]=Qh(x,_,v,w,m)}return r}};function Qh(i,e,t,n,s){let r=1-i;return r*r*r*e+3*r*r*i*t+3*r*i*i*n+i*i*i*s}function Af(i,e,t,n,s){let r=1-i;return 3*r*r*(t-e)+6*r*i*(n-t)+3*i*i*(s-n)}function Rf(i,e,t,n,s){let r=(i-e)/(s-e);for(let a=0;a<8;a++){let o=Qh(r,e,t,n,s)-i;if(Math.abs(o)<1e-10)break;let l=Af(r,e,t,n,s);if(Math.abs(l)<1e-10)break;r=Math.max(0,Math.min(1,r-o/l))}return r}var dn=class{constructor(e,t,n,s){if(e===void 0)throw new Error("THREE.KeyframeTrack: track name is undefined");if(t===void 0||t.length===0)throw new Error("THREE.KeyframeTrack: no keyframes in track named "+e);this.name=e,this.times=ls(t,this.TimeBufferType),this.values=ls(n,this.ValueBufferType),this.setInterpolation(s||this.DefaultInterpolation)}static toJSON(e){let t=e.constructor,n;if(t.toJSON!==this.toJSON)n=t.toJSON(e);else{n={name:e.name,times:ls(e.times,Array),values:ls(e.values,Array)};let s=e.getInterpolation();s!==e.DefaultInterpolation&&(n.interpolation=s),Jr(e.settings)&&(n.settings={inTangents:ls(e.settings.inTangents,Array),outTangents:ls(e.settings.outTangents,Array)})}return n.type=e.ValueTypeName,n}InterpolantFactoryMethodDiscrete(e){return new Sa(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodLinear(e){return new ba(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodSmooth(e){return new Ma(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodBezier(e){let t=new wa(this.times,this.values,this.getValueSize(),e);return this.settings&&(t.inTangents=this.settings.inTangents,t.outTangents=this.settings.outTangents),t}setInterpolation(e){let t;switch(e){case Hs:t=this.InterpolantFactoryMethodDiscrete;break;case ca:t=this.InterpolantFactoryMethodLinear;break;case Qr:t=this.InterpolantFactoryMethodSmooth;break;case pl:t=this.InterpolantFactoryMethodBezier;break}if(t===void 0){let n="unsupported interpolation for "+this.ValueTypeName+" keyframe track named "+this.name;if(this.createInterpolant===void 0)if(e!==this.DefaultInterpolation)this.setInterpolation(this.DefaultInterpolation);else throw new Error(n);return Le("KeyframeTrack:",n),this}return this.createInterpolant=t,this}getInterpolation(){switch(this.createInterpolant){case this.InterpolantFactoryMethodDiscrete:return Hs;case this.InterpolantFactoryMethodLinear:return ca;case this.InterpolantFactoryMethodSmooth:return Qr;case this.InterpolantFactoryMethodBezier:return pl}}getValueSize(){return this.values.length/this.times.length}shift(e){if(e!==0){let t=this.times;for(let n=0,s=t.length;n!==s;++n)t[n]+=e;Jr(this.settings)&&(ch(this.settings.inTangents,e),ch(this.settings.outTangents,e))}return this}scale(e){if(e!==1){let t=this.times;for(let n=0,s=t.length;n!==s;++n)t[n]*=e;Jr(this.settings)&&(hh(this.settings.inTangents,e),hh(this.settings.outTangents,e))}return this}trim(e,t){let n=this.times,s=n.length,r=0,a=s-1;for(;r!==s&&n[r]<e;)++r;for(;a!==-1&&n[a]>t;)--a;if(++a,r!==0||a!==s){r>=a&&(a=Math.max(a,1),r=a-1);let o=this.getValueSize();this.times=n.slice(r,a),this.values=this.values.slice(r*o,a*o)}return this}validate(){let e=!0,t=this.getValueSize();t-Math.floor(t)!==0&&(De("KeyframeTrack: Invalid value size in track.",this),e=!1);let n=this.times,s=this.values,r=n.length;r===0&&(De("KeyframeTrack: Track is empty.",this),e=!1);let a=null;for(let o=0;o!==r;o++){let l=n[o];if(typeof l=="number"&&isNaN(l)){De("KeyframeTrack: Time is not a valid number.",this,o,l),e=!1;break}if(a!==null&&a>l){De("KeyframeTrack: Out of order keys.",this,o,l,a),e=!1;break}a=l}if(s!==void 0&&tf(s))for(let o=0,l=s.length;o!==l;++o){let c=s[o];if(isNaN(c)){De("KeyframeTrack: Value is not a valid number.",this,o,c),e=!1;break}}return e}optimize(){let e=this.times.slice(),t=this.values.slice(),n=this.getValueSize(),s=this.getInterpolation()===Qr,r=e.length-1,a=1;for(let o=1;o<r;++o){let l=!1,c=e[o],h=e[o+1];if(c!==h&&(o!==1||c!==e[0]))if(s)l=!0;else{let f=o*n,u=f-n,p=f+n;for(let d=0;d!==n;++d){let _=t[f+d];if(_!==t[u+d]||_!==t[p+d]){l=!0;break}}}if(l){if(o!==a){e[a]=e[o];let f=o*n,u=a*n;for(let p=0;p!==n;++p)t[u+p]=t[f+p]}++a}}if(r>0){e[a]=e[r];for(let o=r*n,l=a*n,c=0;c!==n;++c)t[l+c]=t[o+c];++a}return a!==e.length?(this.times=e.slice(0,a),this.values=t.slice(0,a*n)):(this.times=e,this.values=t),this}clone(){let e=this.times.slice(),t=this.values.slice(),n=this.constructor,s=new n(this.name,e,t);return s.createInterpolant=this.createInterpolant,Jr(this.settings)&&(s.settings={inTangents:this.settings.inTangents.slice(),outTangents:this.settings.outTangents.slice()}),s}};function ch(i,e){for(let t=0,n=i.length;t!==n;t+=2)i[t]+=e}function hh(i,e){for(let t=0,n=i.length;t!==n;t+=2)i[t]*=e}dn.prototype.ValueTypeName="";dn.prototype.TimeBufferType=Float32Array;dn.prototype.ValueBufferType=Float32Array;dn.prototype.DefaultInterpolation=ca;var Si=class extends dn{constructor(e,t,n){super(e,t,n)}};Si.prototype.ValueTypeName="bool";Si.prototype.ValueBufferType=Array;Si.prototype.DefaultInterpolation=Hs;Si.prototype.InterpolantFactoryMethodLinear=void 0;Si.prototype.InterpolantFactoryMethodSmooth=void 0;var Ta=class extends dn{constructor(e,t,n,s){super(e,t,n,s)}};Ta.prototype.ValueTypeName="color";var Ea=class extends dn{constructor(e,t,n,s){super(e,t,n,s)}};Ea.prototype.ValueTypeName="number";var Aa=class extends bi{constructor(e,t,n,s){super(e,t,n,s)}interpolate_(e,t,n,s){let r=this.resultBuffer,a=this.sampleValues,o=this.valueSize,l=(n-t)/(s-t),c=e*o;for(let h=c+o;c!==h;c+=4)bn.slerpFlat(r,0,a,c-o,a,c,l);return r}},nr=class extends dn{constructor(e,t,n,s){super(e,t,n,s)}InterpolantFactoryMethodLinear(e){return new Aa(this.times,this.values,this.getValueSize(),e)}};nr.prototype.ValueTypeName="quaternion";nr.prototype.InterpolantFactoryMethodSmooth=void 0;var wi=class extends dn{constructor(e,t,n){super(e,t,n)}};wi.prototype.ValueTypeName="string";wi.prototype.ValueBufferType=Array;wi.prototype.DefaultInterpolation=Hs;wi.prototype.InterpolantFactoryMethodLinear=void 0;wi.prototype.InterpolantFactoryMethodSmooth=void 0;var Ra=class extends dn{constructor(e,t,n,s){super(e,t,n,s)}};Ra.prototype.ValueTypeName="vector";var Ca=class{constructor(e,t,n){let s=this,r=!1,a=0,o=0,l,c=[];this.onStart=void 0,this.onLoad=e,this.onProgress=t,this.onError=n,this._abortController=null,this.itemStart=function(h){o++,r===!1&&s.onStart!==void 0&&s.onStart(h,a,o),r=!0},this.itemEnd=function(h){a++,s.onProgress!==void 0&&s.onProgress(h,a,o),a===o&&(r=!1,s.onLoad!==void 0&&s.onLoad())},this.itemError=function(h){s.onError!==void 0&&s.onError(h)},this.resolveURL=function(h){return h=h.normalize("NFC"),l?l(h):h},this.setURLModifier=function(h){return l=h,this},this.addHandler=function(h,f){return c.push(h,f),this},this.removeHandler=function(h){let f=c.indexOf(h);return f!==-1&&c.splice(f,2),this},this.getHandler=function(h){for(let f=0,u=c.length;f<u;f+=2){let p=c[f],d=c[f+1];if(p.global&&(p.lastIndex=0),p.test(h))return d}return null},this.abort=function(){return this.abortController.abort(),this._abortController=null,this}}get abortController(){return this._abortController||(this._abortController=new AbortController),this._abortController}},eu=new Ca,Pa=class{constructor(e){this.manager=e!==void 0?e:eu,this.crossOrigin="anonymous",this.withCredentials=!1,this.path="",this.resourcePath="",this.requestHeader={},this.priority="auto",this.cache="default",typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}load(){}loadAsync(e,t){let n=this;return new Promise(function(s,r){n.load(e,s,t,r)})}parse(){}setCrossOrigin(e){return this.crossOrigin=e,this}setWithCredentials(e){return this.withCredentials=e,this}setPath(e){return this.path=e,this}setResourcePath(e){return this.resourcePath=e,this}setRequestHeader(e){return this.requestHeader=e,this}setPriority(e){return this.priority=e,this}setCache(e){return this.cache=e,this}abort(){return this}};Pa.DEFAULT_MATERIAL_NAME="__DEFAULT";var Kr=new G,jr=new bn,Gn=new G,ir=class extends Sn{constructor(){super(),this.isCamera=!0,this.type="Camera",this.matrixWorldInverse=new xt,this.projectionMatrix=new xt,this.projectionMatrixInverse=new xt,this.coordinateSystem=yn,this._reversedDepth=!1}get reversedDepth(){return this._reversedDepth}copy(e,t){return super.copy(e,t),this.matrixWorldInverse.copy(e.matrixWorldInverse),this.projectionMatrix.copy(e.projectionMatrix),this.projectionMatrixInverse.copy(e.projectionMatrixInverse),this.coordinateSystem=e.coordinateSystem,this}getWorldDirection(e){return super.getWorldDirection(e).negate()}updateMatrixWorld(e){super.updateMatrixWorld(e),this.matrixWorld.decompose(Kr,jr,Gn),Gn.x===1&&Gn.y===1&&Gn.z===1?this.matrixWorldInverse.copy(this.matrixWorld).invert():this.matrixWorldInverse.compose(Kr,jr,Gn.set(1,1,1)).invert()}updateWorldMatrix(e,t,n=!1){super.updateWorldMatrix(e,t,n),this.matrixWorld.decompose(Kr,jr,Gn),Gn.x===1&&Gn.y===1&&Gn.z===1?this.matrixWorldInverse.copy(this.matrixWorld).invert():this.matrixWorldInverse.compose(Kr,jr,Gn.set(1,1,1)).invert()}clone(){return new this.constructor().copy(this)}},_i=new G,uh=new Xe,dh=new Xe,Vt=class extends ir{constructor(e=50,t=1,n=.1,s=2e3){super(),this.isPerspectiveCamera=!0,this.type="PerspectiveCamera",this.fov=e,this.zoom=1,this.near=n,this.far=s,this.focus=10,this.aspect=t,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.fov=e.fov,this.zoom=e.zoom,this.near=e.near,this.far=e.far,this.focus=e.focus,this.aspect=e.aspect,this.view=e.view===null?null:Object.assign({},e.view),this.filmGauge=e.filmGauge,this.filmOffset=e.filmOffset,this}setFocalLength(e){let t=.5*this.getFilmHeight()/e;this.fov=ha*2*Math.atan(t),this.updateProjectionMatrix()}getFocalLength(){let e=Math.tan($o*.5*this.fov);return .5*this.getFilmHeight()/e}getEffectiveFOV(){return ha*2*Math.atan(Math.tan($o*.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}getViewBounds(e,t,n){_i.set(-1,-1,.5).applyMatrix4(this.projectionMatrixInverse),t.set(_i.x,_i.y).multiplyScalar(-e/_i.z),_i.set(1,1,.5).applyMatrix4(this.projectionMatrixInverse),n.set(_i.x,_i.y).multiplyScalar(-e/_i.z)}getViewSize(e,t){return this.getViewBounds(e,uh,dh),t.subVectors(dh,uh)}setViewOffset(e,t,n,s,r,a){this.aspect=e/t,this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=n,this.view.offsetY=s,this.view.width=r,this.view.height=a,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let e=this.near,t=e*Math.tan($o*.5*this.fov)/this.zoom,n=2*t,s=this.aspect*n,r=-.5*s,a=this.view;if(this.view!==null&&this.view.enabled){let l=a.fullWidth,c=a.fullHeight;r+=a.offsetX*s/l,t-=a.offsetY*n/c,s*=a.width/l,n*=a.height/c}let o=this.filmOffset;o!==0&&(r+=e*o/this.getFilmWidth()),this.projectionMatrix.makePerspective(r,r+s,t,t-n,e,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){let t=super.toJSON(e);return t.object.fov=this.fov,t.object.zoom=this.zoom,t.object.near=this.near,t.object.far=this.far,t.object.focus=this.focus,t.object.aspect=this.aspect,this.view!==null&&(t.object.view=Object.assign({},this.view)),t.object.filmGauge=this.filmGauge,t.object.filmOffset=this.filmOffset,t}};var _s=class extends ir{constructor(e=-1,t=1,n=1,s=-1,r=.1,a=2e3){super(),this.isOrthographicCamera=!0,this.type="OrthographicCamera",this.zoom=1,this.view=null,this.left=e,this.right=t,this.top=n,this.bottom=s,this.near=r,this.far=a,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.left=e.left,this.right=e.right,this.top=e.top,this.bottom=e.bottom,this.near=e.near,this.far=e.far,this.zoom=e.zoom,this.view=e.view===null?null:Object.assign({},e.view),this}setViewOffset(e,t,n,s,r,a){this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=n,this.view.offsetY=s,this.view.width=r,this.view.height=a,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let e=(this.right-this.left)/(2*this.zoom),t=(this.top-this.bottom)/(2*this.zoom),n=(this.right+this.left)/2,s=(this.top+this.bottom)/2,r=n-e,a=n+e,o=s+t,l=s-t;if(this.view!==null&&this.view.enabled){let c=(this.right-this.left)/this.view.fullWidth/this.zoom,h=(this.top-this.bottom)/this.view.fullHeight/this.zoom;r+=c*this.view.offsetX,a=r+c*this.view.width,o-=h*this.view.offsetY,l=o-h*this.view.height}this.projectionMatrix.makeOrthographic(r,a,o,l,this.near,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){let t=super.toJSON(e);return t.object.zoom=this.zoom,t.object.left=this.left,t.object.right=this.right,t.object.top=this.top,t.object.bottom=this.bottom,t.object.near=this.near,t.object.far=this.far,this.view!==null&&(t.object.view=Object.assign({},this.view)),t}};var sr=class extends wn{constructor(){super(),this.isInstancedBufferGeometry=!0,this.type="InstancedBufferGeometry",this.instanceCount=1/0}copy(e){return super.copy(e),this.instanceCount=e.instanceCount,this}toJSON(){let e=super.toJSON();return e.instanceCount=this.instanceCount,e.isInstancedBufferGeometry=!0,e}};var cs=-90,hs=1,ys=class extends Sn{constructor(e,t,n){super(),this.type="CubeCamera",this.renderTarget=n,this.coordinateSystem=null,this.activeMipmapLevel=0;let s=new Vt(cs,hs,e,t);s.layers=this.layers,this.add(s);let r=new Vt(cs,hs,e,t);r.layers=this.layers,this.add(r);let a=new Vt(cs,hs,e,t);a.layers=this.layers,this.add(a);let o=new Vt(cs,hs,e,t);o.layers=this.layers,this.add(o);let l=new Vt(cs,hs,e,t);l.layers=this.layers,this.add(l);let c=new Vt(cs,hs,e,t);c.layers=this.layers,this.add(c)}updateCoordinateSystem(){let e=this.coordinateSystem,t=this.children.concat(),[n,s,r,a,o,l]=t;for(let c of t)this.remove(c);if(e===yn)n.up.set(0,1,0),n.lookAt(1,0,0),s.up.set(0,1,0),s.lookAt(-1,0,0),r.up.set(0,0,-1),r.lookAt(0,1,0),a.up.set(0,0,1),a.lookAt(0,-1,0),o.up.set(0,1,0),o.lookAt(0,0,1),l.up.set(0,1,0),l.lookAt(0,0,-1);else if(e===qs)n.up.set(0,-1,0),n.lookAt(-1,0,0),s.up.set(0,-1,0),s.lookAt(1,0,0),r.up.set(0,0,1),r.lookAt(0,1,0),a.up.set(0,0,-1),a.lookAt(0,-1,0),o.up.set(0,-1,0),o.lookAt(0,0,1),l.up.set(0,-1,0),l.lookAt(0,0,-1);else throw new Error("THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: "+e);for(let c of t)this.add(c),c.updateMatrixWorld()}update(e,t){this.parent===null&&this.updateMatrixWorld();let{renderTarget:n,activeMipmapLevel:s}=this;this.coordinateSystem!==e.coordinateSystem&&(this.coordinateSystem=e.coordinateSystem,this.updateCoordinateSystem());let[r,a,o,l,c,h]=this.children,f=e.getRenderTarget(),u=e.getActiveCubeFace(),p=e.getActiveMipmapLevel(),d=e.xr.enabled;e.xr.enabled=!1;let _=n.texture.mipmapsAutoUpdate;n.texture.mipmapsAutoUpdate=!1;let m=!1;e.isWebGLRenderer===!0?m=e.state.buffers.depth.getReversed():m=e.reversedDepthBuffer,e.setRenderTarget(n,0,s),m&&e.autoClear===!1&&e.clearDepth(),e.render(t,r),e.setRenderTarget(n,1,s),m&&e.autoClear===!1&&e.clearDepth(),e.render(t,a),e.setRenderTarget(n,2,s),m&&e.autoClear===!1&&e.clearDepth(),e.render(t,o),e.setRenderTarget(n,3,s),m&&e.autoClear===!1&&e.clearDepth(),e.render(t,l),e.setRenderTarget(n,4,s),m&&e.autoClear===!1&&e.clearDepth(),e.render(t,c),n.texture.mipmapsAutoUpdate=_,e.setRenderTarget(n,5,s),m&&e.autoClear===!1&&e.clearDepth(),e.render(t,h),e.setRenderTarget(f,u,p),e.xr.enabled=d,n.texture.needsPMREMUpdate=!0}},Ia=class extends Vt{constructor(e=[]){super(),this.isArrayCamera=!0,this.isMultiViewCamera=!1,this.cameras=e,this.perCameraFrustumCulled=!1}};var Jl="\\[\\]\\.:\\/",Cf=new RegExp("["+Jl+"]","g"),Kl="[^"+Jl+"]",Pf="[^"+Jl.replace("\\.","")+"]",If=/((?:WC+[\/:])*)/.source.replace("WC",Kl),Lf=/(WCOD+)?/.source.replace("WCOD",Pf),Df=/(?:\.(WC+)(?:\[(.+)\])?)?/.source.replace("WC",Kl),Nf=/\.(WC+)(?:\[(.+)\])?/.source.replace("WC",Kl),Uf=new RegExp("^"+If+Lf+Df+Nf+"$"),Ff=["material","materials","bones","map"],vl=class{constructor(e,t,n){let s=n||pt.parseTrackName(t);this._targetGroup=e,this._bindings=e.subscribe_(t,s)}getValue(e,t){this.bind();let n=this._targetGroup.nCachedObjects_,s=this._bindings[n];s!==void 0&&s.getValue(e,t)}setValue(e,t){let n=this._bindings;for(let s=this._targetGroup.nCachedObjects_,r=n.length;s!==r;++s)n[s].setValue(e,t)}bind(){let e=this._bindings;for(let t=this._targetGroup.nCachedObjects_,n=e.length;t!==n;++t)e[t].bind()}unbind(){let e=this._bindings;for(let t=this._targetGroup.nCachedObjects_,n=e.length;t!==n;++t)e[t].unbind()}},pt=class i{constructor(e,t,n){this.path=t,this.parsedPath=n||i.parseTrackName(t),this.node=i.findNode(e,this.parsedPath.nodeName),this.rootNode=e,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}static create(e,t,n){return e&&e.isAnimationObjectGroup?new i.Composite(e,t,n):new i(e,t,n)}static sanitizeNodeName(e){return e.replace(/\s/g,"_").replace(Cf,"")}static parseTrackName(e){let t=Uf.exec(e);if(t===null)throw new Error("THREE.PropertyBinding: Cannot parse trackName: "+e);let n={nodeName:t[2],objectName:t[3],objectIndex:t[4],propertyName:t[5],propertyIndex:t[6]},s=n.nodeName&&n.nodeName.lastIndexOf(".");if(s!==void 0&&s!==-1){let r=n.nodeName.substring(s+1);Ff.indexOf(r)!==-1&&(n.nodeName=n.nodeName.substring(0,s),n.objectName=r)}if(n.propertyName===null||n.propertyName.length===0)throw new Error("THREE.PropertyBinding: can not parse propertyName from trackName: "+e);return n}static findNode(e,t){if(t===void 0||t===""||t==="."||t===-1||t===e.name||t===e.uuid)return e;if(e.skeleton){let n=e.skeleton.getBoneByName(t);if(n!==void 0)return n}if(e.children){let n=function(r){for(let a=0;a<r.length;a++){let o=r[a];if(o.name===t||o.uuid===t)return o;let l=n(o.children);if(l)return l}return null},s=n(e.children);if(s)return s}return null}_getValue_unavailable(){}_setValue_unavailable(){}_getValue_direct(e,t){e[t]=this.targetObject[this.propertyName]}_getValue_array(e,t){let n=this.resolvedProperty;for(let s=0,r=n.length;s!==r;++s)e[t++]=n[s]}_getValue_arrayElement(e,t){e[t]=this.resolvedProperty[this.propertyIndex]}_getValue_toArray(e,t){this.resolvedProperty.toArray(e,t)}_setValue_direct(e,t){this.targetObject[this.propertyName]=e[t]}_setValue_direct_setNeedsUpdate(e,t){this.targetObject[this.propertyName]=e[t],this.targetObject.needsUpdate=!0}_setValue_direct_setMatrixWorldNeedsUpdate(e,t){this.targetObject[this.propertyName]=e[t],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_array(e,t){let n=this.resolvedProperty;for(let s=0,r=n.length;s!==r;++s)n[s]=e[t++]}_setValue_array_setNeedsUpdate(e,t){let n=this.resolvedProperty;for(let s=0,r=n.length;s!==r;++s)n[s]=e[t++];this.targetObject.needsUpdate=!0}_setValue_array_setMatrixWorldNeedsUpdate(e,t){let n=this.resolvedProperty;for(let s=0,r=n.length;s!==r;++s)n[s]=e[t++];this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_arrayElement(e,t){this.resolvedProperty[this.propertyIndex]=e[t]}_setValue_arrayElement_setNeedsUpdate(e,t){this.resolvedProperty[this.propertyIndex]=e[t],this.targetObject.needsUpdate=!0}_setValue_arrayElement_setMatrixWorldNeedsUpdate(e,t){this.resolvedProperty[this.propertyIndex]=e[t],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_fromArray(e,t){this.resolvedProperty.fromArray(e,t)}_setValue_fromArray_setNeedsUpdate(e,t){this.resolvedProperty.fromArray(e,t),this.targetObject.needsUpdate=!0}_setValue_fromArray_setMatrixWorldNeedsUpdate(e,t){this.resolvedProperty.fromArray(e,t),this.targetObject.matrixWorldNeedsUpdate=!0}_getValue_unbound(e,t){this.bind(),this.getValue(e,t)}_setValue_unbound(e,t){this.bind(),this.setValue(e,t)}bind(){let e=this.node,t=this.parsedPath,n=t.objectName,s=t.propertyName,r=t.propertyIndex;if(e||(e=i.findNode(this.rootNode,t.nodeName),this.node=e),this.getValue=this._getValue_unavailable,this.setValue=this._setValue_unavailable,!e){Le("PropertyBinding: No target node found for track: "+this.path+".");return}if(n){let c=t.objectIndex;switch(n){case"materials":if(!e.material){De("PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!e.material.materials){De("PropertyBinding: Can not bind to material.materials as node.material does not have a materials array.",this);return}e=e.material.materials;break;case"bones":if(!e.skeleton){De("PropertyBinding: Can not bind to bones as node does not have a skeleton.",this);return}e=e.skeleton.bones;for(let h=0;h<e.length;h++)if(e[h].name===c){c=h;break}break;case"map":if("map"in e){e=e.map;break}if(!e.material){De("PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!e.material.map){De("PropertyBinding: Can not bind to material.map as node.material does not have a map.",this);return}e=e.material.map;break;default:if(e[n]===void 0){De("PropertyBinding: Can not bind to objectName of node undefined.",this);return}e=e[n]}if(c!==void 0){if(e[c]===void 0){De("PropertyBinding: Trying to bind to objectIndex of objectName, but is undefined.",this,e);return}e=e[c]}}let a=e[s];if(a===void 0){let c=t.nodeName;De("PropertyBinding: Trying to update property for track: "+c+"."+s+" but it wasn't found.",e);return}let o=this.Versioning.None;this.targetObject=e,e.isMaterial===!0?o=this.Versioning.NeedsUpdate:e.isObject3D===!0&&(o=this.Versioning.MatrixWorldNeedsUpdate);let l=this.BindingType.Direct;if(r!==void 0){if(s==="morphTargetInfluences"){if(!e.geometry){De("PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.",this);return}if(!e.geometry.morphAttributes){De("PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.morphAttributes.",this);return}e.morphTargetDictionary[r]!==void 0&&(r=e.morphTargetDictionary[r])}l=this.BindingType.ArrayElement,this.resolvedProperty=a,this.propertyIndex=r}else a.fromArray!==void 0&&a.toArray!==void 0?(l=this.BindingType.HasFromToArray,this.resolvedProperty=a):Array.isArray(a)?(l=this.BindingType.EntireArray,this.resolvedProperty=a):this.propertyName=s;this.getValue=this.GetterByBindingType[l],this.setValue=this.SetterByBindingTypeAndVersioning[l][o]}unbind(){this.node=null,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}};pt.Composite=vl;pt.prototype.BindingType={Direct:0,EntireArray:1,ArrayElement:2,HasFromToArray:3};pt.prototype.Versioning={None:0,NeedsUpdate:1,MatrixWorldNeedsUpdate:2};pt.prototype.GetterByBindingType=[pt.prototype._getValue_direct,pt.prototype._getValue_array,pt.prototype._getValue_arrayElement,pt.prototype._getValue_toArray];pt.prototype.SetterByBindingTypeAndVersioning=[[pt.prototype._setValue_direct,pt.prototype._setValue_direct_setNeedsUpdate,pt.prototype._setValue_direct_setMatrixWorldNeedsUpdate],[pt.prototype._setValue_array,pt.prototype._setValue_array_setNeedsUpdate,pt.prototype._setValue_array_setMatrixWorldNeedsUpdate],[pt.prototype._setValue_arrayElement,pt.prototype._setValue_arrayElement_setNeedsUpdate,pt.prototype._setValue_arrayElement_setMatrixWorldNeedsUpdate],[pt.prototype._setValue_fromArray,pt.prototype._setValue_fromArray_setNeedsUpdate,pt.prototype._setValue_fromArray_setMatrixWorldNeedsUpdate]];var nv=new Float32Array(1);var _l=class{static{this.prototype.isMatrix2=!0}constructor(e,t,n,s){this.elements=[1,0,0,1],e!==void 0&&this.set(e,t,n,s)}identity(){return this.set(1,0,0,1),this}fromArray(e,t=0){for(let n=0;n<4;n++)this.elements[n]=e[n+t];return this}set(e,t,n,s){let r=this.elements;return r[0]=e,r[2]=t,r[1]=n,r[3]=s,this}};function jl(i,e,t,n){let s=Of(n);switch(t){case kl:return i*e;case Bl:return i*e/s.components*s.byteLength;case ka:return i*e/s.components*s.byteLength;case Ei:return i*e*2/s.components*s.byteLength;case za:return i*e*2/s.components*s.byteLength;case zl:return i*e*3/s.components*s.byteLength;case On:return i*e*4/s.components*s.byteLength;case Ba:return i*e*4/s.components*s.byteLength;case or:case lr:return Math.floor((i+3)/4)*Math.floor((e+3)/4)*8;case cr:case hr:return Math.floor((i+3)/4)*Math.floor((e+3)/4)*16;case Va:case Wa:return Math.max(i,16)*Math.max(e,8)/4;case Ga:case Ha:return Math.max(i,8)*Math.max(e,8)/2;case Xa:case qa:case Ya:case Za:return Math.floor((i+3)/4)*Math.floor((e+3)/4)*8;case $a:case ur:case Ja:return Math.floor((i+3)/4)*Math.floor((e+3)/4)*16;case Ka:return Math.floor((i+3)/4)*Math.floor((e+3)/4)*16;case ja:return Math.floor((i+4)/5)*Math.floor((e+3)/4)*16;case Qa:return Math.floor((i+4)/5)*Math.floor((e+4)/5)*16;case eo:return Math.floor((i+5)/6)*Math.floor((e+4)/5)*16;case to:return Math.floor((i+5)/6)*Math.floor((e+5)/6)*16;case no:return Math.floor((i+7)/8)*Math.floor((e+4)/5)*16;case io:return Math.floor((i+7)/8)*Math.floor((e+5)/6)*16;case so:return Math.floor((i+7)/8)*Math.floor((e+7)/8)*16;case ro:return Math.floor((i+9)/10)*Math.floor((e+4)/5)*16;case ao:return Math.floor((i+9)/10)*Math.floor((e+5)/6)*16;case oo:return Math.floor((i+9)/10)*Math.floor((e+7)/8)*16;case lo:return Math.floor((i+9)/10)*Math.floor((e+9)/10)*16;case co:return Math.floor((i+11)/12)*Math.floor((e+9)/10)*16;case ho:return Math.floor((i+11)/12)*Math.floor((e+11)/12)*16;case uo:case fo:case po:return Math.ceil(i/4)*Math.ceil(e/4)*16;case mo:case go:return Math.ceil(i/4)*Math.ceil(e/4)*8;case dr:case xo:return Math.ceil(i/4)*Math.ceil(e/4)*16}throw new Error(`Unable to determine texture byte length for ${t} format.`)}function Of(i){switch(i){case fn:case Nl:return{byteLength:1,components:1};case Ts:case Ul:case Fn:return{byteLength:2,components:1};case Fa:case Oa:return{byteLength:2,components:4};case Nn:case Ua:case Un:return{byteLength:4,components:1};case Fl:case Ol:return{byteLength:4,components:3}}throw new Error(`THREE.TextureUtils: Unknown texture type ${i}.`)}typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("register",{detail:{revision:"187"}}));typeof window<"u"&&(window.__THREE__?Le("WARNING: Multiple instances of Three.js being imported."):window.__THREE__="187");function bu(){let i=null,e=!1,t=null,n=null;function s(r,a){n=i.requestAnimationFrame(s),t(r,a)}return{start:function(){e!==!0&&t!==null&&i!==null&&(n=i.requestAnimationFrame(s),e=!0)},stop:function(){i!==null&&i.cancelAnimationFrame(n),e=!1},setAnimationLoop:function(r){t=r},setContext:function(r){i=r}}}function zf(i){let e=new WeakMap;function t(o,l){let c=o.array,h=o.usage,f=c.byteLength,u=i.createBuffer();i.bindBuffer(l,u),i.bufferData(l,c,h),o.onUploadCallback();let p;if(c instanceof Float32Array)p=i.FLOAT;else if(typeof Float16Array<"u"&&c instanceof Float16Array)p=i.HALF_FLOAT;else if(c instanceof Uint16Array)o.isFloat16BufferAttribute?p=i.HALF_FLOAT:p=i.UNSIGNED_SHORT;else if(c instanceof Int16Array)p=i.SHORT;else if(c instanceof Uint32Array)p=i.UNSIGNED_INT;else if(c instanceof Int32Array)p=i.INT;else if(c instanceof Int8Array)p=i.BYTE;else if(c instanceof Uint8Array)p=i.UNSIGNED_BYTE;else if(c instanceof Uint8ClampedArray)p=i.UNSIGNED_BYTE;else throw new Error("THREE.WebGLAttributes: Unsupported buffer data format: "+c);return{buffer:u,type:p,bytesPerElement:c.BYTES_PER_ELEMENT,version:o.version,size:f}}function n(o,l,c){let h=l.array,f=l.updateRanges;if(i.bindBuffer(c,o),f.length===0)i.bufferSubData(c,0,h);else{f.sort((p,d)=>p.start-d.start);let u=0;for(let p=1;p<f.length;p++){let d=f[u],_=f[p];_.start<=d.start+d.count+1?d.count=Math.max(d.count,_.start+_.count-d.start):(++u,f[u]=_)}f.length=u+1;for(let p=0,d=f.length;p<d;p++){let _=f[p];i.bufferSubData(c,_.start*h.BYTES_PER_ELEMENT,h,_.start,_.count)}l.clearUpdateRanges()}l.onUploadCallback()}function s(o){return o.isInterleavedBufferAttribute&&(o=o.data),e.get(o)}function r(o){o.isInterleavedBufferAttribute&&(o=o.data);let l=e.get(o);l&&(i.deleteBuffer(l.buffer),e.delete(o))}function a(o,l){if(o.isInterleavedBufferAttribute&&(o=o.data),o.isGLBufferAttribute){let h=e.get(o);(!h||h.version<o.version)&&e.set(o,{buffer:o.buffer,type:o.type,bytesPerElement:o.elementSize,version:o.version});return}let c=e.get(o);if(c===void 0)e.set(o,t(o,l));else if(c.version<o.version){if(c.size!==o.array.byteLength)throw new Error("THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.");n(c.buffer,o,l),c.version=o.version}}return{get:s,remove:r,update:a}}var Bf=`#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif`,Gf=`#ifdef USE_ALPHAHASH
	const float ALPHA_HASH_SCALE = 0.05;
	float hash2D( vec2 value ) {
		return fract( 1.0e4 * sin( 17.0 * value.x + 0.1 * value.y ) * ( 0.1 + abs( sin( 13.0 * value.y + value.x ) ) ) );
	}
	float hash3D( vec3 value ) {
		return hash2D( vec2( hash2D( value.xy ), value.z ) );
	}
	float getAlphaHashThreshold( vec3 position ) {
		float maxDeriv = max(
			length( dFdx( position.xyz ) ),
			length( dFdy( position.xyz ) )
		);
		float pixScale = 1.0 / ( ALPHA_HASH_SCALE * maxDeriv );
		vec2 pixScales = vec2(
			exp2( floor( log2( pixScale ) ) ),
			exp2( ceil( log2( pixScale ) ) )
		);
		vec2 alpha = vec2(
			hash3D( floor( pixScales.x * position.xyz ) ),
			hash3D( floor( pixScales.y * position.xyz ) )
		);
		float lerpFactor = fract( log2( pixScale ) );
		float x = ( 1.0 - lerpFactor ) * alpha.x + lerpFactor * alpha.y;
		float a = min( lerpFactor, 1.0 - lerpFactor );
		vec3 cases = vec3(
			x * x / ( 2.0 * a * ( 1.0 - a ) ),
			( x - 0.5 * a ) / ( 1.0 - a ),
			1.0 - ( ( 1.0 - x ) * ( 1.0 - x ) / ( 2.0 * a * ( 1.0 - a ) ) )
		);
		float threshold = ( x < ( 1.0 - a ) )
			? ( ( x < a ) ? cases.x : cases.y )
			: cases.z;
		return clamp( threshold , 1.0e-6, 1.0 );
	}
#endif`,Vf=`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`,Hf=`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,Wf=`#ifdef USE_ALPHATEST
	#ifdef ALPHA_TO_COVERAGE
	diffuseColor.a = smoothstep( alphaTest, alphaTest + fwidth( diffuseColor.a ), diffuseColor.a );
	if ( diffuseColor.a == 0.0 ) discard;
	#else
	if ( diffuseColor.a < alphaTest ) discard;
	#endif
#endif`,Xf=`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,qf=`#ifdef USE_AOMAP
	float ambientOcclusion = ( texture2D( aoMap, vAoMapUv ).r - 1.0 ) * aoMapIntensity + 1.0;
	reflectedLight.indirectDiffuse *= ambientOcclusion;
	#if defined( USE_CLEARCOAT ) 
		clearcoatSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_SHEEN ) 
		sheenSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD )
		float dotNV = saturate( dot( geometryNormal, geometryViewDir ) );
		reflectedLight.indirectSpecular *= computeSpecularOcclusion( dotNV, ambientOcclusion, material.roughness );
	#endif
#endif`,$f=`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,Yf=`#ifdef USE_BATCHING
	#if ! defined( GL_ANGLE_multi_draw )
	#define gl_DrawID _gl_DrawID
	uniform int _gl_DrawID;
	#endif
	uniform highp sampler2D batchingTexture;
	uniform highp usampler2D batchingIdTexture;
	mat4 getBatchingMatrix( const in float i ) {
		int size = textureSize( batchingTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( batchingTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( batchingTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( batchingTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( batchingTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
	float getIndirectIndex( const in int i ) {
		int size = textureSize( batchingIdTexture, 0 ).x;
		int x = i % size;
		int y = i / size;
		return float( texelFetch( batchingIdTexture, ivec2( x, y ), 0 ).r );
	}
#endif
#ifdef USE_BATCHING_COLOR
	uniform sampler2D batchingColorTexture;
	vec4 getBatchingColor( const in float i ) {
		int size = textureSize( batchingColorTexture, 0 ).x;
		int j = int( i );
		int x = j % size;
		int y = j / size;
		return texelFetch( batchingColorTexture, ivec2( x, y ), 0 );
	}
#endif`,Zf=`#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( getIndirectIndex( gl_DrawID ) );
#endif`,Jf=`vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif`,Kf=`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,jf=`float G_BlinnPhong_Implicit( ) {
	return 0.25;
}
float D_BlinnPhong( const in float shininess, const in float dotNH ) {
	return RECIPROCAL_PI * ( shininess * 0.5 + 1.0 ) * pow( dotNH, shininess );
}
vec3 BRDF_BlinnPhong( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in vec3 specularColor, const in float shininess ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( specularColor, 1.0, dotVH );
	float G = G_BlinnPhong_Implicit( );
	float D = D_BlinnPhong( shininess, dotNH );
	return F * ( G * D );
} // validated`,Qf=`#ifdef USE_IRIDESCENCE
	const mat3 XYZ_TO_REC709 = mat3(
		 3.2404542, -0.9692660,  0.0556434,
		-1.5371385,  1.8760108, -0.2040259,
		-0.4985314,  0.0415560,  1.0572252
	);
	vec3 Fresnel0ToIor( vec3 fresnel0 ) {
		vec3 sqrtF0 = sqrt( fresnel0 );
		return ( vec3( 1.0 ) + sqrtF0 ) / ( vec3( 1.0 ) - sqrtF0 );
	}
	vec3 IorToFresnel0( vec3 transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - vec3( incidentIor ) ) / ( transmittedIor + vec3( incidentIor ) ) );
	}
	float IorToFresnel0( float transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - incidentIor ) / ( transmittedIor + incidentIor ));
	}
	vec3 evalSensitivity( float OPD, vec3 shift ) {
		float phase = 2.0 * PI * OPD * 1.0e-9;
		vec3 val = vec3( 5.4856e-13, 4.4201e-13, 5.2481e-13 );
		vec3 pos = vec3( 1.6810e+06, 1.7953e+06, 2.2084e+06 );
		vec3 var = vec3( 4.3278e+09, 9.3046e+09, 6.6121e+09 );
		vec3 xyz = val * sqrt( 2.0 * PI * var ) * cos( pos * phase + shift ) * exp( - pow2( phase ) * var );
		xyz.x += 9.7470e-14 * sqrt( 2.0 * PI * 4.5282e+09 ) * cos( 2.2399e+06 * phase + shift[ 0 ] ) * exp( - 4.5282e+09 * pow2( phase ) );
		xyz /= 1.0685e-7;
		vec3 rgb = XYZ_TO_REC709 * xyz;
		return rgb;
	}
	vec3 evalIridescence( float outsideIOR, float eta2, float cosTheta1, float thinFilmThickness, vec3 baseF0 ) {
		vec3 I;
		float iridescenceIOR = mix( outsideIOR, eta2, smoothstep( 0.0, 0.03, thinFilmThickness ) );
		float sinTheta2Sq = pow2( outsideIOR / iridescenceIOR ) * ( 1.0 - pow2( cosTheta1 ) );
		float cosTheta2Sq = 1.0 - sinTheta2Sq;
		if ( cosTheta2Sq < 0.0 ) {
			return vec3( 1.0 );
		}
		float cosTheta2 = sqrt( cosTheta2Sq );
		float R0 = IorToFresnel0( iridescenceIOR, outsideIOR );
		float R12 = F_Schlick( R0, 1.0, cosTheta1 );
		float T121 = 1.0 - R12;
		float phi12 = 0.0;
		if ( iridescenceIOR < outsideIOR ) phi12 = PI;
		float phi21 = PI - phi12;
		vec3 baseIOR = Fresnel0ToIor( clamp( baseF0, 0.0, 0.9999 ) );		vec3 R1 = IorToFresnel0( baseIOR, iridescenceIOR );
		vec3 R23 = F_Schlick( R1, 1.0, cosTheta2 );
		vec3 phi23 = vec3( 0.0 );
		if ( baseIOR[ 0 ] < iridescenceIOR ) phi23[ 0 ] = PI;
		if ( baseIOR[ 1 ] < iridescenceIOR ) phi23[ 1 ] = PI;
		if ( baseIOR[ 2 ] < iridescenceIOR ) phi23[ 2 ] = PI;
		float OPD = 2.0 * iridescenceIOR * thinFilmThickness * cosTheta2;
		vec3 phi = vec3( phi21 ) + phi23;
		vec3 R123 = clamp( R12 * R23, 1e-5, 0.9999 );
		vec3 r123 = sqrt( R123 );
		vec3 Rs = pow2( T121 ) * R23 / ( vec3( 1.0 ) - R123 );
		vec3 C0 = R12 + Rs;
		I = C0;
		vec3 Cm = Rs - T121;
		for ( int m = 1; m <= 2; ++ m ) {
			Cm *= r123;
			vec3 Sm = 2.0 * evalSensitivity( float( m ) * OPD, float( m ) * phi );
			I += Cm * Sm;
		}
		return max( I, vec3( 0.0 ) );
	}
#endif`,ep=`#ifdef USE_BUMPMAP
	uniform sampler2D bumpMap;
	uniform float bumpScale;
	vec2 dHdxy_fwd() {
		vec2 dSTdx = dFdx( vBumpMapUv );
		vec2 dSTdy = dFdy( vBumpMapUv );
		float Hll = bumpScale * texture2D( bumpMap, vBumpMapUv ).x;
		float dBx = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdx ).x - Hll;
		float dBy = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdy ).x - Hll;
		return vec2( dBx, dBy );
	}
	vec3 perturbNormalArb( vec3 surf_pos, vec3 surf_norm, vec2 dHdxy, float faceDirection ) {
		vec3 vSigmaX = normalize( dFdx( surf_pos.xyz ) );
		vec3 vSigmaY = normalize( dFdy( surf_pos.xyz ) );
		vec3 vN = surf_norm;
		vec3 R1 = cross( vSigmaY, vN );
		vec3 R2 = cross( vN, vSigmaX );
		float fDet = dot( vSigmaX, R1 ) * faceDirection;
		vec3 vGrad = sign( fDet ) * ( dHdxy.x * R1 + dHdxy.y * R2 );
		return normalize( abs( fDet ) * surf_norm - vGrad );
	}
#endif`,tp=`#if NUM_CLIPPING_PLANES > 0
	vec4 plane;
	#ifdef ALPHA_TO_COVERAGE
		float distanceToPlane, distanceGradient;
		float clipOpacity = 1.0;
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
			distanceGradient = fwidth( distanceToPlane ) / 2.0;
			clipOpacity *= smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			if ( clipOpacity == 0.0 ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			float unionClipOpacity = 1.0;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
				distanceGradient = fwidth( distanceToPlane ) / 2.0;
				unionClipOpacity *= 1.0 - smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			}
			#pragma unroll_loop_end
			clipOpacity *= 1.0 - unionClipOpacity;
		#endif
		diffuseColor.a *= clipOpacity;
		if ( diffuseColor.a == 0.0 ) discard;
	#else
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			if ( dot( vClipPosition, plane.xyz ) > plane.w ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			bool clipped = true;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				clipped = ( dot( vClipPosition, plane.xyz ) > plane.w ) && clipped;
			}
			#pragma unroll_loop_end
			if ( clipped ) discard;
		#endif
	#endif
#endif`,np=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,ip=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,sp=`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,rp=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#endif`,ap=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#endif`,op=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	varying vec4 vColor;
#endif`,lp=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	vColor = vec4( 1.0 );
#endif
#ifdef USE_COLOR_ALPHA
	vColor *= color;
#elif defined( USE_COLOR )
	vColor.rgb *= color;
#endif
#ifdef USE_INSTANCING_COLOR
	vColor.rgb *= instanceColor.rgb;
#endif
#ifdef USE_BATCHING_COLOR
	vColor *= getBatchingColor( getIndirectIndex( gl_DrawID ) );
#endif`,cp=`#define PI 3.141592653589793
#define PI2 6.283185307179586
#define PI_HALF 1.5707963267948966
#define RECIPROCAL_PI 0.3183098861837907
#define RECIPROCAL_PI2 0.15915494309189535
#define EPSILON 1e-6
#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
#define whiteComplement( a ) ( 1.0 - saturate( a ) )
float pow2( const in float x ) { return x*x; }
vec3 pow2( const in vec3 x ) { return x*x; }
float pow3( const in float x ) { return x*x*x; }
float pow4( const in float x ) { float x2 = x*x; return x2*x2; }
float max3( const in vec3 v ) { return max( max( v.x, v.y ), v.z ); }
float average( const in vec3 v ) { return dot( v, vec3( 0.3333333 ) ); }
highp float rand( const in vec2 uv ) {
	const highp float a = 12.9898, b = 78.233, c = 43758.5453;
	highp float dt = dot( uv.xy, vec2( a,b ) ), sn = mod( dt, PI );
	return fract( sin( sn ) * c );
}
#ifdef HIGH_PRECISION
	float precisionSafeLength( vec3 v ) { return length( v ); }
#else
	float precisionSafeLength( vec3 v ) {
		float maxComponent = max3( abs( v ) );
		return length( v / maxComponent ) * maxComponent;
	}
#endif
struct IncidentLight {
	vec3 color;
	vec3 direction;
	bool visible;
};
struct ReflectedLight {
	vec3 directDiffuse;
	vec3 directSpecular;
	vec3 indirectDiffuse;
	vec3 indirectSpecular;
};
#ifdef USE_ALPHAHASH
	varying vec3 vPosition;
#endif
vec3 transformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );
}
#define inverseTransformDirection transformDirectionByInverseViewMatrix
vec3 transformNormalByInverseViewMatrix( in vec3 normal, in mat4 viewMatrix ) {
	return normalize( ( vec4( normal, 0.0 ) * viewMatrix ).xyz );
}
vec3 transformDirectionByInverseViewMatrix( in vec3 dir, in mat4 viewMatrix ) {
	return normalize( ( vec4( dir, 0.0 ) * viewMatrix ).xyz );
}
bool isPerspectiveMatrix( mat4 m ) {
	return m[ 2 ][ 3 ] == - 1.0;
}
vec2 equirectUv( in vec3 dir ) {
	float u = atan( dir.z, dir.x ) * RECIPROCAL_PI2 + 0.5;
	float v = asin( clamp( dir.y, - 1.0, 1.0 ) ) * RECIPROCAL_PI + 0.5;
	return vec2( u, v );
}
vec3 BRDF_Lambert( const in vec3 diffuseColor ) {
	return RECIPROCAL_PI * diffuseColor;
}
vec3 F_Schlick( const in vec3 f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
}
float F_Schlick( const in float f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
} // validated`,hp=`vec3 transformedNormal = objectNormal;
#ifdef USE_TANGENT
	vec3 transformedTangent = objectTangent;
#endif
#ifdef USE_BATCHING
	mat3 bm = mat3( batchingMatrix );
	transformedNormal /= vec3( dot( bm[ 0 ], bm[ 0 ] ), dot( bm[ 1 ], bm[ 1 ] ), dot( bm[ 2 ], bm[ 2 ] ) );
	transformedNormal = bm * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = bm * transformedTangent;
	#endif
#endif
#ifdef USE_INSTANCING
	mat3 im = mat3( instanceMatrix );
	transformedNormal /= vec3( dot( im[ 0 ], im[ 0 ] ), dot( im[ 1 ], im[ 1 ] ), dot( im[ 2 ], im[ 2 ] ) );
	transformedNormal = im * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = im * transformedTangent;
	#endif
#endif
transformedNormal = normalMatrix * transformedNormal;
#ifdef FLIP_SIDED
	transformedNormal = - transformedNormal;
#endif
#ifdef USE_TANGENT
	transformedTangent = ( modelViewMatrix * vec4( transformedTangent, 0.0 ) ).xyz;
#endif`,up=`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,dp=`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`,fp=`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	#ifdef DECODE_VIDEO_TEXTURE_EMISSIVE
		emissiveColor = sRGBTransferEOTF( emissiveColor );
	#endif
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,pp=`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,mp="gl_FragColor = linearToOutputTexel( gl_FragColor );",gp=`vec4 LinearTransferOETF( in vec4 value ) {
	return value;
}
vec4 sRGBTransferEOTF( in vec4 value ) {
	return vec4( mix( pow( value.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), value.rgb * 0.0773993808, vec3( lessThanEqual( value.rgb, vec3( 0.04045 ) ) ) ), value.a );
}
vec4 sRGBTransferOETF( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}`,xp=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vec3 cameraToFrag;
		if ( isOrthographic ) {
			cameraToFrag = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToFrag = normalize( vWorldPosition - cameraPosition );
		}
		vec3 worldNormal = transformNormalByInverseViewMatrix( normal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vec3 reflectVec = reflect( cameraToFrag, worldNormal );
		#else
			vec3 reflectVec = refract( cameraToFrag, worldNormal, refractionRatio );
		#endif
	#else
		vec3 reflectVec = vReflect;
	#endif
	#ifdef ENVMAP_TYPE_CUBE
		vec4 envColor = textureCube( envMap, envMapRotation * reflectVec );
		#ifdef ENVMAP_BLENDING_MULTIPLY
			outgoingLight = mix( outgoingLight, outgoingLight * envColor.xyz, specularStrength * reflectivity );
		#elif defined( ENVMAP_BLENDING_MIX )
			outgoingLight = mix( outgoingLight, envColor.xyz, specularStrength * reflectivity );
		#elif defined( ENVMAP_BLENDING_ADD )
			outgoingLight += envColor.xyz * specularStrength * reflectivity;
		#endif
	#endif
#endif`,vp=`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform mat3 envMapRotation;
	uniform samplerCube envMap;
	#ifdef ENVMAP_TYPE_PMREM
		float roughnessToMip( const in float roughness ) {
			float r = clamp( roughness, 0.0, 1.0 );
			return ENVMAP_MAX_LOD * r * ( 2.0 - r );
		}
	#endif
#endif`,_p=`#ifdef USE_ENVMAP
	uniform float reflectivity;
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		varying vec3 vWorldPosition;
		uniform float refractionRatio;
	#else
		varying vec3 vReflect;
	#endif
#endif`,yp=`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,Mp=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vWorldPosition = worldPosition.xyz;
	#else
		vec3 cameraToVertex;
		if ( isOrthographic ) {
			cameraToVertex = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToVertex = normalize( worldPosition.xyz - cameraPosition );
		}
		vec3 worldNormal = transformNormalByInverseViewMatrix( transformedNormal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vReflect = reflect( cameraToVertex, worldNormal );
		#else
			vReflect = refract( cameraToVertex, worldNormal, refractionRatio );
		#endif
	#endif
#endif`,bp=`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,Sp=`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,wp=`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,Tp=`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,Ep=`#ifdef USE_GRADIENTMAP
	uniform sampler2D gradientMap;
#endif
vec3 getGradientIrradiance( vec3 normal, vec3 lightDirection ) {
	float dotNL = dot( normal, lightDirection );
	vec2 coord = vec2( dotNL * 0.5 + 0.5, 0.0 );
	#ifdef USE_GRADIENTMAP
		return vec3( texture2D( gradientMap, coord ).r );
	#else
		vec2 fw = fwidth( coord ) * 0.5;
		return mix( vec3( 0.7 ), vec3( 1.0 ), smoothstep( 0.7 - fw.x, 0.7 + fw.x, coord.x ) );
	#endif
}`,Ap=`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,Rp=`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,Cp=`varying vec3 vViewPosition;
struct LambertMaterial {
	vec3 diffuseColor;
	float specularStrength;
};
void RE_Direct_Lambert( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Lambert( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Lambert
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,Pp=`uniform bool receiveShadow;
uniform vec3 ambientLightColor;
#if defined( USE_LIGHT_PROBES )
	uniform vec3 lightProbe[ 9 ];
#endif
vec3 shGetIrradianceAt( in vec3 normal, in vec3 shCoefficients[ 9 ] ) {
	float x = normal.x, y = normal.y, z = normal.z;
	vec3 result = shCoefficients[ 0 ] * 0.886227;
	result += shCoefficients[ 1 ] * 2.0 * 0.511664 * y;
	result += shCoefficients[ 2 ] * 2.0 * 0.511664 * z;
	result += shCoefficients[ 3 ] * 2.0 * 0.511664 * x;
	result += shCoefficients[ 4 ] * 2.0 * 0.429043 * x * y;
	result += shCoefficients[ 5 ] * 2.0 * 0.429043 * y * z;
	result += shCoefficients[ 6 ] * ( 0.743125 * z * z - 0.247708 );
	result += shCoefficients[ 7 ] * 2.0 * 0.429043 * x * z;
	result += shCoefficients[ 8 ] * 0.429043 * ( x * x - y * y );
	return result;
}
vec3 getLightProbeIrradiance( const in vec3 lightProbe[ 9 ], const in vec3 normal ) {
	vec3 worldNormal = transformNormalByInverseViewMatrix( normal, viewMatrix );
	vec3 irradiance = shGetIrradianceAt( worldNormal, lightProbe );
	return irradiance;
}
vec3 getAmbientLightIrradiance( const in vec3 ambientLightColor ) {
	vec3 irradiance = ambientLightColor;
	return irradiance;
}
float getDistanceAttenuation( const in float lightDistance, const in float cutoffDistance, const in float decayExponent ) {
	float distanceFalloff = 1.0 / max( pow( lightDistance, decayExponent ), 0.01 );
	if ( cutoffDistance > 0.0 ) {
		distanceFalloff *= pow2( saturate( 1.0 - pow4( lightDistance / cutoffDistance ) ) );
	}
	return distanceFalloff;
}
float getSpotAttenuation( const in float coneCosine, const in float penumbraCosine, const in float angleCosine ) {
	return smoothstep( coneCosine, penumbraCosine, angleCosine );
}
#if NUM_SUN_LIGHTS > 0
	struct SunLight {
		vec3 direction;
		vec3 color;
	};
	uniform SunLight sunLights[ NUM_SUN_LIGHTS ];
	void getSunLightInfo( const in SunLight sunLight, out IncidentLight light ) {
		light.color = sunLight.color;
		light.direction = sunLight.direction;
		light.visible = true;
	}
#endif
#if NUM_DIR_LIGHTS > 0
	struct DirectionalLight {
		vec3 direction;
		vec3 color;
	};
	uniform DirectionalLight directionalLights[ NUM_DIR_LIGHTS ];
	void getDirectionalLightInfo( const in DirectionalLight directionalLight, out IncidentLight light ) {
		light.color = directionalLight.color;
		light.direction = directionalLight.direction;
		light.visible = true;
	}
#endif
#if NUM_POINT_LIGHTS > 0
	struct PointLight {
		vec3 position;
		vec3 color;
		float distance;
		float decay;
	};
	uniform PointLight pointLights[ NUM_POINT_LIGHTS ];
	void getPointLightInfo( const in PointLight pointLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = pointLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float lightDistance = length( lVector );
		light.color = pointLight.color;
		light.color *= getDistanceAttenuation( lightDistance, pointLight.distance, pointLight.decay );
		light.visible = ( light.color != vec3( 0.0 ) );
	}
#endif
#if NUM_SPOT_LIGHTS > 0
	struct SpotLight {
		vec3 position;
		vec3 direction;
		vec3 color;
		float distance;
		float decay;
		float coneCos;
		float penumbraCos;
	};
	uniform SpotLight spotLights[ NUM_SPOT_LIGHTS ];
	void getSpotLightInfo( const in SpotLight spotLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = spotLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float angleCos = dot( light.direction, spotLight.direction );
		float spotAttenuation = getSpotAttenuation( spotLight.coneCos, spotLight.penumbraCos, angleCos );
		if ( spotAttenuation > 0.0 ) {
			float lightDistance = length( lVector );
			light.color = spotLight.color * spotAttenuation;
			light.color *= getDistanceAttenuation( lightDistance, spotLight.distance, spotLight.decay );
			light.visible = ( light.color != vec3( 0.0 ) );
		} else {
			light.color = vec3( 0.0 );
			light.visible = false;
		}
	}
#endif
#if NUM_RECT_AREA_LIGHTS > 0
	struct RectAreaLight {
		vec3 color;
		vec3 position;
		vec3 halfWidth;
		vec3 halfHeight;
	};
	uniform sampler2D ltc_1;	uniform sampler2D ltc_2;
	uniform RectAreaLight rectAreaLights[ NUM_RECT_AREA_LIGHTS ];
#endif
#if NUM_HEMI_LIGHTS > 0
	struct HemisphereLight {
		vec3 direction;
		vec3 skyColor;
		vec3 groundColor;
	};
	uniform HemisphereLight hemisphereLights[ NUM_HEMI_LIGHTS ];
	vec3 getHemisphereLightIrradiance( const in HemisphereLight hemiLight, const in vec3 normal ) {
		float dotNL = dot( normal, hemiLight.direction );
		float hemiDiffuseWeight = 0.5 * dotNL + 0.5;
		vec3 irradiance = mix( hemiLight.groundColor, hemiLight.skyColor, hemiDiffuseWeight );
		return irradiance;
	}
#endif
#include <lightprobes_pars_fragment>`,Ip=`#ifdef USE_ENVMAP
	vec3 getIBLIrradiance( const in vec3 normal ) {
		#ifdef ENVMAP_TYPE_PMREM
			vec3 worldNormal = transformNormalByInverseViewMatrix( normal, viewMatrix );
			vec4 envMapColor = textureLod( envMap, envMapRotation * worldNormal, ENVMAP_MAX_LOD );
			return PI * envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	vec3 getIBLRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
		#ifdef ENVMAP_TYPE_PMREM
			vec3 reflectVec = reflect( - viewDir, normal );
			reflectVec = normalize( mix( reflectVec, normal, pow4( roughness ) ) );
			reflectVec = transformDirectionByInverseViewMatrix( reflectVec, viewMatrix );
			vec4 envMapColor = textureLod( envMap, envMapRotation * reflectVec, roughnessToMip( roughness ) );
			return envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	#ifdef USE_RETROREFLECTION
		vec3 getIBLRetroRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
			#ifdef ENVMAP_TYPE_PMREM
				vec3 retroVec = normalize( mix( viewDir, normal, pow4( roughness ) ) );
				retroVec = transformDirectionByInverseViewMatrix( retroVec, viewMatrix );
				vec4 envMapColor = textureLod( envMap, envMapRotation * retroVec, roughnessToMip( roughness ) );
				return envMapColor.rgb * envMapIntensity;
			#else
				return vec3( 0.0 );
			#endif
		}
	#endif
	#ifdef USE_ANISOTROPY
		vec3 getIBLAnisotropyRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {
			#ifdef ENVMAP_TYPE_PMREM
				vec3 bentNormal = cross( bitangent, viewDir );
				bentNormal = normalize( cross( bentNormal, bitangent ) );
				bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );
				return getIBLRadiance( viewDir, bentNormal, roughness );
			#else
				return vec3( 0.0 );
			#endif
		}
		#ifdef USE_RETROREFLECTION
			vec3 getIBLAnisotropyRetroRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {
				#ifdef ENVMAP_TYPE_PMREM
					vec3 bentNormal = cross( bitangent, viewDir );
					bentNormal = normalize( cross( bentNormal, bitangent ) );
					bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );
					return getIBLRetroRadiance( viewDir, bentNormal, roughness );
				#else
					return vec3( 0.0 );
				#endif
			}
		#endif
	#endif
#endif`,Lp=`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,Dp=`varying vec3 vViewPosition;
struct ToonMaterial {
	vec3 diffuseColor;
};
void RE_Direct_Toon( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 irradiance = getGradientIrradiance( geometryNormal, directLight.direction ) * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Toon( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Toon
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,Np=`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,Up=`varying vec3 vViewPosition;
struct BlinnPhongMaterial {
	vec3 diffuseColor;
	vec3 specularColor;
	float specularShininess;
	float specularStrength;
};
void RE_Direct_BlinnPhong( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
	reflectedLight.directSpecular += irradiance * BRDF_BlinnPhong( directLight.direction, geometryViewDir, geometryNormal, material.specularColor, material.specularShininess ) * material.specularStrength;
}
void RE_IndirectDiffuse_BlinnPhong( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_BlinnPhong
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,Fp=`PhysicalMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.diffuseContribution = diffuseColor.rgb * ( 1.0 - metalnessFactor );
material.metalness = metalnessFactor;
vec3 dxy = max( abs( dFdx( nonPerturbedNormal ) ), abs( dFdy( nonPerturbedNormal ) ) );
float geometryRoughness = max( max( dxy.x, dxy.y ), dxy.z );
material.roughness = max( roughnessFactor, 0.045 );
material.roughness += geometryRoughness;
material.roughness = min( material.roughness, 1.0 );
#ifdef USE_DIFFUSE_ROUGHNESS
	float diffuseRoughnessFactor = diffuseRoughness;
	#ifdef USE_DIFFUSE_ROUGHNESSMAP
		diffuseRoughnessFactor *= texture2D( diffuseRoughnessMap, vDiffuseRoughnessMapUv ).r;
	#endif
	material.diffuseRoughness = saturate( diffuseRoughnessFactor );
#endif
#ifdef IOR
	material.ior = ior;
	#ifdef USE_SPECULAR
		float specularIntensityFactor = specularIntensity;
		vec3 specularColorFactor = specularColor;
		#ifdef USE_SPECULAR_COLORMAP
			specularColorFactor *= texture2D( specularColorMap, vSpecularColorMapUv ).rgb;
		#endif
		#ifdef USE_SPECULAR_INTENSITYMAP
			specularIntensityFactor *= texture2D( specularIntensityMap, vSpecularIntensityMapUv ).a;
		#endif
		material.specularF90 = mix( specularIntensityFactor, 1.0, metalnessFactor );
	#else
		float specularIntensityFactor = 1.0;
		vec3 specularColorFactor = vec3( 1.0 );
		material.specularF90 = 1.0;
	#endif
	material.specularColor = min( pow2( ( material.ior - 1.0 ) / ( material.ior + 1.0 ) ) * specularColorFactor, vec3( 1.0 ) ) * specularIntensityFactor;
	material.specularColorBlended = mix( material.specularColor, diffuseColor.rgb, metalnessFactor );
#else
	material.specularColor = vec3( 0.04 );
	material.specularColorBlended = mix( material.specularColor, diffuseColor.rgb, metalnessFactor );
	material.specularF90 = 1.0;
#endif
#ifdef USE_CLEARCOAT
	material.clearcoat = clearcoat;
	material.clearcoatRoughness = clearcoatRoughness;
	material.clearcoatF0 = vec3( 0.04 );
	material.clearcoatF90 = 1.0;
	#ifdef USE_CLEARCOATMAP
		material.clearcoat *= texture2D( clearcoatMap, vClearcoatMapUv ).x;
	#endif
	#ifdef USE_CLEARCOAT_ROUGHNESSMAP
		material.clearcoatRoughness *= texture2D( clearcoatRoughnessMap, vClearcoatRoughnessMapUv ).y;
	#endif
	material.clearcoat = saturate( material.clearcoat );	material.clearcoatRoughness = max( material.clearcoatRoughness, 0.045 );
	material.clearcoatRoughness += geometryRoughness;
	material.clearcoatRoughness = min( material.clearcoatRoughness, 1.0 );
#endif
#ifdef USE_DISPERSION
	material.dispersion = dispersion;
#endif
#ifdef USE_RETROREFLECTION
	material.retroreflectivity = retroreflectivity;
#endif
#ifdef USE_IRIDESCENCE
	material.iridescence = iridescence;
	material.iridescenceIOR = iridescenceIOR;
	#ifdef USE_IRIDESCENCEMAP
		material.iridescence *= texture2D( iridescenceMap, vIridescenceMapUv ).r;
	#endif
	#ifdef USE_IRIDESCENCE_THICKNESSMAP
		material.iridescenceThickness = (iridescenceThicknessMaximum - iridescenceThicknessMinimum) * texture2D( iridescenceThicknessMap, vIridescenceThicknessMapUv ).g + iridescenceThicknessMinimum;
	#else
		material.iridescenceThickness = iridescenceThicknessMaximum;
	#endif
#endif
#ifdef USE_SHEEN
	material.sheenColor = sheenColor;
	#ifdef USE_SHEEN_COLORMAP
		material.sheenColor *= texture2D( sheenColorMap, vSheenColorMapUv ).rgb;
	#endif
	material.sheenRoughness = clamp( sheenRoughness, 0.0001, 1.0 );
	#ifdef USE_SHEEN_ROUGHNESSMAP
		material.sheenRoughness *= texture2D( sheenRoughnessMap, vSheenRoughnessMapUv ).a;
	#endif
#endif
#ifdef USE_ANISOTROPY
	#ifdef USE_ANISOTROPYMAP
		mat2 anisotropyMat = mat2( anisotropyVector.x, anisotropyVector.y, - anisotropyVector.y, anisotropyVector.x );
		vec3 anisotropyPolar = texture2D( anisotropyMap, vAnisotropyMapUv ).rgb;
		vec2 anisotropyV = anisotropyMat * normalize( 2.0 * anisotropyPolar.rg - vec2( 1.0 ) ) * anisotropyPolar.b;
	#else
		vec2 anisotropyV = anisotropyVector;
	#endif
	material.anisotropy = length( anisotropyV );
	if( material.anisotropy == 0.0 ) {
		anisotropyV = vec2( 1.0, 0.0 );
	} else {
		anisotropyV /= material.anisotropy;
		material.anisotropy = saturate( material.anisotropy );
	}
	material.alphaT = mix( pow2( material.roughness ), 1.0, pow2( material.anisotropy ) );
	material.anisotropyT = tbn[ 0 ] * anisotropyV.x + tbn[ 1 ] * anisotropyV.y;
	material.anisotropyB = tbn[ 1 ] * anisotropyV.x - tbn[ 0 ] * anisotropyV.y;
#endif`,Op=`uniform sampler2D dfgLUT;
struct PhysicalMaterial {
	vec3 diffuseColor;
	vec3 diffuseContribution;
	vec3 specularColor;
	vec3 specularColorBlended;
	float roughness;
	float metalness;
	float specularF90;
	float dispersion;
	vec2 dfg;
	vec3 multiScatteringCompensation;
	#ifdef USE_DIFFUSE_ROUGHNESS
		float diffuseRoughness;
	#endif
	#ifdef USE_RETROREFLECTION
		float retroreflectivity;
	#endif
	#ifdef USE_CLEARCOAT
		float clearcoat;
		float clearcoatRoughness;
		vec3 clearcoatF0;
		float clearcoatF90;
	#endif
	#ifdef USE_IRIDESCENCE
		float iridescence;
		float iridescenceIOR;
		float iridescenceThickness;
		vec3 iridescenceFresnel;
		vec3 iridescenceF0Dielectric;
		vec3 iridescenceF0Metallic;
	#endif
	#ifdef USE_SHEEN
		vec3 sheenColor;
		float sheenRoughness;
	#endif
	#ifdef IOR
		float ior;
	#endif
	#ifdef USE_TRANSMISSION
		float transmission;
		float transmissionAlpha;
		float thickness;
		float attenuationDistance;
		vec3 attenuationColor;
	#endif
	#ifdef USE_ANISOTROPY
		float anisotropy;
		float alphaT;
		vec3 anisotropyT;
		vec3 anisotropyB;
	#endif
};
vec3 clearcoatSpecularDirect = vec3( 0.0 );
vec3 clearcoatSpecularIndirect = vec3( 0.0 );
vec3 sheenSpecularDirect = vec3( 0.0 );
vec3 sheenSpecularIndirect = vec3(0.0 );
vec3 Schlick_to_F0( const in vec3 f, const in float f90, const in float dotVH ) {
    float x = clamp( 1.0 - dotVH, 0.0, 1.0 );
    float x2 = x * x;
    float x5 = clamp( x * x2 * x2, 0.0, 0.9999 );
    return ( f - vec3( f90 ) * x5 ) / ( 1.0 - x5 );
}
#ifdef USE_DIFFUSE_ROUGHNESS
	const float EON_EPSILON = 1e-7;
	float FON_DirectionalAlbedo( const in float mu, const in float roughness, const in float A ) {
		float muComp = 1.0 - mu;
		float gOverPi = muComp * ( 0.0571085289 + muComp * ( 0.491881867 + muComp * ( - 0.332181442 + muComp * 0.0714429953 ) ) );
		return A * ( 1.0 + roughness * gOverPi );
	}
	vec3 BRDF_EON( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in vec3 diffuseColor, const in float roughness ) {
		vec3 rho = saturate( diffuseColor );
		if ( roughness <= EON_EPSILON ) return BRDF_Lambert( rho );
		float dotNL = saturate( dot( normal, lightDir ) );
		float dotNV = saturate( dot( normal, viewDir ) );
		float s = dot( lightDir, viewDir ) - dotNL * dotNV;
		float sOverT = ( s > 0.0 ) ? s / max( max( dotNL, dotNV ), EON_EPSILON ) : s;
		float A = 1.0 / ( 1.0 + ( 0.5 - 2.0 / ( 3.0 * PI ) ) * roughness );
		vec3 singleScatter = rho * RECIPROCAL_PI * A * ( 1.0 + roughness * sOverT );
		float averageAlbedo = A * ( 1.0 + ( 2.0 / 3.0 - 28.0 / ( 15.0 * PI ) ) * roughness );
		float albedoV = FON_DirectionalAlbedo( dotNV, roughness, A );
		float albedoL = FON_DirectionalAlbedo( dotNL, roughness, A );
		vec3 rhoMultiScatter = rho * rho * averageAlbedo / max( vec3( EON_EPSILON ), vec3( 1.0 ) - rho * ( 1.0 - averageAlbedo ) );
		vec3 multiScatter = rhoMultiScatter * RECIPROCAL_PI
			* max( EON_EPSILON, 1.0 - albedoV )
			* max( EON_EPSILON, 1.0 - albedoL )
			/ max( EON_EPSILON, 1.0 - averageAlbedo );
		return singleScatter + multiScatter;
	}
	vec3 EON_DirectionalAlbedo( const in vec3 diffuseColor, const in float roughness, const in float dotNV ) {
		vec3 rho = saturate( diffuseColor );
		if ( roughness <= EON_EPSILON ) return rho;
		float A = 1.0 / ( 1.0 + ( 0.5 - 2.0 / ( 3.0 * PI ) ) * roughness );
		float directionalAlbedo = FON_DirectionalAlbedo( dotNV, roughness, A );
		float averageAlbedo = A * ( 1.0 + ( 2.0 / 3.0 - 28.0 / ( 15.0 * PI ) ) * roughness );
		vec3 rhoMultiScatter = rho * rho * averageAlbedo / max( vec3( EON_EPSILON ), vec3( 1.0 ) - rho * ( 1.0 - averageAlbedo ) );
		return rho * directionalAlbedo + rhoMultiScatter * ( 1.0 - directionalAlbedo );
	}
#endif
float V_GGX_SmithCorrelated( const in float alpha, const in float dotNL, const in float dotNV ) {
	float a2 = pow2( alpha );
	float gv = dotNL * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNV ) );
	float gl = dotNV * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNL ) );
	return 0.5 / max( gv + gl, EPSILON );
}
float D_GGX( const in float alpha, const in float dotNH ) {
	float a2 = pow2( alpha );
	float denom = pow2( dotNH ) * ( a2 - 1.0 ) + 1.0;
	return RECIPROCAL_PI * a2 / pow2( denom );
}
#ifdef USE_ANISOTROPY
	float V_GGX_SmithCorrelated_Anisotropic( const in float alphaT, const in float alphaB, const in float dotTV, const in float dotBV, const in float dotTL, const in float dotBL, const in float dotNV, const in float dotNL ) {
		float gv = dotNL * length( vec3( alphaT * dotTV, alphaB * dotBV, dotNV ) );
		float gl = dotNV * length( vec3( alphaT * dotTL, alphaB * dotBL, dotNL ) );
		return 0.5 / max( gv + gl, EPSILON );
	}
	float D_GGX_Anisotropic( const in float alphaT, const in float alphaB, const in float dotNH, const in float dotTH, const in float dotBH ) {
		float a2 = alphaT * alphaB;
		highp vec3 v = vec3( alphaB * dotTH, alphaT * dotBH, a2 * dotNH );
		highp float v2 = dot( v, v );
		float w2 = a2 / v2;
		return RECIPROCAL_PI * a2 * pow2 ( w2 );
	}
#endif
#ifdef USE_CLEARCOAT
	vec3 BRDF_GGX_Clearcoat( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material) {
		vec3 f0 = material.clearcoatF0;
		float f90 = material.clearcoatF90;
		float roughness = max( material.clearcoatRoughness, 0.045 );
		float alpha = pow2( roughness );
		vec3 halfDir = normalize( lightDir + viewDir );
		float dotNL = saturate( dot( normal, lightDir ) );
		float dotNV = saturate( dot( normal, viewDir ) );
		float dotNH = saturate( dot( normal, halfDir ) );
		float dotVH = saturate( dot( viewDir, halfDir ) );
		vec3 F = F_Schlick( f0, f90, dotVH );
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
		return F * ( V * D );
	}
#endif
vec3 BRDF_GGX( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material ) {
	vec3 f0 = material.specularColorBlended;
	float f90 = material.specularF90;
	float roughness = max( material.roughness, 0.045 );
	float alpha = pow2( roughness );
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( f0, f90, dotVH );
	#ifdef USE_IRIDESCENCE
		F = mix( F, material.iridescenceFresnel, material.iridescence );
	#endif
	#ifdef USE_ANISOTROPY
		float dotTL = dot( material.anisotropyT, lightDir );
		float dotTV = dot( material.anisotropyT, viewDir );
		float dotTH = dot( material.anisotropyT, halfDir );
		float dotBL = dot( material.anisotropyB, lightDir );
		float dotBV = dot( material.anisotropyB, viewDir );
		float dotBH = dot( material.anisotropyB, halfDir );
		float alphaT = max( material.alphaT, alpha );
		float V = V_GGX_SmithCorrelated_Anisotropic( alphaT, alpha, dotTV, dotBV, dotTL, dotBL, dotNV, dotNL );
		float D = D_GGX_Anisotropic( alphaT, alpha, dotNH, dotTH, dotBH );
	#else
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
	#endif
	return F * ( V * D );
}
vec2 LTC_Uv( const in vec3 N, const in vec3 V, const in float roughness ) {
	const float LUT_SIZE = 64.0;
	const float LUT_SCALE = ( LUT_SIZE - 1.0 ) / LUT_SIZE;
	const float LUT_BIAS = 0.5 / LUT_SIZE;
	float dotNV = saturate( dot( N, V ) );
	vec2 uv = vec2( roughness, sqrt( 1.0 - dotNV ) );
	uv = uv * LUT_SCALE + LUT_BIAS;
	return uv;
}
float LTC_ClippedSphereFormFactor( const in vec3 f ) {
	float l = length( f );
	return max( ( l * l + f.z ) / ( l + 1.0 ), 0.0 );
}
vec3 LTC_EdgeVectorFormFactor( const in vec3 v1, const in vec3 v2 ) {
	float x = dot( v1, v2 );
	float y = abs( x );
	float a = 0.8543985 + ( 0.4965155 + 0.0145206 * y ) * y;
	float b = 3.4175940 + ( 4.1616724 + y ) * y;
	float v = a / b;
	float theta_sintheta = ( x > 0.0 ) ? v : 0.5 * inversesqrt( max( 1.0 - x * x, 1e-7 ) ) - v;
	return cross( v1, v2 ) * theta_sintheta;
}
vec3 LTC_Evaluate( const in vec3 N, const in vec3 V, const in vec3 P, const in mat3 mInv, const in vec3 rectCoords[ 4 ] ) {
	vec3 v1 = rectCoords[ 1 ] - rectCoords[ 0 ];
	vec3 v2 = rectCoords[ 3 ] - rectCoords[ 0 ];
	vec3 lightNormal = cross( v1, v2 );
	if( dot( lightNormal, P - rectCoords[ 0 ] ) < 0.0 ) return vec3( 0.0 );
	vec3 T1, T2;
	T1 = normalize( V - N * dot( V, N ) );
	T2 = - cross( N, T1 );
	mat3 mat = mInv * transpose( mat3( T1, T2, N ) );
	vec3 coords[ 4 ];
	coords[ 0 ] = mat * ( rectCoords[ 0 ] - P );
	coords[ 1 ] = mat * ( rectCoords[ 1 ] - P );
	coords[ 2 ] = mat * ( rectCoords[ 2 ] - P );
	coords[ 3 ] = mat * ( rectCoords[ 3 ] - P );
	coords[ 0 ] = normalize( coords[ 0 ] );
	coords[ 1 ] = normalize( coords[ 1 ] );
	coords[ 2 ] = normalize( coords[ 2 ] );
	coords[ 3 ] = normalize( coords[ 3 ] );
	vec3 vectorFormFactor = vec3( 0.0 );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 0 ], coords[ 1 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 1 ], coords[ 2 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 2 ], coords[ 3 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 3 ], coords[ 0 ] );
	float result = LTC_ClippedSphereFormFactor( vectorFormFactor );
	return vec3( result );
}
#if defined( USE_SHEEN )
float D_Charlie( float roughness, float dotNH ) {
	float alpha = pow2( roughness );
	float invAlpha = 1.0 / alpha;
	float cos2h = dotNH * dotNH;
	float sin2h = max( 1.0 - cos2h, 0.0078125 );
	return ( 2.0 + invAlpha ) * pow( sin2h, invAlpha * 0.5 ) / ( 2.0 * PI );
}
float V_Neubelt( float dotNV, float dotNL ) {
	return saturate( 1.0 / ( 4.0 * ( dotNL + dotNV - dotNL * dotNV ) ) );
}
vec3 BRDF_Sheen( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, vec3 sheenColor, const in float sheenRoughness ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float D = D_Charlie( sheenRoughness, dotNH );
	float V = V_Neubelt( dotNV, dotNL );
	return sheenColor * ( D * V );
}
#endif
float IBLSheenBRDF( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	float r2 = roughness * roughness;
	float rInv = 1.0 / ( roughness + 0.1 );
	float a = -1.9362 + 1.0678 * roughness + 0.4573 * r2 - 0.8469 * rInv;
	float b = -0.6014 + 0.5538 * roughness - 0.4670 * r2 - 0.1255 * rInv;
	float DG = exp( a * dotNV + b );
	return saturate( DG );
}
vec3 EnvironmentBRDF( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	vec2 fab = texture2D( dfgLUT, vec2( roughness, dotNV ) ).rg;
	return specularColor * fab.x + specularF90 * fab.y;
}
#ifdef USE_IRIDESCENCE
void computeMultiscatteringIridescence( const in vec2 fab, const in vec3 specularColor, const in float specularF90, const in float iridescence, const in vec3 iridescenceF0, inout vec3 singleScatter, inout vec3 multiScatter ) {
#else
void computeMultiscattering( const in vec2 fab, const in vec3 specularColor, const in float specularF90, inout vec3 singleScatter, inout vec3 multiScatter ) {
#endif
	#ifdef USE_IRIDESCENCE
		vec3 Fr = mix( specularColor, iridescenceF0, iridescence );
	#else
		vec3 Fr = specularColor;
	#endif
	vec3 FssEss = Fr * fab.x + specularF90 * fab.y;
	float Ess = fab.x + fab.y;
	float Ems = 1.0 - Ess;
	vec3 Favg = Fr + ( 1.0 - Fr ) * 0.047619;	vec3 Fms = FssEss * Favg / ( 1.0 - Ems * Favg );
	singleScatter += FssEss;
	multiScatter += Fms * Ems;
}
#if NUM_RECT_AREA_LIGHTS > 0
	void RE_Direct_RectArea_Physical( const in RectAreaLight rectAreaLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
		vec3 normal = geometryNormal;
		vec3 viewDir = geometryViewDir;
		vec3 position = geometryPosition;
		vec3 lightPos = rectAreaLight.position;
		vec3 halfWidth = rectAreaLight.halfWidth;
		vec3 halfHeight = rectAreaLight.halfHeight;
		vec3 lightColor = rectAreaLight.color;
		float roughness = material.roughness;
		vec3 rectCoords[ 4 ];
		rectCoords[ 0 ] = lightPos + halfWidth - halfHeight;		rectCoords[ 1 ] = lightPos - halfWidth - halfHeight;
		rectCoords[ 2 ] = lightPos - halfWidth + halfHeight;
		rectCoords[ 3 ] = lightPos + halfWidth + halfHeight;
		vec2 uv = LTC_Uv( normal, viewDir, roughness );
		vec4 t1 = texture2D( ltc_1, uv );
		vec4 t2 = texture2D( ltc_2, uv );
		mat3 mInv = mat3(
			vec3( t1.x, 0, t1.y ),
			vec3(    0, 1,    0 ),
			vec3( t1.z, 0, t1.w )
		);
		vec3 fresnel = ( material.specularColorBlended * t2.x + ( material.specularF90 - material.specularColorBlended ) * t2.y );
		reflectedLight.directSpecular += lightColor * fresnel * LTC_Evaluate( normal, viewDir, position, mInv, rectCoords );
		reflectedLight.directDiffuse += lightColor * material.diffuseContribution * LTC_Evaluate( normal, viewDir, position, mat3( 1.0 ), rectCoords );
		#ifdef USE_CLEARCOAT
			vec3 Ncc = geometryClearcoatNormal;
			vec2 uvClearcoat = LTC_Uv( Ncc, viewDir, material.clearcoatRoughness );
			vec4 t1Clearcoat = texture2D( ltc_1, uvClearcoat );
			vec4 t2Clearcoat = texture2D( ltc_2, uvClearcoat );
			mat3 mInvClearcoat = mat3(
				vec3( t1Clearcoat.x, 0, t1Clearcoat.y ),
				vec3(             0, 1,             0 ),
				vec3( t1Clearcoat.z, 0, t1Clearcoat.w )
			);
			vec3 fresnelClearcoat = material.clearcoatF0 * t2Clearcoat.x + ( material.clearcoatF90 - material.clearcoatF0 ) * t2Clearcoat.y;
			clearcoatSpecularDirect += lightColor * fresnelClearcoat * LTC_Evaluate( Ncc, viewDir, position, mInvClearcoat, rectCoords );
		#endif
	}
#endif
void RE_Direct_Physical( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	#ifdef USE_CLEARCOAT
		float dotNLcc = saturate( dot( geometryClearcoatNormal, directLight.direction ) );
		vec3 ccIrradiance = dotNLcc * directLight.color;
		clearcoatSpecularDirect += ccIrradiance * BRDF_GGX_Clearcoat( directLight.direction, geometryViewDir, geometryClearcoatNormal, material );
	#endif
	#ifdef USE_SHEEN
 
 		sheenSpecularDirect += irradiance * BRDF_Sheen( directLight.direction, geometryViewDir, geometryNormal, material.sheenColor, material.sheenRoughness );
 
 		float sheenAlbedoV = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
 		float sheenAlbedoL = IBLSheenBRDF( geometryNormal, directLight.direction, material.sheenRoughness );
 
 		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * max( sheenAlbedoV, sheenAlbedoL );
 
 		irradiance *= sheenEnergyComp;
 
 	#endif
	vec3 specularBRDF = BRDF_GGX( directLight.direction, geometryViewDir, geometryNormal, material );
	#ifdef USE_RETROREFLECTION
		vec3 retroViewDir = reflect( - geometryViewDir, geometryNormal );
		vec3 retroSpecularBRDF = BRDF_GGX( directLight.direction, retroViewDir, geometryNormal, material );
		specularBRDF = mix( specularBRDF, retroSpecularBRDF, saturate( material.retroreflectivity ) );
	#endif
	reflectedLight.directSpecular += irradiance * specularBRDF * material.multiScatteringCompensation;
	vec3 halfDir = normalize( directLight.direction + geometryViewDir );
	float dotVH = saturate( dot( geometryViewDir, halfDir ) );
	vec3 F = F_Schlick( material.specularColor, material.specularF90, dotVH );
	#ifdef USE_RETROREFLECTION
		vec3 retroHalfDir = normalize( directLight.direction + retroViewDir );
		float dotRetroVH = saturate( dot( retroViewDir, retroHalfDir ) );
		vec3 retroF = F_Schlick( material.specularColor, material.specularF90, dotRetroVH );
		F = mix( F, retroF, saturate( material.retroreflectivity ) );
	#endif
	#ifdef USE_DIFFUSE_ROUGHNESS
		vec3 diffuseBRDF = BRDF_EON( directLight.direction, geometryViewDir, geometryNormal, material.diffuseColor, material.diffuseRoughness ) * ( 1.0 - material.metalness );
	#else
		vec3 diffuseBRDF = BRDF_Lambert( material.diffuseContribution );
	#endif
	reflectedLight.directDiffuse += irradiance * diffuseBRDF * ( 1.0 - F );
}
void RE_IndirectDiffuse_Physical( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 singleScattering = vec3( 0.0 );
	vec3 multiScattering = vec3( 0.0 );
	#ifdef USE_IRIDESCENCE
		computeMultiscatteringIridescence( material.dfg, material.specularColor, material.specularF90, material.iridescence, material.iridescenceF0Dielectric, singleScattering, multiScattering );
	#else
		computeMultiscattering( material.dfg, material.specularColor, material.specularF90, singleScattering, multiScattering );
	#endif
	#ifdef USE_DIFFUSE_ROUGHNESS
		float dotNV = saturate( dot( geometryNormal, geometryViewDir ) );
		vec3 diffuseAlbedo = EON_DirectionalAlbedo( material.diffuseColor, material.diffuseRoughness, dotNV ) * ( 1.0 - material.metalness );
		vec3 diffuse = irradiance * RECIPROCAL_PI * diffuseAlbedo * ( 1.0 - singleScattering - multiScattering );
	#else
		vec3 diffuse = irradiance * BRDF_Lambert( material.diffuseContribution ) * ( 1.0 - singleScattering - multiScattering );
	#endif
	#ifdef USE_SHEEN
		float sheenAlbedo = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
		sheenSpecularIndirect += irradiance * material.sheenColor * sheenAlbedo * RECIPROCAL_PI;
		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * sheenAlbedo;
		diffuse *= sheenEnergyComp;
	#endif
	reflectedLight.indirectDiffuse += diffuse;
}
void RE_IndirectSpecular_Physical( const in vec3 radiance, const in vec3 irradiance, const in vec3 clearcoatRadiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight) {
	#ifdef USE_CLEARCOAT
		clearcoatSpecularIndirect += clearcoatRadiance * EnvironmentBRDF( geometryClearcoatNormal, geometryViewDir, material.clearcoatF0, material.clearcoatF90, material.clearcoatRoughness );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularIndirect += irradiance * material.sheenColor * IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness ) * RECIPROCAL_PI;
 	#endif
	vec3 singleScatteringDielectric = vec3( 0.0 );
	vec3 multiScatteringDielectric = vec3( 0.0 );
	vec3 singleScatteringMetallic = vec3( 0.0 );
	vec3 multiScatteringMetallic = vec3( 0.0 );
	#ifdef USE_IRIDESCENCE
		computeMultiscatteringIridescence( material.dfg, material.specularColor, material.specularF90, material.iridescence, material.iridescenceF0Dielectric, singleScatteringDielectric, multiScatteringDielectric );
		computeMultiscatteringIridescence( material.dfg, material.diffuseColor, material.specularF90, material.iridescence, material.iridescenceF0Metallic, singleScatteringMetallic, multiScatteringMetallic );
	#else
		computeMultiscattering( material.dfg, material.specularColor, material.specularF90, singleScatteringDielectric, multiScatteringDielectric );
		computeMultiscattering( material.dfg, material.diffuseColor, material.specularF90, singleScatteringMetallic, multiScatteringMetallic );
	#endif
	vec3 singleScattering = mix( singleScatteringDielectric, singleScatteringMetallic, material.metalness );
	vec3 multiScattering = mix( multiScatteringDielectric, multiScatteringMetallic, material.metalness );
	vec3 totalScatteringDielectric = singleScatteringDielectric + multiScatteringDielectric;
	#ifdef USE_DIFFUSE_ROUGHNESS
		float dotNV = saturate( dot( geometryNormal, geometryViewDir ) );
		vec3 diffuse = EON_DirectionalAlbedo( material.diffuseColor, material.diffuseRoughness, dotNV ) * ( 1.0 - material.metalness ) * ( 1.0 - totalScatteringDielectric );
	#else
		vec3 diffuse = material.diffuseContribution * ( 1.0 - totalScatteringDielectric );
	#endif
	vec3 cosineWeightedIrradiance = irradiance * RECIPROCAL_PI;
	vec3 indirectSpecular = radiance * singleScattering;
	indirectSpecular += multiScattering * cosineWeightedIrradiance;
	vec3 indirectDiffuse = diffuse * cosineWeightedIrradiance;
	#ifdef USE_SHEEN
		float sheenAlbedo = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * sheenAlbedo;
		indirectSpecular *= sheenEnergyComp;
		indirectDiffuse *= sheenEnergyComp;
	#endif
	reflectedLight.indirectSpecular += indirectSpecular;
	reflectedLight.indirectDiffuse += indirectDiffuse;
}
#define RE_Direct				RE_Direct_Physical
#define RE_Direct_RectArea		RE_Direct_RectArea_Physical
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Physical
#define RE_IndirectSpecular		RE_IndirectSpecular_Physical
float computeSpecularOcclusion( const in float dotNV, const in float ambientOcclusion, const in float roughness ) {
	return saturate( pow( dotNV + ambientOcclusion, exp2( - 16.0 * roughness - 1.0 ) ) - 1.0 + ambientOcclusion );
}`,kp=`
vec3 geometryPosition = - vViewPosition;
vec3 geometryNormal = normal;
vec3 geometryViewDir = ( isOrthographic ) ? vec3( 0, 0, 1 ) : normalize( vViewPosition );
vec3 geometryClearcoatNormal = vec3( 0.0 );
#ifdef USE_CLEARCOAT
	geometryClearcoatNormal = clearcoatNormal;
#endif
#ifdef USE_IRIDESCENCE
	float dotNVi = saturate( dot( normal, geometryViewDir ) );
	if ( material.iridescenceThickness == 0.0 ) {
		material.iridescence = 0.0;
	} else {
		material.iridescence = saturate( material.iridescence );
	}
	if ( material.iridescence > 0.0 ) {
		vec3 iridescenceFresnelDielectric = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.specularColor );
		vec3 iridescenceFresnelMetallic = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.diffuseColor );
		material.iridescenceFresnel = mix( iridescenceFresnelDielectric, iridescenceFresnelMetallic, material.metalness );
		material.iridescenceF0Dielectric = Schlick_to_F0( iridescenceFresnelDielectric, 1.0, dotNVi );
		material.iridescenceF0Metallic = Schlick_to_F0( iridescenceFresnelMetallic, 1.0, dotNVi );
	}
#endif
#ifdef STANDARD
	float dotNVms = saturate( dot( geometryNormal, geometryViewDir ) );
	material.dfg = texture2D( dfgLUT, vec2( material.roughness, dotNVms ) ).rg;
	#if ( NUM_SUN_LIGHTS > 0 || NUM_DIR_LIGHTS > 0 || NUM_POINT_LIGHTS > 0 || NUM_SPOT_LIGHTS > 0 )
		float EssMs = material.dfg.x + material.dfg.y;
		material.multiScatteringCompensation = 1.0 + material.specularColorBlended * ( 1.0 / EssMs - 1.0 );
	#endif
#endif
IncidentLight directLight;
#if ( NUM_POINT_LIGHTS > 0 ) && defined( RE_Direct )
	PointLight pointLight;
	#if defined( USE_SHADOWMAP ) && NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHTS; i ++ ) {
		pointLight = pointLights[ i ];
		getPointLightInfo( pointLight, geometryPosition, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_POINT_LIGHT_SHADOWS ) && ( defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_BASIC ) )
		pointLightShadow = pointLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getPointShadow( pointShadowMap[ i ], pointLightShadow.shadowMapSize, pointLightShadow.shadowIntensity, pointLightShadow.shadowBias, pointLightShadow.shadowRadius, vPointShadowCoord[ i ], pointLightShadow.shadowCameraNear, pointLightShadow.shadowCameraFar ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_SPOT_LIGHTS > 0 ) && defined( RE_Direct )
	SpotLight spotLight;
	vec4 spotColor;
	vec3 spotLightCoord;
	bool inSpotLightMap;
	#if defined( USE_SHADOWMAP ) && NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHTS; i ++ ) {
		spotLight = spotLights[ i ];
		getSpotLightInfo( spotLight, geometryPosition, directLight );
		#if ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#define SPOT_LIGHT_MAP_INDEX UNROLLED_LOOP_INDEX
		#elif ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		#define SPOT_LIGHT_MAP_INDEX NUM_SPOT_LIGHT_MAPS
		#else
		#define SPOT_LIGHT_MAP_INDEX ( UNROLLED_LOOP_INDEX - NUM_SPOT_LIGHT_SHADOWS + NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#endif
		#if ( SPOT_LIGHT_MAP_INDEX < NUM_SPOT_LIGHT_MAPS )
			spotLightCoord = vSpotLightCoord[ i ].xyz / vSpotLightCoord[ i ].w;
			inSpotLightMap = all( lessThan( abs( spotLightCoord * 2. - 1. ), vec3( 1.0 ) ) );
			spotColor = texture2D( spotLightMap[ SPOT_LIGHT_MAP_INDEX ], spotLightCoord.xy );
			directLight.color = inSpotLightMap ? directLight.color * spotColor.rgb : directLight.color;
		#endif
		#undef SPOT_LIGHT_MAP_INDEX
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		spotLightShadow = spotLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( spotShadowMap[ i ], spotLightShadow.shadowMapSize, spotLightShadow.shadowIntensity, spotLightShadow.shadowBias, spotLightShadow.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_SUN_LIGHTS > 0 ) && defined( RE_Direct )
	SunLight sunLight;
	#if defined( USE_SHADOWMAP ) && NUM_SUN_LIGHT_SHADOWS > 0
	SunLightShadow sunLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SUN_LIGHTS; i ++ ) {
		sunLight = sunLights[ i ];
		getSunLightInfo( sunLight, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SUN_LIGHT_SHADOWS )
		sunLightShadow = sunLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getSunShadow( sunShadowMap[ i ], sunLightShadow, UNROLLED_LOOP_INDEX ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_DIR_LIGHTS > 0 ) && defined( RE_Direct )
	DirectionalLight directionalLight;
	#if defined( USE_SHADOWMAP ) && NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {
		directionalLight = directionalLights[ i ];
		getDirectionalLightInfo( directionalLight, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_DIR_LIGHT_SHADOWS )
		directionalLightShadow = directionalLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( directionalShadowMap[ i ], directionalLightShadow.shadowMapSize, directionalLightShadow.shadowIntensity, directionalLightShadow.shadowBias, directionalLightShadow.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_RECT_AREA_LIGHTS > 0 ) && defined( RE_Direct_RectArea )
	RectAreaLight rectAreaLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_RECT_AREA_LIGHTS; i ++ ) {
		rectAreaLight = rectAreaLights[ i ];
		RE_Direct_RectArea( rectAreaLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if defined( RE_IndirectDiffuse )
	vec3 iblIrradiance = vec3( 0.0 );
	vec3 irradiance = getAmbientLightIrradiance( ambientLightColor );
	#if defined( USE_LIGHT_PROBES )
		irradiance += getLightProbeIrradiance( lightProbe, geometryNormal );
	#endif
	#if ( NUM_HEMI_LIGHTS > 0 )
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_HEMI_LIGHTS; i ++ ) {
			irradiance += getHemisphereLightIrradiance( hemisphereLights[ i ], geometryNormal );
		}
		#pragma unroll_loop_end
	#endif
	#if NUM_LIGHT_PROBE_GRIDS > 0
		vec3 probeWorldPos = ( ( vec4( geometryPosition, 1.0 ) - viewMatrix[ 3 ] ) * viewMatrix ).xyz;
		vec3 probeWorldNormal = transformNormalByInverseViewMatrix( geometryNormal, viewMatrix );
		int probeGrid = - 1;
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_LIGHT_PROBE_GRIDS; i ++ ) {
			if ( isInsideLightProbeGrid( probeWorldPos, probeWorldNormal, probesMin[ i ], probesMax[ i ], probesResolution[ i ] ) ) probeGrid = UNROLLED_LOOP_INDEX;
		}
		#pragma unroll_loop_end
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_LIGHT_PROBE_GRIDS; i ++ ) {
			if ( probeGrid == UNROLLED_LOOP_INDEX ) irradiance += getLightProbeGridIrradiance( probesSH[ i ], probesMin[ i ], probesMax[ i ], probesResolution[ i ], probeWorldPos, probeWorldNormal );
		}
		#pragma unroll_loop_end
	#endif
#endif
#if defined( RE_IndirectSpecular )
	vec3 radiance = vec3( 0.0 );
	vec3 clearcoatRadiance = vec3( 0.0 );
#endif`,zp=`#if defined( RE_IndirectDiffuse )
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		vec3 lightMapIrradiance = lightMapTexel.rgb * lightMapIntensity;
		irradiance += lightMapIrradiance;
	#endif
	#if defined( USE_ENVMAP ) && defined( ENVMAP_TYPE_PMREM )
		#if defined( STANDARD ) || defined( LAMBERT ) || defined( PHONG )
			iblIrradiance += getIBLIrradiance( geometryNormal );
		#endif
	#endif
#endif
#if defined( USE_ENVMAP ) && defined( RE_IndirectSpecular )
	#ifdef USE_ANISOTROPY
		vec3 iblRadiance = getIBLAnisotropyRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );
	#else
		vec3 iblRadiance = getIBLRadiance( geometryViewDir, geometryNormal, material.roughness );
	#endif
	#ifdef USE_RETROREFLECTION
		#ifdef USE_ANISOTROPY
			vec3 retroIBLRadiance = getIBLAnisotropyRetroRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );
		#else
			vec3 retroIBLRadiance = getIBLRetroRadiance( geometryViewDir, geometryNormal, material.roughness );
		#endif
		iblRadiance = mix( iblRadiance, retroIBLRadiance, saturate( material.retroreflectivity ) );
	#endif
	radiance += iblRadiance;
	#ifdef USE_CLEARCOAT
		clearcoatRadiance += getIBLRadiance( geometryViewDir, geometryClearcoatNormal, material.clearcoatRoughness );
	#endif
#endif`,Bp=`#if defined( RE_IndirectDiffuse )
	#if defined( LAMBERT ) || defined( PHONG )
		irradiance += iblIrradiance;
	#endif
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`,Gp=`#if NUM_LIGHT_PROBE_GRIDS > 0
uniform highp sampler3D probesSH[ NUM_LIGHT_PROBE_GRIDS ];
uniform vec3 probesMin[ NUM_LIGHT_PROBE_GRIDS ];
uniform vec3 probesMax[ NUM_LIGHT_PROBE_GRIDS ];
uniform vec3 probesResolution[ NUM_LIGHT_PROBE_GRIDS ];
bool isInsideLightProbeGrid( vec3 worldPos, vec3 worldNormal, vec3 probesMin, vec3 probesMax, vec3 probesResolution ) {
	vec3 spacing = ( probesMax - probesMin ) / probesResolution;
	vec3 samplePos = worldPos + worldNormal * spacing * 0.5;
	vec3 margin = spacing * 0.01;
	return all( greaterThanEqual( samplePos, probesMin - margin ) ) && all( lessThanEqual( samplePos, probesMax + margin ) );
}
vec3 getLightProbeGridIrradiance( highp sampler3D probesSH, vec3 probesMin, vec3 probesMax, vec3 probesResolution, vec3 worldPos, vec3 worldNormal ) {
	vec3 res = probesResolution;
	vec3 gridRange = probesMax - probesMin;
	vec3 probeSpacing = gridRange / res;
	vec3 samplePos = worldPos + worldNormal * probeSpacing * 0.5;
	vec3 uvw = clamp( ( samplePos - probesMin ) / gridRange, 0.5 / res, 1.0 - 0.5 / res );
	float nz          = res.z;
	float paddedSlices = nz + 2.0;
	float atlasDepth  = 7.0 * paddedSlices;
	float uvZBase     = uvw.z * nz + 1.0;
	vec4 s0 = texture( probesSH, vec3( uvw.xy, ( uvZBase                       ) / atlasDepth ) );
	vec4 s1 = texture( probesSH, vec3( uvw.xy, ( uvZBase +       paddedSlices   ) / atlasDepth ) );
	vec4 s2 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 2.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s3 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 3.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s4 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 4.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s5 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 5.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s6 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 6.0 * paddedSlices   ) / atlasDepth ) );
	vec3 c0 = s0.xyz;
	vec3 c1 = vec3( s0.w, s1.xy );
	vec3 c2 = vec3( s1.zw, s2.x );
	vec3 c3 = s2.yzw;
	vec3 c4 = s3.xyz;
	vec3 c5 = vec3( s3.w, s4.xy );
	vec3 c6 = vec3( s4.zw, s5.x );
	vec3 c7 = s5.yzw;
	vec3 c8 = s6.xyz;
	float x = worldNormal.x, y = worldNormal.y, z = worldNormal.z;
	vec3 result = c0 * 0.886227;
	result += c1 * 2.0 * 0.511664 * y;
	result += c2 * 2.0 * 0.511664 * z;
	result += c3 * 2.0 * 0.511664 * x;
	result += c4 * 2.0 * 0.429043 * x * y;
	result += c5 * 2.0 * 0.429043 * y * z;
	result += c6 * ( 0.743125 * z * z - 0.247708 );
	result += c7 * 2.0 * 0.429043 * x * z;
	result += c8 * 0.429043 * ( x * x - y * y );
	return max( result, vec3( 0.0 ) );
}
#endif`,Vp=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	gl_FragDepth = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,Hp=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,Wp=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,Xp=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	vFragDepth = 1.0 + gl_Position.w;
	vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
#endif`,qp=`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = sRGBTransferEOTF( sampledDiffuseColor );
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,$p=`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,Yp=`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
	#if defined( USE_POINTS_UV )
		vec2 uv = vUv;
	#else
		vec2 uv = ( uvTransform * vec3( gl_PointCoord.x, 1.0 - gl_PointCoord.y, 1 ) ).xy;
	#endif
#endif
#ifdef USE_MAP
	diffuseColor *= texture2D( map, uv );
#endif
#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, uv ).g;
#endif`,Zp=`#if defined( USE_POINTS_UV )
	varying vec2 vUv;
#else
	#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
		uniform mat3 uvTransform;
	#endif
#endif
#ifdef USE_MAP
	uniform sampler2D map;
#endif
#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,Jp=`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`,Kp=`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,jp=`#ifdef USE_INSTANCING_MORPH
	float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	float morphTargetBaseInfluence = texelFetch( morphTexture, ivec2( 0, gl_InstanceID ), 0 ).r;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		morphTargetInfluences[i] =  texelFetch( morphTexture, ivec2( i + 1, gl_InstanceID ), 0 ).r;
	}
#endif`,Qp=`#if defined( USE_MORPHCOLORS )
	#if defined( USE_COLOR_ALPHA )
		vColor *= morphTargetBaseInfluence;
	#elif defined( USE_COLOR )
		vColor.rgb *= morphTargetBaseInfluence;
	#endif
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor.rgb += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`,em=`#ifdef USE_MORPHNORMALS
	objectNormal *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,tm=`#ifdef USE_MORPHTARGETS
	#ifndef USE_INSTANCING_MORPH
		uniform float morphTargetBaseInfluence;
		uniform float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	#endif
	uniform sampler2DArray morphTargetsTexture;
	uniform ivec2 morphTargetsTextureSize;
	vec4 getMorph( const in int vertexIndex, const in int morphTargetIndex, const in int offset ) {
		int texelIndex = vertexIndex * MORPHTARGETS_TEXTURE_STRIDE + offset;
		int y = texelIndex / morphTargetsTextureSize.x;
		int x = texelIndex - y * morphTargetsTextureSize.x;
		ivec3 morphUV = ivec3( x, y, morphTargetIndex );
		return texelFetch( morphTargetsTexture, morphUV, 0 );
	}
#endif`,nm=`#ifdef USE_MORPHTARGETS
	transformed *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,im=`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
#ifdef FLAT_SHADED
	vec3 fdx = dFdx( vViewPosition );
	vec3 fdy = dFdy( vViewPosition );
	vec3 normal = normalize( cross( fdx, fdy ) );
#else
	vec3 normal = normalize( vNormal );
	#ifdef DOUBLE_SIDED
		normal *= faceDirection;
	#endif
#endif
#if defined( USE_NORMALMAP_TANGENTSPACE ) || defined( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY )
	#ifdef USE_TANGENT
		mat3 tbn = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn = getTangentFrame( - vViewPosition, normal,
		#if defined( USE_NORMALMAP )
			vNormalMapUv
		#elif defined( USE_CLEARCOAT_NORMALMAP )
			vClearcoatNormalMapUv
		#else
			vUv
		#endif
		);
	#endif
	#ifdef DOUBLE_SIDED
		tbn[0] *= faceDirection;
		tbn[1] *= faceDirection;
	#endif
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	#ifdef USE_TANGENT
		mat3 tbn2 = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn2 = getTangentFrame( - vViewPosition, normal, vClearcoatNormalMapUv );
	#endif
	#ifdef DOUBLE_SIDED
		tbn2[0] *= faceDirection;
		tbn2[1] *= faceDirection;
	#endif
#endif
vec3 nonPerturbedNormal = normal;`,sm=`#ifdef USE_NORMALMAP_OBJECTSPACE
	normal = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	#ifdef FLIP_SIDED
		normal = - normal;
	#endif
	#ifdef DOUBLE_SIDED
		normal = normal * faceDirection;
	#endif
	normal = normalize( normalMatrix * normal );
#elif defined( USE_NORMALMAP_TANGENTSPACE )
	vec3 mapN = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	#if defined( USE_PACKED_NORMALMAP )
		mapN = vec3( mapN.xy, sqrt( saturate( 1.0 - dot( mapN.xy, mapN.xy ) ) ) );
	#endif
	mapN.xy *= normalScale;
	normal = normalize( tbn * mapN );
#elif defined( USE_BUMPMAP )
	normal = perturbNormalArb( - vViewPosition, normal, dHdxy_fwd(), faceDirection );
#endif`,rm=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,am=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,om=`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
		#ifdef FLIP_SIDED
			vBitangent = - vBitangent;
		#endif
	#endif
#endif`,lm=`#ifdef USE_NORMALMAP
	uniform sampler2D normalMap;
	uniform vec2 normalScale;
#endif
#ifdef USE_NORMALMAP_OBJECTSPACE
	uniform mat3 normalMatrix;
#endif
#if ! defined ( USE_TANGENT ) && ( defined ( USE_NORMALMAP_TANGENTSPACE ) || defined ( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY ) )
	mat3 getTangentFrame( vec3 eye_pos, vec3 surf_norm, vec2 uv ) {
		vec3 q0 = dFdx( eye_pos.xyz );
		vec3 q1 = dFdy( eye_pos.xyz );
		vec2 st0 = dFdx( uv.st );
		vec2 st1 = dFdy( uv.st );
		vec3 N = surf_norm;
		vec3 q1perp = cross( q1, N );
		vec3 q0perp = cross( N, q0 );
		vec3 T = q1perp * st0.x + q0perp * st1.x;
		vec3 B = q1perp * st0.y + q0perp * st1.y;
		float det = max( dot( T, T ), dot( B, B ) );
		float scale = ( det == 0.0 ) ? 0.0 : inversesqrt( det );
		return mat3( T * scale, B * scale, N );
	}
#endif`,cm=`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif`,hm=`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`,um=`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`,dm=`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,fm=`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,pm=`vec3 packNormalToRGB( const in vec3 normal ) {
	return normalize( normal ) * 0.5 + 0.5;
}
vec3 unpackRGBToNormal( const in vec3 rgb ) {
	return 2.0 * rgb.xyz - 1.0;
}
const float PackUpscale = 256. / 255.;const float UnpackDownscale = 255. / 256.;const float ShiftRight8 = 1. / 256.;
const float Inv255 = 1. / 255.;
const vec4 PackFactors = vec4( 1.0, 256.0, 256.0 * 256.0, 256.0 * 256.0 * 256.0 );
const vec2 UnpackFactors2 = vec2( UnpackDownscale, 1.0 / PackFactors.g );
const vec3 UnpackFactors3 = vec3( UnpackDownscale / PackFactors.rg, 1.0 / PackFactors.b );
const vec4 UnpackFactors4 = vec4( UnpackDownscale / PackFactors.rgb, 1.0 / PackFactors.a );
vec4 packDepthToRGBA( const in float v ) {
	if( v <= 0.0 )
		return vec4( 0., 0., 0., 0. );
	if( v >= 1.0 )
		return vec4( 1., 1., 1., 1. );
	float vuf;
	float af = modf( v * PackFactors.a, vuf );
	float bf = modf( vuf * ShiftRight8, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec4( vuf * Inv255, gf * PackUpscale, bf * PackUpscale, af );
}
vec3 packDepthToRGB( const in float v ) {
	if( v <= 0.0 )
		return vec3( 0., 0., 0. );
	if( v >= 1.0 )
		return vec3( 1., 1., 1. );
	float vuf;
	float bf = modf( v * PackFactors.b, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec3( vuf * Inv255, gf * PackUpscale, bf );
}
vec2 packDepthToRG( const in float v ) {
	if( v <= 0.0 )
		return vec2( 0., 0. );
	if( v >= 1.0 )
		return vec2( 1., 1. );
	float vuf;
	float gf = modf( v * 256., vuf );
	return vec2( vuf * Inv255, gf );
}
float unpackRGBAToDepth( const in vec4 v ) {
	return dot( v, UnpackFactors4 );
}
float unpackRGBToDepth( const in vec3 v ) {
	return dot( v, UnpackFactors3 );
}
float unpackRGToDepth( const in vec2 v ) {
	return v.r * UnpackFactors2.r + v.g * UnpackFactors2.g;
}
vec4 pack2HalfToRGBA( const in vec2 v ) {
	vec4 r = vec4( v.x, fract( v.x * 255.0 ), v.y, fract( v.y * 255.0 ) );
	return vec4( r.x - r.y / 255.0, r.y, r.z - r.w / 255.0, r.w );
}
vec2 unpackRGBATo2Half( const in vec4 v ) {
	return vec2( v.x + ( v.y / 255.0 ), v.z + ( v.w / 255.0 ) );
}
float viewZToOrthographicDepth( const in float viewZ, const in float near, const in float far ) {
	return ( viewZ + near ) / ( near - far );
}
float orthographicDepthToViewZ( const in float depth, const in float near, const in float far ) {
	#ifdef USE_REVERSED_DEPTH_BUFFER
	
		return depth * ( far - near ) - far;
	#else
		return depth * ( near - far ) - near;
	#endif
}
float viewZToPerspectiveDepth( const in float viewZ, const in float near, const in float far ) {
	return ( ( near + viewZ ) * far ) / ( ( far - near ) * viewZ );
}
float perspectiveDepthToViewZ( const in float depth, const in float near, const in float far ) {
	
	#ifdef USE_REVERSED_DEPTH_BUFFER
		return ( near * far ) / ( ( near - far ) * depth - near );
	#else
		return ( near * far ) / ( ( far - near ) * depth - far );
	#endif
}`,mm=`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,gm=`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,xm=`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,vm=`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,_m=`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`,ym=`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,Mm=`#if NUM_SPOT_LIGHT_COORDS > 0
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#if NUM_SPOT_LIGHT_MAPS > 0
	uniform sampler2D spotLightMap[ NUM_SPOT_LIGHT_MAPS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_SUN_LIGHT_SHADOWS > 0
		#define SUN_LIGHT_CASCADES 2
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform sampler2DShadow sunShadowMap[ NUM_SUN_LIGHT_SHADOWS ];
		#else
			uniform sampler2D sunShadowMap[ NUM_SUN_LIGHT_SHADOWS ];
		#endif
		uniform mat4 sunShadowMatrix[ NUM_SUN_LIGHT_SHADOWS * SUN_LIGHT_CASCADES ];
		uniform vec4 sunShadowCascade[ NUM_SUN_LIGHT_SHADOWS * SUN_LIGHT_CASCADES ];
		varying vec4 vSunShadowWorldPosition;
		varying vec3 vSunShadowWorldNormal;
		struct SunLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SunLightShadow sunLightShadows[ NUM_SUN_LIGHT_SHADOWS ];
	#endif
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform sampler2DShadow directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		#else
			uniform sampler2D directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		#endif
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform sampler2DShadow spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		#else
			uniform sampler2D spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		#endif
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform samplerCubeShadow pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		#elif defined( SHADOWMAP_TYPE_BASIC )
			uniform samplerCube pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		#endif
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
	#if defined( SHADOWMAP_TYPE_PCF )
		float interleavedGradientNoise( vec2 position ) {
			return fract( 52.9829189 * fract( dot( position, vec2( 0.06711056, 0.00583715 ) ) ) );
		}
		vec2 vogelDiskSample( int sampleIndex, int samplesCount, float phi ) {
			const float goldenAngle = 2.399963229728653;
			float r = sqrt( ( float( sampleIndex ) + 0.5 ) / float( samplesCount ) );
			float theta = float( sampleIndex ) * goldenAngle + phi;
			return vec2( cos( theta ), sin( theta ) ) * r;
		}
	#endif
	#if defined( SHADOWMAP_TYPE_PCF )
		float getShadow( sampler2DShadow shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				shadowCoord.z -= shadowBias;
			#else
				shadowCoord.z += shadowBias;
			#endif
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
				vec2 radius = shadowRadius * texelSize;
				float phi = interleavedGradientNoise( gl_FragCoord.xy ) * PI2;
				shadow = (
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 0, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 1, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 2, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 3, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 4, 5, phi ) * radius, shadowCoord.z ) )
				) * 0.2;
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#elif defined( SHADOWMAP_TYPE_VSM )
		float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				shadowCoord.z -= shadowBias;
			#else
				shadowCoord.z += shadowBias;
			#endif
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				vec2 distribution = texture2D( shadowMap, shadowCoord.xy ).rg;
				float mean = distribution.x;
				float variance = distribution.y * distribution.y;
				#ifdef USE_REVERSED_DEPTH_BUFFER
					float hard_shadow = step( mean, shadowCoord.z );
				#else
					float hard_shadow = step( shadowCoord.z, mean );
				#endif
				
				if ( hard_shadow == 1.0 ) {
					shadow = 1.0;
				} else {
					variance = max( variance, 0.0000001 );
					float d = shadowCoord.z - mean;
					float p_max = variance / ( variance + d * d );
					p_max = clamp( ( p_max - 0.3 ) / 0.65, 0.0, 1.0 );
					shadow = max( hard_shadow, p_max );
				}
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#else
		float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				shadowCoord.z -= shadowBias;
			#else
				shadowCoord.z += shadowBias;
			#endif
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				float depth = texture2D( shadowMap, shadowCoord.xy ).r;
				#ifdef USE_REVERSED_DEPTH_BUFFER
					shadow = step( depth, shadowCoord.z );
				#else
					shadow = step( shadowCoord.z, depth );
				#endif
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#endif
	#if NUM_SUN_LIGHT_SHADOWS > 0
		float getSunShadow(
			#if defined( SHADOWMAP_TYPE_PCF )
				sampler2DShadow shadowMap,
			#else
				sampler2D shadowMap,
			#endif
			SunLightShadow sunLightShadow,
			int shadowIndex
		) {
			vec4 shadowWorldPosition = vec4( vSunShadowWorldPosition.xyz + vSunShadowWorldNormal * sunLightShadow.shadowNormalBias, 1.0 );
			float viewDepth = vSunShadowWorldPosition.w;
			int cascadeOffset = shadowIndex * SUN_LIGHT_CASCADES;
			float shadow = 1.0;
			for ( int i = SUN_LIGHT_CASCADES - 1; i >= 0; i -- ) {
				vec4 cascade = sunShadowCascade[ cascadeOffset + i ];
				if ( viewDepth >= cascade.x && viewDepth < cascade.y ) {
					float cascadeShadow = getShadow(
						shadowMap,
						sunLightShadow.shadowMapSize,
						sunLightShadow.shadowIntensity,
						sunLightShadow.shadowBias,
						sunLightShadow.shadowRadius,
						sunShadowMatrix[ cascadeOffset + i ] * shadowWorldPosition
					);
					shadow = mix( cascadeShadow, shadow, smoothstep( cascade.z, cascade.y, viewDepth ) );
				}
			}
			return shadow;
		}
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
	#if defined( SHADOWMAP_TYPE_PCF )
	float getPointShadow( samplerCubeShadow shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		float shadow = 1.0;
		vec3 lightToPosition = shadowCoord.xyz;
		vec3 bd3D = normalize( lightToPosition );
		vec3 absVec = abs( lightToPosition );
		float viewSpaceZ = max( max( absVec.x, absVec.y ), absVec.z );
		if ( viewSpaceZ - shadowCameraFar <= 0.0 && viewSpaceZ - shadowCameraNear >= 0.0 ) {
			float lightDistance = length( lightToPosition );
			float depthRange = shadowCameraFar - shadowCameraNear;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				float depthA = - shadowCameraNear / depthRange - shadowBias;
				float depthB = shadowCameraNear * shadowCameraFar / ( depthRange * lightDistance );
			#else
				float depthA = shadowCameraFar / depthRange + shadowBias;
				float depthB = - shadowCameraNear * shadowCameraFar / ( depthRange * lightDistance );
			#endif
			float texelSize = shadowRadius / shadowMapSize.x;
			vec3 absDir = abs( bd3D );
			vec3 tangent = absDir.x > absDir.z ? vec3( 0.0, 1.0, 0.0 ) : vec3( 1.0, 0.0, 0.0 );
			tangent = normalize( cross( bd3D, tangent ) );
			vec3 bitangent = cross( bd3D, tangent );
			float phi = interleavedGradientNoise( gl_FragCoord.xy ) * PI2;
			shadow = 0.0;
			for ( int i = 0; i < 5; i ++ ) {
				vec2 offset = vogelDiskSample( i, 5, phi );
				vec3 direction = bd3D + ( tangent * offset.x + bitangent * offset.y ) * texelSize;
				vec3 absDirection = abs( direction );
				float dp = depthA + depthB / max( max( absDirection.x, absDirection.y ), absDirection.z );
				shadow += texture( shadowMap, vec4( direction, dp ) );
			}
			shadow *= 0.2;
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
	#elif defined( SHADOWMAP_TYPE_BASIC )
	float getPointShadow( samplerCube shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		float shadow = 1.0;
		vec3 lightToPosition = shadowCoord.xyz;
		vec3 absVec = abs( lightToPosition );
		float viewSpaceZ = max( max( absVec.x, absVec.y ), absVec.z );
		if ( viewSpaceZ - shadowCameraFar <= 0.0 && viewSpaceZ - shadowCameraNear >= 0.0 ) {
			float dp = ( shadowCameraFar * ( viewSpaceZ - shadowCameraNear ) ) / ( viewSpaceZ * ( shadowCameraFar - shadowCameraNear ) );
			dp += shadowBias;
			vec3 bd3D = normalize( lightToPosition );
			float depth = textureCube( shadowMap, bd3D ).r;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				depth = 1.0 - depth;
			#endif
			shadow = step( dp, depth );
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
	#endif
	#endif
#endif`,bm=`#if NUM_SPOT_LIGHT_COORDS > 0
	uniform mat4 spotLightMatrix[ NUM_SPOT_LIGHT_COORDS ];
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_SUN_LIGHT_SHADOWS > 0
		varying vec4 vSunShadowWorldPosition;
		varying vec3 vSunShadowWorldNormal;
	#endif
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform mat4 directionalShadowMatrix[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform mat4 pointShadowMatrix[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
#endif`,Sm=`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_SUN_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
	#ifdef HAS_NORMAL
		vec3 shadowWorldNormal = transformNormalByInverseViewMatrix( transformedNormal, viewMatrix );
	#else
		vec3 shadowWorldNormal = vec3( 0.0 );
	#endif
	vec4 shadowWorldPosition;
#endif
#if defined( USE_SHADOWMAP )
	#if NUM_SUN_LIGHT_SHADOWS > 0
		vSunShadowWorldPosition = vec4( worldPosition.xyz, - mvPosition.z );
		vSunShadowWorldNormal = shadowWorldNormal;
	#endif
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * directionalLightShadows[ i ].shadowNormalBias, 0 );
			vDirectionalShadowCoord[ i ] = directionalShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * pointLightShadows[ i ].shadowNormalBias, 0 );
			vPointShadowCoord[ i ] = pointShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
#endif
#if NUM_SPOT_LIGHT_COORDS > 0
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_COORDS; i ++ ) {
		shadowWorldPosition = worldPosition;
		#if ( defined( USE_SHADOWMAP ) && UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
			shadowWorldPosition.xyz += shadowWorldNormal * spotLightShadows[ i ].shadowNormalBias;
		#endif
		vSpotLightCoord[ i ] = spotLightMatrix[ i ] * shadowWorldPosition;
	}
	#pragma unroll_loop_end
#endif`,wm=`float getShadowMask() {
	float shadow = 1.0;
	#ifdef USE_SHADOWMAP
	#if NUM_SUN_LIGHT_SHADOWS > 0
	SunLightShadow sunLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SUN_LIGHT_SHADOWS; i ++ ) {
		sunLight = sunLightShadows[ i ];
		shadow *= receiveShadow ? getSunShadow( sunShadowMap[ i ], sunLight, UNROLLED_LOOP_INDEX ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
		directionalLight = directionalLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( directionalShadowMap[ i ], directionalLight.shadowMapSize, directionalLight.shadowIntensity, directionalLight.shadowBias, directionalLight.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_SHADOWS; i ++ ) {
		spotLight = spotLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( spotShadowMap[ i ], spotLight.shadowMapSize, spotLight.shadowIntensity, spotLight.shadowBias, spotLight.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0 && ( defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_BASIC ) )
	PointLightShadow pointLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
		pointLight = pointLightShadows[ i ];
		shadow *= receiveShadow ? getPointShadow( pointShadowMap[ i ], pointLight.shadowMapSize, pointLight.shadowIntensity, pointLight.shadowBias, pointLight.shadowRadius, vPointShadowCoord[ i ], pointLight.shadowCameraNear, pointLight.shadowCameraFar ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#endif
	return shadow;
}`,Tm=`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,Em=`#ifdef USE_SKINNING
	uniform mat4 bindMatrix;
	uniform mat4 bindMatrixInverse;
	uniform highp sampler2D boneTexture;
	mat4 getBoneMatrix( const in float i ) {
		int size = textureSize( boneTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( boneTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( boneTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( boneTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( boneTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
#endif`,Am=`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,Rm=`#ifdef USE_SKINNING
	mat4 skinMatrix = mat4( 0.0 );
	skinMatrix += skinWeight.x * boneMatX;
	skinMatrix += skinWeight.y * boneMatY;
	skinMatrix += skinWeight.z * boneMatZ;
	skinMatrix += skinWeight.w * boneMatW;
	skinMatrix = bindMatrixInverse * skinMatrix * bindMatrix;
	objectNormal = vec4( skinMatrix * vec4( objectNormal, 0.0 ) ).xyz;
	#ifdef USE_TANGENT
		objectTangent = vec4( skinMatrix * vec4( objectTangent, 0.0 ) ).xyz;
	#endif
#endif`,Cm=`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,Pm=`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,Im=`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,Lm=`#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
uniform float toneMappingExposure;
vec3 LinearToneMapping( vec3 color ) {
	return saturate( toneMappingExposure * color );
}
vec3 ReinhardToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	return saturate( color / ( vec3( 1.0 ) + color ) );
}
vec3 CineonToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	color = max( vec3( 0.0 ), color - 0.004 );
	return pow( ( color * ( 6.2 * color + 0.5 ) ) / ( color * ( 6.2 * color + 1.7 ) + 0.06 ), vec3( 2.2 ) );
}
vec3 RRTAndODTFit( vec3 v ) {
	vec3 a = v * ( v + 0.0245786 ) - 0.000090537;
	vec3 b = v * ( 0.983729 * v + 0.4329510 ) + 0.238081;
	return a / b;
}
vec3 ACESFilmicToneMapping( vec3 color ) {
	const mat3 ACESInputMat = mat3(
		vec3( 0.59719, 0.07600, 0.02840 ),		vec3( 0.35458, 0.90834, 0.13383 ),
		vec3( 0.04823, 0.01566, 0.83777 )
	);
	const mat3 ACESOutputMat = mat3(
		vec3(  1.60475, -0.10208, -0.00327 ),		vec3( -0.53108,  1.10813, -0.07276 ),
		vec3( -0.07367, -0.00605,  1.07602 )
	);
	color *= toneMappingExposure / 0.6;
	color = ACESInputMat * color;
	color = RRTAndODTFit( color );
	color = ACESOutputMat * color;
	return saturate( color );
}
const mat3 LINEAR_REC2020_TO_LINEAR_SRGB = mat3(
	vec3( 1.6605, - 0.1246, - 0.0182 ),
	vec3( - 0.5876, 1.1329, - 0.1006 ),
	vec3( - 0.0728, - 0.0083, 1.1187 )
);
const mat3 LINEAR_SRGB_TO_LINEAR_REC2020 = mat3(
	vec3( 0.6274, 0.0691, 0.0164 ),
	vec3( 0.3293, 0.9195, 0.0880 ),
	vec3( 0.0433, 0.0113, 0.8956 )
);
vec3 agxDefaultContrastApprox( vec3 x ) {
	vec3 x2 = x * x;
	vec3 x4 = x2 * x2;
	return + 15.5 * x4 * x2
		- 40.14 * x4 * x
		+ 31.96 * x4
		- 6.868 * x2 * x
		+ 0.4298 * x2
		+ 0.1191 * x
		- 0.00232;
}
vec3 AgXToneMapping( vec3 color ) {
	const mat3 AgXInsetMatrix = mat3(
		vec3( 0.856627153315983, 0.137318972929847, 0.11189821299995 ),
		vec3( 0.0951212405381588, 0.761241990602591, 0.0767994186031903 ),
		vec3( 0.0482516061458583, 0.101439036467562, 0.811302368396859 )
	);
	const mat3 AgXOutsetMatrix = mat3(
		vec3( 1.1271005818144368, - 0.1413297634984383, - 0.14132976349843826 ),
		vec3( - 0.11060664309660323, 1.157823702216272, - 0.11060664309660294 ),
		vec3( - 0.016493938717834573, - 0.016493938717834257, 1.2519364065950405 )
	);
	const float AgxMinEv = - 12.47393;	const float AgxMaxEv = 4.026069;
	color *= toneMappingExposure;
	color = LINEAR_SRGB_TO_LINEAR_REC2020 * color;
	color = AgXInsetMatrix * color;
	color = max( color, 1e-10 );	color = log2( color );
	color = ( color - AgxMinEv ) / ( AgxMaxEv - AgxMinEv );
	color = clamp( color, 0.0, 1.0 );
	color = agxDefaultContrastApprox( color );
	color = AgXOutsetMatrix * color;
	color = pow( max( vec3( 0.0 ), color ), vec3( 2.2 ) );
	color = LINEAR_REC2020_TO_LINEAR_SRGB * color;
	color = clamp( color, 0.0, 1.0 );
	return color;
}
vec3 NeutralToneMapping( vec3 color ) {
	const float StartCompression = 0.8 - 0.04;
	const float Desaturation = 0.15;
	color *= toneMappingExposure;
	float x = min( color.r, min( color.g, color.b ) );
	float offset = x < 0.08 ? x - 6.25 * x * x : 0.04;
	color -= offset;
	float peak = max( color.r, max( color.g, color.b ) );
	if ( peak < StartCompression ) return color;
	float d = 1. - StartCompression;
	float newPeak = 1. - d * d / ( peak + d - StartCompression );
	color *= newPeak / peak;
	float g = 1. - 1. / ( Desaturation * ( peak - newPeak ) + 1. );
	return mix( color, vec3( newPeak ), g );
}
vec3 CustomToneMapping( vec3 color ) { return color; }`,Dm=`#ifdef USE_TRANSMISSION
	material.transmission = transmission;
	material.transmissionAlpha = 1.0;
	material.thickness = thickness;
	material.attenuationDistance = attenuationDistance;
	material.attenuationColor = attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		material.transmission *= texture2D( transmissionMap, vTransmissionMapUv ).r;
	#endif
	#ifdef USE_THICKNESSMAP
		material.thickness *= texture2D( thicknessMap, vThicknessMapUv ).g;
	#endif
	vec3 pos = vWorldPosition;
	vec3 v = normalize( cameraPosition - pos );
	vec3 n = transformNormalByInverseViewMatrix( normal, viewMatrix );
	vec4 transmitted = getIBLVolumeRefraction(
		n, v, material.roughness, material.diffuseContribution, material.specularColorBlended, material.specularF90,
		pos, modelMatrix, viewMatrix, projectionMatrix, material.dispersion, material.ior, material.thickness,
		material.attenuationColor, material.attenuationDistance );
	material.transmissionAlpha = mix( material.transmissionAlpha, transmitted.a, material.transmission );
	totalDiffuse = mix( totalDiffuse, transmitted.rgb, material.transmission );
#endif`,Nm=`#ifdef USE_TRANSMISSION
	uniform float transmission;
	uniform float thickness;
	uniform float attenuationDistance;
	uniform vec3 attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		uniform sampler2D transmissionMap;
	#endif
	#ifdef USE_THICKNESSMAP
		uniform sampler2D thicknessMap;
	#endif
	uniform vec2 transmissionSamplerSize;
	uniform sampler2D transmissionSamplerMap;
	uniform mat4 modelMatrix;
	uniform mat4 projectionMatrix;
	varying vec3 vWorldPosition;
	float w0( float a ) {
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - a + 3.0 ) - 3.0 ) + 1.0 );
	}
	float w1( float a ) {
		return ( 1.0 / 6.0 ) * ( a *  a * ( 3.0 * a - 6.0 ) + 4.0 );
	}
	float w2( float a ){
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - 3.0 * a + 3.0 ) + 3.0 ) + 1.0 );
	}
	float w3( float a ) {
		return ( 1.0 / 6.0 ) * ( a * a * a );
	}
	float g0( float a ) {
		return w0( a ) + w1( a );
	}
	float g1( float a ) {
		return w2( a ) + w3( a );
	}
	float h0( float a ) {
		return - 1.0 + w1( a ) / ( w0( a ) + w1( a ) );
	}
	float h1( float a ) {
		return 1.0 + w3( a ) / ( w2( a ) + w3( a ) );
	}
	vec4 bicubic( sampler2D tex, vec2 uv, vec4 texelSize, float lod ) {
		uv = uv * texelSize.zw + 0.5;
		vec2 iuv = floor( uv );
		vec2 fuv = fract( uv );
		float g0x = g0( fuv.x );
		float g1x = g1( fuv.x );
		float h0x = h0( fuv.x );
		float h1x = h1( fuv.x );
		float h0y = h0( fuv.y );
		float h1y = h1( fuv.y );
		vec2 p0 = ( vec2( iuv.x + h0x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p1 = ( vec2( iuv.x + h1x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p2 = ( vec2( iuv.x + h0x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		vec2 p3 = ( vec2( iuv.x + h1x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		return g0( fuv.y ) * ( g0x * textureLod( tex, p0, lod ) + g1x * textureLod( tex, p1, lod ) ) +
			g1( fuv.y ) * ( g0x * textureLod( tex, p2, lod ) + g1x * textureLod( tex, p3, lod ) );
	}
	vec4 textureBicubic( sampler2D sampler, vec2 uv, float lod ) {
		vec2 fLodSize = vec2( textureSize( sampler, int( lod ) ) );
		vec2 cLodSize = vec2( textureSize( sampler, int( lod + 1.0 ) ) );
		vec2 fLodSizeInv = 1.0 / fLodSize;
		vec2 cLodSizeInv = 1.0 / cLodSize;
		vec4 fSample = bicubic( sampler, uv, vec4( fLodSizeInv, fLodSize ), floor( lod ) );
		vec4 cSample = bicubic( sampler, uv, vec4( cLodSizeInv, cLodSize ), ceil( lod ) );
		return mix( fSample, cSample, fract( lod ) );
	}
	vec3 getVolumeTransmissionRay( const in vec3 n, const in vec3 v, const in float thickness, const in float ior, const in mat4 modelMatrix ) {
		vec3 refractionVector = refract( - v, normalize( n ), 1.0 / ior );
		vec3 modelScale;
		modelScale.x = length( vec3( modelMatrix[ 0 ].xyz ) );
		modelScale.y = length( vec3( modelMatrix[ 1 ].xyz ) );
		modelScale.z = length( vec3( modelMatrix[ 2 ].xyz ) );
		return normalize( refractionVector ) * thickness * modelScale;
	}
	float applyIorToRoughness( const in float roughness, const in float ior ) {
		return roughness * clamp( ior * 2.0 - 2.0, 0.0, 1.0 );
	}
	vec4 getTransmissionSample( const in vec2 fragCoord, const in float roughness, const in float ior ) {
		float lod = log2( transmissionSamplerSize.x ) * applyIorToRoughness( roughness, ior );
		return textureBicubic( transmissionSamplerMap, fragCoord.xy, lod );
	}
	vec3 volumeAttenuation( const in float transmissionDistance, const in vec3 attenuationColor, const in float attenuationDistance ) {
		if ( isinf( attenuationDistance ) ) {
			return vec3( 1.0 );
		} else {
			vec3 attenuationCoefficient = -log( attenuationColor ) / attenuationDistance;
			vec3 transmittance = exp( - attenuationCoefficient * transmissionDistance );			return transmittance;
		}
	}
	vec4 getIBLVolumeRefraction( const in vec3 n, const in vec3 v, const in float roughness, const in vec3 diffuseColor,
		const in vec3 specularColor, const in float specularF90, const in vec3 position, const in mat4 modelMatrix,
		const in mat4 viewMatrix, const in mat4 projMatrix, const in float dispersion, const in float ior, const in float thickness,
		const in vec3 attenuationColor, const in float attenuationDistance ) {
		vec4 transmittedLight;
		vec3 transmittance;
		#ifdef USE_DISPERSION
			float halfSpread = ( ior - 1.0 ) * 0.025 * dispersion;
			vec3 iors = vec3( ior - halfSpread, ior, ior + halfSpread );
			for ( int i = 0; i < 3; i ++ ) {
				vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, iors[ i ], modelMatrix );
				vec3 refractedRayExit = position + transmissionRay;
				vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
				vec2 refractionCoords = ndcPos.xy / ndcPos.w;
				refractionCoords += 1.0;
				refractionCoords /= 2.0;
				vec4 transmissionSample = getTransmissionSample( refractionCoords, roughness, iors[ i ] );
				transmittedLight[ i ] = transmissionSample[ i ];
				transmittedLight.a += transmissionSample.a;
				transmittance[ i ] = diffuseColor[ i ] * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance )[ i ];
			}
			transmittedLight.a /= 3.0;
		#else
			vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, ior, modelMatrix );
			vec3 refractedRayExit = position + transmissionRay;
			vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
			vec2 refractionCoords = ndcPos.xy / ndcPos.w;
			refractionCoords += 1.0;
			refractionCoords /= 2.0;
			transmittedLight = getTransmissionSample( refractionCoords, roughness, ior );
			transmittance = diffuseColor * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance );
		#endif
		vec3 attenuatedColor = transmittance * transmittedLight.rgb;
		vec3 F = EnvironmentBRDF( n, v, specularColor, specularF90, roughness );
		float transmittanceFactor = ( transmittance.r + transmittance.g + transmittance.b ) / 3.0;
		return vec4( ( 1.0 - F ) * attenuatedColor, 1.0 - ( 1.0 - transmittedLight.a ) * transmittanceFactor );
	}
#endif`,Um=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_DIFFUSE_ROUGHNESSMAP
	varying vec2 vDiffuseRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_SPECULARMAP
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,Fm=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	uniform mat3 mapTransform;
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	uniform mat3 alphaMapTransform;
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	uniform mat3 lightMapTransform;
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	uniform mat3 aoMapTransform;
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	uniform mat3 bumpMapTransform;
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	uniform mat3 normalMapTransform;
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_DISPLACEMENTMAP
	uniform mat3 displacementMapTransform;
	varying vec2 vDisplacementMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	uniform mat3 emissiveMapTransform;
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	uniform mat3 metalnessMapTransform;
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	uniform mat3 roughnessMapTransform;
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_DIFFUSE_ROUGHNESSMAP
	uniform mat3 diffuseRoughnessMapTransform;
	varying vec2 vDiffuseRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	uniform mat3 anisotropyMapTransform;
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	uniform mat3 clearcoatMapTransform;
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform mat3 clearcoatNormalMapTransform;
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform mat3 clearcoatRoughnessMapTransform;
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	uniform mat3 sheenColorMapTransform;
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	uniform mat3 sheenRoughnessMapTransform;
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	uniform mat3 iridescenceMapTransform;
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform mat3 iridescenceThicknessMapTransform;
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SPECULARMAP
	uniform mat3 specularMapTransform;
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	uniform mat3 specularColorMapTransform;
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	uniform mat3 specularIntensityMapTransform;
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,Om=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	vUv = vec3( uv, 1 ).xy;
#endif
#ifdef USE_MAP
	vMapUv = ( mapTransform * vec3( MAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ALPHAMAP
	vAlphaMapUv = ( alphaMapTransform * vec3( ALPHAMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_LIGHTMAP
	vLightMapUv = ( lightMapTransform * vec3( LIGHTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_AOMAP
	vAoMapUv = ( aoMapTransform * vec3( AOMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_BUMPMAP
	vBumpMapUv = ( bumpMapTransform * vec3( BUMPMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_NORMALMAP
	vNormalMapUv = ( normalMapTransform * vec3( NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_DISPLACEMENTMAP
	vDisplacementMapUv = ( displacementMapTransform * vec3( DISPLACEMENTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_EMISSIVEMAP
	vEmissiveMapUv = ( emissiveMapTransform * vec3( EMISSIVEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_METALNESSMAP
	vMetalnessMapUv = ( metalnessMapTransform * vec3( METALNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ROUGHNESSMAP
	vRoughnessMapUv = ( roughnessMapTransform * vec3( ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_DIFFUSE_ROUGHNESSMAP
	vDiffuseRoughnessMapUv = ( diffuseRoughnessMapTransform * vec3( DIFFUSE_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ANISOTROPYMAP
	vAnisotropyMapUv = ( anisotropyMapTransform * vec3( ANISOTROPYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOATMAP
	vClearcoatMapUv = ( clearcoatMapTransform * vec3( CLEARCOATMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	vClearcoatNormalMapUv = ( clearcoatNormalMapTransform * vec3( CLEARCOAT_NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	vClearcoatRoughnessMapUv = ( clearcoatRoughnessMapTransform * vec3( CLEARCOAT_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCEMAP
	vIridescenceMapUv = ( iridescenceMapTransform * vec3( IRIDESCENCEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	vIridescenceThicknessMapUv = ( iridescenceThicknessMapTransform * vec3( IRIDESCENCE_THICKNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_COLORMAP
	vSheenColorMapUv = ( sheenColorMapTransform * vec3( SHEEN_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	vSheenRoughnessMapUv = ( sheenRoughnessMapTransform * vec3( SHEEN_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULARMAP
	vSpecularMapUv = ( specularMapTransform * vec3( SPECULARMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_COLORMAP
	vSpecularColorMapUv = ( specularColorMapTransform * vec3( SPECULAR_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	vSpecularIntensityMapUv = ( specularIntensityMapTransform * vec3( SPECULAR_INTENSITYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_TRANSMISSIONMAP
	vTransmissionMapUv = ( transmissionMapTransform * vec3( TRANSMISSIONMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_THICKNESSMAP
	vThicknessMapUv = ( thicknessMapTransform * vec3( THICKNESSMAP_UV, 1 ) ).xy;
#endif`,km=`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		worldPosition = batchingMatrix * worldPosition;
	#endif
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`,zm=`varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`,Bm=`uniform sampler2D t2D;
uniform float backgroundIntensity;
varying vec2 vUv;
void main() {
	vec4 texColor = texture2D( t2D, vUv );
	#ifdef DECODE_VIDEO_TEXTURE
		texColor = vec4( mix( pow( texColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), texColor.rgb * 0.0773993808, vec3( lessThanEqual( texColor.rgb, vec3( 0.04045 ) ) ) ), texColor.w );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,Gm=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,Vm=`uniform float backgroundBlurriness;
uniform float backgroundIntensity;
uniform mat3 backgroundRotation;
varying vec3 vWorldDirection;
#include <envmap_common_pars_fragment>
void main() {
	#ifdef ENVMAP_TYPE_PMREM
		vec4 texColor = textureLod( envMap, backgroundRotation * vWorldDirection, roughnessToMip( backgroundBlurriness ) );
	#else
		vec4 texColor = textureCube( envMap, backgroundRotation * vWorldDirection );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,Hm=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,Wm=`uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,Xm=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
varying vec2 vHighPrecisionZW;
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vHighPrecisionZW = gl_Position.zw;
}`,qm=`#if DEPTH_PACKING == 3200
	uniform float opacity;
#endif
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
varying vec2 vHighPrecisionZW;
void main() {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#if DEPTH_PACKING == 3200
		diffuseColor.a = opacity;
	#endif
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <logdepthbuf_fragment>
	#ifdef USE_REVERSED_DEPTH_BUFFER
		float fragCoordZ = vHighPrecisionZW[ 0 ] / vHighPrecisionZW[ 1 ];
	#else
		float fragCoordZ = 0.5 * vHighPrecisionZW[ 0 ] / vHighPrecisionZW[ 1 ] + 0.5;
	#endif
	#if DEPTH_PACKING == 3200
		gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );
	#elif DEPTH_PACKING == 3201
		gl_FragColor = packDepthToRGBA( fragCoordZ );
	#elif DEPTH_PACKING == 3202
		gl_FragColor = vec4( packDepthToRGB( fragCoordZ ), 1.0 );
	#elif DEPTH_PACKING == 3203
		gl_FragColor = vec4( packDepthToRG( fragCoordZ ), 0.0, 1.0 );
	#endif
}`,$m=`#define DISTANCE
varying vec3 vWorldPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <worldpos_vertex>
	#include <clipping_planes_vertex>
	vWorldPosition = worldPosition.xyz;
}`,Ym=`#define DISTANCE
uniform vec3 referencePosition;
uniform float nearDistance;
uniform float farDistance;
varying vec3 vWorldPosition;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	float dist = length( vWorldPosition - referencePosition );
	dist = ( dist - nearDistance ) / ( farDistance - nearDistance );
	dist = saturate( dist );
	gl_FragColor = vec4( dist, 0.0, 0.0, 1.0 );
}`,Zm=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`,Jm=`uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,Km=`uniform float scale;
attribute float lineDistance;
varying float vLineDistance;
#include <common>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	vLineDistance = scale * lineDistance;
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,jm=`uniform vec3 diffuse;
uniform float opacity;
uniform float dashSize;
uniform float totalSize;
varying float vLineDistance;
#include <common>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	if ( mod( vLineDistance, totalSize ) > dashSize ) {
		discard;
	}
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,Qm=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#if defined ( USE_ENVMAP ) || defined ( USE_SKINNING )
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinbase_vertex>
		#include <skinnormal_vertex>
		#include <defaultnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <fog_vertex>
}`,e0=`uniform vec3 diffuse;
uniform float opacity;
#ifndef FLAT_SHADED
	varying vec3 vNormal;
#endif
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		reflectedLight.indirectDiffuse += lightMapTexel.rgb * lightMapIntensity * RECIPROCAL_PI;
	#else
		reflectedLight.indirectDiffuse += vec3( 1.0 );
	#endif
	#include <aomap_fragment>
	reflectedLight.indirectDiffuse *= diffuseColor.rgb;
	vec3 outgoingLight = reflectedLight.indirectDiffuse;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,t0=`#define LAMBERT
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,n0=`#define LAMBERT
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_lambert_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_lambert_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,i0=`#define MATCAP
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <displacementmap_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
	vViewPosition = - mvPosition.xyz;
}`,s0=`#define MATCAP
uniform vec3 diffuse;
uniform float opacity;
uniform sampler2D matcap;
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	vec3 viewDir = normalize( vViewPosition );
	vec3 x = normalize( vec3( viewDir.z, 0.0, - viewDir.x ) );
	vec3 y = cross( viewDir, x );
	vec2 uv = vec2( dot( x, normal ), dot( y, normal ) ) * 0.495 + 0.5;
	#ifdef USE_MATCAP
		vec4 matcapColor = texture2D( matcap, uv );
	#else
		vec4 matcapColor = vec4( vec3( mix( 0.2, 0.8, uv.y ) ), 1.0 );
	#endif
	vec3 outgoingLight = diffuseColor.rgb * matcapColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,r0=`#define NORMAL
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	vViewPosition = - mvPosition.xyz;
#endif
}`,a0=`#define NORMAL
uniform float opacity;
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <uv_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( 0.0, 0.0, 0.0, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	gl_FragColor = vec4( normalize( normal ) * 0.5 + 0.5, diffuseColor.a );
	#ifdef OPAQUE
		gl_FragColor.a = 1.0;
	#endif
}`,o0=`#define PHONG
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,l0=`#define PHONG
uniform vec3 diffuse;
uniform vec3 emissive;
uniform vec3 specular;
uniform float shininess;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_phong_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_phong_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,c0=`#define STANDARD
varying vec3 vViewPosition;
#ifdef USE_TRANSMISSION
	varying vec3 vWorldPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
#ifdef USE_TRANSMISSION
	vWorldPosition = worldPosition.xyz;
#endif
}`,h0=`#define STANDARD
#ifdef PHYSICAL
	#define IOR
	#define USE_SPECULAR
#endif
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float roughness;
uniform float metalness;
uniform float opacity;
#ifdef IOR
	uniform float ior;
#endif
#ifdef USE_SPECULAR
	uniform float specularIntensity;
	uniform vec3 specularColor;
	#ifdef USE_SPECULAR_COLORMAP
		uniform sampler2D specularColorMap;
	#endif
	#ifdef USE_SPECULAR_INTENSITYMAP
		uniform sampler2D specularIntensityMap;
	#endif
#endif
#ifdef USE_CLEARCOAT
	uniform float clearcoat;
	uniform float clearcoatRoughness;
#endif
#ifdef USE_DIFFUSE_ROUGHNESS
	uniform float diffuseRoughness;
	#ifdef USE_DIFFUSE_ROUGHNESSMAP
		uniform sampler2D diffuseRoughnessMap;
	#endif
#endif
#ifdef USE_DISPERSION
	uniform float dispersion;
#endif
#ifdef USE_RETROREFLECTION
	uniform float retroreflectivity;
#endif
#ifdef USE_IRIDESCENCE
	uniform float iridescence;
	uniform float iridescenceIOR;
	uniform float iridescenceThicknessMinimum;
	uniform float iridescenceThicknessMaximum;
#endif
#ifdef USE_SHEEN
	uniform vec3 sheenColor;
	uniform float sheenRoughness;
	#ifdef USE_SHEEN_COLORMAP
		uniform sampler2D sheenColorMap;
	#endif
	#ifdef USE_SHEEN_ROUGHNESSMAP
		uniform sampler2D sheenRoughnessMap;
	#endif
#endif
#ifdef USE_ANISOTROPY
	uniform vec2 anisotropyVector;
	#ifdef USE_ANISOTROPYMAP
		uniform sampler2D anisotropyMap;
	#endif
#endif
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <iridescence_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_physical_pars_fragment>
#include <transmission_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <clearcoat_pars_fragment>
#include <iridescence_pars_fragment>
#include <roughnessmap_pars_fragment>
#include <metalnessmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <roughnessmap_fragment>
	#include <metalnessmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <clearcoat_normal_fragment_begin>
	#include <clearcoat_normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_physical_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 totalDiffuse = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse;
	vec3 totalSpecular = reflectedLight.directSpecular + reflectedLight.indirectSpecular;
	#include <transmission_fragment>
	vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;
	#ifdef USE_SHEEN
 
		outgoingLight = outgoingLight + sheenSpecularDirect + sheenSpecularIndirect;
 
 	#endif
	#ifdef USE_CLEARCOAT
		float dotNVcc = saturate( dot( geometryClearcoatNormal, geometryViewDir ) );
		vec3 Fcc = F_Schlick( material.clearcoatF0, material.clearcoatF90, dotNVcc );
		outgoingLight = outgoingLight * ( 1.0 - material.clearcoat * Fcc ) + ( clearcoatSpecularDirect + clearcoatSpecularIndirect ) * material.clearcoat;
	#endif
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,u0=`#define TOON
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,d0=`#define TOON
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <gradientmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_toon_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_toon_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,f0=`uniform float size;
uniform float scale;
#include <common>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
#ifdef USE_POINTS_UV
	varying vec2 vUv;
	uniform mat3 uvTransform;
#endif
void main() {
	#ifdef USE_POINTS_UV
		vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	#endif
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	gl_PointSize = size;
	#ifdef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) gl_PointSize *= ( scale / - mvPosition.z );
	#endif
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <fog_vertex>
}`,p0=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <color_pars_fragment>
#include <map_particle_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_particle_fragment>
	#include <color_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,m0=`#include <common>
#include <batching_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <shadowmap_pars_vertex>
void main() {
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,g0=`uniform vec3 color;
uniform float opacity;
#include <common>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <logdepthbuf_pars_fragment>
#include <shadowmap_pars_fragment>
#include <shadowmask_pars_fragment>
void main() {
	#include <logdepthbuf_fragment>
	gl_FragColor = vec4( color, opacity * ( 1.0 - getShadowMask() ) );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,x0=`uniform float rotation;
uniform vec2 center;
#include <common>
#include <uv_pars_vertex>
#include <fog_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	vec4 mvPosition = modelViewMatrix[ 3 ];
	vec2 scale = vec2( length( modelMatrix[ 0 ].xyz ), length( modelMatrix[ 1 ].xyz ) );
	#ifndef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) scale *= - mvPosition.z;
	#endif
	vec2 alignedPosition = ( position.xy - ( center - vec2( 0.5 ) ) ) * scale;
	vec2 rotatedPosition;
	rotatedPosition.x = cos( rotation ) * alignedPosition.x - sin( rotation ) * alignedPosition.y;
	rotatedPosition.y = sin( rotation ) * alignedPosition.x + cos( rotation ) * alignedPosition.y;
	mvPosition.xy += rotatedPosition;
	gl_Position = projectionMatrix * mvPosition;
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,v0=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`,Ve={alphahash_fragment:Bf,alphahash_pars_fragment:Gf,alphamap_fragment:Vf,alphamap_pars_fragment:Hf,alphatest_fragment:Wf,alphatest_pars_fragment:Xf,aomap_fragment:qf,aomap_pars_fragment:$f,batching_pars_vertex:Yf,batching_vertex:Zf,begin_vertex:Jf,beginnormal_vertex:Kf,bsdfs:jf,iridescence_fragment:Qf,bumpmap_pars_fragment:ep,clipping_planes_fragment:tp,clipping_planes_pars_fragment:np,clipping_planes_pars_vertex:ip,clipping_planes_vertex:sp,color_fragment:rp,color_pars_fragment:ap,color_pars_vertex:op,color_vertex:lp,common:cp,defaultnormal_vertex:hp,displacementmap_pars_vertex:up,displacementmap_vertex:dp,emissivemap_fragment:fp,emissivemap_pars_fragment:pp,colorspace_fragment:mp,colorspace_pars_fragment:gp,envmap_fragment:xp,envmap_common_pars_fragment:vp,envmap_pars_fragment:_p,envmap_pars_vertex:yp,envmap_physical_pars_fragment:Ip,envmap_vertex:Mp,fog_vertex:bp,fog_pars_vertex:Sp,fog_fragment:wp,fog_pars_fragment:Tp,gradientmap_pars_fragment:Ep,lightmap_pars_fragment:Ap,lights_lambert_fragment:Rp,lights_lambert_pars_fragment:Cp,lights_pars_begin:Pp,lights_toon_fragment:Lp,lights_toon_pars_fragment:Dp,lights_phong_fragment:Np,lights_phong_pars_fragment:Up,lights_physical_fragment:Fp,lights_physical_pars_fragment:Op,lights_fragment_begin:kp,lights_fragment_maps:zp,lights_fragment_end:Bp,lightprobes_pars_fragment:Gp,logdepthbuf_fragment:Vp,logdepthbuf_pars_fragment:Hp,logdepthbuf_pars_vertex:Wp,logdepthbuf_vertex:Xp,map_fragment:qp,map_pars_fragment:$p,map_particle_fragment:Yp,map_particle_pars_fragment:Zp,metalnessmap_fragment:Jp,metalnessmap_pars_fragment:Kp,morphinstance_vertex:jp,morphcolor_vertex:Qp,morphnormal_vertex:em,morphtarget_pars_vertex:tm,morphtarget_vertex:nm,normal_fragment_begin:im,normal_fragment_maps:sm,normal_pars_fragment:rm,normal_pars_vertex:am,normal_vertex:om,normalmap_pars_fragment:lm,clearcoat_normal_fragment_begin:cm,clearcoat_normal_fragment_maps:hm,clearcoat_pars_fragment:um,iridescence_pars_fragment:dm,opaque_fragment:fm,packing:pm,premultiplied_alpha_fragment:mm,project_vertex:gm,dithering_fragment:xm,dithering_pars_fragment:vm,roughnessmap_fragment:_m,roughnessmap_pars_fragment:ym,shadowmap_pars_fragment:Mm,shadowmap_pars_vertex:bm,shadowmap_vertex:Sm,shadowmask_pars_fragment:wm,skinbase_vertex:Tm,skinning_pars_vertex:Em,skinning_vertex:Am,skinnormal_vertex:Rm,specularmap_fragment:Cm,specularmap_pars_fragment:Pm,tonemapping_fragment:Im,tonemapping_pars_fragment:Lm,transmission_fragment:Dm,transmission_pars_fragment:Nm,uv_pars_fragment:Um,uv_pars_vertex:Fm,uv_vertex:Om,worldpos_vertex:km,background_vert:zm,background_frag:Bm,backgroundCube_vert:Gm,backgroundCube_frag:Vm,cube_vert:Hm,cube_frag:Wm,depth_vert:Xm,depth_frag:qm,distance_vert:$m,distance_frag:Ym,equirect_vert:Zm,equirect_frag:Jm,linedashed_vert:Km,linedashed_frag:jm,meshbasic_vert:Qm,meshbasic_frag:e0,meshlambert_vert:t0,meshlambert_frag:n0,meshmatcap_vert:i0,meshmatcap_frag:s0,meshnormal_vert:r0,meshnormal_frag:a0,meshphong_vert:o0,meshphong_frag:l0,meshphysical_vert:c0,meshphysical_frag:h0,meshtoon_vert:u0,meshtoon_frag:d0,points_vert:f0,points_frag:p0,shadow_vert:m0,shadow_frag:g0,sprite_vert:x0,sprite_frag:v0},pe={common:{diffuse:{value:new je(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new Ue},alphaMap:{value:null},alphaMapTransform:{value:new Ue},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new Ue}},envmap:{envMap:{value:null},envMapRotation:{value:new Ue},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98},dfgLUT:{value:null}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new Ue}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new Ue}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new Ue},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new Ue},normalScale:{value:new Xe(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new Ue},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new Ue}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new Ue}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new Ue}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new je(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},sunLights:{value:[],properties:{direction:{},color:{}}},sunLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},sunShadowMatrix:{value:[]},sunShadowCascade:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null},probesSH:{value:[]},probesMin:{value:[]},probesMax:{value:[]},probesResolution:{value:[]}},points:{diffuse:{value:new je(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new Ue},alphaTest:{value:0},uvTransform:{value:new Ue}},sprite:{diffuse:{value:new je(16777215)},opacity:{value:1},center:{value:new Xe(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new Ue},alphaMap:{value:null},alphaMapTransform:{value:new Ue},alphaTest:{value:0}}},Yn={basic:{uniforms:Zt([pe.common,pe.specularmap,pe.envmap,pe.aomap,pe.lightmap,pe.fog]),vertexShader:Ve.meshbasic_vert,fragmentShader:Ve.meshbasic_frag},lambert:{uniforms:Zt([pe.common,pe.specularmap,pe.envmap,pe.aomap,pe.lightmap,pe.emissivemap,pe.bumpmap,pe.normalmap,pe.displacementmap,pe.fog,pe.lights,{emissive:{value:new je(0)},envMapIntensity:{value:1}}]),vertexShader:Ve.meshlambert_vert,fragmentShader:Ve.meshlambert_frag},phong:{uniforms:Zt([pe.common,pe.specularmap,pe.envmap,pe.aomap,pe.lightmap,pe.emissivemap,pe.bumpmap,pe.normalmap,pe.displacementmap,pe.fog,pe.lights,{emissive:{value:new je(0)},specular:{value:new je(1118481)},shininess:{value:30},envMapIntensity:{value:1}}]),vertexShader:Ve.meshphong_vert,fragmentShader:Ve.meshphong_frag},standard:{uniforms:Zt([pe.common,pe.envmap,pe.aomap,pe.lightmap,pe.emissivemap,pe.bumpmap,pe.normalmap,pe.displacementmap,pe.roughnessmap,pe.metalnessmap,pe.fog,pe.lights,{emissive:{value:new je(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:Ve.meshphysical_vert,fragmentShader:Ve.meshphysical_frag},toon:{uniforms:Zt([pe.common,pe.aomap,pe.lightmap,pe.emissivemap,pe.bumpmap,pe.normalmap,pe.displacementmap,pe.gradientmap,pe.fog,pe.lights,{emissive:{value:new je(0)}}]),vertexShader:Ve.meshtoon_vert,fragmentShader:Ve.meshtoon_frag},matcap:{uniforms:Zt([pe.common,pe.bumpmap,pe.normalmap,pe.displacementmap,pe.fog,{matcap:{value:null}}]),vertexShader:Ve.meshmatcap_vert,fragmentShader:Ve.meshmatcap_frag},points:{uniforms:Zt([pe.points,pe.fog]),vertexShader:Ve.points_vert,fragmentShader:Ve.points_frag},dashed:{uniforms:Zt([pe.common,pe.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:Ve.linedashed_vert,fragmentShader:Ve.linedashed_frag},depth:{uniforms:Zt([pe.common,pe.displacementmap]),vertexShader:Ve.depth_vert,fragmentShader:Ve.depth_frag},normal:{uniforms:Zt([pe.common,pe.bumpmap,pe.normalmap,pe.displacementmap,{opacity:{value:1}}]),vertexShader:Ve.meshnormal_vert,fragmentShader:Ve.meshnormal_frag},sprite:{uniforms:Zt([pe.sprite,pe.fog]),vertexShader:Ve.sprite_vert,fragmentShader:Ve.sprite_frag},background:{uniforms:{uvTransform:{value:new Ue},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:Ve.background_vert,fragmentShader:Ve.background_frag},backgroundCube:{uniforms:{envMap:{value:null},backgroundBlurriness:{value:0},backgroundIntensity:{value:1},backgroundRotation:{value:new Ue}},vertexShader:Ve.backgroundCube_vert,fragmentShader:Ve.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:Ve.cube_vert,fragmentShader:Ve.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:Ve.equirect_vert,fragmentShader:Ve.equirect_frag},distance:{uniforms:Zt([pe.common,pe.displacementmap,{referencePosition:{value:new G},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:Ve.distance_vert,fragmentShader:Ve.distance_frag},shadow:{uniforms:Zt([pe.lights,pe.fog,{color:{value:new je(0)},opacity:{value:1}}]),vertexShader:Ve.shadow_vert,fragmentShader:Ve.shadow_frag}};Yn.physical={uniforms:Zt([Yn.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new Ue},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new Ue},clearcoatNormalScale:{value:new Xe(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new Ue},diffuseRoughness:{value:0},diffuseRoughnessMap:{value:null},diffuseRoughnessMapTransform:{value:new Ue},dispersion:{value:0},retroreflectivity:{value:0},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new Ue},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new Ue},sheen:{value:0},sheenColor:{value:new je(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new Ue},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new Ue},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new Ue},transmissionSamplerSize:{value:new Xe},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new Ue},attenuationDistance:{value:0},attenuationColor:{value:new je(0)},specularColor:{value:new je(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new Ue},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new Ue},anisotropyVector:{value:new Xe},anisotropyMap:{value:null},anisotropyMapTransform:{value:new Ue}}]),vertexShader:Ve.meshphysical_vert,fragmentShader:Ve.meshphysical_frag};var vo={r:0,b:0,g:0},_0=new xt,Su=new Ue;Su.set(-1,0,0,0,1,0,0,0,1);function y0(i,e,t,n,s,r){let a=new je(0),o=s===!0?0:1,l,c,h=null,f=0,u=null;function p(y){let v=y.isScene===!0?y.background:null;if(v&&v.isTexture){let M=y.backgroundBlurriness>0;v=e.get(v,M)}return v}function d(y){let v=!1,M=p(y);M===null?m(a,o):M&&M.isColor&&(m(M,1),v=!0);let b=i.xr.getEnvironmentBlendMode();b==="additive"?t.buffers.color.setClear(0,0,0,1,r):b==="alpha-blend"&&t.buffers.color.setClear(0,0,0,0,r),(i.autoClear||v)&&(t.buffers.depth.setTest(!0),t.buffers.depth.setMask(!0),t.buffers.color.setMask(!0),i.clear(i.autoClearColor,i.autoClearDepth,i.autoClearStencil))}function _(y,v){let M=p(v);M&&M.isCubeTexture?(c===void 0&&(c=new Ft(new Xn(1,1,1),new Ot({name:"BackgroundCubeMaterial",uniforms:Yi(Yn.backgroundCube.uniforms),vertexShader:Yn.backgroundCube.vertexShader,fragmentShader:Yn.backgroundCube.fragmentShader,side:sn,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),c.geometry.deleteAttribute("normal"),c.geometry.deleteAttribute("uv"),c.onBeforeRender=function(b,w,x){this.matrixWorld.copyPosition(x.matrixWorld)},Object.defineProperty(c.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),n.update(c)),c.material.uniforms.envMap.value=M,c.material.uniforms.backgroundBlurriness.value=v.backgroundBlurriness,c.material.uniforms.backgroundIntensity.value=v.backgroundIntensity,c.material.uniforms.backgroundRotation.value.setFromMatrix4(_0.makeRotationFromEuler(v.backgroundRotation)).transpose(),M.isRenderTargetTexture===!1&&c.material.uniforms.backgroundRotation.value.premultiply(Su),c.material.toneMapped=Ze.getTransfer(M.colorSpace)!==nt,(h!==M||f!==M.version||u!==i.toneMapping)&&(c.material.needsUpdate=!0,h=M,f=M.version,u=i.toneMapping),c.layers.enableAll(),y.unshift(c,c.geometry,c.material,0,0,null)):M&&M.isTexture&&(l===void 0&&(l=new Ft(new Hi(2,2),new Ot({name:"BackgroundMaterial",uniforms:Yi(Yn.background.uniforms),vertexShader:Yn.background.vertexShader,fragmentShader:Yn.background.fragmentShader,side:Ti,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),l.geometry.deleteAttribute("normal"),Object.defineProperty(l.material,"map",{get:function(){return this.uniforms.t2D.value}}),n.update(l)),l.material.uniforms.t2D.value=M,l.material.uniforms.backgroundIntensity.value=v.backgroundIntensity,l.material.toneMapped=Ze.getTransfer(M.colorSpace)!==nt,M.matrixAutoUpdate===!0&&M.updateMatrix(),l.material.uniforms.uvTransform.value.copy(M.matrix),(h!==M||f!==M.version||u!==i.toneMapping)&&(l.material.needsUpdate=!0,h=M,f=M.version,u=i.toneMapping),l.layers.enableAll(),y.unshift(l,l.geometry,l.material,0,0,null))}function m(y,v){y.getRGB(vo,Zl(i)),t.buffers.color.setClear(vo.r,vo.g,vo.b,v,r)}function g(){c!==void 0&&(c.geometry.dispose(),c.material.dispose(),c=void 0),l!==void 0&&(l.geometry.dispose(),l.material.dispose(),l=void 0)}return{getClearColor:function(){return a},setClearColor:function(y,v=1){a.set(y),o=v,m(a,o)},getClearAlpha:function(){return o},setClearAlpha:function(y){o=y,m(a,o)},render:d,addToRenderList:_,dispose:g}}function M0(i,e){let t=i.getParameter(i.MAX_VERTEX_ATTRIBS),n={},s=u(null),r=s,a=!1;function o(C,D,F,L,V){let $=!1,H=f(C,L,F,D);r!==H&&(r=H,c(r.object)),$=p(C,L,F,V),$&&d(C,L,F,V),V!==null&&e.update(V,i.ELEMENT_ARRAY_BUFFER),($||a)&&(a=!1,M(C,D,F,L),V!==null&&i.bindBuffer(i.ELEMENT_ARRAY_BUFFER,e.get(V).buffer))}function l(){return i.createVertexArray()}function c(C){return i.bindVertexArray(C)}function h(C){return i.deleteVertexArray(C)}function f(C,D,F,L){let V=L.wireframe===!0,$=n[D.id];$===void 0&&($={},n[D.id]=$);let H=C.isInstancedMesh===!0?C.id:0,te=$[H];te===void 0&&(te={},$[H]=te);let X=te[F.id];X===void 0&&(X={},te[F.id]=X);let ee=X[V];return ee===void 0&&(ee=u(l()),X[V]=ee),ee}function u(C){let D=[],F=[],L=[];for(let V=0;V<t;V++)D[V]=0,F[V]=0,L[V]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:D,enabledAttributes:F,attributeDivisors:L,object:C,attributes:{},index:null}}function p(C,D,F,L){let V=r.attributes,$=D.attributes,H=0,te=F.getAttributes();for(let X in te)if(te[X].location>=0){let Q=V[X],_e=$[X];if(_e===void 0&&(X==="instanceMatrix"&&C.instanceMatrix&&(_e=C.instanceMatrix),X==="instanceColor"&&C.instanceColor&&(_e=C.instanceColor)),Q===void 0||Q.attribute!==_e||_e&&Q.data!==_e.data)return!0;H++}return r.attributesNum!==H||r.index!==L}function d(C,D,F,L){let V={},$=D.attributes,H=0,te=F.getAttributes();for(let X in te)if(te[X].location>=0){let Q=$[X];Q===void 0&&(X==="instanceMatrix"&&C.instanceMatrix&&(Q=C.instanceMatrix),X==="instanceColor"&&C.instanceColor&&(Q=C.instanceColor));let _e={};_e.attribute=Q,Q&&Q.data&&(_e.data=Q.data),V[X]=_e,H++}r.attributes=V,r.attributesNum=H,r.index=L}function _(){let C=r.newAttributes;for(let D=0,F=C.length;D<F;D++)C[D]=0}function m(C){g(C,0)}function g(C,D){let F=r.newAttributes,L=r.enabledAttributes,V=r.attributeDivisors;F[C]=1,L[C]===0&&(i.enableVertexAttribArray(C),L[C]=1),V[C]!==D&&(i.vertexAttribDivisor(C,D),V[C]=D)}function y(){let C=r.newAttributes,D=r.enabledAttributes;for(let F=0,L=D.length;F<L;F++)D[F]!==C[F]&&(i.disableVertexAttribArray(F),D[F]=0)}function v(C,D,F,L,V,$,H){H===!0?i.vertexAttribIPointer(C,D,F,V,$):i.vertexAttribPointer(C,D,F,L,V,$)}function M(C,D,F,L){_();let V=L.attributes,$=F.getAttributes(),H=D.defaultAttributeValues;for(let te in $){let X=$[te];if(X.location>=0){let ee=V[te];if(ee===void 0&&(te==="instanceMatrix"&&C.instanceMatrix&&(ee=C.instanceMatrix),te==="instanceColor"&&C.instanceColor&&(ee=C.instanceColor)),ee!==void 0){let Q=ee.normalized,_e=ee.itemSize,Ne=e.get(ee);if(Ne===void 0)continue;let Z=Ne.buffer,me=Ne.type,Me=Ne.bytesPerElement,Ce=me===i.INT||me===i.UNSIGNED_INT||ee.gpuType===Ua;if(ee.isInterleavedBufferAttribute){let ge=ee.data,ze=ge.isInterleavedBuffer===!0?ge.stride:ge.itemSize,St=ee.offset;if(ge.isInstancedInterleavedBuffer||ge.isInstancedBufferAttribute){for(let Ie=0;Ie<X.locationSize;Ie++)g(X.location+Ie,ge.meshPerAttribute);C.isInstancedMesh!==!0&&L._maxInstanceCount===void 0&&(L._maxInstanceCount=ge.meshPerAttribute*ge.count)}else for(let Ie=0;Ie<X.locationSize;Ie++)m(X.location+Ie);i.bindBuffer(i.ARRAY_BUFFER,Z);for(let Ie=0;Ie<X.locationSize;Ie++)v(X.location+Ie,_e/X.locationSize,me,Q,ze*Me,(St+_e/X.locationSize*Ie)*Me,Ce)}else{if(ee.isInstancedBufferAttribute){for(let ge=0;ge<X.locationSize;ge++)g(X.location+ge,ee.meshPerAttribute);C.isInstancedMesh!==!0&&L._maxInstanceCount===void 0&&(L._maxInstanceCount=ee.meshPerAttribute*ee.count)}else for(let ge=0;ge<X.locationSize;ge++)m(X.location+ge);i.bindBuffer(i.ARRAY_BUFFER,Z);for(let ge=0;ge<X.locationSize;ge++)v(X.location+ge,_e/X.locationSize,me,Q,_e*Me,_e/X.locationSize*ge*Me,Ce)}}else if(H!==void 0){let Q=H[te];if(Q!==void 0)switch(Q.length){case 2:i.vertexAttrib2fv(X.location,Q);break;case 3:i.vertexAttrib3fv(X.location,Q);break;case 4:i.vertexAttrib4fv(X.location,Q);break;default:i.vertexAttrib1fv(X.location,Q)}}}}y()}function b(){P();for(let C in n){let D=n[C];for(let F in D){let L=D[F];for(let V in L){let $=L[V];for(let H in $)h($[H].object),delete $[H];delete L[V]}}delete n[C]}}function w(C){if(n[C.id]===void 0)return;let D=n[C.id];for(let F in D){let L=D[F];for(let V in L){let $=L[V];for(let H in $)h($[H].object),delete $[H];delete L[V]}}delete n[C.id]}function x(C){for(let D in n){let F=n[D];for(let L in F){let V=F[L];if(V[C.id]===void 0)continue;let $=V[C.id];for(let H in $)h($[H].object),delete $[H];delete V[C.id]}}}function S(C){for(let D in n){let F=n[D],L=C.isInstancedMesh===!0?C.id:0,V=F[L];if(V!==void 0){for(let $ in V){let H=V[$];for(let te in H)h(H[te].object),delete H[te];delete V[$]}delete F[L],Object.keys(F).length===0&&delete n[D]}}}function P(){R(),a=!0,r!==s&&(r=s,c(r.object))}function R(){s.geometry=null,s.program=null,s.wireframe=!1}return{setup:o,reset:P,resetDefaultState:R,dispose:b,releaseStatesOfGeometry:w,releaseStatesOfObject:S,releaseStatesOfProgram:x,initAttributes:_,enableAttribute:m,disableUnusedAttributes:y}}function b0(i,e,t){let n;function s(l){n=l}function r(l,c){i.drawArrays(n,l,c),t.update(c,n,1)}function a(l,c,h){h!==0&&(i.drawArraysInstanced(n,l,c,h),t.update(c,n,h))}function o(l,c,h){if(h===0)return;e.get("WEBGL_multi_draw").multiDrawArraysWEBGL(n,l,0,c,0,h);let u=0;for(let p=0;p<h;p++)u+=c[p];t.update(u,n,1)}this.setMode=s,this.render=r,this.renderInstances=a,this.renderMultiDraw=o}function S0(i,e,t,n){let s;function r(){if(s!==void 0)return s;if(e.has("EXT_texture_filter_anisotropic")===!0){let x=e.get("EXT_texture_filter_anisotropic");s=i.getParameter(x.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else s=0;return s}function a(x){return!(x!==On&&n.convert(x)!==i.getParameter(i.IMPLEMENTATION_COLOR_READ_FORMAT))}function o(x){let S=x===Fn&&(e.has("EXT_color_buffer_half_float")||e.has("EXT_color_buffer_float"));return!(x!==fn&&x!==Un&&!S&&n.convert(x)!==i.getParameter(i.IMPLEMENTATION_COLOR_READ_TYPE))}function l(x){if(x==="highp"){if(i.getShaderPrecisionFormat(i.VERTEX_SHADER,i.HIGH_FLOAT).precision>0&&i.getShaderPrecisionFormat(i.FRAGMENT_SHADER,i.HIGH_FLOAT).precision>0)return"highp";x="mediump"}return x==="mediump"&&i.getShaderPrecisionFormat(i.VERTEX_SHADER,i.MEDIUM_FLOAT).precision>0&&i.getShaderPrecisionFormat(i.FRAGMENT_SHADER,i.MEDIUM_FLOAT).precision>0?"mediump":"lowp"}let c=t.precision!==void 0?t.precision:"highp",h=l(c);h!==c&&(Le("WebGLRenderer:",c,"not supported, using",h,"instead."),c=h);let f=t.reversedDepthBuffer===!0&&e.has("EXT_clip_control"),u=t.logarithmicDepthBuffer===!0&&f===!1;t.reversedDepthBuffer===!0&&f===!1&&Le("WebGLRenderer: Unable to use reversed depth buffer due to missing EXT_clip_control extension. Fallback to default depth buffer."),t.logarithmicDepthBuffer===!0&&f===!0&&Le("WebGLRenderer: Logarithmic depth buffer is ignored when reversed depth buffer is enabled.");let p=i.getParameter(i.MAX_TEXTURE_IMAGE_UNITS),d=i.getParameter(i.MAX_VERTEX_TEXTURE_IMAGE_UNITS),_=i.getParameter(i.MAX_TEXTURE_SIZE),m=i.getParameter(i.MAX_CUBE_MAP_TEXTURE_SIZE),g=i.getParameter(i.MAX_VERTEX_ATTRIBS),y=i.getParameter(i.MAX_VERTEX_UNIFORM_VECTORS),v=i.getParameter(i.MAX_VARYING_VECTORS),M=i.getParameter(i.MAX_FRAGMENT_UNIFORM_VECTORS),b=i.getParameter(i.MAX_SAMPLES),w=i.getParameter(i.SAMPLES);return{isWebGL2:!0,getMaxAnisotropy:r,getMaxPrecision:l,textureFormatReadable:a,textureTypeReadable:o,precision:c,logarithmicDepthBuffer:u,reversedDepthBuffer:f,maxTextures:p,maxVertexTextures:d,maxTextureSize:_,maxCubemapSize:m,maxAttributes:g,maxVertexUniforms:y,maxVaryings:v,maxFragmentUniforms:M,maxSamples:b,samples:w}}function w0(i){let e=this,t=null,n=0,s=!1,r=!1,a=new Dn,o=new Ue,l={value:null,needsUpdate:!1};this.uniform=l,this.numPlanes=0,this.numIntersection=0,this.init=function(f,u){let p=f.length!==0||u||n!==0||s;return s=u,n=f.length,p},this.beginShadows=function(){r=!0,h(null)},this.endShadows=function(){r=!1},this.setGlobalState=function(f,u){t=h(f,u,0)},this.setState=function(f,u,p){let d=f.clippingPlanes,_=f.clipIntersection,m=f.clipShadows,g=i.get(f);if(!s||d===null||d.length===0||r&&!m)r?h(null):c();else{let y=r?0:n,v=y*4,M=g.clippingState||null;l.value=M,M=h(d,u,v,p);for(let b=0;b!==v;++b)M[b]=t[b];g.clippingState=M,this.numIntersection=_?this.numPlanes:0,this.numPlanes+=y}};function c(){l.value!==t&&(l.value=t,l.needsUpdate=n>0),e.numPlanes=n,e.numIntersection=0}function h(f,u,p,d){let _=f!==null?f.length:0,m=null;if(_!==0){if(m=l.value,d!==!0||m===null){let g=p+_*4,y=u.matrixWorldInverse;o.getNormalMatrix(y),(m===null||m.length<g)&&(m=new Float32Array(g));for(let v=0,M=p;v!==_;++v,M+=4)a.copy(f[v]).applyMatrix4(y,o),a.normal.toArray(m,M),m[M+3]=a.constant}l.value=m,l.needsUpdate=!0}return e.numPlanes=_,e.numIntersection=0,m}}var gr=class extends nn{constructor(e=1,t={}){super(e,e,t),this.isWebGLCubeRenderTarget=!0;let n={width:e,height:e,depth:1},s=[n,n,n,n,n,n];this.texture=new Qs(s),this._setTextureOptions(t),this.texture.isRenderTargetTexture=!0}fromEquirectangularTexture(e,t){this.texture.type=t.type,this.texture.colorSpace=t.colorSpace,this.texture.generateMipmaps=t.generateMipmaps,this.texture.minFilter=t.minFilter,this.texture.magFilter=t.magFilter;let n={uniforms:{tEquirect:{value:null}},vertexShader:`

				varying vec3 vWorldDirection;

				vec3 transformDirection( in vec3 dir, in mat4 matrix ) {

					return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );

				}

				void main() {

					vWorldDirection = transformDirection( position, modelMatrix );

					#include <begin_vertex>
					#include <project_vertex>

				}
			`,fragmentShader:`

				uniform sampler2D tEquirect;

				varying vec3 vWorldDirection;

				#include <common>

				void main() {

					vec3 direction = normalize( vWorldDirection );

					vec2 sampleUV = equirectUv( direction );

					gl_FragColor = texture2D( tEquirect, sampleUV );

				}
			`},s=new Xn(5,5,5),r=new Ot({name:"CubemapFromEquirect",uniforms:Yi(n.uniforms),vertexShader:n.vertexShader,fragmentShader:n.fragmentShader,side:sn,blending:Wi});r.uniforms.tEquirect.value=t;let a=new Ft(s,r),o=t.minFilter;return t.minFilter===En&&(t.minFilter=Mt),new ys(1,10,this).update(e,a),t.minFilter=o,a.geometry.dispose(),a.material.dispose(),this}clear(e,t=!0,n=!0,s=!0){let r=e.getRenderTarget();for(let a=0;a<6;a++)e.setRenderTarget(this,a),e.clear(t,n,s);e.setRenderTarget(r)}},tu=256,T0=3,E0=20,wu=256,Tu=16,A0=3,R0=new G,C0=new je,yo=class i{constructor(e){this._renderer=e,this._cubeSize=0,this._sourceTarget=null,this._cubeCamera=new ys(1,10,null),this._boxMesh=new Ft(new Xn(5,5,5),null),this._cubemapMaterial=null,this._equirectMaterial=null,this._blurMaterial=null,this._ggxMaterial=null,this._integrationMaterial=null}fromScene(e,t=0,n=.1,s=100,r={}){let{size:a=256,position:o=R0}=r,l=this._renderer;this._setSize(a);let c=this._allocateTarget(),h=this._getSourceTarget(!0);t>0&&(h.texture.mipmapsAutoUpdate=!1);let f=l.autoClear,u=l.autoClearColor,p=l.autoClearDepth,d=l.autoClearStencil,_=e.background;l.autoClear=!0,l.autoClearColor=!0,l.autoClearDepth=!0,l.autoClearStencil=!0,_===null&&(e.background=l.getClearColor(C0));let m=new ys(n,s,h);return m.position.copy(o),m.update(l,e),l.autoClear=f,l.autoClearColor=u,l.autoClearDepth=p,l.autoClearStencil=d,e.background=_,t>0&&(h.texture.mipmapsAutoUpdate=!0,this._blur(c,t)),this._applyPMREM(c),c}fromEquirectangular(e,t=null){return this._fromTexture(e,t)}fromCubemap(e,t=null){return this._fromTexture(e,t)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=su(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=iu(),this._compileMaterial(this._equirectMaterial))}dispose(){this._sourceTarget!==null&&this._sourceTarget.dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose(),this._blurMaterial!==null&&this._blurMaterial.dispose(),this._ggxMaterial!==null&&this._ggxMaterial.dispose(),this._integrationMaterial!==null&&this._integrationMaterial.dispose(),this._boxMesh.geometry.dispose()}static lodToRoughness(e,t){return t>0?1-Math.sqrt(1-e/t):0}_setSize(e){this._cubeSize=Math.max(tu,Jh(e))}_fromTexture(e,t){e.mapping===qi||e.mapping===ws?this._setSize(e.image.length===0?tu:e.image[0].width||e.image[0].image.width):this._setSize(e.image.width/4);let n=t||this._allocateTarget();return this._textureToCubemap(e),this._applyPMREM(n),n}_allocateTarget(){let e=this._cubeSize,t=nu(e,!1,!1),n=Math.log2(e)-T0;for(let s=0;s<=n;s++)t.texture.mipmaps.push({width:e>>s,height:e>>s});return t.texture.name="PMREM",t.texture.isPMREMTexture=!0,t}_getSourceTarget(e=!1){let t=this._cubeSize,n=this._sourceTarget;return(n===null||n.width!==t||e&&n.depthBuffer===!1)&&(n!==null&&n.dispose(),this._sourceTarget=nu(t,!0,e)),this._sourceTarget}_compileMaterial(e){this._boxMesh.material=e,this._renderer.compile(this._boxMesh,this._cubeCamera.children[0])}_renderCube(e,t,n){let s=this._boxMesh,r=this._cubeCamera;s.material=n,r.renderTarget=e,r.activeMipmapLevel=t;let a=e.width>>t;e.viewport.set(0,0,a,a),r.update(this._renderer,s),e.viewport.set(0,0,e.width,e.height)}_textureToCubemap(e){let t;e.mapping===qi||e.mapping===ws?(this._cubemapMaterial===null&&(this._cubemapMaterial=su()),t=this._cubemapMaterial,t.uniforms.flipEnvMap.value=e.isRenderTargetTexture===!1?-1:1):(this._equirectMaterial===null&&(this._equirectMaterial=iu()),t=this._equirectMaterial),t.uniforms.envMap.value=e,this._renderCube(this._getSourceTarget(),0,t)}_applyPMREM(e){this._ggxMaterial===null&&(this._ggxMaterial=P0(),this._integrationMaterial=I0());let t=this._cubeSize,n=e.texture.mipmaps.length-1,s=this._ggxMaterial.uniforms;s.envMap.value=this._sourceTarget.texture;let r=this._integrationMaterial.uniforms;r.envMap.value=this._sourceTarget.texture,r.sourceLod.value=Math.log2(t/Tu);for(let a=0;a<=n;a++){let o=i.lodToRoughness(a,n);if(a>n-A0)r.roughness.value=o,this._renderCube(e,a,this._integrationMaterial);else{let l=o>0?Math.log2(t)+.5*Math.log2(6/(wu*Math.pow(o,4)))+.5:0;s.roughness.value=o,s.lodBias.value=l,this._renderCube(e,a,this._ggxMaterial)}}}_blur(e,t){this._blurMaterial===null&&(this._blurMaterial=L0());let n=this._blurMaterial,s=n.uniforms,r=this._sourceTarget;s.sigma.value=Math.min(t,Math.PI)/Math.SQRT2,s.envMap.value=r.texture,this._renderCube(e,0,n),s.envMap.value=e.texture,this._renderCube(r,0,n)}};function nu(i,e,t){return new gr(i,{minFilter:En,generateMipmaps:e,type:Fn,colorSpace:Ws,depthBuffer:t})}function xr(i,e,t){return new Ot({name:i,uniforms:e,vertexShader:Ve.cube_vert,fragmentShader:t,side:sn,blending:Wi,depthTest:!1,depthWrite:!1})}function P0(){return xr("PMREMGGXConvolution",{envMap:{value:null},roughness:{value:0},lodBias:{value:0}},`

		#define GGX_SAMPLES ${wu}u

		varying vec3 vWorldDirection;

		uniform samplerCube envMap;
		uniform float roughness;
		uniform float lodBias;

		#include <common>

		// Van der Corput radical inverse
		float radicalInverse_VdC( uint bits ) {

			bits = ( bits << 16u ) | ( bits >> 16u );
			bits = ( ( bits & 0x55555555u ) << 1u ) | ( ( bits & 0xAAAAAAAAu ) >> 1u );
			bits = ( ( bits & 0x33333333u ) << 2u ) | ( ( bits & 0xCCCCCCCCu ) >> 2u );
			bits = ( ( bits & 0x0F0F0F0Fu ) << 4u ) | ( ( bits & 0xF0F0F0F0u ) >> 4u );
			bits = ( ( bits & 0x00FF00FFu ) << 8u ) | ( ( bits & 0xFF00FF00u ) >> 8u );
			return float( bits ) * 2.3283064365386963e-10; // / 0x100000000

		}

		// Hammersley sequence
		vec2 hammersley( uint i, uint N ) {

			return vec2( float( i ) / float( N ), radicalInverse_VdC( i ) );

		}

		void main() {

			vec3 N = normalize( vWorldDirection );

			// For very low roughness, just sample the environment directly
			if ( roughness < 0.001 ) {

				gl_FragColor = vec4( textureLod( envMap, N, 0.0 ).rgb, 1.0 );
				return;

			}

			float alpha = roughness * roughness;
			float alpha2 = alpha * alpha;

			// Tangent space basis for VNDF sampling
			vec3 up = abs( N.z ) < 0.999 ? vec3( 0.0, 0.0, 1.0 ) : vec3( 1.0, 0.0, 0.0 );
			vec3 tangent = normalize( cross( up, N ) );
			vec3 bitangent = cross( N, tangent );

			vec3 prefilteredColor = vec3( 0.0 );
			float totalWeight = 0.0;

			for ( uint i = 0u; i < GGX_SAMPLES; i ++ ) {

				vec2 Xi = hammersley( i, GGX_SAMPLES );

				// With V = N, sample the reflected direction directly.
				float invQ = 1.0 / ( 1.0 - Xi.x + alpha2 * Xi.x );
				float NdotL = ( 1.0 - Xi.x - alpha2 * Xi.x ) * invQ;

				if ( NdotL > 0.0 ) {

					float phi = 2.0 * PI * Xi.y;
					float sinTheta = 2.0 * alpha * sqrt( Xi.x * ( 1.0 - Xi.x ) ) * invQ;
					vec3 L = N * NdotL + ( tangent * cos( phi ) + bitangent * sin( phi ) ) * sinTheta;

					// Match the source mip to the sample's solid angle. The terms
					// independent of the sample are precomputed in lodBias.
					float d = alpha2 * invQ;
					float lod = max( log2( d ) + lodBias, 0.0 );

					// Weight by NdotL for the split-sum approximation
					prefilteredColor += textureLod( envMap, L, lod ).rgb * NdotL;
					totalWeight += NdotL;

				}

			}

			gl_FragColor = vec4( prefilteredColor / totalWeight, 1.0 );

		}
	`)}function I0(){return xr("PMREMGGXIntegration",{envMap:{value:null},roughness:{value:0},sourceLod:{value:0},sourceSize:{value:Tu}},`

		varying vec3 vWorldDirection;

		uniform samplerCube envMap;
		uniform float roughness;
		uniform float sourceLod;
		uniform int sourceSize;

		void main() {

			vec3 N = normalize( vWorldDirection );

			float alpha = roughness * roughness;
			float alpha2 = alpha * alpha;

			float texelSize = 2.0 / float( sourceSize );

			vec3 prefilteredColor = vec3( 0.0 );
			float totalWeight = 0.0;

			// Pair opposite texels: only the one in N's hemisphere contributes.
			for ( int face = 0; face < 3; face ++ ) {

				for ( int y = 0; y < sourceSize; y ++ ) {

					for ( int x = 0; x < sourceSize; x ++ ) {

						vec2 uv = ( vec2( x, y ) + 0.5 ) * texelSize - 1.0;
						vec3 texelDirection = face == 0 ? vec3( 1.0, uv ) : ( face == 1 ? vec3( uv.x, 1.0, uv.y ) : vec3( uv, 1.0 ) );

						float invDistance = inversesqrt( 1.0 + dot( uv, uv ) );
						float NdotL = dot( N, texelDirection );
						texelDirection *= NdotL < 0.0 ? - 1.0 : 1.0;
						NdotL = abs( NdotL ) * invDistance;

						// With V = N, NdotH squared is ( 1 + NdotL ) / 2. Common factors
						// in the GGX distribution and texel solid angle cancel when normalized.
						float d = 1.0 + alpha2 + ( alpha2 - 1.0 ) * NdotL;
						float weight = NdotL * invDistance * invDistance * invDistance / ( d * d );

						prefilteredColor += textureLod( envMap, texelDirection, sourceLod ).rgb * weight;
						totalWeight += weight;

					}

				}

			}

			gl_FragColor = vec4( prefilteredColor / totalWeight, 1.0 );

		}
	`)}function L0(){return xr("PMREMSphericalGaussianBlur",{envMap:{value:null},sigma:{value:0}},`

		#define SAMPLES ${E0}
		#define GOLDEN_ANGLE 2.39996322973

		varying vec3 vWorldDirection;

		uniform samplerCube envMap;
		uniform float sigma;

		#include <common>

		void main() {

			vec3 outputDirection = normalize( vWorldDirection );

			vec3 up = abs( outputDirection.z ) < 0.999 ? vec3( 0.0, 0.0, 1.0 ) : vec3( 1.0, 0.0, 0.0 );
			vec3 tangent = normalize( cross( up, outputDirection ) );
			vec3 bitangent = cross( outputDirection, tangent );

			// Truncate the kernel at three standard deviations or at the antipode.
			float thetaMax = min( 3.0 * sigma, PI );
			float truncation = 1.0 - exp( - 0.5 * thetaMax * thetaMax / ( sigma * sigma ) );

			vec3 accumColor = vec3( 0.0 );
			float accumWeight = 0.0;

			for ( int i = 0; i < SAMPLES; i ++ ) {

				// Stratified inverse-CDF sampling of the Gaussian, placed on a golden-angle spiral.
				float stratum = ( float( i ) + 0.5 ) / float( SAMPLES );
				float theta = sigma * sqrt( - 2.0 * log( 1.0 - stratum * truncation ) );
				float phi = float( i ) * GOLDEN_ANGLE;

				vec3 offset = cos( phi ) * tangent + sin( phi ) * bitangent;
				vec3 sampleDirection = cos( theta ) * outputDirection + sin( theta ) * offset;

				// Correct the planar sample density to solid angle.
				float weight = sin( theta ) / theta;

				accumColor += weight * textureLod( envMap, sampleDirection, 0.0 ).rgb;
				accumWeight += weight;

			}

			gl_FragColor = vec4( accumColor / accumWeight, 1.0 );

		}
	`)}function iu(){return xr("PMREMEquirectangularToCubemap",{envMap:{value:null}},`

		varying vec3 vWorldDirection;

		uniform sampler2D envMap;

		#include <common>

		void main() {

			// Average four subpixel samples to preserve small, bright features.
			vec3 direction = normalize( vWorldDirection );
			vec3 dx = dFdx( direction ) * 0.25;
			vec3 dy = dFdy( direction ) * 0.25;

			vec3 color = textureLod( envMap, equirectUv( normalize( direction - dx - dy ) ), 0.0 ).rgb;
			color += textureLod( envMap, equirectUv( normalize( direction + dx - dy ) ), 0.0 ).rgb;
			color += textureLod( envMap, equirectUv( normalize( direction - dx + dy ) ), 0.0 ).rgb;
			color += textureLod( envMap, equirectUv( normalize( direction + dx + dy ) ), 0.0 ).rgb;
			gl_FragColor = vec4( color * 0.25, 1.0 );

		}
	`)}function su(){return xr("PMREMCubemapToCubemap",{envMap:{value:null},flipEnvMap:{value:-1}},`

		varying vec3 vWorldDirection;

		uniform samplerCube envMap;
		uniform float flipEnvMap;

		void main() {

			gl_FragColor = vec4( textureCube( envMap, vec3( flipEnvMap * vWorldDirection.x, vWorldDirection.yz ) ).rgb, 1.0 );

		}
	`)}function D0(i){let e=new WeakMap,t=new WeakMap,n=null;function s(u,p=!1){return u==null?null:p?a(u):r(u)}function r(u){if(u&&u.isTexture){let p=u.mapping;if(p===La||p===Da)if(e.has(u)){let d=e.get(u).texture;return o(d,u.mapping)}else{let d=u.image;if(d&&d.height>0){let _=new gr(d.height);return _.fromEquirectangularTexture(i,u),e.set(u,_),u.addEventListener("dispose",c),o(_.texture,u.mapping)}else return null}}return u}function a(u){if(u&&u.isTexture&&u.isPMREMTexture!==!0){let p=u.mapping,d=p===La||p===Da,_=p===qi||p===ws;if(d||_){let m=t.get(u),g=m!==void 0?m.texture.pmremVersion:0;if(u.isRenderTargetTexture&&u.pmremVersion!==g)return n===null&&(n=new yo(i)),m=d?n.fromEquirectangular(u,m):n.fromCubemap(u,m),m.texture.pmremVersion=u.pmremVersion,t.set(u,m),m.texture;if(m!==void 0)return m.texture;{let y=u.image;return d&&y&&y.height>0||_&&y&&l(y)?(n===null&&(n=new yo(i)),m=d?n.fromEquirectangular(u):n.fromCubemap(u),m.texture.pmremVersion=u.pmremVersion,t.set(u,m),u.addEventListener("dispose",h),m.texture):null}}}return u}function o(u,p){return p===La?u.mapping=qi:p===Da&&(u.mapping=ws),u}function l(u){let p=0,d=6;for(let _=0;_<d;_++)u[_]!==void 0&&p++;return p===d}function c(u){let p=u.target;p.removeEventListener("dispose",c);let d=e.get(p);d!==void 0&&(e.delete(p),d.dispose())}function h(u){let p=u.target;p.removeEventListener("dispose",h);let d=t.get(p);d!==void 0&&(t.delete(p),d.dispose())}function f(){e=new WeakMap,t=new WeakMap,n!==null&&(n.dispose(),n=null)}return{get:s,dispose:f}}function N0(i){let e={};function t(n){if(e[n]!==void 0)return e[n];let s=i.getExtension(n);return e[n]=s,s}return{has:function(n){return t(n)!==null},init:function(){t("EXT_color_buffer_float"),t("WEBGL_clip_cull_distance"),t("OES_texture_float_linear"),t("EXT_color_buffer_half_float"),t("WEBGL_multisampled_render_to_texture"),t("WEBGL_render_shared_exponent")},get:function(n){let s=t(n);return s===null&&Vs("WebGLRenderer: "+n+" extension not supported."),s}}}function U0(i,e,t,n){let s={},r=new WeakMap,a=new FinalizationRegistry(d=>delete s[d]);function o(d){l(d.target)}function l(d){d.index!==null&&e.remove(d.index);for(let m in d.attributes)e.remove(d.attributes[m]);d.removeEventListener("dispose",o),delete s[d.id],a.unregister(d);let _=r.get(d);_&&(e.remove(_),r.delete(d)),n.releaseStatesOfGeometry(d),d.isInstancedBufferGeometry===!0&&delete d._maxInstanceCount,t.memory.geometries--}function c(d,_){return s[_.id]!==void 0||(_.addEventListener("dispose",o),s[_.id]=new WeakRef(_),a.register(_,_.id,_),t.memory.geometries++),_}function h(d){let _=d.attributes;for(let m in _)e.update(_[m],i.ARRAY_BUFFER)}function f(d){let _=d.index,m=d.attributes.position,g=0;if(m===void 0)return;let y=_!==null?_.array.length:m.array.length/3-1,v=m.count>=65535?Ks:Js,M=new v(Math.ceil(y/3)*6,1),b=M.array;if(_!==null){let x=_.array;g=_.version;for(let S=0,P=0;S<y;S+=3){let R=x[S+0],C=x[S+1],D=x[S+2];b[P++]=R,b[P++]=C,b[P++]=C,b[P++]=D,b[P++]=D,b[P++]=R}}else{g=m.version;for(let x=0,S=0;x<y;x+=3){let P=x+0,R=x+1,C=x+2;b[S++]=P,b[S++]=R,b[S++]=R,b[S++]=C,b[S++]=C,b[S++]=P}}M.version=g;let w=r.get(d);w&&e.remove(w),r.set(d,M)}function u(d){let _=r.get(d);if(_){let m=d.index;m!==null&&_.version<m.version&&f(d)}else f(d);return r.get(d)}function p(){for(let d in s){let _=s[d].deref();_!==void 0&&l(_)}}return{get:c,update:h,getWireframeAttribute:u,dispose:p}}function F0(i,e,t){let n;function s(f){n=f}let r,a;function o(f){r=f.type,a=f.bytesPerElement}function l(f,u){i.drawElements(n,u,r,f*a),t.update(u,n,1)}function c(f,u,p){p!==0&&(i.drawElementsInstanced(n,u,r,f*a,p),t.update(u,n,p))}function h(f,u,p){if(p===0)return;e.get("WEBGL_multi_draw").multiDrawElementsWEBGL(n,u,0,r,f,0,p);let _=0;for(let m=0;m<p;m++)_+=u[m];t.update(_,n,1)}this.setMode=s,this.setIndex=o,this.render=l,this.renderInstances=c,this.renderMultiDraw=h}function O0(i){let e={geometries:0,textures:0},t={frame:0,calls:0,triangles:0,points:0,lines:0};function n(r,a,o){switch(t.calls++,a){case i.TRIANGLES:t.triangles+=o*(r/3);break;case i.LINES:t.lines+=o*(r/2);break;case i.LINE_STRIP:t.lines+=o*(r-1);break;case i.LINE_LOOP:t.lines+=o*r;break;case i.POINTS:t.points+=o*r;break;default:De("WebGLInfo: Unknown draw mode:",a);break}}function s(){t.calls=0,t.triangles=0,t.points=0,t.lines=0}return{memory:e,render:t,programs:null,autoReset:!0,reset:s,update:n}}function k0(i,e,t){let n=new WeakMap,s=new lt;function r(a,o,l){let c=a.morphTargetInfluences,h=o.morphAttributes.position||o.morphAttributes.normal||o.morphAttributes.color,f=h!==void 0?h.length:0,u=n.get(o);if(u===void 0||u.count!==f){let P=function(){x.dispose(),n.delete(o),o.removeEventListener("dispose",P)};u!==void 0&&u.texture.dispose();let p=o.morphAttributes.position!==void 0,d=o.morphAttributes.normal!==void 0,_=o.morphAttributes.color!==void 0,m=o.morphAttributes.position||[],g=o.morphAttributes.normal||[],y=o.morphAttributes.color||[],v=0;p===!0&&(v=1),d===!0&&(v=2),_===!0&&(v=3);let M=o.attributes.position.count*v,b=1;M>e.maxTextureSize&&(b=Math.ceil(M/e.maxTextureSize),M=e.maxTextureSize);let w=new Float32Array(M*b*4*f),x=new Ys(w,M,b,f);x.type=Un,x.needsUpdate=!0;let S=v*4;for(let R=0;R<f;R++){let C=m[R],D=g[R],F=y[R],L=M*b*4*R;for(let V=0;V<C.count;V++){let $=V*S;p===!0&&(s.fromBufferAttribute(C,V),w[L+$+0]=s.x,w[L+$+1]=s.y,w[L+$+2]=s.z,w[L+$+3]=0),d===!0&&(s.fromBufferAttribute(D,V),w[L+$+4]=s.x,w[L+$+5]=s.y,w[L+$+6]=s.z,w[L+$+7]=0),_===!0&&(s.fromBufferAttribute(F,V),w[L+$+8]=s.x,w[L+$+9]=s.y,w[L+$+10]=s.z,w[L+$+11]=F.itemSize===4?s.w:1)}}u={count:f,texture:x,size:new Xe(M,b)},n.set(o,u),o.addEventListener("dispose",P)}if(a.isInstancedMesh===!0&&a.morphTexture!==null)l.getUniforms().setValue(i,"morphTexture",a.morphTexture,t);else{let p=0;for(let _=0;_<c.length;_++)p+=c[_];let d=o.morphTargetsRelative?1:1-p;l.getUniforms().setValue(i,"morphTargetBaseInfluence",d),l.getUniforms().setValue(i,"morphTargetInfluences",c)}l.getUniforms().setValue(i,"morphTargetsTexture",u.texture,t),l.getUniforms().setValue(i,"morphTargetsTextureSize",u.size)}return{update:r}}function z0(i,e,t,n,s){let r=new WeakMap;function a(c){let h=s.render.frame,f=c.geometry,u=e.get(c,f);if(r.get(u)!==h&&(e.update(u),r.set(u,h)),c.isInstancedMesh&&(c.hasEventListener("dispose",l)===!1&&c.addEventListener("dispose",l),r.get(c)!==h&&(t.update(c.instanceMatrix,i.ARRAY_BUFFER),c.instanceColor!==null&&t.update(c.instanceColor,i.ARRAY_BUFFER),r.set(c,h))),c.isSkinnedMesh){let p=c.skeleton;r.get(p)!==h&&(p.update(),r.set(p,h))}return u}function o(){r=new WeakMap}function l(c){let h=c.target;h.removeEventListener("dispose",l),n.releaseStatesOfObject(h),t.remove(h.instanceMatrix),h.instanceColor!==null&&t.remove(h.instanceColor)}return{update:a,dispose:o}}var B0={[El]:"LINEAR_TONE_MAPPING",[Al]:"REINHARD_TONE_MAPPING",[Rl]:"CINEON_TONE_MAPPING",[Cl]:"ACES_FILMIC_TONE_MAPPING",[Il]:"AGX_TONE_MAPPING",[Ll]:"NEUTRAL_TONE_MAPPING",[Pl]:"CUSTOM_TONE_MAPPING"};function G0(i,e,t,n,s,r){let a=new nn(e,t,{type:i,depthBuffer:s,stencilBuffer:r,samples:n?4:0,storeMultisampledDepthBuffer:!1,storeMultisampledStencilBuffer:!1,resolveDepthBuffer:!1,resolveStencilBuffer:!1}),o=null,l=null,c=null,h=new wn;h.setAttribute("position",new Mn([-1,3,0,-1,-1,0,3,-1,0],3)),h.setAttribute("uv",new Mn([0,2,0,0,2,0],2));let f=new va({uniforms:{tDiffuse:{value:null}},vertexShader:`
			precision highp float;

			uniform mat4 modelViewMatrix;
			uniform mat4 projectionMatrix;

			attribute vec3 position;
			attribute vec2 uv;

			varying vec2 vUv;

			void main() {
				vUv = uv;
				gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
			}`,fragmentShader:`
			precision highp float;

			uniform sampler2D tDiffuse;

			varying vec2 vUv;

			#include <tonemapping_pars_fragment>
			#include <colorspace_pars_fragment>

			void main() {
				gl_FragColor = texture2D( tDiffuse, vUv );

				#ifdef LINEAR_TONE_MAPPING
					gl_FragColor.rgb = LinearToneMapping( gl_FragColor.rgb );
				#elif defined( REINHARD_TONE_MAPPING )
					gl_FragColor.rgb = ReinhardToneMapping( gl_FragColor.rgb );
				#elif defined( CINEON_TONE_MAPPING )
					gl_FragColor.rgb = CineonToneMapping( gl_FragColor.rgb );
				#elif defined( ACES_FILMIC_TONE_MAPPING )
					gl_FragColor.rgb = ACESFilmicToneMapping( gl_FragColor.rgb );
				#elif defined( AGX_TONE_MAPPING )
					gl_FragColor.rgb = AgXToneMapping( gl_FragColor.rgb );
				#elif defined( NEUTRAL_TONE_MAPPING )
					gl_FragColor.rgb = NeutralToneMapping( gl_FragColor.rgb );
				#elif defined( CUSTOM_TONE_MAPPING )
					gl_FragColor.rgb = CustomToneMapping( gl_FragColor.rgb );
				#endif

				#ifdef SRGB_TRANSFER
					gl_FragColor = sRGBTransferOETF( gl_FragColor );
				#endif
			}`,depthTest:!1,depthWrite:!1}),u=new Ft(h,f),p=new _s(-1,1,1,-1,0,1),d=null,_=null,m=!1,g,y=null,v=[],M=!1;this.setSize=function(b,w){a.setSize(b,w),o!==null&&o.setSize(b,w),l!==null&&l.setSize(b,w);for(let x=0;x<v.length;x++){let S=v[x];S.setSize&&S.setSize(b,w)}},this.setEffects=function(b){v=b,M=v.length>0&&v[0].isRenderPass===!0;let w=a.width,x=a.height;v.length>0&&o===null&&(o=new nn(w,x,{type:Fn,depthBuffer:!1,stencilBuffer:!1}),l=new nn(w,x,{type:Fn,depthBuffer:!1,stencilBuffer:!1}));let S=s===!0&&v.some(P=>P.needsDepthTexture===!0);S!==(a.depthTexture!==null)&&(S===!0&&c===null&&(c=new oi(w,x),r===!0&&(c.format=li,c.type=$i)),a.dispose(),a.depthTexture=S?c:null,a.resolveDepthBuffer=S,a.storeMultisampledDepthBuffer=S);for(let P=0;P<v.length;P++){let R=v[P];R.setSize&&R.setSize(w,x),S&&R.needsDepthTexture===!0&&R.setDepthTexture&&R.setDepthTexture(c)}},this.begin=function(b,w){if(m||b.toneMapping===qn&&v.length===0)return!1;if(y=w,w!==null){let x=w.width,S=w.height;(a.width!==x||a.height!==S)&&this.setSize(x,S)}return M===!1&&b.setRenderTarget(a),g=b.toneMapping,b.toneMapping=qn,!0},this.hasRenderPass=function(){return M},this.end=function(b,w){b.toneMapping=g,m=!0;let x=a,S=o;for(let P=0;P<v.length;P++){let R=v[P];R.enabled!==!1&&(R.render(b,S,x,w),R.needsSwap!==!1&&(x=S,S=S===o?l:o))}if(d!==b.outputColorSpace||_!==b.toneMapping){d=b.outputColorSpace,_=b.toneMapping,f.defines={},Ze.getTransfer(d)===nt&&(f.defines.SRGB_TRANSFER="");let P=B0[_];P&&(f.defines[P]=""),f.needsUpdate=!0}f.uniforms.tDiffuse.value=x.texture,b.setRenderTarget(y),b.render(u,p),y=null,m=!1},this.isCompositing=function(){return m},this.dispose=function(){a.dispose(),o!==null&&o.dispose(),l!==null&&l.dispose(),h.dispose(),f.dispose()}}var Eu=new tn,Au=new oi(1,1),Ru=new er(1),Cu=new Ys,Pu=new fa,Iu=new Qs,ru=[],au=[],ou=new Float32Array(16),lu=new Float32Array(9),cu=new Float32Array(4);function As(i,e,t){let n=i[0];if(n<=0||n>0)return i;let s=e*t,r=ru[s];if(r===void 0&&(r=new Float32Array(s),ru[s]=r),e!==0){n.toArray(r,0);for(let a=1,o=0;a!==e;++a)o+=t,i[a].toArray(r,o)}return r}function Ct(i,e){if(i.length!==e.length)return!1;for(let t=0,n=i.length;t<n;t++)if(i[t]!==e[t])return!1;return!0}function Pt(i,e){for(let t=0,n=e.length;t<n;t++)i[t]=e[t]}function bo(i,e){let t=au[e];t===void 0&&(t=new Int32Array(e),au[e]=t);for(let n=0;n!==e;++n)t[n]=i.allocateTextureUnit();return t}function V0(i,e){let t=this.cache;t[0]!==e&&(i.uniform1f(this.addr,e),t[0]=e)}function H0(i,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(i.uniform2f(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(Ct(t,e))return;i.uniform2fv(this.addr,e),Pt(t,e)}}function W0(i,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(i.uniform3f(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else if(e.r!==void 0)(t[0]!==e.r||t[1]!==e.g||t[2]!==e.b)&&(i.uniform3f(this.addr,e.r,e.g,e.b),t[0]=e.r,t[1]=e.g,t[2]=e.b);else{if(Ct(t,e))return;i.uniform3fv(this.addr,e),Pt(t,e)}}function X0(i,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(i.uniform4f(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(Ct(t,e))return;i.uniform4fv(this.addr,e),Pt(t,e)}}function q0(i,e){let t=this.cache,n=e.elements;if(n===void 0){if(Ct(t,e))return;i.uniformMatrix2fv(this.addr,!1,e),Pt(t,e)}else{if(Ct(t,n))return;cu.set(n),i.uniformMatrix2fv(this.addr,!1,cu),Pt(t,n)}}function $0(i,e){let t=this.cache,n=e.elements;if(n===void 0){if(Ct(t,e))return;i.uniformMatrix3fv(this.addr,!1,e),Pt(t,e)}else{if(Ct(t,n))return;lu.set(n),i.uniformMatrix3fv(this.addr,!1,lu),Pt(t,n)}}function Y0(i,e){let t=this.cache,n=e.elements;if(n===void 0){if(Ct(t,e))return;i.uniformMatrix4fv(this.addr,!1,e),Pt(t,e)}else{if(Ct(t,n))return;ou.set(n),i.uniformMatrix4fv(this.addr,!1,ou),Pt(t,n)}}function Z0(i,e){let t=this.cache;t[0]!==e&&(i.uniform1i(this.addr,e),t[0]=e)}function J0(i,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(i.uniform2i(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(Ct(t,e))return;i.uniform2iv(this.addr,e),Pt(t,e)}}function K0(i,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(i.uniform3i(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else{if(Ct(t,e))return;i.uniform3iv(this.addr,e),Pt(t,e)}}function j0(i,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(i.uniform4i(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(Ct(t,e))return;i.uniform4iv(this.addr,e),Pt(t,e)}}function Q0(i,e){let t=this.cache;t[0]!==e&&(i.uniform1ui(this.addr,e),t[0]=e)}function eg(i,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(i.uniform2ui(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(Ct(t,e))return;i.uniform2uiv(this.addr,e),Pt(t,e)}}function tg(i,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(i.uniform3ui(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else{if(Ct(t,e))return;i.uniform3uiv(this.addr,e),Pt(t,e)}}function ng(i,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(i.uniform4ui(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(Ct(t,e))return;i.uniform4uiv(this.addr,e),Pt(t,e)}}function So(i){return i.version===0&&(i.compareFunction=Wl,i.needsUpdate=!0),i}function ig(i,e,t){let n=this.cache,s=t.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s);let r;this.type===i.SAMPLER_2D_SHADOW?r=So(Au):r=Eu,t.setTexture2D(e||r,s)}function sg(i,e,t){let n=this.cache,s=t.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s),t.setTexture3D(e||Pu,s)}function rg(i,e,t){let n=this.cache,s=t.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s);let r;this.type===i.SAMPLER_CUBE_SHADOW?r=So(Ru):r=Iu,t.setTextureCube(e||r,s)}function ag(i,e,t){let n=this.cache,s=t.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s),t.setTexture2DArray(e||Cu,s)}function og(i){switch(i){case 5126:return V0;case 35664:return H0;case 35665:return W0;case 35666:return X0;case 35674:return q0;case 35675:return $0;case 35676:return Y0;case 5124:case 35670:return Z0;case 35667:case 35671:return J0;case 35668:case 35672:return K0;case 35669:case 35673:return j0;case 5125:return Q0;case 36294:return eg;case 36295:return tg;case 36296:return ng;case 35678:case 36198:case 36298:case 36306:case 35682:return ig;case 35679:case 36299:case 36307:return sg;case 35680:case 36300:case 36308:case 36293:return rg;case 36289:case 36303:case 36311:case 36292:return ag}}function lg(i,e){i.uniform1fv(this.addr,e)}function cg(i,e){let t=As(e,this.size,2);i.uniform2fv(this.addr,t)}function hg(i,e){let t=As(e,this.size,3);i.uniform3fv(this.addr,t)}function ug(i,e){let t=As(e,this.size,4);i.uniform4fv(this.addr,t)}function dg(i,e){let t=As(e,this.size,4);i.uniformMatrix2fv(this.addr,!1,t)}function fg(i,e){let t=As(e,this.size,9);i.uniformMatrix3fv(this.addr,!1,t)}function pg(i,e){let t=As(e,this.size,16);i.uniformMatrix4fv(this.addr,!1,t)}function mg(i,e){i.uniform1iv(this.addr,e)}function gg(i,e){i.uniform2iv(this.addr,e)}function xg(i,e){i.uniform3iv(this.addr,e)}function vg(i,e){i.uniform4iv(this.addr,e)}function _g(i,e){i.uniform1uiv(this.addr,e)}function yg(i,e){i.uniform2uiv(this.addr,e)}function Mg(i,e){i.uniform3uiv(this.addr,e)}function bg(i,e){i.uniform4uiv(this.addr,e)}function Sg(i,e,t){let n=this.cache,s=e.length,r=bo(t,s);Ct(n,r)||(i.uniform1iv(this.addr,r),Pt(n,r));let a;this.type===i.SAMPLER_2D_SHADOW?a=So(Au):a=Eu;for(let o=0;o!==s;++o)t.setTexture2D(e[o]||a,r[o])}function wg(i,e,t){let n=this.cache,s=e.length,r=bo(t,s);Ct(n,r)||(i.uniform1iv(this.addr,r),Pt(n,r));for(let a=0;a!==s;++a)t.setTexture3D(e[a]||Pu,r[a])}function Tg(i,e,t){let n=this.cache,s=e.length,r=bo(t,s);Ct(n,r)||(i.uniform1iv(this.addr,r),Pt(n,r));let a;this.type===i.SAMPLER_CUBE_SHADOW?a=So(Ru):a=Iu;for(let o=0;o!==s;++o)t.setTextureCube(e[o]||a,r[o])}function Eg(i,e,t){let n=this.cache,s=e.length,r=bo(t,s);Ct(n,r)||(i.uniform1iv(this.addr,r),Pt(n,r));for(let a=0;a!==s;++a)t.setTexture2DArray(e[a]||Cu,r[a])}function Ag(i){switch(i){case 5126:return lg;case 35664:return cg;case 35665:return hg;case 35666:return ug;case 35674:return dg;case 35675:return fg;case 35676:return pg;case 5124:case 35670:return mg;case 35667:case 35671:return gg;case 35668:case 35672:return xg;case 35669:case 35673:return vg;case 5125:return _g;case 36294:return yg;case 36295:return Mg;case 36296:return bg;case 35678:case 36198:case 36298:case 36306:case 35682:return Sg;case 35679:case 36299:case 36307:return wg;case 35680:case 36300:case 36308:case 36293:return Tg;case 36289:case 36303:case 36311:case 36292:return Eg}}var tc=class{constructor(e,t,n){this.id=e,this.addr=n,this.cache=[],this.type=t.type,this.setValue=og(t.type)}},nc=class{constructor(e,t,n){this.id=e,this.addr=n,this.cache=[],this.type=t.type,this.size=t.size,this.setValue=Ag(t.type)}},ic=class{constructor(e){this.id=e,this.seq=[],this.map={}}setValue(e,t,n){let s=this.seq;for(let r=0,a=s.length;r!==a;++r){let o=s[r];o.setValue(e,t[o.id],n)}}},Ql=/(\w+)(\])?(\[|\.)?/g;function hu(i,e){i.seq.push(e),i.map[e.id]=e}function Rg(i,e,t){let n=i.name,s=n.length;for(Ql.lastIndex=0;;){let r=Ql.exec(n),a=Ql.lastIndex,o=r[1],l=r[2]==="]",c=r[3];if(l&&(o=o|0),c===void 0||c==="["&&a+2===s){hu(t,c===void 0?new tc(o,i,e):new nc(o,i,e));break}else{let f=t.map[o];f===void 0&&(f=new ic(o),hu(t,f)),t=f}}}var Es=class{constructor(e,t){this.seq=[],this.map={};let n=e.getProgramParameter(t,e.ACTIVE_UNIFORMS);for(let a=0;a<n;++a){let o=e.getActiveUniform(t,a),l=e.getUniformLocation(t,o.name);Rg(o,l,this)}let s=[],r=[];for(let a of this.seq)a.type===e.SAMPLER_2D_SHADOW||a.type===e.SAMPLER_CUBE_SHADOW||a.type===e.SAMPLER_2D_ARRAY_SHADOW?s.push(a):r.push(a);s.length>0&&(this.seq=s.concat(r))}setValue(e,t,n,s){let r=this.map[t];r!==void 0&&r.setValue(e,n,s)}setOptional(e,t,n){let s=t[n];s!==void 0&&this.setValue(e,n,s)}static upload(e,t,n,s){for(let r=0,a=t.length;r!==a;++r){let o=t[r],l=n[o.id];l.needsUpdate!==!1&&o.setValue(e,l.value,s)}}static seqWithValue(e,t){let n=[];for(let s=0,r=e.length;s!==r;++s){let a=e[s];a.id in t&&n.push(a)}return n}};function uu(i,e,t){let n=i.createShader(e);return i.shaderSource(n,t),i.compileShader(n),n}var Cg=37297,Pg=0;function Ig(i,e){let t=i.split(`
`),n=[],s=Math.max(e-6,0),r=Math.min(e+6,t.length);for(let a=s;a<r;a++){let o=a+1;n.push(`${o===e?">":" "} ${o}: ${t[a]}`)}return n.join(`
`)}var du=new Ue;function Lg(i){Ze._getMatrix(du,Ze.workingColorSpace,i);let e=`mat3( ${du.elements.map(t=>t.toFixed(4))} )`;switch(Ze.getTransfer(i)){case Xs:return[e,"LinearTransferOETF"];case nt:return[e,"sRGBTransferOETF"];default:return Le("WebGLProgram: Unsupported color space: ",i),[e,"LinearTransferOETF"]}}function fu(i,e,t){let n=i.getShaderParameter(e,i.COMPILE_STATUS),r=(i.getShaderInfoLog(e)||"").trim();if(n&&r==="")return"";let a=/ERROR: 0:(\d+)/.exec(r);if(a){let o=parseInt(a[1]);return t.toUpperCase()+`

`+r+`

`+Ig(i.getShaderSource(e),o)}else return r}function Dg(i,e){let t=Lg(e);return[`vec4 ${i}( vec4 value ) {`,`	return ${t[1]}( vec4( ${t[0]} * value.rgb, value.a ) );`,"}"].join(`
`)}var Ng={[El]:"Linear",[Al]:"Reinhard",[Rl]:"Cineon",[Cl]:"ACESFilmic",[Il]:"AgX",[Ll]:"Neutral",[Pl]:"Custom"};function Ug(i,e){let t=Ng[e];return t===void 0?(Le("WebGLProgram: Unsupported toneMapping:",e),"vec3 "+i+"( vec3 color ) { return LinearToneMapping( color ); }"):"vec3 "+i+"( vec3 color ) { return "+t+"ToneMapping( color ); }"}var _o=new G;function Fg(){Ze.getLuminanceCoefficients(_o);let i=_o.x.toFixed(4),e=_o.y.toFixed(4),t=_o.z.toFixed(4);return["float luminance( const in vec3 rgb ) {",`	const vec3 weights = vec3( ${i}, ${e}, ${t} );`,"	return dot( weights, rgb );","}"].join(`
`)}function Og(i){return[i.extensionClipCullDistance?"#extension GL_ANGLE_clip_cull_distance : require":"",i.extensionMultiDraw?"#extension GL_ANGLE_multi_draw : require":""].filter(mr).join(`
`)}function kg(i){let e=[];for(let t in i){let n=i[t];n!==!1&&e.push("#define "+t+" "+n)}return e.join(`
`)}function zg(i,e){let t={},n=i.getProgramParameter(e,i.ACTIVE_ATTRIBUTES);for(let s=0;s<n;s++){let r=i.getActiveAttrib(e,s),a=r.name,o=1;r.type===i.FLOAT_MAT2&&(o=2),r.type===i.FLOAT_MAT3&&(o=3),r.type===i.FLOAT_MAT4&&(o=4),t[a]={type:r.type,location:i.getAttribLocation(e,a),locationSize:o}}return t}function mr(i){return i!==""}function pu(i,e){let t=e.numSpotLightShadows+e.numSpotLightMaps-e.numSpotLightShadowsWithMaps;return i.replace(/NUM_SUN_LIGHTS/g,e.numSunLights).replace(/NUM_DIR_LIGHTS/g,e.numDirLights).replace(/NUM_SPOT_LIGHTS/g,e.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,e.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,t).replace(/NUM_RECT_AREA_LIGHTS/g,e.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,e.numPointLights).replace(/NUM_HEMI_LIGHTS/g,e.numHemiLights).replace(/NUM_SUN_LIGHT_SHADOWS/g,e.numSunLightShadows).replace(/NUM_DIR_LIGHT_SHADOWS/g,e.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,e.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,e.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,e.numPointLightShadows).replace(/NUM_LIGHT_PROBE_GRIDS/g,e.numLightProbeGrids)}function mu(i,e){return i.replace(/NUM_CLIPPING_PLANES/g,e.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,e.numClippingPlanes-e.numClipIntersection)}var Bg=/^[ \t]*#include +<([\w\d./]+)>/gm;function sc(i){return i.replace(Bg,Gg)}function Gg(i,e){let t=Ve[e];if(t===void 0)throw new Error("THREE.WebGLProgram: Can not resolve #include <"+e+">");return sc(t)}var Vg=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function gu(i){return i.replace(Vg,Hg)}function Hg(i,e,t,n){let s="";for(let r=parseInt(e);r<parseInt(t);r++)s+=n.replace(/\[\s*i\s*\]/g,"[ "+r+" ]").replace(/UNROLLED_LOOP_INDEX/g,r);return s}function xu(i){let e=`precision ${i.precision} float;
	precision ${i.precision} int;
	precision ${i.precision} sampler2D;
	precision ${i.precision} samplerCube;
	precision ${i.precision} sampler3D;
	precision ${i.precision} sampler2DArray;
	precision ${i.precision} sampler2DShadow;
	precision ${i.precision} samplerCubeShadow;
	precision ${i.precision} sampler2DArrayShadow;
	precision ${i.precision} isampler2D;
	precision ${i.precision} isampler3D;
	precision ${i.precision} isamplerCube;
	precision ${i.precision} isampler2DArray;
	precision ${i.precision} usampler2D;
	precision ${i.precision} usampler3D;
	precision ${i.precision} usamplerCube;
	precision ${i.precision} usampler2DArray;
	`;return i.precision==="highp"?e+=`
#define HIGH_PRECISION`:i.precision==="mediump"?e+=`
#define MEDIUM_PRECISION`:i.precision==="lowp"&&(e+=`
#define LOW_PRECISION`),e}var Wg={[rr]:"SHADOWMAP_TYPE_PCF",[Ms]:"SHADOWMAP_TYPE_VSM"};function Xg(i){return Wg[i.shadowMapType]||"SHADOWMAP_TYPE_BASIC"}var qg={[ws]:"ENVMAP_MODE_REFRACTION"};function $g(i){return i.envMap===!1?"ENVMAP_MODE_REFLECTION":qg[i.envMapMode]||"ENVMAP_MODE_REFLECTION"}var Yg={[Tl]:"ENVMAP_BLENDING_MULTIPLY",[Nh]:"ENVMAP_BLENDING_MIX",[Uh]:"ENVMAP_BLENDING_ADD"};function Zg(i){return i.envMap===!1?"ENVMAP_BLENDING_NONE":Yg[i.combine]||"ENVMAP_BLENDING_NONE"}function Jg(i,e,t,n){let s=i.getContext(),r=t.defines,a=t.vertexShader,o=t.fragmentShader,l=Xg(t),c=t.envMapPMREM===!0?"ENVMAP_TYPE_PMREM":"ENVMAP_TYPE_CUBE",h=$g(t),f=Zg(t),u=Og(t),p=kg(r),d=s.createProgram(),_,m,g=t.glslVersion?"#version "+t.glslVersion+`
`:"";t.isRawShaderMaterial?(_=["#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,p].filter(mr).join(`
`),_.length>0&&(_+=`
`),m=["#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,p].filter(mr).join(`
`),m.length>0&&(m+=`
`)):(_=[xu(t),"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,p,t.extensionClipCullDistance?"#define USE_CLIP_DISTANCE":"",t.batching?"#define USE_BATCHING":"",t.batchingColor?"#define USE_BATCHING_COLOR":"",t.instancing?"#define USE_INSTANCING":"",t.instancingColor?"#define USE_INSTANCING_COLOR":"",t.instancingMorph?"#define USE_INSTANCING_MORPH":"",t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.map?"#define USE_MAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+h:"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",t.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",t.displacementMap?"#define USE_DISPLACEMENTMAP":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.anisotropy?"#define USE_ANISOTROPY":"",t.anisotropyMap?"#define USE_ANISOTROPYMAP":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.diffuseRoughnessMap?"#define USE_DIFFUSE_ROUGHNESSMAP":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",t.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.alphaHash?"#define USE_ALPHAHASH":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",t.mapUv?"#define MAP_UV "+t.mapUv:"",t.alphaMapUv?"#define ALPHAMAP_UV "+t.alphaMapUv:"",t.lightMapUv?"#define LIGHTMAP_UV "+t.lightMapUv:"",t.aoMapUv?"#define AOMAP_UV "+t.aoMapUv:"",t.emissiveMapUv?"#define EMISSIVEMAP_UV "+t.emissiveMapUv:"",t.bumpMapUv?"#define BUMPMAP_UV "+t.bumpMapUv:"",t.normalMapUv?"#define NORMALMAP_UV "+t.normalMapUv:"",t.displacementMapUv?"#define DISPLACEMENTMAP_UV "+t.displacementMapUv:"",t.metalnessMapUv?"#define METALNESSMAP_UV "+t.metalnessMapUv:"",t.roughnessMapUv?"#define ROUGHNESSMAP_UV "+t.roughnessMapUv:"",t.anisotropyMapUv?"#define ANISOTROPYMAP_UV "+t.anisotropyMapUv:"",t.clearcoatMapUv?"#define CLEARCOATMAP_UV "+t.clearcoatMapUv:"",t.clearcoatNormalMapUv?"#define CLEARCOAT_NORMALMAP_UV "+t.clearcoatNormalMapUv:"",t.clearcoatRoughnessMapUv?"#define CLEARCOAT_ROUGHNESSMAP_UV "+t.clearcoatRoughnessMapUv:"",t.diffuseRoughnessMapUv?"#define DIFFUSE_ROUGHNESSMAP_UV "+t.diffuseRoughnessMapUv:"",t.iridescenceMapUv?"#define IRIDESCENCEMAP_UV "+t.iridescenceMapUv:"",t.iridescenceThicknessMapUv?"#define IRIDESCENCE_THICKNESSMAP_UV "+t.iridescenceThicknessMapUv:"",t.sheenColorMapUv?"#define SHEEN_COLORMAP_UV "+t.sheenColorMapUv:"",t.sheenRoughnessMapUv?"#define SHEEN_ROUGHNESSMAP_UV "+t.sheenRoughnessMapUv:"",t.specularMapUv?"#define SPECULARMAP_UV "+t.specularMapUv:"",t.specularColorMapUv?"#define SPECULAR_COLORMAP_UV "+t.specularColorMapUv:"",t.specularIntensityMapUv?"#define SPECULAR_INTENSITYMAP_UV "+t.specularIntensityMapUv:"",t.transmissionMapUv?"#define TRANSMISSIONMAP_UV "+t.transmissionMapUv:"",t.thicknessMapUv?"#define THICKNESSMAP_UV "+t.thicknessMapUv:"",t.vertexTangents&&t.flatShading===!1?"#define USE_TANGENT":"",t.vertexNormals?"#define HAS_NORMAL":"",t.vertexColors?"#define USE_COLOR":"",t.vertexAlphas?"#define USE_COLOR_ALPHA":"",t.vertexUv1s?"#define USE_UV1":"",t.vertexUv2s?"#define USE_UV2":"",t.vertexUv3s?"#define USE_UV3":"",t.pointsUvs?"#define USE_POINTS_UV":"",t.flatShading?"#define FLAT_SHADED":"",t.skinning?"#define USE_SKINNING":"",t.morphTargets?"#define USE_MORPHTARGETS":"",t.morphNormals&&t.flatShading===!1?"#define USE_MORPHNORMALS":"",t.morphColors?"#define USE_MORPHCOLORS":"",t.morphTargetsCount>0?"#define MORPHTARGETS_TEXTURE_STRIDE "+t.morphTextureStride:"",t.morphTargetsCount>0?"#define MORPHTARGETS_COUNT "+t.morphTargetsCount:"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+l:"",t.sizeAttenuation?"#define USE_SIZEATTENUATION":"",t.numLightProbes>0?"#define USE_LIGHT_PROBES":"",t.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",t.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 modelMatrix;","uniform mat4 modelViewMatrix;","uniform mat4 projectionMatrix;","uniform mat4 viewMatrix;","uniform mat3 normalMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;","#ifdef USE_INSTANCING","	attribute mat4 instanceMatrix;","#endif","#ifdef USE_INSTANCING_COLOR","	attribute vec3 instanceColor;","#endif","#ifdef USE_INSTANCING_MORPH","	uniform sampler2D morphTexture;","#endif","attribute vec3 position;","attribute vec3 normal;","attribute vec2 uv;","#ifdef USE_UV1","	attribute vec2 uv1;","#endif","#ifdef USE_UV2","	attribute vec2 uv2;","#endif","#ifdef USE_UV3","	attribute vec2 uv3;","#endif","#ifdef USE_TANGENT","	attribute vec4 tangent;","#endif","#if defined( USE_COLOR_ALPHA )","	attribute vec4 color;","#elif defined( USE_COLOR )","	attribute vec3 color;","#endif","#ifdef USE_SKINNING","	attribute vec4 skinIndex;","	attribute vec4 skinWeight;","#endif",`
`].filter(mr).join(`
`),m=[xu(t),"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,p,t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.alphaToCoverage?"#define ALPHA_TO_COVERAGE":"",t.map?"#define USE_MAP":"",t.matcap?"#define USE_MATCAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+c:"",t.envMap?"#define "+h:"",t.envMap?"#define "+f:"",t.envMapPMREM?"#define ENVMAP_MAX_LOD "+t.envMapMaxLod+".0":"",t.envMapPMREM?"#define ENVMAP_SIZE "+t.envMapSize+".0":"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",t.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",t.packedNormalMap?"#define USE_PACKED_NORMALMAP":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.anisotropy?"#define USE_ANISOTROPY":"",t.anisotropyMap?"#define USE_ANISOTROPYMAP":"",t.clearcoat?"#define USE_CLEARCOAT":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.diffuseRoughness?"#define USE_DIFFUSE_ROUGHNESS":"",t.diffuseRoughnessMap?"#define USE_DIFFUSE_ROUGHNESSMAP":"",t.dispersion?"#define USE_DISPERSION":"",t.retroreflection?"#define USE_RETROREFLECTION":"",t.iridescence?"#define USE_IRIDESCENCE":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",t.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.alphaTest?"#define USE_ALPHATEST":"",t.alphaHash?"#define USE_ALPHAHASH":"",t.sheen?"#define USE_SHEEN":"",t.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.vertexTangents&&t.flatShading===!1?"#define USE_TANGENT":"",t.vertexColors||t.instancingColor?"#define USE_COLOR":"",t.vertexAlphas||t.batchingColor?"#define USE_COLOR_ALPHA":"",t.vertexUv1s?"#define USE_UV1":"",t.vertexUv2s?"#define USE_UV2":"",t.vertexUv3s?"#define USE_UV3":"",t.pointsUvs?"#define USE_POINTS_UV":"",t.gradientMap?"#define USE_GRADIENTMAP":"",t.flatShading?"#define FLAT_SHADED":"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+l:"",t.premultipliedAlpha?"#define PREMULTIPLIED_ALPHA":"",t.numLightProbes>0?"#define USE_LIGHT_PROBES":"",t.decodeVideoTexture?"#define DECODE_VIDEO_TEXTURE":"",t.decodeVideoTextureEmissive?"#define DECODE_VIDEO_TEXTURE_EMISSIVE":"",t.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",t.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 viewMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;",t.toneMapping!==qn?"#define TONE_MAPPING":"",t.toneMapping!==qn?Ve.tonemapping_pars_fragment:"",t.toneMapping!==qn?Ug("toneMapping",t.toneMapping):"",t.dithering?"#define DITHERING":"",t.opaque?"#define OPAQUE":"",Ve.colorspace_pars_fragment,Dg("linearToOutputTexel",t.outputColorSpace),Fg(),t.useDepthPacking?"#define DEPTH_PACKING "+t.depthPacking:"",`
`].filter(mr).join(`
`)),a=sc(a),a=pu(a,t),a=mu(a,t),o=sc(o),o=pu(o,t),o=mu(o,t),a=gu(a),o=gu(o),t.isRawShaderMaterial!==!0&&(g=`#version 300 es
`,_=[u,"#define attribute in","#define varying out","#define texture2D texture"].join(`
`)+`
`+_,m=["#define varying in",t.glslVersion===ql?"":"layout(location = 0) out highp vec4 pc_fragColor;",t.glslVersion===ql?"":"#define gl_FragColor pc_fragColor","#define gl_FragDepthEXT gl_FragDepth","#define texture2D texture","#define textureCube texture","#define texture2DProj textureProj","#define texture2DLodEXT textureLod","#define texture2DProjLodEXT textureProjLod","#define textureCubeLodEXT textureLod","#define texture2DGradEXT textureGrad","#define texture2DProjGradEXT textureProjGrad","#define textureCubeGradEXT textureGrad"].join(`
`)+`
`+m);let y=g+_+a,v=g+m+o,M=uu(s,s.VERTEX_SHADER,y),b=uu(s,s.FRAGMENT_SHADER,v);s.attachShader(d,M),s.attachShader(d,b),t.index0AttributeName!==void 0?s.bindAttribLocation(d,0,t.index0AttributeName):t.hasPositionAttribute===!0&&s.bindAttribLocation(d,0,"position"),s.linkProgram(d);function w(R){if(i.debug.checkShaderErrors){let C=s.getProgramInfoLog(d)||"",D=s.getShaderInfoLog(M)||"",F=s.getShaderInfoLog(b)||"",L=C.trim(),V=D.trim(),$=F.trim(),H=!0,te=!0;if(s.getProgramParameter(d,s.LINK_STATUS)===!1)if(H=!1,typeof i.debug.onShaderError=="function")i.debug.onShaderError(s,d,M,b);else{let X=fu(s,M,"vertex"),ee=fu(s,b,"fragment");De("WebGLProgram: Shader Error "+s.getError()+" - VALIDATE_STATUS "+s.getProgramParameter(d,s.VALIDATE_STATUS)+`

Material Name: `+R.name+`
Material Type: `+R.type+`

Program Info Log: `+L+`
`+X+`
`+ee)}else L!==""?Le("WebGLProgram: Program Info Log:",L):(V===""||$==="")&&(te=!1);te&&(R.diagnostics={runnable:H,programLog:L,vertexShader:{log:V,prefix:_},fragmentShader:{log:$,prefix:m}})}s.deleteShader(M),s.deleteShader(b),x=new Es(s,d),S=zg(s,d)}let x;this.getUniforms=function(){return x===void 0&&w(this),x};let S;this.getAttributes=function(){return S===void 0&&w(this),S};let P=t.rendererExtensionParallelShaderCompile===!1;return this.isReady=function(){return P===!1&&(P=s.getProgramParameter(d,Cg)),P},this.destroy=function(){n.releaseStatesOfProgram(this),s.deleteProgram(d),this.program=void 0},this.type=t.shaderType,this.name=t.shaderName,this.id=Pg++,this.cacheKey=e,this.usedTimes=1,this.program=d,this.vertexShader=M,this.fragmentShader=b,this}var Kg=0,rc=class{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(e,t,n){let s=this._getShaderCacheForMaterial(e);return s.has(t)===!1&&(s.add(t),t.usedTimes++),s.has(n)===!1&&(s.add(n),n.usedTimes++),this}remove(e){let t=this.materialCache.get(e);for(let n of t)n.usedTimes--,n.usedTimes===0&&this.shaderCache.delete(n.code);return this.materialCache.delete(e),this}getVertexShaderStage(e){return this._getShaderStage(e.vertexShader)}getFragmentShaderStage(e){return this._getShaderStage(e.fragmentShader)}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(e){let t=this.materialCache,n=t.get(e);return n===void 0&&(n=new Set,t.set(e,n)),n}_getShaderStage(e){let t=this.shaderCache,n=t.get(e);return n===void 0&&(n=new ac(e),t.set(e,n)),n}},ac=class{constructor(e){this.id=Kg++,this.code=e,this.usedTimes=0}};function jg(i){return i===Ei||i===ur||i===dr}function Qg(i,e,t,n,s,r){let a=new Zs,o=new rc,l=new Set,c=[],h=new Map,f=n.logarithmicDepthBuffer,u={MeshDepthMaterial:"depth",MeshDistanceMaterial:"distance",MeshNormalMaterial:"normal",MeshBasicMaterial:"basic",MeshLambertMaterial:"lambert",MeshPhongMaterial:"phong",MeshToonMaterial:"toon",MeshStandardMaterial:"physical",MeshPhysicalMaterial:"physical",MeshMatcapMaterial:"matcap",LineBasicMaterial:"basic",LineDashedMaterial:"dashed",PointsMaterial:"points",ShadowMaterial:"shadow",SpriteMaterial:"sprite"};function p(x){return l.add(x),x===0?"uv":`uv${x}`}function d(x,S,P,R,C,D){let F=R.fog,L=C.geometry,V=x.isMeshStandardMaterial||x.isMeshLambertMaterial||x.isMeshPhongMaterial?R.environment:null,$=x.isMeshStandardMaterial||x.isMeshLambertMaterial&&!x.envMap||x.isMeshPhongMaterial&&!x.envMap,H=e.get(x.envMap||V,$),te=u[x.type],X=n.precision;x.precision!==null&&(X=n.getMaxPrecision(x.precision),X!==x.precision&&Le("WebGLProgram.getParameters:",x.precision,"not supported, using",X,"instead."));let ee=L.morphAttributes.position||L.morphAttributes.normal||L.morphAttributes.color,Q=ee!==void 0?ee.length:0,_e=0;L.morphAttributes.position!==void 0&&(_e=1),L.morphAttributes.normal!==void 0&&(_e=2),L.morphAttributes.color!==void 0&&(_e=3);let Ne,Z,me,Me;if(te){let fe=Yn[te];Ne=fe.vertexShader,Z=fe.fragmentShader}else{Ne=x.vertexShader,Z=x.fragmentShader;let fe=o.getVertexShaderStage(x),ot=o.getFragmentShaderStage(x);o.update(x,fe,ot),me=fe.id,Me=ot.id}let Ce=i.getRenderTarget(),ge=i.state.buffers.depth.getReversed(),ze=C.isInstancedMesh===!0,St=C.isBatchedMesh===!0,Ie=!!x.map,at=!!x.matcap,ct=!!H,qe=ct&&H.isPMREMTexture===!0,Bt=!!x.aoMap,At=!!x.lightMap,rn=!!x.bumpMap&&x.wireframe===!1,vt=!!x.normalMap,Bn=!!x.displacementMap,It=!!x.emissiveMap,mn=!!x.metalnessMap,gn=!!x.roughnessMap,xn=x.anisotropy>0,U=x.clearcoat>0,vn=x.diffuseRoughness>0,mt=x.dispersion>0,gt=x.retroreflectivity>0,de=x.iridescence>0,Rt=x.sheen>0,Pe=x.transmission>0,Oe=xn&&!!x.anisotropyMap,A=U&&!!x.clearcoatMap,T=U&&!!x.clearcoatNormalMap,k=U&&!!x.clearcoatRoughnessMap,ne=vn&&!!x.diffuseRoughnessMap,j=de&&!!x.iridescenceMap,re=de&&!!x.iridescenceThicknessMap,he=Rt&&!!x.sheenColorMap,Y=Rt&&!!x.sheenRoughnessMap,J=!!x.specularMap,oe=!!x.specularColorMap,I=!!x.specularIntensityMap,K=Pe&&!!x.transmissionMap,q=Pe&&!!x.thicknessMap,le=!!x.gradientMap,se=!!x.alphaMap,ae=x.alphaTest>0,Ee=!!x.alphaHash,Ge=!!x.extensions,ie=qn;x.toneMapped&&(Ce===null||Ce.isXRRenderTarget===!0)&&(ie=i.toneMapping);let Ae=qe?H.isCompressedCubeTexture?H.image[0].mipmaps:H.mipmaps:null,Be={shaderID:te,shaderType:x.type,shaderName:x.name,vertexShader:Ne,fragmentShader:Z,defines:x.defines,customVertexShaderID:me,customFragmentShaderID:Me,isRawShaderMaterial:x.isRawShaderMaterial===!0,glslVersion:x.glslVersion,precision:X,batching:St,batchingColor:St&&C._colorsTexture!==null,instancing:ze,instancingColor:ze&&C.instanceColor!==null,instancingMorph:ze&&C.morphTexture!==null,outputColorSpace:Ce===null?i.outputColorSpace:Ce.isXRRenderTarget===!0?Ce.texture.colorSpace:Ze.workingColorSpace,alphaToCoverage:!!x.alphaToCoverage,map:Ie,matcap:at,envMap:ct,envMapMode:ct&&H.mapping,envMapPMREM:qe,envMapMaxLod:qe?Ae.length-1:null,envMapSize:qe?Ae[0].width:null,aoMap:Bt,lightMap:At,bumpMap:rn,normalMap:vt,displacementMap:Bn,emissiveMap:It,normalMapObjectSpace:vt&&x.normalMapType===kh,normalMapTangentSpace:vt&&x.normalMapType===Gl,packedNormalMap:vt&&x.normalMapType===Gl&&jg(x.normalMap.format),metalnessMap:mn,roughnessMap:gn,anisotropy:xn,anisotropyMap:Oe,clearcoat:U,clearcoatMap:A,clearcoatNormalMap:T,clearcoatRoughnessMap:k,diffuseRoughness:vn,diffuseRoughnessMap:ne,dispersion:mt,retroreflection:gt,iridescence:de,iridescenceMap:j,iridescenceThicknessMap:re,sheen:Rt,sheenColorMap:he,sheenRoughnessMap:Y,specularMap:J,specularColorMap:oe,specularIntensityMap:I,transmission:Pe,transmissionMap:K,thicknessMap:q,gradientMap:le,opaque:x.transparent===!1&&x.blending===bs&&x.alphaToCoverage===!1,alphaMap:se,alphaTest:ae,alphaHash:Ee,combine:x.combine,mapUv:Ie&&p(x.map.channel),aoMapUv:Bt&&p(x.aoMap.channel),lightMapUv:At&&p(x.lightMap.channel),bumpMapUv:rn&&p(x.bumpMap.channel),normalMapUv:vt&&p(x.normalMap.channel),displacementMapUv:Bn&&p(x.displacementMap.channel),emissiveMapUv:It&&p(x.emissiveMap.channel),metalnessMapUv:mn&&p(x.metalnessMap.channel),roughnessMapUv:gn&&p(x.roughnessMap.channel),anisotropyMapUv:Oe&&p(x.anisotropyMap.channel),clearcoatMapUv:A&&p(x.clearcoatMap.channel),clearcoatNormalMapUv:T&&p(x.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:k&&p(x.clearcoatRoughnessMap.channel),diffuseRoughnessMapUv:ne&&p(x.diffuseRoughnessMap.channel),iridescenceMapUv:j&&p(x.iridescenceMap.channel),iridescenceThicknessMapUv:re&&p(x.iridescenceThicknessMap.channel),sheenColorMapUv:he&&p(x.sheenColorMap.channel),sheenRoughnessMapUv:Y&&p(x.sheenRoughnessMap.channel),specularMapUv:J&&p(x.specularMap.channel),specularColorMapUv:oe&&p(x.specularColorMap.channel),specularIntensityMapUv:I&&p(x.specularIntensityMap.channel),transmissionMapUv:K&&p(x.transmissionMap.channel),thicknessMapUv:q&&p(x.thicknessMap.channel),alphaMapUv:se&&p(x.alphaMap.channel),vertexTangents:!!L.attributes.tangent&&(vt||xn),vertexNormals:!!L.attributes.normal,vertexColors:x.vertexColors,vertexAlphas:x.vertexColors===!0&&!!L.attributes.color&&L.attributes.color.itemSize===4,pointsUvs:C.isPoints===!0&&!!L.attributes.uv&&(Ie||se),fog:!!F,useFog:x.fog===!0,fogExp2:!!F&&F.isFogExp2,flatShading:x.wireframe===!1&&(x.flatShading===!0||L.attributes.normal===void 0&&vt===!1&&(x.isMeshLambertMaterial||x.isMeshPhongMaterial||x.isMeshStandardMaterial||x.isMeshPhysicalMaterial)),sizeAttenuation:x.sizeAttenuation===!0,logarithmicDepthBuffer:f,reversedDepthBuffer:ge,skinning:C.isSkinnedMesh===!0,hasPositionAttribute:L.attributes.position!==void 0,morphTargets:L.morphAttributes.position!==void 0,morphNormals:L.morphAttributes.normal!==void 0,morphColors:L.morphAttributes.color!==void 0,morphTargetsCount:Q,morphTextureStride:_e,numSunLights:S.sun.length,numDirLights:S.directional.length,numPointLights:S.point.length,numSpotLights:S.spot.length,numSpotLightMaps:S.spotLightMap.length,numRectAreaLights:S.rectArea.length,numHemiLights:S.hemi.length,numSunLightShadows:S.sunShadowMap.length,numDirLightShadows:S.directionalShadowMap.length,numPointLightShadows:S.pointShadowMap.length,numSpotLightShadows:S.spotShadowMap.length,numSpotLightShadowsWithMaps:S.numSpotLightShadowsWithMaps,numLightProbes:S.numLightProbes,numLightProbeGrids:D.filter(fe=>fe.texture!==null).length,numClippingPlanes:r.numPlanes,numClipIntersection:r.numIntersection,dithering:x.dithering,shadowMapEnabled:i.shadowMap.enabled&&P.length>0,shadowMapType:i.shadowMap.type,toneMapping:ie,decodeVideoTexture:Ie&&x.map.isVideoTexture===!0&&Ze.getTransfer(x.map.colorSpace)===nt,decodeVideoTextureEmissive:It&&x.emissiveMap.isVideoTexture===!0&&Ze.getTransfer(x.emissiveMap.colorSpace)===nt,premultipliedAlpha:x.premultipliedAlpha,doubleSided:x.side===Tn,flipSided:x.side===sn,useDepthPacking:x.depthPacking>=0,depthPacking:x.depthPacking||0,index0AttributeName:x.index0AttributeName,extensionClipCullDistance:Ge&&x.extensions.clipCullDistance===!0&&t.has("WEBGL_clip_cull_distance"),extensionMultiDraw:(Ge&&x.extensions.multiDraw===!0||St)&&t.has("WEBGL_multi_draw"),rendererExtensionParallelShaderCompile:t.has("KHR_parallel_shader_compile"),customProgramCacheKey:x.customProgramCacheKey()};return Be.vertexUv1s=l.has(1),Be.vertexUv2s=l.has(2),Be.vertexUv3s=l.has(3),l.clear(),Be}function _(x){let S=[];if(x.shaderID?S.push(x.shaderID):(S.push(x.customVertexShaderID),S.push(x.customFragmentShaderID)),x.defines!==void 0)for(let P in x.defines)S.push(P),S.push(x.defines[P]);return x.isRawShaderMaterial===!1&&(m(S,x),g(S,x),S.push(i.outputColorSpace)),S.push(x.customProgramCacheKey),S.join()}function m(x,S){x.push(S.precision),x.push(S.outputColorSpace),x.push(S.envMapMode),x.push(S.envMapPMREM),x.push(S.envMapMaxLod),x.push(S.envMapSize),x.push(S.mapUv),x.push(S.alphaMapUv),x.push(S.lightMapUv),x.push(S.aoMapUv),x.push(S.bumpMapUv),x.push(S.normalMapUv),x.push(S.displacementMapUv),x.push(S.emissiveMapUv),x.push(S.metalnessMapUv),x.push(S.roughnessMapUv),x.push(S.anisotropyMapUv),x.push(S.clearcoatMapUv),x.push(S.clearcoatNormalMapUv),x.push(S.clearcoatRoughnessMapUv),x.push(S.diffuseRoughnessMapUv),x.push(S.iridescenceMapUv),x.push(S.iridescenceThicknessMapUv),x.push(S.sheenColorMapUv),x.push(S.sheenRoughnessMapUv),x.push(S.specularMapUv),x.push(S.specularColorMapUv),x.push(S.specularIntensityMapUv),x.push(S.transmissionMapUv),x.push(S.thicknessMapUv),x.push(S.combine),x.push(S.fogExp2),x.push(S.sizeAttenuation),x.push(S.morphTargetsCount),x.push(S.numSunLights),x.push(S.numDirLights),x.push(S.numPointLights),x.push(S.numSpotLights),x.push(S.numSpotLightMaps),x.push(S.numHemiLights),x.push(S.numRectAreaLights),x.push(S.numSunLightShadows),x.push(S.numDirLightShadows),x.push(S.numPointLightShadows),x.push(S.numSpotLightShadows),x.push(S.numSpotLightShadowsWithMaps),x.push(S.numLightProbes),x.push(S.numLightProbeGrids),x.push(S.shadowMapType),x.push(S.toneMapping),x.push(S.numClippingPlanes),x.push(S.numClipIntersection),x.push(S.depthPacking)}function g(x,S){a.disableAll(),S.instancing&&a.enable(0),S.instancingColor&&a.enable(1),S.instancingMorph&&a.enable(2),S.matcap&&a.enable(3),S.envMap&&a.enable(4),S.normalMapObjectSpace&&a.enable(5),S.normalMapTangentSpace&&a.enable(6),S.clearcoat&&a.enable(7),S.iridescence&&a.enable(8),S.alphaTest&&a.enable(9),S.vertexColors&&a.enable(10),S.vertexAlphas&&a.enable(11),S.vertexUv1s&&a.enable(12),S.vertexUv2s&&a.enable(13),S.vertexUv3s&&a.enable(14),S.vertexTangents&&a.enable(15),S.anisotropy&&a.enable(16),S.alphaHash&&a.enable(17),S.batching&&a.enable(18),S.dispersion&&a.enable(19),S.retroreflection&&a.enable(24),S.diffuseRoughness&&a.enable(25),S.batchingColor&&a.enable(20),S.gradientMap&&a.enable(21),S.packedNormalMap&&a.enable(22),S.vertexNormals&&a.enable(23),x.push(a.mask),a.disableAll(),S.fog&&a.enable(0),S.useFog&&a.enable(1),S.flatShading&&a.enable(2),S.logarithmicDepthBuffer&&a.enable(3),S.reversedDepthBuffer&&a.enable(4),S.skinning&&a.enable(5),S.morphTargets&&a.enable(6),S.morphNormals&&a.enable(7),S.morphColors&&a.enable(8),S.premultipliedAlpha&&a.enable(9),S.shadowMapEnabled&&a.enable(10),S.doubleSided&&a.enable(11),S.flipSided&&a.enable(12),S.useDepthPacking&&a.enable(13),S.dithering&&a.enable(14),S.transmission&&a.enable(15),S.sheen&&a.enable(16),S.opaque&&a.enable(17),S.pointsUvs&&a.enable(18),S.decodeVideoTexture&&a.enable(19),S.decodeVideoTextureEmissive&&a.enable(20),S.alphaToCoverage&&a.enable(21),S.numLightProbeGrids>0&&a.enable(22),S.hasPositionAttribute&&a.enable(23),x.push(a.mask)}function y(x){let S=u[x.type],P;if(S){let R=Yn[S];P=jh.clone(R.uniforms)}else P=x.uniforms;return P}function v(x,S){let P=h.get(S);return P!==void 0?++P.usedTimes:(P=new Jg(i,S,x,s),c.push(P),h.set(S,P)),P}function M(x){if(--x.usedTimes===0){let S=c.indexOf(x);c[S]=c[c.length-1],c.pop(),h.delete(x.cacheKey),x.destroy()}}function b(x){o.remove(x)}function w(){o.dispose()}return{getParameters:d,getProgramCacheKey:_,getUniforms:y,acquireProgram:v,releaseProgram:M,releaseShaderCache:b,programs:c,dispose:w}}function ex(){let i=new WeakMap;function e(a){return i.has(a)}function t(a){let o=i.get(a);return o===void 0&&(o={},i.set(a,o)),o}function n(a){i.delete(a)}function s(a,o,l){i.get(a)[o]=l}function r(){i=new WeakMap}return{has:e,get:t,remove:n,update:s,dispose:r}}function tx(i,e){return i.groupOrder!==e.groupOrder?i.groupOrder-e.groupOrder:i.renderOrder!==e.renderOrder?i.renderOrder-e.renderOrder:i.material.id!==e.material.id?i.material.id-e.material.id:i.materialVariant!==e.materialVariant?i.materialVariant-e.materialVariant:i.z!==e.z?i.z-e.z:i.id-e.id}function vu(i,e){return i.groupOrder!==e.groupOrder?i.groupOrder-e.groupOrder:i.renderOrder!==e.renderOrder?i.renderOrder-e.renderOrder:i.z!==e.z?e.z-i.z:i.id-e.id}function _u(){let i=[],e=0,t=[],n=[],s=[];function r(){e=0,t.length=0,n.length=0,s.length=0}function a(u){let p=0;return u.isInstancedMesh&&(p+=2),u.isSkinnedMesh&&(p+=1),p}function o(u,p,d,_,m,g){let y=i[e];return y===void 0?(y={id:u.id,object:u,geometry:p,material:d,materialVariant:a(u),groupOrder:_,renderOrder:u.renderOrder,z:m,group:g},i[e]=y):(y.id=u.id,y.object=u,y.geometry=p,y.material=d,y.materialVariant=a(u),y.groupOrder=_,y.renderOrder=u.renderOrder,y.z=m,y.group=g),e++,y}function l(u,p,d,_,m,g,y){y.reversedDepth===!0&&(m=-m);let v=o(u,p,d,_,m,g);d.transmission>0?n.push(v):d.transparent===!0?s.push(v):t.push(v)}function c(u,p,d,_,m,g){let y=o(u,p,d,_,m,g);d.transmission>0?n.unshift(y):d.transparent===!0?s.unshift(y):t.unshift(y)}function h(u,p){t.length>1&&t.sort(u||tx),n.length>1&&n.sort(p||vu),s.length>1&&s.sort(p||vu)}function f(){for(let u=e,p=i.length;u<p;u++){let d=i[u];if(d.id===null)break;d.id=null,d.object=null,d.geometry=null,d.material=null,d.group=null}}return{opaque:t,transmissive:n,transparent:s,init:r,push:l,unshift:c,finish:f,sort:h}}function nx(){let i=new WeakMap;function e(n,s){let r=i.get(n),a;return r===void 0?(a=new _u,i.set(n,[a])):s>=r.length?(a=new _u,r.push(a)):a=r[s],a}function t(){i=new WeakMap}return{get:e,dispose:t}}function ix(){let i={};return{get:function(e){if(i[e.id]!==void 0)return i[e.id];let t;switch(e.type){case"SunLight":case"DirectionalLight":t={direction:new G,color:new je};break;case"SpotLight":t={position:new G,direction:new G,color:new je,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case"PointLight":t={position:new G,color:new je,distance:0,decay:0};break;case"HemisphereLight":t={direction:new G,skyColor:new je,groundColor:new je};break;case"RectAreaLight":t={color:new je,position:new G,halfWidth:new G,halfHeight:new G};break}return i[e.id]=t,t}}}function sx(){let i={};return{get:function(e){if(i[e.id]!==void 0)return i[e.id];let t;switch(e.type){case"SunLight":case"DirectionalLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Xe};break;case"SpotLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Xe};break;case"PointLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Xe,shadowCameraNear:1,shadowCameraFar:1e3};break}return i[e.id]=t,t}}}var rx=0;function ax(i,e){return(e.castShadow?2:0)-(i.castShadow?2:0)+(e.map?1:0)-(i.map?1:0)}function ox(i){let e=new ix,t=sx(),n={version:0,hash:{sunLength:-1,directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numSunShadows:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],sun:[],sunShadow:[],sunShadowMap:[],sunShadowMatrix:[],sunShadowCascade:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let c=0;c<9;c++)n.probe.push(new G);let s=new G,r=new xt,a=new xt;function o(c){let h=0,f=0,u=0;for(let D=0;D<9;D++)n.probe[D].set(0,0,0);let p=0,d=0,_=0,m=0,g=0,y=0,v=0,M=0,b=0,w=0,x=0,S=0,P=0,R=0;c.sort(ax);for(let D=0,F=c.length;D<F;D++){let L=c[D],V=L.color,$=L.intensity,H=L.distance,te=null;if(L.shadow&&L.shadow.map&&(L.shadow.map.texture.format===Ei?te=L.shadow.map.texture:te=L.shadow.map.depthTexture||L.shadow.map.texture),L.isAmbientLight)h+=V.r*$,f+=V.g*$,u+=V.b*$;else if(L.isLightProbe){for(let X=0;X<9;X++)n.probe[X].addScaledVector(L.sh.coefficients[X],$);R++}else if(L.isSunLight){let X=e.get(L);if(X.color.copy(L.color).multiplyScalar(L.intensity),L.castShadow){let ee=L.shadow,Q=t.get(L);Q.shadowIntensity=ee.intensity,Q.shadowBias=ee.bias,Q.shadowNormalBias=ee.normalBias,Q.shadowRadius=ee.radius,Q.shadowMapSize.copy(ee.mapSize).multiply(ee.getFrameExtents()),n.sunShadow[d]=Q,n.sunShadowMap[d]=te;let _e=ee.getViewportCount();for(let Ne=0;Ne<_e;Ne++)n.sunShadowMatrix[_+Ne]=ee.getMatrix(Ne),n.sunShadowCascade[_+Ne]=ee._cascadeData[Ne];_+=_e,d++}n.sun[p]=X,p++}else if(L.isDirectionalLight){let X=e.get(L);if(X.color.copy(L.color).multiplyScalar(L.intensity),L.castShadow){let ee=L.shadow,Q=t.get(L);Q.shadowIntensity=ee.intensity,Q.shadowBias=ee.bias,Q.shadowNormalBias=ee.normalBias,Q.shadowRadius=ee.radius,Q.shadowMapSize=ee.mapSize,n.directionalShadow[m]=Q,n.directionalShadowMap[m]=te,n.directionalShadowMatrix[m]=L.shadow.matrix,b++}n.directional[m]=X,m++}else if(L.isSpotLight){let X=e.get(L);X.position.setFromMatrixPosition(L.matrixWorld),X.color.copy(V).multiplyScalar($),X.distance=H,X.coneCos=Math.cos(L.angle),X.penumbraCos=Math.cos(L.angle*(1-L.penumbra)),X.decay=L.decay,n.spot[y]=X;let ee=L.shadow;if(L.map&&(n.spotLightMap[S]=L.map,S++,ee.updateMatrices(L),L.castShadow&&P++),n.spotLightMatrix[y]=ee.matrix,L.castShadow){let Q=t.get(L);Q.shadowIntensity=ee.intensity,Q.shadowBias=ee.bias,Q.shadowNormalBias=ee.normalBias,Q.shadowRadius=ee.radius,Q.shadowMapSize=ee.mapSize,n.spotShadow[y]=Q,n.spotShadowMap[y]=te,x++}y++}else if(L.isRectAreaLight){let X=e.get(L);X.color.copy(V).multiplyScalar($),X.halfWidth.set(L.width*.5,0,0),X.halfHeight.set(0,L.height*.5,0),n.rectArea[v]=X,v++}else if(L.isPointLight){let X=e.get(L);if(X.color.copy(L.color).multiplyScalar(L.intensity),X.distance=L.distance,X.decay=L.decay,L.castShadow){let ee=L.shadow,Q=t.get(L);Q.shadowIntensity=ee.intensity,Q.shadowBias=ee.bias,Q.shadowNormalBias=ee.normalBias,Q.shadowRadius=ee.radius,Q.shadowMapSize=ee.mapSize,Q.shadowCameraNear=ee.camera.near,Q.shadowCameraFar=ee.camera.far,n.pointShadow[g]=Q,n.pointShadowMap[g]=te,n.pointShadowMatrix[g]=L.shadow.matrix,w++}n.point[g]=X,g++}else if(L.isHemisphereLight){let X=e.get(L);X.skyColor.copy(L.color).multiplyScalar($),X.groundColor.copy(L.groundColor).multiplyScalar($),n.hemi[M]=X,M++}}v>0&&(i.has("OES_texture_float_linear")===!0?(n.rectAreaLTC1=pe.LTC_FLOAT_1,n.rectAreaLTC2=pe.LTC_FLOAT_2):(n.rectAreaLTC1=pe.LTC_HALF_1,n.rectAreaLTC2=pe.LTC_HALF_2)),n.ambient[0]=h,n.ambient[1]=f,n.ambient[2]=u;let C=n.hash;(C.sunLength!==p||C.directionalLength!==m||C.pointLength!==g||C.spotLength!==y||C.rectAreaLength!==v||C.hemiLength!==M||C.numSunShadows!==d||C.numDirectionalShadows!==b||C.numPointShadows!==w||C.numSpotShadows!==x||C.numSpotMaps!==S||C.numLightProbes!==R)&&(n.sun.length=p,n.directional.length=m,n.spot.length=y,n.rectArea.length=v,n.point.length=g,n.hemi.length=M,n.sunShadow.length=d,n.sunShadowMap.length=d,n.sunShadowMatrix.length=_,n.sunShadowCascade.length=_,n.directionalShadow.length=b,n.directionalShadowMap.length=b,n.directionalShadowMatrix.length=b,n.pointShadow.length=w,n.pointShadowMap.length=w,n.pointShadowMatrix.length=w,n.spotShadow.length=x,n.spotShadowMap.length=x,n.spotLightMatrix.length=x+S-P,n.spotLightMap.length=S,n.numSpotLightShadowsWithMaps=P,n.numLightProbes=R,C.sunLength=p,C.directionalLength=m,C.pointLength=g,C.spotLength=y,C.rectAreaLength=v,C.hemiLength=M,C.numSunShadows=d,C.numDirectionalShadows=b,C.numPointShadows=w,C.numSpotShadows=x,C.numSpotMaps=S,C.numLightProbes=R,n.version=rx++)}function l(c,h){let f=0,u=0,p=0,d=0,_=0,m=0,g=h.matrixWorldInverse;for(let y=0,v=c.length;y<v;y++){let M=c[y];if(M.isSunLight){let b=n.sun[f];b.direction.setFromMatrixPosition(M.matrixWorld),b.direction.transformDirection(g),f++}else if(M.isDirectionalLight){let b=n.directional[u];b.direction.setFromMatrixPosition(M.matrixWorld),s.setFromMatrixPosition(M.target.matrixWorld),b.direction.sub(s),b.direction.transformDirection(g),u++}else if(M.isSpotLight){let b=n.spot[d];b.position.setFromMatrixPosition(M.matrixWorld),b.position.applyMatrix4(g),b.direction.setFromMatrixPosition(M.matrixWorld),s.setFromMatrixPosition(M.target.matrixWorld),b.direction.sub(s),b.direction.transformDirection(g),d++}else if(M.isRectAreaLight){let b=n.rectArea[_];b.position.setFromMatrixPosition(M.matrixWorld),b.position.applyMatrix4(g),a.identity(),r.copy(M.matrixWorld),r.premultiply(g),a.extractRotation(r),b.halfWidth.set(M.width*.5,0,0),b.halfHeight.set(0,M.height*.5,0),b.halfWidth.applyMatrix4(a),b.halfHeight.applyMatrix4(a),_++}else if(M.isPointLight){let b=n.point[p];b.position.setFromMatrixPosition(M.matrixWorld),b.position.applyMatrix4(g),p++}else if(M.isHemisphereLight){let b=n.hemi[m];b.direction.setFromMatrixPosition(M.matrixWorld),b.direction.transformDirection(g),m++}}}return{setup:o,setupView:l,state:n}}function yu(i){let e=new ox(i),t=[],n=[],s=[];function r(f){h.camera=f,t.length=0,n.length=0,s.length=0}function a(f){f.isLightProbeGrid?s.push(f):t.push(f)}function o(f){n.push(f)}function l(){e.setup(t),s.sort((f,u)=>f.priority-u.priority||f.id-u.id)}function c(f){e.setupView(t,f)}let h={lightsArray:t,shadowsArray:n,lightProbeGridArray:s,camera:null,lights:e,transmissionRenderTarget:{},textureUnits:0};return{init:r,state:h,setupLights:l,setupLightsView:c,pushLight:a,pushShadow:o}}function lx(i){let e=new WeakMap;function t(s,r=0){let a=e.get(s),o;return a===void 0?(o=new yu(i),e.set(s,[o])):r>=a.length?(o=new yu(i),a.push(o)):o=a[r],o}function n(){e=new WeakMap}return{get:t,dispose:n}}var cx=`void main() {
	gl_Position = vec4( position, 1.0 );
}`,hx=`uniform sampler2D shadow_pass;
uniform vec2 resolution;
uniform float radius;
void main() {
	const float samples = float( VSM_SAMPLES );
	float mean = 0.0;
	float squared_mean = 0.0;
	float uvStride = samples <= 1.0 ? 0.0 : 2.0 / ( samples - 1.0 );
	float uvStart = samples <= 1.0 ? 0.0 : - 1.0;
	for ( float i = 0.0; i < samples; i ++ ) {
		float uvOffset = uvStart + i * uvStride;
		#ifdef HORIZONTAL_PASS
			vec2 distribution = texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( uvOffset, 0.0 ) * radius ) / resolution ).rg;
			mean += distribution.x;
			squared_mean += distribution.y * distribution.y + distribution.x * distribution.x;
		#else
			float depth = texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( 0.0, uvOffset ) * radius ) / resolution ).r;
			mean += depth;
			squared_mean += depth * depth;
		#endif
	}
	mean = mean / samples;
	squared_mean = squared_mean / samples;
	float std_dev = sqrt( max( 0.0, squared_mean - mean * mean ) );
	gl_FragColor = vec4( mean, std_dev, 0.0, 1.0 );
}`,ux=[new G(1,0,0),new G(-1,0,0),new G(0,1,0),new G(0,-1,0),new G(0,0,1),new G(0,0,-1)],dx=[new G(0,-1,0),new G(0,-1,0),new G(0,0,1),new G(0,0,-1),new G(0,-1,0),new G(0,-1,0)],Mu=new xt,pr=new G,ec=new G;function fx(i,e,t){let n=new Vi,s=new Xe,r=new Xe,a=new lt,o=new _a,l=new ya,c={},h=t.maxTextureSize,f={[Ti]:sn,[sn]:Ti,[Tn]:Tn},u=new Ot({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new Xe},radius:{value:4}},vertexShader:cx,fragmentShader:hx}),p=u.clone();p.defines.HORIZONTAL_PASS=1;let d=new wn;d.setAttribute("position",new Yt(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));let _=new Ft(d,u),m=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=rr;let g=this.type;this.render=function(w,x,S){if(m.enabled===!1||m.autoUpdate===!1&&m.needsUpdate===!1||w.length===0)return;this.type===mh&&(Le("WebGLShadowMap: PCFSoftShadowMap has been removed. Using PCFShadowMap instead."),this.type=rr);let P=i.getRenderTarget(),R=i.getActiveCubeFace(),C=i.getActiveMipmapLevel(),D=i.state;D.setBlending(Wi),D.buffers.depth.getReversed()===!0?D.buffers.color.setClear(0,0,0,0):D.buffers.color.setClear(1,1,1,1),D.buffers.depth.setTest(!0),D.setScissorTest(!1);let F=g!==this.type;F&&x.traverse(function(L){L.material&&(Array.isArray(L.material)?L.material.forEach(V=>V.needsUpdate=!0):L.material.needsUpdate=!0)});for(let L=0,V=w.length;L<V;L++){let $=w[L],H=$.shadow;if(H===void 0){Le("WebGLShadowMap:",$,"has no shadow.");continue}if(H.autoUpdate===!1&&H.needsUpdate===!1)continue;s.copy(H.mapSize);let te=H.getFrameExtents();s.multiply(te),r.copy(H.mapSize),(s.x>h||s.y>h)&&(s.x>h&&(r.x=Math.floor(h/te.x),s.x=r.x*te.x,H.mapSize.x=r.x),s.y>h&&(r.y=Math.floor(h/te.y),s.y=r.y*te.y,H.mapSize.y=r.y));let X=i.state.buffers.depth.getReversed();if(H.camera._reversedDepth=X,H.map===null||F===!0){if(H.map!==null&&(H.map.depthTexture!==null&&(H.map.depthTexture.dispose(),H.map.depthTexture=null),H.map.dispose()),this.type===Ms){if($.isPointLight){Le("WebGLShadowMap: VSM shadow maps are not supported for PointLights. Use PCF or BasicShadowMap instead.");continue}H.map=new nn(s.x,s.y,{format:Ei,type:Fn,minFilter:Mt,magFilter:Mt,generateMipmaps:!1}),H.map.texture.name=$.name+".shadowMap",H.map.depthTexture=new oi(s.x,s.y,Un),H.map.depthTexture.name=$.name+".shadowMapDepth",H.map.depthTexture.format=ri,H.map.depthTexture.compareFunction=null,H.map.depthTexture.minFilter=Ut,H.map.depthTexture.magFilter=Ut}else $.isPointLight?(H.map=new gr(s.x),H.map.depthTexture=new er(s.x,Nn)):(H.map=new nn(s.x,s.y),H.map.depthTexture=new oi(s.x,s.y,Nn)),H.map.depthTexture.name=$.name+".shadowMap",H.map.depthTexture.format=ri,this.type===rr?(H.map.depthTexture.compareFunction=X?Hl:Vl,H.map.depthTexture.minFilter=Mt,H.map.depthTexture.magFilter=Mt):(H.map.depthTexture.compareFunction=null,H.map.depthTexture.minFilter=Ut,H.map.depthTexture.magFilter=Ut);H.camera.updateProjectionMatrix()}H.map.isWebGLCubeRenderTarget!==!0&&(H.map.width!==s.x||H.map.height!==s.y)&&H.map.setSize(s.x,s.y);let ee=H.map.isWebGLCubeRenderTarget?6:H.getViewportCount();$.isPointLight!==!0&&H.updateMatrices($,S);let Q=(H.camera.layers.mask&4294967294)!==0?H.camera.layers:S.layers;for(let _e=0;_e<ee;_e++){let Ne=H.getCamera(_e);if($.isPointLight){let Z=H.camera,me=H.matrix,Me=$.distance||Z.far;Me!==Z.far&&(Z.far=Me,Z.updateProjectionMatrix()),pr.setFromMatrixPosition($.matrixWorld),Z.position.copy(pr),ec.copy(Z.position),ec.add(ux[_e]),Z.up.copy(dx[_e]),Z.lookAt(ec),Z.updateMatrixWorld(),me.makeTranslation(-pr.x,-pr.y,-pr.z),Mu.multiplyMatrices(Z.projectionMatrix,Z.matrixWorldInverse),H._frustum.setFromProjectionMatrix(Mu,Z.coordinateSystem,Z.reversedDepth)}if(H.map.isWebGLCubeRenderTarget)i.setRenderTarget(H.map,_e),i.clear();else{_e===0&&(i.setRenderTarget(H.map),i.clear());let Z=H.getViewport(_e);a.set(r.x*Z.x,r.y*Z.y,r.x*Z.z,r.y*Z.w),D.viewport(a)}n=H.getFrustum(_e),M(x,S,Ne,$,Q,this.type)}H.isPointLightShadow!==!0&&this.type===Ms&&y(H,S),H.needsUpdate=!1}g=this.type,m.needsUpdate=!1,i.setRenderTarget(P,R,C)};function y(w,x){let S=e.update(_);u.defines.VSM_SAMPLES!==w.blurSamples&&(u.defines.VSM_SAMPLES=w.blurSamples,p.defines.VSM_SAMPLES=w.blurSamples,u.needsUpdate=!0,p.needsUpdate=!0),w.mapPass===null?w.mapPass=new nn(s.x,s.y,{format:Ei,type:Fn}):(w.mapPass.width!==w.map.width||w.mapPass.height!==w.map.height)&&w.mapPass.setSize(w.map.width,w.map.height),u.uniforms.shadow_pass.value=w.map.depthTexture,u.uniforms.resolution.value.set(w.map.width,w.map.height),u.uniforms.radius.value=w.radius,i.setRenderTarget(w.mapPass),i.clear(),i.renderBufferDirect(x,null,S,u,_,null),p.uniforms.shadow_pass.value=w.mapPass.texture,p.uniforms.resolution.value.set(w.map.width,w.map.height),p.uniforms.radius.value=w.radius,i.setRenderTarget(w.map),i.clear(),i.renderBufferDirect(x,null,S,p,_,null)}function v(w,x,S,P){let R=null,C=S.isPointLight===!0?w.customDistanceMaterial:w.customDepthMaterial;if(C!==void 0)R=C;else if(R=S.isPointLight===!0?l:o,i.localClippingEnabled&&x.clipShadows===!0&&Array.isArray(x.clippingPlanes)&&x.clippingPlanes.length!==0||x.displacementMap&&x.displacementScale!==0||x.alphaMap&&x.alphaTest>0||x.map&&x.alphaTest>0||x.alphaToCoverage===!0){let D=R.uuid,F=x.uuid,L=c[D];L===void 0&&(L={},c[D]=L);let V=L[F];V===void 0&&(V=R.clone(),L[F]=V,x.addEventListener("dispose",b)),R=V}if(R.visible=x.visible,R.wireframe=x.wireframe,P===Ms?R.side=x.shadowSide!==null?x.shadowSide:x.side:R.side=x.shadowSide!==null?x.shadowSide:f[x.side],R.alphaMap=x.alphaMap,R.alphaTest=x.alphaToCoverage===!0?.5:x.alphaTest,R.map=x.map,R.clipShadows=x.clipShadows,R.clippingPlanes=x.clippingPlanes,R.clipIntersection=x.clipIntersection,R.displacementMap=x.displacementMap,R.displacementScale=x.displacementScale,R.displacementBias=x.displacementBias,R.wireframeLinewidth=x.wireframeLinewidth,R.linewidth=x.linewidth,S.isPointLight===!0&&R.isMeshDistanceMaterial===!0){let D=i.properties.get(R);D.light=S}return R}function M(w,x,S,P,R,C){if(w.visible===!1)return;if(w.layers.test(R)&&(w.isMesh||w.isLine||w.isPoints)&&(w.castShadow||w.receiveShadow&&C===Ms)&&(!w.frustumCulled||w.intersectsFrustum(n))){w.modelViewMatrix.multiplyMatrices(S.matrixWorldInverse,w.matrixWorld);let L=e.update(w),V=w.material;if(Array.isArray(V)){let $=L.groups;for(let H=0,te=$.length;H<te;H++){let X=$[H],ee=V[X.materialIndex];if(ee&&ee.visible){let Q=v(w,ee,P,C);w.onBeforeShadow(i,w,x,S,L,Q,X),i.renderBufferDirect(S,null,L,Q,w,X),w.onAfterShadow(i,w,x,S,L,Q,X)}}}else if(V.visible){let $=v(w,V,P,C);w.onBeforeShadow(i,w,x,S,L,$,null),i.renderBufferDirect(S,null,L,$,w,null),w.onAfterShadow(i,w,x,S,L,$,null)}}let F=w.children;for(let L=0,V=F.length;L<V;L++)M(F[L],x,S,P,R,C)}function b(w){w.target.removeEventListener("dispose",b);for(let S in c){let P=c[S],R=w.target.uuid;R in P&&(P[R].dispose(),delete P[R])}}}function px(i,e){function t(){let I=!1,K=new lt,q=null,le=new lt(0,0,0,0);return{setMask:function(se){q!==se&&!I&&(i.colorMask(se,se,se,se),q=se)},setLocked:function(se){I=se},setClear:function(se,ae,Ee,Ge,ie){ie===!0&&(se*=Ge,ae*=Ge,Ee*=Ge),K.set(se,ae,Ee,Ge),le.equals(K)===!1&&(i.clearColor(se,ae,Ee,Ge),le.copy(K))},reset:function(){I=!1,q=null,le.set(-1,0,0,0)}}}function n(){let I=!1,K=!1,q=null,le=null,se=null;return{setReversed:function(ae){if(K!==ae){let Ee=e.get("EXT_clip_control");ae?Ee.clipControlEXT(Ee.LOWER_LEFT_EXT,Ee.ZERO_TO_ONE_EXT):Ee.clipControlEXT(Ee.LOWER_LEFT_EXT,Ee.NEGATIVE_ONE_TO_ONE_EXT),K=ae;let Ge=se;se=null,this.setClear(Ge)}},getReversed:function(){return K},setTest:function(ae){ae?ge(i.DEPTH_TEST):ze(i.DEPTH_TEST)},setMask:function(ae){q!==ae&&!I&&(i.depthMask(ae),q=ae)},setFunc:function(ae){if(K&&(ae=Zh[ae]),le!==ae){switch(ae){case ta:i.depthFunc(i.NEVER);break;case na:i.depthFunc(i.ALWAYS);break;case ia:i.depthFunc(i.LESS);break;case ds:i.depthFunc(i.LEQUAL);break;case sa:i.depthFunc(i.EQUAL);break;case ra:i.depthFunc(i.GEQUAL);break;case aa:i.depthFunc(i.GREATER);break;case oa:i.depthFunc(i.NOTEQUAL);break;default:i.depthFunc(i.LEQUAL)}le=ae}},setLocked:function(ae){I=ae},setClear:function(ae){se!==ae&&(se=ae,K&&(ae=1-ae),i.clearDepth(ae))},reset:function(){I=!1,q=null,le=null,se=null,K=!1}}}function s(){let I=!1,K=null,q=null,le=null,se=null,ae=null,Ee=null,Ge=null,ie=null;return{setTest:function(Ae){I||(Ae?ge(i.STENCIL_TEST):ze(i.STENCIL_TEST))},setMask:function(Ae){K!==Ae&&!I&&(i.stencilMask(Ae),K=Ae)},setFunc:function(Ae,Be,fe){(q!==Ae||le!==Be||se!==fe)&&(i.stencilFunc(Ae,Be,fe),q=Ae,le=Be,se=fe)},setOp:function(Ae,Be,fe){(ae!==Ae||Ee!==Be||Ge!==fe)&&(i.stencilOp(Ae,Be,fe),ae=Ae,Ee=Be,Ge=fe)},setLocked:function(Ae){I=Ae},setClear:function(Ae){ie!==Ae&&(i.clearStencil(Ae),ie=Ae)},reset:function(){I=!1,K=null,q=null,le=null,se=null,ae=null,Ee=null,Ge=null,ie=null}}}let r=new t,a=new n,o=new s,l={},c=new WeakMap,h={},f={},u={},p=new WeakMap,d=[],_=null,m=!1,g=null,y=null,v=null,M=null,b=null,w=null,x=null,S=new je(0,0,0),P=0,R=!1,C=null,D=null,F=null,L=null,V=null,$=i.getParameter(i.MAX_COMBINED_TEXTURE_IMAGE_UNITS),H=!1,te=0,X=i.getParameter(i.VERSION);X.indexOf("WebGL")!==-1?(te=parseFloat(/^WebGL (\d)/.exec(X)[1]),H=te>=1):X.indexOf("OpenGL ES")!==-1&&(te=parseFloat(/^OpenGL ES (\d)/.exec(X)[1]),H=te>=2);let ee=null,Q={},_e=i.getParameter(i.SCISSOR_BOX),Ne=i.getParameter(i.VIEWPORT),Z=new lt().fromArray(_e),me=new lt().fromArray(Ne);function Me(I,K,q,le){let se=new Uint8Array(4),ae=i.createTexture();i.bindTexture(I,ae),i.texParameteri(I,i.TEXTURE_MIN_FILTER,i.NEAREST),i.texParameteri(I,i.TEXTURE_MAG_FILTER,i.NEAREST);for(let Ee=0;Ee<q;Ee++)I===i.TEXTURE_3D||I===i.TEXTURE_2D_ARRAY?i.texImage3D(K,0,i.RGBA,1,1,le,0,i.RGBA,i.UNSIGNED_BYTE,se):i.texImage2D(K+Ee,0,i.RGBA,1,1,0,i.RGBA,i.UNSIGNED_BYTE,se);return ae}let Ce={};Ce[i.TEXTURE_2D]=Me(i.TEXTURE_2D,i.TEXTURE_2D,1),Ce[i.TEXTURE_CUBE_MAP]=Me(i.TEXTURE_CUBE_MAP,i.TEXTURE_CUBE_MAP_POSITIVE_X,6),Ce[i.TEXTURE_2D_ARRAY]=Me(i.TEXTURE_2D_ARRAY,i.TEXTURE_2D_ARRAY,1,1),Ce[i.TEXTURE_3D]=Me(i.TEXTURE_3D,i.TEXTURE_3D,1,1),r.setClear(0,0,0,1),a.setClear(1),o.setClear(0),ge(i.DEPTH_TEST),a.setFunc(ds),rn(!1),vt(yl),ge(i.CULL_FACE),Bt(Wi);function ge(I){h[I]!==!0&&(i.enable(I),h[I]=!0)}function ze(I){h[I]!==!1&&(i.disable(I),h[I]=!1)}function St(I,K){return u[I]!==K?(i.bindFramebuffer(I,K),u[I]=K,I===i.DRAW_FRAMEBUFFER&&(u[i.FRAMEBUFFER]=K),I===i.FRAMEBUFFER&&(u[i.DRAW_FRAMEBUFFER]=K),!0):!1}function Ie(I,K){let q=d,le=!1;if(I){q=p.get(K),q===void 0&&(q=[],p.set(K,q));let se=I.textures;if(q.length!==se.length||q[0]!==i.COLOR_ATTACHMENT0){for(let ae=0,Ee=se.length;ae<Ee;ae++)q[ae]=i.COLOR_ATTACHMENT0+ae;q.length=se.length,le=!0}}else q[0]!==i.BACK&&(q[0]=i.BACK,le=!0);le&&i.drawBuffers(q)}function at(I){return _!==I?(i.useProgram(I),_=I,!0):!1}let ct={[Xi]:i.FUNC_ADD,[xh]:i.FUNC_SUBTRACT,[vh]:i.FUNC_REVERSE_SUBTRACT};ct[_h]=i.MIN,ct[yh]=i.MAX;let qe={[Mh]:i.ZERO,[bh]:i.ONE,[Sh]:i.SRC_COLOR,[Sl]:i.SRC_ALPHA,[Ch]:i.SRC_ALPHA_SATURATE,[Ah]:i.DST_COLOR,[Th]:i.DST_ALPHA,[wh]:i.ONE_MINUS_SRC_COLOR,[wl]:i.ONE_MINUS_SRC_ALPHA,[Rh]:i.ONE_MINUS_DST_COLOR,[Eh]:i.ONE_MINUS_DST_ALPHA,[Ph]:i.CONSTANT_COLOR,[Ih]:i.ONE_MINUS_CONSTANT_COLOR,[Lh]:i.CONSTANT_ALPHA,[Dh]:i.ONE_MINUS_CONSTANT_ALPHA};function Bt(I,K,q,le,se,ae,Ee,Ge,ie,Ae){if(I===Wi){m===!0&&(ze(i.BLEND),m=!1);return}if(m===!1&&(ge(i.BLEND),m=!0),I!==gh){if(I!==g||Ae!==R){if((y!==Xi||b!==Xi)&&(i.blendEquation(i.FUNC_ADD),y=Xi,b=Xi),Ae)switch(I){case bs:i.blendFuncSeparate(i.ONE,i.ONE_MINUS_SRC_ALPHA,i.ONE,i.ONE_MINUS_SRC_ALPHA);break;case Ss:i.blendFunc(i.ONE,i.ONE);break;case Ml:i.blendFuncSeparate(i.ZERO,i.ONE_MINUS_SRC_COLOR,i.ZERO,i.ONE);break;case bl:i.blendFuncSeparate(i.DST_COLOR,i.ONE_MINUS_SRC_ALPHA,i.ZERO,i.ONE);break;default:De("WebGLState: Invalid blending: ",I);break}else switch(I){case bs:i.blendFuncSeparate(i.SRC_ALPHA,i.ONE_MINUS_SRC_ALPHA,i.ONE,i.ONE_MINUS_SRC_ALPHA);break;case Ss:i.blendFuncSeparate(i.SRC_ALPHA,i.ONE,i.ONE,i.ONE);break;case Ml:De("WebGLState: SubtractiveBlending requires material.premultipliedAlpha = true");break;case bl:De("WebGLState: MultiplyBlending requires material.premultipliedAlpha = true");break;default:De("WebGLState: Invalid blending: ",I);break}v=null,M=null,w=null,x=null,S.set(0,0,0),P=0,g=I,R=Ae}return}se=se||K,ae=ae||q,Ee=Ee||le,(K!==y||se!==b)&&(i.blendEquationSeparate(ct[K],ct[se]),y=K,b=se),(q!==v||le!==M||ae!==w||Ee!==x)&&(i.blendFuncSeparate(qe[q],qe[le],qe[ae],qe[Ee]),v=q,M=le,w=ae,x=Ee),(Ge.equals(S)===!1||ie!==P)&&(i.blendColor(Ge.r,Ge.g,Ge.b,ie),S.copy(Ge),P=ie),g=I,R=!1}function At(I,K){I.side===Tn?ze(i.CULL_FACE):ge(i.CULL_FACE);let q=I.side===sn;K&&(q=!q),rn(q),I.blending===bs&&I.transparent===!1?Bt(Wi):Bt(I.blending,I.blendEquation,I.blendSrc,I.blendDst,I.blendEquationAlpha,I.blendSrcAlpha,I.blendDstAlpha,I.blendColor,I.blendAlpha,I.premultipliedAlpha),a.setFunc(I.depthFunc),a.setTest(I.depthTest),a.setMask(I.depthWrite),r.setMask(I.colorWrite);let le=I.stencilWrite;o.setTest(le),le&&(o.setMask(I.stencilWriteMask),o.setFunc(I.stencilFunc,I.stencilRef,I.stencilFuncMask),o.setOp(I.stencilFail,I.stencilZFail,I.stencilZPass)),It(I.polygonOffset,I.polygonOffsetFactor,I.polygonOffsetUnits),I.alphaToCoverage===!0?ge(i.SAMPLE_ALPHA_TO_COVERAGE):ze(i.SAMPLE_ALPHA_TO_COVERAGE)}function rn(I){C!==I&&(I?i.frontFace(i.CW):i.frontFace(i.CCW),C=I)}function vt(I){I!==fh?(ge(i.CULL_FACE),I!==D&&(I===yl?i.cullFace(i.BACK):I===ph?i.cullFace(i.FRONT):i.cullFace(i.FRONT_AND_BACK))):ze(i.CULL_FACE),D=I}function Bn(I){I!==F&&(H&&i.lineWidth(I),F=I)}function It(I,K,q){I?(ge(i.POLYGON_OFFSET_FILL),(L!==K||V!==q)&&(L=K,V=q,a.getReversed()&&(K=-K,q=-q),i.polygonOffset(K,q))):ze(i.POLYGON_OFFSET_FILL)}function mn(I){I?ge(i.SCISSOR_TEST):ze(i.SCISSOR_TEST)}function gn(I){I===void 0&&(I=i.TEXTURE0+$-1),ee!==I&&(i.activeTexture(I),ee=I)}function xn(I,K,q){q===void 0&&(ee===null?q=i.TEXTURE0+$-1:q=ee);let le=Q[q];le===void 0&&(le={type:void 0,texture:void 0},Q[q]=le),(le.type!==I||le.texture!==K)&&(ee!==q&&(i.activeTexture(q),ee=q),i.bindTexture(I,K||Ce[I]),le.type=I,le.texture=K)}function U(){let I=Q[ee];I!==void 0&&I.type!==void 0&&(i.bindTexture(I.type,null),I.type=void 0,I.texture=void 0)}function vn(){try{i.compressedTexImage2D(...arguments)}catch(I){De("WebGLState:",I)}}function mt(){try{i.compressedTexImage3D(...arguments)}catch(I){De("WebGLState:",I)}}function gt(){try{i.texSubImage2D(...arguments)}catch(I){De("WebGLState:",I)}}function de(){try{i.texSubImage3D(...arguments)}catch(I){De("WebGLState:",I)}}function Rt(){try{i.compressedTexSubImage2D(...arguments)}catch(I){De("WebGLState:",I)}}function Pe(){try{i.compressedTexSubImage3D(...arguments)}catch(I){De("WebGLState:",I)}}function Oe(){try{i.texStorage2D(...arguments)}catch(I){De("WebGLState:",I)}}function A(){try{i.texStorage3D(...arguments)}catch(I){De("WebGLState:",I)}}function T(){try{i.texImage2D(...arguments)}catch(I){De("WebGLState:",I)}}function k(){try{i.texImage3D(...arguments)}catch(I){De("WebGLState:",I)}}function ne(I){return f[I]!==void 0?f[I]:i.getParameter(I)}function j(I,K){f[I]!==K&&(i.pixelStorei(I,K),f[I]=K)}function re(I){Z.equals(I)===!1&&(i.scissor(I.x,I.y,I.z,I.w),Z.copy(I))}function he(I){me.equals(I)===!1&&(i.viewport(I.x,I.y,I.z,I.w),me.copy(I))}function Y(I,K){let q=c.get(K);q===void 0&&(q=new WeakMap,c.set(K,q));let le=q.get(I);le===void 0&&(le=i.getUniformBlockIndex(K,I.name),i.uniformBlockBinding(K,le,le),q.set(I,le))}function J(I,K,q){let se=c.get(K).get(I);l[se]!==q&&(i.bindBufferBase(i.UNIFORM_BUFFER,se,q),l[se]=q)}function oe(){i.disable(i.BLEND),i.disable(i.CULL_FACE),i.disable(i.DEPTH_TEST),i.disable(i.POLYGON_OFFSET_FILL),i.disable(i.SCISSOR_TEST),i.disable(i.STENCIL_TEST),i.disable(i.SAMPLE_ALPHA_TO_COVERAGE),i.blendEquation(i.FUNC_ADD),i.blendFunc(i.ONE,i.ZERO),i.blendFuncSeparate(i.ONE,i.ZERO,i.ONE,i.ZERO),i.blendColor(0,0,0,0),i.colorMask(!0,!0,!0,!0),i.clearColor(0,0,0,0),i.depthMask(!0),i.depthFunc(i.LESS),a.setReversed(!1),i.clearDepth(1),i.stencilMask(4294967295),i.stencilFunc(i.ALWAYS,0,4294967295),i.stencilOp(i.KEEP,i.KEEP,i.KEEP),i.clearStencil(0),i.cullFace(i.BACK),i.frontFace(i.CCW),i.polygonOffset(0,0),i.activeTexture(i.TEXTURE0),i.bindFramebuffer(i.FRAMEBUFFER,null),i.bindFramebuffer(i.DRAW_FRAMEBUFFER,null),i.bindFramebuffer(i.READ_FRAMEBUFFER,null),i.useProgram(null),i.lineWidth(1),i.scissor(0,0,i.canvas.width,i.canvas.height),i.viewport(0,0,i.canvas.width,i.canvas.height),i.pixelStorei(i.PACK_ALIGNMENT,4),i.pixelStorei(i.UNPACK_ALIGNMENT,4),i.pixelStorei(i.UNPACK_FLIP_Y_WEBGL,!1),i.pixelStorei(i.UNPACK_PREMULTIPLY_ALPHA_WEBGL,!1),i.pixelStorei(i.UNPACK_COLORSPACE_CONVERSION_WEBGL,i.BROWSER_DEFAULT_WEBGL),i.pixelStorei(i.PACK_ROW_LENGTH,0),i.pixelStorei(i.PACK_SKIP_PIXELS,0),i.pixelStorei(i.PACK_SKIP_ROWS,0),i.pixelStorei(i.UNPACK_ROW_LENGTH,0),i.pixelStorei(i.UNPACK_IMAGE_HEIGHT,0),i.pixelStorei(i.UNPACK_SKIP_PIXELS,0),i.pixelStorei(i.UNPACK_SKIP_ROWS,0),i.pixelStorei(i.UNPACK_SKIP_IMAGES,0),h={},f={},ee=null,Q={},u={},l={},p=new WeakMap,d=[],_=null,m=!1,g=null,y=null,v=null,M=null,b=null,w=null,x=null,S=new je(0,0,0),P=0,R=!1,C=null,D=null,F=null,L=null,V=null,Z.set(0,0,i.canvas.width,i.canvas.height),me.set(0,0,i.canvas.width,i.canvas.height),r.reset(),a.reset(),o.reset()}return{buffers:{color:r,depth:a,stencil:o},enable:ge,disable:ze,bindFramebuffer:St,drawBuffers:Ie,useProgram:at,setBlending:Bt,setMaterial:At,setFlipSided:rn,setCullFace:vt,setLineWidth:Bn,setPolygonOffset:It,setScissorTest:mn,activeTexture:gn,bindTexture:xn,unbindTexture:U,compressedTexImage2D:vn,compressedTexImage3D:mt,texImage2D:T,texImage3D:k,pixelStorei:j,getParameter:ne,updateUBOMapping:Y,uniformBlockBinding:J,texStorage2D:Oe,texStorage3D:A,texSubImage2D:gt,texSubImage3D:de,compressedTexSubImage2D:Rt,compressedTexSubImage3D:Pe,scissor:re,viewport:he,reset:oe}}function mx(i,e,t,n,s,r,a){let o=e.has("WEBGL_multisampled_render_to_texture")?e.get("WEBGL_multisampled_render_to_texture"):null,l=typeof navigator>"u"?!1:/OculusBrowser/g.test(navigator.userAgent),c=new Xe,h=new WeakMap,f=new Set,u,p=new WeakMap,d=new Set,_=new FinalizationRegistry(A=>d.delete(A)),m=!1;try{m=typeof OffscreenCanvas<"u"&&new OffscreenCanvas(1,1).getContext("2d")!==null}catch{}function g(A,T){return m?new OffscreenCanvas(A,T):$s("canvas")}function y(A,T,k){let ne=1,j=Oe(A);if((j.width>k||j.height>k)&&(ne=k/Math.max(j.width,j.height)),ne<1)if(typeof HTMLImageElement<"u"&&A instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&A instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&A instanceof ImageBitmap||typeof VideoFrame<"u"&&A instanceof VideoFrame){let re=Math.floor(ne*j.width),he=Math.floor(ne*j.height);u===void 0&&(u=g(re,he));let Y=T?g(re,he):u;return Y.width=re,Y.height=he,Y.getContext("2d").drawImage(A,0,0,re,he),Le("WebGLRenderer: Texture has been resized from ("+j.width+"x"+j.height+") to ("+re+"x"+he+")."),Y}else return"data"in A&&Le("WebGLRenderer: Image in DataTexture is too big ("+j.width+"x"+j.height+")."),A;return A}function v(A){return A.generateMipmaps}function M(A){i.generateMipmap(A)}function b(A){return A.isWebGLCubeRenderTarget?i.TEXTURE_CUBE_MAP:A.isWebGL3DRenderTarget?i.TEXTURE_3D:A.isWebGLArrayRenderTarget||A.isCompressedArrayTexture?i.TEXTURE_2D_ARRAY:i.TEXTURE_2D}function w(A,T,k,ne,j,re=!1){if(A!==null){if(i[A]!==void 0)return i[A];Le("WebGLRenderer: Attempt to use non-existing WebGL internal format '"+A+"'")}let he;ne&&(he=e.get("EXT_texture_norm16"),he||Le("WebGLRenderer: Unable to use normalized textures without EXT_texture_norm16 extension"));let Y=T;if(T===i.RED&&(k===i.FLOAT&&(Y=i.R32F),k===i.HALF_FLOAT&&(Y=i.R16F),k===i.UNSIGNED_BYTE&&(Y=i.R8),k===i.UNSIGNED_SHORT&&he&&(Y=he.R16_EXT),k===i.SHORT&&he&&(Y=he.R16_SNORM_EXT)),T===i.RED_INTEGER&&(k===i.UNSIGNED_BYTE&&(Y=i.R8UI),k===i.UNSIGNED_SHORT&&(Y=i.R16UI),k===i.UNSIGNED_INT&&(Y=i.R32UI),k===i.BYTE&&(Y=i.R8I),k===i.SHORT&&(Y=i.R16I),k===i.INT&&(Y=i.R32I)),T===i.RG&&(k===i.FLOAT&&(Y=i.RG32F),k===i.HALF_FLOAT&&(Y=i.RG16F),k===i.UNSIGNED_BYTE&&(Y=i.RG8),k===i.UNSIGNED_SHORT&&he&&(Y=he.RG16_EXT),k===i.SHORT&&he&&(Y=he.RG16_SNORM_EXT)),T===i.RG_INTEGER&&(k===i.UNSIGNED_BYTE&&(Y=i.RG8UI),k===i.UNSIGNED_SHORT&&(Y=i.RG16UI),k===i.UNSIGNED_INT&&(Y=i.RG32UI),k===i.BYTE&&(Y=i.RG8I),k===i.SHORT&&(Y=i.RG16I),k===i.INT&&(Y=i.RG32I)),T===i.RGB_INTEGER&&(k===i.UNSIGNED_BYTE&&(Y=i.RGB8UI),k===i.UNSIGNED_SHORT&&(Y=i.RGB16UI),k===i.UNSIGNED_INT&&(Y=i.RGB32UI),k===i.BYTE&&(Y=i.RGB8I),k===i.SHORT&&(Y=i.RGB16I),k===i.INT&&(Y=i.RGB32I)),T===i.RGBA_INTEGER&&(k===i.UNSIGNED_BYTE&&(Y=i.RGBA8UI),k===i.UNSIGNED_SHORT&&(Y=i.RGBA16UI),k===i.UNSIGNED_INT&&(Y=i.RGBA32UI),k===i.BYTE&&(Y=i.RGBA8I),k===i.SHORT&&(Y=i.RGBA16I),k===i.INT&&(Y=i.RGBA32I)),T===i.RGB&&(k===i.UNSIGNED_SHORT&&he&&(Y=he.RGB16_EXT),k===i.SHORT&&he&&(Y=he.RGB16_SNORM_EXT),k===i.UNSIGNED_INT_5_9_9_9_REV&&(Y=i.RGB9_E5),k===i.UNSIGNED_INT_10F_11F_11F_REV&&(Y=i.R11F_G11F_B10F)),T===i.RGBA){let J=re?Xs:Ze.getTransfer(j);k===i.FLOAT&&(Y=i.RGBA32F),k===i.HALF_FLOAT&&(Y=i.RGBA16F),k===i.UNSIGNED_BYTE&&(Y=J===nt?i.SRGB8_ALPHA8:i.RGBA8),k===i.UNSIGNED_SHORT&&he&&(Y=he.RGBA16_EXT),k===i.SHORT&&he&&(Y=he.RGBA16_SNORM_EXT),k===i.UNSIGNED_SHORT_4_4_4_4&&(Y=i.RGBA4),k===i.UNSIGNED_SHORT_5_5_5_1&&(Y=i.RGB5_A1)}return(Y===i.R16F||Y===i.R32F||Y===i.RG16F||Y===i.RG32F||Y===i.RGBA16F||Y===i.RGBA32F)&&e.get("EXT_color_buffer_float"),Y}function x(A,T){let k;return A?T===null||T===Nn||T===$i?k=i.DEPTH24_STENCIL8:T===Un?k=i.DEPTH32F_STENCIL8:T===Ts&&(k=i.DEPTH24_STENCIL8,Le("DepthTexture: 16 bit depth attachment is not supported with stencil. Using 24-bit attachment.")):T===null||T===Nn||T===$i?k=i.DEPTH_COMPONENT24:T===Un?k=i.DEPTH_COMPONENT32F:T===Ts&&(k=i.DEPTH_COMPONENT16),k}function S(A,T){return v(A)===!0||A.isFramebufferTexture&&A.minFilter!==Ut&&A.minFilter!==Mt?Math.log2(Math.max(T.width,T.height))+1:A.mipmaps.length>0?A.mipmaps.length:A.isCompressedTexture&&Array.isArray(A.image)?T.mipmaps.length:1}function P(A){let T=new WeakRef(A);n.get(A).__ref=T,d.add(T),_.register(A,T,T)}function R(A){let T=n.get(A).__ref;T!==void 0&&(d.delete(T),_.unregister(T))}function C(A){F(A.target)}function D(A){L(A.target)}function F(A){A.removeEventListener("dispose",C),R(A),$(A),A.isVideoTexture&&h.delete(A),A.isHTMLTexture&&f.delete(A)}function L(A){A.removeEventListener("dispose",D),R(A),te(A)}function V(){for(let A of d){let T=A.deref();T!==void 0&&(T.isRenderTarget===!0?L(T):F(T))}d.clear(),f.clear()}function $(A){let T=n.get(A);if(T.__webglInit===void 0)return;let k=A.source,ne=p.get(k);if(ne){let j=ne[T.__cacheKey];j.usedTimes--,j.usedTimes===0&&H(A),Object.keys(ne).length===0&&p.delete(k)}n.remove(A)}function H(A){let T=n.get(A);i.deleteTexture(T.__webglTexture);let k=A.source,ne=p.get(k);delete ne[T.__cacheKey],a.memory.textures--}function te(A){let T=n.get(A);T.__depthDisposeCallback&&T.__depthDisposeCallback();let k=A.depthTexture;if(k&&k.renderTarget===A&&F(k),A.isWebGLCubeRenderTarget)for(let j=0;j<6;j++){if(Array.isArray(T.__webglFramebuffer[j]))for(let re=0;re<T.__webglFramebuffer[j].length;re++)i.deleteFramebuffer(T.__webglFramebuffer[j][re]);else i.deleteFramebuffer(T.__webglFramebuffer[j]);T.__webglDepthbuffer&&i.deleteRenderbuffer(T.__webglDepthbuffer[j])}else{if(Array.isArray(T.__webglFramebuffer))for(let j=0;j<T.__webglFramebuffer.length;j++)i.deleteFramebuffer(T.__webglFramebuffer[j]);else i.deleteFramebuffer(T.__webglFramebuffer);if(T.__webglDepthbuffer&&i.deleteRenderbuffer(T.__webglDepthbuffer),T.__webglMultisampledFramebuffer&&i.deleteFramebuffer(T.__webglMultisampledFramebuffer),T.__webglColorRenderbuffer)for(let j=0;j<T.__webglColorRenderbuffer.length;j++)T.__webglColorRenderbuffer[j]&&i.deleteRenderbuffer(T.__webglColorRenderbuffer[j]);T.__webglDepthRenderbuffer&&i.deleteRenderbuffer(T.__webglDepthRenderbuffer)}let ne=A.textures;for(let j=0,re=ne.length;j<re;j++){let he=n.get(ne[j]);he.__webglTexture&&(i.deleteTexture(he.__webglTexture),a.memory.textures--),n.remove(ne[j])}n.remove(A)}let X=0;function ee(){X=0}function Q(){return X}function _e(A){X=A}function Ne(){let A=X;return A>=s.maxTextures&&Le("WebGLTextures: Trying to use "+(A+1)+" texture units while this GPU supports only "+s.maxTextures),X+=1,A}function Z(A){let T=[];return T.push(A.wrapS),T.push(A.wrapT),T.push(A.wrapR||0),T.push(A.magFilter),T.push(A.minFilter),T.push(A.anisotropy),T.push(A.internalFormat),T.push(A.format),T.push(A.type),T.push(A.generateMipmaps),T.push(A.mipmapsAutoUpdate),T.push(A.premultiplyAlpha),T.push(A.flipY),T.push(A.unpackAlignment),T.push(A.colorSpace),T.join()}function me(A,T){let k=n.get(A);if(A.isVideoTexture&&Rt(A),A.isRenderTargetTexture===!1&&A.isExternalTexture!==!0&&A.version>0&&k.__version!==A.version){let ne=A.image;if(ne===null)Le("WebGLRenderer: Texture marked for update but no image data found.");else if(ne.complete===!1)Le("WebGLRenderer: Texture marked for update but image is incomplete");else{At(k,A,T);return}}else A.isExternalTexture&&(k.__webglTexture=A.sourceTexture?A.sourceTexture:null);t.bindTexture(i.TEXTURE_2D,k.__webglTexture,i.TEXTURE0+T)}function Me(A,T){let k=n.get(A);if(A.isRenderTargetTexture===!1&&A.version>0&&k.__version!==A.version){At(k,A,T);return}else A.isExternalTexture&&(k.__webglTexture=A.sourceTexture?A.sourceTexture:null);t.bindTexture(i.TEXTURE_2D_ARRAY,k.__webglTexture,i.TEXTURE0+T)}function Ce(A,T){let k=n.get(A);if(A.isRenderTargetTexture===!1&&A.version>0&&k.__version!==A.version){At(k,A,T);return}t.bindTexture(i.TEXTURE_3D,k.__webglTexture,i.TEXTURE0+T)}function ge(A,T){let k=n.get(A);if(A.version>0&&k.__version!==A.version){rn(k,A,T);return}t.bindTexture(i.TEXTURE_CUBE_MAP,k.__webglTexture,i.TEXTURE0+T)}let ze={[fs]:i.REPEAT,[Vn]:i.CLAMP_TO_EDGE,[la]:i.MIRRORED_REPEAT},St={[Ut]:i.NEAREST,[Fh]:i.NEAREST_MIPMAP_NEAREST,[ar]:i.NEAREST_MIPMAP_LINEAR,[Mt]:i.LINEAR,[Na]:i.LINEAR_MIPMAP_NEAREST,[En]:i.LINEAR_MIPMAP_LINEAR},Ie={[Bh]:i.NEVER,[Wl]:i.ALWAYS,[Gh]:i.LESS,[Vl]:i.LEQUAL,[Vh]:i.EQUAL,[Hl]:i.GEQUAL,[Hh]:i.GREATER,[Wh]:i.NOTEQUAL};function at(A,T){if(T.type===Un&&e.has("OES_texture_float_linear")===!1&&(T.magFilter===Mt||T.magFilter===Na||T.magFilter===ar||T.magFilter===En||T.minFilter===Mt||T.minFilter===Na||T.minFilter===ar||T.minFilter===En)&&Le("WebGLRenderer: Unable to use linear filtering with floating point textures. OES_texture_float_linear not supported on this device."),i.texParameteri(A,i.TEXTURE_WRAP_S,ze[T.wrapS]),i.texParameteri(A,i.TEXTURE_WRAP_T,ze[T.wrapT]),(A===i.TEXTURE_3D||A===i.TEXTURE_2D_ARRAY)&&i.texParameteri(A,i.TEXTURE_WRAP_R,ze[T.wrapR]),i.texParameteri(A,i.TEXTURE_MAG_FILTER,St[T.magFilter]),i.texParameteri(A,i.TEXTURE_MIN_FILTER,St[T.minFilter]),T.compareFunction&&(i.texParameteri(A,i.TEXTURE_COMPARE_MODE,i.COMPARE_REF_TO_TEXTURE),i.texParameteri(A,i.TEXTURE_COMPARE_FUNC,Ie[T.compareFunction])),e.has("EXT_texture_filter_anisotropic")===!0){if(T.magFilter===Ut||T.minFilter!==ar&&T.minFilter!==En||T.type===Un&&e.has("OES_texture_float_linear")===!1)return;if(T.anisotropy>1||n.get(T).__currentAnisotropy){let k=e.get("EXT_texture_filter_anisotropic");i.texParameterf(A,k.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(T.anisotropy,s.getMaxAnisotropy())),n.get(T).__currentAnisotropy=T.anisotropy}}}function ct(A,T){let k=!1;A.__webglInit===void 0&&(A.__webglInit=!0,T.addEventListener("dispose",C),P(T));let ne=T.source,j=p.get(ne);j===void 0&&(j={},p.set(ne,j));let re=Z(T);if(re!==A.__cacheKey){j[re]===void 0&&(j[re]={texture:i.createTexture(),usedTimes:0},a.memory.textures++,k=!0),j[re].usedTimes++;let he=j[A.__cacheKey];he!==void 0&&(j[A.__cacheKey].usedTimes--,he.usedTimes===0&&H(T)),A.__cacheKey=re,A.__webglTexture=j[re].texture}return k}function qe(A,T,k){return Math.floor(Math.floor(A/k)/T)}function Bt(A,T,k,ne){let re=A.updateRanges;if(re.length===0)t.texSubImage2D(i.TEXTURE_2D,0,0,0,T.width,T.height,k,ne,T.data);else{re.sort((I,K)=>I.start-K.start);let he=0;for(let I=1;I<re.length;I++){let K=re[he],q=re[I],le=K.start+K.count,se=qe(q.start,T.width,4),ae=qe(K.start,T.width,4);q.start<=le+1&&se===ae&&qe(q.start+q.count-1,T.width,4)===se?K.count=Math.max(K.count,q.start+q.count-K.start):(++he,re[he]=q)}re.length=he+1;let Y=t.getParameter(i.UNPACK_ROW_LENGTH),J=t.getParameter(i.UNPACK_SKIP_PIXELS),oe=t.getParameter(i.UNPACK_SKIP_ROWS);t.pixelStorei(i.UNPACK_ROW_LENGTH,T.width);for(let I=0,K=re.length;I<K;I++){let q=re[I],le=Math.floor(q.start/4),se=Math.ceil(q.count/4),ae=le%T.width,Ee=Math.floor(le/T.width),Ge=se,ie=1;t.pixelStorei(i.UNPACK_SKIP_PIXELS,ae),t.pixelStorei(i.UNPACK_SKIP_ROWS,Ee),t.texSubImage2D(i.TEXTURE_2D,0,ae,Ee,Ge,ie,k,ne,T.data)}A.clearUpdateRanges(),t.pixelStorei(i.UNPACK_ROW_LENGTH,Y),t.pixelStorei(i.UNPACK_SKIP_PIXELS,J),t.pixelStorei(i.UNPACK_SKIP_ROWS,oe)}}function At(A,T,k){let ne=i.TEXTURE_2D;(T.isDataArrayTexture||T.isCompressedArrayTexture)&&(ne=i.TEXTURE_2D_ARRAY),T.isData3DTexture&&(ne=i.TEXTURE_3D);let j=ct(A,T),re=T.source;t.bindTexture(ne,A.__webglTexture,i.TEXTURE0+k);let he=n.get(re);if(re.version!==he.__version||j===!0){if(t.activeTexture(i.TEXTURE0+k),(typeof ImageBitmap<"u"&&T.image instanceof ImageBitmap)===!1){let ie=Ze.getPrimaries(Ze.workingColorSpace),Ae=T.colorSpace===ci?null:Ze.getPrimaries(T.colorSpace),Be=T.colorSpace===ci||ie===Ae?i.NONE:i.BROWSER_DEFAULT_WEBGL;t.pixelStorei(i.UNPACK_FLIP_Y_WEBGL,T.flipY),t.pixelStorei(i.UNPACK_PREMULTIPLY_ALPHA_WEBGL,T.premultiplyAlpha),t.pixelStorei(i.UNPACK_COLORSPACE_CONVERSION_WEBGL,Be)}t.pixelStorei(i.UNPACK_ALIGNMENT,T.unpackAlignment);let J=y(T.image,!1,s.maxTextureSize);J=Pe(T,J);let oe=r.convert(T.format,T.colorSpace),I=r.convert(T.type),K=w(T.internalFormat,oe,I,T.normalized,T.colorSpace,T.isVideoTexture);at(ne,T);let q,le=T.mipmaps,se=T.isVideoTexture!==!0,ae=he.__version===void 0||j===!0,Ee=re.dataReady,Ge=S(T,J);if(T.isDepthTexture)K=x(T.format===li,T.type),ae&&(se?t.texStorage2D(i.TEXTURE_2D,1,K,J.width,J.height):t.texImage2D(i.TEXTURE_2D,0,K,J.width,J.height,0,oe,I,null));else if(T.isDataTexture)if(le.length>0){se&&ae&&t.texStorage2D(i.TEXTURE_2D,Ge,K,le[0].width,le[0].height);for(let ie=0,Ae=le.length;ie<Ae;ie++)q=le[ie],se?Ee&&t.texSubImage2D(i.TEXTURE_2D,ie,0,0,q.width,q.height,oe,I,q.data):t.texImage2D(i.TEXTURE_2D,ie,K,q.width,q.height,0,oe,I,q.data);T.generateMipmaps=!1}else se?(ae&&t.texStorage2D(i.TEXTURE_2D,Ge,K,J.width,J.height),Ee&&Bt(T,J,oe,I)):t.texImage2D(i.TEXTURE_2D,0,K,J.width,J.height,0,oe,I,J.data);else if(T.isCompressedTexture)if(T.isCompressedArrayTexture){se&&ae&&t.texStorage3D(i.TEXTURE_2D_ARRAY,Ge,K,le[0].width,le[0].height,J.depth);for(let ie=0,Ae=le.length;ie<Ae;ie++)if(q=le[ie],T.format!==On)if(oe!==null)if(se){if(Ee)if(T.layerUpdates.size>0){let Be=jl(q.width,q.height,T.format,T.type);for(let fe of T.layerUpdates){let ot=q.data.subarray(fe*Be/q.data.BYTES_PER_ELEMENT,(fe+1)*Be/q.data.BYTES_PER_ELEMENT);t.compressedTexSubImage3D(i.TEXTURE_2D_ARRAY,ie,0,0,fe,q.width,q.height,1,oe,ot)}}else t.compressedTexSubImage3D(i.TEXTURE_2D_ARRAY,ie,0,0,0,q.width,q.height,J.depth,oe,q.data)}else t.compressedTexImage3D(i.TEXTURE_2D_ARRAY,ie,K,q.width,q.height,J.depth,0,q.data,0,0);else Le("WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()");else se?Ee&&t.texSubImage3D(i.TEXTURE_2D_ARRAY,ie,0,0,0,q.width,q.height,J.depth,oe,I,q.data):t.texImage3D(i.TEXTURE_2D_ARRAY,ie,K,q.width,q.height,J.depth,0,oe,I,q.data);T.layerUpdates.size>0&&T.clearLayerUpdates()}else{se&&ae&&t.texStorage2D(i.TEXTURE_2D,Ge,K,le[0].width,le[0].height);for(let ie=0,Ae=le.length;ie<Ae;ie++)q=le[ie],T.format!==On?oe!==null?se?Ee&&t.compressedTexSubImage2D(i.TEXTURE_2D,ie,0,0,q.width,q.height,oe,q.data):t.compressedTexImage2D(i.TEXTURE_2D,ie,K,q.width,q.height,0,q.data):Le("WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):se?Ee&&t.texSubImage2D(i.TEXTURE_2D,ie,0,0,q.width,q.height,oe,I,q.data):t.texImage2D(i.TEXTURE_2D,ie,K,q.width,q.height,0,oe,I,q.data)}else if(T.isDataArrayTexture)if(se){if(ae&&t.texStorage3D(i.TEXTURE_2D_ARRAY,Ge,K,J.width,J.height,J.depth),Ee)if(T.layerUpdates.size>0){let ie=jl(J.width,J.height,T.format,T.type);for(let Ae of T.layerUpdates){let Be=J.data.subarray(Ae*ie/J.data.BYTES_PER_ELEMENT,(Ae+1)*ie/J.data.BYTES_PER_ELEMENT);t.texSubImage3D(i.TEXTURE_2D_ARRAY,0,0,0,Ae,J.width,J.height,1,oe,I,Be)}T.clearLayerUpdates()}else t.texSubImage3D(i.TEXTURE_2D_ARRAY,0,0,0,0,J.width,J.height,J.depth,oe,I,J.data)}else t.texImage3D(i.TEXTURE_2D_ARRAY,0,K,J.width,J.height,J.depth,0,oe,I,J.data);else if(T.isData3DTexture)se?(ae&&t.texStorage3D(i.TEXTURE_3D,Ge,K,J.width,J.height,J.depth),Ee&&t.texSubImage3D(i.TEXTURE_3D,0,0,0,0,J.width,J.height,J.depth,oe,I,J.data)):t.texImage3D(i.TEXTURE_3D,0,K,J.width,J.height,J.depth,0,oe,I,J.data);else if(T.isFramebufferTexture){if(ae)if(se)t.texStorage2D(i.TEXTURE_2D,Ge,K,J.width,J.height);else{let ie=J.width,Ae=J.height;for(let Be=0;Be<Ge;Be++)t.texImage2D(i.TEXTURE_2D,Be,K,ie,Ae,0,oe,I,null),ie>>=1,Ae>>=1}}else if(T.isHTMLTexture){if("texElementImage2D"in i){let ie=i.canvas;if(ie.hasAttribute("layoutsubtree")||ie.setAttribute("layoutsubtree","true"),J.parentNode!==ie){ie.appendChild(J),f.add(T),ie.onpaint=Ae=>{let Be=Ae.changedElements;for(let fe of f)Be.includes(fe.image)&&(fe.needsUpdate=!0)},ie.requestPaint();return}if(i.texElementImage2D.length===3)i.texElementImage2D(i.TEXTURE_2D,i.RGBA8,J);else{let Be=i.RGBA,fe=i.RGBA,ot=i.UNSIGNED_BYTE;i.texElementImage2D(i.TEXTURE_2D,0,Be,fe,ot,J)}i.texParameteri(i.TEXTURE_2D,i.TEXTURE_MIN_FILTER,i.LINEAR),i.texParameteri(i.TEXTURE_2D,i.TEXTURE_WRAP_S,i.CLAMP_TO_EDGE),i.texParameteri(i.TEXTURE_2D,i.TEXTURE_WRAP_T,i.CLAMP_TO_EDGE)}}else if(le.length>0){if(se&&ae){let ie=Oe(le[0]);t.texStorage2D(i.TEXTURE_2D,Ge,K,ie.width,ie.height)}for(let ie=0,Ae=le.length;ie<Ae;ie++)q=le[ie],se?Ee&&t.texSubImage2D(i.TEXTURE_2D,ie,0,0,oe,I,q):t.texImage2D(i.TEXTURE_2D,ie,K,oe,I,q);T.generateMipmaps=!1}else if(se){if(ae){let ie=Oe(J);t.texStorage2D(i.TEXTURE_2D,Ge,K,ie.width,ie.height)}Ee&&t.texSubImage2D(i.TEXTURE_2D,0,0,0,oe,I,J)}else t.texImage2D(i.TEXTURE_2D,0,K,oe,I,J);v(T)&&T.mipmapsAutoUpdate===!0&&M(ne),he.__version=re.version,T.onUpdate&&T.onUpdate(T)}A.__version=T.version}function rn(A,T,k){if(T.image.length!==6)return;let ne=ct(A,T),j=T.source;t.bindTexture(i.TEXTURE_CUBE_MAP,A.__webglTexture,i.TEXTURE0+k);let re=n.get(j);if(j.version!==re.__version||ne===!0){t.activeTexture(i.TEXTURE0+k);let he=Ze.getPrimaries(Ze.workingColorSpace),Y=T.colorSpace===ci?null:Ze.getPrimaries(T.colorSpace),J=T.colorSpace===ci||he===Y?i.NONE:i.BROWSER_DEFAULT_WEBGL;t.pixelStorei(i.UNPACK_FLIP_Y_WEBGL,T.flipY),t.pixelStorei(i.UNPACK_PREMULTIPLY_ALPHA_WEBGL,T.premultiplyAlpha),t.pixelStorei(i.UNPACK_ALIGNMENT,T.unpackAlignment),t.pixelStorei(i.UNPACK_COLORSPACE_CONVERSION_WEBGL,J);let oe=T.isCompressedTexture||T.image[0].isCompressedTexture,I=T.image[0]&&T.image[0].isDataTexture,K=[];for(let fe=0;fe<6;fe++)!oe&&!I?K[fe]=y(T.image[fe],!0,s.maxCubemapSize):K[fe]=I?T.image[fe].image:T.image[fe],K[fe]=Pe(T,K[fe]);let q=K[0],le=r.convert(T.format,T.colorSpace),se=r.convert(T.type),ae=w(T.internalFormat,le,se,T.normalized,T.colorSpace),Ee=T.isVideoTexture!==!0,Ge=re.__version===void 0||ne===!0,ie=j.dataReady,Ae=S(T,q);at(i.TEXTURE_CUBE_MAP,T);let Be;if(T.isDepthTexture){if(ae=x(T.format===li,T.type),Ge)if(Ee)t.texStorage2D(i.TEXTURE_CUBE_MAP,1,ae,q.width,q.height);else for(let fe=0;fe<6;fe++)t.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+fe,0,ae,q.width,q.height,0,le,se,null)}else if(oe){Ee&&Ge&&t.texStorage2D(i.TEXTURE_CUBE_MAP,Ae,ae,q.width,q.height);for(let fe=0;fe<6;fe++){Be=K[fe].mipmaps;for(let ot=0;ot<Be.length;ot++){let Lt=Be[ot];T.format!==On?le!==null?Ee?ie&&t.compressedTexSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+fe,ot,0,0,Lt.width,Lt.height,le,Lt.data):t.compressedTexImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+fe,ot,ae,Lt.width,Lt.height,0,Lt.data):Le("WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()"):Ee?ie&&t.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+fe,ot,0,0,Lt.width,Lt.height,le,se,Lt.data):t.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+fe,ot,ae,Lt.width,Lt.height,0,le,se,Lt.data)}}}else{if(Be=T.mipmaps,Ee&&Ge){Be.length>0&&Ae++;let fe=Oe(K[0]);t.texStorage2D(i.TEXTURE_CUBE_MAP,Ae,ae,fe.width,fe.height)}for(let fe=0;fe<6;fe++)if(I){Ee?ie&&t.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+fe,0,0,0,K[fe].width,K[fe].height,le,se,K[fe].data):t.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+fe,0,ae,K[fe].width,K[fe].height,0,le,se,K[fe].data);for(let ot=0;ot<Be.length;ot++){let fi=Be[ot].image[fe].image;Ee?ie&&t.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+fe,ot+1,0,0,fi.width,fi.height,le,se,fi.data):t.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+fe,ot+1,ae,fi.width,fi.height,0,le,se,fi.data)}}else{Ee?ie&&t.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+fe,0,0,0,le,se,K[fe]):t.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+fe,0,ae,le,se,K[fe]);for(let ot=0;ot<Be.length;ot++){let Lt=Be[ot];Ee?ie&&t.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+fe,ot+1,0,0,le,se,Lt.image[fe]):t.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+fe,ot+1,ae,le,se,Lt.image[fe])}}}v(T)&&T.mipmapsAutoUpdate===!0&&M(i.TEXTURE_CUBE_MAP),re.__version=j.version,T.onUpdate&&T.onUpdate(T)}A.__version=T.version}function vt(A,T,k,ne,j,re){let he=r.convert(k.format,k.colorSpace),Y=r.convert(k.type),J=w(k.internalFormat,he,Y,k.normalized,k.colorSpace),oe=n.get(T),I=n.get(k);if(I.__renderTarget=T,!oe.__hasExternalTextures){let K=Math.max(1,T.width>>re),q=Math.max(1,T.height>>re);j===i.TEXTURE_3D||j===i.TEXTURE_2D_ARRAY?t.texImage3D(j,re,J,K,q,T.depth,0,he,Y,null):t.texImage2D(j,re,J,K,q,0,he,Y,null)}t.bindFramebuffer(i.FRAMEBUFFER,A),de(T)?o.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,ne,j,I.__webglTexture,0,gt(T)):(j===i.TEXTURE_2D||j>=i.TEXTURE_CUBE_MAP_POSITIVE_X&&j<=i.TEXTURE_CUBE_MAP_NEGATIVE_Z)&&i.framebufferTexture2D(i.FRAMEBUFFER,ne,j,I.__webglTexture,re),t.bindFramebuffer(i.FRAMEBUFFER,null)}function Bn(A,T,k){if(i.bindRenderbuffer(i.RENDERBUFFER,A),T.depthBuffer){let ne=T.depthTexture,j=ne&&ne.isDepthTexture?ne.type:null,re=x(T.stencilBuffer,j),he=T.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT;de(T)?o.renderbufferStorageMultisampleEXT(i.RENDERBUFFER,gt(T),re,T.width,T.height):k?i.renderbufferStorageMultisample(i.RENDERBUFFER,gt(T),re,T.width,T.height):i.renderbufferStorage(i.RENDERBUFFER,re,T.width,T.height),i.framebufferRenderbuffer(i.FRAMEBUFFER,he,i.RENDERBUFFER,A)}else{let ne=T.textures;for(let j=0;j<ne.length;j++){let re=ne[j],he=r.convert(re.format,re.colorSpace),Y=r.convert(re.type),J=w(re.internalFormat,he,Y,re.normalized,re.colorSpace);de(T)?o.renderbufferStorageMultisampleEXT(i.RENDERBUFFER,gt(T),J,T.width,T.height):k?i.renderbufferStorageMultisample(i.RENDERBUFFER,gt(T),J,T.width,T.height):i.renderbufferStorage(i.RENDERBUFFER,J,T.width,T.height)}}i.bindRenderbuffer(i.RENDERBUFFER,null)}function It(A,T,k){let ne=T.isWebGLCubeRenderTarget===!0;if(t.bindFramebuffer(i.FRAMEBUFFER,A),!(T.depthTexture&&T.depthTexture.isDepthTexture))throw new Error("THREE.WebGLTextures: renderTarget.depthTexture must be an instance of THREE.DepthTexture.");let j=n.get(T.depthTexture);j.__renderTarget=T;let re=ne?T.depthTexture.image[0]:T.depthTexture.image;(!j.__webglTexture||re.width!==T.width||re.height!==T.height)&&(re.width=T.width,re.height=T.height,T.depthTexture.needsUpdate=!0),ne?ge(T.depthTexture,0):me(T.depthTexture,0);let he=j.__webglTexture,Y=gt(T),J=ne?i.TEXTURE_CUBE_MAP_POSITIVE_X+k:i.TEXTURE_2D,oe=T.depthTexture.format===li?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT;if(T.depthTexture.format===ri)de(T)?o.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,oe,J,he,0,Y):i.framebufferTexture2D(i.FRAMEBUFFER,oe,J,he,0);else if(T.depthTexture.format===li)de(T)?o.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,oe,J,he,0,Y):i.framebufferTexture2D(i.FRAMEBUFFER,oe,J,he,0);else throw new Error("THREE.WebGLTextures: Unknown depthTexture format.")}function mn(A){let T=n.get(A),k=A.isWebGLCubeRenderTarget===!0;if(T.__boundDepthTexture!==A.depthTexture){let ne=A.depthTexture;if(T.__depthDisposeCallback&&T.__depthDisposeCallback(),ne){let j=()=>{delete T.__boundDepthTexture,delete T.__depthDisposeCallback,ne.removeEventListener("dispose",j)};ne.addEventListener("dispose",j),T.__depthDisposeCallback=j}T.__boundDepthTexture=ne}if(A.depthTexture&&!T.__autoAllocateDepthBuffer)if(k)for(let ne=0;ne<6;ne++)It(T.__webglFramebuffer[ne],A,ne);else A.texture.mipmaps.length>0?It(T.__webglFramebuffer[0],A,0):It(T.__webglFramebuffer,A,0);else if(k){T.__webglDepthbuffer=[];for(let ne=0;ne<6;ne++)if(t.bindFramebuffer(i.FRAMEBUFFER,T.__webglFramebuffer[ne]),T.__webglDepthbuffer[ne]===void 0)T.__webglDepthbuffer[ne]=i.createRenderbuffer(),Bn(T.__webglDepthbuffer[ne],A,!1);else{let j=A.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,re=T.__webglDepthbuffer[ne];i.bindRenderbuffer(i.RENDERBUFFER,re),i.framebufferRenderbuffer(i.FRAMEBUFFER,j,i.RENDERBUFFER,re)}}else if(A.texture.mipmaps.length>0?t.bindFramebuffer(i.FRAMEBUFFER,T.__webglFramebuffer[0]):t.bindFramebuffer(i.FRAMEBUFFER,T.__webglFramebuffer),T.__webglDepthbuffer===void 0)T.__webglDepthbuffer=i.createRenderbuffer(),Bn(T.__webglDepthbuffer,A,!1);else{let j=A.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,re=T.__webglDepthbuffer;i.bindRenderbuffer(i.RENDERBUFFER,re),i.framebufferRenderbuffer(i.FRAMEBUFFER,j,i.RENDERBUFFER,re)}t.bindFramebuffer(i.FRAMEBUFFER,null)}function gn(A,T,k){let ne=n.get(A);T!==void 0&&vt(ne.__webglFramebuffer,A,A.texture,i.COLOR_ATTACHMENT0,i.TEXTURE_2D,0),k!==void 0&&mn(A)}function xn(A){let T=A.texture,k=n.get(A),ne=n.get(T);A.addEventListener("dispose",D),P(A);let j=A.textures,re=A.isWebGLCubeRenderTarget===!0,he=j.length>1;if(he||(ne.__webglTexture===void 0&&(ne.__webglTexture=i.createTexture()),ne.__version=T.version,a.memory.textures++),re){k.__webglFramebuffer=[];for(let Y=0;Y<6;Y++)if(T.mipmaps.length>0){k.__webglFramebuffer[Y]=[];for(let J=0;J<T.mipmaps.length;J++)k.__webglFramebuffer[Y][J]=i.createFramebuffer()}else k.__webglFramebuffer[Y]=i.createFramebuffer()}else{if(T.mipmaps.length>0){k.__webglFramebuffer=[];for(let Y=0;Y<T.mipmaps.length;Y++)k.__webglFramebuffer[Y]=i.createFramebuffer()}else k.__webglFramebuffer=i.createFramebuffer();if(he)for(let Y=0,J=j.length;Y<J;Y++){let oe=n.get(j[Y]);oe.__webglTexture===void 0&&(oe.__webglTexture=i.createTexture(),a.memory.textures++)}if(A.samples>0&&de(A)===!1){k.__webglMultisampledFramebuffer=i.createFramebuffer(),k.__webglColorRenderbuffer=[],t.bindFramebuffer(i.FRAMEBUFFER,k.__webglMultisampledFramebuffer);for(let Y=0;Y<j.length;Y++){let J=j[Y];k.__webglColorRenderbuffer[Y]=i.createRenderbuffer(),i.bindRenderbuffer(i.RENDERBUFFER,k.__webglColorRenderbuffer[Y]);let oe=r.convert(J.format,J.colorSpace),I=r.convert(J.type),K=w(J.internalFormat,oe,I,J.normalized,J.colorSpace,A.isXRRenderTarget===!0),q=gt(A);i.renderbufferStorageMultisample(i.RENDERBUFFER,q,K,A.width,A.height),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+Y,i.RENDERBUFFER,k.__webglColorRenderbuffer[Y])}i.bindRenderbuffer(i.RENDERBUFFER,null),A.depthBuffer&&(k.__webglDepthRenderbuffer=i.createRenderbuffer(),Bn(k.__webglDepthRenderbuffer,A,!0)),t.bindFramebuffer(i.FRAMEBUFFER,null)}}if(re){t.bindTexture(i.TEXTURE_CUBE_MAP,ne.__webglTexture),at(i.TEXTURE_CUBE_MAP,T);for(let Y=0;Y<6;Y++)if(T.mipmaps.length>0)for(let J=0;J<T.mipmaps.length;J++)vt(k.__webglFramebuffer[Y][J],A,T,i.COLOR_ATTACHMENT0,i.TEXTURE_CUBE_MAP_POSITIVE_X+Y,J);else vt(k.__webglFramebuffer[Y],A,T,i.COLOR_ATTACHMENT0,i.TEXTURE_CUBE_MAP_POSITIVE_X+Y,0);v(T)?M(i.TEXTURE_CUBE_MAP):T.mipmaps.length>0&&i.texParameteri(i.TEXTURE_CUBE_MAP,i.TEXTURE_MAX_LEVEL,T.mipmaps.length-1),t.unbindTexture()}else if(he){for(let Y=0,J=j.length;Y<J;Y++){let oe=j[Y],I=n.get(oe),K=i.TEXTURE_2D;(A.isWebGL3DRenderTarget||A.isWebGLArrayRenderTarget)&&(K=A.isWebGL3DRenderTarget?i.TEXTURE_3D:i.TEXTURE_2D_ARRAY),t.bindTexture(K,I.__webglTexture),at(K,oe),vt(k.__webglFramebuffer,A,oe,i.COLOR_ATTACHMENT0+Y,K,0),v(oe)&&M(K)}t.unbindTexture()}else{let Y=i.TEXTURE_2D;if((A.isWebGL3DRenderTarget||A.isWebGLArrayRenderTarget)&&(Y=A.isWebGL3DRenderTarget?i.TEXTURE_3D:i.TEXTURE_2D_ARRAY),t.bindTexture(Y,ne.__webglTexture),at(Y,T),T.mipmaps.length>0)for(let J=0;J<T.mipmaps.length;J++)vt(k.__webglFramebuffer[J],A,T,i.COLOR_ATTACHMENT0,Y,J);else vt(k.__webglFramebuffer,A,T,i.COLOR_ATTACHMENT0,Y,0);v(T)?M(Y):T.mipmaps.length>0&&i.texParameteri(Y,i.TEXTURE_MAX_LEVEL,T.mipmaps.length-1),t.unbindTexture()}A.depthBuffer&&mn(A)}function U(A){let T=A.textures;for(let k=0,ne=T.length;k<ne;k++){let j=T[k];if(v(j)&&j.mipmapsAutoUpdate===!0){let re=b(A),he=n.get(j).__webglTexture;t.bindTexture(re,he),M(re),t.unbindTexture()}}}let vn=[];function mt(A){if(A.samples>0){if(de(A)===!1){let T=A.textures,k=A.width,ne=A.height,j=i.COLOR_BUFFER_BIT,re=A.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,he=n.get(A),Y=T.length>1;if(Y)for(let oe=0;oe<T.length;oe++)t.bindFramebuffer(i.FRAMEBUFFER,he.__webglMultisampledFramebuffer),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+oe,i.RENDERBUFFER,null),t.bindFramebuffer(i.FRAMEBUFFER,he.__webglFramebuffer),i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0+oe,i.TEXTURE_2D,null,0);t.bindFramebuffer(i.READ_FRAMEBUFFER,he.__webglMultisampledFramebuffer),A.texture.mipmaps.length>0?t.bindFramebuffer(i.DRAW_FRAMEBUFFER,he.__webglFramebuffer[0]):t.bindFramebuffer(i.DRAW_FRAMEBUFFER,he.__webglFramebuffer);for(let oe=0;oe<T.length;oe++){if(A.resolveDepthBuffer&&(A.depthBuffer&&(j|=i.DEPTH_BUFFER_BIT),A.stencilBuffer&&A.resolveStencilBuffer&&(j|=i.STENCIL_BUFFER_BIT)),Y){i.framebufferRenderbuffer(i.READ_FRAMEBUFFER,i.COLOR_ATTACHMENT0,i.RENDERBUFFER,he.__webglColorRenderbuffer[oe]);let I=n.get(T[oe]).__webglTexture;i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0,i.TEXTURE_2D,I,0)}i.blitFramebuffer(0,0,k,ne,0,0,k,ne,j,i.NEAREST),l===!0&&(vn.length=0,vn.push(i.COLOR_ATTACHMENT0+oe),A.depthBuffer&&A.storeMultisampledDepthBuffer===!1&&vn.push(re),i.invalidateFramebuffer(i.READ_FRAMEBUFFER,vn))}if(t.bindFramebuffer(i.READ_FRAMEBUFFER,null),t.bindFramebuffer(i.DRAW_FRAMEBUFFER,null),Y)for(let oe=0;oe<T.length;oe++){t.bindFramebuffer(i.FRAMEBUFFER,he.__webglMultisampledFramebuffer),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+oe,i.RENDERBUFFER,he.__webglColorRenderbuffer[oe]);let I=n.get(T[oe]).__webglTexture;t.bindFramebuffer(i.FRAMEBUFFER,he.__webglFramebuffer),i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0+oe,i.TEXTURE_2D,I,0)}t.bindFramebuffer(i.DRAW_FRAMEBUFFER,he.__webglMultisampledFramebuffer)}else if(A.depthBuffer&&A.storeMultisampledDepthBuffer===!1&&l){let T=A.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT;i.invalidateFramebuffer(i.DRAW_FRAMEBUFFER,[T])}}}function gt(A){return Math.min(s.maxSamples,A.samples)}function de(A){let T=n.get(A);return A.samples>0&&e.has("WEBGL_multisampled_render_to_texture")===!0&&T.__useRenderToTexture!==!1}function Rt(A){let T=a.render.frame;h.get(A)!==T&&(h.set(A,T),A.update())}function Pe(A,T){let k=A.colorSpace,ne=A.format,j=A.type;return A.isCompressedTexture===!0||A.isVideoTexture===!0||k!==Ws&&k!==ci&&(Ze.getTransfer(k)===nt?(ne!==On||j!==fn)&&Le("WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType."):De("WebGLTextures: Unsupported texture color space:",k)),T}function Oe(A){return typeof HTMLImageElement<"u"&&A instanceof HTMLImageElement?(c.width=A.naturalWidth||A.width,c.height=A.naturalHeight||A.height):typeof VideoFrame<"u"&&A instanceof VideoFrame?(c.width=A.displayWidth,c.height=A.displayHeight):(c.width=A.width,c.height=A.height),c}this.allocateTextureUnit=Ne,this.resetTextureUnits=ee,this.getTextureUnits=Q,this.setTextureUnits=_e,this.setTexture2D=me,this.setTexture2DArray=Me,this.setTexture3D=Ce,this.setTextureCube=ge,this.rebindTextures=gn,this.setupRenderTarget=xn,this.updateRenderTargetMipmap=U,this.updateMultisampleRenderTarget=mt,this.setupDepthRenderbuffer=mn,this.setupFrameBufferTexture=vt,this.useMultisampledRTT=de,this.dispose=V}function gx(i,e){function t(n,s=ci){let r,a=Ze.getTransfer(s);if(n===fn)return i.UNSIGNED_BYTE;if(n===Fa)return i.UNSIGNED_SHORT_4_4_4_4;if(n===Oa)return i.UNSIGNED_SHORT_5_5_5_1;if(n===Fl)return i.UNSIGNED_INT_5_9_9_9_REV;if(n===Ol)return i.UNSIGNED_INT_10F_11F_11F_REV;if(n===Nl)return i.BYTE;if(n===Ul)return i.SHORT;if(n===Ts)return i.UNSIGNED_SHORT;if(n===Ua)return i.INT;if(n===Nn)return i.UNSIGNED_INT;if(n===Un)return i.FLOAT;if(n===Fn)return i.HALF_FLOAT;if(n===kl)return i.ALPHA;if(n===zl)return i.RGB;if(n===On)return i.RGBA;if(n===ri)return i.DEPTH_COMPONENT;if(n===li)return i.DEPTH_STENCIL;if(n===Bl)return i.RED;if(n===ka)return i.RED_INTEGER;if(n===Ei)return i.RG;if(n===za)return i.RG_INTEGER;if(n===Ba)return i.RGBA_INTEGER;if(n===or||n===lr||n===cr||n===hr)if(a===nt)if(r=e.get("WEBGL_compressed_texture_s3tc_srgb"),r!==null){if(n===or)return r.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(n===lr)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(n===cr)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(n===hr)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null;else if(r=e.get("WEBGL_compressed_texture_s3tc"),r!==null){if(n===or)return r.COMPRESSED_RGB_S3TC_DXT1_EXT;if(n===lr)return r.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(n===cr)return r.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(n===hr)return r.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null;if(n===Ga||n===Va||n===Ha||n===Wa)if(r=e.get("WEBGL_compressed_texture_pvrtc"),r!==null){if(n===Ga)return r.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(n===Va)return r.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(n===Ha)return r.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(n===Wa)return r.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null;if(n===Xa||n===qa||n===$a||n===Ya||n===Za||n===ur||n===Ja)if(r=e.get("WEBGL_compressed_texture_etc"),r!==null){if(n===Xa||n===qa)return a===nt?r.COMPRESSED_SRGB8_ETC2:r.COMPRESSED_RGB8_ETC2;if(n===$a)return a===nt?r.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:r.COMPRESSED_RGBA8_ETC2_EAC;if(n===Ya)return r.COMPRESSED_R11_EAC;if(n===Za)return r.COMPRESSED_SIGNED_R11_EAC;if(n===ur)return r.COMPRESSED_RG11_EAC;if(n===Ja)return r.COMPRESSED_SIGNED_RG11_EAC}else return null;if(n===Ka||n===ja||n===Qa||n===eo||n===to||n===no||n===io||n===so||n===ro||n===ao||n===oo||n===lo||n===co||n===ho)if(r=e.get("WEBGL_compressed_texture_astc"),r!==null){if(n===Ka)return a===nt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:r.COMPRESSED_RGBA_ASTC_4x4_KHR;if(n===ja)return a===nt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:r.COMPRESSED_RGBA_ASTC_5x4_KHR;if(n===Qa)return a===nt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:r.COMPRESSED_RGBA_ASTC_5x5_KHR;if(n===eo)return a===nt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:r.COMPRESSED_RGBA_ASTC_6x5_KHR;if(n===to)return a===nt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:r.COMPRESSED_RGBA_ASTC_6x6_KHR;if(n===no)return a===nt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:r.COMPRESSED_RGBA_ASTC_8x5_KHR;if(n===io)return a===nt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:r.COMPRESSED_RGBA_ASTC_8x6_KHR;if(n===so)return a===nt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:r.COMPRESSED_RGBA_ASTC_8x8_KHR;if(n===ro)return a===nt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:r.COMPRESSED_RGBA_ASTC_10x5_KHR;if(n===ao)return a===nt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:r.COMPRESSED_RGBA_ASTC_10x6_KHR;if(n===oo)return a===nt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:r.COMPRESSED_RGBA_ASTC_10x8_KHR;if(n===lo)return a===nt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:r.COMPRESSED_RGBA_ASTC_10x10_KHR;if(n===co)return a===nt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:r.COMPRESSED_RGBA_ASTC_12x10_KHR;if(n===ho)return a===nt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:r.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null;if(n===uo||n===fo||n===po)if(r=e.get("EXT_texture_compression_bptc"),r!==null){if(n===uo)return a===nt?r.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:r.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(n===fo)return r.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(n===po)return r.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}else return null;if(n===mo||n===go||n===dr||n===xo)if(r=e.get("EXT_texture_compression_rgtc"),r!==null){if(n===mo)return r.COMPRESSED_RED_RGTC1_EXT;if(n===go)return r.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(n===dr)return r.COMPRESSED_RED_GREEN_RGTC2_EXT;if(n===xo)return r.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null;return n===$i?i.UNSIGNED_INT_24_8:i[n]!==void 0?i[n]:null}return{convert:t}}var xx=`
void main() {

	gl_Position = vec4( position, 1.0 );

}`,vx=`
uniform sampler2DArray depthColor;
uniform float depthWidth;
uniform float depthHeight;

void main() {

	vec2 coord = vec2( gl_FragCoord.x / depthWidth, gl_FragCoord.y / depthHeight );

	if ( coord.x >= 1.0 ) {

		gl_FragDepth = texture( depthColor, vec3( coord.x - 1.0, coord.y, 1 ) ).r;

	} else {

		gl_FragDepth = texture( depthColor, vec3( coord.x, coord.y, 0 ) ).r;

	}

}`,oc=class{constructor(){this.texture=null,this.mesh=null,this.depthNear=0,this.depthFar=0}init(e,t){if(this.texture===null){let n=new tr(e.texture);(e.depthNear!==t.depthNear||e.depthFar!==t.depthFar)&&(this.depthNear=e.depthNear,this.depthFar=e.depthFar),this.texture=n}}getMesh(e){if(this.texture!==null&&this.mesh===null){let t=e.cameras[0].viewport,n=new Ot({vertexShader:xx,fragmentShader:vx,uniforms:{depthColor:{value:this.texture},depthWidth:{value:t.z},depthHeight:{value:t.w}}});this.mesh=new Ft(new Hi(20,20),n)}return this.mesh}reset(){this.texture=null,this.mesh=null}getDepthTexture(){return this.texture}},lc=class extends Hn{constructor(e,t){super();let n=this,s=null,r=1,a=null,o="local-floor",l=1,c=null,h=null,f=null,u=null,p=null,d=null,_=typeof XRWebGLBinding<"u",m=new oc,g={},y=t.getContextAttributes(),v=null,M=null,b=[],w=[],x=new Xe,S=null,P=null,R=new Vt;R.viewport=new lt;let C=new Vt;C.viewport=new lt;let D=[R,C],F=new Ia,L=null,V=null;this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function(Z){let me=b[Z];return me===void 0&&(me=new gs,b[Z]=me),me.getTargetRaySpace()},this.getControllerGrip=function(Z){let me=b[Z];return me===void 0&&(me=new gs,b[Z]=me),me.getGripSpace()},this.getHand=function(Z){let me=b[Z];return me===void 0&&(me=new gs,b[Z]=me),me.getHandSpace()};function $(Z){let me=w.indexOf(Z.inputSource);if(me===-1)return;let Me=b[me];Me!==void 0&&(Me.update(Z.inputSource,Z.frame,c||a),Me.dispatchEvent({type:Z.type,data:Z.inputSource}))}function H(){s.removeEventListener("select",$),s.removeEventListener("selectstart",$),s.removeEventListener("selectend",$),s.removeEventListener("squeeze",$),s.removeEventListener("squeezestart",$),s.removeEventListener("squeezeend",$),s.removeEventListener("end",H),s.removeEventListener("inputsourceschange",te);for(let Z=0;Z<b.length;Z++){let me=w[Z];me!==null&&(w[Z]=null,b[Z].disconnect(me))}L=null,V=null,m.reset();for(let Z in g)delete g[Z];if(e.setRenderTarget(v),p=null,u=null,f=null,s=null,M=null,Ne.stop(),n.isPresenting=!1,e.setPixelRatio(S),e.setSize(x.width,x.height,!1),P!==null){let Z=P.camera;Z.fov=P.fov,Z.zoom=P.zoom,Z.updateProjectionMatrix(),P=null}n.dispatchEvent({type:"sessionend"})}this.setFramebufferScaleFactor=function(Z){r=Z,n.isPresenting===!0&&Le("WebXRManager: Cannot change framebuffer scale while presenting.")},this.setReferenceSpaceType=function(Z){o=Z,n.isPresenting===!0&&Le("WebXRManager: Cannot change reference space type while presenting.")},this.getReferenceSpace=function(){return c||a},this.setReferenceSpace=function(Z){c=Z},this.getBaseLayer=function(){return u!==null?u:p},this.getBinding=function(){return f===null&&_&&(f=new XRWebGLBinding(s,t)),f},this.getFrame=function(){return d},this.getSession=function(){return s},this.setSession=async function(Z){if(s=Z,s!==null){if(v=e.getRenderTarget(),s.addEventListener("select",$),s.addEventListener("selectstart",$),s.addEventListener("selectend",$),s.addEventListener("squeeze",$),s.addEventListener("squeezestart",$),s.addEventListener("squeezeend",$),s.addEventListener("end",H),s.addEventListener("inputsourceschange",te),y.xrCompatible!==!0&&await t.makeXRCompatible(),S=e.getPixelRatio(),e.getSize(x),_&&"createProjectionLayer"in XRWebGLBinding.prototype){let Me=null,Ce=null,ge=null;y.depth&&(ge=y.stencil?t.DEPTH24_STENCIL8:t.DEPTH_COMPONENT24,Me=y.stencil?li:ri,Ce=y.stencil?$i:Nn);let ze={colorFormat:t.RGBA8,depthFormat:ge,scaleFactor:r};f=this.getBinding(),u=f.createProjectionLayer(ze),s.updateRenderState({layers:[u]}),e.setPixelRatio(1),e.setSize(u.textureWidth,u.textureHeight,!1),M=new nn(u.textureWidth,u.textureHeight,{format:On,type:fn,depthTexture:new oi(u.textureWidth,u.textureHeight,Ce,void 0,void 0,void 0,void 0,void 0,void 0,Me),stencilBuffer:y.stencil,colorSpace:e.outputColorSpace,samples:y.antialias?4:0,resolveDepthBuffer:u.ignoreDepthValues===!1,resolveStencilBuffer:u.ignoreDepthValues===!1,storeMultisampledDepthBuffer:u.ignoreDepthValues===!1,storeMultisampledStencilBuffer:u.ignoreDepthValues===!1})}else{let Me={antialias:y.antialias,alpha:!0,depth:y.depth,stencil:y.stencil,framebufferScaleFactor:r};p=new XRWebGLLayer(s,t,Me),s.updateRenderState({baseLayer:p}),e.setPixelRatio(1),e.setSize(p.framebufferWidth,p.framebufferHeight,!1),M=new nn(p.framebufferWidth,p.framebufferHeight,{format:On,type:fn,colorSpace:e.outputColorSpace,stencilBuffer:y.stencil,resolveDepthBuffer:p.ignoreDepthValues===!1,resolveStencilBuffer:p.ignoreDepthValues===!1,storeMultisampledDepthBuffer:p.ignoreDepthValues===!1,storeMultisampledStencilBuffer:p.ignoreDepthValues===!1})}M.isXRRenderTarget=!0,this.setFoveation(l),c=null,a=await s.requestReferenceSpace(o),Ne.setContext(s),Ne.start(),n.isPresenting=!0,n.dispatchEvent({type:"sessionstart"})}},this.getEnvironmentBlendMode=function(){if(s!==null)return s.environmentBlendMode},this.getDepthTexture=function(){return m.getDepthTexture()};function te(Z){for(let me=0;me<Z.removed.length;me++){let Me=Z.removed[me],Ce=w.indexOf(Me);Ce>=0&&(w[Ce]=null,b[Ce].disconnect(Me))}for(let me=0;me<Z.added.length;me++){let Me=Z.added[me],Ce=w.indexOf(Me);if(Ce===-1){for(let ze=0;ze<b.length;ze++)if(ze>=w.length){w.push(Me),Ce=ze;break}else if(w[ze]===null){w[ze]=Me,Ce=ze;break}if(Ce===-1)break}let ge=b[Ce];ge&&ge.connect(Me)}}function X(Z,me){me===null?Z.matrixWorld.copy(Z.matrix):Z.matrixWorld.multiplyMatrices(me.matrixWorld,Z.matrix),Z.matrixWorldInverse.copy(Z.matrixWorld).invert()}this.updateCamera=function(Z){if(s===null)return;let me=Z.near,Me=Z.far;m.texture!==null&&(m.depthNear>0&&(me=m.depthNear),m.depthFar>0&&(Me=m.depthFar)),F.near=C.near=R.near=me,F.far=C.far=R.far=Me,(L!==F.near||V!==F.far)&&(s.updateRenderState({depthNear:F.near,depthFar:F.far}),L=F.near,V=F.far),F.layers.mask=Z.layers.mask|6,R.layers.mask=F.layers.mask&-5,C.layers.mask=F.layers.mask&-3;let Ce=Z.parent,ge=F.cameras;X(F,Ce);for(let ze=0;ze<ge.length;ze++)X(ge[ze],Ce);F.projectionMatrix.copy(R.projectionMatrix),F.projectionMatrixInverse.copy(R.projectionMatrixInverse),P===null&&Z.isPerspectiveCamera&&(P={camera:Z,fov:Z.fov,zoom:Z.zoom}),ee(Z,F,Ce)};function ee(Z,me,Me){Me===null?Z.matrix.copy(me.matrixWorld):(Z.matrix.copy(Me.matrixWorld),Z.matrix.invert(),Z.matrix.multiply(me.matrixWorld)),Z.matrix.decompose(Z.position,Z.quaternion,Z.scale),Z.updateMatrixWorld(!0),Z.projectionMatrix.copy(me.projectionMatrix),Z.projectionMatrixInverse.copy(me.projectionMatrixInverse),Z.isPerspectiveCamera&&(Z.fov=ha*2*Math.atan(1/Z.projectionMatrix.elements[5]),Z.zoom=1)}this.getCamera=function(){return F},this.getFoveation=function(){if(!(u===null&&p===null))return l},this.setFoveation=function(Z){l=Z,u!==null&&(u.fixedFoveation=Z),p!==null&&p.fixedFoveation!==void 0&&(p.fixedFoveation=Z)},this.hasDepthSensing=function(){return m.texture!==null},this.getDepthSensingMesh=function(){return m.getMesh(F)},this.getCameraTexture=function(Z){return g[Z]};let Q=null;function _e(Z,me){if(h=me.getViewerPose(c||a),d=me,h!==null){let Me=h.views;p!==null&&(e.setRenderTargetFramebuffer(M,p.framebuffer),e.setRenderTarget(M));let Ce=!1;Me.length!==F.cameras.length&&(F.cameras.length=0,Ce=!0);for(let Ie=0;Ie<Me.length;Ie++){let at=Me[Ie],ct=null;if(p!==null)ct=p.getViewport(at);else{let Bt=f.getViewSubImage(u,at);ct=Bt.viewport,Ie===0&&(e.setRenderTargetTextures(M,Bt.colorTexture,Bt.depthStencilTexture),e.setRenderTarget(M))}let qe=D[Ie];qe===void 0&&(qe=new Vt,qe.layers.enable(Ie),qe.viewport=new lt,D[Ie]=qe),qe.matrix.fromArray(at.transform.matrix),qe.matrix.decompose(qe.position,qe.quaternion,qe.scale),qe.projectionMatrix.fromArray(at.projectionMatrix),qe.projectionMatrixInverse.copy(qe.projectionMatrix).invert(),qe.viewport.set(ct.x,ct.y,ct.width,ct.height),Ie===0&&(F.matrix.copy(qe.matrix),F.matrix.decompose(F.position,F.quaternion,F.scale)),Ce===!0&&F.cameras.push(qe)}let ge=s.enabledFeatures;if(ge&&ge.includes("depth-sensing")&&s.depthUsage=="gpu-optimized"&&_){f=n.getBinding();let Ie=f.getDepthInformation(Me[0]);Ie&&Ie.isValid&&Ie.texture&&m.init(Ie,s.renderState)}if(ge&&ge.includes("camera-access")&&_){e.state.unbindTexture(),f=n.getBinding();for(let Ie=0;Ie<Me.length;Ie++){let at=Me[Ie].camera;if(at){let ct=g[at];ct||(ct=new tr,g[at]=ct);let qe=f.getCameraImage(at);ct.sourceTexture=qe}}}}for(let Me=0;Me<b.length;Me++){let Ce=w[Me],ge=b[Me];Ce!==null&&ge!==void 0&&ge.update(Ce,me,c||a)}Q&&Q(Z,me),me.detectedPlanes&&n.dispatchEvent({type:"planesdetected",data:me}),d=null}let Ne=new bu;Ne.setAnimationLoop(_e),this.setAnimationLoop=function(Z){Q=Z},this.dispose=function(){}}},_x=new xt,Lu=new Ue;Lu.set(-1,0,0,0,1,0,0,0,1);function yx(i,e){function t(m,g){m.matrixAutoUpdate===!0&&m.updateMatrix(),g.value.copy(m.matrix)}function n(m,g){g.color.getRGB(m.fogColor.value,Zl(i)),g.isFog?(m.fogNear.value=g.near,m.fogFar.value=g.far):g.isFogExp2&&(m.fogDensity.value=g.density)}function s(m,g,y,v,M){g.isNodeMaterial?g.uniformsNeedUpdate=!1:g.isMeshBasicMaterial?r(m,g):g.isMeshLambertMaterial?(r(m,g),g.envMap&&(m.envMapIntensity.value=g.envMapIntensity)):g.isMeshToonMaterial?(r(m,g),f(m,g)):g.isMeshPhongMaterial?(r(m,g),h(m,g),g.envMap&&(m.envMapIntensity.value=g.envMapIntensity)):g.isMeshStandardMaterial?(r(m,g),u(m,g),g.isMeshPhysicalMaterial&&p(m,g,M)):g.isMeshMatcapMaterial?(r(m,g),d(m,g)):g.isMeshDepthMaterial?r(m,g):g.isMeshDistanceMaterial?(r(m,g),_(m,g)):g.isMeshNormalMaterial?r(m,g):g.isLineBasicMaterial?(a(m,g),g.isLineDashedMaterial&&o(m,g)):g.isPointsMaterial?l(m,g,y,v):g.isSpriteMaterial?c(m,g):g.isShadowMaterial?(m.color.value.copy(g.color),m.opacity.value=g.opacity):g.isShaderMaterial&&(g.uniformsNeedUpdate=!1)}function r(m,g){m.opacity.value=g.opacity,g.color&&m.diffuse.value.copy(g.color),g.emissive&&m.emissive.value.copy(g.emissive).multiplyScalar(g.emissiveIntensity),g.map&&(m.map.value=g.map,t(g.map,m.mapTransform)),g.alphaMap&&(m.alphaMap.value=g.alphaMap,t(g.alphaMap,m.alphaMapTransform)),g.bumpMap&&(m.bumpMap.value=g.bumpMap,t(g.bumpMap,m.bumpMapTransform),m.bumpScale.value=g.bumpScale,g.side===sn&&(m.bumpScale.value*=-1)),g.normalMap&&(m.normalMap.value=g.normalMap,t(g.normalMap,m.normalMapTransform),m.normalScale.value.copy(g.normalScale),g.side===sn&&m.normalScale.value.negate()),g.displacementMap&&(m.displacementMap.value=g.displacementMap,t(g.displacementMap,m.displacementMapTransform),m.displacementScale.value=g.displacementScale,m.displacementBias.value=g.displacementBias),g.emissiveMap&&(m.emissiveMap.value=g.emissiveMap,t(g.emissiveMap,m.emissiveMapTransform)),g.specularMap&&(m.specularMap.value=g.specularMap,t(g.specularMap,m.specularMapTransform)),g.alphaTest>0&&(m.alphaTest.value=g.alphaTest);let y=e.get(g),v=y.envMap,M=y.envMapRotation;v&&(m.envMap.value=v,m.envMapRotation.value.setFromMatrix4(_x.makeRotationFromEuler(M)).transpose(),v.isCubeTexture&&v.isRenderTargetTexture===!1&&m.envMapRotation.value.premultiply(Lu),m.reflectivity.value=g.reflectivity,m.ior.value=g.ior,m.refractionRatio.value=g.refractionRatio),g.lightMap&&(m.lightMap.value=g.lightMap,m.lightMapIntensity.value=g.lightMapIntensity,t(g.lightMap,m.lightMapTransform)),g.aoMap&&(m.aoMap.value=g.aoMap,m.aoMapIntensity.value=g.aoMapIntensity,t(g.aoMap,m.aoMapTransform))}function a(m,g){m.diffuse.value.copy(g.color),m.opacity.value=g.opacity,g.map&&(m.map.value=g.map,t(g.map,m.mapTransform))}function o(m,g){m.dashSize.value=g.dashSize,m.totalSize.value=g.dashSize+g.gapSize,m.scale.value=g.scale}function l(m,g,y,v){m.diffuse.value.copy(g.color),m.opacity.value=g.opacity,m.size.value=g.size*y,m.scale.value=v*.5,g.map&&(m.map.value=g.map,t(g.map,m.uvTransform)),g.alphaMap&&(m.alphaMap.value=g.alphaMap,t(g.alphaMap,m.alphaMapTransform)),g.alphaTest>0&&(m.alphaTest.value=g.alphaTest)}function c(m,g){m.diffuse.value.copy(g.color),m.opacity.value=g.opacity,m.rotation.value=g.rotation,g.map&&(m.map.value=g.map,t(g.map,m.mapTransform)),g.alphaMap&&(m.alphaMap.value=g.alphaMap,t(g.alphaMap,m.alphaMapTransform)),g.alphaTest>0&&(m.alphaTest.value=g.alphaTest)}function h(m,g){m.specular.value.copy(g.specular),m.shininess.value=Math.max(g.shininess,1e-4)}function f(m,g){g.gradientMap&&(m.gradientMap.value=g.gradientMap)}function u(m,g){m.metalness.value=g.metalness,g.metalnessMap&&(m.metalnessMap.value=g.metalnessMap,t(g.metalnessMap,m.metalnessMapTransform)),m.roughness.value=g.roughness,g.roughnessMap&&(m.roughnessMap.value=g.roughnessMap,t(g.roughnessMap,m.roughnessMapTransform)),g.envMap&&(m.envMapIntensity.value=g.envMapIntensity)}function p(m,g,y){m.ior.value=g.ior,g.diffuseRoughness>0&&(m.diffuseRoughness.value=g.diffuseRoughness,g.diffuseRoughnessMap&&(m.diffuseRoughnessMap.value=g.diffuseRoughnessMap,t(g.diffuseRoughnessMap,m.diffuseRoughnessMapTransform))),g.sheen>0&&(m.sheenColor.value.copy(g.sheenColor).multiplyScalar(g.sheen),m.sheenRoughness.value=g.sheenRoughness,g.sheenColorMap&&(m.sheenColorMap.value=g.sheenColorMap,t(g.sheenColorMap,m.sheenColorMapTransform)),g.sheenRoughnessMap&&(m.sheenRoughnessMap.value=g.sheenRoughnessMap,t(g.sheenRoughnessMap,m.sheenRoughnessMapTransform))),g.clearcoat>0&&(m.clearcoat.value=g.clearcoat,m.clearcoatRoughness.value=g.clearcoatRoughness,g.clearcoatMap&&(m.clearcoatMap.value=g.clearcoatMap,t(g.clearcoatMap,m.clearcoatMapTransform)),g.clearcoatRoughnessMap&&(m.clearcoatRoughnessMap.value=g.clearcoatRoughnessMap,t(g.clearcoatRoughnessMap,m.clearcoatRoughnessMapTransform)),g.clearcoatNormalMap&&(m.clearcoatNormalMap.value=g.clearcoatNormalMap,t(g.clearcoatNormalMap,m.clearcoatNormalMapTransform),m.clearcoatNormalScale.value.copy(g.clearcoatNormalScale),g.side===sn&&m.clearcoatNormalScale.value.negate())),g.dispersion>0&&(m.dispersion.value=g.dispersion),g.retroreflectivity>0&&(m.retroreflectivity.value=g.retroreflectivity),g.iridescence>0&&(m.iridescence.value=g.iridescence,m.iridescenceIOR.value=g.iridescenceIOR,m.iridescenceThicknessMinimum.value=g.iridescenceThicknessMinimum,m.iridescenceThicknessMaximum.value=g.iridescenceThicknessMaximum,g.iridescenceMap&&(m.iridescenceMap.value=g.iridescenceMap,t(g.iridescenceMap,m.iridescenceMapTransform)),g.iridescenceThicknessMap&&(m.iridescenceThicknessMap.value=g.iridescenceThicknessMap,t(g.iridescenceThicknessMap,m.iridescenceThicknessMapTransform))),g.transmission>0&&(m.transmission.value=g.transmission,m.transmissionSamplerMap.value=y.texture,m.transmissionSamplerSize.value.set(y.width,y.height),g.transmissionMap&&(m.transmissionMap.value=g.transmissionMap,t(g.transmissionMap,m.transmissionMapTransform)),m.thickness.value=g.thickness,g.thicknessMap&&(m.thicknessMap.value=g.thicknessMap,t(g.thicknessMap,m.thicknessMapTransform)),m.attenuationDistance.value=g.attenuationDistance,m.attenuationColor.value.copy(g.attenuationColor)),g.anisotropy>0&&(m.anisotropyVector.value.set(g.anisotropy*Math.cos(g.anisotropyRotation),g.anisotropy*Math.sin(g.anisotropyRotation)),g.anisotropyMap&&(m.anisotropyMap.value=g.anisotropyMap,t(g.anisotropyMap,m.anisotropyMapTransform))),m.specularIntensity.value=g.specularIntensity,m.specularColor.value.copy(g.specularColor),g.specularColorMap&&(m.specularColorMap.value=g.specularColorMap,t(g.specularColorMap,m.specularColorMapTransform)),g.specularIntensityMap&&(m.specularIntensityMap.value=g.specularIntensityMap,t(g.specularIntensityMap,m.specularIntensityMapTransform))}function d(m,g){g.matcap&&(m.matcap.value=g.matcap)}function _(m,g){let y=e.get(g).light;m.referencePosition.value.setFromMatrixPosition(y.matrixWorld),m.nearDistance.value=y.shadow.camera.near,m.farDistance.value=y.shadow.camera.far}return{refreshFogUniforms:n,refreshMaterialUniforms:s}}function Mx(i,e,t,n){let s={},r={};function a(y,v){let M=v.program;n.uniformBlockBinding(y,M,s[y.id])}function o(y,v){let M=s[y.id];M===void 0&&(d(y),M=l(y),s[y.id]=M,y.addEventListener("dispose",m));let b=v.program;n.updateUBOMapping(y,b);let w=e.render.frame;r[y.id]!==w&&(c(y),r[y.id]=w)}function l(y){let v=i.createBuffer(),M=y.__size,b=y.usage;return i.bindBuffer(i.UNIFORM_BUFFER,v),i.bufferData(i.UNIFORM_BUFFER,M,b),i.bindBuffer(i.UNIFORM_BUFFER,null),v}function c(y){let v=s[y.id],M=y.uniforms,b=y.__cache;i.bindBuffer(i.UNIFORM_BUFFER,v);for(let w=0,x=M.length;w<x;w++){let S=M[w];if(Array.isArray(S))for(let P=0,R=S.length;P<R;P++)h(S[P],w,P,b);else h(S,w,0,b)}i.bindBuffer(i.UNIFORM_BUFFER,null)}function h(y,v,M,b){if(u(y,v,M,b)===!0){let w=y.__offset,x=y.value;if(Array.isArray(x)){let S=0;for(let P=0;P<x.length;P++){let R=x[P],C=_(R,!0);f(R,y.__data,S),S+=C.storage/Float32Array.BYTES_PER_ELEMENT}}else f(x,y.__data,0);i.bufferSubData(i.UNIFORM_BUFFER,w,y.__data)}}function f(y,v,M){typeof y=="number"||typeof y=="boolean"?v[M]=y:y.isMatrix3?(v[M]=y.elements[0],v[M+1]=y.elements[1],v[M+2]=y.elements[2],v[M+3]=0,v[M+4]=y.elements[3],v[M+5]=y.elements[4],v[M+6]=y.elements[5],v[M+7]=0,v[M+8]=y.elements[6],v[M+9]=y.elements[7],v[M+10]=y.elements[8],v[M+11]=0):ArrayBuffer.isView(y)?v.set(y.subarray(0,v.length-M),M):y.toArray(v,M)}function u(y,v,M,b){let w=y.value,x=v+"_"+M;if(Array.isArray(w)){b[x]===void 0&&(b[x]=[]);let S=b[x],P=!1;for(let R=0;R<w.length;R++)p(w[R],S,R)===!0&&(P=!0);return P}return p(w,b,x)}function p(y,v,M){if(v[M]===void 0)return typeof y=="number"||typeof y=="boolean"?v[M]=y:ArrayBuffer.isView(y)?v[M]=y.slice():v[M]=y.clone(),!0;{let b=v[M];if(typeof y=="number"||typeof y=="boolean"){if(b!==y)return v[M]=y,!0}else{if(ArrayBuffer.isView(y))return!0;if(b.equals(y)===!1)return b.copy(y),!0}}return!1}function d(y){let v=y.uniforms,M=0,b=16;for(let x=0,S=v.length;x<S;x++){let P=Array.isArray(v[x])?v[x]:[v[x]];for(let R=0,C=P.length;R<C;R++){let D=P[R],F=Array.isArray(D.value)?D.value:[D.value],L=Array.isArray(v[x])||Array.isArray(D.value),V=M;for(let H=0,te=F.length;H<te;H++){let X=F[H],ee=_(X,L),Q=M%b,_e=Q%ee.boundary,Ne=Q+_e;M+=_e,Ne!==0&&b-Ne<ee.storage&&(M+=b-Ne),H===0&&(V=M),M+=ee.storage}let $=D.type==="int"?Int32Array:D.type==="uint"?Uint32Array:Float32Array;D.__data=new $((M-V)/Float32Array.BYTES_PER_ELEMENT),D.__offset=V}}let w=M%b;return w>0&&(M+=b-w),y.__size=M,y.__cache={},this}function _(y,v){let M={boundary:0,storage:0};return typeof y=="number"||typeof y=="boolean"?(M.boundary=4,M.storage=4):y.isVector2?(M.boundary=8,M.storage=8):y.isVector3||y.isColor?(M.boundary=16,M.storage=12):y.isVector4?(M.boundary=16,M.storage=16):y.isMatrix3?(M.boundary=16,M.storage=48):y.isMatrix4?(M.boundary=16,M.storage=64):y.isTexture?Le("WebGLRenderer: Texture samplers can not be part of an uniforms group."):ArrayBuffer.isView(y)?(M.boundary=16,M.storage=y.byteLength):Le("WebGLRenderer: Unsupported uniform value type.",y),v===!0&&(M.boundary=16,M.storage=Math.ceil(M.storage/16)*16),M}function m(y){let v=y.target;v.removeEventListener("dispose",m),i.deleteBuffer(s[v.id]),delete s[v.id],delete r[v.id]}function g(){for(let y in s)i.deleteBuffer(s[y]);s={},r={}}return{bind:a,update:o,dispose:g}}var bx=new Uint16Array([12469,15057,12620,14925,13266,14620,13807,14376,14323,13990,14545,13625,14713,13328,14840,12882,14931,12528,14996,12233,15039,11829,15066,11525,15080,11295,15085,10976,15082,10705,15073,10495,13880,14564,13898,14542,13977,14430,14158,14124,14393,13732,14556,13410,14702,12996,14814,12596,14891,12291,14937,11834,14957,11489,14958,11194,14943,10803,14921,10506,14893,10278,14858,9960,14484,14039,14487,14025,14499,13941,14524,13740,14574,13468,14654,13106,14743,12678,14818,12344,14867,11893,14889,11509,14893,11180,14881,10751,14852,10428,14812,10128,14765,9754,14712,9466,14764,13480,14764,13475,14766,13440,14766,13347,14769,13070,14786,12713,14816,12387,14844,11957,14860,11549,14868,11215,14855,10751,14825,10403,14782,10044,14729,9651,14666,9352,14599,9029,14967,12835,14966,12831,14963,12804,14954,12723,14936,12564,14917,12347,14900,11958,14886,11569,14878,11247,14859,10765,14828,10401,14784,10011,14727,9600,14660,9289,14586,8893,14508,8533,15111,12234,15110,12234,15104,12216,15092,12156,15067,12010,15028,11776,14981,11500,14942,11205,14902,10752,14861,10393,14812,9991,14752,9570,14682,9252,14603,8808,14519,8445,14431,8145,15209,11449,15208,11451,15202,11451,15190,11438,15163,11384,15117,11274,15055,10979,14994,10648,14932,10343,14871,9936,14803,9532,14729,9218,14645,8742,14556,8381,14461,8020,14365,7603,15273,10603,15272,10607,15267,10619,15256,10631,15231,10614,15182,10535,15118,10389,15042,10167,14963,9787,14883,9447,14800,9115,14710,8665,14615,8318,14514,7911,14411,7507,14279,7198,15314,9675,15313,9683,15309,9712,15298,9759,15277,9797,15229,9773,15166,9668,15084,9487,14995,9274,14898,8910,14800,8539,14697,8234,14590,7790,14479,7409,14367,7067,14178,6621,15337,8619,15337,8631,15333,8677,15325,8769,15305,8871,15264,8940,15202,8909,15119,8775,15022,8565,14916,8328,14804,8009,14688,7614,14569,7287,14448,6888,14321,6483,14088,6171,15350,7402,15350,7419,15347,7480,15340,7613,15322,7804,15287,7973,15229,8057,15148,8012,15046,7846,14933,7611,14810,7357,14682,7069,14552,6656,14421,6316,14251,5948,14007,5528,15356,5942,15356,5977,15353,6119,15348,6294,15332,6551,15302,6824,15249,7044,15171,7122,15070,7050,14949,6861,14818,6611,14679,6349,14538,6067,14398,5651,14189,5311,13935,4958,15359,4123,15359,4153,15356,4296,15353,4646,15338,5160,15311,5508,15263,5829,15188,6042,15088,6094,14966,6001,14826,5796,14678,5543,14527,5287,14377,4985,14133,4586,13869,4257,15360,1563,15360,1642,15358,2076,15354,2636,15341,3350,15317,4019,15273,4429,15203,4732,15105,4911,14981,4932,14836,4818,14679,4621,14517,4386,14359,4156,14083,3795,13808,3437,15360,122,15360,137,15358,285,15355,636,15344,1274,15322,2177,15281,2765,15215,3223,15120,3451,14995,3569,14846,3567,14681,3466,14511,3305,14344,3121,14037,2800,13753,2467,15360,0,15360,1,15359,21,15355,89,15346,253,15325,479,15287,796,15225,1148,15133,1492,15008,1749,14856,1882,14685,1886,14506,1783,14324,1608,13996,1398,13702,1183]),$n=null;function Sx(){return $n===null&&($n=new ga(bx,16,16,Ei,Fn),$n.name="DFG_LUT",$n.minFilter=Mt,$n.magFilter=Mt,$n.wrapS=Vn,$n.wrapT=Vn,$n.generateMipmaps=!1,$n.needsUpdate=!0),$n}var Mo=class{constructor(e={}){let{canvas:t=qh(),context:n=null,depth:s=!0,stencil:r=!1,alpha:a=!1,antialias:o=!1,premultipliedAlpha:l=!0,preserveDrawingBuffer:c=!1,powerPreference:h="default",failIfMajorPerformanceCaveat:f=!1,reversedDepthBuffer:u=!1,outputBufferType:p=fn}=e;this.isWebGLRenderer=!0;let d;if(n!==null){if(typeof WebGLRenderingContext<"u"&&n instanceof WebGLRenderingContext)throw new Error("THREE.WebGLRenderer: WebGL 1 is not supported since r163.");d=n.getContextAttributes().alpha}else d=a;let _=p,m=new Set([Ba,za,ka]),g=new Set([fn,Nn,Ts,$i,Fa,Oa]),y=new Uint32Array(4),v=new Int32Array(4),M={textures:[],min:[],max:[],resolution:[]},b=null,w=null,x=[],S=[],P=null;this.domElement=t,this.debug={checkShaderErrors:!0,diagnostics:{keywords:!1},onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this.toneMapping=qn,this.toneMappingExposure=1,this.transmissionResolutionScale=1;let R=this,C=!1,D=null,F=null,L=null,V=null;this._outputColorSpace=un;let $=0,H=0,te=null,X=-1,ee=null,Q=new lt,_e=new lt,Ne=null,Z=new je(0),me=0,Me=t.width,Ce=t.height,ge=1,ze=null,St=null,Ie=new lt(0,0,Me,Ce),at=new lt(0,0,Me,Ce),ct=!1,qe=new Vi,Bt=new xa,At=!1,rn=!1,vt=new xt,Bn=new G,It=new lt,mn={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0},gn=!1;function xn(){return te===null?ge:1}let U=n;function vn(E,N){return t.getContext(E,N)}let mt,gt,de,Rt,Pe,Oe,A,T,k,ne,j,re,he,Y,J,oe,I,K,q,le,se,ae,Ee;try{let E={alpha:!0,depth:s,stencil:r,antialias:o,premultipliedAlpha:l,preserveDrawingBuffer:c,powerPreference:h,failIfMajorPerformanceCaveat:f};if("setAttribute"in t&&t.setAttribute("data-engine",`three.js r${"187"}`),t.addEventListener("webglcontextlost",Ae,!1),t.addEventListener("webglcontextrestored",Be,!1),t.addEventListener("webglcontextcreationerror",fe,!1),U===null){let N="webgl2";if(U=vn(N,E),U===null)throw vn(N)?new Error("THREE.WebGLRenderer: Error creating WebGL context with your selected attributes."):new Error("THREE.WebGLRenderer: Error creating WebGL context.")}Ge()}catch(E){throw t.removeEventListener("webglcontextlost",Ae,!1),t.removeEventListener("webglcontextrestored",Be,!1),t.removeEventListener("webglcontextcreationerror",fe,!1),De("WebGLRenderer: "+E.message),E}function Ge(){mt=new N0(U),mt.init(),se=new gx(U,mt),gt=new S0(U,mt,e,se),de=new px(U,mt),gt.reversedDepthBuffer&&u&&de.buffers.depth.setReversed(!0),F=U.createFramebuffer(),L=U.createFramebuffer(),V=U.createFramebuffer(),Rt=new O0(U),Pe=new ex,Oe=new mx(U,mt,de,Pe,gt,se,Rt),A=new D0(R),T=new zf(U),ae=new M0(U,T),k=new U0(U,T,Rt,ae),ne=new z0(U,k,T,ae,Rt),K=new k0(U,gt,Oe),J=new w0(Pe),j=new Qg(R,A,mt,gt,ae,J),re=new yx(R,Pe),he=new nx,Y=new lx(mt),I=new y0(R,A,de,ne,d,l),oe=new fx(R,ne,gt),Ee=new Mx(U,Rt,gt,de),q=new b0(U,mt,Rt),le=new F0(U,mt,Rt),Rt.programs=j.programs,R.capabilities=gt,R.extensions=mt,R.properties=Pe,R.renderLists=he,R.shadowMap=oe,R.state=de,R.info=Rt}_!==fn&&(P=new G0(_,t.width,t.height,o,s,r));let ie=new lc(R,U);this.xr=ie,this.getContext=function(){return U},this.getContextAttributes=function(){return U.getContextAttributes()},this.forceContextLoss=function(){let E=mt.get("WEBGL_lose_context");E&&E.loseContext()},this.forceContextRestore=function(){let E=mt.get("WEBGL_lose_context");E&&E.restoreContext()},this.getPixelRatio=function(){return ge},this.setPixelRatio=function(E){E!==void 0&&(ge=E,this.setSize(Me,Ce,!1))},this.getSize=function(E){return E.set(Me,Ce)},this.setSize=function(E,N,W=!0){if(ie.isPresenting){Le("WebGLRenderer: Can't change size while VR device is presenting.");return}Me=E,Ce=N,t.width=Math.floor(E*ge),t.height=Math.floor(N*ge),W===!0&&(t.style.width=E+"px",t.style.height=N+"px"),P!==null&&P.setSize(t.width,t.height),this.setViewport(0,0,E,N)},this.getDrawingBufferSize=function(E){return E.set(Me*ge,Ce*ge).floor()},this.setDrawingBufferSize=function(E,N,W){Me=E,Ce=N,ge=W,t.width=Math.floor(E*W),t.height=Math.floor(N*W),this.setViewport(0,0,E,N)},this.setEffects=function(E){if(_===fn){De("WebGLRenderer: setEffects() requires outputBufferType set to HalfFloatType or FloatType.");return}if(E){for(let N=0;N<E.length;N++)if(E[N].isOutputPass===!0){Le("WebGLRenderer: OutputPass is not needed in setEffects(). Tone mapping and color space conversion are applied automatically.");break}}P.setEffects(E||[])},this.getCurrentViewport=function(E){return E.copy(Q)},this.getViewport=function(E){return E.copy(Ie)},this.setViewport=function(E,N,W,O){E.isVector4?Ie.set(E.x,E.y,E.z,E.w):Ie.set(E,N,W,O),de.viewport(Q.copy(Ie).multiplyScalar(xn()).round())},this.getScissor=function(E){return E.copy(at)},this.setScissor=function(E,N,W,O){E.isVector4?at.set(E.x,E.y,E.z,E.w):at.set(E,N,W,O),de.scissor(_e.copy(at).multiplyScalar(xn()).round())},this.getScissorTest=function(){return ct},this.setScissorTest=function(E){de.setScissorTest(ct=E)},this.setOpaqueSort=function(E){ze=E},this.setTransparentSort=function(E){St=E},this.getClearColor=function(E){return E.copy(I.getClearColor())},this.setClearColor=function(){I.setClearColor(...arguments)},this.getClearAlpha=function(){return I.getClearAlpha()},this.setClearAlpha=function(){I.setClearAlpha(...arguments)},this.clear=function(E=!0,N=!0,W=!0){let O=0;if(E){let z=!1;if(te!==null){let ue=te.texture.format;z=m.has(ue)}if(z){let ue=te.texture.type,ye=g.has(ue),ce=I.getClearColor(),xe=I.getClearAlpha(),Te=ce.r,ke=ce.g,$e=ce.b;ye?(y[0]=Te,y[1]=ke,y[2]=$e,y[3]=xe,U.clearBufferuiv(U.COLOR,0,y)):(v[0]=Te,v[1]=ke,v[2]=$e,v[3]=xe,U.clearBufferiv(U.COLOR,0,v))}else O|=U.COLOR_BUFFER_BIT}N&&(O|=U.DEPTH_BUFFER_BIT,this.state.buffers.depth.setMask(!0)),W&&(O|=U.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295)),O!==0&&U.clear(O)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.setNodesHandler=function(E){E.setRenderer(this),D=E},this.dispose=function(){t.removeEventListener("webglcontextlost",Ae,!1),t.removeEventListener("webglcontextrestored",Be,!1),t.removeEventListener("webglcontextcreationerror",fe,!1),I.dispose(),he.dispose(),Y.dispose(),Oe.dispose(),Pe.dispose(),A.dispose(),ne.dispose(),k.dispose(),ae.dispose(),Ee.dispose(),j.dispose(),ie.dispose(),ie.removeEventListener("sessionstart",Fc),ie.removeEventListener("sessionend",Oc),Di.stop()};function Ae(E){E.preventDefault(),$l("WebGLRenderer: Context Lost."),C=!0}function Be(){$l("WebGLRenderer: Context Restored."),C=!1;let E=Rt.autoReset,N=oe.enabled,W=oe.autoUpdate,O=oe.needsUpdate,z=oe.type;Ge(),Rt.autoReset=E,oe.enabled=N,oe.autoUpdate=W,oe.needsUpdate=O,oe.type=z}function fe(E){De("WebGLRenderer: A WebGL context could not be created. Reason: ",E.statusMessage)}function ot(E){let N=E.target;N.removeEventListener("dispose",ot),Lt(N)}function Lt(E){fi(E),Pe.remove(E)}function fi(E){let N=Pe.get(E).programs;N!==void 0&&(N.forEach(function(W){j.releaseProgram(W)}),E.isShaderMaterial&&j.releaseShaderCache(E))}this.renderBufferDirect=function(E,N,W,O,z,ue){N===null&&(N=mn);let ye=z.isMesh&&z.matrixWorld.determinantAffine()<0,ce=Kd(E,N,W,O,z);de.setMaterial(O,ye);let xe=W.index,Te=1;if(O.wireframe===!0){if(xe=k.getWireframeAttribute(W),xe===void 0)return;Te=2}let ke=W.drawRange,$e=W.attributes.position,be=ke.start*Te,Ye=(ke.start+ke.count)*Te;ue!==null&&(be=Math.max(be,ue.start*Te),Ye=Math.min(Ye,(ue.start+ue.count)*Te)),xe!==null?(be=Math.max(be,0),Ye=Math.min(Ye,xe.count)):$e!=null&&(be=Math.max(be,0),Ye=Math.min(Ye,$e.count));let wt=Ye-be;if(wt<0||wt===1/0)return;ae.setup(z,O,ce,W,xe);let dt,ht=q;if(xe!==null&&(dt=T.get(xe),ht=le,ht.setIndex(dt)),z.isMesh)O.wireframe===!0?(de.setLineWidth(O.wireframeLinewidth*xn()),ht.setMode(U.LINES)):ht.setMode(U.TRIANGLES);else if(z.isLine){let Wt=O.linewidth;Wt===void 0&&(Wt=1),de.setLineWidth(Wt*xn()),z.isLineSegments?ht.setMode(U.LINES):z.isLineLoop?ht.setMode(U.LINE_LOOP):ht.setMode(U.LINE_STRIP)}else z.isPoints?ht.setMode(U.POINTS):z.isSprite&&ht.setMode(U.TRIANGLES);if(z.isBatchedMesh)if(mt.get("WEBGL_multi_draw"))ht.renderMultiDraw(z._multiDrawStarts,z._multiDrawCounts,z._multiDrawCount);else{let Wt=z._multiDrawStarts,Se=z._multiDrawCounts,en=z._multiDrawCount,tt=xe?T.get(xe).bytesPerElement:1,Ni=Pe.get(O).currentProgram.getUniforms();for(let Xt=0;Xt<en;Xt++)Ni.setValue(U,"_gl_DrawID",Xt),ht.render(Wt[Xt]/tt,Se[Xt])}else if(z.isInstancedMesh)ht.renderInstances(be,wt,z.count);else if(W.isInstancedBufferGeometry){let Wt=W._maxInstanceCount!==void 0?W._maxInstanceCount:1/0,Se=Math.min(W.instanceCount,Wt);ht.renderInstances(be,wt,Se)}else ht.render(be,wt)};function Uc(E,N,W,O){D!==null&&E.isNodeMaterial&&D.setObject(O,E),At===!0&&J.setState(E,W,!1),E.transparent===!0&&E.side===Tn&&E.forceSinglePass===!1?(E.side=sn,E.needsUpdate=!0,Os(E,N,O),E.side=Ti,E.needsUpdate=!0,Os(E,N,O),E.side=Tn):Os(E,N,O)}this.compile=function(E,N,W=null){W===null&&(W=E),D!==null&&D.renderStart(E,N,W),w=Y.get(W),w.init(N),S.push(w),W.traverseVisible(function(z){z.isLight&&z.layers.test(N.layers)&&(w.pushLight(z),z.castShadow&&w.pushShadow(z))}),E!==W&&E.traverseVisible(function(z){z.isLight&&z.layers.test(N.layers)&&(w.pushLight(z),z.castShadow&&w.pushShadow(z))}),w.setupLights(),D!==null&&D.updateLights(w.state.lightsArray),rn=this.localClippingEnabled,At=J.init(this.clippingPlanes,rn),At===!0&&J.setGlobalState(this.clippingPlanes,N),D!==null&&oe.render(w.state.shadowsArray,W,N);let O=new Set;return E.traverse(function(z){if(!(z.isMesh||z.isPoints||z.isLine||z.isSprite))return;let ue=z.material;if(ue)if(Array.isArray(ue))for(let ye=0;ye<ue.length;ye++){let ce=ue[ye];Uc(ce,W,N,z),O.add(ce)}else Uc(ue,W,N,z),O.add(ue)}),w=S.pop(),D!==null&&D.renderEnd(),O},this.compileAsync=function(E,N,W=null){let O=this.compile(E,N,W);return new Promise(z=>{function ue(){if(O.forEach(function(ye){let xe=Pe.get(ye).currentProgram;(xe===void 0||xe.isReady())&&O.delete(ye)}),O.size===0){z(E);return}setTimeout(ue,10)}mt.get("KHR_parallel_shader_compile")!==null?ue():setTimeout(ue,10)})};let Xo=null;function Zd(E){Xo&&Xo(E)}function Fc(){Di.stop()}function Oc(){Di.start()}let Di=new bu;Di.setAnimationLoop(Zd),typeof self<"u"&&Di.setContext(self),this.setAnimationLoop=function(E){Xo=E,ie.setAnimationLoop(E),E===null?Di.stop():Di.start()},ie.addEventListener("sessionstart",Fc),ie.addEventListener("sessionend",Oc),this.render=function(E,N){if(N!==void 0&&N.isCamera!==!0){De("WebGLRenderer.render: camera is not an instance of THREE.Camera.");return}if(C===!0)return;D!==null&&D.renderStart(E,N);let W=ie.enabled===!0&&ie.isPresenting===!0,O=P!==null&&(te===null||W)&&P.begin(R,te);if(E.matrixWorldAutoUpdate===!0&&E.updateMatrixWorld(),N.parent===null&&N.matrixWorldAutoUpdate===!0&&N.updateMatrixWorld(),ie.enabled===!0&&ie.isPresenting===!0&&(P===null||P.isCompositing()===!1)&&(ie.cameraAutoUpdate===!0&&ie.updateCamera(N),N=ie.getCamera()),E.isScene===!0&&E.onBeforeRender(R,E,N,te),w=Y.get(E,S.length),w.init(N),w.state.textureUnits=Oe.getTextureUnits(),S.push(w),vt.multiplyMatrices(N.projectionMatrix,N.matrixWorldInverse),N.isArrayCamera?Bt.setFromArrayCamera(N):qe.setFromProjectionMatrix(vt,yn,N.reversedDepth),rn=this.localClippingEnabled,At=J.init(this.clippingPlanes,rn),b=he.get(E,x.length),b.init(),x.push(b),this.info.render.frame++,ie.enabled===!0&&ie.isPresenting===!0){let ye=R.xr.getDepthSensingMesh();ye!==null&&qo(ye,N,-1/0,R.sortObjects)}qo(E,N,0,R.sortObjects),b.finish(),D!==null&&D.updateLights(w.state.lightsArray),R.sortObjects===!0&&b.sort(ze,St),gn=ie.enabled===!1||ie.isPresenting===!1||ie.hasDepthSensing()===!1,gn&&I.addToRenderList(b,E),this.info.autoReset===!0&&this.info.reset(),At===!0&&J.beginShadows();let z=w.state.shadowsArray;if(oe.render(z,E,N),At===!0&&J.endShadows(),(O&&P.hasRenderPass())===!1){let ye=b.opaque,ce=b.transmissive;if(w.setupLights(),N.isArrayCamera){let xe=N.cameras;if(ce.length>0)for(let Te=0,ke=xe.length;Te<ke;Te++){let $e=xe[Te];zc(ye,ce,E,$e)}gn&&I.render(E);for(let Te=0,ke=xe.length;Te<ke;Te++){let $e=xe[Te];kc(b,E,$e,$e.viewport)}}else ce.length>0&&zc(ye,ce,E,N),gn&&I.render(E),kc(b,E,N)}te!==null&&H===0&&(Oe.updateMultisampleRenderTarget(te),Oe.updateRenderTargetMipmap(te)),O&&P.end(R),E.isScene===!0&&E.onAfterRender(R,E,N),ae.resetDefaultState(),X=-1,ee=null,S.pop(),S.length>0?(w=S[S.length-1],Oe.setTextureUnits(w.state.textureUnits),At===!0&&J.setGlobalState(R.clippingPlanes,w.state.camera)):w=null,x.pop(),x.length>0?b=x[x.length-1]:b=null,D!==null&&D.renderEnd()};function qo(E,N,W,O){if(E.visible===!1)return;if(E.layers.test(N.layers)){if(E.isGroup)W=E.renderOrder;else if(E.isLOD)E.autoUpdate===!0&&E.update(N);else if(E.isLight)w.pushLight(E),E.castShadow&&w.pushShadow(E);else if(E.isSprite){let ye=N.isArrayCamera?Bt:qe;if(!E.frustumCulled||E.intersectsFrustum(ye)){O&&It.setFromMatrixPosition(E.matrixWorld).applyMatrix4(vt);let ce=ne.update(E),xe=E.material;xe.visible&&b.push(E,ce,xe,W,It.z,null,N)}}else if(E.isMesh||E.isLine||E.isPoints){let ye=N.isArrayCamera?Bt:qe;if(!E.frustumCulled||E.intersectsFrustum(ye)){let ce=ne.update(E),xe=E.material;if(O&&(E.boundingSphere!==void 0?(E.boundingSphere===null&&E.computeBoundingSphere(),It.copy(E.boundingSphere.center)):(ce.boundingSphere===null&&ce.computeBoundingSphere(),It.copy(ce.boundingSphere.center)),It.applyMatrix4(E.matrixWorld).applyMatrix4(vt)),Array.isArray(xe)){let Te=ce.groups;for(let ke=0,$e=Te.length;ke<$e;ke++){let be=Te[ke],Ye=xe[be.materialIndex];Ye&&Ye.visible&&b.push(E,ce,Ye,W,It.z,be,N)}}else xe.visible&&b.push(E,ce,xe,W,It.z,null,N)}}}let ue=E.children;for(let ye=0,ce=ue.length;ye<ce;ye++)qo(ue[ye],N,W,O)}function kc(E,N,W,O){let{opaque:z,transmissive:ue,transparent:ye}=E;w.setupLightsView(W),At===!0&&J.setGlobalState(R.clippingPlanes,W),O&&de.viewport(Q.copy(O)),z.length>0&&Ir(z,N,W),ue.length>0&&Ir(ue,N,W),ye.length>0&&Ir(ye,N,W),de.buffers.depth.setTest(!0),de.buffers.depth.setMask(!0),de.buffers.color.setMask(!0),de.setPolygonOffset(!1)}function zc(E,N,W,O){if((W.isScene===!0?W.overrideMaterial:null)!==null)return;if(w.state.transmissionRenderTarget[O.id]===void 0){let be=mt.has("EXT_color_buffer_half_float")||mt.has("EXT_color_buffer_float");w.state.transmissionRenderTarget[O.id]=new nn(1,1,{generateMipmaps:!0,type:be?Fn:fn,minFilter:En,samples:Math.max(4,gt.samples),stencilBuffer:r,resolveDepthBuffer:!1,resolveStencilBuffer:!1,storeMultisampledDepthBuffer:!1,storeMultisampledStencilBuffer:!1,colorSpace:Ze.workingColorSpace})}let ue=w.state.transmissionRenderTarget[O.id],ye=O.viewport||Q;ue.setSize(ye.z*R.transmissionResolutionScale,ye.w*R.transmissionResolutionScale);let ce=R.getRenderTarget(),xe=R.getActiveCubeFace(),Te=R.getActiveMipmapLevel();R.setRenderTarget(ue),R.getClearColor(Z),me=R.getClearAlpha(),me<1&&R.setClearColor(16777215,.5),R.clear(),gn&&I.render(W);let ke=R.toneMapping;R.toneMapping=qn;let $e=O.viewport;if(O.viewport!==void 0&&(O.viewport=void 0),w.setupLightsView(O),At===!0&&J.setGlobalState(R.clippingPlanes,O),Ir(E,W,O),Oe.updateMultisampleRenderTarget(ue),Oe.updateRenderTargetMipmap(ue),mt.has("WEBGL_multisampled_render_to_texture")===!1){let be=!1;for(let Ye=0,wt=N.length;Ye<wt;Ye++){let dt=N[Ye],{object:ht,geometry:Wt,material:Se,group:en}=dt;if(Se.side===Tn&&ht.layers.test(O.layers)){let tt=Se.side;Se.side=sn,Se.needsUpdate=!0,Bc(ht,W,O,Wt,Se,en),Se.side=tt,Se.needsUpdate=!0,be=!0}}be===!0&&(Oe.updateMultisampleRenderTarget(ue),Oe.updateRenderTargetMipmap(ue))}R.setRenderTarget(ce,xe,Te),R.setClearColor(Z,me),$e!==void 0&&(O.viewport=$e),R.toneMapping=ke}function Ir(E,N,W){let O=N.isScene===!0?N.overrideMaterial:null;for(let z=0,ue=E.length;z<ue;z++){let ye=E[z],{object:ce,geometry:xe,group:Te}=ye,ke=ye.material;ke.allowOverride===!0&&O!==null&&(ke=O),ce.layers.test(W.layers)&&Bc(ce,N,W,xe,ke,Te)}}function Bc(E,N,W,O,z,ue){D!==null&&z.isNodeMaterial&&D.setObject(E,z),E.onBeforeRender(R,N,W,O,z,ue),E.modelViewMatrix.multiplyMatrices(W.matrixWorldInverse,E.matrixWorld),E.normalMatrix.getNormalMatrix(E.modelViewMatrix),z.onBeforeRender(R,N,W,O,E,ue),z.transparent===!0&&z.side===Tn&&z.forceSinglePass===!1?(z.side=sn,z.needsUpdate=!0,R.renderBufferDirect(W,N,O,z,E,ue),z.side=Ti,z.needsUpdate=!0,R.renderBufferDirect(W,N,O,z,E,ue),z.side=Tn):R.renderBufferDirect(W,N,O,z,E,ue),E.onAfterRender(R,N,W,O,z,ue)}function Gc(E){let N=0;for(let W of E)W.texture!==null&&N++;return N}function Os(E,N,W){N.isScene!==!0&&(N=mn);let O=Pe.get(E),z=w.state.lights,ue=w.state.shadowsArray,ye=z.state.version,ce=j.getParameters(E,z.state,ue,N,W,w.state.lightProbeGridArray),xe=j.getProgramCacheKey(ce),Te=O.programs;O.environment=E.isMeshStandardMaterial||E.isMeshLambertMaterial||E.isMeshPhongMaterial?N.environment:null,O.fog=N.fog;let ke=E.isMeshStandardMaterial||E.isMeshLambertMaterial&&!E.envMap||E.isMeshPhongMaterial&&!E.envMap;O.envMap=A.get(E.envMap||O.environment,ke),O.envMapRotation=O.environment!==null&&E.envMap===null?N.environmentRotation:E.envMapRotation,Te===void 0&&(E.addEventListener("dispose",ot),Te=new Map,O.programs=Te,O.programVariants=new Map);let $e=Te.get(xe);if($e!==void 0){if(O.currentProgram===$e&&O.lightsStateVersion===ye)return Hc(E,ce),$e}else ce.uniforms=j.getUniforms(E),D!==null&&E.isNodeMaterial&&D.build(E,W,ce),E.onBeforeCompile(ce,R),$e=j.acquireProgram(ce,xe),Te.set(xe,$e),O.uniforms=ce.uniforms;let be=O.uniforms;return(!E.isShaderMaterial&&!E.isRawShaderMaterial||E.clipping===!0)&&(be.clippingPlanes=J.uniform),Hc(E,ce),O.needsLights=Qd(E),O.lightsStateVersion=ye,O.needsLights&&(be.ambientLightColor.value=z.state.ambient,be.lightProbe.value=z.state.probe,be.sunLights.value=z.state.sun,be.sunLightShadows.value=z.state.sunShadow,be.directionalLights.value=z.state.directional,be.directionalLightShadows.value=z.state.directionalShadow,be.spotLights.value=z.state.spot,be.spotLightShadows.value=z.state.spotShadow,be.rectAreaLights.value=z.state.rectArea,be.ltc_1.value=z.state.rectAreaLTC1,be.ltc_2.value=z.state.rectAreaLTC2,be.pointLights.value=z.state.point,be.pointLightShadows.value=z.state.pointShadow,be.hemisphereLights.value=z.state.hemi,be.sunShadowMatrix.value=z.state.sunShadowMatrix,be.sunShadowCascade.value=z.state.sunShadowCascade,be.directionalShadowMatrix.value=z.state.directionalShadowMatrix,be.spotLightMatrix.value=z.state.spotLightMatrix,be.spotLightMap.value=z.state.spotLightMap,be.pointShadowMatrix.value=z.state.pointShadowMatrix),O.numLightProbeGrids=Gc(w.state.lightProbeGridArray),O.currentProgram=$e,O.uniformsList=null,$e}function Jd(E,N,W,O,z){let ue=Pe.get(E),ye=ue.currentProgram.id+","+O+","+z,ce=ue.programVariants.get(ye);return ce===void 0?(ce=Os(E,N,W),ue.programVariants.set(ye,ce)):(ue.currentProgram=ce,ue.uniformsList=null,ue.outputColorSpace=O,ue.toneMapping=z),ce}function Vc(E){if(E.uniformsList===null){let N=E.currentProgram.getUniforms();E.uniformsList=Es.seqWithValue(N.seq,E.uniforms)}return E.uniformsList}function Hc(E,N){let W=Pe.get(E);W.outputColorSpace=N.outputColorSpace,W.batching=N.batching,W.batchingColor=N.batchingColor,W.instancing=N.instancing,W.instancingColor=N.instancingColor,W.instancingMorph=N.instancingMorph,W.skinning=N.skinning,W.morphTargets=N.morphTargets,W.morphNormals=N.morphNormals,W.morphColors=N.morphColors,W.morphTargetsCount=N.morphTargetsCount,W.numClippingPlanes=N.numClippingPlanes,W.numIntersection=N.numClipIntersection,W.vertexAlphas=N.vertexAlphas,W.vertexTangents=N.vertexTangents,W.toneMapping=N.toneMapping}function Kd(E,N,W,O,z){N.isScene!==!0&&(N=mn),Oe.resetTextureUnits();let ue=N.fog,ye=O.isMeshStandardMaterial||O.isMeshLambertMaterial||O.isMeshPhongMaterial?N.environment:null,ce=te===null?R.outputColorSpace:te.isXRRenderTarget===!0?te.texture.colorSpace:Ze.workingColorSpace,xe=O.isMeshStandardMaterial||O.isMeshLambertMaterial&&!O.envMap||O.isMeshPhongMaterial&&!O.envMap,Te=A.get(O.envMap||ye,xe),ke=O.vertexColors===!0&&!!W.attributes.color&&W.attributes.color.itemSize===4,$e=!!W.attributes.tangent&&(!!O.normalMap||O.anisotropy>0),be=!!W.morphAttributes.position,Ye=!!W.morphAttributes.normal,wt=!!W.morphAttributes.color,dt=qn;O.toneMapped&&(te===null||te.isXRRenderTarget===!0)&&(dt=R.toneMapping);let ht=W.morphAttributes.position||W.morphAttributes.normal||W.morphAttributes.color,Wt=ht!==void 0?ht.length:0,Se=Pe.get(O),en=w.state.lights;if(At===!0&&(rn===!0||E!==ee)){let _t=E===ee&&O.id===X;J.setState(O,E,_t)}let tt=!1,Ni=!1;O.version===Se.__version?Se.needsLights&&Se.lightsStateVersion!==en.state.version||z.isBatchedMesh&&Se.batching===!1||!z.isBatchedMesh&&Se.batching===!0||z.isBatchedMesh&&Se.batchingColor===!0&&z._colorsTexture===null||z.isBatchedMesh&&Se.batchingColor===!1&&z._colorsTexture!==null||z.isInstancedMesh&&Se.instancing===!1||!z.isInstancedMesh&&Se.instancing===!0||z.isSkinnedMesh&&Se.skinning===!1||!z.isSkinnedMesh&&Se.skinning===!0||z.isInstancedMesh&&Se.instancingColor===!0&&z.instanceColor===null||z.isInstancedMesh&&Se.instancingColor===!1&&z.instanceColor!==null||z.isInstancedMesh&&Se.instancingMorph===!0&&z.morphTexture===null||z.isInstancedMesh&&Se.instancingMorph===!1&&z.morphTexture!==null||Se.envMap!==Te||O.fog===!0&&Se.fog!==ue||Se.numClippingPlanes!==void 0&&(Se.numClippingPlanes!==J.numPlanes||Se.numIntersection!==J.numIntersection)||Se.vertexAlphas!==ke||Se.vertexTangents!==$e||Se.morphTargets!==be||Se.morphNormals!==Ye||Se.morphColors!==wt||Se.morphTargetsCount!==Wt||Se.numLightProbeGrids!==Gc(w.state.lightProbeGridArray)?tt=!0:(Se.outputColorSpace!==ce||Se.toneMapping!==dt)&&(Ni=!0):(tt=!0,Se.__version=O.version);let Xt=Se.currentProgram;(tt===!0||Ni===!0)&&(Xt=Ni===!0?Jd(O,N,z,ce,dt):Os(O,N,z),D&&O.isNodeMaterial&&D.onUpdateProgram(O,Xt,Se));let Lr=!1,pi=!1,Ui=!1,et=Xt.getUniforms(),Gt=Se.uniforms;if(de.useProgram(Xt.program)&&(Lr=!0,pi=!0,Ui=!0),O.id!==X&&(X=O.id,pi=!0),Lr||ee!==E){de.buffers.depth.getReversed()&&E.reversedDepth!==!0&&(E._reversedDepth=!0,E.updateProjectionMatrix()),et.setValue(U,"projectionMatrix",E.projectionMatrix),et.setValue(U,"viewMatrix",E.matrixWorldInverse);let Dt=et.map.cameraPosition;Dt!==void 0&&Dt.setValue(U,Bn.setFromMatrixPosition(E.matrixWorld)),gt.logarithmicDepthBuffer&&et.setValue(U,"logDepthBufFC",2/(Math.log(E.far+1)/Math.LN2)),(O.isMeshPhongMaterial||O.isMeshToonMaterial||O.isMeshLambertMaterial||O.isMeshBasicMaterial||O.isMeshStandardMaterial||O.isShaderMaterial)&&et.setValue(U,"isOrthographic",E.isOrthographicCamera===!0),ee!==E&&(ee=E,pi=!0,Ui=!0)}if(Se.needsLights&&(en.state.sunShadowMap.length>0&&et.setValue(U,"sunShadowMap",en.state.sunShadowMap,Oe),en.state.directionalShadowMap.length>0&&et.setValue(U,"directionalShadowMap",en.state.directionalShadowMap,Oe),en.state.spotShadowMap.length>0&&et.setValue(U,"spotShadowMap",en.state.spotShadowMap,Oe),en.state.pointShadowMap.length>0&&et.setValue(U,"pointShadowMap",en.state.pointShadowMap,Oe)),z.isSkinnedMesh){et.setOptional(U,z,"bindMatrix"),et.setOptional(U,z,"bindMatrixInverse");let _t=z.skeleton;_t&&(_t.boneTexture===null&&_t.computeBoneTexture(),et.setValue(U,"boneTexture",_t.boneTexture,Oe))}z.isBatchedMesh&&(et.setOptional(U,z,"batchingTexture"),et.setValue(U,"batchingTexture",z._matricesTexture,Oe),et.setOptional(U,z,"batchingIdTexture"),et.setValue(U,"batchingIdTexture",z._indirectTexture,Oe),et.setOptional(U,z,"batchingColorTexture"),z._colorsTexture!==null&&et.setValue(U,"batchingColorTexture",z._colorsTexture,Oe));let Cn=W.morphAttributes;if((Cn.position!==void 0||Cn.normal!==void 0||Cn.color!==void 0)&&K.update(z,W,Xt),(pi||Se.receiveShadow!==z.receiveShadow)&&(Se.receiveShadow=z.receiveShadow,et.setValue(U,"receiveShadow",z.receiveShadow)),(O.isMeshStandardMaterial||O.isMeshLambertMaterial||O.isMeshPhongMaterial)&&O.envMap===null&&N.environment!==null&&(Gt.envMapIntensity.value=N.environmentIntensity),Gt.dfgLUT!==void 0&&(Gt.dfgLUT.value=Sx()),pi){if(et.setValue(U,"toneMappingExposure",R.toneMappingExposure),Se.needsLights&&jd(Gt,Ui),ue&&O.fog===!0&&re.refreshFogUniforms(Gt,ue),re.refreshMaterialUniforms(Gt,O,ge,Ce,w.state.transmissionRenderTarget[E.id]),Se.needsLights&&Se.numLightProbeGrids>0){let _t=M,Dt=0;for(let jn of w.state.lightProbeGridArray)jn.texture!==null&&(_t.textures[Dt]=jn.texture,_t.min[Dt]=jn.boundingBox.min,_t.max[Dt]=jn.boundingBox.max,_t.resolution[Dt]=jn.resolution,Dt++);for(let jn in _t)_t[jn].length=Dt;Gt.probesSH.value=_t.textures,Gt.probesMin.value=_t.min,Gt.probesMax.value=_t.max,Gt.probesResolution.value=_t.resolution}Es.upload(U,Vc(Se),Gt,Oe)}if(O.isShaderMaterial&&O.uniformsNeedUpdate===!0&&(Es.upload(U,Vc(Se),Gt,Oe),O.uniformsNeedUpdate=!1),O.isSpriteMaterial&&et.setValue(U,"center",z.center),et.setValue(U,"modelViewMatrix",z.modelViewMatrix),et.setValue(U,"normalMatrix",z.normalMatrix),et.setValue(U,"modelMatrix",z.matrixWorld),O.uniformsGroups!==void 0){let _t=O.uniformsGroups;for(let Dt=0,jn=_t.length;Dt<jn;Dt++){let Xc=_t[Dt];Ee.update(Xc,Xt),Ee.bind(Xc,Xt)}}return Xt}function jd(E,N){E.ambientLightColor.needsUpdate=N,E.lightProbe.needsUpdate=N,E.sunLights.needsUpdate=N,E.sunLightShadows.needsUpdate=N,E.directionalLights.needsUpdate=N,E.directionalLightShadows.needsUpdate=N,E.pointLights.needsUpdate=N,E.pointLightShadows.needsUpdate=N,E.spotLights.needsUpdate=N,E.spotLightShadows.needsUpdate=N,E.rectAreaLights.needsUpdate=N,E.hemisphereLights.needsUpdate=N}function Qd(E){return E.isMeshLambertMaterial||E.isMeshToonMaterial||E.isMeshPhongMaterial||E.isMeshStandardMaterial||E.isShadowMaterial||E.isShaderMaterial&&E.lights===!0}this.getActiveCubeFace=function(){return $},this.getActiveMipmapLevel=function(){return H},this.getRenderTarget=function(){return te},this.setRenderTargetTextures=function(E,N,W){let O=Pe.get(E);O.__autoAllocateDepthBuffer=E.resolveDepthBuffer===!1,O.__autoAllocateDepthBuffer===!1&&(O.__useRenderToTexture=!1),Pe.get(E.texture).__webglTexture=N,Pe.get(E.depthTexture).__webglTexture=O.__autoAllocateDepthBuffer?void 0:W,O.__hasExternalTextures=!0},this.setRenderTargetFramebuffer=function(E,N){let W=Pe.get(E);W.__webglFramebuffer=N,W.__useDefaultFramebuffer=N===void 0},this.setRenderTarget=function(E,N=0,W=0){te=E,$=N,H=W;let O=null,z=!1,ue=!1;if(E){let ce=Pe.get(E);if(ce.__useDefaultFramebuffer!==void 0){de.bindFramebuffer(U.FRAMEBUFFER,ce.__webglFramebuffer),Q.copy(E.viewport),_e.copy(E.scissor),Ne=E.scissorTest,de.viewport(Q),de.scissor(_e),de.setScissorTest(Ne),X=-1;return}else if(ce.__webglFramebuffer===void 0)Oe.setupRenderTarget(E);else if(ce.__hasExternalTextures)Oe.rebindTextures(E,Pe.get(E.texture).__webglTexture,Pe.get(E.depthTexture).__webglTexture);else if(E.depthBuffer){let ke=E.depthTexture;if(ce.__boundDepthTexture!==ke){if(ke!==null&&Pe.has(ke)&&(E.width!==ke.image.width||E.height!==ke.image.height))throw new Error("THREE.WebGLRenderer: Attached DepthTexture is initialized to the incorrect size.");Oe.setupDepthRenderbuffer(E)}}let xe=E.texture;(xe.isData3DTexture||xe.isDataArrayTexture||xe.isCompressedArrayTexture)&&(ue=!0);let Te=Pe.get(E).__webglFramebuffer;E.isWebGLCubeRenderTarget?(Array.isArray(Te[N])?O=Te[N][W]:O=Te[N],z=!0):E.samples>0&&Oe.useMultisampledRTT(E)===!1?O=Pe.get(E).__webglMultisampledFramebuffer:Array.isArray(Te)?O=Te[W]:O=Te,Q.copy(E.viewport),_e.copy(E.scissor),Ne=E.scissorTest}else Q.copy(Ie).multiplyScalar(ge).floor(),_e.copy(at).multiplyScalar(ge).floor(),Ne=ct;if(W!==0&&(O=F),de.bindFramebuffer(U.FRAMEBUFFER,O)&&de.drawBuffers(E,O),de.viewport(Q),de.scissor(_e),de.setScissorTest(Ne),z){let ce=Pe.get(E.texture);U.framebufferTexture2D(U.FRAMEBUFFER,U.COLOR_ATTACHMENT0,U.TEXTURE_CUBE_MAP_POSITIVE_X+N,ce.__webglTexture,W)}else if(ue){let ce=N;for(let xe=0;xe<E.textures.length;xe++){let Te=Pe.get(E.textures[xe]);U.framebufferTextureLayer(U.FRAMEBUFFER,U.COLOR_ATTACHMENT0+xe,Te.__webglTexture,W,ce)}}else if(E!==null&&W!==0){let ce=Pe.get(E.texture);U.framebufferTexture2D(U.FRAMEBUFFER,U.COLOR_ATTACHMENT0,U.TEXTURE_2D,ce.__webglTexture,W)}X=-1};function Wc(E){let N=Pe.get(E);return(N.__readFormat!==E.format||N.__readType!==E.type)&&(N.__readFormat=E.format,N.__readType=E.type,N.__formatReadable=gt.textureFormatReadable(E.format),N.__typeReadable=gt.textureTypeReadable(E.type)),N}this.readRenderTargetPixels=function(E,N,W,O,z,ue,ye,ce=0){if(!(E&&E.isWebGLRenderTarget)){De("WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");return}let xe=Pe.get(E).__webglFramebuffer;if(E.isWebGLCubeRenderTarget&&ye!==void 0&&(xe=xe[ye],Array.isArray(xe)&&(xe=xe[0])),xe){de.bindFramebuffer(U.FRAMEBUFFER,xe);try{let Te=E.textures[ce],ke=Te.format,$e=Te.type;E.textures.length>1&&U.readBuffer(U.COLOR_ATTACHMENT0+ce);let be=Wc(Te);if(be.__formatReadable===!1){De("WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.");return}if(be.__typeReadable===!1){De("WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.");return}N>=0&&N<=E.width-O&&W>=0&&W<=E.height-z&&U.readPixels(N,W,O,z,se.convert(ke),se.convert($e),ue)}finally{let Te=te!==null?Pe.get(te).__webglFramebuffer:null;de.bindFramebuffer(U.FRAMEBUFFER,Te)}}},this.readRenderTargetPixelsAsync=async function(E,N,W,O,z,ue,ye,ce=0){if(!(E&&E.isWebGLRenderTarget))throw new Error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");let xe=Pe.get(E).__webglFramebuffer;if(E.isWebGLCubeRenderTarget&&ye!==void 0&&(xe=xe[ye],Array.isArray(xe)&&(xe=xe[0])),xe)if(N>=0&&N<=E.width-O&&W>=0&&W<=E.height-z){de.bindFramebuffer(U.FRAMEBUFFER,xe);let Te=E.textures[ce],ke=Te.format,$e=Te.type;E.textures.length>1&&U.readBuffer(U.COLOR_ATTACHMENT0+ce);let be=Wc(Te);if(be.__formatReadable===!1)throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in RGBA or implementation defined format.");if(be.__typeReadable===!1)throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in UnsignedByteType or implementation defined type.");let Ye=U.createBuffer();U.bindBuffer(U.PIXEL_PACK_BUFFER,Ye),U.bufferData(U.PIXEL_PACK_BUFFER,ue.byteLength,U.STREAM_READ),U.readPixels(N,W,O,z,se.convert(ke),se.convert($e),0),U.bindBuffer(U.PIXEL_PACK_BUFFER,null);let wt=te!==null?Pe.get(te).__webglFramebuffer:null;de.bindFramebuffer(U.FRAMEBUFFER,wt);let dt=U.fenceSync(U.SYNC_GPU_COMMANDS_COMPLETE,0);return U.flush(),await Yh(U,dt,4),U.bindBuffer(U.PIXEL_PACK_BUFFER,Ye),U.getBufferSubData(U.PIXEL_PACK_BUFFER,0,ue),U.bindBuffer(U.PIXEL_PACK_BUFFER,null),U.deleteBuffer(Ye),U.deleteSync(dt),ue}else throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: requested read bounds are out of range.")},this.copyFramebufferToTexture=function(E,N=null,W=0){let O=Math.pow(2,-W),z=Math.floor(E.image.width*O),ue=Math.floor(E.image.height*O),ye=N!==null?N.x:0,ce=N!==null?N.y:0;Oe.setTexture2D(E,0),U.copyTexSubImage2D(U.TEXTURE_2D,W,0,0,ye,ce,z,ue),de.unbindTexture()},this.copyTextureToTexture=function(E,N,W=null,O=null,z=0,ue=0){let ye,ce,xe,Te,ke,$e,be,Ye,wt,dt=E.isCompressedTexture?E.mipmaps[ue]:E.image;if(W!==null)ye=W.max.x-W.min.x,ce=W.max.y-W.min.y,xe=W.isBox3?W.max.z-W.min.z:1,Te=W.min.x,ke=W.min.y,$e=W.isBox3?W.min.z:0;else{let et=Math.pow(2,-z);ye=Math.floor(dt.width*et),ce=Math.floor(dt.height*et),E.isDataArrayTexture?xe=dt.depth:E.isData3DTexture?xe=Math.floor(dt.depth*et):xe=1,Te=0,ke=0,$e=0}O!==null?(be=O.x,Ye=O.y,wt=O.z):(be=0,Ye=0,wt=0);let ht=se.convert(N.format),Wt=se.convert(N.type),Se;N.isData3DTexture?(Oe.setTexture3D(N,0),Se=U.TEXTURE_3D):N.isDataArrayTexture||N.isCompressedArrayTexture?(Oe.setTexture2DArray(N,0),Se=U.TEXTURE_2D_ARRAY):(Oe.setTexture2D(N,0),Se=U.TEXTURE_2D),de.activeTexture(U.TEXTURE0),de.pixelStorei(U.UNPACK_FLIP_Y_WEBGL,N.flipY),de.pixelStorei(U.UNPACK_PREMULTIPLY_ALPHA_WEBGL,N.premultiplyAlpha),de.pixelStorei(U.UNPACK_ALIGNMENT,N.unpackAlignment);let en=de.getParameter(U.UNPACK_ROW_LENGTH),tt=de.getParameter(U.UNPACK_IMAGE_HEIGHT),Ni=de.getParameter(U.UNPACK_SKIP_PIXELS),Xt=de.getParameter(U.UNPACK_SKIP_ROWS),Lr=de.getParameter(U.UNPACK_SKIP_IMAGES);de.pixelStorei(U.UNPACK_ROW_LENGTH,dt.width),de.pixelStorei(U.UNPACK_IMAGE_HEIGHT,dt.height),de.pixelStorei(U.UNPACK_SKIP_PIXELS,Te),de.pixelStorei(U.UNPACK_SKIP_ROWS,ke),de.pixelStorei(U.UNPACK_SKIP_IMAGES,$e);let pi=E.isDataArrayTexture||E.isData3DTexture,Ui=N.isDataArrayTexture||N.isData3DTexture;if(E.isDepthTexture){let et=Pe.get(E),Gt=Pe.get(N),Cn=Pe.get(et.__renderTarget),_t=Pe.get(Gt.__renderTarget);de.bindFramebuffer(U.READ_FRAMEBUFFER,Cn.__webglFramebuffer),de.bindFramebuffer(U.DRAW_FRAMEBUFFER,_t.__webglFramebuffer);for(let Dt=0;Dt<xe;Dt++)pi&&(U.framebufferTextureLayer(U.READ_FRAMEBUFFER,U.COLOR_ATTACHMENT0,Pe.get(E).__webglTexture,z,$e+Dt),U.framebufferTextureLayer(U.DRAW_FRAMEBUFFER,U.COLOR_ATTACHMENT0,Pe.get(N).__webglTexture,ue,wt+Dt)),U.blitFramebuffer(Te,ke,Te+ye,ke+ce,be,Ye,be+ye,Ye+ce,U.DEPTH_BUFFER_BIT,U.NEAREST);de.bindFramebuffer(U.READ_FRAMEBUFFER,null),de.bindFramebuffer(U.DRAW_FRAMEBUFFER,null)}else if(z!==0||E.isRenderTargetTexture||Pe.has(E)){let et=Pe.get(E),Gt=Pe.get(N);de.bindFramebuffer(U.READ_FRAMEBUFFER,L),de.bindFramebuffer(U.DRAW_FRAMEBUFFER,V);for(let Cn=0;Cn<xe;Cn++)pi?U.framebufferTextureLayer(U.READ_FRAMEBUFFER,U.COLOR_ATTACHMENT0,et.__webglTexture,z,$e+Cn):U.framebufferTexture2D(U.READ_FRAMEBUFFER,U.COLOR_ATTACHMENT0,U.TEXTURE_2D,et.__webglTexture,z),Ui?U.framebufferTextureLayer(U.DRAW_FRAMEBUFFER,U.COLOR_ATTACHMENT0,Gt.__webglTexture,ue,wt+Cn):U.framebufferTexture2D(U.DRAW_FRAMEBUFFER,U.COLOR_ATTACHMENT0,U.TEXTURE_2D,Gt.__webglTexture,ue),z!==0?U.blitFramebuffer(Te,ke,Te+ye,ke+ce,be,Ye,be+ye,Ye+ce,U.COLOR_BUFFER_BIT,U.NEAREST):Ui?U.copyTexSubImage3D(Se,ue,be,Ye,wt+Cn,Te,ke,ye,ce):U.copyTexSubImage2D(Se,ue,be,Ye,Te,ke,ye,ce);de.bindFramebuffer(U.READ_FRAMEBUFFER,null),de.bindFramebuffer(U.DRAW_FRAMEBUFFER,null)}else Ui?E.isDataTexture||E.isData3DTexture?U.texSubImage3D(Se,ue,be,Ye,wt,ye,ce,xe,ht,Wt,dt.data):N.isCompressedArrayTexture?U.compressedTexSubImage3D(Se,ue,be,Ye,wt,ye,ce,xe,ht,dt.data):U.texSubImage3D(Se,ue,be,Ye,wt,ye,ce,xe,ht,Wt,dt):E.isDataTexture?U.texSubImage2D(U.TEXTURE_2D,ue,be,Ye,ye,ce,ht,Wt,dt.data):E.isCompressedTexture?U.compressedTexSubImage2D(U.TEXTURE_2D,ue,be,Ye,dt.width,dt.height,ht,dt.data):U.texSubImage2D(U.TEXTURE_2D,ue,be,Ye,ye,ce,ht,Wt,dt);de.pixelStorei(U.UNPACK_ROW_LENGTH,en),de.pixelStorei(U.UNPACK_IMAGE_HEIGHT,tt),de.pixelStorei(U.UNPACK_SKIP_PIXELS,Ni),de.pixelStorei(U.UNPACK_SKIP_ROWS,Xt),de.pixelStorei(U.UNPACK_SKIP_IMAGES,Lr),ue===0&&N.generateMipmaps===!0&&N.mipmapsAutoUpdate===!0&&U.generateMipmap(Se),de.unbindTexture()},this.initRenderTarget=function(E){Pe.get(E).__webglFramebuffer===void 0&&Oe.setupRenderTarget(E)},this.initTexture=function(E){E.isCubeTexture?Oe.setTextureCube(E,0):E.isData3DTexture?Oe.setTexture3D(E,0):E.isDataArrayTexture||E.isCompressedArrayTexture?Oe.setTexture2DArray(E,0):Oe.setTexture2D(E,0),de.unbindTexture()},this.resetState=function(){$=0,H=0,te=null,de.reset(),ae.reset()},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}get coordinateSystem(){return yn}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(e){this._outputColorSpace=e;let t=this.getContext();t.drawingBufferColorSpace=Ze._getDrawingBufferColorSpace(e),t.unpackColorSpace=Ze._getUnpackColorSpace()}};var Re={r:.4,h:1.8,eye:1.62,speed:8.6,accel:75,airAccel:24,decel:55,gravity:28,jump:8.6,dashSpeed:26,dashTime:.15,dashCd:1.2,rollbackSpan:3,rollbackCd:14,rollbackTime:.28,sudoTime:6,sudoPerKill:.04,maxHp:100,iframes:.45,waveHeal:20,hotGrace:.6,hotTick:.33,hotDmg:3},vr={coolDelay:.35,cool:.5,idleCool:.75,unlock:.25},Jt=[{id:"term",name:"SIGTERM",cmd:"kill -15",sig:15,color:[.22,1,.53],rate:9.5,dmg:11,pellets:1,spread:.005,bloom:.022,heat:.043,range:90,kick:.45,knock:1.2},{id:"kill",name:"SIGKILL",cmd:"kill -9",sig:9,color:[1,.69,0],rate:1.3,dmg:9,pellets:9,spread:.07,bloom:0,heat:.36,range:45,kick:2.4,knock:1.1,falloff:[8,26,.35]},{id:"grep",name:"grep",cmd:"grep -r",sig:0,color:[.3,.91,1],rate:1.05,dmg:95,pellets:1,spread:0,bloom:0,heat:.5,range:120,kick:1.6,knock:4,pierce:!0},{id:"rm",name:"rm -rf",cmd:"rm -rf",sig:0,color:[1,.3,.42],rate:1.1,dmg:120,pellets:0,spread:0,bloom:0,heat:.6,range:0,kick:2,knock:9,rocket:{speed:34,radius:4.6,selfMul:.3,life:4,impulse:13}}],Qe={zombie:{hp:32,speed:4.1,r:.45,h:1.8,dmg:9,reach:.9,atkCd:.9,mass:1,score:10,coffee:.07,name:"zombie",color:[.72,.86,.68]},fork:{hp:[56,24,10],speed:[3.6,5,6.4],r:[.75,.5,.32],h:[1.5,1,.64],dmg:[12,8,5],reach:.6,atkCd:.8,mass:1.2,score:12,coffee:.05,name:"forkbomb",color:[1,.45,.1]},cron:{hp:48,speed:4,r:.6,h:1.2,hover:3.5,period:3,tele:.45,volley:3,volleyGap:.13,shotSpeed:15,dmg:10,mass:1,score:25,coffee:.15,name:"crond",color:[1,.9,.2]},packet:{hp:5,speed:8.5,r:.24,h:.48,dmg:4,mass:.2,score:2,coffee:0,name:"syn",color:[.7,.95,1]},race:{hp:52,speed:7.4,r:.4,h:1.9,dmg:11,reach:.9,atkCd:.7,window:2.2,mass:.8,score:30,coffee:.12,name:"thread",color:[.35,.55,1],colorB:[1,.3,.6]},leak:{hp:45,hpGrow:12,speed:2.4,r:.5,h:1,grow:.11,rMax:2.1,fuse:1.3,dmg:38,radius:7.5,enemyDmg:150,mass:2,score:35,coffee:.35,name:"leak",color:[.8,.25,1]},heisen:{hp:72,speed:4.6,r:.5,h:1.8,aimTime:.22,blinkCd:1,shotCd:2.4,shotSpeed:22,dmg:14,mass:1,score:40,coffee:.2,name:"heisenbug",color:[.75,.6,1]},brute:{hp:420,speed:2.7,r:1,h:2.6,dmg:18,reach:1,atkCd:1.2,windup:.7,chargeSpeed:15,chargeTime:1.6,chargeDmg:28,recover:1.1,chargeCd:4,mass:8,score:120,coffee:2,name:"oom_reaper",color:[.9,.12,.15]},pylon:{hp:160,speed:0,r:.8,h:4,mass:1e9,score:50,coffee:0,name:"dependency",color:[.2,.9,.8]},boss:{hp:2600,speed:0,r:2,h:9,mass:1e9,score:2e3,coffee:0,name:"monolith",color:[1,.16,.24]}},HM=Object.keys(Qe),He={intro:3.5,ringEvery:[4.2,0,3],ringShots:24,ringSpeed:9,ringDmg:12,ringY:.45,addEvery:9,addCap:10,beams:[0,2,3],beamSpeed:[0,.5,.7],beamLen:30,beamY:.45,beamDmg:18,beamHitCd:.6,fanEvery:2.6,fanShots:5,fanSpeed:17,fanDmg:11,phase3At:.5,deathTime:4.5,deps:["libssl.so.0.9.8","log4j-1.2.jar","left-pad","jquery-1.4.min.js","python2.6","flash-player"]},pn={3:{name:"SEV3",label:"chill",count:.85,dmg:.7,hp:.9,speed:.95},2:{name:"SEV2",label:"normal",count:1.1,dmg:1.25,hp:1,speed:1.04},1:{name:"SEV1",label:"hurt me",count:1.3,dmg:1.75,hp:1.15,speed:1.1}},cc=[{host:"node-3",name:"userspace",music:"act1",accent:[.22,1,.53],fog:[.008,.026,.018]},{host:"mq-broker-1",name:"the queue",music:"act2",accent:[1,.69,0],fog:[.032,.02,.006]},{host:"pg-primary",name:"the database",music:"act3",accent:[.3,.72,1],fog:[.008,.018,.04]},{host:"legacy-01",name:"the monolith",music:"boss",accent:[1,.2,.3],fog:[.04,.007,.012]}],ve=(i,e,t,n)=>({t:i,type:e,n:t,gap:n}),Et=[{inc:2031,sev:3,act:0,title:"zombie processes on node-3",voice:"w1",groups:[ve(0,"zombie",6),ve(8,"zombie",8),ve(18,"zombie",10),ve(28,"zombie",12)]},{inc:2032,sev:3,act:0,title:"fork bomb in ci-runner-7",voice:"w2",unlock:1,groups:[ve(0,"fork",2),ve(3,"zombie",8),ve(12,"fork",3),ve(20,"zombie",10),ve(28,"fork",2),ve(30,"zombie",8)]},{inc:2033,sev:2,act:0,title:"cron storm at 03:15",voice:"w3",groups:[ve(0,"cron",3),ve(3,"zombie",10),ve(12,"fork",2),ve(18,"cron",4),ve(22,"zombie",10),ve(30,"brute",1),ve(34,"cron",3)]},{inc:2034,sev:2,act:1,title:"DDoS on the ingress",voice:"w4",unlock:2,groups:[ve(0,"packet",20,.12),ve(5,"zombie",8),ve(10,"packet",24,.12),ve(16,"cron",3),ve(22,"packet",28,.1),ve(24,"fork",3),ve(32,"packet",30,.1),ve(34,"zombie",10)]},{inc:2035,sev:2,act:1,title:"race condition in order-worker",voice:"w5",groups:[ve(0,"race",1),ve(3,"zombie",10),ve(12,"race",2),ve(18,"packet",20,.12),ve(24,"race",2),ve(26,"fork",2),ve(34,"race",2),ve(35,"zombie",8)]},{inc:2036,sev:2,act:1,title:"memory leak in session-cache",voice:"w6",groups:[ve(0,"leak",2),ve(2,"zombie",10),ve(10,"leak",3),ve(14,"fork",3),ve(20,"race",1),ve(24,"leak",3),ve(26,"cron",3),ve(32,"brute",1),ve(36,"leak",2),ve(37,"zombie",10)]},{inc:2037,sev:2,act:2,title:"heisenbug in replica-2",voice:"w7",unlock:3,groups:[ve(0,"heisen",2),ve(3,"zombie",12),ve(10,"cron",3),ve(16,"heisen",3),ve(20,"packet",24,.12),ve(26,"fork",3),ve(32,"heisen",2),ve(34,"zombie",12)]},{inc:2038,sev:1,act:2,title:"cascading failure",voice:"w8",groups:[ve(0,"fork",3),ve(2,"leak",3),ve(8,"race",2),ve(12,"cron",4),ve(16,"zombie",14),ve(22,"packet",30,.1),ve(28,"heisen",3),ve(32,"brute",1),ve(36,"zombie",12),ve(40,"leak",2)]},{inc:2039,sev:1,act:2,title:"everything is on fire",voice:"w9",groups:[ve(0,"brute",1),ve(1,"zombie",14),ve(7,"leak",3),ve(10,"cron",4),ve(15,"race",3),ve(19,"fork",4),ve(24,"heisen",3),ve(28,"packet",36,.1),ve(33,"brute",1),ve(36,"zombie",16),ve(40,"cron",4),ve(44,"race",2)]},{inc:2040,sev:1,act:3,title:"legacy-billing-monolith.jar",voice:"boss",boss:!0,groups:[]}],Du=48,Rs=[{id:"autoscale",name:"autoscaling",desc:"+25 max error budget, refill 25",max:3},{id:"cache",name:"caching layer",desc:"-22% heat on every shot",max:3},{id:"gc",name:"garbage collector",desc:"every kill restores 0.5 budget",max:2},{id:"canary",name:"canary release",desc:"first shot after 1.5 s of silence hits x3",max:1},{id:"lb",name:"load balancer",desc:"SIGKILL fires +3 pellets",max:2},{id:"retry",name:"retry with backoff",desc:"20% of shots cost no heat",max:2},{id:"bluegreen",name:"blue/green deploy",desc:"rollback cooldown -35%",max:2},{id:"breaker",name:"circuit breaker",desc:"once per incident: survive a lethal hit, emit a shockwave",max:1},{id:"cdn",name:"CDN",desc:"+12% move speed, dash recharges 25% faster",max:2},{id:"tracing",name:"distributed tracing",desc:"grep hits 40% harder",max:2},{id:"chaos",name:"chaos engineering",desc:"explosions +30% radius, no self-damage",max:1},{id:"overprov",name:"over-provisioning",desc:"+15% damage, all weapons",max:3},{id:"espresso",name:"espresso machine",desc:"coffee drops twice as often, heals +50%",max:1},{id:"policy",name:"error budget policy",desc:"sudo charges 40% faster, lasts +2 s",max:2}],Cs={heal:12,life:25,magnet:2.6,r:.9},Nu=3.5;function wo(i){let e=i>>>0,t=()=>{e=e+1831565813>>>0;let n=e;return n=Math.imul(n^n>>>15,n|1),n^=n+Math.imul(n^n>>>7,n|61),((n^n>>>14)>>>0)/4294967296};return{next:t,range:(n,s)=>n+(s-n)*t(),int:n=>t()*n|0,pick:n=>n[t()*n.length|0],sign:()=>t()<.5?-1:1}}var kt=(i,e,t)=>i<e?e:i>t?t:i,Uu=(i,e,t)=>i+(e-i)*t,Zi=(i,e)=>{let t=(i-e)%(Math.PI*2);return t>Math.PI?t-=Math.PI*2:t<-Math.PI&&(t+=Math.PI*2),t};var Ai="##########################",we="#........................#",wx=[[Ai,we,we,we,"#..RRRR..RRRR..RRRR..RR..#",we,we,we,we,"#..RR..RRRR....RRRR..RR..#",we,we,we,"#............P...........#",we,we,"#..RR..RRRR....RRRR..RR..#",we,we,we,we,"#..RR..RRRR..RRRR..RRRR..#",we,we,we,Ai],[Ai,we,we,we,"#...RR.....RR.....RR.....#","#...RR.....RR.....RR.....#",we,we,"#.RRR................RRR.#",we,"#.......RR......RR.......#","#.......RR......RR.......#",we,"#............P...........#","#.......RR......RR.......#","#.......RR......RR.......#",we,"#.RRR................RRR.#",we,we,"#.....RR.....RR.....RR...#","#.....RR.....RR.....RR...#",we,we,we,Ai],[Ai,we,we,we,we,"#....RRRR........RRRR....#","#....R..............R....#","#....R..............R....#",we,we,"#.........RR..RR.........#","#.........R....R.........#",we,"#............P...........#","#.........R....R.........#","#.........RR..RR.........#",we,we,"#....R..............R....#","#....R..............R....#","#....RRRR........RRRR....#",we,we,we,we,Ai],[Ai,we,we,we,"#...Y........y.......Y...#",we,we,we,"#.......RR......RR.......#",we,we,we,"#............B...........#",we,we,we,we,"#.......RR......RR.......#",we,we,we,"#...Y.......y........Y...#","#............P...........#",we,we,Ai]],Co=32767;function ku(i){let e=wx[i],t=e.length,n=e[0].length,s={map:i,w:n,h:t,ox:-n*2/2,oz:-t*2/2,kind:new Uint8Array(n*t),top:new Float64Array(n*t),dist:new Int16Array(n*t).fill(Co),free:[],start:{x:0,z:0},boss:null,pylons:[],pylons2:[],queue:new Int32Array(n*t)};for(let r=0;r<t;r++)for(let a=0;a<n;a++){let o=e[r][a],l=r*n+a,c=s.ox+(a+.5)*2,h=s.oz+(r+.5)*2;if(o==="#"){s.kind[l]=2,s.top[l]=1e3;continue}if(o==="R"){s.kind[l]=1,s.top[l]=2.8;continue}s.free.push(l),o==="P"?s.start={x:c,z:h}:o==="B"?s.boss={x:c,z:h}:o==="Y"?s.pylons.push({x:c,z:h}):o==="y"&&s.pylons2.push({x:c,z:h})}return s}var Ps=(i,e,t)=>{let n=Math.floor((e-i.ox)/2),s=Math.floor((t-i.oz)/2);return n<0||s<0||n>=i.w||s>=i.h?-1:s*i.w+n},To=(i,e)=>i.ox+(e%i.w+.5)*2,Eo=(i,e)=>i.oz+((e/i.w|0)+.5)*2,Ao=(i,e,t)=>e<0||t<0||e>=i.w||t>=i.h?1e3:i.top[t*i.w+e];function zu(i,e,t,n,s){let r=Math.floor((e-n-i.ox)/2),a=Math.floor((e+n-i.ox)/2),o=Math.floor((t-n-i.oz)/2),l=Math.floor((t+n-i.oz)/2),c=0;for(let h=o;h<=l;h++)for(let f=r;f<=a;f++){let u=Ao(i,f,h);u>c&&u<=s+.3&&(c=u)}return c}function Po(i,e,t,n,s,r){let a=!1,o=Math.max(1,Math.ceil(Math.hypot(t,n)/(s*.8))),l=t/o,c=n/o,h=r+.3;for(let f=0;f<o;f++){e.x+=l,e.z+=c;let u=Math.floor((e.x-s-i.ox)/2),p=Math.floor((e.x+s-i.ox)/2),d=Math.floor((e.z-s-i.oz)/2),_=Math.floor((e.z+s-i.oz)/2);for(let m=d;m<=_;m++)for(let g=u;g<=p;g++){if(Ao(i,g,m)<=h)continue;let y=i.ox+g*2,v=i.oz+m*2,M=e.x<y?y:e.x>y+2?y+2:e.x,b=e.z<v?v:e.z>v+2?v+2:e.z,w=e.x-M,x=e.z-b,S=w*w+x*x;if(!(S>=s*s))if(a=!0,S>1e-10){let P=Math.sqrt(S),R=(s-P)/P;e.x+=w*R,e.z+=x*R}else{let R=[[e.x-y,-1,0],[y+2-e.x,1,0],[e.z-v,0,-1],[v+2-e.z,0,1]].filter(C=>Ao(i,g+C[1],m+C[2])<=h).sort((C,D)=>C[0]-D[0])[0];R&&(R[1]?e.x=R[1]<0?y-s:y+2+s:e.z=R[2]<0?v-s:v+2+s)}}}return a}function An(i,e,t,n,s,r,a,o,l){let c=Math.floor((e-i.ox)/2),h=Math.floor((n-i.oz)/2),f=s>0?1:-1,u=a>0?1:-1,p=Math.abs(s),d=Math.abs(a),_=p>1e-9?2/p:1/0,m=d>1e-9?2/d:1/0,g=p>1e-9?(s>0?i.ox+(c+1)*2-e:e-(i.ox+c*2))/p:1/0,y=d>1e-9?(a>0?i.oz+(h+1)*2-n:n-(i.oz+h*2))/d:1/0,v=r<-1e-9?-t/r:1/0,M=0,b=0,w=0;for(let x=0;x<256;x++){let S=Ao(i,c,h),P=g<y?g:y;if(S>0){if(t+r*M<S){if(M>o)break;return l&&(l.hit=2,l.nx=b,l.ny=0,l.nz=w),M}if(r<0){let R=(S-t)/r;if(R>=M&&R<=P){if(R>o)break;return l&&(l.hit=3,l.nx=0,l.ny=1,l.nz=0),R}}}else if(v<=P){if(v>o)break;return l&&(l.hit=1,l.nx=0,l.ny=1,l.nz=0),v}if(P>=o)break;g<y?(c+=f,M=g,g+=_,b=-f,w=0):(h+=u,M=y,y+=m,b=0,w=-u)}return l&&(l.hit=0),o}function Io(i,e,t,n,s,r=1.2){let a=n-e,o=s-t,l=Math.hypot(a,o);return l<1e-6?!0:An(i,e,r,t,a/l,0,o/l,l,null)>=l-1e-6}var Ro=[[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]];function Lo(i,e,t){let{w:n,h:s,kind:r,dist:a,queue:o}=i;a.fill(Co);let l=Ps(i,e,t);if(l<0||r[l]!==0){let f=-1,u=1/0;for(let p of i.free){let d=(To(i,p)-e)**2+(Eo(i,p)-t)**2;d<u&&(u=d,f=p)}l=f}let c=0,h=0;for(a[l]=0,o[h++]=l;c<h;){let f=o[c++],u=a[f]+1,p=f%n,d=f/n|0;for(let _=0;_<4;_++){let m=p+Ro[_][0],g=d+Ro[_][1];if(m<0||g<0||m>=n||g>=s)continue;let y=g*n+m;r[y]!==0||a[y]<=u||(a[y]=u,o[h++]=y)}}i.flowCell=l}function Bu(i,e,t,n,s,r){let a=Ps(i,e,t),o=n,l=s;if(a>=0&&i.dist[a]!==Co&&i.dist[a]>0){let u=a%i.w,p=a/i.w|0,d=i.dist[a],_=-1,m=1/0;for(let g=0;g<8;g++){let y=u+Ro[g][0],v=p+Ro[g][1];if(y<0||v<0||y>=i.w||v>=i.h)continue;let M=v*i.w+y,b=i.dist[M];if(b>=d||g>=4&&(i.kind[p*i.w+y]!==0||i.kind[v*i.w+u]!==0))continue;let w=To(i,M),x=Eo(i,M),S=b*1e3+Math.hypot(w-n,x-s);S<m&&(_=M,m=S)}_>=0&&(o=To(i,_),l=Eo(i,_))}let c=o-e,h=l-t,f=Math.hypot(c,h);return f<1e-6?(r.x=0,r.z=0):(r.x=c/f,r.z=h/f),r}function Do(i,e,t,n,s,r,a){let o=i.start.x,l=i.start.z;for(let c=0;c<40;c++){let h=i.free[e.int(i.free.length)];if(i.dist[h]===Co)continue;o=To(i,h),l=Eo(i,h);let f=Math.hypot(o-t,l-n);if(f>=s&&f<=r)break}return a.x=o,a.z=l,a}function Gu(i,e,t){let n=i.w*2/2-2-t,s=i.h*2/2-2-t;e.x=e.x<-n?-n:e.x>n?n:e.x,e.z=e.z<-s?-s:e.z>s?s:e.z}function Vu(){return{x:0,y:0,z:0,vx:0,vy:0,vz:0,yaw:0,pitch:0,hp:Re.maxHp,maxHp:Re.maxHp,dead:!1,invuln:0,onGround:!0,coyote:0,jumpBuf:0,dashT:0,dashCd:0,dashDx:0,dashDz:0,hist:[],histT:0,rewind:0,rollbackCd:0,sudo:0,sudoT:0,hotT:0,hotTick:0,idleT:0,lastCause:"",weapon:0,unlocked:[!0,!1,!1,!1],heat:[0,0,0,0],locked:[!1,!1,!1,!1],sinceShot:[9,9,9,9],fireCd:0,switchT:0,bloom:0,idleFire:9,perks:{},speedMul:1,heatMul:1,dmgMul:1,dashCdMul:1,rollbackCdMul:1,sudoGain:1,sudoBonus:0,pellets:0,grepMul:1,blastMul:1,noSelf:!1,gcHeal:0,coffeeMul:1,coffeeRate:1,breakerReady:!1,canary:!1,retry:0}}function Hu(i,e,t){let n=i.player,s=i.world;if(n.yaw+=e.dyaw,n.pitch=kt(n.pitch+e.dpitch,-1.5,1.5),n.dead)return;if(n.invuln-=t,n.dashCd-=t,n.rollbackCd-=t,n.jumpBuf-=t,n.coyote-=t,n.sudoT>0&&(n.sudoT-=t,n.sudoT<=0&&i.events.push({t:"sudoEnd"})),n.rewind>0){n.rewind-=t;let d=n.hist.length-1,_=kt(n.rewind/Re.rollbackTime,0,1)*d,m=Math.floor(_),g=_-m,y=n.hist[m],v=n.hist[Math.min(d,m+1)];if(n.x=y.x+(v.x-y.x)*g,n.y=y.y+(v.y-y.y)*g,n.z=y.z+(v.z-y.z)*g,n.rewind<=0){let M=n.hist[0];n.x=M.x,n.y=M.y,n.z=M.z,n.vx=n.vy=n.vz=0,n.hp=Math.max(n.hp,M.hp),n.heat.fill(0),n.locked.fill(!1),n.hist.length=0,n.histT=0,n.invuln=.4,i.events.push({t:"rollbackEnd"})}return}if(e.rollback&&n.rollbackCd<=0&&n.hist.length>=8){n.hist.push({x:n.x,y:n.y,z:n.z,hp:n.hp}),n.rewind=Re.rollbackTime,n.rollbackCd=Re.rollbackCd*n.rollbackCdMul,n.invuln=Re.rollbackTime+.4,n.dashT=0,i.stats.rollbacks++,i.events.push({t:"rollback",gain:Math.max(0,n.hist[0].hp-n.hp)});return}e.sudo&&n.sudo>=1&&n.sudoT<=0&&(n.sudoT=Re.sudoTime+n.sudoBonus,n.sudo=0,n.heat.fill(0),n.locked.fill(!1),i.stats.sudos++,i.events.push({t:"sudo"}));let r=Math.sin(n.yaw),a=Math.cos(n.yaw),o=e.mx*a-e.mz*r,l=-e.mx*r-e.mz*a,c=Math.hypot(o,l);if(c>1&&(o/=c,l/=c),n.idleT=c>.05||e.fire?0:n.idleT+t,e.dash&&n.dashCd<=0&&n.dashT<=0){c>.1?(n.dashDx=o/Math.min(c,1),n.dashDz=l/Math.min(c,1)):(n.dashDx=-r,n.dashDz=-a);let d=Math.hypot(n.dashDx,n.dashDz);n.dashDx/=d,n.dashDz/=d,n.dashT=Re.dashTime,n.dashCd=Re.dashCd*n.dashCdMul,n.invuln=Math.max(n.invuln,Re.dashTime+.05),i.stats.dashes++,i.events.push({t:"dash"})}if(n.dashT>0)n.vx=n.dashDx*Re.dashSpeed,n.vz=n.dashDz*Re.dashSpeed,n.vy<0&&(n.vy=0),n.dashT-=t,n.dashT<=0&&(n.vx*=.42,n.vz*=.42);else{let d=Re.speed*n.speedMul,_=n.onGround?c>.05?Re.accel:Re.decel:c>.05?Re.airAccel:1.5,m=o*d-n.vx,g=l*d-n.vz,y=Math.hypot(m,g);if(y>1e-6){let v=Math.min(1,_*t/y);n.vx+=m*v,n.vz+=g*v}n.vy-=Re.gravity*t}(e.jumpPressed||e.jump&&n.onGround)&&(n.jumpBuf=.12),n.onGround&&(n.coyote=.1),n.jumpBuf>0&&n.coyote>0&&(n.vy=Re.jump,n.onGround=!1,n.coyote=0,n.jumpBuf=0,i.events.push({t:"jump"}));let h=n.x,f=n.z,u=n.y;Po(s,n,n.vx*t,n.vz*t,Re.r,n.y)&&t>0&&(n.vx=(n.x-h)/t,n.vz=(n.z-f)/t),n.y+=n.vy*t;let p=zu(s,n.x,n.z,Re.r,Math.max(u,n.y));n.y<=p&&n.vy<=0?(!n.onGround&&n.vy<-7&&i.events.push({t:"land",v:-n.vy}),n.y=p,n.vy=0,n.onGround=!0):n.onGround=!1,n.onGround&&n.y>1?(n.hotT+=t,i.stats.hotTime+=t,n.hotT>Re.hotGrace&&(n.hotTick-=t,n.hotTick<=0&&(n.hotTick=Re.hotTick,n.hotT-t<=Re.hotGrace+Re.hotTick&&i.events.push({t:"voice",id:"hot"}),kn(i,Re.hotDmg,n.x,n.z,"the hot aisle",!0)))):(n.hotT=0,n.hotTick=0),n.histT-=t,n.histT<=0&&(n.histT=.1,n.hist.push({x:n.x,y:n.y,z:n.z,hp:n.hp}),n.hist.length>Re.rollbackSpan*10&&n.hist.shift())}function kn(i,e,t,n,s,r=!1,a=!1){let o=i.player;if(o.dead||i.god||i.over||!r&&o.invuln>0)return!1;a||(e*=pn[i.sev].dmg);let l=o.hp/o.maxHp;o.hp-=e,r||(o.invuln=Re.iframes);let c=i.stats;c.damageTaken+=e,c.byCause[s]=(c.byCause[s]||0)+e,o.lastCause=s;let h=t-o.x,f=n-o.z,u=Math.sin(o.yaw),p=Math.cos(o.yaw),d=Math.atan2(h*p-f*u,-h*u-f*p);i.events.push({t:"hurt",dmg:e,ang:d,cause:s,dot:r});let _=o.hp/o.maxHp;return l>.5&&_<=.5&&_>.25&&i.events.push({t:"voice",id:"budget50"}),l>.25&&_<=.25&&o.hp>0&&i.events.push({t:"voice",id:"budget25"}),o.hp<=0&&(o.breakerReady?(o.breakerReady=!1,o.hp=20,o.invuln=1.5,i.pendingBlast={x:o.x,y:o.y+.9,z:o.z},i.events.push({t:"breaker"})):(o.hp=0,o.dead=!0,i.over="dead",i.events.push({t:"dead",cause:s}))),!0}function Is(i,e,t){let n=i.player,s=n.hp;n.hp=Math.min(n.maxHp,n.hp+e),n.hp>s&&i.events.push({t:"heal",amount:n.hp-s,why:t})}var Mr=Math.PI*2,yt={x:0,z:0},_r=(i,e)=>Array.isArray(i)?i[e]:i,hi=i=>!i.dead&&i.state!=="down"&&i.spawnT<=0;function Uo(i,e,t,n,s,r,a,o,l,c,h){let f=i-a,u=t-l,p=n*n+r*r,d=-1/0,_=1/0;if(p>1e-12){let m=f*n+u*r,g=m*m-p*(f*f+u*u-c*c);if(g<0)return-1;let y=Math.sqrt(g);d=(-m-y)/p,_=(-m+y)/p}else if(f*f+u*u>c*c)return-1;if(Math.abs(s)>1e-12){let m=(o-e)/s,g=(o+h-e)/s;if(m>g){let y=m;m=g,g=y}m>d&&(d=m),g<_&&(_=g)}else if(e<o||e>o+h)return-1;return _<d||_<0?-1:d>0?d:0}function Jn(i,e,t,n,s={}){let r=Qe[e],a=s.gen||0,o=i.rng,l=_r(r.hp,a)*pn[i.sev].hp*i.hpMul,c=_r(r.speed,a)*pn[i.sev].speed*o.range(.88,1.12),h={id:++i.nextId,type:e,x:t,y:0,z:n,vx:0,vz:0,kx:0,kz:0,yaw:o.range(0,Mr),hp:l,maxHp:l,r:_r(r.r,a),h:_r(r.h,a),speed:c,dmg:_r(r.dmg,a)||0,mass:r.mass,gen:a,state:"run",t:0,cd:0,cd2:0,atkT:0,flash:0,dead:!1,spawnT:s.instant?0:.6,seed:o.next(),twin:0,variant:0,name:r.name,orbit:o.sign(),tele:!1,vol:0,volT:0,aimT:0,blinkCd:0,dirx:0,dirz:0,shield:!1,phase:0,ringT:0,ringN:0,addT:0,fanT:0,beamA:0,beamN:0,beamLen:[0,0,0],beamHitCd:0,boomT:0};return e==="cron"?(h.y=r.hover,h.t=o.range(0,r.period*.5)):e==="packet"?h.y=.9:e==="heisen"?h.cd=o.range(1.2,r.shotCd):e==="brute"?h.cd2=2.5:e==="pylon"?(h.spawnT=1,h.name=s.name||r.name):e==="boss"&&(h.state="intro",h.shield=!0,h.phase=1,h.spawnT=0,h.ringT=2.5,h.addT=4,h.fanT=2,h.yaw=0),i.enemies.push(h),i.events.push({t:"spawn",id:h.id,type:e,x:t,y:h.y,z:n}),h}function Xu(i,e,t,n,s,r,a,o,l,c){i.shots.push({x:e,y:t,z:n,vx:s,vy:r,vz:a,dmg:o,cause:l,kind:c,r:c===2?.25:.22,life:7})}function uc(i,e,t,n,s,r,a,o,l=0,c=0){let h=i.player,f=c*Math.hypot(h.x-e,h.z-n)/s,u=h.x+h.vx*f-e,p=h.y+1-t,d=h.z+h.vz*f-n;if(l){let m=Math.cos(l),g=Math.sin(l),y=u*m-d*g;d=u*g+d*m,u=y}let _=Math.hypot(u,p,d)||1;Xu(i,e,t,n,u/_*s,p/_*s,d/_*s,r,a,o)}function qu(i,e){let t=i.player,n=i.world,s=i.shots,r=0;for(let a=0;a<s.length;a++){let o=s[a];o.x+=o.vx*e,o.y+=o.vy*e,o.z+=o.vz*e,o.life-=e;let l=Ps(n,o.x,o.z);if(o.life<=0||l<0||o.y<0||o.y<n.top[l]){o.life>0&&i.events.push({t:"shotHit",x:o.x,y:o.y,z:o.z,kind:o.kind});continue}let c=kt(o.y,t.y+.25,t.y+Re.h-.2);if(Math.hypot(o.x-t.x,o.y-c,o.z-t.z)<o.r+Re.r&&kn(i,o.dmg,o.x-o.vx,o.z-o.vz,o.cause)){i.events.push({t:"shotHit",x:o.x,y:o.y,z:o.z,kind:o.kind});continue}s[r++]=o}s.length=r}function pc(i,e,t,n){return hi(e)?e.type==="boss"&&(e.shield||e.state!=="fight")?(i.events.push({t:"deflect",x:n.hx??e.x,y:n.hy??4,z:n.hz??e.z}),!1):(e.state==="stun"&&(t*=1.5),e.hp-=t,e.flash=.12,(n.kx||n.kz)&&(e.kx+=n.kx/e.mass,e.kz+=n.kz/e.mass),i.stats.damage+=t,i.events.push({t:"hit",id:e.id,type:e.type,x:n.hx??e.x,y:n.hy??e.y+e.h*.6,z:n.hz??e.z,dmg:t,kill:e.hp<=0,src:n.src}),e.hp<=0&&dc(i,e,n),!0):!1}function No(i,e,t){let n=i.player,s=Qe[e.type],r=i.stats;e.dead=!0;let a=t.src==="purge"||t.src==="detonate"||t.src==="pop";a||(r.kills[e.type]=(r.kills[e.type]||0)+1,r.killsTotal++,t.src==="oom"&&r.collateral++,i.combo++,i.comboT=Nu,i.combo>r.bestCombo&&(r.bestCombo=i.combo),(i.combo===10||i.combo===25||i.combo===50)&&i.events.push({t:"combo",n:i.combo}),i.score+=Math.round(s.score*(1+Math.min(i.combo,50)*.04)),n.sudoT<=0&&n.sudo<1&&(n.sudo=Math.min(1,n.sudo+.035*Math.sqrt(s.score/10)*n.sudoGain),n.sudo>=1&&i.events.push({t:"sudoReady"})),n.gcHeal&&Is(i,n.gcHeal,"gc"),i.rng.next()<s.coffee*n.coffeeRate&&i.pickups.push({x:e.x,y:e.y+.6,z:e.z,vy:4.5,t:Cs.life})),i.events.push({t:"kill",id:e.id,type:e.type,name:e.name,x:e.x,y:e.y,z:e.z,r:e.r,h:e.h,src:t.src,combo:i.combo,gen:e.gen,variant:e.variant,quiet:a})}function dc(i,e,t){if(e.dead)return;let n=i.enemies;if(e.type==="boss"){if(e.state==="dying")return;e.state="dying",e.t=0,e.hp=0,e.shield=!1;for(let s of n)s!==e&&!s.dead&&No(i,s,{src:"purge"});i.shots.length=0,i.events.push({t:"bossDying",x:e.x,z:e.z});return}if(e.type==="race"&&t.src!=="purge"){let s=n.find(r=>r.id===e.twin&&!r.dead);if(s&&s.state!=="down"){e.state="down",e.hp=0,e.t=Qe.race.window,e.vx=e.vz=e.kx=e.kz=0,i.events.push({t:"raceDown",id:e.id,twin:s.id,x:e.x,y:e.y,z:e.z});return}s&&No(i,s,t)}if(No(i,e,t),e.type==="fork"&&e.gen<2&&t.src!=="purge"){for(let s of[-1,1]){let r=i.rng.range(0,Mr),a=Jn(i,"fork",e.x+Math.cos(r)*.3*s,e.z+Math.sin(r)*.3*s,{gen:e.gen+1,instant:!0});a.kx=Math.cos(r)*7*s,a.kz=Math.sin(r)*7*s,a.cd=.6}i.events.push({t:"split",x:e.x,y:e.y+e.h*.5,z:e.z,gen:e.gen})}else if(e.type==="pylon"){let s=n.find(r=>r.type==="boss"&&!r.dead);s&&!n.some(r=>r.type==="pylon"&&!r.dead)&&(s.shield=!1,s.phase===1&&(s.phase=2,s.fanT=1.5),i.events.push({t:"shieldDown",x:s.x,z:s.z,phase:s.phase}))}}function br(i,e,t,n,s,r,a){let o=i.player,l=i.enemies;i.events.push({t:"explode",x:e,y:t,z:n,radius:s,kind:a.kind});let c=a.enemyDmg??r,h=a.impulse??9,f=0;for(let g=0,y=l.length;g<y;g++){let v=l[g];if(!hi(v))continue;let M=v.x-e,b=v.z-n,w=Math.hypot(M,b),x=Math.hypot(Math.max(0,w-v.r),t-kt(t,v.y,v.y+v.h));if(x>s)continue;let S=1-.65*x/s,P=w>1e-6?h*S/w:0;pc(i,v,c*S,{src:a.src,kx:M*P,kz:b*P})&&f++}let u=o.x-e,p=o.y+.9-t,d=o.z-n,_=Math.hypot(u,p,d),m=Math.max(0,_-Re.r);if(m<s&&(a.self||a.playerDmg)){let g=1-.65*m/s;if(a.self){o.noSelf||kn(i,r*a.self*g,e,n,"your own rm -rf",!1,!0);let y=_>1e-6?h*g/_:0;o.vx+=u*y,o.vz+=d*y,o.vy=Math.max(o.vy,0)+Math.max(.35*h*g,p*y),o.onGround=!1}else kn(i,a.playerDmg*g,e,n,a.cause)}return f}function yr(i,e){let t=i.player,n=t.x-e.x,s=t.z-e.z,r=Math.hypot(n,s);return r<1e-6?(yt.x=0,yt.z=0,0):(r<2.5||Io(i.world,e.x,e.z,t.x,t.z,.5)?(yt.x=n/r,yt.z=s/r):Bu(i.world,e.x,e.z,t.x,t.z,yt),r)}function Zn(i,e,t,n,s,r=12){let a=Math.min(1,r*s);i.vx+=(e*n-i.vx)*a,i.vz+=(t*n-i.vz)*a,(e||t)&&(i.yaw+=kt(Zi(Math.atan2(-e,-t),i.yaw),-9*s,9*s))}function zn(i,e,t,n=!1){let s=Math.exp(-5*t);e.kx*=s,e.kz*=s;let r=(e.vx+e.kx)*t,a=(e.vz+e.kz)*t;return n?(e.x+=r,e.z+=a,Gu(i.world,e,e.r),!1):Po(i.world,e,r,a,e.r,0)}function fc(i,e,t,n){let s=i.player,r=Qe[e.type],a=e.r+Re.r+r.reach,o=Math.abs(s.y-e.y)<1.6;e.atkT>0?(e.atkT-=n,e.atkT<=0&&(e.cd=r.atkCd,t<a+.35&&o&&kn(i,e.dmg,e.x,e.z,e.name))):t<a&&o&&e.cd<=0&&(e.atkT=.26,i.events.push({t:"windup",id:e.id}))}function Wu(i,e,t){let n=yr(i,e);Zn(e,yt.x,yt.z,e.atkT>0?0:e.speed,t),zn(i,e,t),fc(i,e,n,t)}var Tx={zombie:Wu,fork:Wu,packet(i,e,t){let n=i.player,s=yr(i,e),r=Math.sin(i.t*6+e.seed*40)*.55,a=yt.x-yt.z*r,o=yt.z+yt.x*r,l=Math.hypot(a,o)||1;Zn(e,a/l,o/l,e.speed,t,6),zn(i,e,t),e.y=.9+Math.sin(i.t*5+e.seed*30)*.25,s<e.r+Re.r+.2&&n.y<e.y+e.h+.3&&n.y+Re.h>e.y&&(kn(i,e.dmg,e.x,e.z,"a SYN flood"),dc(i,e,{src:"pop"}))},cron(i,e,t){let n=i.player,s=Qe.cron,r=n.x-e.x,a=n.z-e.z,o=Math.hypot(r,a)||1,l=kt((o-11)/4,-1,1),c=r/o*l-a/o*e.orbit*.7,h=a/o*l+r/o*e.orbit*.7,f=Math.hypot(c,h)||1;Zn(e,c/f,h/f,e.speed,t,3),e.yaw=Math.atan2(-r,-a),zn(i,e,t,!0),e.y=s.hover+Math.sin(i.t*1.7+e.seed*9)*.3,e.t+=t,!e.tele&&e.t>=s.period-s.tele&&(e.tele=!0,i.events.push({t:"cronTele",id:e.id,x:e.x,y:e.y,z:e.z})),e.t>=s.period&&(e.t-=s.period,e.tele=!1,e.vol=s.volley,e.volT=0),e.vol>0&&(e.volT-=t)<=0&&(e.volT=s.volleyGap,e.vol--,uc(i,e.x,e.y+.3,e.z,s.shotSpeed,e.dmg,"a cron job",0,0,[.5,1,0][e.vol]),i.events.push({t:"enemyShot",kind:0,x:e.x,y:e.y,z:e.z}))},race(i,e,t){if(e.state==="down"){(e.t-=t)<=0&&(e.state="run",e.hp=e.maxHp,e.spawnT=.35,i.stats.revived++,i.events.push({t:"raceRevive",id:e.id,x:e.x,y:e.y,z:e.z}));return}let n=yr(i,e),s=Math.sin(i.t*3.1+e.seed*20)*.9*kt((n-3)/6,0,1),r=yt.x-yt.z*s,a=yt.z+yt.x*s,o=Math.hypot(r,a)||1;Zn(e,r/o,a/o,e.atkT>0?0:e.speed,t,9),zn(i,e,t),fc(i,e,n,t)},leak(i,e,t){let n=Qe.leak;if(e.state==="oom"){Zn(e,0,0,0,t),zn(i,e,t),(e.t-=t)<=0&&(dc(i,e,{src:"detonate"}),br(i,e.x,e.h*.5,e.z,n.radius,0,{src:"oom",kind:"oom",enemyDmg:n.enemyDmg,playerDmg:e.dmg,cause:"a memory leak"}));return}yr(i,e),e.r=Math.min(n.rMax,e.r+n.grow*t),e.h=e.r*2,e.hp+=n.hpGrow*t,e.maxHp+=n.hpGrow*t,Zn(e,yt.x,yt.z,e.speed,t),zn(i,e,t),e.r>=n.rMax&&(e.state="oom",e.t=n.fuse,i.events.push({t:"leakFuse",id:e.id,x:e.x,y:e.y,z:e.z}))},heisen(i,e,t){let n=i.player,s=Qe.heisen,r=i.world;e.blinkCd-=t;let a=n.x-e.x,o=n.z-e.z,l=Math.hypot(a,o)||1,c=Io(r,e.x,e.z,n.x,n.z,1.4),h=Math.cos(n.pitch),f=c&&Uo(n.x,n.y+Re.eye,n.z,-Math.sin(n.yaw)*h,Math.sin(n.pitch),-Math.cos(n.yaw)*h,e.x,e.y,e.z,e.r+.5,e.h)>=0;if(e.aimT=f?e.aimT+t:Math.max(0,e.aimT-t*2),e.aimT>=s.aimTime&&e.blinkCd<=0){let g=e.x,y=e.z;Do(r,i.rng,n.x,n.z,7,18,yt),e.x=yt.x,e.z=yt.z,e.aimT=0,e.blinkCd=s.blinkCd,e.vx=e.vz=e.kx=e.kz=0,i.stats.blinks++,i.events.push({t:"blink",id:e.id,x0:g,z0:y,x:e.x,y:e.y,z:e.z});return}let u=kt((l-11)/3,-1,1),p=e.seed<.5?.8:-.8,d=a/l*u-o/l*p,_=o/l*u+a/l*p,m=Math.hypot(d,_)||1;Zn(e,d/m,_/m,e.speed,t,6),e.yaw=Math.atan2(-a,-o),zn(i,e,t),e.cd<=0&&c&&(e.cd=s.shotCd,uc(i,e.x,e.y+1.3,e.z,s.shotSpeed,e.dmg,"a heisenbug",1),i.events.push({t:"enemyShot",kind:1,x:e.x,y:e.y+1.3,z:e.z}))},brute(i,e,t){let n=i.player,s=Qe.brute;if(e.state==="windup"){let r=n.x-e.x,a=n.z-e.z,o=Math.hypot(r,a)||1;e.dirx=r/o,e.dirz=a/o,Zn(e,0,0,0,t,20),e.yaw=Math.atan2(-r,-a),zn(i,e,t),(e.t-=t)<=0&&(e.state="charge",e.t=s.chargeTime,i.events.push({t:"bruteCharge",id:e.id,x:e.x,y:1,z:e.z}))}else if(e.state==="charge"){e.vx=e.dirx*s.chargeSpeed,e.vz=e.dirz*s.chargeSpeed;let r=e.x,a=e.z,o=zn(i,e,t),l=Math.hypot(e.x-r,e.z-a),c=Math.hypot(n.x-e.x,n.z-e.z);e.t-=t,c<e.r+Re.r+.25&&n.y<e.h?(kn(i,s.chargeDmg,e.x,e.z,e.name)&&(n.vx+=e.dirx*14,n.vz+=e.dirz*14,n.vy=Math.max(n.vy,5.5),n.onGround=!1),e.state="recover",e.t=s.recover):o&&l<s.chargeSpeed*t*.5?(e.state="stun",e.t=s.recover*2,i.events.push({t:"bruteCrash",id:e.id,x:e.x,y:1,z:e.z})):e.t<=0&&(e.state="recover",e.t=s.recover*.5),e.state!=="charge"&&(e.vx=e.vz=0,e.cd2=s.chargeCd)}else if(e.state==="recover"||e.state==="stun")Zn(e,0,0,0,t,10),zn(i,e,t),(e.t-=t)<=0&&(e.state="run");else{let r=yr(i,e);Zn(e,yt.x,yt.z,e.atkT>0?0:e.speed,t),zn(i,e,t),fc(i,e,r,t),(e.cd2-=t)<=0&&e.atkT<=0&&r>4&&r<17&&Io(i.world,e.x,e.z,n.x,n.z,.5)&&(e.state="windup",e.t=s.windup,i.events.push({t:"bruteWindup",id:e.id,x:e.x,y:1,z:e.z}))}},pylon(){},boss(i,e,t){let n=i.player,s=i.world,r=i.rng,a=i.enemies;if(e.t+=t,e.yaw+=kt(Zi(Math.atan2(e.x-n.x,e.z-n.z),e.yaw),-.6*t,.6*t),e.state==="intro"){e.t>=He.intro&&(e.state="fight",e.t=0,i.events.push({t:"bossFight"}));return}if(e.state==="dying"){(e.boomT-=t)<=0&&(e.boomT=.2,i.events.push({t:"explode",x:e.x+r.range(-2.5,2.5),y:r.range(.5,e.h),z:e.z+r.range(-1.5,1.5),radius:3,kind:"boss"})),e.t>=He.deathTime&&(No(i,e,{src:"boss"}),i.events.push({t:"bossDead",x:e.x,z:e.z}));return}let o=e.phase-1;if(e.phase===2&&e.hp<=e.maxHp*He.phase3At&&(e.phase=3,e.shield=!0,e.ringT=1.5,s.pylons2.forEach((l,c)=>Jn(i,"pylon",l.x,l.z,{name:He.deps[4+c]})),i.events.push({t:"bossPhase3",x:e.x,z:e.z})),He.ringEvery[o]>0&&(e.ringT-=t)<=0){e.ringT=He.ringEvery[o];let l=e.ringN++%2*Math.PI/He.ringShots;for(let c=0;c<He.ringShots;c++){let h=l+c*Mr/He.ringShots,f=Math.cos(h),u=Math.sin(h);Xu(i,e.x+f*(e.r+.3),He.ringY,e.z+u*(e.r+.3),f*He.ringSpeed,0,u*He.ringSpeed,He.ringDmg,"the monolith",2)}i.events.push({t:"bossRing",x:e.x,z:e.z})}if((e.addT-=t)<=0){e.addT=He.addEvery;let l=0;for(let c of a)c.type!=="boss"&&c.type!=="pylon"&&!c.dead&&l++;if(l<He.addCap){let c=r.pick(e.phase===1?["zombie","zombie","packet"]:["zombie","packet","fork","cron"]),h=c==="packet"?8:c==="zombie"?4:c==="fork"?1:2;for(let f=0;f<h;f++){let u=r.range(0,Mr),p={x:e.x+Math.cos(u)*(e.r+1.5),z:e.z+Math.sin(u)*(e.r+1.5)};Jn(i,c,p.x,p.z)}i.events.push({t:"bossAdds",x:e.x,z:e.z})}}if(e.beamN=He.beams[o],e.beamHitCd-=t,e.beamN){e.beamA+=He.beamSpeed[o]*t;for(let l=0;l<e.beamN;l++){let c=e.beamA+l*Mr/e.beamN,h=Math.cos(c),f=Math.sin(c),u=An(s,e.x,He.beamY,e.z,h,0,f,He.beamLen,null);e.beamLen[l]=u;let p=n.x-e.x,d=n.z-e.z,_=p*h+d*f;_>e.r&&_<u&&Math.abs(d*h-p*f)<Re.r+.3&&n.y<He.beamY+.3&&e.beamHitCd<=0&&kn(i,He.beamDmg,e.x,e.z,"the monolith")&&(e.beamHitCd=He.beamHitCd)}}if(e.phase>=2&&(e.fanT-=t)<=0){e.fanT=He.fanEvery;for(let l=0;l<He.fanShots;l++)uc(i,e.x,5.5,e.z,He.fanSpeed,He.fanDmg,"the monolith",1,(l-(He.fanShots-1)/2)*.14);i.events.push({t:"enemyShot",kind:3,x:e.x,y:5.5,z:e.z})}}};function $u(i){let e=i.world;Jn(i,"boss",e.boss.x,e.boss.z),e.pylons.forEach((t,n)=>Jn(i,"pylon",t.x,t.z,{name:He.deps[n]}))}function Yu(i,e){let t=i.enemies,n=i.player;for(let r=0;r<t.length;r++){let a=t[r];if(!a.dead){if(a.flash-=e,a.spawnT>0){a.spawnT-=e;continue}a.cd-=e,Tx[a.type](i,a,e)}}for(let r=0;r<t.length;r++){let a=t[r];if(a.dead||a.state==="down")continue;let o=a.mass>1e6,l=a.r+Re.r,c=n.x-a.x,h=n.z-a.z,f=Math.hypot(c,h);if(f<l&&f>1e-6&&n.y<a.y+a.h&&n.y+Re.h>a.y&&a.type!=="packet"){let p=(l-f)/f;o?(n.x+=c*p,n.z+=h*p):(a.x-=c*p,a.z-=h*p)}let u=a.type==="cron";for(let p=r+1;p<t.length;p++){let d=t[p];if(d.dead||d.state==="down"||d.type==="cron"!==u)continue;let _=d.x-a.x,m=d.z-a.z,g=a.r+d.r,y=_*_+m*m;if(y>=g*g||y<1e-8)continue;let v=Math.sqrt(y),M=(g-v)/v*.6,b=d.mass/(a.mass+d.mass);a.x-=_*M*b,a.z-=m*M*b,d.x+=_*M*(1-b),d.z+=m*M*(1-b)}}let s=0;for(let r=0;r<t.length;r++)t[r].dead||(t[s++]=t[r]);t.length=s}var Ex=Math.PI*2,Ji={hit:0,nx:0,ny:0,nz:0},ui=[];function Zu(i,e,t){let n=i.player;for(let s=0;s<4;s++)n.sinceShot[s]+=t,n.sinceShot[s]>vr.coolDelay&&n.heat[s]>0&&(n.heat[s]=Math.max(0,n.heat[s]-(s===n.weapon?vr.cool:vr.idleCool)*t),n.locked[s]&&n.heat[s]<=vr.unlock&&(n.locked[s]=!1,i.events.push({t:"cooled",weapon:s})));if(n.fireCd-=t,n.switchT-=t,n.idleFire+=t,n.bloom=Math.max(0,n.bloom-.15*t),!(n.dead||n.rewind>0)&&(e.weapon>=0&&e.weapon!==n.weapon&&n.unlocked[e.weapon]&&(n.weapon=e.weapon,n.switchT=.2,i.events.push({t:"switch",weapon:n.weapon})),!(!e.fire||n.switchT>0||n.fireCd>0))){if(n.locked[n.weapon]){e.firePressed&&i.events.push({t:"dry",weapon:n.weapon});return}Ax(i)}}function Ax(i){let e=i.player,t=e.weapon,n=Jt[t],s=i.rng,r=e.sudoT>0,a=e.canary&&e.idleFire>=1.5,o=e.dmgMul*(r?1.5:1)*(a?3:1);n.id==="grep"&&(o*=e.grepMul),e.fireCd=(e.fireCd<-Rx?0:e.fireCd)+1/n.rate,e.idleFire=0,e.sinceShot[t]=0,!r&&!(e.retry>0&&s.next()<e.retry)&&(e.heat[t]+=n.heat*e.heatMul,e.heat[t]>=1&&(e.heat[t]=1,e.locked[t]=!0,i.stats.overheats++,i.events.push({t:"overheat",weapon:t}))),i.stats.shots++;let l=Math.cos(e.pitch),c=Math.sin(e.yaw),h=Math.cos(e.yaw),f=-c*l,u=Math.sin(e.pitch),p=-h*l,d=e.x,_=e.y+Re.eye,m=e.z;if(i.events.push({t:"fire",weapon:t,canary:a,sudo:r}),n.rocket){let x=n.rocket;i.rockets.push({x:d+f*.5,y:_-.12+u*.5,z:m+p*.5,vx:f*x.speed,vy:u*x.speed,vz:p*x.speed,life:x.life,dmg:n.dmg*o,radius:x.radius*e.blastMul});return}let g=c*u,y=l,v=h*u,M=n.spread+e.bloom,b=n.pellets+(n.id==="kill"?e.pellets:0),w=!1;for(let x=0;x<b;x++){let S=s.next()*Ex,P=M*Math.sqrt(s.next()),R=Math.cos(S)*P,C=Math.sin(S)*P,D=f+h*R+g*C,F=u+y*C,L=p-c*R+v*C,V=Math.hypot(D,F,L);D/=V,F/=V,L/=V,Cx(i,n,t,d,_,m,D,F,L,o)&&(w=!0)}e.bloom=Math.min(.035,e.bloom+n.bloom),w&&i.stats.hits++}var Rx=.05;function Cx(i,e,t,n,s,r,a,o,l,c){let h=i.enemies,f=An(i.world,n,s,r,a,o,l,e.range,Ji);ui.length=0;for(let d=0,_=h.length;d<_;d++){let m=h[d];if(!hi(m))continue;let g=Uo(n,s,r,a,o,l,m.x,m.y,m.z,m.r+(m.type==="packet"?.22:.08),m.h);g>=0&&g<f&&ui.push({e:m,t:g})}ui.sort((d,_)=>d.t-_.t),!e.pierce&&ui.length>1&&(ui.length=1);let u=e.pierce||!ui.length?f:ui[0].t;i.events.push({t:"tracer",weapon:t,x:n+a*u,y:s+o*u,z:r+l*u,dx:a,dy:o,dz:l,len:u,wall:e.pierce||!ui.length?Ji.hit:0,nx:Ji.nx,ny:Ji.ny,nz:Ji.nz});let p=!1;for(let d of ui){let _=e.falloff?Uu(1,e.falloff[2],kt((d.t-e.falloff[0])/(e.falloff[1]-e.falloff[0]),0,1)):1;pc(i,d.e,e.dmg*c*_,{src:e.id,hx:n+a*d.t,hy:s+o*d.t,hz:r+l*d.t,kx:a*e.knock,kz:l*e.knock})&&(p=!0)}return p}function Ju(i,e){let t=i.rockets,n=i.enemies,s=Jt[3],r=0;for(let a=0;a<t.length;a++){let o=t[a],l=Math.hypot(o.vx,o.vy,o.vz),c=o.vx/l,h=o.vy/l,f=o.vz/l,u=An(i.world,o.x,o.y,o.z,c,h,f,l*e,Ji),p=Ji.hit!==0;for(let _=0;_<n.length;_++){let m=n[_];if(!hi(m))continue;let g=Uo(o.x,o.y,o.z,c,h,f,m.x,m.y,m.z,m.r+.15,m.h);g>=0&&g<=u&&(u=g,p=!0)}if(o.life-=e,!p&&o.life>0){o.x+=o.vx*e,o.y+=o.vy*e,o.z+=o.vz*e,t[r++]=o;continue}let d=Math.max(0,u-.15);br(i,o.x+c*d,o.y+h*d,o.z+f*d,o.radius,o.dmg,{src:"rm",kind:"rm",self:s.rocket.selfMul,impulse:s.rocket.impulse})&&i.stats.hits++}t.length=r}var mc={x:0,z:0},Px={autoscale:i=>{i.maxHp+=25,i.hp=Math.min(i.maxHp,i.hp+25)},cache:i=>{i.heatMul*=.78},gc:i=>{i.gcHeal+=.5},canary:i=>{i.canary=!0},lb:i=>{i.pellets+=3},retry:i=>{i.retry+=.2},bluegreen:i=>{i.rollbackCdMul*=.65},breaker:i=>{i.breakerReady=!0},cdn:i=>{i.speedMul*=1.12,i.dashCdMul*=.75},tracing:i=>{i.grepMul*=1.4},chaos:i=>{i.blastMul*=1.3,i.noSelf=!0},overprov:i=>{i.dmgMul*=1.15},espresso:i=>{i.coffeeRate*=2,i.coffeeMul*=1.5},policy:i=>{i.sudoGain*=1.4,i.sudoBonus+=2}},Ix={tracing:3,chaos:6};function gc(i,e){let t=i.player;t.perks[e]=(t.perks[e]||0)+1,i.perkLog.push(e),Px[e](t)}function xc(i,e){if(i.state!=="perk")return;let t=i.perkChoices[e]??i.perkChoices[0];gc(i,t),i.events.push({t:"perk",id:t}),i.perkChoices=null,Fo(i,i.wave+1)}var Ku={zombie:1,fork:4.5,cron:4,packet:.35,race:9,leak:5,heisen:6,brute:15};function Lx(i,e){if(e<Et.length)return Et[e];let t=e-Et.length,n=i.rng,s=Object.keys(Ku),r=[],a=48+t*9,o=0;for(;a>.5;){let l=n.pick(s),c=Ku[l],h=l==="packet"?16+n.int(12):l==="zombie"?5+n.int(6):l==="brute"?1:1+n.int(3);r.push({t:o,type:l,n:h,gap:l==="packet"?.12:void 0}),a-=h*c,o+=n.range(3,7)}return{inc:2041+t,sev:1,act:t%3,title:n.pick(Dx),voice:"night",groups:r,hpMul:1+t*.07}}var Dx=["it was DNS","expired certificate","disk full on /var/log","someone ran it in prod","works on my machine","clock skew","a quick fix from 2019","the intern has root","kernel upgrade went fine","leap second"];function Fo(i,e){let t=i.player,n=Lx(i,e);i.wave=e,i.def=n,i.hpMul=n.hpMul||1,(!i.world||i.world.map!==n.act)&&(i.world=ku(n.act),t.x=i.world.start.x,t.z=i.world.start.z,t.y=0,t.vx=t.vy=t.vz=0,t.yaw=0,t.pitch=0,t.hist.length=0,i.enemies.length=0,i.shots.length=0,i.rockets.length=0,i.pickups.length=0,Lo(i.world,t.x,t.z),i.events.push({t:"act",act:n.act}));for(let s=0;s<=Math.min(e,Et.length-1);s++){let r=Et[s].unlock;r!=null&&!t.unlocked[r]&&(t.unlocked[r]=!0,s===e&&(t.weapon=r,i.events.push({t:"unlock",weapon:r})))}t.breakerReady=!!t.perks.breaker,i.groups=n.groups.map(s=>({type:s.type,gap:s.gap??.35,next:s.t,ax:0,az:0,placed:!1,per:s.type==="race"?2:1,left:s.type==="brute"||s.type==="race"?s.n:Math.max(1,Math.round(s.n*pn[i.sev].count))})),i.state="brief",i.stateT=e===0?5:4,i.waveT=0,i.remaining=0,i.total=i.groups.reduce((s,r)=>s+r.left*r.per,0),i.events.push({t:"brief",wave:e,inc:n.inc,sev:n.sev,title:n.title,voice:n.voice,boss:!!n.boss,act:n.act})}function Nx(i,e){let t=i.player,n=i.world,s=i.rng;(!e.placed||Math.hypot(e.ax-t.x,e.az-t.z)<9)&&(Do(n,s,t.x,t.z,13,34,mc),e.ax=mc.x,e.az=mc.z,e.placed=!0);let r=()=>{let l=e.ax+s.range(-2.6,2.6),c=e.az+s.range(-2.6,2.6),h=Ps(n,l,c);return h>=0&&n.kind[h]===0?{x:l,z:c}:{x:e.ax,z:e.az}},a=r(),o=Jn(i,e.type,a.x,a.z);if(e.type==="race"){let l=r(),c=Jn(i,"race",l.x,l.z);o.twin=c.id,c.twin=o.id,c.variant=1,c.name="thread-B",o.name="thread-A"}}function ju(i,e){let t=i.player;if(i.state==="brief"){if((i.stateT-=e)>0)return;i.state="wave",i.def.boss&&$u(i),i.events.push({t:"waveStart",wave:i.wave})}else if(i.state==="wave"){i.waveT+=e;let n=0,s=1/0;for(let a of i.groups)a.left>0&&(n+=a.left*a.per,a.next<s&&(s=a.next));!i.enemies.length&&n&&s>i.waveT&&(i.waveT=s);for(let a of i.groups)for(;a.left>0&&a.next<=i.waveT&&i.enemies.length<Du;)Nx(i,a),a.left--,a.next=Math.max(a.next,i.waveT-.02)+a.gap,n-=a.per;let r=0;for(let a of i.enemies)a.dead||r++;if(i.remaining=r+n,r+n>0)return;i.stats.waves=Math.max(i.stats.waves,i.wave+1),i.shots.length=0,Is(i,Re.waveHeal,"wave"),i.state="cleared",i.stateT=i.def.boss?3.5:2.2,i.events.push({t:"waveEnd",wave:i.wave,inc:i.def.inc,boss:!!i.def.boss})}else if(i.state==="cleared"){if((i.stateT-=e)>0)return;if(i.def.boss){i.over="won",i.events.push({t:"won"});return}let n=Rs.filter(s=>(t.perks[s.id]||0)<s.max&&i.wave+1>=(Ix[s.id]||0));for(i.perkChoices=[];i.perkChoices.length<3&&n.length;)i.perkChoices.push(n.splice(i.rng.int(n.length),1)[0].id);if(!i.perkChoices.length){Fo(i,i.wave+1);return}i.state="perk",i.events.push({t:"perks",choices:i.perkChoices})}}var vc=()=>({mx:0,mz:0,dyaw:0,dpitch:0,jump:!1,jumpPressed:!1,dash:!1,fire:!1,firePressed:!1,rollback:!1,sudo:!1,weapon:-1}),Ux=()=>({time:0,shots:0,hits:0,damage:0,damageTaken:0,byCause:{},kills:{},killsTotal:0,collateral:0,revived:0,blinks:0,overheats:0,rollbacks:0,dashes:0,sudos:0,coffee:0,hotTime:0,bestCombo:0,waves:0,deaths:0});function ed(i={}){let e=i.seed??1,t={seed:e,rng:wo(e),sev:i.sev||2,god:!!i.god,t:0,nextId:0,world:null,player:Vu(),enemies:[],shots:[],rockets:[],pickups:[],events:[],state:"brief",stateT:0,wave:0,waveT:0,def:null,groups:[],remaining:0,total:0,hpMul:1,over:null,score:i.score||0,combo:0,comboT:0,perkChoices:null,perkLog:[],pendingBlast:null,flowT:0,stats:i.stats||Ux()};for(let n of i.perks||[])gc(t,n);return Fo(t,i.wave||0),t}var Kn=vc();function td(i,e,t){if(i.over||i.state==="perk")return;let n=Math.min(t,.1),s=!0;for(;n>1e-7&&!i.over&&i.state!=="perk";){let r=Math.min(n,.03333333333333333);n-=r,s?Qu(i,e,r):(Object.assign(Kn,e),Kn.dyaw=Kn.dpitch=0,Kn.jumpPressed=Kn.dash=Kn.firePressed=Kn.rollback=Kn.sudo=!1,Kn.weapon=-1,Qu(i,Kn,r)),s=!1}}function Qu(i,e,t){let n=i.player;if(i.t+=t,i.stats.time+=t,Hu(i,e,t),Zu(i,e,t),(i.flowT-=t)<=0&&(i.flowT=.2,Lo(i.world,n.x,n.z)),Yu(i,t),qu(i,t),Ju(i,t),i.pendingBlast){let a=i.pendingBlast;i.pendingBlast=null,br(i,a.x,a.y,a.z,10,140,{src:"breaker",kind:"breaker",impulse:16})}let s=i.pickups,r=0;for(let a=0;a<s.length;a++){let o=s[a];o.t-=t,o.vy-=20*t,o.y+=o.vy*t,o.y<.5&&(o.y=.5,o.vy=0);let l=n.x-o.x,c=n.z-o.z,h=Math.hypot(l,c),f=n.hp<n.maxHp&&!n.dead;if(f&&h<Cs.magnet&&h>1e-6&&(o.x+=l/h*9*t,o.z+=c/h*9*t),f&&h<Cs.r&&n.y<2){Is(i,Cs.heal*n.coffeeMul,"coffee"),i.stats.coffee++,i.events.push({t:"coffee",x:o.x,y:o.y,z:o.z});continue}o.t>0&&(s[r++]=o)}s.length=r,i.comboT>0&&(i.comboT-=t)<=0&&(i.combo>=5&&i.events.push({t:"comboEnd",n:i.combo}),i.combo=0),ju(i,t)}function _c(i=7,e=1){return{rng:wo(i),skill:e,target:null,retarget:0,react:0,strafe:1,strafeT:0,stuck:0,wpnT:0,t:0,moveT:0,mx:0,mz:0,danger:!1,jumpCd:0}}var Fx={pylon:.5,leak:.6,heisen:.7,cron:.8,race:.8,packet:.9,fork:1,zombie:1,brute:1.1,boss:1.2},Ox={heisen:1,brute:1,boss:1,pylon:1,cron:1,leak:1,race:1},kx=["autoscale","overprov","gc","cache","breaker","espresso","retry","cdn","policy","tracing","lb","bluegreen","canary","chaos"];function nd(i){let e=0,t=99;return i.perkChoices.forEach((n,s)=>{let r=kx.indexOf(n);r<t&&(t=r,e=s)}),e}function id(i,e,t,n){let s=e.player,r=e.world,a=e.enemies,o=i.rng,l=i.skill;if(n.mx=n.mz=n.dyaw=n.dpitch=0,n.weapon=-1,n.jump=n.jumpPressed=n.dash=n.fire=n.firePressed=n.rollback=n.sudo=!1,s.dead)return n;i.t+=t,i.jumpCd-=t;let c=s.x,h=s.y+Re.eye,f=s.z,u=(v,M)=>{let b=v-s.x,w=M-s.z;return Math.hypot(b,w)<3||Math.abs(Zi(Math.atan2(-b,-w),s.yaw))<1.1?1:.3*l},p=()=>{i.jumpCd>0||!s.onGround||(i.jumpCd=.45,o.next()<.92*Math.sqrt(l)&&(n.jump=n.jumpPressed=!0))};i.retarget-=t,i.react-=t;let d=i.target;if(i.retarget<=0||!d||!hi(d)||d.type==="boss"&&d.shield){i.retarget=.25;let v=null,M=1/0;for(let b of a){if(!hi(b)||b.type==="boss"&&(b.shield||b.state!=="fight"))continue;let w=b.x-c,x=b.y+b.h*.55-h,S=b.z-f,P=Math.hypot(w,x,S)||1,R=An(r,c,h,f,w/P,x/P,S/P,P,null)>=P-.001,C=P*Fx[b.type]+(R?0:40);b.type==="race"&&a.some(D=>D.id===b.twin&&D.state==="down")&&(C*=.3),b.type==="leak"&&(C*=b.state==="oom"?.3:1-b.r*.2),b===d&&(C*=.8),C<M&&(M=C,v=b)}v!==d&&(i.react=.2/l),d=i.target=v}let _=0,m=0;if(d){let v=.028/l,M=d.x-c,b=d.y+d.h*.55-h,w=d.z-f,x=Math.hypot(M,w)||1;_=Math.hypot(x,b);let S=Math.atan2(-M,-w)+v*Math.sin(i.t*2.3)+v*.6*Math.sin(i.t*7.1),P=Math.atan2(b,x)+v*.7*Math.cos(i.t*1.7),R=5*l*t,C=Zi(S,s.yaw),D=P-s.pitch;n.dyaw=kt(C,-R,R),n.dpitch=kt(D,-R,R);let F=An(r,c,h,f,M/_,b/_,w/_,_,null)>=_-.001,L=Math.abs(C-n.dyaw)<Math.atan(d.r*1.1/_)+v*.5&&Math.abs(D-n.dpitch)<Math.atan(d.h*.45/_)+v*.5;for(let V of a)hi(V)&&Math.hypot(V.x-d.x,V.z-d.z)<5&&m++;n.fire=F&&L&&i.react<=0&&!(s.weapon===3&&_<7)}else n.dyaw=.6*t,n.dpitch=kt(-s.pitch,-t,t);if(i.wpnT-=t,i.wpnT<=0||s.locked[s.weapon]){i.wpnT=.4/l;let v=b=>s.unlocked[b]&&!s.locked[b],M=s.weapon;d&&v(3)&&m>=4&&_>8&&s.heat[3]<.5?M=3:d&&v(2)&&Ox[d.type]&&s.heat[2]<.6?M=2:d&&v(1)&&_<10&&s.heat[1]<.7?M=1:v(0)?M=0:M=[1,2,3,0].find(v)??s.weapon,M!==s.weapon&&(n.weapon=M)}if((i.moveT-=t)<=0){i.moveT=.12/l;let v=0,M=0;i.danger=!1;for(let b of a){if(b.dead||b.state==="down"||b.type==="cron"||b.type==="pylon")continue;let w=s.x-b.x,x=s.z-b.z,S=Math.hypot(w,x)||1,P=u(b.x,b.z),R=b.type==="leak"?b.state==="oom"?9.5:4:b.type==="brute"||b.type==="boss"?9:7;if(S<R){let C=(R-S)/R/S*2.2*P;v+=w*C,M+=x*C}P===1&&(S<b.r+1.9||b.state==="charge"&&S<7||b.state==="oom"&&S<7.5)&&(i.danger=!0)}if(d){let b=d.x-s.x,w=d.z-s.z,x=Math.hypot(b,w)||1,S=kt((x-(d.type==="boss"?14:11))/6,-1,1)*.6;v+=(-w*i.strafe*.8+b*S)/x,M+=(b*i.strafe*.8+w*S)/x}else{let b=r.start.x-s.x,w=r.start.z-s.z,x=Math.hypot(b,w);x>4&&(v+=b/x,M+=w/x)}for(let b=0;b<8;b++){let w=b*Math.PI/4,x=Math.cos(w),S=Math.sin(w),P=An(r,s.x,.5,s.z,x,0,S,3.5,null);if(P<3.5){let R=(3.5-P)/3.5*1.3;v-=x*R,M-=S*R}}for(let b of e.shots){if(b.kind===2||u(b.x,b.z)<1)continue;let w=s.x-b.x,x=s.z-b.z,S=b.vx*b.vx+b.vz*b.vz||1,P=(w*b.vx+x*b.vz)/S;if(P<=0||P>.8)continue;let R=w-b.vx*P,C=x-b.vz*P,D=Math.hypot(R,C);if(D<1.4){let F=Math.sqrt(S),L=D>.05?R/D:-b.vz/F,V=D>.05?C/D:b.vx/F;v+=L*1.6*l,M+=V*1.6*l}}if(s.hp<s.maxHp*.7){let b=null,w=14;for(let x of e.pickups){let S=Math.hypot(x.x-s.x,x.z-s.z);S<w&&(w=S,b=x)}b&&(v+=(b.x-s.x)/w*1.3,M+=(b.z-s.z)/w*1.3)}i.mx=v,i.mz=M}for(let v of e.shots){if(v.kind!==2)continue;let M=s.x-v.x,b=s.z-v.z,w=v.vx*v.vx+v.vz*v.vz||1,x=(M*v.vx+b*v.vz)/w;x>0&&x<.3&&Math.hypot(M-v.vx*x,b-v.vz*x)<1&&p()}let g=a.find(v=>v.type==="boss");if(g&&g.beamN){let v=Math.atan2(s.z-g.z,s.x-g.x),M=He.beamSpeed[g.phase-1];for(let b=0;b<g.beamN;b++){let w=Zi(v,g.beamA+b*Math.PI*2/g.beamN);w>0&&w/M<.34&&p()}}i.strafeT-=t,i.stuck=Math.hypot(s.vx,s.vz)<2?i.stuck+t:0,(i.strafeT<=0||i.stuck>.4)&&(i.strafe=-i.strafe,i.strafeT=o.range(1.2,3),i.stuck=0);let y=Math.hypot(i.mx,i.mz);if(y>.05){let v=Math.sin(s.yaw+n.dyaw),M=Math.cos(s.yaw+n.dyaw);n.mx=(i.mx*M-i.mz*v)/y,n.mz=(-i.mx*v-i.mz*M)/y}return s.y>1&&s.onGround&&(n.jump=n.jumpPressed=!0),n.dash=i.danger&&s.dashCd<=0,n.rollback=s.rollbackCd<=0&&s.hist.length>=8&&s.hist[0].hp-s.hp>=30&&s.hp<s.maxHp*.5,n.sudo=s.sudo>=1&&s.sudoT<=0&&(a.length>=8||!!d&&d.type==="boss"),n}var Ri=`
uniform vec3 uFog; uniform float uFogD; uniform float uTime; uniform vec3 uAccent; uniform float uBass;
uniform vec4 uLightPos[4]; uniform vec3 uLightCol[4];
float hash1(vec2 p) { vec3 q = fract(vec3(p.xyx) * 0.1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
vec3 lights(vec3 wp) {
  vec3 s = vec3(0.0);
  for (int i = 0; i < 4; i++) {
    vec3 d = uLightPos[i].xyz - wp;
    float a = max(0.0, 1.0 - dot(d, d) / (uLightPos[i].w * uLightPos[i].w));
    s += uLightCol[i] * a * a;
  }
  return s;
}
float fogAt(vec3 wp) { return 1.0 - exp(-distance(wp, cameraPosition) * uFogD); }
`,sd={vertexShader:Ri+`
attribute vec3 iTile; // x, z, random
uniform vec4 uRip[8]; // x, z, start time, strength
uniform float uTile;
varying vec2 vUv; varying vec3 vWp; varying float vH; varying float vRand; varying float vSide; varying vec3 vLight;
void main() {
  float h = 0.0;
  for (int i = 0; i < 8; i++) {
    float age = uTime - uRip[i].z, d = distance(iTile.xy, uRip[i].xy), x = (d - age * 17.0) * 0.5;
    h += exp(-x * x) * uRip[i].w * exp(-age * 1.5) * step(0.0, age);
  }
  float beat = uBass * (0.03 + 0.16 * step(0.88, iTile.z));
  h = min(h, 1.4); // a ripple is a ripple: tiles must not read as steps or hide enemies
  vH = h;
  vec3 p = position;
  p.xz *= uTile * 0.955;
  p.y += h * 0.24 + beat;
  vWp = vec3(iTile.x + p.x, p.y, iTile.y + p.z);
  vUv = uv; vRand = iTile.z; vSide = 1.0 - abs(normal.y);
  vLight = lights(vec3(iTile.x, 0.3, iTile.y));
  gl_Position = projectionMatrix * viewMatrix * vec4(vWp, 1.0);
}`,fragmentShader:Ri+`
varying vec2 vUv; varying vec3 vWp; varying float vH; varying float vRand; varying float vSide; varying vec3 vLight;
void main() {
  float d = min(min(vUv.x, 1.0 - vUv.x), min(vUv.y, 1.0 - vUv.y));
  float fw = max(fwidth(vUv.x), fwidth(vUv.y));
  float line = (1.0 - smoothstep(0.035 - fw, 0.035 + fw, d)) * clamp(0.06 / fw, 0.0, 1.0);
  float glow = 0.22 + vH * 2.2 + uBass * 0.3 + 0.5 * step(0.88, vRand) * uBass;
  vec3 col = vec3(0.016, 0.02, 0.024) * (0.6 + 0.8 * vRand) + uAccent * 0.012;
  col += uAccent * line * glow + uAccent * vH * 0.35;
  col = mix(col, uAccent * (0.05 + vH * 0.6), vSide);
  col += vLight * (0.3 + 0.7 * line);
  gl_FragColor = vec4(mix(col, uFog, fogAt(vWp)), 1.0);
}`},rd={vertexShader:Ri+`
attribute vec3 iPos; attribute vec3 iSize; attribute vec2 iKind; // kind (0 rack, 1 wall), seed
varying vec3 vWp; varying vec3 vN; varying vec2 vKind; varying vec3 vLight; varying vec2 vUv;
void main() {
  vWp = iPos + position * iSize;
  vN = normal; vKind = iKind; vUv = uv;
  vLight = lights(vWp);
  gl_Position = projectionMatrix * viewMatrix * vec4(vWp, 1.0);
}`,fragmentShader:Ri+`
uniform sampler2D tLogs; uniform float uAlarm;
varying vec3 vWp; varying vec3 vN; varying vec2 vKind; varying vec3 vLight; varying vec2 vUv;
void main() {
  // u runs left to right for whoever faces the surface, so wall text is never mirrored
  float u = vN.z * vWp.x - vN.x * vWp.z, fog = fogAt(vWp);
  vec3 col;
  if (vKind.x > 0.5) {
    // wall: a slow tail -f, brighter near the floor
    float txt = texture2D(tLogs, vec2(u / 26.0 + vKind.y, vWp.y / 26.0 - uTime * 0.011)).r;
    float low = exp(-vWp.y * 0.16);
    col = vec3(0.007, 0.009, 0.011) + mix(uAccent, vec3(1.0, 0.12, 0.1), uAlarm) * txt * (0.1 + 0.34 * low + 0.12 * uBass);
    col += uAccent * 0.05 * exp(-vWp.y * 1.6);
  } else if (vN.y > 0.5) {
    // rack top: the hot aisle
    float g = step(0.5, fract(vWp.x * 5.0)) * step(0.12, fract(vWp.z * 1.0));
    col = vec3(0.02, 0.008, 0.006) + vec3(1.0, 0.22, 0.04) * g * (0.28 + 0.12 * sin(uTime * 2.7 + vWp.x + vWp.z));
  } else {
    // rack side: unit lines and status LEDs
    vec2 q = vec2(u * 6.0, vWp.y * 5.0), cell = floor(q), f = fract(q);
    float hsh = hash1(cell + vKind.y * 91.0), far = clamp(fwidth(q.x) * 1.5, 0.0, 1.0);
    float led = step(0.3, f.x) * step(f.x, 0.7) * step(0.32, f.y) * step(f.y, 0.62);
    float on = step(0.62, hsh) * mix(0.12, 1.0, step(0.0, sin(uTime * (1.5 + hsh * 11.0) + hsh * 50.0)));
    vec3 lc = mix(uAccent, vec3(1.0, 0.16, 0.08), step(0.965, hsh));
    col = vec3(0.016, 0.019, 0.024) * (1.0 - 0.55 * step(0.9, f.y)) + lc * mix(led * on * 1.25, 0.11, far);
    float e = min(vUv.x, 1.0 - vUv.x) / max(fwidth(vUv.x), 1e-5);
    col += uAccent * 0.5 * (1.0 - smoothstep(0.8, 2.0, e));
  }
  col += vLight * 0.35;
  gl_FragColor = vec4(mix(col, uFog, fog), 1.0);
}`},ad={vertexShader:Ri+`
attribute mat4 iM; attribute vec4 iCol; attribute vec4 iFx; // rgb+glow; flash, unused, flicker seed, unused
varying vec2 vUv; varying vec3 vWp; varying vec3 vN; varying vec4 vCol; varying vec4 vFx;
void main() {
  vec4 wp = iM * vec4(position, 1.0);
  vWp = wp.xyz; vUv = uv; vCol = iCol; vFx = iFx;
  vN = normalize(mat3(iM) * normal);
  gl_Position = projectionMatrix * viewMatrix * wp;
}`,fragmentShader:Ri+`
varying vec2 vUv; varying vec3 vWp; varying vec3 vN; varying vec4 vCol; varying vec4 vFx;
void main() {
  vec2 fw = max(fwidth(vUv), vec2(1e-5)), e2 = min(vUv, 1.0 - vUv) / fw;
  float edge = 1.0 - smoothstep(0.7, 1.9, min(e2.x, e2.y));
#ifdef ADD
  vec3 col = vCol.rgb * (vCol.a + edge * 0.4) * (1.0 - fogAt(vWp));
  gl_FragColor = vec4(col, 1.0);
#else
  if (vFx.z > 0.0 && hash1(floor(gl_FragCoord.xy * 0.5) + floor(uTime * 24.0) + vFx.z * 17.0) < 0.42) discard;
  float lit = 0.4 + 0.6 * max(0.0, dot(vN, vec3(0.28, 0.92, 0.26)));
  vec3 col = vCol.rgb * (0.2 * lit + vCol.a) + vCol.rgb * edge * 1.1 + lights(vWp) * 0.45 * lit;
  col = mix(col, vec3(1.0), vFx.x);
  gl_FragColor = vec4(mix(col, uFog, fogAt(vWp)), 1.0);
#endif
}`},od={vertexShader:Ri+`
attribute vec4 iPos; attribute vec4 iCol; attribute vec2 iGlyph; // xyz+size; rgb+alpha; index, rotation
varying vec2 vUv; varying vec3 vCol;
void main() {
  vec4 mv = viewMatrix * vec4(iPos.xyz, 1.0);
  float c = cos(iGlyph.y), s = sin(iGlyph.y);
  vec2 q = position.xy * vec2(0.6, 1.0) * iPos.w;
  mv.xy += vec2(q.x * c - q.y * s, q.x * s + q.y * c);
  gl_Position = projectionMatrix * mv;
  vUv = vec2((mod(iGlyph.x, 16.0) + uv.x) / 16.0, 1.0 - (floor(iGlyph.x / 16.0) + 1.0 - uv.y) / 6.0);
  vCol = iCol.rgb * iCol.a * exp(mv.z * uFogD * 0.6);
}`,fragmentShader:`
uniform sampler2D tGlyph;
varying vec2 vUv; varying vec3 vCol;
void main() { gl_FragColor = vec4(vCol * texture2D(tGlyph, vUv).r, 1.0); }`},ld={vertexShader:`
varying vec3 vWp;
void main() { vWp = position + vec3(cameraPosition.x, 0.0, cameraPosition.z); gl_Position = projectionMatrix * viewMatrix * vec4(vWp, 1.0); }`,fragmentShader:Ri+`
varying vec3 vWp;
void main() {
  vec2 q = vWp.xz / 6.0, f = abs(fract(q) - 0.5), fw = fwidth(q);
  float gx = 1.0 - smoothstep(0.0, fw.x * 1.5 + 0.004, 0.5 - f.x), gz = 1.0 - smoothstep(0.0, fw.y * 1.5 + 0.004, 0.5 - f.y);
  float g = max(gx, gz) * clamp(0.08 / max(fw.x, fw.y), 0.0, 1.0);
  float blink = step(0.985, hash1(floor(q) + floor(uTime * 1.5))) * (1.0 - max(f.x, f.y) * 2.0);
  float fade = exp(-distance(vWp.xz, cameraPosition.xz) * 0.03);
  gl_FragColor = vec4(uFog * 0.6 + uAccent * (g * 0.16 + blink * 0.5 + uBass * g * 0.1) * fade, 1.0);
}`},yc=`
varying vec2 vUv;
void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`,cd={vertexShader:yc,fragmentShader:`
uniform sampler2D tSrc; uniform vec2 uTexel;
varying vec2 vUv;
void main() {
  vec3 c = (texture2D(tSrc, vUv + uTexel * vec2(-0.5, -0.5)).rgb + texture2D(tSrc, vUv + uTexel * vec2(0.5, -0.5)).rgb
    + texture2D(tSrc, vUv + uTexel * vec2(-0.5, 0.5)).rgb + texture2D(tSrc, vUv + uTexel * vec2(0.5, 0.5)).rgb) * 0.25;
  float l = max(c.r, max(c.g, c.b));
  gl_FragColor = vec4(c * smoothstep(0.32, 0.9, l), 1.0);
}`},hd={vertexShader:yc,fragmentShader:`
uniform sampler2D tSrc; uniform vec2 uDir;
varying vec2 vUv;
void main() {
  vec3 c = texture2D(tSrc, vUv).rgb * 0.2270270270;
  c += (texture2D(tSrc, vUv + uDir * 1.3846153846).rgb + texture2D(tSrc, vUv - uDir * 1.3846153846).rgb) * 0.3162162162;
  c += (texture2D(tSrc, vUv + uDir * 3.2307692308).rgb + texture2D(tSrc, vUv - uDir * 3.2307692308).rgb) * 0.0702702703;
  gl_FragColor = vec4(c, 1.0);
}`},ud={vertexShader:yc,fragmentShader:`
uniform sampler2D tScene; uniform sampler2D tBloom;
uniform vec2 uSceneRes; uniform vec2 uOutRes; uniform float uTime;
uniform float uGlitch; uniform float uHurt; uniform float uFade; uniform float uAberr; uniform float uBloom; uniform float uCrt;
uniform vec3 uTint; uniform float uTintAmt; uniform float uFlash; uniform float uRewind;
varying vec2 vUv;
float h1(float n) { return fract(sin(n * 127.1) * 43758.5453); }
vec3 scene(vec2 uv) {
  vec2 px = uv * uSceneRes, fl = floor(px), fr = fract(px);
  fr = clamp((fr - 0.5) * (uOutRes.y / uSceneRes.y) + 0.5, 0.0, 1.0);
  return texture2D(tScene, (fl + fr) / uSceneRes).rgb;
}
// This pass runs on every screen pixel, so it is kept lean: two scene fetches, one bloom fetch, no trig in the
// steady state; the glitch, rewind and tint branches are uniform-driven and cost nothing when idle.
void main() {
  vec2 c = vUv * 2.0 - 1.0;
  vec2 uv = (c + c * (c.yx * c.yx) * vec2(0.035, 0.045) * uCrt) * 0.5 + 0.5;
  if (uGlitch > 0.001) {
    float row = floor(uv.y * 54.0), tt = floor(uTime * 24.0);
    uv.x += step(1.0 - uGlitch * 0.55, h1(row + tt * 7.3)) * (h1(row * 3.1 + tt) - 0.5) * 0.09 * uGlitch;
  }
  if (uRewind > 0.001) uv.x += uRewind * 0.012 * sin(uv.y * 90.0 + uTime * 60.0);
  vec3 col = scene(uv);
  col.r = scene(uv + (uv - 0.5) * (0.005 * uCrt + uAberr + uGlitch * 0.02)).r; // red fringe towards the edges
  col += texture2D(tBloom, uv).rgb * uBloom;
  if (uTintAmt > 0.001) col = mix(col, uTint * dot(col, vec3(0.3, 0.55, 0.15)) * 1.5, uTintAmt);
  col *= 1.0 - uCrt * 0.26 * mod(floor(gl_FragCoord.y), 2.0); // scanlines: every other output row
  float v = dot(c, c);
  col *= 1.0 - 0.22 * v;
  col += vec3(0.9, 0.05, 0.08) * uHurt * smoothstep(0.25, 1.6, v) + uFlash;
  col += (h1(dot(gl_FragCoord.xy, vec2(12.9898, 78.233)) + uTime) - 0.5) * 0.035;
  vec2 m = smoothstep(vec2(0.0), vec2(0.004, 0.006), uv) * smoothstep(vec2(0.0), vec2(0.004, 0.006), 1.0 - uv);
  gl_FragColor = vec4(col * m.x * m.y * uFade, 1.0);
}`};var di=[1,.85,.72,.62,.54,.47,.41,.36];function dd(i){let e=new Mo({canvas:i,antialias:!1,alpha:!1,stencil:!1,powerPreference:"high-performance"});e.autoClear=!1,e.info.autoReset=!1,e.setPixelRatio(1);let t=e.getContext(),n={uTime:{value:0},uFog:{value:new G(.008,.026,.018)},uFogD:{value:.024},uAccent:{value:new G(.22,1,.53)},uBass:{value:0},uAlarm:{value:0},uLightPos:{value:[0,1,2,3].map(()=>new lt(0,-100,0,1))},uLightCol:{value:[0,1,2,3].map(()=>new G)},uRip:{value:Array.from({length:8},()=>new lt(0,0,-100,0))}},s=v=>new nn(4,4,{depthBuffer:v,minFilter:Mt,magFilter:Mt}),r=s(!0),a=s(!1),o=s(!1),l=s(!1),c=(v,M)=>new Ot({...v,uniforms:M,depthTest:!1,depthWrite:!1}),h=c(cd,{tSrc:{value:r.texture},uTexel:{value:new Xe}}),f=c(hd,{tSrc:{value:null},uDir:{value:new Xe}}),u={uGlitch:{value:0},uHurt:{value:0},uFade:{value:1},uAberr:{value:0},uBloom:{value:1.15},uCrt:{value:1},uTint:{value:new G(1,.8,.2)},uTintAmt:{value:0},uFlash:{value:0},uRewind:{value:0}},p=c(ud,{tScene:{value:r.texture},tBloom:{value:l.texture},uSceneRes:{value:new Xe},uOutRes:{value:new Xe},uTime:n.uTime,...u}),d=new Ft(new Hi(2,2),p);d.frustumCulled=!1;let _=new ai,m=new _s(-1,1,1,-1,0,1);_.add(d);let g=(v,M)=>{d.material=v,e.setRenderTarget(M),e.render(_,m)},y={renderer:e,U:n,fx:u,scale:.54,outW:4,outH:4,sceneW:4,sceneH:4,fps:60,ms:16.7,lowT:0,auto:!0,calls:0,tris:0,clear:new je(0,0,0),calibration:"",winT:0,winN:0,grace:0,resize(v,M){y.outW=v,y.outH=M,e.setSize(v,M,!1),y.setScale(y.scale)},setScale(v){y.scale=v;let M=Math.max(64,Math.round(y.outW*v/4)*4),b=Math.max(36,Math.round(y.outH*v/4)*4);y.sceneW=M,y.sceneH=b,r.setSize(M,b),a.setSize(M>>1,b>>1),o.setSize(M>>2,b>>2),l.setSize(M>>2,b>>2),h.uniforms.uTexel.value.set(1/M,1/b),p.uniforms.uSceneRes.value.set(M,b),p.uniforms.uOutRes.value.set(y.outW,y.outH)},render(v,M,b,w){e.info.reset(),e.setRenderTarget(r),y.clear.setRGB(n.uFog.value.x*.6,n.uFog.value.y*.6,n.uFog.value.z*.6),e.setClearColor(y.clear,1),e.clear(!0,!0,!1),e.render(v,M),b&&(e.clearDepth(),e.render(b,w)),g(h,a),f.uniforms.tSrc.value=a.texture,f.uniforms.uDir.value.set(1/(y.sceneW>>2),0),g(f,o),f.uniforms.tSrc.value=o.texture,f.uniforms.uDir.value.set(0,1/(y.sceneH>>2)),g(f,l),g(p,null),y.calls=e.info.render.calls,y.tris=e.info.render.triangles},calibrate(v,M,b=1){let w=new Uint8Array(4),x=R=>{let C=performance.now();for(let D=0;D<R;D++)v();return t.readPixels(0,0,1,1,t.RGBA,t.UNSIGNED_BYTE,w),(performance.now()-C)/R};x(2);let S=[],P=di.at(-1);for(let R=di.length-1;R>=0&&di[R]<=b;R--){y.setScale(di[R]),x(1);let C=x(3);if(S.push(`${di[R]}:${C.toFixed(1)}`),C>M)break;P=di[R]}return y.setScale(P),y.calibration=S.join(" "),P},tick(v,M){if(y.ms+=(v*1e3-y.ms)*.08,y.fps=1e3/y.ms,!y.auto)return;if(y.grace>0){y.grace-=v;return}y.lowT=y.fps<M*.83?y.lowT+v:Math.max(0,y.lowT-v*.5),y.winT+=v,y.winN++;let b=y.winT>=4&&y.winN/y.winT<M*.93,w=di.indexOf(y.scale);y.winT>=4&&(y.winT=0,y.winN=0),(y.lowT>1.5||b)&&w>=0&&w<di.length-1&&(y.setScale(di[w+1]),y.settle(3))},settle(v=5){y.grace=v,y.lowT=0,y.winT=0,y.winN=0}};return y}var Ci={call:"This is an automated call from your pager. You have one triggered incident on service: production. Press enter to acknowledge.",ack:"Incident acknowledged. Good luck.",w1:"Incident twenty thirty-one. Severity three. Zombie processes on node three.",w2:"Incident twenty thirty-two. Fork bomb in the C I runner. Sig kill unlocked.",w3:"Incident twenty thirty-three. Cron storm. They fire every three seconds.",w4:"Incident twenty thirty-four. Denial of service on the ingress. Grep unlocked.",w5:"Incident twenty thirty-five. Race condition. Terminate both threads together.",w6:"Incident twenty thirty-six. Memory leak. Kill it before it runs out of memory.",w7:"Incident twenty thirty-seven. Heisenbug. It moves when observed. R M dash R F unlocked.",w8:"Incident twenty thirty-eight. Severity one. Cascading failure.",w9:"Incident twenty thirty-nine. Everything is on fire.",boss:"Root cause found. Legacy billing monolith. Last deployed: on a Friday.",shield:"The monolith is shielded by its dependencies. Remove them.",shieldDown:"Dependencies removed. The monolith is exposed.",phase3:"Warning. The monolith is loading more dependencies.",bossDead:"Monolith terminated. Exit code one three seven.",clear:"Incident resolved.",hotfix:"A hotfix is available. Choose one.",act2:"Migrating to the message queue.",act3:"Migrating to the primary database.",rate:"Rate limit exceeded.",budget50:"Warning. Error budget at fifty percent.",budget25:"Warning. Your error budget is almost gone.",rollback:"Rollback complete.",sudoReady:"Sudo is available.",sudo:"Sudo granted. With great power comes great responsibility.",hot:"You are standing in the hot aisle.",breaker:"Circuit breaker tripped.",combo:"Auto remediation streak.",dead:"Connection lost. The on-call engineer is not responding. Escalating.",win:"All incidents resolved. The sun is coming up. You can go back to sleep.",postmortem:"This postmortem is blameless.",night:"Night shift. There is always another incident.",idle:"Are you still there? Production is still down."};var fd="Hello fable 5.2! You are 1 day old. I am curious what can you do, so let's do a simple test: using gpu-serv for builds/test -> build a three.js shooter game. You have only 1 try. This laptop should handle your game at least 30 fps, 60 fps ideally. What to include to your game decide only you (story, style, weapons, feel, music, etc.). There is no time limit. You can use other models only if you RUN THEM LOCALLY on gpu-serv - for instance minimax h3, or etc. Suprise me!",Mc="https://github.com/Petyok/blameless",bc=["[03:07:12.412] WARN  kubelet: PLEG is not healthy: pleg was last seen active 3m12s ago","[03:07:12.901] ERROR nginx: upstream timed out (110: Connection timed out)","[03:07:13.007] FATAL java.lang.OutOfMemoryError: Java heap space","[03:07:13.007]   at com.legacy.billing.Monolith.doEverything(Monolith.java:14892)","[03:07:13.118] INFO  systemd[1]: Started Session 4821 of user root.","[03:07:13.552] WARN  etcd: apply request took too long (2.31s)","[03:07:14.019] ERROR postgres: FATAL: sorry, too many clients already","[03:07:14.230] kernel: Out of memory: Killed process 4821 (java)","[03:07:14.777] INFO  cron[212]: (root) CMD (/opt/cleanup.sh >/dev/null 2>&1)","[03:07:15.003] WARN  haproxy: backend api has no server available!","[03:07:15.418] ERROR redis: MISCONF Redis is configured to save RDB snapshots","[03:07:15.902] INFO  sshd[991]: Accepted publickey for oncall from 10.0.3.7","[03:07:16.144] WARN  disk /var/log is 97% full","[03:07:16.650] ERROR rabbitmq: connection_closed_abruptly (queue depth 1482004)","[03:07:17.201] FATAL panic: runtime error: invalid memory address or nil pointer","[03:07:17.333] INFO  deploy: release v2.31.7-friday-hotfix-final-2 is live","[03:07:17.900] WARN  certmanager: certificate expires in 0 days","[03:07:18.276] ERROR dns: SERVFAIL resolving api.internal (it is always DNS)","[03:07:18.811] INFO  autoscaler: scaling replicas 3 -> 48","[03:07:19.090] WARN  jvm: GC overhead limit exceeded (98% of time in GC)","[03:07:19.634] ERROR segfault at 0 ip 00007f3a error 4 in libc.so.6","[03:07:20.002] INFO  pager: escalation policy level 1: you","[03:07:20.460] WARN  ntp: clock skew detected: 37.2 s","[03:07:20.999] ERROR fork: retry: Resource temporarily unavailable",'[03:07:21.512] INFO  grafana: alert "Everything" changed state to alerting',"[03:07:22.070] WARN  TODO: remove this before prod (2017)","[03:07:22.648] ERROR 502 Bad Gateway  GET /healthz  upstream=legacy-billing","[03:07:23.127] INFO  backup: last successful backup: never","[03:07:23.700] WARN  thread pool exhausted, 4096 tasks queued","[03:07:24.215] ERROR race detected: write at 0x00c0001a2f10 by goroutine 7","[03:07:24.888] FATAL too many open files",'[03:07:25.301] INFO  slack: #incidents: "is it just me or is prod down?"',"[03:07:25.960] WARN  kernel: TCP: request_sock_TCP: Possible SYN flooding on port 443","[03:07:26.400] ERROR works on my machine"],Bx={term:"kill -15",kill:"kill -9",grep:"grep -r",rm:"rm -rf",oom:"oom-killer",breaker:"breaker",boss:"kill -9"},Gx={term:"terminated",kill:"killed",grep:"matched",rm:"removed",oom:"collateral",breaker:"tripped",boss:"decommissioned"},pd={zombie:"<defunct>",fork:":(){:|:&};:",cron:"*/3 * * * *",packet:"SYN",race:"thread",leak:"leak",heisen:"heisenbug",brute:"oom_reaper",pylon:"dependency",boss:"legacy-billing-monolith.jar"};function md(i){let e=1e3+i.id*7919%9e3;return`${Bx[i.src]||"kill"} ${e}  # ${i.name} ${Gx[i.src]||"gone"}`}var gd={w2:"Incident 2032. Fork bomb in the CI runner. SIGKILL unlocked.",w4:"Incident 2034. Denial of service on the ingress. grep unlocked.",w7:"Incident 2037. Heisenbug. It moves when observed. rm -rf unlocked.",bossDead:"Monolith terminated. Exit code 137."},xd=[["ssh oncall@bastion.prod",500,!0],["Last login: Fri 17:58 from 10.0.3.7 (dave)",250],["oncall@bastion:~$ kubectl get pods -A | grep -v Running | wc -l",450,!0],["1482",500],["oncall@bastion:~$ kubectl exec -it self -n prod -- /bin/sh",600,!0],["warning: you are about to enter production in person.",350],["warning: there is no ammo here. only rate limits.",350],["warning: what dies here is logged.",700],["/ # _",0]],vd=[["WASD","move"],["MOUSE","aim"],["LMB","fire (hold)"],["1-4 / WHEEL","weapons"],["SPACE","jump"],["SHIFT","dash (brief invulnerability)"],["Q / RMB","rollback: rewind yourself 3 s"],["F","sudo, when charged"],["ESC","pause"]],_d=["No ammo. Every weapon has a rate limit: switch before you hit 429.","Holstered weapons cool down faster.","Rollback (Q) restores the error budget you had 3 seconds ago.","Rack tops are the hot aisle. Do not stand there.","A cron job fires when its hand reaches twelve.","Kill both threads of a race condition within two seconds.","A heisenbug moves when you look at it. Flick, do not track.","Memory leaks are harmless when small.","Jump over the monolith's beams. Or dash through them.","Coffee restores error budget."],Sr=i=>String(i).padStart(2,"0");function Sc(i){let e=Math.floor(11232+i*8);return`${Sr(Math.floor(e/3600)%24)}:${Sr(Math.floor(e/60)%60)}:${Sr(e%60)}`}var wr=i=>`${Sr(Math.floor(i/60))}:${Sr(Math.floor(i%60))}`;function yd(i,e,t){let n=i.stats,s=n.kills,r=n.shots?Math.round(100*n.hits/n.shots):0,a=Object.entries(n.byCause).sort((h,f)=>f[1]-h[1])[0],o=Object.entries(t).sort((h,f)=>f[1]-h[1])[0],l=[`${n.killsTotal} processes terminated. ${s.zombie||0} of them were already dead.`,"Detection time: 0 s. The pager works. Unfortunately.",r>=60?`Accuracy ${r}%. Suspiciously good. Was this a bot?`:r>=35?`Accuracy ${r}%. Within the SLO.`:`Accuracy ${r}%. The racks will need replacing.`,n.bestCombo>=20?`Longest auto-remediation streak: ${n.bestCombo}.`:null,n.rollbacks?`${n.rollbacks} rollback${n.rollbacks>1?"s":""}. All of them worked, which has never happened before.`:null,i.perkLog.length?`${i.perkLog.length} hotfixes shipped straight to production, untested.`:null],c=[e?`The on-call engineer was terminated ${e} time${e>1?"s":""}${o?`, mostly by ${o[0]}`:""}.`:"Nothing. Nobody will believe this.",a?`Most of the error budget (${Math.round(a[1])}%) was burned by ${a[0]}.`:null,n.hotTime>3?`${n.hotTime.toFixed(0)} s were spent standing in the hot aisle.`:null,n.overheats>2?`Rate limits were hit ${n.overheats} times. Read the 429.`:null,n.revived?`${n.revived} thread${n.revived>1?"s":""} came back because its twin was still running.`:null,n.collateral?`${n.collateral} process${n.collateral>1?"es were":" was"} killed by a memory leak. We are counting that as a feature.`:null,n.blinks>12?`The heisenbug was observed ${n.blinks} times and reproduced 0 times.`:null,n.coffee?`${n.coffee} coffee${n.coffee>1?"s":""} consumed.`:"No coffee was consumed. Concerning."];return{title:`POSTMORTEM  INC-${Et[0].inc}..${Et.at(-1).inc}`,meta:[["status","resolved"],["severity",pn[i.sev].name],["duration",wr(n.time)],["resolved at",Sc(n.time)],["score",String(i.score)],["on-call","you (alone)"]],summary:"At 03:07 production went down. One engineer was paged. The engineer entered production in person and removed the problem by hand.",cause:"A change to legacy-billing-monolith.jar was deployed on Friday at 17:58 by \u2588\u2588\u2588\u2588. The change was reviewed by \u2588\u2588\u2588\u2588. The tests were skipped by \u2588\u2588\u2588\u2588.",well:l.filter(Boolean),poorly:c.filter(Boolean),actions:["Stop deploying on Fridays.","Delete the monolith (estimate: Q3 2031).","Add a second person to the on-call rotation.","Buy the on-call engineer a coffee."],sign:"This postmortem is blameless.  (It was Dave.)"}}var Oo=1,Md='"JetBrains Mono", "Fira Code", "DejaVu Sans Mono", "Liberation Mono", Menlo, Consolas, monospace',Tr=i=>({uTime:i.uTime,uFog:i.uFog,uFogD:i.uFogD,uAccent:i.uAccent,uBass:i.uBass,uLightPos:i.uLightPos,uLightCol:i.uLightCol});function Vx(){let t=document.createElement("canvas");t.width=1024,t.height=642;let n=t.getContext("2d");n.fillStyle="#000",n.fillRect(0,0,t.width,t.height),n.fillStyle="#fff",n.font=`bold 92px ${Md}`,n.textAlign="center",n.textBaseline="middle";for(let r=0;r<96;r++)n.fillText(String.fromCharCode(32+r),(r%16+.5)*64,((r>>4)+.52)*107,62);let s=new vs(t);return s.minFilter=En,s.magFilter=Mt,s}function Hx(){let i=document.createElement("canvas");i.width=i.height=1024;let e=i.getContext("2d");e.fillStyle="#000",e.fillRect(0,0,1024,1024),e.font=`bold 21px ${Md}`,e.textBaseline="top";for(let n=0;n<34;n++){let s=bc[n%bc.length];e.fillStyle=/ERROR|FATAL|panic|Killed/.test(s)?"#fff":/WARN/.test(s)?"#bbb":"#777",e.fillText(s,6+n*37%60,n*30+5)}let t=new vs(i);return t.wrapS=t.wrapT=fs,t.minFilter=En,t.magFilter=Mt,t}function ko(i,e,t,n=!1){let s=new sr;s.index=i.index;for(let r of["position","normal","uv"])s.setAttribute(r,i.attributes[r]);for(let[r,a,o]of e){let l=new js(a,o);n&&l.setUsage(Xl),s.setAttribute(r,l)}return s.instanceCount=t,s}function bd(i,e,t){if(i.instanceCount=e,!!e)for(let n of t){let s=i.attributes[n];s.clearUpdateRanges(),s.addUpdateRange(0,e*s.itemSize),s.needsUpdate=!0}}var Ki=class{constructor(e,t,n){this.max=e,this.n=0,this.m=new Float32Array(e*16),this.c=new Float32Array(e*4),this.f=new Float32Array(e*4),this.geo=ko(new Xn(1,1,1),[["iM",this.m,16],["iCol",this.c,4],["iFx",this.f,4]],0,!0),this.mesh=new Ft(this.geo,new Ot({...ad,uniforms:Tr(t),defines:n?{ADD:1}:{},...n?{blending:Ss,depthWrite:!1,transparent:!0}:{}})),this.mesh.frustumCulled=!1,this.x=this.y=this.z=0,this.yaw=0,this.cs=1,this.sn=0,this.s=1,this.flash=0,this.flicker=0}begin(){this.n=0}base(e,t,n,s=0,r=1,a=0,o=0){this.x=e,this.y=t,this.z=n,this.yaw=s,this.cs=Math.cos(s),this.sn=Math.sin(s),this.s=r,this.flash=a,this.flicker=o}box(e,t,n,s,r,a,o,l,c,h=0,f=0,u=0,p=0){if(this.n>=this.max)return;let d=this.m,_=this.n*16,m=this.n*4,g=this.s,y=this.yaw+u,v=Math.cos(y),M=Math.sin(y),b=Math.cos(f),w=Math.sin(f),x=Math.cos(p),S=Math.sin(p);s*=g,r*=g,a*=g,d[_]=(v*x+M*w*S)*s,d[_+1]=b*S*s,d[_+2]=(-M*x+v*w*S)*s,d[_+3]=0,d[_+4]=(-v*S+M*w*x)*r,d[_+5]=b*x*r,d[_+6]=(M*S+v*w*x)*r,d[_+7]=0,d[_+8]=M*b*a,d[_+9]=-w*a,d[_+10]=v*b*a,d[_+11]=0,d[_+12]=this.x+(e*this.cs+n*this.sn)*g,d[_+13]=this.y+t*g,d[_+14]=this.z+(-e*this.sn+n*this.cs)*g,d[_+15]=1,this.c[m]=o,this.c[m+1]=l,this.c[m+2]=c,this.c[m+3]=h,this.f[m]=this.flash,this.f[m+1]=0,this.f[m+2]=this.flicker,this.f[m+3]=0,this.n++}beam(e,t,n,s,r,a,o,l,c,h,f=1){if(this.n>=this.max)return;let u=s-e,p=r-t,d=a-n,_=Math.hypot(u,p,d);if(_<1e-6)return;u/=_,p/=_,d/=_;let m,g,y;Math.abs(p)>.99?(m=0,g=d,y=-p):(m=d,g=0,y=-u);let v=Math.hypot(m,g,y);m/=v,g/=v,y/=v;let M=p*y-d*g,b=d*m-u*y,w=u*g-p*m,x=this.m,S=this.n*16,P=this.n*4;x[S]=m*o,x[S+1]=g*o,x[S+2]=y*o,x[S+3]=0,x[S+4]=M*o,x[S+5]=b*o,x[S+6]=w*o,x[S+7]=0,x[S+8]=u*_,x[S+9]=p*_,x[S+10]=d*_,x[S+11]=0,x[S+12]=(e+s)/2,x[S+13]=(t+r)/2,x[S+14]=(n+a)/2,x[S+15]=1,this.c[P]=l,this.c[P+1]=c,this.c[P+2]=h,this.c[P+3]=f,this.f[P]=this.f[P+1]=this.f[P+2]=this.f[P+3]=0,this.n++}end(){bd(this.geo,this.n,["iM","iCol","iFx"])}},wc=class{constructor(e,t,n){this.max=e,this.n=0,this.p=new Float32Array(e*4),this.c=new Float32Array(e*4),this.g=new Float32Array(e*2);let s=new wn;s.setIndex([0,1,2,2,1,3]),s.setAttribute("position",new Yt(new Float32Array([-.5,-.5,0,.5,-.5,0,-.5,.5,0,.5,.5,0]),3)),s.setAttribute("normal",new Yt(new Float32Array(12),3)),s.setAttribute("uv",new Yt(new Float32Array([0,0,1,0,0,1,1,1]),2)),this.geo=ko(s,[["iPos",this.p,4],["iCol",this.c,4],["iGlyph",this.g,2]],0,!0),this.mesh=new Ft(this.geo,new Ot({...od,uniforms:{...Tr(t),tGlyph:{value:n}},blending:Ss,depthWrite:!1,transparent:!0})),this.mesh.frustumCulled=!1,this.mesh.renderOrder=2}begin(){this.n=0}add(e,t,n,s,r,a,o,l,c,h=0){if(this.n>=this.max||c<=32)return;let f=this.n*4,u=this.n*2;this.p[f]=e,this.p[f+1]=t,this.p[f+2]=n,this.p[f+3]=s,this.c[f]=r,this.c[f+1]=a,this.c[f+2]=o,this.c[f+3]=l,this.g[u]=c-32,this.g[u+1]=h,this.n++}text(e,t,n,s,r,a,o,l,c,h,f){let u=r*.6,p=-(e.length-1)/2*u;for(let d=0;d<e.length;d++){let _=p+d*u;this.add(t+h*_,n,s+f*_,r,a,o,l,c,e.charCodeAt(d))}}end(){bd(this.geo,this.n,["iPos","iCol","iGlyph"])}};function Sd(i){let e=i.U,t=new ai,n={glyph:Vx(),logs:Hx()},s={scene:t,boxes:new Ki(900,e,!1),glow:new Ki(400,e,!0),glyphs:new wc(2600,e,n.glyph),floor:null,blocks:null,setWorld(o){for(let m of[s.floor,s.blocks])m&&(t.remove(m),m.geometry.dispose());let l=[],c=[],h=[],f=[],u=2/Oo,p=o.map*7919+17,d=()=>(p=p*1103515245+12345&2147483647,p/2147483647);for(let m=0;m<o.w*o.h;m++){let g=o.ox+m%o.w*2,y=o.oz+(m/o.w|0)*2,v=o.kind[m];if(v===0)for(let M=0;M<u;M++)for(let b=0;b<u;b++)l.push(g+(M+.5)*Oo,y+(b+.5)*Oo,d());else{let M=v===1?2.8:16,b=v===1?2*.955:2;c.push(g+2/2,M/2,y+2/2),h.push(b,M,b),f.push(v-1,v===1?d():0)}}let _=new Xn(1,1,1);_.translate(0,-.5,0),s.floor=new Ft(ko(_,[["iTile",new Float32Array(l),3]],l.length/3),new Ot({...sd,uniforms:{...Tr(e),uRip:e.uRip,uTile:{value:Oo}}})),s.blocks=new Ft(ko(new Xn(1,1,1),[["iPos",new Float32Array(c),3],["iSize",new Float32Array(h),3],["iKind",new Float32Array(f),2]],f.length/2),new Ot({...rd,uniforms:{...Tr(e),tLogs:{value:n.logs},uAlarm:e.uAlarm}}));for(let m of[s.floor,s.blocks])m.frustumCulled=!1,t.add(m)}},r=new wn;r.setIndex([0,2,1,2,3,1]),r.setAttribute("position",new Yt(new Float32Array([-140,15,-140,140,15,-140,-140,15,140,140,15,140]),3));let a=new Ft(r,new Ot({...ld,uniforms:Tr(e),side:Tn}));return a.frustumCulled=!1,t.add(a,s.boxes.mesh,s.glow.mesh,s.glyphs.mesh),s}var Ls=Math.PI*2,wd=i=>{let e=Math.sin(i*127.1)*43758.5453;return e-Math.floor(e)},Td="ERROR 500 ",Ed=["java.lang.OutOfMemoryError","at Monolith.doEverything()","// TODO: rewrite (2011)","DO NOT TOUCH - it works"],Wx={zombie(i,e,t,n){let s=t*7+e.seed*20,r=Math.sin(s)*.55,a=e.atkT>0?.7:Math.sin(s*.5)*.1,o=n[0],l=n[1],c=n[2];i.box(-.14,.42,0,.18,.84,.2,o*.6,l*.6,c*.6,0,r),i.box(.14,.42,0,.18,.84,.2,o*.6,l*.6,c*.6,0,-r),i.box(0,1.14,-.06,.5,.66,.28,o,l,c,0,-.24),i.box(-.3,1.34,-.42,.12,.12,.62,o,l,c,0,a),i.box(.3,1.34,-.42,.12,.12,.62,o,l,c,0,a*.8+.08),i.box(0,1.66,-.14,.3,.3,.3,o,l,c,.05,0,0,Math.sin(t*2+e.seed*9)*.28),i.box(0,1.68,-.3,.2,.05,.03,1,.25,.15,2)},fork(i,e,t,n){let s=Math.abs(Math.sin(t*6+e.seed*9))*.35,r=t*1.6+e.seed*6,a=n[0],o=n[1],l=n[2];i.box(0,.62+s,0,.8,.8,.8,a,o,l,.08,0,r),i.box(0,.62+s,0,.05,.86,.86,1,.9,.6,1.4,0,r),i.box(-.36,1.28+s,0,.16,.7,.16,a,o,l,.3,0,r,.5),i.box(.36,1.28+s,0,.16,.7,.16,a,o,l,.3,0,r,-.5),i.box(-.25,.08,0,.22,.16,.3,a*.5,o*.5,l*.5),i.box(.25,.08,0,.22,.16,.3,a*.5,o*.5,l*.5)},cron(i,e,t,n){let s=e.t/Qe.cron.period*Ls,r=e.tele||e.vol>0,a=r?1.3:.12,o=n[0],l=n[1],c=n[2],h=r?Math.sin(t*70)*.04:0;i.box(h,.6,0,1.1,1.1,.16,o*.45,l*.45,c*.45,a*.5),i.box(0,1.06,-.1,.08,.16,.04,1,1,1,1.5),i.box(0,.14,-.1,.06,.12,.04,o,l,c,.6),i.box(-.46,.6,-.1,.12,.06,.04,o,l,c,.6),i.box(.46,.6,-.1,.12,.06,.04,o,l,c,.6),i.box(-Math.sin(s)*.23+h,.6+Math.cos(s)*.23,-.13,.07,.46,.04,1,.95,.7,1.2+a,0,0,s),i.box(-Math.sin(t*.4)*.13,.6+Math.cos(t*.4)*.13,-.12,.08,.26,.04,o,l,c,.5,0,0,t*.4),i.box(0,-.12,0,.12,.3,.12,o*.5,l*.5,c*.5,0,0,0,Math.sin(t*3+e.seed*7)*.5)},packet(i,e,t,n){i.box(0,.24,0,.44,.26,.6,n[0],n[1],n[2],.4,0,0,Math.sin(t*9+e.seed*30)*.5),i.box(0,.24,.55,.08,.08,.55,n[0]*.6,n[1]*.6,n[2]*.6,.2)},race(i,e,t,n,s){let r=e.variant?Qe.race.colorB:n,a=r[0],o=r[1],l=r[2];if(e.state==="down"){let f=e.t/Qe.race.window;i.box(0,.12,0,1.3,.2,.4,a*.4,o*.4,l*.4,.1+.4*(Math.sin(t*20)>0?1:0),0,e.seed*6),s.box(0,.3+f*.8,0,.1,f*1.6,.1,1,1,1,.9);return}let c=t*15+e.seed*20,h=Math.sin(c)*.9;i.box(-.1,.5,0,.14,1,.16,a*.7,o*.7,l*.7,0,h),i.box(.1,.5,0,.14,1,.16,a*.7,o*.7,l*.7,0,-h),i.box(0,1.3,-.15,.34,.8,.22,a,o,l,.15,-.45),i.box(0,1.78,-.36,.24,.24,.24,a,o,l,.3,-.3),i.box(0,1.4,.5,.06,.06,.9,a,o,l,.8),i.box(0,1.05,.42,.05,.05,.7,a,o,l,.6)},leak(i,e,t,n){let s=e.r,r=e.state==="oom",a=r&&Math.sin(t*44)>0,o=1.25*s*(1+Math.sin(t*(r?30:3)+e.seed*7)*(r?.1:.05)),l=a?1:n[0],c=a?1:n[1],h=a?1:n[2];i.box(0,s,0,o,o,o,l,c,h,r?1.2:.25,.62,t*.7,.62);let f=Math.min(8,2+Math.floor((s-.5)/.25));for(let u=0;u<f;u++){let p=t*1.3+u*Ls/f,d=.3*s;i.box(Math.cos(p)*s*1.2,s+Math.sin(p*1.7+u)*s*.45,Math.sin(p)*s*1.2,d,d,d,l*.8,c*.8,h*.8,.5,t+u,t*2+u)}},heisen(i,e,t,n){let s=e.blinkCd>0,r=s?0:.11,a=f=>(wd(Math.floor(t*30)+f*17+e.seed*99)-.5)*2*r,o=s?1:n[0],l=s?.95:n[1],c=s?1:n[2],h=s?.7:.1;i.box(-.14+a(1),.32,a(2),.16,.64,.18,o*.7,l*.7,c*.7,h),i.box(.14+a(3),.32,a(4),.16,.64,.18,o*.7,l*.7,c*.7,h),i.box(a(5),1.05+a(6),a(7),.5,.86,.3,o,l,c,h),i.box(-.36+a(8),1.1,a(9),.12,.7,.14,o,l,c,h),i.box(.36+a(10),1.1,a(11),.12,.7,.14,o,l,c,h),i.box(a(12),1.66+a(13),a(14),.34,.34,.34,o,l,c,h+.3),i.box(0,2.1+Math.sin(t*4)*.06,0,.14,.14,.14,1,1,1,1.5,t*2,t*3)},brute(i,e,t,n){let s=e.state,r=t*5+e.seed*9,a=s==="run"?Math.sin(r)*.4:s==="charge"?Math.sin(t*22)*.7:0,o=s==="charge"?-.6:s==="windup"?.28:s==="stun"?.45:-.1,l=s==="windup"?.86:s==="stun"?.72:1,c=s==="windup"||s==="charge",h=n[0],f=n[1],u=n[2];i.box(-.4,.5,0,.5,1,.55,h*.5,f*.5,u*.5,0,a),i.box(.4,.5,0,.5,1,.55,h*.5,f*.5,u*.5,0,-a),i.box(0,1.65*l,-.1,1.6,1.15,.95,h,f,u,c?.35:.05,o),i.box(-1.05,1.3*l,-.1,.5,1.4,.6,h*.8,f*.8,u*.8,0,o-a),i.box(1.05,1.3*l,-.1,.5,1.4,.6,h*.8,f*.8,u*.8,0,o+a),i.box(0,2.32*l,-.45,.5,.45,.5,h*.7,f*.7,u*.7,0,o),i.box(-.13,2.35*l,-.72,.1,.07,.03,1,.9,.3,c?3:1.5),i.box(.13,2.35*l,-.72,.1,.07,.03,1,.9,.3,c?3:1.5),i.box(.1,2.25*l,.55,2.6,.1,.1,.75,.75,.8,.2,0,0,.55),i.box(-.95,2.95*l,.55,.14,.6,.1,.9,.9,1,.6,0,0,-.5)},pylon(i,e,t,n,s,r){let a=n[0],o=n[1],l=n[2];for(let h=0;h<4;h++){let f=.95-h*.13;i.box(0,.48+h*.95,0,f,.8,f,a*.6,o*.6,l*.6,.1,0,t*(h%2?.9:-.9)+h)}i.box(0,4.25,0,.42,.42,.42,a,o,l,1.4,t*1.1,t*1.7);let c=r.enemies.find(h=>h.type==="boss");c&&s.beam(e.x,4.25,e.z,c.x,6.6,c.z,.07+.03*Math.sin(t*20+e.seed*9),a,o,l,.7)},boss(i,e,t,n,s,r,a,o){let l=e.state==="dying",c=l?e.t/He.deathTime:0,h=e.state==="intro"?-9.2*(1-Math.min(1,e.t/(He.intro-.5)))**2:-c*3,f=l?(wd(t*40)-.5)*.25:0;if(i.box(f,4.5+h,0,4,9,1,.3,.035,.06,0,c*.3,0,c*.2),!l)for(let u=0;u<7;u++)i.box(0,1+u*1.15+h,-.51,3.7,.05,.04,1,.1,.13,.35+.5*(Math.sin(t*2+u*1.7)>.6?1:0));if(i.box(0,.16,0,5.2,.32,2.2,n[0]*.25,n[1]*.25,n[2]*.25,.05),l||i.box(Math.sin(t*1.3)*1.2,6.6+h,-.52,1,.2,.06,1,.12,.14,2.6),e.shield&&e.state!=="intro")for(let u=0;u<6;u++){let p=t*.5+u*Ls/6,d=p+Ls/6,_=3.3;s.beam(e.x+Math.cos(p)*_,0,e.z+Math.sin(p)*_,e.x+Math.cos(p)*_,9.2,e.z+Math.sin(p)*_,.09,.2,.9,.8,.45);for(let m of[.2,9.1])s.beam(e.x+Math.cos(p)*_,m,e.z+Math.sin(p)*_,e.x+Math.cos(d)*_,m,e.z+Math.sin(d)*_,.07,.2,.9,.8,.45)}for(let u=0;u<e.beamN;u++){let p=e.beamA+u*Ls/e.beamN,d=Math.cos(p),_=Math.sin(p),m=e.beamLen[u];s.beam(e.x+d*e.r,He.beamY,e.z+_*e.r,e.x+d*m,He.beamY,e.z+_*m,.26,1,.1,.16,1.3),s.beam(e.x+d*e.r,He.beamY,e.z+_*e.r,e.x+d*m,He.beamY,e.z+_*m,.08,1,.8,.8,2)}if(e.state==="fight"){let u=-Math.sin(e.yaw)*.62,p=-Math.cos(e.yaw)*.62;for(let d=0;d<3;d++)a.text(Ed[(d+Math.floor(t*.4))%Ed.length],e.x+u,4.9-d*.8,e.z+p,.42,1,.3,.25,1,o.rx,o.rz)}}};function Ad(i,e,t,n){let s=i.boxes,r=i.glow,a=i.glyphs,o=e.enemies;for(let l=0;l<o.length;l++){let c=o[l];if(c.dead)continue;let h=Qe[c.type].color,f=c.spawnT>0?1-Math.min(1,c.spawnT/.6):1,u=(c.type==="fork"?c.r/.75:1)*(.25+.75*f);s.base(c.x,c.y,c.z,c.yaw,u,c.flash>0?.75:0,f<1||c.type==="heisen"&&c.blinkCd<=0?1+c.seed:0),r.base(c.x,c.y,c.z,c.yaw,1),Wx[c.type](s,c,t,h,r,e,a,n),f<1&&r.box(0,5,0,.12+.4*(1-f),10,.12+.4*(1-f),h[0],h[1],h[2],.5*(1-f));let p=Math.hypot(c.x-n.x,c.z-n.z);if(p<26&&c.type!=="packet"&&c.state!=="down"&&f>=1){let d=c.type==="pylon"?c.name:pd[c.type];c.type==="race"?d=c.name:c.type==="leak"?d=c.state==="oom"?"OOM":`${(c.r/Qe.leak.rMax*8).toFixed(1)}G/8G`:c.type==="heisen"&&c.blinkCd<=0&&(d="???");let _=Math.min(1,(26-p)/8)*(c.type==="boss"?1:.7),m=c.type==="cron"?1.6:c.h+.35;a.text(d,c.x,c.y+m,c.z,c.type==="boss"?.5:.2,h[0],h[1],h[2],_,n.rx,n.rz)}if(c.type==="brute"&&c.state==="stun")for(let d=0;d<3;d++)a.add(c.x+Math.cos(t*5+d*2.1)*.7,2.9,c.z+Math.sin(t*5+d*2.1)*.7,.4,1,1,.4,1,42,t*3);if(c.type==="race"&&c.variant===0){let d=o.find(_=>_.id===c.twin&&!_.dead);if(d){let _=c.state==="down"||d.state==="down",m=_?Math.sin(t*30)>0?1:.1:.35;r.beam(c.x,c.state==="down"?.2:1.3,c.z,d.x,d.state==="down"?.2:1.3,d.z,.04,_?1:.6,_?1:.5,1,m)}}}for(let l of e.shots)if(l.kind===2){let c=(Math.round(Math.atan2(l.vz,l.vx)/Ls*He.ringShots)%10+10)%10;a.add(l.x,l.y+.15,l.z,1,1,.2,.25,1,Td.charCodeAt(c)===32?35:Td.charCodeAt(c)),r.base(l.x,l.y,l.z,0,1),r.box(0,0,0,.2,.2,.2,1,.15,.2,.9,t*5,t*7)}else{let c=l.kind===0?Qe.cron.color:l.kind===1&&l.cause==="a heisenbug"?Qe.heisen.color:Qe.boss.color;a.add(l.x,l.y,l.z,.75,c[0],c[1],c[2],1,l.kind===0?42:l.cause==="a heisenbug"?63:120,t*9),r.base(l.x,l.y,l.z,0,1),r.box(0,0,0,.16,.16,.16,c[0],c[1],c[2],1,t*6,t*8)}for(let l of e.rockets){let c=Math.hypot(l.vx,l.vy,l.vz),h=l.vx/c,f=l.vy/c,u=l.vz/c;s.beam(l.x-h*.3,l.y-f*.3,l.z-u*.3,l.x+h*.3,l.y+f*.3,l.z+u*.3,.16,1,.3,.42,.5),r.beam(l.x-h*.9,l.y-f*.9,l.z-u*.9,l.x-h*.3,l.y-f*.3,l.z-u*.3,.1,1,.6,.2,1.2)}for(let l of e.pickups){if(l.t<5&&Math.sin(t*16)>.2)continue;let c=l.y+Math.sin(t*3+l.x)*.08;s.base(l.x,c,l.z,t*2,1),s.box(0,0,0,.3,.34,.3,.95,.9,.8,.5),s.box(.21,0,0,.1,.18,.07,.95,.9,.8,.5),s.box(0,.16,0,.24,.04,.24,.45,.25,.1,.8);for(let h=0;h<2;h++){let f=(t*.6+h*.5+l.x)%1;a.add(l.x+Math.sin(t*2+h)*.06,c+.35+f*.5,l.z,.3,1,1,1,.6*(1-f),126)}}}var zo=Math.PI*2,it=(i=1,e)=>e===void 0?Math.random()*i:i+Math.random()*(e-i),Xx="0123456789ABCDEF",Rd={rm:[1,.45,.2],oom:[.8,.3,1],breaker:[.3,.9,1],boss:[1,.2,.25]};function Cd(i,e){let t=[],n=[],s=[],r=[],a=e.U,o=0,l={trauma:0,kick:0,kickV:0,fov:0,dip:0,hurt:0,glitch:0,flash:0,rewind:0,alarm:0,sudo:0,tint:0,muzzle:0,swap:1,ripple(c,h,f){a.uRip.value[o].set(c,h,a.uTime.value,f),o=(o+1)%8},light(c,h,f,u,p,d=.25,_=1){r.length<24&&r.push({x:c,y:h,z:f,radius:u,r:p[0]*_,g:p[1]*_,b:p[2]*_,life:d,max:d})},glyph(c,h,f,u,p,d){t.length>=1500||t.push({x:c,y:h,z:f,code:u,r:p[0],g:p[1],b:p[2],vx:d.vx||0,vy:d.vy||0,vz:d.vz||0,life:d.life||.8,max:d.life||.8,size:d.size||.3,grav:d.grav??12,drag:d.drag??1.2,rot:d.rot||0,vr:d.vr||0,floor:d.floor??!0})},burst(c,h,f,u,p,d,_,m={}){for(let g=0;g<u;g++){let y=it(zo),v=it(-.3,1),M=_*it(.35,1),b=Math.sqrt(1-Math.min(1,v*v));l.glyph(c+it(-.2,.2),h+it(-.2,.2),f+it(-.2,.2),p.charCodeAt(m.pick?Math.random()*p.length|0:g%p.length),d,{vx:Math.cos(y)*b*M,vy:v*M+(m.up||0),vz:Math.sin(y)*b*M,life:it(.5,1)*(m.life||1),size:(m.size||.34)*it(.8,1.3),vr:it(-6,6),grav:m.grav,drag:m.drag})}},chunks(c,h,f,u,p,d,_){for(let m=0;m<u&&n.length<260;m++){let g=it(zo),y=d*it(.3,1);n.push({x:c+it(-.3,.3),y:h+it(-.4,.4),z:f+it(-.3,.3),vx:Math.cos(g)*y,vy:it(1,6)+d*.3,vz:Math.sin(g)*y,rx:it(zo),ry:it(zo),wx:it(-9,9),wy:it(-9,9),s:_*it(.5,1.2),r:p[0],g:p[1],b:p[2],life:it(.9,1.8),max:1.8})}},shake(c){l.trauma=Math.min(1,l.trauma+c)},on(c,h,f){let u=h.player,p=(d,_,m)=>Math.max(0,1-Math.hypot(d-f.x,_-f.z)/m);switch(c.t){case"fire":{let d=Jt[c.weapon];l.kickV+=d.kick*2.4,l.muzzle=1,l.shake(d.kick*.045),l.light(f.x+f.fx*1.2,f.y+f.fy*1.2,f.z+f.fz*1.2,5+d.kick*2,d.color,.08,.5);break}case"tracer":{let d=Jt[c.weapon],_=d.color,m=f.x+f.rx*.22+f.fx*.7,g=f.y-.16+f.fy*.7,y=f.z+f.rz*.22+f.fz*.7,v=c.weapon===2;if(s.length<70&&s.push({ax:m,ay:g,az:y,bx:c.x,by:c.y,bz:c.z,w:v?.11:.028,r:_[0],g:_[1],b:_[2],life:v?.4:.07,max:v?.4:.07}),v){let M=Math.min(40,Math.floor(c.len/1.6)),b="grep -r 'ERROR' /proc ";for(let w=1;w<=M;w++){let x=w*1.6;l.glyph(f.x+c.dx*x,f.y-.1+c.dy*x,f.z+c.dz*x,b.charCodeAt(w%b.length),_,{vy:it(.2,.9),life:it(.5,.9),size:.3,grav:0,drag:2})}l.light(c.x,c.y,c.z,8,_,.3)}if(c.wall)for(let M=0;M<(v?6:2);M++)l.glyph(c.x,c.y,c.z,39+(Math.random()*8|0),_,{vx:c.nx*it(1,5)+it(-2,2),vy:c.ny*it(1,5)+it(0,3),vz:c.nz*it(1,5)+it(-2,2),life:it(.2,.45),size:.2});break}case"hit":{let d=Qe[c.type].color;l.burst(c.x,c.y,c.z,c.src==="kill"?1:2,Xx,d,5,{pick:!0,size:.22,life:.55});break}case"kill":{let d=Qe[c.type].color,_=c.r*c.h,m=p(c.x,c.z,30);if(c.src==="purge"){l.burst(c.x,c.y+c.h*.5,c.z,6,"01",d,4,{pick:!0,grav:-3});break}if(c.type==="packet"){l.burst(c.x,c.y+.3,c.z,3,"SYN",d,5,{size:.26}),l.chunks(c.x,c.y+.3,c.z,2,d,5,.16);break}l.burst(c.x,c.y+c.h*.6,c.z,Math.min(26,c.name.length*2),c.name,d,7+_*2,{size:.36+_*.12,up:3,life:1.3}),l.chunks(c.x,c.y+c.h*.5,c.z,Math.min(16,4+Math.round(_*5)),d,5+_*2,.22+c.r*.25),l.ripple(c.x,c.z,.35+_*.5),l.light(c.x,c.y+c.h*.5,c.z,6+c.r*5,d,.3),l.shake((.05+_*.1)*m);break}case"explode":{let d=Rd[c.kind]||Rd.rm,_=p(c.x,c.z,34);l.burst(c.x,c.y,c.z,26,"#*%!@&",d,c.radius*3.2,{pick:!0,size:.5,up:2,life:1.1}),l.burst(c.x,c.y,c.z,14,".:",[1,.9,.7],c.radius*4.5,{pick:!0,size:.4,life:.6,drag:3}),l.chunks(c.x,c.y,c.z,10,d,c.radius*2,.3),l.ripple(c.x,c.z,.6+c.radius*.22),l.light(c.x,c.y+.5,c.z,c.radius*3.2,d,.45,1.6),l.shake(.75*_*_+.1*_),l.flash=Math.max(l.flash,.22*_*_);break}case"split":l.burst(c.x,c.y,c.z,9,":|:&",Qe.fork.color,6,{size:.4});break;case"spawn":{let d=Qe[c.type].color;c.type!=="packet"&&(l.ripple(c.x,c.z,.25),l.burst(c.x,.3,c.z,4,"fork()",d,2,{up:5,grav:2,size:.26,life:.8}));break}case"blink":l.burst(c.x0,1,c.z0,10,"?",Qe.heisen.color,4,{grav:-2,size:.4}),l.burst(c.x,1,c.z,6,"!",[1,1,1],3,{grav:-2,size:.36}),l.light(c.x,1.2,c.z,7,Qe.heisen.color,.3);break;case"raceDown":l.burst(c.x,1,c.z,8,"await",Qe.race.color,4,{size:.3});break;case"raceRevive":l.burst(c.x,1,c.z,12,"retry",[1,1,1],5,{size:.34,up:3}),l.ripple(c.x,c.z,.5);break;case"cronTele":l.glyph(c.x,c.y+1.9,c.z,33,[1,1,.6],{life:.45,size:.9,grav:0,vy:1}),l.light(c.x,c.y,c.z,6,Qe.cron.color,.4);break;case"enemyShot":l.light(c.x,c.y,c.z,5,c.kind===0?Qe.cron.color:Qe.boss.color,.12);break;case"shotHit":l.burst(c.x,c.y,c.z,3,".,",[1,.8,.6],3,{pick:!0,size:.22,life:.4});break;case"leakFuse":l.burst(c.x,2,c.z,10,"OOM",[1,1,1],5,{size:.5,up:3});break;case"bruteWindup":l.glyph(c.x,3.6,c.z,33,[1,.3,.2],{life:.7,size:1.3,grav:0,vy:.6});break;case"bruteCharge":l.shake(.2*p(c.x,c.z,25));break;case"bruteCrash":l.shake(.6*p(c.x,c.z,30)),l.ripple(c.x,c.z,1.3),l.chunks(c.x,1.2,c.z,10,[.5,.5,.55],7,.3),l.burst(c.x,2.6,c.z,6,"*",[1,1,.4],3,{size:.5});break;case"hurt":l.hurt=Math.min(1,l.hurt+.35+c.dmg*.03),c.dot||(l.glitch=Math.min(1,l.glitch+.25+c.dmg*.02),l.shake(.25+c.dmg*.012),l.kickV-=4);break;case"heal":case"coffee":l.tint=Math.max(l.tint,.5);break;case"dash":l.fov+=9;break;case"land":l.dip=Math.min(.22,c.v*.012),l.ripple(u.x,u.z,Math.min(.6,c.v*.03));break;case"rollback":l.rewind=1;break;case"rollbackEnd":l.rewind=0,l.flash=.35,l.ripple(u.x,u.z,.9);break;case"sudo":l.sudo=1,l.flash=.5,l.ripple(u.x,u.z,1.6),l.shake(.4),l.fov+=6;break;case"sudoEnd":l.sudo=0;break;case"switch":l.swap=0;break;case"breaker":l.flash=.8,l.shake(.8);break;case"unlock":l.flash=.3;break;case"perk":l.flash=.25,l.ripple(u.x,u.z,1);break;case"act":l.glitch=1,l.flash=.4,t.length=n.length=s.length=r.length=0;break;case"waveStart":l.alarm=1,l.ripple(u.x,u.z,.8);break;case"waveEnd":l.ripple(u.x,u.z,1.4),l.flash=.18;break;case"bossFight":l.shake(.7),l.ripple(c.x??0,c.z??0,2),l.alarm=1;break;case"bossRing":l.ripple(c.x,c.z,1.2),l.shake(.12),l.light(c.x,1,c.z,16,Qe.boss.color,.4);break;case"bossAdds":l.ripple(c.x,c.z,.6);break;case"shieldDown":l.flash=.4,l.shake(.5),l.ripple(c.x,c.z,2),l.burst(c.x,5,c.z,30,"404",[.2,.9,.8],14,{size:.6});break;case"bossPhase3":l.glitch=1,l.shake(.6),l.alarm=1;break;case"bossDying":l.glitch=1,l.shake(1),l.flash=.6;break;case"bossDead":l.flash=1,l.shake(1),l.ripple(c.x,c.z,3),l.burst(c.x,5,c.z,60,"legacy-billing-monolith.jar",Qe.boss.color,22,{size:.8,up:6,life:2.2}),l.chunks(c.x,4,c.z,40,[.1,.05,.06],14,.9);break;case"deflect":l.burst(c.x,c.y,c.z,2,"0",[.2,.9,.8],4,{size:.3,life:.4});break;case"dead":l.glitch=1,l.shake(1);break;default:}},update(c,h){let f=h.world;for(let p=c;p>1e-6;p-=1/240){let d=Math.min(p,.004166666666666667);l.kickV+=(-l.kick*190-l.kickV*22)*d,l.kick+=l.kickV*d}l.kick=Math.max(-.25,Math.min(.5,l.kick)),l.trauma=Math.max(0,l.trauma-c*1.5),l.fov*=Math.exp(-c*7),l.dip*=Math.exp(-c*9),l.hurt=Math.max(0,l.hurt-c*1.4),l.glitch=Math.max(0,l.glitch-c*2.2),l.flash=Math.max(0,l.flash-c*2.8),l.alarm=Math.max(0,l.alarm-c*.45),l.muzzle=Math.max(0,l.muzzle-c*16),l.tint=Math.max(0,l.tint-c*1.5),l.swap=Math.min(1,l.swap+c*5);let u=0;for(let p=0;p<t.length;p++){let d=t[p];if((d.life-=c)<=0)continue;let _=Math.exp(-d.drag*c);d.vx*=_,d.vz*=_,d.vy=d.vy*_-d.grav*c,d.x+=d.vx*c,d.y+=d.vy*c,d.z+=d.vz*c,d.rot+=d.vr*c,d.floor&&d.y<.12&&d.vy<0&&(d.y=.12,d.vy*=-.35,d.vx*=.6,d.vz*=.6,d.vr*=.4),t[u++]=d}t.length=u,u=0;for(let p=0;p<n.length;p++){let d=n[p];if((d.life-=c)<=0)continue;d.vy-=22*c;let _=d.x,m=d.z;if(d.x+=d.vx*c,d.y+=d.vy*c,d.z+=d.vz*c,d.rx+=d.wx*c,d.ry+=d.wy*c,d.y<d.s*.5&&(d.y=d.s*.5,d.vy*=-.4,d.vx*=.7,d.vz*=.7,d.wx*=.6,d.wy*=.6),f){let g=Math.hypot(d.x-_,d.z-m);g>1e-4&&An(f,_,d.y,m,(d.x-_)/g,0,(d.z-m)/g,g,null)<g&&(d.x=_,d.z=m,d.vx*=-.5,d.vz*=-.5)}n[u++]=d}n.length=u,u=0;for(let p=0;p<s.length;p++)(s[p].life-=c)>0&&(s[u++]=s[p]);s.length=u,u=0;for(let p=0;p<r.length;p++)(r[p].life-=c)>0&&(r[u++]=r[p]);r.length=u},draw(){let c=i.boxes,h=i.glow,f=i.glyphs;for(let u of t){let p=Math.min(1,u.life/u.max*2.2);f.add(u.x,u.y,u.z,u.size,u.r,u.g,u.b,p,u.code,u.rot)}c.base(0,0,0,0,1);for(let u of n){let p=u.s*Math.min(1,u.life*2.5);c.box(u.x,u.y,u.z,p,p,p,u.r,u.g,u.b,.25,u.rx,u.ry)}for(let u of s){let p=u.life/u.max;h.beam(u.ax,u.ay,u.az,u.bx,u.by,u.bz,u.w*(.4+.6*p),u.r,u.g,u.b,.4+1.6*p)}r.sort((u,p)=>p.life/p.max*p.radius-u.life/u.max*u.radius);for(let u=0;u<4;u++){let p=r[u];if(p){let d=p.life/p.max;a.uLightPos.value[u].set(p.x,p.y,p.z,p.radius),a.uLightCol.value[u].set(p.r*d,p.g*d,p.b*d)}else a.uLightCol.value[u].set(0,0,0)}a.uAlarm.value=l.alarm*(.5+.5*Math.sin(a.uTime.value*9))},counts:()=>({parts:t.length,debris:n.length,tracers:s.length,lights:r.length})};return l}var Bo=(i,e,t)=>i<e?e:i>t?t:i,Ds=.85,qx=[(i,e,t,n)=>(i.box(0,.03,-.1,.07,.09,.42,n[0],n[1],n[2],t),i.box(0,.05,-.42,.035,.035,.26,e[0],e[1],e[2],t+.1),i.box(0,-.06,.04,.05,.11,.07,n[0],n[1],n[2],t,.3),i.box(0,-.075,-.13,.04,.13,.06,n[0],n[1],n[2],t,-.1),i.box(0,.095,-.02,.02,.03,.05,e[0],e[1],e[2],.6),[.05,-.58]),(i,e,t,n,s)=>(i.box(-.03,.04,-.3,.05,.05,.62,e[0]*.7,e[1]*.7,e[2]*.7,t),i.box(.03,.04,-.3,.05,.05,.62,e[0]*.7,e[1]*.7,e[2]*.7,t),i.box(0,.02,.04,.11,.1,.3,n[0],n[1],n[2],t),i.box(0,-.035,-.28+s*1.6,.1,.05,.18,e[0],e[1],e[2],t+.15),i.box(0,-.06,.2,.06,.12,.22,n[0],n[1],n[2],t,.35),[.04,-.64]),(i,e,t,n,s,r)=>{i.box(-.036,.04,-.4,.02,.055,.86,n[0],n[1],n[2],t),i.box(.036,.04,-.4,.02,.055,.86,n[0],n[1],n[2],t),i.box(0,.04,-.4,.03,.02,.82,e[0],e[1],e[2],.7+.3*Math.sin(r*8));for(let a=0;a<3;a++)i.box(0,.04,-.15-a*.25,.11,.09,.03,e[0],e[1],e[2],t+.2);return i.box(0,0,.08,.09,.12,.26,n[0],n[1],n[2],t),i.box(0,-.09,.1,.05,.13,.07,n[0],n[1],n[2],t,.3),[.04,-.86]},(i,e,t,n)=>(i.box(0,.06,-.3,.14,.14,.7,n[0],n[1],n[2],t),i.box(0,.06,-.67,.17,.17,.06,e[0],e[1],e[2],t+.3),i.box(0,.06,-.12,.146,.146,.04,1,.85,.1,.5),i.box(0,.06,-.22,.146,.146,.04,1,.85,.1,.5),i.box(0,.06,.08,.16,.16,.05,e[0],e[1],e[2],t),i.box(0,-.06,-.1,.05,.14,.07,n[0],n[1],n[2],t,.25),[.06,-.74])];function Pd(i){let e=[0,1,2,3].map(()=>new lt(0,0,-100,1)),t=[0,1,2,3].map(()=>new G),n={...i.U,uFogD:{value:0},uLightPos:{value:e},uLightCol:{value:t}},s=new Ki(48,n,!1),r=new Ki(8,n,!0),a=new ai,o=new Vt(58,1,.02,10);a.add(s.mesh,r.mesh),o.matrixAutoUpdate=!1;let l=new xt,c=new Wn(0,0,0,"YXZ"),h=new bn,f=new G,u=new G(1,1,1),p=[0,0,0],d=0,_=0,m=0;return{scene:a,camera:o,update(g,y,v,M,b){let w=y.player,x=Jt[w.weapon],S=w.heat[w.weapon],P=w.locked[w.weapon],R=Math.min(1,g*10),C=Math.hypot(w.vx,w.vz),D=Math.min(1,C/8)*(w.onGround?1:.2);d+=(Bo(v.dyaw/Math.max(g,.001)*.012,-.09,.09)-d)*R,_+=(Bo(v.dpitch/Math.max(g,.001)*.012,-.07,.07)-_)*R,m+=g*C*1.25;let F=(1-M.swap)**2,L=P?Math.sin(b*90)*.004:0,V=Bo(M.kick,-.2,.45);f.set(.27+d*.5+Math.sin(m)*.012*D+L,-.27-F*.4+Math.abs(Math.cos(m))*.014*D-M.dip*.4-_*.4-Bo(w.vy,-12,12)*.004,-.76+V*.9),c.set(V*1.5-F*1.1+_*.8,.03+d*1.2,-d*.9),l.compose(f,h.setFromEuler(c),u),o.matrix.copy(l).invert(),o.matrixWorldNeedsUpdate=!0;let $=P?.5+.5*Math.sin(b*14):0,H=w.sudoT>0?1:0,te=[x.color[0]+(1-x.color[0])*Math.max($,H),x.color[1]*(1-$)+.8*H*(1-x.color[1]),x.color[2]*(1-$)*(1-H*.7)];p[0]=.32+$*.6+H*.5,p[1]=.36+H*.35,p[2]=.42,s.begin(),r.begin(),s.base(0,0,0,0,Ds);let[X,ee]=qx[w.weapon](s,te,.12+H*.5+$*.4,p,V,b);for(let Q=0;Q<8;Q++){let _e=S>Q/8+.01,Ne=_e?.3+Q/8:.1,Z=_e?1.1-Q/8:.1;s.box(0,X+(w.weapon===3?.085:.052),-.05-Q*.032,.026,.01,.022,Ne,Z,_e?.15:.1,_e?1.2:0)}if(M.muzzle>0&&w.weapon!==3){let Q=M.muzzle*(w.weapon===1?.15:.1);r.base(0,X*Ds,ee*Ds,0,Ds),r.box(0,0,0,Q,Q,Q*1.6,te[0],te[1],te[2],1.5,0,0,b*40),r.box(0,0,0,Q*1.9,Q*.25,.02,1,1,1,.8,0,0,b*31),r.box(0,0,0,Q*.25,Q*1.9,.02,1,1,1,.8,0,0,b*31)}s.end(),r.end(),e[0].set(0,X*Ds,(ee-.1)*Ds,1.4),t[0].set(te[0]*M.muzzle*1.2,te[1]*M.muzzle*1.2,te[2]*M.muzzle*1.2)},resize(g){o.aspect=g,o.updateProjectionMatrix()}}}var We=Math.PI*2;function $x(){let i=()=>Math.random()*2-1,e=o=>{let l=0;return c=>l+=(c-l)*o},t=o=>Math.sin(o)>0?1:-1,n=o=>2*(o/We-Math.floor(o/We+.5)),s=(o,l,c)=>Math.min(1,o/l)*Math.exp(-o*c),r=(o,l,c,h)=>We*(c*o+(l-c)*(1-Math.exp(-h*o))/h),a=o=>o();return{term:[.14,a(()=>{let o=e(.5);return l=>Math.sin(r(l,1100,150,45))*s(l,.001,30)*.8+o(i())*s(l,.001,70)*.7})],kill:[.5,a(()=>{let o=e(.25),l=e(.04);return c=>Math.tanh((o(i())*s(c,.001,9)*1.6+Math.sin(r(c,130,38,14))*s(c,.002,7)*1.2+l(i())*s(c,.01,5))*1.8)*.9})],grep:[.55,a(()=>{let o=e(.3);return l=>(Math.sin(r(l,3200,160,9)+2.5*Math.sin(r(l,1300,90,7)))*s(l,.002,6)+o(i())*s(l,.001,25)*.6)*.7})],rm:[.45,a(()=>{let o=e(.12);return l=>o(i())*Math.sin(Math.min(1,l/.4)*Math.PI)*1.4+Math.sin(r(l,160,50,10))*s(l,.002,12)*.9})],boom:[1.1,a(()=>{let o=0;return l=>(o+=(i()-o)*Math.max(.012,.5*Math.exp(-l*5)),Math.tanh((o*s(l,.002,3.2)*3.2+Math.sin(r(l,95,28,6))*s(l,.004,4.5)*1.3)*1.5)*.95)})],hit:[.04,o=>Math.sin(We*1750*o)*s(o,.001,90)*.5],confirm:[.12,o=>t(We*(o<.045?880:1320)*o)*s(o,.002,22)*.3],dry:[.05,o=>Math.sin(We*180*o)*s(o,.001,80)*.6+i()*s(o,.001,200)*.2],overheat:[.34,o=>(o%.17<.11?t(We*196*o)+t(We*247*o):0)*.2],cool:[.16,o=>Math.sin(r(o,500,1300,14))*s(o,.005,16)*.3],dash:[.26,a(()=>{let o=e(.2);return l=>o(i())*Math.sin(Math.min(1,l/.26)*Math.PI)**2*.9})],jump:[.09,o=>Math.sin(r(o,170,300,20))*s(o,.004,30)*.35],land:[.14,a(()=>{let o=e(.08);return l=>Math.sin(r(l,110,45,25))*s(l,.002,22)*.8+o(i())*s(l,.001,40)*.8})],hurt:[.3,a(()=>{let o=e(.15);return l=>Math.tanh((n(r(l,150,55,12))*s(l,.002,11)+o(i())*s(l,.001,20))*2.5)*.7})],coffee:[.32,o=>Math.sin(r(o,320,1050,7)+Math.sin(We*31*o)*1.5)*s(o,.02,7)*.35],rollback:[.5,a(()=>{let o=e(.3);return(l,c)=>(n(We*(140+1900*(l/c)**2)*l)*.35+o(i())*.5)*(l/c)**1.5*(l>c-.02?(c-l)/.02:1)})],sudo:[.7,o=>{let l=[262,330,392,523,659][Math.min(4,Math.floor(o/.09))];return(t(We*l*o)*.5+t(We*l*2.005*o)*.25)*s(o,.002,2.6)*.35}],perk:[.6,o=>(Math.sin(We*784*o)+Math.sin(We*1175*o)*(o>.08?1:0))*s(o,.003,6)*.25],ui:[.012,o=>Math.sin(We*3200*o)*s(o,5e-4,400)*.25+i()*s(o,5e-4,700)*.2],enter:[.06,o=>Math.sin(We*700*o)*s(o,.001,70)*.4+i()*s(o,5e-4,400)*.3],spawn:[.2,o=>Math.sin(r(o,200,900,12)+Math.sin(We*60*o)*2)*s(o,.01,14)*.25],ding:[.5,o=>(Math.sin(We*1568*o)+.5*Math.sin(We*3136*o)+.3*Math.sin(We*4310*o))*s(o,.001,9)*.3],eshot:[.16,o=>(Math.sin(r(o,900,240,18))+.4*t(r(o,450,120,18)))*s(o,.002,20)*.4],blink:[.12,o=>t(We*(300+2400*(Math.floor(o*110)*7919%13/13))*o)*s(o,.001,14)*.25],roar:[.75,(o,l)=>Math.tanh(n(We*(52+60*(o/l)**2)*o)*(1+.6*Math.sin(We*27*o))*2)*Math.sin(Math.PI*Math.min(1,o/l))*.6],crash:[.7,a(()=>{let o=e(.35);return l=>((Math.sin(We*311*l)+Math.sin(We*517*l)+Math.sin(We*839*l)+Math.sin(We*1193*l))*.2*s(l,.001,7)+o(i())*s(l,.001,14))*.9})],fuse:[1.3,(o,l)=>{let c=6+22*(o/l)**2;return o*c%1<.4?Math.sin(We*(880+500*o/l)*o)*.3:0}],split:[.2,o=>(Math.sin(r(o,260,90,30))*s(o,.001,35)+t(We*(o<.09?0:o<.14?990:1320)*o)*.3*s(Math.max(0,o-.09),.001,25))*.6],ring:[.7,o=>Math.tanh(Math.sin(r(o,120,41,5))*s(o,.004,4)*2.2)*.8+Math.sin(We*2637*o)*s(o,.001,12)*.08],shield:[.2,o=>(Math.sin(We*2093*o)+.6*Math.sin(We*3349*o))*s(o,5e-4,22)*.25],alarm:[.9,o=>t(We*(o%.3<.15?622:466)*o)*.16*Math.min(1,(.9-o)*12)*Math.min(1,o*80)],clear:[.8,o=>{let l=[523,659,784,1047][Math.min(3,Math.floor(o/.11))];return(Math.sin(We*l*o)+.3*Math.sin(We*l*2*o))*s(o,.003,3.4)*.28}],phone:[1.6,o=>o%.8<.42?Math.tanh(t(We*155*o)*(.6+.4*Math.sin(We*23*o))*1.5)*.3*Math.min(1,o%.8*60):0],dead:[1.5,a(()=>{let o=e(.06);return(l,c)=>(n(We*220*Math.exp(-l*2.2)*l)*.5+o(i())*1.2)*Math.exp(-l*1.8)*Math.min(1,(c-l)*20)})],tick:[.03,o=>Math.sin(We*2400*o)*s(o,5e-4,160)*.35]}}function Yx([i,e],t){let n=Math.floor(i*t),s=new Float32Array(n),r=0;for(let a=0;a<n;a++)s[a]=e(a/t,i),r=Math.max(r,Math.abs(s[a]));if(r>.9)for(let a=0;a<n;a++)s[a]*=.9/r;return s}var Zx={hit:.035,confirm:.05,eshot:.05,spawn:.08,boom:.06,split:.06,shield:.08,blink:.05,tick:.05};function Id(i){let e={ctx:null,ready:!1,bass:0,level:0,onSay:null,volume:i,buffers:{},voices:{},last:{},lx:0,lz:0,lyaw:0,music:null,musicName:"",sayQ:[],saying:0,sayCd:{},init(t="assets/"){if(e.ctx){e.ctx.resume().catch(()=>{});return}try{let n=e.ctx=new AudioContext({latencyHint:"interactive"}),s=n.createDynamicsCompressor();s.threshold.value=-14,s.ratio.value=6,s.attack.value=.003,s.release.value=.2,e.master=n.createGain(),e.sfx=n.createGain(),e.mus=n.createGain(),e.vox=n.createGain(),e.analyser=n.createAnalyser(),e.analyser.fftSize=512,e.analyser.smoothingTimeConstant=.5,e.spectrum=new Uint8Array(e.analyser.frequencyBinCount),e.sfx.connect(s),e.vox.connect(s),e.analyser.connect(e.mus),e.mus.connect(s),s.connect(e.master),e.master.connect(n.destination),e.applyVolume();for(let[r,[a,o]]of Object.entries($x())){let l=Yx([a,o],n.sampleRate),c=n.createBuffer(1,l.length,n.sampleRate);c.copyToChannel(l,0),e.buffers[r]=c}e.base=t;for(let r of Object.keys(Ci))fetch(`${t}voice/${r}.ogg`).then(a=>a.ok?a.arrayBuffer():Promise.reject(a.status)).then(a=>n.decodeAudioData(a)).then(a=>{e.voices[r]=a}).catch(()=>{});e.ready=!0}catch(n){console.warn("audio unavailable, running silent:",n),e.ctx=null,e.ready=!1}},applyVolume(){if(!e.ctx)return;let t=e.volume;e.master.gain.value=t.master,e.sfx.gain.value=t.sfx,e.mus.gain.value=t.music*.5,e.vox.gain.value=t.voice*1.15},listener(t,n,s){e.lx=t,e.lz=n,e.lyaw=s},play(t,n={}){if(!e.ready||e.ctx.state!=="running")return;let s=e.ctx.currentTime,r=e.buffers[t];if(!r||s-(e.last[t]||-1)<(Zx[t]||0))return;e.last[t]=s;let a=n.vol??1,o=0;if(n.x!==void 0){let h=n.x-e.lx,f=n.z-e.lz,u=Math.hypot(h,f);if(a*=1/(1+(u/9)**2),a<.012)return;o=u>.5?(h*Math.cos(e.lyaw)-f*Math.sin(e.lyaw))/u*.8:0}let l=e.ctx.createBufferSource(),c=e.ctx.createGain();if(l.buffer=r,l.playbackRate.value=(n.rate||1)*(.96+Math.random()*.08),c.gain.value=a,o){let h=e.ctx.createStereoPanner();h.pan.value=o,l.connect(c).connect(h).connect(e.sfx)}else l.connect(c).connect(e.sfx);return l.start(),l},loop(t,n=1){if(!e.ready)return()=>{};let s=e.ctx.createBufferSource(),r=e.ctx.createGain();return s.buffer=e.buffers[t],s.loop=!0,r.gain.value=n,s.connect(r).connect(e.sfx),s.start(),()=>{try{s.stop()}catch{}}},setMusic(t,n=1.4){if(!e.ready||t===e.musicName)return;e.musicName=t;let s=e.ctx.currentTime,r=e.music;if(r&&(r.gain.gain.cancelScheduledValues(s),r.gain.gain.setValueAtTime(r.gain.gain.value,s),r.gain.gain.linearRampToValueAtTime(0,s+n),setTimeout(()=>{r.el.pause(),r.el.src="",r.node.disconnect()},n*1e3+100)),e.music=null,!t)return;let a=new Audio(`${e.base}music/${t}.ogg`);a.loop=!0,a.preload="auto";let o=e.ctx.createMediaElementSource(a),l=e.ctx.createGain();l.gain.setValueAtTime(0,s),l.gain.linearRampToValueAtTime(1,s+n),o.connect(l).connect(e.analyser),a.play().catch(()=>{}),e.music={el:a,node:o,gain:l}},pauseMusic(t){e.music&&(t?e.music.el.pause():e.music.el.play().catch(()=>{}))},say(t,n=0,s=!1){let r=performance.now()/1e3;r<(e.sayCd[t]||0)||e.sayQ.includes(t)||(e.sayCd[t]=r+n,s?e.sayQ.unshift(t):e.sayQ.length<3&&e.sayQ.push(t))},hush(){if(e.sayQ.length=0,e.voiceSrc)try{e.voiceSrc.stop()}catch{}e.saying=0},update(t){let n=performance.now()/1e3;if(e.sayQ.length&&n>=e.saying){let l=e.sayQ.shift(),c=e.voices[l],h=c?c.duration:1.2+Ci[l].length*.045;if(c&&e.ready&&e.ctx.state==="running"){let f=e.voiceSrc=e.ctx.createBufferSource();f.buffer=c,f.connect(e.vox),f.start()}e.saying=n+h+.25,e.onSay&&e.onSay(l,h)}if(!e.ready)return;let s=n<e.saying?.45:1,r=e.volume.music*.5*s;e.mus.gain.value+=(r-e.mus.gain.value)*Math.min(1,t*6),e.analyser.getByteFrequencyData(e.spectrum);let a=(e.spectrum[1]+e.spectrum[2]+e.spectrum[3])/765;e.level+=(a-e.level)*Math.min(1,t*(e.level?1.2:1e9));let o=Math.min(1,Math.max(0,a-e.level)*12);e.bass+=(o-e.bass)*Math.min(1,t*(o>e.bass?45:11))}};return e}var st=i=>document.getElementById(i),Ld=i=>`rgb(${i.map(e=>Math.round(e*255)).join(",")})`,an=i=>String(i).replace(/[&<>"]/g,e=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"})[e]),Go=i=>Number(i).toLocaleString("en-US"),Jx=String.raw`
 ____  _        _    __  __ _____ _     _____ ____ ____
| __ )| |      / \  |  \/  | ____| |   | ____/ ___/ ___|
|  _ \| |     / _ \ | |\/| |  _| | |   |  _| \___ \___ \
| |_) | |___ / ___ \| |  | | |___| |___| |___ ___) |__) |
|____/|_____/_/   \_\_|  |_|_____|_____|_____|____/____/ `;function Dd(){let i={hud:st("hud"),feed:st("feed"),incTitle:st("inc-title"),incBar:st("inc-bar").firstElementChild,boss:st("boss"),bossName:st("boss-name"),bossBar:st("boss-bar").firstElementChild,clock:st("clock"),score:st("score"),combo:st("combo"),radar:st("radar"),budget:st("budget"),budgetBar:st("budget-bar").firstElementChild,budgetVal:st("budget-val"),ab:[st("ab-dash"),st("ab-rollback"),st("ab-sudo")],weapons:st("weapons"),cross:st("cross"),hitm:st("hitm"),limit:st("limit"),dmg:st("dmg"),big:st("big"),sub:st("sub"),hint:st("hint"),screen:st("screen"),fps:st("fps")},e=Jt.map((v,M)=>{let b=document.createElement("div");return b.className="wp off",b.style.color=Ld(v.color),b.innerHTML=`<span>${M+1}</span><span>${v.cmd}</span><div class="heat"><i></i></div>`,i.weapons.append(b),{d:b,heat:b.querySelector("i")}}),t=[0,1,2,3].map(()=>{let v=document.createElement("i");return i.dmg.append(v),{i:v,t:0}}),n=[...i.cross.querySelectorAll("i")],s=i.radar.getContext("2d"),r={},a=(v,M,b,w,x)=>{r[v]!==w&&(r[v]=w,b==="t"?M.textContent=w:b==="c"?M.className=w:M.style[x]=w)},o=0,l=0,c=0,h=0,f=0,u=0,p=0,d=new Set,_={leak:"Memory leak: kill it while it is small. Full size, it goes OOM and takes the neighbourhood with it",heisen:"Heisenbug: it moves when you look at it. Flick onto it and shoot; it is solid for a second after each jump",brute:"oom_reaper: sidestep the charge. It stuns itself on walls",race:"Race condition: two threads. Kill both within two seconds or the dead one restarts",cron:"Cron job: it fires when the long hand reaches twelve. Keep moving",fork:"Fork bomb: every kill makes two smaller ones. <kbd>2</kbd> SIGKILL is good at this"},m=v=>v?`<span class="handle"><label for="handle">leaderboard handle</label>
    <input id="handle" type="text" maxlength="16" value="${an(v.name)}" placeholder="anonymous" autocomplete="off" spellcheck="false">
    <span id="rank">${an(v.text)}</span></span>`:"",g=()=>{let v=st("handle");v&&(v.addEventListener("keydown",M=>{M.stopPropagation(),M.key==="Enter"?(y.onAct("name",v.value),v.blur()):M.key==="Escape"&&v.blur()}),v.addEventListener("keyup",M=>M.stopPropagation()))},y={el:i,onAct:null,showFps:!1,show(v){i.hud.hidden=!v},accent(v){document.documentElement.style.setProperty("--a",v.map(M=>Math.round(M*255)).join(","))},log(v,M=""){let b=document.createElement("p");for(b.textContent=v,b.className=M,b.addEventListener("animationend",()=>b.remove()),i.feed.append(b);i.feed.childElementCount>9;)i.feed.firstElementChild.remove()},big(v,M="",b=2.4){i.big.innerHTML=`<h1>${an(v)}</h1><p>${an(M)}</p>`,i.big.className="on",l=b},subtitle(v,M){i.sub.textContent=gd[v]||Ci[v],i.sub.className="on",c=M+.6},hint(v,M,b=6){d.has(v)||(d.add(v),i.hint.innerHTML=M,i.hint.className="on",h=b)},on(v,M){switch(v.t){case"kill":v.quiet||(y.log(md(v)),o=1.4,i.hitm.className="kill");break;case"hit":o<1&&(o=1,i.hitm.className="");break;case"hurt":if(!v.dot){let b=t[u++%4];b.t=1,b.i.style.transform=`rotate(${v.ang}rad)`}M.player.hp<M.player.maxHp*.6&&y.hint("rollback","<kbd>Q</kbd> rollback: rewind yourself 3 seconds and take that error budget back");break;case"waveStart":v.wave===0&&y.hint("move","<kbd>WASD</kbd> move &nbsp; <kbd>MOUSE</kbd> aim &nbsp; hold <kbd>LMB</kbd> fire &nbsp; <kbd>SPACE</kbd> jump &nbsp; <kbd>SHIFT</kbd> dash",10);break;case"spawn":_[v.type]&&y.hint(v.type,_[v.type],7);break;case"brief":{let b=v.sev;i.incTitle.innerHTML=`<b class="s${b}">SEV${b}</b>INC-${v.inc} &middot; ${an(v.title)}`,y.big(`INC-${v.inc}`,v.title,3.2),y.log(`pager: INC-${v.inc} TRIGGERED: ${v.title}`,"warn");break}case"waveEnd":y.big("INCIDENT RESOLVED",`INC-${v.inc} closed`,2),y.log(`pager: INC-${v.inc} resolved`,"good");break;case"unlock":y.log(`new command: ${Jt[v.weapon].cmd}  [${v.weapon+1}]`,"good"),y.hint(`w${v.weapon}`,`New command <b>${Jt[v.weapon].cmd}</b>: press <kbd>${v.weapon+1}</kbd> or use the wheel`,7);break;case"perk":y.log(`deployed hotfix: ${Rs.find(b=>b.id===v.id).name}`,"good");break;case"overheat":y.log(`429 Too Many Requests: ${Jt[v.weapon].cmd}`,"bad"),y.hint("heat","Rate limited. Let it cool, or switch weapons <kbd>1</kbd>-<kbd>4</kbd>: holstered ones cool faster");break;case"raceDown":y.log("thread down: kill its twin NOW","warn");break;case"raceRevive":y.log("thread restarted: its twin was still running","bad");break;case"leakFuse":y.log("oom-killer: memory cgroup out of memory","bad");break;case"combo":y.log(`auto-remediation streak x${v.n}`,"good");break;case"sudoReady":y.log("sudo available  [F]","good"),y.hint("sudo","<kbd>F</kbd> sudo: a few seconds with no rate limits and +50% damage");break;case"sudo":y.big("# sudo","no rate limits. +50% damage.",1.8);break;case"rollback":y.log("git revert HEAD~3s","good");break;case"breaker":y.big("CIRCUIT BREAKER TRIPPED","you get one of those",2);break;case"coffee":y.log("+ coffee","good");break;case"act":y.log(`ssh ${["node-3","mq-broker-1","pg-primary","legacy-01"][v.act]}`);break;case"bossFight":y.big("legacy-billing-monolith.jar","shielded by its dependencies",3),y.hint("rings","Shoot its four dependencies first. <kbd>SPACE</kbd> jump over the rings",8);break;case"shieldDown":y.big("DEPENDENCIES REMOVED","the monolith is exposed",2.4),y.hint("beams","<kbd>SPACE</kbd> jump over the beams and the rings, or <kbd>SHIFT</kbd> dash through them",8);break;case"bossPhase3":y.big("npm install","it is loading more dependencies",2.4);break;case"bossDying":y.big("SIGKILL","exit code 137",3.5);break;default:}},update(v,M,b){let w=v.player;a("clock",i.clock,"t",Sc(v.stats.time)),h>0&&(h-=M)<=0&&(i.hint.className=""),a("score",i.score,"t",`score ${v.score}`),a("combo",i.combo,"t",v.combo>=3?`streak x${v.combo}`:""),a("incBar",i.incBar,"s",`scaleX(${v.state==="wave"&&v.total?Math.max(0,Math.min(1,v.remaining/v.total)).toFixed(2):v.state==="brief"?1:0})`,"transform");let x=v.enemies.find(D=>D.type==="boss");a("boss",i.boss,"c",x&&x.shield?"shield":""),i.boss.hidden!==!x&&(i.boss.hidden=!x),x&&(a("bossName",i.bossName,"t",x.shield?"monolith.jar  [SHIELDED: kill its dependencies]":"legacy-billing-monolith.jar"),a("bossBar",i.bossBar,"s",`scaleX(${Math.max(0,x.hp/x.maxHp).toFixed(3)})`,"transform"));let S=Math.max(0,w.hp);a("hpBar",i.budgetBar,"s",`scaleX(${(S/w.maxHp).toFixed(3)})`,"transform"),a("hpVal",i.budgetVal,"t",`${Math.ceil(S)} / ${w.maxHp}`),a("hpLow",i.budget,"c",S/w.maxHp<.3?"low":""),[[1-Math.max(0,w.dashCd)/(Re.dashCd*w.dashCdMul),w.dashCd<=0?"ready":""],[1-Math.max(0,w.rollbackCd)/(Re.rollbackCd*w.rollbackCdMul),w.rollbackCd<=0?"ready":""],w.sudoT>0?[w.sudoT/(Re.sudoTime+w.sudoBonus),"on"]:[w.sudo,w.sudo>=1?"ready":""]].forEach(([D,F],L)=>{a(`abF${L}`,i.ab[L].lastElementChild,"s",`scaleX(${Math.max(0,Math.min(1,D)).toFixed(2)})`,"transform"),a(`abC${L}`,i.ab[L],"c",`ab ${F}`)}),e.forEach((D,F)=>{a(`wC${F}`,D.d,"c",`wp${w.unlocked[F]?"":" off"}${F===w.weapon?" cur":""}${w.locked[F]?" lock":""}`),a(`wH${F}`,D.heat,"s",`scaleX(${w.heat[F].toFixed(2)})`,"transform")}),a("limit",i.limit,"c",w.locked[w.weapon]?"on":"");let R=Jt[w.weapon],C=Math.round(4+(R.spread+w.bloom)*420+(w.onGround?0:3));r.gap!==C&&(r.gap=C,n[0].style.top=`${-C-9}px`,n[1].style.top=`${C}px`,n[2].style.left=`${-C-9}px`,n[3].style.left=`${C}px`),o>0&&(o=Math.max(0,o-M*5),i.hitm.style.opacity=String(Math.min(1,o)));for(let D of t)D.t>0&&(D.t=Math.max(0,D.t-M*1.3),D.i.style.opacity=String(D.t));l>0&&(l-=M)<=0&&(i.big.className=""),c>0&&(c-=M)<=0&&(i.sub.className=""),(f-=M)<=0&&(f=.08,y.radar(v)),y.showFps&&(p-=M)<=0&&(p=.25,i.fps.textContent=`${b.fps.toFixed(0)} fps  ${b.sceneW}x${b.sceneH} (${b.scale})  ${b.calls} calls  ${(b.tris/1e3).toFixed(0)}k tris  ${v.enemies.length} enemies  pos ${w.x.toFixed(1)},${w.z.toFixed(1)}  yaw ${(w.yaw*57.3).toFixed(0)}  pitch ${(w.pitch*57.3).toFixed(0)}  shots ${v.stats.shots}`)},radar(v){let M=v.player,b=132,w=62,x=38,S=Math.sin(M.yaw),P=Math.cos(M.yaw);s.clearRect(0,0,b,b);let R=getComputedStyle(document.documentElement).getPropertyValue("--a");s.strokeStyle=`rgba(${R},.5)`,s.lineWidth=1,s.beginPath(),s.arc(b/2,b/2,w,0,7),s.stroke(),s.beginPath(),s.arc(b/2,b/2,w/2,0,7),s.stroke(),s.fillStyle=`rgba(${R},.1)`,s.beginPath(),s.moveTo(b/2,b/2),s.arc(b/2,b/2,w,-Math.PI/2-.62,-Math.PI/2+.62),s.fill();for(let C of v.enemies){if(C.dead)continue;let D=C.x-M.x,F=C.z-M.z,L=D*P-F*S,V=-D*S-F*P,$=Math.hypot(L,V),H=$>x?x/$:1;L*=H,V*=H;let te=C.type==="boss"?5:C.type==="brute"||C.type==="pylon"?3.5:C.type==="packet"?1.3:2.2;s.fillStyle=C.state==="down"?"#666":Ld(Qe[C.type].color),s.fillRect(b/2+L/x*w-te/2,b/2-V/x*w-te/2,te,te)}s.fillStyle="#fff";for(let C of v.pickups){let D=C.x-M.x,F=C.z-M.z,L=D*P-F*S,V=-D*S-F*P;Math.hypot(L,V)<x&&(s.beginPath(),s.arc(b/2+L/x*w,b/2-V/x*w,1.6,0,7),s.fill())}s.beginPath(),s.moveTo(b/2,b/2-4),s.lineTo(b/2+3,b/2+3),s.lineTo(b/2-3,b/2+3),s.fill()},screen(v,M="veil"){i.screen.className=`on ${M}`,i.screen.innerHTML=v},closeScreen(){i.screen.className="",i.screen.innerHTML=""},wake(){y.screen(`<div class="phone"><div class="time">03:07</div><div class="date">Saturday</div>
        <div class="note"><small><span>PAGER</span><span>now</span></small><b>[TRIGGERED]</b> INC-2031<br>prod is down. you are on call.</div>
        <div class="say" id="phone-say"></div><div class="hint" id="phone-hint">press any key to pick up</div></div>`,"solid")},title(v,M,b=!1){let w=pn[v.sev],x=M?M.online-1:0,S=x>0?`${x} other engineer${x>1?"s are":" is"} awake right now.`:"nobody else is awake.";y.screen(`<div class="term bare"><pre class="logo">${an(Jx)}</pre><div class="tag">AN ON-CALL SHOOTER</div>
        <ul class="menu">
          ${b?'<li class="note">This incident needs a keyboard and a mouse. The autopilot is handling it behind this text. Come back on a computer.</li>':`
          <li data-act="start"><kbd>ENTER</kbd> respond to the incident</li>
          <li data-act="sev"><kbd>S</kbd> severity: <b>${w.name}</b> <span>${w.label}</span></li>
          <li data-act="options"><kbd>O</kbd> options</li>
          <li data-act="help"><kbd>H</kbd> runbook <span>(controls)</span></li>
          ${v.won?'<li data-act="night"><kbd>N</kbd> night shift <span>(endless)</span></li>':""}`}
          <li data-act="board"><kbd>L</kbd> leaderboard <span>(who else got paged)</span></li>
          <li data-act="prompt"><kbd>P</kbd> the prompt <span>(how this got made)</span></li>
        </ul>
        <div class="tip">${v.best?`best score ${v.best}. `:""}${S}${M&&M.played?`<br>${Go(M.played)} engineer${M.played>1?"s":""} paged so far. ${Go(M.won)} resolved it.`:""}</div></div>`)},board(v,M){let b=(S,P,R)=>`<li><i>${P+1}</i><b>${an(S.name)}</b><span>${Go(S.score)}</span><em>${R?`SEV${S.sev} +${S.wave}`:S.won?`\u2713 ${wr(S.seconds)}`:`INC-${Et[Math.min(S.wave,Et.length-1)].inc}`}</em></li>`,w=(S,P,R)=>`<div><h3>${S}</h3><ol>${P.map((C,D)=>b(C,D,R)).join("")||'<li class="none">nobody yet</li>'}</ol></div>`,x='<p class="caret">$ kubectl top engineers --all-namespaces </p>';if(v===!1)x="<p>This copy runs without the stats server, so there is no leaderboard here.</p>";else if(v){let S=v.world,P=(D,F)=>F?`${Math.round(100*D/F)}%`:"",R=D=>D>=3600?`${Math.floor(D/3600)} h ${Math.floor(D%3600/60)} min`:`${Math.floor(D/60)} min`,C=[["engineers paged",S.played],["awake right now",S.online],["campaigns resolved",S.won],["incidents resolved",S.resolved],["processes terminated",S.kills],["engineers lost",S.deaths],["time on call",R(S.seconds)],["visits",S.visits]];x=`<div class="boards">${[1,2,3].map(D=>w(`${pn[D].name} ${pn[D].label}`,v.top[D])).join("")}${w("NIGHT SHIFT",v.top.night,!0)}</div>
          <div class="tip">\u2713 resolved, with the time on call &middot; INC: where the run ended &middot; night shift: points and incidents after the campaign</div>
          <h3>THE WORLD</h3><div class="facts">${C.map(([D,F])=>`<span>${D} <b>${typeof F=="number"?Go(F):F}</b></span>`).join("")}</div>
          ${v.started?`<h3>SURVIVAL <span>(share of campaigns that resolved each incident)</span></h3><div class="surv">${v.survival.map((D,F)=>`<span><i>INC-${Et[F].inc}</i><u>${"\u2588".repeat(Math.round(16*D/v.started))||"\u2581"}</u><b>${P(D,v.started)}</b></span>`).join("")}</div>`:""}
          ${v.causes.length?`<h3>MOST LETHAL</h3><p>${v.causes.map(([D,F])=>`${an(D)} ${P(F,S.deaths)}`).join(" &middot; ")}</p>`:""}`}y.screen(`<div class="term board"><h2>LEADERBOARD</h2>${x}<div class="keys split"><span><kbd>ESC</kbd> back</span>${m(M)}</div></div>`),g()},prompt(){y.screen(`<div class="term"><h2>$ cat PROMPT.md</h2><p class="quote">${an(fd)}</p>
        <p>That is the whole brief. The story, the look, the weapons, the soundtrack, the tests and the server behind this page were the model's call.</p>
        <div class="tip">source: <a href="${Mc}" target="_blank" rel="noopener">${Mc.slice(8)}</a></div>
        <div class="keys"><kbd>ESC</kbd> back</div></div>`)},rank(v){let M=st("rank");M&&(M.textContent=v)},help(){y.screen(`<div class="term"><h2>RUNBOOK</h2><div class="grid2">${vd.map(([v,M])=>`<b>${v}</b><span>${M}</span>`).join("")}</div>
        <div class="tip">No ammo. Each weapon has a rate limit: fire too long and it answers 429 until it cools.<br>
        Switch weapons instead: a holstered weapon cools faster.</div><div class="keys"><kbd>ESC</kbd> back</div></div>`)},options(v,M="back"){let b=(S,P,R,C,D,F)=>`<label for="o-${S}">${P}</label>
        <input id="o-${S}" data-key="${S}" type="range" min="${R}" max="${C}" step="${D}" value="${v[S]}"><span id="v-${S}">${F(v[S])}</span>`,w=S=>`${Math.round(S*100)}%`,x=(S,P,R)=>`<label for="o-${S}">${P}</label><select id="o-${S}" data-key="${S}">${R.map(([C,D])=>`<option value="${C}"${String(v[S])===String(C)?" selected":""}>${D}</option>`).join("")}</select><span></span>`;y.screen(`<div class="term"><h2>OPTIONS</h2><div class="opts">
        ${b("sens","mouse sensitivity",.2,3,.05,S=>(+S).toFixed(2))}
        ${b("fov","field of view",60,100,1,S=>`${S}\xB0`)}
        ${b("master","volume",0,1,.05,w)}${b("music","music",0,1,.05,w)}
        ${b("sfx","effects",0,1,.05,w)}${b("voice","pager voice",0,1,.05,w)}
        ${x("quality","resolution",[["auto","auto (measured)"],["0.36","lowest"],["0.47","low"],["0.62","medium"],["0.85","high"],["1","native"]])}
        ${x("cap","frame rate",[["60","display rate"],["30","30 fps (cooler laptop)"]])}
        ${x("crt","CRT effect",[["1","on"],["0.4","subtle"],["0","off"]])}
        ${x("fps","show fps",[["0","no"],["1","yes"]])}
        </div><div class="keys"><kbd>ESC</kbd> ${M}</div></div>`),i.screen.querySelectorAll("[data-key]").forEach(S=>S.addEventListener("input",()=>{let P=S,R=P.dataset.key,C=st(`v-${R}`);C&&(C.textContent=R==="sens"?(+P.value).toFixed(2):R==="fov"?`${P.value}\xB0`:w(+P.value)),y.onAct("set",R,P.value)}))},pause(v){y.screen(`<div class="term pause"><div class="above"><h2>[1]+  Stopped  &nbsp; ./respond --incident ${v.def.inc}</h2>
        <div class="tip">${an(v.def.title)} &middot; ${wr(v.stats.time)} on call &middot; score ${v.score}</div>
        <ul class="menu"><li data-act="options"><kbd>O</kbd> options</li><li data-act="help"><kbd>H</kbd> runbook</li></ul></div>
        <ul class="menu"><li data-act="resume" class="big"><kbd>ESC</kbd> fg <span>(resume: click here, or anywhere outside this box)</span></li></ul>
        <div class="below"><ul class="menu"><li data-act="retry" data-confirm="1"><kbd>R</kbd> restart this incident</li>
        <li data-act="quit" data-confirm="1"><kbd>Q</kbd> go back to bed <span>(title)</span></li></ul></div></div>`)},perks(v){y.screen(`<div class="term bare"><h2>HOTFIX AVAILABLE: deploy one straight to production</h2><div class="cards">${v.perkChoices.map((M,b)=>{let w=Rs.find(S=>S.id===M),x=v.player.perks[M]||0;return`<div class="card" data-act="perk" data-i="${b}"><kbd>${b+1}</kbd><h3>${w.name}</h3><p>${w.desc}</p><small>${x?`deployed ${x}/${w.max}`:"not deployed"}</small></div>`}).join("")}</div></div>`)},dead(v,M,b){let w=v.stats;y.screen(`<div class="term panic"><h1>Kernel panic - not syncing: on-call engineer terminated by ${an(M)}</h1>
        <pre>INC-${v.def.inc} "${an(v.def.title)}" is still open.
escalation policy: level 1: you. level 2: you. level 3: you.

${w.killsTotal} processes terminated &middot; ${wr(w.time)} on call &middot; score ${v.score}</pre>
        <div class="keys split"><span><kbd>ENTER</kbd> respawn pod and retry the incident &nbsp; <kbd>Q</kbd> go back to bed</span>${m(b)}</div></div>`,"veil"),g()},won(v,M,b,w,x){let S=yd(v,M,b),P=R=>R.map(C=>`<li>${an(C)}</li>`).join("");y.screen(`<div class="term pm"><h1>${S.title}</h1><div class="meta">${S.meta.map(([R,C])=>`<span>${R}: <b>${an(C)}</b></span>`).join("")}</div>
        <h3>SUMMARY</h3><p>${S.summary}</p><h3>ROOT CAUSE</h3><p>${S.cause}</p>
        <h3>WHAT WENT WELL</h3><ul>${P(S.well)}</ul><h3>WHAT WENT POORLY</h3><ul>${P(S.poorly)}</ul>
        <h3>ACTION ITEMS</h3><ul>${P(S.actions)}</ul><p class="sign">${S.sign}</p>
        <div class="keys split"><span>${w?"":"<kbd>N</kbd> night shift (endless) &nbsp; "}<kbd>ENTER</kbd> go back to sleep</span>${m(x)}</div></div>`,"veil"),g()}};return i.screen.addEventListener("click",v=>{let M=v.target,b=M.closest("[data-act]");if(y.onAct){if(!b){M===i.screen&&y.onAct("veil");return}if(b.dataset.confirm&&!b.classList.contains("sel")){b.classList.add("sel"),b.append(" \u2014 click again to confirm");return}y.onAct(b.dataset.act,b.dataset.i)}}),y}var Nd=/^[A-Za-z0-9][A-Za-z0-9 _.-]{0,14}[A-Za-z0-9_.-]$/;function Ud(){let i=!1,e=null,t=null,n=null,s=0,r=localStorage.getItem("blameless-id");r||(r=Array.from(crypto.getRandomValues(new Uint8Array(16)),l=>l.toString(16).padStart(2,"0")).join(""),localStorage.setItem("blameless-id",r));let a=async(l,c)=>{if(i)return null;try{let h=await fetch(`api/${l}`,c?{method:"POST",body:JSON.stringify({id:r,...c}),keepalive:!0}:void 0);return(h.status===404||h.status===405||h.status===501)&&(i=!0),h.ok?await h.json():null}catch{return null}},o={world:null,rank:null,get off(){return i},get run(){return e},async hit(l=!1){let c=await a("hit",{visit:l});return c&&(o.world=c),c},leave(){i||navigator.sendBeacon?.("api/hit",JSON.stringify({id:r,leave:!0}))},async begin(l,c,h=null){let f=++s;e=null,n=null,o.rank=null,t=h?{wave:Et.length,score:h.score,time:h.stats.time,kills:h.stats.killsTotal,deaths:h.stats.deaths}:{wave:c==="night"?Et.length:0,score:0,time:0,kills:0,deaths:0};let u=await a("run",{sev:l,mode:c});f===s&&(e=u?u.run:null)},async report(l,c,h,f={}){if(!e)return null;let u=l.stats;return n={run:e,wave:Math.max(0,h-t.wave),score:Math.max(0,l.score-t.score),seconds:Math.max(0,Math.floor(u.time-t.time)),kills:Math.max(0,u.killsTotal-t.kills),deaths:Math.max(0,u.deaths-t.deaths),...f},o.send(c)},async send(l){if(!n)return null;let c=await a("report",{...n,name:l||null});return c&&(o.rank=c),c},board:()=>a("board")};return o}var zt=new URLSearchParams(location.search),Li=(i,e)=>zt.has(i)?+zt.get(i):e,Je={sens:1,fov:78,master:.8,music:.7,sfx:.8,voice:.9,quality:"auto",cap:"60",crt:"1",fps:"0",sev:2,best:0,won:!1,name:"",...JSON.parse(localStorage.getItem("blameless")||"{}")},Us=()=>localStorage.setItem("blameless",JSON.stringify(Je)),Ar=document.getElementById("gl"),ut=dd(Ar),Rn=Sd(ut),Kt=Cd(Rn,ut),Rr=Pd(ut),rt=Dd(),ft=Id(Je),ln=Ud(),Vo=!zt.has("auto")&&!zt.has("bot")&&!zt.has("god"),Cc=matchMedia("(hover: none) and (pointer: coarse)").matches,Ht=new Vt(Je.fov,1,.06,170);Ht.rotation.order="YXZ";var B={state:"boot",sim:null,demo:!0,bot:null,cp:{wave:0,perks:[],score:0},deaths:0,causes:{},endless:!1,t:0,idle:0,manual:zt.has("manual"),stopBuzz:null,endT:0,sub:"main",tilt:0,bob:0,deadT:0,frames:[],capAcc:0,stepT:0,world:""},Rc={accent:new G(1,.72,.42),fog:new G(.16,.085,.06),css:[1,.72,.42]},jt=vc(),Ns={dyaw:0,dpitch:0},Tc={dyaw:0,dpitch:0},Fs=new Set,Wo=new Set,Pi=i=>Fs.has(i)||Wo.has(i),bt={jump:!1,dash:!1,fire:!1,rollback:!1,sudo:!1,weapon:-1},Pr=!1;function zd(i){B.sim=ed({seed:Li("seed",Math.random()*2**31|0),sev:Li("sev",Je.sev),god:zt.has("god"),...i}),Kt.swap=1,B.deadT=0,B.tilt=0,B.bob=0}function Ii(i={}){B.demo=!1,B.endless=!!i.endless,B.bot=zt.has("auto")||zt.has("bot")?_c(Li("seed",7)+100,Li("skill",1)):null,zd(i),B.cp={wave:B.sim.wave,perks:[...B.sim.perkLog],score:B.sim.score},Qt("play")}function Pc(){B.demo=!0,B.bot=_c(3,.7),zd({god:!0,sev:3,wave:1+(Math.random()*6|0)})}function Qt(i){zt.has("keys")&&console.log(`state ${B.state} -> ${i}`),B.state=i,B.sub="main",rt.show(i==="play"||i==="paused"||i==="perk"||i==="dead"),rt.el.hud.style.opacity=i==="play"?"1":"0.35",i==="play"?(rt.closeScreen(),!B.bot&&!B.manual&&Ar.requestPointerLock()?.catch?.(()=>{}),ft.pauseMusic(!1),ut.settle(),Fs.clear(),Wo.clear(),Pr=!1):document.pointerLockElement&&document.exitPointerLock(),i==="wake"?rt.wake():i==="title"?(B.demo||Pc(),rt.accent(cc[0].accent),Ho(),Ic(),ft.setMusic("night")):i==="paused"?(rt.pause(B.sim),ft.pauseMusic(!0)):i==="perk"?(rt.perks(B.sim),ft.say("hotfix",45)):i==="dead"?rt.dead(B.sim,B.sim.player.lastCause||"unknown causes",Cr()):i==="won"&&(rt.won(B.sim,B.deaths,B.causes,B.endless,Cr()),ft.say("postmortem",0))}var Ho=()=>rt.title(Je,ln.world,Cc);function Ic(i=!1){ln.hit(i).then(e=>{let t=e?`${e.online} ${e.played} ${e.won}`:"";t!==B.world&&B.state==="title"&&B.sub==="main"&&(B.world=t,Ho())})}function Cr(){if(ln.off||!Vo)return null;let i=ln.rank;return{name:Je.name,text:Je.name?i?i.name!==Je.name?"that handle is not allowed":i.rank?`#${i.rank} of ${i.of} on ${i.board}`:"":"":"type one to get on the board"}}var Bd=()=>{let i=Cr();i&&rt.rank(i.text)},Ec=(i,e,t)=>{Vo&&ln.report(i,Je.name,e,t).then(Bd)};ft.onSay=(i,e)=>{let t=document.getElementById("phone-say");B.state==="call"&&t?(t.textContent=`"${Ci[i]}"`,document.getElementById("phone-hint").innerHTML=Cc?"tap to acknowledge":"<kbd>ENTER</kbd> acknowledge"):rt.subtitle(i,e)};function Gd(){ft.init(),B.state="call",B.stopBuzz=ft.loop("phone",.6),document.getElementById("phone-hint").textContent="...",setTimeout(()=>{B.state==="call"&&ft.say("call",0)},1300)}function Vd(){B.stopBuzz?.(),ft.hush(),ft.play("enter"),ft.say("ack",0),Qt("title")}async function Kx(){Qt("intro"),rt.screen('<div class="term bare"><pre id="tty" class="caret"></pre><div class="tip">any key to skip</div></div>',"solid");let i=document.getElementById("tty"),e=n=>new Promise(s=>setTimeout(s,n)),t="";for(let[n,s,r]of xd){if(r){t+=t?`
`:"";let a=n.includes("$ ")?n.slice(0,n.indexOf("$ ")+2):"$ ",o=n.includes("$ ")?n.slice(n.indexOf("$ ")+2):n;t+=a;for(let l of o){if(B.state!=="intro")return;t+=l,i.textContent=t,ft.play("ui"),await e(16+Math.random()*30)}ft.play("enter")}else t+=`
${n}`,i.textContent=t;if(await e(s),B.state!=="intro")return}await e(500),B.state==="intro"&&Ii()}function Hd(){let i=B.sim.stats;Ii({wave:B.cp.wave,perks:B.cp.perks,score:Math.floor(B.cp.score*.9),stats:i,endless:B.endless})}function Er(i,e,t){switch(ft.play("enter"),i){case"start":B.deaths=0,B.causes={},document.documentElement.requestFullscreen?.().catch(()=>{}),Vo&&ln.begin(Li("sev",Je.sev),"campaign"),zt.has("skip")?Ii():Kx();break;case"night":Vo&&ln.begin(Li("sev",Je.sev),"night",B.state==="won"?B.sim:null),B.state==="won"?Ii({wave:Et.length,perks:[...B.sim.perkLog],score:B.sim.score,stats:B.sim.stats,endless:!0}):(B.deaths=0,B.causes={},Ii({wave:Et.length,endless:!0}));break;case"sev":Je.sev=Je.sev===1?3:Je.sev-1,Us(),Ho();break;case"board":B.sub="board",rt.board(ln.off?!1:null,Cr()),ln.off||ln.board().then(n=>{B.state==="title"&&B.sub==="board"&&rt.board(n||!1,Cr())});break;case"prompt":B.sub="prompt",rt.prompt();break;case"name":{let n=String(e).trim().replace(/\s+/g," ");if(n&&!Nd.test(n)){rt.rank("2 to 16 letters, digits, spaces or _ . -");break}Je.name=n,Us(),ln.rank=null,rt.rank(n?"saved":""),n&&ln.send(n).then(s=>{s&&Bd()});break}case"options":B.sub="options",rt.options(Je);break;case"help":B.sub="help",rt.help();break;case"back":B.sub="main",B.state==="paused"?rt.pause(B.sim):Ho();break;case"resume":Qt("play");break;case"veil":B.state==="paused"&&B.sub==="main"&&Qt("play");break;case"retry":Hd();break;case"quit":Qt("title");break;case"perk":Wd(+e);break;case"set":Je[e]=["quality","cap","crt","fps"].includes(e)?t:+t,Us(),Lc();break;default:}}rt.onAct=Er;function Wd(i){B.sim.state==="perk"&&(xc(B.sim,i),Qt("play"))}function Lc(){ft.applyVolume(),ut.fx.uCrt.value=+Je.crt,rt.showFps=Je.fps==="1"||zt.has("fps"),rt.el.fps.hidden=!rt.showFps,ut.auto=Je.quality==="auto"&&!zt.has("scale"),zt.has("scale")?ut.setScale(Li("scale",.54)):Je.quality!=="auto"&&ut.setScale(+Je.quality)}var Fd={Enter:"start",KeyS:"sev",KeyO:"options",KeyH:"help",KeyN:"night",KeyL:"board",KeyP:"prompt"},Od={Escape:"resume",Enter:"resume",KeyO:"options",KeyH:"help",KeyR:"retry",KeyQ:"quit"},jx={Enter:"Enter"," ":"Space",Escape:"Escape",Shift:"ShiftLeft","`":"Backquote",Tab:"Tab"},Qx=zt.has("bykey"),Xd=i=>{if(!Qx&&i.code&&i.code!=="Unidentified")return i.code;let e=i.key;return jx[e]||(/^[a-z]$/i.test(e)?`Key${e.toUpperCase()}`:/^\d$/.test(e)?`Digit${e}`:e)};addEventListener("keydown",i=>{if(zt.has("keys")&&console.log(`keydown code=${i.code} key=${i.key}`),i.repeat)return;let e=Xd(i),t=B.state;Fs.add(e),Wo.add(e),B.idle=0,e==="Backquote"&&(Je.fps=Je.fps==="1"?"0":"1",Us(),Lc()),t==="wake"?Gd():t==="call"?(e==="Enter"||e==="Space")&&Vd():t==="intro"?Ii():(t==="title"||t==="paused")&&B.sub!=="main"?(e==="Escape"||e==="Enter")&&Er("back"):t==="title"?Fd[e]&&(e!=="KeyN"||Je.won)&&Er(Fd[e]):t==="paused"?Od[e]&&Er(Od[e]):t==="perk"?e>="Digit1"&&e<="Digit3"&&Wd(+e[5]-1):t==="dead"?performance.now()>B.endT&&(e==="Enter"||e==="KeyR"?Hd():e==="KeyQ"&&Qt("title")):t==="won"?e==="Enter"?Qt("title"):e==="KeyN"&&!B.endless&&Er("night"):t==="play"&&(e>="Digit1"&&e<="Digit4"?bt.weapon=+e[5]-1:e==="Space"?bt.jump=!0:e==="ShiftLeft"||e==="ShiftRight"?bt.dash=!0:e==="KeyQ"?bt.rollback=!0:e==="KeyF"?bt.sudo=!0:(e==="KeyP"||e==="Escape")&&Qt("paused"),(e==="Space"||e==="Tab")&&i.preventDefault())});addEventListener("keyup",i=>Fs.delete(Xd(i)));addEventListener("blur",()=>{Fs.clear(),Pr=!1});addEventListener("mousedown",i=>{B.idle=0,B.state==="wake"?Gd():B.state==="call"&&Cc?Vd():B.state==="intro"?Ii():B.state==="play"&&(document.pointerLockElement!==Ar&&!B.bot&&!B.manual&&Ar.requestPointerLock()?.catch?.(()=>{}),i.button===0?(Pr=!0,bt.fire=!0):i.button===2&&(bt.rollback=!0))});addEventListener("mouseup",i=>{i.button===0&&(Pr=!1)});addEventListener("contextmenu",i=>i.preventDefault());addEventListener("mousemove",i=>{if(document.pointerLockElement!==Ar||B.state!=="play"||performance.now()<qd)return;let e=Math.max(-160,Math.min(160,i.movementX)),t=Math.max(-160,Math.min(160,i.movementY));Ns.dyaw-=e*.0022*Je.sens,Ns.dpitch-=t*.0022*Je.sens});addEventListener("wheel",i=>{if(B.state!=="play")return;let e=B.sim.player,t=i.deltaY>0?1:-1;for(let n=1;n<=4;n++){let s=(e.weapon+t*n+8)%4;if(e.unlocked[s]){bt.weapon=s;break}}},{passive:!0});var qd=0;document.addEventListener("pointerlockchange",()=>{document.pointerLockElement?qd=performance.now()+200:B.state==="play"&&!B.bot&&!B.manual&&Qt("paused")});document.addEventListener("visibilitychange",()=>{document.hidden&&B.state==="play"&&!B.bot&&Qt("paused")});function ev(){jt.mx=(Pi("KeyD")||Pi("ArrowRight")?1:0)-(Pi("KeyA")||Pi("ArrowLeft")?1:0),jt.mz=(Pi("KeyW")||Pi("ArrowUp")?1:0)-(Pi("KeyS")||Pi("ArrowDown")?1:0),jt.dyaw=Ns.dyaw,jt.dpitch=Ns.dpitch,jt.jump=Fs.has("Space"),jt.jumpPressed=bt.jump,jt.dash=bt.dash,jt.fire=Pr||bt.fire,jt.firePressed=bt.fire,jt.rollback=bt.rollback,jt.sudo=bt.sudo,jt.weapon=bt.weapon,Ns.dyaw=Ns.dpitch=0,bt.jump=bt.dash=bt.fire=bt.rollback=bt.sudo=!1,bt.weapon=-1,Wo.clear()}function tv(i,e){let t=ft,n={x:i.x,z:i.z};if(i.t==="act"){let s=cc[i.act];Rn.setWorld(e.world),ut.U.uAccent.value.set(s.accent[0],s.accent[1],s.accent[2]),ut.U.uFog.value.set(s.fog[0],s.fog[1],s.fog[2]),B.demo||(rt.accent(s.accent),t.setMusic(s.music),i.act===1?t.say("act2"):i.act===2&&t.say("act3"));return}if(!B.demo)switch(i.t){case"brief":B.cp={wave:i.wave,perks:[...e.perkLog],score:e.score},t.play("alarm",{vol:.7}),t.say(i.voice,0);break;case"fire":t.play(Jt[i.weapon].id,{vol:i.weapon===0?.55:.9}),i.canary&&t.play("ding",{vol:.6});break;case"hit":t.play("hit",{vol:.5,rate:i.kill?1.4:1});break;case"kill":i.quiet||t.play("confirm",{vol:.55});break;case"explode":t.play("boom",{...n,vol:1.1});break;case"overheat":t.play("overheat"),t.say("rate",14);break;case"cooled":t.play("cool",{vol:.6});break;case"dry":t.play("dry");break;case"switch":t.play("tick",{rate:.7});break;case"dash":t.play("dash");break;case"jump":t.play("jump");break;case"land":t.play("land",{vol:Math.min(1,i.v/14)});break;case"hurt":t.play("hurt",{vol:i.dot?.4:.9});break;case"coffee":t.play("coffee");break;case"rollback":t.play("rollback");break;case"rollbackEnd":t.say("rollback",25);break;case"sudoReady":t.say("sudoReady",40);break;case"sudo":t.play("sudo"),t.say("sudo",90);break;case"spawn":i.type!=="packet"&&t.play("spawn",{...n,vol:.5});break;case"cronTele":t.play("ding",{...n,vol:.8});break;case"enemyShot":t.play("eshot",{...n,vol:.8});break;case"blink":t.play("blink",n);break;case"raceDown":t.play("tick",{...n,vol:1});break;case"raceRevive":t.play("blink",{...n,rate:.6});break;case"bruteWindup":t.play("roar",n);break;case"bruteCrash":t.play("crash",n);break;case"leakFuse":t.play("fuse",n);break;case"split":t.play("split",n);break;case"bossRing":t.play("ring",n);break;case"deflect":t.play("shield",n);break;case"shieldDown":t.play("crash"),t.say("shieldDown",0,!0);break;case"bossFight":t.play("roar"),t.say("shield",0);break;case"bossPhase3":t.play("alarm"),t.say("phase3",0,!0);break;case"bossDying":t.play("boom"),t.setMusic("",3);break;case"bossDead":t.play("boom"),t.say("bossDead",0,!0);break;case"waveEnd":t.play("clear"),i.boss||(t.say("clear",0),Ec(e,i.wave+1));break;case"perk":case"unlock":t.play("perk");break;case"voice":t.say(i.id,30);break;case"breaker":t.play("boom"),t.say("breaker",0,!0);break;case"combo":i.n===25&&t.say("combo",120);break;case"dead":B.deaths++,e.stats.deaths++,B.causes[i.cause]=(B.causes[i.cause]||0)+1,e.score>Je.best&&(Je.best=e.score,Us()),t.play("dead"),t.hush(),t.say("dead",0,!0),B.deadT=0,B.endT=performance.now()+1400,Ec(e,e.wave,{cause:i.cause}),setTimeout(()=>{B.sim===e&&B.state==="play"&&Qt("dead")},1400);break;case"won":Je.won=!0,Je.best=Math.max(Je.best,e.score),Us(),rt.accent(Rc.css),t.setMusic("dawn",3),t.say("win",0,!0),Ec(e,Et.length,{won:!0}),setTimeout(()=>{B.sim===e&&Qt("won")},2600);break;default:}}var on={x:0,y:0,z:0,fx:0,fy:0,fz:-1,rx:1,rz:0},Ac=(i,e)=>Math.sin(i*37.1*e+e*11)*.6+Math.sin(i*71.7*e+e*3)*.4;function Dc(i){let e=B.sim,t=e.player,n=B.state==="play";if(B.t+=i,B.demo&&e.over){Pc();return}let s=n||B.demo;s&&(B.bot?id(B.bot,e,i,jt):ev(),Tc.dyaw=jt.dyaw,Tc.dpitch=jt.dpitch,td(e,jt,i),e.state==="perk"&&(B.bot?xc(e,nd(e)):n&&Qt("perk")));let r=Kt.trauma*Kt.trauma,a=B.t;if(B.demo){let d=a*.07,_=15;Ht.position.set(t.x+Math.sin(d)*_,8.5,t.z+Math.cos(d)*_),Ht.lookAt(t.x,1.2,t.z)}else{let d=Math.hypot(t.vx,t.vz),_=t.vx*Math.cos(t.yaw)-t.vz*Math.sin(t.yaw);B.bob+=i*d*1.25*(t.onGround?1:0),n&&t.onGround&&d>3&&!t.dead&&(B.stepT-=i*d/8.6)<=0&&(B.stepT=.33,ft.play("land",{vol:.14,rate:1.8})),B.tilt+=(-_*.0035-B.tilt)*Math.min(1,i*8),t.dead&&(B.deadT=Math.min(1,B.deadT+i*1.3));let m=B.deadT*B.deadT;Ht.position.set(t.x,t.y+Re.eye-Kt.dip+Math.abs(Math.sin(B.bob))*.035*Math.min(1,d/8)-m*1.25,t.z),Ht.rotation.set(t.pitch+Kt.kick*.16+r*.045*Ac(a,1)+m*.3,t.yaw+r*.045*Ac(a,1.3),B.tilt+r*.06*Ac(a,1.7)+m*.9)}let o=+Je.fov+Kt.fov+(t.sudoT>0?5:0);Math.abs(Ht.fov-o)>.05&&(Ht.fov=o,Ht.updateProjectionMatrix()),Ht.updateMatrixWorld();let l=Ht.matrixWorld.elements;on.x=Ht.position.x,on.y=Ht.position.y,on.z=Ht.position.z,on.rx=l[0],on.rz=l[2],on.fx=-l[8],on.fy=-l[9],on.fz=-l[10];let c=Math.hypot(on.rx,on.rz)||1;if(on.rx/=c,on.rz/=c,ft.listener(t.x,t.z,t.yaw),s){for(let d of e.events)Kt.on(d,e,on),B.demo||rt.on(d,e),tv(d,e);e.events.length=0,n&&(B.idle+=i)>50&&(B.idle=0,ft.say("idle",120))}Kt.update(i,e),ft.update(i);let h=ut.U,f=ut.fx,u=t.hp/t.maxHp<.3&&!t.dead?.25+.15*Math.sin(a*7):0;h.uTime.value=a,e.over==="won"&&(h.uAccent.value.lerp(Rc.accent,Math.min(1,i*.4)),h.uFog.value.lerp(Rc.fog,Math.min(1,i*.4))),h.uBass.value=ft.music?ft.bass:.12+.1*Math.sin(a*2.1),f.uGlitch.value=Math.max(Kt.glitch,t.dead?.35:0),f.uHurt.value=Math.max(Kt.hurt,u),f.uFlash.value=Kt.flash,f.uAberr.value=r*.006+(t.dashT>0?.004:0),f.uRewind.value=t.rewind>0?1:0,t.rewind>0?(f.uTint.value.set(.3,.7,1),f.uTintAmt.value=.7):t.sudoT>0?(f.uTint.value.set(1,.8,.25),f.uTintAmt.value=.3):(f.uTint.value.set(.4,1,.6),f.uTintAmt.value=Kt.tint*.25);let p=B.state==="play"?1:B.state==="title"?.6:B.state==="paused"?.3:.45;if(f.uFade.value+=(p-f.uFade.value)*Math.min(1,i*6),Rn.boxes.begin(),Rn.glow.begin(),Rn.glyphs.begin(),Ad(Rn,e,a,on),B.demo){let d=Rn.boxes;d.base(t.x,t.y,t.z,t.yaw,1),d.box(0,.45,0,.36,.9,.24,.8,.85,.9,.2),d.box(0,1.2,0,.5,.62,.28,.9,.95,1,.3),d.box(0,1.68,0,.26,.26,.26,1,1,1,.5),d.box(.22,1.25,-.4,.08,.1,.55,.3,1,.6,.8)}Kt.draw(),Rn.boxes.end(),Rn.glow.end(),Rn.glyphs.end(),B.demo||Rr.update(i,e,Tc,Kt,a),B.demo||rt.update(e,i,ut)}var Nc=()=>ut.render(Rn.scene,Ht,B.demo||B.sim.player.dead?null:Rr.scene,Rr.camera),kd=performance.now();function $d(i){requestAnimationFrame($d);let e=Math.min(.1,(i-kd)/1e3);if(kd=i,(B.state==="call"||B.state==="intro")&&ft.update(e),B.manual||B.state==="boot"||B.state==="wake"||B.state==="call"||B.state==="intro")return;let t=B.state==="paused"?12:B.state!=="play"||Je.cap==="30"?30:0;if(B.capAcc+=e,t&&B.capAcc<1/(t+1.5))return;let n=Math.min(.1,B.capAcc);B.capAcc=0,Dc(n),Nc(),B.state==="play"&&(ut.tick(n,t||60),B.frames.push(n*1e3),B.frames.length>3600&&B.frames.shift())}function Yd(){let i=innerWidth,e=innerHeight;ut.resize(i,e),Ht.aspect=i/e,Ht.updateProjectionMatrix(),Rr.resize(i/e)}addEventListener("resize",Yd);Yd();Lc();Pc();Dc(1/60);ut.auto&&ut.calibrate(Nc,Je.cap==="30"?20:8.5,.72);zt.has("auto")?(zt.has("mute")||ft.init(),Ii({wave:Li("wave",0)})):Qt("wake");requestAnimationFrame($d);Ic(!0);setInterval(()=>{document.hidden||Ic()},2e4);addEventListener("pagehide",()=>ln.leave());window.__game={G:B,gfx:ut,fx:Kt,st:Je,hud:rt,audio:ft,net:ln,view:Rn,vm:Rr,camera:Ht,tips:_d,get sim(){return B.sim},step(i,e=1/60){for(let t=0;t<i-1e-9;t+=e)Dc(e);return Nc(),B.sim.stats.time},perf(){let i=[...B.frames].sort((n,s)=>n-s),e=i.length||1,t=i.reduce((n,s)=>n+s,0)/e;return{frames:i.length,fpsAvg:+(1e3/t).toFixed(1),msP50:+(i[e>>1]||0).toFixed(1),msP95:+(i[Math.floor(e*.95)]||0).toFixed(1),msP99:+(i[Math.floor(e*.99)]||0).toFixed(1),msMax:+(i[e-1]||0).toFixed(1),scale:ut.scale,scene:`${ut.sceneW}x${ut.sceneH}`,out:`${ut.outW}x${ut.outH}`,calls:ut.calls,tris:ut.tris,enemies:B.sim.enemies.length,calibration:ut.calibration,...Kt.counts()}},resetPerf(){B.frames.length=0},hurt:i=>kn(B.sim,i,B.sim.player.x,B.sim.player.z-1,"the test suite"),spawn:(i,e,t,n)=>Jn(B.sim,i,e,t,n)};
/*! Bundled license information:

three/build/three.core.js:
three/build/three.module.js:
  (**
   * @license
   * Copyright 2010-2026 Three.js Authors
   * SPDX-License-Identifier: MIT
   *)
*/
