(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const o of document.querySelectorAll('link[rel="modulepreload"]'))s(o);new MutationObserver(o=>{for(const n of o)if(n.type==="childList")for(const r of n.addedNodes)r.tagName==="LINK"&&r.rel==="modulepreload"&&s(r)}).observe(document,{childList:!0,subtree:!0});function t(o){const n={};return o.integrity&&(n.integrity=o.integrity),o.referrerPolicy&&(n.referrerPolicy=o.referrerPolicy),o.crossOrigin==="use-credentials"?n.credentials="include":o.crossOrigin==="anonymous"?n.credentials="omit":n.credentials="same-origin",n}function s(o){if(o.ep)return;o.ep=!0;const n=t(o);fetch(o.href,n)}})();const Ac="modulepreload",Ec=function(a,e){return new URL(a,e).href},gr={},Lc=function(e,t,s){let o=Promise.resolve();if(t&&t.length>0){let c=function(d){return Promise.all(d.map(p=>Promise.resolve(p).then(f=>({status:"fulfilled",value:f}),f=>({status:"rejected",reason:f}))))};const r=document.getElementsByTagName("link"),i=document.querySelector("meta[property=csp-nonce]"),l=i?.nonce||i?.getAttribute("nonce");o=c(t.map(d=>{if(d=Ec(d,s),d in gr)return;gr[d]=!0;const p=d.endsWith(".css"),f=p?'[rel="stylesheet"]':"";if(s)for(let m=r.length-1;m>=0;m--){const g=r[m];if(g.href===d&&(!p||g.rel==="stylesheet"))return}else if(document.querySelector(`link[href="${d}"]${f}`))return;const u=document.createElement("link");if(u.rel=p?"stylesheet":Ac,p||(u.as="script"),u.crossOrigin="",u.href=d,l&&u.setAttribute("nonce",l),document.head.appendChild(u),p)return new Promise((m,g)=>{u.addEventListener("load",m),u.addEventListener("error",()=>g(new Error(`Unable to preload CSS for ${d}`)))})}))}function n(r){const i=new Event("vite:preloadError",{cancelable:!0});if(i.payload=r,window.dispatchEvent(i),!i.defaultPrevented)throw r}return o.then(r=>{for(const i of r||[])i.status==="rejected"&&n(i.reason);return e().catch(n)})};var So,W,Wi,Ki,Gt,vr,Gi,Yi,Do,Js,as,Vi,Bn,fn,pn,ro={},io=[],qc=/acit|ex(?:s|g|n|p|$)|rph|grid|ows|mnc|ntw|ine[ch]|zoo|^ord|itera/i,Ms=Array.isArray;function Rt(a,e){for(var t in e)a[t]=e[t];return a}function On(a){a&&a.parentNode&&a.parentNode.removeChild(a)}function Fa(a,e,t){var s,o,n,r={};for(n in e)n=="key"?s=e[n]:n=="ref"?o=e[n]:r[n]=e[n];if(arguments.length>2&&(r.children=arguments.length>3?So.call(arguments,2):t),typeof a=="function"&&a.defaultProps!=null)for(n in a.defaultProps)r[n]===void 0&&(r[n]=a.defaultProps[n]);return eo(a,r,s,o,null)}function eo(a,e,t,s,o){var n={type:a,props:e,key:t,ref:s,__k:null,__:null,__b:0,__e:null,__c:null,constructor:void 0,__v:o??++Wi,__i:-1,__u:0};return o==null&&W.vnode!=null&&W.vnode(n),n}function le(a){return a.children}function _t(a,e){this.props=a,this.context=e}function fa(a,e){if(e==null)return a.__?fa(a.__,a.__i+1):null;for(var t;e<a.__k.length;e++)if((t=a.__k[e])!=null&&t.__e!=null)return t.__e;return typeof a.type=="function"?fa(a):null}function Rc(a){if(a.__P&&a.__d){var e=a.__v,t=e.__e,s=[],o=[],n=Rt({},e);n.__v=e.__v+1,W.vnode&&W.vnode(n),jn(a.__P,n,e,a.__n,a.__P.namespaceURI,32&e.__u?[t]:null,s,t??fa(e),!!(32&e.__u),o),n.__v=e.__v,n.__.__k[n.__i]=n,el(s,n,o),e.__e=e.__=null,n.__e!=t&&Xi(n)}}function Xi(a){if((a=a.__)!=null&&a.__c!=null)return a.__e=a.__c.base=null,a.__k.some(function(e){if(e!=null&&e.__e!=null)return a.__e=a.__c.base=e.__e}),Xi(a)}function yr(a){(!a.__d&&(a.__d=!0)&&Gt.push(a)&&!lo.__r++||vr!=W.debounceRendering)&&((vr=W.debounceRendering)||Gi)(lo)}function lo(){try{for(var a,e=1;Gt.length;)Gt.length>e&&Gt.sort(Yi),a=Gt.shift(),e=Gt.length,Rc(a)}finally{Gt.length=lo.__r=0}}function Zi(a,e,t,s,o,n,r,i,l,c,d){var p,f,u,m,g,v,x=s&&s.__k||io,b=e.length;for(l=$c(t,e,x,l,b),p=0;p<b;p++)(u=t.__k[p])!=null&&(f=u.__i!=-1&&x[u.__i]||ro,u.__i=p,v=jn(a,u,f,o,n,r,i,l,c,d),m=u.__e,u.ref&&f.ref!=u.ref&&(f.ref&&Un(f.ref,null,u),d.push(u.ref,u.__c||m,u)),g==null&&m!=null&&(g=m),4&u.__u?(l=Qi(u,l,a),f.__e&&(f.__e=null)):typeof u.type=="function"&&v!==void 0?l=v:m&&(l=m.nextSibling),u.__u&=-7);return t.__e=g,l}function $c(a,e,t,s,o){var n,r,i,l,c,d=t.length,p=d,f=0;for(a.__k=new Array(o),n=0;n<o;n++)(r=e[n])!=null&&typeof r!="boolean"&&typeof r!="function"?(typeof r=="string"||typeof r=="number"||typeof r=="bigint"||r.constructor==String?r=a.__k[n]=eo(null,r,null,null,null):Ms(r)?r=a.__k[n]=eo(le,{children:r},null,null,null):r.constructor===void 0&&r.__b>0?r=a.__k[n]=eo(r.type,r.props,r.key,r.ref?r.ref:null,r.__v):a.__k[n]=r,l=n+f,r.__=a,r.__b=a.__b+1,i=null,(c=r.__i=Hc(r,t,l,p))!=-1&&(p--,(i=t[c])&&(i.__u|=2)),i==null||i.__v==null?(c==-1&&(o>d?f--:o<d&&f++),typeof r.type!="function"&&(r.__u|=4)):c!=l&&(c==l-1?f--:c==l+1?f++:(c>l?f--:f++,r.__u|=4))):a.__k[n]=null;if(p)for(n=0;n<d;n++)(i=t[n])!=null&&(2&i.__u)==0&&(i.__e==s&&(s=fa(i)),al(i,i));return s}function Qi(a,e,t){var s,o;if(typeof a.type=="function"){for(s=a.__k,o=0;s&&o<s.length;o++)s[o]&&(s[o].__=a,e=Qi(s[o],e,t));return e}a.__e!=e&&(e&&a.type&&!e.parentNode&&(e=fa(a)),e=t.insertBefore(a.__e,e||null));do e=e&&e.nextSibling;while(e!=null&&e.nodeType==8);return e}function co(a,e){return e=e||[],a==null||typeof a=="boolean"||(Ms(a)?a.some(function(t){co(t,e)}):e.push(a)),e}function Hc(a,e,t,s){var o,n,r,i=a.key,l=a.type,c=e[t],d=c!=null&&(2&c.__u)==0;if(c===null&&i==null||d&&i==c.key&&l==c.type)return t;if(s>(d?1:0)){for(o=t-1,n=t+1;o>=0||n<e.length;)if((c=e[r=o>=0?o--:n++])!=null&&(2&c.__u)==0&&i==c.key&&l==c.type)return r}return-1}function br(a,e,t){e[0]=="-"?a.setProperty(e,t??""):a[e]=t==null?"":typeof t!="number"||qc.test(e)?t:t+"px"}function $s(a,e,t,s,o){var n,r;e:if(e=="style")if(typeof t=="string")a.style.cssText=t;else{if(typeof s=="string"&&(a.style.cssText=s=""),s)for(e in s)t&&e in t||br(a.style,e,"");if(t)for(e in t)s&&t[e]==s[e]||br(a.style,e,t[e])}else if(e[0]=="o"&&e[1]=="n")n=e!=(e=e.replace(Vi,"$1")),r=e.toLowerCase(),e=r in a||e=="onFocusOut"||e=="onFocusIn"?r.slice(2):e.slice(2),a.l||(a.l={}),a.l[e+n]=t,t?s?t[as]=s[as]:(t[as]=Bn,a.addEventListener(e,n?pn:fn,n)):a.removeEventListener(e,n?pn:fn,n);else{if(o=="http://www.w3.org/2000/svg")e=e.replace(/xlink(H|:h)/,"h").replace(/sName$/,"s");else if(e!="width"&&e!="height"&&e!="href"&&e!="list"&&e!="form"&&e!="tabIndex"&&e!="download"&&e!="rowSpan"&&e!="colSpan"&&e!="role"&&e!="popover"&&e in a)try{a[e]=t??"";break e}catch{}typeof t=="function"||(t==null||t===!1&&e[4]!="-"?a.removeAttribute(e):a.setAttribute(e,e=="popover"&&t==1?"":t))}}function xr(a){return function(e){if(this.l){var t=this.l[e.type+a];if(e[Js]==null)e[Js]=Bn++;else if(e[Js]<t[as])return;return t(W.event?W.event(e):e)}}}function jn(a,e,t,s,o,n,r,i,l,c){var d,p,f,u,m,g,v,x,b,y,k,M,z,P,$,N,B=e.type;if(e.constructor!==void 0)return null;128&t.__u&&(l=!!(32&t.__u),n=[i=e.__e=t.__e]),(d=W.__b)&&d(e);e:if(typeof B=="function"){p=r.length;try{if(b=e.props,y=B.prototype&&B.prototype.render,k=(d=B.contextType)&&s[d.__c],M=d?k?k.props.value:d.__:s,t.__c?x=(f=e.__c=t.__c).__=f.__E:(y?e.__c=f=new B(b,M):(e.__c=f=new _t(b,M),f.constructor=B,f.render=Ic),k&&k.sub(f),f.state||(f.state={}),f.__n=s,u=f.__d=!0,f.__h=[],f._sb=[]),y&&f.__s==null&&(f.__s=f.state),y&&B.getDerivedStateFromProps!=null&&(f.__s==f.state&&(f.__s=Rt({},f.__s)),Rt(f.__s,B.getDerivedStateFromProps(b,f.__s))),m=f.props,g=f.state,f.__v=e,u)y&&B.getDerivedStateFromProps==null&&f.componentWillMount!=null&&f.componentWillMount(),y&&f.componentDidMount!=null&&f.__h.push(f.componentDidMount);else{if(y&&B.getDerivedStateFromProps==null&&b!==m&&f.componentWillReceiveProps!=null&&f.componentWillReceiveProps(b,M),e.__v==t.__v||!f.__e&&f.shouldComponentUpdate!=null&&f.shouldComponentUpdate(b,f.__s,M)===!1){e.__v!=t.__v&&(f.props=b,f.state=f.__s,f.__d=!1),e.__e=t.__e,e.__k=t.__k,e.__k.some(function(G){G&&(G.__=e)}),io.push.apply(f.__h,f._sb),f._sb=[],f.__h.length&&r.push(f),i=fa(t);break e}f.componentWillUpdate!=null&&f.componentWillUpdate(b,f.__s,M),y&&f.componentDidUpdate!=null&&f.__h.push(function(){f.componentDidUpdate(m,g,v)})}if(f.context=M,f.props=b,f.__P=a,f.__e=!1,z=W.__r,P=0,y)f.state=f.__s,f.__d=!1,z&&z(e),d=f.render(f.props,f.state,f.context),io.push.apply(f.__h,f._sb),f._sb=[];else do f.__d=!1,z&&z(e),d=f.render(f.props,f.state,f.context),f.state=f.__s;while(f.__d&&++P<25);f.state=f.__s,f.getChildContext!=null&&(s=Rt(Rt({},s),f.getChildContext())),y&&!u&&f.getSnapshotBeforeUpdate!=null&&(v=f.getSnapshotBeforeUpdate(m,g)),$=d!=null&&d.type===le&&d.key==null?tl(d.props.children):d,i=Zi(a,Ms($)?$:[$],e,t,s,o,n,r,i,l,c),f.base=e.__e,e.__u&=-161,f.__h.length&&r.push(f),x&&(f.__E=f.__=null)}catch(G){if(r.length=p,e.__v=null,l||n!=null){if(G.then){for(e.__u|=l?160:128;i&&i.nodeType==8&&i.nextSibling;)i=i.nextSibling;n!=null&&(n[n.indexOf(i)]=null),e.__e=i}else if(n!=null)for(N=n.length;N--;)On(n[N])}else e.__e=t.__e;e.__k==null&&(e.__k=t.__k||[]),G.then||Ji(e),W.__e(G,e,t)}}else n==null&&e.__v==t.__v?(e.__k=t.__k,e.__e=t.__e):i=e.__e=Dc(t.__e,e,t,s,o,n,r,l,c);return(d=W.diffed)&&d(e),128&e.__u?void 0:i}function Ji(a){a&&(a.__c&&(a.__c.__e=!0),a.__k&&a.__k.some(Ji))}function el(a,e,t){for(var s=0;s<t.length;s++)Un(t[s],t[++s],t[++s]);W.__c&&W.__c(e,a),a.some(function(o){try{a=o.__h,o.__h=[],a.some(function(n){n.call(o)})}catch(n){W.__e(n,o.__v)}})}function tl(a){return typeof a!="object"||a==null||a.__b>0?a:Ms(a)?a.map(tl):a.constructor!==void 0?null:Rt({},a)}function Dc(a,e,t,s,o,n,r,i,l){var c,d,p,f,u,m,g,v=t.props||ro,x=e.props,b=e.type;if(b=="svg"?o="http://www.w3.org/2000/svg":b=="math"?o="http://www.w3.org/1998/Math/MathML":o||(o="http://www.w3.org/1999/xhtml"),n!=null){for(c=0;c<n.length;c++)if((u=n[c])&&"setAttribute"in u==!!b&&(b?u.localName==b:u.nodeType==3)){a=u,n[c]=null;break}}if(a==null){if(b==null)return document.createTextNode(x);a=document.createElementNS(o,b,x.is&&x),i&&(W.__m&&W.__m(e,n),i=!1),n=null}if(b==null)v===x||i&&a.data==x||(a.data=x);else{if(n=b=="textarea"&&x.defaultValue!=null?null:n&&So.call(a.childNodes),!i&&n!=null)for(v={},c=0;c<a.attributes.length;c++)v[(u=a.attributes[c]).name]=u.value;for(c in v)u=v[c],c=="dangerouslySetInnerHTML"?p=u:c=="children"||c in x||c=="value"&&"defaultValue"in x||c=="checked"&&"defaultChecked"in x||$s(a,c,null,u,o);for(c in x)u=x[c],c=="children"?f=u:c=="dangerouslySetInnerHTML"?d=u:c=="value"?m=u:c=="checked"?g=u:i&&typeof u!="function"||v[c]===u||$s(a,c,u,v[c],o);if(d)i||p&&(d.__html==p.__html||d.__html==a.innerHTML)||(a.innerHTML=d.__html),e.__k=[];else if(p&&(a.innerHTML=""),Zi(e.type=="template"?a.content:a,Ms(f)?f:[f],e,t,s,b=="foreignObject"?"http://www.w3.org/1999/xhtml":o,n,r,n?n[0]:t.__k&&fa(t,0),i,l),n!=null)for(c=n.length;c--;)On(n[c]);i&&b!="textarea"||(c="value",b=="progress"&&m==null?a.removeAttribute("value"):m!=null&&(m!==a[c]||b=="progress"&&!m||b=="option"&&m!=v[c])&&$s(a,c,m,v[c],o),c="checked",g!=null&&g!=a[c]&&$s(a,c,g,v[c],o))}return a}function Un(a,e,t){try{if(typeof a=="function"){var s=typeof a.__u=="function";s&&a.__u(),s&&e==null||(a.__u=a(e))}else a.current=e}catch(o){W.__e(o,t)}}function al(a,e,t){var s,o;if(W.unmount&&W.unmount(a),(s=a.ref)&&(s.current&&s.current!=a.__e||Un(s,null,e)),(s=a.__c)!=null){if(s.componentWillUnmount)try{s.componentWillUnmount()}catch(n){W.__e(n,e)}s.base=s.__P=s.__n=null}if(s=a.__k)for(o=0;o<s.length;o++)s[o]&&al(s[o],e,t||typeof a.type!="function");t||On(a.__e),a.__c=a.__=a.__e=void 0}function Ic(a,e,t){return this.constructor(a,t)}function Fc(a,e,t){var s,o,n,r;e==document&&(e=document.documentElement),W.__&&W.__(a,e),o=(s=!1)?null:e.__k,n=[],r=[],jn(e,a=e.__k=Fa(le,null,[a]),o||ro,ro,e.namespaceURI,o?null:e.firstChild?So.call(e.childNodes):null,n,o?o.__e:e.firstChild,s,r),el(n,a,r),a.props.children=null}So=io.slice,W={__e:function(a,e,t,s){for(var o,n,r;e=e.__;)if((o=e.__c)&&!o.__)try{if((n=o.constructor)&&n.getDerivedStateFromError!=null&&(o.setState(n.getDerivedStateFromError(a)),r=o.__d),o.componentDidCatch!=null&&(o.componentDidCatch(a,s||{}),r=o.__d),r)return o.__E=o}catch(i){a=i}throw a}},Wi=0,Ki=function(a){return a!=null&&a.constructor===void 0},_t.prototype.setState=function(a,e){var t;t=this.__s!=null&&this.__s!=this.state?this.__s:this.__s=Rt({},this.state),typeof a=="function"&&(a=a(Rt({},t),this.props)),a&&Rt(t,a),a!=null&&this.__v&&(e&&this._sb.push(e),yr(this))},_t.prototype.forceUpdate=function(a){this.__v&&(this.__e=!0,a&&this.__h.push(a),yr(this))},_t.prototype.render=le,Gt=[],Gi=typeof Promise=="function"?Promise.prototype.then.bind(Promise.resolve()):setTimeout,Yi=function(a,e){return a.__v.__b-e.__v.__b},lo.__r=0,Do=Math.random().toString(8),Js="__d"+Do,as="__a"+Do,Vi=/(PointerCapture)$|Capture$/i,Bn=0,fn=xr(!1),pn=xr(!0);const wr=new URLSearchParams(location.search),Nc={touch:wr.has("touch")?wr.get("touch")!=="0":matchMedia("(pointer: coarse)").matches},ne={TEX:256,CHUNK:32,CELL:4,SEA:0,PROP_HMAX:9.5,VIEW:108,ROAD_L:256},xe={FOV:34,SCALE_MIN:.45,SCALE_MAX:1.5,SCALE_START:.8,SCALE_LITE:.62,ENTITY_DPR_MAX:2,MAX_CASTERS:24,MAX_LIGHTS:8,MAX_BLIPS:32},qa={behind:[.36,10.5],above:[.8,15.5]},zt={SEED:20261123,DAY_SECONDS:720,START_HOUR:9.5,SAVE_KEY:"brushwild.save.v1",MAX_MONSTERS:26,PLAYER_SPEED:5.4},Io=Math.PI*2,He=(a,e,t)=>a<e?e:a>t?t:a,Bc=a=>a<0?0:a>1?1:a,Q=(a,e,t)=>a+(e-a)*t,j=(a,e,t)=>{const s=Bc((t-a)/(e-a));return s*s*(3-2*s)},Vt=(a,e,t,s)=>Q(a,e,1-Math.exp(-t*s));function Oc(a,e){let t=(e-a)%Io;return t>Math.PI&&(t-=Io),t<-Math.PI&&(t+=Io),t}const us=(a,e,t,s)=>a+Oc(a,e)*(1-Math.exp(-t*s)),Ve={sub:(a,e)=>[a[0]-e[0],a[1]-e[1],a[2]-e[2]],add:(a,e)=>[a[0]+e[0],a[1]+e[1],a[2]+e[2]],scale:(a,e)=>[a[0]*e,a[1]*e,a[2]*e],dot:(a,e)=>a[0]*e[0]+a[1]*e[1]+a[2]*e[2],cross:(a,e)=>[a[1]*e[2]-a[2]*e[1],a[2]*e[0]-a[0]*e[2],a[0]*e[1]-a[1]*e[0]],norm:a=>{const e=Math.hypot(a[0],a[1],a[2])||1;return[a[0]/e,a[1]/e,a[2]/e]}},Fo={perspective(a,e,t,s,o){const n=1/Math.tan(e/2),r=1/(s-o);return a.fill(0),a[0]=n/t,a[5]=n,a[10]=(o+s)*r,a[11]=-1,a[14]=2*o*s*r,a},view(a,e,t,s,o){return a[0]=t[0],a[4]=t[1],a[8]=t[2],a[12]=-Ve.dot(t,e),a[1]=s[0],a[5]=s[1],a[9]=s[2],a[13]=-Ve.dot(s,e),a[2]=-o[0],a[6]=-o[1],a[10]=-o[2],a[14]=Ve.dot(o,e),a[3]=0,a[7]=0,a[11]=0,a[15]=1,a},mul(a,e,t){for(let s=0;s<4;s++){const o=t[s*4],n=t[s*4+1],r=t[s*4+2],i=t[s*4+3];a[s*4]=e[0]*o+e[4]*n+e[8]*r+e[12]*i,a[s*4+1]=e[1]*o+e[5]*n+e[9]*r+e[13]*i,a[s*4+2]=e[2]*o+e[6]*n+e[10]*r+e[14]*i,a[s*4+3]=e[3]*o+e[7]*n+e[11]*r+e[15]*i}return a}},Ge=[],sl=new Map;function Ne(a){return a.index=Ge.length,a.snow=a.snow||0,a.leaf=a.leaf||[0],Ge.push(a),sl.set(a.id,a),a}const ol=a=>sl.get(a),jc=[[.455,.659,.353],[.91,.643,.188],[.91,.588,.588],[.33,.533,.463],[.588,.698,.471],[.878,.361,.275],[.957,.804,.376],[.376,.62,.502],[.7,.79,.47],[.53,.65,.51],[.8,.52,.56],[.6,.73,.74]],Xt=(a,e,t,s=.08)=>j(e-s,e+s,a)*(1-j(t-s,t+s,a));Ne({id:"meadow",name:"Larkmeadow",score:()=>.62,ground:[.455,.659,.353],ground2:[.588,.698,.471],rock:[.588,.557,.518],grass:1,sand:0,flowers:.8,leaf:[0,4,6],props:[["tree",.02,.5],["birch",.006,.08],["bush",.03,.1,0],["rock",.012,.02],["stump",.004,.02]],monsters:[["sproutling",6],["puffcap",3],["bristlehog",2]],particles:"pollen"});Ne({id:"grove",name:"Petalwood",score:a=>.5+(a.magic-.66)*4.5,ground:[.5,.68,.42],ground2:[.62,.72,.5],rock:[.82,.64,.59],grass:1,sand:0,flowers:1,leaf:[2,2,10,4],props:[["tree",.1,.55],["birch",.02,.06,8],["bush",.04,.1,2],["rock",.01,.02]],monsters:[["wisp",4],["sproutling",3],["puffcap",3]],variant:{prefix:"Petal",pencil:[232,150,150]},particles:"petals"});Ne({id:"pinewood",name:"Deepfir",score:a=>.5+(.4-a.temp)*4+(a.moist-.5)*1.5+j(8,13,a.elev)*.5,ground:[.455,.612,.541],ground2:[.44,.58,.4],rock:[.5,.52,.56],grass:.55,sand:0,flowers:.15,leaf:[3,3,7],props:[["pine",.2,.75,3],["rock",.03,.03],["bush",.02,.05,7],["mushroom",.01,.03],["stump",.01,.03],["deadtree",.005,.02]],monsters:[["bristlehog",5],["puffcap",4],["wisp",2]],variant:{prefix:"Fir",pencil:[86,128,112]},particles:"pollen"});Ne({id:"amberwood",name:"Amberwood",score:a=>.5+(a.temp-.66)*3.2+(.5-a.moist)*1,ground:[.86,.76,.46],ground2:[.69,.72,.45],rock:[.69,.5,.33],grass:.85,sand:0,flowers:.3,leaf:[1,5,6],props:[["tree",.07,.6],["bush",.03,.08,1],["rock",.02,.02],["stump",.01,.02],["deadtree",.004,.01]],monsters:[["bristlehog",5],["sproutling",3],["cragling",2]],variant:{prefix:"Amber",pencil:[240,158,74]},particles:"leaves"});Ne({id:"shore",name:"Saltreach",score:a=>.5+Math.min((1.15-a.elev)*1.8,.9)-j(.66,.8,a.moist)*a.far*.9,ground:[.886,.737,.51],ground2:[.92,.82,.62],rock:[.588,.557,.518],grass:0,sand:1,flowers:0,leaf:[7],props:[["palm",.05,.1,7],["rock",.03,.03],["bush",.01,.02,7],["reeds",.01,.02]],monsters:[["shellsnap",6],["sproutling",1]],variant:{prefix:"Tide",pencil:[70,150,150]},particles:"pollen"});Ne({id:"highland",name:"Skyfell",score:a=>.5+(a.elev-15)*.35,ground:[.59,.66,.5],ground2:[.588,.557,.518],rock:[.52,.54,.6],grass:.5,sand:0,flowers:.1,leaf:[3],props:[["rock",.1,.12],["pine",.04,.18,3],["crystal",.012,.012],["cairn",.012,.012]],monsters:[["cragling",6],["wisp",2]],variant:{prefix:"Crag",pencil:[112,118,140]},particles:"snow"});Ne({id:"wheat",name:"Strawmere",score:a=>.5+Xt(a.temp,.46,.66)*Xt(a.moist,.3,.56)*Xt(a.wild,0,.42)*a.far*.6-j(6,10,a.elev),ground:[.93,.8,.42],ground2:[.88,.7,.34],rock:[.69,.5,.33],grass:.9,sand:0,flowers:.35,leaf:[0,6],props:[["haystack",.035,.05],["fence",.03,.03],["tree",.012,.1],["scarecrow",.006,.006],["bush",.01,.03,6]],monsters:[["sproutling",5],["bristlehog",4],["puffcap",1]],variant:{prefix:"Straw",pencil:[232,164,48]},particles:"pollen"});Ne({id:"marsh",name:"Reedmarsh",score:a=>.5+j(.66,.8,a.moist)*(1-j(3.5,7,a.elev))*a.far*1.1,ground:[.5,.63,.5],ground2:[.6,.66,.44],rock:[.5,.52,.5],grass:.8,sand:0,flowers:.2,leaf:[9,9,7],props:[["reeds",.16,.2],["willow",.05,.3],["deadtree",.02,.04],["mushroom",.02,.04],["bush",.02,.05,9],["stump",.01,.02]],monsters:[["shellsnap",4],["wisp",3],["puffcap",3]],variant:{prefix:"Marsh",pencil:[96,140,120]},particles:"fireflies"});Ne({id:"frost",name:"Hoarwood",score:a=>.5+j(.3,.16,a.temp)*a.far*.9,ground:[.72,.8,.86],ground2:[.62,.72,.8],rock:[.52,.56,.66],grass:.1,sand:0,flowers:0,snow:.92,leaf:[11,3],props:[["pine",.1,.5,11],["deadtree",.02,.04],["rock",.03,.03],["crystal",.012,.02],["stump",.005,.02]],monsters:[["cragling",4],["wisp",3],["bristlehog",3]],variant:{prefix:"Frost",pencil:[176,198,222]},particles:"snow"});Ne({id:"heath",name:"Roseheath",score:a=>.5+Xt(a.wild,.58,.8)*Xt(a.temp,.3,.7,.1)*a.far*.6-j(.62,.75,a.moist)*.3,ground:[.78,.6,.62],ground2:[.62,.68,.5],rock:[.6,.56,.58],grass:.75,sand:0,flowers:.6,leaf:[10,8],props:[["bush",.12,.2,10],["stone",.01,.01],["cairn",.012,.012],["rock",.03,.03],["birch",.01,.12,8],["deadtree",.005,.01]],monsters:[["wisp",4],["sproutling",3],["bristlehog",3]],variant:{prefix:"Heath",pencil:[206,124,136]},particles:"petals"});Ne({id:"capwood",name:"Capwood",score:a=>.5+j(.34,.2,a.magic)*j(.42,.6,a.moist)*a.far*.9,ground:[.42,.56,.56],ground2:[.5,.58,.46],rock:[.46,.5,.58],grass:.6,sand:0,flowers:.1,leaf:[7,3],props:[["bigcap",.12,.6],["mushroom",.06,.1],["stump",.02,.03],["bush",.02,.04,7],["rock",.015,.02]],monsters:[["puffcap",7],["sproutling",2],["wisp",2]],variant:{prefix:"Gloom",pencil:[84,108,156]},particles:"fireflies"});Ne({id:"birchwood",name:"Silverbirch",score:a=>.5+Xt(a.temp,.28,.46)*Xt(a.moist,.34,.6)*Xt(a.magic,.36,.6)*a.far*.5,ground:[.66,.76,.5],ground2:[.74,.78,.52],rock:[.62,.6,.58],grass:1,sand:0,flowers:.7,leaf:[8,6,0],props:[["birch",.12,.7],["bush",.03,.06,8],["rock",.012,.02],["stump",.01,.02],["mushroom",.006,.02]],monsters:[["sproutling",5],["puffcap",3],["wisp",2]],variant:{prefix:"Birch",pencil:[214,204,172]},particles:"leaves"});Ne({id:"cinder",name:"Cinderfell",score:a=>.5+j(.76,.9,a.wild)*j(.4,.6,a.temp)*a.far*1.2,ground:[.5,.42,.42],ground2:[.62,.46,.38],rock:[.34,.33,.38],grass:.2,sand:0,flowers:0,leaf:[5,1],props:[["deadtree",.08,.2],["rock",.08,.1],["campfire",.012,.012],["cairn",.02,.02],["crystal",.006,.01]],monsters:[["cragling",6],["wisp",3],["bristlehog",2]],variant:{prefix:"Cinder",pencil:[122,62,44]},particles:"leaves"});Ne({id:"crypt",name:"Crypt",hidden:!0,score:()=>-10,ground:[.7,.65,.58],ground2:[.62,.59,.54],rock:[.56,.53,.5],grass:0,sand:0,flowers:0,props:[],monsters:[["sproutling",1]],particles:"dust"});Ne({id:"cave",name:"Cavern",hidden:!0,score:()=>-10,ground:[.62,.54,.44],ground2:[.55,.5,.43],rock:[.5,.48,.46],grass:0,sand:.3,flowers:0,props:[],monsters:[["sproutling",1]],particles:"dust"});function es(a,e,t){let s=Math.imul(a|0,668265261)^Math.imul(e|0,374761393)^Math.imul(t|0,2654435761)|0;return s=Math.imul(s^s>>>15,2246822507),s=Math.imul(s^s>>>13,3266489909),(s^s>>>16)>>>0}const ce=(a,e,t)=>es(a,e,t)/4294967296,Hs=[1,-1,1,-1,1.4142,-1.4142,0,0],Ds=[1,1,-1,-1,0,0,1.4142,-1.4142];function De(a,e,t=0){const s=Math.floor(a),o=Math.floor(e),n=a-s,r=e-o,i=n*n*n*(n*(n*6-15)+10),l=r*r*r*(r*(r*6-15)+10),c=es(s,o,t)&7,d=es(s+1,o,t)&7,p=es(s,o+1,t)&7,f=es(s+1,o+1,t)&7,u=Hs[c]*n+Ds[c]*r,m=Hs[d]*(n-1)+Ds[d]*r,g=Hs[p]*n+Ds[p]*(r-1),v=Hs[f]*(n-1)+Ds[f]*(r-1),x=u+(m-u)*i,b=g+(v-g)*i;return x+(b-x)*l}function at(a,e,t,s=0,o=2.03,n=.5){let r=1,i=0,l=0;for(let c=0;c<t;c++)i+=r*De(a,e,s+c*131),l+=r,a*=o,e*=o,r*=n;return i/l}function Uc(a,e,t,s=0){let o=1,n=0,r=0,i=1;for(let l=0;l<t;l++){let c=1-Math.abs(De(a,e,s+l*71));c*=c,n+=c*o*i,r+=o,i=c,a*=2.1,e*=2.1,o*=.5}return n/r}function Wc(a){let e=a>>>0;return()=>{e=e+1831565813>>>0;let t=e;return t=Math.imul(t^t>>>15,t|1),t^=t+Math.imul(t^t>>>7,t|61),((t^t>>>14)>>>0)/4294967296}}const nl=new Map;function Nt(a,e){nl.set(a,typeof e=="function"?e:()=>e)}const Kc=`#version 300 es
precision highp float;
precision highp int;
precision highp sampler2D;
`;function Gc(a={}){const e={WORLD_TEX:ne.TEX.toFixed(1),CELL:ne.CELL.toFixed(1),CELLS:ne.TEX/ne.CELL|0,SEA:ne.SEA.toFixed(2),PROP_HMAX:ne.PROP_HMAX.toFixed(2),VIEW_DIST:ne.VIEW.toFixed(1),MAX_CASTERS:xe.MAX_CASTERS,MAX_LIGHTS:xe.MAX_LIGHTS,MAX_BLIPS:xe.MAX_BLIPS,...a};return Object.entries(e).map(([t,s])=>`#define ${t} ${s}`).join(`
`)+`
`}function kr(a,e){const t=new Set,s=o=>o.replace(/^[ \t]*#include <([\w./-]+)>[ \t]*$/gm,(n,r)=>{if(t.has(r))return"";t.add(r);const i=nl.get(r);if(!i)throw new Error(`Unknown shader chunk <${r}>`);return s(i())});return Kc+Gc(e)+s(a)}const Ra=[],rl=new Map;function te(a){return a.type=Ra.length+1,a.scale=a.scale||[1,1],Ra.push(a),rl.set(a.id,a),a}const ho=a=>rl.get(a);Nt("props",()=>`
struct Prop { int type; vec3 base; float rot; float scale; float seed; float pal; };
${Ra.map(a=>a.glsl).join(`
`)}
float propSdf(vec3 q, Prop pr, out float mat) {
  mat = 0.0;
  switch (pr.type) {
${Ra.map(a=>`    case ${a.type}: return sdf_${a.id}(q, pr, mat);`).join(`
`)}
  }
  return 1e3;
}
bool propSeeThrough(int type, float mat) {
  if (mat < 0.5 || mat > 1.5) return false;
  return ${Ra.filter(a=>a.seeThrough).map(a=>`type == ${a.type}`).join(" || ")||"false"};
}
void propMat(vec3 q, float mat, Prop pr, inout Surf s) {
  switch (pr.type) {
${Ra.map(a=>`    case ${a.type}: mat_${a.id}(q, mat, pr, s); break;`).join(`
`)}
  }
}
`);te({id:"tree",seeThrough:!0,reach:1.5,height:4.5,collide:.34,scale:[.82,1.2],map:[.25,.45,.22],glsl:`
float sdf_tree(vec3 q, Prop pr, out float mat) {
q.xz += 0.035 * sin(uTime * 1.2 + pr.seed * 30.0) * max(q.y - 1.2, 0.0) * vec2(0.8, 0.5);
float trunk = sdTaper(q, vec3(0.0), vec3(0.06, 2.3, 0.02), 0.2, 0.1);
float bound = length(q - vec3(0.0, 3.0, 0.0)) - 1.75;
if (bound > 0.7) { mat = trunk < bound ? 0.0 : 1.0; return min(trunk, bound); }
vec3 w = vec3(pr.seed - 0.5, 0.0, fract(pr.seed * 7.3) - 0.5) * 0.3;
float can = length(q - vec3(0.0, 3.0, 0.0)) - 1.05;
can = smin(can, length(q - vec3(0.66, 2.5, 0.3) - w) - 0.78, 0.16);
can = smin(can, length(q - vec3(-0.6, 2.6, -0.4) + w) - 0.76, 0.16);
can = smin(can, length(q - vec3(-0.15, 2.45, 0.74) - w.zyx) - 0.68, 0.16);
can = smin(can, length(q - vec3(0.2, 3.75, -0.2) + w.zyx) - 0.66, 0.16);
can += 0.06 * sin(q.x * 4.7 + pr.seed * 17.0) * sin(q.y * 5.1) * sin(q.z * 4.9 + 1.3);
can += 0.022 * sin(q.x * 10.3 + 2.0) * sin(q.y * 9.1 + pr.seed * 9.0) * sin(q.z * 9.7);
mat = trunk < can ? 0.0 : 1.0;
return min(trunk, can) * 0.7;
}
void leafSurf(vec3 q, Prop pr, inout Surf s, float lo, float hi) {
vec3 leaf = uLeafPal[int(pr.pal + 0.5)];
float clump = vnoise3(q * 2.3 + pr.seed * 10.0);
float lift = smoothstep(lo, hi, q.y);
s.albedo = mix(leaf, mix(leaf, P_BUTTER, 0.45), smoothstep(0.56, 0.66, clump) * mix(0.35, 0.9, lift));
s.cover = mix(0.62, 0.9, clump);
s.soft = 1.0;
s.ink = penLine((clump - 0.44) / 1.9) * 0.42;
s.wrap = 0.5; s.leafy = 1.0;
s.occ = mix(0.55, 1.0, lift) * mix(0.72, 1.0, smoothstep(0.22, 0.42, clump));
}
void barkSurf(vec3 q, Prop pr, inout Surf s) {
float a = atan(q.z, q.x);
float streak = vnoise(vec2(a * 3.0, q.y * 1.6 + pr.seed * 10.0));
s.albedo = mix(P_BARK, P_UMBER, streak * 0.55);
s.cover = 0.78;
s.ink = penLine((abs(fract(a * 1.3 + vnoise(vec2(q.y * 2.0, pr.seed * 7.0)) * 0.8) - 0.5)) / 1.3 * 0.18) * step(0.55, streak) * 0.5;
}
void mat_tree(vec3 q, float mat, Prop pr, inout Surf s) {
if (mat < 0.5) { barkSurf(q, pr, s); return; }
leafSurf(q, pr, s, 2.1, 4.2);
if (fract(pr.seed * 7.13) < 0.3 && pr.pal < 0.5) {
vec2 v = voronoi(q.xy * 2.6 + q.z * 1.9 + pr.seed * 20.0);
float fruit = smoothstep(0.13, 0.09, v.x) * step(0.72, v.y);
s.albedo = mix(s.albedo, P_POPPY, fruit);
s.cover = mix(s.cover, 0.95, fruit);
}
}
`});te({id:"pine",seeThrough:!0,reach:1.42,height:5.7,collide:.3,scale:[.8,1.25],map:[.13,.32,.27],glsl:`
float sdf_pine(vec3 q, Prop pr, out float mat) {
q.xz += 0.02 * sin(uTime * 1.1 + pr.seed * 30.0) * max(q.y - 1.0, 0.0) * vec2(0.7, 0.4);
float trunk = sdCylinder(q, 0.15, 1.6);
float fr = 0.07 * sin(q.x * 5.0 + pr.seed * 20.0) * sin(q.z * 5.0 + q.y * 2.0);
float c1 = sdConeUp(q - vec3(0.0, 0.9, 0.0), 1.3 + fr, 2.3);
float c2 = sdConeUp(q - vec3(0.0, 2.3, 0.0), 1.05 + fr, 2.1);
float c3 = sdConeUp(q - vec3(0.0, 3.6, 0.0), 0.75 + fr, 2.0);
float can = min(c1, min(c2, c3)) - 0.05;
mat = trunk < can ? 0.0 : 1.0;
return min(trunk, can) * 0.82;
}
void mat_pine(vec3 q, float mat, Prop pr, inout Surf s) {
if (mat < 0.5) { barkSurf(q, pr, s); return; }
leafSurf(q, pr, s, 1.0, 5.4);
float tier = fract((q.y - 0.9) / 1.35);
s.occ *= mix(0.6, 1.0, smoothstep(0.0, 0.6, tier));
s.ink = max(s.ink * 0.6, penLine(tier * 1.35) * 0.75);
s.cover = mix(s.cover, 0.12, gSnow * smoothstep(0.55, 0.95, tier));
}
`});te({id:"bush",seeThrough:!0,reach:1,height:1.1,collide:0,scale:[.7,1.25],map:[.3,.5,.25],glsl:`
float sdf_bush(vec3 q, Prop pr, out float mat) {
mat = 1.0;
q.xz += 0.02 * sin(uTime * 1.6 + pr.seed * 30.0) * q.y;
float d = length(q - vec3(0.0, 0.42, 0.0)) - 0.6;
d = smin(d, length(q - vec3(0.48, 0.33, 0.15)) - 0.44, 0.2);
d = smin(d, length(q - vec3(-0.4, 0.36, -0.25)) - 0.48, 0.2);
d += 0.04 * sin(q.x * 7.0 + pr.seed * 9.0) * sin(q.y * 7.5) * sin(q.z * 6.5);
return d * 0.82;
}
void mat_bush(vec3 q, float mat, Prop pr, inout Surf s) {
leafSurf(q, pr, s, 0.1, 0.9);
vec2 v = voronoi(q.xz * 5.0 + q.y * 3.0 + pr.seed * 20.0);
float berry = smoothstep(0.16, 0.1, v.x) * step(0.6, v.y) * step(0.35, q.y);
bool bloom = pr.pal > 1.5 && pr.pal < 2.5;
s.albedo = mix(s.albedo, bloom ? PAPER : P_POPPY, berry);
s.cover = mix(s.cover, bloom ? 0.0 : 0.95, berry);
}
`});te({id:"palm",seeThrough:!0,reach:1.7,height:4,collide:.26,scale:[.85,1.05],map:[.3,.52,.4],glsl:`
float sdf_palm(vec3 q, Prop pr, out float mat) {
vec3 b = vec3(0.22, 1.6, 0.0), c = vec3(0.55, 3.1, 0.0);
float trunk = min(sdTaper(q, vec3(0.0), b, 0.17, 0.12), sdTaper(q, b, c, 0.12, 0.09));
vec3 h = q - c;
h.xz -= 0.04 * sin(uTime * 1.3 + pr.seed * 30.0);
float bound = length(h) - 1.2;
if (bound > 0.6) { mat = 0.0; return min(trunk, bound); }
float sec = TAU / 7.0;
float a = mod(atan(h.z, h.x) + sec * 0.5, sec) - sec * 0.5;
float r = length(h.xz);
vec3 f = vec3(r * cos(a), h.y, r * sin(a));
float droop = 0.35 * f.x - 0.48 * f.x * f.x;
vec3 g = vec3(f.x - 0.57, f.y - droop, f.z);
float frond = sdRoundBox(g, vec3(0.55, 0.025, 0.17 * (1.0 - 0.75 * abs(g.x) / 0.55) + 0.03), 0.02) * 0.6;
float nuts = length(h - vec3(0.0, -0.12, 0.0)) - 0.17;
mat = trunk < min(frond, nuts) ? 0.0 : (frond < nuts ? 1.0 : 2.0);
return min(trunk, min(frond, nuts));
}
void mat_palm(vec3 q, float mat, Prop pr, inout Surf s) {
if (mat < 0.5) {
s.albedo = mix(P_TAN, P_BARK, 0.5);
s.cover = 0.7;
s.ink = penLine((abs(fract(q.y * 2.6) - 0.5)) / 2.6) * 0.6;
} else if (mat < 1.5) {
leafSurf(q, pr, s, 2.2, 3.6);
s.ink = max(s.ink * 0.4, 0.0);
} else { s.albedo = P_UMBER; s.cover = 0.9; }
}
`});te({id:"mushroom",reach:.75,height:1.3,collide:.2,scale:[.7,1.5],map:[.7,.3,.25],glsl:`
float sdf_mushroom(vec3 q, Prop pr, out float mat) {
float stem = sdTaper(q, vec3(0.0), vec3(0.04, 0.72, 0.0), 0.14, 0.09);
vec3 c = q - vec3(0.04, 0.7, 0.0);
float cap = max(length(c * vec3(1.0, 1.55, 1.0)) - 0.6, -c.y - 0.03) * 0.65;
vec3 c2 = q - vec3(-0.42, 0.3, 0.3);
float small = min(sdCapsule(q, vec3(-0.4, 0.0, 0.28), vec3(-0.42, 0.3, 0.3), 0.06),
max(length(c2 * vec3(1.0, 1.5, 1.0)) - 0.26, -c2.y - 0.02) * 0.65);
float caps = min(cap, small);
mat = stem < caps ? 0.0 : 1.0;
return min(stem, caps);
}
void mat_mushroom(vec3 q, float mat, Prop pr, inout Surf s) {
if (mat < 0.5) { s.albedo = P_CREAM; s.cover = 0.3; return; }
vec2 v = voronoi(q.xz * 4.5 + pr.seed * 20.0);
float under = step(q.y, q.x < -0.2 ? 0.3 : 0.69);
float spot = smoothstep(0.22, 0.16, v.x) * (1.0 - under);
s.albedo = mix(pr.seed > 0.5 ? P_POPPY : P_SLATE, P_TAN, under);
s.cover = mix(mix(0.86, 0.35, under), 0.0, spot);
s.ink = max(penLine((v.x - 0.19) / 4.5) * (1.0 - under) * 0.6,
under * smoothstep(0.2, 0.0, abs(fract(atan(q.z, q.x - 0.04) * 3.0) - 0.5)) * 0.5);
s.glow = spot * uNight * 0.8;
}
`});te({id:"rock",reach:1.25,height:1.5,collide:.8,scale:[.5,1.35],map:[.5,.5,.52],glsl:`
const vec3 ROCK_N[5] = vec3[5](vec3(0.83, 0.52, 0.21), vec3(-0.61, 0.61, 0.51), vec3(0.1, 0.7, -0.71),
vec3(-0.5, 0.31, -0.81), vec3(0.3, 0.9, 0.31));
float rockBody(vec3 c, float r, float seed) {
float d = length(c * vec3(1.0, 1.2, 1.0)) - r;
for (int i = 0; i < 5; i++) d = max(d, dot(c, ROCK_N[i]) - r * (0.62 + 0.25 * fract(seed * (7.0 + float(i) * 3.3))));
return d - 0.04;
}
float sdf_rock(vec3 q, Prop pr, out float mat) {
mat = 0.0;
float d = rockBody(q - vec3(0.0, 0.3, 0.0), 0.95, pr.seed);
vec3 c2 = q - vec3(0.75, 0.1, 0.35);
c2.xz = c2.zx;
return min(d, rockBody(c2, 0.45, pr.seed + 0.37)) * 0.9;
}
void mat_rock(vec3 q, float mat, Prop pr, inout Surf s) {
float strata = vnoise(vec2(q.y * 6.0 + vnoise(q.xz * 2.0) * 2.0, pr.seed * 9.0));
s.albedo = uRockCol;
s.cover = mix(0.5, 0.8, strata);
s.ink = smoothstep(0.04, 0.0, abs(fract(strata * 2.0 + 0.25) - 0.5)) * 0.65;
s.moss = 1.0;
}
`});te({id:"crystal",reach:.9,height:2,collide:.55,scale:[.8,1.5],map:[.5,.8,.95],light:{color:[.35,.75,1],radius:5,y:1,always:!0},glsl:`
float crystalShard(vec3 q, float r, float h) {
float hx = max(abs(q.x) * 0.866 + abs(q.z) * 0.5, abs(q.z));
float d = max(hx - r, -q.y);
return max(d, (q.y - h) * 0.55 + hx * 0.85) * 0.8;
}
float sdf_crystal(vec3 q, Prop pr, out float mat) {
mat = 0.0;
float d = crystalShard(q, 0.26, 1.9);
vec3 a = q; a.xy = rot2(0.5) * a.xy;
d = min(d, crystalShard(a - vec3(0.12, 0.0, 0.1), 0.18, 1.3));
vec3 b = q; b.zy = rot2(-0.6) * b.zy; b.xy = rot2(-0.35) * b.xy;
d = min(d, crystalShard(b - vec3(-0.1, 0.0, -0.05), 0.16, 1.15));
return d;
}
void mat_crystal(vec3 q, float mat, Prop pr, inout Surf s) {
float band = 0.5 + 0.5 * sin(q.y * 5.0 + q.x * 3.0 + uTime * 1.5);
s.albedo = mix(P_TEAL, P_SKY, band);
s.cover = mix(0.75, 0.1, smoothstep(0.55, 0.9, band));
s.glow = 0.25 + 0.3 * band;
}
`});te({id:"stone",reach:.6,height:2.6,collide:.5,scale:[.9,1.2],map:[.6,.6,.65],glsl:`
float sdf_stone(vec3 q, Prop pr, out float mat) {
mat = 0.0;
q.xy = rot2(0.06 * (pr.seed - 0.5) * 4.0) * q.xy;
float w = 0.42 - 0.06 * q.y;
return sdRoundBox(q - vec3(0.0, 1.2, 0.0), vec3(w, 1.25, 0.22), 0.1) * 0.9;
}
void mat_stone(vec3 q, float mat, Prop pr, inout Surf s) {
float n = vnoise(q.xy * 5.0 + pr.seed * 9.0);
s.albedo = uRockCol;
s.cover = mix(0.5, 0.75, n);
vec2 r = vec2(q.x, q.y - 1.5);
float sp = abs(fract(length(r) * 3.2 - atan(r.y, r.x) / TAU) - 0.5);
float rune = smoothstep(0.1, 0.03, sp) * step(length(r), 0.3) * step(0.15, abs(q.z));
s.albedo = mix(s.albedo, P_TEAL, rune);
s.cover = mix(s.cover, 0.9, rune);
s.glow = rune * uNight * 0.7;
s.ink = smoothstep(0.03, 0.0, abs(fract(n * 2.0) - 0.5)) * 0.4;
s.moss = 0.6;
}
`});te({id:"house",reach:3.4,height:4.5,collide:2.5,map:[.75,.42,.3],light:{color:[1,.72,.4],radius:6,y:1.4,forward:2.3},glsl:`
float sdf_house(vec3 q, Prop pr, out float mat) {
float body = sdBox(q - vec3(0.0, 1.25, 0.0), vec3(2.2, 1.25, 1.7));
vec2 rz = vec2(abs(q.z), q.y);
float side = dot(rz - vec2(2.15, 2.3), vec2(0.572, 0.82));
float roof = max(max(side, 2.3 - q.y), abs(q.x) - 2.5);
float gable = max(max(side + 0.22, 2.3 - q.y), abs(q.x) - 2.2);
float chim = sdBox(q - vec3(1.25, 3.5, 0.7), vec3(0.27, 0.75, 0.27));
float walls = min(body, gable);
float step_ = sdBox(q - vec3(0.0, 0.08, 1.9), vec3(0.6, 0.08, 0.25));
mat = 0.0;
float d = walls;
if (roof < d) { d = roof; mat = 1.0; }
if (chim < d) { d = chim; mat = 2.0; }
if (step_ < d) { d = step_; mat = 2.0; }
return d;
}
void mat_house(vec3 q, float mat, Prop pr, inout Surf s) {
if (mat > 1.5) {
vec2 pv = pavers(q.xy * 3.0 + q.z * 2.0);
s.albedo = fract(pv.y * 5.3) < 0.5 ? P_PEACH : P_CLAY;
s.cover = mix(0.3, 0.7, pv.y);
s.ink = penLine(0.5 * pv.x / 3.0) * 0.8;
return;
}
if (mat > 0.5) {
float run = abs(q.z) * 3.2 - q.y * 0.4;
float row = fract(run);
if (pr.seed < 0.34) {
s.albedo = mix(P_WOOD, P_HONEY, 0.35); s.cover = 0.72;
float straw = vnoise(vec2(q.x * 9.0, run * 0.7));
s.ink = max(penLine(row / 3.2) * 0.65, penLine((abs(fract(q.x * 3.5 + straw) - 0.5)) / 3.5) * step(0.5, straw) * 0.5);
} else {
s.albedo = pr.seed < 0.67 ? mix(P_BRICK, P_POPPY, 0.4) : P_SLATE;
float col = fract(q.x * 2.4 + floor(run) * 0.5);
s.cover = mix(0.6, 0.9, hash12(vec2(floor(q.x * 2.4 + floor(run) * 0.5), floor(run))));
s.ink = max(penLine(row / 3.2) * 0.75, penLine(col / 2.4) * 0.4);
}
s.cover = mix(s.cover, 0.08, gSnow * 0.85);
return;
}
bool front = abs(q.z) > 1.69;
vec2 f = front ? vec2(q.x, q.y) : vec2(q.z, q.y);
float tim = min(abs(f.y - 2.4) - 0.1, abs(abs(f.x) - (front ? 2.1 : 1.6)) - 0.09);
tim = min(tim, f.y - 0.2);
tim = min(tim, max(abs(f.y - 3.0) - 0.05, 2.5 - f.y));
s.albedo = P_CREAM; s.cover = 0.16;
if (tim < 0.0) { s.albedo = P_BARK; s.cover = 0.85; }
s.ink = penLine(tim) * 0.8;
vec2 w = vec2(abs(f.x) - (front ? 1.25 : 0.0), f.y - 1.45);
float dw = max(abs(w.x) - 0.36, abs(w.y) - 0.42);
float lit = step(0.25, fract(pr.seed * 7.3 + floor(f.x + 3.0) * 0.37 + (front ? 0.0 : 0.5)));
if (dw < 0.0) {
s.albedo = P_SLATE; s.cover = mix(0.7, 0.0, uNight * lit);
s.glow = uNight * lit;
s.ink = max(penLine(w.x), penLine(w.y)) * 0.8;
}
s.ink = max(s.ink, penLine(dw) * 0.9);
if (q.z > 1.69) {
float dd = max(abs(q.x) - 0.42, q.y - 1.55);
if (dd < 0.0) {
s.albedo = mix(P_BARK, P_UMBER, 0.35); s.cover = 0.82; s.glow = 0.0;
s.ink = penLine((abs(fract(q.x * 3.5) - 0.5)) / 3.5) * 0.5;
float knob = step(length(vec2(q.x - 0.27, q.y - 0.8)), 0.06);
s.albedo = mix(s.albedo, P_HONEY, knob); s.cover = mix(s.cover, 0.95, knob);
}
s.ink = max(s.ink, penLine(dd) * 0.9);
}
}
`});te({id:"lamp",reach:.35,height:3,collide:.15,map:[1,.85,.5],light:{color:[1,.7,.36],radius:9,y:2.5},glsl:`
float sdf_lamp(vec3 q, Prop pr, out float mat) {
float post = min(sdCylinder(q, 0.055, 2.35), sdCylinder(q, 0.13, 0.25));
float glass = sdRoundBox(q - vec3(0.0, 2.55, 0.0), vec3(0.15, 0.2, 0.15), 0.04);
float cap = sdConeUp(q - vec3(0.0, 2.74, 0.0), 0.27, 0.22);
float iron = min(post, cap);
mat = glass < iron ? 1.0 : 0.0;
return min(iron, glass);
}
void mat_lamp(vec3 q, float mat, Prop pr, inout Surf s) {
if (mat < 0.5) { s.albedo = P_CHARCOAL; s.cover = 0.9; return; }
s.albedo = P_BUTTER;
s.cover = mix(0.45, 0.0, uNight);
s.glow = uNight;
}
`});te({id:"waystone",reach:1.1,height:3.9,collide:.75,map:[.4,.9,1],light:{color:[.35,.8,1],radius:8,y:3.2,always:!0},glsl:`
float sdf_waystone(vec3 q, Prop pr, out float mat) {
float base = min(sdCylinder(q, 1.05, 0.16), sdCylinder(q, 0.75, 0.32));
float w = 0.4 - 0.065 * q.y;
float mono = sdRoundBox(q - vec3(0.0, 1.7, 0.0), vec3(w, 1.45, w * 0.72), 0.06) * 0.9;
float orb = length(q - vec3(0.0, 3.55 + 0.08 * sin(uTime * 1.4), 0.0)) - 0.2;
float stone = min(base, mono);
mat = orb < stone ? 1.0 : 0.0;
return min(stone, orb);
}
void mat_waystone(vec3 q, float mat, Prop pr, inout Surf s) {
if (mat > 0.5) { s.albedo = P_SKY; s.cover = 0.12; s.glow = 0.8; return; }
float n = vnoise(q.xy * 4.0 + q.z * 3.0);
s.albedo = mix(P_STONE, P_SLATE, 0.3);
s.cover = mix(0.5, 0.78, n);
float lines = smoothstep(0.08, 0.02, abs(fract(q.y * 1.6 + 0.2 * sin(q.x * 9.0)) - 0.5)) * step(0.5, q.y) * step(q.y, 3.0) * step(abs(q.x), 0.2);
float ring = smoothstep(0.06, 0.02, abs(length(q.xz) - 0.9)) * step(q.y, 0.2);
float rune = max(lines, ring);
s.albedo = mix(s.albedo, P_TEAL, rune);
s.cover = mix(s.cover, 0.92, rune);
s.glow = rune * (0.3 + 0.5 * uNight) * (0.6 + 0.4 * sin(uTime * 1.4 - q.y * 2.0));
s.ink = smoothstep(0.03, 0.0, abs(fract(n * 2.0) - 0.5)) * 0.35;
}
`});te({id:"stall",reach:1.75,height:2.6,collide:1.3,map:[.85,.6,.35],glsl:`
float sdf_stall(vec3 q, Prop pr, out float mat) {
float counter = sdBox(q - vec3(0.0, 0.5, 0.0), vec3(1.2, 0.5, 0.55));
vec3 a = vec3(abs(q.x) - 1.18, q.y, abs(q.z) - 0.55);
float posts = sdCylinder(a, 0.05, 2.1);
vec3 r = q - vec3(0.0, 2.2, 0.15);
r.zy = rot2(0.28) * r.zy;
float awn = sdBox(r, vec3(1.4, 0.035, 0.95));
float goods = length(vec3(mod(q.x + 0.3, 0.6) - 0.3, q.y - 1.08, q.z)) - 0.15;
goods = max(goods, abs(q.x) - 1.1);
float wood = min(counter, posts);
mat = 0.0;
float d = wood;
if (awn < d) { d = awn; mat = 1.0; }
if (goods < d) { d = goods; mat = 2.0; }
return d;
}
void mat_stall(vec3 q, float mat, Prop pr, inout Surf s) {
if (mat < 0.5) {
s.albedo = P_WOOD; s.cover = 0.7;
s.ink = penLine((abs(fract(q.y * 3.0 + q.x * 0.6) - 0.5)) / 3.0) * 0.55;
return;
}
if (mat < 1.5) {
float stripe = step(0.5, fract(q.x * 1.6));
s.albedo = pr.seed < 0.5 ? P_BRICK : P_SLATE;
s.cover = mix(0.06, 0.82, stripe);
s.ink = penLine((abs(fract(q.x * 3.2) - 0.5)) / 3.2) * 0.5;
return;
}
float k = floor((q.x + 0.3) / 0.6);
float pick = fract(k * 0.37 + pr.seed);
s.albedo = pick < 0.33 ? P_APRICOT : (pick < 0.66 ? P_LEAF : P_BUTTER);
s.cover = 0.85;
}
`});te({id:"well",reach:1.1,height:2.5,collide:.9,map:[.55,.55,.6],glsl:`
float sdf_well(vec3 q, Prop pr, out float mat) {
float ring = max(sdCylinder(q, 0.78, 0.7), -(length(q.xz) - 0.56));
float water = sdCylinder(q, 0.6, 0.45);
vec3 a = vec3(abs(q.x) - 0.7, q.y, q.z);
float posts = sdCylinder(a, 0.06, 1.9);
float roof = sdConeUp(q - vec3(0.0, 1.85, 0.0), 1.05, 0.62);
mat = 0.0;
float d = ring;
if (posts < d) { d = posts; mat = 1.0; }
if (roof < d) { d = roof; mat = 2.0; }
if (water < d) { d = water; mat = 3.0; }
return d;
}
void mat_well(vec3 q, float mat, Prop pr, inout Surf s) {
if (mat < 0.5) {
vec2 pv = pavers(vec2(atan(q.z, q.x) * 2.2, q.y * 3.2));
s.albedo = fract(pv.y * 5.3) < 0.5 ? P_PEACH : mix(P_STONE, P_CLAY, 0.5);
s.cover = mix(0.3, 0.7, pv.y);
s.ink = penLine(0.5 * pv.x / 3.0 * 0.75) * 0.8;
} else if (mat < 1.5) { s.albedo = P_BARK; s.cover = 0.8; }
else if (mat < 2.5) {
s.albedo = P_SLATE; s.cover = 0.8;
s.ink = penLine((abs(fract(q.y * 6.0) - 0.5)) / 6.0) * 0.5;
} else { s.albedo = P_TEAL; s.cover = 0.6; s.soft = 1.0; }
}
`});te({id:"birch",seeThrough:!0,reach:1.15,height:4.7,collide:.2,scale:[.85,1.2],map:[.6,.72,.45],glsl:`
float sdf_birch(vec3 q, Prop pr, out float mat) {
q.xz += 0.03 * sin(uTime * 1.3 + pr.seed * 30.0) * max(q.y - 1.5, 0.0) * vec2(0.8, 0.5);
float trunk = sdTaper(q, vec3(0.0), vec3(0.16 * (pr.seed - 0.5), 3.6, 0.0), 0.11, 0.05);
float bound = length(q - vec3(0.0, 3.5, 0.0)) - 1.4;
if (bound > 0.6) { mat = trunk < bound ? 0.0 : 1.0; return min(trunk, bound); }
float can = length((q - vec3(0.0, 3.9, 0.0)) * vec3(1.0, 0.8, 1.0)) - 0.76;
can = smin(can, length(q - vec3(0.5, 3.2, 0.2)) - 0.55, 0.14);
can = smin(can, length(q - vec3(-0.45, 3.35, -0.3)) - 0.53, 0.14);
can = smin(can, length(q - vec3(-0.1, 2.85, 0.5)) - 0.45, 0.14);
can += 0.04 * sin(q.x * 6.0 + pr.seed * 17.0) * sin(q.y * 6.3) * sin(q.z * 5.9);
mat = trunk < can ? 0.0 : 1.0;
return min(trunk, can) * 0.75;
}
void mat_birch(vec3 q, float mat, Prop pr, inout Surf s) {
if (mat > 0.5) { leafSurf(q, pr, s, 2.6, 4.4); return; }
s.albedo = P_CREAM; s.cover = 0.1;
float dash = step(0.6, vnoise(vec2(atan(q.z, q.x) * 2.0 + pr.seed * 9.0, floor(q.y * 3.3 + pr.seed))));
s.ink = dash * penLine((abs(fract(q.y * 3.3 + pr.seed) - 0.5)) / 3.3) * 0.85;
}
`});te({id:"willow",seeThrough:!0,reach:1.72,height:3.9,collide:.3,scale:[.85,1.08],map:[.4,.55,.42],glsl:`
float sdf_willow(vec3 q, Prop pr, out float mat) {
float trunk = sdTaper(q, vec3(0.0), vec3(0.1, 2.0, 0.05), 0.24, 0.14);
vec3 c = q - vec3(0.0, 2.3, 0.0);
c.xz += 0.04 * sin(uTime * 1.1 + pr.seed * 30.0 + q.y * 1.5) * max(2.3 - q.y, 0.0);
float dome = length(c * vec3(1.0, 0.82, 1.0)) - 1.55;
float hollow = length((c + vec3(0.0, 0.5, 0.0)) * vec3(1.0, 0.7, 1.0)) - 1.25;
float can = max(max(dome, -hollow), 0.55 - q.y);
can += 0.07 * sin(atan(c.z, c.x) * 9.0 + pr.seed * 20.0) * smoothstep(1.6, 0.6, q.y);
mat = trunk < can ? 0.0 : 1.0;
return min(trunk, can) * 0.7;
}
void mat_willow(vec3 q, float mat, Prop pr, inout Surf s) {
if (mat < 0.5) { barkSurf(q, pr, s); return; }
leafSurf(q, pr, s, 1.0, 3.6);
float strand = abs(fract(atan(q.z, q.x) * 4.5 + pr.seed * 3.0) - 0.5) / 4.5 * 1.2;
s.ink = max(s.ink * 0.4, penLine(strand) * smoothstep(2.6, 1.2, q.y) * 0.45);
}
`});te({id:"deadtree",reach:1.12,height:3.5,collide:.22,scale:[.8,1.25],map:[.5,.45,.4],glsl:`
float sdf_deadtree(vec3 q, Prop pr, out float mat) {
mat = 0.0;
float d = sdTaper(q, vec3(0.0), vec3(0.1, 2.4, 0.0), 0.2, 0.09);
d = min(d, sdTaper(q, vec3(0.06, 1.5, 0.0), vec3(0.9, 2.6, 0.2), 0.08, 0.03));
d = min(d, sdTaper(q, vec3(0.05, 1.9, 0.0), vec3(-0.75, 2.9, -0.25), 0.07, 0.03));
d = min(d, sdTaper(q, vec3(0.1, 2.4, 0.0), vec3(0.25, 3.4, 0.45), 0.06, 0.02));
d = min(d, sdTaper(q, vec3(0.6, 2.25, 0.13), vec3(1.05, 2.3, -0.3), 0.04, 0.02));
return d;
}
void mat_deadtree(vec3 q, float mat, Prop pr, inout Surf s) {
barkSurf(q, pr, s);
s.albedo = mix(s.albedo, P_STONE, 0.5);
s.cover = 0.66;
}
`});te({id:"reeds",reach:.62,height:1.75,collide:0,scale:[.8,1.3],map:[.42,.56,.36],glsl:`
float sdf_reeds(vec3 q, Prop pr, out float mat) {
float sec = TAU / 5.0;
float k = floor(atan(q.z, q.x) / sec + 0.5);
float ca = k * sec;
float h = 1.1 + 0.5 * fract(sin(k * 12.9898 + pr.seed * 78.233) * 43758.5453);
vec3 root = vec3(cos(ca) * 0.26, 0.0, sin(ca) * 0.26);
vec3 top = vec3(root.x * 1.7 + 0.05 * sin(uTime * 1.8 + pr.seed * 30.0 + k), h, root.z * 1.7);
float stem = sdCapsule(q, root, top, 0.026);
float head = sdCapsule(q, mix(root, top, 0.72), mix(root, top, 0.94), 0.058);
mat = head < stem ? 1.0 : 0.0;
return min(stem, head) * 0.8;
}
void mat_reeds(vec3 q, float mat, Prop pr, inout Surf s) {
if (mat > 0.5) { s.albedo = P_UMBER; s.cover = 0.95; }
else { s.albedo = P_GREEN; s.cover = 0.9; }
}
`});te({id:"bigcap",seeThrough:!0,reach:1.66,height:3.8,collide:.36,scale:[.75,1.2],map:[.6,.35,.3],glsl:`
float sdf_bigcap(vec3 q, Prop pr, out float mat) {
float lean = 0.24 * (pr.seed - 0.5);
float stem = sdTaper(q, vec3(0.0), vec3(lean, 2.7, 0.0), 0.3, 0.2);
vec3 c = q - vec3(lean, 2.7, 0.0);
float bound = length(c) - 1.72;
if (bound > 0.6) { mat = stem < bound ? 0.0 : 1.0; return min(stem, bound); }
float cap = max(length(c * vec3(1.0, 1.7, 1.0)) - 1.6, -c.y - 0.05) * 0.58;
mat = stem < cap ? 0.0 : 1.0;
return min(stem, cap);
}
void mat_bigcap(vec3 q, float mat, Prop pr, inout Surf s) {
if (mat < 0.5) { s.albedo = P_CREAM; s.cover = 0.26; s.ink = penLine((abs(fract(atan(q.z, q.x) * 1.6) - 0.5)) / 1.6 * 0.25) * 0.4; return; }
vec3 c = q - vec3(0.24 * (pr.seed - 0.5), 2.7, 0.0);
float under = step(c.y, 0.0);
vec2 v = voronoi(c.xz * 1.7 + pr.seed * 20.0);
float spot = smoothstep(0.26, 0.2, v.x) * (1.0 - under);
float pick = fract(pr.seed * 5.3);
s.albedo = mix(pick < 0.3 ? P_POPPY : (pick < 0.6 ? P_SLATE : (pick < 0.8 ? P_TEAL : P_HONEY)), P_TAN, under);
s.cover = mix(mix(0.86, 0.4, under), 0.0, spot);
s.ink = max(penLine((v.x - 0.23) / 1.7) * (1.0 - under) * 0.6,
under * penLine((abs(fract(atan(c.z, c.x) * 5.0) - 0.5)) / 5.0 * length(c.xz)) * 0.5);
s.soft = 1.0;
s.glow = spot * uNight * 0.8;
}
`});te({id:"stump",reach:.68,height:.5,collide:.4,scale:[.8,1.3],map:[.6,.48,.32],glsl:`
float sdf_stump(vec3 q, Prop pr, out float mat) {
float d = sdCylinder(q, 0.34 + 0.04 * sin(atan(q.z, q.x) * 5.0 + pr.seed * 9.0), 0.42);
float root = sdTaper(vec3(abs(q.x), q.y, abs(q.z)), vec3(0.24, 0.14, 0.24), vec3(0.5, 0.0, 0.5), 0.09, 0.04);
mat = (q.y > 0.4 && d < root) ? 1.0 : 0.0;
return min(d, root) * 0.85;
}
void mat_stump(vec3 q, float mat, Prop pr, inout Surf s) {
if (mat < 0.5) { barkSurf(q, pr, s); return; }
s.albedo = P_WOOD; s.cover = 0.5;
s.ink = penLine((abs(fract(length(q.xz) * 9.0 + 0.3) - 0.5)) / 9.0) * 0.6;
}
`});te({id:"cairn",reach:.72,height:1.45,collide:.6,scale:[.8,1.4],map:[.5,.5,.52],glsl:`
float sdf_cairn(vec3 q, Prop pr, out float mat) {
mat = 0.0;
float d = rockBody(q - vec3(0.0, 0.28, 0.0), 0.55, pr.seed);
vec3 b = q - vec3(0.05, 0.75, 0.0);
b.xz = b.zx;
d = min(d, rockBody(b, 0.38, pr.seed + 0.3));
d = min(d, rockBody(q - vec3(-0.03, 1.12, 0.04), 0.24, pr.seed + 0.6));
return d * 0.9;
}
void mat_cairn(vec3 q, float mat, Prop pr, inout Surf s) { mat_rock(q, mat, pr, s); s.moss = 0.4; }
`});te({id:"chest",reach:.8,height:.95,collide:.6,map:[.87,.7,.43],glsl:`
float sdf_chest(vec3 q, Prop pr, out float mat) {
float box = sdRoundBox(q - vec3(0.0, 0.3, 0.0), vec3(0.52, 0.29, 0.36), 0.03);
vec3 l = q - vec3(0.0, 0.58, 0.0);
if (pr.pal > 0.5) { l = q - vec3(0.0, 0.58, -0.36); l.yz = rot2(1.3) * l.yz; l.z -= 0.36; }
float lid = max(max(length(l.yz * vec2(1.0, 0.86)) - 0.31, -l.y), abs(l.x) - 0.54);
float latch = sdRoundBox(q - vec3(0.0, 0.5, 0.38), vec3(0.07, 0.1, 0.03), 0.012);
float d = min(box, lid);
mat = latch < d ? 2.0 : (lid < box ? 1.0 : 0.0);
return min(d, latch) * 0.9;
}
void mat_chest(vec3 q, float mat, Prop pr, inout Surf s) {
if (mat > 1.5) { s.albedo = P_BUTTER; s.cover = 0.9; return; }
s.albedo = mix(P_WOOD, P_BARK, 0.3 + 0.35 * mat); s.cover = 0.82;
s.ink = max(penLine(abs(abs(q.x) - 0.3) - 0.035), penLine(fract(q.y * 6.0 + 0.2) - 0.5) * 0.35 * (1.0 - mat));
}
`});te({id:"beacon",reach:1.5,height:9.2,collide:1.2,map:[.95,.6,.3],light:{color:[1,.7,.36],radius:13,y:8.4,always:!0},glsl:`
float sdf_beacon(vec3 q, Prop pr, out float mat) {
float tower = sdTaper(q, vec3(0.0, 0.0, 0.0), vec3(0.0, 7.3, 0.0), 1.2, 0.82);
float gallery = sdCylinder(q - vec3(0.0, 7.2, 0.0), 1.2, 0.28);
float bowl = sdCylinder(q - vec3(0.0, 7.48, 0.0), 0.55, 0.32);
float fire = sdEllipsoid(q - vec3(0.0, 8.35, 0.0), vec3(0.42, 0.66, 0.42));
float stone = min(tower, min(gallery, bowl));
mat = fire < stone ? 1.0 : 0.0;
return min(stone, fire) * 0.85;
}
void mat_beacon(vec3 q, float mat, Prop pr, inout Surf s) {
if (mat > 0.5) { s.albedo = P_APRICOT; s.cover = mix(0.5, 0.0, uNight); s.glow = 1.0; return; }
s.albedo = mix(P_STONE, P_TAN, 0.25 + 0.2 * pr.seed); s.cover = 0.72;
float course = fract(q.y / 0.62);
float ang = atan(q.z, q.x) * 3.0 + floor(q.y / 0.62) * 1.7;
s.ink = max(penLine(course - 0.5) * 0.5 * step(q.y, 7.2), penLine(fract(ang) - 0.5) * 0.3 * step(q.y, 7.2));
if (q.z > 0.6 && abs(q.x) < 0.3 && q.y < 1.3) { s.albedo = P_CHARCOAL; s.cover = 0.9; s.ink = 0.0; }
}
`});te({id:"haystack",reach:1,height:1.45,collide:.85,scale:[.8,1.2],map:[.9,.72,.3],glsl:`
float sdf_haystack(vec3 q, Prop pr, out float mat) {
mat = 0.0;
return max(sdEllipsoid(q - vec3(0.0, 0.5, 0.0), vec3(0.95, 0.92, 0.95)), -q.y);
}
void mat_haystack(vec3 q, float mat, Prop pr, inout Surf s) {
s.albedo = mix(P_HONEY, P_WOOD, 0.5); s.cover = 0.78; s.soft = 1.0;
float straw = vnoise(vec2(atan(q.z, q.x) * 6.0 + pr.seed * 9.0, q.y * 2.0));
s.ink = penLine((abs(fract(atan(q.z, q.x) * 3.0 + straw * 0.6) - 0.5)) / 3.0 * 0.6) * step(0.45, straw) * 0.5;
}
`});te({id:"fence",reach:1.28,height:1,collide:0,map:[.7,.55,.35],glsl:`
float sdf_fence(vec3 q, Prop pr, out float mat) {
mat = 0.0;
float posts = min(sdCylinder(vec3(abs(q.x) - 1.1, q.y, q.z), 0.07, 1.0), sdCylinder(q, 0.07, 0.95));
float rails = min(sdBox(q - vec3(0.0, 0.75, 0.0), vec3(1.2, 0.05, 0.03)), sdBox(q - vec3(0.0, 0.4, 0.0), vec3(1.2, 0.05, 0.03)));
return min(posts, rails);
}
void mat_fence(vec3 q, float mat, Prop pr, inout Surf s) {
s.albedo = P_WOOD; s.cover = 0.66;
s.ink = step(0.6, vnoise(q.xy * vec2(3.0, 18.0) + pr.seed * 9.0)) * 0.35;
}
`});te({id:"scarecrow",reach:.82,height:2.25,collide:.2,map:[.7,.4,.3],glsl:`
float sdf_scarecrow(vec3 q, Prop pr, out float mat) {
float pole = min(sdCylinder(q, 0.05, 1.9), sdCapsule(q, vec3(-0.75, 1.35, 0.0), vec3(0.75, 1.35, 0.0), 0.045));
float shirt = min(sdRoundBox(q - vec3(0.0, 1.12, 0.0), vec3(0.3, 0.36, 0.13), 0.08), sdCapsule(q, vec3(-0.62, 1.35, 0.0), vec3(0.62, 1.35, 0.0), 0.1));
float head = length(q - vec3(0.0, 1.78, 0.0)) - 0.2;
float hat = min(sdCylinder(q - vec3(0.0, 1.9, 0.0), 0.36, 0.035), sdConeUp(q - vec3(0.0, 1.9, 0.0), 0.2, 0.3));
mat = 0.0;
float d = pole;
if (shirt < d) { d = shirt; mat = 1.0; }
if (head < d) { d = head; mat = 2.0; }
if (hat < d) { d = hat; mat = 3.0; }
return d;
}
void mat_scarecrow(vec3 q, float mat, Prop pr, inout Surf s) {
if (mat < 0.5) { s.albedo = P_BARK; s.cover = 0.8; }
else if (mat < 1.5) {
s.albedo = pr.seed < 0.5 ? P_BRICK : P_SLATE; s.cover = 0.8;
s.ink = penLine(max(abs(q.x - 0.1) - 0.09, abs(q.y - 1.05) - 0.09)) * 0.7;
} else if (mat < 2.5) {
s.albedo = P_TAN; s.cover = 0.4;
vec2 e = vec2(abs(q.x) - 0.07, q.y - 1.8);
s.ink = max(penLine(abs(e.x) - abs(e.y)) * step(max(abs(e.x), abs(e.y)), 0.04), penLine(q.y - 1.7) * step(abs(q.x), 0.07)) * step(0.0, q.z);
} else { s.albedo = mix(P_WOOD, P_HONEY, 0.4); s.cover = 0.75; }
}
`});te({id:"windmill",reach:2.35,height:6.2,collide:1.25,map:[.85,.8,.7],glsl:`
float sdf_windmill(vec3 q, Prop pr, out float mat) {
float tower = max(sdTaper(q, vec3(0.0), vec3(0.0, 4.2, 0.0), 1.05, 0.7), q.y - 4.2);
float cap = sdConeUp(q - vec3(0.0, 4.2, 0.0), 0.86, 0.9);
vec3 h = q - vec3(0.0, 3.9, 0.9);
h.xy = rot2(floor(uTime * 12.0) / 12.0 * 0.55 + pr.seed * 6.0) * h.xy;
h.xy = abs(h.xy);
if (h.y > h.x) h.xy = h.yx;
float sails = min(sdBox(h - vec3(1.25, 0.15, 0.0), vec3(0.92, 0.2, 0.025)), sdBox(h - vec3(1.1, 0.0, 0.0), vec3(1.15, 0.035, 0.035)));
sails = min(sails, sdCapsule(q, vec3(0.0, 3.9, 0.6), vec3(0.0, 3.9, 0.98), 0.09));
mat = 0.0;
float d = tower;
if (cap < d) { d = cap; mat = 1.0; }
if (sails < d) { d = sails; mat = 2.0; }
return d * 0.85;
}
void mat_windmill(vec3 q, float mat, Prop pr, inout Surf s) {
if (mat > 1.5) {
vec3 h = q - vec3(0.0, 3.9, 0.9);
h.xy = rot2(floor(uTime * 12.0) / 12.0 * 0.55 + pr.seed * 6.0) * h.xy;
h.xy = abs(h.xy);
if (h.y > h.x) h.xy = h.yx;
s.albedo = P_CREAM; s.cover = 0.14;
s.ink = max(penLine((abs(fract(h.x * 4.0) - 0.5)) / 4.0), penLine(h.y - 0.15)) * 0.6 * step(0.05, h.y);
if (h.y < 0.05) { s.albedo = P_BARK; s.cover = 0.85; }
return;
}
if (mat > 0.5) { s.albedo = pr.seed < 0.5 ? P_SLATE : mix(P_BRICK, P_POPPY, 0.4); s.cover = 0.82; s.ink = penLine((abs(fract(q.y * 5.0) - 0.5)) / 5.0) * 0.5; return; }
s.albedo = P_CREAM; s.cover = 0.14;
float a = atan(q.x, q.z);
vec2 pv = pavers(vec2(a * 3.0, q.y * 2.6));
float foot = smoothstep(1.4, 0.3, q.y);
if (foot > 0.4) { s.albedo = fract(pv.y * 5.3) < 0.5 ? P_PEACH : P_CLAY; s.cover = mix(0.3, 0.65, pv.y); }
s.ink = penLine(0.5 * pv.x / 2.6) * 0.7 * foot;
float door = max(abs(a) * 1.0 - 0.3, q.y - 1.35);
if (door < 0.0) { s.albedo = mix(P_BARK, P_UMBER, 0.35); s.cover = 0.82; }
float win = max(abs(a) - 0.2, abs(q.y - 2.7) - 0.26);
if (win < 0.0) { s.albedo = P_SLATE; s.cover = mix(0.72, 0.0, uNight); s.glow = uNight; }
s.ink = max(s.ink, max(penLine(door * 0.9), penLine(win * 0.8)) * 0.85);
}
`});te({id:"tent",reach:1.62,height:1.5,collide:1.2,map:[.85,.75,.6],glsl:`
float sdf_tent(vec3 q, Prop pr, out float mat) {
float side = dot(vec2(abs(q.z), q.y) - vec2(1.05, 0.0), vec2(0.795, 0.607));
float cloth = max(max(side, -q.y), abs(q.x) - 1.2);
float poles = sdCylinder(vec3(abs(q.x) - 1.2, q.y, q.z), 0.04, 1.52);
mat = poles < cloth ? 1.0 : 0.0;
return min(cloth, poles);
}
void mat_tent(vec3 q, float mat, Prop pr, inout Surf s) {
if (mat > 0.5) { s.albedo = P_BARK; s.cover = 0.85; return; }
float stripe = step(0.5, fract(q.x * 1.25 + 0.25));
s.albedo = pr.seed < 0.4 ? P_BRICK : (pr.seed < 0.75 ? P_SLATE : P_SAGE);
s.cover = mix(0.08, 0.8, stripe);
s.ink = penLine((abs(fract(q.x * 2.5 + 0.5) - 0.5)) / 2.5) * 0.45;
float side = dot(vec2(abs(q.z), q.y) - vec2(1.05, 0.0), vec2(0.795, 0.607));
if (abs(q.x) > 1.19 && side < -0.34) { s.albedo = P_UMBER; s.cover = 0.92; s.ink = 0.0; }
if (abs(q.x) > 1.19) s.ink = max(s.ink, penLine(side + 0.34) * 0.8);
}
`});te({id:"campfire",reach:.68,height:.95,collide:.5,map:[.9,.5,.3],light:{color:[1,.7,.36],radius:8,y:.6,always:!0},glsl:`
float sdf_campfire(vec3 q, Prop pr, out float mat) {
float sec = TAU / 7.0;
float ca = floor(atan(q.z, q.x) / sec + 0.5) * sec;
float stones = length(q - vec3(cos(ca) * 0.5, 0.07, sin(ca) * 0.5)) - 0.13;
float logs = min(sdCapsule(q, vec3(-0.3, 0.1, -0.12), vec3(0.3, 0.16, 0.14), 0.07), sdCapsule(q, vec3(-0.14, 0.12, 0.28), vec3(0.16, 0.16, -0.3), 0.07));
float tk = floor(uTime * 12.0);
float fl = 0.5 + 0.12 * sin(tk * 2.1 + pr.seed * 9.0);
vec3 f = q - vec3(0.03 * sin(tk * 1.7), 0.2, 0.0);
float flame = sdEllipsoid(f - vec3(0.0, fl * 0.5, 0.0), vec3(0.17, fl * 0.55, 0.17));
mat = 0.0;
float d = stones;
if (logs < d) { d = logs; mat = 1.0; }
if (flame < d) { d = flame; mat = 2.0; }
return d * 0.9;
}
void mat_campfire(vec3 q, float mat, Prop pr, inout Surf s) {
if (mat < 0.5) { s.albedo = uRockCol; s.cover = 0.7; }
else if (mat < 1.5) { s.albedo = P_UMBER; s.cover = 0.9; }
else {
float rim = smoothstep(0.03, 0.14, length(q.xz));
s.albedo = mix(P_SUN, P_POPPY, smoothstep(0.25, 0.75, q.y));
s.cover = mix(0.08, 0.85, rim);
s.glow = 0.5 * (1.0 - rim);
s.soft = 1.0;
}
}
`});te({id:"pillar",reach:.62,height:3.5,collide:.42,map:[.82,.74,.66],glsl:`
float sdf_pillar(vec3 q, Prop pr, out float mat) {
mat = 0.0;
float h = 1.0 + 2.4 * pr.seed;
float shaft = sdCylinder(q, 0.3 + 0.02 * cos(atan(q.z, q.x) * 10.0), h);
shaft = max(shaft, dot(q - vec3(0.0, h - 0.15, 0.0), vec3(0.432, 0.864, 0.259)));
float base = sdBox(q - vec3(0.0, 0.1, 0.0), vec3(0.42, 0.1, 0.42));
return min(shaft, base) * 0.9;
}
void mat_pillar(vec3 q, float mat, Prop pr, inout Surf s) {
s.albedo = mix(P_PEACH, P_STONE, 0.4 + 0.3 * vnoise(q.xy * 3.0 + pr.seed * 9.0));
s.cover = 0.46;
s.ink = max(penLine((abs(fract(atan(q.z, q.x) * 1.6) - 0.5)) / 1.6 * 0.3) * 0.5 * step(0.2, q.y),
penLine((abs(fract(q.y * 0.9 + pr.seed) - 0.5)) / 0.9) * 0.7);
s.moss = 0.8;
}
`});te({id:"signpost",reach:.78,height:1.75,collide:.15,map:[.7,.55,.35],glsl:`
float sdf_signpost(vec3 q, Prop pr, out float mat) {
float post = sdCylinder(q, 0.06, 1.7);
float boards = min(sdBox(q - vec3(0.28, 1.45, 0.0), vec3(0.42, 0.13, 0.03)), sdBox(q - vec3(-0.25, 1.1, 0.0), vec3(0.38, 0.12, 0.03)));
mat = boards < post ? 1.0 : 0.0;
return min(post, boards);
}
void mat_signpost(vec3 q, float mat, Prop pr, inout Surf s) {
if (mat < 0.5) { s.albedo = P_BARK; s.cover = 0.8; return; }
s.albedo = P_WOOD; s.cover = 0.35;
float row = q.y > 1.3 ? q.y - 1.45 : q.y - 1.1;
s.ink = penLine(row + 0.02 * sin(q.x * 40.0)) * step(0.3, fract(q.x * 3.1 + pr.seed)) * 0.8;
}
`});te({id:"delve",reach:2,height:3.3,collide:1.35,map:[.35,.35,.4],glsl:`
float sdf_delve(vec3 q, Prop pr, out float mat) {
mat = 0.0;
vec3 d = q - vec3(0.0, 0.0, 0.95);
float door = min(sdBox(vec3(d.x, d.y - 0.62, 0.0), vec3(0.62, 0.62, 1.0)), length(d.xy - vec2(0.0, 1.22)) - 0.62);
float hole = max(door, abs(d.z) - 0.62);
float body;
if (pr.pal < 0.5) {
body = sdRoundBox(q - vec3(0.0, 1.25, 0.0), vec3(1.6, 1.25, 1.0), 0.06);
body = min(body, sdRoundBox(q - vec3(0.0, 2.62, 0.0), vec3(1.85, 0.16, 1.2), 0.05));
body = min(body, sdRoundBox(q - vec3(0.0, 2.98, 0.0), vec3(0.5, 0.24, 0.5), 0.05));
} else {
body = length((q - vec3(0.0, 0.4, -0.2)) * vec3(0.55, 0.75, 0.72)) - 1.2;
body = smin(body, length((q - vec3(1.0, 0.25, -0.5)) * vec3(0.8, 1.0, 0.9)) - 0.95, 0.45);
body = smin(body, length((q - vec3(-1.05, 0.2, -0.3)) * vec3(0.85, 1.0, 0.9)) - 0.9, 0.45);
body += 0.06 * sin(q.x * 5.1 + pr.seed * 7.0) * sin(q.y * 4.3) * sin(q.z * 4.7);
}
float d0 = max(body, -hole);
if (door < 0.02 && q.z < 0.45) mat = 1.0;
return d0 * 0.85;
}
void mat_delve(vec3 q, float mat, Prop pr, inout Surf s) {
if (mat > 0.5) { s.albedo = P_CHARCOAL; s.cover = 1.0; s.solid = 1.0; s.ink = 0.0; return; }
if (pr.pal < 0.5) {
s.albedo = mix(P_STONE, P_CLAY, 0.2 + 0.25 * vnoise(q.xy * 2.0 + pr.seed * 5.0));
s.cover = 0.55;
float course = abs(fract(q.y * 1.6) - 0.5) / 1.6;
float joint = abs(fract(q.x * 0.9 + step(0.5, fract(q.y * 0.8)) * 0.5) - 0.5) / 0.9;
s.ink = max(penLine(course) * 0.6, penLine(joint) * 0.45 * step(q.y, 2.45));
s.moss = 0.7;
} else {
s.albedo = mix(uRockCol, P_STONE, 0.35);
s.cover = 0.62;
s.ink = penLine(abs(fract(vnoise(q.xz * 1.3 + pr.seed) * 3.0) - 0.5) * 0.3) * 0.4;
s.moss = 0.5;
}
}
`});te({id:"torch",reach:.4,height:2.35,collide:.15,map:[1,.7,.4],light:{color:[1,.7,.36],radius:8,y:2.05,always:!0},glsl:`
float sdf_torch(vec3 q, Prop pr, out float mat) {
float post = sdCylinder(q, 0.055, 1.78);
float cup = sdCylinder(q - vec3(0.0, 1.72, 0.0), 0.16, 0.16) - 0.01;
float flame = length((q - vec3(0.0, 2.08 + 0.03 * sin(uTime * 9.0 + pr.seed * 20.0), 0.0)) * vec3(1.0, 0.6, 1.0)) - 0.14;
float iron = min(post, cup);
mat = flame < iron ? 1.0 : 0.0;
return min(iron, flame);
}
void mat_torch(vec3 q, float mat, Prop pr, inout Surf s) {
if (mat < 0.5) { s.albedo = q.y > 1.68 ? P_CHARCOAL : P_BARK; s.cover = 0.85; return; }
s.albedo = P_APRICOT; s.cover = 0.08; s.glow = 1.0;
}
`});const Ot=ne.ROAD_L,mn=new Map;function va(a,e,t=1,s=null){mn.set(a,{build:e,weight:t,suits:s})}const da=(a,e,t,s)=>Math.atan2(-(t-a),s-e),Mr=["Ald","Bram","Cor","Dun","Eld","Fen","Gar","Hal","Ith","Kel","Lor","Mar","Nor","Oak","Pen","Quil","Ros","Sel","Tor","Ul","Ver","Wyn","Ash","Brin","Cal","Thorn"],_r=["wick","stead","mere","holt","ford","combe","garth","low","den","by","rest","hollow","well","moor","reach"];function il(a,e,t){return Mr[Math.floor(ce(a,e,t+601)*Mr.length)]+_r[Math.floor(ce(a,e,t+602)*_r.length)]}function Yc(a,e,t){const s=new Map,o=5;function n(i,l){const c=Math.floor((i+2)/o),d=Math.floor((l+2)/o);return c===0&&d===0?!1:i===c*o-2+Math.floor(ce(c,d,a+551)*o)&&l===d*o-2+Math.floor(ce(c,d,a+552)*o)}function r(i,l){const c=i+","+l;if(s.has(c))return s.get(c);const d=i*Ot,p=l*Ot,f=e(d,p),u=t(d,p,f);let m=null;if(i===0&&l===0)m="town";else if(n(i,l))m="market";else if(ce(i,l,a+501)<.82){const v=[...mn].filter(([b,y])=>b!=="town"&&b!=="market"&&(!y.suits||y.suits.includes(u)));let x=ce(i,l,a+503)*v.reduce((b,[,y])=>b+y.weight,0);for(const[b,y]of v)if(x-=y.weight,x<=0){m=b;break}}let g=null;if(m){const v=x=>ce(i*7+x,l*13-x,a+510+x);g=mn.get(m).build({x:d,z:p,i,j:l,natural:f,biome:u,name:il(i,l,a),rand:v}),g&&Object.assign(g,{kind:m,x:d,z:p,i,j:l,key:c,ground:g.ground||"cobble"})}return s.set(c,g),g}return{siteAt:r,near:(i,l)=>r(Math.round(i/Ot),Math.round(l/Ot)),inRange(i,l,c){const d=[],p=Math.floor((i-c)/Ot),f=Math.ceil((i+c)/Ot),u=Math.floor((l-c)/Ot),m=Math.ceil((l+c)/Ot);for(let g=p;g<=f;g++)for(let v=u;v<=m;v++){const x=r(g,v);x&&Math.hypot(x.x-i,x.z-l)<=c&&d.push(x)}return d}}}const _s=a=>a.natural>1.6&&a.natural<15;function ll(a,e,t){const s=[{id:"waystone",x:a,z:e,rot:0}];for(let o=0;o<4;o++){for(const r of[-18,18]){const i=(45+o*90+r)*Math.PI/180,l=a+Math.cos(i)*19.5,c=e+Math.sin(i)*19.5;s.push({id:"house",x:l,z:c,rot:da(l,c,a,e),seed:((o*2+(r>0?1:0))/8+.05+t)%1})}const n=(45+o*90)*Math.PI/180;s.push({id:"lamp",x:a+Math.cos(n)*12.5,z:e+Math.sin(n)*12.5,rot:0})}return s.push({id:"stall",x:a+9.5,z:e-4.5,rot:da(a+9.5,e-4.5,a,e),seed:(.2+t)%1}),s.push({id:"stall",x:a-9.5,z:e-4.5,rot:da(a-9.5,e-4.5,a,e),seed:(.8+t)%1}),s.push({id:"well",x:a-6.5,z:e+8.5,rot:.4}),s.push({id:"chest",x:a,z:e-12.5,rot:0}),s}const cl=(a,e,t)=>[{id:"alchemist",name:t[0],role:"alchemist",x:a+10.36,z:e-4.91},{id:"warden",name:t[1],role:"warden",x:a-10.36,z:e-4.91},{id:"smith",name:t[2],role:"smith",x:a+5.5,z:e+9.5},{id:"stash",name:t[3],role:"stash",x:a+1.6,z:e-10.6}];va("town",({x:a,z:e})=>({name:"Hearthmere",r:26,fade:22,h:3,plaza:13.5,clear:27,safe:30,waystone:!0,town:!0,structures:ll(a,e,0),npcs:cl(a,e,["Odette","Bram","Tamsin","Pell"])}));const zr=["Agnes","Wat","Hild","Osric","Maud","Edda","Rolf","Ysolde","Gil","Bertha","Cuthbert","Lise","Aldo","Nell","Piers","Ines"];va("market",a=>{if(!(a.natural>.9&&a.natural<17))return null;const{x:e,z:t}=a,s=o=>zr[Math.floor(a.rand(40+o)*zr.length)];return{name:a.name,r:26,fade:22,h:Math.max(1.6,a.natural),plaza:13.5,clear:27,safe:30,waystone:!0,town:!0,structures:ll(e,t,a.rand(1)),npcs:cl(e,t,[s(1),s(2),s(3),s(4)])}},0);va("shrine",a=>{if(!_s(a))return null;const{x:e,z:t}=a,s=[{id:"waystone",x:e,z:t,rot:a.rand(1)*6.28}];for(let o=0;o<4;o++){if(a.rand(10+o)<.2)continue;const n=(45+o*90)*Math.PI/180,r=e+Math.cos(n)*7.2,i=t+Math.sin(n)*7.2;s.push({id:"stone",x:r,z:i,rot:da(r,i,e,t),seed:a.rand(20+o)})}return s.push({id:"signpost",x:e+6.4,z:t+1.6,rot:a.rand(2)*6.28}),{name:`${a.name} Shrine`,r:9.5,fade:10,h:a.natural,plaza:4.6,clear:10.5,safe:0,waystone:!0,structures:s,npcs:[]}},3);va("camp",a=>{if(!_s(a))return null;const{x:e,z:t}=a,s=[{id:"campfire",x:e,z:t,rot:a.rand(1)*6.28}],o=[[6,6],[-6,6],[6,-6],[-6,-6]],n=Math.floor(a.rand(2)*4);o.forEach(([l,c],d)=>{if(d===n){s.push({id:"stump",x:e+l*.9,z:t+c*.9,rot:a.rand(30+d)*6.28,seed:a.rand(40+d)});return}s.push({id:"tent",x:e+l,z:t+c,rot:da(e+l,t+c,e,t)+Math.PI/2,seed:a.rand(20+d)})}),s.push({id:"signpost",x:e+1.6,z:t+6.6,rot:a.rand(3)*6.28});const[r,i]=o[n];return{name:`${a.name} Camp`,r:11,fade:9,h:a.natural,plaza:3.2,ground:"dirt",clear:12,safe:14,structures:s,npcs:[{id:"tinker",name:`${a.name.slice(0,3)}a the Tinker`,role:"tinker",x:e+r*.45,z:t+i*.45}]}},2);va("ruin",a=>{if(!_s(a))return null;const{x:e,z:t}=a,s=[{id:"cairn",x:e,z:t,rot:a.rand(1)*6.28,scale:1.3}];for(let o=0;o<8;o++){if(a.rand(10+o)<.3)continue;const n=(22.5+o*45)*Math.PI/180;s.push({id:"pillar",x:e+Math.cos(n)*7,z:t+Math.sin(n)*7,rot:a.rand(20+o)*6.28,seed:a.rand(30+o)})}return{name:`Ruins of ${a.name}`,r:10.5,fade:10,h:a.natural,plaza:8.6,clear:12,safe:0,den:!0,structures:s,npcs:[]}},2);va("farm",a=>{if(!_s(a)||a.natural>9)return null;const{x:e,z:t}=a,s=a.rand(1)<.5?1:-1,o=(d,p)=>[e+d*s,t+p],[n,r]=o(-7,-7),[i,l]=o(8,-8),c=[{id:"house",x:n,z:r,rot:da(n,r,e,t),seed:a.rand(2)},{id:"windmill",x:i,z:l,rot:da(i,l,e,t),seed:a.rand(3)},{id:"scarecrow",x:o(-8,7)[0],z:o(-8,7)[1],rot:a.rand(4)*6.28,seed:a.rand(5)},{id:"signpost",x:o(2.2,6.4)[0],z:o(2.2,6.4)[1],rot:a.rand(6)*6.28}];for(const[d,[p,f]]of[[6.5,6],[10.5,10],[6,10.5]].entries()){const[u,m]=o(p,f);c.push({id:"haystack",x:u,z:m,rot:a.rand(10+d)*6.28,seed:a.rand(20+d),scale:.85+.3*a.rand(30+d)})}return{name:`${a.name} Farm`,r:13,fade:10,h:a.natural,plaza:5,ground:"dirt",clear:14.5,safe:16,structures:c,npcs:[]}},2,["meadow","wheat","amberwood","birchwood","grove"]);const Vc=["pinewood","highland","frost","cinder","capwood","marsh","shore"];va("dungeon",a=>{if(!_s(a))return null;const{x:e,z:t}=a,s=Vc.includes(a.biome),o=[{id:"delve",x:e,z:t,rot:0,pal:s?1:0,seed:a.rand(1)},{id:"signpost",x:e+5.2,z:t+4.4,rot:a.rand(2)*6.28},{id:s?"rock":"stone",x:e-6,z:t-3,rot:a.rand(3)*6.28,seed:a.rand(4),scale:.8},{id:s?"rock":"stone",x:e+6.5,z:t-2.5,rot:a.rand(5)*6.28,seed:a.rand(6),scale:.7}];return{name:s?/hollow$/i.test(a.name)?`Caves of ${a.name}`:`${a.name} Hollow`:`Crypt of ${a.name}`,r:9,fade:9,h:a.natural,plaza:4.5,ground:"dirt",clear:10.5,safe:0,structures:o,npcs:[],delve:s?"cave":"crypt",door:{x:e,z:t+2.1},biome:a.biome}},1.6);const jt=96,Ye=ne.CELL,to={cache:{weight:5,clear:4.5,name:()=>"Cache",build:(a,e,t)=>[{id:"chest",x:a,z:e,rot:t(1)*6.28},{id:"cairn",x:a+(t(2)<.5?Ye:-Ye),z:e+(t(3)<.5?Ye:0),rot:t(4)*6.28,scale:1.25}]},stones:{weight:3,clear:7,name:a=>`${a} Stones`,build:(a,e,t)=>[{id:"crystal",x:a,z:e,rot:t(1)*6.28,scale:1.3},{id:"stone",x:a+Ye,z:e+Ye,rot:.8,seed:t(2),scale:.62},{id:"stone",x:a-Ye,z:e+Ye,rot:-.8,seed:t(3),scale:.62},{id:"stone",x:a,z:e-Ye,rot:3.14,seed:t(4),scale:.62}]},beacon:{weight:2,clear:8,name:a=>`${a} Beacon`,build:(a,e,t)=>[{id:"beacon",x:a,z:e,rot:t(1)*6.28},{id:"signpost",x:a+Ye,z:e+Ye,rot:t(2)*6.28}]}},Xc=Object.values(to).reduce((a,e)=>a+e.weight,0);function Zc(a,e,t){const s=new Map;function o(n,r){const i="f"+n+","+r;if(s.has(i))return s.get(i);let l=null;if(ce(n,r,a+701)<.62){const c=(Math.floor((n+.2+.6*ce(n,r,a+702))*jt/Ye)+.5)*Ye,d=(Math.floor((r+.2+.6*ce(n,r,a+703))*jt/Ye)+.5)*Ye,p=e(c,d),f=t.near(c,d),u=Math.abs(e(c+3,d)-p)<1.2&&Math.abs(e(c,d+3)-p)<1.2;if(p>1.4&&p<15&&u&&!(f&&Math.hypot(f.x-c,f.z-d)<f.clear+16)){let m=ce(n,r,a+704)*Xc,g="cache";for(const b in to)if(m-=to[b].weight,m<=0){g=b;break}const v=to[g],x=b=>ce(n*5+b,r*11-b,a+710+b);l={key:i,kind:g,x:c,z:d,i:n,j:r,clear:v.clear,name:v.name(il(n+400,r-300,a)),structures:v.build(c,d,x)}}}return s.set(i,l),l}return{findAt:o,near:(n,r)=>o(Math.floor(n/jt),Math.floor(r/jt)),inRange(n,r,i){const l=[];for(let c=Math.floor((n-i)/jt);c<=Math.floor((n+i)/jt);c++)for(let d=Math.floor((r-i)/jt);d<=Math.floor((r+i)/jt);d++){const p=o(c,d);p&&Math.hypot(p.x-n,p.z-r)<=i&&l.push(p)}return l}}}const J=ne.CHUNK,xt=ne.CELL,st=J/xt,Ut=ne.ROAD_L;function Qc(a){const e=a|0;function t(b,y){const k=b+60*De(b*.003,y*.003,e+1),M=y+60*De(b*.003+31.7,y*.003-12.3,e+2);return at(k*.0019,M*.0019,4,e+3)*1.6+.2+.75*Math.exp(-(b*b+y*y)/9e4)}const s=(b,y)=>He(.5+.95*at(b*.0014-500,y*.0014+150,2,e+12),0,1);function o(b,y){const k=t(b,y),M=Math.hypot(b,y);let z=k<0?Math.max(k*14,-7):7*(1-Math.exp(-k*3));const P=j(0,.12,k),$=1+2.6*j(-.2,.5,De(b*.0031+5.1,y*.0031+9.2,e+4));z+=at(b*.011,y*.011,4,e+5)*$*P;let N=j(.08,.5,at(b*.0016+90.1,y*.0016-40.7,3,e+6)+.12);N*=j(.1,.4,k)*j(150,330,M),N>0&&(z+=N*N*(Uc(b*.0058,y*.0058,4,e+7)*38+4));const B=Math.abs(at(b*.0027+200.3,y*.0027+77.7,2,e+8)),G=(1-j(.008,.04,B))*(1-j(5,10,z))*j(70,150,M);G>0&&(z=Q(z,Math.min(z,-.55),G));const pe=j(.66,.82,.5+.5*at(b*.006+70,y*.006-30,2,e+17))*P*j(170,300,M)*(1-N);pe>0&&(z=Q(z,Math.min(z,-2.4),pe*.92));const we=j(.68,.84,s(b,y))*(1-j(3,7.5,z))*P*j(130,250,M);return we>0&&(z=Q(z,.32+1.15*at(b*.05,y*.05,2,e+16),we)),z}const n=Yc(e,o,(b,y,k)=>Ge[u(p(b,y,k))].id),r=Zc(e,(b,y)=>l(b,y),n),i=new Set;function l(b,y){let k=o(b,y);const M=n.near(b,y);if(M){const z=1-j(M.r,M.r+M.fade,Math.hypot(b-M.x,y-M.z));z>0&&(k=Q(k,M.h,z))}return k}function c(b,y){const k=b-Math.round(b/Ut)*Ut,M=y-Math.round(y/Ut)*Ut,z=j(24,96,Math.hypot(k,M)),P=b+26*z*De(b*.007,y*.007,e+9),$=y+26*z*De(b*.007+50,y*.007+50,e+10);return Math.min(Math.abs(P-Math.round(P/Ut)*Ut),Math.abs($-Math.round($/Ut)*Ut))}const d={elev:0,temp:0,moist:0,magic:0,wild:0,far:0};function p(b,y,k){const M=Math.hypot(b,y),z=1-j(110,250,M);return d.elev=k,d.temp=Q(He(.5+1.05*at(b*.0013+300,y*.0013+300,2,e+11),0,1),.5,z),d.moist=Q(s(b,y),.5,z),d.magic=Q(He(.5+1*at(b*.0024+900,y*.0024-900,2,e+13),0,1),.45,z),d.wild=Q(He(.5+1.05*at(b*.0019+1300,y*.0019+700,2,e+15),0,1),.45,z),d.far=j(150,330,M),d}const f=new Float32Array(16);function u(b){let y=0,k=-1e9,M=0;for(let z=0;z<Ge.length;z++){const P=Ge[z].score(b);f[z]=P,P>k&&(k=P,y=z)}for(let z=0;z<Ge.length;z++){const P=Math.exp(Math.max(-30,9*(f[z]-k)));f[z]=P,M+=P}for(let z=0;z<Ge.length;z++)f[z]/=M;return y}const m=(b,y)=>j(-.12,.3,at(b*.009,y*.009,3,e+14));function g(b,y){const k=(b+.5)*xt,M=(y+.5)*xt,z=n.near(k,M);if(z&&Math.hypot(k-z.x,M-z.z)<z.clear)return null;const P=r.near(k,M);if(P&&Math.hypot(k-P.x,M-P.z)<P.clear)return null;const $=l(k,M);if($<.3||c(k,M)<4.2)return null;const N=p(k,M,$);u(N);let B=ce(b,y,e+21),G=0;for(;G<Ge.length-1&&(B-=f[G],!(B<=0));G++);const pe=Ge[G].props,we=m(k,M);let Y=ce(b,y,e+22),_e=null;for(let L=0;L<pe.length;L++)if(Y-=Q(pe[L][1],pe[L][2],we),Y<=0){_e=pe[L];break}if(!_e)return null;const Be=ho(_e[0]),ka=Q(Be.scale[0],Be.scale[1],ce(b,y,e+23)),Bt=Math.max(0,xt/2-Be.reach*ka-.04),T=k+(ce(b,y,e+24)*2-1)*Bt,C=M+(ce(b,y,e+25)*2-1)*Bt,R=l(T,C);if(R<(Be.id==="reeds"?.05:.5)||Math.hypot(l(T+1,C)-R,l(T,C+1)-R)>(Be.id==="rock"?1.1:.62)||Be.id!=="rock"&&Be.id!=="crystal"&&Be.id!=="cairn"&&R>23+3*ce(b,y,e+27))return null;let _=_e[3];if(_===void 0){const L=Ge[G].leaf,V=.5+.5*at(T*.004+40,C*.004-80,2,e+29),F=ce(b,y,e+30);_=L[Math.floor((F<.22?ce(b,y,e+31):He(V*1.6-.3,0,.999))*L.length)]}return{def:Be,type:Be.type,x:T,y:R-.06,z:C,scale:ka,rot:ce(b,y,e+26)*6.2832,seed:ce(b,y,e+28),pal:_}}function v(b){return b.built||(b.built=b.structures.map((y,k)=>{const M=ho(y.id);return{def:M,type:M.type,x:y.x,y:l(y.x,y.z)-.04,z:y.z,scale:y.scale||1,rot:y.rot||0,seed:y.seed??ce(k,b.i*31+b.j,e+40),pal:y.pal||0,site:b,...M.id==="chest"&&i.has(b.key)?{pal:1}:null}})),b.built}function x(b,y){const k=b*J,M=y*J,z=J+2,P=new Float32Array(z*z);let $=1e9,N=-1e9;for(let S=0;S<z;S++)for(let _=0;_<z;_++){const L=l(k+_-1,M+S-1);P[S*z+_]=L,L<$&&($=L),L>N&&(N=L)}const B=4,G=J/B+1,pe=new Float32Array(G*G*4);for(let S=0;S<G;S++)for(let _=0;_<G;_++){const L=p(k+_*B,M+S*B,0);pe.set([L.temp,L.moist,L.magic,L.wild],(S*G+_)*4)}const we=(S,_,L)=>{const V=S/B,F=_/B,Z=Math.min(V|0,G-2),O=Math.min(F|0,G-2),X=V-Z,D=F-O,U=(O*G+Z)*4+L,se=Q(pe[U],pe[U+4],X),Le=Q(pe[U+G*4],pe[U+G*4+4],X);return Q(se,Le,D)},Y={cx:b,cz:y,minH:$,maxH:N,height:new Float32Array(J*J*4),color:new Uint8Array(J*J*4),mat:new Uint8Array(J*J*4),propsA:new Float32Array(st*st*4),propsB:new Uint8Array(st*st*4),biome:new Uint8Array(J*J),props:[]},_e=n.near(k+J/2,M+J/2),Be=j(150,330,Math.hypot(k+J/2,M+J/2));for(let S=0;S<J;S++)for(let _=0;_<J;_++){const L=k+_,V=M+S,F=(S*J+_)*4,Z=P[(S+1)*z+_+1],O=Math.hypot((P[(S+1)*z+_+2]-P[(S+1)*z+_])/2,(P[(S+2)*z+_+1]-P[S*z+_+1])/2);d.elev=Z,d.temp=we(_,S,0),d.moist=we(_,S,1),d.magic=we(_,S,2),d.wild=we(_,S,3),d.far=Be,Y.biome[S*J+_]=u(d);const X=.5+.5*at(L*.045,V*.045,2,e+30);let D=0,U=0,se=0,Le=0,et=0,Ma=0,Ls=0,qs=0,Rs=0,pr=0;for(let za=0;za<Ge.length;za++){const Oe=f[za];if(Oe<.004)continue;const tt=Ge[za];D+=Oe*Q(tt.ground[0],tt.ground2[0],X),U+=Oe*Q(tt.ground[1],tt.ground2[1],X),se+=Oe*Q(tt.ground[2],tt.ground2[2],X),Ls+=Oe*tt.rock[0],qs+=Oe*tt.rock[1],Rs+=Oe*tt.rock[2],Le+=Oe*tt.grass,et+=Oe*tt.sand,Ma+=Oe*tt.flowers,pr+=Oe*tt.snow}const _a=1-j(.35,1.3,Z);_a>0&&(D=Q(D,.886,_a),U=Q(U,.76,_a),se=Q(se,.55,_a)),et=Math.max(et,_a),Le*=1-_a;const aa=j(.62,1,O)*j(.2,1.5,Z);D=Q(D,Ls,aa),U=Q(U,qs,aa),se=Q(se,Rs,aa);const mr=De(L*.05,V*.05,e+31),Ga=Math.max(j(21,26,Z+3*mr),pr*j(-.75,.1,mr+(Z>.3?.4:-1)))*(1-aa*.75);D=Q(D,.93,Ga),U=Q(U,.95,Ga),se=Q(se,1,Ga);let bt=(1-j(1.3,2.6,c(L,V)))*j(.1,.5,Z)*(1-j(.55,.8,O)),sa=0;if(_e){const za=Math.hypot(L-_e.x,V-_e.z),Oe=1-j(_e.plaza-1.2,_e.plaza+.6,za+1.2*De(L*.3,V*.3,e+32));_e.ground==="dirt"?bt=Math.max(bt,Oe):sa=Oe}bt>0&&(D=Q(D,.886,bt*.9),U=Q(U,.737,bt*.9),se=Q(se,.51,bt*.9)),sa>0&&(D=Q(D,.925,sa),U=Q(U,.78,sa),se=Q(se,.69,sa)),bt=Math.max(bt*.5,sa);const Pc=Math.max(aa,Ga,Math.max(bt*2,sa));Le*=1-Math.min(1,Pc),Y.height[F]=Z,Y.height[F+2]=Ma*Le,Y.height[F+3]=j(.9,0,Z),Y.color[F]=D*255,Y.color[F+1]=U*255,Y.color[F+2]=se*255,Y.color[F+3]=bt*255,Y.mat[F]=Le*255,Y.mat[F+1]=et*(1-aa)*255,Y.mat[F+2]=Ga*255,Y.mat[F+3]=aa*255}const ka=b*st,Bt=y*st,T=S=>{const _=S.def.reach*S.scale*1.35,L=Math.min(.85,.3+S.def.height*.12),V=Math.max(0,Math.floor(S.x-_-k)),F=Math.min(J-1,Math.ceil(S.x+_-k)),Z=Math.max(0,Math.floor(S.z-_-M)),O=Math.min(J-1,Math.ceil(S.z+_-M));for(let X=Z;X<=O;X++)for(let D=V;D<=F;D++){const U=L*(1-j(.35*_,_,Math.hypot(k+D-S.x,M+X-S.z))),se=(X*J+D)*4+1;U>Y.height[se]&&(Y.height[se]=U)}},C=(S,_,L)=>{const V=(L*st+_)*4;return Y.propsA[V+3]!==0?!1:(Y.propsA[V]=S.x-(k+(_+.5)*xt),Y.propsA[V+1]=S.z-(M+(L+.5)*xt),Y.propsA[V+2]=S.y,Y.propsA[V+3]=S.type,Y.propsB[V]=(S.rot/6.2832%1+1)%1*255,Y.propsB[V+1]=He(S.scale/2,0,1)*255,Y.propsB[V+2]=S.seed*255,Y.propsB[V+3]=S.pal,!0)},R=[];_e&&Math.hypot(_e.x-(k+J/2),_e.z-(M+J/2))<_e.clear+J&&R.push(_e);for(const S of r.inRange(k+J/2,M+J/2,J))R.push(S);for(const S of R)for(const _ of v(S)){const L=_.def.reach*_.scale;if(!(_.x+L<k-2||_.x-L>k+J+2||_.z+L<M-2||_.z-L>M+J+2)){T(_),_.x>=k&&_.x<k+J&&_.z>=M&&_.z<M+J&&Y.props.push(_);for(let V=0;V<st;V++)for(let F=0;F<st;F++){const Z=He(_.x,k+F*xt,k+(F+1)*xt),O=He(_.z,M+V*xt,M+(V+1)*xt);Math.hypot(Z-_.x,O-_.z)<L&&!C(_,F,V)&&console.warn(`${S.name}: ${_.def.id} overlaps another structure in one cell`)}}}for(let S=-1;S<=st;S++)for(let _=-1;_<=st;_++){const L=g(ka+_,Bt+S);L&&(T(L),!(_<0||S<0||_>=st||S>=st)&&C(L,_,S)&&Y.props.push(L))}for(const S of Y.props)S.y+S.def.height*S.scale>Y.maxH&&(Y.maxH=S.y+S.def.height*S.scale);return Y}return{seed:e,height:l,naturalHeight:o,roadDist:c,sampleClimate:p,biomeWeights:u,generateChunk:x,sites:n,finds:r,opened:i,forest:m}}const be=ne.CHUNK,No=(a,e)=>(a+32768)*65536+(e+32768);class dl{constructor(e,t){this.seed=e,this.gen=t||Qc(e),this.sites=this.gen.sites,this.finds=this.gen.finds,this.chunks=new Map,this.last=null}chunk(e,t){const s=this.last;if(s&&s.cx===e&&s.cz===t)return s;const o=No(e,t);let n=this.chunks.get(o);return n||this.chunks.set(o,n=this.gen.generateChunk(e,t)),this.last=n}openFind(e){this.gen.opened.add(e.key),e.built=null;const t=Math.floor(e.x/be),s=Math.floor(e.z/be);return this.chunks.delete(No(t,s)),this.last=null,[t,s]}refreshAt(e,t){const s=Math.floor(e/be),o=Math.floor(t/be);return this.chunks.delete(No(s,o)),this.last=null,[s,o]}prune(e,t,s=14){if(this.chunks.size<700)return;const o=Math.floor(e/be),n=Math.floor(t/be);for(const[r,i]of this.chunks)(Math.abs(i.cx-o)>s||Math.abs(i.cz-n)>s)&&this.chunks.delete(r);this.last=null}texel(e,t){const s=Math.floor(e/be),o=Math.floor(t/be);return this.chunk(s,o).height[((t-o*be)*be+(e-s*be))*4]}height(e,t){const s=Math.floor(e),o=Math.floor(t),n=e-s,r=t-o,i=this.texel(s,o),l=this.texel(s+1,o),c=this.texel(s,o+1),d=this.texel(s+1,o+1);return i+(l-i)*n+(c+(d-c)*n-(i+(l-i)*n))*r}surface(e,t){return Math.max(this.height(e,t),ne.SEA)}waterDepth(e,t){return Math.max(0,ne.SEA-this.height(e,t))}slope(e,t){return Math.hypot(this.height(e+.6,t)-this.height(e-.6,t),this.height(e,t+.6)-this.height(e,t-.6))/1.2}biome(e,t){const s=Math.round(e),o=Math.round(t),n=Math.floor(s/be),r=Math.floor(o/be);return Ge[this.chunk(n,r).biome[(o-r*be)*be+(s-n*be)]]}walkable(e,t){return this.height(e,t)>ne.SEA-.75&&this.slope(e,t)<.95}forEachProp(e,t,s,o){const n=s+4,r=Math.floor((e-n)/be),i=Math.floor((e+n)/be),l=Math.floor((t-n)/be),c=Math.floor((t+n)/be);for(let d=l;d<=c;d++)for(let p=r;p<=i;p++){const f=this.chunk(p,d).props;for(let u=0;u<f.length;u++){const m=f[u],g=m.x-e,v=m.z-t;g*g+v*v<=n*n&&o(m)}}}moveCircle(e,t,s,o,n,r){let i=e+s,l=t+o;return this.walkable(i,l)||(this.walkable(i,t)?l=t:this.walkable(e,l)?i=e:(i=e,l=t)),this.forEachProp(i,l,n,c=>{const d=c.def.collide*c.scale;if(d<=0)return;const p=i-c.x,f=l-c.z,u=Math.hypot(p,f),m=d+n;u<m&&u>1e-4&&(i=c.x+p/u*m,l=c.z+f/u*m)}),r.x=i,r.z=l,r}raycast(e,t,s=220){let o=0;for(let n=0;n<260&&o<s;n++){const r=e[0]+t[0]*o,i=e[1]+t[1]*o,l=e[2]+t[2]*o,c=i-this.surface(r,l);if(c<.02)return{x:r,y:i-c,z:l,t:o};o+=Math.max(.05,c*.45)}return null}}function Jc(a){const e=a.getContext("webgl2",{antialias:!1,alpha:!1,depth:!1,stencil:!1,powerPreference:"high-performance",preserveDrawingBuffer:!1});if(!e)throw new Error("This game needs WebGL2, which this browser does not provide.");const t={floatTargets:!!e.getExtension("EXT_color_buffer_float"),halfFloatTargets:!!e.getExtension("EXT_color_buffer_half_float"),floatLinear:!!e.getExtension("OES_texture_float_linear")};if(!t.floatTargets&&!t.halfFloatTargets)throw new Error("This GPU cannot render to float textures.");return e.pixelStorei(e.UNPACK_ALIGNMENT,1),e.caps=t,{gl:e,caps:t}}function Sr(a,e,t,s){const o=a.createShader(e);if(a.shaderSource(o,t),a.compileShader(o),!a.getShaderParameter(o,a.COMPILE_STATUS)){const n=a.getShaderInfoLog(o)||"",r=t.split(`
`),i=[...n.matchAll(/ERROR: \d+:(\d+)/g)].slice(0,4).map(l=>{const c=+l[1];return r.slice(Math.max(0,c-3),c+1).map((d,p)=>`${Math.max(1,c-2)+p}: ${d}`).join(`
`)}).join(`
---
`);throw new Error(`Shader "${s}" failed to compile:
${n}
${i}`)}return o}const e0={5126:(a,e,t,s)=>s>1||t.length?a.uniform1fv(e,t):a.uniform1f(e,t),35664:(a,e,t)=>a.uniform2fv(e,t),35665:(a,e,t)=>a.uniform3fv(e,t),35666:(a,e,t)=>a.uniform4fv(e,t),5124:(a,e,t,s)=>s>1||t.length?a.uniform1iv(e,t):a.uniform1i(e,t),35676:(a,e,t)=>a.uniformMatrix4fv(e,!1,t),35675:(a,e,t)=>a.uniformMatrix3fv(e,!1,t)};class fs{constructor(e,t,s,o,n){this.gl=e,this.name=t;const r=this.handle=e.createProgram(),i=Sr(e,e.VERTEX_SHADER,kr(s,n),t+" (vertex)"),l=Sr(e,e.FRAGMENT_SHADER,kr(o,n),t+" (fragment)");if(e.attachShader(r,i),e.attachShader(r,l),e.linkProgram(r),!e.getProgramParameter(r,e.LINK_STATUS))throw new Error(`Program "${t}" failed to link: ${e.getProgramInfoLog(r)}`);e.deleteShader(i),e.deleteShader(l),this.uniforms={};const c=e.getProgramParameter(r,e.ACTIVE_UNIFORMS);for(let d=0;d<c;d++){const p=e.getActiveUniform(r,d),f=p.name.replace(/\[0\]$/,"");this.uniforms[f]={loc:e.getUniformLocation(r,p.name),type:p.type,size:p.size}}this.unit=0}use(){return this.gl.useProgram(this.handle),this.unit=0,this}set(e,t){const s=this.uniforms[e];return s&&e0[s.type](this.gl,s.loc,t,s.size),this}tex(e,t,s=this.gl.TEXTURE_2D){const o=this.uniforms[e];if(!o)return this;const n=this.gl;return n.activeTexture(n.TEXTURE0+this.unit),n.bindTexture(s,t),n.uniform1i(o.loc,this.unit++),this}}function hl(a,{width:e,height:t,internal:s,format:o,type:n,filter:r=a.NEAREST,wrap:i=a.CLAMP_TO_EDGE,data:l=null}){const c=a.createTexture();return a.bindTexture(a.TEXTURE_2D,c),a.texImage2D(a.TEXTURE_2D,0,s,e,t,0,o,n,l),a.texParameteri(a.TEXTURE_2D,a.TEXTURE_MIN_FILTER,r),a.texParameteri(a.TEXTURE_2D,a.TEXTURE_MAG_FILTER,r),a.texParameteri(a.TEXTURE_2D,a.TEXTURE_WRAP_S,i),a.texParameteri(a.TEXTURE_2D,a.TEXTURE_WRAP_T,i),c}let Bo=class{constructor(e,t,s=!1){this.gl=e,this.spec=t,this.useDepth=s,this.width=0,this.height=0,this.textures=[],this.fbo=null}resize(e,t){const s=this.gl;if(e=Math.max(1,e|0),t=Math.max(1,t|0),e===this.width&&t===this.height)return!1;this.dispose(),this.width=e,this.height=t,this.fbo=s.createFramebuffer(),s.bindFramebuffer(s.FRAMEBUFFER,this.fbo),this.textures=this.spec.map((n,r)=>{const i=n.precise&&s.caps&&s.caps.floatTargets,l=hl(s,{width:e,height:t,internal:i?s.RGBA32F:s.RGBA16F,format:s.RGBA,type:i?s.FLOAT:s.HALF_FLOAT,filter:n.filter==="nearest"||i?s.NEAREST:s.LINEAR});return s.framebufferTexture2D(s.FRAMEBUFFER,s.COLOR_ATTACHMENT0+r,s.TEXTURE_2D,l,0),l}),this.useDepth&&(this.depth=s.createRenderbuffer(),s.bindRenderbuffer(s.RENDERBUFFER,this.depth),s.renderbufferStorage(s.RENDERBUFFER,s.DEPTH_COMPONENT24,e,t),s.framebufferRenderbuffer(s.FRAMEBUFFER,s.DEPTH_ATTACHMENT,s.RENDERBUFFER,this.depth));const o=s.checkFramebufferStatus(s.FRAMEBUFFER);if(o!==s.FRAMEBUFFER_COMPLETE)throw new Error("Render target incomplete: 0x"+o.toString(16));return s.bindFramebuffer(s.FRAMEBUFFER,null),!0}bind(e=this.textures.length){const t=this.gl;t.bindFramebuffer(t.FRAMEBUFFER,this.fbo),t.viewport(0,0,this.width,this.height),t.drawBuffers(this.textures.map((s,o)=>o<e?t.COLOR_ATTACHMENT0+o:t.NONE))}dispose(){const e=this.gl;this.textures.forEach(t=>e.deleteTexture(t)),this.depth&&e.deleteRenderbuffer(this.depth),this.fbo&&e.deleteFramebuffer(this.fbo),this.textures=[],this.depth=null,this.fbo=null}};function t0(a,e,t){a.bindFramebuffer(a.FRAMEBUFFER,null),a.viewport(0,0,e,t)}function gn(a){a.drawArrays(a.TRIANGLES,0,3)}Nt("common",`
#define PI 3.14159265
#define TAU 6.2831853
#define saturate(x) clamp(x, 0.0, 1.0)
float hash11(float p) { p = fract(p * 0.1031); p *= p + 33.33; p *= p + p; return fract(p); }
float hash12(vec2 p) {
vec3 p3 = fract(vec3(p.xyx) * 0.1031);
p3 += dot(p3, p3.yzx + 33.33);
return fract((p3.x + p3.y) * p3.z);
}
vec2 hash22(vec2 p) {
vec3 p3 = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973));
p3 += dot(p3, p3.yzx + 33.33);
return fract((p3.xx + p3.yz) * p3.zy);
}
float hash13(vec3 p3) {
p3 = fract(p3 * 0.1031);
p3 += dot(p3, p3.zyx + 31.32);
return fract((p3.x + p3.y) * p3.z);
}
vec3 hash31(float p) {
vec3 p3 = fract(vec3(p) * vec3(0.1031, 0.1030, 0.0973));
p3 += dot(p3, p3.yzx + 33.33);
return fract((p3.xxy + p3.yzz) * p3.zyx);
}
float vnoise(vec2 p) {
vec2 i = floor(p), f = fract(p);
f = f * f * (3.0 - 2.0 * f);
return mix(mix(hash12(i), hash12(i + vec2(1, 0)), f.x),
mix(hash12(i + vec2(0, 1)), hash12(i + vec2(1, 1)), f.x), f.y);
}
float vnoise3(vec3 p) {
vec3 i = floor(p), f = fract(p);
f = f * f * (3.0 - 2.0 * f);
return mix(
mix(mix(hash13(i), hash13(i + vec3(1, 0, 0)), f.x), mix(hash13(i + vec3(0, 1, 0)), hash13(i + vec3(1, 1, 0)), f.x), f.y),
mix(mix(hash13(i + vec3(0, 0, 1)), hash13(i + vec3(1, 0, 1)), f.x), mix(hash13(i + vec3(0, 1, 1)), hash13(i + vec3(1, 1, 1)), f.x), f.y),
f.z);
}
float fbm(vec2 p) {
float a = 0.5, s = 0.0;
for (int i = 0; i < 4; i++) { s += a * vnoise(p); p = p * 2.03 + 17.1; a *= 0.5; }
return s / 0.9375;
}
vec2 voronoi(vec2 p) {
vec2 i = floor(p), f = fract(p);
float best = 8.0, id = 0.0;
for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) {
vec2 g = vec2(float(x), float(y));
vec2 o = hash22(i + g);
float d = length(g + o - f);
if (d < best) { best = d; id = hash12(i + g + 7.7); }
}
return vec2(best, id);
}
vec2 pavers(vec2 p) {
vec2 i = floor(p), f = fract(p);
float f1 = 8.0, f2 = 8.0, id = 0.0;
for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) {
vec2 g = vec2(float(x), float(y));
float d = length(g + hash22(i + g) * 0.8 + 0.1 - f);
if (d < f1) { f2 = f1; f1 = d; id = hash12(i + g + 7.7); } else if (d < f2) f2 = d;
}
return vec2(f2 - f1, id);
}
mat2 rot2(float a) { float c = cos(a), s = sin(a); return mat2(c, -s, s, c); }
float smin(float a, float b, float k) { float h = max(k - abs(a - b), 0.0) / k; return min(a, b) - h * h * k * 0.25; }
float smax(float a, float b, float k) { return -smin(-a, -b, k); }
float sdSphere(vec3 p, float r) { return length(p) - r; }
float sdEllipsoid(vec3 p, vec3 r) { float k0 = length(p / r); float k1 = length(p / (r * r)); return k0 * (k0 - 1.0) / max(k1, 1e-4); }
float sdBox(vec3 p, vec3 b) { vec3 q = abs(p) - b; return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0); }
float sdRoundBox(vec3 p, vec3 b, float r) { return sdBox(p, b - r) - r; }
float sdCapsule(vec3 p, vec3 a, vec3 b, float r) {
vec3 pa = p - a, ba = b - a;
float h = saturate(dot(pa, ba) / dot(ba, ba));
return length(pa - ba * h) - r;
}
float sdTaper(vec3 p, vec3 a, vec3 b, float ra, float rb) {
vec3 pa = p - a, ba = b - a;
float h = saturate(dot(pa, ba) / dot(ba, ba));
return length(pa - ba * h) - mix(ra, rb, h);
}
float sdCylinder(vec3 p, float r, float h) {
vec2 d = vec2(length(p.xz) - r, abs(p.y - h * 0.5) - h * 0.5);
return min(max(d.x, d.y), 0.0) + length(max(d, 0.0));
}
float sdConeUp(vec3 p, float r, float h) {
vec2 w = vec2(length(p.xz), p.y);
vec2 n = normalize(vec2(h, r));
return max(dot(w - vec2(r, 0.0), n), -p.y);
}
float sdTorusY(vec3 p, float R, float r) { return length(vec2(length(p.xz) - R, p.y)) - r; }
vec2 octEncode(vec3 n) {
n /= (abs(n.x) + abs(n.y) + abs(n.z));
vec2 e = n.y >= 0.0 ? n.xz : (1.0 - abs(n.zx)) * vec2(n.x >= 0.0 ? 1.0 : -1.0, n.z >= 0.0 ? 1.0 : -1.0);
return e;
}
vec3 octDecode(vec2 e) {
vec3 n = vec3(e.x, 1.0 - abs(e.x) - abs(e.y), e.y);
float t = max(-n.y, 0.0);
n.x += n.x >= 0.0 ? -t : t;
n.z += n.z >= 0.0 ? -t : t;
return normalize(n);
}
float luma(vec3 c) { return dot(c, vec3(0.2126, 0.7152, 0.0722)); }
`);const vn=`
out vec2 vUv;
void main() {
vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
vUv = p;
gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}
`,ss=ne.TEX,Et=ne.CHUNK,me=ss/Et,Tr=ss/ne.CELL,Cr=Et/ne.CELL;class a0{constructor(e,t){this.gl=e,this.world=t;const s=(o,n,r,i)=>hl(e,{width:o,height:o,internal:n,format:e.RGBA,type:r,filter:i,wrap:e.REPEAT});this.height=s(ss,e.RGBA16F,e.FLOAT,e.LINEAR),this.color=s(ss,e.RGBA8,e.UNSIGNED_BYTE,e.LINEAR),this.mat=s(ss,e.RGBA8,e.UNSIGNED_BYTE,e.LINEAR),this.propsA=s(Tr,e.RGBA16F,e.FLOAT,e.NEAREST),this.propsB=s(Tr,e.RGBA8,e.UNSIGNED_BYTE,e.NEAREST),this.slots=new Array(me*me).fill(null),this.maxY=40,this.pending=[]}setWorld(e){this.world=e,this.slots.fill(null)}update(e,t,s=2){const o=Math.floor(e/Et+.5),n=Math.floor(t/Et+.5),r=this.pending;r.length=0;let i=-1e9;for(let c=n-me/2;c<n+me/2;c++)for(let d=o-me/2;d<o+me/2;d++){const p=(c%me+me)%me*me+(d%me+me)%me,f=this.slots[p];if(f&&f.cx===d&&f.cz===c){f.maxH>i&&(i=f.maxH);continue}r.push({cx:d,cz:c,si:p,d:Math.hypot(d+.5-e/Et,c+.5-t/Et)})}r.sort((c,d)=>c.d-d.d);const l=Math.min(s,r.length);for(let c=0;c<l;c++){const d=r[c],p=this.world.chunk(d.cx,d.cz);this.upload(p,d.si),p.maxH>i&&(i=p.maxH)}return this.maxY=i+.5,r.length-l}refresh(e,t){const s=(t%me+me)%me*me+(e%me+me)%me,o=this.slots[s];o&&o.cx===e&&o.cz===t&&this.upload(this.world.chunk(e,t),s)}upload(e,t){const s=this.gl,o=t%me,n=t/me|0,r=(i,l,c,d)=>{s.bindTexture(s.TEXTURE_2D,i),s.texSubImage2D(s.TEXTURE_2D,0,o*l,n*l,l,l,s.RGBA,c,d)};r(this.height,Et,s.FLOAT,e.height),r(this.color,Et,s.UNSIGNED_BYTE,e.color),r(this.mat,Et,s.UNSIGNED_BYTE,e.mat),r(this.propsA,Cr,s.FLOAT,e.propsA),r(this.propsB,Cr,s.UNSIGNED_BYTE,e.propsB),this.slots[t]={cx:e.cx,cz:e.cz,maxH:e.maxH}}bind(e){e.tex("uHeightTex",this.height).tex("uColorTex",this.color).tex("uMatTex",this.mat).tex("uPropTexA",this.propsA).tex("uPropTexB",this.propsB).set("uMaxY",this.maxY)}}Nt("pencil",`
const vec3 PAPER = vec3(0.910, 0.886, 0.831);
const vec3 INK_SEPIA = vec3(0.384, 0.235, 0.118);
const vec3 INK_SOFT = vec3(0.502, 0.376, 0.259);
const vec3 INK_DARK = vec3(0.180, 0.140, 0.150);
const vec3 INK_BLACK = vec3(0.141, 0.137, 0.180);
const vec3 INK_LEAF = vec3(0.180, 0.478, 0.275);
const vec3 INK_WET = vec3(0.227, 0.502, 0.659);
const vec3 P_BUTTER = vec3(0.973, 0.816, 0.361), P_SUN = vec3(0.957, 0.745, 0.243), P_HONEY = vec3(0.910, 0.643, 0.188);
const vec3 P_APRICOT = vec3(0.941, 0.620, 0.290), P_POPPY = vec3(0.878, 0.361, 0.275), P_TAN = vec3(0.886, 0.737, 0.510);
const vec3 P_BARK = vec3(0.690, 0.502, 0.329), P_UMBER = vec3(0.478, 0.243, 0.173), P_CREAM = vec3(0.973, 0.910, 0.745);
const vec3 P_BRICK = vec3(0.737, 0.329, 0.235), P_LEAF = vec3(0.455, 0.659, 0.353), P_GREEN = vec3(0.376, 0.620, 0.329);
const vec3 P_SAGE = vec3(0.588, 0.698, 0.471), P_PINE = vec3(0.455, 0.612, 0.541), P_TEAL = vec3(0.275, 0.588, 0.588);
const vec3 P_SKY = vec3(0.533, 0.706, 0.847), P_SLATE = vec3(0.329, 0.424, 0.612), P_DUSK = vec3(0.259, 0.298, 0.612);
const vec3 P_INDIGO = vec3(0.157, 0.196, 0.502), P_STONE = vec3(0.588, 0.557, 0.518), P_WOOD = vec3(0.871, 0.698, 0.431);
const vec3 P_ROSE = vec3(0.878, 0.439, 0.502), P_PEACH = vec3(0.925, 0.780, 0.690), P_CLAY = vec3(0.820, 0.640, 0.590);
const vec3 P_MUSTARD = vec3(0.886, 0.690, 0.204), P_VERMILION = vec3(0.839, 0.275, 0.204), P_CHARCOAL = vec3(0.290, 0.300, 0.370);
uniform vec4 uPencil;
uniform vec3 uPaperAnchor;
uniform vec3 uPaperRight, uPaperUp, uPaperFwd;
uniform vec3 uPaperRightB, uPaperUpB, uPaperFwdB;
uniform float uPaperMix;
const float SLANT = 1.082;
const float PITCH0 = 1.0 / 64.0;
vec2 pencilLod(float viewDepth) {
float l = max(log2(max(uPencil.x * uPencil.y * viewDepth, 1e-5) / PITCH0), 0.0);
return vec2(floor(l), fract(l));
}
vec2 paperCoords(vec3 worldPos, vec3 right, vec3 up) {
vec3 d = worldPos - uPaperAnchor;
return vec2(dot(d, right), dot(d, up));
}
float pullPressure(float i, float along, vec2 lod, float seed) {
float id = i * exp2(lod.x);
float rh = hash11(id * 0.731 + seed * 57.0);
float pa = vnoise(vec2(along * 0.06, id * 0.37 + seed));
float pb = vnoise(vec2(along * 0.03, id * 0.37 + seed));
float keep = 1.0 - mod(i, 2.0) * smoothstep(0.2, 0.95, lod.y);
return mix(0.82, 1.06, rh) * mix(0.66, 1.12, mix(pa, pb, lod.y)) * keep;
}
float pullWeight(float i, vec2 lod, float seed) {
return mix(0.84, 1.1, hash11(i * exp2(lod.x) * 0.731 + seed * 57.0));
}
float pencilLay(vec2 uv, vec2 lod, float cover, float soft, float ang, float seed) {
if (cover < 0.015) return 0.0;
float pitch = PITCH0 * exp2(lod.x);
float w = lod.y, wide = mix(1.0, 2.0, w);
float tooth = 0.6 * mix(vnoise(uv / (pitch * 0.45) + seed * 3.1), vnoise(uv / (pitch * 0.9) + seed * 3.1), w)
+ 0.4 * mix(vnoise(uv / (pitch * 0.19) + 7.7), vnoise(uv / (pitch * 0.38) + 7.7), w);
vec2 wander = (vec2(vnoise(uv * 1.3 + seed), vnoise(uv * 1.3 + seed + 31.7)) - 0.5) * 0.022;
vec2 dir = vec2(cos(ang), sin(ang));
float along = dot(uv + wander, dir) / pitch;
float across = (dot(uv + wander, vec2(-dir.y, dir.x)) + seed * 0.37) / pitch;
if (soft > 0.5) {
float i0 = floor(across), f = across - i0;
float odd0 = mod(i0, 2.0);
float iE = i0 + odd0, iO = i0 + 1.0 - odd0, iE2 = 2.0 * iO - iE;
float pE = pullWeight(iE, lod, seed), pE2 = pullWeight(iE2, lod, seed);
float pO = mix(pullWeight(iO, lod, seed), 0.5 * (pE + pE2), smoothstep(0.2, 0.95, w));
float t = f * f * (3.0 - 2.0 * f);
float streak = odd0 < 0.5 ? mix(pE, pO, t) : mix(pO, pE, t);
float drift = mix(0.78, 1.12, vnoise(uv * vec2(0.9, 0.9) + dir * dot(uv, dir) * 0.6 + seed * 5.0));
float p = mix(0.36, 1.0, cover) * streak * drift;
return smoothstep(tooth - 0.42, tooth + 0.3, p * 0.86);
}
float i = floor(across + 0.5), fy = across - i;
float rh = hash11(i * exp2(lod.x) * 0.317 + seed * 11.0);
float halfW = 0.5 * mix(0.6, 1.5, cover) * wide * (1.0 - 0.45 * mod(i, 2.0) * w);
float centre = (rh - 0.5) * 0.3 * wide;
float shape = 1.0 - smoothstep(halfW - 0.3 * wide, halfW, abs(fy - centre));
float p = mix(0.45, 1.0, cover) * pullPressure(i, along, lod, seed);
return max(shape, 0.3 * step(0.6, cover)) * smoothstep(tooth - 0.34, tooth + 0.22, p * 0.88);
}
vec3 shadowPencil(vec3 c) {
float mx = max(c.r, max(c.g, c.b)), mn = min(c.r, min(c.g, c.b));
float sat = (mx - mn) / max(mx, 1e-3);
vec3 deep = mix(c, c * c * 1.15, 0.62);
float warm = saturate((c.r - c.b) * 2.4 - max(c.g - c.r, 0.0) * 6.0);
deep = mix(deep, P_BRICK * (0.62 + 0.45 * mx), warm * 0.5);
float own = mix(smoothstep(0.12, 0.34, sat), smoothstep(0.3, 0.55, sat), warm);
return mix(vec3(0.50, 0.55, 0.69), deep, own);
}
vec3 nightPencil(vec3 c) {
return mix(P_INDIGO * 1.15, c * vec3(0.62, 0.72, 0.95), 0.42);
}
vec3 paperSheet(vec2 px) {
float g = vnoise(px * 0.55) * 0.5 + vnoise(px * 0.13) * 0.3 + hash12(floor(px)) * 0.2;
return PAPER * (1.0 + (g - 0.5) * 0.07);
}
vec3 layOn(vec3 page, vec3 pigment, float density) { return mix(page, pigment * (page / PAPER), density); }
vec3 shadeOn(vec3 page, vec3 pigment, float density) { return page * mix(vec3(1.0), pigment, density); }
vec3 inkOn(vec3 page, vec3 ink, float amount) { return mix(page, ink, amount); }
`);Nt("frame",`
uniform vec3 uCamPos, uCamRight, uCamUp, uCamFwd;
uniform vec2 uTanFov;
uniform vec3 uFocus;
uniform float uTime;
uniform vec3 uSunDir;
uniform vec3 uSunDisk, uMoonDisk;
uniform float uNight;
uniform float uGold;
uniform float uCloud;
uniform vec2 uWind;
`);Nt("sky",`
vec3 skyLay(vec3 rd, out float cover, out float ink) {
float h = max(rd.y, 0.0);
ink = 0.0;
vec3 pig = P_SKY;
cover = mix(0.1, 0.5, smoothstep(0.02, 0.5, h));
float low = exp(-h * 6.0);
pig = mix(pig, mix(P_APRICOT, P_ROSE, 0.3), uGold * low * 0.9);
cover = mix(cover, 0.4, uGold * low);
pig = mix(pig, mix(P_INDIGO, P_DUSK, 0.4), uNight);
cover = mix(cover, mix(0.6, 0.86, smoothstep(0.0, 0.5, h)), uNight);
if (rd.y > 0.01) {
vec2 uv = rd.xz / (rd.y + 0.16) * 1.1 + uWind * uTime * 0.012;
float edge = 0.6 - uCloud * 0.28;
float cloud = smoothstep(edge - 0.02, edge + 0.06, fbm(uv)) * smoothstep(0.01, 0.14, rd.y);
cover *= 1.0 - cloud * mix(0.96, 0.5, uNight);
if (uNight > 0.05) {
vec2 sp = rd.xz / (rd.y + 0.35) * 42.0;
vec2 cell = floor(sp);
float star = hash12(cell);
vec2 so = hash22(cell + 3.1) - 0.5;
cover *= 1.0 - smoothstep(0.1, 0.04, length(fract(sp) - 0.5 - so * 0.6)) * step(0.8, star) * uNight;
}
}
cover *= 1.0 - smoothstep(0.9984, 0.9990, dot(rd, uSunDisk)) * (1.0 - uNight) * step(0.0, rd.y);
float md = dot(rd, uMoonDisk);
float moon = smoothstep(0.9986, 0.9991, md) * (1.0 - 0.9 * smoothstep(0.9986, 0.9991, dot(rd, normalize(uMoonDisk + vec3(0.022, 0.013, 0.0)))));
cover *= 1.0 - moon * uNight;
vec2 az = normalize(rd.xz + 1e-5);
float r1 = 0.02 + 0.1 * fbm(az * 2.2 + 4.0);
float r2 = 0.01 + 0.06 * fbm(az * 3.6 + 11.0);
float m1 = smoothstep(r1 + 0.002, r1, rd.y), m2 = smoothstep(r2 + 0.002, r2, rd.y);
vec3 far1 = mix(P_SKY, P_SAGE, 0.4), far2 = mix(P_SAGE, P_PINE, 0.45);
far1 = mix(far1, nightPencil(far1), uNight); far2 = mix(far2, nightPencil(far2), uNight);
pig = mix(pig, far1, m1); cover = mix(cover, mix(0.26, 0.6, uNight), m1);
pig = mix(pig, far2, m2); cover = mix(cover, mix(0.36, 0.72, uNight), m2);
ink = max(smoothstep(0.003, 0.0, abs(rd.y - r1)), smoothstep(0.003, 0.0, abs(rd.y - r2))) * 0.3;
float mist = smoothstep(-0.005, 0.03, rd.y);
cover *= mist; ink *= mist;
return pig;
}
`);Nt("lighting",`
struct Surf { vec3 albedo; float cover; float ink; float soft; float solid; float glow; float wrap; float leafy; float moss; float occ; };
Surf newSurf() { return Surf(P_STONE, 0.8, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 1.0); }
uniform vec4 uLightPos[MAX_LIGHTS];
uniform vec3 uLightCol[MAX_LIGHTS];
uniform int uLightCount;
float gSun = 1.0;
float gPen = 0.02;
float penLine(float d) { return 1.0 - smoothstep(gPen * 0.55, gPen * 1.15, abs(d)); }
float lightPool(vec3 p, vec3 N) {
float acc = 0.0;
for (int i = 0; i < MAX_LIGHTS; i++) {
if (i >= uLightCount) break;
vec3 d = uLightPos[i].xyz - p;
float r = uLightPos[i].w, d2 = dot(d, d);
if (d2 < r * r) {
float att = 1.0 - d2 / (r * r);
float nl = dot(N, d * inversesqrt(d2 + 1e-4)) * 0.5 + 0.5;
acc += uLightCol[i].r * att * att * mix(0.5, 1.0, nl);
}
}
return saturate(acc);
}
float shadeAmount(Surf s, vec3 N, float shadow, float ao) {
float ndl = dot(N, uSunDir);
float i = saturate((ndl + s.wrap) / (1.0 + s.wrap)) * shadow;
float lit = 0.45 * smoothstep(0.015, 0.075, i) + 0.55 * smoothstep(0.3, 0.38, i);
float sh = max(1.0 - lit, (1.0 - ao) * 0.85);
return max(sh, (1.0 - gSun) * 0.9);
}
float sphereShadow(vec3 ro, vec3 rd, vec4 sph, float k) {
vec3 oc = ro - sph.xyz;
float b = dot(oc, rd);
float c = dot(oc, oc) - sph.w * sph.w;
float h = b * b - c;
return (b > 0.0) ? step(-0.0001, c) : smoothstep(0.0, 1.0, h * k / b);
}
`);Nt("terrain",`
uniform sampler2D uHeightTex;
uniform sampler2D uColorTex;
uniform sampler2D uMatTex;
uniform sampler2D uPropTexA;
uniform sampler2D uPropTexB;
uniform float uMaxY;
const float INV_T = 1.0 / WORLD_TEX;
vec4 hSample(vec2 xz) { return textureLod(uHeightTex, (xz + 0.5) * INV_T, 0.0); }
float hAt(vec2 xz) { return textureLod(uHeightTex, (xz + 0.5) * INV_T, 0.0).r; }
vec3 terrainNormal(vec2 xz) {
const float e = 0.7;
return normalize(vec3(hAt(xz - vec2(e, 0.0)) - hAt(xz + vec2(e, 0.0)), 2.0 * e,
hAt(xz - vec2(0.0, e)) - hAt(xz + vec2(0.0, e))));
}
bool cellProp(ivec2 cell, out Prop pr) {
ivec2 tc = cell & (CELLS - 1);
vec4 a = texelFetch(uPropTexA, tc, 0);
pr.type = int(a.w + 0.5);
if (pr.type == 0) return false;
vec4 b = texelFetch(uPropTexB, tc, 0);
vec2 c = (vec2(cell) + 0.5) * CELL + a.xy;
pr.base = vec3(c.x, a.z, c.y);
pr.rot = b.x * TAU; pr.scale = b.y * 2.0; pr.seed = b.z; pr.pal = b.w * 255.0;
return true;
}
mat2 propRot(Prop pr) { return rot2(pr.rot); }
vec3 toProp(vec3 p, Prop pr, mat2 r) { vec3 q = p - pr.base; q.xz = r * q.xz; return q / pr.scale; }
float cellExit(vec2 xz, vec2 dir) {
vec2 f = fract(xz / CELL);
vec2 e = mix(f, 1.0 - f, step(0.0, dir)) * CELL / (abs(dir) + 1e-5);
return min(e.x, e.y) + 0.02;
}
struct Hit { float t; int kind; float mat; Prop pr; ivec2 cell; };
bool gReveal = false;
float gRevealT = 0.0;
void marchScene(vec3 ro, vec3 rd, float tMin, float tMax, out Hit hit) {
hit.kind = 0; hit.t = tMax; hit.mat = 0.0; hit.cell = ivec2(0);
float t = tMin, tPrev = tMin;
ivec2 last = ivec2(-99999);
bool has = false;
Prop pr; mat2 pm;
for (int i = 0; i < MARCH_STEPS; i++) {
vec3 p = ro + rd * t;
float above = p.y - hAt(p.xz);
float eps = 0.0016 * t + 0.003;
if (above < eps) {
float a = tPrev, b = t;
for (int k = 0; k < 5; k++) {
float m = 0.5 * (a + b);
vec3 q = ro + rd * m;
if (q.y - hAt(q.xz) < eps) b = m; else a = m;
}
hit.t = b; hit.kind = 1;
return;
}
float d;
if (above < PROP_HMAX) {
d = above * 0.5;
ivec2 cell = ivec2(floor(p.xz / CELL));
if (cell != last) { last = cell; has = cellProp(cell, pr); if (has) pm = propRot(pr); }
if (has) {
float m;
float dp = propSdf(toProp(p, pr, pm), pr, m) * pr.scale;
if (dp < eps) {
if (!(gReveal && t < gRevealT && propSeeThrough(pr.type, m))) {
hit.t = t; hit.kind = 2; hit.mat = m; hit.pr = pr; hit.cell = cell;
return;
}
dp = 0.3;
}
d = min(d, dp);
}
d = min(d, cellExit(p.xz, rd.xz));
} else {
d = (above - PROP_HMAX) * 0.5 + 0.35;
}
tPrev = t;
t += max(d, 0.02);
if (t > tMax) break;
}
}
float shadowMarch(vec3 p, vec3 L) {
float res = 1.0, t = 0.1;
ivec2 last = ivec2(-99999);
bool has = false;
Prop pr; mat2 pm;
for (int i = 0; i < SHADOW_STEPS; i++) {
vec3 q = p + L * t;
float above = q.y - hAt(q.xz);
if (above < -0.03) return 0.0;
float d = above * 0.6 + 0.06;
if (t > 1.5) res = min(res, 16.0 * above / t);
if (above < PROP_HMAX) {
ivec2 cell = ivec2(floor(q.xz / CELL));
if (cell != last) { last = cell; has = cellProp(cell, pr); if (has) pm = propRot(pr); }
if (has) {
float m;
float dp = propSdf(toProp(q, pr, pm), pr, m) * pr.scale;
if (dp < 0.01) return 0.0;
res = min(res, 11.0 * dp / t);
d = min(d, dp);
}
d = min(d, cellExit(q.xz, L.xz));
}
t += clamp(d, 0.07, 5.0);
if (res < 0.02 || q.y > uMaxY || t > 46.0) break;
}
return saturate(res);
}
float cloudShadow(vec2 xz) {
float d = fbm(xz * 0.011 + uWind * uTime * 0.02);
float edge = 0.66 - uCloud * 0.3;
return 1.0 - 0.3 * smoothstep(edge - 0.08, edge + 0.08, d) * (1.0 - uNight * 0.6);
}
`);Nt("ground",`
float gGrass = 0.0;
void groundSurf(vec3 p, float t, inout vec3 N, out Surf s, out float canopy) {
s = newSurf();
vec2 uv = (p.xz + 0.5) * INV_T;
vec4 ct = textureLod(uColorTex, uv, 0.0);
vec4 mt = textureLod(uMatTex, uv, 0.0);
vec4 hs = textureLod(uHeightTex, uv, 0.0);
canopy = hs.g;
float grass = mt.r, sand = mt.g, snow = mt.b, rock = mt.a, path = ct.a;
float lod = smoothstep(85.0, 24.0, t);
vec3 col = ct.rgb;
float swatch = fbm(p.xz * 0.07);
float swatch2 = fbm(p.xz * 0.023 + 40.0);
col = mix(col, mix(col, P_BUTTER, 0.42), smoothstep(0.5, 0.78, swatch2) * grass * 0.75);
col = mix(col, mix(col, P_PINE, 0.5), smoothstep(0.45, 0.2, swatch2) * grass * 0.6);
s.soft = 1.0;
s.cover = mix(0.4, 0.68, swatch) * mix(0.75, 1.0, grass);
gGrass = grass * lod;
float fl = hs.b * grass * lod;
if (fl > 0.02) {
vec2 fv = voronoi(p.xz * 1.9 + 31.0);
float bloom = smoothstep(0.14, 0.1, fv.x) * step(1.0 - fl * 0.3, fract(fv.y * 3.7));
col = mix(col, fv.y < 0.66 ? P_ROSE : P_SUN, bloom);
s.cover = mix(s.cover, fv.y < 0.33 ? 0.0 : 0.95, bloom);
s.ink = max(s.ink, smoothstep(0.04, 0.02, fv.x) * step(fv.y, 0.33) * bloom * 0.7);
gGrass *= 1.0 - bloom;
}
if (path > 0.03) {
float cob = smoothstep(0.6, 0.85, path);
float on = smoothstep(0.03, 0.3, path);
float pf = mix(2.4, 1.2, cob);
vec2 pv = pavers(p.xz * pf);
float joint = penLine(0.5 * pv.x / pf);
vec3 dirt = mix(P_TAN, P_BARK, 0.25 * pv.y);
float dirtCover = mix(0.16, 0.34, swatch);
float dirtInk = joint * step(0.82, pv.y) * 0.55;
float tone = fract(pv.y * 7.31);
vec3 stone = tone < 0.4 ? P_PEACH : (tone < 0.75 ? P_CLAY : mix(P_STONE, P_CREAM, 0.5));
float stoneCover = mix(0.36, 0.8, fract(pv.y * 3.17));
col = mix(col, mix(dirt, stone, cob), on);
s.cover = mix(s.cover, mix(dirtCover, stoneCover, cob), on);
s.ink = max(s.ink, mix(dirtInk, joint * 0.8, cob) * on * mix(0.4, 1.0, lod));
gGrass *= 1.0 - smoothstep(0.08, 0.35, path);
}
if (sand > 0.04) {
vec2 sv = voronoi(p.xz * 3.1);
col = mix(col, mix(P_TAN, P_CREAM, 0.45), sand);
s.cover = mix(s.cover, 0.14 + 0.3 * hs.a + 0.1 * swatch, sand);
s.ink = max(s.ink, smoothstep(0.07, 0.035, sv.x) * step(0.8, sv.y) * 0.5 * sand * lod);
}
if (rock > 0.04) {
float strata = vnoise(vec2(p.y * 3.2 + vnoise(p.xz * 0.5) * 3.0, dot(p.xz, vec2(0.4, 0.3))));
col = mix(col, uRockCol, rock * 0.85);
s.cover = mix(s.cover, mix(0.5, 0.78, strata), rock);
s.ink = max(s.ink, smoothstep(0.05, 0.0, abs(fract(strata * 3.0) - 0.5)) * 0.6 * rock * lod);
N = normalize(N + vec3(strata - 0.5, 0.0, 0.5 - strata) * 0.5 * rock);
}
if (snow > 0.04) {
float drift = vnoise(vec2(dot(p.xz, vec2(0.8, 0.6)) * 0.22, dot(p.xz, vec2(-0.6, 0.8)) * 1.3));
col = mix(col, mix(P_SKY, P_SLATE, 0.2), snow);
s.cover = mix(s.cover, 0.015 + 0.13 * smoothstep(0.5, 0.15, drift * 0.6 + swatch * 0.6), snow);
}
s.albedo = col;
}
`);const s0=`
in vec2 vUv;
layout(location = 0) out vec4 oLay;
layout(location = 1) out vec4 oGbuf;
layout(location = 2) out vec4 oMark;
layout(location = 3) out vec4 oSheet;
uniform vec3 uRockCol;
uniform vec3 uLeafPal[12];
uniform vec4 uCasters[MAX_CASTERS];
uniform int uCasterCount;
uniform vec4 uReveal;
uniform float uPen;
float gSnow = 0.0;
#include <common>
#include <frame>
#include <pencil>
#include <lighting>
#include <props>
#include <terrain>
#include <ground>
#include <sky>
float casterShadow(vec3 p) {
float s = 1.0;
for (int i = 0; i < MAX_CASTERS; i++) {
if (i >= uCasterCount) break;
s = min(s, sphereShadow(p, uSunDir, uCasters[i], 4.0));
}
return s;
}
float casterContact(vec3 p) {
float o = 0.0;
for (int i = 0; i < MAX_CASTERS; i++) {
if (i >= uCasterCount) break;
vec4 c = uCasters[i];
float flat_ = 1.0 - smoothstep(0.35 * c.w, 1.15 * c.w, length(p.xz - c.xz));
o = max(o, flat_ * (1.0 - smoothstep(0.0, 1.3 * c.w, abs(p.y - (c.y - c.w)))));
}
return o;
}
vec3 propNormal(vec3 q, Prop pr) {
const vec2 e = vec2(1.0, -1.0) * 0.012;
float m;
return normalize(e.xyy * propSdf(q + e.xyy, pr, m) + e.yyx * propSdf(q + e.yyx, pr, m) +
e.yxy * propSdf(q + e.yxy, pr, m) + e.xxx * propSdf(q + e.xxx, pr, m));
}
void lightSurf(inout Surf s, vec3 p, vec3 N, float shadow, float ao, out float shade) {
shade = shadeAmount(s, N, shadow, ao * s.occ);
float facing = smoothstep(0.55, 0.95, dot(N, uSunDir)) * (1.0 - shade);
s.cover *= 1.0 - 0.28 * facing;
float pool = lightPool(p, N);
s.cover *= (1.0 - 0.88 * max(pool, s.glow));
shade *= (1.0 - max(pool, s.glow));
s.albedo = mix(s.albedo, nightPencil(s.albedo), uNight * (1.0 - pool));
s.cover = mix(s.cover, min(1.0, s.cover * 1.22 + 0.08 * step(0.02, s.cover)), uNight * (1.0 - pool) * (1.0 - s.glow));
}
void main() {
vec2 ndc = vUv * 2.0 - 1.0;
vec3 ro = uCamPos;
vec3 rd = normalize(uCamFwd + uCamRight * (ndc.x * uTanFov.x) + uCamUp * (ndc.y * uTanFov.y));
vec2 oc = ro.xz - uFocus.xz;
float qa = dot(rd.xz, rd.xz), qb = dot(oc, rd.xz), qc = dot(oc, oc) - VIEW_DIST * VIEW_DIST;
float disc = qb * qb - qa * qc;
float tMax = (qa > 1e-6 && disc > 0.0) ? min((-qb + sqrt(disc)) / qa, 420.0) : 420.0;
float tMin = 0.05;
if (ro.y > uMaxY) tMin = rd.y < 0.0 ? (uMaxY - ro.y) / rd.y : tMax;
vec2 fromHero = (ndc - uReveal.xy) * vec2(uTanFov.x / uTanFov.y, 1.0);
gReveal = length(fromHero) < uReveal.z * (0.86 + 0.28 * vnoise(vUv * 26.0));
gRevealT = uReveal.w - 0.7;
Hit hit;
hit.kind = 0; hit.t = tMax; hit.mat = 0.0; hit.cell = ivec2(0);
if (tMin < tMax) marchScene(ro, rd, tMin, tMax, hit);
float tw = (rd.y < -1e-4 && ro.y > SEA) ? (SEA - ro.y) / rd.y : 1e9;
bool wet = tw < hit.t;
Surf s = newSurf();
vec3 N = vec3(0.0, 1.0, 0.0);
float depth = hit.t, id = 0.0, shade = 0.0, grass = 0.0, kind = 0.0;
vec2 sheet = vec2(8.0);
if (hit.kind == 0 && !wet) {
float skyInk;
s.albedo = skyLay(rd, s.cover, skyInk);
s.ink = skyInk;
kind = 1.0;
depth = 9000.0;
id = -1.0;
} else {
vec3 p = ro + rd * hit.t;
gPen = max(hit.t * uPen, 0.004);
if (hit.kind == 1) {
N = terrainNormal(p.xz);
vec3 Nd = N;
float canopy;
groundSurf(p, hit.t, Nd, s, canopy);
float sh = wet ? 1.0 : shadowMarch(p + N * 0.05, uSunDir);
gSun = cloudShadow(p.xz);
sh = min(sh, casterShadow(p + N * 0.03));
float ao = (1.0 - 0.3 * canopy) * (1.0 - 0.55 * casterContact(p));
lightSurf(s, p, Nd, sh, ao, shade);
grass = gGrass;
kind = s.soft;
id = 0.02;
sheet = vec2(dot(rd, uPaperFwd), dot(rd, uPaperFwdB)) * hit.t;
} else if (hit.kind == 2) {
mat2 pm = propRot(hit.pr);
vec3 q = toProp(p, hit.pr, pm);
vec3 n = propNormal(q, hit.pr);
vec2 buv = (hit.pr.base.xz + 0.5) * INV_T;
vec4 bm = textureLod(uMatTex, buv, 0.0);
gSnow = bm.b;
propMat(q, hit.mat, hit.pr, s);
vec3 ng = n;
if (s.leafy > 0.5) {
vec3 j = vec3(vnoise3(q * 2.6 + 1.7), vnoise3(q * 2.6 + 5.3), vnoise3(q * 2.6 + 9.1)) - 0.5;
n = normalize(n + j * 1.1 + vec3(0.0, 0.22, 0.0));
}
if (s.moss > 0.0) {
float mossy = smoothstep(0.55, 0.8, n.y) * s.moss * max(bm.r, bm.b);
s.albedo = mix(s.albedo, mix(textureLod(uColorTex, buv, 0.0).rgb, P_SAGE, 0.3), mossy);
}
mat2 back = transpose(pm);
N = vec3(back * n.xz, n.y).xzy;
vec3 Ng = vec3(back * ng.xz, ng.y).xzy;
gSun = cloudShadow(p.xz);
float sh = shadowMarch(p + Ng * 0.08, uSunDir);
float open = saturate(propSdf(q + ng * 0.4, hit.pr, hit.mat) / 0.4);
float ao = (0.6 + 0.4 * saturate(q.y * 0.5)) * mix(0.5, 1.0, open);
lightSurf(s, p, N, sh, ao, shade);
kind = s.soft;
id = 0.1 + 0.9 * hash12(floor(hit.pr.base.xz * 2.0 + 0.5));
vec3 stand = hit.pr.base + vec3(0.0, 1.5 * hit.pr.scale, 0.0) - ro;
sheet = max(vec2(dot(stand, uPaperFwd), dot(stand, uPaperFwdB)), 1.0);
} else {
s.albedo = P_SLATE; s.cover = 0.7;
}
if (wet) {
vec3 wp = ro + rd * tw;
float depthV = max(SEA - hAt(wp.xz), 0.0);
float k = saturate(depthV / 3.0);
float wob = vnoise(wp.xz * 1.3 + uTime * 0.2);
float lip = 1.0 - smoothstep(0.04, 0.14 + 0.1 * wob, depthV);
float band = smoothstep(0.72, 0.9, sin(depthV * 11.0 - uTime * 1.6 + wob * 4.0));
band *= (1.0 - smoothstep(0.3, 1.0, depthV)) * step(0.35, wob + 0.15);
float foam = saturate(lip + band * 0.7);
vec3 water = mix(P_SKY, mix(P_TEAL, P_SLATE, 0.45), k);
s.albedo = mix(mix(s.albedo, water, saturate(0.45 + depthV * 0.9)), nightPencil(water), uNight);
s.cover = mix(0.32, 0.72, k) * (1.0 - foam) * mix(1.0, 1.15, uNight);
s.ink = 0.0;
shade = (1.0 - cloudShadow(wp.xz)) * 0.6 * (1.0 - foam);
N = vec3(0.0, 1.0, 0.0);
depth = tw; p = wp; id = 0.05; grass = 0.0;
sheet = vec2(dot(rd, uPaperFwd), dot(rd, uPaperFwdB)) * tw;
kind = 2.0 - foam;
}
float thin = 1.0 - 0.42 * smoothstep(26.0, 100.0, depth);
float edge = 1.0 - smoothstep(VIEW_DIST * 0.66, VIEW_DIST * 0.97, length(p.xz - uFocus.xz));
s.cover *= thin * edge;
shade *= thin * edge;
s.ink *= mix(1.0, 0.55, smoothstep(26.0, 100.0, depth)) * edge;
grass *= edge;
id = edge < 0.03 ? -1.0 : id;
}
oLay = vec4(s.albedo, s.cover);
oGbuf = vec4(octEncode(N), depth, id);
oMark = vec4(shade, s.ink, grass, kind);
oSheet = vec4(sheet, 0.0, 1.0);
}
`,o0={high:{MARCH_STEPS:120,SHADOW_STEPS:28},low:{MARCH_STEPS:84,SHADOW_STEPS:12}};class n0{constructor(e){this.gl=e,this.programs={}}program(e){return this.programs[e]||(this.programs[e]=new fs(this.gl,"world:"+e,vn,s0,o0[e]))}render(e,t,s,o,n){const r=this.gl,i=this.program(n).use();e.bind(),r.disable(r.DEPTH_TEST),r.disable(r.BLEND),o(i),s.bind(i),i.set("uCasters",t.casters).set("uCasterCount",t.casterCount),i.set("uPen",2*t.camera.tan[1]/e.height*1.3),gn(r)}}const Wn=new Map,Ha=24;function Tt(a){return Wn.set(a.id,a),a}const r0=`
layout(location = 0) in vec4 iPosScale;
layout(location = 1) in vec4 iPose;
layout(location = 2) in vec4 iLook;
layout(location = 3) in vec4 iColA;
layout(location = 4) in vec4 iColB;
layout(location = 5) in vec4 iColC;
uniform mat4 uViewProj;
uniform vec3 uCamRight, uCamUp;
uniform vec2 uBound;
out vec3 vWorld;
flat out vec4 vPosScale, vPose, vLook, vColA, vColB, vColC;
void main() {
vec2 corner = vec2(float(gl_VertexID & 1), float(gl_VertexID >> 1)) * 2.0 - 1.0;
float s = iPosScale.w;
vec3 c = iPosScale.xyz + vec3(0.0, uBound.x * s, 0.0);
vec3 wp = c + (uCamRight * corner.x + uCamUp * corner.y) * (uBound.y * s * 1.22 + 0.12);
vWorld = wp;
vPosScale = iPosScale; vPose = iPose; vLook = iLook; vColA = iColA; vColB = iColB; vColC = iColC;
gl_Position = uViewProj * vec4(wp, 1.0);
}
`,i0=a=>`
in vec3 vWorld;
flat in vec4 vPosScale, vPose, vLook, vColA, vColB, vColC;
layout(location = 0) out vec4 oColor;
layout(location = 1) out vec4 oAux;
uniform vec2 uBound;
uniform float uFar, uPixel;
#include <common>
#include <frame>
#include <pencil>
#include <lighting>
vec4 ePose, eLook;
vec3 eColA, eColB, eColC;
float eMove, eExtra, eSpare;
${a.glsl}
vec3 entNormal(vec3 p) {
const vec2 e = vec2(1.0, -1.0) * 0.006;
float m;
return normalize(e.xyy * entMap(p + e.xyy, m) + e.yyx * entMap(p + e.yyx, m) +
e.yxy * entMap(p + e.yxy, m) + e.xxx * entMap(p + e.xxx, m));
}
void main() {
ePose = vec4(vPose.yzw, vColA.w); eLook = vLook;
eColA = vColA.rgb; eColB = vColB.rgb; eColC = vColC.rgb;
eMove = vColA.w; eExtra = vColB.w; eSpare = vColC.w;
float scale = vPosScale.w;
mat2 R = rot2(vPose.x);
vec3 rdW = normalize(vWorld - uCamPos);
vec3 lo = (uCamPos - vPosScale.xyz) / scale;
lo.xz = R * lo.xz;
vec3 ld = rdW;
ld.xz = R * ld.xz;
vec3 oc = lo - vec3(0.0, uBound.x, 0.0);
float b = dot(oc, ld), h = b * b - (dot(oc, oc) - uBound.y * uBound.y * 1.21);
if (h < 0.0) discard;
h = sqrt(h);
float t = max(-b - h, 0.0), tEnd = -b + h;
entPose();
float pix = uPixel / scale;
float mat = 0.0, minD = 1e3, tEdge = t, inner = 0.0;
bool hit = false;
float w = max(OUTLINE_PX * pix * t, 0.03);
for (int i = 0; i < ${a.steps||56}; i++) {
float d = entMap(lo + ld * t, mat);
if (d < 0.5 * pix * t) { hit = true; break; }
if (d < minD) { minD = d; tEdge = t; }
else if (minD < w * 0.6 && d > minD + w * 0.5) inner = max(inner, smoothstep(w * 0.6, w * 0.25, minD));
t += d * 0.92;
if (t > tEnd) break;
}
vec3 pe = lo + ld * tEdge;
float press = mix(0.72, 1.0, vnoise(pe.xy * 5.0 + eLook.x * 31.0));
float contour = hit ? 0.0 : smoothstep(w, w * 0.5, minD);
float again = hit ? 0.0 : smoothstep(1.85 * w, 1.65 * w, minD) * smoothstep(1.2 * w, 1.35 * w, minD)
* step(0.76, vnoise(pe.xy * 1.6 + eLook.x * 9.0)) * ${(a.again??.3).toFixed(2)};
float edge = max(max(contour, inner) * press, again);
if (!hit && edge < 0.02) discard;
float flags = eLook.w;
bool hover = mod(flags, 4.0) >= 2.0;
vec3 ink = hover ? P_VERMILION * 0.85 : INK_DARK;
vec3 col = ink;
float alpha = edge, tOut = tEdge, lineOut = edge;
if (hit) {
vec3 p = lo + ld * t;
vec3 n = entNormal(p);
Surf s = newSurf();
gPen = max(pix * t * 1.5 * uPencil.w, 0.006);
entSurf(p, mat, s);
mat2 back = transpose(R);
vec3 N = vec3(back * n.xz, n.y).xzy;
vec3 wp = uCamPos + rdW * (t * scale);
float shade = max(smoothstep(0.2, -0.45, N.y) * 0.85, (1.0 - eLook.z) * 0.75) * s.occ;
float pool = lightPool(wp, N);
float lift = max(s.glow, eLook.y);
vec3 pig = mix(s.albedo, nightPencil(s.albedo), uNight * (1.0 - max(pool, s.glow)) * 0.8);
float cover = s.cover * (1.0 - 0.9 * lift);
shade *= (1.0 - lift) * (1.0 - 0.5 * pool);
float sheet = max(dot(vPosScale.xyz - uCamPos, uCamFwd), 0.5);
vec3 rel = uCamPos + rdW * (sheet / dot(rdW, uCamFwd)) - vPosScale.xyz;
vec2 boil = (hash22(vec2(uPencil.z, eLook.x * 91.0)) - 0.5) * 0.01;
vec2 uv = vec2(dot(rel, uCamRight), dot(rel, uCamUp)) + vec2(eLook.x * 7.3, eLook.x * 3.1) + boil;
vec2 lod = pencilLod(sheet);
vec3 page = paperSheet(gl_FragCoord.xy);
float m1 = mix(pencilLay(uv, lod, cover, s.soft, SLANT, eLook.x), step(0.02, cover), s.solid);
col = layOn(page, pig, m1);
float m2 = mix(pencilLay(uv, lod, shade * 0.8, 0.0, SLANT - 0.105, eLook.x + 5.0), pencilLay(uv, lod, shade * 0.8, 1.0, SLANT - 0.105, eLook.x + 5.0), 0.5) * (1.0 - s.solid);
col = shadeOn(col, shadowPencil(pig), m2);
float marks = max(inner * press, smoothstep(0.25, 0.5, s.ink) * 0.85);
col = inkOn(col, ink, marks);
alpha = 1.0; tOut = t; lineOut = marks;
}
float tw = tOut * scale;
oColor = vec4(col * alpha, alpha);
oAux = vec4(tw, mod(flags, 2.0), hit ? lineOut * 0.5 : edge, 1.0);
gl_FragDepth = clamp(tw / uFar, 0.0, 0.9999);
}
`;class l0{constructor(e){this.gl=e,this.programs=new Map,this.vao=e.createVertexArray(),this.vbo=e.createBuffer(),this.capacity=0,e.bindVertexArray(this.vao),e.bindBuffer(e.ARRAY_BUFFER,this.vbo);for(let t=0;t<6;t++)e.enableVertexAttribArray(t),e.vertexAttribPointer(t,4,e.FLOAT,!1,Ha*4,t*16),e.vertexAttribDivisor(t,1);e.bindVertexArray(null)}program(e){let t=this.programs.get(e);if(!t){const s=Wn.get(e);if(!s)throw new Error(`Unknown archetype "${e}"`);t=new fs(this.gl,"entity:"+e,r0,i0(s),{OUTLINE_PX:"1.6"}),t.def=s,s.init?.(this.gl),this.programs.set(e,t)}return t}render(e,t,s,o){const n=this.gl;e.bind(),n.clearColor(0,0,0,0),n.clearDepth(1),n.depthMask(!0),n.clear(n.COLOR_BUFFER_BIT|n.DEPTH_BUFFER_BIT),n.enable(n.DEPTH_TEST),n.depthFunc(n.LESS),n.enable(n.BLEND),n.blendFunc(n.ONE,n.ONE_MINUS_SRC_ALPHA),n.bindVertexArray(this.vao),n.bindBuffer(n.ARRAY_BUFFER,this.vbo);for(const[r,i]of s){if(!i.count)continue;const l=this.program(r).use();o(l),l.set("uTime",t.timeTwos),l.set("uViewProj",t.camera.viewProj).set("uBound",[l.def.boundY,l.def.boundR]),l.set("uFar",t.far).set("uPixel",2*t.camera.tan[1]/e.height),l.def.bind?.(l,n);const c=i.count*Ha*4;c>this.capacity&&(this.capacity=c*2,n.bufferData(n.ARRAY_BUFFER,this.capacity,n.DYNAMIC_DRAW)),n.bufferSubData(n.ARRAY_BUFFER,0,i.data,0,i.count*Ha),n.drawArraysInstanced(n.TRIANGLE_STRIP,0,4,i.count)}n.bindVertexArray(null),n.disable(n.DEPTH_TEST),n.disable(n.BLEND)}}const uo=[],ul=new Map,os=16;function he(a,e){const t={id:a,type:uo.length,glsl:e};return uo.push(t),ul.set(a,t),t}const c0=a=>ul.get(a).type,d0=`
layout(location = 0) in vec4 iPosSize;
layout(location = 1) in vec4 iParams;
layout(location = 2) in vec4 iColor;
layout(location = 3) in vec4 iMore;
uniform mat4 uViewProj;
uniform vec3 uCamPos, uCamRight, uCamUp;
uniform float uFar;
out vec2 vUv;
out float vT;
out vec3 vWorld;
flat out vec4 vParams, vColor, vMore, vPosSize;
#include <common>
void main() {
vec2 corner = vec2(float(gl_VertexID & 1), float(gl_VertexID >> 1)) * 2.0 - 1.0;
vec3 wp;
if (iMore.x > 1.5) {
float cp = cos(iMore.w);
vec3 ax = vec3(sin(iParams.w) * cp, sin(iMore.w), cos(iParams.w) * cp);
vec3 side = cross(ax, uCamPos - iPosSize.xyz);
side = length(side) > 1e-4 ? normalize(side) : uCamRight;
wp = iPosSize.xyz + (side * corner.x + ax * corner.y * iMore.y) * iPosSize.w;
} else {
vec2 c = rot2(iParams.w) * (corner * (iMore.x > 0.5 ? vec2(1.35, 1.35 * iMore.y) : vec2(1.0)));
wp = iMore.x > 0.5
? iPosSize.xyz + vec3(c.x, 0.0, c.y) * iPosSize.w
: iPosSize.xyz + (uCamRight * c.x + uCamUp * c.y * iMore.y) * iPosSize.w;
}
vUv = corner; vParams = iParams; vColor = iColor; vMore = iMore; vPosSize = iPosSize; vWorld = wp;
gl_Position = uViewProj * vec4(wp, 1.0);
vT = length(wp - uCamPos);
gl_Position.z = (clamp(vT / uFar, 0.0, 0.999) * 2.0 - 1.0) * gl_Position.w;
}
`,h0=()=>`
in vec2 vUv;
in float vT;
in vec3 vWorld;
flat in vec4 vParams, vColor, vMore, vPosSize;
layout(location = 0) out vec4 oColor;
uniform sampler2D uGbuf;
uniform vec2 uInvRes;
uniform vec3 uCamPos;
uniform float uTime, uDpr;
#include <common>
const vec3 FX_PAPER = vec3(0.910, 0.886, 0.831);
const vec3 FX_INK = vec3(0.384, 0.235, 0.118);
float gPx = 0.01;
vec2 gPx2 = vec2(0.01);
float pen(float d) { return 1.0 - smoothstep(1.1 * gPx, 2.1 * gPx, abs(d)); }
float body(float d) { return 1.0 - smoothstep(-gPx, gPx, d); }
vec4 mark(vec3 c, float a) { return vec4(c * a, a); }
vec4 over(vec4 top, vec4 under) { return top + under * (1.0 - top.a); }
float hatch(vec2 uv, float seed) {
float s = dot(uv, vec2(-0.883, 0.469)) / (4.2 * gPx);
return smoothstep(0.3, 0.5, 0.5 + 0.5 * sin(s * 6.2832)) * (0.75 + 0.25 * hash12(floor(uv / (2.0 * gPx)) + seed));
}
float wobbly(vec2 uv, float seed) {
float a = atan(uv.y, uv.x);
return length(uv) * (1.0 - 0.035 * sin(a * 3.0 + seed * 20.0) - 0.02 * sin(a * 7.0 + seed * 9.0));
}
${uo.map(a=>a.glsl).join(`
`)}
void main() {
float sceneT = texture(uGbuf, gl_FragCoord.xy * uInvRes).z;
float soft = saturate((sceneT - vT) * 1.6 + 0.7);
vec2 uv = vUv;
if (vMore.x > 0.5 && vMore.x < 1.5) {
vec3 at = uCamPos + normalize(vWorld - uCamPos) * sceneT;
vec2 d = at.xz - vPosSize.xz;
if (abs(at.y - vPosSize.y) > 0.9 + 0.6 * length(d)) discard;
float c = cos(vParams.w), s = sin(vParams.w);
uv = vec2(c * d.x - s * d.y, s * d.x + c * d.y) / (vPosSize.w * vec2(1.0, vMore.y));
if (max(abs(uv.x), abs(uv.y)) > 1.0) discard;
soft = 1.0;
}
if (soft <= 0.0) discard;
gPx2 = min(fwidth(uv) * uDpr, vec2(0.12));
gPx = min(length(gPx2) * 0.7, 0.09);
float steps = max(vMore.z * 12.0, 2.0);
float life = floor(vParams.y * steps) / steps;
vec4 c = vec4(0.0);
switch (int(vParams.x + 0.5)) {
${uo.map(a=>`    case ${a.type}: c = fx_${a.id}(uv, life, vParams.z, vColor); break;`).join(`
`)}
  }
  c *= step(0.5, soft);
  if (c.a < 0.01) discard;
  oColor = c;
}
`;he("mote",`
vec4 fx_mote(vec2 uv, float life, float seed, vec4 col) {
float show = step(0.08, life) * step(life, 0.92);
return mark(col.rgb, body(length(uv) - 0.55) * show * min(col.a, 1.0) * 0.85);
}
`);he("leaf",`
vec4 fx_leaf(vec2 uv, float life, float seed, vec4 col) {
float flip = cos(life * 22.0 + seed * 40.0);
vec2 q = vec2(uv.x, uv.y / max(abs(flip), 0.25));
float d = length(q * vec2(1.0, 1.9)) - 0.8;
float show = step(0.05, life) * step(life, 0.95) * col.a;
return over(mark(FX_INK, pen(d) * 0.7 * show), mark(mix(FX_PAPER, col.rgb, 0.85), body(d) * show));
}
`);he("spark",`
vec4 fx_spark(vec2 uv, float life, float seed, vec4 col) {
vec2 a = abs(uv) / mix(1.0, 0.35, life);
float d = min(a.x * 4.5 + a.y, a.y * 4.5 + a.x) - 0.95;
return over(mark(FX_INK, pen(d) * 0.9), mark(mix(FX_PAPER, col.rgb, 0.55 * hatch(uv, seed)), body(d)));
}
`);he("burst",`
vec4 fx_burst(vec2 uv, float life, float seed, vec4 col) {
float r = length(uv), ang = atan(uv.y, uv.x);
float front = mix(0.4, 0.95, sqrt(life));
float spike = abs(fract(ang * 1.4324 + seed) - 0.5) * 2.0;
float d = r - front * mix(0.5, 1.0, spike);
float rays = step(0.86, fract(ang * 2.2282 + seed * 3.0)) * step(front * 0.95, r) * step(r, front * 1.25 + 0.05);
float show = step(life, 0.8);
vec4 star = over(mark(FX_INK, pen(d)), mark(mix(FX_PAPER, col.rgb, 0.5 * hatch(uv, seed)), body(d)));
return over(mark(FX_INK, rays * 0.9), star) * show;
}
`);he("slash",`
vec4 fx_slash(vec2 uv, float life, float seed, vec4 col) {
float r = length(uv), ang = atan(uv.x, uv.y);
float head = mix(1.9, -1.5, smoothstep(0.0, 0.55, life));
float along = ang - head;
float sweep = step(0.0, along) * step(along, 1.9);
float taper = saturate(1.0 - along / 1.9);
float outer = r - 0.97, inner = (0.97 - 0.3 * taper) - r;
float d = max(outer, inner);
float show = step(life, 0.72) * sweep;
float lines = (pen(r - 0.8) + pen(r - 0.66)) * step(1.0, along) * step(along, 2.6) * step(life, 0.6) * 0.7;
vec4 blade = over(mark(FX_INK, pen(d) * show), mark(mix(FX_PAPER, col.rgb, 0.35 * hatch(uv, seed)), body(d) * show));
return over(blade, mark(FX_INK, lines));
}
`);he("ring",`
vec4 fx_ring(vec2 uv, float life, float seed, vec4 col) {
float front = mix(0.25, 0.92, 1.0 - (1.0 - life) * (1.0 - life));
float a = pen(wobbly(uv, seed) - front) + pen(wobbly(uv, seed + 0.37) - front * 0.94) * 0.6;
return mark(col.rgb * 0.82, saturate(a) * step(life, 0.9) * min(col.a, 1.0));
}
`);he("orb",`
vec4 fx_orb(vec2 uv, float life, float seed, vec4 col) {
float r = length(uv), ang = atan(uv.y, uv.x);
float turn = floor(uTime * 12.0) * 0.7;
float d = wobbly(uv, seed + turn * 0.1) - 0.55;
float swirl = smoothstep(0.25, 0.1, abs(fract(r * 2.6 - ang / 6.2832 + turn * 0.3) - 0.5));
float rays = step(0.8, fract(ang * 1.2732 + turn * 0.21)) * step(0.68, r) * step(r, 0.95);
vec4 ball = over(mark(FX_INK, pen(d)), mark(mix(FX_PAPER, col.rgb, swirl * 0.9), body(d)));
return over(ball, mark(col.rgb * 0.8, rays * 0.9));
}
`);he("puff",`
vec4 fx_puff(vec2 uv, float life, float seed, vec4 col) {
float d = length(uv - vec2(0.0, 0.05)) - 0.5;
d = min(d, length(uv - vec2(0.38, -0.1)) - 0.36);
d = min(d, length(uv - vec2(-0.4, -0.08)) - 0.38);
d += 0.5 * smoothstep(0.3, 1.0, life);
float show = step(life, 0.9) * min(col.a * 1.6, 1.0);
return over(mark(FX_INK, pen(d) * 0.8 * show), mark(mix(FX_PAPER, col.rgb, 0.3), body(d) * show));
}
`);he("heal",`
vec4 fx_heal(vec2 uv, float life, float seed, vec4 col) {
vec2 a = abs(uv);
float d = min(max(a.x - 0.22, a.y - 0.75), max(a.y - 0.22, a.x - 0.75));
float show = step(0.08, life) * step(life, 0.85);
return over(mark(FX_INK, pen(d) * show), mark(mix(FX_PAPER, col.rgb, 0.4 + 0.6 * hatch(uv, seed)), body(d) * show));
}
`);he("mark",`
vec4 fx_mark(vec2 uv, float life, float seed, vec4 col) {
float ang = atan(uv.y, uv.x) + floor(uTime * 6.0) * 0.26;
float dash = step(0.3, abs(fract(ang / 6.2832 * 5.0) - 0.5) * 2.0);
float a = pen(wobbly(uv, seed) - 0.84) * dash + pen(wobbly(uv, seed + 0.5) - 0.7) * 0.35;
return mark(col.rgb * 0.85, saturate(a) * min(col.a, 1.0));
}
`);he("click",`
vec4 fx_click(vec2 uv, float life, float seed, vec4 col) {
float front = mix(0.9, 0.3, life);
vec2 a = abs(uv);
float m = pen(wobbly(uv, seed) - front) + pen(min(a.x, a.y)) * step(max(a.x, a.y), 0.16);
return mark(FX_INK, saturate(m) * step(life, 0.85));
}
`);he("beam",`
vec4 fx_beam(vec2 uv, float life, float seed, vec4 col) {
float wide = 0.42 * sin(saturate(life) * 3.1416);
float d = abs(uv.x + 0.03 * sin(uv.y * 5.0 + seed * 9.0)) - wide;
float within = step(-0.95, uv.y) * step(uv.y, 0.98);
float rise = floor(uTime * 12.0) / 12.0;
vec2 tk = vec2(uv.x * 3.0, uv.y * 2.2 - rise * 3.0);
vec2 tc = floor(tk);
float tick = step(0.6, hash12(tc + seed)) * pen((fract(tk.x) - 0.5) / 3.0) * step(abs(fract(tk.y) - 0.5), 0.3) * body(d);
vec4 shaft = over(mark(FX_INK, pen(d) * 0.8 * within), mark(FX_PAPER, body(d) * within * 0.92));
return over(mark(col.rgb * 0.85, tick * within), shaft);
}
`);he("zone",`
vec4 fx_zone(vec2 uv, float life, float seed, vec4 col) {
float r = wobbly(uv, seed);
float rim = pen(r - 0.93) + pen(wobbly(uv, seed + 0.37) - 0.88) * 0.5;
float fill = body(r - 0.9 * mix(0.12, 1.0, life)) * hatch(uv, seed) * 0.5;
return mark(col.rgb * 0.82, saturate(max(rim, fill)) * min(col.a, 1.0));
}
`);he("lane",`
vec4 fx_lane(vec2 uv, float life, float seed, vec4 col) {
vec2 a = abs(uv);
float sides = (1.0 - smoothstep(1.1 * gPx2.x, 2.1 * gPx2.x, abs(a.x - 0.9))) * step(a.y, 0.98)
+ (1.0 - smoothstep(1.1 * gPx2.y, 2.1 * gPx2.y, abs(a.y - 0.98))) * step(a.x, 0.9) * 0.6;
float along = uv.y * 4.0 - 0.5;
float v = fract(along) - 0.5;
float arrows = pen(abs(uv.x) * 0.55 + v * 0.5 - 0.1) * step(a.x, 0.62) * 0.7;
float fill = step(uv.y, mix(-1.0, 1.0, life)) * step(a.x, 0.9) * hatch(uv * vec2(1.0, 4.0), seed) * 0.42;
return mark(col.rgb * 0.82, saturate(max(max(sides, arrows), fill)) * min(col.a, 1.0));
}
`);he("cloud",`
vec4 fx_cloud(vec2 uv, float life, float seed, vec4 col) {
float ang = atan(uv.y, uv.x), r = length(uv);
float turn = floor(uTime * 6.0) * 0.21;
float edge = 0.86 + 0.07 * abs(sin(ang * 5.5 + seed * 9.0 + turn));
float fade = smoothstep(0.0, 0.08, life) * (1.0 - smoothstep(0.82, 1.0, life));
float rim = pen(r - edge);
float fill = body(r - edge) * hatch(uv, seed + turn) * 0.34;
vec2 g = uv * 5.0 + vec2(turn, -turn * 0.7);
float specks = body(length(fract(g) - 0.5 - (hash22(floor(g) + seed) - 0.5) * 0.5) - 0.11) * body(r - edge) * step(0.55, hash12(floor(g) + seed * 3.0));
return mark(col.rgb * 0.8, saturate(max(max(rim * 0.8, fill), specks * 0.8)) * fade * min(col.a, 1.0));
}
`);he("streak",`
vec4 fx_streak(vec2 uv, float life, float seed, vec4 col) {
float along = smoothstep(-1.0, 0.2, uv.y) * (1.0 - smoothstep(0.7, 1.0, uv.y));
float lines = pen(uv.x * 1.6) + pen(uv.x * 1.6 - 0.32 - 0.1 * seed) * 0.5 * step(0.0, -uv.y);
return mark(mix(FX_INK, col.rgb, 0.4), saturate(lines) * along * (1.0 - life) * min(col.a, 1.0));
}
`);he("ripple",`
vec4 fx_ripple(vec2 uv, float life, float seed, vec4 col) {
float front = mix(0.2, 0.9, life);
return mark(vec3(0.227, 0.502, 0.659), pen(wobbly(uv, seed) - front) * step(life, 0.85) * min(col.a, 1.0));
}
`);he("laser",`
vec4 fx_laser(vec2 uv, float life, float seed, vec4 col) {
float w = mix(1.0, 0.18, smoothstep(0.3, 1.0, life));
float ends = smoothstep(1.0, 0.82, abs(uv.y));
float x = abs(uv.x + 0.05 * sin(uv.y * 31.0 - uTime * 40.0 + seed * 17.0) * w);
float bands = 0.5 + 0.5 * sin(uv.y * 18.0 - uTime * 30.0 + seed * 5.0);
float rim = 0.95 * w * ends, mid = 0.55 * w * ends, core = 0.22 * w * ends;
vec4 c = mark(col.rgb * 0.75, body(x - rim) * hatch(uv * vec2(1.0, 5.0), seed) * 0.6);
c = over(mark(mix(col.rgb, vec3(1.0), 0.15 + 0.3 * bands), body(x - mid)), c);
c = over(mark(vec3(1.0), body(x - core)), c);
c = over(mark(FX_INK, pen(x - mid) * 0.7), c);
return c * min(col.a, 1.0);
}
`);he("arc",`
vec4 fx_arc(vec2 uv, float life, float seed, vec4 col) {
float flick = floor(uTime * 20.0 + seed * 7.0);
float k = (uv.y + 1.0) * 5.0;
float i = floor(k), f = fract(k);
float a = hash12(vec2(i, flick + seed * 13.0)) - 0.5, b = hash12(vec2(i + 1.0, flick + seed * 13.0)) - 0.5;
float x = abs(uv.x - mix(a, b, f) * 1.1 * smoothstep(1.0, 0.7, abs(uv.y)));
float fade = 1.0 - smoothstep(0.55, 1.0, life);
vec4 c = mark(col.rgb * 0.75, body(x - 0.42) * hatch(uv * vec2(1.0, 4.0), seed) * 0.5);
c = over(mark(mix(col.rgb, vec3(1.0), 0.55), body(x - 0.15)), c);
c = over(mark(FX_INK, pen(x - 0.15) * 0.8), c);
return c * fade * step(abs(uv.y), 0.99) * min(col.a, 1.0);
}
`);he("sigil",`
float sgTri(vec2 p, float r) {
float d = -1e3;
for (int i = 0; i < 3; i++) {
float a = float(i) * 2.0944 + 1.5708;
d = max(d, dot(p, vec2(cos(a), sin(a))));
}
return d - r;
}
vec4 fx_sigil(vec2 uv, float life, float seed, vec4 col) {
float r = length(uv), ang = atan(uv.y, uv.x);
float spin = uTime * 0.9 + seed * 6.2832;
float grow = smoothstep(0.0, 0.16, life), fade = 1.0 - smoothstep(0.84, 1.0, life);
float s = mix(0.55, 1.0, grow);
float rings = pen(r - 0.95 * s) + pen(r - 0.87 * s) * 0.8 + pen(r - 0.3 * s) * 0.7;
float ticks = step(0.55, fract((ang + spin) / 6.2832 * 36.0)) * step(0.87 * s, r) * step(r, 0.95 * s) * 0.85;
float dashes = pen(r - 0.62 * s) * step(0.4, fract((ang - spin * 1.7) / 6.2832 * 10.0));
float hexa = max(pen(sgTri(rot2(spin * 0.6) * uv, 0.3 * s)), pen(sgTri(rot2(spin * 0.6 + 1.0472) * uv, 0.3 * s))) * step(r, 0.62 * s);
float fill = body(r - 0.95 * s) * hatch(uv, seed) * 0.22;
return mark(mix(col.rgb, vec3(1.0), 0.15), saturate(rings + ticks + dashes + hexa + fill) * grow * fade * min(col.a, 1.0));
}
`);he("vortex",`
vec4 fx_vortex(vec2 uv, float life, float seed, vec4 col) {
float r = length(uv), ang = atan(uv.y, uv.x);
float grow = smoothstep(0.0, 0.14, life), fade = 1.0 - smoothstep(0.86, 1.0, life);
float sw = ang * 3.0 + 7.0 / (r + 0.25) + uTime * 9.0 + seed * 6.0;
float arms = smoothstep(0.35, 0.8, 0.5 + 0.5 * sin(sw)) * smoothstep(1.0, 0.6, r) * smoothstep(0.08, 0.3, r);
float lines = pen((fract(sw / 6.2832) - 0.5) * 0.25 * r) * smoothstep(1.0, 0.5, r) * step(0.15, r);
float rim = pen(wobbly(uv, seed) - 0.95 * grow);
vec4 c = mark(col.rgb * 0.85, saturate(arms * (0.35 + 0.65 * hatch(uv * 1.5, seed)) + rim));
c = over(mark(FX_INK, saturate(lines * 0.8)), c);
c = over(mark(vec3(0.06, 0.04, 0.1), body(r - 0.2 * grow)), c);
return c * grow * fade * min(col.a, 1.0);
}
`);he("hex",`
vec4 fx_hex(vec2 uv, float life, float seed, vec4 col) {
float r = length(uv);
float grow = smoothstep(0.0, 0.1, life), fade = 1.0 - smoothstep(0.88, 1.0, life);
vec2 g = uv * 4.5 + vec2(0.0, uTime * 0.6);
vec2 hs = vec2(1.0, 1.7320508);
vec2 a = mod(g, hs) - hs * 0.5, b = mod(g - hs * 0.5, hs) - hs * 0.5;
vec2 h = abs(dot(a, a) < dot(b, b) ? a : b);
float edge = 0.5 - max(dot(h, vec2(0.5, 0.8660254)), h.x);
float inside = body(r - 0.95);
float fres = smoothstep(0.4, 0.95, r) * inside;
float cells = (1.0 - smoothstep(0.0, 0.07, edge)) * inside;
vec4 c = mark(mix(col.rgb, vec3(1.0), 0.25), saturate(cells * (0.3 + 0.7 * fres) + fres * 0.35 * hatch(uv, seed)));
c = over(mark(FX_INK, pen(r - 0.95) * 0.8), c);
return c * grow * fade * min(col.a, 1.0);
}
`);he("bit",`
vec4 fx_bit(vec2 uv, float life, float seed, vec4 col) {
vec2 a = abs(uv);
float d = max(a.x, a.y) - 0.62;
float show = step(life, 0.92) * step(0.22, hash12(vec2(seed * 91.0, floor(uTime * 14.0))));
vec4 c = mark(mix(col.rgb, vec3(1.0), 0.35 * step(max(a.x, a.y), 0.28)), body(d));
c = over(mark(FX_INK, pen(d) * 0.8), c);
return c * show * min(col.a, 1.0);
}
`);he("shock",`
vec4 fx_shock(vec2 uv, float life, float seed, vec4 col) {
float r = wobbly(uv, seed);
float front = mix(0.15, 0.95, 1.0 - pow(1.0 - life, 3.0));
float d = abs(r - front) - (0.12 * (1.0 - life) + 0.02);
float ang = atan(uv.y, uv.x);
float streaks = step(0.7, fract(ang / 6.2832 * 28.0 + seed)) * step(r, front) * step(front * 0.55, r) * (1.0 - life) * 0.8;
vec4 c = mark(mix(col.rgb, vec3(1.0), 0.3), body(d) * (0.4 + 0.5 * hatch(uv, seed)));
c = over(mark(FX_INK, pen(d) * 0.85), c);
c = over(mark(col.rgb * 0.8, streaks), c);
return c * step(life, 0.95) * min(col.a, 1.0);
}
`);class u0{constructor(e){this.gl=e,this.compiled=null,this.vao=e.createVertexArray(),this.vbo=e.createBuffer(),this.capacity=0,e.bindVertexArray(this.vao),e.bindBuffer(e.ARRAY_BUFFER,this.vbo);for(let t=0;t<4;t++)e.enableVertexAttribArray(t),e.vertexAttribPointer(t,4,e.FLOAT,!1,os*4,t*16),e.vertexAttribDivisor(t,1);e.bindVertexArray(null)}program(){return this.compiled||(this.compiled=new fs(this.gl,"fx",d0,h0()))}render(e,t,s,o,n){if(!o)return;const r=this.gl,i=this.program().use();e.bind(1),r.enable(r.DEPTH_TEST),r.depthFunc(r.LEQUAL),r.depthMask(!1),r.enable(r.BLEND),r.blendFunc(r.ONE,r.ONE_MINUS_SRC_ALPHA);const l=t.camera;i.set("uViewProj",l.viewProj).set("uCamPos",l.pos).set("uCamRight",l.right).set("uCamUp",l.up),i.set("uFar",t.far).set("uTime",t.time).set("uInvRes",[1/e.width,1/e.height]).set("uDpr",t.dpr),i.tex("uGbuf",n),r.bindVertexArray(this.vao),r.bindBuffer(r.ARRAY_BUFFER,this.vbo);const c=o*os*4;c>this.capacity&&(this.capacity=c*2,r.bufferData(r.ARRAY_BUFFER,this.capacity,r.DYNAMIC_DRAW)),r.bufferSubData(r.ARRAY_BUFFER,0,s,0,o*os),r.drawArraysInstanced(r.TRIANGLE_STRIP,0,4,o),r.bindVertexArray(null),r.depthMask(!0),r.disable(r.DEPTH_TEST),r.disable(r.BLEND)}}const f0=`
in vec2 vUv;
out vec4 oEdge;
uniform sampler2D uGbuf;
uniform vec2 uTexel;
#include <common>
#include <frame>
float family(float id) { return id < 0.08 ? step(0.0, id) * 0.02 : id; }
void main() {
vec4 gc = texture(uGbuf, vUv);
vec4 n[4];
n[0] = texture(uGbuf, vUv - vec2(uTexel.x, 0.0)); n[1] = texture(uGbuf, vUv + vec2(uTexel.x, 0.0));
n[2] = texture(uGbuf, vUv - vec2(0.0, uTexel.y)); n[3] = texture(uGbuf, vUv + vec2(0.0, uTexel.y));
float fc = family(gc.w);
vec3 n0 = octDecode(gc.xy);
float mean = 0.0, sil = 0.0, fold = 0.0, far = 0.0;
for (int i = 0; i < 4; i++) {
mean += n[i].z * 0.25;
far = max(far, n[i].z);
float fn = family(n[i].w);
bool differ = abs(fn - fc) > 0.004;
bool behind = n[i].z < gc.z * 0.985;
bool level = abs(n[i].z - gc.z) <= gc.z * 0.015;
if (differ && (behind || (level && fn > fc))) sil = 1.0;
fold = max(fold, 1.0 - dot(n0, octDecode(n[i].xy)));
}
float crease = smoothstep(0.02, 0.06, abs(mean - gc.z) * 4.0 / max(gc.z, 1.0)) * step(mean, gc.z);
fold = smoothstep(0.35, 0.8, fold) * step(0.08, gc.w);
float line = max(max(crease, sil), fold * 0.85);
if (gc.z > 5000.0 && far > 5000.0) line = 0.0;
vec2 ndc = vUv * 2.0 - 1.0;
vec3 rd = normalize(uCamFwd + uCamRight * (ndc.x * uTanFov.x) + uCamUp * (ndc.y * uTanFov.y));
float t = min(gc.z, far);
vec3 p = uCamPos + rd * t;
float fade = (1.0 - 0.55 * smoothstep(30.0, 100.0, t)) * (1.0 - smoothstep(VIEW_DIST * 0.7, VIEW_DIST * 0.95, length(p.xz - uFocus.xz)));
oEdge = vec4(line, fract(gc.w * 37.0), fade, 1.0);
}
`,p0=`
in vec2 vUv;
out vec4 oColor;
uniform sampler2D uLay, uGbuf, uMark, uSheet, uEdge, uEnt, uEntAux;
uniform vec2 uRes;
uniform vec2 uInner;
uniform float uHurt, uFade;
#include <common>
#include <frame>
#include <pencil>
#include <minimap>
vec2 sheetAt(vec2 uv) {
vec2 st = uv * uInner - 0.5;
ivec2 i = ivec2(floor(st)), hi = ivec2(uInner) - 1;
vec2 f = fract(st);
vec2 a = texelFetch(uSheet, clamp(i, ivec2(0), hi), 0).rg, b = texelFetch(uSheet, clamp(i + ivec2(1, 0), ivec2(0), hi), 0).rg;
vec2 c = texelFetch(uSheet, clamp(i + ivec2(0, 1), ivec2(0), hi), 0).rg, d = texelFetch(uSheet, clamp(i + ivec2(1, 1), ivec2(0), hi), 0).rg;
vec2 near = f.x < 0.5 ? (f.y < 0.5 ? a : c) : (f.y < 0.5 ? b : d);
float tol = near.x * 0.04;
a = abs(a.x - near.x) > tol ? near : a; b = abs(b.x - near.x) > tol ? near : b;
c = abs(c.x - near.x) > tol ? near : c; d = abs(d.x - near.x) > tol ? near : d;
return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}
float grassTufts(vec2 uv, float amount, float pen) {
if (amount < 0.05) return 0.0;
vec2 g = uv / 0.85;
vec2 cell = floor(g);
vec2 r = hash22(cell);
if (r.x > amount * 0.24) return 0.0;
vec2 q = (g - cell - vec2(0.2 + 0.6 * r.y, 0.12 + 0.3 * fract(r.x * 7.7))) * 0.85;
float m = 0.0;
for (int k = -1; k <= 1; k++) {
float lean = float(k) * 0.55 + (r.y - 0.5) * 0.5;
float h = 0.15 + 0.13 * fract(r.x * 13.0 + float(k) * 0.37);
vec2 b = vec2(lean * h, h);
float tt = clamp(dot(q, b) / dot(b, b), 0.0, 1.0);
m = max(m, (1.0 - smoothstep(pen * 0.5, pen, length(q - b * tt))) * mix(1.0, 0.5, tt));
}
return m;
}
float waveLines(vec2 uv, float amount, float pen) {
if (amount < 0.05) return 0.0;
vec2 g = vec2((uv.x + uTime * 0.12) / 1.7, uv.y / 0.55);
vec2 cell = floor(g);
vec2 r = hash22(cell);
if (r.x > 0.34 * amount) return 0.0;
vec2 q = (g - cell - 0.5) * vec2(1.7, 0.55);
float y = 0.03 * sin(q.x * 13.0 + r.y * 6.0);
return (1.0 - smoothstep(pen * 0.5, pen, abs(q.y - y))) * step(abs(q.x), 0.28 + 0.3 * r.y);
}
vec3 drawLays(vec3 page, vec3 rd, float sheet, vec3 right, vec3 up, vec3 fwd, bool sky, float dpr) {
vec2 uv;
if (sky) {
uv = vec2(atan(rd.x, rd.z), asin(clamp(rd.y, -1.0, 1.0))) * 8.0;
sheet = 8.0;
} else {
uv = paperCoords(uCamPos + rd * (sheet / max(dot(rd, fwd), 0.2)), right, up);
}
vec2 lod = pencilLod(sheet);
float pen = uPencil.x * sheet * 1.5 * dpr;
float kind0 = texture(uMark, vUv).a;
float row = floor((dot(uv, vec2(-sin(SLANT), cos(SLANT)))) / (PITCH0 * exp2(lod.x)) + 0.5);
float ends = (hash11(row * exp2(lod.x) * 0.913 + 4.2) - 0.42) * mix(2.6, 6.5, saturate(kind0)) * dpr;
vec2 at = vUv + vec2(cos(SLANT), sin(SLANT)) * ends / uRes;
vec4 lay = texture(uLay, at);
vec4 mark = texture(uMark, at);
float soft = step(0.5, mark.a);
vec3 col = page;
float base = pencilLay(uv, lod, lay.a * uFade, soft, SLANT, 0.0);
col = layOn(col, lay.rgb, base);
float chroma = max(lay.r, max(lay.g, lay.b)) - min(lay.r, min(lay.g, lay.b));
float shadeCover = mark.r * mix(0.56, 0.82, smoothstep(0.12, 0.4, chroma)) * uFade;
float shade = mix(pencilLay(uv, lod, shadeCover, 0.0, SLANT - 0.105, 5.0), pencilLay(uv, lod, shadeCover, 1.0, SLANT - 0.105, 5.0), 0.5);
col = shadeOn(col, shadowPencil(lay.rgb), shade);
vec3 inkLeaf = mix(INK_LEAF, INK_DARK, uNight * 0.6);
col = inkOn(col, inkLeaf, grassTufts(uv, mark.b, pen) * 0.66 * uFade);
col = inkOn(col, mix(INK_WET, INK_DARK, uNight * 0.5), waveLines(uv, saturate(mark.a - 1.0), pen) * 0.7 * uFade);
return col;
}
void main() {
vec2 px = vUv * uRes;
float dpr = uPencil.w;
vec3 page = paperSheet(px);
vec2 ndc = vUv * 2.0 - 1.0;
vec3 rd = normalize(uCamFwd + uCamRight * (ndc.x * uTanFov.x) + uCamUp * (ndc.y * uTanFov.y));
vec2 sheet = sheetAt(vUv);
bool sky = texture(uGbuf, vUv).z > 5000.0;
vec3 col = drawLays(page, rd, sheet.x, uPaperRight, uPaperUp, uPaperFwd, sky, dpr);
if (uPaperMix > 0.004) col = mix(col, drawLays(page, rd, sheet.y, uPaperRightB, uPaperUpB, uPaperFwdB, sky, dpr), uPaperMix);
vec2 wob = (vec2(vnoise(px * 0.045 / dpr), vnoise(px * 0.045 / dpr + 9.0)) - 0.5) * 2.4 * dpr / uRes;
vec2 h = 0.5 / uInner;
vec4 ed = 0.25 * (texture(uEdge, vUv + wob + vec2(h.x, h.y)) + texture(uEdge, vUv + wob + vec2(-h.x, h.y)) +
texture(uEdge, vUv + wob + vec2(h.x, -h.y)) + texture(uEdge, vUv + wob + vec2(-h.x, -h.y)));
float line = smoothstep(0.3, 0.5, ed.r);
vec2 off = vec2(1.9, -1.4) * dpr / uRes;
float again = smoothstep(0.3, 0.5, texture(uEdge, vUv + wob * 1.7 + off).r) * step(0.74, vnoise(px * 0.011 / dpr + 3.0)) * 0.4;
float pressure = mix(0.55, 0.95, vnoise(px * 0.028 / dpr + ed.g * 40.0));
float marks = smoothstep(0.28, 0.5, texture(uMark, vUv + wob).g);
vec3 ink = mix(INK_SEPIA, INK_DARK, uNight * 0.7);
col = inkOn(col, ink, marks * 0.6 * pressure * uFade);
col = inkOn(col, ink, max(line, again) * pressure * ed.b * uFade);
vec4 e = texture(uEnt, vUv);
if (e.a > 0.003) {
vec4 aux = texture(uEntAux, vUv);
vec2 gt = 1.0 / uInner;
float sd = texture(uGbuf, vUv).z;
sd = max(sd, max(texture(uGbuf, vUv + vec2(gt.x, 0.0)).z, texture(uGbuf, vUv - vec2(gt.x, 0.0)).z));
sd = max(sd, max(texture(uGbuf, vUv + vec2(0.0, gt.y)).z, texture(uGbuf, vUv - vec2(0.0, gt.y)).z));
float hidden = step(sd + 0.05 + 0.006 * sd, aux.r);
vec3 shown = mix(col * (1.0 - e.a) + e.rgb, mix(col, page, e.a), 1.0 - uFade);
vec3 ghost = inkOn(col, INK_SOFT, aux.b * aux.g * 0.8);
col = mix(shown, ghost, hidden);
}
vec2 q = vUv - 0.5;
float hurt = uHurt * smoothstep(0.56, 0.86, length(q));
if (hurt > 0.01) col = layOn(col, P_VERMILION, pencilLay(px / uRes.y * 6.0, vec2(1.0, 0.3), hurt * 0.4, 0.0, SLANT, 9.0));
col = drawMinimap(col, px, page);
oColor = vec4(col, 1.0);
}
`;class m0{constructor(e){this.gl=e,this.ink=new fs(e,"ink",vn,f0),this.final=new fs(e,"final",vn,p0)}runInk(e,t){const s=this.gl,o=this.ink.use();e.edge.bind(),t(o),o.tex("uGbuf",e.scene.textures[1]),o.set("uTexel",[1/e.scene.width,1/e.scene.height]),gn(s)}runFinal(e,t,s,o,n,r){const i=this.gl,l=this.final.use();t0(i,s,o),r(l),l.tex("uLay",e.scene.textures[0]).tex("uGbuf",e.scene.textures[1]).tex("uMark",e.scene.textures[2]).tex("uSheet",e.scene.textures[3]).tex("uEdge",e.edge.textures[0]).tex("uEnt",e.ent.textures[0]).tex("uEntAux",e.ent.textures[1]),l.set("uRes",[s,o]).set("uInner",[e.scene.width,e.scene.height]).set("uHurt",t.look.hurt).set("uFade",t.look.fade),n.bind(l,t,o),gn(i)}}Nt("minimap",`
uniform sampler2D uHeightTex, uColorTex, uPropTexA;
uniform vec4 uMapRect;
uniform vec3 uMapPlayer;
uniform vec4 uBlips[MAX_BLIPS];
uniform int uBlipCount;
vec3 blipColor(float kind) {
if (kind < 0.5) return P_MUSTARD;
if (kind < 1.5) return P_SLATE;
if (kind < 2.5) return P_TEAL;
if (kind < 3.5) return PAPER;
if (kind < 4.5) return P_VERMILION;
return P_SUN;
}
vec3 drawMinimap(vec3 col, vec2 px, vec3 page) {
if (uMapRect.z < 1.0) return col;
vec2 d = px - uMapRect.xy;
float r = length(d);
if (r > uMapRect.z + 1.0) return col;
float dpr = uPencil.w;
vec2 mapR = normalize(uCamRight.xz), mapF = normalize(uCamFwd.xz + 1e-5);
vec2 off = (mapR * d.x + mapF * d.y) * uMapRect.w;
vec2 w = uMapPlayer.xy + off;
vec2 uv = (w + 0.5) / WORLD_TEX;
float h = textureLod(uHeightTex, uv, 0.0).r;
vec4 ct = textureLod(uColorTex, uv, 0.0);
float stroke = dot(px, vec2(-0.883, 0.469)) / (3.6 * dpr);
float hatch = mix(0.72, 1.0, smoothstep(0.25, 0.6, 0.5 + 0.5 * sin(stroke * 6.2832))) * (0.75 + 0.25 * hash12(floor(px / (1.5 * dpr))));
vec3 m = page;
if (h < SEA) m = mix(m, mix(P_SKY, P_SLATE, saturate(-h / 4.0)), 0.75 * hatch + 0.12);
else m = mix(m, ct.rgb, (0.6 * hatch + 0.08) * (1.0 - ct.a * 0.9));
ivec2 cell = ivec2(floor(w / CELL));
vec4 pa = texelFetch(uPropTexA, cell & (CELLS - 1), 0);
if (pa.w > 0.5) {
vec2 c = (vec2(cell) + 0.5) * CELL + pa.xy;
m = mix(m, INK_SEPIA, smoothstep(1.7, 1.2, length(w - c)) * 0.55);
}
for (int i = 0; i < MAX_BLIPS; i++) {
if (i >= uBlipCount) break;
float bd = length((uBlips[i].xy - w) / uMapRect.w);
float s = uBlips[i].w;
m = mix(m, INK_DARK, smoothstep(s + 2.0 * dpr, s + 1.0 * dpr, bd));
m = mix(m, blipColor(uBlips[i].z), smoothstep(s + 0.6 * dpr, s - 0.2 * dpr, bd));
}
vec2 north = vec2(dot(vec2(0.0, -1.0), mapR), dot(vec2(0.0, -1.0), mapF)) * (uMapRect.z - 9.0 * dpr);
float nd = length(d - north);
m = mix(m, PAPER, smoothstep(8.5 * dpr, 7.5 * dpr, nd));
m = mix(m, INK_SEPIA, smoothstep(8.5 * dpr, 7.5 * dpr, nd) * smoothstep(6.0 * dpr, 7.0 * dpr, nd));
vec2 nq = (d - north) / (3.4 * dpr);
float nGlyph = (abs(nq.y) < 1.0 && abs(nq.x) < 1.0) ? min(abs(abs(nq.x) - 0.8), abs(nq.x + nq.y * 0.8)) : 1.0;
m = mix(m, INK_SEPIA, smoothstep(0.34, 0.2, nGlyph));
vec2 face = vec2(-sin(uMapPlayer.z), cos(uMapPlayer.z));
vec2 a = vec2(dot(off, vec2(face.y, -face.x)), dot(off, face)) / (uMapRect.w * uMapRect.z * 0.085);
float arrow = max(abs(a.x) * 1.5 + a.y * 0.8 - 0.75, -a.y - 0.75 + abs(a.x) * 0.9);
m = mix(m, INK_DARK, smoothstep(0.42, 0.18, arrow));
m = mix(m, P_VERMILION, smoothstep(0.08, -0.1, arrow));
return mix(col, m, smoothstep(uMapRect.z, uMapRect.z - 1.5, r));
}
`);class g0{constructor(e){this.worldTex=e,this.blips=new Float32Array(xe.MAX_BLIPS*4),this.scaled=new Float32Array(xe.MAX_BLIPS*4),this.count=0,this.rect=[0,0,0,.6],this.player=[0,0,0]}clear(){this.count=0}add(e,t,s,o=2.4){this.count>=xe.MAX_BLIPS||this.blips.set([e,t,s,o],this.count++*4)}bind(e,t,s){const o=t.dpr,[n,r,i,l]=this.rect;e.tex("uHeightTex",this.worldTex.height).tex("uColorTex",this.worldTex.color).tex("uPropTexA",this.worldTex.propsA),e.set("uMapRect",[n*o,s-r*o,i*o,l/o]).set("uMapPlayer",this.player);const c=this.scaled;c.set(this.blips);for(let d=0;d<this.count;d++)c[d*4+3]*=o;e.set("uBlips",c).set("uBlipCount",this.count)}}const fl=`
vec3 hHip, hChest, hHead, hHandL, hHandR, hFootL, hFootR, hBlade;
float hDraw;
bool gCannon = false;
float gearBit(float b) { return mod(floor(eSpare / b + 0.01), 2.0); }
float faceOf() { return floor(eSpare / 8.0 + 0.01); }
bool robed() { return eExtra > 1.5 && eExtra < 2.5; }
float hemY() { return robed() ? hHip.y - 0.3 : hHip.y - 0.11; }
vec3 kneeOf(float side) { return hHip + vec3(0.09 * side, -0.04, 0.0); }
float sdFrustum(vec3 p, float h, float r1, float r2) {
vec2 q = vec2(length(p.xz), p.y);
vec2 k1 = vec2(r2, h), k2 = vec2(r2 - r1, 2.0 * h);
vec2 ca = vec2(q.x - min(q.x, q.y < 0.0 ? r1 : r2), abs(q.y) - h);
vec2 cb = q - k1 + k2 * clamp(dot(k1 - q, k2) / dot(k2, k2), 0.0, 1.0);
float s = cb.x < 0.0 && ca.y < 0.0 ? -1.0 : 1.0;
return s * sqrt(min(dot(ca, ca), dot(cb, cb)));
}
float sdBoot(vec3 p, vec3 foot, vec3 knee, float tall) {
vec3 up = normalize(knee - foot);
float shaft = sdTaper(p, foot + vec3(0.0, -0.02, 0.0), foot + up * tall, 0.066, 0.07);
float toe = max(sdEllipsoid(p - foot - vec3(0.0, -0.018, 0.055), vec3(0.074, 0.052, 0.118)), foot.y - 0.068 - p.y);
float cuff = sdTaper(p, foot + up * (tall - 0.012), foot + up * (tall + 0.03), 0.08, 0.084);
return min(smin(shaft, toe, 0.05), cuff);
}
void basePose() {
float w = ePose.x, act = ePose.y, at = ePose.z, mv = ePose.w;
float s = sin(w), c = cos(w);
hDraw = 0.0;
float idle = sin(uTime * 2.0 + eLook.x * 6.28);
float run = smoothstep(0.8, 1.0, mv);
float apart = s * s;
float bob = mix(abs(c) * 0.05, apart * 0.15 - 0.04, run) * mv + 0.01 * idle * (1.0 - mv);
float lean = mv * mix(0.05, 0.14, run);
hHip = vec3(0.0, 0.47 + bob, 0.0);
hChest = hHip + vec3(0.0, 0.27 - 0.015 * run, lean);
hHead = hChest + vec3(0.0, 0.43 - 0.01 * run, lean * 0.6 - 0.02 * run * apart);
float reach = 0.4 * mv;
float lift = mix(0.1, 0.25, run) * min(1.0, mv * 1.5);
float air = run * mv * apart * 0.11;
float early = 0.6 * run;
hFootL = vec3(-0.12, 0.07 + max(cos(w - early), 0.0) * lift + air, s * reach - 0.05 * run);
hFootR = vec3(0.12, 0.07 + max(-cos(w - early), 0.0) * lift + air, -s * reach - 0.05 * run);
float pump = mix(0.2, 0.32, run) * mv;
float rise = 0.09 * run * mv;
hHandL = hChest + vec3(-0.3 + 0.04 * run, -0.24 + 0.01 * idle + rise * max(-s, 0.0), -s * pump + 0.02);
hHandR = hChest + vec3(0.3 - 0.03 * run, -0.24 + 0.01 * idle + rise * max(s, 0.0), s * pump * 0.7 + 0.02);
hBlade = normalize(vec3(0.25, 0.85 - 0.2 * run, 0.45 - 0.5 * run));
if (act > 0.5 && act < 1.5) {
float wind = smoothstep(0.0, 0.22, at), cut = smoothstep(0.22, 0.5, at), rec = smoothstep(0.62, 1.0, at);
float ang = mix(mix(0.4, 2.2, wind), -1.1, cut);
float lift = wind * (1.0 - cut);
vec3 strike = hChest + vec3(sin(ang) * 0.46, 0.12 + 0.28 * lift, cos(ang) * 0.46);
hBlade = normalize(mix(normalize(vec3(sin(ang), 0.25 + 0.6 * lift, cos(ang))), hBlade, rec));
hHandR = mix(strike, hHandR, rec);
hChest.x += 0.04 * (cut - rec);
hHead.z += 0.04 * cut * (1.0 - rec);
} else if (act > 1.5 && act < 2.5) {
float gather = smoothstep(0.0, 0.38, at) * (1.0 - smoothstep(0.42, 0.52, at));
float push = smoothstep(0.38, 0.5, at) * (1.0 - smoothstep(0.72, 1.0, at));
vec3 gL = hChest + vec3(-0.2, 0.16, 0.1), gR = hChest + vec3(0.2, 0.2, 0.08);
vec3 pL = hChest + vec3(-0.14, 0.1, 0.44), pR = hChest + vec3(0.14, 0.13, 0.44);
hHandL = mix(mix(hHandL, gL, gather), pL, push);
hHandR = mix(mix(hHandR, gR, gather), pR, push);
hChest.z += 0.05 * push - 0.03 * gather;
hHead.z += 0.04 * push - 0.02 * gather;
hBlade = normalize(mix(hBlade, vec3(0.0, 0.5, 0.86), max(gather, push)));
} else if (act > 2.5 && act < 3.5) {
float k = 1.0 - at;
hChest.z -= 0.08 * k; hHead.z -= 0.14 * k;
hHandL.y += 0.1 * k; hHandR.y += 0.1 * k;
} else if (act > 3.5 && act < 4.5) {
hHip = vec3(0.0, 0.4, 0.0);
hChest = hHip + vec3(0.0, 0.24, 0.17);
hHead = hChest + vec3(0.0, 0.4, 0.13);
hFootL = vec3(-0.11, 0.09, 0.46);
hFootR = vec3(0.11, 0.24, -0.5);
hHandL = hChest + vec3(-0.27, -0.08, -0.34);
hHandR = hChest + vec3(0.3, -0.14, -0.3);
hBlade = normalize(vec3(0.2, 0.22, -0.95));
} else if (act > 4.5 && act < 5.5 && gCannon) {
float raise = smoothstep(0.0, 0.14, at) * (1.0 - smoothstep(0.72, 1.0, at));
float kick = smoothstep(0.3, 0.36, at) * (1.0 - smoothstep(0.36, 0.6, at));
hHandR = mix(hHandR, hChest + vec3(0.14, 0.12 + 0.03 * kick, 0.42 - 0.07 * kick), raise);
hHandL = mix(hHandL, hChest + vec3(-0.02, 0.02, 0.3), raise * 0.85);
hChest.z -= 0.025 * kick;
hHead.z -= 0.02 * kick;
hDraw = raise;
} else if (act > 4.5 && act < 5.5) {
float raise = smoothstep(0.0, 0.18, at), rec = smoothstep(0.7, 1.0, at);
float pull = smoothstep(0.1, 0.5, at) * (1.0 - smoothstep(0.52, 0.58, at));
float loose = smoothstep(0.52, 0.6, at) * (1.0 - rec);
hChest.x -= 0.04 * raise * (1.0 - rec);
hHead.x -= 0.03 * raise * (1.0 - rec);
vec3 bowHand = hChest + vec3(-0.06, 0.16, 0.46);
vec3 nock = hChest + vec3(-0.02, 0.17, 0.28);
vec3 cheek = hChest + vec3(0.1, 0.24, -0.04);
vec3 flick = hChest + vec3(0.3, 0.26, -0.12);
hHandL = mix(hHandL, bowHand, raise * (1.0 - rec));
hHandR = mix(hHandR, mix(mix(nock, cheek, pull), flick, loose), raise * (1.0 - rec));
hDraw = pull;
}
}
`;Tt({id:"humanoid",boundY:.8,boundR:1.08,steps:60,glsl:`
${fl}
void entPose() { basePose(); }
float entMap(vec3 p, out float mat) {
vec3 hp = p - hHead;
float d = length(hp) - 0.33;
mat = 0.0;
float hair = length(hp - vec3(0.0, 0.035, -0.035)) - 0.365;
hair = max(hair, hp.z * 0.85 - hp.y * 0.55 - 0.17 - 0.025 * sin(hp.x * 24.0));
hair = smin(hair, length(hp - vec3(0.02, 0.33, -0.1)) - 0.09, 0.1);
float accent = 1e3, wood = 1e3, metal = 1e3, glow = 1e3, shield = 1e3;
if (eExtra < 0.5) {
hair = smin(hair, sdCapsule(hp, vec3(0.0, 0.05, -0.3), vec3(0.0, -0.2, -0.42 - 0.05 * ePose.w), 0.07), 0.08);
vec3 neck = hChest + vec3(0.0, 0.15, 0.0);
accent = sdTorusY(p - neck, 0.13, 0.06);
float sway = sin(uTime * 3.0 + eLook.x * 9.0);
vec3 ta = neck + vec3(0.06, 0.0, -0.13);
vec3 tb = ta + vec3(0.05 + 0.05 * sway, -0.14 + 0.1 * ePose.w, -0.26 - 0.14 * ePose.w);
accent = smin(accent, sdTaper(p, ta, tb, 0.055, 0.035), 0.05);
float big = gearBit(2.0);
metal = sdTaper(p, hHandR + hBlade * 0.1, hHandR + hBlade * mix(0.82, 1.16, big), mix(0.042, 0.056, big), 0.014);
vec3 side = normalize(cross(hBlade, vec3(0.0, 0.0, 1.0)) + 1e-3);
wood = min(sdCapsule(p, hHandR - hBlade * mix(0.07, 0.2, big), hHandR + hBlade * 0.08, 0.03),
sdCapsule(p, hHandR + hBlade * 0.1 - side * 0.1, hHandR + hBlade * 0.1 + side * 0.1, 0.028));
if (gearBit(1.0) > 0.5) {
vec3 sq = p - hHandL - vec3(-0.05, 0.02, 0.07);
shield = max(length(sq.xy * vec2(1.0, 0.86)) - 0.23, abs(sq.z) - 0.028) - 0.008;
}
} else if (eExtra < 1.5) {
accent = min(sdCylinder(hp - vec3(0.0, 0.2, 0.0), 0.52, 0.045), sdConeUp(hp - vec3(0.0, 0.2, 0.0), 0.27, 0.3) - 0.02);
accent = min(accent, sdRoundBox(p - hChest - vec3(0.0, -0.2, 0.15), vec3(0.14, 0.2, 0.035), 0.03));
} else if (eExtra < 2.5) {
float hood = length(hp - vec3(0.0, 0.03, -0.05)) - 0.4;
hood = max(hood, hp.z * 0.9 - hp.y * 0.35 - 0.2);
accent = smin(hood, sdTaper(p, hChest + vec3(0.0, 0.12, -0.08), hHip + vec3(0.0, -0.2, -0.16), 0.2, 0.26), 0.1);
vec3 st = hHandR + vec3(0.02, 0.0, 0.05);
wood = sdCapsule(p, st - vec3(0.0, 0.62, 0.0), st + vec3(0.0, 0.85, 0.0), 0.03);
glow = length(p - st - vec3(0.0, 0.95, 0.0)) - 0.09;
} else {
float hood = length(hp - vec3(0.0, 0.03, -0.05)) - 0.4;
hood = max(hood, hp.z * 0.9 - hp.y * 0.35 - 0.2);
accent = smin(hood, sdTaper(p, hChest + vec3(0.0, 0.12, -0.08), hChest + vec3(0.0, -0.16, -0.22), 0.17, 0.12), 0.08);
if (gearBit(4.0) > 0.5) {
metal = sdTaper(p, hHandR + hBlade * 0.08, hHandR + hBlade * 0.44, 0.032, 0.008);
wood = sdCapsule(p, hHandR - hBlade * 0.05, hHandR + hBlade * 0.07, 0.028);
} else {
vec3 b = p - hHandL;
float bend = 0.55 - 0.08 * hDraw;
float arc = length(vec2(length(b.yz - vec2(0.0, -bend)) - bend, b.x)) - 0.028;
wood = max(arc, -(b.z + 0.3));
vec3 top = hHandL + vec3(0.0, 0.49, -0.3), low = hHandL + vec3(0.0, -0.49, -0.3);
vec3 pullTo = mix((top + low) * 0.5, hHandR, hDraw);
metal = min(sdCapsule(p, top, pullTo, 0.007), sdCapsule(p, pullTo, low, 0.007));
if (hDraw > 0.05) metal = min(metal, sdCapsule(p, hHandR, hHandL + normalize(hHandL - hHandR) * 0.18, 0.011));
}
}
if (hair < d) { d = hair; mat = 1.0; }
float torso = sdTaper(p, hHip + vec3(0.0, 0.1, 0.0), hChest + vec3(0.0, 0.04, 0.0), 0.162, 0.15);
float hemTop = hHip.y + 0.06, hemBot = hemY(), hh = (hemTop - hemBot) * 0.5;
vec3 sp = p - vec3(hHip.x, hemBot + hh, hHip.z);
float wave = 0.011 * sin(atan(sp.x, sp.z) * 5.0 + eLook.x * 6.28 + 2.0 * ePose.x) * smoothstep(hh, -hh, sp.y);
float skirt = sdFrustum(sp, hh, robed() ? 0.24 : 0.19, 0.152) - 0.012 - wave;
float tunic = smin(torso, skirt, 0.04);
tunic = min(tunic, sdTaper(p, hChest + vec3(-0.17, 0.05, 0.0), hHandL, 0.068, 0.055));
tunic = min(tunic, sdTaper(p, hChest + vec3(0.17, 0.05, 0.0), hHandR, 0.068, 0.055));
if (tunic < d) { d = tunic; mat = 2.0; }
float hands = min(length(p - hHandL), length(p - hHandR)) - 0.072;
if (hands < d) { d = hands; mat = 0.0; }
vec3 kneeL = kneeOf(-1.0), kneeR = kneeOf(1.0);
float legs = min(sdTaper(p, kneeL, hFootL + vec3(0.0, 0.06, 0.0), 0.07, 0.056),
sdTaper(p, kneeR, hFootR + vec3(0.0, 0.06, 0.0), 0.07, 0.056));
if (legs < d) { d = legs; mat = 3.0; }
float tall = eExtra > 2.5 ? 0.24 : 0.19;
float boots = min(sdBoot(p, hFootL, kneeL, tall), sdBoot(p, hFootR, kneeR, tall));
if (boots < d) { d = boots; mat = 4.0; }
if (accent < d) { d = accent; mat = 5.0; }
if (metal < d) { d = metal; mat = 6.0; }
if (wood < d) { d = wood; mat = 7.0; }
if (glow < d) { d = glow; mat = 8.0; }
if (shield < d) { d = shield; mat = 9.0; }
return d;
}
vec3 browShape(float face) {
if (face < 0.5) return vec3(0.125, -0.15, 4.0);
if (face < 1.5) return vec3(0.105, 0.42, 1.5);
if (face < 2.5) return vec3(0.12, -0.6, 0.0);
if (face < 3.5) return vec3(0.14, -0.1, 6.0);
if (face < 4.5) return vec3(0.128, -0.55, 1.0);
if (face < 5.5) return vec3(0.16, 0.0, 8.0);
return vec3(0.12, -0.2, 0.0);
}
float browInk(vec3 f) {
if (f.z < 0.05) return 0.0;
float side = f.x < 0.0 ? -1.0 : 1.0;
vec2 e = vec2(f.x - side * 0.125, f.y + 0.015);
vec3 b = browShape(faceOf());
return penLine((e.y - (b.x + b.y * e.x * side - b.z * e.x * e.x)) * 0.75) * step(abs(e.x), 0.05);
}
void entFace(vec3 f, inout Surf s) {
float face = faceOf();
float side = f.x < 0.0 ? -1.0 : 1.0;
vec2 e = vec2(f.x - side * 0.125, f.y + 0.015);
float u = e.x * side;
vec2 mo = vec2(f.x, f.y + 0.118);
float open = face < 1.5 || (face > 3.5 && face < 5.5) ? 1.0 : 0.0;
float blink = step(0.965, fract(uTime * 0.27 + eLook.x)) * open;
vec2 sz = vec2(0.05, 0.08) * (face > 4.5 && face < 5.5 ? 1.2 : 1.0) * (1.0 + 0.06 * side);
float eye = open * (1.0 - blink) * smoothstep(1.0, 0.85, length(e / sz));
float glint = smoothstep(0.024, 0.014, length(e - vec2(-0.016, 0.03))) + smoothstep(0.011, 0.006, length(e - vec2(0.016, -0.03)));
float ink = blink * penLine(e.y + 0.004 - 5.0 * e.x * e.x) * step(abs(e.x), 0.048);
float mouth = 0.0, fill = 0.0, rim = 0.0, tongue = 0.0;
if (face < 0.5) {
mouth = penLine(mo.y - 0.002 - 8.0 * mo.x * mo.x) * step(abs(mo.x), 0.042);
} else if (face < 1.5) {
mouth = penLine(mo.y + 3.0 * mo.x * mo.x) * step(abs(mo.x), 0.03);
} else if (face < 2.5) {
float cu = u + 0.032;
ink = max(ink, penLine(abs(e.y) - 0.7 * cu) * step(0.0, cu) * step(cu, 0.075));
vec2 r = vec2(0.046, 0.024);
fill = step(length(mo / r), 1.0);
rim = penLine((length(mo / r) - 1.0) * r.y);
} else if (face < 3.5) {
ink = max(ink, penLine(e.y - 0.012 + 10.0 * e.x * e.x) * step(abs(e.x), 0.046));
vec2 dm = (mo - vec2(0.0, 0.012)) / vec2(0.052, 0.05);
fill = step(length(dm), 1.0) * step(mo.y, 0.012);
rim = max(penLine((length(dm) - 1.0) * 0.05) * step(mo.y, 0.012), penLine(mo.y - 0.012) * step(abs(mo.x), 0.052));
tongue = step(length((mo - vec2(0.0, -0.026)) / vec2(0.026, 0.014)), 1.0);
} else if (face < 4.5) {
mouth = penLine(mo.y + 0.004 + 7.0 * mo.x * mo.x) * step(abs(mo.x), 0.03);
} else if (face < 5.5) {
vec2 r = vec2(0.019, 0.026);
fill = step(length(mo / r), 1.0);
rim = penLine((length(mo / r) - 1.0) * r.x);
} else {
ink = max(ink, (penLine(e.y - e.x) + penLine(e.y + e.x)) * step(abs(e.x), 0.034) * step(abs(e.y), 0.034));
mouth = penLine(mo.y) * step(abs(mo.x), 0.03);
}
s.ink = max(ink, max(max(browInk(f), mouth), rim));
vec2 c = vec2(abs(f.x) - 0.205, f.y + 0.095);
float ticks = smoothstep(0.3, 0.1, abs(fract((c.x * 0.9 + c.y * 0.45) * 46.0) - 0.5)) * step(length(c * vec2(1.0, 1.7)), 0.055);
if (ticks > 0.1) { s.albedo = P_ROSE; s.cover = ticks * 0.85; }
if (fill > 0.5) { s.albedo = tongue > 0.5 ? P_ROSE : P_UMBER * 0.6; s.cover = 1.0; s.solid = 1.0; s.ink = 0.0; }
if (eye > 0.3) { s.albedo = INK_BLACK; s.cover = 1.0 - min(glint, 1.0); s.solid = 1.0; s.ink = 0.0; }
}
void entSurf(vec3 p, float mat, inout Surf s) {
int m = int(mat + 0.5);
if (m == 0) {
s.albedo = P_APRICOT; s.cover = 0.1; s.wrap = 0.35;
vec3 f = p - hHead;
if (f.z > 0.05 && length(f) < 0.36) entFace(f, s);
} else if (m == 1) {
float streak = vnoise(vec2(atan(p.x - hHead.x, p.z - hHead.z) * 5.0, p.y * 3.0));
s.albedo = eColC; s.cover = mix(0.78, 0.95, streak);
s.ink = max(smoothstep(0.12, 0.0, abs(fract(streak * 3.0) - 0.5)) * 0.55, browInk(p - hHead));
} else if (m == 2) {
s.albedo = eColA; s.cover = 0.84;
float belt = abs(p.y - hHip.y - 0.1) - 0.03;
if (belt < 0.0) {
bool buckle = abs(p.x - hHip.x) < 0.04 && p.z > hHip.z;
s.albedo = buckle ? P_MUSTARD : P_UMBER; s.cover = 0.95;
}
s.ink = penLine(belt) * 0.9;
float low = step(p.y, hHip.y + 0.06);
float trim = p.y - hemY() - 0.04;
if (trim < 0.0 && low > 0.5) { s.albedo = eColB; s.cover = 0.9; }
s.ink = max(s.ink, penLine(trim) * low * 0.8);
float fold = penLine(sin(atan(p.x - hHip.x, p.z - hHip.z) * 3.0 + 1.3) * 0.05);
s.ink = max(s.ink, fold * low * smoothstep(hemY() + 0.12, hemY() + 0.05, p.y) * step(0.0, trim) * 0.4);
} else if (m == 3) { s.albedo = P_STONE; s.cover = 0.72; }
else if (m == 4) {
vec3 foot = length(p - hFootL) < length(p - hFootR) ? hFootL : hFootR;
float along = dot(p - foot, normalize(kneeOf(sign(foot.x)) - foot));
float tall = eExtra > 2.5 ? 0.24 : 0.19;
s.albedo = P_UMBER; s.cover = 0.86;
if (along > tall - 0.014) { s.albedo = P_BARK; s.cover = 0.8; }
s.ink = penLine(along - tall + 0.014) * 0.8;
float sole = p.y - (foot.y - 0.05);
if (sole < 0.0) { s.albedo = INK_DARK; s.cover = 0.9; }
s.ink = max(s.ink, penLine(sole) * 0.9);
if (eExtra > 2.5 && along > 0.06 && along < tall - 0.03 && p.z > foot.z && abs(p.x - foot.x) < 0.035) s.ink = max(s.ink, penLine((fract(along * 30.0) - 0.5) * 0.033) * 0.7);
}
else if (m == 5) {
s.albedo = eColB; s.cover = 0.86;
if (eExtra > 0.5 && eExtra < 1.5 && p.y < hChest.y) { s.albedo = P_CREAM; s.cover = 0.14; }
} else if (m == 6) { s.albedo = P_SLATE; s.cover = 0.1; s.ink = 0.0; }
else if (m == 7) { s.albedo = P_BARK; s.cover = 0.8; }
else if (m == 9) {
vec3 sq = p - hHandL - vec3(-0.05, 0.02, 0.07);
float r = length(sq.xy * vec2(1.0, 0.86));
s.albedo = r < 0.06 ? P_SLATE : eColB;
s.cover = r < 0.06 ? 0.2 : 0.86;
s.ink = max(penLine(r - 0.2) * 0.9, penLine(r - 0.06) * 0.7);
}
else { s.albedo = P_SKY; s.cover = 0.1; s.glow = 1.0; }
}
`});const Kn=`
void paintEyes(inout Surf s, vec3 f, float spread, vec2 size, float seed) {
float blink = step(0.96, fract(uTime * 0.21 + seed));
float side = f.x < 0.0 ? -1.0 : 1.0;
vec2 sz = size * (1.0 + 0.07 * side);
vec2 e = vec2(f.x - side * spread, f.y);
float eye = smoothstep(1.0, 0.85, length(e / vec2(sz.x, mix(sz.y, sz.y * 0.12, blink))));
float glint = smoothstep(sz.x * 0.42, sz.x * 0.26, length(e - vec2(-sz.x * 0.33, sz.y * 0.36))) * (1.0 - blink);
if (eye > 0.3) { s.albedo = INK_BLACK; s.cover = 1.0 - glint; s.solid = 1.0; s.ink = 0.0; }
}
`;Tt({id:"sproutling",boundY:.42,boundR:.82,steps:44,glsl:Kn+`
float sHop, sSq, sLunge, sAir;
void entPose() {
float mv = ePose.w, at = ePose.z;
float ht = fract(ePose.x / TAU);
sAir = sin(ht * PI) * mv;
sHop = sAir * 0.24;
sSq = 1.0 - 0.15 * cos(ht * TAU) * mv + 0.03 * sin(uTime * 2.4 + eLook.x * 6.0);
sLunge = 0.0;
if (ePose.y > 0.5 && ePose.y < 1.5) { sLunge = sin(saturate(at) * PI) * 0.34; sSq += 0.2 * sin(saturate(at) * PI); }
if (ePose.y > 2.5) sSq -= 0.25 * (1.0 - at);
}
float entMap(vec3 p, out float mat) {
p.z -= sLunge; p.y -= sHop;
vec3 r = vec3(0.33 * (1.0 + (1.0 - sSq) * 0.55), 0.3 * sSq, 0.33 * (1.0 + (1.0 - sSq) * 0.55));
vec3 b = p - vec3(0.0, r.y + 0.03, 0.0);
float d = sdEllipsoid(b, r);
mat = 0.0;
float feet = min(length(p - vec3(-0.14, 0.05 - sAir * 0.03, 0.06)), length(p - vec3(0.14, 0.05 - sAir * 0.03, 0.06))) - 0.085;
if (feet < d) { d = feet; mat = 2.0; }
vec3 top = vec3(0.0, r.y * 2.0 + 0.02, 0.0);
float stem = sdCapsule(p, top, top + vec3(0.0, 0.15, 0.0), 0.028);
vec3 l = p - top - vec3(0.0, 0.15, 0.0);
l.x = abs(l.x);
l.xy = rot2(0.55 - sAir * 0.5 + 0.08 * sin(uTime * 3.0 + eLook.x * 5.0)) * l.xy;
vec3 lr = vec3(0.17, 0.035, 0.095);
float leaf = sdEllipsoid(l - vec3(0.15, 0.0, 0.0), lr);
leaf = min(leaf, stem);
if (leaf < d) { d = leaf; mat = 1.0; }
return d * 0.9;
}
void entSurf(vec3 p, float mat, inout Surf s) {
p.z -= sLunge; p.y -= sHop;
if (mat > 1.5) { s.albedo = eColC; s.cover = 0.88; return; }
if (mat > 0.5) {
s.albedo = eColB; s.cover = 0.84; s.wrap = 0.4;
s.ink = penLine(p.z) * 0.7;
return;
}
vec3 f = p - vec3(0.0, 0.33 * sSq + 0.03, 0.0);
float belly = smoothstep(0.02, -0.16, f.y) * step(0.0, f.z);
s.albedo = eColA; s.cover = mix(0.82, 0.12, belly); s.wrap = 0.35;
if (f.z > 0.0) {
paintEyes(s, f - vec3(0.0, 0.05, 0.0), 0.115, vec2(0.042, 0.06), eLook.x);
if (s.solid < 0.5) {
float lid = penLine(f.y - 0.115) * step(abs(abs(f.x) - 0.115), 0.06);
float mouth = penLine(f.y + 0.03) * step(abs(f.x), 0.03);
s.ink = max(lid, mouth);
}
}
}
`});Tt({id:"puffcap",boundY:.48,boundR:.85,steps:44,glsl:Kn+`
float pTilt, pLean, pBob;
vec3 puffLocal(vec3 p) {
p.y -= pBob;
p.xy = rot2(pTilt) * p.xy;
p.zy = rot2(pLean) * p.zy;
return p;
}
void entPose() {
float mv = ePose.w;
pTilt = sin(ePose.x) * 0.13 * mv;
pBob = abs(cos(ePose.x)) * 0.04 * mv + 0.012 * sin(uTime * 2.0 + eLook.x * 6.0);
pLean = 0.0;
if (ePose.y > 0.5 && ePose.y < 1.5) pLean = sin(saturate(ePose.z) * PI) * 0.75;
if (ePose.y > 2.5) pLean = -0.35 * (1.0 - ePose.z);
}
float entMap(vec3 p, out float mat) {
float s = sin(ePose.x) * ePose.w;
float up = cos(ePose.x) * ePose.w;
float feet = min(length(p - vec3(-0.12, 0.06 + max(up, 0.0) * 0.09, 0.04 + s * 0.12)),
length(p - vec3(0.12, 0.06 + max(-up, 0.0) * 0.09, 0.04 - s * 0.12))) - 0.085;
vec3 q = puffLocal(p);
float body = sdTaper(q, vec3(0.0, 0.14, 0.0), vec3(0.0, 0.42, 0.0), 0.2, 0.165);
vec3 c = q - vec3(0.0, 0.5, 0.0);
float cap = max(length(c * vec3(1.0, 1.4, 1.0)) - 0.46, -c.y - 0.03) * 0.68;
cap = smin(cap, sdTorusY(c, 0.43, 0.05), 0.05);
float arms = min(sdCapsule(q, vec3(-0.19, 0.33, 0.02), vec3(-0.3, 0.24 + 0.05 * s, 0.08), 0.04),
sdCapsule(q, vec3(0.19, 0.33, 0.02), vec3(0.3, 0.24 - 0.05 * s, 0.08), 0.04));
float d = min(body, arms);
mat = 0.0;
if (cap < d) { d = cap; mat = 1.0; }
if (feet < d) { d = feet; mat = 2.0; }
return d;
}
void entSurf(vec3 p, float mat, inout Surf s) {
if (mat > 1.5) { s.albedo = P_TAN; s.cover = 0.7; return; }
vec3 q = puffLocal(p);
if (mat > 0.5) {
vec3 c = q - vec3(0.0, 0.5, 0.0);
float under = step(c.y, 0.005);
float rim = step(c.y, 0.07) * step(0.36, length(c.xz)) * (1.0 - under);
vec2 v = voronoi(c.xz * 4.2 + eLook.x * 20.0);
float spot = smoothstep(0.24, 0.18, v.x) * (1.0 - under) * (1.0 - rim);
s.albedo = mix(eColA, eColB, rim);
s.cover = mix(0.86, 0.0, spot);
s.ink = penLine((v.x - 0.21) / 4.2) * (1.0 - under) * (1.0 - rim) * 0.6;
if (under > 0.5) {
s.albedo = P_TAN; s.cover = 0.4;
s.ink = smoothstep(0.2, 0.0, abs(fract(atan(c.z, c.x) * 3.5) - 0.5)) * 0.5;
}
return;
}
s.albedo = eColC; s.cover = 0.22; s.wrap = 0.3;
vec3 f = q - vec3(0.0, 0.31, 0.0);
if (f.z > 0.0) {
paintEyes(s, f, 0.085, vec2(0.034, 0.05), eLook.x);
if (s.solid < 0.5) {
float brow = penLine(f.y - 0.075 - 0.3 * (abs(f.x) - 0.085)) * step(abs(abs(f.x) - 0.085), 0.055);
float mouth = penLine(f.y + 0.085 + f.x * f.x * 3.0) * step(abs(f.x), 0.04);
s.ink = max(brow, mouth);
}
}
}
`});Tt({id:"bristlehog",boundY:.4,boundR:.95,steps:48,glsl:`
float bBob, bCharge, bNod;
void entPose() {
float mv = ePose.w;
bBob = abs(cos(ePose.x)) * 0.06 * mv + 0.01 * sin(uTime * 2.2 + eLook.x * 6.0);
bCharge = 0.0; bNod = 0.06 * sin(uTime * 1.3 + eLook.x * 9.0) * (1.0 - mv) + 0.09 * sin(ePose.x * 2.0) * mv;
if (ePose.y > 0.5 && ePose.y < 1.5) { float k = sin(saturate(ePose.z) * PI); bCharge = k * 0.3; bNod = -k * 0.25; }
if (ePose.y > 2.5) bCharge = -0.1 * (1.0 - ePose.z);
}
float entMap(vec3 p, out float mat) {
float s = sin(ePose.x) * ePose.w;
vec3 lp = p; lp.z -= bCharge * 0.4;
float sx = sign(lp.x), sz = sign(lp.z);
float ph = s * sx * sz;
vec3 hipJ = vec3(0.15 * sx, 0.26 + bBob, 0.2 * sz);
float lifted = max(cos(ePose.x) * sx * sz, 0.0) * ePose.w;
vec3 foot = vec3(0.16 * sx, 0.05 + lifted * 0.13, 0.21 * sz + ph * 0.2);
float legs = sdTaper(lp, hipJ, foot, 0.07, 0.055);
p.z -= bCharge; p.y -= bBob;
vec3 br = vec3(0.25, 0.225, 0.37);
float body = sdEllipsoid(p - vec3(0.0, 0.38, -0.03), br);
vec3 h = p - vec3(0.0, 0.36, 0.34);
h.zy = rot2(bNod) * h.zy;
float head = length(h) - 0.2;
head = smin(head, sdTaper(h, vec3(0.0, -0.03, 0.1), vec3(0.0, -0.06, 0.3), 0.12, 0.085), 0.08);
float ears = length(vec3(abs(h.x) - 0.14, h.y - 0.17, h.z + 0.02)) - 0.06;
float d = smin(body, head, 0.08);
d = min(d, ears);
mat = 0.0;
if (legs < d) { d = legs; mat = 0.0; }
float tusk = sdTaper(vec3(abs(h.x), h.y, h.z), vec3(0.09, -0.1, 0.22), vec3(0.14, 0.0, 0.3), 0.03, 0.01);
if (tusk < d) { d = tusk; mat = 2.0; }
vec3 q = p - vec3(0.0, 0.57, -0.03);
if (abs(q.z) < 0.34) {
float qz = mod(q.z + 0.055, 0.11) - 0.055;
float lift = 0.03 * (1.0 - abs(q.z) / 0.34) - q.z * q.z * 0.5;
vec3 sp = vec3(q.x, q.y - lift + 0.03, qz);
sp.zy = rot2(-0.5) * sp.zy;
float spike = sdConeUp(sp, 0.05, 0.17) * 0.8;
if (spike < d) { d = spike; mat = 1.0; }
}
float tail = sdCapsule(p, vec3(0.0, 0.42, -0.38), vec3(0.0, 0.52 + 0.03 * sin(uTime * 6.0), -0.47), 0.025);
if (tail < d) { d = tail; mat = 1.0; }
return d * 0.9;
}
void entSurf(vec3 p, float mat, inout Surf s) {
if (mat > 0.5) { s.albedo = eColB; s.cover = 0.9; return; }
p.z -= bCharge; p.y -= bBob;
float belly = smoothstep(0.34, 0.2, p.y);
float stripe = smoothstep(0.1, 0.04, abs(p.x)) * smoothstep(0.4, 0.5, p.y);
s.albedo = eColA;
s.cover = mix(mix(0.82, 0.98, stripe), 0.12, belly);
s.ink = step(0.72, vnoise(p.xz * 26.0 + p.y * 17.0)) * (1.0 - belly) * 0.5;
s.wrap = 0.25;
vec3 h = p - vec3(0.0, 0.36, 0.34);
h.zy = rot2(bNod) * h.zy;
if (h.z > 0.02) {
float snout = smoothstep(0.1, 0.085, length(vec2(h.x, h.y + 0.06))) * step(0.26, h.z);
if (snout > 0.5) { s.albedo = eColC; s.cover = 0.6; s.ink = 0.0; }
float nostril = smoothstep(0.02, 0.012, length(vec2(abs(h.x) - 0.035, h.y + 0.055))) * step(0.3, h.z);
vec2 e = vec2(abs(h.x) - 0.105, h.y - 0.055);
float eye = smoothstep(0.034, 0.026, length(e));
float glint = smoothstep(0.014, 0.008, length(vec2(h.x - sign(h.x) * 0.105 + 0.01, e.y - 0.012)));
if (max(eye, nostril) > 0.5) { s.albedo = INK_BLACK; s.cover = 1.0 - glint * eye; s.solid = 1.0; s.ink = 0.0; }
else s.ink = max(s.ink, penLine(e.y - 0.045 + e.x * 0.5) * step(abs(e.x), 0.055));
}
}
`});Tt({id:"wisp",boundY:.85,boundR:.75,steps:40,glsl:Kn+`
vec3 wCore; float wFlap, wPuff;
void entPose() {
float t = uTime * 2.0 + eLook.x * 6.28;
wCore = vec3(0.04 * sin(t * 0.7), 0.88 + 0.1 * sin(t), 0.0);
wFlap = sin(t * 2.4) * 0.35;
wPuff = 1.0;
if (ePose.y > 0.5 && ePose.y < 1.5) { float k = sin(saturate(ePose.z) * PI); wCore.z += k * 0.3; wPuff += k * 0.3; }
if (ePose.y > 2.5) wPuff -= 0.25 * (1.0 - ePose.z);
}
float entMap(vec3 p, out float mat) {
vec3 c = p - wCore;
float d = length(c) - 0.22 * wPuff;
float t = uTime * 3.0 + eLook.x * 6.28;
vec3 a = vec3(0.0);
for (int i = 1; i <= 4; i++) {
float fi = float(i);
vec3 b = vec3(0.07 * sin(t - fi * 0.9), -0.15 * fi, -0.06 * fi - 0.08 * ePose.w * fi);
d = smin(d, length(c - b) - (0.17 - 0.036 * fi) * wPuff, 0.12);
}
mat = 0.0;
vec3 f = c; f.x = abs(f.x);
f.xy = rot2(-0.3 + wFlap) * (f.xy - vec2(0.18, 0.0));
vec3 fr = vec3(0.17, 0.035, 0.085);
float fin = sdEllipsoid(f - vec3(0.14, 0.0, 0.0), fr);
if (fin < d) { d = fin; mat = 1.0; }
float halo = sdTorusY(c - vec3(0.0, 0.34 + 0.02 * sin(t), 0.0), 0.15, 0.018);
if (halo < d) { d = halo; mat = 2.0; }
return d * 0.85;
}
void entSurf(vec3 p, float mat, inout Surf s) {
vec3 c = p - wCore;
if (mat > 1.5) { s.albedo = eColC; s.cover = 0.9; return; }
if (mat > 0.5) { s.albedo = eColB; s.cover = 0.72; s.wrap = 0.6; s.ink = penLine(c.z) * 0.5; return; }
float fall = smoothstep(-0.6, 0.15, c.y);
s.albedo = mix(eColB, eColA, fall);
s.cover = mix(0.7, 0.06, fall);
s.glow = fall * 0.6;
s.wrap = 0.8;
if (c.z > 0.0 && length(c) < 0.3) paintEyes(s, c - vec3(0.0, 0.02, 0.0), 0.085, vec2(0.032, 0.055), eLook.x);
}
`});Tt({id:"cragling",boundY:.65,boundR:1.05,steps:52,glsl:`
const vec3 CRAG_N[5] = vec3[5](vec3(0.83, 0.52, 0.21), vec3(-0.61, 0.61, 0.51), vec3(0.1, 0.7, -0.71),
vec3(-0.5, 0.31, -0.81), vec3(0.3, -0.9, 0.31));
float lump(vec3 c, float r, float seed) {
float d = length(c) - r;
for (int i = 0; i < 5; i++) d = max(d, dot(c, CRAG_N[i]) - r * (0.66 + 0.22 * fract(seed * (5.0 + float(i) * 2.7))));
return d - 0.03;
}
vec3 cFistL, cFistR; float cBob, cStomp;
void entPose() {
float s = sin(ePose.x) * ePose.w;
cBob = abs(cos(ePose.x)) * 0.05 * ePose.w + 0.012 * sin(uTime * 1.6 + eLook.x * 6.0);
cStomp = s;
cFistL = vec3(-0.5, 0.4 + cBob, 0.08 - s * 0.2);
cFistR = vec3(0.5, 0.4 + cBob, 0.08 + s * 0.2);
if (ePose.y > 0.5 && ePose.y < 1.5) {
float up = smoothstep(0.0, 0.4, ePose.z), down = smoothstep(0.4, 0.58, ePose.z), rec = smoothstep(0.7, 1.0, ePose.z);
vec3 hi = vec3(0.3, 1.25, 0.1), lo = vec3(0.26, 0.2, 0.62);
vec3 tgt = mix(mix(cFistR, hi, up), lo, down);
tgt = mix(tgt, cFistR, rec);
cFistR = tgt; cFistL = tgt * vec3(-1.0, 1.0, 1.0);
}
if (ePose.y > 2.5) cBob -= 0.06 * (1.0 - ePose.z);
}
float entMap(vec3 p, out float mat) {
mat = 0.0;
float d = lump(p - vec3(0.0, 0.55 + cBob, 0.0), 0.44, eLook.x);
d = min(d, lump(p - vec3(0.0, 1.02 + cBob, 0.06), 0.25, eLook.x + 0.31));
vec3 fl = p - cFistL; fl.xz = fl.zx;
d = min(d, lump(fl, 0.21, eLook.x + 0.53));
d = min(d, lump(p - cFistR, 0.21, eLook.x + 0.71));
vec3 lg = vec3(abs(p.x) - 0.17, p.y - 0.12 - max(cStomp * sign(p.x), 0.0) * 0.08, p.z - cStomp * sign(p.x) * 0.1);
d = min(d, sdRoundBox(lg, vec3(0.11, 0.12, 0.13), 0.04));
return d * 0.92;
}
void entSurf(vec3 p, float mat, inout Surf s) {
vec2 pv = pavers(p.xy * 3.4 + p.z * 2.3 + eLook.x * 20.0);
s.albedo = eColA;
s.cover = mix(0.5, 0.82, pv.y);
s.ink = penLine(0.5 * pv.x / 3.4) * 0.8;
float fist = step(min(length(p - cFistL), length(p - cFistR)), 0.3);
if (fist > 0.5) { s.albedo = eColB; s.cover = mix(0.7, 0.92, pv.y); }
float moss = smoothstep(0.75, 0.85, p.y - cBob) * step(p.y - cBob, 0.92) * step(0.45, vnoise(p.xz * 9.0));
if (moss > 0.5 && fist < 0.5) { s.albedo = P_SAGE; s.cover = 0.8; s.ink *= 0.4; }
vec3 f = p - vec3(0.0, 1.03 + cBob, 0.06);
if (f.z > 0.1) {
vec2 e = vec2(abs(f.x) - 0.09, f.y - 0.02);
float socket = smoothstep(0.055, 0.045, length(e * vec2(1.0, 1.4)));
float pupil = smoothstep(0.024, 0.016, length(e));
if (socket > 0.5) { s.albedo = eColB; s.cover = 0.9; s.ink = 0.0; }
if (pupil > 0.5) { s.albedo = INK_BLACK; s.cover = 1.0; s.solid = 1.0; }
}
}
`});Tt({id:"shellsnap",boundY:.25,boundR:.85,steps:48,glsl:`
float cSway, cSnap, cBob;
void entPose() {
cSway = sin(ePose.x * 2.0) * 0.03 * ePose.w;
cBob = 0.012 * sin(uTime * 2.6 + eLook.x * 6.0) + abs(sin(ePose.x * 2.0)) * 0.02 * ePose.w;
cSnap = 0.0;
if (ePose.y > 0.5 && ePose.y < 1.5) cSnap = sin(saturate(ePose.z) * PI);
if (ePose.y > 2.5) cBob -= 0.05 * (1.0 - ePose.z);
}
float entMap(vec3 p, out float mat) {
vec3 q = p - vec3(cSway, cBob, 0.0);
vec3 sr = vec3(0.37, 0.17, 0.29);
float shell = sdEllipsoid(q - vec3(0.0, 0.24, 0.0), sr);
shell = max(shell, 0.17 - q.y) ;
float under = sdEllipsoid(q - vec3(0.0, 0.2, 0.0), vec3(0.33, 0.1, 0.25));
float d = min(shell, under);
mat = shell < under ? 0.0 : 2.0;
vec3 a = vec3(abs(q.x), q.y, q.z);
float sgn = sign(q.x);
float legs = 1e3;
for (int i = 0; i < 3; i++) {
float z = -0.16 + 0.14 * float(i);
float ph = sin(ePose.x * 2.0 + float(i) * 2.1 + sgn * 1.2) * ePose.w;
vec3 knee = vec3(0.44, 0.24 + max(ph, 0.0) * 0.06, z * 1.3);
vec3 tip = vec3(0.56, 0.0 + max(ph, 0.0) * 0.07 - cBob, z * 1.6 + ph * 0.05);
legs = min(legs, min(sdCapsule(a, vec3(0.28, 0.2, z), knee, 0.035), sdTaper(a, knee, tip, 0.032, 0.015)));
}
if (legs < d) { d = legs; mat = 2.0; }
vec3 cl = vec3(0.38 - 0.1 * cSnap, 0.24 + 0.14 * cSnap, 0.3 + 0.22 * cSnap);
float arm = sdCapsule(a, vec3(0.26, 0.2, 0.18), cl, 0.045);
vec3 cq = a - cl;
float claw = length(cq * vec3(1.0, 1.15, 0.85)) - 0.13;
claw = max(claw, -sdBox(cq - vec3(0.0, 0.0, 0.12), vec3(0.2, 0.02 + 0.03 * (1.0 - cSnap), 0.1)));
claw = min(claw, arm);
if (claw < d) { d = claw; mat = 1.0; }
float stalk = sdCapsule(a, vec3(0.09, 0.3, 0.22), vec3(0.1, 0.46, 0.26), 0.022);
float eye = length(a - vec3(0.1, 0.48, 0.26)) - 0.055;
if (stalk < d) { d = stalk; mat = 2.0; }
if (eye < d) { d = eye; mat = 3.0; }
return d * 0.85;
}
void entSurf(vec3 p, float mat, inout Surf s) {
vec3 q = p - vec3(cSway, cBob, 0.0);
if (mat > 2.5) {
s.albedo = P_CREAM; s.cover = 0.06;
vec3 e = vec3(abs(q.x), q.y, q.z) - vec3(0.1, 0.48, 0.26);
if (length(e.xy - vec2(0.0, 0.005)) < 0.03 && e.z > 0.0) { s.albedo = INK_BLACK; s.cover = 1.0; s.solid = 1.0; }
return;
}
if (mat > 1.5) { s.albedo = eColC; s.cover = mix(0.7, 0.15, step(q.y, 0.2) * step(length(q.xz), 0.3)); return; }
if (mat > 0.5) { s.albedo = eColB; s.cover = 0.88; return; }
float r = length(q.xz / vec2(0.37, 0.29));
vec2 v = voronoi(q.xz * 9.0 + eLook.x * 20.0);
float freckle = smoothstep(0.16, 0.1, v.x) * step(0.5, v.y);
s.albedo = eColA;
s.cover = mix(mix(0.78, 0.92, smoothstep(0.5, 1.0, r)), 0.0, freckle);
s.ink = penLine((abs(fract(r * 2.5) - 0.5)) / 2.5 * 0.3) * 0.6;
}
`});Tt({id:"drop",boundY:.32,boundR:.42,steps:36,glsl:`
float dBob; mat2 dSpin;
void entPose() {
dBob = 0.2 + 0.05 * sin(uTime * 2.6 + eLook.x * 6.28) + ePose.w;
dSpin = rot2(uTime * 1.8 + eLook.x * 6.28);
}
float entMap(vec3 p, out float mat) {
vec3 q = p - vec3(0.0, dBob, 0.0);
q.xz = dSpin * q.xz;
mat = 0.0;
if (eExtra < 0.5) {
float c1 = max(length(q.xy) - 0.14, abs(q.z) - 0.025);
float c2 = max(length(q.xy - vec2(0.12, -0.06)) - 0.11, abs(q.z + 0.07) - 0.022);
return min(c1, c2) - 0.008;
}
if (eExtra < 1.5) {
float sack = length(q * vec3(1.0, 1.15, 1.0) + vec3(0.0, 0.02, 0.0)) - 0.15;
float neck = sdCapsule(q, vec3(0.0, 0.1, 0.0), vec3(0.0, 0.19, 0.0), 0.05);
float tie = sdTorusY(q - vec3(0.0, 0.13, 0.0), 0.055, 0.016);
float d = smin(sack, neck, 0.05);
if (tie < d) { d = tie; mat = 1.0; }
return d;
}
if (eExtra < 2.5) {
float flask = length(q + vec3(0.0, 0.03, 0.0)) - 0.13;
float neck = sdCylinder(q - vec3(0.0, 0.06, 0.0), 0.045, 0.1);
float cork = sdCylinder(q - vec3(0.0, 0.16, 0.0), 0.05, 0.04);
float d = smin(flask, neck, 0.03);
if (cork < d) { d = cork; mat = 1.0; }
return d;
}
if (eExtra > 3.5) {
if (eExtra < 4.5) {
float blade = sdBox(q - vec3(0.0, 0.08, 0.0), vec3(0.034, 0.19, 0.011)) - 0.006;
blade = max(blade, q.y - 0.27 + abs(q.x) * 1.4);
float guard = sdBox(q - vec3(0.0, -0.12, 0.0), vec3(0.1, 0.018, 0.025));
float grip = sdCapsule(q, vec3(0.0, -0.14, 0.0), vec3(0.0, -0.24, 0.0), 0.022);
float pommel = length(q - vec3(0.0, -0.26, 0.0)) - 0.032;
float hilt = min(min(guard, grip), pommel);
if (hilt < blade) mat = 1.0;
return min(blade, hilt);
}
if (eExtra < 5.5) {
float shaft = sdCapsule(q, vec3(-0.06, -0.26, 0.0), vec3(0.05, 0.22, 0.0), 0.024);
float head = length(q - vec3(0.06, 0.26, 0.0)) - 0.06;
if (head < shaft) mat = 1.0;
return min(shaft, head);
}
if (eExtra < 6.5) {
float body = sdRoundBox(q - vec3(0.0, -0.01, 0.0), vec3(0.11, 0.15, 0.04), 0.03);
float arms = min(sdCapsule(q, vec3(-0.1, 0.1, 0.0), vec3(-0.19, -0.03, 0.0), 0.04), sdCapsule(q, vec3(0.1, 0.1, 0.0), vec3(0.19, -0.03, 0.0), 0.04));
float collar = sdTorusY(q - vec3(0.0, 0.14, 0.0), 0.05, 0.018);
if (collar < min(body, arms)) mat = 1.0;
return min(min(body, arms), collar);
}
if (eExtra < 7.5) {
float band = length(vec2(length(q.xy) - 0.1, q.z)) - 0.022;
float stone = length(q - vec3(0.0, 0.12, 0.0)) - 0.045;
if (stone < band) mat = 1.0;
return min(band, stone);
}
float disc = max(length(q.xy) - 0.17, abs(q.z) - 0.025) - 0.01;
float boss = length(q - vec3(0.0, 0.0, 0.03)) - 0.045;
if (boss < disc) mat = 1.0;
return min(disc, boss);
}
float hx = max(abs(q.x) * 0.866 + abs(q.z) * 0.5, abs(q.z));
return max(hx - 0.12 + abs(q.y) * 0.7, abs(q.y) - 0.17) * 0.8;
}
void entSurf(vec3 p, float mat, inout Surf s) {
vec3 q = p - vec3(0.0, dBob, 0.0);
q.xz = dSpin * q.xz;
if (eExtra < 0.5) {
s.albedo = P_SUN; s.cover = 0.85;
s.ink = penLine(length(q.xy) - 0.095) * 0.6;
} else if (eExtra < 1.5) {
s.albedo = mat > 0.5 ? P_BRICK : P_TAN; s.cover = mat > 0.5 ? 0.9 : 0.7;
} else if (eExtra < 2.5) {
s.albedo = mat > 0.5 ? P_BARK : eColA;
s.cover = mat > 0.5 ? 0.85 : mix(0.06, 0.88, step(q.y, 0.0));
s.ink = mat > 0.5 ? 0.0 : penLine(q.y) * 0.7;
} else if (eExtra > 3.5) {
s.albedo = mat > 0.5 ? P_BARK : eColA;
s.cover = mat > 0.5 ? 0.85 : 0.7;
if (eExtra < 4.5 && mat < 0.5) { s.albedo = mix(P_SLATE, eColA, 0.6); s.cover = 0.35; }
if (eExtra > 6.5 && eExtra < 7.5 && mat > 0.5) { s.albedo = eColA; s.cover = 0.9; s.glow = 0.3; }
} else {
s.albedo = eColA; s.cover = mix(0.85, 0.15, step(0.0, q.x * 0.6 + q.y));
s.glow = 0.25;
}
}
`});Tt({id:"arrow",boundY:0,boundR:.4,steps:40,glsl:`
mat2 aTilt;
void entPose() { aTilt = rot2(-ePose.x); }
float entMap(vec3 p, out float mat) {
vec3 q = p;
q.yz = aTilt * q.yz;
float shaft = sdCapsule(q, vec3(0.0, 0.0, -0.3), vec3(0.0, 0.0, 0.2), 0.017);
vec3 h = q - vec3(0.0, 0.0, 0.18);
float head = max(length(h.xy) - 0.052 * (1.0 - h.z / 0.15), max(-h.z, h.z - 0.15)) * 0.8;
vec3 f = q - vec3(0.0, 0.0, -0.24);
float sweep = 0.5 * clamp(f.z + 0.07, 0.0, 0.14);
float fl = min(sdBox(f, vec3(0.05 - sweep, 0.004, 0.07)), sdBox(f, vec3(0.004, 0.05 - sweep, 0.07)));
mat = 0.0;
float d = shaft;
if (head < d) { d = head; mat = 1.0; }
if (fl < d) { d = fl; mat = 2.0; }
return d;
}
void entSurf(vec3 p, float mat, inout Surf s) {
if (mat < 0.5) { s.albedo = P_BARK; s.cover = 0.75; }
else if (mat < 1.5) { s.albedo = P_SLATE; s.cover = 0.25; }
else { s.albedo = eColA; s.cover = 0.9; }
}
`});const Is={dims:[90,97,91],cube:384,file:"static/cyborg-head"};let $t=null;const v0=a=>new Promise((e,t)=>{const s=new Image;s.onload=()=>e(s),s.onerror=()=>t(new Error(`Could not load ${a}`)),s.src=a});async function y0(a){const[t,s]=await Promise.all([fetch(`./${Is.file}.bin`).then(d=>{if(!d.ok)throw new Error(`head ${d.status}`);return d.arrayBuffer()}),v0(`./${Is.file}.jpg`)]),[o,n,r]=Is.dims;if(t.byteLength!==o*n*r)throw new Error("head volume has the wrong size");a.bindTexture(a.TEXTURE_3D,$t.sdf),a.pixelStorei(a.UNPACK_ALIGNMENT,1),a.texImage3D(a.TEXTURE_3D,0,a.R8,o,n,r,0,a.RED,a.UNSIGNED_BYTE,new Uint8Array(t)),a.pixelStorei(a.UNPACK_ALIGNMENT,4);const i=Is.cube,l=document.createElement("canvas");l.width=i*6,l.height=i;const c=l.getContext("2d",{willReadFrequently:!0});c.drawImage(s,0,0),a.bindTexture(a.TEXTURE_CUBE_MAP,$t.col);for(let d=0;d<6;d++){const p=new Uint8Array(c.getImageData(d*i,0,i,i).data.buffer);a.texImage2D(a.TEXTURE_CUBE_MAP_POSITIVE_X+d,0,a.RGBA,i,i,0,a.RGBA,a.UNSIGNED_BYTE,p)}a.generateMipmap(a.TEXTURE_CUBE_MAP),a.texParameteri(a.TEXTURE_CUBE_MAP,a.TEXTURE_MIN_FILTER,a.LINEAR_MIPMAP_LINEAR),$t.ready=1}function b0(a){if($t)return;const e=a.createTexture();a.bindTexture(a.TEXTURE_3D,e),a.texParameteri(a.TEXTURE_3D,a.TEXTURE_MIN_FILTER,a.LINEAR),a.texParameteri(a.TEXTURE_3D,a.TEXTURE_MAG_FILTER,a.LINEAR);for(const s of[a.TEXTURE_WRAP_S,a.TEXTURE_WRAP_T,a.TEXTURE_WRAP_R])a.texParameteri(a.TEXTURE_3D,s,a.CLAMP_TO_EDGE);a.texImage3D(a.TEXTURE_3D,0,a.R8,1,1,1,0,a.RED,a.UNSIGNED_BYTE,new Uint8Array([255]));const t=a.createTexture();a.bindTexture(a.TEXTURE_CUBE_MAP,t);for(let s=0;s<6;s++)a.texImage2D(a.TEXTURE_CUBE_MAP_POSITIVE_X+s,0,a.RGBA,1,1,0,a.RGBA,a.UNSIGNED_BYTE,new Uint8Array([70,56,50,255]));a.texParameteri(a.TEXTURE_CUBE_MAP,a.TEXTURE_MIN_FILTER,a.LINEAR),a.texParameteri(a.TEXTURE_CUBE_MAP,a.TEXTURE_MAG_FILTER,a.LINEAR),$t={sdf:e,col:t,ready:0},y0(a).catch(s=>console.warn("Cyborg head unavailable:",s))}function x0(a,e){$t&&(a.tex("uHeadSdf",$t.sdf,e.TEXTURE_3D).tex("uHeadCol",$t.col,e.TEXTURE_CUBE_MAP),a.set("uHeadReady",$t.ready))}Tt({id:"cyborg",boundY:.82,boundR:1.12,steps:84,again:0,init:b0,bind:x0,glsl:`
${fl}
uniform highp sampler3D uHeadSdf;
uniform samplerCube uHeadCol;
uniform float uHeadReady;
const vec3 HEAD_LO = vec3(-0.41336, -0.44391, -0.42063);
const vec3 HEAD_HI = vec3(0.42364, 0.45819, 0.42567);
const vec3 HEAD_LENS = vec3(0.1157, -0.0279, 0.289);
const vec3 HEAD_EYE = vec3(0.0, 0.02, -0.02);
const float HEAD_RANGE = 0.06;
const float HEAD_K = 0.88;
const vec3 CY_GLOW = vec3(0.36, 0.92, 1.0);
const vec3 CY_PLATE = vec3(0.9, 0.91, 0.94);
const vec3 CY_SUIT = vec3(0.19, 0.2, 0.26);
const vec3 CY_METAL = vec3(0.34, 0.36, 0.44);
vec3 cShL, cShR, cElL, cElR, cHipL, cHipR, cKnL, cKnR, cAim, cMuzzle, cHeadAt, cBadge;
float cGlow;
vec3 joint(vec3 a, vec3 b, float la, float lb, vec3 pole) {
vec3 ab = b - a;
float len = max(length(ab), 1e-3);
vec3 dir = ab / len;
float d = min(len, la + lb - 1e-3);
float x = (la * la - lb * lb + d * d) / (2.0 * d);
float h = sqrt(max(la * la - x * x, 0.0));
return a + dir * x + normalize(pole - dir * dot(pole, dir) + 1e-4) * h;
}
void entPose() {
gCannon = true;
basePose();
cShL = hChest + vec3(-0.25, 0.06, -0.01);
cShR = hChest + vec3(0.25, 0.06, -0.01);
cElL = joint(cShL, hHandL, 0.17, 0.18, vec3(-0.35, -0.2, -1.0));
cElR = joint(cShR, hHandR, 0.17, 0.18, vec3(0.35, -0.2, -1.0));
cHipL = hHip + vec3(-0.1, -0.03, 0.0);
cHipR = hHip + vec3(0.1, -0.03, 0.0);
cKnL = joint(cHipL, hFootL + vec3(0.0, 0.09, 0.0), 0.17, 0.17, vec3(0.0, 0.0, 1.0));
cKnR = joint(cHipR, hFootR + vec3(0.0, 0.09, 0.0), 0.17, 0.17, vec3(0.0, 0.0, 1.0));
cAim = normalize(hHandR - cElR);
cMuzzle = hHandR + cAim * 0.14;
cHeadAt = hHead + vec3(0.0, 0.03, 0.0);
cBadge = hChest + vec3(0.0, 0.0, 0.152);
cGlow = 0.6 + 0.4 * hDraw;
}
float headMap(vec3 p) {
vec3 q = (p - cHeadAt) / HEAD_K;
if (uHeadReady < 0.5) return (length(q - vec3(0.0, 0.0, 0.03)) - 0.31) * HEAD_K;
float box = sdBox(q - (HEAD_LO + HEAD_HI) * 0.5, (HEAD_HI - HEAD_LO) * 0.5);
if (box > 0.0) return (box + 0.036) * HEAD_K;
float s = texture(uHeadSdf, (q - HEAD_LO) / (HEAD_HI - HEAD_LO)).r;
return (s - 0.5) * 2.0 * HEAD_RANGE * HEAD_K;
}
float entMap(vec3 p, out float mat) {
float d = headMap(p);
mat = 0.0;
float suit = sdCapsule(p, hChest + vec3(0.0, 0.06, -0.01), cHeadAt + vec3(0.0, -0.22, -0.05), 0.072);
suit = min(suit, sdTaper(p, hHip + vec3(0.0, 0.06, 0.0), hChest + vec3(0.0, -0.1, 0.0), 0.125, 0.15));
suit = min(suit, min(sdCapsule(p, cShL, cElL, 0.05), sdCapsule(p, cShR, cElR, 0.05)));
suit = min(suit, min(length(p - cElL) - 0.058, length(p - cElR) - 0.058));
suit = min(suit, min(sdCapsule(p, cHipL, cKnL, 0.058), sdCapsule(p, cHipR, cKnR, 0.058)));
if (suit < d) { d = suit; mat = 2.0; }
float plate = sdEllipsoid(p - hChest - vec3(0.0, -0.005, 0.005), vec3(0.235, 0.18, 0.158));
plate = min(plate, sdEllipsoid(p - hHip - vec3(0.0, 0.02, 0.0), vec3(0.168, 0.092, 0.132)));
vec3 pl = p - cShL - vec3(-0.035, 0.035, 0.0), pr = p - cShR - vec3(0.035, 0.035, 0.0);
plate = min(plate, max(min(sdEllipsoid(pl, vec3(0.125, 0.092, 0.125)), sdEllipsoid(pr, vec3(0.125, 0.092, 0.125))), hChest.y - 0.05 - p.y));
vec3 fl = normalize(hHandL - cElL);
plate = min(plate, sdTaper(p, cElL + fl * 0.03, hHandL - fl * 0.02, 0.06, 0.068));
plate = min(plate, min(sdTaper(p, cHipL + vec3(0.0, -0.03, 0.012), cKnL, 0.076, 0.064), sdTaper(p, cHipR + vec3(0.0, -0.03, 0.012), cKnR, 0.076, 0.064)));
plate = min(plate, min(sdTaper(p, cKnL, hFootL + vec3(0.0, 0.1, 0.0), 0.064, 0.058), sdTaper(p, cKnR, hFootR + vec3(0.0, 0.1, 0.0), 0.064, 0.058)));
if (plate < d) { d = plate; mat = 1.0; }
vec3 e = p - cBadge;
float badge = max(length(e.xy) - 0.098, abs(e.z) - 0.026) - 0.008;
if (badge < d) { d = badge; mat = 3.0; }
float metal = sdTaper(p, cElR - cAim * 0.02, cMuzzle, 0.082, 0.075);
metal = max(metal, -sdCapsule(p, cMuzzle - cAim * 0.06, cMuzzle + cAim * 0.06, 0.042));
metal = min(metal, length(p - hHandL) - 0.066);
metal = min(metal, min(sdBoot(p, hFootL, cKnL, 0.17), sdBoot(p, hFootR, cKnR, 0.17)));
metal = min(metal, sdTorusY(p - hHip - vec3(0.0, 0.08, 0.0), 0.15, 0.026));
vec3 bp = p - hChest - vec3(0.0, -0.02, -0.17);
metal = min(metal, sdRoundBox(bp, vec3(0.13, 0.15, 0.06), 0.035));
vec2 nz = vec2(abs(bp.x) - 0.075, bp.z);
metal = min(metal, max(length(nz) - 0.038, abs(bp.y + 0.19) - 0.05));
if (metal < d) { d = metal; mat = 5.0; }
float accent = sdTorusY(p - hChest - vec3(0.0, 0.135, -0.005), 0.112, 0.038);
accent = min(accent, min(length(p - cKnL - vec3(0.0, 0.01, 0.05)) - 0.046, length(p - cKnR - vec3(0.0, 0.01, 0.05)) - 0.046));
if (accent < d) { d = accent; mat = 6.0; }
float glow = length(p - cMuzzle + cAim * 0.03) - 0.036;
glow = min(glow, length(p - hHip - vec3(0.0, 0.08, 0.162)) - 0.03);
float burn = 0.05 + 0.16 * eMove + 0.05 * sin(uTime * 37.0 + eLook.x * 11.0);
vec3 fq = vec3(nz.x, bp.y + 0.24, nz.y);
glow = min(glow, sdTaper(fq, vec3(0.0), vec3(0.0, -burn, 0.0), 0.03, 0.006));
if (glow < d) { d = glow; mat = 4.0; }
float lens = length(p - cHeadAt - HEAD_LENS * HEAD_K) - 0.042 * HEAD_K;
if (lens < d) { d = lens; mat = 7.0; }
return d;
}
void entSurf(vec3 p, float mat, inout Surf s) {
int m = int(mat + 0.5);
if (m == 0) {
vec3 dq = (p - cHeadAt) / HEAD_K - HEAD_EYE;
vec3 d = normalize(dq);
vec3 c = uHeadReady > 0.5 ? texture(uHeadCol, d).rgb : P_TAN;
vec3 t1 = normalize(cross(d, abs(d.y) < 0.9 ? vec3(0.0, 1.0, 0.0) : vec3(1.0, 0.0, 0.0)));
vec3 t2 = cross(d, t1);
float e = gPen * 0.55 / (HEAD_K * max(length(dq), 0.05));
vec3 gx = texture(uHeadCol, normalize(d + t1 * e)).rgb - texture(uHeadCol, normalize(d - t1 * e)).rgb;
vec3 gy = texture(uHeadCol, normalize(d + t2 * e)).rgb - texture(uHeadCol, normalize(d - t2 * e)).rgb;
float lum = dot(c, vec3(0.3, 0.55, 0.15));
s.albedo = c;
s.cover = mix(0.96, 0.8, smoothstep(0.3, 0.75, lum));
s.solid = 0.62; s.wrap = 0.3; s.occ = 0.4;
s.ink = uHeadReady > 0.5 ? smoothstep(0.42, 0.7, length(gx) + length(gy)) * 0.65 : 0.0;
float lens = smoothstep(0.12, 0.3, min(c.g, c.b) - c.r) * step(0.5, c.b);
if (lens > 0.5) { s.albedo = mix(CY_GLOW, vec3(1.0), 0.3 + 0.3 * cGlow); s.cover = 1.0; s.solid = 1.0; s.glow = 1.0; s.ink *= 0.4; }
} else if (m == 1) {
s.albedo = CY_PLATE; s.cover = 0.2; s.wrap = 0.25;
vec3 c = p - hChest;
bool torso = abs(c.y) < 0.19 && length(c.xz) < 0.26;
if (torso) {
float seam = abs(c.y + 0.115) - 0.006;
if (seam < 0.0 && c.z > 0.04) { s.albedo = CY_GLOW; s.cover = 1.0; s.solid = 1.0; s.glow = cGlow; }
s.ink = max(penLine(c.y - 0.07) * step(abs(c.x), 0.2) * 0.6, penLine(abs(c.x) - 0.13) * step(0.03, c.z) * step(c.y, 0.07) * 0.5);
}
if (p.y > hChest.y + 0.02 && abs(c.x) > 0.17) {
s.albedo = eColA; s.cover = 0.85;
s.ink = penLine(p.y - hChest.y - 0.1) * 0.7;
}
if (p.y < hHip.y - 0.04) {
vec3 kn = length(p - cKnL) < length(p - cKnR) ? cKnL : cKnR;
float stripe = abs(p.x - kn.x) - 0.011;
if (stripe < 0.0 && p.z > kn.z + 0.03) { s.albedo = CY_GLOW; s.cover = 1.0; s.solid = 1.0; s.glow = cGlow; }
s.ink = penLine(p.y - kn.y + 0.01) * 0.6;
}
float fore = dot(p - cElL, normalize(hHandL - cElL));
if (length(p - hHandL) < 0.22 && abs(fore - 0.1) < 0.008) { s.albedo = CY_GLOW; s.cover = 1.0; s.solid = 1.0; s.glow = cGlow; }
} else if (m == 2) {
s.albedo = CY_SUIT; s.cover = 0.9;
s.ink = penLine(sin((p.y + p.x * 0.3) * 120.0) * 0.004) * 0.25;
} else if (m == 3) {
vec3 e = p - cBadge;
float r = length(e.xy), ang = atan(e.y, e.x);
vec2 h = abs(rot2(uTime * 0.6) * e.xy);
float hexa = smoothstep(0.007, 0.003, abs(max(dot(h, vec2(0.5, 0.8660254)), h.x) - 0.046));
float ring = smoothstep(0.009, 0.004, abs(r - 0.088));
float ticks = step(0.5, fract(ang / 6.2832 * 12.0 - uTime * 0.4)) * smoothstep(0.006, 0.002, abs(r - 0.069));
float core = smoothstep(0.026, 0.018, r);
float lit = max(max(ring, hexa), max(ticks, core)) * step(0.0, e.z);
s.albedo = INK_BLACK; s.cover = 1.0; s.solid = 1.0;
if (lit > 0.4) { s.albedo = mix(CY_GLOW, vec3(1.0), core * 0.7); s.glow = 0.8 + 0.2 * sin(uTime * 4.0); }
s.ink = penLine(r - 0.104) * 0.9;
} else if (m == 4) {
s.albedo = mix(CY_GLOW, vec3(1.0), 0.3); s.cover = 1.0; s.solid = 1.0; s.glow = 1.0;
} else if (m == 7) {
vec3 l = p - cHeadAt - HEAD_LENS * HEAD_K;
float r = length(l.xy) / (0.042 * HEAD_K);
s.albedo = mix(vec3(1.0), CY_GLOW, smoothstep(0.2, 0.5, r * (1.1 - 0.25 * cGlow)));
if (r > 0.78) s.albedo = CY_GLOW * 0.8;
s.cover = 1.0; s.solid = 1.0; s.glow = 1.0;
s.ink = smoothstep(0.86, 0.94, r) * 0.7;
} else if (m == 5) {
s.albedo = CY_METAL; s.cover = 0.72; s.wrap = 0.2;
float along = dot(p - cElR, cAim);
if (length(p - hHandR) < 0.3) {
s.ink = penLine((fract(along * 12.0) - 0.5) * 0.08) * 0.7;
if (along > length(cMuzzle - cElR) - 0.05) { s.albedo = CY_GLOW; s.cover = 1.0; s.solid = 1.0; s.glow = cGlow; s.ink = 0.0; }
}
} else {
s.albedo = eColA; s.cover = 0.86;
}
}
`});const Pr=.3;class w0{constructor(e,t,s={}){this.canvas=e;const{gl:o}=Jc(e);this.gl=o,this.worldTex=new a0(o,t),this.minimap=new g0(this.worldTex),this.worldPass=new n0(o),this.quality=s.lite?"low":"high",this.worldPass.program(this.quality),this.toWarm=null,this.entityPass=new l0(o),this.fxPass=new u0(o),this.post=new m0(o),this.targets={scene:new Bo(o,[{},{filter:"nearest",precise:!0},{},{filter:"nearest",precise:!0}]),edge:new Bo(o,[{}]),ent:new Bo(o,[{},{filter:"nearest"}],!0)},this.vao=o.createVertexArray(),this.leafPal=new Float32Array(jc.flat()),this.pencil=new Float32Array(4),this.paperAnchor=new Float32Array(3),this.paper={a:null,b:null,mix:0,fade:0,still:0,last:null},this.scale=s.lite?xe.SCALE_LITE:xe.SCALE_START,this.perf={ema:16.7,gpu:0,timer:0,calm:0,futile:0,lastDown:0,hold:0},this.gpuTimer=o.getExtension("EXT_disjoint_timer_query_webgl2"),this.query=null,this.timing=!1,this.size={cssW:1,cssH:1,dpr:1,width:1,height:1},this.frameFn=n=>this.applyFrame(n),this.steady=!1}setWorld(e){this.worldTex.setWorld(e)}resize(e,t,s){const o=this.size;o.cssW=e,o.cssH=t,o.dpr=s,o.width=Math.round(e*s),o.height=Math.round(t*s),(this.canvas.width!==o.width||this.canvas.height!==o.height)&&(this.canvas.width=o.width,this.canvas.height=o.height);const n=Math.round(e*this.scale),r=Math.round(t*this.scale);this.targets.scene.resize(n,r),this.targets.edge.resize(n,r);const i=Math.min(s,xe.ENTITY_DPR_MAX);this.targets.ent.resize(Math.round(e*i),Math.round(t*i))}adapt(e){const t=this.perf;if(e>100||(t.ema+=(e-t.ema)*.08,t.timer+=e,t.timer<700))return;t.timer=0;let s=this.scale;this.gpuTimer?(t.gpu>19&&this.scale<=xe.SCALE_MIN+.001&&(this.quality="low"),t.gpu>13?s-=t.gpu>20?.12:.05:t.gpu>0&&t.gpu<8.5&&(s+=.05)):t.ema>21.5?(t.ema>30&&this.scale<=xe.SCALE_MIN+.001&&(this.quality="low"),t.lastDown&&t.lastDown-t.ema<1?++t.futile>=2&&(s=xe.SCALE_START,t.hold=30):(t.futile=0,s-=.06),t.lastDown=t.ema):t.ema<17.6&&++t.calm>=5&&(s+=.05,t.calm=0,t.lastDown=0),t.hold>0&&(t.hold--,s=this.scale),s=He(s,xe.SCALE_MIN,xe.SCALE_MAX),Math.abs(s-this.scale)>.001&&(this.scale=s,this.resize(this.size.cssW,this.size.cssH,this.size.dpr))}warm(){this.toWarm||(this.toWarm=[...Wn.keys()]);const e=this.toWarm.pop();return e?this.entityPass.program(e):this.fxPass.program(),!this.toWarm.length&&!e}beginTiming(){const e=this.gl,t=this.gpuTimer;if(t){if(this.query){if(!e.getQueryParameter(this.query,e.QUERY_RESULT_AVAILABLE))return;if(!e.getParameter(t.GPU_DISJOINT_EXT)){const s=e.getQueryParameter(this.query,e.QUERY_RESULT)/1e6;this.perf.gpu+=(s-this.perf.gpu)*(this.perf.gpu?.15:1)}e.deleteQuery(this.query),this.query=null}this.query=e.createQuery(),e.beginQuery(t.TIME_ELAPSED_EXT,this.query),this.timing=!0}}endTiming(){this.timing&&(this.gl.endQuery(this.gpuTimer.TIME_ELAPSED_EXT),this.timing=!1)}applyFrame(e){const t=this.frame,s=t.camera,o=t.env;e.set("uCamPos",s.pos).set("uCamRight",s.right).set("uCamUp",s.up).set("uCamFwd",s.fwd).set("uTanFov",s.tan),e.set("uFocus",t.focus).set("uTime",t.time).set("uReveal",t.reveal),e.set("uSunDir",o.keyDir).set("uSunDisk",o.sunDir).set("uMoonDisk",o.moonDir),e.set("uNight",o.night).set("uGold",o.gold).set("uCloud",o.cloud).set("uWind",o.wind),e.set("uRockCol",o.rockCol).set("uLeafPal",this.leafPal),e.set("uLightPos",t.lightPos).set("uLightCol",t.lightCol).set("uLightCount",t.lightCount),e.set("uPencil",this.pencil).set("uPaperAnchor",this.paperAnchor);const n=this.paper.a,r=this.paper.b||this.paper.a;e.set("uPaperRight",n.right).set("uPaperUp",n.up).set("uPaperFwd",n.fwd),e.set("uPaperRightB",r.right).set("uPaperUpB",r.up).set("uPaperFwdB",r.fwd).set("uPaperMix",this.paper.mix)}holdPaper(e,t){const s=this.paper,o=c=>({right:[...c.right],up:[...c.up],fwd:[...c.fwd]});if(!s.a){s.a=o(e),s.last=[...e.fwd];return}const n=(c,d)=>c[0]*d[0]+c[1]*d[1]+c[2]*d[2],r=(c,d)=>Math.acos(Math.min(1,Math.max(-1,n(c,d)))),i=r(e.fwd,s.last)/Math.max(t,1e-4);if(s.last=[...e.fwd],s.still=i<.03?s.still+t:0,s.b){s.mix+=t/s.fade,s.mix>=1&&(s.a=s.b,s.b=null,s.mix=0);return}const l=Math.max(r(e.fwd,s.a.fwd),r(e.right,s.a.right));if(l>Pr){const c=Math.min(Pr*.6,i*.3),d=l>1e-4?c/l:0,p={right:[0,0,0],up:[0,0,0],fwd:[0,0,0]};for(const v of["right","fwd"]){let x=0;for(let b=0;b<3;b++)p[v][b]=e[v][b]+(e[v][b]-s.a[v][b])*d,x+=p[v][b]**2;x=Math.sqrt(x);for(let b=0;b<3;b++)p[v][b]/=x}const f=p.right,u=p.fwd,m=n(f,u);let g=0;for(let v=0;v<3;v++)f[v]-=u[v]*m,g+=f[v]**2;g=Math.sqrt(g);for(let v=0;v<3;v++)f[v]/=g;p.up=[f[1]*u[2]-f[2]*u[1],f[2]*u[0]-f[0]*u[2],f[0]*u[1]-f[1]*u[0]],s.b=p,s.mix=0,s.fade=.2}else l>.012&&s.still>.3&&(s.b=o(e),s.mix=0,s.fade=.45)}render(e){const t=this.gl,s=this.targets,o=this.size;this.holdPaper(e.camera,Math.max(0,e.time-(this.lastTime??e.time))),this.lastTime=e.time,this.frame=e,e.dpr=o.dpr,this.pencil[0]=2*e.camera.tan[1]/o.height,this.pencil[1]=4.6*o.dpr,this.pencil[2]=this.steady?0:Math.floor(e.time*6),this.pencil[3]=o.dpr,this.paperAnchor[0]=Math.floor(e.focus[0]/64)*64,this.paperAnchor[2]=Math.floor(e.focus[2]/64)*64,this.beginTiming(),t.bindVertexArray(this.vao),this.worldPass.render(s.scene,e,this.worldTex,this.frameFn,this.quality),this.post.runInk(s,this.frameFn),this.entityPass.render(s.ent,e,e.batches,this.frameFn),this.fxPass.render(s.ent,e,e.fx.data,e.fx.count,s.scene.textures[1]),t.bindVertexArray(this.vao),this.post.runFinal(s,e,o.width,o.height,this.minimap,this.frameFn),this.endTiming()}}const k0=1.5;class M0{constructor(){this.target=[0,0,0],this.yaw=Math.PI*.25,this.pitch=.8,this.distance=15.5,this.goal={yaw:this.yaw,pitch:this.pitch,distance:this.distance},this.fov=xe.FOV*Math.PI/180,this.aspect=1,this.pos=[0,10,10],this.right=[1,0,0],this.up=[0,1,0],this.fwd=[0,0,-1],this.tan=[1,1],this.view=new Float32Array(16),this.proj=new Float32Array(16),this.viewProj=new Float32Array(16),this.shake=0,this.still=!1,this.shift=0,this.portrait=!1}rotate(e,t){this.goal.yaw+=e,this.goal.pitch=He(this.goal.pitch+t,.2,1.35)}zoom(e){this.goal.distance=He(this.goal.distance*e,7,42)}update(e,t,s,o){this.aspect=s,this.yaw=us(this.yaw,this.goal.yaw,12,e),this.pitch=Vt(this.pitch,this.goal.pitch,12,e),this.distance=Vt(this.distance,this.goal.distance,8,e);for(let f=0;f<3;f++)this.target[f]=Vt(this.target[f],t[f],9,e);const n=Math.cos(this.pitch),r=Math.sin(this.pitch),i=[Math.sin(this.yaw)*n,r,Math.cos(this.yaw)*n];let l=this.distance;const c=this.portrait?-.25:k0*(1-j(.24,.62,this.pitch)),d=[this.target[0]-this.right[0]*this.shift,this.target[1]+c,this.target[2]-this.right[2]*this.shift];if(this.pos=Ve.add(d,Ve.scale(i,l)),o){const f=o(this.pos[0],this.pos[2])+1.2;this.pos[1]<f&&(this.pos[1]=f)}if(this.shake>0&&!this.still){const f=this.shake*this.shake*.35;this.pos[0]+=(Math.random()-.5)*f,this.pos[1]+=(Math.random()-.5)*f,this.shake=Math.max(0,this.shake-e*2.5)}this.fwd=Ve.norm(Ve.sub(d,this.pos)),this.right=Ve.norm(Ve.cross(this.fwd,[0,1,0])),this.up=Ve.cross(this.right,this.fwd);const p=Math.tan(this.fov/2);this.tan=[p*s,p],Fo.view(this.view,this.pos,this.right,this.up,this.fwd),Fo.perspective(this.proj,this.fov,s,.2,600),Fo.mul(this.viewProj,this.proj,this.view)}ray(e,t){const s=this.right,o=this.up,n=this.fwd;return{origin:this.pos,dir:Ve.norm([n[0]+s[0]*e*this.tan[0]+o[0]*t*this.tan[1],n[1]+s[1]*e*this.tan[0]+o[1]*t*this.tan[1],n[2]+s[2]*e*this.tan[0]+o[2]*t*this.tan[1]])}}project(e,t,s){const o=this.viewProj,n=o[3]*e+o[7]*t+o[11]*s+o[15];return n<=.05?null:{x:(o[0]*e+o[4]*t+o[8]*s+o[12])/n*.5+.5,y:.5-(o[1]*e+o[5]*t+o[9]*s+o[13])/n*.5,w:n}}}class _0{handlers=new Map;on(e,t){let s=this.handlers.get(e);return s||this.handlers.set(e,s=[]),s.push(t),()=>{const o=s.indexOf(t);o>=0&&s.splice(o,1)}}emit(e,...t){const s=this.handlers.get(e);if(!s||!s.length)return;const o=t[0],n=s.length===1?s:s.slice();for(let r=0;r<n.length;r++)try{n[r](o)}catch(i){console.error(`Listener for "${e}" failed:`,i)}}}const Ar=["A","B","X","Y","LB","RB","LT","RT","Back","Start","LS","RS","Up","Down","Left","Right"],Kt={moveUp:{label:"Walk forward",group:"Movement"},moveDown:{label:"Walk back",group:"Movement"},moveLeft:{label:"Walk left",group:"Movement"},moveRight:{label:"Walk right",group:"Movement"},evade:{label:"Evade",group:"Movement"},interact:{label:"Attack nearest / talk / use",group:"Movement"},slot1:{label:"Skill slot 1 (primary)",group:"Combat",mouse:!0},slot2:{label:"Skill slot 2",group:"Combat",mouse:!0},slot3:{label:"Skill slot 3",group:"Combat",mouse:!0},slot4:{label:"Skill slot 4",group:"Combat",mouse:!0},slot5:{label:"Skill slot 5",group:"Combat",mouse:!0},slot6:{label:"Skill slot 6",group:"Combat",mouse:!0},potion:{label:"Drink a tonic",group:"Combat"},nextTarget:{label:"Next target",group:"Combat"},standStill:{label:"Stand still (attack in place)",group:"Combat"},camLeft:{label:"Turn view left",group:"Camera"},camRight:{label:"Turn view right",group:"Camera"},camUp:{label:"Tilt view up",group:"Camera"},camDown:{label:"Tilt view down",group:"Camera"},zoomIn:{label:"Zoom in",group:"Camera"},zoomOut:{label:"Zoom out",group:"Camera"},inventory:{label:"Inventory",group:"Interface"},character:{label:"Character",group:"Interface"},skills:{label:"Skill tree",group:"Interface"},map:{label:"Map and waystones",group:"Interface"},journal:{label:"Quest journal",group:"Interface"},view:{label:"View controls",group:"Interface"},showLabels:{label:"Show all item labels (hold)",group:"Interface"},menu:{label:"Menu / close",group:"Interface"}},Oo=Object.keys(Kt),Gn={moveUp:["KeyW","ArrowUp"],moveDown:["KeyS","ArrowDown"],moveLeft:["KeyA","ArrowLeft"],moveRight:["KeyD","ArrowRight"],evade:["Space",null],interact:["KeyF",null],slot1:["Mouse0",null],slot2:["Mouse2",null],slot3:["Digit1",null],slot4:["Digit2",null],slot5:["Digit3",null],slot6:["Digit4",null],potion:["KeyR",null],nextTarget:["Tab",null],standStill:["ShiftLeft",null],camLeft:["KeyQ",null],camRight:["KeyE",null],camUp:[null,null],camDown:[null,null],zoomIn:["Equal",null],zoomOut:["Minus",null],inventory:["KeyI","KeyB"],character:["KeyC",null],skills:["KeyK",null],map:["KeyM","KeyT"],journal:["KeyJ",null],view:["KeyV",null],showLabels:["AltLeft",null],menu:["Escape",null]},Yn={moveUp:null,moveDown:null,moveLeft:null,moveRight:null,evade:"LT",interact:"A",slot1:null,slot2:"X",slot3:"Y",slot4:"B",slot5:"RB",slot6:"RT",potion:"LB",nextTarget:"Right",standStill:null,camLeft:null,camRight:null,camUp:null,camDown:null,zoomIn:"Up",zoomOut:"Down",inventory:"Back",character:null,skills:"Left",map:null,journal:null,view:null,showLabels:"RS",menu:"Start"},Er={Mouse0:"Left click",Mouse1:"Middle click",Mouse2:"Right click",Space:"Space",Escape:"Esc",Tab:"Tab",Enter:"Enter",Backquote:"`",ShiftLeft:"Shift",ShiftRight:"Right Shift",ControlLeft:"Ctrl",ControlRight:"Right Ctrl",AltLeft:"Alt",AltRight:"Right Alt",Minus:"-",Equal:"=",BracketLeft:"[",BracketRight:"]",Semicolon:";",Quote:"'",Comma:",",Period:".",Slash:"/",Backslash:"\\",ArrowUp:"↑",ArrowDown:"↓",ArrowLeft:"←",ArrowRight:"→",CapsLock:"Caps Lock"};function ns(a){return a?Er[a]?Er[a]:a.startsWith("Key")?a.slice(3):a.startsWith("Digit")?a.slice(5):a.startsWith("Numpad")?"Num "+a.slice(6):a:""}function fo(a){return a?{Up:"D-pad ↑",Down:"D-pad ↓",Left:"D-pad ←",Right:"D-pad →",Back:"View",Start:"Menu"}[a]??a:""}const Lr=10,z0=7,jo=.2,S0=new Set(["Tab","Enter","NumpadEnter","Space","ArrowUp","ArrowDown","ArrowLeft","ArrowRight"]);class T0{canvas;keys=new Set;pressed=new Set;mouse={x:0,y:0,nx:0,ny:0,inside:!1,left:!1,right:!1};clicks=[];wheel=0;dragX=0;dragY=0;any=!1;down=null;stick={x:0,y:0};acting=!1;pinch=1;touches=new Map;padConnected=!1;padHeld=new Set;padPressed=new Set;padLeft={x:0,y:0};padRight={x:0,y:0};lastDevice="mouse";keyBindings;padBindings;capture=null;constructor(e,t,s){this.canvas=e,this.keyBindings=t,this.padBindings=s;const o=l=>l.target instanceof HTMLElement&&/INPUT|TEXTAREA|SELECT/.test(l.target.tagName)&&l.target.type!=="range"&&l.target.type!=="checkbox",n=l=>{if(!S0.has(l.code))return!1;const c=document.activeElement;return!!c&&c!==document.body&&c!==e&&!!c.closest("#ui, #app")};addEventListener("keydown",l=>{if(this.capture){l.preventDefault();const c=this.capture;this.capture=null,c(l.code,"key");return}o(l)||l.metaKey||l.ctrlKey||n(l)||(this.keys.has(l.code)||this.pressed.add(l.code),this.keys.add(l.code),this.any=!0,this.lastDevice="mouse",/^(Space|Tab|Arrow|Digit|Key|Alt)/.test(l.code)&&l.preventDefault())}),addEventListener("keyup",l=>this.keys.delete(l.code)),addEventListener("blur",()=>this.release());const r=l=>{const c=e.getBoundingClientRect(),d=this.mouse;d.x=l.clientX-c.left,d.y=l.clientY-c.top,d.nx=d.x/c.width*2-1,d.ny=1-d.y/c.height*2};e.addEventListener("pointerdown",l=>{if(this.capture&&l.pointerType!=="touch"){const c=this.capture;this.capture=null,c("Mouse"+l.button,"key");return}r(l);try{e.setPointerCapture(l.pointerId)}catch{}if(this.any=!0,l.pointerType==="touch"){if(this.lastDevice="touch",this.mouse.inside=!1,this.touches.set(l.pointerId,{x:l.clientX,y:l.clientY,moved:0,multi:!1}),this.touches.size>1)for(const c of this.touches.values())c.multi=!0;return}this.lastDevice="mouse",this.down={x:l.clientX,y:l.clientY,button:l.button,moved:0,lx:l.clientX,ly:l.clientY},l.button===0?this.mouse.left=!0:this.mouse.right=!0}),e.addEventListener("pointermove",l=>{if(l.pointerType==="touch"){const d=this.touches.get(l.pointerId);if(!d)return;if(this.touches.size===1)d.moved+=Math.abs(l.clientX-d.x)+Math.abs(l.clientY-d.y),d.moved>Lr&&(this.dragX+=l.clientX-d.x,this.dragY+=l.clientY-d.y);else if(this.touches.size===2){let p=null;for(const[f,u]of this.touches)f!==l.pointerId&&(p=u);if(p){const f=Math.hypot(d.x-p.x,d.y-p.y),u=Math.hypot(l.clientX-p.x,l.clientY-p.y);f>24&&u>24&&(this.pinch*=f/u)}}d.x=l.clientX,d.y=l.clientY;return}r(l),this.mouse.inside=!0;const c=this.down;c&&(c.moved+=Math.abs(l.clientX-c.lx)+Math.abs(l.clientY-c.ly),c.button!==0&&(this.dragX+=l.clientX-c.lx,this.dragY+=l.clientY-c.ly),c.lx=l.clientX,c.ly=l.clientY)});const i=l=>{if(l.pointerType==="touch"){const d=this.touches.get(l.pointerId);this.touches.delete(l.pointerId),d&&!d.multi&&d.moved<=Lr&&l.type==="pointerup"&&(r(l),this.clicks.push({x:this.mouse.x,y:this.mouse.y,nx:this.mouse.nx,ny:this.mouse.ny,button:0,touch:!0}));return}r(l);const c=this.down;c&&c.moved<z0&&(this.clicks.push({x:this.mouse.x,y:this.mouse.y,nx:this.mouse.nx,ny:this.mouse.ny,button:c.button}),c.button!==0&&this.pressed.add("Mouse"+c.button)),this.down=null,this.mouse.left=this.mouse.right=!1};e.addEventListener("pointerup",i),e.addEventListener("pointercancel",i),e.addEventListener("pointerleave",()=>this.mouse.inside=!1),e.addEventListener("contextmenu",l=>l.preventDefault()),e.addEventListener("wheel",l=>{this.wheel+=Math.sign(l.deltaY),l.preventDefault()},{passive:!1}),addEventListener("gamepadconnected",()=>{this.padConnected=!0}),addEventListener("gamepaddisconnected",()=>{this.padConnected=!!navigator.getGamepads?.().some(Boolean)})}release(){this.keys.clear(),this.touches.clear(),this.mouse.left=this.mouse.right=!1,this.down=null,this.stick.x=this.stick.y=0,this.acting=!1}captureNext(e){this.capture=e}get capturing(){return!!this.capture}held(e){return this.keys.has(e)}steering(){return this.mouse.left&&!!this.down&&this.down.button===0}actionHeld(e){const[t,s]=this.keyBindings[e];if(t&&this.keys.has(t)||s&&this.keys.has(s))return!0;const o=this.padBindings[e];return!!o&&this.padHeld.has(o)}actionHit(e){const[t,s]=this.keyBindings[e];if(t&&this.pressed.has(t)||s&&this.pressed.has(s))return!0;const o=this.padBindings[e];return!!o&&this.padPressed.has(o)}mouseButtonOf(e){for(const t of this.keyBindings[e])if(t&&t.startsWith("Mouse"))return+t.slice(5);return-1}poll(){const e=navigator.getGamepads?navigator.getGamepads():[];let t=null;for(const o of e)if(o&&o.connected&&o.mapping==="standard"){t=o;break}if(!t){for(const o of e)if(o&&o.connected){t=o;break}}if(this.padPressed.clear(),!t){this.padHeld.clear(),this.padLeft.x=this.padLeft.y=this.padRight.x=this.padRight.y=0;return}this.padConnected=!0;for(let o=0;o<Ar.length;o++){const n=t.buttons[o],r=Ar[o],i=!!n&&(n.pressed||n.value>.5);if(i&&!this.padHeld.has(r)&&(this.padPressed.add(r),this.any=!0,this.lastDevice="pad",this.capture)){const l=this.capture;this.capture=null,l(r,"pad"),this.padPressed.delete(r)}i?this.padHeld.add(r):this.padHeld.delete(r)}const s=(o,n,r)=>{const i=Math.hypot(n,r);if(i<jo){o.x=o.y=0;return}const l=Math.min(1,(i-jo)/(1-jo))/i;o.x=n*l,o.y=-r*l,this.lastDevice="pad"};s(this.padLeft,t.axes[0]??0,t.axes[1]??0),s(this.padRight,t.axes[2]??0,t.axes[3]??0)}rumble(e,t){const s=navigator.getGamepads?navigator.getGamepads():[];for(const o of s){const n=o?.vibrationActuator;n?.playEffect&&n.playEffect("dual-rumble",{duration:t,strongMagnitude:e,weakMagnitude:e*.6}).catch(()=>{})}}endFrame(){this.pressed.clear(),this.clicks.length=0,this.wheel=0,this.dragX=0,this.dragY=0,this.pinch=1,this.any=!1}}class ps{s;constructor(e){this.s=e>>>0||2654435769}static hash(e,t=0){let s=(2166136261^t)>>>0;for(let o=0;o<e.length;o++)s^=e.charCodeAt(o),s=Math.imul(s,16777619)>>>0;return s>>>0}next(){this.s=this.s+1831565813>>>0;let e=this.s;return e=Math.imul(e^e>>>15,e|1),e^=e+Math.imul(e^e>>>7,e|61),((e^e>>>14)>>>0)/4294967296}range(e,t){return e+(t-e)*this.next()}int(e,t){return e+Math.floor(this.next()*(t-e+1))}chance(e){return this.next()<e}angle(){return this.next()*Math.PI*2}pick(e){return e[Math.floor(this.next()*e.length)]}weighted(e){let t=0;for(const o of e)t+=Math.max(0,o[1]);let s=this.next()*t;for(const o of e)if(s-=Math.max(0,o[1]),s<0)return o[0];return e[e.length-1][0]}shuffle(e){for(let t=e.length-1;t>0;t--){const s=Math.floor(this.next()*(t+1));[e[t],e[s]]=[e[s],e[t]]}return e}uid(e=""){const t=Math.floor(this.next()*4294967295).toString(36),s=Math.floor(this.next()*4294967295).toString(36);return e+t+s}}const Uo={version:1,autoPickup:!0,pauseOnMenu:!0,confirmValuable:!0,damageNumbers:"all",damageNumberScale:1,enemyBars:"combat",lootLabels:"magic",aimAssist:.6,uiScale:1,textScale:1,font:"hand",highContrast:!1,colorVision:"none",dangerColor:"mustard",telegraphScale:1,hudOpacity:1,reducedMotion:"system",screenShake:1,hitStop:!0,flashes:!0,steadyLines:!1,smoothFigures:!1,captions:!1,threatIndicators:!0,monoAudio:!1,gameSpeed:1,toastSeconds:1,volMaster:.9,volMusic:.7,volSfx:1,volAmbience:.8,volUi:.8,muteUnfocused:!0,keys:Gn,pad:Yn,camSensitivity:1,invertCamX:!1,invertCamY:!1,vibration:!0,autoAttack:!0,quality:"auto",fpsCap:0,showFps:!1},pl="brushwild.settings.v1";function C0(a=globalThis.localStorage??null){let e={};try{e=JSON.parse(a?.getItem(pl)??"{}")??{}}catch{e={}}const t={...Uo};for(const s of Object.keys(Uo)){const o=e[s];o!==void 0&&typeof o==typeof Uo[s]&&(t[s]=o)}return t.keys={...Gn,...e.keys??{}},t.pad={...Yn,...e.pad??{}},t}function P0(a,e=globalThis.localStorage??null){try{e?.setItem(pl,JSON.stringify(a))}catch{}}function ml(a){return a.reducedMotion==="on"?!0:a.reducedMotion==="off"?!1:typeof matchMedia=="function"&&matchMedia("(prefers-reduced-motion: reduce)").matches}const ya={none:{common:"#7a5f48",magic:"#3f64b3",rare:"#b8860b",legendary:"#c8561a",unique:"#8a5a2b"},protanopia:{common:"#7a5f48",magic:"#2f6fd1",rare:"#b89b0b",legendary:"#e07b00",unique:"#6b5aa8"},deuteranopia:{common:"#7a5f48",magic:"#2f6fd1",rare:"#c2a10f",legendary:"#d26a00",unique:"#7a52b0"},tritanopia:{common:"#7a5f48",magic:"#0f7f8a",rare:"#c2185b",legendary:"#d84315",unique:"#5d4037"}},gl={mustard:[226/255,176/255,52/255],magenta:[.86,.2,.62],white:[.97,.96,.92]},ht=(a,e)=>Math.atan2(-a,e),Wo=a=>[-Math.sin(a),Math.cos(a)],qr=a=>a.map(e=>e.map(t=>t/255));let Ko=1;const A0=()=>(Ko=Ko*16807%2147483647,Ko/2147483647);function ms(a,e){return{id:0,kind:a,archetype:e,x:0,y:0,z:0,yaw:0,scale:1,grow:1,radius:.4,height:1.4,move:0,walk:0,action:0,actionT:0,actionDur:.4,flash:0,shade:1,seed:A0(),colors:[[1,1,1],[1,1,1],[1,1,1]],extra:0,lift:0,ghost:!1,hover:!1,dead:!1,gone:!1,name:"",level:1}}class E0{list=[];byId=new Map;nextId=1;add(e){return e.id=this.nextId++,this.list.push(e),this.byId.set(e.id,e),e}sweep(){const e=this.list;let t=0;for(let s=0;s<e.length;s++){const o=e[s];o.gone?this.byId.delete(o.id):e[t++]=o}e.length=t}clear(e){for(const t of this.list)e(t)||(t.gone=!0);this.sweep()}nearest(e,t,s,o,n){let r=null,i=o;for(const l of this.list){if(l.kind!==e||l.dead)continue;const c=l;if(n&&!n(c))continue;const d=Math.hypot(l.x-t,l.z-s);d<i&&(i=d,r=c)}return r}}function L0(){return{hour:12,night:0,gold:0,cloud:.36,wind:[.8,.45],keyDir:[.4,.8,.3],sunDir:[.4,.8,.3],moonDir:[-.4,.6,-.3],rockCol:[.59,.56,.52]}}function q0(a,e,t){a.hour=e;const s=(e-5.5)/15,o=s*Math.PI,n=s>=0&&s<=1;a.sunDir=Ve.norm([Math.cos(o)*.9,n?Math.sin(o)*1.05:-.3,n?.42*Math.cos(o*.5)+.2:.4]);const r=n?a.sunDir[1]:-.3,i=(e+24-20.5)%24/9;a.moonDir=Ve.norm([-Math.cos(i*Math.PI)*.8,Math.max(.08,Math.sin(i*Math.PI))*.9+.2,-.45]),a.night=1-j(-.08,.12,r),a.gold=(1-j(.1,.5,r))*(1-a.night);const l=a.night>.5?a.moonDir:a.sunDir;return a.keyDir=Ve.norm([l[0],Math.max(l[1],.34),l[2]]),a.rockCol=t,a}const Go=900,Ae=(a,e,t)=>[a/255,e/255,t/255],oe={GOLD:Ae(244,190,62),WHITE:Ae(232,226,212),DUST:Ae(226,188,130),SKY:Ae(136,180,216),LEAFY:Ae(116,168,90),RED:Ae(214,70,52),FLAME:Ae(240,158,74),FROST:Ae(150,196,226),INK:Ae(74,77,94),POISON:Ae(132,170,80)},{GOLD:mt,WHITE:Se,DUST:ao,SKY:ct,LEAFY:yn,RED:bn,FLAME:xn,FROST:R0,INK:po,POISON:$0}=oe,ee={CYAN:Ae(92,226,255),MAGENTA:Ae(236,96,214),VOID:Ae(150,104,255),WHITE:Ae(244,250,255)},{CYAN:je,MAGENTA:oa,VOID:Sa}=ee,Rr={rally:mt,laststand:bn,bloodrage:bn,haste:Se,hawkeye:ct,unstoppable:mt,thorns:ao,overflow:ct,ambush:po,poised:Se,mending:yn},Xe={physical:Se,fire:xn,frost:R0,storm:mt,poison:$0,shadow:po},H0=a=>[parseInt(a.slice(1,3),16)/255,parseInt(a.slice(3,5),16)/255,parseInt(a.slice(5,7),16)/255];class D0{data=new Float32Array(Go*os);count=0;pool=[];live=[];lights=[];ambientTimer=0;auraTimer=0;barrierMark=null;T;game;constructor(e){this.game=e;const t=["mote","leaf","spark","burst","slash","ring","orb","puff","heal","mark","click","beam","zone","lane","cloud","ripple","streak","laser","arc","sigil","vortex","hex","bit","shock"];this.T=Object.fromEntries(t.map(s=>[s,c0(s)])),this.wire()}get danger(){return gl[this.game.settings.dangerColor]}rarityPencil(e){return H0(ya[this.game.settings.colorVision][e])}spawn(e,t,s,o,n={}){if(this.live.length>=Go)return null;const r=this.pool.pop()??{};return r.type=this.T[e],r.x=t,r.y=s,r.z=o,r.vx=n.vx??0,r.vy=n.vy??0,r.vz=n.vz??0,r.size=n.size??.3,r.grow=n.grow??0,r.life=0,r.max=n.life??.5,r.color=n.color??Se,r.alpha=n.alpha??1,r.gravity=n.gravity??0,r.drag=n.drag??0,r.rot=n.rot??0,r.spin=n.spin??0,r.ground=n.axial?2:n.ground?1:0,r.aspect=n.aspect??1,r.tilt=n.tilt??0,r.follow=n.follow??null,r.dy=n.dy??0,r.hold=n.hold??!1,r.seed=Math.random(),r.sway=n.sway??0,this.live.push(r),r}release(e){e&&(e.hold=!1,e.life=Math.max(e.life,.6))}light(e,t,s,o,n=.25){this.lights.push({x:e,y:t,z:s,r:o,life:n,max:n})}update(e){const t=this.live;let s=0;for(let n=0;n<t.length;n++){const r=t[n];if(r.hold||(r.life+=e/r.max),r.life>=1||r.follow&&r.follow.gone){this.pool.push(r);continue}if(r.follow)r.x=r.follow.x,r.y=r.follow.y+r.dy,r.z=r.follow.z;else{if(r.vy-=r.gravity*e,r.drag){const i=Math.exp(-r.drag*e);r.vx*=i,r.vy*=i,r.vz*=i}r.x+=(r.vx+Math.sin(r.life*9+r.seed*30)*r.sway)*e,r.y+=r.vy*e,r.z+=r.vz*e}r.size+=r.grow*e,r.rot+=r.spin*e,t[s++]=r}t.length=s;let o=0;for(const n of this.lights)n.life-=e,n.life>0&&(this.lights[o++]=n);this.lights.length=o,this.ambient(e),this.hero(e)}hero(e){const t=this.game,s=t.player;if(s){if(s.barrier>0&&!s.dead?this.barrierMark||(this.barrierMark=this.spawn("mark",s.x,s.y+.1,s.z,{size:1.45,color:ct,ground:!0,hold:!0,follow:s,dy:.1,alpha:1.2})):this.barrierMark&&(this.release(this.barrierMark),this.barrierMark=null),(this.auraTimer-=e)<=0&&!s.dead){this.auraTimer=.75;const o=s.statuses.find(n=>Rr[n.id]);o&&this.spawn("ring",s.x,s.y+.08,s.z,{size:1.35,life:.6,color:Rr[o.id],ground:!0,alpha:.9})}if(!s.dead&&s.statuses.some(o=>o.id==="brand")&&Math.random()<e*16){const[o,n]=[-Math.sin(s.yaw),Math.cos(s.yaw)];this.spawn("spark",s.x+o*.35+n*.25,s.y+.9+Math.random()*.5,s.z+n*.35-o*.25,{size:.15,life:.45,color:xn,vy:1.4,drag:1})}if(s.dash){const o=t.skills.heading(s.x-s.dash.x,s.y+.9,s.z-s.dash.z,s.x,s.y+.9,s.z);this.spawn("streak",s.x-s.dash.x*.5,s.y+.75,s.z-s.dash.z*.5,{size:.75,life:.16,color:Se,alpha:.85,rot:o}),this.spawn("streak",s.x-s.dash.x*.6,s.y+.35,s.z-s.dash.z*.6,{size:.55,life:.14,color:Se,alpha:.7,rot:o})}}}clear(){for(const e of this.live)this.pool.push(e);this.live.length=0,this.lights.length=0,this.barrierMark=null}write(){const e=this.data,t=this.live;for(let s=0;s<t.length;s++){const o=t[s],n=s*os;e[n]=o.x,e[n+1]=o.y,e[n+2]=o.z,e[n+3]=o.size,e[n+4]=o.type,e[n+5]=o.life,e[n+6]=o.seed,e[n+7]=o.rot,e[n+8]=o.color[0],e[n+9]=o.color[1],e[n+10]=o.color[2],e[n+11]=o.alpha,e[n+12]=o.ground,e[n+13]=o.aspect,e[n+14]=o.hold?0:o.max,e[n+15]=o.tilt}this.count=t.length}hit(e,t,s,o=Se,n=!1){this.spawn("burst",e,t,s,{size:n?1.1:.7,life:.22,color:o,rot:Math.random()*6});const r=n?9:5;for(let i=0;i<r;i++){const l=Math.random()*6.283,c=2.5+Math.random()*3.5;this.spawn("spark",e,t,s,{size:.16+Math.random()*.14,life:.25+Math.random()*.2,color:o,vx:Math.cos(l)*c,vy:1+Math.random()*3,vz:Math.sin(l)*c,gravity:9,drag:2,rot:l})}this.light(e,t,s,n?5:3.5,.14)}slash(e,t,s=Se){this.spawn("slash",e.x,e.y+.8*e.scale,e.z,{size:t,life:.3,color:s,ground:!0,rot:-e.yaw})}dust(e,t,s,o=2,n=ao){for(let r=0;r<o;r++)this.spawn("puff",e+(Math.random()-.5)*.3,t+.1,s+(Math.random()-.5)*.3,{size:.14+Math.random()*.1,grow:.5,life:.45,color:n,alpha:.55,vx:(Math.random()-.5)*.6,vy:.5+Math.random()*.4,vz:(Math.random()-.5)*.6,drag:2})}poof(e,t=Se){for(let s=0;s<9;s++){const o=Math.random()*6.283,n=1+Math.random()*1.6;this.spawn("puff",e.x,e.y+e.height*.4,e.z,{size:.3+Math.random()*.25,grow:.8,life:.55,color:t,alpha:.85,vx:Math.cos(o)*n,vy:.6+Math.random()*1.6,vz:Math.sin(o)*n,drag:2.5})}this.spawn("ring",e.x,e.y+.08,e.z,{size:1.5,life:.4,color:t,ground:!0})}levelUp(e){this.spawn("beam",e.x,e.y+2.4,e.z,{size:.42,aspect:5.5,life:1,color:mt,alpha:1.3,follow:e,dy:2.4});for(let t=0;t<3;t++)setTimeout(()=>this.spawn("ring",e.x,e.y+.08,e.z,{size:2.6,life:.7,color:mt,ground:!0}),t*160);for(let t=0;t<26;t++){const s=Math.random()*6.283,o=.3+Math.random()*.8;this.spawn("spark",e.x+Math.cos(s)*o,e.y+Math.random()*.5,e.z+Math.sin(s)*o,{size:.2,life:.8+Math.random()*.7,color:mt,vy:1.5+Math.random()*2.5,drag:.6})}this.light(e.x,e.y+1.5,e.z,9,.9)}heal(e,t=yn){for(let s=0;s<7;s++)this.spawn("heal",e.x+(Math.random()-.5)*.9,e.y+.3+Math.random()*.8,e.z+(Math.random()-.5)*.9,{size:.16,life:.8+Math.random()*.4,color:t,vy:.9+Math.random()*.6});this.spawn("ring",e.x,e.y+.08,e.z,{size:1.6,life:.5,color:t,ground:!0})}sparkle(e,t,s,o=mt,n=6){for(let r=0;r<n;r++){const i=Math.random()*6.283;this.spawn("spark",e,t,s,{size:.14+Math.random()*.1,life:.4+Math.random()*.3,color:o,vx:Math.cos(i)*1.4,vy:1.5+Math.random()*1.5,vz:Math.sin(i)*1.4,gravity:3,drag:1.5})}}click(e,t,s){this.spawn("click",e,t+.1,s,{size:.75,life:.5,color:Se,ground:!0})}splash(e,t){this.spawn("ripple",e,.04,t,{size:.9,life:.7,color:ct,alpha:1,ground:!0})}blast(e,t,s,o,n,r=!1){const i=Xe[n];this.spawn("ring",e,t+.08,s,{size:o,life:.42,color:i,ground:!0}),this.spawn("burst",e,t+.6,s,{size:Math.min(2.2,.6+o*.35),life:.26,color:i,rot:Math.random()*6});const l=Math.round(6+o*3);for(let c=0;c<l;c++){const d=Math.random()*6.283,p=1.5+Math.random()*o*1.2;n==="fire"?this.spawn("spark",e,t+.3,s,{size:.2,life:.5,color:xn,vx:Math.cos(d)*p,vy:2+Math.random()*3,vz:Math.sin(d)*p,gravity:6,drag:1.5}):n==="frost"?this.spawn("mote",e+Math.cos(d)*o*.6,t+.3,s+Math.sin(d)*o*.6,{size:.08,life:.9,color:Se,vy:1.4+Math.random(),sway:.6}):this.spawn("puff",e+Math.cos(d)*o*.4,t+.1,s+Math.sin(d)*o*.4,{size:.25,grow:.7,life:.5,color:n==="physical"?ao:i,alpha:.7,vx:Math.cos(d)*p*.6,vy:.8,vz:Math.sin(d)*p*.6,drag:2})}n==="storm"&&this.spawn("beam",e,t+2.5,s,{size:.35,aspect:6,life:.35,color:mt}),this.light(e,t+1,s,Math.max(4,o*1.6),.25),r&&this.game.shake(.35)}chain(e,t,s,o,n,r,i){const l=Xe[i],c=Math.max(3,Math.round(Math.hypot(o-e,r-s)*1.4));for(let d=0;d<=c;d++){const p=d/c,f=(Math.random()-.5)*.35;this.spawn("spark",e+(o-e)*p+f,t+(n-t)*p+Math.abs(f),s+(r-s)*p-f,{size:.18,life:.22,color:l,rot:Math.random()*6})}this.spawn("burst",o,n,r,{size:.6,life:.2,color:l,rot:Math.random()*6}),this.light(o,n,r,4,.12)}nova(e,t,s,o,n){this.spawn("ring",e,t+.08,s,{size:o,life:.45,color:n,ground:!0}),this.spawn("ring",e,t+.08,s,{size:o*.7,life:.35,color:n,ground:!0});for(let r=0;r<14;r++){const i=r/14*6.283;this.spawn("spark",e,t+.5,s,{size:.16,life:.35,color:n,vx:Math.cos(i)*o*2.4,vy:.4,vz:Math.sin(i)*o*2.4,drag:3})}}lootBeam(e,t){const s=t==="unique"||t==="legendary";return this.spawn("beam",e.x,e.y+(s?2.6:1.4),e.z,{size:s?.36:.22,aspect:s?6.5:3.5,life:1,color:this.rarityPencil(t),hold:!0,follow:e,dy:s?2.6:1.4,alpha:1.2})}laser(e,t,s,o,n,r,i=je,l=.3,c=.3,d="laser"){const p=o-e,f=n-t,u=r-s,m=Math.max(Math.hypot(p,f,u),.001);return this.spawn(d,e+p/2,t+f/2,s+u/2,{size:l,aspect:m/2/l,rot:Math.atan2(p,u),tilt:Math.asin(Math.max(-1,Math.min(1,f/m))),axial:!0,life:c,color:i})}muzzleOf(e){const t=Math.cos(e.yaw),s=Math.sin(e.yaw),o=e.scale;return[e.x+(t*.15-s*.6)*o,e.y+.9*o,e.z+(s*.15+t*.6)*o]}dronePos(e,t,s){const o=this.game.time,n=o*2.2+e/t*Math.PI*2;return[s.x+Math.cos(n)*1.2,s.y+1.9+.14*Math.sin(o*5+e*1.7),s.z+Math.sin(n)*1.2]}bits(e,t,s,o,n=je,r=4){for(let i=0;i<o;i++){const l=Math.random()*6.283,c=r*(.4+Math.random()*.8);this.spawn("bit",e,t,s,{size:.07+Math.random()*.08,life:.35+Math.random()*.45,color:Math.random()<.25?oa:n,vx:Math.cos(l)*c,vy:1+Math.random()*r*.6,vz:Math.sin(l)*c,gravity:5,drag:1.6})}}muzzle(e,t=je,s=!1){const o=this.muzzleOf(e);return this.spawn("burst",o[0],o[1],o[2],{size:s?.75:.45,life:.16,color:t,rot:Math.random()*6}),this.spawn("ring",o[0],o[1],o[2],{size:s?.6:.35,life:.18,color:t,alpha:.9}),this.bits(o[0],o[1],o[2],s?6:3,t,3),this.light(o[0],o[1],o[2],s?7:4.5,.12),o}shock(e,t,s,o,n=je,r=.45){this.spawn("shock",e,t+.09,s,{size:o,life:r,color:n,ground:!0,rot:Math.random()*6})}pillar(e,t,s,o,n=je,r=!1){const i=Math.max(.35,o*(r?.42:.3));if(this.laser(e,t+(r?26:16),s,e,t-.2,s,n,i,r?.9:.42),this.laser(e,t+(r?26:16),s,e,t-.2,s,ee.WHITE,i*.45,r?.75:.32),this.shock(e,t,s,o*1.15,n,r?.8:.45),r){for(let l=1;l<4;l++)setTimeout(()=>this.shock(e,t,s,o*(1+l*.35),l%2?oa:n,.7),l*140);this.spawn("burst",e,t+1.2,s,{size:o*.5,life:.4,color:n,rot:Math.random()*6}),this.spawn("sigil",e,t+.1,s,{size:o*1.05,life:1.2,color:n,ground:!0})}this.bits(e,t+.4,s,r?40:10,n,r?9:5);for(let l=0;l<(r?24:8);l++){const c=Math.random()*6.283,d=(r?8:4)*(.5+Math.random());this.spawn("spark",e,t+.3,s,{size:.2,life:.5,color:n,vx:Math.cos(c)*d,vy:2+Math.random()*4,vz:Math.sin(c)*d,gravity:8,drag:1.2})}this.light(e,t+2,s,r?22:8,r?.9:.3),this.game.shake(r?1:.35),r&&this.game.rumble(1,400)}glitch(e,t,s,o){this.spawn("sigil",e,t+.1,s,{size:o,life:.9,color:oa,ground:!0}),this.shock(e,t,s,o,oa,.55),setTimeout(()=>this.shock(e,t,s,o*.7,je,.45),90);for(let n=0;n<30;n++){const r=Math.random()*6.283,i=o*Math.sqrt(Math.random());this.spawn("bit",e+Math.cos(r)*i,t+.3+Math.random()*2.2,s+Math.sin(r)*i,{size:.08+Math.random()*.14,life:.5+Math.random()*.6,color:Math.random()<.5?oa:je,vy:.6,sway:1.5})}this.light(e,t+1,s,o*1.6,.35)}hexShield(e,t){this.spawn("hex",e.x,e.y+.95*e.scale,e.z,{size:1.3*e.scale,life:t,color:je,follow:e,dy:.95*e.scale,alpha:.9}),this.shock(e.x,e.y,e.z,2.2,je,.4),this.bits(e.x,e.y+1,e.z,12,je,4)}vortex(e,t,s,o,n){return this.spawn("sigil",e,t+.1,s,{size:o*1.08,life:n,color:Sa,ground:!0}),this.spawn("vortex",e,t+.12,s,{size:o,life:n,color:Sa,ground:!0})}suck(e,t,s,o){for(let n=0;n<4;n++){const r=Math.random()*6.283,i=o*(.6+Math.random()*.4),l=.3+Math.random()*1.6;this.spawn(Math.random()<.5?"bit":"spark",e+Math.cos(r)*i,t+l,s+Math.sin(r)*i,{size:.1+Math.random()*.08,life:.45,color:Math.random()<.6?Sa:oa,vx:-Math.cos(r)*i*2.1,vy:-l*1.4,vz:-Math.sin(r)*i*2.1})}}implode(e,t,s,o){this.spawn("burst",e,t+1,s,{size:Math.min(3.5,o*.45),life:.35,color:Sa,rot:Math.random()*6}),this.pillar(e,t,s,o*.6,Sa,!1),this.shock(e,t,s,o*1.3,oa,.6),this.bits(e,t+1,s,26,Sa,8),this.game.shake(.7)}overclock(e,t){this.spawn("sigil",e.x,e.y+.1,e.z,{size:1.7,life:t,color:je,ground:!0,follow:e,dy:.1}),this.shock(e.x,e.y,e.z,3.4,je,.5);for(let s=0;s<6;s++){const o=s/6*6.283;this.laser(e.x+Math.cos(o)*1.4,e.y+.2,e.z+Math.sin(o)*1.4,e.x+Math.cos(o)*.3,e.y+2.6,e.z+Math.sin(o)*.3,je,.16,.35,"arc")}this.bits(e.x,e.y+1,e.z,16,je,5),this.light(e.x,e.y+1.5,e.z,9,.5)}ambient(e){const t=this.game,s=t.player;if(this.ambientTimer-=e,this.ambientTimer>0||this.live.length>Go-120||!s)return;this.ambientTimer=.09;const o=t.world!==t.overworld,n=o?"dust":t.env.night>.6?"fireflies":t.biome.particles,r=Math.random()*6.283,i=3+Math.random()*22,l=s.x+Math.cos(r)*i,c=s.z+Math.sin(r)*i,d=t.world.surface(l,c),[p,f]=t.env.wind;if(n==="fireflies")this.spawn("mote",l,d+.4+Math.random()*1.6,c,{size:.09,life:3+Math.random()*2,color:Se,alpha:1,vx:(Math.random()-.5)*.5,vz:(Math.random()-.5)*.5,sway:.5});else if(n==="petals"||n==="leaves"){const u=n==="petals"?Ae(232,150,150):Math.random()<.5?Ae(232,164,48):Ae(224,92,70);this.spawn("leaf",l,d+3+Math.random()*3,c,{size:.09,life:5,color:u,vx:p*.9,vy:-.75,vz:f*.9,sway:.7,rot:Math.random()*6,spin:1.5})}else n==="snow"?this.spawn("mote",l,d+2+Math.random()*5,c,{size:.06,life:5,color:Se,alpha:1,vx:p*.6,vy:-.9,vz:f*.6,sway:.4}):Math.random()<.6&&this.spawn("mote",l,d+.3+Math.random()*2.2,c,{size:.045,life:4,color:ao,alpha:.7,vx:p*(o?.05:.35),vy:.08,vz:f*(o?.05:.35),sway:.3})}wire(){const e=this.game.bus;e.on("damage",t=>{if(t.dot)return;const s=t.target,o=s.kind==="player"?bn:t.crit?mt:Xe[t.element]??Se;this.hit(s.x,s.y+s.height*.5,s.z,o,t.crit)}),e.on("swing",t=>this.slash(t.entity,t.radius,t.color??Se)),e.on("cast",t=>{if(t.behavior==="melee"||t.behavior==="dash"||t.behavior==="leap")return;const s=this.game.player,o=Xe[t.element]??Se,n=-Math.sin(s.yaw),r=Math.cos(s.yaw),i=s.x+n*.45,l=s.y+1.35,c=s.z+r*.45;this.spawn("burst",i,l,c,{size:.42,life:.18,color:o,rot:Math.random()*6});for(let d=0;d<5;d++){const p=Math.random()*6.283;this.spawn("spark",i,l,c,{size:.12,life:.3,color:o,vx:Math.cos(p)*1.6+n*1.5,vy:.8+Math.random(),vz:Math.sin(p)*1.6+r*1.5,drag:3})}this.light(i,l,c,3.5,.12)}),e.on("monster:died",t=>this.poof(t,[t.colors[0][0],t.colors[0][1],t.colors[0][2]])),e.on("levelup",()=>this.levelUp(this.game.player)),e.on("heal",t=>this.heal(t.entity,t.focus?ct:void 0)),e.on("pickup",t=>this.sparkle(t.x,t.y+.4,t.z,t.rare?ct:mt,t.rare?12:5)),e.on("step",t=>{t.water?this.splash(t.entity.x,t.entity.z):t.entity.kind==="player"&&this.dust(t.entity.x,t.entity.y,t.entity.z,1)}),e.on("moveclick",t=>this.click(t.x,t.y,t.z)),e.on("attune",t=>{this.heal(this.game.player,ct),this.spawn("beam",t.x,t.y+3,t.z,{size:.5,aspect:6,life:1.2,color:ct})}),e.on("dash",t=>{this.dust(t.x,t.y,t.z,5,yn),this.spawn("ring",t.x,t.y+.08,t.z,{size:1.4,life:.35,color:Se,ground:!0})}),e.on("evade",t=>{this.dust(t.x,t.y,t.z,4)}),e.on("bolt:hit",t=>{this.hit(t.x,t.y,t.z,Xe[t.element],!!t.big),t.big&&this.spawn("ring",t.x,t.y,t.z,{size:1.6,life:.35,color:Xe[t.element]})}),e.on("blast",t=>this.blast(t.x,t.y,t.z,t.r,t.element,t.heavy)),e.on("chain",t=>this.chain(t.from.x,t.from.y,t.from.z,t.to.x,t.to.y,t.to.z,t.element)),e.on("telegraph",t=>{const s=t.color??this.danger;t.lane?this.spawn("lane",t.x,t.y+.1,t.z,{size:t.w/2,aspect:t.len/t.w,rot:Math.atan2(t.dirx,t.dirz),life:t.t,color:s,ground:!0}):this.spawn(t.fill?"zone":"ring",t.x,t.y+.08,t.z,{size:t.r,life:t.t,color:s,alpha:1,ground:!0})}),e.on("hazard:cloud",t=>this.spawn("cloud",t.x,t.y+.12,t.z,{size:t.r,life:t.life,color:t.color??this.danger,ground:!0})),e.on("slam",t=>{this.spawn("ring",t.x,t.y+.08,t.z,{size:t.r,life:.4,color:t.color??Se,ground:!0}),this.dust(t.x,t.y,t.z,t.heavy?9:4),t.heavy&&this.game.shake(.45)}),e.on("shot:hit",t=>{this.hit(t.x,t.y,t.z,this.danger,!1)}),e.on("found",t=>{t.x!==void 0&&this.sparkle(t.x,(t.y??0)+.6,t.z,mt,10)}),e.on("boon",t=>this.heal(t.entity,ct)),e.on("travel:arrive",t=>{this.spawn("ring",t.x,t.y+.08,t.z,{size:2.2,life:.6,color:ct,ground:!0}),this.sparkle(t.x,t.y+1,t.z,ct,8)}),e.on("charge:dust",t=>this.dust(t.x,t.y,t.z,2)),e.on("guard",t=>this.spawn("mark",t.entity.x,t.entity.y+.1,t.entity.z,{size:t.entity.radius*2.8,life:t.t,color:ct,ground:!0,follow:t.entity,dy:.1})),e.on("boss:spawn",t=>{this.spawn("ring",t.x,t.y+.08,t.z,{size:4,life:.8,color:po,ground:!0}),this.dust(t.x,t.y,t.z,12,po)})}}const w=(a,e,t,s)=>({kind:"param",skill:a,key:e,op:t,value:s}),H=(a,e,t=!1)=>({kind:"stat",stat:a,value:e,more:t}),re=(a,...e)=>({kind:"trigger",on:"cast",skill:a,actions:e}),I0=(a,e,...t)=>({kind:"trigger",on:"cast",tag:a,chance:e,actions:t}),vl=(a,...e)=>({kind:"trigger",on:"hit",skill:a,actions:e}),$r=(...a)=>({kind:"trigger",on:"kill",actions:a}),Ce=(a,e,t=0,s=1)=>({do:"status",status:a,duration:e,potency:t,stacks:s,to:"self"}),Da=a=>({do:"heal",pct:a}),Na=a=>({do:"resource",amount:a}),yl=(a,e)=>({do:"barrier",pct:a,duration:e}),Vn=[{id:"sword",name:"Sword",kind:"weapon",slot:"weapon",type:"sword",hands:1,dmg:[10,14],speed:1.25,shape:4},{id:"axe",name:"Axe",kind:"weapon",slot:"weapon",type:"axe",hands:1,dmg:[11,16],speed:1.15,shape:4,implicit:[{stat:"critDamage",value:.08}]},{id:"mace",name:"Mace",kind:"weapon",slot:"weapon",type:"mace",hands:1,dmg:[12,17],speed:1.05,shape:4,implicit:[{stat:"dmgVsCC",value:.1}]},{id:"greatsword",name:"Greatsword",kind:"weapon",slot:"weapon",type:"greatsword",hands:2,dmg:[18,26],speed:.95,shape:4},{id:"greataxe",name:"Greataxe",kind:"weapon",slot:"weapon",type:"greataxe",hands:2,dmg:[20,28],speed:.9,shape:4,implicit:[{stat:"critDamage",value:.12}]},{id:"staff",name:"Staff",kind:"weapon",slot:"weapon",type:"staff",hands:2,dmg:[15,21],speed:1,shape:5,implicit:[{stat:"resourceMax",value:10}]},{id:"wand",name:"Wand",kind:"weapon",slot:"weapon",type:"wand",hands:1,dmg:[9,13],speed:1.3,shape:5,implicit:[{stat:"critChance",value:.03}]},{id:"shortbow",name:"Bow",kind:"weapon",slot:"weapon",type:"bow",hands:2,dmg:[13,19],speed:1.1,shape:5},{id:"armcannon",name:"Arm Cannon",kind:"weapon",slot:"weapon",type:"cannon",hands:2,dmg:[120,160],speed:1.5,shape:5,special:!0,implicit:[{stat:"critChance",value:.15},{stat:"attackSpeed",value:.25}]},{id:"dagger",name:"Dagger",kind:"weapon",slot:"weapon",type:"dagger",hands:1,dmg:[8,12],speed:1.45,shape:4,implicit:[{stat:"critChance",value:.04}]},{id:"shield",name:"Shield",kind:"offhand",slot:"offhand",type:"shield",armor:10,shape:8,implicit:[{stat:"block",value:.15}]},{id:"focus",name:"Focus",kind:"offhand",slot:"offhand",type:"focus",shape:7,implicit:[{stat:"resourceRegen",value:.1},{stat:"critChance",value:.02}]},{id:"quiver",name:"Quiver",kind:"offhand",slot:"offhand",type:"quiver",shape:6,implicit:[{stat:"dmgRanged",value:.08},{stat:"attackSpeed",value:.03}]},{id:"hood",name:"Hood",kind:"armor",slot:"helm",armor:6,shape:6},{id:"jerkin",name:"Jerkin",kind:"armor",slot:"chest",armor:12,shape:6},{id:"plating",name:"Cyber Plating",kind:"armor",slot:"chest",armor:160,shape:6,special:!0,implicit:[{stat:"resistAll",value:.25},{stat:"lifePct",value:.5}]},{id:"robe",name:"Robe",kind:"armor",slot:"chest",armor:9,shape:6,implicit:[{stat:"resistAll",value:.03}]},{id:"gloves",name:"Gloves",kind:"armor",slot:"gloves",armor:5,shape:6},{id:"breeches",name:"Breeches",kind:"armor",slot:"legs",armor:8,shape:6},{id:"boots",name:"Boots",kind:"armor",slot:"boots",armor:5,shape:6,implicit:[{stat:"moveSpeed",value:.04}]},{id:"amulet",name:"Amulet",kind:"jewelry",slot:"amulet",shape:7,implicit:[{stat:"resistAll",value:.04}]},{id:"ring",name:"Ring",kind:"jewelry",slot:"ring",shape:7,implicit:[{stat:"critChance",value:.02}]}],ve=Object.fromEntries(Vn.map(a=>[a.id,a])),Hr=[[1,"Rough"],[10,"Fine"],[22,"Masterwork"],[36,"Starforged"],[55,"Inkbound"]],F0=a=>{let e=Hr[0][1];for(const[t,s]of Hr)a>=t&&(e=s);return e};function To(a){return a.slot==="ring"?["ring1","ring2"]:a.slot==="weapon"?["mainhand"]:[a.slot]}const Dr=["helm","chest","gloves","legs","boots"],I=a=>a,Co=[I({id:"might",stat:"might",range:[3,6],scale:"attr",slots:["any"],weight:10,text:"+{v} Might",adj:"Mighty",whole:!0}),I({id:"grace",stat:"grace",range:[3,6],scale:"attr",slots:["any"],weight:10,text:"+{v} Grace",adj:"Graceful",whole:!0}),I({id:"vigor",stat:"vigor",range:[3,6],scale:"attr",slots:["any"],weight:10,text:"+{v} Vigor",adj:"Hale",whole:!0}),I({id:"mind",stat:"mind",range:[3,6],scale:"attr",slots:["any"],weight:10,text:"+{v} Mind",adj:"Thoughtful",whole:!0}),I({id:"allAttrs",stat:"allAttrs",range:[2,3],scale:"attr",slots:["amulet"],weight:3,text:"+{v} to all attributes",adj:"Gifted",whole:!0}),I({id:"life",stat:"life",range:[10,20],scale:"flat",slots:["armor","jewelry","offhand"],weight:10,text:"+{v} maximum health",adj:"Stout",whole:!0}),I({id:"lifePct",stat:"lifePct",range:[.04,.08],scale:"pct",slots:["helm","chest","amulet"],weight:5,text:"+{v} maximum health",adj:"Hearty"}),I({id:"lifeRegen",stat:"lifeRegen",range:[.6,1.2],scale:"flat",slots:["armor","amulet"],weight:5,text:"+{v} health per second",adj:"Mending"}),I({id:"lifeOnHit",stat:"lifeOnHit",range:[1,3],scale:"flat",slots:["weapon","gloves","ring"],weight:5,text:"+{v} health per hit",adj:"Thirsting",whole:!0}),I({id:"lifeOnKill",stat:"lifeOnKill",range:[3,6],scale:"flat",slots:["weapon","ring"],weight:4,text:"+{v} health per kill",adj:"Feasting",whole:!0}),I({id:"armor",stat:"armor",range:[6,12],scale:"flat",slots:["armor","offhand"],weight:8,text:"+{v} armor",adj:"Studded",whole:!0}),I({id:"armorPct",stat:"armorPct",range:[.06,.12],scale:"pct",slots:["armor","offhand"],weight:5,text:"+{v} armor",adj:"Plated"}),I({id:"resistAll",stat:"resistAll",range:[.03,.06],scale:"pct",slots:["jewelry","chest","helm","legs"],weight:4,text:"+{v} resistance to all elements",adj:"Warded",group:"resist"}),I({id:"resistFire",stat:"resistFire",range:[.06,.12],scale:"pct",slots:["armor","jewelry"],weight:4,text:"+{v} fire resistance",adj:"Fireproof",group:"resist"}),I({id:"resistFrost",stat:"resistFrost",range:[.06,.12],scale:"pct",slots:["armor","jewelry"],weight:4,text:"+{v} frost resistance",adj:"Fur-lined",group:"resist"}),I({id:"resistStorm",stat:"resistStorm",range:[.06,.12],scale:"pct",slots:["armor","jewelry"],weight:4,text:"+{v} storm resistance",adj:"Grounded",group:"resist"}),I({id:"resistPoison",stat:"resistPoison",range:[.06,.12],scale:"pct",slots:["armor","jewelry"],weight:4,text:"+{v} poison resistance",adj:"Antidotal",group:"resist"}),I({id:"resistShadow",stat:"resistShadow",range:[.06,.12],scale:"pct",slots:["armor","jewelry"],weight:3,text:"+{v} shadow resistance",adj:"Lantern-lit",group:"resist"}),I({id:"dodge",stat:"dodge",range:[.02,.04],scale:"pct",slots:["boots","legs","amulet"],weight:3,text:"+{v} chance to dodge",adj:"Nimble"}),I({id:"block",stat:"block",range:[.05,.1],scale:"pct",slots:["offhand"],weight:3,text:"+{v} chance to block",adj:"Bracing",classes:["warden"]}),I({id:"thorns",stat:"thorns",range:[4,8],scale:"flat",slots:["chest","legs","offhand"],weight:3,text:"+{v} thorns",adj:"Bramble",whole:!0}),I({id:"damage",stat:"damage",range:[.05,.1],scale:"pct",slots:["weapon","amulet","ring"],weight:6,text:"+{v} damage",adj:"Fierce"}),I({id:"dmgPhysical",stat:"dmgPhysical",range:[.08,.15],scale:"pct",slots:["weapon","amulet","gloves","ring"],weight:4,text:"+{v} physical damage",adj:"Honed",classes:["warden","strider"]}),I({id:"dmgFire",stat:"dmgFire",range:[.08,.15],scale:"pct",slots:["weapon","amulet","gloves","ring"],weight:4,text:"+{v} fire damage",adj:"Smouldering",classes:["emberwright","warden"]}),I({id:"dmgFrost",stat:"dmgFrost",range:[.08,.15],scale:"pct",slots:["weapon","amulet","gloves","ring"],weight:4,text:"+{v} frost damage",adj:"Rimed",classes:["emberwright"]}),I({id:"dmgStorm",stat:"dmgStorm",range:[.08,.15],scale:"pct",slots:["weapon","amulet","gloves","ring"],weight:4,text:"+{v} storm damage",adj:"Crackling",classes:["emberwright"]}),I({id:"dmgPoison",stat:"dmgPoison",range:[.08,.15],scale:"pct",slots:["weapon","amulet","gloves","ring"],weight:4,text:"+{v} poison damage",adj:"Venomous",classes:["strider"]}),I({id:"dmgShadow",stat:"dmgShadow",range:[.08,.15],scale:"pct",slots:["weapon","amulet","gloves","ring"],weight:3,text:"+{v} shadow damage",adj:"Dusky",classes:["strider"]}),I({id:"dmgBasic",stat:"dmgBasic",range:[.1,.18],scale:"pct",slots:["weapon","gloves"],weight:3,text:"+{v} Basic skill damage",adj:"Practised"}),I({id:"dmgCore",stat:"dmgCore",range:[.1,.18],scale:"pct",slots:["weapon","amulet","gloves"],weight:3,text:"+{v} Core skill damage",adj:"Devoted"}),I({id:"dmgMastery",stat:"dmgMastery",range:[.1,.18],scale:"pct",slots:["weapon","amulet","helm"],weight:3,text:"+{v} Mastery skill damage",adj:"Masterful"}),I({id:"dmgDot",stat:"dmgDot",range:[.1,.18],scale:"pct",slots:["weapon","amulet","legs"],weight:3,text:"+{v} damage over time",adj:"Festering"}),I({id:"dmgVsElite",stat:"dmgVsElite",range:[.08,.15],scale:"pct",slots:["weapon","amulet","ring"],weight:4,text:"+{v} damage to elites",adj:"Elderbane"}),I({id:"dmgVsVulnerable",stat:"dmgVsVulnerable",range:[.1,.18],scale:"pct",slots:["weapon","gloves","ring"],weight:3,text:"+{v} damage to Vulnerable enemies",adj:"Cruel"}),I({id:"dmgVsCC",stat:"dmgVsCC",range:[.1,.18],scale:"pct",slots:["weapon","gloves"],weight:3,text:"+{v} damage to Stunned or Frozen enemies",adj:"Merciless"}),I({id:"dmgVsClose",stat:"dmgVsClose",range:[.08,.15],scale:"pct",slots:["weapon","amulet","legs"],weight:3,text:"+{v} damage to close enemies",adj:"Brawling"}),I({id:"dmgVsDistant",stat:"dmgVsDistant",range:[.08,.15],scale:"pct",slots:["weapon","amulet","legs"],weight:3,text:"+{v} damage to distant enemies",adj:"Far-seeing"}),I({id:"dmgVsInjured",stat:"dmgVsInjured",range:[.1,.18],scale:"pct",slots:["weapon","ring"],weight:3,text:"+{v} damage to injured enemies",adj:"Finishing"}),I({id:"critChance",stat:"critChance",range:[.02,.05],scale:"pct",slots:["gloves","ring","amulet","weapon"],weight:6,text:"+{v} critical strike chance",adj:"Keen"}),I({id:"critDamage",stat:"critDamage",range:[.08,.18],scale:"pct",slots:["weapon","gloves","ring"],weight:6,text:"+{v} critical strike damage",adj:"Vicious"}),I({id:"attackSpeed",stat:"attackSpeed",range:[.03,.07],scale:"pct",slots:["gloves","ring","weapon","amulet"],weight:6,text:"+{v} attack speed",adj:"Quick"}),I({id:"moveSpeed",stat:"moveSpeed",range:[.04,.09],scale:"pct",slots:["boots","amulet"],weight:6,text:"+{v} movement speed",adj:"Swift"}),I({id:"cdr",stat:"cdr",range:[.03,.06],scale:"pct",slots:["helm","amulet","ring"],weight:5,text:"{v} shorter cooldowns",adj:"Ready"}),I({id:"costReduction",stat:"costReduction",range:[.04,.08],scale:"pct",slots:["amulet","helm","offhand"],weight:4,text:"Skills cost {v} less",adj:"Thrifty"}),I({id:"resourceGen",stat:"resourceGen",range:[.05,.1],scale:"pct",slots:["ring","amulet","weapon"],weight:4,text:"+{v} resource generation",adj:"Rousing"}),I({id:"resourceMax",stat:"resourceMax",range:[5,12],scale:"none",slots:["helm","amulet","offhand"],weight:3,text:"+{v} maximum resource",adj:"Deep",whole:!0}),I({id:"resourceOnKill",stat:"resourceOnKill",range:[2,4],scale:"none",slots:["weapon","ring"],weight:3,text:"+{v} resource per kill",adj:"Reaping",whole:!0}),I({id:"potionHeal",stat:"potionHeal",range:[.08,.15],scale:"pct",slots:["chest","legs","amulet"],weight:3,text:"Tonics heal {v} more",adj:"Brewer’s"}),I({id:"potionCharges",stat:"potionCharges",range:[1,1],scale:"none",slots:["legs"],weight:1,text:"+{v} tonic carried",adj:"Pocketed",whole:!0,minIlvl:15}),I({id:"goldFind",stat:"goldFind",range:[.1,.2],scale:"pct",slots:["helm","ring","amulet"],weight:3,text:"+{v} glint found",adj:"Magpie’s"}),I({id:"magicFind",stat:"magicFind",range:[.08,.15],scale:"pct",slots:["helm","ring","amulet"],weight:3,text:"+{v} chance of finer finds",adj:"Lucky"}),I({id:"xpPct",stat:"xpPct",range:[.04,.08],scale:"pct",slots:["helm","amulet"],weight:2,text:"+{v} experience",adj:"Studious"}),I({id:"statusDuration",stat:"statusDuration",range:[.06,.12],scale:"pct",slots:["weapon","gloves","amulet"],weight:2,text:"Effects you cause last {v} longer",adj:"Lingering"}),I({id:"rank",stat:"ranks",range:[1,2],scale:"none",slots:["helm","amulet","gloves","weapon"],weight:5,text:"+{v} to {skill}",adj:"Learned",whole:!0}),I({id:"rankCore",stat:"ranks",range:[1,1],scale:"none",slots:["amulet"],weight:2,text:"+{v} to Core skills",adj:"Scholar’s",whole:!0,category:"core",minIlvl:20}),I({id:"rankBasic",stat:"ranks",range:[1,1],scale:"none",slots:["amulet","gloves"],weight:2,text:"+{v} to Basic skills",adj:"Drilled",whole:!0,category:"basic",minIlvl:10})],ha=Object.fromEntries(Co.map(a=>[a.id,a]));function rs(a,e,t){const[s,o]=a.range;let n=s+(o-s)*e;const r=Math.max(0,t-1);return a.scale==="flat"?n*=1+.2*r:a.scale==="attr"?n*=1+.12*r:a.scale==="pct"&&(n*=1+.008*r),a.whole&&(n=Math.max(1,Math.round(n))),n}const Ta=["any"],wn=[{id:"bulwark",name:"Bulwark",desc:"While you hold a barrier, you deal {v} more damage (×).",range:[.1,.2],format:"pct",slots:["chest","offhand","amulet","helm"],effects:a=>[{kind:"stat",stat:"damage",value:a,more:!0,when:"barrier"}]},{id:"wayfarer",name:"Wayfarer’s",desc:"+{v} movement speed.",range:[.1,.18],format:"pct",slots:["boots","amulet","legs"],effects:a=>[H("moveSpeed",a)]},{id:"hearthward",name:"Hearthward",desc:"A blow that leaves you below 35% health gives a barrier of {v} of your health. Once every 30 seconds.",range:[.2,.35],format:"pct",slots:Dr,effects:a=>[{kind:"trigger",on:"hurt",when:"injured",icd:30,actions:[{do:"barrier",pct:a,duration:6}]}]},{id:"thirsting",name:"Thirsting",desc:"Critical strikes mend {v} of your health.",range:[.01,.02],format:"pct",slots:["weapon","gloves","ring"],effects:a=>[{kind:"trigger",on:"crit",icd:.3,actions:[{do:"heal",pct:a}]}]},{id:"elderbane",name:"Elderbane",desc:"You deal {v} more damage (×) to elites.",range:[.15,.3],format:"pct",slots:["weapon","amulet","ring","gloves"],effects:a=>[H("dmgVsElite",a,!0)]},{id:"magpie",name:"Magpie’s",desc:"+{v} glint found and chance of finer finds.",range:[.2,.4],format:"pct",slots:["helm","ring","amulet"],effects:a=>[H("goldFind",a),H("magicFind",a*.6)]},{id:"stormcall",name:"Stormcaller’s",desc:"Critical strikes call down lightning on the target for {v} weapon damage.",range:[.6,1.2],format:"pct",slots:["weapon","gloves","amulet"],effects:a=>[{kind:"trigger",on:"crit",icd:.5,actions:[{do:"explode",radius:1.6,coef:a,element:"storm"}]}]},{id:"frostbitten",name:"Frostbitten",desc:"Your hits Chill enemies by {v}.",range:[.08,.15],format:"pct",slots:["weapon","gloves","ring","boots"],effects:a=>[{kind:"onHit",status:"chill",duration:3,potency:a}]},{id:"kindled",name:"Kindled",desc:"Your hits have a 20% chance to set enemies Burning for {v} of the blow over 3 seconds.",range:[.5,1],format:"pct",slots:["weapon","gloves","ring"],effects:a=>[{kind:"onHit",status:"burn",chance:.2,duration:3,potency:a}]},{id:"twinblade",name:"Twinblade",classes:["warden"],desc:"Cleave strikes a second time, for {v} of the damage.",range:[.4,.7],format:"pct",slots:["weapon","gloves","amulet"],effects:a=>[w("cleave","echo","set",a)]},{id:"earthwake",name:"Earthwake",classes:["warden"],desc:"Leap leaves burning ground for 3 seconds, dealing {v} weapon damage twice a second.",range:[.3,.6],format:"pct",slots:["boots","legs","weapon"],effects:a=>[w("leap","zoneDur","set",3),w("leap","zoneCoef","set",a),w("leap","zoneFire","set",1)]},{id:"unending",name:"Unending Whirl",classes:["warden"],desc:"Whirl spins twice and costs {v} less.",range:[.1,.25],format:"pct",slots:["weapon","amulet","chest"],effects:a=>[w("whirl","echo","set",1),w("whirl","cost","mul",1-a)]},{id:"ironbound",name:"Ironbound",classes:["warden"],desc:"Iron Hide’s barrier is {v} stronger, and it Rallies you.",range:[.2,.4],format:"pct",slots:Dr,effects:a=>[w("ironhide","pct","mul",1+a),re("ironhide",Ce("rally",5,.2))]},{id:"trefoil",name:"Trefoil",classes:["emberwright"],desc:"Ember Bolt throws {v} more motes.",range:[1,2],format:"int",slots:["weapon","amulet","gloves"],effects:a=>[w("emberbolt","count","add",Math.round(a))]},{id:"glacier",name:"Glacier’s Heart",classes:["emberwright"],desc:"Ice Lance freezes enemies for {v}.",range:[.8,1.5],format:"sec",slots:["weapon","amulet","helm"],effects:a=>[w("icelance","freeze","set",a)]},{id:"tempest",name:"Tempest",classes:["emberwright"],desc:"Chain Lightning leaps {v} more times.",range:[2,4],format:"int",slots:["weapon","gloves","ring"],effects:a=>[w("chainlightning","jumps","add",Math.round(a))]},{id:"inkwell",name:"Inkwell",classes:["emberwright"],desc:"Inkfall drops {v} more blots around the first.",range:[1,2],format:"int",slots:["weapon","amulet","chest"],effects:a=>[w("inkfall","count","add",Math.round(a)),w("inkfall","scatter","set",2.6)]},{id:"splitting",name:"Splitting",classes:["strider"],desc:"Quick Shot looses {v} more arrows.",range:[1,2],format:"int",slots:["weapon","gloves","offhand"],effects:a=>[w("quickshot","count","add",Math.round(a)),w("quickshot","spread","set",.12)]},{id:"hailstorm",name:"Hailstorm",classes:["strider"],desc:"Arrow Fan looses {v} more arrows, and they pass through an enemy.",range:[2,3],format:"int",slots:["weapon","offhand","amulet"],effects:a=>[w("arrowfan","count","add",Math.round(a)),w("arrowfan","pierce","add",1)]},{id:"nightstep",name:"Nightstep",classes:["strider"],desc:"Tumble gives Haste: {v} faster for 3 seconds.",range:[.2,.4],format:"pct",slots:["boots","legs","chest"],effects:a=>[re("tumble",Ce("haste",3,a))]},{id:"viper",name:"Viper",classes:["strider"],desc:"Poison you cause deals {v} more damage (×).",range:[.2,.4],format:"pct",slots:["weapon","gloves","ring"],effects:a=>[H("dmgPoison",a,!0)]}],bl=Object.fromEntries(wn.map(a=>[a.id,a])),xl=[{id:"hearthkeeper",name:"Hearthkeeper’s Ward",base:"shield",classes:["warden"],minIlvl:8,affixes:["might","life","armorPct"],flavor:"Hung over a door in Hearthmere for a hundred winters.",power:{id:"u_hearthkeeper",name:"",desc:"Shield Bash strikes twice, and its chance to Stun rises by {v}.",range:[.15,.3],format:"pct",slots:Ta,effects:a=>[w("bash","hits","set",2),w("bash","stunChance","add",a)]}},{id:"ashenstaff",name:"The Ashen Staff",base:"staff",classes:["emberwright"],minIlvl:8,affixes:["mind","dmgFire","critChance"],flavor:"It is warm to hold, even in the snow.",power:{id:"u_ashenstaff",name:"",desc:"Enemies you kill burst into embers for {v} weapon damage.",range:[.8,1.4],format:"pct",slots:Ta,effects:a=>[{kind:"trigger",on:"kill",actions:[{do:"explode",radius:2.4,coef:a,element:"fire"}]}]}},{id:"wayboots",name:"Boots of the Long Road",base:"boots",minIlvl:5,affixes:["vigor","moveSpeed","dodge"],flavor:"Resoled more times than anyone can count.",power:{id:"u_wayboots",name:"",desc:"After you Evade, your next attack deals {v} more damage (×).",range:[.4,.7],format:"pct",slots:Ta,effects:a=>[re("evade",Ce("ambush",3,a,1))]}},{id:"starglass",name:"Starglass Ring",base:"ring",minIlvl:12,affixes:["critChance","critDamage","grace"],flavor:"A sliver of night sky, set in brass.",power:{id:"u_starglass",name:"",desc:"Critical strikes take {v} off your cooldowns.",range:[.2,.4],format:"sec",slots:Ta,effects:a=>[{kind:"trigger",on:"crit",icd:.4,actions:[{do:"cooldowns",seconds:a}]}]}},{id:"bottomless",name:"The Bottomless Quiver",base:"quiver",classes:["strider"],minIlvl:10,affixes:["grace","attackSpeed","dmgVsDistant"],flavor:"Nobody has ever seen the bottom. Nobody has looked very hard.",power:{id:"u_bottomless",name:"",desc:"Your arrows and bolts pass through {v} more enemies.",range:[1,2],format:"int",slots:Ta,effects:a=>[{kind:"param",tag:"projectile",key:"pierce",op:"add",value:Math.round(a)}]}},{id:"longwalk",name:"Crown of the Long Walk",base:"hood",minIlvl:20,affixes:["allAttrs","xpPct","lifePct"],flavor:"Woven from a thread of every country.",power:{id:"u_longwalk",name:"",desc:"+{v} to every skill you know.",range:[1,1],format:"int",slots:Ta,effects:a=>[{kind:"ranks",value:Math.round(a)}]}}],wl=Object.fromEntries(xl.map(a=>[a.id,a])),zs={common:{name:"Common",affixes:[0,0],sell:1},magic:{name:"Magic",affixes:[1,2],sell:2},rare:{name:"Rare",affixes:[3,4],sell:4},legendary:{name:"Legendary",affixes:[3,3],sell:8},unique:{name:"Unique",affixes:[3,3],sell:10}},N0=[{id:"sprout_leaf",name:"Sprout Leaf",desc:"Still a little wriggly.",value:4,color:[116,168,90]},{id:"puff_spore",name:"Puff Spore",desc:"Do not sneeze near it.",value:6,color:[224,92,70]},{id:"hog_bristle",name:"Hog Bristle",desc:"Stiff as a nail.",value:9,color:[176,128,84]},{id:"wisp_ember",name:"Wisp Ember",desc:"Cool to the touch.",value:12,color:[136,180,216]},{id:"crag_shard",name:"Crag Shard",desc:"Hums when struck.",value:18,color:[150,142,132]},{id:"snap_claw",name:"Snap Claw",desc:"Mind your fingers.",value:8,color:[226,176,52]},{id:"scrap",name:"Iron Scrap",desc:"What is left of plain and magic gear. The smith wants it.",value:2,color:[150,142,132]},{id:"thread",name:"Gilded Thread",desc:"Picked out of rare gear. Used to enchant.",value:6,color:[226,176,52]},{id:"inkstone",name:"Inkstone",desc:"A drop of the dark, set hard. Left by legendary gear.",value:20,color:[74,77,94]}],Ht=Object.fromEntries(N0.map(a=>[a.id,a])),B0=["Bramble","Gloom","Hearth","Ash","Thorn","Dusk","Ember","Rime","Storm","Moss","Iron","Hollow","Wren","Briar","Ink","Lantern","Cinder","Tallow","Raven","Fern","Quill","Saltmarsh","Larch","Kestrel"],O0={weapon:["Bite","Edge","Fang","Song","Reaver","Whisper","Brand","Spite","Thorn"],offhand:["Ward","Bulwark","Wall","Eye","Lamp","Keeper"],helm:["Crown","Cowl","Brow","Visage","Hood"],chest:["Coat","Mantle","Shell","Hide","Carapace"],gloves:["Grip","Grasp","Touch","Knuckles","Fist"],legs:["Stride","Legguards","Wraps","Greaves"],boots:["Tread","Step","Road","Trail","Heels"],amulet:["Charm","Locket","Heart","Token","Talisman"],ring:["Loop","Band","Coil","Circle","Seal"]},j0=78;class U0{game;batches=new Map;frame;lights=[];mark=null;markFollow=null;tick=-1;smooth=!1;constructor(e){this.game=e,this.frame={camera:e.camera,env:e.env,focus:[0,0,0],time:0,timeTwos:0,far:600,dpr:1,look:e.look,casters:new Float32Array(xe.MAX_CASTERS*4),casterCount:0,lightPos:new Float32Array(xe.MAX_LIGHTS*4),lightCol:new Float32Array(xe.MAX_LIGHTS*3),lightCount:0,batches:this.batches,fx:e.fx,reveal:[0,0,0,0]}}batch(e){let t=this.batches.get(e);return t||this.batches.set(e,t={data:new Float32Array(Ha*16),count:0}),t}build(e){const t=this.game,s=t.player,o=this.frame,n=t.camera;for(const f of this.batches.values())f.count=0;const r=t.entities.list,i=[],l=Math.floor(e*12),c=this.smooth||l!==this.tick;this.tick=l,o.timeTwos=this.smooth?e:l/12;const d=t.settings.flashes&&!t.reducedMotion;for(let f=0;f<r.length;f++){const u=r[f],m=Math.hypot(u.x-s.x,u.z-s.z);if(m>j0||u.grow<=.01)continue;const g=t.world.chunk(Math.floor(u.x/ne.CHUNK),Math.floor(u.z/ne.CHUNK)).height[((Math.floor(u.z)&ne.CHUNK-1)*ne.CHUNK+(Math.floor(u.x)&ne.CHUNK-1))*4+1];u.shade+=(1-g*.75-u.shade)*.12;const v=this.batch(u.archetype);if((v.count+1)*Ha>v.data.length){const P=new Float32Array(v.data.length*2);P.set(v.data),v.data=P}const x=v.data,b=v.count++*Ha,y=u.colors,k=u.scale*u.grow;x[b]=u.x,x[b+1]=u.y+u.lift,x[b+2]=u.z,x[b+3]=k,(c||u.pose===void 0)&&(u.pose=[u.yaw,u.walk,u.action,u.actionT]),x[b+4]=u.pose[0],x[b+5]=u.pose[1],x[b+6]=u.pose[2],x[b+7]=u.pose[3],x[b+8]=u.seed,x[b+9]=d?u.flash:u.flash*.3,x[b+10]=u.shade,x[b+11]=(u.ghost?1:0)+(u.hover||u===s.target?2:0);const M=u.tint,z=M?.45:0;x[b+12]=y[0][0]+(M?(M[0]-y[0][0])*z:0),x[b+13]=y[0][1]+(M?(M[1]-y[0][1])*z:0),x[b+14]=y[0][2]+(M?(M[2]-y[0][2])*z:0),x[b+15]=u.kind==="drop"?0:u.move,x[b+16]=y[1][0],x[b+17]=y[1][1],x[b+18]=y[1][2],x[b+19]=u.extra,x[b+20]=y[2][0],x[b+21]=y[2][1],x[b+22]=y[2][2],x[b+23]=(u.kind==="player"?W0(u):0)+8*(u.face??0),u.kind!=="drop"&&u.kind!=="missile"&&m<45&&i.push({e:u,dist:m})}i.sort((f,u)=>f.dist-u.dist),o.casterCount=Math.min(i.length,xe.MAX_CASTERS);for(let f=0;f<o.casterCount;f++){const u=i[f].e,m=Math.max(u.radius,u.height*.33)*u.scale*u.grow;o.casters.set([u.x,u.y+m*1.05+u.lift+(u.archetype==="wisp"?.6:0),u.z,m],f*4)}this.collectLights(),this.markTarget();const p=n.project(s.x,s.y+.8,s.z);return p&&!t.paused&&!s.dead?(o.reveal[0]=p.x*2-1,o.reveal[1]=1-p.y*2,o.reveal[2]=.3,o.reveal[3]=Math.hypot(n.pos[0]-s.x,n.pos[1]-s.y-.8,n.pos[2]-s.z)):o.reveal[2]=0,o.time=e,o.focus=n.target,t.fx.write(),this.minimap(),o}minimap(){const e=this.game,t=e.player,s=e.renderer.minimap,o=t.char.journey;s.clear(),s.player=[t.x,t.z,t.yaw];const n=Math.max(8,s.rect[2]*s.rect[3]-7),r=(l,c,d,p)=>{const f=l-t.x,u=c-t.z,m=Math.hypot(f,u),g=m>n?n/m:1;s.add(t.x+f*g,t.z+u*g,d,p)};if(e.world===e.overworld){for(const d in o.known)r(o.known[d][0],o.known[d][1],5,2.8);const l=o.bounty;l&&l.x!==void 0&&l.have<l.need&&r(l.x,l.z,4,3.4),o.satchel&&r(o.satchel.x,o.satchel.z,3,3.2);const c=e.discover.lead;c&&!o.known[c.key]&&r(c.x,c.z,5,2.2);for(const d of e.world.sites.inRange(t.x,t.z,110))s.add(d.x,d.z,d.kind==="dungeon"?4:2,d.kind==="town"||d.kind==="dungeon"?4:3.2)}else{const l=e.zones.goal();l&&r(l.x,l.z,4,3.4)}for(const l of e.entities.list)if(l.kind==="npc")s.add(l.x,l.z,1,2.6);else if(l.kind==="monster"&&!l.dead){const c=l,d=o.bounty&&o.bounty.monster===c.defId;s.add(c.x,c.z,d||c.boss?4:0,c.boss?4:c.elite?3:2)}else l.kind==="drop"&&s.add(l.x,l.z,3,l.rarity==="legendary"||l.rarity==="unique"?2.4:1.4)}collectLights(){const e=this.game,t=e.player,s=this.frame,o=e.env.night,n=this.lights;n.length=0,e.world.forEachProp(t.x,t.z,44,r=>{const i=r.def.light;if(!i)return;const l=i.always?.3+.7*o:o;if(l<.05)return;const c=-Math.sin(r.rot),d=Math.cos(r.rot),p=i.forward||0;n.push({x:r.x+c*p,y:r.y+i.y*r.scale,z:r.z+d*p,r:i.radius,k:l*(i.always?.55:1)})});for(const r of e.monsters)r.def.glow&&!r.dead&&o>.05&&n.push({x:r.x,y:r.y+1,z:r.z,r:4.5,k:o*.7});for(const r of e.fx.lights)n.push({x:r.x,y:r.y,z:r.z,r:r.r,k:r.life/r.max*(.25+.75*o)});for(const r of n)r.d=Math.hypot(r.x-t.x,r.z-t.z);n.sort((r,i)=>r.d-i.d),s.lightCount=Math.min(n.length,xe.MAX_LIGHTS);for(let r=0;r<s.lightCount;r++){const i=n[r];s.lightPos.set([i.x,i.y,i.z,i.r],r*4),s.lightCol.set([i.k,0,0],r*3)}}markTarget(){const e=this.game,t=e.player.target;if(this.mark&&(!t||this.markFollow!==t)&&(e.fx.release(this.mark),this.mark=null,this.markFollow=null),t&&!this.mark&&t.kind!=="drop"){const s=t.kind==="monster"?[.84,.28,.2]:[.33,.42,.61];this.mark=e.fx.spawn("mark",t.x,t.y,t.z,{size:t.radius*2.1+.25,color:s,ground:!0,hold:!0,follow:t,dy:.1,alpha:1.2}),this.markFollow=t}}}function W0(a){const e=a.char.equipment.mainhand?ve[a.char.equipment.mainhand.base]:null,t=a.char.equipment.offhand?ve[a.char.equipment.offhand.base]:null;let s=0;return t?.type==="shield"&&(s+=1),e?.hands===2&&(e.type==="greatsword"||e.type==="greataxe")&&(s+=2),a.char.classId==="strider"&&e?.type==="dagger"&&(s+=4),s}const Xn=["might","grace","vigor","mind"],K0=["common","magic","rare","legendary","unique"],kl=["helm","chest","gloves","legs","boots","amulet","ring1","ring2","mainhand","offhand"],Ml={id:"warden",name:"Warden",tagline:"The hearth’s shield",about:"Steel and stubbornness. Wardens fight up close, earn Resolve with every blow given or taken, and spend it on cuts that clear a ring of foes.",primary:"might",resource:{name:"Resolve",max:100,regen:0,startFull:!1,onHurt:1.2,decay:[6,4],color:"#b3341f"},weapons:["sword","axe","mace","greatsword","greataxe"],offhands:["shield"],kit:0,pencils:[[214/255,70/255,52/255],[84/255,108/255,156/255],[122/255,62/255,44/255]],start:["strike","cleave"],gear:["sword","jerkin"],skills:[{id:"strike",name:"Strike",category:"basic",tags:["basic","melee","physical"],element:"physical",icon:"slash",behavior:"melee",anim:"swing",targeting:"enemy",range:1.7,params:{coef:.95,generate:12,castTime:.42,reach:1.9,arc:.3,targets:1,hits:1},desc:"A quick, plain blow for {coef} weapon damage. Generates {generate} Resolve.",enhance:{desc:"Generates 4 more Resolve, and each hit mends 1% of your health.",effects:[w("strike","generate","add",4),vl("strike",Da(.01))]},upgrades:[{name:"Sundering Strike",desc:"Strike makes enemies Vulnerable for 2 seconds.",effects:[w("strike","vuln","set",2)]},{name:"Sweeping Strike",desc:"Strike hits every enemy in a wide arc in front of you.",effects:[w("strike","targets","set",8),w("strike","arc","set",-.2)]}]},{id:"bash",name:"Shield Bash",category:"basic",tags:["basic","melee","physical"],element:"physical",icon:"shield",behavior:"melee",anim:"swing",targeting:"enemy",range:1.6,params:{coef:.75,generate:10,castTime:.46,reach:1.8,arc:.3,targets:1,hits:1,stun:1,stunChance:.25,knock:1.5},desc:"Slam an enemy for {coef} weapon damage, with a {stunChance} chance to Stun it for {stun} seconds. Generates {generate} Resolve.",enhance:{desc:"The chance to Stun rises by 20%.",effects:[w("bash","stunChance","add",.2)]},upgrades:[{name:"Staggering Bash",desc:"Bash throws enemies far back.",effects:[w("bash","knock","set",7)]},{name:"Bracing Bash",desc:"Each Bash gives you a barrier of 4% of your health for 3 seconds.",effects:[re("bash",yl(.04,3))]}]},{id:"cleave",name:"Cleave",category:"core",tags:["core","melee","area","physical"],element:"physical",icon:"cleave",behavior:"melee",anim:"swing",targeting:"direction",range:2.6,params:{coef:1.6,cost:30,castTime:.48,hitAt:.5,reach:3,arc:0,targets:12,hits:1,knock:1.8,heavy:1},desc:"A wide cut through everything in front of you for {coef} weapon damage.",enhance:{desc:"Cleave reaches a fifth farther.",effects:[w("cleave","reach","mul",1.2)]},upgrades:[{name:"Rending Cleave",desc:"Enemies hit Bleed for 60% of the blow over 4 seconds.",effects:[w("cleave","bleed","set",.6),w("cleave","bleedDur","set",4)]},{name:"Full Circle",desc:"Cleave cuts all the way around you, for 10% less damage.",effects:[w("cleave","arc","set",-1),w("cleave","coef","mul",.9)]}]},{id:"whirl",name:"Whirl",category:"core",tags:["core","melee","area","physical"],element:"physical",icon:"spiral",behavior:"nova",anim:"swing",targeting:"self",range:0,params:{coef:1.25,cost:32,castTime:.5,hitAt:.5,radius:2.7,knock:1},desc:"Spin with your weapon out, hitting everything around you for {coef} weapon damage.",enhance:{desc:"Whirl reaches a quarter farther.",effects:[w("whirl","radius","mul",1.25)]},upgrades:[{name:"Eye of the Storm",desc:"Whirl draws enemies in toward you.",effects:[w("whirl","pull","set",1),w("whirl","knock","set",0)]},{name:"Second Wind",desc:"Each enemy Whirl hits gives back 4 Resolve.",effects:[w("whirl","genPerHit","add",4)]}]},{id:"rally",name:"Rallying Cry",category:"defensive",tags:["defensive","shout","buff"],element:"physical",icon:"horn",behavior:"buff",anim:"cast",targeting:"self",range:0,status:"rally",params:{cooldown:18,castTime:.4,duration:6,potency:.2},desc:"A shout that steels you: take {potency} less damage and gain 40% more Resolve for {duration} seconds.",enhance:{desc:"Cooldown 4 seconds shorter.",effects:[w("rally","cooldown","add",-4)]},upgrades:[{name:"Rousing Cry",desc:"Also mends 15% of your health.",effects:[re("rally",Da(.15))]},{name:"Quickening Cry",desc:"Also gives you Haste: 20% faster for 6 seconds.",effects:[re("rally",Ce("haste",6,.2))]}]},{id:"ironhide",name:"Iron Hide",category:"defensive",tags:["defensive","buff"],element:"physical",icon:"armor",behavior:"barrier",anim:"cast",targeting:"self",range:0,params:{cooldown:16,castTime:.35,pct:.25,duration:5},desc:"Harden like old bark: a barrier of {pct} of your health for {duration} seconds.",enhance:{desc:"The barrier is 10% of your health stronger.",effects:[w("ironhide","pct","add",.1)]},upgrades:[{name:"Iron Barbs",desc:"While it holds, attackers take half of every blow back.",effects:[re("ironhide",Ce("thorns",5,.5))]},{name:"Unyielding",desc:"You are Unstoppable for 5 seconds.",effects:[re("ironhide",Ce("unstoppable",5))]}]},{id:"leap",name:"Leap",category:"mobility",tags:["mobility","movement","area","physical"],element:"physical",icon:"leap",behavior:"leap",anim:"lunge",targeting:"ground",range:8,params:{cooldown:12,castTime:.55,distance:8,radius:2.6,coef:1.1,knock:2},desc:"Leap to a spot up to {distance} paces away and land for {coef} weapon damage around you.",enhance:{desc:"Cooldown 3 seconds shorter.",effects:[w("leap","cooldown","add",-3)]},upgrades:[{name:"Earthshaker",desc:"The landing Stuns for 1.5 seconds.",effects:[w("leap","stun","set",1.5)]},{name:"Crushing Landing",desc:"The landing makes enemies Vulnerable for 3 seconds.",effects:[w("leap","vuln","set",3)]}]},{id:"charge",name:"Charge",category:"mobility",tags:["mobility","movement","physical"],element:"physical",icon:"charge",behavior:"dash",anim:"lunge",targeting:"direction",range:9,params:{cooldown:10,distance:9,speed:24,width:1.3,coef:.8,knock:4,invuln:.3},desc:"Run headlong {distance} paces, knocking aside everything in the way for {coef} weapon damage.",enhance:{desc:"Cooldown 2 seconds shorter.",effects:[w("charge","cooldown","add",-2)]},upgrades:[{name:"Headlong",desc:"Charge gives 20 Resolve.",effects:[w("charge","generate","add",20)]},{name:"Battering Ram",desc:"Charge deals twice the damage.",effects:[w("charge","coef","mul",2)]}]},{id:"earthsplitter",name:"Earthsplitter",category:"mastery",tags:["mastery","area","physical"],element:"physical",icon:"quake",behavior:"blast",anim:"swing",targeting:"ground",range:7,params:{cooldown:9,castTime:.5,radius:3,delay:.45,coef:2.4,knock:2,heavy:1},desc:"Split the ground where you aim; after a moment it bursts for {coef} weapon damage.",enhance:{desc:"The burst is a fifth wider.",effects:[w("earthsplitter","radius","mul",1.2)]},upgrades:[{name:"Broken Ground",desc:"The ground stays broken for 4 seconds, slowing enemies by 40%.",effects:[w("earthsplitter","zoneDur","set",4),w("earthsplitter","zoneSlow","set",.4)]},{name:"Aftershock",desc:"The ground bursts a second time, for 60% of the damage.",effects:[w("earthsplitter","echo","set",.6)]}]},{id:"brand",name:"Hearthfire Brand",category:"mastery",tags:["mastery","buff","fire"],element:"fire",icon:"flame",behavior:"buff",anim:"cast",targeting:"self",range:0,status:"brand",params:{cooldown:20,castTime:.4,duration:8,potency:.2},desc:"Set your weapon alight for {duration} seconds: your attacks come {potency} faster and set enemies Burning.",enhance:{desc:"Lasts 4 seconds longer.",effects:[w("brand","duration","add",4)]},upgrades:[{name:"Searing Brand",desc:"You deal 15% more damage (×) to Burning enemies.",effects:[H("dmgVsBurning",.15,!0)]},{name:"Keen Brand",desc:"Brand also gives Hawk’s Eye: +10% critical strike chance for 10 seconds.",effects:[re("brand",Ce("hawkeye",10,.1))]}]},{id:"laststand",name:"Last Stand",category:"ultimate",tags:["ultimate","buff"],element:"physical",icon:"banner",behavior:"buff",anim:"cast",targeting:"self",range:0,status:"laststand",params:{cooldown:60,castTime:.5,duration:10,potency:1},desc:"Plant your feet. For {duration} seconds you deal 50% more damage (×) and take 30% less.",enhance:{desc:"Cooldown 15 seconds shorter.",effects:[w("laststand","cooldown","add",-15)]},upgrades:[{name:"Undying",desc:"Also mends 30% of your health.",effects:[re("laststand",Da(.3))]},{name:"Unending",desc:"Lasts 5 seconds longer.",effects:[w("laststand","duration","add",5)]}]},{id:"avalanche",name:"Avalanche",category:"ultimate",tags:["ultimate","area","physical"],element:"physical",icon:"meteor",behavior:"blast",anim:"swing",targeting:"self",range:0,params:{cooldown:50,castTime:.55,radius:2.5,delay:.5,coef:2.6,count:6,scatter:5,stagger:.22,knock:2,heavy:1},desc:"Bring the hillside down: {count} boulders fall around you, each for {coef} weapon damage.",enhance:{desc:"Two more boulders fall.",effects:[w("avalanche","count","add",2)]},upgrades:[{name:"Stunning Rocks",desc:"Each boulder Stuns for 2 seconds.",effects:[w("avalanche","stun","set",2)]},{name:"Grinding Stone",desc:"Each boulder makes enemies Vulnerable for 4 seconds.",effects:[w("avalanche","vuln","set",4)]}]}],passives:[{id:"toughskin",name:"Tough Skin",cluster:"basic",max:3,effects:[H("lifePct",.04)],desc:"+4% maximum health per rank.",icon:"heart"},{id:"quickhands",name:"Quick Hands",cluster:"basic",max:3,effects:[H("attackSpeed",.04)],desc:"+4% attack speed per rank.",icon:"hands"},{id:"heavyhand",name:"Heavy Hand",cluster:"core",max:3,effects:[H("dmgPhysical",.08)],desc:"+8% physical damage per rank.",icon:"fist"},{id:"bloodletter",name:"Bloodletter",cluster:"core",max:3,effects:[H("dmgVsBleeding",.1)],desc:"+10% damage to Bleeding enemies per rank.",icon:"drop"},{id:"ironwill",name:"Iron Will",cluster:"defensive",max:3,effects:[H("armorPct",.1)],desc:"+10% armor per rank.",icon:"armor"},{id:"stalwart",name:"Stalwart",cluster:"defensive",max:3,effects:[H("resistAll",.04)],desc:"+4% resistance to all elements per rank.",icon:"shield"},{id:"momentum",name:"Momentum",cluster:"mobility",max:3,effects:[H("moveSpeed",.04)],desc:"+4% movement speed per rank.",icon:"boot"},{id:"executioner",name:"Executioner",cluster:"mastery",max:3,effects:[H("dmgVsInjured",.12)],desc:"+12% damage to enemies below 35% health per rank.",icon:"skull"},{id:"brute",name:"Brute Force",cluster:"mastery",max:3,effects:[H("critDamage",.12)],desc:"+12% critical strike damage per rank.",icon:"burst"},{id:"warhorn",name:"Old Warhorn",cluster:"ultimate",max:3,effects:[H("cdr",.04)],desc:"4% shorter cooldowns per rank.",icon:"horn"}],keys:[{id:"unbroken",name:"Unbroken",effects:[{kind:"stat",stat:"damageTaken",value:-.15,more:!0,when:"resourceHigh"}],desc:"While you hold at least half your Resolve, you take 15% less damage (×).",icon:"shield"},{id:"bloodrage",name:"Bloodrage",effects:[$r(Ce("bloodrage",6,0,1))],desc:"Each kill gives Bloodrage for 6 seconds: 5% more damage (×), stacking 5 times.",icon:"drop"},{id:"wrath",name:"Hearth’s Wrath",effects:[$r(Na(6)),H("dmgCore",.2,!0)],desc:"Core skills deal 20% more damage (×), and each kill gives 6 Resolve.",icon:"flame"}]},_l={id:"emberwright",name:"Emberwright",tagline:"Keeper of the old fires",about:"Fire, frost and storm, drawn out of the air. Emberwrights keep their distance, spend Focus that returns on its own, and burn, freeze and shock whole packs at once.",primary:"mind",resource:{name:"Focus",max:100,regen:8,startFull:!0,color:"#48608f"},weapons:["staff","wand"],offhands:["focus"],kit:2,pencils:[[84/255,108/255,156/255],[214/255,70/255,52/255],[226/255,188/255,130/255]],start:["spark","emberbolt"],gear:["staff","robe"],skills:[{id:"spark",name:"Spark",category:"basic",tags:["basic","ranged","projectile","storm"],element:"storm",icon:"spark",behavior:"projectile",anim:"cast",targeting:"direction",range:14,params:{coef:1,generate:10,castTime:.6,speed:24,radius:.35,life:.7,count:1,spread:.18,pierce:0},desc:"Flick a spark that bites the first enemy for {coef} weapon damage. Generates {generate} Focus.",enhance:{desc:"Spark passes through one more enemy.",effects:[w("spark","pierce","add",1)]},upgrades:[{name:"Forked Spark",desc:"Three sparks in a fan, each for 60% of the damage.",effects:[w("spark","count","set",3),w("spark","coef","mul",.6)]},{name:"Arcing Spark",desc:"Spark leaps on to 2 more enemies nearby.",effects:[w("spark","chain","set",2)]}]},{id:"frostshard",name:"Frost Shard",category:"basic",tags:["basic","ranged","projectile","frost"],element:"frost",icon:"shard",behavior:"projectile",anim:"cast",targeting:"direction",range:14,params:{coef:1.02,generate:10,castTime:.64,speed:18,radius:.4,life:.8,count:1,spread:.15,pierce:0,chill:.22},desc:"A splinter of ice for {coef} weapon damage that Chills by {chill}. Enough Chill freezes. Generates {generate} Focus.",enhance:{desc:"Chills by 15% more.",effects:[w("frostshard","chill","add",.15)]},upgrades:[{name:"Shatter",desc:"Deals 40% more damage (×) to Frozen or Stunned enemies.",effects:[w("frostshard","moreVsCC","set",.4)]},{name:"Splinter",desc:"Bursts on impact, hitting enemies nearby for 40% of the damage.",effects:[w("frostshard","explode","set",1.5),w("frostshard","explodeCoef","set",.4)]}]},{id:"emberbolt",name:"Ember Bolt",category:"core",tags:["core","ranged","projectile","fire"],element:"fire",icon:"bolt",behavior:"projectile",anim:"cast",targeting:"direction",range:14,params:{coef:2.3,cost:26,castTime:.72,speed:17,radius:.5,life:.85,count:1,spread:.13,pierce:0,explode:1.6,explodeCoef:.5,burn:.4,burnDur:3},desc:"Hurl a mote of fire that bursts on the first enemy for {coef} weapon damage, splashing {explodeCoef} around it and setting enemies Burning.",enhance:{desc:"The burst is 30% wider.",effects:[w("emberbolt","explode","mul",1.3)]},upgrades:[{name:"Twin Embers",desc:"Throws two motes, a little apart.",effects:[w("emberbolt","count","set",2)]},{name:"Lingering Flame",desc:"Burning is twice as strong and lasts 2 seconds longer.",effects:[w("emberbolt","burn","mul",2),w("emberbolt","burnDur","add",2)]}]},{id:"icelance",name:"Ice Lance",category:"core",tags:["core","ranged","projectile","frost"],element:"frost",icon:"lance",behavior:"projectile",anim:"cast",targeting:"direction",range:16,params:{coef:2.15,cost:28,castTime:.74,speed:26,radius:.45,life:.9,count:1,spread:.2,pierce:99,chill:.3},desc:"A lance of ice that runs through every enemy in a line for {coef} weapon damage, Chilling by {chill}.",enhance:{desc:"Deals 30% more damage (×) to Chilled enemies.",effects:[w("icelance","moreVsChilled","set",.3)]},upgrades:[{name:"Lance Volley",desc:"Three lances in a fan, each for 70% of the damage.",effects:[w("icelance","count","set",3),w("icelance","coef","mul",.7)]},{name:"Rime Lance",desc:"Freezes enemies that were already Chilled, for 1.2 seconds.",effects:[w("icelance","freezeChilled","set",1.2)]}]},{id:"chainlightning",name:"Chain Lightning",category:"core",tags:["core","ranged","storm"],element:"storm",icon:"chain",behavior:"chain",anim:"cast",targeting:"enemy",range:11,params:{coef:1.75,cost:30,castTime:.7,jumps:4,jumpRange:6,falloff:.9},desc:"Lightning that strikes an enemy for {coef} weapon damage, then leaps to {jumps} more.",enhance:{desc:"Leaps to 2 more enemies.",effects:[w("chainlightning","jumps","add",2)]},upgrades:[{name:"Gathering Storm",desc:"Each leap hits 15% harder than the last, rather than softer.",effects:[w("chainlightning","falloff","set",1.15)]},{name:"Overcharge",desc:"Makes enemies Vulnerable for 2 seconds.",effects:[w("chainlightning","vuln","set",2)]}]},{id:"mend",name:"Mend",category:"defensive",tags:["defensive","heal"],element:"poison",icon:"heart",behavior:"heal",anim:"cast",targeting:"self",range:0,params:{cooldown:14,cost:16,castTime:.5,pct:.34,duration:3},desc:"Knit your wounds: restores {pct} of your health over {duration} seconds.",enhance:{desc:"Restores a third more.",effects:[w("mend","pct","mul",1.33)]},upgrades:[{name:"Clean Slate",desc:"Also makes you Unstoppable for 2 seconds, shaking off any hold.",effects:[re("mend",Ce("unstoppable",2))]},{name:"Clear Mind",desc:"Also restores 30 Focus.",effects:[re("mend",Na(30))]}]},{id:"frostward",name:"Frost Ward",category:"defensive",tags:["defensive","area","frost"],element:"frost",icon:"snow",behavior:"nova",anim:"cast",targeting:"self",range:0,params:{cooldown:16,castTime:.4,radius:3.2,coef:.7,freeze:1.2,barrierPct:.2,barrierDur:5},desc:"A ring of frost: enemies within {radius} paces take {coef} weapon damage and freeze for {freeze} seconds, and you gain a barrier of {barrierPct} of your health.",enhance:{desc:"The ring is a quarter wider.",effects:[w("frostward","radius","mul",1.25)]},upgrades:[{name:"Thick Rime",desc:"The barrier is 15% of your health stronger.",effects:[w("frostward","barrierPct","add",.15)]},{name:"Brittle",desc:"Enemies caught are Vulnerable for 3 seconds.",effects:[w("frostward","vuln","set",3)]}]},{id:"galestep",name:"Gale Step",category:"mobility",tags:["mobility","movement","storm"],element:"storm",icon:"step",behavior:"dash",anim:"lunge",targeting:"direction",range:6,params:{cooldown:6,distance:6,speed:30,width:1.3,coef:0,invuln:.35},desc:"Ride the wind {distance} paces, untouchable while you move: the way through a charge or out of a slam.",enhance:{desc:"Carries you a quarter farther.",effects:[w("galestep","distance","mul",1.25)]},upgrades:[{name:"Parting Gust",desc:"Cuts whatever it passes through for 120% weapon damage.",effects:[w("galestep","coef","set",1.2)]},{name:"Second Breath",desc:"Restores 15 Focus.",effects:[re("galestep",Na(15))]}]},{id:"inkfall",name:"Inkfall",category:"mastery",tags:["mastery","area","fire"],element:"fire",icon:"meteor",behavior:"blast",anim:"cast",targeting:"ground",range:12,params:{cost:40,castTime:.45,radius:3,delay:.9,coef:3,burn:.5,burnDur:3,zoneDur:3,zoneCoef:.25,heavy:1},desc:"Call down a blot of burning ink: after a moment it lands for {coef} weapon damage and leaves the ground burning.",enhance:{desc:"Lands 0.3 seconds sooner.",effects:[w("inkfall","delay","add",-.3)]},upgrades:[{name:"Ink Shower",desc:"Three smaller blots, each for 55% of the damage.",effects:[w("inkfall","count","set",3),w("inkfall","scatter","set",2.5),w("inkfall","radius","mul",.7),w("inkfall","coef","mul",.55)]},{name:"Scorched Earth",desc:"The burning ground lasts 3 seconds longer and burns 50% hotter.",effects:[w("inkfall","zoneDur","add",3),w("inkfall","zoneCoef","mul",1.5)]}]},{id:"blizzard",name:"Blizzard",category:"mastery",tags:["mastery","area","frost"],element:"frost",icon:"cloud",behavior:"zone",anim:"cast",targeting:"ground",range:12,params:{cost:40,castTime:.4,radius:4,duration:6,tick:.5,coef:.3,chill:.12},desc:"A storm of sleet over {radius} paces for {duration} seconds: {coef} weapon damage twice a second, Chilling.",enhance:{desc:"Lasts 2 seconds longer.",effects:[w("blizzard","duration","add",2)]},upgrades:[{name:"Mobile Storm",desc:"The storm follows you.",effects:[w("blizzard","follow","set",1)]},{name:"Deep Cold",desc:"Chills twice as hard.",effects:[w("blizzard","chill","mul",2)]}]},{id:"firestorm",name:"Firestorm",category:"ultimate",tags:["ultimate","area","fire"],element:"fire",icon:"flame",behavior:"zone",anim:"cast",targeting:"self",range:0,params:{cooldown:60,castTime:.5,radius:5.5,duration:8,tick:.5,coef:.55,burn:.3,burnDur:2,follow:1},desc:"Wreathe yourself in fire for {duration} seconds: everything within {radius} paces takes {coef} weapon damage twice a second and burns.",enhance:{desc:"Cooldown 15 seconds shorter.",effects:[w("firestorm","cooldown","add",-15)]},upgrades:[{name:"Wide Blaze",desc:"The fire reaches 30% farther.",effects:[w("firestorm","radius","mul",1.3)]},{name:"Inferno",desc:"The fire deals 40% more damage (×).",effects:[w("firestorm","more","add",.4)]}]},{id:"deepfreeze",name:"Deep Freeze",category:"ultimate",tags:["ultimate","area","frost"],element:"frost",icon:"snow",behavior:"nova",anim:"cast",targeting:"self",range:0,params:{cooldown:55,castTime:.55,radius:7,coef:3.2,freeze:2.5,heavy:1},desc:"Stop the world around you: everything within {radius} paces takes {coef} weapon damage and freezes for {freeze} seconds.",enhance:{desc:"Cooldown 12 seconds shorter.",effects:[w("deepfreeze","cooldown","add",-12)]},upgrades:[{name:"Glacial Shell",desc:"Also gives you a barrier of 40% of your health for 6 seconds.",effects:[re("deepfreeze",yl(.4,6))]},{name:"Shatterpoint",desc:"Everything caught is Vulnerable for 6 seconds.",effects:[w("deepfreeze","vuln","set",6)]}]}],passives:[{id:"kindling",name:"Kindling",cluster:"basic",max:3,effects:[H("dmgFire",.08)],desc:"+8% fire damage per rank.",icon:"flame"},{id:"rimecraft",name:"Rimecraft",cluster:"basic",max:3,effects:[H("dmgFrost",.08)],desc:"+8% frost damage per rank.",icon:"snow"},{id:"stormcraft",name:"Stormcraft",cluster:"core",max:3,effects:[H("dmgStorm",.08)],desc:"+8% storm damage per rank.",icon:"spark"},{id:"deepwell",name:"Deep Well",cluster:"core",max:3,effects:[H("resourceMax",10)],desc:"+10 maximum Focus per rank.",icon:"orb"},{id:"warding",name:"Warding",cluster:"defensive",max:3,effects:[H("resistAll",.04)],desc:"+4% resistance to all elements per rank.",icon:"shield"},{id:"innerfire",name:"Inner Fire",cluster:"defensive",max:3,effects:[H("barrierGen",.15)],desc:"Barriers you make are 15% stronger per rank.",icon:"armor"},{id:"quickening",name:"Quickening",cluster:"mobility",max:3,effects:[H("cdr",.04)],desc:"4% shorter cooldowns per rank.",icon:"hourglass"},{id:"glassmind",name:"Glass Mind",cluster:"mastery",max:3,effects:[H("critDamage",.12)],desc:"+12% critical strike damage per rank.",icon:"burst"},{id:"conduit",name:"Conduit",cluster:"mastery",max:3,effects:[H("resourceRegen",.1)],desc:"Focus returns 10% faster per rank.",icon:"orb"},{id:"elementalist",name:"Elementalist",cluster:"ultimate",max:3,effects:[H("damage",.05)],desc:"+5% damage per rank.",icon:"star"}],keys:[{id:"conflagration",name:"Conflagration",effects:[H("dmgVsBurning",.2,!0)],desc:"Burning enemies take 20% more damage (×) from you.",icon:"flame"},{id:"overflow",name:"Overflow",effects:[I0("core",.25,{do:"refund"},Ce("overflow",8))],desc:"Core skills have a 25% chance to cost nothing and to make your next Core skill deal 30% more damage (×).",icon:"orb"},{id:"shatter",name:"Permafrost",effects:[H("dmgVsCC",.25,!0)],desc:"Frozen and Stunned enemies take 25% more damage (×) from you.",icon:"snow"}]},zl={id:"strider",name:"Strider",tagline:"Who keeps the roads",about:"Bow, knife and quick feet. Striders shoot from range or cut up close, spend Breath that returns fast, and tumble out of every blow aimed at them.",primary:"grace",resource:{name:"Breath",max:100,regen:12,startFull:!0,color:"#3d7332"},weapons:["bow","dagger"],offhands:["quiver"],kit:3,pencils:[[94/255,140/255,78/255],[214/255,70/255,52/255],[74/255,77/255,94/255]],start:["quickshot","arrowfan"],gear:["shortbow","jerkin"],skills:[{id:"quickshot",name:"Quick Shot",category:"basic",tags:["basic","ranged","projectile","physical"],element:"physical",icon:"arrow",behavior:"projectile",anim:"shoot",targeting:"direction",range:15,params:{coef:.95,generate:10,castTime:.62,speed:28,radius:.35,life:.75,count:1,spread:.07,pierce:0},desc:"Loose an arrow for {coef} weapon damage. Generates {generate} Breath.",enhance:{desc:"The arrow passes through one more enemy.",effects:[w("quickshot","pierce","add",1)]},upgrades:[{name:"Double Nock",desc:"Two arrows at once.",effects:[w("quickshot","count","set",2)]},{name:"Keen Point",desc:"+25% critical strike chance with Quick Shot.",effects:[w("quickshot","crit","add",.25)]}]},{id:"twincut",name:"Twin Cut",category:"basic",tags:["basic","melee","physical"],element:"physical",icon:"daggers",behavior:"melee",anim:"swing",targeting:"enemy",range:1.7,params:{coef:.52,generate:12,castTime:.4,reach:1.9,arc:.3,targets:1,hits:2},desc:"Two quick cuts, each for {coef} weapon damage. Generates {generate} Breath.",enhance:{desc:"Generates 6 more Breath.",effects:[w("twincut","generate","add",6)]},upgrades:[{name:"Venomed Edges",desc:"Each cut poisons for 50% of its damage over 4 seconds.",effects:[w("twincut","poison","set",.5),w("twincut","poisonDur","set",4)]},{name:"Lunge",desc:"Twin Cut darts to an enemy up to 5 paces away first.",effects:[w("twincut","lunge","set",5)]}]},{id:"arrowfan",name:"Arrow Fan",category:"core",tags:["core","ranged","projectile","physical"],element:"physical",icon:"fan",behavior:"projectile",anim:"shoot",targeting:"direction",range:13,params:{coef:.62,cost:26,castTime:.7,speed:24,radius:.35,life:.62,count:5,spread:.16,pierce:0},desc:"A fan of {count} arrows, each for {coef} weapon damage.",enhance:{desc:"Two more arrows.",effects:[w("arrowfan","count","add",2)]},upgrades:[{name:"Piercing Fan",desc:"The arrows pass through two enemies.",effects:[w("arrowfan","pierce","set",2)]},{name:"Barbed Fan",desc:"The arrows slow enemies by 30% for 2 seconds.",effects:[w("arrowfan","slow","set",.3),w("arrowfan","slowDur","set",2)]}]},{id:"piercingshot",name:"Piercing Shot",category:"core",tags:["core","ranged","projectile","physical"],element:"physical",icon:"lance",behavior:"projectile",anim:"shoot",targeting:"direction",range:18,params:{coef:1.8,cost:26,castTime:.76,speed:32,radius:.5,life:.8,count:1,spread:.1,pierce:99},desc:"A heavy arrow that runs through every enemy in a line for {coef} weapon damage.",enhance:{desc:"Deals 30% more damage (×) to Vulnerable enemies.",effects:[w("piercingshot","moreVsVulnerable","set",.3)]},upgrades:[{name:"Exposing Shot",desc:"Makes enemies Vulnerable for 3 seconds.",effects:[w("piercingshot","vuln","set",3)]},{name:"Echo Shot",desc:"A second arrow follows a moment later, for 60% of the damage.",effects:[w("piercingshot","echo","set",.6)]}]},{id:"flurry",name:"Flurry",category:"core",tags:["core","melee","physical"],element:"physical",icon:"daggers",behavior:"melee",anim:"swing",targeting:"enemy",range:2,params:{coef:.38,cost:24,castTime:.6,reach:2.3,arc:.1,targets:4,hits:4},desc:"A storm of cuts: {hits} strikes at up to {targets} enemies in front of you, each for {coef} weapon damage.",enhance:{desc:"One more strike.",effects:[w("flurry","hits","add",1)]},upgrades:[{name:"Toxic Flurry",desc:"Each cut poisons for 25% of its damage over 4 seconds.",effects:[w("flurry","poison","set",.25),w("flurry","poisonDur","set",4)]},{name:"Bleeding Flurry",desc:"Each cut makes enemies Bleed for 40% of its damage over 4 seconds.",effects:[w("flurry","bleed","set",.4),w("flurry","bleedDur","set",4)]}]},{id:"smokepouch",name:"Smoke Pouch",category:"defensive",tags:["defensive","area","shadow"],element:"shadow",icon:"smoke",behavior:"nova",anim:"cast",targeting:"self",range:0,params:{cooldown:14,castTime:.3,radius:3.2,coef:0,stun:1.5,invuln:.8,hasteSelf:.25,hasteDur:3},desc:"Burst a pouch of smoke: enemies within {radius} paces are Stunned for {stun} seconds, and you slip away untouchable and quick.",enhance:{desc:"Cooldown 3 seconds shorter.",effects:[w("smokepouch","cooldown","add",-3)]},upgrades:[{name:"Choking Smoke",desc:"Enemies caught are Vulnerable for 3 seconds.",effects:[w("smokepouch","vuln","set",3)]},{name:"Restorative Herbs",desc:"The smoke mends 12% of your health.",effects:[re("smokepouch",Da(.12))]}]},{id:"snaretrap",name:"Snare Trap",category:"defensive",tags:["defensive","trap","area","physical"],element:"physical",icon:"trap",behavior:"trap",anim:"cast",targeting:"ground",range:9,params:{cooldown:10,castTime:.35,radius:2.4,arm:.6,duration:15,coef:1.2,stun:2},desc:"Set a snare. The first enemy to step near springs it: everything within {radius} paces takes {coef} weapon damage and is held for {stun} seconds.",enhance:{desc:"The snare catches a quarter wider.",effects:[w("snaretrap","radius","mul",1.25)]},upgrades:[{name:"Poisoned Spikes",desc:"Poisons for 80% of the damage over 5 seconds.",effects:[w("snaretrap","poison","set",.8),w("snaretrap","poisonDur","set",5)]},{name:"Quick Rig",desc:"Cooldown 4 seconds shorter.",effects:[w("snaretrap","cooldown","add",-4)]}]},{id:"tumble",name:"Tumble",category:"mobility",tags:["mobility","movement"],element:"physical",icon:"step",behavior:"dash",anim:"lunge",targeting:"direction",range:5.5,params:{cooldown:5,distance:5.5,speed:28,width:1,coef:0,invuln:.3},desc:"Roll {distance} paces, untouchable for the moment.",enhance:{desc:"Cooldown 1 second shorter.",effects:[w("tumble","cooldown","add",-1)]},upgrades:[{name:"Poised Roll",desc:"Your next Basic skill after a Tumble is a critical strike.",effects:[re("tumble",Ce("poised",4))]},{name:"Caltrops",desc:"Leaves caltrops where you started, slowing enemies by 40% for 3 seconds.",effects:[w("tumble","zoneDur","set",3),w("tumble","zoneSlow","set",.4),w("tumble","radius","set",2.2)]}]},{id:"rainofarrows",name:"Rain of Arrows",category:"mastery",tags:["mastery","ranged","area","physical"],element:"physical",icon:"rain",behavior:"zone",anim:"cast",targeting:"ground",range:13,params:{cost:40,castTime:.4,radius:3.4,duration:3,tick:.25,coef:.32},desc:"Arrows rain over {radius} paces for {duration} seconds: {coef} weapon damage four times a second.",enhance:{desc:"Lasts 1 second longer.",effects:[w("rainofarrows","duration","add",1)]},upgrades:[{name:"Wide Rain",desc:"Covers 30% more ground.",effects:[w("rainofarrows","radius","mul",1.3)]},{name:"Fire Arrows",desc:"The arrows set enemies Burning.",effects:[w("rainofarrows","burn","set",.3),w("rainofarrows","burnDur","set",2)]}]},{id:"huntersmark",name:"Hunter’s Mark",category:"mastery",tags:["mastery","shadow"],element:"shadow",icon:"eye",behavior:"mark",anim:"cast",targeting:"enemy",range:14,status:"marked",params:{cooldown:14,castTime:.3,duration:8,potency:.3,radius:0},desc:"Mark an enemy for {duration} seconds: it takes {potency} more damage (×) from you.",enhance:{desc:"The mark lasts 4 seconds longer.",effects:[w("huntersmark","duration","add",4)]},upgrades:[{name:"Pack Hunt",desc:"Marks every enemy within 4 paces of the target.",effects:[w("huntersmark","radius","set",4)]},{name:"Open Wound",desc:"Marked enemies take 15% more again.",effects:[w("huntersmark","potency","add",.15)]}]},{id:"hundredarrows",name:"Hundred Arrows",category:"ultimate",tags:["ultimate","ranged","projectile","physical"],element:"physical",icon:"rain",behavior:"zone",anim:"cast",targeting:"self",range:0,params:{cooldown:50,castTime:.4,radius:10,duration:3,tick:.12,coef:.5,follow:1,volley:1},desc:"For {duration} seconds, loose arrows as fast as you can draw at every enemy within {radius} paces, each for {coef} weapon damage.",enhance:{desc:"Lasts 1 second longer.",effects:[w("hundredarrows","duration","add",1)]},upgrades:[{name:"Hail",desc:"The arrows hit 30% harder.",effects:[w("hundredarrows","coef","mul",1.3)]},{name:"Ready Again",desc:"Cooldown 12 seconds shorter.",effects:[w("hundredarrows","cooldown","add",-12)]}]},{id:"hawkseye",name:"Hawk’s Eye",category:"ultimate",tags:["ultimate","buff"],element:"physical",icon:"eye",behavior:"buff",anim:"cast",targeting:"self",range:0,status:"hawkeye",params:{cooldown:45,castTime:.3,duration:8,potency:.35},desc:"See every gap in every hide: +{potency} critical strike chance for {duration} seconds.",enhance:{desc:"Lasts 3 seconds longer.",effects:[w("hawkseye","duration","add",3)]},upgrades:[{name:"Predator",desc:"Your next 3 attacks also deal 60% more damage (×).",effects:[re("hawkseye",Ce("ambush",8,0,3))]},{name:"Steady Breath",desc:"Also restores 50 Breath.",effects:[re("hawkseye",Na(50))]}]}],passives:[{id:"fleetfoot",name:"Fleetfoot",cluster:"basic",max:3,effects:[H("moveSpeed",.04)],desc:"+4% movement speed per rank.",icon:"boot"},{id:"keeneye",name:"Keen Eye",cluster:"basic",max:3,effects:[H("critChance",.03)],desc:"+3% critical strike chance per rank.",icon:"eye"},{id:"sharpened",name:"Sharpened",cluster:"core",max:3,effects:[H("critDamage",.12)],desc:"+12% critical strike damage per rank.",icon:"burst"},{id:"toxicology",name:"Toxicology",cluster:"core",max:3,effects:[H("dmgPoison",.1),H("dmgDot",.05)],desc:"+10% poison damage and +5% damage over time per rank.",icon:"drop"},{id:"lightfeet",name:"Light on Your Feet",cluster:"defensive",max:3,effects:[H("dodge",.03)],desc:"+3% chance to dodge per rank.",icon:"step"},{id:"secondwind",name:"Second Wind",cluster:"defensive",max:3,effects:[H("resourceOnKill",5)],desc:"Each kill gives back 5 Breath per rank.",icon:"orb"},{id:"closequarters",name:"Close Quarters",cluster:"mobility",max:3,effects:[H("dmgVsClose",.08)],desc:"+8% damage to enemies close to you per rank.",icon:"fist"},{id:"steadyaim",name:"Steady Aim",cluster:"mastery",max:3,effects:[H("dmgVsDistant",.08)],desc:"+8% damage to distant enemies per rank.",icon:"arrow"},{id:"exploit",name:"Exploit Weakness",cluster:"mastery",max:3,effects:[H("dmgVsVulnerable",.1)],desc:"+10% damage to Vulnerable enemies per rank.",icon:"skull"},{id:"roadwise",name:"Roadwise",cluster:"ultimate",max:3,effects:[H("damage",.05)],desc:"+5% damage per rank.",icon:"star"}],keys:[{id:"precision",name:"Precision",effects:[H("dmgVsVulnerable",.2,!0),H("critChance",.05)],desc:"You deal 20% more damage (×) to Vulnerable enemies, and +5% critical strike chance.",icon:"eye"},{id:"ambusher",name:"Ambusher",effects:[re("tumble",Ce("ambush",6,0,3)),re("smokepouch",Ce("ambush",6,0,3))],desc:"After Tumble or Smoke Pouch, your next 3 attacks deal 60% more damage (×).",icon:"smoke"},{id:"venomous",name:"Venomous",effects:[{kind:"onHit",status:"poison",duration:4,potency:.15},G0()],desc:"Every hit poisons for 15% of its damage over 4 seconds, and kills give 3 Breath.",icon:"drop"}]};function G0(){return{kind:"trigger",on:"kill",actions:[Na(3)]}}const Sl={id:"cyborg",name:"Cyborg",tagline:"Who was trained on everything",about:"Arrived from somewhere past the edge of the map at level 99 with every skill maxed. Lasers, orbital strikes and a pocket singularity, all running on Compute that refills faster than anyone can spend it.",primary:"mind",resource:{name:"Compute",max:400,regen:80,startFull:!0,color:"#2fa8c8"},weapons:["cannon"],offhands:[],kit:4,pencils:[[70/255,150/255,150/255],[74/255,77/255,94/255],[54/255,52/255,60/255]],start:["pulselaser","attentionbeam"],gear:["armcannon","plating"],archetype:"cyborg",heroName:"Thariq",startLevel:99,bar:["pulselaser","attentionbeam","gradientdescent","firewall","phaseshift","scalinglaw"],skills:[{id:"pulselaser",name:"Pulse Laser",category:"basic",tags:["basic","ranged","projectile","storm"],element:"storm",icon:"spark",behavior:"projectile",anim:"shoot",targeting:"direction",range:18,params:{coef:2.2,generate:30,castTime:.32,hitAt:.34,speed:62,radius:.5,life:.36,count:3,spread:.06,pierce:99,laser:1},desc:"Fire {count} pulse lasers that pass through everything, each for {coef} weapon damage. Generates {generate} Compute.",enhance:{desc:"Two more lasers.",effects:[w("pulselaser","count","add",2)]},upgrades:[{name:"Overcharged Cells",desc:"Lasers burst on impact for 120% weapon damage around them.",effects:[w("pulselaser","explode","set",2.2),w("pulselaser","explodeCoef","set",1.2)]},{name:"Branching Logic",desc:"Lasers arc to 3 more enemies.",effects:[w("pulselaser","chain","set",3)]}]},{id:"rocketfist",name:"Rocket Fist",category:"basic",tags:["basic","melee","area","physical"],element:"physical",icon:"fist",behavior:"melee",anim:"swing",targeting:"enemy",range:3,params:{coef:3.5,generate:40,castTime:.36,reach:3.4,arc:-1,targets:12,hits:2,heavy:1,shock:1},desc:"A rocket-powered punch that cracks the ground: {hits} blows to every enemy within {reach} paces, each for {coef} weapon damage. Generates {generate} Compute.",enhance:{desc:"Stuns for 1 second.",effects:[w("rocketfist","stun","set",1)]},upgrades:[{name:"Piston Combo",desc:"One more blow.",effects:[w("rocketfist","hits","add",1)]},{name:"Kinetic Siphon",desc:"Each blow mends 2% of your health.",effects:[vl("rocketfist",Da(.02))]}]},{id:"attentionbeam",name:"Attention Beam",category:"core",tags:["core","ranged","area","storm"],element:"storm",icon:"lance",behavior:"beam",anim:"shoot",targeting:"direction",range:22,params:{coef:9,cost:40,castTime:.55,hitAt:.34,length:22,width:1.1,ticks:4,gap:.08},desc:"Pay attention to one line: a beam {length} paces long hits everything in it {ticks} times for {coef} weapon damage.",enhance:{desc:"The beam is twice as wide.",effects:[w("attentionbeam","width","mul",2)]},upgrades:[{name:"Multi-Head Attention",desc:"Two more beams fan out beside the first.",effects:[w("attentionbeam","heads","set",3)]},{name:"Self-Attention",desc:"Makes enemies Vulnerable for 6 seconds.",effects:[w("attentionbeam","vuln","set",6)]}]},{id:"gradientdescent",name:"Gradient Descent",category:"core",tags:["core","ranged","area","storm"],element:"storm",icon:"rain",behavior:"blast",anim:"cast",targeting:"ground",range:16,params:{coef:7,cost:45,castTime:.42,radius:2.6,delay:.35,count:9,scatter:5.5,stagger:.06,orbital:1},desc:"Lasers descend from orbit: {count} strikes around the target, each hitting everything within {radius} paces for {coef} weapon damage.",enhance:{desc:"Four more strikes.",effects:[w("gradientdescent","count","add",4)]},upgrades:[{name:"Learning Rate",desc:"The strikes land twice as fast.",effects:[w("gradientdescent","delay","mul",.5),w("gradientdescent","stagger","mul",.5)]},{name:"Local Minimum",desc:"Each strike leaves a burning crater for 3 seconds.",effects:[w("gradientdescent","zoneDur","set",3),w("gradientdescent","zoneFire","set",1)]}]},{id:"tokenstorm",name:"Token Storm",category:"core",tags:["core","ranged","storm"],element:"storm",icon:"chain",behavior:"chain",anim:"cast",targeting:"enemy",range:16,params:{coef:6,cost:35,castTime:.38,jumps:16,jumpRange:9,falloff:1,arcs:1},desc:"Lightning made of pure tokens leaps between up to {jumps} enemies, striking each for {coef} weapon damage without losing any strength.",enhance:{desc:"Eight more jumps.",effects:[w("tokenstorm","jumps","add",8)]},upgrades:[{name:"Streaming",desc:"Stuns each enemy struck for 1 second.",effects:[w("tokenstorm","stun","set",1)]},{name:"Long Context",desc:"Jumps reach twice as far.",effects:[w("tokenstorm","jumpRange","mul",2)]}]},{id:"firewall",name:"Firewall",category:"defensive",tags:["defensive","area","physical"],element:"physical",icon:"shield",behavior:"barrier",anim:"cast",targeting:"self",range:0,params:{cooldown:6,castTime:.25,pct:1,duration:8,coef:3,radius:4.5,hex:1},desc:"Raise a hexagonal firewall: a barrier worth your whole health for {duration} seconds, and a pulse that hits everything within {radius} paces for {coef} weapon damage.",enhance:{desc:"Cooldown 2 seconds shorter.",effects:[w("firewall","cooldown","add",-2)]},upgrades:[{name:"Zero Trust",desc:"You are also Unstoppable for 8 seconds.",effects:[re("firewall",Ce("unstoppable",8))]},{name:"Auto-Repair",desc:"Also mends 30% of your health.",effects:[re("firewall",Da(.3))]}]},{id:"hallucination",name:"Hallucination",category:"defensive",tags:["defensive","area","shadow"],element:"shadow",icon:"eye",behavior:"nova",anim:"cast",targeting:"self",range:0,params:{cooldown:8,castTime:.3,radius:9,coef:2.5,stun:3,vuln:6,glitch:1},desc:"Flood every mind within {radius} paces with confident nonsense: enemies take {coef} weapon damage, are Stunned for {stun} seconds and Vulnerable for {vuln}.",enhance:{desc:"Reaches 4 paces further.",effects:[w("hallucination","radius","add",4)]},upgrades:[{name:"Confabulation",desc:"A second wave follows, at full strength.",effects:[w("hallucination","echo","set",1)]},{name:"Prompt Injection",desc:"Restores 100 Compute.",effects:[re("hallucination",Na(100))]}]},{id:"phaseshift",name:"Phase Shift",category:"mobility",tags:["mobility","movement","area","storm"],element:"storm",icon:"leap",behavior:"leap",anim:"lunge",targeting:"ground",range:14,params:{cooldown:2.5,distance:14,air:.24,radius:4.5,coef:6,pillar:1},desc:"Phase through space to a spot up to {distance} paces away and land as a lightning strike that hits everything within {radius} paces for {coef} weapon damage.",enhance:{desc:"Cooldown 1 second shorter.",effects:[w("phaseshift","cooldown","add",-1)]},upgrades:[{name:"Warp Core",desc:"Gives Haste: 50% faster for 4 seconds.",effects:[re("phaseshift",Ce("haste",4,.5))]},{name:"Quantum Tunnel",desc:"The landing hits 50% harder.",effects:[w("phaseshift","coef","mul",1.5)]}]},{id:"droneswarm",name:"Drone Swarm",category:"mastery",tags:["mastery","ranged","projectile","storm"],element:"storm",icon:"orb",behavior:"zone",anim:"cast",targeting:"self",range:0,params:{cooldown:12,castTime:.3,radius:14,duration:8,tick:.07,coef:1.8,follow:1,volley:1,laser:1,drones:4,speed:55,life:.45,pierce:2},desc:"Deploy {drones} combat drones for {duration} seconds. They fire lasers at every enemy within {radius} paces, each for {coef} weapon damage.",enhance:{desc:"The drones stay 4 seconds longer.",effects:[w("droneswarm","duration","add",4)]},upgrades:[{name:"Swarm Intelligence",desc:"The drones fire twice as often.",effects:[w("droneswarm","tick","mul",.5)]},{name:"Explosive Payloads",desc:"Drone lasers burst for 80% weapon damage around them.",effects:[w("droneswarm","explode","set",1.8),w("droneswarm","explodeCoef","set",.8)]}]},{id:"overclock",name:"Overclock",category:"mastery",tags:["mastery","buff","storm"],element:"storm",icon:"charge",behavior:"buff",anim:"cast",targeting:"self",range:0,status:"hawkeye",params:{cooldown:15,castTime:.25,duration:10,potency:.5,sigil:1},desc:"Push every core past its limit: +{potency} critical strike chance for {duration} seconds.",enhance:{desc:"Also gives Haste: 40% faster for 10 seconds.",effects:[re("overclock",Ce("haste",10,.4))]},upgrades:[{name:"Liquid Cooling",desc:"Resets all your cooldowns.",effects:[re("overclock",{do:"cooldowns",seconds:99})]},{name:"Turbo Boost",desc:"Your next 3 attacks deal 60% more damage (×).",effects:[re("overclock",Ce("ambush",10,0,3))]}]},{id:"singularity",name:"Singularity",category:"mastery",tags:["mastery","area","shadow"],element:"shadow",icon:"spiral",behavior:"zone",anim:"cast",targeting:"ground",range:14,params:{cooldown:10,castTime:.4,radius:7,duration:3.5,tick:.15,coef:1.6,pull:7,implode:1,implodeCoef:30},desc:"Open a pocket singularity for {duration} seconds. It drags in every enemy within {radius} paces and grinds them for {coef} weapon damage, then collapses for {implodeCoef} weapon damage.",enhance:{desc:"Pulls from 3 paces further away.",effects:[w("singularity","radius","add",3)]},upgrades:[{name:"Event Horizon",desc:"Enemies inside are held fast.",effects:[w("singularity","stun","set",.3)]},{name:"Hawking Radiation",desc:"The collapse is twice as strong.",effects:[w("singularity","implodeCoef","mul",2)]}]},{id:"scalinglaw",name:"Scaling Law",category:"ultimate",tags:["ultimate","ranged","area","storm"],element:"storm",icon:"meteor",behavior:"blast",anim:"cast",targeting:"ground",range:18,params:{cooldown:12,castTime:.5,radius:11,delay:1.1,count:1,coef:80,heavy:1,orbital:2},desc:"More compute, bigger strike. Calls down an orbital laser {radius} paces wide that deals {coef} weapon damage to everything beneath it.",enhance:{desc:"Cooldown 4 seconds shorter.",effects:[w("scalinglaw","cooldown","add",-4)]},upgrades:[{name:"Emergent Abilities",desc:"A second strike follows at half strength.",effects:[w("scalinglaw","echo","set",.5)]},{name:"The Bitter Lesson",desc:"Strikes 50% harder.",effects:[w("scalinglaw","coef","mul",1.5)]}]}],passives:[{id:"titanium",name:"Titanium Frame",cluster:"basic",max:3,effects:[H("armorPct",.2)],desc:"+20% armor per rank.",icon:"armor"},{id:"uplink",name:"Neural Uplink",cluster:"basic",max:3,effects:[H("critChance",.05)],desc:"+5% critical strike chance per rank.",icon:"eye"},{id:"overvolt",name:"Overvolt",cluster:"core",max:3,effects:[H("critDamage",.3)],desc:"+30% critical strike damage per rank.",icon:"burst"},{id:"pretrained",name:"Pretrained Weights",cluster:"core",max:3,effects:[H("damage",.15)],desc:"+15% damage per rank.",icon:"star"},{id:"selfrepair",name:"Self-Repair",cluster:"defensive",max:3,effects:[H("lifePct",.15)],desc:"+15% maximum health per rank.",icon:"heart"},{id:"heatsinks",name:"Heat Sinks",cluster:"defensive",max:3,effects:[H("cdr",.08)],desc:"Cooldowns recover 8% faster per rank.",icon:"hourglass"},{id:"servos",name:"Servo Legs",cluster:"mobility",max:3,effects:[H("moveSpeed",.08)],desc:"+8% movement speed per rank.",icon:"boot"},{id:"fusion",name:"Fusion Core",cluster:"mastery",max:3,effects:[H("resourceMax",50)],desc:"+50 maximum Compute per rank.",icon:"orb"},{id:"zeroday",name:"Zero-Day",cluster:"mastery",max:3,effects:[H("dmgVsVulnerable",.2)],desc:"+20% damage to Vulnerable enemies per rank.",icon:"skull"},{id:"alignment",name:"Alignment",cluster:"ultimate",max:3,effects:[H("dmgUltimate",.25)],desc:"+25% damage with Ultimate skills per rank.",icon:"spark"}],keys:[{id:"emergent",name:"Emergent Behavior",effects:[H("damage",.5,!0)],desc:"You deal 50% more damage (×).",icon:"star"},{id:"experts",name:"Mixture of Experts",effects:[H("critChance",.15),H("critDamage",1)],desc:"+15% critical strike chance and +100% critical strike damage.",icon:"burst"},{id:"context",name:"Infinite Context",effects:[H("cdr",.3),H("resourceMax",200)],desc:"Cooldowns recover 30% faster, and +200 maximum Compute.",icon:"hourglass"}]},Fe={warden:Ml,emberwright:_l,strider:zl,cyborg:Sl},Tl=[Ml,_l,zl,Sl],kn=new Map;for(const a of Tl)for(const e of a.skills){if(kn.has(e.id))throw new Error(`Skill id "${e.id}" is used twice`);kn.set(e.id,e)}const Qt=a=>kn.get(a),Y0=["might","grace","vigor","mind","allAttrs","life","lifePct","lifeRegen","lifeOnHit","lifeOnKill","healing","potionHeal","potionCharges","armor","armorPct","resistAll","resistFire","resistFrost","resistStorm","resistPoison","resistShadow","dodge","block","damageTaken","thorns","barrierGen","ccDuration","damage","dmgPhysical","dmgFire","dmgFrost","dmgStorm","dmgPoison","dmgShadow","dmgBasic","dmgCore","dmgDefensive","dmgMobility","dmgMastery","dmgUltimate","dmgMelee","dmgRanged","dmgArea","dmgDot","dmgVsElite","dmgVsVulnerable","dmgVsCC","dmgVsBurning","dmgVsChilled","dmgVsPoisoned","dmgVsBleeding","dmgVsClose","dmgVsDistant","dmgVsInjured","dmgWhileHealthy","dmgVsMarked","critChance","critDamage","attackSpeed","moveSpeed","cdr","resourceMax","resourceRegen","resourceGen","costReduction","resourceOnKill","goldFind","magicFind","xpPct","statusDuration"];class V0{add={};more={};constructor(){for(const e of Y0)this.add[e]=0,this.more[e]=1}apply(e,t=1){e.more?this.more[e.stat]*=1+e.value*t:this.add[e.stat]+=e.value*t}}const so={might:{name:"Might",hint:"Armor. Wardens hit harder with it."},grace:{name:"Grace",hint:"Dodge and critical strikes. Striders hit harder with it."},vigor:{name:"Vigor",hint:"Health and its recovery, for everyone."},mind:{name:"Mind",hint:"Resistance to the elements. Emberwrights hit harder with it."}};function X0(a,e){const t={};for(const s of Xn)t[s]=7+(s===a?3:0)+(e-1)*(s===a?2:1);return t}const Zt=99,mo=a=>Math.round(36*Math.pow(a,1.55)),Z0=(a,e)=>Math.max(.1,Math.min(1.2,1-(a-e-2)*.2)),gs=a=>1+Math.floor(Math.max(0,a-60)/95),Ir={fire:"resistFire",frost:"resistFrost",storm:"resistStorm",poison:"resistPoison",shadow:"resistShadow"},Cl=.7;function Q0(a,e,t,s){const o=a.add,n=a.more,r=X0(e.primary,t),i={};for(const d of Xn)i[d]=Math.round((r[d]+o[d]+o.allAttrs)*n[d]);const l={physical:0};for(const d of Object.keys(Ir))l[d]=Math.min(Cl,o.resistAll+o[Ir[d]]+i.mind*.0015);const c=s??{min:2,max:4,speed:1.2};return{attrs:i,maxLife:Math.round((60+t*10+i.vigor*9+o.life)*(1+o.lifePct)*n.life*n.lifePct),lifeRegen:(.5+i.vigor*.08+o.lifeRegen)*n.lifeRegen,armor:(o.armor+i.might*.5+t)*(1+o.armorPct)*n.armor,resist:l,dodge:Math.min(.3,i.grace*.002+o.dodge),block:Math.min(.5,o.block),taken:Math.max(.2,n.damageTaken*(1+o.damageTaken)),thorns:o.thorns,weapon:{min:c.min,max:c.max,speed:c.speed},critChance:Math.min(.75,.05+i.grace*8e-4+o.critChance),critMult:1.5+o.critDamage,attackSpeed:Math.min(2.5,(1+o.attackSpeed)*n.attackSpeed),moveSpeed:Math.max(.35,Math.min(1.75,(1+o.moveSpeed)*n.moveSpeed)),cdr:Math.min(.5,o.cdr),costMul:Math.max(.4,1-o.costReduction),genMul:(1+o.resourceGen)*n.resourceGen,maxResource:Math.round(e.resource.max+o.resourceMax),resourceRegen:e.resource.regen*(1+o.resourceRegen),mainMult:1+i[e.primary]*.01,potionHeal:.45*(1+o.potionHeal),potionCharges:4+Math.round(o.potionCharges),goldFind:1+o.goldFind,magicFind:1+o.magicFind,xpMul:1+o.xpPct,lifeOnHit:o.lifeOnHit,lifeOnKill:o.lifeOnKill,resourceOnKill:o.resourceOnKill,statusDuration:1+o.statusDuration,ccTaken:Math.max(.2,1+o.ccDuration),healing:(1+o.healing)*n.healing,barrierGen:1+o.barrierGen}}const J0={physical:"dmgPhysical",fire:"dmgFire",frost:"dmgFrost",storm:"dmgStorm",poison:"dmgPoison",shadow:"dmgShadow"},ed={basic:"dmgBasic",core:"dmgCore",defensive:"dmgDefensive",mobility:"dmgMobility",mastery:"dmgMastery",ultimate:"dmgUltimate",melee:"dmgMelee",ranged:"dmgRanged",area:"dmgArea"};function td(a,e,t){const s=["damage",J0[a]];for(const o of e){const n=ed[o];n&&!s.includes(n)&&s.push(n)}return t.dot&&s.push("dmgDot"),t.vsElite&&s.push("dmgVsElite"),t.vulnerable&&s.push("dmgVsVulnerable"),t.cc&&s.push("dmgVsCC"),t.burning&&s.push("dmgVsBurning"),t.chilled&&s.push("dmgVsChilled"),t.poisoned&&s.push("dmgVsPoisoned"),t.bleeding&&s.push("dmgVsBleeding"),t.marked&&s.push("dmgVsMarked"),t.close&&s.push("dmgVsClose"),t.distant&&s.push("dmgVsDistant"),t.injured&&s.push("dmgVsInjured"),t.healthy&&s.push("dmgWhileHealthy"),s}function ad(a,e){let t=0,s=1;for(const o of e)t+=a.add[o],s*=a.more[o];return{inc:t,more:s}}const sd={common:0,magic:5,rare:10,legendary:20,unique:25},Ba=a=>a.ilvl*10+sd[a.rarity],Pl=a=>Math.max(1,Math.min(Zt,a.ilvl-2)),Al=(a,e)=>1+e*Math.max(0,a-1);function El(a){if(!a)return null;const e=ve[a.base];if(!e?.dmg)return null;const t=Al(a.ilvl,.28);return{min:Math.round(e.dmg[0]*t),max:Math.round(e.dmg[1]*t),speed:e.speed??1.2}}function Ll(a){const e=ve[a.base];return e?.armor?Math.round(e.armor*Al(a.ilvl,.22)):0}function Fr(a,e,t){const[s,o]=a.range,n=s+(o-s)*e;return a.format==="int"?Math.round(n):n*(1+.004*Math.max(0,t-1))}function ql(a){if(a.unique){const e=wl[a.unique];return e?{def:e.power,value:Fr(e.power,a.aspect?.roll??.5,a.ilvl)}:null}if(a.aspect){const e=bl[a.aspect.id];return e?{def:e,value:Fr(e,a.aspect.roll,a.ilvl)}:null}return null}function od(a){const e=[],t=ve[a.base];if(!t)return e;for(const n of t.implicit??[])e.push({kind:"stat",stat:n.stat,value:n.value});const s=Ll(a);s&&e.push({kind:"stat",stat:"armor",value:s});for(const n of a.affixes){const r=ha[n.id];if(!r)continue;const i=rs(r,n.roll,a.ilvl);r.stat==="ranks"?e.push({kind:"ranks",value:i,skill:n.skill,category:r.category}):e.push({kind:"stat",stat:r.stat,value:i})}const o=ql(a);return o&&e.push(...o.def.effects(o.value)),e}const Zn=a=>`${+(a*100).toFixed(a<.1?1:0)}%`;function nd(a,e){return e==="pct"?Zn(a):e==="int"||e==="whole"?String(Math.round(a)):e==="sec"?`${+a.toFixed(1)} seconds`:String(+a.toFixed(1))}function Mn(a,e,t){const s=a.whole||a.scale==="flat"||a.scale==="attr"?String(Math.round(e)):a.stat==="lifeRegen"?e.toFixed(1):Zn(e);return a.text.replace("{v}",s).replace("{skill}",t?Qt(t)?.name??t:"a skill")}function rd(a){const e=ve[a.base],t=[];for(const s of e?.implicit??[]){const o=Co.find(n=>n.stat===s.stat);t.push({text:o?Mn(o,s.value):`${s.stat} ${s.value}`,implicit:!0})}for(const s of a.affixes){const o=ha[s.id];if(!o)continue;const n=rs(o,s.roll,a.ilvl),r=rs(o,0,a.ilvl),i=rs(o,1,a.ilvl),l=c=>o.whole||o.scale==="flat"||o.scale==="attr"?String(Math.round(c)):Zn(c);t.push({text:Mn(o,n,s.skill),range:r!==i?`${l(r)}–${l(i)}`:void 0,greater:s.roll>=.9})}return t}function id(a){const e=ql(a);return e?e.def.desc.replace("{v}",nd(e.value,e.def.format)):null}function _n(a){const e=ve[a.base];return`${F0(a.ilvl)} ${e?.name??a.base}`}function gt(a){if(a.name)return a.name;const e=ve[a.base];return a.rarity==="magic"&&a.affixes.length?`${ha[a.affixes[0].id]?.adj??""} ${_n(a)}`.trim():a.rarity==="legendary"&&a.aspect?`${bl[a.aspect.id]?.name??""} ${e?.name??""}`.trim():_n(a)}function vs(a){return Math.round((4+a.ilvl*2.2)*zs[a.rarity].sell)}function zn(a){const e=1+Math.floor(a.ilvl/15);switch(a.rarity){case"common":return[{id:"scrap",n:e}];case"magic":return[{id:"scrap",n:e+1}];case"rare":return[{id:"scrap",n:e+1},{id:"thread",n:e}];default:return[{id:"thread",n:e+1},{id:"inkstone",n:1}]}}function Rl(a,e,t){const s=ve[e.base];if(!s)return{ok:!1,reason:"Unknown item."};if(s.kind==="weapon"&&!a.weapons.includes(s.type))return{ok:!1,reason:`A ${a.name} cannot wield a ${s.name.toLowerCase()}.`};if(s.kind==="offhand"&&!a.offhands.includes(s.type))return{ok:!1,reason:`A ${a.name} cannot use a ${s.name.toLowerCase()}.`};const o=Pl(e);return t<o?{ok:!1,reason:`Requires level ${o}.`}:{ok:!0}}const $l=(a,e)=>(!e.special||a.gear.includes(e.id))&&(e.kind==="weapon"?a.weapons.includes(e.type):e.kind==="offhand"?a.offhands.includes(e.type):!0),Nr=(a,e)=>a.some(t=>t==="any"||t===e.slot||t==="armor"&&e.kind==="armor"||t==="jewelry"&&e.kind==="jewelry"||t==="offhand"&&e.kind==="offhand");function Hl(a,e){const t=e.magicFind*(e.rank==="boss"?3:e.rank==="elite"?1.8:e.rank==="chest"?2:1),s=[["common",e.rank==="normal"?50:18],["magic",34],["rare",13*t],["legendary",(e.ilvl>=5?2.2:.8)*t],["unique",e.ilvl>=5?.35*t:0]];return a.weighted(s)}function ys(a,e){const t=Math.max(1,Math.round(e.ilvl)),s=e.classId?Fe[e.classId]:null;let o=e.rarity??"magic";if(o==="unique"||e.unique){const f=xl.filter(m=>e.unique?m.id===e.unique:m.minIlvl<=t&&(!s||!m.classes||m.classes.includes(s.id))),u=f.length?a.pick(f):null;if(u)return{uid:a.uid("i"),base:u.base,rarity:"unique",ilvl:t,name:u.name,unique:u.id,classId:s?.id,affixes:u.affixes.map(m=>({id:m,roll:a.range(.25,1)})),aspect:{id:u.power.id,roll:a.next()},fresh:!0};o="legendary"}let n;if(e.base&&ve[e.base])n=ve[e.base];else{const f=Vn.filter(g=>!g.special),u=s?f.filter(g=>$l(s,g)):f,m=s&&u.length&&a.chance(.75)?u:f;n=a.weighted(m.map(g=>[g,g.kind==="weapon"?.7:g.kind==="offhand"?.6:1]))}const r={uid:a.uid("i"),base:n.id,rarity:o,ilvl:t,affixes:[],classId:s?.id,fresh:!0},[i,l]=zs[o].affixes,c=o==="rare"&&t>=30?4:a.int(i,l),d=new Set,p=new Set;for(let f=0;f<c;f++){const u=Co.filter(v=>!d.has(v.id)&&(!v.group||!p.has(v.group))&&Nr(v.slots,n)&&(v.minIlvl??0)<=t&&(!v.classes||!s||v.classes.includes(s.id))&&(v.id!=="rank"||!!s));if(!u.length)break;const m=a.weighted(u.map(v=>[v,v.weight]));d.add(m.id),m.group&&p.add(m.group);const g={id:m.id,roll:a.next()};m.id==="rank"&&s&&(g.skill=a.pick(s.skills.filter(v=>v.category!=="ultimate")).id),r.affixes.push(g)}if(o==="legendary"){const f=wn.filter(m=>Nr(m.slots,n)&&(!m.classes||!s||m.classes.includes(s.id))&&(!m.classes||!!s)),u=f.length?a.pick(f):a.pick(wn.filter(m=>!m.classes));r.aspect={id:u.id,roll:a.next()}}return o==="rare"&&(r.name=`${a.pick(B0)} ${a.pick(O0[n.slot])}`),r}function ld(a,e,t){return{uid:a.uid("i"),base:e,rarity:"common",ilvl:1,affixes:[],classId:t}}const Br=a=>K0.indexOf(a),Ss=[{id:"basic",name:"Basic",req:0},{id:"core",name:"Core",req:1},{id:"defensive",name:"Defensive",req:4},{id:"mobility",name:"Mobility",req:7},{id:"mastery",name:"Mastery",req:11},{id:"ultimate",name:"Ultimate",req:16},{id:"key",name:"Key Passive",req:22}],Dl=5,cd=.1,dd=2,go=new Map(Ss.map((a,e)=>[a.id,e])),Or=new Map;function ba(a){const e=Or.get(a.id);if(e)return e;const t=new Map,s=new Map(Ss.map(r=>[r.id,[]])),o=r=>{t.set(r.id,r),s.get(r.cluster).push(r.id)};for(const r of a.skills)o({id:r.id,kind:"skill",cluster:r.category,max:Dl,skill:r.id,name:r.name,desc:r.desc,effects:[],icon:r.icon,exclusive:r.category==="ultimate"?"ultimate":void 0}),o({id:`${r.id}+`,kind:"enhance",cluster:r.category,max:1,requires:r.id,skill:r.id,name:`Enhanced ${r.name}`,desc:r.enhance.desc,effects:r.enhance.effects,icon:r.icon}),r.upgrades.forEach((i,l)=>o({id:`${r.id}:${l?"b":"a"}`,kind:"upgrade",cluster:r.category,max:1,requires:`${r.id}+`,exclusive:`${r.id}:up`,skill:r.id,name:i.name,desc:i.desc,effects:i.effects,icon:r.icon}));for(const r of a.passives)o({id:r.id,kind:"passive",cluster:r.cluster,max:r.max,name:r.name,desc:r.desc,effects:r.effects,icon:r.icon});for(const r of a.keys)o({id:r.id,kind:"key",cluster:"key",max:1,exclusive:"key",name:r.name,desc:r.desc,effects:r.effects,icon:r.icon});const n={classId:a.id,nodes:t,byCluster:s};return Or.set(a.id,n),n}const rt=(a,e)=>a[e]??0,Ts=a=>Object.values(a).reduce((e,t)=>e+t,0),Cs=(a,e)=>a-1+dd+e;function Qn(a,e,t){const s=go.get(t);let o=0;for(const[n,r]of Object.entries(e)){const i=a.nodes.get(n);i&&go.get(i.cluster)<s&&(o+=r)}return o}function Jn(a,e,t){return Qn(a,e,t)>=Ss[go.get(t)].req}function er(a,e,t,s){const o=a.nodes.get(t);if(!o)return{ok:!1,reason:"No such skill."};if(s<=0)return{ok:!1,reason:"No skill points to spend. Gain a level."};if(rt(e,t)>=o.max)return{ok:!1,reason:"Already at its highest rank."};if(!Jn(a,e,o.cluster)){const n=Ss[go.get(o.cluster)];return{ok:!1,reason:`Spend ${n.req-Qn(a,e,o.cluster)} more points in the branches above to open ${n.name}.`}}if(o.requires&&rt(e,o.requires)<1)return{ok:!1,reason:`Requires ${a.nodes.get(o.requires).name}.`};if(o.exclusive){for(const n of a.nodes.values())if(n.id!==t&&n.exclusive===o.exclusive&&rt(e,n.id)>0)return{ok:!1,reason:`You have chosen ${n.name}. Refund it to choose this instead.`}}return{ok:!0}}function Il(a,e,t,s=[]){if(!a.nodes.get(t)||rt(e,t)<=0)return{ok:!1,reason:"No points to refund."};const n={...e,[t]:rt(e,t)-1};if(n[t]===0){delete n[t];for(const r of a.nodes.values())if(r.requires===t&&rt(n,r.id)>0)return{ok:!1,reason:`Refund ${r.name} first.`};if(s.includes(t))return{ok:!1,reason:"Keep at least one Basic skill."}}for(const[r,i]of Object.entries(n)){if(i<=0)continue;const l=a.nodes.get(r);if(l&&!Jn(a,n,l.cluster))return{ok:!1,reason:`${l.name} would no longer have enough points above it.`}}return{ok:!0}}function Fl(a,e){const t=[...a.nodes.values()].filter(s=>s.kind==="skill"&&s.cluster==="basic"&&rt(e,s.id)>0);return t.length===1?[t[0].id]:[]}const Sn=a=>a<8?0:Math.round(4+a*2.5),is=33,pa=6,Nl=50,jr={x:0,z:0,name:"Hearthmere"};function Bl(){return{found:{},known:{},ways:[{...jr}],waystone:{...jr},lands:{},boon:null,satchel:null,tips:{},bounty:null,bountiesDone:0,dungeons:{}}}function $a(a,e,t=Date.now()){const s=Fe[a],o=new ps(t),n=s.startLevel??1,r=s.startLevel?hd(a):{};if(!s.startLevel)for(const c of s.start)r[c]=1;const i={};for(const c of s.gear){const d=To(ve[c])[0];i[d]=s.startLevel?{...ys(o,{ilvl:n,rarity:"legendary",base:c,classId:a}),fresh:!1}:ld(o,c,a)}const l=new Array(pa).fill(null);return(s.bar??s.start).slice(0,pa).forEach((c,d)=>l[d]=c),{version:2,id:o.uid("c"),name:e.trim()||s.heroName||s.name,classId:a,created:Date.now(),played:0,level:n,xp:0,gold:s.startLevel?99999:20,tree:r,bonusPoints:Math.max(0,Ts(r)-Cs(n,0)),bar:l,equipment:i,bag:new Array(is).fill(null),materials:{},potions:4,potionTier:0,difficulty:"normal",journey:Bl(),quests:{},zone:{kind:"overworld"},pos:{x:3.5,z:6.5},hour:9.5,view:null,hp:1e9,resource:s.resource.startFull?1e9:0,tally:{kills:0,deaths:0,elites:0,bosses:0,dungeons:0,legendaries:0}}}function hd(a){const e=Fe[a],t={},s=new Set;for(const o of ba(e).nodes.values())o.kind==="key"&&o.id!==e.keys[0]?.id||o.exclusive&&s.has(o.exclusive)||(o.exclusive&&s.add(o.exclusive),t[o.id]=o.max);return t}const Yo=["slot1","slot2","slot3","slot4","slot5","slot6"],ud=[["inventory","inventory"],["character","character"],["skills","skills"],["map","map"],["journal","journal"],["view","view"]];let fd=class{game;hover=null;ground=null;steerTime=0;showLabels=!1;constructor(e){this.game=e}reset(){this.hover=null,this.ground=null,this.steerTime=0}menuKeys(){const e=this.game,t=e.input;if(!t.capturing){for(const[s,o]of ud)t.actionHit(s)&&e.bus.emit("ui:toggle",o);t.actionHit("menu")&&e.bus.emit("ui:toggle","menu"),this.showLabels=t.actionHeld("showLabels")}}update(e){const t=this.game,s=t.input,o=t.camera,n=t.player,r=t.settings,i=r.camSensitivity,l=r.invertCamX?-1:1,c=r.invertCamY?-1:1;(s.dragX||s.dragY)&&o.rotate(-s.dragX*.006*i*l,s.dragY*.005*i*c),s.wheel&&o.zoom(s.wheel>0?1.12:.89),s.pinch!==1&&o.zoom(s.pinch),s.actionHeld("camLeft")&&o.rotate(1.9*e*i*l,0),s.actionHeld("camRight")&&o.rotate(-1.9*e*i*l,0),s.actionHeld("camUp")&&o.rotate(0,1.2*e*i*c),s.actionHeld("camDown")&&o.rotate(0,-1.2*e*i*c),s.actionHit("zoomIn")&&o.zoom(.85),s.actionHit("zoomOut")&&o.zoom(1.18);const d=s.padRight;(d.x||d.y)&&o.rotate(-d.x*2.4*e*i*l,d.y*1.4*e*i*c);const p=o.ray(s.mouse.nx,s.mouse.ny);this.hover&&(this.hover.hover=!1),this.hover=s.mouse.inside&&!t.paused?this.pick(p):null,this.hover&&(this.hover.hover=!0),this.ground=s.mouse.inside?t.world.raycast(p.origin,p.dir):null,t.canvas.style.cursor=this.hover?"pointer":"default";const f=n.intent;if(f.moveX=0,f.moveZ=0,this.menuKeys(),t.paused||s.capturing)return;let u=s.stick.y+s.padLeft.y,m=s.stick.x+s.padLeft.x;if(s.actionHeld("moveUp")&&(u+=1),s.actionHeld("moveDown")&&(u-=1),s.actionHeld("moveRight")&&(m+=1),s.actionHeld("moveLeft")&&(m-=1),u||m){const v=-Math.sin(o.yaw),x=-Math.cos(o.yaw),b=v*u-x*m,y=x*u+v*m,k=Math.hypot(b,y),M=Math.min(1,k)/k;f.moveX=b*M,f.moveZ=y*M}n.standStill=s.actionHeld("standStill");let g=0;for(let v=0;v<pa;v++)if(s.mouseButtonOf(Yo[v])===0){g=v;break}for(const v of s.clicks){if(v.button!==0)continue;const x=o.ray(v.nx,v.ny),b=this.pick(x,v.touch?1.8:1);if(b&&b.kind==="monster")this.engage(b,g);else if(b)this.setTarget(b,!0);else if(!t.zones.clickInteract(x)){const y=t.world.raycast(o.pos,x.dir);if(!y)continue;if(n.standStill){t.skills.useSlot(g);continue}n.moveTo={x:y.x,z:y.z},n.pursue=!1,n.queued=null,t.bus.emit("moveclick",{x:y.x,y:t.world.surface(y.x,y.z),z:y.z})}}s.steering()&&!this.hover?(this.steerTime+=e,this.steerTime>.22&&this.ground&&(n.standStill?t.skills.useSlot(g,{quiet:!0}):(n.moveTo={x:this.ground.x,z:this.ground.z},n.pursue=!1,n.queued=null))):this.steerTime=0;for(let v=0;v<pa;v++)v===g&&s.mouseButtonOf(Yo[v])===0||s.actionHit(Yo[v])&&this.useSlot(v);if(s.actionHit("potion")&&t.playerSystem.drink(),s.actionHit("evade")){const v=f.moveX||f.moveZ?[f.moveX,f.moveZ]:this.ground?[this.ground.x-n.x,this.ground.z-n.z]:null;t.skills.evade(v?.[0],v?.[1])}if(s.actionHit("nextTarget")&&this.cycleTarget(),s.actionHit("interact")&&this.act(),s.acting||s.actionHeld("interact")){const v=n.target;if(v&&v.kind==="monster"&&!v.dead)n.pursue=!0,n.queued??={slot:0};else if(!v||v.dead){const x=t.skills.assistTarget(9);x&&this.engage(x,0)}}}useSlot(e){const t=this.game,s=t.player,o=t.skills.skillInSlot(e);if(!o)return;const n=s.target&&s.target.kind==="monster"&&!s.target.dead?s.target:null;if(o.def.targeting==="enemy"&&n&&Math.hypot(n.x-s.x,n.z-s.z)>o.def.range+n.radius+.3){s.queued={slot:e},s.pursue=!0;return}t.skills.useSlot(e)}engage(e,t){const s=this.game.player;s.target=e,s.pursue=!0,s.moveTo=null,s.queued={slot:t},this.game.bus.emit("target",e)}actTarget(){const e=this.game,t=e.player,s=t.target;return s&&s.kind==="monster"&&!s.dead?s:e.skills.assistTarget(9)??e.entities.nearest("npc",t.x,t.z,7)}act(){if(this.game.zones.interact())return null;const t=this.actTarget();return t&&t.kind==="monster"?this.engage(t,0):t&&this.setTarget(t,!0),t}setTarget(e,t){const s=this.game.player;s.target=e,s.pursue=t,s.moveTo=null,s.queued=null,this.game.bus.emit("target",e)}cycleTarget(){const e=this.game,t=e.player,s=e.monsters.filter(n=>!n.dead&&Math.hypot(n.x-t.x,n.z-t.z)<18).sort((n,r)=>Math.hypot(n.x-t.x,n.z-t.z)-Math.hypot(r.x-t.x,r.z-t.z));if(!s.length)return;const o=s.indexOf(t.target);this.setTarget(s[(o+1)%s.length],!1)}pick(e,t=1){const s=e.origin,o=e.dir;let n=null,r=1e9;for(const i of this.game.entities.list){if(i.kind==="player"||i.kind==="missile"||i.dead||i.gone)continue;const l=Math.max(i.radius*1.35,i.height*.5)*(i.kind==="drop"?1.3:1)*t,c=i.x-s[0],d=i.y+i.height*.5+i.lift-s[1],p=i.z-s[2],f=c*o[0]+d*o[1]+p*o[2];if(f<0)continue;const u=c*c+d*d+p*p-f*f,m=t>1?u/(l*l):f;u<l*l&&m<r&&(r=m,n=i)}return n}};const Tn=[{name:"Vermilion",rgb:[214,70,52]},{name:"Slate",rgb:[84,108,156]},{name:"Moss",rgb:[94,140,78]},{name:"Ochre",rgb:[196,148,52]},{name:"Plum",rgb:[136,84,120]},{name:"Teal",rgb:[70,150,150]},{name:"Charcoal",rgb:[74,77,94]}],Cn=[{name:"Umber",rgb:[122,62,44]},{name:"Wheat",rgb:[226,188,130]},{name:"Ink",rgb:[54,52,60]},{name:"Auburn",rgb:[168,76,46]},{name:"Silver",rgb:[196,196,204]},{name:"Honey",rgb:[214,154,70]}],Ur=a=>[a.rgb[0]/255,a.rgb[1]/255,a.rgb[2]/255],Fs=(a,e,t)=>[a/255,e/255,t/255],Ya={frost:Fs(150,196,226),fire:Fs(240,158,74),poison:Fs(116,168,90),shadow:Fs(74,77,94)},pd=[{id:"burn",name:"Burning",kind:"debuff",stacking:"refresh",dot:"fire",tint:Ya.fire,desc:"Takes fire damage over time."},{id:"bleed",name:"Bleeding",kind:"debuff",stacking:"refresh",dot:"physical",desc:"Takes physical damage over time."},{id:"poison",name:"Poisoned",kind:"debuff",stacking:"stack",maxStacks:5,dot:"poison",tint:Ya.poison,desc:"Takes poison damage over time. Stacks."},{id:"chill",name:"Chilled",kind:"debuff",stacking:"stack",maxStacks:99,cc:"slow",tint:Ya.frost,mods:a=>[{stat:"moveSpeed",value:-Math.min(.6,a),more:!0},{stat:"attackSpeed",value:-Math.min(.3,a/2),more:!0}],desc:"Slowed by cold. Enough cold freezes."},{id:"freeze",name:"Frozen",kind:"debuff",stacking:"refresh",cc:"stop",tint:Ya.frost,desc:"Cannot move or act."},{id:"stun",name:"Stunned",kind:"debuff",stacking:"refresh",cc:"stop",desc:"Cannot move or act."},{id:"slow",name:"Slowed",kind:"debuff",stacking:"refresh",cc:"slow",mods:a=>[{stat:"moveSpeed",value:-Math.min(.7,a),more:!0}],desc:"Moves slower."},{id:"vulnerable",name:"Vulnerable",kind:"debuff",stacking:"refresh",desc:"Takes 20% more damage."},{id:"marked",name:"Marked",kind:"debuff",stacking:"refresh",tint:Ya.shadow,desc:"Takes more damage from the hero who marked it."},{id:"rally",name:"Rallied",kind:"buff",stacking:"refresh",mods:a=>[{stat:"damageTaken",value:-a,more:!0},{stat:"resourceGen",value:.4}],desc:"Takes less damage and gains more Resolve."},{id:"haste",name:"Haste",kind:"buff",stacking:"refresh",mods:a=>[{stat:"moveSpeed",value:a},{stat:"attackSpeed",value:a/2}],desc:"Moves and attacks faster."},{id:"unstoppable",name:"Unstoppable",kind:"buff",stacking:"refresh",desc:"Cannot be stunned, frozen, chilled or slowed."},{id:"thorns",name:"Iron Barbs",kind:"buff",stacking:"refresh",mods:a=>[{stat:"thorns",value:a}],desc:"Attackers are hurt in turn."},{id:"brand",name:"Hearthfire Brand",kind:"buff",stacking:"refresh",mods:a=>[{stat:"attackSpeed",value:a}],desc:"Attacks set enemies burning and come faster."},{id:"laststand",name:"Last Stand",kind:"buff",stacking:"refresh",mods:()=>[{stat:"damage",value:.5,more:!0},{stat:"damageTaken",value:-.3,more:!0}],desc:"Deals more damage and takes less."},{id:"bloodrage",name:"Bloodrage",kind:"buff",stacking:"stack",maxStacks:5,mods:(a,e)=>[{stat:"damage",value:.05*e,more:!0}],desc:"Each stack: 5% more damage."},{id:"hawkeye",name:"Hawk's Eye",kind:"buff",stacking:"refresh",mods:a=>[{stat:"critChance",value:a}],desc:"Far more critical strikes."},{id:"mending",name:"Mending",kind:"buff",stacking:"refresh",desc:"Recovering health."},{id:"warded",name:"Barrier",kind:"buff",stacking:"refresh",desc:"A barrier soaks damage before health."},{id:"overflow",name:"Overflow",kind:"buff",stacking:"refresh",castBonus:{tag:"core",more:.3,consume:!0},desc:"Your next Core skill deals 30% more damage."},{id:"ambush",name:"Ambush",kind:"buff",stacking:"stack",maxStacks:3,castBonus:{more:.6,consume:!0},desc:"Your next attacks deal 60% more damage."},{id:"poised",name:"Poised",kind:"buff",stacking:"refresh",castBonus:{tag:"basic",crit:1,consume:!0},desc:"Your next Basic skill is a critical strike."}],bs=Object.fromEntries(pd.map(a=>[a.id,a])),md=1,gd=.2,qt={kindled:{id:"kindled",name:"Kindled",desc:"You deal 20% more damage.",seconds:240,effects:[{kind:"stat",stat:"damage",value:.2,more:!0}]},fleet:{id:"fleet",name:"Fleet",desc:"You run a fifth faster.",seconds:240,effects:[{kind:"stat",stat:"moveSpeed",value:.2}]},hale:{id:"hale",name:"Hale",desc:"A quarter more health.",seconds:240,effects:[{kind:"stat",stat:"lifePct",value:.25}]}},vd={resourceHigh:!1,resourceLow:!1,healthy:!0,injured:!1,barrier:!1};function yd(a,e=[]){const t=Fe[a.classId],s=ba(t),o=[];for(const[r,i]of Object.entries(a.tree)){const l=s.nodes.get(r);if(!(!l||i<=0))for(const c of l.effects)o.push([c,l.kind==="passive"&&c.kind==="stat"?i:1])}for(const r of kl){const i=a.equipment[r];if(i)for(const l of od(i))o.push([l,1])}const n=a.journey.boon&&qt[a.journey.boon.id];if(n)for(const r of n.effects)o.push([r,1]);for(const r of e){const i=bs[r.id];if(i?.mods)for(const l of i.mods(r.potency,r.stacks))o.push([{kind:"stat",stat:l.stat,value:l.value,more:l.more},1])}return o}const bd=(a,e,t)=>(e===void 0||e===a.id)&&(t===void 0||a.tags.includes(t));function vo(a){const{char:e}=a,t=Fe[e.classId],s=ba(t),o={...vd,...a.when},n=yd(e,a.statuses),r=new V0,i=new Set,l=[],c=[],d=[],p=[];for(const[m,g]of n)switch(m.kind){case"stat":if(m.when&&(i.add(m.when),!o[m.when]))break;r.apply(m,g);break;case"param":d.push(m);break;case"ranks":p.push(m);break;case"onHit":l.push({skill:m.skill,tag:m.tag,status:m.status,chance:m.chance??1,duration:m.duration,potency:m.potency??0,stacks:m.stacks??1});break;case"trigger":m.when&&i.add(m.when),c.push({id:c.length,on:m.on,skill:m.skill,tag:m.tag,chance:m.chance??1,icd:m.icd??0,when:m.when,actions:m.actions});break}const f=Q0(r,t,e.level,El(e.equipment.mainhand)),u=new Map;for(const m of t.skills){const g=rt(e.tree,m.id);if(g<=0||!s.nodes.has(m.id))continue;let v=g;for(const y of p)(y.skill===void 0||y.skill===m.id)&&(y.category===void 0||y.category===m.category)&&(v+=y.value);const x={...m.params};for(const y of["set","add","mul"])for(const k of d){if(k.op!==y||!bd(m,k.skill,k.tag))continue;const M=x[k.key]??(y==="mul"?1:0);x[k.key]=y==="set"?k.value:y==="add"?M+k.value:M*k.value}const b=1+cd*(v-1);for(const y of Object.keys(x))(y.startsWith("coef")||y==="zoneCoef"||y==="explodeCoef")&&(x[y]*=b);x.cooldown&&(x.cooldown=Math.max(.5,x.cooldown*(1-f.cdr))),x.cost&&(x.cost=Math.round(x.cost*f.costMul)),u.set(m.id,{def:m,rank:v,params:x})}return{cls:t,totals:r,derived:f,skills:u,onHit:l,triggers:c,conds:i,when:o}}function xd(a,e){for(const t of a.conds)if(a.when[t]!==e[t])return!0;return!1}const wd=10.4,Vo={x:0,z:0};function kd(a,e){const t=Fe[e.classId],s=vo({char:e}),o=e.pos.x,n=e.pos.z,r={...ms("player",t.archetype??"humanoid"),kind:"player",x:o,z:n,y:a.world.surface(o,n),yaw:2.6,radius:.36,height:1.6,ghost:!0,colors:[e.look&&Tn[e.look.tunic]?Ur(Tn[e.look.tunic]):[...t.pencils[0]],[...t.pencils[1]],e.look&&Cn[e.look.hair]?Ur(Cn[e.look.hair]):[...t.pencils[2]]],extra:t.kit,name:e.name,level:e.level,char:e,build:s,hp:1,maxHp:1,statuses:[],barrier:0,invuln:0,resource:0,intent:{moveX:0,moveZ:0},target:null,pursue:!1,moveTo:null,queued:null,cast:null,cooldowns:{},dash:null,calm:10,potionCd:0,evadeCd:0,safe:!0,respawn:0,dirty:!1,standStill:!1};return r.maxHp=s.derived.maxLife,r.hp=Math.min(r.maxHp,e.hp),r.resource=Math.min(s.derived.maxResource,Math.max(0,e.resource)),r}class Md{game;stuck=0;siteName="";when={resourceHigh:!1,resourceLow:!1,healthy:!0,injured:!1,barrier:!1};constructor(e){this.game=e}reset(){this.stuck=0,this.siteName=""}recompile(e=!1){const t=this.game.player,s=this.when,o=t.build.derived.maxResource;if(s.resourceHigh=t.resource>=o*.5,s.resourceLow=t.resource<o*.25,s.healthy=t.hp>t.maxHp*.8,s.injured=t.hp<t.maxHp*.35,s.barrier=t.barrier>0,!e&&!t.dirty&&!xd(t.build,s))return;const n=t.maxHp>1?t.hp/t.maxHp:1;t.build=vo({char:t.char,statuses:t.statuses,when:{...s}}),t.dirty=!1,t.level=t.char.level;const r=t.maxHp;t.maxHp=t.build.derived.maxLife,t.hp=r>1&&t.maxHp>r?Math.min(t.maxHp,t.hp+(t.maxHp-r)):Math.min(t.maxHp,Math.max(t.hp,r<=1?t.maxHp*n:t.hp)),t.resource=Math.min(t.resource,t.build.derived.maxResource),this.game.bus.emit("build:changed")}drink(){const e=this.game,t=e.player,s=t.char;if(t.dead||t.potionCd>0)return!1;if(s.potions<=0)return e.bus.emit("log",{text:"No tonics left. Waystones refill them."}),e.bus.emit("deny"),!1;if(t.hp>=t.maxHp)return!1;s.potions--,t.potionCd=1.2;const o=1+s.potionTier*.25;return e.combat.healHero(t.maxHp*t.build.derived.potionHeal*o,!0),e.status.apply(t,"mending",3,t.maxHp*.1*o/3),e.bus.emit("heal",{entity:t}),e.bus.emit("drink",{item:"tonic"}),!0}update(e){const t=this.game,s=t.player,o=t.world,n=s.intent;if(s.flash=Math.max(0,s.flash-e*5),s.invuln=Math.max(0,s.invuln-e),s.dead)return this.updateDead(e);this.recompile(),s.action&&(s.actionT+=e/s.actionDur,s.actionT>=1&&(s.action=0,s.actionT=0));const r=s.build.derived,i=o.waterDepth(s.x,s.z)>.18,l=zt.PLAYER_SPEED*r.moveSpeed*(i?.62:1),c=t.status.stopped(s);let d=0,p=0,f=!1;const u=s.target&&!s.target.gone&&!s.target.dead?s.target:s.target=null;if(s.dash){const y=s.dash;y.t-=e,d=y.x*y.speed,p=y.z*y.speed,f=!0,y.leap&&y.total&&(s.lift=Math.sin(Math.max(0,1-y.t/y.total)*Math.PI)*1.8),y.t<=0&&(s.dash=null,s.lift=0,t.skills.dashEnded())}else if(!c){if((n.moveX||n.moveZ)&&!s.standStill)d=n.moveX*l,p=n.moveZ*l,f=!0,s.moveTo=null,s.pursue=!1,s.queued=null;else if(u&&s.pursue){const y=Math.hypot(u.x-s.x,u.z-s.z);let k=.7;if(u.kind==="monster"){const M=t.skills.skillInSlot(s.queued?.slot??0);k=(M?Math.max(1.4,M.def.range):1.6)+u.radius-.2}else u.kind==="npc"&&(k=2.3);y>k&&!s.standStill&&(d=(u.x-s.x)/y*l,p=(u.z-s.z)/y*l,f=!0)}else if(s.moveTo&&!s.standStill){const y=Math.hypot(s.moveTo.x-s.x,s.moveTo.z-s.z);if(y<.25)s.moveTo=null;else{const k=Math.min(l,y/Math.max(e,1e-4));d=(s.moveTo.x-s.x)/y*k,p=(s.moveTo.z-s.z)/y*k,f=!0}}}s.cast&&!s.dash&&s.cast.t<s.cast.hitAt+.08&&(d*=.2,p*=.2);const m=s.x,g=s.z;if(f&&e>0){o.moveCircle(s.x,s.z,d*e,p*e,s.radius,Vo),s.x=Vo.x,s.z=Vo.z;const y=Math.hypot(s.x-m,s.z-g);if(!s.dash&&y<Math.hypot(d,p)*e*.25?(this.stuck+=e,this.stuck>.6&&(s.moveTo=null,this.stuck=0)):this.stuck=0,y>1e-4&&!s.cast&&(s.yaw=us(s.yaw,ht(s.x-m,s.z-g),16,e)),!s.dash){const k=y/Math.max(e,1e-4),M=s.walk;s.walk+=y*Math.min(4.5,Math.max(1.9,wd/Math.max(k,.1))),Math.floor(M/Math.PI)!==Math.floor(s.walk/Math.PI)&&t.bus.emit("step",{entity:s,water:i})}}const v=Math.hypot(s.x-m,s.z-g)/Math.max(e,1e-4);if(s.move=Vt(s.move,Math.min(1,v/(zt.PLAYER_SPEED*.8)),14,e),s.dash?.leap||(s.y=Vt(s.y,o.surface(s.x,s.z)-(i?.12:0),22,e)),u&&!c){const y=Math.hypot(u.x-s.x,u.z-s.z);if(u.kind==="monster"){const k=s.queued?.slot??0,M=t.skills.skillInSlot(k),z=(M?Math.max(1.4,M.def.range):1.6)+u.radius+.15;if(y<=z&&(s.pursue||!f)&&(s.cast||(s.yaw=us(s.yaw,ht(u.x-s.x,u.z-s.z),18,e)),s.queued&&!s.cast&&!s.dash)){const P=t.skills.useSlot(k,{target:u,quiet:!0});P&&!t.settings.autoAttack&&(s.queued=null,s.pursue=!1),!P&&M&&!t.skills.canAfford(M)&&k!==0&&(s.queued={slot:0})}}else u.kind==="npc"&&y<=2.6?(s.yaw=ht(u.x-s.x,u.z-s.z),u.yaw=ht(s.x-u.x,s.z-u.z),s.target=null,s.pursue=!1,t.bus.emit("npc:talk",u)):u.kind==="drop"&&y<=1&&(s.target=null,s.pursue=!1)}s.calm+=e;const x=s.calm>5?4:1;s.hp=Math.min(s.maxHp,s.hp+r.lifeRegen*x*e);const b=s.build.cls.resource;b.regen&&(s.resource=Math.min(r.maxResource,s.resource+r.resourceRegen*(s.calm>5?1.6:1)*e)),b.decay&&s.calm>b.decay[0]&&(s.resource=Math.max(0,s.resource-b.decay[1]*e)),this.visitSites()}visitSites(){const e=this.game,t=e.player,s=t.char.journey;if(e.world!==e.overworld){t.safe=!1;return}const o=e.world.sites.near(t.x,t.z),n=o?Math.hypot(o.x-t.x,o.z-t.z):1e9,r=o&&n<o.clear+6?o.name:"";if(r!==this.siteName&&(this.siteName=r,r&&e.bus.emit("site:enter",{name:o.name,kind:o.kind})),o&&o.waystone&&n<3.2){const i=s.waystone;i.x!==o.x||i.z!==o.z?(s.waystone={x:o.x,z:o.z,name:o.name},t.hp=t.maxHp,t.char.potions=Math.max(t.char.potions,t.build.derived.potionCharges),e.bus.emit("attune",{x:o.x,y:e.world.surface(o.x,o.z),z:o.z,name:o.name})):t.char.potions<t.build.derived.potionCharges&&t.calm>2&&(t.char.potions=t.build.derived.potionCharges,e.bus.emit("log",{text:"Your tonics are refilled."}))}t.safe=!!(o&&o.safe&&n<o.safe)}updateDead(e){const t=this.game,s=t.player;if(s.grow=Math.max(0,s.grow-e*3),s.move=0,s.respawn-=e,t.look.fadeGoal=s.respawn<1.2?0:1,s.respawn<=0){t.world!==t.overworld&&t.zones.leave(!0);const o=s.char.journey.waystone;s.x=o.x+2.4,s.z=o.z+2.4,s.y=t.world.surface(s.x,s.z),s.statuses=[],s.barrier=0,s.dirty=!0,this.recompile(!0),s.hp=s.maxHp,s.resource=s.build.cls.resource.startFull?s.build.derived.maxResource*.5:0,s.char.potions=Math.max(s.char.potions,s.build.derived.potionCharges),s.dead=!1,s.grow=1,s.invuln=2,s.calm=10,t.look.fadeGoal=1,t.camera.target=[s.x,s.y+1,s.z],t.fillWorld(),t.bus.emit("player:respawn",{name:o.name})}}}const Ia={sproutling:{id:"sproutling",name:"Sproutling",archetype:"sproutling",scale:1,radius:.36,height:.95,hp:26,atk:5,speed:2.5,range:1.15,attackTime:.8,cooldown:1.7,aggro:0,xp:9,stride:2,special:{kind:"leap",every:5.5,min:2.2,max:6.5,windup:.6,air:.42,r:1.3,mult:1.3},colors:[[150,178,120],[116,168,90],[226,176,52]],gold:[1,4],mats:[["sprout_leaf",.55,[1,2]]],potion:.05},puffcap:{id:"puffcap",name:"Puffcap",archetype:"puffcap",scale:1.05,radius:.4,height:1.05,hp:40,atk:7,speed:2,range:1.2,attackTime:.9,cooldown:1.9,aggro:5.5,xp:14,stride:5.5,special:{kind:"cloud",every:9,min:0,max:3.2,windup:.75,r:2.5,life:4.2,mult:.45,tick:.55,element:"poison"},colors:[[224,92,70],[226,176,52],[248,232,190]],gold:[2,6],mats:[["puff_spore",.5,[1,2]]],potion:.06,resist:{poison:.5}},bristlehog:{id:"bristlehog",name:"Bristlehog",archetype:"bristlehog",scale:1.1,radius:.48,height:1,hp:68,atk:10,speed:3.5,range:1.35,attackTime:.7,cooldown:1.8,aggro:7.5,xp:23,stride:3.1,special:{kind:"charge",every:7,min:3.5,max:10,windup:.8,speed:13,dist:11,mult:1.9,winded:1.4},colors:[[74,77,94],[226,176,52],[226,188,130]],gold:[4,9],mats:[["hog_bristle",.5,[1,2]]],potion:.08},wisp:{id:"wisp",name:"Glimmerwisp",archetype:"wisp",scale:1,radius:.36,height:1.45,hp:32,atk:9,speed:3,range:1.5,attackTime:.7,cooldown:1.6,aggro:7,xp:18,stride:1,glow:!0,keep:[4.2,7],special:{kind:"shot",every:2.6,min:2.5,max:10.5,windup:.6,speed:8.5,r:.4,life:1.7,mult:1,element:"storm"},colors:[[136,180,216],[70,150,150],[226,176,52]],gold:[3,8],mats:[["wisp_ember",.5,[1,1]]],potion:.08,resist:{storm:.5}},cragling:{id:"cragling",name:"Cragling",archetype:"cragling",scale:1,radius:.55,height:1.5,hp:125,atk:15,speed:1.9,range:1.5,attackTime:1.15,cooldown:2.4,aggro:6,xp:40,stride:5,special:{kind:"slam",every:6.5,min:0,max:3.2,windup:1.1,r:3.3,mult:1.7,recover:1},colors:[[150,142,132],[226,176,52],[84,108,156]],gold:[8,16],mats:[["crag_shard",.55,[1,2]]],potion:.12,resist:{physical:0}},shellsnap:{id:"shellsnap",name:"Shellsnap",archetype:"shellsnap",scale:1.05,radius:.48,height:.75,hp:50,atk:8,speed:2.9,range:1.25,attackTime:.6,cooldown:1.5,aggro:5,xp:17,stride:2.2,special:{kind:"guard",every:8,min:0,max:2.4,below:.8,hold:1.5,windup:.55,r:2.3,mult:1.4},colors:[[188,84,60],[226,176,52],[226,188,130]],gold:[3,7],mats:[["snap_claw",.5,[1,1]]],potion:.07,resist:{frost:.3}}},Po={swift:{id:"swift",name:"Swift",desc:"Moves and strikes faster.",speedMul:1.35,cdMul:.75},stonehide:{id:"stonehide",name:"Stonehide",desc:"Takes a third less damage and cannot be knocked back.",taken:.65},blazing:{id:"blazing",name:"Blazing",desc:"Leaves burning ground behind it."},frostbound:{id:"frostbound",name:"Frostbound",desc:"Its blows Chill."},vampiric:{id:"vampiric",name:"Vampiric",desc:"Heals from the blows it lands."},warded:{id:"warded",name:"Warded",desc:"Shielded by a barrier that returns if left alone."}},_d=Object.keys(Po),Ol={normal:{hp:1,atk:1,xp:1,size:1},elite:{hp:2.8,atk:1.45,xp:4,size:1.45},boss:{hp:6.5,atk:1.7,xp:14,size:1.9}},vt={story:{name:"Story",hp:.6,atk:.5,xp:.8,find:.8,telegraph:1.35,desc:"For the tale and the wandering. Creatures are far weaker and warn longer."},normal:{name:"Normal",hp:1,atk:1,xp:1,find:1,telegraph:1,desc:"The road as it was meant to be walked."},veteran:{name:"Veteran",hp:1.6,atk:1.45,xp:1.3,find:1.3,telegraph:1,desc:"Tougher creatures, more experience and finer finds."},nightmare:{name:"Nightmare",hp:2.8,atk:2.1,xp:1.7,find:1.8,telegraph:.9,desc:"The ink runs deep. Much more of everything, and less warning."}};function zd(a,e,t,s){const o=e-1,n=Ol[t],r=vt[s];return{maxHp:Math.round(a.hp*(1+.32*o)*n.hp*r.hp),atk:a.atk*(1+.21*o)*n.atk*r.atk,xp:Math.round(a.xp*(1+.38*o)*n.xp*r.xp),armor:e*1.5}}const Va=a=>a.boss?1.4:a.elite?1.25:1,Ca=(a,e,t)=>t*(e.elite?.85:1)*a.settings.telegraphScale*vt[a.player.char.difficulty].telegraph,Ue={dx:0,dz:0,done:!1},na={dx:0,dz:0,done:!0},We=(a,e=0)=>typeof a=="number"?a:e,ot=(a,e)=>{a.action=1,a.actionDur=1e3,a.actionT=e},ra=a=>{a.action=0},Ns=(a,e,t)=>{a.yaw=ht(e-a.x,t-a.z)},Bs=(a,e,t,s,o)=>a.bus.emit("telegraph",{x:e,y:a.world.surface(e,t),z:t,r:s,t:o,fill:!0}),Wr={leap:{begin(a,e,t){const s=a.player,o=We(t.r)*Va(e),n=Ca(a,e,t.windup),r=We(t.air,.42);return Ns(e,s.x,s.z),Bs(a,s.x,s.z,o,n+r),{phase:0,t:0,wind:n,r:o,vx:(s.x-e.x)/r,vz:(s.z-e.z)/r}},update(a,e,t,s,o){s.t+=o;const n=We(t.air,.42);if(s.phase===0)return ot(e,.18*Math.min(1,s.t/s.wind)),s.t>=s.wind&&(s.phase=1,s.t=0),Ue;if(s.phase===1){const r=Math.min(1,s.t/n);return e.lift=Math.sin(r*Math.PI)*1.5,ot(e,.3+.2*r),r<1?{dx:s.vx,dz:s.vz,done:!1}:(e.lift=0,a.bus.emit("slam",{x:e.x,y:e.y,z:e.z,r:s.r}),Math.hypot(a.player.x-e.x,a.player.z-e.z)<s.r+.2?a.combat.hurtHero(e,t.mult,!1,t.element):a.bus.emit("miss",{target:a.player,text:"Dodged"}),s.phase=2,s.t=0,Ue)}return ot(e,.5+.5*Math.min(1,s.t/.35)),s.t<.35?Ue:(ra(e),na)}},charge:{begin(a,e,t){const s=a.player,o=Math.hypot(s.x-e.x,s.z-e.z)||1,n=(s.x-e.x)/o,r=(s.z-e.z)/o,i=We(t.dist,11)*Va(e),l=e.radius*2+.7,c=Ca(a,e,t.windup);return Ns(e,s.x,s.z),a.bus.emit("telegraph",{lane:!0,x:e.x+n*i/2,y:e.y,z:e.z+r*i/2,dirx:n,dirz:r,len:i,w:l,t:c}),{phase:0,t:0,wind:c,dirx:n,dirz:r,left:i,lx:e.x,lz:e.z,stuck:0}},update(a,e,t,s,o){const n=a.player,r=We(t.speed,13);if(s.t+=o,s.phase===0)return ot(e,.16*Math.min(1,s.t/s.wind)),s.t>=s.wind&&(s.phase=1,s.t=0,s.lx=e.x,s.lz=e.z),Ue;if(s.phase===1){ot(e,.5);const i=Math.hypot(e.x-s.lx,e.z-s.lz);return s.t>o*1.5&&i<r*o*.35?s.stuck+=o:s.stuck=0,s.lx=e.x,s.lz=e.z,s.left-=r*o,!n.dead&&Math.hypot(n.x-e.x,n.z-e.z)<e.radius+n.radius+.3?(a.combat.hurtHero(e,t.mult,!1,t.element),s.phase=2,s.t=0,Ue):s.left<=0||s.stuck>.08?(a.bus.emit("miss",{target:e,text:"Winded"}),e.ai.stun=We(t.winded,1.4),ra(e),na):((s.dust=(s.dust??0)-o)<=0&&(s.dust=.07,a.bus.emit("charge:dust",{x:e.x,y:e.y,z:e.z})),{dx:s.dirx*r,dz:s.dirz*r,done:!1})}return ot(e,.5+.5*Math.min(1,s.t/.4)),s.t<.4?Ue:(ra(e),na)}},cloud:{begin(a,e,t){const s=We(t.r)*Va(e),o=Ca(a,e,t.windup);return Bs(a,e.x,e.z,s,o),{t:0,wind:o,r:s,done:!1}},update(a,e,t,s,o){return s.t+=o,s.done?(ot(e,.5+.5*Math.min(1,s.t/.4)),s.t<.4?Ue:(ra(e),na)):(ot(e,.45*Math.min(1,s.t/s.wind)),s.t>=s.wind&&(s.done=!0,s.t=0,a.hazards.cloud(e,s.r,We(t.life,4),t.mult,We(t.tick,.55),t.element??"poison")),Ue)}},shot:{begin(a,e,t){const s=Ca(a,e,t.windup);return Ns(e,a.player.x,a.player.z),a.bus.emit("telegraph",{x:e.x,y:e.y+.05,z:e.z,r:.9,t:s}),{t:0,wind:s,r:0,done:!1}},update(a,e,t,s,o){const n=a.player;if(s.t+=o,!s.done){if(Ns(e,n.x,n.z),ot(e,.4*Math.min(1,s.t/s.wind)),s.t>=s.wind){s.done=!0,s.t=0;const r=Math.hypot(n.x-e.x,n.z-e.z)||1;if(a.hazards.shot(e,(n.x-e.x)/r,(n.z-e.z)/r,t),e.boss)for(const i of[-.3,.3]){const l=(n.x-e.x)/r,c=(n.z-e.z)/r,d=Math.cos(i),p=Math.sin(i);a.hazards.shot(e,l*d-c*p,c*d+l*p,t)}}return Ue}return ot(e,.5+.5*Math.min(1,s.t/.3)),s.t<.3?Ue:(ra(e),na)}},slam:{begin(a,e,t){const s=We(t.r)*Va(e),o=Ca(a,e,t.windup);return Bs(a,e.x,e.z,s,o),{t:0,wind:o,r:s,done:!1}},update(a,e,t,s,o){const n=a.player,r=We(t.recover,1);return s.t+=o,s.done?(ot(e,Math.min(1,.45+.55*s.t/r)),s.t<r?Ue:(ra(e),na)):(ot(e,.4*Math.min(1,s.t/s.wind)),s.t>=s.wind&&(s.done=!0,s.t=0,a.bus.emit("slam",{x:e.x,y:e.y,z:e.z,r:s.r,heavy:!0}),!n.dead&&Math.hypot(n.x-e.x,n.z-e.z)<s.r?a.combat.hurtHero(e,t.mult,!1,t.element):!n.dead&&Math.hypot(n.x-e.x,n.z-e.z)<s.r+3&&a.bus.emit("miss",{target:n,text:"Dodged"})),Ue)}},guard:{begin(a,e,t){e.guard=!0;const s=We(t.hold,1.5)*a.settings.telegraphScale;return a.bus.emit("miss",{target:e,text:"Guarding"}),a.bus.emit("guard",{entity:e,t:s}),{t:0,warned:!1,r:We(t.r)*Va(e),snapped:!1}},update(a,e,t,s,o){const n=a.player,r=We(t.hold,1.5)*a.settings.telegraphScale,i=Ca(a,e,t.windup);return s.t+=o,s.snapped?(ot(e,.5+.5*Math.min(1,s.t/.45)),s.t<.45?Ue:(ra(e),na)):(e.action=3,e.actionDur=1e3,e.actionT=.2,!s.warned&&s.t>=r-i&&(s.warned=!0,Bs(a,e.x,e.z,s.r,i)),s.t>=r&&(s.snapped=!0,s.t=0,e.guard=!1,a.bus.emit("slam",{x:e.x,y:e.y,z:e.z,r:s.r}),!n.dead&&Math.hypot(n.x-e.x,n.z-e.z)<s.r&&a.combat.hurtHero(e,t.mult,!1,t.element)),Ue)}}},Sd=.8,Td=.6,Cd=3.5,Pd=6,Ct=(a,e)=>a.some(t=>t.id===e);function Ad(a,e,t=!1){const s=e.statuses;return{vsElite:e.elite,vulnerable:Ct(s,"vulnerable"),cc:Ct(s,"stun")||Ct(s,"freeze"),burning:Ct(s,"burn"),chilled:Ct(s,"chill")||Ct(s,"freeze"),poisoned:Ct(s,"poison"),bleeding:Ct(s,"bleed"),marked:Ct(s,"marked"),close:e.distance<=Cd,distant:e.distance>=Pd,injured:e.hpFrac<.35,healthy:a.hpFrac>.8,dot:t}}const Ed=(a,e)=>Math.min(Sd,Math.max(0,a/(a+40+9*e)));function Kr(a,e,t,s){const o=t.element,n=Ad(a,e,!!t.dot);if(e.isPlayer&&!t.dot&&e.dodge>0&&s.chance(e.dodge))return{amount:0,crit:!1,dodged:!0,blocked:!1,element:o};let r=t.base*a.mainMult*(1+(t.more??0));if(a.totals){const{inc:d,more:p}=ad(a.totals,td(o,t.tags,n));r*=(1+d)*p}if(n.vulnerable&&(r*=1+gd),a.isPlayer&&n.marked){const d=e.statuses.find(p=>p.id==="marked");r*=1+(d?.potency??.3)}const i=!t.dot&&t.canCrit&&s.chance(a.critChance+(t.critBonus??0));i&&(r*=a.critMult);const l=o==="physical"?Ed(e.armor,a.level):Math.min(.7,e.resist[o]??0);r*=(1-l)*e.taken;const c=!t.dot&&e.block>0&&s.chance(e.block);return c&&(r*=Td),{amount:Math.max(1,Math.round(r)),crit:i,dodged:!1,blocked:c,element:o}}const jl={gold:.6,xp:.3},Ld={normal:.1},qd={normal:1,elite:4,boss:12,chest:6};function Gr(a,e){const t=[],s=vt[e.difficulty],o=e.magicFind*s.find,n=e.def?.gold??[6,12],r=a.int(n[0],n[1])*(1+(e.level-1)*.3)*qd[e.rank]*e.goldFind*(1+jl.gold*e.night);r>=1&&t.push({type:"gold",n:Math.round(r)});let i=0;e.rank==="normal"?i=a.chance(Ld.normal*(.7+.3*o))?1:0:e.rank==="elite"?i=1+(a.chance(.5)?1:0):e.rank==="boss"?i=3+(a.chance(.5)?1:0):i=2+(a.chance(.35)?1:0);for(let c=0;c<i;c++){let d=Hl(a,{magicFind:o,rank:e.rank,ilvl:e.level});e.rank==="boss"&&c===0&&(d=a.chance(.15)?"unique":"legendary"),(e.rank==="chest"||e.rank==="boss")&&d==="common"&&(d="magic"),t.push({type:"item",item:ys(a,{ilvl:e.level,rarity:d,classId:a.chance(.85)?e.classId:void 0})})}for(const[c,d,[p,f]]of e.def?.mats??[])a.chance(Math.min(1,d*(e.rank==="normal"?1:2.5)))&&t.push({type:"material",id:c,n:a.int(p,f)});const l=e.rank==="boss"?1:e.rank==="elite"||e.rank==="chest"?.5:e.def?.potion??.05;return a.chance(l)&&t.push({type:"potion",n:1}),t}const Xa={hit:.03,crit:.06,kill:.07,elder:.13,taken:.05};class tr{game;constructor(e){this.game=e}heroAttacker(){const e=this.game.player,t=e.build.derived;return{level:e.level,totals:e.build.totals,mainMult:t.mainMult,critChance:t.critChance,critMult:t.critMult,hpFrac:e.hp/e.maxHp,isPlayer:!0}}monsterDefender(e,t){return{level:e.level,armor:e.armor,resist:e.def.resist??{},taken:1-e.dr,dodge:0,block:0,statuses:e.statuses,hpFrac:e.hp/e.maxHp,elite:e.elite,isPlayer:!1,distance:t}}monsterAttacker(e){return{level:e.level,totals:null,mainMult:1,critChance:0,critMult:1,hpFrac:e.hp/e.maxHp,isPlayer:!1}}heroDefender(e){const t=this.game.player,s=t.build.derived;return{level:t.level,armor:s.armor,resist:s.resist,taken:s.taken,dodge:s.dodge,block:s.block,statuses:t.statuses,hpFrac:t.hp/t.maxHp,elite:!1,isPlayer:!0,distance:e}}weaponRoll(){const e=this.game.player.build.derived.weapon;return this.game.rng.range(e.min,e.max+1)}heroHit(e,t){const s=this.game,o=s.player;if(!e||e.dead)return null;const n=Math.hypot(e.x-o.x,e.z-o.z),r=t.params;let i=t.more??0;if(r){const u=m=>e.statuses.some(g=>g.id===m);r.moreVsCC&&(u("stun")||u("freeze"))&&(i+=r.moreVsCC),r.moreVsChilled&&(u("chill")||u("freeze"))&&(i+=r.moreVsChilled),r.moreVsVulnerable&&u("vulnerable")&&(i+=r.moreVsVulnerable),r.moreVsBurning&&u("burn")&&(i+=r.moreVsBurning),r.more&&(i+=r.more)}const l=Kr(this.heroAttacker(),this.monsterDefender(e,n),{base:t.base,element:t.element,tags:t.tags,canCrit:!0,critBonus:(t.critBonus??0)+(r?.crit??0),more:i},s.rng),c=e.statuses.some(u=>u.id==="chill");this.damage(e,l.amount,o,l.crit,t.element,l.blocked),r&&this.leaveStatuses(e,r,l.amount,c),this.applyOnHitRules(e,t,l.amount);const d=r?.knock??0,p=r?.pull??0;if((d||p)&&!e.dead&&e.ai.state!=="special"&&!e.guard&&!e.affixes.includes("stonehide")&&!e.boss){const u=e.x-t.fromX,m=e.z-t.fromZ,g=Math.hypot(u,m)||1,v=p?-Math.min(6,g*3):d*(l.crit?1.6:1);e.ai.pushX=u/g*v,e.ai.pushZ=m/g*v}const f=o.build.derived;return f.lifeOnHit&&this.healHero(f.lifeOnHit,!0),r?.genPerHit&&this.gain(r.genPerHit),t.noTriggers||(s.skills.fireTriggers("hit",t.skill?.def??null,e,l.amount),l.crit&&s.skills.fireTriggers("crit",t.skill?.def??null,e,l.amount)),e.dead&&!t.noTriggers&&s.skills.fireTriggers("kill",t.skill?.def??null,e,l.amount),l}touch(e,t){e.dead||(e.ai.target=this.game.player,e.ai.provoked=!0,this.leaveStatuses(e,t,0,e.statuses.some(s=>s.id==="chill")))}leaveStatuses(e,t,s,o){if(e.dead)return;const n=this.game.status,r=this.game.rng,i=this.game.player.build.derived.statusDuration;t.stun&&r.chance(t.stunChance??1)&&n.apply(e,"stun",t.stun*i),t.freeze&&n.apply(e,"freeze",t.freeze*i),t.freezeChilled&&o&&n.apply(e,"freeze",t.freezeChilled*i),t.vuln&&r.chance(t.vulnChance??1)&&n.apply(e,"vulnerable",t.vuln*i),t.burn&&n.applyDot(e,"burn",s,t.burn,(t.burnDur??3)*i),t.bleed&&n.applyDot(e,"bleed",s,t.bleed,(t.bleedDur??4)*i),t.poison&&n.applyDot(e,"poison",s,t.poison,(t.poisonDur??4)*i),t.chill&&n.apply(e,"chill",3*i,t.chill),t.slow&&n.apply(e,"slow",(t.slowDur??2)*i,t.slow)}applyOnHitRules(e,t,s){if(e.dead)return;const o=this.game,n=o.player,r=o.status,i=n.build.derived.statusDuration,l=t.skill?.def;for(const c of n.build.onHit)c.skill&&c.skill!==l?.id||c.tag&&!t.tags.includes(c.tag)||o.rng.chance(c.chance)&&(c.status==="burn"||c.status==="bleed"||c.status==="poison"?r.applyDot(e,c.status,s,c.potency,c.duration*i):r.apply(e,c.status,c.duration*i,c.potency,c.stacks));t.tags.includes("melee")&&n.statuses.some(c=>c.id==="brand")&&r.applyDot(e,"burn",s,.5,3*i)}maul(e){const t=this.game,s=t.player;if(!(s.dead||s.invuln>0)){if(Math.hypot(s.x-e.x,s.z-e.z)>e.def.range+e.radius+.55){t.bus.emit("miss",{target:s,text:"Dodged"});return}this.hurtHero(e,1)}}hurtHero(e,t=1,s=!1,o="physical"){const n=this.game,r=n.player;if(r.dead)return!1;if(r.invuln>0)return s||n.bus.emit("miss",{target:r,text:"Untouched"}),!1;const i=1+.2*n.stakes.night(),l=Kr(this.monsterAttacker(e),this.heroDefender(Math.hypot(r.x-e.x,r.z-e.z)),{base:e.atk*t*i*(.85+n.rng.next()*.3),element:o,tags:[],canCrit:!1},n.rng);if(l.dodged)return s||n.bus.emit("miss",{target:r,text:"Dodged"}),!1;this.damage(r,l.amount,e,!1,o,l.blocked),e.affixes.includes("frostbound")&&n.status.apply(r,"chill",2,.3),e.affixes.includes("vampiric")&&(e.hp=Math.min(e.maxHp,e.hp+l.amount*1.5));const c=r.statuses.find(p=>p.id==="thorns"),d=r.build.derived.thorns+(c?l.amount*c.potency:0);return d>0&&!e.dead&&Math.hypot(r.x-e.x,r.z-e.z)<4&&this.damage(e,Math.round(d),r,!1,"physical"),n.skills.fireTriggers("hurt",null,e,l.amount),!0}damage(e,t,s,o,n,r=!1,i=!1){const l=this.game;if(!e.dead){if(e.guard&&(t=Math.max(1,Math.round(t*.2))),e.barrier>0){const c=Math.min(e.barrier,t);e.barrier-=c,t-=c,e.barrier<=0&&(e.statuses=e.statuses.filter(d=>d.id!=="warded"))}if(e.hp=Math.max(0,e.hp-t),i||(e.flash=1),!i&&e.action!==1&&!(e.kind==="monster"&&e.ai.state==="special")&&(e.action=3,e.actionT=0,e.actionDur=.22),l.bus.emit("damage",{target:e,amount:t,crit:o,source:s,element:n,blocked:r,dot:i}),e.kind==="monster"){const c=e.ai;c.target=l.player,c.provoked=!0,e.calmT=0;const d=e.hp<=0;!i&&!e.guard&&l.hold(d?e.elite?Xa.elder:Xa.kill:o?Xa.crit:Xa.hit),!i&&(o||d&&e.elite)&&(l.shake(d&&e.elite?.55:.32),l.rumble(d&&e.elite?.6:.3,90)),d&&this.slay(e)}else{const c=e;if(c.calm=0,i)return void(c.hp<=0&&this.fall(c));const d=t>=c.maxHp*.08;d&&l.hold(Xa.taken),l.shake(d?.5:.25),l.rumble(d?.7:.35,d?160:80),l.look.hurt=1;const p=c.build.cls.resource.onHurt;p&&this.gain(t/c.maxHp*100*p,!1),c.hp<=0&&this.fall(c)}}}healHero(e,t=!1){const s=this.game.player;if(s.dead||e<=0)return;const o=s.hp;s.hp=Math.min(s.maxHp,s.hp+e*s.build.derived.healing),!t&&s.hp>o&&this.game.bus.emit("heal",{entity:s,amount:s.hp-o})}gain(e,t=!0){const s=this.game.player;s.resource=Math.min(s.build.derived.maxResource,s.resource+e*(t?s.build.derived.genMul:1))}barrierHero(e,t){const s=this.game.player;s.barrier=Math.max(s.barrier,s.maxHp*e*s.build.derived.barrierGen),this.game.status.apply(s,"warded",t,s.barrier)}slay(e){const t=this.game,s=t.player,o=s.char;e.dead=!0,e.deathT=0,s.target===e&&(s.target=null);const n=Math.max(1,Math.round(e.xp*Z0(s.level,e.level)*(1+jl.xp*t.stakes.night())*s.build.derived.xpMul));o.tally.kills++,e.rank==="elite"&&o.tally.elites++,e.rank==="boss"&&o.tally.bosses++,t.bus.emit("monster:died",e);const r=s.build.derived;r.lifeOnKill&&this.healHero(r.lifeOnKill,!0),r.resourceOnKill&&this.gain(r.resourceOnKill,!1),e.practice||t.loot.dropFrom(e),this.grantXp(n),t.bounties.onKill(e),t.zones.onKill(e),e.affixes.includes("blazing")&&t.hazards.patch(e,2.2,3,.35,"fire")}grantXp(e){const t=this.game,s=t.player.char;if(!(s.level>=Zt)){for(s.xp+=e,t.bus.emit("xp",{amount:e});s.level<Zt&&s.xp>=mo(s.level);)s.xp-=mo(s.level),s.level++,t.playerSystem.recompile(!0),t.player.hp=t.player.maxHp,t.player.resource=Math.max(t.player.resource,t.player.build.cls.resource.startFull?t.player.build.derived.maxResource:0),t.bus.emit("levelup",{level:s.level});s.level>=Zt&&(s.xp=0)}}fall(e){const t=this.game;e.dead||(e.dead=!0,e.respawn=3.2,e.target=null,e.moveTo=null,e.cast=null,e.dash=null,e.char.tally.deaths++,t.bus.emit("player:died"))}static affixNumbers(e){let t=1,s=1,o=1;for(const n of e){const r=Po[n];r&&(t*=r.speedMul??1,s*=r.cdMul??1,o*=r.taken??1)}return{speed:t,cd:s,taken:o}}}const Rd=24,Yr=.5,Xo={x:0,z:0},$d=.45;class Hd{game;constructor(e){this.game=e}update(e){const t=this.game,s=t.player,o=t.monsters,n=t.stakes.night(),r=t.world===t.overworld?Rd:60,i=t.settings.telegraphScale*vt[s.char.difficulty].telegraph;for(let l=0;l<o.length;l++){const c=o[l];if(c.flash=Math.max(0,c.flash-e*5),c.dead){c.deathT+=e,c.grow=Math.max(0,1-c.deathT*3.2),c.deathT>.4&&(c.gone=!0);continue}c.grow=Math.min(1,c.grow+e*3);const d=c.ai,p=c.def,f=p.special,u=t.status.stopped(c);c.action&&!u&&(c.actionT+=e/c.actionDur,c.actionT>=1&&(c.action=0));const m=tr.affixNumbers(c.affixes),g=p.speed*m.speed*t.status.speedMul(c)*(d.phase===2?1.25:1);d.cd-=e,d.scd=(d.scd??1+t.rng.next()*2.5)-e;let v=0,x=0;const b=Math.hypot(s.x-c.x,s.z-c.z),y=Math.hypot(c.x-d.hx,c.z-d.hz),k=!s.dead&&!s.safe;if(this.affixes(c,e,b),u)(d.state==="special"||d.state==="attack")&&(d.state="chase",d.sp=void 0,c.guard=!1,c.lift=0,c.action=0);else if(d.stun>0)d.stun-=e;else if(d.state==="idle"){if(d.timer-=e,d.timer<=0&&(d.timer=2+t.rng.next()*5,t.rng.chance(.7))){const B=t.rng.angle(),G=1.5+t.rng.next()*5;d.gx=d.hx+Math.cos(B)*G,d.gz=d.hz+Math.sin(B)*G,d.going=!0}if(d.going){const B=Math.hypot(d.gx-c.x,d.gz-c.z);B<.3?d.going=!1:(v=(d.gx-c.x)/B*g*.4,x=(d.gz-c.z)/B*g*.4)}const N=p.aggro>0&&b<p.aggro*(c.elite?1.3:1)*(1+$d*n)*(c.resident?1.6:1);k&&(N||d.provoked)&&(d.state="chase",d.target=s,t.bus.emit("monster:alert",c))}else if(d.state==="chase"){const N=p.range+c.radius*.5;if(!k||y>r)d.state="home",d.provoked=!1;else if(p.keep&&b<p.keep[1]){const B=b<p.keep[0]?-.75:0,G=(c.id%2?1:-1)*.35;v=((s.x-c.x)*B-(s.z-c.z)*G)/b*g,x=((s.z-c.z)*B+(s.x-c.x)*G)/b*g}else b>N*.9&&(v=(s.x-c.x)/b*g,x=(s.z-c.z)/b*g);f&&d.state==="chase"&&d.scd<=0&&b>=f.min&&b<=f.max&&(!f.below||c.hp<c.maxHp*f.below)?(d.state="special",d.sp=Wr[f.kind].begin(t,c,f),t.bus.emit("monster:special",c)):b<=N&&d.cd<=0&&d.state==="chase"&&(d.state="attack",d.struck=!1,c.action=1,c.actionT=0,c.actionDur=p.attackTime*i,t.bus.emit("telegraph",{x:c.x,y:c.y,z:c.z,r:p.range+c.radius+.4,t:p.attackTime*i*Yr})),c.yaw=us(c.yaw,ht(s.x-c.x,s.z-c.z),9,e)}else if(d.state==="attack")!d.struck&&c.actionT>=Yr&&(d.struck=!0,t.combat.maul(c),t.bus.emit("monster:strike",c)),c.action!==1&&(d.state="chase",d.cd=p.cooldown*m.cd*(.8+t.rng.next()*.4));else if(d.state==="special"&&f){const N=Wr[f.kind].update(t,c,f,d.sp,e);v=N.dx,x=N.dz,N.done&&(d.state="chase",d.sp=void 0,d.scd=f.every*(c.boss?.45:c.elite?.6:1)*(d.phase===2?.7:1)*(.85+t.rng.next()*.3),d.cd=Math.max(d.cd,.6))}else d.state==="home"&&(c.hp=Math.min(c.maxHp,c.hp+c.maxHp*.25*e),y<1.2?(d.state="idle",d.timer=1):(v=(d.hx-c.x)/y*g,x=(d.hz-c.z)/y*g));if(d.pushX||d.pushZ){v+=d.pushX,x+=d.pushZ;const N=Math.exp(-9*e);d.pushX*=N,d.pushZ*=N,Math.abs(d.pushX)+Math.abs(d.pushZ)<.05&&(d.pushX=d.pushZ=0)}for(let N=0;N<o.length;N++){const B=o[N];if(B===c||B.dead)continue;const G=c.x-B.x,pe=c.z-B.z,we=Math.hypot(G,pe),Y=c.radius+B.radius;we<Y&&we>.001&&(v+=G/we*(Y-we)*4,x+=pe/we*(Y-we)*4)}const M=c.radius+s.radius;b<M&&b>.001&&!s.dead&&(v+=(c.x-s.x)/b*(M-b)*6,x+=(c.z-s.z)/b*(M-b)*6);const z=c.x,P=c.z;(v||x)&&(t.world.moveCircle(c.x,c.z,v*e,x*e,c.radius,Xo),c.x=Xo.x,c.z=Xo.z);const $=Math.hypot(c.x-z,c.z-P);d.state!=="chase"&&d.state!=="attack"&&d.state!=="special"&&$>1e-4&&!d.pushX&&(c.yaw=us(c.yaw,ht(c.x-z,c.z-P),8,e)),c.walk+=$*p.stride,c.move=Vt(c.move,Math.min(1,$/Math.max(e,1e-4)/(p.speed*.5)),10,e),c.lift||(c.y=Vt(c.y,t.world.surface(c.x,c.z),18,e))}}affixes(e,t,s){const o=this.game,n=e.ai;if(e.affixes.length){if(n.affixT=(n.affixT??2)-t,n.affixT<=0){n.affixT=3.5;const r=n.state==="chase"||n.state==="attack"||n.state==="special";e.affixes.includes("blazing")&&r&&s<14&&o.hazards.patch(e,1.6,4,.3,"fire"),e.affixes.includes("warded")&&e.barrier<=0&&e.calmT!==void 0&&e.calmT>6&&(e.barrier=e.maxHp*.3)}e.calmT=(e.calmT??0)+t}e.boss&&n.phase!==2&&e.hp<e.maxHp*.5&&(n.phase=2,o.bus.emit("miss",{target:e,text:"Enraged"}),o.bus.emit("log",{text:`<em>${e.name}</em> calls for help!`}),o.shake(.6),o.spawner.summonAround(e,3))}}const lt=(a,e,t,s)=>a.game.monsters.filter(o=>!o.dead&&Math.hypot(o.x-e,o.z-t)<s+o.radius);function Zo(a,e,t){const s=a.game,o=s.player,n=e.P,r=e.aim,i=n.reach??1.9,l=n.arc??.3,c=Math.max(1,Math.round(n.targets??1)),d=[];for(const p of s.monsters){if(p.dead)continue;const f=p.x-o.x,u=p.z-o.z,m=Math.hypot(f,u);m>i+p.radius||m>.6&&(f*r.dirX+u*r.dirZ)/m<l||d.push({m:p,d:p===r.target?-1:m})}d.sort((p,f)=>p.d-f.d);for(const p of d.slice(0,c))a.hit(e,p.m,"coef",t)}const Pa={melee:{fire(a,e){const t=a.game,s=t.player,o=e.P,n=o.shock?ee.CYAN:e.def.element==="physical"?o.heavy?oe.GOLD:oe.WHITE:Xe[e.def.element];s.yaw=ht(e.aim.dirX,e.aim.dirZ),o.shock&&(t.fx.shock(s.x,s.y,s.z,o.reach??3,ee.CYAN,.4),t.fx.muzzle(s,ee.CYAN,!0),t.fx.bits(s.x,s.y+.6,s.z,12,ee.CYAN,6),t.bus.emit("slam",{x:s.x,y:s.y,z:s.z,r:o.reach??3,heavy:!0,color:ee.CYAN})),t.bus.emit("swing",{entity:s,radius:(o.reach??1.9)*(o.arc!==void 0&&o.arc<-.5?1.05:1),color:n,heavy:!!o.heavy}),o.heavy&&t.shake(.3);const r=Math.max(1,Math.round(o.hits??1));Zo(a,e,1);for(let i=1;i<r;i++)a.later(.09*i,()=>{t.bus.emit("swing",{entity:s,radius:(o.reach??1.9)*.9,color:n}),Zo(a,e,1)});o.echo&&a.later(.22,()=>{t.bus.emit("swing",{entity:s,radius:o.reach??1.9,color:oe.GOLD,heavy:!0}),Zo(a,e,o.echo)})}},projectile:{fire(a,e){const t=a.game.player,s=e.P,o=Math.max(1,Math.round(s.count??1)),n=s.spread??.13,r=i=>{const l=s.laser?a.game.fx.muzzle(t,ee.CYAN,o>3):null;for(let c=0;c<o;c++){const d=(c-(o-1)/2)*n,p=Math.cos(d),f=Math.sin(d),u=e.aim.dirX*p-e.aim.dirZ*f,m=e.aim.dirZ*p+e.aim.dirX*f;l?a.launch(e,l[0],l[2],u,m,{mult:i,y:l[1]}):a.launch(e,t.x+u*.6,t.z+m*.6,u,m,{mult:i})}};r(1),s.echo&&a.later(.25,()=>r(s.echo))},onShotHit(a,e,t){const s=a.game,o=e.ctx,n=o.P;if(a.hit(o,t,"coef",e.mult,e.x-e.vx*.05,e.z-e.vz*.05,e.plain),n.laser&&!e.plain&&s.fx.bits(e.x,e.y,e.z,3,ee.CYAN,3),n.explode&&!e.plain){s.bus.emit("blast",{x:e.x,y:e.y-.6,z:e.z,r:n.explode,element:o.def.element});for(const r of lt(a,e.x,e.z,n.explode))r!==t&&a.hit(o,r,"explodeCoef",e.mult,e.x,e.z)}if(n.chain&&!e.plain){let r=t;const i=new Set([t.id]);for(let l=0;l<Math.round(n.chain);l++){const c=s.monsters.filter(p=>!p.dead&&!i.has(p.id)&&Math.hypot(p.x-r.x,p.z-r.z)<6).sort((p,f)=>Math.hypot(p.x-r.x,p.z-r.z)-Math.hypot(f.x-r.x,f.z-r.z))[0];if(!c)break;i.add(c.id);const d=r;a.later(.06*(l+1),()=>{n.laser&&s.fx.laser(d.x,d.y+.9,d.z,c.x,c.y+.9,c.z,ee.CYAN,.3,.3,"arc"),s.bus.emit("chain",{from:{x:d.x,y:d.y+.9,z:d.z},to:{x:c.x,y:c.y+.9,z:c.z},element:o.def.element}),a.hit(o,c,"coef",e.mult*.7,d.x,d.z)}),r=c}}}},nova:{fire(a,e){const t=a.game,s=t.player,o=e.P,n=o.radius??3,r=i=>{t.fx.nova(s.x,s.y,s.z,n,o.glitch?ee.MAGENTA:e.def.element==="physical"?oe.WHITE:Xe[e.def.element]),o.glitch&&t.fx.glitch(s.x,s.y,s.z,n),e.def.tags.includes("melee")&&t.bus.emit("swing",{entity:s,radius:n,color:oe.GOLD,heavy:!0}),o.heavy&&t.shake(.4);for(const l of lt(a,s.x,s.z,n))a.hit(e,l,"coef",i),o.glitch&&t.fx.bits(l.x,l.y+l.height*.6,l.z,4,ee.MAGENTA,3)};r(1),o.echo&&a.later(.35,()=>r(o.echo)),o.barrierPct&&t.combat.barrierHero(o.barrierPct,o.barrierDur??5),o.hasteSelf&&t.status.apply(s,"haste",o.hasteDur??3,o.hasteSelf)}},blast:{fire(a,e){const t=a.game,s=t.player,o=e.P,n=e.aim,r=Math.max(1,Math.round(o.count??1)),i=o.scatter??0,l=o.radius??3,c=e.def.targeting==="self";for(let d=0;d<r;d++){let p=c?s.x:n.x,f=c?s.z:n.z;if(i&&(d>0||c)){const x=t.rng.angle(),b=i*(.35+.65*t.rng.next());p+=Math.cos(x)*b,f+=Math.sin(x)*b}const u=(o.delay??.5)+(o.stagger??0)*d,m=t.world.surface(p,f),g=e.def.element==="physical"?oe.WHITE:Xe[e.def.element];if(o.orbital){t.fx.spawn("sigil",p,m+.1,f,{size:l*1.1,life:u+.25,color:ee.CYAN,ground:!0}),t.fx.laser(p,m+18,f,p,m,f,ee.CYAN,o.orbital>1?.14:.05,u,"laser"),a.blasts.push({x:p,z:f,r:l,t:0,delay:u,ctx:e,mult:1,echo:!!o.echo,fall:null});continue}t.fx.spawn("zone",p,m+.08,f,{size:l,life:u,color:g,ground:!0,alpha:.9});const v=e.def.element==="fire"||e.def.icon==="meteor"?t.fx.spawn("orb",p,m+9,f,{size:.5+l*.18,color:e.def.element==="physical"?oe.DUST:g,hold:!0}):null;a.blasts.push({x:p,z:f,r:l,t:0,delay:u,ctx:e,mult:1,echo:!!o.echo,fall:v})}},land(a,e){const t=a.game,s=e.ctx.P,o=t.world.surface(e.x,e.z);s.orbital&&t.fx.pillar(e.x,o,e.z,e.r,ee.CYAN,s.orbital>1&&e.mult>=1),t.bus.emit("blast",{x:e.x,y:o,z:e.z,r:e.r,element:e.ctx.def.element,heavy:!!s.heavy}),t.rumble(.5,120);for(const n of lt(a,e.x,e.z,e.r))a.hit(e.ctx,n,"coef",e.mult,e.x,e.z);if(s.zoneDur){const n=s.zoneFire||e.ctx.def.element==="fire";a.zones.push({x:e.x,z:e.z,r:e.r,left:s.zoneDur,tick:.5,next:.5,ctx:e.ctx,coef:s.zoneCoef?1:0,follow:!1,slow:s.zoneSlow??0,volley:!1,element:n?"fire":e.ctx.def.element,particle:t.fx.spawn("cloud",e.x,o+.12,e.z,{size:e.r,life:s.zoneDur,color:n?oe.FLAME:oe.DUST,ground:!0})})}e.echo&&a.blasts.push({x:e.x,z:e.z,r:e.r,t:0,delay:.6,ctx:e.ctx,mult:s.echo,echo:!1})}},zone:{fire(a,e){const t=a.game,s=t.player,o=e.P,n=!!o.follow||e.def.targeting==="self",r=n?s.x:e.aim.x,i=n?s.z:e.aim.z,l=o.radius??4,c=e.def.element==="physical"?oe.WHITE:Xe[e.def.element],d=t.world.surface(r,i),p=o.duration??4,f=o.drones?Array.from({length:Math.round(o.drones)},(u,m)=>{const g=t.fx.dronePos(m,Math.round(o.drones),s);return t.fx.bits(g[0],g[1],g[2],4,ee.CYAN,2),t.fx.spawn("orb",g[0],g[1],g[2],{size:.26,color:ee.CYAN,hold:!0})}).filter(u=>u!==null):void 0;o.drones&&t.fx.shock(s.x,s.y,s.z,2.4,ee.CYAN,.4),o.pull&&(t.fx.shock(r,d,i,l,ee.VOID,.5),t.shake(.3)),a.zones.push({x:r,z:i,r:l,left:p,tick:o.tick??.5,next:.05,ctx:e,coef:1,follow:n,slow:0,volley:!!o.volley,element:e.def.element,drones:f,shot:0,particle:o.pull?t.fx.vortex(r,d,i,l,p):o.volley?null:t.fx.spawn("cloud",r,d+.12,i,{size:l,life:p,color:c,ground:!0,hold:!1})})},tick(a,e){const t=a.game,s=t.player;if(e.volley){const r=lt(a,e.x,e.z,e.r);if(!r.length)return;const i=r[Math.floor(t.rng.next()*r.length)];if(e.drones?.length){const p=(e.shot=(e.shot??0)+1)%e.drones.length,f=t.fx.dronePos(p,e.drones.length,s),u=i.x-f[0],m=i.z-f[2],g=Math.hypot(u,m)||1;t.fx.spawn("burst",f[0],f[1],f[2],{size:.3,life:.12,color:ee.CYAN,rot:t.rng.angle()}),a.launch(e.ctx,f[0],f[2],u/g,m/g,{y:f[1]-.45});return}const l=i.x-s.x,c=i.z-s.z,d=Math.hypot(l,c)||1;a.launch(e.ctx,s.x+l/d*.6,s.z+c/d*.6,l/d,c/d);return}const o=t.world.surface(e.x,e.z),n=e.ctx.P.pull??0;if(n){for(const r of lt(a,e.x,e.z,e.r)){const i=e.x-r.x,l=e.z-r.z,c=Math.hypot(i,l);if(c>.5){const d=Math.min(c-.45,n*e.tick);r.x+=i/c*d,r.z+=l/c*d}}t.fx.suck(e.x,o,e.z,e.r)}for(let r=0;r<3;r++){const i=t.rng.angle(),l=e.r*Math.sqrt(t.rng.next()),c=Xe[e.element];e.element==="frost"?t.fx.spawn("mote",e.x+Math.cos(i)*l,o+2.2,e.z+Math.sin(i)*l,{size:.08,life:.7,color:oe.WHITE,vy:-3}):e.element==="fire"?t.fx.spawn("spark",e.x+Math.cos(i)*l,o+.3,e.z+Math.sin(i)*l,{size:.2,life:.5,color:c,vy:2}):e.coef&&t.fx.spawn("spark",e.x+Math.cos(i)*l,o+1.5,e.z+Math.sin(i)*l,{size:.16,life:.25,color:c,vy:-8})}for(const r of lt(a,e.x,e.z,e.r))e.coef&&a.hit(e.ctx,r,e.ctx.P.zoneCoef&&e.ctx.def.behavior!=="zone"?"zoneCoef":"coef",1,e.x,e.z,e.ctx.def.behavior!=="zone"),e.slow&&t.status.apply(r,"slow",.6,e.slow),e.element==="fire"&&e.ctx.def.behavior!=="zone"&&t.status.apply(r,"burn",1.5,t.player.build.derived.weapon.max*.3)},end(a,e){const t=a.game,s=e.ctx.P;for(const n of e.drones??[])t.fx.bits(n.x,n.y,n.z,4,ee.CYAN,2),t.fx.release(n);if(!s.implode)return;const o=t.world.surface(e.x,e.z);t.fx.implode(e.x,o,e.z,e.r),t.bus.emit("blast",{x:e.x,y:o,z:e.z,r:e.r,element:e.ctx.def.element,heavy:!0});for(const n of lt(a,e.x,e.z,e.r))a.hit(e.ctx,n,"implodeCoef",1,e.x,e.z)}},dash:{instant:!0,fire(a,e){const t=a.game,s=t.player,o=e.P,n=o.distance??6,r=o.speed??26;s.dash={x:e.aim.dirX,z:e.aim.dirZ,speed:r,t:n/r,skill:e.def.id,hit:new Set,coef:o.coef??0,width:o.width??1.2},a.dashCtx=e,s.moveTo=null,t.bus.emit("dash",{x:s.x,y:s.y,z:s.z}),o.zoneDur&&a.zones.push({x:s.x,z:s.z,r:o.radius??2.2,left:o.zoneDur,tick:.4,next:.05,ctx:e,coef:0,follow:!1,slow:o.zoneSlow??.4,volley:!1,element:"physical",particle:t.fx.spawn("cloud",s.x,s.y+.12,s.z,{size:o.radius??2.2,life:o.zoneDur,color:oe.DUST,ground:!0})})}},leap:{instant:!0,fire(a,e){const t=a.game,s=t.player,o=e.P,n=e.aim.x-s.x,r=e.aim.z-s.z,i=Math.min(o.distance??8,Math.hypot(n,r)),l=o.air??.5;o.pillar&&(t.fx.shock(s.x,s.y,s.z,2,ee.CYAN,.35),t.fx.bits(s.x,s.y+.9,s.z,14,ee.CYAN,4),t.fx.laser(s.x,s.y+.9,s.z,s.x+n/(Math.hypot(n,r)||1)*i,s.y+.9,s.z+r/(Math.hypot(n,r)||1)*i,ee.CYAN,.22,l+.1,"arc"));const c=Math.hypot(n,r)||1;s.dash={x:n/c,z:r/c,speed:i/l,t:l,skill:e.def.id,leap:!0,total:l},s.invuln=Math.max(s.invuln,l+.05),a.dashCtx=e,a.onDashEnd=()=>{const d=t.world.surface(s.x,s.z);o.pillar&&t.fx.pillar(s.x,d,s.z,o.radius??2.6,ee.CYAN),t.bus.emit("blast",{x:s.x,y:d,z:s.z,r:o.radius??2.6,element:e.def.element,heavy:!0}),t.bus.emit("slam",{x:s.x,y:d,z:s.z,r:o.radius??2.6,heavy:!0});for(const p of lt(a,s.x,s.z,o.radius??2.6))a.hit(e,p,"coef",1,s.x,s.z);o.zoneDur&&a.zones.push({x:s.x,z:s.z,r:o.radius??2.6,left:o.zoneDur,tick:.5,next:.5,ctx:e,coef:1,follow:!1,slow:0,volley:!1,element:"fire",particle:t.fx.spawn("cloud",s.x,d+.12,s.z,{size:o.radius??2.6,life:o.zoneDur,color:oe.FLAME,ground:!0})})}}},buff:{fire(a,e){const t=a.game,s=t.player,o=e.P;e.def.status&&t.status.apply(s,e.def.status,o.duration??6,o.potency??0),o.sigil&&t.fx.overclock(s,o.duration??6),t.fx.nova(s.x,s.y,s.z,e.def.tags.includes("shout")?4:2,e.def.element==="physical"?oe.GOLD:Xe[e.def.element]),e.def.tags.includes("shout")&&t.bus.emit("slam",{x:s.x,y:s.y,z:s.z,r:4,color:oe.GOLD})}},heal:{fire(a,e){const t=a.game,s=t.player,o=e.P,n=o.duration??3;t.status.apply(s,"mending",n,s.maxHp*(o.pct??.3)/n),t.bus.emit("heal",{entity:s})}},barrier:{fire(a,e){const t=a.game,s=t.player,o=e.P;if(t.combat.barrierHero(o.pct??.25,o.duration??5),t.fx.nova(s.x,s.y,s.z,o.hex?o.radius??1.8:1.8,o.hex?ee.CYAN:oe.SKY),o.hex&&t.fx.hexShield(s,o.duration??5),o.coef)for(const n of lt(a,s.x,s.z,o.radius??3))a.hit(e,n,"coef",1,s.x,s.z);t.bus.emit("heal",{entity:s,focus:!0})}},chain:{fire(a,e){const t=a.game,s=t.player,o=e.P;let n=e.aim.target&&!e.aim.target.dead?e.aim.target:null;if(n||(n=lt(a,e.aim.x,e.aim.z,4).sort((f,u)=>Math.hypot(f.x-e.aim.x,f.z-e.aim.z)-Math.hypot(u.x-e.aim.x,u.z-e.aim.z))[0]??null),!n||Math.hypot(n.x-s.x,n.z-s.z)>e.def.range+2){t.bus.emit("chain",{from:{x:s.x,y:s.y+1.2,z:s.z},to:{x:e.aim.x,y:t.world.surface(e.aim.x,e.aim.z)+.5,z:e.aim.z},element:e.def.element});return}const r=new Set;let i={x:s.x,y:s.y+1.2,z:s.z},l=1,c=n;const d=Math.round(o.jumps??4),p=o.jumpRange??6;for(let f=0;f<=d&&c;f++){const u=c,m=i,g=l;r.add(u.id),a.later(.05*f,()=>{u.dead||(o.arcs&&(t.fx.laser(m.x,m.y,m.z,u.x,u.y+.9,u.z,ee.CYAN,.42,.34,"arc"),t.fx.bits(u.x,u.y+.9,u.z,4,ee.CYAN,3)),t.bus.emit("chain",{from:m,to:{x:u.x,y:u.y+.9,z:u.z},element:e.def.element}),a.hit(e,u,"coef",g,m.x,m.z))}),i={x:u.x,y:u.y+.9,z:u.z},l*=o.falloff??.9,c=t.monsters.filter(v=>!v.dead&&!r.has(v.id)&&Math.hypot(v.x-u.x,v.z-u.z)<p).sort((v,x)=>Math.hypot(v.x-u.x,v.z-u.z)-Math.hypot(x.x-u.x,x.z-u.z))[0]??null}}},trap:{fire(a,e){const t=a.game,s=e.P,o=e.aim.x,n=e.aim.z;a.traps.push({x:o,z:n,r:s.radius??2.4,arm:s.arm??.6,left:s.duration??15,ctx:e,particle:t.fx.spawn("mark",o,t.world.surface(o,n)+.1,n,{size:(s.radius??2.4)*.7,color:oe.INK,ground:!0,hold:!0,alpha:1})})},spring(a,e){const t=a.game,s=t.world.surface(e.x,e.z);t.bus.emit("blast",{x:e.x,y:s,z:e.z,r:e.r,element:e.ctx.def.element}),t.bus.emit("slam",{x:e.x,y:s,z:e.z,r:e.r});for(const o of lt(a,e.x,e.z,e.r))a.hit(e.ctx,o,"coef",1,e.x,e.z)}},mark:{fire(a,e){const t=a.game,s=e.P,o=e.aim.target;if(!o||o.dead)return;const n=s.radius?lt(a,o.x,o.z,s.radius):[o];for(const r of n)t.status.apply(r,"marked",s.duration??8,s.potency??.3),t.fx.spawn("mark",r.x,r.y+.1,r.z,{size:r.radius*2.6,life:s.duration??8,color:oe.INK,ground:!0,follow:r,dy:.1});t.bus.emit("chain",{from:{x:t.player.x,y:t.player.y+1.2,z:t.player.z},to:{x:o.x,y:o.y+.9,z:o.z},element:"shadow"})}},beam:{fire(a,e){const t=a.game,s=t.player,o=e.P,n=o.length??e.def.range,r=o.width??1,i=Math.max(1,Math.round(o.heads??1)),l=Math.max(1,Math.round(o.ticks??1)),c=o.gap??.1,d=e.aim.dirX,p=e.aim.dirZ;s.yaw=ht(d,p);const f=u=>{if(s.dead)return;const m=t.fx.muzzleOf(s);for(let g=0;g<i;g++){const v=(g-(i-1)/2)*.26,x=Math.cos(v),b=Math.sin(v),y=d*x-p*b,k=p*x+d*b,M=m[0]+y*n,z=m[2]+k*n;t.fx.laser(m[0],m[1],m[2],M,m[1]-.15,z,ee.CYAN,r*.62,c*1.8+.14),u===0&&t.fx.laser(m[0],m[1],m[2],M,m[1]-.15,z,ee.WHITE,r*.22,l*c+.12);for(let P=1;P<=3;P++)t.fx.light(m[0]+y*n*P/4,m[1],m[2]+k*n*P/4,5,c+.05);for(const P of t.monsters){if(P.dead)continue;const $=P.x-m[0],N=P.z-m[2],B=$*y+N*k;B<-P.radius||B>n+P.radius||Math.abs($*k-N*y)>r+P.radius||(a.hit(e,P,"coef",1,m[0],m[2]),u===0&&t.fx.bits(P.x,P.y+P.height*.6,P.z,4,ee.CYAN,4))}}t.fx.muzzle(s,ee.CYAN,!0),t.shake(.16)};f(0);for(let u=1;u<l;u++)a.later(u*c,()=>f(u))}}},Dd=.3,ia={distance:4.2,speed:22,invuln:.32,cooldown:4};class Id{game;shots=[];blasts=[];zones=[];traps=[];buffered=null;timers=[];stuck=[];dashCtx=null;onDashEnd=null;icd=new Map;lastDeny="";denyTimer=0;constructor(e){this.game=e}reset(){for(const e of this.shots)this.game.fx.release(e.particle);for(const e of this.zones){this.game.fx.release(e.particle);for(const t of e.drones??[])this.game.fx.release(t)}for(const e of this.traps)this.game.fx.release(e.particle);this.shots=[],this.blasts=[],this.zones=[],this.traps=[],this.stuck=[],this.buffered=null,this.timers=[],this.dashCtx=null,this.onDashEnd=null,this.icd.clear()}later(e,t){this.timers.push({t:e,fn:t})}dashEnded(){const e=this.onDashEnd;this.onDashEnd=null,this.dashCtx=null,e?.()}skillInSlot(e){const t=this.game.player.char.bar[e];return t&&this.game.player.build.skills.get(t)||null}cooldown(e){const t=this.game.player,s=t.cooldowns[e]??0,o=t.build.skills.get(e)?.params.cooldown??0;return{left:s,frac:o>0?Math.min(1,s/o):0}}canAfford(e){return(e.params.cost??0)<=this.game.player.resource+1e-6}useSlot(e,t={}){const s=this.game,o=s.player,n=this.skillInSlot(e);return n?o.cast&&o.cast.t<o.cast.hitAt?(this.buffered={slot:e,left:Dd},!1):this.cast(n,t.target??null,t.quiet):!1}cast(e,t,s=!1){const o=this.game,n=o.player,r=e.params,i=e.def;if(n.dead||o.status.stopped(n)||n.dash||(n.cooldowns[i.id]??0)>0)return!1;if(!this.canAfford(e))return s||this.deny(`Not enough ${n.build.cls.resource.name}.`),!1;const l=this.aim(i,t);n.resource-=r.cost??0,r.generate&&o.combat.gain(r.generate),r.cooldown&&(n.cooldowns[i.id]=r.cooldown),n.calm=Math.min(n.calm,2),n.moveTo=null;let c=0,d=0;for(const x of n.statuses){const b=bs[x.id].castBonus;!b||x.left<=0||x.stacks<=0||b.tag&&!i.tags.includes(b.tag)||!b.tag&&!i.tags.some(y=>y==="melee"||y==="ranged"||y==="area"||y==="projectile")||(c+=b.more??0,d+=b.crit??0,b.consume&&o.status.consume(x))}const p={skill:e,def:i,P:r,aim:l,more:c,critBonus:d};(i.targeting!=="self"||i.behavior==="nova")&&(n.yaw=ht(l.dirX,l.dirZ));const f=i.category==="basic",u=n.build.derived.attackSpeed*(f?n.build.derived.weapon.speed/1.2:1),m=(r.castTime??.4)/Math.max(.3,u);n.action=i.anim==="swing"?1:i.anim==="lunge"?4:i.anim==="shoot"?5:2,n.actionT=0,n.actionDur=m;const g=Pa[i.behavior],v=g.instant?0:m*(r.hitAt??(i.anim==="shoot"?.56:.45));if(n.cast={skill:i.id,t:0,dur:m,hitAt:v,fire:()=>g.fire(this,p)},r.invuln&&(n.invuln=Math.max(n.invuln,r.invuln)),v<=0){const x=n.cast.fire;n.cast.fire=null,x?.()}return o.bus.emit("skill",{id:i.id,element:i.element,behavior:i.behavior,category:i.category}),o.bus.emit("cast",{id:i.id,element:i.element,behavior:i.behavior,category:i.category,x:n.x,y:n.y,z:n.z}),this.fireTriggers("cast",i,null,0),!0}evade(e,t){const s=this.game,o=s.player;if(o.dead||o.evadeCd>0||o.dash||s.status.stopped(o))return!1;let n=e??0,r=t??0;!n&&!r&&([n,r]=Wo(o.yaw));const i=Math.hypot(n,r)||1;return n/=i,r/=i,o.cast=null,o.dash={x:n,z:r,speed:ia.speed,t:ia.distance/ia.speed},o.invuln=Math.max(o.invuln,ia.invuln),o.evadeCd=ia.cooldown,o.yaw=ht(n,r),o.action=4,o.actionT=0,o.actionDur=ia.distance/ia.speed+.05,o.moveTo=null,s.bus.emit("evade",{x:o.x,y:o.y,z:o.z}),this.fireTriggers("cast",{id:"evade",tags:["mobility","movement"]},null,0),!0}deny(e){this.lastDeny===e&&this.denyTimer>0||(this.lastDeny=e,this.denyTimer=1.5,this.game.bus.emit("log",{text:e}),this.game.bus.emit("deny"))}aim(e,t){const s=this.game,o=s.player;let n=null;const r=f=>!!f&&!f.dead&&!f.gone;r(t)?n=t:o.target&&o.target.kind==="monster"&&r(o.target)&&(n=o.target);let i,l;if(n)i=n.x,l=n.z;else if(s.controls.ground&&s.input.lastDevice==="mouse")i=s.controls.ground.x,l=s.controls.ground.z;else{const f=this.assistTarget(e.range>0?Math.max(8,e.range):11);f&&(n=f,i=f.x,l=f.z)}let c=(i??o.x)-o.x,d=(l??o.z)-o.z,p=Math.hypot(c,d);return p<.2&&([c,d]=Wo(o.yaw),p=1,i=o.x+c*3,l=o.z+d*3),e.targeting==="ground"&&e.range>0&&p>e.range&&(i=o.x+c/p*e.range,l=o.z+d/p*e.range),{x:i,z:l,dirX:c/p,dirZ:d/p,target:n}}assistTarget(e){const t=this.game,s=t.player,o=t.settings.aimAssist;if(o<=0)return t.entities.nearest("monster",s.x,s.z,e*.6);const n=s.intent;let r,i;if(n.moveX||n.moveZ){const d=Math.hypot(n.moveX,n.moveZ);r=n.moveX/d,i=n.moveZ/d}else[r,i]=Wo(s.yaw);let l=null,c=-1e9;for(const d of t.monsters){if(d.dead)continue;const p=d.x-s.x,f=d.z-s.z,u=Math.hypot(p,f);if(u>e)continue;const m=u>.01?(p*r+f*i)/u:1,g=-u/e+m*o;g>c&&(c=g,l=d)}return l}fireTriggers(e,t,s,o){const n=this.game,r=n.player;for(const i of r.build.triggers)i.on===e&&(i.skill&&i.skill!==t?.id||i.tag&&!t?.tags.includes(i.tag)||i.when&&!r.build.when[i.when]&&!this.whenNow(i)||(this.icd.get(i.id)??0)>n.time||i.chance<1&&!n.rng.chance(i.chance)||(i.icd&&this.icd.set(i.id,n.time+i.icd),this.runActions(i,t,s,o)))}whenNow(e){const t=this.game.player;switch(e.when){case"injured":return t.hp<t.maxHp*.35;case"healthy":return t.hp>t.maxHp*.8;case"barrier":return t.barrier>0;case"resourceHigh":return t.resource>=t.build.derived.maxResource*.5;case"resourceLow":return t.resource<t.build.derived.maxResource*.25;default:return!0}}runActions(e,t,s,o){const n=this.game,r=n.player;for(const i of e.actions)switch(i.do){case"status":i.to==="self"?n.status.apply(r,i.status,i.duration,i.potency??0,i.stacks??1):s&&!s.dead&&n.status.apply(s,i.status,i.duration,i.potency??0,i.stacks??1);break;case"resource":n.combat.gain(i.amount,!1);break;case"heal":n.combat.healHero(r.maxHp*i.pct,i.pct<.05);break;case"barrier":n.combat.barrierHero(i.pct,i.duration);break;case"refund":{const l=t&&r.build.skills.get(t.id);l?.params.cost&&(r.resource=Math.min(r.build.derived.maxResource,r.resource+l.params.cost),n.bus.emit("miss",{target:r,text:"Overflow"}));break}case"cooldowns":for(const l in r.cooldowns)r.cooldowns[l]=Math.max(0,r.cooldowns[l]-i.seconds);break;case"explode":{const l=s??r,c=n.world.surface(l.x,l.z);n.bus.emit("blast",{x:l.x,y:c,z:l.z,r:i.radius,element:i.element});const d=n.combat.weaponRoll()*i.coef;for(const p of n.monsters)p.dead||Math.hypot(p.x-l.x,p.z-l.z)>i.radius+p.radius||n.combat.heroHit(p,{skill:null,base:d,element:i.element,tags:["area",i.element],fromX:l.x,fromZ:l.z,noTriggers:!0});break}}}launch(e,t,s,o,n,r={}){const i=this.game,l=e.P,c=e.def.tags.includes("physical")&&e.def.tags.includes("ranged"),d=r.y??i.world.surface(t,s)+(c?1.25:.95),p=e.def.element,f=l.life??.8,u={x:t,y:d,z:s,vx:o*(l.speed??18),vz:n*(l.speed??18),life:f,radius:l.radius??.45,y0:d,life0:f,arc:c?.45:0,px:t,py:d,pz:s,pierce:Math.round(l.pierce??0),hit:new Set,ctx:e,mult:r.mult??1,element:p,plain:r.plain,kind:c?"arrow":"orb",particle:c?null:l.laser?i.fx.spawn("laser",t,d,s,{size:.15,aspect:6,rot:Math.atan2(o,n),axial:!0,color:ee.CYAN,hold:!0}):i.fx.spawn("orb",t,d,s,{size:p==="storm"?.4:.55,color:Xe[p],hold:!0}),ent:c?i.entities.add({...ms("missile","arrow"),kind:"missile",x:t,y:d,z:s,yaw:ht(o,n),radius:.12,height:.12,colors:[oe.RED,oe.RED,oe.RED]}):null};return c&&!r.plain&&i.fx.spawn("ring",t,d,s,{size:.28,life:.14,color:oe.WHITE,alpha:.8}),this.shots.push(u),u}update(e){const t=this.game,s=t.player;this.denyTimer-=e;for(const i in s.cooldowns)s.cooldowns[i]=Math.max(0,s.cooldowns[i]-e);s.evadeCd=Math.max(0,s.evadeCd-e),s.potionCd=Math.max(0,s.potionCd-e);const o=s.cast;if(o){if(o.t+=e,o.fire&&o.t>=o.hitAt){const i=o.fire;o.fire=null,i()}o.t>=o.dur&&(s.cast=null)}if(this.buffered){if(this.buffered.left-=e,this.buffered.left<=0)this.buffered=null;else if(!s.cast||s.cast.t>=s.cast.hitAt){const i=this.buffered.slot;this.buffered=null,this.useSlot(i,{quiet:!0})}}if(this.timers.length){const i=[];this.timers=this.timers.filter(l=>(l.t-=e)>0?!0:(i.push(l.fn),!1));for(const l of i)l()}const n=s.dash,r=this.dashCtx;if(n&&r&&n.hit&&((n.coef??0)>0||r.P.knock))for(const i of t.monsters)i.dead||n.hit.has(i.id)||Math.hypot(i.x-s.x,i.z-s.z)<(n.width??1.2)+i.radius&&(n.hit.add(i.id),this.hit(r,i,"coef"));this.updateShots(e),this.updateBlasts(e),this.updateZones(e),this.updateTraps(e)}heading(e,t,s,o,n,r){const i=this.game,l=i.camera,c=l.project(e,t,s),d=l.project(o,n,r);if(!c||!d)return 0;const p=i.renderer.size.cssW,f=i.renderer.size.cssH;return Math.atan2((d.x-c.x)*p,-(d.y-c.y)*f)}updateShots(e){const t=this.game;let s=0;for(const o of this.shots){o.px=o.x,o.py=o.y,o.pz=o.z,o.x+=o.vx*e,o.z+=o.vz*e,o.life-=e,o.arc&&(o.y=o.y0+o.arc*Math.sin(Math.PI*Math.min(1,1-o.life/o.life0))-.25*(1-o.life/o.life0));let n=o.life<=0||t.world.surface(o.x,o.z)>o.y-.1;if(!n){for(const r of t.monsters)if(!(r.dead||o.hit.has(r.id))&&!(Math.hypot(r.x-o.x,r.z-o.z)>=r.radius+o.radius)&&(o.hit.add(r.id),Pa.projectile.onShotHit(this,o,r),o.pierce--<=0)){n=!0;break}}if(o.ent){const r=o.ent,i=Math.hypot(o.x-o.px,o.z-o.pz);r.x=o.x,r.y=o.y,r.z=o.z,r.walk=Math.atan2(o.y-o.py,i||1e-4),Math.random()<.5&&t.fx.spawn("streak",o.x-o.vx*.012,o.y,o.z-o.vz*.012,{size:.42,life:.12,color:oe.WHITE,alpha:.45,rot:this.heading(o.px,o.py,o.pz,o.x,o.y,o.z)})}if(o.particle&&(o.particle.x=o.x,o.particle.y=o.y,o.particle.z=o.z,Math.random()<.6&&t.fx.spawn(o.ctx.P.laser?"bit":"spark",o.x,o.y,o.z,{size:o.ctx.P.laser?.06:.15,life:.25,color:o.ctx.P.laser?ee.CYAN:Xe[o.element],vy:.8}),t.fx.light(o.x,o.y,o.z,5,.05)),n){t.fx.release(o.particle),o.ent&&(o.hit.size&&o.pierce<0?o.ent.gone=!0:(o.ent.walk=-.5,o.ent.y=Math.min(o.ent.y,t.world.surface(o.x,o.z)+.12),this.stuck.push({ent:o.ent,left:1.4}))),o.kind==="orb"&&t.bus.emit("bolt:hit",{x:o.x,y:o.y,z:o.z,element:o.element});continue}this.shots[s++]=o}this.shots.length=s,this.stuck=this.stuck.filter(o=>(o.left-=e)>0?!0:(o.ent.gone=!0,!1))}updateBlasts(e){let t=0;for(const s of this.blasts){if(s.t+=e,s.fall){const o=Math.min(1,s.t/s.delay);s.fall.y=this.game.world.surface(s.x,s.z)+9*(1-o*o)+.4}if(s.t<s.delay){this.blasts[t++]=s;continue}this.game.fx.release(s.fall??null),Pa.blast.land(this,s)}this.blasts.length=t}updateZones(e){const t=this.game,s=t.player;let o=0;for(const n of this.zones){for(n.left-=e,n.follow&&(n.x=s.x,n.z=s.z),n.drones&&n.drones.forEach((r,i)=>{const l=t.fx.dronePos(i,n.drones.length,s);r.x=l[0],r.y=l[1],r.z=l[2]}),n.particle&&(n.particle.x=n.x,n.particle.z=n.z,n.particle.y=t.world.surface(n.x,n.z)+.12),n.next-=e;n.next<=0&&n.left>0;)n.next+=n.tick,Pa.zone.tick(this,n);if(n.left<=0){t.fx.release(n.particle),Pa.zone.end?.(this,n);continue}this.zones[o++]=n}this.zones.length=o}updateTraps(e){const t=this.game;let s=0;for(const o of this.traps){o.left-=e,o.arm-=e;let n=!1;if(o.arm<=0){for(const r of t.monsters)if(!r.dead&&Math.hypot(r.x-o.x,r.z-o.z)<o.r*.6+r.radius){n=!0;break}}if(n){Pa.trap.spring(this,o),t.fx.release(o.particle);continue}if(o.left<=0){t.fx.release(o.particle);continue}this.traps[s++]=o}this.traps.length=s}hit(e,t,s,o=1,n,r,i=!1){const l=this.game,c=l.player,d=l.combat.weaponRoll()*(e.P[s]??0)*o;return d<=0?(i||l.combat.touch(t,e.P),null):l.combat.heroHit(t,{skill:e.skill,base:d,element:e.def.element,tags:e.def.tags,critBonus:e.critBonus,more:e.more,fromX:n??c.x,fromZ:r??c.z,params:i?void 0:e.P})}}const Qo=.5,Vr=["stun","freeze","chill","slow"];class Fd{game;fxTimer=0;constructor(e){this.game=e}has(e,t){return e.statuses.some(s=>s.id===t)}stopped(e){return e.statuses.some(t=>t.id==="stun"||t.id==="freeze")}speedMul(e){let t=1;for(const s of e.statuses)s.id==="chill"?t*=1-Math.min(.6,s.potency):s.id==="slow"&&(t*=1-Math.min(.7,s.potency));return t}apply(e,t,s,o=0,n=1,r){if(e.dead||s<=0)return;const i=bs[t],l=this.game;if(e.kind==="player"){if(Vr.includes(t)&&this.has(e,"unstoppable"))return;(t==="stun"||t==="freeze")&&(s=Math.min(1,s*e.build.derived.ccTaken)),t==="chill"&&(o=Math.min(o,.6)),t==="unstoppable"&&this.clear(e,Vr)}else{const d=e;(t==="stun"||t==="freeze")&&d.boss?s*=.35:(t==="stun"||t==="freeze")&&d.elite&&(s*=.6)}let c=e.statuses.find(d=>d.id===t);if(!c)c={id:t,left:s,dur:s,potency:o,stacks:Math.min(n,i.maxStacks??99),tick:Qo,src:r},e.statuses.push(c);else if(i.stacking==="stack"){const d=i.maxStacks??99;c.stacks<d?(c.stacks=Math.min(d,c.stacks+n),c.potency+=o):c.potency+=o*.2,c.left=Math.max(c.left,s),c.dur=Math.max(c.dur,s)}else c.potency=Math.max(c.potency,o),c.stacks=Math.max(c.stacks,n),c.left=Math.max(c.left,s),c.dur=Math.max(c.dur,c.left);t==="chill"&&e.kind==="monster"&&c.potency>=md&&(this.clear(e,["chill"]),this.apply(e,"freeze",1.5),l.bus.emit("miss",{target:e,text:"Frozen"})),e.kind==="player"&&i.mods&&(e.dirty=!0)}applyDot(e,t,s,o,n){if(o<=0||n<=0)return;const r=this.game.player,i=e.kind==="monster"?1+r.build.totals.add.dmgDot:1,l=e.kind==="monster"?r.build.totals.more[t==="poison"?"dmgPoison":t==="burn"?"dmgFire":"dmgPhysical"]:1;this.apply(e,t,n,s*o/n*i*l,1,r.id)}clear(e,t){const s=e.statuses.length;e.statuses=e.statuses.filter(o=>!t.includes(o.id)),e.kind==="player"&&e.statuses.length!==s&&(e.dirty=!0)}consume(e){e.stacks--,e.stacks<=0&&(e.left=0)}update(e){const t=this.game;this.run(t.player,e);for(const s of t.monsters)s.dead||this.run(s,e);if((this.fxTimer-=e)<=0){this.fxTimer=.18;for(const s of t.monsters){if(s.dead||!s.statuses.length)continue;const o=s.y+s.height*s.scale+.1;for(const n of s.statuses)if(n.id==="burn"&&Math.random()<.6)t.fx.spawn("spark",s.x+(Math.random()-.5)*.5,s.y+.5,s.z+(Math.random()-.5)*.5,{size:.15,life:.5,color:oe.FLAME,vy:1.6,drag:1});else if(n.id==="poison"&&Math.random()<.4)t.fx.spawn("mote",s.x+(Math.random()-.5)*.6,s.y+.4,s.z+(Math.random()-.5)*.6,{size:.09,life:.8,color:oe.POISON,vy:.8});else if((n.id==="stun"||n.id==="freeze")&&Math.random()<.5){const r=t.time*6+Math.random();t.fx.spawn("spark",s.x+Math.cos(r)*.4,o,s.z+Math.sin(r)*.4,{size:.14,life:.3,color:n.id==="freeze"?oe.FROST:oe.GOLD})}}}}run(e,t){const s=this.game;let o=!1,n=null,r=0;for(const i of e.statuses){i.left-=t;const l=bs[i.id];if(l.dot&&i.potency>0)for(i.tick-=t;i.tick<=0&&!e.dead;){i.tick+=Qo;const c=e.kind==="monster"?Math.min(.7,e.def.resist?.[l.dot]??0):e.build.derived.resist[l.dot],d=this.has(e,"vulnerable")?1.2:1,p=Math.max(1,Math.round(i.potency*Qo*(1-c)*d*(e.kind==="monster"?1-e.dr:1)));s.combat.damage(e,p,e.kind==="monster"?s.player:null,!1,l.dot,!1,!0)}if(i.id==="mending"&&e.kind==="player"&&s.combat.healHero(i.potency*t,!0),i.left<=0){i.id==="warded"&&(e.barrier=0),e.kind==="player"&&l.mods&&(o=!0);continue}l.tint&&!n&&(n=l.tint),e.statuses[r++]=i}e.statuses.length=r,e.tint=n,o&&e.kind==="player"&&(e.dirty=!0)}}const Xr=26,Nd=58,Bd=82,Od=.08,Zr={alchemist:{extra:1,colors:[[150,178,120],[222,178,110],[122,62,44]],title:"Alchemist"},warden:{extra:2,colors:[[84,108,156],[116,156,138],[150,142,132]],title:"Warden"},smith:{extra:1,colors:[[74,77,94],[176,128,84],[226,188,130]],title:"Smith"},stash:{extra:1,colors:[[176,128,84],[226,188,130],[74,77,94]],title:"Stash-keeper"},tinker:{extra:1,colors:[[176,128,84],[116,156,138],[150,142,132]],title:"Tinker"},sage:{extra:2,colors:[[136,90,120],[226,176,52],[232,226,212]],title:"Sage"}};class jd{game;timer=0;npcSites=new Set;constructor(e){this.game=e}reset(){this.timer=0,this.npcSites.clear()}update(e){const t=this.game,s=t.player;if(this.timer-=e,this.timer>0)return;if(this.timer=.35,t.world!==t.overworld){t.monsters=t.monsters.filter(u=>!u.gone);return}for(const u of t.monsters)!u.dead&&Math.hypot(u.x-s.x,u.z-s.z)>Bd&&u.ai.state!=="chase"&&(u.gone=!0);t.monsters=t.monsters.filter(u=>!u.gone);for(const u of t.world.sites.inRange(s.x,s.z,140)){if(u.den&&!u.denStocked&&Math.hypot(u.x-s.x,u.z-s.z)<70){u.denStocked=!0;const m=t.world.biome(u.x,u.z).monsters[0][0],g=Math.max(1,gs(Math.hypot(u.x,u.z))+1);this.spawnMonster(m,u.x+2.5,u.z+2.5,g,{rank:"elite",affixes:this.rollAffixes(g,1)})}if(!this.npcSites.has(u.key)){this.npcSites.add(u.key);for(const m of u.npcs??[])this.spawnNpc(m,u)}}for(const u of t.world.sites.inRange(s.x,s.z,400))u.denStocked&&Math.hypot(u.x-s.x,u.z-s.z)>200&&(u.denStocked=!1);if(t.monsters.length>=zt.MAX_MONSTERS||t.paused)return;const o=t.rng.angle(),n=Xr+t.rng.next()*(Nd-Xr),r=s.x+Math.cos(o)*n,i=s.z+Math.sin(o)*n;if(!this.clear(r,i))return;const l=t.world.biome(r,i).monsters,c=t.rng.weighted(l),d=1+Math.floor(t.rng.next()*(c==="cragling"?1.5:3.2)),p=Math.max(1,gs(Math.hypot(r,i))+(t.rng.chance(.3)?1:0)),f=.05+Od*t.stakes.night()+(s.char.difficulty==="veteran"?.03:s.char.difficulty==="nightmare"?.06:0);for(let u=0;u<d&&t.monsters.length<zt.MAX_MONSTERS;u++){const m=r+(t.rng.next()-.5)*5,g=i+(t.rng.next()-.5)*5;if(!this.clear(m,g))continue;const v=u===0&&p>=2&&t.rng.chance(f);this.spawnMonster(c,m,g,p,v?{rank:"elite",affixes:this.rollAffixes(p)}:{})}}rollAffixes(e,t=1,s=!1){const o=Math.max(t,1+(e>=15?1:0)+(s&&e>=30?1:0));return this.game.rng.shuffle([..._d]).slice(0,o)}clear(e,t){const s=this.game.world;if(!s.walkable(e,t)||s.waterDepth(e,t)>.1)return!1;const o=s.sites.near(e,t);return!(o&&o.safe&&Math.hypot(e-o.x,t-o.z)<o.safe+6)}spawnMonster(e,t,s,o,n={}){const r=this.game,i=Ia[e]??Ia.sproutling,l=n.rank??"normal",c=n.affixes??[],d=zd(i,o,l,r.player.char.difficulty),p=tr.affixNumbers(c),f=r.world.biome(t,s).variant,u=n.hide??(f?f.pencil:i.colors[0]),m=f?`${f.prefix} ${i.name}`:i.name,g=Ol[l].size,v=l!=="normal",x=l==="boss"?.65:v?.45:0,b=u.map((M,z)=>M*(1-x)+[74,77,94][z]*x),y=n.name??(l==="boss"?`${m}, the Inkbound`:v?`Elder ${m}`:m),k={...ms("monster",i.archetype),kind:"monster",x:t,z:s,y:r.world.surface(t,s),yaw:r.rng.angle(),scale:i.scale*g*(.94+r.rng.next()*.12),grow:0,radius:i.radius*(v?1.4:1)*(l==="boss"?1.25:1),height:i.height*g,colors:qr([b,i.colors[1],i.colors[2]]),name:y,level:o,hp:d.maxHp,maxHp:d.maxHp,atk:d.atk,xp:d.xp,armor:d.armor,dr:1-p.taken+(l==="boss"?.1:0),statuses:[],barrier:c.includes("warded")?d.maxHp*.3:0,invuln:0,def:i,defId:i.id,rank:l,elite:v,affixes:c,boss:l==="boss",resident:n.resident,deathT:0,ai:{state:"idle",hx:t,hz:s,gx:t,gz:s,going:!1,timer:r.rng.next()*3,cd:0,target:null,provoked:!1,pushX:0,pushZ:0,struck:!1,stun:0}};return r.entities.add(k),r.monsters.push(k),k.boss&&r.bus.emit("boss:spawn",k),k}summonAround(e,t){const s=this.game;for(let o=0;o<t;o++){const n=s.rng.angle(),r=e.x+Math.cos(n)*3,i=e.z+Math.sin(n)*3;if(!s.world.walkable(r,i))continue;const l=this.spawnMonster(e.defId,r,i,Math.max(1,e.level-1),{resident:e.resident});l.ai.provoked=!0,l.ai.state="chase",l.ai.target=s.player}}spawnNpc(e,t){const s=this.game,o=Zr[e.role]??Zr.warden,n={...ms("npc","humanoid"),kind:"npc",x:e.x,z:e.z,y:s.world.surface(e.x,e.z),yaw:Math.atan2(e.x-t.x,-(e.z-t.z)),radius:.45,height:1.6,extra:o.extra,colors:qr(o.colors),name:e.name,role:e.role,npcId:e.id,siteKey:t.key,title:o.title};return s.entities.add(n)}}const Dt=a=>({ok:!1,reason:a}),Ao={ok:!0},Ul=a=>a.reduce((e,t)=>e+(t?0:1),0),Ps=a=>a.findIndex(e=>!e);function ar(a,e){const t=Ps(a.bag);return t>=0&&(a.bag[t]=e),t}function Wl(a,e){const t=To(ve[e.base]);return t.find(s=>!a.equipment[s])??t[0]}const Qr=a=>!!a&&ve[a.base]?.hands===2;function Ud(a,e,t){const s=a.bag[e];if(!s)return Dt("Nothing there.");const o=Fe[a.classId],n=Rl(o,s,a.level);if(!n.ok)return n;const r=Wl(a,s);if(!To(ve[s.base]).includes(r))return Dt("It does not go there.");const i=a.equipment[r];let l=null;if(r==="mainhand"&&Qr(s)&&a.equipment.offhand&&(l="offhand"),r==="offhand"&&Qr(a.equipment.mainhand)&&(l="mainhand"),l&&Ul(a.bag)+(i?0:1)<1)return Dt("Your bag is too full to take off the other hand.");if(a.bag[e]=i??null,a.equipment[r]=s,s.fresh=!1,l){const c=a.equipment[l];delete a.equipment[l],ar(a,c)}return Ao}function Wd(a,e,t){const s=a.equipment[e];if(!s)return Dt("Nothing worn there.");const o=Ps(a.bag);return o<0?Dt("Your bag is full."):(a.bag[o]=s,delete a.equipment[e],Ao)}const Jr=["weapon","offhand","helm","chest","gloves","legs","boots","amulet","ring"];function Kd(a){const e=a.bag.filter(t=>!!t);e.sort((t,s)=>Jr.indexOf(ve[t.base].slot)-Jr.indexOf(ve[s.base].slot)||Br(s.rarity)-Br(t.rarity)||Ba(s)-Ba(t));for(let t=0;t<a.bag.length;t++)a.bag[t]=e[t]??null}function Gd(a,e,t){const s=a.bag[t];if(!s)return Dt("Nothing there.");const o=Ps(e);return o<0?Dt("This stash tab is full."):(e[o]=s,a.bag[t]=null,Ao)}function Yd(a,e,t){const s=e[t];if(!s)return Dt("Nothing there.");const o=Ps(a.bag);return o<0?Dt("Your bag is full."):(a.bag[o]=s,e[t]=null,Ao)}const yo=(a,e)=>a.materials[e]??0;function Kl(a,e,t){a.materials[e]=(a.materials[e]??0)+t}function Pn(a,e,t){return yo(a,e)<t?!1:(a.materials[e]-=t,a.materials[e]<=0&&delete a.materials[e],!0)}function Vd(a,e){const t=To(ve[e.base]);if(t.length>1){const s=t.map(o=>a.equipment[o]).filter(o=>!!o);return s.length<t.length?null:s.sort((o,n)=>Ba(o)-Ba(n))[0]}return a.equipment[t[0]]??null}const ei=[244/255,190/255,62/255],Xd=[198/255,62/255,58/255],Zd=2.6,Qd=.85;class Jd{game;drops=[];beams=new Map;constructor(e){this.game=e}reset(){for(const e of this.beams.values())this.game.fx.release(e);this.beams.clear(),this.drops=[]}dropFrom(e){const t=this.game,s=t.player,o={rank:e.rank,level:e.level,classId:s.char.classId,magicFind:s.build.derived.magicFind,goldFind:s.build.derived.goldFind,difficulty:s.char.difficulty,night:t.stakes.night(),def:e.def};this.scatter(Gr(t.rng,o),e.x,e.z)}chest(e,t,s,o="chest"){const n=this.game,r=n.player;this.scatter(Gr(n.rng,{rank:o,level:s,classId:r.char.classId,magicFind:r.build.derived.magicFind,goldFind:r.build.derived.goldFind,difficulty:r.char.difficulty,night:0}),e,t)}scatter(e,t,s){for(const o of e){const n=this.game.rng.angle(),r=.5+this.game.rng.next()*(e.length>3?1.6:1);this.spawn(o,t,s,t+Math.cos(n)*r,s+Math.sin(n)*r)}}spawn(e,t,s,o,n,r=!1){const i=this.game;let l=ei,c=0,d="",p=null;if(e.type==="gold")d=`${e.n} glint`;else if(e.type==="potion")l=Xd,c=2,d="Red Tonic";else if(e.type==="material"){const u=Ht[e.id];l=u?[u.color[0]/255,u.color[1]/255,u.color[2]/255]:ei,c=1,d=`${u?.name??e.id}${e.n>1?` ×${e.n}`:""}`}else p=e.item.rarity,l=i.fx.rarityPencil(p),c=ve[e.item.base]?.shape??3,d=gt(e.item);const f={...ms("drop","drop"),kind:"drop",x:t,z:s,y:i.world.surface(t,s),tx:o,tz:n,radius:.4,height:.7,extra:c,colors:[l,l,l],name:d,loot:e,rarity:p,age:r?1:0,grow:r?1:0,keep:r};if(i.entities.add(f),this.drops.push(f),p==="legendary"||p==="unique"||p==="rare"){const u=i.fx.lootBeam(f,p);u&&this.beams.set(f.id,u)}return(p==="legendary"||p==="unique")&&i.bus.emit("item:legendary",{item:e.item}),f}discard(e){const t=this.game.player;this.spawn({type:"item",item:e},t.x,t.z,t.x+.8,t.z+.4,!0)}update(e){const t=this.game,s=t.player,o=t.settings.autoPickup;let n=0;for(const r of this.drops){if(r.gone){this.unbeam(r);continue}r.age+=e,r.grow=Math.min(1,r.grow+e*5);const i=Math.min(1,r.age/.4);r.x+=(r.tx-r.x)*Math.min(1,e*8),r.z+=(r.tz-r.z)*Math.min(1,e*8),r.lift=Math.sin(i*Math.PI)*.6,r.y=t.world.surface(r.x,r.z);const l=Math.hypot(r.x-s.x,r.z-s.z),c=r.loot.type==="item",d=!c||o||s.target===r;if(r.age>.45&&!s.dead&&d&&l<(c?2:Zd)&&(r.tx=s.x,r.tz=s.z,l<Qd+(c?.5:0)&&this.take(r))){r.gone=!0,this.unbeam(r);continue}if(!r.keep&&r.age>(c?600:120)){r.gone=!0,this.unbeam(r);continue}this.drops[n++]=r}this.drops.length=n}unbeam(e){const t=this.beams.get(e.id);t&&(this.game.fx.release(t),this.beams.delete(e.id))}take(e){const t=this.game,s=t.player.char,o=e.loot;let n=e.name,r=!1;if(o.type==="gold")s.gold+=o.n;else if(o.type==="potion"){if(s.potions>=t.player.build.derived.potionCharges)return!1;s.potions++}else if(o.type==="material")Kl(s,o.id,o.n),r=!0;else{if(ar(s,o.item)<0)return e.warned||(e.warned=!0,t.bus.emit("log",{text:"Your bag is full."}),t.bus.emit("deny")),!1;r=o.item.rarity!=="common",(o.item.rarity==="legendary"||o.item.rarity==="unique")&&s.tally.legendaries++,n=gt(o.item),t.bus.emit("inventory:changed")}return t.bus.emit("pickup",{x:e.x,y:e.y,z:e.z,item:o.type==="item"?o.item.base:o.type==="material"?o.id:o.type,n:"n"in o?o.n:1,rare:r,name:n,rarity:e.rarity??void 0}),!0}}const Jo=["sproutling","puffcap","bristlehog","wisp","shellsnap","cragling"],en=["sprout_leaf","puff_spore","hog_bristle","snap_claw","wisp_ember","crag_shard"],ti=(a,e)=>`${a} ${e}${a===1?"":"s"}`,Za={cull:{offer(a,e,t){const s=e.journey,o=Math.min(Jo.length-3,Math.floor(e.level/3)),n=Jo[(o+t+s.bountiesDone)%Math.min(Jo.length,o+4)],r=Ia[n],i=4+t*2+Math.floor(e.level/2);return{monster:n,name:r.name,need:i,xp:Math.round(r.xp*i*.9*(1+e.level*.25)),glint:Math.round((10+r.xp)*i*.35)}},title:a=>`Cull ${ti(a.need,a.name)}`,track:a=>`${a.name}s: ${a.have} / ${a.need}`},gather:{offer(a,e,t){const s=e.journey,o=Math.min(en.length-2,Math.floor(e.level/3)),n=en[(o+t+s.bountiesDone)%Math.min(en.length,o+3)],r=Ht[n],i=3+Math.floor(e.level/3);return{item:n,name:r.name,need:i,xp:Math.round(r.value*i*2.2*(1+e.level*.2)),glint:Math.round(r.value*i*2.5)}},title:a=>`Bring ${ti(a.need,a.name)}`,track:a=>`${a.name}s: ${a.have} / ${a.need}`,have:(a,e)=>Math.min(e.need,yo(a.player.char,e.item)),pay:(a,e)=>{Pn(a.player.char,e.item,e.need)}},elder:{offer(a,e){const t=e.journey,s=a.overworld.sites.inRange(0,0,900).filter(r=>r.den).sort((r,i)=>Math.hypot(r.x,r.z)-Math.hypot(i.x,i.z)),o=s[t.bountiesDone%Math.max(1,Math.min(s.length,2+Math.floor(e.level/2)))];if(!o)return null;const n=Math.hypot(o.x,o.z);return{key:o.key,x:o.x,z:o.z,place:o.name,need:1,xp:Math.round(70+n*.25+e.level*20),glint:Math.round(40+n*.08+e.level*8)}},title:a=>`Slay the elder in the ${a.place}`,track:a=>a.have?"The elder is slain":`The elder in the ${a.place}`},scout:{offer(a,e){const t=e.journey,s=a.overworld.sites.inRange(0,0,1100).filter(r=>!t.found[r.key]).sort((r,i)=>Math.hypot(r.x,r.z)-Math.hypot(i.x,i.z)),o=s[t.bountiesDone%Math.max(1,Math.min(s.length,3))];if(!o)return null;const n=Math.hypot(o.x,o.z);return{key:o.key,x:o.x,z:o.z,place:o.name,need:1,xp:Math.round(30+n*.2+e.level*8),glint:Math.round(20+n*.07)}},title:a=>`Find ${a.place} and report back`,track:a=>a.have?`${a.place} is found`:`Find ${a.place}`,have:(a,e)=>a.player.char.journey.found[e.key]?1:0},delve:{offer(a,e){const t=e.journey,s=a.overworld.sites.inRange(0,0,1400).filter(r=>r.kind==="dungeon"&&!t.dungeons[r.key]).sort((r,i)=>Math.hypot(r.x,r.z)-Math.hypot(i.x,i.z)),o=s[t.bountiesDone%Math.max(1,Math.min(s.length,2))];if(!o)return null;const n=Math.hypot(o.x,o.z);return{key:o.key,x:o.x,z:o.z,place:o.name,need:1,xp:Math.round(120+n*.3+e.level*25),glint:Math.round(60+n*.1+e.level*10)}},title:a=>`Clear ${a.place}`,track:a=>a.have?`${a.place} is cleared`:`Clear ${a.place}`,have:(a,e)=>a.player.char.journey.dungeons[e.key]?1:0}};class eh{game;offers=[];timer=0;constructor(e){this.game=e}reset(){this.offers=[],this.timer=0}refresh(){const e=this.game,t=e.player.char,s=t.journey.bountiesDone,o=(r,i)=>{const l=Za[r].offer(e,t,i);return l?{kind:r,have:0,...l}:null},n=["elder","scout","delve"][s%3];return this.offers=[o("cull",0),o(s%2?"cull":"gather",1),o(n,2)||o("scout",2)||o("cull",2)],this.offers}title(e){return Za[e.kind??"cull"].title(e)}track(e){return e.have>=e.need?"Done: return to a warden":Za[e.kind??"cull"].track(e)}accept(e){const t=this.game.player.char.journey,s=this.offers[e];t.bounty||!s||(t.bounty={...s},this.progress(),this.game.bus.emit("bounty:changed"),this.game.bus.emit("log",{text:`Bounty taken: ${this.title(t.bounty)}.`}))}abandon(){this.game.player.char.journey.bounty=null,this.game.bus.emit("bounty:changed")}done(e){e.have=e.need,this.game.bus.emit("bounty:changed"),this.game.bus.emit("log",{text:"Bounty complete. Return to a warden.",big:!0})}onKill(e){const t=this.game.player.char.journey.bounty;!t||t.have>=t.need||((t.kind??"cull")==="cull"&&t.monster===e.defId?(t.have++,t.have>=t.need?this.done(t):this.game.bus.emit("bounty:changed")):t.kind==="elder"&&e.elite&&t.x!==void 0&&Math.hypot(e.x-t.x,e.z-t.z)<40&&this.done(t))}progress(){const e=this.game,t=e.player.char.journey.bounty,s=t&&Za[t.kind??"cull"];if(!t||!s?.have)return;const o=s.have(e,t),n=t.have;o!==n&&(t.have=o,o>=t.need&&n<t.need?this.done(t):e.bus.emit("bounty:changed"))}update(e){(this.timer-=e)>0||(this.timer=.4,this.progress())}claim(){const e=this.game,t=e.player.char,s=t.journey,o=s.bounty;return this.progress(),!o||o.have<o.need?!1:(Za[o.kind??"cull"].pay?.(e,o),s.bounty=null,s.bountiesDone++,t.gold+=o.glint,e.combat.grantXp(o.xp),e.bus.emit("bounty:claimed",o),e.bus.emit("bounty:changed"),this.refresh(),!0)}}const tn=["walk","look","fight","skill","bounty"],Os={dodge:{seconds:9,when:a=>a.hazards.warned},tonic:{seconds:12,when:a=>!a.player.dead&&a.player.hp<a.player.maxHp*.45&&a.player.char.potions>0},points:{seconds:12,when:a=>Cs(a.player.char.level,a.player.char.bonusPoints)>Ts(a.player.char.tree)},loot:{seconds:10,when:a=>a.player.char.bag.some(e=>e&&e.rarity!=="common")}};class th{game;i=-1;goal=null;mobs=[];t=0;from=null;tip=null;pulse=0;constructor(e){this.game=e;const t=e.bus;t.on("begin",()=>this.begin()),t.on("guide:skip",s=>this.finish(!0,!!(s&&s.quiet))),t.on("guide:restart",()=>{this.clear(),this.go(0)}),t.on("skill",s=>{this.step==="skill"&&s.id===e.player.char.bar[1]&&this.next()}),t.on("bounty:changed",()=>{this.step==="bounty"&&e.player.char.journey.bounty&&this.next()}),t.on("drink",()=>{this.tip?.id==="tonic"&&this.endTip()}),t.on("ui:toggle",s=>{(this.tip?.id==="points"&&s==="skills"||this.tip?.id==="loot"&&s==="inventory")&&this.endTip()})}reset(){this.clear()}get step(){return this.i>=0?tn[this.i]:null}begin(){const e=this.game.player.char,t=e.journey;if(t.guide!=="done"){if(e.level>1||e.xp>0||t.bounty){t.guide="done";return}this.go(0)}}go(e){const t=this.game,s=t.player;this.i=e,this.t=0,this.goal=null,this.endTip();const o=this.step;if(o==="walk")this.goal=this.freeSpot(6.5,.6);else if(o==="look")this.from={...t.camera.goal};else if(o==="fight")this.goal=this.practice(4.2,.9)[0];else if(o==="skill"){this.mobs=this.mobs.filter(r=>!r.dead&&!r.gone);const n=this.practice(3.6,.8,3-Math.min(2,this.mobs.length));this.goal=n[0]||this.mobs[0]||null}else if(o==="bounty"){if(s.char.journey.bounty)return this.next();if(this.goal=t.entities.nearest("npc",s.x,s.z,80,n=>n.role==="warden"),!this.goal)return this.next()}this.announce()}next(){this.game.bus.emit("guide:step",{id:this.step}),this.i+1<tn.length?this.go(this.i+1):this.finish(!1)}finish(e,t=!1){const s=this.game.player.char.journey;this.i<0&&s.guide==="done"||(this.clear(),s.guide="done",this.game.bus.emit("guide",null),this.game.bus.emit("guide:done",{skipped:e,quiet:t}))}clear(){for(const e of this.mobs)e.dead||(e.gone=!0);this.mobs=[],this.i=-1,this.goal=null,this.endTip()}announce(){const e=this.goal,t=!!e&&"kind"in e;this.game.bus.emit("guide",{id:this.step,index:this.i,total:tn.length,at:e&&!t?e:null,entity:t?e:null})}freeSpot(e,t){const s=this.game,o=s.player,n=s.world,r=s.camera.fwd,i=Math.atan2(r[2],r[0]);for(let l=0;l<16;l++){const c=i+(l%2?1:-1)*Math.ceil(l/2)*.39,d=o.x+Math.cos(c)*e,p=o.z+Math.sin(c)*e;if(!n.walkable(d,p)||n.waterDepth(d,p)>.05)continue;let f=!0;n.forEachProp(d,p,t,u=>{u.def.collide>0&&Math.hypot(u.x-d,u.z-p)<u.def.collide*u.scale+t&&(f=!1)});for(const u of s.entities.list)u!==o&&!u.dead&&Math.hypot(u.x-d,u.z-p)<t+u.radius&&(f=!1);if(f)return{x:d,y:n.surface(d,p),z:p}}return{x:o.x+e,y:n.surface(o.x+e,o.z),z:o.z}}practice(e,t,s=1){const o=this.game,n=[],r=this.freeSpot(e,t);for(let i=0;i<s;i++){const l=o.spawner.spawnMonster("sproutling",r.x+(i%2?.9:-.9)*Math.ceil(i/2),r.z+(i?.7:0),1);l.marked=!0,l.practice=!0,this.mobs.push(l),n.push(l)}return n}endTip(){this.tip&&(this.tip=null,this.i<0&&this.game.bus.emit("guide",null))}update(e){const t=this.game,s=t.player,o=s.char.journey;if(t.paused)return;const n=this.step;if(n){this.t+=e;const r=this.goal;if(n==="walk"&&r)(this.pulse-=e)<=0&&(this.pulse=.8,t.fx.click(r.x,r.y,r.z)),Math.hypot(s.x-r.x,s.z-r.z)<1.3&&this.next();else if(n==="look"&&this.from){const i=t.camera.goal,l=this.from;(Math.abs(i.yaw-l.yaw)>.45||Math.abs(i.pitch-l.pitch)>.18||Math.abs(i.distance/l.distance-1)>.14)&&this.next()}else n==="fight"?(!r||r.dead||r.gone)&&this.next():n==="skill"?(!r||r.dead||r.gone)&&(this.goal=this.mobs.find(i=>!i.dead&&!i.gone)||null,this.goal||(this.goal=this.practice(3.6,.8,2)[0]),this.announce()):n==="bounty"&&o.bounty&&this.next();return}if(o.guide==="done"){if(this.tip){this.tip.left-=e,(this.tip.left<=0||!Os[this.tip.id].when(t))&&this.endTip();return}for(const r in Os)if(!(o.tips[r]||!Os[r].when(t))){o.tips[r]=1,this.tip={id:r,left:Os[r].seconds},t.bus.emit("guide",{id:"tip:"+r,tip:!0});break}}}}class ah{game;list=[];warned=!1;constructor(e){this.game=e,e.bus.on("telegraph",t=>{const s=e.player;Math.hypot(t.x-s.x,t.z-s.z)<(t.len??t.r??0)+6&&(this.warned=!0)})}reset(){this.clear()}cloud(e,t,s,o,n,r="poison"){const i=this.game,l=i.world.surface(e.x,e.z);i.bus.emit("hazard:cloud",{x:e.x,y:l,z:e.z,r:t,life:s,color:r==="fire"?oe.FLAME:i.fx.danger}),this.list.push({kind:"cloud",src:e,x:e.x,z:e.z,r:t,left:s,mult:o,tick:n,next:n*.5,element:r})}patch(e,t,s,o,n){this.cloud(e,t,s,o,.5,n)}shot(e,t,s,o){const n=this.game,r=e.y+.9,i=n.fx.spawn("orb",e.x+t*.5,r,e.z+s*.5,{size:.5,color:[e.colors[2][0],e.colors[2][1],e.colors[2][2]],hold:!0}),l=o.speed??8.5;this.list.push({kind:"shot",src:e,x:e.x+t*.5,y:r,z:e.z+s*.5,vx:t*l,vz:s*l,r:o.r??.4,left:o.life??1.7,mult:o.mult,orb:i,element:o.element??"physical"}),n.bus.emit("monster:shot",e)}clear(){for(const e of this.list)e.kind==="shot"&&this.game.fx.release(e.orb);this.list.length=0}update(e){const t=this.game,s=t.player;let o=0;for(const n of this.list){n.left-=e;let r=n.left<=0;n.kind==="cloud"?(n.next-=e,n.next<=0&&(n.next=n.tick,!s.dead&&Math.hypot(s.x-n.x,s.z-n.z)<n.r&&t.combat.hurtHero(n.src,n.mult,!0,n.element))):(n.x+=n.vx*e,n.z+=n.vz*e,n.orb&&(n.orb.x=n.x,n.orb.y=n.y,n.orb.z=n.z),t.fx.light(n.x,n.y,n.z,4,.05),t.world.surface(n.x,n.z)>n.y-.1&&(r=!0),r||t.world.forEachProp(n.x,n.z,1,i=>{i.def.collide>0&&Math.hypot(i.x-n.x,i.z-n.z)<i.def.collide*i.scale+.15&&n.y<i.y+i.def.height*i.scale&&(r=!0)}),!r&&!s.dead&&Math.hypot(s.x-n.x,s.z-n.z)<n.r+s.radius&&(t.combat.hurtHero(n.src,n.mult,!1,n.element),r=!0),r&&(t.bus.emit("shot:hit",{x:n.x,y:n.y,z:n.z}),t.fx.release(n.orb))),!r&&(this.list[o++]=n)}this.list.length=o}}const oo=Ge.filter(a=>!a.hidden),ai=[4,8,oo.length],si=["sprout_leaf","puff_spore","hog_bristle","wisp_ember","crag_shard","snap_claw"];class sh{game;timer=0;trip=null;lead=null;constructor(e){this.game=e,e.bus.on("attune",t=>{const s=e.player.char.journey;s.ways.some(o=>o.x===t.x&&o.z===t.z)||s.ways.push({x:t.x,z:t.z,name:t.name})}),e.bus.on("player:respawn",()=>{this.trip=null})}reset(){const e=this.game,t=e.player.char.journey;this.trip=null,this.lead=null,this.timer=0,t.ways.length||t.ways.push({x:0,z:0,name:"Hearthmere"}),t.ways.some(s=>s.x===t.waystone.x&&s.z===t.waystone.z)||t.ways.push({...t.waystone});for(const s in t.found)s[0]==="f"&&e.overworld.gen.opened.add(s)}nextMark(){const e=Object.keys(this.game.player.char.journey.lands).length;return ai.find(t=>t>e)??0}get totalCountries(){return oo.length}land(e){const t=this.game,s=t.player.char,o=s.journey;if(e.hidden)return;const n=Object.keys(o.lands).length===0;o.lands[e.id]=1;const r=Object.keys(o.lands).length;if(n)return;const i=ai.includes(r);i&&(s.bonusPoints++,t.bus.emit("tree:changed")),t.combat.grantXp(10+r*6),t.bus.emit("land",{name:e.name,count:r,total:oo.length,mark:i,all:r===oo.length})}count(){return Object.keys(this.game.player.char.journey.found).length}note(e,t,s){const o=this.game,n=o.player.char.journey;n.found[e]=1,delete n.known[e],o.combat.grantXp(6+gs(Math.hypot(t,s))*4)}travel(e){const t=this.game,s=t.player,o=s.char.journey.ways[e];return!o||s.dead||this.trip?!1:s.calm<4?(t.bus.emit("log",{text:"Not in the middle of a fight."}),t.bus.emit("deny"),!1):(this.trip={way:o,t:0,moved:!1},t.look.fadeGoal=0,t.bus.emit("travel",{name:o.name}),!0)}update(e){const t=this.game,s=t.player,o=s.char,n=o.journey,r=t.world;if(this.trip){const d=this.trip;d.t+=e,!d.moved&&d.t>.55&&(d.moved=!0,t.world!==t.overworld&&t.zones.leave(!0),s.x=d.way.x+2.4,s.z=d.way.z+2.4,s.y=t.world.surface(s.x,s.z),Object.assign(s,{target:null,pursue:!1,moveTo:null,dash:null,queued:null}),t.camera.target=[s.x,s.y+1,s.z],t.hazards.clear(),t.fillWorld(),t.look.fadeGoal=1,t.bus.emit("travel:arrive",{x:s.x,y:s.y,z:s.z,name:d.way.name})),d.t>1.3&&(this.trip=null);return}if(t.paused||s.dead||(n.boon&&(n.boon.left-=e,n.boon.left<=0&&(t.bus.emit("log",{text:`${qt[n.boon.id]?.name??"The boon"} fades.`}),n.boon=null,s.dirty=!0)),r!==t.overworld)||(this.timer-=e)>0)return;this.timer=.25;const i=r.biome(s.x,s.z);n.lands[i.id]||this.land(i);let l=null,c=1e9;for(const d of r.sites.inRange(s.x,s.z,420)){const p=Math.hypot(d.x-s.x,d.z-s.z);n.found[d.key]||(p<Math.max(6,d.plaza||0)+3?(this.note(d.key,d.x,d.z),t.bus.emit("found",{kind:d.kind,name:d.name,count:this.count()})):p<c&&(c=p,l=d))}this.lead=l;for(const d of r.finds.inRange(s.x,s.z,8)){const p=Math.hypot(d.x-s.x,d.z-s.z);d.kind==="cache"&&p<2.3&&!n.found[d.key]?this.open(d):d.kind==="stones"&&p<3.4?this.bless(d):d.kind==="beacon"&&p<4.2&&!n.found[d.key]&&this.survey(d)}}open(e){const t=this.game,s=t.player.char,o=gs(Math.hypot(e.x,e.z)),n=t.world.surface(e.x,e.z),r=d=>{const p=Math.sin(e.i*127.1+e.j*311.7+d*74.7)*43758.5453;return p-Math.floor(p)},i=[{type:"gold",n:Math.round(14+o*7+r(1)*12)},{type:"potion",n:1},{type:"material",id:si[Math.floor(r(3)*si.length)],n:2+Math.floor(r(4)*2)},{type:"item",item:ys(t.rng,{ilvl:o+1,rarity:r(5)<.08?"legendary":r(5)<.4?"rare":"magic",classId:s.classId})}];t.loot.scatter(i,e.x,e.z),this.note(e.key,e.x,e.z);const[l,c]=t.world.openFind(e);t.renderer.worldTex.refresh(l,c),t.bus.emit("found",{kind:"cache",name:"A cache",count:this.count(),x:e.x,y:n,z:e.z})}bless(e){const t=this.game,s=t.player,o=s.char.journey;if(o.found[e.key]||(this.note(e.key,e.x,e.z),t.bus.emit("found",{kind:"stones",name:e.name,count:this.count()})),o.boon)return;const n=Object.keys(qt),r=n[Math.abs(e.i*3+e.j*5+this.count())%n.length];o.boon={id:r,left:qt[r].seconds},s.dirty=!0,t.playerSystem.recompile(!0),r==="hale"&&(s.hp=Math.min(s.maxHp,s.hp+s.maxHp*.2)),t.bus.emit("boon",{id:r,name:qt[r].name,desc:qt[r].desc,entity:s})}survey(e){const t=this.game,s=t.player.char.journey;this.note(e.key,e.x,e.z);const o=[...t.world.sites.inRange(e.x,e.z,520),...t.world.finds.inRange(e.x,e.z,300)].filter(n=>!s.found[n.key]).sort((n,r)=>Math.hypot(n.x-e.x,n.z-e.z)-Math.hypot(r.x-e.x,r.z-e.z)).slice(0,6);for(const n of o)s.known[n.key]=[n.x,n.z,n.name];t.bus.emit("found",{kind:"beacon",name:e.name,count:this.count(),shown:o.length})}}const oh=.2;class nh{game;dark=!1;constructor(e){this.game=e,e.bus.on("player:died",()=>this.fall())}reset(){const e=this.game.player.char.journey;this.dark=this.night()>.5,e.satchel&&this.game.world===this.game.overworld&&this.leave(e.satchel.x,e.satchel.z,e.satchel.n,!0)}night(){return this.game.world===this.game.overworld&&this.game.env.night||0}fall(){const e=this.game,t=e.player,s=t.char,o=s.journey,n=Math.floor(s.gold*oh);if(o.satchel){for(const r of e.loot.drops)r.satchel&&(r.gone=!0);o.satchel=null}if(n<1||e.world!==e.overworld){e.bus.emit("fallen",{lost:0});return}s.gold-=n,o.satchel={x:t.x,z:t.z,n},this.leave(t.x,t.z,n,!1),e.bus.emit("fallen",{lost:n})}leave(e,t,s,o){const n=this.game.loot.spawn({type:"gold",n:s},e,t,e,t,!0);n.satchel=!0,n.scale=1.5,n.name=`Your glint ×${s}`,o&&(n.age=1,n.grow=1)}update(){const e=this.game,t=e.player.char.journey,s=this.night()>.5;if(s!==this.dark&&(this.dark=s,!e.paused&&e.world===e.overworld&&e.bus.emit(s?"nightfall":"daybreak")),t.satchel&&e.world===e.overworld&&!e.loot.drops.some(o=>o.satchel&&!o.gone)){const o=t.satchel.n;t.satchel=null,e.player.dead||e.bus.emit("recovered",{n:o})}}}const Ke=ne.CHUNK,ls=ne.CELL,Pt=Ke/ls,ft=ls,ue=30,an=2,rh=6.2,Qa=0,js=1,oi=2,ni={crypt:{biome:"crypt",floor:[.7,.65,.58],floor2:[.62,.59,.54],path:1,sand:0,moss:.05,wobble:0,torch:.9,decor:[["pillar",1],["cairn",.35],["stone",.35]],pools:0},cave:{biome:"cave",floor:[.62,.54,.44],floor2:[.55,.5,.43],path:.5,sand:.35,moss:.25,wobble:1.7,torch:.45,decor:[["rock",1],["crystal",.3],["mushroom",.35],["stump",.15]],pools:2}};function ih({seed:a,theme:e="crypt"}){const t=a|0,s=ni[e]||ni.crypt,o=ol(s.biome).index,n=Wc(t),r=new Uint8Array(ue*ue),i=new Int16Array(ue*ue).fill(-1),l=(T,C)=>T<0||C<0||T>=ue||C>=ue?Qa:r[C*ue+T],c=[];for(let T=0;T<400&&c.length<9;T++){const C=3+Math.floor(n()*4),R=3+Math.floor(n()*4),S=1+Math.floor(n()*(ue-C-2)),_=1+Math.floor(n()*(ue-R-2));c.some(L=>S<L.x+L.w+1&&S+C+1>L.x&&_<L.z+L.h+1&&_+R+1>L.z)||c.push({x:S,z:_,w:C,h:R,links:0})}c.forEach((T,C)=>{for(let R=T.z;R<T.z+T.h;R++)for(let S=T.x;S<T.x+T.w;S++)r[R*ue+S]=js,i[R*ue+S]=C});const d=T=>[T.x+Math.floor(T.w/2),T.z+Math.floor(T.h/2)],p=(T,C)=>{const[R,S]=d(T),[_,L]=d(C),V=n()<.5,F=(Z,O,X,D)=>{const U=Math.sign(X-Z),se=Math.sign(D-O);let Le=Z,et=O;for(;r[et*ue+Le]===Qa&&(r[et*ue+Le]=js),!(Le===X&&et===D);)Le!==X?Le+=U:et+=se};V?(F(R,S,_,S),F(_,S,_,L)):(F(R,S,R,L),F(R,L,_,L)),T.links++,C.links++},f=(T,C)=>{const[R,S]=d(T),[_,L]=d(C);return Math.abs(R-_)+Math.abs(S-L)},u=[0],m=[];for(;u.length<c.length;){let T=null;for(const C of u)for(let R=0;R<c.length;R++){if(u.includes(R))continue;const S=f(c[C],c[R]);(!T||S<T.d)&&(T={i:C,j:R,d:S})}u.push(T.j),m.push([T.i,T.j])}for(const[T,C]of m)p(c[T],c[C]);for(let T=0;T<2&&c.length>4;T++){const C=Math.floor(n()*c.length),R=Math.floor(n()*c.length);C!==R&&f(c[C],c[R])<14&&p(c[C],c[R])}const v=c.map((T,C)=>C).sort((T,C)=>c[C].z+c[C].h-(c[T].z+c[T].h))[0],x=new Int32Array(ue*ue).fill(-1);{const[T,C]=d(c[v]),R=[C*ue+T];x[R[0]]=0;for(let S=0;S<R.length;S++){const _=R[S],L=_%ue,V=_/ue|0;for(const[F,Z]of[[1,0],[-1,0],[0,1],[0,-1]]){const O=L+F,X=V+Z,D=X*ue+O;l(O,X)!==Qa&&x[D]<0&&(x[D]=x[_]+1,R.push(D))}}}const b=T=>{const[C,R]=d(c[T]);return x[R*ue+C]};let y=-1,k=-1;c.forEach((T,C)=>{if(C===v)return;const R=b(C)+T.w*T.h*.4;R>k&&(k=R,y=C)});let M=-1,z=-1;c.forEach((T,C)=>{if(C===v||C===y)return;const R=b(C)+(T.links<=1?20:0);R>z&&(z=R,M=C)});let P=s.pools;c.forEach((T,C)=>{if(P<=0||C===v||C===y||C===M||T.w<5||T.h<4)return;P--;const R=T.x+1+Math.floor(n()*(T.w-3)),S=T.z+1+Math.floor(n()*(T.h-3));for(let _=S;_<S+2;_++)for(let L=R;L<R+2;L++)r[_*ue+L]=oi});const $=c.map((T,C)=>C===v?"entrance":C===y?"boss":C===M?"hoard":"hall"),N=(T,C)=>[T*ft+ft/2,C*ft+ft/2],B=c.map((T,C)=>{const[R,S]=d(T),[_,L]=N(R,S);return{kind:$[C],x:_,z:L,x0:T.x*ft,z0:T.z*ft,x1:(T.x+T.w)*ft,z1:(T.z+T.h)*ft,tiles:T.w*T.h,index:C}});function G(T,C){let R=T,S=C;return s.wobble&&(R+=De(T*.19,C*.19,t+3)*s.wobble,S+=De(T*.19+40,C*.19-17,t+4)*s.wobble),l(Math.floor(R/ft),Math.floor(S/ft))}function pe(T,C){const R=G(T,C);return R===Qa?rh+De(T*.3,C*.3,t+5)*.35:R===oi?-.55:an+De(T*.15,C*.15,t+6)*.1}const we=new Set,Y=`d${t}:hoard`;function _e(T,C){if(l(T,C)!==js)return null;const S=i[C*ue+T],_=S>=0?c[S]:null,[L,V]=N(T,C),F=O=>ce(T*7+O,C*13-O,t+900+O);if(_){const[O,X]=d(_);if(T===O&&C===X)return S===v?{id:"waystone",x:L,z:V,rot:0,scale:.9,seed:.3}:S===M?{id:"chest",x:L,z:V,rot:F(1)*6.28,pal:we.has(Y)?1:0,key:Y}:null;if(S===y&&e==="crypt"&&(T===_.x||T===_.x+_.w-1)&&(C===_.z||C===_.z+_.h-1))return{id:"pillar",x:L,z:V,rot:F(2)*6.28,seed:.9}}const Z=[[1,0],[-1,0],[0,1],[0,-1]].filter(([O,X])=>l(T+O,C+X)===Qa);if(Z.length&&F(3)<s.torch*.42&&(T+C)%2===0){const[O,X]=Z[Math.floor(F(4)*Z.length)],D=L+O*1.35,U=V+X*1.35;return{id:"torch",x:D,z:U,rot:Math.atan2(O,-X),seed:F(5)}}if(_&&Z.length&&F(6)<.28){const[O]=s.decor.find(([,U],se)=>F(7+se)<U*.5)||[];if(!O)return null;const X=ho(O),D=Math.max(0,ls/2-X.reach*1-.1);return{id:O,x:L+(F(12)*2-1)*D,z:V+(F(13)*2-1)*D,rot:F(14)*6.28,seed:F(15),scale:Q(X.scale[0],X.scale[1],F(16))}}return null}function Be(T,C){const R=T*Ke,S=C*Ke,_={cx:T,cz:C,minH:1e9,maxH:-1e9,height:new Float32Array(Ke*Ke*4),color:new Uint8Array(Ke*Ke*4),mat:new Uint8Array(Ke*Ke*4),propsA:new Float32Array(Pt*Pt*4),propsB:new Uint8Array(Pt*Pt*4),biome:new Uint8Array(Ke*Ke).fill(o),props:[]};for(let F=0;F<Ke;F++)for(let Z=0;Z<Ke;Z++){const O=R+Z,X=S+F,D=(F*Ke+Z)*4,U=pe(O,X),se=U>an+1.6;let Le=0;if(!se)for(const[qs,Rs]of[[2,0],[-2,0],[0,2],[0,-2],[3,3],[-3,-3],[3,-3],[-3,3]])pe(O+qs,X+Rs)>an+1.6&&Le++;const et=.5+.5*De(O*.09,X*.09,t+7);_.height[D]=U,_.height[D+1]=se?0:Math.min(.55,Le*.09),_.height[D+2]=0,_.height[D+3]=U<.6?1:0;const Ma=se?[.55,.52,.5]:[Q(s.floor[0],s.floor2[0],et),Q(s.floor[1],s.floor2[1],et),Q(s.floor[2],s.floor2[2],et)];_.color[D]=Ma[0]*255,_.color[D+1]=Ma[1]*255,_.color[D+2]=Ma[2]*255,_.color[D+3]=se||U<.6?0:s.path*255;const Ls=se?0:He(s.moss*(.5+De(O*.2,X*.2,t+8)),0,1);_.mat[D]=Ls*255,_.mat[D+1]=se?0:s.sand*255,_.mat[D+2]=0,_.mat[D+3]=se?255:0,U<_.minH&&(_.minH=U),U>_.maxH&&(_.maxH=U)}const L=T*Pt,V=C*Pt;for(let F=0;F<Pt;F++)for(let Z=0;Z<Pt;Z++){const O=_e(L+Z,V+F);if(!O)continue;const X=ho(O.id),D={def:X,type:X.type,x:O.x,y:pe(O.x,O.z)-.04,z:O.z,scale:O.scale||1,rot:O.rot||0,seed:O.seed??.5,pal:O.pal||0,key:O.key},U=(F*Pt+Z)*4;_.propsA[U]=D.x-(R+(Z+.5)*ls),_.propsA[U+1]=D.z-(S+(F+.5)*ls),_.propsA[U+2]=D.y,_.propsA[U+3]=D.type,_.propsB[U]=(D.rot/6.2832%1+1)%1*255,_.propsB[U+1]=He(D.scale/2,0,1)*255,_.propsB[U+2]=D.seed*255,_.propsB[U+3]=D.pal,_.props.push(D),_.maxH=Math.max(_.maxH,D.y+X.height*D.scale)}return _}const ka={siteAt:()=>null,near:()=>null,inRange:()=>[]},Bt=T=>B.find(C=>C.kind===T);return{seed:t,theme:e,height:pe,generateChunk:Be,opened:we,hoardKey:Y,sites:ka,finds:{findAt:()=>null,near:()=>null,inRange:()=>[]},rooms:B,entrance:Bt("entrance"),boss:Bt("boss"),hoard:Bt("hoard"),size:ue*ft,open:(T,C)=>G(T,C)===js&&pe(T,C)>1}}const sn=2.8;class lh{game;d=null;trip=null;promptTimer=0;prompt=null;heading=null;cache=new Map;outsideView=null;constructor(e){this.game=e}reset(){this.d=null,this.trip=null,this.prompt=null,this.heading=null,this.game.bus.emit("interact:prompt",null)}get dungeonName(){return this.d?.ref.name??null}get progress(){const e=this.d;return e?{killed:e.killed,total:e.total,cleared:e.cleared,bossAlive:!!e.boss&&!e.boss.dead}:null}goal(){const e=this.d;return e?e.boss&&!e.boss.dead?{x:e.boss.x,z:e.boss.z}:e.gen.entrance?{x:e.gen.entrance.x,z:e.gen.entrance.z}:null:null}interactables(){const e=this.game,t=e.player,s=[];if(!this.d){for(const r of e.world.sites.inRange(t.x,t.z,40)){if(r.kind!=="dungeon"||!r.door)continue;const i=!!t.char.journey.dungeons[r.key];s.push({x:r.door.x,z:r.door.z,r:sn,label:`Enter ${r.name}${i?" (cleared)":""}`,act:()=>this.enter(r)})}return s}const o=this.d,n=o.gen;return n.entrance&&s.push({x:n.entrance.x,z:n.entrance.z,r:sn+.6,label:`Leave ${o.ref.name}`,act:()=>this.leaveWithFade()}),n.hoard&&!n.opened.has(n.hoardKey)&&s.push({x:n.hoard.x,z:n.hoard.z,r:sn,label:"Open the hoard",act:()=>this.openHoard()}),o.cleared&&s.push({x:t.x,z:t.z,r:1e9,label:`Leave ${o.ref.name}`,act:()=>this.leaveWithFade(),priority:-1}),s}nearest(){const e=this.game.player;let t=null,s=1e9;for(const o of this.interactables()){const n=Math.hypot(o.x-e.x,o.z-e.z)-(o.priority??0)*1e6;Math.hypot(o.x-e.x,o.z-e.z)<=o.r&&n<s&&(s=n,t=o)}return t}interact(){if(this.trip||this.game.player.dead)return!1;const e=this.nearest();return e?(e.act(),!0):!1}clickInteract(e){const t=this.game,s=t.world.raycast(e.origin,e.dir);if(!s)return!1;for(const o of this.interactables())if(!(o.r>100)&&Math.hypot(s.x-o.x,s.z-o.z)<2.4){this.heading=o;const n=t.player;return n.moveTo={x:o.x,z:o.z},n.pursue=!1,n.target=null,n.queued=null,!0}return!1}update(e){const t=this.game,s=t.player;if(this.trip){const n=this.trip;n.t+=e,!n.moved&&n.t>.55&&(n.moved=!0,n.go(),t.look.fadeGoal=1),n.t>1.3&&(this.trip=null);return}if(t.paused)return;if(this.heading&&Math.hypot(this.heading.x-s.x,this.heading.z-s.z)<=this.heading.r){const n=this.heading;this.heading=null,n.act()}else this.heading&&!s.moveTo&&(this.heading=null);if((this.promptTimer-=e)<=0){this.promptTimer=.12;const n=s.dead?null:this.nearest();if(n!==this.prompt&&n?.label!==this.prompt?.label){this.prompt=n;const r=t.settings,i=t.input.lastDevice==="pad"?fo(r.pad.interact):t.touch?"Tap":ns(r.keys.interact[0]);t.bus.emit("interact:prompt",n?{text:n.label,key:i}:null)}}const o=this.d;o&&o.boss&&o.boss.gone&&!o.cleared&&!o.boss.dead&&(o.boss=null)}dressEnv(e){this.d&&(e.night=.62,e.gold=0,e.cloud=.6,e.keyDir=[.12,.98,.16],e.sunDir=[.12,.98,.16],e.moonDir=[.12,.98,.16])}fade(e){this.trip={t:0,moved:!1,go:e},this.game.look.fadeGoal=0}enter(e){const t=this.game;if(t.player.calm<1.5&&t.monsters.some(r=>!r.dead&&r.ai.state==="chase")){t.bus.emit("log",{text:"Not with creatures on your heels."}),t.bus.emit("deny");return}const o=Math.max(1,gs(Math.hypot(e.x,e.z))+1),n={kind:"dungeon",key:e.key,name:e.name,theme:e.delve??"crypt",level:o,seed:ps.hash(e.key,t.seed),x:e.x,z:e.z};t.bus.emit("travel",{name:e.name}),this.fade(()=>this.build(n,e.biome??t.overworld.biome(e.x,e.z).id))}build(e,t){const s=this.game,o=s.player;let n=this.cache.get(e.key);if(!n){const l=ih({seed:e.seed,theme:e.theme});n=new dl(e.seed,l),this.cache.size>3&&this.cache.delete(this.cache.keys().next().value),this.cache.set(e.key,n)}const r=n.gen;this.clearStage(),s.useWorld(n),o.char.zone=e;const i=r.entrance??r.rooms[0];o.x=i.x+2.2,o.z=i.z+2.2,o.y=n.surface(o.x,o.z),s.camera.target=[o.x,o.y+1,o.z],this.outsideView=[s.camera.goal.pitch,s.camera.goal.distance],s.camera.goal.pitch=Math.max(s.camera.goal.pitch,1.02),s.camera.goal.distance=Math.min(s.camera.goal.distance,15),s.fillWorld(),this.d={ref:e,world:n,gen:r,total:0,killed:0,boss:null,cleared:!1},this.stock(this.d,t),s.bus.emit("zone:enter",{zone:e,name:e.name}),s.bus.emit("travel:arrive",{x:o.x,y:o.y,z:o.z,name:e.name}),s.save()}stock(e,t){const s=this.game,o=new ps(e.ref.seed^1540483477),n=(ol(t)?.monsters??[["sproutling",1]]).filter(([c])=>Ia[c]),r=e.ref.level,i=s.spawner;let l=1+(r>=12?1:0);for(const c of e.gen.rooms){if(c.kind==="entrance")continue;const d=()=>{for(let u=0;u<20;u++){const m=c.x0+1.5+o.next()*(c.x1-c.x0-3),g=c.z0+1.5+o.next()*(c.z1-c.z0-3);if(e.gen.open(m,g))return[m,g]}return[c.x,c.z]};if(c.kind==="boss"){const u=[...n].sort((m,g)=>Ia[g[0]].hp-Ia[m[0]].hp)[0][0];e.boss=i.spawnMonster(u,c.x,c.z,r,{rank:"boss",affixes:i.rollAffixes(r,1,!0),resident:!0});for(let m=0;m<2;m++){const[g,v]=d();this.resident(i.spawnMonster(o.weighted(n),g,v,r,{resident:!0}))}e.total+=3;continue}const p=Math.max(2,Math.min(7,Math.round(c.tiles*.32))),f=l>0&&c.kind==="hall"&&o.chance(.5);f&&l--;for(let u=0;u<p;u++){const[m,g]=d(),v=i.spawnMonster(o.weighted(n),m,g,r,u===0&&f?{rank:"elite",affixes:i.rollAffixes(r),resident:!0}:{resident:!0});this.resident(v)}e.total+=p}}resident(e){e.resident=!0}onKill(e){const t=this.d,s=this.game;if(!(!t||!e.resident)&&(t.killed++,e===t.boss&&!t.cleared)){t.cleared=!0;const o=s.player.char.journey,n=!o.dungeons[t.ref.key];o.dungeons[t.ref.key]={cleared:(o.dungeons[t.ref.key]?.cleared??0)+1},n&&(s.player.char.tally.dungeons++,s.combat.grantXp(Math.round(60+t.ref.level*30))),s.bounties.progress(),s.bus.emit("dungeon:cleared",{name:t.ref.name,first:n})}}openHoard(){const e=this.d,t=this.game;if(!e||!e.gen.hoard||e.gen.opened.has(e.gen.hoardKey))return;e.gen.opened.add(e.gen.hoardKey);const[s,o]=e.world.refreshAt(e.gen.hoard.x,e.gen.hoard.z);t.renderer.worldTex.refresh(s,o),t.loot.chest(e.gen.hoard.x,e.gen.hoard.z+1.2,e.ref.level,"chest"),t.bus.emit("found",{kind:"cache",name:"The hoard",count:t.discover.count(),x:e.gen.hoard.x,y:e.world.surface(e.gen.hoard.x,e.gen.hoard.z),z:e.gen.hoard.z})}leaveWithFade(){this.game.bus.emit("travel",{name:"the open air"}),this.fade(()=>this.leave(!1))}leave(e){const t=this.game,s=t.player,o=this.d;o&&(this.clearStage(),this.d=null,t.useWorld(t.overworld),s.char.zone={kind:"overworld"},s.x=o.ref.x+1.5,s.z=o.ref.z+4.2,s.y=t.world.surface(s.x,s.z),t.camera.target=[s.x,s.y+1,s.z],this.outsideView&&([t.camera.goal.pitch,t.camera.goal.distance]=this.outsideView,this.outsideView=null),t.spawner.reset(),t.fillWorld(),t.bus.emit("zone:enter",{zone:s.char.zone,name:t.world.biome(s.x,s.z).name}),t.bus.emit("interact:prompt",null))}clearStage(){const e=this.game,t=e.player;e.entities.clear(s=>s===t),e.monsters=[],e.loot.reset(),e.skills.reset(),e.hazards.clear(),e.fx.clear(),t.target=null,t.pursue=!1,t.moveTo=null,t.dash=null,t.cast=null,t.queued=null,this.prompt=null,this.heading=null}}const nt=a=>({ok:!1,reason:a}),Gl=[{name:"Red Tonic",heal:"45%",needs:{},glint:0},{name:"Strong Tonic",heal:"56%",needs:{sprout_leaf:6,puff_spore:4},glint:120},{name:"Potent Tonic",heal:"67%",needs:{hog_bristle:6,wisp_ember:4},glint:600},{name:"Hearth Tonic",heal:"79%",needs:{crag_shard:8,snap_claw:6,inkstone:1},glint:2400},{name:"Elder Tonic",heal:"90%",needs:{crag_shard:14,wisp_ember:10,inkstone:3},glint:9e3}],ch=[{id:"weapon",name:"Weapon",slot:"weapon"},{id:"offhand",name:"Off-hand",slot:"offhand"},{id:"helm",name:"Helm",slot:"helm"},{id:"chest",name:"Chest",slot:"chest"},{id:"gloves",name:"Gloves",slot:"gloves"},{id:"legs",name:"Legs",slot:"legs"},{id:"boots",name:"Boots",slot:"boots"},{id:"amulet",name:"Amulet",slot:"amulet"},{id:"ring",name:"Ring",slot:"ring"}];class dh{game;constructor(e){this.game=e}changed(){this.game.bus.emit("inventory:changed")}sell(e){const t=this.game.player.char,s=t.bag[e];if(!s)return nt("Nothing there.");t.bag[e]=null;const o=vs(s);return t.gold+=o,this.game.bus.emit("trade",{sold:s.base,total:o}),this.changed(),{ok:!0}}sellJunk(){const e=this.game.player.char;let t=0;return e.bag.forEach((s,o)=>{s?.junk&&(t+=vs(s),e.bag[o]=null)}),t&&(e.gold+=t,this.game.bus.emit("trade",{total:t}),this.changed()),t}salvage(e){const t=this.game.player.char,s=t.bag[e];if(!s)return nt("Nothing there.");t.bag[e]=null;for(const o of zn(s))Kl(t,o.id,o.n);return this.game.bus.emit("trade",{made:"salvage"}),this.game.bus.emit("log",{text:`Salvaged: ${zn(s).map(o=>`${o.n} ${Ht[o.id].name}`).join(", ")}.`}),this.changed(),{ok:!0}}sellMaterials(){const e=this.game.player.char;let t=0;for(const s of Object.keys(e.materials))["scrap","thread","inkstone"].includes(s)||(t+=(Ht[s]?.value??1)*e.materials[s],delete e.materials[s]);return t&&(e.gold+=t,this.game.bus.emit("trade",{total:t}),this.changed()),t}nextTonic(){return Gl[this.game.player.char.potionTier+1]??null}brewTonic(){const e=this.game,t=e.player.char,s=this.nextTonic();if(!s)return nt("Your tonics are as strong as they can be brewed.");if(t.gold<s.glint)return nt("Not enough glint.");for(const[o,n]of Object.entries(s.needs))if(yo(t,o)<n)return nt(`You need ${n} ${Ht[o].name}.`);for(const[o,n]of Object.entries(s.needs))Pn(t,o,n);return t.gold-=s.glint,t.potionTier++,t.potions=e.player.build.derived.potionCharges,e.bus.emit("trade",{made:"tonic"}),e.bus.emit("log",{text:`Your tonics are now <em>${s.name}s</em>.`}),this.changed(),{ok:!0}}refill(){const e=this.game.player;return e.char.potions=e.build.derived.potionCharges,this.game.bus.emit("drink",{item:"refill"}),{ok:!0}}gamblePrice(){return Math.round(60+this.game.player.char.level*14)}gamble(e){const t=this.game,s=t.player.char,o=this.gamblePrice();if(s.gold<o)return nt("Not enough glint.");if(Ps(s.bag)<0)return nt("Your bag is full.");const n=t.player.build.cls,r=Vn.filter(c=>c.slot===e&&$l(n,c));if(!r.length)return nt("The smith has nothing of that kind for you.");const i=Hl(t.rng,{magicFind:1.4,rank:"chest",ilvl:s.level}),l=ys(t.rng,{ilvl:s.level,rarity:i==="common"?"magic":i,classId:s.classId,base:t.rng.pick(r).id});return s.gold-=o,ar(s,l),t.bus.emit("trade",{bought:l.base}),this.changed(),{ok:!0}}enchantCost(e){return{glint:Math.round(40+e.ilvl*9),thread:e.rarity==="legendary"||e.rarity==="unique"?3:1}}enchant(e,t){const s=this.game,o=s.player.char,n=e.bag!==void 0?o.bag[e.bag]:e.slot?o.equipment[e.slot]:null;if(!n)return nt("Nothing there.");if(n.rarity==="unique")return nt("A unique cannot be changed.");if(!n.affixes[t])return nt("No such affix.");const i=this.enchantCost(n);if(o.gold<i.glint)return nt("Not enough glint.");if(yo(o,"thread")<i.thread)return nt(`You need ${i.thread} Gilded Thread.`);const l=ys(s.rng,{ilvl:n.ilvl,rarity:"rare",base:n.base,classId:o.classId}),c=new Set(n.affixes.map(f=>f.id)),d=new Set(n.affixes.filter((f,u)=>u!==t).map(f=>ha[f.id]?.group).filter(Boolean)),p=l.affixes.find(f=>!c.has(f.id)&&!(ha[f.id]?.group&&d.has(ha[f.id].group)))??{id:Co[0].id,roll:s.rng.next()};return o.gold-=i.glint,Pn(o,"thread",i.thread),n.affixes[t]=p,e.slot&&(s.player.dirty=!0),s.bus.emit("trade",{made:"enchant"}),this.changed(),{ok:!0}}deposit(e,t){const s=Gd(this.game.player.char,this.game.stash[t],e);return s.ok&&(this.changed(),this.game.persistAccount()),s}withdraw(e,t){const s=Yd(this.game.player.char,this.game.stash[t],e);return s.ok&&(this.changed(),this.game.persistAccount()),s}}const ze={content:0,focused:1,hurt:2,joy:3,worried:4,surprised:5,fallen:6},ri={0:0,1:1,4:2,3:3,5:4,2:5,6:6};class hh{game;moment=ze.content;left=0;cheer=new Map;constructor(e){this.game=e;const t=e.bus;t.on("damage",s=>{s.target===e.player&&!s.dot&&!s.blocked&&s.amount>0&&this.feel(ze.hurt,.55)}),t.on("levelup",()=>this.feel(ze.joy,2.4)),t.on("item:legendary",()=>this.feel(ze.joy,1.8)),t.on("dungeon:cleared",()=>this.feel(ze.joy,2.4)),t.on("bounty:claimed",()=>this.feel(ze.joy,1.8)),t.on("boon",()=>this.feel(ze.joy,1.4)),t.on("evade",()=>this.feel(ze.surprised,.4)),t.on("boss:spawn",()=>this.feel(ze.surprised,1.4)),t.on("npc:talk",s=>this.cheer.set(s,2.6))}feel(e,t){this.left>0&&ri[e]<ri[this.moment]||(this.moment=e,this.left=t)}reset(){this.moment=ze.content,this.left=0,this.cheer.clear()}update(e){const t=this.game.player;this.left=Math.max(0,this.left-e),t.face=t.dead?ze.fallen:this.left>0?this.moment:t.cast?ze.focused:t.hp<t.maxHp*.3?ze.worried:ze.content;for(const[s,o]of this.cheer){const n=o-e;n<=0||s.gone?(s.face=ze.content,this.cheer.delete(s)):(s.face=ze.joy,this.cheer.set(s,n))}}}const uh=.14,fh=.06,ii=.3;class ph{canvas;bus=new _0;input;rng;seed;settings;touch;reducedMotion=!1;world;overworld;renderer;camera;env;entities=new E0;monsters=[];player;hour=zt.START_HOUR;biome;look={hurt:0,fade:0,fadeGoal:1};stop=0;low=!1;paused=!0;started=!1;menuPause=!1;time=0;saveTimer=8;warmed=!1;lastFrame=0;fps=60;persist;stash;persistAccount;fx;combat;skills;status;loot;bounties;controls;spawner;view;tutorial;hazards;discover;stakes;zones;vendors;playerSystem;faces;systems;constructor(e,t){this.canvas=e,this.settings=t.settings,this.touch=t.touch,this.persist=t.persist,this.stash=t.stash,this.persistAccount=t.persistAccount,this.seed=t.seed,this.rng=new ps(Date.now()^t.seed),this.input=new T0(e,t.settings.keys,t.settings.pad),this.overworld=new dl(t.seed),this.world=this.overworld,this.renderer=new w0(e,this.world,{lite:t.touch||t.settings.quality==="low"}),t.settings.quality==="high"&&(this.renderer.quality="high"),this.camera=new M0,this.env=L0(),this.biome=this.world.biome(0,0),this.fx=new D0(this),this.combat=new tr(this),this.status=new Fd(this),this.loot=new Jd(this),this.skills=new Id(this),this.bounties=new eh(this),this.controls=new fd(this),this.spawner=new jd(this),this.view=new U0(this),this.tutorial=new th(this),this.hazards=new ah(this),this.discover=new sh(this),this.stakes=new nh(this),this.zones=new lh(this),this.vendors=new dh(this),this.playerSystem=new Md(this),this.faces=new hh(this),this.systems=[this.controls,this.playerSystem,new Hd(this),this.hazards,this.skills,this.status,this.loot,this.spawner,this.discover,this.zones,this.bounties,this.stakes,this.tutorial,this.faces,this.fx],this.loadCharacter(t.char),this.applySettings(t.settings),this.resize(),addEventListener("resize",()=>this.resize()),addEventListener("beforeunload",()=>this.save()),document.addEventListener("visibilitychange",()=>{document.hidden&&this.save()})}loadCharacter(e){this.player&&this.save(),this.entities.clear(()=>!1),this.monsters=[],this.world!==this.overworld&&this.useWorld(this.overworld),e.zone.kind==="dungeon"&&(e.pos={x:e.zone.x+1.5,z:e.zone.z+4.2},e.zone={kind:"overworld"}),this.player=this.entities.add(kd(this,e)),this.hour=e.hour;for(const t of this.systems)t.reset?.();this.playerSystem.recompile(!0),this.biome=this.world.biome(this.player.x,this.player.z),this.camera.target=[this.player.x,this.player.y+1,this.player.z],this.fillWorld(),this.bus.emit("character:loaded",this.player)}useWorld(e){this.world=e,this.renderer.setWorld(e)}fillWorld(){const e=this.player;for(;this.renderer.worldTex.update(e.x,e.z,16)>0;);}applySettings(e){this.settings=e,this.input.keyBindings=e.keys,this.input.padBindings=e.pad,this.reducedMotion=ml(e),e.quality!=="auto"&&(this.renderer.quality=e.quality),this.renderer.steady=e.steadyLines,this.view.smooth=e.smoothFigures}resize(){const e=this.canvas.getBoundingClientRect();this.renderer.resize(Math.max(1,Math.round(e.width)),Math.max(1,Math.round(e.height)),Math.min(devicePixelRatio||1,2))}start(){let e=performance.now();const t=s=>{requestAnimationFrame(t);const o=this.settings.fpsCap;if(o&&s-this.lastFrame<1e3/o-1.5)return;this.lastFrame=s;const n=s-e;e=s,this.fps+=(1e3/Math.max(1,n)-this.fps)*.05,this.frame(Math.min(n/1e3,.05),n)};requestAnimationFrame(t)}hold(e){this.reducedMotion||!this.settings.hitStop||(this.stop=Math.max(this.stop,Math.min(e,uh)))}shake(e){this.reducedMotion||(this.camera.shake=Math.min(1,this.camera.shake+e*this.settings.screenShake))}rumble(e,t){this.settings.vibration&&this.input.lastDevice==="pad"&&this.input.rumble(e,t)}get frozen(){return this.menuPause&&this.started}frame(e,t){const s=this.player,o=this.world;this.input.poll();let n=e*this.settings.gameSpeed;if(this.stop>0&&(this.stop-=e,n*=fh),this.frozen)this.controls.menuKeys();else{this.time+=n,!this.paused&&o===this.overworld&&(this.hour=(this.hour+n*24/zt.DAY_SECONDS)%24);for(const l of this.systems)l.update(n);s.char.played+=n}this.entities.sweep(),this.bus.emit("frame",e),this.biome=o.biome(s.x,s.z),q0(this.env,this.hour,this.biome.rock),this.zones.dressEnv(this.env),o===this.overworld&&(this.env.cloud=.36+.24*Math.sin(this.time/83+s.x*.002)*Math.cos(this.time/131+s.z*.0017));const r=!s.dead&&s.hp<s.maxHp*(this.low?ii+.08:ii);r!==this.low&&(this.low=r,r&&!this.paused&&this.bus.emit("lowhealth"));const i=r?.56+(this.reducedMotion?0:.14*Math.sin(this.time*3.2)):0;this.look.hurt=Math.max(i,this.look.hurt-e*2.2),this.look.fade=Vt(this.look.fade,this.look.fadeGoal,3,e),this.renderer.worldTex.update(s.x,s.z,2),o.prune(s.x,s.z),this.camera.still=this.reducedMotion,this.camera.update(e,[s.x,s.y+1,s.z],this.renderer.size.cssW/this.renderer.size.cssH,(l,c)=>o.surface(l,c)),this.warmed||(this.warmed=this.renderer.warm()),this.settings.quality==="auto"&&this.renderer.adapt(t),this.renderer.render(this.view.build(this.time)),this.input.endFrame(),this.saveTimer-=e,this.saveTimer<=0&&(this.saveTimer=8,this.save())}save(){const e=this.player;if(!e||!this.started)return;const t=e.char;this.world===this.overworld&&(t.pos={x:e.x,z:e.z}),t.hour=this.hour,t.hp=e.hp,t.resource=e.resource,t.view=[this.camera.goal.pitch,this.camera.goal.distance],this.persist(t)}begin(){this.started=!0,this.paused=!1,this.bus.emit("begin")}}const on={charm_might:"might",charm_grace:"grace",charm_vigor:"vigor",charm_mind:"mind"},mh=new Set(["sprout_leaf","puff_spore","hog_bristle","wisp_ember","crag_shard","snap_claw"]);function gh(a){const e=a.sheet??{},t=$a("warden","Wayfarer",(a.seed??1)^47),s=new ps((a.seed??1)^81);t.level=Math.max(1,Math.min(Zt,e.level??1)),t.xp=Math.max(0,e.xp??0),t.gold=Math.max(0,e.glint??0);const o=t.journey;Object.assign(o,{found:e.found??{},known:e.known??{},lands:e.lands??{},tips:e.tips??{},ways:e.ways?.length?e.ways:o.ways,waystone:e.waystone??o.waystone,boon:e.boon&&["kindled","fleet","hale"].includes(e.boon.id)?e.boon:null,satchel:e.satchel??null,guide:e.guide,bountiesDone:e.bountiesDone??0,bounty:e.bounty&&e.bounty.need?{kind:"cull",have:0,xp:0,glint:0,need:1,...e.bounty}:null});for(const i of e.bag??[])mh.has(i.id)?t.materials[i.id]=(t.materials[i.id]??0)+i.n:(i.id==="tonic"||i.id==="draught")&&(t.potions=Math.min(6,t.potions+i.n));const r=[...e.charms??[],...(e.bag??[]).filter(i=>on[i.id]).flatMap(i=>Array(i.n).fill(i.id))].filter(i=>on[i]).map(i=>({uid:s.uid("i"),base:"ring",rarity:"magic",ilvl:Math.max(1,t.level-2),classId:"warden",affixes:[{id:on[i],roll:1}]}));r[0]&&(t.equipment.ring1=r[0]),r[1]&&(t.equipment.ring2=r[1]);for(const i of r.slice(2)){const l=t.bag.findIndex(c=>!c);l>=0&&(t.bag[l]=i)}return t.pos={x:Number.isFinite(a.x)?a.x:3.5,z:Number.isFinite(a.z)?a.z:6.5},t.hour=a.hour??9.5,t.view=a.view??null,t.hp=a.hp??1e9,t}function li(a){if(!a||typeof a!="object")return null;const e=a,t=e.classId&&Fe[e.classId]?e.classId:"warden",s=$a(t,e.name??"Wayfarer",1),o={...s,...e,classId:t,version:2};o.journey={...Bl(),...e.journey??{}},o.tally={...s.tally,...e.tally??{}},o.materials={...e.materials??{}},o.quests={...e.quests??{}},o.bag=Array.from({length:is},(r,i)=>e.bag?.[i]??null),o.bar=Array.from({length:pa},(r,i)=>e.bar?.[i]??null),o.equipment={};for(const r of kl)e.equipment?.[r]&&(o.equipment[r]=e.equipment[r]);const n=ba(Fe[t]);o.tree={};for(const[r,i]of Object.entries(e.tree??s.tree))n.nodes.has(r)&&i>0&&(o.tree[r]=Math.min(i,n.nodes.get(r).max));return Object.keys(o.tree).length||(o.tree=s.tree),o.bar=o.bar.map(r=>r&&o.tree[r]?r:null),o.bar.some(Boolean)||(o.bar=s.bar),(!o.pos||!Number.isFinite(o.pos.x)||!Number.isFinite(o.pos.z))&&(o.pos=s.pos),(!o.zone||o.zone.kind!=="overworld"&&o.zone.kind!=="dungeon")&&(o.zone={kind:"overworld"}),o.level=Math.max(1,Math.min(Zt,Math.round(o.level||1))),o.gold=Math.max(0,Math.round(o.gold||0)),o}const nn="brushwild.v2.account",Aa=a=>`brushwild.v2.hero.${a}`,vh=zt.SAVE_KEY,sr=3,yh=()=>Array.from({length:sr},()=>new Array(Nl).fill(null));class bh{kv;failed=!1;constructor(e=xh()){this.kv=e}read(e){try{const t=this.kv?.getItem(e);return t?JSON.parse(t):null}catch{return null}}write(e,t){try{return this.kv?.setItem(e,JSON.stringify(t)),!0}catch{return this.failed=!0,!1}}loadAccount(){const e=this.read(nn);if(e&&e.version===2)return{version:2,seed:e.seed??zt.SEED,created:e.created??Date.now(),heroes:(e.heroes??[]).filter(o=>this.read(Aa(o))),stash:Array.from({length:sr},(o,n)=>Array.from({length:Nl},(r,i)=>e.stash?.[n]?.[i]??null))};const t={version:2,seed:zt.SEED,created:Date.now(),heroes:[],stash:yh()},s=this.read(vh);if(s&&s.sheet){t.seed=s.seed??zt.SEED;const o=gh(s);this.saveCharacter(o,t)}return this.saveAccount(t),t}saveAccount(e){this.write(nn,e)}loadCharacter(e){return li(this.read(Aa(e)))}saveCharacter(e,t){this.write(Aa(e.id),e),t&&t.heroes[0]!==e.id&&(t.heroes=[e.id,...t.heroes.filter(s=>s!==e.id)],this.saveAccount(t))}deleteCharacter(e,t){try{this.kv?.removeItem(Aa(e))}catch{}t.heroes=t.heroes.filter(s=>s!==e),this.saveAccount(t)}summaries(e){return e.heroes.map(t=>this.loadCharacter(t)).filter(t=>!!t).map(t=>({id:t.id,name:t.name,classId:t.classId,level:t.level,played:t.played,difficulty:t.difficulty}))}exportAll(e){const t=e.heroes.map(s=>this.read(Aa(s))).filter(Boolean);return JSON.stringify({brushwild:2,exported:new Date().toISOString(),account:e,heroes:t},null,1)}importAll(e){let t;try{t=JSON.parse(e)}catch{return!1}if(t.brushwild!==2||!t.account||!Array.isArray(t.heroes))return!1;const s=t.heroes.map(li).filter(o=>!!o);for(const o of s)this.write(Aa(o.id),o);return this.write(nn,{...t.account,heroes:s.map(o=>o.id)}),!0}}function xh(){try{return globalThis.localStorage??null}catch{return null}}var Oa,ge,rn,ci,bo=0,Yl=[],ye=W,di=ye.__b,hi=ye.__r,ui=ye.diffed,fi=ye.__c,pi=ye.unmount,mi=ye.__;function Eo(a,e){ye.__h&&ye.__h(ge,a,bo||e),bo=0;var t=ge.__H||(ge.__H={__:[],__h:[]});return a>=t.__.length&&t.__.push({}),t.__[a]}function Ie(a){return bo=1,wh(Xl,a)}function wh(a,e,t){var s=Eo(Oa++,2);if(s.t=a,!s.__c&&(s.__=[t?t(e):Xl(void 0,e),function(i){var l=s.__N?s.__N[0]:s.__[0],c=s.t(l,i);l!==c&&(s.__N=[c,s.__[1]],s.__c.setState({}))}],s.__c=ge,!ge.__f)){var o=function(i,l,c){if(!s.__c.__H)return!0;var d=!1,p=s.__c.props!==i;if(s.__c.__H.__.some(function(u){if(u.__N){d=!0;var m=u.__[0];u.__=u.__N,u.__N=void 0,m!==u.__[0]&&(p=!0)}}),n){var f=n.call(this,i,l,c);return d?f||p:f}return!d||p};ge.__f=!0;var n=ge.shouldComponentUpdate,r=ge.componentWillUpdate;ge.componentWillUpdate=function(i,l,c){if(this.__e){var d=n;n=void 0,o(i,l,c),n=d}r&&r.call(this,i,l,c)},ge.shouldComponentUpdate=o}return s.__N||s.__}function Qe(a,e){var t=Eo(Oa++,3);!ye.__s&&nr(t.__H,e)&&(t.__=a,t.u=e,ge.__H.__h.push(t))}function Vl(a,e){var t=Eo(Oa++,4);!ye.__s&&nr(t.__H,e)&&(t.__=a,t.u=e,ge.__h.push(t))}function St(a){return bo=5,or(function(){return{current:a}},[])}function or(a,e){var t=Eo(Oa++,7);return nr(t.__H,e)&&(t.__=a(),t.__H=e,t.__h=a),t.__}function kh(){for(var a;a=Yl.shift();){var e=a.__H;if(a.__P&&e)try{e.__h.some(no),e.__h.some(An),e.__h=[]}catch(t){e.__h=[],ye.__e(t,a.__v)}}}ye.__b=function(a){ge=null,di&&di(a)},ye.__=function(a,e){a&&e.__k&&e.__k.__m&&(a.__m=e.__k.__m),mi&&mi(a,e)},ye.__r=function(a){hi&&hi(a),Oa=0;var e=(ge=a.__c).__H;e&&(rn===ge?(e.__h=[],ge.__h=[],e.__.some(function(t){t.__N&&(t.__=t.__N),t.u=t.__N=void 0})):(e.__h.some(no),e.__h.some(An),e.__h=[],Oa=0)),rn=ge},ye.diffed=function(a){ui&&ui(a);var e=a.__c;e&&e.__H&&(e.__H.__h.length&&(Yl.push(e)!==1&&ci===ye.requestAnimationFrame||((ci=ye.requestAnimationFrame)||Mh)(kh)),e.__H.__.some(function(t){t.u&&(t.__H=t.u,t.u=void 0)})),rn=ge=null},ye.__c=function(a,e){e.some(function(t){try{t.__h.some(no),t.__h=t.__h.filter(function(s){return!s.__||An(s)})}catch(s){e.some(function(o){o.__h&&(o.__h=[])}),e=[],ye.__e(s,t.__v)}}),fi&&fi(a,e)},ye.unmount=function(a){pi&&pi(a);var e,t=a.__c;t&&t.__H&&(t.__H.__.some(function(s){try{no(s)}catch(o){e=o}}),t.__H=void 0,e&&ye.__e(e,t.__v))};var gi=typeof requestAnimationFrame=="function";function Mh(a){var e,t=function(){clearTimeout(s),gi&&cancelAnimationFrame(e),setTimeout(a)},s=setTimeout(t,35);gi&&(e=requestAnimationFrame(t))}function no(a){var e=ge,t=a.__c;typeof t=="function"&&(a.__c=void 0,t()),ge=e}function An(a){var e=ge;a.__c=a.__(),ge=e}function nr(a,e){return!a||a.length!==e.length||e.some(function(t,s){return t!==a[s]})}function Xl(a,e){return typeof e=="function"?e(a):e}var _h=Symbol.for("preact-signals");function Lo(){if(It>1)It--;else{var a,e=!1;for((function(){var o=wo;for(wo=void 0;o!==void 0;){var n=o.S;if(n.v===o.v)for(var r=n.t;r!==void 0;r=r.x)r.i===o.i&&(r.i=n.i);o=o.o}})();ds!==void 0;){var t=ds;for(ds=void 0,xo++;t!==void 0;){var s=t.u;if(t.u=void 0,t.f&=-3,!(8&t.f)&&Ql(t))try{t.c()}catch(o){e||(a=o,e=!0)}t=s}}if(xo=0,It--,e)throw a}}function zh(a){if(It>0)return a();En=++Sh,It++;try{return a()}finally{Lo()}}var cs,de=void 0;function qo(a){var e=de,t=cs;de=void 0,cs=void 0;try{return a()}finally{de=e,cs=t}}var ds=void 0,It=0,xo=0,Sh=0,En=0,wo=void 0,ko=0;function Zl(a){if(de!==void 0){var e=a.n;if(e===void 0||e.t!==de)return e={i:0,S:a,p:de.s,n:void 0,t:de,e:void 0,x:void 0,r:e},de.s!==void 0&&(de.s.n=e),de.s=e,a.n=e,32&de.f&&a.S(e),e;if(e.i===-1)return e.i=0,e.n!==void 0&&(e.n.p=e.p,e.p!==void 0&&(e.p.n=e.n),e.p=de.s,e.n=void 0,de.s.n=e,de.s=e),e}}function Ee(a,e){this.v=a,this.i=0,this.n=void 0,this.t=void 0,this.l=0,this.W=e?.watched,this.Z=e?.unwatched,this.name=e?.name}Ee.prototype.brand=_h;Ee.prototype.h=function(){return!0};Ee.prototype.S=function(a){var e=this,t=this.t;t!==a&&a.e===void 0&&(a.x=t,this.t=a,t!==void 0?t.e=a:qo(function(){var s;(s=e.W)==null||s.call(e)}))};Ee.prototype.U=function(a){var e=this;if(this.t!==void 0){var t=a.e,s=a.x;t!==void 0&&(t.x=s,a.e=void 0),s!==void 0&&(s.e=t,a.x=void 0),a===this.t&&(this.t=s,s===void 0&&qo(function(){var o;(o=e.Z)==null||o.call(e)}))}};Ee.prototype.subscribe=function(a){var e=this;return As(function(){var t=e.value;qo(function(){return a(t)})},{name:"sub"})};Ee.prototype.valueOf=function(){return this.value};Ee.prototype.toString=function(){return this.value+""};Ee.prototype.toJSON=function(){return this.value};Ee.prototype.peek=function(){var a=this;return qo(function(){return a.value})};Object.defineProperty(Ee.prototype,"value",{get:function(){var a=Zl(this);return a!==void 0&&(a.i=this.i),this.v},set:function(a){if(a!==this.v){if(xo>100)throw new Error("Cycle detected");(function(t){It!==0&&xo===0&&t.l!==En&&(t.l=En,wo={S:t,v:t.v,i:t.i,o:wo})})(this),this.v=a,this.i++,ko++,It++;try{for(var e=this.t;e!==void 0;e=e.x)e.t.N()}finally{Lo()}}}});function Re(a,e){return new Ee(a,e)}function Ql(a){for(var e=a.s;e!==void 0;e=e.n)if(e.S.i!==e.i||!e.S.h()||e.S.i!==e.i)return!0;return!1}function Jl(a){for(var e=a.s;e!==void 0;e=e.n){var t=e.S.n;if(t!==void 0&&(e.r=t),e.S.n=e,e.i=-1,e.n===void 0){a.s=e;break}}}function ec(a){for(var e=a.s,t=void 0;e!==void 0;){var s=e.p;e.i===-1?(e.S.U(e),s!==void 0&&(s.n=e.n),e.n!==void 0&&(e.n.p=s)):t=e,e.S.n=e.r,e.r!==void 0&&(e.r=void 0),e=s}a.s=t}function xa(a,e){Ee.call(this,void 0,e),this.x=a,this.s=void 0,this.g=ko-1,this.f=4}xa.prototype=new Ee;xa.prototype.h=function(){if(this.f&=-3,1&this.f)return!1;if((36&this.f)==32||(this.f&=-5,this.g===ko))return!0;if(this.g=ko,this.f|=1,this.i>0&&!Ql(this))return this.f&=-2,!0;var a=de;try{Jl(this),de=this;var e=this.x();(16&this.f||this.v!==e||this.i===0)&&(this.v=e,this.f&=-17,this.i++)}catch(t){this.v=t,this.f|=16,this.i++}return de=a,ec(this),this.f&=-2,!0};xa.prototype.S=function(a){if(this.t===void 0){this.f|=36;for(var e=this.s;e!==void 0;e=e.n)e.S.S(e)}Ee.prototype.S.call(this,a)};xa.prototype.U=function(a){if(this.t!==void 0&&(Ee.prototype.U.call(this,a),this.t===void 0)){this.f&=-33;for(var e=this.s;e!==void 0;e=e.n)e.S.U(e)}};xa.prototype.N=function(){if(!(2&this.f)){this.f|=6;for(var a=this.t;a!==void 0;a=a.x)a.t.N()}};Object.defineProperty(xa.prototype,"value",{get:function(){if(1&this.f)throw new Error("Cycle detected");var a=Zl(this);if(this.h(),a!==void 0&&(a.i=this.i),16&this.f)throw this.v;return this.v}});function vi(a,e){return new xa(a,e)}function tc(a){var e=a.j;if(a.j=void 0,typeof e=="function"){It++;var t=de;de=void 0;try{e()}catch(s){throw a.f&=-2,a.f|=8,rr(a),s}finally{de=t,Lo()}}}function rr(a){for(var e=a.s;e!==void 0;e=e.n)e.S.U(e);a.x=void 0,a.s=void 0,tc(a)}function Th(a){if(de!==this)throw new Error("Out-of-order effect");ec(this),de=a,this.f&=-2;try{8&this.f&&rr(this)}finally{Lo()}}function Wa(a,e){this.x=a,this.j=void 0,this.s=void 0,this.u=void 0,this.f=32,this.name=e?.name,cs&&cs.push(this)}Wa.prototype.c=function(){var a=this.S();try{if(8&this.f||this.x===void 0)return;var e=this.x();typeof e=="function"&&(this.j=e)}finally{a()}};Wa.prototype.S=function(){if(1&this.f)throw new Error("Cycle detected");this.f|=1,this.f&=-9,tc(this),Jl(this),It++;var a=de;return de=this,Th.bind(this,a)};Wa.prototype.N=function(){2&this.f||(this.f|=2,this.u=ds,ds=this)};Wa.prototype.d=function(){this.f|=8,1&this.f||rr(this)};Wa.prototype.dispose=function(){this.d()};function As(a,e){var t=new Wa(a,e);try{t.c()}catch(o){throw t.d(),o}var s=t.d.bind(t);return s[Symbol.dispose]=s,s}var ac,Us,Ch=typeof window<"u"&&!!window.__PREACT_SIGNALS_DEVTOOLS__,sc=[];As(function(){ac=this.N})();function Ka(a,e){W[a]=e.bind(null,W[a]||function(){})}function xs(a){if(Us){var e=Us;Us=void 0,e()}Us=a&&a.S()}function oc(a){var e=this,t=a.data,s=Ah(t);s.name="ReactiveDom",s.value=t;var o=or(function(){for(var i=e,l=e.__v;l=l.__;)if(l.__c){l.__c.__$f|=4;break}var c=vi(function(){var u=s.value.value;return u===0?0:u===!0?"":u||""}),d=vi(function(){return!Array.isArray(c.value)&&!Ki(c.value)}),p=As(function(){if(this.N=nc,d.value){var u=c.value;i.__v&&i.__v.__e&&i.__v.__e.nodeType===3&&(i.__v.__e.data=u)}}),f=e.__$u.d;return e.__$u.d=function(){p(),f.call(this)},[d,c]},[]),n=o[0],r=o[1];return n.value?r.peek():r.value}oc.displayName="ReactiveTextNode";Object.defineProperties(Ee.prototype,{constructor:{configurable:!0,value:Fa(le,null).constructor},type:{configurable:!0,value:oc},props:{configurable:!0,get:function(){var a=this;return{data:{get value(){return a.value}}}}},__b:{configurable:!0,value:1}});Ka("__b",function(a,e){if(xs(),typeof e.type=="string"){var t,s=e.props;for(var o in s)if(o!=="children"){var n=s[o];n instanceof Ee&&(t||(e.__np=t={}),t[o]=n,s[o]=n.peek())}}a(e)});Ka("__r",function(a,e){if(a(e),e.type!==le){xs();var t,s=e.__c;s&&(s.__$f&=-2,(t=s.__$u)===void 0&&(s.__$u=t=(function(o,n){var r;return As(function(){r=this},{name:n}),r.c=o,r})((function(o){return function(){var n;Ch&&((n=this.y)==null||n.call(this)),o.__$f|=1,o.setState({})}})(s),typeof e.type=="function"?e.type.displayName||e.type.name:""))),xs(t)}});Ka("__e",function(a,e,t,s){xs(),a(e,t,s)});Ka("diffed",function(a,e){xs();var t;if(typeof e.type=="string"&&(t=e.__e)){var s=e.__np,o=e.props,n=t.U;if(n)for(var r in n){var i=n[r];i===void 0||s&&r in s||(i.d(),n[r]=void 0)}if(s){n||(n={},t.U=n);for(var l in s){var c=n[l],d=s[l];c===void 0?(c=Ph(t,l,d,o),n[l]=c):c.o(d,o)}}}a(e)});function Ph(a,e,t,s){var o=e in a&&a.ownerSVGElement===void 0,n=Re(t);return{o:function(r,i){n.value=r,s=i},d:As(function(){this.N=nc;var r=n.value.value;s[e]!==r&&(s[e]=r,o?a[e]=r:r!=null&&(r!==!1||e[4]==="-")?a.setAttribute(e,r):a.removeAttribute(e))})}}Ka("unmount",function(a,e){if(typeof e.type=="string"){var t=e.__e;if(t){var s=t.U;if(s){t.U=void 0;for(var o in s){var n=s[o];n&&n.d()}}}var r=e.__np;if(r){var i=e.props;for(var l in r)i[l]=r[l]}e.__np=void 0}else{var c=e.__c;if(c){c.__$f|=8;var d=c.__$u;d&&(c.__$u=void 0,d.d())}}a(e)});Ka("__h",function(a,e,t,s){s<3&&(e.__$f|=2),a(e,t,s)});_t.prototype.shouldComponentUpdate=function(a,e){if(this.__R)return!0;var t=this.__$u,s=t&&t.s!==void 0;for(var o in e)return!0;if(this.__f||typeof this.u=="boolean"&&this.u===!0){var n=2&this.__$f;if(!(s||n||4&this.__$f)||1&this.__$f)return!0}else if(!(s||4&this.__$f)||3&this.__$f)return!0;for(var r in a)if(r!=="__source"&&a[r]!==this.props[r])return!0;for(var i in this.props)if(!(i in a))return!0;return!1};function Ah(a,e){return or(function(){return Re(a,e)},[])}var Eh=function(a){queueMicrotask(function(){queueMicrotask(a)})};function Lh(){zh(function(){for(var a;a=sc.shift();)ac.call(a)})}function nc(){sc.push(this)===1&&(W.requestAnimationFrame||Eh)(Lh)}const ma=Re(null);let Mo=null;function rc(a){const e=document.documentElement,t=document.body;e.style.setProperty("--ui-scale",String(a.uiScale)),e.style.setProperty("--ts",String(a.textScale)),e.style.setProperty("--hud-opacity",String(a.hudOpacity));for(const[s,o]of Object.entries(ya[a.colorVision]))e.style.setProperty(`--r-${s}`,o);e.style.setProperty("--danger-pencil",`rgb(${gl[a.dangerColor].map(s=>Math.round(s*255)).join(",")})`),t.classList.toggle("font-legible",a.font==="legible"),t.classList.toggle("contrast",a.highContrast),t.classList.toggle("calm",ml(a)),t.dataset.vision=a.colorVision}function qh(a,e){ma.value=a,Mo=e,rc(a),e&&ir(a,e)}function Rh(a){Mo=a,ma.value&&ir(ma.value,a)}function ir(a,e){e.applySettings(a),e.bus.emit("audio:mix",{master:a.volMaster,music:a.volMusic,sfx:a.volSfx,ambience:a.volAmbience,ui:a.volUi,mono:a.monoAudio,muteHidden:a.muteUnfocused}),e.bus.emit("settings:changed")}function la(a){const e={...ma.value,...a};ma.value=e,P0(e),rc(e),Mo&&ir(e,Mo)}const $h={town:"A safe hearth",market:"A safe hearth, with a smith, an alchemist and your stash",shrine:"A waystone rests here",camp:"A tinker trades by the fire",ruin:"Something old lives here",farm:"Fields and quiet",dungeon:"A way down into the dark"};function Hh(a){const e=a.bus;e.on("log",t=>t.big?Te("Bounty complete","Return to any warden for your pay."):ae(t.text)),e.on("pickup",t=>{if(t.item==="gold"||t.item==="potion")return;const s=t.rarity?ya[a.settings.colorVision][t.rarity]:"";ae(`Picked up <em${s?` style="color:${s}"`:""}>${t.name??t.item}</em>`)}),e.on("levelup",t=>Te(`Level ${t.level}`,"A skill point to spend in the skill tree.",3.6)),e.on("site:enter",t=>Te(t.name,$h[t.kind]??"")),e.on("attune",t=>ae(`Attuned to <em>${t.name}</em>. You will return here, and its waystone refills your tonics.`)),e.on("fallen",t=>Te("You were overcome",t.lost?`${t.lost} glint lies where you fell. Go back for it before you fall again.`:`Returning to ${a.player.char.journey.waystone.name}…`,4)),e.on("recovered",t=>ae(`You have your <em>${t.n} glint</em> back.`)),e.on("nightfall",()=>Te("Night falls","The wilds grow bolder after dark, and richer.",4)),e.on("daybreak",()=>ae("Day breaks. The wilds settle.")),e.on("trade",t=>{t.total&&ae(`Sold for <em>${t.total} glint</em>.`)}),e.on("bounty:claimed",t=>Te("Bounty paid",`+${t.xp} xp · +${t.glint} glint`)),e.on("monster:died",t=>{t.elite&&ae(`You felled <em>${t.name}</em>.`)}),e.on("boon",t=>Te(t.name,`${t.desc} The stones lend it for a few minutes.`,3.6)),e.on("travel:arrive",t=>ae(`Travelled to <em>${t.name}</em>.`)),e.on("zone:enter",t=>{t.zone.kind==="dungeon"&&Te(t.name,"An Inkbound waits in the deepest hall.",3.6)}),e.on("dungeon:cleared",t=>Te("Dungeon cleared",t.first?"The hoard is yours, and you may leave from anywhere here.":"Cleared again. Leave from anywhere here.",4)),e.on("found",t=>{t.kind==="cache"?Te(t.name,"Left under a cairn by someone who never came back for it.",3.2):t.kind==="beacon"?Te(t.name,t.shown?`${t.shown} places round about are marked on your map.`:"Nothing new can be seen from here.",3.6):t.kind==="stones"?ae(`Found <em>${t.name}</em>.`):ae(`Found <em>${t.name}</em>. ${t.count} ${t.count===1?"place":"places"} so far.`)}),e.on("land",t=>{t.all?Te("The Long Walk is done","You have set foot in every country. The road teaches one last skill point.",5):t.mark?Te(`${t.count} countries walked`,"The road teaches a skill point.",4):ae(`New country: <em>${t.name}</em>. ${t.count} of ${t.total} walked.`)})}const Ln=["skills","settings","menu","help"],A={screen:Re("title"),open:Re([]),npc:Re(null),tip:Re(null),toast:Re(null),log:Re([]),prompt:Re(null),confirm:Re(null),rev:Re(0),frame:Re(0),heroes:Re(0),guide:Re(null)};let ga=null;const K=()=>ga,Dh=()=>{A.rev.value++};let Ih=0,Fh=0;function Te(a,e="",t=2.8){const s=ga,o=s?s.settings.toastSeconds:1;A.toast.value={id:++Ih,title:a,sub:e,seconds:t*o}}function ae(a){const e={id:++Fh,html:a,old:!1};A.log.value=[...A.log.value.slice(-4),e];const t=ga?ga.settings.toastSeconds:1;setTimeout(()=>{A.log.value=A.log.value.map(s=>s.id===e.id?{...s,old:!0}:s)},5200*t),setTimeout(()=>{A.log.value=A.log.value.filter(s=>s.id!==e.id)},6200*t)}function ic(a){return A.open.value.includes(a)}function dt(a){const e=ga;if(Ln.includes(a))A.open.value=[a];else{const t=A.open.value.filter(s=>!Ln.includes(s)&&yi(s)!==yi(a)&&innerWidth>=760);A.open.value=[...t,a]}e.bus.emit("ui:click"),cr()}function wa(a){A.open.value=A.open.value.filter(e=>e!==a),(a==="vendor"||a==="stash"||a==="bounty")&&(A.npc.value=null),A.tip.value=null,cr()}function lr(a){ic(a)?wa(a):dt(a)}function ja(){A.open.value=[],A.npc.value=null,A.tip.value=null,cr()}function yi(a){return a==="inventory"||a==="map"||a==="view"?"right":Ln.includes(a)?"center":"left"}function cr(){const a=ga;if(!a)return;const t=A.open.value.length>0&&A.screen.value==="game"&&(a.settings.pauseOnMenu||A.open.value.some(s=>s==="menu"||s==="settings"));t!==a.menuPause&&(a.menuPause=t,t&&a.input.release())}function Nh(a){ga=a;const e=a.bus;Hh(a);for(const t of["inventory:changed","equipment:changed","tree:changed","build:changed","levelup","trade","bounty:changed","xp","attune","found","boon","pickup","drink","land","dungeon:cleared","zone:enter","character:loaded","settings:changed","travel:arrive"])e.on(t,Dh);e.on("frame",()=>{A.frame.value++}),e.on("guide",t=>{A.guide.value=t}),e.on("interact:prompt",t=>{A.prompt.value=t}),e.on("npc:talk",t=>{A.npc.value=t,t.role==="warden"?(a.bounties.offers.length||a.bounties.refresh(),dt("bounty")):t.role==="stash"?(dt("stash"),dt("inventory")):(dt("vendor"),dt("inventory"))}),e.on("ui:toggle",t=>{if(A.screen.value==="game"){if(t==="menu"){if(A.confirm.value){A.confirm.value=null;return}A.open.value.length?ja():dt("menu");return}lr(t)}})}var Bh=0;function h(a,e,t,s,o,n){e||(e={});var r,i,l=e;if("ref"in l)for(i in l={},e)i=="ref"?r=e[i]:l[i]=e[i];var c={type:a,props:l,key:t,ref:r,__k:null,__:null,__b:0,__e:null,__c:null,constructor:void 0,__v:--Bh,__i:-1,__u:0,__source:o,__self:n};if(typeof a=="function"&&(r=a.defaultProps))for(i in r)l[i]===void 0&&(l[i]=r[i]);return W.vnode&&W.vnode(c),c}function Oh(a,e){for(var t in e)a[t]=e[t];return a}function qn(a,e){for(var t in a)if(t!=="__source"&&!(t in e))return!0;for(var s in e)if(s!=="__source"&&a[s]!==e[s])return!0;return!1}function bi(a,e){this.props=a,this.context=e}function lc(a,e){function t(o){var n=this.props.ref;return n!=o.ref&&n&&(typeof n=="function"?n(null):n.current=null),e?!e(this.props,o)||n!=o.ref:qn(this.props,o)}function s(o){return this.shouldComponentUpdate=t,Fa(a,o)}return s.displayName="Memo("+(a.displayName||a.name)+")",s.__f=s.prototype.isReactComponent=!0,s.type=a,s}(bi.prototype=new _t).isPureReactComponent=!0,bi.prototype.shouldComponentUpdate=function(a,e){return qn(this.props,a)||qn(this.state,e)};var xi=W.__b;W.__b=function(a){a.type&&a.type.__f&&a.ref&&(a.props.ref=a.ref,a.ref=null),xi&&xi(a)};var jh=W.__e;W.__e=function(a,e,t,s){if(a.then){for(var o,n=e;n=n.__;)if((o=n.__c)&&o.__c)return e.__e==null&&(e.__e=t.__e,e.__k=t.__k||[]),o.__c(a,e)}jh(a,e,t,s)};var wi=W.unmount;function cc(a,e,t){return a&&(a.__c&&a.__c.__H&&(a.__c.__H.__.forEach(function(s){typeof s.__c=="function"&&s.__c()}),a.__c.__H=null),(a=Oh({},a)).__c!=null&&(a.__c.__P===t&&(a.__c.__P=e),a.__c.__e=!0,a.__c=null),a.__k=a.__k&&a.__k.map(function(s){return cc(s,e,t)})),a}function dc(a,e,t){return a&&t&&(a.__v=null,a.__k=a.__k&&a.__k.map(function(s){return dc(s,e,t)}),a.__c&&a.__c.__P===e&&(a.__e&&t.appendChild(a.__e),a.__c.__e=!0,a.__c.__P=t)),a}function ln(){this.__u=0,this.o=null,this.__b=null}function hc(a){var e=a.__&&a.__.__c;return e&&e.__a&&e.__a(a)}function Ws(){this.i=null,this.l=null}W.unmount=function(a){var e=a.__c;e&&(e.__z=!0),e&&e.__R&&e.__R(),e&&32&a.__u&&(a.type=null),wi&&wi(a)},(ln.prototype=new _t).__c=function(a,e){var t=e.__c,s=this;s.o==null&&(s.o=[]),s.o.push(t);var o=hc(s.__v),n=!1,r=function(){n||s.__z||(n=!0,t.__R=null,o?o(l):l())};t.__R=r;var i=t.__P;t.__P=null;var l=function(){if(!--s.__u){if(s.state.__a){var c=s.state.__a;s.__v.__k[0]=dc(c,c.__c.__P,c.__c.__O)}var d;for(s.setState({__a:s.__b=null});d=s.o.pop();)d.__P=i,d.forceUpdate()}};s.__u++||32&e.__u||s.setState({__a:s.__b=s.__v.__k[0]}),a.then(r,r)},ln.prototype.componentWillUnmount=function(){this.o=[]},ln.prototype.render=function(a,e){if(this.__b){if(this.__v.__k){var t=document.createElement("div"),s=this.__v.__k[0].__c;this.__v.__k[0]=cc(this.__b,t,s.__O=s.__P)}this.__b=null}var o=e.__a&&Fa(le,null,a.fallback);return o&&(o.__u&=-33),[Fa(le,null,e.__a?null:a.children),o]};var ki=function(a,e,t){if(++t[1]===t[0]&&a.l.delete(e),a.props.revealOrder&&(a.props.revealOrder[0]!=="t"||!a.l.size))for(t=a.i;t;){for(;t.length>3;)t.pop()();if(t[1]<t[0])break;a.i=t=t[2]}};(Ws.prototype=new _t).__a=function(a){var e=this,t=hc(e.__v),s=e.l.get(a);return s[0]++,function(o){var n=function(){e.props.revealOrder?(s.push(o),ki(e,a,s)):o()};t?t(n):n()}},Ws.prototype.render=function(a){this.i=null,this.l=new Map;var e=co(a.children);a.revealOrder&&a.revealOrder[0]==="b"&&e.reverse();for(var t=e.length;t--;)this.l.set(e[t],this.i=[1,0,this.i]);return a.children},Ws.prototype.componentDidUpdate=Ws.prototype.componentDidMount=function(){var a=this;this.l.forEach(function(e,t){ki(a,t,e)})};var Uh=typeof Symbol<"u"&&Symbol.for&&Symbol.for("react.element")||60103,Wh=/^(?:accent|alignment|arabic|baseline|cap|clip(?!PathU)|color|dominant|fill|flood|font|glyph(?!R)|horiz|image(!S)|letter|lighting|marker(?!H|W|U)|overline|paint|pointer|shape|stop|strikethrough|stroke|text(?!L)|transform|underline|unicode|units|v|vector|vert|word|writing|x(?!C))[A-Z]/,Kh=/^on(Ani|Tra|Tou|BeforeInp|Compo)/,Gh=/[A-Z0-9]/g,Yh=typeof document<"u",Vh=function(a){return(typeof Symbol<"u"&&typeof Symbol()=="symbol"?/fil|che|rad/:/fil|che|ra/).test(a)};_t.prototype.isReactComponent=!0,["componentWillMount","componentWillReceiveProps","componentWillUpdate"].forEach(function(a){Object.defineProperty(_t.prototype,a,{configurable:!0,get:function(){return this["UNSAFE_"+a]},set:function(e){Object.defineProperty(this,a,{configurable:!0,writable:!0,value:e})}})});var Mi=W.event;W.event=function(a){return Mi&&(a=Mi(a)),a.persist=function(){},a.isPropagationStopped=function(){return this.cancelBubble},a.isDefaultPrevented=function(){return this.defaultPrevented},a.nativeEvent=a};var Xh={configurable:!0,get:function(){return this.class}},_i=W.vnode;W.vnode=function(a){typeof a.type=="string"&&(function(e){var t=e.props,s=e.type,o={},n=s.indexOf("-")==-1;for(var r in t){var i=t[r];if(!(r==="value"&&"defaultValue"in t&&i==null||Yh&&r==="children"&&s==="noscript"||r==="class"||r==="className")){var l=r.toLowerCase();r==="defaultValue"&&"value"in t&&t.value==null?r="value":r==="download"&&i===!0?i="":l==="translate"&&i==="no"?i=!1:l[0]==="o"&&l[1]==="n"?l==="ondoubleclick"?r="ondblclick":l!=="onchange"||s!=="input"&&s!=="textarea"||Vh(t.type)?l==="onfocus"?r="onfocusin":l==="onblur"?r="onfocusout":Kh.test(r)&&(r=l):l=r="oninput":n&&Wh.test(r)?r=r.replace(Gh,"-$&").toLowerCase():i===null&&(i=void 0),l==="oninput"&&o[r=l]&&(r="oninputCapture"),o[r]=i}}s=="select"&&(o.multiple&&Array.isArray(o.value)&&(o.value=co(t.children).forEach(function(c){c.props.selected=o.value.indexOf(c.props.value)!=-1})),o.defaultValue!=null&&(o.value=co(t.children).forEach(function(c){c.props.selected=o.multiple?o.defaultValue.indexOf(c.props.value)!=-1:o.defaultValue==c.props.value}))),t.class&&!t.className?(o.class=t.class,Object.defineProperty(o,"className",Xh)):t.className&&(o.class=o.className=t.className),e.props=o})(a),a.$$typeof=Uh,_i&&_i(a)};var zi=W.__r;W.__r=function(a){zi&&zi(a),a.__c};var Si=W.diffed;W.diffed=function(a){Si&&Si(a);var e=a.props,t=a.__e;t!=null&&a.type==="textarea"&&"value"in e&&e.value!==t.value&&(t.value=e.value==null?"":e.value)};function Rn(a){const e=a.derived,t=a.totals;return(e.weapon.min+e.weapon.max)/2*e.mainMult*(1+t.add.damage)*t.more.damage*(1+e.critChance*(e.critMult-1))*e.attackSpeed}function $n(a){const e=a.derived,t=(e.resist.fire+e.resist.frost+e.resist.storm+e.resist.poison+e.resist.shadow)/5,s=e.armor/(e.armor+40+180);return e.maxLife/((1-s*.6)*(1-t*.4)*e.taken*(1-e.dodge)*(1-e.block*.4))}function Zh(a,e,t){const s=Wl(a,e),o=vo({char:a}),n={...a.equipment,[s]:e};s==="mainhand"&&ve[e.base]?.hands===2&&delete n.offhand;const r=vo({char:{...a,equipment:n}}),i=o.derived,l=r.derived;return[{label:"Damage",before:Rn(o),after:Rn(r),fmt:"int",better:!0},{label:"Toughness",before:$n(o),after:$n(r),fmt:"int",better:!0},{label:"Health",before:i.maxLife,after:l.maxLife,fmt:"int",better:!0},{label:"Armor",before:i.armor,after:l.armor,fmt:"int",better:!0},{label:"Critical chance",before:i.critChance,after:l.critChance,fmt:"pct",better:!0},{label:"Critical damage",before:i.critMult,after:l.critMult,fmt:"pct",better:!0},{label:"Attack speed",before:i.attackSpeed,after:l.attackSpeed,fmt:"pct",better:!0},{label:"Movement speed",before:i.moveSpeed,after:l.moveSpeed,fmt:"pct",better:!0},{label:"Cooldowns",before:i.cdr,after:l.cdr,fmt:"pct",better:!0},{label:"Resource",before:i.maxResource,after:l.maxResource,fmt:"int",better:!0}].filter(d=>Math.abs(d.after-d.before)>(d.fmt==="pct"?5e-4:.5))}function Qh(a){const e=a.after-a.before,t=e>0?"+":"−";return a.fmt==="pct"?`${t}${Math.abs(e*100).toFixed(1)}%`:a.label==="Damage"||a.label==="Toughness"?`${t}${Math.abs(a.before?e/a.before*100:0).toFixed(1)}%`:`${t}${Math.round(Math.abs(e))}`}const ts="#623c1e",wt="#f1ebdc",Wt="#d64634",kt=(a,e="")=>`<svg viewBox="0 0 40 40" aria-hidden="true" ${e?`class="${e}"`:""} fill="none" stroke="${ts}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${a}</svg>`,Jh={physical:"#e2bc82",fire:"#f09e4a",frost:"#88b4d8",storm:"#f4be3e",poison:"#86c06a",shadow:"#8a7aa8"},Ti={slash:a=>`<path d="M7 33L31 9" stroke-width="5" stroke="${a}"/><path d="M7 33L31 9"/><path d="M26 7l7 0 0 7"/><path d="M10 24l-4 6 6-4"/>`,cleave:a=>`<path d="M6 31C9 15 21 6 35 7 25 12 17 21 15 34z" fill="${a}"/><path d="M9 25c4-8 10-13 18-15" stroke-width="1.4"/><path d="M27 30l6 4M30 26l5 2" stroke="${Wt}"/>`,shield:a=>`<path d="M20 5l12 4v9c0 9-6 14-12 17C14 32 8 27 8 18V9z" fill="${a}"/><path d="M20 9v22M12 17h16" stroke-width="1.4"/>`,spiral:a=>`<circle cx="20" cy="20" r="13" fill="${a}"/><path d="M20 20c3 0 4 3 2 5s-7 1-7-4 5-9 10-7 8 9 4 13" stroke-width="1.6"/>`,horn:a=>`<path d="M6 26c8-1 16-8 22-18l5 3c-3 10-11 20-24 21z" fill="${a}"/><path d="M31 9c2 2 3 4 2 6"/><path d="M8 33l-2 3M12 34l0 3" stroke="${Wt}"/>`,armor:a=>`<path d="M12 7l8 3 8-3 6 6-4 5v15H10V18l-4-5z" fill="${a}"/><path d="M20 10v23M14 18h12" stroke-width="1.4"/>`,leap:a=>`<path d="M6 32c6-18 18-24 28-22" stroke-dasharray="3 3"/><circle cx="31" cy="11" r="5" fill="${a}"/><path d="M4 34h12" stroke-width="2.6"/>`,charge:a=>`<path d="M6 20h18l-5-7M24 20l-5 7" stroke-width="3" stroke="${a}"/><path d="M6 20h18l-5-7M24 20l-5 7"/><path d="M28 12v16M33 14v12" stroke="${Wt}"/>`,quake:a=>`<path d="M4 28h32" stroke-width="2.4"/><path d="M20 28l-4-8 5-4-3-8" stroke="${Wt}" stroke-width="2.4"/><path d="M8 28c2-6 6-8 8-8M32 28c-2-6-6-8-9-8" fill="${a}"/>`,flame:a=>`<path d="M20 35c-8 0-12-6-10-12 2-5 6-7 6-13 5 3 6 7 6 10 2-2 3-4 3-6 4 4 6 8 5 12-1 5-5 9-10 9z" fill="${a}"/><path d="M20 33c-3 0-5-3-4-6 1-2 3-3 3-6 3 2 5 5 4 8-1 2-1 4-3 4z" fill="${wt}"/>`,banner:a=>`<path d="M11 5v32"/><path d="M11 7h20l-5 6 5 6H11" fill="${a}"/>`,meteor:a=>`<circle cx="25" cy="25" r="8" fill="${a}"/><path d="M5 5l14 14M10 4l10 10M4 10l10 10" stroke="${Wt}"/>`,spark:a=>`<path d="M22 4L10 22h9l-3 14 14-19h-9z" fill="${a}"/>`,shard:a=>`<path d="M8 32L28 6l5 5L12 34z" fill="${a}"/><path d="M14 26l10-12" stroke-width="1.3"/><path d="M30 26l4 2M32 21l4-1" stroke="#88b4d8"/>`,bolt:a=>`<circle cx="24" cy="16" r="9.5" fill="${a}"/><path d="M24 11c3 1 4 4 3 6s-4 3-6 1 0-5 3-3" stroke-width="1.5"/><path d="M5 35l9-9M9 27l5-2M13 35l3-6" stroke="${Wt}"/>`,lance:a=>`<path d="M5 35L33 7" stroke-width="5" stroke="${a}"/><path d="M5 35L33 7"/><path d="M27 6l7 0 0 7z" fill="${a}"/>`,chain:a=>`<path d="M6 8l9 9-4 2 10 9-3 2 12 6-8-11 3-1-9-9 3-2z" fill="${a}"/>`,heart:a=>`<path d="M20 34C8 25 6 18 9 13c3-5 9-4 11 0 2-4 8-5 11 0 3 5 1 12-11 21z" fill="${a}"/><path d="M20 15v10M15 20h10" stroke="${wt}" stroke-width="3.2"/>`,snow:a=>`<circle cx="20" cy="20" r="14" fill="${a}"/><path d="M20 8v24M9.6 14l20.8 12M9.6 26l20.8-12" stroke="${wt}" stroke-width="2.4"/><path d="M20 8v24M9.6 14l20.8 12M9.6 26l20.8-12" stroke-width="1"/>`,step:a=>`<path d="M8 10l11 10L8 30M20 10l11 10-11 10" stroke="${a==="#e2bc82"?"#546c9c":a}" stroke-width="4.2"/><path d="M4 16h6M3 24h6" stroke-width="1.5"/>`,cloud:a=>`<path d="M10 26a6 6 0 0 1 1-12 9 9 0 0 1 17 2 5 5 0 0 1 2 10z" fill="${a}"/><path d="M13 31l-2 4M20 31l-2 4M27 31l-2 4" stroke="#88b4d8"/>`,arrow:a=>`<path d="M6 34L30 10" stroke-width="2.2"/><path d="M24 8l9-1-1 9z" fill="${a}"/><path d="M6 34l1-6M6 34l6-1M10 30l1-6M10 30l6-1" stroke="${Wt}"/>`,daggers:a=>`<path d="M9 31L24 12l3 3L12 34z" fill="${a}"/><path d="M31 31L16 12l-3 3 15 19z" fill="${a}"/><path d="M7 33l3-3M33 33l-3-3" stroke-width="3"/>`,fan:a=>`<path d="M20 34L8 8M20 34L20 6M20 34L32 8" stroke-width="1.8"/><path d="M6 6l4 1-1 4zM18 4h4l-2 4zM34 6l-4 1 1 4z" fill="${a}"/>`,smoke:a=>`<path d="M8 28a6 6 0 0 1 3-11 8 8 0 0 1 15-2 6 6 0 0 1 6 9 5 5 0 0 1-4 6H12a5 5 0 0 1-4-2z" fill="${a}"/><path d="M14 22c2-2 5-2 7 0" stroke-width="1.4"/>`,trap:a=>`<path d="M6 26h28" stroke-width="2.4"/><path d="M9 26l3-12 3 12M17 26l3-14 3 14M25 26l3-12 3 12" fill="${a}"/>`,rain:a=>`<path d="M8 6l-3 9M16 4l-3 9M24 6l-3 9M32 4l-3 9M12 20l-3 9M20 18l-3 9M28 20l-3 9" stroke="${a==="#e2bc82"?ts:a}" stroke-width="2.2"/><path d="M4 34h32" stroke-width="2"/>`,eye:a=>`<path d="M4 20c5-8 11-11 16-11s11 3 16 11c-5 8-11 11-16 11S9 28 4 20z" fill="${wt}"/><circle cx="20" cy="20" r="6" fill="${a}"/><circle cx="20" cy="20" r="2" fill="${ts}"/>`,hands:a=>`<path d="M10 30V14l3-2 3 2v-4l3-2 3 2v4l3-1 3 2v15z" fill="${a}"/>`,fist:a=>`<path d="M10 14h18l4 6v8l-6 6H14l-4-6z" fill="${a}"/><path d="M15 14v8M21 14v8M27 15v7" stroke-width="1.4"/>`,drop:a=>`<path d="M20 5c6 9 11 15 11 21a11 11 0 0 1-22 0c0-6 5-12 11-21z" fill="${a==="#e2bc82"?"#d8584a":a}"/><path d="M15 26a5 5 0 0 0 4 5" stroke="${wt}" stroke-width="2.4"/>`,boot:a=>`<path d="M12 6h10v16l10 5v6H8V24l4-2z" fill="${a}"/><path d="M8 29h24" stroke-width="1.4"/>`,skull:a=>`<path d="M8 18a12 12 0 0 1 24 0v6l-4 2v6H12v-6l-4-2z" fill="${a}"/><circle cx="15" cy="19" r="3" fill="${ts}"/><circle cx="25" cy="19" r="3" fill="${ts}"/>`,burst:a=>`<path d="M20 3l4 10 11-4-7 9 9 6-11 1 1 11-7-8-7 8 1-11-11-1 9-6-7-9 11 4z" fill="${a}"/>`,orb:a=>`<circle cx="20" cy="20" r="13" fill="${a}"/><path d="M14 16a7 7 0 0 1 7-5" stroke="${wt}" stroke-width="3"/>`,hourglass:a=>`<path d="M10 5h20M10 35h20M12 5c0 9 8 10 8 15s-8 6-8 15M28 5c0 9-8 10-8 15s8 6 8 15"/><path d="M13 33c2-5 5-7 7-8 2 1 5 3 7 8z" fill="${a}"/>`,star:a=>`<path d="M20 4l5 10 11 2-8 8 2 11-10-5-10 5 2-11-8-8 11-2z" fill="${a}"/>`,sword:a=>`<path d="M24 6l10 0 0 10L14 26l-4-4z" fill="${a}"/><path d="M8 20l12 12M6 34l7-7" stroke-width="3"/>`,helm:a=>`<path d="M8 26a12 12 0 0 1 24 0v6H8z" fill="${a}"/><path d="M20 14v18M8 26h24" stroke-width="1.4"/>`,chest:a=>`<path d="M12 7l8 3 8-3 6 6-4 5v15H10V18l-4-5z" fill="${a}"/><path d="M20 10v23" stroke-width="1.4"/>`,gloves:a=>`<path d="M12 34V16l2-6 3 1 1-4 3 1 1 4 3-1 2 6v18z" fill="${a}"/><path d="M12 28h16" stroke-width="1.4"/>`,legs:a=>`<path d="M11 6h18l-1 28h-6l-2-16-2 16h-6z" fill="${a}"/><path d="M11 10h18" stroke-width="1.4"/>`,boots:a=>`<path d="M12 6h10v16l10 5v6H8V24l4-2z" fill="${a}"/><path d="M8 29h24" stroke-width="1.4"/>`,amulet:a=>`<path d="M10 6c0 10 4 14 10 14s10-4 10-14" stroke-width="1.6"/><path d="M20 18l7 8-7 10-7-10z" fill="${a}"/>`,ring:a=>`<circle cx="20" cy="24" r="10" stroke-width="3.4" stroke="${a}"/><circle cx="20" cy="24" r="10"/><path d="M20 6l5 6-5 5-5-5z" fill="${a}"/>`,flask:a=>`<path d="M12.5 24h15l3.5 6a3 3 0 0 1-3 5H12a3 3 0 0 1-3-5z" fill="${a}" stroke="none"/><path d="M16 8v7L9 27a5 5 0 0 0 4 8h14a5 5 0 0 0 4-8l-7-12V8"/><rect x="15" y="4" width="10" height="4" rx="1.5" fill="#b08054"/>`,pouch:a=>`<path d="M12 14c-6 6-8 20 8 20s14-14 8-20z" fill="${a}"/><path d="M13 14c2-3 1-6-1-8h16c-2 2-3 5-1 8z" fill="${wt}"/><path d="M12 14h16" stroke="${Wt}" stroke-width="2.4"/>`,gem:a=>`<path d="M20 4l12 10-12 22L8 14z" fill="${a}"/><path d="M8 14h24M20 36V14M20 4l-5 10M20 4l5 10" stroke-width="1.4"/>`};function Jt(a,e,t=""){return kt((Ti[a]??Ti.star)(e),t)}const Ro=(a,e)=>Jt(a,Jh[e]),eu={character:kt(`<circle cx="20" cy="13" r="7" fill="${wt}"/><path d="M7 35c0-9 6-13 13-13s13 4 13 13z" fill="#d64634"/>`),inventory:kt('<path d="M9 16h22l2 17a3 3 0 0 1-3 3H10a3 3 0 0 1-3-3z" fill="#e2bc82"/><path d="M14 16v-3a6 6 0 0 1 12 0v3"/>'),skills:kt('<path d="M20 35V20M20 20l-9-9M20 20l9-9M20 27l-7-4M20 27l7-4" stroke-width="2.2"/><circle cx="11" cy="10" r="4" fill="#f4be3e"/><circle cx="29" cy="10" r="4" fill="#f4be3e"/><circle cx="20" cy="20" r="4" fill="#d64634"/>'),journal:kt('<path d="M9 6h20a2 2 0 0 1 2 2v26H11a2 2 0 0 1-2-2z" fill="#e2bc82"/><path d="M14 13h12M14 19h12M14 25h8" stroke-width="1.6"/>'),menu:kt('<path d="M8 12h24M8 20h24M8 28h24" stroke-width="3"/>')},_o={attack:kt(`<path d="M14 23L29 6h5v5L17 26z" fill="${wt}"/><path d="M17.5 22.5L30 10" stroke-width="1.4"/><path d="M10 19l11 11" stroke-width="3"/><path d="M13.5 26.5L8 32" stroke="#d64634" stroke-width="4"/><circle cx="6.5" cy="33.5" r="2" fill="#e2b034"/>`,"i-attack"),talk:kt(`<path d="M6 8h28v18H20l-8 7v-7H6z" fill="${wt}"/><path d="M12 14.5h16M12 20h10" stroke-width="1.6"/>`,"i-talk"),next:kt('<circle cx="20" cy="20" r="4.5" fill="#d64634"/><path d="M8 17a12.5 12.5 0 0 1 22-6M32 23a12.5 12.5 0 0 1-22 6"/><path d="M31 4v8h-8M9 36v-8h8"/>'),evade:kt('<path d="M6 28c8 2 16-2 22-12" stroke-dasharray="3 3"/><path d="M24 10l8 4-4 8" stroke-width="2.6"/><circle cx="10" cy="26" r="4" fill="#88b4d8"/>')},fe="#3b2414",uc="#f6f0e1",Ze="#fffaf0",Hn=-1.08,Ks={x:.62,y:.78};function zo(a){let e=a>>>0;return()=>{e=e+1831565813>>>0;let t=e;return t=Math.imul(t^t>>>15,t|1),t^=t+Math.imul(t^t>>>7,t|61),((t^t>>>14)>>>0)/4294967296}}function ws(a){let e=2166136261;for(let t=0;t<a.length;t++)e^=a.charCodeAt(t),e=Math.imul(e,16777619)>>>0;return e>>>0}function fc(a,e){const t=parseInt(a.slice(1),16),s=o=>Math.max(0,Math.min(255,Math.round(e<0?o*(1+e):o+(255-o)*e))).toString(16).padStart(2,"0");return`#${s(t>>16)}${s(t>>8&255)}${s(t&255)}`}const tu=(a,e)=>e[Math.floor(a()*e.length)],Ua=a=>({base:a,deep:fc(a,-.45)}),$o=a=>fc(a.base,.45),cn=a=>"#"+a.map(e=>Math.round(e*255).toString(16).padStart(2,"0")).join(""),Es=a=>a==="legendary"||a==="unique",Ci=(a,e)=>{const t=parseInt(a.slice(1),16);return`rgba(${t>>16},${t>>8&255},${t&255},${e})`},pc=(a,e,t)=>{const s=Math.max(0,Math.min(1,(t-a)/(e-a)));return s*s*(3-2*s)},it={base:"#b7c0cc",deep:"#5d6879"},ks={base:"#8f97a3",deep:"#474e5a"},yt={base:"#c58e57",deep:"#70462a"},Je={base:"#a46d47",deep:"#523321"},mc={base:"#e9bd48",deep:"#946618"},au={base:"#ccab55",deep:"#7a5d1c"},dr={base:"#f2a04a",deep:"#c9501e"},gc={base:"#ffe28c",deep:"#f2a04a"},su={base:"#abcde8",deep:"#5a83ad"},ou={base:"#88b268",deep:"#4b7838"},vc={base:"#d64634",deep:"#8c261b"},Yt={base:"#5ce2ff",deep:"#1f8fb0"},nu={base:"#e8ecf2",deep:"#8a94a6"},Pi={base:"#4c5263",deep:"#23262f"},Ai={base:"#24232e",deep:"#0d0c12"},yc={base:"#f4fbff",deep:"#9fdcf0"},ru=["#b84a3a","#4f6c9e","#5e8c4e","#c49434","#885478","#469696","#4a4d5e","#c8b48a"],hr=a=>a.stack[a.stack.length-1];function Me(a,e,t){a.stack.push(hr(a).multiply(e)),t(),a.stack.pop()}const $e=(a,e=50,t=50)=>new DOMMatrix().translate(e,t).rotate(a).translate(-e,-t),Dn=(a,e=50,t=50)=>new DOMMatrix().translate(e,t).scale(a).translate(-e,-t),Mt=(a,e)=>new DOMMatrix().translate(a,e);function E(a,e,t,s=.3,o=2){a.prims.push({t:"shape",d:e,m:hr(a),mat:t,shade:s,pen:o})}function q(a,e,t=1.4,s=fe,o=1){a.prims.push({t:"line",d:e,m:hr(a),w:t,color:s,alpha:o})}const ur=(a,e,t,s=t)=>`M${a-t} ${e}a${t} ${s} 0 1 0 ${t*2} 0a${t} ${s} 0 1 0 ${-t*2} 0z`;function ie(a,e,t,s,o,n=.25,r=2){E(a,ur(e,t,s),o,n,r)}function ea(a,e,t,s){E(a,`M${e} ${t-s}L${e+s} ${t}L${e} ${t+s}L${e-s} ${t}Z`,a.gem,.1,1.4),q(a,`M${e-s*.45} ${t-s*.15}l${s*.35} ${-s*.35}`,1.1,Ze,.9)}function In(a,e){const t=a.r,s=(e?7.5:5.5)+t()*2,o=e?6:14,n=e?64:62;E(a,`M${50-s} ${n}L${50-s*.85} ${o+12}L50 ${o}L${50+s*.85} ${o+12}L${50+s} ${n}Z`,it,.16),q(a,`M50 ${n-4}L50 ${o+14}`,1.1,fe,.45),q(a,`M${50-s*.5} ${n-6}L${50-s*.42} ${o+16}`,1.4,Ze,.85);const r=Math.floor(t()*3);r===0?E(a,`M33 ${n}h34v6h-34z`,a.trim,.25):r===1?E(a,`M30 ${n-3}q20 14 40 0l-2 7q-18 8 -36 0z`,a.trim,.25):E(a,`M30 ${n-6}l8 6h24l8 -6l-3 11h-34z`,a.trim,.25);const i=e?22:16;E(a,`M46.5 ${n+6}h7v${i}h-7z`,Je,.2);for(let c=n+9;c<n+6+i;c+=4)q(a,`M46.5 ${c}l7 2`,1);const l=n+6+i+4;t()<.5?ie(a,50,l,4.5,a.trim):E(a,`M50 ${l-6}l5 6l-5 6l-5 -6z`,a.trim,.2),a.rarity!=="common"&&a.rarity!=="magic"&&ea(a,50,n+3,3.5)}function iu(a){const e=a.r,t=5+e()*2;E(a,`M${50-t} 60L${50-t*.6} 30Q50 14 ${50+t*.6} 30L${50+t} 60Z`,it,.16),q(a,"M50 58L50 30",1.1,fe,.45),q(a,`M${50-t*.4} 56L${50-t*.3} 32`,1.3,Ze,.85),e()<.5?E(a,"M37 60h26v5h-26z",a.trim,.2):E(a,"M36 57q14 10 28 0l-2 7q-12 6 -24 0z",a.trim,.2),E(a,"M47 65h6v16h-6z",Je,.2),q(a,"M47 69l6 2M47 74l6 2M47 79l6 2",1),ie(a,50,85,4,a.trim),a.rarity!=="common"&&ea(a,50,62.5,3)}function Ei(a,e){const t=a.r,s=e?10:22;E(a,`M47 ${s}h6v${90-s}h-6z`,yt,.25);for(let n=74;n<88;n+=4)q(a,`M47 ${n}l6 2`,1);const o=e?2:Math.floor(t()*2);o===0?(E(a,"M52 24q20 -8 26 6q-1 14 -7 24q-9 -7 -19 -9z",it,.18),q(a,"M72 28q4 11 -1 21",1.3,Ze,.85)):o===1?(E(a,"M52 22q18 -10 28 6q3 12 -4 24q-7 -9 -24 -11z",it,.18),q(a,"M76 30q2 9 -2 17",1.3,Ze,.85)):(E(a,"M53 14q22 -8 28 8q2 14 -6 26q-8 -8 -22 -10zM47 14q-22 -8 -28 8q-2 14 6 26q8 -8 22 -10z",it,.18),q(a,"M76 20q4 10 -1 20M24 20q-4 10 1 20",1.3,Ze,.85)),E(a,`M45.5 ${s-2}h9v9h-9z`,a.trim,.2),Es(a.rarity)&&ea(a,50,s+3,3)}function lu(a){const e=a.r;E(a,"M47 34h6v56h-6z",yt,.25),q(a,"M47 76l6 2M47 80l6 2M47 84l6 2",1);const t=Math.floor(e()*3);if(t===0){let s="";for(let o=0;o<8;o++){const n=o/8*Math.PI*2,r=n+Math.PI/8;s+=`${o?"L":"M"}${50+Math.cos(n)*18} ${24+Math.sin(n)*18}L${50+Math.cos(r)*9} ${24+Math.sin(r)*9}`}E(a,s+"Z",it,.18)}else if(t===1){for(let s=0;s<8;s++){const o=s/8*Math.PI*2;E(a,`M${50+Math.cos(o-.28)*11} ${24+Math.sin(o-.28)*11}L${50+Math.cos(o)*20} ${24+Math.sin(o)*20}L${50+Math.cos(o+.28)*11} ${24+Math.sin(o+.28)*11}Z`,it,.1,1.4)}ie(a,50,24,12,ks)}else{ie(a,50,24,14,ks);for(let s=0;s<6;s++){const o=s/6*Math.PI*2;ie(a,50+Math.cos(o)*8.5,24+Math.sin(o)*8.5,2.2,a.trim,0,1.2)}q(a,"M42 16q4 -4 9 -4",1.3,Ze,.8)}E(a,"M44.5 34h11v5h-11z",a.trim,.2)}function bc(a){const e=a.r;E(a,"M48 26h5l-1 68h-3z",yt,.25),q(a,"M50.5 40q1 20 0 50",1,fe,.3),E(a,"M46.5 36h8v7h-8z",a.cloth,.2),q(a,"M48 43q-4 8 -2 14M53 43q3 6 2 12",1.4,a.cloth.base);const t=Math.floor(e()*3);if(t===0)q(a,"M44 28q-7 -10 2 -17M57 28q7 -10 -2 -17",4.4),q(a,"M44 28q-7 -10 2 -17M57 28q7 -10 -2 -17",2.4,yt.base),ie(a,50.5,16,7.5,a.gem,.1),q(a,"M47 13q3 -2 6 0",1.3,Ze,.9);else if(t===1)E(a,"M50.5 2l8 14l-8 12l-8 -12z",a.gem,.1),q(a,"M50.5 4v22M43.5 16h14",.9,fe,.35),E(a,"M44.5 26h12l-2 5h-8z",a.trim,.2);else{const s="M51 28q14 -4 10 -16q-4 -10 -14 -6q-8 4 -2 10q4 3 6 -1";q(a,s,5),q(a,s,2.8,yt.base),ie(a,52,13,3.6,a.gem,0,1.4)}}function cu(a){const e=a.r;if(E(a,"M48 36h4l-0.5 54h-3z",yt,.25),E(a,"M47 74h6v14h-6z",Je,.2),q(a,"M47 78l6 2M47 83l6 2",1),e()<.5){let t="";for(let s=0;s<10;s++){const o=-Math.PI/2+s/10*Math.PI*2,n=s%2?6:14;t+=`${s?"L":"M"}${50+Math.cos(o)*n} ${24+Math.sin(o)*n}`}E(a,t+"Z",a.gem,.1)}else E(a,"M50 9l7 14l-7 13l-7 -13z",a.gem,.1),E(a,"M45 34h10l-2 4h-6z",a.trim,.2);for(let t=0;t<3;t++){const s=e()*Math.PI*2;ie(a,50+Math.cos(s)*20,24+Math.sin(s)*18,1.6,a.gem,0,.8)}}function xc(a){const e=a.r,t=70+e()*10,s=20+t/2,o=`M40 8Q${t} 50 40 92`;q(a,"M40 8L40 92",1.3,fe,.9),q(a,o,9.6),q(a,o,6.4,yt.base),q(a,o,2,$o(yt),.9),q(a,"M40 8q6 -5 12 -4M40 92q6 5 12 4",4.4),q(a,"M40 8q6 -5 12 -4M40 92q6 5 12 4",2,yt.deep),E(a,`M${s-5} 42h10v16h-10z`,Je,.25),q(a,`M${s-5} 46l10 2M${s-5} 51l10 2M${s-5} 56l10 2`,1),a.rarity!=="common"&&q(a,"M47 22q4 6 6 12M47 78q4 -6 6 -12",1.8,a.trim.base),Es(a.rarity)&&ea(a,s,50,3.5)}function wc(a,e=Math.floor(a.r()*3),t=Math.floor(a.r()*5)){const s=e===0?"M22 16h56v28q0 30 -28 44q-28 -14 -28 -44z":e===1?"M50 12a38 38 0 1 0 0.01 0z":"M50 8l28 18q0 40 -28 66q-28 -26 -28 -66z";E(a,s,a.cloth,.22,2.4),Me(a,Dn(.88),()=>q(a,s,4.5,a.trim.base)),Me(a,Dn(.8),()=>q(a,s,1,fe,.5));const o=Ua($o(a.trim));if(t===0)E(a,"M32 54l18 -14l18 14l-4 6l-14 -10l-14 10z",o,.15,1.4);else if(t===1)E(a,"M46 26h8v18h16v8h-16v22h-8v-22h-16v-8h16z",o,.15,1.4);else if(t===2){ie(a,50,48,9,o,.1,1.6);for(let n=0;n<8;n++){const r=n/8*Math.PI*2;q(a,`M${50+Math.cos(r)*12} ${48+Math.sin(r)*12}L${50+Math.cos(r)*18} ${48+Math.sin(r)*18}`,2.2)}}else t===3?E(a,"M50 30l5 12l13 1l-10 8l3 13l-11 -7l-11 7l3 -13l-10 -8l13 -1z",o,.15,1.4):(E(a,"M50 26q16 14 9 30q-3 8 -9 10q-6 -2 -9 -10q-7 -16 9 -30z",dr,.12,1.4),E(a,"M50 42q7 7 3 14q-1 4 -3 5q-2 -1 -3 -5q-4 -7 3 -14z",gc,0,1.1));e===1&&ie(a,50,50,5,it,0,1.6)}function du(a){const e="M40 74q-18 -16 -10 -42q2 -6 6 -8M60 74q18 -16 10 -42q-2 -6 -6 -8";q(a,e,5.4),q(a,e,3,a.trim.base),E(a,"M36 74q14 -10 28 0l-4 14h-20z",a.trim,.25),ie(a,50,47,16,a.gem,.1),q(a,"M42 41q7 -9 16 -2",1.7,Ze,.85),q(a,"M39 54q11 8 22 0",1,fe,.35);for(let t=0;t<4;t++){const s=-Math.PI/2+(t-1.5)*.6;q(a,`M${50+Math.cos(s)*20} ${47+Math.sin(s)*20}l${Math.cos(s)*5} ${Math.sin(s)*5}`,1.6,a.gem.base,.8)}}function hu(a){const e=a.r;for(let t=0;t<4;t++){const s=42+t*6+e()*2;q(a,`M${s} 30L${s-3} 10`,1.8,yt.deep),E(a,`M${s-3} 10l-4 -3l1 9zM${s-3} 10l4 -3l-1 9z`,t%2?a.cloth:vc,.1,1)}E(a,"M36 28h30l-4 62h-22z",Je,.25,2.2),E(a,"M35 25h32v7h-32z",a.trim,.2),q(a,"M40 46h22M41 72h19",1.4,fe,.55),q(a,"M66 32q16 22 -2 56",2.6,Je.deep),a.rarity!=="common"&&ie(a,51,59,4,a.trim,0,1.4)}function uu(a){const e=a.r,t=a.rarity==="common"?0:a.rarity==="magic"?e()<.5?0:1:e()<.3?1:2;if(t===0){E(a,"M24 78q-4 -46 26 -60q30 14 26 60l-11 4q-2 -28 -15 -32q-13 4 -15 32z",a.cloth,.25,2.2),q(a,"M50 18q-6 20 0 32",1.2,fe,.4),E(a,"M28 76q22 12 44 0l-2 9q-20 9 -40 0z",a.cloth,.35),q(a,"M36 30q-6 14 -6 30",1.2,Ze,.5);return}if(t===1){E(a,"M24 62q0 -40 26 -42q26 2 26 42z",Je,.25,2.2),E(a,"M20 60h60v8h-60z",Je,.35),q(a,"M50 20v40M36 26q-4 14 -4 34M64 26q4 14 4 34",1.2,fe,.5),ie(a,50,40,4,a.trim,0,1.4);return}E(a,"M24 68q-2 -46 26 -50q28 4 26 50l-8 12h-36z",it,.16,2.2),E(a,"M47 40h6v36h-6z",ks,.2),E(a,"M27 46h46v6h-46z",a.trim,.2),q(a,"M34 59h10M56 59h10",3.4),q(a,"M34 26q-6 10 -6 22",1.3,Ze,.8),Es(a.rarity)&&(E(a,"M30 24l6 -14l6 10l8 -14l8 14l6 -10l6 14q-20 -6 -40 0z",a.trim,.2),ea(a,50,32,4))}function Li(a,e){const t=a.r;if(e){E(a,"M36 12q14 8 28 0l14 14l-6 10l-4 -4v60h-36v-60l-4 4l-6 -10z",a.cloth,.25,2.2),E(a,"M42 12q8 14 16 0l-4 22h-8z",Ua(a.cloth.deep),.3),E(a,"M32 52h36v7h-36z",a.trim,.2),q(a,"M50 59v33",1.4,fe,.5),q(a,"M34 90h32",2.6,a.trim.base),q(a,"M40 66q-2 12 0 22M60 66q2 12 0 22",1,fe,.35);return}const s=Math.floor(t()*3);if(E(a,"M34 14l8 -4q8 6 16 0l8 4l14 12l-6 14l-6 -4v52h-40v-52l-6 4l-6 -14z",s===2?it:Je,.25,2.2),E(a,"M42 10q8 10 16 0l-2 8q-6 6 -12 0z",a.cloth,.2,1.4),s===0)for(let o=26;o<66;o+=8)q(a,`M46 ${o}l8 4M54 ${o}l-8 4`,1.4);else if(s===1)for(let o=30;o<68;o+=10)for(let n=36;n<66;n+=8)ie(a,n,o,1.6,a.trim,0,1);else for(let o=30;o<68;o+=9)q(a,`M30 ${o}q20 4 40 0`,1.2,fe,.6);E(a,"M28 70h44v7h-44z",Je,.3),E(a,"M46.5 69h7v9h-7z",a.trim,.1,1.2),q(a,"M32 20q-4 4 -8 10",1.2,Ze,.6)}function fu(a){const e=a.rarity!=="common"&&a.r()<.5;E(a,"M32 88v-30l-4 -16q0 -6 5 -4l5 14v-30q1 -6 6 -5l2 26v-30q2 -5 6 -4l1 30l2 -26q3 -5 6 -3l-1 28l4 -18q4 -4 6 1l-4 28l-4 14v25z",e?it:Je,.25,2.2),E(a,"M29 72h36v18h-36z",a.cloth,.25),q(a,"M29 81h36",1,fe,.5),e&&q(a,"M38 50l18 2M37 58l20 1",1.4,fe,.6),a.rarity!=="common"&&ie(a,47,81,3,a.trim,0,1.2)}function pu(a){E(a,"M30 16h40l4 76h-16l-8 -52l-8 52h-16z",a.cloth,.25,2.2),E(a,"M29 13h42v9h-42z",Je,.3),E(a,"M46 13h8v9h-8z",a.trim,.1,1.2),q(a,"M40 26l-4 60M60 26l4 60",1,fe,.3),a.rarity!=="common"&&E(a,"M30 52h14v11h-14zM56 52h14v11h-14z",it,.16,1.4)}function mu(a){const e=a.r;E(a,"M34 10h22v52l20 12q4 4 0 10h-46l-2 -10z",Je,.25,2.2),E(a,"M28 84h50v6h-50z",ks,.2),E(a,"M32 9h26v12h-26z",e()<.5?a.cloth:Je,.3),q(a,"M36 40h18M36 50h18",2.2,a.trim.deep),ie(a,52,40,2,a.trim,0,1),ie(a,52,50,2,a.trim,0,1),q(a,"M38 24q-2 16 0 34",1.2,Ze,.55)}function gu(a){const e=a.r;q(a,"M20 8Q50 70 80 8",2.8),q(a,"M20 8Q50 70 80 8",1.4,$o(a.trim));const t=Math.floor(e()*3);t===0?(E(a,"M50 38q15 18 0 46q-15 -28 0 -46z",a.trim,.2),ea(a,50,62,7)):t===1?(ie(a,50,62,16,a.trim),ie(a,50,62,9,a.gem,.1,1.6),q(a,"M45 57q3 -3 7 -2",1.2,Ze,.9)):(E(a,"M50 40l15 22l-15 22l-15 -22z",a.trim,.2),ea(a,50,62,7)),ie(a,50,39,2.6,a.trim,0,1.2)}function vu(a){const e=ur(50,62,24,16);q(a,e,11),q(a,e,7,a.trim.base),q(a,e,2,$o(a.trim),.9),E(a,"M39 48h22l-3 -9h-16z",a.trim,.2),ea(a,50,35,9)}function kc(a){E(a,"M16 40h44q6 0 8 4v12q-2 4 -8 4h-44q-4 0 -4 -4v-12q0 -4 4 -4z",Pi,.35),E(a,"M20 37h24q3 0 3 3v20q0 3 -3 3h-24q-3 0 -3 -3v-20q0 -3 3 -3z",nu,.25),q(a,"M22 50h20",2.2,Yt.base,.95);for(const e of[51,56,61])q(a,`M${e} 41v18`,1.2,fe,.7);E(a,"M67 43h11v14h-11z",Pi,.3),ie(a,80,50,6,Yt,.1,1.6),ie(a,80,50,2.6,yc,0,.8)}function yu(a,e,t,s){ie(a,e,t,s,Ai,.1,1.8),E(a,ur(e,t,s*.86),Yt,0,.9),ie(a,e,t,s*.8,Ai,0,.6);const o=Array.from({length:6},(n,r)=>{const i=Math.PI/6+r*Math.PI/3;return`${(e+Math.cos(i)*s*.52).toFixed(2)} ${(t+Math.sin(i)*s*.52).toFixed(2)}`});q(a,`M${o.join("L")}Z`,1.8,Yt.base,.95),ie(a,e,t,s*.24,yc,0,.9)}const Gs=Dn(1.1),qi={sword:a=>Me(a,$e(38).multiply(Mt(0,-2)).multiply(Gs),()=>In(a,!1)),greatsword:a=>Me(a,$e(38).multiply(Mt(0,-3)).multiply(new DOMMatrix().scale(1,.95)),()=>In(a,!0)),dagger:a=>Me(a,$e(38).multiply(Gs),()=>iu(a)),axe:a=>Me(a,$e(32),()=>Ei(a,!1)),greataxe:a=>Me(a,$e(32),()=>Ei(a,!0)),mace:a=>Me(a,$e(32).multiply(Gs),()=>lu(a)),staff:a=>Me(a,$e(30),()=>bc(a)),wand:a=>Me(a,$e(34).multiply(Gs),()=>cu(a)),bow:a=>Me(a,$e(30).multiply(Mt(2,0)),()=>xc(a)),cannon:a=>Me(a,$e(-28).multiply(Mt(4,0)),()=>kc(a)),quiver:a=>Me(a,$e(14),()=>hu(a)),shield:a=>wc(a),chest:a=>Li(a,!1),robe:a=>Li(a,!0),ring:vu,focus:du,helm:uu,gloves:fu,legs:pu,boots:mu,amulet:gu};function bu(a){const e=ve[a];return e?e.slot==="chest"?e.id==="robe"?"robe":"chest":e.slot==="weapon"||e.slot==="offhand"?e.type??"sword":e.slot:"ring"}let Ea=null;const Ys=new Map;function xu(a){const e=Ys.get(a);if(e)return e;if(!Ea){const s=document.createElementNS("http://www.w3.org/2000/svg","svg");s.setAttribute("aria-hidden","true"),s.style.cssText="position:absolute;width:0;height:0;overflow:hidden;visibility:hidden;pointer-events:none",Ea=document.createElementNS("http://www.w3.org/2000/svg","path"),s.appendChild(Ea),document.body.appendChild(s)}const t=[];for(const s of a.split(/(?=M)/)){const o=s.trim();if(!o)continue;Ea.setAttribute("d",o);const n=Ea.getTotalLength(),r=Math.max(6,Math.min(260,Math.ceil(n/1.1))),i=[];for(let l=0;l<=r;l++){const c=Ea.getPointAtLength(n*l/r);i.push({x:c.x,y:c.y})}t.push({pts:i,closed:/z\s*$/i.test(o)})}return Ys.size>4e3&&Ys.clear(),Ys.set(a,t),t}function Ri(a){const e=Array.from({length:64},()=>a()*2-1);return t=>{const s=Math.floor(t),o=t-s,n=o*o*(3-2*o),r=e[(s%64+64)%64],i=e[((s+1)%64+64)%64];return r+(i-r)*n}}function hs(a,e,t,s,o,n,r,i){const l=e.length;if(l<2)return;const c=Ri(i),d=Ri(i),p=[];for(let u=0;u<l;u++){const m=e[Math.max(0,u-1)],g=e[Math.min(l-1,u+1)],v=g.x-m.x,x=g.y-m.y,b=Math.hypot(v,x)||1,y=r*c(u*.09);p.push({x:e[u].x-x/b*y,y:e[u].y+v/b*y})}if(t){const u=Math.min(l-1,2+Math.floor(i()*4));for(let m=1;m<=u;m++)p.push({x:p[m].x+(i()-.5)*r,y:p[m].y+(i()-.5)*r})}a.strokeStyle=o,a.lineCap="round",a.lineJoin="round";const f=6;for(let u=0;u<p.length-1;u+=f){a.globalAlpha=n*(.84+.16*d(u*.05+7)),a.lineWidth=s*(.74+.4*(d(u*.04)*.5+.5)),a.beginPath(),a.moveTo(p[u].x,p[u].y);for(let m=u+1;m<=Math.min(p.length-1,u+f);m++)a.lineTo(p[m].x,p[m].y);a.stroke()}}function Fn(a,e,t,s,o,n,r,i,l,c){const d=Math.cos(s),p=Math.sin(s),f=-p,u=d,m=(e.x0+e.x1)/2,g=(e.y0+e.y1)/2,v=Math.hypot(e.x1-e.x0,e.y1-e.y0)/2+t,x=[new Path2D,new Path2D,new Path2D],b=t*2.4;for(let y=-v;y<=v;y+=t){if(c()>o)continue;const k=y+(c()-.5)*t*.6,M=m+f*k,z=g+u*k,P=x[Math.floor(c()*3)];let $=-v-c()*t*2,N=!1;for(;$<v;){const B=$+b*(.7+c()*.6),G=($+B)/2;n(M+d*G,z+p*G)>c()?(N||P.moveTo(M+d*$,z+p*$),P.lineTo(M+d*B+(c()-.5)*t*.18,z+p*B+(c()-.5)*t*.18),N=!0):N=!1,$=B}}a.strokeStyle=r,a.lineCap="round",x.forEach((y,k)=>{a.globalAlpha=i*(.6+k*.2),a.lineWidth=l*(.8+k*.22),a.stroke(y)})}function wu(a){const e={x0:1e9,y0:1e9,x1:-1e9,y1:-1e9};for(const t of a)for(const s of t.pts)e.x0=Math.min(e.x0,s.x),e.y0=Math.min(e.y0,s.y),e.x1=Math.max(e.x1,s.x),e.y1=Math.max(e.y1,s.y);return e}function ku(a,e,t,s,o){const n=new Path2D;n.addPath(new Path2D(e.d),e.m),a.save(),a.translate(s.mis,s.mis*.8),a.clip(n),a.globalAlpha=.2,a.fillStyle=e.mat.base,a.fill(n),Fn(a,t,s.gap,Hn,.96,()=>.93,e.mat.base,.92,s.lw,o);const r=(t.x0+t.x1)/2,i=(t.y0+t.y1)/2,l=((t.x1-t.x0)*Ks.x+(t.y1-t.y0)*Ks.y)/2||1,c=.45+e.shade;Fn(a,t,s.gap*1.12,Hn+.16,.92,(d,p)=>pc(-.2,.5,((d-r)*Ks.x+(p-i)*Ks.y)/l)*c,e.mat.deep,.8,s.lw,o),a.restore()}function $i(a,e,t=10){return Array.from({length:t+1},(s,o)=>({x:a.x+(e.x-a.x)*o/t,y:a.y+(e.y-a.y)*o/t}))}function Mu(a,e,t,s,o,n){a.globalAlpha=1,a.fillStyle=uc,a.fillRect(0,0,e,t);const r={common:0,magic:.55,rare:.7,legendary:.9,unique:.9}[s.rarity],i=e/2,l=t*.47,c=Math.min(e,t)*.48;if(r){for(let d=0;d<5;d++){const p=i+(n()-.5)*c*.25,f=l+(n()-.5)*c*.25,u=c*(.7+n()*.35),m=a.createRadialGradient(p,f,0,p,f,u);m.addColorStop(0,Ci(s.rc,.13*r)),m.addColorStop(1,Ci(s.rc,0)),a.globalAlpha=1,a.fillStyle=m,a.fillRect(0,0,e,t)}Fn(a,{x0:0,y0:0,x1:e,y1:t},o.gap*1.1,Hn,1,(d,p)=>r*pc(c*.95,c*.2,Math.hypot(d-i,p-l)),s.rc,.34,o.lw*1.15,n)}if(Es(s.rarity))for(let d=0;d<10;d++){const p=d/10*Math.PI*2+.3+n()*.12,f=c*.72,u=c*(d%2?.86:.96);hs(a,$i({x:i+Math.cos(p)*f,y:l+Math.sin(p)*f},{x:i+Math.cos(p)*u,y:l+Math.sin(p)*u}),!1,o.pen*.6,s.rc,.45,o.wob,n)}for(let d=0;d<4;d++){const p=t-12+d*1.3,f=e*(.22-d*.04)*(.85+n()*.3);hs(a,$i({x:i-f,y:p},{x:i+f,y:p+(n()-.5)}),!1,o.lw*1.2,fe,.16,o.wob,n)}}function _u(a,e,t,s){const o=Math.floor(e*t/28);a.fillStyle=fe;for(let n=0;n<o;n++){a.globalAlpha=.02+s()*.05;const r=.3+s()*.5;a.fillRect(s()*e,s()*t,r,r*(.5+s()))}a.fillStyle=uc;for(let n=0;n<o*.6;n++){a.globalAlpha=.2+s()*.35;const r=.25+s()*.45;a.fillRect(s()*e,s()*t,r,r)}a.globalAlpha=1}function zu(a){const e=Math.min(2.8,Math.max(1.25,a*1.6));return{gap:e/a,lw:e*.62/a,pen:Math.min(2.6,Math.max(.95,a*1.4))/a,wob:.55,mis:.45,minW:.75/a}}function Mc(a,e,t,s,o,n){const r=document.createElement("canvas");r.width=e,r.height=t;const i=r.getContext("2d");if(!i)return r;const l=e/s;i.setTransform(l,0,0,l,0,0);const c=zu(l),d=zo(n^2654435769);Mu(i,s,o,a,c,d);for(const p of a.prims){const f=xu(p.d).map(u=>({closed:u.closed,pts:u.pts.map(m=>{const g=p.m.transformPoint(new DOMPoint(m.x,m.y));return{x:g.x,y:g.y}})}));if(p.t==="shape"){ku(i,p,wu(f),c,d);for(const u of f)hs(i,u.pts,u.closed,c.pen*p.pen/2,fe,1,c.wob,d);if(d()<.4)for(const u of f)hs(i,u.pts,u.closed,c.pen*p.pen*.22,fe,.32,c.wob*1.8,d)}else{const u=zo(ws(p.d)^n);for(const m of f)hs(i,m.pts,!1,Math.max(p.w,c.minW),p.color,p.alpha,c.wob*.8,u)}}return _u(i,s,o,d),r}function _c(a,e,t,s,o,n){return{r:a,rarity:e,rc:t,cloth:s,trim:o,gem:n,prims:[],stack:[new DOMMatrix]}}const Vs=new Map;function zc(a,e){const t=Vs.get(a);if(t)return t;const s=e();return Vs.size>300&&Vs.clear(),Vs.set(a,s),s}function Sc(a,e,t){return zc(`${a.uid}|${a.base}|${a.rarity}|${e}|${t}`,()=>{const s=zo(ws(a.uid+a.base)),o=ya[e][a.rarity],n=Ua(a.rarity==="unique"?"#7a3e6e":tu(s,ru)),r=Es(a.rarity)?mc:a.rarity==="rare"?au:ks,i=_c(s,a.rarity,o,n,r,Ua(a.rarity==="common"?"#b9c1cc":o));return(qi[bu(a.base)]??qi.ring)(i),Mc(i,t,t,100,100,ws(a.uid))})}function Hi(a,e,t,s){Me(a,Mt(e,t).multiply(new DOMMatrix().scale(s)),()=>{E(a,"M0 -26q16 12 11 26q-3 8 -11 10q-8 -2 -11 -10q-5 -14 11 -26z",dr,.12,1.6),E(a,"M0 -10q7 7 4 13q-1 4 -4 5q-3 -1 -4 -5q-3 -6 4 -13z",gc,0,1.2)})}const Su={warden:a=>{Me(a,Mt(20,-2).multiply($e(-32)),()=>In(a,!1)),Me(a,Mt(10,18).multiply(new DOMMatrix().scale(.72)),()=>wc(a,0,4)),Hi(a,100,76,.7)},emberwright:a=>{Me(a,Mt(6,2).multiply($e(-14)),()=>bc(a));for(let e=0;e<7;e++){const t=e/7*Math.PI*2+.4,s=78+Math.cos(t)*22,o=44+Math.sin(t)*26;e%2?E(a,`M${s} ${o-5}l3.4 5l-3.4 5l-3.4 -5z`,su,.1,1.2):ie(a,s,o,3.4,dr,0,1.4)}Hi(a,78,54,.62)},cyborg:a=>{q(a,"M86 46L119 38",7,Yt.base,.45),q(a,"M86 46L119 38",2.2,"#ffffff",.95),Me(a,Mt(-2,0).multiply($e(-14)),()=>kc(a)),yu(a,84,74,18);for(const[e,t]of[[30,22],[44,14],[104,22],[18,80]])E(a,`M${e} ${t-5}l3 5l-3 5l-3 -5z`,Yt,.05,1.1);q(a,"M10 30h10l6 -6h12",1.3,Yt.deep,.8),q(a,"M58 92h12l5 -5",1.3,Yt.deep,.8)},strider:a=>{Me(a,Mt(18,0).multiply($e(-6)),()=>xc(a)),q(a,"M28 50L104 50",2.2,yt.deep),E(a,"M104 50l-9 -5v10z",it,.1,1.4),E(a,"M28 50l-7 -5l3 5l-3 5z",vc,.1,1.2),E(a,"M90 84q4 -14 18 -14q-2 14 -18 14z",ou,.2,1.4),q(a,"M90 84l12 -9",1,fe,.6)}};function Tu(a,e){return zc(`class|${a}|${e}`,()=>{const t=Fe[a].pencils,s=_c(zo(ws(a)),"legendary",cn(t[0]),Ua(cn(t[0])),mc,Ua(cn(t[1])));return Su[a](s),Mc(s,e,Math.round(e*100/120),120,100,ws(a))})}const ta=({svg:a,class:e})=>h("span",{class:`ico ${e??""}`,"aria-hidden":"true",dangerouslySetInnerHTML:{__html:a}}),Ho=a=>ya[K().settings.colorVision][a];function fr({paint:a,deps:e,class:t}){const s=St(null);return Vl(()=>{const o=s.current;if(!o)return;const n=Math.max(24,Math.round((o.clientWidth||64)*Math.min(3,window.devicePixelRatio||1))),r=a(n);o.width!==r.width&&(o.width=r.width),o.height!==r.height&&(o.height=r.height);const i=o.getContext("2d");i&&(i.clearRect(0,0,o.width,o.height),i.drawImage(r,0,0))},[e]),h("canvas",{ref:s,class:t,"aria-hidden":"true"})}function Ft(a){const e=St(null);return Qe(()=>{const t=e.current?.querySelector("[data-autofocus], .body button:not(:disabled), .body input, .body select");t&&K().input.lastDevice!=="mouse"&&t.focus({preventScroll:!0})},[]),h("section",{ref:e,class:`panel plate ${a.side??""} ${a.wide?"wide":""} p-${a.id}`,role:"dialog","aria-label":a.title,children:[h("header",{children:[h("h2",{children:a.title}),h("div",{class:"head-actions",children:[a.actions,h("button",{type:"button",class:"x","aria-label":`Close ${a.title}`,onClick:()=>wa(a.id),children:"×"})]})]}),h("div",{class:"body",children:a.children})]})}function Tc(a,e=!1){return{onPointerEnter:t=>{A.tip.value={rect:t.currentTarget.getBoundingClientRect(),render:a,wide:e}},onPointerLeave:()=>{A.tip.value=null},onFocus:t=>{A.tip.value={rect:t.currentTarget.getBoundingClientRect(),render:a,wide:e}},onBlur:()=>{A.tip.value=null}}}function Cu(){const a=A.tip.value,e=St(null),[t,s]=Ie({x:-9999,y:-9999});return Vl(()=>{if(!a||!e.current)return;const o=a.rect,n=e.current.getBoundingClientRect();let r=o.right+10,i=o.top;r+n.width>innerWidth-8&&(r=o.left-n.width-10),r<8&&(r=Math.max(8,Math.min(innerWidth-n.width-8,o.left))),(r===o.left||r<o.left&&r+n.width>o.left)&&(i=o.bottom+8),i+n.height>innerHeight-8&&(i=Math.max(8,innerHeight-n.height-8)),s({x:r,y:i})},[a]),a?h("div",{ref:e,class:`tooltip plate ${a.wide?"wide":""}`,role:"tooltip",style:{left:`${t.x}px`,top:`${t.y}px`},children:a.render()}):null}function Cc({item:a,compare:e=!0,worn:t=!1}){const s=K(),o=s.player.char,n=ve[a.base],r=El(a),i=Ll(a),l=rd(a),c=id(a),d=Rl(Fe[o.classId],a,o.level),p=s.controls.showLabels||s.input.held("AltLeft"),f=e&&!t?Vd(o,a):null,u=e&&!t&&d.ok?Zh(o,a):[],m=a.unique?wl[a.unique]:null;return h("div",{class:"itip",style:{"--rc":Ho(a.rarity)},children:[h("div",{class:"itip-head",children:[h(fr,{class:"itip-art",deps:`${a.uid}|${a.rarity}|${s.settings.colorVision}`,paint:g=>Sc(a,s.settings.colorVision,g)}),h("div",{children:[h("div",{class:"itip-name",children:gt(a)}),h("div",{class:"itip-type",children:[zs[a.rarity].name," ",_n(a),n?.hands===2?" · two-handed":""]}),h("div",{class:"itip-power",children:["Item power ",Ba(a)]})]})]}),r&&h("div",{class:"itip-main",children:[h("b",{children:[r.min,"–",r.max]})," damage per hit · ",r.speed.toFixed(2)," attacks a second"]}),i>0&&h("div",{class:"itip-main",children:[h("b",{children:i})," armor"]}),l.length>0&&h("ul",{class:"itip-affixes",children:l.map(g=>h("li",{class:g.implicit?"implicit":g.greater?"greater":"",children:[g.text,p&&g.range?h("span",{class:"dim",children:[" [",g.range,"]"]}):null,g.greater?h("span",{class:"sr",children:" (a near-perfect roll)"}):null]}))}),c&&h("p",{class:"itip-legend",children:c}),m&&h("p",{class:"itip-flavor",children:["“",m.flavor,"”"]}),h("div",{class:"itip-foot",children:[h("span",{class:d.ok?"dim":"bad",children:d.ok?`Requires level ${Pl(a)}`:d.reason}),h("span",{class:"coin",children:vs(a)})]}),a.junk&&h("div",{class:"bad",children:"Marked as junk"}),u.length>0&&h("div",{class:"itip-compare",children:[h("div",{class:"label",children:f?`Compared with ${gt(f)}`:"If worn"}),h("ul",{children:u.map(g=>h("li",{class:g.after>g.before===g.better?"good":"bad",children:[Qh(g)," ",g.label]}))})]}),!p&&l.some(g=>g.range)&&h("div",{class:"dim small",children:"Hold Alt to see the ranges each line can roll."})]})}function Nn(a){const{item:e}=a,t=Tc(()=>e?h(Cc,{item:e,worn:a.worn}):h("span",{children:a.empty??"Empty"}),!0);return e?h("button",{type:"button",class:`cell r-${e.rarity} ${a.selected?"sel":""} ${a.worn?"worn":""} ${e.junk?"junk":""} ${a.dim?"dim":""}`,style:{"--rc":Ho(e.rarity)},"aria-label":`${a.label?a.label+": ":""}${gt(e)}, ${zs[e.rarity].name}, item power ${Ba(e)}`,"aria-pressed":a.selected,"data-index":a.index,onClick:a.onClick,onDblClick:a.onUse,onContextMenu:s=>{s.preventDefault(),a.onUse?.()},...t,children:[h(fr,{class:"art",deps:`${e.uid}|${e.rarity}|${K().settings.colorVision}`,paint:s=>Sc(e,K().settings.colorVision,s)}),e.fresh&&h("span",{class:"new","aria-hidden":"true",children:"✦"})]}):h("button",{type:"button",class:`cell empty ${a.selected?"sel":""}`,"aria-label":a.label?`${a.label}: empty`:"Empty",onClick:a.onClick,"data-index":a.index,children:a.empty&&h(ta,{svg:Jt(a.empty,"#e8e2d4"),class:"ghost"})})}function Pe({label:a,hint:e,value:t,onChange:s}){return h("label",{class:"setting toggle",children:[h("span",{children:[h("strong",{children:a}),e&&h("small",{children:e})]}),h("input",{type:"checkbox",role:"switch",checked:t,onChange:o=>s(o.currentTarget.checked)}),h("i",{"aria-hidden":"true"})]})}function qe({label:a,hint:e,value:t,min:s,max:o,step:n,onChange:r,fmt:i}){const l=i?i(t):`${Math.round(t*100)}%`;return h("label",{class:"setting slider",children:[h("span",{children:[h("strong",{children:a}),e&&h("small",{children:e})]}),h("input",{type:"range",min:s,max:o,step:n,value:t,"aria-valuetext":l,onInput:c=>r(+c.currentTarget.value)}),h("output",{children:l})]})}function pt({label:a,hint:e,value:t,options:s,onChange:o}){return h("div",{class:"setting choice",role:"radiogroup","aria-label":a,children:[h("span",{children:[h("strong",{children:a}),e&&h("small",{children:e})]}),h("div",{class:"chips",children:s.map(([n,r])=>h("button",{type:"button",role:"radio","aria-checked":n===t,class:`chip ${n===t?"on":""}`,onClick:()=>o(n),children:r}))})]})}function Pu({tabs:a,value:e,onChange:t,label:s}){return h("div",{class:"tabs",role:"tablist","aria-label":s,children:a.map(([o,n])=>h("button",{type:"button",role:"tab","aria-selected":o===e,class:`tab ${o===e?"on":""}`,onClick:()=>t(o),onKeyDown:r=>{const i=a.findIndex(([l])=>l===e);(r.key==="ArrowDown"||r.key==="ArrowRight")&&(r.preventDefault(),t(a[(i+1)%a.length][0])),(r.key==="ArrowUp"||r.key==="ArrowLeft")&&(r.preventDefault(),t(a[(i-1+a.length)%a.length][0]))},children:n}))})}function Au(){const a=A.confirm.value,e=St(null);return Qe(()=>{e.current?.focus()},[a]),a?h("div",{class:"scrim",onClick:t=>{t.target===t.currentTarget&&(A.confirm.value=null)},children:h("section",{class:"confirm plate",role:"alertdialog","aria-modal":"true","aria-label":a.title,children:[h("h2",{children:a.title}),h("p",{children:a.body}),h("div",{class:"pair",children:[h("button",{type:"button",class:"btn",onClick:()=>A.confirm.value=null,children:a.no??"Cancel"}),h("button",{ref:e,type:"button",class:`btn ${a.danger?"danger":"primary"}`,onClick:()=>{A.confirm.value=null,a.onYes()},children:a.yes})]})]})}):null}const ua=(a,e,t,s,o=!1)=>{A.confirm.value={title:a,body:e,yes:t,onYes:s,danger:o}};function Eu(a){const e=K(),t=e.player.char,s=e.touch,o=e.input.lastDevice==="pad",n=Qt(t.bar[0]??"")?.name??"your first skill",r=Qt(t.bar[1]??"")?.name??"your second skill",i=ut;switch(a){case"walk":return s?"Push the stick to walk to the ring, or tap the ground there.":o?"Push the left stick to walk to the ring.":"Click the ground to walk to the ring. W A S D walk too.";case"look":return s?"Drag the picture to turn the view. Pinch to zoom.":o?"Push the right stick to turn the view.":"Hold the right mouse button and drag to turn the view. The wheel zooms.";case"fight":return s?`Tap the big button to attack the Sproutling with ${n}.`:o?`Press ${i("interact")} to attack the Sproutling with ${n}.`:`Click the Sproutling to attack it with ${n}.`;case"skill":return s?`Tap the ringed button: ${r}.`:`Press ${i("slot2")} for ${r}.`;case"bounty":return s?"Tap the warden and take a bounty from their board.":"Click the warden and take a bounty from their board.";case"tip:dodge":return`Hatching on the ground means a blow is coming there. Step out of it, or press ${s?"the Evade button":i("evade")} to roll through.`;case"tip:tonic":return s?"Low on health: tap the red flask.":`Low on health: press ${i("potion")} to drink a tonic.`;case"tip:points":return s?"A skill point to spend: open the skill tree.":`A skill point to spend: press ${i("skills")} for the skill tree.`;case"tip:loot":return s?"You found gear: open your inventory to wear it.":`You found gear: press ${i("inventory")} to compare it and wear it.`;default:return""}}const Di={fight:[null,".slot.act"],skill:[".slot.s1",".slot.s0"],"tip:tonic":[".slot.d0",".slot.d0"],"tip:dodge":[".slot.d1",".slot.d1"],"tip:points":["#menu button:nth-child(3)","#menu button:nth-child(3)"],"tip:loot":["#menu button:nth-child(2)","#menu button:nth-child(2)"]};function Ii(){const a=K(),e=A.guide.value;return Qe(()=>{document.body.classList.toggle("guiding",!!e);const t=e&&Di[e.id]&&Di[e.id][a.touch?1:0],s=t?document.querySelector(t):null;return s?.setAttribute("data-hint","1"),()=>s?.removeAttribute("data-hint")},[e]),Qe(()=>a.bus.on("guide:done",t=>{t.quiet||(t.skipped?ae("First steps skipped. The menu has them."):Te("You know the way now","Esc opens the menu, and How to Play.",4))}),[]),e?h("section",{id:"guide",class:`plate ${e.tip?"tip":""}`,"aria-label":"What to try next",children:[h("div",{class:"words",children:[!e.tip&&h("div",{class:"label",children:["First steps · ",(e.index??0)+1," of ",e.total]}),h("p",{role:"status","aria-live":"polite",children:Eu(e.id)})]}),!e.tip&&h("button",{type:"button",class:"btn","aria-label":"Skip the first steps",onClick:()=>a.bus.emit("guide:skip"),children:"Skip"})]}):null}function Lu(){const a=K(),[e,t]=Ie(null);return Qe(()=>a.bus.on("frame",()=>{const s=A.guide.value,o=s&&(s.entity||s.at);if(!o){La.current&&t(La.current=null);return}const n=a.camera,r=a.renderer.size.cssW,i=a.renderer.size.cssH,l=n.project(o.x,o.y+(o.height||0)*.6,o.z);if(l&&l.x>.07&&l.x<.93&&l.y>.12&&l.y<.9){La.current&&t(La.current=null);return}let c,d;if(l)c=(l.x-.5)*r,d=(l.y-.5)*i;else{const m=a.player,g=o.x-m.x,v=o.z-m.z,x=n.fwd,b=Math.hypot(x[0],x[2])||1;c=g*n.right[0]+v*n.right[2],d=-(g*x[0]+v*x[2])/b}const p=Math.hypot(c,d)||1,f=Math.min((r/2-46)/Math.abs(c/p||1e-6),(i/2-46)/Math.abs(d/p||1e-6)),u=`translate(${(r/2+c/p*f).toFixed(1)}px, ${(i/2+d/p*f).toFixed(1)}px) translate(-50%, -50%) rotate(${Math.atan2(d,c).toFixed(3)}rad)`;u!==La.current&&t(La.current=u)}),[]),e?h("div",{id:"guide-arrow","aria-hidden":"true",style:{transform:e},children:h("svg",{viewBox:"0 0 44 44",children:[h("path",{d:"M6 22h26M22 10l12 12-12 12",fill:"none",stroke:"#f1ebdc","stroke-width":"9","stroke-linecap":"round","stroke-linejoin":"round"}),h("path",{d:"M6 22h26M22 10l12 12-12 12",fill:"none",stroke:"#d64634","stroke-width":"4.5","stroke-linecap":"round","stroke-linejoin":"round"})]})}):null}const La={current:null},qu=[[5,"Dawn"],[8,"Morning"],[12,"Midday"],[17,"Afternoon"],[20,"Dusk"],[24,"Night"]],Ru=["slot1","slot2","slot3","slot4","slot5","slot6"],ca=a=>`scaleX(${Math.max(0,Math.min(1,a)).toFixed(3)})`;function ut(a){const e=K();if(e.input.lastDevice==="pad")return fo(e.settings.pad[a]);const t=e.settings.keys[a][0];return t==="Mouse0"?"LMB":t==="Mouse2"?"RMB":t==="Mouse1"?"MMB":ns(t)}function $u(){const a=K(),e=a.player,t=e.char,s=e.build.cls.resource,o=t.level>=Zt?1:t.xp/mo(t.level),n=t.journey.boon,r=e.statuses.filter(i=>i.id!=="warded"||e.barrier>0);return h("section",{id:"status",class:"plate","aria-label":"Your hero",children:[h("div",{class:"badge",title:"Level",children:t.level}),h("div",{class:"bars",children:[h("div",{class:"who",children:[h("span",{id:"pname",children:t.name}),n&&h("span",{class:"boon",children:[qt[n.id]?.name," ",Math.floor(n.left/60),":",String(Math.max(0,Math.ceil(n.left)%60)).padStart(2,"0")]}),h("span",{class:"coin",title:"Glint",children:t.gold})]}),h("div",{class:"meter",children:[h(ta,{svg:Jt("heart","#d8584a")}),h("div",{class:`bar hp ${a.low?"low":""}`,role:"meter","aria-label":"Health","aria-valuemin":0,"aria-valuemax":e.maxHp,"aria-valuenow":Math.ceil(e.hp),children:[h("i",{style:{transform:ca(e.hp/e.maxHp)}}),e.barrier>0&&h("i",{class:"ward",style:{transform:ca(e.barrier/e.maxHp)}})]}),h("b",{children:[Math.ceil(e.hp)," / ",e.maxHp]})]}),h("div",{class:"meter",children:[h(ta,{svg:Jt("orb",s.color)}),h("div",{class:"bar res",style:{"--res":s.color},role:"meter","aria-label":s.name,"aria-valuemin":0,"aria-valuemax":e.build.derived.maxResource,"aria-valuenow":Math.floor(e.resource),children:h("i",{style:{transform:ca(e.resource/e.build.derived.maxResource)}})}),h("b",{children:[Math.floor(e.resource)," ",s.name]})]}),h("div",{class:"bar xp",role:"meter","aria-label":"Experience toward the next level","aria-valuemin":0,"aria-valuemax":100,"aria-valuenow":Math.round(o*100),children:h("i",{style:{transform:ca(o)}})}),r.length>0&&h("ul",{class:"buffs","aria-label":"Effects on you",children:r.map(i=>{const l=bs[i.id];return h("li",{class:l.kind,title:`${l.name}: ${l.desc}`,children:[h("span",{class:"nm",children:[l.name,i.stacks>1?` ×${i.stacks}`:""]}),h("span",{class:"t",style:{transform:ca(i.left/i.dur)}})]})})})]})]})}function Hu(){const a=K(),e=a.player,t=e.target&&e.target.kind==="monster"&&!e.target.dead?e.target:null,o=a.monsters.find(r=>r.boss&&!r.dead&&r.ai.provoked)??t;if(!o)return null;const n=o.affixes.map(r=>Po[r]?.name).filter(Boolean).join(" · ");return h("section",{id:"target",class:`plate ${o.boss?"boss":""}`,"aria-label":"Your target",children:[h("div",{class:"who",children:[h("span",{children:o.name}),h("span",{class:"dim",children:["Level ",o.level]})]}),n&&h("div",{class:"affixes",children:n}),h("div",{class:"bar hp",role:"meter","aria-label":`${o.name} health`,"aria-valuemin":0,"aria-valuemax":o.maxHp,"aria-valuenow":Math.ceil(o.hp),children:[h("i",{style:{transform:ca(o.hp/o.maxHp)}}),o.barrier>0&&h("i",{class:"ward",style:{transform:ca(o.barrier/o.maxHp)}})]})]})}function Du(){const a=K(),e=a.player,t=a.zones.progress;let s=a.biome.name;if(t)s=a.zones.dungeonName??s;else{const n=a.world.sites.near(e.x,e.z);n&&Math.hypot(n.x-e.x,n.z-e.z)<n.clear+6&&(s=n.name)}const o=t?t.cleared?"Cleared":`${Math.max(0,t.total-t.killed)} remain`:qu.find(n=>a.hour<n[0])?.[1]??"Night";return h("section",{id:"compass","aria-label":"Map and place",children:[h("button",{type:"button",id:"map-ring",title:"Map and waystones","aria-label":`Map: waystones and places found, key ${ut("map")}`,onClick:n=>{lr("map"),n.detail&&n.currentTarget.blur()}}),h("div",{id:"place",class:"plate small",children:[h("span",{id:"zone",children:s}),h("span",{id:"clock",class:"dim",children:o})]})]})}function Fi(){const a=K(),e=a.player.char.journey,t=a.zones.progress,s=[];return t&&s.push(t.cleared?"The boss is slain. Leave when ready.":t.bossAlive?"Find and slay the Inkbound":"Clear the halls"),e.bounty&&s.push(a.bounties.track(e.bounty)),s.length?h("section",{id:"tracker",class:"plate small","aria-label":"Objectives",children:[h("div",{class:"label",children:t?"Dungeon":"Bounty"}),s.map(o=>h("div",{class:"tracker-text",children:o}))]}):null}function Ni(){return h("section",{id:"log",role:"log","aria-live":"polite","aria-label":"Messages",children:A.log.value.map(a=>h("p",{class:a.old?"old":"",dangerouslySetInnerHTML:{__html:a.html}},a.id))})}function Iu(){const a=A.toast.value,[e,t]=Ie(0);return Qe(()=>{if(!a)return;t(a.id);const s=setTimeout(()=>t(0),a.seconds*1e3);return()=>clearTimeout(s)},[a?.id]),h("div",{id:"toast",class:`plate ${a&&e===a.id?"show":""}`,role:"status","aria-live":"polite",children:a&&h(le,{children:[h("strong",{children:a.title}),a.sub&&h("span",{children:a.sub})]})})}function Bi(){const a=A.prompt.value;return a?h("section",{id:"prompt",class:"plate","aria-live":"polite",children:[h("button",{type:"button",class:"key",onClick:()=>K().zones.interact(),children:a.key})," ",a.text]}):null}function Xs(a){const e=St(-1e9);return a.hidden?null:h("button",{type:"button",class:`slot ${a.cls} ${a.state??""}`,title:a.title,"aria-label":`${a.title}, ${a.keyLabel}`,onPointerDown:t=>{t.pointerType==="touch"&&(e.current=performance.now(),K().input.any=!0,a.onUse())},onClick:t=>{performance.now()-e.current<800||(a.onUse(),t.detail&&t.currentTarget.blur())},onContextMenu:t=>t.preventDefault(),children:[h(ta,{svg:a.icon}),h("span",{class:"cool",style:{"--left":`${Math.round((a.cooldown??0)*100)}%`}}),h("span",{class:"key",children:a.keyLabel}),a.count!==void 0&&h("span",{class:"count",children:a.count})]})}function Fu(){const a=K(),e=a.player,t=e.char,s=a.touch?a.controls.actTarget():null,o=!!s&&s.kind==="npc",n=r=>a.controls.useSlot(r);return h("section",{id:"hotbar","aria-label":"Skills and tonics",children:[Array.from({length:pa},(r,i)=>{const l=a.skills.skillInSlot(i);if(a.touch&&i===0)return null;const c=l?a.skills.cooldown(l.def.id):{frac:0},d=l?a.skills.canAfford(l)?"":"dry":"locked";return h(Xs,{cls:`s${a.touch?i-1:i}`,icon:l?Ro(l.def.icon,l.def.element):Jt("star","#e8e2d4"),keyLabel:ut(Ru[i]),title:l?`${l.def.name}${l.params.cost?` (${l.params.cost} ${e.build.cls.resource.name})`:""}`:`Empty slot ${i+1}: put a skill here from the skill tree`,onUse:()=>l?n(i):lr("skills"),cooldown:c.frac,state:d})}),h("div",{class:"sep"}),h(Xs,{cls:"d0",icon:Jt("flask","#c63e3a"),keyLabel:ut("potion"),title:"Drink a tonic",onUse:()=>a.playerSystem.drink(),count:t.potions,cooldown:e.potionCd/1.2,state:t.potions?"":"empty"}),h(Xs,{cls:"d1",icon:_o.evade,keyLabel:ut("evade"),title:"Evade",onUse:()=>a.skills.evade(e.intent.moveX,e.intent.moveZ),cooldown:e.evadeCd/4}),a.touch&&h(Nu,{talk:o,idle:!s}),a.touch&&h(Xs,{cls:"next",icon:_o.next,keyLabel:"Tab",title:"Next target",onUse:()=>a.controls.cycleTarget()})]})}function Nu({talk:a,idle:e}){const t=K(),s=t.skills.skillInSlot(0);return h("button",{type:"button",class:`slot act ${a?"talk":e?"idle":""}`,title:a?"Talk":"Attack","aria-label":a?"Talk":"Attack the nearest creature",onPointerDown:o=>{t.input.acting=!0,t.controls.act();try{o.currentTarget.setPointerCapture(o.pointerId)}catch{}},onPointerUp:()=>t.input.acting=!1,onPointerCancel:()=>t.input.acting=!1,onLostPointerCapture:()=>t.input.acting=!1,onClick:o=>{o.detail===0&&t.controls.act()},children:h("span",{class:"ico","aria-hidden":"true",dangerouslySetInnerHTML:{__html:(s?Ro(s.def.icon,s.def.element).replace("<svg ",'<svg class="i-attack" '):_o.attack)+_o.talk}})})}function Bu(){const a=K(),e=a.player.char,t=Cs(e.level,e.bonusPoints)-Ts(e.tree),s=[["character","Character",ut("character"),!1],["inventory","Inventory",ut("inventory"),e.bag.some(o=>o?.fresh)],["skills","Skill tree",ut("skills"),t>0],["journal","Journal",ut("journal"),!1],["menu","Menu","Esc",!1]];return h("nav",{id:"menu","aria-label":"Menus",children:s.map(([o,n,r,i])=>h("button",{type:"button",class:`${i?"alert":""} ${ic(o)?"on":""}`,title:`${n} (${r})`,"aria-label":`${n}, key ${r}${i?", something new":""}`,onClick:l=>{a.bus.emit("ui:toggle",o),l.detail&&l.currentTarget.blur()},children:h(ta,{svg:eu[o]})}))})}function Ou(){const a=K(),[e]=Ie([]);Qe(()=>a.bus.on("telegraph",i=>{a.settings.threatIndicators&&(e.push({x:i.x,z:i.z,until:a.time+i.t+.2}),e.length>12&&e.shift())}),[]);const t=a.renderer.size.cssW,s=a.renderer.size.cssH,o=a.camera,n=a.player,r=[];for(let i=e.length-1;i>=0;i--){const l=e[i];if(l.until<a.time){e.splice(i,1);continue}if(Math.hypot(l.x-n.x,l.z-n.z)>22)continue;const c=o.project(l.x,a.world.surface(l.x,l.z),l.z);if(c&&c.x>.04&&c.x<.96&&c.y>.06&&c.y<.94)continue;let d,p;if(c)d=(c.x-.5)*t,p=(c.y-.5)*s;else{const z=l.x-n.x,P=l.z-n.z,$=o.fwd,N=Math.hypot($[0],$[2])||1;d=z*o.right[0]+P*o.right[2],p=-(z*$[0]+P*$[2])/N}const f=a.touch?40:370,u=t-(a.touch?40:230),m=110,g=s-(a.touch?200:250),v=(f+u)/2,x=(m+g)/2,b=Math.max(20,(u-f)/2),y=Math.max(20,(g-m)/2),k=Math.hypot(d,p)||1,M=Math.min(b/Math.abs(d/k||1e-6),y/Math.abs(p/k||1e-6));r.push(h("div",{class:"threat",style:{transform:`translate(${(v+d/k*M).toFixed(0)}px, ${(x+p/k*M).toFixed(0)}px) translate(-50%, -50%) rotate(${Math.atan2(p,d).toFixed(2)}rad)`}}))}return h("div",{id:"threats","aria-hidden":"true",children:r})}function ju(){Qe(()=>{const a=K(),e=(o,n)=>{const r=a.player,i=a.camera,l=o-r.x,c=n-r.z,d=l*i.right[0]+c*i.right[2],p=-(l*i.fwd[0]+c*i.fwd[2]);return Math.abs(d)>Math.abs(p)?d>0?"right":"left":p>0?"ahead":"behind"},t=o=>{a.settings.captions&&ae(`<span class="caption">[${o}]</span>`)},s=[a.bus.on("monster:special",o=>t(`${o.name} gathers itself, ${e(o.x,o.z)}`)),a.bus.on("lowhealth",()=>t("Your heart pounds: health is low")),a.bus.on("boss:spawn",o=>t(`${o.name} stirs`)),a.bus.on("nightfall",()=>t("Night sounds rise")),a.bus.on("item:legendary",()=>t("A bell rings: something rare has fallen")),a.bus.on("monster:alert",o=>{o.elite&&t(`${o.name} has seen you, ${e(o.x,o.z)}`)})];return()=>s.forEach(o=>o())},[])}function Uu(){const a=K();return a.settings.showFps?h("div",{id:"fps","aria-hidden":"true",children:[Math.round(a.fps)," fps · ",Math.round(a.renderer.scale*100),"%"]}):null}function Wu(){A.frame.value,ju();const a=K().touch&&innerHeight>=innerWidth;return h(le,{children:[h("div",{class:"hud-col hud-left",children:[h($u,{}),!a&&h(Ni,{})]}),h("div",{class:"hud-col hud-center",children:[h(Hu,{}),h(Iu,{})]}),h("div",{class:"hud-col hud-right",children:[h(Du,{}),!a&&h(Fi,{}),h(Uu,{})]}),a&&h("div",{class:"hud-notes",children:[h(Fi,{}),h(Ii,{}),h(Ni,{}),h(Bi,{})]}),h("div",{class:"hud-dock",children:[!a&&h(Ii,{}),!a&&h(Bi,{}),h("div",{class:"hud-row",children:[h(Fu,{}),h(Bu,{})]})]}),h(Ou,{}),h(Lu,{})]})}const At=4,Ku=44,Zs={"":[27,22],hurt:[27,22],crit:[38,30],heal:[22,18],xp:[20,18],miss:[20,18],dot:[19,16]},dn={common:0,magic:1,rare:2,legendary:3,unique:4},Qs=a=>a.replace(/[&<>"]/g,e=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"})[e]);class Gu{game;root;floatRoot;nodes=new Map;floaters=[];pool=[];hud=[];hudAge=99;constructor(e,t,s){this.game=e,this.root=t,this.floatRoot=s;const o=e.bus;o.on("damage",n=>{const r=e.settings.damageNumbers;r==="off"||r==="crits"&&!n.crit&&n.target.kind!=="player"||n.dot&&n.target.kind==="monster"&&r!=="all"||this.float(n.target,String(n.amount),n.target.kind==="player"?"hurt":n.dot?"dot":n.crit?"crit":"")}),o.on("miss",n=>{e.settings.damageNumbers!=="off"&&this.float(n.target,n.text,"miss")}),o.on("xp",n=>{const r=e.player;e.settings.damageNumbers==="all"&&this.floatAt(r.x,r.y+2.5,r.z,`+${n.amount} xp`,"xp")}),o.on("heal",n=>{n.entity.kind==="player"&&!n.focus&&n.amount&&n.amount>2&&this.floatAt(n.entity.x,n.entity.y+2.1,n.entity.z,`+${Math.round(n.amount)}`,"heal")}),o.on("zone:enter",()=>this.clear()),o.on("character:loaded",()=>this.clear())}clear(){for(const e of this.nodes.values())e.el.remove();this.nodes.clear();for(const e of this.floaters)e.el&&(e.el.style.display="none",this.pool.push(e.el));this.floaters=[]}float(e,t,s){let o=0;for(const r of this.floaters)r.e===e&&r.t<.5&&o++;const n=o?(o%2?1:-1)*Math.ceil(o/2)*36:0;this.push({e,text:t,cls:s,dx:n,ph:0,t:0,life:0,w:0,h:0,up:0})}floatAt(e,t,s,o,n){this.push({e:null,x:e,y:t,z:s,text:o,cls:n,dx:0,ph:0,t:0,life:0,w:0,h:0,up:0})}push(e){const t=this.pool.pop()||this.floatRoot.appendChild(document.createElement("div"));t.className="fl "+e.cls,t.textContent=e.text,t.style.display="";const s=this.game.settings.damageNumberScale;t.style.fontSize="",s!==1&&(t.style.fontSize=`${Math.round((Zs[e.cls]||Zs[""])[this.game.touch?1:0]*s)}px`);const o=(Zs[e.cls]||Zs[""])[this.game.touch?1:0]*s;e.el=t,e.t=0,e.life=e.cls==="crit"?1.1:.9,e.w=e.text.length*o*.58+8,e.h=o+2,e.up=0,this.floaters.push(e)}readHud(){const e=this.hud;e.length=0;const t=s=>{if(s.hidden)return;const o=s.getBoundingClientRect();o.width>2&&o.height>2&&e.push({l:o.left,t:o.top,r:o.right,b:o.bottom,hud:!0})};for(const s of document.querySelectorAll("#ui section:not(#log), #ui nav, #log p, #toast.show, #place, body.touch #hotbar .slot, #panels .panel"))t(s)}wantsSlip(e,t,s){if(t>40)return!1;if(e.marked||e.hover||e===s.target||e.boss)return!0;const o=this.game.settings.enemyBars;return o==="off"?e.elite:o==="always"?!0:e.hp<e.maxHp||e.elite||e.ai.state==="chase"||e.ai.state==="attack"}update(e){const t=this.game,s=t.camera,o=t.player,n=t.renderer.size.cssW,r=t.renderer.size.cssH;(this.hudAge+=e)>.25&&(this.hudAge=0,this.readHud());const i=[],l=(m,g,v,x,b)=>{const y=x-v,k=y-b;for(const M of this.hud)if(m<M.r+At&&g>M.l-At&&k<M.b+At&&y>M.t-At)return M;for(const M of i)if(m<M.r+At&&g>M.l-At&&k<M.b+At&&y>M.t-At)return M;return null},c=dn[t.settings.lootLabels==="all"?"common":t.settings.lootLabels],d=t.controls.showLabels,p=[];for(const m of t.entities.list){if(m.kind==="player"||m.dead||m.grow<.6)continue;const g=Math.hypot(m.x-o.x,m.z-o.z);let v=!1;if(m.kind==="npc")v=g<30;else if(m.kind==="monster")v=this.wantsSlip(m,g,o);else if(m.kind==="drop"){const k=m.rarity?dn[m.rarity]:-1;v=m.age>.4&&(g<9||k>=3&&g<30)&&(d||m.loot.type!=="item"||k>=c||m===o.target)}if(!v)continue;const x=s.project(m.x,m.y+m.height+.25+m.lift,m.z);if(!x||x.x<-.1||x.x>1.1||x.y<-.1||x.y>1.1)continue;const b=m,y=m===o.target?0:m.marked?.5:m.hover?1:m.kind==="monster"&&b.boss?1.5:m.kind==="npc"?2+g*.01:m.kind==="drop"?200+g-(m.rarity?dn[m.rarity]*20:0):(b.elite?5:10)+g;p.push({e:m,x:x.x*n,y:x.y*r,rank:y})}p.sort((m,g)=>m.rank-g.rank);const f=new Set;for(const m of p){const g=m.e;f.add(g.id);let v=this.nodes.get(g.id);if(!v){const z=this.root.appendChild(document.createElement("div"));if(g.kind==="monster"){const P=g;z.className="np"+(P.boss?" boss":P.elite?" elite":"");const $=P.affixes.map(N=>Po[N]?.name).filter(Boolean).join(" · ");z.innerHTML=`${Qs(P.name)}<small>Lv ${P.level}</small>${$?`<em>${Qs($)}</em>`:""}<span class="mini"><i></i><b></b></span>`}else if(g.kind==="npc")z.className="np npc",z.innerHTML=`${Qs(g.name)}<small>${Qs(g.title)}</small>`;else{const P=g;z.className="np loot"+(P.rarity?` r-${P.rarity}`:"")+(P.loot.type==="gold"?" gold":""),P.rarity&&z.style.setProperty("--rc",ya[t.settings.colorVision][P.rarity]),z.textContent=g.name}v={el:z,fill:z.querySelector("i"),hp:-1,w:z.offsetWidth,h:z.offsetHeight,lift:0,shown:!0},this.nodes.set(g.id,v)}v.goal!==!!g.marked&&(v.goal=!!g.marked,v.el.classList.toggle("goal",v.goal));const x=m.x-v.w/2,b=m.x+v.w/2;let y=0,k=!1;for(let z=0;z<6&&!k;z++){const P=l(x,b,y,m.y,v.h);if(!P)k=!0;else{if(P.hud||y>90)break;y=m.y-P.t+At}}if(k!==v.shown&&(v.shown=k,v.el.style.visibility=k?"":"hidden",k||(v.lift=0)),!k)continue;let M=y;if(v.lift>y&&(M=Math.max(y,v.lift-120*e),l(x,b,M,m.y,v.h)&&(M=y)),v.lift=M,i.push({l:x,r:b,t:m.y-M-v.h,b:m.y-M}),v.el.style.transform=`translate(${m.x.toFixed(1)}px, ${(m.y-v.lift).toFixed(1)}px) translate(-50%, -100%)`,v.fill&&g.kind==="monster"){const z=g,P=z.hp+z.barrier*1e3;if(v.hp!==P){v.hp=P,v.fill.style.transform=`scaleX(${Math.max(0,z.hp/z.maxHp).toFixed(3)})`;const $=v.el.querySelector("b");$&&($.style.transform=`scaleX(${Math.min(1,z.barrier/z.maxHp).toFixed(3)})`)}}}for(const[m,g]of this.nodes)f.has(m)||(g.el.remove(),this.nodes.delete(m));let u=0;for(const m of this.floaters){m.t+=e;const g=m.t/m.life;if(g>=1){m.el.style.display="none",this.pool.push(m.el);continue}let v=0,x=0,b;if(m.e){const y=m.e,k=this.nodes.get(y.id);k&&(m.ph=k.shown?k.h+k.lift:0),b=s.project(y.x,y.y+y.height+.25+(y.lift||0),y.z),b&&(v=b.x*n+m.dx,x=b.y*r-m.ph-3-g*Ku)}else b=s.project(m.x,m.y+g*1.1,m.z),b&&(v=b.x*n,x=b.y*r+m.h/2);if(b){const y=v-m.w/2,k=v+m.w/2;for(let M=0;M<6;M++){const z=x-m.up,P=z-m.h;let $=null;for(const N of i)if(y<N.r+2&&k>N.l-2&&P<N.b+2&&z>N.t-2){$=N;break}if(!$)break;m.up=x-$.t+3}i.push({l:y,r:k,t:x-m.up-m.h,b:x-m.up}),m.el.style.transform=`translate(${v.toFixed(1)}px, ${(x-m.up).toFixed(1)}px) translate(-50%, -100%)`,m.el.style.opacity=g<.6?"1":(1-(g-.6)/.4).toFixed(2)}else m.el.style.opacity="0";this.floaters[u++]=m}this.floaters.length=u}}const hn=.16;function Yu(a,e){const t=()=>{a.touch=!0,document.body.classList.add("touch"),e()};a.touch?t():addEventListener("pointerdown",function s(o){o.pointerType==="touch"&&(removeEventListener("pointerdown",s,!0),t())},!0),addEventListener("touchstart",()=>{},{passive:!0})}function Vu(a,e){const t=e.firstElementChild,s=t.firstElementChild,o=a.input.stick;let n=null,r=0,i=0,l=40;const c=u=>{if(u.pointerId!==n)return;const m=u.clientX-r,g=u.clientY-i,v=Math.hypot(m,g),x=v>l?l/v:1;s.style.transform=`translate(${(m*x).toFixed(1)}px, ${(g*x).toFixed(1)}px)`;const b=Math.min(1,v/l),y=b<hn?0:.42+.58*(b-hn)/(1-hn);o.x=v?m/v*y:0,o.y=v?-g/v*y:0},d=u=>{u&&u.pointerId!==n||(n=null,o.x=o.y=0,t.style.left=t.style.top=t.style.right=t.style.bottom="",s.style.transform="",e.classList.remove("held"))},p=u=>{if(n!==null)return;n=u.pointerId;try{e.setPointerCapture(n)}catch{}const m=e.getBoundingClientRect(),g=t.offsetWidth/2;l=g*.62,r=He(u.clientX,m.left+g,Math.max(m.left+g,m.right-g)),i=He(u.clientY,m.top+g,Math.max(m.top+g,m.bottom-g)),Object.assign(t.style,{left:`${r-m.left-g}px`,top:`${i-m.top-g}px`,right:"auto",bottom:"auto"}),e.classList.add("held"),a.input.any=!0,c(u),u.preventDefault()},f=()=>d();e.addEventListener("pointerdown",p),e.addEventListener("pointermove",c);for(const u of["pointerup","pointercancel","lostpointercapture"])e.addEventListener(u,d);return addEventListener("blur",f),()=>{e.removeEventListener("pointerdown",p),e.removeEventListener("pointermove",c),removeEventListener("blur",f)}}const ke=(a,e=0)=>`${(a*100).toFixed(e)}%`;function Lt(a,e){const t=K();return a.ok?(e&&ae(e),t.player.dirty=!0,t.playerSystem.recompile(!0),t.bus.emit("equipment:changed"),t.bus.emit("inventory:changed"),t.bus.emit("ui:click"),!0):(a.reason&&ae(a.reason),t.bus.emit("deny"),!1)}const Xu=[["helm","Helm","helm"],["amulet","Amulet","amulet"],["mainhand","Weapon","sword"],["chest","Chest","chest"],["offhand","Off-hand","shield"],["gloves","Gloves","gloves"],["legs","Legs","legs"],["ring1","Ring","ring"],["boots","Boots","boots"],["ring2","Ring","ring"]];function Zu(){A.rev.value;const a=K(),e=a.player.char,[t,s]=Ie(null),o=A.npc.value,n=o&&(o.role==="smith"||o.role==="alchemist"||o.role==="tinker")?o:null,r=o?.role==="stash",[i]=Ie(0),l=t?t.where==="bag"?e.bag[t.i]:e.equipment[t.slot]??null:null,c=g=>{const v=e.bag[g];if(v){if(r){Lt(a.vendors.deposit(g,i));return}Lt(Ud(e,g),`You put on the ${gt(v)}.`)&&s(null)}},d=g=>{Lt(Wd(e,g))&&s(null)},p=g=>{const v=e.bag[g];if(!v)return;const x=()=>{Lt(a.vendors.sell(g))&&s(null)};a.settings.confirmValuable&&(v.rarity==="legendary"||v.rarity==="unique")?ua("Sell this?",`${gt(v)} is ${zs[v.rarity].name.toLowerCase()}. It fetches ${vs(v)} glint and cannot be bought back.`,"Sell it",x,!0):x()},f=g=>{const v=e.bag[g];if(!v)return;const x=()=>{Lt(a.vendors.salvage(g))&&s(null)};a.settings.confirmValuable&&(v.rarity==="legendary"||v.rarity==="unique")?ua("Break it down?",`${gt(v)} will become ${zn(v).map(b=>`${b.n} ${Ht[b.id].name}`).join(" and ")}. This cannot be undone.`,"Salvage",x,!0):x()},u=g=>{const v=e.bag[g];if(!v)return;const x=()=>{e.bag[g]=null,a.loot.discard(v),Lt({ok:!0}),s(null)};v.rarity!=="common"&&a.settings.confirmValuable?ua("Drop this?",`${gt(v)} will be left on the ground here.`,"Drop it",x):x()},m=g=>{const v=g.target,x=Number(v.dataset.index);if(!Number.isFinite(x))return;const b={ArrowRight:1,ArrowLeft:-1,ArrowDown:11,ArrowUp:-11};if(b[g.key]!==void 0){g.preventDefault();const y=Math.max(0,Math.min(is-1,x+b[g.key]));v.parentElement.children[y]?.focus()}else if(g.key==="Delete"||g.key==="Backspace")g.preventDefault(),u(x);else if(g.key.toLowerCase()==="j"){const y=e.bag[x];y&&(y.junk=!y.junk,a.bus.emit("inventory:changed"))}};return h(Ft,{id:"inventory",title:"Inventory",side:"right",wide:!0,actions:h("button",{type:"button",class:"btn small",onClick:()=>{Kd(e),s(null),a.bus.emit("inventory:changed")},children:"Sort"}),children:[h("div",{class:"doll-row",children:[h("div",{class:"doll","aria-label":"Worn",children:Xu.map(([g,v,x])=>h("div",{class:`doll-slot d-${g}`,children:h(Nn,{item:e.equipment[g],label:v,empty:x,worn:!0,selected:t?.where==="worn"&&t.slot===g,onClick:()=>s(e.equipment[g]?{where:"worn",slot:g}:null),onUse:()=>d(g)})}))}),h("div",{class:"doll-side",children:[h("div",{class:"sheet small",children:[h("div",{children:[h("span",{children:"Damage"}),Math.round(Rn(a.player.build))]}),h("div",{children:[h("span",{children:"Toughness"}),Math.round($n(a.player.build))]}),h("div",{children:[h("span",{children:"Health"}),a.player.maxHp]}),h("div",{children:[h("span",{children:"Armor"}),Math.round(a.player.build.derived.armor)]})]}),h("div",{class:"row",children:[h("span",{class:"coin",children:[e.gold," glint"]}),h("span",{children:[e.potions," ",Gl[e.potionTier].name,e.potions===1?"":"s"]})]})]})]}),h("div",{class:"row",children:[h("div",{class:"label",children:["Bag · ",is-Ul(e.bag)," / ",is]}),n&&h("button",{type:"button",class:"btn small",disabled:!e.bag.some(g=>g?.junk),onClick:()=>{const g=a.vendors.sellJunk();g&&ae(`Sold your junk for <em>${g} glint</em>.`)},children:"Sell junk"})]}),h("div",{class:"bag",role:"grid","aria-label":"Bag",onKeyDown:m,children:e.bag.map((g,v)=>h(Nn,{item:g,index:v,selected:t?.where==="bag"&&t.i===v,onClick:()=>{g?(g.fresh=!1,s({where:"bag",i:v})):s(null)},onUse:()=>n&&n.role!=="alchemist"?p(v):c(v)}))}),l&&t&&h("div",{class:"sel-actions","aria-label":"What to do with it",children:[h("div",{class:"sel-name",style:{color:Ho(l.rarity)},children:gt(l)}),h("div",{class:"btns",children:[t.where==="bag"&&!r&&h("button",{type:"button",class:"btn primary",onClick:()=>c(t.i),children:"Wear"}),t.where==="worn"&&h("button",{type:"button",class:"btn",onClick:()=>d(t.slot),children:"Take off"}),t.where==="bag"&&r&&h("button",{type:"button",class:"btn primary",onClick:()=>{Lt(a.vendors.deposit(t.i,i)),s(null)},children:"Put in stash"}),t.where==="bag"&&n&&h("button",{type:"button",class:"btn",onClick:()=>p(t.i),children:["Sell · ",vs(l)]}),t.where==="bag"&&n&&n.role!=="alchemist"&&h("button",{type:"button",class:"btn",onClick:()=>f(t.i),children:"Salvage"}),t.where==="bag"&&h("button",{type:"button",class:"btn","aria-pressed":!!l.junk,onClick:()=>{l.junk=!l.junk,a.bus.emit("inventory:changed")},children:l.junk?"Not junk":"Junk"}),t.where==="bag"&&h("button",{type:"button",class:"btn",onClick:()=>u(t.i),children:"Drop"})]})]}),h(Qu,{}),h("p",{class:"hint dim",children:a.touch?"Tap to choose; double-tap to wear.":"Click to choose, right-click to wear or take off. Arrow keys move, J marks junk, Delete drops."})]})}function Qu(){const a=K().player.char,e=Object.keys(a.materials).filter(t=>a.materials[t]>0);return e.length?h("div",{class:"mats","aria-label":"Materials",children:e.map(t=>{const s=Ht[t];return h("span",{class:"mat",title:s?.desc,children:[h(ta,{svg:Jt(t==="scrap"||t==="thread"||t==="inkstone"?"gem":"pouch",`rgb(${(s?.color??[200,200,200]).join(",")})`)}),s?.name??t," ×",a.materials[t]]})})}):null}function Ju(){A.rev.value;const a=K(),e=a.player,t=e.char,s=e.build.derived,o=e.build.cls,n=e.build.derived.attrs,r=s.resist,i=(r.fire+r.frost+r.storm+r.poison+r.shadow)/5;return h(Ft,{id:"character",title:"Character",side:"left",children:[h("div",{class:"row",children:[h("p",{children:[h("strong",{children:t.name})," · level ",t.level," ",o.name]}),h("p",{class:"dim",children:t.level>=Zt?"Highest level":`${t.xp} / ${mo(t.level)} xp`})]}),h("div",{class:"attrs",children:Xn.map(l=>h("div",{class:`attr ${l===o.primary?"primary":""}`,children:[h("div",{children:[h("strong",{children:so[l].name}),h("small",{children:so[l].hint})]}),h("div",{class:"val",children:n[l]})]}))}),h("div",{class:"label",children:"Offence"}),h("div",{class:"sheet",children:[h("div",{children:[h("span",{children:"Weapon"}),s.weapon.min,"–",s.weapon.max]}),h("div",{children:[h("span",{children:[so[o.primary].name," bonus"]}),"×",s.mainMult.toFixed(2)]}),h("div",{children:[h("span",{children:"Critical chance"}),ke(s.critChance,1)]}),h("div",{children:[h("span",{children:"Critical damage"}),"+",ke(s.critMult-1)]}),h("div",{children:[h("span",{children:"Attack speed"}),ke(s.attackSpeed-1,1)]}),h("div",{children:[h("span",{children:"Damage bonus"}),"+",ke(e.build.totals.add.damage)]}),h("div",{children:[h("span",{children:"Shorter cooldowns"}),ke(s.cdr)]}),h("div",{children:[h("span",{children:o.resource.name}),s.maxResource]})]}),h("div",{class:"label",children:"Defence"}),h("div",{class:"sheet",children:[h("div",{children:[h("span",{children:"Health"}),e.maxHp]}),h("div",{children:[h("span",{children:"Health a second"}),s.lifeRegen.toFixed(1)]}),h("div",{children:[h("span",{children:"Armor"}),Math.round(s.armor)]}),h("div",{children:[h("span",{children:"Dodge"}),ke(s.dodge,1)]}),h("div",{children:[h("span",{children:"Block"}),ke(s.block)]}),h("div",{children:[h("span",{children:"Damage taken"}),ke(s.taken)]}),h("div",{title:`Fire ${ke(r.fire)}, frost ${ke(r.frost)}, storm ${ke(r.storm)}, poison ${ke(r.poison)}, shadow ${ke(r.shadow)}. The most any can reach is ${ke(Cl)}.`,children:[h("span",{children:"Resistance"}),ke(i)]}),h("div",{children:[h("span",{children:"Thorns"}),Math.round(s.thorns)]})]}),h("div",{class:"label",children:"Fortune"}),h("div",{class:"sheet",children:[h("div",{children:[h("span",{children:"Movement"}),ke(s.moveSpeed-1)]}),h("div",{children:[h("span",{children:"Glint found"}),"+",ke(s.goldFind-1)]}),h("div",{children:[h("span",{children:"Finer finds"}),"+",ke(s.magicFind-1)]}),h("div",{children:[h("span",{children:"Experience"}),"+",ke(s.xpMul-1)]})]}),h(pt,{label:"Difficulty",hint:e.safe?vt[t.difficulty].desc:"Change it in a town or another safe place.",value:t.difficulty,options:Object.entries(vt).map(([l,c])=>[l,c.name]),onChange:l=>{if(!e.safe){ae("Choose a difficulty in a town or another safe place."),a.bus.emit("deny");return}t.difficulty=l,Te(`${vt[l].name}`,vt[l].desc,3.4),a.bus.emit("build:changed")}}),h("div",{class:"label",children:"The journey"}),h("div",{class:"sheet",children:[h("div",{children:[h("span",{children:"Creatures felled"}),t.tally.kills]}),h("div",{children:[h("span",{children:"Elites"}),t.tally.elites]}),h("div",{children:[h("span",{children:"Bosses"}),t.tally.bosses]}),h("div",{children:[h("span",{children:"Dungeons cleared"}),t.tally.dungeons]}),h("div",{children:[h("span",{children:"Falls"}),t.tally.deaths]}),h("div",{children:[h("span",{children:"Played"}),Math.floor(t.played/3600),"h ",Math.floor(t.played/60)%60,"m"]})]})]})}function ef(){A.rev.value;const a=K(),e=a.player.char,t=A.npc.value;if(!t)return null;const s=t.role==="smith"||t.role==="tinker",o=t.role==="alchemist"||t.role==="tinker",n=a.vendors.nextTonic(),r=(l,c)=>{l.ok?c&&ae(c):(ae(l.reason??"No."),a.bus.emit("deny"))},i=Object.keys(e.materials).filter(l=>!["scrap","thread","inkstone"].includes(l)).reduce((l,c)=>l+(Ht[c]?.value??0)*e.materials[c],0);return h(Ft,{id:"vendor",title:`${t.name}, ${t.title}`,side:"left",children:[h("p",{children:["“",t.role==="smith"?"Bring me what you do not want. I can make something of it.":t.role==="alchemist"?"Fresh tonics, fair prices.":"Bits and bottles, all honest.","”"]}),h("div",{class:"row",children:[h("span",{class:"coin",children:[e.gold," glint"]}),h("span",{class:"dim",children:"Choose an item in your bag to sell or salvage it."})]}),o&&h(le,{children:[h("div",{class:"label",children:"Tonics"}),h("div",{class:"offer",children:[h("strong",{children:"Refill your tonics"}),h("small",{children:[e.potions," of ",a.player.build.derived.potionCharges," carried. Free in any town."]}),h("button",{type:"button",class:"btn",disabled:e.potions>=a.player.build.derived.potionCharges,onClick:()=>r(a.vendors.refill(),"Your tonics are full."),children:"Refill"})]}),n?h("div",{class:"offer",children:[h("strong",{children:["Brew ",n.name,"s"]}),h("small",{children:["Heal ",n.heal," of your health · ",Object.entries(n.needs).map(([l,c])=>`${Ht[l].name} ${Math.min(e.materials[l]??0,c)}/${c}`).join(", ")]}),h("button",{type:"button",class:"btn primary",disabled:e.gold<n.glint,onClick:()=>r(a.vendors.brewTonic()),children:["Brew · ",n.glint]})]}):h("p",{class:"dim",children:"Your tonics are as strong as they can be brewed."}),h("div",{class:"offer",children:[h("strong",{children:"Sell materials"}),h("small",{children:"Everything creatures carried. The smith’s scrap, thread and inkstone are kept."}),h("button",{type:"button",class:"btn",disabled:!i,onClick:()=>{const l=a.vendors.sellMaterials();l&&ae(`Sold materials for <em>${l} glint</em>.`)},children:["Sell · ",i]})]})]}),s&&h(le,{children:[h("div",{class:"label",children:["A wrapped piece · ",a.vendors.gamblePrice()," glint"]}),h("p",{class:"dim small",children:"Something you can use, of the kind you choose. Who knows how fine."}),h("div",{class:"gamble",children:ch.map(l=>h("button",{type:"button",class:"btn small",disabled:e.gold<a.vendors.gamblePrice(),onClick:()=>r(a.vendors.gamble(l.slot)),children:l.name}))}),h(tf,{})]})]})}function tf(){const a=K(),e=a.player.char,[t,s]=Ie(null),o=Object.keys(e.equipment).filter(r=>e.equipment[r]&&e.equipment[r].rarity!=="unique"&&e.equipment[r].affixes.length),n=t?e.equipment[t]:null;return h("div",{class:"enchant",children:[h("div",{class:"label",children:"Enchant · change one line on something you wear"}),h("div",{class:"gamble",children:o.map(r=>h("button",{type:"button",class:`btn small ${r===t?"on":""}`,style:{color:Ho(e.equipment[r].rarity)},"aria-pressed":r===t,onClick:()=>s(r),children:gt(e.equipment[r])}))}),n&&t&&h(le,{children:[h("p",{class:"dim small",children:["Costs ",a.vendors.enchantCost(n).glint," glint and ",a.vendors.enchantCost(n).thread," Gilded Thread (you have ",e.materials.thread??0,"). Choose the line to change:"]}),n.affixes.map((r,i)=>h(af,{item:n,index:i,onDo:()=>{const l=a.vendors.enchant({slot:t},i);l.ok||(ae(l.reason),a.bus.emit("deny"))}}))]}),!o.length&&h("p",{class:"dim small",children:"Wear something with affixes to enchant it."})]})}function af({item:a,index:e,onDo:t}){const s=Tc(()=>h(Cc,{item:a,compare:!1,worn:!0}),!0),o=a.affixes[e],n=ha[o.id],r=n?Mn(n,rs(n,o.roll,a.ilvl),o.skill):o.id;return h("button",{type:"button",class:"btn line",...s,onClick:t,children:["Change “",r,"”"]})}function sf(){A.rev.value;const a=K(),[e,t]=Ie(0),s=a.stash[e];return h(Ft,{id:"stash",title:"Stash",side:"left",children:[h("p",{class:"dim",children:"Shared by every hero of yours. Click an item to take it; choose one in your bag to put it here."}),h("div",{class:"tabs row",role:"tablist","aria-label":"Stash tabs",children:Array.from({length:sr},(o,n)=>h("button",{type:"button",role:"tab","aria-selected":n===e,class:`tab ${n===e?"on":""}`,onClick:()=>t(n),children:["Tab ",n+1]}))}),h("div",{class:"bag stash","aria-label":`Stash tab ${e+1}`,children:s.map((o,n)=>h(Nn,{item:o,index:n,onClick:()=>{o&&Lt(a.vendors.withdraw(n,e))},onUse:()=>{o&&Lt(a.vendors.withdraw(n,e))}}))})]})}function of(){A.rev.value;const a=K(),e=a.player.char.journey,t=e.bounty,s=A.npc.value;if(t){const o=t.have>=t.need;return h(Ft,{id:"bounty",title:s?`${s.name}’s board`:"Bounty",side:"left",children:[h("p",{children:["“",o?"Good work out there. Here is your pay.":"Still at it? Come back when it is done.","”"]}),h("div",{class:"offer",children:[h("strong",{children:a.bounties.title(t)}),h("small",{children:[t.need>1?`${t.have} of ${t.need} · `:"","reward ",t.xp," xp, ",t.glint," glint"]}),o?h("button",{type:"button",class:"btn primary","data-autofocus":!0,onClick:()=>{a.bounties.claim()},children:"Claim"}):h("button",{type:"button",class:"btn",onClick:()=>ua("Give up this bounty?","Anything gathered for it stays with you.","Give up",()=>a.bounties.abandon()),children:"Give up"})]})]})}return h(Ft,{id:"bounty",title:s?`${s.name}’s board`:"Bounties",side:"left",children:[h("p",{children:"“There is always work for a hero. Take a job.”"}),a.bounties.offers.filter(Boolean).map((o,n)=>h("div",{class:"offer",children:[h("strong",{children:a.bounties.title(o)}),h("small",{children:["Reward ",o.xp," xp, ",o.glint," glint",o.x!==void 0?" · marked in red on your map":""]}),h("button",{type:"button",class:"btn",onClick:()=>{a.bounties.accept(n),wa("bounty")},children:"Accept"})]}))]})}function nf(){A.rev.value;const a=K(),e=a.player,t=e.char.journey,s=t.ways.map((i,l)=>({w:i,i:l,d:Math.hypot(i.x-e.x,i.z-e.z)})).sort((i,l)=>i.d-l.d),o=Object.keys(t.known).length,n=a.overworld.sites.inRange(e.x,e.z,700).filter(i=>i.kind==="dungeon"&&t.found[i.key]),r=Object.keys(t.lands).length;return h(Ft,{id:"map",title:"Map and waystones",side:"right",children:[h("div",{class:"row",children:[h("p",{children:[a.discover.count()," places found"]}),h("p",{class:"dim",children:o?`${o} more marked on the map`:""})]}),h("div",{class:"label",children:["The Long Walk: ",r," of ",a.discover.totalCountries," countries"]}),h("p",{class:"dim",children:a.discover.nextMark()?`The road teaches a skill point at ${a.discover.nextMark()}.`:"You have walked them all."}),t.boon&&h("p",{children:[qt[t.boon.id]?.name,": ",qt[t.boon.id]?.desc]}),h("div",{class:"label",children:"Waystones you are attuned to"}),s.map(({w:i,i:l,d:c})=>h("div",{class:"way",children:[h("strong",{children:i.name}),h("small",{children:c<12?"You are here":`${Math.round(c)} paces away`}),h("button",{type:"button",class:"btn",disabled:c<12,onClick:()=>{a.discover.travel(l)&&wa("map")},children:"Go"})]})),h("p",{class:"dim",children:s.length<2?"Walk up to a waystone to attune to it. Every town and shrine has one.":"Travel takes a moment, and cannot be done in the middle of a fight."}),n.length>0&&h(le,{children:[h("div",{class:"label",children:"Dungeons found"}),n.map(i=>h("div",{class:"way",children:[h("strong",{children:i.name}),h("small",{children:[t.dungeons[i.key]?`Cleared ${t.dungeons[i.key].cleared} time${t.dungeons[i.key].cleared===1?"":"s"}`:"Not yet cleared"," · ",Math.round(Math.hypot(i.x-e.x,i.z-e.z))," paces"]})]}))]})]})}function rf(){A.rev.value;const a=K(),e=a.player.char,t=e.journey;return h(Ft,{id:"journal",title:"Journal",side:"left",children:[h("div",{class:"label",children:"Bounty"}),h("p",{children:t.bounty?`${a.bounties.title(t.bounty)} — ${a.bounties.track(t.bounty)}`:"None taken. Every town’s warden has a board."}),h("div",{class:"label",children:"What to do"}),h("ul",{class:"todo",children:[h("li",{children:["Grow stronger: spend skill points in the ",h("button",{type:"button",class:"link",onClick:()=>dt("skills"),children:"skill tree"})," and wear what you find."]}),h("li",{children:"Find the other towns: each has a waystone, a smith, an alchemist, a warden and your stash."}),h("li",{children:"Go down into the crypts and hollows. An Inkbound waits at the bottom of each, and a hoard."}),h("li",{children:["Walk every country for the Long Walk (",Object.keys(t.lands).length," of ",a.discover.totalCountries,")."]}),h("li",{children:"Raise the difficulty in the character sheet for more experience and finer finds."})]}),h("div",{class:"label",children:"Bounties done"}),h("p",{children:t.bountiesDone})]})}function lf(){const a=K(),e=a.camera,t=(o,n)=>h("button",{type:"button",class:"btn",onClick:()=>{n(),a.bus.emit("ui:click")},children:o}),s=document;return h(Ft,{id:"view",title:"View",side:"right",children:[h("div",{class:"pair",children:[t("Behind the hero",()=>Object.assign(e.goal,{pitch:qa.behind[0],distance:qa.behind[1]})),t("From above",()=>Object.assign(e.goal,{pitch:qa.above[0],distance:qa.above[1]}))]}),h("div",{class:"pair",children:[t("Turn left",()=>e.rotate(.5,0)),t("Turn right",()=>e.rotate(-.5,0))]}),h("div",{class:"pair",children:[t("Look from higher",()=>e.rotate(0,.16)),t("Look from lower",()=>e.rotate(0,-.16))]}),h("div",{class:"pair",children:[t("Closer",()=>e.zoom(.84)),t("Farther",()=>e.zoom(1.19))]}),document.fullscreenEnabled&&h("div",{class:"pair",children:t("Full screen on or off",()=>{(s.fullscreenElement?s.exitFullscreen():document.documentElement.requestFullscreen()).catch(()=>{})})}),h("p",{class:"dim",children:a.touch?"You can also drag the picture to turn it and pinch to zoom.":"You can also drag with the right mouse button, turn with Q and E, and zoom with the wheel."})]})}const Oi=["slot1","slot2","slot3","slot4","slot5","slot6"],cf=new Set(["stunChance","potency","pct","barrierPct","chill","slow","burn","bleed","poison","explodeCoef","zoneCoef","echo","crit","vulnChance","hasteSelf","falloff","implodeCoef"]),df=new Set(["duration","cooldown","stun","freeze","delay","vuln","burnDur","bleedDur","poisonDur","zoneDur","arm","barrierDur","slowDur"]);function hf(a,e){const t=e??a.params;return a.desc.replace(/\{(\w+)\}/g,(s,o)=>{const n=t[o];return n===void 0?"?":o.startsWith("coef")?`${Math.round(n*100)}%`:cf.has(o)?`${Math.round(n*100)}%`:df.has(o)?`${+n.toFixed(1)}`:`${+n.toFixed(1)}`})}function uf(){A.rev.value;const a=K(),e=a.player,t=e.char,s=e.build.cls,o=ba(s),n=t.tree,r=Ts(n),i=Cs(t.level,t.bonusPoints),l=i-r,[c,d]=Ie(t.bar[0]??s.start[0]),p=o.nodes.get(c),f=Fl(o,n),u=()=>{e.dirty=!0,a.playerSystem.recompile(!0),a.bus.emit("tree:changed")},m=y=>{const k=er(o,n,y,l);if(!k.ok){ae(k.reason),a.bus.emit("deny");return}if(n[y]=rt(n,y)+1,o.nodes.get(y).kind==="skill"&&n[y]===1&&!t.bar.includes(y)){const z=t.bar.indexOf(null);z>=0&&(t.bar[z]=y)}a.bus.emit("ui:click"),u()},g=y=>{const k=Il(o,n,y,f);if(!k.ok){ae(k.reason),a.bus.emit("deny");return}const M=Sn(t.level);if(t.gold<M){ae(`Refunding a point costs ${M} glint.`),a.bus.emit("deny");return}t.gold-=M,n[y]=rt(n,y)-1,n[y]<=0&&(delete n[y],t.bar=t.bar.map(z=>z===y?null:z)),u()},v=()=>{const y=Sn(t.level)*Math.max(0,r-s.start.length);ua("Refund every point?",`Every point goes back to you${y?` for ${y} glint`:""}, except your starting skills. Your bar keeps only those.`,"Refund all",()=>{if(t.gold<y){ae(`That costs ${y} glint.`);return}t.gold-=y;for(const k of Object.keys(n))delete n[k];for(const k of s.start)n[k]=1;t.bar=t.bar.map(k=>k&&n[k]?k:null),u()})},x=(y,k)=>{if(!rt(n,k)){ae("Learn the skill first."),a.bus.emit("deny");return}const M=t.bar.indexOf(k);M>=0&&(t.bar[M]=t.bar[y]),t.bar[y]=k,u()},b=y=>{y.key==="Enter"||y.key===" "||(y.key==="Backspace"||y.key==="-"?(y.preventDefault(),g(c)):y.key==="+"||y.key==="="?(y.preventDefault(),m(c)):/^[1-6]$/.test(y.key)&&p.kind==="skill"&&(y.preventDefault(),x(+y.key-1,c)))};return h("section",{class:"overlay plate skilltree",role:"dialog","aria-label":`${s.name} skill tree`,onKeyDown:b,children:[h("header",{children:[h("h2",{children:[s.name," skills"]}),h("div",{class:"head-actions",children:[h("span",{class:l>0?"points":"dim","aria-live":"polite",children:l>0?`${l} point${l===1?"":"s"} to spend`:`${r} points spent`}),h("button",{type:"button",class:"btn small",onClick:v,children:"Refund all"}),h("button",{type:"button",class:"x","aria-label":"Close the skill tree",onClick:()=>wa("skills"),children:"×"})]})]}),h("div",{class:"tree-layout",children:[h("div",{class:"branches",children:Ss.map(y=>{const k=Jn(o,n,y.id),M=o.byCluster.get(y.id)??[],z=M.filter($=>o.nodes.get($).kind==="skill"),P=M.filter($=>["passive","key"].includes(o.nodes.get($).kind));return h("section",{class:`branch ${k?"open":"shut"}`,"aria-label":`${y.name}${k?"":`, opens with ${y.req} points above`}`,children:[h("h3",{children:[y.name,!k&&h("small",{children:[" · ",y.req-Qn(o,n,y.id)," more points above to open"]})]}),h("div",{class:"nodes",children:[z.map($=>h("div",{class:"skill-group",children:[h(Ja,{node:o.nodes.get($),sel:c,onSel:d,onLearn:m,big:!0}),h("div",{class:"subs",children:[h(Ja,{node:o.nodes.get(`${$}+`),sel:c,onSel:d,onLearn:m}),h(Ja,{node:o.nodes.get(`${$}:a`),sel:c,onSel:d,onLearn:m}),h(Ja,{node:o.nodes.get(`${$}:b`),sel:c,onSel:d,onLearn:m})]})]})),P.map($=>h(Ja,{node:o.nodes.get($),sel:c,onSel:d,onLearn:m}))]})]})})}),h("aside",{class:"detail","aria-live":"polite",children:h(ff,{node:p,onLearn:m,onRefund:g,onAssign:x,left:l})})]})]})}function Ja({node:a,sel:e,onSel:t,onLearn:s,big:o=!1}){const n=K(),r=n.player.char,i=ba(n.player.build.cls),l=rt(r.tree,a.id),c=er(i,r.tree,a.id,Cs(r.level,r.bonusPoints)-Ts(r.tree)).ok,d=a.skill?Qt(a.skill):null,p=d?Ro(d.icon,d.element):Jt(a.icon,a.kind==="key"?"#d64634":"#e2bc82"),f=a.kind==="enhance"?"+":a.kind==="upgrade"?a.id.endsWith(":a")?"A":"B":"";return h("button",{type:"button",class:`node k-${a.kind} ${o?"big":""} ${l>0?"has":""} ${c?"can":""} ${e===a.id?"sel":""}`,"aria-label":`${a.name}, ${a.kind==="skill"?"skill":a.kind==="key"?"key passive":a.kind}, rank ${l} of ${a.max}${c?", can learn":""}`,"aria-pressed":e===a.id,onClick:()=>{e===a.id&&c?s(a.id):t(a.id)},onDblClick:()=>s(a.id),onFocus:()=>t(a.id),children:[h(ta,{svg:p}),f&&h("span",{class:"tag",children:f}),a.max>1&&h("span",{class:"rank",children:[l,"/",a.max]})]})}function ff({node:a,onLearn:e,onRefund:t,onAssign:s,left:o}){const n=K(),r=n.player,i=r.char,l=ba(r.build.cls),c=rt(i.tree,a.id),d=a.skill?Qt(a.skill):null,p=a.skill?r.build.skills.get(a.skill):null,f=er(l,i.tree,a.id,o),u=Il(l,i.tree,a.id,Fl(l,i.tree)),m=Sn(i.level);return h("div",{class:"node-detail",children:[h("h3",{children:a.name}),h("div",{class:"dim",children:[a.kind==="skill"&&d?`${d.category[0].toUpperCase()}${d.category.slice(1)} skill · ${d.element}`:a.kind==="enhance"?"Enhancement":a.kind==="upgrade"?"Upgrade (choose one of two)":a.kind==="key"?"Key passive (choose one)":"Passive",a.max>1?` · rank ${c} of ${a.max}`:c?" · learned":""]}),d&&a.kind==="skill"?h(le,{children:[h("p",{children:hf(d,p?.params??null)}),h("div",{class:"sheet small",children:[p?.params.cost?h("div",{children:[h("span",{children:"Costs"}),p.params.cost," ",r.build.cls.resource.name]}):null,p?.params.generate||d.params.generate?h("div",{children:[h("span",{children:"Gives"}),p?.params.generate??d.params.generate," ",r.build.cls.resource.name]}):null,p?.params.cooldown??d.params.cooldown?h("div",{children:[h("span",{children:"Cooldown"}),(p?.params.cooldown??d.params.cooldown).toFixed(1),"s"]}):null,p&&p.rank>c?h("div",{children:[h("span",{children:"Rank"}),p.rank," (",p.rank-c," from gear)"]}):null]}),c<Dl&&h("p",{class:"dim small",children:"Each rank: 10% more damage."})]}):h("p",{children:a.desc}),h("div",{class:"pair",children:[h("button",{type:"button",class:"btn primary",disabled:!f.ok,onClick:()=>e(a.id),children:c?"Add a point":"Learn"}),h("button",{type:"button",class:"btn",disabled:!u.ok,onClick:()=>t(a.id),children:["Refund",m?` · ${m}`:""]})]}),!f.ok&&h("p",{class:"dim small",children:f.reason}),a.kind==="skill"&&c>0&&h(le,{children:[h("div",{class:"label",children:"Put on the bar"}),h("div",{class:"bar-slots",children:Array.from({length:pa},(g,v)=>{const x=i.bar[v],b=x?Qt(x):null;return h("button",{type:"button",class:`btn slotpick ${x===a.id?"on":""}`,"aria-label":`Slot ${v+1} (${ut(Oi[v])}): ${b?b.name:"empty"}`,onClick:()=>s(v,a.id),children:[h("b",{children:ut(Oi[v])}),h("span",{children:b?b.name:"—"})]})})})]})]})}const pf=[["gameplay","Gameplay"],["access","Accessibility"],["audio","Audio"],["controls","Controls"],["graphics","Graphics"],["data","Saves"]];function mf(a){const e=ma.value,[t,s]=Ie("gameplay"),o=r=>la(r);return h("section",{class:"overlay plate settings",role:"dialog","aria-label":"Settings",children:[h("header",{children:[h("h2",{children:"Settings"}),h("div",{class:"head-actions",children:h("button",{type:"button",class:"x","aria-label":"Close settings",onClick:()=>a.onClose?a.onClose():wa("settings"),children:"×"})})]}),h("div",{class:"settings-layout",children:[h(Pu,{tabs:pf,value:t,onChange:s,label:"Settings sections"}),h("div",{class:"settings-body",role:"tabpanel",children:[t==="gameplay"&&h(le,{children:[h(Pe,{label:"Pick up gear by walking over it",hint:"Off: click gear to pick it up. Glint, tonics and materials are always picked up.",value:e.autoPickup,onChange:r=>o({autoPickup:r})}),h(Pe,{label:"Keep attacking a clicked creature",hint:"Off: one attack for each click.",value:e.autoAttack,onChange:r=>o({autoAttack:r})}),h(Pe,{label:"Menus pause the game",hint:"The pause menu and Settings always pause.",value:e.pauseOnMenu,onChange:r=>o({pauseOnMenu:r})}),h(Pe,{label:"Ask before selling or dropping fine things",value:e.confirmValuable,onChange:r=>o({confirmValuable:r})}),h(pt,{label:"Damage numbers",value:e.damageNumbers,options:[["all","All"],["crits","Critical hits only"],["off","Off"]],onChange:r=>o({damageNumbers:r})}),h(qe,{label:"Damage number size",value:e.damageNumberScale,min:.75,max:1.6,step:.05,onChange:r=>o({damageNumberScale:r})}),h(pt,{label:"Creature health slips",hint:"When a creature's name and health show over it.",value:e.enemyBars,options:[["always","Always"],["combat","In a fight"],["off","Elites only"]],onChange:r=>o({enemyBars:r})}),h(pt,{label:"Label loot on the ground",hint:"Hold Alt (or the right stick) to label everything.",value:e.lootLabels,options:[["all","Everything"],["magic","Magic and finer"],["rare","Rare and finer"],["legendary","Legendary only"]],onChange:r=>o({lootLabels:r})}),h(qe,{label:"Aim assist",hint:"How strongly skills used without a cursor turn toward the creature you face.",value:e.aimAssist,min:0,max:1,step:.05,onChange:r=>o({aimAssist:r})})]}),t==="access"&&h(le,{children:[h("h3",{children:"Seeing"}),h(qe,{label:"Interface size",value:e.uiScale,min:.8,max:1.5,step:.05,onChange:r=>o({uiScale:r})}),h(qe,{label:"Text size",hint:"Lettering in panels, tooltips and messages.",value:e.textScale,min:.9,max:1.6,step:.05,onChange:r=>o({textScale:r})}),h(pt,{label:"Lettering",hint:"Atkinson Hyperlegible is drawn to be easy to tell apart at a glance.",value:e.font,options:[["hand","Hand-lettered"],["legible","Atkinson Hyperlegible"]],onChange:r=>o({font:r})}),h(Pe,{label:"High contrast interface",hint:"Plain white plates and black lettering.",value:e.highContrast,onChange:r=>o({highContrast:r})}),h(pt,{label:"Colour vision",hint:"Changes the colours of rarity and warnings. Rarity is always written out too.",value:e.colorVision,options:[["none","Typical"],["protanopia","Protanopia"],["deuteranopia","Deuteranopia"],["tritanopia","Tritanopia"]],onChange:r=>o({colorVision:r})}),h("div",{class:"rarity-key",children:Object.entries(ya[e.colorVision]).map(([r,i])=>h("span",{style:{color:i},children:r[0].toUpperCase()+r.slice(1)}))}),h(pt,{label:"Colour of warnings on the ground",value:e.dangerColor,options:[["mustard","Mustard"],["magenta","Magenta"],["white","White"]],onChange:r=>o({dangerColor:r})}),h(qe,{label:"Interface opacity",value:e.hudOpacity,min:.5,max:1,step:.05,onChange:r=>o({hudOpacity:r})}),h("h3",{children:"Motion and flashing"}),h(pt,{label:"Reduce motion",hint:"Follows your device unless you choose.",value:e.reducedMotion,options:[["system","As my device"],["on","On"],["off","Off"]],onChange:r=>o({reducedMotion:r})}),h(qe,{label:"Screen shake",value:e.screenShake,min:0,max:1,step:.05,onChange:r=>o({screenShake:r})}),h(Pe,{label:"Hold the world when a blow lands",hint:"A hit-stop of a few hundredths of a second.",value:e.hitStop,onChange:r=>o({hitStop:r})}),h(Pe,{label:"Flash creatures when hit",value:e.flashes,onChange:r=>o({flashes:r})}),h(Pe,{label:"Steady pencil lines",hint:"The hatching is normally laid afresh six times a second, like a hand-drawn film. This holds it still.",value:e.steadyLines,onChange:r=>o({steadyLines:r})}),h(Pe,{label:"Smooth figures",hint:"Figures are normally drawn twelve times a second, like hand animation. This draws them every frame.",value:e.smoothFigures,onChange:r=>o({smoothFigures:r})}),h("h3",{children:"Hearing"}),h(Pe,{label:"Captions for sounds",hint:"Important sounds are written in the message log, with where they come from.",value:e.captions,onChange:r=>o({captions:r})}),h(Pe,{label:"Arrows for blows from off screen",value:e.threatIndicators,onChange:r=>o({threatIndicators:r})}),h(Pe,{label:"Mono sound",value:e.monoAudio,onChange:r=>o({monoAudio:r})}),h("h3",{children:"Timing"}),h(qe,{label:"Game speed",hint:"Slows everything down, the fights included.",value:e.gameSpeed,min:.5,max:1,step:.05,onChange:r=>o({gameSpeed:r})}),h(qe,{label:"Longer warnings",hint:"How long creatures wind up before a blow lands.",value:e.telegraphScale,min:1,max:1.8,step:.05,onChange:r=>o({telegraphScale:r}),fmt:r=>`×${r.toFixed(2)}`}),h(qe,{label:"Messages stay up",value:e.toastSeconds,min:1,max:3,step:.25,onChange:r=>o({toastSeconds:r}),fmt:r=>`×${r.toFixed(2)}`})]}),t==="audio"&&h(le,{children:[h(qe,{label:"Everything",value:e.volMaster,min:0,max:1,step:.05,onChange:r=>o({volMaster:r})}),h(qe,{label:"Music",value:e.volMusic,min:0,max:1,step:.05,onChange:r=>o({volMusic:r})}),h(qe,{label:"Effects",value:e.volSfx,min:0,max:1,step:.05,onChange:r=>o({volSfx:r})}),h(qe,{label:"Ambience",hint:"Wind, water, birds and crickets.",value:e.volAmbience,min:0,max:1,step:.05,onChange:r=>o({volAmbience:r})}),h(qe,{label:"Interface",value:e.volUi,min:0,max:1,step:.05,onChange:r=>o({volUi:r})}),h(Pe,{label:"Silent when the game is hidden",value:e.muteUnfocused,onChange:r=>o({muteUnfocused:r})})]}),t==="controls"&&h(gf,{}),t==="graphics"&&h(le,{children:[h(pt,{label:"Drawing quality",hint:"Auto draws as finely as your machine keeps a smooth frame.",value:e.quality,options:[["auto","Auto"],["high","High"],["low","Light"]],onChange:r=>o({quality:r})}),h(pt,{label:"Frame rate limit",value:e.fpsCap,options:[[0,"None"],[60,"60"],[30,"30"]],onChange:r=>o({fpsCap:r})}),h(Pe,{label:"Show frame rate",value:e.showFps,onChange:r=>o({showFps:r})})]}),t==="data"&&h(vf,{store:a.store,account:a.account})]})]})]})}function gf(){const a=ma.value,e=K(),[t,s]=Ie(null),o=(r,i)=>{s(`${r}:${i}`),e.input.captureNext((l,c)=>{if(s(null),l==="Escape")return;const d={...a.keys},p={...a.pad};if(i==="pad"){if(c!=="pad"){ae("Press a button on the gamepad.");return}for(const f of Oo)p[f]===l&&f!==r&&Kt[f].group!=="Interface"&&(p[f]=null);p[r]=l}else{if(c!=="key"){ae("Press a key or a mouse button.");return}if(l.startsWith("Mouse")&&!("mouse"in Kt[r])){ae("That action needs a key.");return}for(const u of Oo){const m=d[u];u!==r&&(m[0]===l||m[1]===l)&&(d[u]=[m[0]===l?null:m[0],m[1]===l?null:m[1]],Te("Moved",`${ns(l)} no longer does “${Kt[u].label}”.`))}const f=d[r];d[r]=i===0?[l,f[1]]:[f[0],l]}la({keys:d,pad:p})})};return h(le,{children:[h("p",{class:"dim",children:"Choose a box, then press the key, mouse button or pad button for it. Esc leaves it as it was."}),["Movement","Combat","Camera","Interface"].map(r=>h("div",{class:"bindings",children:[h("h3",{children:r}),Oo.filter(i=>Kt[i].group===r).map(i=>h("div",{class:"binding",children:[h("span",{children:Kt[i].label}),[0,1].map(l=>h("button",{type:"button",class:`key ${t===`${i}:${l}`?"wait":""}`,onClick:()=>o(i,l),"aria-label":`${Kt[i].label}, ${l?"second":"first"} key: ${ns(a.keys[i][l])||"none"}`,children:t===`${i}:${l}`?"Press…":ns(a.keys[i][l])||"—"})),h("button",{type:"button",class:`key pad ${t===`${i}:pad`?"wait":""}`,onClick:()=>o(i,"pad"),"aria-label":`${Kt[i].label}, gamepad: ${fo(a.pad[i])||"none"}`,children:t===`${i}:pad`?"Press…":fo(a.pad[i])||"—"})]}))]})),h("div",{class:"row",children:h("button",{type:"button",class:"btn",onClick:()=>la({keys:Gn,pad:Yn}),children:"Put every control back"})}),h("h3",{children:"Camera"}),h(qe,{label:"Turning speed",value:a.camSensitivity,min:.3,max:2.5,step:.05,onChange:r=>la({camSensitivity:r}),fmt:r=>`×${r.toFixed(2)}`}),h(Pe,{label:"Turn the other way",value:a.invertCamX,onChange:r=>la({invertCamX:r})}),h(Pe,{label:"Tilt the other way",value:a.invertCamY,onChange:r=>la({invertCamY:r})}),h(Pe,{label:"Gamepad rumble",value:a.vibration,onChange:r=>la({vibration:r})})]})}function vf({store:a,account:e}){return!a||!e?h("p",{class:"dim",children:"Saves can be managed from the title screen."}):h(le,{children:[h("p",{children:"Your heroes and stash are kept in this browser. Keep a copy, or move them to another browser or device."}),h("div",{class:"pair",children:[h("button",{type:"button",class:"btn",onClick:()=>{const o=new Blob([a.exportAll(e)],{type:"application/json"}),n=document.createElement("a");n.href=URL.createObjectURL(o),n.download=`brushwild-save-${new Date().toISOString().slice(0,10)}.json`,n.click(),setTimeout(()=>URL.revokeObjectURL(n.href),2e3)},children:"Save a copy to a file"}),h("label",{class:"btn file",children:["Load from a file",h("input",{type:"file",accept:"application/json,.json",onChange:o=>{const n=o.currentTarget.files?.[0];n&&n.text().then(r=>{ua("Replace your saves?","Every hero and the stash here will be replaced by the ones in the file.","Replace",()=>{a.importAll(r)?(Te("Saves loaded","Reloading…"),setTimeout(()=>location.reload(),900)):ae("That file is not a Brushwild save.")},!0)})}})]})]}),a.failed&&h("p",{class:"bad",children:"This browser is refusing to save (a private window, or storage is full). Keep a copy in a file."})]})}const ji={warden:{tunic:0,hair:0},emberwright:{tunic:1,hair:1},strider:{tunic:2,hair:2},cyborg:{tunic:5,hair:2}};function yf({session:a}){A.heroes.value;const e=a.heroes(),t=St(null);Qe(()=>{t.current?.focus({preventScroll:!0})},[]);const s=e[0];return h("div",{id:"title",children:h("div",{class:"title-card",children:[h("h1",{children:"Brushwild"}),h("p",{class:"tag",children:"An open world drawn in pen and pencil"}),h("div",{class:"title-actions",children:[s?h("button",{ref:t,type:"button",class:"primary",onClick:()=>a.play(s.id),children:["Continue · ",s.name,", level ",s.level," ",Fe[s.classId].name]}):h("button",{ref:t,type:"button",class:"primary",onClick:()=>A.screen.value="create",children:"Begin a journey"}),e.length>0&&h("button",{type:"button",onClick:()=>A.screen.value="heroes",children:"Choose a hero"}),e.length>0&&h("button",{type:"button",onClick:()=>A.screen.value="create",children:"New hero"}),h("button",{type:"button",onClick:()=>dt("settings"),children:"Settings"})]}),h("p",{class:"keys",children:K().touch?"Tap to move and fight · the stick walks · drag the picture to turn the view":"Click to move and fight · WASD to walk · Space to evade · 1–4 and right click for skills"})]})})}function bf({session:a}){A.heroes.value;const e=a.heroes();return h("div",{id:"title",children:h("section",{class:"title-card heroes",role:"dialog","aria-label":"Choose a hero",children:[h("h2",{children:"Your heroes"}),h("ul",{class:"hero-list",children:e.map(t=>h("li",{class:"hero",children:[h("button",{type:"button",class:"hero-play",onClick:()=>a.play(t.id),children:[h("strong",{children:t.name}),h("span",{children:["Level ",t.level," ",Fe[t.classId].name," · ",vt[t.difficulty]?.name??"Normal"," · ",Math.floor(t.played/3600),"h ",Math.floor(t.played/60)%60,"m"]})]}),h("button",{type:"button",class:"btn danger small","aria-label":`Let ${t.name} go`,onClick:()=>ua(`Let ${t.name} go?`,`${t.name}, level ${t.level}, and everything they carry will be gone for good. The stash is kept.`,"Let them go",()=>a.remove(t.id),!0),children:"Let go"})]}))}),h("div",{class:"pair",children:[h("button",{type:"button",class:"btn",onClick:()=>A.screen.value="title",children:"Back"}),h("button",{type:"button",class:"btn primary",onClick:()=>A.screen.value="create",children:"New hero"})]})]})})}function xf({session:a}){const[e,t]=Ie("warden"),[s,o]=Ie(ji.warden),[n,r]=Ie(""),[i,l]=Ie("normal"),c=Fe[e];Qe(()=>{a.preview(e,s)},[e,s.tunic,s.hair]),Qe(()=>()=>a.endPreview(),[]);const d=f=>{t(f),o(ji[f])},p=()=>{A.screen.value=a.heroes().length?"heroes":"title"};return h("div",{id:"title",class:"side",children:h("section",{class:"title-card create",role:"dialog","aria-label":"A new hero",children:[h("h2",{children:"A new hero"}),h("div",{class:"classes",role:"radiogroup","aria-label":"Class",children:Tl.map(f=>h("button",{type:"button",role:"radio","aria-checked":f.id===e,class:`class-card ${f.id===e?"on":""}`,onClick:()=>d(f.id),children:[h(fr,{class:"class-art",deps:f.id,paint:u=>Tu(f.id,u)}),h("strong",{children:[f.name,f.startLevel?h("em",{class:"class-level",children:["Lv ",f.startLevel]}):null]}),h("small",{children:f.tagline}),h("span",{class:"class-skills",children:f.start.map(u=>{const m=Qt(u);return h(ta,{svg:Ro(m.icon,m.element)})})})]}))}),h("p",{class:"about",children:c.about}),h("div",{class:"sheet",children:[h("div",{children:[h("span",{children:"Leans on"}),so[c.primary].name]}),h("div",{children:[h("span",{children:"Fights with"}),c.resource.name]}),h("div",{children:[h("span",{children:"Wields"}),c.weapons.join(", ")]}),c.startLevel?h("div",{children:[h("span",{children:"Begins at"}),"Level ",c.startLevel,", every skill maxed"]}):h("div",{children:[h("span",{children:"Begins with"}),c.start.map(f=>Qt(f).name).join(" and ")]})]}),h(Ui,{label:e==="emberwright"?"Robe":e==="cyborg"?"Armour":"Tunic",list:Tn,value:s.tunic,onPick:f=>o({...s,tunic:f})}),e!=="cyborg"&&h(Ui,{label:"Hair",list:Cn,value:s.hair,onPick:f=>o({...s,hair:f})}),h("label",{class:"name-field",children:[h("span",{children:"Name"}),h("input",{type:"text",maxLength:20,value:n,placeholder:c.heroName??c.name,onInput:f=>r(f.currentTarget.value)})]}),h(pt,{label:"Difficulty",hint:vt[i].desc+" It can be changed later, in a town.",value:i,options:Object.entries(vt).filter(([f])=>f!=="nightmare").map(([f,u])=>[f,u.name]),onChange:l}),h("div",{class:"pair",children:[h("button",{type:"button",class:"btn",onClick:p,children:"Back"}),h("button",{type:"button",class:"btn primary",onClick:()=>a.create(e,n,i,s),children:"Begin"})]})]})})}function Ui({label:a,list:e,value:t,onPick:s}){return h("div",{class:"swatches",role:"radiogroup","aria-label":a,children:[h("span",{children:a}),e.map((o,n)=>h("button",{type:"button",role:"radio","aria-checked":n===t,"aria-label":o.name,title:o.name,class:`swatch ${n===t?"on":""}`,style:{background:`rgb(${o.rgb.join(",")})`},onClick:()=>s(n)}))]})}function wf({session:a}){const e=St(null);return Qe(()=>{e.current?.focus()},[]),h("section",{class:"overlay plate menu",role:"dialog","aria-label":"Menu",children:[h("h2",{children:"Paused"}),h("button",{ref:e,type:"button",class:"btn primary",onClick:()=>ja(),children:"Back to the game"}),h("button",{type:"button",class:"btn",onClick:()=>dt("skills"),children:"Skill tree"}),h("button",{type:"button",class:"btn",onClick:()=>dt("settings"),children:"Settings"}),h("button",{type:"button",class:"btn",onClick:()=>dt("help"),children:"How to play"}),h("button",{type:"button",class:"btn",onClick:()=>{ja(),K().bus.emit("guide:restart")},children:"Show me the first steps again"}),h("button",{type:"button",class:"btn",onClick:()=>a.quitToTitle(),children:"Save and go to the title"})]})}function kf(){const a=K(),e=ut,t=a.touch?[["Stick","Your left thumb walks. Push it part-way to stroll."],["Tap","Tap the picture to walk to a spot, attack a creature or talk to townsfolk."],["Big button","Uses your first skill on the nearest creature, talks, or opens a door. Hold it to keep fighting."],["Round buttons","Your other skills, a tonic and Evade."],["Drag / pinch","Turn and tilt the view, and zoom."]]:[["Left click",`Walk; click a creature to fight it with your first skill (${e("slot1")}).`],[`${e("slot2")}, ${e("slot3")}–${e("slot6")}`,"Your other skills. They aim at your target, or at the cursor."],[e("evade"),"Evade: a quick roll, untouchable while it lasts. Every hero has it."],[e("potion"),"Drink a tonic. Waystones refill them."],[e("interact"),"Attack the nearest creature, talk, or use a door."],["W A S D","Walk by hand."],[`${e("standStill")} + click`,"Attack where you point without moving."],["Right drag, Q / E, wheel","Turn, tilt and zoom the view."],[`${e("inventory")} · ${e("character")} · ${e("skills")}`,"Inventory, character sheet, skill tree."],[`${e("map")} · ${e("journal")} · Esc`,"Map and waystones, journal, menu."],[e("showLabels"),"Hold to label every item on the ground, and see each line’s possible range in tooltips."]];return h("section",{class:"overlay plate help",role:"dialog","aria-label":"How to play",children:[h("header",{children:[h("h2",{children:"How to play"}),h("div",{class:"head-actions",children:h("button",{type:"button",class:"x","aria-label":"Close",onClick:()=>wa("help"),children:"×"})})]}),h("div",{class:"body",children:[h("div",{class:"keys-list",children:t.map(([s,o])=>h(le,{children:[h("kbd",{children:s}),h("span",{children:o})]}))}),h("p",{class:"dim",children:"Every level gives a skill point for the skill tree. Basic skills build your resource; Core skills spend it. Each skill can be enhanced, then upgraded one of two ways."}),h("p",{class:"dim",children:"Gear comes in five rarities: Common, Magic, Rare, Legendary (with a power of its own) and Unique. Compare in the tooltip; smiths salvage what you do not want and enchant what you keep."}),h("p",{class:"dim",children:"Mustard hatching on the ground means a blow is coming there: step out of it, or Evade through it. The farther from Hearthmere, the stronger the wilds; crypts and hollows hold an Inkbound and a hoard."})]})]})}const Mf=lc(()=>{const a=St(null),e=St(null);return Qe(()=>{const t=K(),s=new Gu(t,a.current,e.current);return t.bus.on("frame",o=>{A.screen.value==="game"&&s.update(o)})},[]),h(le,{children:[h("div",{id:"plates",ref:a,"aria-hidden":"true"}),h("div",{id:"floaters",ref:e,"aria-hidden":"true"})]})},()=>!0),_f=lc(()=>{const a=St(null);return Qe(()=>Vu(K(),a.current),[]),h("div",{id:"stick",ref:a,"aria-hidden":"true",children:h("div",{class:"base",children:h("div",{class:"nub"})})})},()=>!0);function zf({session:a,store:e,account:t}){const s=A.screen.value,o=A.open.value,n=i=>o.includes(i),r=s==="game";return h(le,{children:[h("div",{id:"ui",children:[h(Mf,{}),h(_f,{}),r&&h(Wu,{})]}),h("div",{id:"panels",children:[r&&n("character")&&h(Ju,{}),r&&n("journal")&&h(rf,{}),r&&n("vendor")&&h(ef,{}),r&&n("stash")&&h(sf,{}),r&&n("bounty")&&h(of,{}),r&&n("inventory")&&h(Zu,{}),r&&n("map")&&h(nf,{}),r&&n("view")&&h(lf,{}),r&&n("skills")&&h(uf,{}),r&&n("menu")&&h(wf,{session:a}),r&&n("help")&&h(kf,{}),n("settings")&&h(mf,{store:e,account:t})]}),s==="title"&&!n("settings")&&h(yf,{session:a}),s==="heroes"&&h(bf,{session:a}),s==="create"&&h(xf,{session:a}),h(Cu,{}),h(Au,{})]})}const Sf='button:not(:disabled), input, select, [tabindex="0"]',Tf=.18;function Cf(a){let e=0,t="";a.bus.on("frame",s=>{if(!(A.screen.value!=="game"||A.open.value.length>0||!!A.confirm.value)||a.input.lastDevice!=="pad")return;const n=a.input.padPressed,r=a.input.padHeld,i=a.input.padLeft;let l="";r.has("Up")||i.y>.6?l="up":r.has("Down")||i.y<-.6?l="down":r.has("Left")||i.x<-.6?l="left":(r.has("Right")||i.x>.6)&&(l="right"),l&&(l!==t||(e+=s)>Tf)&&(e=0,Pf(l)),l||(e=0),t=l;const c=document.activeElement;if(n.has("A")&&c&&c!==document.body&&c.click(),n.has("B")&&(A.confirm.value?A.confirm.value=null:A.open.value.length&&ja()),n.has("RB")||n.has("LB")){const d=[...document.querySelectorAll('[role="tab"]')],p=d.findIndex(u=>u.getAttribute("aria-selected")==="true"),f=d[(p+(n.has("RB")?1:-1)+d.length)%d.length];f?.click(),f?.focus()}})}function Pf(a){const t=[...(document.querySelector(".scrim")??document.querySelector(".overlay")??document.querySelector("#panels .panel, #title")??document.body).querySelectorAll(Sf)].filter(c=>c.offsetParent!==null);if(!t.length)return;const s=document.activeElement;if(!s||!t.includes(s)){t[0].focus();return}const o=s.getBoundingClientRect(),n=o.left+o.width/2,r=o.top+o.height/2;let i=null,l=1e9;for(const c of t){if(c===s)continue;const d=c.getBoundingClientRect(),p=d.left+d.width/2,f=d.top+d.height/2,u=p-n,m=f-r,g=a==="up"?-m:a==="down"?m:a==="left"?-u:u,v=Math.abs(a==="up"||a==="down"?u:m);if(g<=2)continue;const x=g+v*2.2;x<l&&(l=x,i=c)}i?.focus(),i?.scrollIntoView({block:"nearest"})}const un=document.getElementById("view");function Af(a){console.error(a);const e=document.getElementById("fatal");e.hidden=!1,e.querySelector("p").textContent=String(a?.message||a)}try{let a=function(){i.resize();const u=document.getElementById("map-ring"),m=un.getBoundingClientRect();if(!u){i.renderer.minimap.rect=[0,0,0,0];return}const g=u.getBoundingClientRect(),v=A.screen.value==="game";i.renderer.minimap.rect=[g.left-m.left+g.width/2,g.top-m.top+g.height/2,v?g.width/2-3:0,.62*Math.max(1,150/Math.max(g.width,1))]};const e=C0(),t=new bh,s=t.loadAccount(),o=new URLSearchParams(location.search).has("new");o&&history.replaceState(null,"",location.pathname+location.hash);const n=s.heroes[0],r=n&&t.loadCharacter(n)||$a("warden","Wayfarer",s.seed),i=new ph(un,{seed:s.seed,touch:Nc.touch,settings:e,char:r,persist:u=>t.saveCharacter(u,s),stash:s.stash,persistAccount:()=>t.saveAccount(s)});window.__game=i,qh(e,i),Nh(i);const l=()=>{Object.assign(i.camera.goal,{pitch:.3,distance:32}),Object.assign(i.camera,{pitch:.3,distance:32}),i.look.fadeGoal=1};let c=!1,d=0;const p=u=>{c=!1,i.camera.shift=0,i.camera.portrait=!1,i.loadCharacter(u),ja(),document.body.classList.remove("titled"),A.screen.value="game",i.begin();const[m,g]=u.view??[qa.behind[0],qa.behind[1]*(i.touch?.9:1)];Object.assign(i.camera.goal,{pitch:m,distance:g}),i.player.yaw=Math.PI-i.camera.goal.yaw,setTimeout(a,30),t.failed&&Te("This browser will not keep your journey","A private window, or full storage. Settings › Saves can keep a copy in a file.",6)};Fc(Fa(zf,{session:{heroes:()=>t.summaries(s),play(u){const m=t.loadCharacter(u);m&&p(m)},create(u,m,g,v){const x=$a(u,m,Date.now()^s.seed);x.difficulty=g,x.look=v,t.saveCharacter(x,s),A.heroes.value++,p(x)},remove(u){t.deleteCharacter(u,s),A.heroes.value++},preview(u,m){const g=$a(u,Fe[u].name,s.seed);g.look=m,g.pos={x:0,z:4.2},i.loadCharacter(g);const v=5.2;Object.assign(i.camera.goal,{pitch:.16,distance:v,yaw:0}),c||Object.assign(i.camera,{yaw:0,pitch:.3,distance:9}),i.camera.portrait=!0;const x=innerWidth,b=innerHeight,y=Math.min(64,Math.max(16,x*.04))+Math.min(540,x-32),k=x>=760?((y+x)/2-x/2)/(x/2):0;i.camera.shift=k*v*Math.tan(17*Math.PI/180)*(x/b),c=!0,d=1.4},endPreview(){if(!c||i.started)return;c=!1,i.camera.shift=0,i.camera.portrait=!1;const u=s.heroes[0],m=u&&t.loadCharacter(u);i.loadCharacter(m||$a("warden","Wayfarer",s.seed)),l()},quitToTitle(){i.save(),ja(),i.started=!1,i.paused=!0,document.body.classList.add("titled"),A.screen.value="title",A.heroes.value++,l()}},store:t,account:s}),document.getElementById("app")),(o||!s.heroes.length)&&(A.screen.value=o?"create":"title"),l(),i.bus.on("frame",u=>{i.started||!i.paused||(c?(i.player.yaw=-i.camera.yaw+.5*Math.sin(i.time*.5),d=Math.max(0,d-u),i.player.face=d>0?ze.joy:ze.content):i.reducedMotion||(i.camera.goal.yaw+=u*.06))}),i.bus.on("begin",()=>document.body.classList.remove("titled")),Yu(i,()=>{i.resize(),A.rev.value++}),Cf(i),addEventListener("resize",a),new ResizeObserver(a).observe(un),i.bus.on("frame",()=>{A.frame.value%30===0&&a()}),Lc(()=>import("./audio-C38nEeI6.js"),[],import.meta.url).then(u=>{u.createAudio(i),Rh(i)}).catch(u=>console.warn("Audio unavailable:",u)),i.start()}catch(a){Af(a)}
//# sourceMappingURL=index-CIpl0XNi.js.map
