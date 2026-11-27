(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),t.credentials=e.crossOrigin===`use-credentials`?`include`:e.crossOrigin===`anonymous`?`omit`:`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})();var e=`attached`,t=1e3,n=1001,r=1002,i=1003,a=1004,o=1005,s=1006,c=1007,l=1008,u=1009,d=1010,f=1011,p=1012,m=1013,h=1014,g=1015,_=1016,v=1017,y=1018,b=1020,x=35902,S=35899,C=1021,w=1022,T=1023,E=1026,D=1027,O=1028,k=1029,A=1030,j=1031,M=1033,ee=33776,N=33777,P=33778,F=33779,te=35840,I=35841,ne=35842,re=35843,L=36196,ie=37492,ae=37496,R=37488,z=37489,B=37490,oe=37491,se=37808,ce=37809,le=37810,ue=37811,de=37812,fe=37813,pe=37814,me=37815,he=37816,ge=37817,_e=37818,ve=37819,ye=37820,be=37821,xe=36492,Se=36494,Ce=36495,we=36283,Te=36284,Ee=36285,De=36286,Oe=2200,V=2201,ke=2202,Ae=2300,je=2301,H=2302,Me=2303,U=2400,W=2401,Ne=2402,Pe=2500,Fe=2501,Ie=3200,Le=`srgb`,Re=`srgb-linear`,ze=`linear`,Be=`srgb`,Ve=7680,He=35044,Ue=35048,We=2e3;function Ge(e){for(let t=e.length-1;t>=0;--t)if(e[t]>=65535)return!0;return!1}function Ke(e){return ArrayBuffer.isView(e)&&!(e instanceof DataView)}function qe(e){return document.createElementNS(`http://www.w3.org/1999/xhtml`,e)}function Je(){let e=qe(`canvas`);return e.style.display=`block`,e}var Ye={};function Xe(...e){let t=`THREE.`+e.shift();console.log(t,...e)}function Ze(e){let t=e[0];if(typeof t==`string`&&t.startsWith(`TSL:`)){let t=e[1];t&&t.isStackTrace?e[0]+=` `+t.getLocation():e[1]=`Stack trace not available. Enable "THREE.Node.captureStackTrace" to capture stack traces.`}return e}function G(...e){e=Ze(e);let t=`THREE.`+e.shift();{let n=e[0];n&&n.isStackTrace?console.warn(n.getError(t)):console.warn(t,...e)}}function K(...e){e=Ze(e);let t=`THREE.`+e.shift();{let n=e[0];n&&n.isStackTrace?console.error(n.getError(t)):console.error(t,...e)}}function Qe(...e){let t=e.join(` `);t in Ye||(Ye[t]=!0,G(...e))}function $e(e,t,n){return new Promise(function(r,i){function a(){switch(e.clientWaitSync(t,e.SYNC_FLUSH_COMMANDS_BIT,0)){case e.WAIT_FAILED:i();break;case e.TIMEOUT_EXPIRED:setTimeout(a,n);break;default:r()}}setTimeout(a,n)})}var et={0:0,2:6,4:4,3:5,1:1,6:2,7:7,5:3},tt=class{addEventListener(e,t){this._listeners===void 0&&(this._listeners={});let n=this._listeners;n[e]===void 0&&(n[e]=[]),n[e].indexOf(t)===-1&&n[e].push(t)}hasEventListener(e,t){let n=this._listeners;return n!==void 0&&n[e]!==void 0&&n[e].indexOf(t)!==-1}removeEventListener(e,t){let n=this._listeners;if(n===void 0)return;let r=n[e];if(r!==void 0){let e=r.indexOf(t);e!==-1&&r.splice(e,1)}}dispatchEvent(e){let t=this._listeners;if(t===void 0)return;let n=t[e.type];if(n!==void 0){e.target=this;let t=n.slice(0);for(let n=0,r=t.length;n<r;n++)t[n].call(this,e);e.target=null}}},nt=`00.01.02.03.04.05.06.07.08.09.0a.0b.0c.0d.0e.0f.10.11.12.13.14.15.16.17.18.19.1a.1b.1c.1d.1e.1f.20.21.22.23.24.25.26.27.28.29.2a.2b.2c.2d.2e.2f.30.31.32.33.34.35.36.37.38.39.3a.3b.3c.3d.3e.3f.40.41.42.43.44.45.46.47.48.49.4a.4b.4c.4d.4e.4f.50.51.52.53.54.55.56.57.58.59.5a.5b.5c.5d.5e.5f.60.61.62.63.64.65.66.67.68.69.6a.6b.6c.6d.6e.6f.70.71.72.73.74.75.76.77.78.79.7a.7b.7c.7d.7e.7f.80.81.82.83.84.85.86.87.88.89.8a.8b.8c.8d.8e.8f.90.91.92.93.94.95.96.97.98.99.9a.9b.9c.9d.9e.9f.a0.a1.a2.a3.a4.a5.a6.a7.a8.a9.aa.ab.ac.ad.ae.af.b0.b1.b2.b3.b4.b5.b6.b7.b8.b9.ba.bb.bc.bd.be.bf.c0.c1.c2.c3.c4.c5.c6.c7.c8.c9.ca.cb.cc.cd.ce.cf.d0.d1.d2.d3.d4.d5.d6.d7.d8.d9.da.db.dc.dd.de.df.e0.e1.e2.e3.e4.e5.e6.e7.e8.e9.ea.eb.ec.ed.ee.ef.f0.f1.f2.f3.f4.f5.f6.f7.f8.f9.fa.fb.fc.fd.fe.ff`.split(`.`),rt=1234567,it=Math.PI/180,at=180/Math.PI;function ot(){let e=Math.random()*4294967295|0,t=Math.random()*4294967295|0,n=Math.random()*4294967295|0,r=Math.random()*4294967295|0;return(nt[e&255]+nt[e>>8&255]+nt[e>>16&255]+nt[e>>24&255]+`-`+nt[t&255]+nt[t>>8&255]+`-`+nt[t>>16&15|64]+nt[t>>24&255]+`-`+nt[n&63|128]+nt[n>>8&255]+`-`+nt[n>>16&255]+nt[n>>24&255]+nt[r&255]+nt[r>>8&255]+nt[r>>16&255]+nt[r>>24&255]).toLowerCase()}function st(e,t,n){return Math.max(t,Math.min(n,e))}function ct(e,t){return(e%t+t)%t}function lt(e,t,n,r,i){return r+(e-t)*(i-r)/(n-t)}function ut(e,t,n){return e===t?0:(n-e)/(t-e)}function dt(e,t,n){return(1-n)*e+n*t}function ft(e,t,n,r){return dt(e,t,1-Math.exp(-n*r))}function pt(e,t=1){return t-Math.abs(ct(e,t*2)-t)}function mt(e,t,n){return e<=t?0:e>=n?1:(e=(e-t)/(n-t),e*e*(3-2*e))}function ht(e,t,n){return e<=t?0:e>=n?1:(e=(e-t)/(n-t),e*e*e*(e*(e*6-15)+10))}function gt(e,t){return e+Math.floor(Math.random()*(t-e+1))}function _t(e,t){return e+Math.random()*(t-e)}function vt(e){return e*(.5-Math.random())}function yt(e){e!==void 0&&(rt=e);let t=rt+=1831565813;return t=Math.imul(t^t>>>15,t|1),t^=t+Math.imul(t^t>>>7,t|61),((t^t>>>14)>>>0)/4294967296}function bt(e){return e*it}function xt(e){return e*at}function St(e){return e>0&&Number.isInteger(e)&&2**Math.round(Math.log2(e))===e}function Ct(e){return 2**Math.ceil(Math.log(e)/Math.LN2)}function wt(e){return 2**Math.floor(Math.log(e)/Math.LN2)}function Tt(e,t,n,r,i){let a=Math.cos,o=Math.sin,s=a(n/2),c=o(n/2),l=a((t+r)/2),u=o((t+r)/2),d=a((t-r)/2),f=o((t-r)/2),p=a((r-t)/2),m=o((r-t)/2);switch(i){case`XYX`:e.set(s*u,c*d,c*f,s*l);break;case`YZY`:e.set(c*f,s*u,c*d,s*l);break;case`ZXZ`:e.set(c*d,c*f,s*u,s*l);break;case`XZX`:e.set(s*u,c*m,c*p,s*l);break;case`YXY`:e.set(c*p,s*u,c*m,s*l);break;case`ZYZ`:e.set(c*m,c*p,s*u,s*l);break;default:G(`MathUtils: .setQuaternionFromProperEuler() encountered an unknown order: `+i)}}function Et(e){switch(e.constructor){case Uint32Array:return 4294967295;case Uint16Array:return 65535;case Uint8Array:case Uint8ClampedArray:return 255;case Int32Array:return 2147483647;case Int16Array:return 32767;case Int8Array:return 127;default:return}}function Dt(e,t){if(t.constructor===Float32Array)return e;let n=Et(t);if(n===void 0)throw Error(`THREE.MathUtils: Invalid component type.`);return Math.max(e/n,-1)}function Ot(e,t){if(t.constructor===Float32Array)return e;let n=Et(t);if(n===void 0)throw Error(`THREE.MathUtils: Invalid component type.`);return Math.round(e*n)}var kt={DEG2RAD:it,RAD2DEG:at,generateUUID:ot,clamp:st,euclideanModulo:ct,mapLinear:lt,inverseLerp:ut,lerp:dt,damp:ft,pingpong:pt,smoothstep:mt,smootherstep:ht,randInt:gt,randFloat:_t,randFloatSpread:vt,seededRandom:yt,degToRad:bt,radToDeg:xt,isPowerOfTwo:St,ceilPowerOfTwo:Ct,floorPowerOfTwo:wt,setQuaternionFromProperEuler:Tt,normalize:Ot,denormalize:Dt},q=class{static{this.prototype.isVector2=!0}constructor(e=0,t=0){this.x=e,this.y=t}get width(){return this.x}set width(e){this.x=e}get height(){return this.y}set height(e){this.y=e}set(e,t){return this.x=e,this.y=t,this}setScalar(e){return this.x=e,this.y=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;default:throw Error(`THREE.Vector2: index is out of range: `+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;default:throw Error(`THREE.Vector2: index is out of range: `+e)}}clone(){return new this.constructor(this.x,this.y)}copy(e){return this.x=e.x,this.y=e.y,this}add(e){return this.x+=e.x,this.y+=e.y,this}addScalar(e){return this.x+=e,this.y+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this}subScalar(e){return this.x-=e,this.y-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this}multiply(e){return this.x*=e.x,this.y*=e.y,this}multiplyScalar(e){return this.x*=e,this.y*=e,this}divide(e){return this.x/=e.x,this.y/=e.y,this}divideScalar(e){return this.multiplyScalar(1/e)}applyMatrix3(e){let t=this.x,n=this.y,r=e.elements;return this.x=r[0]*t+r[3]*n+r[6],this.y=r[1]*t+r[4]*n+r[7],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this}clamp(e,t){return this.x=st(this.x,e.x,t.x),this.y=st(this.y,e.y,t.y),this}clampScalar(e,t){return this.x=st(this.x,e,t),this.y=st(this.y,e,t),this}clampLength(e,t){let n=this.length();return this.divideScalar(n||1).multiplyScalar(st(n,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(e){return this.x*e.x+this.y*e.y}cross(e){return this.x*e.y-this.y*e.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(e){let t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;let n=this.dot(e)/t;return Math.acos(st(n,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){let t=this.x-e.x,n=this.y-e.y;return t*t+n*n}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this}equals(e){return e.x===this.x&&e.y===this.y}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this}rotateAround(e,t){let n=Math.cos(t),r=Math.sin(t),i=this.x-e.x,a=this.y-e.y;return this.x=i*n-a*r+e.x,this.y=i*r+a*n+e.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}},At=class{constructor(e=0,t=0,n=0,r=1){this.isQuaternion=!0,this._x=e,this._y=t,this._z=n,this._w=r}static slerpFlat(e,t,n,r,i,a,o){let s=n[r+0],c=n[r+1],l=n[r+2],u=n[r+3],d=i[a+0],f=i[a+1],p=i[a+2],m=i[a+3];if(u!==m||s!==d||c!==f||l!==p){let e=s*d+c*f+l*p+u*m;e<0&&(d=-d,f=-f,p=-p,m=-m,e=-e);let t=1-o;if(e<.9995){let n=Math.acos(e),r=Math.sin(n);t=Math.sin(t*n)/r,o=Math.sin(o*n)/r,s=s*t+d*o,c=c*t+f*o,l=l*t+p*o,u=u*t+m*o}else{s=s*t+d*o,c=c*t+f*o,l=l*t+p*o,u=u*t+m*o;let e=1/Math.sqrt(s*s+c*c+l*l+u*u);s*=e,c*=e,l*=e,u*=e}}e[t]=s,e[t+1]=c,e[t+2]=l,e[t+3]=u}static multiplyQuaternionsFlat(e,t,n,r,i,a){let o=n[r],s=n[r+1],c=n[r+2],l=n[r+3],u=i[a],d=i[a+1],f=i[a+2],p=i[a+3];return e[t]=o*p+l*u+s*f-c*d,e[t+1]=s*p+l*d+c*u-o*f,e[t+2]=c*p+l*f+o*d-s*u,e[t+3]=l*p-o*u-s*d-c*f,e}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get w(){return this._w}set w(e){this._w=e,this._onChangeCallback()}set(e,t,n,r){return this._x=e,this._y=t,this._z=n,this._w=r,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(e){return this._x=e.x,this._y=e.y,this._z=e.z,this._w=e.w,this._onChangeCallback(),this}setFromEuler(e,t=!0){let n=e._x,r=e._y,i=e._z,a=e._order,o=Math.cos,s=Math.sin,c=o(n/2),l=o(r/2),u=o(i/2),d=s(n/2),f=s(r/2),p=s(i/2);switch(a){case`XYZ`:this._x=d*l*u+c*f*p,this._y=c*f*u-d*l*p,this._z=c*l*p+d*f*u,this._w=c*l*u-d*f*p;break;case`YXZ`:this._x=d*l*u+c*f*p,this._y=c*f*u-d*l*p,this._z=c*l*p-d*f*u,this._w=c*l*u+d*f*p;break;case`ZXY`:this._x=d*l*u-c*f*p,this._y=c*f*u+d*l*p,this._z=c*l*p+d*f*u,this._w=c*l*u-d*f*p;break;case`ZYX`:this._x=d*l*u-c*f*p,this._y=c*f*u+d*l*p,this._z=c*l*p-d*f*u,this._w=c*l*u+d*f*p;break;case`YZX`:this._x=d*l*u+c*f*p,this._y=c*f*u+d*l*p,this._z=c*l*p-d*f*u,this._w=c*l*u-d*f*p;break;case`XZY`:this._x=d*l*u-c*f*p,this._y=c*f*u-d*l*p,this._z=c*l*p+d*f*u,this._w=c*l*u+d*f*p;break;default:G(`Quaternion: .setFromEuler() encountered an unknown order: `+a)}return t===!0&&this._onChangeCallback(),this}setFromAxisAngle(e,t){let n=t/2,r=Math.sin(n);return this._x=e.x*r,this._y=e.y*r,this._z=e.z*r,this._w=Math.cos(n),this._onChangeCallback(),this}setFromRotationMatrix(e){let t=e.elements,n=t[0],r=t[4],i=t[8],a=t[1],o=t[5],s=t[9],c=t[2],l=t[6],u=t[10],d=n+o+u;if(d>0){let e=.5/Math.sqrt(d+1);this._w=.25/e,this._x=(l-s)*e,this._y=(i-c)*e,this._z=(a-r)*e}else if(n>o&&n>u){let e=2*Math.sqrt(1+n-o-u);this._w=(l-s)/e,this._x=.25*e,this._y=(r+a)/e,this._z=(i+c)/e}else if(o>u){let e=2*Math.sqrt(1+o-n-u);this._w=(i-c)/e,this._x=(r+a)/e,this._y=.25*e,this._z=(s+l)/e}else{let e=2*Math.sqrt(1+u-n-o);this._w=(a-r)/e,this._x=(i+c)/e,this._y=(s+l)/e,this._z=.25*e}return this._onChangeCallback(),this}setFromUnitVectors(e,t){let n=e.dot(t)+1;return n<1e-8?(n=0,Math.abs(e.x)>Math.abs(e.z)?(this._x=-e.y,this._y=e.x,this._z=0,this._w=n):(this._x=0,this._y=-e.z,this._z=e.y,this._w=n)):(this._x=e.y*t.z-e.z*t.y,this._y=e.z*t.x-e.x*t.z,this._z=e.x*t.y-e.y*t.x,this._w=n),this.normalize()}angleTo(e){return 2*Math.acos(Math.abs(st(this.dot(e),-1,1)))}rotateTowards(e,t){let n=this.angleTo(e);if(n===0)return this;let r=Math.min(1,t/n);return this.slerp(e,r),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(e){return this._x*e._x+this._y*e._y+this._z*e._z+this._w*e._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let e=this.length();return e===0?(this._x=0,this._y=0,this._z=0,this._w=1):(e=1/e,this._x*=e,this._y*=e,this._z*=e,this._w*=e),this._onChangeCallback(),this}multiply(e){return this.multiplyQuaternions(this,e)}premultiply(e){return this.multiplyQuaternions(e,this)}multiplyQuaternions(e,t){let n=e._x,r=e._y,i=e._z,a=e._w,o=t._x,s=t._y,c=t._z,l=t._w;return this._x=n*l+a*o+r*c-i*s,this._y=r*l+a*s+i*o-n*c,this._z=i*l+a*c+n*s-r*o,this._w=a*l-n*o-r*s-i*c,this._onChangeCallback(),this}slerp(e,t){let n=e._x,r=e._y,i=e._z,a=e._w,o=this.dot(e);o<0&&(n=-n,r=-r,i=-i,a=-a,o=-o);let s=1-t;if(o<.9995){let e=Math.acos(o),c=Math.sin(e);s=Math.sin(s*e)/c,t=Math.sin(t*e)/c,this._x=this._x*s+n*t,this._y=this._y*s+r*t,this._z=this._z*s+i*t,this._w=this._w*s+a*t,this._onChangeCallback()}else this._x=this._x*s+n*t,this._y=this._y*s+r*t,this._z=this._z*s+i*t,this._w=this._w*s+a*t,this.normalize();return this}slerpQuaternions(e,t,n){return this.copy(e).slerp(t,n)}random(){let e=2*Math.PI*Math.random(),t=2*Math.PI*Math.random(),n=Math.random(),r=Math.sqrt(1-n),i=Math.sqrt(n);return this.set(r*Math.sin(e),r*Math.cos(e),i*Math.sin(t),i*Math.cos(t))}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._w===this._w}fromArray(e,t=0){return this._x=e[t],this._y=e[t+1],this._z=e[t+2],this._w=e[t+3],this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._w,e}fromBufferAttribute(e,t){return this._x=e.getX(t),this._y=e.getY(t),this._z=e.getZ(t),this._w=e.getW(t),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}},J=class{static{this.prototype.isVector3=!0}constructor(e=0,t=0,n=0){this.x=e,this.y=t,this.z=n}set(e,t,n){return n===void 0&&(n=this.z),this.x=e,this.y=t,this.z=n,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;default:throw Error(`THREE.Vector3: index is out of range: `+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw Error(`THREE.Vector3: index is out of range: `+e)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this}multiplyVectors(e,t){return this.x=e.x*t.x,this.y=e.y*t.y,this.z=e.z*t.z,this}applyEuler(e){return this.applyQuaternion(Mt.setFromEuler(e))}applyAxisAngle(e,t){return this.applyQuaternion(Mt.setFromAxisAngle(e,t))}applyMatrix3(e){let t=this.x,n=this.y,r=this.z,i=e.elements;return this.x=i[0]*t+i[3]*n+i[6]*r,this.y=i[1]*t+i[4]*n+i[7]*r,this.z=i[2]*t+i[5]*n+i[8]*r,this}applyNormalMatrix(e){return this.applyMatrix3(e).normalize()}applyMatrix4(e){let t=this.x,n=this.y,r=this.z,i=e.elements,a=1/(i[3]*t+i[7]*n+i[11]*r+i[15]);return this.x=(i[0]*t+i[4]*n+i[8]*r+i[12])*a,this.y=(i[1]*t+i[5]*n+i[9]*r+i[13])*a,this.z=(i[2]*t+i[6]*n+i[10]*r+i[14])*a,this}applyQuaternion(e){let t=this.x,n=this.y,r=this.z,i=e.x,a=e.y,o=e.z,s=e.w,c=2*(a*r-o*n),l=2*(o*t-i*r),u=2*(i*n-a*t);return this.x=t+s*c+a*u-o*l,this.y=n+s*l+o*c-i*u,this.z=r+s*u+i*l-a*c,this}project(e){return this.applyMatrix4(e.matrixWorldInverse).applyMatrix4(e.projectionMatrix)}unproject(e){return this.applyMatrix4(e.projectionMatrixInverse).applyMatrix4(e.matrixWorld)}transformDirection(e){let t=this.x,n=this.y,r=this.z,i=e.elements;return this.x=i[0]*t+i[4]*n+i[8]*r,this.y=i[1]*t+i[5]*n+i[9]*r,this.z=i[2]*t+i[6]*n+i[10]*r,this.normalize()}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this}divideScalar(e){return this.multiplyScalar(1/e)}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this}clamp(e,t){return this.x=st(this.x,e.x,t.x),this.y=st(this.y,e.y,t.y),this.z=st(this.z,e.z,t.z),this}clampScalar(e,t){return this.x=st(this.x,e,t),this.y=st(this.y,e,t),this.z=st(this.z,e,t),this}clampLength(e,t){let n=this.length();return this.divideScalar(n||1).multiplyScalar(st(n,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this.z=e.z+(t.z-e.z)*n,this}cross(e){return this.crossVectors(this,e)}crossVectors(e,t){let n=e.x,r=e.y,i=e.z,a=t.x,o=t.y,s=t.z;return this.x=r*s-i*o,this.y=i*a-n*s,this.z=n*o-r*a,this}projectOnVector(e){let t=e.lengthSq();if(t===0)return this.set(0,0,0);let n=e.dot(this)/t;return this.copy(e).multiplyScalar(n)}projectOnPlane(e){return jt.copy(this).projectOnVector(e),this.sub(jt)}reflect(e){return this.sub(jt.copy(e).multiplyScalar(2*this.dot(e)))}angleTo(e){let t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;let n=this.dot(e)/t;return Math.acos(st(n,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){let t=this.x-e.x,n=this.y-e.y,r=this.z-e.z;return t*t+n*n+r*r}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)+Math.abs(this.z-e.z)}setFromSpherical(e){return this.setFromSphericalCoords(e.radius,e.phi,e.theta)}setFromSphericalCoords(e,t,n){let r=Math.sin(t)*e;return this.x=r*Math.sin(n),this.y=Math.cos(t)*e,this.z=r*Math.cos(n),this}setFromCylindrical(e){return this.setFromCylindricalCoords(e.radius,e.theta,e.y)}setFromCylindricalCoords(e,t,n){return this.x=e*Math.sin(t),this.y=n,this.z=e*Math.cos(t),this}setFromMatrixPosition(e){let t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this}setFromMatrixScale(e){let t=this.setFromMatrixColumn(e,0).length(),n=this.setFromMatrixColumn(e,1).length(),r=this.setFromMatrixColumn(e,2).length();return this.x=t,this.y=n,this.z=r,this}setFromMatrixColumn(e,t){return this.fromArray(e.elements,t*4)}setFromMatrix3Column(e,t){return this.fromArray(e.elements,t*3)}setFromEuler(e){return this.x=e._x,this.y=e._y,this.z=e._z,this}setFromColor(e){return this.x=e.r,this.y=e.g,this.z=e.b,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){let e=Math.random()*Math.PI*2,t=Math.random()*2-1,n=Math.sqrt(1-t*t);return this.x=n*Math.cos(e),this.y=t,this.z=n*Math.sin(e),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}},jt=new J,Mt=new At,Nt=class{static{this.prototype.isMatrix3=!0}constructor(e,t,n,r,i,a,o,s,c){this.elements=[1,0,0,0,1,0,0,0,1],e!==void 0&&this.set(e,t,n,r,i,a,o,s,c)}set(e,t,n,r,i,a,o,s,c){let l=this.elements;return l[0]=e,l[1]=r,l[2]=o,l[3]=t,l[4]=i,l[5]=s,l[6]=n,l[7]=a,l[8]=c,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(e){let t=this.elements,n=e.elements;return t[0]=n[0],t[1]=n[1],t[2]=n[2],t[3]=n[3],t[4]=n[4],t[5]=n[5],t[6]=n[6],t[7]=n[7],t[8]=n[8],this}extractBasis(e,t,n){return e.setFromMatrix3Column(this,0),t.setFromMatrix3Column(this,1),n.setFromMatrix3Column(this,2),this}setFromMatrix4(e){let t=e.elements;return this.set(t[0],t[4],t[8],t[1],t[5],t[9],t[2],t[6],t[10]),this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){let n=e.elements,r=t.elements,i=this.elements,a=n[0],o=n[3],s=n[6],c=n[1],l=n[4],u=n[7],d=n[2],f=n[5],p=n[8],m=r[0],h=r[3],g=r[6],_=r[1],v=r[4],y=r[7],b=r[2],x=r[5],S=r[8];return i[0]=a*m+o*_+s*b,i[3]=a*h+o*v+s*x,i[6]=a*g+o*y+s*S,i[1]=c*m+l*_+u*b,i[4]=c*h+l*v+u*x,i[7]=c*g+l*y+u*S,i[2]=d*m+f*_+p*b,i[5]=d*h+f*v+p*x,i[8]=d*g+f*y+p*S,this}multiplyScalar(e){let t=this.elements;return t[0]*=e,t[3]*=e,t[6]*=e,t[1]*=e,t[4]*=e,t[7]*=e,t[2]*=e,t[5]*=e,t[8]*=e,this}determinant(){let e=this.elements,t=e[0],n=e[1],r=e[2],i=e[3],a=e[4],o=e[5],s=e[6],c=e[7],l=e[8];return t*a*l-t*o*c-n*i*l+n*o*s+r*i*c-r*a*s}invert(){let e=this.elements,t=e[0],n=e[1],r=e[2],i=e[3],a=e[4],o=e[5],s=e[6],c=e[7],l=e[8],u=l*a-o*c,d=o*s-l*i,f=c*i-a*s,p=t*u+n*d+r*f;if(p===0)return this.set(0,0,0,0,0,0,0,0,0);let m=1/p;return e[0]=u*m,e[1]=(r*c-l*n)*m,e[2]=(o*n-r*a)*m,e[3]=d*m,e[4]=(l*t-r*s)*m,e[5]=(r*i-o*t)*m,e[6]=f*m,e[7]=(n*s-c*t)*m,e[8]=(a*t-n*i)*m,this}transpose(){let e,t=this.elements;return e=t[1],t[1]=t[3],t[3]=e,e=t[2],t[2]=t[6],t[6]=e,e=t[5],t[5]=t[7],t[7]=e,this}getNormalMatrix(e){return this.setFromMatrix4(e).invert().transpose()}transposeIntoArray(e){let t=this.elements;return e[0]=t[0],e[1]=t[3],e[2]=t[6],e[3]=t[1],e[4]=t[4],e[5]=t[7],e[6]=t[2],e[7]=t[5],e[8]=t[8],this}setUvTransform(e,t,n,r,i,a,o){let s=Math.cos(i),c=Math.sin(i);return this.set(n*s,n*c,-n*(s*a+c*o)+a+e,-r*c,r*s,-r*(-c*a+s*o)+o+t,0,0,1),this}scale(e,t){return Qe(`Matrix3: .scale() is deprecated. Use .makeScale() instead.`),this.premultiply(Pt.makeScale(e,t)),this}rotate(e){return Qe(`Matrix3: .rotate() is deprecated. Use .makeRotation() instead.`),this.premultiply(Pt.makeRotation(-e)),this}translate(e,t){return Qe(`Matrix3: .translate() is deprecated. Use .makeTranslation() instead.`),this.premultiply(Pt.makeTranslation(e,t)),this}makeTranslation(e,t){return e.isVector2?this.set(1,0,e.x,0,1,e.y,0,0,1):this.set(1,0,e,0,1,t,0,0,1),this}makeRotation(e){let t=Math.cos(e),n=Math.sin(e);return this.set(t,-n,0,n,t,0,0,0,1),this}makeScale(e,t){return this.set(e,0,0,0,t,0,0,0,1),this}equals(e){let t=this.elements,n=e.elements;for(let e=0;e<9;e++)if(t[e]!==n[e])return!1;return!0}fromArray(e,t=0){for(let n=0;n<9;n++)this.elements[n]=e[n+t];return this}toArray(e=[],t=0){let n=this.elements;return e[t]=n[0],e[t+1]=n[1],e[t+2]=n[2],e[t+3]=n[3],e[t+4]=n[4],e[t+5]=n[5],e[t+6]=n[6],e[t+7]=n[7],e[t+8]=n[8],e}clone(){return new this.constructor().fromArray(this.elements)}},Pt=new Nt,Ft=new Nt().set(.4123908,.3575843,.1804808,.212639,.7151687,.0721923,.0193308,.1191948,.9505322),It=new Nt().set(3.2409699,-1.5373832,-.4986108,-.9692436,1.8759675,.0415551,.0556301,-.203977,1.0569715);function Lt(){let e={enabled:!0,workingColorSpace:Re,spaces:{},convert:function(e,t,n){return this.enabled===!1||t===n||!t||!n||(this.spaces[t].transfer===`srgb`&&(e.r=zt(e.r),e.g=zt(e.g),e.b=zt(e.b)),this.spaces[t].primaries!==this.spaces[n].primaries&&(e.applyMatrix3(this.spaces[t].toXYZ),e.applyMatrix3(this.spaces[n].fromXYZ)),this.spaces[n].transfer===`srgb`&&(e.r=Bt(e.r),e.g=Bt(e.g),e.b=Bt(e.b))),e},workingToColorSpace:function(e,t){return this.convert(e,this.workingColorSpace,t)},colorSpaceToWorking:function(e,t){return this.convert(e,t,this.workingColorSpace)},getPrimaries:function(e){return this.spaces[e].primaries},getTransfer:function(e){return e===``?ze:this.spaces[e].transfer},getToneMappingMode:function(e){return this.spaces[e].outputColorSpaceConfig.toneMappingMode||`standard`},getLuminanceCoefficients:function(e,t=this.workingColorSpace){return e.fromArray(this.spaces[t].luminanceCoefficients)},define:function(e){Object.assign(this.spaces,e)},_getMatrix:function(e,t,n){return e.copy(this.spaces[n].fromXYZ).multiply(this.spaces[t].toXYZ)},_getDrawingBufferColorSpace:function(e){return this.spaces[e].outputColorSpaceConfig.drawingBufferColorSpace},_getUnpackColorSpace:function(e=this.workingColorSpace){return this.spaces[e].workingColorSpaceConfig.unpackColorSpace}},t=[.64,.33,.3,.6,.15,.06],n=[.2126,.7152,.0722],r=[.3127,.329];return e.define({[Re]:{primaries:t,whitePoint:r,transfer:ze,toXYZ:Ft,fromXYZ:It,luminanceCoefficients:n,workingColorSpaceConfig:{unpackColorSpace:Le},outputColorSpaceConfig:{drawingBufferColorSpace:Le}},[Le]:{primaries:t,whitePoint:r,transfer:Be,toXYZ:Ft,fromXYZ:It,luminanceCoefficients:n,outputColorSpaceConfig:{drawingBufferColorSpace:Le}}}),e}var Rt=Lt();function zt(e){return e<.04045?e*.0773993808:(e*.9478672986+.0521327014)**2.4}function Bt(e){return e<.0031308?e*12.92:1.055*e**.41666-.055}var Vt,Ht=class{static getDataURL(e,t=`image/png`){if(/^data:/i.test(e.src)||typeof HTMLCanvasElement>`u`)return e.src;let n;if(e instanceof HTMLCanvasElement)n=e;else{Vt===void 0&&(Vt=qe(`canvas`)),Vt.width=e.width,Vt.height=e.height;let t=Vt.getContext(`2d`);e instanceof ImageData?t.putImageData(e,0,0):t.drawImage(e,0,0,e.width,e.height),n=Vt}return n.toDataURL(t)}static sRGBToLinear(e){if(typeof HTMLImageElement<`u`&&e instanceof HTMLImageElement||typeof HTMLCanvasElement<`u`&&e instanceof HTMLCanvasElement||typeof ImageBitmap<`u`&&e instanceof ImageBitmap){let t=qe(`canvas`);t.width=e.width,t.height=e.height;let n=t.getContext(`2d`);n.drawImage(e,0,0,e.width,e.height);let r=n.getImageData(0,0,e.width,e.height),i=r.data;for(let e=0;e<i.length;e++)i[e]=zt(i[e]/255)*255;return n.putImageData(r,0,0),t}if(e.data){let t=e.data.slice(0);for(let e=0;e<t.length;e++)t instanceof Uint8Array||t instanceof Uint8ClampedArray?t[e]=Math.floor(zt(t[e]/255)*255):t[e]=zt(t[e]);return{data:t,width:e.width,height:e.height}}return G(`ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied.`),e}},Ut=0,Wt=class{constructor(e=null){this.isTextureSource=!0,Object.defineProperty(this,"id",{value:Ut++}),this.uuid=ot(),this.data=e,this.dataReady=!0,this.version=0}getSize(e){let t=this.data;return typeof HTMLVideoElement<`u`&&t instanceof HTMLVideoElement?e.set(t.videoWidth,t.videoHeight,0):typeof VideoFrame<`u`&&t instanceof VideoFrame?e.set(t.displayWidth,t.displayHeight,0):t===null?e.set(0,0,0):e.set(t.width||0,t.height||0,t.depth||0),e}set needsUpdate(e){e===!0&&this.version++}toJSON(e){let t=e===void 0||typeof e==`string`;if(!t&&e.images[this.uuid]!==void 0)return e.images[this.uuid];let n={uuid:this.uuid,url:``},r=this.data;if(r!==null){let e;if(Array.isArray(r)){e=[];for(let t=0,n=r.length;t<n;t++)r[t].isDataTexture?e.push(Gt(r[t].image)):e.push(Gt(r[t]))}else e=Gt(r);n.url=e}return t||(e.images[this.uuid]=n),n}};function Gt(e){return typeof HTMLImageElement<`u`&&e instanceof HTMLImageElement||typeof HTMLCanvasElement<`u`&&e instanceof HTMLCanvasElement||typeof ImageBitmap<`u`&&e instanceof ImageBitmap?Ht.getDataURL(e):e.data?{data:Array.from(e.data),width:e.width,height:e.height,type:e.data.constructor.name}:(G(`Texture: Unable to serialize Texture.`),{})}var Kt=0,qt=new J,Jt=class e extends tt{constructor(t=e.DEFAULT_IMAGE,r=e.DEFAULT_MAPPING,i=n,a=n,o=s,c=l,d=T,f=u,p=e.DEFAULT_ANISOTROPY,m=``){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:Kt++}),this.uuid=ot(),this.name=``,this.source=new Wt(t),this.mipmaps=[],this.mapping=r,this.channel=0,this.wrapS=i,this.wrapT=a,this.magFilter=o,this.minFilter=c,this.anisotropy=p,this.format=d,this.internalFormat=null,this.type=f,this.offset=new q(0,0),this.repeat=new q(1,1),this.center=new q(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new Nt,this.generateMipmaps=!0,this.mipmapsAutoUpdate=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,this.colorSpace=m,this.userData={},this.updateRanges=[],this.version=0,this.onUpdate=null,this.renderTarget=null,this.isRenderTargetTexture=!1,this.isArrayTexture=!!(t&&t.depth&&t.depth>1),this.pmremVersion=0,this.isPMREMTexture=!1,this.normalized=!1}get width(){return this.source.getSize(qt).x}get height(){return this.source.getSize(qt).y}get depth(){return this.source.getSize(qt).z}get image(){return this.source.data}set image(e){this.source.data=e}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}clone(){return new this.constructor().copy(this)}copy(e){return this.name=e.name,this.source=e.source,this.mipmaps=e.mipmaps.slice(0),this.mapping=e.mapping,this.channel=e.channel,this.wrapS=e.wrapS,this.wrapT=e.wrapT,this.magFilter=e.magFilter,this.minFilter=e.minFilter,this.anisotropy=e.anisotropy,this.format=e.format,this.internalFormat=e.internalFormat,this.type=e.type,this.normalized=e.normalized,this.offset.copy(e.offset),this.repeat.copy(e.repeat),this.center.copy(e.center),this.rotation=e.rotation,this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrix.copy(e.matrix),this.generateMipmaps=e.generateMipmaps,this.mipmapsAutoUpdate=e.mipmapsAutoUpdate,this.premultiplyAlpha=e.premultiplyAlpha,this.flipY=e.flipY,this.unpackAlignment=e.unpackAlignment,this.colorSpace=e.colorSpace,this.renderTarget=e.renderTarget,this.isRenderTargetTexture=e.isRenderTargetTexture,this.isPMREMTexture=e.isPMREMTexture,this.isArrayTexture=e.isArrayTexture,this.userData=JSON.parse(JSON.stringify(e.userData)),this.needsUpdate=!0,this}setValues(e){for(let t in e){let n=e[t];if(n===void 0){G(`Texture.setValues(): parameter '${t}' has value of undefined.`);continue}let r=this[t];r===void 0?G(`Texture.setValues(): property '${t}' does not exist.`):r&&n&&r.isVector2&&n.isVector2||r&&n&&r.isVector3&&n.isVector3||r&&n&&r.isMatrix3&&n.isMatrix3?r.copy(n):this[t]=n}}toJSON(e){let t=e===void 0||typeof e==`string`;if(!t&&e.textures[this.uuid]!==void 0)return e.textures[this.uuid];let n={metadata:{version:4.7,type:`Texture`,generator:`Texture.toJSON`},uuid:this.uuid,name:this.name,image:this.source.toJSON(e).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,normalized:this.normalized,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,mipmapsAutoUpdate:this.mipmapsAutoUpdate,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(n.userData=this.userData),t||(e.textures[this.uuid]=n),n}dispose(){this.dispatchEvent({type:`dispose`})}transformUv(e){if(this.mapping!==300)return e;if(e.applyMatrix3(this.matrix),e.x<0||e.x>1)switch(this.wrapS){case t:e.x-=Math.floor(e.x);break;case n:e.x=e.x<0?0:1;break;case r:Math.abs(Math.floor(e.x)%2)===1?e.x=Math.ceil(e.x)-e.x:e.x-=Math.floor(e.x)}if(e.y<0||e.y>1)switch(this.wrapT){case t:e.y-=Math.floor(e.y);break;case n:e.y=e.y<0?0:1;break;case r:Math.abs(Math.floor(e.y)%2)===1?e.y=Math.ceil(e.y)-e.y:e.y-=Math.floor(e.y)}return this.flipY&&(e.y=1-e.y),e}set needsUpdate(e){e===!0&&(this.version++,this.source.needsUpdate=!0)}set needsPMREMUpdate(e){e===!0&&this.pmremVersion++}};Jt.DEFAULT_IMAGE=null,Jt.DEFAULT_MAPPING=300,Jt.DEFAULT_ANISOTROPY=1;var Yt=class{static{this.prototype.isVector4=!0}constructor(e=0,t=0,n=0,r=1){this.x=e,this.y=t,this.z=n,this.w=r}get width(){return this.z}set width(e){this.z=e}get height(){return this.w}set height(e){this.w=e}set(e,t,n,r){return this.x=e,this.y=t,this.z=n,this.w=r,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this.w=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setW(e){return this.w=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;case 3:this.w=t;break;default:throw Error(`THREE.Vector4: index is out of range: `+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw Error(`THREE.Vector4: index is out of range: `+e)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this.w=e.w===void 0?1:e.w,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this.w+=e.w,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this.w+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this.w=e.w+t.w,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this.w+=e.w*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this.w-=e.w,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this.w-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this.w=e.w-t.w,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this.w*=e.w,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this.w*=e,this}applyMatrix4(e){let t=this.x,n=this.y,r=this.z,i=this.w,a=e.elements;return this.x=a[0]*t+a[4]*n+a[8]*r+a[12]*i,this.y=a[1]*t+a[5]*n+a[9]*r+a[13]*i,this.z=a[2]*t+a[6]*n+a[10]*r+a[14]*i,this.w=a[3]*t+a[7]*n+a[11]*r+a[15]*i,this}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this.w/=e.w,this}divideScalar(e){return this.multiplyScalar(1/e)}setAxisAngleFromQuaternion(e){this.w=2*Math.acos(e.w);let t=Math.sqrt(1-e.w*e.w);return t<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=e.x/t,this.y=e.y/t,this.z=e.z/t),this}setAxisAngleFromRotationMatrix(e){let t,n,r,i,a=.01,o=.1,s=e.elements,c=s[0],l=s[4],u=s[8],d=s[1],f=s[5],p=s[9],m=s[2],h=s[6],g=s[10];if(Math.abs(l-d)<a&&Math.abs(u-m)<a&&Math.abs(p-h)<a){if(Math.abs(l+d)<o&&Math.abs(u+m)<o&&Math.abs(p+h)<o&&Math.abs(c+f+g-3)<o)return this.set(1,0,0,0),this;t=Math.PI;let e=(c+1)/2,s=(f+1)/2,_=(g+1)/2,v=(l+d)/4,y=(u+m)/4,b=(p+h)/4;return e>s&&e>_?e<a?(n=0,r=.707106781,i=.707106781):(n=Math.sqrt(e),r=v/n,i=y/n):s>_?s<a?(n=.707106781,r=0,i=.707106781):(r=Math.sqrt(s),n=v/r,i=b/r):_<a?(n=.707106781,r=.707106781,i=0):(i=Math.sqrt(_),n=y/i,r=b/i),this.set(n,r,i,t),this}let _=Math.sqrt((h-p)*(h-p)+(u-m)*(u-m)+(d-l)*(d-l));return Math.abs(_)<.001&&(_=1),this.x=(h-p)/_,this.y=(u-m)/_,this.z=(d-l)/_,this.w=Math.acos((c+f+g-1)/2),this}setFromMatrixPosition(e){let t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this.w=t[15],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this.w=Math.min(this.w,e.w),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this.w=Math.max(this.w,e.w),this}clamp(e,t){return this.x=st(this.x,e.x,t.x),this.y=st(this.y,e.y,t.y),this.z=st(this.z,e.z,t.z),this.w=st(this.w,e.w,t.w),this}clampScalar(e,t){return this.x=st(this.x,e,t),this.y=st(this.y,e,t),this.z=st(this.z,e,t),this.w=st(this.w,e,t),this}clampLength(e,t){let n=this.length();return this.divideScalar(n||1).multiplyScalar(st(n,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z+this.w*e.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this.w+=(e.w-this.w)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this.z=e.z+(t.z-e.z)*n,this.w=e.w+(t.w-e.w)*n,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z&&e.w===this.w}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this.w=e[t+3],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e[t+3]=this.w,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this.w=e.getW(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}},Xt=class extends tt{constructor(e=1,t=1,n={}){super(),n=Object.assign({generateMipmaps:!1,internalFormat:null,minFilter:s,depthBuffer:!0,stencilBuffer:!1,resolveColorBuffer:!0,resolveDepthBuffer:!0,resolveStencilBuffer:!0,storeMultisampledColorBuffer:!0,storeMultisampledDepthBuffer:!0,storeMultisampledStencilBuffer:!0,depthTexture:null,samples:0,count:1,depth:1,multiview:!1,useArrayDepthTexture:!1},n),this.isRenderTarget=!0,this.width=e,this.height=t,this.depth=n.depth,this.scissor=new Yt(0,0,e,t),this.scissorTest=!1,this.viewport=new Yt(0,0,e,t),this.textures=[];let r=n.count;for(let i=0;i<r;i++)this.textures[i]=new Jt({width:e,height:t,depth:n.depth}),this.textures[i].isRenderTargetTexture=!0,this.textures[i].renderTarget=this;this._setTextureOptions(n),this.depthBuffer=n.depthBuffer,this.stencilBuffer=n.stencilBuffer,this.resolveColorBuffer=n.resolveColorBuffer,this.resolveDepthBuffer=n.resolveDepthBuffer,this.resolveStencilBuffer=n.resolveStencilBuffer,this.storeMultisampledColorBuffer=n.storeMultisampledColorBuffer,this.storeMultisampledDepthBuffer=n.storeMultisampledDepthBuffer,this.storeMultisampledStencilBuffer=n.storeMultisampledStencilBuffer,this._depthTexture=null,this.depthTexture=n.depthTexture,this.samples=n.samples,this.multiview=n.multiview,this.useArrayDepthTexture=n.useArrayDepthTexture}_setTextureOptions(e={}){let t={minFilter:s,generateMipmaps:!1,flipY:!1,internalFormat:null};e.mapping!==void 0&&(t.mapping=e.mapping),e.wrapS!==void 0&&(t.wrapS=e.wrapS),e.wrapT!==void 0&&(t.wrapT=e.wrapT),e.wrapR!==void 0&&(t.wrapR=e.wrapR),e.magFilter!==void 0&&(t.magFilter=e.magFilter),e.minFilter!==void 0&&(t.minFilter=e.minFilter),e.format!==void 0&&(t.format=e.format),e.type!==void 0&&(t.type=e.type),e.anisotropy!==void 0&&(t.anisotropy=e.anisotropy),e.colorSpace!==void 0&&(t.colorSpace=e.colorSpace),e.flipY!==void 0&&(t.flipY=e.flipY),e.generateMipmaps!==void 0&&(t.generateMipmaps=e.generateMipmaps),e.mipmapsAutoUpdate!==void 0&&(t.mipmapsAutoUpdate=e.mipmapsAutoUpdate),e.internalFormat!==void 0&&(t.internalFormat=e.internalFormat);for(let e=0;e<this.textures.length;e++)this.textures[e].setValues(t)}get texture(){return this.textures[0]}set texture(e){this.textures[0]=e}set depthTexture(e){this._depthTexture!==null&&this._depthTexture.renderTarget===this&&(this._depthTexture.renderTarget=null),e!==null&&e.renderTarget===null&&(e.renderTarget=this),this._depthTexture=e}get depthTexture(){return this._depthTexture}setSize(e,t,n=1){if(this.width!==e||this.height!==t||this.depth!==n){this.width=e,this.height=t,this.depth=n;for(let r=0,i=this.textures.length;r<i;r++)this.textures[r].image.width=e,this.textures[r].image.height=t,this.textures[r].image.depth=n,this.textures[r].isData3DTexture!==!0&&(this.textures[r].isArrayTexture=this.textures[r].image.depth>1);this.dispose()}this.viewport.set(0,0,e,t),this.scissor.set(0,0,e,t)}clone(){return new this.constructor().copy(this)}copy(e){this.width=e.width,this.height=e.height,this.depth=e.depth,this.scissor.copy(e.scissor),this.scissorTest=e.scissorTest,this.viewport.copy(e.viewport),this.textures.length=0;for(let t=0,n=e.textures.length;t<n;t++){this.textures[t]=e.textures[t].clone(),this.textures[t].isRenderTargetTexture=!0,this.textures[t].renderTarget=this;let n=Object.assign({},e.textures[t].image);this.textures[t].source=new Wt(n)}if(this.depthBuffer=e.depthBuffer,this.stencilBuffer=e.stencilBuffer,this.resolveColorBuffer=e.resolveColorBuffer,this.resolveDepthBuffer=e.resolveDepthBuffer,this.resolveStencilBuffer=e.resolveStencilBuffer,this.storeMultisampledColorBuffer=e.storeMultisampledColorBuffer,this.storeMultisampledDepthBuffer=e.storeMultisampledDepthBuffer,this.storeMultisampledStencilBuffer=e.storeMultisampledStencilBuffer,e.depthTexture!==null){if(e.depthTexture.renderTarget===e){let t=e.depthTexture.clone();t.renderTarget=null,this.depthTexture=t}else this.depthTexture=e.depthTexture}else this.depthTexture=null;return this.samples=e.samples,this.multiview=e.multiview,this.useArrayDepthTexture=e.useArrayDepthTexture,this}dispose(){this.dispatchEvent({type:`dispose`})}},Zt=class extends Xt{constructor(e=1,t=1,n={}){super(e,t,n),this.isWebGLRenderTarget=!0}},Qt=class extends Jt{constructor(e=null,t=1,r=1,a=1){super(null),this.isDataArrayTexture=!0,this.image={data:e,width:t,height:r,depth:a},this.magFilter=i,this.minFilter=i,this.wrapR=n,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1,this.layerUpdates=new Set}copy(e){return super.copy(e),this.wrapR=e.wrapR,this}addLayerUpdate(e){this.layerUpdates.add(e)}clearLayerUpdates(){this.layerUpdates.clear()}},$t=class extends Jt{constructor(e=null,t=1,r=1,a=1){super(null),this.isData3DTexture=!0,this.image={data:e,width:t,height:r,depth:a},this.magFilter=i,this.minFilter=i,this.wrapR=n,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}copy(e){return super.copy(e),this.wrapR=e.wrapR,this}},Y=class e{static{this.prototype.isMatrix4=!0}constructor(e,t,n,r,i,a,o,s,c,l,u,d,f,p,m,h){this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],e!==void 0&&this.set(e,t,n,r,i,a,o,s,c,l,u,d,f,p,m,h)}set(e,t,n,r,i,a,o,s,c,l,u,d,f,p,m,h){let g=this.elements;return g[0]=e,g[4]=t,g[8]=n,g[12]=r,g[1]=i,g[5]=a,g[9]=o,g[13]=s,g[2]=c,g[6]=l,g[10]=u,g[14]=d,g[3]=f,g[7]=p,g[11]=m,g[15]=h,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new e().fromArray(this.elements)}copy(e){let t=this.elements,n=e.elements;return t[0]=n[0],t[1]=n[1],t[2]=n[2],t[3]=n[3],t[4]=n[4],t[5]=n[5],t[6]=n[6],t[7]=n[7],t[8]=n[8],t[9]=n[9],t[10]=n[10],t[11]=n[11],t[12]=n[12],t[13]=n[13],t[14]=n[14],t[15]=n[15],this}copyPosition(e){let t=this.elements,n=e.elements;return t[12]=n[12],t[13]=n[13],t[14]=n[14],this}setFromMatrix3(e){let t=e.elements;return this.set(t[0],t[3],t[6],0,t[1],t[4],t[7],0,t[2],t[5],t[8],0,0,0,0,1),this}extractBasis(e,t,n){return this.determinantAffine()===0?(e.set(1,0,0),t.set(0,1,0),n.set(0,0,1),this):(e.setFromMatrixColumn(this,0),t.setFromMatrixColumn(this,1),n.setFromMatrixColumn(this,2),this)}makeBasis(e,t,n){return this.set(e.x,t.x,n.x,0,e.y,t.y,n.y,0,e.z,t.z,n.z,0,0,0,0,1),this}extractRotation(e){if(e.determinantAffine()===0)return this.identity();let t=this.elements,n=e.elements,r=1/en.setFromMatrixColumn(e,0).length(),i=1/en.setFromMatrixColumn(e,1).length(),a=1/en.setFromMatrixColumn(e,2).length();return t[0]=n[0]*r,t[1]=n[1]*r,t[2]=n[2]*r,t[3]=0,t[4]=n[4]*i,t[5]=n[5]*i,t[6]=n[6]*i,t[7]=0,t[8]=n[8]*a,t[9]=n[9]*a,t[10]=n[10]*a,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromEuler(e){let t=this.elements,n=e.x,r=e.y,i=e.z,a=Math.cos(n),o=Math.sin(n),s=Math.cos(r),c=Math.sin(r),l=Math.cos(i),u=Math.sin(i);if(e.order===`XYZ`){let e=a*l,n=a*u,r=o*l,i=o*u;t[0]=s*l,t[4]=-s*u,t[8]=c,t[1]=n+r*c,t[5]=e-i*c,t[9]=-o*s,t[2]=i-e*c,t[6]=r+n*c,t[10]=a*s}else if(e.order===`YXZ`){let e=s*l,n=s*u,r=c*l,i=c*u;t[0]=e+i*o,t[4]=r*o-n,t[8]=a*c,t[1]=a*u,t[5]=a*l,t[9]=-o,t[2]=n*o-r,t[6]=i+e*o,t[10]=a*s}else if(e.order===`ZXY`){let e=s*l,n=s*u,r=c*l,i=c*u;t[0]=e-i*o,t[4]=-a*u,t[8]=r+n*o,t[1]=n+r*o,t[5]=a*l,t[9]=i-e*o,t[2]=-a*c,t[6]=o,t[10]=a*s}else if(e.order===`ZYX`){let e=a*l,n=a*u,r=o*l,i=o*u;t[0]=s*l,t[4]=r*c-n,t[8]=e*c+i,t[1]=s*u,t[5]=i*c+e,t[9]=n*c-r,t[2]=-c,t[6]=o*s,t[10]=a*s}else if(e.order===`YZX`){let e=a*s,n=a*c,r=o*s,i=o*c;t[0]=s*l,t[4]=i-e*u,t[8]=r*u+n,t[1]=u,t[5]=a*l,t[9]=-o*l,t[2]=-c*l,t[6]=n*u+r,t[10]=e-i*u}else if(e.order===`XZY`){let e=a*s,n=a*c,r=o*s,i=o*c;t[0]=s*l,t[4]=-u,t[8]=c*l,t[1]=e*u+i,t[5]=a*l,t[9]=n*u-r,t[2]=r*u-n,t[6]=o*l,t[10]=i*u+e}return t[3]=0,t[7]=0,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromQuaternion(e){return this.compose(nn,e,rn)}lookAt(e,t,n){let r=this.elements;return sn.subVectors(e,t),sn.lengthSq()===0&&(sn.z=1),sn.normalize(),an.crossVectors(n,sn),an.lengthSq()===0&&(Math.abs(n.z)===1?sn.x+=1e-4:sn.z+=1e-4,sn.normalize(),an.crossVectors(n,sn)),an.normalize(),on.crossVectors(sn,an),r[0]=an.x,r[4]=on.x,r[8]=sn.x,r[1]=an.y,r[5]=on.y,r[9]=sn.y,r[2]=an.z,r[6]=on.z,r[10]=sn.z,this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){let n=e.elements,r=t.elements,i=this.elements,a=n[0],o=n[4],s=n[8],c=n[12],l=n[1],u=n[5],d=n[9],f=n[13],p=n[2],m=n[6],h=n[10],g=n[14],_=n[3],v=n[7],y=n[11],b=n[15],x=r[0],S=r[4],C=r[8],w=r[12],T=r[1],E=r[5],D=r[9],O=r[13],k=r[2],A=r[6],j=r[10],M=r[14],ee=r[3],N=r[7],P=r[11],F=r[15];return i[0]=a*x+o*T+s*k+c*ee,i[4]=a*S+o*E+s*A+c*N,i[8]=a*C+o*D+s*j+c*P,i[12]=a*w+o*O+s*M+c*F,i[1]=l*x+u*T+d*k+f*ee,i[5]=l*S+u*E+d*A+f*N,i[9]=l*C+u*D+d*j+f*P,i[13]=l*w+u*O+d*M+f*F,i[2]=p*x+m*T+h*k+g*ee,i[6]=p*S+m*E+h*A+g*N,i[10]=p*C+m*D+h*j+g*P,i[14]=p*w+m*O+h*M+g*F,i[3]=_*x+v*T+y*k+b*ee,i[7]=_*S+v*E+y*A+b*N,i[11]=_*C+v*D+y*j+b*P,i[15]=_*w+v*O+y*M+b*F,this}multiplyScalar(e){let t=this.elements;return t[0]*=e,t[4]*=e,t[8]*=e,t[12]*=e,t[1]*=e,t[5]*=e,t[9]*=e,t[13]*=e,t[2]*=e,t[6]*=e,t[10]*=e,t[14]*=e,t[3]*=e,t[7]*=e,t[11]*=e,t[15]*=e,this}determinant(){let e=this.elements,t=e[0],n=e[4],r=e[8],i=e[12],a=e[1],o=e[5],s=e[9],c=e[13],l=e[2],u=e[6],d=e[10],f=e[14],p=e[3],m=e[7],h=e[11],g=e[15],_=s*f-c*d,v=o*f-c*u,y=o*d-s*u,b=a*f-c*l,x=a*d-s*l,S=a*u-o*l;return t*(m*_-h*v+g*y)-n*(p*_-h*b+g*x)+r*(p*v-m*b+g*S)-i*(p*y-m*x+h*S)}determinantAffine(){let e=this.elements,t=e[0],n=e[4],r=e[8],i=e[1],a=e[5],o=e[9],s=e[2],c=e[6],l=e[10];return t*(a*l-o*c)-n*(i*l-o*s)+r*(i*c-a*s)}transpose(){let e=this.elements,t;return t=e[1],e[1]=e[4],e[4]=t,t=e[2],e[2]=e[8],e[8]=t,t=e[6],e[6]=e[9],e[9]=t,t=e[3],e[3]=e[12],e[12]=t,t=e[7],e[7]=e[13],e[13]=t,t=e[11],e[11]=e[14],e[14]=t,this}setPosition(e,t,n){let r=this.elements;return e.isVector3?(r[12]=e.x,r[13]=e.y,r[14]=e.z):(r[12]=e,r[13]=t,r[14]=n),this}invert(){let e=this.elements,t=e[0],n=e[1],r=e[2],i=e[3],a=e[4],o=e[5],s=e[6],c=e[7],l=e[8],u=e[9],d=e[10],f=e[11],p=e[12],m=e[13],h=e[14],g=e[15],_=t*o-n*a,v=t*s-r*a,y=t*c-i*a,b=n*s-r*o,x=n*c-i*o,S=r*c-i*s,C=l*m-u*p,w=l*h-d*p,T=l*g-f*p,E=u*h-d*m,D=u*g-f*m,O=d*g-f*h,k=_*O-v*D+y*E+b*T-x*w+S*C;if(k===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);let A=1/k;return e[0]=(o*O-s*D+c*E)*A,e[1]=(r*D-n*O-i*E)*A,e[2]=(m*S-h*x+g*b)*A,e[3]=(d*x-u*S-f*b)*A,e[4]=(s*T-a*O-c*w)*A,e[5]=(t*O-r*T+i*w)*A,e[6]=(h*y-p*S-g*v)*A,e[7]=(l*S-d*y+f*v)*A,e[8]=(a*D-o*T+c*C)*A,e[9]=(n*T-t*D-i*C)*A,e[10]=(p*x-m*y+g*_)*A,e[11]=(u*y-l*x-f*_)*A,e[12]=(o*w-a*E-s*C)*A,e[13]=(t*E-n*w+r*C)*A,e[14]=(m*v-p*b-h*_)*A,e[15]=(l*b-u*v+d*_)*A,this}scale(e){let t=this.elements,n=e.x,r=e.y,i=e.z;return t[0]*=n,t[4]*=r,t[8]*=i,t[1]*=n,t[5]*=r,t[9]*=i,t[2]*=n,t[6]*=r,t[10]*=i,t[3]*=n,t[7]*=r,t[11]*=i,this}getMaxScaleOnAxis(){let e=this.elements,t=e[0]*e[0]+e[1]*e[1]+e[2]*e[2],n=e[4]*e[4]+e[5]*e[5]+e[6]*e[6],r=e[8]*e[8]+e[9]*e[9]+e[10]*e[10];return Math.sqrt(Math.max(t,n,r))}makeTranslation(e,t,n){return e.isVector3?this.set(1,0,0,e.x,0,1,0,e.y,0,0,1,e.z,0,0,0,1):this.set(1,0,0,e,0,1,0,t,0,0,1,n,0,0,0,1),this}makeRotationX(e){let t=Math.cos(e),n=Math.sin(e);return this.set(1,0,0,0,0,t,-n,0,0,n,t,0,0,0,0,1),this}makeRotationY(e){let t=Math.cos(e),n=Math.sin(e);return this.set(t,0,n,0,0,1,0,0,-n,0,t,0,0,0,0,1),this}makeRotationZ(e){let t=Math.cos(e),n=Math.sin(e);return this.set(t,-n,0,0,n,t,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(e,t){let n=Math.cos(t),r=Math.sin(t),i=1-n,a=e.x,o=e.y,s=e.z,c=i*a,l=i*o;return this.set(c*a+n,c*o-r*s,c*s+r*o,0,c*o+r*s,l*o+n,l*s-r*a,0,c*s-r*o,l*s+r*a,i*s*s+n,0,0,0,0,1),this}makeScale(e,t,n){return this.set(e,0,0,0,0,t,0,0,0,0,n,0,0,0,0,1),this}makeShear(e,t,n,r,i,a){return this.set(1,n,i,0,e,1,a,0,t,r,1,0,0,0,0,1),this}compose(e,t,n){let r=this.elements,i=t._x,a=t._y,o=t._z,s=t._w,c=i+i,l=a+a,u=o+o,d=i*c,f=i*l,p=i*u,m=a*l,h=a*u,g=o*u,_=s*c,v=s*l,y=s*u,b=n.x,x=n.y,S=n.z;return r[0]=(1-(m+g))*b,r[1]=(f+y)*b,r[2]=(p-v)*b,r[3]=0,r[4]=(f-y)*x,r[5]=(1-(d+g))*x,r[6]=(h+_)*x,r[7]=0,r[8]=(p+v)*S,r[9]=(h-_)*S,r[10]=(1-(d+m))*S,r[11]=0,r[12]=e.x,r[13]=e.y,r[14]=e.z,r[15]=1,this}decompose(e,t,n){let r=this.elements;e.x=r[12],e.y=r[13],e.z=r[14];let i=this.determinantAffine();if(i===0)return n.set(1,1,1),t.identity(),this;let a=en.set(r[0],r[1],r[2]).length(),o=en.set(r[4],r[5],r[6]).length(),s=en.set(r[8],r[9],r[10]).length();i<0&&(a=-a),tn.copy(this);let c=1/a,l=1/o,u=1/s;return tn.elements[0]*=c,tn.elements[1]*=c,tn.elements[2]*=c,tn.elements[4]*=l,tn.elements[5]*=l,tn.elements[6]*=l,tn.elements[8]*=u,tn.elements[9]*=u,tn.elements[10]*=u,t.setFromRotationMatrix(tn),n.x=a,n.y=o,n.z=s,this}makePerspective(e,t,n,r,i,a,o=We,s=!1){let c=this.elements,l=2*i/(t-e),u=2*i/(n-r),d=(t+e)/(t-e),f=(n+r)/(n-r),p,m;if(s)p=i/(a-i),m=a*i/(a-i);else if(o===2e3)p=-(a+i)/(a-i),m=-2*a*i/(a-i);else if(o===2001)p=-a/(a-i),m=-a*i/(a-i);else throw Error(`THREE.Matrix4.makePerspective(): Invalid coordinate system: `+o);return c[0]=l,c[4]=0,c[8]=d,c[12]=0,c[1]=0,c[5]=u,c[9]=f,c[13]=0,c[2]=0,c[6]=0,c[10]=p,c[14]=m,c[3]=0,c[7]=0,c[11]=-1,c[15]=0,this}makeOrthographic(e,t,n,r,i,a,o=We,s=!1){let c=this.elements,l=2/(t-e),u=2/(n-r),d=-(t+e)/(t-e),f=-(n+r)/(n-r),p,m;if(s)p=1/(a-i),m=a/(a-i);else if(o===2e3)p=-2/(a-i),m=-(a+i)/(a-i);else if(o===2001)p=-1/(a-i),m=-i/(a-i);else throw Error(`THREE.Matrix4.makeOrthographic(): Invalid coordinate system: `+o);return c[0]=l,c[4]=0,c[8]=0,c[12]=d,c[1]=0,c[5]=u,c[9]=0,c[13]=f,c[2]=0,c[6]=0,c[10]=p,c[14]=m,c[3]=0,c[7]=0,c[11]=0,c[15]=1,this}equals(e){let t=this.elements,n=e.elements;for(let e=0;e<16;e++)if(t[e]!==n[e])return!1;return!0}fromArray(e,t=0){for(let n=0;n<16;n++)this.elements[n]=e[n+t];return this}toArray(e=[],t=0){let n=this.elements;return e[t]=n[0],e[t+1]=n[1],e[t+2]=n[2],e[t+3]=n[3],e[t+4]=n[4],e[t+5]=n[5],e[t+6]=n[6],e[t+7]=n[7],e[t+8]=n[8],e[t+9]=n[9],e[t+10]=n[10],e[t+11]=n[11],e[t+12]=n[12],e[t+13]=n[13],e[t+14]=n[14],e[t+15]=n[15],e}},en=new J,tn=new Y,nn=new J(0,0,0),rn=new J(1,1,1),an=new J,on=new J,sn=new J,cn=new Y,ln=new At,un=class e{constructor(t=0,n=0,r=0,i=e.DEFAULT_ORDER){this.isEuler=!0,this._x=t,this._y=n,this._z=r,this._order=i}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get order(){return this._order}set order(e){this._order=e,this._onChangeCallback()}set(e,t,n,r=this._order){return this._x=e,this._y=t,this._z=n,this._order=r,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(e){return this._x=e._x,this._y=e._y,this._z=e._z,this._order=e._order,this._onChangeCallback(),this}setFromRotationMatrix(e,t=this._order,n=!0){let r=e.elements,i=r[0],a=r[4],o=r[8],s=r[1],c=r[5],l=r[9],u=r[2],d=r[6],f=r[10];switch(t){case`XYZ`:this._y=Math.asin(st(o,-1,1)),Math.abs(o)<.9999999?(this._x=Math.atan2(-l,f),this._z=Math.atan2(-a,i)):(this._x=Math.atan2(d,c),this._z=0);break;case`YXZ`:this._x=Math.asin(-st(l,-1,1)),Math.abs(l)<.9999999?(this._y=Math.atan2(o,f),this._z=Math.atan2(s,c)):(this._y=Math.atan2(-u,i),this._z=0);break;case`ZXY`:this._x=Math.asin(st(d,-1,1)),Math.abs(d)<.9999999?(this._y=Math.atan2(-u,f),this._z=Math.atan2(-a,c)):(this._y=0,this._z=Math.atan2(s,i));break;case`ZYX`:this._y=Math.asin(-st(u,-1,1)),Math.abs(u)<.9999999?(this._x=Math.atan2(d,f),this._z=Math.atan2(s,i)):(this._x=0,this._z=Math.atan2(-a,c));break;case`YZX`:this._z=Math.asin(st(s,-1,1)),Math.abs(s)<.9999999?(this._x=Math.atan2(-l,c),this._y=Math.atan2(-u,i)):(this._x=0,this._y=Math.atan2(o,f));break;case`XZY`:this._z=Math.asin(-st(a,-1,1)),Math.abs(a)<.9999999?(this._x=Math.atan2(d,c),this._y=Math.atan2(o,i)):(this._x=Math.atan2(-l,f),this._y=0);break;default:G(`Euler: .setFromRotationMatrix() encountered an unknown order: `+t)}return this._order=t,n===!0&&this._onChangeCallback(),this}setFromQuaternion(e,t,n){return cn.makeRotationFromQuaternion(e),this.setFromRotationMatrix(cn,t,n)}setFromVector3(e,t=this._order){return this.set(e.x,e.y,e.z,t)}reorder(e){return ln.setFromEuler(this),this.setFromQuaternion(ln,e)}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._order===this._order}fromArray(e){return this._x=e[0],this._y=e[1],this._z=e[2],e[3]!==void 0&&(this._order=e[3]),this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._order,e}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}};un.DEFAULT_ORDER=`XYZ`;var dn=class{constructor(){this.mask=1}set(e){this.mask=1<<e>>>0}enable(e){this.mask|=1<<e}enableAll(){this.mask=-1}toggle(e){this.mask^=1<<e}disable(e){this.mask&=~(1<<e)}disableAll(){this.mask=0}test(e){return(this.mask&e.mask)!==0}isEnabled(e){return!!(this.mask&1<<e)}},fn=0,pn=new J,mn=new At,hn=new Y,gn=new J,_n=new J,vn=new J,yn=new At,bn=new J(1,0,0),xn=new J(0,1,0),Sn=new J(0,0,1),Cn={type:`added`},wn={type:`removed`},Tn={type:`childadded`,child:null},En={type:`childremoved`,child:null},Dn=class e extends tt{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:fn++}),this.uuid=ot(),this.name=``,this.type=`Object3D`,this.parent=null,this.children=[],this.up=e.DEFAULT_UP.clone();let t=new J,n=new un,r=new At,i=new J(1,1,1);function a(){r.setFromEuler(n,!1)}function o(){n.setFromQuaternion(r,void 0,!1)}n._onChange(a),r._onChange(o),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:t},rotation:{configurable:!0,enumerable:!0,value:n},quaternion:{configurable:!0,enumerable:!0,value:r},scale:{configurable:!0,enumerable:!0,value:i},modelViewMatrix:{value:new Y},normalMatrix:{value:new Nt}}),this.matrix=new Y,this.matrixWorld=new Y,this.matrixAutoUpdate=e.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=e.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new dn,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.customDepthMaterial=void 0,this.customDistanceMaterial=void 0,this.static=!1,this.userData={},this.pivot=null}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(e){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(e),this.matrix.decompose(this.position,this.quaternion,this.scale),this.pivot!==null&&this.position.copy(this.pivot).applyMatrix4(this.matrix).sub(this.pivot)}applyQuaternion(e){return this.quaternion.premultiply(e),this}setRotationFromAxisAngle(e,t){this.quaternion.setFromAxisAngle(e,t)}setRotationFromEuler(e){this.quaternion.setFromEuler(e,!0)}setRotationFromMatrix(e){this.quaternion.setFromRotationMatrix(e)}setRotationFromQuaternion(e){this.quaternion.copy(e)}rotateOnAxis(e,t){return mn.setFromAxisAngle(e,t),this.quaternion.multiply(mn),this}rotateOnWorldAxis(e,t){return mn.setFromAxisAngle(e,t),this.quaternion.premultiply(mn),this}rotateX(e){return this.rotateOnAxis(bn,e)}rotateY(e){return this.rotateOnAxis(xn,e)}rotateZ(e){return this.rotateOnAxis(Sn,e)}translateOnAxis(e,t){return pn.copy(e).applyQuaternion(this.quaternion),this.position.add(pn.multiplyScalar(t)),this}translateX(e){return this.translateOnAxis(bn,e)}translateY(e){return this.translateOnAxis(xn,e)}translateZ(e){return this.translateOnAxis(Sn,e)}localToWorld(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(this.matrixWorld)}worldToLocal(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(hn.copy(this.matrixWorld).invert())}lookAt(e,t,n){e.isVector3?gn.copy(e):gn.set(e,t,n);let r=this.parent;this.updateWorldMatrix(!0,!1),_n.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?hn.lookAt(_n,gn,this.up):hn.lookAt(gn,_n,this.up),this.quaternion.setFromRotationMatrix(hn),r&&(hn.extractRotation(r.matrixWorld),mn.setFromRotationMatrix(hn),this.quaternion.premultiply(mn.invert()))}add(e){if(arguments.length>1){for(let e=0;e<arguments.length;e++)this.add(arguments[e]);return this}return e===this?(K(`Object3D.add: object can't be added as a child of itself.`,e),this):(e&&e.isObject3D?(e.removeFromParent(),e.parent=this,this.children.push(e),e.dispatchEvent(Cn),Tn.child=e,this.dispatchEvent(Tn),Tn.child=null):K(`Object3D.add: object not an instance of THREE.Object3D.`,e),this)}remove(e){if(arguments.length>1){for(let e=0;e<arguments.length;e++)this.remove(arguments[e]);return this}let t=this.children.indexOf(e);return t!==-1&&(e.parent=null,this.children.splice(t,1),e.dispatchEvent(wn),En.child=e,this.dispatchEvent(En),En.child=null),this}removeFromParent(){let e=this.parent;return e!==null&&e.remove(this),this}clear(){return this.remove(...this.children)}attach(e){return this.updateWorldMatrix(!0,!1),hn.copy(this.matrixWorld).invert(),e.parent!==null&&(e.parent.updateWorldMatrix(!0,!1),hn.multiply(e.parent.matrixWorld)),e.applyMatrix4(hn),e.removeFromParent(),e.parent=this,this.children.push(e),e.updateWorldMatrix(!1,!0),e.dispatchEvent(Cn),Tn.child=e,this.dispatchEvent(Tn),Tn.child=null,this}getObjectById(e){return this.getObjectByProperty(`id`,e)}getObjectByName(e){return this.getObjectByProperty(`name`,e)}getObjectByProperty(e,t){if(this[e]===t)return this;for(let n=0,r=this.children.length;n<r;n++){let r=this.children[n].getObjectByProperty(e,t);if(r!==void 0)return r}}getObjectsByProperty(e,t,n=[]){this[e]===t&&n.push(this);let r=this.children;for(let i=0,a=r.length;i<a;i++)r[i].getObjectsByProperty(e,t,n);return n}getWorldPosition(e){return this.updateWorldMatrix(!0,!1),e.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(_n,e,vn),e}getWorldScale(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(_n,yn,e),e}getWorldDirection(e){this.updateWorldMatrix(!0,!1);let t=this.matrixWorld.elements;return e.set(t[8],t[9],t[10]).normalize()}raycast(){}intersectsFrustum(){return!0}traverse(e){e(this);let t=this.children;for(let n=0,r=t.length;n<r;n++)t[n].traverse(e)}traverseVisible(e){if(this.visible===!1)return;e(this);let t=this.children;for(let n=0,r=t.length;n<r;n++)t[n].traverseVisible(e)}traverseAncestors(e){let t=this.parent;t!==null&&(e(t),t.traverseAncestors(e))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale);let e=this.pivot;if(e!==null){let t=e.x,n=e.y,r=e.z,i=this.matrix.elements;i[12]+=t-i[0]*t-i[4]*n-i[8]*r,i[13]+=n-i[1]*t-i[5]*n-i[9]*r,i[14]+=r-i[2]*t-i[6]*n-i[10]*r}this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(e){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||e)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,e=!0);let t=this.children;for(let n=0,r=t.length;n<r;n++)t[n].updateMatrixWorld(e)}updateWorldMatrix(e,t,n=!1){let r=this.parent;if(e===!0&&r!==null&&r.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||n)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,n=!0),t===!0){let e=this.children;for(let t=0,r=e.length;t<r;t++)e[t].updateWorldMatrix(!1,!0,n)}}toJSON(e){let t=e===void 0||typeof e==`string`,n={};t&&(e={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},n.metadata={version:4.7,type:`Object`,generator:`Object3D.toJSON`});let r={};r.uuid=this.uuid,r.type=this.type,r.name=this.name,r.castShadow=this.castShadow,r.receiveShadow=this.receiveShadow,r.visible=this.visible,r.frustumCulled=this.frustumCulled,r.renderOrder=this.renderOrder,r.static=this.static,r.matrixAutoUpdate=this.matrixAutoUpdate,Object.keys(this.userData).length>0&&(r.userData=this.userData),r.layers=this.layers.mask,r.matrix=this.matrix.toArray(),r.up=this.up.toArray(),this.pivot!==null&&(r.pivot=this.pivot.toArray()),this.morphTargetDictionary!==void 0&&(r.morphTargetDictionary=Object.assign({},this.morphTargetDictionary)),this.morphTargetInfluences!==void 0&&(r.morphTargetInfluences=this.morphTargetInfluences.slice()),this.isInstancedMesh&&(r.type=`InstancedMesh`,r.count=this.count,r.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(r.instanceColor=this.instanceColor.toJSON())),this.isBatchedMesh&&(r.type=`BatchedMesh`,r.perObjectFrustumCulled=this.perObjectFrustumCulled,r.sortObjects=this.sortObjects,r.drawRanges=this._drawRanges,r.reservedRanges=this._reservedRanges,r.geometryInfo=this._geometryInfo.map(e=>({...e,boundingBox:e.boundingBox?e.boundingBox.toJSON():void 0,boundingSphere:e.boundingSphere?e.boundingSphere.toJSON():void 0})),r.instanceInfo=this._instanceInfo.map(e=>({...e})),r.availableInstanceIds=this._availableInstanceIds.slice(),r.availableGeometryIds=this._availableGeometryIds.slice(),r.nextIndexStart=this._nextIndexStart,r.nextVertexStart=this._nextVertexStart,r.geometryCount=this._geometryCount,r.maxInstanceCount=this._maxInstanceCount,r.maxVertexCount=this._maxVertexCount,r.maxIndexCount=this._maxIndexCount,r.geometryInitialized=this._geometryInitialized,r.matricesTexture=this._matricesTexture.toJSON(e),r.indirectTexture=this._indirectTexture.toJSON(e),this._colorsTexture!==null&&(r.colorsTexture=this._colorsTexture.toJSON(e)),this.boundingSphere!==null&&(r.boundingSphere=this.boundingSphere.toJSON()),this.boundingBox!==null&&(r.boundingBox=this.boundingBox.toJSON()));function i(t,n){return t[n.uuid]===void 0&&(t[n.uuid]=n.toJSON(e)),n.uuid}if(this.isScene)this.background&&(this.background.isColor?r.background=this.background.toJSON():this.background.isTexture&&(r.background=this.background.toJSON(e).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(r.environment=this.environment.toJSON(e).uuid);else if(this.isMesh||this.isLine||this.isPoints){r.geometry=i(e.geometries,this.geometry);let t=this.geometry.parameters;if(t!==void 0&&t.shapes!==void 0){let n=t.shapes;if(Array.isArray(n))for(let t=0,r=n.length;t<r;t++){let r=n[t];i(e.shapes,r)}else i(e.shapes,n)}}if(this.isSkinnedMesh&&(r.bindMode=this.bindMode,r.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(i(e.skeletons,this.skeleton),r.skeleton=this.skeleton.uuid)),this.material!==void 0){if(Array.isArray(this.material)){let t=[];for(let n=0,r=this.material.length;n<r;n++)t.push(i(e.materials,this.material[n]));r.material=t}else r.material=i(e.materials,this.material)}if(this.children.length>0){r.children=[];for(let t=0;t<this.children.length;t++)r.children.push(this.children[t].toJSON(e).object)}if(this.animations.length>0){r.animations=[];for(let t=0;t<this.animations.length;t++){let n=this.animations[t];r.animations.push(i(e.animations,n))}}if(t){let t=a(e.geometries),r=a(e.materials),i=a(e.textures),o=a(e.images),s=a(e.shapes),c=a(e.skeletons),l=a(e.animations),u=a(e.nodes);t.length>0&&(n.geometries=t),r.length>0&&(n.materials=r),i.length>0&&(n.textures=i),o.length>0&&(n.images=o),s.length>0&&(n.shapes=s),c.length>0&&(n.skeletons=c),l.length>0&&(n.animations=l),u.length>0&&(n.nodes=u)}return n.object=r,n;function a(e){let t=[];for(let n in e){let r=e[n];delete r.metadata,t.push(r)}return t}}clone(e){return new this.constructor().copy(this,e)}copy(e,t=!0){if(this.name=e.name,this.up.copy(e.up),this.position.copy(e.position),this.rotation.order=e.rotation.order,this.quaternion.copy(e.quaternion),this.scale.copy(e.scale),this.pivot=e.pivot===null?null:e.pivot.clone(),this.matrix.copy(e.matrix),this.matrixWorld.copy(e.matrixWorld),this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrixWorldAutoUpdate=e.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=e.matrixWorldNeedsUpdate,this.layers.mask=e.layers.mask,this.visible=e.visible,this.castShadow=e.castShadow,this.receiveShadow=e.receiveShadow,this.frustumCulled=e.frustumCulled,this.renderOrder=e.renderOrder,this.static=e.static,this.animations=e.animations.slice(),this.userData=JSON.parse(JSON.stringify(e.userData)),t===!0)for(let t=0;t<e.children.length;t++){let n=e.children[t];this.add(n.clone())}return this}dispose(){this.dispatchEvent({type:`dispose`})}};Dn.DEFAULT_UP=new J(0,1,0),Dn.DEFAULT_MATRIX_AUTO_UPDATE=!0,Dn.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;var On=class extends Dn{constructor(){super(),this.isGroup=!0,this.type=`Group`}},kn={type:`move`},An=class{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){return this._hand===null&&(this._hand=new On,this._hand.matrixAutoUpdate=!1,this._hand.visible=!1,this._hand.joints={},this._hand.inputState={pinching:!1}),this._hand}getTargetRaySpace(){return this._targetRay===null&&(this._targetRay=new On,this._targetRay.matrixAutoUpdate=!1,this._targetRay.visible=!1,this._targetRay.hasLinearVelocity=!1,this._targetRay.linearVelocity=new J,this._targetRay.hasAngularVelocity=!1,this._targetRay.angularVelocity=new J),this._targetRay}getGripSpace(){return this._grip===null&&(this._grip=new On,this._grip.matrixAutoUpdate=!1,this._grip.visible=!1,this._grip.hasLinearVelocity=!1,this._grip.linearVelocity=new J,this._grip.hasAngularVelocity=!1,this._grip.angularVelocity=new J,this._grip.eventsEnabled=!1),this._grip}dispatchEvent(e){return this._targetRay!==null&&this._targetRay.dispatchEvent(e),this._grip!==null&&this._grip.dispatchEvent(e),this._hand!==null&&this._hand.dispatchEvent(e),this}connect(e){if(e&&e.hand){let t=this._hand;if(t)for(let n of e.hand.values())this._getHandJoint(t,n)}return this.dispatchEvent({type:`connected`,data:e}),this}disconnect(e){return this.dispatchEvent({type:`disconnected`,data:e}),this._targetRay!==null&&(this._targetRay.visible=!1),this._grip!==null&&(this._grip.visible=!1),this._hand!==null&&(this._hand.visible=!1),this}update(e,t,n){let r=null,i=null,a=null,o=this._targetRay,s=this._grip,c=this._hand;if(e&&t.session.visibilityState!==`visible-blurred`){if(c&&e.hand){a=!0;for(let r of e.hand.values()){let e=t.getJointPose(r,n),i=this._getHandJoint(c,r);e!==null&&(i.matrix.fromArray(e.transform.matrix),i.matrix.decompose(i.position,i.quaternion,i.scale),i.matrixWorldNeedsUpdate=!0,i.jointRadius=e.radius),i.visible=e!==null}let r=c.joints[`index-finger-tip`],i=c.joints[`thumb-tip`],o=r.position.distanceTo(i.position);c.inputState.pinching&&o>.025?(c.inputState.pinching=!1,this.dispatchEvent({type:`pinchend`,handedness:e.handedness,target:this})):!c.inputState.pinching&&o<=.015&&(c.inputState.pinching=!0,this.dispatchEvent({type:`pinchstart`,handedness:e.handedness,target:this}))}else s!==null&&e.gripSpace&&(i=t.getPose(e.gripSpace,n),i!==null&&(s.matrix.fromArray(i.transform.matrix),s.matrix.decompose(s.position,s.quaternion,s.scale),s.matrixWorldNeedsUpdate=!0,i.linearVelocity?(s.hasLinearVelocity=!0,s.linearVelocity.copy(i.linearVelocity)):s.hasLinearVelocity=!1,i.angularVelocity?(s.hasAngularVelocity=!0,s.angularVelocity.copy(i.angularVelocity)):s.hasAngularVelocity=!1,s.eventsEnabled&&s.dispatchEvent({type:`gripUpdated`,data:e,target:this})));o!==null&&(r=t.getPose(e.targetRaySpace,n),r===null&&i!==null&&(r=i),r!==null&&(o.matrix.fromArray(r.transform.matrix),o.matrix.decompose(o.position,o.quaternion,o.scale),o.matrixWorldNeedsUpdate=!0,r.linearVelocity?(o.hasLinearVelocity=!0,o.linearVelocity.copy(r.linearVelocity)):o.hasLinearVelocity=!1,r.angularVelocity?(o.hasAngularVelocity=!0,o.angularVelocity.copy(r.angularVelocity)):o.hasAngularVelocity=!1,this.dispatchEvent(kn)))}return o!==null&&(o.visible=r!==null),s!==null&&(s.visible=i!==null),c!==null&&(c.visible=a!==null),this}_getHandJoint(e,t){if(e.joints[t.jointName]===void 0){let n=new On;n.matrixAutoUpdate=!1,n.visible=!1,e.joints[t.jointName]=n,e.add(n)}return e.joints[t.jointName]}},jn={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},Mn={h:0,s:0,l:0},Nn={h:0,s:0,l:0};function Pn(e,t,n){return n<0&&(n+=1),n>1&&--n,n<1/6?e+(t-e)*6*n:n<1/2?t:n<2/3?e+(t-e)*6*(2/3-n):e}var X=class{constructor(e,t,n){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(e,t,n)}set(e,t,n){if(t===void 0&&n===void 0){let t=e;t&&t.isColor?this.copy(t):typeof t==`number`?this.setHex(t):typeof t==`string`&&this.setStyle(t)}else this.setRGB(e,t,n);return this}setScalar(e){return this.r=e,this.g=e,this.b=e,this}setHex(e,t=Le){return e=Math.floor(e),this.r=(e>>16&255)/255,this.g=(e>>8&255)/255,this.b=(e&255)/255,Rt.colorSpaceToWorking(this,t),this}setRGB(e,t,n,r=Rt.workingColorSpace){return this.r=e,this.g=t,this.b=n,Rt.colorSpaceToWorking(this,r),this}setHSL(e,t,n,r=Rt.workingColorSpace){if(e=ct(e,1),t=st(t,0,1),n=st(n,0,1),t===0)this.r=this.g=this.b=n;else{let r=n<=.5?n*(1+t):n+t-n*t,i=2*n-r;this.r=Pn(i,r,e+1/3),this.g=Pn(i,r,e),this.b=Pn(i,r,e-1/3)}return Rt.colorSpaceToWorking(this,r),this}setStyle(e,t=Le){function n(t){t!==void 0&&parseFloat(t)<1&&G(`Color: Alpha component of `+e+` will be ignored.`)}let r;if(r=/^(\w+)\(([^\)]*)\)/.exec(e)){let i,a=r[1],o=r[2];switch(a){case`rgb`:case`rgba`:if(i=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d+(?:\.\d+)?|\.\d+)\s*)?$/.exec(o))return n(i[4]),this.setRGB(Math.min(255,parseInt(i[1],10))/255,Math.min(255,parseInt(i[2],10))/255,Math.min(255,parseInt(i[3],10))/255,t);if(i=/^\s*(\d+(?:\.\d+)?|\.\d+)\%\s*,\s*(\d+(?:\.\d+)?|\.\d+)\%\s*,\s*(\d+(?:\.\d+)?|\.\d+)\%\s*(?:,\s*(\d+(?:\.\d+)?|\.\d+)\s*)?$/.exec(o))return n(i[4]),this.setRGB(Math.min(100,parseFloat(i[1]))/100,Math.min(100,parseFloat(i[2]))/100,Math.min(100,parseFloat(i[3]))/100,t);break;case`hsl`:case`hsla`:if(i=/^\s*([+-]?(?:\d+(?:\.\d+)?|\.\d+))\s*,\s*(\d+(?:\.\d+)?|\.\d+)\%\s*,\s*(\d+(?:\.\d+)?|\.\d+)\%\s*(?:,\s*(\d+(?:\.\d+)?|\.\d+)\s*)?$/.exec(o))return n(i[4]),this.setHSL(parseFloat(i[1])/360,parseFloat(i[2])/100,parseFloat(i[3])/100,t);break;default:G(`Color: Unknown color model `+e)}}else if(r=/^\#([A-Fa-f\d]+)$/.exec(e)){let n=r[1],i=n.length;if(i===3)return this.setRGB(parseInt(n.charAt(0),16)/15,parseInt(n.charAt(1),16)/15,parseInt(n.charAt(2),16)/15,t);if(i===6)return this.setHex(parseInt(n,16),t);G(`Color: Invalid hex color `+e)}else if(e&&e.length>0)return this.setColorName(e,t);return this}setColorName(e,t=Le){let n=jn[e.toLowerCase()];return n===void 0?G(`Color: Unknown color `+e):this.setHex(n,t),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(e){return this.r=e.r,this.g=e.g,this.b=e.b,this}copySRGBToLinear(e){return this.r=zt(e.r),this.g=zt(e.g),this.b=zt(e.b),this}copyLinearToSRGB(e){return this.r=Bt(e.r),this.g=Bt(e.g),this.b=Bt(e.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(e=Le){return Rt.workingToColorSpace(Fn.copy(this),e),Math.round(st(Fn.r*255,0,255))*65536+Math.round(st(Fn.g*255,0,255))*256+Math.round(st(Fn.b*255,0,255))}getHexString(e=Le){return(`000000`+this.getHex(e).toString(16)).slice(-6)}getHSL(e,t=Rt.workingColorSpace){Rt.workingToColorSpace(Fn.copy(this),t);let n=Fn.r,r=Fn.g,i=Fn.b,a=Math.max(n,r,i),o=Math.min(n,r,i),s,c,l=(o+a)/2;if(o===a)s=0,c=0;else{let e=a-o;switch(c=l<=.5?e/(a+o):e/(2-a-o),a){case n:s=(r-i)/e+(r<i?6:0);break;case r:s=(i-n)/e+2;break;case i:s=(n-r)/e+4}s/=6}return e.h=s,e.s=c,e.l=l,e}getRGB(e,t=Rt.workingColorSpace){return Rt.workingToColorSpace(Fn.copy(this),t),e.r=Fn.r,e.g=Fn.g,e.b=Fn.b,e}getStyle(e=Le){Rt.workingToColorSpace(Fn.copy(this),e);let t=Fn.r,n=Fn.g,r=Fn.b;return e===`srgb`?`rgb(${Math.round(t*255)},${Math.round(n*255)},${Math.round(r*255)})`:`color(${e} ${t.toFixed(3)} ${n.toFixed(3)} ${r.toFixed(3)})`}offsetHSL(e,t,n){return this.getHSL(Mn),this.setHSL(Mn.h+e,Mn.s+t,Mn.l+n)}add(e){return this.r+=e.r,this.g+=e.g,this.b+=e.b,this}addColors(e,t){return this.r=e.r+t.r,this.g=e.g+t.g,this.b=e.b+t.b,this}addScalar(e){return this.r+=e,this.g+=e,this.b+=e,this}sub(e){return this.r=Math.max(0,this.r-e.r),this.g=Math.max(0,this.g-e.g),this.b=Math.max(0,this.b-e.b),this}multiply(e){return this.r*=e.r,this.g*=e.g,this.b*=e.b,this}multiplyScalar(e){return this.r*=e,this.g*=e,this.b*=e,this}lerp(e,t){return this.r+=(e.r-this.r)*t,this.g+=(e.g-this.g)*t,this.b+=(e.b-this.b)*t,this}lerpColors(e,t,n){return this.r=e.r+(t.r-e.r)*n,this.g=e.g+(t.g-e.g)*n,this.b=e.b+(t.b-e.b)*n,this}lerpHSL(e,t){this.getHSL(Mn),e.getHSL(Nn);let n=dt(Mn.h,Nn.h,t),r=dt(Mn.s,Nn.s,t),i=dt(Mn.l,Nn.l,t);return this.setHSL(n,r,i),this}setFromVector3(e){return this.r=e.x,this.g=e.y,this.b=e.z,this}applyMatrix3(e){let t=this.r,n=this.g,r=this.b,i=e.elements;return this.r=i[0]*t+i[3]*n+i[6]*r,this.g=i[1]*t+i[4]*n+i[7]*r,this.b=i[2]*t+i[5]*n+i[8]*r,this}equals(e){return e.r===this.r&&e.g===this.g&&e.b===this.b}fromArray(e,t=0){return this.r=e[t],this.g=e[t+1],this.b=e[t+2],this}toArray(e=[],t=0){return e[t]=this.r,e[t+1]=this.g,e[t+2]=this.b,e}fromBufferAttribute(e,t){return this.r=e.getX(t),this.g=e.getY(t),this.b=e.getZ(t),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}},Fn=new X;X.NAMES=jn;var In=class extends Dn{constructor(){super(),this.isScene=!0,this.type=`Scene`,this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.backgroundRotation=new un,this.environmentIntensity=1,this.environmentRotation=new un,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__<`u`&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent(`observe`,{detail:this}))}copy(e,t){return super.copy(e,t),this.background=e.background===null?null:e.background.clone(),this.environment=e.environment===null?null:e.environment.clone(),this.fog=e.fog===null?null:e.fog.clone(),this.backgroundBlurriness=e.backgroundBlurriness,this.backgroundIntensity=e.backgroundIntensity,this.backgroundRotation.copy(e.backgroundRotation),this.environmentIntensity=e.environmentIntensity,this.environmentRotation.copy(e.environmentRotation),this.overrideMaterial=e.overrideMaterial===null?null:e.overrideMaterial.clone(),this.matrixAutoUpdate=e.matrixAutoUpdate,this}toJSON(e){let t=super.toJSON(e);return this.fog!==null&&(t.object.fog=this.fog.toJSON()),t.object.backgroundBlurriness=this.backgroundBlurriness,t.object.backgroundIntensity=this.backgroundIntensity,t.object.backgroundRotation=this.backgroundRotation.toArray(),t.object.environmentIntensity=this.environmentIntensity,t.object.environmentRotation=this.environmentRotation.toArray(),t}},Ln=new J,Rn=new J,zn=new J,Bn=new J,Vn=new J,Hn=new J,Un=new J,Wn=new J,Gn=new J,Kn=new J,qn=new Yt,Jn=new Yt,Yn=new Yt,Xn=class e{constructor(e=new J,t=new J,n=new J){this.a=e,this.b=t,this.c=n}static getNormal(e,t,n,r){r.subVectors(n,t),Ln.subVectors(e,t),r.cross(Ln);let i=r.lengthSq();return i>0?r.multiplyScalar(1/Math.sqrt(i)):r.set(0,0,0)}static getBarycoord(e,t,n,r,i){Ln.subVectors(r,t),Rn.subVectors(n,t),zn.subVectors(e,t);let a=Ln.dot(Ln),o=Ln.dot(Rn),s=Ln.dot(zn),c=Rn.dot(Rn),l=Rn.dot(zn),u=a*c-o*o;if(u===0)return i.set(0,0,0),null;let d=1/u,f=(c*s-o*l)*d,p=(a*l-o*s)*d;return i.set(1-f-p,p,f)}static containsPoint(e,t,n,r){return this.getBarycoord(e,t,n,r,Bn)!==null&&Bn.x>=0&&Bn.y>=0&&Bn.x+Bn.y<=1}static getInterpolation(e,t,n,r,i,a,o,s){return this.getBarycoord(e,t,n,r,Bn)===null?(s.x=0,s.y=0,`z`in s&&(s.z=0),`w`in s&&(s.w=0),null):(s.setScalar(0),s.addScaledVector(i,Bn.x),s.addScaledVector(a,Bn.y),s.addScaledVector(o,Bn.z),s)}static getInterpolatedAttribute(e,t,n,r,i,a){return qn.setScalar(0),Jn.setScalar(0),Yn.setScalar(0),qn.fromBufferAttribute(e,t),Jn.fromBufferAttribute(e,n),Yn.fromBufferAttribute(e,r),a.setScalar(0),a.addScaledVector(qn,i.x),a.addScaledVector(Jn,i.y),a.addScaledVector(Yn,i.z),a}static isFrontFacing(e,t,n,r){return Ln.subVectors(n,t),Rn.subVectors(e,t),Ln.cross(Rn).dot(r)<0}set(e,t,n){return this.a.copy(e),this.b.copy(t),this.c.copy(n),this}setFromPointsAndIndices(e,t,n,r){return this.a.copy(e[t]),this.b.copy(e[n]),this.c.copy(e[r]),this}setFromAttributeAndIndices(e,t,n,r){return this.a.fromBufferAttribute(e,t),this.b.fromBufferAttribute(e,n),this.c.fromBufferAttribute(e,r),this}clone(){return new this.constructor().copy(this)}copy(e){return this.a.copy(e.a),this.b.copy(e.b),this.c.copy(e.c),this}getArea(){return Ln.subVectors(this.c,this.b),Rn.subVectors(this.a,this.b),Ln.cross(Rn).length()*.5}getMidpoint(e){return e.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(t){return e.getNormal(this.a,this.b,this.c,t)}getPlane(e){return e.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(t,n){return e.getBarycoord(t,this.a,this.b,this.c,n)}getInterpolation(t,n,r,i,a){return e.getInterpolation(t,this.a,this.b,this.c,n,r,i,a)}containsPoint(t){return e.containsPoint(t,this.a,this.b,this.c)}isFrontFacing(t){return e.isFrontFacing(this.a,this.b,this.c,t)}intersectsBox(e){return e.intersectsTriangle(this)}closestPointToPoint(e,t){let n=this.a,r=this.b,i=this.c,a,o;Vn.subVectors(r,n),Hn.subVectors(i,n),Wn.subVectors(e,n);let s=Vn.dot(Wn),c=Hn.dot(Wn);if(s<=0&&c<=0)return t.copy(n);Gn.subVectors(e,r);let l=Vn.dot(Gn),u=Hn.dot(Gn);if(l>=0&&u<=l)return t.copy(r);let d=s*u-l*c;if(d<=0&&s>=0&&l<=0&&s-l>0)return a=s/(s-l),t.copy(n).addScaledVector(Vn,a);Kn.subVectors(e,i);let f=Vn.dot(Kn),p=Hn.dot(Kn);if(p>=0&&f<=p)return t.copy(i);let m=f*c-s*p;if(m<=0&&c>=0&&p<=0)return o=c/(c-p),t.copy(n).addScaledVector(Hn,o);let h=l*p-f*u;if(h<=0&&u-l>=0&&f-p>=0)return Un.subVectors(i,r),o=(u-l)/(u-l+(f-p)),t.copy(r).addScaledVector(Un,o);let g=1/(h+m+d);return a=m*g,o=d*g,t.copy(n).addScaledVector(Vn,a).addScaledVector(Hn,o)}equals(e){return e.a.equals(this.a)&&e.b.equals(this.b)&&e.c.equals(this.c)}},Zn=class{constructor(e=new J(1/0,1/0,1/0),t=new J(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=e,this.max=t}set(e,t){return this.min.copy(e),this.max.copy(t),this}setFromArray(e){this.makeEmpty();for(let t=0,n=e.length;t<n;t+=3)this.expandByPoint($n.fromArray(e,t));return this}setFromBufferAttribute(e){this.makeEmpty();for(let t=0,n=e.count;t<n;t++)this.expandByPoint($n.fromBufferAttribute(e,t));return this}setFromPoints(e){this.makeEmpty();for(let t=0,n=e.length;t<n;t++)this.expandByPoint(e[t]);return this}setFromCenterAndSize(e,t){let n=$n.copy(t).multiplyScalar(.5);return this.min.copy(e).sub(n),this.max.copy(e).add(n),this}setFromObject(e,t=!1){return this.makeEmpty(),this.expandByObject(e,t)}clone(){return new this.constructor().copy(this)}copy(e){return this.min.copy(e.min),this.max.copy(e.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(e){return this.isEmpty()?e.set(0,0,0):e.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(e){return this.isEmpty()?e.set(0,0,0):e.subVectors(this.max,this.min)}expandByPoint(e){return this.min.min(e),this.max.max(e),this}expandByVector(e){return this.min.sub(e),this.max.add(e),this}expandByScalar(e){return this.min.addScalar(-e),this.max.addScalar(e),this}expandByObject(e,t=!1){e.updateWorldMatrix(!1,!1);let n=e.geometry;if(n!==void 0){let r=n.getAttribute(`position`);if(t===!0&&r!==void 0&&e.isInstancedMesh!==!0&&e.isBatchedMesh!==!0)for(let t=0,n=r.count;t<n;t++)e.isMesh===!0?e.getVertexPosition(t,$n):$n.fromBufferAttribute(r,t),$n.applyMatrix4(e.matrixWorld),this.expandByPoint($n);else e.boundingBox===void 0?(n.boundingBox===null&&n.computeBoundingBox(),er.copy(n.boundingBox)):(e.boundingBox===null&&e.computeBoundingBox(),er.copy(e.boundingBox)),er.applyMatrix4(e.matrixWorld),this.union(er)}let r=e.children;for(let e=0,n=r.length;e<n;e++)this.expandByObject(r[e],t);return this}containsPoint(e){return e.x>=this.min.x&&e.x<=this.max.x&&e.y>=this.min.y&&e.y<=this.max.y&&e.z>=this.min.z&&e.z<=this.max.z}containsBox(e){return this.min.x<=e.min.x&&e.max.x<=this.max.x&&this.min.y<=e.min.y&&e.max.y<=this.max.y&&this.min.z<=e.min.z&&e.max.z<=this.max.z}getParameter(e,t){return t.set((e.x-this.min.x)/(this.max.x-this.min.x),(e.y-this.min.y)/(this.max.y-this.min.y),(e.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(e){return e.max.x>=this.min.x&&e.min.x<=this.max.x&&e.max.y>=this.min.y&&e.min.y<=this.max.y&&e.max.z>=this.min.z&&e.min.z<=this.max.z}intersectsSphere(e){return this.clampPoint(e.center,$n),$n.distanceToSquared(e.center)<=e.radius*e.radius}intersectsPlane(e){let t,n;return e.normal.x>0?(t=e.normal.x*this.min.x,n=e.normal.x*this.max.x):(t=e.normal.x*this.max.x,n=e.normal.x*this.min.x),e.normal.y>0?(t+=e.normal.y*this.min.y,n+=e.normal.y*this.max.y):(t+=e.normal.y*this.max.y,n+=e.normal.y*this.min.y),e.normal.z>0?(t+=e.normal.z*this.min.z,n+=e.normal.z*this.max.z):(t+=e.normal.z*this.max.z,n+=e.normal.z*this.min.z),t<=-e.constant&&n>=-e.constant}intersectsTriangle(e){if(this.isEmpty())return!1;this.getCenter(sr),cr.subVectors(this.max,sr),tr.subVectors(e.a,sr),nr.subVectors(e.b,sr),rr.subVectors(e.c,sr),ir.subVectors(nr,tr),ar.subVectors(rr,nr),or.subVectors(tr,rr);let t=[0,-ir.z,ir.y,0,-ar.z,ar.y,0,-or.z,or.y,ir.z,0,-ir.x,ar.z,0,-ar.x,or.z,0,-or.x,-ir.y,ir.x,0,-ar.y,ar.x,0,-or.y,or.x,0];return!dr(t,tr,nr,rr,cr)||(t=[1,0,0,0,1,0,0,0,1],!dr(t,tr,nr,rr,cr))?!1:(lr.crossVectors(ir,ar),t=[lr.x,lr.y,lr.z],dr(t,tr,nr,rr,cr))}clampPoint(e,t){return t.copy(e).clamp(this.min,this.max)}distanceToPoint(e){return this.clampPoint(e,$n).distanceTo(e)}getBoundingSphere(e){return this.isEmpty()?e.makeEmpty():(this.getCenter(e.center),e.radius=this.getSize($n).length()*.5),e}intersect(e){return this.min.max(e.min),this.max.min(e.max),this.isEmpty()&&this.makeEmpty(),this}union(e){return this.min.min(e.min),this.max.max(e.max),this}applyMatrix4(e){return this.isEmpty()||(Qn[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(e),Qn[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(e),Qn[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(e),Qn[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(e),Qn[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(e),Qn[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(e),Qn[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(e),Qn[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(e),this.setFromPoints(Qn)),this}translate(e){return this.min.add(e),this.max.add(e),this}equals(e){return e.min.equals(this.min)&&e.max.equals(this.max)}toJSON(){return{min:this.min.toArray(),max:this.max.toArray()}}fromJSON(e){return this.min.fromArray(e.min),this.max.fromArray(e.max),this}},Qn=[new J,new J,new J,new J,new J,new J,new J,new J],$n=new J,er=new Zn,tr=new J,nr=new J,rr=new J,ir=new J,ar=new J,or=new J,sr=new J,cr=new J,lr=new J,ur=new J;function dr(e,t,n,r,i){for(let a=0,o=e.length-3;a<=o;a+=3){ur.fromArray(e,a);let o=i.x*Math.abs(ur.x)+i.y*Math.abs(ur.y)+i.z*Math.abs(ur.z),s=t.dot(ur),c=n.dot(ur),l=r.dot(ur);if(Math.max(-Math.max(s,c,l),Math.min(s,c,l))>o)return!1}return!0}var fr=new J,pr=new q,mr=0,hr=class extends tt{constructor(e,t,n=!1){if(super(),Array.isArray(e))throw TypeError(`THREE.BufferAttribute: array should be a Typed Array.`);this.isBufferAttribute=!0,Object.defineProperty(this,"id",{value:mr++}),this.name=``,this.array=e,this.itemSize=t,this.count=e===void 0?0:e.length/t,this.normalized=n,this.usage=He,this.updateRanges=[],this.gpuType=g,this.version=0,this._normalizationScale=e===void 0?void 0:Et(e)}onUploadCallback(){}set needsUpdate(e){e===!0&&this.version++}setUsage(e){return this.usage=e,this}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}copy(e){return this.name=e.name,this.array=new e.array.constructor(e.array),this.itemSize=e.itemSize,this.count=e.count,this.normalized=e.normalized,this.usage=e.usage,this.gpuType=e.gpuType,this._normalizationScale=e._normalizationScale,this}copyAt(e,t,n){e*=this.itemSize,n*=t.itemSize;for(let r=0,i=this.itemSize;r<i;r++)this.array[e+r]=t.array[n+r];return this}copyArray(e){return this.array.set(e),this}applyMatrix3(e){if(this.itemSize===2)for(let t=0,n=this.count;t<n;t++)pr.fromBufferAttribute(this,t),pr.applyMatrix3(e),this.setXY(t,pr.x,pr.y);else if(this.itemSize===3)for(let t=0,n=this.count;t<n;t++)fr.fromBufferAttribute(this,t),fr.applyMatrix3(e),this.setXYZ(t,fr.x,fr.y,fr.z);return this}applyMatrix4(e){for(let t=0,n=this.count;t<n;t++)fr.fromBufferAttribute(this,t),fr.applyMatrix4(e),this.setXYZ(t,fr.x,fr.y,fr.z);return this}applyNormalMatrix(e){for(let t=0,n=this.count;t<n;t++)fr.fromBufferAttribute(this,t),fr.applyNormalMatrix(e),this.setXYZ(t,fr.x,fr.y,fr.z);return this}transformDirection(e){for(let t=0,n=this.count;t<n;t++)fr.fromBufferAttribute(this,t),fr.transformDirection(e),this.setXYZ(t,fr.x,fr.y,fr.z);return this}set(e,t=0){return this.array.set(e,t),this}getComponent(e,t){let n=this.array[e*this.itemSize+t];return this.normalized&&(n=this._denormalize(n)),n}setComponent(e,t,n){return this.normalized&&(n=this._normalize(n)),this.array[e*this.itemSize+t]=n,this}getX(e){let t=this.array[e*this.itemSize];return this.normalized&&(t=this._denormalize(t)),t}setX(e,t){return this.normalized&&(t=this._normalize(t)),this.array[e*this.itemSize]=t,this}getY(e){let t=this.array[e*this.itemSize+1];return this.normalized&&(t=this._denormalize(t)),t}setY(e,t){return this.normalized&&(t=this._normalize(t)),this.array[e*this.itemSize+1]=t,this}getZ(e){let t=this.array[e*this.itemSize+2];return this.normalized&&(t=this._denormalize(t)),t}setZ(e,t){return this.normalized&&(t=this._normalize(t)),this.array[e*this.itemSize+2]=t,this}getW(e){let t=this.array[e*this.itemSize+3];return this.normalized&&(t=this._denormalize(t)),t}setW(e,t){return this.normalized&&(t=this._normalize(t)),this.array[e*this.itemSize+3]=t,this}setXY(e,t,n){return e*=this.itemSize,this.normalized&&(t=this._normalize(t),n=this._normalize(n)),this.array[e+0]=t,this.array[e+1]=n,this}setXYZ(e,t,n,r){return e*=this.itemSize,this.normalized&&(t=this._normalize(t),n=this._normalize(n),r=this._normalize(r)),this.array[e+0]=t,this.array[e+1]=n,this.array[e+2]=r,this}setXYZW(e,t,n,r,i){return e*=this.itemSize,this.normalized&&(t=this._normalize(t),n=this._normalize(n),r=this._normalize(r),i=this._normalize(i)),this.array[e+0]=t,this.array[e+1]=n,this.array[e+2]=r,this.array[e+3]=i,this}onUpload(e){return this.onUploadCallback=e,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){let e={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return e.name=this.name,e.usage=this.usage,e.gpuType=this.gpuType,e}dispose(){this.dispatchEvent({type:`dispose`})}_denormalize(e){let t=this._normalizationScale;return t===void 0?Dt(e,this.array):Math.max(e/t,-1)}_normalize(e){let t=this._normalizationScale;return t===void 0?Ot(e,this.array):Math.round(e*t)}},gr=class extends hr{constructor(e,t,n){super(new Uint16Array(e),t,n)}},_r=class extends hr{constructor(e,t,n){super(new Uint32Array(e),t,n)}},Z=class extends hr{constructor(e,t,n){super(new Float32Array(e),t,n)}},vr=new Zn,yr=new J,br=new J,xr=class{constructor(e=new J,t=-1){this.isSphere=!0,this.center=e,this.radius=t}set(e,t){return this.center.copy(e),this.radius=t,this}setFromPoints(e,t){let n=this.center;t===void 0?vr.setFromPoints(e).getCenter(n):n.copy(t);let r=0;for(let t=0,i=e.length;t<i;t++)r=Math.max(r,n.distanceToSquared(e[t]));return this.radius=Math.sqrt(r),this}copy(e){return this.center.copy(e.center),this.radius=e.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(e){return e.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(e){return e.distanceTo(this.center)-this.radius}intersectsSphere(e){let t=this.radius+e.radius;return e.center.distanceToSquared(this.center)<=t*t}intersectsBox(e){return e.intersectsSphere(this)}intersectsPlane(e){return Math.abs(e.distanceToPoint(this.center))<=this.radius}clampPoint(e,t){let n=this.center.distanceToSquared(e);return t.copy(e),n>this.radius*this.radius&&(t.sub(this.center).normalize(),t.multiplyScalar(this.radius).add(this.center)),t}getBoundingBox(e){return this.isEmpty()?(e.makeEmpty(),e):(e.set(this.center,this.center),e.expandByScalar(this.radius),e)}applyMatrix4(e){return this.center.applyMatrix4(e),this.radius*=e.getMaxScaleOnAxis(),this}translate(e){return this.center.add(e),this}expandByPoint(e){if(this.isEmpty())return this.center.copy(e),this.radius=0,this;yr.subVectors(e,this.center);let t=yr.lengthSq();if(t>this.radius*this.radius){let e=Math.sqrt(t),n=(e-this.radius)*.5;this.center.addScaledVector(yr,n/e),this.radius+=n}return this}union(e){return e.isEmpty()?this:this.isEmpty()?(this.copy(e),this):(this.center.equals(e.center)===!0?this.radius=Math.max(this.radius,e.radius):(br.subVectors(e.center,this.center).setLength(e.radius),this.expandByPoint(yr.copy(e.center).add(br)),this.expandByPoint(yr.copy(e.center).sub(br))),this)}equals(e){return e.center.equals(this.center)&&e.radius===this.radius}clone(){return new this.constructor().copy(this)}toJSON(){return{radius:this.radius,center:this.center.toArray()}}fromJSON(e){return this.radius=e.radius,this.center.fromArray(e.center),this}},Sr=0,Cr=new Y,wr=new Dn,Tr=new J,Er=new Zn,Dr=new Zn,Or=new J,kr=class e extends tt{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:Sr++}),this.uuid=ot(),this.name=``,this.type=`BufferGeometry`,this.index=null,this.indirect=null,this.indirectOffset=0,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={},this._transformed=!1}getIndex(){return this.index}setIndex(e){return this.index=Array.isArray(e)?new(Ge(e)?_r:gr)(e,1):e,this}setIndirect(e,t=0){return this.indirect=e,this.indirectOffset=t,this}getIndirect(){return this.indirect}getAttribute(e){return this.attributes[e]}setAttribute(e,t){return this.attributes[e]=t,this}deleteAttribute(e){return delete this.attributes[e],this}hasAttribute(e){return this.attributes[e]!==void 0}addGroup(e,t,n=0){this.groups.push({start:e,count:t,materialIndex:n})}clearGroups(){this.groups=[]}setDrawRange(e,t){this.drawRange.start=e,this.drawRange.count=t}applyMatrix4(e){let t=this.attributes.position;t!==void 0&&(t.applyMatrix4(e),t.needsUpdate=!0);let n=this.attributes.normal;if(n!==void 0){let t=new Nt().getNormalMatrix(e);n.applyNormalMatrix(t),n.needsUpdate=!0}let r=this.attributes.tangent;return r!==void 0&&(r.transformDirection(e),r.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this._transformed=!0,this}applyQuaternion(e){return Cr.makeRotationFromQuaternion(e),this.applyMatrix4(Cr),this}rotateX(e){return Cr.makeRotationX(e),this.applyMatrix4(Cr),this}rotateY(e){return Cr.makeRotationY(e),this.applyMatrix4(Cr),this}rotateZ(e){return Cr.makeRotationZ(e),this.applyMatrix4(Cr),this}translate(e,t,n){return Cr.makeTranslation(e,t,n),this.applyMatrix4(Cr),this}scale(e,t,n){return Cr.makeScale(e,t,n),this.applyMatrix4(Cr),this}lookAt(e){return wr.lookAt(e),wr.updateMatrix(),this.applyMatrix4(wr.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(Tr).negate(),this.translate(Tr.x,Tr.y,Tr.z),this}setFromPoints(e){let t=this.getAttribute(`position`);if(t===void 0){let t=[];for(let n=0,r=e.length;n<r;n++){let r=e[n];t.push(r.x,r.y,r.z||0)}this.setAttribute(`position`,new Z(t,3))}else{let n=Math.min(e.length,t.count);for(let r=0;r<n;r++){let n=e[r];t.setXYZ(r,n.x,n.y,n.z||0)}e.length>t.count&&G(`BufferGeometry: Buffer size too small for points data. Use .dispose() and create a new geometry.`),t.needsUpdate=!0}return this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new Zn);let e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute)K(`BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box.`,this),this.boundingBox.set(new J(-1/0,-1/0,-1/0),new J(1/0,1/0,1/0));else{if(e!==void 0){if(this.boundingBox.setFromBufferAttribute(e),t)for(let e=0,n=t.length;e<n;e++){let n=t[e];Er.setFromBufferAttribute(n),this.morphTargetsRelative?(Or.addVectors(this.boundingBox.min,Er.min),this.boundingBox.expandByPoint(Or),Or.addVectors(this.boundingBox.max,Er.max),this.boundingBox.expandByPoint(Or)):(this.boundingBox.expandByPoint(Er.min),this.boundingBox.expandByPoint(Er.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&K(`BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.`,this)}}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new xr);let e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute)K(`BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere.`,this),this.boundingSphere.set(new J,1/0);else if(e){let n=this.boundingSphere.center;if(Er.setFromBufferAttribute(e),t)for(let e=0,n=t.length;e<n;e++){let n=t[e];Dr.setFromBufferAttribute(n),this.morphTargetsRelative?(Or.addVectors(Er.min,Dr.min),Er.expandByPoint(Or),Or.addVectors(Er.max,Dr.max),Er.expandByPoint(Or)):(Er.expandByPoint(Dr.min),Er.expandByPoint(Dr.max))}Er.getCenter(n);let r=0;for(let t=0,i=e.count;t<i;t++)Or.fromBufferAttribute(e,t),r=Math.max(r,n.distanceToSquared(Or));if(t)for(let i=0,a=t.length;i<a;i++){let a=t[i],o=this.morphTargetsRelative;for(let t=0,i=a.count;t<i;t++)Or.fromBufferAttribute(a,t),o&&(Tr.fromBufferAttribute(e,t),Or.add(Tr)),r=Math.max(r,n.distanceToSquared(Or))}this.boundingSphere.radius=Math.sqrt(r),isNaN(this.boundingSphere.radius)&&K(`BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.`,this)}}computeTangents(){let e=this.index,t=this.attributes;if(e===null||t.position===void 0||t.normal===void 0||t.uv===void 0){K(`BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)`);return}let n=t.position,r=t.normal,i=t.uv,a=this.getAttribute(`tangent`);(a===void 0||a.count!==n.count)&&(a=new hr(new Float32Array(4*n.count),4),this.setAttribute(`tangent`,a));let o=[],s=[],c=new Uint8Array(n.count);for(let e=0;e<n.count;e++)o[e]=new J,s[e]=new J;let l=new J,u=new J,d=new J,f=new q,p=new q,m=new q,h=new J,g=new J;function _(e,t,r){c[e]=c[t]=c[r]=1,l.fromBufferAttribute(n,e),u.fromBufferAttribute(n,t),d.fromBufferAttribute(n,r),f.fromBufferAttribute(i,e),p.fromBufferAttribute(i,t),m.fromBufferAttribute(i,r),u.sub(l),d.sub(l),p.sub(f),m.sub(f);let a=1/(p.x*m.y-m.x*p.y);isFinite(a)&&(h.copy(u).multiplyScalar(m.y).addScaledVector(d,-p.y).multiplyScalar(a),g.copy(d).multiplyScalar(p.x).addScaledVector(u,-m.x).multiplyScalar(a),o[e].add(h),o[t].add(h),o[r].add(h),s[e].add(g),s[t].add(g),s[r].add(g))}let v=this.groups;v.length===0&&(v=[{start:0,count:e.count}]);for(let t=0,n=v.length;t<n;++t){let n=v[t],r=n.start,i=n.count;for(let t=r,n=r+i;t<n;t+=3)_(e.getX(t+0),e.getX(t+1),e.getX(t+2))}let y=new J,b=new J,x=new J,S=new J;function C(e){x.fromBufferAttribute(r,e),S.copy(x);let t=o[e];y.copy(t),y.sub(x.multiplyScalar(x.dot(t))).normalize(),b.crossVectors(S,t);let n=b.dot(s[e])<0?-1:1;a.setXYZW(e,y.x,y.y,y.z,n)}for(let e=0,t=n.count;e<t;++e)c[e]&&C(e);this._transformed=!0}computeVertexNormals(){let e=this.index,t=this.getAttribute(`position`);if(t!==void 0){let n=this.getAttribute(`normal`);if(n===void 0||n.count!==t.count)n=new hr(new Float32Array(t.count*3),3),this.setAttribute(`normal`,n);else for(let e=0,t=n.count;e<t;e++)n.setXYZ(e,0,0,0);let r=new J,i=new J,a=new J,o=new J,s=new J,c=new J,l=new J,u=new J;if(e)for(let d=0,f=e.count;d<f;d+=3){let f=e.getX(d+0),p=e.getX(d+1),m=e.getX(d+2);r.fromBufferAttribute(t,f),i.fromBufferAttribute(t,p),a.fromBufferAttribute(t,m),l.subVectors(a,i),u.subVectors(r,i),l.cross(u),o.fromBufferAttribute(n,f),s.fromBufferAttribute(n,p),c.fromBufferAttribute(n,m),o.add(l),s.add(l),c.add(l),n.setXYZ(f,o.x,o.y,o.z),n.setXYZ(p,s.x,s.y,s.z),n.setXYZ(m,c.x,c.y,c.z)}else for(let e=0,o=t.count;e<o;e+=3)r.fromBufferAttribute(t,e+0),i.fromBufferAttribute(t,e+1),a.fromBufferAttribute(t,e+2),l.subVectors(a,i),u.subVectors(r,i),l.cross(u),n.setXYZ(e+0,l.x,l.y,l.z),n.setXYZ(e+1,l.x,l.y,l.z),n.setXYZ(e+2,l.x,l.y,l.z);this.normalizeNormals(),n.needsUpdate=!0}}normalizeNormals(){let e=this.attributes.normal;for(let t=0,n=e.count;t<n;t++)Or.fromBufferAttribute(e,t),Or.normalize(),e.setXYZ(t,Or.x,Or.y,Or.z)}toNonIndexed(){function t(e,t){let n=e.array,r=e.itemSize,i=e.normalized,a=new n.constructor(t.length*r),o=0,s=0;for(let i=0,c=t.length;i<c;i++){o=e.isInterleavedBufferAttribute?t[i]*e.data.stride+e.offset:t[i]*r;for(let e=0;e<r;e++)a[s++]=n[o++]}return new hr(a,r,i)}if(this.index===null)return G(`BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed.`),this;let n=new e,r=this.index.array,i=this.attributes;for(let e in i){let a=i[e],o=t(a,r);n.setAttribute(e,o)}let a=this.morphAttributes;for(let e in a){let i=[],o=a[e];for(let e=0,n=o.length;e<n;e++){let n=o[e],a=t(n,r);i.push(a)}n.morphAttributes[e]=i}n.morphTargetsRelative=this.morphTargetsRelative;let o=this.groups;for(let e=0,t=o.length;e<t;e++){let t=o[e];n.addGroup(t.start,t.count,t.materialIndex)}return n}toJSON(){let e={metadata:{version:4.7,type:`BufferGeometry`,generator:`BufferGeometry.toJSON`}};if(e.uuid=this.uuid,e.type=this.parameters!==void 0&&this._transformed===!0?`BufferGeometry`:this.type,e.name=this.name,Object.keys(this.userData).length>0&&(e.userData=this.userData),this.parameters!==void 0&&this._transformed!==!0){let t=this.parameters;for(let n in t)t[n]!==void 0&&(e[n]=t[n]);return e}e.data={attributes:{}};let t=this.index;t!==null&&(e.data.index={type:t.array.constructor.name,array:Array.prototype.slice.call(t.array)});let n=this.attributes;for(let t in n){let r=n[t];e.data.attributes[t]=r.toJSON(e.data)}let r={},i=!1;for(let t in this.morphAttributes){let n=this.morphAttributes[t],a=[];for(let t=0,r=n.length;t<r;t++){let r=n[t];a.push(r.toJSON(e.data))}a.length>0&&(r[t]=a,i=!0)}i&&(e.data.morphAttributes=r,e.data.morphTargetsRelative=this.morphTargetsRelative);let a=this.groups;a.length>0&&(e.data.groups=JSON.parse(JSON.stringify(a)));let o=this.boundingSphere;return o!==null&&(e.data.boundingSphere=o.toJSON()),e}clone(){return new this.constructor().copy(this)}copy(e){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;let t={};this.name=e.name;let n=e.index;n!==null&&this.setIndex(n.clone());let r=e.attributes;for(let e in r){let n=r[e];this.setAttribute(e,n.clone(t))}let i=e.morphAttributes;for(let e in i){let n=[],r=i[e];for(let e=0,i=r.length;e<i;e++)n.push(r[e].clone(t));this.morphAttributes[e]=n}this.morphTargetsRelative=e.morphTargetsRelative;let a=e.groups;for(let e=0,t=a.length;e<t;e++){let t=a[e];this.addGroup(t.start,t.count,t.materialIndex)}let o=e.boundingBox;o!==null&&(this.boundingBox=o.clone());let s=e.boundingSphere;return s!==null&&(this.boundingSphere=s.clone()),this.drawRange.start=e.drawRange.start,this.drawRange.count=e.drawRange.count,this.userData=e.userData,this._transformed=e._transformed,this}dispose(){this.dispatchEvent({type:`dispose`})}},Ar=class{constructor(e,t){this.isInterleavedBuffer=!0,this.array=e,this.stride=t,this.count=e===void 0?0:e.length/t,this.usage=He,this.updateRanges=[],this.version=0,this.uuid=ot()}onUploadCallback(){}set needsUpdate(e){e===!0&&this.version++}setUsage(e){return this.usage=e,this}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}copy(e){return this.array=new e.array.constructor(e.array),this.count=e.count,this.stride=e.stride,this.usage=e.usage,this}copyAt(e,t,n){e*=this.stride,n*=t.stride;for(let r=0,i=this.stride;r<i;r++)this.array[e+r]=t.array[n+r];return this}set(e,t=0){return this.array.set(e,t),this}clone(e){e.arrayBuffers===void 0&&(e.arrayBuffers={});let t=jr(this.array);e.arrayBuffers[t]===void 0&&(e.arrayBuffers[t]=this.array.slice(0).buffer);let n=new this.array.constructor(e.arrayBuffers[t]),r=new this.constructor(n,this.stride);return r.setUsage(this.usage),r}onUpload(e){return this.onUploadCallback=e,this}toJSON(e){e.arrayBuffers===void 0&&(e.arrayBuffers={});let t=jr(this.array);e.arrayBuffers[t]===void 0&&(e.arrayBuffers[t]=Array.from(new Uint32Array(this.array.slice(0).buffer)));let n={uuid:this.uuid,buffer:t,type:this.array.constructor.name,stride:this.stride};return n.usage=this.usage,n}};function jr(e){return e.buffer._uuid===void 0&&(e.buffer._uuid=ot()),e.byteOffset===0&&e.byteLength===e.buffer.byteLength?e.buffer._uuid:e.buffer._uuid+`:`+e.byteOffset+`:`+e.byteLength}var Mr=new J,Nr=class e{constructor(e,t,n,r=!1){this.isInterleavedBufferAttribute=!0,this.name=``,this.data=e,this.itemSize=t,this.offset=n,this.normalized=r,this._normalizationScale=e===void 0?void 0:Et(e.array)}get count(){return this.data.count}get array(){return this.data.array}set needsUpdate(e){this.data.needsUpdate=e}applyMatrix4(e){for(let t=0,n=this.data.count;t<n;t++)Mr.fromBufferAttribute(this,t),Mr.applyMatrix4(e),this.setXYZ(t,Mr.x,Mr.y,Mr.z);return this}applyNormalMatrix(e){for(let t=0,n=this.count;t<n;t++)Mr.fromBufferAttribute(this,t),Mr.applyNormalMatrix(e),this.setXYZ(t,Mr.x,Mr.y,Mr.z);return this}transformDirection(e){for(let t=0,n=this.count;t<n;t++)Mr.fromBufferAttribute(this,t),Mr.transformDirection(e),this.setXYZ(t,Mr.x,Mr.y,Mr.z);return this}getComponent(e,t){let n=this.array[e*this.data.stride+this.offset+t];return this.normalized&&(n=this._denormalize(n)),n}setComponent(e,t,n){return this.normalized&&(n=this._normalize(n)),this.data.array[e*this.data.stride+this.offset+t]=n,this}setX(e,t){return this.normalized&&(t=this._normalize(t)),this.data.array[e*this.data.stride+this.offset]=t,this}setY(e,t){return this.normalized&&(t=this._normalize(t)),this.data.array[e*this.data.stride+this.offset+1]=t,this}setZ(e,t){return this.normalized&&(t=this._normalize(t)),this.data.array[e*this.data.stride+this.offset+2]=t,this}setW(e,t){return this.normalized&&(t=this._normalize(t)),this.data.array[e*this.data.stride+this.offset+3]=t,this}getX(e){let t=this.data.array[e*this.data.stride+this.offset];return this.normalized&&(t=this._denormalize(t)),t}getY(e){let t=this.data.array[e*this.data.stride+this.offset+1];return this.normalized&&(t=this._denormalize(t)),t}getZ(e){let t=this.data.array[e*this.data.stride+this.offset+2];return this.normalized&&(t=this._denormalize(t)),t}getW(e){let t=this.data.array[e*this.data.stride+this.offset+3];return this.normalized&&(t=this._denormalize(t)),t}setXY(e,t,n){return e=e*this.data.stride+this.offset,this.normalized&&(t=this._normalize(t),n=this._normalize(n)),this.data.array[e+0]=t,this.data.array[e+1]=n,this}setXYZ(e,t,n,r){return e=e*this.data.stride+this.offset,this.normalized&&(t=this._normalize(t),n=this._normalize(n),r=this._normalize(r)),this.data.array[e+0]=t,this.data.array[e+1]=n,this.data.array[e+2]=r,this}setXYZW(e,t,n,r,i){return e=e*this.data.stride+this.offset,this.normalized&&(t=this._normalize(t),n=this._normalize(n),r=this._normalize(r),i=this._normalize(i)),this.data.array[e+0]=t,this.data.array[e+1]=n,this.data.array[e+2]=r,this.data.array[e+3]=i,this}clone(t){if(t===void 0){Xe(`InterleavedBufferAttribute.clone(): Cloning an interleaved buffer attribute will de-interleave buffer data.`);let e=[];for(let t=0;t<this.count;t++){let n=t*this.data.stride+this.offset;for(let t=0;t<this.itemSize;t++)e.push(this.data.array[n+t])}return new hr(new this.array.constructor(e),this.itemSize,this.normalized)}return t.interleavedBuffers===void 0&&(t.interleavedBuffers={}),t.interleavedBuffers[this.data.uuid]===void 0&&(t.interleavedBuffers[this.data.uuid]=this.data.clone(t)),new e(t.interleavedBuffers[this.data.uuid],this.itemSize,this.offset,this.normalized)}toJSON(e){if(e===void 0){Xe(`InterleavedBufferAttribute.toJSON(): Serializing an interleaved buffer attribute will de-interleave buffer data.`);let e=[];for(let t=0;t<this.count;t++){let n=t*this.data.stride+this.offset;for(let t=0;t<this.itemSize;t++)e.push(this.data.array[n+t])}return{itemSize:this.itemSize,type:this.array.constructor.name,array:e,normalized:this.normalized}}return e.interleavedBuffers===void 0&&(e.interleavedBuffers={}),e.interleavedBuffers[this.data.uuid]===void 0&&(e.interleavedBuffers[this.data.uuid]=this.data.toJSON(e)),{isInterleavedBufferAttribute:!0,itemSize:this.itemSize,data:this.data.uuid,offset:this.offset,normalized:this.normalized}}_denormalize(e){let t=this._normalizationScale;return t===void 0?Dt(e,this.data.array):Math.max(e/t,-1)}_normalize(e){let t=this._normalizationScale;return t===void 0?Ot(e,this.data.array):Math.round(e*t)}},Pr=new J,Fr=new J,Ir=new Nt,Lr=class{constructor(e=new J(1,0,0),t=0){this.isPlane=!0,this.normal=e,this.constant=t}set(e,t){return this.normal.copy(e),this.constant=t,this}setComponents(e,t,n,r){return this.normal.set(e,t,n),this.constant=r,this}setFromNormalAndCoplanarPoint(e,t){return this.normal.copy(e),this.constant=-t.dot(this.normal),this}setFromCoplanarPoints(e,t,n){let r=Pr.subVectors(n,t).cross(Fr.subVectors(e,t)).normalize();return this.setFromNormalAndCoplanarPoint(r,e),this}copy(e){return this.normal.copy(e.normal),this.constant=e.constant,this}normalize(){let e=1/this.normal.length();return this.normal.multiplyScalar(e),this.constant*=e,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(e){return this.normal.dot(e)+this.constant}distanceToSphere(e){return this.distanceToPoint(e.center)-e.radius}projectPoint(e,t){return t.copy(e).addScaledVector(this.normal,-this.distanceToPoint(e))}intersectLine(e,t,n=!0){let r=e.delta(Pr),i=this.normal.dot(r);if(i===0)return this.distanceToPoint(e.start)===0?t.copy(e.start):null;let a=-(e.start.dot(this.normal)+this.constant)/i;return n===!0&&(a<0||a>1)?null:t.copy(e.start).addScaledVector(r,a)}intersectsLine(e){let t=this.distanceToPoint(e.start),n=this.distanceToPoint(e.end);return t<0&&n>0||n<0&&t>0}intersectsBox(e){return e.intersectsPlane(this)}intersectsSphere(e){return e.intersectsPlane(this)}coplanarPoint(e){return e.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(e,t){let n=t||Ir.getNormalMatrix(e),r=this.coplanarPoint(Pr).applyMatrix4(e),i=this.normal.applyMatrix3(n).normalize();return this.constant=-r.dot(i),this}translate(e){return this.constant-=e.dot(this.normal),this}equals(e){return e.normal.equals(this.normal)&&e.constant===this.constant}clone(){return new this.constructor().copy(this)}toJSON(){return{normal:this.normal.toArray(),constant:this.constant}}fromJSON(e){return this.normal.fromArray(e.normal),this.constant=e.constant,this}},Rr=0,zr=class extends tt{constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:Rr++}),this.uuid=ot(),this.name=``,this.type=`Material`,this.blending=1,this.side=0,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=204,this.blendDst=205,this.blendEquation=100,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new X(0,0,0),this.blendAlpha=0,this.depthFunc=3,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=519,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=Ve,this.stencilZFail=Ve,this.stencilZPass=Ve,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.allowOverride=!0,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(e){this._alphaTest>0!=e>0&&this.version++,this._alphaTest=e}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(e){if(e!==void 0)for(let t in e){let n=e[t];if(n===void 0){G(`Material: parameter '${t}' has value of undefined.`);continue}let r=this[t];r===void 0?G(`Material: '${t}' is not a property of THREE.${this.type}.`):r&&r.isColor?r.set(n):r&&r.isVector2&&n&&n.isVector2||r&&r.isEuler&&n&&n.isEuler||r&&r.isVector3&&n&&n.isVector3?r.copy(n):this[t]=n}}toJSON(e){let t=e===void 0||typeof e==`string`;t&&(e={textures:{},images:{}});let n={metadata:{version:4.7,type:`Material`,generator:`Material.toJSON`}};n.uuid=this.uuid,n.type=this.type,n.blending=this.blending,n.side=this.side,n.shadowSide=this.shadowSide,n.vertexColors=this.vertexColors,n.opacity=this.opacity,n.transparent=this.transparent,n.blendSrc=this.blendSrc,n.blendDst=this.blendDst,n.blendEquation=this.blendEquation,n.blendSrcAlpha=this.blendSrcAlpha,n.blendDstAlpha=this.blendDstAlpha,n.blendEquationAlpha=this.blendEquationAlpha,n.blendColor=this.blendColor.getHex(),n.blendAlpha=this.blendAlpha,n.depthFunc=this.depthFunc,n.depthTest=this.depthTest,n.depthWrite=this.depthWrite,n.colorWrite=this.colorWrite,n.clipIntersection=this.clipIntersection,n.clipShadows=this.clipShadows,n.stencilWriteMask=this.stencilWriteMask,n.stencilFunc=this.stencilFunc,n.stencilRef=this.stencilRef,n.stencilFuncMask=this.stencilFuncMask,n.stencilFail=this.stencilFail,n.stencilZFail=this.stencilZFail,n.stencilZPass=this.stencilZPass,n.stencilWrite=this.stencilWrite,n.polygonOffset=this.polygonOffset,n.polygonOffsetFactor=this.polygonOffsetFactor,n.polygonOffsetUnits=this.polygonOffsetUnits,n.dithering=this.dithering,n.alphaTest=this.alphaTest,n.alphaHash=this.alphaHash,n.alphaToCoverage=this.alphaToCoverage,n.premultipliedAlpha=this.premultipliedAlpha,n.forceSinglePass=this.forceSinglePass,n.allowOverride=this.allowOverride,n.visible=this.visible,n.toneMapped=this.toneMapped,n.name=this.name,this.color&&this.color.isColor&&(n.color=this.color.getHex()),this.roughness!==void 0&&(n.roughness=this.roughness),this.metalness!==void 0&&(n.metalness=this.metalness),this.sheen!==void 0&&(n.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(n.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(n.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(n.emissive=this.emissive.getHex()),this.emissiveIntensity!==void 0&&(n.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(n.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(n.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(n.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(n.shininess=this.shininess),this.clearcoat!==void 0&&(n.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(n.clearcoatRoughness=this.clearcoatRoughness),this.diffuseRoughness!==void 0&&(n.diffuseRoughness=this.diffuseRoughness),this.diffuseRoughnessMap&&this.diffuseRoughnessMap.isTexture&&(n.diffuseRoughnessMap=this.diffuseRoughnessMap.toJSON(e).uuid),this.clearcoatMap&&this.clearcoatMap.isTexture&&(n.clearcoatMap=this.clearcoatMap.toJSON(e).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(n.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(e).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(n.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(e).uuid,n.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.sheenColorMap&&this.sheenColorMap.isTexture&&(n.sheenColorMap=this.sheenColorMap.toJSON(e).uuid),this.sheenRoughnessMap&&this.sheenRoughnessMap.isTexture&&(n.sheenRoughnessMap=this.sheenRoughnessMap.toJSON(e).uuid),this.dispersion!==void 0&&(n.dispersion=this.dispersion),this.retroreflectivity!==void 0&&(n.retroreflectivity=this.retroreflectivity),this.iridescence!==void 0&&(n.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(n.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessMinimum!==void 0&&(n.iridescenceThicknessMinimum=this.iridescenceThicknessMinimum),this.iridescenceThicknessMaximum!==void 0&&(n.iridescenceThicknessMaximum=this.iridescenceThicknessMaximum),this.iridescenceMap&&this.iridescenceMap.isTexture&&(n.iridescenceMap=this.iridescenceMap.toJSON(e).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(n.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(e).uuid),this.anisotropy!==void 0&&(n.anisotropy=this.anisotropy),this.anisotropyRotation!==void 0&&(n.anisotropyRotation=this.anisotropyRotation),this.anisotropyMap&&this.anisotropyMap.isTexture&&(n.anisotropyMap=this.anisotropyMap.toJSON(e).uuid),this.map&&this.map.isTexture&&(n.map=this.map.toJSON(e).uuid),this.matcap&&this.matcap.isTexture&&(n.matcap=this.matcap.toJSON(e).uuid),this.alphaMap&&this.alphaMap.isTexture&&(n.alphaMap=this.alphaMap.toJSON(e).uuid),this.lightMap&&this.lightMap.isTexture&&(n.lightMap=this.lightMap.toJSON(e).uuid,n.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(n.aoMap=this.aoMap.toJSON(e).uuid,n.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(n.bumpMap=this.bumpMap.toJSON(e).uuid,n.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(n.normalMap=this.normalMap.toJSON(e).uuid,n.normalMapType=this.normalMapType,n.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(n.displacementMap=this.displacementMap.toJSON(e).uuid,n.displacementScale=this.displacementScale,n.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(n.roughnessMap=this.roughnessMap.toJSON(e).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(n.metalnessMap=this.metalnessMap.toJSON(e).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(n.emissiveMap=this.emissiveMap.toJSON(e).uuid),this.specularMap&&this.specularMap.isTexture&&(n.specularMap=this.specularMap.toJSON(e).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(n.specularIntensityMap=this.specularIntensityMap.toJSON(e).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(n.specularColorMap=this.specularColorMap.toJSON(e).uuid),this.envMap&&this.envMap.isTexture&&(n.envMap=this.envMap.toJSON(e).uuid,this.combine!==void 0&&(n.combine=this.combine)),this.envMapRotation!==void 0&&(n.envMapRotation=this.envMapRotation.toArray()),this.envMapIntensity!==void 0&&(n.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(n.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(n.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(n.gradientMap=this.gradientMap.toJSON(e).uuid),this.transmission!==void 0&&(n.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(n.transmissionMap=this.transmissionMap.toJSON(e).uuid),this.thickness!==void 0&&(n.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(n.thicknessMap=this.thicknessMap.toJSON(e).uuid),this.attenuationDistance!==void 0&&(n.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(n.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(n.size=this.size),this.sizeAttenuation!==void 0&&(n.sizeAttenuation=this.sizeAttenuation),Array.isArray(this.clippingPlanes)&&this.clippingPlanes.length>0&&(n.clippingPlanes=this.clippingPlanes.map(e=>e.toJSON())),this.rotation!==void 0&&(n.rotation=this.rotation),this.depthPacking!==void 0&&(n.depthPacking=this.depthPacking),this.linewidth!==void 0&&(n.linewidth=this.linewidth),this.linecap!==void 0&&(n.linecap=this.linecap),this.linejoin!==void 0&&(n.linejoin=this.linejoin),this.dashSize!==void 0&&(n.dashSize=this.dashSize),this.gapSize!==void 0&&(n.gapSize=this.gapSize),this.scale!==void 0&&(n.scale=this.scale),this.wireframe!==void 0&&(n.wireframe=this.wireframe),this.wireframeLinewidth!==void 0&&(n.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!==void 0&&(n.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!==void 0&&(n.wireframeLinejoin=this.wireframeLinejoin),this.flatShading!==void 0&&(n.flatShading=this.flatShading),this.fog!==void 0&&(n.fog=this.fog),Object.keys(this.userData).length>0&&(n.userData=this.userData);function r(e){let t=[];for(let n in e){let r=e[n];delete r.metadata,t.push(r)}return t}if(t){let t=r(e.textures),i=r(e.images);t.length>0&&(n.textures=t),i.length>0&&(n.images=i)}return n}fromJSON(e,t){if(e.uuid!==void 0&&(this.uuid=e.uuid),e.name!==void 0&&(this.name=e.name),e.color!==void 0&&this.color!==void 0&&this.color.setHex(e.color),e.roughness!==void 0&&(this.roughness=e.roughness),e.metalness!==void 0&&(this.metalness=e.metalness),e.sheen!==void 0&&(this.sheen=e.sheen),e.sheenColor!==void 0&&(this.sheenColor=new X().setHex(e.sheenColor)),e.sheenRoughness!==void 0&&(this.sheenRoughness=e.sheenRoughness),e.emissive!==void 0&&this.emissive!==void 0&&this.emissive.setHex(e.emissive),e.specular!==void 0&&this.specular!==void 0&&this.specular.setHex(e.specular),e.specularIntensity!==void 0&&(this.specularIntensity=e.specularIntensity),e.specularColor!==void 0&&this.specularColor!==void 0&&this.specularColor.setHex(e.specularColor),e.shininess!==void 0&&(this.shininess=e.shininess),e.clearcoat!==void 0&&(this.clearcoat=e.clearcoat),e.clearcoatRoughness!==void 0&&(this.clearcoatRoughness=e.clearcoatRoughness),e.diffuseRoughness!==void 0&&(this.diffuseRoughness=e.diffuseRoughness),e.dispersion!==void 0&&(this.dispersion=e.dispersion),e.retroreflectivity!==void 0&&(this.retroreflectivity=e.retroreflectivity),e.iridescence!==void 0&&(this.iridescence=e.iridescence),e.iridescenceIOR!==void 0&&(this.iridescenceIOR=e.iridescenceIOR),e.iridescenceThicknessMinimum!==void 0&&(this.iridescenceThicknessMinimum=e.iridescenceThicknessMinimum),e.iridescenceThicknessMaximum!==void 0&&(this.iridescenceThicknessMaximum=e.iridescenceThicknessMaximum),e.iridescenceThicknessRange!==void 0&&(this.iridescenceThicknessMinimum=e.iridescenceThicknessRange[0],this.iridescenceThicknessMaximum=e.iridescenceThicknessRange[1]),e.transmission!==void 0&&(this.transmission=e.transmission),e.thickness!==void 0&&(this.thickness=e.thickness),e.attenuationDistance!==void 0&&(this.attenuationDistance=e.attenuationDistance),e.attenuationColor!==void 0&&this.attenuationColor!==void 0&&this.attenuationColor.setHex(e.attenuationColor),e.anisotropy!==void 0&&(this.anisotropy=e.anisotropy),e.anisotropyRotation!==void 0&&(this.anisotropyRotation=e.anisotropyRotation),e.fog!==void 0&&(this.fog=e.fog),e.flatShading!==void 0&&(this.flatShading=e.flatShading),e.blending!==void 0&&(this.blending=e.blending),e.combine!==void 0&&(this.combine=e.combine),e.side!==void 0&&(this.side=e.side),e.shadowSide!==void 0&&(this.shadowSide=e.shadowSide),e.opacity!==void 0&&(this.opacity=e.opacity),e.transparent!==void 0&&(this.transparent=e.transparent),e.alphaTest!==void 0&&(this.alphaTest=e.alphaTest),e.alphaHash!==void 0&&(this.alphaHash=e.alphaHash),e.depthFunc!==void 0&&(this.depthFunc=e.depthFunc),e.depthTest!==void 0&&(this.depthTest=e.depthTest),e.depthWrite!==void 0&&(this.depthWrite=e.depthWrite),e.colorWrite!==void 0&&(this.colorWrite=e.colorWrite),e.clippingPlanes!==void 0&&(this.clippingPlanes=e.clippingPlanes.map(e=>new Lr().fromJSON(e))),e.clipIntersection!==void 0&&(this.clipIntersection=e.clipIntersection),e.clipShadows!==void 0&&(this.clipShadows=e.clipShadows),e.depthPacking!==void 0&&(this.depthPacking=e.depthPacking),e.blendSrc!==void 0&&(this.blendSrc=e.blendSrc),e.blendDst!==void 0&&(this.blendDst=e.blendDst),e.blendEquation!==void 0&&(this.blendEquation=e.blendEquation),e.blendSrcAlpha!==void 0&&(this.blendSrcAlpha=e.blendSrcAlpha),e.blendDstAlpha!==void 0&&(this.blendDstAlpha=e.blendDstAlpha),e.blendEquationAlpha!==void 0&&(this.blendEquationAlpha=e.blendEquationAlpha),e.blendColor!==void 0&&this.blendColor!==void 0&&this.blendColor.setHex(e.blendColor),e.blendAlpha!==void 0&&(this.blendAlpha=e.blendAlpha),e.stencilWriteMask!==void 0&&(this.stencilWriteMask=e.stencilWriteMask),e.stencilFunc!==void 0&&(this.stencilFunc=e.stencilFunc),e.stencilRef!==void 0&&(this.stencilRef=e.stencilRef),e.stencilFuncMask!==void 0&&(this.stencilFuncMask=e.stencilFuncMask),e.stencilFail!==void 0&&(this.stencilFail=e.stencilFail),e.stencilZFail!==void 0&&(this.stencilZFail=e.stencilZFail),e.stencilZPass!==void 0&&(this.stencilZPass=e.stencilZPass),e.stencilWrite!==void 0&&(this.stencilWrite=e.stencilWrite),e.wireframe!==void 0&&(this.wireframe=e.wireframe),e.wireframeLinewidth!==void 0&&(this.wireframeLinewidth=e.wireframeLinewidth),e.wireframeLinecap!==void 0&&(this.wireframeLinecap=e.wireframeLinecap),e.wireframeLinejoin!==void 0&&(this.wireframeLinejoin=e.wireframeLinejoin),e.rotation!==void 0&&(this.rotation=e.rotation),e.linewidth!==void 0&&(this.linewidth=e.linewidth),e.linecap!==void 0&&(this.linecap=e.linecap),e.linejoin!==void 0&&(this.linejoin=e.linejoin),e.dashSize!==void 0&&(this.dashSize=e.dashSize),e.gapSize!==void 0&&(this.gapSize=e.gapSize),e.scale!==void 0&&(this.scale=e.scale),e.polygonOffset!==void 0&&(this.polygonOffset=e.polygonOffset),e.polygonOffsetFactor!==void 0&&(this.polygonOffsetFactor=e.polygonOffsetFactor),e.polygonOffsetUnits!==void 0&&(this.polygonOffsetUnits=e.polygonOffsetUnits),e.dithering!==void 0&&(this.dithering=e.dithering),e.alphaToCoverage!==void 0&&(this.alphaToCoverage=e.alphaToCoverage),e.premultipliedAlpha!==void 0&&(this.premultipliedAlpha=e.premultipliedAlpha),e.forceSinglePass!==void 0&&(this.forceSinglePass=e.forceSinglePass),e.allowOverride!==void 0&&(this.allowOverride=e.allowOverride),e.visible!==void 0&&(this.visible=e.visible),e.toneMapped!==void 0&&(this.toneMapped=e.toneMapped),e.userData!==void 0&&(this.userData=e.userData),e.vertexColors!==void 0&&(this.vertexColors=typeof e.vertexColors==`number`?e.vertexColors>0:e.vertexColors),e.size!==void 0&&(this.size=e.size),e.sizeAttenuation!==void 0&&(this.sizeAttenuation=e.sizeAttenuation),e.map!==void 0&&(this.map=t[e.map]||null),e.matcap!==void 0&&(this.matcap=t[e.matcap]||null),e.alphaMap!==void 0&&(this.alphaMap=t[e.alphaMap]||null),e.bumpMap!==void 0&&(this.bumpMap=t[e.bumpMap]||null),e.bumpScale!==void 0&&(this.bumpScale=e.bumpScale),e.normalMap!==void 0&&(this.normalMap=t[e.normalMap]||null),e.normalMapType!==void 0&&(this.normalMapType=e.normalMapType),e.normalScale!==void 0){let t=e.normalScale;Array.isArray(t)===!1&&(t=[t,t]),this.normalScale=new q().fromArray(t)}return e.displacementMap!==void 0&&(this.displacementMap=t[e.displacementMap]||null),e.displacementScale!==void 0&&(this.displacementScale=e.displacementScale),e.displacementBias!==void 0&&(this.displacementBias=e.displacementBias),e.roughnessMap!==void 0&&(this.roughnessMap=t[e.roughnessMap]||null),e.metalnessMap!==void 0&&(this.metalnessMap=t[e.metalnessMap]||null),e.emissiveMap!==void 0&&(this.emissiveMap=t[e.emissiveMap]||null),e.emissiveIntensity!==void 0&&(this.emissiveIntensity=e.emissiveIntensity),e.specularMap!==void 0&&(this.specularMap=t[e.specularMap]||null),e.specularIntensityMap!==void 0&&(this.specularIntensityMap=t[e.specularIntensityMap]||null),e.specularColorMap!==void 0&&(this.specularColorMap=t[e.specularColorMap]||null),e.envMap!==void 0&&(this.envMap=t[e.envMap]||null),e.envMapRotation!==void 0&&this.envMapRotation.fromArray(e.envMapRotation),e.envMapIntensity!==void 0&&(this.envMapIntensity=e.envMapIntensity),e.reflectivity!==void 0&&(this.reflectivity=e.reflectivity),e.refractionRatio!==void 0&&(this.refractionRatio=e.refractionRatio),e.lightMap!==void 0&&(this.lightMap=t[e.lightMap]||null),e.lightMapIntensity!==void 0&&(this.lightMapIntensity=e.lightMapIntensity),e.aoMap!==void 0&&(this.aoMap=t[e.aoMap]||null),e.aoMapIntensity!==void 0&&(this.aoMapIntensity=e.aoMapIntensity),e.gradientMap!==void 0&&(this.gradientMap=t[e.gradientMap]||null),e.clearcoatMap!==void 0&&(this.clearcoatMap=t[e.clearcoatMap]||null),e.clearcoatRoughnessMap!==void 0&&(this.clearcoatRoughnessMap=t[e.clearcoatRoughnessMap]||null),e.clearcoatNormalMap!==void 0&&(this.clearcoatNormalMap=t[e.clearcoatNormalMap]||null),e.clearcoatNormalScale!==void 0&&(this.clearcoatNormalScale=new q().fromArray(e.clearcoatNormalScale)),e.diffuseRoughnessMap!==void 0&&(this.diffuseRoughnessMap=t[e.diffuseRoughnessMap]||null),e.iridescenceMap!==void 0&&(this.iridescenceMap=t[e.iridescenceMap]||null),e.iridescenceThicknessMap!==void 0&&(this.iridescenceThicknessMap=t[e.iridescenceThicknessMap]||null),e.transmissionMap!==void 0&&(this.transmissionMap=t[e.transmissionMap]||null),e.thicknessMap!==void 0&&(this.thicknessMap=t[e.thicknessMap]||null),e.anisotropyMap!==void 0&&(this.anisotropyMap=t[e.anisotropyMap]||null),e.sheenColorMap!==void 0&&(this.sheenColorMap=t[e.sheenColorMap]||null),e.sheenRoughnessMap!==void 0&&(this.sheenRoughnessMap=t[e.sheenRoughnessMap]||null),this}clone(){return new this.constructor().copy(this)}copy(e){this.name=e.name,this.blending=e.blending,this.side=e.side,this.vertexColors=e.vertexColors,this.opacity=e.opacity,this.transparent=e.transparent,this.blendSrc=e.blendSrc,this.blendDst=e.blendDst,this.blendEquation=e.blendEquation,this.blendSrcAlpha=e.blendSrcAlpha,this.blendDstAlpha=e.blendDstAlpha,this.blendEquationAlpha=e.blendEquationAlpha,this.blendColor.copy(e.blendColor),this.blendAlpha=e.blendAlpha,this.depthFunc=e.depthFunc,this.depthTest=e.depthTest,this.depthWrite=e.depthWrite,this.stencilWriteMask=e.stencilWriteMask,this.stencilFunc=e.stencilFunc,this.stencilRef=e.stencilRef,this.stencilFuncMask=e.stencilFuncMask,this.stencilFail=e.stencilFail,this.stencilZFail=e.stencilZFail,this.stencilZPass=e.stencilZPass,this.stencilWrite=e.stencilWrite;let t=e.clippingPlanes,n=null;if(t!==null){let e=t.length;n=Array(e);for(let r=0;r!==e;++r)n[r]=t[r].clone()}return this.clippingPlanes=n,this.clipIntersection=e.clipIntersection,this.clipShadows=e.clipShadows,this.shadowSide=e.shadowSide,this.colorWrite=e.colorWrite,this.precision=e.precision,this.polygonOffset=e.polygonOffset,this.polygonOffsetFactor=e.polygonOffsetFactor,this.polygonOffsetUnits=e.polygonOffsetUnits,this.dithering=e.dithering,this.alphaTest=e.alphaTest,this.alphaHash=e.alphaHash,this.alphaToCoverage=e.alphaToCoverage,this.premultipliedAlpha=e.premultipliedAlpha,this.forceSinglePass=e.forceSinglePass,this.allowOverride=e.allowOverride,this.visible=e.visible,this.toneMapped=e.toneMapped,this.userData=JSON.parse(JSON.stringify(e.userData)),this}dispose(){this.dispatchEvent({type:`dispose`})}set needsUpdate(e){e===!0&&this.version++}},Br=new J,Vr=new J,Hr=new J,Ur=new J,Wr=class{constructor(e=new J,t=new J(0,0,-1)){this.origin=e,this.direction=t}set(e,t){return this.origin.copy(e),this.direction.copy(t),this}copy(e){return this.origin.copy(e.origin),this.direction.copy(e.direction),this}at(e,t){return t.copy(this.origin).addScaledVector(this.direction,e)}lookAt(e){return this.direction.copy(e).sub(this.origin).normalize(),this}recast(e){return this.origin.copy(this.at(e,Br)),this}closestPointToPoint(e,t){t.subVectors(e,this.origin);let n=t.dot(this.direction);return n<0?t.copy(this.origin):t.copy(this.origin).addScaledVector(this.direction,n)}distanceToPoint(e){return Math.sqrt(this.distanceSqToPoint(e))}distanceSqToPoint(e){let t=Br.subVectors(e,this.origin).dot(this.direction);return t<0?this.origin.distanceToSquared(e):(Br.copy(this.origin).addScaledVector(this.direction,t),Br.distanceToSquared(e))}distanceSqToSegment(e,t,n,r){Vr.copy(e).add(t).multiplyScalar(.5),Hr.copy(t).sub(e).normalize(),Ur.copy(this.origin).sub(Vr);let i=e.distanceTo(t)*.5,a=-this.direction.dot(Hr),o=Ur.dot(this.direction),s=-Ur.dot(Hr),c=Ur.lengthSq(),l=Math.abs(1-a*a),u,d,f,p;if(l>0){if(u=a*s-o,d=a*o-s,p=i*l,u>=0){if(d>=-p){if(d<=p){let e=1/l;u*=e,d*=e,f=u*(u+a*d+2*o)+d*(a*u+d+2*s)+c}else d=i,u=Math.max(0,-(a*d+o)),f=-u*u+d*(d+2*s)+c}else d=-i,u=Math.max(0,-(a*d+o)),f=-u*u+d*(d+2*s)+c}else d<=-p?(u=Math.max(0,-(-a*i+o)),d=u>0?-i:Math.min(Math.max(-i,-s),i),f=-u*u+d*(d+2*s)+c):d<=p?(u=0,d=Math.min(Math.max(-i,-s),i),f=d*(d+2*s)+c):(u=Math.max(0,-(a*i+o)),d=u>0?i:Math.min(Math.max(-i,-s),i),f=-u*u+d*(d+2*s)+c)}else d=a>0?-i:i,u=Math.max(0,-(a*d+o)),f=-u*u+d*(d+2*s)+c;return n&&n.copy(this.origin).addScaledVector(this.direction,u),r&&r.copy(Vr).addScaledVector(Hr,d),f}intersectSphere(e,t){if(e.radius<0)return null;Br.subVectors(e.center,this.origin);let n=Br.dot(this.direction),r=Br.dot(Br)-n*n,i=e.radius*e.radius;if(r>i)return null;let a=Math.sqrt(i-r),o=n-a,s=n+a;return s<0?null:o<0?this.at(s,t):this.at(o,t)}intersectsSphere(e){return e.radius<0?!1:this.distanceSqToPoint(e.center)<=e.radius*e.radius}distanceToPlane(e){let t=e.normal.dot(this.direction);if(t===0)return e.distanceToPoint(this.origin)===0?0:null;let n=-(this.origin.dot(e.normal)+e.constant)/t;return n>=0?n:null}intersectPlane(e,t){let n=this.distanceToPlane(e);return n===null?null:this.at(n,t)}intersectsPlane(e){let t=e.distanceToPoint(this.origin);return t===0||e.normal.dot(this.direction)*t<0}intersectBox(e,t){let n,r,i,a,o,s,c=1/this.direction.x,l=1/this.direction.y,u=1/this.direction.z,d=this.origin;return c>=0?(n=(e.min.x-d.x)*c,r=(e.max.x-d.x)*c):(n=(e.max.x-d.x)*c,r=(e.min.x-d.x)*c),l>=0?(i=(e.min.y-d.y)*l,a=(e.max.y-d.y)*l):(i=(e.max.y-d.y)*l,a=(e.min.y-d.y)*l),n>a||i>r||((i>n||isNaN(n))&&(n=i),(a<r||isNaN(r))&&(r=a),u>=0?(o=(e.min.z-d.z)*u,s=(e.max.z-d.z)*u):(o=(e.max.z-d.z)*u,s=(e.min.z-d.z)*u),n>s||o>r)||((o>n||n!==n)&&(n=o),(s<r||r!==r)&&(r=s),r<0)?null:this.at(n>=0?n:r,t)}intersectsBox(e){return this.intersectBox(e,Br)!==null}intersectTriangle(e,t,n,r,i){let a=this.origin,o=this.direction,s=o.x,c=o.y,l=o.z,u=e.x-a.x,d=e.y-a.y,f=e.z-a.z,p=t.x-a.x,m=t.y-a.y,h=t.z-a.z,g=n.x-a.x,_=n.y-a.y,v=n.z-a.z,y=Math.abs(s),b=Math.abs(c),x=Math.abs(l),S,C,w,T,E,D,O,k,A,j,M,ee;if(y>=b&&y>=x?(w=s,D=u,A=p,ee=g,s>=0?(S=c,C=l,T=d,E=f,O=m,k=h,j=_,M=v):(S=l,C=c,T=f,E=d,O=h,k=m,j=v,M=_)):b>=x?(w=c,D=d,A=m,ee=_,c>=0?(S=l,C=s,T=f,E=u,O=h,k=p,j=v,M=g):(S=s,C=l,T=u,E=f,O=p,k=h,j=g,M=v)):(w=l,D=f,A=h,ee=v,l>=0?(S=s,C=c,T=u,E=d,O=p,k=m,j=g,M=_):(S=c,C=s,T=d,E=u,O=m,k=p,j=_,M=g)),w===0)return null;let N=S/w,P=C/w,F=1/w,te=T-N*D,I=E-P*D,ne=O-N*A,re=k-P*A,L=j-N*ee,ie=M-P*ee,ae=L*re-ie*ne,R=te*ie-I*L,z=ne*I-re*te;if(r){if(ae<0||R<0||z<0)return null}else if((ae<0||R<0||z<0)&&(ae>0||R>0||z>0))return null;let B=ae+R+z;if(B===0)return null;let oe=F*(ae*D+R*A+z*ee);return(B>0?oe<0:oe>0)?null:this.at(oe/B,i)}applyMatrix4(e){return this.origin.applyMatrix4(e),this.direction.transformDirection(e),this}equals(e){return e.origin.equals(this.origin)&&e.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}},Gr=class extends zr{constructor(e){super(),this.isMeshBasicMaterial=!0,this.type=`MeshBasicMaterial`,this.color=new X(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new un,this.combine=0,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap=`round`,this.wireframeLinejoin=`round`,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.specularMap=e.specularMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.combine=e.combine,this.reflectivity=e.reflectivity,this.refractionRatio=e.refractionRatio,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.fog=e.fog,this}},Kr=new Y,qr=new Wr,Jr=new xr,Yr=new J,Xr=new J,Zr=new J,Qr=new J,$r=new J,ei=new J,ti=new J,ni=new J,ri=class extends Dn{constructor(e=new kr,t=new Gr){super(),this.isMesh=!0,this.type=`Mesh`,this.geometry=e,this.material=t,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.count=1,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),this.morphTargetInfluences=e.morphTargetInfluences===void 0?void 0:e.morphTargetInfluences.slice(),this.morphTargetDictionary=e.morphTargetDictionary===void 0?void 0:Object.assign({},e.morphTargetDictionary),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}updateMorphTargets(){let e=this.geometry.morphAttributes,t=Object.keys(e);if(t.length>0){let n=e[t[0]];if(n!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let e=0,t=n.length;e<t;e++){let t=n[e].name||String(e);this.morphTargetInfluences.push(0),this.morphTargetDictionary[t]=e}}}}getVertexPosition(e,t){let n=this.geometry,r=n.attributes.position,i=n.morphAttributes.position,a=n.morphTargetsRelative;t.fromBufferAttribute(r,e);let o=this.morphTargetInfluences;if(i&&o){ei.set(0,0,0);for(let n=0,r=i.length;n<r;n++){let r=o[n],s=i[n];r!==0&&($r.fromBufferAttribute(s,e),a?ei.addScaledVector($r,r):ei.addScaledVector($r.sub(t),r))}t.add(ei)}return t}intersectsFrustum(e){return e.intersectsObject(this)}raycast(e,t){let n=this.geometry,r=this.material,i=this.matrixWorld;r!==void 0&&(n.boundingSphere===null&&n.computeBoundingSphere(),Jr.copy(n.boundingSphere),Jr.applyMatrix4(i),qr.copy(e.ray).recast(e.near),Jr.containsPoint(qr.origin)===!1&&(qr.intersectSphere(Jr,Yr)===null||qr.origin.distanceToSquared(Yr)>(e.far-e.near)**2)||(Kr.copy(i).invert(),qr.copy(e.ray).applyMatrix4(Kr),(n.boundingBox===null||qr.intersectsBox(n.boundingBox)!==!1)&&this._computeIntersections(e,t,qr)))}_computeIntersections(e,t,n){let r,i=this.geometry,a=this.material,o=i.index,s=i.attributes.position,c=i.attributes.uv,l=i.attributes.uv1,u=i.attributes.normal,d=i.groups,f=i.drawRange;if(o!==null){if(Array.isArray(a))for(let i=0,s=d.length;i<s;i++){let s=d[i],p=a[s.materialIndex],m=Math.max(s.start,f.start),h=Math.min(o.count,Math.min(s.start+s.count,f.start+f.count));for(let i=m,a=h;i<a;i+=3){let a=o.getX(i),d=o.getX(i+1),f=o.getX(i+2);r=ai(this,p,e,n,c,l,u,a,d,f),r&&(r.faceIndex=Math.floor(i/3),r.face.materialIndex=s.materialIndex,t.push(r))}}else{let i=Math.max(0,f.start),s=Math.min(o.count,f.start+f.count);for(let d=i,f=s;d<f;d+=3){let i=o.getX(d),s=o.getX(d+1),f=o.getX(d+2);r=ai(this,a,e,n,c,l,u,i,s,f),r&&(r.faceIndex=Math.floor(d/3),t.push(r))}}}else if(s!==void 0){if(Array.isArray(a))for(let i=0,o=d.length;i<o;i++){let o=d[i],p=a[o.materialIndex],m=Math.max(o.start,f.start),h=Math.min(s.count,Math.min(o.start+o.count,f.start+f.count));for(let i=m,a=h;i<a;i+=3){let a=i,s=i+1,d=i+2;r=ai(this,p,e,n,c,l,u,a,s,d),r&&(r.faceIndex=Math.floor(i/3),r.face.materialIndex=o.materialIndex,t.push(r))}}else{let i=Math.max(0,f.start),o=Math.min(s.count,f.start+f.count);for(let s=i,d=o;s<d;s+=3){let i=s,o=s+1,d=s+2;r=ai(this,a,e,n,c,l,u,i,o,d),r&&(r.faceIndex=Math.floor(s/3),t.push(r))}}}}};function ii(e,t,n,r,i,a,o,s){let c;if(c=t.side===1?r.intersectTriangle(o,a,i,!0,s):r.intersectTriangle(i,a,o,t.side===0,s),c===null)return null;ni.copy(s),ni.applyMatrix4(e.matrixWorld);let l=n.ray.origin.distanceTo(ni);return l<n.near||l>n.far?null:{distance:l,point:ni.clone(),object:e}}function ai(e,t,n,r,i,a,o,s,c,l){e.getVertexPosition(s,Xr),e.getVertexPosition(c,Zr),e.getVertexPosition(l,Qr);let u=ii(e,t,n,r,Xr,Zr,Qr,ti);if(u){let e=new J;Xn.getBarycoord(ti,Xr,Zr,Qr,e),i&&(u.uv=Xn.getInterpolatedAttribute(i,s,c,l,e,new q)),a&&(u.uv1=Xn.getInterpolatedAttribute(a,s,c,l,e,new q)),o&&(u.normal=Xn.getInterpolatedAttribute(o,s,c,l,e,new J),u.normal.dot(r.direction)>0&&u.normal.multiplyScalar(-1));let t={a:s,b:c,c:l,normal:new J,materialIndex:0};Xn.getNormal(Xr,Zr,Qr,t.normal),u.face=t,u.barycoord=e}return u}var oi=new Yt,si=new Yt,ci=new Yt,li=new Yt,ui=new Y,di=new J,fi=new xr,pi=new Y,mi=new Wr,hi=class extends ri{constructor(t,n){super(t,n),this.isSkinnedMesh=!0,this.type=`SkinnedMesh`,this.bindMode=e,this.bindMatrix=new Y,this.bindMatrixInverse=new Y,this.boundingBox=null,this.boundingSphere=null}computeBoundingBox(){let e=this.geometry;this.boundingBox===null&&(this.boundingBox=new Zn),this.boundingBox.makeEmpty();let t=e.getAttribute(`position`);for(let e=0;e<t.count;e++)this.getVertexPosition(e,di),this.boundingBox.expandByPoint(di)}computeBoundingSphere(){let e=this.geometry;this.boundingSphere===null&&(this.boundingSphere=new xr),this.boundingSphere.makeEmpty();let t=e.getAttribute(`position`);for(let e=0;e<t.count;e++)this.getVertexPosition(e,di),this.boundingSphere.expandByPoint(di)}copy(e,t){return super.copy(e,t),this.bindMode=e.bindMode,this.bindMatrix.copy(e.bindMatrix),this.bindMatrixInverse.copy(e.bindMatrixInverse),this.skeleton=e.skeleton,this.boundingBox=e.boundingBox===null?null:e.boundingBox.clone(),this.boundingSphere=e.boundingSphere===null?null:e.boundingSphere.clone(),this}raycast(e,t){let n=this.material,r=this.matrixWorld;n!==void 0&&(this.boundingSphere===null&&this.computeBoundingSphere(),fi.copy(this.boundingSphere),fi.applyMatrix4(r),e.ray.intersectsSphere(fi)!==!1&&(pi.copy(r).invert(),mi.copy(e.ray).applyMatrix4(pi),(this.boundingBox===null||mi.intersectsBox(this.boundingBox)!==!1)&&this._computeIntersections(e,t,mi)))}getVertexPosition(e,t){return super.getVertexPosition(e,t),this.applyBoneTransform(e,t),t}bind(e,t){this.skeleton=e,t===void 0&&(this.updateMatrixWorld(!0),this.skeleton.calculateInverses(),t=this.matrixWorld),this.bindMatrix.copy(t),this.bindMatrixInverse.copy(t).invert()}pose(){this.skeleton.pose()}normalizeSkinWeights(){let e=new Yt,t=this.geometry.attributes.skinWeight;for(let n=0,r=t.count;n<r;n++){e.fromBufferAttribute(t,n);let r=1/e.manhattanLength();r===1/0?e.set(1,0,0,0):e.multiplyScalar(r),t.setXYZW(n,e.x,e.y,e.z,e.w)}}updateMatrixWorld(e){super.updateMatrixWorld(e),this.bindMode===`attached`?this.bindMatrixInverse.copy(this.matrixWorld).invert():this.bindMode===`detached`?this.bindMatrixInverse.copy(this.bindMatrix).invert():G(`SkinnedMesh: Unrecognized bindMode: `+this.bindMode)}applyBoneTransform(e,t){let n=this.skeleton,r=this.geometry;si.fromBufferAttribute(r.attributes.skinIndex,e),ci.fromBufferAttribute(r.attributes.skinWeight,e),t.isVector4?(oi.copy(t),t.set(0,0,0,0)):(oi.set(t.x,t.y,t.z,1),t.set(0,0,0)),oi.applyMatrix4(this.bindMatrix);for(let e=0;e<4;e++){let r=ci.getComponent(e);if(r!==0){let i=si.getComponent(e);ui.multiplyMatrices(n.bones[i].matrixWorld,n.boneInverses[i]),t.addScaledVector(li.copy(oi).applyMatrix4(ui),r)}}return t.isVector4&&(t.w=oi.w),t.applyMatrix4(this.bindMatrixInverse)}},gi=class extends Dn{constructor(){super(),this.isBone=!0,this.type=`Bone`}},_i=class extends Jt{constructor(e=null,t=1,n=1,r,a,o,s,c,l=i,u=i,d,f){super(null,o,s,c,l,u,r,a,d,f),this.isDataTexture=!0,this.image={data:e,width:t,height:n},this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}},vi=new Y,yi=new Y,bi=class e{constructor(e=[],t=[]){this.uuid=ot(),this.bones=e.slice(0),this.boneInverses=t,this.boneMatrices=null,this.previousBoneMatrices=null,this.boneTexture=null,this.previousBoneTexture=null,this.init()}init(){let e=this.bones,t=this.boneInverses;if(this.boneMatrices=new Float32Array(e.length*16),t.length===0)this.calculateInverses();else if(e.length!==t.length){G(`Skeleton: Number of inverse bone matrices does not match amount of bones.`),this.boneInverses=[];for(let e=0,t=this.bones.length;e<t;e++)this.boneInverses.push(new Y)}}calculateInverses(){this.boneInverses.length=0;for(let e=0,t=this.bones.length;e<t;e++){let t=new Y;this.bones[e]&&t.copy(this.bones[e].matrixWorld).invert(),this.boneInverses.push(t)}}pose(){for(let e=0,t=this.bones.length;e<t;e++){let t=this.bones[e];t&&t.matrixWorld.copy(this.boneInverses[e]).invert()}for(let e=0,t=this.bones.length;e<t;e++){let t=this.bones[e];t&&(t.parent&&t.parent.isBone?(t.matrix.copy(t.parent.matrixWorld).invert(),t.matrix.multiply(t.matrixWorld)):t.matrix.copy(t.matrixWorld),t.matrix.decompose(t.position,t.quaternion,t.scale))}}update(){let e=this.bones,t=this.boneInverses,n=this.boneMatrices,r=this.boneTexture;for(let r=0,i=e.length;r<i;r++){let i=e[r]?e[r].matrixWorld:yi;vi.multiplyMatrices(i,t[r]),vi.toArray(n,r*16)}r!==null&&(r.needsUpdate=!0)}clone(){return new e(this.bones,this.boneInverses)}computeBoneTexture(){let e=Math.sqrt(this.bones.length*4);e=Math.ceil(e/4)*4,e=Math.max(e,4);let t=new Float32Array(e*e*4);t.set(this.boneMatrices);let n=new _i(t,e,e,T,g);return n.needsUpdate=!0,this.boneMatrices=t,this.boneTexture=n,this}getBoneByName(e){for(let t=0,n=this.bones.length;t<n;t++){let n=this.bones[t];if(n.name===e)return n}}dispose(){this.boneTexture!==null&&(this.boneTexture.dispose(),this.boneTexture=null),this.previousBoneTexture!==null&&(this.previousBoneTexture.dispose(),this.previousBoneTexture=null)}fromJSON(e,t){this.uuid=e.uuid;for(let n=0,r=e.bones.length;n<r;n++){let r=e.bones[n],i=t[r];i===void 0&&(G(`Skeleton: No bone found with UUID:`,r),i=new gi),this.bones.push(i),this.boneInverses.push(new Y().fromArray(e.boneInverses[n]))}return this.init(),this}toJSON(){let e={metadata:{version:4.7,type:`Skeleton`,generator:`Skeleton.toJSON`},bones:[],boneInverses:[]};e.uuid=this.uuid;let t=this.bones,n=this.boneInverses;for(let r=0,i=t.length;r<i;r++){let i=t[r];e.bones.push(i.uuid);let a=n[r];e.boneInverses.push(a.toArray())}return e}},xi=class extends hr{constructor(e,t,n,r=1){super(e,t,n),this.isInstancedBufferAttribute=!0,this.meshPerAttribute=r}copy(e){return super.copy(e),this.meshPerAttribute=e.meshPerAttribute,this}toJSON(){let e=super.toJSON();return e.meshPerAttribute=this.meshPerAttribute,e.isInstancedBufferAttribute=!0,e}},Si=new Y,Ci=new Y,wi=[],Ti=new Zn,Ei=new Y,Di=new ri,Oi=new xr,ki=class extends ri{constructor(e,t,n){super(e,t),this.isInstancedMesh=!0,this.instanceMatrix=new xi(new Float32Array(n*16),16),this.instanceColor=null,this.morphTexture=null,this.count=n,this.boundingBox=null,this.boundingSphere=null;for(let e=0;e<n;e++)this.setMatrixAt(e,Ei)}computeBoundingBox(){let e=this.geometry,t=this.count;this.boundingBox===null&&(this.boundingBox=new Zn),e.boundingBox===null&&e.computeBoundingBox(),this.boundingBox.makeEmpty();for(let n=0;n<t;n++)this.getMatrixAt(n,Si),Ti.copy(e.boundingBox).applyMatrix4(Si),this.boundingBox.union(Ti)}computeBoundingSphere(){let e=this.geometry,t=this.count;this.boundingSphere===null&&(this.boundingSphere=new xr),e.boundingSphere===null&&e.computeBoundingSphere(),this.boundingSphere.makeEmpty();for(let n=0;n<t;n++)this.getMatrixAt(n,Si),Oi.copy(e.boundingSphere).applyMatrix4(Si),this.boundingSphere.union(Oi)}copy(e,t){return super.copy(e,t),this.instanceMatrix.copy(e.instanceMatrix),this.morphTexture=e.morphTexture===null?null:e.morphTexture.clone(),this.instanceColor=e.instanceColor===null?null:e.instanceColor.clone(),this.count=e.count,this.boundingBox=e.boundingBox===null?null:e.boundingBox.clone(),this.boundingSphere=e.boundingSphere===null?null:e.boundingSphere.clone(),this}getColorAt(e,t){return this.instanceColor===null?t.setRGB(1,1,1):t.fromArray(this.instanceColor.array,e*3)}getMatrixAt(e,t){return t.fromArray(this.instanceMatrix.array,e*16)}getMorphAt(e,t){let n=t.morphTargetInfluences,r=this.morphTexture.source.data.data,i=e*(n.length+1)+1;for(let e=0;e<n.length;e++)n[e]=r[i+e]}raycast(e,t){let n=this.matrixWorld,r=this.count;if(Di.geometry=this.geometry,Di.material=this.material,Di.material!==void 0&&(this.boundingSphere===null&&this.computeBoundingSphere(),Oi.copy(this.boundingSphere),Oi.applyMatrix4(n),e.ray.intersectsSphere(Oi)!==!1))for(let i=0;i<r;i++){this.getMatrixAt(i,Si),Ci.multiplyMatrices(n,Si),Di.matrixWorld=Ci,Di.raycast(e,wi);for(let e=0,n=wi.length;e<n;e++){let n=wi[e];n.instanceId=i,n.object=this,t.push(n)}wi.length=0}}setColorAt(e,t){return this.instanceColor===null&&(this.instanceColor=new xi(new Float32Array(this.instanceMatrix.count*3).fill(1),3)),t.toArray(this.instanceColor.array,e*3),this}setMatrixAt(e,t){return t.toArray(this.instanceMatrix.array,e*16),this}setMorphAt(e,t){let n=t.morphTargetInfluences,r=n.length+1;this.morphTexture===null&&(this.morphTexture=new _i(new Float32Array(r*this.count),r,this.count,O,g));let i=this.morphTexture.source.data.data,a=0;for(let e=0;e<n.length;e++)a+=n[e];let o=this.geometry.morphTargetsRelative?1:1-a,s=r*e;return i[s]=o,i.set(n,s+1),this}updateMorphTargets(){}dispose(){super.dispose(),this.instanceMatrix.dispose(),this.instanceColor!==null&&this.instanceColor.dispose(),this.morphTexture!==null&&(this.morphTexture.dispose(),this.morphTexture=null)}},Ai=new xr,ji=new q(.5,.5),Mi=new J,Ni=class{constructor(e=new Lr,t=new Lr,n=new Lr,r=new Lr,i=new Lr,a=new Lr){this.planes=[e,t,n,r,i,a]}set(e,t,n,r,i,a){let o=this.planes;return o[0].copy(e),o[1].copy(t),o[2].copy(n),o[3].copy(r),o[4].copy(i),o[5].copy(a),this}copy(e){let t=this.planes;for(let n=0;n<6;n++)t[n].copy(e.planes[n]);return this}setFromProjectionMatrix(e,t=We,n=!1){let r=this.planes,i=e.elements,a=i[0],o=i[1],s=i[2],c=i[3],l=i[4],u=i[5],d=i[6],f=i[7],p=i[8],m=i[9],h=i[10],g=i[11],_=i[12],v=i[13],y=i[14],b=i[15];if(r[0].setComponents(c-a,f-l,g-p,b-_).normalize(),r[1].setComponents(c+a,f+l,g+p,b+_).normalize(),r[2].setComponents(c+o,f+u,g+m,b+v).normalize(),r[3].setComponents(c-o,f-u,g-m,b-v).normalize(),n)r[4].setComponents(s,d,h,y).normalize(),r[5].setComponents(c-s,f-d,g-h,b-y).normalize();else if(r[4].setComponents(c-s,f-d,g-h,b-y).normalize(),t===2e3)r[5].setComponents(c+s,f+d,g+h,b+y).normalize();else if(t===2001)r[5].setComponents(s,d,h,y).normalize();else throw Error(`THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: `+t);return this}intersectsObject(e){if(e.boundingSphere!==void 0)e.boundingSphere===null&&e.computeBoundingSphere(),Ai.copy(e.boundingSphere).applyMatrix4(e.matrixWorld);else{let t=e.geometry;t.boundingSphere===null&&t.computeBoundingSphere(),Ai.copy(t.boundingSphere).applyMatrix4(e.matrixWorld)}return this.intersectsSphere(Ai)}intersectsSprite(e){return Ai.center.set(0,0,0),Ai.radius=.7071067811865476+ji.distanceTo(e.center),Ai.applyMatrix4(e.matrixWorld),this.intersectsSphere(Ai)}intersectsSphere(e){let t=this.planes,n=e.center,r=-e.radius;for(let e=0;e<6;e++)if(t[e].distanceToPoint(n)<r)return!1;return!0}intersectsBox(e){let t=this.planes;for(let n=0;n<6;n++){let r=t[n];if(Mi.x=r.normal.x>0?e.max.x:e.min.x,Mi.y=r.normal.y>0?e.max.y:e.min.y,Mi.z=r.normal.z>0?e.max.z:e.min.z,r.distanceToPoint(Mi)<0)return!1}return!0}containsPoint(e){let t=this.planes;for(let n=0;n<6;n++)if(t[n].distanceToPoint(e)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}},Pi=new Y,Fi=class e{constructor(){this.coordinateSystem=We,this._frustums=[],this._count=0}setFromArrayCamera(e){let t=e.cameras,n=this._frustums;for(let e=0;e<t.length;e++){let r=t[e];Pi.multiplyMatrices(r.projectionMatrix,r.matrixWorldInverse),n[e]===void 0&&(n[e]=new Ni),n[e].setFromProjectionMatrix(Pi,r.coordinateSystem,r.reversedDepth)}return this._count=t.length,this}getFrustum(e){return this._frustums[e]}intersectsObject(e){let t=this._frustums;for(let n=0;n<this._count;n++)if(t[n].intersectsObject(e))return!0;return!1}intersectsSprite(e){let t=this._frustums;for(let n=0;n<this._count;n++)if(t[n].intersectsSprite(e))return!0;return!1}intersectsSphere(e){let t=this._frustums;for(let n=0;n<this._count;n++)if(t[n].intersectsSphere(e))return!0;return!1}intersectsBox(e){let t=this._frustums;for(let n=0;n<this._count;n++)if(t[n].intersectsBox(e))return!0;return!1}containsPoint(e){let t=this._frustums;for(let n=0;n<this._count;n++)if(t[n].containsPoint(e))return!0;return!1}copy(e){this.coordinateSystem=e.coordinateSystem;let t=this._frustums,n=e._frustums;for(let r=0;r<e._count;r++)t[r]===void 0&&(t[r]=new Ni),t[r].copy(n[r]);return this._count=e._count,this}clone(){return new e().copy(this)}},Ii=class extends zr{constructor(e){super(),this.isLineBasicMaterial=!0,this.type=`LineBasicMaterial`,this.color=new X(16777215),this.map=null,this.linewidth=1,this.linecap=`round`,this.linejoin=`round`,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.linewidth=e.linewidth,this.linecap=e.linecap,this.linejoin=e.linejoin,this.fog=e.fog,this}},Li=new J,Ri=new J,zi=new Y,Bi=new Wr,Vi=new xr,Hi=new J,Ui=new J,Wi=class extends Dn{constructor(e=new kr,t=new Ii){super(),this.isLine=!0,this.type=`Line`,this.geometry=e,this.material=t,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),this.morphTargetInfluences=e.morphTargetInfluences===void 0?void 0:e.morphTargetInfluences.slice(),this.morphTargetDictionary=e.morphTargetDictionary===void 0?void 0:Object.assign({},e.morphTargetDictionary),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}computeLineDistances(){let e=this.geometry;if(e.index===null){let t=e.attributes.position,n=[0];for(let e=1,r=t.count;e<r;e++)Li.fromBufferAttribute(t,e-1),Ri.fromBufferAttribute(t,e),n[e]=n[e-1],n[e]+=Li.distanceTo(Ri);e.setAttribute(`lineDistance`,new Z(n,1))}else G(`Line.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.`);return this}intersectsFrustum(e){return e.intersectsObject(this)}raycast(e,t){let n=this.geometry,r=this.matrixWorld,i=e.params.Line.threshold,a=n.drawRange;if(n.boundingSphere===null&&n.computeBoundingSphere(),Vi.copy(n.boundingSphere),Vi.applyMatrix4(r),Vi.radius+=i,e.ray.intersectsSphere(Vi)===!1)return;zi.copy(r).invert(),Bi.copy(e.ray).applyMatrix4(zi);let o=i/((this.scale.x+this.scale.y+this.scale.z)/3),s=o*o,c=this.isLineSegments?2:1,l=n.index,u=n.attributes.position;if(l!==null){let n=Math.max(0,a.start),r=Math.min(l.count,a.start+a.count);for(let i=n,a=r-1;i<a;i+=c){let n=l.getX(i),r=l.getX(i+1),a=Gi(this,e,Bi,s,n,r,i);a&&t.push(a)}if(this.isLineLoop){let i=l.getX(r-1),a=l.getX(n),o=Gi(this,e,Bi,s,i,a,r-1);o&&t.push(o)}}else{let n=Math.max(0,a.start),r=Math.min(u.count,a.start+a.count);for(let i=n,a=r-1;i<a;i+=c){let n=Gi(this,e,Bi,s,i,i+1,i);n&&t.push(n)}if(this.isLineLoop){let i=Gi(this,e,Bi,s,r-1,n,r-1);i&&t.push(i)}}}updateMorphTargets(){let e=this.geometry.morphAttributes,t=Object.keys(e);if(t.length>0){let n=e[t[0]];if(n!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let e=0,t=n.length;e<t;e++){let t=n[e].name||String(e);this.morphTargetInfluences.push(0),this.morphTargetDictionary[t]=e}}}}};function Gi(e,t,n,r,i,a,o){let s=e.geometry.attributes.position;if(Li.fromBufferAttribute(s,i),Ri.fromBufferAttribute(s,a),n.distanceSqToSegment(Li,Ri,Hi,Ui)>r)return;Hi.applyMatrix4(e.matrixWorld);let c=t.ray.origin.distanceTo(Hi);if(!(c<t.near||c>t.far))return{distance:c,point:Ui.clone().applyMatrix4(e.matrixWorld),index:o,face:null,faceIndex:null,barycoord:null,object:e}}var Ki=new J,qi=new J,Ji=class extends Wi{constructor(e,t){super(e,t),this.isLineSegments=!0,this.type=`LineSegments`}computeLineDistances(){let e=this.geometry;if(e.index===null){let t=e.attributes.position,n=[];for(let e=0,r=t.count;e<r;e+=2)Ki.fromBufferAttribute(t,e),qi.fromBufferAttribute(t,e+1),n[e]=e===0?0:n[e-1],n[e+1]=n[e]+Ki.distanceTo(qi);e.setAttribute(`lineDistance`,new Z(n,1))}else G(`LineSegments.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.`);return this}},Yi=class extends Wi{constructor(e,t){super(e,t),this.isLineLoop=!0,this.type=`LineLoop`}},Xi=class extends zr{constructor(e){super(),this.isPointsMaterial=!0,this.type=`PointsMaterial`,this.color=new X(16777215),this.map=null,this.alphaMap=null,this.size=1,this.sizeAttenuation=!0,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.alphaMap=e.alphaMap,this.size=e.size,this.sizeAttenuation=e.sizeAttenuation,this.fog=e.fog,this}},Zi=new Y,Qi=new Wr,$i=new xr,ea=new J,ta=class extends Dn{constructor(e=new kr,t=new Xi){super(),this.isPoints=!0,this.type=`Points`,this.geometry=e,this.material=t,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),this.morphTargetInfluences=e.morphTargetInfluences===void 0?void 0:e.morphTargetInfluences.slice(),this.morphTargetDictionary=e.morphTargetDictionary===void 0?void 0:Object.assign({},e.morphTargetDictionary),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}intersectsFrustum(e){return e.intersectsObject(this)}raycast(e,t){let n=this.geometry,r=this.matrixWorld,i=e.params.Points.threshold,a=n.drawRange;if(n.boundingSphere===null&&n.computeBoundingSphere(),$i.copy(n.boundingSphere),$i.applyMatrix4(r),$i.radius+=i,e.ray.intersectsSphere($i)===!1)return;Zi.copy(r).invert(),Qi.copy(e.ray).applyMatrix4(Zi);let o=i/((this.scale.x+this.scale.y+this.scale.z)/3),s=o*o,c=n.index,l=n.attributes.position;if(c!==null){let n=Math.max(0,a.start),i=Math.min(c.count,a.start+a.count);for(let a=n,o=i;a<o;a++){let n=c.getX(a);ea.fromBufferAttribute(l,n),na(ea,n,s,r,e,t,this)}}else{let n=Math.max(0,a.start),i=Math.min(l.count,a.start+a.count);for(let a=n,o=i;a<o;a++)ea.fromBufferAttribute(l,a),na(ea,a,s,r,e,t,this)}}updateMorphTargets(){let e=this.geometry.morphAttributes,t=Object.keys(e);if(t.length>0){let n=e[t[0]];if(n!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let e=0,t=n.length;e<t;e++){let t=n[e].name||String(e);this.morphTargetInfluences.push(0),this.morphTargetDictionary[t]=e}}}}};function na(e,t,n,r,i,a,o){let s=Qi.distanceSqToPoint(e);if(s<n){let n=new J;Qi.closestPointToPoint(e,n),n.applyMatrix4(r);let c=i.ray.origin.distanceTo(n);if(c<i.near||c>i.far)return;a.push({distance:c,distanceToRay:Math.sqrt(s),point:n,index:t,face:null,faceIndex:null,barycoord:null,object:o})}}var ra=class extends Jt{constructor(e=[],t=301,n,r,i,a,o,s,c,l){super(e,t,n,r,i,a,o,s,c,l),this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(e){this.image=e}},ia=class extends Jt{constructor(e,t,n,r,i,a,o,s,c){super(e,t,n,r,i,a,o,s,c),this.isCanvasTexture=!0,this.needsUpdate=!0}},aa=class extends Jt{constructor(e,t,n=h,r,a,o,s=i,c=i,l,u=E,d=1){if(u!==1026&&u!==1027)throw Error(`THREE.DepthTexture: format must be either THREE.DepthFormat or THREE.DepthStencilFormat`);super({width:e,height:t,depth:d},r,a,o,s,c,u,n,l),this.isDepthTexture=!0,this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(e){return super.copy(e),this.source=new Wt(Object.assign({},e.image)),this.compareFunction=e.compareFunction,this}toJSON(e){let t=super.toJSON(e);return t.compareFunction=this.compareFunction,t}},oa=class extends aa{constructor(e,t=h,n=301,r,a,o=i,s=i,c,l=E){let u={width:e,height:e,depth:1},d=[u,u,u,u,u,u];super(e,e,t,n,r,a,o,s,c,l),this.image=d,this.isCubeDepthTexture=!0,this.isCubeTexture=!0}get images(){return this.image}set images(e){this.image=e}},sa=class extends Jt{constructor(e=null){super(),this.sourceTexture=e,this.isExternalTexture=!0}copy(e){return super.copy(e),this.sourceTexture=e.sourceTexture,this}},ca=class e extends kr{constructor(e=1,t=1,n=1,r=1,i=1,a=1){super(),this.type=`BoxGeometry`,this.parameters={width:e,height:t,depth:n,widthSegments:r,heightSegments:i,depthSegments:a};let o=this;r=Math.floor(r),i=Math.floor(i),a=Math.floor(a);let s=[],c=[],l=[],u=[],d=0,f=0;p(`z`,`y`,`x`,-1,-1,n,t,e,a,i,0),p(`z`,`y`,`x`,1,-1,n,t,-e,a,i,1),p(`x`,`z`,`y`,1,1,e,n,t,r,a,2),p(`x`,`z`,`y`,1,-1,e,n,-t,r,a,3),p(`x`,`y`,`z`,1,-1,e,t,n,r,i,4),p(`x`,`y`,`z`,-1,-1,e,t,-n,r,i,5),this.setIndex(s),this.setAttribute(`position`,new Z(c,3)),this.setAttribute(`normal`,new Z(l,3)),this.setAttribute(`uv`,new Z(u,2));function p(e,t,n,r,i,a,p,m,h,g,_){let v=a/h,y=p/g,b=a/2,x=p/2,S=m/2,C=h+1,w=g+1,T=0,E=0,D=new J;for(let a=0;a<w;a++){let o=a*y-x;for(let s=0;s<C;s++)D[e]=(s*v-b)*r,D[t]=o*i,D[n]=S,c.push(D.x,D.y,D.z),D[e]=0,D[t]=0,D[n]=m>0?1:-1,l.push(D.x,D.y,D.z),u.push(s/h),u.push(1-a/g),T+=1}for(let e=0;e<g;e++)for(let t=0;t<h;t++){let n=d+t+C*e,r=d+t+C*(e+1),i=d+(t+1)+C*(e+1),a=d+(t+1)+C*e;s.push(n,r,a),s.push(r,i,a),E+=6}o.addGroup(f,E,_),f+=E,d+=T}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(t){return new e(t.width,t.height,t.depth,t.widthSegments,t.heightSegments,t.depthSegments)}},la=class e extends kr{constructor(e=1,t=1,n=4,r=8,i=1){super(),this.type=`CapsuleGeometry`,this.parameters={radius:e,height:t,capSegments:n,radialSegments:r,heightSegments:i},t=Math.max(0,t),n=Math.max(1,Math.floor(n)),r=Math.max(3,Math.floor(r)),i=Math.max(1,Math.floor(i));let a=[],o=[],s=[],c=[],l=t/2,u=Math.PI/2*e,d=t,f=2*u+d,p=n*2+i,m=r+1,h=new J,g=new J;for(let _=0;_<=p;_++){let v=0,y=0,b=0,x=0;if(_<=n){let t=_/n,r=t*Math.PI/2;y=-l-e*Math.cos(r),b=e*Math.sin(r),x=-e*Math.cos(r),v=t*u}else if(_<=n+i){let r=(_-n)/i;y=-l+r*t,b=e,x=0,v=u+r*d}else{let t=(_-n-i)/n,r=t*Math.PI/2;y=l+e*Math.sin(r),b=e*Math.cos(r),x=e*Math.sin(r),v=u+d+t*u}let S=Math.max(0,Math.min(1,v/f)),C=0;_===0?C=.5/r:_===p&&(C=-.5/r);for(let e=0;e<=r;e++){let t=e/r,n=t*Math.PI*2,i=Math.sin(n),a=Math.cos(n);g.x=-b*a,g.y=y,g.z=b*i,o.push(g.x,g.y,g.z),h.set(-b*a,x,b*i),h.normalize(),s.push(h.x,h.y,h.z),c.push(t+C,S)}if(_>0){let e=(_-1)*m;for(let t=0;t<r;t++){let n=e+t,r=e+t+1,i=_*m+t,o=_*m+t+1;a.push(n,r,i),a.push(r,o,i)}}}this.setIndex(a),this.setAttribute(`position`,new Z(o,3)),this.setAttribute(`normal`,new Z(s,3)),this.setAttribute(`uv`,new Z(c,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(t){return new e(t.radius,t.height,t.capSegments,t.radialSegments,t.heightSegments)}},ua=class e extends kr{constructor(e=1,t=1,n=1,r=32,i=1,a=!1,o=0,s=Math.PI*2){super(),this.type=`CylinderGeometry`,this.parameters={radiusTop:e,radiusBottom:t,height:n,radialSegments:r,heightSegments:i,openEnded:a,thetaStart:o,thetaLength:s};let c=this;r=Math.floor(r),i=Math.floor(i);let l=[],u=[],d=[],f=[],p=0,m=[],h=n/2,g=0;_(),a===!1&&(e>0&&v(!0),t>0&&v(!1)),this.setIndex(l),this.setAttribute(`position`,new Z(u,3)),this.setAttribute(`normal`,new Z(d,3)),this.setAttribute(`uv`,new Z(f,2));function _(){let a=new J,_=new J,v=0,y=(t-e)/n;for(let c=0;c<=i;c++){let l=[],g=c/i,v=g*(t-e)+e;for(let e=0;e<=r;e++){let t=e/r,i=t*s+o,c=Math.sin(i),m=Math.cos(i);_.x=v*c,_.y=-g*n+h,_.z=v*m,u.push(_.x,_.y,_.z),a.set(c,y,m).normalize(),d.push(a.x,a.y,a.z),f.push(t,1-g),l.push(p++)}m.push(l)}for(let n=0;n<r;n++)for(let r=0;r<i;r++){let a=m[r][n],o=m[r+1][n],s=m[r+1][n+1],c=m[r][n+1];(e>0||r!==0)&&(l.push(a,o,c),v+=3),(t>0||r!==i-1)&&(l.push(o,s,c),v+=3)}c.addGroup(g,v,0),g+=v}function v(n){let i=p,a=new q,m=new J,_=0,v=n===!0?e:t,y=n===!0?1:-1;for(let e=1;e<=r;e++)u.push(0,h*y,0),d.push(0,y,0),f.push(.5,.5),p++;let b=p;for(let e=0;e<=r;e++){let t=e/r*s+o,n=Math.cos(t),i=Math.sin(t);m.x=v*i,m.y=h*y,m.z=v*n,u.push(m.x,m.y,m.z),d.push(0,y,0),a.x=n*.5+.5,a.y=i*.5*y+.5,f.push(a.x,a.y),p++}for(let e=0;e<r;e++){let t=i+e,r=b+e;n===!0?l.push(r,r+1,t):l.push(r+1,r,t),_+=3}c.addGroup(g,_,n===!0?1:2),g+=_}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(t){return new e(t.radiusTop,t.radiusBottom,t.height,t.radialSegments,t.heightSegments,t.openEnded,t.thetaStart,t.thetaLength)}},da=class e extends ua{constructor(e=1,t=1,n=32,r=1,i=!1,a=0,o=Math.PI*2){super(0,e,t,n,r,i,a,o),this.type=`ConeGeometry`,this.parameters={radius:e,height:t,radialSegments:n,heightSegments:r,openEnded:i,thetaStart:a,thetaLength:o}}static fromJSON(t){return new e(t.radius,t.height,t.radialSegments,t.heightSegments,t.openEnded,t.thetaStart,t.thetaLength)}},fa=class e extends kr{constructor(e=[],t=[],n=1,r=0){super(),this.type=`PolyhedronGeometry`,this.parameters={vertices:e,indices:t,radius:n,detail:r};let i=[],a=[];o(r),c(n),l(),this.setAttribute(`position`,new Z(i,3)),this.setAttribute(`normal`,new Z(i.slice(),3)),this.setAttribute(`uv`,new Z(a,2)),r===0?this.computeVertexNormals():this.normalizeNormals();function o(e){let n=new J,r=new J,i=new J;for(let a=0;a<t.length;a+=3)f(t[a+0],n),f(t[a+1],r),f(t[a+2],i),s(n,r,i,e)}function s(e,t,n,r){let i=r+1,a=[];for(let r=0;r<=i;r++){a[r]=[];let o=e.clone().lerp(n,r/i),s=t.clone().lerp(n,r/i),c=i-r;for(let e=0;e<=c;e++)e===0&&r===i?a[r][e]=o:a[r][e]=o.clone().lerp(s,e/c)}for(let e=0;e<i;e++)for(let t=0;t<2*(i-e)-1;t++){let n=Math.floor(t/2);t%2==0?(d(a[e][n+1]),d(a[e+1][n]),d(a[e][n])):(d(a[e][n+1]),d(a[e+1][n+1]),d(a[e+1][n]))}}function c(e){let t=new J;for(let n=0;n<i.length;n+=3)t.x=i[n+0],t.y=i[n+1],t.z=i[n+2],t.normalize().multiplyScalar(e),i[n+0]=t.x,i[n+1]=t.y,i[n+2]=t.z}function l(){let e=new J;for(let t=0;t<i.length;t+=3){e.x=i[t+0],e.y=i[t+1],e.z=i[t+2];let n=h(e)/2/Math.PI+.5,r=g(e)/Math.PI+.5;a.push(n,1-r)}p(),u()}function u(){for(let e=0;e<a.length;e+=6){let t=a[e+0],n=a[e+2],r=a[e+4];Math.max(t,n,r)>.9&&Math.min(t,n,r)<.1&&(t<.2&&(a[e+0]+=1),n<.2&&(a[e+2]+=1),r<.2&&(a[e+4]+=1))}}function d(e){i.push(e.x,e.y,e.z)}function f(t,n){let r=t*3;n.x=e[r+0],n.y=e[r+1],n.z=e[r+2]}function p(){let e=new J,t=new J,n=new J,r=new J,o=new q,s=new q,c=new q;for(let l=0,u=0;l<i.length;l+=9,u+=6){e.set(i[l+0],i[l+1],i[l+2]),t.set(i[l+3],i[l+4],i[l+5]),n.set(i[l+6],i[l+7],i[l+8]),o.set(a[u+0],a[u+1]),s.set(a[u+2],a[u+3]),c.set(a[u+4],a[u+5]),r.copy(e).add(t).add(n).divideScalar(3);let d=h(r);m(o,u+0,e,d),m(s,u+2,t,d),m(c,u+4,n,d)}}function m(e,t,n,r){r<0&&e.x===1&&(a[t]=e.x-1),n.x===0&&n.z===0&&(a[t]=r/2/Math.PI+.5)}function h(e){return Math.atan2(e.z,-e.x)}function g(e){return Math.atan2(-e.y,Math.sqrt(e.x*e.x+e.z*e.z))}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(t){return new e(t.vertices,t.indices,t.radius,t.detail)}};function pa(e,t,n=2){let r=t&&t.length,i=r?t[0]*n:e.length,a=ma(e,0,i,n,!0),o=[];if(!a||a.next===a.prev)return o;let s,c,l;if(r&&(a=xa(e,t,a,n)),e.length>80*n){s=e[0],c=e[1];let t=s,r=c;for(let a=n;a<i;a+=n){let n=e[a],i=e[a+1];n<s&&(s=n),i<c&&(c=i),n>t&&(t=n),i>r&&(r=i)}l=Math.max(t-s,r-c),l=l===0?0:32767/l}return ga(a,o,n,s,c,l,0),o}function ma(e,t,n,r,i){let a;if(i===Ga(e,t,n,r)>0)for(let i=t;i<n;i+=r)a=Ha(i/r|0,e[i],e[i+1],a);else for(let i=n-r;i>=t;i-=r)a=Ha(i/r|0,e[i],e[i+1],a);return a&&Pa(a,a.next)&&(Ua(a),a=a.next),a}function ha(e,t){if(!e)return e;t||=e;let n=e,r;do if(r=!1,!n.steiner&&(Pa(n,n.next)||Na(n.prev,n,n.next)===0)){if(Ua(n),n=t=n.prev,n===n.next)break;r=!0}else n=n.next;while(r||n!==t);return t}function ga(e,t,n,r,i,a,o){if(!e)return;!o&&a&&Ea(e,r,i,a);let s=e;for(;e.prev!==e.next;){let c=e.prev,l=e.next;if(a?va(e,r,i,a):_a(e))t.push(c.i,e.i,l.i),Ua(e),e=l.next,s=l.next;else if(e=l,e===s){o?o===1?(e=ya(ha(e),t),ga(e,t,n,r,i,a,2)):o===2&&ba(e,t,n,r,i,a):ga(ha(e),t,n,r,i,a,1);break}}}function _a(e){let t=e.prev,n=e,r=e.next;if(Na(t,n,r)>=0)return!1;let i=t.x,a=n.x,o=r.x,s=t.y,c=n.y,l=r.y,u=Math.min(i,a,o),d=Math.min(s,c,l),f=Math.max(i,a,o),p=Math.max(s,c,l),m=r.next;for(;m!==t;){if(m.x>=u&&m.x<=f&&m.y>=d&&m.y<=p&&ja(i,s,a,c,o,l,m.x,m.y)&&Na(m.prev,m,m.next)>=0)return!1;m=m.next}return!0}function va(e,t,n,r){let i=e.prev,a=e,o=e.next;if(Na(i,a,o)>=0)return!1;let s=i.x,c=a.x,l=o.x,u=i.y,d=a.y,f=o.y,p=Math.min(s,c,l),m=Math.min(u,d,f),h=Math.max(s,c,l),g=Math.max(u,d,f),_=Oa(p,m,t,n,r),v=Oa(h,g,t,n,r),y=e.prevZ,b=e.nextZ;for(;y&&y.z>=_&&b&&b.z<=v;){if(y.x>=p&&y.x<=h&&y.y>=m&&y.y<=g&&y!==i&&y!==o&&ja(s,u,c,d,l,f,y.x,y.y)&&Na(y.prev,y,y.next)>=0||(y=y.prevZ,b.x>=p&&b.x<=h&&b.y>=m&&b.y<=g&&b!==i&&b!==o&&ja(s,u,c,d,l,f,b.x,b.y)&&Na(b.prev,b,b.next)>=0))return!1;b=b.nextZ}for(;y&&y.z>=_;){if(y.x>=p&&y.x<=h&&y.y>=m&&y.y<=g&&y!==i&&y!==o&&ja(s,u,c,d,l,f,y.x,y.y)&&Na(y.prev,y,y.next)>=0)return!1;y=y.prevZ}for(;b&&b.z<=v;){if(b.x>=p&&b.x<=h&&b.y>=m&&b.y<=g&&b!==i&&b!==o&&ja(s,u,c,d,l,f,b.x,b.y)&&Na(b.prev,b,b.next)>=0)return!1;b=b.nextZ}return!0}function ya(e,t){let n=e;do{let r=n.prev,i=n.next.next;!Pa(r,i)&&Fa(r,n,n.next,i)&&za(r,i)&&za(i,r)&&(t.push(r.i,n.i,i.i),Ua(n),Ua(n.next),n=e=i),n=n.next}while(n!==e);return ha(n)}function ba(e,t,n,r,i,a){let o=e;do{let e=o.next.next;for(;e!==o.prev;){if(o.i!==e.i&&Ma(o,e)){let s=Va(o,e);o=ha(o,o.next),s=ha(s,s.next),ga(o,t,n,r,i,a,0),ga(s,t,n,r,i,a,0);return}e=e.next}o=o.next}while(o!==e)}function xa(e,t,n,r){let i=[];for(let n=0,a=t.length;n<a;n++){let o=ma(e,t[n]*r,n<a-1?t[n+1]*r:e.length,r,!1);o===o.next&&(o.steiner=!0),i.push(ka(o))}i.sort(Sa);for(let e=0;e<i.length;e++)n=Ca(i[e],n);return n}function Sa(e,t){let n=e.x-t.x;return n===0&&(n=e.y-t.y,n===0&&(n=(e.next.y-e.y)/(e.next.x-e.x)-(t.next.y-t.y)/(t.next.x-t.x))),n}function Ca(e,t){let n=wa(e,t);if(!n)return t;let r=Va(n,e);return ha(r,r.next),ha(n,n.next)}function wa(e,t){let n=t,r=e.x,i=e.y,a=-1/0,o;if(Pa(e,n))return n;do{if(Pa(e,n.next))return n.next;if(i<=n.y&&i>=n.next.y&&n.next.y!==n.y){let e=n.x+(i-n.y)*(n.next.x-n.x)/(n.next.y-n.y);if(e<=r&&e>a&&(a=e,o=n.x<n.next.x?n:n.next,e===r))return o}n=n.next}while(n!==t);if(!o)return null;let s=o,c=o.x,l=o.y,u=1/0;n=o;do{if(r>=n.x&&n.x>=c&&r!==n.x&&Aa(i<l?r:a,i,c,l,i<l?a:r,i,n.x,n.y)){let t=Math.abs(i-n.y)/(r-n.x);za(n,e)&&(t<u||t===u&&(n.x>o.x||n.x===o.x&&Ta(o,n)))&&(o=n,u=t)}n=n.next}while(n!==s);return o}function Ta(e,t){return Na(e.prev,e,t.prev)<0&&Na(t.next,e,e.next)<0}function Ea(e,t,n,r){let i=e;do i.z===0&&(i.z=Oa(i.x,i.y,t,n,r)),i.prevZ=i.prev,i.nextZ=i.next,i=i.next;while(i!==e);i.prevZ.nextZ=null,i.prevZ=null,Da(i)}function Da(e){let t,n=1;do{let r=e,i;e=null;let a=null;for(t=0;r;){t++;let o=r,s=0;for(let e=0;e<n&&(s++,o=o.nextZ,o);e++);let c=n;for(;s>0||c>0&&o;)s!==0&&(c===0||!o||r.z<=o.z)?(i=r,r=r.nextZ,s--):(i=o,o=o.nextZ,c--),a?a.nextZ=i:e=i,i.prevZ=a,a=i;r=o}a.nextZ=null,n*=2}while(t>1);return e}function Oa(e,t,n,r,i){return e=(e-n)*i|0,t=(t-r)*i|0,e=(e|e<<8)&16711935,e=(e|e<<4)&252645135,e=(e|e<<2)&858993459,e=(e|e<<1)&1431655765,t=(t|t<<8)&16711935,t=(t|t<<4)&252645135,t=(t|t<<2)&858993459,t=(t|t<<1)&1431655765,e|t<<1}function ka(e){let t=e,n=e;do(t.x<n.x||t.x===n.x&&t.y<n.y)&&(n=t),t=t.next;while(t!==e);return n}function Aa(e,t,n,r,i,a,o,s){return(i-o)*(t-s)>=(e-o)*(a-s)&&(e-o)*(r-s)>=(n-o)*(t-s)&&(n-o)*(a-s)>=(i-o)*(r-s)}function ja(e,t,n,r,i,a,o,s){return(e!==o||t!==s)&&Aa(e,t,n,r,i,a,o,s)}function Ma(e,t){return e.next.i!==t.i&&e.prev.i!==t.i&&!Ra(e,t)&&(za(e,t)&&za(t,e)&&Ba(e,t)&&(Na(e.prev,e,t.prev)||Na(e,t.prev,t))||Pa(e,t)&&Na(e.prev,e,e.next)>0&&Na(t.prev,t,t.next)>0)}function Na(e,t,n){return(t.y-e.y)*(n.x-t.x)-(t.x-e.x)*(n.y-t.y)}function Pa(e,t){return e.x===t.x&&e.y===t.y}function Fa(e,t,n,r){let i=La(Na(e,t,n)),a=La(Na(e,t,r)),o=La(Na(n,r,e)),s=La(Na(n,r,t));return!!(i!==a&&o!==s||i===0&&Ia(e,n,t)||a===0&&Ia(e,r,t)||o===0&&Ia(n,e,r)||s===0&&Ia(n,t,r))}function Ia(e,t,n){return t.x<=Math.max(e.x,n.x)&&t.x>=Math.min(e.x,n.x)&&t.y<=Math.max(e.y,n.y)&&t.y>=Math.min(e.y,n.y)}function La(e){return e>0?1:e<0?-1:0}function Ra(e,t){let n=e;do{if(n.i!==e.i&&n.next.i!==e.i&&n.i!==t.i&&n.next.i!==t.i&&Fa(n,n.next,e,t))return!0;n=n.next}while(n!==e);return!1}function za(e,t){return Na(e.prev,e,e.next)<0?Na(e,t,e.next)>=0&&Na(e,e.prev,t)>=0:Na(e,t,e.prev)<0||Na(e,e.next,t)<0}function Ba(e,t){let n=e,r=!1,i=(e.x+t.x)/2,a=(e.y+t.y)/2;do n.y>a!=n.next.y>a&&n.next.y!==n.y&&i<(n.next.x-n.x)*(a-n.y)/(n.next.y-n.y)+n.x&&(r=!r),n=n.next;while(n!==e);return r}function Va(e,t){let n=Wa(e.i,e.x,e.y),r=Wa(t.i,t.x,t.y),i=e.next,a=t.prev;return e.next=t,t.prev=e,n.next=i,i.prev=n,r.next=n,n.prev=r,a.next=r,r.prev=a,r}function Ha(e,t,n,r){let i=Wa(e,t,n);return r?(i.next=r.next,i.prev=r,r.next.prev=i,r.next=i):(i.prev=i,i.next=i),i}function Ua(e){e.next.prev=e.prev,e.prev.next=e.next,e.prevZ&&(e.prevZ.nextZ=e.nextZ),e.nextZ&&(e.nextZ.prevZ=e.prevZ)}function Wa(e,t,n){return{i:e,x:t,y:n,prev:null,next:null,z:0,prevZ:null,nextZ:null,steiner:!1}}function Ga(e,t,n,r){let i=0;for(let a=t,o=n-r;a<n;a+=r)i+=(e[o]-e[a])*(e[a+1]+e[o+1]),o=a;return i}var Ka=class{static triangulate(e,t,n=2){return pa(e,t,n)}},qa=class e{static area(e){let t=e.length,n=0;for(let r=t-1,i=0;i<t;r=i++)n+=e[r].x*e[i].y-e[i].x*e[r].y;return n*.5}static isClockWise(t){return e.area(t)<0}static triangulateShape(e,t){let n=[],r=[],i=[];Ja(e),Ya(n,e);let a=e.length;t.forEach(Ja);for(let e=0;e<t.length;e++)r.push(a),a+=t[e].length,Ya(n,t[e]);let o=Ka.triangulate(n,r);for(let e=0;e<o.length;e+=3)i.push(o.slice(e,e+3));return i}};function Ja(e){let t=e.length;t>2&&e[t-1].equals(e[0])&&e.pop()}function Ya(e,t){for(let n=0;n<t.length;n++)e.push(t[n].x),e.push(t[n].y)}var Xa=class e extends fa{constructor(e=1,t=0){let n=(1+Math.sqrt(5))/2,r=[-1,n,0,1,n,0,-1,-n,0,1,-n,0,0,-1,n,0,1,n,0,-1,-n,0,1,-n,n,0,-1,n,0,1,-n,0,-1,-n,0,1];super(r,[0,11,5,0,5,1,0,1,7,0,7,10,0,10,11,1,5,9,5,11,4,11,10,2,10,7,6,7,1,8,3,9,4,3,4,2,3,2,6,3,6,8,3,8,9,4,9,5,2,4,11,6,2,10,8,6,7,9,8,1],e,t),this.type=`IcosahedronGeometry`,this.parameters={radius:e,detail:t}}static fromJSON(t){return new e(t.radius,t.detail)}},Za=class e extends kr{constructor(e=1,t=1,n=1,r=1){super(),this.type=`PlaneGeometry`,this.parameters={width:e,height:t,widthSegments:n,heightSegments:r};let i=e/2,a=t/2,o=Math.floor(n),s=Math.floor(r),c=o+1,l=s+1,u=e/o,d=t/s,f=[],p=[],m=[],h=[];for(let e=0;e<l;e++){let t=e*d-a;for(let n=0;n<c;n++){let r=n*u-i;p.push(r,-t,0),m.push(0,0,1),h.push(n/o),h.push(1-e/s)}}for(let e=0;e<s;e++)for(let t=0;t<o;t++){let n=t+c*e,r=t+c*(e+1),i=t+1+c*(e+1),a=t+1+c*e;f.push(n,r,a),f.push(r,i,a)}this.setIndex(f),this.setAttribute(`position`,new Z(p,3)),this.setAttribute(`normal`,new Z(m,3)),this.setAttribute(`uv`,new Z(h,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(t){return new e(t.width,t.height,t.widthSegments,t.heightSegments)}},Qa=class e extends kr{constructor(e=1,t=32,n=16,r=0,i=Math.PI*2,a=0,o=Math.PI){super(),this.type=`SphereGeometry`,this.parameters={radius:e,widthSegments:t,heightSegments:n,phiStart:r,phiLength:i,thetaStart:a,thetaLength:o},t=Math.max(3,Math.floor(t)),n=Math.max(2,Math.floor(n));let s=Math.min(a+o,Math.PI),c=0,l=[],u=new J,d=new J,f=[],p=[],m=[],h=[];for(let f=0;f<=n;f++){let g=[],_=f/n,v=a+_*o,y=e*Math.cos(v),b=Math.sqrt(e*e-y*y),x=0;f===0&&a===0?x=.5/t:f===n&&s===Math.PI&&(x=-.5/t);for(let e=0;e<=t;e++){let n=e/t,a=r+n*i;u.x=-b*Math.cos(a),u.y=y,u.z=b*Math.sin(a),p.push(u.x,u.y,u.z),d.copy(u).normalize(),m.push(d.x,d.y,d.z),h.push(n+x,1-_),g.push(c++)}l.push(g)}for(let e=0;e<n;e++)for(let r=0;r<t;r++){let t=l[e][r+1],i=l[e][r],o=l[e+1][r],c=l[e+1][r+1];(e!==0||a>0)&&f.push(t,i,c),(e!==n-1||s<Math.PI)&&f.push(i,o,c)}this.setIndex(f),this.setAttribute(`position`,new Z(p,3)),this.setAttribute(`normal`,new Z(m,3)),this.setAttribute(`uv`,new Z(h,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(t){return new e(t.radius,t.widthSegments,t.heightSegments,t.phiStart,t.phiLength,t.thetaStart,t.thetaLength)}},$a=class e extends kr{constructor(e=1,t=.4,n=12,r=48,i=Math.PI*2,a=0,o=Math.PI*2){super(),this.type=`TorusGeometry`,this.parameters={radius:e,tube:t,radialSegments:n,tubularSegments:r,arc:i,thetaStart:a,thetaLength:o},n=Math.floor(n),r=Math.floor(r);let s=[],c=[],l=[],u=[],d=new J,f=new J,p=new J;for(let s=0;s<=n;s++){let m=a+s/n*o;for(let a=0;a<=r;a++){let o=a/r*i;f.x=(e+t*Math.cos(m))*Math.cos(o),f.y=(e+t*Math.cos(m))*Math.sin(o),f.z=t*Math.sin(m),c.push(f.x,f.y,f.z),d.x=e*Math.cos(o),d.y=e*Math.sin(o),p.subVectors(f,d).normalize(),l.push(p.x,p.y,p.z),u.push(a/r),u.push(s/n)}}for(let e=1;e<=n;e++)for(let t=1;t<=r;t++){let n=(r+1)*e+t-1,i=(r+1)*(e-1)+t-1,a=(r+1)*(e-1)+t,o=(r+1)*e+t;s.push(n,i,o),s.push(i,a,o)}this.setIndex(s),this.setAttribute(`position`,new Z(c,3)),this.setAttribute(`normal`,new Z(l,3)),this.setAttribute(`uv`,new Z(u,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(t){return new e(t.radius,t.tube,t.radialSegments,t.tubularSegments,t.arc,t.thetaStart,t.thetaLength)}};function eo(e){let t={};for(let n in e){t[n]={};for(let r in e[n]){let i=e[n][r];if(no(i))i.isRenderTargetTexture?(G(`UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms().`),t[n][r]=null):t[n][r]=i.clone();else if(Array.isArray(i)){if(no(i[0])){let e=[];for(let t=0,n=i.length;t<n;t++)e[t]=i[t].clone();t[n][r]=e}else t[n][r]=i.slice()}else t[n][r]=i}}return t}function to(e){let t={};for(let n=0;n<e.length;n++){let r=eo(e[n]);for(let e in r)t[e]=r[e]}return t}function no(e){return e&&(e.isColor||e.isMatrix3||e.isMatrix4||e.isVector2||e.isVector3||e.isVector4||e.isTexture||e.isQuaternion)}function ro(e){let t=[];for(let n=0;n<e.length;n++)t.push(e[n].clone());return t}function io(e){let t=e.getRenderTarget();return t===null?e.outputColorSpace:t.isXRRenderTarget===!0?t.texture.colorSpace:Rt.workingColorSpace}var ao={clone:eo,merge:to},oo=`void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,so=`void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}`,co=class extends zr{constructor(e){super(),this.isShaderMaterial=!0,this.type=`ShaderMaterial`,this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=oo,this.fragmentShader=so,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.forceSinglePass=!0,this.extensions={clipCullDistance:!1,multiDraw:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv1:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,e!==void 0&&this.setValues(e)}copy(e){return super.copy(e),this.fragmentShader=e.fragmentShader,this.vertexShader=e.vertexShader,this.uniforms=eo(e.uniforms),this.uniformsGroups=ro(e.uniformsGroups),this.defines=Object.assign({},e.defines),this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.fog=e.fog,this.lights=e.lights,this.clipping=e.clipping,this.extensions=Object.assign({},e.extensions),this.glslVersion=e.glslVersion,this.defaultAttributeValues=Object.assign({},e.defaultAttributeValues),this.index0AttributeName=e.index0AttributeName,this.uniformsNeedUpdate=e.uniformsNeedUpdate,this}toJSON(e){let t=super.toJSON(e);t.glslVersion=this.glslVersion,t.uniforms={};for(let n in this.uniforms){let r=this.uniforms[n].value;r&&r.isTexture?t.uniforms[n]={type:`t`,value:r.toJSON(e).uuid}:r&&r.isColor?t.uniforms[n]={type:`c`,value:r.getHex()}:r&&r.isVector2?t.uniforms[n]={type:`v2`,value:r.toArray()}:r&&r.isVector3?t.uniforms[n]={type:`v3`,value:r.toArray()}:r&&r.isVector4?t.uniforms[n]={type:`v4`,value:r.toArray()}:r&&r.isMatrix3?t.uniforms[n]={type:`m3`,value:r.toArray()}:r&&r.isMatrix4?t.uniforms[n]={type:`m4`,value:r.toArray()}:t.uniforms[n]={value:r}}Object.keys(this.defines).length>0&&(t.defines=this.defines),t.vertexShader=this.vertexShader,t.fragmentShader=this.fragmentShader,t.lights=this.lights,t.clipping=this.clipping;let n={};for(let e in this.extensions)this.extensions[e]===!0&&(n[e]=!0);return Object.keys(n).length>0&&(t.extensions=n),t}fromJSON(e,t){if(super.fromJSON(e,t),e.uniforms!==void 0)for(let n in e.uniforms){let r=e.uniforms[n];switch(this.uniforms[n]={},r.type){case`t`:this.uniforms[n].value=t[r.value]||null;break;case`c`:this.uniforms[n].value=new X().setHex(r.value);break;case`v2`:this.uniforms[n].value=new q().fromArray(r.value);break;case`v3`:this.uniforms[n].value=new J().fromArray(r.value);break;case`v4`:this.uniforms[n].value=new Yt().fromArray(r.value);break;case`m3`:this.uniforms[n].value=new Nt().fromArray(r.value);break;case`m4`:this.uniforms[n].value=new Y().fromArray(r.value);break;default:this.uniforms[n].value=r.value}}if(e.defines!==void 0&&(this.defines=e.defines),e.vertexShader!==void 0&&(this.vertexShader=e.vertexShader),e.fragmentShader!==void 0&&(this.fragmentShader=e.fragmentShader),e.glslVersion!==void 0&&(this.glslVersion=e.glslVersion),e.extensions!==void 0)for(let t in e.extensions)this.extensions[t]=e.extensions[t];return e.lights!==void 0&&(this.lights=e.lights),e.clipping!==void 0&&(this.clipping=e.clipping),this}},lo=class extends co{constructor(e){super(e),this.isRawShaderMaterial=!0,this.type=`RawShaderMaterial`}},uo=class extends zr{constructor(e){super(),this.isMeshStandardMaterial=!0,this.type=`MeshStandardMaterial`,this.defines={STANDARD:``},this.color=new X(16777215),this.roughness=1,this.metalness=0,this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new X(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=0,this.normalScale=new q(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.roughnessMap=null,this.metalnessMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new un,this.envMapIntensity=1,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap=`round`,this.wireframeLinejoin=`round`,this.flatShading=!1,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.defines={STANDARD:``},this.color.copy(e.color),this.roughness=e.roughness,this.metalness=e.metalness,this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.emissive.copy(e.emissive),this.emissiveMap=e.emissiveMap,this.emissiveIntensity=e.emissiveIntensity,this.bumpMap=e.bumpMap,this.bumpScale=e.bumpScale,this.normalMap=e.normalMap,this.normalMapType=e.normalMapType,this.normalScale.copy(e.normalScale),this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.roughnessMap=e.roughnessMap,this.metalnessMap=e.metalnessMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.envMapIntensity=e.envMapIntensity,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.flatShading=e.flatShading,this.fog=e.fog,this}},fo=class extends uo{constructor(e){super(),this.isMeshPhysicalMaterial=!0,this.defines={STANDARD:``,PHYSICAL:``},this.type=`MeshPhysicalMaterial`,this.anisotropyRotation=0,this.anisotropyMap=null,this.clearcoatMap=null,this.clearcoatRoughness=0,this.clearcoatRoughnessMap=null,this.clearcoatNormalScale=new q(1,1),this.clearcoatNormalMap=null,this.diffuseRoughnessMap=null,this.ior=1.5,Object.defineProperty(this,"reflectivity",{get:function(){return st(2.5*(this.ior-1)/(this.ior+1),0,1)},set:function(e){this.ior=(1+.4*e)/(1-.4*e)}}),this.iridescenceMap=null,this.iridescenceIOR=1.3,this.iridescenceThicknessMinimum=100,this.iridescenceThicknessMaximum=400,this.iridescenceThicknessMap=null,this.sheenColor=new X(0),this.sheenColorMap=null,this.sheenRoughness=1,this.sheenRoughnessMap=null,this.transmissionMap=null,this.thickness=0,this.thicknessMap=null,this.attenuationDistance=1/0,this.attenuationColor=new X(1,1,1),this.specularIntensity=1,this.specularIntensityMap=null,this.specularColor=new X(1,1,1),this.specularColorMap=null,this._anisotropy=0,this._clearcoat=0,this._diffuseRoughness=0,this._dispersion=0,this._iridescence=0,this._retroreflectivity=0,this._sheen=0,this._transmission=0,this.setValues(e)}get anisotropy(){return this._anisotropy}set anisotropy(e){this._anisotropy>0!=e>0&&this.version++,this._anisotropy=e}get clearcoat(){return this._clearcoat}set clearcoat(e){this._clearcoat>0!=e>0&&this.version++,this._clearcoat=e}get diffuseRoughness(){return this._diffuseRoughness}set diffuseRoughness(e){this._diffuseRoughness>0!=e>0&&this.version++,this._diffuseRoughness=e}get iridescence(){return this._iridescence}set iridescence(e){this._iridescence>0!=e>0&&this.version++,this._iridescence=e}get dispersion(){return this._dispersion}set dispersion(e){this._dispersion>0!=e>0&&this.version++,this._dispersion=e}get retroreflectivity(){return this._retroreflectivity}set retroreflectivity(e){this._retroreflectivity>0!=e>0&&this.version++,this._retroreflectivity=e}get sheen(){return this._sheen}set sheen(e){this._sheen>0!=e>0&&this.version++,this._sheen=e}get transmission(){return this._transmission}set transmission(e){this._transmission>0!=e>0&&this.version++,this._transmission=e}get iridescenceThicknessRange(){return Qe(`MeshPhysicalMaterial: The "iridescenceThicknessRange" property has been replaced by "iridescenceThicknessMinimum" and "iridescenceThicknessMaximum".`),[this.iridescenceThicknessMinimum,this.iridescenceThicknessMaximum]}set iridescenceThicknessRange(e){Qe(`MeshPhysicalMaterial: The "iridescenceThicknessRange" property has been replaced by "iridescenceThicknessMinimum" and "iridescenceThicknessMaximum".`),this.iridescenceThicknessMinimum=e[0],this.iridescenceThicknessMaximum=e[1]}copy(e){return super.copy(e),this.defines={STANDARD:``,PHYSICAL:``},this.anisotropy=e.anisotropy,this.anisotropyRotation=e.anisotropyRotation,this.anisotropyMap=e.anisotropyMap,this.clearcoat=e.clearcoat,this.clearcoatMap=e.clearcoatMap,this.clearcoatRoughness=e.clearcoatRoughness,this.clearcoatRoughnessMap=e.clearcoatRoughnessMap,this.clearcoatNormalMap=e.clearcoatNormalMap,this.clearcoatNormalScale.copy(e.clearcoatNormalScale),this.diffuseRoughness=e.diffuseRoughness,this.diffuseRoughnessMap=e.diffuseRoughnessMap,this.dispersion=e.dispersion,this.ior=e.ior,this.iridescence=e.iridescence,this.iridescenceMap=e.iridescenceMap,this.iridescenceIOR=e.iridescenceIOR,this.iridescenceThicknessMinimum=e.iridescenceThicknessMinimum,this.iridescenceThicknessMaximum=e.iridescenceThicknessMaximum,this.iridescenceThicknessMap=e.iridescenceThicknessMap,this.retroreflectivity=e.retroreflectivity,this.sheen=e.sheen,this.sheenColor.copy(e.sheenColor),this.sheenColorMap=e.sheenColorMap,this.sheenRoughness=e.sheenRoughness,this.sheenRoughnessMap=e.sheenRoughnessMap,this.transmission=e.transmission,this.transmissionMap=e.transmissionMap,this.thickness=e.thickness,this.thicknessMap=e.thicknessMap,this.attenuationDistance=e.attenuationDistance,this.attenuationColor.copy(e.attenuationColor),this.specularIntensity=e.specularIntensity,this.specularIntensityMap=e.specularIntensityMap,this.specularColor.copy(e.specularColor),this.specularColorMap=e.specularColorMap,this}},po=class extends zr{constructor(e){super(),this.isMeshDepthMaterial=!0,this.type=`MeshDepthMaterial`,this.depthPacking=Ie,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(e)}copy(e){return super.copy(e),this.depthPacking=e.depthPacking,this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this}},mo=class extends zr{constructor(e){super(),this.isMeshDistanceMaterial=!0,this.type=`MeshDistanceMaterial`,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(e)}copy(e){return super.copy(e),this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this}};function ho(e,t){return!e||e.constructor===t?e:typeof t.BYTES_PER_ELEMENT==`number`?new t(e):Array.prototype.slice.call(e)}function go(e){return e!==void 0&&e.inTangents!==void 0&&e.outTangents!==void 0}function _o(e){function t(t,n){return e[t]-e[n]}let n=e.length,r=Array(n);for(let e=0;e!==n;++e)r[e]=e;return r.sort(t),r}function vo(e,t,n){let r=e.length,i=new e.constructor(r);for(let a=0,o=0;o!==r;++a){let r=n[a]*t;for(let n=0;n!==t;++n)i[o++]=e[r+n]}return i}function yo(e,t,n,r){let i=1,a=e[0];for(;a!==void 0&&a[r]===void 0;)a=e[i++];if(a===void 0)return;let o=a[r];if(o!==void 0){if(Array.isArray(o))do o=a[r],o!==void 0&&(t.push(a.time),n.push(...o)),a=e[i++];while(a!==void 0);else if(o.toArray!==void 0)do o=a[r],o!==void 0&&(t.push(a.time),o.toArray(n,n.length)),a=e[i++];while(a!==void 0);else do o=a[r],o!==void 0&&(t.push(a.time),n.push(o)),a=e[i++];while(a!==void 0)}}var bo=class{constructor(e,t,n,r){this.parameterPositions=e,this._cachedIndex=0,this.resultBuffer=r===void 0?new t.constructor(n):r,this.sampleValues=t,this.valueSize=n,this.settings=null,this.DefaultSettings_={}}evaluate(e){let t=this.parameterPositions,n=this._cachedIndex,r=t[n],i=t[n-1];validate_interval:{seek:{let a;linear_scan:{forward_scan:if(!(e<r)){for(let a=n+2;;){if(r===void 0){if(e<i)break forward_scan;return n=t.length,this._cachedIndex=n,this.copySampleValue_(n-1)}if(n===a)break;if(i=r,r=t[++n],e<r)break seek}a=t.length;break linear_scan}if(!(e>=i)){let o=t[1];e<o&&(n=2,i=o);for(let a=n-2;;){if(i===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(n===a)break;if(r=i,i=t[--n-1],e>=i)break seek}a=n,n=0;break linear_scan}break validate_interval}for(;n<a;){let r=n+a>>>1;e<t[r]?a=r:n=r+1}if(r=t[n],i=t[n-1],i===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(r===void 0)return n=t.length,this._cachedIndex=n,this.copySampleValue_(n-1)}this._cachedIndex=n,this.intervalChanged_(n,i,r)}return this.interpolate_(n,i,e,r)}getSettings_(){return this.settings||this.DefaultSettings_}copySampleValue_(e){let t=this.resultBuffer,n=this.sampleValues,r=this.valueSize,i=e*r;for(let e=0;e!==r;++e)t[e]=n[i+e];return t}interpolate_(){throw Error(`THREE.Interpolant: Call to abstract method.`)}intervalChanged_(){}},xo=class extends bo{constructor(e,t,n,r){super(e,t,n,r),this._weightPrev=-0,this._offsetPrev=-0,this._weightNext=-0,this._offsetNext=-0,this.DefaultSettings_={endingStart:U,endingEnd:U}}intervalChanged_(e,t,n){let r=this.parameterPositions,i=e-2,a=e+1,o=r[i],s=r[a];if(o===void 0)switch(this.getSettings_().endingStart){case W:i=e,o=2*t-n;break;case Ne:i=r.length-2,o=t+r[i]-r[i+1];break;default:i=e,o=n}if(s===void 0)switch(this.getSettings_().endingEnd){case W:a=e,s=2*n-t;break;case Ne:a=1,s=n+r[1]-r[0];break;default:a=e-1,s=t}let c=(n-t)*.5,l=this.valueSize;this._weightPrev=c/(t-o),this._weightNext=c/(s-n),this._offsetPrev=i*l,this._offsetNext=a*l}interpolate_(e,t,n,r){let i=this.resultBuffer,a=this.sampleValues,o=this.valueSize,s=e*o,c=s-o,l=this._offsetPrev,u=this._offsetNext,d=this._weightPrev,f=this._weightNext,p=(n-t)/(r-t),m=p*p,h=m*p,g=-d*h+2*d*m-d*p,_=(1+d)*h+(-1.5-2*d)*m+(-.5+d)*p+1,v=(-1-f)*h+(1.5+f)*m+.5*p,y=f*h-f*m;for(let e=0;e!==o;++e)i[e]=g*a[l+e]+_*a[c+e]+v*a[s+e]+y*a[u+e];return i}},So=class extends bo{constructor(e,t,n,r){super(e,t,n,r)}interpolate_(e,t,n,r){let i=this.resultBuffer,a=this.sampleValues,o=this.valueSize,s=e*o,c=s-o,l=(n-t)/(r-t),u=1-l;for(let e=0;e!==o;++e)i[e]=a[c+e]*u+a[s+e]*l;return i}},Co=class extends bo{constructor(e,t,n,r){super(e,t,n,r)}interpolate_(e){return this.copySampleValue_(e-1)}},wo=class extends bo{interpolate_(e,t,n,r){let i=this.resultBuffer,a=this.sampleValues,o=this.valueSize,s=e*o,c=s-o,l=this.inTangents,u=this.outTangents;if(!l||!u){let e=(n-t)/(r-t),l=1-e;for(let t=0;t!==o;++t)i[t]=a[c+t]*l+a[s+t]*e;return i}let d=o*2,f=e-1;for(let p=0;p!==o;++p){let o=a[c+p],m=a[s+p],h=f*d+p*2,g=u[h],_=u[h+1],v=e*d+p*2,y=l[v],b=l[v+1],x=Do(n,t,g,y,r);i[p]=To(x,o,_,b,m)}return i}};function To(e,t,n,r,i){let a=1-e;return a*a*a*t+3*a*a*e*n+3*a*e*e*r+e*e*e*i}function Eo(e,t,n,r,i){let a=1-e;return 3*a*a*(n-t)+6*a*e*(r-n)+3*e*e*(i-r)}function Do(e,t,n,r,i){let a=(e-t)/(i-t);for(let o=0;o<8;o++){let o=To(a,t,n,r,i)-e;if(Math.abs(o)<1e-10)break;let s=Eo(a,t,n,r,i);if(Math.abs(s)<1e-10)break;a=Math.max(0,Math.min(1,a-o/s))}return a}var Oo=class{constructor(e,t,n,r){if(e===void 0)throw Error(`THREE.KeyframeTrack: track name is undefined`);if(t===void 0||t.length===0)throw Error(`THREE.KeyframeTrack: no keyframes in track named `+e);this.name=e,this.times=ho(t,this.TimeBufferType),this.values=ho(n,this.ValueBufferType),this.setInterpolation(r||this.DefaultInterpolation)}static toJSON(e){let t=e.constructor,n;if(t.toJSON!==this.toJSON)n=t.toJSON(e);else{n={name:e.name,times:ho(e.times,Array),values:ho(e.values,Array)};let t=e.getInterpolation();t!==e.DefaultInterpolation&&(n.interpolation=t),go(e.settings)&&(n.settings={inTangents:ho(e.settings.inTangents,Array),outTangents:ho(e.settings.outTangents,Array)})}return n.type=e.ValueTypeName,n}InterpolantFactoryMethodDiscrete(e){return new Co(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodLinear(e){return new So(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodSmooth(e){return new xo(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodBezier(e){let t=new wo(this.times,this.values,this.getValueSize(),e);return this.settings&&(t.inTangents=this.settings.inTangents,t.outTangents=this.settings.outTangents),t}setInterpolation(e){let t;switch(e){case Ae:t=this.InterpolantFactoryMethodDiscrete;break;case je:t=this.InterpolantFactoryMethodLinear;break;case H:t=this.InterpolantFactoryMethodSmooth;break;case Me:t=this.InterpolantFactoryMethodBezier}if(t===void 0){let t=`unsupported interpolation for `+this.ValueTypeName+` keyframe track named `+this.name;if(this.createInterpolant===void 0){if(e!==this.DefaultInterpolation)this.setInterpolation(this.DefaultInterpolation);else throw Error(t)}return G(`KeyframeTrack:`,t),this}return this.createInterpolant=t,this}getInterpolation(){switch(this.createInterpolant){case this.InterpolantFactoryMethodDiscrete:return Ae;case this.InterpolantFactoryMethodLinear:return je;case this.InterpolantFactoryMethodSmooth:return H;case this.InterpolantFactoryMethodBezier:return Me}}getValueSize(){return this.values.length/this.times.length}shift(e){if(e!==0){let t=this.times;for(let n=0,r=t.length;n!==r;++n)t[n]+=e;go(this.settings)&&(ko(this.settings.inTangents,e),ko(this.settings.outTangents,e))}return this}scale(e){if(e!==1){let t=this.times;for(let n=0,r=t.length;n!==r;++n)t[n]*=e;go(this.settings)&&(Ao(this.settings.inTangents,e),Ao(this.settings.outTangents,e))}return this}trim(e,t){let n=this.times,r=n.length,i=0,a=r-1;for(;i!==r&&n[i]<e;)++i;for(;a!==-1&&n[a]>t;)--a;if(++a,i!==0||a!==r){i>=a&&(a=Math.max(a,1),i=a-1);let e=this.getValueSize();this.times=n.slice(i,a),this.values=this.values.slice(i*e,a*e)}return this}validate(){let e=!0,t=this.getValueSize();t-Math.floor(t)!==0&&(K(`KeyframeTrack: Invalid value size in track.`,this),e=!1);let n=this.times,r=this.values,i=n.length;i===0&&(K(`KeyframeTrack: Track is empty.`,this),e=!1);let a=null;for(let t=0;t!==i;t++){let r=n[t];if(typeof r==`number`&&isNaN(r)){K(`KeyframeTrack: Time is not a valid number.`,this,t,r),e=!1;break}if(a!==null&&a>r){K(`KeyframeTrack: Out of order keys.`,this,t,r,a),e=!1;break}a=r}if(r!==void 0&&Ke(r))for(let t=0,n=r.length;t!==n;++t){let n=r[t];if(isNaN(n)){K(`KeyframeTrack: Value is not a valid number.`,this,t,n),e=!1;break}}return e}optimize(){let e=this.times.slice(),t=this.values.slice(),n=this.getValueSize(),r=this.getInterpolation()===H,i=e.length-1,a=1;for(let o=1;o<i;++o){let i=!1,s=e[o];if(s!==e[o+1]&&(o!==1||s!==e[0])){if(r)i=!0;else{let e=o*n,r=e-n,a=e+n;for(let o=0;o!==n;++o){let n=t[e+o];if(n!==t[r+o]||n!==t[a+o]){i=!0;break}}}}if(i){if(o!==a){e[a]=e[o];let r=o*n,i=a*n;for(let e=0;e!==n;++e)t[i+e]=t[r+e]}++a}}if(i>0){e[a]=e[i];for(let e=i*n,r=a*n,o=0;o!==n;++o)t[r+o]=t[e+o];++a}return a===e.length?(this.times=e,this.values=t):(this.times=e.slice(0,a),this.values=t.slice(0,a*n)),this}clone(){let e=this.times.slice(),t=this.values.slice(),n=this.constructor,r=new n(this.name,e,t);return r.createInterpolant=this.createInterpolant,go(this.settings)&&(r.settings={inTangents:this.settings.inTangents.slice(),outTangents:this.settings.outTangents.slice()}),r}};function ko(e,t){for(let n=0,r=e.length;n!==r;n+=2)e[n]+=t}function Ao(e,t){for(let n=0,r=e.length;n!==r;n+=2)e[n]*=t}Oo.prototype.ValueTypeName=``,Oo.prototype.TimeBufferType=Float32Array,Oo.prototype.ValueBufferType=Float32Array,Oo.prototype.DefaultInterpolation=je;var jo=class extends Oo{constructor(e,t,n){super(e,t,n)}};jo.prototype.ValueTypeName=`bool`,jo.prototype.ValueBufferType=Array,jo.prototype.DefaultInterpolation=Ae,jo.prototype.InterpolantFactoryMethodLinear=void 0,jo.prototype.InterpolantFactoryMethodSmooth=void 0;var Mo=class extends Oo{constructor(e,t,n,r){super(e,t,n,r)}};Mo.prototype.ValueTypeName=`color`;var No=class extends Oo{constructor(e,t,n,r){super(e,t,n,r)}};No.prototype.ValueTypeName=`number`;var Po=class extends bo{constructor(e,t,n,r){super(e,t,n,r)}interpolate_(e,t,n,r){let i=this.resultBuffer,a=this.sampleValues,o=this.valueSize,s=(n-t)/(r-t),c=e*o;for(let e=c+o;c!==e;c+=4)At.slerpFlat(i,0,a,c-o,a,c,s);return i}},Fo=class extends Oo{constructor(e,t,n,r){super(e,t,n,r)}InterpolantFactoryMethodLinear(e){return new Po(this.times,this.values,this.getValueSize(),e)}};Fo.prototype.ValueTypeName=`quaternion`,Fo.prototype.InterpolantFactoryMethodSmooth=void 0;var Io=class extends Oo{constructor(e,t,n){super(e,t,n)}};Io.prototype.ValueTypeName=`string`,Io.prototype.ValueBufferType=Array,Io.prototype.DefaultInterpolation=Ae,Io.prototype.InterpolantFactoryMethodLinear=void 0,Io.prototype.InterpolantFactoryMethodSmooth=void 0;var Lo=class extends Oo{constructor(e,t,n,r){super(e,t,n,r)}};Lo.prototype.ValueTypeName=`vector`;var Ro=class{constructor(e=``,t=-1,n=[],r=Pe){this.name=e,this.tracks=n,this.duration=t,this.blendMode=r,this.uuid=ot(),this.userData={},this.duration<0&&this.resetDuration()}static parse(e){let t=[],n=e.tracks,r=1/(e.fps||1);for(let e=0,i=n.length;e!==i;++e)t.push(Bo(n[e]).scale(r));let i=new this(e.name,e.duration,t,e.blendMode);return i.uuid=e.uuid,i.userData=JSON.parse(e.userData||`{}`),i}static toJSON(e){let t=[],n=e.tracks,r={name:e.name,duration:e.duration,tracks:t,uuid:e.uuid,blendMode:e.blendMode,userData:JSON.stringify(e.userData)};for(let e=0,r=n.length;e!==r;++e)t.push(Oo.toJSON(n[e]));return r}static CreateFromMorphTargetSequence(e,t,n,r){let i=t.length,a=[];for(let e=0;e<i;e++){let o=[],s=[];o.push((e+i-1)%i,e,(e+1)%i),s.push(0,1,0);let c=_o(o);o=vo(o,1,c),s=vo(s,1,c),!r&&o[0]===0&&(o.push(i),s.push(s[0])),a.push(new No(`.morphTargetInfluences[`+t[e].name+`]`,o,s).scale(1/n))}return new this(e,-1,a)}static findByName(e,t){let n=e;if(!Array.isArray(e)){let t=e;n=t.geometry&&t.geometry.animations||t.animations}for(let e=0;e<n.length;e++)if(n[e].name===t)return n[e];return null}static CreateClipsFromMorphTargetSequences(e,t,n){let r={},i=/^([\w-]*?)([\d]+)$/;for(let t=0,n=e.length;t<n;t++){let n=e[t],a=n.name.match(i);if(a&&a.length>1){let e=a[1],t=r[e];t||(r[e]=t=[]),t.push(n)}}let a=[];for(let e in r)a.push(this.CreateFromMorphTargetSequence(e,r[e],t,n));return a}resetDuration(){let e=this.tracks,t=0;for(let n=0,r=e.length;n!==r;++n){let e=this.tracks[n];t=Math.max(t,e.times[e.times.length-1])}return this.duration=t,this}trim(){for(let e=0;e<this.tracks.length;e++)this.tracks[e].trim(0,this.duration);return this}validate(){let e=!0;for(let t=0;t<this.tracks.length;t++)e&&=this.tracks[t].validate();return e}optimize(){for(let e=0;e<this.tracks.length;e++)this.tracks[e].optimize();return this}clone(){let e=[];for(let t=0;t<this.tracks.length;t++)e.push(this.tracks[t].clone());let t=new this.constructor(this.name,this.duration,e,this.blendMode);return t.userData=JSON.parse(JSON.stringify(this.userData)),t}toJSON(){return this.constructor.toJSON(this)}};function zo(e){switch(e.toLowerCase()){case`scalar`:case`double`:case`float`:case`number`:case`integer`:return No;case`vector`:case`vector2`:case`vector3`:case`vector4`:return Lo;case`color`:return Mo;case`quaternion`:return Fo;case`bool`:case`boolean`:return jo;case`string`:return Io}throw Error(`THREE.KeyframeTrack: Unsupported typeName: `+e)}function Bo(e){if(e.type===void 0)throw Error(`THREE.KeyframeTrack: track type undefined, can not parse`);let t=zo(e.type);if(e.times===void 0){let t=[],n=[];yo(e.keys,t,n,`value`),e.times=t,e.values=n}let n;return n=t.parse===void 0?new t(e.name,e.times,e.values,e.interpolation):t.parse(e),go(e.settings)&&(n.settings={inTangents:ho(e.settings.inTangents,Float32Array),outTangents:ho(e.settings.outTangents,Float32Array)}),n}var Vo={enabled:!1,files:{},add:function(e,t){this.enabled!==!1&&(Ho(e)||(this.files[e]=t))},get:function(e){if(this.enabled!==!1&&!Ho(e))return this.files[e]},remove:function(e){delete this.files[e]},clear:function(){this.files={}}};function Ho(e){try{let t=e.slice(e.indexOf(`:`)+1);return new URL(t).protocol===`blob:`}catch{return!1}}var Uo=new class{constructor(e,t,n){let r=this,i=!1,a=0,o=0,s,c=[];this.onStart=void 0,this.onLoad=e,this.onProgress=t,this.onError=n,this._abortController=null,this.itemStart=function(e){o++,i===!1&&r.onStart!==void 0&&r.onStart(e,a,o),i=!0},this.itemEnd=function(e){a++,r.onProgress!==void 0&&r.onProgress(e,a,o),a===o&&(i=!1,r.onLoad!==void 0&&r.onLoad())},this.itemError=function(e){r.onError!==void 0&&r.onError(e)},this.resolveURL=function(e){return e=e.normalize(`NFC`),s?s(e):e},this.setURLModifier=function(e){return s=e,this},this.addHandler=function(e,t){return c.push(e,t),this},this.removeHandler=function(e){let t=c.indexOf(e);return t!==-1&&c.splice(t,2),this},this.getHandler=function(e){for(let t=0,n=c.length;t<n;t+=2){let n=c[t],r=c[t+1];if(n.global&&(n.lastIndex=0),n.test(e))return r}return null},this.abort=function(){return this.abortController.abort(),this._abortController=null,this}}get abortController(){return this._abortController||=new AbortController,this._abortController}},Wo=class{constructor(e){this.manager=e===void 0?Uo:e,this.crossOrigin=`anonymous`,this.withCredentials=!1,this.path=``,this.resourcePath=``,this.requestHeader={},this.priority=`auto`,this.cache=`default`,typeof __THREE_DEVTOOLS__<`u`&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent(`observe`,{detail:this}))}load(){}loadAsync(e,t){let n=this;return new Promise(function(r,i){n.load(e,r,t,i)})}parse(){}setCrossOrigin(e){return this.crossOrigin=e,this}setWithCredentials(e){return this.withCredentials=e,this}setPath(e){return this.path=e,this}setResourcePath(e){return this.resourcePath=e,this}setRequestHeader(e){return this.requestHeader=e,this}setPriority(e){return this.priority=e,this}setCache(e){return this.cache=e,this}abort(){return this}};Wo.DEFAULT_MATERIAL_NAME=`__DEFAULT`;var Go={},Ko=class extends Error{constructor(e,t){super(e),this.response=t}},qo=class extends Wo{constructor(e){super(e),this.mimeType=``,this.responseType=``,this._abortController=new AbortController}load(e,t,n,r){e===void 0&&(e=``),this.path!==void 0&&(e=this.path+e),e=this.manager.resolveURL(e);let i=Vo.get(`file:${e}`);if(i!==void 0){this.manager.itemStart(e),setTimeout(()=>{t&&t(i),this.manager.itemEnd(e)},0);return}if(Go[e]!==void 0){Go[e].push({onLoad:t,onProgress:n,onError:r});return}Go[e]=[],Go[e].push({onLoad:t,onProgress:n,onError:r});let a=new Request(e,{headers:new Headers(this.requestHeader),credentials:this.withCredentials?`include`:`same-origin`,priority:this.priority,cache:this.cache,signal:typeof AbortSignal.any==`function`?AbortSignal.any([this._abortController.signal,this.manager.abortController.signal]):this._abortController.signal}),o=this.mimeType,s=this.responseType;fetch(a).then(t=>{if(t.status===200||t.status===0){if(t.status===0&&G(`FileLoader: HTTP Status 0 received.`),typeof ReadableStream>`u`||t.body===void 0||t.body.getReader===void 0)return t;let n=Go[e],r=t.body.getReader(),i=t.headers.get(`X-File-Size`)||t.headers.get(`Content-Length`),a=i?parseInt(i):0,o=a!==0,s=0,c=new ReadableStream({start(e){t();function t(){r.read().then(({done:r,value:i})=>{if(r)e.close();else{s+=i.byteLength;let r=new ProgressEvent(`progress`,{lengthComputable:o,loaded:s,total:a});for(let e=0,t=n.length;e<t;e++){let t=n[e];t.onProgress&&t.onProgress(r)}e.enqueue(i),t()}},t=>{e.error(t)})}}});return new Response(c)}throw new Ko(`fetch for "${t.url}" responded with ${t.status}: ${t.statusText}`,t)}).then(e=>{switch(s){case`arraybuffer`:return e.arrayBuffer();case`blob`:return e.blob();case`document`:return e.text().then(e=>new DOMParser().parseFromString(e,o));case`json`:return e.json();default:if(o===``)return e.text();{let t=/charset="?([^;"\s]*)"?/i.exec(o),n=t&&t[1]?t[1].toLowerCase():void 0,r=new TextDecoder(n);return e.arrayBuffer().then(e=>r.decode(e))}}}).then(t=>{Vo.add(`file:${e}`,t);let n=Go[e];delete Go[e];for(let e=0,r=n.length;e<r;e++){let r=n[e];r.onLoad&&r.onLoad(t)}}).catch(t=>{let n=Go[e];if(n===void 0)throw this.manager.itemError(e),t;delete Go[e];for(let e=0,r=n.length;e<r;e++){let r=n[e];r.onError&&r.onError(t)}this.manager.itemError(e)}).finally(()=>{this.manager.itemEnd(e)}),this.manager.itemStart(e)}setResponseType(e){return this.responseType=e,this}setMimeType(e){return this.mimeType=e,this}abort(){return this._abortController.abort(),this._abortController=new AbortController,this}},Jo=new WeakMap,Yo=class extends Wo{constructor(e){super(e)}load(e,t,n,r){this.path!==void 0&&(e=this.path+e),e=this.manager.resolveURL(e);let i=this,a=Vo.get(`image:${e}`);if(a!==void 0){if(a.complete===!0)i.manager.itemStart(e),setTimeout(function(){t&&t(a),i.manager.itemEnd(e)},0);else{let e=Jo.get(a);e===void 0&&(e=[],Jo.set(a,e)),e.push({onLoad:t,onError:r})}return a}let o=qe(`img`);function s(){l(),t&&t(this);let n=Jo.get(this)||[];for(let e=0;e<n.length;e++){let t=n[e];t.onLoad&&t.onLoad(this)}Jo.delete(this),i.manager.itemEnd(e)}function c(t){l(),r&&r(t),Vo.remove(`image:${e}`);let n=Jo.get(this)||[];for(let e=0;e<n.length;e++){let r=n[e];r.onError&&r.onError(t)}Jo.delete(this),i.manager.itemError(e),i.manager.itemEnd(e)}function l(){o.removeEventListener(`load`,s,!1),o.removeEventListener(`error`,c,!1)}return o.addEventListener(`load`,s,!1),o.addEventListener(`error`,c,!1),e.slice(0,5)!==`data:`&&this.crossOrigin!==void 0&&(o.crossOrigin=this.crossOrigin),Vo.add(`image:${e}`,o),i.manager.itemStart(e),o.fetchPriority=this.priority,o.src=e,o}},Xo=class extends Wo{constructor(e){super(e)}load(e,t,n,r){let i=new Jt,a=new Yo(this.manager);return a.setPriority(this.priority),a.setCache(this.cache),a.setCrossOrigin(this.crossOrigin),a.setPath(this.path),a.load(e,function(e){i.image=e,i.needsUpdate=!0,t!==void 0&&t(i)},n,r),i}},Zo=class extends Dn{static registerNode(e){this.prototype._lightNode=e}constructor(e,t=1){super(),this.isLight=!0,this.type=`Light`,this.color=new X(e),this.intensity=t}copy(e,t){return super.copy(e,t),this.color.copy(e.color),this.intensity=e.intensity,this}toJSON(e){let t=super.toJSON(e);return t.object.color=this.color.getHex(),t.object.intensity=this.intensity,t}},Qo=class extends Zo{constructor(e,t,n){super(e,n),this.isHemisphereLight=!0,this.type=`HemisphereLight`,this.position.copy(Dn.DEFAULT_UP),this.updateMatrix(),this.groundColor=new X(t)}copy(e,t){return super.copy(e,t),this.groundColor.copy(e.groundColor),this}toJSON(e){let t=super.toJSON(e);return t.object.groundColor=this.groundColor.getHex(),t}},$o=new Y,es=new J,ts=new J,ns=class{constructor(e){this.camera=e,this.intensity=1,this.bias=0,this.biasNode=null,this.normalBias=0,this.radius=1,this.blurSamples=8,this.mapSize=new q(512,512),this.mapType=u,this.map=null,this.mapPass=null,this.matrix=new Y,this.autoUpdate=!0,this.needsUpdate=!1,this._frustum=new Ni,this._frameExtents=new q(1,1),this._viewportCount=1,this._viewports=[new Yt(0,0,1,1)]}getViewportCount(){return this._viewportCount}getCamera(){return this.camera}getFrustum(){return this._frustum}updateMatrices(e){let t=this.camera;es.setFromMatrixPosition(e.matrixWorld),t.position.copy(es),ts.setFromMatrixPosition(e.target.matrixWorld),t.lookAt(ts),t.updateMatrixWorld(),this._updateMatrix(t,this.matrix,this._frustum)}_updateMatrix(e,t,n,r){$o.multiplyMatrices(e.projectionMatrix,e.matrixWorldInverse),n.setFromProjectionMatrix($o,e.coordinateSystem,e.reversedDepth);let i=this._frameExtents,a=r?r.z/i.x:1,o=r?r.w/i.y:1,s=r?r.x/i.x:0,c=r?r.y/i.y:0;e.coordinateSystem===2001||e.reversedDepth?t.set(.5*a,0,0,.5*a+s,0,.5*o,0,.5*o+c,0,0,1,0,0,0,0,1):t.set(.5*a,0,0,.5*a+s,0,.5*o,0,.5*o+c,0,0,.5,.5,0,0,0,1),t.multiply($o)}getViewport(e){return this._viewports[e]}getFrameExtents(){return this._frameExtents}dispose(){this.map&&this.map.dispose(),this.mapPass&&this.mapPass.dispose()}copy(e){return this.camera=e.camera.clone(),this.intensity=e.intensity,this.bias=e.bias,this.radius=e.radius,this.autoUpdate=e.autoUpdate,this.needsUpdate=e.needsUpdate,this.normalBias=e.normalBias,this.blurSamples=e.blurSamples,this.mapSize.copy(e.mapSize),this.mapType=e.mapType,this.biasNode=e.biasNode,this}clone(){return new this.constructor().copy(this)}toJSON(){let e={};return e.intensity=this.intensity,e.bias=this.bias,e.normalBias=this.normalBias,e.radius=this.radius,e.blurSamples=this.blurSamples,e.mapSize=this.mapSize.toArray(),e.mapType=this.mapType,e.camera=this.camera.toJSON(!1).object,delete e.camera.matrix,e}},rs=new J,is=new At,as=new J,os=class extends Dn{constructor(){super(),this.isCamera=!0,this.type=`Camera`,this.matrixWorldInverse=new Y,this.projectionMatrix=new Y,this.projectionMatrixInverse=new Y,this.coordinateSystem=We,this._reversedDepth=!1}get reversedDepth(){return this._reversedDepth}copy(e,t){return super.copy(e,t),this.matrixWorldInverse.copy(e.matrixWorldInverse),this.projectionMatrix.copy(e.projectionMatrix),this.projectionMatrixInverse.copy(e.projectionMatrixInverse),this.coordinateSystem=e.coordinateSystem,this}getWorldDirection(e){return super.getWorldDirection(e).negate()}updateMatrixWorld(e){super.updateMatrixWorld(e),this.matrixWorld.decompose(rs,is,as),as.x===1&&as.y===1&&as.z===1?this.matrixWorldInverse.copy(this.matrixWorld).invert():this.matrixWorldInverse.compose(rs,is,as.set(1,1,1)).invert()}updateWorldMatrix(e,t,n=!1){super.updateWorldMatrix(e,t,n),this.matrixWorld.decompose(rs,is,as),as.x===1&&as.y===1&&as.z===1?this.matrixWorldInverse.copy(this.matrixWorld).invert():this.matrixWorldInverse.compose(rs,is,as.set(1,1,1)).invert()}clone(){return new this.constructor().copy(this)}},ss=new J,cs=new q,ls=new q,us=class extends os{constructor(e=50,t=1,n=.1,r=2e3){super(),this.isPerspectiveCamera=!0,this.type=`PerspectiveCamera`,this.fov=e,this.zoom=1,this.near=n,this.far=r,this.focus=10,this.aspect=t,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.fov=e.fov,this.zoom=e.zoom,this.near=e.near,this.far=e.far,this.focus=e.focus,this.aspect=e.aspect,this.view=e.view===null?null:Object.assign({},e.view),this.filmGauge=e.filmGauge,this.filmOffset=e.filmOffset,this}setFocalLength(e){let t=.5*this.getFilmHeight()/e;this.fov=at*2*Math.atan(t),this.updateProjectionMatrix()}getFocalLength(){let e=Math.tan(it*.5*this.fov);return .5*this.getFilmHeight()/e}getEffectiveFOV(){return at*2*Math.atan(Math.tan(it*.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}getViewBounds(e,t,n){ss.set(-1,-1,.5).applyMatrix4(this.projectionMatrixInverse),t.set(ss.x,ss.y).multiplyScalar(-e/ss.z),ss.set(1,1,.5).applyMatrix4(this.projectionMatrixInverse),n.set(ss.x,ss.y).multiplyScalar(-e/ss.z)}getViewSize(e,t){return this.getViewBounds(e,cs,ls),t.subVectors(ls,cs)}setViewOffset(e,t,n,r,i,a){this.aspect=e/t,this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=n,this.view.offsetY=r,this.view.width=i,this.view.height=a,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let e=this.near,t=e*Math.tan(it*.5*this.fov)/this.zoom,n=2*t,r=this.aspect*n,i=-.5*r,a=this.view;if(this.view!==null&&this.view.enabled){let e=a.fullWidth,o=a.fullHeight;i+=a.offsetX*r/e,t-=a.offsetY*n/o,r*=a.width/e,n*=a.height/o}let o=this.filmOffset;o!==0&&(i+=e*o/this.getFilmWidth()),this.projectionMatrix.makePerspective(i,i+r,t,t-n,e,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){let t=super.toJSON(e);return t.object.fov=this.fov,t.object.zoom=this.zoom,t.object.near=this.near,t.object.far=this.far,t.object.focus=this.focus,t.object.aspect=this.aspect,this.view!==null&&(t.object.view=Object.assign({},this.view)),t.object.filmGauge=this.filmGauge,t.object.filmOffset=this.filmOffset,t}},ds=class extends ns{constructor(){super(new us(50,1,.5,500)),this.isSpotLightShadow=!0,this.focus=1,this.aspect=1}updateMatrices(e){let t=this.camera,n=at*2*e.angle*this.focus,r=this.mapSize.width/this.mapSize.height*this.aspect,i=e.distance||t.far;(n!==t.fov||r!==t.aspect||i!==t.far)&&(t.fov=n,t.aspect=r,t.far=i,t.updateProjectionMatrix()),super.updateMatrices(e)}copy(e){return super.copy(e),this.focus=e.focus,this.aspect=e.aspect,this}toJSON(){let e=super.toJSON();return e.focus=this.focus,e.aspect=this.aspect,e}},fs=class extends Zo{constructor(e,t,n=0,r=Math.PI/3,i=0,a=2){super(e,t),this.isSpotLight=!0,this.type=`SpotLight`,this.position.copy(Dn.DEFAULT_UP),this.updateMatrix(),this.target=new Dn,this.distance=n,this.angle=r,this.penumbra=i,this.decay=a,this.map=null,this.shadow=new ds}get power(){return this.intensity*Math.PI}set power(e){this.intensity=e/Math.PI}dispose(){super.dispose(),this.shadow.dispose()}copy(e,t){return super.copy(e,t),this.distance=e.distance,this.angle=e.angle,this.penumbra=e.penumbra,this.decay=e.decay,this.target=e.target.clone(),this.map=e.map,this.shadow=e.shadow.clone(),this}toJSON(e){let t=super.toJSON(e);return t.object.distance=this.distance,t.object.angle=this.angle,t.object.decay=this.decay,t.object.penumbra=this.penumbra,t.object.target=this.target.uuid,this.map&&this.map.isTexture&&(t.object.map=this.map.toJSON(e).uuid),t.object.shadow=this.shadow.toJSON(),t}},ps=class extends ns{constructor(){super(new us(90,1,.5,500)),this.isPointLightShadow=!0}},ms=class extends Zo{constructor(e,t,n=0,r=2){super(e,t),this.isPointLight=!0,this.type=`PointLight`,this.distance=n,this.decay=r,this.shadow=new ps}get power(){return this.intensity*4*Math.PI}set power(e){this.intensity=e/(4*Math.PI)}dispose(){super.dispose(),this.shadow.dispose()}copy(e,t){return super.copy(e,t),this.distance=e.distance,this.decay=e.decay,this.shadow=e.shadow.clone(),this}toJSON(e){let t=super.toJSON(e);return t.object.distance=this.distance,t.object.decay=this.decay,t.object.shadow=this.shadow.toJSON(),t}},hs=class extends os{constructor(e=-1,t=1,n=1,r=-1,i=.1,a=2e3){super(),this.isOrthographicCamera=!0,this.type=`OrthographicCamera`,this.zoom=1,this.view=null,this.left=e,this.right=t,this.top=n,this.bottom=r,this.near=i,this.far=a,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.left=e.left,this.right=e.right,this.top=e.top,this.bottom=e.bottom,this.near=e.near,this.far=e.far,this.zoom=e.zoom,this.view=e.view===null?null:Object.assign({},e.view),this}setViewOffset(e,t,n,r,i,a){this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=n,this.view.offsetY=r,this.view.width=i,this.view.height=a,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let e=(this.right-this.left)/(2*this.zoom),t=(this.top-this.bottom)/(2*this.zoom),n=(this.right+this.left)/2,r=(this.top+this.bottom)/2,i=n-e,a=n+e,o=r+t,s=r-t;if(this.view!==null&&this.view.enabled){let e=(this.right-this.left)/this.view.fullWidth/this.zoom,t=(this.top-this.bottom)/this.view.fullHeight/this.zoom;i+=e*this.view.offsetX,a=i+e*this.view.width,o-=t*this.view.offsetY,s=o-t*this.view.height}this.projectionMatrix.makeOrthographic(i,a,o,s,this.near,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){let t=super.toJSON(e);return t.object.zoom=this.zoom,t.object.left=this.left,t.object.right=this.right,t.object.top=this.top,t.object.bottom=this.bottom,t.object.near=this.near,t.object.far=this.far,this.view!==null&&(t.object.view=Object.assign({},this.view)),t}},gs=class extends ns{constructor(){super(new hs(-5,5,5,-5,.5,500)),this.isDirectionalLightShadow=!0}},_s=class extends Zo{constructor(e,t){super(e,t),this.isDirectionalLight=!0,this.type=`DirectionalLight`,this.position.copy(Dn.DEFAULT_UP),this.updateMatrix(),this.target=new Dn,this.shadow=new gs}dispose(){super.dispose(),this.shadow.dispose()}copy(e){return super.copy(e),this.target=e.target.clone(),this.shadow=e.shadow.clone(),this}toJSON(e){let t=super.toJSON(e);return t.object.shadow=this.shadow.toJSON(),t.object.target=this.target.uuid,t}},vs=class{static extractUrlBase(e){let t=e.lastIndexOf(`/`);return t===-1?`./`:e.slice(0,t+1)}static resolveURL(e,t){return typeof e!=`string`||e===``?``:(/^https?:\/\//i.test(t)&&/^\//.test(e)&&(t=t.replace(/(^https?:\/\/[^\/]+).*/i,`$1`)),/^(https?:)?\/\//i.test(e)||/^data:.*,.*$/i.test(e)||/^blob:.*$/i.test(e)?e:t+e)}},ys=new WeakMap,bs=class extends Wo{constructor(e){super(e),this.isImageBitmapLoader=!0,typeof createImageBitmap>`u`&&G(`ImageBitmapLoader: createImageBitmap() not supported.`),typeof fetch>`u`&&G(`ImageBitmapLoader: fetch() not supported.`),this.options={premultiplyAlpha:`none`},this._abortController=new AbortController}setOptions(e){return this.options=e,this}load(e,t,n,r){e===void 0&&(e=``),this.path!==void 0&&(e=this.path+e),e=this.manager.resolveURL(e);let i=this,a=Vo.get(`image-bitmap:${e}`);if(a!==void 0){if(i.manager.itemStart(e),a.then){a.then(n=>{ys.has(a)===!0?(r&&r(ys.get(a)),i.manager.itemError(e),i.manager.itemEnd(e)):(t&&t(n),i.manager.itemEnd(e))});return}setTimeout(function(){t&&t(a),i.manager.itemEnd(e)},0);return}let o={};o.credentials=this.withCredentials||this.crossOrigin!==`anonymous`?`include`:`same-origin`,o.headers=this.requestHeader,o.priority=this.priority,o.cache=this.cache,o.signal=typeof AbortSignal.any==`function`?AbortSignal.any([this._abortController.signal,this.manager.abortController.signal]):this._abortController.signal;let s=fetch(e,o).then(function(e){return e.blob()}).then(function(e){return createImageBitmap(e,Object.assign({},i.options,{colorSpaceConversion:`none`}))}).then(function(n){return Vo.add(`image-bitmap:${e}`,n),t&&t(n),i.manager.itemEnd(e),n}).catch(function(t){r&&r(t),ys.set(s,t),Vo.remove(`image-bitmap:${e}`),i.manager.itemError(e),i.manager.itemEnd(e)});Vo.add(`image-bitmap:${e}`,s),i.manager.itemStart(e)}abort(){return this._abortController.abort(),this._abortController=new AbortController,this}},xs=-90,Ss=1,Cs=class extends Dn{constructor(e,t,n){super(),this.type=`CubeCamera`,this.renderTarget=n,this.coordinateSystem=null,this.activeMipmapLevel=0;let r=new us(xs,Ss,e,t);r.layers=this.layers,this.add(r);let i=new us(xs,Ss,e,t);i.layers=this.layers,this.add(i);let a=new us(xs,Ss,e,t);a.layers=this.layers,this.add(a);let o=new us(xs,Ss,e,t);o.layers=this.layers,this.add(o);let s=new us(xs,Ss,e,t);s.layers=this.layers,this.add(s);let c=new us(xs,Ss,e,t);c.layers=this.layers,this.add(c)}updateCoordinateSystem(){let e=this.coordinateSystem,t=this.children.concat(),[n,r,i,a,o,s]=t;for(let e of t)this.remove(e);if(e===2e3)n.up.set(0,1,0),n.lookAt(1,0,0),r.up.set(0,1,0),r.lookAt(-1,0,0),i.up.set(0,0,-1),i.lookAt(0,1,0),a.up.set(0,0,1),a.lookAt(0,-1,0),o.up.set(0,1,0),o.lookAt(0,0,1),s.up.set(0,1,0),s.lookAt(0,0,-1);else if(e===2001)n.up.set(0,-1,0),n.lookAt(-1,0,0),r.up.set(0,-1,0),r.lookAt(1,0,0),i.up.set(0,0,1),i.lookAt(0,1,0),a.up.set(0,0,-1),a.lookAt(0,-1,0),o.up.set(0,-1,0),o.lookAt(0,0,1),s.up.set(0,-1,0),s.lookAt(0,0,-1);else throw Error(`THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: `+e);for(let e of t)this.add(e),e.updateMatrixWorld()}update(e,t){this.parent===null&&this.updateMatrixWorld();let{renderTarget:n,activeMipmapLevel:r}=this;this.coordinateSystem!==e.coordinateSystem&&(this.coordinateSystem=e.coordinateSystem,this.updateCoordinateSystem());let[i,a,o,s,c,l]=this.children,u=e.getRenderTarget(),d=e.getActiveCubeFace(),f=e.getActiveMipmapLevel(),p=e.xr.enabled;e.xr.enabled=!1;let m=n.texture.mipmapsAutoUpdate;n.texture.mipmapsAutoUpdate=!1;let h=!1;h=e.isWebGLRenderer===!0?e.state.buffers.depth.getReversed():e.reversedDepthBuffer,e.setRenderTarget(n,0,r),h&&e.autoClear===!1&&e.clearDepth(),e.render(t,i),e.setRenderTarget(n,1,r),h&&e.autoClear===!1&&e.clearDepth(),e.render(t,a),e.setRenderTarget(n,2,r),h&&e.autoClear===!1&&e.clearDepth(),e.render(t,o),e.setRenderTarget(n,3,r),h&&e.autoClear===!1&&e.clearDepth(),e.render(t,s),e.setRenderTarget(n,4,r),h&&e.autoClear===!1&&e.clearDepth(),e.render(t,c),n.texture.mipmapsAutoUpdate=m,e.setRenderTarget(n,5,r),h&&e.autoClear===!1&&e.clearDepth(),e.render(t,l),e.setRenderTarget(u,d,f),e.xr.enabled=p,n.texture.needsPMREMUpdate=!0}},ws=class extends us{constructor(e=[]){super(),this.isArrayCamera=!0,this.isMultiViewCamera=!1,this.cameras=e,this.perCameraFrustumCulled=!1}},Ts=class{constructor(){this._previousTime=0,this._currentTime=0,this._startTime=performance.now(),this._delta=0,this._elapsed=0,this._timescale=1,this._document=null,this._pageVisibilityHandler=null}connect(e){this._document=e,e.hidden!==void 0&&(this._pageVisibilityHandler=Es.bind(this),e.addEventListener(`visibilitychange`,this._pageVisibilityHandler,!1))}disconnect(){this._pageVisibilityHandler!==null&&(this._document.removeEventListener(`visibilitychange`,this._pageVisibilityHandler),this._pageVisibilityHandler=null),this._document=null}getDelta(){return this._delta/1e3}getElapsed(){return this._elapsed/1e3}getTimescale(){return this._timescale}setTimescale(e){return this._timescale=e,this}reset(){return this._currentTime=performance.now()-this._startTime,this}dispose(){this.disconnect()}update(e){return this._pageVisibilityHandler!==null&&this._document.hidden===!0?this._delta=0:(this._previousTime=this._currentTime,this._currentTime=(e===void 0?performance.now():e)-this._startTime,this._delta=(this._currentTime-this._previousTime)*this._timescale,this._elapsed+=this._delta),this}};function Es(){this._document.hidden===!1&&this.reset()}var Ds=class{constructor(e,t,n){this.binding=e,this.valueSize=n;let r,i,a;switch(t){case`quaternion`:r=this._slerp,i=this._slerpAdditive,a=this._setAdditiveIdentityQuaternion,this.buffer=new Float64Array(n*6),this._workIndex=5;break;case`string`:case`bool`:r=this._select,i=this._select,a=this._setAdditiveIdentityOther,this.buffer=Array(n*5);break;default:r=this._lerp,i=this._lerpAdditive,a=this._setAdditiveIdentityNumeric,this.buffer=new Float64Array(n*5)}this._mixBufferRegion=r,this._mixBufferRegionAdditive=i,this._setIdentity=a,this._origIndex=3,this._addIndex=4,this.cumulativeWeight=0,this.cumulativeWeightAdditive=0,this.useCount=0,this.referenceCount=0}accumulate(e,t){let n=this.buffer,r=this.valueSize,i=e*r+r,a=this.cumulativeWeight;if(a===0){for(let e=0;e!==r;++e)n[i+e]=n[e];a=t}else{a+=t;let e=t/a;this._mixBufferRegion(n,i,0,e,r)}this.cumulativeWeight=a}accumulateAdditive(e){let t=this.buffer,n=this.valueSize,r=n*this._addIndex;this.cumulativeWeightAdditive===0&&this._setIdentity(),this._mixBufferRegionAdditive(t,r,0,e,n),this.cumulativeWeightAdditive+=e}apply(e){let t=this.valueSize,n=this.buffer,r=e*t+t,i=this.cumulativeWeight,a=this.cumulativeWeightAdditive,o=this.binding;if(this.cumulativeWeight=0,this.cumulativeWeightAdditive=0,i<1){let e=t*this._origIndex;this._mixBufferRegion(n,r,e,1-i,t)}a>0&&this._mixBufferRegionAdditive(n,r,this._addIndex*t,1,t);for(let e=t,i=t+t;e!==i;++e)if(n[e]!==n[e+t]){o.setValue(n,r);break}}saveOriginalState(){let e=this.binding,t=this.buffer,n=this.valueSize,r=n*this._origIndex;e.getValue(t,r);for(let e=n,i=r;e!==i;++e)t[e]=t[r+e%n];this._setIdentity(),this.cumulativeWeight=0,this.cumulativeWeightAdditive=0}restoreOriginalState(){let e=this.valueSize*3;this.binding.setValue(this.buffer,e)}_setAdditiveIdentityNumeric(){let e=this._addIndex*this.valueSize,t=e+this.valueSize;for(let n=e;n<t;n++)this.buffer[n]=0}_setAdditiveIdentityQuaternion(){this._setAdditiveIdentityNumeric(),this.buffer[this._addIndex*this.valueSize+3]=1}_setAdditiveIdentityOther(){let e=this._origIndex*this.valueSize,t=this._addIndex*this.valueSize;for(let n=0;n<this.valueSize;n++)this.buffer[t+n]=this.buffer[e+n]}_select(e,t,n,r,i){if(r>=.5)for(let r=0;r!==i;++r)e[t+r]=e[n+r]}_slerp(e,t,n,r){At.slerpFlat(e,t,e,t,e,n,r)}_slerpAdditive(e,t,n,r,i){let a=this._workIndex*i;At.multiplyQuaternionsFlat(e,a,e,t,e,n),At.slerpFlat(e,t,e,t,e,a,r)}_lerp(e,t,n,r,i){let a=1-r;for(let o=0;o!==i;++o){let i=t+o;e[i]=e[i]*a+e[n+o]*r}}_lerpAdditive(e,t,n,r,i){for(let a=0;a!==i;++a){let i=t+a;e[i]=e[i]+e[n+a]*r}}},Os=`\\[\\]\\.:\\/`,ks=RegExp(`[\\[\\]\\.:\\/]`,`g`),As=`[^\\[\\]\\.:\\/]`,js=`[^`+Os.replace(`\\.`,``)+`]`,Ms=`((?:WC+[\\/:])*)`.replace(`WC`,As),Ns=`(WCOD+)?`.replace(`WCOD`,js),Ps=`(?:\\.(WC+)(?:\\[(.+)\\])?)?`.replace(`WC`,As),Fs=`\\.(WC+)(?:\\[(.+)\\])?`.replace(`WC`,As),Is=RegExp(`^`+Ms+Ns+Ps+Fs+`$`),Ls=[`material`,`materials`,`bones`,`map`],Rs=class{constructor(e,t,n){let r=n||zs.parseTrackName(t);this._targetGroup=e,this._bindings=e.subscribe_(t,r)}getValue(e,t){this.bind();let n=this._targetGroup.nCachedObjects_,r=this._bindings[n];r!==void 0&&r.getValue(e,t)}setValue(e,t){let n=this._bindings;for(let r=this._targetGroup.nCachedObjects_,i=n.length;r!==i;++r)n[r].setValue(e,t)}bind(){let e=this._bindings;for(let t=this._targetGroup.nCachedObjects_,n=e.length;t!==n;++t)e[t].bind()}unbind(){let e=this._bindings;for(let t=this._targetGroup.nCachedObjects_,n=e.length;t!==n;++t)e[t].unbind()}},zs=class e{constructor(t,n,r){this.path=n,this.parsedPath=r||e.parseTrackName(n),this.node=e.findNode(t,this.parsedPath.nodeName),this.rootNode=t,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}static create(t,n,r){return t&&t.isAnimationObjectGroup?new e.Composite(t,n,r):new e(t,n,r)}static sanitizeNodeName(e){return e.replace(/\s/g,`_`).replace(ks,``)}static parseTrackName(e){let t=Is.exec(e);if(t===null)throw Error(`THREE.PropertyBinding: Cannot parse trackName: `+e);let n={nodeName:t[2],objectName:t[3],objectIndex:t[4],propertyName:t[5],propertyIndex:t[6]},r=n.nodeName&&n.nodeName.lastIndexOf(`.`);if(r!==void 0&&r!==-1){let e=n.nodeName.substring(r+1);Ls.indexOf(e)!==-1&&(n.nodeName=n.nodeName.substring(0,r),n.objectName=e)}if(n.propertyName===null||n.propertyName.length===0)throw Error(`THREE.PropertyBinding: can not parse propertyName from trackName: `+e);return n}static findNode(e,t){if(t===void 0||t===``||t===`.`||t===-1||t===e.name||t===e.uuid)return e;if(e.skeleton){let n=e.skeleton.getBoneByName(t);if(n!==void 0)return n}if(e.children){let n=function(e){for(let r=0;r<e.length;r++){let i=e[r];if(i.name===t||i.uuid===t)return i;let a=n(i.children);if(a)return a}return null},r=n(e.children);if(r)return r}return null}_getValue_unavailable(){}_setValue_unavailable(){}_getValue_direct(e,t){e[t]=this.targetObject[this.propertyName]}_getValue_array(e,t){let n=this.resolvedProperty;for(let r=0,i=n.length;r!==i;++r)e[t++]=n[r]}_getValue_arrayElement(e,t){e[t]=this.resolvedProperty[this.propertyIndex]}_getValue_toArray(e,t){this.resolvedProperty.toArray(e,t)}_setValue_direct(e,t){this.targetObject[this.propertyName]=e[t]}_setValue_direct_setNeedsUpdate(e,t){this.targetObject[this.propertyName]=e[t],this.targetObject.needsUpdate=!0}_setValue_direct_setMatrixWorldNeedsUpdate(e,t){this.targetObject[this.propertyName]=e[t],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_array(e,t){let n=this.resolvedProperty;for(let r=0,i=n.length;r!==i;++r)n[r]=e[t++]}_setValue_array_setNeedsUpdate(e,t){let n=this.resolvedProperty;for(let r=0,i=n.length;r!==i;++r)n[r]=e[t++];this.targetObject.needsUpdate=!0}_setValue_array_setMatrixWorldNeedsUpdate(e,t){let n=this.resolvedProperty;for(let r=0,i=n.length;r!==i;++r)n[r]=e[t++];this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_arrayElement(e,t){this.resolvedProperty[this.propertyIndex]=e[t]}_setValue_arrayElement_setNeedsUpdate(e,t){this.resolvedProperty[this.propertyIndex]=e[t],this.targetObject.needsUpdate=!0}_setValue_arrayElement_setMatrixWorldNeedsUpdate(e,t){this.resolvedProperty[this.propertyIndex]=e[t],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_fromArray(e,t){this.resolvedProperty.fromArray(e,t)}_setValue_fromArray_setNeedsUpdate(e,t){this.resolvedProperty.fromArray(e,t),this.targetObject.needsUpdate=!0}_setValue_fromArray_setMatrixWorldNeedsUpdate(e,t){this.resolvedProperty.fromArray(e,t),this.targetObject.matrixWorldNeedsUpdate=!0}_getValue_unbound(e,t){this.bind(),this.getValue(e,t)}_setValue_unbound(e,t){this.bind(),this.setValue(e,t)}bind(){let t=this.node,n=this.parsedPath,r=n.objectName,i=n.propertyName,a=n.propertyIndex;if(t||(t=e.findNode(this.rootNode,n.nodeName),this.node=t),this.getValue=this._getValue_unavailable,this.setValue=this._setValue_unavailable,!t){G(`PropertyBinding: No target node found for track: `+this.path+`.`);return}if(r){let e=n.objectIndex;switch(r){case`materials`:if(!t.material){K(`PropertyBinding: Can not bind to material as node does not have a material.`,this);return}if(!t.material.materials){K(`PropertyBinding: Can not bind to material.materials as node.material does not have a materials array.`,this);return}t=t.material.materials;break;case`bones`:if(!t.skeleton){K(`PropertyBinding: Can not bind to bones as node does not have a skeleton.`,this);return}t=t.skeleton.bones;for(let n=0;n<t.length;n++)if(t[n].name===e){e=n;break}break;case`map`:if(`map`in t){t=t.map;break}if(!t.material){K(`PropertyBinding: Can not bind to material as node does not have a material.`,this);return}if(!t.material.map){K(`PropertyBinding: Can not bind to material.map as node.material does not have a map.`,this);return}t=t.material.map;break;default:if(t[r]===void 0){K(`PropertyBinding: Can not bind to objectName of node undefined.`,this);return}t=t[r]}if(e!==void 0){if(t[e]===void 0){K(`PropertyBinding: Trying to bind to objectIndex of objectName, but is undefined.`,this,t);return}t=t[e]}}let o=t[i];if(o===void 0){let e=n.nodeName;K(`PropertyBinding: Trying to update property for track: `+e+`.`+i+` but it wasn't found.`,t);return}let s=this.Versioning.None;this.targetObject=t,t.isMaterial===!0?s=this.Versioning.NeedsUpdate:t.isObject3D===!0&&(s=this.Versioning.MatrixWorldNeedsUpdate);let c=this.BindingType.Direct;if(a!==void 0){if(i===`morphTargetInfluences`){if(!t.geometry){K(`PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.`,this);return}if(!t.geometry.morphAttributes){K(`PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.morphAttributes.`,this);return}t.morphTargetDictionary[a]!==void 0&&(a=t.morphTargetDictionary[a])}c=this.BindingType.ArrayElement,this.resolvedProperty=o,this.propertyIndex=a}else o.fromArray!==void 0&&o.toArray!==void 0?(c=this.BindingType.HasFromToArray,this.resolvedProperty=o):Array.isArray(o)?(c=this.BindingType.EntireArray,this.resolvedProperty=o):this.propertyName=i;this.getValue=this.GetterByBindingType[c],this.setValue=this.SetterByBindingTypeAndVersioning[c][s]}unbind(){this.node=null,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}};zs.Composite=Rs,zs.prototype.BindingType={Direct:0,EntireArray:1,ArrayElement:2,HasFromToArray:3},zs.prototype.Versioning={None:0,NeedsUpdate:1,MatrixWorldNeedsUpdate:2},zs.prototype.GetterByBindingType=[zs.prototype._getValue_direct,zs.prototype._getValue_array,zs.prototype._getValue_arrayElement,zs.prototype._getValue_toArray],zs.prototype.SetterByBindingTypeAndVersioning=[[zs.prototype._setValue_direct,zs.prototype._setValue_direct_setNeedsUpdate,zs.prototype._setValue_direct_setMatrixWorldNeedsUpdate],[zs.prototype._setValue_array,zs.prototype._setValue_array_setNeedsUpdate,zs.prototype._setValue_array_setMatrixWorldNeedsUpdate],[zs.prototype._setValue_arrayElement,zs.prototype._setValue_arrayElement_setNeedsUpdate,zs.prototype._setValue_arrayElement_setMatrixWorldNeedsUpdate],[zs.prototype._setValue_fromArray,zs.prototype._setValue_fromArray_setNeedsUpdate,zs.prototype._setValue_fromArray_setMatrixWorldNeedsUpdate]];var Bs=class{constructor(e,t,n=null,r=t.blendMode){this._mixer=e,this._clip=t,this._localRoot=n,this.blendMode=r;let i=t.tracks,a=i.length,o=Array(a),s={endingStart:U,endingEnd:U};for(let e=0;e!==a;++e){let t=i[e].createInterpolant(null);o[e]=t,t.settings=s}this._interpolantSettings=s,this._interpolants=o,this._propertyBindings=Array(a),this._cacheIndex=null,this._byClipCacheIndex=null,this._timeScaleInterpolant=null,this._restoreTimeScale=null,this._weightInterpolant=null,this.loop=V,this._loopCount=-1,this._startTime=null,this.time=0,this.timeScale=1,this._effectiveTimeScale=1,this.weight=1,this._effectiveWeight=1,this.repetitions=1/0,this.paused=!1,this.enabled=!0,this.clampWhenFinished=!1,this.zeroSlopeAtStart=!0,this.zeroSlopeAtEnd=!0}play(){return this._mixer._activateAction(this),this}stop(){return this._mixer._deactivateAction(this),this.reset()}reset(){return this.paused=!1,this.enabled=!0,this.time=0,this._loopCount=-1,this._startTime=null,this.stopFading().stopWarping()}isRunning(){return this.enabled&&!this.paused&&this.timeScale!==0&&this._startTime===null&&this._mixer._isActiveAction(this)}isScheduled(){return this._mixer._isActiveAction(this)}startAt(e){return this._startTime=e,this}setLoop(e,t){return this.loop=e,this.repetitions=t,this}setEffectiveWeight(e){return this.weight=e,this._effectiveWeight=this.enabled?e:0,this.stopFading()}getEffectiveWeight(){return this._effectiveWeight}fadeIn(e){return this._scheduleFading(e,0,1)}fadeOut(e){return this._scheduleFading(e,1,0)}crossFadeFrom(e,t,n=!1){if(e.fadeOut(t),this.fadeIn(t),n===!0){let n=this._clip.duration,r=e._clip.duration,i=r/n,a=n/r;e._restoreTimeScale=e.timeScale,this._restoreTimeScale=this.timeScale,e.warp(1,i,t),this.warp(a,1,t)}return this}crossFadeTo(e,t,n=!1){return e.crossFadeFrom(this,t,n)}stopFading(){let e=this._weightInterpolant;return e!==null&&(this._weightInterpolant=null,this._mixer._takeBackControlInterpolant(e)),this}setEffectiveTimeScale(e){return this.timeScale=e,this._effectiveTimeScale=this.paused?0:e,this.stopWarping()}getEffectiveTimeScale(){return this._effectiveTimeScale}setDuration(e){return this.timeScale=this._clip.duration/e,this.stopWarping()}syncWith(e){return this.time=e.time,this.timeScale=e.timeScale,this.stopWarping()}halt(e){return this.warp(this._effectiveTimeScale,0,e)}warp(e,t,n){let r=this._mixer,i=r.time,a=this.timeScale,o=this._timeScaleInterpolant;o===null&&(o=r._lendControlInterpolant(),this._timeScaleInterpolant=o);let s=o.parameterPositions,c=o.sampleValues;return s[0]=i,s[1]=i+n,c[0]=e/a,c[1]=t/a,this}stopWarping(){let e=this._timeScaleInterpolant;return e!==null&&(this._timeScaleInterpolant=null,this._mixer._takeBackControlInterpolant(e)),this._restoreTimeScale=null,this}getMixer(){return this._mixer}getClip(){return this._clip}getRoot(){return this._localRoot||this._mixer._root}_update(e,t,n,r){if(!this.enabled){this._updateWeight(e);return}let i=this._startTime;if(i!==null){let r=(e-i)*n;r<0||n===0?t=0:(this._startTime=null,t=n*r)}t*=this._updateTimeScale(e);let a=this._updateTime(t),o=this._updateWeight(e);if(o>0){let e=this._interpolants,t=this._propertyBindings;switch(this.blendMode){case Fe:for(let n=0,r=e.length;n!==r;++n)e[n].evaluate(a),t[n].accumulateAdditive(o);break;case Pe:default:for(let n=0,i=e.length;n!==i;++n)e[n].evaluate(a),t[n].accumulate(r,o)}}}_updateWeight(e){let t=0;if(this.enabled){t=this.weight;let n=this._weightInterpolant;if(n!==null){let r=n.evaluate(e)[0];t*=r,e>n.parameterPositions[1]&&(this.stopFading(),r===0&&(this.enabled=!1))}}return this._effectiveWeight=t,t}_updateTimeScale(e){let t=0;if(!this.paused){t=this.timeScale;let n=this._timeScaleInterpolant;if(n!==null){let r=n.evaluate(e)[0];t*=r,e>n.parameterPositions[1]&&(t===0?this.paused=!0:(this._restoreTimeScale!==null&&(t=this._restoreTimeScale),this.timeScale=t),this.stopWarping())}}return this._effectiveTimeScale=t,t}_updateTime(e){let t=this._clip.duration,n=this.loop,r=this.time+e,i=this._loopCount,a=n===ke;if(e===0)return i===-1?r:a&&(i&1)==1?t-r:r;if(n===2200){i===-1&&(this._loopCount=0,this._setEndings(!0,!0,!1));handle_stop:{if(r>=t)r=t;else if(r<0)r=0;else{this.time=r;break handle_stop}this.clampWhenFinished?this.paused=!0:this.enabled=!1,this.time=r,this._mixer.dispatchEvent({type:`finished`,action:this,direction:e<0?-1:1})}}else{if(i===-1&&(e>=0?(i=0,this._setEndings(!0,this.repetitions===0,a)):this._setEndings(this.repetitions===0,!0,a)),r>=t||r<0){let n=Math.floor(r/t);r-=t*n,i+=Math.abs(n);let o=this.repetitions-i;if(o<=0)this.clampWhenFinished?this.paused=!0:this.enabled=!1,r=e>0?t:0,this.time=r,this._mixer.dispatchEvent({type:`finished`,action:this,direction:e>0?1:-1});else{if(o===1){let t=e<0;this._setEndings(t,!t,a)}else this._setEndings(!1,!1,a);this._loopCount=i,this.time=r,this._mixer.dispatchEvent({type:`loop`,action:this,loopDelta:n})}}else this._loopCount=i,this.time=r;if(a&&(i&1)==1)return t-r}return r}_setEndings(e,t,n){let r=this._interpolantSettings;n?(r.endingStart=W,r.endingEnd=W):(r.endingStart=e?this.zeroSlopeAtStart?W:U:Ne,r.endingEnd=t?this.zeroSlopeAtEnd?W:U:Ne)}_scheduleFading(e,t,n){let r=this._mixer,i=r.time,a=this._weightInterpolant;a===null&&(a=r._lendControlInterpolant(),this._weightInterpolant=a);let o=a.parameterPositions,s=a.sampleValues;return o[0]=i,s[0]=t,o[1]=i+e,s[1]=n,this}},Vs=new Float32Array(1),Hs=class extends tt{constructor(e){super(),this._root=e,this._initMemoryManager(),this._accuIndex=0,this.time=0,this.timeScale=1,typeof __THREE_DEVTOOLS__<`u`&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent(`observe`,{detail:this}))}_bindAction(e,t){let n=e._localRoot||this._root,r=e._clip.tracks,i=r.length,a=e._propertyBindings,o=e._interpolants,s=n.uuid,c=this._bindingsByRootAndName,l=c[s];l===void 0&&(l={},c[s]=l);for(let e=0;e!==i;++e){let i=r[e],c=i.name,u=l[c];if(u!==void 0)++u.referenceCount,a[e]=u;else{if(u=a[e],u!==void 0){u._cacheIndex===null&&(++u.referenceCount,this._addInactiveBinding(u,s,c));continue}let r=t&&t._propertyBindings[e].binding.parsedPath;u=new Ds(zs.create(n,c,r),i.ValueTypeName,i.getValueSize()),++u.referenceCount,this._addInactiveBinding(u,s,c),a[e]=u}o[e].resultBuffer=u.buffer}}_activateAction(e){if(!this._isActiveAction(e)){if(e._cacheIndex===null){let t=(e._localRoot||this._root).uuid,n=e._clip.uuid,r=this._actionsByClip[n];this._bindAction(e,r&&r.knownActions[0]),this._addInactiveAction(e,n,t)}let t=e._propertyBindings;for(let e=0,n=t.length;e!==n;++e){let n=t[e];n.useCount++===0&&(this._lendBinding(n),n.saveOriginalState())}this._lendAction(e)}}_deactivateAction(e){if(this._isActiveAction(e)){let t=e._propertyBindings;for(let e=0,n=t.length;e!==n;++e){let n=t[e];--n.useCount===0&&(n.restoreOriginalState(),this._takeBackBinding(n))}this._takeBackAction(e)}}_initMemoryManager(){this._actions=[],this._nActiveActions=0,this._actionsByClip={},this._bindings=[],this._nActiveBindings=0,this._bindingsByRootAndName={},this._controlInterpolants=[],this._nActiveControlInterpolants=0;let e=this;this.stats={actions:{get total(){return e._actions.length},get inUse(){return e._nActiveActions}},bindings:{get total(){return e._bindings.length},get inUse(){return e._nActiveBindings}},controlInterpolants:{get total(){return e._controlInterpolants.length},get inUse(){return e._nActiveControlInterpolants}}}}_isActiveAction(e){let t=e._cacheIndex;return t!==null&&t<this._nActiveActions}_addInactiveAction(e,t,n){let r=this._actions,i=this._actionsByClip,a=i[t];if(a===void 0)a={knownActions:[e],actionByRoot:{}},e._byClipCacheIndex=0,i[t]=a;else{let t=a.knownActions;e._byClipCacheIndex=t.length,t.push(e)}e._cacheIndex=r.length,r.push(e),a.actionByRoot[n]=e}_removeInactiveAction(e){let t=this._actions,n=t[t.length-1],r=e._cacheIndex;n._cacheIndex=r,t[r]=n,t.pop(),e._cacheIndex=null;let i=e._clip.uuid,a=this._actionsByClip,o=a[i],s=o.knownActions,c=s[s.length-1],l=e._byClipCacheIndex;c._byClipCacheIndex=l,s[l]=c,s.pop(),e._byClipCacheIndex=null;let u=o.actionByRoot,d=(e._localRoot||this._root).uuid;delete u[d],s.length===0&&delete a[i],this._removeInactiveBindingsForAction(e)}_removeInactiveBindingsForAction(e){let t=e._propertyBindings;for(let e=0,n=t.length;e!==n;++e){let n=t[e];--n.referenceCount===0&&this._removeInactiveBinding(n)}}_lendAction(e){let t=this._actions,n=e._cacheIndex,r=this._nActiveActions++,i=t[r];e._cacheIndex=r,t[r]=e,i._cacheIndex=n,t[n]=i}_takeBackAction(e){let t=this._actions,n=e._cacheIndex,r=--this._nActiveActions,i=t[r];e._cacheIndex=r,t[r]=e,i._cacheIndex=n,t[n]=i}_addInactiveBinding(e,t,n){let r=this._bindingsByRootAndName,i=this._bindings,a=r[t];a===void 0&&(a={},r[t]=a),a[n]=e,e._cacheIndex=i.length,i.push(e)}_removeInactiveBinding(e){let t=this._bindings,n=e.binding,r=n.rootNode.uuid,i=n.path,a=this._bindingsByRootAndName,o=a[r],s=t[t.length-1],c=e._cacheIndex;s._cacheIndex=c,t[c]=s,t.pop(),delete o[i],Object.keys(o).length===0&&delete a[r]}_lendBinding(e){let t=this._bindings,n=e._cacheIndex,r=this._nActiveBindings++,i=t[r];e._cacheIndex=r,t[r]=e,i._cacheIndex=n,t[n]=i}_takeBackBinding(e){let t=this._bindings,n=e._cacheIndex,r=--this._nActiveBindings,i=t[r];e._cacheIndex=r,t[r]=e,i._cacheIndex=n,t[n]=i}_lendControlInterpolant(){let e=this._controlInterpolants,t=this._nActiveControlInterpolants++,n=e[t];return n===void 0&&(n=new So(new Float32Array(2),new Float32Array(2),1,Vs),n.__cacheIndex=t,e[t]=n),n}_takeBackControlInterpolant(e){let t=this._controlInterpolants,n=e.__cacheIndex,r=--this._nActiveControlInterpolants,i=t[r];e.__cacheIndex=r,t[r]=e,i.__cacheIndex=n,t[n]=i}clipAction(e,t,n){let r=t||this._root,i=r.uuid,a=typeof e==`string`?Ro.findByName(r,e):e,o=a===null?e:a.uuid,s=this._actionsByClip[o],c=null;if(n===void 0&&(n=a===null?Pe:a.blendMode),s!==void 0){let e=s.actionByRoot[i];if(e!==void 0&&e.blendMode===n)return e;c=s.knownActions[0],a===null&&(a=c._clip)}if(a===null)return null;let l=new Bs(this,a,t,n);return this._bindAction(l,c),this._addInactiveAction(l,o,i),l}existingAction(e,t){let n=t||this._root,r=n.uuid,i=typeof e==`string`?Ro.findByName(n,e):e,a=i?i.uuid:e,o=this._actionsByClip[a];return o===void 0?null:o.actionByRoot[r]||null}stopAllAction(){let e=this._actions,t=this._nActiveActions;for(let n=t-1;n>=0;--n)e[n].stop();return this}update(e){e*=this.timeScale;let t=this._actions,n=this._nActiveActions,r=this.time+=e,i=Math.sign(e),a=this._accuIndex^=1;for(let o=0;o!==n;++o)t[o]._update(r,e,i,a);let o=this._bindings,s=this._nActiveBindings;for(let e=0;e!==s;++e)o[e].apply(a);return this}setTime(e){this.time=0;for(let e=0;e<this._actions.length;e++)this._actions[e].time=0;return this.update(e)}getRoot(){return this._root}uncacheClip(e){let t=this._actions,n=e.uuid,r=this._actionsByClip,i=r[n];if(i!==void 0){let e=i.knownActions;for(let n=0,r=e.length;n!==r;++n){let r=e[n];this._deactivateAction(r);let i=r._cacheIndex,a=t[t.length-1];r._cacheIndex=null,r._byClipCacheIndex=null,a._cacheIndex=i,t[i]=a,t.pop(),this._removeInactiveBindingsForAction(r)}delete r[n]}}uncacheRoot(e){let t=e.uuid,n=this._actionsByClip;for(let e in n){let r=n[e].actionByRoot[t];r!==void 0&&(this._deactivateAction(r),this._removeInactiveAction(r))}let r=this._bindingsByRootAndName[t];if(r!==void 0)for(let e in r){let t=r[e];t.restoreOriginalState(),this._removeInactiveBinding(t)}}uncacheAction(e,t){let n=this.existingAction(e,t);n!==null&&(this._deactivateAction(n),this._removeInactiveAction(n))}};(class{static{this.prototype.isMatrix2=!0}constructor(e,t,n,r){this.elements=[1,0,0,1],e!==void 0&&this.set(e,t,n,r)}identity(){return this.set(1,0,0,1),this}fromArray(e,t=0){for(let n=0;n<4;n++)this.elements[n]=e[n+t];return this}set(e,t,n,r){let i=this.elements;return i[0]=e,i[2]=t,i[1]=n,i[3]=r,this}});function Us(e,t,n,r){let i=Ws(r);switch(n){case C:return e*t;case O:return e*t/i.components*i.byteLength;case k:return e*t/i.components*i.byteLength;case A:return e*t*2/i.components*i.byteLength;case j:return e*t*2/i.components*i.byteLength;case w:return e*t*3/i.components*i.byteLength;case T:return e*t*4/i.components*i.byteLength;case M:return e*t*4/i.components*i.byteLength;case ee:case N:return Math.floor((e+3)/4)*Math.floor((t+3)/4)*8;case P:case F:return Math.floor((e+3)/4)*Math.floor((t+3)/4)*16;case I:case re:return Math.max(e,16)*Math.max(t,8)/4;case te:case ne:return Math.max(e,8)*Math.max(t,8)/2;case L:case ie:case R:case z:return Math.floor((e+3)/4)*Math.floor((t+3)/4)*8;case ae:case B:case oe:return Math.floor((e+3)/4)*Math.floor((t+3)/4)*16;case se:return Math.floor((e+3)/4)*Math.floor((t+3)/4)*16;case ce:return Math.floor((e+4)/5)*Math.floor((t+3)/4)*16;case le:return Math.floor((e+4)/5)*Math.floor((t+4)/5)*16;case ue:return Math.floor((e+5)/6)*Math.floor((t+4)/5)*16;case de:return Math.floor((e+5)/6)*Math.floor((t+5)/6)*16;case fe:return Math.floor((e+7)/8)*Math.floor((t+4)/5)*16;case pe:return Math.floor((e+7)/8)*Math.floor((t+5)/6)*16;case me:return Math.floor((e+7)/8)*Math.floor((t+7)/8)*16;case he:return Math.floor((e+9)/10)*Math.floor((t+4)/5)*16;case ge:return Math.floor((e+9)/10)*Math.floor((t+5)/6)*16;case _e:return Math.floor((e+9)/10)*Math.floor((t+7)/8)*16;case ve:return Math.floor((e+9)/10)*Math.floor((t+9)/10)*16;case ye:return Math.floor((e+11)/12)*Math.floor((t+9)/10)*16;case be:return Math.floor((e+11)/12)*Math.floor((t+11)/12)*16;case xe:case Se:case Ce:return Math.ceil(e/4)*Math.ceil(t/4)*16;case we:case Te:return Math.ceil(e/4)*Math.ceil(t/4)*8;case Ee:case De:return Math.ceil(e/4)*Math.ceil(t/4)*16}throw Error(`Unable to determine texture byte length for ${n} format.`)}function Ws(e){switch(e){case u:case d:return{byteLength:1,components:1};case p:case f:case _:return{byteLength:2,components:1};case v:case y:return{byteLength:2,components:4};case h:case m:case g:return{byteLength:4,components:1};case x:case S:return{byteLength:4,components:3}}throw Error(`THREE.TextureUtils: Unknown texture type ${e}.`)}typeof __THREE_DEVTOOLS__<`u`&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent(`register`,{detail:{revision:`187`}})),typeof window<`u`&&(window.__THREE__?G(`WARNING: Multiple instances of Three.js being imported.`):window.__THREE__=`187`);function Gs(){let e=null,t=!1,n=null,r=null;function i(t,a){r=e.requestAnimationFrame(i),n(t,a)}return{start:function(){t!==!0&&n!==null&&e!==null&&(r=e.requestAnimationFrame(i),t=!0)},stop:function(){e!==null&&e.cancelAnimationFrame(r),t=!1},setAnimationLoop:function(e){n=e},setContext:function(t){e=t}}}function Ks(e){let t=new WeakMap;function n(t,n){let r=t.array,i=t.usage,a=r.byteLength,o=e.createBuffer();e.bindBuffer(n,o),e.bufferData(n,r,i),t.onUploadCallback();let s;if(r instanceof Float32Array)s=e.FLOAT;else if(typeof Float16Array<`u`&&r instanceof Float16Array)s=e.HALF_FLOAT;else if(r instanceof Uint16Array)s=t.isFloat16BufferAttribute?e.HALF_FLOAT:e.UNSIGNED_SHORT;else if(r instanceof Int16Array)s=e.SHORT;else if(r instanceof Uint32Array)s=e.UNSIGNED_INT;else if(r instanceof Int32Array)s=e.INT;else if(r instanceof Int8Array)s=e.BYTE;else if(r instanceof Uint8Array)s=e.UNSIGNED_BYTE;else if(r instanceof Uint8ClampedArray)s=e.UNSIGNED_BYTE;else throw Error(`THREE.WebGLAttributes: Unsupported buffer data format: `+r);return{buffer:o,type:s,bytesPerElement:r.BYTES_PER_ELEMENT,version:t.version,size:a}}function r(t,n,r){let i=n.array,a=n.updateRanges;if(e.bindBuffer(r,t),a.length===0)e.bufferSubData(r,0,i);else{a.sort((e,t)=>e.start-t.start);let t=0;for(let e=1;e<a.length;e++){let n=a[t],r=a[e];r.start<=n.start+n.count+1?n.count=Math.max(n.count,r.start+r.count-n.start):(++t,a[t]=r)}a.length=t+1;for(let t=0,n=a.length;t<n;t++){let n=a[t];e.bufferSubData(r,n.start*i.BYTES_PER_ELEMENT,i,n.start,n.count)}n.clearUpdateRanges()}n.onUploadCallback()}function i(e){return e.isInterleavedBufferAttribute&&(e=e.data),t.get(e)}function a(n){n.isInterleavedBufferAttribute&&(n=n.data);let r=t.get(n);r&&(e.deleteBuffer(r.buffer),t.delete(n))}function o(e,i){if(e.isInterleavedBufferAttribute&&(e=e.data),e.isGLBufferAttribute){let n=t.get(e);(!n||n.version<e.version)&&t.set(e,{buffer:e.buffer,type:e.type,bytesPerElement:e.elementSize,version:e.version});return}let a=t.get(e);if(a===void 0)t.set(e,n(e,i));else if(a.version<e.version){if(a.size!==e.array.byteLength)throw Error(`THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.`);r(a.buffer,e,i),a.version=e.version}}return{get:i,remove:a,update:o}}var qs={alphahash_fragment:`#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif`,alphahash_pars_fragment:`#ifdef USE_ALPHAHASH
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
#endif`,alphamap_fragment:`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`,alphamap_pars_fragment:`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,alphatest_fragment:`#ifdef USE_ALPHATEST
	#ifdef ALPHA_TO_COVERAGE
	diffuseColor.a = smoothstep( alphaTest, alphaTest + fwidth( diffuseColor.a ), diffuseColor.a );
	if ( diffuseColor.a == 0.0 ) discard;
	#else
	if ( diffuseColor.a < alphaTest ) discard;
	#endif
#endif`,alphatest_pars_fragment:`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,aomap_fragment:`#ifdef USE_AOMAP
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
#endif`,aomap_pars_fragment:`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,batching_pars_vertex:`#ifdef USE_BATCHING
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
#endif`,batching_vertex:`#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( getIndirectIndex( gl_DrawID ) );
#endif`,begin_vertex:`vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif`,beginnormal_vertex:`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,bsdfs:`float G_BlinnPhong_Implicit( ) {
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
} // validated`,iridescence_fragment:`#ifdef USE_IRIDESCENCE
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
#endif`,bumpmap_pars_fragment:`#ifdef USE_BUMPMAP
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
#endif`,clipping_planes_fragment:`#if NUM_CLIPPING_PLANES > 0
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
#endif`,clipping_planes_pars_fragment:`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,clipping_planes_pars_vertex:`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,clipping_planes_vertex:`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,color_fragment:`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#endif`,color_pars_fragment:`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#endif`,color_pars_vertex:`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	varying vec4 vColor;
#endif`,color_vertex:`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
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
#endif`,common:`#define PI 3.141592653589793
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
} // validated`,defaultnormal_vertex:`vec3 transformedNormal = objectNormal;
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
#endif`,displacementmap_pars_vertex:`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,displacementmap_vertex:`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`,emissivemap_fragment:`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	#ifdef DECODE_VIDEO_TEXTURE_EMISSIVE
		emissiveColor = sRGBTransferEOTF( emissiveColor );
	#endif
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,emissivemap_pars_fragment:`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,colorspace_fragment:`gl_FragColor = linearToOutputTexel( gl_FragColor );`,colorspace_pars_fragment:`vec4 LinearTransferOETF( in vec4 value ) {
	return value;
}
vec4 sRGBTransferEOTF( in vec4 value ) {
	return vec4( mix( pow( value.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), value.rgb * 0.0773993808, vec3( lessThanEqual( value.rgb, vec3( 0.04045 ) ) ) ), value.a );
}
vec4 sRGBTransferOETF( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}`,envmap_fragment:`#ifdef USE_ENVMAP
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
#endif`,envmap_common_pars_fragment:`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform mat3 envMapRotation;
	uniform samplerCube envMap;
	#ifdef ENVMAP_TYPE_PMREM
		float roughnessToMip( const in float roughness ) {
			float r = clamp( roughness, 0.0, 1.0 );
			return ENVMAP_MAX_LOD * r * ( 2.0 - r );
		}
	#endif
#endif`,envmap_pars_fragment:`#ifdef USE_ENVMAP
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
#endif`,envmap_pars_vertex:`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,envmap_physical_pars_fragment:`#ifdef USE_ENVMAP
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
#endif`,envmap_vertex:`#ifdef USE_ENVMAP
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
#endif`,fog_vertex:`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,fog_pars_vertex:`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,fog_fragment:`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,fog_pars_fragment:`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,gradientmap_pars_fragment:`#ifdef USE_GRADIENTMAP
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
}`,lightmap_pars_fragment:`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,lights_lambert_fragment:`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,lights_lambert_pars_fragment:`varying vec3 vViewPosition;
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
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,lights_pars_begin:`uniform bool receiveShadow;
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
#include <lightprobes_pars_fragment>`,lights_toon_fragment:`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,lights_toon_pars_fragment:`varying vec3 vViewPosition;
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
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,lights_phong_fragment:`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,lights_phong_pars_fragment:`varying vec3 vViewPosition;
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
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,lights_physical_fragment:`PhysicalMaterial material;
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
#endif`,lights_physical_pars_fragment:`uniform sampler2D dfgLUT;
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
}`,lights_fragment_begin:`
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
#endif`,lights_fragment_maps:`#if defined( RE_IndirectDiffuse )
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
#endif`,lights_fragment_end:`#if defined( RE_IndirectDiffuse )
	#if defined( LAMBERT ) || defined( PHONG )
		irradiance += iblIrradiance;
	#endif
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`,lightprobes_pars_fragment:`#if NUM_LIGHT_PROBE_GRIDS > 0
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
#endif`,logdepthbuf_fragment:`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	gl_FragDepth = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,logdepthbuf_pars_fragment:`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,logdepthbuf_pars_vertex:`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,logdepthbuf_vertex:`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	vFragDepth = 1.0 + gl_Position.w;
	vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
#endif`,map_fragment:`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = sRGBTransferEOTF( sampledDiffuseColor );
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,map_pars_fragment:`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,map_particle_fragment:`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
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
#endif`,map_particle_pars_fragment:`#if defined( USE_POINTS_UV )
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
#endif`,metalnessmap_fragment:`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`,metalnessmap_pars_fragment:`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,morphinstance_vertex:`#ifdef USE_INSTANCING_MORPH
	float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	float morphTargetBaseInfluence = texelFetch( morphTexture, ivec2( 0, gl_InstanceID ), 0 ).r;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		morphTargetInfluences[i] =  texelFetch( morphTexture, ivec2( i + 1, gl_InstanceID ), 0 ).r;
	}
#endif`,morphcolor_vertex:`#if defined( USE_MORPHCOLORS )
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
#endif`,morphnormal_vertex:`#ifdef USE_MORPHNORMALS
	objectNormal *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,morphtarget_pars_vertex:`#ifdef USE_MORPHTARGETS
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
#endif`,morphtarget_vertex:`#ifdef USE_MORPHTARGETS
	transformed *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,normal_fragment_begin:`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
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
vec3 nonPerturbedNormal = normal;`,normal_fragment_maps:`#ifdef USE_NORMALMAP_OBJECTSPACE
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
#endif`,normal_pars_fragment:`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,normal_pars_vertex:`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,normal_vertex:`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
		#ifdef FLIP_SIDED
			vBitangent = - vBitangent;
		#endif
	#endif
#endif`,normalmap_pars_fragment:`#ifdef USE_NORMALMAP
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
#endif`,clearcoat_normal_fragment_begin:`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif`,clearcoat_normal_fragment_maps:`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`,clearcoat_pars_fragment:`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`,iridescence_pars_fragment:`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,opaque_fragment:`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,packing:`vec3 packNormalToRGB( const in vec3 normal ) {
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
}`,premultiplied_alpha_fragment:`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,project_vertex:`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,dithering_fragment:`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,dithering_pars_fragment:`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,roughnessmap_fragment:`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`,roughnessmap_pars_fragment:`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,shadowmap_pars_fragment:`#if NUM_SPOT_LIGHT_COORDS > 0
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
#endif`,shadowmap_pars_vertex:`#if NUM_SPOT_LIGHT_COORDS > 0
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
#endif`,shadowmap_vertex:`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_SUN_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
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
#endif`,shadowmask_pars_fragment:`float getShadowMask() {
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
}`,skinbase_vertex:`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,skinning_pars_vertex:`#ifdef USE_SKINNING
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
#endif`,skinning_vertex:`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,skinnormal_vertex:`#ifdef USE_SKINNING
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
#endif`,specularmap_fragment:`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,specularmap_pars_fragment:`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,tonemapping_fragment:`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,tonemapping_pars_fragment:`#ifndef saturate
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
vec3 CustomToneMapping( vec3 color ) { return color; }`,transmission_fragment:`#ifdef USE_TRANSMISSION
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
#endif`,transmission_pars_fragment:`#ifdef USE_TRANSMISSION
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
#endif`,uv_pars_fragment:`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
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
#endif`,uv_pars_vertex:`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
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
#endif`,uv_vertex:`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
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
#endif`,worldpos_vertex:`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		worldPosition = batchingMatrix * worldPosition;
	#endif
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`,background_vert:`varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`,background_frag:`uniform sampler2D t2D;
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
}`,backgroundCube_vert:`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,backgroundCube_frag:`uniform float backgroundBlurriness;
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
}`,cube_vert:`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,cube_frag:`uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,depth_vert:`#include <common>
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
}`,depth_frag:`#if DEPTH_PACKING == 3200
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
}`,distance_vert:`#define DISTANCE
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
}`,distance_frag:`#define DISTANCE
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
}`,equirect_vert:`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`,equirect_frag:`uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,linedashed_vert:`uniform float scale;
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
}`,linedashed_frag:`uniform vec3 diffuse;
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
}`,meshbasic_vert:`#include <common>
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
}`,meshbasic_frag:`uniform vec3 diffuse;
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
}`,meshlambert_vert:`#define LAMBERT
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
}`,meshlambert_frag:`#define LAMBERT
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
}`,meshmatcap_vert:`#define MATCAP
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
}`,meshmatcap_frag:`#define MATCAP
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
}`,meshnormal_vert:`#define NORMAL
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
}`,meshnormal_frag:`#define NORMAL
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
}`,meshphong_vert:`#define PHONG
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
}`,meshphong_frag:`#define PHONG
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
}`,meshphysical_vert:`#define STANDARD
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
}`,meshphysical_frag:`#define STANDARD
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
}`,meshtoon_vert:`#define TOON
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
}`,meshtoon_frag:`#define TOON
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
}`,points_vert:`uniform float size;
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
}`,points_frag:`uniform vec3 diffuse;
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
}`,shadow_vert:`#include <common>
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
}`,shadow_frag:`uniform vec3 color;
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
}`,sprite_vert:`uniform float rotation;
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
}`,sprite_frag:`uniform vec3 diffuse;
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
}`},Q={common:{diffuse:{value:new X(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new Nt},alphaMap:{value:null},alphaMapTransform:{value:new Nt},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new Nt}},envmap:{envMap:{value:null},envMapRotation:{value:new Nt},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98},dfgLUT:{value:null}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new Nt}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new Nt}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new Nt},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new Nt},normalScale:{value:new q(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new Nt},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new Nt}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new Nt}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new Nt}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new X(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},sunLights:{value:[],properties:{direction:{},color:{}}},sunLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},sunShadowMatrix:{value:[]},sunShadowCascade:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null},probesSH:{value:[]},probesMin:{value:[]},probesMax:{value:[]},probesResolution:{value:[]}},points:{diffuse:{value:new X(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new Nt},alphaTest:{value:0},uvTransform:{value:new Nt}},sprite:{diffuse:{value:new X(16777215)},opacity:{value:1},center:{value:new q(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new Nt},alphaMap:{value:null},alphaMapTransform:{value:new Nt},alphaTest:{value:0}}},Js={basic:{uniforms:to([Q.common,Q.specularmap,Q.envmap,Q.aomap,Q.lightmap,Q.fog]),vertexShader:qs.meshbasic_vert,fragmentShader:qs.meshbasic_frag},lambert:{uniforms:to([Q.common,Q.specularmap,Q.envmap,Q.aomap,Q.lightmap,Q.emissivemap,Q.bumpmap,Q.normalmap,Q.displacementmap,Q.fog,Q.lights,{emissive:{value:new X(0)},envMapIntensity:{value:1}}]),vertexShader:qs.meshlambert_vert,fragmentShader:qs.meshlambert_frag},phong:{uniforms:to([Q.common,Q.specularmap,Q.envmap,Q.aomap,Q.lightmap,Q.emissivemap,Q.bumpmap,Q.normalmap,Q.displacementmap,Q.fog,Q.lights,{emissive:{value:new X(0)},specular:{value:new X(1118481)},shininess:{value:30},envMapIntensity:{value:1}}]),vertexShader:qs.meshphong_vert,fragmentShader:qs.meshphong_frag},standard:{uniforms:to([Q.common,Q.envmap,Q.aomap,Q.lightmap,Q.emissivemap,Q.bumpmap,Q.normalmap,Q.displacementmap,Q.roughnessmap,Q.metalnessmap,Q.fog,Q.lights,{emissive:{value:new X(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:qs.meshphysical_vert,fragmentShader:qs.meshphysical_frag},toon:{uniforms:to([Q.common,Q.aomap,Q.lightmap,Q.emissivemap,Q.bumpmap,Q.normalmap,Q.displacementmap,Q.gradientmap,Q.fog,Q.lights,{emissive:{value:new X(0)}}]),vertexShader:qs.meshtoon_vert,fragmentShader:qs.meshtoon_frag},matcap:{uniforms:to([Q.common,Q.bumpmap,Q.normalmap,Q.displacementmap,Q.fog,{matcap:{value:null}}]),vertexShader:qs.meshmatcap_vert,fragmentShader:qs.meshmatcap_frag},points:{uniforms:to([Q.points,Q.fog]),vertexShader:qs.points_vert,fragmentShader:qs.points_frag},dashed:{uniforms:to([Q.common,Q.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:qs.linedashed_vert,fragmentShader:qs.linedashed_frag},depth:{uniforms:to([Q.common,Q.displacementmap]),vertexShader:qs.depth_vert,fragmentShader:qs.depth_frag},normal:{uniforms:to([Q.common,Q.bumpmap,Q.normalmap,Q.displacementmap,{opacity:{value:1}}]),vertexShader:qs.meshnormal_vert,fragmentShader:qs.meshnormal_frag},sprite:{uniforms:to([Q.sprite,Q.fog]),vertexShader:qs.sprite_vert,fragmentShader:qs.sprite_frag},background:{uniforms:{uvTransform:{value:new Nt},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:qs.background_vert,fragmentShader:qs.background_frag},backgroundCube:{uniforms:{envMap:{value:null},backgroundBlurriness:{value:0},backgroundIntensity:{value:1},backgroundRotation:{value:new Nt}},vertexShader:qs.backgroundCube_vert,fragmentShader:qs.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:qs.cube_vert,fragmentShader:qs.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:qs.equirect_vert,fragmentShader:qs.equirect_frag},distance:{uniforms:to([Q.common,Q.displacementmap,{referencePosition:{value:new J},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:qs.distance_vert,fragmentShader:qs.distance_frag},shadow:{uniforms:to([Q.lights,Q.fog,{color:{value:new X(0)},opacity:{value:1}}]),vertexShader:qs.shadow_vert,fragmentShader:qs.shadow_frag}};Js.physical={uniforms:to([Js.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new Nt},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new Nt},clearcoatNormalScale:{value:new q(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new Nt},diffuseRoughness:{value:0},diffuseRoughnessMap:{value:null},diffuseRoughnessMapTransform:{value:new Nt},dispersion:{value:0},retroreflectivity:{value:0},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new Nt},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new Nt},sheen:{value:0},sheenColor:{value:new X(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new Nt},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new Nt},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new Nt},transmissionSamplerSize:{value:new q},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new Nt},attenuationDistance:{value:0},attenuationColor:{value:new X(0)},specularColor:{value:new X(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new Nt},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new Nt},anisotropyVector:{value:new q},anisotropyMap:{value:null},anisotropyMapTransform:{value:new Nt}}]),vertexShader:qs.meshphysical_vert,fragmentShader:qs.meshphysical_frag};var Ys={r:0,b:0,g:0},Xs=new Y,Zs=new Nt;Zs.set(-1,0,0,0,1,0,0,0,1);function Qs(e,t,n,r,i,a){let o=new X(0),s=i===!0?0:1,c,l,u=null,d=0,f=null;function p(e){let n=e.isScene===!0?e.background:null;if(n&&n.isTexture){let r=e.backgroundBlurriness>0;n=t.get(n,r)}return n}function m(t){let r=!1,i=p(t);i===null?g(o,s):i&&i.isColor&&(g(i,1),r=!0);let c=e.xr.getEnvironmentBlendMode();c===`additive`?n.buffers.color.setClear(0,0,0,1,a):c===`alpha-blend`&&n.buffers.color.setClear(0,0,0,0,a),(e.autoClear||r)&&(n.buffers.depth.setTest(!0),n.buffers.depth.setMask(!0),n.buffers.color.setMask(!0),e.clear(e.autoClearColor,e.autoClearDepth,e.autoClearStencil))}function h(t,n){let i=p(n);i&&i.isCubeTexture?(l===void 0&&(l=new ri(new ca(1,1,1),new co({name:`BackgroundCubeMaterial`,uniforms:eo(Js.backgroundCube.uniforms),vertexShader:Js.backgroundCube.vertexShader,fragmentShader:Js.backgroundCube.fragmentShader,side:1,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),l.geometry.deleteAttribute(`normal`),l.geometry.deleteAttribute(`uv`),l.onBeforeRender=function(e,t,n){this.matrixWorld.copyPosition(n.matrixWorld)},Object.defineProperty(l.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),r.update(l)),l.material.uniforms.envMap.value=i,l.material.uniforms.backgroundBlurriness.value=n.backgroundBlurriness,l.material.uniforms.backgroundIntensity.value=n.backgroundIntensity,l.material.uniforms.backgroundRotation.value.setFromMatrix4(Xs.makeRotationFromEuler(n.backgroundRotation)).transpose(),i.isRenderTargetTexture===!1&&l.material.uniforms.backgroundRotation.value.premultiply(Zs),l.material.toneMapped=Rt.getTransfer(i.colorSpace)!==Be,(u!==i||d!==i.version||f!==e.toneMapping)&&(l.material.needsUpdate=!0,u=i,d=i.version,f=e.toneMapping),l.layers.enableAll(),t.unshift(l,l.geometry,l.material,0,0,null)):i&&i.isTexture&&(c===void 0&&(c=new ri(new Za(2,2),new co({name:`BackgroundMaterial`,uniforms:eo(Js.background.uniforms),vertexShader:Js.background.vertexShader,fragmentShader:Js.background.fragmentShader,side:0,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),c.geometry.deleteAttribute(`normal`),Object.defineProperty(c.material,"map",{get:function(){return this.uniforms.t2D.value}}),r.update(c)),c.material.uniforms.t2D.value=i,c.material.uniforms.backgroundIntensity.value=n.backgroundIntensity,c.material.toneMapped=Rt.getTransfer(i.colorSpace)!==Be,i.matrixAutoUpdate===!0&&i.updateMatrix(),c.material.uniforms.uvTransform.value.copy(i.matrix),(u!==i||d!==i.version||f!==e.toneMapping)&&(c.material.needsUpdate=!0,u=i,d=i.version,f=e.toneMapping),c.layers.enableAll(),t.unshift(c,c.geometry,c.material,0,0,null))}function g(t,r){t.getRGB(Ys,io(e)),n.buffers.color.setClear(Ys.r,Ys.g,Ys.b,r,a)}function _(){l!==void 0&&(l.geometry.dispose(),l.material.dispose(),l=void 0),c!==void 0&&(c.geometry.dispose(),c.material.dispose(),c=void 0)}return{getClearColor:function(){return o},setClearColor:function(e,t=1){o.set(e),s=t,g(o,s)},getClearAlpha:function(){return s},setClearAlpha:function(e){s=e,g(o,s)},render:m,addToRenderList:h,dispose:_}}function $s(e,t){let n=e.getParameter(e.MAX_VERTEX_ATTRIBS),r={},i=f(null),a=i,o=!1;function s(n,r,i,s,c){let u=!1,f=d(n,s,i,r);a!==f&&(a=f,l(a.object)),u=p(n,s,i,c),u&&m(n,s,i,c),c!==null&&t.update(c,e.ELEMENT_ARRAY_BUFFER),(u||o)&&(o=!1,b(n,r,i,s),c!==null&&e.bindBuffer(e.ELEMENT_ARRAY_BUFFER,t.get(c).buffer))}function c(){return e.createVertexArray()}function l(t){return e.bindVertexArray(t)}function u(t){return e.deleteVertexArray(t)}function d(e,t,n,i){let a=i.wireframe===!0,o=r[t.id];o===void 0&&(o={},r[t.id]=o);let s=e.isInstancedMesh===!0?e.id:0,l=o[s];l===void 0&&(l={},o[s]=l);let u=l[n.id];u===void 0&&(u={},l[n.id]=u);let d=u[a];return d===void 0&&(d=f(c()),u[a]=d),d}function f(e){let t=[],r=[],i=[];for(let e=0;e<n;e++)t[e]=0,r[e]=0,i[e]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:t,enabledAttributes:r,attributeDivisors:i,object:e,attributes:{},index:null}}function p(e,t,n,r){let i=a.attributes,o=t.attributes,s=0,c=n.getAttributes();for(let t in c)if(c[t].location>=0){let n=i[t],r=o[t];if(r===void 0&&(t===`instanceMatrix`&&e.instanceMatrix&&(r=e.instanceMatrix),t===`instanceColor`&&e.instanceColor&&(r=e.instanceColor)),n===void 0||n.attribute!==r||r&&n.data!==r.data)return!0;s++}return a.attributesNum!==s||a.index!==r}function m(e,t,n,r){let i={},o=t.attributes,s=0,c=n.getAttributes();for(let t in c)if(c[t].location>=0){let n=o[t];n===void 0&&(t===`instanceMatrix`&&e.instanceMatrix&&(n=e.instanceMatrix),t===`instanceColor`&&e.instanceColor&&(n=e.instanceColor));let r={};r.attribute=n,n&&n.data&&(r.data=n.data),i[t]=r,s++}a.attributes=i,a.attributesNum=s,a.index=r}function h(){let e=a.newAttributes;for(let t=0,n=e.length;t<n;t++)e[t]=0}function g(e){_(e,0)}function _(t,n){let r=a.newAttributes,i=a.enabledAttributes,o=a.attributeDivisors;r[t]=1,i[t]===0&&(e.enableVertexAttribArray(t),i[t]=1),o[t]!==n&&(e.vertexAttribDivisor(t,n),o[t]=n)}function v(){let t=a.newAttributes,n=a.enabledAttributes;for(let r=0,i=n.length;r<i;r++)n[r]!==t[r]&&(e.disableVertexAttribArray(r),n[r]=0)}function y(t,n,r,i,a,o,s){s===!0?e.vertexAttribIPointer(t,n,r,a,o):e.vertexAttribPointer(t,n,r,i,a,o)}function b(n,r,i,a){h();let o=a.attributes,s=i.getAttributes(),c=r.defaultAttributeValues;for(let r in s){let i=s[r];if(i.location>=0){let s=o[r];if(s===void 0&&(r===`instanceMatrix`&&n.instanceMatrix&&(s=n.instanceMatrix),r===`instanceColor`&&n.instanceColor&&(s=n.instanceColor)),s!==void 0){let r=s.normalized,o=s.itemSize,c=t.get(s);if(c===void 0)continue;let l=c.buffer,u=c.type,d=c.bytesPerElement,f=u===e.INT||u===e.UNSIGNED_INT||s.gpuType===1013;if(s.isInterleavedBufferAttribute){let t=s.data,c=t.isInterleavedBuffer===!0?t.stride:t.itemSize,p=s.offset;if(t.isInstancedInterleavedBuffer||t.isInstancedBufferAttribute){for(let e=0;e<i.locationSize;e++)_(i.location+e,t.meshPerAttribute);n.isInstancedMesh!==!0&&a._maxInstanceCount===void 0&&(a._maxInstanceCount=t.meshPerAttribute*t.count)}else for(let e=0;e<i.locationSize;e++)g(i.location+e);e.bindBuffer(e.ARRAY_BUFFER,l);for(let e=0;e<i.locationSize;e++)y(i.location+e,o/i.locationSize,u,r,c*d,(p+o/i.locationSize*e)*d,f)}else{if(s.isInstancedBufferAttribute){for(let e=0;e<i.locationSize;e++)_(i.location+e,s.meshPerAttribute);n.isInstancedMesh!==!0&&a._maxInstanceCount===void 0&&(a._maxInstanceCount=s.meshPerAttribute*s.count)}else for(let e=0;e<i.locationSize;e++)g(i.location+e);e.bindBuffer(e.ARRAY_BUFFER,l);for(let e=0;e<i.locationSize;e++)y(i.location+e,o/i.locationSize,u,r,o*d,o/i.locationSize*e*d,f)}}else if(c!==void 0){let t=c[r];if(t!==void 0)switch(t.length){case 2:e.vertexAttrib2fv(i.location,t);break;case 3:e.vertexAttrib3fv(i.location,t);break;case 4:e.vertexAttrib4fv(i.location,t);break;default:e.vertexAttrib1fv(i.location,t)}}}}v()}function x(){T();for(let e in r){let t=r[e];for(let e in t){let n=t[e];for(let e in n){let t=n[e];for(let e in t)u(t[e].object),delete t[e];delete n[e]}}delete r[e]}}function S(e){if(r[e.id]===void 0)return;let t=r[e.id];for(let e in t){let n=t[e];for(let e in n){let t=n[e];for(let e in t)u(t[e].object),delete t[e];delete n[e]}}delete r[e.id]}function C(e){for(let t in r){let n=r[t];for(let t in n){let r=n[t];if(r[e.id]===void 0)continue;let i=r[e.id];for(let e in i)u(i[e].object),delete i[e];delete r[e.id]}}}function w(e){for(let t in r){let n=r[t],i=e.isInstancedMesh===!0?e.id:0,a=n[i];if(a!==void 0){for(let e in a){let t=a[e];for(let e in t)u(t[e].object),delete t[e];delete a[e]}delete n[i],Object.keys(n).length===0&&delete r[t]}}}function T(){E(),o=!0,a!==i&&(a=i,l(a.object))}function E(){i.geometry=null,i.program=null,i.wireframe=!1}return{setup:s,reset:T,resetDefaultState:E,dispose:x,releaseStatesOfGeometry:S,releaseStatesOfObject:w,releaseStatesOfProgram:C,initAttributes:h,enableAttribute:g,disableUnusedAttributes:v}}function ec(e,t,n){let r;function i(e){r=e}function a(t,i){e.drawArrays(r,t,i),n.update(i,r,1)}function o(t,i,a){a!==0&&(e.drawArraysInstanced(r,t,i,a),n.update(i,r,a))}function s(e,i,a){if(a===0)return;t.get(`WEBGL_multi_draw`).multiDrawArraysWEBGL(r,e,0,i,0,a);let o=0;for(let e=0;e<a;e++)o+=i[e];n.update(o,r,1)}this.setMode=i,this.render=a,this.renderInstances=o,this.renderMultiDraw=s}function tc(e,t,n,r){let i;function a(){if(i!==void 0)return i;if(t.has(`EXT_texture_filter_anisotropic`)===!0){let n=t.get(`EXT_texture_filter_anisotropic`);i=e.getParameter(n.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else i=0;return i}function o(t){return t===1023||r.convert(t)===e.getParameter(e.IMPLEMENTATION_COLOR_READ_FORMAT)}function s(n){let i=n===1016&&(t.has(`EXT_color_buffer_half_float`)||t.has(`EXT_color_buffer_float`));return!(n!==1009&&n!==1015&&!i&&r.convert(n)!==e.getParameter(e.IMPLEMENTATION_COLOR_READ_TYPE))}function c(t){if(t===`highp`){if(e.getShaderPrecisionFormat(e.VERTEX_SHADER,e.HIGH_FLOAT).precision>0&&e.getShaderPrecisionFormat(e.FRAGMENT_SHADER,e.HIGH_FLOAT).precision>0)return`highp`;t=`mediump`}return t===`mediump`&&e.getShaderPrecisionFormat(e.VERTEX_SHADER,e.MEDIUM_FLOAT).precision>0&&e.getShaderPrecisionFormat(e.FRAGMENT_SHADER,e.MEDIUM_FLOAT).precision>0?`mediump`:`lowp`}let l=n.precision===void 0?`highp`:n.precision,u=c(l);u!==l&&(G(`WebGLRenderer:`,l,`not supported, using`,u,`instead.`),l=u);let d=n.reversedDepthBuffer===!0&&t.has(`EXT_clip_control`),f=n.logarithmicDepthBuffer===!0&&d===!1;n.reversedDepthBuffer===!0&&d===!1&&G(`WebGLRenderer: Unable to use reversed depth buffer due to missing EXT_clip_control extension. Fallback to default depth buffer.`),n.logarithmicDepthBuffer===!0&&d===!0&&G(`WebGLRenderer: Logarithmic depth buffer is ignored when reversed depth buffer is enabled.`);let p=e.getParameter(e.MAX_TEXTURE_IMAGE_UNITS),m=e.getParameter(e.MAX_VERTEX_TEXTURE_IMAGE_UNITS),h=e.getParameter(e.MAX_TEXTURE_SIZE),g=e.getParameter(e.MAX_CUBE_MAP_TEXTURE_SIZE),_=e.getParameter(e.MAX_VERTEX_ATTRIBS),v=e.getParameter(e.MAX_VERTEX_UNIFORM_VECTORS),y=e.getParameter(e.MAX_VARYING_VECTORS),b=e.getParameter(e.MAX_FRAGMENT_UNIFORM_VECTORS),x=e.getParameter(e.MAX_SAMPLES),S=e.getParameter(e.SAMPLES);return{isWebGL2:!0,getMaxAnisotropy:a,getMaxPrecision:c,textureFormatReadable:o,textureTypeReadable:s,precision:l,logarithmicDepthBuffer:f,reversedDepthBuffer:d,maxTextures:p,maxVertexTextures:m,maxTextureSize:h,maxCubemapSize:g,maxAttributes:_,maxVertexUniforms:v,maxVaryings:y,maxFragmentUniforms:b,maxSamples:x,samples:S}}function nc(e){let t=this,n=null,r=0,i=!1,a=!1,o=new Lr,s=new Nt,c={value:null,needsUpdate:!1};this.uniform=c,this.numPlanes=0,this.numIntersection=0,this.init=function(e,t){let n=e.length!==0||t||r!==0||i;return i=t,r=e.length,n},this.beginShadows=function(){a=!0,u(null)},this.endShadows=function(){a=!1},this.setGlobalState=function(e,t){n=u(e,t,0)},this.setState=function(t,o,s){let d=t.clippingPlanes,f=t.clipIntersection,p=t.clipShadows,m=e.get(t);if(!i||d===null||d.length===0||a&&!p)a?u(null):l();else{let e=a?0:r,t=e*4,i=m.clippingState||null;c.value=i,i=u(d,o,t,s);for(let e=0;e!==t;++e)i[e]=n[e];m.clippingState=i,this.numIntersection=f?this.numPlanes:0,this.numPlanes+=e}};function l(){c.value!==n&&(c.value=n,c.needsUpdate=r>0),t.numPlanes=r,t.numIntersection=0}function u(e,n,r,i){let a=e===null?0:e.length,l=null;if(a!==0){if(l=c.value,i!==!0||l===null){let t=r+a*4,i=n.matrixWorldInverse;s.getNormalMatrix(i),(l===null||l.length<t)&&(l=new Float32Array(t));for(let t=0,n=r;t!==a;++t,n+=4)o.copy(e[t]).applyMatrix4(i,s),o.normal.toArray(l,n),l[n+3]=o.constant}c.value=l,c.needsUpdate=!0}return t.numPlanes=a,t.numIntersection=0,l}}var rc=class extends Zt{constructor(e=1,t={}){super(e,e,t),this.isWebGLCubeRenderTarget=!0;let n={width:e,height:e,depth:1},r=[n,n,n,n,n,n];this.texture=new ra(r),this._setTextureOptions(t),this.texture.isRenderTargetTexture=!0}fromEquirectangularTexture(e,t){this.texture.type=t.type,this.texture.colorSpace=t.colorSpace,this.texture.generateMipmaps=t.generateMipmaps,this.texture.minFilter=t.minFilter,this.texture.magFilter=t.magFilter;let n={uniforms:{tEquirect:{value:null}},vertexShader:`

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
			`},r=new ca(5,5,5),i=new co({name:`CubemapFromEquirect`,uniforms:eo(n.uniforms),vertexShader:n.vertexShader,fragmentShader:n.fragmentShader,side:1,blending:0});i.uniforms.tEquirect.value=t;let a=new ri(r,i),o=t.minFilter;return t.minFilter===1008&&(t.minFilter=s),new Cs(1,10,this).update(e,a),t.minFilter=o,a.geometry.dispose(),a.material.dispose(),this}clear(e,t=!0,n=!0,r=!0){let i=e.getRenderTarget();for(let i=0;i<6;i++)e.setRenderTarget(this,i),e.clear(t,n,r);e.setRenderTarget(i)}},ic=256,ac=3,oc=20,sc=256,cc=16,lc=3,uc=new J,dc=new X,fc=class e{constructor(e){this._renderer=e,this._cubeSize=0,this._sourceTarget=null,this._cubeCamera=new Cs(1,10,null),this._boxMesh=new ri(new ca(5,5,5),null),this._cubemapMaterial=null,this._equirectMaterial=null,this._blurMaterial=null,this._ggxMaterial=null,this._integrationMaterial=null}fromScene(e,t=0,n=.1,r=100,i={}){let{size:a=256,position:o=uc}=i,s=this._renderer;this._setSize(a);let c=this._allocateTarget(),l=this._getSourceTarget(!0);t>0&&(l.texture.mipmapsAutoUpdate=!1);let u=s.autoClear,d=s.autoClearColor,f=s.autoClearDepth,p=s.autoClearStencil,m=e.background;s.autoClear=!0,s.autoClearColor=!0,s.autoClearDepth=!0,s.autoClearStencil=!0,m===null&&(e.background=s.getClearColor(dc));let h=new Cs(n,r,l);return h.position.copy(o),h.update(s,e),s.autoClear=u,s.autoClearColor=d,s.autoClearDepth=f,s.autoClearStencil=p,e.background=m,t>0&&(l.texture.mipmapsAutoUpdate=!0,this._blur(c,t)),this._applyPMREM(c),c}fromEquirectangular(e,t=null){return this._fromTexture(e,t)}fromCubemap(e,t=null){return this._fromTexture(e,t)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=yc(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=vc(),this._compileMaterial(this._equirectMaterial))}dispose(){this._sourceTarget!==null&&this._sourceTarget.dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose(),this._blurMaterial!==null&&this._blurMaterial.dispose(),this._ggxMaterial!==null&&this._ggxMaterial.dispose(),this._integrationMaterial!==null&&this._integrationMaterial.dispose(),this._boxMesh.geometry.dispose()}static lodToRoughness(e,t){return t>0?1-Math.sqrt(1-e/t):0}_setSize(e){this._cubeSize=Math.max(ic,wt(e))}_fromTexture(e,t){e.mapping===301||e.mapping===302?this._setSize(e.image.length===0?ic:e.image[0].width||e.image[0].image.width):this._setSize(e.image.width/4);let n=t||this._allocateTarget();return this._textureToCubemap(e),this._applyPMREM(n),n}_allocateTarget(){let e=this._cubeSize,t=pc(e,!1,!1),n=Math.log2(e)-ac;for(let r=0;r<=n;r++)t.texture.mipmaps.push({width:e>>r,height:e>>r});return t.texture.name=`PMREM`,t.texture.isPMREMTexture=!0,t}_getSourceTarget(e=!1){let t=this._cubeSize,n=this._sourceTarget;return(n===null||n.width!==t||e&&n.depthBuffer===!1)&&(n!==null&&n.dispose(),this._sourceTarget=pc(t,!0,e)),this._sourceTarget}_compileMaterial(e){this._boxMesh.material=e,this._renderer.compile(this._boxMesh,this._cubeCamera.children[0])}_renderCube(e,t,n){let r=this._boxMesh,i=this._cubeCamera;r.material=n,i.renderTarget=e,i.activeMipmapLevel=t;let a=e.width>>t;e.viewport.set(0,0,a,a),i.update(this._renderer,r),e.viewport.set(0,0,e.width,e.height)}_textureToCubemap(e){let t;e.mapping===301||e.mapping===302?(this._cubemapMaterial===null&&(this._cubemapMaterial=yc()),t=this._cubemapMaterial,t.uniforms.flipEnvMap.value=e.isRenderTargetTexture===!1?-1:1):(this._equirectMaterial===null&&(this._equirectMaterial=vc()),t=this._equirectMaterial),t.uniforms.envMap.value=e,this._renderCube(this._getSourceTarget(),0,t)}_applyPMREM(t){this._ggxMaterial===null&&(this._ggxMaterial=hc(),this._integrationMaterial=gc());let n=this._cubeSize,r=t.texture.mipmaps.length-1,i=this._ggxMaterial.uniforms;i.envMap.value=this._sourceTarget.texture;let a=this._integrationMaterial.uniforms;a.envMap.value=this._sourceTarget.texture,a.sourceLod.value=Math.log2(n/cc);for(let o=0;o<=r;o++){let s=e.lodToRoughness(o,r);if(o>r-lc)a.roughness.value=s,this._renderCube(t,o,this._integrationMaterial);else{let e=s>0?Math.log2(n)+.5*Math.log2(6/(sc*s**4))+.5:0;i.roughness.value=s,i.lodBias.value=e,this._renderCube(t,o,this._ggxMaterial)}}}_blur(e,t){this._blurMaterial===null&&(this._blurMaterial=_c());let n=this._blurMaterial,r=n.uniforms,i=this._sourceTarget;r.sigma.value=Math.min(t,Math.PI)/Math.SQRT2,r.envMap.value=i.texture,this._renderCube(e,0,n),r.envMap.value=e.texture,this._renderCube(i,0,n)}};function pc(e,t,n){return new rc(e,{minFilter:l,generateMipmaps:t,type:_,colorSpace:Re,depthBuffer:n})}function mc(e,t,n){return new co({name:e,uniforms:t,vertexShader:qs.cube_vert,fragmentShader:n,side:1,blending:0,depthTest:!1,depthWrite:!1})}function hc(){return mc(`PMREMGGXConvolution`,{envMap:{value:null},roughness:{value:0},lodBias:{value:0}},`

		#define GGX_SAMPLES ${sc}u

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
	`)}function gc(){return mc(`PMREMGGXIntegration`,{envMap:{value:null},roughness:{value:0},sourceLod:{value:0},sourceSize:{value:cc}},`

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
	`)}function _c(){return mc(`PMREMSphericalGaussianBlur`,{envMap:{value:null},sigma:{value:0}},`

		#define SAMPLES ${oc}
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
	`)}function vc(){return mc(`PMREMEquirectangularToCubemap`,{envMap:{value:null}},`

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
	`)}function yc(){return mc(`PMREMCubemapToCubemap`,{envMap:{value:null},flipEnvMap:{value:-1}},`

		varying vec3 vWorldDirection;

		uniform samplerCube envMap;
		uniform float flipEnvMap;

		void main() {

			gl_FragColor = vec4( textureCube( envMap, vec3( flipEnvMap * vWorldDirection.x, vWorldDirection.yz ) ).rgb, 1.0 );

		}
	`)}function bc(e){let t=new WeakMap,n=new WeakMap,r=null;function i(e,t=!1){return e==null?null:t?o(e):a(e)}function a(n){if(n&&n.isTexture){let r=n.mapping;if(r===303||r===304){if(t.has(n)){let e=t.get(n).texture;return s(e,n.mapping)}{let r=n.image;if(r&&r.height>0){let i=new rc(r.height);return i.fromEquirectangularTexture(e,n),t.set(n,i),n.addEventListener(`dispose`,l),s(i.texture,n.mapping)}return null}}}return n}function o(t){if(t&&t.isTexture&&t.isPMREMTexture!==!0){let i=t.mapping,a=i===303||i===304,o=i===301||i===302;if(a||o){let i=n.get(t),s=i===void 0?0:i.texture.pmremVersion;if(t.isRenderTargetTexture&&t.pmremVersion!==s)return r===null&&(r=new fc(e)),i=a?r.fromEquirectangular(t,i):r.fromCubemap(t,i),i.texture.pmremVersion=t.pmremVersion,n.set(t,i),i.texture;if(i!==void 0)return i.texture;{let s=t.image;return a&&s&&s.height>0||o&&s&&c(s)?(r===null&&(r=new fc(e)),i=a?r.fromEquirectangular(t):r.fromCubemap(t),i.texture.pmremVersion=t.pmremVersion,n.set(t,i),t.addEventListener(`dispose`,u),i.texture):null}}}return t}function s(e,t){return t===303?e.mapping=301:t===304&&(e.mapping=302),e}function c(e){let t=0;for(let n=0;n<6;n++)e[n]!==void 0&&t++;return t===6}function l(e){let n=e.target;n.removeEventListener(`dispose`,l);let r=t.get(n);r!==void 0&&(t.delete(n),r.dispose())}function u(e){let t=e.target;t.removeEventListener(`dispose`,u);let r=n.get(t);r!==void 0&&(n.delete(t),r.dispose())}function d(){t=new WeakMap,n=new WeakMap,r!==null&&(r.dispose(),r=null)}return{get:i,dispose:d}}function xc(e){let t={};function n(n){if(t[n]!==void 0)return t[n];let r=e.getExtension(n);return t[n]=r,r}return{has:function(e){return n(e)!==null},init:function(){n(`EXT_color_buffer_float`),n(`WEBGL_clip_cull_distance`),n(`OES_texture_float_linear`),n(`EXT_color_buffer_half_float`),n(`WEBGL_multisampled_render_to_texture`),n(`WEBGL_render_shared_exponent`)},get:function(e){let t=n(e);return t===null&&Qe(`WebGLRenderer: `+e+` extension not supported.`),t}}}function Sc(e,t,n,r){let i={},a=new WeakMap,o=new FinalizationRegistry(e=>delete i[e]);function s(e){c(e.target)}function c(e){e.index!==null&&t.remove(e.index);for(let n in e.attributes)t.remove(e.attributes[n]);e.removeEventListener(`dispose`,s),delete i[e.id],o.unregister(e);let c=a.get(e);c&&(t.remove(c),a.delete(e)),r.releaseStatesOfGeometry(e),e.isInstancedBufferGeometry===!0&&delete e._maxInstanceCount,n.memory.geometries--}function l(e,t){return i[t.id]===void 0&&(t.addEventListener(`dispose`,s),i[t.id]=new WeakRef(t),o.register(t,t.id,t),n.memory.geometries++),t}function u(n){let r=n.attributes;for(let n in r)t.update(r[n],e.ARRAY_BUFFER)}function d(e){let n=e.index,r=e.attributes.position,i=0;if(r===void 0)return;let o=n===null?r.array.length/3-1:n.array.length,s=new(r.count>=65535?_r:gr)(Math.ceil(o/3)*6,1),c=s.array;if(n!==null){let e=n.array;i=n.version;for(let t=0,n=0;t<o;t+=3){let r=e[t+0],i=e[t+1],a=e[t+2];c[n++]=r,c[n++]=i,c[n++]=i,c[n++]=a,c[n++]=a,c[n++]=r}}else{i=r.version;for(let e=0,t=0;e<o;e+=3){let n=e+0,r=e+1,i=e+2;c[t++]=n,c[t++]=r,c[t++]=r,c[t++]=i,c[t++]=i,c[t++]=n}}s.version=i;let l=a.get(e);l&&t.remove(l),a.set(e,s)}function f(e){let t=a.get(e);if(t){let n=e.index;n!==null&&t.version<n.version&&d(e)}else d(e);return a.get(e)}function p(){for(let e in i){let t=i[e].deref();t!==void 0&&c(t)}}return{get:l,update:u,getWireframeAttribute:f,dispose:p}}function Cc(e,t,n){let r;function i(e){r=e}let a,o;function s(e){a=e.type,o=e.bytesPerElement}function c(t,i){e.drawElements(r,i,a,t*o),n.update(i,r,1)}function l(t,i,s){s!==0&&(e.drawElementsInstanced(r,i,a,t*o,s),n.update(i,r,s))}function u(e,i,o){if(o===0)return;t.get(`WEBGL_multi_draw`).multiDrawElementsWEBGL(r,i,0,a,e,0,o);let s=0;for(let e=0;e<o;e++)s+=i[e];n.update(s,r,1)}this.setMode=i,this.setIndex=s,this.render=c,this.renderInstances=l,this.renderMultiDraw=u}function wc(e){let t={geometries:0,textures:0},n={frame:0,calls:0,triangles:0,points:0,lines:0};function r(t,r,i){switch(n.calls++,r){case e.TRIANGLES:n.triangles+=t/3*i;break;case e.LINES:n.lines+=t/2*i;break;case e.LINE_STRIP:n.lines+=i*(t-1);break;case e.LINE_LOOP:n.lines+=i*t;break;case e.POINTS:n.points+=i*t;break;default:K(`WebGLInfo: Unknown draw mode:`,r)}}function i(){n.calls=0,n.triangles=0,n.points=0,n.lines=0}return{memory:t,render:n,programs:null,autoReset:!0,reset:i,update:r}}function Tc(e,t,n){let r=new WeakMap,i=new Yt;function a(a,o,s){let c=a.morphTargetInfluences,l=o.morphAttributes.position||o.morphAttributes.normal||o.morphAttributes.color,u=l===void 0?0:l.length,d=r.get(o);if(d===void 0||d.count!==u){d!==void 0&&d.texture.dispose();let e=o.morphAttributes.position!==void 0,n=o.morphAttributes.normal!==void 0,a=o.morphAttributes.color!==void 0,s=o.morphAttributes.position||[],c=o.morphAttributes.normal||[],l=o.morphAttributes.color||[],f=0;e===!0&&(f=1),n===!0&&(f=2),a===!0&&(f=3);let p=o.attributes.position.count*f,m=1;p>t.maxTextureSize&&(m=Math.ceil(p/t.maxTextureSize),p=t.maxTextureSize);let h=new Float32Array(p*m*4*u),_=new Qt(h,p,m,u);_.type=g,_.needsUpdate=!0;let v=f*4;for(let t=0;t<u;t++){let r=s[t],o=c[t],u=l[t],d=p*m*4*t;for(let t=0;t<r.count;t++){let s=t*v;e===!0&&(i.fromBufferAttribute(r,t),h[d+s+0]=i.x,h[d+s+1]=i.y,h[d+s+2]=i.z,h[d+s+3]=0),n===!0&&(i.fromBufferAttribute(o,t),h[d+s+4]=i.x,h[d+s+5]=i.y,h[d+s+6]=i.z,h[d+s+7]=0),a===!0&&(i.fromBufferAttribute(u,t),h[d+s+8]=i.x,h[d+s+9]=i.y,h[d+s+10]=i.z,h[d+s+11]=u.itemSize===4?i.w:1)}}d={count:u,texture:_,size:new q(p,m)},r.set(o,d);function y(){_.dispose(),r.delete(o),o.removeEventListener(`dispose`,y)}o.addEventListener(`dispose`,y)}if(a.isInstancedMesh===!0&&a.morphTexture!==null)s.getUniforms().setValue(e,`morphTexture`,a.morphTexture,n);else{let t=0;for(let e=0;e<c.length;e++)t+=c[e];let n=o.morphTargetsRelative?1:1-t;s.getUniforms().setValue(e,`morphTargetBaseInfluence`,n),s.getUniforms().setValue(e,`morphTargetInfluences`,c)}s.getUniforms().setValue(e,`morphTargetsTexture`,d.texture,n),s.getUniforms().setValue(e,`morphTargetsTextureSize`,d.size)}return{update:a}}function Ec(e,t,n,r,i){let a=new WeakMap;function o(r){let o=i.render.frame,s=r.geometry,l=t.get(r,s);if(a.get(l)!==o&&(t.update(l),a.set(l,o)),r.isInstancedMesh&&(r.hasEventListener(`dispose`,c)===!1&&r.addEventListener(`dispose`,c),a.get(r)!==o&&(n.update(r.instanceMatrix,e.ARRAY_BUFFER),r.instanceColor!==null&&n.update(r.instanceColor,e.ARRAY_BUFFER),a.set(r,o))),r.isSkinnedMesh){let e=r.skeleton;a.get(e)!==o&&(e.update(),a.set(e,o))}return l}function s(){a=new WeakMap}function c(e){let t=e.target;t.removeEventListener(`dispose`,c),r.releaseStatesOfObject(t),n.remove(t.instanceMatrix),t.instanceColor!==null&&n.remove(t.instanceColor)}return{update:o,dispose:s}}var Dc={1:`LINEAR_TONE_MAPPING`,2:`REINHARD_TONE_MAPPING`,3:`CINEON_TONE_MAPPING`,4:`ACES_FILMIC_TONE_MAPPING`,6:`AGX_TONE_MAPPING`,7:`NEUTRAL_TONE_MAPPING`,5:`CUSTOM_TONE_MAPPING`};function Oc(e,t,n,r,i,a){let o=new Zt(t,n,{type:e,depthBuffer:i,stencilBuffer:a,samples:r?4:0,storeMultisampledDepthBuffer:!1,storeMultisampledStencilBuffer:!1,resolveDepthBuffer:!1,resolveStencilBuffer:!1}),s=null,c=null,l=null,u=new kr;u.setAttribute(`position`,new Z([-1,3,0,-1,-1,0,3,-1,0],3)),u.setAttribute(`uv`,new Z([0,2,0,0,2,0],2));let d=new lo({uniforms:{tDiffuse:{value:null}},vertexShader:`
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
			}`,depthTest:!1,depthWrite:!1}),f=new ri(u,d),p=new hs(-1,1,1,-1,0,1),m=null,h=null,g=!1,v,y=null,x=[],S=!1;this.setSize=function(e,t){o.setSize(e,t),s!==null&&s.setSize(e,t),c!==null&&c.setSize(e,t);for(let n=0;n<x.length;n++){let r=x[n];r.setSize&&r.setSize(e,t)}},this.setEffects=function(e){x=e,S=x.length>0&&x[0].isRenderPass===!0;let t=o.width,n=o.height;x.length>0&&s===null&&(s=new Zt(t,n,{type:_,depthBuffer:!1,stencilBuffer:!1}),c=new Zt(t,n,{type:_,depthBuffer:!1,stencilBuffer:!1}));let r=i===!0&&x.some(e=>e.needsDepthTexture===!0);r!==(o.depthTexture!==null)&&(r===!0&&l===null&&(l=new aa(t,n),a===!0&&(l.format=D,l.type=b)),o.dispose(),o.depthTexture=r?l:null,o.resolveDepthBuffer=r,o.storeMultisampledDepthBuffer=r);for(let e=0;e<x.length;e++){let i=x[e];i.setSize&&i.setSize(t,n),r&&i.needsDepthTexture===!0&&i.setDepthTexture&&i.setDepthTexture(l)}},this.begin=function(e,t){if(g||e.toneMapping===0&&x.length===0)return!1;if(y=t,t!==null){let e=t.width,n=t.height;(o.width!==e||o.height!==n)&&this.setSize(e,n)}return S===!1&&e.setRenderTarget(o),v=e.toneMapping,e.toneMapping=0,!0},this.hasRenderPass=function(){return S},this.end=function(e,t){e.toneMapping=v,g=!0;let n=o,r=s;for(let i=0;i<x.length;i++){let a=x[i];a.enabled!==!1&&(a.render(e,r,n,t),a.needsSwap!==!1&&(n=r,r=r===s?c:s))}if(m!==e.outputColorSpace||h!==e.toneMapping){m=e.outputColorSpace,h=e.toneMapping,d.defines={},Rt.getTransfer(m)===`srgb`&&(d.defines.SRGB_TRANSFER=``);let t=Dc[h];t&&(d.defines[t]=``),d.needsUpdate=!0}d.uniforms.tDiffuse.value=n.texture,e.setRenderTarget(y),e.render(f,p),y=null,g=!1},this.isCompositing=function(){return g},this.dispose=function(){o.dispose(),s!==null&&s.dispose(),c!==null&&c.dispose(),u.dispose(),d.dispose()}}var kc=new Jt,Ac=new aa(1,1),jc=new oa(1),Mc=new Qt,Nc=new $t,Pc=new ra,Fc=[],Ic=[],Lc=new Float32Array(16),Rc=new Float32Array(9),zc=new Float32Array(4);function Bc(e,t,n){let r=e[0];if(r<=0||r>0)return e;let i=t*n,a=Fc[i];if(a===void 0&&(a=new Float32Array(i),Fc[i]=a),t!==0){r.toArray(a,0);for(let r=1,i=0;r!==t;++r)i+=n,e[r].toArray(a,i)}return a}function Vc(e,t){if(e.length!==t.length)return!1;for(let n=0,r=e.length;n<r;n++)if(e[n]!==t[n])return!1;return!0}function Hc(e,t){for(let n=0,r=t.length;n<r;n++)e[n]=t[n]}function Uc(e,t){let n=Ic[t];n===void 0&&(n=new Int32Array(t),Ic[t]=n);for(let r=0;r!==t;++r)n[r]=e.allocateTextureUnit();return n}function Wc(e,t){let n=this.cache;n[0]!==t&&(e.uniform1f(this.addr,t),n[0]=t)}function Gc(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y)&&(e.uniform2f(this.addr,t.x,t.y),n[0]=t.x,n[1]=t.y);else{if(Vc(n,t))return;e.uniform2fv(this.addr,t),Hc(n,t)}}function Kc(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y||n[2]!==t.z)&&(e.uniform3f(this.addr,t.x,t.y,t.z),n[0]=t.x,n[1]=t.y,n[2]=t.z);else if(t.r!==void 0)(n[0]!==t.r||n[1]!==t.g||n[2]!==t.b)&&(e.uniform3f(this.addr,t.r,t.g,t.b),n[0]=t.r,n[1]=t.g,n[2]=t.b);else{if(Vc(n,t))return;e.uniform3fv(this.addr,t),Hc(n,t)}}function qc(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y||n[2]!==t.z||n[3]!==t.w)&&(e.uniform4f(this.addr,t.x,t.y,t.z,t.w),n[0]=t.x,n[1]=t.y,n[2]=t.z,n[3]=t.w);else{if(Vc(n,t))return;e.uniform4fv(this.addr,t),Hc(n,t)}}function Jc(e,t){let n=this.cache,r=t.elements;if(r===void 0){if(Vc(n,t))return;e.uniformMatrix2fv(this.addr,!1,t),Hc(n,t)}else{if(Vc(n,r))return;zc.set(r),e.uniformMatrix2fv(this.addr,!1,zc),Hc(n,r)}}function Yc(e,t){let n=this.cache,r=t.elements;if(r===void 0){if(Vc(n,t))return;e.uniformMatrix3fv(this.addr,!1,t),Hc(n,t)}else{if(Vc(n,r))return;Rc.set(r),e.uniformMatrix3fv(this.addr,!1,Rc),Hc(n,r)}}function Xc(e,t){let n=this.cache,r=t.elements;if(r===void 0){if(Vc(n,t))return;e.uniformMatrix4fv(this.addr,!1,t),Hc(n,t)}else{if(Vc(n,r))return;Lc.set(r),e.uniformMatrix4fv(this.addr,!1,Lc),Hc(n,r)}}function Zc(e,t){let n=this.cache;n[0]!==t&&(e.uniform1i(this.addr,t),n[0]=t)}function Qc(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y)&&(e.uniform2i(this.addr,t.x,t.y),n[0]=t.x,n[1]=t.y);else{if(Vc(n,t))return;e.uniform2iv(this.addr,t),Hc(n,t)}}function $c(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y||n[2]!==t.z)&&(e.uniform3i(this.addr,t.x,t.y,t.z),n[0]=t.x,n[1]=t.y,n[2]=t.z);else{if(Vc(n,t))return;e.uniform3iv(this.addr,t),Hc(n,t)}}function el(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y||n[2]!==t.z||n[3]!==t.w)&&(e.uniform4i(this.addr,t.x,t.y,t.z,t.w),n[0]=t.x,n[1]=t.y,n[2]=t.z,n[3]=t.w);else{if(Vc(n,t))return;e.uniform4iv(this.addr,t),Hc(n,t)}}function tl(e,t){let n=this.cache;n[0]!==t&&(e.uniform1ui(this.addr,t),n[0]=t)}function nl(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y)&&(e.uniform2ui(this.addr,t.x,t.y),n[0]=t.x,n[1]=t.y);else{if(Vc(n,t))return;e.uniform2uiv(this.addr,t),Hc(n,t)}}function rl(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y||n[2]!==t.z)&&(e.uniform3ui(this.addr,t.x,t.y,t.z),n[0]=t.x,n[1]=t.y,n[2]=t.z);else{if(Vc(n,t))return;e.uniform3uiv(this.addr,t),Hc(n,t)}}function il(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y||n[2]!==t.z||n[3]!==t.w)&&(e.uniform4ui(this.addr,t.x,t.y,t.z,t.w),n[0]=t.x,n[1]=t.y,n[2]=t.z,n[3]=t.w);else{if(Vc(n,t))return;e.uniform4uiv(this.addr,t),Hc(n,t)}}function al(e){return e.version===0&&(e.compareFunction=519,e.needsUpdate=!0),e}function ol(e,t,n){let r=this.cache,i=n.allocateTextureUnit();r[0]!==i&&(e.uniform1i(this.addr,i),r[0]=i);let a;a=this.type===e.SAMPLER_2D_SHADOW?al(Ac):kc,n.setTexture2D(t||a,i)}function sl(e,t,n){let r=this.cache,i=n.allocateTextureUnit();r[0]!==i&&(e.uniform1i(this.addr,i),r[0]=i),n.setTexture3D(t||Nc,i)}function cl(e,t,n){let r=this.cache,i=n.allocateTextureUnit();r[0]!==i&&(e.uniform1i(this.addr,i),r[0]=i);let a;a=this.type===e.SAMPLER_CUBE_SHADOW?al(jc):Pc,n.setTextureCube(t||a,i)}function ll(e,t,n){let r=this.cache,i=n.allocateTextureUnit();r[0]!==i&&(e.uniform1i(this.addr,i),r[0]=i),n.setTexture2DArray(t||Mc,i)}function ul(e){switch(e){case 5126:return Wc;case 35664:return Gc;case 35665:return Kc;case 35666:return qc;case 35674:return Jc;case 35675:return Yc;case 35676:return Xc;case 5124:case 35670:return Zc;case 35667:case 35671:return Qc;case 35668:case 35672:return $c;case 35669:case 35673:return el;case 5125:return tl;case 36294:return nl;case 36295:return rl;case 36296:return il;case 35678:case 36198:case 36298:case 36306:case 35682:return ol;case 35679:case 36299:case 36307:return sl;case 35680:case 36300:case 36308:case 36293:return cl;case 36289:case 36303:case 36311:case 36292:return ll}}function dl(e,t){e.uniform1fv(this.addr,t)}function fl(e,t){let n=Bc(t,this.size,2);e.uniform2fv(this.addr,n)}function pl(e,t){let n=Bc(t,this.size,3);e.uniform3fv(this.addr,n)}function ml(e,t){let n=Bc(t,this.size,4);e.uniform4fv(this.addr,n)}function hl(e,t){let n=Bc(t,this.size,4);e.uniformMatrix2fv(this.addr,!1,n)}function gl(e,t){let n=Bc(t,this.size,9);e.uniformMatrix3fv(this.addr,!1,n)}function _l(e,t){let n=Bc(t,this.size,16);e.uniformMatrix4fv(this.addr,!1,n)}function vl(e,t){e.uniform1iv(this.addr,t)}function yl(e,t){e.uniform2iv(this.addr,t)}function bl(e,t){e.uniform3iv(this.addr,t)}function xl(e,t){e.uniform4iv(this.addr,t)}function Sl(e,t){e.uniform1uiv(this.addr,t)}function Cl(e,t){e.uniform2uiv(this.addr,t)}function wl(e,t){e.uniform3uiv(this.addr,t)}function Tl(e,t){e.uniform4uiv(this.addr,t)}function El(e,t,n){let r=this.cache,i=t.length,a=Uc(n,i);Vc(r,a)||(e.uniform1iv(this.addr,a),Hc(r,a));let o;o=this.type===e.SAMPLER_2D_SHADOW?al(Ac):kc;for(let e=0;e!==i;++e)n.setTexture2D(t[e]||o,a[e])}function Dl(e,t,n){let r=this.cache,i=t.length,a=Uc(n,i);Vc(r,a)||(e.uniform1iv(this.addr,a),Hc(r,a));for(let e=0;e!==i;++e)n.setTexture3D(t[e]||Nc,a[e])}function Ol(e,t,n){let r=this.cache,i=t.length,a=Uc(n,i);Vc(r,a)||(e.uniform1iv(this.addr,a),Hc(r,a));let o;o=this.type===e.SAMPLER_CUBE_SHADOW?al(jc):Pc;for(let e=0;e!==i;++e)n.setTextureCube(t[e]||o,a[e])}function kl(e,t,n){let r=this.cache,i=t.length,a=Uc(n,i);Vc(r,a)||(e.uniform1iv(this.addr,a),Hc(r,a));for(let e=0;e!==i;++e)n.setTexture2DArray(t[e]||Mc,a[e])}function Al(e){switch(e){case 5126:return dl;case 35664:return fl;case 35665:return pl;case 35666:return ml;case 35674:return hl;case 35675:return gl;case 35676:return _l;case 5124:case 35670:return vl;case 35667:case 35671:return yl;case 35668:case 35672:return bl;case 35669:case 35673:return xl;case 5125:return Sl;case 36294:return Cl;case 36295:return wl;case 36296:return Tl;case 35678:case 36198:case 36298:case 36306:case 35682:return El;case 35679:case 36299:case 36307:return Dl;case 35680:case 36300:case 36308:case 36293:return Ol;case 36289:case 36303:case 36311:case 36292:return kl}}var jl=class{constructor(e,t,n){this.id=e,this.addr=n,this.cache=[],this.type=t.type,this.setValue=ul(t.type)}},Ml=class{constructor(e,t,n){this.id=e,this.addr=n,this.cache=[],this.type=t.type,this.size=t.size,this.setValue=Al(t.type)}},Nl=class{constructor(e){this.id=e,this.seq=[],this.map={}}setValue(e,t,n){let r=this.seq;for(let i=0,a=r.length;i!==a;++i){let a=r[i];a.setValue(e,t[a.id],n)}}},Pl=/(\w+)(\])?(\[|\.)?/g;function Fl(e,t){e.seq.push(t),e.map[t.id]=t}function Il(e,t,n){let r=e.name,i=r.length;for(Pl.lastIndex=0;;){let a=Pl.exec(r),o=Pl.lastIndex,s=a[1],c=a[2]===`]`,l=a[3];if(c&&(s|=0),l===void 0||l===`[`&&o+2===i){Fl(n,l===void 0?new jl(s,e,t):new Ml(s,e,t));break}{let e=n.map[s];e===void 0&&(e=new Nl(s),Fl(n,e)),n=e}}}var Ll=class{constructor(e,t){this.seq=[],this.map={};let n=e.getProgramParameter(t,e.ACTIVE_UNIFORMS);for(let r=0;r<n;++r){let n=e.getActiveUniform(t,r);Il(n,e.getUniformLocation(t,n.name),this)}let r=[],i=[];for(let t of this.seq)t.type===e.SAMPLER_2D_SHADOW||t.type===e.SAMPLER_CUBE_SHADOW||t.type===e.SAMPLER_2D_ARRAY_SHADOW?r.push(t):i.push(t);r.length>0&&(this.seq=r.concat(i))}setValue(e,t,n,r){let i=this.map[t];i!==void 0&&i.setValue(e,n,r)}setOptional(e,t,n){let r=t[n];r!==void 0&&this.setValue(e,n,r)}static upload(e,t,n,r){for(let i=0,a=t.length;i!==a;++i){let a=t[i],o=n[a.id];o.needsUpdate!==!1&&a.setValue(e,o.value,r)}}static seqWithValue(e,t){let n=[];for(let r=0,i=e.length;r!==i;++r){let i=e[r];i.id in t&&n.push(i)}return n}};function Rl(e,t,n){let r=e.createShader(t);return e.shaderSource(r,n),e.compileShader(r),r}var zl=37297,Bl=0;function Vl(e,t){let n=e.split(`
`),r=[],i=Math.max(t-6,0),a=Math.min(t+6,n.length);for(let e=i;e<a;e++){let i=e+1;r.push(`${i===t?`>`:` `} ${i}: ${n[e]}`)}return r.join(`
`)}var Hl=new Nt;function Ul(e){Rt._getMatrix(Hl,Rt.workingColorSpace,e);let t=`mat3( ${Hl.elements.map(e=>e.toFixed(4))} )`;switch(Rt.getTransfer(e)){case ze:return[t,`LinearTransferOETF`];case Be:return[t,`sRGBTransferOETF`];default:return G(`WebGLProgram: Unsupported color space: `,e),[t,`LinearTransferOETF`]}}function Wl(e,t,n){let r=e.getShaderParameter(t,e.COMPILE_STATUS),i=(e.getShaderInfoLog(t)||``).trim();if(r&&i===``)return``;let a=/ERROR: 0:(\d+)/.exec(i);if(a){let r=parseInt(a[1]);return n.toUpperCase()+`

`+i+`

`+Vl(e.getShaderSource(t),r)}return i}function Gl(e,t){let n=Ul(t);return[`vec4 ${e}( vec4 value ) {`,`	return ${n[1]}( vec4( ${n[0]} * value.rgb, value.a ) );`,`}`].join(`
`)}var Kl={1:`Linear`,2:`Reinhard`,3:`Cineon`,4:`ACESFilmic`,6:`AgX`,7:`Neutral`,5:`Custom`};function ql(e,t){let n=Kl[t];return n===void 0?(G(`WebGLProgram: Unsupported toneMapping:`,t),`vec3 `+e+`( vec3 color ) { return LinearToneMapping( color ); }`):`vec3 `+e+`( vec3 color ) { return `+n+`ToneMapping( color ); }`}var Jl=new J;function Yl(){return Rt.getLuminanceCoefficients(Jl),[`float luminance( const in vec3 rgb ) {`,`	const vec3 weights = vec3( ${Jl.x.toFixed(4)}, ${Jl.y.toFixed(4)}, ${Jl.z.toFixed(4)} );`,`	return dot( weights, rgb );`,`}`].join(`
`)}function Xl(e){return[e.extensionClipCullDistance?`#extension GL_ANGLE_clip_cull_distance : require`:``,e.extensionMultiDraw?`#extension GL_ANGLE_multi_draw : require`:``].filter($l).join(`
`)}function Zl(e){let t=[];for(let n in e){let r=e[n];r!==!1&&t.push(`#define `+n+` `+r)}return t.join(`
`)}function Ql(e,t){let n={},r=e.getProgramParameter(t,e.ACTIVE_ATTRIBUTES);for(let i=0;i<r;i++){let r=e.getActiveAttrib(t,i),a=r.name,o=1;r.type===e.FLOAT_MAT2&&(o=2),r.type===e.FLOAT_MAT3&&(o=3),r.type===e.FLOAT_MAT4&&(o=4),n[a]={type:r.type,location:e.getAttribLocation(t,a),locationSize:o}}return n}function $l(e){return e!==``}function eu(e,t){let n=t.numSpotLightShadows+t.numSpotLightMaps-t.numSpotLightShadowsWithMaps;return e.replace(/NUM_SUN_LIGHTS/g,t.numSunLights).replace(/NUM_DIR_LIGHTS/g,t.numDirLights).replace(/NUM_SPOT_LIGHTS/g,t.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,t.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,n).replace(/NUM_RECT_AREA_LIGHTS/g,t.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,t.numPointLights).replace(/NUM_HEMI_LIGHTS/g,t.numHemiLights).replace(/NUM_SUN_LIGHT_SHADOWS/g,t.numSunLightShadows).replace(/NUM_DIR_LIGHT_SHADOWS/g,t.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,t.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,t.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,t.numPointLightShadows).replace(/NUM_LIGHT_PROBE_GRIDS/g,t.numLightProbeGrids)}function tu(e,t){return e.replace(/NUM_CLIPPING_PLANES/g,t.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,t.numClippingPlanes-t.numClipIntersection)}var nu=/^[ \t]*#include +<([\w\d./]+)>/gm;function ru(e){return e.replace(nu,iu)}function iu(e,t){let n=qs[t];if(n===void 0)throw Error(`THREE.WebGLProgram: Can not resolve #include <`+t+`>`);return ru(n)}var au=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function ou(e){return e.replace(au,su)}function su(e,t,n,r){let i=``;for(let e=parseInt(t);e<parseInt(n);e++)i+=r.replace(/\[\s*i\s*\]/g,`[ `+e+` ]`).replace(/UNROLLED_LOOP_INDEX/g,e);return i}function cu(e){let t=`precision ${e.precision} float;
	precision ${e.precision} int;
	precision ${e.precision} sampler2D;
	precision ${e.precision} samplerCube;
	precision ${e.precision} sampler3D;
	precision ${e.precision} sampler2DArray;
	precision ${e.precision} sampler2DShadow;
	precision ${e.precision} samplerCubeShadow;
	precision ${e.precision} sampler2DArrayShadow;
	precision ${e.precision} isampler2D;
	precision ${e.precision} isampler3D;
	precision ${e.precision} isamplerCube;
	precision ${e.precision} isampler2DArray;
	precision ${e.precision} usampler2D;
	precision ${e.precision} usampler3D;
	precision ${e.precision} usamplerCube;
	precision ${e.precision} usampler2DArray;
	`;return e.precision===`highp`?t+=`
#define HIGH_PRECISION`:e.precision===`mediump`?t+=`
#define MEDIUM_PRECISION`:e.precision===`lowp`&&(t+=`
#define LOW_PRECISION`),t}var lu={1:`SHADOWMAP_TYPE_PCF`,3:`SHADOWMAP_TYPE_VSM`};function uu(e){return lu[e.shadowMapType]||`SHADOWMAP_TYPE_BASIC`}var du={302:`ENVMAP_MODE_REFRACTION`};function fu(e){return e.envMap===!1?`ENVMAP_MODE_REFLECTION`:du[e.envMapMode]||`ENVMAP_MODE_REFLECTION`}var pu={0:`ENVMAP_BLENDING_MULTIPLY`,1:`ENVMAP_BLENDING_MIX`,2:`ENVMAP_BLENDING_ADD`};function mu(e){return e.envMap===!1?`ENVMAP_BLENDING_NONE`:pu[e.combine]||`ENVMAP_BLENDING_NONE`}function hu(e,t,n,r){let i=e.getContext(),a=n.defines,o=n.vertexShader,s=n.fragmentShader,c=uu(n),l=n.envMapPMREM===!0?`ENVMAP_TYPE_PMREM`:`ENVMAP_TYPE_CUBE`,u=fu(n),d=mu(n),f=Xl(n),p=Zl(a),m=i.createProgram(),h,g,_=n.glslVersion?`#version `+n.glslVersion+`
`:``;n.isRawShaderMaterial?(h=[`#define SHADER_TYPE `+n.shaderType,`#define SHADER_NAME `+n.shaderName,p].filter($l).join(`
`),h.length>0&&(h+=`
`),g=[`#define SHADER_TYPE `+n.shaderType,`#define SHADER_NAME `+n.shaderName,p].filter($l).join(`
`),g.length>0&&(g+=`
`)):(h=[cu(n),`#define SHADER_TYPE `+n.shaderType,`#define SHADER_NAME `+n.shaderName,p,n.extensionClipCullDistance?`#define USE_CLIP_DISTANCE`:``,n.batching?`#define USE_BATCHING`:``,n.batchingColor?`#define USE_BATCHING_COLOR`:``,n.instancing?`#define USE_INSTANCING`:``,n.instancingColor?`#define USE_INSTANCING_COLOR`:``,n.instancingMorph?`#define USE_INSTANCING_MORPH`:``,n.useFog&&n.fog?`#define USE_FOG`:``,n.useFog&&n.fogExp2?`#define FOG_EXP2`:``,n.map?`#define USE_MAP`:``,n.envMap?`#define USE_ENVMAP`:``,n.envMap?`#define `+u:``,n.lightMap?`#define USE_LIGHTMAP`:``,n.aoMap?`#define USE_AOMAP`:``,n.bumpMap?`#define USE_BUMPMAP`:``,n.normalMap?`#define USE_NORMALMAP`:``,n.normalMapObjectSpace?`#define USE_NORMALMAP_OBJECTSPACE`:``,n.normalMapTangentSpace?`#define USE_NORMALMAP_TANGENTSPACE`:``,n.displacementMap?`#define USE_DISPLACEMENTMAP`:``,n.emissiveMap?`#define USE_EMISSIVEMAP`:``,n.anisotropy?`#define USE_ANISOTROPY`:``,n.anisotropyMap?`#define USE_ANISOTROPYMAP`:``,n.clearcoatMap?`#define USE_CLEARCOATMAP`:``,n.clearcoatRoughnessMap?`#define USE_CLEARCOAT_ROUGHNESSMAP`:``,n.clearcoatNormalMap?`#define USE_CLEARCOAT_NORMALMAP`:``,n.diffuseRoughnessMap?`#define USE_DIFFUSE_ROUGHNESSMAP`:``,n.iridescenceMap?`#define USE_IRIDESCENCEMAP`:``,n.iridescenceThicknessMap?`#define USE_IRIDESCENCE_THICKNESSMAP`:``,n.specularMap?`#define USE_SPECULARMAP`:``,n.specularColorMap?`#define USE_SPECULAR_COLORMAP`:``,n.specularIntensityMap?`#define USE_SPECULAR_INTENSITYMAP`:``,n.roughnessMap?`#define USE_ROUGHNESSMAP`:``,n.metalnessMap?`#define USE_METALNESSMAP`:``,n.alphaMap?`#define USE_ALPHAMAP`:``,n.alphaHash?`#define USE_ALPHAHASH`:``,n.transmission?`#define USE_TRANSMISSION`:``,n.transmissionMap?`#define USE_TRANSMISSIONMAP`:``,n.thicknessMap?`#define USE_THICKNESSMAP`:``,n.sheenColorMap?`#define USE_SHEEN_COLORMAP`:``,n.sheenRoughnessMap?`#define USE_SHEEN_ROUGHNESSMAP`:``,n.mapUv?`#define MAP_UV `+n.mapUv:``,n.alphaMapUv?`#define ALPHAMAP_UV `+n.alphaMapUv:``,n.lightMapUv?`#define LIGHTMAP_UV `+n.lightMapUv:``,n.aoMapUv?`#define AOMAP_UV `+n.aoMapUv:``,n.emissiveMapUv?`#define EMISSIVEMAP_UV `+n.emissiveMapUv:``,n.bumpMapUv?`#define BUMPMAP_UV `+n.bumpMapUv:``,n.normalMapUv?`#define NORMALMAP_UV `+n.normalMapUv:``,n.displacementMapUv?`#define DISPLACEMENTMAP_UV `+n.displacementMapUv:``,n.metalnessMapUv?`#define METALNESSMAP_UV `+n.metalnessMapUv:``,n.roughnessMapUv?`#define ROUGHNESSMAP_UV `+n.roughnessMapUv:``,n.anisotropyMapUv?`#define ANISOTROPYMAP_UV `+n.anisotropyMapUv:``,n.clearcoatMapUv?`#define CLEARCOATMAP_UV `+n.clearcoatMapUv:``,n.clearcoatNormalMapUv?`#define CLEARCOAT_NORMALMAP_UV `+n.clearcoatNormalMapUv:``,n.clearcoatRoughnessMapUv?`#define CLEARCOAT_ROUGHNESSMAP_UV `+n.clearcoatRoughnessMapUv:``,n.diffuseRoughnessMapUv?`#define DIFFUSE_ROUGHNESSMAP_UV `+n.diffuseRoughnessMapUv:``,n.iridescenceMapUv?`#define IRIDESCENCEMAP_UV `+n.iridescenceMapUv:``,n.iridescenceThicknessMapUv?`#define IRIDESCENCE_THICKNESSMAP_UV `+n.iridescenceThicknessMapUv:``,n.sheenColorMapUv?`#define SHEEN_COLORMAP_UV `+n.sheenColorMapUv:``,n.sheenRoughnessMapUv?`#define SHEEN_ROUGHNESSMAP_UV `+n.sheenRoughnessMapUv:``,n.specularMapUv?`#define SPECULARMAP_UV `+n.specularMapUv:``,n.specularColorMapUv?`#define SPECULAR_COLORMAP_UV `+n.specularColorMapUv:``,n.specularIntensityMapUv?`#define SPECULAR_INTENSITYMAP_UV `+n.specularIntensityMapUv:``,n.transmissionMapUv?`#define TRANSMISSIONMAP_UV `+n.transmissionMapUv:``,n.thicknessMapUv?`#define THICKNESSMAP_UV `+n.thicknessMapUv:``,n.vertexTangents&&n.flatShading===!1?`#define USE_TANGENT`:``,n.vertexNormals?`#define HAS_NORMAL`:``,n.vertexColors?`#define USE_COLOR`:``,n.vertexAlphas?`#define USE_COLOR_ALPHA`:``,n.vertexUv1s?`#define USE_UV1`:``,n.vertexUv2s?`#define USE_UV2`:``,n.vertexUv3s?`#define USE_UV3`:``,n.pointsUvs?`#define USE_POINTS_UV`:``,n.flatShading?`#define FLAT_SHADED`:``,n.skinning?`#define USE_SKINNING`:``,n.morphTargets?`#define USE_MORPHTARGETS`:``,n.morphNormals&&n.flatShading===!1?`#define USE_MORPHNORMALS`:``,n.morphColors?`#define USE_MORPHCOLORS`:``,n.morphTargetsCount>0?`#define MORPHTARGETS_TEXTURE_STRIDE `+n.morphTextureStride:``,n.morphTargetsCount>0?`#define MORPHTARGETS_COUNT `+n.morphTargetsCount:``,n.doubleSided?`#define DOUBLE_SIDED`:``,n.flipSided?`#define FLIP_SIDED`:``,n.shadowMapEnabled?`#define USE_SHADOWMAP`:``,n.shadowMapEnabled?`#define `+c:``,n.sizeAttenuation?`#define USE_SIZEATTENUATION`:``,n.numLightProbes>0?`#define USE_LIGHT_PROBES`:``,n.logarithmicDepthBuffer?`#define USE_LOGARITHMIC_DEPTH_BUFFER`:``,n.reversedDepthBuffer?`#define USE_REVERSED_DEPTH_BUFFER`:``,`uniform mat4 modelMatrix;`,`uniform mat4 modelViewMatrix;`,`uniform mat4 projectionMatrix;`,`uniform mat4 viewMatrix;`,`uniform mat3 normalMatrix;`,`uniform vec3 cameraPosition;`,`uniform bool isOrthographic;`,`#ifdef USE_INSTANCING`,`	attribute mat4 instanceMatrix;`,`#endif`,`#ifdef USE_INSTANCING_COLOR`,`	attribute vec3 instanceColor;`,`#endif`,`#ifdef USE_INSTANCING_MORPH`,`	uniform sampler2D morphTexture;`,`#endif`,`attribute vec3 position;`,`attribute vec3 normal;`,`attribute vec2 uv;`,`#ifdef USE_UV1`,`	attribute vec2 uv1;`,`#endif`,`#ifdef USE_UV2`,`	attribute vec2 uv2;`,`#endif`,`#ifdef USE_UV3`,`	attribute vec2 uv3;`,`#endif`,`#ifdef USE_TANGENT`,`	attribute vec4 tangent;`,`#endif`,`#if defined( USE_COLOR_ALPHA )`,`	attribute vec4 color;`,`#elif defined( USE_COLOR )`,`	attribute vec3 color;`,`#endif`,`#ifdef USE_SKINNING`,`	attribute vec4 skinIndex;`,`	attribute vec4 skinWeight;`,`#endif`,`
`].filter($l).join(`
`),g=[cu(n),`#define SHADER_TYPE `+n.shaderType,`#define SHADER_NAME `+n.shaderName,p,n.useFog&&n.fog?`#define USE_FOG`:``,n.useFog&&n.fogExp2?`#define FOG_EXP2`:``,n.alphaToCoverage?`#define ALPHA_TO_COVERAGE`:``,n.map?`#define USE_MAP`:``,n.matcap?`#define USE_MATCAP`:``,n.envMap?`#define USE_ENVMAP`:``,n.envMap?`#define `+l:``,n.envMap?`#define `+u:``,n.envMap?`#define `+d:``,n.envMapPMREM?`#define ENVMAP_MAX_LOD `+n.envMapMaxLod+`.0`:``,n.envMapPMREM?`#define ENVMAP_SIZE `+n.envMapSize+`.0`:``,n.lightMap?`#define USE_LIGHTMAP`:``,n.aoMap?`#define USE_AOMAP`:``,n.bumpMap?`#define USE_BUMPMAP`:``,n.normalMap?`#define USE_NORMALMAP`:``,n.normalMapObjectSpace?`#define USE_NORMALMAP_OBJECTSPACE`:``,n.normalMapTangentSpace?`#define USE_NORMALMAP_TANGENTSPACE`:``,n.packedNormalMap?`#define USE_PACKED_NORMALMAP`:``,n.emissiveMap?`#define USE_EMISSIVEMAP`:``,n.anisotropy?`#define USE_ANISOTROPY`:``,n.anisotropyMap?`#define USE_ANISOTROPYMAP`:``,n.clearcoat?`#define USE_CLEARCOAT`:``,n.clearcoatMap?`#define USE_CLEARCOATMAP`:``,n.clearcoatRoughnessMap?`#define USE_CLEARCOAT_ROUGHNESSMAP`:``,n.clearcoatNormalMap?`#define USE_CLEARCOAT_NORMALMAP`:``,n.diffuseRoughness?`#define USE_DIFFUSE_ROUGHNESS`:``,n.diffuseRoughnessMap?`#define USE_DIFFUSE_ROUGHNESSMAP`:``,n.dispersion?`#define USE_DISPERSION`:``,n.retroreflection?`#define USE_RETROREFLECTION`:``,n.iridescence?`#define USE_IRIDESCENCE`:``,n.iridescenceMap?`#define USE_IRIDESCENCEMAP`:``,n.iridescenceThicknessMap?`#define USE_IRIDESCENCE_THICKNESSMAP`:``,n.specularMap?`#define USE_SPECULARMAP`:``,n.specularColorMap?`#define USE_SPECULAR_COLORMAP`:``,n.specularIntensityMap?`#define USE_SPECULAR_INTENSITYMAP`:``,n.roughnessMap?`#define USE_ROUGHNESSMAP`:``,n.metalnessMap?`#define USE_METALNESSMAP`:``,n.alphaMap?`#define USE_ALPHAMAP`:``,n.alphaTest?`#define USE_ALPHATEST`:``,n.alphaHash?`#define USE_ALPHAHASH`:``,n.sheen?`#define USE_SHEEN`:``,n.sheenColorMap?`#define USE_SHEEN_COLORMAP`:``,n.sheenRoughnessMap?`#define USE_SHEEN_ROUGHNESSMAP`:``,n.transmission?`#define USE_TRANSMISSION`:``,n.transmissionMap?`#define USE_TRANSMISSIONMAP`:``,n.thicknessMap?`#define USE_THICKNESSMAP`:``,n.vertexTangents&&n.flatShading===!1?`#define USE_TANGENT`:``,n.vertexColors||n.instancingColor?`#define USE_COLOR`:``,n.vertexAlphas||n.batchingColor?`#define USE_COLOR_ALPHA`:``,n.vertexUv1s?`#define USE_UV1`:``,n.vertexUv2s?`#define USE_UV2`:``,n.vertexUv3s?`#define USE_UV3`:``,n.pointsUvs?`#define USE_POINTS_UV`:``,n.gradientMap?`#define USE_GRADIENTMAP`:``,n.flatShading?`#define FLAT_SHADED`:``,n.doubleSided?`#define DOUBLE_SIDED`:``,n.flipSided?`#define FLIP_SIDED`:``,n.shadowMapEnabled?`#define USE_SHADOWMAP`:``,n.shadowMapEnabled?`#define `+c:``,n.premultipliedAlpha?`#define PREMULTIPLIED_ALPHA`:``,n.numLightProbes>0?`#define USE_LIGHT_PROBES`:``,n.decodeVideoTexture?`#define DECODE_VIDEO_TEXTURE`:``,n.decodeVideoTextureEmissive?`#define DECODE_VIDEO_TEXTURE_EMISSIVE`:``,n.logarithmicDepthBuffer?`#define USE_LOGARITHMIC_DEPTH_BUFFER`:``,n.reversedDepthBuffer?`#define USE_REVERSED_DEPTH_BUFFER`:``,`uniform mat4 viewMatrix;`,`uniform vec3 cameraPosition;`,`uniform bool isOrthographic;`,n.toneMapping===0?``:`#define TONE_MAPPING`,n.toneMapping===0?``:qs.tonemapping_pars_fragment,n.toneMapping===0?``:ql(`toneMapping`,n.toneMapping),n.dithering?`#define DITHERING`:``,n.opaque?`#define OPAQUE`:``,qs.colorspace_pars_fragment,Gl(`linearToOutputTexel`,n.outputColorSpace),Yl(),n.useDepthPacking?`#define DEPTH_PACKING `+n.depthPacking:``,`
`].filter($l).join(`
`)),o=ru(o),o=eu(o,n),o=tu(o,n),s=ru(s),s=eu(s,n),s=tu(s,n),o=ou(o),s=ou(s),n.isRawShaderMaterial!==!0&&(_=`#version 300 es
`,h=[f,`#define attribute in`,`#define varying out`,`#define texture2D texture`].join(`
`)+`
`+h,g=[`#define varying in`,n.glslVersion===`300 es`?``:`layout(location = 0) out highp vec4 pc_fragColor;`,n.glslVersion===`300 es`?``:`#define gl_FragColor pc_fragColor`,`#define gl_FragDepthEXT gl_FragDepth`,`#define texture2D texture`,`#define textureCube texture`,`#define texture2DProj textureProj`,`#define texture2DLodEXT textureLod`,`#define texture2DProjLodEXT textureProjLod`,`#define textureCubeLodEXT textureLod`,`#define texture2DGradEXT textureGrad`,`#define texture2DProjGradEXT textureProjGrad`,`#define textureCubeGradEXT textureGrad`].join(`
`)+`
`+g);let v=_+h+o,y=_+g+s,b=Rl(i,i.VERTEX_SHADER,v),x=Rl(i,i.FRAGMENT_SHADER,y);i.attachShader(m,b),i.attachShader(m,x),n.index0AttributeName===void 0?n.hasPositionAttribute===!0&&i.bindAttribLocation(m,0,`position`):i.bindAttribLocation(m,0,n.index0AttributeName),i.linkProgram(m);function S(t){if(e.debug.checkShaderErrors){let n=i.getProgramInfoLog(m)||``,r=i.getShaderInfoLog(b)||``,a=i.getShaderInfoLog(x)||``,o=n.trim(),s=r.trim(),c=a.trim(),l=!0,u=!0;if(i.getProgramParameter(m,i.LINK_STATUS)===!1){if(l=!1,typeof e.debug.onShaderError==`function`)e.debug.onShaderError(i,m,b,x);else{let e=Wl(i,b,`vertex`),n=Wl(i,x,`fragment`);K(`WebGLProgram: Shader Error `+i.getError()+` - VALIDATE_STATUS `+i.getProgramParameter(m,i.VALIDATE_STATUS)+`

Material Name: `+t.name+`
Material Type: `+t.type+`

Program Info Log: `+o+`
`+e+`
`+n)}}else o===``?(s===``||c===``)&&(u=!1):G(`WebGLProgram: Program Info Log:`,o);u&&(t.diagnostics={runnable:l,programLog:o,vertexShader:{log:s,prefix:h},fragmentShader:{log:c,prefix:g}})}i.deleteShader(b),i.deleteShader(x),C=new Ll(i,m),w=Ql(i,m)}let C;this.getUniforms=function(){return C===void 0&&S(this),C};let w;this.getAttributes=function(){return w===void 0&&S(this),w};let T=n.rendererExtensionParallelShaderCompile===!1;return this.isReady=function(){return T===!1&&(T=i.getProgramParameter(m,zl)),T},this.destroy=function(){r.releaseStatesOfProgram(this),i.deleteProgram(m),this.program=void 0},this.type=n.shaderType,this.name=n.shaderName,this.id=Bl++,this.cacheKey=t,this.usedTimes=1,this.program=m,this.vertexShader=b,this.fragmentShader=x,this}var gu=0,_u=class{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(e,t,n){let r=this._getShaderCacheForMaterial(e);return r.has(t)===!1&&(r.add(t),t.usedTimes++),r.has(n)===!1&&(r.add(n),n.usedTimes++),this}remove(e){let t=this.materialCache.get(e);for(let e of t)e.usedTimes--,e.usedTimes===0&&this.shaderCache.delete(e.code);return this.materialCache.delete(e),this}getVertexShaderStage(e){return this._getShaderStage(e.vertexShader)}getFragmentShaderStage(e){return this._getShaderStage(e.fragmentShader)}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(e){let t=this.materialCache,n=t.get(e);return n===void 0&&(n=new Set,t.set(e,n)),n}_getShaderStage(e){let t=this.shaderCache,n=t.get(e);return n===void 0&&(n=new vu(e),t.set(e,n)),n}},vu=class{constructor(e){this.id=gu++,this.code=e,this.usedTimes=0}};function yu(e){return e===1030||e===37490||e===36285}function bu(e,t,n,r,i,a){let o=new dn,s=new _u,c=new Set,l=[],u=new Map,d=r.logarithmicDepthBuffer,f={MeshDepthMaterial:`depth`,MeshDistanceMaterial:`distance`,MeshNormalMaterial:`normal`,MeshBasicMaterial:`basic`,MeshLambertMaterial:`lambert`,MeshPhongMaterial:`phong`,MeshToonMaterial:`toon`,MeshStandardMaterial:`physical`,MeshPhysicalMaterial:`physical`,MeshMatcapMaterial:`matcap`,LineBasicMaterial:`basic`,LineDashedMaterial:`dashed`,PointsMaterial:`points`,ShadowMaterial:`shadow`,SpriteMaterial:`sprite`};function p(e){return c.add(e),e===0?`uv`:`uv${e}`}function m(i,o,l,u,m,h){let g=u.fog,_=m.geometry,v=i.isMeshStandardMaterial||i.isMeshLambertMaterial||i.isMeshPhongMaterial?u.environment:null,y=i.isMeshStandardMaterial||i.isMeshLambertMaterial&&!i.envMap||i.isMeshPhongMaterial&&!i.envMap,b=t.get(i.envMap||v,y),x=f[i.type],S=r.precision;i.precision!==null&&(S=r.getMaxPrecision(i.precision),S!==i.precision&&G(`WebGLProgram.getParameters:`,i.precision,`not supported, using`,S,`instead.`));let C=_.morphAttributes.position||_.morphAttributes.normal||_.morphAttributes.color,w=C===void 0?0:C.length,T=0;_.morphAttributes.position!==void 0&&(T=1),_.morphAttributes.normal!==void 0&&(T=2),_.morphAttributes.color!==void 0&&(T=3);let E,D,O,k;if(x){let e=Js[x];E=e.vertexShader,D=e.fragmentShader}else{E=i.vertexShader,D=i.fragmentShader;let e=s.getVertexShaderStage(i),t=s.getFragmentShaderStage(i);s.update(i,e,t),O=e.id,k=t.id}let A=e.getRenderTarget(),j=e.state.buffers.depth.getReversed(),M=m.isInstancedMesh===!0,ee=m.isBatchedMesh===!0,N=!!i.map,P=!!i.matcap,F=!!b,te=F&&b.isPMREMTexture===!0,I=!!i.aoMap,ne=!!i.lightMap,re=!!i.bumpMap&&i.wireframe===!1,L=!!i.normalMap,ie=!!i.displacementMap,ae=!!i.emissiveMap,R=!!i.metalnessMap,z=!!i.roughnessMap,B=i.anisotropy>0,oe=i.clearcoat>0,se=i.diffuseRoughness>0,ce=i.dispersion>0,le=i.retroreflectivity>0,ue=i.iridescence>0,de=i.sheen>0,fe=i.transmission>0,pe=B&&!!i.anisotropyMap,me=oe&&!!i.clearcoatMap,he=oe&&!!i.clearcoatNormalMap,ge=oe&&!!i.clearcoatRoughnessMap,_e=se&&!!i.diffuseRoughnessMap,ve=ue&&!!i.iridescenceMap,ye=ue&&!!i.iridescenceThicknessMap,be=de&&!!i.sheenColorMap,xe=de&&!!i.sheenRoughnessMap,Se=!!i.specularMap,Ce=!!i.specularColorMap,we=!!i.specularIntensityMap,Te=fe&&!!i.transmissionMap,Ee=fe&&!!i.thicknessMap,De=!!i.gradientMap,Oe=!!i.alphaMap,V=i.alphaTest>0,ke=!!i.alphaHash,Ae=!!i.extensions,je=0;i.toneMapped&&(A===null||A.isXRRenderTarget===!0)&&(je=e.toneMapping);let H=te?b.isCompressedCubeTexture?b.image[0].mipmaps:b.mipmaps:null,Me={shaderID:x,shaderType:i.type,shaderName:i.name,vertexShader:E,fragmentShader:D,defines:i.defines,customVertexShaderID:O,customFragmentShaderID:k,isRawShaderMaterial:i.isRawShaderMaterial===!0,glslVersion:i.glslVersion,precision:S,batching:ee,batchingColor:ee&&m._colorsTexture!==null,instancing:M,instancingColor:M&&m.instanceColor!==null,instancingMorph:M&&m.morphTexture!==null,outputColorSpace:A===null?e.outputColorSpace:A.isXRRenderTarget===!0?A.texture.colorSpace:Rt.workingColorSpace,alphaToCoverage:!!i.alphaToCoverage,map:N,matcap:P,envMap:F,envMapMode:F&&b.mapping,envMapPMREM:te,envMapMaxLod:te?H.length-1:null,envMapSize:te?H[0].width:null,aoMap:I,lightMap:ne,bumpMap:re,normalMap:L,displacementMap:ie,emissiveMap:ae,normalMapObjectSpace:L&&i.normalMapType===1,normalMapTangentSpace:L&&i.normalMapType===0,packedNormalMap:L&&i.normalMapType===0&&yu(i.normalMap.format),metalnessMap:R,roughnessMap:z,anisotropy:B,anisotropyMap:pe,clearcoat:oe,clearcoatMap:me,clearcoatNormalMap:he,clearcoatRoughnessMap:ge,diffuseRoughness:se,diffuseRoughnessMap:_e,dispersion:ce,retroreflection:le,iridescence:ue,iridescenceMap:ve,iridescenceThicknessMap:ye,sheen:de,sheenColorMap:be,sheenRoughnessMap:xe,specularMap:Se,specularColorMap:Ce,specularIntensityMap:we,transmission:fe,transmissionMap:Te,thicknessMap:Ee,gradientMap:De,opaque:i.transparent===!1&&i.blending===1&&i.alphaToCoverage===!1,alphaMap:Oe,alphaTest:V,alphaHash:ke,combine:i.combine,mapUv:N&&p(i.map.channel),aoMapUv:I&&p(i.aoMap.channel),lightMapUv:ne&&p(i.lightMap.channel),bumpMapUv:re&&p(i.bumpMap.channel),normalMapUv:L&&p(i.normalMap.channel),displacementMapUv:ie&&p(i.displacementMap.channel),emissiveMapUv:ae&&p(i.emissiveMap.channel),metalnessMapUv:R&&p(i.metalnessMap.channel),roughnessMapUv:z&&p(i.roughnessMap.channel),anisotropyMapUv:pe&&p(i.anisotropyMap.channel),clearcoatMapUv:me&&p(i.clearcoatMap.channel),clearcoatNormalMapUv:he&&p(i.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:ge&&p(i.clearcoatRoughnessMap.channel),diffuseRoughnessMapUv:_e&&p(i.diffuseRoughnessMap.channel),iridescenceMapUv:ve&&p(i.iridescenceMap.channel),iridescenceThicknessMapUv:ye&&p(i.iridescenceThicknessMap.channel),sheenColorMapUv:be&&p(i.sheenColorMap.channel),sheenRoughnessMapUv:xe&&p(i.sheenRoughnessMap.channel),specularMapUv:Se&&p(i.specularMap.channel),specularColorMapUv:Ce&&p(i.specularColorMap.channel),specularIntensityMapUv:we&&p(i.specularIntensityMap.channel),transmissionMapUv:Te&&p(i.transmissionMap.channel),thicknessMapUv:Ee&&p(i.thicknessMap.channel),alphaMapUv:Oe&&p(i.alphaMap.channel),vertexTangents:!!_.attributes.tangent&&(L||B),vertexNormals:!!_.attributes.normal,vertexColors:i.vertexColors,vertexAlphas:i.vertexColors===!0&&!!_.attributes.color&&_.attributes.color.itemSize===4,pointsUvs:m.isPoints===!0&&!!_.attributes.uv&&(N||Oe),fog:!!g,useFog:i.fog===!0,fogExp2:!!g&&g.isFogExp2,flatShading:i.wireframe===!1&&(i.flatShading===!0||_.attributes.normal===void 0&&L===!1&&(i.isMeshLambertMaterial||i.isMeshPhongMaterial||i.isMeshStandardMaterial||i.isMeshPhysicalMaterial)),sizeAttenuation:i.sizeAttenuation===!0,logarithmicDepthBuffer:d,reversedDepthBuffer:j,skinning:m.isSkinnedMesh===!0,hasPositionAttribute:_.attributes.position!==void 0,morphTargets:_.morphAttributes.position!==void 0,morphNormals:_.morphAttributes.normal!==void 0,morphColors:_.morphAttributes.color!==void 0,morphTargetsCount:w,morphTextureStride:T,numSunLights:o.sun.length,numDirLights:o.directional.length,numPointLights:o.point.length,numSpotLights:o.spot.length,numSpotLightMaps:o.spotLightMap.length,numRectAreaLights:o.rectArea.length,numHemiLights:o.hemi.length,numSunLightShadows:o.sunShadowMap.length,numDirLightShadows:o.directionalShadowMap.length,numPointLightShadows:o.pointShadowMap.length,numSpotLightShadows:o.spotShadowMap.length,numSpotLightShadowsWithMaps:o.numSpotLightShadowsWithMaps,numLightProbes:o.numLightProbes,numLightProbeGrids:h.filter(e=>e.texture!==null).length,numClippingPlanes:a.numPlanes,numClipIntersection:a.numIntersection,dithering:i.dithering,shadowMapEnabled:e.shadowMap.enabled&&l.length>0,shadowMapType:e.shadowMap.type,toneMapping:je,decodeVideoTexture:N&&i.map.isVideoTexture===!0&&Rt.getTransfer(i.map.colorSpace)===`srgb`,decodeVideoTextureEmissive:ae&&i.emissiveMap.isVideoTexture===!0&&Rt.getTransfer(i.emissiveMap.colorSpace)===`srgb`,premultipliedAlpha:i.premultipliedAlpha,doubleSided:i.side===2,flipSided:i.side===1,useDepthPacking:i.depthPacking>=0,depthPacking:i.depthPacking||0,index0AttributeName:i.index0AttributeName,extensionClipCullDistance:Ae&&i.extensions.clipCullDistance===!0&&n.has(`WEBGL_clip_cull_distance`),extensionMultiDraw:(Ae&&i.extensions.multiDraw===!0||ee)&&n.has(`WEBGL_multi_draw`),rendererExtensionParallelShaderCompile:n.has(`KHR_parallel_shader_compile`),customProgramCacheKey:i.customProgramCacheKey()};return Me.vertexUv1s=c.has(1),Me.vertexUv2s=c.has(2),Me.vertexUv3s=c.has(3),c.clear(),Me}function h(t){let n=[];if(t.shaderID?n.push(t.shaderID):(n.push(t.customVertexShaderID),n.push(t.customFragmentShaderID)),t.defines!==void 0)for(let e in t.defines)n.push(e),n.push(t.defines[e]);return t.isRawShaderMaterial===!1&&(g(n,t),_(n,t),n.push(e.outputColorSpace)),n.push(t.customProgramCacheKey),n.join()}function g(e,t){e.push(t.precision),e.push(t.outputColorSpace),e.push(t.envMapMode),e.push(t.envMapPMREM),e.push(t.envMapMaxLod),e.push(t.envMapSize),e.push(t.mapUv),e.push(t.alphaMapUv),e.push(t.lightMapUv),e.push(t.aoMapUv),e.push(t.bumpMapUv),e.push(t.normalMapUv),e.push(t.displacementMapUv),e.push(t.emissiveMapUv),e.push(t.metalnessMapUv),e.push(t.roughnessMapUv),e.push(t.anisotropyMapUv),e.push(t.clearcoatMapUv),e.push(t.clearcoatNormalMapUv),e.push(t.clearcoatRoughnessMapUv),e.push(t.diffuseRoughnessMapUv),e.push(t.iridescenceMapUv),e.push(t.iridescenceThicknessMapUv),e.push(t.sheenColorMapUv),e.push(t.sheenRoughnessMapUv),e.push(t.specularMapUv),e.push(t.specularColorMapUv),e.push(t.specularIntensityMapUv),e.push(t.transmissionMapUv),e.push(t.thicknessMapUv),e.push(t.combine),e.push(t.fogExp2),e.push(t.sizeAttenuation),e.push(t.morphTargetsCount),e.push(t.numSunLights),e.push(t.numDirLights),e.push(t.numPointLights),e.push(t.numSpotLights),e.push(t.numSpotLightMaps),e.push(t.numHemiLights),e.push(t.numRectAreaLights),e.push(t.numSunLightShadows),e.push(t.numDirLightShadows),e.push(t.numPointLightShadows),e.push(t.numSpotLightShadows),e.push(t.numSpotLightShadowsWithMaps),e.push(t.numLightProbes),e.push(t.numLightProbeGrids),e.push(t.shadowMapType),e.push(t.toneMapping),e.push(t.numClippingPlanes),e.push(t.numClipIntersection),e.push(t.depthPacking)}function _(e,t){o.disableAll(),t.instancing&&o.enable(0),t.instancingColor&&o.enable(1),t.instancingMorph&&o.enable(2),t.matcap&&o.enable(3),t.envMap&&o.enable(4),t.normalMapObjectSpace&&o.enable(5),t.normalMapTangentSpace&&o.enable(6),t.clearcoat&&o.enable(7),t.iridescence&&o.enable(8),t.alphaTest&&o.enable(9),t.vertexColors&&o.enable(10),t.vertexAlphas&&o.enable(11),t.vertexUv1s&&o.enable(12),t.vertexUv2s&&o.enable(13),t.vertexUv3s&&o.enable(14),t.vertexTangents&&o.enable(15),t.anisotropy&&o.enable(16),t.alphaHash&&o.enable(17),t.batching&&o.enable(18),t.dispersion&&o.enable(19),t.retroreflection&&o.enable(24),t.diffuseRoughness&&o.enable(25),t.batchingColor&&o.enable(20),t.gradientMap&&o.enable(21),t.packedNormalMap&&o.enable(22),t.vertexNormals&&o.enable(23),e.push(o.mask),o.disableAll(),t.fog&&o.enable(0),t.useFog&&o.enable(1),t.flatShading&&o.enable(2),t.logarithmicDepthBuffer&&o.enable(3),t.reversedDepthBuffer&&o.enable(4),t.skinning&&o.enable(5),t.morphTargets&&o.enable(6),t.morphNormals&&o.enable(7),t.morphColors&&o.enable(8),t.premultipliedAlpha&&o.enable(9),t.shadowMapEnabled&&o.enable(10),t.doubleSided&&o.enable(11),t.flipSided&&o.enable(12),t.useDepthPacking&&o.enable(13),t.dithering&&o.enable(14),t.transmission&&o.enable(15),t.sheen&&o.enable(16),t.opaque&&o.enable(17),t.pointsUvs&&o.enable(18),t.decodeVideoTexture&&o.enable(19),t.decodeVideoTextureEmissive&&o.enable(20),t.alphaToCoverage&&o.enable(21),t.numLightProbeGrids>0&&o.enable(22),t.hasPositionAttribute&&o.enable(23),e.push(o.mask)}function v(e){let t=f[e.type],n;if(t){let e=Js[t];n=ao.clone(e.uniforms)}else n=e.uniforms;return n}function y(t,n){let r=u.get(n);return r===void 0?(r=new hu(e,n,t,i),l.push(r),u.set(n,r)):++r.usedTimes,r}function b(e){if(--e.usedTimes===0){let t=l.indexOf(e);l[t]=l[l.length-1],l.pop(),u.delete(e.cacheKey),e.destroy()}}function x(e){s.remove(e)}function S(){s.dispose()}return{getParameters:m,getProgramCacheKey:h,getUniforms:v,acquireProgram:y,releaseProgram:b,releaseShaderCache:x,programs:l,dispose:S}}function xu(){let e=new WeakMap;function t(t){return e.has(t)}function n(t){let n=e.get(t);return n===void 0&&(n={},e.set(t,n)),n}function r(t){e.delete(t)}function i(t,n,r){e.get(t)[n]=r}function a(){e=new WeakMap}return{has:t,get:n,remove:r,update:i,dispose:a}}function Su(e,t){return e.groupOrder===t.groupOrder?e.renderOrder===t.renderOrder?e.material.id===t.material.id?e.materialVariant===t.materialVariant?e.z===t.z?e.id-t.id:e.z-t.z:e.materialVariant-t.materialVariant:e.material.id-t.material.id:e.renderOrder-t.renderOrder:e.groupOrder-t.groupOrder}function Cu(e,t){return e.groupOrder===t.groupOrder?e.renderOrder===t.renderOrder?e.z===t.z?e.id-t.id:t.z-e.z:e.renderOrder-t.renderOrder:e.groupOrder-t.groupOrder}function wu(){let e=[],t=0,n=[],r=[],i=[];function a(){t=0,n.length=0,r.length=0,i.length=0}function o(e){let t=0;return e.isInstancedMesh&&(t+=2),e.isSkinnedMesh&&(t+=1),t}function s(n,r,i,a,s,c){let l=e[t];return l===void 0?(l={id:n.id,object:n,geometry:r,material:i,materialVariant:o(n),groupOrder:a,renderOrder:n.renderOrder,z:s,group:c},e[t]=l):(l.id=n.id,l.object=n,l.geometry=r,l.material=i,l.materialVariant=o(n),l.groupOrder=a,l.renderOrder=n.renderOrder,l.z=s,l.group=c),t++,l}function c(e,t,a,o,c,l,u){u.reversedDepth===!0&&(c=-c);let d=s(e,t,a,o,c,l);a.transmission>0?r.push(d):a.transparent===!0?i.push(d):n.push(d)}function l(e,t,a,o,c,l){let u=s(e,t,a,o,c,l);a.transmission>0?r.unshift(u):a.transparent===!0?i.unshift(u):n.unshift(u)}function u(e,t){n.length>1&&n.sort(e||Su),r.length>1&&r.sort(t||Cu),i.length>1&&i.sort(t||Cu)}function d(){for(let n=t,r=e.length;n<r;n++){let t=e[n];if(t.id===null)break;t.id=null,t.object=null,t.geometry=null,t.material=null,t.group=null}}return{opaque:n,transmissive:r,transparent:i,init:a,push:c,unshift:l,finish:d,sort:u}}function Tu(){let e=new WeakMap;function t(t,n){let r=e.get(t),i;return r===void 0?(i=new wu,e.set(t,[i])):n>=r.length?(i=new wu,r.push(i)):i=r[n],i}function n(){e=new WeakMap}return{get:t,dispose:n}}function Eu(){let e={};return{get:function(t){if(e[t.id]!==void 0)return e[t.id];let n;switch(t.type){case`SunLight`:case`DirectionalLight`:n={direction:new J,color:new X};break;case`SpotLight`:n={position:new J,direction:new J,color:new X,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case`PointLight`:n={position:new J,color:new X,distance:0,decay:0};break;case`HemisphereLight`:n={direction:new J,skyColor:new X,groundColor:new X};break;case`RectAreaLight`:n={color:new X,position:new J,halfWidth:new J,halfHeight:new J}}return e[t.id]=n,n}}}function Du(){let e={};return{get:function(t){if(e[t.id]!==void 0)return e[t.id];let n;switch(t.type){case`SunLight`:case`DirectionalLight`:n={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new q};break;case`SpotLight`:n={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new q};break;case`PointLight`:n={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new q,shadowCameraNear:1,shadowCameraFar:1e3}}return e[t.id]=n,n}}}var Ou=0;function ku(e,t){return(t.castShadow?2:0)-(e.castShadow?2:0)+ +!!t.map-!!e.map}function Au(e){let t=new Eu,n=Du(),r={version:0,hash:{sunLength:-1,directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numSunShadows:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],sun:[],sunShadow:[],sunShadowMap:[],sunShadowMatrix:[],sunShadowCascade:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let e=0;e<9;e++)r.probe.push(new J);let i=new J,a=new Y,o=new Y;function s(i){let a=0,o=0,s=0;for(let e=0;e<9;e++)r.probe[e].set(0,0,0);let c=0,l=0,u=0,d=0,f=0,p=0,m=0,h=0,g=0,_=0,v=0,y=0,b=0,x=0;i.sort(ku);for(let e=0,S=i.length;e<S;e++){let S=i[e],C=S.color,w=S.intensity,T=S.distance,E=null;if(S.shadow&&S.shadow.map&&(E=S.shadow.map.texture.format===1030?S.shadow.map.texture:S.shadow.map.depthTexture||S.shadow.map.texture),S.isAmbientLight)a+=C.r*w,o+=C.g*w,s+=C.b*w;else if(S.isLightProbe){for(let e=0;e<9;e++)r.probe[e].addScaledVector(S.sh.coefficients[e],w);x++}else if(S.isSunLight){let e=t.get(S);if(e.color.copy(S.color).multiplyScalar(S.intensity),S.castShadow){let e=S.shadow,t=n.get(S);t.shadowIntensity=e.intensity,t.shadowBias=e.bias,t.shadowNormalBias=e.normalBias,t.shadowRadius=e.radius,t.shadowMapSize.copy(e.mapSize).multiply(e.getFrameExtents()),r.sunShadow[l]=t,r.sunShadowMap[l]=E;let i=e.getViewportCount();for(let t=0;t<i;t++)r.sunShadowMatrix[u+t]=e.getMatrix(t),r.sunShadowCascade[u+t]=e._cascadeData[t];u+=i,l++}r.sun[c]=e,c++}else if(S.isDirectionalLight){let e=t.get(S);if(e.color.copy(S.color).multiplyScalar(S.intensity),S.castShadow){let e=S.shadow,t=n.get(S);t.shadowIntensity=e.intensity,t.shadowBias=e.bias,t.shadowNormalBias=e.normalBias,t.shadowRadius=e.radius,t.shadowMapSize=e.mapSize,r.directionalShadow[d]=t,r.directionalShadowMap[d]=E,r.directionalShadowMatrix[d]=S.shadow.matrix,g++}r.directional[d]=e,d++}else if(S.isSpotLight){let e=t.get(S);e.position.setFromMatrixPosition(S.matrixWorld),e.color.copy(C).multiplyScalar(w),e.distance=T,e.coneCos=Math.cos(S.angle),e.penumbraCos=Math.cos(S.angle*(1-S.penumbra)),e.decay=S.decay,r.spot[p]=e;let i=S.shadow;if(S.map&&(r.spotLightMap[y]=S.map,y++,i.updateMatrices(S),S.castShadow&&b++),r.spotLightMatrix[p]=i.matrix,S.castShadow){let e=n.get(S);e.shadowIntensity=i.intensity,e.shadowBias=i.bias,e.shadowNormalBias=i.normalBias,e.shadowRadius=i.radius,e.shadowMapSize=i.mapSize,r.spotShadow[p]=e,r.spotShadowMap[p]=E,v++}p++}else if(S.isRectAreaLight){let e=t.get(S);e.color.copy(C).multiplyScalar(w),e.halfWidth.set(S.width*.5,0,0),e.halfHeight.set(0,S.height*.5,0),r.rectArea[m]=e,m++}else if(S.isPointLight){let e=t.get(S);if(e.color.copy(S.color).multiplyScalar(S.intensity),e.distance=S.distance,e.decay=S.decay,S.castShadow){let e=S.shadow,t=n.get(S);t.shadowIntensity=e.intensity,t.shadowBias=e.bias,t.shadowNormalBias=e.normalBias,t.shadowRadius=e.radius,t.shadowMapSize=e.mapSize,t.shadowCameraNear=e.camera.near,t.shadowCameraFar=e.camera.far,r.pointShadow[f]=t,r.pointShadowMap[f]=E,r.pointShadowMatrix[f]=S.shadow.matrix,_++}r.point[f]=e,f++}else if(S.isHemisphereLight){let e=t.get(S);e.skyColor.copy(S.color).multiplyScalar(w),e.groundColor.copy(S.groundColor).multiplyScalar(w),r.hemi[h]=e,h++}}m>0&&(e.has(`OES_texture_float_linear`)===!0?(r.rectAreaLTC1=Q.LTC_FLOAT_1,r.rectAreaLTC2=Q.LTC_FLOAT_2):(r.rectAreaLTC1=Q.LTC_HALF_1,r.rectAreaLTC2=Q.LTC_HALF_2)),r.ambient[0]=a,r.ambient[1]=o,r.ambient[2]=s;let S=r.hash;(S.sunLength!==c||S.directionalLength!==d||S.pointLength!==f||S.spotLength!==p||S.rectAreaLength!==m||S.hemiLength!==h||S.numSunShadows!==l||S.numDirectionalShadows!==g||S.numPointShadows!==_||S.numSpotShadows!==v||S.numSpotMaps!==y||S.numLightProbes!==x)&&(r.sun.length=c,r.directional.length=d,r.spot.length=p,r.rectArea.length=m,r.point.length=f,r.hemi.length=h,r.sunShadow.length=l,r.sunShadowMap.length=l,r.sunShadowMatrix.length=u,r.sunShadowCascade.length=u,r.directionalShadow.length=g,r.directionalShadowMap.length=g,r.directionalShadowMatrix.length=g,r.pointShadow.length=_,r.pointShadowMap.length=_,r.pointShadowMatrix.length=_,r.spotShadow.length=v,r.spotShadowMap.length=v,r.spotLightMatrix.length=v+y-b,r.spotLightMap.length=y,r.numSpotLightShadowsWithMaps=b,r.numLightProbes=x,S.sunLength=c,S.directionalLength=d,S.pointLength=f,S.spotLength=p,S.rectAreaLength=m,S.hemiLength=h,S.numSunShadows=l,S.numDirectionalShadows=g,S.numPointShadows=_,S.numSpotShadows=v,S.numSpotMaps=y,S.numLightProbes=x,r.version=Ou++)}function c(e,t){let n=0,s=0,c=0,l=0,u=0,d=0,f=t.matrixWorldInverse;for(let t=0,p=e.length;t<p;t++){let p=e[t];if(p.isSunLight){let e=r.sun[n];e.direction.setFromMatrixPosition(p.matrixWorld),e.direction.transformDirection(f),n++}else if(p.isDirectionalLight){let e=r.directional[s];e.direction.setFromMatrixPosition(p.matrixWorld),i.setFromMatrixPosition(p.target.matrixWorld),e.direction.sub(i),e.direction.transformDirection(f),s++}else if(p.isSpotLight){let e=r.spot[l];e.position.setFromMatrixPosition(p.matrixWorld),e.position.applyMatrix4(f),e.direction.setFromMatrixPosition(p.matrixWorld),i.setFromMatrixPosition(p.target.matrixWorld),e.direction.sub(i),e.direction.transformDirection(f),l++}else if(p.isRectAreaLight){let e=r.rectArea[u];e.position.setFromMatrixPosition(p.matrixWorld),e.position.applyMatrix4(f),o.identity(),a.copy(p.matrixWorld),a.premultiply(f),o.extractRotation(a),e.halfWidth.set(p.width*.5,0,0),e.halfHeight.set(0,p.height*.5,0),e.halfWidth.applyMatrix4(o),e.halfHeight.applyMatrix4(o),u++}else if(p.isPointLight){let e=r.point[c];e.position.setFromMatrixPosition(p.matrixWorld),e.position.applyMatrix4(f),c++}else if(p.isHemisphereLight){let e=r.hemi[d];e.direction.setFromMatrixPosition(p.matrixWorld),e.direction.transformDirection(f),d++}}}return{setup:s,setupView:c,state:r}}function ju(e){let t=new Au(e),n=[],r=[],i=[];function a(e){u.camera=e,n.length=0,r.length=0,i.length=0}function o(e){e.isLightProbeGrid?i.push(e):n.push(e)}function s(e){r.push(e)}function c(){t.setup(n),i.sort((e,t)=>e.priority-t.priority||e.id-t.id)}function l(e){t.setupView(n,e)}let u={lightsArray:n,shadowsArray:r,lightProbeGridArray:i,camera:null,lights:t,transmissionRenderTarget:{},textureUnits:0};return{init:a,state:u,setupLights:c,setupLightsView:l,pushLight:o,pushShadow:s}}function Mu(e){let t=new WeakMap;function n(n,r=0){let i=t.get(n),a;return i===void 0?(a=new ju(e),t.set(n,[a])):r>=i.length?(a=new ju(e),i.push(a)):a=i[r],a}function r(){t=new WeakMap}return{get:n,dispose:r}}var Nu=`void main() {
	gl_Position = vec4( position, 1.0 );
}`,Pu=`uniform sampler2D shadow_pass;
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
}`,Fu=[new J(1,0,0),new J(-1,0,0),new J(0,1,0),new J(0,-1,0),new J(0,0,1),new J(0,0,-1)],Iu=[new J(0,-1,0),new J(0,-1,0),new J(0,0,1),new J(0,0,-1),new J(0,-1,0),new J(0,-1,0)],Lu=new Y,Ru=new J,zu=new J;function Bu(e,t,n){let r=new Ni,a=new q,o=new q,c=new Yt,l=new po,u=new mo,d={},f=n.maxTextureSize,p={0:1,1:0,2:2},m=new co({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new q},radius:{value:4}},vertexShader:Nu,fragmentShader:Pu}),v=m.clone();v.defines.HORIZONTAL_PASS=1;let y=new kr;y.setAttribute(`position`,new hr(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));let b=new ri(y,m),x=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=1;let S=this.type;this.render=function(t,n,l){if(x.enabled===!1||x.autoUpdate===!1&&x.needsUpdate===!1||t.length===0)return;this.type===2&&(G(`WebGLShadowMap: PCFSoftShadowMap has been removed. Using PCFShadowMap instead.`),this.type=1);let u=e.getRenderTarget(),d=e.getActiveCubeFace(),p=e.getActiveMipmapLevel(),m=e.state;m.setBlending(0),m.buffers.depth.getReversed()===!0?m.buffers.color.setClear(0,0,0,0):m.buffers.color.setClear(1,1,1,1),m.buffers.depth.setTest(!0),m.setScissorTest(!1);let v=S!==this.type;v&&n.traverse(function(e){e.material&&(Array.isArray(e.material)?e.material.forEach(e=>e.needsUpdate=!0):e.material.needsUpdate=!0)});for(let u=0,d=t.length;u<d;u++){let d=t[u],p=d.shadow;if(p===void 0){G(`WebGLShadowMap:`,d,`has no shadow.`);continue}if(p.autoUpdate===!1&&p.needsUpdate===!1)continue;a.copy(p.mapSize);let y=p.getFrameExtents();a.multiply(y),o.copy(p.mapSize),(a.x>f||a.y>f)&&(a.x>f&&(o.x=Math.floor(f/y.x),a.x=o.x*y.x,p.mapSize.x=o.x),a.y>f&&(o.y=Math.floor(f/y.y),a.y=o.y*y.y,p.mapSize.y=o.y));let b=e.state.buffers.depth.getReversed();if(p.camera._reversedDepth=b,p.map===null||v===!0){if(p.map!==null&&(p.map.depthTexture!==null&&(p.map.depthTexture.dispose(),p.map.depthTexture=null),p.map.dispose()),this.type===3){if(d.isPointLight){G(`WebGLShadowMap: VSM shadow maps are not supported for PointLights. Use PCF or BasicShadowMap instead.`);continue}p.map=new Zt(a.x,a.y,{format:A,type:_,minFilter:s,magFilter:s,generateMipmaps:!1}),p.map.texture.name=d.name+`.shadowMap`,p.map.depthTexture=new aa(a.x,a.y,g),p.map.depthTexture.name=d.name+`.shadowMapDepth`,p.map.depthTexture.format=E,p.map.depthTexture.compareFunction=null,p.map.depthTexture.minFilter=i,p.map.depthTexture.magFilter=i}else d.isPointLight?(p.map=new rc(a.x),p.map.depthTexture=new oa(a.x,h)):(p.map=new Zt(a.x,a.y),p.map.depthTexture=new aa(a.x,a.y,h)),p.map.depthTexture.name=d.name+`.shadowMap`,p.map.depthTexture.format=E,this.type===1?(p.map.depthTexture.compareFunction=b?518:515,p.map.depthTexture.minFilter=s,p.map.depthTexture.magFilter=s):(p.map.depthTexture.compareFunction=null,p.map.depthTexture.minFilter=i,p.map.depthTexture.magFilter=i);p.camera.updateProjectionMatrix()}p.map.isWebGLCubeRenderTarget!==!0&&(p.map.width!==a.x||p.map.height!==a.y)&&p.map.setSize(a.x,a.y);let x=p.map.isWebGLCubeRenderTarget?6:p.getViewportCount();d.isPointLight!==!0&&p.updateMatrices(d,l);let S=p.camera.layers.mask&4294967294?p.camera.layers:l.layers;for(let t=0;t<x;t++){let i=p.getCamera(t);if(d.isPointLight){let e=p.camera,n=p.matrix,r=d.distance||e.far;r!==e.far&&(e.far=r,e.updateProjectionMatrix()),Ru.setFromMatrixPosition(d.matrixWorld),e.position.copy(Ru),zu.copy(e.position),zu.add(Fu[t]),e.up.copy(Iu[t]),e.lookAt(zu),e.updateMatrixWorld(),n.makeTranslation(-Ru.x,-Ru.y,-Ru.z),Lu.multiplyMatrices(e.projectionMatrix,e.matrixWorldInverse),p._frustum.setFromProjectionMatrix(Lu,e.coordinateSystem,e.reversedDepth)}if(p.map.isWebGLCubeRenderTarget)e.setRenderTarget(p.map,t),e.clear();else{t===0&&(e.setRenderTarget(p.map),e.clear());let n=p.getViewport(t);c.set(o.x*n.x,o.y*n.y,o.x*n.z,o.y*n.w),m.viewport(c)}r=p.getFrustum(t),T(n,l,i,d,S,this.type)}p.isPointLightShadow!==!0&&this.type===3&&C(p,l),p.needsUpdate=!1}S=this.type,x.needsUpdate=!1,e.setRenderTarget(u,d,p)};function C(n,r){let i=t.update(b);m.defines.VSM_SAMPLES!==n.blurSamples&&(m.defines.VSM_SAMPLES=n.blurSamples,v.defines.VSM_SAMPLES=n.blurSamples,m.needsUpdate=!0,v.needsUpdate=!0),n.mapPass===null?n.mapPass=new Zt(a.x,a.y,{format:A,type:_}):(n.mapPass.width!==n.map.width||n.mapPass.height!==n.map.height)&&n.mapPass.setSize(n.map.width,n.map.height),m.uniforms.shadow_pass.value=n.map.depthTexture,m.uniforms.resolution.value.set(n.map.width,n.map.height),m.uniforms.radius.value=n.radius,e.setRenderTarget(n.mapPass),e.clear(),e.renderBufferDirect(r,null,i,m,b,null),v.uniforms.shadow_pass.value=n.mapPass.texture,v.uniforms.resolution.value.set(n.map.width,n.map.height),v.uniforms.radius.value=n.radius,e.setRenderTarget(n.map),e.clear(),e.renderBufferDirect(r,null,i,v,b,null)}function w(t,n,r,i){let a=null,o=r.isPointLight===!0?t.customDistanceMaterial:t.customDepthMaterial;if(o!==void 0)a=o;else if(a=r.isPointLight===!0?u:l,e.localClippingEnabled&&n.clipShadows===!0&&Array.isArray(n.clippingPlanes)&&n.clippingPlanes.length!==0||n.displacementMap&&n.displacementScale!==0||n.alphaMap&&n.alphaTest>0||n.map&&n.alphaTest>0||n.alphaToCoverage===!0){let e=a.uuid,t=n.uuid,r=d[e];r===void 0&&(r={},d[e]=r);let i=r[t];i===void 0&&(i=a.clone(),r[t]=i,n.addEventListener(`dispose`,D)),a=i}if(a.visible=n.visible,a.wireframe=n.wireframe,i===3?a.side=n.shadowSide===null?n.side:n.shadowSide:a.side=n.shadowSide===null?p[n.side]:n.shadowSide,a.alphaMap=n.alphaMap,a.alphaTest=n.alphaToCoverage===!0?.5:n.alphaTest,a.map=n.map,a.clipShadows=n.clipShadows,a.clippingPlanes=n.clippingPlanes,a.clipIntersection=n.clipIntersection,a.displacementMap=n.displacementMap,a.displacementScale=n.displacementScale,a.displacementBias=n.displacementBias,a.wireframeLinewidth=n.wireframeLinewidth,a.linewidth=n.linewidth,r.isPointLight===!0&&a.isMeshDistanceMaterial===!0){let t=e.properties.get(a);t.light=r}return a}function T(n,i,a,o,s,c){if(n.visible===!1)return;if(n.layers.test(s)&&(n.isMesh||n.isLine||n.isPoints)&&(n.castShadow||n.receiveShadow&&c===3)&&(!n.frustumCulled||n.intersectsFrustum(r))){n.modelViewMatrix.multiplyMatrices(a.matrixWorldInverse,n.matrixWorld);let r=t.update(n),s=n.material;if(Array.isArray(s)){let t=r.groups;for(let l=0,u=t.length;l<u;l++){let u=t[l],d=s[u.materialIndex];if(d&&d.visible){let t=w(n,d,o,c);n.onBeforeShadow(e,n,i,a,r,t,u),e.renderBufferDirect(a,null,r,t,n,u),n.onAfterShadow(e,n,i,a,r,t,u)}}}else if(s.visible){let t=w(n,s,o,c);n.onBeforeShadow(e,n,i,a,r,t,null),e.renderBufferDirect(a,null,r,t,n,null),n.onAfterShadow(e,n,i,a,r,t,null)}}let l=n.children;for(let e=0,t=l.length;e<t;e++)T(l[e],i,a,o,s,c)}function D(e){e.target.removeEventListener(`dispose`,D);for(let t in d){let n=d[t],r=e.target.uuid;r in n&&(n[r].dispose(),delete n[r])}}}function Vu(e,t){function n(){let t=!1,n=new Yt,r=null,i=new Yt(0,0,0,0);return{setMask:function(n){r!==n&&!t&&(e.colorMask(n,n,n,n),r=n)},setLocked:function(e){t=e},setClear:function(t,r,a,o,s){s===!0&&(t*=o,r*=o,a*=o),n.set(t,r,a,o),i.equals(n)===!1&&(e.clearColor(t,r,a,o),i.copy(n))},reset:function(){t=!1,r=null,i.set(-1,0,0,0)}}}function r(){let n=!1,r=!1,i=null,a=null,o=null;return{setReversed:function(e){if(r!==e){let n=t.get(`EXT_clip_control`);e?n.clipControlEXT(n.LOWER_LEFT_EXT,n.ZERO_TO_ONE_EXT):n.clipControlEXT(n.LOWER_LEFT_EXT,n.NEGATIVE_ONE_TO_ONE_EXT),r=e;let i=o;o=null,this.setClear(i)}},getReversed:function(){return r},setTest:function(t){t?R(e.DEPTH_TEST):z(e.DEPTH_TEST)},setMask:function(t){i!==t&&!n&&(e.depthMask(t),i=t)},setFunc:function(t){if(r&&(t=et[t]),a!==t){switch(t){case 0:e.depthFunc(e.NEVER);break;case 1:e.depthFunc(e.ALWAYS);break;case 2:e.depthFunc(e.LESS);break;case 3:e.depthFunc(e.LEQUAL);break;case 4:e.depthFunc(e.EQUAL);break;case 5:e.depthFunc(e.GEQUAL);break;case 6:e.depthFunc(e.GREATER);break;case 7:e.depthFunc(e.NOTEQUAL);break;default:e.depthFunc(e.LEQUAL)}a=t}},setLocked:function(e){n=e},setClear:function(t){o!==t&&(o=t,r&&(t=1-t),e.clearDepth(t))},reset:function(){n=!1,i=null,a=null,o=null,r=!1}}}function i(){let t=!1,n=null,r=null,i=null,a=null,o=null,s=null,c=null,l=null;return{setTest:function(n){t||(n?R(e.STENCIL_TEST):z(e.STENCIL_TEST))},setMask:function(r){n!==r&&!t&&(e.stencilMask(r),n=r)},setFunc:function(t,n,o){(r!==t||i!==n||a!==o)&&(e.stencilFunc(t,n,o),r=t,i=n,a=o)},setOp:function(t,n,r){(o!==t||s!==n||c!==r)&&(e.stencilOp(t,n,r),o=t,s=n,c=r)},setLocked:function(e){t=e},setClear:function(t){l!==t&&(e.clearStencil(t),l=t)},reset:function(){t=!1,n=null,r=null,i=null,a=null,o=null,s=null,c=null,l=null}}}let a=new n,o=new r,s=new i,c={},l=new WeakMap,u={},d={},f={},p=new WeakMap,m=[],h=null,g=!1,_=null,v=null,y=null,b=null,x=null,S=null,C=null,w=new X(0,0,0),T=0,E=!1,D=null,O=null,k=null,A=null,j=null,M=e.getParameter(e.MAX_COMBINED_TEXTURE_IMAGE_UNITS),ee=!1,N=0,P=e.getParameter(e.VERSION);P.indexOf(`WebGL`)===-1?P.indexOf(`OpenGL ES`)!==-1&&(N=parseFloat(/^OpenGL ES (\d)/.exec(P)[1]),ee=N>=2):(N=parseFloat(/^WebGL (\d)/.exec(P)[1]),ee=N>=1);let F=null,te={},I=e.getParameter(e.SCISSOR_BOX),ne=e.getParameter(e.VIEWPORT),re=new Yt().fromArray(I),L=new Yt().fromArray(ne);function ie(t,n,r,i){let a=new Uint8Array(4),o=e.createTexture();e.bindTexture(t,o),e.texParameteri(t,e.TEXTURE_MIN_FILTER,e.NEAREST),e.texParameteri(t,e.TEXTURE_MAG_FILTER,e.NEAREST);for(let o=0;o<r;o++)t===e.TEXTURE_3D||t===e.TEXTURE_2D_ARRAY?e.texImage3D(n,0,e.RGBA,1,1,i,0,e.RGBA,e.UNSIGNED_BYTE,a):e.texImage2D(n+o,0,e.RGBA,1,1,0,e.RGBA,e.UNSIGNED_BYTE,a);return o}let ae={};ae[e.TEXTURE_2D]=ie(e.TEXTURE_2D,e.TEXTURE_2D,1),ae[e.TEXTURE_CUBE_MAP]=ie(e.TEXTURE_CUBE_MAP,e.TEXTURE_CUBE_MAP_POSITIVE_X,6),ae[e.TEXTURE_2D_ARRAY]=ie(e.TEXTURE_2D_ARRAY,e.TEXTURE_2D_ARRAY,1,1),ae[e.TEXTURE_3D]=ie(e.TEXTURE_3D,e.TEXTURE_3D,1,1),a.setClear(0,0,0,1),o.setClear(1),s.setClear(0),R(e.DEPTH_TEST),o.setFunc(3),fe(!1),pe(1),R(e.CULL_FACE),ue(0);function R(t){u[t]!==!0&&(e.enable(t),u[t]=!0)}function z(t){u[t]!==!1&&(e.disable(t),u[t]=!1)}function B(t,n){return f[t]!==n&&(e.bindFramebuffer(t,n),f[t]=n,t===e.DRAW_FRAMEBUFFER&&(f[e.FRAMEBUFFER]=n),t===e.FRAMEBUFFER&&(f[e.DRAW_FRAMEBUFFER]=n),!0)}function oe(t,n){let r=m,i=!1;if(t){r=p.get(n),r===void 0&&(r=[],p.set(n,r));let a=t.textures;if(r.length!==a.length||r[0]!==e.COLOR_ATTACHMENT0){for(let t=0,n=a.length;t<n;t++)r[t]=e.COLOR_ATTACHMENT0+t;r.length=a.length,i=!0}}else r[0]!==e.BACK&&(r[0]=e.BACK,i=!0);i&&e.drawBuffers(r)}function se(t){return h!==t&&(e.useProgram(t),h=t,!0)}let ce={100:e.FUNC_ADD,101:e.FUNC_SUBTRACT,102:e.FUNC_REVERSE_SUBTRACT};ce[103]=e.MIN,ce[104]=e.MAX;let le={200:e.ZERO,201:e.ONE,202:e.SRC_COLOR,204:e.SRC_ALPHA,210:e.SRC_ALPHA_SATURATE,208:e.DST_COLOR,206:e.DST_ALPHA,203:e.ONE_MINUS_SRC_COLOR,205:e.ONE_MINUS_SRC_ALPHA,209:e.ONE_MINUS_DST_COLOR,207:e.ONE_MINUS_DST_ALPHA,211:e.CONSTANT_COLOR,212:e.ONE_MINUS_CONSTANT_COLOR,213:e.CONSTANT_ALPHA,214:e.ONE_MINUS_CONSTANT_ALPHA};function ue(t,n,r,i,a,o,s,c,l,u){if(t===0)g===!0&&(z(e.BLEND),g=!1);else if(g===!1&&(R(e.BLEND),g=!0),t!==5){if(t!==_||u!==E){if((v!==100||x!==100)&&(e.blendEquation(e.FUNC_ADD),v=100,x=100),u)switch(t){case 1:e.blendFuncSeparate(e.ONE,e.ONE_MINUS_SRC_ALPHA,e.ONE,e.ONE_MINUS_SRC_ALPHA);break;case 2:e.blendFunc(e.ONE,e.ONE);break;case 3:e.blendFuncSeparate(e.ZERO,e.ONE_MINUS_SRC_COLOR,e.ZERO,e.ONE);break;case 4:e.blendFuncSeparate(e.DST_COLOR,e.ONE_MINUS_SRC_ALPHA,e.ZERO,e.ONE);break;default:K(`WebGLState: Invalid blending: `,t)}else switch(t){case 1:e.blendFuncSeparate(e.SRC_ALPHA,e.ONE_MINUS_SRC_ALPHA,e.ONE,e.ONE_MINUS_SRC_ALPHA);break;case 2:e.blendFuncSeparate(e.SRC_ALPHA,e.ONE,e.ONE,e.ONE);break;case 3:K(`WebGLState: SubtractiveBlending requires material.premultipliedAlpha = true`);break;case 4:K(`WebGLState: MultiplyBlending requires material.premultipliedAlpha = true`);break;default:K(`WebGLState: Invalid blending: `,t)}y=null,b=null,S=null,C=null,w.set(0,0,0),T=0,_=t,E=u}}else a||=n,o||=r,s||=i,(n!==v||a!==x)&&(e.blendEquationSeparate(ce[n],ce[a]),v=n,x=a),(r!==y||i!==b||o!==S||s!==C)&&(e.blendFuncSeparate(le[r],le[i],le[o],le[s]),y=r,b=i,S=o,C=s),(c.equals(w)===!1||l!==T)&&(e.blendColor(c.r,c.g,c.b,l),w.copy(c),T=l),_=t,E=!1}function de(t,n){t.side===2?z(e.CULL_FACE):R(e.CULL_FACE);let r=t.side===1;n&&(r=!r),fe(r),t.blending===1&&t.transparent===!1?ue(0):ue(t.blending,t.blendEquation,t.blendSrc,t.blendDst,t.blendEquationAlpha,t.blendSrcAlpha,t.blendDstAlpha,t.blendColor,t.blendAlpha,t.premultipliedAlpha),o.setFunc(t.depthFunc),o.setTest(t.depthTest),o.setMask(t.depthWrite),a.setMask(t.colorWrite);let i=t.stencilWrite;s.setTest(i),i&&(s.setMask(t.stencilWriteMask),s.setFunc(t.stencilFunc,t.stencilRef,t.stencilFuncMask),s.setOp(t.stencilFail,t.stencilZFail,t.stencilZPass)),he(t.polygonOffset,t.polygonOffsetFactor,t.polygonOffsetUnits),t.alphaToCoverage===!0?R(e.SAMPLE_ALPHA_TO_COVERAGE):z(e.SAMPLE_ALPHA_TO_COVERAGE)}function fe(t){D!==t&&(t?e.frontFace(e.CW):e.frontFace(e.CCW),D=t)}function pe(t){t===0?z(e.CULL_FACE):(R(e.CULL_FACE),t!==O&&(t===1?e.cullFace(e.BACK):t===2?e.cullFace(e.FRONT):e.cullFace(e.FRONT_AND_BACK))),O=t}function me(t){t!==k&&(ee&&e.lineWidth(t),k=t)}function he(t,n,r){t?(R(e.POLYGON_OFFSET_FILL),(A!==n||j!==r)&&(A=n,j=r,o.getReversed()&&(n=-n,r=-r),e.polygonOffset(n,r))):z(e.POLYGON_OFFSET_FILL)}function ge(t){t?R(e.SCISSOR_TEST):z(e.SCISSOR_TEST)}function _e(t){t===void 0&&(t=e.TEXTURE0+M-1),F!==t&&(e.activeTexture(t),F=t)}function ve(t,n,r){r===void 0&&(r=F===null?e.TEXTURE0+M-1:F);let i=te[r];i===void 0&&(i={type:void 0,texture:void 0},te[r]=i),(i.type!==t||i.texture!==n)&&(F!==r&&(e.activeTexture(r),F=r),e.bindTexture(t,n||ae[t]),i.type=t,i.texture=n)}function ye(){let t=te[F];t!==void 0&&t.type!==void 0&&(e.bindTexture(t.type,null),t.type=void 0,t.texture=void 0)}function be(){try{e.compressedTexImage2D(...arguments)}catch(e){K(`WebGLState:`,e)}}function xe(){try{e.compressedTexImage3D(...arguments)}catch(e){K(`WebGLState:`,e)}}function Se(){try{e.texSubImage2D(...arguments)}catch(e){K(`WebGLState:`,e)}}function Ce(){try{e.texSubImage3D(...arguments)}catch(e){K(`WebGLState:`,e)}}function we(){try{e.compressedTexSubImage2D(...arguments)}catch(e){K(`WebGLState:`,e)}}function Te(){try{e.compressedTexSubImage3D(...arguments)}catch(e){K(`WebGLState:`,e)}}function Ee(){try{e.texStorage2D(...arguments)}catch(e){K(`WebGLState:`,e)}}function De(){try{e.texStorage3D(...arguments)}catch(e){K(`WebGLState:`,e)}}function Oe(){try{e.texImage2D(...arguments)}catch(e){K(`WebGLState:`,e)}}function V(){try{e.texImage3D(...arguments)}catch(e){K(`WebGLState:`,e)}}function ke(t){return d[t]===void 0?e.getParameter(t):d[t]}function Ae(t,n){d[t]!==n&&(e.pixelStorei(t,n),d[t]=n)}function je(t){re.equals(t)===!1&&(e.scissor(t.x,t.y,t.z,t.w),re.copy(t))}function H(t){L.equals(t)===!1&&(e.viewport(t.x,t.y,t.z,t.w),L.copy(t))}function Me(t,n){let r=l.get(n);r===void 0&&(r=new WeakMap,l.set(n,r));let i=r.get(t);i===void 0&&(i=e.getUniformBlockIndex(n,t.name),e.uniformBlockBinding(n,i,i),r.set(t,i))}function U(t,n,r){let i=l.get(n).get(t);c[i]!==r&&(e.bindBufferBase(e.UNIFORM_BUFFER,i,r),c[i]=r)}function W(){e.disable(e.BLEND),e.disable(e.CULL_FACE),e.disable(e.DEPTH_TEST),e.disable(e.POLYGON_OFFSET_FILL),e.disable(e.SCISSOR_TEST),e.disable(e.STENCIL_TEST),e.disable(e.SAMPLE_ALPHA_TO_COVERAGE),e.blendEquation(e.FUNC_ADD),e.blendFunc(e.ONE,e.ZERO),e.blendFuncSeparate(e.ONE,e.ZERO,e.ONE,e.ZERO),e.blendColor(0,0,0,0),e.colorMask(!0,!0,!0,!0),e.clearColor(0,0,0,0),e.depthMask(!0),e.depthFunc(e.LESS),o.setReversed(!1),e.clearDepth(1),e.stencilMask(4294967295),e.stencilFunc(e.ALWAYS,0,4294967295),e.stencilOp(e.KEEP,e.KEEP,e.KEEP),e.clearStencil(0),e.cullFace(e.BACK),e.frontFace(e.CCW),e.polygonOffset(0,0),e.activeTexture(e.TEXTURE0),e.bindFramebuffer(e.FRAMEBUFFER,null),e.bindFramebuffer(e.DRAW_FRAMEBUFFER,null),e.bindFramebuffer(e.READ_FRAMEBUFFER,null),e.useProgram(null),e.lineWidth(1),e.scissor(0,0,e.canvas.width,e.canvas.height),e.viewport(0,0,e.canvas.width,e.canvas.height),e.pixelStorei(e.PACK_ALIGNMENT,4),e.pixelStorei(e.UNPACK_ALIGNMENT,4),e.pixelStorei(e.UNPACK_FLIP_Y_WEBGL,!1),e.pixelStorei(e.UNPACK_PREMULTIPLY_ALPHA_WEBGL,!1),e.pixelStorei(e.UNPACK_COLORSPACE_CONVERSION_WEBGL,e.BROWSER_DEFAULT_WEBGL),e.pixelStorei(e.PACK_ROW_LENGTH,0),e.pixelStorei(e.PACK_SKIP_PIXELS,0),e.pixelStorei(e.PACK_SKIP_ROWS,0),e.pixelStorei(e.UNPACK_ROW_LENGTH,0),e.pixelStorei(e.UNPACK_IMAGE_HEIGHT,0),e.pixelStorei(e.UNPACK_SKIP_PIXELS,0),e.pixelStorei(e.UNPACK_SKIP_ROWS,0),e.pixelStorei(e.UNPACK_SKIP_IMAGES,0),u={},d={},F=null,te={},f={},c={},p=new WeakMap,m=[],h=null,g=!1,_=null,v=null,y=null,b=null,x=null,S=null,C=null,w=new X(0,0,0),T=0,E=!1,D=null,O=null,k=null,A=null,j=null,re.set(0,0,e.canvas.width,e.canvas.height),L.set(0,0,e.canvas.width,e.canvas.height),a.reset(),o.reset(),s.reset()}return{buffers:{color:a,depth:o,stencil:s},enable:R,disable:z,bindFramebuffer:B,drawBuffers:oe,useProgram:se,setBlending:ue,setMaterial:de,setFlipSided:fe,setCullFace:pe,setLineWidth:me,setPolygonOffset:he,setScissorTest:ge,activeTexture:_e,bindTexture:ve,unbindTexture:ye,compressedTexImage2D:be,compressedTexImage3D:xe,texImage2D:Oe,texImage3D:V,pixelStorei:Ae,getParameter:ke,updateUBOMapping:Me,uniformBlockBinding:U,texStorage2D:Ee,texStorage3D:De,texSubImage2D:Se,texSubImage3D:Ce,compressedTexSubImage2D:we,compressedTexSubImage3D:Te,scissor:je,viewport:H,reset:W}}function Hu(e,u,d,f,p,m,h){let g=u.has(`WEBGL_multisampled_render_to_texture`)?u.get(`WEBGL_multisampled_render_to_texture`):null,_=typeof navigator>`u`?!1:/OculusBrowser/g.test(navigator.userAgent),v=new q,y=new WeakMap,b=new Set,x,S=new WeakMap,C=new Set,w=new FinalizationRegistry(e=>C.delete(e)),T=!1;try{T=typeof OffscreenCanvas<`u`&&new OffscreenCanvas(1,1).getContext(`2d`)!==null}catch{}function E(e,t){return T?new OffscreenCanvas(e,t):qe(`canvas`)}function O(e,t,n){let r=1,i=W(e);if((i.width>n||i.height>n)&&(r=n/Math.max(i.width,i.height)),r<1){if(typeof HTMLImageElement<`u`&&e instanceof HTMLImageElement||typeof HTMLCanvasElement<`u`&&e instanceof HTMLCanvasElement||typeof ImageBitmap<`u`&&e instanceof ImageBitmap||typeof VideoFrame<`u`&&e instanceof VideoFrame){let n=Math.floor(r*i.width),a=Math.floor(r*i.height);x===void 0&&(x=E(n,a));let o=t?E(n,a):x;return o.width=n,o.height=a,o.getContext(`2d`).drawImage(e,0,0,n,a),G(`WebGLRenderer: Texture has been resized from (`+i.width+`x`+i.height+`) to (`+n+`x`+a+`).`),o}return`data`in e&&G(`WebGLRenderer: Image in DataTexture is too big (`+i.width+`x`+i.height+`).`),e}return e}function k(e){return e.generateMipmaps}function A(t){e.generateMipmap(t)}function j(t){return t.isWebGLCubeRenderTarget?e.TEXTURE_CUBE_MAP:t.isWebGL3DRenderTarget?e.TEXTURE_3D:t.isWebGLArrayRenderTarget||t.isCompressedArrayTexture?e.TEXTURE_2D_ARRAY:e.TEXTURE_2D}function M(t,n,r,i,a,o=!1){if(t!==null){if(e[t]!==void 0)return e[t];G(`WebGLRenderer: Attempt to use non-existing WebGL internal format '`+t+`'`)}let s;i&&(s=u.get(`EXT_texture_norm16`),s||G(`WebGLRenderer: Unable to use normalized textures without EXT_texture_norm16 extension`));let c=n;if(n===e.RED&&(r===e.FLOAT&&(c=e.R32F),r===e.HALF_FLOAT&&(c=e.R16F),r===e.UNSIGNED_BYTE&&(c=e.R8),r===e.UNSIGNED_SHORT&&s&&(c=s.R16_EXT),r===e.SHORT&&s&&(c=s.R16_SNORM_EXT)),n===e.RED_INTEGER&&(r===e.UNSIGNED_BYTE&&(c=e.R8UI),r===e.UNSIGNED_SHORT&&(c=e.R16UI),r===e.UNSIGNED_INT&&(c=e.R32UI),r===e.BYTE&&(c=e.R8I),r===e.SHORT&&(c=e.R16I),r===e.INT&&(c=e.R32I)),n===e.RG&&(r===e.FLOAT&&(c=e.RG32F),r===e.HALF_FLOAT&&(c=e.RG16F),r===e.UNSIGNED_BYTE&&(c=e.RG8),r===e.UNSIGNED_SHORT&&s&&(c=s.RG16_EXT),r===e.SHORT&&s&&(c=s.RG16_SNORM_EXT)),n===e.RG_INTEGER&&(r===e.UNSIGNED_BYTE&&(c=e.RG8UI),r===e.UNSIGNED_SHORT&&(c=e.RG16UI),r===e.UNSIGNED_INT&&(c=e.RG32UI),r===e.BYTE&&(c=e.RG8I),r===e.SHORT&&(c=e.RG16I),r===e.INT&&(c=e.RG32I)),n===e.RGB_INTEGER&&(r===e.UNSIGNED_BYTE&&(c=e.RGB8UI),r===e.UNSIGNED_SHORT&&(c=e.RGB16UI),r===e.UNSIGNED_INT&&(c=e.RGB32UI),r===e.BYTE&&(c=e.RGB8I),r===e.SHORT&&(c=e.RGB16I),r===e.INT&&(c=e.RGB32I)),n===e.RGBA_INTEGER&&(r===e.UNSIGNED_BYTE&&(c=e.RGBA8UI),r===e.UNSIGNED_SHORT&&(c=e.RGBA16UI),r===e.UNSIGNED_INT&&(c=e.RGBA32UI),r===e.BYTE&&(c=e.RGBA8I),r===e.SHORT&&(c=e.RGBA16I),r===e.INT&&(c=e.RGBA32I)),n===e.RGB&&(r===e.UNSIGNED_SHORT&&s&&(c=s.RGB16_EXT),r===e.SHORT&&s&&(c=s.RGB16_SNORM_EXT),r===e.UNSIGNED_INT_5_9_9_9_REV&&(c=e.RGB9_E5),r===e.UNSIGNED_INT_10F_11F_11F_REV&&(c=e.R11F_G11F_B10F)),n===e.RGBA){let t=o?ze:Rt.getTransfer(a);r===e.FLOAT&&(c=e.RGBA32F),r===e.HALF_FLOAT&&(c=e.RGBA16F),r===e.UNSIGNED_BYTE&&(c=t===`srgb`?e.SRGB8_ALPHA8:e.RGBA8),r===e.UNSIGNED_SHORT&&s&&(c=s.RGBA16_EXT),r===e.SHORT&&s&&(c=s.RGBA16_SNORM_EXT),r===e.UNSIGNED_SHORT_4_4_4_4&&(c=e.RGBA4),r===e.UNSIGNED_SHORT_5_5_5_1&&(c=e.RGB5_A1)}return(c===e.R16F||c===e.R32F||c===e.RG16F||c===e.RG32F||c===e.RGBA16F||c===e.RGBA32F)&&u.get(`EXT_color_buffer_float`),c}function ee(t,n){let r;return t?n===null||n===1014||n===1020?r=e.DEPTH24_STENCIL8:n===1015?r=e.DEPTH32F_STENCIL8:n===1012&&(r=e.DEPTH24_STENCIL8,G(`DepthTexture: 16 bit depth attachment is not supported with stencil. Using 24-bit attachment.`)):n===null||n===1014||n===1020?r=e.DEPTH_COMPONENT24:n===1015?r=e.DEPTH_COMPONENT32F:n===1012&&(r=e.DEPTH_COMPONENT16),r}function N(e,t){return k(e)===!0||e.isFramebufferTexture&&e.minFilter!==1003&&e.minFilter!==1006?Math.log2(Math.max(t.width,t.height))+1:e.mipmaps.length>0?e.mipmaps.length:e.isCompressedTexture&&Array.isArray(e.image)?t.mipmaps.length:1}function P(e){let t=new WeakRef(e);f.get(e).__ref=t,C.add(t),w.register(e,t,t)}function F(e){let t=f.get(e).__ref;t!==void 0&&(C.delete(t),w.unregister(t))}function te(e){ne(e.target)}function I(e){re(e.target)}function ne(e){e.removeEventListener(`dispose`,te),F(e),ie(e),e.isVideoTexture&&y.delete(e),e.isHTMLTexture&&b.delete(e)}function re(e){e.removeEventListener(`dispose`,I),F(e),R(e)}function L(){for(let e of C){let t=e.deref();t!==void 0&&(t.isRenderTarget===!0?re(t):ne(t))}C.clear(),b.clear()}function ie(e){let t=f.get(e);if(t.__webglInit===void 0)return;let n=e.source,r=S.get(n);if(r){let i=r[t.__cacheKey];i.usedTimes--,i.usedTimes===0&&ae(e),Object.keys(r).length===0&&S.delete(n)}f.remove(e)}function ae(t){let n=f.get(t);e.deleteTexture(n.__webglTexture);let r=t.source,i=S.get(r);delete i[n.__cacheKey],h.memory.textures--}function R(t){let n=f.get(t);n.__depthDisposeCallback&&n.__depthDisposeCallback();let r=t.depthTexture;if(r&&r.renderTarget===t&&ne(r),t.isWebGLCubeRenderTarget)for(let t=0;t<6;t++){if(Array.isArray(n.__webglFramebuffer[t]))for(let r=0;r<n.__webglFramebuffer[t].length;r++)e.deleteFramebuffer(n.__webglFramebuffer[t][r]);else e.deleteFramebuffer(n.__webglFramebuffer[t]);n.__webglDepthbuffer&&e.deleteRenderbuffer(n.__webglDepthbuffer[t])}else{if(Array.isArray(n.__webglFramebuffer))for(let t=0;t<n.__webglFramebuffer.length;t++)e.deleteFramebuffer(n.__webglFramebuffer[t]);else e.deleteFramebuffer(n.__webglFramebuffer);if(n.__webglDepthbuffer&&e.deleteRenderbuffer(n.__webglDepthbuffer),n.__webglMultisampledFramebuffer&&e.deleteFramebuffer(n.__webglMultisampledFramebuffer),n.__webglColorRenderbuffer)for(let t=0;t<n.__webglColorRenderbuffer.length;t++)n.__webglColorRenderbuffer[t]&&e.deleteRenderbuffer(n.__webglColorRenderbuffer[t]);n.__webglDepthRenderbuffer&&e.deleteRenderbuffer(n.__webglDepthRenderbuffer)}let i=t.textures;for(let t=0,n=i.length;t<n;t++){let n=f.get(i[t]);n.__webglTexture&&(e.deleteTexture(n.__webglTexture),h.memory.textures--),f.remove(i[t])}f.remove(t)}let z=0;function B(){z=0}function oe(){return z}function se(e){z=e}function ce(){let e=z;return e>=p.maxTextures&&G(`WebGLTextures: Trying to use `+(e+1)+` texture units while this GPU supports only `+p.maxTextures),z+=1,e}function le(e){let t=[];return t.push(e.wrapS),t.push(e.wrapT),t.push(e.wrapR||0),t.push(e.magFilter),t.push(e.minFilter),t.push(e.anisotropy),t.push(e.internalFormat),t.push(e.format),t.push(e.type),t.push(e.generateMipmaps),t.push(e.mipmapsAutoUpdate),t.push(e.premultiplyAlpha),t.push(e.flipY),t.push(e.unpackAlignment),t.push(e.colorSpace),t.join()}function ue(t,n){let r=f.get(t);if(t.isVideoTexture&&Me(t),t.isRenderTargetTexture===!1&&t.isExternalTexture!==!0&&t.version>0&&r.__version!==t.version){let e=t.image;if(e===null)G(`WebGLRenderer: Texture marked for update but no image data found.`);else if(e.complete===!1)G(`WebGLRenderer: Texture marked for update but image is incomplete`);else{xe(r,t,n);return}}else t.isExternalTexture&&(r.__webglTexture=t.sourceTexture?t.sourceTexture:null);d.bindTexture(e.TEXTURE_2D,r.__webglTexture,e.TEXTURE0+n)}function de(t,n){let r=f.get(t);t.isRenderTargetTexture===!1&&t.version>0&&r.__version!==t.version?xe(r,t,n):(t.isExternalTexture&&(r.__webglTexture=t.sourceTexture?t.sourceTexture:null),d.bindTexture(e.TEXTURE_2D_ARRAY,r.__webglTexture,e.TEXTURE0+n))}function fe(t,n){let r=f.get(t);t.isRenderTargetTexture===!1&&t.version>0&&r.__version!==t.version?xe(r,t,n):d.bindTexture(e.TEXTURE_3D,r.__webglTexture,e.TEXTURE0+n)}function pe(t,n){let r=f.get(t);t.version>0&&r.__version!==t.version?Se(r,t,n):d.bindTexture(e.TEXTURE_CUBE_MAP,r.__webglTexture,e.TEXTURE0+n)}let me={[t]:e.REPEAT,[n]:e.CLAMP_TO_EDGE,[r]:e.MIRRORED_REPEAT},he={[i]:e.NEAREST,[a]:e.NEAREST_MIPMAP_NEAREST,[o]:e.NEAREST_MIPMAP_LINEAR,[s]:e.LINEAR,[c]:e.LINEAR_MIPMAP_NEAREST,[l]:e.LINEAR_MIPMAP_LINEAR},ge={512:e.NEVER,519:e.ALWAYS,513:e.LESS,515:e.LEQUAL,514:e.EQUAL,518:e.GEQUAL,516:e.GREATER,517:e.NOTEQUAL};function _e(t,n){if(n.type===1015&&u.has(`OES_texture_float_linear`)===!1&&(n.magFilter===1006||n.magFilter===1007||n.magFilter===1005||n.magFilter===1008||n.minFilter===1006||n.minFilter===1007||n.minFilter===1005||n.minFilter===1008)&&G(`WebGLRenderer: Unable to use linear filtering with floating point textures. OES_texture_float_linear not supported on this device.`),e.texParameteri(t,e.TEXTURE_WRAP_S,me[n.wrapS]),e.texParameteri(t,e.TEXTURE_WRAP_T,me[n.wrapT]),(t===e.TEXTURE_3D||t===e.TEXTURE_2D_ARRAY)&&e.texParameteri(t,e.TEXTURE_WRAP_R,me[n.wrapR]),e.texParameteri(t,e.TEXTURE_MAG_FILTER,he[n.magFilter]),e.texParameteri(t,e.TEXTURE_MIN_FILTER,he[n.minFilter]),n.compareFunction&&(e.texParameteri(t,e.TEXTURE_COMPARE_MODE,e.COMPARE_REF_TO_TEXTURE),e.texParameteri(t,e.TEXTURE_COMPARE_FUNC,ge[n.compareFunction])),u.has(`EXT_texture_filter_anisotropic`)===!0){if(n.magFilter===1003||n.minFilter!==1005&&n.minFilter!==1008||n.type===1015&&u.has(`OES_texture_float_linear`)===!1)return;if(n.anisotropy>1||f.get(n).__currentAnisotropy){let r=u.get(`EXT_texture_filter_anisotropic`);e.texParameterf(t,r.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(n.anisotropy,p.getMaxAnisotropy())),f.get(n).__currentAnisotropy=n.anisotropy}}}function ve(t,n){let r=!1;t.__webglInit===void 0&&(t.__webglInit=!0,n.addEventListener(`dispose`,te),P(n));let i=n.source,a=S.get(i);a===void 0&&(a={},S.set(i,a));let o=le(n);if(o!==t.__cacheKey){a[o]===void 0&&(a[o]={texture:e.createTexture(),usedTimes:0},h.memory.textures++,r=!0),a[o].usedTimes++;let i=a[t.__cacheKey];i!==void 0&&(a[t.__cacheKey].usedTimes--,i.usedTimes===0&&ae(n)),t.__cacheKey=o,t.__webglTexture=a[o].texture}return r}function ye(e,t,n){return Math.floor(Math.floor(e/n)/t)}function be(t,n,r,i){let a=t.updateRanges;if(a.length===0)d.texSubImage2D(e.TEXTURE_2D,0,0,0,n.width,n.height,r,i,n.data);else{a.sort((e,t)=>e.start-t.start);let o=0;for(let e=1;e<a.length;e++){let t=a[o],r=a[e],i=t.start+t.count,s=ye(r.start,n.width,4),c=ye(t.start,n.width,4);r.start<=i+1&&s===c&&ye(r.start+r.count-1,n.width,4)===s?t.count=Math.max(t.count,r.start+r.count-t.start):(++o,a[o]=r)}a.length=o+1;let s=d.getParameter(e.UNPACK_ROW_LENGTH),c=d.getParameter(e.UNPACK_SKIP_PIXELS),l=d.getParameter(e.UNPACK_SKIP_ROWS);d.pixelStorei(e.UNPACK_ROW_LENGTH,n.width);for(let t=0,o=a.length;t<o;t++){let o=a[t],s=Math.floor(o.start/4),c=Math.ceil(o.count/4),l=s%n.width,u=Math.floor(s/n.width),f=c;d.pixelStorei(e.UNPACK_SKIP_PIXELS,l),d.pixelStorei(e.UNPACK_SKIP_ROWS,u),d.texSubImage2D(e.TEXTURE_2D,0,l,u,f,1,r,i,n.data)}t.clearUpdateRanges(),d.pixelStorei(e.UNPACK_ROW_LENGTH,s),d.pixelStorei(e.UNPACK_SKIP_PIXELS,c),d.pixelStorei(e.UNPACK_SKIP_ROWS,l)}}function xe(t,n,r){let i=e.TEXTURE_2D;(n.isDataArrayTexture||n.isCompressedArrayTexture)&&(i=e.TEXTURE_2D_ARRAY),n.isData3DTexture&&(i=e.TEXTURE_3D);let a=ve(t,n),o=n.source;d.bindTexture(i,t.__webglTexture,e.TEXTURE0+r);let s=f.get(o);if(o.version!==s.__version||a===!0){if(d.activeTexture(e.TEXTURE0+r),!(typeof ImageBitmap<`u`&&n.image instanceof ImageBitmap)){let t=Rt.getPrimaries(Rt.workingColorSpace),r=n.colorSpace===``?null:Rt.getPrimaries(n.colorSpace),i=n.colorSpace===``||t===r?e.NONE:e.BROWSER_DEFAULT_WEBGL;d.pixelStorei(e.UNPACK_FLIP_Y_WEBGL,n.flipY),d.pixelStorei(e.UNPACK_PREMULTIPLY_ALPHA_WEBGL,n.premultiplyAlpha),d.pixelStorei(e.UNPACK_COLORSPACE_CONVERSION_WEBGL,i)}d.pixelStorei(e.UNPACK_ALIGNMENT,n.unpackAlignment);let t=O(n.image,!1,p.maxTextureSize);t=U(n,t);let c=m.convert(n.format,n.colorSpace),l=m.convert(n.type),u=M(n.internalFormat,c,l,n.normalized,n.colorSpace,n.isVideoTexture);_e(i,n);let f,h=n.mipmaps,g=n.isVideoTexture!==!0,_=s.__version===void 0||a===!0,v=o.dataReady,y=N(n,t);if(n.isDepthTexture)u=ee(n.format===D,n.type),_&&(g?d.texStorage2D(e.TEXTURE_2D,1,u,t.width,t.height):d.texImage2D(e.TEXTURE_2D,0,u,t.width,t.height,0,c,l,null));else if(n.isDataTexture){if(h.length>0){g&&_&&d.texStorage2D(e.TEXTURE_2D,y,u,h[0].width,h[0].height);for(let t=0,n=h.length;t<n;t++)f=h[t],g?v&&d.texSubImage2D(e.TEXTURE_2D,t,0,0,f.width,f.height,c,l,f.data):d.texImage2D(e.TEXTURE_2D,t,u,f.width,f.height,0,c,l,f.data);n.generateMipmaps=!1}else g?(_&&d.texStorage2D(e.TEXTURE_2D,y,u,t.width,t.height),v&&be(n,t,c,l)):d.texImage2D(e.TEXTURE_2D,0,u,t.width,t.height,0,c,l,t.data)}else if(n.isCompressedTexture){if(n.isCompressedArrayTexture){g&&_&&d.texStorage3D(e.TEXTURE_2D_ARRAY,y,u,h[0].width,h[0].height,t.depth);for(let r=0,i=h.length;r<i;r++)if(f=h[r],n.format!==1023){if(c!==null){if(g){if(v){if(n.layerUpdates.size>0){let t=Us(f.width,f.height,n.format,n.type);for(let i of n.layerUpdates){let n=f.data.subarray(i*t/f.data.BYTES_PER_ELEMENT,(i+1)*t/f.data.BYTES_PER_ELEMENT);d.compressedTexSubImage3D(e.TEXTURE_2D_ARRAY,r,0,0,i,f.width,f.height,1,c,n)}}else d.compressedTexSubImage3D(e.TEXTURE_2D_ARRAY,r,0,0,0,f.width,f.height,t.depth,c,f.data)}}else d.compressedTexImage3D(e.TEXTURE_2D_ARRAY,r,u,f.width,f.height,t.depth,0,f.data,0,0)}else G(`WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()`)}else g?v&&d.texSubImage3D(e.TEXTURE_2D_ARRAY,r,0,0,0,f.width,f.height,t.depth,c,l,f.data):d.texImage3D(e.TEXTURE_2D_ARRAY,r,u,f.width,f.height,t.depth,0,c,l,f.data);n.layerUpdates.size>0&&n.clearLayerUpdates()}else{g&&_&&d.texStorage2D(e.TEXTURE_2D,y,u,h[0].width,h[0].height);for(let t=0,r=h.length;t<r;t++)f=h[t],n.format===1023?g?v&&d.texSubImage2D(e.TEXTURE_2D,t,0,0,f.width,f.height,c,l,f.data):d.texImage2D(e.TEXTURE_2D,t,u,f.width,f.height,0,c,l,f.data):c===null?G(`WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()`):g?v&&d.compressedTexSubImage2D(e.TEXTURE_2D,t,0,0,f.width,f.height,c,f.data):d.compressedTexImage2D(e.TEXTURE_2D,t,u,f.width,f.height,0,f.data)}}else if(n.isDataArrayTexture){if(g){if(_&&d.texStorage3D(e.TEXTURE_2D_ARRAY,y,u,t.width,t.height,t.depth),v){if(n.layerUpdates.size>0){let r=Us(t.width,t.height,n.format,n.type);for(let i of n.layerUpdates){let n=t.data.subarray(i*r/t.data.BYTES_PER_ELEMENT,(i+1)*r/t.data.BYTES_PER_ELEMENT);d.texSubImage3D(e.TEXTURE_2D_ARRAY,0,0,0,i,t.width,t.height,1,c,l,n)}n.clearLayerUpdates()}else d.texSubImage3D(e.TEXTURE_2D_ARRAY,0,0,0,0,t.width,t.height,t.depth,c,l,t.data)}}else d.texImage3D(e.TEXTURE_2D_ARRAY,0,u,t.width,t.height,t.depth,0,c,l,t.data)}else if(n.isData3DTexture)g?(_&&d.texStorage3D(e.TEXTURE_3D,y,u,t.width,t.height,t.depth),v&&d.texSubImage3D(e.TEXTURE_3D,0,0,0,0,t.width,t.height,t.depth,c,l,t.data)):d.texImage3D(e.TEXTURE_3D,0,u,t.width,t.height,t.depth,0,c,l,t.data);else if(n.isFramebufferTexture){if(_){if(g)d.texStorage2D(e.TEXTURE_2D,y,u,t.width,t.height);else{let n=t.width,r=t.height;for(let t=0;t<y;t++)d.texImage2D(e.TEXTURE_2D,t,u,n,r,0,c,l,null),n>>=1,r>>=1}}}else if(n.isHTMLTexture){if(`texElementImage2D`in e){let r=e.canvas;if(r.hasAttribute(`layoutsubtree`)||r.setAttribute(`layoutsubtree`,`true`),t.parentNode!==r){r.appendChild(t),b.add(n),r.onpaint=e=>{let t=e.changedElements;for(let e of b)t.includes(e.image)&&(e.needsUpdate=!0)},r.requestPaint();return}if(e.texElementImage2D.length===3)e.texElementImage2D(e.TEXTURE_2D,e.RGBA8,t);else{let n=e.RGBA,r=e.RGBA,i=e.UNSIGNED_BYTE;e.texElementImage2D(e.TEXTURE_2D,0,n,r,i,t)}e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MIN_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_S,e.CLAMP_TO_EDGE),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_T,e.CLAMP_TO_EDGE)}}else if(h.length>0){if(g&&_){let t=W(h[0]);d.texStorage2D(e.TEXTURE_2D,y,u,t.width,t.height)}for(let t=0,n=h.length;t<n;t++)f=h[t],g?v&&d.texSubImage2D(e.TEXTURE_2D,t,0,0,c,l,f):d.texImage2D(e.TEXTURE_2D,t,u,c,l,f);n.generateMipmaps=!1}else if(g){if(_){let n=W(t);d.texStorage2D(e.TEXTURE_2D,y,u,n.width,n.height)}v&&d.texSubImage2D(e.TEXTURE_2D,0,0,0,c,l,t)}else d.texImage2D(e.TEXTURE_2D,0,u,c,l,t);k(n)&&n.mipmapsAutoUpdate===!0&&A(i),s.__version=o.version,n.onUpdate&&n.onUpdate(n)}t.__version=n.version}function Se(t,n,r){if(n.image.length!==6)return;let i=ve(t,n),a=n.source;d.bindTexture(e.TEXTURE_CUBE_MAP,t.__webglTexture,e.TEXTURE0+r);let o=f.get(a);if(a.version!==o.__version||i===!0){d.activeTexture(e.TEXTURE0+r);let t=Rt.getPrimaries(Rt.workingColorSpace),s=n.colorSpace===``?null:Rt.getPrimaries(n.colorSpace),c=n.colorSpace===``||t===s?e.NONE:e.BROWSER_DEFAULT_WEBGL;d.pixelStorei(e.UNPACK_FLIP_Y_WEBGL,n.flipY),d.pixelStorei(e.UNPACK_PREMULTIPLY_ALPHA_WEBGL,n.premultiplyAlpha),d.pixelStorei(e.UNPACK_ALIGNMENT,n.unpackAlignment),d.pixelStorei(e.UNPACK_COLORSPACE_CONVERSION_WEBGL,c);let l=n.isCompressedTexture||n.image[0].isCompressedTexture,u=n.image[0]&&n.image[0].isDataTexture,f=[];for(let e=0;e<6;e++)!l&&!u?f[e]=O(n.image[e],!0,p.maxCubemapSize):f[e]=u?n.image[e].image:n.image[e],f[e]=U(n,f[e]);let h=f[0],g=m.convert(n.format,n.colorSpace),_=m.convert(n.type),v=M(n.internalFormat,g,_,n.normalized,n.colorSpace),y=n.isVideoTexture!==!0,b=o.__version===void 0||i===!0,x=a.dataReady,S=N(n,h);_e(e.TEXTURE_CUBE_MAP,n);let C;if(n.isDepthTexture){if(v=ee(n.format===D,n.type),b){if(y)d.texStorage2D(e.TEXTURE_CUBE_MAP,1,v,h.width,h.height);else for(let t=0;t<6;t++)d.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,0,v,h.width,h.height,0,g,_,null)}}else if(l){y&&b&&d.texStorage2D(e.TEXTURE_CUBE_MAP,S,v,h.width,h.height);for(let t=0;t<6;t++){C=f[t].mipmaps;for(let r=0;r<C.length;r++){let i=C[r];n.format===1023?y?x&&d.texSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,r,0,0,i.width,i.height,g,_,i.data):d.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,r,v,i.width,i.height,0,g,_,i.data):g===null?G(`WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()`):y?x&&d.compressedTexSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,r,0,0,i.width,i.height,g,i.data):d.compressedTexImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,r,v,i.width,i.height,0,i.data)}}}else{if(C=n.mipmaps,y&&b){C.length>0&&S++;let t=W(f[0]);d.texStorage2D(e.TEXTURE_CUBE_MAP,S,v,t.width,t.height)}for(let t=0;t<6;t++)if(u){y?x&&d.texSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,0,0,0,f[t].width,f[t].height,g,_,f[t].data):d.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,0,v,f[t].width,f[t].height,0,g,_,f[t].data);for(let n=0;n<C.length;n++){let r=C[n].image[t].image;y?x&&d.texSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,n+1,0,0,r.width,r.height,g,_,r.data):d.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,n+1,v,r.width,r.height,0,g,_,r.data)}}else{y?x&&d.texSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,0,0,0,g,_,f[t]):d.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,0,v,g,_,f[t]);for(let n=0;n<C.length;n++){let r=C[n];y?x&&d.texSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,n+1,0,0,g,_,r.image[t]):d.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,n+1,v,g,_,r.image[t])}}}k(n)&&n.mipmapsAutoUpdate===!0&&A(e.TEXTURE_CUBE_MAP),o.__version=a.version,n.onUpdate&&n.onUpdate(n)}t.__version=n.version}function Ce(t,n,r,i,a,o){let s=m.convert(r.format,r.colorSpace),c=m.convert(r.type),l=M(r.internalFormat,s,c,r.normalized,r.colorSpace),u=f.get(n),p=f.get(r);if(p.__renderTarget=n,!u.__hasExternalTextures){let t=Math.max(1,n.width>>o),r=Math.max(1,n.height>>o);a===e.TEXTURE_3D||a===e.TEXTURE_2D_ARRAY?d.texImage3D(a,o,l,t,r,n.depth,0,s,c,null):d.texImage2D(a,o,l,t,r,0,s,c,null)}d.bindFramebuffer(e.FRAMEBUFFER,t),H(n)?g.framebufferTexture2DMultisampleEXT(e.FRAMEBUFFER,i,a,p.__webglTexture,0,je(n)):(a===e.TEXTURE_2D||a>=e.TEXTURE_CUBE_MAP_POSITIVE_X&&a<=e.TEXTURE_CUBE_MAP_NEGATIVE_Z)&&e.framebufferTexture2D(e.FRAMEBUFFER,i,a,p.__webglTexture,o),d.bindFramebuffer(e.FRAMEBUFFER,null)}function we(t,n,r){if(e.bindRenderbuffer(e.RENDERBUFFER,t),n.depthBuffer){let i=n.depthTexture,a=i&&i.isDepthTexture?i.type:null,o=ee(n.stencilBuffer,a),s=n.stencilBuffer?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT;H(n)?g.renderbufferStorageMultisampleEXT(e.RENDERBUFFER,je(n),o,n.width,n.height):r?e.renderbufferStorageMultisample(e.RENDERBUFFER,je(n),o,n.width,n.height):e.renderbufferStorage(e.RENDERBUFFER,o,n.width,n.height),e.framebufferRenderbuffer(e.FRAMEBUFFER,s,e.RENDERBUFFER,t)}else{let t=n.textures;for(let i=0;i<t.length;i++){let a=t[i],o=m.convert(a.format,a.colorSpace),s=m.convert(a.type),c=M(a.internalFormat,o,s,a.normalized,a.colorSpace);H(n)?g.renderbufferStorageMultisampleEXT(e.RENDERBUFFER,je(n),c,n.width,n.height):r?e.renderbufferStorageMultisample(e.RENDERBUFFER,je(n),c,n.width,n.height):e.renderbufferStorage(e.RENDERBUFFER,c,n.width,n.height)}}e.bindRenderbuffer(e.RENDERBUFFER,null)}function Te(t,n,r){let i=n.isWebGLCubeRenderTarget===!0;if(d.bindFramebuffer(e.FRAMEBUFFER,t),!(n.depthTexture&&n.depthTexture.isDepthTexture))throw Error(`THREE.WebGLTextures: renderTarget.depthTexture must be an instance of THREE.DepthTexture.`);let a=f.get(n.depthTexture);a.__renderTarget=n;let o=i?n.depthTexture.image[0]:n.depthTexture.image;a.__webglTexture&&o.width===n.width&&o.height===n.height||(o.width=n.width,o.height=n.height,n.depthTexture.needsUpdate=!0),i?pe(n.depthTexture,0):ue(n.depthTexture,0);let s=a.__webglTexture,c=je(n),l=i?e.TEXTURE_CUBE_MAP_POSITIVE_X+r:e.TEXTURE_2D,u=n.depthTexture.format===1027?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT;if(n.depthTexture.format===1026)H(n)?g.framebufferTexture2DMultisampleEXT(e.FRAMEBUFFER,u,l,s,0,c):e.framebufferTexture2D(e.FRAMEBUFFER,u,l,s,0);else if(n.depthTexture.format===1027)H(n)?g.framebufferTexture2DMultisampleEXT(e.FRAMEBUFFER,u,l,s,0,c):e.framebufferTexture2D(e.FRAMEBUFFER,u,l,s,0);else throw Error(`THREE.WebGLTextures: Unknown depthTexture format.`)}function Ee(t){let n=f.get(t),r=t.isWebGLCubeRenderTarget===!0;if(n.__boundDepthTexture!==t.depthTexture){let e=t.depthTexture;if(n.__depthDisposeCallback&&n.__depthDisposeCallback(),e){let t=()=>{delete n.__boundDepthTexture,delete n.__depthDisposeCallback,e.removeEventListener(`dispose`,t)};e.addEventListener(`dispose`,t),n.__depthDisposeCallback=t}n.__boundDepthTexture=e}if(t.depthTexture&&!n.__autoAllocateDepthBuffer){if(r)for(let e=0;e<6;e++)Te(n.__webglFramebuffer[e],t,e);else t.texture.mipmaps.length>0?Te(n.__webglFramebuffer[0],t,0):Te(n.__webglFramebuffer,t,0)}else if(r){n.__webglDepthbuffer=[];for(let r=0;r<6;r++)if(d.bindFramebuffer(e.FRAMEBUFFER,n.__webglFramebuffer[r]),n.__webglDepthbuffer[r]===void 0)n.__webglDepthbuffer[r]=e.createRenderbuffer(),we(n.__webglDepthbuffer[r],t,!1);else{let i=t.stencilBuffer?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT,a=n.__webglDepthbuffer[r];e.bindRenderbuffer(e.RENDERBUFFER,a),e.framebufferRenderbuffer(e.FRAMEBUFFER,i,e.RENDERBUFFER,a)}}else if(t.texture.mipmaps.length>0?d.bindFramebuffer(e.FRAMEBUFFER,n.__webglFramebuffer[0]):d.bindFramebuffer(e.FRAMEBUFFER,n.__webglFramebuffer),n.__webglDepthbuffer===void 0)n.__webglDepthbuffer=e.createRenderbuffer(),we(n.__webglDepthbuffer,t,!1);else{let r=t.stencilBuffer?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT,i=n.__webglDepthbuffer;e.bindRenderbuffer(e.RENDERBUFFER,i),e.framebufferRenderbuffer(e.FRAMEBUFFER,r,e.RENDERBUFFER,i)}d.bindFramebuffer(e.FRAMEBUFFER,null)}function De(t,n,r){let i=f.get(t);n!==void 0&&Ce(i.__webglFramebuffer,t,t.texture,e.COLOR_ATTACHMENT0,e.TEXTURE_2D,0),r!==void 0&&Ee(t)}function Oe(t){let n=t.texture,r=f.get(t),i=f.get(n);t.addEventListener(`dispose`,I),P(t);let a=t.textures,o=t.isWebGLCubeRenderTarget===!0,s=a.length>1;if(s||(i.__webglTexture===void 0&&(i.__webglTexture=e.createTexture()),i.__version=n.version,h.memory.textures++),o){r.__webglFramebuffer=[];for(let t=0;t<6;t++)if(n.mipmaps.length>0){r.__webglFramebuffer[t]=[];for(let i=0;i<n.mipmaps.length;i++)r.__webglFramebuffer[t][i]=e.createFramebuffer()}else r.__webglFramebuffer[t]=e.createFramebuffer()}else{if(n.mipmaps.length>0){r.__webglFramebuffer=[];for(let t=0;t<n.mipmaps.length;t++)r.__webglFramebuffer[t]=e.createFramebuffer()}else r.__webglFramebuffer=e.createFramebuffer();if(s)for(let t=0,n=a.length;t<n;t++){let n=f.get(a[t]);n.__webglTexture===void 0&&(n.__webglTexture=e.createTexture(),h.memory.textures++)}if(t.samples>0&&H(t)===!1){r.__webglMultisampledFramebuffer=e.createFramebuffer(),r.__webglColorRenderbuffer=[],d.bindFramebuffer(e.FRAMEBUFFER,r.__webglMultisampledFramebuffer);for(let n=0;n<a.length;n++){let i=a[n];r.__webglColorRenderbuffer[n]=e.createRenderbuffer(),e.bindRenderbuffer(e.RENDERBUFFER,r.__webglColorRenderbuffer[n]);let o=m.convert(i.format,i.colorSpace),s=m.convert(i.type),c=M(i.internalFormat,o,s,i.normalized,i.colorSpace,t.isXRRenderTarget===!0),l=je(t);e.renderbufferStorageMultisample(e.RENDERBUFFER,l,c,t.width,t.height),e.framebufferRenderbuffer(e.FRAMEBUFFER,e.COLOR_ATTACHMENT0+n,e.RENDERBUFFER,r.__webglColorRenderbuffer[n])}e.bindRenderbuffer(e.RENDERBUFFER,null),t.depthBuffer&&(r.__webglDepthRenderbuffer=e.createRenderbuffer(),we(r.__webglDepthRenderbuffer,t,!0)),d.bindFramebuffer(e.FRAMEBUFFER,null)}}if(o){d.bindTexture(e.TEXTURE_CUBE_MAP,i.__webglTexture),_e(e.TEXTURE_CUBE_MAP,n);for(let i=0;i<6;i++)if(n.mipmaps.length>0)for(let a=0;a<n.mipmaps.length;a++)Ce(r.__webglFramebuffer[i][a],t,n,e.COLOR_ATTACHMENT0,e.TEXTURE_CUBE_MAP_POSITIVE_X+i,a);else Ce(r.__webglFramebuffer[i],t,n,e.COLOR_ATTACHMENT0,e.TEXTURE_CUBE_MAP_POSITIVE_X+i,0);k(n)?A(e.TEXTURE_CUBE_MAP):n.mipmaps.length>0&&e.texParameteri(e.TEXTURE_CUBE_MAP,e.TEXTURE_MAX_LEVEL,n.mipmaps.length-1),d.unbindTexture()}else if(s){for(let n=0,i=a.length;n<i;n++){let i=a[n],o=f.get(i),s=e.TEXTURE_2D;(t.isWebGL3DRenderTarget||t.isWebGLArrayRenderTarget)&&(s=t.isWebGL3DRenderTarget?e.TEXTURE_3D:e.TEXTURE_2D_ARRAY),d.bindTexture(s,o.__webglTexture),_e(s,i),Ce(r.__webglFramebuffer,t,i,e.COLOR_ATTACHMENT0+n,s,0),k(i)&&A(s)}d.unbindTexture()}else{let a=e.TEXTURE_2D;if((t.isWebGL3DRenderTarget||t.isWebGLArrayRenderTarget)&&(a=t.isWebGL3DRenderTarget?e.TEXTURE_3D:e.TEXTURE_2D_ARRAY),d.bindTexture(a,i.__webglTexture),_e(a,n),n.mipmaps.length>0)for(let i=0;i<n.mipmaps.length;i++)Ce(r.__webglFramebuffer[i],t,n,e.COLOR_ATTACHMENT0,a,i);else Ce(r.__webglFramebuffer,t,n,e.COLOR_ATTACHMENT0,a,0);k(n)?A(a):n.mipmaps.length>0&&e.texParameteri(a,e.TEXTURE_MAX_LEVEL,n.mipmaps.length-1),d.unbindTexture()}t.depthBuffer&&Ee(t)}function V(e){let t=e.textures;for(let n=0,r=t.length;n<r;n++){let r=t[n];if(k(r)&&r.mipmapsAutoUpdate===!0){let t=j(e),n=f.get(r).__webglTexture;d.bindTexture(t,n),A(t),d.unbindTexture()}}}let ke=[];function Ae(t){if(t.samples>0){if(H(t)===!1){let n=t.textures,r=t.width,i=t.height,a=e.COLOR_BUFFER_BIT,o=t.stencilBuffer?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT,s=f.get(t),c=n.length>1;if(c)for(let t=0;t<n.length;t++)d.bindFramebuffer(e.FRAMEBUFFER,s.__webglMultisampledFramebuffer),e.framebufferRenderbuffer(e.FRAMEBUFFER,e.COLOR_ATTACHMENT0+t,e.RENDERBUFFER,null),d.bindFramebuffer(e.FRAMEBUFFER,s.__webglFramebuffer),e.framebufferTexture2D(e.DRAW_FRAMEBUFFER,e.COLOR_ATTACHMENT0+t,e.TEXTURE_2D,null,0);d.bindFramebuffer(e.READ_FRAMEBUFFER,s.__webglMultisampledFramebuffer),t.texture.mipmaps.length>0?d.bindFramebuffer(e.DRAW_FRAMEBUFFER,s.__webglFramebuffer[0]):d.bindFramebuffer(e.DRAW_FRAMEBUFFER,s.__webglFramebuffer);for(let l=0;l<n.length;l++){if(t.resolveDepthBuffer&&(t.depthBuffer&&(a|=e.DEPTH_BUFFER_BIT),t.stencilBuffer&&t.resolveStencilBuffer&&(a|=e.STENCIL_BUFFER_BIT)),c){e.framebufferRenderbuffer(e.READ_FRAMEBUFFER,e.COLOR_ATTACHMENT0,e.RENDERBUFFER,s.__webglColorRenderbuffer[l]);let t=f.get(n[l]).__webglTexture;e.framebufferTexture2D(e.DRAW_FRAMEBUFFER,e.COLOR_ATTACHMENT0,e.TEXTURE_2D,t,0)}e.blitFramebuffer(0,0,r,i,0,0,r,i,a,e.NEAREST),_===!0&&(ke.length=0,ke.push(e.COLOR_ATTACHMENT0+l),t.depthBuffer&&t.storeMultisampledDepthBuffer===!1&&ke.push(o),e.invalidateFramebuffer(e.READ_FRAMEBUFFER,ke))}if(d.bindFramebuffer(e.READ_FRAMEBUFFER,null),d.bindFramebuffer(e.DRAW_FRAMEBUFFER,null),c)for(let t=0;t<n.length;t++){d.bindFramebuffer(e.FRAMEBUFFER,s.__webglMultisampledFramebuffer),e.framebufferRenderbuffer(e.FRAMEBUFFER,e.COLOR_ATTACHMENT0+t,e.RENDERBUFFER,s.__webglColorRenderbuffer[t]);let r=f.get(n[t]).__webglTexture;d.bindFramebuffer(e.FRAMEBUFFER,s.__webglFramebuffer),e.framebufferTexture2D(e.DRAW_FRAMEBUFFER,e.COLOR_ATTACHMENT0+t,e.TEXTURE_2D,r,0)}d.bindFramebuffer(e.DRAW_FRAMEBUFFER,s.__webglMultisampledFramebuffer)}else if(t.depthBuffer&&t.storeMultisampledDepthBuffer===!1&&_){let n=t.stencilBuffer?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT;e.invalidateFramebuffer(e.DRAW_FRAMEBUFFER,[n])}}}function je(e){return Math.min(p.maxSamples,e.samples)}function H(e){let t=f.get(e);return e.samples>0&&u.has(`WEBGL_multisampled_render_to_texture`)===!0&&t.__useRenderToTexture!==!1}function Me(e){let t=h.render.frame;y.get(e)!==t&&(y.set(e,t),e.update())}function U(e,t){let n=e.colorSpace,r=e.format,i=e.type;return e.isCompressedTexture===!0||e.isVideoTexture===!0||n!==`srgb-linear`&&n!==``&&(Rt.getTransfer(n)===`srgb`?(r!==1023||i!==1009)&&G(`WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType.`):K(`WebGLTextures: Unsupported texture color space:`,n)),t}function W(e){return typeof HTMLImageElement<`u`&&e instanceof HTMLImageElement?(v.width=e.naturalWidth||e.width,v.height=e.naturalHeight||e.height):typeof VideoFrame<`u`&&e instanceof VideoFrame?(v.width=e.displayWidth,v.height=e.displayHeight):(v.width=e.width,v.height=e.height),v}this.allocateTextureUnit=ce,this.resetTextureUnits=B,this.getTextureUnits=oe,this.setTextureUnits=se,this.setTexture2D=ue,this.setTexture2DArray=de,this.setTexture3D=fe,this.setTextureCube=pe,this.rebindTextures=De,this.setupRenderTarget=Oe,this.updateRenderTargetMipmap=V,this.updateMultisampleRenderTarget=Ae,this.setupDepthRenderbuffer=Ee,this.setupFrameBufferTexture=Ce,this.useMultisampledRTT=H,this.dispose=L}function Uu(e,t){function n(n,r=``){let i,a=Rt.getTransfer(r);if(n===1009)return e.UNSIGNED_BYTE;if(n===1017)return e.UNSIGNED_SHORT_4_4_4_4;if(n===1018)return e.UNSIGNED_SHORT_5_5_5_1;if(n===35902)return e.UNSIGNED_INT_5_9_9_9_REV;if(n===35899)return e.UNSIGNED_INT_10F_11F_11F_REV;if(n===1010)return e.BYTE;if(n===1011)return e.SHORT;if(n===1012)return e.UNSIGNED_SHORT;if(n===1013)return e.INT;if(n===1014)return e.UNSIGNED_INT;if(n===1015)return e.FLOAT;if(n===1016)return e.HALF_FLOAT;if(n===1021)return e.ALPHA;if(n===1022)return e.RGB;if(n===1023)return e.RGBA;if(n===1026)return e.DEPTH_COMPONENT;if(n===1027)return e.DEPTH_STENCIL;if(n===1028)return e.RED;if(n===1029)return e.RED_INTEGER;if(n===1030)return e.RG;if(n===1031)return e.RG_INTEGER;if(n===1033)return e.RGBA_INTEGER;if(n===33776||n===33777||n===33778||n===33779){if(a===`srgb`){if(i=t.get(`WEBGL_compressed_texture_s3tc_srgb`),i!==null){if(n===33776)return i.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(n===33777)return i.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(n===33778)return i.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(n===33779)return i.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null}else if(i=t.get(`WEBGL_compressed_texture_s3tc`),i!==null){if(n===33776)return i.COMPRESSED_RGB_S3TC_DXT1_EXT;if(n===33777)return i.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(n===33778)return i.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(n===33779)return i.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null}if(n===35840||n===35841||n===35842||n===35843){if(i=t.get(`WEBGL_compressed_texture_pvrtc`),i!==null){if(n===35840)return i.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(n===35841)return i.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(n===35842)return i.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(n===35843)return i.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null}if(n===36196||n===37492||n===37496||n===37488||n===37489||n===37490||n===37491){if(i=t.get(`WEBGL_compressed_texture_etc`),i!==null){if(n===36196||n===37492)return a===`srgb`?i.COMPRESSED_SRGB8_ETC2:i.COMPRESSED_RGB8_ETC2;if(n===37496)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:i.COMPRESSED_RGBA8_ETC2_EAC;if(n===37488)return i.COMPRESSED_R11_EAC;if(n===37489)return i.COMPRESSED_SIGNED_R11_EAC;if(n===37490)return i.COMPRESSED_RG11_EAC;if(n===37491)return i.COMPRESSED_SIGNED_RG11_EAC}else return null}if(n===37808||n===37809||n===37810||n===37811||n===37812||n===37813||n===37814||n===37815||n===37816||n===37817||n===37818||n===37819||n===37820||n===37821){if(i=t.get(`WEBGL_compressed_texture_astc`),i!==null){if(n===37808)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:i.COMPRESSED_RGBA_ASTC_4x4_KHR;if(n===37809)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:i.COMPRESSED_RGBA_ASTC_5x4_KHR;if(n===37810)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:i.COMPRESSED_RGBA_ASTC_5x5_KHR;if(n===37811)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:i.COMPRESSED_RGBA_ASTC_6x5_KHR;if(n===37812)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:i.COMPRESSED_RGBA_ASTC_6x6_KHR;if(n===37813)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:i.COMPRESSED_RGBA_ASTC_8x5_KHR;if(n===37814)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:i.COMPRESSED_RGBA_ASTC_8x6_KHR;if(n===37815)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:i.COMPRESSED_RGBA_ASTC_8x8_KHR;if(n===37816)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:i.COMPRESSED_RGBA_ASTC_10x5_KHR;if(n===37817)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:i.COMPRESSED_RGBA_ASTC_10x6_KHR;if(n===37818)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:i.COMPRESSED_RGBA_ASTC_10x8_KHR;if(n===37819)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:i.COMPRESSED_RGBA_ASTC_10x10_KHR;if(n===37820)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:i.COMPRESSED_RGBA_ASTC_12x10_KHR;if(n===37821)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:i.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null}if(n===36492||n===36494||n===36495){if(i=t.get(`EXT_texture_compression_bptc`),i!==null){if(n===36492)return a===`srgb`?i.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:i.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(n===36494)return i.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(n===36495)return i.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}else return null}if(n===36283||n===36284||n===36285||n===36286){if(i=t.get(`EXT_texture_compression_rgtc`),i!==null){if(n===36283)return i.COMPRESSED_RED_RGTC1_EXT;if(n===36284)return i.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(n===36285)return i.COMPRESSED_RED_GREEN_RGTC2_EXT;if(n===36286)return i.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null}return n===1020?e.UNSIGNED_INT_24_8:e[n]===void 0?null:e[n]}return{convert:n}}var Wu=`
void main() {

	gl_Position = vec4( position, 1.0 );

}`,Gu=`
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

}`,Ku=class{constructor(){this.texture=null,this.mesh=null,this.depthNear=0,this.depthFar=0}init(e,t){if(this.texture===null){let n=new sa(e.texture);(e.depthNear!==t.depthNear||e.depthFar!==t.depthFar)&&(this.depthNear=e.depthNear,this.depthFar=e.depthFar),this.texture=n}}getMesh(e){if(this.texture!==null&&this.mesh===null){let t=e.cameras[0].viewport,n=new co({vertexShader:Wu,fragmentShader:Gu,uniforms:{depthColor:{value:this.texture},depthWidth:{value:t.z},depthHeight:{value:t.w}}});this.mesh=new ri(new Za(20,20),n)}return this.mesh}reset(){this.texture=null,this.mesh=null}getDepthTexture(){return this.texture}},qu=class extends tt{constructor(e,t){super();let n=this,r=null,i=1,a=null,o=`local-floor`,s=1,c=null,l=null,d=null,f=null,p=null,m=null,g=typeof XRWebGLBinding<`u`,_=new Ku,v={},y=t.getContextAttributes(),x=null,S=null,C=[],w=[],O=new q,k=null,A=null,j=new us;j.viewport=new Yt;let M=new us;M.viewport=new Yt;let ee=[j,M],N=new ws,P=null,F=null;this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function(e){let t=C[e];return t===void 0&&(t=new An,C[e]=t),t.getTargetRaySpace()},this.getControllerGrip=function(e){let t=C[e];return t===void 0&&(t=new An,C[e]=t),t.getGripSpace()},this.getHand=function(e){let t=C[e];return t===void 0&&(t=new An,C[e]=t),t.getHandSpace()};function te(e){let t=w.indexOf(e.inputSource);if(t===-1)return;let n=C[t];n!==void 0&&(n.update(e.inputSource,e.frame,c||a),n.dispatchEvent({type:e.type,data:e.inputSource}))}function I(){r.removeEventListener(`select`,te),r.removeEventListener(`selectstart`,te),r.removeEventListener(`selectend`,te),r.removeEventListener(`squeeze`,te),r.removeEventListener(`squeezestart`,te),r.removeEventListener(`squeezeend`,te),r.removeEventListener(`end`,I),r.removeEventListener(`inputsourceschange`,ne);for(let e=0;e<C.length;e++){let t=w[e];t!==null&&(w[e]=null,C[e].disconnect(t))}P=null,F=null,_.reset();for(let e in v)delete v[e];if(e.setRenderTarget(x),p=null,f=null,d=null,r=null,S=null,R.stop(),n.isPresenting=!1,e.setPixelRatio(k),e.setSize(O.width,O.height,!1),A!==null){let e=A.camera;e.fov=A.fov,e.zoom=A.zoom,e.updateProjectionMatrix(),A=null}n.dispatchEvent({type:`sessionend`})}this.setFramebufferScaleFactor=function(e){i=e,n.isPresenting===!0&&G(`WebXRManager: Cannot change framebuffer scale while presenting.`)},this.setReferenceSpaceType=function(e){o=e,n.isPresenting===!0&&G(`WebXRManager: Cannot change reference space type while presenting.`)},this.getReferenceSpace=function(){return c||a},this.setReferenceSpace=function(e){c=e},this.getBaseLayer=function(){return f===null?p:f},this.getBinding=function(){return d===null&&g&&(d=new XRWebGLBinding(r,t)),d},this.getFrame=function(){return m},this.getSession=function(){return r},this.setSession=async function(l){if(r=l,r!==null){if(x=e.getRenderTarget(),r.addEventListener(`select`,te),r.addEventListener(`selectstart`,te),r.addEventListener(`selectend`,te),r.addEventListener(`squeeze`,te),r.addEventListener(`squeezestart`,te),r.addEventListener(`squeezeend`,te),r.addEventListener(`end`,I),r.addEventListener(`inputsourceschange`,ne),y.xrCompatible!==!0&&await t.makeXRCompatible(),k=e.getPixelRatio(),e.getSize(O),g&&`createProjectionLayer`in XRWebGLBinding.prototype){let n=null,a=null,o=null;y.depth&&(o=y.stencil?t.DEPTH24_STENCIL8:t.DEPTH_COMPONENT24,n=y.stencil?D:E,a=y.stencil?b:h);let s={colorFormat:t.RGBA8,depthFormat:o,scaleFactor:i};d=this.getBinding(),f=d.createProjectionLayer(s),r.updateRenderState({layers:[f]}),e.setPixelRatio(1),e.setSize(f.textureWidth,f.textureHeight,!1),S=new Zt(f.textureWidth,f.textureHeight,{format:T,type:u,depthTexture:new aa(f.textureWidth,f.textureHeight,a,void 0,void 0,void 0,void 0,void 0,void 0,n),stencilBuffer:y.stencil,colorSpace:e.outputColorSpace,samples:y.antialias?4:0,resolveDepthBuffer:f.ignoreDepthValues===!1,resolveStencilBuffer:f.ignoreDepthValues===!1,storeMultisampledDepthBuffer:f.ignoreDepthValues===!1,storeMultisampledStencilBuffer:f.ignoreDepthValues===!1})}else{let n={antialias:y.antialias,alpha:!0,depth:y.depth,stencil:y.stencil,framebufferScaleFactor:i};p=new XRWebGLLayer(r,t,n),r.updateRenderState({baseLayer:p}),e.setPixelRatio(1),e.setSize(p.framebufferWidth,p.framebufferHeight,!1),S=new Zt(p.framebufferWidth,p.framebufferHeight,{format:T,type:u,colorSpace:e.outputColorSpace,stencilBuffer:y.stencil,resolveDepthBuffer:p.ignoreDepthValues===!1,resolveStencilBuffer:p.ignoreDepthValues===!1,storeMultisampledDepthBuffer:p.ignoreDepthValues===!1,storeMultisampledStencilBuffer:p.ignoreDepthValues===!1})}S.isXRRenderTarget=!0,this.setFoveation(s),c=null,a=await r.requestReferenceSpace(o),R.setContext(r),R.start(),n.isPresenting=!0,n.dispatchEvent({type:`sessionstart`})}},this.getEnvironmentBlendMode=function(){if(r!==null)return r.environmentBlendMode},this.getDepthTexture=function(){return _.getDepthTexture()};function ne(e){for(let t=0;t<e.removed.length;t++){let n=e.removed[t],r=w.indexOf(n);r>=0&&(w[r]=null,C[r].disconnect(n))}for(let t=0;t<e.added.length;t++){let n=e.added[t],r=w.indexOf(n);if(r===-1){for(let e=0;e<C.length;e++)if(e>=w.length){w.push(n),r=e;break}else if(w[e]===null){w[e]=n,r=e;break}if(r===-1)break}let i=C[r];i&&i.connect(n)}}function re(e,t){t===null?e.matrixWorld.copy(e.matrix):e.matrixWorld.multiplyMatrices(t.matrixWorld,e.matrix),e.matrixWorldInverse.copy(e.matrixWorld).invert()}this.updateCamera=function(e){if(r===null)return;let t=e.near,n=e.far;_.texture!==null&&(_.depthNear>0&&(t=_.depthNear),_.depthFar>0&&(n=_.depthFar)),N.near=M.near=j.near=t,N.far=M.far=j.far=n,(P!==N.near||F!==N.far)&&(r.updateRenderState({depthNear:N.near,depthFar:N.far}),P=N.near,F=N.far),N.layers.mask=e.layers.mask|6,j.layers.mask=N.layers.mask&-5,M.layers.mask=N.layers.mask&-3;let i=e.parent,a=N.cameras;re(N,i);for(let e=0;e<a.length;e++)re(a[e],i);N.projectionMatrix.copy(j.projectionMatrix),N.projectionMatrixInverse.copy(j.projectionMatrixInverse),A===null&&e.isPerspectiveCamera&&(A={camera:e,fov:e.fov,zoom:e.zoom}),L(e,N,i)};function L(e,t,n){n===null?e.matrix.copy(t.matrixWorld):(e.matrix.copy(n.matrixWorld),e.matrix.invert(),e.matrix.multiply(t.matrixWorld)),e.matrix.decompose(e.position,e.quaternion,e.scale),e.updateMatrixWorld(!0),e.projectionMatrix.copy(t.projectionMatrix),e.projectionMatrixInverse.copy(t.projectionMatrixInverse),e.isPerspectiveCamera&&(e.fov=at*2*Math.atan(1/e.projectionMatrix.elements[5]),e.zoom=1)}this.getCamera=function(){return N},this.getFoveation=function(){if(f!==null||p!==null)return s},this.setFoveation=function(e){s=e,f!==null&&(f.fixedFoveation=e),p!==null&&p.fixedFoveation!==void 0&&(p.fixedFoveation=e)},this.hasDepthSensing=function(){return _.texture!==null},this.getDepthSensingMesh=function(){return _.getMesh(N)},this.getCameraTexture=function(e){return v[e]};let ie=null;function ae(t,i){if(l=i.getViewerPose(c||a),m=i,l!==null){let t=l.views;p!==null&&(e.setRenderTargetFramebuffer(S,p.framebuffer),e.setRenderTarget(S));let i=!1;t.length!==N.cameras.length&&(N.cameras.length=0,i=!0);for(let n=0;n<t.length;n++){let r=t[n],a=null;if(p!==null)a=p.getViewport(r);else{let t=d.getViewSubImage(f,r);a=t.viewport,n===0&&(e.setRenderTargetTextures(S,t.colorTexture,t.depthStencilTexture),e.setRenderTarget(S))}let o=ee[n];o===void 0&&(o=new us,o.layers.enable(n),o.viewport=new Yt,ee[n]=o),o.matrix.fromArray(r.transform.matrix),o.matrix.decompose(o.position,o.quaternion,o.scale),o.projectionMatrix.fromArray(r.projectionMatrix),o.projectionMatrixInverse.copy(o.projectionMatrix).invert(),o.viewport.set(a.x,a.y,a.width,a.height),n===0&&(N.matrix.copy(o.matrix),N.matrix.decompose(N.position,N.quaternion,N.scale)),i===!0&&N.cameras.push(o)}let a=r.enabledFeatures;if(a&&a.includes(`depth-sensing`)&&r.depthUsage==`gpu-optimized`&&g){d=n.getBinding();let e=d.getDepthInformation(t[0]);e&&e.isValid&&e.texture&&_.init(e,r.renderState)}if(a&&a.includes(`camera-access`)&&g){e.state.unbindTexture(),d=n.getBinding();for(let e=0;e<t.length;e++){let n=t[e].camera;if(n){let e=v[n];e||(e=new sa,v[n]=e);let t=d.getCameraImage(n);e.sourceTexture=t}}}}for(let e=0;e<C.length;e++){let t=w[e],n=C[e];t!==null&&n!==void 0&&n.update(t,i,c||a)}ie&&ie(t,i),i.detectedPlanes&&n.dispatchEvent({type:`planesdetected`,data:i}),m=null}let R=new Gs;R.setAnimationLoop(ae),this.setAnimationLoop=function(e){ie=e},this.dispose=function(){}}},Ju=new Y,Yu=new Nt;Yu.set(-1,0,0,0,1,0,0,0,1);function Xu(e,t){function n(e,t){e.matrixAutoUpdate===!0&&e.updateMatrix(),t.value.copy(e.matrix)}function r(t,n){n.color.getRGB(t.fogColor.value,io(e)),n.isFog?(t.fogNear.value=n.near,t.fogFar.value=n.far):n.isFogExp2&&(t.fogDensity.value=n.density)}function i(e,t,n,r,i){t.isNodeMaterial?t.uniformsNeedUpdate=!1:t.isMeshBasicMaterial?a(e,t):t.isMeshLambertMaterial?(a(e,t),t.envMap&&(e.envMapIntensity.value=t.envMapIntensity)):t.isMeshToonMaterial?(a(e,t),d(e,t)):t.isMeshPhongMaterial?(a(e,t),u(e,t),t.envMap&&(e.envMapIntensity.value=t.envMapIntensity)):t.isMeshStandardMaterial?(a(e,t),f(e,t),t.isMeshPhysicalMaterial&&p(e,t,i)):t.isMeshMatcapMaterial?(a(e,t),m(e,t)):t.isMeshDepthMaterial?a(e,t):t.isMeshDistanceMaterial?(a(e,t),h(e,t)):t.isMeshNormalMaterial?a(e,t):t.isLineBasicMaterial?(o(e,t),t.isLineDashedMaterial&&s(e,t)):t.isPointsMaterial?c(e,t,n,r):t.isSpriteMaterial?l(e,t):t.isShadowMaterial?(e.color.value.copy(t.color),e.opacity.value=t.opacity):t.isShaderMaterial&&(t.uniformsNeedUpdate=!1)}function a(e,r){e.opacity.value=r.opacity,r.color&&e.diffuse.value.copy(r.color),r.emissive&&e.emissive.value.copy(r.emissive).multiplyScalar(r.emissiveIntensity),r.map&&(e.map.value=r.map,n(r.map,e.mapTransform)),r.alphaMap&&(e.alphaMap.value=r.alphaMap,n(r.alphaMap,e.alphaMapTransform)),r.bumpMap&&(e.bumpMap.value=r.bumpMap,n(r.bumpMap,e.bumpMapTransform),e.bumpScale.value=r.bumpScale,r.side===1&&(e.bumpScale.value*=-1)),r.normalMap&&(e.normalMap.value=r.normalMap,n(r.normalMap,e.normalMapTransform),e.normalScale.value.copy(r.normalScale),r.side===1&&e.normalScale.value.negate()),r.displacementMap&&(e.displacementMap.value=r.displacementMap,n(r.displacementMap,e.displacementMapTransform),e.displacementScale.value=r.displacementScale,e.displacementBias.value=r.displacementBias),r.emissiveMap&&(e.emissiveMap.value=r.emissiveMap,n(r.emissiveMap,e.emissiveMapTransform)),r.specularMap&&(e.specularMap.value=r.specularMap,n(r.specularMap,e.specularMapTransform)),r.alphaTest>0&&(e.alphaTest.value=r.alphaTest);let i=t.get(r),a=i.envMap,o=i.envMapRotation;a&&(e.envMap.value=a,e.envMapRotation.value.setFromMatrix4(Ju.makeRotationFromEuler(o)).transpose(),a.isCubeTexture&&a.isRenderTargetTexture===!1&&e.envMapRotation.value.premultiply(Yu),e.reflectivity.value=r.reflectivity,e.ior.value=r.ior,e.refractionRatio.value=r.refractionRatio),r.lightMap&&(e.lightMap.value=r.lightMap,e.lightMapIntensity.value=r.lightMapIntensity,n(r.lightMap,e.lightMapTransform)),r.aoMap&&(e.aoMap.value=r.aoMap,e.aoMapIntensity.value=r.aoMapIntensity,n(r.aoMap,e.aoMapTransform))}function o(e,t){e.diffuse.value.copy(t.color),e.opacity.value=t.opacity,t.map&&(e.map.value=t.map,n(t.map,e.mapTransform))}function s(e,t){e.dashSize.value=t.dashSize,e.totalSize.value=t.dashSize+t.gapSize,e.scale.value=t.scale}function c(e,t,r,i){e.diffuse.value.copy(t.color),e.opacity.value=t.opacity,e.size.value=t.size*r,e.scale.value=i*.5,t.map&&(e.map.value=t.map,n(t.map,e.uvTransform)),t.alphaMap&&(e.alphaMap.value=t.alphaMap,n(t.alphaMap,e.alphaMapTransform)),t.alphaTest>0&&(e.alphaTest.value=t.alphaTest)}function l(e,t){e.diffuse.value.copy(t.color),e.opacity.value=t.opacity,e.rotation.value=t.rotation,t.map&&(e.map.value=t.map,n(t.map,e.mapTransform)),t.alphaMap&&(e.alphaMap.value=t.alphaMap,n(t.alphaMap,e.alphaMapTransform)),t.alphaTest>0&&(e.alphaTest.value=t.alphaTest)}function u(e,t){e.specular.value.copy(t.specular),e.shininess.value=Math.max(t.shininess,1e-4)}function d(e,t){t.gradientMap&&(e.gradientMap.value=t.gradientMap)}function f(e,t){e.metalness.value=t.metalness,t.metalnessMap&&(e.metalnessMap.value=t.metalnessMap,n(t.metalnessMap,e.metalnessMapTransform)),e.roughness.value=t.roughness,t.roughnessMap&&(e.roughnessMap.value=t.roughnessMap,n(t.roughnessMap,e.roughnessMapTransform)),t.envMap&&(e.envMapIntensity.value=t.envMapIntensity)}function p(e,t,r){e.ior.value=t.ior,t.diffuseRoughness>0&&(e.diffuseRoughness.value=t.diffuseRoughness,t.diffuseRoughnessMap&&(e.diffuseRoughnessMap.value=t.diffuseRoughnessMap,n(t.diffuseRoughnessMap,e.diffuseRoughnessMapTransform))),t.sheen>0&&(e.sheenColor.value.copy(t.sheenColor).multiplyScalar(t.sheen),e.sheenRoughness.value=t.sheenRoughness,t.sheenColorMap&&(e.sheenColorMap.value=t.sheenColorMap,n(t.sheenColorMap,e.sheenColorMapTransform)),t.sheenRoughnessMap&&(e.sheenRoughnessMap.value=t.sheenRoughnessMap,n(t.sheenRoughnessMap,e.sheenRoughnessMapTransform))),t.clearcoat>0&&(e.clearcoat.value=t.clearcoat,e.clearcoatRoughness.value=t.clearcoatRoughness,t.clearcoatMap&&(e.clearcoatMap.value=t.clearcoatMap,n(t.clearcoatMap,e.clearcoatMapTransform)),t.clearcoatRoughnessMap&&(e.clearcoatRoughnessMap.value=t.clearcoatRoughnessMap,n(t.clearcoatRoughnessMap,e.clearcoatRoughnessMapTransform)),t.clearcoatNormalMap&&(e.clearcoatNormalMap.value=t.clearcoatNormalMap,n(t.clearcoatNormalMap,e.clearcoatNormalMapTransform),e.clearcoatNormalScale.value.copy(t.clearcoatNormalScale),t.side===1&&e.clearcoatNormalScale.value.negate())),t.dispersion>0&&(e.dispersion.value=t.dispersion),t.retroreflectivity>0&&(e.retroreflectivity.value=t.retroreflectivity),t.iridescence>0&&(e.iridescence.value=t.iridescence,e.iridescenceIOR.value=t.iridescenceIOR,e.iridescenceThicknessMinimum.value=t.iridescenceThicknessMinimum,e.iridescenceThicknessMaximum.value=t.iridescenceThicknessMaximum,t.iridescenceMap&&(e.iridescenceMap.value=t.iridescenceMap,n(t.iridescenceMap,e.iridescenceMapTransform)),t.iridescenceThicknessMap&&(e.iridescenceThicknessMap.value=t.iridescenceThicknessMap,n(t.iridescenceThicknessMap,e.iridescenceThicknessMapTransform))),t.transmission>0&&(e.transmission.value=t.transmission,e.transmissionSamplerMap.value=r.texture,e.transmissionSamplerSize.value.set(r.width,r.height),t.transmissionMap&&(e.transmissionMap.value=t.transmissionMap,n(t.transmissionMap,e.transmissionMapTransform)),e.thickness.value=t.thickness,t.thicknessMap&&(e.thicknessMap.value=t.thicknessMap,n(t.thicknessMap,e.thicknessMapTransform)),e.attenuationDistance.value=t.attenuationDistance,e.attenuationColor.value.copy(t.attenuationColor)),t.anisotropy>0&&(e.anisotropyVector.value.set(t.anisotropy*Math.cos(t.anisotropyRotation),t.anisotropy*Math.sin(t.anisotropyRotation)),t.anisotropyMap&&(e.anisotropyMap.value=t.anisotropyMap,n(t.anisotropyMap,e.anisotropyMapTransform))),e.specularIntensity.value=t.specularIntensity,e.specularColor.value.copy(t.specularColor),t.specularColorMap&&(e.specularColorMap.value=t.specularColorMap,n(t.specularColorMap,e.specularColorMapTransform)),t.specularIntensityMap&&(e.specularIntensityMap.value=t.specularIntensityMap,n(t.specularIntensityMap,e.specularIntensityMapTransform))}function m(e,t){t.matcap&&(e.matcap.value=t.matcap)}function h(e,n){let r=t.get(n).light;e.referencePosition.value.setFromMatrixPosition(r.matrixWorld),e.nearDistance.value=r.shadow.camera.near,e.farDistance.value=r.shadow.camera.far}return{refreshFogUniforms:r,refreshMaterialUniforms:i}}function Zu(e,t,n,r){let i={},a={};function o(e,t){let n=t.program;r.uniformBlockBinding(e,n,i[e.id])}function s(e,n){let o=i[e.id];o===void 0&&(m(e),o=c(e),i[e.id]=o,e.addEventListener(`dispose`,g));let s=n.program;r.updateUBOMapping(e,s);let u=t.render.frame;a[e.id]!==u&&(l(e),a[e.id]=u)}function c(t){let n=e.createBuffer(),r=t.__size,i=t.usage;return e.bindBuffer(e.UNIFORM_BUFFER,n),e.bufferData(e.UNIFORM_BUFFER,r,i),e.bindBuffer(e.UNIFORM_BUFFER,null),n}function l(t){let n=i[t.id],r=t.uniforms,a=t.__cache;e.bindBuffer(e.UNIFORM_BUFFER,n);for(let e=0,t=r.length;e<t;e++){let t=r[e];if(Array.isArray(t))for(let n=0,r=t.length;n<r;n++)u(t[n],e,n,a);else u(t,e,0,a)}e.bindBuffer(e.UNIFORM_BUFFER,null)}function u(t,n,r,i){if(f(t,n,r,i)===!0){let n=t.__offset,r=t.value;if(Array.isArray(r)){let e=0;for(let n=0;n<r.length;n++){let i=r[n],a=h(i,!0);d(i,t.__data,e),e+=a.storage/Float32Array.BYTES_PER_ELEMENT}}else d(r,t.__data,0);e.bufferSubData(e.UNIFORM_BUFFER,n,t.__data)}}function d(e,t,n){typeof e==`number`||typeof e==`boolean`?t[n]=e:e.isMatrix3?(t[n]=e.elements[0],t[n+1]=e.elements[1],t[n+2]=e.elements[2],t[n+3]=0,t[n+4]=e.elements[3],t[n+5]=e.elements[4],t[n+6]=e.elements[5],t[n+7]=0,t[n+8]=e.elements[6],t[n+9]=e.elements[7],t[n+10]=e.elements[8],t[n+11]=0):ArrayBuffer.isView(e)?t.set(e.subarray(0,t.length-n),n):e.toArray(t,n)}function f(e,t,n,r){let i=e.value,a=t+`_`+n;if(Array.isArray(i)){r[a]===void 0&&(r[a]=[]);let e=r[a],t=!1;for(let n=0;n<i.length;n++)p(i[n],e,n)===!0&&(t=!0);return t}return p(i,r,a)}function p(e,t,n){if(t[n]===void 0)return t[n]=typeof e==`number`||typeof e==`boolean`?e:ArrayBuffer.isView(e)?e.slice():e.clone(),!0;{let r=t[n];if(typeof e==`number`||typeof e==`boolean`){if(r!==e)return t[n]=e,!0}else if(ArrayBuffer.isView(e))return!0;else if(r.equals(e)===!1)return r.copy(e),!0}return!1}function m(e){let t=e.uniforms,n=0;for(let e=0,r=t.length;e<r;e++){let r=Array.isArray(t[e])?t[e]:[t[e]];for(let i=0,a=r.length;i<a;i++){let a=r[i],o=Array.isArray(a.value)?a.value:[a.value],s=Array.isArray(t[e])||Array.isArray(a.value),c=n;for(let e=0,t=o.length;e<t;e++){let t=o[e],r=h(t,s),i=n%16,a=i%r.boundary,l=i+a;n+=a,l!==0&&16-l<r.storage&&(n+=16-l),e===0&&(c=n),n+=r.storage}a.__data=new(a.type===`int`?Int32Array:a.type===`uint`?Uint32Array:Float32Array)((n-c)/Float32Array.BYTES_PER_ELEMENT),a.__offset=c}}let r=n%16;return r>0&&(n+=16-r),e.__size=n,e.__cache={},this}function h(e,t){let n={boundary:0,storage:0};return typeof e==`number`||typeof e==`boolean`?(n.boundary=4,n.storage=4):e.isVector2?(n.boundary=8,n.storage=8):e.isVector3||e.isColor?(n.boundary=16,n.storage=12):e.isVector4?(n.boundary=16,n.storage=16):e.isMatrix3?(n.boundary=16,n.storage=48):e.isMatrix4?(n.boundary=16,n.storage=64):e.isTexture?G(`WebGLRenderer: Texture samplers can not be part of an uniforms group.`):ArrayBuffer.isView(e)?(n.boundary=16,n.storage=e.byteLength):G(`WebGLRenderer: Unsupported uniform value type.`,e),t===!0&&(n.boundary=16,n.storage=Math.ceil(n.storage/16)*16),n}function g(t){let n=t.target;n.removeEventListener(`dispose`,g),e.deleteBuffer(i[n.id]),delete i[n.id],delete a[n.id]}function _(){for(let t in i)e.deleteBuffer(i[t]);i={},a={}}return{bind:o,update:s,dispose:_}}var Qu=new Uint16Array([12469,15057,12620,14925,13266,14620,13807,14376,14323,13990,14545,13625,14713,13328,14840,12882,14931,12528,14996,12233,15039,11829,15066,11525,15080,11295,15085,10976,15082,10705,15073,10495,13880,14564,13898,14542,13977,14430,14158,14124,14393,13732,14556,13410,14702,12996,14814,12596,14891,12291,14937,11834,14957,11489,14958,11194,14943,10803,14921,10506,14893,10278,14858,9960,14484,14039,14487,14025,14499,13941,14524,13740,14574,13468,14654,13106,14743,12678,14818,12344,14867,11893,14889,11509,14893,11180,14881,10751,14852,10428,14812,10128,14765,9754,14712,9466,14764,13480,14764,13475,14766,13440,14766,13347,14769,13070,14786,12713,14816,12387,14844,11957,14860,11549,14868,11215,14855,10751,14825,10403,14782,10044,14729,9651,14666,9352,14599,9029,14967,12835,14966,12831,14963,12804,14954,12723,14936,12564,14917,12347,14900,11958,14886,11569,14878,11247,14859,10765,14828,10401,14784,10011,14727,9600,14660,9289,14586,8893,14508,8533,15111,12234,15110,12234,15104,12216,15092,12156,15067,12010,15028,11776,14981,11500,14942,11205,14902,10752,14861,10393,14812,9991,14752,9570,14682,9252,14603,8808,14519,8445,14431,8145,15209,11449,15208,11451,15202,11451,15190,11438,15163,11384,15117,11274,15055,10979,14994,10648,14932,10343,14871,9936,14803,9532,14729,9218,14645,8742,14556,8381,14461,8020,14365,7603,15273,10603,15272,10607,15267,10619,15256,10631,15231,10614,15182,10535,15118,10389,15042,10167,14963,9787,14883,9447,14800,9115,14710,8665,14615,8318,14514,7911,14411,7507,14279,7198,15314,9675,15313,9683,15309,9712,15298,9759,15277,9797,15229,9773,15166,9668,15084,9487,14995,9274,14898,8910,14800,8539,14697,8234,14590,7790,14479,7409,14367,7067,14178,6621,15337,8619,15337,8631,15333,8677,15325,8769,15305,8871,15264,8940,15202,8909,15119,8775,15022,8565,14916,8328,14804,8009,14688,7614,14569,7287,14448,6888,14321,6483,14088,6171,15350,7402,15350,7419,15347,7480,15340,7613,15322,7804,15287,7973,15229,8057,15148,8012,15046,7846,14933,7611,14810,7357,14682,7069,14552,6656,14421,6316,14251,5948,14007,5528,15356,5942,15356,5977,15353,6119,15348,6294,15332,6551,15302,6824,15249,7044,15171,7122,15070,7050,14949,6861,14818,6611,14679,6349,14538,6067,14398,5651,14189,5311,13935,4958,15359,4123,15359,4153,15356,4296,15353,4646,15338,5160,15311,5508,15263,5829,15188,6042,15088,6094,14966,6001,14826,5796,14678,5543,14527,5287,14377,4985,14133,4586,13869,4257,15360,1563,15360,1642,15358,2076,15354,2636,15341,3350,15317,4019,15273,4429,15203,4732,15105,4911,14981,4932,14836,4818,14679,4621,14517,4386,14359,4156,14083,3795,13808,3437,15360,122,15360,137,15358,285,15355,636,15344,1274,15322,2177,15281,2765,15215,3223,15120,3451,14995,3569,14846,3567,14681,3466,14511,3305,14344,3121,14037,2800,13753,2467,15360,0,15360,1,15359,21,15355,89,15346,253,15325,479,15287,796,15225,1148,15133,1492,15008,1749,14856,1882,14685,1886,14506,1783,14324,1608,13996,1398,13702,1183]),$u=null;function ed(){return $u===null&&($u=new _i(Qu,16,16,A,_),$u.name=`DFG_LUT`,$u.minFilter=s,$u.magFilter=s,$u.wrapS=n,$u.wrapT=n,$u.generateMipmaps=!1,$u.needsUpdate=!0),$u}var td=class{constructor(e={}){let{canvas:t=Je(),context:n=null,depth:r=!0,stencil:i=!1,alpha:a=!1,antialias:o=!1,premultipliedAlpha:s=!0,preserveDrawingBuffer:c=!1,powerPreference:d=`default`,failIfMajorPerformanceCaveat:f=!1,reversedDepthBuffer:m=!1,outputBufferType:g=u}=e;this.isWebGLRenderer=!0;let x;if(n!==null){if(typeof WebGLRenderingContext<`u`&&n instanceof WebGLRenderingContext)throw Error(`THREE.WebGLRenderer: WebGL 1 is not supported since r163.`);x=n.getContextAttributes().alpha}else x=a;let S=g,C=new Set([M,j,k]),w=new Set([u,h,p,b,v,y]),T=new Uint32Array(4),E=new Int32Array(4),D={textures:[],min:[],max:[],resolution:[]},O=null,A=null,ee=[],N=[],P=null;this.domElement=t,this.debug={checkShaderErrors:!0,diagnostics:{keywords:!1},onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this.toneMapping=0,this.toneMappingExposure=1,this.transmissionResolutionScale=1;let F=this,te=!1,I=null,ne=null,re=null,L=null;this._outputColorSpace=Le;let ie=0,ae=0,R=null,z=-1,B=null,oe=new Yt,se=new Yt,ce=null,le=new X(0),ue=0,de=t.width,fe=t.height,pe=1,me=null,he=null,ge=new Yt(0,0,de,fe),_e=new Yt(0,0,de,fe),ve=!1,ye=new Ni,be=new Fi,xe=!1,Se=!1,Ce=new Y,we=new J,Te=new Yt,Ee={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0},De=!1;function Oe(){return R===null?pe:1}let V=n;function ke(e,n){return t.getContext(e,n)}let Ae,je,H,Me,U,W,Ne,Pe,Fe,Ie,Re,ze,Be,Ve,He,Ue,Ge,Ke,qe,Ye,Ze,Qe,et;try{let e={alpha:!0,depth:r,stencil:i,antialias:o,premultipliedAlpha:s,preserveDrawingBuffer:c,powerPreference:d,failIfMajorPerformanceCaveat:f};if(`setAttribute`in t&&t.setAttribute(`data-engine`,`three.js r187`),t.addEventListener(`webglcontextlost`,rt,!1),t.addEventListener(`webglcontextrestored`,it,!1),t.addEventListener(`webglcontextcreationerror`,at,!1),V===null){let t=`webgl2`;if(V=ke(t,e),V===null)throw ke(t)?Error(`THREE.WebGLRenderer: Error creating WebGL context with your selected attributes.`):Error(`THREE.WebGLRenderer: Error creating WebGL context.`)}tt()}catch(e){throw t.removeEventListener(`webglcontextlost`,rt,!1),t.removeEventListener(`webglcontextrestored`,it,!1),t.removeEventListener(`webglcontextcreationerror`,at,!1),K(`WebGLRenderer: `+e.message),e}function tt(){Ae=new xc(V),Ae.init(),Ze=new Uu(V,Ae),je=new tc(V,Ae,e,Ze),H=new Vu(V,Ae),je.reversedDepthBuffer&&m&&H.buffers.depth.setReversed(!0),ne=V.createFramebuffer(),re=V.createFramebuffer(),L=V.createFramebuffer(),Me=new wc(V),U=new xu,W=new Hu(V,Ae,H,U,je,Ze,Me),Ne=new bc(F),Pe=new Ks(V),Qe=new $s(V,Pe),Fe=new Sc(V,Pe,Me,Qe),Ie=new Ec(V,Fe,Pe,Qe,Me),Ke=new Tc(V,je,W),He=new nc(U),Re=new bu(F,Ne,Ae,je,Qe,He),ze=new Xu(F,U),Be=new Tu,Ve=new Mu(Ae),Ge=new Qs(F,Ne,H,Ie,x,s),Ue=new Bu(F,Ie,je),et=new Zu(V,Me,je,H),qe=new ec(V,Ae,Me),Ye=new Cc(V,Ae,Me),Me.programs=Re.programs,F.capabilities=je,F.extensions=Ae,F.properties=U,F.renderLists=Be,F.shadowMap=Ue,F.state=H,F.info=Me}S!==1009&&(P=new Oc(S,t.width,t.height,o,r,i));let nt=new qu(F,V);this.xr=nt,this.getContext=function(){return V},this.getContextAttributes=function(){return V.getContextAttributes()},this.forceContextLoss=function(){let e=Ae.get(`WEBGL_lose_context`);e&&e.loseContext()},this.forceContextRestore=function(){let e=Ae.get(`WEBGL_lose_context`);e&&e.restoreContext()},this.getPixelRatio=function(){return pe},this.setPixelRatio=function(e){e!==void 0&&(pe=e,this.setSize(de,fe,!1))},this.getSize=function(e){return e.set(de,fe)},this.setSize=function(e,n,r=!0){nt.isPresenting?G(`WebGLRenderer: Can't change size while VR device is presenting.`):(de=e,fe=n,t.width=Math.floor(e*pe),t.height=Math.floor(n*pe),r===!0&&(t.style.width=e+`px`,t.style.height=n+`px`),P!==null&&P.setSize(t.width,t.height),this.setViewport(0,0,e,n))},this.getDrawingBufferSize=function(e){return e.set(de*pe,fe*pe).floor()},this.setDrawingBufferSize=function(e,n,r){de=e,fe=n,pe=r,t.width=Math.floor(e*r),t.height=Math.floor(n*r),this.setViewport(0,0,e,n)},this.setEffects=function(e){if(S===1009)K(`WebGLRenderer: setEffects() requires outputBufferType set to HalfFloatType or FloatType.`);else{if(e){for(let t=0;t<e.length;t++)if(e[t].isOutputPass===!0){G(`WebGLRenderer: OutputPass is not needed in setEffects(). Tone mapping and color space conversion are applied automatically.`);break}}P.setEffects(e||[])}},this.getCurrentViewport=function(e){return e.copy(oe)},this.getViewport=function(e){return e.copy(ge)},this.setViewport=function(e,t,n,r){e.isVector4?ge.set(e.x,e.y,e.z,e.w):ge.set(e,t,n,r),H.viewport(oe.copy(ge).multiplyScalar(Oe()).round())},this.getScissor=function(e){return e.copy(_e)},this.setScissor=function(e,t,n,r){e.isVector4?_e.set(e.x,e.y,e.z,e.w):_e.set(e,t,n,r),H.scissor(se.copy(_e).multiplyScalar(Oe()).round())},this.getScissorTest=function(){return ve},this.setScissorTest=function(e){H.setScissorTest(ve=e)},this.setOpaqueSort=function(e){me=e},this.setTransparentSort=function(e){he=e},this.getClearColor=function(e){return e.copy(Ge.getClearColor())},this.setClearColor=function(){Ge.setClearColor(...arguments)},this.getClearAlpha=function(){return Ge.getClearAlpha()},this.setClearAlpha=function(){Ge.setClearAlpha(...arguments)},this.clear=function(e=!0,t=!0,n=!0){let r=0;if(e){let e=!1;if(R!==null){let t=R.texture.format;e=C.has(t)}if(e){let e=R.texture.type,t=w.has(e),n=Ge.getClearColor(),r=Ge.getClearAlpha(),i=n.r,a=n.g,o=n.b;t?(T[0]=i,T[1]=a,T[2]=o,T[3]=r,V.clearBufferuiv(V.COLOR,0,T)):(E[0]=i,E[1]=a,E[2]=o,E[3]=r,V.clearBufferiv(V.COLOR,0,E))}else r|=V.COLOR_BUFFER_BIT}t&&(r|=V.DEPTH_BUFFER_BIT,this.state.buffers.depth.setMask(!0)),n&&(r|=V.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295)),r!==0&&V.clear(r)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.setNodesHandler=function(e){e.setRenderer(this),I=e},this.dispose=function(){t.removeEventListener(`webglcontextlost`,rt,!1),t.removeEventListener(`webglcontextrestored`,it,!1),t.removeEventListener(`webglcontextcreationerror`,at,!1),Ge.dispose(),Be.dispose(),Ve.dispose(),W.dispose(),U.dispose(),Ne.dispose(),Ie.dispose(),Fe.dispose(),Qe.dispose(),et.dispose(),Re.dispose(),nt.dispose(),nt.removeEventListener(`sessionstart`,ft),nt.removeEventListener(`sessionend`,pt),mt.stop()};function rt(e){e.preventDefault(),Xe(`WebGLRenderer: Context Lost.`),te=!0}function it(){Xe(`WebGLRenderer: Context Restored.`),te=!1;let e=Me.autoReset,t=Ue.enabled,n=Ue.autoUpdate,r=Ue.needsUpdate,i=Ue.type;tt(),Me.autoReset=e,Ue.enabled=t,Ue.autoUpdate=n,Ue.needsUpdate=r,Ue.type=i}function at(e){K(`WebGLRenderer: A WebGL context could not be created. Reason: `,e.statusMessage)}function ot(e){let t=e.target;t.removeEventListener(`dispose`,ot),st(t)}function st(e){ct(e),U.remove(e)}function ct(e){let t=U.get(e).programs;t!==void 0&&(t.forEach(function(e){Re.releaseProgram(e)}),e.isShaderMaterial&&Re.releaseShaderCache(e))}this.renderBufferDirect=function(e,t,n,r,i,a){t===null&&(t=Ee);let o=i.isMesh&&i.matrixWorld.determinantAffine()<0,s=Tt(e,t,n,r,i);H.setMaterial(r,o);let c=n.index,l=1;if(r.wireframe===!0){if(c=Fe.getWireframeAttribute(n),c===void 0)return;l=2}let u=n.drawRange,d=n.attributes.position,f=u.start*l,p=(u.start+u.count)*l;a!==null&&(f=Math.max(f,a.start*l),p=Math.min(p,(a.start+a.count)*l)),c===null?d!=null&&(f=Math.max(f,0),p=Math.min(p,d.count)):(f=Math.max(f,0),p=Math.min(p,c.count));let m=p-f;if(m<0||m===1/0)return;Qe.setup(i,r,s,n,c);let h,g=qe;if(c!==null&&(h=Pe.get(c),g=Ye,g.setIndex(h)),i.isMesh)r.wireframe===!0?(H.setLineWidth(r.wireframeLinewidth*Oe()),g.setMode(V.LINES)):g.setMode(V.TRIANGLES);else if(i.isLine){let e=r.linewidth;e===void 0&&(e=1),H.setLineWidth(e*Oe()),i.isLineSegments?g.setMode(V.LINES):i.isLineLoop?g.setMode(V.LINE_LOOP):g.setMode(V.LINE_STRIP)}else i.isPoints?g.setMode(V.POINTS):i.isSprite&&g.setMode(V.TRIANGLES);if(i.isBatchedMesh){if(Ae.get(`WEBGL_multi_draw`))g.renderMultiDraw(i._multiDrawStarts,i._multiDrawCounts,i._multiDrawCount);else{let e=i._multiDrawStarts,t=i._multiDrawCounts,n=i._multiDrawCount,a=c?Pe.get(c).bytesPerElement:1,o=U.get(r).currentProgram.getUniforms();for(let r=0;r<n;r++)o.setValue(V,`_gl_DrawID`,r),g.render(e[r]/a,t[r])}}else if(i.isInstancedMesh)g.renderInstances(f,m,i.count);else if(n.isInstancedBufferGeometry){let e=n._maxInstanceCount===void 0?1/0:n._maxInstanceCount,t=Math.min(n.instanceCount,e);g.renderInstances(f,m,t)}else g.render(f,m)};function lt(e,t,n,r){I!==null&&e.isNodeMaterial&&I.setObject(r,e),xe===!0&&He.setState(e,n,!1),e.transparent===!0&&e.side===2&&e.forceSinglePass===!1?(e.side=1,e.needsUpdate=!0,xt(e,t,r),e.side=0,e.needsUpdate=!0,xt(e,t,r),e.side=2):xt(e,t,r)}this.compile=function(e,t,n=null){n===null&&(n=e),I!==null&&I.renderStart(e,t,n),A=Ve.get(n),A.init(t),N.push(A),n.traverseVisible(function(e){e.isLight&&e.layers.test(t.layers)&&(A.pushLight(e),e.castShadow&&A.pushShadow(e))}),e!==n&&e.traverseVisible(function(e){e.isLight&&e.layers.test(t.layers)&&(A.pushLight(e),e.castShadow&&A.pushShadow(e))}),A.setupLights(),I!==null&&I.updateLights(A.state.lightsArray),Se=this.localClippingEnabled,xe=He.init(this.clippingPlanes,Se),xe===!0&&He.setGlobalState(this.clippingPlanes,t),I!==null&&Ue.render(A.state.shadowsArray,n,t);let r=new Set;return e.traverse(function(e){if(!(e.isMesh||e.isPoints||e.isLine||e.isSprite))return;let i=e.material;if(i){if(Array.isArray(i))for(let a=0;a<i.length;a++){let o=i[a];lt(o,n,t,e),r.add(o)}else lt(i,n,t,e),r.add(i)}}),A=N.pop(),I!==null&&I.renderEnd(),r},this.compileAsync=function(e,t,n=null){let r=this.compile(e,t,n);return new Promise(t=>{function n(){r.forEach(function(e){let t=U.get(e).currentProgram;(t===void 0||t.isReady())&&r.delete(e)}),r.size===0?t(e):setTimeout(n,10)}Ae.get(`KHR_parallel_shader_compile`)===null?setTimeout(n,10):n()})};let ut=null;function dt(e){ut&&ut(e)}function ft(){mt.stop()}function pt(){mt.start()}let mt=new Gs;mt.setAnimationLoop(dt),typeof self<`u`&&mt.setContext(self),this.setAnimationLoop=function(e){ut=e,nt.setAnimationLoop(e),e===null?mt.stop():mt.start()},nt.addEventListener(`sessionstart`,ft),nt.addEventListener(`sessionend`,pt),this.render=function(e,t){if(t!==void 0&&t.isCamera!==!0){K(`WebGLRenderer.render: camera is not an instance of THREE.Camera.`);return}if(te===!0)return;I!==null&&I.renderStart(e,t);let n=nt.enabled===!0&&nt.isPresenting===!0,r=P!==null&&(R===null||n)&&P.begin(F,R);if(e.matrixWorldAutoUpdate===!0&&e.updateMatrixWorld(),t.parent===null&&t.matrixWorldAutoUpdate===!0&&t.updateMatrixWorld(),nt.enabled===!0&&nt.isPresenting===!0&&(P===null||P.isCompositing()===!1)&&(nt.cameraAutoUpdate===!0&&nt.updateCamera(t),t=nt.getCamera()),e.isScene===!0&&e.onBeforeRender(F,e,t,R),A=Ve.get(e,N.length),A.init(t),A.state.textureUnits=W.getTextureUnits(),N.push(A),Ce.multiplyMatrices(t.projectionMatrix,t.matrixWorldInverse),t.isArrayCamera?be.setFromArrayCamera(t):ye.setFromProjectionMatrix(Ce,We,t.reversedDepth),Se=this.localClippingEnabled,xe=He.init(this.clippingPlanes,Se),O=Be.get(e,ee.length),O.init(),ee.push(O),this.info.render.frame++,nt.enabled===!0&&nt.isPresenting===!0){let e=F.xr.getDepthSensingMesh();e!==null&&ht(e,t,-1/0,F.sortObjects)}ht(e,t,0,F.sortObjects),O.finish(),I!==null&&I.updateLights(A.state.lightsArray),F.sortObjects===!0&&O.sort(me,he),De=nt.enabled===!1||nt.isPresenting===!1||nt.hasDepthSensing()===!1,De&&Ge.addToRenderList(O,e),this.info.autoReset===!0&&this.info.reset(),xe===!0&&He.beginShadows();let i=A.state.shadowsArray;if(Ue.render(i,e,t),xe===!0&&He.endShadows(),(r&&P.hasRenderPass())===!1){let n=O.opaque,r=O.transmissive;if(A.setupLights(),t.isArrayCamera){let i=t.cameras;if(r.length>0)for(let t=0,a=i.length;t<a;t++){let a=i[t];_t(n,r,e,a)}De&&Ge.render(e);for(let t=0,n=i.length;t<n;t++){let n=i[t];gt(O,e,n,n.viewport)}}else r.length>0&&_t(n,r,e,t),De&&Ge.render(e),gt(O,e,t)}R!==null&&ae===0&&(W.updateMultisampleRenderTarget(R),W.updateRenderTargetMipmap(R)),r&&P.end(F),e.isScene===!0&&e.onAfterRender(F,e,t),Qe.resetDefaultState(),z=-1,B=null,N.pop(),N.length>0?(A=N[N.length-1],W.setTextureUnits(A.state.textureUnits),xe===!0&&He.setGlobalState(F.clippingPlanes,A.state.camera)):A=null,ee.pop(),O=ee.length>0?ee[ee.length-1]:null,I!==null&&I.renderEnd()};function ht(e,t,n,r){if(e.visible===!1)return;if(e.layers.test(t.layers)){if(e.isGroup)n=e.renderOrder;else if(e.isLOD)e.autoUpdate===!0&&e.update(t);else if(e.isLight)A.pushLight(e),e.castShadow&&A.pushShadow(e);else if(e.isSprite){let i=t.isArrayCamera?be:ye;if(!e.frustumCulled||e.intersectsFrustum(i)){r&&Te.setFromMatrixPosition(e.matrixWorld).applyMatrix4(Ce);let i=Ie.update(e),a=e.material;a.visible&&O.push(e,i,a,n,Te.z,null,t)}}else if(e.isMesh||e.isLine||e.isPoints){let i=t.isArrayCamera?be:ye;if(!e.frustumCulled||e.intersectsFrustum(i)){let i=Ie.update(e),a=e.material;if(r&&(e.boundingSphere===void 0?(i.boundingSphere===null&&i.computeBoundingSphere(),Te.copy(i.boundingSphere.center)):(e.boundingSphere===null&&e.computeBoundingSphere(),Te.copy(e.boundingSphere.center)),Te.applyMatrix4(e.matrixWorld).applyMatrix4(Ce)),Array.isArray(a)){let r=i.groups;for(let o=0,s=r.length;o<s;o++){let s=r[o],c=a[s.materialIndex];c&&c.visible&&O.push(e,i,c,n,Te.z,s,t)}}else a.visible&&O.push(e,i,a,n,Te.z,null,t)}}}let i=e.children;for(let e=0,a=i.length;e<a;e++)ht(i[e],t,n,r)}function gt(e,t,n,r){let{opaque:i,transmissive:a,transparent:o}=e;A.setupLightsView(n),xe===!0&&He.setGlobalState(F.clippingPlanes,n),r&&H.viewport(oe.copy(r)),i.length>0&&vt(i,t,n),a.length>0&&vt(a,t,n),o.length>0&&vt(o,t,n),H.buffers.depth.setTest(!0),H.buffers.depth.setMask(!0),H.buffers.color.setMask(!0),H.setPolygonOffset(!1)}function _t(e,t,n,r){if((n.isScene===!0?n.overrideMaterial:null)!==null)return;if(A.state.transmissionRenderTarget[r.id]===void 0){let e=Ae.has(`EXT_color_buffer_half_float`)||Ae.has(`EXT_color_buffer_float`);A.state.transmissionRenderTarget[r.id]=new Zt(1,1,{generateMipmaps:!0,type:e?_:u,minFilter:l,samples:Math.max(4,je.samples),stencilBuffer:i,resolveDepthBuffer:!1,resolveStencilBuffer:!1,storeMultisampledDepthBuffer:!1,storeMultisampledStencilBuffer:!1,colorSpace:Rt.workingColorSpace})}let a=A.state.transmissionRenderTarget[r.id],o=r.viewport||oe;a.setSize(o.z*F.transmissionResolutionScale,o.w*F.transmissionResolutionScale);let s=F.getRenderTarget(),c=F.getActiveCubeFace(),d=F.getActiveMipmapLevel();F.setRenderTarget(a),F.getClearColor(le),ue=F.getClearAlpha(),ue<1&&F.setClearColor(16777215,.5),F.clear(),De&&Ge.render(n);let f=F.toneMapping;F.toneMapping=0;let p=r.viewport;if(r.viewport!==void 0&&(r.viewport=void 0),A.setupLightsView(r),xe===!0&&He.setGlobalState(F.clippingPlanes,r),vt(e,n,r),W.updateMultisampleRenderTarget(a),W.updateRenderTargetMipmap(a),Ae.has(`WEBGL_multisampled_render_to_texture`)===!1){let e=!1;for(let i=0,a=t.length;i<a;i++){let{object:a,geometry:o,material:s,group:c}=t[i];if(s.side===2&&a.layers.test(r.layers)){let t=s.side;s.side=1,s.needsUpdate=!0,yt(a,n,r,o,s,c),s.side=t,s.needsUpdate=!0,e=!0}}e===!0&&(W.updateMultisampleRenderTarget(a),W.updateRenderTargetMipmap(a))}F.setRenderTarget(s,c,d),F.setClearColor(le,ue),p!==void 0&&(r.viewport=p),F.toneMapping=f}function vt(e,t,n){let r=t.isScene===!0?t.overrideMaterial:null;for(let i=0,a=e.length;i<a;i++){let a=e[i],{object:o,geometry:s,group:c}=a,l=a.material;l.allowOverride===!0&&r!==null&&(l=r),o.layers.test(n.layers)&&yt(o,t,n,s,l,c)}}function yt(e,t,n,r,i,a){I!==null&&i.isNodeMaterial&&I.setObject(e,i),e.onBeforeRender(F,t,n,r,i,a),e.modelViewMatrix.multiplyMatrices(n.matrixWorldInverse,e.matrixWorld),e.normalMatrix.getNormalMatrix(e.modelViewMatrix),i.onBeforeRender(F,t,n,r,e,a),i.transparent===!0&&i.side===2&&i.forceSinglePass===!1?(i.side=1,i.needsUpdate=!0,F.renderBufferDirect(n,t,r,i,e,a),i.side=0,i.needsUpdate=!0,F.renderBufferDirect(n,t,r,i,e,a),i.side=2):F.renderBufferDirect(n,t,r,i,e,a),e.onAfterRender(F,t,n,r,i,a)}function bt(e){let t=0;for(let n of e)n.texture!==null&&t++;return t}function xt(e,t,n){t.isScene!==!0&&(t=Ee);let r=U.get(e),i=A.state.lights,a=A.state.shadowsArray,o=i.state.version,s=Re.getParameters(e,i.state,a,t,n,A.state.lightProbeGridArray),c=Re.getProgramCacheKey(s),l=r.programs;r.environment=e.isMeshStandardMaterial||e.isMeshLambertMaterial||e.isMeshPhongMaterial?t.environment:null,r.fog=t.fog;let u=e.isMeshStandardMaterial||e.isMeshLambertMaterial&&!e.envMap||e.isMeshPhongMaterial&&!e.envMap;r.envMap=Ne.get(e.envMap||r.environment,u),r.envMapRotation=r.environment!==null&&e.envMap===null?t.environmentRotation:e.envMapRotation,l===void 0&&(e.addEventListener(`dispose`,ot),l=new Map,r.programs=l,r.programVariants=new Map);let d=l.get(c);if(d!==void 0){if(r.currentProgram===d&&r.lightsStateVersion===o)return wt(e,s),d}else s.uniforms=Re.getUniforms(e),I!==null&&e.isNodeMaterial&&I.build(e,n,s),e.onBeforeCompile(s,F),d=Re.acquireProgram(s,c),l.set(c,d),r.uniforms=s.uniforms;let f=r.uniforms;return(!e.isShaderMaterial&&!e.isRawShaderMaterial||e.clipping===!0)&&(f.clippingPlanes=He.uniform),wt(e,s),r.needsLights=Dt(e),r.lightsStateVersion=o,r.needsLights&&(f.ambientLightColor.value=i.state.ambient,f.lightProbe.value=i.state.probe,f.sunLights.value=i.state.sun,f.sunLightShadows.value=i.state.sunShadow,f.directionalLights.value=i.state.directional,f.directionalLightShadows.value=i.state.directionalShadow,f.spotLights.value=i.state.spot,f.spotLightShadows.value=i.state.spotShadow,f.rectAreaLights.value=i.state.rectArea,f.ltc_1.value=i.state.rectAreaLTC1,f.ltc_2.value=i.state.rectAreaLTC2,f.pointLights.value=i.state.point,f.pointLightShadows.value=i.state.pointShadow,f.hemisphereLights.value=i.state.hemi,f.sunShadowMatrix.value=i.state.sunShadowMatrix,f.sunShadowCascade.value=i.state.sunShadowCascade,f.directionalShadowMatrix.value=i.state.directionalShadowMatrix,f.spotLightMatrix.value=i.state.spotLightMatrix,f.spotLightMap.value=i.state.spotLightMap,f.pointShadowMatrix.value=i.state.pointShadowMatrix),r.numLightProbeGrids=bt(A.state.lightProbeGridArray),r.currentProgram=d,r.uniformsList=null,d}function St(e,t,n,r,i){let a=U.get(e),o=a.currentProgram.id+`,`+r+`,`+i,s=a.programVariants.get(o);return s===void 0?(s=xt(e,t,n),a.programVariants.set(o,s)):(a.currentProgram=s,a.uniformsList=null,a.outputColorSpace=r,a.toneMapping=i),s}function Ct(e){if(e.uniformsList===null){let t=e.currentProgram.getUniforms();e.uniformsList=Ll.seqWithValue(t.seq,e.uniforms)}return e.uniformsList}function wt(e,t){let n=U.get(e);n.outputColorSpace=t.outputColorSpace,n.batching=t.batching,n.batchingColor=t.batchingColor,n.instancing=t.instancing,n.instancingColor=t.instancingColor,n.instancingMorph=t.instancingMorph,n.skinning=t.skinning,n.morphTargets=t.morphTargets,n.morphNormals=t.morphNormals,n.morphColors=t.morphColors,n.morphTargetsCount=t.morphTargetsCount,n.numClippingPlanes=t.numClippingPlanes,n.numIntersection=t.numClipIntersection,n.vertexAlphas=t.vertexAlphas,n.vertexTangents=t.vertexTangents,n.toneMapping=t.toneMapping}function Tt(e,t,n,r,i){t.isScene!==!0&&(t=Ee),W.resetTextureUnits();let a=t.fog,o=r.isMeshStandardMaterial||r.isMeshLambertMaterial||r.isMeshPhongMaterial?t.environment:null,s=R===null?F.outputColorSpace:R.isXRRenderTarget===!0?R.texture.colorSpace:Rt.workingColorSpace,c=r.isMeshStandardMaterial||r.isMeshLambertMaterial&&!r.envMap||r.isMeshPhongMaterial&&!r.envMap,l=Ne.get(r.envMap||o,c),u=r.vertexColors===!0&&!!n.attributes.color&&n.attributes.color.itemSize===4,d=!!n.attributes.tangent&&(!!r.normalMap||r.anisotropy>0),f=!!n.morphAttributes.position,p=!!n.morphAttributes.normal,m=!!n.morphAttributes.color,h=0;r.toneMapped&&(R===null||R.isXRRenderTarget===!0)&&(h=F.toneMapping);let g=n.morphAttributes.position||n.morphAttributes.normal||n.morphAttributes.color,_=g===void 0?0:g.length,v=U.get(r),y=A.state.lights;if(xe===!0&&(Se===!0||e!==B)){let t=e===B&&r.id===z;He.setState(r,e,t)}let b=!1,x=!1;r.version===v.__version?v.needsLights&&v.lightsStateVersion!==y.state.version||i.isBatchedMesh&&v.batching===!1||!i.isBatchedMesh&&v.batching===!0||i.isBatchedMesh&&v.batchingColor===!0&&i._colorsTexture===null||i.isBatchedMesh&&v.batchingColor===!1&&i._colorsTexture!==null||i.isInstancedMesh&&v.instancing===!1||!i.isInstancedMesh&&v.instancing===!0||i.isSkinnedMesh&&v.skinning===!1||!i.isSkinnedMesh&&v.skinning===!0||i.isInstancedMesh&&v.instancingColor===!0&&i.instanceColor===null||i.isInstancedMesh&&v.instancingColor===!1&&i.instanceColor!==null||i.isInstancedMesh&&v.instancingMorph===!0&&i.morphTexture===null||i.isInstancedMesh&&v.instancingMorph===!1&&i.morphTexture!==null?b=!0:v.envMap===l?r.fog===!0&&v.fog!==a||v.numClippingPlanes!==void 0&&(v.numClippingPlanes!==He.numPlanes||v.numIntersection!==He.numIntersection)?b=!0:v.vertexAlphas===u&&v.vertexTangents===d&&v.morphTargets===f&&v.morphNormals===p&&v.morphColors===m&&v.morphTargetsCount===_&&v.numLightProbeGrids===bt(A.state.lightProbeGridArray)?(v.outputColorSpace!==s||v.toneMapping!==h)&&(x=!0):b=!0:b=!0:(b=!0,v.__version=r.version);let S=v.currentProgram;(b===!0||x===!0)&&(S=x===!0?St(r,t,i,s,h):xt(r,t,i),I&&r.isNodeMaterial&&I.onUpdateProgram(r,S,v));let C=!1,w=!1,T=!1,E=S.getUniforms(),O=v.uniforms;if(H.useProgram(S.program)&&(C=!0,w=!0,T=!0),r.id!==z&&(z=r.id,w=!0),C||B!==e){H.buffers.depth.getReversed()&&e.reversedDepth!==!0&&(e._reversedDepth=!0,e.updateProjectionMatrix()),E.setValue(V,`projectionMatrix`,e.projectionMatrix),E.setValue(V,`viewMatrix`,e.matrixWorldInverse);let t=E.map.cameraPosition;t!==void 0&&t.setValue(V,we.setFromMatrixPosition(e.matrixWorld)),je.logarithmicDepthBuffer&&E.setValue(V,`logDepthBufFC`,2/(Math.log(e.far+1)/Math.LN2)),(r.isMeshPhongMaterial||r.isMeshToonMaterial||r.isMeshLambertMaterial||r.isMeshBasicMaterial||r.isMeshStandardMaterial||r.isShaderMaterial)&&E.setValue(V,`isOrthographic`,e.isOrthographicCamera===!0),B!==e&&(B=e,w=!0,T=!0)}if(v.needsLights&&(y.state.sunShadowMap.length>0&&E.setValue(V,`sunShadowMap`,y.state.sunShadowMap,W),y.state.directionalShadowMap.length>0&&E.setValue(V,`directionalShadowMap`,y.state.directionalShadowMap,W),y.state.spotShadowMap.length>0&&E.setValue(V,`spotShadowMap`,y.state.spotShadowMap,W),y.state.pointShadowMap.length>0&&E.setValue(V,`pointShadowMap`,y.state.pointShadowMap,W)),i.isSkinnedMesh){E.setOptional(V,i,`bindMatrix`),E.setOptional(V,i,`bindMatrixInverse`);let e=i.skeleton;e&&(e.boneTexture===null&&e.computeBoneTexture(),E.setValue(V,`boneTexture`,e.boneTexture,W))}i.isBatchedMesh&&(E.setOptional(V,i,`batchingTexture`),E.setValue(V,`batchingTexture`,i._matricesTexture,W),E.setOptional(V,i,`batchingIdTexture`),E.setValue(V,`batchingIdTexture`,i._indirectTexture,W),E.setOptional(V,i,`batchingColorTexture`),i._colorsTexture!==null&&E.setValue(V,`batchingColorTexture`,i._colorsTexture,W));let k=n.morphAttributes;if((k.position!==void 0||k.normal!==void 0||k.color!==void 0)&&Ke.update(i,n,S),(w||v.receiveShadow!==i.receiveShadow)&&(v.receiveShadow=i.receiveShadow,E.setValue(V,`receiveShadow`,i.receiveShadow)),(r.isMeshStandardMaterial||r.isMeshLambertMaterial||r.isMeshPhongMaterial)&&r.envMap===null&&t.environment!==null&&(O.envMapIntensity.value=t.environmentIntensity),O.dfgLUT!==void 0&&(O.dfgLUT.value=ed()),w){if(E.setValue(V,`toneMappingExposure`,F.toneMappingExposure),v.needsLights&&Et(O,T),a&&r.fog===!0&&ze.refreshFogUniforms(O,a),ze.refreshMaterialUniforms(O,r,pe,fe,A.state.transmissionRenderTarget[e.id]),v.needsLights&&v.numLightProbeGrids>0){let e=D,t=0;for(let n of A.state.lightProbeGridArray)n.texture!==null&&(e.textures[t]=n.texture,e.min[t]=n.boundingBox.min,e.max[t]=n.boundingBox.max,e.resolution[t]=n.resolution,t++);for(let n in e)e[n].length=t;O.probesSH.value=e.textures,O.probesMin.value=e.min,O.probesMax.value=e.max,O.probesResolution.value=e.resolution}Ll.upload(V,Ct(v),O,W)}if(r.isShaderMaterial&&r.uniformsNeedUpdate===!0&&(Ll.upload(V,Ct(v),O,W),r.uniformsNeedUpdate=!1),r.isSpriteMaterial&&E.setValue(V,`center`,i.center),E.setValue(V,`modelViewMatrix`,i.modelViewMatrix),E.setValue(V,`normalMatrix`,i.normalMatrix),E.setValue(V,`modelMatrix`,i.matrixWorld),r.uniformsGroups!==void 0){let e=r.uniformsGroups;for(let t=0,n=e.length;t<n;t++){let n=e[t];et.update(n,S),et.bind(n,S)}}return S}function Et(e,t){e.ambientLightColor.needsUpdate=t,e.lightProbe.needsUpdate=t,e.sunLights.needsUpdate=t,e.sunLightShadows.needsUpdate=t,e.directionalLights.needsUpdate=t,e.directionalLightShadows.needsUpdate=t,e.pointLights.needsUpdate=t,e.pointLightShadows.needsUpdate=t,e.spotLights.needsUpdate=t,e.spotLightShadows.needsUpdate=t,e.rectAreaLights.needsUpdate=t,e.hemisphereLights.needsUpdate=t}function Dt(e){return e.isMeshLambertMaterial||e.isMeshToonMaterial||e.isMeshPhongMaterial||e.isMeshStandardMaterial||e.isShadowMaterial||e.isShaderMaterial&&e.lights===!0}this.getActiveCubeFace=function(){return ie},this.getActiveMipmapLevel=function(){return ae},this.getRenderTarget=function(){return R},this.setRenderTargetTextures=function(e,t,n){let r=U.get(e);r.__autoAllocateDepthBuffer=e.resolveDepthBuffer===!1,r.__autoAllocateDepthBuffer===!1&&(r.__useRenderToTexture=!1),U.get(e.texture).__webglTexture=t,U.get(e.depthTexture).__webglTexture=r.__autoAllocateDepthBuffer?void 0:n,r.__hasExternalTextures=!0},this.setRenderTargetFramebuffer=function(e,t){let n=U.get(e);n.__webglFramebuffer=t,n.__useDefaultFramebuffer=t===void 0},this.setRenderTarget=function(e,t=0,n=0){R=e,ie=t,ae=n;let r=null,i=!1,a=!1;if(e){let o=U.get(e);if(o.__useDefaultFramebuffer!==void 0){H.bindFramebuffer(V.FRAMEBUFFER,o.__webglFramebuffer),oe.copy(e.viewport),se.copy(e.scissor),ce=e.scissorTest,H.viewport(oe),H.scissor(se),H.setScissorTest(ce),z=-1;return}if(o.__webglFramebuffer===void 0)W.setupRenderTarget(e);else if(o.__hasExternalTextures)W.rebindTextures(e,U.get(e.texture).__webglTexture,U.get(e.depthTexture).__webglTexture);else if(e.depthBuffer){let t=e.depthTexture;if(o.__boundDepthTexture!==t){if(t!==null&&U.has(t)&&(e.width!==t.image.width||e.height!==t.image.height))throw Error(`THREE.WebGLRenderer: Attached DepthTexture is initialized to the incorrect size.`);W.setupDepthRenderbuffer(e)}}let s=e.texture;(s.isData3DTexture||s.isDataArrayTexture||s.isCompressedArrayTexture)&&(a=!0);let c=U.get(e).__webglFramebuffer;e.isWebGLCubeRenderTarget?(r=Array.isArray(c[t])?c[t][n]:c[t],i=!0):r=e.samples>0&&W.useMultisampledRTT(e)===!1?U.get(e).__webglMultisampledFramebuffer:Array.isArray(c)?c[n]:c,oe.copy(e.viewport),se.copy(e.scissor),ce=e.scissorTest}else oe.copy(ge).multiplyScalar(pe).floor(),se.copy(_e).multiplyScalar(pe).floor(),ce=ve;if(n!==0&&(r=ne),H.bindFramebuffer(V.FRAMEBUFFER,r)&&H.drawBuffers(e,r),H.viewport(oe),H.scissor(se),H.setScissorTest(ce),i){let r=U.get(e.texture);V.framebufferTexture2D(V.FRAMEBUFFER,V.COLOR_ATTACHMENT0,V.TEXTURE_CUBE_MAP_POSITIVE_X+t,r.__webglTexture,n)}else if(a){let r=t;for(let t=0;t<e.textures.length;t++){let i=U.get(e.textures[t]);V.framebufferTextureLayer(V.FRAMEBUFFER,V.COLOR_ATTACHMENT0+t,i.__webglTexture,n,r)}}else if(e!==null&&n!==0){let t=U.get(e.texture);V.framebufferTexture2D(V.FRAMEBUFFER,V.COLOR_ATTACHMENT0,V.TEXTURE_2D,t.__webglTexture,n)}z=-1};function Ot(e){let t=U.get(e);return(t.__readFormat!==e.format||t.__readType!==e.type)&&(t.__readFormat=e.format,t.__readType=e.type,t.__formatReadable=je.textureFormatReadable(e.format),t.__typeReadable=je.textureTypeReadable(e.type)),t}this.readRenderTargetPixels=function(e,t,n,r,i,a,o,s=0){if(!(e&&e.isWebGLRenderTarget)){K(`WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.`);return}let c=U.get(e).__webglFramebuffer;if(e.isWebGLCubeRenderTarget&&o!==void 0&&(c=c[o],Array.isArray(c)&&(c=c[0])),c){H.bindFramebuffer(V.FRAMEBUFFER,c);try{let o=e.textures[s],c=o.format,l=o.type;e.textures.length>1&&V.readBuffer(V.COLOR_ATTACHMENT0+s);let u=Ot(o);if(u.__formatReadable===!1){K(`WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.`);return}if(u.__typeReadable===!1){K(`WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.`);return}t>=0&&t<=e.width-r&&n>=0&&n<=e.height-i&&V.readPixels(t,n,r,i,Ze.convert(c),Ze.convert(l),a)}finally{let e=R===null?null:U.get(R).__webglFramebuffer;H.bindFramebuffer(V.FRAMEBUFFER,e)}}},this.readRenderTargetPixelsAsync=async function(e,t,n,r,i,a,o,s=0){if(!(e&&e.isWebGLRenderTarget))throw Error(`THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.`);let c=U.get(e).__webglFramebuffer;if(e.isWebGLCubeRenderTarget&&o!==void 0&&(c=c[o],Array.isArray(c)&&(c=c[0])),c){if(t>=0&&t<=e.width-r&&n>=0&&n<=e.height-i){H.bindFramebuffer(V.FRAMEBUFFER,c);let o=e.textures[s],l=o.format,u=o.type;e.textures.length>1&&V.readBuffer(V.COLOR_ATTACHMENT0+s);let d=Ot(o);if(d.__formatReadable===!1)throw Error(`THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in RGBA or implementation defined format.`);if(d.__typeReadable===!1)throw Error(`THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in UnsignedByteType or implementation defined type.`);let f=V.createBuffer();V.bindBuffer(V.PIXEL_PACK_BUFFER,f),V.bufferData(V.PIXEL_PACK_BUFFER,a.byteLength,V.STREAM_READ),V.readPixels(t,n,r,i,Ze.convert(l),Ze.convert(u),0),V.bindBuffer(V.PIXEL_PACK_BUFFER,null);let p=R===null?null:U.get(R).__webglFramebuffer;H.bindFramebuffer(V.FRAMEBUFFER,p);let m=V.fenceSync(V.SYNC_GPU_COMMANDS_COMPLETE,0);return V.flush(),await $e(V,m,4),V.bindBuffer(V.PIXEL_PACK_BUFFER,f),V.getBufferSubData(V.PIXEL_PACK_BUFFER,0,a),V.bindBuffer(V.PIXEL_PACK_BUFFER,null),V.deleteBuffer(f),V.deleteSync(m),a}throw Error(`THREE.WebGLRenderer.readRenderTargetPixelsAsync: requested read bounds are out of range.`)}},this.copyFramebufferToTexture=function(e,t=null,n=0){let r=2**-n,i=Math.floor(e.image.width*r),a=Math.floor(e.image.height*r),o=t===null?0:t.x,s=t===null?0:t.y;W.setTexture2D(e,0),V.copyTexSubImage2D(V.TEXTURE_2D,n,0,0,o,s,i,a),H.unbindTexture()},this.copyTextureToTexture=function(e,t,n=null,r=null,i=0,a=0){let o,s,c,l,u,d,f,p,m,h=e.isCompressedTexture?e.mipmaps[a]:e.image;if(n!==null)o=n.max.x-n.min.x,s=n.max.y-n.min.y,c=n.isBox3?n.max.z-n.min.z:1,l=n.min.x,u=n.min.y,d=n.isBox3?n.min.z:0;else{let t=2**-i;o=Math.floor(h.width*t),s=Math.floor(h.height*t),c=e.isDataArrayTexture?h.depth:e.isData3DTexture?Math.floor(h.depth*t):1,l=0,u=0,d=0}r===null?(f=0,p=0,m=0):(f=r.x,p=r.y,m=r.z);let g=Ze.convert(t.format),_=Ze.convert(t.type),v;t.isData3DTexture?(W.setTexture3D(t,0),v=V.TEXTURE_3D):t.isDataArrayTexture||t.isCompressedArrayTexture?(W.setTexture2DArray(t,0),v=V.TEXTURE_2D_ARRAY):(W.setTexture2D(t,0),v=V.TEXTURE_2D),H.activeTexture(V.TEXTURE0),H.pixelStorei(V.UNPACK_FLIP_Y_WEBGL,t.flipY),H.pixelStorei(V.UNPACK_PREMULTIPLY_ALPHA_WEBGL,t.premultiplyAlpha),H.pixelStorei(V.UNPACK_ALIGNMENT,t.unpackAlignment);let y=H.getParameter(V.UNPACK_ROW_LENGTH),b=H.getParameter(V.UNPACK_IMAGE_HEIGHT),x=H.getParameter(V.UNPACK_SKIP_PIXELS),S=H.getParameter(V.UNPACK_SKIP_ROWS),C=H.getParameter(V.UNPACK_SKIP_IMAGES);H.pixelStorei(V.UNPACK_ROW_LENGTH,h.width),H.pixelStorei(V.UNPACK_IMAGE_HEIGHT,h.height),H.pixelStorei(V.UNPACK_SKIP_PIXELS,l),H.pixelStorei(V.UNPACK_SKIP_ROWS,u),H.pixelStorei(V.UNPACK_SKIP_IMAGES,d);let w=e.isDataArrayTexture||e.isData3DTexture,T=t.isDataArrayTexture||t.isData3DTexture;if(e.isDepthTexture){let n=U.get(e),r=U.get(t),h=U.get(n.__renderTarget),g=U.get(r.__renderTarget);H.bindFramebuffer(V.READ_FRAMEBUFFER,h.__webglFramebuffer),H.bindFramebuffer(V.DRAW_FRAMEBUFFER,g.__webglFramebuffer);for(let n=0;n<c;n++)w&&(V.framebufferTextureLayer(V.READ_FRAMEBUFFER,V.COLOR_ATTACHMENT0,U.get(e).__webglTexture,i,d+n),V.framebufferTextureLayer(V.DRAW_FRAMEBUFFER,V.COLOR_ATTACHMENT0,U.get(t).__webglTexture,a,m+n)),V.blitFramebuffer(l,u,l+o,u+s,f,p,f+o,p+s,V.DEPTH_BUFFER_BIT,V.NEAREST);H.bindFramebuffer(V.READ_FRAMEBUFFER,null),H.bindFramebuffer(V.DRAW_FRAMEBUFFER,null)}else if(i!==0||e.isRenderTargetTexture||U.has(e)){let n=U.get(e),r=U.get(t);H.bindFramebuffer(V.READ_FRAMEBUFFER,re),H.bindFramebuffer(V.DRAW_FRAMEBUFFER,L);for(let e=0;e<c;e++)w?V.framebufferTextureLayer(V.READ_FRAMEBUFFER,V.COLOR_ATTACHMENT0,n.__webglTexture,i,d+e):V.framebufferTexture2D(V.READ_FRAMEBUFFER,V.COLOR_ATTACHMENT0,V.TEXTURE_2D,n.__webglTexture,i),T?V.framebufferTextureLayer(V.DRAW_FRAMEBUFFER,V.COLOR_ATTACHMENT0,r.__webglTexture,a,m+e):V.framebufferTexture2D(V.DRAW_FRAMEBUFFER,V.COLOR_ATTACHMENT0,V.TEXTURE_2D,r.__webglTexture,a),i===0?T?V.copyTexSubImage3D(v,a,f,p,m+e,l,u,o,s):V.copyTexSubImage2D(v,a,f,p,l,u,o,s):V.blitFramebuffer(l,u,l+o,u+s,f,p,f+o,p+s,V.COLOR_BUFFER_BIT,V.NEAREST);H.bindFramebuffer(V.READ_FRAMEBUFFER,null),H.bindFramebuffer(V.DRAW_FRAMEBUFFER,null)}else T?e.isDataTexture||e.isData3DTexture?V.texSubImage3D(v,a,f,p,m,o,s,c,g,_,h.data):t.isCompressedArrayTexture?V.compressedTexSubImage3D(v,a,f,p,m,o,s,c,g,h.data):V.texSubImage3D(v,a,f,p,m,o,s,c,g,_,h):e.isDataTexture?V.texSubImage2D(V.TEXTURE_2D,a,f,p,o,s,g,_,h.data):e.isCompressedTexture?V.compressedTexSubImage2D(V.TEXTURE_2D,a,f,p,h.width,h.height,g,h.data):V.texSubImage2D(V.TEXTURE_2D,a,f,p,o,s,g,_,h);H.pixelStorei(V.UNPACK_ROW_LENGTH,y),H.pixelStorei(V.UNPACK_IMAGE_HEIGHT,b),H.pixelStorei(V.UNPACK_SKIP_PIXELS,x),H.pixelStorei(V.UNPACK_SKIP_ROWS,S),H.pixelStorei(V.UNPACK_SKIP_IMAGES,C),a===0&&t.generateMipmaps===!0&&t.mipmapsAutoUpdate===!0&&V.generateMipmap(v),H.unbindTexture()},this.initRenderTarget=function(e){U.get(e).__webglFramebuffer===void 0&&W.setupRenderTarget(e)},this.initTexture=function(e){e.isCubeTexture?W.setTextureCube(e,0):e.isData3DTexture?W.setTexture3D(e,0):e.isDataArrayTexture||e.isCompressedArrayTexture?W.setTexture2DArray(e,0):W.setTexture2D(e,0),H.unbindTexture()},this.resetState=function(){ie=0,ae=0,R=null,H.reset(),Qe.reset()},typeof __THREE_DEVTOOLS__<`u`&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent(`observe`,{detail:this}))}get coordinateSystem(){return We}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(e){this._outputColorSpace=e;let t=this.getContext();t.drawingBufferColorSpace=Rt._getDrawingBufferColorSpace(e),t.unpackColorSpace=Rt._getUnpackColorSpace()}},nd={x:-367.6,z:-1450.9,ele:106},rd=10,id=[[0,0,1,210,260],[60,220,.42,200,170],[-150,120,.3,170,190],[120,-140,.25,160,150],[-90,-200,.22,170,140]],ad=1;function od(e){e&&(nd={x:e.x,z:e.z,ele:e.ele||106}),ad=1,ad=sd(nd.x,nd.z)}function sd(e,t){let n=0;for(let[r,i,a,o,s]of id){let c=(e-nd.x-r)/o,l=(t-nd.z-i)/s;n+=a*Math.exp(-(c*c+l*l)*1.6)}return n}function cd(){return nd}function $(e,t){let n=e-nd.x,r=t-nd.z,i=n*n+r*r;if(i>577600)return 0;let a=Math.sqrt(i),o=sd(e,t)/ad*(nd.ele-rd);o+=(Math.sin(e*.031)*Math.cos(t*.027)+Math.sin(e*.07+t*.05)*.5)*2*Math.min(1,o/15);let s=Math.min(1,Math.max(0,(760-a)/220));return o*=s*s*(3-2*s),Math.max(0,o-.6)}od(null);function ld(e,t=!1){let n=e[0].index!==null,r=new Set(Object.keys(e[0].attributes)),i=new Set(Object.keys(e[0].morphAttributes)),a={},o={},s=e[0].morphTargetsRelative,c=new kr;c.morphTargetsRelative=s;let l=0;for(let u=0;u<e.length;++u){let d=e[u],f=0,p=0;if(n!==(d.index!==null))return console.error(`THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index `+u+`. All geometries must have compatible attributes; make sure index attribute exists among all geometries, or in none of them.`),null;for(let e in d.attributes){if(!r.has(e))return console.error(`THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index `+u+`. All geometries must have compatible attributes; make sure "`+e+`" attribute exists among all geometries, or in none of them.`),null;a[e]===void 0&&(a[e]=[]),a[e].push(d.attributes[e]),f++}if(f!==r.size)return console.error(`THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index `+u+`. Make sure all geometries have the same number of attributes.`),null;if(s!==d.morphTargetsRelative)return console.error(`THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index `+u+`. .morphTargetsRelative must be consistent throughout all geometries.`),null;for(let t in d.morphAttributes){if(!i.has(t))return console.error(`THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index `+u+`.  .morphAttributes must be consistent throughout all geometries.`),null;if(d.morphAttributes[t].length!==e[0].morphAttributes[t].length)return console.error(`THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index `+u+`. All geometries must have the same number of morph targets for the "`+t+`" morph attribute.`),null;o[t]===void 0&&(o[t]=[]),o[t].push(d.morphAttributes[t]),p++}if(p!==i.size)return console.error(`THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index `+u+`. Make sure all geometries have the same number of morph attributes.`),null;if(t){let e;if(n)e=d.index.count;else if(d.attributes.position!==void 0)e=d.attributes.position.count;else return console.error(`THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index `+u+`. The geometry must have either an index or a position attribute`),null;c.addGroup(l,e,u),l+=e}}if(n){let t=0,n=[];for(let r=0;r<e.length;++r){let i=e[r].index;for(let e=0;e<i.count;++e)n.push(i.getX(e)+t);t+=e[r].attributes.position.count}c.setIndex(n)}for(let e in a){let t=ud(a[e]);if(!t)return console.error(`THREE.BufferGeometryUtils: .mergeGeometries() failed while trying to merge the `+e+` attribute.`),null;c.setAttribute(e,t)}for(let e in o){let t=o[e][0].length;if(t!==0){c.morphAttributes=c.morphAttributes||{},c.morphAttributes[e]=[];for(let n=0;n<t;++n){let t=[];for(let r=0;r<o[e].length;++r)t.push(o[e][r][n]);let r=ud(t);if(!r)return console.error(`THREE.BufferGeometryUtils: .mergeGeometries() failed while trying to merge the `+e+` morphAttribute.`),null;c.morphAttributes[e].push(r)}}}return c}function ud(e){let t,n,r,i=-1,a=0;for(let o=0;o<e.length;++o){let s=e[o];if(t===void 0&&(t=s.array.constructor),t!==s.array.constructor)return console.error(`THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.array must be of consistent array types across matching attributes.`),null;if(n===void 0&&(n=s.itemSize),n!==s.itemSize)return console.error(`THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.itemSize must be consistent across matching attributes.`),null;if(r===void 0&&(r=s.normalized),r!==s.normalized)return console.error(`THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.normalized must be consistent across matching attributes.`),null;if(i===-1&&(i=s.gpuType),i!==s.gpuType)return console.error(`THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.gpuType must be consistent across matching attributes.`),null;a+=s.count*n}let o=new t(a),s=new hr(o,n,r),c=0;for(let t=0;t<e.length;++t){let r=e[t];if(r.isInterleavedBufferAttribute){let e=c/n;for(let t=0,i=r.count;t<i;t++)for(let i=0;i<n;i++){let n=r.getComponent(t,i);s.setComponent(t+e,i,n)}}else o.set(r.array,c);c+=r.count*n}return i!==void 0&&(s.gpuType=i),s}function dd(e,t){if(t===0)return console.warn(`THREE.BufferGeometryUtils.toTrianglesDrawMode(): Geometry already defined as triangles.`),e;if(t===2||t===1){let n=e.getIndex();if(n===null){let t=[],r=e.getAttribute(`position`);if(r!==void 0){for(let e=0;e<r.count;e++)t.push(e);e.setIndex(t),n=e.getIndex()}else return console.error(`THREE.BufferGeometryUtils.toTrianglesDrawMode(): Undefined position attribute. Processing not possible.`),e}let r=n.count-2,i=[];if(t===2)for(let e=1;e<=r;e++)i.push(n.getX(0)),i.push(n.getX(e)),i.push(n.getX(e+1));else for(let e=0;e<r;e++)e%2==0?(i.push(n.getX(e)),i.push(n.getX(e+1)),i.push(n.getX(e+2))):(i.push(n.getX(e+2)),i.push(n.getX(e+1)),i.push(n.getX(e)));return i.length/3!==r&&console.error(`THREE.BufferGeometryUtils.toTrianglesDrawMode(): Unable to generate correct amount of triangles.`),e.setIndex(i),e.clearGroups(),e}return console.error(`THREE.BufferGeometryUtils.toTrianglesDrawMode(): Unknown draw mode:`,t),e}var fd=new J(-.52,.64,.57).normalize(),pd=e=>new J((e>>16&255)/255,(e>>8&255)/255,(e&255)/255),md=11127278,hd=pd(md),gd={uSunDir:{value:fd},uHaze:{value:hd},uSkyMap:{value:null},uShadow0:{value:null},uShadow1:{value:null},uShadowMat0:{value:new Y},uShadowMat1:{value:new Y},uShadowInfo:{value:new Yt(.2,1,0,0)},uNight:{value:0},uTextTex:{value:null},uSloganTex:{value:null},uIgn:{value:Array.from({length:32},()=>new Yt)},uIgnB:{value:Array.from({length:32},()=>new Yt)},uBeamT:{value:[1e9,1e9,1e9,1e9]},uWave:{value:new Yt(0,0,1e9,0)},uTime:{value:0},uTreeNear:{value:0}},_d=(e={})=>({...gd,...e}),vd=`
precision highp sampler2DShadow;
uniform sampler2DShadow uShadow0;
uniform sampler2DShadow uShadow1;
uniform mat4 uShadowMat0;
uniform mat4 uShadowMat1;
uniform vec4 uShadowInfo;
float ftShadowTap(sampler2DShadow m, vec3 c){
  const float r = 1.0 / 2048.0;
  float s = texture(m, vec3(c.xy + vec2(-0.6, -0.3) * r, c.z));
  s += texture(m, vec3(c.xy + vec2(0.6, 0.3) * r, c.z));
  s += texture(m, vec3(c.xy + vec2(-0.3, 0.6) * r, c.z));
  s += texture(m, vec3(c.xy + vec2(0.3, -0.6) * r, c.z));
  return s * 0.25;
}
float sunShadowOff(vec3 wp, vec3 n, float extra){
  if (uShadowInfo.z < 0.5) return 1.0;
  vec3 c = (uShadowMat0 * vec4(wp + n * (uShadowInfo.x * 2.0 + extra), 1.0)).xyz;
  if (c.x > 0.015 && c.x < 0.985 && c.y > 0.015 && c.y < 0.985 && c.z > 0.0 && c.z < 1.0) {
    c.z -= 0.00004;
    return ftShadowTap(uShadow0, c);
  }
  c = (uShadowMat1 * vec4(wp + n * (uShadowInfo.y * 2.0 + extra), 1.0)).xyz;
  if (c.x > 0.0 && c.x < 1.0 && c.y > 0.0 && c.y < 1.0 && c.z > 0.0 && c.z < 1.0) {
    c.z -= 0.00012;
    float s = ftShadowTap(uShadow1, c);
    vec2 e = abs(c.xy - 0.5) * 2.0;
    return mix(s, 1.0, smoothstep(0.88, 1.0, max(e.x, e.y)));
  }
  return 1.0;
}
float sunShadow(vec3 wp, vec3 n){ return sunShadowOff(wp, n, 0.0); }
`,yd=`
uniform vec3 uHaze;
uniform float uNight;
vec3 atmo(vec3 col, vec3 wp){
  float d = distance(wp, cameraPosition);
  float f = 1.0 - exp(-d * mix(0.00009, 0.00012, uNight));
  f *= mix(1.0, 0.55, clamp(wp.y / 600.0, 0.0, 1.0));
  // 夜里的霭是被城市灯光染成的紫橙色，不是黑
  return mix(col, mix(uHaze, vec3(0.150, 0.085, 0.080), uNight), clamp(f, 0.0, 0.85));
}
`,bd=`
uniform vec3 uSunDir;
uniform sampler2D uSkyMap;
uniform float uTime;
// 光球点亮：从击中点向外以 85 m/s 扩散，只作用在目标楼的圆柱范围内。返回 (已点亮程度, 扩散前沿的亮带)
uniform vec4 uIgn[32];
uniform vec4 uIgnB[32];
// 冲击波半径（米）：起步每秒 260m，越跑越快（加速度 180 m/s²），约 12 秒传遍三区。负数表示没有冲击波
uniform vec4 uWave;
float waveRadius(){ float t = uTime - uWave.z; return t < 0.0 ? -1.0 : 260.0 * t + 90.0 * t * t; }
vec2 ignition(vec3 wp){
  float lit = 0.0, fr = 0.0;
  // 冲击波扫到的参演楼全部点亮（不占 32 个单栋名额），波前是一道亮带
  float wr = waveRadius();
  if (wr >= 0.0) {
    float dw = distance(wp.xz, uWave.xy);
    lit = 1.0 - smoothstep(wr - 70.0, wr, dw);
    fr = exp(-pow((dw - wr) / 45.0, 2.0));
  }
  for (int i = 0; i < 32; i++) {
    vec4 b = uIgnB[i];
    if (b.w <= 0.0) continue;
    vec2 dxz = wp.xz - b.xy;
    if (dot(dxz, dxz) > b.w * b.w) continue;
    float r = (uTime - b.z) * 85.0;
    if (r < 0.0) continue;
    float d = distance(wp, uIgn[i].xyz);
    lit = max(lit, 1.0 - smoothstep(r - 16.0, r, d));
    fr = max(fr, exp(-pow((d - r) / 9.0, 2.0)));
  }
  return vec2(lit, fr);
}
${vd}
${yd}
float hash11(float p){ p = fract(p*0.1031); p *= p+33.33; p *= p+p; return fract(p); }
float hash21(vec2 p){ vec3 p3 = fract(vec3(p.xyx)*0.1031); p3 += dot(p3, p3.yzx+33.33); return fract((p3.x+p3.y)*p3.z); }
float vnoise(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);
  return mix(mix(hash21(i),hash21(i+vec2(1,0)),f.x), mix(hash21(i+vec2(0,1)),hash21(i+vec2(1,1)),f.x), f.y); }
// 烘焙好的天空（含积云），显示空间颜色；a = 云的透过率
vec4 skyTex(vec3 d){
  float az = atan(d.z, d.x);
  float v = sqrt(clamp((d.y + 0.05) / 1.05, 0.0, 1.0));
  vec4 t = texture2D(uSkyMap, vec2(az / 6.28318530718 + 0.5, v));
  if (uNight > 0.0) {
    // 夜空：天顶深蓝，地平线一圈城市光污染；云被城市从下面照成暗紫色
    float y = max(d.y, 0.0);
    // 第 5 轮打磨：天顶深紫蓝，往下过渡到暗玫红，地平线一圈暖红橙的雾（参考《深圳夜之城》的航拍夜景）
    vec3 ng = mix(vec3(0.24, 0.10, 0.16), vec3(0.020, 0.022, 0.070), pow(y, 0.42));
    ng += vec3(0.40, 0.17, 0.09) * pow(1.0 - y, 9.0) + vec3(0.18, 0.09, 0.03) * pow(1.0 - y, 30.0);
    vec3 cl = mix(vec3(0.10, 0.07, 0.12), vec3(0.30, 0.15, 0.13), pow(1.0 - y, 3.0));
    t.rgb = mix(t.rgb, mix(cl, ng, t.a), uNight);
  }
  return t;
}
vec3 skyColor(vec3 d){ return skyTex(d).rgb; }
vec3 toLin(vec3 c){ return pow(max(c, 0.0), vec3(2.2)); }
vec3 toneMap(vec3 x){
  x = 1.0 - exp(-x * 0.78);
  x = pow(x, vec3(1.0 / 2.2));
  float l = dot(x, vec3(0.299, 0.587, 0.114));
  return clamp(mix(vec3(l), x, 1.14), 0.0, 1.0);
}
const vec3 SUN_E = vec3(2.55, 2.42, 2.18);
// 夜里太阳换成同方向的月光（阴影贴图照用），环境光换成偏暖的城市漫反射
vec3 sunE(){ return mix(SUN_E, vec3(0.085, 0.115, 0.20), uNight); }
vec3 ambientLin(vec3 n){
  vec3 day = mix(vec3(0.26, 0.25, 0.22), vec3(0.50, 0.64, 0.86), n.y * 0.5 + 0.5) * 0.92;
  vec3 night = mix(vec3(0.075, 0.050, 0.030), vec3(0.024, 0.030, 0.058), n.y * 0.5 + 0.5);
  return mix(day, night, uNight);
}
// 窗内灯光：一格一格独立亮灭，暖黄为主，少量冷白和电视蓝
vec3 winLight(vec2 id, float seed){
  // 第 5 轮打磨：更密（约六成半亮）、以琥珀色为主，少量暖白，极少冷白
  float h = hash21(id * 1.13 + seed * 71.0);
  float on = step(0.36, h);
  vec3 c = h > 0.975 ? vec3(0.62, 0.80, 1.0) : (h > 0.88 ? vec3(1.0, 0.90, 0.70) : (h > 0.62 ? vec3(1.0, 0.72, 0.34) : vec3(1.0, 0.60, 0.22)));
  return c * on * (0.55 + 0.7 * hash21(id + seed + 5.0));
}
vec3 hsv2rgb(float h, float s, float v){ vec3 k = clamp(abs(fract(h + vec3(0.0, 2.0/3.0, 1.0/3.0)) * 6.0 - 3.0) - 1.0, 0.0, 1.0); return v * mix(vec3(1.0), k, s); }
// ---------------- 深圳灯光秀：60 秒一轮，四幕，各 15 秒，幕间 1.5 秒过渡 ----------------
//   一幕「潮汐」青蓝色光带自下而上，沿深南大道由西向东推进
//   二幕「像素雨」紫红色竖列下落，金色雨头
//   三幕「红金」全城同拍呼吸，金色横条缓缓上升
//   四幕「彩虹」色相随东西位置变化，整条天际线横向扫过
// id = 幕墙分格号（当作 LED 像素），hgt = 离地高度，wp = 世界坐标，ph = 每栋楼的随机相位
vec3 showAct(int a, vec2 id, float hgt, vec3 wp, float ph){
  if (a == 0) {
    float w = sin(hgt * 0.045 - uTime * 1.7 + wp.x * 0.0016);
    float band = smoothstep(0.15, 0.9, w);
    vec3 c = mix(vec3(0.0, 0.05, 0.28), vec3(0.10, 0.92, 1.0), band);
    return c + vec3(0.8, 1.0, 1.0) * step(0.985, hash21(id + floor(uTime * 6.0)));
  } else if (a == 1) {
    float ch = hash11(id.x * 3.1 + ph * 90.0);
    float y = fract(id.y * 0.03 + uTime * (0.22 + 0.3 * ch) + ch);
    vec3 c = mix(vec3(0.10, 0.0, 0.20), vec3(0.98, 0.14, 0.74), pow(y, 3.0));
    return c + vec3(1.0, 0.82, 0.3) * smoothstep(0.93, 1.0, y);
  } else if (a == 2) {
    float beat = 0.5 + 0.5 * sin(uTime * 2.4);
    float bars = step(0.5, fract(id.y * 0.125 - uTime * 0.3));
    return mix(vec3(0.80, 0.05, 0.04), vec3(1.0, 0.74, 0.16), bars * 0.85) * (0.55 + 0.45 * beat);
  }
  float h = fract(wp.x * 0.0009 + wp.z * 0.0004 - uTime * 0.08);
  return hsv2rgb(h, 0.85, 1.0) * (0.6 + 0.4 * sin(hgt * 0.16 + uTime * 3.0 + ph * 6.0));
}
vec3 showColor(vec2 id, float hgt, vec3 wp, float ph){
  float t = mod(uTime, 60.0) / 15.0;
  int a = int(floor(t));
  float k = smoothstep(0.9, 1.0, fract(t));
  vec3 c0 = showAct(a, id, hgt, wp, ph);
  if (k <= 0.0) return c0;
  return mix(c0, showAct(a == 3 ? 0 : a + 1, id, hgt, wp, ph), k);
}
// ---------------- 灯光秀楼体大字（第 5 轮）----------------
// 字形图集：一行 12 格 = A P E C 空格 来 了 就 是 深 圳 人（用系统中文字体画到画布上，见 makeShowTextTexture）
uniform sampler2D uTextTex;
uniform sampler2D uSloganTex;
// 字形图集是 8×8 格，gi = 格号；guv 是格内坐标（y 朝上）
float glyphAt(float gi, vec2 guv){
  if (gi < -0.5 || guv.y < 0.0 || guv.y > 1.0) return 0.0;
  float c = mod(gi, 8.0), j = floor(gi / 8.0);
  return texture2D(uTextTex, vec2((c + clamp(guv.x, 0.03, 0.97)) / 8.0, 1.0 - (j + 1.0 - clamp(guv.y, 0.03, 0.97)) / 8.0)).r;
}
// 第 k 句的第 r 个字的格号；空位返回 -1
float sloganGlyph(float k, float r){
  if (r < -0.5 || r > 30.5) return -1.0;
  float v = texture2D(uSloganTex, vec2((r + 0.5) / 32.0, (k + 0.5) / 8.0)).r * 255.0;
  return v > 200.0 ? -1.0 : floor(v + 0.5);
}
float sloganLen(float k){ return floor(texture2D(uSloganTex, vec2(31.5 / 32.0, (k + 0.5) / 8.0)).r * 255.0 + 0.5); }
// 幕墙贴图坐标在屏幕上是否左右镜像（各栋楼的绕向不一样；镜像了就把字翻回来，保证汉字不会反）
float uvFlip(vec2 p){ return (dFdx(p.x) * dFdy(p.y) - dFdy(p.x) * dFdx(p.y)) < 0.0 ? -1.0 : 1.0; }
// 竖排：一列字从上往下读，整列持续上移（每秒 0.55 个字高）；s = 字高（米）；每 6 个字宽重复一列。
// k = 这栋楼起始的文案号。每 16 行是一段（最长的一句 13 个字，其余是句间空行），一段滚完换下一句，8 句轮着来。
// 返回 (字的亮度, 是否在字列的深色底板里, 当前是第几句)
// wm = 两列字之间隔几个字宽（普通楼 6；春笋的专用字带 4）
vec3 showTextV(vec2 p, float s, float k, float wm){
  float W = wm * s;
  float u = (mod(p.x + W * 0.5, W) - W * 0.5) * uvFlip(p);
  float panel = 1.0 - smoothstep(s * 0.60, s * 0.68, abs(u));
  if (panel <= 0.0) return vec3(0.0);
  float yy = p.y / s - uTime * 0.55;
  float rowAbs = -floor(yy) - 1.0;                    // 行号，越往下越大
  float slot = floor(rowAbs / 16.0);
  float kk = mod(k + slot, 8.0);
  float gi = sloganGlyph(kk, rowAbs - slot * 16.0);
  return vec3(glyphAt(gi, vec2(u / s + 0.5, fract(yy))), panel, kk);
}
// 横排：一行字居中，整行往上滚（每秒 0.4 个字高）；每滚过一行换下一句
vec3 showTextH(vec2 p, float s, float k){
  float u = p.x * uvFlip(p);
  float q = (p.y - uTime * 0.4 * s) / (4.0 * s);
  float kk = mod(k - floor(q), 8.0);
  float yy = fract(q) * 4.0 - 2.0;
  float len = sloganLen(kk);
  float panel = step(-0.25, yy) * step(yy, 1.25) * step(abs(u), 6.9 * s);
  float ci = floor(u / s + len * 0.5);
  float gi = (ci < 0.0 || ci > len - 0.5) ? -1.0 : sloganGlyph(kk, ci);
  return vec3(glyphAt(gi, vec2(fract(u / s + len * 0.5), yy)), panel, kk);
}
// 轮廓灯带的颜色：按相位分白金 / 青 / 品红，或者跟着灯光秀走
vec3 stripColor(float ph, vec3 wp){
  if (ph < 0.25) return vec3(1.0, 0.86, 0.55);
  if (ph < 0.5) return vec3(0.15, 0.95, 1.0);
  if (ph < 0.75) return vec3(1.0, 0.25, 0.75);
  // 塔冠等：青白色，缓慢呼吸（不再跟着表演色块变色）
  return vec3(0.35, 0.95, 1.0) * (0.75 + 0.25 * sin(uTime * 0.8 + wp.y * 0.01));
}
float gShadow = 1.0;
// albedo 为线性；返回显示空间
vec3 lightLin(vec3 alb, vec3 n, float sh, float ao){
  float ndl = max(dot(n, uSunDir), 0.0);
  return toneMap(alb * (sunE() * ndl * sh + ambientLin(n) * ao));
}
// albedo 为显示空间颜色（沿用旧代码里的调色），返回显示空间
vec3 lightIt(vec3 albedo, vec3 n){ return lightLin(toLin(albedo), n, gShadow, 1.0); }
// 反射环境：天空 + 一圈假的对面楼群（低仰角处），让玻璃有东西可反射
vec3 envRefl(vec3 R, float worldY){
  vec3 sky = skyColor(vec3(R.x, max(R.y, 0.0), R.z));
  float az = atan(R.z, R.x);
  float cell = floor(az * 7.0);
  float f = fract(az * 7.0);
  float hgt = (0.03 + 0.34 * hash11(cell * 1.31 + 5.0) * hash11(cell * 0.73 + 1.7)) * clamp(1.15 - worldY / 320.0, 0.15, 1.0);
  float gap = step(0.12, f) * step(f, 0.88);
  float m = (1.0 - smoothstep(hgt - 0.012, hgt, R.y)) * gap;
  m = max(m, 1.0 - smoothstep(-0.01, 0.015, R.y));
  vec3 b = mix(vec3(0.33, 0.43, 0.55), vec3(0.62, 0.66, 0.70), hash11(cell * 3.1 + 0.5));
  b *= 0.86 + 0.14 * step(0.5, fract(R.y * 55.0));
  vec3 ground = vec3(0.24, 0.30, 0.24);
  // 夜里对面楼群是暗的，带一格一格亮着的窗
  b = mix(b, vec3(0.03, 0.035, 0.06) + step(0.62, hash21(vec2(cell, floor(R.y * 55.0)))) * vec3(0.75, 0.55, 0.30), uNight);
  ground = mix(ground, vec3(0.10, 0.07, 0.05), uNight);
  b = mix(ground, b, smoothstep(-0.06, 0.0, R.y));
  return mix(sky, b, m * 0.9);
}
`;function xd({color:e=16777215,map:t=null,alphaTest:n=0,side:r=0,emissive:i=0,spec:a=0}={}){let o=new X(e);return new co({uniforms:_d({uColor:{value:new J(o.r,o.g,o.b)},uMap:{value:t},uEmis:{value:i},uSpec:{value:a}}),defines:t?{USE_FT_MAP:1,FT_ALPHATEST:n.toFixed(3)}:{},side:r,vertexShader:`
      varying vec3 vWorld; varying vec3 vN; varying vec3 vCol; varying vec2 vUv;
      void main(){
        vec4 lp = vec4(position, 1.0); vec3 ln = normal;
        #ifdef USE_INSTANCING
          lp = instanceMatrix * lp; ln = mat3(instanceMatrix) * ln;
        #endif
        vec4 wp = modelMatrix * lp; vWorld = wp.xyz; vN = normalize(mat3(modelMatrix) * ln);
        vCol = vec3(1.0);
        #ifdef USE_INSTANCING_COLOR
          vCol = instanceColor;
        #endif
        vUv = uv;
        gl_Position = projectionMatrix * viewMatrix * wp;
      }`,fragmentShader:`
      ${bd}
      uniform vec3 uColor; uniform float uEmis; uniform float uSpec;
      #ifdef USE_FT_MAP
      uniform sampler2D uMap;
      #endif
      varying vec3 vWorld; varying vec3 vN; varying vec3 vCol; varying vec2 vUv;
      void main(){
        vec3 n = normalize(vN); if (!gl_FrontFacing) n = -n;
        vec3 alb = uColor * vCol;
        #ifdef USE_FT_MAP
          vec4 t = texture2D(uMap, vUv);
          if (t.a < FT_ALPHATEST) discard;
          alb *= toLin(t.rgb);
        #endif
        float sh = sunShadow(vWorld, n);
        vec3 col = lightLin(alb, n, sh, 1.0);
        if (uSpec > 0.0) {
          vec3 V = normalize(vWorld - cameraPosition);
          col += uSpec * sh * pow(max(dot(n, normalize(uSunDir - V)), 0.0), 50.0) * 0.5;
        }
        // 自发光只在夜里起作用（路灯灯头等）
        col = mix(col, pow(alb, vec3(1.0 / 2.2)) * 1.25, uEmis * uNight);
        gl_FragColor = vec4(atmo(col, vWorld), 1.0);
      }`})}var Sd=[`APEC 来了就是深圳人`,`来了就是深圳人`,`我们都是深圳人`,`时间就是金钱 效率就是生命`,`深圳速度`,`敢闯敢试 敢为天下先`,`空谈误国 实干兴邦`,`你好，鹏城`];Sd[0];function Cd(){let e=[];for(let t of Sd)for(let n of t)n!==` `&&!e.includes(n)&&e.push(n);e.length>64&&console.warn(`[futian] 灯光秀文案的字超过 64 个，图集放不下`,e.length);let t=document.createElement(`canvas`);t.width=t.height=1024;let r=t.getContext(`2d`);r.fillStyle=`#000`,r.fillRect(0,0,t.width,t.height),r.fillStyle=`#fff`,r.textAlign=`center`,r.textBaseline=`middle`,e.forEach((e,t)=>{let n=e.charCodeAt(0)<128;r.font=`${n?900:700} ${n?118:108}px "Noto Sans CJK SC", "Noto Sans SC", "Source Han Sans SC", "PingFang SC", "Microsoft YaHei", "Heiti SC", sans-serif`;let i=(t%8+.5)*128+(e===`，`?28.16:0),a=(Math.floor(t/8)+.53)*128-(e===`，`?12.8:0);r.fillText(e,i,a,117.76)});let a=new ia(t);a.wrapS=a.wrapT=n,a.generateMipmaps=!0,a.minFilter=l,a.anisotropy=8,gd.uTextTex.value=a;let o=new Uint8Array(1024).fill(255);Sd.forEach((t,n)=>{let r=[...t];r.length>16&&console.warn(`[futian] 文案超过 16 个字，竖排一段放不下：`,t),r.forEach((t,r)=>{r<31&&(o[(n*32+r)*4]=t===` `?255:e.indexOf(t))}),o[(n*32+31)*4]=r.length});let s=new _i(o,32,8,T);return s.minFilter=s.magFilter=i,s.needsUpdate=!0,gd.uSloganTex.value=s,t.__glyphs=e.join(``),t}var wd=0;function Td(e,t,n=0){let r=wd;wd=(wd+1)%32,gd.uIgn.value[r].set(e.x,e.y,e.z,0),gd.uIgnB.value[r].set(t.x,t.z,gd.uTime.value-n,t.R),t.beam!=null&&(gd.uBeamT.value[t.beam]=gd.uTime.value-n+.8),t.lit=!0}var Ed=e=>e<0?-1:260*e+90*e*e,Dd=e=>(-260+Math.sqrt(67600+360*e))/180;function Od(e,t,n=0,r=[]){let i=gd.uTime.value+n;gd.uWave.value.set(e,t,i,0);for(let n of r)n.beam!=null&&(gd.uBeamT.value[n.beam]=Math.min(gd.uBeamT.value[n.beam],i+Dd(Math.hypot(n.x-e,n.z-t))+.5));return i}function kd(e){gd.uWave.value.set(0,0,1e9,0);for(let e=0;e<32;e++)gd.uIgnB.value[e].set(0,0,0,0);for(let e=0;e<4;e++)gd.uBeamT.value[e]=1e9;if(wd=0,e)for(let t of e)t.lit=!1}var Ad=[];function jd({color:e=[1,.78,.45],size:t=5,local:n=[0,0,0],gain:r=1}={}){return new co({uniforms:_d({uGlowCol:{value:new J(...e)},uSize:{value:t},uLocal:{value:new J(...n)},uGain:{value:r}}),transparent:!0,depthWrite:!1,blending:2,vertexShader:`
      uniform float uSize; uniform vec3 uLocal;
      varying vec2 vP; varying float vFade;
      void main(){
        vec4 c = vec4(uLocal, 1.0);
        #ifdef USE_INSTANCING
          c = instanceMatrix * c;
        #endif
        vec4 mv = viewMatrix * modelMatrix * c;
        // 远处光晕保持一个最小的屏幕尺寸，像真实的灯点
        float sz = max(uSize, -mv.z * 0.004);
        vFade = clamp(uSize / sz, 0.25, 1.0);
        mv.xy += position.xy * sz;
        vP = position.xy * 2.0;
        gl_Position = projectionMatrix * mv;
      }`,fragmentShader:`
      uniform vec3 uGlowCol; uniform float uNight; uniform float uGain;
      varying vec2 vP; varying float vFade;
      void main(){
        float r = length(vP);
        float a = pow(max(1.0 - r, 0.0), 2.4) + 0.6 * pow(max(1.0 - r * 3.0, 0.0), 2.0);
        gl_FragColor = vec4(uGlowCol * a * uNight * uGain * vFade * 1.35, 1.0);
      }`})}function Md(e){e.onBeforeCompile=e=>{Object.assign(e.uniforms,{uShadow0:gd.uShadow0,uShadow1:gd.uShadow1,uShadowMat0:gd.uShadowMat0,uShadowMat1:gd.uShadowMat1,uShadowInfo:gd.uShadowInfo,uHaze:gd.uHaze,uNight:gd.uNight}),e.vertexShader=e.vertexShader.replace(`#include <common>`,`#include <common>
varying vec3 vFtWorld;`).replace(`#include <project_vertex>`,`#include <project_vertex>
{ vec4 ftP = vec4(transformed, 1.0);
#ifdef USE_INSTANCING
ftP = instanceMatrix * ftP;
#endif
vFtWorld = (modelMatrix * ftP).xyz; }`),e.fragmentShader=e.fragmentShader.replace(`#include <common>`,`#include <common>\nvarying vec3 vFtWorld;\n${vd}\n${yd}`).replace(`#include <lights_fragment_end>`,`#include <lights_fragment_end>
        { vec3 ftN = normalize(cross(dFdx(vFtWorld), dFdy(vFtWorld)));
          if (dot(ftN, cameraPosition - vFtWorld) < 0.0) ftN = -ftN;
          float ftSh = sunShadow(vFtWorld, ftN);
          reflectedLight.directDiffuse *= ftSh; reflectedLight.directSpecular *= ftSh; }`).replace(`#include <dithering_fragment>`,`#include <dithering_fragment>
gl_FragColor.rgb = atmo(gl_FragColor.rgb, vFtWorld);`)},e.customProgramCacheKey=()=>`ft-std`,e.needsUpdate=!0}function Nd(){return new co({uniforms:_d(),depthWrite:!1,polygonOffset:!0,polygonOffsetFactor:-2,polygonOffsetUnits:-4,vertexShader:`
      attribute vec4 aRoad;
      varying vec2 vUv; varying vec4 vRoad; varying vec3 vWorld;
      void main(){
        vUv = uv; vRoad = aRoad;
        vec4 wp = modelMatrix * vec4(position,1.0); vWorld = wp.xyz;
        gl_Position = projectionMatrix * viewMatrix * wp;
      }`,fragmentShader:`
      ${bd}
      varying vec2 vUv; varying vec4 vRoad; varying vec3 vWorld;
      float line(float x, float c, float hw, float fw){ return 1.0 - smoothstep(hw - fw, hw + fw, abs(x - c)); }
      void main(){
        float width = vRoad.x, lanes = vRoad.y, oneway = vRoad.z, ped = vRoad.w;
        float across = vUv.y * width * 0.5;      // 米，-w/2..w/2
        float along = vUv.x;
        float fw = fwidth(across) * 1.0 + 0.01;
        float lod = clamp(fwidth(along) * 0.6, 0.0, 1.0);
        vec3 col;
        if (ped > 0.5) {
          vec2 t = fract(vec2(along, across) / 0.6);
          float joint = (1.0 - lod) * (step(0.92, t.x) + step(0.92, t.y));
          col = vec3(0.70,0.67,0.61) * (0.92 + vnoise(vWorld.xz*0.6)*0.12) * (1.0 - joint*0.12);
          if (ped > 1.5) col = vec3(0.60,0.36,0.30) * (0.9 + vnoise(vWorld.xz*0.5)*0.15); // 自行车道
        } else {
          // 沥青：粗细两层噪声 + 车道中间磨亮的轮迹
          float nz = vnoise(vWorld.xz*0.9)*0.07 + vnoise(vWorld.xz*0.08)*0.10 + (hash21(floor(vWorld.xz*6.0)) - 0.5) * 0.05 * (1.0 - lod);
          col = vec3(0.285,0.295,0.315) * (0.88 + nz);
          float m = 0.0; vec3 mc = vec3(0.95);
          float hw = width * 0.5;
          // 路缘白线
          m = max(m, line(across, -hw + 0.6, 0.08, fw));
          m = max(m, line(across, hw - 0.6, 0.08, fw));
          float dash = step(0.5, fract(along / 9.0));
          if (lanes >= 2.0) {
            if (oneway < 0.5) {
              // 双向：中央黄色双实线 + 两侧车道虚线
              float y = max(line(across, -0.18, 0.07, fw), line(across, 0.18, 0.07, fw));
              col = mix(col, vec3(0.90,0.72,0.20), y * (1.0-lod));
              float per = max(1.0, floor(lanes/2.0));
              float lw = (hw - 0.6) / per;
              for (int i = 1; i < 4; i++) {
                if (float(i) >= per) break;
                m = max(m, dash * line(abs(across), float(i)*lw, 0.07, fw));
              }
            } else {
              float lw = (width - 1.2) / lanes;
              for (int i = 1; i < 6; i++) {
                if (float(i) >= lanes) break;
                m = max(m, dash * line(across, -hw + 0.6 + float(i)*lw, 0.07, fw));
                // 轮迹
              }
              float lanePos = fract((across + hw - 0.6) / lw);
              col *= 1.0 + 0.05 * (1.0 - lod) * (smoothstep(0.15, 0.3, lanePos) - smoothstep(0.7, 0.85, lanePos));
            }
          }
          col = mix(col, mc, m * (1.0 - lod) * 0.9);
        }
        vec3 n = vec3(0.0, 1.0, 0.0);
        gShadow = sunShadow(vWorld, n);
        float lum0 = dot(col, vec3(0.333));
        col = lightIt(col, n);
        if (uNight > 0.0) {
          // 路灯光斑：沿路每 32m 一团暖光
          float pool = exp(-pow((mod(along + 16.0, 32.0) - 16.0) / 10.0, 2.0));
          col += uNight * vec3(1.0, 0.72, 0.38) * (0.09 + 0.34 * pool) * (0.5 + lum0 * 1.6);
          if (ped < 0.5) {
            // 路面反光：朝相机方向拉长的霓虹倒影（青 / 品红 / 琥珀），掠射角越小越亮
            vec3 Vd = normalize(vWorld - cameraPosition);
            vec2 vd = normalize(Vd.xz + vec2(1e-5));
            float s = dot(vWorld.xz, vec2(-vd.y, vd.x)) * 0.10;
            float hc = hash11(floor(s) + 3.0);
            float streak = smoothstep(0.50, 1.0, vnoise(vec2(s, dot(vWorld.xz, vd) * 0.018))) * smoothstep(0.0, 0.25, fract(s)) * (1.0 - smoothstep(0.75, 1.0, fract(s)));
            vec3 neon = hc < 0.16 ? vec3(0.10, 0.80, 1.0) : (hc < 0.30 ? vec3(1.0, 0.25, 0.20) : vec3(1.0, 0.66, 0.24));
            float fres = pow(1.0 - max(-Vd.y, 0.0), 5.0);
            col += uNight * neon * streak * fres * 0.55;
          }
        }
        gl_FragColor = vec4(atmo(col, vWorld), 1.0);
      }`})}function Pd(e,t){return new co({uniforms:_d({uMap:{value:e},uRect:{value:new Yt(t.x0,t.z0,t.x1-t.x0,t.z1-t.z0)}}),vertexShader:`
      varying vec3 vWorld; varying vec3 vN;
      void main(){
        vN = normal;
        vec4 wp = modelMatrix * vec4(position,1.0); vWorld = wp.xyz;
        gl_Position = projectionMatrix * viewMatrix * wp;
      }`,fragmentShader:`
      ${bd}
      uniform sampler2D uMap; uniform vec4 uRect;
      varying vec3 vWorld; varying vec3 vN;
      void main(){
        vec2 uv = (vWorld.xz - uRect.xy) / uRect.zw;
        vec3 c = texture2D(uMap, vec2(uv.x, 1.0 - uv.y)).rgb;
        bool outside = uv.x < 0.0 || uv.y < 0.0 || uv.x > 1.0 || uv.y > 1.0;
        if (outside) {
          // 数据范围外：示意性的街区肌理（屋顶灰、道路、零星绿地）
          vec2 cell = floor(vWorld.xz / 70.0); vec2 f = fract(vWorld.xz / 70.0);
          float h = hash21(cell);
          vec3 blk = h < 0.3 ? vec3(0.30,0.46,0.22) : mix(vec3(0.60,0.59,0.56), vec3(0.72,0.70,0.66), hash21(cell + 3.0));
          float road = step(f.x, 0.12) + step(f.y, 0.12);
          c = mix(blk, vec3(0.36,0.37,0.39), min(road, 1.0));
          c = mix(c, vec3(0.50,0.54,0.48), smoothstep(1500.0, 5000.0, distance(vWorld.xz, cameraPosition.xz)));
        }
        vec3 n = normalize(vN);
        vec3 V = normalize(vWorld - cameraPosition);
        float dist = distance(vWorld, cameraPosition);
        float nearF = 1.0 - smoothstep(40.0, 400.0, dist);
        float green = outside ? 0.0 : smoothstep(0.05, 0.14, c.g - max(c.r, c.b));
        float water = smoothstep(0.04, 0.10, c.b - c.g) * step(c.r, c.g);
        float lum = dot(c, vec3(0.333));
        float sat = max(c.r, max(c.g, c.b)) - min(c.r, min(c.g, c.b));
        float paved = smoothstep(0.56, 0.62, lum) * (1.0 - smoothstep(0.07, 0.12, sat));
        // 草地：修剪条纹 + 多尺度斑驳 + 近处草叶颗粒
        if (green > 0.0) {
          float g1 = vnoise(vWorld.xz * 0.045), g2 = vnoise(vWorld.xz * 0.35 + 7.0), g3 = vnoise(vWorld.xz * 0.012 + 3.0);
          vec3 lush = vec3(0.22,0.39,0.14), mid = vec3(0.29,0.46,0.17), dry = vec3(0.40,0.50,0.22);
          vec3 gcol = mix(lush, mid, smoothstep(0.25, 0.75, g1));
          gcol = mix(gcol, dry, smoothstep(0.62, 0.9, g3) * 0.45);
          gcol *= 0.90 + 0.20 * g2;
          gcol *= 1.0 + nearF * ((hash21(floor(vWorld.xz * 9.0)) - 0.5) * 0.20 + (vnoise(vWorld.xz * 3.0) - 0.5) * 0.16);
          // 林地更深
          gcol *= mix(1.0, 0.78, smoothstep(0.52, 0.42, c.g));
          c = mix(c, gcol, green);
        }
        // 铺装：0.6m 方砖 + 4.8m 分仓缝 + 色差 + 污渍
        if (paved > 0.0) {
          vec2 q = vWorld.xz / 0.6;
          vec2 fw = fwidth(q);
          float lodp = clamp(max(fw.x, fw.y) * 1.5, 0.0, 1.0);
          vec2 f = fract(q);
          float joint = (1.0 - smoothstep(0.0, fw.x * 1.5 + 0.03, min(f.x, 1.0 - f.x))) + (1.0 - smoothstep(0.0, fw.y * 1.5 + 0.03, min(f.y, 1.0 - f.y)));
          float tileVar = (hash21(floor(q)) - 0.5) * 0.10;
          vec2 q2 = vWorld.xz / 4.8; vec2 f2 = fract(q2); vec2 fw2 = fwidth(q2);
          float band = (1.0 - smoothstep(0.0, fw2.x * 1.5 + 0.02, min(f2.x, 1.0 - f2.x))) + (1.0 - smoothstep(0.0, fw2.y * 1.5 + 0.02, min(f2.y, 1.0 - f2.y)));
          float lod2 = clamp(max(fw2.x, fw2.y) * 1.5, 0.0, 1.0);
          vec3 pc = c * (0.94 + 0.10 * vnoise(vWorld.xz * 0.03));
          pc *= 1.0 + (1.0 - lodp) * (tileVar - min(joint, 1.0) * 0.14);
          pc *= 1.0 - (1.0 - lod2) * min(band, 1.0) * 0.16;
          pc *= 1.0 - 0.08 * smoothstep(0.55, 1.0, vnoise(vWorld.xz * 0.07));
          c = mix(c, pc, paved);
        }
        gShadow = sunShadow(vWorld, n);
        vec3 col = lightIt(c, n);
        // 水面：反射天空 + 细波纹
        if (water > 0.0) {
          vec2 wv = vWorld.xz * 0.35;
          vec3 wn = normalize(vec3((vnoise(wv + 3.1) - 0.5) * 0.10 + (vnoise(wv * 3.7) - 0.5) * 0.05, 1.0, (vnoise(wv + 9.7) - 0.5) * 0.10 + (vnoise(wv * 3.3 + 5.0) - 0.5) * 0.05));
          vec3 R = reflect(V, wn);
          float fres = 0.06 + 0.94 * pow(1.0 - max(dot(-V, wn), 0.0), 4.0);
          vec3 deep = vec3(0.07, 0.24, 0.30) * (0.6 + 0.4 * gShadow);
          vec3 wcol = mix(deep, skyColor(R), clamp(fres + 0.12, 0.0, 1.0));
          wcol += gShadow * pow(max(dot(wn, normalize(uSunDir - V)), 0.0), 300.0) * 0.8;
          col = mix(col, wcol, water);
        }
        gl_FragColor = vec4(atmo(col, vWorld), 1.0);
      }`})}function Fd(){let e=new Uint8Array(262144),n=1234567,r=()=>(n=Math.imul(n,1664525)+1013904223>>>0,n>>>24),i=new Uint8Array(65536);for(let e=0;e<65536;e++)i[e]=r();for(let t=0;t<256;t++)for(let n=0;n<256;n++){let a=(t*256+n)*4;e[a]=i[t*256+n],e[a+1]=i[(t-17&255)*256+(n-37&255)],e[a+2]=r(),e[a+3]=255}let a=new _i(e,256,256,T);return a.wrapS=a.wrapT=t,a.minFilter=a.magFilter=s,a.needsUpdate=!0,a}function Id(e,r=2048,i=768){let a=e.capabilities.maxTextureSize;r=Math.min(r,a);let o=new Zt(r,i,{depthBuffer:!1,minFilter:s,magFilter:s,wrapS:t,wrapT:n,generateMipmaps:!1}),c=Fd(),l=new co({uniforms:{uNoise:{value:c},uSunDir:{value:fd},uHaze:{value:hd}},depthTest:!1,depthWrite:!1,vertexShader:`varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`,fragmentShader:`
      uniform sampler2D uNoise; uniform vec3 uSunDir; uniform vec3 uHaze;
      varying vec2 vUv;
      float n3(vec3 x){
        vec3 p = floor(x), f = fract(x); f = f*f*(3.0-2.0*f);
        vec2 uv = (p.xy + vec2(37.0, 17.0) * p.z) + f.xy;
        vec2 rg = texture2D(uNoise, (uv + 0.5) / 256.0).yx;
        return mix(rg.x, rg.y, f.z);
      }
      float fbm4(vec3 p){ return n3(p)*0.5 + n3(p*2.03+7.1)*0.25 + n3(p*4.11+3.3)*0.125 + n3(p*8.3+1.7)*0.0625; }
      const float CB = 1500.0, CT = 3100.0;
      // 覆盖度：大尺度成团，留出大片蓝天
      float coverage(vec2 xz){
        float a = n3(vec3(xz / 4200.0, 0.3));
        float b = n3(vec3(xz / 1600.0 + 11.0, 4.7));
        return a * 0.62 + b * 0.38;
      }
      float density(vec3 p, float cov, bool fine){
        float hgt = (p.y - CB) / (CT - CB);
        float c = smoothstep(0.54, 0.76, cov);
        if (c <= 0.0) return 0.0;
        float top = 0.28 + 0.72 * c;                 // 覆盖度高的地方云更高（云塔）
        float prof = smoothstep(0.0, 0.07, hgt) * (1.0 - smoothstep(top * 0.45, top, hgt));
        float shape = fbm4(p / 900.0 + vec3(0.0, 0.0, 2.0));
        float d = shape * (0.55 + 0.75 * c) + c * 0.38 - 0.60 - (1.0 - prof) * 0.55;
        if (fine && d > -0.1) d -= (1.0 - n3(p / 130.0)) * 0.10 + (1.0 - n3(p / 61.0)) * 0.05;
        return clamp(d * 3.2, 0.0, 1.0);
      }
      vec3 skyGrad(vec3 d){
        float y = max(d.y, 0.0);
        vec3 zen = vec3(0.085, 0.27, 0.70), mid = vec3(0.20, 0.47, 0.90), hor = vec3(0.60, 0.79, 0.97);
        vec3 c = mix(mid, zen, smoothstep(0.0, 0.75, y));
        c = mix(c, hor, pow(1.0 - y, 7.0));
        float s = max(dot(d, uSunDir), 0.0);
        c += vec3(1.0, 0.92, 0.75) * (pow(s, 6.0) * 0.08 + pow(s, 60.0) * 0.12 + pow(s, 1800.0) * 0.5);
        return c;
      }
      void main(){
        float y = vUv.y * vUv.y * 1.05 - 0.05;
        float az = (vUv.x - 0.5) * 6.28318530718;
        float ch = sqrt(max(1.0 - y * y, 0.0));
        vec3 d = vec3(cos(az) * ch, y, sin(az) * ch);
        vec3 col = skyGrad(d);
        float T = 1.0; vec3 acc = vec3(0.0);
        if (d.y > 0.012) {
          float t0 = CB / d.y, t1 = min(CT / d.y, 60000.0);
          if (t0 < 60000.0) {
            const int N = 56;
            float dt = (t1 - t0) / float(N);
            float jit = texture2D(uNoise, gl_FragCoord.xy / 256.0).b;
            float t = t0 + dt * jit;
            float mu = dot(d, uSunDir);
            float phase = 0.75 + 0.6 * pow(max(mu, 0.0), 6.0);
            for (int i = 0; i < N; i++) {
              vec3 p = d * t;
              float cov = coverage(p.xz);
              float den = density(p, cov, true);
              if (den > 0.002) {
                // 朝太阳方向取 4 个样本估算自遮挡
                float od = 0.0;
                for (int j = 1; j <= 4; j++) {
                  vec3 q = p + uSunDir * (float(j) * 150.0);
                  od += density(q, coverage(q.xz), false) * 150.0;
                }
                float hgt = clamp((p.y - CB) / (CT - CB), 0.0, 1.0);
                float sunT = exp(-od * 0.0075) * 0.80 + exp(-od * 0.0016) * 0.26;
                vec3 amb = mix(vec3(0.66, 0.72, 0.84), vec3(0.84, 0.91, 1.0), smoothstep(0.0, 0.5, hgt));
                vec3 L = vec3(1.0, 0.97, 0.92) * sunT * phase * 0.80 + amb * 0.66;
                float a = 1.0 - exp(-den * dt * 0.011);
                acc += T * a * L;
                T *= 1.0 - a;
                if (T < 0.02) break;
              }
              t += dt;
            }
            // 远处的云融进地平线
            float far = 1.0 - exp(-t0 / 26000.0);
            vec3 cl = mix(acc, (1.0 - T) * mix(uHaze, vec3(0.80, 0.88, 0.97), 0.5), far * 0.85);
            col = col * T + cl;
            T = mix(T, 1.0, far * 0.3);
          }
        }
        // 地平线：一圈淡蓝色远山 + 以下的地面霭色
        float hill = 0.012 + 0.016 * n3(vec3(az * 6.0, 1.3, 0.7)) + 0.012 * n3(vec3(az * 19.0, 4.1, 2.2));
        float hm = 1.0 - smoothstep(hill - 0.004, hill + 0.002, d.y);
        col = mix(col, mix(vec3(0.42, 0.58, 0.72), uHaze, 0.45), hm);
        col = mix(col, uHaze * vec3(0.93, 0.97, 0.97), 1.0 - smoothstep(-0.03, 0.0, d.y));
        gl_FragColor = vec4(clamp(col, 0.0, 1.0), T);
      }`}),u=new ri(new Za(2,2),l);u.frustumCulled=!1;let d=new In;d.add(u);let f=new hs(-1,1,1,-1,0,1),p=e.getRenderTarget();return e.setRenderTarget(o),e.render(d,f),e.setRenderTarget(p),l.dispose(),u.geometry.dispose(),c.dispose(),gd.uSkyMap.value=o.texture,o.texture}function Ld(){let e=new ri(new Qa(3e4,48,24),new co({side:1,depthWrite:!1,uniforms:_d(),vertexShader:`varying vec3 vDir; void main(){ vDir = position; vec4 p = projectionMatrix * viewMatrix * vec4(position + cameraPosition, 1.0); gl_Position = p.xyww; }`,fragmentShader:`
      ${bd}
      varying vec3 vDir;
      void main(){
        vec3 d = normalize(vDir);
        vec4 s = skyTex(d);
        vec3 c = s.rgb;
        float sd = max(dot(d, uSunDir), 0.0);
        // 白天是太阳，夜里同一位置是月亮；夜里再加星星（被云和光污染压掉一部分）
        c += mix(vec3(1.0, 0.96, 0.85), vec3(0.85, 0.90, 1.0) * 0.9, uNight) * smoothstep(mix(0.99985, 0.99975, uNight), 0.99995, sd) * s.a;
        vec3 q = floor(d * 520.0);
        float st = step(0.9990, hash21(q.xy + q.z * 17.0)) * smoothstep(0.10, 0.5, d.y) * s.a;
        c += uNight * st * vec3(0.8, 0.85, 1.0) * (0.35 + 0.5 * hash21(q.xy + 3.0));
        gl_FragColor = vec4(c, 1.0);
      }`}));return e.frustumCulled=!1,e.renderOrder=-10,e}function Rd(){return new co({uniforms:_d(),vertexShader:`
      attribute vec4 aInfo;
      varying vec2 vUv;
      varying vec4 vInfo;
      varying vec3 vN;
      varying vec3 vWorld;
      void main(){
        vUv = uv; vInfo = aInfo; vN = normal;
        vec4 wp = modelMatrix * vec4(position,1.0);
        vWorld = wp.xyz;
        gl_Position = projectionMatrix * viewMatrix * wp;
      }`,fragmentShader:`
      ${bd}
      varying vec2 vUv;
      varying vec4 vInfo;
      varying vec3 vN;
      varying vec3 vWorld;

      // 抗锯齿矩形窗遮罩：cell 尺寸、窗占比、偏移(0..1)
      float box2(vec2 f, vec2 lo, vec2 hi, vec2 fw){
        vec2 m = smoothstep(lo - fw, lo + fw, f) * (1.0 - smoothstep(hi - fw, hi + fw, f));
        return m.x * m.y;
      }
      float grid(vec2 p, vec2 cell, vec2 win, out vec2 id){
        vec2 q = p / cell; id = floor(q); vec2 f = fract(q);
        vec2 fw = fwidth(q) * 1.2 + 1e-4;
        vec2 lo = (1.0 - win) * 0.5;
        return box2(f, lo, 1.0 - lo, fw);
      }
      // 细线：周期 per，线宽 w（米）
      float lines(float x, float per, float w){
        float f = fract(x / per) * per;
        float fw = fwidth(x) * 1.0 + 1e-4;
        return 1.0 - smoothstep(w - fw, w + fw, min(f, per - f) * 2.0);
      }
      vec3 glassTint(float t){
        if (t < 0.26) return vec3(0.10,0.26,0.48);   // 蓝
        if (t < 0.44) return vec3(0.10,0.32,0.40);   // 青绿
        if (t < 0.58) return vec3(0.26,0.34,0.44);   // 银蓝
        if (t < 0.66) return vec3(0.27,0.24,0.20);   // 茶色
        if (t < 0.78) return vec3(0.08,0.13,0.20);   // 深蓝灰
        return vec3(0.20,0.40,0.52);                 // 浅蓝绿
      }
      float gLodF = 1.0;
      // 玻璃：每块玻璃略微不平（反射在分格处错开），反射烘焙天空里的蓝天白云和假的对面楼群
      vec3 glassShade(vec3 tint, vec3 n, vec3 V, vec2 id, float seed, float strength){
        vec2 j = (vec2(hash21(id + seed*17.0), hash21(id*1.7 + seed*5.0)) - 0.5) * 0.05 * gLodF;
        vec3 t1 = normalize(vec3(-n.z, 0.0, n.x) + vec3(1e-4, 0.0, 0.0));
        vec3 np = normalize(n + t1 * j.x + vec3(0.0, j.y, 0.0));
        vec3 R = reflect(V, np);
        vec3 refl = envRefl(R, vWorld.y);
        float fres = pow(1.0 - max(dot(-V, n), 0.0), 4.0);
        float var = (hash21(id + seed*17.0) - 0.5) * 0.07 * gLodF;
        // 内部：部分窗拉了浅色窗帘（远处淡化，防止噪点）
        float blind = step(0.82, hash21(id*1.31 + seed*3.0)) * 0.10 * gLodF;
        float ndl = max(dot(n, uSunDir), 0.0) * gShadow;
        vec3 g = (tint + var + blind) * (0.62 + 0.75 * ndl);
        // 夜景：窗内灯光（远处淡化成平均亮度，防止闪烁）
        vec3 wl = uNight * mix(vec3(0.18, 0.11, 0.045), winLight(id, seed), gLodF) * 1.1;
        // 玻璃染色也会染反射
        vec3 rc = refl * mix(vec3(1.0), tint * 1.6 + 0.35, 0.45);
        return mix(g, rc, clamp((0.42 + fres * 0.55) * strength, 0.0, 1.0) * (1.0 - 0.6 * uNight)) + wl;
      }

      void main(){
        int kind = int(vInfo.x + 0.5);
        float seed = vInfo.y;
        float H = vInfo.z;
        vec3 n = normalize(vN);
        vec3 V = normalize(vWorld - cameraPosition);
        vec3 col;
        float spec = 0.0;
        bool isRoof = n.y > 0.5;
        vec2 p = vUv;
        float lod = clamp(length(fwidth(p)) * 0.7, 0.0, 1.0); // 远处淡化细节
        float lodF = 1.0 - lod;
        gLodF = clamp(1.0 - lod * 2.5, 0.0, 1.0);
        float h1 = hash11(seed*13.0), h2 = hash11(seed*29.0), h3 = hash11(seed*47.0);
        gShadow = sunShadow(vWorld, n);

        if (isRoof) {
          vec3 rc = mix(vec3(0.50,0.50,0.49), vec3(0.62,0.60,0.57), seed);
          if (kind == 2) {
            // 城中村屋面：水泥、隔热砖、杂物
            rc = mix(vec3(0.56,0.52,0.47), vec3(0.45,0.44,0.43), h1);
            if (h2 > 0.7) rc = vec3(0.62,0.40,0.32);  // 红色隔热砖
            vec2 t = fract(vWorld.xz / 0.5);
            rc *= 1.0 - 0.08 * lodF * (step(0.9, t.x) + step(0.9, t.y));
          }
          if (kind == 0) rc = mix(vec3(0.34,0.37,0.40), vec3(0.52,0.53,0.54), h2);
          if (kind == 5) rc = vec3(0.46,0.47,0.48);
          if (kind == 1) rc = mix(vec3(0.55,0.55,0.53), vec3(0.42,0.47,0.44), step(0.75, h3)); // 少数屋顶绿化
          float nz = vnoise(vWorld.xz*0.35)*0.12 + vnoise(vWorld.xz*0.05)*0.1;
          float box = step(0.86, hash21(floor(vWorld.xz/3.5)+seed*13.0));
          col = rc * (0.92 + nz) * (1.0 - box*0.16*lodF);
          col = lightIt(col, n);
        } else {
          vec3 wall, glass; vec2 id; float w;
          bool parapet = p.y > H + 0.05;
          if (kind == 0) {
            // ---------- 写字楼：5 种幕墙 ----------
            int style = int(h1 * 5.0);
            float floorH = 3.9 + floor(h2 * 3.0) * 0.2;
            glass = glassTint(hash11(seed*37.0));
            wall = mix(vec3(0.66,0.68,0.70), vec3(0.84,0.83,0.80), h3);
            float fl = fract(p.y / floorH);
            vec2 cid = vec2(floor(p.x / 1.5), floor(p.y / floorH));
            vec3 g = glassShade(glass, n, V, cid, seed, 1.0);
            vec3 frame = lightIt(wall, n);
            float spandrel = smoothstep(0.80, 0.82, fl);
            if (style == 0) {
              // 单元式玻璃幕墙：细竖梃 + 层间深色窗槛
              float mull = lines(p.x, 1.5, 0.10) * lodF;
              col = mix(g, g * 0.65 + glass * 0.2, spandrel * lodF);
              col = mix(col, frame * 0.85, mull * 0.8);
              col = mix(col, frame * 0.7, lines(p.y, floorH, 0.12) * lodF * 0.6);
              spec = 1.0;
            } else if (style == 1) {
              // 竖向石材/铝板线条（福田大量 2000 年代塔楼）
              float per = 3.0 + floor(h3 * 2.0);
              float pier = 1.0 - smoothstep(0.0, fwidth(p.x)*1.5 + 0.02, abs(fract(p.x / per) - 0.5) * per - (per*0.5 - 0.35 - h2*0.4));
              pier = clamp(pier, 0.0, 1.0);
              col = mix(g, g * 0.7, spandrel * 0.6 * lodF);
              col = mix(col, frame, mix(pier, 0.35, lod));
              spec = 0.7;
            } else if (style == 2) {
              // 横向带窗：铝板窗槛 + 通长玻璃
              float band = smoothstep(0.62, 0.64, fl) ;
              col = mix(g, frame * 0.95, mix(band, 0.35, lod));
              col = mix(col, frame * 0.8, lines(p.x, 1.8, 0.07) * lodF * (1.0 - band));
              spec = 0.6;
            } else if (style == 3) {
              // 花岗岩方窗（九十年代深南大道老写字楼）
              wall = mix(vec3(0.72,0.64,0.58), vec3(0.62,0.62,0.62), h3);
              w = grid(p, vec2(3.0, floorH), vec2(0.58, 0.55), id);
              vec3 base = lightIt(wall * (0.95 + vnoise(p*0.7)*0.08), n);
              col = mix(base, glassShade(glass, n, V, id, seed, 0.8), mix(w, 0.35, lod));
              spec = 0.3;
            } else {
              // 双层幕墙：密竖梃 + 隔层深色横带
              float mull = lines(p.x, 1.2, 0.07) * lodF;
              float b2 = step(0.5, fract(p.y / (floorH * 2.0)));
              col = mix(g, g * (0.85 + 0.1 * b2), 0.5);
              col = mix(col, frame * 0.9, mull * 0.7);
              col = mix(col, frame * 0.6, lines(p.y, floorH, 0.2) * lodF * 0.7);
              spec = 1.0;
            }
            // 避难层/设备层：每 15 层一道百叶带
            if (H > 90.0) {
              float rf = floorH * 15.0;
              float ry = p.y - floor(p.y / rf) * rf;
              if (p.y > rf * 0.9 && ry < floorH) {
                float louv = 0.88 + 0.12 * lines(p.y, 0.35, 0.12) * lodF;
                col = mix(col, lightIt(mix(wall, vec3(0.70,0.72,0.74), 0.5), n) * louv, 0.75);
              }
            }
            // 大堂：底部两层通高玻璃 + 雨棚
            if (p.y < 8.0) {
              vec3 lob = glassShade(vec3(0.20,0.24,0.26), n, V, vec2(floor(p.x/3.0), 0.0), seed, 0.5) + 0.04;
              lob = mix(lob, frame * 0.8, lines(p.x, 3.0, 0.18) * lodF);
              col = mix(col, lob, 0.85);
              if (p.y > 7.2) col = lightIt(wall * 0.85, n);
            }
            if (parapet) col = mix(col, frame * 0.92, 0.25);
          } else if (kind == 1) {
            // ---------- 住宅：3 种 ----------
            int style = int(h1 * 3.0);
            float t = hash11(seed*11.0);
            wall = t < 0.25 ? vec3(0.88,0.86,0.80) : (t < 0.45 ? vec3(0.84,0.78,0.70) : (t < 0.6 ? vec3(0.78,0.70,0.64) : (t < 0.8 ? vec3(0.76,0.78,0.80) : vec3(0.86,0.82,0.74))));
            vec3 accent = h2 < 0.4 ? vec3(0.62,0.48,0.40) : (h2 < 0.7 ? vec3(0.55,0.57,0.60) : vec3(0.72,0.62,0.48));
            glass = vec3(0.20,0.25,0.30);
            float floorH = 2.95;
            float fl = fract(p.y / floorH);
            vec3 base = lightIt(wall, n);
            if (style == 0) {
              w = grid(p, vec2(3.3, floorH), vec2(0.55, 0.55), id);
              col = mix(base, glassShade(glass, n, V, id, seed, 0.4), mix(w, 0.35, lod));
              // 阳台：白色栏板横带 + 每两开间一个
              float bal = (1.0 - smoothstep(0.20, 0.23, fl)) * step(0.5, fract(p.x / 6.6 + seed));
              col = mix(col, base * 1.05, bal * lodF);
              col = mix(col, base * 0.55, (smoothstep(0.20,0.23,fl) - smoothstep(0.26,0.29,fl)) * step(0.5, fract(p.x / 6.6 + seed)) * lodF);
            } else if (style == 1) {
              // 飘窗 + 竖向色带
              w = grid(p, vec2(2.8, floorH), vec2(0.72, 0.62), id);
              col = mix(base, glassShade(glass, n, V, id, seed, 0.5), mix(w, 0.45, lod));
              float acc = step(0.86, fract(p.x / 11.2 + seed));
              col = mix(col, lightIt(accent, n), acc);
              // 空调百叶
              float ac = step(0.5, fract(p.x/5.6 + seed*2.0)) * (1.0 - step(0.18, fl)) * lodF;
              col = mix(col, base * (0.75 + 0.25 * lines(p.y, 0.15, 0.06)), ac * 0.7);
            } else {
              // 玻璃栏板阳台（新住宅）
              w = grid(p, vec2(3.9, floorH), vec2(0.82, 0.70), id);
              col = mix(base, glassShade(glass + 0.05, n, V, id, seed, 0.7), mix(w, 0.5, lod));
              float slab = 1.0 - smoothstep(0.08, 0.11, fl);
              col = mix(col, lightIt(vec3(0.9), n), slab * lodF);
            }
            col *= 1.0 - 0.06 * smoothstep(0.55, 1.0, vnoise(vec2(p.x*0.6, p.y*0.05))); // 雨渍
            // 底商
            if (p.y < 5.0) {
              vec3 shop = glassShade(vec3(0.18,0.20,0.22), n, V, vec2(floor(p.x/4.0),0.0), seed, 0.4) + 0.05;
              col = mix(col, shop, 0.8);
              if (p.y > 4.0) col = lightIt(accent * 0.9, n);
            }
            // 屋顶构架
            if (p.y > H - 4.0 && !parapet) col = mix(col, lightIt(accent, n), 0.35);
            if (parapet) col = lightIt(accent * 1.05, n);
            spec = 0.2;
          } else if (kind == 2) {
            // ---------- 城中村握手楼 ----------
            float t = hash11(seed*23.0);
            wall = t < 0.18 ? vec3(0.90,0.89,0.84) : (t < 0.32 ? vec3(0.82,0.70,0.58) : (t < 0.46 ? vec3(0.74,0.74,0.71) :
                   (t < 0.58 ? vec3(0.86,0.72,0.70) : (t < 0.70 ? vec3(0.70,0.78,0.78) : (t < 0.80 ? vec3(0.88,0.82,0.62) : (t < 0.9 ? vec3(0.66,0.60,0.56) : vec3(0.80,0.84,0.88)))))));
            // 不同楼层翻新的杂色瓷砖
            float patchSel = step(0.72, hash21(vec2(floor(p.y/9.0), seed*5.0)));
            wall = mix(wall, wall.zxy * 0.95, patchSel * 0.6);
            // 马赛克小瓷砖
            vec2 tf = fract(p / vec2(0.12, 0.12));
            float joint = step(0.86, max(tf.x, tf.y)) * (1.0 - clamp(lod*3.0, 0.0, 1.0));
            wall *= (0.92 + vnoise(p*vec2(0.5,0.8))*0.14) * (1.0 - joint*0.08);
            glass = vec3(0.14,0.16,0.18);
            float floorH = 2.9 + h2 * 0.3;
            vec2 q = p + vec2(seed*7.0, 0.0);
            vec2 cell = vec2(2.2 + h3 * 0.8, floorH);
            w = grid(q, cell, vec2(0.52, 0.50), id);
            float has = step(0.12, hash21(id + seed*31.0));
            w *= has;
            vec2 cf = fract(q / cell);
            vec3 base = lightIt(wall, n);
            // 窗内：深色 + 偶尔亮
            vec3 win = glass + step(0.85, hash21(id*2.3+seed)) * vec3(0.10,0.09,0.06) + uNight * winLight(id, seed + 2.0) * 0.9;
            col = mix(base, win, mix(w, 0.3, lod));
            // 防盗网：不锈钢方格框，比窗略大
            float cage = box2(cf, vec2(0.2, 0.18), vec2(0.8, 0.80), fwidth(q/cell)*1.2+1e-4) * has * step(0.3, hash21(id*0.7 + seed*3.3));
            float bars = max(lines(q.x, 0.13, 0.025), lines(q.y, 0.45, 0.04));
            float cageEdge = cage * (1.0 - box2(cf, vec2(0.23,0.21), vec2(0.77,0.77), fwidth(q/cell)*1.2+1e-4));
            col = mix(col, lightIt(vec3(0.72,0.73,0.74), n), clamp(cage * bars * 0.85 + cageEdge, 0.0, 1.0) * lodF);
            // 晾衣：防盗网下沿挂的彩色衣物
            float hang = step(0.62, hash21(id*3.7 + seed*1.3)) * cage;
            float cloth = step(0.22, cf.y) * (1.0 - step(0.42, cf.y)) * step(0.5, fract(q.x * 2.3 + hash21(id)*3.0));
            vec3 cc = vec3(hash21(id+1.0), hash21(id+2.0), hash21(id+3.0)) * 0.7 + 0.25;
            col = mix(col, lightIt(cc, n), hang * cloth * lodF);
            // 空调外机（窗旁小白块）
            float ac = step(0.55, hash21(id*1.7 + seed)) * box2(cf, vec2(0.80, 0.08), vec2(0.98, 0.30), fwidth(q/cell)*1.2+1e-4);
            col = mix(col, lightIt(vec3(0.86,0.86,0.84), n) * (0.85 + 0.15*lines(q.y, 0.05, 0.02)), ac * lodF);
            // 外露管线
            col = mix(col, base * 0.6, lines(q.x + 1.1, cell.x * 3.0, 0.08) * lodF * step(0.5, h1));
            // 雨水污渍 / 黑色水痕
            col *= 1.0 - 0.18 * smoothstep(0.55, 1.0, vnoise(vec2(p.x*0.9, p.y*0.06 + seed*10.0)));
            // 底层：卷帘门 + 招牌
            if (p.y < 3.6) {
              float shutter = step(0.35, hash21(vec2(floor(p.x/3.2), seed)));
              vec3 sh = shutter > 0.5 ? vec3(0.55,0.57,0.58) * (0.85 + 0.15 * lines(p.y, 0.12, 0.05)) : vec3(0.12,0.11,0.10) + vec3(0.25,0.20,0.12) * step(0.6, hash21(vec2(floor(p.x), 3.0)));
              col = lightIt(sh, n);
            } else if (p.y < 4.6) {
              float si = hash21(vec2(floor(p.x / 4.5), seed * 9.0));
              vec3 sc = si < 0.3 ? vec3(0.78,0.12,0.10) : (si < 0.5 ? vec3(0.95,0.78,0.15) : (si < 0.7 ? vec3(0.12,0.35,0.70) : (si < 0.85 ? vec3(0.10,0.55,0.30) : vec3(0.92,0.92,0.90))));
              float txt = step(0.55, hash21(floor(p * vec2(1.6, 2.5)) + seed)) * box2(fract(vec2(p.x/4.5, (p.y-3.6))), vec2(0.1, 0.2), vec2(0.9, 0.8), vec2(0.02));
              col = lightIt(mix(sc, vec3(1.0) - sc * 0.6, txt * lodF), n);
            }
            if (parapet) col = base * 0.92;
            spec = 0.05;
          } else if (kind == 4) {
            wall = mix(vec3(0.88,0.86,0.80), vec3(0.85,0.80,0.72), seed);
            glass = vec3(0.25,0.30,0.34);
            float floorH = 3.6;
            w = grid(p, vec2(3.6, floorH), vec2(0.70, 0.45), id);
            vec3 base = lightIt(wall, n);
            col = mix(base, glassShade(glass, n, V, id, seed, 0.4), mix(w, 0.35, lod));
            float stripe = step(0.9, fract(p.y/floorH)) * step(0.5, h3);
            col = mix(col, lightIt(vec3(0.72,0.36,0.25), n), stripe*lodF);
            spec = 0.1;
          } else if (kind == 5) {
            // 屋顶机房：百叶 + 金属板
            wall = mix(vec3(0.62,0.63,0.64), vec3(0.74,0.74,0.72), h2);
            col = lightIt(wall * (0.82 + 0.18 * lines(p.y, 0.3, 0.12)), n);
            col = mix(col, col * 0.8, lines(p.x, 2.4, 0.08) * lodF);
            spec = 0.3;
          } else if (kind == 6) {
            // 塔冠：铝合金竖向格栅，透出背后天空
            float fin = lines(p.x, 1.2, 0.35);
            vec3 sky = skyColor(normalize(vec3(V.x, 0.25, V.z)));
            col = mix(sky * 0.85, lightIt(vec3(0.80,0.82,0.84), n), mix(fin, 0.6, lod));
            col = mix(col, lightIt(vec3(0.70), n), lines(p.y, 3.0, 0.25) * lodF);
            spec = 0.8;
          } else {
            // ---------- 商业 / 裙楼：3 种 ----------
            int style = int(h1 * 3.0);
            float t = hash11(seed*13.0);
            wall = t < 0.35 ? vec3(0.74,0.71,0.66) : (t < 0.6 ? vec3(0.60,0.61,0.62) : (t < 0.8 ? vec3(0.80,0.76,0.68) : vec3(0.52,0.50,0.48)));
            glass = glassTint(hash11(seed*5.0));
            float floorH = 4.5;
            float fl = fract(p.y / floorH);
            vec3 base = lightIt(wall, n);
            if (style == 0) {
              float band = smoothstep(0.30, 0.33, fl) * (1.0 - smoothstep(0.86, 0.89, fl));
              float mull = 1.0 - 0.6 * lines(p.x, 2.0, 0.12) * lodF;
              col = mix(base, glassShade(glass, n, V, vec2(floor(p.x/2.0), floor(p.y/floorH)), seed, 0.8), mix(band * mull, 0.45, lod));
            } else if (style == 1) {
              // 整片玻璃盒子
              col = glassShade(glass, n, V, vec2(floor(p.x/1.8), floor(p.y/floorH)), seed, 1.0);
              col = mix(col, base, max(lines(p.x, 1.8, 0.08), lines(p.y, floorH, 0.25)) * lodF * 0.8);
              spec = 0.6;
            } else {
              // 金属板 + 竖条窗
              col = base * (0.95 + 0.05 * lines(p.y, 1.2, 0.04));
              w = grid(p, vec2(2.4, floorH), vec2(0.28, 0.75), id);
              col = mix(col, glassShade(glass, n, V, id, seed, 0.6), mix(w, 0.2, lod));
            }
            // 商铺橱窗 + 招牌带
            if (p.y < 5.0) {
              col = glassShade(vec3(0.20,0.22,0.24), n, V, vec2(floor(p.x/5.0), 0.0), seed, 0.4) + vec3(0.10,0.08,0.05) * step(0.5, hash21(vec2(floor(p.x/5.0), seed)));
              col = mix(col, base * 0.7, lines(p.x, 5.0, 0.3) * lodF);
            } else if (p.y < 6.4 && h3 > 0.35) {
              float si = hash21(vec2(floor(p.x / 9.0), seed * 9.0));
              vec3 sc = si < 0.3 ? vec3(0.80,0.15,0.12) : (si < 0.55 ? vec3(0.20,0.22,0.25) : (si < 0.8 ? vec3(0.10,0.30,0.62) : vec3(0.95,0.95,0.92)));
              col = lightIt(sc, n);
            }
            if (parapet) col = base * 0.95;
            spec = max(spec, 0.35);
          }
          // 底部 AO
          col *= 0.74 + 0.26 * smoothstep(0.0, 5.0, p.y);
          // 夜景：路灯把底下几层照暖；非写字楼的底商亮着灯
          col += uNight * vec3(0.28, 0.18, 0.08) * exp(-max(p.y, 0.0) / 10.0) * 0.8;
          if (kind != 0 && p.y < 4.2 && p.y > 0.4) col += uNight * step(0.35, hash21(vec2(floor(p.x / 4.0), seed * 7.0))) * vec3(0.55, 0.42, 0.24) * lodF;
          // 太阳高光
          vec3 Hh = normalize(uSunDir - V);
          col += spec * gShadow * pow(max(dot(n, Hh), 0.0), 60.0) * 0.45;
        }
        gl_FragColor = vec4(atmo(col, vWorld), 1.0);
      }`})}var zd=400;function Bd(e){let t=[];for(let n=0;n<e.length;n+=2)t.push(new q(e[n],e[n+1]));return t}function Vd(e){let t=Math.sin(e*127.1+311.7)*43758.5453;return t-Math.floor(t)}function Hd(e,t,n,r){return e.map(e=>new q(t+(e.x-t)*r,n+(e.y-n)*r))}function Ud(e,t){return e.every(e=>tf(e.x,e.y,t))}function Wd(e,t=new Set,n={}){let r=new Map,i=[],a={village:[],roofs:[]},o=-1;for(let s of e.buildings){if(o++,t&&t.has(o)||n.only&&!n.only.has(o))continue;let[e,c,l,u,d,f]=s,p=Bd(d[0]);if(p.length<3)continue;let m=d.slice(1).map(Bd).filter(e=>e.length>=3),h=1/0,g=0,_=0,v=1/0,y=-1/0,b=1/0,x=-1/0;for(let e of p)h=Math.min(h,$(e.x,e.y)),g+=e.x,_+=e.y,v=Math.min(v,e.x),y=Math.max(y,e.x),b=Math.min(b,e.y),x=Math.max(x,e.y);g/=p.length,_/=p.length;let S=Math.abs(qa.area(p)),C=h+l-(l>0?0:1.5),w=[],T=[],E=[],D=[],O=[],k=(e,t,n,r,i,a,o)=>{let s=0,c=e.length;for(let l=0;l<c;l++){let d=e[l],f=e[(l+1)%c],p=f.x-d.x,m=f.y-d.y,g=Math.hypot(p,m);if(g<.01)continue;let _=m/g,v=-p/g;t&&(_=-_,v=-v),o&&(_=-_,v=-v);let y=w.length/3;w.push(d.x,n,d.y,f.x,n,f.y,f.x,r,f.y,d.x,r,d.y);for(let e=0;e<4;e++)T.push(_,0,v),D.push(i,u,a,0);let b=n-h,x=r-h;E.push(s,b,s+g,b,s+g,x,s,x),!t==!!o?O.push(y,y+1,y+2,y,y+2,y+3):O.push(y,y+2,y+1,y,y+3,y+2),s+=g}},A=(e,t,n,r,i)=>{try{let a=qa.triangulateShape(e,t),o=e.concat(...t),s=w.length/3;for(let e of o)w.push(e.x,n,e.y),T.push(0,1,0),E.push(e.x,e.y),D.push(r,u,i,1);for(let e of a)O.push(s+e[0],s+e[2],s+e[1])}catch{}},j=(e,t,n,r,i,a)=>{let o=qa.area(e)<0,s=h+r;k(e,o,n,s+a,i,r,!1);for(let e of t)k(e,qa.area(e)>0,n,s+a,i,r,!1);a>.3&&k(e,o,s,s+a,i,r,!0),A(e,t,s,i,r)},M=Vd(u*91.7),ee=Vd(u*53.3),N=Vd(u*17.9),P=[],F=c,te=p;if(e===0&&c>=60&&l===0&&S>700&&!m.length){let e=p,t=0;if(M<.7&&S>1100){let n=.74+ee*.12,r=Hd(p,g,_,n);Ud(r,p)&&(t=14+Math.floor(N*4)*4.5,j(p,[],C,t,3,1.2),P.push([p,C,h+t]),e=r)}let n=Math.floor(N*4),r=t>0?h+t-.5:C;if(n===0&&c>100){let t=c*(.86+M*.06),n=Hd(e,g,_,.86);j(e,[],r,t,0,1),j(n,[],h+t-.3,c,0,2.5),P.push([e,r,h+t],[n,h+t,h+c]),te=n}else if(n===1){j(e,[],r,c,0,.8);let t=6+ee*8;k(e,qa.area(e)<0,h+c,h+c+t,6,c+t+1,!1),k(e,qa.area(e)<0,h+c,h+c+t,6,c+t+1,!0),P.push([e,r,h+c]),te=e}else j(e,[],r,c,0,n===3?3.5:1.4),P.push([e,r,h+c]),te=e;F=c,(n===2||n===0)&&j(Hd(te,g,_,.42+ee*.15),[],h+F-.2,F+4+M*4,5,0)}else if(e===1&&c>=30&&!m.length)j(p,m,C,c,1,1.2),P.push([p,C,h+c]),j(Hd(p,g,_,.3+ee*.12),[],h+c-.2,c+3.5,5,0);else if(e===2){if(j(p,m,C,c,2,1.1),P.push([p,C,h+c]),a.village.push({ring:p,base:h,h:c,seed:u,cx:g,cz:_,area:S}),S>60&&M<.75){let e=p[Math.floor(ee*p.length)],t=Hd(p,g+(e.x-g)*.5,_+(e.y-_)*.5,.32);Ud(t,p)&&j(t,[],h+c-.2,c+2.8,2,.4)}}else if(j(p,m,C,c,e,e===3&&c>15?1.4:1),P.push([p,C,h+c]),e===3&&S>1500&&M<.6){let e=Hd(p,g,_,.35);Ud(e,p)&&j(e,[],h+c-.2,c+4,5,0)}e!==2&&c>12&&a.roofs.push({ring:te,base:h,h:F,seed:u,cx:g,cz:_,kind:e});let I=new kr;I.setAttribute(`position`,new Z(w,3)),I.setAttribute(`normal`,new Z(T,3)),I.setAttribute(`uv`,new Z(E,2)),I.setAttribute(`aInfo`,new Z(D,4)),I.setIndex(O),Gd(I);let ne=n.keyOf?n.keyOf.get(o):Math.floor(g/zd)+`,`+Math.floor(_/zd);r.has(ne)||r.set(ne,[]),r.get(ne).push(I);for(let[e,t,n]of P){let r=1/0,a=-1/0,o=1/0,s=-1/0;for(let t of e)r=Math.min(r,t.x),a=Math.max(a,t.x),o=Math.min(o,t.y),s=Math.max(s,t.y);i.push({rings:e===p?[p,...m]:[e],minX:r,maxX:a,minZ:o,maxZ:s,bottom:t+(l>0||t>C?0:1.5),top:n,name:f,h:c})}}let s=Rd(),c=new On,l=0,u=new Map;for(let[e,t]of r){let n=ld(t,!1);t.forEach(e=>e.dispose()),n.computeBoundingSphere(),n.computeBoundingBox(),l+=n.index.count/3;let r=new ri(n,s);r.renderOrder=5,r.userData.key=e,u.set(e,r),c.add(r)}return c.userData.tris=l,{group:c,colliders:i,material:s,details:a,byKey:u}}function Gd(e){let t=e.index.array,n=e.attributes.position.array,r=e.attributes.normal.array,i=new J,a=new J,o=new J,s=new J;for(let e=0;e<t.length;e+=3){let c=t[e],l=t[e+1],u=t[e+2];r[c*3+1]<.5||(i.fromArray(n,c*3),a.fromArray(n,l*3),o.fromArray(n,u*3),s.subVectors(a,i).cross(o.clone().sub(i)),s.y<0&&(t[e+1]=u,t[e+2]=l))}}var Kd=new Map;function qd(e){let t=e.roadClasses,n=new Set([`pedestrian`,`footway`,`path`,`steps`,`track`]),r=new Set([`cycleway`]),i=new Set([`motorway`,`trunk`,`primary`,`secondary`]),a={ped:[[],[],[],[],[]],minor:[[],[],[],[],[]],major:[[],[],[],[],[]],bridge:[[],[],[],[],[]]},o={P:[],N:[],I:[]},s=[],c=0,l=0,u=(e,t)=>Math.round(e*2)+`,`+Math.round(t*2),d=new Map;for(let i of e.roads){if(!i[5]||n.has(t[i[0]])||r.has(t[i[0]]))continue;let e=i[4];for(let t of[u(e[0],e[1]),u(e[e.length-2],e[e.length-1])])d.set(t,(d.get(t)||0)+1)}let f=(e,t,n,r,i,a,s)=>{let{P:c,N:l,I:u}=o,d=c.length/3;c.push(...e,...t,...n,...r);for(let e=0;e<4;e++)l.push(i,a,s);u.push(d,d+1,d+2,d,d+2,d+3,d,d+2,d+1,d,d+3,d+2)};for(let o of e.roads){let[e,p,m,h,g,_,v]=o,y=t[e],b=n.has(y)||r.has(y)?`ped`:i.has(y)?`major`:`minor`;if(b===`ped`&&_)continue;let x=n.has(y)?1:r.has(y)?2:0,S=[];for(let e=0;e<g.length;e+=2){let t=g[e],n=g[e+1];if(S.length){let[e,r]=S[S.length-1],i=Math.hypot(t-e,n-r),a=Math.floor(i/15);for(let i=1;i<a;i++)S.push([e+(t-e)*i/a,r+(n-r)*i/a])}S.push([t,n])}if(S.length<2)continue;let C=[0];for(let e=1;e<S.length;e++)C.push(C[e-1]+Math.hypot(S[e][0]-S[e-1][0],S[e][1]-S[e-1][1]));let w=C[C.length-1],T=Array(S.length).fill(0);if(_&&b!==`ped`){let e=(d.get(u(g[0],g[1]))||0)>1,t=(d.get(u(g[g.length-2],g[g.length-1]))||0)>1,n=6.5*Math.max(1,v||1),r=Math.min(110,w*.45);if(w>50||e||t){let i=e=>(e=Math.max(0,Math.min(1,e)),e*e*(3-2*e));for(let a=0;a<S.length;a++){let o=e?1:i(C[a]/r),s=t?1:i((w-C[a])/r);T[a]=n*Math.min(o,s)}b=`bridge`,l++,Kd.set(o,{acc:C,elev:T})}}let[E,D,O,k,A]=a[b],j=b===`major`||b===`bridge`?.12:b===`minor`?.09:.06,M=p/2,ee=E.length/3,N=null,P=null,F=-100;for(let e=0;e<S.length;e++){let[t,n]=S[e],r=0,i=0;if(e>0){let a=t-S[e-1][0],o=n-S[e-1][1],s=Math.hypot(a,o)||1;r+=a/s,i+=o/s}if(e<S.length-1){let a=S[e+1][0]-t,o=S[e+1][1]-n,s=Math.hypot(a,o)||1;r+=a/s,i+=o/s}let a=Math.hypot(r,i)||1;r/=a,i/=a;let o=1;if(e>0&&e<S.length-1){let a=t-S[e-1][0],s=n-S[e-1][1],c=Math.hypot(a,s)||1,l=a/c*r+s/c*i;o=Math.min(2.5,1/Math.max(.4,l))}let c=-i*M*o,l=r*M*o,u=T[e],d=$(t+c,n+l)+j+u,g=$(t-c,n-l)+j+u;if(E.push(t+c,d,n+l,t-c,g,n-l),D.push(0,1,0,0,1,0),O.push(C[e],-1,C[e],1),k.push(p,m,h,x,p,m,h,x),e>0){let t=ee+(e-1)*2;A.push(t,t+2,t+1,t+1,t+2,t+3)}if(b===`bridge`){let a=[t+c,d,n+l],o=[t-c,g,n-l];if(N&&(u>.8||T[e-1]>.8)){let e=[c/M,0,l/M];for(let[t,n,r]of[[N,a,1],[P,o,-1]])f([t[0],t[1]-1.3,t[2]],[n[0],n[1]-1.3,n[2]],[n[0],n[1]+1,n[2]],[t[0],t[1]+1,t[2]],e[0]*r,0,e[2]*r);f([N[0],N[1]-1.3,N[2]],[a[0],a[1]-1.3,a[2]],[o[0],o[1]-1.3,o[2]],[P[0],P[1]-1.3,P[2]],0,-1,0)}u>3.5&&C[e]-F>28&&(F=C[e],s.push([t,n,$(t,n),u-1.2+j,Math.atan2(r,i),p])),N=a,P=o}}c++}let p=Nd(),m=Nd();m.depthWrite=!0;let h=new On,g={ped:1,minor:2,major:3,bridge:5};for(let e of[`ped`,`minor`,`major`,`bridge`]){let[t,n,r,i,o]=a[e];if(!t.length)continue;let s=new kr;s.setAttribute(`position`,new Z(t,3)),s.setAttribute(`normal`,new Z(n,3)),s.setAttribute(`uv`,new Z(r,2)),s.setAttribute(`aRoad`,new Z(i,4)),s.setIndex(o),s.computeBoundingSphere();let c=new ri(s,e===`bridge`?m:p);c.renderOrder=g[e],e===`bridge`&&(c.userData.cast=!0),h.add(c)}let _=xd({color:12170928,side:2});if(o.P.length){let e=new kr;e.setAttribute(`position`,new Z(o.P,3)),e.setAttribute(`normal`,new Z(o.N,3)),e.setIndex(o.I),e.computeBoundingSphere();let t=new ri(e,_);t.userData.cast=!0,h.add(t)}if(s.length){let e=new ca(1,1,1);e.translate(0,.5,0);let t=new ca(1,1,1);t.translate(0,.5,0);let n=new ki(e,_,s.length),r=new ki(t,_,s.length),i=new Y,a=new At,o=new J(0,1,0);s.forEach(([e,t,s,c,l,u],d)=>{a.setFromAxisAngle(o,l),i.compose(new J(e,s,t),a,new J(Math.min(3.5,u*.25),Math.max(.5,c-1.2),1.8)),n.setMatrixAt(d,i),i.compose(new J(e,s+c-1.2,t),a,new J(u*.8,1.2,2.2)),r.setMatrixAt(d,i)}),n.userData.cast=r.userData.cast=!0,h.add(n,r)}return h.userData.count=c,h.userData.bridges=l,h}var Jd=new WeakMap;function Yd(e){let t=Jd.get(e);if(!t){let n=1/0,r=-1/0,i=1/0,a=-1/0;for(let t=0;t<e.length;t+=2)e[t]<n&&(n=e[t]),e[t]>r&&(r=e[t]),e[t+1]<i&&(i=e[t+1]),e[t+1]>a&&(a=e[t+1]);t=[n,r,i,a],Jd.set(e,t)}return t}function Xd(e){let t=e.bounds,n=t.x0-400,r=t.x1+400,i=t.z0-400,a=t.z1+400,o=Math.max(r-n,a-i),s=(n+r)/2,c=(i+a)/2;return{x0:s-o/2,x1:s+o/2,z0:c-o/2,z1:c+o/2}}function Zd(e,t,n,r={}){let i=document.createElement(`canvas`);i.width=i.height=n;let a=i.getContext(`2d`),o=n/(t.x1-t.x0),s=n/(t.z1-t.z0),c=e=>(e-t.x0)*o,l=e=>(e-t.z0)*s,u=e=>{let n=Yd(e);return n[1]>=t.x0-30&&n[0]<=t.x1+30&&n[3]>=t.z0-30&&n[2]<=t.z1+30},d=(t.x1-t.x0)/n>3,f=e.buildings.filter(e=>u(e[4][0])),p=e.areas.filter(e=>u(e[1][0])),m=e.roads.filter(e=>u(e[4]));a.fillStyle=r.base||`#4f8a35`,a.fillRect(0,0,n,n);let h=e=>{a.beginPath();for(let t of e){for(let e=0;e<t.length;e+=2){let n=c(t[e]),r=l(t[e+1]);e===0?a.moveTo(n,r):a.lineTo(n,r)}a.closePath()}},g=r.areaColors||{park:`#4c8632`,grass:`#55903a`,wood:`#3a702c`,pitch:`#4a8a3c`,water:`#2f6f96`,plaza:`#bdb7ab`,civicplaza:`#c6bfb2`},_=[`plaza`,`park`,`grass`,`pitch`,`wood`,`water`,`civicplaza`];if(r.villageAlleys!==!1){a.fillStyle=`#6e6862`,a.strokeStyle=`#6e6862`,a.lineWidth=6*o,a.lineJoin=`round`;for(let e of f)e[0]===2&&(h(e[4]),a.fill(`evenodd`),a.stroke())}if(r.aprons!==!1&&!d){a.fillStyle=`#b6b1a6`,a.strokeStyle=`#b6b1a6`,a.lineJoin=`round`;for(let e of f)e[0]!==2&&(a.lineWidth=(e[0]===0||e[0]===3?18:11)*o,h([e[4][0]]),a.fill(),a.stroke())}for(let e of _){a.fillStyle=g[e];for(let[t,n]of p)t===e&&(h(n),a.fill(`evenodd`))}if(r.plazaPattern!==!1)for(let[e,t]of p){if(e!==`civicplaza`)continue;a.save(),h(t),a.clip(`evenodd`);let n=t[0],r=1/0,i=-1/0,u=1/0,d=-1/0;for(let e=0;e<n.length;e+=2)r=Math.min(r,n[e]),i=Math.max(i,n[e]),u=Math.min(u,n[e+1]),d=Math.max(d,n[e+1]);let f=(r+i)/2;a.fillStyle=`#52903a`;for(let e=u+12;e<d-20;e+=46)for(let t of[-1,1])for(let n=0;n<4;n++){let r=f+t*(22+n*46);a.fillRect(c(Math.min(r,r+t*34)),l(e),Math.abs(34*o),30*s)}a.strokeStyle=`rgba(120,112,100,0.55)`,a.lineWidth=Math.max(1,.6*o);for(let e=Math.floor(r/12)*12;e<i;e+=12)a.beginPath(),a.moveTo(c(e),l(u)),a.lineTo(c(e),l(d)),a.stroke();for(let e=Math.floor(u/12)*12;e<d;e+=12)a.beginPath(),a.moveTo(c(r),l(e)),a.lineTo(c(i),l(e)),a.stroke();a.fillStyle=`#a69e92`,a.fillRect(c(f-9),l(u),18*o,(d-u)*s),a.restore()}let v=cd();if(r.hill!==!1){let e=a.createRadialGradient(c(v.x),l(v.z),0,c(v.x),l(v.z),570*o);e.addColorStop(0,`rgba(54,108,42,1)`),e.addColorStop(.75,`rgba(58,112,44,0.9)`),e.addColorStop(1,`rgba(70,120,52,0)`),a.fillStyle=e,a.beginPath(),a.arc(c(v.x),l(v.z),570*o,0,Math.PI*2),a.fill()}if(e.sea){let n=e.sea;a.fillStyle=g.water;let r=Math.max(0,Math.floor((t.z0-n.z0)/n.cell)),i=Math.min(n.h-1,Math.ceil((t.z1-n.z0)/n.cell));for(let e=r;e<=i;e++){let r=n.rows[e];for(let i=0;i<r.length;i+=2){let u=n.x0+r[i]*n.cell,d=u+r[i+1]*n.cell;d<t.x0||u>t.x1||a.fillRect(c(u)-.5,l(n.z0+e*n.cell)-.5,(d-u)*o+1,n.cell*s+1)}}}a.lineCap=`round`,a.lineJoin=`round`,a.strokeStyle=g.water;for(let[t,n]of e.waterLines){a.lineWidth=t*o,a.beginPath();for(let e=0;e<n.length;e+=2){let t=c(n[e]),r=l(n[e+1]);e?a.lineTo(t,r):a.moveTo(t,r)}a.stroke()}if(r.sidewalks!==!1&&!d){let t=new Set([`pedestrian`,`footway`,`path`,`steps`,`track`,`cycleway`]),n=new Set([`trunk`,`primary`,`secondary`]);a.strokeStyle=`#4f8a35`;for(let t of m){if(!n.has(e.roadClasses[t[0]]))continue;a.lineWidth=(t[1]+20)*o,a.beginPath();let r=t[4];for(let e=0;e<r.length;e+=2){let t=c(r[e]),n=l(r[e+1]);e?a.lineTo(t,n):a.moveTo(t,n)}a.stroke()}a.strokeStyle=`#d2cec6`;for(let n of m){if(t.has(e.roadClasses[n[0]]))continue;a.lineWidth=(n[1]+8.4)*o,a.beginPath();let r=n[4];for(let e=0;e<r.length;e+=2){let t=c(r[e]),n=l(r[e+1]);e?a.lineTo(t,n):a.moveTo(t,n)}a.stroke()}a.strokeStyle=r.sidewalk||`#aea89d`;for(let n of m){let r=e.roadClasses[n[0]];if(t.has(r))continue;a.lineWidth=(n[1]+7.6)*o,a.beginPath();let i=n[4];for(let e=0;e<i.length;e+=2){let t=c(i[e]),n=l(i[e+1]);e?a.lineTo(t,n):a.moveTo(t,n)}a.stroke()}}a.strokeStyle=`#5a5550`;for(let[,t]of e.rails){a.lineWidth=6*o,a.beginPath();for(let e=0;e<t.length;e+=2){let n=c(t[e]),r=l(t[e+1]);e?a.lineTo(n,r):a.moveTo(n,r)}a.stroke()}if(r.drawRoads)for(let t of m){let n=e.roadClasses[t[0]],i=[`motorway`,`trunk`,`primary`,`secondary`].includes(n),s=[`pedestrian`,`footway`,`path`,`steps`,`track`,`cycleway`].includes(n);if(s&&!r.drawPaths)continue;a.strokeStyle=i?`#f0c060`:s?`#c8c2b8`:`#e8e4dc`,a.lineWidth=Math.max(1,t[1]*o*(r.roadScale||1)),a.beginPath();let u=t[4];for(let e=0;e<u.length;e+=2){let t=c(u[e]),n=l(u[e+1]);e?a.lineTo(t,n):a.moveTo(t,n)}a.stroke()}if(r.drawBuildings){a.fillStyle=r.drawBuildings;for(let e of f)h(e[4]),a.fill(`evenodd`)}return i}var Qd=1024,$d=class{constructor(e,t,r){this.city=e,this.scene=r,this.aniso=t.capabilities.getMaxAnisotropy();let i=this.rect=Xd(e),a=Math.min(4096,t.capabilities.maxTextureSize),o=e=>{let t=new ia(e);return t.anisotropy=this.aniso,t.wrapS=t.wrapT=n,t.generateMipmaps=!0,t.minFilter=l,t};this.mk=o;let s=this.group=new On,c=new Za(9e4,9e4,1,1);c.rotateX(-Math.PI/2);let u=new ri(c,Pd(o(Zd(e,i,a)),i));u.position.y=-.6,u.renderOrder=0,s.add(u);let d=cd(),f=1520,p={x0:d.x-f/2,x1:d.x+f/2,z0:d.z-f/2,z1:d.z+f/2},m=new Za(f,f,220,220);m.rotateX(-Math.PI/2);let h=m.attributes.position;for(let e=0;e<h.count;e++){let t=h.getX(e)+d.x,n=h.getZ(e)+d.z;h.setXYZ(e,t,$(t,n)+.03,n)}m.computeVertexNormals(),m.computeBoundingSphere();let g=new ri(m,Pd(o(Zd(e,p,2048)),p));g.renderOrder=0,s.add(g),this.tiles=new Map,this.tileGeo=new Za(Qd,Qd,1,1),this.tileGeo.rotateX(-Math.PI/2),r.add(s)}update(e){let t=Math.min(3600,1700+Math.max(0,e.y)*1.2),n=Math.floor(e.x/Qd),r=Math.floor(e.z/Qd),i=Math.ceil(t/Qd),a=null,o=1/0;for(let s=n-i;s<=n+i;s++)for(let n=r-i;n<=r+i;n++){let r=s*100003+n;if(this.tiles.has(r))continue;let i=Math.hypot((s+.5)*Qd-e.x,(n+.5)*Qd-e.z);i<t+Qd*.5&&i<o&&(o=i,a=[s,n,r])}let s=0;if(a){let[e,t,n]=a,r={x0:e*Qd,x1:(e+1)*Qd,z0:t*Qd,z1:(t+1)*Qd},i=this.city.bounds,o={i:e,j:t,mesh:null};if(!(r.x1<i.x0-400||r.x0>i.x1+400||r.z1<i.z0-400||r.z0>i.z1+400)){let n=this.mk(Zd(this.city,r,1024,{hill:!1})),i=new ri(this.tileGeo,Pd(n,r));i.position.set((e+.5)*Qd,0,(t+.5)*Qd),i.renderOrder=0,this.group.add(i),o.mesh=i,o.tex=n}this.tiles.set(n,o),s=1}if(this.tiles.size>70)for(let[n,r]of this.tiles)Math.hypot((r.i+.5)*Qd-e.x,(r.j+.5)*Qd-e.z)>t+1600&&(r.mesh&&(this.group.remove(r.mesh),r.tex.dispose(),r.mesh.material.dispose()),this.tiles.delete(n));return s}};function ef(e,t,n){let r=!1,i=n.length/2;for(let a=0,o=i-1;a<i;o=a++){let i=n[a*2],s=n[a*2+1],c=n[o*2],l=n[o*2+1];s>t!=l>t&&e<(c-i)*(t-s)/(l-s)+i&&(r=!r)}return r}function tf(e,t,n){let r=!1;for(let i=0,a=n.length-1;i<n.length;a=i++){let o=n[i],s=n[a];o.y>t!=s.y>t&&e<(s.x-o.x)*(t-o.y)/(s.y-o.y)+o.x&&(r=!r)}return r}function nf(e,t,n){if(e<n.minX||e>n.maxX||t<n.minZ||t>n.maxZ||!tf(e,t,n.rings[0]))return!1;for(let r=1;r<n.rings.length;r++)if(tf(e,t,n.rings[r]))return!1;return!0}function rf(e){let t=new Map,n=new Map,r=e.clone();return af(e,r,function(e,r){t.set(r,e),n.set(e,r)}),r.traverse(function(e){if(!e.isSkinnedMesh)return;let r=e,i=t.get(e),a=i.skeleton.bones;r.skeleton=i.skeleton.clone(),r.bindMatrix.copy(i.bindMatrix),r.skeleton.bones=a.map(function(e){return n.get(e)}),r.bind(r.skeleton,r.bindMatrix)}),r}function af(e,t,n){n(e,t);for(let r=0;r<e.children.length;r++)af(e.children[r],t.children[r],n)}var of=class extends Wo{constructor(e){super(e),this.dracoLoader=null,this.ktx2Loader=null,this.meshoptDecoder=null,this.pluginCallbacks=[],this.register(function(e){return new pf(e)}),this.register(function(e){return new mf(e)}),this.register(function(e){return new hf(e)}),this.register(function(e){return new wf(e)}),this.register(function(e){return new Tf(e)}),this.register(function(e){return new Ef(e)}),this.register(function(e){return new _f(e)}),this.register(function(e){return new vf(e)}),this.register(function(e){return new yf(e)}),this.register(function(e){return new bf(e)}),this.register(function(e){return new ff(e)}),this.register(function(e){return new xf(e)}),this.register(function(e){return new gf(e)}),this.register(function(e){return new Cf(e)}),this.register(function(e){return new Sf(e)}),this.register(function(e){return new uf(e)}),this.register(function(e){return new Df(e,lf.EXT_MESHOPT_COMPRESSION)}),this.register(function(e){return new Df(e,lf.KHR_MESHOPT_COMPRESSION)}),this.register(function(e){return new Of(e)})}load(e,t,n,r){let i=this,a;if(this.resourcePath!==``)a=this.resourcePath;else if(this.path!==``){let t=vs.extractUrlBase(e);a=vs.resolveURL(t,this.path)}else a=vs.extractUrlBase(e);this.manager.itemStart(e);let o=function(t){r?r(t):console.error(t),i.manager.itemError(e),i.manager.itemEnd(e)},s=new qo(this.manager);s.setPriority(this.priority),s.setCache(this.cache),s.setPath(this.path),s.setResponseType(`arraybuffer`),s.setRequestHeader(this.requestHeader),s.setWithCredentials(this.withCredentials),s.load(e,function(n){try{i.parse(n,a,function(n){t(n),i.manager.itemEnd(e)},o)}catch(e){o(e)}},n,o)}setDRACOLoader(e){return this.dracoLoader=e,this}setKTX2Loader(e){return this.ktx2Loader=e,this}setMeshoptDecoder(e){return this.meshoptDecoder=e,this}register(e){return this.pluginCallbacks.indexOf(e)===-1&&this.pluginCallbacks.push(e),this}unregister(e){return this.pluginCallbacks.indexOf(e)!==-1&&this.pluginCallbacks.splice(this.pluginCallbacks.indexOf(e),1),this}parse(e,t,n,r){let i,a={},o={},s=new TextDecoder;if(typeof e==`string`)i=JSON.parse(e);else if(e instanceof ArrayBuffer){if(s.decode(new Uint8Array(e,0,4))===kf){try{a[lf.KHR_BINARY_GLTF]=new Mf(e)}catch(e){r&&r(e);return}i=JSON.parse(a[lf.KHR_BINARY_GLTF].content)}else i=JSON.parse(s.decode(e))}else i=e;if(i.asset===void 0||i.asset.version[0]<2){r&&r(Error(`THREE.GLTFLoader: Unsupported asset. glTF versions >=2.0 are supported.`));return}let c=new ip(i,{path:t||this.resourcePath||``,crossOrigin:this.crossOrigin,priority:this.priority,cache:this.cache,withCredentials:this.withCredentials,requestHeader:this.requestHeader,manager:this.manager,ktx2Loader:this.ktx2Loader,meshoptDecoder:this.meshoptDecoder});c.fileLoader.setRequestHeader(this.requestHeader);for(let e=0;e<this.pluginCallbacks.length;e++){let t=this.pluginCallbacks[e](c);t.name||console.error(`THREE.GLTFLoader: Invalid plugin found: missing name`),o[t.name]=t,a[t.name]=!0}if(i.extensionsUsed)for(let e=0;e<i.extensionsUsed.length;++e){let t=i.extensionsUsed[e],n=i.extensionsRequired||[];switch(t){case lf.KHR_MATERIALS_UNLIT:a[t]=new df;break;case lf.KHR_DRACO_MESH_COMPRESSION:a[t]=new Nf(i,this.dracoLoader);break;case lf.KHR_TEXTURE_TRANSFORM:a[t]=new Pf;break;case lf.KHR_MESH_QUANTIZATION:a[t]=new Ff;break;default:n.indexOf(t)>=0&&o[t]===void 0&&console.warn(`THREE.GLTFLoader: Unknown extension "`+t+`".`)}}c.setExtensions(a),c.setPlugins(o),c.parse(n,r)}parseAsync(e,t){let n=this;return new Promise(function(r,i){n.parse(e,t,r,i)})}};function sf(){let e={};return{get:function(t){return e[t]},add:function(t,n){e[t]=n},remove:function(t){delete e[t]},removeAll:function(){e={}}}}function cf(e,t,n){let r=e.json.materials[t];return r.extensions&&r.extensions[n]?r.extensions[n]:null}var lf={KHR_BINARY_GLTF:`KHR_binary_glTF`,KHR_DRACO_MESH_COMPRESSION:`KHR_draco_mesh_compression`,KHR_LIGHTS_PUNCTUAL:`KHR_lights_punctual`,KHR_MATERIALS_CLEARCOAT:`KHR_materials_clearcoat`,KHR_MATERIALS_DIFFUSE_ROUGHNESS:`KHR_materials_diffuse_roughness`,KHR_MATERIALS_DISPERSION:`KHR_materials_dispersion`,KHR_MATERIALS_IOR:`KHR_materials_ior`,KHR_MATERIALS_SHEEN:`KHR_materials_sheen`,KHR_MATERIALS_SPECULAR:`KHR_materials_specular`,KHR_MATERIALS_TRANSMISSION:`KHR_materials_transmission`,KHR_MATERIALS_IRIDESCENCE:`KHR_materials_iridescence`,KHR_MATERIALS_ANISOTROPY:`KHR_materials_anisotropy`,KHR_MATERIALS_UNLIT:`KHR_materials_unlit`,KHR_MATERIALS_VOLUME:`KHR_materials_volume`,KHR_TEXTURE_BASISU:`KHR_texture_basisu`,KHR_TEXTURE_TRANSFORM:`KHR_texture_transform`,KHR_MESH_QUANTIZATION:`KHR_mesh_quantization`,KHR_MATERIALS_EMISSIVE_STRENGTH:`KHR_materials_emissive_strength`,EXT_MATERIALS_BUMP:`EXT_materials_bump`,EXT_TEXTURE_WEBP:`EXT_texture_webp`,EXT_TEXTURE_AVIF:`EXT_texture_avif`,EXT_MESHOPT_COMPRESSION:`EXT_meshopt_compression`,KHR_MESHOPT_COMPRESSION:`KHR_meshopt_compression`,EXT_MESH_GPU_INSTANCING:`EXT_mesh_gpu_instancing`},uf=class{constructor(e){this.parser=e,this.name=lf.KHR_LIGHTS_PUNCTUAL,this.cache={refs:{},uses:{}}}_markDefs(){let e=this.parser,t=this.parser.json.nodes||[];for(let n=0,r=t.length;n<r;n++){let r=t[n];r.extensions&&r.extensions[this.name]&&r.extensions[this.name].light!==void 0&&e._addNodeRef(this.cache,r.extensions[this.name].light)}}_loadLight(e){let t=this.parser,n=`light:`+e,r=t.cache.get(n);if(r)return r;let i=t.json,a=((i.extensions&&i.extensions[this.name]||{}).lights||[])[e],o,s=new X(16777215);a.color!==void 0&&s.setRGB(a.color[0],a.color[1],a.color[2],Re);let c=a.range===void 0?0:a.range;switch(a.type){case`directional`:o=new _s(s),o.target.position.set(0,0,-1),o.add(o.target);break;case`point`:o=new ms(s),o.distance=c;break;case`spot`:o=new fs(s),o.distance=c,a.spot=a.spot||{},a.spot.innerConeAngle=a.spot.innerConeAngle===void 0?0:a.spot.innerConeAngle,a.spot.outerConeAngle=a.spot.outerConeAngle===void 0?Math.PI/4:a.spot.outerConeAngle,o.angle=a.spot.outerConeAngle,o.penumbra=1-a.spot.innerConeAngle/a.spot.outerConeAngle,o.target.position.set(0,0,-1),o.add(o.target);break;default:throw Error(`THREE.GLTFLoader: Unexpected light type: `+a.type)}return o.position.set(0,0,0),Xf(o,a),a.intensity!==void 0&&(o.intensity=a.intensity),o.name=t.createUniqueName(a.name||`light_`+e),r=Promise.resolve(o),t.cache.add(n,r),r}getDependency(e,t){if(e===`light`)return this._loadLight(t)}createNodeAttachment(e){let t=this,n=this.parser,r=n.json.nodes[e],i=(r.extensions&&r.extensions[this.name]||{}).light;return i===void 0?null:this._loadLight(i).then(function(e){return n._getNodeRef(t.cache,i,e)})}},df=class{constructor(){this.name=lf.KHR_MATERIALS_UNLIT}getMaterialType(){return Gr}extendParams(e,t,n){let r=[];e.color=new X(1,1,1),e.opacity=1;let i=t.pbrMetallicRoughness;if(i){if(Array.isArray(i.baseColorFactor)){let t=i.baseColorFactor;e.color.setRGB(t[0],t[1],t[2],Re),e.opacity=t[3]}i.baseColorTexture!==void 0&&r.push(n.assignTexture(e,`map`,i.baseColorTexture,Le))}return Promise.all(r)}},ff=class{constructor(e){this.parser=e,this.name=lf.KHR_MATERIALS_EMISSIVE_STRENGTH}extendMaterialParams(e,t){let n=cf(this.parser,e,this.name);return n===null||n.emissiveStrength!==void 0&&(t.emissiveIntensity=n.emissiveStrength),Promise.resolve()}},pf=class{constructor(e){this.parser=e,this.name=lf.KHR_MATERIALS_CLEARCOAT}getMaterialType(e){return cf(this.parser,e,this.name)===null?null:fo}extendMaterialParams(e,t){let n=cf(this.parser,e,this.name);if(n===null)return Promise.resolve();let r=[];if(n.clearcoatFactor!==void 0&&(t.clearcoat=n.clearcoatFactor),n.clearcoatTexture!==void 0&&r.push(this.parser.assignTexture(t,`clearcoatMap`,n.clearcoatTexture)),n.clearcoatRoughnessFactor!==void 0&&(t.clearcoatRoughness=n.clearcoatRoughnessFactor),n.clearcoatRoughnessTexture!==void 0&&r.push(this.parser.assignTexture(t,`clearcoatRoughnessMap`,n.clearcoatRoughnessTexture)),n.clearcoatNormalTexture!==void 0&&(r.push(this.parser.assignTexture(t,`clearcoatNormalMap`,n.clearcoatNormalTexture)),n.clearcoatNormalTexture.scale!==void 0)){let e=n.clearcoatNormalTexture.scale;t.clearcoatNormalScale=new q(e,e)}return Promise.all(r)}},mf=class{constructor(e){this.parser=e,this.name=lf.KHR_MATERIALS_DIFFUSE_ROUGHNESS}getMaterialType(e){return cf(this.parser,e,this.name)===null?null:fo}extendMaterialParams(e,t){let n=cf(this.parser,e,this.name);if(n===null)return Promise.resolve();let r=[];return t.diffuseRoughness=n.diffuseRoughnessFactor===void 0?0:n.diffuseRoughnessFactor,n.diffuseRoughnessTexture!==void 0&&r.push(this.parser.assignTexture(t,`diffuseRoughnessMap`,n.diffuseRoughnessTexture)),Promise.all(r)}},hf=class{constructor(e){this.parser=e,this.name=lf.KHR_MATERIALS_DISPERSION}getMaterialType(e){return cf(this.parser,e,this.name)===null?null:fo}extendMaterialParams(e,t){let n=cf(this.parser,e,this.name);return n===null||(t.dispersion=n.dispersion===void 0?0:n.dispersion),Promise.resolve()}},gf=class{constructor(e){this.parser=e,this.name=lf.KHR_MATERIALS_IRIDESCENCE}getMaterialType(e){return cf(this.parser,e,this.name)===null?null:fo}extendMaterialParams(e,t){let n=cf(this.parser,e,this.name);if(n===null)return Promise.resolve();let r=[];return n.iridescenceFactor!==void 0&&(t.iridescence=n.iridescenceFactor),n.iridescenceTexture!==void 0&&r.push(this.parser.assignTexture(t,`iridescenceMap`,n.iridescenceTexture)),n.iridescenceIor!==void 0&&(t.iridescenceIOR=n.iridescenceIor),n.iridescenceThicknessMinimum!==void 0&&(t.iridescenceThicknessMinimum=n.iridescenceThicknessMinimum),n.iridescenceThicknessMaximum!==void 0&&(t.iridescenceThicknessMaximum=n.iridescenceThicknessMaximum),n.iridescenceThicknessTexture!==void 0&&r.push(this.parser.assignTexture(t,`iridescenceThicknessMap`,n.iridescenceThicknessTexture)),Promise.all(r)}},_f=class{constructor(e){this.parser=e,this.name=lf.KHR_MATERIALS_SHEEN}getMaterialType(e){return cf(this.parser,e,this.name)===null?null:fo}extendMaterialParams(e,t){let n=cf(this.parser,e,this.name);if(n===null)return Promise.resolve();let r=[];if(t.sheenColor=new X(0,0,0),t.sheenRoughness=0,t.sheen=1,n.sheenColorFactor!==void 0){let e=n.sheenColorFactor;t.sheenColor.setRGB(e[0],e[1],e[2],Re)}return n.sheenRoughnessFactor!==void 0&&(t.sheenRoughness=n.sheenRoughnessFactor),n.sheenColorTexture!==void 0&&r.push(this.parser.assignTexture(t,`sheenColorMap`,n.sheenColorTexture,Le)),n.sheenRoughnessTexture!==void 0&&r.push(this.parser.assignTexture(t,`sheenRoughnessMap`,n.sheenRoughnessTexture)),Promise.all(r)}},vf=class{constructor(e){this.parser=e,this.name=lf.KHR_MATERIALS_TRANSMISSION}getMaterialType(e){return cf(this.parser,e,this.name)===null?null:fo}extendMaterialParams(e,t){let n=cf(this.parser,e,this.name);if(n===null)return Promise.resolve();let r=[];return n.transmissionFactor!==void 0&&(t.transmission=n.transmissionFactor),n.transmissionTexture!==void 0&&r.push(this.parser.assignTexture(t,`transmissionMap`,n.transmissionTexture)),Promise.all(r)}},yf=class{constructor(e){this.parser=e,this.name=lf.KHR_MATERIALS_VOLUME}getMaterialType(e){return cf(this.parser,e,this.name)===null?null:fo}extendMaterialParams(e,t){let n=cf(this.parser,e,this.name);if(n===null)return Promise.resolve();let r=[];t.thickness=n.thicknessFactor===void 0?0:n.thicknessFactor,n.thicknessTexture!==void 0&&r.push(this.parser.assignTexture(t,`thicknessMap`,n.thicknessTexture)),t.attenuationDistance=n.attenuationDistance||1/0;let i=n.attenuationColor||[1,1,1];return t.attenuationColor=new X().setRGB(i[0],i[1],i[2],Re),Promise.all(r)}},bf=class{constructor(e){this.parser=e,this.name=lf.KHR_MATERIALS_IOR}getMaterialType(e){return cf(this.parser,e,this.name)===null?null:fo}extendMaterialParams(e,t){let n=cf(this.parser,e,this.name);return n===null||(t.ior=n.ior===void 0?1.5:n.ior,t.ior===0&&(t.ior=1e3)),Promise.resolve()}},xf=class{constructor(e){this.parser=e,this.name=lf.KHR_MATERIALS_SPECULAR}getMaterialType(e){return cf(this.parser,e,this.name)===null?null:fo}extendMaterialParams(e,t){let n=cf(this.parser,e,this.name);if(n===null)return Promise.resolve();let r=[];t.specularIntensity=n.specularFactor===void 0?1:n.specularFactor,n.specularTexture!==void 0&&r.push(this.parser.assignTexture(t,`specularIntensityMap`,n.specularTexture));let i=n.specularColorFactor||[1,1,1];return t.specularColor=new X().setRGB(i[0],i[1],i[2],Re),n.specularColorTexture!==void 0&&r.push(this.parser.assignTexture(t,`specularColorMap`,n.specularColorTexture,Le)),Promise.all(r)}},Sf=class{constructor(e){this.parser=e,this.name=lf.EXT_MATERIALS_BUMP}getMaterialType(e){return cf(this.parser,e,this.name)===null?null:fo}extendMaterialParams(e,t){let n=cf(this.parser,e,this.name);if(n===null)return Promise.resolve();let r=[];return t.bumpScale=n.bumpFactor===void 0?1:n.bumpFactor,n.bumpTexture!==void 0&&r.push(this.parser.assignTexture(t,`bumpMap`,n.bumpTexture)),Promise.all(r)}},Cf=class{constructor(e){this.parser=e,this.name=lf.KHR_MATERIALS_ANISOTROPY}getMaterialType(e){return cf(this.parser,e,this.name)===null?null:fo}extendMaterialParams(e,t){let n=cf(this.parser,e,this.name);if(n===null)return Promise.resolve();let r=[];return n.anisotropyStrength!==void 0&&(t.anisotropy=n.anisotropyStrength),n.anisotropyRotation!==void 0&&(t.anisotropyRotation=n.anisotropyRotation),n.anisotropyTexture!==void 0&&r.push(this.parser.assignTexture(t,`anisotropyMap`,n.anisotropyTexture)),Promise.all(r)}},wf=class{constructor(e){this.parser=e,this.name=lf.KHR_TEXTURE_BASISU}loadTexture(e){let t=this.parser,n=t.json,r=n.textures[e];if(!r.extensions||!r.extensions[this.name])return null;let i=r.extensions[this.name],a=t.options.ktx2Loader;if(!a){if(n.extensionsRequired&&n.extensionsRequired.indexOf(this.name)>=0)throw Error(`THREE.GLTFLoader: setKTX2Loader must be called before loading KTX2 textures`);return null}return t.loadTextureImage(e,i.source,a)}},Tf=class{constructor(e){this.parser=e,this.name=lf.EXT_TEXTURE_WEBP}loadTexture(e){let t=this.name,n=this.parser,r=n.json,i=r.textures[e];if(!i.extensions||!i.extensions[t])return null;let a=i.extensions[t],o=r.images[a.source],s=n.textureLoader;if(o.uri){let e=n.options.manager.getHandler(o.uri);e!==null&&(s=e)}return n.loadTextureImage(e,a.source,s)}},Ef=class{constructor(e){this.parser=e,this.name=lf.EXT_TEXTURE_AVIF}loadTexture(e){let t=this.name,n=this.parser,r=n.json,i=r.textures[e];if(!i.extensions||!i.extensions[t])return null;let a=i.extensions[t],o=r.images[a.source],s=n.textureLoader;if(o.uri){let e=n.options.manager.getHandler(o.uri);e!==null&&(s=e)}return n.loadTextureImage(e,a.source,s)}},Df=class{constructor(e,t){this.name=t,this.parser=e}loadBufferView(e){let t=this.parser.json,n=t.bufferViews[e];if(n.extensions&&n.extensions[this.name]){let e=n.extensions[this.name],r=this.parser.getDependency(`buffer`,e.buffer),i=this.parser.options.meshoptDecoder;if(!i||!i.supported){if(t.extensionsRequired&&t.extensionsRequired.indexOf(this.name)>=0)throw Error(`THREE.GLTFLoader: setMeshoptDecoder must be called before loading compressed files`);return null}return r.then(function(t){let n=e.byteOffset||0,r=e.byteLength||0,a=e.count,o=e.byteStride,s=new Uint8Array(t,n,r);return i.decodeGltfBufferAsync?i.decodeGltfBufferAsync(a,o,s,e.mode,e.filter).then(function(e){return e.buffer}):i.ready.then(function(){let t=new ArrayBuffer(a*o);return i.decodeGltfBuffer(new Uint8Array(t),a,o,s,e.mode,e.filter),t})})}return null}},Of=class{constructor(e){this.name=lf.EXT_MESH_GPU_INSTANCING,this.parser=e}createNodeMesh(e){let t=this.parser.json,n=t.nodes[e];if(!n.extensions||!n.extensions[this.name]||n.mesh===void 0)return null;let r=t.meshes[n.mesh];for(let e of r.primitives)if(e.mode!==zf.TRIANGLES&&e.mode!==zf.TRIANGLE_STRIP&&e.mode!==zf.TRIANGLE_FAN&&e.mode!==void 0)return null;let i=n.extensions[this.name].attributes,a=[],o={};for(let e in i)a.push(this.parser.getDependency(`accessor`,i[e]).then(t=>(o[e]=t,o[e])));return a.length<1?null:(a.push(this.parser.createNodeMesh(e)),Promise.all(a).then(e=>{let t=e.pop(),n=t.isGroup?t.children:[t],r=e[0].count,i=[];for(let e of n){let t=new Y,n=new J,a=new At,s=new J(1,1,1),c=new ki(e.geometry,e.material,r);for(let e=0;e<r;e++)o.TRANSLATION&&n.fromBufferAttribute(o.TRANSLATION,e),o.ROTATION&&a.fromBufferAttribute(o.ROTATION,e),o.SCALE&&s.fromBufferAttribute(o.SCALE,e),c.setMatrixAt(e,t.compose(n,a,s));let l=null;for(let e in o)if(e===`_COLOR_0`){let t=o[e];c.instanceColor=new xi(t.array,t.itemSize,t.normalized)}else if(e!==`TRANSLATION`&&e!==`ROTATION`&&e!==`SCALE`){if(l===null){let e=c.geometry;l=new kr,l.name=e.name;for(let t in e.attributes)l.setAttribute(t,e.attributes[t]);for(let t in e.morphAttributes)l.morphAttributes[t]=e.morphAttributes[t];e.index!==null&&l.setIndex(e.index),l.morphTargetsRelative=e.morphTargetsRelative;for(let t of e.groups)l.addGroup(t.start,t.count,t.materialIndex);e.boundingBox!==null&&(l.boundingBox=e.boundingBox.clone()),e.boundingSphere!==null&&(l.boundingSphere=e.boundingSphere.clone()),l.drawRange.start=e.drawRange.start,l.drawRange.count=e.drawRange.count,l.userData=Object.assign({},e.userData),c.geometry=l}let t=o[e];l.setAttribute(e,new xi(t.array,t.itemSize,t.normalized))}Dn.prototype.copy.call(c,e),this.parser.assignFinalMaterial(c),i.push(c)}return t.isGroup?(t.clear(),t.add(...i),t):i[0]}))}},kf=`glTF`,Af=12,jf={JSON:1313821514,BIN:5130562},Mf=class{constructor(e){this.name=lf.KHR_BINARY_GLTF,this.content=null,this.body=null;let t=new DataView(e,0,Af),n=new TextDecoder;if(this.header={magic:n.decode(new Uint8Array(e.slice(0,4))),version:t.getUint32(4,!0),length:t.getUint32(8,!0)},this.header.magic!==kf)throw Error(`THREE.GLTFLoader: Unsupported glTF-Binary header.`);if(this.header.version<2)throw Error(`THREE.GLTFLoader: Legacy binary file detected.`);let r=this.header.length-Af,i=new DataView(e,Af),a=0;for(;a<r;){let t=i.getUint32(a,!0);a+=4;let r=i.getUint32(a,!0);if(a+=4,r===jf.JSON){let r=new Uint8Array(e,Af+a,t);this.content=n.decode(r)}else if(r===jf.BIN){let n=Af+a;this.body=e.slice(n,n+t)}a+=t}if(this.content===null)throw Error(`THREE.GLTFLoader: JSON content not found.`)}},Nf=class{constructor(e,t){if(!t)throw Error(`THREE.GLTFLoader: No DRACOLoader instance provided.`);this.name=lf.KHR_DRACO_MESH_COMPRESSION,this.json=e,this.dracoLoader=t,this.dracoLoader.preload()}decodePrimitive(e,t){let n=this.json,r=this.dracoLoader,i=e.extensions[this.name].bufferView,a=e.extensions[this.name].attributes,o={},s={},c={};for(let e in a){let t=Wf[e]||e.toLowerCase();o[t]=a[e]}for(let t in e.attributes){let r=Wf[t]||t.toLowerCase();if(a[t]!==void 0){let i=n.accessors[e.attributes[t]];c[r]=Bf[i.componentType].name,s[r]=i.normalized===!0}}return t.getDependency(`bufferView`,i).then(function(e){return new Promise(function(t,n){r.decodeDracoFile(e,function(e){for(let t in e.attributes){let n=e.attributes[t],r=s[t];r!==void 0&&(n.normalized=r)}t(e)},o,c,Re,n)})})}},Pf=class{constructor(){this.name=lf.KHR_TEXTURE_TRANSFORM}extendTexture(e,t){if((t.texCoord===void 0||t.texCoord===e.channel)&&t.offset===void 0&&t.rotation===void 0&&t.scale===void 0)return e;if(e=e.clone(),t.texCoord!==void 0&&(e.channel=t.texCoord),t.offset!==void 0&&e.offset.fromArray(t.offset),t.rotation!==void 0&&(e.rotation=t.rotation),t.scale!==void 0&&e.repeat.fromArray(t.scale),t.rotation!==void 0){let t=Math.cos(e.rotation),n=Math.sin(e.rotation);e.matrix.set(e.repeat.x*t,e.repeat.y*n,e.offset.x,-e.repeat.x*n,e.repeat.y*t,e.offset.y,0,0,1),e.matrixAutoUpdate=!1}return e.needsUpdate=!0,e}},Ff=class{constructor(){this.name=lf.KHR_MESH_QUANTIZATION}},If=class extends bo{constructor(e,t,n,r){super(e,t,n,r)}copySampleValue_(e){let t=this.resultBuffer,n=this.sampleValues,r=this.valueSize,i=e*r*3+r;for(let e=0;e!==r;e++)t[e]=n[i+e];return t}interpolate_(e,t,n,r){let i=this.resultBuffer,a=this.sampleValues,o=this.valueSize,s=o*2,c=o*3,l=r-t,u=(n-t)/l,d=u*u,f=d*u,p=e*c,m=p-c,h=-2*f+3*d,g=f-d,_=1-h,v=g-d+u;for(let e=0;e!==o;e++){let t=a[m+e+o],n=a[m+e+s]*l,r=a[p+e+o],c=a[p+e]*l;i[e]=_*t+v*n+h*r+g*c}return i}},Lf=new At,Rf=class extends If{interpolate_(e,t,n,r){let i=super.interpolate_(e,t,n,r);return Lf.fromArray(i).normalize().toArray(i),i}},zf={FLOAT:5126,FLOAT_MAT3:35675,FLOAT_MAT4:35676,FLOAT_VEC2:35664,FLOAT_VEC3:35665,FLOAT_VEC4:35666,LINEAR:9729,REPEAT:10497,SAMPLER_2D:35678,POINTS:0,LINES:1,LINE_LOOP:2,LINE_STRIP:3,TRIANGLES:4,TRIANGLE_STRIP:5,TRIANGLE_FAN:6,UNSIGNED_BYTE:5121,UNSIGNED_SHORT:5123},Bf={5120:Int8Array,5121:Uint8Array,5122:Int16Array,5123:Uint16Array,5125:Uint32Array,5126:Float32Array},Vf={9728:i,9729:s,9984:a,9985:c,9986:o,9987:l},Hf={33071:n,33648:r,10497:t},Uf={SCALAR:1,VEC2:2,VEC3:3,VEC4:4,MAT2:4,MAT3:9,MAT4:16},Wf={POSITION:`position`,NORMAL:`normal`,TANGENT:`tangent`,TEXCOORD_0:`uv`,TEXCOORD_1:`uv1`,TEXCOORD_2:`uv2`,TEXCOORD_3:`uv3`,COLOR_0:`color`,WEIGHTS_0:`skinWeight`,JOINTS_0:`skinIndex`},Gf={scale:`scale`,translation:`position`,rotation:`quaternion`,weights:`morphTargetInfluences`},Kf={CUBICSPLINE:void 0,LINEAR:je,STEP:Ae},qf={OPAQUE:`OPAQUE`,MASK:`MASK`,BLEND:`BLEND`};function Jf(e){return e.DefaultMaterial===void 0&&(e.DefaultMaterial=new uo({color:16777215,emissive:0,metalness:1,roughness:1,transparent:!1,depthTest:!0,side:0})),e.DefaultMaterial}function Yf(e,t,n){for(let r in n.extensions)e[r]===void 0&&(t.userData.gltfExtensions=t.userData.gltfExtensions||{},t.userData.gltfExtensions[r]=n.extensions[r])}function Xf(e,t){t.extras!==void 0&&(typeof t.extras==`object`?Object.assign(e.userData,t.extras):console.warn(`THREE.GLTFLoader: Ignoring primitive type .extras, `+t.extras))}function Zf(e,t,n){let r=!1,i=!1,a=!1;for(let e=0,n=t.length;e<n;e++){let n=t[e];if(n.POSITION!==void 0&&(r=!0),n.NORMAL!==void 0&&(i=!0),n.COLOR_0!==void 0&&(a=!0),r&&i&&a)break}if(!r&&!i&&!a)return Promise.resolve(e);let o=[],s=[],c=[];for(let l=0,u=t.length;l<u;l++){let u=t[l];if(r){let t=u.POSITION===void 0?e.attributes.position:n.getDependency(`accessor`,u.POSITION);o.push(t)}if(i){let t=u.NORMAL===void 0?e.attributes.normal:n.getDependency(`accessor`,u.NORMAL);s.push(t)}if(a){let t=u.COLOR_0===void 0?e.attributes.color:n.getDependency(`accessor`,u.COLOR_0);c.push(t)}}return Promise.all([Promise.all(o),Promise.all(s),Promise.all(c)]).then(function(t){let n=t[0],o=t[1],s=t[2];return r&&(e.morphAttributes.position=n),i&&(e.morphAttributes.normal=o),a&&(e.morphAttributes.color=s),e.morphTargetsRelative=!0,e})}function Qf(e,t){if(e.updateMorphTargets(),t.weights!==void 0)for(let n=0,r=t.weights.length;n<r;n++)e.morphTargetInfluences[n]=t.weights[n];if(t.extras&&Array.isArray(t.extras.targetNames)){let n=t.extras.targetNames;if(e.morphTargetInfluences.length===n.length){e.morphTargetDictionary={};for(let t=0,r=n.length;t<r;t++)e.morphTargetDictionary[n[t]]=t}else console.warn(`THREE.GLTFLoader: Invalid extras.targetNames length. Ignoring names.`)}}function $f(e){let t,n=e.extensions&&e.extensions[lf.KHR_DRACO_MESH_COMPRESSION];if(t=n?`draco:`+n.bufferView+`:`+n.indices+`:`+ep(n.attributes):e.indices+`:`+ep(e.attributes)+`:`+e.mode,e.targets!==void 0)for(let n=0,r=e.targets.length;n<r;n++)t+=`:`+ep(e.targets[n]);return t}function ep(e){let t=``,n=Object.keys(e).sort();for(let r=0,i=n.length;r<i;r++)t+=n[r]+`:`+e[n[r]]+`;`;return t}function tp(e){switch(e){case Int8Array:return 1/127;case Uint8Array:return 1/255;case Int16Array:return 1/32767;case Uint16Array:return 1/65535;default:throw Error(`THREE.GLTFLoader: Unsupported normalized accessor component type.`)}}function np(e){return e.search(/\.jpe?g($|\?)/i)>0||e.search(/^data\:image\/jpeg/)===0?`image/jpeg`:e.search(/\.webp($|\?)/i)>0||e.search(/^data\:image\/webp/)===0?`image/webp`:e.search(/\.ktx2($|\?)/i)>0||e.search(/^data\:image\/ktx2/)===0?`image/ktx2`:`image/png`}var rp=new Y,ip=class{constructor(e={},t={}){this.json=e,this.extensions={},this.plugins={},this.options=t,this.cache=new sf,this.associations=new Map,this.primitiveCache={},this.nodeCache={},this.meshCache={refs:{},uses:{}},this.cameraCache={refs:{},uses:{}},this.lightCache={refs:{},uses:{}},this.sourceCache={},this.textureCache={},this.nodeNamesUsed={};let n=!1,r=-1,i=!1,a=-1;if(typeof navigator<`u`&&navigator.userAgent!==void 0){let e=navigator.userAgent;n=/^((?!chrome|android).)*safari/i.test(e)===!0;let t=e.match(/Version\/(\d+)/);r=n&&t?parseInt(t[1],10):-1,i=e.indexOf(`Firefox`)>-1,a=i?e.match(/Firefox\/([0-9]+)\./)[1]:-1}typeof createImageBitmap>`u`||n&&r<17||i&&a<98?(this.textureLoader=new Xo(this.options.manager),this.textureLoader.setPriority(this.options.priority),this.textureLoader.setCache(this.options.cache)):(this.textureLoader=new bs(this.options.manager),this.textureLoader.setPriority(this.options.priority),this.textureLoader.setCache(this.options.cache)),this.textureLoader.setCrossOrigin(this.options.crossOrigin),this.textureLoader.setWithCredentials(this.options.withCredentials),this.textureLoader.setRequestHeader(this.options.requestHeader),this.fileLoader=new qo(this.options.manager),this.fileLoader.setPriority(this.options.priority),this.fileLoader.setCache(this.options.cache),this.fileLoader.setResponseType(`arraybuffer`),(this.options.withCredentials||this.options.crossOrigin===`use-credentials`)&&this.fileLoader.setWithCredentials(!0)}setExtensions(e){this.extensions=e}setPlugins(e){this.plugins=e}parse(e,t){let n=this,r=this.json,i=this.extensions;this.cache.removeAll(),this.nodeCache={},this._invokeAll(function(e){return e._markDefs&&e._markDefs()}),Promise.all(this._invokeAll(function(e){return e.beforeRoot&&e.beforeRoot()})).then(function(){return Promise.all([n.getDependencies(`scene`),n.getDependencies(`animation`),n.getDependencies(`camera`)])}).then(function(t){let a={scene:t[0][r.scene||0],scenes:t[0],animations:t[1],cameras:t[2],asset:r.asset,parser:n,userData:{}};return Yf(i,a,r),Xf(a,r),Promise.all(n._invokeAll(function(e){return e.afterRoot&&e.afterRoot(a)})).then(function(){for(let e of a.scenes)e.updateMatrixWorld();e(a)})}).catch(t)}_markDefs(){let e=this.json.nodes||[],t=this.json.skins||[],n=this.json.meshes||[];for(let n=0,r=t.length;n<r;n++){let r=t[n].joints;for(let t=0,n=r.length;t<n;t++)e[r[t]].isBone=!0}for(let t=0,r=e.length;t<r;t++){let r=e[t];r.mesh!==void 0&&(this._addNodeRef(this.meshCache,r.mesh),r.skin!==void 0&&(n[r.mesh].isSkinnedMesh=!0)),r.camera!==void 0&&this._addNodeRef(this.cameraCache,r.camera)}}_addNodeRef(e,t){t!==void 0&&(e.refs[t]===void 0&&(e.refs[t]=e.uses[t]=0),e.refs[t]++)}_getNodeRef(e,t,n){if(e.refs[t]<=1)return n;let r=n.clone(),i=(e,t)=>{let n=this.associations.get(e);n!=null&&this.associations.set(t,n);for(let[n,r]of e.children.entries())i(r,t.children[n])};return i(n,r),r.name+=`_instance_`+e.uses[t]++,r}_invokeOne(e){let t=Object.values(this.plugins);t.push(this);for(let n=0;n<t.length;n++){let r=e(t[n]);if(r)return r}return null}_invokeAll(e){let t=Object.values(this.plugins);t.unshift(this);let n=[];for(let r=0;r<t.length;r++){let i=e(t[r]);i&&n.push(i)}return n}getDependency(e,t){let n=e+`:`+t,r=this.cache.get(n);if(!r){switch(e){case`scene`:r=this.loadScene(t);break;case`node`:r=this._invokeOne(function(e){return e.loadNode&&e.loadNode(t)});break;case`mesh`:r=this._invokeOne(function(e){return e.loadMesh&&e.loadMesh(t)});break;case`accessor`:r=this.loadAccessor(t);break;case`bufferView`:r=this._invokeOne(function(e){return e.loadBufferView&&e.loadBufferView(t)});break;case`buffer`:r=this.loadBuffer(t);break;case`material`:r=this._invokeOne(function(e){return e.loadMaterial&&e.loadMaterial(t)});break;case`texture`:r=this._invokeOne(function(e){return e.loadTexture&&e.loadTexture(t)});break;case`skin`:r=this.loadSkin(t);break;case`animation`:r=this._invokeOne(function(e){return e.loadAnimation&&e.loadAnimation(t)});break;case`camera`:r=this.loadCamera(t);break;default:if(r=this._invokeOne(function(n){return n!=this&&n.getDependency&&n.getDependency(e,t)}),!r)throw Error(`Unknown type: `+e)}this.cache.add(n,r)}return r}getDependencies(e){let t=this.cache.get(e);if(!t){let n=this,r=this.json[e+(e===`mesh`?`es`:`s`)]||[];t=Promise.all(r.map(function(t,r){return n.getDependency(e,r)})),this.cache.add(e,t)}return t}loadBuffer(e){let t=this.json.buffers[e],n=this.fileLoader;if(t.type&&t.type!==`arraybuffer`)throw Error(`THREE.GLTFLoader: `+t.type+` buffer type is not supported.`);if(t.uri===void 0&&e===0)return Promise.resolve(this.extensions[lf.KHR_BINARY_GLTF].body);let r=this.options;return new Promise(function(e,i){n.load(vs.resolveURL(t.uri,r.path),e,void 0,function(){i(Error(`THREE.GLTFLoader: Failed to load buffer "`+t.uri+`".`))})})}loadBufferView(e){let t=this.json.bufferViews[e];return this.getDependency(`buffer`,t.buffer).then(function(e){let n=t.byteLength||0,r=t.byteOffset||0;return e.slice(r,r+n)})}loadAccessor(e){let t=this,n=this.json,r=this.json.accessors[e];if(r.bufferView===void 0&&r.sparse===void 0){let e=Uf[r.type],t=Bf[r.componentType],n=r.normalized===!0,i=new t(r.count*e);return Promise.resolve(new hr(i,e,n))}let i=[];return r.bufferView===void 0?i.push(null):i.push(this.getDependency(`bufferView`,r.bufferView)),r.sparse!==void 0&&(i.push(this.getDependency(`bufferView`,r.sparse.indices.bufferView)),i.push(this.getDependency(`bufferView`,r.sparse.values.bufferView))),Promise.all(i).then(function(e){let i=e[0],a=Uf[r.type],o=Bf[r.componentType],s=o.BYTES_PER_ELEMENT,c=s*a,l=r.byteOffset||0,u=r.bufferView===void 0?void 0:n.bufferViews[r.bufferView].byteStride,d=r.normalized===!0,f,p;if(u&&u!==c){let e=Math.floor(l/u),n=`InterleavedBuffer:`+r.bufferView+`:`+r.componentType+`:`+e+`:`+r.count,c=t.cache.get(n);c||(f=new o(i,e*u,r.count*u/s),c=new Ar(f,u/s),t.cache.add(n,c)),p=new Nr(c,a,l%u/s,d)}else f=i===null?new o(r.count*a):new o(i,l,r.count*a),p=new hr(f,a,d);if(r.sparse!==void 0){let t=Uf.SCALAR,n=Bf[r.sparse.indices.componentType],s=r.sparse.indices.byteOffset||0,c=r.sparse.values.byteOffset||0,l=new n(e[1],s,r.sparse.count*t),u=new o(e[2],c,r.sparse.count*a);i!==null&&(p=new hr(p.array.slice(),p.itemSize,p.normalized)),p.normalized=!1;for(let e=0,t=l.length;e<t;e++){let t=l[e];if(p.setX(t,u[e*a]),a>=2&&p.setY(t,u[e*a+1]),a>=3&&p.setZ(t,u[e*a+2]),a>=4&&p.setW(t,u[e*a+3]),a>=5)throw Error(`THREE.GLTFLoader: Unsupported itemSize in sparse BufferAttribute.`)}p.normalized=d}return p})}loadTexture(e){let t=this.json,n=this.options,r=t.textures[e].source,i=t.images[r],a=this.textureLoader;if(i.uri){let e=n.manager.getHandler(i.uri);e!==null&&(a=e)}return this.loadTextureImage(e,r,a)}loadTextureImage(e,t,n){let r=this,i=this.json,a=i.textures[e],o=i.images[t],s=(o.uri||o.bufferView)+`:`+a.sampler;if(this.textureCache[s])return this.textureCache[s];let c=this.loadImageSource(t,n).then(function(t){t.flipY=!1,t.name=a.name||o.name||``,t.name===``&&typeof o.uri==`string`&&o.uri.startsWith(`data:image/`)===!1&&(t.name=o.uri);let n=(i.samplers||{})[a.sampler]||{};return t.magFilter=Vf[n.magFilter]||1006,t.minFilter=Vf[n.minFilter]||1008,t.wrapS=Hf[n.wrapS]||1e3,t.wrapT=Hf[n.wrapT]||1e3,t.generateMipmaps=!t.isCompressedTexture&&t.minFilter!==1003&&t.minFilter!==1006,r.associations.set(t,{textures:e}),t}).catch(function(){return null});return this.textureCache[s]=c,c}loadImageSource(e,t){let n=this,r=this.json,i=this.options;if(this.sourceCache[e]!==void 0)return this.sourceCache[e].then(e=>e.clone());let a=r.images[e],o=self.URL||self.webkitURL,s=a.uri||``,c=!1,l;if(t.isKTX2Loader===!0&&a.bufferView!==void 0)l=n.getDependency(`bufferView`,a.bufferView).then(function(e){return new Promise(function(n,r){t.parse(e,n,r)})});else{if(a.bufferView!==void 0)s=n.getDependency(`bufferView`,a.bufferView).then(function(e){c=!0;let t=new Blob([e],{type:a.mimeType});return s=o.createObjectURL(t),s});else if(a.uri===void 0)throw Error(`THREE.GLTFLoader: Image `+e+` is missing URI and bufferView`);l=Promise.resolve(s).then(function(e){return new Promise(function(n,r){let a=n;t.isImageBitmapLoader===!0&&(a=function(e){let t=new Jt(e);t.needsUpdate=!0,n(t)}),t.load(vs.resolveURL(e,i.path),a,void 0,r)})})}let u=l.then(function(e){return c===!0&&o.revokeObjectURL(s),Xf(e,a),e.userData.mimeType=a.mimeType||np(a.uri),e}).catch(function(e){throw console.error(`THREE.GLTFLoader: Couldn't load texture`,s),e});return this.sourceCache[e]=u,u}assignTexture(e,t,n,r){let i=this;return this.getDependency(`texture`,n.index).then(function(a){if(!a)return null;if(n.texCoord!==void 0&&n.texCoord>0&&(a=a.clone(),a.channel=n.texCoord),i.extensions[lf.KHR_TEXTURE_TRANSFORM]){let e=n.extensions===void 0?void 0:n.extensions[lf.KHR_TEXTURE_TRANSFORM];if(e){let t=i.associations.get(a);a=i.extensions[lf.KHR_TEXTURE_TRANSFORM].extendTexture(a,e),i.associations.set(a,t)}}return r!==void 0&&(a.colorSpace=r),e[t]=a,a})}assignFinalMaterial(e){let t=e.geometry,n=e.material,r=t.attributes.tangent===void 0,i=t.attributes.color!==void 0,a=t.attributes.normal===void 0;if(e.isPoints){let e=`PointsMaterial:`+n.uuid,t=this.cache.get(e);t||(t=new Xi,zr.prototype.copy.call(t,n),t.color.copy(n.color),t.map=n.map,t.sizeAttenuation=!1,this.cache.add(e,t)),n=t}else if(e.isLine){let e=`LineBasicMaterial:`+n.uuid,t=this.cache.get(e);t||(t=new Ii,zr.prototype.copy.call(t,n),t.color.copy(n.color),t.map=n.map,this.cache.add(e,t)),n=t}if(r||i||a){let e=`ClonedMaterial:`+n.uuid+`:`;r&&(e+=`derivative-tangents:`),i&&(e+=`vertex-colors:`),a&&(e+=`flat-shading:`);let t=this.cache.get(e);t||(t=n.clone(),i&&(t.vertexColors=!0),a&&(t.flatShading=!0),r&&(t.normalScale&&(t.normalScale.y*=-1),t.clearcoatNormalScale&&(t.clearcoatNormalScale.y*=-1)),this.cache.add(e,t),this.associations.set(t,this.associations.get(n))),n=t}e.material=n}getMaterialType(){return uo}loadMaterial(e){let t=this,n=this.json,r=this.extensions,i=n.materials[e],a,o={},s=i.extensions||{},c=[];if(s[lf.KHR_MATERIALS_UNLIT]){let e=r[lf.KHR_MATERIALS_UNLIT];a=e.getMaterialType(),c.push(e.extendParams(o,i,t))}else{let n=i.pbrMetallicRoughness||{};if(o.color=new X(1,1,1),o.opacity=1,Array.isArray(n.baseColorFactor)){let e=n.baseColorFactor;o.color.setRGB(e[0],e[1],e[2],Re),o.opacity=e[3]}n.baseColorTexture!==void 0&&c.push(t.assignTexture(o,`map`,n.baseColorTexture,Le)),o.metalness=n.metallicFactor===void 0?1:n.metallicFactor,o.roughness=n.roughnessFactor===void 0?1:n.roughnessFactor,n.metallicRoughnessTexture!==void 0&&(c.push(t.assignTexture(o,`metalnessMap`,n.metallicRoughnessTexture)),c.push(t.assignTexture(o,`roughnessMap`,n.metallicRoughnessTexture))),a=this._invokeOne(function(t){return t.getMaterialType&&t.getMaterialType(e)}),c.push(Promise.all(this._invokeAll(function(t){return t.extendMaterialParams&&t.extendMaterialParams(e,o)})))}i.doubleSided===!0&&(o.side=2);let l=i.alphaMode||qf.OPAQUE;if(l===qf.BLEND?(o.transparent=!0,o.depthWrite=!1):(o.transparent=!1,l===qf.MASK&&(o.alphaTest=i.alphaCutoff===void 0?.5:i.alphaCutoff)),i.normalTexture!==void 0&&a!==Gr&&(c.push(t.assignTexture(o,`normalMap`,i.normalTexture)),o.normalScale=new q(1,1),i.normalTexture.scale!==void 0)){let e=i.normalTexture.scale;o.normalScale.set(e,e)}if(i.occlusionTexture!==void 0&&a!==Gr&&(c.push(t.assignTexture(o,`aoMap`,i.occlusionTexture)),i.occlusionTexture.strength!==void 0&&(o.aoMapIntensity=i.occlusionTexture.strength)),i.emissiveFactor!==void 0&&a!==Gr){let e=i.emissiveFactor;o.emissive=new X().setRGB(e[0],e[1],e[2],Re)}return i.emissiveTexture!==void 0&&a!==Gr&&c.push(t.assignTexture(o,`emissiveMap`,i.emissiveTexture,Le)),Promise.all(c).then(function(){let n=new a(o);return i.name&&(n.name=i.name),Xf(n,i),t.associations.set(n,{materials:e}),i.extensions&&Yf(r,n,i),n})}createUniqueName(e){let t=zs.sanitizeNodeName(e||``);return t in this.nodeNamesUsed?t+`_`+ ++this.nodeNamesUsed[t]:(this.nodeNamesUsed[t]=0,t)}loadGeometries(e){let t=this,n=this.extensions,r=this.primitiveCache;function i(e){return n[lf.KHR_DRACO_MESH_COMPRESSION].decodePrimitive(e,t).then(function(n){return op(n,e,t)})}let a=[];for(let n=0,o=e.length;n<o;n++){let o=e[n],s=$f(o),c=r[s];if(c)a.push(c.promise);else{let e;e=o.extensions&&o.extensions[lf.KHR_DRACO_MESH_COMPRESSION]?i(o):op(new kr,o,t),o.mode===zf.TRIANGLE_STRIP?e=e.then(e=>dd(e,1)):o.mode===zf.TRIANGLE_FAN&&(e=e.then(e=>dd(e,2))),r[s]={primitive:o,promise:e},a.push(e)}}return Promise.all(a)}loadMesh(e){let t=this,n=this.json,r=this.extensions,i=n.meshes[e],a=i.primitives,o=[];for(let e=0,t=a.length;e<t;e++){let t=a[e].material===void 0?Jf(this.cache):this.getDependency(`material`,a[e].material);o.push(t)}return o.push(t.loadGeometries(a)),Promise.all(o).then(async function(n){let o=n.slice(0,n.length-1),s=n[n.length-1],c=[];for(let n=0,l=s.length;n<l;n++){let l=s[n],u=a[n],d,f=o[n];if(u.mode===zf.TRIANGLES||u.mode===zf.TRIANGLE_STRIP||u.mode===zf.TRIANGLE_FAN||u.mode===void 0){let e=i.isSkinnedMesh===!0,t=l.hasAttribute(`skinIndex`)&&l.hasAttribute(`skinWeight`);e&&t===!1&&console.warn(`THREE.GLTFLoader: Missing skinIndex or skinWeight attributes. Skinning disabled.`),d=e&&t?new hi(l,f):new ri(l,f),d.isSkinnedMesh===!0&&d.normalizeSkinWeights()}else if(u.mode===zf.LINES)d=new Ji(l,f);else if(u.mode===zf.LINE_STRIP)d=new Wi(l,f);else if(u.mode===zf.LINE_LOOP)d=new Yi(l,f);else if(u.mode===zf.POINTS)d=new ta(l,f);else throw Error(`THREE.GLTFLoader: Primitive mode unsupported: `+u.mode);Object.keys(d.geometry.morphAttributes).length>0&&Qf(d,i),d.name=t.createUniqueName(i.name||`mesh_`+e),Xf(d,i),u.extensions&&Yf(r,d,u),t.assignFinalMaterial(d),c.push(d)}for(let n=0,r=c.length;n<r;n++)t.associations.set(c[n],{meshes:e,primitives:n});if(c.length===1)return i.extensions&&Yf(r,c[0],i),c[0];let l=new On;i.extensions&&Yf(r,l,i),t.associations.set(l,{meshes:e});for(let e=0,t=c.length;e<t;e++)l.add(c[e]);return l})}loadCamera(e){let t,n=this.json.cameras[e],r=n[n.type];if(!r)console.warn(`THREE.GLTFLoader: Missing camera parameters.`);else return n.type===`perspective`?t=new us(kt.radToDeg(r.yfov),r.aspectRatio||1,r.znear||1,r.zfar||2e6):n.type===`orthographic`&&(t=new hs(-r.xmag,r.xmag,r.ymag,-r.ymag,r.znear,r.zfar)),n.name&&(t.name=this.createUniqueName(n.name)),Xf(t,n),Promise.resolve(t)}loadSkin(e){let t=this.json.skins[e],n=[];for(let e=0,r=t.joints.length;e<r;e++)n.push(this._loadNodeShallow(t.joints[e]));return t.inverseBindMatrices===void 0?n.push(null):n.push(this.getDependency(`accessor`,t.inverseBindMatrices)),Promise.all(n).then(function(e){let n=e.pop(),r=e,i=[],a=[];for(let e=0,o=r.length;e<o;e++){let o=r[e];if(o){i.push(o);let t=new Y;n!==null&&t.fromArray(n.array,e*16),a.push(t)}else console.warn(`THREE.GLTFLoader: Joint "%s" could not be found.`,t.joints[e])}return new bi(i,a)})}loadAnimation(e){let t=this.json,n=this,r=t.animations[e],i=r.name?r.name:`animation_`+e,a=[],o=[],s=[],c=[],l=[];for(let e=0,t=r.channels.length;e<t;e++){let t=r.channels[e],n=r.samplers[t.sampler],i=t.target,u=i.node,d=r.parameters===void 0?n.input:r.parameters[n.input],f=r.parameters===void 0?n.output:r.parameters[n.output];i.node!==void 0&&(a.push(this.getDependency(`node`,u)),o.push(this.getDependency(`accessor`,d)),s.push(this.getDependency(`accessor`,f)),c.push(n),l.push(i))}return Promise.all([Promise.all(a),Promise.all(o),Promise.all(s),Promise.all(c),Promise.all(l)]).then(function(e){let t=e[0],a=e[1],o=e[2],s=e[3],c=e[4],l=[];for(let e=0,r=t.length;e<r;e++){let r=t[e],i=a[e],u=o[e],d=s[e],f=c[e];if(r===void 0)continue;r.updateMatrix&&r.updateMatrix();let p=n._createAnimationTracks(r,i,u,d,f);if(p)for(let e=0;e<p.length;e++)l.push(p[e])}let u=new Ro(i,void 0,l);return Xf(u,r),u})}createNodeMesh(e){let t=this.json,n=this,r=t.nodes[e];return r.mesh===void 0?null:n.getDependency(`mesh`,r.mesh).then(function(e){let t=n._getNodeRef(n.meshCache,r.mesh,e);return r.weights!==void 0&&t.traverse(function(e){if(e.isMesh)for(let t=0,n=r.weights.length;t<n;t++)e.morphTargetInfluences[t]=r.weights[t]}),t})}loadNode(e){let t=this.json,n=this,r=t.nodes[e],i=n._loadNodeShallow(e),a=[],o=r.children||[];for(let e=0,t=o.length;e<t;e++)a.push(n.getDependency(`node`,o[e]));let s=r.skin===void 0?Promise.resolve(null):n.getDependency(`skin`,r.skin);return Promise.all([i,Promise.all(a),s]).then(function(e){let t=e[0],n=e[1],r=e[2];r!==null&&t.traverse(function(e){e.isSkinnedMesh&&e.bind(r,rp)});for(let e=0,r=n.length;e<r;e++)t.add(n[e]);if(t.userData.pivot!==void 0&&n.length>0){let e=t.userData.pivot,r=n[0];t.pivot=new J().fromArray(e),t.position.x-=e[0],t.position.y-=e[1],t.position.z-=e[2],r.position.set(0,0,0),delete t.userData.pivot}return t})}_loadNodeShallow(e){let t=this.json,n=this.extensions,r=this;if(this.nodeCache[e]!==void 0)return this.nodeCache[e];let i=t.nodes[e],a=i.name?r.createUniqueName(i.name):``,o=[],s=r._invokeOne(function(t){return t.createNodeMesh&&t.createNodeMesh(e)});return s&&o.push(s),i.camera!==void 0&&o.push(r.getDependency(`camera`,i.camera).then(function(e){return r._getNodeRef(r.cameraCache,i.camera,e)})),r._invokeAll(function(t){return t.createNodeAttachment&&t.createNodeAttachment(e)}).forEach(function(e){o.push(e)}),this.nodeCache[e]=Promise.all(o).then(function(t){let o;if(o=i.isBone===!0?new gi:t.length>1?new On:t.length===1?t[0]:new Dn,o!==t[0])for(let e=0,n=t.length;e<n;e++)o.add(t[e]);if(i.name&&(o.userData.name=i.name,o.name=a),Xf(o,i),i.extensions&&Yf(n,o,i),i.matrix!==void 0){let e=new Y;e.fromArray(i.matrix),o.applyMatrix4(e)}else i.translation!==void 0&&o.position.fromArray(i.translation),i.rotation!==void 0&&o.quaternion.fromArray(i.rotation),i.scale!==void 0&&o.scale.fromArray(i.scale);if(!r.associations.has(o))r.associations.set(o,{});else if(i.mesh!==void 0&&r.meshCache.refs[i.mesh]>1){let e=r.associations.get(o);r.associations.set(o,{...e})}return r.associations.get(o).nodes=e,o}),this.nodeCache[e]}loadScene(e){let t=this.extensions,n=this.json.scenes[e],r=this,i=new On;n.name&&(i.name=r.createUniqueName(n.name)),Xf(i,n),n.extensions&&Yf(t,i,n);let a=n.nodes||[],o=[];for(let e=0,t=a.length;e<t;e++)o.push(r.getDependency(`node`,a[e]));return Promise.all(o).then(function(e){for(let t=0,n=e.length;t<n;t++){let n=e[t];n.parent===null?i.add(n):i.add(rf(n))}return r.associations=(e=>{let t=new Map;for(let[e,n]of r.associations)(e instanceof zr||e instanceof Jt)&&t.set(e,n);return e.traverse(e=>{let n=r.associations.get(e);n!=null&&t.set(e,n)}),t})(i),i})}_createAnimationTracks(e,t,n,r,i){let a=[],o=e.name?e.name:e.uuid,s=[];function c(e){e.morphTargetInfluences&&s.push(e.name?e.name:e.uuid)}Gf[i.path]===Gf.weights?(c(e),e.isGroup&&e.children.forEach(c)):s.push(o);let l;switch(Gf[i.path]){case Gf.weights:l=No;break;case Gf.rotation:l=Fo;break;case Gf.translation:case Gf.scale:l=Lo;break;default:switch(n.itemSize){case 1:l=No;break;default:l=Lo}}let u=r.interpolation===void 0?je:Kf[r.interpolation],d=this._getArrayFromAccessor(n);for(let e=0,n=s.length;e<n;e++){let n=new l(s[e]+`.`+Gf[i.path],t.array,d,u);r.interpolation===`CUBICSPLINE`&&this._createCubicSplineTrackInterpolant(n),a.push(n)}return a}_getArrayFromAccessor(e){let t=e.array;if(e.normalized){let e=tp(t.constructor),n=new Float32Array(t.length);for(let r=0,i=t.length;r<i;r++)n[r]=t[r]*e;t=n}return t}_createCubicSplineTrackInterpolant(e){e.createInterpolant=function(e){return new(this instanceof Fo?Rf:If)(this.times,this.values,this.getValueSize()/3,e)},e.createInterpolant.isInterpolantFactoryMethodGLTFCubicSpline=!0}};function ap(e,t,n){let r=t.attributes,i=new Zn;if(r.POSITION!==void 0){let e=n.json.accessors[r.POSITION],t=e.min,a=e.max;if(t!==void 0&&a!==void 0){if(i.set(new J(t[0],t[1],t[2]),new J(a[0],a[1],a[2])),e.normalized){let t=tp(Bf[e.componentType]);i.min.multiplyScalar(t),i.max.multiplyScalar(t)}}else{console.warn(`THREE.GLTFLoader: Missing min/max properties for accessor POSITION.`);return}}else return;let a=t.targets;if(a!==void 0){let e=new J,t=new J;for(let r=0,i=a.length;r<i;r++){let i=a[r];if(i.POSITION!==void 0){let r=n.json.accessors[i.POSITION],a=r.min,o=r.max;if(a!==void 0&&o!==void 0){if(t.setX(Math.max(Math.abs(a[0]),Math.abs(o[0]))),t.setY(Math.max(Math.abs(a[1]),Math.abs(o[1]))),t.setZ(Math.max(Math.abs(a[2]),Math.abs(o[2]))),r.normalized){let e=tp(Bf[r.componentType]);t.multiplyScalar(e)}e.max(t)}else console.warn(`THREE.GLTFLoader: Missing min/max properties for accessor POSITION.`)}}i.expandByVector(e)}e.boundingBox=i;let o=new xr;i.getCenter(o.center),o.radius=i.min.distanceTo(i.max)/2,e.boundingSphere=o}function op(e,t,n){let r=t.attributes,i=[];function a(t,r){return n.getDependency(`accessor`,t).then(function(t){e.setAttribute(r,t)})}for(let t in r){let n=Wf[t]||t.toLowerCase();n in e.attributes||i.push(a(r[t],n))}if(t.indices!==void 0&&!e.index){let r=n.getDependency(`accessor`,t.indices).then(function(t){e.setIndex(t)});i.push(r)}return Rt.workingColorSpace!==`srgb-linear`&&`COLOR_0`in r&&console.warn(`THREE.GLTFLoader: Converting vertex colors from "srgb-linear" to "${Rt.workingColorSpace}" not supported.`),Xf(e,t),ap(e,t,n),Promise.all(i).then(function(){return t.targets===void 0?e:Zf(e,t.targets,n)})}function sp(e){return function(){e|=0,e=e+1831565813|0;let t=Math.imul(e^e>>>15,1|e);return t=t+Math.imul(t^t>>>7,61|t)^t,((t^t>>>14)>>>0)/4294967296}}function cp(){let e=document.createElement(`canvas`);e.width=e.height=256;let n=e.getContext(`2d`),r=sp(2024);n.fillStyle=`rgb(92,110,72)`,n.fillRect(0,0,256,256);for(let e=0;e<3;e++){let t=e===0?1500:1300;for(let i=0;i<t;i++){let t=r()*256,i=r()*256,a=6+r()*7,o=a*(.38+r()*.2),s=r()*Math.PI,c=(e===0?128:e===1?158:190)+r()*45,l=c*(.86+r()*.16),u=c,d=c*(.72+r()*.2);n.fillStyle=`rgb(${l|0},${u|0},${d|0})`;for(let e of[-256,0,256])for(let r of[-256,0,256])t+e<-16||t+e>272||i+r<-16||i+r>272||(n.beginPath(),n.ellipse(t+e,i+r,a/2,o/2,s,0,Math.PI*2),n.fill())}}let i=new ia(e);return i.wrapS=i.wrapT=t,i.generateMipmaps=!0,i.minFilter=l,i.anisotropy=4,i}function lp(e,t,n){let r=new kr;return r.setAttribute(`position`,new Z(e,3)),r.setAttribute(`normal`,new Z(t,3)),r.setAttribute(`aTree`,new Z(n,4)),r}function up(e,t,n,r){let i=[],a=[],o=[],s=0,c=0,l=0,u=0;for(let[t,n,r,i]of e)s+=t*i,c+=n*i,l+=r*i,u+=i;s/=u,c/=u,l/=u;let d=new J;e.forEach(([e,u,f,p],m)=>{let h=new Xa(1,t),g=h.attributes.position,_=r+m*7.3;for(let t=0;t<g.count;t++){d.fromBufferAttribute(g,t).normalize();let r=p*(1+.24*(Math.sin(d.x*5.1+_)*Math.sin(d.y*4.3+_*1.7)*Math.sin(d.z*4.7+_*.3))+.09*Math.sin(d.x*11+d.z*9+_*2.1)),m=e+d.x*r,h=u+d.y*r*n,v=f+d.z*r;i.push(m,h,v);let y=m-s,b=(h-c)*1.2,x=v-l,S=Math.hypot(y,b,x)||1,C=d.x*.45+y/S*.55,w=d.y*.45+b/S*.55,T=d.z*.45+x/S*.55,E=Math.hypot(C,w,T)||1;a.push(C/E,w/E,T/E),o.push(S,0,0,0)}h.dispose()});let f=1/0,p=-1/0,m=0;for(let e=0;e<i.length;e+=3)f=Math.min(f,i[e+1]),p=Math.max(p,i[e+1]),m=Math.max(m,o[e/3*4]);for(let e=0;e<i.length/3;e++){let t=(i[e*3+1]-f)/(p-f),n=o[e*4]/m;o[e*4]=.3+.7*Math.max(0,Math.min(1,.62*t+.62*n-.18))}return lp(i,a,o)}function dp(e,t,n,r=6,i=.75){let a=new ua(n,t,e,r,1,!0).toNonIndexed();a.translate(0,e/2,0);let o=a.attributes.position.count,s=new Float32Array(o*4);for(let t=0;t<o;t++)s[t*4]=i-.35*(a.attributes.position.getY(t)/e),s[t*4+1]=1;return a.deleteAttribute(`uv`),a.setAttribute(`aTree`,new hr(s,4)),a}function fp(e,t,n,r,i,a){let o=[];for(let s=0;s<e;s++){let e=i-s*a,c=new da(e,r*1.5,t,1,!1).toNonIndexed();c.translate(0,n+s*r+r*.75,0);let l=c.attributes.position.count,u=new Float32Array(l*4);for(let t=0;t<l;t++){let n=Math.hypot(c.attributes.position.getX(t),c.attributes.position.getZ(t))/e;u[t*4]=.35+.65*n}c.deleteAttribute(`uv`),c.setAttribute(`aTree`,new hr(u,4)),o.push(c)}return ld(o)}function pp(e,t,n,r){let i=[],a=[],o=[],s=new J,c=new J;new J;let l=new J,u=(e,t,n,r,u,d)=>{s.subVectors(t,e),c.subVectors(n,e),l.crossVectors(s,c).normalize(),l.y<0&&l.negate();for(let[s,c]of[[e,r],[t,u],[n,d]])i.push(s.x,s.y,s.z),a.push(l.x*.6,l.y*.6+.4,l.z*.6),o.push(.55+.45*c[0],2,c[0],c[1])};for(let i=0;i<e;i++){let a=i/e*Math.PI*2+i%2*.2,o=.75-i%3*.32,s=r*(.9+i%4*.05),c=Math.cos(a),l=Math.sin(a),d=[],f=[];for(let e=0;e<=t;e++){let r=e/t,i=s*(r-.18*r*r),a=n+s*(o*.42*Math.sin(r*1.9)-.48*r*r);d.push(new J(c*i,a,l*i)),f.push(.12+1.15*Math.sin(Math.PI*Math.min(1,r*.92+.06))**.7)}for(let e=0;e<t;e++){let n=e/t,r=(e+1)/t;for(let t of[-1,1]){let i=new J(d[e].x-l*f[e]*t,d[e].y-.38*f[e],d[e].z+c*f[e]*t),a=new J(d[e+1].x-l*f[e+1]*t,d[e+1].y-.38*f[e+1],d[e+1].z+c*f[e+1]*t);u(d[e],d[e+1],a,[n,0],[r,0],[r,t]),u(d[e],a,i,[n,0],[r,t],[n,t])}}}return lp(i,a,o)}function mp(e){return e.attributes.uv&&e.deleteAttribute(`uv`),e}function hp(e,t){if(e===5)return ld([up(t?[[0,7,0,3],[2.8,6.7,.5,2.5],[-2.6,6.8,1.2,2.5],[-.6,6.6,-2.8,2.5],[1.4,6.9,-2,2.2]]:[[0,6.9,0,3.6],[2.4,6.6,.8,2.8],[-2.3,6.6,-1,2.8]],+!!t,.55,5.5),dp(5.6,.34,.2,t?6:4)]);let n=+!!t;if(e===0)return ld([up(t?[[0,7.3,0,3.4],[2.9,6.6,.6,2.8],[-2.6,6.9,1.6,2.7],[-.9,6.5,-3,2.8],[1.6,7,-2.2,2.4],[.4,6.3,3,2.3]]:[[0,7.2,0,3.9],[2.6,6.6,1,3],[-2.4,6.7,-1.2,3.1]],n,.72,1.3),dp(5.2,.5,.34,t?7:4)]);if(e===1)return ld([up(t?[[0,7.6,0,2.7],[.2,10.3,.1,2.1],[1.5,7,.8,2],[-1.4,7.9,.6,2],[.1,7.2,-1.6,2]]:[[0,7.6,0,3],[.2,10.1,.1,2.2]],n,.95,4.1),dp(5.6,.32,.2,t?6:4)]);if(e===2){let e=[pp(t?11:6,t?5:2,10.9,4.3),dp(9.6,.3,.2,t?7:4,.95)],n=dp(1.5,.2,.16,t?7:4,1);return n.translate(0,9.6,0),e.push(n),ld(e)}return ld(e===3?[up(t?[[0,4.9,0,2.3],[1.9,4.5,.4,1.8],[-1.3,4.6,1.5,1.8],[-.8,4.4,-1.8,1.8]]:[[0,4.8,0,2.6],[1.4,4.5,.8,2]],n,.8,8.8),dp(3.3,.24,.15,t?6:4)]:[mp(fp(t?7:3,t?9:6,3,t?1.55:3.6,2.9,t?.36:.85)),dp(13.5,.28,.06,t?6:4)])}function gp(e,t,n){return new co({uniforms:_d({uLeaf:{value:e},uFlower:{value:new Yt(...t)},uTrunk:{value:new J(...n)}}),side:2,vertexShader:`
      attribute vec4 aTree;
      varying vec3 vWorld; varying vec3 vN; varying vec3 vObj; varying vec3 vCol; varying vec4 vTree;
      void main(){
        vec4 lp = vec4(position, 1.0); vec3 ln = normal;
        vCol = vec3(0.1, 0.25, 0.06);
        #ifdef USE_INSTANCING
          lp = instanceMatrix * lp; ln = mat3(instanceMatrix) * ln;
        #endif
        #ifdef USE_INSTANCING_COLOR
          vCol = instanceColor;
        #endif
        vec4 wp = modelMatrix * lp; vWorld = wp.xyz; vN = normalize(mat3(modelMatrix) * ln);
        vObj = position; vTree = aTree;
        gl_Position = projectionMatrix * viewMatrix * wp;
      }`,fragmentShader:`
      ${bd}
      uniform sampler2D uLeaf; uniform vec4 uFlower; uniform vec3 uTrunk;
      varying vec3 vWorld; varying vec3 vN; varying vec3 vObj; varying vec3 vCol; varying vec4 vTree;
      void main(){
        vec3 n = normalize(vN);
        vec3 V = normalize(vWorld - cameraPosition);
        float part = vTree.y, ao = clamp(vTree.x, 0.0, 1.0);
        float dist = distance(vWorld, cameraPosition);
        vec3 col;
        if (part > 0.5 && part < 1.5) {
          if (dot(n, V) > 0.0) n = -n;
          vec3 alb = uTrunk * (0.75 + 0.5 * vnoise(vec2(atan(vObj.z, vObj.x) * 5.0, vObj.y * 1.3)));
          col = lightLin(alb, n, sunShadow(vWorld, n), ao);
        } else {
          vec4 tx;
          if (part > 1.5) {
            // 棕榈叶：按小叶镂空
            if (n.y < 0.0) n = -n;
            float u = vTree.z * 34.0 - abs(vTree.w) * 2.5;
            if (fwidth(u) < 0.8 && abs(vTree.w) > 0.10 && fract(u) > 0.62) discard;
            tx = vec4(vec3(0.66 + 0.2 * hash11(floor(u))), 1.0);
          } else {
            vec3 w = abs(n); w *= w; w /= (w.x + w.y + w.z);
            const float S = 0.27;
            tx = texture2D(uLeaf, vObj.zy * S) * w.x + texture2D(uLeaf, vObj.xz * S) * w.y + texture2D(uLeaf, vObj.xy * S) * w.z;
            // 轮廓处按叶片缝隙镂空，打碎多面体外形
            float rim = 1.0 - abs(dot(n, V));
            float nearF = 1.0 - smoothstep(90.0, 260.0, dist);
            float gapv = smoothstep(0.42, 0.54, dot(tx.rgb, vec3(0.333)));
            tx.a = gapv;
            // 越靠轮廓镂空越多，把多面体的直边咬碎
            if (gapv < smoothstep(0.30, 0.82, rim) * 0.95 * nearF) discard;
          }
          float cover = smoothstep(0.25, 0.85, tx.a);
          vec3 alb = vCol * toLin(tx.rgb) * 1.9 * mix(0.80, 1.0, cover);
          if (uFlower.a > 0.0 && part < 0.5) {
            float f = vnoise(vObj.xz * 1.1 + vObj.y * 0.7) * 0.6 + vnoise(vObj.xy * 2.7 + 3.0) * 0.4;
            float fm = smoothstep(1.0 - uFlower.a, 1.0 - uFlower.a + 0.12, f) * cover;
            alb = mix(alb, toLin(uFlower.rgb) * (0.6 + 0.8 * toLin(tx.rgb).g * 1.6), fm);
          }
          float ndl = dot(n, uSunDir);
          float wrap = clamp((ndl + 0.42) / 1.42, 0.0, 1.0);
          float sh = sunShadowOff(vWorld, n, 0.7);
          float back = pow(max(dot(V, uSunDir), 0.0), 2.0) * (1.0 - wrap);
          vec3 lin = alb * (sunE() * wrap * sh * (0.5 + 0.5 * ao) + ambientLin(n) * ao)
                   + alb * vec3(1.2, 1.4, 0.45) * back * sh * 0.55 * (1.0 - uNight * 0.94);
          col = toneMap(lin);
        }
        gl_FragColor = vec4(atmo(col, vWorld), 1.0);
      }`})}var _p=[{h:[.285,.04],s:[.46,.14],l:[.15,.06],flower:[0,0,0,0],trunk:[.16,.12,.09]},{h:[.265,.045],s:[.46,.14],l:[.17,.07],flower:[0,0,0,0],trunk:[.13,.1,.08]},{h:[.27,.03],s:[.48,.12],l:[.2,.05],flower:[0,0,0,0],trunk:[.36,.34,.3]},{h:[.29,.04],s:[.44,.12],l:[.17,.06],flower:[.93,.33,.6,.46],trunk:[.14,.11,.09]},{h:[.35,.03],s:[.4,.1],l:[.12,.04],flower:[0,0,0,0],trunk:[.12,.09,.07]},{h:[.27,.04],s:[.46,.12],l:[.17,.06],flower:[.95,.3,.12,.5],trunk:[.14,.11,.09]}];function vp(e){return e===0?up([[0,6.9,0,5.2]],0,.62,1.3):e===1?up([[0,8.4,0,3.6]],0,1.25,4.1):e===3?up([[0,4.7,0,3.2]],0,.8,8.8):e===5?up([[0,6.6,0,4.6]],0,.5,5.5):hp(e,!1)}var yp=[{name:`banyan`,H:12.5,top:.6},{name:`mango`,H:11.5,top:.62},{name:`royalpalm`,H:15,top:.84},{name:`bauhinia`,H:8,top:.66},{name:`araucaria`,H:17,top:.3},{name:`flame`,H:9.5,top:.66}];function bp(e,t,n,r){let i=[],a=[],o=[],s=(e,t)=>{let n=i.length/3;e.forEach(([e,n,r,o,s])=>{i.push(e,n,r),a.push((t+o)/3,s)}),o.push(n,n+1,n+2,n,n+2,n+3)},c=-t*e,l=c+e,u=e/2;for(let[e,t]of[[0,0],[Math.PI/2,1],[Math.PI/4,0],[Math.PI*.75,1]]){let n=Math.cos(e)*u,r=-Math.sin(e)*u;s([[-n,c,-r,0,0],[n,c,r,1,0],[n,l,r,1,1],[-n,l,-r,0,1]],t)}let d=n*r;s([[-u,d,u,0,0],[u,d,u,1,0],[u,d,-u,1,1],[-u,d,-u,0,1]],2);let f=new kr;return f.setAttribute(`position`,new Z(i,3)),f.setAttribute(`uv`,new Z(a,2)),f.setIndex(o),f.computeBoundingSphere(),f}function xp(e){return new co({uniforms:_d({uCard:{value:e},uNearR:{value:0}}),side:2,vertexShader:`
      uniform float uNearR;
      varying vec2 vUv; varying vec3 vWorld; varying vec3 vCol;
      void main(){
        vec4 lp = vec4(position, 1.0); vCol = vec3(1.0);
        #ifdef USE_INSTANCING
          lp = instanceMatrix * lp;
        #endif
        #ifdef USE_INSTANCING_COLOR
          vCol = instanceColor;
        #endif
        vec4 wp = modelMatrix * lp; vWorld = wp.xyz; vUv = uv;
        gl_Position = projectionMatrix * viewMatrix * wp;
        // 5j：离相机 uNearR 以内的树由三维网格接管，这棵的插片整棵不画
        #ifdef USE_INSTANCING
          vec3 org = (modelMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
          if (uNearR > 0.0 && distance(org, cameraPosition) < uNearR) gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
        #endif
      }`,fragmentShader:`
      ${bd}
      uniform sampler2D uCard;
      varying vec2 vUv; varying vec3 vWorld; varying vec3 vCol;
      void main(){
        vec4 t = texture2D(uCard, vUv);
        if (t.a < 0.5) discard;
        // 水平那一片只给从上往下看用：平视时它是一条线，直接不画
        if (vUv.x > 0.6667 && abs(normalize(vWorld - cameraPosition).y) < 0.30) discard;
        // 贴图里已经带了明暗，这里只乘上太阳 / 环境光的整体强度和楼的投影
        vec3 up = vec3(0.0, 1.0, 0.0);
        float sh = sunShadowOff(vWorld, up, 1.2);
        vec3 lin = toLin(t.rgb) * vCol * (sunE() * 0.36 * (0.35 + 0.65 * sh) + ambientLin(up) * 0.95);
        gl_FragColor = vec4(atmo(toneMap(lin), vWorld), 1.0);
      }`})}function Sp(){let e=cp(),t=_p.map(t=>gp(e,t.flower,t.trunk)),n=[[],[],[]];for(let e=0;e<6;e++)n[0].push(hp(e,!0)),n[1].push(hp(e,!1)),n[2].push(vp(e));let r={mats:t,geo:n,cards:[,,,,,,].fill(null),near:[,,,,,,].fill(null),onReady:null},i=new of;yp.forEach((e,t)=>{i.loadAsync(`/models/trees/`+e.name+`-near.glb`).then(e=>{let n=null;e.scene.updateMatrixWorld(!0),e.scene.traverse(e=>{e.isMesh&&!n&&(n=e)});let i=n.geometry.clone().applyMatrix4(n.matrixWorld),a=n.material;a.metalness=0,a.roughness=1,a.side=2,a.envMapIntensity=.45,Md(a);let o=new ki(i,a,150);o.instanceMatrix.setUsage(Ue),o.frustumCulled=!1,o.count=0,r.near[t]=o,r.onNear&&r.onNear(o)}).catch(t=>console.warn(`[futian] 近景树 `+e.name+`-near.glb 加载失败，这一种近处继续用插片：`,t&&t.message?t.message:t))});let a=e=>new Promise((t,n)=>{let r=new Image;r.onload=()=>t(r),r.onerror=()=>n(Error(`图片加载失败 `+e)),r.src=e});return yp.forEach((e,t)=>{let n=`/models/trees/`+e.name;Promise.all([fetch(n+`-card.json`).then(e=>e.json()),a(n+`-front.png`),a(n+`-side.png`),a(n+`-top.png`)]).then(([n,i,a,o])=>{let s=document.createElement(`canvas`);s.width=1536,s.height=512;let c=s.getContext(`2d`);c.drawImage(i,0,0,512,512),c.drawImage(a,512,0,512,512),c.drawImage(o,1024,0,512,512);let u=new ia(s);u.colorSpace=``,u.generateMipmaps=!0,u.minFilter=l,u.anisotropy=4,r.cards[t]={geo:bp(n.frame*e.H,n.pad,e.top,e.H),mat:xp(u)},r.onReady&&r.onReady(e.name)}).catch(t=>console.warn(`[futian] 树 `+e.name+` 的插片图加载失败，这一种继续用程序化的树：`,t&&t.message?t.message:t))}),r}function Cp(e,t,n){let r=sp(n),i=Array.from({length:6},()=>[]);for(let e of t)i[e[3]||0].push(e);let a=new On,o=[[],[],[]],s=[],c=[],l=new Y,u=new At,d=new J,f=new J,p=new X,m=new J(0,1,0);for(let t=0;t<6;t++){let h=i[t];if(!h.length)continue;let g=e.cards[t],_=new ki(e.geo[0][t],e.mats[t],h.length),v=_p[t];h.forEach(([e,t,n],i)=>{u.setFromAxisAngle(m,r()*6.283);let a=n*(.88+r()*.28);d.set(a,n*(.88+r()*.26),a),f.set(e,$(e,t)-.15,t),l.compose(f,u,d),_.setMatrixAt(i,l),p.setHSL(v.h[0]+r()*v.h[1],v.s[0]+r()*v.s[1],v.l[0]+r()*v.l[1]),_.setColorAt(i,p)}),_.computeBoundingSphere(),s.push(_),c.push({sp:t,arr:_.instanceMatrix.array,n:h.length});let y=(e,t,n)=>{let r=new ki(e,t,h.length);return r.instanceMatrix=_.instanceMatrix,r.instanceColor=n,r.boundingSphere=_.boundingSphere,r},b=y(e.geo[2][t],e.mats[t],_.instanceColor),x=y(e.geo[1][t],e.mats[t],_.instanceColor);if(x.layers.set(1),a.add(x),g){let e=new Float32Array(h.length*3);for(let t=0;t<h.length;t++){let r=.8+(t*7919+n)%97/97*.26;e[t*3]=r,e[t*3+1]=r*(.97+t*31%7/100),e[t*3+2]=r*.96}let t=y(g.geo,g.mat,new xi(e,3));t.visible=!1,b.visible=!1,o[0].push(t),o[1].push(t),o[2].push(b),a.add(t,b)}else{let n=y(e.geo[1][t],e.mats[t],_.instanceColor);for(let e of[_,n,b])e.visible=!1;o[0].push(_),o[1].push(n),o[2].push(b),a.add(_,n,b)}}return{group:a,setLod:e=>{for(let e=0;e<3;e++)for(let t of o[e])t.visible=!1;for(let t of o[e])t.visible=!0},dispose:()=>{for(let e of s)e.dispose()},count:t.length,inst:c}}var wp=400,Tp=300,Ep=1500;function Dp(e){return function(){e|=0,e=e+1831565813|0;let t=Math.imul(e^e>>>15,1|e);return t=t+Math.imul(t^t>>>7,61|t)^t,((t^t>>>14)>>>0)/4294967296}}var Op=(e,t)=>e*100003+t,kp=class{constructor(e,t,n,r){this.city=e,this.grid=t,this.scene=n,this.onChange=r||(()=>{}),this.kit=Sp(),this.kit.onReady=()=>{this.dirty=!0},this.kit.onNear=e=>{this.scene.add(e)},this.nearCount=0,this.nearR=0,this.tiles=new Map,this.count=0;let i=e.roadClasses,a=new Set([`pedestrian`,`footway`,`path`,`steps`,`track`,`cycleway`]),o=this.segGrid=new Map,s=this.SC=40;for(let t of e.roads){if(a.has(i[t[0]]))continue;let e=t[4],n=t[1]/2+1.4;for(let t=2;t<e.length;t+=2){let r=[e[t-2],e[t-1],e[t],e[t+1],n],i=Math.floor((Math.min(r[0],r[2])-n)/s),a=Math.floor((Math.max(r[0],r[2])+n)/s),c=Math.floor((Math.min(r[1],r[3])-n)/s),l=Math.floor((Math.max(r[1],r[3])+n)/s);for(let e=i;e<=a;e++)for(let t=c;t<=l;t++){let n=e*1e5+t,i=o.get(n);i||o.set(n,i=[]),i.push(r)}}}let c=(e,t,n,r,i,a)=>{for(let o=Math.floor(t/wp);o<=Math.floor(n/wp);o++)for(let t=Math.floor(r/wp);t<=Math.floor(i/wp);t++){let n=Op(o,t),r=e.get(n);r||e.set(n,r=[]),r.push(a)}},l=e=>{let t=1/0,n=-1/0,r=1/0,i=-1/0;for(let a=0;a<e.length;a+=2)t=Math.min(t,e[a]),n=Math.max(n,e[a]),r=Math.min(r,e[a+1]),i=Math.max(i,e[a+1]);return[t,n,r,i]};this.roadsBy=new Map,this.greenBy=new Map,this.hardBy=new Map,this.plazas=[],e.roads.forEach((e,t)=>{let n=i[e[0]];if(![`trunk`,`primary`,`secondary`,`tertiary`].includes(n)||e[5])return;let[r,a,o,s]=l(e[4]);c(this.roadsBy,r-12,a+12,o-12,s+12,t)}),e.areas.forEach((e,t)=>{let[n,r]=e,i=l(r[0]);[`park`,`wood`,`grass`].includes(n)?c(this.greenBy,i[0],i[1],i[2],i[3],{kind:n,rings:r,bb:i,ai:t}):(c(this.hardBy,i[0],i[1],i[2],i[3],{f:r[0],bb:i,water:n===`water`}),n===`civicplaza`&&this.plazas.push({f:r[0],bb:i}))}),this.sea=e.sea||null}onRoad(e,t){let n=this.segGrid.get(Math.floor(e/this.SC)*1e5+Math.floor(t/this.SC));if(!n)return!1;for(let[r,i,a,o,s]of n){let n=a-r,c=o-i,l=n*n+c*c||1,u=Math.max(0,Math.min(1,((e-r)*n+(t-i)*c)/l)),d=r+n*u-e,f=i+c*u-t;if(d*d+f*f<s*s)return!0}return!1}inSea(e,t){let n=this.sea;if(!n)return!1;let r=Math.floor((e-n.x0)/n.cell),i=Math.floor((t-n.z0)/n.cell);if(i<0||i>=n.h)return!1;let a=n.rows[i];for(let e=0;e<a.length;e+=2)if(r>=a[e]&&r<a[e]+a[e+1])return!0;return!1}points(e,t){let{city:n,grid:r}=this,i=e*wp,a=i+wp,o=t*wp,s=o+wp,c=n.bounds;if(a<c.x0||i>c.x1||s<c.z0||o>c.z1)return[];let l=Op(e,t),u=Dp(l*2654435761|0),d=[],f=(e,t)=>e>=i&&e<a&&t>=o&&t<s,p=(e,t)=>r.query(e,t).some(n=>n.bottom<12&&nf(e,t,n)),m=(e,t)=>this.onRoad(e,t)||p(e,t),h=(e,t,n)=>p(e+n,t)||p(e-n,t)||p(e,t+n)||p(e,t-n),g=new Set,_=(this.hardBy.get(l)||[]).filter(e=>e.water),v=(e,t,n,r,i=4)=>{let a=Math.floor(e/i)*100003+Math.floor(t/i);if(g.has(a))return!1;for(let n of _)if(e>=n.bb[0]&&e<=n.bb[1]&&t>=n.bb[2]&&t<=n.bb[3]&&ef(e,t,n.f))return!1;return g.add(a),d.push([e,t,n,r]),!0},y=e=>e<.42?0:e<.72?1:e<.84?3:e<.93?4:2,b=n.roadClasses;for(let e of this.roadsBy.get(l)||[]){let t=n.roads[e],r=b[t[0]]!==`tertiary`,i=t[4],a=t[1]/2+2.8,o=t[7]||String(i[0]),s=0;for(let e of o)s=s*31+e.charCodeAt(0)|0;let c=Math.abs(s)%6,l=o.includes(`深南`),u=l?0:c===0?2:+(c<=2),d=u===2?7:r?8:9,p=Dp(e*7919+13),g=0;for(let e=2;e<i.length;e+=2){let t=i[e-2],n=i[e-1],o=i[e],s=i[e+1],c=Math.hypot(o-t,s-n);if(c<.1)continue;let _=-(s-n)/c,y=(o-t)/c;for(let e=d-g;e<c;e+=d){let i=t+(o-t)*e/c,d=n+(s-n)*e/c;for(let e of[-1,1]){let t=p(),n=p(),o=p(),s=p(),c=i+_*a*e,g=d+y*a*e;f(c,g)&&!m(c,g)&&!h(c,g,2.5)&&v(c,g,u===2?.9+t*.2:(r?.78:.66)+t*.2,u,5);let b=i+_*(a+6.5)*e,x=d+y*(a+6.5)*e;r&&n<.75&&f(b,x)&&!m(b,x)&&!h(b,x,3)&&v(b,x,.7+o*.4,l?s<.55?3:1:s<.3?3:+(s<.6),5)}}g=(g+c)%d}}for(let e of this.greenBy.get(l)||[]){let t=Math.max(i,e.bb[0]),n=Math.min(a,e.bb[1]),r=Math.max(o,e.bb[2]),c=Math.min(s,e.bb[3]);if(n<=t||c<=r)continue;let l=e.kind===`wood`?1/75:e.kind===`park`?1/170:1/420,d=Math.min(2600,Math.floor((n-t)*(c-r)*l)),f=e.rings[0];for(let i=0;i<d;i++){let i=t+u()*(n-t),a=r+u()*(c-r),o=u(),s=u();if(!ef(i,a,f))continue;let l=!1;for(let t=1;t<e.rings.length;t++)if(ef(i,a,e.rings[t])){l=!0;break}l||m(i,a)||h(i,a,3)||e.kind!==`wood`&&Math.sin(i*.021+1.3)*Math.cos(a*.017+.4)+Math.sin(i*.006-a*.008)*.6<-.25||v(i,a,.75+o*.55,e.kind===`wood`?s<.6?0:1:y(s))}}for(let e of this.plazas){let[t,n,r,c]=e.bb;if(n<i||t>a||c<o||r>s)continue;let l=(t+n)/2;for(let t=r+10;t<c-10;t+=9)for(let n of[-1,1])for(let r=0;r<5;r++){let i=l+n*(20+r*46);f(i,t)&&ef(i,t,e.f)&&!m(i,t)&&v(i,t,.62+u()*.1,1)}}let x=cd(),S=760*.72;if(a>x.x-S&&i<x.x+S&&s>x.z-S&&o<x.z+S){let e=Math.floor(wp*wp*6500/(Math.PI*S*S));for(let t=0;t<e;t++){let e=i+u()*wp,t=o+u()*wp,n=u(),r=u();Math.hypot(e-x.x,t-x.z)>S||$(e,t)<4||m(e,t)||v(e,t,.8+n*.6,r<.65?0:1)}}let C=this.hardBy.get(l)||[],w=Math.floor(wp*wp/300);for(let e=0;e<w;e++){let e=i+u()*wp,t=o+u()*wp,n=u(),r=u();if(e<c.x0||e>c.x1||t<c.z0||t>c.z1||m(e,t)||h(e,t,9)||p(e+6,t+6)||p(e-6,t-6)||p(e+6,t-6)||p(e-6,t+6)||this.onRoad(e+3,t)||this.onRoad(e-3,t)||this.onRoad(e,t+3)||this.onRoad(e,t-3))continue;let a=!1;for(let n of C)if(e>=n.bb[0]&&e<=n.bb[1]&&t>=n.bb[2]&&t<=n.bb[3]&&ef(e,t,n.f)){a=!0;break}a||this.inSea(e,t)||v(e,t,.65+n*.5,y(r),6)}for(let e of d)e[3]===3&&((Math.floor(e[0]*3.1)+Math.floor(e[1]*1.7))%5+5)%5<2&&(e[3]=5);return d.filter(e=>!this.inSea(e[0],e[1]))}updateNear(e,t,n){let r=this.kit,i=[];for(let a=t-1;a<=t+1;a++)for(let t=n-1;t<=n+1;t++){let n=this.tiles.get(Op(a,t));if(n&&n.tile)for(let t of n.tile.inst){if(!r.near[t.sp])continue;let n=t.arr;for(let r=0;r<t.n;r++){let a=r*16,o=n[a+12]-e.x,s=n[a+13]-e.y,c=n[a+14]-e.z,l=o*o+s*s+c*c;l<3844&&i.push([l,t.sp,n,a])}}}let a=62;i.length>150&&(i.sort((e,t)=>e[0]-t[0]),a=Math.sqrt(i[150][0]),i.length=150);let o=Array(r.near.length).fill(0);for(let[,e,t,n]of i)r.near[e].instanceMatrix.array.set(t.subarray(n,n+16),o[e]*16),o[e]++;r.near.forEach((e,t)=>{r.cards[t]&&(r.cards[t].mat.uniforms.uNearR.value=e?a:0),e&&(e.count=o[t],e.instanceMatrix.needsUpdate=!0)}),this.nearCount=i.length,this.nearR=a}update(e){if(this.dirty){this.dirty=!1;for(let e of this.tiles.values())e.tile&&(this.scene.remove(e.tile.group),e.tile.dispose(),this.count-=e.tile.count);this.tiles.clear()}let t=Math.max(0,e.y),n=Math.min(2500,1500+t*1.1),r=Math.floor(e.x/wp),i=Math.floor(e.z/wp),a=Math.ceil(n/wp),o=[];for(let s=r-a;s<=r+a;s++)for(let r=i-a;r<=i+a;r++){let i=Math.hypot((s+.5)*wp-e.x,(r+.5)*wp-e.z);if(i>n)continue;let a=Op(s,r),c=this.tiles.get(a);if(c){let e=i<Tp&&t<700?0:i<Ep?1:2;c.lod!==e&&c.tile&&(c.tile.setLod(e),c.lod=e)}else o.push([i,s,r,a])}if(o.length){o.sort((e,t)=>e[0]-t[0]);let e=0;for(let[n,r,i,a]of o){let o=this.points(r,i),s={i:r,j:i,tile:null,lod:-1};if(o.length&&(s.tile=Cp(this.kit,o,a),s.lod=n<Tp&&t<700?0:n<Ep?1:2,s.tile.setLod(s.lod),this.scene.add(s.tile.group),this.count+=o.length),this.tiles.set(a,s),++e>=(this.fast?400:2))break}this.onChange()}if(this.updateNear(e,r,i),this.tiles.size>260)for(let[t,r]of this.tiles)Math.hypot((r.i+.5)*wp-e.x,(r.j+.5)*wp-e.z)>n+700&&(r.tile&&(this.scene.remove(r.tile.group),r.tile.dispose(),this.count-=r.tile.count),this.tiles.delete(t));return o.length}},Ap=class{constructor(){this.P=[],this.N=[],this.U=[],this.C=[],this.C2=[],this.M=[],this.I=[],this.FX=[],this.fx=[0,0]}quad(e,t,n,r,i,a,o){let{P:s,N:c,U:l,C:u,C2:d,M:f,I:p}=this,m=s.length/3,h=[t[0]-e[0],t[1]-e[1],t[2]-e[2]],g=[r[0]-e[0],r[1]-e[1],r[2]-e[2]],_=h[1]*g[2]-h[2]*g[1],v=h[2]*g[0]-h[0]*g[2],y=h[0]*g[1]-h[1]*g[0],b=Math.hypot(_,v,y)||1;if(_/=b,v/=b,y/=b,!a){if(Math.abs(v)>.85)a=[e,t,n,r].map(e=>[e[0],e[2]]);else{let o=Math.hypot(h[0],h[2]);if(o>1e-4){let s=h[0]/o,c=h[2]/o,l=i.u0||0;a=[e,t,n,r].map(t=>[l+(t[0]-e[0])*s+(t[2]-e[2])*c,t[1]])}else{let i=Math.hypot(g[0],g[2])||1,o=g[0]/i,s=g[2]/i;a=[e,t,n,r].map(t=>[(t[0]-e[0])*o+(t[2]-e[2])*s,t[1]])}}}let x=[e,t,n,r],S=i.col||[.8,.8,.8],C=i.col2||[.2,.3,.4],w=i.p||[1,1,0];for(let e=0;e<4;e++)s.push(x[e][0],x[e][1],x[e][2]),o?c.push(...o[e]):c.push(_,v,y),l.push(a[e][0],a[e][1]),u.push(S[0],S[1],S[2]),d.push(C[0],C[1],C[2]),f.push(i.mat||0,w[0],w[1],w[2]||0),this.FX.push(i.fx?i.fx[0]:this.fx[0],i.fx?i.fx[1]:this.fx[1]);p.push(m,m+1,m+2,m,m+2,m+3)}prism(e,t,n,r,{cap:i=!0,bottom:a=!1,capO:o=null}={}){let s=e.length,c=0;for(let i=0;i<s;i++){let a=e[i],o=e[(i+1)%s],l=Math.hypot(o[0]-a[0],o[1]-a[1]);this.quad([a[0],t,a[1]],[o[0],t,o[1]],[o[0],n,o[1]],[a[0],n,a[1]],{...r,u0:r.wrapU?c:-l/2}),c+=l}let l=o||{mat:0,col:(r.col||[.8,.8,.8]).map(e=>e*.9)};for(let[r,o]of[[i,n],[a,t]])if(r)for(let t=1;t<s-1;t+=2){let n=e[0],r=e[t],i=e[t+1],a=e[Math.min(t+2,s-1)];this.quad([n[0],o,n[1]],[r[0],o,r[1]],[i[0],o,i[1]],[a[0],o,a[1]],l)}}box(e,t,n,r,i,a,o,s){this.prism([[e,i],[t,i],[t,a],[e,a]],n,r,o,s)}strut(e,t,n,r){let i=new J(t[0]-e[0],t[1]-e[1],t[2]-e[2]),a=Math.abs(i.y)/i.length()>.95?new J(1,0,0):new J(0,1,0),o=new J().crossVectors(i,a).normalize().multiplyScalar(n/2),s=new J().crossVectors(i,o).normalize().multiplyScalar(n/2),c=(e,t,n)=>[e[0]+o.x*t+s.x*n,e[1]+o.y*t+s.y*n,e[2]+o.z*t+s.z*n],l=[[-1,-1],[1,-1],[1,1],[-1,1]],u=i.length();for(let i=0;i<4;i++){let[a,o]=l[i],[s,d]=l[(i+1)%4];this.quad(c(e,a,o),c(e,s,d),c(t,s,d),c(t,a,o),r,[[0,0],[n,0],[n,u],[0,u]])}}build(){let e=new kr;return e.setAttribute(`position`,new Z(this.P,3)),e.setAttribute(`normal`,new Z(this.N,3)),e.setAttribute(`uv`,new Z(this.U,2)),e.setAttribute(`aCol`,new Z(this.C,3)),e.setAttribute(`aCol2`,new Z(this.C2,3)),e.setAttribute(`aMat`,new Z(this.M,4)),e.setAttribute(`aFx`,new Z(this.FX,2)),e.setIndex(this.I),e.computeBoundingSphere(),e.computeBoundingBox(),e}},jp=null;function Mp(){return jp||(jp=new co({uniforms:_d(),side:2,vertexShader:`
      attribute vec3 aCol; attribute vec3 aCol2; attribute vec4 aMat; attribute vec2 aFx;
      varying vec2 vUv; varying vec3 vCol; varying vec3 vCol2; varying vec4 vMat; varying vec3 vN; varying vec3 vWorld; varying vec2 vFx;
      void main(){
        vUv = uv; vCol = aCol; vCol2 = aCol2; vMat = aMat; vFx = aFx;
        vN = normalize(mat3(modelMatrix) * normal);
        vec4 wp = modelMatrix * vec4(position, 1.0); vWorld = wp.xyz;
        gl_Position = projectionMatrix * viewMatrix * wp;
      }`,fragmentShader:`
      ${bd}
      varying vec2 vUv; varying vec3 vCol; varying vec3 vCol2; varying vec4 vMat; varying vec3 vN; varying vec3 vWorld; varying vec2 vFx;
      // 周期 per 的细线，线宽 w（同单位），带抗锯齿
      float lines(float x, float per, float w){
        float f = fract(x / per) * per;
        float fw = fwidth(x) + 1e-4;
        return 1.0 - smoothstep(w - fw, w + fw, min(f, per - f) * 2.0);
      }
      float lodOf(float x, float per){ return clamp(fwidth(x) / per * 1.6, 0.0, 1.0); }
      vec3 glass(vec3 tint, vec3 n, vec3 V, vec2 id, float lodF){
        vec2 j = (vec2(hash21(id), hash21(id * 1.7 + 3.0)) - 0.5) * 0.035 * lodF;
        vec3 t1 = normalize(vec3(-n.z, 0.0, n.x) + vec3(1e-4, 0.0, 0.0));
        vec3 np = normalize(n + t1 * j.x + vec3(0.0, j.y, 0.0));
        vec3 R = reflect(V, np);
        vec3 refl = envRefl(R, vWorld.y);
        float fres = pow(1.0 - max(dot(-V, n), 0.0), 4.0);
        float ndl = max(dot(n, uSunDir), 0.0) * gShadow;
        vec3 g = (tint + (hash21(id + 9.0) - 0.5) * 0.05 * lodF) * (0.6 + 0.8 * ndl);
        // 夜里玻璃是深色底：压低对夜空的反射，免得整栋楼泛紫
        // 很深的玻璃（如大疆天空之城）少反射一些天空，保持照片里那种近黑色
        float dk = smoothstep(0.03, 0.12, dot(tint, vec3(0.333)));
        return mix(g, refl * mix(vec3(1.0), tint * 1.5 + 0.4, 0.4), clamp(0.46 + fres * 0.5, 0.0, 1.0) * (1.0 - 0.6 * uNight) * mix(0.42, 1.0, dk));
      }
      float boxm(vec2 f, vec2 lo, vec2 hi, vec2 fw){
        vec2 mm = smoothstep(lo - fw, lo + fw, f) * (1.0 - smoothstep(hi - fw, hi + fw, f));
        return mm.x * mm.y;
      }
      void main(){
        int m = int(vMat.x + 0.5);
        // 立面号 = 变体 × 10 + 样式；样式 5~9 是第 4 轮新增的（阳台节奏、竖向条窗、彩色板格、遮阳横带、错位窗）
        float p1 = vMat.y, p2 = vMat.z; int sraw = int(vMat.w + 0.5); int var = sraw / 10; int style = sraw - var * 10;
        vec3 n = normalize(vN); if (!gl_FrontFacing) n = -n;
        vec3 V = normalize(vWorld - cameraPosition);
        gShadow = sunShadow(vWorld, n);
        vec3 col; float spec = 0.0;
        vec2 p = vUv;
        if (m == 1) {
          // 金属板
          float j = 0.0;
          if (style == 1) j = lines(p.y, p2, p2 * 0.42) * (1.0 - lodOf(p.y, p2)) * 0.55;
          else {
            j = lines(p.x, p1, 0.07) * (1.0 - lodOf(p.x, p1));
            if (style == 0) j = max(j, lines(p.y, p2, 0.07) * (1.0 - lodOf(p.y, p2)));
            j *= 0.5;
          }
          vec2 id = floor(p / vec2(p1, p2));
          vec3 alb = vCol * (0.96 + 0.07 * hash21(id) * (1.0 - lodOf(p.x, p1)));
          col = lightIt(alb * (1.0 - j), n);
          vec3 R = reflect(V, n);
          float fres = pow(1.0 - max(dot(-V, n), 0.0), 3.0);
          col = mix(col, skyColor(vec3(R.x, abs(R.y) * 0.6 + 0.25, R.z)) * (0.5 + 0.5 * vCol), 0.10 + 0.22 * fres);
          spec = 0.9;
        } else if (m == 2) {
          float lodx = lodOf(p.x, p1), lody = lodOf(p.y, p2);
          float lodF = 1.0 - max(lodx, lody);
          vec2 id = floor(p / vec2(p1, p2));
          vec3 g = glass(vCol2, n, V, id, lodF);
          // 墙面带一点雨痕色差，不是一整片纯色
          vec3 frame = lightIt(vCol * (1.0 - 0.08 * smoothstep(0.45, 1.0, vnoise(vec2(p.x * 0.45, p.y * 0.05))) * lodF), n);
          frame *= 1.0 - 0.5 * uNight; // 夜里框料压暗，楼体是深色底，亮的只有窗
          float fl = fract(p.y / p2);
          vec2 f = fract(p / vec2(p1, p2));
          vec2 fw = fwidth(p / vec2(p1, p2)) * 1.2 + 1e-4;
          float lit = 0.35 + 0.65 * gShadow * step(0.0, dot(n, uSunDir));
          // 住宅窗、实墙窗用的暗玻璃：只留三成天空反射，侧看不再是蓝白格子
          vec3 gd = mix(lightIt(vCol2 * 1.2, n) * 0.85 + vCol2 * 0.12, g, 0.30);
          if (uNight > 0.0) {
            // 夜景窗灯：住宅一窗一灯；写字楼三格一组，整层亮的更多
            bool home = style == 2 || style == 5 || style == 9;
            vec2 wid = home ? id : vec2(floor(id.x / 3.0), id.y);
            float bs = floor(vWorld.x / 37.0) + floor(vWorld.z / 41.0) * 3.0 + vFx.y * 9.0;
            vec3 wl = winLight(wid, bs);
            if (!home) wl = max(wl, step(0.70, hash11(id.y * 7.3 + bs)) * mix(vec3(1.0, 0.80, 0.50), vec3(0.85, 0.92, 1.0), step(0.8, hash11(id.y * 3.1 + bs))) * 0.60);
            wl = uNight * mix(vec3(0.17, 0.105, 0.04), wl, lodF) * 1.1;
            g += wl; gd += wl;
          }
          if (style == 2) {
            // 实墙开窗：变体决定窗的比例（方窗 / 横长窗 / 竖长窗 / 双联窗）
            vec2 lo = vec2(0.2, 0.22), hi = vec2(0.8, 0.80);
            if (var == 1) { lo = vec2(0.10, 0.26); hi = vec2(0.90, 0.78); }
            else if (var == 2) { lo = vec2(0.30, 0.12); hi = vec2(0.70, 0.88); }
            else if (var == 3) { lo = vec2(0.13, 0.30); hi = vec2(0.87, 0.74); }
            float win = boxm(f, lo, hi, fw);
            if (var == 3) win *= smoothstep(0.025 - fw.x, 0.025 + fw.x, abs(f.x - 0.5));
            // 窗洞有进深：窗上沿和两侧压一道阴影，窗台一条亮边，楼层之间一道分缝，每 4 开间一根略深的壁柱
            float topSh = smoothstep(hi.y - 0.14, hi.y, f.y) * 0.50 + (1.0 - smoothstep(lo.x, lo.x + 0.07, f.x)) * 0.22 + smoothstep(hi.x - 0.07, hi.x, f.x) * 0.22;
            vec3 gw = gd * (1.0 - topSh * lit * lodF);
            vec3 fr = frame * (1.0 - 0.10 * lines(p.y, p2, 0.10) * lodF);
            fr *= 1.0 - 0.07 * step(mod(id.x, 4.0), 0.5) * lodF;
            float sill = (smoothstep(lo.y - 0.07, lo.y - 0.05, f.y) - smoothstep(lo.y - 0.02, lo.y, f.y)) * step(lo.x, f.x) * step(f.x, hi.x) * lodF;
            fr = mix(fr, frame * 1.10, sill);
            col = mix(fr, gw, mix(win, (hi.x - lo.x) * (hi.y - lo.y), 1.0 - lodF));
            spec = 0.3;
          } else if (style == 5) {
            // 住宅阳台节奏：每 2~4 开间一个内凹阳台（实体栏板或玻璃栏板），其余是窗
            float per = 2.0 + float(var - (var / 3) * 3);
            bool balc = mod(id.x, per) < 0.5;
            vec3 wall = frame * (1.0 - 0.10 * lines(p.y, p2, 0.10) * lodF);
            if (balc) {
              float open = boxm(f, vec2(0.06, -0.5), vec2(0.94, 0.90), fw);
              float rail = 1.0 - smoothstep(0.36 - fw.y, 0.36 + fw.y, f.y);
              vec3 inner = gd * 0.55 * (1.0 - 0.4 * smoothstep(0.6, 0.9, f.y) * lit);
              vec3 railc = var >= 3 ? mix(gd * 1.3 + 0.06, frame, 0.25) : frame * 1.06;
              vec3 c2 = mix(inner, railc, rail);
              c2 = mix(c2, frame * 1.12, (smoothstep(0.33, 0.35, f.y) - smoothstep(0.38, 0.40, f.y)) * lodF);
              col = mix(wall, c2, mix(open, 0.5, 1.0 - lodF));
            } else {
              float win = boxm(f, vec2(0.22, 0.30), vec2(0.78, 0.80), fw);
              col = mix(wall, gd * (1.0 - smoothstep(0.66, 0.80, f.y) * 0.45 * lit * lodF), mix(win, 0.28, 1.0 - lodF));
            }
            spec = 0.15;
          } else if (style == 6) {
            // 竖向条窗：实墙壁柱之间通高的窄窗，层间是深色窗槛
            float a6 = var == 1 ? 0.36 : (var == 2 ? 0.20 : 0.28);
            float slot = smoothstep(a6 - fw.x, a6 + fw.x, f.x) * (1.0 - smoothstep(1.0 - a6 - fw.x, 1.0 - a6 + fw.x, f.x));
            float sp6 = 1.0 - smoothstep(0.20 - fw.y, 0.20 + fw.y, f.y);
            vec3 gl = mix(g, gd, 0.5) * (1.0 - 0.30 * (1.0 - smoothstep(a6, a6 + 0.07, f.x)) * lit * lodF);
            vec3 inner = mix(gl, frame * 0.70, sp6 * (1.0 - lody));
            col = mix(frame, inner, mix(slot, 1.0 - 2.0 * a6, lodx));
            spec = 0.4;
          } else if (style == 7) {
            // 板格幕墙：层间不透明窗槛板 + 随机的彩色板块
            float sp7 = 1.0 - smoothstep(0.30 - fw.y, 0.30 + fw.y, f.y);
            float acc = step(var == 1 ? 0.70 : (var == 2 ? 0.93 : 0.84), hash21(id + 3.7));
            vec3 pan = lightIt(mix(vCol, clamp(vCol2 * 2.4, 0.0, 1.0), 0.65), n);
            col = mix(g, frame * 0.86, sp7);
            col = mix(col, pan, acc * (1.0 - sp7));
            col = mix(col, frame, max(lines(p.x, p1, 0.10), lines(p.y, p2, 0.12)) * 0.9);
            col = mix(col, mix(g, frame * 0.9, 0.42), 1.0 - lodF);
            spec = 0.8;
          } else if (style == 8) {
            // 遮阳横带：每层一道挑出的遮阳板，板下压着阴影
            float band = smoothstep(0.30 - fw.y, 0.30 + fw.y, f.y) * (1.0 - smoothstep(0.84 - fw.y, 0.84 + fw.y, f.y));
            vec3 gl = g * (1.0 - smoothstep(0.60, 0.84, f.y) * 0.5 * lit * lodF);
            col = mix(frame, gl, mix(band, 0.54, lody));
            col = mix(col, frame * 1.12, (smoothstep(0.84, 0.86, f.y) - smoothstep(0.93, 0.95, f.y)) * (1.0 - lody));
            col = mix(col, frame * 0.8, lines(p.x, p1 * 2.0, 0.08) * (1.0 - lodx) * band * 0.6);
            spec = 0.6;
          } else if (style == 9) {
            // 错位窗：奇偶层错开半个开间
            vec2 f9 = fract(vec2(p.x + mod(id.y, 2.0) * p1 * 0.5, p.y) / vec2(p1, p2));
            float win = boxm(f9, vec2(0.12, 0.20), vec2(var == 1 ? 0.50 : 0.62, 0.84), fw);
            col = mix(frame * (1.0 - 0.08 * lines(p.y, p2, 0.08) * lodF), gd * (1.0 - smoothstep(0.70, 0.84, f9.y) * 0.45 * lit * lodF), mix(win, 0.3, 1.0 - lodF));
            spec = 0.2;
          } else if (style == 4) {
            // 横向带窗：实体窗槛墙 + 通长玻璃
            float fwy = fwidth(p.y / p2) * 1.2 + 1e-4;
            float band = smoothstep(0.52 - fwy, 0.52 + fwy, fl);
            col = mix(g, frame, mix(band, 0.48, lody));
            col = mix(col, frame * 0.8, lines(p.x, p1, 0.09) * (1.0 - lodx) * (1.0 - band) * 0.8);
            spec = 0.5;
          } else {
            float sp = smoothstep(0.76, 0.79, fl) * (1.0 - lody);
            col = mix(g, g * 0.62 + vCol2 * 0.12, sp);
            float mw = style == 3 ? 0.34 : 0.11;
            float mull = lines(p.x, p1, mw);
            col = mix(col, frame, mix(mull, mw / p1, lodx) * (style == 3 ? 1.0 : 0.85));
            col = mix(col, frame * 0.8, lines(p.y, p2, 0.16) * (1.0 - lody) * 0.75);
            if (style == 1) {
              // 斜撑：每 8 层一组人字形不锈钢斜杆
              float per = p2 * 8.0;
              float t = fract(p.y / per);
              float zig = abs(fract(p.x / (p1 * 12.0) + 0.5) - 0.5) * 2.0;
              float dd = abs(t - zig) * per;
              float fwv = fwidth(p.y) + 0.02;
              col = mix(col, frame * 1.04, 1.0 - smoothstep(0.55 - fwv, 0.55 + fwv, dd));
            }
            spec = 1.0;
          }
        } else if (m == 3) {
          float j = max(lines(p.x + floor(p.y / p2) * p1 * 0.5, p1, 0.05), lines(p.y, p2, 0.05)) * (1.0 - max(lodOf(p.x, p1), lodOf(p.y, p2)));
          vec2 id = floor(vec2(p.x + floor(p.y / p2) * p1 * 0.5, p.y) / vec2(p1, p2));
          vec3 alb = vCol * (0.94 + 0.09 * hash21(id) + 0.05 * vnoise(p * 2.0)) * (1.0 - j * 0.3);
          col = lightIt(alb, n);
          spec = 0.12;
        } else {
          col = lightIt(vCol * (0.97 + 0.06 * vnoise(vWorld.xz * 0.8 + vWorld.y)), n);
        }
        vec3 Hh = normalize(uSunDir - V);
        col += spec * gShadow * pow(max(dot(n, Hh), 0.0), 70.0) * 0.5 * (1.0 - uNight * 0.8);
        if (uNight > 0.0) {
          // 路灯把贴近地面的几层照暖
          col += uNight * vec3(0.26, 0.17, 0.07) * exp(-max(vWorld.y, 0.0) / 11.0) * 0.7;
          // 冲击波扫过时，所有精修楼的立面都被波前照亮一下
          { float wr = waveRadius(); if (wr >= 0.0) col += uNight * vec3(0.30, 0.75, 1.0) * exp(-pow((distance(vWorld.xz, uWave.xy) - wr) / 55.0, 2.0)) * 0.45 * clamp(1.4 - wr / 8000.0, 0.2, 1.0); }
          // 灯光组 5（第 5j 轮，春笋专用）：和组 1 一样出竖排字，但字带更密、字更大，点亮后把字带以外的窗灯压暗，字才读得出来
          bool bigText = vFx.x > 4.5;
          if (((vFx.x > 0.5 && vFx.x < 1.5) || bigText) && m == 2) {
            // 媒体幕墙：把幕墙分格当 LED 像素，跟着全城灯光秀走
            // 第 5 轮：出字的楼把底图收干净（压暗、去掉硬条纹），竖排大字是主体；vFx.y = 字高（米）
            vec2 cid = floor(p / vec2(p1, p2));
            vec2 cf = fract(p / vec2(p1, p2));
            float px = 0.78 + 0.22 * smoothstep(0.04, 0.14, cf.x) * smoothstep(0.04, 0.14, cf.y) * (1.0 - lodOf(p.x, p1));
            float ts = max(vFx.y, 4.0);
            vec3 sc = showColor(cid, p.y, vWorld, fract(ts * 0.37));
            // 打磨：出字的楼不再整面刷表演色。字列以外保留深玻璃 + 暖窗点，只叠一成表演色；
            // 字列是深色底板 + 亮白偏金的字，两侧各一道青色细边光
            float kS = floor((vFx.x - (bigText ? 5.0 : 1.0)) / 0.05 + 0.5);       // 这栋楼起始的文案号（0~7）
            float wm = bigText ? 4.0 : 6.0;
            vec3 tx = showTextV(p, ts, kS, wm);
            vec3 panel = vec3(0.006, 0.010, 0.030);
            float W5 = wm * ts; float u5 = abs(mod(p.x + W5 * 0.5, W5) - W5 * 0.5);
            float edge = (smoothstep(ts * 0.60, ts * 0.63, u5) - smoothstep(ts * 0.66, ts * 0.69, u5)) * (0.7 + 0.3 * sin(uTime * 0.9 + p.y * 0.02));
            // 5g：四种光线花样，按楼分配；都只当配角，亮度压在字之下
            float pat = mod(kS + floor(fract(ts * 7.31) * 4.0), 4.0);
            vec3 fxc;
            if (pat < 0.5) {
              // 潮汐扫光：一道青色光带自下而上扫过
              float bnd = exp(-pow((fract(p.y / 240.0 - uTime * 0.22 + fract(ts * 0.37)) - 0.5) * 9.0, 2.0));
              fxc = vec3(0.10, 0.85, 1.0) * bnd * 0.55 + vec3(0.0, 0.05, 0.12);
            } else if (pat < 1.5) {
              // 彩带：品红和金色两股斜向飘带
              float w1 = sin(p.x * 0.16 + p.y * 0.055 - uTime * 1.6), w2 = sin(-p.x * 0.12 + p.y * 0.04 - uTime * 1.1 + 2.0);
              fxc = vec3(1.0, 0.25, 0.65) * smoothstep(0.55, 1.0, w1) * 0.42 + vec3(1.0, 0.75, 0.20) * smoothstep(0.60, 1.0, w2) * 0.42;
            } else if (pat < 2.5) {
              // 像素点阵：幕墙分格随机闪烁，青绿为主，偶尔白
              float hpx = hash21(cid + floor(uTime * 2.5) * 7.0);
              fxc = (hpx > 0.94 ? vec3(0.9, 1.0, 1.0) : vec3(0.10, 0.90, 0.60)) * step(0.80, hpx) * 0.5;
            } else {
              // 金红 / 青绿轮换：整面缓慢换色，带竖向渐变
              float g1 = fract(p.y / 90.0 - uTime * 0.05);
              vec3 warm = mix(vec3(0.85, 0.10, 0.06), vec3(1.0, 0.72, 0.18), g1), cool = mix(vec3(0.05, 0.75, 0.55), vec3(0.10, 0.60, 1.0), g1);
              fxc = mix(warm, cool, smoothstep(0.35, 0.65, 0.5 + 0.5 * sin(uTime * 0.55 + vWorld.x * 0.002))) * 0.30;
            }
            fxc *= bigText ? 0.25 : clamp(ts / 12.0, 0.4, 1.0); // 字小的楼花样压暗一些，字才读得出来
            // 字色按句子轮换：暖白 / 金 / 青白
            float km = mod(tx.z, 3.0);
            vec3 tcol = km < 0.5 ? vec3(1.0, 0.96, 0.84) : (km < 1.5 ? vec3(1.0, 0.82, 0.42) : vec3(0.80, 1.0, 1.0));
            vec3 lit = mix(col * (bigText ? 0.30 : 1.0) + (fxc + sc * 0.05) * px, panel, tx.y) + tcol * tx.x * (bigText ? 1.35 : 1.1) + vec3(0.10, 0.85, 1.0) * edge * 0.8;
            // 5c：没被点亮的楼只是普通夜窗；点亮后从击中点（或冲击波）向外扩散，前沿是一道青白色的亮带
            vec2 ig = ignition(vWorld);
            col = mix(col, mix(col, lit, ig.x) + vec3(0.55, 0.95, 1.0) * ig.y * 1.3, uNight);
          } else if (vFx.x > 3.5 && vFx.x < 4.5) {
            // 横排大字屏（市民中心正面）
            vec3 tx = showTextH(p, max(vFx.y, 3.0), floor((vFx.x - 4.0) / 0.05 + 0.5));
            vec3 sc = showColor(floor(p / 3.0), p.y, vWorld, 0.3);
            vec3 bg = mix(sc * 0.06 + vec3(0.03, 0.022, 0.012), vec3(0.006, 0.010, 0.030), tx.y * 0.9);
            float km = mod(tx.z, 3.0);
            vec3 tcol = km < 0.5 ? vec3(1.0, 0.96, 0.84) : (km < 1.5 ? vec3(1.0, 0.82, 0.42) : vec3(0.80, 1.0, 1.0));
            vec2 ig = ignition(vWorld);
            col = mix(col, mix(col, bg + tcol * tx.x, ig.x) + vec3(0.55, 0.95, 1.0) * ig.y * 1.3, uNight * 0.94);
          } else if (vFx.x > 1.5 && vFx.x < 2.5) {
            // 招牌灯箱：自身颜色发光，个别在闪
            float fl2 = 0.88 + 0.12 * step(0.5, fract(uTime * (0.6 + vFx.y * 2.0) + vFx.y * 7.0)) * step(0.8, vFx.y);
            col = mix(col, (vCol * 1.12 + 0.06) * fl2, uNight * 0.92);
          } else if (vFx.x > 2.5 && vFx.x < 3.5) {
            col = mix(col, stripColor(vFx.y, vWorld), uNight * 0.95);
          }
        }
        gl_FragColor = vec4(atmo(col, vWorld), 1.0);
      }`}),jp)}function Np(e,t,n,r,i,a){let o=Math.cos(e.ang||0),s=Math.sin(e.ang||0),c=t.map(([t,n])=>new q(e.x+o*t-s*n,e.z+s*t+o*n)),l=c.map(e=>e.x),u=c.map(e=>e.y);return{rings:[c],minX:Math.min(...l),maxX:Math.max(...l),minZ:Math.min(...u),maxZ:Math.max(...u),bottom:n,top:r,name:i,h:a}}var Pp=(e,t,n,r)=>[[e,n],[t,n],[t,r],[e,r]],Fp=[.8,.82,.85],Ip=[.74,.76,.79],Lp=[.9,.9,.88],Rp=[.3,.32,.35],zp=(e,t,n)=>Math.max(t,Math.min(n,e));function Bp(e,t,n,r){for(let i=0;i<t.length-1;i++){let a=t[i],o=t[i+1],s=a.ring.length;for(let t=0;t<s;t++){let i=a.ring[t],c=a.ring[(t+1)%s],l=o.ring[(t+1)%s],u=o.ring[t],d=Math.hypot(c[0]-i[0],c[1]-i[1]),f=Math.hypot(l[0]-u[0],l[1]-u[1]),p=n(t,a.y,o.y);if(!p)continue;let m=r?[[r(t),a.y],[r(t+1),a.y],[r(t+1),o.y],[r(t),o.y]]:[[-d/2,a.y],[d/2,a.y],[f/2,o.y],[-f/2,o.y]];e.quad([i[0],a.y,i[1]],[c[0],a.y,c[1]],[l[0],o.y,l[1]],[u[0],o.y,u[1]],p,m)}}}var Vp=(e,t,n=0,r=0,i=0)=>Array.from({length:t},(a,o)=>[n+Math.cos(o/t*Math.PI*2+i)*e,r+Math.sin(o/t*Math.PI*2+i)*e]),Hp=(e,t,n=0,r=0)=>[[n-e,r+t],[n+e,r+t],[n+e,r-t],[n-e,r-t]];function Up(e,t,n,r,i=0,a=0){let o=t.length;for(let s=0;s<o;s+=2)e.quad([i,n,a],[t[s][0],n,t[s][1]],[t[(s+1)%o][0],n,t[(s+1)%o][1]],[t[(s+2)%o][0],n,t[(s+2)%o][1]],r)}function Wp(e,t,n,r){let i=$(t.x,t.z),a=new ri(e.build(),Mp());a.position.set(t.x,i,t.z),a.rotation.y=-t.ang,a.renderOrder=5;for(let e of n)e.bottom+=i,e.top+=i,e.h=r,e.name=t.name;return{mesh:a,colliders:n}}var Gp=(e,t,n,r,i,a,o=!0)=>{e.strut([t,r,n],[t,i,n],a,{mat:0,col:Fp}),o&&e.strut([t,i,n],[t,i+1.5,n],a*.6,{mat:0,col:[.9,.2,.15]})};function Kp(e){let t=441.8,n=zp(e.L/2,30,38),r=zp(e.W/2,19,24),i=new Ap;i.fx=[1.2,24];let a=[.1,.22,.38],o=[.16,.3,.46],s=e=>e<=352?r*(1+.035*Math.sin(e/352*Math.PI)):Math.max(.8,r*Math.sqrt(Math.max(0,1-((e-352)/89.80000000000001)**2))),c=e=>{let t=s(e),r=Math.min(2.2,t*.4);return[[-n+r,t],[n-r,t],[n,t-r],[n,-t+r],[n-r,-t],[-n+r,-t],[-n,-t+r],[-n,t-r]]},l=[0,18,96,104,196,204,296,304,352];for(let e=1;e<=14;e++)l.push(352+89.80000000000001*(1-(1-e/14)**1.6));let u=l.map(e=>({y:e,ring:c(e)})),d=e=>e>=96&&e<104||e>=196&&e<204||e>=296&&e<304;Bp(i,u,(e,t)=>{if(d(t))return{mat:1,col:[.46,.5,.55],p:[3,.7,1]};if(t<18)return{mat:2,col:Fp,col2:[.1,.15,.2],p:[3,9,3]};let n=e===0||e===4;return t>=352?n?{mat:2,col:Fp,col2:o,p:[1.5,4.2,3]}:{mat:2,col:Fp,col2:o,p:[1.5,4.2,0]}:n?{mat:2,col:Ip,col2:a,p:[1.5,4.2,0]}:e%2?{mat:1,col:Fp,p:[2.2,4.2,0]}:{mat:2,col:Ip,col2:a,p:[1.5,4.2,3]}});let f={mat:1,col:Fp,p:[6,4.2,0],fx:[0,0]};for(let e of[1,-1])for(let t=0;t<=12;t++){let r=-n+2.6+(2*n-5.2)*t/12,a=t%3==0?1:.5,o=t%3==0?.9:.5;for(let t=1;t<u.length-1;t++){let n=u[t].y,c=u[t+1].y,l=s(n)*e,d=s(c)*e,p=Math.atan2(Math.abs(l)-Math.abs(d),c-n),m=Math.cos(p)*e,h=Math.sin(p),g=[r-a/2,n+h*o,l+m*o],_=[r+a/2,n+h*o,l+m*o],v=[r+a/2,c+h*o,d+m*o],y=[r-a/2,c+h*o,d+m*o];i.quad(g,_,v,y,f),i.quad([r-a/2,n,l],g,y,[r-a/2,c,d],f),i.quad(_,[r+a/2,n,l],[r+a/2,c,d],v,f)}}i.box(-n,n,441.2,442.3,-1,1,{mat:0,col:Fp}),i.box(-n-4,n+4,-2,.6,-r-4,r+4,{mat:3,col:[.7,.69,.67],p:[2.4,.3]});for(let e of[1,-1])i.box(-14,14,8.6,9.2,e>0?r:-r-5,e>0?r+5:-r,{mat:0,col:Fp},{bottom:!0});let p=[],m=[0,120,240,352,385,410,428,t];for(let t=0;t<m.length-1;t++)p.push(Np(e,c(m[t]<352?m[t]:(m[t]+m[t+1])/2),t===0?-2:m[t],m[t+1]));return Wp(i,e,p,t)}function qp(e){let t=392.5,n=zp(Math.max(e.L,e.W)/2/34,.85,1.15),r=[[0,30.5],[30,32.5],[90,34],[170,33.4],[240,31],[290,27.2],[330,21.5],[356,15],[374,8.6],[386,3.4],[t,.5]],i=e=>{for(let t=1;t<r.length;t++)if(e<=r[t][0]){let i=(e-r[t-1][0])/(r[t][0]-r[t-1][0]);return(r[t-1][1]+(r[t][1]-r[t-1][1])*i)*n}return .5},a=new Ap,o=2*Math.PI*34;a.fx=[5.1,o/12];let s=[.22,.34,.44],c=[.84,.84,.82],l=[0,15,30,60,90,130,170,205,240,265,290,310,330,343,356,365,374,380,386,t].map(e=>({y:e,ring:Vp(i(e),56)}));Bp(a,l,(e,t)=>t<30?{mat:2,col:c,col2:[.1,.15,.2],p:[1.7,7.5,0]}:t>=374?{mat:2,col:Fp,col2:[.34,.46,.56],p:[.5,3,0]}:{mat:2,col:c,col2:s,p:[3.6,4.5,0]},t=>(t/56-(Math.PI/2-e.ang)/(2*Math.PI))*o);let u={mat:1,col:c,p:[4,4.5,2],fx:[0,0]};for(let e=0;e<56;e++){let t=e/56*Math.PI*2,n=(e,n,r=0)=>{let a=i(e)+n;return[Math.cos(t+r)*a,e,Math.sin(t+r)*a]};for(let e=2;e<l.length-1;e++){let t=l[e].y,r=l[e+1].y,o=Math.min(.55,i(t)*.04),s=Math.min(.55,i(r)*.04),c=Math.min(.3,i(t)*.02)+.1,d=Math.min(.3,i(r)*.02)+.1,f=o/Math.max(1,i(t))/2,p=s/Math.max(1,i(r))/2;a.quad(n(t,c,-f),n(t,c,f),n(r,d,p),n(r,d,-p),u),a.quad(n(t,-.1,-f),n(t,c,-f),n(r,d,-p),n(r,-.1,-p),u),a.quad(n(t,c,f),n(t,-.1,f),n(r,-.1,p),n(r,d,p),u)}let r=Math.PI*2/56,o=n(30,.5),s=n(0,.6,e%2?r:-r);a.strut(s,o,1,{mat:0,col:c})}for(let e of[90,170,240,290]){let t=Vp(i(e)+.35,56);a.prism(t,e-.5,e+.5,{mat:0,col:c,wrapU:!0},{cap:!1})}Gp(a,0,0,390.5,398.5,.5),a.prism(Vp(i(0)+6,32),-2,.5,{mat:3,col:[.72,.71,.69],p:[2.4,.3],wrapU:!0},{cap:!1}),Up(a,Vp(i(0)+6,32),.5,{mat:3,col:[.7,.69,.67],p:[1.2,1.2]});let d=[],f=[0,90,240,290,330,356,374,t];for(let t=0;t<f.length-1;t++)d.push(Np(e,Vp(i(t<2?90:(f[t]+f[t+1])/2)+.8,20),t===0?-2:f[t],f[t+1]));return Wp(a,e,d,t)}function Jp(e){let t=383.95,n=zp(e.L/2,30,38),r=zp(e.W/2,15,19),i=r*.8,a=n-i,o=new Ap;o.fx=[1.3,15];let s=[.08,.27,.24],c=[.12,.34,.3],l={mat:2,col:Ip,col2:s,p:[1.6,3.9,4]};o.box(-n-8,n+8,-2,22,-r-10,r+10,{mat:2,col:[.78,.78,.76],col2:[.1,.2,.2],p:[3,5.5,4],wrapU:!0},{capO:{mat:3,col:[.56,.57,.58],p:[3,3]}}),o.box(-n-8.6,n+8.6,21.6,22.8,-r-10.6,r+10.6,{mat:0,col:Ip},{bottom:!0});let u=a-2,d=[22,118,123,215,220,298];for(let e=0;e<d.length-1;e++){let t=e%2==1;o.box(-u+(t?.6:0),u-(t?.6:0),d[e],d[e+1],-r+(t?.6:0),r-(t?.6:0),t?{mat:1,col:[.36,.42,.42],p:[3,.7,1]}:l,{cap:e===d.length-2,bottom:!0,capO:{mat:3,col:[.5,.52,.53],p:[3,3]}})}for(let e of[1,-1])for(let t=0;t<=8;t++){let n=-u+3+(2*u-6)*t/8;o.box(n-.35,n+.35,22,300,e>0?r:-r-.6,e>0?r+.6:-r,{mat:1,col:Ip,p:[4,3.9,0]})}for(let e of[1,-1]){let n=e*a,r=Vp(i,32,n,0);o.prism(r,22,317,{mat:2,col:Ip,col2:c,p:[1.45,3.9,0],wrapU:!0},{cap:!1});for(let e=61;e<313;e+=39)o.prism(Vp(i+.45,32,n,0),e-.5,e+.5,{mat:0,col:Ip,wrapU:!0},{cap:!1});o.prism(Vp(i+.6,32,n,0),317,325,{mat:1,col:Ip,p:[1.45,.8,1],wrapU:!0},{cap:!1}),Up(o,Vp(i+.6,32,n,0),325,{mat:0,col:[.5,.52,.53]},n,0),Bp(o,[{y:325,ring:Vp(i*.62,16,n,0)},{y:334,ring:Vp(i*.36,16,n,0)},{y:339,ring:Vp(1.4,16,n,0)}],()=>({mat:1,col:Ip,p:[1.2,3,2]})),Gp(o,n,0,339,t,1.3),o.prism(Vp(2.2,12,n,0),355,356,{mat:0,col:Ip,wrapU:!0},{bottom:!0})}return o.box(-u*.5,u*.5,298,305,-r*.6,r*.6,{mat:2,col:Ip,col2:c,p:[1.6,7,3],wrapU:!0}),Wp(o,e,[Np(e,Hp(n+8,r+10),-2,22),Np(e,Hp(u,r+.6),22,298),Np(e,Vp(i+.6,16,a,0),22,325),Np(e,Vp(i+.6,16,-a,0),22,325),Np(e,Hp(1.2,1.2,a,0),325,t),Np(e,Hp(1.2,1.2,-a,0),325,t)],t)}function Yp(e){let t=zp(Math.min(e.L,e.W)/2,16,19),n=new Ap;n.fx=[1.35,6];let r=[.88,.86,.8],i=[.12,.17,.22],a=e.partBased?3:16;n.box(-t-a,t+a,-2,20,-t-a,t+a,{mat:2,col:r,col2:i,p:[3.2,5,4],wrapU:!0},{capO:{mat:3,col:[.6,.6,.58],p:[3,3]}}),n.box(-t-a-.6,t+a+.6,19.5,21.2,-t-a-.6,t+a+.6,{mat:0,col:r},{bottom:!0});let o=e=>[[-e+4,e],[e-4,e],[e,e-4],[e,-e+4],[e-4,-e],[-e+4,-e],[-e,-e+4],[-e,e-4]];n.prism(o(t),20,146,{mat:2,col:r,col2:i,p:[1.6,3.2,3]},{cap:!1});for(let[e,r]of[[0,1],[1,0],[0,-1],[-1,0]])for(let i=0;i<=6;i++){let a=-t+4+(2*t-8)*i/6,o=-r,s=e,c=e*t+o*(a-.45),l=r*t+s*(a-.45),u=e*(t+.7)+o*(a+.45),d=r*(t+.7)+s*(a+.45);n.box(Math.min(c,u),Math.max(c,u),20,148,Math.min(l,d),Math.max(l,d),{mat:0,col:[.93,.92,.88]})}let s=t*1.28;return n.prism(Vp(t*.95,32),146,149,{mat:0,col:r,wrapU:!0},{cap:!1}),n.prism(Vp(s,40),149,150,{mat:0,col:r,wrapU:!0},{cap:!1}),Up(n,Vp(s,40),149,{mat:0,col:[.75,.74,.7]}),n.prism(Vp(s-.6,40),150,154.5,{mat:2,col:r,col2:[.14,.24,.32],p:[1.5,4.5,0],wrapU:!0},{cap:!1}),n.prism(Vp(s+.5,40),154.5,156,{mat:0,col:r,wrapU:!0},{cap:!1}),Up(n,Vp(s+.5,40),156,{mat:3,col:[.58,.58,.56],p:[3,3]}),Up(n,Vp(s+.5,40),154.5,{mat:0,col:[.75,.74,.7]}),n.prism(Vp(8,24),156,160,{mat:1,col:[.82,.8,.76],p:[2,.6,1],wrapU:!0},{cap:!1}),Up(n,Vp(8,24),160,{mat:0,col:[.45,.47,.45]}),Gp(n,0,0,160,172,.5),Wp(n,e,[Np(e,Hp(t+a,t+a),-2,20),Np(e,o(t+.7),20,149),Np(e,Vp(s+.5,16),149,156),Np(e,Vp(8,12),156,160)],160)}function Xp(e){let t=355.8,n=zp(Math.min(e.L,e.W)/2*1.02,20,27),r=new Ap;r.fx=[1.25,7];let i=[.2,.34,.46],a=Lp,o=(e,t)=>Vp(e,8,0,0,Math.PI/8),s=e.partBased?2:22,c=e.partBased?2:16;r.box(-n-s,n+s,-2,46,-n-c,n+c,{mat:2,col:[.8,.8,.78],col2:[.12,.2,.28],p:[3,4.6,4],wrapU:!0},{capO:{mat:3,col:[.56,.57,.58],p:[3,3]}}),r.box(-n-s-.6,n+s+.6,45.6,47,-n-c-.6,n+c+.6,{mat:0,col:a},{bottom:!0});let l=[46,128,133,212,217,278];for(let e=0;e<l.length-1;e++){let t=e%2==1;r.prism(o(t?n-.7:n),l[e],l[e+1],t?{mat:1,col:[.48,.52,.56],p:[3,.7,1]}:{mat:2,col:a,col2:i,p:[1.5,4.1,0]},{cap:!1})}let u=o(n);for(let e=0;e<8;e++){let t=u[e],i=u[(e+1)%8],o=t[0]/n,s=t[1]/n;r.strut([t[0]+o*.3,46,t[1]+s*.3],[t[0]+o*.3,282,t[1]+s*.3],2,{mat:1,col:a,p:[4,4.1,0]});for(let e of[1/3,2/3]){let n=t[0]+(i[0]-t[0])*e,o=t[1]+(i[1]-t[1])*e,s=Math.hypot(n,o);r.strut([n*(1+.3/s),46,o*(1+.3/s)],[n*(1+.3/s),278,o*(1+.3/s)],.6,{mat:0,col:a})}}r.prism(o(n),278,279,{mat:0,col:a},{capO:{mat:3,col:[.56,.57,.58],p:[3,3]}}),r.prism(o(n*.8),279,288,{mat:2,col:a,col2:i,p:[1.5,9,3]},{capO:{mat:3,col:[.56,.57,.58],p:[3,3]}}),r.prism(o(n*.55),288,296,{mat:1,col:a,p:[2,.7,1]},{capO:{mat:0,col:[.5,.52,.53]}}),Bp(r,[{y:296,ring:o(4.2)},{y:316,ring:o(2.2)},{y:336,ring:o(1)}],()=>({mat:1,col:Fp,p:[1.2,3,0]})),Gp(r,0,0,336,t,.8);for(let e of[306,322])r.prism(o(3.6-(e-292)*.06),e-.3,e+.3,{mat:0,col:Rp},{bottom:!0});return Wp(r,e,[Np(e,Hp(n+s,n+c),-2,46),Np(e,o(n+.8),46,279),Np(e,o(n*.8),279,296),Np(e,Hp(2,2),296,t)],t)}var Zp={kk100:Kp,chunsun:qp,diwang:Jp,guomao:Yp,seg:Xp};function Qp(e){let t=[],n=[],r=[],i=[],a=[],o=0,s=0;for(let c of e){for(let e=0;e<c.n;e++){let l=e/c.n*Math.PI*2+s*.37,u=(e%2?1:-1)*(.05+.03*(e*7%5)/5),d=.3+.5*(e*3%4/4);for(let[i,o]of[[0,-1],[0,1],[1,1],[1,-1]])t.push(i,o,e%3),n.push(c.x,c.y,c.z),r.push(l,u,d,c.len),a.push(s);i.push(o,o+1,o+2,o,o+2,o+3),o+=4}s++}let c=new kr;c.setAttribute(`position`,new Z(t,3)),c.setAttribute(`aOrg`,new Z(n,3)),c.setAttribute(`aBeam`,new Z(r,4)),c.setAttribute(`aSrc`,new Z(a,1)),c.setIndex(i);let l=new ri(c,new co({uniforms:_d(),transparent:!0,depthWrite:!1,blending:2,side:2,vertexShader:`
      uniform float uTime; uniform float uBeamT[4];
      attribute vec3 aOrg; attribute vec4 aBeam; attribute float aSrc;
      varying float vT; varying float vS; varying float vK; varying float vOn;
      void main(){
        float az = aBeam.x + uTime * aBeam.y;
        float el = aBeam.z + 0.22 * sin(uTime * 0.4 + aBeam.x * 3.0);
        vec3 d = vec3(cos(az) * cos(el), sin(el), sin(az) * cos(el));
        vec3 p0 = aOrg + d * position.x * aBeam.w;
        vec3 side = normalize(cross(d, cameraPosition - p0));
        vec3 wp = p0 + side * position.y * mix(1.6, 30.0, position.x);
        vT = position.x; vS = position.y; vK = position.z;
        // 这组光束所在的楼被光球点亮之后才射出来
        vOn = smoothstep(0.0, 2.5, uTime - uBeamT[int(aSrc + 0.5)]);
        gl_Position = projectionMatrix * viewMatrix * vec4(wp, 1.0);
      }`,fragmentShader:`
      uniform float uNight;
      varying float vT; varying float vS; varying float vK; varying float vOn;
      void main(){
        float a = vOn * pow(1.0 - vT, 1.4) * pow(max(1.0 - vS * vS, 0.0), 1.6);
        vec3 c = vK < 0.5 ? vec3(1.0, 0.16, 0.12) : (vK < 1.5 ? vec3(1.0, 0.72, 0.25) : vec3(1.0, 0.35, 0.20));
        gl_FragColor = vec4(c * a * 0.38 * uNight, 1.0);
      }`}));return l.frustumCulled=!1,l.renderOrder=22,l.visible=!1,Ad.push(l),l}var $p=class{constructor(e,t=40){this.cell=t,this.map=new Map;for(let n of e){let e=Math.floor(n.minX/t),r=Math.floor(n.maxX/t),i=Math.floor(n.minZ/t),a=Math.floor(n.maxZ/t);for(let t=e;t<=r;t++)for(let e=i;e<=a;e++){let r=t*1e5+e,i=this.map.get(r);i||this.map.set(r,i=[]),i.push(n)}}}query(e,t){return this.map.get(Math.floor(e/this.cell)*1e5+Math.floor(t/this.cell))||[]}},em=.45,tm=[[0,0],[em,0],[-.45,0],[0,em],[0,-.45],[.32,.32],[-.32,.32],[.32,-.32],[-.32,-.32]];function nm(e,t,n,r,i,a=.6){for(let[o,s]of tm){let c=t+o,l=n+s;for(let t of e.query(c,l))if(!(t.top<=r+a||t.bottom>=i)&&nf(c,l,t))return t}return null}function rm(e,t,n,r,i=.6){let a=$(t,n);for(let o of e.query(t,n))o.top>r+i||o.top<a||nf(t,n,o)&&(a=o.top);return a}function im(e,t,n){for(let r of e.query(t,n))if(nf(t,n,r))return r;return null}var am=260,om=14,sm=22,cm=6,lm=100,um=`/models/astronaut.glb`,dm=.979,fm=Math.PI/2,pm=new J(-.25,.78,-.07),mm=280,hm=105,gm=1.6,_m=.905,vm=18,ym=3.2,bm=.7,xm=`/models/astronaut-anim/astronaut-rigged.glb`,Sm=13,Cm=9,wm=[[0,0]].concat(Array.from({length:8},(e,t)=>[Math.cos(t*Math.PI/4)*Sm,Math.sin(t*Math.PI/4)*Sm])),Tm=[[0,0],[8,0],[-8,0],[0,8],[0,-8]],Em=1.4,Dm=4.6,Om=520,km=185,Am=96,jm=34,Mm=1.3,Nm=300,Pm=0,Fm=24,Im=e=>(e=Math.max(0,Math.min(1,e)),e*e*e*(e*(e*6-15)+10));function Lm(e,t){return e.applyMatrix4(t),e.toNonIndexed&&e.index?e.toNonIndexed():e}var Rm=(e,t,n,r=0,i=0,a=0,o=1,s=1,c=1)=>new Y().compose(new J(e,t,n),new At().setFromEuler(new un(r,i,a)),new J(o,s,c));function zm(){let e=[],t=[],n=[],r=[],i=[],a=(e,t)=>new la(e,t,6,14);e.push(Lm(a(.3,.34),Rm(0,1.18,0,0,0,0,1.15,1,.92))),e.push(Lm(new Qa(.3,16,10),Rm(0,.86,0,0,0,0,1.05,.7,.9))),t.push(Lm(new ua(.29,.29,.07,18),Rm(0,.98,0,0,0,0,1.12,1,.92))),e.push(Lm(new Qa(.265,22,16),Rm(0,1.78,0))),t.push(Lm(new ua(.2,.23,.08,18),Rm(0,1.55,0))),n.push(Lm(new Qa(.25,24,14,0,Math.PI*2,0,1.15),Rm(0,1.775,-.075,-Math.PI/2-.08,0,0,.93,1,.8))),i.push(Lm(new $a(.215,.02,8,28),Rm(0,1.778,-.185,.08,0,0,.98,.86,1))),e.push(Lm(new ca(.56,.74,.26),Rm(0,1.26,.33))),t.push(Lm(new ca(.44,.1,.2),Rm(0,1.66,.33))),t.push(Lm(new ca(.3,.2,.1),Rm(0,1.2,-.3))),r.push(Lm(new ca(.06,.04,.02),Rm(-.07,1.23,-.355))),i.push(Lm(new ca(.06,.04,.02),Rm(.05,1.23,-.355)));for(let n of[-1,1])e.push(Lm(a(.135,.3),Rm(n*.17,.6,-.02,.12*n*0+.1,0,n*.05))),t.push(Lm(new ua(.14,.14,.06,14),Rm(n*.18,.4,0))),e.push(Lm(a(.125,.28),Rm(n*.185,.2,.03,-.14,0,0))),t.push(Lm(new ca(.2,.14,.34),Rm(n*.19,-.04,-.02))),r.push(Lm(new ua(.142,.142,.035,14),Rm(n*.17,.66,-.02,.1,0,0))),e.push(Lm(new Qa(.16,14,10),Rm(n*.42,1.42,0)));e.push(Lm(a(.105,.26),Rm(-.5,1.2,0,0,0,-.28))),t.push(Lm(new ua(.11,.11,.05,12),Rm(-.56,1,0,0,0,-.28))),e.push(Lm(a(.095,.24),Rm(-.6,.82,-.05,-.35,0,-.12))),t.push(Lm(new Qa(.11,12,8),Rm(-.62,.62,-.13))),r.push(Lm(new ua(.112,.112,.03,12),Rm(-.52,1.14,0,0,0,-.28)));let o=(e,t)=>new ri(ld(e.map(e=>{let t=e.index?e.toNonIndexed():e;return t.deleteAttribute(`uv`),t})),t),s={white:xd({color:15921902,spec:.5,emissive:.3}),grey:xd({color:9278104,spec:.3,emissive:.15}),dark:xd({color:1709072,spec:3}),red:xd({color:13117470,emissive:.4}),gold:xd({color:14198336,spec:1.5,emissive:.4})},c=new On;c.add(o(e,s.white),o(t,s.grey),o(n,s.dark),o(r,s.red),o(i,s.gold));let l=new On;l.position.set(.42,1.42,0);let u=[Lm(a(.105,.26),Rm(.06,-.22,0)),Lm(a(.095,.24),Rm(.08,-.6,-.02))],d=[Lm(new ua(.11,.11,.05,12),Rm(.07,-.42,0)),Lm(new Qa(.115,12,8),Rm(.09,-.82,-.03))],f=[Lm(new ua(.112,.112,.03,12),Rm(.06,-.28,0))];return l.add(o(u,s.white),o(d,s.grey),o(f,s.red)),c.add(l),{body:c,arm:l}}function Bm(){return new co({uniforms:_d(),transparent:!0,depthWrite:!1,blending:2,vertexShader:`varying vec2 vP; varying vec3 vC;
      void main(){
        vec4 c = modelMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);
        float sz = length(instanceMatrix[0].xyz);
        vec4 mv = viewMatrix * c; mv.xy += position.xy * sz;
        vP = position.xy * 2.0; vC = instanceColor;
        gl_Position = projectionMatrix * mv;
      }`,fragmentShader:`varying vec2 vP; varying vec3 vC;
      void main(){ float r = length(vP); float a = pow(max(1.0 - r, 0.0), 2.2) + 1.6 * pow(max(1.0 - r * 3.2, 0.0), 2.0); gl_FragColor = vec4(vC * a, 1.0); }`})}function Vm(){let e=[],t=[],n=[];for(let r=0;r<=160;r++){let i=r/160*Math.PI*2,a=Math.cos(i),o=Math.sin(i);if(e.push(a,0,o,a,1,o,a,0,o,a,0,o),t.push(0,0,0,1,1,0,1,1),r<160){let e=r*4;n.push(e,e+4,e+5,e,e+5,e+1,e+2,e+6,e+7,e+2,e+7,e+3)}}let r=new kr;r.setAttribute(`position`,new Z(e,3)),r.setAttribute(`aW`,new Z(t,2)),r.setIndex(n);let i=new ri(r,new co({uniforms:_d(),transparent:!0,depthWrite:!1,blending:2,side:2,vertexShader:`uniform float uTime; uniform vec4 uWave; attribute vec2 aW; varying vec2 vW; varying float vR;
      void main(){
        float t = uTime - uWave.z; float r = t < 0.0 ? 0.0 : 260.0 * t + 90.0 * t * t;
        float rr = aW.x > 0.5 ? max(r - aW.y * 220.0, 0.0) : r;
        vec3 wp = vec3(uWave.x + position.x * rr, aW.x > 0.5 ? 3.0 : position.y * 320.0, uWave.y + position.z * rr);
        vW = aW; vR = t < 0.0 ? -1.0 : r;
        gl_Position = projectionMatrix * viewMatrix * vec4(wp, 1.0);
      }`,fragmentShader:`uniform float uNight; varying vec2 vW; varying float vR;
      void main(){
        if (vR < 0.0) discard;
        float fade = clamp(1.5 - vR / 7000.0, 0.22, 1.0) * (1.0 - smoothstep(13500.0, 16500.0, vR)) * smoothstep(0.0, 60.0, vR);
        float a = vW.x > 0.5 ? pow(1.0 - vW.y, 2.0) * 0.85 : pow(1.0 - vW.y, 2.2) * 0.55 + 0.9 * pow(1.0 - vW.y, 24.0);
        gl_FragColor = vec4(mix(vec3(0.20, 0.80, 1.0), vec3(0.95, 1.0, 1.0), pow(1.0 - vW.y, 6.0)) * a * fade * uNight, 1.0);
      }`}));return i.frustumCulled=!1,i.renderOrder=29,i}function Hm(){let e=new kr;e.setAttribute(`position`,new Z([-1,0,0,1,0,0,1,1,0,-1,1,0],3)),e.setIndex([0,1,2,0,2,3]);let t=new ri(e,new co({uniforms:_d({uBase:{value:new J},uLen:{value:900},uAmp:{value:0},uHead:{value:1}}),transparent:!0,depthWrite:!1,blending:2,side:2,vertexShader:`uniform vec3 uBase; uniform float uLen; varying vec2 vS;
      void main(){
        vec3 right = normalize(vec3(cameraPosition.z - uBase.z, 0.0, -(cameraPosition.x - uBase.x)) + vec3(1e-4, 0.0, 0.0));
        float w = mix(46.0, 120.0, position.y);                       // 上宽下窄，像从天上照下来
        vec3 wp = uBase + vec3(0.0, position.y * uLen, 0.0) + right * position.x * w;
        vS = vec2(position.x, position.y);
        gl_Position = projectionMatrix * viewMatrix * vec4(wp, 1.0);
      }`,fragmentShader:`uniform float uTime; uniform float uAmp; uniform float uHead; varying vec2 vS;
      void main(){
        float core = pow(max(1.0 - abs(vS.x), 0.0), 2.2) + 0.8 * pow(max(1.0 - abs(vS.x) * 3.5, 0.0), 2.0);
        // 光是从上往下「落」到地面的：uHead 以下还没照到
        float reach = smoothstep(uHead - 0.06, uHead + 0.02, vS.y);
        float fade = (0.35 + 0.65 * vS.y) * (1.0 - smoothstep(0.92, 1.0, vS.y));
        float shimmer = 0.85 + 0.15 * sin(uTime * 5.0 + vS.y * 40.0);
        gl_FragColor = vec4(vec3(0.62, 0.90, 1.0) * core * fade * reach * shimmer * uAmp * 0.9, 1.0);
      }`}));return t.frustumCulled=!1,t.renderOrder=28,t.visible=!1,t}var Um=class{constructor(e,t,n,r){this.scene=e,this.camera=t,this.targets=n,this.setNight=r,this.root=new On,this.arm=null,this.giantScale=lm/dm,this.modelKind=`loading`,this.mats=[];let i=new of;i.loadAsync(xm).then(e=>({g:e,rig:!0})).catch(e=>(console.warn(`[futian] 宇航员：带骨骼的模型 `+xm+` 加载失败，退回静态模型（没有走路动作）。原因：`,e&&e.message?e.message:e),i.loadAsync(um).then(e=>({g:e,rig:!1})))).then(({g:e,rig:t})=>{let n=e.scene;n.rotation.y=fm,n.position.y=t?0:.4895;let r=new On;if(r.add(n),r.scale.setScalar(t?lm:this.giantScale),t){this.mixer=new Hs(n),this.actions={},this.animW={};for(let t of e.animations){let e=this.mixer.clipAction(t);e.play(),e.setEffectiveWeight(+(t.name===`idle`)),this.actions[t.name]=e,this.animW[t.name]=+(t.name===`idle`)}if(this.actions.fall&&(this.actions.fall.stop(),delete this.actions.fall,delete this.animW.fall),this.actions.jump){let e=this.actions.jump,t=e.getClip();e.setLoop(Oe,1),e.clampWhenFinished=!0,e.setEffectiveTimeScale(0);let n=Math.min(.28,t.duration*.12),r=0;for(let e of t.tracks){if(!e.name.endsWith(`.position`))continue;let i=1e9,a=-1e9,o=0,s=1;for(let t=0;t<3;t++){let n=1e9,r=-1e9;for(let i=t;i<e.values.length;i+=3)n=Math.min(n,e.values[i]),r=Math.max(r,e.values[i]);r-n>a-i&&(i=n,a=r,s=t)}if(a-i<=r)continue;r=a-i;let c=e.values[s],l=0;for(let n=0;n<e.times.length&&e.times[n]<t.duration*.45;n++){let t=Math.abs(e.values[n*3+s]-c);t>l&&(l=t,o=e.times[n])}l>0&&(n=o)}this.jumpApex=n,this.jumpT=n}this.handBone=n.getObjectByName(`L_Hand`)||null;let t=e=>n.getObjectByName(e);this.legs=[`L`,`R`].map(e=>({th:t(e+`_Thigh`),ca:t(e+`_Calf`),ft:t(e+`_Foot`),sd:e})).filter(e=>e.th&&e.ca&&e.ft),this.model=n,this.modelY0=n.position.y,this.rigged=!0}n.traverse(e=>{if(!e.isMesh)return;e.frustumCulled=!1,e.renderOrder=6;let t=e.material;t.envMapIntensity=1,t.emissive=new X(1,1,1),t.emissiveMap=t.map,t.emissiveIntensity=0,Md(t),this.mats.push(t)}),this.root.add(r),this.modelKind=t?`tripo-rigged`:`tripo-glb`,console.info(`[futian] 宇航员：已加载 Tripo 模型`,um,`身高`,lm,`m，缩放`,this.giantScale.toFixed(1))}).catch(e=>{console.warn(`[futian] 宇航员：Tripo 模型 `+um+` 加载失败，暂时回退到旧的方块模型。原因：`,e&&e.message?e.message:e);let{body:t,arm:n}=zm(),r=new On;r.add(t),r.scale.setScalar(lm/2.05),this.root.add(r),this.arm=n,this.modelKind=`fallback-blocks`}),this.root.visible=!1,e.add(this.root),this.active=!1,this.t=0,this.fireT=9,this.pos=new J,this.placed=!1,this.state=`hidden`,this.stateT=0,this.yaw=0,this.yawTarget=0,this.grid=null,this.player=null,this.orbs=[],this.bursts=[],this.sprites=new ki(new Za(1,1),Bm(),198),this.sprites.setColorAt(0,new X(1,1,1)),this.sprites.instanceMatrix.setUsage(Ue),this.sprites.instanceColor.setUsage(Ue),this.sprites.frustumCulled=!1,this.sprites.count=0,this.sprites.renderOrder=30,e.add(this.sprites),this.onHit=()=>{},this.skyBeam=Hm(),e.add(this.skyBeam),this.lightAmp=0,this.vel=new J,this.tpBlend=0,this.camFree=new J,this.fpBlend=0,this.fp=!1,this.vm=this.buildViewModel(),this.hits=0,this.wave=null,e.add(Vm()),this._m=new Y,this._c=new X,this._v=new J}toggle(){return this.state===`hidden`||this.state===`ascending`?this.summon():this.dismiss(),this.active}spotFree(e,t){if(!this.grid)return!0;if(im(this.grid,e,t))return!1;for(let n=0;n<8;n++){let r=n/8*Math.PI*2;if(im(this.grid,e+Math.cos(r)*Fm,t+Math.sin(r)*Fm))return!1}return!0}pickLanding(){let e=this.camera,t=e.getWorldDirection(new J);t.y=0,t.lengthSq()<1e-6&&t.set(0,0,-1),t.normalize();let n=new J().crossVectors(t,new J(0,1,0)).normalize(),r=e.position.x+t.x*Nm+n.x*Pm,i=e.position.z+t.z*Nm+n.z*Pm,a=r,o=i,s=this.spotFree(r,i);for(let t=1;t<=9&&!s;t++){let n=t*28;for(let c=0;c<12&&!s;c++){let l=c/12*Math.PI*2+t*.4,u=r+Math.cos(l)*n,d=i+Math.sin(l)*n;Math.hypot(u-e.position.x,d-e.position.z)<170||this.spotFree(u,d)&&(a=u,o=d,s=!0)}}return this.landFound=s,new J(a,$(a,o),o)}summon(){this.land=this.pickLanding();let e=this.camera,t=e.getWorldDirection(new J);t.y=0,t.lengthSq()<1e-6&&t.set(0,0,-1),t.normalize(),this.from=this.land.clone(),this.from.y=Math.max(this.land.y+Om,e.position.y+240),this.faceYaw=Math.atan2(-t.x,-t.z),this.yaw=this.faceYaw,this.yawTarget=this.faceYaw,this.state=`arriving`,this.stateT=0,this.active=!0,this.root.visible=!1,this.pos.copy(this.from),this.root.position.copy(this.pos),this.fp=!1,this.fpBlend=0,this.tpBlend=0,this.vel.set(0,0,0),this.hopT=0,this.autoDown=!1,this.skyBeam.material.uniforms.uBase.value.copy(this.land),this.skyBeam.material.uniforms.uLen.value=this.from.y-this.land.y+260,this.skyBeam.visible=!0,this.lightAmp=0}dismiss(){this.state!==`hidden`&&(this.fp&&(this.fp=!1,this.fpBlend=0,this.onView&&this.onView(!1)),this.tpBlend=0,this.from=this.pos.clone(),this.state=`ascending`,this.stateT=0,this.active=!1)}canFirstPerson(){return this.state===`landed`}buildViewModel(){let e=new On;return e.visible=!1,this.camera.add(e),new of().loadAsync(`/models/fp-arms/arm.glb`).then(t=>{let n=null;t.scene.updateMatrixWorld(!0),t.scene.traverse(e=>{e.isMesh&&!n&&(n=e)});let r=n.geometry.clone().applyMatrix4(n.matrixWorld),i=new J(.285,-.726,.626).normalize(),a=new J(.869,.471,.15);a.addScaledVector(i,-a.dot(i)).normalize();let o=i.clone().negate(),s=new J().crossVectors(a,o),c=new Y().makeBasis(s,a,o).transpose();r.applyMatrix4(new Y().makeTranslation(-.084,.045,-.062)).applyMatrix4(c);let l=n.material;l.envMapIntensity=1,l.metalnessMap=null,l.roughnessMap=null,l.metalness=.05,l.roughness=.8,l.emissive=new X(1,1,1),l.emissiveMap=l.map,l.emissiveIntensity=0,Md(l),this.armMat=l;let u=e=>{let t=new On,n=new ri(r,l);return n.frustumCulled=!1,n.renderOrder=35,t.add(n),t.scale.set(2.3*e,2.3,2.3),t};this.armR=u(1),this.armL=u(-1),this.armBase={R:[.98,-1.02,-2.25,.1,.26,-.1],L:[-.92,-.8,-2.3,.42,-.24,.12]},e.add(this.armR,this.armL),this.poseArms(0),console.info(`[futian] 第一人称手臂：已加载 Tripo 模型 /models/fp-arms/arm.glb`)}).catch(t=>{console.warn(`[futian] 第一人称手臂模型 /models/fp-arms/arm.glb 加载失败，退回旧的积木手臂。原因：`,t&&t.message?t.message:t);let n=this.buildViewModelBlocks();n.visible=!0,e.add(n)}),e}poseArms(e){if(!this.armR)return;let t=this.vel?Math.hypot(this.vel.x,this.vel.z):0,n=Math.min(1,t/30),r=(this.walkPh||0)*Math.PI*2,i=this.pos.y>$(this.pos.x,this.pos.z)+.5?.35:1,a=Math.max(0,1-this.fireT/.4),o=a*a,s=(e,t,a,o)=>{e.position.set(t[0]+Math.sin(r)*.03*n*a*i,t[1]+Math.sin(r+(a>0?0:Math.PI))*.07*n*i+Math.sin(this.t*1.3+a)*.012,t[2]+Math.cos(r)*.05*n*a*i+.22*o),e.rotation.set(t[3]+Math.sin(r+(a>0?0:Math.PI))*.03*n*i+.16*o,t[4],t[5]+Math.sin(this.t*.9+a)*.01,`YXZ`)};s(this.armR,this.armBase.R,1,0),s(this.armL,this.armBase.L,-1,o),this.armMat&&(this.armMat.emissiveIntensity=.38*gd.uNight.value)}buildViewModelBlocks(){let e=xd({color:15790316,spec:.4,emissive:.22}),t=xd({color:9080726,spec:.3,emissive:.12}),n=xd({color:13117470,emissive:.3}),r=new On,i=(r,i)=>{let a=new On,o=new ri(new la(.21,1.5,6,14),e);o.rotation.x=Math.PI/2,o.position.z=.55;let s=new ri(new ua(.235,.235,.12,16),n);s.rotation.x=Math.PI/2,s.position.z=-.22;let c=new ri(new ua(.225,.225,.1,16),t);c.rotation.x=Math.PI/2,c.position.z=-.36;let l=new ri(new Qa(.2,14,10),t);l.scale.set(1.05,.62,1.2),l.position.z=-.6,a.add(o,s,c,l);for(let e=0;e<4;e++){let n=new ri(new la(.047,.2,4,8),t);n.rotation.x=Math.PI/2-.25,n.position.set((e-1.5)*.095,.05,-.86),a.add(n)}let u=new ri(new la(.05,.16,4,8),t);return u.rotation.set(Math.PI/2,0,-r*.9),u.position.set(-r*.2,0,-.66),a.add(u),a.position.set(r*.92,i?-.62:-.98,i?-2:-1.75),a.rotation.set(i?.2:-.1,-r*(i?.2:.34),r*.25,`YXZ`),a.traverse(e=>{e.isMesh&&(e.frustumCulled=!1,e.renderOrder=35)}),a};return r.add(i(-1,!0),i(1,!1)),r.visible=!1,this.camera.add(r),r}setFirstPerson(e,t){return e===!!this.fp?this.fp:e&&!this.canFirstPerson()?!1:(this.fp=!!e,t&&(this.fpBlend=+!!e),this.onView&&this.onView(this.fp),this.fp)}toggleFlight(){this.state===`landed`&&(this.inAir?(this.autoDown=!0,this.hopT=0):(this.hopT=1.6,this.autoDown=!1))}controlling(){return this.state===`landed`}giantBlocked(e,t,n){if(!this.grid)return!1;for(let[r,i]of wm){let a=e+r,o=t+i;for(let e of this.grid.query(a,o))if(!(e.top<=n+Cm||e.bottom>=n+lm)&&nf(a,o,e))return!0}return!1}giantGround(e,t,n){let r=$(e,t);if(!this.grid)return r;for(let[i,a]of Tm){let o=e+i,s=t+a;for(let e of this.grid.query(o,s))e.top>n+Cm||e.top<=r||nf(o,s,e)&&(r=e.top)}return r}camInside(e,t,n){if(!this.grid)return!1;for(let r of this.grid.query(e,n))if(t>r.bottom&&t<r.top+4&&nf(e,n,r))return!0;return!1}drive(e,t){if(this.state!==`landed`)return!1;let n=t.keys;if(this.tpBlend<=0&&(this.camFree.copy(t.pos),this.enterYaw=t.yaw,this.enterPitch=t.pitch,t.vel.set(0,0,0),t.mode===`walk`&&t.toggleMode()),this.tpBlend=Math.min(1,this.tpBlend+e/Mm),this.fpBlend=this.fp?Math.min(1,this.fpBlend+e/.9):Math.max(0,this.fpBlend-e/.9),this.tpBlend<1){let e=Im(this.tpBlend),n=this.yaw-this.enterYaw;n=Math.atan2(Math.sin(n),Math.cos(n)),t.yaw=this.enterYaw+n*e,t.pitch=this.enterPitch+(-.1-this.enterPitch)*e}else{this.fp||(t.pitch=Math.max(-1,Math.min(.55,t.pitch)));let r=-Math.sin(t.yaw),i=-Math.cos(t.yaw),a=-i,o=r,s=(n.has(`KeyW`)||n.has(`ArrowUp`)?1:0)-(n.has(`KeyS`)||n.has(`ArrowDown`)?1:0),c=(n.has(`KeyD`)||n.has(`ArrowRight`)?1:0)-(n.has(`KeyA`)||n.has(`ArrowLeft`)?1:0),l=(n.has(`Space`)||n.has(`KeyE`)?1:0)-(n.has(`ControlLeft`)||n.has(`ControlRight`)||n.has(`KeyQ`)?1:0);l!==0&&(this.hopT=0,this.autoDown=!1),this.hopT>0&&(this.hopT-=e,l=1);let u=n.has(`ShiftLeft`)||n.has(`ShiftRight`),d=!!this.inAir;this.autoDown&&(d?l=-1:this.autoDown=!1);let f=(d?75:44)*(u?2.3:1),p=(r*s+a*c*.8)*f,m=(i*s+o*c*.8)*f;this.fp?this.yawTarget=t.yaw:s!==0||c!==0?this.yawTarget=Math.atan2(-p,-m):this.fireT<.9&&(this.yawTarget=t.yaw);let h=1-Math.exp(-e*(d?1.8:2.8));this.vel.x+=(p-this.vel.x)*h,this.vel.z+=(m-this.vel.z)*h,this.vel.y+=(l*46*(u?1.8:1)-this.vel.y)*(1-Math.exp(-e*2.4));let g=this.pos.y,_=this.pos.x+this.vel.x*e,v=this.pos.z+this.vel.z*e;if(this.giantBlocked(this.pos.x,this.pos.z,g)||!this.giantBlocked(_,v,g))this.pos.x=_,this.pos.z=v;else{let t=!1;if(Math.hypot(p,m)>1)for(let n of[.35,-.35,.7,-.7,1.05,-1.05,1.35,-1.35]){let r=Math.cos(n),i=Math.sin(n),a=(p*r-m*i)*r*.9,o=(p*i+m*r)*r*.9;if(!this.giantBlocked(this.pos.x+a*e,this.pos.z+o*e,g)){this.pos.x+=a*e,this.pos.z+=o*e,this.vel.x=a,this.vel.z=o,t=!0;break}}t||(this.vel.x=0,this.vel.z=0)}this.hitWall=this.giantBlocked(this.pos.x-Math.sin(this.yaw)*6,this.pos.z-Math.cos(this.yaw)*6,g),this.pos.y+=this.vel.y*e;let y=this.giantGround(this.pos.x,this.pos.z,Math.max(g,this.pos.y));this.pos.y<=y?(this.pos.y=y,this.vel.y<0&&(this.vel.y=0)):!d&&l<=0&&(this.pos.y-y<=Cm?this.pos.y=y:this.autoDown=!0),this.pos.y=Math.min(this.pos.y,1500),this.land.copy(this.pos),this.inAir=this.pos.y>y+.5,this.walkPh=(this.walkPh||0)+(this.inAir?0:Math.hypot(this.vel.x,this.vel.z)*e/38)}let r=!this.fp&&this.tpBlend>=1&&n.has(`KeyB`)?1:0;this.lookBack=(this.lookBack||0)+(r-(this.lookBack||0))*(1-Math.exp(-e*7)),this.lookBack<.002&&(this.lookBack=0);let i=Im(this.lookBack),a=i*Math.PI;t.camYawOff=a;let o=t.yaw+a,s=t.pitch,c=Math.cos(s),l=this._v.set(-Math.sin(o)*c,Math.sin(s),-Math.cos(o)*c),u=1-i,d=Math.cos(o)*u,f=-Math.sin(o)*u,p=this.pos.x+d*jm-l.x*km,m=this.pos.y+Am-l.y*km,h=this.pos.z+f*jm-l.z*km,g=1;for(let e=1;e<=28;e++){let t=.06+.94*e/28;if(this.camInside(this.pos.x+d*jm-l.x*km*t,this.pos.y+Am-l.y*km*t,this.pos.z+f*jm-l.z*km*t)){g=Math.max(.09,t-.06);break}}this.camK=(this.camK||1)+(g-(this.camK||1))*(1-Math.exp(-e*(g<(this.camK||1)?14:3))),p=this.pos.x+d*jm-l.x*km*this.camK,m=this.pos.y+Am-l.y*km*this.camK,h=this.pos.z+f*jm-l.z*km*this.camK,m=Math.max(m,$(p,h)+4);let _=-Math.sin(this.yaw),v=-Math.cos(this.yaw),y=Math.sin((this.walkPh||0)*Math.PI*2)*.9,b=this.pos.x+_*6,x=this.pos.y+lm*_m+y,S=this.pos.z+v*6,C=Im(this.fpBlend),w=Im(this.tpBlend);return p+=(b-p)*C,m+=(x-m)*C,h+=(S-h)*C,t.pos.set(this.camFree.x+(p-this.camFree.x)*w,this.camFree.y+(m-this.camFree.y)*w,this.camFree.z+(h-this.camFree.z)*w),!0}anchor(e){let t=this.camera,n=t.getWorldDirection(new J),r=new J().crossVectors(n,new J(0,1,0)).normalize();return n.y=0,n.lengthSq()<1e-6&&n.set(0,0,-1),n.normalize(),r.crossVectors(n,new J(0,1,0)).normalize(),e.copy(t.position).addScaledVector(n,mm).addScaledVector(r,hm),e.y=Math.max($(e.x,e.z),t.position.y-62),e}hand(e){return this.fp&&this.fpBlend>.5?this.camera.localToWorld(e.set(-9,-7,-34)):this.handBone&&this.root.visible?(this.handBone.updateWorldMatrix(!0,!1),this.handBone.getWorldPosition(e)):this.modelKind===`fallback-blocks`?e.set(.5,1.5,-.95).multiplyScalar(lm/2.05).applyQuaternion(this.root.quaternion).add(this.root.position):e.copy(pm).multiplyScalar(this.giantScale).applyQuaternion(this.root.quaternion).add(this.root.position)}pickTarget(e,t){let n=null,r=Math.cos(14*Math.PI/180),i=this._v;for(let a of this.targets){let o=Math.hypot(a.x-e.x,a.z-e.z),s=Math.hypot(t.x,t.z)||.001,c=Math.max(a.base+20,Math.min(a.base+a.h*.9,e.y+t.y/s*o));i.set(a.x-e.x,c-e.y,a.z-e.z);let l=i.length();if(l>4500||l<20)continue;let u=i.dot(t)/l+(a.lit?-.03:0)+Math.min(.01,a.h/6e4)-l*4e-6;u>r&&(r=u,n=a,n._aimY=c)}return n}fire(e){if(!this.active||this.orbs.length>=cm)return null;gd.uNight.value<.5&&this.setNight(!0);let t=this.camera.getWorldDirection(new J),n=this.hand(new J),r=e||this.pickTarget(this.camera.position,t);r&&r._aimY==null&&(r._aimY=r.base+r.h*.55);let i={p:n.clone(),v:t.clone().multiplyScalar(am),age:0,target:r,trail:[],dive:0,seed:Math.random()*10};return this.orbs.push(i),this.fireT=0,i}fixLegs(e){let t=this._lg||={H:new J,K:new J,A:new J,t:new J,u:new J,w:new J,p:new J,q:new At,q2:new At,fq:new At,f:new J,r:new J,legs:[{},{}]},n=this.state===`arriving`||this.state===`ascending`||!!this.inAir;this.wasAir&&!n&&(this.landT=0),this.wasAir=n,this.landT=this.landT==null?9:this.landT+e,this.legAirK=(this.legAirK==null?+!!n:this.legAirK)+(+!!n-(this.legAirK==null?0:this.legAirK))*(1-Math.exp(-e*9));let r=Math.max(0,Math.min(1,this.legAirK)),i=this.landT/.55,a=i>=1?0:i<.18?i/.18:(1-(i-.18)/.82)**2,o=Math.max(0,1-(this.animW.walk||0)-(this.animW.run||0)),s=Math.PI/180;this.model.position.y=this.modelY0,this.root.updateMatrixWorld(!0);let c=this.yaw;t.f.set(-Math.sin(c),0,-Math.cos(c)),t.r.set(Math.cos(c),0,-Math.sin(c));let l=(e,t,n)=>Math.sqrt(e*e+t*t+2*e*t*Math.cos(n*s)),u=1/0,d=[];for(let e=0;e<2;e++){let n=this.legs[e],r=t.legs[e];n.th.getWorldPosition(t.H),n.ca.getWorldPosition(t.K),n.ft.getWorldPosition(t.A);let i=t.K.distanceTo(t.H),c=t.A.distanceTo(t.K);t.u.subVectors(t.K,t.H),t.w.subVectors(t.A,t.K);let f=Math.acos(Math.max(-1,Math.min(1,t.u.dot(t.w)/(i*c))))/s,p=f+(3-f)*o;p=Math.max(p,30*a);let m=l(i,c,p),h=Math.hypot(t.A.x-t.H.x,t.A.z-t.H.z),g=Math.sqrt(Math.max(0,m*m-h*h)),_=t.H.y-t.A.y;u=Math.min(u,g-_),r.a=i,r.b=c,r.A0=(r.A0||new J).copy(t.A),r.bend0=f,r.dG=m,r.vNow=_,r.h=h,r.hx=h>.001?(t.A.x-t.H.x)/h:t.r.x*(n.sd===`L`?-1:1),r.hz=h>.001?(t.A.z-t.H.z)/h:t.r.z*(n.sd===`L`?-1:1);let v=(t.A.x-t.H.x)*t.r.x+(t.A.z-t.H.z)*t.r.z,y=Math.max(-.05,Math.min(.12,v/(i+c)*(n.sd===`L`?-1:1)))*(n.sd===`L`?-1:1),b=n.sd===`L`?12:8,x=n.sd===`L`?.16:.1;r.dirA=(r.dirA||new J).set(0,-1,0).addScaledVector(t.f,-x).addScaledVector(t.r,y).normalize(),r.dA=l(i,c,b),d.push(n.sd+` `+f.toFixed(0))}isFinite(u)||(u=0),u=Math.max(-.2*lm,Math.min(.25*lm,u))*(1-r),this.model.position.y=this.modelY0+u/(lm*(this.root.scale.y||1)),this.root.updateMatrixWorld(!0);let f=[];for(let e=0;e<2;e++){let n=this.legs[e],i=t.legs[e];n.th.getWorldPosition(t.H);let a=i.vNow+u,o=Math.max(i.h,Math.sqrt(Math.max(0,i.dG*i.dG-a*a)));t.t.set(t.H.x+i.hx*o,i.A0.y,t.H.z+i.hz*o),t.p.copy(t.H).addScaledVector(i.dirA,i.dA),t.t.lerp(t.p,r),this.solveLeg(n,t.t,t.f),n.th.getWorldPosition(t.H),n.ca.getWorldPosition(t.K),n.ft.getWorldPosition(t.A),t.u.subVectors(t.K,t.H),t.w.subVectors(t.A,t.K),f.push(n.sd+` `+i.bend0.toFixed(0)+`→`+(Math.acos(Math.max(-1,Math.min(1,t.u.dot(t.w)/(t.u.length()*t.w.length()))))/s).toFixed(0)+`°`)}this.legInfo=f.join(` / `)+` lift `+u.toFixed(1)+`m`+(a>0?` landing`:``)}solveLeg(e,t,n){let r=this._ik||={H:new J,K:new J,A:new J,d:new J,p:new J,K2:new J,A2:new J,v1:new J,v2:new J,dq:new At,bw:new At,pw:new At,fw:new At};e.th.getWorldPosition(r.H),e.ca.getWorldPosition(r.K),e.ft.getWorldPosition(r.A),e.ft.getWorldQuaternion(r.fw);let i=r.K.distanceTo(r.H),a=r.A.distanceTo(r.K);r.d.subVectors(t,r.H);let o=r.d.length();if(o<1e-6)return;r.d.multiplyScalar(1/o),o=Math.max(Math.abs(i-a)+.001,Math.min(i+a-.001*(i+a),o));let s=Math.max(-1,Math.min(1,(i*i+o*o-a*a)/(2*i*o))),c=Math.sqrt(1-s*s);if(r.p.copy(n).addScaledVector(r.d,-n.dot(r.d)),r.p.lengthSq()<1e-8)return;r.p.normalize(),r.K2.copy(r.H).addScaledVector(r.d,i*s).addScaledVector(r.p,i*c),r.A2.copy(r.H).addScaledVector(r.d,o);let l=(e,t,n)=>{r.dq.setFromUnitVectors(t.normalize(),n.normalize()),e.getWorldQuaternion(r.bw),e.parent.getWorldQuaternion(r.pw),e.quaternion.copy(r.pw.invert()).multiply(r.dq).multiply(r.bw),e.updateMatrixWorld(!0)};l(e.th,r.v1.subVectors(r.K,r.H),r.v2.subVectors(r.K2,r.H)),e.ca.getWorldPosition(r.K),e.ft.getWorldPosition(r.A),l(e.ca,r.v1.subVectors(r.A,r.K),r.v2.subVectors(r.A2,r.K)),e.ft.parent.getWorldQuaternion(r.pw),e.ft.quaternion.copy(r.pw.invert()).multiply(r.fw),e.ft.updateMatrixWorld(!0)}update(e){if(this.t+=e,this.fireT+=e,this.state!==`hidden`&&!this.frozen){this.stateT+=e,this.camera;let t=1,n=0;if(this.state===`arriving`){let e=this.stateT;this.lightAmp=Math.min(1,e/.5),this.skyBeam.material.uniforms.uHead.value=1-Im(e/(Em*.85));let t=Im((e-Em)/Dm);this.pos.lerpVectors(this.from,this.land,t),e>=6&&(this.state=`landed`,this.stateT=0,this.pos.copy(this.land))}else if(this.state===`landed`){if(this.pos.copy(this.land),this.stateT<bm){let e=this.stateT/bm;t=1-.035*Math.sin(e*Math.PI)*(1-e*.5)}this.lightAmp=Math.max(0,1-this.stateT/1.6);let r=Math.hypot(this.vel.x,this.vel.z),i=this.vel.x*-Math.sin(this.yaw)+this.vel.z*-Math.cos(this.yaw),a=-(this.inAir?.42:.1)*Math.max(-.5,Math.min(1,i/75));this.lean=(this.lean||0)+(a-(this.lean||0))*(1-Math.exp(-e*4)),n=this.lean,this.bobY=this.inAir?Math.sin(this.t*.9)*1.5:Math.abs(Math.sin((this.walkPh||0)*Math.PI*2))*1.8*Math.min(1,r/30)}else if(this.state===`ascending`){let e=Math.min(1,this.stateT/ym),t=e*e*(.4+.6*e);this.pos.copy(this.from),this.pos.y+=t*760,this.lightAmp=Math.min(1,this.stateT/.6)*(1-Im((this.stateT-ym+.8)/.8)),this.skyBeam.material.uniforms.uBase.value.set(this.from.x,$(this.from.x,this.from.z),this.from.z),this.skyBeam.material.uniforms.uHead.value=0,this.skyBeam.visible=!0,this.bobY=0,this.stateT>=ym&&(this.state=`hidden`,this.root.visible=!1,this.lightAmp=0)}let r=this.yawTarget-this.yaw;if(r=Math.atan2(Math.sin(r),Math.cos(r)),this.yaw+=r*(1-Math.exp(-e*(this.fp?12:9))),this.root.position.copy(this.pos),this.state===`landed`&&(this.root.position.y+=this.bobY||0),this.skyBeam.material.uniforms.uAmp.value=this.lightAmp,this.lightAmp<=0&&this.state!==`arriving`&&(this.skyBeam.visible=!1),this.state!==`hidden`&&(this.root.visible=!(this.fpBlend>.72)&&!(this.state===`arriving`&&this.stateT<Em)),this.vm&&(this.vm.visible=this.fpBlend>.72,this.vm.visible&&this.poseArms(e)),this.mixer){let t=Math.hypot(this.vel.x,this.vel.z),r=`idle`,i=1;this.state===`arriving`||this.state===`ascending`||this.inAir?r=this.actions.jump?`jump`:`idle`:t>62?(r=`run`,i=Math.max(.55,Math.min(1.1,t/150))):t>3&&(r=`walk`,i=Math.max(.45,Math.min(1.2,t/62)));let a=1-Math.exp(-e*7);for(let e in this.actions){let t=this.animW[e]+(+(e===r)-this.animW[e])*a;this.animW[e]=t,this.actions[e].setEffectiveWeight(t),e===r&&e!==`jump`&&this.actions[e].setEffectiveTimeScale(i)}if(this.actions.jump){r===`jump`&&this.prevWant!==`jump`&&(this.jumpT=this.state===`landed`?0:this.jumpApex),r===`jump`&&(this.jumpT=Math.min(this.jumpApex,this.jumpT+e));let t=this.actions.jump;t.paused=!1,t.enabled=!0,t.time=this.jumpT}this.prevWant=r,this.clipTime=this.actions[r]?this.actions[r].time:0,this.mixer.update(e),this.anim=r===`jump`?this.jumpT<this.jumpApex?`takeoff`:`air-hold`:r,this.state===`landed`&&(n=this.inAir?(this.lean||0)*.6:0,this.bobY=0,this.root.position.y=this.pos.y)}this.root.rotation.set(n,this.yaw,0,`YXZ`),this.root.scale.set(1,t,1),this.mixer&&this.legs&&this.legs.length===2&&this.root.visible&&this.fixLegs(e);for(let e of this.mats)e.emissiveIntensity=.42*gd.uNight.value;if(this.player&&this.state!==`hidden`){let e=this.player.pos,t=e.x-this.pos.x,n=e.z-this.pos.z,r=Math.hypot(t,n);if(this.state!==`landed`&&r<vm&&e.y>this.pos.y-3&&e.y<this.pos.y+lm+4){let i=vm/Math.max(r,.001);e.x=this.pos.x+t*i,e.z=this.pos.z+n*i}}let i=Math.max(0,1-this.fireT/1.2);this.arm&&this.arm.rotation.set(-.25-1.25*Math.min(1,i*2.2),-.55*Math.min(1,i*2.2),.22)}if(this.wave){let e=Ed(gd.uTime.value-this.wave.t0);if(e>0){let t=!0;for(let n of this.targets)n.lit||(Math.hypot(n.x-this.wave.x,n.z-this.wave.z)<=e?n.lit=!0:t=!1);this.allLit=t}}let t=0,n=(e,n,r,i,a)=>{t>=this.sprites.instanceMatrix.count||(this._m.makeScale(n,n,n).setPosition(e),this.sprites.setMatrixAt(t,this._m),this._c.setRGB(r,i,a),this.sprites.setColorAt(t,this._c),t++)};for(let t=this.orbs.length-1;t>=0;t--){let r=this.orbs[t];r.age+=e;let i=r.target;if(i&&!r.dive){let t=this._v.set(i.x-r.p.x,i._aimY-r.p.y,i.z-r.p.z),n=t.length();t.normalize();let a=r.v.clone().normalize().lerp(t,Math.min(1,e*(2.2+600/Math.max(60,n)))).normalize();r.v.copy(a).multiplyScalar(am*(1+Math.min(1.2,r.age*.5))),Math.hypot(i.x-r.p.x,i.z-r.p.z)<i.R*.85&&Math.abs(r.p.y-i._aimY)<60&&(r.dive=1e-4,r.hit=r.p.clone(),r.v.setLength(120))}if(r.p.addScaledVector(r.v,e),r.dive&&(r.dive+=e,r.dive>.35&&!r.done)){if(r.done=!0,Td(r.hit,i),this.hits++,this.hits>=3){let e=Od(i.x,i.z,.8,this.targets);this.wave={x:i.x,z:i.z,t0:e};for(let e of this.targets)e!==i&&(e.lit=!1)}this.bursts.push({p:r.hit.clone(),age:0}),this.onHit(i)}let a=$(r.p.x,r.p.z);if(r.age>om||r.dive&&r.dive>.5||r.p.y<a){!r.done&&r.p.y<a+1&&this.bursts.push({p:r.p.clone(),age:0,small:!0}),this.orbs.splice(t,1);continue}r.trail.unshift(r.p.clone()),r.trail.length>sm&&r.trail.pop();let o=r.dive?Math.max(.05,1-r.dive/.5):1,s=1+.15*Math.sin(this.t*30+r.seed);n(r.p,46*gm*o*s,.1,.3,.42),n(r.p,17*gm*o*s,.35,.85,1),n(r.p,6.5*gm*o,1.6,1.6,1.5);for(let e=1;e<r.trail.length;e++){let t=1-e/sm;n(r.trail[e],(10*t+2.5)*gm*o,.25*t*t,.75*t*t,1*t*t)}}if(this.lightAmp>0&&this.state!==`hidden`){let e=this.lightAmp,t=this.skyBeam.material.uniforms,r=this._v.copy(t.uBase.value);r.y+=t.uLen.value-200,n(r,620*e,.3*e,.55*e,.75*e),n(r,240*e,.9*e,1.1*e,1.2*e);let i=new J(t.uBase.value.x,t.uBase.value.y+6,t.uBase.value.z),a=1-t.uHead.value;if(n(i,300*e*a,.22*e,.5*e,.7*e),this.state===`arriving`&&this.stateT>1.2){let e=1-Im((this.stateT-Em)/Dm);n(new J(this.pos.x,this.pos.y+55,this.pos.z),150+260*e,.25*e+.05,.55*e+.1,.75*e+.12)}}let r=this.fp&&this.fpBlend>.5;if(this.active&&this.fireT<.6&&!r){let e=1-this.fireT/.6,t=this.hand(new J);n(t,60*e+14,.35*e,.85*e,1*e),n(t,20*e,1.5*e,1.5*e,1.4*e)}if(r){let e=Math.max(0,1-this.fireT/.5),t;this.armL?(this.camera.updateMatrixWorld(!0),t=this.armL.localToWorld(new J(0,-.11,-.36))):t=this.camera.localToWorld(new J(-.78,-.5,-2.55));let r=.85+.15*Math.sin(this.t*6);n(t,(1.5+2.2*e)*r,.25+.5*e,.75+.4*e,1+.3*e),n(t,.5+.6*e,1.4,1.4,1.3)}for(let t=this.bursts.length-1;t>=0;t--){let r=this.bursts[t];r.age+=e;let i=r.small?.5:1.1;if(r.age>i){this.bursts.splice(t,1);continue}let a=r.age/i,o=(r.small?30:90)+(r.small?60:420)*a,s=(1-a)*(1-a);n(r.p,o,.5*s,.95*s,1.1*s),n(r.p,o*.35,1.4*s,1.4*s,1.2*s)}this.sprites.count=t,this.sprites.instanceMatrix.needsUpdate=!0,this.sprites.instanceColor.needsUpdate=!0}},Wm=1700,Gm=(e,t)=>Math.round(e*2)+`,`+Math.round(t*2),Km={motorway:[22,30],trunk:[17,20],primary:[14.5,20],secondary:[11.5,30],tertiary:[9,44],motorway_link:[12,60],trunk_link:[11,60],primary_link:[10,60],secondary_link:[9,70]};function qm(e){return function(){e|=0,e=e+1831565813|0;let t=Math.imul(e^e>>>15,1|e);return t=t+Math.imul(t^t>>>7,61|t)^t,((t^t>>>14)>>>0)/4294967296}}var Jm=class{constructor(){this.P=[],this.N=[],this.C=[],this.A=[]}box(e,t,n,r,i,a,o,s=0,c=[0,0,0]){let l=e-r/2,u=e+r/2,d=t-i/2,f=t+i/2,p=n-a/2,m=n+a/2,h=l+c[2],g=u-c[2],_=p+c[1],v=m-c[0],y=[[l,d,p],[u,d,p],[u,d,m],[l,d,m],[h,f,_],[g,f,_],[g,f,v],[h,f,v]],b=[[3,2,6,7],[1,0,4,5],[2,1,5,6],[0,3,7,4],[4,7,6,5],[0,1,2,3]],x=new J,S=new J,C=new J;for(let e of b){x.set(y[e[1]][0]-y[e[0]][0],y[e[1]][1]-y[e[0]][1],y[e[1]][2]-y[e[0]][2]),S.set(y[e[3]][0]-y[e[0]][0],y[e[3]][1]-y[e[0]][1],y[e[3]][2]-y[e[0]][2]),C.crossVectors(x,S).normalize();for(let t of[0,1,2,0,2,3])this.P.push(...y[e[t]]),this.N.push(C.x,C.y,C.z),this.C.push(...o),this.A.push(s)}}wheels(e,t,n,r){for(let i of t)for(let t of[-1,1]){let a=new ua(n,n,r,10).toNonIndexed();a.rotateZ(Math.PI/2),a.translate(t*e,n,i);let o=a.attributes.position,s=a.attributes.normal;for(let e=0;e<o.count;e++)this.P.push(o.getX(e),o.getY(e),o.getZ(e)),this.N.push(s.getX(e),s.getY(e),s.getZ(e)),this.C.push(.05,.05,.055),this.A.push(0);a.dispose()}}build(){let e=new kr;return e.setAttribute(`position`,new Z(this.P,3)),e.setAttribute(`normal`,new Z(this.N,3)),e.setAttribute(`color`,new Z(this.C,3)),e.setAttribute(`aPaint`,new Z(this.A,1)),e}},Ym=[.06,.09,.12],Xm=[.07,.07,.08],Zm=[1,.98,.9],Qm=[.75,.05,.04],$m=[.92,.92,.9],eh=[1,1,1];function th(e){let t=new Jm,n=e?4.75:4.6,r=e?1.9:1.8,i=e?.82:.66,a=e?.72:.58,o=e?.34:.28;t.box(0,o+i/2,0,r,i,n,eh,1,[.12,.08,.05]),t.box(0,o-.06,0,r-.1,.14,n-.3,Xm);let s=e?2.9:2.5,c=e?-.35:-.2;t.box(0,o+i+a/2,c,r-.14,a,s,Ym,0,e?[.62,.22,.14]:[.75,.62,.16]),t.box(0,o+i+a+.02,c-(e?.2:.06),r-.46,.05,s-(e?.95:1.42),eh,1);for(let e of[-1,1])t.box(e*(r/2-.34),o+i*.72,n/2-.04,.42,.14,.08,Zm),t.box(e*(r/2-.34),o+i*.76,-n/2+.04,.46,.12,.08,Qm);return t.wheels(r/2-.12,[n*.3,-n*.3],e?.37:.32,.24),t.build()}function nh(){let e=new Jm,t=4.7,n=1.82;e.box(0,.6699999999999999,0,n,.74,t,[.1,.36,.78],0,[.12,.08,.05]),e.box(0,.54,0,1.84,.16,4.2,$m),e.box(0,.24,0,1.72,.14,4.4,Xm),e.box(0,1.37,-.3,1.6800000000000002,.66,2.9,Ym,0,[.62,.3,.14]),e.box(0,1.7200000000000002,-.4,1.36,.05,1.9,[.1,.36,.78]),e.box(0,1.8200000000000003,-.2,.42,.14,.2,[.95,.85,.3]);for(let r of[-1,1])e.box(r*(n/2-.34),.8328,t/2-.04,.42,.14,.08,Zm),e.box(r*(n/2-.34),.8624,-2.31,.46,.12,.08,Qm);return e.wheels(n/2-.12,[t*.3,-1.41],.33,.24),e.build()}function rh(){let e=new Jm,t=11.6,n=2.5;e.box(0,.88,0,n,1,t,eh,1),e.box(0,1.9300000000000002,0,2.48,1.1,11.5,Ym),e.box(0,2.7399999999999998,0,n,.52,t,$m,0,[.15,.1,.08]),e.box(0,3.1,-1,1.8,.26,t*.55,[.82,.83,.84]);for(let r=-4.6;r<t/2-.6;r+=1.45)for(let t of[-1,1])e.box(t*(n/2-.02),1.9300000000000002,r,.06,1.1,.12,$m);e.box(0,.3,0,2.4,.2,11.2,Xm);for(let r of[-1,1])e.box(r*(n/2-.4),.88,t/2-.03,.5,.2,.08,Zm),e.box(r*(n/2-.3),1.08,-5.77,.3,.5,.08,Qm);return e.box(0,2.58,t/2-.03,1.6,.3,.08,[.95,.6,.1]),e.wheels(n/2-.16,[t*.3,-3.132],.5,.3),e.build()}function ih(){let e=new Jm,t=6.2,n=2.1;e.box(0,1.67,-.9,n,2.3,4.2,$m),e.box(0,.9199999999999999,t/2-.95,2.04,1,1.9,eh,1),e.box(0,1.8399999999999999,t/2-1.05,2,.86,1.7,Ym,0,[.5,0,.08]),e.box(0,2.29,t/2-1.3,1.8,.06,1.1,eh,1),e.box(0,.31999999999999995,0,1.9000000000000001,.2,5.9,Xm);for(let r of[-1,1])e.box(r*(n/2-.36),.9199999999999999,t/2-.02,.4,.18,.08,Zm),e.box(r*(n/2-.2),.72,-3.08,.24,.3,.08,Qm);return e.wheels(n/2-.14,[t*.3,-6.2*.28],.42,.28),e.build()}var ah=[{make:()=>th(!1),len:4.6,wid:1.8,hgt:1.5,share:.46,cap:2600,glb:`sedan`,tint:.7},{make:()=>th(!0),len:4.75,wid:1.9,hgt:1.9,share:.22,cap:1400,glb:`suv`,tint:.35},{make:nh,len:4.7,wid:1.82,hgt:1.7,share:.12,cap:700,glb:`taxi`,tint:0},{make:rh,len:11.6,wid:2.5,hgt:3.3,share:.07,cap:420,glb:`bus`,tint:0},{make:ih,len:6.2,wid:2.1,hgt:2.8,share:.06,cap:420,glb:`truck`,tint:0},{make:()=>th(!0),len:5,wid:1.9,hgt:1.9,share:.07,cap:500,glb:`mpv`,tint:.6}],oh=260,sh=48,ch={sedan:!0,suv:!0,taxi:!0,bus:!1,truck:!0,mpv:!1},lh=[[.93,.93,.92],[.93,.93,.92],[.08,.08,.09],[.08,.08,.09],[.62,.64,.66],[.62,.64,.66],[.36,.38,.4],[.55,.08,.08],[.1,.2,.42],[.75,.72,.62],[.16,.3,.22],[.85,.5,.1]],uh=[[.1,.55,.36],[.12,.42,.75],[.1,.55,.36],[.85,.42,.12]];function dh(){return new co({uniforms:_d(),vertexShader:`
      attribute vec3 color; attribute float aPaint;
      varying vec3 vWorld; varying vec3 vN; varying vec3 vCol; varying float vPaint;
      void main(){
        vec4 lp = vec4(position, 1.0); vec3 ln = normal;
        vec3 paint = vec3(0.8);
        #ifdef USE_INSTANCING
          lp = instanceMatrix * lp; ln = mat3(instanceMatrix) * ln;
        #endif
        #ifdef USE_INSTANCING_COLOR
          paint = instanceColor;
        #endif
        vCol = mix(color, paint, aPaint); vPaint = aPaint;
        vec4 wp = modelMatrix * lp; vWorld = wp.xyz; vN = normalize(mat3(modelMatrix) * ln);
        gl_Position = projectionMatrix * viewMatrix * wp;
      }`,fragmentShader:`
      ${bd}
      varying vec3 vWorld; varying vec3 vN; varying vec3 vCol; varying float vPaint;
      void main(){
        vec3 n = normalize(vN);
        vec3 V = normalize(vWorld - cameraPosition);
        float sh = sunShadow(vWorld, n);
        vec3 col = lightLin(toLin(vCol), n, sh, 0.9);
        // 车漆和玻璃反射天空
        float lum = dot(vCol, vec3(0.333));
        float glossy = max(vPaint, step(lum, 0.13) * step(0.07, lum));
        vec3 R = reflect(V, n);
        float fres = pow(1.0 - max(dot(-V, n), 0.0), 3.0);
        col = mix(col, skyColor(vec3(R.x, abs(R.y), R.z)), glossy * (0.10 + 0.45 * fres));
        col += glossy * sh * pow(max(dot(n, normalize(uSunDir - V)), 0.0), 90.0) * 0.9;
        // 车灯自发光
        if (lum > 0.94 && vPaint < 0.5 && abs(n.y) < 0.5) col = max(col, vCol);
        // 夜景：尾灯亮红
        if (vPaint < 0.5 && vCol.r > 0.6 && vCol.g < 0.15) col = mix(col, vec3(1.0, 0.10, 0.06), uNight);
        gl_FragColor = vec4(atmo(col, vWorld), 1.0);
      }`})}function fh(){return new co({uniforms:_d(),transparent:!0,depthWrite:!1,polygonOffset:!0,polygonOffsetFactor:-6,polygonOffsetUnits:-12,vertexShader:`
      varying vec2 vUv; varying vec3 vWorld;
      void main(){
        vUv = uv;
        vec4 wp = modelMatrix * instanceMatrix * vec4(position, 1.0); vWorld = wp.xyz;
        gl_Position = projectionMatrix * viewMatrix * wp;
      }`,fragmentShader:`
      ${bd}
      varying vec2 vUv; varying vec3 vWorld;
      void main(){
        vec2 d = abs(vUv - 0.5) * 2.0;
        float a = (1.0 - smoothstep(0.72, 1.0, d.x)) * (1.0 - smoothstep(0.80, 1.0, d.y));
        float lit = sunShadow(vWorld, vec3(0.0, 1.0, 0.0));
        gl_FragColor = vec4(vec3(0.02, 0.03, 0.05), a * (0.22 + 0.36 * lit));
      }`})}function ph(e){let t=e.roadClasses,n=[];for(let r of e.roads){let e=t[r[0]],i=Km[e];if(!i)continue;let[,a,o,s,c]=r;if(c.length<4||o<1)continue;let l=Kd.get(r),u=c.length/2,d=t=>{let n=[];for(let e=0;e<u;e++){let r=t?u-1-e:e;n.push([c[r*2],c[r*2+1]])}let d,f,p=a/2;if(s){d=Math.min(o,6);let e=(a-1.2)/d;f=Array.from({length:d},(t,n)=>-p+.6+(n+.5)*e)}else{d=Math.max(1,Math.min(3,Math.floor(o/2)));let e=(p-.6)/d;f=Array.from({length:d},(t,n)=>(n+.5)*e)}return{pts:n,offs:f,cls:e,cfg:i,rev:t,el:l,total:l?l.acc[l.acc.length-1]:0,a:Gm(...n[0]),b:Gm(...n[n.length-1]),used:!1,name:r[7]||``}};n.push(d(!1)),s||n.push(d(!0))}let r=new Map,i=new Map;for(let e of n)r.has(e.a)||r.set(e.a,[]),r.get(e.a).push(e),i.set(e.b,(i.get(e.b)||0)+1);let a=(e,t)=>{let n=t?e.length-1:1,r=e[n][0]-e[n-1][0],i=e[n][1]-e[n-1][1],a=Math.hypot(r,i)||1;return[r/a,i/a]},o=[],s=n.slice().sort((e,t)=>(i.get(e.a)||0)-(i.get(t.a)||0));for(let e of s){if(e.used)continue;let t=[],n=e,i=0;for(;n&&!n.used&&i<9e3;){n.used=!0,t.push(n);for(let e=1;e<n.pts.length;e++)i+=Math.hypot(n.pts[e][0]-n.pts[e-1][0],n.pts[e][1]-n.pts[e-1][1]);let e=a(n.pts,!0),o=null,s=.5;for(let t of r.get(n.b)||[]){if(t.used)continue;let r=a(t.pts,!1),i=e[0]*r[0]+e[1]*r[1];t.cls===n.cls&&(i+=.3),t.name&&t.name===n.name&&(i+=.3),i>s&&(s=i,o=t)}n=o}let s=[],c=[],l=[],u=[],d=[],f=0;for(let e of t){let t=0;for(let n=0;n<e.pts.length;n++){if(n>0){let r=Math.hypot(e.pts[n][0]-e.pts[n-1][0],e.pts[n][1]-e.pts[n-1][1]);f+=r,t+=r}else if(s.length)continue;let r=0;if(e.el){let{acc:n,elev:i}=e.el,a=e.rev?e.total-t:t,o=1;for(;o<n.length-1&&n[o]<a;)o++;let s=Math.max(0,Math.min(1,(a-n[o-1])/Math.max(.001,n[o]-n[o-1])));r=i[o-1]+(i[o]-i[o-1])*s}s.push(e.pts[n][0]),c.push(e.pts[n][1]),l.push(f),u.push(r),d.push(e)}}if(f<60)continue;let p=1/0,m=-1/0,h=1/0,g=-1/0;for(let e=0;e<s.length;e++)p=Math.min(p,s[e]),m=Math.max(m,s[e]),h=Math.min(h,c[e]),g=Math.max(g,c[e]);o.push({X:s,Z:c,S:l,E:u,segAt:d,len:f,x0:p,x1:m,z0:h,z1:g,cfg:t[0].cfg,maxLanes:Math.max(...t.map(e=>e.offs.length)),cars:[]})}return o}function mh(e){let t={on:!1,x:0,z:0,y:0},n=[],r=qm(424242),i=ph(e),a=0;for(let e of i){let[t,n]=e.cfg;for(let i=0;i<e.maxLanes;i++){let o=t*(1.12-.09*i+(r()-.5)*.06),s=r()*n;for(;s<e.len-8;){let t=r(),c=0,l=0;for(let e=0;e<ah.length;e++)if(l+=ah[e].share,t<l){c=e;break}c===3&&i<e.maxLanes-1&&r()<.75&&(c=0);let u=c===3?uh[Math.floor(r()*uh.length)]:lh[Math.floor(r()*lh.length)];e.cars.push({s0:s,lane:i,v:o,type:c,paint:u,jitter:(r()-.5)*.5}),a++,s+=ah[c].len+4+n*(.25+r()*1.3)}}}let o=dh(),s=new On,c=ah.map(e=>{let t=new ki(e.make(),o,e.cap);return t.instanceMatrix.setUsage(Ue),t.setColorAt(0,new X(1,1,1)),t.instanceColor.setUsage(Ue),t.frustumCulled=!1,t.count=0,t.renderOrder=6,s.add(t),t}),l=new co({uniforms:_d(),transparent:!0,depthWrite:!1,blending:2,side:2,vertexShader:`attribute vec3 color; varying vec3 vC; varying vec2 vUv;
      void main(){ vC = color; vUv = uv; gl_Position = projectionMatrix * viewMatrix * modelMatrix * instanceMatrix * vec4(position, 1.0); }`,fragmentShader:`uniform float uNight; varying vec3 vC; varying vec2 vUv;
      void main(){ float a = pow(1.0 - vUv.y, 1.6) * (1.0 - vUv.x * vUv.x); gl_FragColor = vec4(vC * a * uNight * 1.45, 1.0); }`}),u=ah.map((e,t)=>{let n=[],r=[],i=[],a=(e,t,a)=>{for(let o of[0,1,2,0,2,3])n.push(...e[o]),r.push(...t),i.push(...a[o])},o=e.len/2,c=[1,.93,.78],u=[1,.08,.04];a([[-1.5,.08,o],[1.5,.08,o],[2.8,.08,o+20],[-2.8,.08,o+20]],c.map(e=>e*.55),[[-1,0],[1,0],[1,1],[-1,1]]),a([[-1.2,.08,-o],[1.2,.08,-o],[1.7,.08,-o-6],[-1.7,.08,-o-6]],u.map(e=>e*.6),[[-1,0],[1,0],[1,1],[-1,1]]);let d=Math.min(.75,e.hgt*.42),f=Math.min(1,e.hgt*.5),p=o;for(let t of[-1,1]){let n=t*e.wid*.36,r=t*e.wid*.38;a([[n-.32,d-.18,p+.08],[n+.32,d-.18,p+.08],[n+.32,d+.18,p+.08],[n-.32,d+.18,p+.08]],c.map(e=>e*.55),[[-1,.3],[1,.3],[1,.3],[-1,.3]]),a([[r-.28,f-.14,-p-.08],[r+.28,f-.14,-p-.08],[r+.28,f+.14,-p-.08],[r-.28,f+.14,-p-.08]],u.map(e=>e*.5),[[-1,.3],[1,.3],[1,.3],[-1,.3]])}let m=new kr;m.setAttribute(`position`,new Z(n,3)),m.setAttribute(`color`,new Z(r,3)),m.setAttribute(`uv`,new Z(i,2));let h=new ki(m,l,e.cap);return h.instanceMatrix.setUsage(Ue),h.frustumCulled=!1,h.count=0,h.renderOrder=21,h.visible=!1,Ad.push(h),s.add(h),h}),d=ah.map(()=>null),f=new Int32Array(ah.length),p=new Int32Array(ah.length),m=new of,h=ah.map(()=>null),g=new Int32Array(ah.length),_=(e,t)=>{let n=null;e.scene.updateMatrixWorld(!0),e.scene.traverse(e=>{e.isMesh&&!n&&(n=e)});let r=n.geometry.clone().applyMatrix4(n.matrixWorld);ch[t.glb]&&r.rotateY(Math.PI),r.computeBoundingBox();let i=r.boundingBox,a=t.len/(i.max.z-i.min.z),o=Math.min(a,t.wid*1.15/(i.max.x-i.min.x)),s=Math.min(a,t.hgt*1.12/(i.max.y-i.min.y));r.translate(-(i.min.x+i.max.x)/2,-i.min.y,-(i.min.z+i.max.z)/2),r.scale(o,s,a);let c=n.material;return c.metalness=.25,c.roughness=.42,c.metalnessMap=null,c.roughnessMap=null,c.normalMap=null,c.envMapIntensity=1,Md(c),{geo:r,sm:c}},v=(e,t,n)=>{let r=new ki(e,t,n);return r.instanceMatrix.setUsage(Ue),r.setColorAt(0,new X(1,1,1)),r.instanceColor.setUsage(Ue),r.frustumCulled=!1,r.count=0,r.renderOrder=6,s.add(r),r};ah.forEach((e,t)=>{if(e.glb)for(let n of[`-lod1`,``])m.loadAsync(`/models/cars/`+e.glb+n+`.glb`).then(r=>{let{geo:i,sm:a}=_(r,e),o=v(i,a,n?oh:sh);o.name=`car-`+e.glb+(n||`-hi`),n?d[t]=o:h[t]=o,A.glb=(A.glb||0)+1}).catch(t=>console.warn(`[futian] 车模 `+e.glb+n+`.glb 加载失败，继续用方块车：`,t&&t.message?t.message:t))});let y=ah.reduce((e,t)=>e+t.cap,0),b=new Za(1,1);b.rotateX(-Math.PI/2);let x=new ki(b,fh(),y);x.instanceMatrix.setUsage(Ue),x.frustumCulled=!1,x.count=0,x.renderOrder=5.5,s.add(x);let S=_d().uSunDir.value,C=Math.hypot(S.x,S.z)/S.y,w=-S.x/Math.hypot(S.x,S.z),T=-S.z/Math.hypot(S.x,S.z),E=new Y,D=new X,O=0,k=new Int32Array(ah.length),A={routes:i.length,cars:a,visible:0,km:i.reduce((e,t)=>e+t.len,0)/1e3};function j(e,r){O+=e,n.length=0,k.fill(0),f.fill(0),p.fill(0),g.fill(0);let a=0,o=r.x,s=r.z,l=Wm*Wm;for(let e of i){if(o<e.x0-Wm||o>e.x1+Wm||s<e.z0-Wm||s>e.z1+Wm)continue;let{X:r,Z:i,S:m,E:_,segAt:v,len:b}=e,S=1,A=-1;for(let j of e.cars){let e=(j.s0+j.v*O)%b;if(e<A||e>m[Math.min(m.length-1,S+8)]){let t=1,n=m.length-1;for(;t<n;){let r=t+n>>1;m[r]<e?t=r+1:n=r}S=t}else for(;S<m.length-1&&m[S]<e;)S++;A=e;let M=r[S-1],ee=i[S-1],N=r[S],P=i[S],F=m[S]-m[S-1]||1,te=(e-m[S-1])/F,I=M+(N-M)*te,ne=ee+(P-ee)*te,re=I-o,L=ne-s,ie=re*re+L*L;if(ie>l)continue;let ae=c[j.type],R=ah[j.type],z=k[j.type];if(z>=R.cap)continue;let B=(N-M)/F,oe=(P-ee)/F;if(te>.7&&S<r.length-1){let e=m[S+1]-m[S]||1,t=(te-.7)/.6;B+=((r[S+1]-N)/e-B)*t,oe+=((i[S+1]-P)/e-oe)*t}else if(te<.3&&S>1){let e=m[S-1]-m[S-2]||1,t=(.3-te)/.6;B+=((M-r[S-2])/e-B)*t,oe+=((ee-i[S-2])/e-oe)*t}let se=Math.hypot(B,oe)||1;B/=se,oe/=se;let ce=v[S].offs,le=ce[Math.min(j.lane,ce.length-1)]+j.jitter*.3;I+=-oe*le,ne+=B*le;let ue=$(I,ne)+.13+_[S-1]+(_[S]-_[S-1])*te;if(E.set(oe,0,B,I,0,1,0,ue,-B,0,oe,ne,0,0,0,1),t.on){let e=I-t.x,r=ne-t.z;e*e+r*r<2025&&n.push({x:I,z:ne,y:ue-.13,yaw:Math.atan2(-B,-oe),hl:R.len/2,hw:R.wid/2,vx:B*j.v,vz:oe*j.v,label:R.glb===`bus`?`公交车`:R.glb===`truck`?`货车`:R.glb===`taxi`?`出租车`:`车`})}u[j.type].setMatrixAt(z,E),k[j.type]=z+1;let de=d[j.type],fe=h[j.type],pe=R.tint;if(fe&&ie<4900&&g[j.type]<sh){let e=g[j.type]++;fe.setMatrixAt(e,E),D.setRGB(1+(j.paint[0]-1)*pe,1+(j.paint[1]-1)*pe,1+(j.paint[2]-1)*pe,Le),fe.setColorAt(e,D)}else if(de&&ie<57600&&f[j.type]<oh){let e=f[j.type]++;de.setMatrixAt(e,E),D.setRGB(1+(j.paint[0]-1)*pe,1+(j.paint[1]-1)*pe,1+(j.paint[2]-1)*pe,Le),de.setColorAt(e,D)}else{let e=p[j.type]++;ae.setMatrixAt(e,E),D.setRGB(j.paint[0],j.paint[1],j.paint[2]),ae.setColorAt(e,D)}if(a<y){let e=R.hgt*.5*C,t=R.len+Math.abs(B*w+oe*T)*R.hgt*C,n=R.wid+Math.abs(-oe*w+B*T)*R.hgt*C;E.set(oe*n,0,B*t,I+w*e,0,1,0,ue+.03,-B*n,0,oe*t,ne+T*e,0,0,0,1),x.setMatrixAt(a++,E)}}}let m=0;u.forEach((e,t)=>{e.count=k[t],e.instanceMatrix.needsUpdate=!0}),c.forEach((e,t)=>{e.count=p[t],m+=k[t],e.instanceMatrix.needsUpdate=!0,e.instanceColor&&(e.instanceColor.needsUpdate=!0)}),d.forEach((e,t)=>{e&&(e.count=f[t],e.instanceMatrix.needsUpdate=!0,e.instanceColor.needsUpdate=!0)}),h.forEach((e,t)=>{e&&(e.count=g[t],e.instanceMatrix.needsUpdate=!0,e.instanceColor.needsUpdate=!0)}),A.near=f.reduce((e,t)=>e+t,0),A.hi=g.reduce((e,t)=>e+t,0),x.count=a,x.instanceMatrix.needsUpdate=!0,A.visible=m}return{group:s,update:j,stats:A,probe:t,hits:n}}function hh(e){let t=[],n=[],r=[],i=(e,i,a)=>{for(let o of[0,1,2,0,2,3])t.push(...e[o]),n.push(...i),r.push(...a[o])},a=e/2;i([[-1,.06,a],[1,.06,a],[3.6,.06,a+24],[-3.6,.06,a+24]],[1,.93,.78].map(e=>e*.6),[[-1,0],[1,0],[1,1],[-1,1]]),i([[-1,.06,-a],[1,.06,-a],[1.6,.06,-a-5],[-1.6,.06,-a-5]],[1,.08,.04].map(e=>e*.55),[[-1,0],[1,0],[1,1],[-1,1]]);let o=new kr;return o.setAttribute(`position`,new Z(t,3)),o.setAttribute(`color`,new Z(n,3)),o.setAttribute(`uv`,new Z(r,2)),o}function gh(){return new co({uniforms:_d(),transparent:!0,depthWrite:!1,blending:2,side:2,vertexShader:`attribute vec3 color; varying vec3 vC; varying vec2 vUv;
      void main(){ vC = color; vUv = uv; gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0); }`,fragmentShader:`uniform float uNight; varying vec3 vC; varying vec2 vUv;
      void main(){ float a = pow(1.0 - vUv.y, 1.6) * (1.0 - vUv.x * vUv.x); gl_FragColor = vec4(vC * a * uNight * 1.3, 1.0); }`})}var _h=`/models/ped/ped.glb`,vh=1.76,yh=64,bh=256,xh=230,Sh=320,Ch=new Set([`primary`,`secondary`,`tertiary`,`unclassified`,`residential`,`living_street`]),wh=[{id:`sedan`,label:`轿车`,len:4.7,wid:1.85,hgt:1.45,vmax:46,acc:9.5,share:.28},{id:`suv`,label:`SUV`,len:4.75,wid:1.95,hgt:1.75,vmax:42,acc:8.5,share:.2},{id:`taxi`,label:`出租车`,len:4.7,wid:1.85,hgt:1.6,vmax:44,acc:9,share:.1},{id:`mpv`,label:`MPV`,len:5,wid:1.95,hgt:1.85,vmax:40,acc:8,share:.12},{id:`motorcycle`,label:`摩托车`,len:2.15,wid:.85,hgt:1.2,vmax:55,acc:13,share:.3,bike:!0}],Th={v:!1},Eh=[[`Waist`,`Spine01`,0,.86,-.5],[`Spine01`,`Spine02`,0,.8,-.6],[`Spine02`,`NeckTwist01`,0,.78,-.62],[`NeckTwist01`,`Head`,0,.98,-.2],[`L_Thigh`,`L_Calf`,-.3,-.3,-.9],[`R_Thigh`,`R_Calf`,.3,-.3,-.9],[`L_Calf`,`L_Foot`,.02,-.86,.5],[`R_Calf`,`R_Foot`,-.02,-.86,.5],[`L_Upperarm`,`L_Forearm`,-.28,-.5,-.82],[`R_Upperarm`,`R_Forearm`,.28,-.5,-.82],[`L_Forearm`,`L_Hand`,.06,-.22,-.97],[`R_Forearm`,`R_Hand`,-.06,-.22,-.97]],Dh={y:.8,z:.28},Oh=.35,kh=8,Ah=2.5,jh=1.2,Mh=30,Nh=2.5,Ph=1.1,Fh=.12,Ih=.95,Lh=1.6,Rh=6,zh=.75,Bh=[[`L_Upperarm`,`L_Forearm`,-.92,.25,-.2],[`R_Upperarm`,`R_Forearm`,.9,.35,.1],[`L_Forearm`,`L_Hand`,-.75,.6,-.2],[`R_Forearm`,`R_Hand`,.8,.2,.5],[`R_Thigh`,`R_Calf`,.12,-.75,-.62],[`R_Calf`,`R_Foot`,.05,-.95,.3],[`L_Thigh`,`L_Calf`,-.1,-1,-.05],[`NeckTwist01`,`Head`,.25,.95,-.1]],Vh=e=>e.bike?240:e.id===`mpv`||e.id===`suv`?1900:1500;function Hh(e,t,n,r,i,a,o,s,c,l){let u=e-a,d=t-o,f=r+i+c+l;if(u*u+d*d>f*f)return null;let p=-Math.sin(n),m=-Math.cos(n),h=-Math.sin(s),g=-Math.cos(s),_=1e9,v=0,y=0;for(let e=0;e<4;e++){let t=e===0?p:e===1?-m:e===2?h:-g,n=e===0?m:e===1?p:e===2?g:h,a=r*Math.abs(p*t+m*n)+i*Math.abs(-m*t+p*n),o=c*Math.abs(h*t+g*n)+l*Math.abs(-g*t+h*n),s=u*t+d*n,f=a+o-Math.abs(s);if(f<=0)return null;if(f<_){_=f;let e=s<0?-1:1;v=t*e,y=n*e}}return{nx:v,nz:y,depth:_}}var Uh=[[1,1],[-1,1],[1,-1],[-1,-1],[0,1],[0,-1],[1,0],[-1,0]],Wh=(e,t)=>{let n=Math.sin(e*127.1+t*311.7)*43758.5453;return n-Math.floor(n)},Gh=e=>Math.atan2(Math.sin(e),Math.cos(e)),Kh=class{constructor(e,t,n,r,i,a){Object.assign(this,{scene:e,camera:t,city:n,grid:r,player:i,els:a}),this.state=`foot`,this.stateT=0,this.car=null,this.near=null,this.scanT=9,this.active=new Map,this.moved=new Map,this.pedYaw=0,this.pedVisible=!1,this.camK=1,this.camOff=0,this.camYaw=0,this.buildSpots(),this.loadPed(),this.loadVehicles()}buildSpots(){let e=this.city,t=e.roadClasses;this.cells=new Map;let n=0,r=0;e.roads.forEach((e,i)=>{if(!Ch.has(t[e[0]])||e[5])return;let a=e[4],o=e[1]/2+.15,s=Wh(i,1)*yh,c=0;for(let e=2;e<a.length;e+=2){let t=a[e-2],l=a[e-1],u=a[e],d=a[e+1],f=Math.hypot(u-t,d-l);if(f<.5)continue;let p=(u-t)/f,m=(d-l)/f;for(let e=yh-s;e<f;e+=yh){if(c++,n++,f<14||e<6||e>f-6)continue;let a=Wh(i,c*3.1)<.5?-1:1,s=t+p*e+-m*o*a,u=l+m*e+p*o*a,d=Math.atan2(-p*a,-m*a),h=Wh(i*1.7,c*9.3),g=0,_=0;for(let e=0;e<wh.length;e++)if(_+=wh[e].share,h<_){g=e;break}let v=Math.floor(s/bh)*100003+Math.floor(u/bh),y=this.cells.get(v);y||this.cells.set(v,y=[]),y.push({id:n,x:s,z:u,yaw:d,type:g}),r++}s=(s+f)%yh}}),this.spotCount=r}loadPed(){new of().loadAsync(_h).then(e=>{let t=e.scene,n=new Zn().setFromObject(t),r=n.max.y-n.min.y,i=new On;i.add(t),t.position.y=-n.min.y,t.rotation.y=Math.PI/2,i.scale.setScalar(vh/r),this.pedMats=[],t.traverse(e=>{if(e.isMesh){e.frustumCulled=!1,e.renderOrder=8;let t=e.material;t.envMapIntensity=.8,t.metalness=0,t.roughness=.85,t.metalnessMap=null,t.roughnessMap=null,t.emissive=new X(1,1,1),t.emissiveMap=t.map,t.emissiveIntensity=0,Md(t),this.pedMats.push(t)}}),this.mixer=new Hs(t),this.actions={},this.animW={};for(let t of e.animations){let e=this.mixer.clipAction(t);e.play(),e.setEffectiveWeight(+(t.name===`idle`)),this.actions[t.name]=e,this.animW[t.name]=+(t.name===`idle`)}this.bones={},t.traverse(e=>{e.isBone&&(this.bones[e.name]=e)}),this.ped=new On,this.pedInner=i,this.ped.add(i),this.ped.visible=!1,this.scene.add(this.ped),console.info(`[futian] 行人：已加载 Tripo 绑骨模型`,_h,`动作`,Object.keys(this.actions).join(` / `))}).catch(e=>console.warn(`[futian] 行人模型 `+_h+` 加载失败，走路时没有可见角色。原因：`,e&&e.message?e.message:e))}loadVehicles(){this.models=wh.map(()=>null);let e=new of;this.glow=new ri(hh(4.8),gh()),this.glow.frustumCulled=!1,this.glow.renderOrder=21,this.glow.rotation.y=Math.PI,wh.forEach((t,n)=>{e.loadAsync(`/models/cars/`+t.id+`.glb`).then(e=>{let r=null;e.scene.updateMatrixWorld(!0),e.scene.traverse(e=>{e.isMesh&&!r&&(r=e)});let i=r.geometry.clone().applyMatrix4(r.matrixWorld);(t.bike?Th.v:ch[t.id])&&i.rotateY(Math.PI),i.computeBoundingBox();let a=i.boundingBox,o=t.len/(a.max.z-a.min.z),s=Math.min(o,t.wid*1.15/(a.max.x-a.min.x)),c=Math.min(o,t.hgt*1.12/(a.max.y-a.min.y));i.translate(-(a.min.x+a.max.x)/2,-a.min.y,-(a.min.z+a.max.z)/2),i.scale(s,c,o),i.rotateY(Math.PI);let l=r.material.clone();l.metalness=.2,l.roughness=.5,l.metalnessMap=null,l.roughnessMap=null,l.normalMap=null,l.envMapIntensity=1,l.emissive=new X(1,1,1),l.emissiveMap=l.map,l.emissiveIntensity=0,Md(l),this.models[n]={geo:i,mat:l},this.scanT=9}).catch(e=>console.warn(`[futian] 可驾驶车模 `+t.id+`.glb 加载失败：`,e&&e.message?e.message:e))})}scan(){let e=this.focus(),t=Math.floor(e.x/bh),n=Math.floor(e.z/bh);for(let r=t-1;r<=t+1;r++)for(let t=n-1;t<=n+1;t++)for(let n of this.cells.get(r*100003+t)||[]){if(this.active.has(n.id)||!this.models[n.type])continue;let t=this.moved.get(n.id),r=t?t.x:n.x,i=t?t.z:n.z,a=t?t.yaw:n.yaw;if(Math.hypot(r-e.x,i-e.z)>xh||!t&&(im(this.grid,r,i)||nm(this.grid,r,i,$(r,i)+.4,$(r,i)+1.4,.3)))continue;let o=this.models[n.type],s;s=new ri(o.geo,o.mat),s.frustumCulled=!1,s.renderOrder=6,s.layers.enable(1);let c={spot:n,mesh:s,x:r,z:i,y:$(r,i),yaw:a,v:0,steer:0,type:wh[n.type],roll:0,vx:0,vz:0,spin:0,wob:0,lay:t&&t.lay||0};this.carsAt(c,r,i,a)||(this.place(c),this.scene.add(s),this.active.set(n.id,c))}for(let[t,n]of this.active)n!==this.car&&Math.hypot(n.x-e.x,n.z-e.z)>Sh&&(this.scene.remove(n.mesh),this.active.delete(t))}place(e){e.mesh.position.set(e.x,e.y+.12,e.z),e.mesh.rotation.set(e.pitch||0,e.yaw,(e.roll||0)+Math.sin((e.wob||0)*26)*.07*(e.wob||0)+(e.lay||0),`YXZ`)}focus(){return this.car?this.car:this.player.pos}inVehicle(){return this.state!==`foot`}ejected(){return this.state===`ejected`}wallAt(e,t,n,r){let i=-Math.sin(r),a=-Math.cos(r),o=e.len/2,s=e.wid/2,c=$(t,n);for(let[e,r]of Uh)if(nm(this.grid,t+i*o*r-a*s*e,n+a*o*r+i*s*e,c+.3,c+1.4,.35))return!0;return!1}carsAt(e,t,n,r){let i=e.type;for(let a of this.active.values()){if(a===e)continue;let o=Hh(t,n,r,i.len/2,i.wid/2,a.x,a.z,a.yaw,a.type.len/2,a.type.wid/2);if(o)return o.o=a,o}return null}trafficAt(e,t,n,r){let i=this.traffic;if(!i||!i.hits)return null;let a=e.type;for(let o of i.hits){if(Math.abs(o.y-e.y)>2.5)continue;let i=Hh(t,n,r,a.len/2,a.wid/2,o.x,o.z,o.yaw,o.hl,o.hw);if(i)return i.o=o,i}return null}impact(e,t,n,r=0,i=0){let a=n>=kh;this.state===`driving`&&this.car&&n>=Ah&&!(this.hitGapT>0)&&(this.hitN=(this.hitN||0)+1,this.hitGapT=jh,this.hitForgetT=Mh,this.hitLog=(this.hitLog||[]).concat([{n:this.hitN,kind:e,what:t,kmh:Math.round(n*3.6)}]),this.hitN>=2&&(this.pendingEject={kind:e,what:t,speed:n,dx:r,dz:i})),this.crashT=a?1.6:.9,this.stun=a?.75:.25,this.crashHard=a,this.crashWhat=t,this.crashKmh=Math.round(n*3.6),this.bump=a?.7:.3,this.shake=a?Math.min(.5,.12+n*.012):.05,this.car&&(this.car.wob=Math.max(this.car.wob||0,a?1:.35)),this.crashes=(this.crashes||0)+1}hitCar(e,t,n,r){let i=t.o,a=e.v<0?-1:1,o=n*a,s=r*a,c=Math.abs(e.v)-(i.vx*o+i.vz*s);if(c<.4){e.v=a*Math.max(0,Math.min(Math.abs(e.v),i.vx*o+i.vz*s));return}let l=Vh(e.type),u=Vh(i.type),d=c>=kh,f=1.15*c*l*u/(l+u),p=o*.7-t.nx*.3,m=s*.7-t.nz*.3,h=Math.hypot(p,m)||1;p/=h,m/=h;let g=Math.min(24,f/u);i.vx+=p*g,i.vz+=m*g;let _=(o*(i.z-e.z)-s*(i.x-e.x))/(i.type.len*.5+.5);i.spin+=Math.max(-3.2,Math.min(3.2,-_*c*(d?.09:.04))),i.wob=d?1:.4,i.type.bike&&d&&(i.lay=(_>=0?1:-1)*1.28);let v=Math.max(0,Math.abs(e.v)-f/l);e.v=d?a*Math.min(v*.3,4):-a*Math.min(1.4,c*.18),this.impact(`car`,i.type.label,c,t.nx,t.nz)}simCars(e){for(let t of this.active.values()){if(t.wob&&=Math.max(0,t.wob-e*1.4),t===this.car)continue;let n=Math.hypot(t.vx,t.vz);if(n<.05&&Math.abs(t.spin)<.02){t.wob&&this.place(t),(n||t.spin)&&(t.vx=t.vz=t.spin=0);continue}let r=Math.max(1,Math.min(10,Math.ceil(n*e/Oh)));for(let n=0;n<r;n++){let n=t.x+t.vx*e/r,i=t.z+t.vz*e/r,a=t.yaw+t.spin*e/r;if(this.wallAt(t.type,n,i,a)){t.vx*=-.2,t.vz*=-.2,t.spin*=-.3;break}let o=this.carsAt(t,n,i,a);if(o){o.o!==this.car&&(o.o.vx+=t.vx*.6,o.o.vz+=t.vz*.6,o.o.wob=Math.max(o.o.wob||0,.4)),t.vx*=o.o===this.car?-.15:.2,t.vz*=o.o===this.car?-.15:.2,t.spin*=.3;break}t.x=n,t.z=i,t.yaw=a}let i=Math.hypot(t.vx,t.vz),a=8.5*e;i<=a?(t.vx=0,t.vz=0):(t.vx-=t.vx/i*a,t.vz-=t.vz/i*a),t.spin*=Math.exp(-e*3.2),t.y=$(t.x,t.z),this.moved.set(t.spot.id,{x:t.x,z:t.z,yaw:t.yaw,lay:t.lay}),this.place(t)}}interact(){if(this.state===`foot`)return!this.near||this.player.mode!==`walk`?!1:(this.car=this.near,this.state=`entering`,this.stateT=0,this.car.lay=0,this.car.vx=this.car.vz=this.car.spin=0,this.car.roll=0,this.car.pitch=0,this.hitN=0,this.hitGapT=0,this.pendingEject=null,this.hitLog=[],this.enterFrom=this.player.pos.clone(),this.camFrom=this.camera.position.clone(),this.camYaw=this.player.yaw,this.camOff=0,this.lastYaw=this.player.yaw,!0);if(this.state===`driving`&&Math.abs(this.car.v)<4){let e=this.car,t=e.type,n=-Math.cos(e.yaw),r=Math.sin(e.yaw),i=t.wid/2+.85,a=e.x+n*i,o=e.z+r*i;return nm(this.grid,a,o,e.y+.2,e.y+1.7,.4)&&(a=e.x-n*i,o=e.z-r*i),e.v=0,e.steer=0,e.roll=0,e.pitch=0,this.place(e),this.moved.set(e.spot.id,{x:e.x,z:e.z,yaw:e.yaw}),e.vx=e.vz=e.spin=0,this.crashT=0,this.exitTo=new J(a,$(a,o),o),this.exitYaw=e.yaw,this.state=`exiting`,this.stateT=0,this.camFrom=this.camera.position.clone(),!0}return!1}camInside(e,t,n){for(let r of this.grid.query(e,n))if(t>r.bottom&&t<r.top+.5&&nf(e,n,r))return!0;return!1}chaseCam(e,t,n,r,i,a,o,s){let c=Math.cos(a),l=-Math.sin(i)*c,u=Math.sin(a),d=-Math.cos(i)*c,f=1;for(let e of[1,.8,.62,.46,.32,.2,.1])if(f=e,!this.camInside(t-l*o*e,n-u*o*e,r-d*o*e))break;return this.camK+=(f-this.camK)*(1-Math.exp(-s*(f<this.camK?16:3))),e.set(t-l*o*this.camK,n-u*o*this.camK,r-d*o*this.camK),e.y=Math.max(e.y,$(e.x,e.z)+.35),e}drive(e,t){if(this.state===`foot`)return!1;let n=this.car,r=n.type,i=t.keys;if(this.stateT+=e,this.state===`entering`&&this.stateT>.7&&(this.state=`starting`,this.stateT=0),this.state===`starting`&&this.stateT>.9&&(this.state=`driving`,this.stateT=0),this.state===`exiting`&&this.stateT>.6)return t.pos.copy(this.exitTo),t.vel.set(0,0,0),t.yaw=this.exitYaw,t.pitch=-.08,t.mode=`walk`,t.onGround=!0,this.pedYaw=this.exitYaw,this.state=`foot`,this.car=null,this.scanT=9,!1;if(this.state===`ejected`)return this.driveEjected(e,t);if(this.state===`driving`){this.stun=Math.max(0,(this.stun||0)-e),this.crashT=Math.max(0,(this.crashT||0)-e),this.hitGapT=Math.max(0,(this.hitGapT||0)-e),this.hitN&&(this.hitForgetT=(this.hitForgetT||0)-e)<=0&&(this.hitN=0);let a=this.stun>0?0:(i.has(`KeyW`)||i.has(`ArrowUp`)?1:0)-(i.has(`KeyS`)||i.has(`ArrowDown`)?1:0),o=(i.has(`KeyA`)||i.has(`ArrowLeft`)?1:0)-(i.has(`KeyD`)||i.has(`ArrowRight`)?1:0),s=i.has(`ShiftLeft`)||i.has(`ShiftRight`),c=i.has(`Space`),l=r.vmax*(s?1.3:1);if(a>0?n.v+=(n.v<-.5?26:r.acc*(s?1.5:1)*Math.max(.15,1-n.v/l))*e:a<0?n.v-=(n.v>.5?24:6)*e:n.v-=(n.v*.35+Math.sign(n.v)*1.2)*e,c){let t=30*e;n.v=Math.abs(n.v)<=t?0:n.v-Math.sign(n.v)*t}n.v=Math.max(-10,Math.min(l,n.v)),a===0&&Math.abs(n.v)<.15&&(n.v=0),n.steer+=(o-n.steer)*(1-Math.exp(-e*(r.bike?8:5.5)));let u=(r.bike?.62:.56)/(1+Math.abs(n.v)/(r.bike?12:15)),d=n.v*Math.tan(u*n.steer)/Math.max(r.len*.62,1.45),f=(r.bike?9:11)/Math.max(Math.abs(n.v),4);d=Math.max(-f,Math.min(f,d))*(c&&Math.abs(n.v)>8?1.6:1);for(let e=0;e<3;e++){let e=this.carsAt(n,n.x,n.z,n.yaw);if(!e)break;let t=e.o,i=e.nx*(e.depth+.03),a=e.nz*(e.depth+.03);if(!this.wallAt(t.type,t.x-i,t.z-a,t.yaw))t.x-=i,t.z-=a,this.moved.set(t.spot.id,{x:t.x,z:t.z,yaw:t.yaw,lay:t.lay}),this.place(t);else if(!this.wallAt(r,n.x+i,n.z+a,n.yaw))n.x+=i,n.z+=a;else break}let p=this.trafficAt(n,n.x,n.z,n.yaw);if(p){let t=p.o,i=p.depth+.05+Math.abs(t.vx*p.nx+t.vz*p.nz)*e*1.5,a=p.nx*i,o=p.nz*i;this.wallAt(r,n.x+a,n.z+o,n.yaw)||(n.x+=a,n.z+=o);let s=-Math.sin(n.yaw),c=-Math.cos(n.yaw),l=Math.hypot(t.vx-s*n.v,t.vz-c*n.v);n.kx=t.vx*.55,n.kz=t.vz*.55,n.v*=.3,this.crashT>.6||this.impact(`traffic`,`路上的`+t.label,l,p.nx,p.nz)}let m=Math.max(1,Math.min(24,Math.ceil(Math.abs(n.v)*e/Oh)));for(let t=0;t<m;t++){let t=n.yaw+d*e/m,i=-Math.sin(t),a=-Math.cos(t),o=n.x+i*n.v*e/m,s=n.z+a*n.v*e/m;if(n.v===0)break;if(this.wallAt(r,o,s,t)){let t=Math.abs(n.v),o=-Math.sin(n.yaw),s=-Math.cos(n.yaw);if(t<kh&&!this.wallAt(r,n.x+o*n.v*e/m,n.z+s*n.v*e/m,n.yaw)){n.x+=o*n.v*e/m,n.z+=s*n.v*e/m,n.v*=.9;continue}let c=n.v<0?-1:1;n.v*=t>=kh?-.12:-.28,this.impact(`wall`,`楼`,t,-i*c,-a*c);break}let c=this.carsAt(n,o,s,t);if(c){this.hitCar(n,c,i,a);break}let l=this.trafficAt(n,o,s,t);if(l){let e=l.o,t=n.v<0?-1:1,r=e.vx*i*t+e.vz*a*t,o=Math.abs(n.v)-r;o>.4?(n.v=t*Math.max(0,r)*.6,n.kx=e.vx*.3,n.kz=e.vz*.3,this.impact(`traffic`,`路上的`+e.label,o,l.nx,l.nz)):n.v=t*Math.max(0,Math.min(Math.abs(n.v),r));break}n.x=o,n.z=s,n.yaw=t}if(n.kx||n.kz){let t=n.x+n.kx*e,i=n.z+n.kz*e;!this.wallAt(r,t,i,n.yaw)&&!this.carsAt(n,t,i,n.yaw)?(n.x=t,n.z=i):(n.kx=0,n.kz=0);let a=Math.exp(-e*3.5);n.kx*=a,n.kz*=a,Math.hypot(n.kx,n.kz)<.1&&(n.kx=0,n.kz=0)}if(n.y=$(n.x,n.z),n.roll=r.bike?n.steer*Math.min(1,Math.abs(n.v)/14)*.5:-n.steer*Math.min(1,Math.abs(n.v)/30)*.045,n.pitch=this.crashHard&&this.crashT>1.1?(this.crashT-1.1)*.12:0,this.pendingEject){let e=this.pendingEject;return this.pendingEject=null,this.eject(t,e),this.driveEjected(0,t)}}else this.state===`starting`&&(n.pitch=Math.sin(this.stateT*70)*.006*(1-this.stateT/.9));this.bump=Math.max(0,(this.bump||0)-e),this.place(n);let a=Gh(t.yaw-this.lastYaw);this.camOff=Math.max(-2.7,Math.min(2.7,this.camOff+a)),Math.abs(n.v)>2&&Math.abs(a)<1e-4&&(this.camOff*=Math.exp(-e*.9)),this.camYaw+=Gh(n.yaw-this.camYaw)*(1-Math.exp(-e*4.5)),t.yaw=this.camYaw+this.camOff,this.lastYaw=t.yaw,this.state===`entering`&&(t.pitch+=(-.17-t.pitch)*(1-Math.exp(-e*6))),t.pitch=Math.max(-.7,Math.min(.25,t.pitch));let o=this.chaseCam(this._c||=new J,n.x,n.y+(r.bike?1.6:1.9),n.z,t.yaw,t.pitch,(r.bike?6.2:8.6)+Math.abs(n.v)*.04,e);if(this.bump>0){let e=(this.shake||.05)*Math.min(1,this.bump/.3);o.y+=Math.sin(this.bump*60)*e,o.x+=Math.cos(t.yaw)*Math.sin(this.bump*47)*e*.8,o.z-=Math.sin(t.yaw)*Math.sin(this.bump*47)*e*.8}if(this.state===`entering`){let e=this.stateT/.7,t=e*e*(3-2*e);o.lerpVectors(this.camFrom,o,t)}return t.pos.copy(o),!0}eject(e,t){let n=this.car,r=n.type,i=n.yaw,a=-Math.sin(i),o=-Math.cos(i),s=Math.cos(i),c=-Math.sin(i),l=t.dx*s+t.dz*c,u=n.v<-.3?-1:1,d=Math.abs(l)>.2?[Math.sign(l),-Math.sign(l)]:[1,-1],f=this.player.bounds,p=(e,t)=>!f||e>f.x0+20&&e<f.x1-20&&t>f.z0+20&&t<f.z1-20,m=[],h=Math.floor(n.x/bh),g=Math.floor(n.z/bh);for(let e=h-1;e<=h+1;e++)for(let t=g-1;t<=g+1;t++)for(let r of this.cells.get(e*100003+t)||[]){let e=r.x-n.x,t=r.z-n.z,i=e*a+t*o,l=e*s+t*c;Math.abs(i)<40&&Math.abs(l)>2&&Math.abs(l)<14&&m.push(l)}let _=(e,t,a)=>{let o=Math.ceil(Math.hypot(e-n.x,t-n.z)/.5);for(let s=1;s<=o;s++){let c=s/o;if(this.wallAt(r,n.x+(e-n.x)*c,n.z+(t-n.z)*c,i+(a-i)*c))return!1}return!0},v=null;for(let e of d){let t=m.filter(t=>Math.sign(t)===e).map(e=>Math.abs(e)+.4).sort((e,t)=>e-t).slice(0,2);for(let l of[...t,6.5,5,8,4,9.5,3,2]){for(let t of[3.5*u,1.5*u,6*u,0]){let u=e*(r.bike?.5:.95)*(t===0?.6:1),d=n.x+s*e*l+a*t,f=n.z+c*e*l+o*t,m=i+u;if(p(d,f)&&!this.wallAt(r,d,f,m)&&!this.carsAt(n,d,f,m)&&_(d,f,m)){v={x1:d,z1:f,y1:m,sg:e,L:l};break}}if(v)break}if(v)break}v||={x1:n.x,z1:n.z,y1:i+.6,sg:d[0],L:0};let y=-Math.sin(v.y1),b=-Math.cos(v.y1),x=Math.cos(v.y1),S=-Math.sin(v.y1),C=r.len/2,w=r.wid/2,T=(e,t)=>{let n=e-v.x1,r=t-v.z1,i=Math.abs(n*y+r*b)-C,a=Math.abs(n*x+r*S)-w;return Math.hypot(Math.max(i,0),Math.max(a,0))+Math.min(Math.max(i,a),0)},E=(e,t)=>{let r=$(e,t);if(!p(e,t)||nm(this.grid,e,t,r+.2,r+1.2,.45))return!1;for(let r of this.active.values())if(r!==n&&Hh(e,t,0,.9,.5,r.x,r.z,r.yaw,r.type.len/2+.2,r.type.wid/2+.2))return!1;return!0},D=[];for(let e of[3.1,3.7,2.7,4.5])for(let t of[.6,-.6,1.6,-1.6])D.push([v.sg,w+e,t*u]);for(let e of[3.1,3.9])for(let t of[.8,0,-.8])D.push([`front`,t*v.sg,C+e]);for(let e of[3.1,3.9])for(let t of[.8,0])D.push([`back`,t*v.sg,-(C+e)]);for(let e of[3.1,3.7])for(let t of[.6,-.6,1.6])D.push([-v.sg,w+e,t*u]);let O=null;for(let[e,t,r]of D){let i=typeof e==`number`?e*t:t,a=typeof e==`number`?r:r*u,o=v.x1+x*i+y*a,s=v.z1+S*i+b*a;if(T(o,s)<Nh)continue;let c=o-v.x1,l=s-v.z1,d=Math.hypot(c,l)||1,f=o+c/d*1.6,p=s+l/d*1.6;if(!(T(f,p)<Nh||!E(o,s)||!E(f,p)||!E((o+f)/2,(s+p)/2))&&!nm(this.grid,(o+n.x)/2,(s+n.z)/2,$(o,s)+.6,$(o,s)+2.6,.2)){O={x:o,z:s,where:typeof e==`number`?e===v.sg?`outer-side`:`road-side`:e};break}}O||={x:v.x1+y*(C+Nh+.8)*u,z:v.z1+b*(C+Nh+.8)*u,where:`fallback-front`};let k=n.x+s*v.sg*(r.wid*.3),A=n.z+c*v.sg*(r.wid*.3),j=$(O.x,O.z);this.ej={car:{x0:n.x,z0:n.z,yaw0:i,...v,done:!1},t:0,ped:{x0:k,z0:A,y0:n.y+(r.bike?1.1:.9),x1:O.x,z1:O.z,y1:j,yaw:Math.atan2(-(v.x1-O.x),-(v.z1-O.z)),arc:O.where===`outer-side`?2.6:1.9},what:t.what,kmh:Math.round(t.speed*3.6),up:!1,upT:0,side:v.sg},this.ejectInfo={where:O.where,ped:[+O.x.toFixed(2),+j.toFixed(2),+O.z.toFixed(2)],car:[+v.x1.toFixed(2),+$(v.x1,v.z1).toFixed(2),+v.z1.toFixed(2)],carYawDeg:Math.round(v.y1*180/Math.PI),gapToCarBox:+T(O.x,O.z).toFixed(2),centerDist:+Math.hypot(O.x-v.x1,O.z-v.z1).toFixed(2)},console.info(`[futian] 二次撞车甩出：`,JSON.stringify(this.ejectInfo)),n.v=0,n.kx=n.kz=0,n.steer=0,n.vx=n.vz=n.spin=0,this.crashT=0,this.stun=0,this.state=`ejected`,this.stateT=0,this.ejects=(this.ejects||0)+1,this.bump=.9,this.shake=.45;let M=O.x-n.x,ee=O.z-n.z;this.camYaw=Math.atan2(-M,-ee)-v.sg*.55,this.camOff=0,e.yaw=this.camYaw,this.lastYaw=e.yaw,e.pitch=-.32}driveEjected(e,t){let n=this.ej,r=this.car,i=r.type,a=t.keys;n.t+=e,this.stateT+=e;let o=n.car,s=Math.min(1,n.t/Ph),c=1-(1-s)**3;r.x=o.x0+(o.x1-o.x0)*c,r.z=o.z0+(o.z1-o.z0)*c,r.yaw=o.yaw0+(o.y1-o.yaw0)*c,r.y=$(r.x,r.z)+Math.sin(Math.PI*Math.min(1,s/.55))*(i.bike?.35:.55)*(s<.55),r.roll=i.bike?n.side*1.28*Math.min(1,s*2.2):-n.side*.32*Math.sin(Math.PI*Math.min(1,s*1.4))*(1-s*.5),r.pitch=.05*Math.sin(Math.PI*s),s>=1&&!o.done&&(o.done=!0,r.y=$(r.x,r.z),i.bike||(r.roll=0),r.pitch=0,r.lay=i.bike?n.side*1.28:0,i.bike&&(r.roll=0),this.moved.set(r.spot.id,{x:r.x,z:r.z,yaw:r.yaw,lay:r.lay})),this.place(r);let l=n.ped,u=Math.max(0,Math.min(1,(n.t-Fh)/Ih)),d=n.t-Fh-Ih;d>Lh&&!n.up&&([`KeyW`,`KeyA`,`KeyS`,`KeyD`,`KeyE`,`Space`,`ArrowUp`,`ArrowDown`,`ArrowLeft`,`ArrowRight`].some(e=>a.has(e))||d>Rh)&&(n.up=!0,n.upT=0),n.up&&(n.upT+=e);let f=l.x0+(l.x1-l.x0)*u,p=l.z0+(l.z1-l.z0)*u,m=l.y0+(l.y1-l.y0)*u+Math.sin(Math.PI*u)*(l.arc||1.9),h=Math.PI/2,g=n.up?Math.min(1,n.upT/zh):0,_=g*g*(3-2*g);if(n.pitch=u<1?(h+Math.PI*2)*(u*(2-u)):h*(1-_),u>=1&&(n.pitch=h*(1-_)),n.roll=u<1?Math.sin(u*Math.PI*2)*.5:0,n.px=f,n.pz=p,n.py=m+(u>=1?.16*Math.sin(n.pitch):.2),n.lying=u>=1&&!(g>=1),this.bump=Math.max(0,(this.bump||0)-e),n.up&&g>=1)return t.pos.set(l.x1,$(l.x1,l.z1),l.z1),t.vel.set(0,0,0),t.mode=`walk`,t.onGround=!0,this.pedYaw=l.yaw,this.state=`foot`,this.car=null,this.scanT=9,this.ej=null,this.hitN=0,!1;let v=Gh(t.yaw-this.lastYaw);this.camOff=Math.max(-3.1,Math.min(3.1,this.camOff+v)),t.yaw=this.camYaw+this.camOff,this.lastYaw=t.yaw,t.pitch=Math.max(-.9,Math.min(.1,t.pitch));let y=.35*(1-u)+.2,b=f+(r.x-f)*y,x=p+(r.z-p)*y,S=this.chaseCam(this._c||=new J,b,$(b,x)+1.1,x,t.yaw,t.pitch,9.5,e||.016);if(this.bump>0){let e=(this.shake||.05)*Math.min(1,this.bump/.3);S.y+=Math.sin(this.bump*60)*e}return t.pos.copy(S),!0}posePose(e){let t=this.bones,n=this.ped,r=this._t||={a:new J,b:new J,d:new J,Q:new At,dq:new At,bw:new At,pw:new At};n.updateMatrixWorld(!0),n.getWorldQuaternion(r.Q);for(let[n,i,a,o,s]of e){let e=t[n],c=t[i];e&&c&&(e.getWorldPosition(r.a),c.getWorldPosition(r.b),r.b.sub(r.a).normalize(),r.d.set(a,o,s).normalize().applyQuaternion(r.Q),r.dq.setFromUnitVectors(r.b,r.d),e.getWorldQuaternion(r.bw),e.parent.getWorldQuaternion(r.pw),e.quaternion.copy(r.pw.invert()).multiply(r.dq).multiply(r.bw),e.updateMatrixWorld(!0))}}poseRide(){let e=this.bones,t=this.ped,n=this._t||={a:new J,b:new J,d:new J,Q:new At,dq:new At,bw:new At,pw:new At};this.pedInner.position.set(0,0,0),t.updateMatrixWorld(!0),t.getWorldQuaternion(n.Q);let r=0;for(let[t,i,a,o,s]of Eh){let c=e[t],l=e[i];c&&l&&(c.getWorldPosition(n.a),l.getWorldPosition(n.b),n.b.sub(n.a).normalize(),n.d.set(a,o,s).normalize().applyQuaternion(n.Q),n.dq.setFromUnitVectors(n.b,n.d),c.getWorldQuaternion(n.bw),c.parent.getWorldQuaternion(n.pw),c.quaternion.copy(n.pw.invert()).multiply(n.dq).multiply(n.bw),c.updateMatrixWorld(!0),r++)}let i=e.Pelvis||e.Hip;i&&(i.getWorldPosition(n.a),t.worldToLocal(n.a),this.pedInner.position.set(-n.a.x,Dh.y-n.a.y,Dh.z-n.a.z)),this.ridePosed=r}update(e,t){let n=this.player;if(this.scanT+=e,this.scanT>.5&&(this.scanT=0,this.scan()),this.simCars(e),this.traffic&&this.traffic.probe){let e=this.traffic.probe,t=this.car;e.on=!!t&&this.state===`driving`,t&&(e.x=t.x,e.z=t.z,e.y=t.y)}let r=gd.uNight.value;for(let e of this.models)e&&(e.mat.emissiveIntensity=.22*r);{let e=this.car,t=!!e&&!e.type.bike&&(this.state===`starting`||this.state===`driving`||this.state===`entering`);t&&this.glow.parent!==e.mesh?e.mesh.add(this.glow):!t&&this.glow.parent&&this.glow.parent.remove(this.glow)}if(this.pedMats)for(let e of this.pedMats)e.emissiveIntensity=.28*r;this.near=null;let i=this.state===`foot`&&n.mode===`walk`&&!t;if(this.state===`foot`&&!t){let e=1e9,t=null;for(let r of this.active.values()){let i=Math.hypot(r.x-n.pos.x,r.z-n.pos.z)-r.type.len*.3;i<e&&(e=i,t=r)}t&&e<3.6&&Math.abs(n.pos.y-t.y)<3+(n.mode===`fly`?6:0)&&(this.near=t)}let a=this.els.prompt,o=``;if(this.near&&i?o=`按 <b>E</b> 上车（${this.near.type.label}）`:this.near&&n.mode===`fly`?o=`先按 <b>V</b> 落地走路，再按 <b>E</b> 上车`:this.state===`entering`?o=this.car.type.bike?`跨上摩托车…`:`上车…`:this.state===`starting`?o=`🔑 点火启动…`:this.state===`ejected`?o=this.ej.lying&&!this.ej.up&&this.ej.t>2.67?`💥 又被${this.ej.what}撞了：车被撞到路边，人摔出车外 · 按 <b>W</b> / <b>E</b> 起身`:this.ej.up?`起身…`:`💥 又被${this.ej.what}撞了（${this.ej.kmh} km/h）：车被撞到路边，人摔出车外！`:this.state===`driving`&&this.crashT>0?o=(this.crashHard?`💥 车祸！以 ${this.crashKmh} km/h 撞上了${this.crashWhat}`:`⚠ 撞到${this.crashWhat}了，已停下（${this.crashKmh} km/h）`)+(this.hitN===1?` · 再被撞一次会被甩出车外`:``):this.state===`driving`&&(o=`${this.car.type.bike?`🏍`:`🚗`} ${this.car.type.label} · ${Math.round(Math.abs(this.car.v)*3.6)} km/h${this.car.v<-.3?` · 倒车`:``}${Math.abs(this.car.v)<4?` · <b>E</b> 下车`:``}`),o!==this.lastTxt&&(this.lastTxt=o,a.innerHTML=o,a.style.display=o?`block`:`none`,a.classList.toggle(`driving`,this.state!==`foot`),a.classList.toggle(`crash`,o.startsWith(`💥`))),!this.ped)return;let s=i,c=n.pos.x,l=n.pos.y,u=n.pos.z,d=0;if(i){d=Math.hypot(n.vel.x,n.vel.z),d>.6&&(this.pedYaw+=Gh(Math.atan2(-n.vel.x,-n.vel.z)-this.pedYaw)*(1-Math.exp(-e*10)));let t=this.chaseCam(this._c||=new J,c+Math.cos(n.yaw)*.42,l+1.58,u-Math.sin(n.yaw)*.42,n.yaw,n.pitch,3.9,e);this.camera.position.copy(t),this.camK<.2&&(s=!1)}else if(this.state===`entering`){let t=this.car,n=Math.min(1,this.stateT/.55),r=-Math.cos(t.yaw),i=Math.sin(t.yaw),a=t.type.bike?.1:t.type.wid/2+.3;c=this.enterFrom.x+(t.x+r*a-this.enterFrom.x)*n,u=this.enterFrom.z+(t.z+i*a-this.enterFrom.z)*n,l=t.y,this.pedYaw+=Gh(Math.atan2(-(t.x-c),-(t.z-u))-this.pedYaw)*(1-Math.exp(-e*10)),s=t.type.bike||this.stateT<.6,d=2}else if(this.car&&this.car.type.bike&&(this.state===`starting`||this.state===`driving`)){let e=this.car;c=e.x,u=e.z,l=e.y+.12,this.pedYaw=e.yaw,s=!0}else if(this.state===`ejected`){let e=this.ej;c=e.px,l=e.py,u=e.pz,this.pedYaw=e.ped.yaw,s=e.t>=Fh||this.car.type.bike,d=0}else if(this.state===`exiting`){let e=Math.min(1,this.stateT/.6),t=this.car;c=t.x+(this.exitTo.x-t.x)*e,u=t.z+(this.exitTo.z-t.z)*e,l=this.exitTo.y,this.pedYaw=t.yaw,s=!0,d=2}if(this.ped.visible=s,!s)return;let f=this.car&&this.car.type.bike&&(this.state===`starting`||this.state===`driving`);this.ped.position.set(c,l,u);let p=this.state===`ejected`?this.ej:null;this.ped.rotation.set(f?this.car.pitch||0:p?p.pitch:0,this.pedYaw,f?this.car.roll:p?p.roll:0,`YXZ`),f||this.pedInner.position.set(0,0,0);let m=f?`idle`:d>6.5?`run`:d>.5?this.actions.walk&&d<3.2?`walk`:`run`:`idle`,h=m===`run`?Math.max(.75,Math.min(1.7,d/5.2)):m===`walk`?Math.max(.6,Math.min(1.6,d/1.6)):1,g=1-Math.exp(-e*9);for(let e in this.actions){let t=this.animW[e]+(+(e===m)-this.animW[e])*g;this.animW[e]=t,this.actions[e].setEffectiveWeight(t),e===m&&this.actions[e].setEffectiveTimeScale(h)}this.mixer.update(e),f&&this.poseRide(),p&&!(p.up&&p.upT>zh*.6)&&this.posePose(Bh),this.riding=!!f,this.anim=f?`ride`:p?p.lying?`down`:p.up?`getup`:`thrown`:m}},qh=[.8,.82,.85],Jh=[.74,.76,.79],Yh=[.9,.9,.88],Xh=[.72,.69,.64],Zh=[.3,.32,.35],Qh=[{at:[-620,679],name:`卓越时代广场`,arche:`fin`,glass:[.09,.21,.4],frame:Jh,crown:`steps`,tiers:3,mast:26,mull:1.5,finGap:3},{at:[-619,808],name:`荣超国际商会中心`,arche:`unit`,glass:[.1,.33,.42],frame:Jh,crown:`screen`,crownH:14,mull:1.4,corner:!0},{at:[-753,557],name:`信息枢纽大厦`,arche:`unit`,glass:[.33,.44,.55],frame:qh,crown:`slope`,crownH:26,mull:1.2,podium:18,inset:.9},{at:[-623,572],name:`嘉里建设广场二期`,arche:`unit`,glass:[.2,.38,.54],frame:Yh,crown:`screen`,crownH:8,mull:1.5,floorH:4.3},{at:[-625,452],name:`福田香格里拉大酒店`,arche:`stone`,glass:[.1,.16,.22],frame:[.82,.75,.62],crown:`hat`,crownH:10,cell:[3.6,3.4],podium:20,inset:.86},{at:[-749,914],name:`平安金融中心南塔`,arche:`steel`,glass:[.3,.42,.54],frame:qh,crown:`flat`,mull:1.5},{at:[-766,931],name:`平安金融中心南塔`,arche:`steel`,glass:[.3,.42,.54],frame:qh,crown:`flat`,mull:1.5},{at:[-731,931],name:`平安金融中心南塔`,arche:`steel`,glass:[.3,.42,.54],frame:qh,crown:`flat`,mull:1.5},{at:[-749,952],name:`平安金融中心南塔`,arche:`steel`,glass:[.3,.42,.54],frame:qh,crown:`screen`,crownH:9,mull:1.5,mast:12},{at:[-757,919],name:`平安金融中心南塔裙楼`,arche:`mall`,glass:[.22,.32,.42],frame:qh},{at:[-763,805],name:`PAFC Mall`,arche:`mall`,glass:[.2,.3,.4],frame:[.78,.76,.72]},{at:[-750,858],name:`PAFC Mall 连廊`,arche:`mall`,glass:[.2,.3,.4],frame:[.78,.76,.72]},{at:[-738,1020],name:`平安财险大厦`,arche:`fin`,glass:[.25,.38,.5],frame:qh,crown:`screen`,crownH:10,mull:1.5,finGap:4.5,podium:16,inset:.92},{at:[-747,364],name:`免税商务大厦`,arche:`band`,glass:[.4,.33,.2],frame:[.78,.72,.6],crown:`steps`,tiers:2,mast:14,podium:18,inset:.84},{at:[-1076,454],name:`招商证券大厦`,arche:`stone`,glass:[.14,.26,.38],frame:[.76,.76,.74],crown:`flat`,cell:[3,4],podium:14,inset:.86},{at:[-1197,578],name:`中国人寿大厦`,arche:`unit`,glass:[.11,.32,.3],frame:Jh,crown:`screen`,crownH:9,mull:1.5,podium:14,inset:.86},{at:[-1152,457],name:`投行大厦`,arche:`band`,glass:[.26,.34,.42],frame:Jh,crown:`flat`,podium:12,inset:.88},{at:[-1299,455],name:`安信金融大厦`,arche:`fin`,glass:[.12,.26,.44],frame:Yh,crown:`slope`,crownH:16,mull:1.5,finGap:3},{at:[-810,274],name:`时代金融中心`,arche:`unit`,glass:[.1,.15,.22],frame:Zh,crown:`screen`,crownH:7,mull:1.2},{at:[-765,188],name:`港中旅大厦`,arche:`stone`,glass:[.16,.24,.32],frame:[.8,.72,.66],crown:`steps`,tiers:2,cell:[3.2,3.8],podium:16,inset:.84},{at:[-888,194],name:`中国联通大厦`,arche:`unit`,glass:[.14,.3,.5],frame:Yh,crown:`flat`,mast:30,mull:1.6,podium:14,inset:.88},{at:[-1084,278],name:`新华保险大厦`,arche:`band`,glass:[.16,.3,.44],frame:Yh,crown:`screen`,crownH:8,podium:18,inset:.78},{at:[-514,675],name:`中信证券大厦`,arche:`stone`,glass:[.14,.24,.34],frame:Xh,crown:`flat`,cell:[3,4]},{at:[-520,794],name:`深圳四季酒店`,arche:`band`,glass:[.16,.2,.24],frame:[.5,.46,.42],crown:`hat`,crownH:6},{at:[-508,572],name:`嘉里建设广场一期 2座`,arche:`unit`,glass:[.22,.4,.54],frame:Yh,crown:`screen`,crownH:6,mull:1.5},{at:[-511,495],name:`嘉里建设广场一期 1座`,arche:`unit`,glass:[.22,.4,.54],frame:Yh,crown:`screen`,crownH:6,mull:1.5},{at:[-766,460],name:`丰立大厦`,arche:`stone`,glass:[.16,.24,.3],frame:[.84,.82,.76],crown:`flat`,cell:[3.3,3.3]},{at:[-1223,457],name:`华安保险总部大厦`,arche:`band`,glass:[.18,.3,.4],frame:Xh,crown:`flat`},{at:[-1291,531],name:`中信银行大厦`,arche:`unit`,glass:[.12,.28,.42],frame:Jh,crown:`screen`,crownH:7,mull:1.5},{at:[-1087,371],name:`中心商务大厦`,arche:`fin`,glass:[.2,.32,.4],frame:Xh,crown:`flat`,finGap:3.6,mull:1.8},{at:[-943,273],name:`华融大厦`,arche:`stone`,glass:[.12,.22,.34],frame:[.7,.72,.74],crown:`steps`,tiers:2,cell:[3,3.9]},{at:[-970,203],name:`投资大厦`,arche:`band`,glass:[.3,.26,.2],frame:[.74,.68,.6],crown:`flat`},{at:[78,440],name:`大百汇广场`,arche:`fin`,glass:[.16,.3,.46],frame:qh,crown:`slope`,crownH:34,mull:1.5,finGap:3,mast:18},{at:[78,573],name:`皇庭中心`,arche:`unit`,glass:[.08,.18,.34],frame:Jh,crown:`screen`,crownH:14,mull:1.5,corner:!0},{at:[95,913],name:`1号楼（OSM 名）`,arche:`fin`,glass:[.2,.34,.48],frame:Yh,crown:`steps`,tiers:3,mull:1.5,finGap:3.6},{at:[95,1016],name:`皇岗商务中心`,arche:`unit`,glass:[.12,.28,.44],frame:Jh,crown:`screen`,crownH:12,mull:1.4},{at:[195,911],name:`3号楼（OSM 名）`,arche:`unit`,glass:[.2,.34,.48],frame:Yh,crown:`screen`,crownH:9,mull:1.5},{at:[228,1011],name:`4号楼（OSM 名）`,arche:`band`,glass:[.18,.3,.42],frame:Yh,crown:`flat`},{at:[86,1116],name:`北塔（OSM 名）`,arche:`fin`,glass:[.12,.26,.42],frame:Jh,crown:`slope`,crownH:18,finGap:3},{at:[90,1203],name:`南塔（OSM 名）`,arche:`fin`,glass:[.12,.26,.42],frame:Jh,crown:`flat`,finGap:3},{at:[-777,-535],name:`新世界中心`,arche:`unit`,glass:[.3,.4,.5],frame:qh,crown:`steps`,tiers:3,mast:20,mull:1.4},{at:[-34,782],name:`鼎和大厦`,arche:`fin`,glass:[.14,.28,.44],frame:Yh,crown:`screen`,crownH:12,finGap:3},{at:[-58,782],name:`鼎和大厦裙房`,arche:`band`,glass:[.14,.28,.44],frame:Yh,crown:`flat`},{at:[-1273,-197],name:`广电金融中心`,arche:`unit`,glass:[.1,.26,.46],frame:Jh,crown:`slope`,crownH:22,mull:1.5},{at:[-1254,-136],name:`广电大厦`,arche:`stone`,glass:[.14,.22,.3],frame:Xh,crown:`flat`,cell:[3.2,3.8]},{at:[-768,-195],name:`太平金融大厦`,arche:`fin`,glass:[.14,.28,.44],frame:Yh,crown:`screen`,crownH:12,finGap:2.8,mull:1.4,corner:!0},{at:[72,-654],name:`生命保险大厦`,arche:`unit`,glass:[.1,.3,.38],frame:Jh,crown:`slope`,crownH:20,mull:1.5},{at:[83,786],name:`财富大厦`,arche:`fin`,glass:[.24,.34,.44],frame:Xh,crown:`steps`,tiers:2,mast:16,finGap:3.6},{at:[77,794],name:`财富大厦`,arche:`band`,glass:[.24,.34,.44],frame:Xh,crown:`flat`},{at:[131,789],name:`财富大厦`,arche:`band`,glass:[.24,.34,.44],frame:Xh,crown:`flat`},{at:[-1093,-182],name:`深圳建设银行大厦`,arche:`stone`,glass:[.1,.22,.4],frame:[.74,.72,.7],crown:`steps`,tiers:2,cell:[3,4],podium:18,inset:.86},{at:[-779,-76],name:`基金大厦`,arche:`unit`,glass:[.18,.34,.48],frame:Yh,crown:`screen`,crownH:10,mull:1.5},{at:[-762,-641],name:`江苏大厦`,arche:`band`,glass:[.16,.26,.36],frame:[.84,.8,.72],crown:`steps`,tiers:3,mast:24},{at:[61,-418],name:`荣超经贸中心`,arche:`unit`,glass:[.1,.32,.42],frame:Jh,crown:`screen`,crownH:12,mull:1.4,corner:!0},{at:[-39,673],name:`金中环商务大厦`,arche:`unit`,glass:[.12,.3,.5],frame:Jh,crown:`slope`,crownH:16,mull:1.2},{at:[-58,685],name:`金中环商务大厦`,arche:`unit`,glass:[.12,.3,.5],frame:Jh,crown:`flat`,mull:1.2},{at:[72,343],name:`中洲大厦`,arche:`fin`,glass:[.08,.14,.22],frame:Zh,crown:`screen`,crownH:10,finGap:3},{at:[-101,456],name:`大中华国际交易广场`,arche:`stone`,glass:[.14,.22,.3],frame:[.82,.78,.7],crown:`steps`,tiers:3,mast:16,cell:[3.2,3.9]},{at:[-143,530],name:`大中华国际交易广场`,arche:`stone`,glass:[.14,.22,.3],frame:[.82,.78,.7],crown:`hat`,crownH:7,cell:[3.2,3.9]},{at:[-55,529],name:`大中华国际交易广场`,arche:`stone`,glass:[.14,.22,.3],frame:[.82,.78,.7],crown:`hat`,crownH:7,cell:[3.2,3.9]},{at:[66,-319],name:`诺德中心`,arche:`fin`,glass:[.14,.28,.42],frame:Jh,crown:`screen`,crownH:9,finGap:3,podium:14,inset:.9},{at:[-781,-306],name:`荣超中心A座`,arche:`unit`,glass:[.1,.3,.4],frame:Jh,crown:`screen`,crownH:10,mull:1.5},{at:[-776,-416],name:`荣超中心B座`,arche:`unit`,glass:[.1,.3,.4],frame:Jh,crown:`flat`,mull:1.5},{at:[-787,-384],name:`荣超中心B座`,arche:`band`,glass:[.1,.3,.4],frame:Jh,crown:`flat`},{at:[81,679],name:`现代国际大厦`,arche:`band`,glass:[.2,.3,.38],frame:[.8,.78,.74],crown:`steps`,tiers:2,mast:12},{at:[-1083,-55],name:`招商银行深圳分行大厦`,arche:`stone`,glass:[.12,.22,.36],frame:[.72,.7,.68],crown:`slope`,crownH:14,cell:[3,4],podium:16,inset:.88},{at:[424,-104],name:`南楼（OSM 名）`,arche:`unit`,glass:[.16,.3,.44],frame:Yh,crown:`screen`,crownH:8,mull:1.5},{at:[446,161],name:`星河世纪大厦`,arche:`fin`,glass:[.12,.26,.44],frame:Jh,crown:`steps`,tiers:2,finGap:3.6},{at:[85,183],name:`金地中心`,arche:`unit`,glass:[.24,.36,.46],frame:qh,crown:`screen`,crownH:8,mull:1.5},{at:[73,-209],name:`安联大厦`,arche:`band`,glass:[.14,.26,.4],frame:[.8,.8,.78],crown:`steps`,tiers:2,mast:14},{at:[160,-219],name:`国银金融中心大厦`,arche:`unit`,glass:[.1,.22,.38],frame:Jh,crown:`screen`,crownH:8,mull:1.4},{at:[219,-208],name:`民生金融大厦`,arche:`stone`,glass:[.12,.22,.32],frame:Xh,crown:`flat`,cell:[3,3.9]},{at:[465,746],name:`瀚森大厦`,arche:`band`,glass:[.16,.28,.38],frame:Yh,crown:`flat`,mast:10},{at:[146,455],name:`卓悦中心西区`,arche:`unit`,glass:[.2,.32,.42],frame:Zh,crown:`screen`,crownH:7,mull:1.5},{at:[-1515,-257],name:`英龙商务中心`,arche:`band`,glass:[.16,.28,.4],frame:Yh,crown:`flat`},{at:[-1523,-113],name:`中电信息大厦`,arche:`stone`,glass:[.14,.24,.34],frame:[.78,.78,.76],crown:`flat`,cell:[3,3.8]},{at:[-1193,191],name:`航天大厦`,arche:`band`,glass:[.16,.26,.36],frame:Yh,crown:`steps`,tiers:2},{at:[466,676],name:`兆邦基金融大厦`,arche:`unit`,glass:[.12,.28,.42],frame:Jh,crown:`screen`,crownH:6,mull:1.5},{at:[594,840],name:`海天综合大厦`,arche:`stone`,glass:[.14,.22,.3],frame:[.82,.8,.74],crown:`flat`,cell:[3.2,3.6]},{at:[566,-357],name:`橄榄大厦`,arche:`band`,glass:[.16,.3,.3],frame:[.8,.82,.76],crown:`flat`},{at:[437,-768],name:`中银大厦B座`,arche:`stone`,glass:[.12,.2,.3],frame:Xh,crown:`steps`,tiers:2,cell:[3,3.8]},{at:[292,171],name:`华嵘大厦`,arche:`band`,glass:[.18,.28,.36],frame:Xh,crown:`flat`},{at:[460,918],name:`京地大厦`,arche:`stone`,glass:[.14,.22,.3],frame:[.84,.8,.74],crown:`flat`,cell:[3.2,3.6]},{at:[1775,103],name:`汉国中心`,arche:`fin`,glass:[.16,.3,.42],frame:Jh,crown:`steps`,tiers:3,mast:20,finGap:3,mull:1.5},{at:[4339,-1988],name:`城脉中心`,arche:`fin`,glass:[.14,.28,.44],frame:qh,crown:`slope`,crownH:36,finGap:3,corner:!0},{at:[4820,-2612],name:`宝能中心`,arche:`unit`,glass:[.12,.26,.42],frame:Jh,crown:`steps`,tiers:3,mast:18,mull:1.5},{at:[-4494,455],name:`东海国际公寓A座`,arche:`band`,glass:[.16,.26,.36],frame:[.84,.82,.78],crown:`steps`,tiers:3,mast:16},{at:[-4431,412],name:`东海国际公寓B座`,arche:`band`,glass:[.16,.26,.36],frame:[.84,.82,.78],crown:`steps`,tiers:2},{at:[-4353,446],name:`东海朗廷酒店`,arche:`stone`,glass:[.12,.2,.28],frame:[.82,.78,.7],crown:`hat`,crownH:8,cell:[3.4,3.4]},{at:[-4290,389],name:`东海国际中心A座`,arche:`unit`,glass:[.12,.28,.44],frame:Jh,crown:`screen`,crownH:9,mull:1.5},{at:[-714,3772],name:`长富金茂大厦`,arche:`fin`,glass:[.12,.28,.46],frame:Jh,crown:`slope`,crownH:28,finGap:3,corner:!0},{at:[-8264,616],name:`华侨城大厦`,arche:`unit`,glass:[.16,.32,.46],frame:Yh,crown:`slope`,crownH:30,mull:1.4,corner:!0},{at:[821,-1759],name:`深业上城大厦2`,arche:`fin`,glass:[.1,.2,.34],frame:Zh,crown:`screen`,crownH:14,finGap:3},{at:[-3668,1327],name:`京基·滨河时代广场`,arche:`unit`,glass:[.12,.26,.42],frame:Jh,crown:`steps`,tiers:3,mast:14,mull:1.5},{at:[-3558,1357],name:`京基滨河时代 西塔`,arche:`resi`,frame:[.86,.84,.8],accent:[.45,.5,.56],glass:[.12,.17,.22],crown:`resi`},{at:[-3488,1381],name:`京基滨河时代 东塔`,arche:`resi`,frame:[.86,.84,.8],accent:[.45,.5,.56],glass:[.12,.17,.22],crown:`resi`},{at:[-12117,269],name:`中国储能大厦`,arche:`fin`,glass:[.12,.26,.44],frame:Jh,crown:`screen`,crownH:16,finGap:3,corner:!0},{at:[-12094,2417],name:`深创投广场`,arche:`unit`,glass:[.16,.3,.46],frame:Yh,crown:`slope`,crownH:20,mull:1.5},{at:[2106,-101],name:`交通银行大厦`,arche:`stone`,glass:[.12,.22,.36],frame:[.76,.76,.74],crown:`steps`,tiers:3,mast:18,cell:[3,4]},{at:[3210,57],name:`中信国际大厦`,arche:`unit`,glass:[.1,.24,.4],frame:Jh,crown:`screen`,crownH:10,mull:1.5},{at:[855,2371],name:`河套中心`,arche:`fin`,glass:[.16,.3,.44],frame:Yh,crown:`screen`,crownH:12,finGap:3.6},{at:[-7904,-842],name:`侨城一号广场`,arche:`unit`,glass:[.14,.28,.42],frame:Jh,crown:`screen`,crownH:10,mull:1.5},{at:[-13188,-39],name:`腾讯大厦`,arche:`unit`,glass:[.12,.26,.46],frame:Yh,crown:`slope`,crownH:18,mull:1.5,corner:!0},{at:[6583,-508],name:`罗湖商务中心大厦`,arche:`unit`,glass:[.12,.28,.44],frame:Jh,crown:`screen`,crownH:10,mull:1.5},{at:[4321,-626],name:`国信证券大厦`,arche:`stone`,glass:[.1,.2,.32],frame:[.74,.74,.72],crown:`steps`,tiers:2,mast:12,cell:[3,4]},{at:[1943,-318],name:`中航中心`,arche:`fin`,glass:[.14,.28,.42],frame:Jh,crown:`screen`,crownH:10,finGap:3},{at:[-12725,3150],name:`中海油大厦B座`,arche:`unit`,glass:[.14,.3,.46],frame:Yh,crown:`screen`,crownH:10,mull:1.4,corner:!0},{at:[-12699,3049],name:`中海油大厦A座`,arche:`unit`,glass:[.14,.3,.46],frame:Yh,crown:`screen`,crownH:10,mull:1.4,corner:!0},{at:[-12420,2255],name:`航天科技广场A座`,arche:`fin`,glass:[.12,.24,.4],frame:Jh,crown:`flat`,finGap:3.6,mast:12},{at:[-1554,-1448],name:`文博大厦`,arche:`stone`,glass:[.14,.22,.3],frame:[.8,.76,.7],crown:`steps`,tiers:2,cell:[3.2,3.9]},{at:[-11231,-243],name:`大冲国际中心`,arche:`unit`,glass:[.12,.28,.42],frame:Jh,crown:`screen`,crownH:9,mull:1.5},{at:[-11300,-171],name:`华润置地大厦E座`,arche:`fin`,glass:[.14,.28,.4],frame:qh,crown:`screen`,crownH:9,finGap:3.6},{at:[5660,-87],name:`深房广场`,arche:`band`,glass:[.16,.26,.34],frame:[.8,.78,.74],crown:`steps`,tiers:2,mast:10},{at:[5516,-73],name:`深圳国际金融大厦`,arche:`stone`,glass:[.12,.2,.3],frame:[.78,.74,.68],crown:`flat`,cell:[3,3.8]},{at:[5537,73],name:`南洋大厦`,arche:`band`,glass:[.14,.24,.32],frame:[.84,.82,.78],crown:`flat`},{at:[6300,156],name:`广发大厦`,arche:`band`,glass:[.16,.24,.3],frame:[.78,.74,.66],crown:`steps`,tiers:2},{at:[3208,-99],name:`华联大厦`,arche:`stone`,glass:[.12,.2,.28],frame:[.82,.8,.76],crown:`steps`,tiers:2,mast:14,cell:[3.2,3.6]},{at:[2106,88],name:`国际科技大厦`,arche:`unit`,glass:[.14,.26,.38],frame:Jh,crown:`screen`,crownH:7,mull:1.5},{at:[2091,168],name:`世界贸易广场`,arche:`band`,glass:[.16,.26,.34],frame:Xh,crown:`steps`,tiers:2}],$h=[[.1,.25,.46],[.11,.32,.4],[.27,.36,.46],[.09,.14,.22],[.2,.4,.52],[.3,.27,.22],[.16,.3,.36],[.07,.2,.3],[.34,.42,.48],[.14,.36,.34],[.22,.3,.44],[.38,.33,.24],[.12,.18,.34],[.26,.44,.5]],eg=[Jh,Yh,Xh,qh,[.62,.64,.66],[.8,.76,.7],[.44,.46,.5],[.86,.84,.78],[.56,.5,.44],[.7,.74,.76],Zh],tg=[[.9,.88,.82],[.86,.8,.72],[.82,.84,.86],[.88,.84,.76],[.8,.74,.68],[.92,.9,.88],[.84,.72,.62],[.78,.8,.76],[.9,.82,.66],[.72,.74,.78],[.86,.76,.74],[.76,.7,.62],[.88,.88,.8],[.68,.66,.64],[.82,.86,.84],[.92,.86,.78]],ng=[[.62,.42,.32],[.45,.5,.56],[.74,.6,.42],[.36,.4,.44],[.7,.3,.24],[.28,.42,.52],[.5,.56,.44],[.82,.66,.36],[.42,.34,.3],[.58,.62,.66],[.3,.46,.42],[.66,.5,.5],[.24,.28,.34],[.78,.52,.3]],rg=[[.56,.57,.58],[.48,.5,.52],[.62,.6,.56],[.36,.5,.34],[.58,.36,.3],[.34,.42,.54],[.66,.66,.64]],ig=[[.82,.14,.12],[.96,.78,.14],[.12,.36,.74],[.1,.58,.32],[.94,.94,.9],[.92,.46,.1],[.2,.22,.26],[.76,.16,.5],[.1,.62,.7]],ag=(e,t)=>{let n=Math.sin(e*127.1+t*311.7)*43758.5453;return n-Math.floor(n)};function og(e,t,n,r,i=0,a=0,o=4){let s=ag(Math.floor(i/240)*.731+Math.floor(a/240)*1.377,5),c=e=>ag(n,e),l=(e,t)=>c(e+50)<t?ag(s,e):c(e),u=(e,t,n=.5)=>e[Math.floor(l(t,n)*e.length)%e.length],d=u(rg,40,.3);if(e===1){let e=Math.floor(l(1,.65)*6)%6,n=[`machine`,`pergola`,`hip`,`wing`,`steps`,`machine`,`slab`][Math.floor(l(2,.45)*7)%7];return{arche:`resi`,rv:e,frame:u(tg,3,.6),frame2:u(tg,4,.6),accent:u(ng,5,.55),glass:[.1+c(6)*.06,.15+c(6)*.06,.2+c(7)*.08],crown:n,cellW:2.9+Math.floor(l(8,.6)*4)*.3,floorH:2.9+Math.floor(c(9)*3)*.1,wv:Math.floor(l(10,.5)*4)%4,bv:Math.floor(l(11,.5)*6)%6,shops:c(12)<.3&&t<120,bayGap:7.5+Math.floor(l(13,.6)*4)*1.6,tank:c(14)<.5,roof:d,crownH:3+c(15)*5}}if(e===3||e===4||t<60)return{arche:`mall`,mv:e===4?3:[0,1,2,4,5,2,0,1][Math.floor(l(1,.35)*8)%8],glass:u($h,2,.3),frame:e===4?u([Yh,[.92,.9,.84],[.86,.88,.9]],3,.5):u(eg.concat(tg.slice(0,6)),3,.3),accent:u(ig,4,.2),roof:d,board:c(5)<.28&&e!==4,signs:c(6)<.55&&e!==4,wv:Math.floor(c(7)*4)%4,cellW:3+Math.floor(c(8)*4)*.4,clutter:2+Math.floor(c(9)*5)};let f=[`unit`,`fin`,`band`,`stone`,`grid`,`slot`,`louvre`,`fin`,`unit`,`grid`,`stone`,`slot`][Math.floor(l(3,.25)*12)%12],p=[`screen`,`flat`,`steps`,`slope`,`hat`,`frame`,`screen`,`steps`,`flat`,`slope`][Math.floor(c(4)*10)%10],m=c(16)<.22&&t>110;return{arche:f,glass:u($h,5,.2),frame:u(eg,6,.2),crown:m?`steps`:p,crownH:6+c(7)*9,tiers:m?2:2+Math.floor(c(17)*2),stepH:m?.22+c(18)*.16:0,mull:[1.2,1.5,1.5,1.8,2.1][Math.floor(c(8)*5)%5],finGap:[2.4,3,3.6,4.5,6][Math.floor(c(9)*5)%5],floorH:3.9+Math.floor(c(19)*3)*.3,cell:[2.7+Math.floor(c(10)*4)*.3,3.6+Math.floor(c(20)*3)*.3],wv:Math.floor(c(21)*4)%4,sv:Math.floor(c(22)*3)%3,podium:r>1300&&c(11)<.6?9+Math.floor(c(12)*4)*4:0,inset:.76+c(13)*.16,podStyle:Math.floor(c(23)*3)%3,mast:c(14)<.25?8+c(15)*16:0,corner:c(24)<.2,sign:c(25)<.3,roof:d,clutter:1+Math.floor(c(26)*4),auto:!0}}var sg=e=>{let t=0;for(let n=0;n<e.length;n++){let r=e[n],i=e[(n+1)%e.length];t+=r[0]*i[1]-i[0]*r[1]}return t/2},cg=e=>{let t=0,n=0;for(let r of e)t+=r[0],n+=r[1];return[t/e.length,n/e.length]},lg=(e,t,n)=>e.map(e=>[n[0]+(e[0]-n[0])*t,n[1]+(e[1]-n[1])*t]),ug=(e,t,n)=>{let r=0;for(let t of e)r+=Math.hypot(t[0]-n[0],t[1]-n[1]);return r/=e.length,lg(e,Math.max(.3,1-t/r),n)};function dg(e,t,n,r,i){if(e.stub)return;let a=0,o=t.length,s=o>8;for(let c=0;c<o;c++){let l=t[c],u=t[(c+1)%o],d=Math.hypot(u[0]-l[0],u[1]-l[1]);if(d<.05)continue;let f=typeof r==`function`?r(l):r,p=typeof r==`function`?r(u):r;e.quad([l[0],n,l[1]],[u[0],n,u[1]],[u[0],p,u[1]],[l[0],f,l[1]],{...i,u0:s?a:-d/2}),a+=d}}function fg(e,t,n,r){if(e.stub)return;let i=t.map(e=>new q(e[0],e[1])),a;try{a=qa.triangulateShape(i,[])}catch{return}let o=typeof n==`function`?n:()=>n;for(let n of a){let[i,a,s]=n.map(e=>t[e]);e.quad([i[0],o(i),i[1]],[a[0],o(a),a[1]],[s[0],o(s),s[1]],[s[0],o(s),s[1]],r,[i,a,s,s])}}function pg(e,t,n,r,i,a,o,s,c=7){if(e.stub)return;let l=sg(t)>0?1:-1,u=t.length;for(let d=0;d<u;d++){let f=t[d],p=t[(d+1)%u],m=p[0]-f[0],h=p[1]-f[1],g=Math.hypot(m,h);if(g<c)continue;let _=m/g,v=h/g,y=v*l,b=-_*l,x=Math.max(1,Math.round(g/i));for(let t=0;t<=x;t++){let i=Math.min(g-a/2,Math.max(a/2,t/x*g)),c=f[0]+_*i,l=f[1]+v*i,u=[c-_*a/2,l-v*a/2],d=[c+_*a/2,l+v*a/2],p=[u[0]+y*o,u[1]+b*o],m=[d[0]+y*o,d[1]+b*o];e.quad([p[0],n,p[1]],[m[0],n,m[1]],[m[0],r,m[1]],[p[0],r,p[1]],s),e.quad([u[0],n,u[1]],[p[0],n,p[1]],[p[0],r,p[1]],[u[0],r,u[1]],s),e.quad([m[0],n,m[1]],[d[0],n,d[1]],[d[0],r,d[1]],[m[0],r,m[1]],s)}}}function mg(e,t,n,r,i,a,o){let s=ug(t,-i,n);dg(e,s,r-a/2,r+a/2,{mat:0,col:o}),fg(e,s,r+a/2,{mat:0,col:o}),fg(e,s,r-a/2,{mat:0,col:o.map(e=>e*.8)})}function hg(e){let t=e.floorH||4.2,n=e.mull||1.5,r=e.cell||[3,3.9];switch(e.arche){case`fin`:return{mat:2,col:e.frame,col2:e.glass,p:[n,t,0]};case`steel`:return{mat:2,col:e.frame,col2:e.glass,p:[n,4.5,0]};case`band`:return{mat:2,col:e.frame,col2:e.glass,p:[n*1.2,t,4]};case`stone`:return{mat:2,col:e.frame,col2:e.glass,p:[r[0],r[1],2+10*(e.wv||0)]};case`grid`:return{mat:2,col:e.frame,col2:e.glass,p:[n*1.2,t,7+10*(e.sv||0)]};case`slot`:return{mat:2,col:e.frame,col2:e.glass,p:[r[0]*.8,t,6+10*(e.sv||0)]};case`louvre`:return{mat:2,col:e.frame,col2:e.glass,p:[n,t,8]};case`resi`:return{mat:2,col:e.frame,col2:e.glass,p:[e.cellW||3.3,e.floorH||3,2+10*(e.wv||0)]};default:return{mat:2,col:e.frame,col2:e.glass,p:[n,t,0]}}}function gg(e,t,n,r,i,a,o){let s=lg(t,.62,n);for(let t=0;t<a;t++){let a=s[Math.floor(ag(i,60+t)*s.length)%s.length],o=.25+ag(i,70+t)*.6,c=n[0]+(a[0]-n[0])*o,l=n[1]+(a[1]-n[1])*o,u=1.6+ag(i,80+t)*2.6,d=1.4+ag(i,90+t)*2.2,f=1+ag(i,100+t)*1.6;e.box(c-u/2,c+u/2,r,r+f,l-d/2,l+d/2,{mat:1,col:ag(i,110+t)<.5?[.72,.73,.74]:[.52,.55,.58],p:[.8,.3,1]})}if(o){let t=n[0]+(ag(i,121)-.5)*5,a=n[1]+(ag(i,122)-.5)*5;for(let[n,i]of[[-1,-1],[1,-1],[1,1],[-1,1]])e.strut([t+n*1.1,r,a+i*1.1],[t+n*1.1,r+2.2,a+i*1.1],.18,{mat:0,col:[.4,.42,.44]});e.box(t-1.5,t+1.5,r+2.2,r+4.4,a-1.5,a+1.5,{mat:1,col:ag(i,123)<.5?[.8,.82,.84]:[.24,.4,.62],p:[1,.5,0]})}}function _g(e,t,n,r,i,a=5){let o=0,s=0;for(let e=0;e<t.length;e++){let n=t[e],r=t[(e+1)%t.length],i=Math.hypot(r[0]-n[0],r[1]-n[1]);i>s&&(s=i,o=e)}if(s<12)return;let c=t[o],l=t[(o+1)%t.length],u=Math.min(s*.6,26),d=.5-u/s/2,f=.5+u/s/2,p=[c[0]+(l[0]-c[0])*d,c[1]+(l[1]-c[1])*d],m=[c[0]+(l[0]-c[0])*f,c[1]+(l[1]-c[1])*f];e.fx=[2,ag(r,130)],e.quad([p[0],n+1.2,p[1]],[m[0],n+1.2,m[1]],[m[0],n+1.2+a,m[1]],[p[0],n+1.2+a,p[1]],{mat:0,col:i}),e.fx=e.fxBase||[0,0];for(let t of[.08,.5,.92]){let r=p[0]+(m[0]-p[0])*t,i=p[1]+(m[1]-p[1])*t;e.strut([r,n,i],[r,n+1.2+a,i],.25,{mat:0,col:[.3,.32,.34]})}}function vg(e,t,n,r,i){let a=sg(t)>0?1:-1;for(let o=0;o<t.length;o++){let s=t[o],c=t[(o+1)%t.length],l=c[0]-s[0],u=c[1]-s[1],d=Math.hypot(l,u);if(d<9)continue;let f=l/d,p=u/d,m=p*a*.3,h=-f*a*.3,g=.8,_=0;for(;g<d-3;){let t=Math.min(d-.8-g,3.5+ag(i,140+o*7+_)*4.5),a=ig[Math.floor(ag(i,150+o*5+_)*ig.length)%ig.length],c=[s[0]+f*g+m,s[1]+p*g+h],l=[s[0]+f*(g+t)+m,s[1]+p*(g+t)+h];e.fx=[2,ag(i,160+_+o)],e.quad([c[0],n,c[1]],[l[0],n,l[1]],[l[0],r,l[1]],[c[0],r,c[1]],{mat:0,col:a}),g+=t+.4,_++}}e.fx=e.fxBase||[0,0]}function yg(e,t,n,r,i,a){if(!e.stub)for(let o=0;o<t.length;o++){let s=t[o],c=t[(o+1)%t.length];e.quad([s[0],r,s[1]],[c[0],r,c[1]],[n[0],r+i,n[1]],[n[0],r+i,n[1]],{mat:1,col:a,p:[.6,.6,2]})}}function bg(e,t,n,r,i,a){let o=ug(t,1.2,n);if(!(o.length>14))for(let t=0;t<o.length;t++){let n=o[t],s=o[(t+1)%o.length];Math.hypot(s[0]-n[0],s[1]-n[1])<1.5||(e.strut([n[0],r+i,n[1]],[s[0],r+i,s[1]],.5,{mat:0,col:a}),e.strut([n[0],r,n[1]],[n[0],r+i,n[1]],.45,{mat:0,col:a}))}}function xg(e){let t=e.ring;sg(t)<0&&(t=t.slice().reverse());let n=e.spec,r=e.h;if(n.arche===`mall`||n.arche===`resi`)return{ring:t,top:r};let i=cg(t),a=Math.abs(sg(t)),o=(n.podium&&a>900?n.podium:0)>0?lg(t,n.inset||.85,i):t,s=n.crown||`flat`;return{ring:o,top:r-(s===`steps`?n.stepH?r*n.stepH:Math.min(r*.16,9*(n.tiers||2)):s===`flat`?0:Math.min(n.crownH||8,r*.15))}}function Sg(e,t,n,r,i,a,o,s,c){sg(t)<0&&(t=t.slice().reverse());let l=cg(t),u=Math.abs(sg(t)),d=hg(a),f=a.frame.map(e=>e*.78),p={mat:3,col:[.56,.57,.58],p:[3,3]},m=(e,t,n)=>{let i=e.map(e=>new q(e[0],e[1])),a=e.map(e=>e[0]),o=e.map(e=>e[1]);s.push({rings:[i],minX:Math.min(...a),maxX:Math.max(...a),minZ:Math.min(...o),maxZ:Math.max(...o),bottom:t,top:n,name:c,h:r})},h=e=>n+e,g=i>0?i:-1.5;if(a.arche===`mall`){let n=a.mv||0,s=a.accent||a.frame,c={mat:3,col:a.roof||p.col,p:[3,3]},u=Math.min(n===2?4.2:6.5,r);if(dg(e,t,h(g),h(u),{mat:2,col:n===2?f:a.frame,col2:[.1,.14,.18],p:[n===2?3.6:4.2,u,3]}),i>0&&fg(e,t,h(i),{mat:0,col:f}),n===0){let n=Math.max(1,Math.round((r-u)/9));for(let i=0;i<n;i++){let o=u+(r-u)*i/n,s=u+(r-u)*(i+1)/n;dg(e,i%2?ug(t,1.2,l):t,h(o),h(s),i%2?{mat:2,col:a.frame,col2:a.glass,p:[1.8,s-o,0]}:{mat:1,col:a.frame,p:[3.6,1.5,0]}),mg(e,t,l,h(s),.5,.5,a.frame)}}else if(n===1)dg(e,t,h(u),h(r),{mat:2,col:a.frame,col2:a.glass,p:[2.1,4.8,0]}),pg(e,t,h(g),h(r+.6),1e6,2.2,.8,{mat:1,col:s,p:[3,3,0]},14),mg(e,t,l,h(u),1.4,.5,f),mg(e,t,l,h(r),.6,.7,a.frame);else if(n===2){dg(e,t,h(u),h(r),{mat:2,col:a.frame,col2:[.11,.15,.19],p:[a.cellW||3.3,3.3,2+10*(a.wv||0)]}),mg(e,t,l,h(u),.9,.35,f);for(let n=u+9.9;n<r-3;n+=9.9)mg(e,t,l,h(n),.3,.25,f)}else if(n===3){dg(e,t,h(u),h(r),{mat:2,col:a.frame,col2:[.14,.2,.26],p:[3.6,3.7,8]});for(let n=u;n<r-1;n+=3.7)mg(e,t,l,h(n),.35,.22,a.frame);mg(e,t,l,h(r+1.3),.3,.4,[.66,.26,.2])}else n===4?(dg(e,t,h(u),h(r),{mat:2,col:a.frame,col2:a.glass,p:[1.6,3.9,8]}),pg(e,t,h(u),h(r),7.8,.5,.45,{mat:0,col:f},10)):(dg(e,t,h(u),h(r),{mat:2,col:a.frame,col2:a.glass,p:[1.8,4.2,7+10*((a.wv||0)%3)]}),mg(e,t,l,h(u),1,.4,f));a.signs&&i===0&&vg(e,t,h(u-1.5),h(u-.1),o),fg(e,t,h(r),c),dg(e,t,h(r),h(r+1.3),{mat:0,col:a.frame});let d=lg(t,.3+ag(o,41)*.14,[l[0]+(ag(o,42)-.5)*8,l[1]+(ag(o,43)-.5)*8]);dg(e,d,h(r),h(r+4.5),{mat:1,col:[.66,.67,.68],p:[2.4,.5,1]}),fg(e,d,h(r+4.5),c),gg(e,t,l,h(r),o,a.clutter||2,!1),a.board&&_g(e,t,h(r),o,s,4+ag(o,44)*3),m(t,h(g),h(r));return}if(a.arche===`resi`){let n=a.rv||0,i=a.accent,s=a.floorH||3,c=a.cellW||3.3,u={mat:3,col:a.roof||p.col,p:[3,3]},_={mat:2,col:i,col2:a.glass,p:[1.5,s,5+10*(a.bv||0)]},v=a.shops?5.4:4.6;if(a.shops){let n=ug(t,-2.2,l);dg(e,n,h(g),h(v),{mat:2,col:f,col2:[.1,.14,.18],p:[3.6,v,3]}),fg(e,n,h(v),{mat:0,col:f}),vg(e,n,h(v-1.5),h(v-.15),o)}else dg(e,t,h(g),h(v),{mat:3,col:i.map(e=>e*.8),p:[1.2,.6]});if(n===0)dg(e,t,h(v),h(r),d),pg(e,t,h(v),h(r+1.2),a.bayGap||9.9,3,.9,_,9);else if(n===1){dg(e,t,h(v),h(r),{mat:2,col:a.frame,col2:a.glass,p:[c,s,5+10*(a.bv||0)]});for(let n=v+s*6;n<r-4;n+=s*6)mg(e,t,l,h(n),.35,.3,i);pg(e,t,h(v),h(r+2),1e6,1.6,.35,{mat:0,col:i},12)}else if(n===2)dg(e,t,h(v),h(r),{mat:2,col:a.frame,col2:a.glass,p:[c*.8,s,6+10*((a.wv||0)%3)]}),pg(e,t,h(v),h(r+.6),(a.bayGap||9.9)*1.3,2.4,.7,{mat:2,col:a.frame2||i,col2:a.glass,p:[1.2,s,22]},10);else if(n===3){let n=s*(5+Math.floor(ag(o,45)*3)),u=v,d=0;for(;u<r-.5;){let o=Math.min(r,u+n);dg(e,t,h(u),h(o),{mat:2,col:d%2?a.frame2||i:a.frame,col2:a.glass,p:[c,s,9+10*((a.wv||0)%2)]}),o<r&&mg(e,t,l,h(o),.3,.25,i),u=o,d++}}else n===4?(dg(e,t,h(v),h(r),{mat:2,col:i.map(e=>e*.7),col2:a.glass.map(e=>e*1.6),p:[c*.6,s,7+10*((a.wv||0)%3)]}),pg(e,t,h(v),h(r),(a.bayGap||9.9)*1.1,3.2,.8,{mat:2,col:a.frame,col2:a.glass,p:[1.6,s,35]},10)):(dg(e,t,h(v),h(r),{mat:2,col:a.frame,col2:a.glass,p:[c,s,9]}),pg(e,t,h(v),h(r+1),a.bayGap||9.9,1,.5,{mat:0,col:i},9));fg(e,t,h(r),u),dg(e,t,h(r),h(r+1.4),{mat:0,col:a.frame});let y=a.crown,b=a.crownH||5,x=t.length<=10;if(y===`hip`&&x)yg(e,ug(t,-.6,l),l,h(r+1.4),3+b*.7,[[.58,.3,.24],[.34,.4,.5],[.42,.44,.46],[.3,.44,.36]][Math.floor(ag(o,46)*4)%4]);else if(y===`pergola`)bg(e,t,l,h(r+1.4),2.6+b*.4,i);else if(y===`wing`)pg(e,t,h(r-s*2),h(r+2.5+b*.5),5.5,.45,.7,{mat:0,col:i},8),mg(e,t,l,h(r+1.4),.9,.4,i);else if(y===`steps`){let n=lg(t,.78,l);dg(e,n,h(r),h(r+s*2),{mat:2,col:a.frame2||a.frame,col2:a.glass,p:[c,s,2]}),fg(e,n,h(r+s*2),u),mg(e,n,l,h(r+s*2+.2),.8,.35,i)}else y===`slab`?(mg(e,t,l,h(r+3.4),1.6,.45,i),bg(e,lg(t,.7,l),l,h(r),3.2,a.frame)):mg(e,t,l,h(r+1.4),.5,.35,i);if(y!==`hip`||!x){let n=lg(t,.3+ag(o,47)*.16,[l[0]+(ag(o,48)-.5)*5,l[1]+(ag(o,49)-.5)*5]),i=3.5+ag(o,50)*3;dg(e,n,h(r),h(r+i),{mat:0,col:a.frame}),fg(e,n,h(r+i),u),gg(e,t,l,h(r),o,1+Math.floor(ag(o,51)*3),a.tank)}m(t,h(g),h(r));return}let _=t,v=g,y=a.podium&&u>900?a.podium:0;y>0&&(dg(e,t,h(g),h(6),{mat:2,col:a.frame,col2:[.1,.14,.18],p:[4.2,6,3]}),dg(e,t,h(6),h(y),a.podStyle===1?{mat:2,col:a.frame,col2:a.glass,p:[2.1,4.5,0]}:a.podStyle===2?{mat:2,col:a.frame,col2:[.11,.15,.2],p:[3.3,4.5,2]}:{mat:1,col:a.frame,p:[3,1.5,0]}),a.auto&&ag(o,52)<.5&&vg(e,t,h(4.4),h(5.8),o),dg(e,t,h(y),h(y+1.2),{mat:0,col:a.frame}),mg(e,t,l,h(6),1.6,.4,f),fg(e,t,h(y),p),m(t,h(g),h(y)),_=lg(t,a.inset||.85,l),v=y);let b=a.crown||`flat`,x=b===`steps`?a.stepH?r*a.stepH:Math.min(r*.16,9*(a.tiers||2)):b===`flat`?0:Math.min(a.crownH||8,r*.15),S=r-x,C=v+(y>0?0:9);y===0&&(dg(e,ug(_,.8,l),h(g),h(C),{mat:2,col:a.frame,col2:[.1,.15,.2],p:[3,9,3]}),fg(e,_,h(C),{mat:0,col:f}),mg(e,_,l,h(C),1.2,.5,a.frame));let w=r>170?2:+(r>95),T=[C];for(let e=1;e<=w;e++){let t=C+(S-C)*e/(w+1);T.push(t,t+4.4)}T.push(S);for(let t=0;t<T.length-1;t++){let n=T[t],r=T[t+1];t%2==0?(dg(e,_,h(n),h(r),d),t>0&&fg(e,_,h(n),{mat:0,col:f}),t<T.length-2&&fg(e,_,h(r),{mat:0,col:f})):dg(e,ug(_,.7,l),h(n),h(r),{mat:1,col:[.5,.53,.56],p:[3,.7,1]})}if(a.arche===`fin`&&pg(e,_,h(C),h(S+(b===`screen`?x:0)),a.finGap||3,.38,.55,{mat:0,col:a.frame}),a.arche===`steel`&&pg(e,_,h(C),h(S+1.5),8.6,1.5,.9,{mat:1,col:a.frame,p:[6,4.5,0]}),a.arche===`louvre`)for(let t=C+(a.floorH||4.2)*3;t<S-3;t+=(a.floorH||4.2)*3)mg(e,_,l,h(t),.5,.2,a.frame);if(a.arche===`slot`&&pg(e,_,h(C),h(S),(a.cell||[3,3.9])[0]*3.2,.7,.5,{mat:0,col:a.frame},9),a.arche===`grid`&&pg(e,_,h(C),h(S+1),1e6,1.2,.45,{mat:1,col:f,p:[4,4.2,0]},10),a.arche===`band`)for(let t=C+4.2*6;t<S-4;t+=4.2*6)mg(e,_,l,h(t),.45,.35,a.frame);a.corner&&pg(e,_,h(C),h(r),1e6,1.8,.5,{mat:1,col:a.frame,p:[6,4.2,0]});let E=r,D=lg(_,.3,l);if(b===`screen`){fg(e,_,h(S),p),dg(e,_,h(S),h(r),{mat:2,col:a.frame,col2:a.glass,p:[a.mull||1.5,x,3]}),mg(e,_,l,h(r),.3,.4,a.frame);let t=lg(_,.5,l);dg(e,t,h(S),h(S+x*.7),{mat:1,col:[.62,.64,.66],p:[2.4,.6,1]}),fg(e,t,h(S+x*.7),p)}else if(b===`steps`){let t=_,n=S,r=a.tiers||2;for(let i=0;i<r;i++){fg(e,t,h(n),p),dg(e,t,h(n),h(n+1.1),{mat:0,col:a.frame}),t=lg(t,.8,l);let o=n+x/r;dg(e,t,h(n),h(o),i===r-1?{mat:1,col:a.frame,p:[2.4,.7,1]}:d),n=o}fg(e,t,h(n),p),D=lg(t,.25,l)}else if(b===`slope`){let t=1,n=0,r=0;for(let e=0;e<_.length;e++){let i=_[e],a=_[(e+1)%_.length],o=Math.hypot(a[0]-i[0],a[1]-i[1]);o>r&&(r=o,t=(a[0]-i[0])/o,n=(a[1]-i[1])/o)}ag(o,21)<.5&&(t=-t,n=-n);let i=1/0,s=-1/0;for(let e of _){let r=e[0]*t+e[1]*n;i=Math.min(i,r),s=Math.max(s,r)}let c=e=>h(S+1.5+(x-1.5)*((e[0]*t+e[1]*n-i)/(s-i)));dg(e,_,h(S),c,{mat:2,col:a.frame,col2:a.glass,p:[a.mull||1.5,4.2,3]}),fg(e,_,c,{mat:1,col:a.frame.map(e=>e*.92),p:[3,3,0]}),E=S+x*.5}else if(b===`frame`){fg(e,_,h(S),p),dg(e,_,h(S),h(S+1.4),{mat:0,col:a.frame}),bg(e,ug(_,-.6,l),l,h(S),x,a.frame),pg(e,_,h(S),h(r),4.2,.4,.2,{mat:0,col:a.frame},8);let t=lg(_,.5,l);dg(e,t,h(S),h(S+x*.75),{mat:1,col:[.62,.64,.66],p:[2.4,.6,1]}),fg(e,t,h(S+x*.75),p)}else if(b===`hat`){dg(e,ug(_,1.2,l),h(S),h(r-1.5),{mat:2,col:f,col2:a.glass,p:[1.5,x,3]}),mg(e,_,l,h(r-.75),1.6,1.5,a.frame),fg(e,_,h(S),p);let t=lg(_,.4,l);dg(e,t,h(r),h(r+4),{mat:1,col:[.62,.64,.66],p:[2.4,.6,1]}),fg(e,t,h(r+4),p)}else{fg(e,_,h(r),p),dg(e,_,h(r),h(r+1.6),{mat:0,col:a.frame}),mg(e,_,l,h(r+1.6),.25,.3,a.frame);let t=lg(_,.45,[l[0]+(ag(o,31)-.5)*6,l[1]+(ag(o,32)-.5)*6]);dg(e,t,h(r),h(r+5.5),{mat:1,col:[.62,.64,.66],p:[2.4,.6,1]}),fg(e,t,h(r+5.5),p),E=r+5.5,D=lg(t,.3,l)}if(a.auto&&((b===`flat`||b===`screen`)&&gg(e,_,l,h(b===`flat`?r:S),o,a.clutter||2,!1),a.sign&&b!==`slope`&&_g(e,ug(_,.4,l),h(r-1),o,ig[Math.floor(ag(o,53)*ig.length)%ig.length],3.2+ag(o,54)*2.5)),a.mast){let t=cg(D);e.strut([t[0],h(E),t[1]],[t[0],h(E+a.mast),t[1]],.9,{mat:0,col:[.85,.86,.88]}),e.strut([t[0],h(E+a.mast),t[1]],[t[0],h(E+a.mast+1.2),t[1]],.5,{mat:0,col:[.85,.2,.15]})}m(_,h(v),h(r))}var Cg=24,wg=400,Tg=/铁塔|埃菲尔|金字塔|凯旋门/,Eg=class{constructor(e,t=new Set){this.extraSigns=[],this.city=e,this.entries=new Map,this.keyOf=new Map,this.skip=new Set,this.colliders=[],this.report=[],this.showTargets=[],this.detail=new Map,this.tris=0;let n={stub:!0,quad(){},strut(){},box(){},prism(){}};e.buildings.forEach((e,r)=>{let[i,a,o,s,c]=e;if(t.has(r)){this.skip.add(r);return}if(i===2||a<Cg||e[5]&&Tg.test(e[5]))return;let l=c[0],u=[];for(let e=0;e<l.length;e+=2)u.length&&Math.hypot(l[e]-u[u.length-1][0],l[e+1]-u[u.length-1][1])<.05||u.push([l[e],l[e+1]]);if(u.length>3&&Math.hypot(u[0][0]-u[u.length-1][0],u[0][1]-u[u.length-1][1])<.05&&u.pop(),u.length<3)return;let d=Math.abs(sg(u));if(d<120)return;let f=cg(u),p=null,m=14;for(let e of Qh){let t=Math.hypot(e.at[0]-f[0],e.at[1]-f[1]);t<m&&(m=t,p=e)}let h=p||og(i,a,s,d,f[0],f[1],u.length),g=1/0;for(let e of u)g=Math.min(g,$(e[0],e[1]));let _=p&&p.name||e[5]||``,v=Math.floor(f[0]/wg)+`,`+Math.floor(f[1]/wg),y={ring:u,base:g,h:a,minH:o,spec:h,seed:s,name:_};if(y.show=h.arche!==`resi`&&h.arche!==`mall`&&!!(h.name||a>=150),y.show){let e=0;for(let t of u)e=Math.max(e,Math.hypot(t[0]-f[0],t[1]-f[1]));this.showTargets.push({x:f[0],z:f[1],R:e+3,h:a,base:g,name:_})}this.entries.has(v)||this.entries.set(v,{cx:(Math.floor(f[0]/wg)+.5)*wg,cz:(Math.floor(f[1]/wg)+.5)*wg,list:[]}),this.entries.get(v).list.push(y),this.keyOf.set(r,v),this.skip.add(r),Sg(n,u,g,a,o,h,s,this.colliders,_),this.report.push({name:_||``,osmName:e[5]||``,h:a,kind:i,x:Math.round(f[0]),z:Math.round(f[1]),arche:h.arche,crown:h.crown||`-`,named:!!p})})}attach(e,t,n){this.scene=e,this.far=t,this.onChange=n||(()=>{}),this.group=new On,e.add(this.group,t.group)}buildTile(e){let t=this.entries.get(e),n=new Ap,r=[];for(let e of t.list){let t=e.show,i=1/0,a=-1/0,o=1/0,s=-1/0;for(let t of e.ring)i=Math.min(i,t[0]),a=Math.max(a,t[0]),o=Math.min(o,t[1]),s=Math.max(s,t[1]);let c=Math.max(6,Math.min(14,.34*Math.min(a-i,s-o)));n.fxBase=t?[1+.05*(Math.floor(ag(e.seed,88)*8)%8),c]:[0,ag(e.seed,77)],n.fx=n.fxBase,Sg(n,e.ring,e.base,e.h,e.minH,e.spec,e.seed,r,e.name)}let i=n.build(),a=new ri(i,Mp());return a.renderOrder=5,a.layers.enable(1),this.tris+=i.index.count/3,{mesh:a,tris:i.index.count/3}}update(e){let t=Math.min(3400,2100+Math.max(0,e.y)*1),n=null,r=1/0,i=0;for(let[a,o]of this.entries){let s=Math.hypot(o.cx-e.x,o.cz-e.z),c=this.detail.get(a);if(s<t)c||(i++,s<r&&(r=s,n=a));else if(c&&s>t+600){this.group.remove(c.mesh),c.mesh.geometry.dispose(),this.tris-=c.tris,this.detail.delete(a);let e=this.far.byKey.get(a);e&&(e.visible=!0)}}let a=0;for(;n&&a<(this.fast?1e3:1);){let o=this.buildTile(n);this.detail.set(n,o),this.group.add(o.mesh);let s=this.far.byKey.get(n);if(s&&(s.visible=!1),a++,i--,n=null,this.fast){r=1/0;for(let[i,a]of this.entries){if(this.detail.has(i))continue;let o=Math.hypot(a.cx-e.x,a.cz-e.z);o<t&&o<r&&(r=o,n=i)}}}return a&&this.onChange(),i}},Dg=`#2a8cff`,Og=`#e8262a`,kg=`#f2f6ff`,Ag=`#f26a21`,jg=`#f0c060`,Mg=[{at:[-11240,316],name:`创维半导体设计大厦东座`,parts:[[`SKYWORTH `,Dg],[`创维`,kg]],aliases:[`创维半导体大厦`,`创维半导体设计大厦`,`创维`,`SKYWORTH`,`创维东座`]},{at:[-11350,349],name:`创维半导体设计大厦西座`,parts:[[`SKYWORTH `,Dg],[`创维`,kg]],aliases:[`创维半导体大厦`,`创维半导体设计大厦`,`创维`,`SKYWORTH`,`创维西座`]},{at:[-11137,85],name:`德赛科技大厦`,parts:[[`DESAY`,Dg]],italic:!0,aliases:[`德赛`,`DESAY`]},{at:[-10884,86],name:`康佳研发大厦`,parts:[[`KONKA `,Og],[`康佳`,Og]],aliases:[`康佳`,`KONKA`]},{at:[-10797,219],name:`长虹科技大厦`,parts:[[`CHANGHONG `,Dg],[`长虹`,Dg]],aliases:[`长虹`,`CHANGHONG`]},{at:[-11001,86],name:`飞亚达科技大厦`,parts:[[`FIYTA `,kg],[`飞亚达`,kg]],aliases:[`飞亚达`,`FIYTA`]},{at:[2136,-391],name:`飞亚达大厦`,parts:[[`FIYTA `,kg],[`飞亚达`,kg]],aliases:[`飞亚达`,`FIYTA`]},{at:[-13188,-39],name:`腾讯大厦`,parts:[[`Tencent`,Dg]],italic:!0,aliases:[`腾讯`,`Tencent`,`腾讯总部`,`腾讯大厦老楼`]},{at:[-13093,1957],name:`腾讯滨海大厦`,parts:[[`Tencent`,kg]],italic:!0,aliases:[`腾讯滨海`,`滨海大厦`,`腾讯新总部`,`Tencent Binhai`]},{at:[-11956,2818],name:`华润总部大厦（春笋）`,parts:[[`华润`,jg]],aliases:[`春笋`,`华润总部`,`华润总部大厦`,`中国华润大厦`,`华润大厦`]},{at:[-11300,-171],name:`华润置地大厦E座`,parts:[[`华润置地`,jg]],aliases:[`华润置地`,`华润`]},{at:[4904,-74],name:`华润大厦（罗湖）`,parts:[[`华润`,jg]],aliases:[`华润大厦`,`华润`]},{at:[-738,1020],name:`平安财险大厦`,parts:[[`PING AN `,Ag],[`中国平安`,Ag]],aliases:[`平安财险`,`中国平安`,`平安`]},{at:[-1076,454],name:`招商证券大厦`,parts:[[`招商证券`,Og]],aliases:[`招商证券`,`招商`]},{at:[-1083,-55],name:`招商银行深圳分行大厦`,parts:[[`招商银行`,Og]],aliases:[`招商银行`,`招行`,`招商`]},{at:[3210,57],name:`中信国际大厦`,parts:[[`CITIC `,Og],[`中信`,Og]],aliases:[`中信`,`CITIC`]},{at:[-1291,531],name:`中信银行大厦`,parts:[[`中信银行`,Og]],aliases:[`中信银行`,`中信`]},{at:[2106,-101],name:`交通银行大厦`,parts:[[`交通银行`,Dg]],aliases:[`交通银行`,`交行`]},{at:[4321,-626],name:`国信证券大厦`,parts:[[`国信证券`,Dg]],aliases:[`国信证券`,`国信`]},{at:[-3818,1147],name:`万科滨海置地大厦`,parts:[[`万科`,Og]],aliases:[`万科`,`vanke`]},{at:[-12699,3049],name:`中海油大厦A座`,parts:[[`中国海油`,Og]],aliases:[`中海油`,`中国海油`,`CNOOC`]},{at:[-12725,3150],name:`中海油大厦B座`,parts:[[`中国海油`,Og]],aliases:[`中海油`,`中国海油`,`CNOOC`]},{at:[821,-1759],name:`深业上城大厦2`,parts:[[`深业上城`,jg]],aliases:[`深业上城`,`UpperHills`]},{at:[-8264,616],name:`华侨城大厦`,parts:[[`华侨城`,Og]],aliases:[`华侨城`,`OCT`]},{at:[-3668,1327],name:`京基·滨河时代广场`,parts:[[`京基`,jg]],aliases:[`京基滨河时代`,`京基`]},{at:[-1197,578],name:`中国人寿大厦`,parts:[[`中国人寿`,`#22a860`]],aliases:[`中国人寿`,`国寿`]},{at:[-1093,-182],name:`深圳建设银行大厦`,parts:[[`中国建设银行`,Dg]],aliases:[`建设银行`,`建行`]},{at:[4441,88],name:`中国建设银行大厦`,parts:[[`中国建设银行`,Dg]],aliases:[`建设银行`,`建行`]},{at:[4397,64],name:`工商银行大厦`,parts:[[`中国工商银行`,Og]],aliases:[`工商银行`,`工行`]},{at:[-768,-195],name:`太平金融大厦`,parts:[[`中国太平`,Dg]],aliases:[`中国太平`,`太平`]},{at:[-1299,455],name:`安信金融大厦`,parts:[[`安信证券`,Ag]],aliases:[`安信证券`,`安信`]},{at:[-12462,-56],name:`海王银河科技大厦`,parts:[[`海王`,Dg]],aliases:[`海王`]},{at:[-12540,3740],name:`天虹总部大厦`,parts:[[`天虹`,Og]],aliases:[`天虹`,`Rainbow`]},{at:[85,183],name:`金地中心`,parts:[[`金地集团`,Og]],aliases:[`金地`]},{at:[72,343],name:`中洲大厦`,parts:[[`中洲`,jg]],aliases:[`中洲`]}],Ng=`"Noto Sans CJK SC", "Noto Sans SC", "Source Han Sans SC", "PingFang SC", "Microsoft YaHei", "Heiti SC", sans-serif`,Pg=new Map;function Fg(e){let t=JSON.stringify(e.parts)+(e.italic?`i`:``);if(Pg.has(t))return Pg.get(t);let n=document.createElement(`canvas`),r=n.getContext(`2d`),i=t=>`${e.italic?`italic `:``}900 ${/[^\x00-\x7f]/.test(t)?104:110}px ${Ng}`,a=0,o=[];for(let[t]of e.parts){r.font=i(t);let e=r.measureText(t).width;o.push(e),a+=e}n.width=Math.ceil(a+92),n.height=160,r=n.getContext(`2d`),r.textBaseline=`middle`,r.textAlign=`left`;for(let t of[0,1]){let n=46;e.parts.forEach(([e,a],s)=>{r.font=i(e),r.fillStyle=a,t===0?(r.shadowColor=a,r.shadowBlur=22,r.globalAlpha=.5):(r.shadowBlur=0,r.globalAlpha=1),r.fillText(e,n,160*.53),n+=o[s]})}let s=new ia(n);s.generateMipmaps=!0,s.minFilter=l,s.anisotropy=8;let c={tex:s,aspect:n.width/n.height};return Pg.set(t,c),c}function Ig(e){return new co({uniforms:_d({uLogo:{value:e}}),polygonOffset:!0,polygonOffsetFactor:-2,polygonOffsetUnits:-2,vertexShader:`varying vec2 vUv; varying vec3 vWorld; varying vec3 vN;
      void main(){ vUv = uv; vN = normal; vec4 wp = modelMatrix * vec4(position, 1.0); vWorld = wp.xyz; gl_Position = projectionMatrix * viewMatrix * wp; }`,fragmentShader:`
      ${bd}
      uniform sampler2D uLogo;
      varying vec2 vUv; varying vec3 vWorld; varying vec3 vN;
      void main(){
        vec4 t = texture2D(uLogo, vUv);
        float letter = smoothstep(0.62, 0.86, t.a);
        float halo = t.a * (1.0 - letter);
        vec3 n = normalize(vN);
        float sh = sunShadow(vWorld, n);
        // 招牌带：深色铝板；白天字是品牌色的金属字，夜里自发光
        vec3 band = lightLin(vec3(0.020, 0.024, 0.032), n, sh, 1.0);
        vec3 dayLetter = lightLin(toLin(mix(t.rgb, vec3(0.9), 0.18)), n, sh, 1.0) * 1.05 + 0.04;
        vec3 nightLetter = mix(t.rgb, vec3(1.0), 0.28) * 1.22;
        vec3 col = mix(band, mix(dayLetter, nightLetter, uNight), letter);
        col += t.rgb * halo * 1.5 * uNight;
        gl_FragColor = vec4(atmo(col, vWorld), 1.0);
      }`})}function Lg(e){let t=null;for(let n=0;n<e.length;n++){let r=e[n],i=e[(n+1)%e.length],a=Math.hypot(i[0]-r[0],i[1]-r[1]);if(a<.5)continue;let o=(i[0]-r[0])/a,s=(i[1]-r[1])/a,c=1/0,l=-1/0,u=1/0,d=-1/0;for(let t of e){let e=t[0]*o+t[1]*s,n=-t[0]*s+t[1]*o;c=Math.min(c,e),l=Math.max(l,e),u=Math.min(u,n),d=Math.max(d,n)}let f=(l-c)*(d-u);(!t||f<t.A)&&(t={A:f,ux:o,uz:s,u0:c,u1:l,v0:u,v1:d})}let{ux:n,uz:r,u0:i,u1:a,v0:o,v1:s}=t,c=(i+a)/2,l=(o+s)/2;return{c:[c*n-l*r,c*r+l*n],ax:[n,r],L:a-i,W:s-o}}function Rg(e,t){let n=new On,r=[],i=[],a=[];for(let e of t.entries.values())for(let t of e.list)a.push(t);for(let e of t.extraSigns||[])a.push(e);for(let e of Mg){let t=null,o=30;for(let n of a){let r=0,i=0;for(let e of n.ring)r+=e[0],i+=e[1];r/=n.ring.length,i/=n.ring.length;let a=Math.hypot(r-e.at[0],i-e.at[1]);a<o&&(o=a,t=n,t._c=[r,i])}if(!t){i.push(e.name);continue}t.spec={...t.spec,sign:!1};let{ring:s,top:c}=xg(t),l=Lg(s),{tex:u,aspect:d}=Fg(e),f=Ig(u),p=t.h,m=Math.max(6,Math.min(13,.065*p+2)),h=t.base+c-1.2,g=[],_=[],v=[],y=[],b=[[l.ax[0],l.ax[1],l.W/2,l.L],[-l.ax[0],-l.ax[1],l.W/2,l.L],[-l.ax[1],l.ax[0],l.L/2,l.W],[l.ax[1],-l.ax[0],l.L/2,l.W]];for(let[e,n,r,i]of t.longOnly?b.slice(0,2):b){if(i<14)continue;let t=-n,a=e,o=m*d,s=m;o>i*.94&&(o=i*.94,s=o/d);let c=l.c[0]+t*(r+.9),u=l.c[1]+a*(r+.9),f=a,p=-t,b=g.length/3;for(let[e,n]of[[-1,0],[1,0],[1,1],[-1,1]])g.push(c+f*e*o/2,h-s+n*s,u+p*e*o/2),_.push(t,0,a),v.push(e*.5+.5,n);y.push(b,b+1,b+2,b,b+2,b+3)}if(!g.length){i.push(e.name+`（立面太窄）`);continue}let x=new kr;x.setAttribute(`position`,new Z(g,3)),x.setAttribute(`normal`,new Z(_,3)),x.setAttribute(`uv`,new Z(v,2)),x.setIndex(y),x.computeBoundingSphere();let S=new ri(x,f);S.renderOrder=7,n.add(S),r.push({name:e.name,aliases:e.aliases||[],x:t._c[0],z:t._c[1],h:t.base+p,logo:e.parts.map(e=>e[0]).join(``).trim(),signs:y.length/6})}return i.length&&console.warn(`[futian] 企业字标：这些楼没有匹配到足迹`,i),{group:n,list:r,missing:i}}function zg(e){let t=null;for(let n=0;n<e.length;n++){let r=e[n],i=e[(n+1)%e.length],a=Math.hypot(i[0]-r[0],i[1]-r[1]);if(a<.5)continue;let o=(i[0]-r[0])/a,s=(i[1]-r[1])/a,c=1/0,l=-1/0,u=1/0,d=-1/0;for(let t of e){let e=t[0]*o+t[1]*s,n=-t[0]*s+t[1]*o;c=Math.min(c,e),l=Math.max(l,e),u=Math.min(u,n),d=Math.max(d,n)}let f=l-c,p=d-u,m=[o,s],h=(c+l)/2,g=(u+d)/2,_=[h*o-g*s,h*s+g*o];if(p>f){m=[-s,o];let e=f;f=p,p=e}(!t||f*p<t.L*t.W)&&(t={c:_,ax:m,L:f,W:p})}return t}var Bg=(e,t,n,r,i)=>{let a=e.map(e=>new q(e[0],e[1])),o=e.map(e=>e[0]),s=e.map(e=>e[1]);return{rings:[a],minX:Math.min(...o),maxX:Math.max(...o),minZ:Math.min(...s),maxZ:Math.max(...s),bottom:t,top:n,name:r,h:i}},Vg=e=>{let t=new ri(e.build(),Mp());return t.renderOrder=5,t};function Hg(e){let t=193.2,n=7.5,r=zg(e),i=$(r.c[0],r.c[1]),[a,o]=r.ax,s=-o,c=a,l=r.L/2,u=r.W/2,d=(e,t)=>[r.c[0]+a*e+s*t,r.c[1]+o*e+c*t],f=e=>196.7+10*((e+l)/(2*l)),p=[];p.push({u:-(l-n),v:u,long:!0}),p.push({u:l-n,v:u});for(let e=1;e<7;e++){let t=Math.PI/2-e/7*Math.PI;p.push({u:l-n+Math.cos(t)*n,v:Math.sin(t)*u})}p.push({u:l-n,v:-u,long:!0}),p.push({u:-(l-n),v:-u});for(let e=1;e<7;e++){let t=-Math.PI/2-e/7*Math.PI;p.push({u:-(l-n)+Math.cos(t)*n,v:Math.sin(t)*u})}let m=new Ap,h=[.36,.42,.42],g=[.15,.26,.27],_=[.16,.21,.21],v=[.06,.08,.08],y=e=>i+e;for(let e=0;e<p.length;e++){let t=p[e],n=p[(e+1)%p.length],r=d(t.u,t.v),i=d(n.u,n.v);if(t.long){let e=t.v>0?1:-1;m.quad([r[0],y(12),r[1]],[i[0],y(12),i[1]],[i[0],y(f(n.u)),i[1]],[r[0],y(f(t.u)),r[1]],{mat:2,col:h,col2:g,p:[1.5,4.65,8],fx:[1.05,11]},[[t.u*e-13,12],[n.u*e-13,12],[n.u*e-13,f(n.u)],[t.u*e-13,f(t.u)]]);let a=d(-.7,t.v+e*.12),o=d(.7,t.v+e*.12);m.quad([a[0],y(12),a[1]],[o[0],y(12),o[1]],[o[0],y(187.2),o[1]],[a[0],y(187.2),a[1]],{mat:0,col:v,fx:[0,0]})}else m.quad([r[0],y(0),r[1]],[i[0],y(0),i[1]],[i[0],y(f(n.u)),i[1]],[r[0],y(f(t.u)),r[1]],{mat:1,col:_,p:[3,.85,1],fx:[0,0]})}let b=[d(-(l-n),u-1.2),d(l-n,u-1.2),d(l-n,-u+1.2),d(-(l-n),-u+1.2)];m.prism(b,y(-1.5),y(12),{mat:2,col:[.7,.72,.72],col2:[.1,.15,.17],p:[3,12,3],fx:[0,0]},{cap:!1});let x=p.map(e=>d(e.u,e.v)),S=[d(-l+1,u-.4),d(l-1,u-.4),d(l-1,-u+.4),d(-l+1,-u+.4)];m.prism(S,y(11.5),y(12),{mat:0,col:h,fx:[0,0]},{bottom:!0}),m.prism(S,y(192.7),y(t),{mat:0,col:[.4,.42,.43],fx:[0,0]},{capO:{mat:3,col:[.5,.52,.53],p:[3,3]}}),m.prism([d(-10,6),d(10,6),d(10,-6),d(-10,-6)],y(t),y(199.2),{mat:1,col:[.5,.52,.54],p:[2.4,.6,1],fx:[0,0]});let C=[Bg(x,i-1.5,i+t+4,`腾讯大厦`,t)];return{mesh:Vg(m),colliders:C,obb:r,base:i,H:t,target:{x:r.c[0],z:r.c[1],R:l+4,h:t,base:i,name:`腾讯大厦`},signEntry:{ring:[d(-(l-n),u),d(l-n,u),d(l-n,-u),d(-(l-n),-u)],h:196.2,base:i,spec:{arche:`mall`},longOnly:!0}}}function Ug(e,t,n,r,i,a,o,s,c){let l=-n[1],u=n[0],d=(e,r)=>[t[0]+n[0]*e+l*r,t[1]+n[1]*e+u*r],f=[d(-r/2,i/2),d(r/2,i/2),d(r/2,-i/2),d(-r/2,-i/2)];for(let t=0;t<4;t++){let n=f[t],r=f[(t+1)%4];e.quad([n[0],a,n[1]],[r[0],a,r[1]],[r[0],o,r[1]],[n[0],o,n[1]],t%2==0?s:c)}return e.quad([f[0][0],o,f[0][1]],[f[1][0],o,f[1][1]],[f[2][0],o,f[2][1]],[f[3][0],o,f[3][1]],{mat:3,col:[.42,.43,.44],p:[3,3],fx:[0,0]}),e.quad([f[0][0],a,f[0][1]],[f[1][0],a,f[1][1]],[f[2][0],a,f[2][1]],[f[3][0],a,f[3][1]],{mat:0,col:[.16,.15,.14],fx:[0,0]}),f}function Wg(e,t){let n=245.8,r=194.8,i=e=>{let t=0,n=0;for(let r of e)t+=r[0],n+=r[1];return[t/e.length,n/e.length]},a=i(e),o=i(t),s=Math.min($(a[0],a[1]),$(o[0],o[1])),c=new Ap,l=e=>s+e,u=[.9,.92,.92],d=[.26,.42,.48],f=[.17,.16,.15],p=[.72,.44,.24],m=[],h=(e,t,n,r)=>{c.fx=[0,0],c.prism(e,l(-1.5),l(10),{mat:2,col:u,col2:[.12,.18,.22],p:[3,11.5,3],wrapU:!0},{cap:!1}),c.fx=[1+.05*r,13],c.prism(e,l(10),l(t-5),{mat:2,col:u,col2:d,p:[1.5,4.5,0]},{cap:!1}),c.fx=[0,0],c.prism(e,l(t-5),l(t),{mat:2,col:u,col2:d,p:[1.5,5,3]},{capO:{mat:3,col:[.5,.52,.53],p:[3,3]}});let a=i(e),o=e.map(e=>[a[0]+(e[0]-a[0])*.5,a[1]+(e[1]-a[1])*.5]);c.prism(o,l(t),l(t+5),{mat:1,col:[.55,.57,.58],p:[2.4,.6,1]}),m.push(Bg(e,s-1.5,s+t,n,t))};h(e,n,`腾讯滨海大厦南塔`,2),h(t,r,`腾讯滨海大厦北塔`,4);let g=[o[0]-a[0],o[1]-a[1]],_=Math.hypot(g[0],g[1]),v=[g[0]/_,g[1]/_],y=[-v[1],v[0]],b=[(a[0]+o[0])/2,(a[1]+o[1])/2],x={mat:1,col:f,p:[3,.9,1],fx:[0,0]},S={mat:2,col:p,col2:[.2,.3,.34],p:[2.4,4.5,0],fx:[0,0]};for(let[e,t,r,i,a]of[[0,26,0,_+20,44],[96,124,9,_+46,36],[152,178,-8,_+40,34]]){let o=Ug(c,[b[0]+y[0]*r,b[1]+y[1]*r],v,i,a,l(e),l(t),x,S);for(let n of[[o[1],o[2]],[o[3],o[0]]])for(let r of[e+.4,t-.4])c.strut([n[0][0],l(r),n[0][1]],[n[1][0],l(r),n[1][1]],1.1,{mat:0,col:p,fx:[0,0]});e>0&&m.push(Bg(o,s+e,s+t,`腾讯滨海大厦`,n))}return{mesh:Vg(c),colliders:m,targets:[{x:a[0],z:a[1],R:56,h:n,base:s,name:`腾讯滨海大厦南塔`},{x:o[0],z:o[1],R:50,h:r,base:s,name:`腾讯滨海大厦北塔`}],signEntry:{ring:e,h:n,base:s,spec:{arche:`mall`}},cS:a,cN:o,base:s,HS:n}}var Gg={x0:-12425,x1:-12255,z0:-4190,z1:-4105},Kg=[{id:1110477861,name:`南翼`,h:157.5,minH:31.5,ring:[[-12298.7,-4112],[-12264.7,-4112.7],[-12265.1,-4133.2],[-12271.7,-4133.1],[-12299.1,-4132.6]],cx:-12279.9,cz:-4124.7},{id:1110477862,name:``,h:211.6,minH:0,ring:[[-12275.5,-4147.1],[-12275.9,-4165.9],[-12289.7,-4165.7],[-12289.3,-4146.8]],cx:-12282.6,cz:-4156.4},{id:1110477863,name:`东翼`,h:180,minH:40.5,ring:[[-12275.5,-4147.1],[-12272,-4147.2],[-12257.5,-4147.5],[-12258.2,-4183],[-12276.2,-4182.6],[-12275.9,-4165.9]],cx:-12269.2,cz:-4162.2},{id:1110477864,name:`西翼`,h:198,minH:45,ring:[[-12299.4,-4146.6],[-12320,-4146.2],[-12320.1,-4155.3],[-12320.1,-4156.4],[-12320.3,-4165.1],[-12299.7,-4165.5]],cx:-12313.3,cz:-4155.8},{id:1110477865,name:`西翼`,h:166.5,minH:36,ring:[[-12397.3,-4144.5],[-12400.6,-4144.5],[-12415.3,-4144.2],[-12416,-4177.5],[-12398,-4177.8],[-12397.7,-4163.6]],cx:-12404.1,cz:-4158.7},{id:1110477866,name:``,h:193.1,minH:0,ring:[[-12397.3,-4144.5],[-12397.7,-4163.6],[-12383.3,-4163.8],[-12382.9,-4144.8]],cx:-12390.3,cz:-4154.2},{id:1110477867,name:`南翼`,h:144,minH:22.5,ring:[[-12370.8,-4110.1],[-12404.1,-4109.5],[-12404.5,-4129.7],[-12400.4,-4129.8],[-12371.2,-4130.4]],cx:-12390.2,cz:-4121.9},{id:1110477868,name:`东翼`,h:180,minH:40.5,ring:[[-12371.5,-4145],[-12352,-4145.4],[-12352.2,-4154.7],[-12352.2,-4155.8],[-12352.4,-4164.5],[-12371.9,-4164.1]],cx:-12358.7,cz:-4154.9},{id:1110959408,name:`天空之城连桥`,h:117,minH:103.5,ring:[[-12320.1,-4155.3],[-12320.1,-4156.4],[-12352.2,-4155.8],[-12352.2,-4154.7]],cx:-12336.2,cz:-4155.6},{id:1151596327,name:`南翼`,h:157.5,minH:0,ring:[[-12299.1,-4132.6],[-12271.7,-4133.1],[-12272,-4147.2],[-12275.5,-4147.1],[-12289.3,-4146.8],[-12299.4,-4146.6]],cx:-12284.5,cz:-4142.2},{id:1151596328,name:`西翼`,h:198,minH:0,ring:[[-12289.3,-4146.8],[-12299.4,-4146.6],[-12299.7,-4165.5],[-12289.7,-4165.7]],cx:-12294.5,cz:-4156.1},{id:1151596329,name:`东翼`,h:180,minH:0,ring:[[-12382.9,-4144.8],[-12371.5,-4145],[-12371.9,-4164.1],[-12383.3,-4163.8]],cx:-12377.4,cz:-4154.4},{id:1151596330,name:`南翼`,h:144,minH:0,ring:[[-12371.2,-4130.4],[-12400.4,-4129.8],[-12400.6,-4144.5],[-12397.3,-4144.5],[-12382.9,-4144.8],[-12371.5,-4145]],cx:-12387.3,cz:-4139.8}],qg=e=>{let t=0;for(let n=0;n<e.length;n++){let r=e[n],i=e[(n+1)%e.length];t+=r[0]*i[1]-i[0]*r[1]}return t/2},Jg=e=>{let t=0,n=0;for(let r of e)t+=r[0],n+=r[1];return[t/e.length,n/e.length]},Yg=(e,t,n,r,i)=>{let a=e.map(e=>new q(e[0],e[1])),o=e.map(e=>e[0]),s=e.map(e=>e[1]);return{rings:[a],minX:Math.min(...o),maxX:Math.max(...o),minZ:Math.min(...s),maxZ:Math.max(...s),bottom:t,top:n,name:r,h:i}},Xg=(e,t)=>e>Gg.x0&&e<Gg.x1&&t>Gg.z0&&t<Gg.z1;function Zg(){let e=new Ap,t=[],n=[.3,.31,.34],r=[.105,.105,.12],i=[.13,.13,.14],a=[.7,.68,.63],o=[3,.1],s=$(-12336,-4150),c=e=>s+e,l=Kg.filter(e=>!e.name&&e.minH===0),u=Kg.filter(e=>e.name&&e.minH>0&&!e.name.includes(`连桥`)),d=Kg.filter(e=>e.name&&e.minH===0&&!e.name.includes(`连桥`)),f=Kg.find(e=>e.name.includes(`连桥`));for(let i of l){e.prism(i.ring,c(-1.5),c(i.h),{mat:1,col:r,p:[1.25,6,2],wrapU:!0},{capO:{mat:0,col:[.2,.2,.22]}});let o=Jg(i.ring);e.strut([o[0],c(i.h),o[1]],[o[0],c(i.h+5),o[1]],1.6,{mat:0,col:n});let l=i.ring.map(e=>e[0]),u=i.ring.map(e=>e[1]);e.box(Math.min(...l)-9,Math.max(...l)+9,c(-1.5),c(7.5),Math.min(...u)-9,Math.max(...u)+9,{mat:3,col:a,p:[2.4,1.2]},{capO:{mat:3,col:[.62,.61,.58],p:[2.4,2.4]}}),t.push(Yg(i.ring,s-1.5,s+i.h,`大疆天空之城`,i.h))}for(let n of d){let r=null,a=1e9;for(let e of u){if(e.name!==n.name)continue;let t=Math.hypot(e.cx-n.cx,e.cz-n.cz);t<a&&(a=t,r=e)}let o=r?r.minH+3:30;e.prism(n.ring,c(o),c(n.h-2),{mat:1,col:[.12,.125,.14],p:[1.5,4.5,0],wrapU:!0},{bottom:!0,capO:{mat:0,col:i}}),t.push(Yg(n.ring,s+o,s+n.h-2,`大疆天空之城`,n.h))}if(u.forEach((r,a)=>{let l=qg(r.ring)<0?r.ring.slice().reverse():r.ring,u=r.h-r.minH,d=r.minH+u*[.46,.52,.42,.5,.44,.54][a%6],f=4.2;for(let[a,u]of[[r.minH,d-f],[d+f,r.h]]){e.prism(l,c(a),c(u),{mat:2,col:[.1,.105,.12],col2:[.03,.045,.065],p:[1.5,4.5,0]},{bottom:!0,capO:{mat:0,col:i}});let d=Jg(l),f=l.map(e=>[d[0]+(e[0]-d[0])*1.03,d[1]+(e[1]-d[1])*1.03]);e.prism(f,c(a-1),c(a),{mat:0,col:i},{bottom:!0}),e.prism(f,c(u),c(u+.8),{mat:0,col:n,fx:o},{capO:{mat:0,col:i}}),t.push(Yg(l,s+a-1,s+u+.8,`大疆天空之城`,r.h));let p=l.length,m=.5;for(let t=0;t<p;t++){let r=l[t],i=l[(t+1)%p],s=i[0]-r[0],d=i[1]-r[1],f=Math.hypot(s,d);if(f<1)continue;let h=d/f*m,g=-s/f*m,_=[r[0]+h,r[1]+g],v=[i[0]+h,i[1]+g],y=[(_[0]+v[0])/2,(_[1]+v[1])/2],b={mat:0,col:n,fx:o};if(e.strut([_[0],c(a),_[1]],[_[0],c(u),_[1]],1,b),e.strut([_[0],c(a),_[1]],[v[0],c(a),v[1]],.9,b),f<11)continue;let x=Math.min(17,(u-a)*.36);e.strut([_[0],c(u),_[1]],[y[0],c(u-x),y[1]],1,b),e.strut([v[0],c(u),v[1]],[y[0],c(u-x),y[1]],1,b),e.strut([y[0],c(u-x),y[1]],[y[0],c(a),y[1]],.8,b),e.strut([_[0],c(u-x),_[1]],[v[0],c(u-x),v[1]],.6,{mat:0,col:n})}}}),f){let n=f.ring,r=[];for(let e=0;e<n.length;e++){let t=n[e],i=n[(e+1)%n.length];r.push([Math.hypot(i[0]-t[0],i[1]-t[1]),[(t[0]+i[0])/2,(t[1]+i[1])/2]])}r.sort((e,t)=>e[0]-t[0]);let i=r[0][1],a=r[1][1],l=a[0]-i[0],u=a[1]-i[1],d=Math.hypot(l,u),p=-u/d,m=l/d,h=f.minH+1.5,g=[i[0]-l/d*4,i[1]-u/d*4],_=[a[0]+l/d*4,a[1]+u/d*4],v={mat:0,col:[.5,.52,.55],fx:o},y=[[g[0]+p*1.3,g[1]+m*1.3],[_[0]+p*1.3,_[1]+m*1.3],[_[0]-p*1.3,_[1]-m*1.3],[g[0]-p*1.3,g[1]-m*1.3]];e.prism(y,c(h-.35),c(h),{mat:0,col:[.45,.46,.48]},{bottom:!0});for(let t of[-1,1]){let n=null;for(let r=0;r<=10;r++){let i=r/10,a=g[0]+(_[0]-g[0])*i+p*1.3*t,o=g[1]+(_[1]-g[1])*i+m*1.3*t,s=[a,c(h+1.3+7.5*(2*i-1)**2),o];n&&e.strut(n,s,.22,v),r>0&&r<10&&e.strut([a,c(h),o],s,.1,v),e.strut([a,c(h),o],[a,c(h+1.15),o],.07,{mat:0,col:[.5,.52,.55]}),n=s}e.strut([g[0]+p*1.3*t,c(h+1.15),g[1]+m*1.3*t],[_[0]+p*1.3*t,c(h+1.15),_[1]+m*1.3*t],.08,{mat:0,col:[.5,.52,.55]})}t.push(Yg(y,s+h-.35,s+h,`天空之城连桥`,117))}let p=new ri(e.build(),Mp());p.renderOrder=5;let m=l.reduce((e,t)=>e.cx>t.cx?e:t),h=l.reduce((e,t)=>e.cx<t.cx?e:t);return{mesh:p,colliders:t,places:[{name:`大疆天空之城`,aliases:[`大疆`,`天空之城`,`DJI`,`DJI Sky City`,`Sky City`,`大疆总部`],x:(m.cx+h.cx)/2,z:(m.cz+h.cz)/2,h:s+m.h,pri:9},{name:`天空之城东塔`,aliases:[`大疆东塔`,`Sky City East Tower`],x:m.cx,z:m.cz,h:s+m.h,pri:6},{name:`天空之城西塔`,aliases:[`大疆西塔`,`Sky City West Tower`],x:h.cx,z:h.cz,h:s+h.h,pri:6}]}}var Qg=e=>e.toLowerCase().replace(/[\s·・,，.。()（）\-]/g,``),$g=e=>e.replace(/大厦|大楼|中心|广场|设计|科技|研发|总部|国际|深圳|中国/g,``),e_=(e,t=0)=>t<-2900?e<-9e3?t<-4800||e<-14500?`宝安`:`南山`:e<6500?t<-6500?`龙华`:e<-6466?`南山`:e>4300?`罗湖`:`福田`:t<-9e3?`龙岗`:e>13500?`盐田`:`龙岗`:e<-14500?`宝安`:e>13500?`盐田`:e>8500?`罗湖`:e<-6466?`南山`:e>4300?`罗湖`:`福田`;function t_(e){let t=new Set,n=[];for(let r of e){if(!r.name)continue;let e=r.name+`|`+Math.round(r.x/40)+`|`+Math.round(r.z/40);if(t.has(e))continue;t.add(e);let i=[r.name,...r.aliases||[]].map(Qg);n.push({...r,keys:i,skeys:i.map($g),pri:r.pri||0})}return n}function n_(e,t,n){let r=Qg(t);if(!r)return[];let i=$g(r),a=[];for(let t of e){let e=0;for(let n=0;n<t.keys.length;n++){let a=t.keys[n],o=t.skeys[n];if(a===r)e=Math.max(e,100);else if(a.startsWith(r))e=Math.max(e,80);else if(a.includes(r))e=Math.max(e,62);else if(r.includes(a)&&a.length>=2)e=Math.max(e,50);else if(i.length>=2&&(o.includes(i)||o.length>=2&&i.includes(o)))e=Math.max(e,44);else{let t=0;for(let e of a)if(e===r[t]&&t++,t===r.length)break;t===r.length&&r.length>=2&&(e=Math.max(e,30))}}e>0&&a.push({it:t,sc:e+t.pri,d:Math.hypot(t.x-n.x,t.z-n.z)})}return a.sort((e,t)=>t.sc-e.sc||e.d-t.d),a.slice(0,8)}var r_=e=>e>=1e3?(e/1e3).toFixed(1)+` km`:Math.round(e)+` m`;function i_(){let e=[],t=[],n=[];for(let r=0;r<2;r++){let i=e.length/3;for(let[n,i]of[[-1,0],[1,0],[1,1],[-1,1]])e.push(0,i,0),t.push(n,r);n.push(i,i+1,i+2,i,i+2,i+3)}let r=new kr;r.setAttribute(`position`,new Z(e,3)),r.setAttribute(`aSide`,new Z(t,2)),r.setIndex(n);let i=new ri(r,new co({uniforms:_d({uBase:{value:new J},uLen:{value:700}}),transparent:!0,depthWrite:!1,depthTest:!1,blending:2,side:2,vertexShader:`uniform vec3 uBase; uniform float uLen; attribute vec2 aSide; varying vec2 vS;
      void main(){
        float d = distance(cameraPosition.xz, uBase.xz);
        float w = clamp(d * 0.007, 2.5, 60.0);
        vec3 right = aSide.y < 0.5 ? normalize(vec3(cameraPosition.z - uBase.z, 0.0, -(cameraPosition.x - uBase.x)) + vec3(1e-4, 0.0, 0.0)) : vec3(0.0);
        // 第二片不要：只用一片始终朝向相机的光片（aSide.y=1 的那片退化掉）
        vec3 wp = uBase + vec3(0.0, position.y * uLen, 0.0) + right * aSide.x * w;
        vS = vec2(aSide.x, position.y);
        gl_Position = projectionMatrix * viewMatrix * vec4(wp, 1.0);
      }`,fragmentShader:`uniform float uTime; uniform float uNight; varying vec2 vS;
      void main(){
        float core = pow(max(1.0 - abs(vS.x), 0.0), 2.5) + 0.9 * pow(max(1.0 - abs(vS.x) * 4.0, 0.0), 2.0);
        float fade = pow(1.0 - vS.y, 1.3) * smoothstep(0.0, 0.02, vS.y);
        float pulse = 0.75 + 0.25 * sin(uTime * 3.0 - vS.y * 22.0);
        vec3 c = mix(vec3(1.0, 0.82, 0.30), vec3(0.45, 0.95, 1.0), smoothstep(0.0, 0.5, vS.y));
        gl_FragColor = vec4(c * core * fade * pulse * mix(1.25, 0.9, uNight), 1.0);
      }`}));return i.frustumCulled=!1,i.renderOrder=40,i.visible=!1,i}var a_=class{constructor(e,t,n,r,i,a={}){Object.assign(this,{index:e,scene:t,camera:n,els:r,getPos:i,hooks:a}),this.open=!1,this.results=[],this.sel=0,this.target=null,this.arrived=!1,this.beacon=i_(),t.add(this.beacon),r.input.addEventListener(`input`,()=>this.refresh()),r.input.addEventListener(`keydown`,e=>{e.stopPropagation(),e.key===`Escape`?(this.hide(),e.preventDefault()):e.key===`Enter`?(this.results[this.sel]&&this.choose(this.results[this.sel].it),e.preventDefault()):e.key===`ArrowDown`?(this.sel=Math.min(this.results.length-1,this.sel+1),this.render(),e.preventDefault()):e.key===`ArrowUp`&&(this.sel=Math.max(0,this.sel-1),this.render(),e.preventDefault())}),r.input.addEventListener(`keyup`,e=>e.stopPropagation()),r.clear.addEventListener(`click`,()=>{this.clear(),this.hide()}),this._v=new J}show(){this.open=!0,this.els.box.style.display=`block`,document.pointerLockElement&&document.exitPointerLock(),this.els.input.value=``,this.results=[],this.render(),this.els.clear.style.display=this.target?``:`none`,setTimeout(()=>this.els.input.focus(),0),this.hooks.onOpen&&this.hooks.onOpen()}hide(){this.open=!1,this.els.box.style.display=`none`,this.els.input.blur(),this.hooks.onClose&&this.hooks.onClose()}refresh(){this.results=n_(this.index,this.els.input.value,this.getPos()),this.sel=0,this.render()}render(){let e=this.els.list;if(e.innerHTML=``,!this.results.length&&this.els.input.value.trim()){let t=document.createElement(`div`);t.className=`sr none`,t.textContent=`没有找到这个地点`,e.appendChild(t)}else this.results.forEach((t,n)=>{let r=document.createElement(`div`);r.className=`sr`+(n===this.sel?` on`:``);let i=document.createElement(`span`);i.textContent=t.it.name;let a=document.createElement(`small`);a.textContent=e_(t.it.x,t.it.z)+` · `+r_(t.d),r.append(i,a),r.addEventListener(`mousedown`,e=>{e.preventDefault(),this.choose(t.it)}),e.appendChild(r)})}choose(e){this.target=e,this.arrived=!1,this.beacon.material.uniforms.uBase.value.set(e.x,e.h+2,e.z),this.beacon.visible=!0,this.hide()}clear(){this.target=null,this.beacon.visible=!1,this.els.target.style.display=`none`,this.els.label.style.display=`none`,this.els.arrow.style.display=`none`}update(){let e=this.target,{target:t,label:n,arrow:r}=this.els;if(!e)return;let i=this.getPos(),a=Math.hypot(e.x-i.x,e.z-i.z);a<80?this.arrived=!0:a>140&&(this.arrived=!1),t.style.display=`block`,t.textContent=this.arrived?`✅ 已到达：${e.name}`:`🎯 目标：${e.name} · ${r_(a)}`,t.classList.toggle(`arrived`,this.arrived);let o=window.innerWidth,s=window.innerHeight,c=this._v.set(e.x,e.h+2+Math.min(260,30+a*.06),e.z),l=this.camera,u=c.clone().sub(l.position).dot(l.getWorldDirection(new J))>0;c.project(l);let d=(c.x*.5+.5)*o,f=(-c.y*.5+.5)*s;if(u&&d>40&&d<o-40&&f>40&&f<s-40)n.style.display=`block`,n.style.left=d+`px`,n.style.top=f+`px`,n.textContent=`${e.name} · ${r_(a)}`,r.style.display=`none`;else{n.style.display=`none`;let e=c.x,t=-c.y;u||(e=-e,t=-t);let i=Math.hypot(e,t)||1;e/=i,t/=i;let a=Math.min((o/2-60)/Math.abs(e||1e-6),(s/2-60)/Math.abs(t||1e-6));r.style.display=`block`,r.style.left=o/2+e*a+`px`,r.style.top=s/2+t*a+`px`,r.style.transform=`translate(-50%, -50%) rotate(${Math.atan2(t,e)}rad)`}}},o_=2048,s_=9e3;function c_(e){e.traverse(e=>{e.isMesh&&e.layers.enable(1)})}var l_=class{constructor(e,t){this.renderer=e,this.scene=t,this.depthMat=new Gr({colorWrite:!1,side:2,polygonOffset:!0,polygonOffsetFactor:1.2,polygonOffsetUnits:2}),this.cascades=[0,1].map(e=>{let t=new aa(o_,o_,h);t.compareFunction=515,t.minFilter=t.magFilter=s;let n=new Zt(o_,o_,{depthTexture:t,depthBuffer:!0,generateMipmaps:!1}),r=new hs(-1,1,1,-1,10,s_);return r.layers.set(1),{rt:n,cam:r,key:``,i:e}}),gd.uShadow0.value=this.cascades[0].rt.depthTexture,gd.uShadow1.value=this.cascades[1].rt.depthTexture,this.basis=new Y().lookAt(fd.clone(),new J,new J(0,1,0)),this.right=new J().setFromMatrixColumn(this.basis,0),this.up=new J().setFromMatrixColumn(this.basis,1),this.dirty=!0,this.renders=0,this._bias=new Y().set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1),this._look=new J,this._f=new J,gd.uShadowInfo.value.z=1}markDirty(){this.dirty=!0}update(e){let t=e.getWorldDirection(this._look),n=Math.max(0,e.position.y),r=Math.min(1100,Math.max(130,130+n*.95));r=130*1.25**Math.round(Math.log(r/130)/Math.log(1.25));let i=Math.min(3600,r*4.2),a=[r,i];for(let n of this.cascades){let r=a[n.i],i=this._f.copy(e.position);if(n.i===0){let n=r*.72;t.y<-.02&&(n=Math.min(n,e.position.y/-t.y)),i.addScaledVector(t,n),i.y<0&&(i.y=0)}else{let e=Math.hypot(t.x,t.z)||1;i.x+=t.x/e*r*.55,i.z+=t.z/e*r*.55,i.y=0}let o=r/5,s=Math.round(i.dot(this.right)/o)*o,c=Math.round(i.dot(this.up)/o)*o,l=n.i===0?Math.round(i.dot(fd)/200)*200:0,u=`${r.toFixed(1)}|${s.toFixed(1)}|${c.toFixed(1)}|${l}`;if(u===n.key&&!this.dirty)continue;n.key=u;let d=r+o*.75,f=new J().addScaledVector(this.right,s).addScaledVector(this.up,c).addScaledVector(fd,l),p=n.cam;p.left=-d,p.right=d,p.top=d,p.bottom=-d,p.position.copy(f).addScaledVector(fd,s_*.5),p.up.set(0,1,0),p.lookAt(f),p.updateProjectionMatrix(),p.updateMatrixWorld(!0),this._render(n),(n.i===0?gd.uShadowMat0.value:gd.uShadowMat1.value).copy(this._bias).multiply(p.projectionMatrix).multiply(p.matrixWorldInverse);let m=2*d/o_;n.i===0?gd.uShadowInfo.value.x=m:gd.uShadowInfo.value.y=m}this.dirty=!1}_render(e){let{renderer:t,scene:n}=this,r=t.getRenderTarget(),i=n.overrideMaterial,a=n.background;n.overrideMaterial=this.depthMat,n.background=null,t.setRenderTarget(e.rt),t.clear(),t.render(n,e.cam),t.setRenderTarget(r),n.overrideMaterial=i,n.background=a,this.renders++}},u_=-78;function d_(e){let t=e.L/2,n=e=>52+29*Math.min(1,Math.max(0,(Math.abs(e)/t-.35)/.65))**1.25,r=(e,t)=>(t-u_)/(n(e)-u_)*2-1,i=(e,n)=>{let i=e/t,a=r(e,n);return 43+30*Math.abs(i)**1.9+7*Math.abs(i)**7+3.5*(1-a*a)+3.5*i*i*a},a=(e,n)=>{let i=e/t,a=r(e,n);return 2.6+2.6*Math.max(0,1-a*a)**.7*(1-.4*i*i)},o=(e,t)=>i(e,t)-a(e,t),s=new Ap,c=[.9,.72,.34],l=[.88,.73,.42],u=[.43,.5,.6],d=[.8,.78,.73],f=[.66,.65,.62],p=[.86,.87,.89],m=[.09,.23,.42],h=[.22,.38,.5],g=[.74,.76,.78],_=(e,r)=>{let i=-t+2*t*e/124;return[i,u_+(n(i)-u_)*r/12]},v=(e,r,a)=>{let o=.6,s=(i(Math.min(t,e+o),r)-i(Math.max(-t,e-o),r))/(2*o),c=n(e),l=Math.max(u_,r-o),u=Math.min(c,r+o),d=(i(e,u)-i(e,l))/Math.max(.001,u-l),f=Math.hypot(s,1,d);return[-s/f*a,1/f*a,-d/f*a]},y={mat:1,col:u,p:[2.06,6,2]},b={mat:1,col:l,p:[4.12,4.2,0],fx:[2,.1]};for(let e=0;e<124;e++)for(let t=0;t<12;t++){let n=[_(e,t),_(e+1,t),_(e+1,t+1),_(e,t+1)];s.quad(...n.map(([e,t])=>[e,i(e,t),t]),y,n,n.map(([e,t])=>v(e,t,1))),s.quad(...n.map(([e,t])=>[e,o(e,t),t]),b,n,n.map(([e,t])=>v(e,t,-1)))}let x=(e,t,n)=>s.quad([e[0],o(...e),e[1]],[t[0],o(...t),t[1]],[t[0],i(...t),t[1]],[e[0],i(...e),e[1]],{mat:1,col:c,p:[4.12,9,2],u0:n,fx:[3,.1]});for(let e=0;e<124;e++)x(_(e,12),_(e+1,12),e*4.12),x(_(e,0),_(e+1,0),e*4.12);for(let e=0;e<12;e++)x(_(0,e),_(0,e+1),e*12),x(_(124,e),_(124,e+1),e*12);let S=[];for(let t of[-1,1]){let n=Math.min(t*64,t*226),r=Math.max(t*64,t*226);s.box(n-2,r+2,-2,6,-70,44,{mat:3,col:d,p:[2.4,1.2]}),s.box(n,r,6,30,-68,42,{mat:2,col:g,col2:m,p:[2,4,0],wrapU:!0},{capO:{mat:3,col:f,p:[3,3]}});for(let e of[6,14,22,30])s.box(n-1.6,r+1.6,e-.25,e+.25,-69.6,43.6,{mat:0,col:[.9,.9,.88]},{bottom:!0});s.box(n+14,r-14,30,35.5,-54,28,{mat:1,col:[.7,.72,.74],p:[3,.5,1]}),S.push(Np(e,Pp(n-2,r+2,-70,44),-2,6,e.name)),S.push(Np(e,Pp(n,r,-68,42),6,30,e.name)),S.push(Np(e,Pp(n+14,r-14,-54,28),30,35.5,e.name))}s.box(-60,60,-2,9,-64,50,{mat:3,col:d,p:[2.4,1.2]},{capO:{mat:3,col:[.74,.72,.68],p:[2.4,2.4]}}),S.push(Np(e,Pp(-60,60,-64,50),-2,9,e.name));for(let t=0;t<9;t++){let n=50+(9-t)*2.4;s.box(-42,42,t,t+1,50,n,{mat:3,col:d,p:[2.4,.5]},{capO:{mat:3,col:[.76,.74,.7],p:[1.2,.6]}}),S.push(Np(e,Pp(-42,42,50,n),t===0?-2:t,t+1,e.name))}let C=o(0,-10)+.3;s.box(-56,56,9,C,-52,30,{mat:2,col:p,col2:h,p:[2,6,3],wrapU:!0},{cap:!1}),S.push(Np(e,Pp(-56,56,-52,30),9,C,e.name)),s.quad([-52,11,30.4],[52,11,30.4],[52,37,30.4],[-52,37,30.4],{mat:2,col:p,col2:h,p:[2,6,3],fx:[4.1,8]},[[-52,11],[52,11],[52,37],[-52,37]]);{let t=[.72,.14,.1],n=[.56,.11,.08];s.fx=[2,.1];let r=Pp(-57,-15,-33,9);s.prism(r,9,78,{mat:2,col:t,col2:[.09,.12,.16],p:[1.75,4.2,4]},{cap:!1}),s.prism(r,78,84,{mat:1,col:t,p:[3.5,6,0]},{capO:{mat:0,col:n}});for(let[e,r]of[[1,1],[1,-1],[-1,1],[-1,-1]]){let i=-36+e*21,a=-12+r*21;s.box(Math.min(i,i-e*4.5)-(e>0?0:.6),Math.max(i,i-e*4.5)+(e>0?.6:0),9,84.5,Math.min(a,a-r*4.5)-(r>0?0:.6),Math.max(a,a-r*4.5)+(r>0?.6:0),{mat:1,col:t,p:[4.5,4.2,0]},{capO:{mat:0,col:n}})}s.box(-58.2,-13.8,77.6,78.2,-34.2,10.2,{mat:0,col:n},{bottom:!0}),s.box(-45,-27,84,88,-21,-3,{mat:1,col:n,p:[3,.6,1]}),S.push(Np(e,Pp(-57.6,-14.4,-33.6,9.6),9,84,e.name))}{let t=[.93,.7,.14],n=[.74,.54,.1],r=(e,t=48)=>Array.from({length:t},(n,r)=>[36+Math.cos(r/t*Math.PI*2)*e,-12+Math.sin(r/t*Math.PI*2)*e]),i=(e,t,n)=>{let i=r(e);for(let e=0;e<48;e+=2)s.quad([36,t,-12],[i[e][0],t,i[e][1]],[i[e+1][0],t,i[e+1][1]],[i[(e+2)%48][0],t,i[(e+2)%48][1]],n)};s.prism(r(22),9,73,{mat:2,col:t,col2:[.1,.13,.16],p:[1.44,4.2,4],wrapU:!0},{cap:!1}),s.prism(r(22),73,78,{mat:1,col:t,p:[2.88,5,2],wrapU:!0},{cap:!1}),i(22,78,{mat:0,col:n});for(let e=25.8;e<70;e+=16.8)s.prism(r(22.6),e-.3,e+.3,{mat:0,col:n,wrapU:!0},{cap:!1}),i(22.6,e+.3,{mat:0,col:n}),i(22.6,e-.3,{mat:0,col:n});s.prism(r(23.4),72.7,73.3,{mat:0,col:n,wrapU:!0},{cap:!1}),i(23.4,73.3,{mat:0,col:n}),i(23.4,72.7,{mat:0,col:n}),s.prism(r(8,24),78,82,{mat:1,col:n,p:[2,.6,1],wrapU:!0},{cap:!1}),S.push(Np(e,r(22.5,24),9,78,e.name))}s.fx=[0,0];let w=(t,r)=>{let i=o(t,r)-13,a=Array.from({length:8},(e,n)=>[t+Math.cos(n/8*Math.PI*2+.39)*1.05,r+Math.sin(n/8*Math.PI*2+.39)*1.05]);s.prism(a,-2,i,{mat:0,col:p},{cap:!1});for(let[e,a]of[[-9,-4.5],[9,-4.5],[9,4.5],[-9,4.5]]){let c=t+e,l=Math.min(n(c)-1,Math.max(-77,r+a));s.strut([t,i-.5,r],[c,o(c,l)+.2,l],.7,{mat:0,col:p})}S.push(Np(e,Pp(t-1,t+1,r-1,r+1),-2,i,e.name))};for(let e of[-1,1])for(let t=0;t<6;t++){let r=e*(40+t*37);Math.abs(r)>70&&w(r,n(r)-5),w(r,-73.5)}let T=$(e.x,e.z),E=new ri(s.build(),Mp());E.position.set(e.x,T,e.z),E.rotation.y=-e.ang,E.renderOrder=5;for(let r=-t;r<t-.1;r+=4.12){let a=Math.min(t,r+4.12),s=(r+a)/2,c=n(s);for(let t=0;t<3;t++){let l=u_+(c-u_)*t/3,u=u_+(c-u_)*(t+1)/3,d=1/0,f=-1/0;for(let e of[r,a])for(let t of[l,(l+u)/2,u])d=Math.min(d,o(e,Math.min(t,n(e)))),f=Math.max(f,i(e,Math.min(t,n(e))));S.push(Np(e,Pp(r,a,l,u),d,(f+i(s,(l+u)/2))/2,e.name))}}for(let e of S)e.bottom+=T,e.top+=T,e.h=84;return{mesh:E,colliders:S}}var f_=[[0,37,5],[22,36.6,5.2],[120,34.6,6],[300,31.6,7.4],[470,28.6,8.8],[520,27.2,9.6],[548,19.5,8.6],[566,9.5,4.4],[574,3.4,1.3]],p_=[98,190,282,374,462],m_=9,h_=599.1;function g_(e){for(let t=1;t<f_.length;t++){let[n,r,i]=f_[t-1],[a,o,s]=f_[t];if(e<=a){let t=(e-n)/(a-n);return[r+(o-r)*t,i+(s-i)*t]}}let t=f_[f_.length-1];return[t[1],t[2]]}function __(e,t=0){let[n,r]=g_(e);n+=t;let i=n-r;return[[-i,n],[i,n],[n,i],[n,-i],[i,-n],[-i,-n],[-n,-i],[-n,i]]}var v_=[[0,1],[1,0],[0,-1],[-1,0]];function y_(e){let t=new Ap;t.fx=[1,30];let n=[.8,.82,.85],r=[.58,.61,.65],i=[.3,.42,.54],a=[.16,.25,.34],o=new Set(f_.map(e=>e[0]));for(let e of p_)o.add(e),o.add(e+m_);let s=[...o].sort((e,t)=>e-t),c=e=>p_.some(t=>e>=t&&e<t+m_);for(let e=0;e<s.length-1;e++){let o=s[e],l=s[e+1],u=__(o),d=__(l);for(let e=0;e<8;e++){let s=u[e],f=u[(e+1)%8],p=d[(e+1)%8],m=d[e],h=Math.hypot(f[0]-s[0],f[1]-s[1]),g=Math.hypot(p[0]-m[0],p[1]-m[1]);Math.hypot(l-o,(h-g)/2);let _,v=e%2==0;_=c(o)?{mat:1,col:r,p:[3,.75,1]}:o<22?{mat:2,col:n,col2:a,p:[3,11,3]}:o>=520?v?{mat:2,col:n,col2:i,p:[1.5,4.5,3]}:{mat:2,col:n,col2:i,p:[1.1,4.5,3]}:v?{mat:2,col:n,col2:i,p:[1.5,4.5,0]}:{mat:2,col:n,col2:i,p:[1.5,4.5,1]},o>=520?_.fx=[3,.9]:(!v||o<22)&&(_.fx=[0,.3]),t.quad([s[0],o,s[1]],[f[0],o,f[1]],[p[0],l,p[1]],[m[0],l,m[1]],_,[[-h/2,o],[h/2,o],[g/2,l],[-g/2,l]])}}for(let e of p_)for(let r of[e,e+m_])t.prism(__(r,.9),r-.3,r+.3,{mat:0,col:n},{bottom:!0,capO:{mat:0,col:n}});let l=[[-1,2.4,1.5,0,574],[1,2.4,1.5,0,574],[-.62,1.1,.85,22,566],[-.22,1.1,.85,22,566],[.22,1.1,.85,22,566],[.62,1.1,.85,22,566]],u={mat:1,col:n,p:[6,4.5,0],fx:[3,.1]};for(let e=0;e<4;e++){let[n,r]=v_[e],i=-r,a=n;for(let[e,o,c,d,f]of l){let l=Math.abs(e)===1?u:{...u,fx:[0,0]},p=s.filter(e=>e>=d&&e<=f).map(t=>{let[s,l]=g_(t),u=s-l,d=Math.min(1,u/13),f=o*d,p=c*d,m=Math.abs(e)===1?e*(u-f/2):e*u,h=n*s+i*m,g=r*s+a*m;return{y:t,l:[h-i*f/2,g-a*f/2],r:[h+i*f/2,g+a*f/2],d:p}});for(let e=0;e<p.length-1;e++){let i=p[e],a=p[e+1],o=(e,t)=>[e[0]+n*t.d,t.y,e[1]+r*t.d],s=(e,t)=>[e[0]-n*.3,t.y,e[1]-r*.3];t.quad(o(i.l,i),o(i.r,i),o(a.r,a),o(a.l,a),l),t.quad(s(i.l,i),o(i.l,i),o(a.l,a),s(a.l,a),l),t.quad(o(i.r,i),s(i.r,i),s(a.r,a),o(a.r,a),l)}}}let d=__(574);t.prism(d,573.2,574.4,{mat:0,col:n},{capO:{mat:0,col:r}});let f=e=>[[-e,e],[e,e],[e,-e],[-e,-e]],p=[[574.4,2.6],[581,1.9],[590,1.2],[h_,.3]];for(let e=0;e<p.length-1;e++){let[r,i]=p[e],[a,o]=p[e+1],s=f(i),c=f(o);for(let e=0;e<4;e++)t.quad([s[e][0],r,s[e][1]],[s[(e+1)%4][0],r,s[(e+1)%4][1]],[c[(e+1)%4][0],a,c[(e+1)%4][1]],[c[e][0],a,c[e][1]],{mat:1,col:n,p:[1.2,2.2,0],fx:[3,.1]})}for(let[e,n]of[[581,2.5],[590,1.7]])t.prism(f(n),e-.35,e+.35,{mat:0,col:r},{bottom:!0});t.prism(f(.5),599,600.5,{mat:0,col:[.9,.2,.15]});for(let[e,r]of[[1,1],[1,-1],[-1,-1],[-1,1]]){let[i,a]=g_(548),o=i-a/2;t.strut([e*o,548,r*o],[e*1.6,586,r*1.6],.9,{mat:0,col:n})}t.box(-41,41,-2,.6,-41,41,{mat:3,col:[.72,.71,.69],p:[2.4,.3]},{capO:{mat:3,col:[.7,.69,.67],p:[1.2,1.2]}});for(let[e,r]of v_){let i=-r,a=e,o=[e*40.4-i*14,r*40.4-a*14],s=[e*40.4+i*14,r*40.4+a*14];t.box(Math.min(o[0],s[0])-Math.abs(e)*3.5,Math.max(o[0],s[0])+Math.abs(e)*3.5,8.2,8.8,Math.min(o[1],s[1])-Math.abs(r)*3.5,Math.max(o[1],s[1])+Math.abs(r)*3.5,{mat:0,col:n},{bottom:!0})}let m=$(e.x,e.z),h=new ri(t.build(),Mp());h.position.set(e.x,m,e.z),h.renderOrder=5;let g={x:e.x,z:e.z,ang:0},_=[Np(g,f(41),m-2,m+.6,`平安金融中心`,h_)],v=[.6,60,120,180,240,300,360,420,470,520,534,548,557,566,574];for(let e=0;e<v.length-1;e++)_.push(Np(g,__(v[e]<520?v[e]:(v[e]+v[e+1])/2,v[e]<520?1.5:.5),m+v[e],m+v[e+1],`平安金融中心`,h_));return _.push(Np(g,f(2.2),m+574,m+h_,`平安金融中心`,h_)),{mesh:h,colliders:_}}function b_(e){let t=new Ap;t.fx=[1.15,12];let n=[.7,.72,.75],r=[.12,.22,.34],i=[.3,.32,.35],a=245.8,o=e.L/2-3,s=e.W/2-3,c={mat:2,col:n,col2:r,p:[3,4,2],wrapU:!0};t.box(-24,24,-2,36,-24,24,{mat:2,col:[.8,.82,.84],col2:[.16,.26,.36],p:[3,12,3],wrapU:!0},{cap:!1});for(let[e,n]of[[1,1],[1,-1],[-1,1],[-1,-1]])t.box(e*27-(e>0?9:0),e*27+(e>0?0:9),-2,36,n*27-(n>0?9:0),n*27+(n>0?0:9),c,{cap:!1});t.box(-o,o,36,60,-s,s,c,{bottom:!0,capO:{mat:3,col:[.62,.64,.62],p:[6,6]}}),t.box(-o+8,o-8,60,60.6,-s+8,s-8,{mat:0,col:[.3,.47,.2]}),t.box(-o-.6,o+.6,35.5,36.5,-s-.6,s+.6,{mat:0,col:i},{bottom:!0}),t.box(-o-.6,o+.6,59.7,61.4,-s-.6,s+.6,{mat:0,col:n}),t.box(-27,27,60,235.8,-27,27,c,{cap:!1}),t.box(-27,27,235.8,a,-27,27,{mat:1,col:n,p:[3,.8,1],wrapU:!0},{capO:{mat:0,col:i}}),t.box(-21,21,a,250.8,-21,21,{mat:1,col:i,p:[3,.8,1],wrapU:!0});let l=$(e.x,e.z),u=new ri(t.build(),Mp());return u.position.set(e.x,l,e.z),u.rotation.y=-e.ang,u.renderOrder=5,{mesh:u,colliders:[Np(e,Pp(-27,27,-27,27),l-2,l+a,e.name,a),Np(e,Pp(-o,o,-s,s),l+36,l+60+1,e.name,a)]}}function x_(e){let t=e.bounds,n=20261119,r=()=>(n=Math.imul(n,1664525)+1013904223>>>0,n/4294967296),i=[],a=5200,o=(t.x0+t.x1)/2,s=(t.z0+t.z1)/2;for(let e=0;e<9e3;e++){let e=o+(r()-.5)*(t.x1-t.x0+2*a),n=s+(r()-.5)*(t.z1-t.z0+2*a),c=Math.max(t.x0-e,0,e-t.x1),l=Math.max(t.z0-n,0,n-t.z1);if(Math.hypot(c,l)<300)continue;let u=Math.sin(e*.0011+1.7)*Math.cos(n*.0013-.6)+Math.sin((e+n)*7e-4)*.6;if(u<-.35&&r()<.85||n<t.z0&&r()<.45)continue;let d=u>.5&&r()<.35,f=d?90+r()*170:18+r()*r()*90,p=d?30+r()*20:24+r()*50,m=d?30+r()*20:16+r()*30,h=r(),g=h<.35?[.8,.77,.7]:h<.6?[.62,.66,.72]:h<.8?[.36,.5,.66]:[.72,.72,.72];i.push({x:e,z:n,h:f,w:p,dp:m,yaw:r()<.7?0:r()*3.14,col:g})}let c=new ca(1,1,1);c.translate(0,.5,0);let l=new ki(c,xd({color:16777215}),i.length),u=new Y,d=new At,f=new J(0,1,0),p=new X;return i.forEach((e,t)=>{d.setFromAxisAngle(f,e.yaw),u.compose(new J(e.x,0,e.z),d,new J(e.w,e.h,e.dp)),l.setMatrixAt(t,u),p.setRGB(e.col[0],e.col[1],e.col[2],Le),l.setColorAt(t,p)}),l.frustumCulled=!1,l.userData.count=i.length,l}var S_=1.7,C_=24,w_=class{constructor(e,t,n,r){this.camera=e,this.dom=t,this.grid=n,this.bounds=r,this.pos=new J,this.vel=new J,this.yaw=0,this.pitch=0,this.mode=`fly`,this.noclip=!1,this.keys=new Set,this.onGround=!1,this.locked=!1,this.onModeChange=()=>{},this.camYawOff=0,t.addEventListener(`click`,()=>{this.locked||t.requestPointerLock?.()}),document.addEventListener(`pointerlockchange`,()=>{this.locked=document.pointerLockElement===t}),document.addEventListener(`mousemove`,e=>{(this.locked||e.buttons&1&&e.target===t)&&(this.yaw-=e.movementX*.0022,this.pitch-=e.movementY*.0022,this.pitch=Math.max(-1.55,Math.min(1.55,this.pitch)))}),window.addEventListener(`keydown`,e=>{if(!this.blockInput&&((e.code===`Space`||e.code.startsWith(`Arrow`))&&e.preventDefault(),e.ctrlKey&&e.code!==`ControlLeft`&&e.code!==`ControlRight`&&e.preventDefault(),!e.repeat)){if(this.keys.add(e.code),e.code===`KeyV`){if(this.astroV&&this.astroV())return;this.toggleMode()}e.code===`KeyN`&&(this.noclip=!this.noclip,this.onModeChange()),e.code===`Space`&&this.mode===`walk`&&this.onGround&&!(this.astroBusy&&this.astroBusy())&&(this.vel.y=7.5,this.onGround=!1)}}),window.addEventListener(`keyup`,e=>this.keys.delete(e.code)),window.addEventListener(`blur`,()=>this.keys.clear())}setView(e,t){this.pos.copy(e);let n=t.clone().sub(e);this.yaw=Math.atan2(-n.x,-n.z),this.pitch=Math.atan2(n.y,Math.hypot(n.x,n.z))}toggleMode(){if(this.mode===`fly`){this.mode=`walk`,this.pos.y-=S_,this.vel.set(0,0,0);let e=rm(this.grid,this.pos.x,this.pos.z,1/0);nm(this.grid,this.pos.x,this.pos.z,this.pos.y,this.pos.y+S_)&&(this.pos.y=e),this.onGround=!1}else this.mode=`fly`,this.pos.y+=S_,this.vel.set(0,0,0);this.onModeChange()}update(e){if(this.camYawOff=0,this.drive&&this.drive(e,this)){this.camera.position.copy(this.pos),this.camera.rotation.set(this.pitch,this.yaw+this.camYawOff,0,`YXZ`);return}let t=this.keys,n=new J(-Math.sin(this.yaw),0,-Math.cos(this.yaw)),r=new J(-n.z,0,n.x),i=new J;(t.has(`KeyW`)||t.has(`ArrowUp`))&&i.add(n),(t.has(`KeyS`)||t.has(`ArrowDown`))&&i.sub(n),(t.has(`KeyD`)||t.has(`ArrowRight`))&&i.add(r),(t.has(`KeyA`)||t.has(`ArrowLeft`))&&i.sub(r),i.lengthSq()>0&&i.normalize();let a=t.has(`ShiftLeft`)||t.has(`ShiftRight`);if(this.mode===`fly`){let n=(40+Math.max(0,this.pos.y-$(this.pos.x,this.pos.z))*.35)*(a?4:1),i=0;(t.has(`Space`)||t.has(`KeyE`))&&(i+=1),(t.has(`ControlLeft`)||t.has(`ControlRight`)||t.has(`KeyQ`))&&--i;let o=new J(-Math.sin(this.yaw)*Math.cos(this.pitch),Math.sin(this.pitch),-Math.cos(this.yaw)*Math.cos(this.pitch)),s=new J,c=(t.has(`KeyW`)||t.has(`ArrowUp`)?1:0)-(t.has(`KeyS`)||t.has(`ArrowDown`)?1:0),l=(t.has(`KeyD`)||t.has(`ArrowRight`)?1:0)-(t.has(`KeyA`)||t.has(`ArrowLeft`)?1:0);s.addScaledVector(o,c).addScaledVector(r,l),s.y+=i,s.lengthSq()>1&&s.normalize(),s.multiplyScalar(n),this.vel.lerp(s,1-Math.exp(-e*6)),this.moveFly(this.vel.clone().multiplyScalar(e))}else{let t=a?11:5,n=1-Math.exp(-e*(this.onGround?14:3));this.vel.x+=(i.x*t-this.vel.x)*n,this.vel.z+=(i.z*t-this.vel.z)*n,this.vel.y-=C_*e,this.moveWalk(e)}this.clampWorld();let o=this.mode===`walk`?S_:0;this.camera.position.set(this.pos.x,this.pos.y+o,this.pos.z),this.camera.rotation.set(this.pitch,this.yaw,0,`YXZ`)}moveFly(e){let t=Math.max(1,Math.ceil(e.length()/2)),n=e.clone().divideScalar(t);for(let e=0;e<t;e++){let e=this.pos.x+n.x,t=this.pos.z+n.z,r=this.pos.y+n.y;if(this.noclip)this.pos.set(e,r,t);else{let n=r-1,i=r+.5;nm(this.grid,e,t,n,i,0)?nm(this.grid,e,this.pos.z,n,i,0)?nm(this.grid,this.pos.x,t,n,i,0)?nm(this.grid,this.pos.x,this.pos.z,n,i,0)?this.vel.multiplyScalar(.3):this.pos.y=r:this.pos.set(this.pos.x,r,t):this.pos.set(e,r,this.pos.z):this.pos.set(e,r,t)}let i=this.noclip?$(this.pos.x,this.pos.z):rm(this.grid,this.pos.x,this.pos.z,this.pos.y-1,.2);this.pos.y<i+1.2&&(this.pos.y=i+1.2,this.vel.y<0&&(this.vel.y=0))}this.pos.y>3e3&&(this.pos.y=3e3)}moveWalk(e){let t=this.vel.x*e,n=this.vel.z*e,r=Math.max(1,Math.ceil(Math.hypot(t,n)/.3));for(let e=0;e<r;e++){let e=t/r,i=n/r,a=this.pos.y,o=a+S_+.1;nm(this.grid,this.pos.x+e,this.pos.z,a,o)?this.vel.x=0:this.pos.x+=e,nm(this.grid,this.pos.x,this.pos.z+i,a,o)?this.vel.z=0:this.pos.z+=i;let s=rm(this.grid,this.pos.x,this.pos.z,this.pos.y);this.onGround&&s>this.pos.y&&s-this.pos.y<=.6&&(this.pos.y=s)}this.pos.y+=this.vel.y*e;let i=rm(this.grid,this.pos.x,this.pos.z,this.pos.y-this.vel.y*e);this.pos.y<=i?(this.pos.y=i,this.vel.y=0,this.onGround=!0):this.onGround&&this.pos.y-i<.5&&this.vel.y<=0?(this.pos.y=i,this.vel.y=0):this.onGround=!1,this.pos.y<-50&&(this.pos.y=$(this.pos.x,this.pos.z)+2,this.vel.y=0)}clampWorld(){let e=this.bounds;this.pos.x=Math.max(e.x0-600,Math.min(e.x1+600,this.pos.x)),this.pos.z=Math.max(e.z0-600,Math.min(e.z1+600,this.pos.z))}},T_=(function(){var e=`b9H79Tebbbe8Fv9Gbb9Gvuuuuueu9Giuuub9Geueu9Giuuueuixkbeeeddddillviebeoweuecj:Gdkr;Neqo9TW9T9VV95dbH9F9F939H79T9F9J9H229F9Jt9VV7bb8A9TW79O9V9Wt9F9KW9J9V9KW9wWVtW949c919M9MWVbeY9TW79O9V9Wt9F9KW9J9V9KW69U9KW949c919M9MWVbdE9TW79O9V9Wt9F9KW9J9V9KW69U9KW949tWG91W9U9JWbiL9TW79O9V9Wt9F9KW9J9V9KWS9P2tWV9p9JtblK9TW79O9V9Wt9F9KW9J9V9KWS9P2tWV9r919HtbvL9TW79O9V9Wt9F9KW9J9V9KWS9P2tWVT949WboY9TW79O9V9Wt9F9KW9J9V9KWS9P2tWVJ9V29VVbrl79IV9Rbwq:VZkdbk:XYi5ud9:du8Jjjjjbcj;kb9Rgv8Kjjjjbc9:hodnalTmbcuhoaiRbbgrc;WeGc:Ge9hmbarcsGgwce0mbc9:hoalcufadcd4cbawEgDadfgrcKcaawEgqaraq0Egk6mbaicefhxcj;abad9Uc;WFbGcjdadca0EhmaialfgPar9Rgoadfhsavaoadz:jjjjbgzceVhHcbhOdndninaeaO9nmeaPax9RaD6mdamaeaO9RaOamfgoae6EgAcsfglc9WGhCabaOad2fhXaAcethQaxaDfhiaOaeaoaeao6E9RhLalcl4cifcd4hKazcj;cbfaAfhYcbh8AazcjdfhEaHh3incbh5dnawTmbaxa8Acd4fRbbh5kcbh8Eazcj;cbfhqinaih8Fdndndndna5a8Ecet4ciGgoc9:fPdebdkaPa8F9RaA6mrazcj;cbfa8EaA2fa8FaAz:jjjjb8Aa8FaAfhixdkazcj;cbfa8EaA2fcbaAz:kjjjb8Aa8FhixekaPa8F9RaK6mva8FaKfhidnaCTmbaPai9RcK6mbaocdtc:q:G:cjbfcj:G:cjbawEhaczhrcbhlinargoc9Wfghaqfhrdndndndndndnaaa8Fahco4fRbbalcoG4ciGcdtfydbPDbedvivvvlvkar9cb83bwar9cb83bbxlkarcbaiRbdai8Xbb9c:c:qj:bw9:9c:q;c1:I1e:d9c:b:c:e1z9:gg9cjjjjjz:dg8J9qE86bbaqaofgrcGfcbaicdfa8J9c8N1:NfghRbbag9cjjjjjw:dg8J9qE86bbarcVfcbaha8J9c8M1:NfghRbbag9cjjjjjl:dg8J9qE86bbarc7fcbaha8J9c8L1:NfghRbbag9cjjjjjd:dg8J9qE86bbarctfcbaha8J9c8K1:NfghRbbag9cjjjjje:dg8J9qE86bbarc91fcbaha8J9c8J1:NfghRbbag9cjjjj;ab:dg8J9qE86bbarc4fcbaha8J9cg1:NfghRbbag9cjjjja:dg8J9qE86bbarc93fcbaha8J9ch1:NfghRbbag9cjjjjz:dgg9qE86bbarc94fcbahag9ca1:NfghRbbai8Xbe9c:c:qj:bw9:9c:q;c1:I1e:d9c:b:c:e1z9:gg9cjjjjjz:dg8J9qE86bbarc95fcbaha8J9c8N1:NfgiRbbag9cjjjjjw:dg8J9qE86bbarc96fcbaia8J9c8M1:NfgiRbbag9cjjjjjl:dg8J9qE86bbarc97fcbaia8J9c8L1:NfgiRbbag9cjjjjjd:dg8J9qE86bbarc98fcbaia8J9c8K1:NfgiRbbag9cjjjjje:dg8J9qE86bbarc99fcbaia8J9c8J1:NfgiRbbag9cjjjj;ab:dg8J9qE86bbarc9:fcbaia8J9cg1:NfgiRbbag9cjjjja:dg8J9qE86bbarcufcbaia8J9ch1:NfgiRbbag9cjjjjz:dgg9qE86bbaiag9ca1:NfhixikaraiRblaiRbbghco4g8Ka8KciSg8KE86bbaqaofgrcGfaiclfa8Kfg8KRbbahcl4ciGg8La8LciSg8LE86bbarcVfa8Ka8Lfg8KRbbahcd4ciGg8La8LciSg8LE86bbarc7fa8Ka8Lfg8KRbbahciGghahciSghE86bbarctfa8Kahfg8KRbbaiRbeghco4g8La8LciSg8LE86bbarc91fa8Ka8Lfg8KRbbahcl4ciGg8La8LciSg8LE86bbarc4fa8Ka8Lfg8KRbbahcd4ciGg8La8LciSg8LE86bbarc93fa8Ka8Lfg8KRbbahciGghahciSghE86bbarc94fa8Kahfg8KRbbaiRbdghco4g8La8LciSg8LE86bbarc95fa8Ka8Lfg8KRbbahcl4ciGg8La8LciSg8LE86bbarc96fa8Ka8Lfg8KRbbahcd4ciGg8La8LciSg8LE86bbarc97fa8Ka8Lfg8KRbbahciGghahciSghE86bbarc98fa8KahfghRbbaiRbigico4g8Ka8KciSg8KE86bbarc99faha8KfghRbbaicl4ciGg8Ka8KciSg8KE86bbarc9:faha8KfghRbbaicd4ciGg8Ka8KciSg8KE86bbarcufaha8KfgrRbbaiciGgiaiciSgiE86bbaraifhixdkaraiRbwaiRbbghcl4g8Ka8KcsSg8KE86bbaqaofgrcGfaicwfa8Kfg8KRbbahcsGghahcsSghE86bbarcVfa8KahfghRbbaiRbeg8Kcl4g8La8LcsSg8LE86bbarc7faha8LfghRbba8KcsGg8Ka8KcsSg8KE86bbarctfaha8KfghRbbaiRbdg8Kcl4g8La8LcsSg8LE86bbarc91faha8LfghRbba8KcsGg8Ka8KcsSg8KE86bbarc4faha8KfghRbbaiRbig8Kcl4g8La8LcsSg8LE86bbarc93faha8LfghRbba8KcsGg8Ka8KcsSg8KE86bbarc94faha8KfghRbbaiRblg8Kcl4g8La8LcsSg8LE86bbarc95faha8LfghRbba8KcsGg8Ka8KcsSg8KE86bbarc96faha8KfghRbbaiRbvg8Kcl4g8La8LcsSg8LE86bbarc97faha8LfghRbba8KcsGg8Ka8KcsSg8KE86bbarc98faha8KfghRbbaiRbog8Kcl4g8La8LcsSg8LE86bbarc99faha8LfghRbba8KcsGg8Ka8KcsSg8KE86bbarc9:faha8KfghRbbaiRbrgicl4g8Ka8KcsSg8KE86bbarcufaha8KfgrRbbaicsGgiaicsSgiE86bbaraifhixekarai8Pbw83bwarai8Pbb83bbaiczfhikdnaoaC9pmbalcdfhlaoczfhraPai9RcL0mekkaoaC6moaimexokaCmva8FTmvkaqaAfhqa8Ecefg8Ecl9hmbkdndndndnawTmbasa8Acd4fRbbgociGPlbedrbkaATmdaza8Afh8Fazcj;cbfhhcbh8EaEhaina8FRbbhraahocbhlinaoahalfRbbgqce4cbaqceG9R7arfgr86bbaoadfhoaAalcefgl9hmbkaacefhaa8Fcefh8FahaAfhha8Ecefg8Ecl9hmbxikkaATmeaza8Afhaazcj;cbfhhcbhoceh8EaYh8FinaEaofhlaa8Vbbhrcbhoinala8FaofRbbcwtahaofRbbgqVc;:FiGce4cbaqceG9R7arfgr87bbaladfhlaLaocefgofmbka8FaQfh8FcdhoaacdfhaahaQfhha8EceGhlcbh8EalmbxdkkaATmbaocl4h8Eaza8AfRbbhqcwhoa3hlinalRbbaotaqVhqalcefhlaocwfgoca9hmbkcbhhaEh8FaYhainazcj;cbfahfRbbhrcwhoaahlinalRbbaotarVhralaAfhlaocwfgoca9hmbkara8E94aq7hqcbhoa8Fhlinalaqao486bbalcefhlaocwfgoca9hmbka8Fadfh8FaacefhaahcefghaA9hmbkkaEclfhEa3clfh3a8Aclfg8Aad6mbkaXazcjdfaAad2z:jjjjb8AazazcjdfaAcufad2fadz:jjjjb8AaAaOfhOaihxaimbkc9:hoxdkcbc99aPax9RakSEhoxekc9:hokavcj;kbf8Kjjjjbaok:ysezu8Jjjjjbc;ae9Rgv8Kjjjjbc9:hodnalaeci9UgrcHf6mbcuhoaiRbbgwc;WeGc;Ge9hmbawcsGgDce0mbavc;abfcFecjez:kjjjb8Aav9cu83iUav9cu83i8Wav9cu83iyav9cu83iaav9cu83iKav9cu83izav9cu83iwav9cu83ibaialfc9WfhqaicefgwarfhldnaeTmbcmcsaDceSEhkcbhxcbhmcbhrcbhicbhoindnalaq9nmbc9:hoxikdndnawRbbgDc;Ve0mbavc;abfaoaDcu7gPcl4fcsGcitfgsydlhzasydbhHdndnaDcsGgsak9pmbavaiaPfcsGcdtfydbaxasEhDaxasTgOfhxxekdndnascsSmbcehOasc987asamffcefhDxekalcefhDal8SbbgscFeGhPdndnascu9mmbaDhlxekalcvfhlaPcFbGhPcrhsdninaD8SbbgOcFbGastaPVhPaOcu9kmeaDcefhDascrfgsc8J9hmbxdkkaDcefhlkcehOaPce4cbaPceG9R7amfhDkaDhmkavc;abfaocitfgsaDBdbasazBdlavaicdtfaDBdbavc;abfaocefcsGcitfgsaHBdbasaDBdlaocdfhoaOaifhidnadcd9hmbabarcetfgsaH87ebasclfaD87ebascdfaz87ebxdkabarcdtfgsaHBdbascwfaDBdbasclfazBdbxekdnaDcpe0mbavaiaqaDcsGfRbbgscl4gP9RcsGcdtfydbaxcefgOaPEhDavaias9RcsGcdtfydbaOaPTgzfgOascsGgPEhsaPThPdndnadcd9hmbabarcetfgHax87ebaHclfas87ebaHcdfaD87ebxekabarcdtfgHaxBdbaHcwfasBdbaHclfaDBdbkavaicdtfaxBdbavc;abfaocitfgHaDBdbaHaxBdlavaicefgicsGcdtfaDBdbavc;abfaocefcsGcitfgHasBdbaHaDBdlavaiazfgicsGcdtfasBdbavc;abfaocdfcsGcitfgDaxBdbaDasBdlaocifhoaiaPfhiaOaPfhxxekaxcbalRbbgsEgHaDc;:eSgDfhOascsGhAdndnascl4gCmbaOcefhzxekaOhzavaiaC9RcsGcdtfydbhOkdndnaAmbazcefhxxekazhxavaias9RcsGcdtfydbhzkdndnaDTmbalcefhDxekalcdfhDal8SbegPcFeGhsdnaPcu9kmbalcofhHascFbGhscrhldninaD8SbbgPcFbGaltasVhsaPcu9kmeaDcefhDalcrfglc8J9hmbkaHhDxekaDcefhDkasce4cbasceG9R7amfgmhHkdndnaCcsSmbaDhsxekaDcefhsaD8SbbglcFeGhPdnalcu9kmbaDcvfhOaPcFbGhPcrhldninas8SbbgDcFbGaltaPVhPaDcu9kmeascefhsalcrfglc8J9hmbkaOhsxekascefhskaPce4cbaPceG9R7amfgmhOkdndnaAcsSmbashlxekascefhlas8SbbgDcFeGhPdnaDcu9kmbascvfhzaPcFbGhPcrhDdninal8SbbgscFbGaDtaPVhPascu9kmealcefhlaDcrfgDc8J9hmbkazhlxekalcefhlkaPce4cbaPceG9R7amfgmhzkdndnadcd9hmbabarcetfgDaH87ebaDclfaz87ebaDcdfaO87ebxekabarcdtfgDaHBdbaDcwfazBdbaDclfaOBdbkavc;abfaocitfgDaOBdbaDaHBdlavaicdtfaHBdbavc;abfaocefcsGcitfgDazBdbaDaOBdlavaicefgicsGcdtfaOBdbavc;abfaocdfcsGcitfgDaHBdbaDazBdlavaiaCTaCcsSVfgicsGcdtfazBdbaiaATaAcsSVfhiaocifhokawcefhwaocsGhoaicsGhiarcifgrae6mbkkcbc99alaqSEhokavc;aef8Kjjjjbaok:clevu8Jjjjjbcz9Rhvdnalaecvf9pmbc9:skdnaiRbbc;:eGc;qeSmbcuskav9cb83iwaicefhoaialfc98fhrdnaeTmbdnadcdSmbcbhwindnaoar6mbc9:skaocefhlao8SbbgicFeGhddndnaicu9mmbalhoxekaocvfhoadcFbGhdcrhidninal8SbbgDcFbGaitadVhdaDcu9kmealcefhlaicrfgic8J9hmbxdkkalcefhokabawcdtfadc8Etc8F91adcd47avcwfadceGcdtVglydbfgiBdbalaiBdbawcefgwae9hmbxdkkcbhwindnaoar6mbc9:skaocefhlao8SbbgicFeGhddndnaicu9mmbalhoxekaocvfhoadcFbGhdcrhidninal8SbbgDcFbGaitadVhdaDcu9kmealcefhlaicrfgic8J9hmbxdkkalcefhokabawcetfadc8Etc8F91adcd47avcwfadceGcdtVglydbfgi87ebalaiBdbawcefgwae9hmbkkcbc99aoarSEk:Lvoeue99dud99eud99dndnadcl9hmbaeTmeindndnabcdfgd8Sbb:Yab8Sbbgi:Ygl:l:tabcefgv8Sbbgo:Ygr:l:tgwJbb;:9cawawNJbbbbawawJbbbb9GgDEgq:mgkaqaicb9iEalMgwawNakaqaocb9iEarMgqaqNMM:r:vglNJbbbZJbbb:;aDEMgr:lJbbb9p9DTmbar:Ohixekcjjjj94hikadai86bbdndnaqalNJbbbZJbbb:;aqJbbbb9GEMgq:lJbbb9p9DTmbaq:Ohdxekcjjjj94hdkavad86bbdndnawalNJbbbZJbbb:;awJbbbb9GEMgw:lJbbb9p9DTmbaw:Ohdxekcjjjj94hdkabad86bbabclfhbaecufgembxdkkaeTmbindndnabclfgd8Ueb:Yab8Uebgi:Ygl:l:tabcdfgv8Uebgo:Ygr:l:tgwJb;:FSawawNJbbbbawawJbbbb9GgDEgq:mgkaqaicb9iEalMgwawNakaqaocb9iEarMgqaqNMM:r:vglNJbbbZJbbb:;aDEMgr:lJbbb9p9DTmbar:Ohixekcjjjj94hikadai87ebdndnaqalNJbbbZJbbb:;aqJbbbb9GEMgq:lJbbb9p9DTmbaq:Ohdxekcjjjj94hdkavad87ebdndnawalNJbbbZJbbb:;awJbbbb9GEMgw:lJbbb9p9DTmbaw:Ohdxekcjjjj94hdkabad87ebabcwfhbaecufgembkkk:4ioiue99dud99dud99dnaeTmbcbhiabhlindndnal8Uebgv:YgoJ:ji:1Salcof8UebgrciVgw:Y:vgDNJbbbZJbbb:;avcu9kEMgq:lJbbb9p9DTmbaq:Ohkxekcjjjj94hkkalclf8Uebhvalcdf8UebhxalarcefciGcetfak87ebdndnax:YgqaDNJbbbZJbbb:;axcu9kEMgm:lJbbb9p9DTmbam:Ohxxekcjjjj94hxkabaiarciGgkfcd7cetfax87ebdndnav:YgmaDNJbbbZJbbb:;avcu9kEMgP:lJbbb9p9DTmbaP:Ohvxekcjjjj94hvkalarcufciGcetfav87ebdndnawaw2:ZgPaPMaoaoN:taqaqN:tamamN:tgoJbbbbaoJbbbb9GE:raDNJbbbZMgD:lJbbb9p9DTmbaD:Ohrxekcjjjj94hrkalakcetfar87ebalcwfhlaiclfhiaecufgembkkk9mbdnadcd4ae2gdTmbinababydbgecwtcw91:Yaece91cjjj98Gcjjj;8if::NUdbabclfhbadcufgdmbkkk:Tvirud99eudndnadcl9hmbaeTmeindndnabRbbgiabcefgl8Sbbgvabcdfgo8Sbbgrf9R:YJbbuJabcifgwRbbgdce4adVgDcd4aDVgDcl4aDVgD:Z:vgqNJbbbZMgk:lJbbb9p9DTmbak:Ohxxekcjjjj94hxkaoax86bbdndnaraif:YaqNJbbbZMgk:lJbbb9p9DTmbak:Ohoxekcjjjj94hokalao86bbdndnavaifar9R:YaqNJbbbZMgk:lJbbb9p9DTmbak:Ohixekcjjjj94hikabai86bbdndnaDadcetGadceGV:ZaqNJbbbZMgq:lJbbb9p9DTmbaq:Ohdxekcjjjj94hdkawad86bbabclfhbaecufgembxdkkaeTmbindndnab8Vebgiabcdfgl8Uebgvabclfgo8Uebgrf9R:YJbFu9habcofgw8Vebgdce4adVgDcd4aDVgDcl4aDVgDcw4aDVgD:Z:vgqNJbbbZMgk:lJbbb9p9DTmbak:Ohxxekcjjjj94hxkaoax87ebdndnaraif:YaqNJbbbZMgk:lJbbb9p9DTmbak:Ohoxekcjjjj94hokalao87ebdndnavaifar9R:YaqNJbbbZMgk:lJbbb9p9DTmbak:Ohixekcjjjj94hikabai87ebdndnaDadcetGadceGV:ZaqNJbbbZMgq:lJbbb9p9DTmbaq:Ohdxekcjjjj94hdkawad87ebabcwfhbaecufgembkkk9teiucbcbyd:K:G:cjbgeabcifc98GfgbBd:K:G:cjbdndnabZbcztgd9nmbcuhiabad9RcFFifcz4nbcuSmekaehikaik;LeeeudndnaeabVciGTmbabhixekdndnadcz9pmbabhixekabhiinaiaeydbBdbaiclfaeclfydbBdbaicwfaecwfydbBdbaicxfaecxfydbBdbaeczfheaiczfhiadc9Wfgdcs0mbkkadcl6mbinaiaeydbBdbaeclfheaiclfhiadc98fgdci0mbkkdnadTmbinaiaeRbb86bbaicefhiaecefheadcufgdmbkkabk;aeedudndnabciGTmbabhixekaecFeGc:b:c:ew2hldndnadcz9pmbabhixekabhiinaialBdbaicxfalBdbaicwfalBdbaiclfalBdbaiczfhiadc9Wfgdcs0mbkkadcl6mbinaialBdbaiclfhiadc98fgdci0mbkkdnadTmbinaiae86bbaicefhiadcufgdmbkkabkk83dbcj:Gdk8Kbbbbdbbblbbbwbbbbbbbebbbdbbblbbbwbbbbc:K:Gdkl8W:qbb`,t=`b9H79TebbbeKl9Gbb9Gvuuuuueu9Giuuub9Geueuixkbbebeeddddilve9Weeeviebeoweuecj:Gdkr;Neqo9TW9T9VV95dbH9F9F939H79T9F9J9H229F9Jt9VV7bb8A9TW79O9V9Wt9F9KW9J9V9KW9wWVtW949c919M9MWVbdY9TW79O9V9Wt9F9KW9J9V9KW69U9KW949c919M9MWVblE9TW79O9V9Wt9F9KW9J9V9KW69U9KW949tWG91W9U9JWbvL9TW79O9V9Wt9F9KW9J9V9KWS9P2tWV9p9JtboK9TW79O9V9Wt9F9KW9J9V9KWS9P2tWV9r919HtbrL9TW79O9V9Wt9F9KW9J9V9KWS9P2tWVT949WbwY9TW79O9V9Wt9F9KW9J9V9KWS9P2tWVJ9V29VVbDl79IV9Rbqq:W9Dklbzik94evu8Jjjjjbcz9Rhbcbheincbhdcbhiinabcwfadfaicjuaead4ceGglE86bbaialfhiadcefgdcw9hmbkaeai86b:q:W:cjbaecitab8Piw83i:q:G:cjbaecefgecjd9hmbkk:JBl8Aud97dur978Jjjjjbcj;kb9Rgv8Kjjjjbc9:hodnalTmbcuhoaiRbbgrc;WeGc:Ge9hmbarcsGgwce0mbc9:hoalcufadcd4cbawEgDadfgrcKcaawEgqaraq0Egk6mbaialfgxar9RhodnadTgmmbavaoad;8qbbkaicefhPcj;abad9Uc;WFbGcjdadca0EhsdndndnadTmbaoadfhzcbhHinaeaH9nmdaxaP9RaD6miabaHad2fhOaPaDfhAasaeaH9RaHasfae6EgCcsfgocl4cifcd4hXavcj;cbfaoc9WGgQcetfhLavcj;cbfaQci2fhKavcj;cbfaQfhYcbh8Aaoc;ab6hEincbh3dnawTmbaPa8Acd4fRbbh3kcbh5avcj;cbfh8Eindndndndna3a5cet4ciGgoc9:fPdebdkaxaA9RaQ6mwdnaQTmbavcj;cbfa5aQ2faAaQ;8qbbkaAaCfhAxdkaQTmeavcj;cbfa5aQ2fcbaQ;8kbxekaxaA9RaX6moaoclVcbawEhraAaXfhocbhidnaEmbaxao9Rc;Gb6mbcbhlina8EalfhidndndndndndnaAalco4fRbbgqciGarfPDbedibledibkaipxbbbbbbbbbbbbbbbbpklbxlkaiaopbblaopbbbg8Fclp:mea8FpmbzeHdOiAlCvXoQrLg8Fcdp:mea8FpmbzeHdOiAlCvXoQrLpxiiiiiiiiiiiiiiiip9ogapxiiiiiiiiiiiiiiiip8Jg8Fp5b9cjF;8;4;W;G;ab9:9cU1:Nghcitpbi:q:G:cjbahRb:q:W:cjbghpsa8Fp5e9cjF;8;4;W;G;ab9:9cU1:Nggcitpbi:q:G:cjbp9UpmbedilvorzHOACXQLpPaaa8Fp9spklbahaoclffagRb:q:W:cjbfhoxikaiaopbbwaopbbbg8Fclp:mea8FpmbzeHdOiAlCvXoQrLpxssssssssssssssssp9ogapxssssssssssssssssp8Jg8Fp5b9cjF;8;4;W;G;ab9:9cU1:Nghcitpbi:q:G:cjbahRb:q:W:cjbghpsa8Fp5e9cjF;8;4;W;G;ab9:9cU1:Nggcitpbi:q:G:cjbp9UpmbedilvorzHOACXQLpPaaa8Fp9spklbahaocwffagRb:q:W:cjbfhoxdkaiaopbbbpklbaoczfhoxekaiaopbbdaoRbbghcitpbi:q:G:cjbahRb:q:W:cjbghpsaoRbeggcitpbi:q:G:cjbp9UpmbedilvorzHOACXQLpPpklbahaocdffagRb:q:W:cjbfhokdndndndndndnaqcd4ciGarfPDbedibledibkaiczfpxbbbbbbbbbbbbbbbbpklbxlkaiczfaopbblaopbbbg8Fclp:mea8FpmbzeHdOiAlCvXoQrLg8Fcdp:mea8FpmbzeHdOiAlCvXoQrLpxiiiiiiiiiiiiiiiip9ogapxiiiiiiiiiiiiiiiip8Jg8Fp5b9cjF;8;4;W;G;ab9:9cU1:Nghcitpbi:q:G:cjbahRb:q:W:cjbghpsa8Fp5e9cjF;8;4;W;G;ab9:9cU1:Nggcitpbi:q:G:cjbp9UpmbedilvorzHOACXQLpPaaa8Fp9spklbahaoclffagRb:q:W:cjbfhoxikaiczfaopbbwaopbbbg8Fclp:mea8FpmbzeHdOiAlCvXoQrLpxssssssssssssssssp9ogapxssssssssssssssssp8Jg8Fp5b9cjF;8;4;W;G;ab9:9cU1:Nghcitpbi:q:G:cjbahRb:q:W:cjbghpsa8Fp5e9cjF;8;4;W;G;ab9:9cU1:Nggcitpbi:q:G:cjbp9UpmbedilvorzHOACXQLpPaaa8Fp9spklbahaocwffagRb:q:W:cjbfhoxdkaiczfaopbbbpklbaoczfhoxekaiczfaopbbdaoRbbghcitpbi:q:G:cjbahRb:q:W:cjbghpsaoRbeggcitpbi:q:G:cjbp9UpmbedilvorzHOACXQLpPpklbahaocdffagRb:q:W:cjbfhokdndndndndndnaqcl4ciGarfPDbedibledibkaicafpxbbbbbbbbbbbbbbbbpklbxlkaicafaopbblaopbbbg8Fclp:mea8FpmbzeHdOiAlCvXoQrLg8Fcdp:mea8FpmbzeHdOiAlCvXoQrLpxiiiiiiiiiiiiiiiip9ogapxiiiiiiiiiiiiiiiip8Jg8Fp5b9cjF;8;4;W;G;ab9:9cU1:Nghcitpbi:q:G:cjbahRb:q:W:cjbghpsa8Fp5e9cjF;8;4;W;G;ab9:9cU1:Nggcitpbi:q:G:cjbp9UpmbedilvorzHOACXQLpPaaa8Fp9spklbahaoclffagRb:q:W:cjbfhoxikaicafaopbbwaopbbbg8Fclp:mea8FpmbzeHdOiAlCvXoQrLpxssssssssssssssssp9ogapxssssssssssssssssp8Jg8Fp5b9cjF;8;4;W;G;ab9:9cU1:Nghcitpbi:q:G:cjbahRb:q:W:cjbghpsa8Fp5e9cjF;8;4;W;G;ab9:9cU1:Nggcitpbi:q:G:cjbp9UpmbedilvorzHOACXQLpPaaa8Fp9spklbahaocwffagRb:q:W:cjbfhoxdkaicafaopbbbpklbaoczfhoxekaicafaopbbdaoRbbghcitpbi:q:G:cjbahRb:q:W:cjbghpsaoRbeggcitpbi:q:G:cjbp9UpmbedilvorzHOACXQLpPpklbahaocdffagRb:q:W:cjbfhokdndndndndndnaqco4arfPDbedibledibkaic8Wfpxbbbbbbbbbbbbbbbbpklbxlkaic8Wfaopbblaopbbbg8Fclp:mea8FpmbzeHdOiAlCvXoQrLg8Fcdp:mea8FpmbzeHdOiAlCvXoQrLpxiiiiiiiiiiiiiiiip9ogapxiiiiiiiiiiiiiiiip8Jg8Fp5b9cjF;8;4;W;G;ab9:9cU1:Ngicitpbi:q:G:cjbaiRb:q:W:cjbgipsa8Fp5e9cjF;8;4;W;G;ab9:9cU1:Ngqcitpbi:q:G:cjbp9UpmbedilvorzHOACXQLpPaaa8Fp9spklbaiaoclffaqRb:q:W:cjbfhoxikaic8Wfaopbbwaopbbbg8Fclp:mea8FpmbzeHdOiAlCvXoQrLpxssssssssssssssssp9ogapxssssssssssssssssp8Jg8Fp5b9cjF;8;4;W;G;ab9:9cU1:Ngicitpbi:q:G:cjbaiRb:q:W:cjbgipsa8Fp5e9cjF;8;4;W;G;ab9:9cU1:Ngqcitpbi:q:G:cjbp9UpmbedilvorzHOACXQLpPaaa8Fp9spklbaiaocwffaqRb:q:W:cjbfhoxdkaic8Wfaopbbbpklbaoczfhoxekaic8WfaopbbdaoRbbgicitpbi:q:G:cjbaiRb:q:W:cjbgipsaoRbegqcitpbi:q:G:cjbp9UpmbedilvorzHOACXQLpPpklbaiaocdffaqRb:q:W:cjbfhokalc;abfhialcjefaQ0meaihlaxao9Rc;Fb0mbkkdnaiaQ9pmbaici4hlinaxao9RcK6mwa8EaifhqdndndndndndnaAaico4fRbbalcoG4ciGarfPDbedibledibkaqpxbbbbbbbbbbbbbbbbpkbbxlkaqaopbblaopbbbg8Fclp:mea8FpmbzeHdOiAlCvXoQrLg8Fcdp:mea8FpmbzeHdOiAlCvXoQrLpxiiiiiiiiiiiiiiiip9ogapxiiiiiiiiiiiiiiiip8Jg8Fp5b9cjF;8;4;W;G;ab9:9cU1:Nghcitpbi:q:G:cjbahRb:q:W:cjbghpsa8Fp5e9cjF;8;4;W;G;ab9:9cU1:Nggcitpbi:q:G:cjbp9UpmbedilvorzHOACXQLpPaaa8Fp9spkbbahaoclffagRb:q:W:cjbfhoxikaqaopbbwaopbbbg8Fclp:mea8FpmbzeHdOiAlCvXoQrLpxssssssssssssssssp9ogapxssssssssssssssssp8Jg8Fp5b9cjF;8;4;W;G;ab9:9cU1:Nghcitpbi:q:G:cjbahRb:q:W:cjbghpsa8Fp5e9cjF;8;4;W;G;ab9:9cU1:Nggcitpbi:q:G:cjbp9UpmbedilvorzHOACXQLpPaaa8Fp9spkbbahaocwffagRb:q:W:cjbfhoxdkaqaopbbbpkbbaoczfhoxekaqaopbbdaoRbbghcitpbi:q:G:cjbahRb:q:W:cjbghpsaoRbeggcitpbi:q:G:cjbp9UpmbedilvorzHOACXQLpPpkbbahaocdffagRb:q:W:cjbfhokalcdfhlaiczfgiaQ6mbkkaohAaoTmoka8EaQfh8Ea5cefg5cl9hmbkdndndndnawTmbaza8Acd4fRbbglciGPlbedwbkaQTmdavcjdfa8Afhlava8Afpbdbh8Jcbhoinalavcj;cbfaofpblbg8KaYaofpblbg8LpmbzeHdOiAlCvXoQrLg8MaLaofpblbg8NaKaofpblbgypmbzeHdOiAlCvXoQrLg8PpmbezHdiOAlvCXorQLg8Fcep9Ta8Fpxeeeeeeeeeeeeeeeegap9op9Hp9rg8Fa8Jp9Ug8Jp9Abbbaladfgla8Ja8Fa8Fpmlvorlvorlvorlvorp9Ug8Jp9Abbbaladfgla8Ja8Fa8FpmwDqkwDqkwDqkwDqkp9Ug8Jp9Abbbaladfgla8Ja8Fa8FpmxmPsxmPsxmPsxmPsp9Ug8Jp9Abbbaladfgla8Ja8Ma8PpmwDKYqk8AExm35Ps8E8Fg8Fcep9Ta8Faap9op9Hp9rg8Fp9Ug8Jp9Abbbaladfgla8Ja8Fa8Fpmlvorlvorlvorlvorp9Ug8Jp9Abbbaladfgla8Ja8Fa8FpmwDqkwDqkwDqkwDqkp9Ug8Jp9Abbbaladfgla8Ja8Fa8FpmxmPsxmPsxmPsxmPsp9Ug8Jp9Abbbaladfgla8Ja8Ka8LpmwKDYq8AkEx3m5P8Es8Fg8Ka8NaypmwKDYq8AkEx3m5P8Es8Fg8LpmbezHdiOAlvCXorQLg8Fcep9Ta8Faap9op9Hp9rg8Fp9Ug8Jp9Abbbaladfgla8Ja8Fa8Fpmlvorlvorlvorlvorp9Ug8Jp9Abbbaladfgla8Ja8Fa8FpmwDqkwDqkwDqkwDqkp9Ug8Jp9Abbbaladfgla8Ja8Fa8FpmxmPsxmPsxmPsxmPsp9Ug8Jp9Abbbaladfgla8Ja8Ka8LpmwDKYqk8AExm35Ps8E8Fg8Fcep9Ta8Faap9op9Hp9rg8Fp9Ugap9Abbbaladfglaaa8Fa8Fpmlvorlvorlvorlvorp9Ugap9Abbbaladfglaaa8Fa8FpmwDqkwDqkwDqkwDqkp9Ugap9Abbbaladfglaaa8Fa8FpmxmPsxmPsxmPsxmPsp9Ug8Jp9AbbbaladfhlaoczfgoaQ6mbxikkaQTmeavcjdfa8Afhlava8Afpbdbh8Jcbhoinalavcj;cbfaofpblbg8KaYaofpblbg8LpmbzeHdOiAlCvXoQrLg8MaLaofpblbg8NaKaofpblbgypmbzeHdOiAlCvXoQrLg8PpmbezHdiOAlvCXorQLg8Fcep:nea8Fpxebebebebebebebebgap9op:bep9rg8Fa8Jp:oeg8Jp9Abbbaladfgla8Ja8Fa8Fpmlvorlvorlvorlvorp:oeg8Jp9Abbbaladfgla8Ja8Fa8FpmwDqkwDqkwDqkwDqkp:oeg8Jp9Abbbaladfgla8Ja8Fa8FpmxmPsxmPsxmPsxmPsp:oeg8Jp9Abbbaladfgla8Ja8Ma8PpmwDKYqk8AExm35Ps8E8Fg8Fcep:nea8Faap9op:bep9rg8Fp:oeg8Jp9Abbbaladfgla8Ja8Fa8Fpmlvorlvorlvorlvorp:oeg8Jp9Abbbaladfgla8Ja8Fa8FpmwDqkwDqkwDqkwDqkp:oeg8Jp9Abbbaladfgla8Ja8Fa8FpmxmPsxmPsxmPsxmPsp:oeg8Jp9Abbbaladfgla8Ja8Ka8LpmwKDYq8AkEx3m5P8Es8Fg8Ka8NaypmwKDYq8AkEx3m5P8Es8Fg8LpmbezHdiOAlvCXorQLg8Fcep:nea8Faap9op:bep9rg8Fp:oeg8Jp9Abbbaladfgla8Ja8Fa8Fpmlvorlvorlvorlvorp:oeg8Jp9Abbbaladfgla8Ja8Fa8FpmwDqkwDqkwDqkwDqkp:oeg8Jp9Abbbaladfgla8Ja8Fa8FpmxmPsxmPsxmPsxmPsp:oeg8Jp9Abbbaladfgla8Ja8Ka8LpmwDKYqk8AExm35Ps8E8Fg8Fcep:nea8Faap9op:bep9rg8Fp:oegap9Abbbaladfglaaa8Fa8Fpmlvorlvorlvorlvorp:oegap9Abbbaladfglaaa8Fa8FpmwDqkwDqkwDqkwDqkp:oegap9Abbbaladfglaaa8Fa8FpmxmPsxmPsxmPsxmPsp:oeg8Jp9AbbbaladfhlaoczfgoaQ6mbxdkkaQTmbcbhocbalcl4gl9Rc8FGhiavcjdfa8Afhrava8Afpbdbhainaravcj;cbfaofpblbg8JaYaofpblbg8KpmbzeHdOiAlCvXoQrLg8LaLaofpblbg8MaKaofpblbg8NpmbzeHdOiAlCvXoQrLgypmbezHdiOAlvCXorQLg8Faip:Rea8Falp:Tep9qg8Faap9rgap9Abbbaradfgraaa8Fa8Fpmlvorlvorlvorlvorp9rgap9Abbbaradfgraaa8Fa8FpmwDqkwDqkwDqkwDqkp9rgap9Abbbaradfgraaa8Fa8FpmxmPsxmPsxmPsxmPsp9rgap9Abbbaradfgraaa8LaypmwDKYqk8AExm35Ps8E8Fg8Faip:Rea8Falp:Tep9qg8Fp9rgap9Abbbaradfgraaa8Fa8Fpmlvorlvorlvorlvorp9rgap9Abbbaradfgraaa8Fa8FpmwDqkwDqkwDqkwDqkp9rgap9Abbbaradfgraaa8Fa8FpmxmPsxmPsxmPsxmPsp9rgap9Abbbaradfgraaa8Ja8KpmwKDYq8AkEx3m5P8Es8Fg8Ja8Ma8NpmwKDYq8AkEx3m5P8Es8Fg8KpmbezHdiOAlvCXorQLg8Faip:Rea8Falp:Tep9qg8Fp9rgap9Abbbaradfgraaa8Fa8Fpmlvorlvorlvorlvorp9rgap9Abbbaradfgraaa8Fa8FpmwDqkwDqkwDqkwDqkp9rgap9Abbbaradfgraaa8Fa8FpmxmPsxmPsxmPsxmPsp9rgap9Abbbaradfgraaa8Ja8KpmwDKYqk8AExm35Ps8E8Fg8Faip:Rea8Falp:Tep9qg8Fp9rgap9Abbbaradfgraaa8Fa8Fpmlvorlvorlvorlvorp9rgap9Abbbaradfgraaa8Fa8FpmwDqkwDqkwDqkwDqkp9rgap9Abbbaradfgraaa8Fa8FpmxmPsxmPsxmPsxmPsp9rgap9AbbbaradfhraoczfgoaQ6mbkka8Aclfg8Aad6mbkdnaCad2goTmbaOavcjdfao;8qbbkdnammbavavcjdfaCcufad2fad;8qbbkaCaHfhHc9:hoaAhPaAmbxlkkaeTmbaDalfhrcbhocuhlinaralaD9RglfaD6mdasaeao9Raoasfae6Eaofgoae6mbkaial9RhPkcbc99axaP9RakSEhoxekc9:hokavcj;kbf8Kjjjjbaokwbz:bjjjbkNsezu8Jjjjjbc;ae9Rgv8Kjjjjbc9:hodnalaeci9UgrcHf6mbcuhoaiRbbgwc;WeGc;Ge9hmbawcsGgDce0mbavc;abfcFecje;8kbav9cu83iUav9cu83i8Wav9cu83iyav9cu83iaav9cu83iKav9cu83izav9cu83iwav9cu83ibaialfc9WfhqaicefgwarfhldnaeTmbcmcsaDceSEhkcbhxcbhmcbhrcbhicbhoindnalaq9nmbc9:hoxikdndnawRbbgDc;Ve0mbavc;abfaoaDcu7gPcl4fcsGcitfgsydlhzasydbhHdndnaDcsGgsak9pmbavaiaPfcsGcdtfydbaxasEhDaxasTgOfhxxekdndnascsSmbcehOasc987asamffcefhDxekalcefhDal8SbbgscFeGhPdndnascu9mmbaDhlxekalcvfhlaPcFbGhPcrhsdninaD8SbbgOcFbGastaPVhPaOcu9kmeaDcefhDascrfgsc8J9hmbxdkkaDcefhlkcehOaPce4cbaPceG9R7amfhDkaDhmkavc;abfaocitfgsaDBdbasazBdlavaicdtfaDBdbavc;abfaocefcsGcitfgsaHBdbasaDBdlaocdfhoaOaifhidnadcd9hmbabarcetfgsaH87ebasclfaD87ebascdfaz87ebxdkabarcdtfgsaHBdbascwfaDBdbasclfazBdbxekdnaDcpe0mbavaiaqaDcsGfRbbgscl4gP9RcsGcdtfydbaxcefgOaPEhDavaias9RcsGcdtfydbaOaPTgzfgOascsGgPEhsaPThPdndnadcd9hmbabarcetfgHax87ebaHclfas87ebaHcdfaD87ebxekabarcdtfgHaxBdbaHcwfasBdbaHclfaDBdbkavaicdtfaxBdbavc;abfaocitfgHaDBdbaHaxBdlavaicefgicsGcdtfaDBdbavc;abfaocefcsGcitfgHasBdbaHaDBdlavaiazfgicsGcdtfasBdbavc;abfaocdfcsGcitfgDaxBdbaDasBdlaocifhoaiaPfhiaOaPfhxxekaxcbalRbbgsEgHaDc;:eSgDfhOascsGhAdndnascl4gCmbaOcefhzxekaOhzavaiaC9RcsGcdtfydbhOkdndnaAmbazcefhxxekazhxavaias9RcsGcdtfydbhzkdndnaDTmbalcefhDxekalcdfhDal8SbegPcFeGhsdnaPcu9kmbalcofhHascFbGhscrhldninaD8SbbgPcFbGaltasVhsaPcu9kmeaDcefhDalcrfglc8J9hmbkaHhDxekaDcefhDkasce4cbasceG9R7amfgmhHkdndnaCcsSmbaDhsxekaDcefhsaD8SbbglcFeGhPdnalcu9kmbaDcvfhOaPcFbGhPcrhldninas8SbbgDcFbGaltaPVhPaDcu9kmeascefhsalcrfglc8J9hmbkaOhsxekascefhskaPce4cbaPceG9R7amfgmhOkdndnaAcsSmbashlxekascefhlas8SbbgDcFeGhPdnaDcu9kmbascvfhzaPcFbGhPcrhDdninal8SbbgscFbGaDtaPVhPascu9kmealcefhlaDcrfgDc8J9hmbkazhlxekalcefhlkaPce4cbaPceG9R7amfgmhzkdndnadcd9hmbabarcetfgDaH87ebaDclfaz87ebaDcdfaO87ebxekabarcdtfgDaHBdbaDcwfazBdbaDclfaOBdbkavc;abfaocitfgDaOBdbaDaHBdlavaicdtfaHBdbavc;abfaocefcsGcitfgDazBdbaDaOBdlavaicefgicsGcdtfaOBdbavc;abfaocdfcsGcitfgDaHBdbaDazBdlavaiaCTaCcsSVfgicsGcdtfazBdbaiaATaAcsSVfhiaocifhokawcefhwaocsGhoaicsGhiarcifgrae6mbkkcbc99alaqSEhokavc;aef8Kjjjjbaok:clevu8Jjjjjbcz9Rhvdnalaecvf9pmbc9:skdnaiRbbc;:eGc;qeSmbcuskav9cb83iwaicefhoaialfc98fhrdnaeTmbdnadcdSmbcbhwindnaoar6mbc9:skaocefhlao8SbbgicFeGhddndnaicu9mmbalhoxekaocvfhoadcFbGhdcrhidninal8SbbgDcFbGaitadVhdaDcu9kmealcefhlaicrfgic8J9hmbxdkkalcefhokabawcdtfadc8Etc8F91adcd47avcwfadceGcdtVglydbfgiBdbalaiBdbawcefgwae9hmbxdkkcbhwindnaoar6mbc9:skaocefhlao8SbbgicFeGhddndnaicu9mmbalhoxekaocvfhoadcFbGhdcrhidninal8SbbgDcFbGaitadVhdaDcu9kmealcefhlaicrfgic8J9hmbxdkkalcefhokabawcetfadc8Etc8F91adcd47avcwfadceGcdtVglydbfgi87ebalaiBdbawcefgwae9hmbkkcbc99aoarSEk;Toio97eue97aec98Ghedndnadcl9hmbaeTmecbhdinababpbbbgicKp:RecKp:Sep;6eglaicwp:RecKp:Sep;6ealp;Geaiczp:RecKp:Sep;6egvp;Gep;Kep;Legopxbbbbbbbbbbbbbbbbp:2egralpxbbbjbbbjbbbjbbbjgwp9op9rp;Keglpxbb;:9cbb;:9cbb;:9cbb;:9calalp;Meaoaop;Meavaravawp9op9rp;Keglalp;Mep;Kep;Kep;Jep;Negvp;Mepxbbn0bbn0bbn0bbn0grp;KepxFbbbFbbbFbbbFbbbp9oaipxbbbFbbbFbbbFbbbFp9op9qalavp;Mearp;Kecwp:RepxbFbbbFbbbFbbbFbbp9op9qaoavp;Mearp;Keczp:RepxbbFbbbFbbbFbbbFbp9op9qpkbbabczfhbadclfgdae6mbxdkkaeTmbcbhdinabczfgDaDpbbbgipxbbbbbbFFbbbbbbFFgwp9oabpbbbgoaipmbediwDqkzHOAKY8AEgvczp:Reczp:Sep;6eglaoaipmlvorxmPsCXQL358E8FpxFubbFubbFubbFubbp9op;6eavczp:Sep;6egvp;Gealp;Gep;Kep;Legipxbbbbbbbbbbbbbbbbp:2egralpxbbbjbbbjbbbjbbbjgqp9op9rp;Keglpxb;:FSb;:FSb;:FSb;:FSalalp;Meaiaip;Meavaravaqp9op9rp;Keglalp;Mep;Kep;Kep;Jep;Negvp;Mepxbbn0bbn0bbn0bbn0grp;KepxFFbbFFbbFFbbFFbbp9oaiavp;Mearp;Keczp:Rep9qgialavp;Mearp;KepxFFbbFFbbFFbbFFbbp9oglpmwDKYqk8AExm35Ps8E8Fp9qpkbbabaoawp9oaialpmbezHdiOAlvCXorQLp9qpkbbabcafhbadclfgdae6mbkkk;2ileue97euo97dnaec98GgiTmbcbheinabcKfpx:ji:1S:ji:1S:ji:1S:ji:1SabpbbbglabczfgvpbbbgopmlvorxmPsCXQL358E8Fgrczp:Segwpxibbbibbbibbbibbbp9qp;6egDp;NegqaDaDp;MegDaDp;KealaopmbediwDqkzHOAKY8AEgDczp:Reczp:Sep;6eglalp;MeaDczp:Sep;6egoaop;Mearczp:Reczp:Sep;6egrarp;Mep;Kep;Kep;Lepxbbbbbbbbbbbbbbbbp:4ep;Jep;Mepxbbn0bbn0bbn0bbn0gDp;KepxFFbbFFbbFFbbFFbbgkp9oaqaop;MeaDp;Keczp:Rep9qgoaqalp;MeaDp;Keakp9oaqarp;MeaDp;Keczp:Rep9qgDpmwDKYqk8AExm35Ps8E8Fglp5eawclp:RegqpEi:T:j83ibavalp5baqpEd:T:j83ibabcwfaoaDpmbezHdiOAlvCXorQLgDp5eaqpEe:T:j83ibabaDp5baqpEb:T:j83ibabcafhbaeclfgeai6mbkkkuee97dnadcd4ae2c98GgeTmbcbhdinababpbbbgicwp:Recwp:Sep;6eaicep:SepxbbjFbbjFbbjFbbjFp9opxbbjZbbjZbbjZbbjZp:Uep;Mepkbbabczfhbadclfgdae6mbkkk:Sodw97euaec98Ghedndnadcl9hmbaeTmecbhdinabpxbbuJbbuJbbuJbbuJabpbbbgicKp:TeglaicYp:Tep9qgvcdp:Teavp9qgvclp:Teavp9qgop;6ep;Negvaicwp:RecKp:SegraipxFbbbFbbbFbbbFbbbgwp9ogDp:Uep;6ep;Mepxbbn0bbn0bbn0bbn0gqp;Kecwp:RepxbFbbbFbbbFbbbFbbp9oavaDarp:Xeaiczp:RecKp:Segip:Uep;6ep;Meaqp;Keawp9op9qavaDaraip:Uep:Xep;6ep;Meaqp;Keczp:RepxbbFbbbFbbbFbbbFbp9op9qavaoalcep:Rep9oalpxebbbebbbebbbebbbp9op9qp;6ep;Meaqp;KecKp:Rep9qpkbbabczfhbadclfgdae6mbxdkkaeTmbcbhdinabczfgkpxbFu9hbFu9hbFu9hbFu9habpbbbglakpbbbgrpmlvorxmPsCXQL358E8Fgvczp:TegqavcHp:Tep9qgicdp:Teaip9qgiclp:Teaip9qgicwp:Teaip9qgop;6ep;NegialarpmbediwDqkzHOAKY8AEgDpxFFbbFFbbFFbbFFbbglp9ograDczp:Segwp:Ueavczp:Reczp:SegDp:Xep;6ep;Mepxbbn0bbn0bbn0bbn0gvp;Kealp9oaiarawaDp:Uep:Xep;6ep;Meavp;Keczp:Rep9qgwaiaoaqcep:Rep9oaqpxebbbebbbebbbebbbp9op9qp;6ep;Meavp;Keczp:ReaiaDarp:Uep;6ep;Meavp;Kealp9op9qgipmwDKYqk8AExm35Ps8E8FpkbbabawaipmbezHdiOAlvCXorQLpkbbabcafhbadclfgdae6mbkkk9teiucbcbydj:G:cjbgeabcifc98GfgbBdj:G:cjbdndnabZbcztgd9nmbcuhiabad9RcFFifcz4nbcuSmekaehikaikkxebcj:Gdklz:zbb`,n=new Uint8Array([0,97,115,109,1,0,0,0,1,4,1,96,0,0,3,3,2,0,0,5,3,1,0,1,12,1,0,10,22,2,12,0,65,0,65,0,65,0,252,10,0,0,11,7,0,65,0,253,15,26,11]),r=new Uint8Array([32,0,65,2,1,106,34,33,3,128,11,4,13,64,6,253,10,7,15,116,127,5,8,12,40,16,19,54,20,9,27,255,113,17,42,67,24,23,146,148,18,14,22,45,70,69,56,114,101,21,25,63,75,136,108,28,118,29,73,115]);if(typeof WebAssembly!=`object`)return{supported:!1};var i=WebAssembly.validate(n)?s(t):s(e),a,o=WebAssembly.instantiate(i,{}).then(function(e){a=e.instance,a.exports.__wasm_call_ctors()});function s(e){for(var t=new Uint8Array(e.length),n=0;n<e.length;++n){var i=e.charCodeAt(n);t[n]=i>96?i-97:i>64?i-39:i+4}for(var a=0,n=0;n<e.length;++n)t[a++]=t[n]<60?r[t[n]]:(t[n]-60)*64+t[++n];return t.buffer.slice(0,a)}function c(e,t,n,r,i,a,o){var s=e.exports.sbrk,c=r+3&-4,l=s(c*i),u=s(a.length),d=new Uint8Array(e.exports.memory.buffer);d.set(a,u);var f=t(l,r,i,u,a.length);if(f==0&&o&&o(l,c,i),n.set(d.subarray(l,l+r*i)),s(l-s(0)),f!=0)throw Error(`Malformed buffer data: `+f)}var l={NONE:``,OCTAHEDRAL:`meshopt_decodeFilterOct`,QUATERNION:`meshopt_decodeFilterQuat`,EXPONENTIAL:`meshopt_decodeFilterExp`,COLOR:`meshopt_decodeFilterColor`},u={ATTRIBUTES:`meshopt_decodeVertexBuffer`,TRIANGLES:`meshopt_decodeIndexBuffer`,INDICES:`meshopt_decodeIndexSequence`},d=[],f=0;function p(e){var t={object:new Worker(e),pending:0,requests:{}};return t.object.onmessage=function(e){var n=e.data;t.pending-=n.count,t.requests[n.id][n.action](n.value),delete t.requests[n.id]},t}function m(e){for(var t=`self.ready = WebAssembly.instantiate(new Uint8Array([`+new Uint8Array(i)+`]), {}).then(function(result) { result.instance.exports.__wasm_call_ctors(); return result.instance; });self.onmessage = `+g.name+`;`+c.toString()+g.toString(),n=new Blob([t],{type:`text/javascript`}),r=URL.createObjectURL(n),a=d.length;a<e;++a)d[a]=p(r);for(var a=e;a<d.length;++a)d[a].object.postMessage({});d.length=e,URL.revokeObjectURL(r)}function h(e,t,n,r,i){for(var a=d[0],o=1;o<d.length;++o)d[o].pending<a.pending&&(a=d[o]);return new Promise(function(o,s){var c=new Uint8Array(n),l=++f;a.pending+=e,a.requests[l]={resolve:o,reject:s},a.object.postMessage({id:l,count:e,size:t,source:c,mode:r,filter:i},[c.buffer])})}function g(e){var t=e.data;self.ready.then(function(e){if(!t.id)return self.close();try{var n=new Uint8Array(t.count*t.size);c(e,e.exports[t.mode],n,t.count,t.size,t.source,e.exports[t.filter]),self.postMessage({id:t.id,count:t.count,action:`resolve`,value:n},[n.buffer])}catch(e){self.postMessage({id:t.id,count:t.count,action:`reject`,value:e})}})}return{ready:o,supported:!0,useWorkers:function(e){m(e)},decodeVertexBuffer:function(e,t,n,r,i){c(a,a.exports.meshopt_decodeVertexBuffer,e,t,n,r,a.exports[l[i]])},decodeIndexBuffer:function(e,t,n,r){c(a,a.exports.meshopt_decodeIndexBuffer,e,t,n,r)},decodeIndexSequence:function(e,t,n,r){c(a,a.exports.meshopt_decodeIndexSequence,e,t,n,r)},decodeGltfBuffer:function(e,t,n,r,i,o){c(a,a.exports[u[i]],e,t,n,r,a.exports[l[o]])},decodeGltfBufferAsync:function(e,t,n,r,i){return d.length>0?h(e,t,n,u[r],l[i]):o.then(function(){var o=new Uint8Array(e*t);return c(a,a.exports[u[r]],o,e,t,n,a.exports[l[i]]),o})}}})(),E_={civic:{fill:1,stretch:1.6,h:80,colliders:[[.86,.62,0,.62],[.12,.18,0,1]]},convention:{fill:.97,stretch:1.5,h:50,tint:[1.12,1.12,1.1],metal:.12,rough:.55,colliders:[[.95,.9,0,1]]},library:{fill:.95,stretch:1.4,colliders:[[.95,.9,0,1]]},concert:{fill:.95,stretch:1.4,colliders:[[.7,.9,0,.9]]},szse:{fill:1,stretch:1.3,remapY:[[0,.45,0,36/245.8],[.45,.75,36/245.8,62/245.8],[.75,1,62/245.8,1]],colliders:[[.95,.95,36/245.8,62/245.8],[.5,.6,0,1]]},upperhills:{fill:1,stretch:1.4,colliders:[[.95,.95,0,1]]}};async function D_(e,t,n,r=new Set){let i=new of;i.setMeshoptDecoder(T_);let a=(t.landmarkModels||[]).filter(e=>!r.has(e.id)),o=[],s=[],c=0;return await Promise.all(a.map(async t=>{let r=E_[t.id]||{},l=r.h||t.h,u;try{u=await i.loadAsync(`/models/`+t.file)}catch(e){console.warn(`地标模型加载失败`,t.id,e);return}let d=u.scene;r.remapY&&O_(d,r.remapY);let f=new Zn().setFromObject(d),p=f.getSize(new J),m=f.getCenter(new J),h=p.x>=p.z,g=h?p.x:p.z,_=h?p.z:p.x,v=t.L*(r.fill||1)/g,y=t.W*(r.fill||1)/_,b=r.stretch||1.4;v/y>b&&(v=y*b),y/v>b&&(y=v*b);let x=l/p.y,S=new On;d.position.set(-m.x,-f.min.y,-m.z),S.add(d),S.scale.set(h?v:y,x,h?y:v);let C=new On;C.add(S);let w=(h?-t.ang:Math.PI/2-t.ang)+(r.yaw||0);C.rotation.y=w;let T=Math.cos(t.ang),E=Math.sin(t.ang),D=1/0;for(let[e,n]of[[-1,-1],[1,-1],[1,1],[-1,1],[0,0]]){let r=t.x+T*e*t.L/2-E*n*t.W/2,i=t.z+E*e*t.L/2+T*n*t.W/2;D=Math.min(D,$(r,i))}C.position.set(t.x,D-.3,t.z),d.traverse(e=>{if(!e.isMesh)return;e.renderOrder=5;let t=e.material;r.tint&&t.color&&t.color.setRGB(...r.tint),r.metal!=null&&`metalness`in t&&(t.metalness=Math.min(t.metalness??1,r.metal)),r.rough!=null&&`roughness`in t&&(t.roughness=Math.max(t.roughness??0,r.rough)),`envMapIntensity`in t&&(t.envMapIntensity=1),t.isMeshStandardMaterial&&Md(t)}),e.add(C),s.push(C);for(let[e,n,i,a]of r.colliders||[[.9,.9,0,1]]){let r=t.L*e/2,s=t.W*n/2,c=[[-r,-s],[r,-s],[r,s],[-r,s]].map(([e,n])=>new q(t.x+T*e-E*n,t.z+E*e+T*n)),u=c.map(e=>e.x),d=c.map(e=>e.y);o.push({rings:[c],minX:Math.min(...u),maxX:Math.max(...u),minZ:Math.min(...d),maxZ:Math.max(...d),bottom:D+l*i-(i===0?2:0),top:D+l*a,name:t.name,h:l})}c++,n&&n(c/a.length)})),{colliders:o,objects:s}}function O_(e,t){e.updateMatrixWorld(!0);let n=new Y().copy(e.matrixWorld).invert(),r=[];e.traverse(e=>{e.isMesh&&r.push(e)});let i=new Zn().setFromObject(e),a=i.min.y,o=i.max.y-i.min.y,s=new J;for(let i of r){let r=new Y().multiplyMatrices(n,i.matrixWorld),c=i.geometry,l=c.attributes.position,u=new Float32Array(l.count*3);for(let e=0;e<l.count;e++){s.fromBufferAttribute(l,e).applyMatrix4(r);let n=(s.y-a)/o;for(let[e,r,i,a]of t)if(n>=e-1e-6&&n<=r+1e-6){n=i+(n-e)/(r-e)*(a-i);break}u[e*3]=s.x,u[e*3+1]=a+n*o,u[e*3+2]=s.z}if(c.setAttribute(`position`,new hr(u,3)),c.attributes.normal){let e=c.attributes.normal,t=new Float32Array(e.count*3),n=new Nt().getNormalMatrix(r);for(let r=0;r<e.count;r++)s.fromBufferAttribute(e,r).applyMatrix3(n).normalize(),t[r*3]=s.x,t[r*3+1]=s.y,t[r*3+2]=s.z;c.setAttribute(`normal`,new hr(t,3))}c.computeBoundingBox(),c.computeBoundingSphere(),i.removeFromParent(),i.position.set(0,0,0),i.rotation.set(0,0,0),i.scale.set(1,1,1),e.add(i)}e.updateMatrixWorld(!0)}function k_(e){return function(){e|=0,e=e+1831565813|0;let t=Math.imul(e^e>>>15,1|e);return t=t+Math.imul(t^t>>>7,61|t)^t,((t^t>>>14)>>>0)/4294967296}}var A_=400,j_=(e,t)=>Math.floor(e/A_)+`,`+Math.floor(t/A_);function M_(e,t,n,r){let i=new Map;for(let e of n){let t=j_(e.x,e.z);i.has(t)||i.set(t,[]),i.get(t).push(e)}let a=new On,o=new X;for(let n of i.values()){let i=new ki(e,t,n.length);n.forEach((e,t)=>{i.setMatrixAt(t,e.m),r&&(o.setRGB(e.c[0],e.c[1],e.c[2]),i.setColorAt(t,o))}),i.computeBoundingSphere(),a.add(i)}return a}function N_(){let e=document.createElement(`canvas`);e.width=64,e.height=64;let t=e.getContext(`2d`);t.clearRect(0,0,64,64),t.strokeStyle=`#d6d8da`,t.lineWidth=3,t.strokeRect(1.5,1.5,61,61),t.lineWidth=1.6;for(let e=8;e<64;e+=8)t.beginPath(),t.moveTo(e,0),t.lineTo(e,64),t.stroke();for(let e=21;e<64;e+=21)t.beginPath(),t.moveTo(0,e),t.lineTo(64,e),t.stroke();let n=new ia(e);return n.colorSpace=Le,n}function P_(e){let t=k_(777),n=[],r=[],i=[],a=[],o=new Y,s=new At,c=new J,l=new J,u=new J(0,1,0);for(let d of e){let e=Math.floor(d.h/3),f=d.ring.length,p=qa.area(d.ring)<0?-1:1;for(let i=0;i<f;i++){let a=d.ring[i],m=d.ring[(i+1)%f],h=m.x-a.x,g=m.y-a.y,_=Math.hypot(h,g);if(_<2.2)continue;let v=g/_*p,y=-h/_*p,b=Math.atan2(v,y);s.setFromAxisAngle(u,b);let x=Math.floor(_/2.6);for(let i=1;i<e;i++)for(let e=0;e<x;e++){let u=(e+.5)/x,f=t(),p=a.x+h*u,m=a.y+g*u,b=d.base+i*3;if(f<.13){let e=(t()-.5)*.8;l.set(p+h/_*e+v*.28,b+.35,m+g/_*e+y*.28),c.set(.85,.6,.42),n.push({x:p,z:m,m:o.compose(l,s,c).clone()})}else f<.22&&(l.set(p+v*.22,b+.9,m+y*.22),c.set(1.3,1.5,.45),r.push({x:p,z:m,m:o.compose(l,s,c).clone()}))}}let m=d.base+d.h,h=d.area>80?1+Math.floor(t()*2.5):+(t()<.5);for(let e=0;e<h;e++){let e=d.ring[Math.floor(t()*f)],n=d.cx+(e.x-d.cx)*(.3+t()*.4),r=d.cz+(e.y-d.cz)*(.3+t()*.4),a=.7+t()*.5;l.set(n,m+.4,r),c.set(a,a*(1.2+t()*.6),a),s.setFromAxisAngle(u,t()*6.28);let p=t()<.55?[.82,.83,.85]:t()<.6?[.2,.38,.7]:[.92,.92,.9];i.push({x:n,z:r,m:o.compose(l,s,c).clone(),c:p})}if(t()<.35){let e=d.cx+(t()-.5)*3,n=d.cz+(t()-.5)*3;l.set(e,m+.6,n),c.set(1,1,1),s.setFromAxisAngle(u,t()*6.28),a.push({x:e,z:n,m:o.compose(l,s,c).clone()})}}let d=new On,f=new ca(1,1,1),p=xd({color:14211284});d.add(M_(f,p,n));let m=new ca(1,1,1),h=xd({map:N_(),alphaTest:.5,side:2,color:16777215});d.add(M_(m,h,r));let g=new ua(.75,.75,1.2,10);g.translate(0,.6,0);let _=xd({color:16777215,spec:.6});d.add(M_(g,_,i,!0));let v=new ca(2,.08,1.4);v.rotateX(-.6),v.translate(0,.5,0);let y=new ua(.22,.22,2,8);y.rotateZ(Math.PI/2),y.translate(0,.95,-.55);let b=ld([v,y]);return d.add(M_(b,xd({color:3820126,spec:.8}),a)),d.userData.count=n.length+r.length+i.length+a.length,d}function F_(e){let t=k_(4242),n=[],r=new Y,i=new At,a=new J,o=new J,s=new J(0,1,0);for(let c of e){let e=Math.abs(qa.area(c.ring));if(e<250)continue;let l=Math.min(6,Math.floor(e/400)+ +(t()<.5));for(let e=0;e<l;e++){let e=c.ring[Math.floor(t()*c.ring.length)],l=.35+t()*.35,u=c.cx+(e.x-c.cx)*l,d=c.cz+(e.y-c.cz)*l;o.set(u,c.base+c.h,d),a.set(2+t()*3,1.2+t()*1.5,2+t()*3),i.setFromAxisAngle(s,Math.atan2(e.x-c.cx,e.y-c.cz)),n.push({x:u,z:d,m:r.compose(o,i,a).clone()})}}let c=new ca(1,1,1);return c.translate(0,.5,0),M_(c,xd({color:10132638}),n)}function I_(e){let t=e.roadClasses,n=k_(99),r=[],i=new Y,a=new At,o=new J(1,1,1),s=new J,c=new J(0,1,0);for(let l of e.roads){let e=t[l[0]];if(![`trunk`,`primary`,`secondary`,`tertiary`].includes(e)||l[5])continue;let u=l[4],d=l[1]/2+.9,f=e===`tertiary`?38:32,p=n()*f;for(let e=2;e<u.length;e+=2){let t=u[e-2],n=u[e-1],m=u[e],h=u[e+1],g=Math.hypot(m-t,h-n);if(g<.1)continue;let _=-(h-n)/g,v=(m-t)/g,y=f-p;for(;y<g;y+=f){let e=t+(m-t)*y/g,u=n+(h-n)*y/g,f=l[3]?[1]:[-1,1];for(let t of f){let n=e+_*d*t,l=u+v*d*t;a.setFromAxisAngle(c,Math.atan2(-_*t,-v*t)),s.set(n,$(n,l),l),r.push({x:n,z:l,m:i.compose(s,a,o).clone()})}}p=(p+g)%f}}let l=new ua(.09,.14,10,6);l.translate(0,5,0);let u=new ca(.08,.08,2.4);u.translate(0,9.8,1.15);let d=new ua(.22,.25,.5,6);d.translate(0,.25,0);let f=ld([l,u,d]),p=new ca(.35,.14,.75);p.translate(0,9.72,2.3);let m=new On,h=M_(f,xd({color:6975606,spec:.5}),r);h.userData.cast=!0,m.add(h),m.add(M_(p,xd({color:16773320,emissive:1}),r));let g=M_(new Za(1,1),jd({color:[1,.74,.4],size:4.2,local:[0,9.6,2.3],gain:.9}),r);return g.visible=!1,g.traverse(e=>{e.renderOrder=20}),Ad.push(g),m.add(g),m.userData.count=r.length,m}function L_(e){let t=e.roadClasses,n=new Set([`trunk`,`primary`,`secondary`,`tertiary`,`unclassified`,`residential`,`primary_link`,`secondary_link`,`tertiary_link`,`living_street`]),r=new Set([`primary`,`secondary`,`tertiary`,`unclassified`,`residential`,`trunk`,`living_street`]),i=new Map,a=(e,t)=>Math.round(e*2)+`,`+Math.round(t*2);e.roads.forEach((e,r)=>{if(!n.has(t[e[0]])||e[5])return;let o=e[4];for(let e=0;e<o.length;e+=2){let t=a(o[e],o[e+1]);i.has(t)||i.set(t,[]),i.get(t).push([r,e/2])}});let o=[],s=[],c=[],l=0;for(let n of i.values()){if(new Set(n.map(e=>e[0])).size<2)continue;let i=[];for(let[t,r]of n){let n=e.roads[t],a=n[4],o=a.length/2,s=a[r*2],c=a[r*2+1];for(let e of[-1,1]){let t=r+e;t<0||t>=o||i.push({r:n,x:s,z:c,tx:a[t*2]-s,tz:a[t*2+1]-c})}}if(i.length<3)continue;let a=Math.max(...i.map(e=>e.r[1]));for(let e of i){if(!r.has(t[e.r[0]]))continue;let n=Math.hypot(e.tx,e.tz),i=a/2+3.5;if(n<i+3)continue;let u=e.tx/n,d=e.tz/n,f=e.x+u*i,p=e.z+d*i,m=e.r[1]/2-.4,h=-d,g=u,_=$(f,p)+.16,v=o.length/3;for(let[e,t]of[[-1,-1],[1,-1],[1,1],[-1,1]])o.push(f+h*m*e+u*2*t,_,p+g*m*e+d*2*t),s.push(m*e,2*t);c.push(v,v+2,v+1,v,v+3,v+2,v,v+1,v+2,v,v+2,v+3),l++}}let u=new kr;u.setAttribute(`position`,new Z(o,3)),u.setAttribute(`uv`,new Z(s,2)),u.setIndex(c),u.computeBoundingSphere();let d=new ri(u,new co({uniforms:_d(),depthWrite:!1,polygonOffset:!0,polygonOffsetFactor:-4,polygonOffsetUnits:-8,vertexShader:`
      varying vec2 vUv; varying vec3 vWorld;
      void main(){ vUv = uv; vec4 wp = modelMatrix*vec4(position,1.0); vWorld = wp.xyz; gl_Position = projectionMatrix*viewMatrix*wp; }`,fragmentShader:`
      ${bd}
      varying vec2 vUv; varying vec3 vWorld;
      void main(){
        float fw = fwidth(vUv.x) + 1e-3;
        float s = fract(vUv.x / 1.2);
        float m = smoothstep(0.0, fw/1.2*1.5, s) * (1.0 - smoothstep(0.5 - fw/1.2*1.5, 0.5, s));
        float worn = 0.85 + 0.15 * vnoise(vWorld.xz * 2.0);
        if (m * worn < 0.3) discard;
        vec3 n = vec3(0.0,1.0,0.0);
        gShadow = sunShadow(vWorld, n);
        gl_FragColor = vec4(atmo(lightIt(vec3(0.93,0.93,0.91) * worn, n), vWorld), 1.0);
      }`}));return d.renderOrder=4,d.userData.count=l,d}var R_=e=>document.getElementById(e),z_=(e,t)=>{R_(`loadbar`).style.width=(e*100).toFixed(0)+`%`,t&&(R_(`loadmsg`).textContent=t)},B_=()=>new Promise(e=>requestAnimationFrame(()=>e()));async function V_(){let e=new td({antialias:!0,powerPreference:`high-performance`});e.setPixelRatio(Math.min(window.devicePixelRatio,1.5)),e.setSize(window.innerWidth,window.innerHeight),R_(`app`).appendChild(e.domElement);let t=new In;t.background=new X(md);let n=new us(65,window.innerWidth/window.innerHeight,1,4e4);z_(.05,`读取 OSM 城市数据…`);let r=await(await fetch(`city.json`)).json();od(r.peak),await B_(),z_(.08,`烘焙天空和云…`),await B_(),Id(e);try{await document.fonts.ready}catch{}let i=Cd();t.add(Ld());let a=new l_(e,t),o=new Qo(12375295,7037525,1),s=new _s(16773852,2.6);s.position.copy(fd).multiplyScalar(1e3),t.add(o,s),z_(.15,`生成地面与莲花山…`),await B_();let c=new $d(r,e,t);z_(.35,`生成建筑 ${r.buildings.length} 栋…`),await B_();let l=(e,t,n=30)=>{let i=-1,a=n;if(r.buildings.forEach((n,r)=>{let o=n[4][0],s=0,c=0;for(let e=0;e<o.length;e+=2)s+=o[e],c+=o[e+1];let l=Math.hypot(s/(o.length/2)-e,c/(o.length/2)-t);l<a&&(a=l,i=r)}),i<0)return null;let o=r.buildings[i][4][0],s=[];for(let e=0;e<o.length;e+=2)s.push([o[e],o[e+1]]);return{bi:i,ring:s}},u=new Set,d=[],f=l(-13188,-39),p=l(-13093,1957),m=l(-13128,1894);f&&(u.add(f.bi),d.push(Hg(f.ring))),p&&m&&(u.add(p.bi),u.add(m.bi),d.push(Wg(p.ring,m.ring)));let h=null;r.bounds.z0<-4300&&(r.buildings.forEach((e,t)=>{let n=e[4][0],r=0,i=0;for(let e=0;e<n.length;e+=2)r+=n[e],i+=n[e+1];Xg(r/(n.length/2),i/(n.length/2))&&u.add(t)}),h=Zg(),d.push({mesh:h.mesh,colliders:h.colliders,targets:[],signEntry:null}));let g=new Eg(r,u);for(let e of d)t.add(e.mesh),c_(e.mesh),e.signEntry&&g.extraSigns.push(e.signEntry);let _=Wd(r,g.skip);t.add(_.group),await B_();let v=Wd(r,null,{only:new Set(g.keyOf.keys()),keyOf:g.keyOf});g.attach(t,v,()=>a.markDirty()),_.colliders.push(...g.colliders);for(let e of d)_.colliders.push(...e.colliders);{let e=(r.heroes||[]).find(e=>e.id===`chunsun`);if(e){let t=29.5;g.extraSigns.push({ring:[[e.x-t,e.z-t],[e.x+t,e.z-t],[e.x+t,e.z+t],[e.x-t,e.z+t]],h:286,base:0,spec:{arche:`mall`}})}}let y=Rg(r,g);t.add(y.group);let b=new $p(_.colliders);z_(.55,`生成道路 ${r.roads.length} 条…`),await B_();let x=qd(r);t.add(x);let S=mh(r);t.add(S.group),z_(.6,`城中村细节、路灯、斑马线…`),await B_();let C=P_(_.details.village.filter(e=>e.cx>-1900&&e.cx<2100&&e.cz>-2150&&e.cz<2050)),w=F_(_.details.roofs),T=I_(r),E=L_(r);t.add(C,w,T,E),z_(.65,`种树…`),await B_();let D=new kp(r,b,t,()=>a.markDirty());z_(.75,`建造平安金融中心、市民中心…`),await B_();let O=r.pingan,k=$(O.x,O.z),A=y_(O);t.add(A.mesh),_.colliders.push(...A.colliders);let j=new Set([`civic`]),M=(r.landmarkModels||[]).find(e=>e.id===`civic`),ee=null;M&&(ee=d_(M),t.add(ee.mesh),_.colliders.push(...ee.colliders));let N=(r.landmarkModels||[]).find(e=>e.id===`szse`),P=null;N&&(P=b_(N),t.add(P.mesh),_.colliders.push(...P.colliders),j.add(`szse`));let F=[];for(let e of r.heroes||[]){let n=Zp[e.id];if(!n)continue;let r=n(e);t.add(r.mesh),F.push(r.mesh),_.colliders.push(...r.colliders)}{let e=[{x:O.x,y:$(O.x,O.z)+596,z:O.z,n:10,len:1500}];for(let t of r.heroes||[])(t.id===`kk100`||t.id===`chunsun`)&&(t.beam=e.length,e.push({x:t.x,y:t.h-2,z:t.z,n:6,len:1100}));t.add(Qp(e))}t.add(x_(r));let te=new fc(e),I=new In;I.add(Ld()),t.environment=te.fromScene(I,0,1,5e4).texture,t.environmentIntensity=.55,z_(.9,`加载地标模型…`);let ne=await D_(t,r,e=>z_(.9+.09*e),j);_.colliders.push(...ne.colliders);let re=new $p(_.colliders);c_(_.group),c_(v.group),c_(A.mesh),c_(w);for(let e of F)c_(e);ee&&c_(ee.mesh),P&&c_(P.mesh);for(let e of ne.objects)c_(e);for(let e of[x,T])e.traverse(e=>{e.userData.cast&&c_(e)});let L=new w_(n,e.domElement,re,r.bounds),ie=r.landmarks.find(e=>e.name===`市民中心`)||{x:-344,z:-340},ae=new J(O.x*.6+ie.x*.4,190,O.z*.6+ie.z*.4);L.setView(new J(O.x+620,260,O.z+900),ae);let R=[{x:O.x,z:O.z,R:56,h:560,base:k,name:`平安金融中心`,beam:0}];for(let e of r.heroes||[])R.push({x:e.x,z:e.z,R:Math.hypot(e.L,e.W)/2+6,h:e.h*.92,base:0,name:e.name,beam:e.beam});N&&R.push({x:N.x,z:N.z,R:44,h:240,base:0,name:N.name}),M&&R.push({x:M.x,z:M.z+22,R:75,h:60,base:0,name:M.name}),R.push(...g.showTargets);for(let e of d)R.push(...e.targets||[e.target]);let z=new Um(t,n,R,e=>ge(e));z.onHit=()=>_e(),t.add(n);let B=new Kh(t,n,r,re,L,{prompt:R_(`prompt`)});B.traffic=S,L.drive=(e,t)=>z.drive(e,t)||B.drive(e,t),L.astroV=()=>B.inVehicle()?!0:z.controlling()?(z.toggleFlight(),!0):!1,L.astroBusy=()=>z.controlling()||B.inVehicle();let oe=R_(`fpbtn`),se=R_(`visor`),ce=()=>{let e=z.state===`landed`;oe.style.display=e?`block`:`none`,oe.textContent=z.fp?`🛰 切到身后视角（C）`:`🧑‍🚀 切到第一人称（C）`,se.style.display=z.fp?`block`:`none`,_e()},le=()=>{z.state===`landed`&&z.setFirstPerson(!z.fp),ce()};z.onView=ce,oe.addEventListener(`click`,e=>{e.stopPropagation(),le(),oe.blur()});let ue=``,de=1;z.grid=re,z.player=L;let fe=+(new URLSearchParams(location.search).get(`night`)===`1`),pe=new X(md),me=new X(1709088),he=()=>{let e=gd.uNight.value;o.intensity=1+-.9*e,s.intensity=2.6+-2.45*e,t.environmentIntensity=.55+(.06-.55)*e,t.background.copy(pe).lerp(me,e);for(let t of Ad)t.visible=e>.01},ge=(e,t)=>{fe=+!!e,t&&(gd.uNight.value=fe),he(),_e()},_e=()=>{R_(`mode`).textContent=(B.ejected&&B.ejected()?`💥 被甩出车外`:B.inVehicle()?(B.car&&B.car.type.bike?`🏍 骑摩托车`:`🚗 开车`)+(B.state===`driving`&&B.crashT>0?B.crashHard?` · 💥 车祸`:` · ⚠ 碰撞`:``):(L.mode===`fly`?`✈ 飞行`:`🚶 走路`)+(L.noclip&&L.mode===`fly`?`（穿墙）`:``))+(fe?` · 🌙 夜景`:``)+(z.state===`landed`?z.fp?` · 👁 第一人称`:` · 🎮 操控宇航员`:``)+(z.active?` · 🧑‍🚀 左键发射（已命中 `+z.hits+` 发，`+(z.hits<2?`下一发点亮一栋`:`下一发连锁引爆`)+`）`:``)};L.onModeChange=_e,_e();let ve=e=>{document.body.classList.toggle(`nohud`,!e)};new URLSearchParams(location.search).get(`hud`)===`0`&&ve(!1),window.addEventListener(`keydown`,e=>{we.open||(e.code===`KeyF`&&!e.repeat?(e.preventDefault(),we.show()):(e.code===`KeyH`&&ve(document.body.classList.contains(`nohud`)),e.code===`KeyT`&&!e.repeat&&ge(!fe),e.code===`KeyG`&&!e.repeat&&!B.inVehicle()&&(z.toggle(),ce()),e.code===`KeyE`&&!e.repeat&&z.state===`hidden`&&B.interact()&&_e(),e.code===`KeyC`&&!e.repeat&&le()))}),e.domElement.addEventListener(`mousedown`,t=>{t.button===0&&z.active&&document.pointerLockElement===e.domElement&&z.fire()}),gd.uNight.value=fe,he(),document.addEventListener(`pointerlockchange`,()=>{R_(`clickhint`).style.display=document.pointerLockElement?`none`:``});let ye=/^[0-9A-Za-z一二三四五六七八九十东西南北中\-]{0,4}(座|栋|塔|号楼|单元|期)[0-9A-Za-z一二三四五六七八九十东西南北单元座栋]*$/,be=(e,t,n)=>{let r=im(re,e,t);return r?r.top:n},xe=[];for(let e of y.list)xe.push({...e,pri:6});h&&xe.push(...h.places),xe.push({name:`平安金融中心`,aliases:[`平安`,`平安大厦`,`平安国际金融中心`,`PAFC`],x:O.x,z:O.z,h:k+599,pri:8});let Se={kk100:[`京基100`,`KK100`,`京基一百`,`京基金融中心`],chunsun:[`春笋`,`华润总部`,`华润总部大厦`,`中国华润大厦`],diwang:[`地王`,`信兴广场`],guomao:[`国贸`,`国际贸易中心`],seg:[`赛格`,`赛格大厦`,`华强北`]};for(let e of r.heroes||[])xe.push({name:e.id===`chunsun`?`华润总部大厦（春笋）`:e.name,aliases:Se[e.id]||[],x:e.x,z:e.z,h:e.h,pri:8});for(let e of r.landmarkModels||[])xe.push({name:e.name,aliases:e.id===`upperhills`?[`深业上城`]:e.id===`szse`?[`证交所`,`深交所`]:e.id===`convention`?[`会展中心`]:[],x:e.x,z:e.z,h:e.id===`civic`?84:e.h,pri:7});let Ce=(e,t)=>[(t-r.origin.lon)*6378137*Math.PI/180*Math.cos(r.origin.lat*Math.PI/180),-(e-r.origin.lat)*6378137*Math.PI/180];for(let[e,t,n,i]of[[`宝安中心区`,22.5553,113.884,[`宝安中心`,`宝安`,`宝安区`,`宝中`]],[`深圳宝安国际机场`,22.6393,113.8107,[`机场`,`宝安机场`,`深圳机场`]],[`前海`,22.533,113.899,[`前海自贸区`,`前海湾`]],[`龙岗中心城（龙城广场）`,22.72,114.247,[`龙岗`,`龙岗区`,`龙岗中心城`,`龙城广场`,`龙城`]],[`大运中心`,22.696,114.215,[`大运`,`大运新城`,`龙岗大运`]],[`龙华（壹方天地）`,22.65,114.0235,[`龙华`,`龙华区`,`壹方天地`,`壹方城`]],[`深圳北站`,22.6097,114.029,[`北站`,`高铁北站`]],[`坂田（华为基地）`,22.656,114.057,[`坂田`,`华为`,`华为基地`]],[`布吉`,22.603,114.118,[`布吉街道`,`龙岗布吉`]],[`盐田区政府`,22.557,114.236,[`盐田`,`盐田区`,`沙头角`]],[`盐田港`,22.575,114.27,[`盐田港区`]],[`梧桐山`,22.582,114.214,[`梧桐山风景区`,`梧桐`]],[`西丽`,22.583,113.954,[`西丽街道`,`留仙洞`]],[`蛇口`,22.486,113.915,[`蛇口港`,`海上世界`]]]){let[a,o]=Ce(t,n);a>r.bounds.x0&&a<r.bounds.x1&&o>r.bounds.z0&&o<r.bounds.z1&&xe.push({name:e,aliases:i,x:a,z:o,h:be(a,o,60),pri:7})}for(let e of r.landmarks)xe.push({name:e.name,x:e.x,z:e.z,h:be(e.x,e.z,30),pri:5});for(let e of r.buildings){if(!e[5]||ye.test(e[5]))continue;let t=e[4][0],n=0,r=0;for(let e=0;e<t.length;e+=2)n+=t[e],r+=t[e+1];n/=t.length/2,r/=t.length/2,xe.push({name:e[5],x:n,z:r,h:$(n,r)+e[1]})}let we=new a_(t_(xe),t,n,{box:R_(`search`),input:R_(`searchin`),list:R_(`searchlist`),clear:R_(`searchclear`),target:R_(`target`),label:R_(`marklabel`),arrow:R_(`markarrow`)},()=>L.pos,{onOpen:()=>{L.blockInput=!0,L.keys.clear()},onClose:()=>{L.blockInput=!1}}),Te=Xd(r),Ee=2048,De=.5,Oe=new Map,V={base:`#6d6a64`,drawRoads:!0,drawPaths:!1,roadScale:1.6,drawBuildings:`rgba(40,44,52,0.85)`,sidewalks:!1,aprons:!1,hill:!0,villageAlleys:!1,plazaPattern:!1},ke=!1,Ae=(e,t)=>{let n=e*100003+t,i=Oe.get(n);if(!i){if(ke)return null;if(ke=!0,i={cv:Zd(r,{x0:e*Ee,x1:(e+1)*Ee,z0:t*Ee,z1:(t+1)*Ee},Ee*De,V),used:0},Oe.set(n,i),Oe.size>12){let e=null,t=1/0;for(let[n,r]of Oe)r.used<t&&(t=r.used,e=n);Oe.delete(e)}}return i.used=performance.now(),i.cv},je=R_(`mm`),H=je.getContext(`2d`);function Me(){let e=je.width,t=De,n=(L.pos.x-Te.x0)*t,i=(L.pos.z-Te.z0)*t,a=e/2/(700*t);H.save(),H.fillStyle=`#555`,H.fillRect(0,0,e,e),H.translate(e/2,e/2),H.rotate(L.yaw),H.scale(a,a),ke=!1;{let e=Math.floor((L.pos.x-1015)/Ee),r=Math.floor((L.pos.x+1015)/Ee),a=Math.floor((L.pos.z-1015)/Ee),o=Math.floor((L.pos.z+1015)/Ee);for(let s=e;s<=r;s++)for(let e=a;e<=o;e++){let r=Ae(s,e);r&&H.drawImage(r,(s*Ee-Te.x0)*t-n,(e*Ee-Te.z0)*t-i)}}H.fillStyle=`#ffd760`;for(let e of r.landmarks){let r=(e.x-Te.x0)*t-n,o=(e.z-Te.z0)*t-i;H.beginPath(),H.arc(r,o,5/a,0,7),H.fill()}if(H.restore(),H.fillStyle=`#ff4d4d`,H.strokeStyle=`#fff`,H.lineWidth=3,H.beginPath(),H.moveTo(e/2,e/2-16),H.lineTo(e/2+10,e/2+12),H.lineTo(e/2,e/2+6),H.lineTo(e/2-10,e/2+12),H.closePath(),H.fill(),H.stroke(),we.target){let t=we.target,n=t.x-L.pos.x,r=t.z-L.pos.z,i=Math.hypot(n,r),a=Math.cos(L.yaw),o=Math.sin(L.yaw),s=n*a-r*o,c=n*o+r*a,l=e/2/700;if(H.save(),H.translate(e/2,e/2),i<=651)H.fillStyle=`rgba(255,200,60,0.30)`,H.beginPath(),H.arc(s*l,c*l,22,0,7),H.fill(),H.fillStyle=`#ffc83c`,H.strokeStyle=`#fff`,H.lineWidth=3,H.beginPath(),H.arc(s*l,c*l,10,0,7),H.fill(),H.stroke();else{let t=Math.atan2(c,s),n=e/2-26;H.translate(Math.cos(t)*n,Math.sin(t)*n),H.rotate(t),H.fillStyle=`#ffc83c`,H.strokeStyle=`#fff`,H.lineWidth=3,H.beginPath(),H.moveTo(20,0),H.lineTo(-12,-15),H.lineTo(-4,0),H.lineTo(-12,15),H.closePath(),H.fill(),H.stroke(),H.rotate(-t),H.fillStyle=`#fff`,H.font=`bold 20px sans-serif`,H.textAlign=`center`,H.strokeStyle=`rgba(0,0,0,.8)`,H.lineWidth=4;let r=-Math.cos(t)*46,a=-Math.sin(t)*46+7;H.strokeText(r_(i),r,a),H.fillText(r_(i),r,a)}H.restore()}H.fillStyle=`#fff`,H.font=`bold 22px sans-serif`,H.textAlign=`center`,e/2+Math.sin(-L.yaw)*(e/2-20)*-1,e/2-Math.cos(L.yaw)*(e/2-20),H.fillText(`北`,e/2-Math.sin(L.yaw)*(e/2-22),e/2-Math.cos(L.yaw)*(e/2-22)+8)}let U=[...r.landmarks];function W(){let e=null,t=260;for(let n of U){let r=Math.hypot(n.x-L.pos.x,n.z-L.pos.z);r<t&&(t=r,e=n)}let n=R_(`near`);e?(n.style.display=`block`,n.textContent=`📍 `+e.name):n.style.display=`none`}window.addEventListener(`resize`,()=>{n.aspect=window.innerWidth/window.innerHeight,n.updateProjectionMatrix(),e.setSize(window.innerWidth,window.innerHeight)}),z_(1,`完成`),R_(`loading`).style.display=`none`,console.info(`[futian] buildings`,r.buildings.length,`roads`,x.userData.count,`tower entries`,g.skip.size,`building tris`,_.group.userData.tris,`village details`,C.userData.count,`lights`,T.userData.count,`crosswalks`,E.userData.count,`bridges`,x.userData.bridges);let Ne=()=>{n.position.copy(L.pos),D.fast=g.fast=!0;let e=0;for(;D.update(n.position)+g.update(n.position)+c.update(n.position)>0&&e++<400;);return D.fast=g.fast=!1,a.markDirty(),e},Pe=new Ts,Fe=0,Ie=0,Le=0,Re=6378137,ze=r.origin.lat,Be=r.origin.lon;window.__futian={avatar:B,grid2:re,terrainHeight:$,buildingAt:(e,t)=>im(re,e,t),player:L,scene:t,camera:n,renderer:e,city:r,shadows:a,setHud:ve,towers:g,trees:D,ground:c,traffic:S,settle:Ne,setNight:ge,G:gd,showTextCanvas:i,astro:z,showTargets:R,igniteTarget:Td,igniteReset:kd,launchWave:Od,search:we,logos:y};let Ve=`foot`;function He(){Pe.update();let r=Math.min(Pe.getDelta(),.05);L.update(r),B.update(r,z.state!==`hidden`);{let e=B.state+(B.state===`driving`&&B.crashT>0?B.crashHard?`!`:`~`:``);e!==Ve&&(Ve=e,_e())}if(n.updateMatrixWorld(),gd.uTime.value+=r,gd.uNight.value!==fe){let e=fe-gd.uNight.value;gd.uNight.value=Math.abs(e)<r/1.5?fe:gd.uNight.value+Math.sign(e)*r/1.5,he()}if(de+=r,de>.3){de=0;let e=n.position,t=t=>n=>{let r=n.geometry&&(n.boundingSphere||n.geometry.boundingSphere);r&&(n.visible=(r.center.x-e.x)**2+(r.center.z-e.z)**2<(t+r.radius)**2)};T.traverse(e=>{e.isInstancedMesh&&t(e.name===`glow`?2600:1800)(e)}),w.children.forEach(t(2500)),_.group.children.forEach(t(11e3)),v.group.children.forEach(e=>{g.detail.has(e.userData.key)||t(14e3)(e)})}if(z.update(r),z.state!==ue&&(ue=z.state,ce()),se.style.opacity=z.fpBlend>.72?`1`:`0`,we.update(),S.update(r,n.position),D.update(n.position),g.update(n.position),c.update(n.position),a.update(n),e.render(t,n),Fe++,Ie+=r,Le+=r,Le>.1){Le=0,Me(),W();let e=ze-L.pos.z/(Re*Math.PI/180),t=Be+L.pos.x/(Re*Math.PI/180*Math.cos(ze*Math.PI/180)),n=L.pos.y-$(L.pos.x,L.pos.z);R_(`coord`).textContent=`${e.toFixed(5)}°N ${t.toFixed(5)}°E · 高 ${n.toFixed(0)}m`}Ie>.5&&(R_(`fps`).textContent=`${(Fe/Ie).toFixed(0)} FPS`,Fe=0,Ie=0),requestAnimationFrame(He)}He()}V_().catch(e=>{console.error(e),R_(`loadmsg`).textContent=`加载失败：`+e.message});