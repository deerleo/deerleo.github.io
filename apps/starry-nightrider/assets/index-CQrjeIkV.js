const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/wheat-DL0atyN8.js","assets/three.core-DAbgpcjl.js","assets/kit-Cxemqfuf.js","assets/rhone-DTHJGiQE.js","assets/cypress-DGzi-Ym0.js","assets/cafe-D3RBdeD2.js","assets/hails-DeolUH4Z.js","assets/xr-zUFpdOti.js"])))=>i.map(i=>d[i]);
import{$ as e,A as t,An as n,B as r,Bt as i,C as a,Cn as o,D as s,Dn as c,E as l,En as u,F as d,G as f,H as p,Ht as m,I as h,It as g,J as _,Jt as v,K as y,L as b,Lt as x,N as S,O as C,On as w,P as T,Q as E,R as D,Rt as O,S as k,Sn as A,T as j,Tn as M,U as N,V as P,Vt as ee,W as te,X as ne,Xt as F,Yt as re,Z as ie,_ as ae,_n as oe,a as I,an as se,at as ce,b as L,bn as le,cn as ue,d as de,dn as fe,f as pe,fn as me,g as he,gn as ge,h as _e,hn as R,i as ve,in as ye,j as be,jn as xe,kn as Se,l as Ce,m as we,mn as Te,n as z,nn as Ee,on as De,ot as Oe,p as ke,pn as Ae,q as je,qt as Me,r as Ne,rn as Pe,tn as Fe,tt as Ie,u as Le,un as Re,v as ze,vn as Be,w as Ve,wn as He,x as Ue,xn as We,y as B,yn as Ge,z as V}from"./three.core-DAbgpcjl.js";import{$ as Ke,B as H,C as qe,Ct as U,D as W,E as Je,F as Ye,G as Xe,H as Ze,I as Qe,J as $e,K as et,L as tt,M as nt,N as rt,O as it,P as at,Q as ot,R as st,S as ct,St as lt,T as ut,Tt as dt,U as ft,V as pt,W as mt,X as ht,Y as gt,Z as _t,_ as vt,_t as yt,a as bt,at as xt,b as St,bt as Ct,ct as G,dt as K,et as wt,ft as Tt,g as Et,gt as Dt,ht as Ot,it as kt,j as At,k as jt,lt as Mt,mt as Nt,nt as Pt,ot as Ft,pt as It,q as Lt,rt as Rt,s as zt,st as Bt,t as Vt,tt as Ht,ut as Ut,v as Wt,vt as Gt,wt as Kt,xt as qt,y as Jt,yt as Yt,z as Xt}from"./kit-Cxemqfuf.js";import{i as Zt,o as Qt}from"./hails-DeolUH4Z.js";(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),t.credentials=e.crossOrigin===`use-credentials`?`include`:e.crossOrigin===`anonymous`?`omit`:`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})();function $t(){let e=null,t=!1,n=null,r=null;function i(t,a){r=e.requestAnimationFrame(i),n(t,a)}return{start:function(){t!==!0&&n!==null&&e!==null&&(r=e.requestAnimationFrame(i),t=!0)},stop:function(){e!==null&&e.cancelAnimationFrame(r),t=!1},setAnimationLoop:function(e){n=e},setContext:function(t){e=t}}}function en(e){let t=new WeakMap;function n(t,n){let r=t.array,i=t.usage,a=r.byteLength,o=e.createBuffer();e.bindBuffer(n,o),e.bufferData(n,r,i),t.onUploadCallback();let s;if(r instanceof Float32Array)s=e.FLOAT;else if(typeof Float16Array<`u`&&r instanceof Float16Array)s=e.HALF_FLOAT;else if(r instanceof Uint16Array)s=t.isFloat16BufferAttribute?e.HALF_FLOAT:e.UNSIGNED_SHORT;else if(r instanceof Int16Array)s=e.SHORT;else if(r instanceof Uint32Array)s=e.UNSIGNED_INT;else if(r instanceof Int32Array)s=e.INT;else if(r instanceof Int8Array)s=e.BYTE;else if(r instanceof Uint8Array)s=e.UNSIGNED_BYTE;else if(r instanceof Uint8ClampedArray)s=e.UNSIGNED_BYTE;else throw Error(`THREE.WebGLAttributes: Unsupported buffer data format: `+r);return{buffer:o,type:s,bytesPerElement:r.BYTES_PER_ELEMENT,version:t.version,size:a}}function r(t,n,r){let i=n.array,a=n.updateRanges;if(e.bindBuffer(r,t),a.length===0)e.bufferSubData(r,0,i);else{a.sort((e,t)=>e.start-t.start);let t=0;for(let e=1;e<a.length;e++){let n=a[t],r=a[e];r.start<=n.start+n.count+1?n.count=Math.max(n.count,r.start+r.count-n.start):(++t,a[t]=r)}a.length=t+1;for(let t=0,n=a.length;t<n;t++){let n=a[t];e.bufferSubData(r,n.start*i.BYTES_PER_ELEMENT,i,n.start,n.count)}n.clearUpdateRanges()}n.onUploadCallback()}function i(e){return e.isInterleavedBufferAttribute&&(e=e.data),t.get(e)}function a(n){n.isInterleavedBufferAttribute&&(n=n.data);let r=t.get(n);r&&(e.deleteBuffer(r.buffer),t.delete(n))}function o(e,i){if(e.isInterleavedBufferAttribute&&(e=e.data),e.isGLBufferAttribute){let n=t.get(e);(!n||n.version<e.version)&&t.set(e,{buffer:e.buffer,type:e.type,bytesPerElement:e.elementSize,version:e.version});return}let a=t.get(e);if(a===void 0)t.set(e,n(e,i));else if(a.version<e.version){if(a.size!==e.array.byteLength)throw Error(`THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.`);r(a.buffer,e,i),a.version=e.version}}return{get:i,remove:a,update:o}}var tn={alphahash_fragment:`#ifdef USE_ALPHAHASH
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
}`},q={common:{diffuse:{value:new Le(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new V},alphaMap:{value:null},alphaMapTransform:{value:new V},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new V}},envmap:{envMap:{value:null},envMapRotation:{value:new V},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98},dfgLUT:{value:null}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new V}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new V}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new V},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new V},normalScale:{value:new Te(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new V},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new V}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new V}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new V}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new Le(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},sunLights:{value:[],properties:{direction:{},color:{}}},sunLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},sunShadowMatrix:{value:[]},sunShadowCascade:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null},probesSH:{value:[]},probesMin:{value:[]},probesMax:{value:[]},probesResolution:{value:[]}},points:{diffuse:{value:new Le(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new V},alphaTest:{value:0},uvTransform:{value:new V}},sprite:{diffuse:{value:new Le(16777215)},opacity:{value:1},center:{value:new Te(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new V},alphaMap:{value:null},alphaMapTransform:{value:new V},alphaTest:{value:0}}},nn={basic:{uniforms:w([q.common,q.specularmap,q.envmap,q.aomap,q.lightmap,q.fog]),vertexShader:tn.meshbasic_vert,fragmentShader:tn.meshbasic_frag},lambert:{uniforms:w([q.common,q.specularmap,q.envmap,q.aomap,q.lightmap,q.emissivemap,q.bumpmap,q.normalmap,q.displacementmap,q.fog,q.lights,{emissive:{value:new Le(0)},envMapIntensity:{value:1}}]),vertexShader:tn.meshlambert_vert,fragmentShader:tn.meshlambert_frag},phong:{uniforms:w([q.common,q.specularmap,q.envmap,q.aomap,q.lightmap,q.emissivemap,q.bumpmap,q.normalmap,q.displacementmap,q.fog,q.lights,{emissive:{value:new Le(0)},specular:{value:new Le(1118481)},shininess:{value:30},envMapIntensity:{value:1}}]),vertexShader:tn.meshphong_vert,fragmentShader:tn.meshphong_frag},standard:{uniforms:w([q.common,q.envmap,q.aomap,q.lightmap,q.emissivemap,q.bumpmap,q.normalmap,q.displacementmap,q.roughnessmap,q.metalnessmap,q.fog,q.lights,{emissive:{value:new Le(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:tn.meshphysical_vert,fragmentShader:tn.meshphysical_frag},toon:{uniforms:w([q.common,q.aomap,q.lightmap,q.emissivemap,q.bumpmap,q.normalmap,q.displacementmap,q.gradientmap,q.fog,q.lights,{emissive:{value:new Le(0)}}]),vertexShader:tn.meshtoon_vert,fragmentShader:tn.meshtoon_frag},matcap:{uniforms:w([q.common,q.bumpmap,q.normalmap,q.displacementmap,q.fog,{matcap:{value:null}}]),vertexShader:tn.meshmatcap_vert,fragmentShader:tn.meshmatcap_frag},points:{uniforms:w([q.points,q.fog]),vertexShader:tn.points_vert,fragmentShader:tn.points_frag},dashed:{uniforms:w([q.common,q.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:tn.linedashed_vert,fragmentShader:tn.linedashed_frag},depth:{uniforms:w([q.common,q.displacementmap]),vertexShader:tn.depth_vert,fragmentShader:tn.depth_frag},normal:{uniforms:w([q.common,q.bumpmap,q.normalmap,q.displacementmap,{opacity:{value:1}}]),vertexShader:tn.meshnormal_vert,fragmentShader:tn.meshnormal_frag},sprite:{uniforms:w([q.sprite,q.fog]),vertexShader:tn.sprite_vert,fragmentShader:tn.sprite_frag},background:{uniforms:{uvTransform:{value:new V},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:tn.background_vert,fragmentShader:tn.background_frag},backgroundCube:{uniforms:{envMap:{value:null},backgroundBlurriness:{value:0},backgroundIntensity:{value:1},backgroundRotation:{value:new V}},vertexShader:tn.backgroundCube_vert,fragmentShader:tn.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:tn.cube_vert,fragmentShader:tn.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:tn.equirect_vert,fragmentShader:tn.equirect_frag},distance:{uniforms:w([q.common,q.displacementmap,{referencePosition:{value:new R},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:tn.distance_vert,fragmentShader:tn.distance_frag},shadow:{uniforms:w([q.lights,q.fog,{color:{value:new Le(0)},opacity:{value:1}}]),vertexShader:tn.shadow_vert,fragmentShader:tn.shadow_frag}};nn.physical={uniforms:w([nn.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new V},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new V},clearcoatNormalScale:{value:new Te(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new V},diffuseRoughness:{value:0},diffuseRoughnessMap:{value:null},diffuseRoughnessMapTransform:{value:new V},dispersion:{value:0},retroreflectivity:{value:0},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new V},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new V},sheen:{value:0},sheenColor:{value:new Le(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new V},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new V},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new V},transmissionSamplerSize:{value:new Te},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new V},attenuationDistance:{value:0},attenuationColor:{value:new Le(0)},specularColor:{value:new Le(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new V},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new V},anisotropyVector:{value:new Te},anisotropyMap:{value:null},anisotropyMapTransform:{value:new V}}]),vertexShader:tn.meshphysical_vert,fragmentShader:tn.meshphysical_frag};var rn={r:0,b:0,g:0},an=new r,on=new V;on.set(-1,0,0,0,1,0,0,0,1);function sn(e,t,n,r,i,a){let o=new Le(0),s=i===!0?0:1,c,l,d=null,f=0,p=null;function m(e){let n=e.isScene===!0?e.background:null;if(n&&n.isTexture){let r=e.backgroundBlurriness>0;n=t.get(n,r)}return n}function h(t){let r=!1,i=m(t);i===null?_(o,s):i&&i.isColor&&(_(i,1),r=!0);let c=e.xr.getEnvironmentBlendMode();c===`additive`?n.buffers.color.setClear(0,0,0,1,a):c===`alpha-blend`&&n.buffers.color.setClear(0,0,0,0,a),(e.autoClear||r)&&(n.buffers.depth.setTest(!0),n.buffers.depth.setMask(!0),n.buffers.color.setMask(!0),e.clear(e.autoClearColor,e.autoClearDepth,e.autoClearStencil))}function g(t,n){let i=m(n);i&&i.isCubeTexture?(l===void 0&&(l=new P(new Ne(1,1,1),new F({name:`BackgroundCubeMaterial`,uniforms:le(nn.backgroundCube.uniforms),vertexShader:nn.backgroundCube.vertexShader,fragmentShader:nn.backgroundCube.fragmentShader,side:1,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),l.geometry.deleteAttribute(`normal`),l.geometry.deleteAttribute(`uv`),l.onBeforeRender=function(e,t,n){this.matrixWorld.copyPosition(n.matrixWorld)},Object.defineProperty(l.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),r.update(l)),l.material.uniforms.envMap.value=i,l.material.uniforms.backgroundBlurriness.value=n.backgroundBlurriness,l.material.uniforms.backgroundIntensity.value=n.backgroundIntensity,l.material.uniforms.backgroundRotation.value.setFromMatrix4(an.makeRotationFromEuler(n.backgroundRotation)).transpose(),i.isRenderTargetTexture===!1&&l.material.uniforms.backgroundRotation.value.premultiply(on),l.material.toneMapped=de.getTransfer(i.colorSpace)!==v,(d!==i||f!==i.version||p!==e.toneMapping)&&(l.material.needsUpdate=!0,d=i,f=i.version,p=e.toneMapping),l.layers.enableAll(),t.unshift(l,l.geometry,l.material,0,0,null)):i&&i.isTexture&&(c===void 0&&(c=new P(new E(2,2),new F({name:`BackgroundMaterial`,uniforms:le(nn.background.uniforms),vertexShader:nn.background.vertexShader,fragmentShader:nn.background.fragmentShader,side:0,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),c.geometry.deleteAttribute(`normal`),Object.defineProperty(c.material,"map",{get:function(){return this.uniforms.t2D.value}}),r.update(c)),c.material.uniforms.t2D.value=i,c.material.uniforms.backgroundIntensity.value=n.backgroundIntensity,c.material.toneMapped=de.getTransfer(i.colorSpace)!==v,i.matrixAutoUpdate===!0&&i.updateMatrix(),c.material.uniforms.uvTransform.value.copy(i.matrix),(d!==i||f!==i.version||p!==e.toneMapping)&&(c.material.needsUpdate=!0,d=i,f=i.version,p=e.toneMapping),c.layers.enableAll(),t.unshift(c,c.geometry,c.material,0,0,null))}function _(t,r){t.getRGB(rn,u(e)),n.buffers.color.setClear(rn.r,rn.g,rn.b,r,a)}function y(){l!==void 0&&(l.geometry.dispose(),l.material.dispose(),l=void 0),c!==void 0&&(c.geometry.dispose(),c.material.dispose(),c=void 0)}return{getClearColor:function(){return o},setClearColor:function(e,t=1){o.set(e),s=t,_(o,s)},getClearAlpha:function(){return s},setClearAlpha:function(e){s=e,_(o,s)},render:h,addToRenderList:g,dispose:y}}function cn(e,t){let n=e.getParameter(e.MAX_VERTEX_ATTRIBS),r={},i=f(null),a=i,o=!1;function s(n,r,i,s,c){let u=!1,f=d(n,s,i,r);a!==f&&(a=f,l(a.object)),u=p(n,s,i,c),u&&m(n,s,i,c),c!==null&&t.update(c,e.ELEMENT_ARRAY_BUFFER),(u||o)&&(o=!1,b(n,r,i,s),c!==null&&e.bindBuffer(e.ELEMENT_ARRAY_BUFFER,t.get(c).buffer))}function c(){return e.createVertexArray()}function l(t){return e.bindVertexArray(t)}function u(t){return e.deleteVertexArray(t)}function d(e,t,n,i){let a=i.wireframe===!0,o=r[t.id];o===void 0&&(o={},r[t.id]=o);let s=e.isInstancedMesh===!0?e.id:0,l=o[s];l===void 0&&(l={},o[s]=l);let u=l[n.id];u===void 0&&(u={},l[n.id]=u);let d=u[a];return d===void 0&&(d=f(c()),u[a]=d),d}function f(e){let t=[],r=[],i=[];for(let e=0;e<n;e++)t[e]=0,r[e]=0,i[e]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:t,enabledAttributes:r,attributeDivisors:i,object:e,attributes:{},index:null}}function p(e,t,n,r){let i=a.attributes,o=t.attributes,s=0,c=n.getAttributes();for(let t in c)if(c[t].location>=0){let n=i[t],r=o[t];if(r===void 0&&(t===`instanceMatrix`&&e.instanceMatrix&&(r=e.instanceMatrix),t===`instanceColor`&&e.instanceColor&&(r=e.instanceColor)),n===void 0||n.attribute!==r||r&&n.data!==r.data)return!0;s++}return a.attributesNum!==s||a.index!==r}function m(e,t,n,r){let i={},o=t.attributes,s=0,c=n.getAttributes();for(let t in c)if(c[t].location>=0){let n=o[t];n===void 0&&(t===`instanceMatrix`&&e.instanceMatrix&&(n=e.instanceMatrix),t===`instanceColor`&&e.instanceColor&&(n=e.instanceColor));let r={};r.attribute=n,n&&n.data&&(r.data=n.data),i[t]=r,s++}a.attributes=i,a.attributesNum=s,a.index=r}function h(){let e=a.newAttributes;for(let t=0,n=e.length;t<n;t++)e[t]=0}function g(e){_(e,0)}function _(t,n){let r=a.newAttributes,i=a.enabledAttributes,o=a.attributeDivisors;r[t]=1,i[t]===0&&(e.enableVertexAttribArray(t),i[t]=1),o[t]!==n&&(e.vertexAttribDivisor(t,n),o[t]=n)}function v(){let t=a.newAttributes,n=a.enabledAttributes;for(let r=0,i=n.length;r<i;r++)n[r]!==t[r]&&(e.disableVertexAttribArray(r),n[r]=0)}function y(t,n,r,i,a,o,s){s===!0?e.vertexAttribIPointer(t,n,r,a,o):e.vertexAttribPointer(t,n,r,i,a,o)}function b(n,r,i,a){h();let o=a.attributes,s=i.getAttributes(),c=r.defaultAttributeValues;for(let r in s){let i=s[r];if(i.location>=0){let s=o[r];if(s===void 0&&(r===`instanceMatrix`&&n.instanceMatrix&&(s=n.instanceMatrix),r===`instanceColor`&&n.instanceColor&&(s=n.instanceColor)),s!==void 0){let r=s.normalized,o=s.itemSize,c=t.get(s);if(c===void 0)continue;let l=c.buffer,u=c.type,d=c.bytesPerElement,f=u===e.INT||u===e.UNSIGNED_INT||s.gpuType===1013;if(s.isInterleavedBufferAttribute){let t=s.data,c=t.isInterleavedBuffer===!0?t.stride:t.itemSize,p=s.offset;if(t.isInstancedInterleavedBuffer||t.isInstancedBufferAttribute){for(let e=0;e<i.locationSize;e++)_(i.location+e,t.meshPerAttribute);n.isInstancedMesh!==!0&&a._maxInstanceCount===void 0&&(a._maxInstanceCount=t.meshPerAttribute*t.count)}else for(let e=0;e<i.locationSize;e++)g(i.location+e);e.bindBuffer(e.ARRAY_BUFFER,l);for(let e=0;e<i.locationSize;e++)y(i.location+e,o/i.locationSize,u,r,c*d,(p+o/i.locationSize*e)*d,f)}else{if(s.isInstancedBufferAttribute){for(let e=0;e<i.locationSize;e++)_(i.location+e,s.meshPerAttribute);n.isInstancedMesh!==!0&&a._maxInstanceCount===void 0&&(a._maxInstanceCount=s.meshPerAttribute*s.count)}else for(let e=0;e<i.locationSize;e++)g(i.location+e);e.bindBuffer(e.ARRAY_BUFFER,l);for(let e=0;e<i.locationSize;e++)y(i.location+e,o/i.locationSize,u,r,o*d,o/i.locationSize*e*d,f)}}else if(c!==void 0){let t=c[r];if(t!==void 0)switch(t.length){case 2:e.vertexAttrib2fv(i.location,t);break;case 3:e.vertexAttrib3fv(i.location,t);break;case 4:e.vertexAttrib4fv(i.location,t);break;default:e.vertexAttrib1fv(i.location,t)}}}}v()}function x(){T();for(let e in r){let t=r[e];for(let e in t){let n=t[e];for(let e in n){let t=n[e];for(let e in t)u(t[e].object),delete t[e];delete n[e]}}delete r[e]}}function S(e){if(r[e.id]===void 0)return;let t=r[e.id];for(let e in t){let n=t[e];for(let e in n){let t=n[e];for(let e in t)u(t[e].object),delete t[e];delete n[e]}}delete r[e.id]}function C(e){for(let t in r){let n=r[t];for(let t in n){let r=n[t];if(r[e.id]===void 0)continue;let i=r[e.id];for(let e in i)u(i[e].object),delete i[e];delete r[e.id]}}}function w(e){for(let t in r){let n=r[t],i=e.isInstancedMesh===!0?e.id:0,a=n[i];if(a!==void 0){for(let e in a){let t=a[e];for(let e in t)u(t[e].object),delete t[e];delete a[e]}delete n[i],Object.keys(n).length===0&&delete r[t]}}}function T(){E(),o=!0,a!==i&&(a=i,l(a.object))}function E(){i.geometry=null,i.program=null,i.wireframe=!1}return{setup:s,reset:T,resetDefaultState:E,dispose:x,releaseStatesOfGeometry:S,releaseStatesOfObject:w,releaseStatesOfProgram:C,initAttributes:h,enableAttribute:g,disableUnusedAttributes:v}}function ln(e,t,n){let r;function i(e){r=e}function a(t,i){e.drawArrays(r,t,i),n.update(i,r,1)}function o(t,i,a){a!==0&&(e.drawArraysInstanced(r,t,i,a),n.update(i,r,a))}function s(e,i,a){if(a===0)return;t.get(`WEBGL_multi_draw`).multiDrawArraysWEBGL(r,e,0,i,0,a);let o=0;for(let e=0;e<a;e++)o+=i[e];n.update(o,r,1)}this.setMode=i,this.render=a,this.renderInstances=o,this.renderMultiDraw=s}function un(e,t,r,i){let a;function o(){if(a!==void 0)return a;if(t.has(`EXT_texture_filter_anisotropic`)===!0){let n=t.get(`EXT_texture_filter_anisotropic`);a=e.getParameter(n.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else a=0;return a}function s(t){return t===1023||i.convert(t)===e.getParameter(e.IMPLEMENTATION_COLOR_READ_FORMAT)}function c(n){let r=n===1016&&(t.has(`EXT_color_buffer_half_float`)||t.has(`EXT_color_buffer_float`));return!(n!==1009&&n!==1015&&!r&&i.convert(n)!==e.getParameter(e.IMPLEMENTATION_COLOR_READ_TYPE))}function l(t){if(t===`highp`){if(e.getShaderPrecisionFormat(e.VERTEX_SHADER,e.HIGH_FLOAT).precision>0&&e.getShaderPrecisionFormat(e.FRAGMENT_SHADER,e.HIGH_FLOAT).precision>0)return`highp`;t=`mediump`}return t===`mediump`&&e.getShaderPrecisionFormat(e.VERTEX_SHADER,e.MEDIUM_FLOAT).precision>0&&e.getShaderPrecisionFormat(e.FRAGMENT_SHADER,e.MEDIUM_FLOAT).precision>0?`mediump`:`lowp`}let u=r.precision===void 0?`highp`:r.precision,d=l(u);d!==u&&(n(`WebGLRenderer:`,u,`not supported, using`,d,`instead.`),u=d);let f=r.reversedDepthBuffer===!0&&t.has(`EXT_clip_control`),p=r.logarithmicDepthBuffer===!0&&f===!1;r.reversedDepthBuffer===!0&&f===!1&&n(`WebGLRenderer: Unable to use reversed depth buffer due to missing EXT_clip_control extension. Fallback to default depth buffer.`),r.logarithmicDepthBuffer===!0&&f===!0&&n(`WebGLRenderer: Logarithmic depth buffer is ignored when reversed depth buffer is enabled.`);let m=e.getParameter(e.MAX_TEXTURE_IMAGE_UNITS),h=e.getParameter(e.MAX_VERTEX_TEXTURE_IMAGE_UNITS),g=e.getParameter(e.MAX_TEXTURE_SIZE),_=e.getParameter(e.MAX_CUBE_MAP_TEXTURE_SIZE),v=e.getParameter(e.MAX_VERTEX_ATTRIBS),y=e.getParameter(e.MAX_VERTEX_UNIFORM_VECTORS),b=e.getParameter(e.MAX_VARYING_VECTORS),x=e.getParameter(e.MAX_FRAGMENT_UNIFORM_VECTORS),S=e.getParameter(e.MAX_SAMPLES),C=e.getParameter(e.SAMPLES);return{isWebGL2:!0,getMaxAnisotropy:o,getMaxPrecision:l,textureFormatReadable:s,textureTypeReadable:c,precision:u,logarithmicDepthBuffer:p,reversedDepthBuffer:f,maxTextures:m,maxVertexTextures:h,maxTextureSize:g,maxCubemapSize:_,maxAttributes:v,maxVertexUniforms:y,maxVaryings:b,maxFragmentUniforms:x,maxSamples:S,samples:C}}function dn(e){let t=this,n=null,r=0,i=!1,a=!1,o=new ie,s=new V,c={value:null,needsUpdate:!1};this.uniform=c,this.numPlanes=0,this.numIntersection=0,this.init=function(e,t){let n=e.length!==0||t||r!==0||i;return i=t,r=e.length,n},this.beginShadows=function(){a=!0,u(null)},this.endShadows=function(){a=!1},this.setGlobalState=function(e,t){n=u(e,t,0)},this.setState=function(t,o,s){let d=t.clippingPlanes,f=t.clipIntersection,p=t.clipShadows,m=e.get(t);if(!i||d===null||d.length===0||a&&!p)a?u(null):l();else{let e=a?0:r,t=e*4,i=m.clippingState||null;c.value=i,i=u(d,o,t,s);for(let e=0;e!==t;++e)i[e]=n[e];m.clippingState=i,this.numIntersection=f?this.numPlanes:0,this.numPlanes+=e}};function l(){c.value!==n&&(c.value=n,c.needsUpdate=r>0),t.numPlanes=r,t.numIntersection=0}function u(e,n,r,i){let a=e===null?0:e.length,l=null;if(a!==0){if(l=c.value,i!==!0||l===null){let t=r+a*4,i=n.matrixWorldInverse;s.getNormalMatrix(i),(l===null||l.length<t)&&(l=new Float32Array(t));for(let t=0,n=r;t!==a;++t,n+=4)o.copy(e[t]).applyMatrix4(i,s),o.normal.toArray(l,n),l[n+3]=o.constant}c.value=l,c.needsUpdate=!0}return t.numPlanes=a,t.numIntersection=0,l}}var fn=class extends Be{constructor(e=1,t={}){super(e,e,t),this.isWebGLCubeRenderTarget=!0;let n={width:e,height:e,depth:1},r=[n,n,n,n,n,n];this.texture=new we(r),this._setTextureOptions(t),this.texture.isRenderTargetTexture=!0}fromEquirectangularTexture(e,t){this.texture.type=t.type,this.texture.colorSpace=t.colorSpace,this.texture.generateMipmaps=t.generateMipmaps,this.texture.minFilter=t.minFilter,this.texture.magFilter=t.magFilter;let n={uniforms:{tEquirect:{value:null}},vertexShader:`

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
			`},r=new Ne(5,5,5),i=new F({name:`CubemapFromEquirect`,uniforms:le(n.uniforms),vertexShader:n.vertexShader,fragmentShader:n.fragmentShader,side:1,blending:0});i.uniforms.tEquirect.value=t;let a=new P(r,i),o=t.minFilter;return t.minFilter===1008&&(t.minFilter=T),new pe(1,10,this).update(e,a),t.minFilter=o,a.geometry.dispose(),a.material.dispose(),this}clear(e,t=!0,n=!0,r=!0){let i=e.getRenderTarget();for(let i=0;i<6;i++)e.setRenderTarget(this,i),e.clear(t,n,r);e.setRenderTarget(i)}},pn=256,mn=3,hn=20,gn=256,_n=16,vn=3,yn=new R,bn=new Le,xn=class e{constructor(e){this._renderer=e,this._cubeSize=0,this._sourceTarget=null,this._cubeCamera=new pe(1,10,null),this._boxMesh=new P(new Ne(5,5,5),null),this._cubemapMaterial=null,this._equirectMaterial=null,this._blurMaterial=null,this._ggxMaterial=null,this._integrationMaterial=null}fromScene(e,t=0,n=.1,r=100,i={}){let{size:a=256,position:o=yn}=i,s=this._renderer;this._setSize(a);let c=this._allocateTarget(),l=this._getSourceTarget(!0);t>0&&(l.texture.mipmapsAutoUpdate=!1);let u=s.autoClear,d=s.autoClearColor,f=s.autoClearDepth,p=s.autoClearStencil,m=e.background;s.autoClear=!0,s.autoClearColor=!0,s.autoClearDepth=!0,s.autoClearStencil=!0,m===null&&(e.background=s.getClearColor(bn));let h=new pe(n,r,l);return h.position.copy(o),h.update(s,e),s.autoClear=u,s.autoClearColor=d,s.autoClearDepth=f,s.autoClearStencil=p,e.background=m,t>0&&(l.texture.mipmapsAutoUpdate=!0,this._blur(c,t)),this._applyPMREM(c),c}fromEquirectangular(e,t=null){return this._fromTexture(e,t)}fromCubemap(e,t=null){return this._fromTexture(e,t)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=On(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=Dn(),this._compileMaterial(this._equirectMaterial))}dispose(){this._sourceTarget!==null&&this._sourceTarget.dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose(),this._blurMaterial!==null&&this._blurMaterial.dispose(),this._ggxMaterial!==null&&this._ggxMaterial.dispose(),this._integrationMaterial!==null&&this._integrationMaterial.dispose(),this._boxMesh.geometry.dispose()}static lodToRoughness(e,t){return t>0?1-Math.sqrt(1-e/t):0}_setSize(e){this._cubeSize=Math.max(pn,He(e))}_fromTexture(e,t){e.mapping===301||e.mapping===302?this._setSize(e.image.length===0?pn:e.image[0].width||e.image[0].image.width):this._setSize(e.image.width/4);let n=t||this._allocateTarget();return this._textureToCubemap(e),this._applyPMREM(n),n}_allocateTarget(){let e=this._cubeSize,t=Sn(e,!1,!1),n=Math.log2(e)-mn;for(let r=0;r<=n;r++)t.texture.mipmaps.push({width:e>>r,height:e>>r});return t.texture.name=`PMREM`,t.texture.isPMREMTexture=!0,t}_getSourceTarget(e=!1){let t=this._cubeSize,n=this._sourceTarget;return(n===null||n.width!==t||e&&n.depthBuffer===!1)&&(n!==null&&n.dispose(),this._sourceTarget=Sn(t,!0,e)),this._sourceTarget}_compileMaterial(e){this._boxMesh.material=e,this._renderer.compile(this._boxMesh,this._cubeCamera.children[0])}_renderCube(e,t,n){let r=this._boxMesh,i=this._cubeCamera;r.material=n,i.renderTarget=e,i.activeMipmapLevel=t;let a=e.width>>t;e.viewport.set(0,0,a,a),i.update(this._renderer,r),e.viewport.set(0,0,e.width,e.height)}_textureToCubemap(e){let t;e.mapping===301||e.mapping===302?(this._cubemapMaterial===null&&(this._cubemapMaterial=On()),t=this._cubemapMaterial,t.uniforms.flipEnvMap.value=e.isRenderTargetTexture===!1?-1:1):(this._equirectMaterial===null&&(this._equirectMaterial=Dn()),t=this._equirectMaterial),t.uniforms.envMap.value=e,this._renderCube(this._getSourceTarget(),0,t)}_applyPMREM(t){this._ggxMaterial===null&&(this._ggxMaterial=wn(),this._integrationMaterial=Tn());let n=this._cubeSize,r=t.texture.mipmaps.length-1,i=this._ggxMaterial.uniforms;i.envMap.value=this._sourceTarget.texture;let a=this._integrationMaterial.uniforms;a.envMap.value=this._sourceTarget.texture,a.sourceLod.value=Math.log2(n/_n);for(let o=0;o<=r;o++){let s=e.lodToRoughness(o,r);if(o>r-vn)a.roughness.value=s,this._renderCube(t,o,this._integrationMaterial);else{let e=s>0?Math.log2(n)+.5*Math.log2(6/(gn*s**4))+.5:0;i.roughness.value=s,i.lodBias.value=e,this._renderCube(t,o,this._ggxMaterial)}}}_blur(e,t){this._blurMaterial===null&&(this._blurMaterial=En());let n=this._blurMaterial,r=n.uniforms,i=this._sourceTarget;r.sigma.value=Math.min(t,Math.PI)/Math.SQRT2,r.envMap.value=i.texture,this._renderCube(e,0,n),r.envMap.value=e.texture,this._renderCube(i,0,n)}};function Sn(e,t,n){return new fn(e,{minFilter:d,generateMipmaps:t,type:be,colorSpace:b,depthBuffer:n})}function Cn(e,t,n){return new F({name:e,uniforms:t,vertexShader:tn.cube_vert,fragmentShader:n,side:1,blending:0,depthTest:!1,depthWrite:!1})}function wn(){return Cn(`PMREMGGXConvolution`,{envMap:{value:null},roughness:{value:0},lodBias:{value:0}},`

		#define GGX_SAMPLES ${gn}u

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
	`)}function Tn(){return Cn(`PMREMGGXIntegration`,{envMap:{value:null},roughness:{value:0},sourceLod:{value:0},sourceSize:{value:_n}},`

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
	`)}function En(){return Cn(`PMREMSphericalGaussianBlur`,{envMap:{value:null},sigma:{value:0}},`

		#define SAMPLES ${hn}
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
	`)}function Dn(){return Cn(`PMREMEquirectangularToCubemap`,{envMap:{value:null}},`

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
	`)}function On(){return Cn(`PMREMCubemapToCubemap`,{envMap:{value:null},flipEnvMap:{value:-1}},`

		varying vec3 vWorldDirection;

		uniform samplerCube envMap;
		uniform float flipEnvMap;

		void main() {

			gl_FragColor = vec4( textureCube( envMap, vec3( flipEnvMap * vWorldDirection.x, vWorldDirection.yz ) ).rgb, 1.0 );

		}
	`)}function kn(e){let t=new WeakMap,n=new WeakMap,r=null;function i(e,t=!1){return e==null?null:t?o(e):a(e)}function a(n){if(n&&n.isTexture){let r=n.mapping;if(r===303||r===304){if(t.has(n)){let e=t.get(n).texture;return s(e,n.mapping)}{let r=n.image;if(r&&r.height>0){let i=new fn(r.height);return i.fromEquirectangularTexture(e,n),t.set(n,i),n.addEventListener(`dispose`,l),s(i.texture,n.mapping)}return null}}}return n}function o(t){if(t&&t.isTexture&&t.isPMREMTexture!==!0){let i=t.mapping,a=i===303||i===304,o=i===301||i===302;if(a||o){let i=n.get(t),s=i===void 0?0:i.texture.pmremVersion;if(t.isRenderTargetTexture&&t.pmremVersion!==s)return r===null&&(r=new xn(e)),i=a?r.fromEquirectangular(t,i):r.fromCubemap(t,i),i.texture.pmremVersion=t.pmremVersion,n.set(t,i),i.texture;if(i!==void 0)return i.texture;{let s=t.image;return a&&s&&s.height>0||o&&s&&c(s)?(r===null&&(r=new xn(e)),i=a?r.fromEquirectangular(t):r.fromCubemap(t),i.texture.pmremVersion=t.pmremVersion,n.set(t,i),t.addEventListener(`dispose`,u),i.texture):null}}}return t}function s(e,t){return t===303?e.mapping=301:t===304&&(e.mapping=302),e}function c(e){let t=0;for(let n=0;n<6;n++)e[n]!==void 0&&t++;return t===6}function l(e){let n=e.target;n.removeEventListener(`dispose`,l);let r=t.get(n);r!==void 0&&(t.delete(n),r.dispose())}function u(e){let t=e.target;t.removeEventListener(`dispose`,u);let r=n.get(t);r!==void 0&&(n.delete(t),r.dispose())}function d(){t=new WeakMap,n=new WeakMap,r!==null&&(r.dispose(),r=null)}return{get:i,dispose:d}}function An(e){let t={};function n(n){if(t[n]!==void 0)return t[n];let r=e.getExtension(n);return t[n]=r,r}return{has:function(e){return n(e)!==null},init:function(){n(`EXT_color_buffer_float`),n(`WEBGL_clip_cull_distance`),n(`OES_texture_float_linear`),n(`EXT_color_buffer_half_float`),n(`WEBGL_multisampled_render_to_texture`),n(`WEBGL_render_shared_exponent`)},get:function(e){let t=n(e);return t===null&&xe(`WebGLRenderer: `+e+` extension not supported.`),t}}}function jn(e,t,n,r){let i={},a=new WeakMap,o=new FinalizationRegistry(e=>delete i[e]);function s(e){c(e.target)}function c(e){e.index!==null&&t.remove(e.index);for(let n in e.attributes)t.remove(e.attributes[n]);e.removeEventListener(`dispose`,s),delete i[e.id],o.unregister(e);let c=a.get(e);c&&(t.remove(c),a.delete(e)),r.releaseStatesOfGeometry(e),e.isInstancedBufferGeometry===!0&&delete e._maxInstanceCount,n.memory.geometries--}function l(e,t){return i[t.id]===void 0&&(t.addEventListener(`dispose`,s),i[t.id]=new WeakRef(t),o.register(t,t.id,t),n.memory.geometries++),t}function u(n){let r=n.attributes;for(let n in r)t.update(r[n],e.ARRAY_BUFFER)}function d(e){let n=e.index,r=e.attributes.position,i=0;if(r===void 0)return;let o=n===null?r.array.length/3-1:n.array.length,s=new(r.count>=65535?ye:Pe)(Math.ceil(o/3)*6,1),c=s.array;if(n!==null){let e=n.array;i=n.version;for(let t=0,n=0;t<o;t+=3){let r=e[t+0],i=e[t+1],a=e[t+2];c[n++]=r,c[n++]=i,c[n++]=i,c[n++]=a,c[n++]=a,c[n++]=r}}else{i=r.version;for(let e=0,t=0;e<o;e+=3){let n=e+0,r=e+1,i=e+2;c[t++]=n,c[t++]=r,c[t++]=r,c[t++]=i,c[t++]=i,c[t++]=n}}s.version=i;let l=a.get(e);l&&t.remove(l),a.set(e,s)}function f(e){let t=a.get(e);if(t){let n=e.index;n!==null&&t.version<n.version&&d(e)}else d(e);return a.get(e)}function p(){for(let e in i){let t=i[e].deref();t!==void 0&&c(t)}}return{get:l,update:u,getWireframeAttribute:f,dispose:p}}function Mn(e,t,n){let r;function i(e){r=e}let a,o;function s(e){a=e.type,o=e.bytesPerElement}function c(t,i){e.drawElements(r,i,a,t*o),n.update(i,r,1)}function l(t,i,s){s!==0&&(e.drawElementsInstanced(r,i,a,t*o,s),n.update(i,r,s))}function u(e,i,o){if(o===0)return;t.get(`WEBGL_multi_draw`).multiDrawElementsWEBGL(r,i,0,a,e,0,o);let s=0;for(let e=0;e<o;e++)s+=i[e];n.update(s,r,1)}this.setMode=i,this.setIndex=s,this.render=c,this.renderInstances=l,this.renderMultiDraw=u}function Nn(e){let t={geometries:0,textures:0},n={frame:0,calls:0,triangles:0,points:0,lines:0};function r(t,r,i){switch(n.calls++,r){case e.TRIANGLES:n.triangles+=t/3*i;break;case e.LINES:n.lines+=t/2*i;break;case e.LINE_STRIP:n.lines+=i*(t-1);break;case e.LINE_LOOP:n.lines+=i*t;break;case e.POINTS:n.points+=i*t;break;default:o(`WebGLInfo: Unknown draw mode:`,r)}}function i(){n.calls=0,n.triangles=0,n.points=0,n.lines=0}return{memory:t,render:n,programs:null,autoReset:!0,reset:i,update:r}}function Pn(e,t,n){let r=new WeakMap,i=new ge;function a(a,o,s){let c=a.morphTargetInfluences,u=o.morphAttributes.position||o.morphAttributes.normal||o.morphAttributes.color,d=u===void 0?0:u.length,f=r.get(o);if(f===void 0||f.count!==d){f!==void 0&&f.texture.dispose();let e=o.morphAttributes.position!==void 0,n=o.morphAttributes.normal!==void 0,a=o.morphAttributes.color!==void 0,s=o.morphAttributes.position||[],c=o.morphAttributes.normal||[],u=o.morphAttributes.color||[],p=0;e===!0&&(p=1),n===!0&&(p=2),a===!0&&(p=3);let m=o.attributes.position.count*p,h=1;m>t.maxTextureSize&&(h=Math.ceil(m/t.maxTextureSize),m=t.maxTextureSize);let g=new Float32Array(m*h*4*d),_=new he(g,m,h,d);_.type=l,_.needsUpdate=!0;let v=p*4;for(let t=0;t<d;t++){let r=s[t],o=c[t],l=u[t],d=m*h*4*t;for(let t=0;t<r.count;t++){let s=t*v;e===!0&&(i.fromBufferAttribute(r,t),g[d+s+0]=i.x,g[d+s+1]=i.y,g[d+s+2]=i.z,g[d+s+3]=0),n===!0&&(i.fromBufferAttribute(o,t),g[d+s+4]=i.x,g[d+s+5]=i.y,g[d+s+6]=i.z,g[d+s+7]=0),a===!0&&(i.fromBufferAttribute(l,t),g[d+s+8]=i.x,g[d+s+9]=i.y,g[d+s+10]=i.z,g[d+s+11]=l.itemSize===4?i.w:1)}}f={count:d,texture:_,size:new Te(m,h)},r.set(o,f);function y(){_.dispose(),r.delete(o),o.removeEventListener(`dispose`,y)}o.addEventListener(`dispose`,y)}if(a.isInstancedMesh===!0&&a.morphTexture!==null)s.getUniforms().setValue(e,`morphTexture`,a.morphTexture,n);else{let t=0;for(let e=0;e<c.length;e++)t+=c[e];let n=o.morphTargetsRelative?1:1-t;s.getUniforms().setValue(e,`morphTargetBaseInfluence`,n),s.getUniforms().setValue(e,`morphTargetInfluences`,c)}s.getUniforms().setValue(e,`morphTargetsTexture`,f.texture,n),s.getUniforms().setValue(e,`morphTargetsTextureSize`,f.size)}return{update:a}}function Fn(e,t,n,r,i){let a=new WeakMap;function o(r){let o=i.render.frame,s=r.geometry,l=t.get(r,s);if(a.get(l)!==o&&(t.update(l),a.set(l,o)),r.isInstancedMesh&&(r.hasEventListener(`dispose`,c)===!1&&r.addEventListener(`dispose`,c),a.get(r)!==o&&(n.update(r.instanceMatrix,e.ARRAY_BUFFER),r.instanceColor!==null&&n.update(r.instanceColor,e.ARRAY_BUFFER),a.set(r,o))),r.isSkinnedMesh){let e=r.skeleton;a.get(e)!==o&&(e.update(),a.set(e,o))}return l}function s(){a=new WeakMap}function c(e){let t=e.target;t.removeEventListener(`dispose`,c),r.releaseStatesOfObject(t),n.remove(t.instanceMatrix),t.instanceColor!==null&&n.remove(t.instanceColor)}return{update:o,dispose:s}}var In={1:`LINEAR_TONE_MAPPING`,2:`REINHARD_TONE_MAPPING`,3:`CINEON_TONE_MAPPING`,4:`ACES_FILMIC_TONE_MAPPING`,6:`AGX_TONE_MAPPING`,7:`NEUTRAL_TONE_MAPPING`,5:`CUSTOM_TONE_MAPPING`};function Ln(e,t,n,r,i,a){let o=new Be(t,n,{type:e,depthBuffer:i,stencilBuffer:a,samples:r?4:0,storeMultisampledDepthBuffer:!1,storeMultisampledStencilBuffer:!1,resolveDepthBuffer:!1,resolveStencilBuffer:!1}),s=null,c=null,l=null,u=new I;u.setAttribute(`position`,new j([-1,3,0,-1,-1,0,3,-1,0],3)),u.setAttribute(`uv`,new j([0,2,0,0,2,0],2));let d=new O({uniforms:{tDiffuse:{value:null}},vertexShader:`
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
			}`,depthTest:!1,depthWrite:!1}),f=new P(u,d),p=new _(-1,1,1,-1,0,1),m=null,h=null,g=!1,v,y=null,b=[],x=!1;this.setSize=function(e,t){o.setSize(e,t),s!==null&&s.setSize(e,t),c!==null&&c.setSize(e,t);for(let n=0;n<b.length;n++){let r=b[n];r.setSize&&r.setSize(e,t)}},this.setEffects=function(e){b=e,x=b.length>0&&b[0].isRenderPass===!0;let t=o.width,n=o.height;b.length>0&&s===null&&(s=new Be(t,n,{type:be,depthBuffer:!1,stencilBuffer:!1}),c=new Be(t,n,{type:be,depthBuffer:!1,stencilBuffer:!1}));let r=i===!0&&b.some(e=>e.needsDepthTexture===!0);r!==(o.depthTexture!==null)&&(r===!0&&l===null&&(l=new L(t,n),a===!0&&(l.format=B,l.type=ue)),o.dispose(),o.depthTexture=r?l:null,o.resolveDepthBuffer=r,o.storeMultisampledDepthBuffer=r);for(let e=0;e<b.length;e++){let i=b[e];i.setSize&&i.setSize(t,n),r&&i.needsDepthTexture===!0&&i.setDepthTexture&&i.setDepthTexture(l)}},this.begin=function(e,t){if(g||e.toneMapping===0&&b.length===0)return!1;if(y=t,t!==null){let e=t.width,n=t.height;(o.width!==e||o.height!==n)&&this.setSize(e,n)}return x===!1&&e.setRenderTarget(o),v=e.toneMapping,e.toneMapping=0,!0},this.hasRenderPass=function(){return x},this.end=function(e,t){e.toneMapping=v,g=!0;let n=o,r=s;for(let i=0;i<b.length;i++){let a=b[i];a.enabled!==!1&&(a.render(e,r,n,t),a.needsSwap!==!1&&(n=r,r=r===s?c:s))}if(m!==e.outputColorSpace||h!==e.toneMapping){m=e.outputColorSpace,h=e.toneMapping,d.defines={},de.getTransfer(m)===`srgb`&&(d.defines.SRGB_TRANSFER=``);let t=In[h];t&&(d.defines[t]=``),d.needsUpdate=!0}d.uniforms.tDiffuse.value=n.texture,e.setRenderTarget(y),e.render(f,p),y=null,g=!1},this.isCompositing=function(){return g},this.dispose=function(){o.dispose(),s!==null&&s.dispose(),c!==null&&c.dispose(),u.dispose(),d.dispose()}}var Rn=new Fe,zn=new L(1,1),Bn=new ke(1),Vn=new he,Hn=new _e,Un=new we,Wn=[],Gn=[],Kn=new Float32Array(16),qn=new Float32Array(9),Jn=new Float32Array(4);function Yn(e,t,n){let r=e[0];if(r<=0||r>0)return e;let i=t*n,a=Wn[i];if(a===void 0&&(a=new Float32Array(i),Wn[i]=a),t!==0){r.toArray(a,0);for(let r=1,i=0;r!==t;++r)i+=n,e[r].toArray(a,i)}return a}function Xn(e,t){if(e.length!==t.length)return!1;for(let n=0,r=e.length;n<r;n++)if(e[n]!==t[n])return!1;return!0}function Zn(e,t){for(let n=0,r=t.length;n<r;n++)e[n]=t[n]}function Qn(e,t){let n=Gn[t];n===void 0&&(n=new Int32Array(t),Gn[t]=n);for(let r=0;r!==t;++r)n[r]=e.allocateTextureUnit();return n}function $n(e,t){let n=this.cache;n[0]!==t&&(e.uniform1f(this.addr,t),n[0]=t)}function er(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y)&&(e.uniform2f(this.addr,t.x,t.y),n[0]=t.x,n[1]=t.y);else{if(Xn(n,t))return;e.uniform2fv(this.addr,t),Zn(n,t)}}function tr(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y||n[2]!==t.z)&&(e.uniform3f(this.addr,t.x,t.y,t.z),n[0]=t.x,n[1]=t.y,n[2]=t.z);else if(t.r!==void 0)(n[0]!==t.r||n[1]!==t.g||n[2]!==t.b)&&(e.uniform3f(this.addr,t.r,t.g,t.b),n[0]=t.r,n[1]=t.g,n[2]=t.b);else{if(Xn(n,t))return;e.uniform3fv(this.addr,t),Zn(n,t)}}function nr(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y||n[2]!==t.z||n[3]!==t.w)&&(e.uniform4f(this.addr,t.x,t.y,t.z,t.w),n[0]=t.x,n[1]=t.y,n[2]=t.z,n[3]=t.w);else{if(Xn(n,t))return;e.uniform4fv(this.addr,t),Zn(n,t)}}function rr(e,t){let n=this.cache,r=t.elements;if(r===void 0){if(Xn(n,t))return;e.uniformMatrix2fv(this.addr,!1,t),Zn(n,t)}else{if(Xn(n,r))return;Jn.set(r),e.uniformMatrix2fv(this.addr,!1,Jn),Zn(n,r)}}function ir(e,t){let n=this.cache,r=t.elements;if(r===void 0){if(Xn(n,t))return;e.uniformMatrix3fv(this.addr,!1,t),Zn(n,t)}else{if(Xn(n,r))return;qn.set(r),e.uniformMatrix3fv(this.addr,!1,qn),Zn(n,r)}}function ar(e,t){let n=this.cache,r=t.elements;if(r===void 0){if(Xn(n,t))return;e.uniformMatrix4fv(this.addr,!1,t),Zn(n,t)}else{if(Xn(n,r))return;Kn.set(r),e.uniformMatrix4fv(this.addr,!1,Kn),Zn(n,r)}}function or(e,t){let n=this.cache;n[0]!==t&&(e.uniform1i(this.addr,t),n[0]=t)}function sr(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y)&&(e.uniform2i(this.addr,t.x,t.y),n[0]=t.x,n[1]=t.y);else{if(Xn(n,t))return;e.uniform2iv(this.addr,t),Zn(n,t)}}function cr(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y||n[2]!==t.z)&&(e.uniform3i(this.addr,t.x,t.y,t.z),n[0]=t.x,n[1]=t.y,n[2]=t.z);else{if(Xn(n,t))return;e.uniform3iv(this.addr,t),Zn(n,t)}}function lr(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y||n[2]!==t.z||n[3]!==t.w)&&(e.uniform4i(this.addr,t.x,t.y,t.z,t.w),n[0]=t.x,n[1]=t.y,n[2]=t.z,n[3]=t.w);else{if(Xn(n,t))return;e.uniform4iv(this.addr,t),Zn(n,t)}}function ur(e,t){let n=this.cache;n[0]!==t&&(e.uniform1ui(this.addr,t),n[0]=t)}function dr(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y)&&(e.uniform2ui(this.addr,t.x,t.y),n[0]=t.x,n[1]=t.y);else{if(Xn(n,t))return;e.uniform2uiv(this.addr,t),Zn(n,t)}}function fr(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y||n[2]!==t.z)&&(e.uniform3ui(this.addr,t.x,t.y,t.z),n[0]=t.x,n[1]=t.y,n[2]=t.z);else{if(Xn(n,t))return;e.uniform3uiv(this.addr,t),Zn(n,t)}}function pr(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y||n[2]!==t.z||n[3]!==t.w)&&(e.uniform4ui(this.addr,t.x,t.y,t.z,t.w),n[0]=t.x,n[1]=t.y,n[2]=t.z,n[3]=t.w);else{if(Xn(n,t))return;e.uniform4uiv(this.addr,t),Zn(n,t)}}function mr(e){return e.version===0&&(e.compareFunction=519,e.needsUpdate=!0),e}function hr(e,t,n){let r=this.cache,i=n.allocateTextureUnit();r[0]!==i&&(e.uniform1i(this.addr,i),r[0]=i);let a;a=this.type===e.SAMPLER_2D_SHADOW?mr(zn):Rn,n.setTexture2D(t||a,i)}function gr(e,t,n){let r=this.cache,i=n.allocateTextureUnit();r[0]!==i&&(e.uniform1i(this.addr,i),r[0]=i),n.setTexture3D(t||Hn,i)}function _r(e,t,n){let r=this.cache,i=n.allocateTextureUnit();r[0]!==i&&(e.uniform1i(this.addr,i),r[0]=i);let a;a=this.type===e.SAMPLER_CUBE_SHADOW?mr(Bn):Un,n.setTextureCube(t||a,i)}function vr(e,t,n){let r=this.cache,i=n.allocateTextureUnit();r[0]!==i&&(e.uniform1i(this.addr,i),r[0]=i),n.setTexture2DArray(t||Vn,i)}function yr(e){switch(e){case 5126:return $n;case 35664:return er;case 35665:return tr;case 35666:return nr;case 35674:return rr;case 35675:return ir;case 35676:return ar;case 5124:case 35670:return or;case 35667:case 35671:return sr;case 35668:case 35672:return cr;case 35669:case 35673:return lr;case 5125:return ur;case 36294:return dr;case 36295:return fr;case 36296:return pr;case 35678:case 36198:case 36298:case 36306:case 35682:return hr;case 35679:case 36299:case 36307:return gr;case 35680:case 36300:case 36308:case 36293:return _r;case 36289:case 36303:case 36311:case 36292:return vr}}function br(e,t){e.uniform1fv(this.addr,t)}function xr(e,t){let n=Yn(t,this.size,2);e.uniform2fv(this.addr,n)}function Sr(e,t){let n=Yn(t,this.size,3);e.uniform3fv(this.addr,n)}function Cr(e,t){let n=Yn(t,this.size,4);e.uniform4fv(this.addr,n)}function wr(e,t){let n=Yn(t,this.size,4);e.uniformMatrix2fv(this.addr,!1,n)}function Tr(e,t){let n=Yn(t,this.size,9);e.uniformMatrix3fv(this.addr,!1,n)}function Er(e,t){let n=Yn(t,this.size,16);e.uniformMatrix4fv(this.addr,!1,n)}function Dr(e,t){e.uniform1iv(this.addr,t)}function Or(e,t){e.uniform2iv(this.addr,t)}function kr(e,t){e.uniform3iv(this.addr,t)}function Ar(e,t){e.uniform4iv(this.addr,t)}function jr(e,t){e.uniform1uiv(this.addr,t)}function Mr(e,t){e.uniform2uiv(this.addr,t)}function Nr(e,t){e.uniform3uiv(this.addr,t)}function Pr(e,t){e.uniform4uiv(this.addr,t)}function Fr(e,t,n){let r=this.cache,i=t.length,a=Qn(n,i);Xn(r,a)||(e.uniform1iv(this.addr,a),Zn(r,a));let o;o=this.type===e.SAMPLER_2D_SHADOW?mr(zn):Rn;for(let e=0;e!==i;++e)n.setTexture2D(t[e]||o,a[e])}function Ir(e,t,n){let r=this.cache,i=t.length,a=Qn(n,i);Xn(r,a)||(e.uniform1iv(this.addr,a),Zn(r,a));for(let e=0;e!==i;++e)n.setTexture3D(t[e]||Hn,a[e])}function Lr(e,t,n){let r=this.cache,i=t.length,a=Qn(n,i);Xn(r,a)||(e.uniform1iv(this.addr,a),Zn(r,a));let o;o=this.type===e.SAMPLER_CUBE_SHADOW?mr(Bn):Un;for(let e=0;e!==i;++e)n.setTextureCube(t[e]||o,a[e])}function Rr(e,t,n){let r=this.cache,i=t.length,a=Qn(n,i);Xn(r,a)||(e.uniform1iv(this.addr,a),Zn(r,a));for(let e=0;e!==i;++e)n.setTexture2DArray(t[e]||Vn,a[e])}function zr(e){switch(e){case 5126:return br;case 35664:return xr;case 35665:return Sr;case 35666:return Cr;case 35674:return wr;case 35675:return Tr;case 35676:return Er;case 5124:case 35670:return Dr;case 35667:case 35671:return Or;case 35668:case 35672:return kr;case 35669:case 35673:return Ar;case 5125:return jr;case 36294:return Mr;case 36295:return Nr;case 36296:return Pr;case 35678:case 36198:case 36298:case 36306:case 35682:return Fr;case 35679:case 36299:case 36307:return Ir;case 35680:case 36300:case 36308:case 36293:return Lr;case 36289:case 36303:case 36311:case 36292:return Rr}}var Br=class{constructor(e,t,n){this.id=e,this.addr=n,this.cache=[],this.type=t.type,this.setValue=yr(t.type)}},Vr=class{constructor(e,t,n){this.id=e,this.addr=n,this.cache=[],this.type=t.type,this.size=t.size,this.setValue=zr(t.type)}},Hr=class{constructor(e){this.id=e,this.seq=[],this.map={}}setValue(e,t,n){let r=this.seq;for(let i=0,a=r.length;i!==a;++i){let a=r[i];a.setValue(e,t[a.id],n)}}},Ur=/(\w+)(\])?(\[|\.)?/g;function Wr(e,t){e.seq.push(t),e.map[t.id]=t}function Gr(e,t,n){let r=e.name,i=r.length;for(Ur.lastIndex=0;;){let a=Ur.exec(r),o=Ur.lastIndex,s=a[1],c=a[2]===`]`,l=a[3];if(c&&(s|=0),l===void 0||l===`[`&&o+2===i){Wr(n,l===void 0?new Br(s,e,t):new Vr(s,e,t));break}{let e=n.map[s];e===void 0&&(e=new Hr(s),Wr(n,e)),n=e}}}var Kr=class{constructor(e,t){this.seq=[],this.map={};let n=e.getProgramParameter(t,e.ACTIVE_UNIFORMS);for(let r=0;r<n;++r){let n=e.getActiveUniform(t,r);Gr(n,e.getUniformLocation(t,n.name),this)}let r=[],i=[];for(let t of this.seq)t.type===e.SAMPLER_2D_SHADOW||t.type===e.SAMPLER_CUBE_SHADOW||t.type===e.SAMPLER_2D_ARRAY_SHADOW?r.push(t):i.push(t);r.length>0&&(this.seq=r.concat(i))}setValue(e,t,n,r){let i=this.map[t];i!==void 0&&i.setValue(e,n,r)}setOptional(e,t,n){let r=t[n];r!==void 0&&this.setValue(e,n,r)}static upload(e,t,n,r){for(let i=0,a=t.length;i!==a;++i){let a=t[i],o=n[a.id];o.needsUpdate!==!1&&a.setValue(e,o.value,r)}}static seqWithValue(e,t){let n=[];for(let r=0,i=e.length;r!==i;++r){let i=e[r];i.id in t&&n.push(i)}return n}};function qr(e,t,n){let r=e.createShader(t);return e.shaderSource(r,n),e.compileShader(r),r}var Jr=37297,Yr=0;function Xr(e,t){let n=e.split(`
`),r=[],i=Math.max(t-6,0),a=Math.min(t+6,n.length);for(let e=i;e<a;e++){let i=e+1;r.push(`${i===t?`>`:` `} ${i}: ${n[e]}`)}return r.join(`
`)}var Zr=new V;function Qr(e){de._getMatrix(Zr,de.workingColorSpace,e);let t=`mat3( ${Zr.elements.map(e=>e.toFixed(4))} )`;switch(de.getTransfer(e)){case D:return[t,`LinearTransferOETF`];case v:return[t,`sRGBTransferOETF`];default:return n(`WebGLProgram: Unsupported color space: `,e),[t,`LinearTransferOETF`]}}function $r(e,t,n){let r=e.getShaderParameter(t,e.COMPILE_STATUS),i=(e.getShaderInfoLog(t)||``).trim();if(r&&i===``)return``;let a=/ERROR: 0:(\d+)/.exec(i);if(a){let r=parseInt(a[1]);return n.toUpperCase()+`

`+i+`

`+Xr(e.getShaderSource(t),r)}return i}function ei(e,t){let n=Qr(t);return[`vec4 ${e}( vec4 value ) {`,`	return ${n[1]}( vec4( ${n[0]} * value.rgb, value.a ) );`,`}`].join(`
`)}var ti={1:`Linear`,2:`Reinhard`,3:`Cineon`,4:`ACESFilmic`,6:`AgX`,7:`Neutral`,5:`Custom`};function ni(e,t){let r=ti[t];return r===void 0?(n(`WebGLProgram: Unsupported toneMapping:`,t),`vec3 `+e+`( vec3 color ) { return LinearToneMapping( color ); }`):`vec3 `+e+`( vec3 color ) { return `+r+`ToneMapping( color ); }`}var ri=new R;function ii(){return de.getLuminanceCoefficients(ri),[`float luminance( const in vec3 rgb ) {`,`	const vec3 weights = vec3( ${ri.x.toFixed(4)}, ${ri.y.toFixed(4)}, ${ri.z.toFixed(4)} );`,`	return dot( weights, rgb );`,`}`].join(`
`)}function ai(e){return[e.extensionClipCullDistance?`#extension GL_ANGLE_clip_cull_distance : require`:``,e.extensionMultiDraw?`#extension GL_ANGLE_multi_draw : require`:``].filter(ci).join(`
`)}function oi(e){let t=[];for(let n in e){let r=e[n];r!==!1&&t.push(`#define `+n+` `+r)}return t.join(`
`)}function si(e,t){let n={},r=e.getProgramParameter(t,e.ACTIVE_ATTRIBUTES);for(let i=0;i<r;i++){let r=e.getActiveAttrib(t,i),a=r.name,o=1;r.type===e.FLOAT_MAT2&&(o=2),r.type===e.FLOAT_MAT3&&(o=3),r.type===e.FLOAT_MAT4&&(o=4),n[a]={type:r.type,location:e.getAttribLocation(t,a),locationSize:o}}return n}function ci(e){return e!==``}function li(e,t){let n=t.numSpotLightShadows+t.numSpotLightMaps-t.numSpotLightShadowsWithMaps;return e.replace(/NUM_SUN_LIGHTS/g,t.numSunLights).replace(/NUM_DIR_LIGHTS/g,t.numDirLights).replace(/NUM_SPOT_LIGHTS/g,t.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,t.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,n).replace(/NUM_RECT_AREA_LIGHTS/g,t.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,t.numPointLights).replace(/NUM_HEMI_LIGHTS/g,t.numHemiLights).replace(/NUM_SUN_LIGHT_SHADOWS/g,t.numSunLightShadows).replace(/NUM_DIR_LIGHT_SHADOWS/g,t.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,t.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,t.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,t.numPointLightShadows).replace(/NUM_LIGHT_PROBE_GRIDS/g,t.numLightProbeGrids)}function ui(e,t){return e.replace(/NUM_CLIPPING_PLANES/g,t.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,t.numClippingPlanes-t.numClipIntersection)}var di=/^[ \t]*#include +<([\w\d./]+)>/gm;function fi(e){return e.replace(di,pi)}function pi(e,t){let n=tn[t];if(n===void 0)throw Error(`THREE.WebGLProgram: Can not resolve #include <`+t+`>`);return fi(n)}var mi=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function hi(e){return e.replace(mi,gi)}function gi(e,t,n,r){let i=``;for(let e=parseInt(t);e<parseInt(n);e++)i+=r.replace(/\[\s*i\s*\]/g,`[ `+e+` ]`).replace(/UNROLLED_LOOP_INDEX/g,e);return i}function _i(e){let t=`precision ${e.precision} float;
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
#define LOW_PRECISION`),t}var vi={1:`SHADOWMAP_TYPE_PCF`,3:`SHADOWMAP_TYPE_VSM`};function yi(e){return vi[e.shadowMapType]||`SHADOWMAP_TYPE_BASIC`}var bi={302:`ENVMAP_MODE_REFRACTION`};function xi(e){return e.envMap===!1?`ENVMAP_MODE_REFLECTION`:bi[e.envMapMode]||`ENVMAP_MODE_REFLECTION`}var Si={0:`ENVMAP_BLENDING_MULTIPLY`,1:`ENVMAP_BLENDING_MIX`,2:`ENVMAP_BLENDING_ADD`};function Ci(e){return e.envMap===!1?`ENVMAP_BLENDING_NONE`:Si[e.combine]||`ENVMAP_BLENDING_NONE`}function wi(e,t,r,i){let a=e.getContext(),s=r.defines,c=r.vertexShader,l=r.fragmentShader,u=yi(r),d=r.envMapPMREM===!0?`ENVMAP_TYPE_PMREM`:`ENVMAP_TYPE_CUBE`,f=xi(r),p=Ci(r),m=ai(r),h=oi(s),g=a.createProgram(),_,v,y=r.glslVersion?`#version `+r.glslVersion+`
`:``;r.isRawShaderMaterial?(_=[`#define SHADER_TYPE `+r.shaderType,`#define SHADER_NAME `+r.shaderName,h].filter(ci).join(`
`),_.length>0&&(_+=`
`),v=[`#define SHADER_TYPE `+r.shaderType,`#define SHADER_NAME `+r.shaderName,h].filter(ci).join(`
`),v.length>0&&(v+=`
`)):(_=[_i(r),`#define SHADER_TYPE `+r.shaderType,`#define SHADER_NAME `+r.shaderName,h,r.extensionClipCullDistance?`#define USE_CLIP_DISTANCE`:``,r.batching?`#define USE_BATCHING`:``,r.batchingColor?`#define USE_BATCHING_COLOR`:``,r.instancing?`#define USE_INSTANCING`:``,r.instancingColor?`#define USE_INSTANCING_COLOR`:``,r.instancingMorph?`#define USE_INSTANCING_MORPH`:``,r.useFog&&r.fog?`#define USE_FOG`:``,r.useFog&&r.fogExp2?`#define FOG_EXP2`:``,r.map?`#define USE_MAP`:``,r.envMap?`#define USE_ENVMAP`:``,r.envMap?`#define `+f:``,r.lightMap?`#define USE_LIGHTMAP`:``,r.aoMap?`#define USE_AOMAP`:``,r.bumpMap?`#define USE_BUMPMAP`:``,r.normalMap?`#define USE_NORMALMAP`:``,r.normalMapObjectSpace?`#define USE_NORMALMAP_OBJECTSPACE`:``,r.normalMapTangentSpace?`#define USE_NORMALMAP_TANGENTSPACE`:``,r.displacementMap?`#define USE_DISPLACEMENTMAP`:``,r.emissiveMap?`#define USE_EMISSIVEMAP`:``,r.anisotropy?`#define USE_ANISOTROPY`:``,r.anisotropyMap?`#define USE_ANISOTROPYMAP`:``,r.clearcoatMap?`#define USE_CLEARCOATMAP`:``,r.clearcoatRoughnessMap?`#define USE_CLEARCOAT_ROUGHNESSMAP`:``,r.clearcoatNormalMap?`#define USE_CLEARCOAT_NORMALMAP`:``,r.diffuseRoughnessMap?`#define USE_DIFFUSE_ROUGHNESSMAP`:``,r.iridescenceMap?`#define USE_IRIDESCENCEMAP`:``,r.iridescenceThicknessMap?`#define USE_IRIDESCENCE_THICKNESSMAP`:``,r.specularMap?`#define USE_SPECULARMAP`:``,r.specularColorMap?`#define USE_SPECULAR_COLORMAP`:``,r.specularIntensityMap?`#define USE_SPECULAR_INTENSITYMAP`:``,r.roughnessMap?`#define USE_ROUGHNESSMAP`:``,r.metalnessMap?`#define USE_METALNESSMAP`:``,r.alphaMap?`#define USE_ALPHAMAP`:``,r.alphaHash?`#define USE_ALPHAHASH`:``,r.transmission?`#define USE_TRANSMISSION`:``,r.transmissionMap?`#define USE_TRANSMISSIONMAP`:``,r.thicknessMap?`#define USE_THICKNESSMAP`:``,r.sheenColorMap?`#define USE_SHEEN_COLORMAP`:``,r.sheenRoughnessMap?`#define USE_SHEEN_ROUGHNESSMAP`:``,r.mapUv?`#define MAP_UV `+r.mapUv:``,r.alphaMapUv?`#define ALPHAMAP_UV `+r.alphaMapUv:``,r.lightMapUv?`#define LIGHTMAP_UV `+r.lightMapUv:``,r.aoMapUv?`#define AOMAP_UV `+r.aoMapUv:``,r.emissiveMapUv?`#define EMISSIVEMAP_UV `+r.emissiveMapUv:``,r.bumpMapUv?`#define BUMPMAP_UV `+r.bumpMapUv:``,r.normalMapUv?`#define NORMALMAP_UV `+r.normalMapUv:``,r.displacementMapUv?`#define DISPLACEMENTMAP_UV `+r.displacementMapUv:``,r.metalnessMapUv?`#define METALNESSMAP_UV `+r.metalnessMapUv:``,r.roughnessMapUv?`#define ROUGHNESSMAP_UV `+r.roughnessMapUv:``,r.anisotropyMapUv?`#define ANISOTROPYMAP_UV `+r.anisotropyMapUv:``,r.clearcoatMapUv?`#define CLEARCOATMAP_UV `+r.clearcoatMapUv:``,r.clearcoatNormalMapUv?`#define CLEARCOAT_NORMALMAP_UV `+r.clearcoatNormalMapUv:``,r.clearcoatRoughnessMapUv?`#define CLEARCOAT_ROUGHNESSMAP_UV `+r.clearcoatRoughnessMapUv:``,r.diffuseRoughnessMapUv?`#define DIFFUSE_ROUGHNESSMAP_UV `+r.diffuseRoughnessMapUv:``,r.iridescenceMapUv?`#define IRIDESCENCEMAP_UV `+r.iridescenceMapUv:``,r.iridescenceThicknessMapUv?`#define IRIDESCENCE_THICKNESSMAP_UV `+r.iridescenceThicknessMapUv:``,r.sheenColorMapUv?`#define SHEEN_COLORMAP_UV `+r.sheenColorMapUv:``,r.sheenRoughnessMapUv?`#define SHEEN_ROUGHNESSMAP_UV `+r.sheenRoughnessMapUv:``,r.specularMapUv?`#define SPECULARMAP_UV `+r.specularMapUv:``,r.specularColorMapUv?`#define SPECULAR_COLORMAP_UV `+r.specularColorMapUv:``,r.specularIntensityMapUv?`#define SPECULAR_INTENSITYMAP_UV `+r.specularIntensityMapUv:``,r.transmissionMapUv?`#define TRANSMISSIONMAP_UV `+r.transmissionMapUv:``,r.thicknessMapUv?`#define THICKNESSMAP_UV `+r.thicknessMapUv:``,r.vertexTangents&&r.flatShading===!1?`#define USE_TANGENT`:``,r.vertexNormals?`#define HAS_NORMAL`:``,r.vertexColors?`#define USE_COLOR`:``,r.vertexAlphas?`#define USE_COLOR_ALPHA`:``,r.vertexUv1s?`#define USE_UV1`:``,r.vertexUv2s?`#define USE_UV2`:``,r.vertexUv3s?`#define USE_UV3`:``,r.pointsUvs?`#define USE_POINTS_UV`:``,r.flatShading?`#define FLAT_SHADED`:``,r.skinning?`#define USE_SKINNING`:``,r.morphTargets?`#define USE_MORPHTARGETS`:``,r.morphNormals&&r.flatShading===!1?`#define USE_MORPHNORMALS`:``,r.morphColors?`#define USE_MORPHCOLORS`:``,r.morphTargetsCount>0?`#define MORPHTARGETS_TEXTURE_STRIDE `+r.morphTextureStride:``,r.morphTargetsCount>0?`#define MORPHTARGETS_COUNT `+r.morphTargetsCount:``,r.doubleSided?`#define DOUBLE_SIDED`:``,r.flipSided?`#define FLIP_SIDED`:``,r.shadowMapEnabled?`#define USE_SHADOWMAP`:``,r.shadowMapEnabled?`#define `+u:``,r.sizeAttenuation?`#define USE_SIZEATTENUATION`:``,r.numLightProbes>0?`#define USE_LIGHT_PROBES`:``,r.logarithmicDepthBuffer?`#define USE_LOGARITHMIC_DEPTH_BUFFER`:``,r.reversedDepthBuffer?`#define USE_REVERSED_DEPTH_BUFFER`:``,`uniform mat4 modelMatrix;`,`uniform mat4 modelViewMatrix;`,`uniform mat4 projectionMatrix;`,`uniform mat4 viewMatrix;`,`uniform mat3 normalMatrix;`,`uniform vec3 cameraPosition;`,`uniform bool isOrthographic;`,`#ifdef USE_INSTANCING`,`	attribute mat4 instanceMatrix;`,`#endif`,`#ifdef USE_INSTANCING_COLOR`,`	attribute vec3 instanceColor;`,`#endif`,`#ifdef USE_INSTANCING_MORPH`,`	uniform sampler2D morphTexture;`,`#endif`,`attribute vec3 position;`,`attribute vec3 normal;`,`attribute vec2 uv;`,`#ifdef USE_UV1`,`	attribute vec2 uv1;`,`#endif`,`#ifdef USE_UV2`,`	attribute vec2 uv2;`,`#endif`,`#ifdef USE_UV3`,`	attribute vec2 uv3;`,`#endif`,`#ifdef USE_TANGENT`,`	attribute vec4 tangent;`,`#endif`,`#if defined( USE_COLOR_ALPHA )`,`	attribute vec4 color;`,`#elif defined( USE_COLOR )`,`	attribute vec3 color;`,`#endif`,`#ifdef USE_SKINNING`,`	attribute vec4 skinIndex;`,`	attribute vec4 skinWeight;`,`#endif`,`
`].filter(ci).join(`
`),v=[_i(r),`#define SHADER_TYPE `+r.shaderType,`#define SHADER_NAME `+r.shaderName,h,r.useFog&&r.fog?`#define USE_FOG`:``,r.useFog&&r.fogExp2?`#define FOG_EXP2`:``,r.alphaToCoverage?`#define ALPHA_TO_COVERAGE`:``,r.map?`#define USE_MAP`:``,r.matcap?`#define USE_MATCAP`:``,r.envMap?`#define USE_ENVMAP`:``,r.envMap?`#define `+d:``,r.envMap?`#define `+f:``,r.envMap?`#define `+p:``,r.envMapPMREM?`#define ENVMAP_MAX_LOD `+r.envMapMaxLod+`.0`:``,r.envMapPMREM?`#define ENVMAP_SIZE `+r.envMapSize+`.0`:``,r.lightMap?`#define USE_LIGHTMAP`:``,r.aoMap?`#define USE_AOMAP`:``,r.bumpMap?`#define USE_BUMPMAP`:``,r.normalMap?`#define USE_NORMALMAP`:``,r.normalMapObjectSpace?`#define USE_NORMALMAP_OBJECTSPACE`:``,r.normalMapTangentSpace?`#define USE_NORMALMAP_TANGENTSPACE`:``,r.packedNormalMap?`#define USE_PACKED_NORMALMAP`:``,r.emissiveMap?`#define USE_EMISSIVEMAP`:``,r.anisotropy?`#define USE_ANISOTROPY`:``,r.anisotropyMap?`#define USE_ANISOTROPYMAP`:``,r.clearcoat?`#define USE_CLEARCOAT`:``,r.clearcoatMap?`#define USE_CLEARCOATMAP`:``,r.clearcoatRoughnessMap?`#define USE_CLEARCOAT_ROUGHNESSMAP`:``,r.clearcoatNormalMap?`#define USE_CLEARCOAT_NORMALMAP`:``,r.diffuseRoughness?`#define USE_DIFFUSE_ROUGHNESS`:``,r.diffuseRoughnessMap?`#define USE_DIFFUSE_ROUGHNESSMAP`:``,r.dispersion?`#define USE_DISPERSION`:``,r.retroreflection?`#define USE_RETROREFLECTION`:``,r.iridescence?`#define USE_IRIDESCENCE`:``,r.iridescenceMap?`#define USE_IRIDESCENCEMAP`:``,r.iridescenceThicknessMap?`#define USE_IRIDESCENCE_THICKNESSMAP`:``,r.specularMap?`#define USE_SPECULARMAP`:``,r.specularColorMap?`#define USE_SPECULAR_COLORMAP`:``,r.specularIntensityMap?`#define USE_SPECULAR_INTENSITYMAP`:``,r.roughnessMap?`#define USE_ROUGHNESSMAP`:``,r.metalnessMap?`#define USE_METALNESSMAP`:``,r.alphaMap?`#define USE_ALPHAMAP`:``,r.alphaTest?`#define USE_ALPHATEST`:``,r.alphaHash?`#define USE_ALPHAHASH`:``,r.sheen?`#define USE_SHEEN`:``,r.sheenColorMap?`#define USE_SHEEN_COLORMAP`:``,r.sheenRoughnessMap?`#define USE_SHEEN_ROUGHNESSMAP`:``,r.transmission?`#define USE_TRANSMISSION`:``,r.transmissionMap?`#define USE_TRANSMISSIONMAP`:``,r.thicknessMap?`#define USE_THICKNESSMAP`:``,r.vertexTangents&&r.flatShading===!1?`#define USE_TANGENT`:``,r.vertexColors||r.instancingColor?`#define USE_COLOR`:``,r.vertexAlphas||r.batchingColor?`#define USE_COLOR_ALPHA`:``,r.vertexUv1s?`#define USE_UV1`:``,r.vertexUv2s?`#define USE_UV2`:``,r.vertexUv3s?`#define USE_UV3`:``,r.pointsUvs?`#define USE_POINTS_UV`:``,r.gradientMap?`#define USE_GRADIENTMAP`:``,r.flatShading?`#define FLAT_SHADED`:``,r.doubleSided?`#define DOUBLE_SIDED`:``,r.flipSided?`#define FLIP_SIDED`:``,r.shadowMapEnabled?`#define USE_SHADOWMAP`:``,r.shadowMapEnabled?`#define `+u:``,r.premultipliedAlpha?`#define PREMULTIPLIED_ALPHA`:``,r.numLightProbes>0?`#define USE_LIGHT_PROBES`:``,r.decodeVideoTexture?`#define DECODE_VIDEO_TEXTURE`:``,r.decodeVideoTextureEmissive?`#define DECODE_VIDEO_TEXTURE_EMISSIVE`:``,r.logarithmicDepthBuffer?`#define USE_LOGARITHMIC_DEPTH_BUFFER`:``,r.reversedDepthBuffer?`#define USE_REVERSED_DEPTH_BUFFER`:``,`uniform mat4 viewMatrix;`,`uniform vec3 cameraPosition;`,`uniform bool isOrthographic;`,r.toneMapping===0?``:`#define TONE_MAPPING`,r.toneMapping===0?``:tn.tonemapping_pars_fragment,r.toneMapping===0?``:ni(`toneMapping`,r.toneMapping),r.dithering?`#define DITHERING`:``,r.opaque?`#define OPAQUE`:``,tn.colorspace_pars_fragment,ei(`linearToOutputTexel`,r.outputColorSpace),ii(),r.useDepthPacking?`#define DEPTH_PACKING `+r.depthPacking:``,`
`].filter(ci).join(`
`)),c=fi(c),c=li(c,r),c=ui(c,r),l=fi(l),l=li(l,r),l=ui(l,r),c=hi(c),l=hi(l),r.isRawShaderMaterial!==!0&&(y=`#version 300 es
`,_=[m,`#define attribute in`,`#define varying out`,`#define texture2D texture`].join(`
`)+`
`+_,v=[`#define varying in`,r.glslVersion===`300 es`?``:`layout(location = 0) out highp vec4 pc_fragColor;`,r.glslVersion===`300 es`?``:`#define gl_FragColor pc_fragColor`,`#define gl_FragDepthEXT gl_FragDepth`,`#define texture2D texture`,`#define textureCube texture`,`#define texture2DProj textureProj`,`#define texture2DLodEXT textureLod`,`#define texture2DProjLodEXT textureProjLod`,`#define textureCubeLodEXT textureLod`,`#define texture2DGradEXT textureGrad`,`#define texture2DProjGradEXT textureProjGrad`,`#define textureCubeGradEXT textureGrad`].join(`
`)+`
`+v);let b=y+_+c,x=y+v+l,S=qr(a,a.VERTEX_SHADER,b),C=qr(a,a.FRAGMENT_SHADER,x);a.attachShader(g,S),a.attachShader(g,C),r.index0AttributeName===void 0?r.hasPositionAttribute===!0&&a.bindAttribLocation(g,0,`position`):a.bindAttribLocation(g,0,r.index0AttributeName),a.linkProgram(g);function w(t){if(e.debug.checkShaderErrors){let r=a.getProgramInfoLog(g)||``,i=a.getShaderInfoLog(S)||``,s=a.getShaderInfoLog(C)||``,c=r.trim(),l=i.trim(),u=s.trim(),d=!0,f=!0;if(a.getProgramParameter(g,a.LINK_STATUS)===!1){if(d=!1,typeof e.debug.onShaderError==`function`)e.debug.onShaderError(a,g,S,C);else{let e=$r(a,S,`vertex`),n=$r(a,C,`fragment`);o(`WebGLProgram: Shader Error `+a.getError()+` - VALIDATE_STATUS `+a.getProgramParameter(g,a.VALIDATE_STATUS)+`

Material Name: `+t.name+`
Material Type: `+t.type+`

Program Info Log: `+c+`
`+e+`
`+n)}}else c===``?(l===``||u===``)&&(f=!1):n(`WebGLProgram: Program Info Log:`,c);f&&(t.diagnostics={runnable:d,programLog:c,vertexShader:{log:l,prefix:_},fragmentShader:{log:u,prefix:v}})}a.deleteShader(S),a.deleteShader(C),T=new Kr(a,g),E=si(a,g)}let T;this.getUniforms=function(){return T===void 0&&w(this),T};let E;this.getAttributes=function(){return E===void 0&&w(this),E};let D=r.rendererExtensionParallelShaderCompile===!1;return this.isReady=function(){return D===!1&&(D=a.getProgramParameter(g,Jr)),D},this.destroy=function(){i.releaseStatesOfProgram(this),a.deleteProgram(g),this.program=void 0},this.type=r.shaderType,this.name=r.shaderName,this.id=Yr++,this.cacheKey=t,this.usedTimes=1,this.program=g,this.vertexShader=S,this.fragmentShader=C,this}var Ti=0,Ei=class{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(e,t,n){let r=this._getShaderCacheForMaterial(e);return r.has(t)===!1&&(r.add(t),t.usedTimes++),r.has(n)===!1&&(r.add(n),n.usedTimes++),this}remove(e){let t=this.materialCache.get(e);for(let e of t)e.usedTimes--,e.usedTimes===0&&this.shaderCache.delete(e.code);return this.materialCache.delete(e),this}getVertexShaderStage(e){return this._getShaderStage(e.vertexShader)}getFragmentShaderStage(e){return this._getShaderStage(e.fragmentShader)}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(e){let t=this.materialCache,n=t.get(e);return n===void 0&&(n=new Set,t.set(e,n)),n}_getShaderStage(e){let t=this.shaderCache,n=t.get(e);return n===void 0&&(n=new Di(e),t.set(e,n)),n}},Di=class{constructor(e){this.id=Ti++,this.code=e,this.usedTimes=0}};function Oi(e){return e===1030||e===37490||e===36285}function ki(e,t,r,i,a,o){let s=new S,c=new Ei,l=new Set,u=[],d=new Map,f=i.logarithmicDepthBuffer,p={MeshDepthMaterial:`depth`,MeshDistanceMaterial:`distance`,MeshNormalMaterial:`normal`,MeshBasicMaterial:`basic`,MeshLambertMaterial:`lambert`,MeshPhongMaterial:`phong`,MeshToonMaterial:`toon`,MeshStandardMaterial:`physical`,MeshPhysicalMaterial:`physical`,MeshMatcapMaterial:`matcap`,LineBasicMaterial:`basic`,LineDashedMaterial:`dashed`,PointsMaterial:`points`,ShadowMaterial:`shadow`,SpriteMaterial:`sprite`};function m(e){return l.add(e),e===0?`uv`:`uv${e}`}function h(a,s,u,d,h,g){let _=d.fog,v=h.geometry,y=a.isMeshStandardMaterial||a.isMeshLambertMaterial||a.isMeshPhongMaterial?d.environment:null,b=a.isMeshStandardMaterial||a.isMeshLambertMaterial&&!a.envMap||a.isMeshPhongMaterial&&!a.envMap,x=t.get(a.envMap||y,b),S=p[a.type],C=i.precision;a.precision!==null&&(C=i.getMaxPrecision(a.precision),C!==a.precision&&n(`WebGLProgram.getParameters:`,a.precision,`not supported, using`,C,`instead.`));let w=v.morphAttributes.position||v.morphAttributes.normal||v.morphAttributes.color,T=w===void 0?0:w.length,E=0;v.morphAttributes.position!==void 0&&(E=1),v.morphAttributes.normal!==void 0&&(E=2),v.morphAttributes.color!==void 0&&(E=3);let D,O,k,A;if(S){let e=nn[S];D=e.vertexShader,O=e.fragmentShader}else{D=a.vertexShader,O=a.fragmentShader;let e=c.getVertexShaderStage(a),t=c.getFragmentShaderStage(a);c.update(a,e,t),k=e.id,A=t.id}let j=e.getRenderTarget(),M=e.state.buffers.depth.getReversed(),N=h.isInstancedMesh===!0,P=h.isBatchedMesh===!0,ee=!!a.map,te=!!a.matcap,ne=!!x,F=ne&&x.isPMREMTexture===!0,re=!!a.aoMap,ie=!!a.lightMap,ae=!!a.bumpMap&&a.wireframe===!1,oe=!!a.normalMap,I=!!a.displacementMap,se=!!a.emissiveMap,ce=!!a.metalnessMap,L=!!a.roughnessMap,le=a.anisotropy>0,ue=a.clearcoat>0,fe=a.diffuseRoughness>0,pe=a.dispersion>0,me=a.retroreflectivity>0,he=a.iridescence>0,ge=a.sheen>0,_e=a.transmission>0,R=le&&!!a.anisotropyMap,ve=ue&&!!a.clearcoatMap,ye=ue&&!!a.clearcoatNormalMap,be=ue&&!!a.clearcoatRoughnessMap,xe=fe&&!!a.diffuseRoughnessMap,Se=he&&!!a.iridescenceMap,Ce=he&&!!a.iridescenceThicknessMap,we=ge&&!!a.sheenColorMap,Te=ge&&!!a.sheenRoughnessMap,z=!!a.specularMap,Ee=!!a.specularColorMap,De=!!a.specularIntensityMap,Oe=_e&&!!a.transmissionMap,ke=_e&&!!a.thicknessMap,Ae=!!a.gradientMap,je=!!a.alphaMap,Me=a.alphaTest>0,Ne=!!a.alphaHash,Pe=!!a.extensions,Fe=0;a.toneMapped&&(j===null||j.isXRRenderTarget===!0)&&(Fe=e.toneMapping);let Ie=F?x.isCompressedCubeTexture?x.image[0].mipmaps:x.mipmaps:null,Le={shaderID:S,shaderType:a.type,shaderName:a.name,vertexShader:D,fragmentShader:O,defines:a.defines,customVertexShaderID:k,customFragmentShaderID:A,isRawShaderMaterial:a.isRawShaderMaterial===!0,glslVersion:a.glslVersion,precision:C,batching:P,batchingColor:P&&h._colorsTexture!==null,instancing:N,instancingColor:N&&h.instanceColor!==null,instancingMorph:N&&h.morphTexture!==null,outputColorSpace:j===null?e.outputColorSpace:j.isXRRenderTarget===!0?j.texture.colorSpace:de.workingColorSpace,alphaToCoverage:!!a.alphaToCoverage,map:ee,matcap:te,envMap:ne,envMapMode:ne&&x.mapping,envMapPMREM:F,envMapMaxLod:F?Ie.length-1:null,envMapSize:F?Ie[0].width:null,aoMap:re,lightMap:ie,bumpMap:ae,normalMap:oe,displacementMap:I,emissiveMap:se,normalMapObjectSpace:oe&&a.normalMapType===1,normalMapTangentSpace:oe&&a.normalMapType===0,packedNormalMap:oe&&a.normalMapType===0&&Oi(a.normalMap.format),metalnessMap:ce,roughnessMap:L,anisotropy:le,anisotropyMap:R,clearcoat:ue,clearcoatMap:ve,clearcoatNormalMap:ye,clearcoatRoughnessMap:be,diffuseRoughness:fe,diffuseRoughnessMap:xe,dispersion:pe,retroreflection:me,iridescence:he,iridescenceMap:Se,iridescenceThicknessMap:Ce,sheen:ge,sheenColorMap:we,sheenRoughnessMap:Te,specularMap:z,specularColorMap:Ee,specularIntensityMap:De,transmission:_e,transmissionMap:Oe,thicknessMap:ke,gradientMap:Ae,opaque:a.transparent===!1&&a.blending===1&&a.alphaToCoverage===!1,alphaMap:je,alphaTest:Me,alphaHash:Ne,combine:a.combine,mapUv:ee&&m(a.map.channel),aoMapUv:re&&m(a.aoMap.channel),lightMapUv:ie&&m(a.lightMap.channel),bumpMapUv:ae&&m(a.bumpMap.channel),normalMapUv:oe&&m(a.normalMap.channel),displacementMapUv:I&&m(a.displacementMap.channel),emissiveMapUv:se&&m(a.emissiveMap.channel),metalnessMapUv:ce&&m(a.metalnessMap.channel),roughnessMapUv:L&&m(a.roughnessMap.channel),anisotropyMapUv:R&&m(a.anisotropyMap.channel),clearcoatMapUv:ve&&m(a.clearcoatMap.channel),clearcoatNormalMapUv:ye&&m(a.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:be&&m(a.clearcoatRoughnessMap.channel),diffuseRoughnessMapUv:xe&&m(a.diffuseRoughnessMap.channel),iridescenceMapUv:Se&&m(a.iridescenceMap.channel),iridescenceThicknessMapUv:Ce&&m(a.iridescenceThicknessMap.channel),sheenColorMapUv:we&&m(a.sheenColorMap.channel),sheenRoughnessMapUv:Te&&m(a.sheenRoughnessMap.channel),specularMapUv:z&&m(a.specularMap.channel),specularColorMapUv:Ee&&m(a.specularColorMap.channel),specularIntensityMapUv:De&&m(a.specularIntensityMap.channel),transmissionMapUv:Oe&&m(a.transmissionMap.channel),thicknessMapUv:ke&&m(a.thicknessMap.channel),alphaMapUv:je&&m(a.alphaMap.channel),vertexTangents:!!v.attributes.tangent&&(oe||le),vertexNormals:!!v.attributes.normal,vertexColors:a.vertexColors,vertexAlphas:a.vertexColors===!0&&!!v.attributes.color&&v.attributes.color.itemSize===4,pointsUvs:h.isPoints===!0&&!!v.attributes.uv&&(ee||je),fog:!!_,useFog:a.fog===!0,fogExp2:!!_&&_.isFogExp2,flatShading:a.wireframe===!1&&(a.flatShading===!0||v.attributes.normal===void 0&&oe===!1&&(a.isMeshLambertMaterial||a.isMeshPhongMaterial||a.isMeshStandardMaterial||a.isMeshPhysicalMaterial)),sizeAttenuation:a.sizeAttenuation===!0,logarithmicDepthBuffer:f,reversedDepthBuffer:M,skinning:h.isSkinnedMesh===!0,hasPositionAttribute:v.attributes.position!==void 0,morphTargets:v.morphAttributes.position!==void 0,morphNormals:v.morphAttributes.normal!==void 0,morphColors:v.morphAttributes.color!==void 0,morphTargetsCount:T,morphTextureStride:E,numSunLights:s.sun.length,numDirLights:s.directional.length,numPointLights:s.point.length,numSpotLights:s.spot.length,numSpotLightMaps:s.spotLightMap.length,numRectAreaLights:s.rectArea.length,numHemiLights:s.hemi.length,numSunLightShadows:s.sunShadowMap.length,numDirLightShadows:s.directionalShadowMap.length,numPointLightShadows:s.pointShadowMap.length,numSpotLightShadows:s.spotShadowMap.length,numSpotLightShadowsWithMaps:s.numSpotLightShadowsWithMaps,numLightProbes:s.numLightProbes,numLightProbeGrids:g.filter(e=>e.texture!==null).length,numClippingPlanes:o.numPlanes,numClipIntersection:o.numIntersection,dithering:a.dithering,shadowMapEnabled:e.shadowMap.enabled&&u.length>0,shadowMapType:e.shadowMap.type,toneMapping:Fe,decodeVideoTexture:ee&&a.map.isVideoTexture===!0&&de.getTransfer(a.map.colorSpace)===`srgb`,decodeVideoTextureEmissive:se&&a.emissiveMap.isVideoTexture===!0&&de.getTransfer(a.emissiveMap.colorSpace)===`srgb`,premultipliedAlpha:a.premultipliedAlpha,doubleSided:a.side===2,flipSided:a.side===1,useDepthPacking:a.depthPacking>=0,depthPacking:a.depthPacking||0,index0AttributeName:a.index0AttributeName,extensionClipCullDistance:Pe&&a.extensions.clipCullDistance===!0&&r.has(`WEBGL_clip_cull_distance`),extensionMultiDraw:(Pe&&a.extensions.multiDraw===!0||P)&&r.has(`WEBGL_multi_draw`),rendererExtensionParallelShaderCompile:r.has(`KHR_parallel_shader_compile`),customProgramCacheKey:a.customProgramCacheKey()};return Le.vertexUv1s=l.has(1),Le.vertexUv2s=l.has(2),Le.vertexUv3s=l.has(3),l.clear(),Le}function g(t){let n=[];if(t.shaderID?n.push(t.shaderID):(n.push(t.customVertexShaderID),n.push(t.customFragmentShaderID)),t.defines!==void 0)for(let e in t.defines)n.push(e),n.push(t.defines[e]);return t.isRawShaderMaterial===!1&&(_(n,t),v(n,t),n.push(e.outputColorSpace)),n.push(t.customProgramCacheKey),n.join()}function _(e,t){e.push(t.precision),e.push(t.outputColorSpace),e.push(t.envMapMode),e.push(t.envMapPMREM),e.push(t.envMapMaxLod),e.push(t.envMapSize),e.push(t.mapUv),e.push(t.alphaMapUv),e.push(t.lightMapUv),e.push(t.aoMapUv),e.push(t.bumpMapUv),e.push(t.normalMapUv),e.push(t.displacementMapUv),e.push(t.emissiveMapUv),e.push(t.metalnessMapUv),e.push(t.roughnessMapUv),e.push(t.anisotropyMapUv),e.push(t.clearcoatMapUv),e.push(t.clearcoatNormalMapUv),e.push(t.clearcoatRoughnessMapUv),e.push(t.diffuseRoughnessMapUv),e.push(t.iridescenceMapUv),e.push(t.iridescenceThicknessMapUv),e.push(t.sheenColorMapUv),e.push(t.sheenRoughnessMapUv),e.push(t.specularMapUv),e.push(t.specularColorMapUv),e.push(t.specularIntensityMapUv),e.push(t.transmissionMapUv),e.push(t.thicknessMapUv),e.push(t.combine),e.push(t.fogExp2),e.push(t.sizeAttenuation),e.push(t.morphTargetsCount),e.push(t.numSunLights),e.push(t.numDirLights),e.push(t.numPointLights),e.push(t.numSpotLights),e.push(t.numSpotLightMaps),e.push(t.numHemiLights),e.push(t.numRectAreaLights),e.push(t.numSunLightShadows),e.push(t.numDirLightShadows),e.push(t.numPointLightShadows),e.push(t.numSpotLightShadows),e.push(t.numSpotLightShadowsWithMaps),e.push(t.numLightProbes),e.push(t.numLightProbeGrids),e.push(t.shadowMapType),e.push(t.toneMapping),e.push(t.numClippingPlanes),e.push(t.numClipIntersection),e.push(t.depthPacking)}function v(e,t){s.disableAll(),t.instancing&&s.enable(0),t.instancingColor&&s.enable(1),t.instancingMorph&&s.enable(2),t.matcap&&s.enable(3),t.envMap&&s.enable(4),t.normalMapObjectSpace&&s.enable(5),t.normalMapTangentSpace&&s.enable(6),t.clearcoat&&s.enable(7),t.iridescence&&s.enable(8),t.alphaTest&&s.enable(9),t.vertexColors&&s.enable(10),t.vertexAlphas&&s.enable(11),t.vertexUv1s&&s.enable(12),t.vertexUv2s&&s.enable(13),t.vertexUv3s&&s.enable(14),t.vertexTangents&&s.enable(15),t.anisotropy&&s.enable(16),t.alphaHash&&s.enable(17),t.batching&&s.enable(18),t.dispersion&&s.enable(19),t.retroreflection&&s.enable(24),t.diffuseRoughness&&s.enable(25),t.batchingColor&&s.enable(20),t.gradientMap&&s.enable(21),t.packedNormalMap&&s.enable(22),t.vertexNormals&&s.enable(23),e.push(s.mask),s.disableAll(),t.fog&&s.enable(0),t.useFog&&s.enable(1),t.flatShading&&s.enable(2),t.logarithmicDepthBuffer&&s.enable(3),t.reversedDepthBuffer&&s.enable(4),t.skinning&&s.enable(5),t.morphTargets&&s.enable(6),t.morphNormals&&s.enable(7),t.morphColors&&s.enable(8),t.premultipliedAlpha&&s.enable(9),t.shadowMapEnabled&&s.enable(10),t.doubleSided&&s.enable(11),t.flipSided&&s.enable(12),t.useDepthPacking&&s.enable(13),t.dithering&&s.enable(14),t.transmission&&s.enable(15),t.sheen&&s.enable(16),t.opaque&&s.enable(17),t.pointsUvs&&s.enable(18),t.decodeVideoTexture&&s.enable(19),t.decodeVideoTextureEmissive&&s.enable(20),t.alphaToCoverage&&s.enable(21),t.numLightProbeGrids>0&&s.enable(22),t.hasPositionAttribute&&s.enable(23),e.push(s.mask)}function y(e){let t=p[e.type],n;if(t){let e=nn[t];n=se.clone(e.uniforms)}else n=e.uniforms;return n}function b(t,n){let r=d.get(n);return r===void 0?(r=new wi(e,n,t,a),u.push(r),d.set(n,r)):++r.usedTimes,r}function x(e){if(--e.usedTimes===0){let t=u.indexOf(e);u[t]=u[u.length-1],u.pop(),d.delete(e.cacheKey),e.destroy()}}function C(e){c.remove(e)}function w(){c.dispose()}return{getParameters:h,getProgramCacheKey:g,getUniforms:y,acquireProgram:b,releaseProgram:x,releaseShaderCache:C,programs:u,dispose:w}}function Ai(){let e=new WeakMap;function t(t){return e.has(t)}function n(t){let n=e.get(t);return n===void 0&&(n={},e.set(t,n)),n}function r(t){e.delete(t)}function i(t,n,r){e.get(t)[n]=r}function a(){e=new WeakMap}return{has:t,get:n,remove:r,update:i,dispose:a}}function ji(e,t){return e.groupOrder===t.groupOrder?e.renderOrder===t.renderOrder?e.material.id===t.material.id?e.materialVariant===t.materialVariant?e.z===t.z?e.id-t.id:e.z-t.z:e.materialVariant-t.materialVariant:e.material.id-t.material.id:e.renderOrder-t.renderOrder:e.groupOrder-t.groupOrder}function Mi(e,t){return e.groupOrder===t.groupOrder?e.renderOrder===t.renderOrder?e.z===t.z?e.id-t.id:t.z-e.z:e.renderOrder-t.renderOrder:e.groupOrder-t.groupOrder}function Ni(){let e=[],t=0,n=[],r=[],i=[];function a(){t=0,n.length=0,r.length=0,i.length=0}function o(e){let t=0;return e.isInstancedMesh&&(t+=2),e.isSkinnedMesh&&(t+=1),t}function s(n,r,i,a,s,c){let l=e[t];return l===void 0?(l={id:n.id,object:n,geometry:r,material:i,materialVariant:o(n),groupOrder:a,renderOrder:n.renderOrder,z:s,group:c},e[t]=l):(l.id=n.id,l.object=n,l.geometry=r,l.material=i,l.materialVariant=o(n),l.groupOrder=a,l.renderOrder=n.renderOrder,l.z=s,l.group=c),t++,l}function c(e,t,a,o,c,l,u){u.reversedDepth===!0&&(c=-c);let d=s(e,t,a,o,c,l);a.transmission>0?r.push(d):a.transparent===!0?i.push(d):n.push(d)}function l(e,t,a,o,c,l){let u=s(e,t,a,o,c,l);a.transmission>0?r.unshift(u):a.transparent===!0?i.unshift(u):n.unshift(u)}function u(e,t){n.length>1&&n.sort(e||ji),r.length>1&&r.sort(t||Mi),i.length>1&&i.sort(t||Mi)}function d(){for(let n=t,r=e.length;n<r;n++){let t=e[n];if(t.id===null)break;t.id=null,t.object=null,t.geometry=null,t.material=null,t.group=null}}return{opaque:n,transmissive:r,transparent:i,init:a,push:c,unshift:l,finish:d,sort:u}}function Pi(){let e=new WeakMap;function t(t,n){let r=e.get(t),i;return r===void 0?(i=new Ni,e.set(t,[i])):n>=r.length?(i=new Ni,r.push(i)):i=r[n],i}function n(){e=new WeakMap}return{get:t,dispose:n}}function Fi(){let e={};return{get:function(t){if(e[t.id]!==void 0)return e[t.id];let n;switch(t.type){case`SunLight`:case`DirectionalLight`:n={direction:new R,color:new Le};break;case`SpotLight`:n={position:new R,direction:new R,color:new Le,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case`PointLight`:n={position:new R,color:new Le,distance:0,decay:0};break;case`HemisphereLight`:n={direction:new R,skyColor:new Le,groundColor:new Le};break;case`RectAreaLight`:n={color:new Le,position:new R,halfWidth:new R,halfHeight:new R}}return e[t.id]=n,n}}}function Ii(){let e={};return{get:function(t){if(e[t.id]!==void 0)return e[t.id];let n;switch(t.type){case`SunLight`:case`DirectionalLight`:n={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Te};break;case`SpotLight`:n={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Te};break;case`PointLight`:n={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Te,shadowCameraNear:1,shadowCameraFar:1e3}}return e[t.id]=n,n}}}var Li=0;function Ri(e,t){return(t.castShadow?2:0)-(e.castShadow?2:0)+ +!!t.map-!!e.map}function zi(e){let t=new Fi,n=Ii(),i={version:0,hash:{sunLength:-1,directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numSunShadows:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],sun:[],sunShadow:[],sunShadowMap:[],sunShadowMatrix:[],sunShadowCascade:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let e=0;e<9;e++)i.probe.push(new R);let a=new R,o=new r,s=new r;function c(r){let a=0,o=0,s=0;for(let e=0;e<9;e++)i.probe[e].set(0,0,0);let c=0,l=0,u=0,d=0,f=0,p=0,m=0,h=0,g=0,_=0,v=0,y=0,b=0,x=0;r.sort(Ri);for(let e=0,S=r.length;e<S;e++){let S=r[e],C=S.color,w=S.intensity,T=S.distance,E=null;if(S.shadow&&S.shadow.map&&(E=S.shadow.map.texture.format===1030?S.shadow.map.texture:S.shadow.map.depthTexture||S.shadow.map.texture),S.isAmbientLight)a+=C.r*w,o+=C.g*w,s+=C.b*w;else if(S.isLightProbe){for(let e=0;e<9;e++)i.probe[e].addScaledVector(S.sh.coefficients[e],w);x++}else if(S.isSunLight){let e=t.get(S);if(e.color.copy(S.color).multiplyScalar(S.intensity),S.castShadow){let e=S.shadow,t=n.get(S);t.shadowIntensity=e.intensity,t.shadowBias=e.bias,t.shadowNormalBias=e.normalBias,t.shadowRadius=e.radius,t.shadowMapSize.copy(e.mapSize).multiply(e.getFrameExtents()),i.sunShadow[l]=t,i.sunShadowMap[l]=E;let r=e.getViewportCount();for(let t=0;t<r;t++)i.sunShadowMatrix[u+t]=e.getMatrix(t),i.sunShadowCascade[u+t]=e._cascadeData[t];u+=r,l++}i.sun[c]=e,c++}else if(S.isDirectionalLight){let e=t.get(S);if(e.color.copy(S.color).multiplyScalar(S.intensity),S.castShadow){let e=S.shadow,t=n.get(S);t.shadowIntensity=e.intensity,t.shadowBias=e.bias,t.shadowNormalBias=e.normalBias,t.shadowRadius=e.radius,t.shadowMapSize=e.mapSize,i.directionalShadow[d]=t,i.directionalShadowMap[d]=E,i.directionalShadowMatrix[d]=S.shadow.matrix,g++}i.directional[d]=e,d++}else if(S.isSpotLight){let e=t.get(S);e.position.setFromMatrixPosition(S.matrixWorld),e.color.copy(C).multiplyScalar(w),e.distance=T,e.coneCos=Math.cos(S.angle),e.penumbraCos=Math.cos(S.angle*(1-S.penumbra)),e.decay=S.decay,i.spot[p]=e;let r=S.shadow;if(S.map&&(i.spotLightMap[y]=S.map,y++,r.updateMatrices(S),S.castShadow&&b++),i.spotLightMatrix[p]=r.matrix,S.castShadow){let e=n.get(S);e.shadowIntensity=r.intensity,e.shadowBias=r.bias,e.shadowNormalBias=r.normalBias,e.shadowRadius=r.radius,e.shadowMapSize=r.mapSize,i.spotShadow[p]=e,i.spotShadowMap[p]=E,v++}p++}else if(S.isRectAreaLight){let e=t.get(S);e.color.copy(C).multiplyScalar(w),e.halfWidth.set(S.width*.5,0,0),e.halfHeight.set(0,S.height*.5,0),i.rectArea[m]=e,m++}else if(S.isPointLight){let e=t.get(S);if(e.color.copy(S.color).multiplyScalar(S.intensity),e.distance=S.distance,e.decay=S.decay,S.castShadow){let e=S.shadow,t=n.get(S);t.shadowIntensity=e.intensity,t.shadowBias=e.bias,t.shadowNormalBias=e.normalBias,t.shadowRadius=e.radius,t.shadowMapSize=e.mapSize,t.shadowCameraNear=e.camera.near,t.shadowCameraFar=e.camera.far,i.pointShadow[f]=t,i.pointShadowMap[f]=E,i.pointShadowMatrix[f]=S.shadow.matrix,_++}i.point[f]=e,f++}else if(S.isHemisphereLight){let e=t.get(S);e.skyColor.copy(S.color).multiplyScalar(w),e.groundColor.copy(S.groundColor).multiplyScalar(w),i.hemi[h]=e,h++}}m>0&&(e.has(`OES_texture_float_linear`)===!0?(i.rectAreaLTC1=q.LTC_FLOAT_1,i.rectAreaLTC2=q.LTC_FLOAT_2):(i.rectAreaLTC1=q.LTC_HALF_1,i.rectAreaLTC2=q.LTC_HALF_2)),i.ambient[0]=a,i.ambient[1]=o,i.ambient[2]=s;let S=i.hash;(S.sunLength!==c||S.directionalLength!==d||S.pointLength!==f||S.spotLength!==p||S.rectAreaLength!==m||S.hemiLength!==h||S.numSunShadows!==l||S.numDirectionalShadows!==g||S.numPointShadows!==_||S.numSpotShadows!==v||S.numSpotMaps!==y||S.numLightProbes!==x)&&(i.sun.length=c,i.directional.length=d,i.spot.length=p,i.rectArea.length=m,i.point.length=f,i.hemi.length=h,i.sunShadow.length=l,i.sunShadowMap.length=l,i.sunShadowMatrix.length=u,i.sunShadowCascade.length=u,i.directionalShadow.length=g,i.directionalShadowMap.length=g,i.directionalShadowMatrix.length=g,i.pointShadow.length=_,i.pointShadowMap.length=_,i.pointShadowMatrix.length=_,i.spotShadow.length=v,i.spotShadowMap.length=v,i.spotLightMatrix.length=v+y-b,i.spotLightMap.length=y,i.numSpotLightShadowsWithMaps=b,i.numLightProbes=x,S.sunLength=c,S.directionalLength=d,S.pointLength=f,S.spotLength=p,S.rectAreaLength=m,S.hemiLength=h,S.numSunShadows=l,S.numDirectionalShadows=g,S.numPointShadows=_,S.numSpotShadows=v,S.numSpotMaps=y,S.numLightProbes=x,i.version=Li++)}function l(e,t){let n=0,r=0,c=0,l=0,u=0,d=0,f=t.matrixWorldInverse;for(let t=0,p=e.length;t<p;t++){let p=e[t];if(p.isSunLight){let e=i.sun[n];e.direction.setFromMatrixPosition(p.matrixWorld),e.direction.transformDirection(f),n++}else if(p.isDirectionalLight){let e=i.directional[r];e.direction.setFromMatrixPosition(p.matrixWorld),a.setFromMatrixPosition(p.target.matrixWorld),e.direction.sub(a),e.direction.transformDirection(f),r++}else if(p.isSpotLight){let e=i.spot[l];e.position.setFromMatrixPosition(p.matrixWorld),e.position.applyMatrix4(f),e.direction.setFromMatrixPosition(p.matrixWorld),a.setFromMatrixPosition(p.target.matrixWorld),e.direction.sub(a),e.direction.transformDirection(f),l++}else if(p.isRectAreaLight){let e=i.rectArea[u];e.position.setFromMatrixPosition(p.matrixWorld),e.position.applyMatrix4(f),s.identity(),o.copy(p.matrixWorld),o.premultiply(f),s.extractRotation(o),e.halfWidth.set(p.width*.5,0,0),e.halfHeight.set(0,p.height*.5,0),e.halfWidth.applyMatrix4(s),e.halfHeight.applyMatrix4(s),u++}else if(p.isPointLight){let e=i.point[c];e.position.setFromMatrixPosition(p.matrixWorld),e.position.applyMatrix4(f),c++}else if(p.isHemisphereLight){let e=i.hemi[d];e.direction.setFromMatrixPosition(p.matrixWorld),e.direction.transformDirection(f),d++}}}return{setup:c,setupView:l,state:i}}function Bi(e){let t=new zi(e),n=[],r=[],i=[];function a(e){u.camera=e,n.length=0,r.length=0,i.length=0}function o(e){e.isLightProbeGrid?i.push(e):n.push(e)}function s(e){r.push(e)}function c(){t.setup(n),i.sort((e,t)=>e.priority-t.priority||e.id-t.id)}function l(e){t.setupView(n,e)}let u={lightsArray:n,shadowsArray:r,lightProbeGridArray:i,camera:null,lights:t,transmissionRenderTarget:{},textureUnits:0};return{init:a,state:u,setupLights:c,setupLightsView:l,pushLight:o,pushShadow:s}}function Vi(e){let t=new WeakMap;function n(n,r=0){let i=t.get(n),a;return i===void 0?(a=new Bi(e),t.set(n,[a])):r>=i.length?(a=new Bi(e),i.push(a)):a=i[r],a}function r(){t=new WeakMap}return{get:n,dispose:r}}var Hi=`void main() {
	gl_Position = vec4( position, 1.0 );
}`,Ui=`uniform sampler2D shadow_pass;
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
}`,Wi=[new R(1,0,0),new R(-1,0,0),new R(0,1,0),new R(0,-1,0),new R(0,0,1),new R(0,0,-1)],Gi=[new R(0,-1,0),new R(0,-1,0),new R(0,0,1),new R(0,0,-1),new R(0,-1,0),new R(0,-1,0)],Ki=new r,qi=new R,Ji=new R;function Yi(e,t,r){let i=new s,a=new Te,o=new Te,c=new ge,u=new p,d=new N,m={},h=r.maxTextureSize,_={0:1,1:0,2:2},v=new F({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new Te},radius:{value:4}},vertexShader:Hi,fragmentShader:Ui}),y=v.clone();y.defines.HORIZONTAL_PASS=1;let b=new I;b.setAttribute(`position`,new ve(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));let x=new P(b,v),S=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=1;let C=this.type;this.render=function(t,r,s){if(S.enabled===!1||S.autoUpdate===!1&&S.needsUpdate===!1||t.length===0)return;this.type===2&&(n(`WebGLShadowMap: PCFSoftShadowMap has been removed. Using PCFShadowMap instead.`),this.type=1);let u=e.getRenderTarget(),d=e.getActiveCubeFace(),p=e.getActiveMipmapLevel(),m=e.state;m.setBlending(0),m.buffers.depth.getReversed()===!0?m.buffers.color.setClear(0,0,0,0):m.buffers.color.setClear(1,1,1,1),m.buffers.depth.setTest(!0),m.setScissorTest(!1);let _=C!==this.type;_&&r.traverse(function(e){e.material&&(Array.isArray(e.material)?e.material.forEach(e=>e.needsUpdate=!0):e.material.needsUpdate=!0)});for(let u=0,d=t.length;u<d;u++){let d=t[u],p=d.shadow;if(p===void 0){n(`WebGLShadowMap:`,d,`has no shadow.`);continue}if(p.autoUpdate===!1&&p.needsUpdate===!1)continue;a.copy(p.mapSize);let v=p.getFrameExtents();a.multiply(v),o.copy(p.mapSize),(a.x>h||a.y>h)&&(a.x>h&&(o.x=Math.floor(h/v.x),a.x=o.x*v.x,p.mapSize.x=o.x),a.y>h&&(o.y=Math.floor(h/v.y),a.y=o.y*v.y,p.mapSize.y=o.y));let y=e.state.buffers.depth.getReversed();if(p.camera._reversedDepth=y,p.map===null||_===!0){if(p.map!==null&&(p.map.depthTexture!==null&&(p.map.depthTexture.dispose(),p.map.depthTexture=null),p.map.dispose()),this.type===3){if(d.isPointLight){n(`WebGLShadowMap: VSM shadow maps are not supported for PointLights. Use PCF or BasicShadowMap instead.`);continue}p.map=new Be(a.x,a.y,{format:g,type:be,minFilter:T,magFilter:T,generateMipmaps:!1}),p.map.texture.name=d.name+`.shadowMap`,p.map.depthTexture=new L(a.x,a.y,l),p.map.depthTexture.name=d.name+`.shadowMapDepth`,p.map.depthTexture.format=ze,p.map.depthTexture.compareFunction=null,p.map.depthTexture.minFilter=f,p.map.depthTexture.magFilter=f}else d.isPointLight?(p.map=new fn(a.x),p.map.depthTexture=new ke(a.x,Re)):(p.map=new Be(a.x,a.y),p.map.depthTexture=new L(a.x,a.y,Re)),p.map.depthTexture.name=d.name+`.shadowMap`,p.map.depthTexture.format=ze,this.type===1?(p.map.depthTexture.compareFunction=y?518:515,p.map.depthTexture.minFilter=T,p.map.depthTexture.magFilter=T):(p.map.depthTexture.compareFunction=null,p.map.depthTexture.minFilter=f,p.map.depthTexture.magFilter=f);p.camera.updateProjectionMatrix()}p.map.isWebGLCubeRenderTarget!==!0&&(p.map.width!==a.x||p.map.height!==a.y)&&p.map.setSize(a.x,a.y);let b=p.map.isWebGLCubeRenderTarget?6:p.getViewportCount();d.isPointLight!==!0&&p.updateMatrices(d,s);let x=p.camera.layers.mask&4294967294?p.camera.layers:s.layers;for(let t=0;t<b;t++){let n=p.getCamera(t);if(d.isPointLight){let e=p.camera,n=p.matrix,r=d.distance||e.far;r!==e.far&&(e.far=r,e.updateProjectionMatrix()),qi.setFromMatrixPosition(d.matrixWorld),e.position.copy(qi),Ji.copy(e.position),Ji.add(Wi[t]),e.up.copy(Gi[t]),e.lookAt(Ji),e.updateMatrixWorld(),n.makeTranslation(-qi.x,-qi.y,-qi.z),Ki.multiplyMatrices(e.projectionMatrix,e.matrixWorldInverse),p._frustum.setFromProjectionMatrix(Ki,e.coordinateSystem,e.reversedDepth)}if(p.map.isWebGLCubeRenderTarget)e.setRenderTarget(p.map,t),e.clear();else{t===0&&(e.setRenderTarget(p.map),e.clear());let n=p.getViewport(t);c.set(o.x*n.x,o.y*n.y,o.x*n.z,o.y*n.w),m.viewport(c)}i=p.getFrustum(t),D(r,s,n,d,x,this.type)}p.isPointLightShadow!==!0&&this.type===3&&w(p,s),p.needsUpdate=!1}C=this.type,S.needsUpdate=!1,e.setRenderTarget(u,d,p)};function w(n,r){let i=t.update(x);v.defines.VSM_SAMPLES!==n.blurSamples&&(v.defines.VSM_SAMPLES=n.blurSamples,y.defines.VSM_SAMPLES=n.blurSamples,v.needsUpdate=!0,y.needsUpdate=!0),n.mapPass===null?n.mapPass=new Be(a.x,a.y,{format:g,type:be}):(n.mapPass.width!==n.map.width||n.mapPass.height!==n.map.height)&&n.mapPass.setSize(n.map.width,n.map.height),v.uniforms.shadow_pass.value=n.map.depthTexture,v.uniforms.resolution.value.set(n.map.width,n.map.height),v.uniforms.radius.value=n.radius,e.setRenderTarget(n.mapPass),e.clear(),e.renderBufferDirect(r,null,i,v,x,null),y.uniforms.shadow_pass.value=n.mapPass.texture,y.uniforms.resolution.value.set(n.map.width,n.map.height),y.uniforms.radius.value=n.radius,e.setRenderTarget(n.map),e.clear(),e.renderBufferDirect(r,null,i,y,x,null)}function E(t,n,r,i){let a=null,o=r.isPointLight===!0?t.customDistanceMaterial:t.customDepthMaterial;if(o!==void 0)a=o;else if(a=r.isPointLight===!0?d:u,e.localClippingEnabled&&n.clipShadows===!0&&Array.isArray(n.clippingPlanes)&&n.clippingPlanes.length!==0||n.displacementMap&&n.displacementScale!==0||n.alphaMap&&n.alphaTest>0||n.map&&n.alphaTest>0||n.alphaToCoverage===!0){let e=a.uuid,t=n.uuid,r=m[e];r===void 0&&(r={},m[e]=r);let i=r[t];i===void 0&&(i=a.clone(),r[t]=i,n.addEventListener(`dispose`,O)),a=i}if(a.visible=n.visible,a.wireframe=n.wireframe,i===3?a.side=n.shadowSide===null?n.side:n.shadowSide:a.side=n.shadowSide===null?_[n.side]:n.shadowSide,a.alphaMap=n.alphaMap,a.alphaTest=n.alphaToCoverage===!0?.5:n.alphaTest,a.map=n.map,a.clipShadows=n.clipShadows,a.clippingPlanes=n.clippingPlanes,a.clipIntersection=n.clipIntersection,a.displacementMap=n.displacementMap,a.displacementScale=n.displacementScale,a.displacementBias=n.displacementBias,a.wireframeLinewidth=n.wireframeLinewidth,a.linewidth=n.linewidth,r.isPointLight===!0&&a.isMeshDistanceMaterial===!0){let t=e.properties.get(a);t.light=r}return a}function D(n,r,a,o,s,c){if(n.visible===!1)return;if(n.layers.test(s)&&(n.isMesh||n.isLine||n.isPoints)&&(n.castShadow||n.receiveShadow&&c===3)&&(!n.frustumCulled||n.intersectsFrustum(i))){n.modelViewMatrix.multiplyMatrices(a.matrixWorldInverse,n.matrixWorld);let i=t.update(n),s=n.material;if(Array.isArray(s)){let t=i.groups;for(let l=0,u=t.length;l<u;l++){let u=t[l],d=s[u.materialIndex];if(d&&d.visible){let t=E(n,d,o,c);n.onBeforeShadow(e,n,r,a,i,t,u),e.renderBufferDirect(a,null,i,t,n,u),n.onAfterShadow(e,n,r,a,i,t,u)}}}else if(s.visible){let t=E(n,s,o,c);n.onBeforeShadow(e,n,r,a,i,t,null),e.renderBufferDirect(a,null,i,t,n,null),n.onAfterShadow(e,n,r,a,i,t,null)}}let l=n.children;for(let e=0,t=l.length;e<t;e++)D(l[e],r,a,o,s,c)}function O(e){e.target.removeEventListener(`dispose`,O);for(let t in m){let n=m[t],r=e.target.uuid;r in n&&(n[r].dispose(),delete n[r])}}}function Xi(e,t){function n(){let t=!1,n=new ge,r=null,i=new ge(0,0,0,0);return{setMask:function(n){r!==n&&!t&&(e.colorMask(n,n,n,n),r=n)},setLocked:function(e){t=e},setClear:function(t,r,a,o,s){s===!0&&(t*=o,r*=o,a*=o),n.set(t,r,a,o),i.equals(n)===!1&&(e.clearColor(t,r,a,o),i.copy(n))},reset:function(){t=!1,r=null,i.set(-1,0,0,0)}}}function r(){let n=!1,r=!1,i=null,a=null,o=null;return{setReversed:function(e){if(r!==e){let n=t.get(`EXT_clip_control`);e?n.clipControlEXT(n.LOWER_LEFT_EXT,n.ZERO_TO_ONE_EXT):n.clipControlEXT(n.LOWER_LEFT_EXT,n.NEGATIVE_ONE_TO_ONE_EXT),r=e;let i=o;o=null,this.setClear(i)}},getReversed:function(){return r},setTest:function(t){t?L(e.DEPTH_TEST):le(e.DEPTH_TEST)},setMask:function(t){i!==t&&!n&&(e.depthMask(t),i=t)},setFunc:function(t){if(r&&(t=m[t]),a!==t){switch(t){case 0:e.depthFunc(e.NEVER);break;case 1:e.depthFunc(e.ALWAYS);break;case 2:e.depthFunc(e.LESS);break;case 3:e.depthFunc(e.LEQUAL);break;case 4:e.depthFunc(e.EQUAL);break;case 5:e.depthFunc(e.GEQUAL);break;case 6:e.depthFunc(e.GREATER);break;case 7:e.depthFunc(e.NOTEQUAL);break;default:e.depthFunc(e.LEQUAL)}a=t}},setLocked:function(e){n=e},setClear:function(t){o!==t&&(o=t,r&&(t=1-t),e.clearDepth(t))},reset:function(){n=!1,i=null,a=null,o=null,r=!1}}}function i(){let t=!1,n=null,r=null,i=null,a=null,o=null,s=null,c=null,l=null;return{setTest:function(n){t||(n?L(e.STENCIL_TEST):le(e.STENCIL_TEST))},setMask:function(r){n!==r&&!t&&(e.stencilMask(r),n=r)},setFunc:function(t,n,o){(r!==t||i!==n||a!==o)&&(e.stencilFunc(t,n,o),r=t,i=n,a=o)},setOp:function(t,n,r){(o!==t||s!==n||c!==r)&&(e.stencilOp(t,n,r),o=t,s=n,c=r)},setLocked:function(e){t=e},setClear:function(t){l!==t&&(e.clearStencil(t),l=t)},reset:function(){t=!1,n=null,r=null,i=null,a=null,o=null,s=null,c=null,l=null}}}let a=new n,s=new r,c=new i,l={},u=new WeakMap,d={},f={},p={},h=new WeakMap,g=[],_=null,v=!1,y=null,b=null,x=null,S=null,C=null,w=null,T=null,E=new Le(0,0,0),D=0,O=!1,k=null,A=null,j=null,M=null,N=null,P=e.getParameter(e.MAX_COMBINED_TEXTURE_IMAGE_UNITS),ee=!1,te=0,ne=e.getParameter(e.VERSION);ne.indexOf(`WebGL`)===-1?ne.indexOf(`OpenGL ES`)!==-1&&(te=parseFloat(/^OpenGL ES (\d)/.exec(ne)[1]),ee=te>=2):(te=parseFloat(/^WebGL (\d)/.exec(ne)[1]),ee=te>=1);let F=null,re={},ie=e.getParameter(e.SCISSOR_BOX),ae=e.getParameter(e.VIEWPORT),oe=new ge().fromArray(ie),I=new ge().fromArray(ae);function se(t,n,r,i){let a=new Uint8Array(4),o=e.createTexture();e.bindTexture(t,o),e.texParameteri(t,e.TEXTURE_MIN_FILTER,e.NEAREST),e.texParameteri(t,e.TEXTURE_MAG_FILTER,e.NEAREST);for(let o=0;o<r;o++)t===e.TEXTURE_3D||t===e.TEXTURE_2D_ARRAY?e.texImage3D(n,0,e.RGBA,1,1,i,0,e.RGBA,e.UNSIGNED_BYTE,a):e.texImage2D(n+o,0,e.RGBA,1,1,0,e.RGBA,e.UNSIGNED_BYTE,a);return o}let ce={};ce[e.TEXTURE_2D]=se(e.TEXTURE_2D,e.TEXTURE_2D,1),ce[e.TEXTURE_CUBE_MAP]=se(e.TEXTURE_CUBE_MAP,e.TEXTURE_CUBE_MAP_POSITIVE_X,6),ce[e.TEXTURE_2D_ARRAY]=se(e.TEXTURE_2D_ARRAY,e.TEXTURE_2D_ARRAY,1,1),ce[e.TEXTURE_3D]=se(e.TEXTURE_3D,e.TEXTURE_3D,1,1),a.setClear(0,0,0,1),s.setClear(1),c.setClear(0),L(e.DEPTH_TEST),s.setFunc(3),R(!1),ve(1),L(e.CULL_FACE),he(0);function L(t){d[t]!==!0&&(e.enable(t),d[t]=!0)}function le(t){d[t]!==!1&&(e.disable(t),d[t]=!1)}function ue(t,n){return p[t]!==n&&(e.bindFramebuffer(t,n),p[t]=n,t===e.DRAW_FRAMEBUFFER&&(p[e.FRAMEBUFFER]=n),t===e.FRAMEBUFFER&&(p[e.DRAW_FRAMEBUFFER]=n),!0)}function de(t,n){let r=g,i=!1;if(t){r=h.get(n),r===void 0&&(r=[],h.set(n,r));let a=t.textures;if(r.length!==a.length||r[0]!==e.COLOR_ATTACHMENT0){for(let t=0,n=a.length;t<n;t++)r[t]=e.COLOR_ATTACHMENT0+t;r.length=a.length,i=!0}}else r[0]!==e.BACK&&(r[0]=e.BACK,i=!0);i&&e.drawBuffers(r)}function fe(t){return _!==t&&(e.useProgram(t),_=t,!0)}let pe={100:e.FUNC_ADD,101:e.FUNC_SUBTRACT,102:e.FUNC_REVERSE_SUBTRACT};pe[103]=e.MIN,pe[104]=e.MAX;let me={200:e.ZERO,201:e.ONE,202:e.SRC_COLOR,204:e.SRC_ALPHA,210:e.SRC_ALPHA_SATURATE,208:e.DST_COLOR,206:e.DST_ALPHA,203:e.ONE_MINUS_SRC_COLOR,205:e.ONE_MINUS_SRC_ALPHA,209:e.ONE_MINUS_DST_COLOR,207:e.ONE_MINUS_DST_ALPHA,211:e.CONSTANT_COLOR,212:e.ONE_MINUS_CONSTANT_COLOR,213:e.CONSTANT_ALPHA,214:e.ONE_MINUS_CONSTANT_ALPHA};function he(t,n,r,i,a,s,c,l,u,d){if(t===0)v===!0&&(le(e.BLEND),v=!1);else if(v===!1&&(L(e.BLEND),v=!0),t!==5){if(t!==y||d!==O){if((b!==100||C!==100)&&(e.blendEquation(e.FUNC_ADD),b=100,C=100),d)switch(t){case 1:e.blendFuncSeparate(e.ONE,e.ONE_MINUS_SRC_ALPHA,e.ONE,e.ONE_MINUS_SRC_ALPHA);break;case 2:e.blendFunc(e.ONE,e.ONE);break;case 3:e.blendFuncSeparate(e.ZERO,e.ONE_MINUS_SRC_COLOR,e.ZERO,e.ONE);break;case 4:e.blendFuncSeparate(e.DST_COLOR,e.ONE_MINUS_SRC_ALPHA,e.ZERO,e.ONE);break;default:o(`WebGLState: Invalid blending: `,t)}else switch(t){case 1:e.blendFuncSeparate(e.SRC_ALPHA,e.ONE_MINUS_SRC_ALPHA,e.ONE,e.ONE_MINUS_SRC_ALPHA);break;case 2:e.blendFuncSeparate(e.SRC_ALPHA,e.ONE,e.ONE,e.ONE);break;case 3:o(`WebGLState: SubtractiveBlending requires material.premultipliedAlpha = true`);break;case 4:o(`WebGLState: MultiplyBlending requires material.premultipliedAlpha = true`);break;default:o(`WebGLState: Invalid blending: `,t)}x=null,S=null,w=null,T=null,E.set(0,0,0),D=0,y=t,O=d}}else a||=n,s||=r,c||=i,(n!==b||a!==C)&&(e.blendEquationSeparate(pe[n],pe[a]),b=n,C=a),(r!==x||i!==S||s!==w||c!==T)&&(e.blendFuncSeparate(me[r],me[i],me[s],me[c]),x=r,S=i,w=s,T=c),(l.equals(E)===!1||u!==D)&&(e.blendColor(l.r,l.g,l.b,u),E.copy(l),D=u),y=t,O=!1}function _e(t,n){t.side===2?le(e.CULL_FACE):L(e.CULL_FACE);let r=t.side===1;n&&(r=!r),R(r),t.blending===1&&t.transparent===!1?he(0):he(t.blending,t.blendEquation,t.blendSrc,t.blendDst,t.blendEquationAlpha,t.blendSrcAlpha,t.blendDstAlpha,t.blendColor,t.blendAlpha,t.premultipliedAlpha),s.setFunc(t.depthFunc),s.setTest(t.depthTest),s.setMask(t.depthWrite),a.setMask(t.colorWrite);let i=t.stencilWrite;c.setTest(i),i&&(c.setMask(t.stencilWriteMask),c.setFunc(t.stencilFunc,t.stencilRef,t.stencilFuncMask),c.setOp(t.stencilFail,t.stencilZFail,t.stencilZPass)),be(t.polygonOffset,t.polygonOffsetFactor,t.polygonOffsetUnits),t.alphaToCoverage===!0?L(e.SAMPLE_ALPHA_TO_COVERAGE):le(e.SAMPLE_ALPHA_TO_COVERAGE)}function R(t){k!==t&&(t?e.frontFace(e.CW):e.frontFace(e.CCW),k=t)}function ve(t){t===0?le(e.CULL_FACE):(L(e.CULL_FACE),t!==A&&(t===1?e.cullFace(e.BACK):t===2?e.cullFace(e.FRONT):e.cullFace(e.FRONT_AND_BACK))),A=t}function ye(t){t!==j&&(ee&&e.lineWidth(t),j=t)}function be(t,n,r){t?(L(e.POLYGON_OFFSET_FILL),(M!==n||N!==r)&&(M=n,N=r,s.getReversed()&&(n=-n,r=-r),e.polygonOffset(n,r))):le(e.POLYGON_OFFSET_FILL)}function xe(t){t?L(e.SCISSOR_TEST):le(e.SCISSOR_TEST)}function Se(t){t===void 0&&(t=e.TEXTURE0+P-1),F!==t&&(e.activeTexture(t),F=t)}function Ce(t,n,r){r===void 0&&(r=F===null?e.TEXTURE0+P-1:F);let i=re[r];i===void 0&&(i={type:void 0,texture:void 0},re[r]=i),(i.type!==t||i.texture!==n)&&(F!==r&&(e.activeTexture(r),F=r),e.bindTexture(t,n||ce[t]),i.type=t,i.texture=n)}function we(){let t=re[F];t!==void 0&&t.type!==void 0&&(e.bindTexture(t.type,null),t.type=void 0,t.texture=void 0)}function Te(){try{e.compressedTexImage2D(...arguments)}catch(e){o(`WebGLState:`,e)}}function z(){try{e.compressedTexImage3D(...arguments)}catch(e){o(`WebGLState:`,e)}}function Ee(){try{e.texSubImage2D(...arguments)}catch(e){o(`WebGLState:`,e)}}function De(){try{e.texSubImage3D(...arguments)}catch(e){o(`WebGLState:`,e)}}function Oe(){try{e.compressedTexSubImage2D(...arguments)}catch(e){o(`WebGLState:`,e)}}function ke(){try{e.compressedTexSubImage3D(...arguments)}catch(e){o(`WebGLState:`,e)}}function Ae(){try{e.texStorage2D(...arguments)}catch(e){o(`WebGLState:`,e)}}function je(){try{e.texStorage3D(...arguments)}catch(e){o(`WebGLState:`,e)}}function Me(){try{e.texImage2D(...arguments)}catch(e){o(`WebGLState:`,e)}}function Ne(){try{e.texImage3D(...arguments)}catch(e){o(`WebGLState:`,e)}}function Pe(t){return f[t]===void 0?e.getParameter(t):f[t]}function Fe(t,n){f[t]!==n&&(e.pixelStorei(t,n),f[t]=n)}function Ie(t){oe.equals(t)===!1&&(e.scissor(t.x,t.y,t.z,t.w),oe.copy(t))}function Re(t){I.equals(t)===!1&&(e.viewport(t.x,t.y,t.z,t.w),I.copy(t))}function ze(t,n){let r=u.get(n);r===void 0&&(r=new WeakMap,u.set(n,r));let i=r.get(t);i===void 0&&(i=e.getUniformBlockIndex(n,t.name),e.uniformBlockBinding(n,i,i),r.set(t,i))}function Be(t,n,r){let i=u.get(n).get(t);l[i]!==r&&(e.bindBufferBase(e.UNIFORM_BUFFER,i,r),l[i]=r)}function Ve(){e.disable(e.BLEND),e.disable(e.CULL_FACE),e.disable(e.DEPTH_TEST),e.disable(e.POLYGON_OFFSET_FILL),e.disable(e.SCISSOR_TEST),e.disable(e.STENCIL_TEST),e.disable(e.SAMPLE_ALPHA_TO_COVERAGE),e.blendEquation(e.FUNC_ADD),e.blendFunc(e.ONE,e.ZERO),e.blendFuncSeparate(e.ONE,e.ZERO,e.ONE,e.ZERO),e.blendColor(0,0,0,0),e.colorMask(!0,!0,!0,!0),e.clearColor(0,0,0,0),e.depthMask(!0),e.depthFunc(e.LESS),s.setReversed(!1),e.clearDepth(1),e.stencilMask(4294967295),e.stencilFunc(e.ALWAYS,0,4294967295),e.stencilOp(e.KEEP,e.KEEP,e.KEEP),e.clearStencil(0),e.cullFace(e.BACK),e.frontFace(e.CCW),e.polygonOffset(0,0),e.activeTexture(e.TEXTURE0),e.bindFramebuffer(e.FRAMEBUFFER,null),e.bindFramebuffer(e.DRAW_FRAMEBUFFER,null),e.bindFramebuffer(e.READ_FRAMEBUFFER,null),e.useProgram(null),e.lineWidth(1),e.scissor(0,0,e.canvas.width,e.canvas.height),e.viewport(0,0,e.canvas.width,e.canvas.height),e.pixelStorei(e.PACK_ALIGNMENT,4),e.pixelStorei(e.UNPACK_ALIGNMENT,4),e.pixelStorei(e.UNPACK_FLIP_Y_WEBGL,!1),e.pixelStorei(e.UNPACK_PREMULTIPLY_ALPHA_WEBGL,!1),e.pixelStorei(e.UNPACK_COLORSPACE_CONVERSION_WEBGL,e.BROWSER_DEFAULT_WEBGL),e.pixelStorei(e.PACK_ROW_LENGTH,0),e.pixelStorei(e.PACK_SKIP_PIXELS,0),e.pixelStorei(e.PACK_SKIP_ROWS,0),e.pixelStorei(e.UNPACK_ROW_LENGTH,0),e.pixelStorei(e.UNPACK_IMAGE_HEIGHT,0),e.pixelStorei(e.UNPACK_SKIP_PIXELS,0),e.pixelStorei(e.UNPACK_SKIP_ROWS,0),e.pixelStorei(e.UNPACK_SKIP_IMAGES,0),d={},f={},F=null,re={},p={},l={},h=new WeakMap,g=[],_=null,v=!1,y=null,b=null,x=null,S=null,C=null,w=null,T=null,E=new Le(0,0,0),D=0,O=!1,k=null,A=null,j=null,M=null,N=null,oe.set(0,0,e.canvas.width,e.canvas.height),I.set(0,0,e.canvas.width,e.canvas.height),a.reset(),s.reset(),c.reset()}return{buffers:{color:a,depth:s,stencil:c},enable:L,disable:le,bindFramebuffer:ue,drawBuffers:de,useProgram:fe,setBlending:he,setMaterial:_e,setFlipSided:R,setCullFace:ve,setLineWidth:ye,setPolygonOffset:be,setScissorTest:xe,activeTexture:Se,bindTexture:Ce,unbindTexture:we,compressedTexImage2D:Te,compressedTexImage3D:z,texImage2D:Me,texImage3D:Ne,pixelStorei:Fe,getParameter:Pe,updateUBOMapping:ze,uniformBlockBinding:Be,texStorage2D:Ae,texStorage3D:je,texSubImage2D:Ee,texSubImage3D:De,compressedTexSubImage2D:Oe,compressedTexSubImage3D:ke,scissor:Ie,viewport:Re,reset:Ve}}function Zi(e,t,r,i,a,s,c){let l=t.has(`WEBGL_multisampled_render_to_texture`)?t.get(`WEBGL_multisampled_render_to_texture`):null,u=typeof navigator>`u`?!1:/OculusBrowser/g.test(navigator.userAgent),p=new Te,m=new WeakMap,g=new Set,_,v=new WeakMap,b=new Set,x=new FinalizationRegistry(e=>b.delete(e)),S=!1;try{S=typeof OffscreenCanvas<`u`&&new OffscreenCanvas(1,1).getContext(`2d`)!==null}catch{}function C(e,t){return S?new OffscreenCanvas(e,t):A(`canvas`)}function w(e,t,r){let i=1,a=Ue(e);if((a.width>r||a.height>r)&&(i=r/Math.max(a.width,a.height)),i<1){if(typeof HTMLImageElement<`u`&&e instanceof HTMLImageElement||typeof HTMLCanvasElement<`u`&&e instanceof HTMLCanvasElement||typeof ImageBitmap<`u`&&e instanceof ImageBitmap||typeof VideoFrame<`u`&&e instanceof VideoFrame){let r=Math.floor(i*a.width),o=Math.floor(i*a.height);_===void 0&&(_=C(r,o));let s=t?C(r,o):_;return s.width=r,s.height=o,s.getContext(`2d`).drawImage(e,0,0,r,o),n(`WebGLRenderer: Texture has been resized from (`+a.width+`x`+a.height+`) to (`+r+`x`+o+`).`),s}return`data`in e&&n(`WebGLRenderer: Image in DataTexture is too big (`+a.width+`x`+a.height+`).`),e}return e}function E(e){return e.generateMipmaps}function O(t){e.generateMipmap(t)}function k(t){return t.isWebGLCubeRenderTarget?e.TEXTURE_CUBE_MAP:t.isWebGL3DRenderTarget?e.TEXTURE_3D:t.isWebGLArrayRenderTarget||t.isCompressedArrayTexture?e.TEXTURE_2D_ARRAY:e.TEXTURE_2D}function j(r,i,a,o,s,c=!1){if(r!==null){if(e[r]!==void 0)return e[r];n(`WebGLRenderer: Attempt to use non-existing WebGL internal format '`+r+`'`)}let l;o&&(l=t.get(`EXT_texture_norm16`),l||n(`WebGLRenderer: Unable to use normalized textures without EXT_texture_norm16 extension`));let u=i;if(i===e.RED&&(a===e.FLOAT&&(u=e.R32F),a===e.HALF_FLOAT&&(u=e.R16F),a===e.UNSIGNED_BYTE&&(u=e.R8),a===e.UNSIGNED_SHORT&&l&&(u=l.R16_EXT),a===e.SHORT&&l&&(u=l.R16_SNORM_EXT)),i===e.RED_INTEGER&&(a===e.UNSIGNED_BYTE&&(u=e.R8UI),a===e.UNSIGNED_SHORT&&(u=e.R16UI),a===e.UNSIGNED_INT&&(u=e.R32UI),a===e.BYTE&&(u=e.R8I),a===e.SHORT&&(u=e.R16I),a===e.INT&&(u=e.R32I)),i===e.RG&&(a===e.FLOAT&&(u=e.RG32F),a===e.HALF_FLOAT&&(u=e.RG16F),a===e.UNSIGNED_BYTE&&(u=e.RG8),a===e.UNSIGNED_SHORT&&l&&(u=l.RG16_EXT),a===e.SHORT&&l&&(u=l.RG16_SNORM_EXT)),i===e.RG_INTEGER&&(a===e.UNSIGNED_BYTE&&(u=e.RG8UI),a===e.UNSIGNED_SHORT&&(u=e.RG16UI),a===e.UNSIGNED_INT&&(u=e.RG32UI),a===e.BYTE&&(u=e.RG8I),a===e.SHORT&&(u=e.RG16I),a===e.INT&&(u=e.RG32I)),i===e.RGB_INTEGER&&(a===e.UNSIGNED_BYTE&&(u=e.RGB8UI),a===e.UNSIGNED_SHORT&&(u=e.RGB16UI),a===e.UNSIGNED_INT&&(u=e.RGB32UI),a===e.BYTE&&(u=e.RGB8I),a===e.SHORT&&(u=e.RGB16I),a===e.INT&&(u=e.RGB32I)),i===e.RGBA_INTEGER&&(a===e.UNSIGNED_BYTE&&(u=e.RGBA8UI),a===e.UNSIGNED_SHORT&&(u=e.RGBA16UI),a===e.UNSIGNED_INT&&(u=e.RGBA32UI),a===e.BYTE&&(u=e.RGBA8I),a===e.SHORT&&(u=e.RGBA16I),a===e.INT&&(u=e.RGBA32I)),i===e.RGB&&(a===e.UNSIGNED_SHORT&&l&&(u=l.RGB16_EXT),a===e.SHORT&&l&&(u=l.RGB16_SNORM_EXT),a===e.UNSIGNED_INT_5_9_9_9_REV&&(u=e.RGB9_E5),a===e.UNSIGNED_INT_10F_11F_11F_REV&&(u=e.R11F_G11F_B10F)),i===e.RGBA){let t=c?D:de.getTransfer(s);a===e.FLOAT&&(u=e.RGBA32F),a===e.HALF_FLOAT&&(u=e.RGBA16F),a===e.UNSIGNED_BYTE&&(u=t===`srgb`?e.SRGB8_ALPHA8:e.RGBA8),a===e.UNSIGNED_SHORT&&l&&(u=l.RGBA16_EXT),a===e.SHORT&&l&&(u=l.RGBA16_SNORM_EXT),a===e.UNSIGNED_SHORT_4_4_4_4&&(u=e.RGBA4),a===e.UNSIGNED_SHORT_5_5_5_1&&(u=e.RGB5_A1)}return(u===e.R16F||u===e.R32F||u===e.RG16F||u===e.RG32F||u===e.RGBA16F||u===e.RGBA32F)&&t.get(`EXT_color_buffer_float`),u}function N(t,r){let i;return t?r===null||r===1014||r===1020?i=e.DEPTH24_STENCIL8:r===1015?i=e.DEPTH32F_STENCIL8:r===1012&&(i=e.DEPTH24_STENCIL8,n(`DepthTexture: 16 bit depth attachment is not supported with stencil. Using 24-bit attachment.`)):r===null||r===1014||r===1020?i=e.DEPTH_COMPONENT24:r===1015?i=e.DEPTH_COMPONENT32F:r===1012&&(i=e.DEPTH_COMPONENT16),i}function P(e,t){return E(e)===!0||e.isFramebufferTexture&&e.minFilter!==1003&&e.minFilter!==1006?Math.log2(Math.max(t.width,t.height))+1:e.mipmaps.length>0?e.mipmaps.length:e.isCompressedTexture&&Array.isArray(e.image)?t.mipmaps.length:1}function ne(e){let t=new WeakRef(e);i.get(e).__ref=t,b.add(t),x.register(e,t,t)}function F(e){let t=i.get(e).__ref;t!==void 0&&(b.delete(t),x.unregister(t))}function re(e){ae(e.target)}function ie(e){oe(e.target)}function ae(e){e.removeEventListener(`dispose`,re),F(e),se(e),e.isVideoTexture&&m.delete(e),e.isHTMLTexture&&g.delete(e)}function oe(e){e.removeEventListener(`dispose`,ie),F(e),L(e)}function I(){for(let e of b){let t=e.deref();t!==void 0&&(t.isRenderTarget===!0?oe(t):ae(t))}b.clear(),g.clear()}function se(e){let t=i.get(e);if(t.__webglInit===void 0)return;let n=e.source,r=v.get(n);if(r){let i=r[t.__cacheKey];i.usedTimes--,i.usedTimes===0&&ce(e),Object.keys(r).length===0&&v.delete(n)}i.remove(e)}function ce(t){let n=i.get(t);e.deleteTexture(n.__webglTexture);let r=t.source,a=v.get(r);delete a[n.__cacheKey],c.memory.textures--}function L(t){let n=i.get(t);n.__depthDisposeCallback&&n.__depthDisposeCallback();let r=t.depthTexture;if(r&&r.renderTarget===t&&ae(r),t.isWebGLCubeRenderTarget)for(let t=0;t<6;t++){if(Array.isArray(n.__webglFramebuffer[t]))for(let r=0;r<n.__webglFramebuffer[t].length;r++)e.deleteFramebuffer(n.__webglFramebuffer[t][r]);else e.deleteFramebuffer(n.__webglFramebuffer[t]);n.__webglDepthbuffer&&e.deleteRenderbuffer(n.__webglDepthbuffer[t])}else{if(Array.isArray(n.__webglFramebuffer))for(let t=0;t<n.__webglFramebuffer.length;t++)e.deleteFramebuffer(n.__webglFramebuffer[t]);else e.deleteFramebuffer(n.__webglFramebuffer);if(n.__webglDepthbuffer&&e.deleteRenderbuffer(n.__webglDepthbuffer),n.__webglMultisampledFramebuffer&&e.deleteFramebuffer(n.__webglMultisampledFramebuffer),n.__webglColorRenderbuffer)for(let t=0;t<n.__webglColorRenderbuffer.length;t++)n.__webglColorRenderbuffer[t]&&e.deleteRenderbuffer(n.__webglColorRenderbuffer[t]);n.__webglDepthRenderbuffer&&e.deleteRenderbuffer(n.__webglDepthRenderbuffer)}let a=t.textures;for(let t=0,n=a.length;t<n;t++){let n=i.get(a[t]);n.__webglTexture&&(e.deleteTexture(n.__webglTexture),c.memory.textures--),i.remove(a[t])}i.remove(t)}let le=0;function ue(){le=0}function fe(){return le}function pe(e){le=e}function me(){let e=le;return e>=a.maxTextures&&n(`WebGLTextures: Trying to use `+(e+1)+` texture units while this GPU supports only `+a.maxTextures),le+=1,e}function he(e){let t=[];return t.push(e.wrapS),t.push(e.wrapT),t.push(e.wrapR||0),t.push(e.magFilter),t.push(e.minFilter),t.push(e.anisotropy),t.push(e.internalFormat),t.push(e.format),t.push(e.type),t.push(e.generateMipmaps),t.push(e.mipmapsAutoUpdate),t.push(e.premultiplyAlpha),t.push(e.flipY),t.push(e.unpackAlignment),t.push(e.colorSpace),t.join()}function ge(t,a){let o=i.get(t);if(t.isVideoTexture&&Ve(t),t.isRenderTargetTexture===!1&&t.isExternalTexture!==!0&&t.version>0&&o.__version!==t.version){let e=t.image;if(e===null)n(`WebGLRenderer: Texture marked for update but no image data found.`);else if(e.complete===!1)n(`WebGLRenderer: Texture marked for update but image is incomplete`);else{De(o,t,a);return}}else t.isExternalTexture&&(o.__webglTexture=t.sourceTexture?t.sourceTexture:null);r.bindTexture(e.TEXTURE_2D,o.__webglTexture,e.TEXTURE0+a)}function _e(t,n){let a=i.get(t);t.isRenderTargetTexture===!1&&t.version>0&&a.__version!==t.version?De(a,t,n):(t.isExternalTexture&&(a.__webglTexture=t.sourceTexture?t.sourceTexture:null),r.bindTexture(e.TEXTURE_2D_ARRAY,a.__webglTexture,e.TEXTURE0+n))}function R(t,n){let a=i.get(t);t.isRenderTargetTexture===!1&&t.version>0&&a.__version!==t.version?De(a,t,n):r.bindTexture(e.TEXTURE_3D,a.__webglTexture,e.TEXTURE0+n)}function ve(t,n){let a=i.get(t);t.version>0&&a.__version!==t.version?Oe(a,t,n):r.bindTexture(e.TEXTURE_CUBE_MAP,a.__webglTexture,e.TEXTURE0+n)}let ye={[ee]:e.REPEAT,[Ce]:e.CLAMP_TO_EDGE,[te]:e.MIRRORED_REPEAT},be={[f]:e.NEAREST,[je]:e.NEAREST_MIPMAP_NEAREST,[y]:e.NEAREST_MIPMAP_LINEAR,[T]:e.LINEAR,[h]:e.LINEAR_MIPMAP_NEAREST,[d]:e.LINEAR_MIPMAP_LINEAR},xe={512:e.NEVER,519:e.ALWAYS,513:e.LESS,515:e.LEQUAL,514:e.EQUAL,518:e.GEQUAL,516:e.GREATER,517:e.NOTEQUAL};function Se(r,o){if(o.type===1015&&t.has(`OES_texture_float_linear`)===!1&&(o.magFilter===1006||o.magFilter===1007||o.magFilter===1005||o.magFilter===1008||o.minFilter===1006||o.minFilter===1007||o.minFilter===1005||o.minFilter===1008)&&n(`WebGLRenderer: Unable to use linear filtering with floating point textures. OES_texture_float_linear not supported on this device.`),e.texParameteri(r,e.TEXTURE_WRAP_S,ye[o.wrapS]),e.texParameteri(r,e.TEXTURE_WRAP_T,ye[o.wrapT]),(r===e.TEXTURE_3D||r===e.TEXTURE_2D_ARRAY)&&e.texParameteri(r,e.TEXTURE_WRAP_R,ye[o.wrapR]),e.texParameteri(r,e.TEXTURE_MAG_FILTER,be[o.magFilter]),e.texParameteri(r,e.TEXTURE_MIN_FILTER,be[o.minFilter]),o.compareFunction&&(e.texParameteri(r,e.TEXTURE_COMPARE_MODE,e.COMPARE_REF_TO_TEXTURE),e.texParameteri(r,e.TEXTURE_COMPARE_FUNC,xe[o.compareFunction])),t.has(`EXT_texture_filter_anisotropic`)===!0){if(o.magFilter===1003||o.minFilter!==1005&&o.minFilter!==1008||o.type===1015&&t.has(`OES_texture_float_linear`)===!1)return;if(o.anisotropy>1||i.get(o).__currentAnisotropy){let n=t.get(`EXT_texture_filter_anisotropic`);e.texParameterf(r,n.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(o.anisotropy,a.getMaxAnisotropy())),i.get(o).__currentAnisotropy=o.anisotropy}}}function we(t,n){let r=!1;t.__webglInit===void 0&&(t.__webglInit=!0,n.addEventListener(`dispose`,re),ne(n));let i=n.source,a=v.get(i);a===void 0&&(a={},v.set(i,a));let o=he(n);if(o!==t.__cacheKey){a[o]===void 0&&(a[o]={texture:e.createTexture(),usedTimes:0},c.memory.textures++,r=!0),a[o].usedTimes++;let i=a[t.__cacheKey];i!==void 0&&(a[t.__cacheKey].usedTimes--,i.usedTimes===0&&ce(n)),t.__cacheKey=o,t.__webglTexture=a[o].texture}return r}function z(e,t,n){return Math.floor(Math.floor(e/n)/t)}function Ee(t,n,i,a){let o=t.updateRanges;if(o.length===0)r.texSubImage2D(e.TEXTURE_2D,0,0,0,n.width,n.height,i,a,n.data);else{o.sort((e,t)=>e.start-t.start);let s=0;for(let e=1;e<o.length;e++){let t=o[s],r=o[e],i=t.start+t.count,a=z(r.start,n.width,4),c=z(t.start,n.width,4);r.start<=i+1&&a===c&&z(r.start+r.count-1,n.width,4)===a?t.count=Math.max(t.count,r.start+r.count-t.start):(++s,o[s]=r)}o.length=s+1;let c=r.getParameter(e.UNPACK_ROW_LENGTH),l=r.getParameter(e.UNPACK_SKIP_PIXELS),u=r.getParameter(e.UNPACK_SKIP_ROWS);r.pixelStorei(e.UNPACK_ROW_LENGTH,n.width);for(let t=0,s=o.length;t<s;t++){let s=o[t],c=Math.floor(s.start/4),l=Math.ceil(s.count/4),u=c%n.width,d=Math.floor(c/n.width),f=l;r.pixelStorei(e.UNPACK_SKIP_PIXELS,u),r.pixelStorei(e.UNPACK_SKIP_ROWS,d),r.texSubImage2D(e.TEXTURE_2D,0,u,d,f,1,i,a,n.data)}t.clearUpdateRanges(),r.pixelStorei(e.UNPACK_ROW_LENGTH,c),r.pixelStorei(e.UNPACK_SKIP_PIXELS,l),r.pixelStorei(e.UNPACK_SKIP_ROWS,u)}}function De(t,o,c){let l=e.TEXTURE_2D;(o.isDataArrayTexture||o.isCompressedArrayTexture)&&(l=e.TEXTURE_2D_ARRAY),o.isData3DTexture&&(l=e.TEXTURE_3D);let u=we(t,o),d=o.source;r.bindTexture(l,t.__webglTexture,e.TEXTURE0+c);let f=i.get(d);if(d.version!==f.__version||u===!0){if(r.activeTexture(e.TEXTURE0+c),!(typeof ImageBitmap<`u`&&o.image instanceof ImageBitmap)){let t=de.getPrimaries(de.workingColorSpace),n=o.colorSpace===``?null:de.getPrimaries(o.colorSpace),i=o.colorSpace===``||t===n?e.NONE:e.BROWSER_DEFAULT_WEBGL;r.pixelStorei(e.UNPACK_FLIP_Y_WEBGL,o.flipY),r.pixelStorei(e.UNPACK_PREMULTIPLY_ALPHA_WEBGL,o.premultiplyAlpha),r.pixelStorei(e.UNPACK_COLORSPACE_CONVERSION_WEBGL,i)}r.pixelStorei(e.UNPACK_ALIGNMENT,o.unpackAlignment);let t=w(o.image,!1,a.maxTextureSize);t=He(o,t);let i=s.convert(o.format,o.colorSpace),p=s.convert(o.type),m=j(o.internalFormat,i,p,o.normalized,o.colorSpace,o.isVideoTexture);Se(l,o);let h,_=o.mipmaps,v=o.isVideoTexture!==!0,y=f.__version===void 0||u===!0,b=d.dataReady,x=P(o,t);if(o.isDepthTexture)m=N(o.format===B,o.type),y&&(v?r.texStorage2D(e.TEXTURE_2D,1,m,t.width,t.height):r.texImage2D(e.TEXTURE_2D,0,m,t.width,t.height,0,i,p,null));else if(o.isDataTexture){if(_.length>0){v&&y&&r.texStorage2D(e.TEXTURE_2D,x,m,_[0].width,_[0].height);for(let t=0,n=_.length;t<n;t++)h=_[t],v?b&&r.texSubImage2D(e.TEXTURE_2D,t,0,0,h.width,h.height,i,p,h.data):r.texImage2D(e.TEXTURE_2D,t,m,h.width,h.height,0,i,p,h.data);o.generateMipmaps=!1}else v?(y&&r.texStorage2D(e.TEXTURE_2D,x,m,t.width,t.height),b&&Ee(o,t,i,p)):r.texImage2D(e.TEXTURE_2D,0,m,t.width,t.height,0,i,p,t.data)}else if(o.isCompressedTexture){if(o.isCompressedArrayTexture){v&&y&&r.texStorage3D(e.TEXTURE_2D_ARRAY,x,m,_[0].width,_[0].height,t.depth);for(let a=0,s=_.length;a<s;a++)if(h=_[a],o.format!==1023){if(i!==null){if(v){if(b){if(o.layerUpdates.size>0){let t=M(h.width,h.height,o.format,o.type);for(let n of o.layerUpdates){let o=h.data.subarray(n*t/h.data.BYTES_PER_ELEMENT,(n+1)*t/h.data.BYTES_PER_ELEMENT);r.compressedTexSubImage3D(e.TEXTURE_2D_ARRAY,a,0,0,n,h.width,h.height,1,i,o)}}else r.compressedTexSubImage3D(e.TEXTURE_2D_ARRAY,a,0,0,0,h.width,h.height,t.depth,i,h.data)}}else r.compressedTexImage3D(e.TEXTURE_2D_ARRAY,a,m,h.width,h.height,t.depth,0,h.data,0,0)}else n(`WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()`)}else v?b&&r.texSubImage3D(e.TEXTURE_2D_ARRAY,a,0,0,0,h.width,h.height,t.depth,i,p,h.data):r.texImage3D(e.TEXTURE_2D_ARRAY,a,m,h.width,h.height,t.depth,0,i,p,h.data);o.layerUpdates.size>0&&o.clearLayerUpdates()}else{v&&y&&r.texStorage2D(e.TEXTURE_2D,x,m,_[0].width,_[0].height);for(let t=0,a=_.length;t<a;t++)h=_[t],o.format===1023?v?b&&r.texSubImage2D(e.TEXTURE_2D,t,0,0,h.width,h.height,i,p,h.data):r.texImage2D(e.TEXTURE_2D,t,m,h.width,h.height,0,i,p,h.data):i===null?n(`WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()`):v?b&&r.compressedTexSubImage2D(e.TEXTURE_2D,t,0,0,h.width,h.height,i,h.data):r.compressedTexImage2D(e.TEXTURE_2D,t,m,h.width,h.height,0,h.data)}}else if(o.isDataArrayTexture){if(v){if(y&&r.texStorage3D(e.TEXTURE_2D_ARRAY,x,m,t.width,t.height,t.depth),b){if(o.layerUpdates.size>0){let n=M(t.width,t.height,o.format,o.type);for(let a of o.layerUpdates){let o=t.data.subarray(a*n/t.data.BYTES_PER_ELEMENT,(a+1)*n/t.data.BYTES_PER_ELEMENT);r.texSubImage3D(e.TEXTURE_2D_ARRAY,0,0,0,a,t.width,t.height,1,i,p,o)}o.clearLayerUpdates()}else r.texSubImage3D(e.TEXTURE_2D_ARRAY,0,0,0,0,t.width,t.height,t.depth,i,p,t.data)}}else r.texImage3D(e.TEXTURE_2D_ARRAY,0,m,t.width,t.height,t.depth,0,i,p,t.data)}else if(o.isData3DTexture)v?(y&&r.texStorage3D(e.TEXTURE_3D,x,m,t.width,t.height,t.depth),b&&r.texSubImage3D(e.TEXTURE_3D,0,0,0,0,t.width,t.height,t.depth,i,p,t.data)):r.texImage3D(e.TEXTURE_3D,0,m,t.width,t.height,t.depth,0,i,p,t.data);else if(o.isFramebufferTexture){if(y){if(v)r.texStorage2D(e.TEXTURE_2D,x,m,t.width,t.height);else{let n=t.width,a=t.height;for(let t=0;t<x;t++)r.texImage2D(e.TEXTURE_2D,t,m,n,a,0,i,p,null),n>>=1,a>>=1}}}else if(o.isHTMLTexture){if(`texElementImage2D`in e){let n=e.canvas;if(n.hasAttribute(`layoutsubtree`)||n.setAttribute(`layoutsubtree`,`true`),t.parentNode!==n){n.appendChild(t),g.add(o),n.onpaint=e=>{let t=e.changedElements;for(let e of g)t.includes(e.image)&&(e.needsUpdate=!0)},n.requestPaint();return}if(e.texElementImage2D.length===3)e.texElementImage2D(e.TEXTURE_2D,e.RGBA8,t);else{let n=e.RGBA,r=e.RGBA,i=e.UNSIGNED_BYTE;e.texElementImage2D(e.TEXTURE_2D,0,n,r,i,t)}e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MIN_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_S,e.CLAMP_TO_EDGE),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_T,e.CLAMP_TO_EDGE)}}else if(_.length>0){if(v&&y){let t=Ue(_[0]);r.texStorage2D(e.TEXTURE_2D,x,m,t.width,t.height)}for(let t=0,n=_.length;t<n;t++)h=_[t],v?b&&r.texSubImage2D(e.TEXTURE_2D,t,0,0,i,p,h):r.texImage2D(e.TEXTURE_2D,t,m,i,p,h);o.generateMipmaps=!1}else if(v){if(y){let n=Ue(t);r.texStorage2D(e.TEXTURE_2D,x,m,n.width,n.height)}b&&r.texSubImage2D(e.TEXTURE_2D,0,0,0,i,p,t)}else r.texImage2D(e.TEXTURE_2D,0,m,i,p,t);E(o)&&o.mipmapsAutoUpdate===!0&&O(l),f.__version=d.version,o.onUpdate&&o.onUpdate(o)}t.__version=o.version}function Oe(t,o,c){if(o.image.length!==6)return;let l=we(t,o),u=o.source;r.bindTexture(e.TEXTURE_CUBE_MAP,t.__webglTexture,e.TEXTURE0+c);let d=i.get(u);if(u.version!==d.__version||l===!0){r.activeTexture(e.TEXTURE0+c);let t=de.getPrimaries(de.workingColorSpace),i=o.colorSpace===``?null:de.getPrimaries(o.colorSpace),f=o.colorSpace===``||t===i?e.NONE:e.BROWSER_DEFAULT_WEBGL;r.pixelStorei(e.UNPACK_FLIP_Y_WEBGL,o.flipY),r.pixelStorei(e.UNPACK_PREMULTIPLY_ALPHA_WEBGL,o.premultiplyAlpha),r.pixelStorei(e.UNPACK_ALIGNMENT,o.unpackAlignment),r.pixelStorei(e.UNPACK_COLORSPACE_CONVERSION_WEBGL,f);let p=o.isCompressedTexture||o.image[0].isCompressedTexture,m=o.image[0]&&o.image[0].isDataTexture,h=[];for(let e=0;e<6;e++)!p&&!m?h[e]=w(o.image[e],!0,a.maxCubemapSize):h[e]=m?o.image[e].image:o.image[e],h[e]=He(o,h[e]);let g=h[0],_=s.convert(o.format,o.colorSpace),v=s.convert(o.type),y=j(o.internalFormat,_,v,o.normalized,o.colorSpace),b=o.isVideoTexture!==!0,x=d.__version===void 0||l===!0,S=u.dataReady,C=P(o,g);Se(e.TEXTURE_CUBE_MAP,o);let T;if(o.isDepthTexture){if(y=N(o.format===B,o.type),x){if(b)r.texStorage2D(e.TEXTURE_CUBE_MAP,1,y,g.width,g.height);else for(let t=0;t<6;t++)r.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,0,y,g.width,g.height,0,_,v,null)}}else if(p){b&&x&&r.texStorage2D(e.TEXTURE_CUBE_MAP,C,y,g.width,g.height);for(let t=0;t<6;t++){T=h[t].mipmaps;for(let i=0;i<T.length;i++){let a=T[i];o.format===1023?b?S&&r.texSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,i,0,0,a.width,a.height,_,v,a.data):r.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,i,y,a.width,a.height,0,_,v,a.data):_===null?n(`WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()`):b?S&&r.compressedTexSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,i,0,0,a.width,a.height,_,a.data):r.compressedTexImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,i,y,a.width,a.height,0,a.data)}}}else{if(T=o.mipmaps,b&&x){T.length>0&&C++;let t=Ue(h[0]);r.texStorage2D(e.TEXTURE_CUBE_MAP,C,y,t.width,t.height)}for(let t=0;t<6;t++)if(m){b?S&&r.texSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,0,0,0,h[t].width,h[t].height,_,v,h[t].data):r.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,0,y,h[t].width,h[t].height,0,_,v,h[t].data);for(let n=0;n<T.length;n++){let i=T[n].image[t].image;b?S&&r.texSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,n+1,0,0,i.width,i.height,_,v,i.data):r.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,n+1,y,i.width,i.height,0,_,v,i.data)}}else{b?S&&r.texSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,0,0,0,_,v,h[t]):r.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,0,y,_,v,h[t]);for(let n=0;n<T.length;n++){let i=T[n];b?S&&r.texSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,n+1,0,0,_,v,i.image[t]):r.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,n+1,y,_,v,i.image[t])}}}E(o)&&o.mipmapsAutoUpdate===!0&&O(e.TEXTURE_CUBE_MAP),d.__version=u.version,o.onUpdate&&o.onUpdate(o)}t.__version=o.version}function ke(t,n,a,o,c,u){let d=s.convert(a.format,a.colorSpace),f=s.convert(a.type),p=j(a.internalFormat,d,f,a.normalized,a.colorSpace),m=i.get(n),h=i.get(a);if(h.__renderTarget=n,!m.__hasExternalTextures){let t=Math.max(1,n.width>>u),i=Math.max(1,n.height>>u);c===e.TEXTURE_3D||c===e.TEXTURE_2D_ARRAY?r.texImage3D(c,u,p,t,i,n.depth,0,d,f,null):r.texImage2D(c,u,p,t,i,0,d,f,null)}r.bindFramebuffer(e.FRAMEBUFFER,t),Be(n)?l.framebufferTexture2DMultisampleEXT(e.FRAMEBUFFER,o,c,h.__webglTexture,0,ze(n)):(c===e.TEXTURE_2D||c>=e.TEXTURE_CUBE_MAP_POSITIVE_X&&c<=e.TEXTURE_CUBE_MAP_NEGATIVE_Z)&&e.framebufferTexture2D(e.FRAMEBUFFER,o,c,h.__webglTexture,u),r.bindFramebuffer(e.FRAMEBUFFER,null)}function Ae(t,n,r){if(e.bindRenderbuffer(e.RENDERBUFFER,t),n.depthBuffer){let i=n.depthTexture,a=i&&i.isDepthTexture?i.type:null,o=N(n.stencilBuffer,a),s=n.stencilBuffer?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT;Be(n)?l.renderbufferStorageMultisampleEXT(e.RENDERBUFFER,ze(n),o,n.width,n.height):r?e.renderbufferStorageMultisample(e.RENDERBUFFER,ze(n),o,n.width,n.height):e.renderbufferStorage(e.RENDERBUFFER,o,n.width,n.height),e.framebufferRenderbuffer(e.FRAMEBUFFER,s,e.RENDERBUFFER,t)}else{let t=n.textures;for(let i=0;i<t.length;i++){let a=t[i],o=s.convert(a.format,a.colorSpace),c=s.convert(a.type),u=j(a.internalFormat,o,c,a.normalized,a.colorSpace);Be(n)?l.renderbufferStorageMultisampleEXT(e.RENDERBUFFER,ze(n),u,n.width,n.height):r?e.renderbufferStorageMultisample(e.RENDERBUFFER,ze(n),u,n.width,n.height):e.renderbufferStorage(e.RENDERBUFFER,u,n.width,n.height)}}e.bindRenderbuffer(e.RENDERBUFFER,null)}function Me(t,n,a){let o=n.isWebGLCubeRenderTarget===!0;if(r.bindFramebuffer(e.FRAMEBUFFER,t),!(n.depthTexture&&n.depthTexture.isDepthTexture))throw Error(`THREE.WebGLTextures: renderTarget.depthTexture must be an instance of THREE.DepthTexture.`);let s=i.get(n.depthTexture);s.__renderTarget=n;let c=o?n.depthTexture.image[0]:n.depthTexture.image;s.__webglTexture&&c.width===n.width&&c.height===n.height||(c.width=n.width,c.height=n.height,n.depthTexture.needsUpdate=!0),o?ve(n.depthTexture,0):ge(n.depthTexture,0);let u=s.__webglTexture,d=ze(n),f=o?e.TEXTURE_CUBE_MAP_POSITIVE_X+a:e.TEXTURE_2D,p=n.depthTexture.format===1027?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT;if(n.depthTexture.format===1026)Be(n)?l.framebufferTexture2DMultisampleEXT(e.FRAMEBUFFER,p,f,u,0,d):e.framebufferTexture2D(e.FRAMEBUFFER,p,f,u,0);else if(n.depthTexture.format===1027)Be(n)?l.framebufferTexture2DMultisampleEXT(e.FRAMEBUFFER,p,f,u,0,d):e.framebufferTexture2D(e.FRAMEBUFFER,p,f,u,0);else throw Error(`THREE.WebGLTextures: Unknown depthTexture format.`)}function Ne(t){let n=i.get(t),a=t.isWebGLCubeRenderTarget===!0;if(n.__boundDepthTexture!==t.depthTexture){let e=t.depthTexture;if(n.__depthDisposeCallback&&n.__depthDisposeCallback(),e){let t=()=>{delete n.__boundDepthTexture,delete n.__depthDisposeCallback,e.removeEventListener(`dispose`,t)};e.addEventListener(`dispose`,t),n.__depthDisposeCallback=t}n.__boundDepthTexture=e}if(t.depthTexture&&!n.__autoAllocateDepthBuffer){if(a)for(let e=0;e<6;e++)Me(n.__webglFramebuffer[e],t,e);else t.texture.mipmaps.length>0?Me(n.__webglFramebuffer[0],t,0):Me(n.__webglFramebuffer,t,0)}else if(a){n.__webglDepthbuffer=[];for(let i=0;i<6;i++)if(r.bindFramebuffer(e.FRAMEBUFFER,n.__webglFramebuffer[i]),n.__webglDepthbuffer[i]===void 0)n.__webglDepthbuffer[i]=e.createRenderbuffer(),Ae(n.__webglDepthbuffer[i],t,!1);else{let r=t.stencilBuffer?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT,a=n.__webglDepthbuffer[i];e.bindRenderbuffer(e.RENDERBUFFER,a),e.framebufferRenderbuffer(e.FRAMEBUFFER,r,e.RENDERBUFFER,a)}}else if(t.texture.mipmaps.length>0?r.bindFramebuffer(e.FRAMEBUFFER,n.__webglFramebuffer[0]):r.bindFramebuffer(e.FRAMEBUFFER,n.__webglFramebuffer),n.__webglDepthbuffer===void 0)n.__webglDepthbuffer=e.createRenderbuffer(),Ae(n.__webglDepthbuffer,t,!1);else{let r=t.stencilBuffer?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT,i=n.__webglDepthbuffer;e.bindRenderbuffer(e.RENDERBUFFER,i),e.framebufferRenderbuffer(e.FRAMEBUFFER,r,e.RENDERBUFFER,i)}r.bindFramebuffer(e.FRAMEBUFFER,null)}function Pe(t,n,r){let a=i.get(t);n!==void 0&&ke(a.__webglFramebuffer,t,t.texture,e.COLOR_ATTACHMENT0,e.TEXTURE_2D,0),r!==void 0&&Ne(t)}function Fe(t){let n=t.texture,a=i.get(t),o=i.get(n);t.addEventListener(`dispose`,ie),ne(t);let l=t.textures,u=t.isWebGLCubeRenderTarget===!0,d=l.length>1;if(d||(o.__webglTexture===void 0&&(o.__webglTexture=e.createTexture()),o.__version=n.version,c.memory.textures++),u){a.__webglFramebuffer=[];for(let t=0;t<6;t++)if(n.mipmaps.length>0){a.__webglFramebuffer[t]=[];for(let r=0;r<n.mipmaps.length;r++)a.__webglFramebuffer[t][r]=e.createFramebuffer()}else a.__webglFramebuffer[t]=e.createFramebuffer()}else{if(n.mipmaps.length>0){a.__webglFramebuffer=[];for(let t=0;t<n.mipmaps.length;t++)a.__webglFramebuffer[t]=e.createFramebuffer()}else a.__webglFramebuffer=e.createFramebuffer();if(d)for(let t=0,n=l.length;t<n;t++){let n=i.get(l[t]);n.__webglTexture===void 0&&(n.__webglTexture=e.createTexture(),c.memory.textures++)}if(t.samples>0&&Be(t)===!1){a.__webglMultisampledFramebuffer=e.createFramebuffer(),a.__webglColorRenderbuffer=[],r.bindFramebuffer(e.FRAMEBUFFER,a.__webglMultisampledFramebuffer);for(let n=0;n<l.length;n++){let r=l[n];a.__webglColorRenderbuffer[n]=e.createRenderbuffer(),e.bindRenderbuffer(e.RENDERBUFFER,a.__webglColorRenderbuffer[n]);let i=s.convert(r.format,r.colorSpace),o=s.convert(r.type),c=j(r.internalFormat,i,o,r.normalized,r.colorSpace,t.isXRRenderTarget===!0),u=ze(t);e.renderbufferStorageMultisample(e.RENDERBUFFER,u,c,t.width,t.height),e.framebufferRenderbuffer(e.FRAMEBUFFER,e.COLOR_ATTACHMENT0+n,e.RENDERBUFFER,a.__webglColorRenderbuffer[n])}e.bindRenderbuffer(e.RENDERBUFFER,null),t.depthBuffer&&(a.__webglDepthRenderbuffer=e.createRenderbuffer(),Ae(a.__webglDepthRenderbuffer,t,!0)),r.bindFramebuffer(e.FRAMEBUFFER,null)}}if(u){r.bindTexture(e.TEXTURE_CUBE_MAP,o.__webglTexture),Se(e.TEXTURE_CUBE_MAP,n);for(let r=0;r<6;r++)if(n.mipmaps.length>0)for(let i=0;i<n.mipmaps.length;i++)ke(a.__webglFramebuffer[r][i],t,n,e.COLOR_ATTACHMENT0,e.TEXTURE_CUBE_MAP_POSITIVE_X+r,i);else ke(a.__webglFramebuffer[r],t,n,e.COLOR_ATTACHMENT0,e.TEXTURE_CUBE_MAP_POSITIVE_X+r,0);E(n)?O(e.TEXTURE_CUBE_MAP):n.mipmaps.length>0&&e.texParameteri(e.TEXTURE_CUBE_MAP,e.TEXTURE_MAX_LEVEL,n.mipmaps.length-1),r.unbindTexture()}else if(d){for(let n=0,o=l.length;n<o;n++){let o=l[n],s=i.get(o),c=e.TEXTURE_2D;(t.isWebGL3DRenderTarget||t.isWebGLArrayRenderTarget)&&(c=t.isWebGL3DRenderTarget?e.TEXTURE_3D:e.TEXTURE_2D_ARRAY),r.bindTexture(c,s.__webglTexture),Se(c,o),ke(a.__webglFramebuffer,t,o,e.COLOR_ATTACHMENT0+n,c,0),E(o)&&O(c)}r.unbindTexture()}else{let i=e.TEXTURE_2D;if((t.isWebGL3DRenderTarget||t.isWebGLArrayRenderTarget)&&(i=t.isWebGL3DRenderTarget?e.TEXTURE_3D:e.TEXTURE_2D_ARRAY),r.bindTexture(i,o.__webglTexture),Se(i,n),n.mipmaps.length>0)for(let r=0;r<n.mipmaps.length;r++)ke(a.__webglFramebuffer[r],t,n,e.COLOR_ATTACHMENT0,i,r);else ke(a.__webglFramebuffer,t,n,e.COLOR_ATTACHMENT0,i,0);E(n)?O(i):n.mipmaps.length>0&&e.texParameteri(i,e.TEXTURE_MAX_LEVEL,n.mipmaps.length-1),r.unbindTexture()}t.depthBuffer&&Ne(t)}function Ie(e){let t=e.textures;for(let n=0,a=t.length;n<a;n++){let a=t[n];if(E(a)&&a.mipmapsAutoUpdate===!0){let t=k(e),n=i.get(a).__webglTexture;r.bindTexture(t,n),O(t),r.unbindTexture()}}}let Le=[];function Re(t){if(t.samples>0){if(Be(t)===!1){let n=t.textures,a=t.width,o=t.height,s=e.COLOR_BUFFER_BIT,c=t.stencilBuffer?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT,l=i.get(t),d=n.length>1;if(d)for(let t=0;t<n.length;t++)r.bindFramebuffer(e.FRAMEBUFFER,l.__webglMultisampledFramebuffer),e.framebufferRenderbuffer(e.FRAMEBUFFER,e.COLOR_ATTACHMENT0+t,e.RENDERBUFFER,null),r.bindFramebuffer(e.FRAMEBUFFER,l.__webglFramebuffer),e.framebufferTexture2D(e.DRAW_FRAMEBUFFER,e.COLOR_ATTACHMENT0+t,e.TEXTURE_2D,null,0);r.bindFramebuffer(e.READ_FRAMEBUFFER,l.__webglMultisampledFramebuffer),t.texture.mipmaps.length>0?r.bindFramebuffer(e.DRAW_FRAMEBUFFER,l.__webglFramebuffer[0]):r.bindFramebuffer(e.DRAW_FRAMEBUFFER,l.__webglFramebuffer);for(let r=0;r<n.length;r++){if(t.resolveDepthBuffer&&(t.depthBuffer&&(s|=e.DEPTH_BUFFER_BIT),t.stencilBuffer&&t.resolveStencilBuffer&&(s|=e.STENCIL_BUFFER_BIT)),d){e.framebufferRenderbuffer(e.READ_FRAMEBUFFER,e.COLOR_ATTACHMENT0,e.RENDERBUFFER,l.__webglColorRenderbuffer[r]);let t=i.get(n[r]).__webglTexture;e.framebufferTexture2D(e.DRAW_FRAMEBUFFER,e.COLOR_ATTACHMENT0,e.TEXTURE_2D,t,0)}e.blitFramebuffer(0,0,a,o,0,0,a,o,s,e.NEAREST),u===!0&&(Le.length=0,Le.push(e.COLOR_ATTACHMENT0+r),t.depthBuffer&&t.storeMultisampledDepthBuffer===!1&&Le.push(c),e.invalidateFramebuffer(e.READ_FRAMEBUFFER,Le))}if(r.bindFramebuffer(e.READ_FRAMEBUFFER,null),r.bindFramebuffer(e.DRAW_FRAMEBUFFER,null),d)for(let t=0;t<n.length;t++){r.bindFramebuffer(e.FRAMEBUFFER,l.__webglMultisampledFramebuffer),e.framebufferRenderbuffer(e.FRAMEBUFFER,e.COLOR_ATTACHMENT0+t,e.RENDERBUFFER,l.__webglColorRenderbuffer[t]);let a=i.get(n[t]).__webglTexture;r.bindFramebuffer(e.FRAMEBUFFER,l.__webglFramebuffer),e.framebufferTexture2D(e.DRAW_FRAMEBUFFER,e.COLOR_ATTACHMENT0+t,e.TEXTURE_2D,a,0)}r.bindFramebuffer(e.DRAW_FRAMEBUFFER,l.__webglMultisampledFramebuffer)}else if(t.depthBuffer&&t.storeMultisampledDepthBuffer===!1&&u){let n=t.stencilBuffer?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT;e.invalidateFramebuffer(e.DRAW_FRAMEBUFFER,[n])}}}function ze(e){return Math.min(a.maxSamples,e.samples)}function Be(e){let n=i.get(e);return e.samples>0&&t.has(`WEBGL_multisampled_render_to_texture`)===!0&&n.__useRenderToTexture!==!1}function Ve(e){let t=c.render.frame;m.get(e)!==t&&(m.set(e,t),e.update())}function He(e,t){let r=e.colorSpace,i=e.format,a=e.type;return e.isCompressedTexture===!0||e.isVideoTexture===!0||r!==`srgb-linear`&&r!==``&&(de.getTransfer(r)===`srgb`?(i!==1023||a!==1009)&&n(`WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType.`):o(`WebGLTextures: Unsupported texture color space:`,r)),t}function Ue(e){return typeof HTMLImageElement<`u`&&e instanceof HTMLImageElement?(p.width=e.naturalWidth||e.width,p.height=e.naturalHeight||e.height):typeof VideoFrame<`u`&&e instanceof VideoFrame?(p.width=e.displayWidth,p.height=e.displayHeight):(p.width=e.width,p.height=e.height),p}this.allocateTextureUnit=me,this.resetTextureUnits=ue,this.getTextureUnits=fe,this.setTextureUnits=pe,this.setTexture2D=ge,this.setTexture2DArray=_e,this.setTexture3D=R,this.setTextureCube=ve,this.rebindTextures=Pe,this.setupRenderTarget=Fe,this.updateRenderTargetMipmap=Ie,this.updateMultisampleRenderTarget=Re,this.setupDepthRenderbuffer=Ne,this.setupFrameBufferTexture=ke,this.useMultisampledRTT=Be,this.dispose=I}function Qi(e,t){function n(n,r=``){let i,a=de.getTransfer(r);if(n===1009)return e.UNSIGNED_BYTE;if(n===1017)return e.UNSIGNED_SHORT_4_4_4_4;if(n===1018)return e.UNSIGNED_SHORT_5_5_5_1;if(n===35902)return e.UNSIGNED_INT_5_9_9_9_REV;if(n===35899)return e.UNSIGNED_INT_10F_11F_11F_REV;if(n===1010)return e.BYTE;if(n===1011)return e.SHORT;if(n===1012)return e.UNSIGNED_SHORT;if(n===1013)return e.INT;if(n===1014)return e.UNSIGNED_INT;if(n===1015)return e.FLOAT;if(n===1016)return e.HALF_FLOAT;if(n===1021)return e.ALPHA;if(n===1022)return e.RGB;if(n===1023)return e.RGBA;if(n===1026)return e.DEPTH_COMPONENT;if(n===1027)return e.DEPTH_STENCIL;if(n===1028)return e.RED;if(n===1029)return e.RED_INTEGER;if(n===1030)return e.RG;if(n===1031)return e.RG_INTEGER;if(n===1033)return e.RGBA_INTEGER;if(n===33776||n===33777||n===33778||n===33779){if(a===`srgb`){if(i=t.get(`WEBGL_compressed_texture_s3tc_srgb`),i!==null){if(n===33776)return i.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(n===33777)return i.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(n===33778)return i.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(n===33779)return i.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null}else if(i=t.get(`WEBGL_compressed_texture_s3tc`),i!==null){if(n===33776)return i.COMPRESSED_RGB_S3TC_DXT1_EXT;if(n===33777)return i.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(n===33778)return i.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(n===33779)return i.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null}if(n===35840||n===35841||n===35842||n===35843){if(i=t.get(`WEBGL_compressed_texture_pvrtc`),i!==null){if(n===35840)return i.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(n===35841)return i.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(n===35842)return i.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(n===35843)return i.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null}if(n===36196||n===37492||n===37496||n===37488||n===37489||n===37490||n===37491){if(i=t.get(`WEBGL_compressed_texture_etc`),i!==null){if(n===36196||n===37492)return a===`srgb`?i.COMPRESSED_SRGB8_ETC2:i.COMPRESSED_RGB8_ETC2;if(n===37496)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:i.COMPRESSED_RGBA8_ETC2_EAC;if(n===37488)return i.COMPRESSED_R11_EAC;if(n===37489)return i.COMPRESSED_SIGNED_R11_EAC;if(n===37490)return i.COMPRESSED_RG11_EAC;if(n===37491)return i.COMPRESSED_SIGNED_RG11_EAC}else return null}if(n===37808||n===37809||n===37810||n===37811||n===37812||n===37813||n===37814||n===37815||n===37816||n===37817||n===37818||n===37819||n===37820||n===37821){if(i=t.get(`WEBGL_compressed_texture_astc`),i!==null){if(n===37808)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:i.COMPRESSED_RGBA_ASTC_4x4_KHR;if(n===37809)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:i.COMPRESSED_RGBA_ASTC_5x4_KHR;if(n===37810)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:i.COMPRESSED_RGBA_ASTC_5x5_KHR;if(n===37811)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:i.COMPRESSED_RGBA_ASTC_6x5_KHR;if(n===37812)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:i.COMPRESSED_RGBA_ASTC_6x6_KHR;if(n===37813)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:i.COMPRESSED_RGBA_ASTC_8x5_KHR;if(n===37814)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:i.COMPRESSED_RGBA_ASTC_8x6_KHR;if(n===37815)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:i.COMPRESSED_RGBA_ASTC_8x8_KHR;if(n===37816)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:i.COMPRESSED_RGBA_ASTC_10x5_KHR;if(n===37817)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:i.COMPRESSED_RGBA_ASTC_10x6_KHR;if(n===37818)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:i.COMPRESSED_RGBA_ASTC_10x8_KHR;if(n===37819)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:i.COMPRESSED_RGBA_ASTC_10x10_KHR;if(n===37820)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:i.COMPRESSED_RGBA_ASTC_12x10_KHR;if(n===37821)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:i.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null}if(n===36492||n===36494||n===36495){if(i=t.get(`EXT_texture_compression_bptc`),i!==null){if(n===36492)return a===`srgb`?i.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:i.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(n===36494)return i.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(n===36495)return i.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}else return null}if(n===36283||n===36284||n===36285||n===36286){if(i=t.get(`EXT_texture_compression_rgtc`),i!==null){if(n===36283)return i.COMPRESSED_RED_RGTC1_EXT;if(n===36284)return i.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(n===36285)return i.COMPRESSED_RED_GREEN_RGTC2_EXT;if(n===36286)return i.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null}return n===1020?e.UNSIGNED_INT_24_8:e[n]===void 0?null:e[n]}return{convert:n}}var $i=`
void main() {

	gl_Position = vec4( position, 1.0 );

}`,ea=`
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

}`,ta=class{constructor(){this.texture=null,this.mesh=null,this.depthNear=0,this.depthFar=0}init(e,t){if(this.texture===null){let n=new Ve(e.texture);(e.depthNear!==t.depthNear||e.depthFar!==t.depthFar)&&(this.depthNear=e.depthNear,this.depthFar=e.depthFar),this.texture=n}}getMesh(e){if(this.texture!==null&&this.mesh===null){let t=e.cameras[0].viewport,n=new F({vertexShader:$i,fragmentShader:ea,uniforms:{depthColor:{value:this.texture},depthWidth:{value:t.z},depthHeight:{value:t.w}}});this.mesh=new P(new E(20,20),n)}return this.mesh}reset(){this.texture=null,this.mesh=null}getDepthTexture(){return this.texture}},na=class extends a{constructor(e,t){super();let r=this,i=null,a=1,o=null,s=`local-floor`,c=1,l=null,u=null,d=null,f=null,p=null,m=null,h=typeof XRWebGLBinding<`u`,g=new ta,_={},v=t.getContextAttributes(),y=null,b=null,x=[],S=[],C=new Te,w=null,T=null,E=new ne;E.viewport=new ge;let D=new ne;D.viewport=new ge;let O=[E,D],k=new z,A=null,j=null;this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function(e){let t=x[e];return t===void 0&&(t=new Ge,x[e]=t),t.getTargetRaySpace()},this.getControllerGrip=function(e){let t=x[e];return t===void 0&&(t=new Ge,x[e]=t),t.getGripSpace()},this.getHand=function(e){let t=x[e];return t===void 0&&(t=new Ge,x[e]=t),t.getHandSpace()};function M(e){let t=S.indexOf(e.inputSource);if(t===-1)return;let n=x[t];n!==void 0&&(n.update(e.inputSource,e.frame,l||o),n.dispatchEvent({type:e.type,data:e.inputSource}))}function N(){i.removeEventListener(`select`,M),i.removeEventListener(`selectstart`,M),i.removeEventListener(`selectend`,M),i.removeEventListener(`squeeze`,M),i.removeEventListener(`squeezestart`,M),i.removeEventListener(`squeezeend`,M),i.removeEventListener(`end`,N),i.removeEventListener(`inputsourceschange`,P);for(let e=0;e<x.length;e++){let t=S[e];t!==null&&(S[e]=null,x[e].disconnect(t))}A=null,j=null,g.reset();for(let e in _)delete _[e];if(e.setRenderTarget(y),p=null,f=null,d=null,i=null,b=null,ie.stop(),r.isPresenting=!1,e.setPixelRatio(w),e.setSize(C.width,C.height,!1),T!==null){let e=T.camera;e.fov=T.fov,e.zoom=T.zoom,e.updateProjectionMatrix(),T=null}r.dispatchEvent({type:`sessionend`})}this.setFramebufferScaleFactor=function(e){a=e,r.isPresenting===!0&&n(`WebXRManager: Cannot change framebuffer scale while presenting.`)},this.setReferenceSpaceType=function(e){s=e,r.isPresenting===!0&&n(`WebXRManager: Cannot change reference space type while presenting.`)},this.getReferenceSpace=function(){return l||o},this.setReferenceSpace=function(e){l=e},this.getBaseLayer=function(){return f===null?p:f},this.getBinding=function(){return d===null&&h&&(d=new XRWebGLBinding(i,t)),d},this.getFrame=function(){return m},this.getSession=function(){return i},this.setSession=async function(n){if(i=n,i!==null){if(y=e.getRenderTarget(),i.addEventListener(`select`,M),i.addEventListener(`selectstart`,M),i.addEventListener(`selectend`,M),i.addEventListener(`squeeze`,M),i.addEventListener(`squeezestart`,M),i.addEventListener(`squeezeend`,M),i.addEventListener(`end`,N),i.addEventListener(`inputsourceschange`,P),v.xrCompatible!==!0&&await t.makeXRCompatible(),w=e.getPixelRatio(),e.getSize(C),h&&`createProjectionLayer`in XRWebGLBinding.prototype){let n=null,r=null,o=null;v.depth&&(o=v.stencil?t.DEPTH24_STENCIL8:t.DEPTH_COMPONENT24,n=v.stencil?B:ze,r=v.stencil?ue:Re);let s={colorFormat:t.RGBA8,depthFormat:o,scaleFactor:a};d=this.getBinding(),f=d.createProjectionLayer(s),i.updateRenderState({layers:[f]}),e.setPixelRatio(1),e.setSize(f.textureWidth,f.textureHeight,!1),b=new Be(f.textureWidth,f.textureHeight,{format:ce,type:De,depthTexture:new L(f.textureWidth,f.textureHeight,r,void 0,void 0,void 0,void 0,void 0,void 0,n),stencilBuffer:v.stencil,colorSpace:e.outputColorSpace,samples:v.antialias?4:0,resolveDepthBuffer:f.ignoreDepthValues===!1,resolveStencilBuffer:f.ignoreDepthValues===!1,storeMultisampledDepthBuffer:f.ignoreDepthValues===!1,storeMultisampledStencilBuffer:f.ignoreDepthValues===!1})}else{let n={antialias:v.antialias,alpha:!0,depth:v.depth,stencil:v.stencil,framebufferScaleFactor:a};p=new XRWebGLLayer(i,t,n),i.updateRenderState({baseLayer:p}),e.setPixelRatio(1),e.setSize(p.framebufferWidth,p.framebufferHeight,!1),b=new Be(p.framebufferWidth,p.framebufferHeight,{format:ce,type:De,colorSpace:e.outputColorSpace,stencilBuffer:v.stencil,resolveDepthBuffer:p.ignoreDepthValues===!1,resolveStencilBuffer:p.ignoreDepthValues===!1,storeMultisampledDepthBuffer:p.ignoreDepthValues===!1,storeMultisampledStencilBuffer:p.ignoreDepthValues===!1})}b.isXRRenderTarget=!0,this.setFoveation(c),l=null,o=await i.requestReferenceSpace(s),ie.setContext(i),ie.start(),r.isPresenting=!0,r.dispatchEvent({type:`sessionstart`})}},this.getEnvironmentBlendMode=function(){if(i!==null)return i.environmentBlendMode},this.getDepthTexture=function(){return g.getDepthTexture()};function P(e){for(let t=0;t<e.removed.length;t++){let n=e.removed[t],r=S.indexOf(n);r>=0&&(S[r]=null,x[r].disconnect(n))}for(let t=0;t<e.added.length;t++){let n=e.added[t],r=S.indexOf(n);if(r===-1){for(let e=0;e<x.length;e++)if(e>=S.length){S.push(n),r=e;break}else if(S[e]===null){S[e]=n,r=e;break}if(r===-1)break}let i=x[r];i&&i.connect(n)}}function ee(e,t){t===null?e.matrixWorld.copy(e.matrix):e.matrixWorld.multiplyMatrices(t.matrixWorld,e.matrix),e.matrixWorldInverse.copy(e.matrixWorld).invert()}this.updateCamera=function(e){if(i===null)return;let t=e.near,n=e.far;g.texture!==null&&(g.depthNear>0&&(t=g.depthNear),g.depthFar>0&&(n=g.depthFar)),k.near=D.near=E.near=t,k.far=D.far=E.far=n,(A!==k.near||j!==k.far)&&(i.updateRenderState({depthNear:k.near,depthFar:k.far}),A=k.near,j=k.far),k.layers.mask=e.layers.mask|6,E.layers.mask=k.layers.mask&-5,D.layers.mask=k.layers.mask&-3;let r=e.parent,a=k.cameras;ee(k,r);for(let e=0;e<a.length;e++)ee(a[e],r);k.projectionMatrix.copy(E.projectionMatrix),k.projectionMatrixInverse.copy(E.projectionMatrixInverse),T===null&&e.isPerspectiveCamera&&(T={camera:e,fov:e.fov,zoom:e.zoom}),te(e,k,r)};function te(e,t,n){n===null?e.matrix.copy(t.matrixWorld):(e.matrix.copy(n.matrixWorld),e.matrix.invert(),e.matrix.multiply(t.matrixWorld)),e.matrix.decompose(e.position,e.quaternion,e.scale),e.updateMatrixWorld(!0),e.projectionMatrix.copy(t.projectionMatrix),e.projectionMatrixInverse.copy(t.projectionMatrixInverse),e.isPerspectiveCamera&&(e.fov=Ie*2*Math.atan(1/e.projectionMatrix.elements[5]),e.zoom=1)}this.getCamera=function(){return k},this.getFoveation=function(){if(f!==null||p!==null)return c},this.setFoveation=function(e){c=e,f!==null&&(f.fixedFoveation=e),p!==null&&p.fixedFoveation!==void 0&&(p.fixedFoveation=e)},this.hasDepthSensing=function(){return g.texture!==null},this.getDepthSensingMesh=function(){return g.getMesh(k)},this.getCameraTexture=function(e){return _[e]};let F=null;function re(t,n){if(u=n.getViewerPose(l||o),m=n,u!==null){let t=u.views;p!==null&&(e.setRenderTargetFramebuffer(b,p.framebuffer),e.setRenderTarget(b));let n=!1;t.length!==k.cameras.length&&(k.cameras.length=0,n=!0);for(let r=0;r<t.length;r++){let i=t[r],a=null;if(p!==null)a=p.getViewport(i);else{let t=d.getViewSubImage(f,i);a=t.viewport,r===0&&(e.setRenderTargetTextures(b,t.colorTexture,t.depthStencilTexture),e.setRenderTarget(b))}let o=O[r];o===void 0&&(o=new ne,o.layers.enable(r),o.viewport=new ge,O[r]=o),o.matrix.fromArray(i.transform.matrix),o.matrix.decompose(o.position,o.quaternion,o.scale),o.projectionMatrix.fromArray(i.projectionMatrix),o.projectionMatrixInverse.copy(o.projectionMatrix).invert(),o.viewport.set(a.x,a.y,a.width,a.height),r===0&&(k.matrix.copy(o.matrix),k.matrix.decompose(k.position,k.quaternion,k.scale)),n===!0&&k.cameras.push(o)}let a=i.enabledFeatures;if(a&&a.includes(`depth-sensing`)&&i.depthUsage==`gpu-optimized`&&h){d=r.getBinding();let e=d.getDepthInformation(t[0]);e&&e.isValid&&e.texture&&g.init(e,i.renderState)}if(a&&a.includes(`camera-access`)&&h){e.state.unbindTexture(),d=r.getBinding();for(let e=0;e<t.length;e++){let n=t[e].camera;if(n){let e=_[n];e||(e=new Ve,_[n]=e);let t=d.getCameraImage(n);e.sourceTexture=t}}}}for(let e=0;e<x.length;e++){let t=S[e],r=x[e];t!==null&&r!==void 0&&r.update(t,n,l||o)}F&&F(t,n),n.detectedPlanes&&r.dispatchEvent({type:`planesdetected`,data:n}),m=null}let ie=new $t;ie.setAnimationLoop(re),this.setAnimationLoop=function(e){F=e},this.dispose=function(){}}},ra=new r,ia=new V;ia.set(-1,0,0,0,1,0,0,0,1);function aa(e,t){function n(e,t){e.matrixAutoUpdate===!0&&e.updateMatrix(),t.value.copy(e.matrix)}function r(t,n){n.color.getRGB(t.fogColor.value,u(e)),n.isFog?(t.fogNear.value=n.near,t.fogFar.value=n.far):n.isFogExp2&&(t.fogDensity.value=n.density)}function i(e,t,n,r,i){t.isNodeMaterial?t.uniformsNeedUpdate=!1:t.isMeshBasicMaterial?a(e,t):t.isMeshLambertMaterial?(a(e,t),t.envMap&&(e.envMapIntensity.value=t.envMapIntensity)):t.isMeshToonMaterial?(a(e,t),f(e,t)):t.isMeshPhongMaterial?(a(e,t),d(e,t),t.envMap&&(e.envMapIntensity.value=t.envMapIntensity)):t.isMeshStandardMaterial?(a(e,t),p(e,t),t.isMeshPhysicalMaterial&&m(e,t,i)):t.isMeshMatcapMaterial?(a(e,t),h(e,t)):t.isMeshDepthMaterial?a(e,t):t.isMeshDistanceMaterial?(a(e,t),g(e,t)):t.isMeshNormalMaterial?a(e,t):t.isLineBasicMaterial?(o(e,t),t.isLineDashedMaterial&&s(e,t)):t.isPointsMaterial?c(e,t,n,r):t.isSpriteMaterial?l(e,t):t.isShadowMaterial?(e.color.value.copy(t.color),e.opacity.value=t.opacity):t.isShaderMaterial&&(t.uniformsNeedUpdate=!1)}function a(e,r){e.opacity.value=r.opacity,r.color&&e.diffuse.value.copy(r.color),r.emissive&&e.emissive.value.copy(r.emissive).multiplyScalar(r.emissiveIntensity),r.map&&(e.map.value=r.map,n(r.map,e.mapTransform)),r.alphaMap&&(e.alphaMap.value=r.alphaMap,n(r.alphaMap,e.alphaMapTransform)),r.bumpMap&&(e.bumpMap.value=r.bumpMap,n(r.bumpMap,e.bumpMapTransform),e.bumpScale.value=r.bumpScale,r.side===1&&(e.bumpScale.value*=-1)),r.normalMap&&(e.normalMap.value=r.normalMap,n(r.normalMap,e.normalMapTransform),e.normalScale.value.copy(r.normalScale),r.side===1&&e.normalScale.value.negate()),r.displacementMap&&(e.displacementMap.value=r.displacementMap,n(r.displacementMap,e.displacementMapTransform),e.displacementScale.value=r.displacementScale,e.displacementBias.value=r.displacementBias),r.emissiveMap&&(e.emissiveMap.value=r.emissiveMap,n(r.emissiveMap,e.emissiveMapTransform)),r.specularMap&&(e.specularMap.value=r.specularMap,n(r.specularMap,e.specularMapTransform)),r.alphaTest>0&&(e.alphaTest.value=r.alphaTest);let i=t.get(r),a=i.envMap,o=i.envMapRotation;a&&(e.envMap.value=a,e.envMapRotation.value.setFromMatrix4(ra.makeRotationFromEuler(o)).transpose(),a.isCubeTexture&&a.isRenderTargetTexture===!1&&e.envMapRotation.value.premultiply(ia),e.reflectivity.value=r.reflectivity,e.ior.value=r.ior,e.refractionRatio.value=r.refractionRatio),r.lightMap&&(e.lightMap.value=r.lightMap,e.lightMapIntensity.value=r.lightMapIntensity,n(r.lightMap,e.lightMapTransform)),r.aoMap&&(e.aoMap.value=r.aoMap,e.aoMapIntensity.value=r.aoMapIntensity,n(r.aoMap,e.aoMapTransform))}function o(e,t){e.diffuse.value.copy(t.color),e.opacity.value=t.opacity,t.map&&(e.map.value=t.map,n(t.map,e.mapTransform))}function s(e,t){e.dashSize.value=t.dashSize,e.totalSize.value=t.dashSize+t.gapSize,e.scale.value=t.scale}function c(e,t,r,i){e.diffuse.value.copy(t.color),e.opacity.value=t.opacity,e.size.value=t.size*r,e.scale.value=i*.5,t.map&&(e.map.value=t.map,n(t.map,e.uvTransform)),t.alphaMap&&(e.alphaMap.value=t.alphaMap,n(t.alphaMap,e.alphaMapTransform)),t.alphaTest>0&&(e.alphaTest.value=t.alphaTest)}function l(e,t){e.diffuse.value.copy(t.color),e.opacity.value=t.opacity,e.rotation.value=t.rotation,t.map&&(e.map.value=t.map,n(t.map,e.mapTransform)),t.alphaMap&&(e.alphaMap.value=t.alphaMap,n(t.alphaMap,e.alphaMapTransform)),t.alphaTest>0&&(e.alphaTest.value=t.alphaTest)}function d(e,t){e.specular.value.copy(t.specular),e.shininess.value=Math.max(t.shininess,1e-4)}function f(e,t){t.gradientMap&&(e.gradientMap.value=t.gradientMap)}function p(e,t){e.metalness.value=t.metalness,t.metalnessMap&&(e.metalnessMap.value=t.metalnessMap,n(t.metalnessMap,e.metalnessMapTransform)),e.roughness.value=t.roughness,t.roughnessMap&&(e.roughnessMap.value=t.roughnessMap,n(t.roughnessMap,e.roughnessMapTransform)),t.envMap&&(e.envMapIntensity.value=t.envMapIntensity)}function m(e,t,r){e.ior.value=t.ior,t.diffuseRoughness>0&&(e.diffuseRoughness.value=t.diffuseRoughness,t.diffuseRoughnessMap&&(e.diffuseRoughnessMap.value=t.diffuseRoughnessMap,n(t.diffuseRoughnessMap,e.diffuseRoughnessMapTransform))),t.sheen>0&&(e.sheenColor.value.copy(t.sheenColor).multiplyScalar(t.sheen),e.sheenRoughness.value=t.sheenRoughness,t.sheenColorMap&&(e.sheenColorMap.value=t.sheenColorMap,n(t.sheenColorMap,e.sheenColorMapTransform)),t.sheenRoughnessMap&&(e.sheenRoughnessMap.value=t.sheenRoughnessMap,n(t.sheenRoughnessMap,e.sheenRoughnessMapTransform))),t.clearcoat>0&&(e.clearcoat.value=t.clearcoat,e.clearcoatRoughness.value=t.clearcoatRoughness,t.clearcoatMap&&(e.clearcoatMap.value=t.clearcoatMap,n(t.clearcoatMap,e.clearcoatMapTransform)),t.clearcoatRoughnessMap&&(e.clearcoatRoughnessMap.value=t.clearcoatRoughnessMap,n(t.clearcoatRoughnessMap,e.clearcoatRoughnessMapTransform)),t.clearcoatNormalMap&&(e.clearcoatNormalMap.value=t.clearcoatNormalMap,n(t.clearcoatNormalMap,e.clearcoatNormalMapTransform),e.clearcoatNormalScale.value.copy(t.clearcoatNormalScale),t.side===1&&e.clearcoatNormalScale.value.negate())),t.dispersion>0&&(e.dispersion.value=t.dispersion),t.retroreflectivity>0&&(e.retroreflectivity.value=t.retroreflectivity),t.iridescence>0&&(e.iridescence.value=t.iridescence,e.iridescenceIOR.value=t.iridescenceIOR,e.iridescenceThicknessMinimum.value=t.iridescenceThicknessMinimum,e.iridescenceThicknessMaximum.value=t.iridescenceThicknessMaximum,t.iridescenceMap&&(e.iridescenceMap.value=t.iridescenceMap,n(t.iridescenceMap,e.iridescenceMapTransform)),t.iridescenceThicknessMap&&(e.iridescenceThicknessMap.value=t.iridescenceThicknessMap,n(t.iridescenceThicknessMap,e.iridescenceThicknessMapTransform))),t.transmission>0&&(e.transmission.value=t.transmission,e.transmissionSamplerMap.value=r.texture,e.transmissionSamplerSize.value.set(r.width,r.height),t.transmissionMap&&(e.transmissionMap.value=t.transmissionMap,n(t.transmissionMap,e.transmissionMapTransform)),e.thickness.value=t.thickness,t.thicknessMap&&(e.thicknessMap.value=t.thicknessMap,n(t.thicknessMap,e.thicknessMapTransform)),e.attenuationDistance.value=t.attenuationDistance,e.attenuationColor.value.copy(t.attenuationColor)),t.anisotropy>0&&(e.anisotropyVector.value.set(t.anisotropy*Math.cos(t.anisotropyRotation),t.anisotropy*Math.sin(t.anisotropyRotation)),t.anisotropyMap&&(e.anisotropyMap.value=t.anisotropyMap,n(t.anisotropyMap,e.anisotropyMapTransform))),e.specularIntensity.value=t.specularIntensity,e.specularColor.value.copy(t.specularColor),t.specularColorMap&&(e.specularColorMap.value=t.specularColorMap,n(t.specularColorMap,e.specularColorMapTransform)),t.specularIntensityMap&&(e.specularIntensityMap.value=t.specularIntensityMap,n(t.specularIntensityMap,e.specularIntensityMapTransform))}function h(e,t){t.matcap&&(e.matcap.value=t.matcap)}function g(e,n){let r=t.get(n).light;e.referencePosition.value.setFromMatrixPosition(r.matrixWorld),e.nearDistance.value=r.shadow.camera.near,e.farDistance.value=r.shadow.camera.far}return{refreshFogUniforms:r,refreshMaterialUniforms:i}}function oa(e,t,r,i){let a={},o={};function s(e,t){let n=t.program;i.uniformBlockBinding(e,n,a[e.id])}function c(e,n){let r=a[e.id];r===void 0&&(h(e),r=l(e),a[e.id]=r,e.addEventListener(`dispose`,_));let s=n.program;i.updateUBOMapping(e,s);let c=t.render.frame;o[e.id]!==c&&(u(e),o[e.id]=c)}function l(t){let n=e.createBuffer(),r=t.__size,i=t.usage;return e.bindBuffer(e.UNIFORM_BUFFER,n),e.bufferData(e.UNIFORM_BUFFER,r,i),e.bindBuffer(e.UNIFORM_BUFFER,null),n}function u(t){let n=a[t.id],r=t.uniforms,i=t.__cache;e.bindBuffer(e.UNIFORM_BUFFER,n);for(let e=0,t=r.length;e<t;e++){let t=r[e];if(Array.isArray(t))for(let n=0,r=t.length;n<r;n++)d(t[n],e,n,i);else d(t,e,0,i)}e.bindBuffer(e.UNIFORM_BUFFER,null)}function d(t,n,r,i){if(p(t,n,r,i)===!0){let n=t.__offset,r=t.value;if(Array.isArray(r)){let e=0;for(let n=0;n<r.length;n++){let i=r[n],a=g(i,!0);f(i,t.__data,e),e+=a.storage/Float32Array.BYTES_PER_ELEMENT}}else f(r,t.__data,0);e.bufferSubData(e.UNIFORM_BUFFER,n,t.__data)}}function f(e,t,n){typeof e==`number`||typeof e==`boolean`?t[n]=e:e.isMatrix3?(t[n]=e.elements[0],t[n+1]=e.elements[1],t[n+2]=e.elements[2],t[n+3]=0,t[n+4]=e.elements[3],t[n+5]=e.elements[4],t[n+6]=e.elements[5],t[n+7]=0,t[n+8]=e.elements[6],t[n+9]=e.elements[7],t[n+10]=e.elements[8],t[n+11]=0):ArrayBuffer.isView(e)?t.set(e.subarray(0,t.length-n),n):e.toArray(t,n)}function p(e,t,n,r){let i=e.value,a=t+`_`+n;if(Array.isArray(i)){r[a]===void 0&&(r[a]=[]);let e=r[a],t=!1;for(let n=0;n<i.length;n++)m(i[n],e,n)===!0&&(t=!0);return t}return m(i,r,a)}function m(e,t,n){if(t[n]===void 0)return t[n]=typeof e==`number`||typeof e==`boolean`?e:ArrayBuffer.isView(e)?e.slice():e.clone(),!0;{let r=t[n];if(typeof e==`number`||typeof e==`boolean`){if(r!==e)return t[n]=e,!0}else if(ArrayBuffer.isView(e))return!0;else if(r.equals(e)===!1)return r.copy(e),!0}return!1}function h(e){let t=e.uniforms,n=0;for(let e=0,r=t.length;e<r;e++){let r=Array.isArray(t[e])?t[e]:[t[e]];for(let i=0,a=r.length;i<a;i++){let a=r[i],o=Array.isArray(a.value)?a.value:[a.value],s=Array.isArray(t[e])||Array.isArray(a.value),c=n;for(let e=0,t=o.length;e<t;e++){let t=o[e],r=g(t,s),i=n%16,a=i%r.boundary,l=i+a;n+=a,l!==0&&16-l<r.storage&&(n+=16-l),e===0&&(c=n),n+=r.storage}a.__data=new(a.type===`int`?Int32Array:a.type===`uint`?Uint32Array:Float32Array)((n-c)/Float32Array.BYTES_PER_ELEMENT),a.__offset=c}}let r=n%16;return r>0&&(n+=16-r),e.__size=n,e.__cache={},this}function g(e,t){let r={boundary:0,storage:0};return typeof e==`number`||typeof e==`boolean`?(r.boundary=4,r.storage=4):e.isVector2?(r.boundary=8,r.storage=8):e.isVector3||e.isColor?(r.boundary=16,r.storage=12):e.isVector4?(r.boundary=16,r.storage=16):e.isMatrix3?(r.boundary=16,r.storage=48):e.isMatrix4?(r.boundary=16,r.storage=64):e.isTexture?n(`WebGLRenderer: Texture samplers can not be part of an uniforms group.`):ArrayBuffer.isView(e)?(r.boundary=16,r.storage=e.byteLength):n(`WebGLRenderer: Unsupported uniform value type.`,e),t===!0&&(r.boundary=16,r.storage=Math.ceil(r.storage/16)*16),r}function _(t){let n=t.target;n.removeEventListener(`dispose`,_),e.deleteBuffer(a[n.id]),delete a[n.id],delete o[n.id]}function v(){for(let t in a)e.deleteBuffer(a[t]);a={},o={}}return{bind:s,update:c,dispose:v}}var sa=new Uint16Array([12469,15057,12620,14925,13266,14620,13807,14376,14323,13990,14545,13625,14713,13328,14840,12882,14931,12528,14996,12233,15039,11829,15066,11525,15080,11295,15085,10976,15082,10705,15073,10495,13880,14564,13898,14542,13977,14430,14158,14124,14393,13732,14556,13410,14702,12996,14814,12596,14891,12291,14937,11834,14957,11489,14958,11194,14943,10803,14921,10506,14893,10278,14858,9960,14484,14039,14487,14025,14499,13941,14524,13740,14574,13468,14654,13106,14743,12678,14818,12344,14867,11893,14889,11509,14893,11180,14881,10751,14852,10428,14812,10128,14765,9754,14712,9466,14764,13480,14764,13475,14766,13440,14766,13347,14769,13070,14786,12713,14816,12387,14844,11957,14860,11549,14868,11215,14855,10751,14825,10403,14782,10044,14729,9651,14666,9352,14599,9029,14967,12835,14966,12831,14963,12804,14954,12723,14936,12564,14917,12347,14900,11958,14886,11569,14878,11247,14859,10765,14828,10401,14784,10011,14727,9600,14660,9289,14586,8893,14508,8533,15111,12234,15110,12234,15104,12216,15092,12156,15067,12010,15028,11776,14981,11500,14942,11205,14902,10752,14861,10393,14812,9991,14752,9570,14682,9252,14603,8808,14519,8445,14431,8145,15209,11449,15208,11451,15202,11451,15190,11438,15163,11384,15117,11274,15055,10979,14994,10648,14932,10343,14871,9936,14803,9532,14729,9218,14645,8742,14556,8381,14461,8020,14365,7603,15273,10603,15272,10607,15267,10619,15256,10631,15231,10614,15182,10535,15118,10389,15042,10167,14963,9787,14883,9447,14800,9115,14710,8665,14615,8318,14514,7911,14411,7507,14279,7198,15314,9675,15313,9683,15309,9712,15298,9759,15277,9797,15229,9773,15166,9668,15084,9487,14995,9274,14898,8910,14800,8539,14697,8234,14590,7790,14479,7409,14367,7067,14178,6621,15337,8619,15337,8631,15333,8677,15325,8769,15305,8871,15264,8940,15202,8909,15119,8775,15022,8565,14916,8328,14804,8009,14688,7614,14569,7287,14448,6888,14321,6483,14088,6171,15350,7402,15350,7419,15347,7480,15340,7613,15322,7804,15287,7973,15229,8057,15148,8012,15046,7846,14933,7611,14810,7357,14682,7069,14552,6656,14421,6316,14251,5948,14007,5528,15356,5942,15356,5977,15353,6119,15348,6294,15332,6551,15302,6824,15249,7044,15171,7122,15070,7050,14949,6861,14818,6611,14679,6349,14538,6067,14398,5651,14189,5311,13935,4958,15359,4123,15359,4153,15356,4296,15353,4646,15338,5160,15311,5508,15263,5829,15188,6042,15088,6094,14966,6001,14826,5796,14678,5543,14527,5287,14377,4985,14133,4586,13869,4257,15360,1563,15360,1642,15358,2076,15354,2636,15341,3350,15317,4019,15273,4429,15203,4732,15105,4911,14981,4932,14836,4818,14679,4621,14517,4386,14359,4156,14083,3795,13808,3437,15360,122,15360,137,15358,285,15355,636,15344,1274,15322,2177,15281,2765,15215,3223,15120,3451,14995,3569,14846,3567,14681,3466,14511,3305,14344,3121,14037,2800,13753,2467,15360,0,15360,1,15359,21,15355,89,15346,253,15325,479,15287,796,15225,1148,15133,1492,15008,1749,14856,1882,14685,1886,14506,1783,14324,1608,13996,1398,13702,1183]),ca=null;function la(){return ca===null&&(ca=new ae(sa,16,16,g,be),ca.name=`DFG_LUT`,ca.minFilter=T,ca.magFilter=T,ca.wrapS=Ce,ca.wrapT=Ce,ca.generateMipmaps=!1,ca.needsUpdate=!0),ca}var ua=class{constructor(e={}){let{canvas:t=We(),context:a=null,depth:l=!0,stencil:u=!1,alpha:f=!1,antialias:p=!1,premultipliedAlpha:m=!0,preserveDrawingBuffer:h=!1,powerPreference:g=`default`,failIfMajorPerformanceCaveat:_=!1,reversedDepthBuffer:v=!1,outputBufferType:y=De}=e;this.isWebGLRenderer=!0;let b;if(a!==null){if(typeof WebGLRenderingContext<`u`&&a instanceof WebGLRenderingContext)throw Error(`THREE.WebGLRenderer: WebGL 1 is not supported since r163.`);b=a.getContextAttributes().alpha}else b=f;let S=y,w=new Set([Oe,x,i]),T=new Set([De,Re,Ae,ue,fe,me]),E=new Uint32Array(4),D=new Int32Array(4),O={textures:[],min:[],max:[],resolution:[]},k=null,A=null,j=[],M=[],N=null;this.domElement=t,this.debug={checkShaderErrors:!0,diagnostics:{keywords:!1},onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this.toneMapping=0,this.toneMappingExposure=1,this.transmissionResolutionScale=1;let P=this,ee=!1,te=null,ne=null,F=null,re=null;this._outputColorSpace=Me;let ie=0,ae=0,I=null,se=-1,ce=null,L=new ge,le=new ge,pe=null,he=new Le(0),_e=0,ve=t.width,ye=t.height,xe=1,Ce=null,we=null,Te=new ge(0,0,ve,ye),z=new ge(0,0,ve,ye),Ee=!1,ke=new s,je=new C,Ne=!1,Pe=!1,Fe=new r,Ie=new R,ze=new ge,Ve={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0},He=!1;function Ue(){return I===null?xe:1}let B=a;function Ge(e,n){return t.getContext(e,n)}let V,Ke,H,qe,U,W,Je,Ye,Xe,Ze,Qe,$e,et,tt,nt,rt,it,at,ot,st,ct,lt,ut;try{let e={alpha:!0,depth:l,stencil:u,antialias:p,premultipliedAlpha:m,preserveDrawingBuffer:h,powerPreference:g,failIfMajorPerformanceCaveat:_};if(`setAttribute`in t&&t.setAttribute(`data-engine`,`three.js r187`),t.addEventListener(`webglcontextlost`,pt,!1),t.addEventListener(`webglcontextrestored`,mt,!1),t.addEventListener(`webglcontextcreationerror`,ht,!1),B===null){let t=`webgl2`;if(B=Ge(t,e),B===null)throw Ge(t)?Error(`THREE.WebGLRenderer: Error creating WebGL context with your selected attributes.`):Error(`THREE.WebGLRenderer: Error creating WebGL context.`)}dt()}catch(e){throw t.removeEventListener(`webglcontextlost`,pt,!1),t.removeEventListener(`webglcontextrestored`,mt,!1),t.removeEventListener(`webglcontextcreationerror`,ht,!1),o(`WebGLRenderer: `+e.message),e}function dt(){V=new An(B),V.init(),ct=new Qi(B,V),Ke=new un(B,V,e,ct),H=new Xi(B,V),Ke.reversedDepthBuffer&&v&&H.buffers.depth.setReversed(!0),ne=B.createFramebuffer(),F=B.createFramebuffer(),re=B.createFramebuffer(),qe=new Nn(B),U=new Ai,W=new Zi(B,V,H,U,Ke,ct,qe),Je=new kn(P),Ye=new en(B),lt=new cn(B,Ye),Xe=new jn(B,Ye,qe,lt),Ze=new Fn(B,Xe,Ye,lt,qe),at=new Pn(B,Ke,W),nt=new dn(U),Qe=new ki(P,Je,V,Ke,lt,nt),$e=new aa(P,U),et=new Pi,tt=new Vi(V),it=new sn(P,Je,H,Ze,b,m),rt=new Yi(P,Ze,Ke),ut=new oa(B,qe,Ke,H),ot=new ln(B,V,qe),st=new Mn(B,V,qe),qe.programs=Qe.programs,P.capabilities=Ke,P.extensions=V,P.properties=U,P.renderLists=et,P.shadowMap=rt,P.state=H,P.info=qe}S!==1009&&(N=new Ln(S,t.width,t.height,p,l,u));let ft=new na(P,B);this.xr=ft,this.getContext=function(){return B},this.getContextAttributes=function(){return B.getContextAttributes()},this.forceContextLoss=function(){let e=V.get(`WEBGL_lose_context`);e&&e.loseContext()},this.forceContextRestore=function(){let e=V.get(`WEBGL_lose_context`);e&&e.restoreContext()},this.getPixelRatio=function(){return xe},this.setPixelRatio=function(e){e!==void 0&&(xe=e,this.setSize(ve,ye,!1))},this.getSize=function(e){return e.set(ve,ye)},this.setSize=function(e,r,i=!0){ft.isPresenting?n(`WebGLRenderer: Can't change size while VR device is presenting.`):(ve=e,ye=r,t.width=Math.floor(e*xe),t.height=Math.floor(r*xe),i===!0&&(t.style.width=e+`px`,t.style.height=r+`px`),N!==null&&N.setSize(t.width,t.height),this.setViewport(0,0,e,r))},this.getDrawingBufferSize=function(e){return e.set(ve*xe,ye*xe).floor()},this.setDrawingBufferSize=function(e,n,r){ve=e,ye=n,xe=r,t.width=Math.floor(e*r),t.height=Math.floor(n*r),this.setViewport(0,0,e,n)},this.setEffects=function(e){if(S===1009)o(`WebGLRenderer: setEffects() requires outputBufferType set to HalfFloatType or FloatType.`);else{if(e){for(let t=0;t<e.length;t++)if(e[t].isOutputPass===!0){n(`WebGLRenderer: OutputPass is not needed in setEffects(). Tone mapping and color space conversion are applied automatically.`);break}}N.setEffects(e||[])}},this.getCurrentViewport=function(e){return e.copy(L)},this.getViewport=function(e){return e.copy(Te)},this.setViewport=function(e,t,n,r){e.isVector4?Te.set(e.x,e.y,e.z,e.w):Te.set(e,t,n,r),H.viewport(L.copy(Te).multiplyScalar(Ue()).round())},this.getScissor=function(e){return e.copy(z)},this.setScissor=function(e,t,n,r){e.isVector4?z.set(e.x,e.y,e.z,e.w):z.set(e,t,n,r),H.scissor(le.copy(z).multiplyScalar(Ue()).round())},this.getScissorTest=function(){return Ee},this.setScissorTest=function(e){H.setScissorTest(Ee=e)},this.setOpaqueSort=function(e){Ce=e},this.setTransparentSort=function(e){we=e},this.getClearColor=function(e){return e.copy(it.getClearColor())},this.setClearColor=function(){it.setClearColor(...arguments)},this.getClearAlpha=function(){return it.getClearAlpha()},this.setClearAlpha=function(){it.setClearAlpha(...arguments)},this.clear=function(e=!0,t=!0,n=!0){let r=0;if(e){let e=!1;if(I!==null){let t=I.texture.format;e=w.has(t)}if(e){let e=I.texture.type,t=T.has(e),n=it.getClearColor(),r=it.getClearAlpha(),i=n.r,a=n.g,o=n.b;t?(E[0]=i,E[1]=a,E[2]=o,E[3]=r,B.clearBufferuiv(B.COLOR,0,E)):(D[0]=i,D[1]=a,D[2]=o,D[3]=r,B.clearBufferiv(B.COLOR,0,D))}else r|=B.COLOR_BUFFER_BIT}t&&(r|=B.DEPTH_BUFFER_BIT,this.state.buffers.depth.setMask(!0)),n&&(r|=B.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295)),r!==0&&B.clear(r)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.setNodesHandler=function(e){e.setRenderer(this),te=e},this.dispose=function(){t.removeEventListener(`webglcontextlost`,pt,!1),t.removeEventListener(`webglcontextrestored`,mt,!1),t.removeEventListener(`webglcontextcreationerror`,ht,!1),it.dispose(),et.dispose(),tt.dispose(),W.dispose(),U.dispose(),Je.dispose(),Ze.dispose(),Xe.dispose(),lt.dispose(),ut.dispose(),Qe.dispose(),ft.dispose(),ft.removeEventListener(`sessionstart`,St),ft.removeEventListener(`sessionend`,Ct),G.stop()};function pt(e){e.preventDefault(),c(`WebGLRenderer: Context Lost.`),ee=!0}function mt(){c(`WebGLRenderer: Context Restored.`),ee=!1;let e=qe.autoReset,t=rt.enabled,n=rt.autoUpdate,r=rt.needsUpdate,i=rt.type;dt(),qe.autoReset=e,rt.enabled=t,rt.autoUpdate=n,rt.needsUpdate=r,rt.type=i}function ht(e){o(`WebGLRenderer: A WebGL context could not be created. Reason: `,e.statusMessage)}function gt(e){let t=e.target;t.removeEventListener(`dispose`,gt),_t(t)}function _t(e){vt(e),U.remove(e)}function vt(e){let t=U.get(e).programs;t!==void 0&&(t.forEach(function(e){Qe.releaseProgram(e)}),e.isShaderMaterial&&Qe.releaseShaderCache(e))}this.renderBufferDirect=function(e,t,n,r,i,a){t===null&&(t=Ve);let o=i.isMesh&&i.matrixWorld.determinantAffine()<0,s=Nt(e,t,n,r,i);H.setMaterial(r,o);let c=n.index,l=1;if(r.wireframe===!0){if(c=Xe.getWireframeAttribute(n),c===void 0)return;l=2}let u=n.drawRange,d=n.attributes.position,f=u.start*l,p=(u.start+u.count)*l;a!==null&&(f=Math.max(f,a.start*l),p=Math.min(p,(a.start+a.count)*l)),c===null?d!=null&&(f=Math.max(f,0),p=Math.min(p,d.count)):(f=Math.max(f,0),p=Math.min(p,c.count));let m=p-f;if(m<0||m===1/0)return;lt.setup(i,r,s,n,c);let h,g=ot;if(c!==null&&(h=Ye.get(c),g=st,g.setIndex(h)),i.isMesh)r.wireframe===!0?(H.setLineWidth(r.wireframeLinewidth*Ue()),g.setMode(B.LINES)):g.setMode(B.TRIANGLES);else if(i.isLine){let e=r.linewidth;e===void 0&&(e=1),H.setLineWidth(e*Ue()),i.isLineSegments?g.setMode(B.LINES):i.isLineLoop?g.setMode(B.LINE_LOOP):g.setMode(B.LINE_STRIP)}else i.isPoints?g.setMode(B.POINTS):i.isSprite&&g.setMode(B.TRIANGLES);if(i.isBatchedMesh){if(V.get(`WEBGL_multi_draw`))g.renderMultiDraw(i._multiDrawStarts,i._multiDrawCounts,i._multiDrawCount);else{let e=i._multiDrawStarts,t=i._multiDrawCounts,n=i._multiDrawCount,a=c?Ye.get(c).bytesPerElement:1,o=U.get(r).currentProgram.getUniforms();for(let r=0;r<n;r++)o.setValue(B,`_gl_DrawID`,r),g.render(e[r]/a,t[r])}}else if(i.isInstancedMesh)g.renderInstances(f,m,i.count);else if(n.isInstancedBufferGeometry){let e=n._maxInstanceCount===void 0?1/0:n._maxInstanceCount,t=Math.min(n.instanceCount,e);g.renderInstances(f,m,t)}else g.render(f,m)};function yt(e,t,n,r){te!==null&&e.isNodeMaterial&&te.setObject(r,e),Ne===!0&&nt.setState(e,n,!1),e.transparent===!0&&e.side===2&&e.forceSinglePass===!1?(e.side=1,e.needsUpdate=!0,kt(e,t,r),e.side=0,e.needsUpdate=!0,kt(e,t,r),e.side=2):kt(e,t,r)}this.compile=function(e,t,n=null){n===null&&(n=e),te!==null&&te.renderStart(e,t,n),A=tt.get(n),A.init(t),M.push(A),n.traverseVisible(function(e){e.isLight&&e.layers.test(t.layers)&&(A.pushLight(e),e.castShadow&&A.pushShadow(e))}),e!==n&&e.traverseVisible(function(e){e.isLight&&e.layers.test(t.layers)&&(A.pushLight(e),e.castShadow&&A.pushShadow(e))}),A.setupLights(),te!==null&&te.updateLights(A.state.lightsArray),Pe=this.localClippingEnabled,Ne=nt.init(this.clippingPlanes,Pe),Ne===!0&&nt.setGlobalState(this.clippingPlanes,t),te!==null&&rt.render(A.state.shadowsArray,n,t);let r=new Set;return e.traverse(function(e){if(!(e.isMesh||e.isPoints||e.isLine||e.isSprite))return;let i=e.material;if(i){if(Array.isArray(i))for(let a=0;a<i.length;a++){let o=i[a];yt(o,n,t,e),r.add(o)}else yt(i,n,t,e),r.add(i)}}),A=M.pop(),te!==null&&te.renderEnd(),r},this.compileAsync=function(e,t,n=null){let r=this.compile(e,t,n);return new Promise(t=>{function n(){r.forEach(function(e){let t=U.get(e).currentProgram;(t===void 0||t.isReady())&&r.delete(e)}),r.size===0?t(e):setTimeout(n,10)}V.get(`KHR_parallel_shader_compile`)===null?setTimeout(n,10):n()})};let bt=null;function xt(e){bt&&bt(e)}function St(){G.stop()}function Ct(){G.start()}let G=new $t;G.setAnimationLoop(xt),typeof self<`u`&&G.setContext(self),this.setAnimationLoop=function(e){bt=e,ft.setAnimationLoop(e),e===null?G.stop():G.start()},ft.addEventListener(`sessionstart`,St),ft.addEventListener(`sessionend`,Ct),this.render=function(e,t){if(t!==void 0&&t.isCamera!==!0){o(`WebGLRenderer.render: camera is not an instance of THREE.Camera.`);return}if(ee===!0)return;te!==null&&te.renderStart(e,t);let n=ft.enabled===!0&&ft.isPresenting===!0,r=N!==null&&(I===null||n)&&N.begin(P,I);if(e.matrixWorldAutoUpdate===!0&&e.updateMatrixWorld(),t.parent===null&&t.matrixWorldAutoUpdate===!0&&t.updateMatrixWorld(),ft.enabled===!0&&ft.isPresenting===!0&&(N===null||N.isCompositing()===!1)&&(ft.cameraAutoUpdate===!0&&ft.updateCamera(t),t=ft.getCamera()),e.isScene===!0&&e.onBeforeRender(P,e,t,I),A=tt.get(e,M.length),A.init(t),A.state.textureUnits=W.getTextureUnits(),M.push(A),Fe.multiplyMatrices(t.projectionMatrix,t.matrixWorldInverse),t.isArrayCamera?je.setFromArrayCamera(t):ke.setFromProjectionMatrix(Fe,oe,t.reversedDepth),Pe=this.localClippingEnabled,Ne=nt.init(this.clippingPlanes,Pe),k=et.get(e,j.length),k.init(),j.push(k),this.info.render.frame++,ft.enabled===!0&&ft.isPresenting===!0){let e=P.xr.getDepthSensingMesh();e!==null&&K(e,t,-1/0,P.sortObjects)}K(e,t,0,P.sortObjects),k.finish(),te!==null&&te.updateLights(A.state.lightsArray),P.sortObjects===!0&&k.sort(Ce,we),He=ft.enabled===!1||ft.isPresenting===!1||ft.hasDepthSensing()===!1,He&&it.addToRenderList(k,e),this.info.autoReset===!0&&this.info.reset(),Ne===!0&&nt.beginShadows();let i=A.state.shadowsArray;if(rt.render(i,e,t),Ne===!0&&nt.endShadows(),(r&&N.hasRenderPass())===!1){let n=k.opaque,r=k.transmissive;if(A.setupLights(),t.isArrayCamera){let i=t.cameras;if(r.length>0)for(let t=0,a=i.length;t<a;t++){let a=i[t];Tt(n,r,e,a)}He&&it.render(e);for(let t=0,n=i.length;t<n;t++){let n=i[t];wt(k,e,n,n.viewport)}}else r.length>0&&Tt(n,r,e,t),He&&it.render(e),wt(k,e,t)}I!==null&&ae===0&&(W.updateMultisampleRenderTarget(I),W.updateRenderTargetMipmap(I)),r&&N.end(P),e.isScene===!0&&e.onAfterRender(P,e,t),lt.resetDefaultState(),se=-1,ce=null,M.pop(),M.length>0?(A=M[M.length-1],W.setTextureUnits(A.state.textureUnits),Ne===!0&&nt.setGlobalState(P.clippingPlanes,A.state.camera)):A=null,j.pop(),k=j.length>0?j[j.length-1]:null,te!==null&&te.renderEnd()};function K(e,t,n,r){if(e.visible===!1)return;if(e.layers.test(t.layers)){if(e.isGroup)n=e.renderOrder;else if(e.isLOD)e.autoUpdate===!0&&e.update(t);else if(e.isLight)A.pushLight(e),e.castShadow&&A.pushShadow(e);else if(e.isSprite){let i=t.isArrayCamera?je:ke;if(!e.frustumCulled||e.intersectsFrustum(i)){r&&ze.setFromMatrixPosition(e.matrixWorld).applyMatrix4(Fe);let i=Ze.update(e),a=e.material;a.visible&&k.push(e,i,a,n,ze.z,null,t)}}else if(e.isMesh||e.isLine||e.isPoints){let i=t.isArrayCamera?je:ke;if(!e.frustumCulled||e.intersectsFrustum(i)){let i=Ze.update(e),a=e.material;if(r&&(e.boundingSphere===void 0?(i.boundingSphere===null&&i.computeBoundingSphere(),ze.copy(i.boundingSphere.center)):(e.boundingSphere===null&&e.computeBoundingSphere(),ze.copy(e.boundingSphere.center)),ze.applyMatrix4(e.matrixWorld).applyMatrix4(Fe)),Array.isArray(a)){let r=i.groups;for(let o=0,s=r.length;o<s;o++){let s=r[o],c=a[s.materialIndex];c&&c.visible&&k.push(e,i,c,n,ze.z,s,t)}}else a.visible&&k.push(e,i,a,n,ze.z,null,t)}}}let i=e.children;for(let e=0,a=i.length;e<a;e++)K(i[e],t,n,r)}function wt(e,t,n,r){let{opaque:i,transmissive:a,transparent:o}=e;A.setupLightsView(n),Ne===!0&&nt.setGlobalState(P.clippingPlanes,n),r&&H.viewport(L.copy(r)),i.length>0&&Et(i,t,n),a.length>0&&Et(a,t,n),o.length>0&&Et(o,t,n),H.buffers.depth.setTest(!0),H.buffers.depth.setMask(!0),H.buffers.color.setMask(!0),H.setPolygonOffset(!1)}function Tt(e,t,n,r){if((n.isScene===!0?n.overrideMaterial:null)!==null)return;if(A.state.transmissionRenderTarget[r.id]===void 0){let e=V.has(`EXT_color_buffer_half_float`)||V.has(`EXT_color_buffer_float`);A.state.transmissionRenderTarget[r.id]=new Be(1,1,{generateMipmaps:!0,type:e?be:De,minFilter:d,samples:Math.max(4,Ke.samples),stencilBuffer:u,resolveDepthBuffer:!1,resolveStencilBuffer:!1,storeMultisampledDepthBuffer:!1,storeMultisampledStencilBuffer:!1,colorSpace:de.workingColorSpace})}let i=A.state.transmissionRenderTarget[r.id],a=r.viewport||L;i.setSize(a.z*P.transmissionResolutionScale,a.w*P.transmissionResolutionScale);let o=P.getRenderTarget(),s=P.getActiveCubeFace(),c=P.getActiveMipmapLevel();P.setRenderTarget(i),P.getClearColor(he),_e=P.getClearAlpha(),_e<1&&P.setClearColor(16777215,.5),P.clear(),He&&it.render(n);let l=P.toneMapping;P.toneMapping=0;let f=r.viewport;if(r.viewport!==void 0&&(r.viewport=void 0),A.setupLightsView(r),Ne===!0&&nt.setGlobalState(P.clippingPlanes,r),Et(e,n,r),W.updateMultisampleRenderTarget(i),W.updateRenderTargetMipmap(i),V.has(`WEBGL_multisampled_render_to_texture`)===!1){let e=!1;for(let i=0,a=t.length;i<a;i++){let{object:a,geometry:o,material:s,group:c}=t[i];if(s.side===2&&a.layers.test(r.layers)){let t=s.side;s.side=1,s.needsUpdate=!0,Dt(a,n,r,o,s,c),s.side=t,s.needsUpdate=!0,e=!0}}e===!0&&(W.updateMultisampleRenderTarget(i),W.updateRenderTargetMipmap(i))}P.setRenderTarget(o,s,c),P.setClearColor(he,_e),f!==void 0&&(r.viewport=f),P.toneMapping=l}function Et(e,t,n){let r=t.isScene===!0?t.overrideMaterial:null;for(let i=0,a=e.length;i<a;i++){let a=e[i],{object:o,geometry:s,group:c}=a,l=a.material;l.allowOverride===!0&&r!==null&&(l=r),o.layers.test(n.layers)&&Dt(o,t,n,s,l,c)}}function Dt(e,t,n,r,i,a){te!==null&&i.isNodeMaterial&&te.setObject(e,i),e.onBeforeRender(P,t,n,r,i,a),e.modelViewMatrix.multiplyMatrices(n.matrixWorldInverse,e.matrixWorld),e.normalMatrix.getNormalMatrix(e.modelViewMatrix),i.onBeforeRender(P,t,n,r,e,a),i.transparent===!0&&i.side===2&&i.forceSinglePass===!1?(i.side=1,i.needsUpdate=!0,P.renderBufferDirect(n,t,r,i,e,a),i.side=0,i.needsUpdate=!0,P.renderBufferDirect(n,t,r,i,e,a),i.side=2):P.renderBufferDirect(n,t,r,i,e,a),e.onAfterRender(P,t,n,r,i,a)}function Ot(e){let t=0;for(let n of e)n.texture!==null&&t++;return t}function kt(e,t,n){t.isScene!==!0&&(t=Ve);let r=U.get(e),i=A.state.lights,a=A.state.shadowsArray,o=i.state.version,s=Qe.getParameters(e,i.state,a,t,n,A.state.lightProbeGridArray),c=Qe.getProgramCacheKey(s),l=r.programs;r.environment=e.isMeshStandardMaterial||e.isMeshLambertMaterial||e.isMeshPhongMaterial?t.environment:null,r.fog=t.fog;let u=e.isMeshStandardMaterial||e.isMeshLambertMaterial&&!e.envMap||e.isMeshPhongMaterial&&!e.envMap;r.envMap=Je.get(e.envMap||r.environment,u),r.envMapRotation=r.environment!==null&&e.envMap===null?t.environmentRotation:e.envMapRotation,l===void 0&&(e.addEventListener(`dispose`,gt),l=new Map,r.programs=l,r.programVariants=new Map);let d=l.get(c);if(d!==void 0){if(r.currentProgram===d&&r.lightsStateVersion===o)return Mt(e,s),d}else s.uniforms=Qe.getUniforms(e),te!==null&&e.isNodeMaterial&&te.build(e,n,s),e.onBeforeCompile(s,P),d=Qe.acquireProgram(s,c),l.set(c,d),r.uniforms=s.uniforms;let f=r.uniforms;return(!e.isShaderMaterial&&!e.isRawShaderMaterial||e.clipping===!0)&&(f.clippingPlanes=nt.uniform),Mt(e,s),r.needsLights=Ft(e),r.lightsStateVersion=o,r.needsLights&&(f.ambientLightColor.value=i.state.ambient,f.lightProbe.value=i.state.probe,f.sunLights.value=i.state.sun,f.sunLightShadows.value=i.state.sunShadow,f.directionalLights.value=i.state.directional,f.directionalLightShadows.value=i.state.directionalShadow,f.spotLights.value=i.state.spot,f.spotLightShadows.value=i.state.spotShadow,f.rectAreaLights.value=i.state.rectArea,f.ltc_1.value=i.state.rectAreaLTC1,f.ltc_2.value=i.state.rectAreaLTC2,f.pointLights.value=i.state.point,f.pointLightShadows.value=i.state.pointShadow,f.hemisphereLights.value=i.state.hemi,f.sunShadowMatrix.value=i.state.sunShadowMatrix,f.sunShadowCascade.value=i.state.sunShadowCascade,f.directionalShadowMatrix.value=i.state.directionalShadowMatrix,f.spotLightMatrix.value=i.state.spotLightMatrix,f.spotLightMap.value=i.state.spotLightMap,f.pointShadowMatrix.value=i.state.pointShadowMatrix),r.numLightProbeGrids=Ot(A.state.lightProbeGridArray),r.currentProgram=d,r.uniformsList=null,d}function At(e,t,n,r,i){let a=U.get(e),o=a.currentProgram.id+`,`+r+`,`+i,s=a.programVariants.get(o);return s===void 0?(s=kt(e,t,n),a.programVariants.set(o,s)):(a.currentProgram=s,a.uniformsList=null,a.outputColorSpace=r,a.toneMapping=i),s}function jt(e){if(e.uniformsList===null){let t=e.currentProgram.getUniforms();e.uniformsList=Kr.seqWithValue(t.seq,e.uniforms)}return e.uniformsList}function Mt(e,t){let n=U.get(e);n.outputColorSpace=t.outputColorSpace,n.batching=t.batching,n.batchingColor=t.batchingColor,n.instancing=t.instancing,n.instancingColor=t.instancingColor,n.instancingMorph=t.instancingMorph,n.skinning=t.skinning,n.morphTargets=t.morphTargets,n.morphNormals=t.morphNormals,n.morphColors=t.morphColors,n.morphTargetsCount=t.morphTargetsCount,n.numClippingPlanes=t.numClippingPlanes,n.numIntersection=t.numClipIntersection,n.vertexAlphas=t.vertexAlphas,n.vertexTangents=t.vertexTangents,n.toneMapping=t.toneMapping}function Nt(e,t,n,r,i){t.isScene!==!0&&(t=Ve),W.resetTextureUnits();let a=t.fog,o=r.isMeshStandardMaterial||r.isMeshLambertMaterial||r.isMeshPhongMaterial?t.environment:null,s=I===null?P.outputColorSpace:I.isXRRenderTarget===!0?I.texture.colorSpace:de.workingColorSpace,c=r.isMeshStandardMaterial||r.isMeshLambertMaterial&&!r.envMap||r.isMeshPhongMaterial&&!r.envMap,l=Je.get(r.envMap||o,c),u=r.vertexColors===!0&&!!n.attributes.color&&n.attributes.color.itemSize===4,d=!!n.attributes.tangent&&(!!r.normalMap||r.anisotropy>0),f=!!n.morphAttributes.position,p=!!n.morphAttributes.normal,m=!!n.morphAttributes.color,h=0;r.toneMapped&&(I===null||I.isXRRenderTarget===!0)&&(h=P.toneMapping);let g=n.morphAttributes.position||n.morphAttributes.normal||n.morphAttributes.color,_=g===void 0?0:g.length,v=U.get(r),y=A.state.lights;if(Ne===!0&&(Pe===!0||e!==ce)){let t=e===ce&&r.id===se;nt.setState(r,e,t)}let b=!1,x=!1;r.version===v.__version?v.needsLights&&v.lightsStateVersion!==y.state.version||i.isBatchedMesh&&v.batching===!1||!i.isBatchedMesh&&v.batching===!0||i.isBatchedMesh&&v.batchingColor===!0&&i._colorsTexture===null||i.isBatchedMesh&&v.batchingColor===!1&&i._colorsTexture!==null||i.isInstancedMesh&&v.instancing===!1||!i.isInstancedMesh&&v.instancing===!0||i.isSkinnedMesh&&v.skinning===!1||!i.isSkinnedMesh&&v.skinning===!0||i.isInstancedMesh&&v.instancingColor===!0&&i.instanceColor===null||i.isInstancedMesh&&v.instancingColor===!1&&i.instanceColor!==null||i.isInstancedMesh&&v.instancingMorph===!0&&i.morphTexture===null||i.isInstancedMesh&&v.instancingMorph===!1&&i.morphTexture!==null?b=!0:v.envMap===l?r.fog===!0&&v.fog!==a||v.numClippingPlanes!==void 0&&(v.numClippingPlanes!==nt.numPlanes||v.numIntersection!==nt.numIntersection)?b=!0:v.vertexAlphas===u&&v.vertexTangents===d&&v.morphTargets===f&&v.morphNormals===p&&v.morphColors===m&&v.morphTargetsCount===_&&v.numLightProbeGrids===Ot(A.state.lightProbeGridArray)?(v.outputColorSpace!==s||v.toneMapping!==h)&&(x=!0):b=!0:b=!0:(b=!0,v.__version=r.version);let S=v.currentProgram;(b===!0||x===!0)&&(S=x===!0?At(r,t,i,s,h):kt(r,t,i),te&&r.isNodeMaterial&&te.onUpdateProgram(r,S,v));let C=!1,w=!1,T=!1,E=S.getUniforms(),D=v.uniforms;if(H.useProgram(S.program)&&(C=!0,w=!0,T=!0),r.id!==se&&(se=r.id,w=!0),C||ce!==e){H.buffers.depth.getReversed()&&e.reversedDepth!==!0&&(e._reversedDepth=!0,e.updateProjectionMatrix()),E.setValue(B,`projectionMatrix`,e.projectionMatrix),E.setValue(B,`viewMatrix`,e.matrixWorldInverse);let t=E.map.cameraPosition;t!==void 0&&t.setValue(B,Ie.setFromMatrixPosition(e.matrixWorld)),Ke.logarithmicDepthBuffer&&E.setValue(B,`logDepthBufFC`,2/(Math.log(e.far+1)/Math.LN2)),(r.isMeshPhongMaterial||r.isMeshToonMaterial||r.isMeshLambertMaterial||r.isMeshBasicMaterial||r.isMeshStandardMaterial||r.isShaderMaterial)&&E.setValue(B,`isOrthographic`,e.isOrthographicCamera===!0),ce!==e&&(ce=e,w=!0,T=!0)}if(v.needsLights&&(y.state.sunShadowMap.length>0&&E.setValue(B,`sunShadowMap`,y.state.sunShadowMap,W),y.state.directionalShadowMap.length>0&&E.setValue(B,`directionalShadowMap`,y.state.directionalShadowMap,W),y.state.spotShadowMap.length>0&&E.setValue(B,`spotShadowMap`,y.state.spotShadowMap,W),y.state.pointShadowMap.length>0&&E.setValue(B,`pointShadowMap`,y.state.pointShadowMap,W)),i.isSkinnedMesh){E.setOptional(B,i,`bindMatrix`),E.setOptional(B,i,`bindMatrixInverse`);let e=i.skeleton;e&&(e.boneTexture===null&&e.computeBoneTexture(),E.setValue(B,`boneTexture`,e.boneTexture,W))}i.isBatchedMesh&&(E.setOptional(B,i,`batchingTexture`),E.setValue(B,`batchingTexture`,i._matricesTexture,W),E.setOptional(B,i,`batchingIdTexture`),E.setValue(B,`batchingIdTexture`,i._indirectTexture,W),E.setOptional(B,i,`batchingColorTexture`),i._colorsTexture!==null&&E.setValue(B,`batchingColorTexture`,i._colorsTexture,W));let k=n.morphAttributes;if((k.position!==void 0||k.normal!==void 0||k.color!==void 0)&&at.update(i,n,S),(w||v.receiveShadow!==i.receiveShadow)&&(v.receiveShadow=i.receiveShadow,E.setValue(B,`receiveShadow`,i.receiveShadow)),(r.isMeshStandardMaterial||r.isMeshLambertMaterial||r.isMeshPhongMaterial)&&r.envMap===null&&t.environment!==null&&(D.envMapIntensity.value=t.environmentIntensity),D.dfgLUT!==void 0&&(D.dfgLUT.value=la()),w){if(E.setValue(B,`toneMappingExposure`,P.toneMappingExposure),v.needsLights&&Pt(D,T),a&&r.fog===!0&&$e.refreshFogUniforms(D,a),$e.refreshMaterialUniforms(D,r,xe,ye,A.state.transmissionRenderTarget[e.id]),v.needsLights&&v.numLightProbeGrids>0){let e=O,t=0;for(let n of A.state.lightProbeGridArray)n.texture!==null&&(e.textures[t]=n.texture,e.min[t]=n.boundingBox.min,e.max[t]=n.boundingBox.max,e.resolution[t]=n.resolution,t++);for(let n in e)e[n].length=t;D.probesSH.value=e.textures,D.probesMin.value=e.min,D.probesMax.value=e.max,D.probesResolution.value=e.resolution}Kr.upload(B,jt(v),D,W)}if(r.isShaderMaterial&&r.uniformsNeedUpdate===!0&&(Kr.upload(B,jt(v),D,W),r.uniformsNeedUpdate=!1),r.isSpriteMaterial&&E.setValue(B,`center`,i.center),E.setValue(B,`modelViewMatrix`,i.modelViewMatrix),E.setValue(B,`normalMatrix`,i.normalMatrix),E.setValue(B,`modelMatrix`,i.matrixWorld),r.uniformsGroups!==void 0){let e=r.uniformsGroups;for(let t=0,n=e.length;t<n;t++){let n=e[t];ut.update(n,S),ut.bind(n,S)}}return S}function Pt(e,t){e.ambientLightColor.needsUpdate=t,e.lightProbe.needsUpdate=t,e.sunLights.needsUpdate=t,e.sunLightShadows.needsUpdate=t,e.directionalLights.needsUpdate=t,e.directionalLightShadows.needsUpdate=t,e.pointLights.needsUpdate=t,e.pointLightShadows.needsUpdate=t,e.spotLights.needsUpdate=t,e.spotLightShadows.needsUpdate=t,e.rectAreaLights.needsUpdate=t,e.hemisphereLights.needsUpdate=t}function Ft(e){return e.isMeshLambertMaterial||e.isMeshToonMaterial||e.isMeshPhongMaterial||e.isMeshStandardMaterial||e.isShadowMaterial||e.isShaderMaterial&&e.lights===!0}this.getActiveCubeFace=function(){return ie},this.getActiveMipmapLevel=function(){return ae},this.getRenderTarget=function(){return I},this.setRenderTargetTextures=function(e,t,n){let r=U.get(e);r.__autoAllocateDepthBuffer=e.resolveDepthBuffer===!1,r.__autoAllocateDepthBuffer===!1&&(r.__useRenderToTexture=!1),U.get(e.texture).__webglTexture=t,U.get(e.depthTexture).__webglTexture=r.__autoAllocateDepthBuffer?void 0:n,r.__hasExternalTextures=!0},this.setRenderTargetFramebuffer=function(e,t){let n=U.get(e);n.__webglFramebuffer=t,n.__useDefaultFramebuffer=t===void 0},this.setRenderTarget=function(e,t=0,n=0){I=e,ie=t,ae=n;let r=null,i=!1,a=!1;if(e){let o=U.get(e);if(o.__useDefaultFramebuffer!==void 0){H.bindFramebuffer(B.FRAMEBUFFER,o.__webglFramebuffer),L.copy(e.viewport),le.copy(e.scissor),pe=e.scissorTest,H.viewport(L),H.scissor(le),H.setScissorTest(pe),se=-1;return}if(o.__webglFramebuffer===void 0)W.setupRenderTarget(e);else if(o.__hasExternalTextures)W.rebindTextures(e,U.get(e.texture).__webglTexture,U.get(e.depthTexture).__webglTexture);else if(e.depthBuffer){let t=e.depthTexture;if(o.__boundDepthTexture!==t){if(t!==null&&U.has(t)&&(e.width!==t.image.width||e.height!==t.image.height))throw Error(`THREE.WebGLRenderer: Attached DepthTexture is initialized to the incorrect size.`);W.setupDepthRenderbuffer(e)}}let s=e.texture;(s.isData3DTexture||s.isDataArrayTexture||s.isCompressedArrayTexture)&&(a=!0);let c=U.get(e).__webglFramebuffer;e.isWebGLCubeRenderTarget?(r=Array.isArray(c[t])?c[t][n]:c[t],i=!0):r=e.samples>0&&W.useMultisampledRTT(e)===!1?U.get(e).__webglMultisampledFramebuffer:Array.isArray(c)?c[n]:c,L.copy(e.viewport),le.copy(e.scissor),pe=e.scissorTest}else L.copy(Te).multiplyScalar(xe).floor(),le.copy(z).multiplyScalar(xe).floor(),pe=Ee;if(n!==0&&(r=ne),H.bindFramebuffer(B.FRAMEBUFFER,r)&&H.drawBuffers(e,r),H.viewport(L),H.scissor(le),H.setScissorTest(pe),i){let r=U.get(e.texture);B.framebufferTexture2D(B.FRAMEBUFFER,B.COLOR_ATTACHMENT0,B.TEXTURE_CUBE_MAP_POSITIVE_X+t,r.__webglTexture,n)}else if(a){let r=t;for(let t=0;t<e.textures.length;t++){let i=U.get(e.textures[t]);B.framebufferTextureLayer(B.FRAMEBUFFER,B.COLOR_ATTACHMENT0+t,i.__webglTexture,n,r)}}else if(e!==null&&n!==0){let t=U.get(e.texture);B.framebufferTexture2D(B.FRAMEBUFFER,B.COLOR_ATTACHMENT0,B.TEXTURE_2D,t.__webglTexture,n)}se=-1};function It(e){let t=U.get(e);return(t.__readFormat!==e.format||t.__readType!==e.type)&&(t.__readFormat=e.format,t.__readType=e.type,t.__formatReadable=Ke.textureFormatReadable(e.format),t.__typeReadable=Ke.textureTypeReadable(e.type)),t}this.readRenderTargetPixels=function(e,t,n,r,i,a,s,c=0){if(!(e&&e.isWebGLRenderTarget)){o(`WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.`);return}let l=U.get(e).__webglFramebuffer;if(e.isWebGLCubeRenderTarget&&s!==void 0&&(l=l[s],Array.isArray(l)&&(l=l[0])),l){H.bindFramebuffer(B.FRAMEBUFFER,l);try{let s=e.textures[c],l=s.format,u=s.type;e.textures.length>1&&B.readBuffer(B.COLOR_ATTACHMENT0+c);let d=It(s);if(d.__formatReadable===!1){o(`WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.`);return}if(d.__typeReadable===!1){o(`WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.`);return}t>=0&&t<=e.width-r&&n>=0&&n<=e.height-i&&B.readPixels(t,n,r,i,ct.convert(l),ct.convert(u),a)}finally{let e=I===null?null:U.get(I).__webglFramebuffer;H.bindFramebuffer(B.FRAMEBUFFER,e)}}},this.readRenderTargetPixelsAsync=async function(e,t,n,r,i,a,o,s=0){if(!(e&&e.isWebGLRenderTarget))throw Error(`THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.`);let c=U.get(e).__webglFramebuffer;if(e.isWebGLCubeRenderTarget&&o!==void 0&&(c=c[o],Array.isArray(c)&&(c=c[0])),c){if(t>=0&&t<=e.width-r&&n>=0&&n<=e.height-i){H.bindFramebuffer(B.FRAMEBUFFER,c);let o=e.textures[s],l=o.format,u=o.type;e.textures.length>1&&B.readBuffer(B.COLOR_ATTACHMENT0+s);let d=It(o);if(d.__formatReadable===!1)throw Error(`THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in RGBA or implementation defined format.`);if(d.__typeReadable===!1)throw Error(`THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in UnsignedByteType or implementation defined type.`);let f=B.createBuffer();B.bindBuffer(B.PIXEL_PACK_BUFFER,f),B.bufferData(B.PIXEL_PACK_BUFFER,a.byteLength,B.STREAM_READ),B.readPixels(t,n,r,i,ct.convert(l),ct.convert(u),0),B.bindBuffer(B.PIXEL_PACK_BUFFER,null);let p=I===null?null:U.get(I).__webglFramebuffer;H.bindFramebuffer(B.FRAMEBUFFER,p);let m=B.fenceSync(B.SYNC_GPU_COMMANDS_COMPLETE,0);return B.flush(),await Se(B,m,4),B.bindBuffer(B.PIXEL_PACK_BUFFER,f),B.getBufferSubData(B.PIXEL_PACK_BUFFER,0,a),B.bindBuffer(B.PIXEL_PACK_BUFFER,null),B.deleteBuffer(f),B.deleteSync(m),a}throw Error(`THREE.WebGLRenderer.readRenderTargetPixelsAsync: requested read bounds are out of range.`)}},this.copyFramebufferToTexture=function(e,t=null,n=0){let r=2**-n,i=Math.floor(e.image.width*r),a=Math.floor(e.image.height*r),o=t===null?0:t.x,s=t===null?0:t.y;W.setTexture2D(e,0),B.copyTexSubImage2D(B.TEXTURE_2D,n,0,0,o,s,i,a),H.unbindTexture()},this.copyTextureToTexture=function(e,t,n=null,r=null,i=0,a=0){let o,s,c,l,u,d,f,p,m,h=e.isCompressedTexture?e.mipmaps[a]:e.image;if(n!==null)o=n.max.x-n.min.x,s=n.max.y-n.min.y,c=n.isBox3?n.max.z-n.min.z:1,l=n.min.x,u=n.min.y,d=n.isBox3?n.min.z:0;else{let t=2**-i;o=Math.floor(h.width*t),s=Math.floor(h.height*t),c=e.isDataArrayTexture?h.depth:e.isData3DTexture?Math.floor(h.depth*t):1,l=0,u=0,d=0}r===null?(f=0,p=0,m=0):(f=r.x,p=r.y,m=r.z);let g=ct.convert(t.format),_=ct.convert(t.type),v;t.isData3DTexture?(W.setTexture3D(t,0),v=B.TEXTURE_3D):t.isDataArrayTexture||t.isCompressedArrayTexture?(W.setTexture2DArray(t,0),v=B.TEXTURE_2D_ARRAY):(W.setTexture2D(t,0),v=B.TEXTURE_2D),H.activeTexture(B.TEXTURE0),H.pixelStorei(B.UNPACK_FLIP_Y_WEBGL,t.flipY),H.pixelStorei(B.UNPACK_PREMULTIPLY_ALPHA_WEBGL,t.premultiplyAlpha),H.pixelStorei(B.UNPACK_ALIGNMENT,t.unpackAlignment);let y=H.getParameter(B.UNPACK_ROW_LENGTH),b=H.getParameter(B.UNPACK_IMAGE_HEIGHT),x=H.getParameter(B.UNPACK_SKIP_PIXELS),S=H.getParameter(B.UNPACK_SKIP_ROWS),C=H.getParameter(B.UNPACK_SKIP_IMAGES);H.pixelStorei(B.UNPACK_ROW_LENGTH,h.width),H.pixelStorei(B.UNPACK_IMAGE_HEIGHT,h.height),H.pixelStorei(B.UNPACK_SKIP_PIXELS,l),H.pixelStorei(B.UNPACK_SKIP_ROWS,u),H.pixelStorei(B.UNPACK_SKIP_IMAGES,d);let w=e.isDataArrayTexture||e.isData3DTexture,T=t.isDataArrayTexture||t.isData3DTexture;if(e.isDepthTexture){let n=U.get(e),r=U.get(t),h=U.get(n.__renderTarget),g=U.get(r.__renderTarget);H.bindFramebuffer(B.READ_FRAMEBUFFER,h.__webglFramebuffer),H.bindFramebuffer(B.DRAW_FRAMEBUFFER,g.__webglFramebuffer);for(let n=0;n<c;n++)w&&(B.framebufferTextureLayer(B.READ_FRAMEBUFFER,B.COLOR_ATTACHMENT0,U.get(e).__webglTexture,i,d+n),B.framebufferTextureLayer(B.DRAW_FRAMEBUFFER,B.COLOR_ATTACHMENT0,U.get(t).__webglTexture,a,m+n)),B.blitFramebuffer(l,u,l+o,u+s,f,p,f+o,p+s,B.DEPTH_BUFFER_BIT,B.NEAREST);H.bindFramebuffer(B.READ_FRAMEBUFFER,null),H.bindFramebuffer(B.DRAW_FRAMEBUFFER,null)}else if(i!==0||e.isRenderTargetTexture||U.has(e)){let n=U.get(e),r=U.get(t);H.bindFramebuffer(B.READ_FRAMEBUFFER,F),H.bindFramebuffer(B.DRAW_FRAMEBUFFER,re);for(let e=0;e<c;e++)w?B.framebufferTextureLayer(B.READ_FRAMEBUFFER,B.COLOR_ATTACHMENT0,n.__webglTexture,i,d+e):B.framebufferTexture2D(B.READ_FRAMEBUFFER,B.COLOR_ATTACHMENT0,B.TEXTURE_2D,n.__webglTexture,i),T?B.framebufferTextureLayer(B.DRAW_FRAMEBUFFER,B.COLOR_ATTACHMENT0,r.__webglTexture,a,m+e):B.framebufferTexture2D(B.DRAW_FRAMEBUFFER,B.COLOR_ATTACHMENT0,B.TEXTURE_2D,r.__webglTexture,a),i===0?T?B.copyTexSubImage3D(v,a,f,p,m+e,l,u,o,s):B.copyTexSubImage2D(v,a,f,p,l,u,o,s):B.blitFramebuffer(l,u,l+o,u+s,f,p,f+o,p+s,B.COLOR_BUFFER_BIT,B.NEAREST);H.bindFramebuffer(B.READ_FRAMEBUFFER,null),H.bindFramebuffer(B.DRAW_FRAMEBUFFER,null)}else T?e.isDataTexture||e.isData3DTexture?B.texSubImage3D(v,a,f,p,m,o,s,c,g,_,h.data):t.isCompressedArrayTexture?B.compressedTexSubImage3D(v,a,f,p,m,o,s,c,g,h.data):B.texSubImage3D(v,a,f,p,m,o,s,c,g,_,h):e.isDataTexture?B.texSubImage2D(B.TEXTURE_2D,a,f,p,o,s,g,_,h.data):e.isCompressedTexture?B.compressedTexSubImage2D(B.TEXTURE_2D,a,f,p,h.width,h.height,g,h.data):B.texSubImage2D(B.TEXTURE_2D,a,f,p,o,s,g,_,h);H.pixelStorei(B.UNPACK_ROW_LENGTH,y),H.pixelStorei(B.UNPACK_IMAGE_HEIGHT,b),H.pixelStorei(B.UNPACK_SKIP_PIXELS,x),H.pixelStorei(B.UNPACK_SKIP_ROWS,S),H.pixelStorei(B.UNPACK_SKIP_IMAGES,C),a===0&&t.generateMipmaps===!0&&t.mipmapsAutoUpdate===!0&&B.generateMipmap(v),H.unbindTexture()},this.initRenderTarget=function(e){U.get(e).__webglFramebuffer===void 0&&W.setupRenderTarget(e)},this.initTexture=function(e){e.isCubeTexture?W.setTextureCube(e,0):e.isData3DTexture?W.setTexture3D(e,0):e.isDataArrayTexture||e.isCompressedArrayTexture?W.setTexture2DArray(e,0):W.setTexture2D(e,0),H.unbindTexture()},this.resetState=function(){ie=0,ae=0,I=null,H.reset(),lt.reset()},typeof __THREE_DEVTOOLS__<`u`&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent(`observe`,{detail:this}))}get coordinateSystem(){return oe}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(e){this._outputColorSpace=e;let t=this.getContext();t.drawingBufferColorSpace=de._getDrawingBufferColorSpace(e),t.unpackColorSpace=de._getUnpackColorSpace()}};function da(){return{uTime:{value:0},uBend:{value:0},uBendCenter:{value:new R},uSkyLift:{value:0},uAlive:{value:0},uHillReveal:{value:0},uFogColor:{value:new Le(.034,.06,.17)},uFogRange:{value:new Te(170,dt.hillRadius-8)},uMoonDir:{value:new R(.4,.5,-.76).normalize()},uMoonCol:{value:new Le(.34,.5,.95)},uAmbSky:{value:new Le(.06,.12,.36)},uAmbGround:{value:new Le(.05,.045,.11)},uWarmCol:{value:new Le(1,.56,.16)},uHeadPos:{value:new R(0,-999,0)},uHeadDir:{value:new R(0,0,-1)},uHeadPower:{value:0},uStrokeDist:{value:7},tCanvas:{value:null},uPixel:{value:.001},uGlow:{value:1},uHis:{value:lt}}}var fa=`
float hash11(float p) {
  p = fract(p * 0.1031);
  p *= p + 33.33;
  p *= p + p;
  return fract(p);
}
float hash21(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}
float hash31(vec3 p3) {
  p3 = fract(p3 * 0.1031);
  p3 += dot(p3, p3.zyx + 31.32);
  return fract((p3.x + p3.y) * p3.z);
}
vec2 hash22(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973));
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.xx + p3.yz) * p3.zy);
}
float vnoise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash21(i), hash21(i + vec2(1.0, 0.0)), f.x),
             mix(hash21(i + vec2(0.0, 1.0)), hash21(i + vec2(1.0, 1.0)), f.x), f.y);
}
float vnoise3(vec3 p) {
  vec3 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = mix(hash31(i), hash31(i + vec3(1.0, 0.0, 0.0)), f.x);
  float b = mix(hash31(i + vec3(0.0, 1.0, 0.0)), hash31(i + vec3(1.0, 1.0, 0.0)), f.x);
  float c = mix(hash31(i + vec3(0.0, 0.0, 1.0)), hash31(i + vec3(1.0, 0.0, 1.0)), f.x);
  float d = mix(hash31(i + vec3(0.0, 1.0, 1.0)), hash31(i + vec3(1.0, 1.0, 1.0)), f.x);
  return mix(mix(a, b, f.y), mix(c, d, f.y), f.z);
}
`,pa=`
struct Dab {
  float id;      // random 0..1 per stroke
  float id2;     // second random per stroke
  float mask;    // 1 inside the stroke, 0 in the gap between strokes
  float across;  // -1..1 across the stroke width
  float along;   // 0..1 along the stroke
  vec2 center;   // stroke centre in p-space
};

Dab dab(vec2 p, vec2 size, float seed) {
  vec2 q = p / size;
  float row = floor(q.y);
  float ro = hash11(row * 1.37 + seed * 17.0) * 19.0;
  float x = q.x + ro;
  float col = floor(x);
  vec2 f = vec2(x - col, q.y - row);
  vec2 cid = vec2(col, row);
  Dab d;
  d.id = hash21(cid + seed * 7.13);
  d.id2 = hash21(cid * 1.7 + 3.1 + seed * 3.7);
  float len = mix(0.66, 1.0, d.id2);
  float ax = abs(f.x - 0.5) * 2.0 / len;
  float ay = abs(f.y - 0.5) * 2.0;
  // a loaded brush: full in the middle, tapering as it lifts off
  float taper = 1.0 - 0.42 * smoothstep(0.25, 1.0, ax);
  d.mask = smoothstep(1.0, 0.74, ax) * smoothstep(taper, taper - 0.40, ay);
  d.across = (f.y - 0.5) * 2.0;
  d.along = f.x;
  d.center = vec2((col + 0.5 - ro) * size.x, (row + 0.5) * size.y);
  return d;
}

// Rotate a colour's hue around the grey axis (cheap, good enough for jitter).
vec3 hueShift(vec3 c, float a) {
  const vec3 k = vec3(0.57735);
  float ca = cos(a), sa = sin(a);
  return c * ca + cross(k, c) * sa + k * dot(k, c) * (1.0 - ca);
}
float luma(vec3 c) { return dot(c, vec3(0.2126, 0.7152, 0.0722)); }
vec3 saturate3(vec3 c, float s) { float l = luma(c); return max(vec3(0.0), mix(vec3(l), c, s)); }
`,ma=0,ha=1,ga=2,_a=3,va=4,ya=5,ba=56,xa=[[1362,212,176,ga,1,1],[532,626,100,ha,1,-1],[150,52,62,ma,.95,1],[346,40,36,ya,.85,-1],[516,46,50,ma,.9,1],[617,75,36,ya,.85,-1],[355,207,55,ma,.95,1],[912,97,62,ma,.9,-1],[1055,266,58,ma,.95,1],[489,386,40,ya,.8,-1],[68,536,34,ha,.7,1],[196,566,45,ma,.85,-1],[795,432,190,_a,1,-1],[1035,560,96,va,.9,1]];function Sa(e,t,n=new R){let r=(2*e-1)*qt.tanH,i=(2*t-1)*qt.tanV,a=Math.cos(qt.pitch),o=Math.sin(qt.pitch);return n.set(r,i*a+o,i*o-a).normalize()}function Ca(){let e=[];for(let[t,n,r,i,a,o]of xa){let s=t/qt.width,c=1-n/qt.height,l=Sa(s,c),u=l.angleTo(Sa(s+r/qt.width,c));e.push({dir:l,R:u,type:i,bright:a,spin:o})}let t=Nt(1889),n=(t,n)=>e.some(e=>e.dir.angleTo(t)<(e.R+n)*1.05+.02),r=(r,i,a,o,s,c=-Math.PI,l=Math.PI)=>{for(let u=0;u<400;u++){let u=c+(l-c)*t(),d=Math.asin(Math.sin(o)+(Math.sin(s)-Math.sin(o))*t());if(Math.abs(u)<42*Ct&&d<46*Ct)continue;let f=new R(Math.sin(u)*Math.cos(d),Math.sin(d),-Math.cos(u)*Math.cos(d));if(!n(f,r))return e.push({dir:f,R:r,type:i,bright:a}),!0}return!1};r(.15,va,1,16*Ct,30*Ct,150*Ct,210*Ct),r(.125,_a,1,14*Ct,28*Ct,70*Ct,110*Ct),r(.125,va,1,14*Ct,28*Ct,-110*Ct,-70*Ct),r(.11,_a,.9,50*Ct,66*Ct),r(.085,va,.9,30*Ct,50*Ct,110*Ct,160*Ct),r(.085,_a,.9,30*Ct,50*Ct,-160*Ct,-110*Ct);let i=0;for(;e.length<ba&&i++<200;){let e=t(),n=e<.55?ma:e<.8?ha:ya;r(.03+.034*t()*t()+(t()<.12?.02:0),n,.7+.3*t(),7*Ct,80*Ct)}return e}var wa=`
uniform mat4 uInvProj;
uniform mat4 uCamWorld;
varying vec3 vDir;
void main() {
  gl_Position = vec4(position.xy, 1.0, 1.0);
  vec4 v = uInvProj * vec4(position.xy, 1.0, 1.0);
  vDir = mat3(uCamWorld) * (v.xyz / v.w);
}
`,Ta=`
precision highp float;
#define NS ${ba}
#define NPAINTED ${xa.length}
uniform float uTime;
uniform float uStarGain;
uniform float uFlow;
uniform float uLift;
uniform int uStarCount;
uniform vec4 uStarA[NS];   // xyz direction, w angular radius
uniform vec4 uStarB[NS];   // type, seed, brightness, spin
uniform vec4 uStarC[NS];   // cos(3.05 R)
uniform sampler2D tPainting;   // the scan with the cypress painted out (raw sRGB)
uniform sampler2D tFlow;       // stroke direction (double angle) + coherence
uniform sampler2D tFill;       // the sky with the cypress painted out, blurred: colour for stand-in strokes
uniform vec2 uPaintCS;         // cos / sin of the viewpoint pitch
uniform vec2 uPaintTan;        // tan of half the canvas field, x / y
uniform float uPatch;          // 1 when the scan is loaded
uniform float uAlive;          // 0 = the still canvas, 1 = flowing, burning sky
uniform float uHis;            // how far it keeps to the canvas's own colours as it wakes: palette.js
uniform float uPaintExposure;
uniform float uScan;           // how much of the scan itself shows in the middle of the canvas' part of the sky (0 = none: painted like the rest)
varying vec3 vDir;

${fa}

const float PI = 3.14159265;
const float TAU = 6.28318531;
const float ASPECT = ${qt.aspect.toFixed(6)};

vec3 srgb2lin(vec3 c) {
  return mix(c / 12.92, pow((c + 0.055) / 1.055, vec3(2.4)), step(vec3(0.04045), c));
}

// Colours measured on the scan itself (linear RGB), dark stroke → pale stroke.
// Everything procedural is painted in the canvas' own palette and then goes
// through the same "come alive" grade as the canvas.
vec3 blueRamp(float v) {
  // (the blues of the scan's sky, by brightness: its darkest twelfth, then its next fifth, third, quarter and
  // palest sixth. His darks keep their blue; his pales lose it.)
  const vec3 c0 = vec3(0.015, 0.026, 0.116);
  const vec3 c1 = vec3(0.033, 0.065, 0.213);
  const vec3 c2 = vec3(0.067, 0.130, 0.288);
  const vec3 c3 = vec3(0.112, 0.200, 0.347);
  const vec3 c4 = vec3(0.203, 0.300, 0.413);
  v = clamp(v, 0.0, 1.0) * 4.0;
  if (v < 1.0) return mix(c0, c1, v);
  if (v < 2.0) return mix(c1, c2, v - 1.0);
  if (v < 3.0) return mix(c2, c3, v - 2.0);
  return mix(c3, c4, v - 3.0);
}

// How one of his strokes stands to the colour of the canvas round it: t = 0 his darkest … 1 his palest,
// as a factor on the mean (the same five bands, each divided by the mean of them all — so that strokes
// toned this way are, taken together, the colour they started from). A stroke merely turned up or down
// in brightness is not one of his: pale, it is electric where his are milky; dark, it is black where
// his are ultramarine.
vec3 strokeTone(float t) {
  const vec3 d0 = vec3(0.172, 0.173, 0.399), d1 = vec3(0.380, 0.432, 0.732), m0 = vec3(0.770, 0.864, 0.989), l1 = vec3(1.287, 1.328, 1.192), l2 = vec3(2.333, 1.995, 1.418);
  if (t < 0.04) return d0;
  if (t < 0.19) return mix(d0, d1, (t - 0.04) / 0.15);
  if (t < 0.45) return mix(d1, m0, (t - 0.19) / 0.26);
  if (t < 0.725) return mix(m0, l1, (t - 0.45) / 0.275);
  return mix(l1, l2, min((t - 0.725) / 0.2, 1.0));
}

vec3 haloRamp(float t, float type) {
  vec3 core, c1, c2, c3;
  if (type < 0.5)      { core = vec3(0.66, 0.50, 0.060); c1 = vec3(0.50, 0.44, 0.100); c2 = vec3(0.36, 0.42, 0.270); c3 = vec3(0.24, 0.33, 0.430); }
  else if (type < 1.5) { core = vec3(0.64, 0.56, 0.130); c1 = vec3(0.56, 0.60, 0.520); c2 = vec3(0.40, 0.46, 0.420); c3 = vec3(0.22, 0.30, 0.380); }
  else if (type < 2.5) { core = vec3(0.74, 0.42, 0.016); c1 = vec3(0.56, 0.56, 0.230); c2 = vec3(0.36, 0.46, 0.330); c3 = vec3(0.16, 0.26, 0.370); }
  else                 { core = vec3(0.66, 0.34, 0.030); c1 = vec3(0.46, 0.40, 0.110); c2 = vec3(0.30, 0.38, 0.300); c3 = vec3(0.20, 0.28, 0.400); }
  float u = clamp(t, 0.0, 1.0) * 3.0;
  if (u < 1.0) return mix(core, c1, u);
  if (u < 2.0) return mix(c1, c2, u - 1.0);
  return mix(c2, c3, u - 2.0);
}

// The moment the painting comes alive: blues deepen and every yellow burns.
vec3 comeAlive(vec3 lin, float flick) {
  vec3 e = sqrt(max(lin, vec3(0.0)));
  float yel = clamp((e.r + e.g) * 0.5 - e.b, 0.0, 1.0);
  float hot = smoothstep(0.16, 0.50, yel) * smoothstep(0.34, 0.66, e.r) * (0.55 + 1.8 * clamp(e.r - e.g, 0.0, 0.25));
  float l = dot(lin, vec3(0.2126, 0.7152, 0.0722));
  // blues deepen; yellows keep their pallor so the crescent still reads against its halo
  vec3 c = max(vec3(0.0), mix(vec3(l), lin, 1.0 + mix(0.45, 0.08, uHis) * uAlive * (1.0 - 0.85 * smoothstep(0.04, 0.26, yel))));
  return c * (1.0 + uAlive * uStarGain * 2.0 * hot * flick);
}

// One brush stroke of wind. Two interleaved layers of these are laid over one
// another so the sky reads as overlapping wet paint, not as tidy brickwork.
struct Stroke { vec3 col; float fx; float fy; float id; float lenv; float solid; };

// Where on the canvas the direction being shaded falls; how much a stroke there takes the canvas' own colour
// (1 on the canvas, falling away beside it); and how far outside the canvas it is, in canvas widths.
vec2 gUv = vec2(0.5);
float gIn = 0.0;
float gFar = 0.0;

Stroke windStroke(float psi, float az, float lumBase, float band, float layer, vec3 fillCol, float fillW) {
  float W = mix(0.0058, 0.0074, layer);      // (a fifth finer than they were: nearer the canvas' own, and they sit beside it better)
  float L = mix(0.058, 0.045, layer);      // (a fifth shorter than they were, like the width: nearer his)
  float rowf = psi / W + layer * 0.37;
  float row = floor(rowf);
  Stroke s;
  s.fy = rowf - row;
  float elRow = clamp((row + 0.5) * W, 0.0, 1.45);
  float nDash = max(6.0, floor(TAU * cos(elRow) / L));
  float rh = hash11(row * 3.71 + 11.0 + layer * 57.0);
  float xx = (az / TAU + 0.5) * nDash + rh * 37.0
           - uTime * uFlow * (0.4 + 0.9 * hash11(row + 5.5 + layer * 13.0));
  float colI = floor(xx);
  s.fx = xx - colI;
  float idx = mod(colI, nDash);
  s.id = hash21(vec2(idx, row + layer * 211.0));
  float id2 = hash21(vec2(idx + 17.0, row * 1.3 + 3.0 + layer * 97.0));
  float streak = hash11(row * 0.731 + 2.0 + layer * 5.0);
  float lum = lumBase + 0.22 * (streak - 0.5) + 0.26 * (s.id - 0.5);
  vec3 c = blueRamp(lum);
  if (id2 > 0.86) c = mix(c, vec3(0.126, 0.191, 0.255), 0.7);          // grey-teal
  if (id2 < 0.06) c = mix(c, vec3(0.060, 0.050, 0.200), 0.5);          // violet shadow
  c = mix(c, vec3(0.433, 0.490, 0.396), band * smoothstep(0.50, 0.95, id2 * 0.7 + s.id * 0.5) * 0.9);
  // near the canvas, take the canvas' own colour and just break it into strokes
  // (…toned as his are; and as bright, taken together, as the canvas they stand in for — the 1.07 is measured,
  // strokes alone against canvas alone in the margin where the one thins into the other: darker, they made a
  // dark border round the canvas)
  vec3 tone = strokeTone(clamp(s.id + 0.3 * (streak - 0.5), 0.0, 1.0));
  vec3 f = fillCol * tone * 1.03;
  // On the canvas itself a stroke is the colour of the canvas under its middle: the picture, painted
  // again in the hand of the rest of the sky. (The scan shown as it is — however its edge was softened,
  // however the sky round it was tuned to it — stayed a photograph of one painting let into another.)
  // Beside the canvas it is the colour of the canvas' edge at that place, carried on outward — read ever more
  // broadly, and toned ever more freely, with distance. (Past the edge the strokes used to take a ready-blurred
  // copy of the canvas instead: greyer, and the change of colour drew the edge.)
  if (gIn > 0.0) {
    vec2 mid = gUv - vec2((s.fx - 0.5) * TAU / nDash * cos(elRow) / (2.0 * uPaintTan.x), (s.fy - 0.5) * W / (2.0 * uPaintTan.y)) * (1.0 + pow((clamp(gUv, 0.0, 1.0) * 2.0 - 1.0) * uPaintTan, vec2(2.0)));
    vec3 own = srgb2lin(textureLod(tPainting, clamp(mid, 0.012, 0.988), 3.5 + 4.0 * smoothstep(0.0, 0.16, gFar)).rgb) * mix(vec3(1.0), tone, mix(0.3, 1.0, smoothstep(0.0, 0.15, gFar))) * 1.02;
    f = mix(f, own, gIn);
  }
  s.col = mix(c, f, fillW);
  s.lenv = mix(0.66, 1.0, id2);
  s.solid = 0.0;
  return s;
}

// Shade a stroke: bristle streaks, a lit upper edge (impasto), tapered ends.
vec4 lay(Stroke s, float solid) {
  float ax = abs(s.fx - 0.5) * 2.0 / s.lenv;
  float ay = abs(s.fy - 0.5) * 2.0;
  float taper = 1.0 - 0.38 * smoothstep(0.25, 1.0, ax);
  // (crisp-edged: soft-edged they looked out of focus beside the canvas)
  float mask = max(solid, smoothstep(1.0, 0.86, ax) * smoothstep(taper, taper - 0.20, ay));
  float bristle = vnoise(vec2(s.fx * 2.2 + s.id * 31.0, s.fy * 7.0 + s.id * 17.0));
  vec3 c = s.col * mix(0.84 + 0.30 * bristle, 1.0, s.solid);
  c *= 1.0 + 0.22 * (s.fy - 0.5) * 2.0 * (1.0 - solid);
  return vec4(c, mask);
}

void main() {
  vec3 d0 = normalize(vDir);
  float az = atan(d0.x, -d0.z);
  // When the town folds up into a bowl the horizon rises; the whole sky is
  // lifted with it so the low stars and the great curl are never swallowed.
  float el = (asin(clamp(d0.y, -1.0, 1.0)) - uLift) / (1.0 - uLift / 1.5708);
  el = max(el, -1.4);
  vec3 d = vec3(sin(az) * cos(el), sin(el), -cos(az) * cos(el));

  // Stream function: its level sets are the lines the wind is painted along.
  float psi = el
    + 0.045 * sin(az * 4.0 + el * 5.0 + 0.7)
    + 0.024 * sin(az * 9.0 - el * 9.0 + 2.1)
    + 0.011 * sin(az * 17.0 + el * 13.0 + uTime * 0.05);      // (half as much roll again: his sky is never level)

  int best = -1;
  float bestK = 1.2;
  vec2 bxy = vec2(0.0);
  vec2 va = vec2(0.0);     // which way the paint travels (wind + vortices)
  float vw = 0.0;
  for (int i = 0; i < NS; i++) {
    if (i >= uStarCount) break;
    vec4 A = uStarA[i];
    float c = dot(d, A.xyz);
    if (c < uStarC[i].x) continue;
    vec3 e = normalize(cross(A.xyz, vec3(0.0, 1.0, 0.0)));
    vec3 n = cross(e, A.xyz);
    vec2 xy = vec2(dot(d, e), dot(d, n));
    float r = length(xy);
    float R = A.w;
    // the wind parts around every star like water round a stone
    float a = R * 0.80;
    float fall = 1.0 - smoothstep(R * 1.9, R * 3.0, r);
    psi -= xy.y * a * a / max(r * r, a * a * 0.45) * fall;
    float k = r / R;
    if (k < bestK) { bestK = k; best = i; bxy = xy; }
    float wv = 1.0 - smoothstep(R * 1.05, R * 2.1, r);
    va += wv * uStarB[i].w * vec2(-xy.y, xy.x) / max(r, R * 0.15);
    vw += wv;
  }
  va += vec2(1.0, 0.12) * max(0.0, 1.0 - vw);

  // where this direction falls on the canvas (it is the centre of the sky)
  float zc = d.y * uPaintCS.y - d.z * uPaintCS.x;
  vec2 cuv = vec2(-9.0);
  float fillW = 0.0;
  vec3 fillCol = vec3(0.0);
  if (uPatch > 0.5 && zc > 0.05) {
    cuv = vec2(d.x, d.y * uPaintCS.x + d.z * uPaintCS.y) / zc / uPaintTan * 0.5 + 0.5;
    // distance outside the canvas (the painted part of it: the scan's last hundredth is trimmed), in canvas widths
    const vec2 lo0 = vec2(0.010, 0.008), hi0 = vec2(0.990, 0.992);
    vec2 o = max(max(lo0 - cuv, cuv - hi0), 0.0) * vec2(1.0, 1.0 / ASPECT);
    // (a wide hand-over: within a tenth of a canvas-width the palette changing read as an edge)
    float od = length(o);
    gFar = od;
    gIn = 1.0 - smoothstep(0.0, 0.30, od);
    fillW = 1.0 - smoothstep(0.0, 0.42, od);
    fillW *= fillW;
    if (fillW > 0.0) {
      // (the fill has a grey stripe 1.2-1.8% in from each side, left by its blur: sampled there it drew a pale
      // bar down the edge of the canvas)
      vec2 lo = vec2(0.032, 0.014), hi = vec2(0.968, 0.986);
      // (This ready-blurred copy now only colours the strokes well away from the canvas: held outward from the
      // edge and quickly blurred. Mirrored, every star near the frame had a yellow ghost of itself beyond it.)
      fillCol = srgb2lin(textureLod(tFill, clamp(cuv, lo, hi), 5.0 * smoothstep(0.0, 0.035, od)).rgb);
    }
  }

  // (taken here, outside any branch, so the scan is filtered correctly everywhere)
  vec2 cgx = dFdx(cuv), cgy = dFdy(cuv);

  // deep inside the canvas the scan is all there is: skip the strokes
  bool inCanvas = cuv.x > 0.0 && cuv.x < 1.0 && cuv.y > 0.0 && cuv.y < 1.0;
  float edge = inCanvas ? min(min(cuv.x - 0.010, 0.990 - cuv.x), (0.992 - cuv.y) / ASPECT) : -1.0;
  // How much of the scan itself shows here. The canvas' part of the sky is painted twice over: in the hand
  // of the rest of the sky (each stroke the colour of the canvas under it), and, over that, the scan — most
  // of all in the middle, thinning to nothing over a wide margin of uneven depth. So there is his own paint
  // to look at, and no place where it stops. (The scan alone, to its edge: a picture let into another. The
  // strokes alone: too far toward the plain sky, and none of his paint left.)
  float wScan = inCanvas ? uScan * smoothstep(0.0, 0.05 + 0.11 * vnoise3(d * 6.0 + 2.0), edge) : 0.0;
  bool needStrokes = wScan < 0.999;
  float starReal = 0.0, starFoot = 0.0;      // a star of the canvas' own: is it the painted one that shows (decided at its middle, for all of it), and are we on it
  gUv = cuv;
  vec3 col = vec3(0.0);
  if (needStrokes) {
  // ---------------------------------------------------------------- wind
  float big = vnoise3(d * 1.7 + 4.0);
  float band = exp(-pow((el - 0.115) / 0.085, 2.0)) * (0.40 + 0.60 * vnoise3(d * 1.9 + 9.0)) * (1.0 - fillW);
  float lumBase = 0.46 - 0.08 * smoothstep(0.15, 1.2, el) + 0.46 * (big - 0.5) + band * 0.30;
  Stroke sa = windStroke(psi, az, lumBase, band, 0.0, fillCol, fillW);
  Stroke sb = windStroke(psi, az, lumBase, band, 1.0, fillCol, fillW);
  vec4 la = lay(sa, sa.solid);
  vec4 lb = lay(sb, sb.solid);
  // The ground that shows between strokes: dark, out in the plain sky; on the canvas and beside it nearly the
  // strokes' own colour. (Dark there, every stroke had a hard dark edge and his paint has none: where the
  // two met, the edges were what showed.)
  float soft = max(gIn, fillW);
  col = mix(mix(vec3(0.010, 0.017, 0.052), sa.col * 0.55, 0.6), sa.col * 0.90, soft);
  col = mix(col, la.rgb, la.a);
  col = mix(col, lb.rgb, lb.a * step(0.46, sb.id));

  bool take = false;
  float fx = 0.5, fy = 0.5, sid = 0.0, lenv = 1.0, gain = 1.0, solid = 0.0;
  vec3 strokeCol = vec3(0.0);

  // ------------------------------------------------------- stars, moon, curls
  if (best >= 0) {
    vec4 A = uStarA[best];
    vec4 B = uStarB[best];
    float R = A.w, type = B.x, seed = B.y, bright = B.z, spin = B.w;
    float r = length(bxy);
    if (type > 2.5 && type < 4.5) {
      // Archimedean spiral of six interleaved bands: dark trough … pale crest.
      float hand = type < 3.5 ? 1.0 : -1.0;
      const float M = 6.0;
      float w = R * 0.60;
      float thp = mod(hand * atan(bxy.y, bxy.x) + PI + uTime * 0.045 * spin, TAU);
      float um = M * (r / w - thp / TAU);
      float srow = floor(um);
      float sfy = um - srow;
      float j = mod(srow, M);
      float turn = floor(srow / M);
      float rc = r - (sfy - 0.5) * w / M;
      float Th = thp + TAU * turn;
      float s = w * Th * Th / (2.0 * TAU) + (j + 0.5) * (w / M) * Th;
      float sx = s / 0.058 + hash11(j * 5.0 + seed * 3.0) * 7.0 - uTime * uFlow * 1.6;
      float sc = floor(sx);
      float fid = hash21(vec2(sc, j * 7.0) + seed * 5.0);
      float fid2 = hash21(vec2(sc + 9.0, j * 3.0) + seed * 2.0);
      if (rc < R * (0.72 + 0.42 * fid) && rc > 0.0) {
        take = true;
        fx = sx - sc; fy = sfy; sid = fid; lenv = mix(0.7, 1.0, fid2);
        float crest = j < 0.5 ? 0.16 : j < 1.5 ? 0.36 : j < 2.5 ? 0.62 : j < 3.5 ? 1.0 : j < 4.5 ? 0.70 : 0.30;
        float inner = 1.0 - smoothstep(0.0, 1.0, rc / R);
        float v = crest * 0.78 + inner * 0.20 + 0.20 * (fid - 0.5);
        strokeCol = blueRamp(v);
        if (j > 2.5 && j < 3.5) strokeCol = mix(strokeCol, vec3(0.50, 0.55, 0.44), 0.45 + 0.45 * fid2);
        if (fid2 > 0.90) strokeCol = mix(strokeCol, vec3(0.46, 0.44, 0.20), 0.6);
      }
    } else {
      bool moon = type > 1.5 && type < 2.5;
      float rings = clamp(floor(R / 0.0085), 4.0, 14.0);
      float Wr = R / rings;
      float k = floor(r / Wr);
      float rk = (k + 0.5) * Wr;
      float nk = max(5.0, floor(TAU * rk / 0.040 + 0.5));
      float th = atan(bxy.y, bxy.x);
      float sx = (th / TAU + 0.5) * nk + hash11(k * 7.0 + seed * 13.0) * 9.0
               + spin * uTime * 0.030 * nk / (1.0 + k * 0.7);
      float sc = floor(sx);
      float six = mod(sc, nk);
      float fid = hash21(vec2(six, k * 3.0) + seed * 5.0);
      float fid2 = hash21(vec2(six + 5.0, k * 9.0) + seed * 7.0);
      float coreK = moon ? floor(rings * 0.44) : max(1.0, floor(rings * 0.25));
      float twinkle = 0.86 + 0.14 * sin(uTime * (1.1 + seed * 2.3) + seed * 40.0);
      if (k < coreK) {
        // the burning centre: solid paint, no gaps
        take = true; solid = 1.0; sid = fid;
        float rc = r / (Wr * coreK);
        strokeCol = haloRamp(0.0, type) * (1.0 - 0.25 * rc * rc);
        gain = mix(0.9, 1.1, bright) * twinkle;
        if (moon) {
          vec2 q = bxy / (Wr * coreK);
          float cut = length(q - vec2(0.34, 0.26));
          float cres = smoothstep(0.98, 0.92, length(q)) * smoothstep(0.72, 0.80, cut);
          vec3 glow = vec3(0.74, 0.70, 0.30);
          vec3 horn = vec3(0.74, 0.42, 0.016);
          strokeCol = mix(glow, horn, cres);
          gain = 1.0;
        }
      } else if (rk < R * (0.76 + 0.40 * fid)) {
        take = true;
        fx = sx - sc; fy = r / Wr - k; sid = fid; lenv = mix(0.62, 1.0, fid2);
        float t = (k - coreK + 0.5) / (rings - coreK);
        strokeCol = haloRamp(t, type);
        strokeCol = mix(strokeCol, strokeCol.grb, (fid2 - 0.5) * 0.16);
        gain = mix(1.0, bright * twinkle, 0.5);
      }
    }
  }

  // One of the canvas' own stars is the painted one or the drawn one, whole: which, is settled at its middle.
  // (Settled point by point, a star near the margin was the drawn one above and the painted one below, with
  // the drawn one's dark rings cutting across it.)
  if (best >= 0 && best < NPAINTED && uScan > 0.0) {
    vec3 A3 = uStarA[best].xyz;
    float zs = A3.y * uPaintCS.y - A3.z * uPaintCS.x;
    vec2 cs = vec2(A3.x, A3.y * uPaintCS.x + A3.z * uPaintCS.y) / zs / uPaintTan * 0.5 + 0.5;
    float es = min(min(cs.x - 0.010, 0.990 - cs.x), (0.992 - cs.y) / ASPECT);
    starReal = smoothstep(0.30, 0.55, smoothstep(0.0, 0.05 + 0.11 * vnoise3(A3 * 6.0 + 2.0), es));
    starFoot = 1.0 - smoothstep(0.95, 1.2, bestK);
  }
  if (take) {
    Stroke sf;
    sf.col = strokeCol; sf.fx = fx; sf.fy = fy; sf.id = sid; sf.lenv = lenv; sf.solid = 0.0;
    vec4 lf = lay(sf, solid);
    vec3 under = mix(mix(vec3(0.010, 0.017, 0.052), strokeCol * 0.50, 0.6), strokeCol * 0.85, soft);
    col = mix(col, mix(under, lf.rgb, lf.a) * gain, 1.0 - starReal);
  }
  }   // needStrokes

  // ------------------------------------------------- the canvas itself
  // Looking north, the dome is the real painting: projected from the opening
  // viewpoint, its strokes creeping along their own direction once "alive".
  float paintW = 0.0;
  {
    vec2 uv = cuv;
    if (inCanvas) {
      // Toward its edge the canvas thins away into the strokes of the rest of the sky: evenly, as a wash, over
      // a margin of uneven depth. (Tried and thrown out: the strokes let in one at a time, which showed as
      // patches on the canvas; the canvas folded out over its own edge like a mirror, which showed the fold
      // as a crease and its stars twice; that fold let in stroke by stroke, a litter of scraps.)
      // (…a star of its own is painted or drawn, whole — but the painted one still thins away at the very edge of
      // the canvas: the moon's halo reaches it, and held at full strength there it ended in two ruled lines)
      float w = mix(wScan, uScan * starReal * smoothstep(0.0, 0.06, edge), starFoot);
      if (w > 0.001) {
        vec3 f = texture2D(tFlow, uv).rgb;
        float th = 0.5 * atan(f.g * 2.0 - 1.0, f.r * 2.0 - 1.0);
        vec2 t = vec2(cos(th), sin(th));
        t *= sign(dot(t, va) + 1e-4);
        vec2 fl = t * vec2(1.0, ASPECT) * (0.011 * uAlive) * (0.45 + 0.75 * f.b) * (1.0 + 0.5 * min(vw, 1.0));
        float ph = uTime * 0.17 + vnoise(uv * vec2(9.0, 7.0));
        float p0 = fract(ph), p1 = fract(ph + 0.5);
        vec3 c0 = textureGrad(tPainting, clamp(uv - fl * (p0 - 0.5), 0.002, 0.998), cgx, cgy).rgb;
        vec3 c1 = textureGrad(tPainting, clamp(uv - fl * (p1 - 0.5), 0.002, 0.998), cgx, cgy).rgb;
        vec3 pc = mix(c1, c0, 1.0 - abs(2.0 * p0 - 1.0));
        col = mix(col, srgb2lin(pc), w);
        paintW = w;
      }
    }
  }

  float flick = 0.88 + 0.12 * sin(uTime * 1.7 + az * 23.0 + el * 31.0);
  col = comeAlive(col, flick) * uPaintExposure;

  // horizon haze, and something dark below it (hills normally cover this)
  float haze = smoothstep(0.10, -0.03, el) * (1.0 - paintW);
  col = mix(col, vec3(0.040, 0.085, 0.230), haze * 0.75);
  col = mix(col, vec3(0.010, 0.022, 0.060), smoothstep(-0.02, -0.25, el) * (1.0 - paintW));

  gl_FragColor = vec4(col, 1.0);
}
`;function Ea(e){let t=Ca(),n=[],i=[],a=[],o=Nt(77);for(let e=0;e<ba;e++){let r=t[e];if(r){n.push(new ge(r.dir.x,r.dir.y,r.dir.z,r.R));let e=(r.spin||(o()<.5?-1:1))*(.6+.8*o());i.push(new ge(r.type,o()*10,r.bright,e)),a.push(new ge(Math.cos(Math.min(r.R*3.05,Math.PI)),0,0,0))}else n.push(new ge(0,-1,0,.01)),i.push(new ge(0,0,0,0)),a.push(new ge(2,0,0,0))}let s=new I;s.setAttribute(`position`,new ve(new Float32Array([-1,-1,0,3,-1,0,-1,3,0]),3));let c=new F({vertexShader:wa,fragmentShader:Ta,uniforms:{uTime:e.uTime,uStarGain:{value:1},uFlow:{value:.11},uLift:e.uSkyLift,uStarCount:{value:t.length},uStarA:{value:n},uStarB:{value:i},uStarC:{value:a},uInvProj:{value:new r},uCamWorld:{value:new r},tPainting:{value:null},tFlow:{value:null},tFill:{value:null},uPaintCS:{value:new Te(Math.cos(qt.pitch),Math.sin(qt.pitch))},uPaintTan:{value:new Te(qt.tanH,qt.tanV)},uPatch:{value:0},uAlive:e.uAlive,uHis:e.uHis,uPaintExposure:{value:1},uScan:{value:.8}},depthWrite:!1,depthFunc:3}),l=new P(s,c);return l.frustumCulled=!1,l.renderOrder=50,{mesh:l,material:c,features:t,moonDir:t[0].dir.clone(),setCanvas(e,t,n){c.uniforms.tPainting.value=e,c.uniforms.tFlow.value=t,c.uniforms.tFill.value=n,c.uniforms.uPatch.value=1},update(e){c.uniforms.uInvProj.value.copy(e.projectionMatrixInverse),c.uniforms.uCamWorld.value.copy(e.matrixWorld)}}}var Da=[[0,873],[90,880],[180,888],[300,892],[420,890],[540,885],[590,858],[630,835],[700,818],[745,832],[790,852],[840,872],[866,848],[900,800],[990,770],[1100,752],[1200,728],[1275,700],[1335,660],[1372,612],[1440,600],[1500,598]],Oa=_t.camY,ka=(e,t)=>Math.exp(-(e*e)/(t*t)),Aa=e=>(e=(e+Math.PI)%(Math.PI*2),e<0&&(e+=Math.PI*2),e-Math.PI),ja=(e,t,n)=>{let r=Math.min(1,Math.max(0,(n-e)/(t-e)));return r*r*(3-2*r)},Ma=null;function Na(e,t){Ma||=Da.map(([e,t])=>{let n=Sa(e/qt.width,1-t/qt.height);return[Math.atan2(n.x,-n.z),n.y/Math.hypot(n.x,n.z)]});let n=Ma,r;if(e<=n[0][0])r=n[0][1];else if(e>=n[n.length-1][0])r=n[n.length-1][1];else{let t=1;for(;n[t][0]<e;)t++;let i=(e-n[t-1][0])/(n[t][0]-n[t-1][0]),a=i*i*(3-2*i);r=n[t-1][1]+(n[t][1]-n[t-1][1])*a}return Oa+t*r}function Pa(e,t){return t===0?52+14*Math.sin(e*3+2)+9*Math.sin(e*5+4)+6*Math.sin(e*11+.9)+3*Math.sin(e*23+4.1)+30*ka(e-2.4,.3)+24*ka(e+2,.25):30+9*Math.sin(e*4+.4)+6*Math.sin(e*7+3.1)+4*Math.sin(e*13+1.7)+2*Math.sin(e*29+.3)}var Fa=e=>Math.sqrt(Math.sin(e)**2+.09)-.3,Ia=(e,t)=>14*Fa(e*8.3+.6+t*1.7)+8.5*Fa(e*13.7+2+t*.9)+2.5*Math.sin(e*29+1+t),La=(e,t)=>Ia(e,t)-.5*(Ia(Math.PI,t)-Ia(-Math.PI,t))*(e/Math.PI)*ja(Math.PI-.6,Math.PI,Math.abs(e));function Ra(e,t,n){let r=Aa(e),i=ja(.86,.5,Math.abs(r)),a=Na(r,n),o=ja(Na(-.4,n),Na(.5,n),a),s=t===0?Math.max(a,22)+(1-.65*o)*(2+1.15*Ia(r,0)):Math.max(a*.5-2,12)+.9*Ia(r,1);return(Pa(r,t)+.45*La(r,t+2))*(1-i)+s*i}var za=`
attribute float aRidge;
attribute float aAz;
uniform vec3 uCenter;
uniform float uBend;
varying float vRidge;
varying float vY;
varying float vAz;
varying float vR;
void main() {
  float R = length(position.xz);
  vec3 wp = vec3(uCenter.x + position.x, position.y + uBend * R * R, uCenter.z + position.z);
  vRidge = aRidge;
  vY = position.y;
  vAz = aAz;
  vR = R;
  gl_Position = projectionMatrix * viewMatrix * vec4(wp, 1.0);
}
`,Ba=`
precision highp float;
uniform float uLayer;
uniform float uTime;
uniform float uReveal;
uniform float uAlive;
uniform float uHis;
uniform vec3 uFogColor;
varying float vRidge;
varying float vY;
varying float vAz;
varying float vR;
${fa}
const float TAU = 6.28318531;
const vec3 DARK = vec3(0.013, 0.019, 0.048);
// palette measured on the painted hills
vec3 ramp(float v) {
  vec3 deep = mix(vec3(0.030, 0.049, 0.139), vec3(0.018, 0.030, 0.085), uLayer);
  vec3 mid  = mix(vec3(0.048, 0.086, 0.240), vec3(0.030, 0.056, 0.150), uLayer);
  vec3 lite = mix(vec3(0.090, 0.150, 0.360), vec3(0.050, 0.095, 0.230), uLayer);
  v = clamp(v, 0.0, 1.0);
  return v < 0.5 ? mix(deep, mid, v * 2.0) : mix(mid, lite, v * 2.0 - 1.0);
}
// One coat of strokes: long, thin, running with the slope, as the sky's run with the wind (they are
// the same size on screen). k = 0 is the first coat, 1 a second laid over it at another lean: one coat
// alone, with the dark ground showing round every stroke, read as brickwork next to the canvas.
vec4 coat(float k, float depth, float a01, float circ, float d01) {
  float SL = 0.24 + 0.13 * k;
  float Wh = mix(3.3, 3.9, k);
  float Lh = mix(40.0, 29.0, k);
  float nT = floor(circ * sin(SL) / Wh + 0.5);
  float nS = floor(circ * cos(SL) / Lh + 0.5);
  float wave = 3.2 * sin(vAz * 23.0 + depth * 0.07 + k * 2.0) + 1.7 * sin(vAz * 61.0 - depth * 0.05 + 2.0 + k);
  float t = (depth + wave) * cos(SL) / Wh + a01 * nT + k * 0.5;
  float row = floor(t);
  float fy = t - row;
  float rh = hash11(row * 2.31 + uLayer * 19.0 + k * 7.0);
  float xx = a01 * nS - depth * sin(SL) / Lh + rh * 23.0;
  float c = floor(xx);
  float fx = xx - c;
  float id = hash21(vec2(c, row + uLayer * 50.0 + k * 91.0));
  float id2 = hash21(vec2(c + 7.0, row * 1.9 + 4.0 + uLayer * 50.0 + k * 13.0));
  float v = 0.50 - 0.20 * d01 + 0.62 * (id - 0.5) + 0.24 * (vnoise3(vec3(cos(vAz) * 9.0, sin(vAz) * 9.0, depth * 0.03)) - 0.5);
  vec3 col = ramp(v);
  if (id2 > 0.88) col = mix(col, vec3(0.056, 0.093, 0.109), 0.6);       // grey-green
  if (id2 < 0.12) col = mix(col, vec3(0.168, 0.245, 0.393), 0.6);       // pale highlight
  float lenv = mix(0.7, 1.0, id2);
  float ax = abs(fx - 0.5) * 2.0 / lenv, ay = abs(fy - 0.5) * 2.0;
  float taper = 1.0 - 0.4 * smoothstep(0.2, 1.0, ax);
  float mask = smoothstep(1.0, 0.86, ax) * smoothstep(taper, taper - 0.3, ay);
  float bristle = vnoise(vec2(fx * 2.2 + id * 31.0, fy * 7.0 + id * 17.0));
  col *= 0.84 + 0.30 * bristle;
  col *= 1.0 - 0.16 * (fy - 0.5) * 2.0;
  return vec4(col, mask * step(0.40 * k, id));
}
void main() {
  float depth = vRidge - vY;
  float circ = TAU * vR;
  float a01 = fract(vAz / TAU + 0.5);          // the one seam sits due south, behind the start
  float d01 = clamp(depth / 60.0, 0.0, 1.0);

  // A slow, cloud-soft cross-fade over the painted hills. (Dark strokes switching on one by one over
  // the canvas looked like an attack on it.)
  // (The ring of hills closes due north, in the middle of the opening view, where vAz jumps from 2 pi to 0.
  // Whatever is read off the azimuth has to come round to the same value there: the noise is taken on a
  // circle, the waves have whole or half-whole counts. Noise read straight off vAz faded the two sides of
  // north in at different rates: a ruled vertical line down the hills for as long as they were coming in.)
  float born = vnoise3(vec3(cos(vAz) * 7.0 + uLayer * 3.0, sin(vAz) * 7.0, depth * 0.035));
  float shown = smoothstep(born * 0.25, born * 0.25 + 0.75, uReveal);
  if (shown < 0.004) discard;

  vec4 A = coat(0.0, depth, a01, circ, d01);
  vec4 B = coat(1.0, depth, a01, circ, d01);
  vec3 col = mix(DARK, ramp(0.34 - 0.18 * d01), 0.75);      // the underpainting that shows between strokes
  col = mix(col, A.rgb, A.a);
  col = mix(col, B.rgb, B.a);

  // drawn in outline, as he drew them: the ridge, and the brows of the nearer hills inside it
  float crest = smoothstep(5.2, 1.0, depth + 1.6 * sin(vAz * 37.0));
  float h1 = 34.0 - 15.0 * abs(sin(vAz * 5.5 + 1.1 + uLayer * 2.0)) + 4.0 * sin(vAz * 12.0 + 0.4);
  float h2 = 66.0 - 20.0 * abs(sin(vAz * 3.5 + 2.6 + uLayer)) + 5.0 * sin(vAz * 9.0 + 1.9);
  float brow = max(smoothstep(2.4, 0.7, abs(depth - h1)), 0.8 * smoothstep(2.8, 0.8, abs(depth - h2)));
  // (just under each brow the slope catches the light)
  float lit = max(smoothstep(11.0, 2.5, depth - h1) * step(h1, depth), smoothstep(13.0, 3.0, depth - h2) * step(h2, depth));
  col *= 1.0 + 0.35 * lit * smoothstep(0.55, 1.0, uReveal);
  // (the outlines are inked in last: drawn from the start, they were dark bands arriving on the canvas ahead of the hills)
  col = mix(col, DARK, max(crest * 0.85, brow * 0.7) * smoothstep(0.55, 1.0, uReveal));

  float l = dot(col, vec3(0.2126, 0.7152, 0.0722));
  col = max(vec3(0.0), mix(vec3(l), col, 1.0 + mix(0.45, 0.08, uHis) * uAlive));

  // the foot of the hills dissolves into the valley haze
  col = mix(col, uFogColor, smoothstep(30.0, 110.0, depth) * 0.9);
  gl_FragColor = vec4(col, shown);
}
`;function Va(e){let n=new t,r=[];for(let t=0;t<2;t++){let i=dt.hillRadius+(t===0?26:0),a=new Float32Array(4326),o=new Float32Array(1442),s=new Float32Array(1442),c=[];for(let e=0;e<=720;e++){let n=e/720*Math.PI*2,r=Ra(n,t,i),l=Math.sin(n)*i,u=-Math.cos(n)*i;if(a.set([l,r,u,l,-300,u],e*6),o[e*2]=o[e*2+1]=r,s[e*2]=s[e*2+1]=n,e<720){let t=e*2,n=t+1,r=t+2,i=t+3;c.push(t,r,n,n,r,i)}}let l=new I;l.setAttribute(`position`,new ve(a,3)),l.setAttribute(`aRidge`,new ve(o,1)),l.setAttribute(`aAz`,new ve(s,1)),l.setIndex(c);let u=new F({vertexShader:za,fragmentShader:Ba,uniforms:{uLayer:{value:t},uTime:e.uTime,uBend:e.uBend,uCenter:e.uBendCenter,uReveal:e.uHillReveal,uAlive:e.uAlive,uHis:e.uHis,uFogColor:e.uFogColor},side:2}),d=new P(l,u);d.frustumCulled=!1,d.renderOrder=40-t,n.add(d),r.push(d)}let i=!1;return{group:n,layers:r,setReveal:e=>{let t=e<.999;t!==i&&(i=t,r.forEach((e,n)=>{e.material.transparent=t,e.material.depthWrite=!t,e.renderOrder=t?39+n:40-n,e.material.needsUpdate=!0}))}}}var Ha=`
uniform float uBend;
uniform vec3 uBendCenter;
varying vec3 vCam;
void main() {
  vCam = position;                      // geometry is authored in viewpoint space
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vec2 dxz = wp.xz - uBendCenter.xz;
  wp.y += uBend * dot(dxz, dxz);
  gl_Position = projectionMatrix * viewMatrix * wp;
}
`,Ua={x:186,y:1016,lean:.22,bush:270,inner:560},Wa=(e,t,n)=>{let r=Math.min(1,Math.max(0,(n-e)/(t-e)));return r*r*(3-2*r)},Ga=e=>{let t=e-Ua.y;return Ua.x-Ua.lean*t+Wa(0,44,t)*(7*Math.sin(t/31+.6)+4*Math.sin(t/13+2.1))},Ka=`
precision highp float;
#define CW ${qt.width.toFixed(1)}
#define CH ${qt.height.toFixed(1)}
#define FOOT_X ${Ua.x.toFixed(1)}
#define FOOT_Y ${Ua.y.toFixed(1)}
#define FOOT_LEAN ${Ua.lean.toFixed(3)}
#define FOOT_BUSH ${Ua.bush.toFixed(1)}
#define FOOT_IN ${Ua.inner.toFixed(1)}
uniform sampler2D tPainting;
uniform sampler2D tCypress;
uniform vec2 uPaintTan;
uniform float uPaintExposure;
uniform float uAlive;
uniform float uHis;
varying vec3 vCam;
vec3 srgb2lin(vec3 c) {
  return mix(c / 12.92, pow((c + 0.055) / 1.055, vec3(2.4)), step(vec3(0.04045), c));
}
// the left edge of the tree's foot in canvas pixels, f pixels below FOOT_Y (as footEdge() above)
float footEdge(float f) {
  return FOOT_X - FOOT_LEAN * f + smoothstep(0.0, 44.0, f) * (7.0 * sin(f / 31.0 + 0.6) + 4.0 * sin(f / 13.0 + 2.1));
}
void main() {
  vec2 uv = vCam.xy / -vCam.z / uPaintTan * 0.5 + 0.5;
  // Below the canvas edge the paint is mirrored, and sinks into shadow.
  // (The mirror stands a little above the very edge: the last few rows of the scan
  // are bare canvas and the scratches of the frame, pale horizontal dashes that would
  // otherwise run across the tree's foot. The mirrored paint is drawn out to twice
  // its length: at its own size the foot of the tree was plainly its own reflection.)
  float dv = uv.y - 0.040;
  vec2 uvc = vec2(uv.x, clamp(0.040 + (dv < 0.0 ? -0.5 * dv : dv), 0.040, 0.999));
  float f = (1.0 - uv.y) * CH - FOOT_Y;
  if (f > 0.0) {
    float xp = uv.x * CW, xc = footEdge(f);
    if (xp < xc) discard;
    // (the bushes are painted over the foot out to FOOT_BUSH: the tree's own paint is drawn out to its edge instead)
    float xb = max(xc, mix(FOOT_X, FOOT_BUSH, smoothstep(4.0, 46.0, (1.0 - uvc.y) * CH - FOOT_Y)));
    if (xp < FOOT_IN) uvc.x = (FOOT_IN - (FOOT_IN - xp) * (FOOT_IN - xb) / (FOOT_IN - xc)) / CW;
  }
  if (texture2D(tCypress, uvc).r < 0.5) discard;
  vec3 c = srgb2lin(texture2D(tPainting, uvc).rgb);
  float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
  c = max(vec3(0.0), mix(vec3(l), c, 1.0 + mix(0.3, 0.1, uHis) * uAlive));
  c *= mix(1.0, 0.28, smoothstep(0.075, -0.05, uv.y));
  gl_FragColor = vec4(c * uPaintExposure, 1.0);
}
`,qa=[[47,1125,38,42],[130,1105,40,48],[186,1108,24,40],[218,1150,55,50],[141,1160,131,50]],Ja={depth:16.2,base:1160,left:10,right:272,lean:.15,inL:120,inR:200},Ya=e=>Ja.left-Ja.lean*e-Wa(0,40,e)*(5*Math.sin(e/27+1)+3*Math.sin(e/11+.4)),Xa=e=>Ja.right+Ja.lean*e+Wa(0,40,e)*(5*Math.sin(e/24+2.2)+3*Math.sin(e/12+1.1)),Za=(e,t)=>{let n=t-Ja.base;if(n>0)return e>Ya(n)&&e<Xa(n);for(let[n,r,i,a]of qa){let o=(e-n)/i,s=(t-r)/a;if(o*o+s*s<1)return!0}return!1},Qa=`
precision highp float;
#define CW ${qt.width.toFixed(1)}
#define CH ${qt.height.toFixed(1)}
#define BUSH_BASE ${Ja.base.toFixed(1)}
#define BUSH_LEFT ${Ja.left.toFixed(1)}
#define BUSH_RIGHT ${Ja.right.toFixed(1)}
#define BUSH_LEAN ${Ja.lean.toFixed(3)}
#define BUSH_INL ${Ja.inL.toFixed(1)}
#define BUSH_INR ${Ja.inR.toFixed(1)}
uniform sampler2D tPainting;
uniform vec2 uPaintTan;
uniform float uPaintExposure;
uniform float uAlive;
uniform float uHis;
varying vec3 vCam;
vec3 srgb2lin(vec3 c) {
  return mix(c / 12.92, pow((c + 0.055) / 1.055, vec3(2.4)), step(vec3(0.04045), c));
}
// (as bushLeft(), bushRight() and bushIn() above)
float bushL(float f) { return BUSH_LEFT - BUSH_LEAN * f - smoothstep(0.0, 40.0, f) * (5.0 * sin(f / 27.0 + 1.0) + 3.0 * sin(f / 11.0 + 0.4)); }
float bushR(float f) { return BUSH_RIGHT + BUSH_LEAN * f + smoothstep(0.0, 40.0, f) * (5.0 * sin(f / 24.0 + 2.2) + 3.0 * sin(f / 12.0 + 1.1)); }
bool bushIn(vec2 p) {
  float f = p.y - BUSH_BASE;
  if (f > 0.0) return p.x > bushL(f) && p.x < bushR(f);
${qa.map(e=>`  if (length((p - vec2(${e[0].toFixed(1)}, ${e[1].toFixed(1)})) / vec2(${e[2].toFixed(1)}, ${e[3].toFixed(1)})) < 1.0) return true;`).join(`
`)}
  return false;
}
void main() {
  vec2 uv = vCam.xy / -vCam.z / uPaintTan * 0.5 + 0.5;
  vec2 p = vec2(uv.x * CW, (1.0 - uv.y) * CH);
  if (!bushIn(p)) discard;
  // below the canvas edge the paint is mirrored, drawn out to twice its length, and sinks into shadow
  // (the mirror stands just above the strip of bare canvas along the edge)
  float dv = uv.y - 0.014;
  vec2 uvc = vec2(uv.x, clamp(0.014 + (dv < 0.0 ? -0.5 * dv : dv), 0.014, 0.999));
  // (where the sides lean out past the painted bank, its paint is drawn out to them)
  float f = p.y - BUSH_BASE;
  if (f > 0.0) {
    if (p.x < BUSH_INL) uvc.x = (BUSH_INL - (BUSH_INL - p.x) * (BUSH_INL - BUSH_LEFT) / (BUSH_INL - bushL(f))) / CW;
    else if (p.x > BUSH_INR) uvc.x = (BUSH_INR + (p.x - BUSH_INR) * (BUSH_RIGHT - BUSH_INR) / (bushR(f) - BUSH_INR)) / CW;
  }
  vec3 c = srgb2lin(texture2D(tPainting, uvc).rgb);
  float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
  c = max(vec3(0.0), mix(vec3(l), c, 1.0 + mix(0.3, 0.1, uHis) * uAlive));
  c *= mix(1.0, 0.3, smoothstep(0.012, -0.07, uv.y));
  gl_FragColor = vec4(c * uPaintExposure, 1.0);
}
`;function $a(e,t){let n=qt.width,r=qt.height,i=Ja.depth,a=1044,o=r+150,s=Math.ceil((o-a)/6),c=i*2*qt.tanH/n,l=Math.ceil((o-a)/2)+1,u=new Float32Array(202*l);for(let e=0;e<l;e++)for(let t=0;t<202;t++)u[e*202+t]=Za(-66+t*2,a+e*2)?1e6:0;let d=(e,t,n,r,i,a)=>{let o=t+r,s=n+i;o>=0&&s>=0&&s<202&&(u[e]=Math.min(u[e],u[o*202+s]+a))};for(let e=0;e<l;e++)for(let t=0;t<202;t++){let n=e*202+t;d(n,e,t,0,-1,1),d(n,e,t,-1,0,1),d(n,e,t,-1,-1,1.414),d(n,e,t,-1,1,1.414)}for(let e=l-1;e>=0;e--)for(let t=201;t>=0;t--){let n=e*202+t;t+1<202&&(u[n]=Math.min(u[n],u[n+1]+1)),e+1<l&&(u[n]=Math.min(u[n],u[n+202]+1),t+1<202&&(u[n]=Math.min(u[n],u[n+202+1]+1.414)),t>0&&(u[n]=Math.min(u[n],u[n+202-1]+1.414)))}let f=(e,t)=>u[Math.min(l-1,Math.round((t-a)/2))*202+Math.min(201,Math.round((e- -66)/2))]*2,p=68*(s+1),m=new Float32Array(p*2*3);for(let e=0;e<=s;e++)for(let t=0;t<=67;t++){let o=-66+t*6,s=a+e*6,l=.5*(Math.min(f(o,s),60)*c)**.6,u=(2*o/n-1)*qt.tanH,d=(1-2*s/r)*qt.tanV,h=e*68+t,g=i-l,_=i+l*1.15;m.set([u*g,d*g,-g],h*3),m.set([u*_,d*_,-_],(p+h)*3)}let h=[];for(let e=0;e<s;e++)for(let t=0;t<67;t++){let n=!1;for(let r=0;r<=3&&!n;r++)for(let i=0;i<=3;i++)if(Za(-66+(t+i/3)*6,a+(e+r/3)*6)){n=!0;break}if(!n)continue;let r=e*68+t,i=r+1,o=r+67+1,s=o+1;h.push(r,o,i,i,o,s),h.push(p+r,p+i,p+o,p+i,p+s,p+o)}let g=new I;g.setAttribute(`position`,new ve(m,3)),g.setIndex(h),g.computeBoundingSphere();let _=new F({vertexShader:Ha,fragmentShader:Qa,uniforms:{tPainting:{value:t},uPaintTan:{value:new Te(qt.tanH,qt.tanV)},uPaintExposure:{value:1},uAlive:e.uAlive,uHis:e.uHis,uBend:e.uBend,uBendCenter:e.uBendCenter},side:2}),v=new P(g,_);return v.frustumCulled=!1,v.renderOrder=5,v}function eo(e,t,n){let r=qt.width,i=qt.height,a=Yt.cypressDepth,o=document.createElement(`canvas`);o.width=r,o.height=i;let s=o.getContext(`2d`,{willReadFrequently:!0});s.drawImage(n.image,0,0,r,i);let c=s.getImageData(0,0,r,i).data,l=(e,t,n)=>{let a=t<i?t:2*i-2-t;return c[(Math.min(i-1,Math.max(0,a))*r+Math.min(r-1,Math.max(0,e)))*4+n]},u=(e,t)=>t>Ua.y&&e<Ga(t)?0:l(e,t,0)/255,d=(e,t)=>Math.min(l(e,t,1)/255*160,t>Ua.y?Math.max(0,e-Ga(t)):1/0),f=i+150,p=Math.ceil((f-24)/8),m=a*2*qt.tanH/r,h=new Uint8Array(91*p);for(let e=0;e<p;e++)for(let t=0;t<91;t++){let n=0,r=0+t*8-1,i=24+e*8-1;for(let e=i;e<=i+8+2&&!n;e+=2)for(let t=r;t<=r+8+2;t+=2)if(u(t,e)>.02){n=1;break}h[e*91+t]=n}let g=92*(p+1),_=new Float32Array(g*2*3);for(let e=0;e<=p;e++)for(let t=0;t<=91;t++){let n=0+t*8,o=24+e*8,s=d(n,o)*m,c=u(n,o)>.3?.7*s**.6:0,l=(2*n/r-1)*qt.tanH,f=(1-2*o/i)*qt.tanV,p=e*92+t,h=a-c,v=a+c*1.15;_.set([l*h,f*h,-h],p*3),_.set([l*v,f*v,-v],(g+p)*3)}let v=[];for(let e=0;e<p;e++)for(let t=0;t<91;t++){if(!h[e*91+t])continue;let n=e*92+t,r=n+1,i=n+91+1,a=i+1;v.push(n,i,r,r,i,a),v.push(g+n,g+r,g+i,g+r,g+a,g+i)}let y=new I;y.setAttribute(`position`,new ve(_,3)),y.setIndex(v),y.computeBoundingSphere();let b=new F({vertexShader:Ha,fragmentShader:Ka,uniforms:{tPainting:{value:t},tCypress:{value:n},uPaintTan:{value:new Te(qt.tanH,qt.tanV)},uPaintExposure:{value:1},uAlive:e.uAlive,uHis:e.uHis,uBend:e.uBend,uBendCenter:e.uBendCenter},side:2}),x=new P(y,b);return x.frustumCulled=!1,x.renderOrder=5,x.add($a(e,t)),x}var to=`
varying vec2 vUv;
void main() {
  vUv = position.xy * 0.5 + 0.5;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`,no=`
precision highp float;
uniform sampler2D tSrc;
uniform vec2 uTexel;      // source texel
uniform float uThreshold;
uniform float uKnee;
varying vec2 vUv;
float luma(vec3 c) { return dot(c, vec3(0.2126, 0.7152, 0.0722)); }
vec3 pre(vec3 c) {
  c = min(c, vec3(48.0));
  float br = max(c.r, max(c.g, c.b));
  float soft = clamp(br - uThreshold + uKnee, 0.0, 2.0 * uKnee);
  soft = soft * soft / (4.0 * uKnee + 1e-4);
  float contrib = max(soft, br - uThreshold) / max(br, 1e-4);
  return c * contrib;
}
void main() {
  // 4 bilinear taps, Karis-weighted so single hot pixels do not flicker
  vec3 a = pre(texture2D(tSrc, vUv + uTexel * vec2(-1.0, -1.0)).rgb);
  vec3 b = pre(texture2D(tSrc, vUv + uTexel * vec2( 1.0, -1.0)).rgb);
  vec3 c = pre(texture2D(tSrc, vUv + uTexel * vec2(-1.0,  1.0)).rgb);
  vec3 d = pre(texture2D(tSrc, vUv + uTexel * vec2( 1.0,  1.0)).rgb);
  float wa = 1.0 / (1.0 + luma(a)), wb = 1.0 / (1.0 + luma(b));
  float wc = 1.0 / (1.0 + luma(c)), wd = 1.0 / (1.0 + luma(d));
  gl_FragColor = vec4((a * wa + b * wb + c * wc + d * wd) / (wa + wb + wc + wd), 1.0);
}
`,ro=`
precision highp float;
uniform sampler2D tSrc;
uniform vec2 uTexel;
varying vec2 vUv;
void main() {
  vec2 h = uTexel * 0.5;
  vec3 s = texture2D(tSrc, vUv).rgb * 4.0;
  s += texture2D(tSrc, vUv - h).rgb;
  s += texture2D(tSrc, vUv + h).rgb;
  s += texture2D(tSrc, vUv + vec2(h.x, -h.y)).rgb;
  s += texture2D(tSrc, vUv - vec2(h.x, -h.y)).rgb;
  gl_FragColor = vec4(s / 8.0, 1.0);
}
`,io=`
precision highp float;
uniform sampler2D tSrc;     // smaller mip being upsampled
uniform sampler2D tAdd;     // this level's own content
uniform vec2 uTexel;        // texel of tSrc
uniform float uSpread;
uniform float uMix;         // how much of the wider glow to keep at this level
varying vec2 vUv;
void main() {
  vec2 h = uTexel * uSpread;
  vec3 s = texture2D(tSrc, vUv + vec2(-h.x * 2.0, 0.0)).rgb;
  s += texture2D(tSrc, vUv + vec2(-h.x, h.y)).rgb * 2.0;
  s += texture2D(tSrc, vUv + vec2(0.0, h.y * 2.0)).rgb;
  s += texture2D(tSrc, vUv + vec2(h.x, h.y)).rgb * 2.0;
  s += texture2D(tSrc, vUv + vec2(h.x * 2.0, 0.0)).rgb;
  s += texture2D(tSrc, vUv + vec2(h.x, -h.y)).rgb * 2.0;
  s += texture2D(tSrc, vUv + vec2(0.0, -h.y * 2.0)).rgb;
  s += texture2D(tSrc, vUv + vec2(-h.x, -h.y)).rgb * 2.0;
  gl_FragColor = vec4(mix(texture2D(tAdd, vUv).rgb, s / 12.0, uMix), 1.0);
}
`,ao=`
precision highp float;
uniform sampler2D tDepth;
uniform mat4 uInvProj;
uniform vec2 uProjScale;
uniform vec2 uTexel;
uniform vec2 uFull;         // size of the depth buffer, in texels
uniform float uRadius;
uniform float uIntensity;
varying vec2 vUv;
// The position seen at uv. This pass runs at half resolution, so its pixel
// centres fall exactly on the seams between depth texels; left alone, each
// lookup rounds to one side or the other at random, and on ground seen at a
// shallow angle that put alternate rows a whole texel of depth apart — stripes
// of false shadow. So every lookup is moved to the centre of the texel it
// actually reads.
vec3 viewPos(vec2 uv) {
  uv = (floor(uv * uFull) + 0.5) / uFull;
  float d = texture2D(tDepth, uv).x;
  vec4 p = uInvProj * vec4(uv * 2.0 - 1.0, d * 2.0 - 1.0, 1.0);
  return p.xyz / p.w;
}
float ign(vec2 p) { return fract(52.9829189 * fract(dot(p, vec2(0.06711056, 0.00583715)))); }
void main() {
  float d = texture2D(tDepth, vUv).x;
  if (d > 0.99995) { gl_FragColor = vec4(1.0); return; }
  vec3 P = viewPos(vUv);
  vec3 Pr = viewPos(vUv + vec2(uTexel.x, 0.0)), Pl = viewPos(vUv - vec2(uTexel.x, 0.0));
  vec3 Pu = viewPos(vUv + vec2(0.0, uTexel.y)), Pd = viewPos(vUv - vec2(0.0, uTexel.y));
  vec3 dx = abs(Pr.z - P.z) < abs(P.z - Pl.z) ? Pr - P : P - Pl;
  vec3 dy = abs(Pu.z - P.z) < abs(P.z - Pd.z) ? Pu - P : P - Pd;
  vec3 N = normalize(cross(dx, dy));
  // face the eye (not simply +z: seen from a camera tilted upward, the ground's
  // normal leans away from the viewer, and flipping it buried the bottom of the
  // frame in shadow)
  if (dot(N, P) > 0.0) N = -N;
  float z = -P.z;
  float R = uRadius * (1.0 + z * 0.018);
  vec2 rUv = min(R * uProjScale / z, vec2(0.11));
  float rot = ign(gl_FragCoord.xy) * 6.2831853;
  const int NS = 11;
  float R2 = R * R;
  float occ = 0.0;
  for (int i = 0; i < NS; i++) {
    float a = (float(i) + 0.5) / float(NS);
    float ang = a * 6.2831853 * 2.6 + rot;
    vec2 suv = vUv + vec2(cos(ang), sin(ang)) * a * rUv;
    // nothing is known about what lies beyond the edge of the frame
    if (suv.x < 0.0 || suv.x > 1.0 || suv.y < 0.0 || suv.y > 1.0) continue;
    vec3 S = viewPos(suv);
    vec3 v = S - P;
    float vv = dot(v, v), vn = dot(v, N);
    float f = max(R2 - vv, 0.0);
    occ += f * f * f * max((vn - 0.012 * z - 0.03) / (vv + 0.01), 0.0);
  }
  float ao = max(0.0, 1.0 - occ * 5.0 / (R2 * R2 * R2 * float(NS)) * uIntensity);
  gl_FragColor = vec4(ao, ao, ao, 1.0);
}
`,oo=`
precision highp float;
uniform sampler2D tAO;
uniform sampler2D tDepth;
uniform vec2 uDir;          // one texel along the blur axis
uniform float uNear;
uniform float uFar;
varying vec2 vUv;
float lin(vec2 uv) {
  float d = texture2D(tDepth, uv).x;
  return 2.0 * uNear * uFar / (uFar + uNear - (2.0 * d - 1.0) * (uFar - uNear));
}
void main() {
  float zc = lin(vUv);
  float sum = texture2D(tAO, vUv).r * 0.22, wsum = 0.22;
  for (int i = 1; i <= 3; i++) {
    float w = 0.20 - 0.045 * float(i);
    for (int s = -1; s <= 1; s += 2) {
      vec2 uv = vUv + uDir * float(i * s) * 1.5;
      float k = w * max(0.0, 1.0 - abs(lin(uv) - zc) / (0.06 * zc + 0.15));
      sum += texture2D(tAO, uv).r * k; wsum += k;
    }
  }
  gl_FragColor = vec4(vec3(sum / wsum), 1.0);
}
`,so=`
precision highp float;
uniform sampler2D tScene;
uniform sampler2D tDepth;
uniform sampler2D tBloom;
uniform sampler2D tAO;
uniform float uAO;
uniform vec2 uRes;
uniform float uNear;
uniform float uFar;
uniform float uExposure;
uniform float uBloom;
uniform float uPaint;       // edge break-up, in 1080p pixels
uniform float uOutline;
uniform vec2 uReach;        // nothing further off than the second of these is given a contour or a contact shade; within the first, all of it is
uniform float uSaturation;
uniform float uContrast;
uniform float uVignette;
uniform float uTime;
uniform float uHdrPeak;     // 1 = SDR; >1 lets highlights exceed display white
uniform sampler2D tPainting; // the untouched scan, for the opening frame
uniform vec4 uHole;         // where the framed canvas sits on screen (uv: x0, y0, x1, y1)
uniform float uTitleMix;    // 1 = show the scan exactly, 0 = the living scene
uniform float uRush;        // hyper mode: the edges of the picture streak toward the eye
uniform vec2 uOrigin;       // where this picture begins in the buffer it is drawn into (a headset's two eyes share one: xr.js)
uniform float uUp;          // how many of that buffer's pixels to one of this pass's own
uniform float uTooth;       // the canvas's tooth: 1 on a screen, 0 in a headset (where it would be a pattern stuck to the eye)
uniform float uFade;        // 1; less, and the whole picture goes down to black
uniform float uDepthOut;    // 1: the scene's depth is written with the picture (a headset re-aims each frame by it: xr.js)
uniform float uLinear;      // 1: the picture is left unencoded (for a headset whose buffer is linear: xr.js, ?xrlinear)
varying vec2 vUv;

${fa}

// 1/z, which is linear across the screen for any flat surface
float invZ(vec2 uv) {
  float d = texture2D(tDepth, uv).x;
  return (uFar + uNear - (2.0 * d - 1.0) * (uFar - uNear)) / (2.0 * uFar * uNear);
}

vec3 aces(vec3 x) {
  return (x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14);
}
float aces1(float x) {
  return (x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14);
}

void main() {
  float sc = uRes.y / 1080.0;
  vec2 fc = (gl_FragCoord.xy - uOrigin) / uUp;      // (this pass's own pixels, wherever in a larger buffer it is drawn)
  vec2 frag = fc / sc;

  // Every on-screen dab of the brush nudges the picture by a constant amount,
  // so silhouettes break into stroke-shaped steps instead of ruler lines.
  const float ang = 0.42;
  mat2 R = mat2(cos(ang), -sin(ang), sin(ang), cos(ang));
  vec2 q = (R * frag) / vec2(30.0, 10.0);
  float row = floor(q.y);
  q.x += hash11(row * 1.7) * 11.0;
  vec2 cell = vec2(floor(q.x), row);
  vec2 jit = hash22(cell) - 0.5;
  vec2 q2 = (R * frag.yx) / vec2(17.0, 6.0);
  float row2 = floor(q2.y);
  q2.x += hash11(row2 * 2.3 + 5.0) * 7.0;
  vec2 jit2 = hash22(vec2(floor(q2.x), row2) + 31.0) - 0.5;
  vec2 off = (jit * 2.0 + jit2 * 1.2) * uPaint * sc / uRes;
  // Only what is far off is broken up like this. Anything near slides quickly
  // across the screen as he rides by, and edges stepping about under a fixed
  // pattern read as the houses warping — so they keep a clean line.
  float zHere = 1.0 / max(invZ(vUv), 1e-6);
  off *= mix(0.1, 1.0, smoothstep(12.0, 75.0, zHere));
  // …and the sky is not broken up at all. It is all brushwork already; and its stars and whorls
  // swimming under a pattern fixed to the screen, every time he turns, read as the heavens warping.
  // Nor are the hills: their ridge stepping about under the same fixed pattern as he turns read as the hills warping.
  off *= 1.0 - smoothstep(170.0, 300.0, zHere);
  vec2 uv = vUv + off;

  vec3 col = texture2D(tScene, uv).rgb;
  if (uRush > 0.002) {
    // everything but the middle of the frame smears outward along its line of flight
    vec2 dv = uv - vec2(0.5, 0.54);
    float k = uRush * 0.11 * smoothstep(0.015, 0.30, dot(dv, dv));
    float wsum = 1.0;
    for (int i = 1; i <= 6; i++) {
      float t = float(i) / 6.0, w = 1.0 - 0.13 * float(i);
      col += texture2D(tScene, uv - dv * k * t).rgb * w; wsum += w;
    }
    col /= wsum;
  }
  // contact shade — but never on things that are themselves alight
  float ao = texture2D(tAO, uv).r;
  float lumHere = dot(col, vec3(0.2126, 0.7152, 0.0722));
  col *= mix(1.0, ao, uAO * (1.0 - smoothstep(uReach.x, uReach.y, zHere)) * (1.0 - smoothstep(0.9, 2.6, lumHere)));

  // Dark, wobbling contour lines wherever depth breaks — Vincent outlined
  // his roofs, hills and cypress in prussian blue.
  float wob = 0.55 + 0.9 * vnoise(frag / 26.0);
  vec2 o = (1.15 * wob * sc) / uRes;
  float wc = invZ(uv);
  float w1 = invZ(uv + vec2(o.x, 0.0)), w2 = invZ(uv - vec2(o.x, 0.0));
  float w3 = invZ(uv + vec2(0.0, o.y)), w4 = invZ(uv - vec2(0.0, o.y));
  float lap = abs(w1 + w2 - 2.0 * wc) + abs(w3 + w4 - 2.0 * wc);
  float wmax = max(max(max(w1, w2), max(w3, w4)), wc);
  float e = lap / max(wmax, 1e-6);
  float edge = smoothstep(0.012, 0.06, e);
  float nearZ = 1.0 / max(wmax, 1e-6);
  edge *= mix(1.0, 0.45, smoothstep(60.0, 380.0, nearZ)) * (1.0 - smoothstep(uReach.x, uReach.y, nearZ));
  edge *= 0.55 + 0.45 * vnoise(frag / 7.0 + 3.0);
  col = mix(col, col * vec3(0.05, 0.07, 0.20) + vec3(0.002, 0.004, 0.016), edge * uOutline);

  vec3 bloom = texture2D(tBloom, vUv).rgb;
  col += bloom * uBloom;

  col *= uExposure;

  // filmic curve: half hue-preserving, half per-channel so that the hottest
  // lamps and stars burn through to yellow-white
  float m = max(col.r, max(col.g, col.b));
  vec3 hp = col * (aces1(m) / max(m, 1e-5));
  vec3 pc = aces(col);
  vec3 tm = mix(hp, pc, 0.55);
  if (uHdrPeak > 1.0) {
    // extended range: let what the curve compressed come back above white
    vec3 over = max(col - vec3(1.0), vec3(0.0));
    tm += (uHdrPeak - 1.0) * (1.0 - exp(-over * 0.35));
  }
  col = tm;

  float l = dot(col, vec3(0.2126, 0.7152, 0.0722));
  col = max(vec3(0.0), mix(vec3(l), col, uSaturation));
  col = mix(col, col * col * (3.0 - 2.0 * col), uContrast * step(uHdrPeak, 1.0));

  // canvas tooth + grain (also dithers the deep blues)
  float tooth = vnoise(fc * 0.55) - 0.5;
  float grain = hash21(fc + fract(uTime) * 61.0) - 0.5;
  col *= 1.0 + tooth * 0.045 * uTooth;
  vec2 vv = vUv - 0.5;
  col *= 1.0 - uVignette * dot(vv, vv) * 1.6;

  col = max(col, vec3(0.0)) * uFade;
  vec3 enc = uLinear > 0.5 ? col : mix(col * 12.92, 1.055 * pow(col, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, col));
  enc += grain * (1.5 / 255.0);

  // The opening frame IS the painting. It then gives way to the living scene
  // one brush-dab at a time.
  if (uTitleMix > 0.001) {
    vec2 huv = (vUv - uHole.xy) / (uHole.zw - uHole.xy);
    if (huv.x > 0.0 && huv.x < 1.0 && huv.y > 0.0 && huv.y < 1.0) {
      float n = hash21(cell * 1.7 + 4.0) * 0.18 + vnoise(frag / 150.0) * 0.82;      // (cloud-soft: hardly dab by dab)
      float a = smoothstep(n * 0.5, n * 0.5 + 0.5, uTitleMix);      // (a wide, soft front: the scan melts into the scene rather than flaking off it)
      // …and its rectangle melts from the edges inward, so no hard-edged picture is left hanging in the scene
      float rim = min(min(huv.x, 1.0 - huv.x), min(huv.y, 1.0 - huv.y) * (uHole.w - uHole.y) / (uHole.z - uHole.x) * uRes.y / uRes.x);
      a *= smoothstep(0.0, 0.0005 + 0.30 * (1.0 - uTitleMix), rim);
      enc = mix(enc, texture2D(tPainting, huv).rgb, a);
    }
  }
  gl_FragColor = vec4(enc, 1.0);
#ifdef XR_DEPTH
  // (only while a headset is on — xr.js defines it for the session: on a screen this pass writes no depth at all)
  gl_FragDepth = uDepthOut > 0.5 ? texture2D(tDepth, vUv).x : gl_FragCoord.z;
#endif
}
`,co=6,lo=class{constructor(e){this.renderer=e,this.width=4,this.height=4;let t=new L(4,4);t.type=Re,t.minFilter=t.magFilter=f,this.sceneRT=new Be(4,4,{type:be,format:ce,minFilter:T,magFilter:T,depthBuffer:!0,stencilBuffer:!1,depthTexture:t}),this.sceneRT.texture.generateMipmaps=!1;let n=()=>{let e=new Be(2,2,{type:be,format:ce,minFilter:T,magFilter:T,depthBuffer:!1,stencilBuffer:!1});return e.texture.generateMipmaps=!1,e},i=()=>{let e=new Be(2,2,{type:De,format:ce,minFilter:T,magFilter:T,depthBuffer:!1,stencilBuffer:!1});return e.texture.generateMipmaps=!1,e};this.aoA=i(),this.aoB=i(),this.down=[],this.up=[];for(let e=0;e<co;e++)this.down.push(n()),this.up.push(n());let a=(e,t)=>new F({vertexShader:to,fragmentShader:e,uniforms:t,depthTest:!1,depthWrite:!1});this.prefilter=a(no,{tSrc:{value:null},uTexel:{value:new Te},uThreshold:{value:1},uKnee:{value:.6}}),this.downMat=a(ro,{tSrc:{value:null},uTexel:{value:new Te}}),this.upMat=a(io,{tSrc:{value:null},tAdd:{value:null},uTexel:{value:new Te},uSpread:{value:1},uMix:{value:.62}}),this.bloomRadius=.62,this.depthMaterial=null,this.aoMat=a(ao,{tDepth:{value:t},uInvProj:{value:new r},uProjScale:{value:new Te},uTexel:{value:new Te},uFull:{value:new Te(4,4)},uRadius:{value:1.5},uIntensity:{value:1.25}}),this.aoBlur=a(oo,{tAO:{value:null},tDepth:{value:t},uDir:{value:new Te},uNear:{value:.1},uFar:{value:2e3}}),this.composite=a(so,{tScene:{value:this.sceneRT.texture},tDepth:{value:t},tBloom:{value:null},tAO:{value:this.aoA.texture},uAO:{value:.85},uRes:{value:new Te(4,4)},uNear:{value:.1},uFar:{value:2e3},uExposure:{value:1},uBloom:{value:.7},uPaint:{value:0},uOutline:{value:.85},uReach:{value:new Te(1e8,2e8)},uSaturation:{value:1.18},uContrast:{value:.22},uVignette:{value:.35},uTime:{value:0},uHdrPeak:{value:1},tPainting:{value:null},uHole:{value:new ge(0,0,1,1)},uTitleMix:{value:0},uRush:{value:0},uOrigin:{value:new Te(0,0)},uUp:{value:1},uTooth:{value:1},uFade:{value:1},uDepthOut:{value:0},uLinear:{value:0}});let o=new I;o.setAttribute(`position`,new ve(new Float32Array([-1,-1,0,3,-1,0,-1,3,0]),3)),this.quad=new P(o,this.composite),this.quad.frustumCulled=!1,this.fsScene=new re,this.fsScene.add(this.quad),this.fsCam=new _(-1,1,1,-1,0,1)}setSize(e,t){if(e=Math.max(4,Math.floor(e)),t=Math.max(4,Math.floor(t)),e===this.width&&t===this.height)return;this.width=e,this.height=t,this.sceneRT.setSize(e,t),this.aoA.setSize(Math.max(2,e>>1),Math.max(2,t>>1)),this.aoB.setSize(Math.max(2,e>>1),Math.max(2,t>>1));let n=e,r=t;for(let e=0;e<co;e++)n=Math.max(2,Math.floor(n/2)),r=Math.max(2,Math.floor(r/2)),this.down[e].setSize(n,r),this.up[e].setSize(n,r);this.composite.uniforms.uRes.value.set(e,t)}pass(e,t){this.quad.material=e,this.renderer.setRenderTarget(t),this.renderer.render(this.fsScene,this.fsCam)}render(e,t,n,r=!1,i=null){let a=this.renderer;if(r){let e=this.composite.uniforms;e.uTime.value=n,this.pass(this.composite,i);return}a.setRenderTarget(this.sceneRT),a.clear(!0,!0,!1),this.depthMaterial&&(t.layers.set(1),e.overrideMaterial=this.depthMaterial,a.render(e,t),e.overrideMaterial=null,t.layers.set(0)),a.render(e,t);let o=this.aoMat.uniforms;o.uInvProj.value.copy(t.projectionMatrixInverse),o.uProjScale.value.set(t.projectionMatrix.elements[0]*.5,t.projectionMatrix.elements[5]*.5),o.uTexel.value.set(1/this.aoA.width,1/this.aoA.height),o.uFull.value.set(this.width,this.height),this.pass(this.aoMat,this.aoA);let s=this.aoBlur.uniforms;s.uNear.value=t.near,s.uFar.value=t.far,s.tAO.value=this.aoA.texture,s.uDir.value.set(1/this.aoA.width,0),this.pass(this.aoBlur,this.aoB),s.tAO.value=this.aoB.texture,s.uDir.value.set(0,1/this.aoA.height),this.pass(this.aoBlur,this.aoA),this.prefilter.uniforms.tSrc.value=this.sceneRT.texture,this.prefilter.uniforms.uTexel.value.set(.5/this.width,.5/this.height),this.pass(this.prefilter,this.down[0]);for(let e=1;e<co;e++){let t=this.down[e-1];this.downMat.uniforms.tSrc.value=t.texture,this.downMat.uniforms.uTexel.value.set(1/t.width,1/t.height),this.pass(this.downMat,this.down[e])}let c=this.down[5];for(let e=4;e>=0;e--)this.upMat.uniforms.tSrc.value=c.texture,this.upMat.uniforms.tAdd.value=this.down[e].texture,this.upMat.uniforms.uTexel.value.set(1/c.width,1/c.height),this.upMat.uniforms.uMix.value=this.bloomRadius,this.pass(this.upMat,this.up[e]),c=this.up[e];let l=this.composite.uniforms;l.tBloom.value=this.up[0].texture,l.uNear.value=t.near,l.uFar.value=t.far,l.uTime.value=n,this.pass(this.composite,i)}},uo=`
attribute vec3 color;
attribute vec4 aData;
attribute vec4 aLamp;
attribute vec4 aLamp2;
uniform float uBend;
uniform vec3 uBendCenter;
uniform float uTime;
#ifdef DYNAMIC
uniform vec4 uDynLamp;
#endif
#ifdef WALKER
// Townsfolk are posed entirely here: what each one is doing (aAct) drives a
// small skeleton — hips, knees, shoulders, elbows, head — and every vertex
// knows which bone it hangs from (aPart) and where that bone's joints are.
attribute vec4 aWalkA;     // xyz: where they stand, or one end of their walk (chunk-local); w: speed, m/s
attribute vec4 aWalkB;     // xyz: what they face, or the other end; w: phase 0..1
attribute vec4 aAct;       // x: what they are doing; y, z: its parameters; w: the figure's sideways offset
attribute vec4 aPart;      // x: bone + scale/2; y, z: its joint; w: height of the joint above it
uniform vec3 uHeadPos;     // the bicycle: people look round at it, and step out of its way
uniform vec4 uHold;        // someone being spoken to stops and turns to the rider: xy where their walk begins (world x, z), z the moment they stopped, w how far into it they are (0…1)
void rotX(inout vec3 p, inout vec3 n, float py, float pz, float a) {
  float c = cos(a), s = sin(a);
  float vy = p.y - py, vz = p.z - pz;
  p.y = py + vy * c + vz * s;
  p.z = pz - vy * s + vz * c;
  n.yz = vec2(n.y * c + n.z * s, -n.y * s + n.z * c);
}
void rotY(inout vec3 p, inout vec3 n, float a) {
  float c = cos(a), s = sin(a);
  p.xz = vec2(p.x * c + p.z * s, -p.x * s + p.z * c);
  n.xz = vec2(n.x * c + n.z * s, -n.x * s + n.z * c);
}
#endif
varying vec3 vColor;
varying vec2 vUv;
varying vec4 vData;
varying vec4 vLamp;
varying vec4 vLamp2;
varying vec3 vPos;
varying vec3 vWorld;
varying vec3 vNormal;
varying float vDist;
invariant gl_Position;
void main() {
  vec3 pos = position;
  vec3 nrm = normal;
#ifdef WALKER
  float pid = floor(aPart.x + 0.001);
  float sc = fract(aPart.x) * 2.0;                  // the figure's size (1 = a grown man)
  float mode = floor(aAct.x + 0.001);
  vec3 A = aWalkA.xyz, Bq = aWalkB.xyz;
  vec2 dAB = Bq.xz - A.xz;
  float len = max(length(dAB), 0.001);
  vec2 dir = dAB / len;
  float speed = aWalkA.w, ph = aWalkB.w;
  float tt = uTime + ph * 97.0;                     // everyone keeps their own time
  vec3 origin = A;
  float yawT = 0.0;                                 // turned this far (to the left) from the line A-B
  float g = 0.0, phi = ph * 6.2832;                 // the gait: how much, and where in the stride
  float hipL = 0.0, hipR = 0.0, kneeL = 0.0, kneeR = 0.0;
  float shL = 0.0, shR = 0.0, elL = 0.2, elR = 0.2;
  float lean = 0.02, twist = 0.0, bob = 0.0, hYaw = 0.0, hPitch = 0.0, swayX = 0.0;
  float hipY = 0.92 * sc;
  float notice = 1.0, dodge = 1.0;                  // how much they mind the bicycle
  bool held = uHold.w > 0.01 && distance((modelMatrix * vec4(A, 1.0)).xz, uHold.xy) < 0.08;      // (the one being spoken to)
  if (mode < 0.5) {
    // standing about: weight shifting from foot to foot, looking round
    swayX = 0.012 * sin(tt * 0.7);
    hYaw = 0.5 * aAct.y * sin(tt * 0.31) * sin(tt * 0.13 + 1.0);
    elL = 0.25; elR = 0.3;
  } else if (mode < 1.5) {
    // walking somewhere: there, a pause (turned to a shop window, a doorway), and back
    float tw = len / max(speed, 0.05);
    float dB = aAct.y, dA2 = abs(aAct.z), tau = 1.5708 * sign(aAct.z);
    float T = 2.0 * tw + dB + dA2;
    // (stopped to talk: their own clock stands still, so they stay where they were)
    float tWalk = held ? uHold.z : uTime;
    float u = fract(tWalk / T + ph) * T;
    float s = 0.0, ramp = 0.0, idle = 0.0;
    if (u < tw) { s = u / tw; ramp = min(u, tw - u); }
    else if (u < tw + dB) { float v = u - tw; s = 1.0; idle = 1.0; yawT = tau * (smoothstep(0.0, 0.7, v) + smoothstep(dB - 0.7, dB, v)); }
    else if (u < 2.0 * tw + dB) { float v = u - tw - dB; s = 1.0 - v / tw; ramp = min(v, tw - v); yawT = 2.0 * tau; }
    else { float v = u - 2.0 * tw - dB; idle = 1.0; yawT = tau * (2.0 - smoothstep(0.0, 0.7, v) - smoothstep(dA2 - 0.7, dA2, v)); }
    origin = mix(A, Bq, s);
    g = smoothstep(0.0, 0.5, ramp);
    if (held) g *= 1.0 - uHold.w;                     // (…and stands, rather than being caught in mid-stride)
    phi += 3.14159 * s * len / (0.78 * sc);          // (feet are planted by distance, so they never slide)
    hYaw = idle * 0.3 * sin(tt * 0.9);
    swayX = idle * 0.01 * sin(tt * 0.7);
  } else if (mode < 2.5) {
    // in conversation: one talks with his hands while the other listens and nods, turn about
    float turn = fract(uTime * 0.085 + ph);
    float speak = smoothstep(0.0, 0.06, turn) * (1.0 - smoothstep(0.5, 0.56, turn));
    shR = speak * (0.55 + 0.25 * sin(tt * 2.3));
    elR = 0.45 + speak * (1.0 + 0.45 * sin(tt * 3.1) * sin(tt * 1.3));
    elL = 0.3 + 0.35 * speak * max(sin(tt * 1.7), 0.0);
    hPitch = (1.0 - speak) * 0.11 * max(sin(tt * 2.6), 0.0) * step(0.3, sin(tt * 0.37));
    hYaw = 0.12 * sin(tt * 0.5);
    swayX = 0.014 * sin(tt * 0.6);
    lean = 0.03 + 0.03 * speak;
  } else if (mode < 3.5) {
    // seated at a table: now and then the glass comes up
    hipY = 0.50 * sc;
    float cyc = fract(uTime * (0.06 + 0.05 * fract(ph * 7.0)) + ph);
    float sip = aAct.y * smoothstep(0.0, 0.07, cyc) * (1.0 - smoothstep(0.17, 0.24, cyc));
    elL = 0.0; elR = sip * 1.3; shR = sip * 0.55;
    hPitch = -0.2 * sip + 0.05 * sin(tt * 0.4);
    hYaw = 0.25 * sin(tt * 0.23) * (1.0 - sip);
    lean = (0.06 + 0.04 * sin(tt * 0.31)) * (1.0 - aAct.z);      // (aAct.z: his hands are laid on the table — he does not rock over it, or they would go down into it)
    notice = 0.5; dodge = 0.0;
  } else if (mode < 4.5) {
    // going round: a couple waltzing (they face each other), or children chasing round the fountain
    float th = uTime * aAct.y;
    float c = cos(th), s = sin(th);
    vec2 rad = vec2(dir.x * c + dir.y * s, -dir.x * s + dir.y * c);
    origin = A + vec3(rad.x, 0.0, rad.y) * len;
    if (aAct.z < 0.5) {
      origin.xz += 1.1 * vec2(cos(uTime * 0.31 + A.x), sin(uTime * 0.31 + A.x));
      yawT = th + 3.14159;
      g = 0.42; phi = uTime * 5.2;
      shL = 1.25; elL = 0.3; shR = 1.0; elR = 1.15; lean = -0.03;
      notice = 0.0;
    } else {
      yawT = th + 1.5708 * sign(aAct.y);
      g = 1.0; phi += 3.14159 * abs(th) * len / (0.78 * sc);
      lean = 0.12; elL = 0.9; elR = 0.9;
      notice = 0.3;
    }
    dodge = 0.0;
  } else if (mode < 5.5) {
    // at work
    float w = aAct.y;
    if (w < 0.5) {            // sweeping the step
      twist = 0.32 * sin(tt * 2.4); shL = 0.5; shR = 0.62; elL = 0.6 + 0.2 * sin(tt * 2.4); elR = 0.5; lean = 0.2; hPitch = 0.25;
    } else if (w < 1.5) {     // the fiddler
      shL = 1.2; elL = 1.9; shR = 0.85 + 0.1 * sin(tt * 5.1); elR = 1.15 + 0.5 * sin(tt * 5.1); hYaw = 0.35; swayX = 0.02 * sin(tt * 1.3); twist = 0.06 * sin(tt * 1.3);
    } else if (w < 2.5) {     // the painter at his easel
      float dab = step(0.35, fract(tt * 0.11));
      shR = dab * (1.15 + 0.12 * sin(tt * 1.7)); elR = 0.3 + dab * (0.3 + 0.25 * sin(tt * 2.9)); shL = 0.25; elL = 1.2;
      hPitch = (1.0 - dab) * -0.12; lean = 0.03 - 0.05 * (1.0 - dab);
    } else if (w < 3.5) {     // crying his wares
      float up = smoothstep(0.55, 0.7, sin(tt * 0.5));
      shR = up * 2.2; elR = 0.4 + up * 0.5 * sin(tt * 6.0); elL = 0.9; shL = 0.25; hYaw = 0.4 * sin(tt * 0.27);
    } else if (w < 4.5) {     // bent over the billiard table, lining up the shot
      float strike = smoothstep(0.86, 0.9, fract(tt * 0.13)) * (1.0 - smoothstep(0.9, 0.98, fract(tt * 0.13)));
      lean = 0.85; shL = 1.5; elL = 0.2; shR = -0.45 + 0.5 * strike; elR = 1.5 - 0.5 * strike; hPitch = -0.55;
    } else {                  // the lamplighter, reaching up with his pole
      shL = 2.35 + 0.05 * sin(tt * 0.9); shR = 2.1; elL = 0.25; elR = 0.5; hPitch = -0.5; lean = -0.04;
    }
    notice = 0.35;
  } else {
    // a thing, not a person: it only stands where it was put
    lean = 0.0; notice = 0.0; dodge = 0.0;
  }
  if (g > 0.001) {
    hipL = 0.47 * g * sin(phi); hipR = -hipL;
    kneeL = g * (0.10 + 0.95 * pow(max(cos(phi - 0.55), 0.0), 2.0));
    kneeR = g * (0.10 + 0.95 * pow(max(-cos(phi - 0.55), 0.0), 2.0));
    shL -= 0.72 * hipL; shR -= 0.72 * hipR;         // arms swing against the legs
    elL += 0.2 * g; elR += 0.2 * g;
    bob = -0.04 * sc * g * sin(phi) * sin(phi);
    twist += 0.09 * g * sin(phi);
    lean += 0.035 * g;
  }
  // spoken to, they turn to face whoever is speaking (unless they are sitting down, or bent over a billiard table)
  if (held && (mode < 2.5 || (mode > 4.5 && mode < 5.5 && (aAct.y < 3.5 || aAct.y > 4.5)))) {
    vec2 toR = uHeadPos.xz - (modelMatrix * vec4(origin, 1.0)).xz;
    float lr = length(toR);
    if (lr > 0.3) {
      toR /= lr;
      float turn = atan(dir.y * toR.x - dir.x * toR.y, dot(dir, toR)) - yawT;
      yawT += atan(sin(turn), cos(turn)) * smoothstep(0.0, 1.0, uHold.w);
      dodge = 0.0;
    }
  }
  // which way they face; then the bicycle: heads turn to it, and nobody stands in its way
  float cyw = cos(yawT), syw = sin(yawT);
  vec2 f2 = vec2(dir.x * cyw + dir.y * syw, -dir.x * syw + dir.y * cyw);
  vec3 wo = (modelMatrix * vec4(origin, 1.0)).xyz;
  vec2 away = wo.xz - uHeadPos.xz;
  float dR = length(away);
  vec2 awayN = away / max(dR, 0.01);
  float level = step(abs(wo.y - uHeadPos.y + 0.85), 2.5);
  origin.xz += awayN * (0.85 * smoothstep(2.5, 0.8, dR) * dodge * level);
  float rel = atan(dot(-awayN, vec2(f2.y, -f2.x)), dot(-awayN, f2));
  hYaw = mix(hYaw, clamp(rel, -1.2, 1.2), notice * level * smoothstep(12.0, 6.0, dR) * step(abs(rel), 2.1));

  // ── the skeleton
  pos.x -= aAct.w;
  float pvY = aPart.y, pvZ = aPart.z, ppY = aPart.w;
  if (pid > 0.5 && pid < 4.5) {
    bool first = pid < 1.5 || (pid > 2.5 && pid < 3.5);
    float hipA = first ? hipL : hipR, kneeA = first ? kneeL : kneeR;
    if (pid > 2.5) { rotX(pos, nrm, pvY, pvZ, -kneeA); rotX(pos, nrm, ppY, 0.0, hipA); }
    else rotX(pos, nrm, pvY, pvZ, hipA);
  } else if (pid > 4.5 && pid < 8.5) {
    bool first = pid < 5.5 || (pid > 6.5 && pid < 7.5);
    float shA = first ? shL : shR, elA = first ? elL : elR;
    if (pid > 6.5) { rotX(pos, nrm, pvY, pvZ, elA); rotX(pos, nrm, ppY, 0.0, shA); }
    else rotX(pos, nrm, pvY, 0.0, shA);
  } else if (pid > 8.5 && pid < 9.5) {
    rotX(pos, nrm, pvY, 0.0, -hPitch);
    rotY(pos, nrm, hYaw);
  } else if (pid > 9.5 && pid < 10.5) {
    // a skirt or coat-tail swings with the leg behind each half of it
    rotX(pos, nrm, pvY, 0.0, (pos.x < 0.0 ? hipL : hipR) * 0.6 * clamp(abs(pos.x) / (0.14 * sc), 0.0, 1.0));
  } else if (pid > 10.5 && pid < 11.5) {
    // an apron: one piece, carried out by whichever leg is forward (so a knee never comes through it)
    rotX(pos, nrm, pvY, 0.0, 1.0 * max(abs(hipL), abs(hipR)));
  }
  if (pid < 0.5 || (pid > 4.5 && !(pid > 9.5 && pid < 11.5))) {
    // everything above the hips leans and turns with the trunk
    rotX(pos, nrm, hipY, 0.0, -lean);
    rotY(pos, nrm, twist * smoothstep(hipY, hipY + 0.5 * sc, pos.y));
  }
  pos.y += bob;
  pos.x += swayX + aAct.w;
  vec3 fw = vec3(f2.x, 0.0, f2.y);
  vec3 rt = vec3(f2.y, 0.0, -f2.x);
  pos = origin + rt * pos.x + vec3(0.0, pos.y, 0.0) + fw * pos.z;
  nrm = rt * nrm.x + vec3(0.0, nrm.y, 0.0) + fw * nrm.z;
#endif
  vec4 wp = modelMatrix * vec4(pos, 1.0);
  vWorld = wp.xyz;
#ifdef DYNAMIC
  vPos = wp.xyz;
  vLamp = uDynLamp;
  vLamp2 = vec4(0.0, -999.0, 0.0, 0.0);
#else
  vPos = pos;
  vLamp = aLamp;
  vLamp2 = aLamp2;
#endif
  vNormal = normalize(mat3(modelMatrix) * nrm);
  vec2 dxz = wp.xz - uBendCenter.xz;
  wp.y += uBend * dot(dxz, dxz);
  vec4 mv = viewMatrix * wp;
  vDist = length(mv.xyz);
  vColor = color;
  vUv = uv;
  vData = aData;
  gl_Position = projectionMatrix * mv;
}
`,fo=`
precision highp float;
uniform float uTime;
uniform float uStrokeDist;
uniform float uGlow;
uniform float uAlive;
uniform vec3 uFogColor;
uniform vec2 uFogRange;
uniform vec3 uMoonDir;
uniform vec3 uMoonCol;
uniform vec3 uAmbSky;
uniform vec3 uAmbGround;
uniform vec3 uWarmCol;
uniform float uHis;              // how far the town keeps to the canvas's own colours: palette.js
uniform vec3 uHeadPos;
uniform vec3 uHeadDir;
uniform float uHeadPower;
uniform sampler2D tCanvas;       // the painting itself, for the pictures hung in the gallery
varying vec3 vColor;
varying vec2 vUv;
varying vec4 vData;
varying vec4 vLamp;
varying vec4 vLamp2;
varying vec3 vPos;
varying vec3 vWorld;
varying vec3 vNormal;
varying float vDist;

${fa}
${pa}

float gIndoor = 0.0;     // 1 under a roof: no moon, no sky; the warm dusk of a lamplit room
vec3 gWarm = vec3(1.0, 0.56, 0.16);      // the lamps' colour as this surface has it (main: uWarmCol, turned toward his gold by uHis)

// One street lamp. Its pool is fully gone by 17 m, so the two lamps a surface
// carries are all the lamps that can reach it (no seams between surfaces).
void lampTerm(vec4 lamp, vec3 P, vec3 Nd, vec3 Nb, vec3 V, float shin, inout vec3 diff, inout vec3 spec) {
  vec3 toL = lamp.xyz - P;
  float d2 = dot(toL, toL);
  float att = lamp.w / (1.0 + d2 * 0.085) * smoothstep(289.0, 40.0, d2);
  if (att <= 0.0) return;
  vec3 Ld = toL * inversesqrt(d2 + 1e-3);
  float k = att * uGlow * mix(0.3, 1.0, uAlive);
  diff += gWarm * (k * (0.22 + 0.78 * max(dot(Nd, Ld), 0.0)) * 5.6);
  spec += gWarm * (k * pow(max(dot(Nb, normalize(Ld + V)), 0.0), shin) * 6.5);
}

// Light arriving at P. Ng is the true surface normal, Nb the normal of the
// ridge of paint at this spot; spill is window-light from nearby houses.
void shade(vec3 P, vec3 Pw, vec3 Ng, vec3 Nb, vec3 V, float shin, float spill, out vec3 diff, out vec3 spec) {
  vec3 Nd = normalize(mix(Ng, Nb, 0.5));
  float sky = 1.0 - gIndoor;
  diff = mix(mix(uAmbGround, uAmbSky, Nd.y * 0.5 + 0.5), vec3(0.24, 0.14, 0.06) * (0.75 + 0.25 * Nd.y), gIndoor);
  spec = vec3(0.0);
  // the moon
  diff += uMoonCol * (max(dot(Nd, uMoonDir), 0.0) * sky);
  spec += uMoonCol * (pow(max(dot(Nb, normalize(uMoonDir + V)), 0.0), shin) * 1.5 * step(0.02, dot(Ng, uMoonDir)) * sky);
  // street lamps
  lampTerm(vLamp, P, Nd, Nb, V, shin, diff, spec);
  lampTerm(vLamp2, P, Nd, Nb, V, shin, diff, spec);
  // lit windows spilling onto the street
  float sp = spill * uGlow * uAlive;
  diff += gWarm * vec3(1.0, 1.08, 1.22) * (sp * 1.05);
  // the bicycle lamp: a soft-edged cone
  vec3 toH = Pw - uHeadPos;
  float h2 = dot(toH, toH);
  vec3 dh = toH * inversesqrt(h2 + 1e-3);
  float cone = smoothstep(0.66, 0.97, dot(dh, uHeadDir));
  cone = cone * cone * uHeadPower / (1.0 + h2 * 0.011);
  vec3 headCol = gWarm * vec3(1.0, 1.06, 1.16);
  diff += headCol * (cone * (0.3 + 0.7 * max(dot(Nd, -dh), 0.0)));
  spec += headCol * (cone * pow(max(dot(Nb, normalize(V - dh)), 0.0), shin) * 2.6);
  // wet paint mirrors the sky (and the windows) at grazing angles
  float fr = pow(1.0 - max(dot(Nb, V), 0.0), 5.0);
  spec += (uAmbSky * 0.9 * sky + gWarm * (sp * 1.3 + 0.35 * gIndoor)) * fr;
}

mat2 rot2(float a) { float c = cos(a), s = sin(a); return mat2(c, -s, s, c); }

void main() {
  // nothing exists beyond the ring of hills
  if (vDist > uFogRange.y + 4.0) discard;
  float kind = floor(vData.x + 0.5);
  float seed = vData.y;
  gIndoor = step(1.5, seed);
  seed = fract(seed);
  vec3 N = normalize(vNormal);
  if (!gl_FrontFacing) N = -N;
  vec3 V = normalize(cameraPosition - vWorld);
  vec3 base = vColor;
  // how far this surface keeps to the canvas's own colours: the town's, out of doors (not its people, nor what moves)
  float his = uHis * (1.0 - gIndoor) * (kind == 14.0 ? 0.0 : 1.0);
#if defined(DYNAMIC) || defined(WALKER)
  his = 0.0;
#endif
  // (his lights are the greenish gold of his moon, where the town's lamps were orange)
  gWarm = uWarmCol * mix(vec3(1.0), vec3(1.0, 1.21, 1.06), his);
  vec2 uvx = dFdx(vUv), uvy = dFdy(vUv);
  vec3 pdx = dFdx(vPos), pdy = dFdy(vPos);

  if (kind == 15.0) {
    // a framed canvas in the gallery: the painting, hung inside itself
    vec3 c = textureGrad(tCanvas, vUv, uvx, uvy).rgb;
    c = mix(c / 12.92, pow((c + 0.055) / 1.055, vec3(2.4)), step(vec3(0.04045), c));
    vec3 dC, sC;
    shade(vPos, vWorld, N, N, V, 24.0, 0.5, dC, sC);
    vec3 colC = c * (dC * 1.15 + 0.22 * uAlive) + sC * 0.05;
    float fogC = pow(smoothstep(uFogRange.x, uFogRange.y, vDist), 1.5);
    gl_FragColor = vec4(mix(colC, uFogColor, fogC * 0.97), 1.0);
    return;
  }

  if (kind == 18.0) {
    // a gold prism: polished metal, each face mirroring warm lamplight below
    // and the pale sky above, with a hard glint as it turns
    vec3 gold = vec3(1.0, 0.74, 0.22);
    vec3 Rf = reflect(-V, N);
    vec3 env = mix(vec3(0.50, 0.24, 0.04), vec3(1.0, 0.93, 0.66), smoothstep(-0.35, 0.85, Rf.y));
    float facet = 0.6 + 0.4 * dot(N, normalize(vec3(0.35, 0.8, 0.25)));
    float glint = pow(max(dot(Rf, normalize(vec3(0.3, 0.75, 0.4))), 0.0), 22.0) + pow(max(dot(Rf, normalize(vec3(-0.5, 0.5, -0.6))), 0.0), 40.0);
    float rimP = pow(1.0 - max(dot(N, V), 0.0), 3.0);
    vec3 cP = gold * (0.45 * facet + 0.85 * env) + vec3(1.0, 0.95, 0.78) * (glint * 2.4 + rimP * 0.8);
    float fogP = pow(smoothstep(uFogRange.x, uFogRange.y, vDist), 1.5);
    gl_FragColor = vec4(cP * vData.z * mix(0.35, 1.0, uAlive) * uGlow * (1.0 - fogP * 0.8), 1.0);
    return;
  }

  if (kind == 10.0) {            // pure light: lantern glass, lamps
    gl_FragColor = vec4(base * vData.z * mix(0.3, 1.0, uAlive) * uGlow, 1.0);
    return;
  }

  // ───────────── stroke space for this kind of surface
  vec2 p = vUv;
  vec2 size = vec2(0.30, 0.075);
  float valVar = 0.55, hueVar = 0.35, accent = 0.0;
  float gloss = 0.2, shin = 26.0, relief = 0.8, spill = 0.0, rim = 0.0;
  float soft = 0.0;          // how nearly the ground under the strokes matches them (flesh is laid smooth)
  float mute = 0.0;          // how much of its strength a colour gives up when the town keeps to his canvas (his greens are sage and olive)
  vec3 accentCol = vec3(0.0);
  vec3 emis = vec3(0.0);
  float halo = 0.0;

  if (kind == 1.0) {
    // ── walls: horizontal strokes; windows, shutters and doors are painted in
    float stories = vData.z;
    float flags = vData.w;
    float litP = fract(flags);
    float fl = floor(flags + 1e-4);
    bool shop = fl == 1.0;
    bool church = fl == 2.0;
    vec2 w = vUv;
    p = w * vec2(2.7, 3.0);
    p.y += 0.035 * sin(p.x * 3.1 + seed * 40.0);
    size = vec2(0.48, 0.105);
    valVar = 0.5; hueVar = 0.30;
    gloss = 0.16; shin = 18.0; relief = 0.85;
    // (a wall with real openings carries no painted ones: its p2 is the glow of the windows beside it)
    if (stories < 0.5) spill = flags;
    if (w.y > 0.0 && w.y < stories) {
      vec2 cell = floor(w);
      vec2 f = w - cell;
      bool ground = cell.y < 0.5;
      float r1 = hash21(cell * 1.31 + seed * 91.7);
      float r2 = hash21(cell * 2.17 + seed * 37.3 + 5.0);
      float r3 = hash21(cell * 3.71 + seed * 11.9 + 9.0);
      bool door = ground && !shop && !church && r2 < 0.26;
      vec2 hs = vec2(0.19, 0.27);
      vec2 ctr = vec2(0.5, 0.52);
      if (shop && ground) { hs = vec2(0.40, 0.31); ctr = vec2(0.5, 0.43); }
      if (door) { hs = vec2(0.17, 0.37); ctr = vec2(0.5, 0.37); }
      if (church) { hs = vec2(0.15, 0.36); ctr = vec2(0.5, 0.48); }
      vec2 c = (f - ctr) / hs;
      float wob = (vnoise(w * 5.0 + seed * 13.0) - 0.5) * 0.22;
      float bx = abs(c.x), by = abs(c.y);
      // doors and church windows have a round head
      if ((door || church) && c.y > 0.45) { bx = length(vec2(c.x, (c.y - 0.45) / 0.55)); by = bx; }
      float box = max(bx, by) + wob;
      float inside = smoothstep(1.0, 0.86, box);
      float trim = smoothstep(1.52, 1.38, box) * (1.0 - inside);
      float litOn = step(r1, litP * mix(0.35, 1.0, uAlive));
      if (shop && ground) litOn = step(r1, 0.92 * uAlive + 0.05);
      // shutters either side of ordinary windows
      if (!door && !shop && !church) {
        float sh = step(1.55, abs(c.x)) * step(abs(c.x), 2.42) * step(abs(c.y), 1.12 + wob);
        float sr = hash11(seed * 53.0 + 2.0);
        vec3 shCol = sr < 0.35 ? vec3(0.030, 0.150, 0.110) : sr < 0.65 ? vec3(0.030, 0.090, 0.260) : sr < 0.85 ? mix(vec3(0.200, 0.045, 0.030), vec3(0.130, 0.085, 0.030), his) : vec3(0.020, 0.160, 0.190);
        base = mix(base, shCol, sh * step(hash11(seed * 7.0), 0.75));
      }
      vec3 trimCol = mix(base * 1.7 + 0.03, vec3(0.42, 0.38, 0.30), 0.4);
      base = mix(base, trimCol, trim * 0.85);
      if (door) {
        vec3 wood = mix(vec3(0.090, 0.040, 0.020), vec3(0.020, 0.070, 0.060), step(0.5, r3));
        base = mix(base, wood, inside);
      } else {
        // glass: dark when nobody is home, burning (and flickering a little) when someone is
        float mull = max(smoothstep(0.10, 0.03, abs(c.x)), smoothstep(0.09, 0.03, abs(c.y - 0.12)));
        if (shop && ground) mull = max(smoothstep(0.04, 0.01, abs(fract(c.x * 1.5 + 0.5) - 0.5)), smoothstep(0.06, 0.02, abs(c.y - 0.62)));
        vec3 warm = mix(vec3(1.00, 0.80, 0.32), mix(vec3(1.00, 0.48, 0.11), vec3(1.00, 0.63, 0.15), his), r2);
        if (church) warm = mix(warm, vec3(0.55, 0.75, 1.0), 0.35 * step(0.5, r3));
        float flick = 1.0 + 0.07 * sin(uTime * (2.0 + 5.0 * r1) + r2 * 40.0) + 0.04 * sin(uTime * 11.0 * r3 + r1 * 9.0);
        float bright = (1.7 + 2.4 * r3) * (shop && ground ? 1.25 : 1.0) * flick;
        base = mix(base, vec3(0.012, 0.020, 0.050), inside);
        emis = warm * bright * inside * litOn * (1.0 - 0.72 * mull) * (0.80 + 0.35 * f.y);
        halo = litOn * (1.0 - inside) * exp(-max(box - 1.0, 0.0) * 2.3) * (shop && ground ? 1.5 : 1.0);
        gloss = mix(gloss, 0.9, inside * (1.0 - litOn));         // dark panes glint
      }
      // far away, a house is a mood of light rather than countable panes
      float farK = smoothstep(150.0, 300.0, vDist);
      emis = mix(emis, vec3(1.0, 0.62, 0.20) * (litP * 0.42) * uAlive, farK);
    }
  } else if (kind == 2.0) {
    // ── roofs: strokes run down the slope like courses of tile
    p = vec2(vUv.y + 0.06 * sin(vUv.x * 2.3 + seed * 30.0), vUv.x);
    size = vec2(0.66, 0.17);
    valVar = 0.75; hueVar = 0.40;
    accent = 0.10; accentCol = base * vec3(1.7, 1.5, 1.2) + 0.02;
    gloss = 0.5; shin = 22.0; relief = 1.0;
  } else if (kind == 3.0) {
    // ── cobbles: stubby dabs in every colour the lamps can find, slick as if after rain
    p = vData.z > 0.5 ? vUv.yx : vUv;
    p.y += 0.07 * sin(p.x * 1.9 + p.y * 0.7);
    size = vec2(0.34, 0.185);
    // (…and, kept to his canvas, in its blues, with a dab here and there of the pale green-gold his sky is laid in)
    valVar = 0.85; hueVar = mix(0.9, 0.5, his);
    accent = 0.16; accentCol = mix(mix(vec3(0.30, 0.13, 0.26), vec3(0.35, 0.41, 0.26), his), vec3(0.10, 0.16, 0.34), step(0.5, hash21(floor(p * 3.0))));
    gloss = 0.62; shin = 40.0; relief = 0.95; spill = vData.w;
  } else if (kind == 4.0) {
    // ── a dirt road: long ochre and rose streaks
    p = vData.z > 0.5 ? vUv.yx : vUv;
    p.y += 0.22 * sin(p.x * 0.55 + p.y * 0.3);
    size = vec2(0.95, 0.15);
    valVar = 0.6; hueVar = 0.5;
    accent = 0.12; accentCol = mix(vec3(0.32, 0.16, 0.20), vec3(0.30, 0.25, 0.11), his);
    gloss = 0.14; shin = 14.0; relief = 0.9; spill = vData.w;
  } else if (kind == 5.0 || kind == 13.0) {
    // ── grass: short curling strokes
    if (kind == 5.0 && vData.z > 0.5) {
      // (in the other canvases — portals/ — the strokes are turned this way and that by bending the page they
      // are laid on, a little, everywhere: turned about one far-off point, as the town's are, they wind into
      // rings round wherever that point happens to be)
      p = rot2(seed * 6.2832) * vUv;
      p += 1.3 * vec2(sin(p.y * 0.37 + 1.7 * sin(p.x * 0.11)), sin(p.x * 0.29 + 1.3 * sin(p.y * 0.13)));
    } else {
      float a = vnoise(vUv * 0.07 + seed) * 6.28;
      p = rot2(a) * vUv;
    }
    p.y += 0.25 * sin(p.x * 1.1);
    size = vec2(0.72, 0.125);
    valVar = 0.8; hueVar = 0.6;
    accent = 0.14; accentCol = mix(vec3(0.16, 0.26, 0.05), vec3(0.19, 0.24, 0.10), his);
    mute = 0.38;
    gloss = 0.10; shin = 12.0; relief = 0.9; spill = vData.w;
  } else if (kind == 6.0) {
    // ── wheat: waves of gold
    if (vData.z > 0.0) {
      // (…laid as the grass of those canvases is: see above)
      p = rot2(0.5 + seed) * vUv;
      p += 1.6 * vec2(sin(p.y * 0.23 + 1.5 * sin(p.x * 0.07)), sin(p.x * 0.19 + 1.2 * sin(p.y * 0.09)));
    } else {
      float a = 0.5 + (vnoise(vUv * 0.03 + seed * 3.0) - 0.5) * 1.6;
      p = rot2(a) * vUv;
    }
    // (in the other canvases — portals/ — the wheat is in the wind, and vData.z says how much: the strokes run
    // along themselves and back in long gusts, and the swell they lie in travels. In the town it is 0.)
    p.x += vData.z * 0.30 * sin(uTime * 1.05 + vnoise(vUv * 0.06 + 2.0) * 9.0);
    p.y += 0.45 * sin(p.x * 0.6 + vnoise(vUv * 0.11) * 5.0 + vData.z * uTime * 0.6);
    size = vec2(1.15, 0.11);
    valVar = 0.75; hueVar = 0.45;
    accent = 0.10; accentCol = vec3(0.10, 0.20, 0.10);
    gloss = 0.16; shin = 14.0; relief = 1.0; spill = vData.w;
  } else if (kind == 7.0) {
    // ── flagstones of a square
    p = vUv;
    p.y += 0.05 * sin(p.x * 1.3);
    size = vec2(0.58, 0.30);
    valVar = 0.7; hueVar = mix(0.7, 0.45, his);
    accent = 0.12; accentCol = mix(vec3(0.26, 0.14, 0.24), vec3(0.30, 0.35, 0.27), his);
    gloss = 0.55; shin = 42.0; relief = 0.85; spill = vData.w;
  } else if (kind == 8.0) {
    // ── cypress: dark flames licking upward
    p = vec2(vUv.y + 0.6 * sin(vUv.x * 1.1 + vUv.y * 0.35), vUv.x + 0.35 * sin(vUv.y * 0.8 + seed * 20.0));
    size = vec2(1.15, 0.20);
    valVar = 1.0; hueVar = 0.5;
    accent = 0.07; accentCol = vec3(0.12, 0.07, 0.02);
    gloss = 0.14; shin = 10.0; relief = 1.2; rim = 0.35;
  } else if (kind == 9.0) {
    // ── olive and plane trees: curls, like the grove behind the village
    float a = vnoise(vUv * 0.9 + seed * 9.0) * 9.0;
    p = rot2(a) * vUv;
    size = vec2(0.52, 0.15);
    valVar = 1.0; hueVar = 0.7;
    accent = 0.20; accentCol = vec3(0.22, 0.32, 0.36);
    mute = 0.25;
    gloss = 0.16; shin = 10.0; relief = 1.2; rim = 0.3;
  } else if (kind == 11.0) {
    // ── dressed stone
    p = vUv;
    p.y += 0.03 * sin(p.x * 2.7);
    size = vec2(0.56, 0.15);
    valVar = 0.55; hueVar = 0.45;
    accent = 0.08; accentCol = vec3(0.30, 0.34, 0.40);
    gloss = 0.28; shin = 20.0; relief = 0.9;
  } else if (kind == 12.0) {
    // ── cloth / awnings: stripes
    p = vUv;
    size = vec2(0.40, 0.09);
    base = mix(base, vec3(0.62, 0.56, 0.42), step(0.5, fract(vUv.x * 1.6)) * 0.8);
    valVar = 0.4; hueVar = 0.2;
    gloss = 0.06; relief = 0.6;
  } else if (kind == 19.0) {
    // ── water by night (the other canvases: portals/): short level strokes laid side by side, every row of
    // them slipping along at a pace of its own — prussian blue, cobalt, and a green where the lamps get into it
    p = vUv;
    // (the rows slide past one another — some one way, some the other, never in step — and the whole lifts and
    // settles in a slow swell with a quicker chop on it)
    p.x += uTime * 0.11 + 0.75 * sin(p.y * 0.83 + uTime * 0.55) + 0.4 * sin(p.y * 2.7 - uTime * 0.8) + 0.18 * sin(p.y * 6.1 + uTime * 1.3);
    p.y += 0.10 * sin(p.x * 0.7 + uTime * 0.7) + 0.05 * sin(p.x * 2.1 - uTime * 1.15 + p.y * 0.4);
    size = vec2(0.92, 0.105);
    valVar = 1.0; hueVar = 0.5;
    accent = 0.15; accentCol = vec3(0.04, 0.26, 0.26);
    gloss = 0.85; shin = 46.0; relief = 0.9; spill = vData.w;
  } else if (kind == 20.0) {
    // ── a pale road between fields (the other canvases): long strokes of grey and lilac running with it, and
    // green and straw-yellow ones laid in among them
    p = vData.z > 0.5 ? vUv.yx : vUv;
    p.y += 0.3 * sin(p.x * 0.42 + p.y * 0.25);
    size = vec2(1.35, 0.14);
    valVar = 0.5; hueVar = 0.35;
    accent = 0.24; accentCol = mix(vec3(0.16, 0.36, 0.13), vec3(0.62, 0.50, 0.16), step(0.5, hash21(floor(p * vec2(0.8, 6.0)))));
    gloss = 0.16; shin = 14.0; relief = 0.9; spill = vData.w;
  } else if (kind == 16.0 || kind == 17.0) {
    // ── things set into a wall. uv runs 0..1 across the opening; its true size
    // in metres comes from how fast the surface moves under it.
    vec2 g = vUv;
    vec3 gpx = pdx, gpy = pdy;
    float gdet = uvx.x * uvy.y - uvy.x * uvx.y;
    float ginv = abs(gdet) > 1e-12 ? 1.0 / gdet : 0.0;
    vec3 gT = (gpx * uvy.y - gpy * uvx.y) * ginv;          // one opening-width, in space
    vec3 gB = (gpy * uvx.x - gpx * uvy.x) * ginv;          // one opening-height
    float gw = clamp(length(gT), 0.05, 12.0), gh = clamp(length(gB), 0.05, 12.0);
    float type = floor(vData.z + 0.5);
    if (kind == 17.0) {
      // ── joinery: louvred shutters, panelled doors, boarded doors
      vec2 q = g * vec2(gw, gh);                            // metres across the leaf
      float edge = min(min(q.x, gw - q.x), min(q.y, gh - q.y));
      float stile = smoothstep(0.075, 0.06, edge);          // the frame round the leaf
      if (type < 0.5) {
        float sl = fract(q.y / 0.058);
        float slat = mix(0.42, 1.12, smoothstep(0.0, 0.75, sl)) * (1.0 - 0.5 * smoothstep(0.86, 1.0, sl));
        float midRail = smoothstep(0.055, 0.04, abs(q.y - gh * 0.5));
        base *= mix(slat, 1.0, max(stile, midRail));
        p = vec2(q.x, q.y); size = vec2(0.22, 0.045);
      } else if (type < 1.5) {
        vec2 pg = vec2(q.x / gw * 2.0, q.y / gh * 3.0);
        vec2 pf = abs(fract(pg) - 0.5);
        float inset = smoothstep(0.40, 0.36, max(pf.x, pf.y * 1.0));
        float bevel = smoothstep(0.30, 0.36, max(pf.x, pf.y)) * inset;
        base *= mix(1.0, 0.80, inset) * (1.0 - 0.35 * bevel);
        base = mix(base, base * 1.18, stile * 0.5);
        // a brass knob
        base = mix(base, vec3(0.75, 0.52, 0.16), smoothstep(0.045, 0.03, length(q - vec2(gw - 0.13, gh * 0.46))));
        p = vec2(q.y, q.x); size = vec2(0.26, 0.05);
      } else {
        float bd = fract(q.x / 0.17);
        base *= 1.0 - 0.45 * smoothstep(0.10, 0.0, min(bd, 1.0 - bd));
        base *= 0.9 + 0.2 * hash11(floor(q.x / 0.17) + seed * 31.0);
        // ledges and strap hinges
        float ledge = max(smoothstep(0.07, 0.05, abs(q.y - gh * 0.2)), smoothstep(0.07, 0.05, abs(q.y - gh * 0.82)));
        base = mix(base, vec3(0.020, 0.020, 0.026), ledge * 0.85);
        p = vec2(q.y, q.x); size = vec2(0.30, 0.05);
      }
      valVar = 0.34; hueVar = 0.2;
      gloss = 0.30; shin = 20.0; relief = 0.6;
    } else {
      // ── a window: sash and glazing bars, curtains, and — when somebody is
      // home — the lit room itself, found by sending the view ray into a box
      float r1 = fract(vData.w);
      float r2 = hash11(r1 * 91.7 + seed * 13.0), r3 = hash11(r1 * 37.3 + seed * 71.0 + 3.0);
      float on = step(0.5, vData.w) * step(r1 * 0.97, mix(0.35, 1.0, uAlive));
      vec2 q = g * vec2(gw, gh);
      // which part of the quad is glass at all
      float hole = 1.0;
      vec2 panes = vec2(2.0, 3.0);
      float fr = 0.055;
      if (type > 0.5 && type < 1.5) { panes = vec2(max(1.0, floor(gw / 0.95)), 1.0); fr = 0.07; }
      else if (type < 2.5) panes = vec2(2.0, 4.0);
      else if (type < 3.5) {
        // a lancet: a pointed head
        panes = vec2(2.0, floor(gh / 0.55));
        float hy = max(q.y - (gh - gw * 0.95), 0.0) / (gw * 0.95);
        hole = step(abs(g.x - 0.5) * 2.0, 1.0 - hy * hy * 0.95);
        fr = 0.07;
      } else if (type < 4.5) panes = vec2(2.0, 2.0);
      else if (type < 5.5) {
        // a fanlight: half a wheel over the door
        vec2 c = vec2(q.x - gw * 0.5, q.y);
        float rr = min(gw * 0.5, gh * 1.02);
        hole = step(length(c), rr);
        float ang = atan(c.y, c.x);
        panes = vec2(1.0);
        float spoke = smoothstep(0.03, 0.02, abs(fract(ang / 0.5236 + 0.5) - 0.5) * 0.5236 * max(length(c), 0.05));
        hole *= 1.0 - max(spoke, smoothstep(0.035, 0.02, abs(length(c) - rr * 0.38)));
        fr = 0.045;
      } else {
        // a round window: a wheel of eight lights (a rose, a clock face)
        vec2 c = (g - 0.5) * vec2(gw, gh);
        float rr = min(gw, gh) * 0.5;
        float ang = atan(c.y, c.x);
        hole = step(length(c), rr * 0.97);
        float spoke = smoothstep(0.035, 0.022, abs(fract(ang / 0.7854 + 0.5) - 0.5) * 0.7854 * max(length(c), 0.05));
        hole *= 1.0 - max(spoke * step(rr * 0.25, length(c)), smoothstep(0.04, 0.025, abs(length(c) - rr * 0.25)));
        panes = vec2(1.0); fr = 0.0;
      }
      float edge = min(min(q.x, gw - q.x), min(q.y, gh - q.y));
      float frameM = 1.0 - smoothstep(fr * 0.8, fr, edge);
      vec2 pg = (q - fr) / (vec2(gw, gh) - 2.0 * fr) * panes;
      vec2 pd = (0.5 - abs(fract(pg) - 0.5)) * (vec2(gw, gh) - 2.0 * fr) / panes;   // metres to the nearest bar
      float bar = 1.0 - smoothstep(0.016, 0.024, min(pd.x + step(panes.x, 1.5) * 9.0, pd.y + step(panes.y, 1.5) * 9.0));
      // the two leaves of a casement meet in a thicker stile
      if (type < 0.5 || (type > 1.5 && type < 2.5)) bar = max(bar, 1.0 - smoothstep(0.028, 0.038, abs(q.x - gw * 0.5)));
      float wood = max(max(frameM, bar), 1.0 - hole);

      // the room
      vec3 Tn = gT / gw, Bn = gB / gh;
      vec3 rd = -V;
      vec3 dir = vec3(dot(rd, Tn), dot(rd, Bn), max(-dot(rd, N), 0.04));
      vec3 ro = vec3(q.x, q.y, 0.0);
      bool shopW = type > 0.5 && type < 1.5;
      bool tall = type > 1.5 && type < 2.5;
      float sideM = shopW ? 0.25 : 0.7 + 1.9 * r2;
      float xl = -sideM, xr = gw + sideM * (0.5 + r3);
      float yfl = shopW ? -0.5 : tall ? -0.03 : -0.95;
      float yc = gh + (shopW ? 0.25 : 0.55);
      float zb = shopW ? 1.5 + 0.9 * r3 : 2.6 + 2.4 * r3;
      float tx = dir.x > 0.0 ? (xr - ro.x) / dir.x : (xl - ro.x) / min(dir.x, -1e-4);
      float ty = dir.y > 0.0 ? (yc - ro.y) / dir.y : (yfl - ro.y) / min(dir.y, -1e-4);
      float tz = zb / dir.z;
      float tHit = min(tx, min(ty, tz));
      vec3 hp = ro + dir * tHit;
      vec3 paper = r2 < 0.3 ? vec3(0.66, 0.44, 0.18) : r2 < 0.55 ? vec3(0.58, 0.26, 0.20) : r2 < 0.8 ? vec3(0.38, 0.46, 0.30) : vec3(0.30, 0.40, 0.56);
      vec3 roomC;
      vec2 bwall = vec2((hp.x - xl) / (xr - xl), (hp.y - yfl) / (yc - yfl));
      if (tHit == ty) roomC = dir.y > 0.0 ? vec3(0.80, 0.70, 0.52) : vec3(0.30, 0.17, 0.08) * (0.8 + 0.4 * step(0.5, fract(hp.x * 3.0)));
      else if (tHit == tx) roomC = paper * 0.82 * (bwall.y < 0.3 ? 0.6 : 1.0);
      else {
        roomC = paper * (bwall.y < 0.3 ? 0.6 : 1.0);
        if (shopW) {
          // shelves of wares
          vec2 sc = bwall * vec2(floor(2.0 + (xr - xl) * 3.0), 4.0);
          float item = hash21(floor(sc) + seed * 91.0);
          vec2 sf = fract(sc);
          vec3 ware = item < 0.3 ? vec3(0.85, 0.30, 0.12) : item < 0.55 ? vec3(0.90, 0.75, 0.25) : item < 0.8 ? vec3(0.25, 0.50, 0.30) : vec3(0.30, 0.40, 0.75);
          float it = step(0.12, sf.x) * step(sf.x, 0.88) * step(0.06, sf.y) * step(sf.y, 0.45 + 0.4 * hash21(floor(sc) + 7.0));
          roomC = mix(roomC * 0.8, ware, it);
          roomC = mix(roomC, vec3(0.20, 0.11, 0.05), step(sf.y, 0.06));
        } else {
          // something on the far wall: a picture, a doorway
          float pic = step(abs(bwall.x - (0.28 + 0.44 * r1)), 0.10) * step(abs(bwall.y - 0.64), 0.11);
          roomC = mix(roomC, mix(vec3(0.10, 0.18, 0.40), vec3(0.85, 0.68, 0.22), step(0.5, fract(bwall.y * 11.0 + bwall.x * 7.0))), pic);
          float dr = step(abs(bwall.x - (0.80 - 0.56 * r3)), 0.085) * step(bwall.y, 0.74) * step(0.45, r1);
          roomC = mix(roomC, vec3(0.14, 0.08, 0.04), dr);
        }
      }
      // its lamp: hung from the ceiling, lighting the room from within
      vec3 lampP = vec3(mix(xl, xr, 0.32 + 0.36 * r1), yc - 0.6, zb * 0.5);
      float ld = length(hp - lampP);
      vec3 room = roomC * (0.30 + 2.6 / (1.0 + ld * ld * 0.6));
      float tl = clamp(dot(lampP - ro, dir) / dot(dir, dir), 0.0, tHit);
      float dl = length(ro + dir * tl - lampP);
      room += vec3(1.0, 0.86, 0.52) * exp(-dl * dl * 22.0) * 3.2;
      // somebody at home, crossing the room now and then
      if (r3 > 0.72 && !shopW) {
        float zs = zb * (0.28 + 0.35 * r2);
        vec3 sp = ro + dir * (zs / dir.z);
        float px = mix(xl + 0.4, xr - 0.4, 0.5 + 0.46 * sin(uTime * (0.07 + 0.08 * r1) + r1 * 40.0));
        vec2 f = vec2(sp.x - px, sp.y - yfl);
        float fig = step(length((f - vec2(0.0, 1.57)) / vec2(0.105, 0.125)), 1.0);
        fig = max(fig, step(abs(f.x), mix(0.16, 0.235, smoothstep(0.95, 1.38, f.y))) * step(f.y, 1.45));
        if (zs / dir.z < tHit) room = mix(room, vec3(0.05, 0.03, 0.025), fig);
      }
      // curtains, in the plane of the glass
      float cw = shopW ? 0.0 : r2 < 0.2 ? 0.52 : 0.08 + 0.24 * r3;
      float cur = (1.0 - smoothstep(cw - 0.012, cw, g.x)) + smoothstep(1.0 - cw, 1.0 - cw + 0.012, g.x);
      cur = min(cur, 1.0) * step(0.0005, cw);
      float fold = 0.70 + 0.30 * sin(q.x * 44.0 + sin(q.y * 4.0 + r1 * 9.0) * 1.6 + r1 * 30.0);
      vec3 curC = r1 < 0.4 ? vec3(0.95, 0.84, 0.62) : r1 < 0.7 ? vec3(0.82, 0.34, 0.20) : vec3(0.50, 0.64, 0.42);
      vec3 lightCol = mix(vec3(1.00, 0.78, 0.40), vec3(1.00, 0.58, 0.22), r2);
      if (type > 2.5 && type < 3.5) {
        // stained glass: lozenges of colour, lit from the nave
        vec2 lz = vec2(q.x + q.y, q.x - q.y) * 5.5;
        float hsh = hash21(floor(lz) + seed * 40.0);
        room = (hsh < 0.3 ? vec3(0.85, 0.20, 0.12) : hsh < 0.55 ? vec3(0.15, 0.35, 0.90) : hsh < 0.8 ? vec3(0.95, 0.75, 0.20) : vec3(0.20, 0.65, 0.40)) * 1.5;
        cur = 0.0; lightCol = vec3(1.0, 0.86, 0.62);
      } else if (type > 5.5 && r1 > 0.9) {
        // the clock face
        vec2 c = (g - 0.5) * 2.0;
        float ang = atan(c.x, c.y);
        float tick = smoothstep(0.035, 0.02, abs(fract(ang / 0.5236 + 0.5) - 0.5)) * step(0.72, length(c)) * step(length(c), 0.9);
        float h1 = smoothstep(0.05, 0.03, abs(c.x * 0.7071 + c.y * 0.7071)) * step(0.0, c.y - c.x) * step(length(c), 0.52);
        float h2 = smoothstep(0.04, 0.025, abs(c.x)) * step(0.0, c.y) * step(length(c), 0.74);
        room = mix(vec3(1.0, 0.94, 0.78) * 0.9, vec3(0.03), max(tick, max(h1, h2)));
        cur = 0.0; lightCol = vec3(1.0, 0.92, 0.74); wood = 1.0 - hole;
      }
      vec3 lit = mix(room, curC * fold * 1.15, cur * 0.93);
      float bright = (1.25 + 0.9 * r3) * (shopW ? 1.5 : 1.0) * (1.0 + 0.05 * sin(uTime * (2.0 + 5.0 * r1) + r2 * 40.0));
      // far off, the room melts back into a plain warm pane
      float farK = smoothstep(60.0, 150.0, vDist);
      lit = mix(lit, vec3(0.62, 0.52, 0.40) * (0.9 + 0.8 * r3), farK);
      emis = lit * lightCol * bright * on * (1.0 - wood);
      // dark glass keeps a ghost of its curtains and glints with the sky
      vec3 glass = mix(vec3(0.012, 0.020, 0.050), curC * 0.05, cur * 0.8);
      base = mix(glass, base, wood);
      gloss = mix(0.9, 0.25, wood); shin = mix(60.0, 20.0, wood);
      p = vec2(q.y, q.x); size = vec2(0.20, 0.045);
      valVar = 0.3; hueVar = 0.2; relief = mix(0.25, 0.6, wood);
      halo = 0.0;
    }
  } else if (kind == 14.0) {
    // ── figures (the rider, townsfolk): fine strokes that follow the form,
    // clean enough to read as a person, with the moon catching every edge
    p = vUv;
    size = vec2(0.105, 0.026) * clamp(vData.z, 0.3, 4.0);
    valVar = 0.26; hueVar = 0.14;
    gloss = 0.16; shin = 16.0; relief = 0.5; rim = 1.0;
#ifdef WALKER
    // townsfolk are met face to face: flesh and small things (fine strokes) are laid smooth and even,
    // and their cloth a little closer than a wall's — or a face reads as scales
    float skinK = smoothstep(0.9, 0.55, vData.z);
    valVar = mix(0.22, 0.10, skinK); hueVar = mix(0.12, 0.05, skinK);
    soft = mix(0.35, 0.9, skinK);
#endif
  } else {
    // small hard things (ironwork, the bicycle): finer strokes, quieter colour
    p = vUv;
    size = vec2(0.20, 0.05) * clamp(vData.z, 0.3, 4.0);
    valVar = 0.36; hueVar = 0.22;
    gloss = 0.45; shin = 30.0; relief = 0.5; rim = 0.4;
  }

  // ───────────── lay the dabs: three scales, overlapping, each a little askew
  // (a hand never lays two strokes parallel, and it is what stops walls reading as brickwork)
  p += (vec2(vnoise(p * (0.55 / size.x) + seed * 3.0), vnoise(p * (0.55 / size.x) + 7.3 + seed)) - 0.5) * size * vec2(0.9, 1.5);
  float lod = log2(max(vDist / uStrokeDist, 0.5));
  float l0 = floor(lod), lf = lod - l0;
  float cov1 = mix(0.34, 1.0, lf), cov2 = mix(0.0, 0.34, lf);
  relief *= mix(1.0, 0.45, smoothstep(50.0, 220.0, vDist));

  // The surface directions a step along / across the stroke corresponds to:
  // lets each dab be lit at its own centre and carry its own relief.
  vec2 jx = dFdx(p), jy = dFdy(p);
  float det = jx.x * jy.y - jy.x * jx.y;
  float inv = abs(det) > 1e-10 ? 1.0 / det : 0.0;
  vec3 Tu = (pdx * jy.y - pdy * jx.y) * inv;
  vec3 Tv = (pdy * jx.x - pdx * jy.x) * inv;
  float tl = dot(Tu, Tu) * dot(Tv, Tv);
  bool frame = tl > 1e-12 && tl < 1e12;

  vec3 dPix, sPix;
  shade(vPos, vWorld, N, N, V, shin, spill, dPix, sPix);
  vec3 under = mix(hueShift(base, -0.25) * 0.60, base * 0.94, soft) * dPix;

  // top-most strokes first; stop as soon as the surface is covered
  vec3 col = vec3(0.0);
  float alpha = 0.0;
  for (int k = 2; k >= 0; k--) {
    // every stroke scale ("level") has one fixed pattern in the world, so a
    // surface keeps its strokes as it moves through the distance bands
    float lev = l0 + float(k);
    float sc = exp2(lev);
    mat2 R = rot2((mod(lev, 3.0) - 1.0) * 0.19);
    vec2 pk = R * p + size * sc * 0.37 * mod(lev, 2.0);
    Dab d = dab(pk, size * sc, seed + lev * 0.37);
    float wgt = d.mask;
    if (k == 0) wgt *= 1.0 - smoothstep(0.72, 1.0, lf);                  // the finest scale bows out as the next takes over
    else wgt *= smoothstep(d.id2 - 0.04, d.id2 + 0.04, k == 1 ? cov1 : cov2);
    if (wgt < 0.003) continue;

    // where this dab's centre lies on the surface
    vec2 dp = (d.center - pk) * R;
    vec2 sxy = vec2(jy.y * dp.x - jy.x * dp.y, -jx.y * dp.x + jx.x * dp.y) * inv;
    vec3 dP = pdx * sxy.x + pdy * sxy.y;
    float lim = size.x * sc * 1.5;
    float dl = length(dP);
    if (dl > lim) dP *= lim / dl;

    // the ridge of paint: rounded across, falling away at the ends, furrowed by the bristles
    vec3 Nb = N;
    if (frame) {
      vec3 along = normalize(Tu * R[0][0] + Tv * R[1][0]);
      vec3 across = normalize(Tu * R[0][1] + Tv * R[1][1]);
      float furrow = sin(d.across * 7.0 + d.id * 40.0);
      Nb = normalize(N + (across * (d.across * 0.62 + furrow * 0.20) + along * ((d.along - 0.5) * 0.55)) * relief);
    }

    vec3 dDab, sDab;
    shade(vPos + dP, vWorld + dP, N, Nb, V, shin, spill, dDab, sDab);
    // partly its own light (pools break into strokes), partly the spot's (they still fall off smoothly)
    float own = k == 0 ? 0.50 : k == 1 ? 0.36 : 0.24;
    vec3 L = mix(dPix, dDab, own);

    vec3 a = base * (1.0 + (d.id - 0.5) * valVar);
    a = hueShift(a, (d.id2 - 0.5) * hueVar);
    if (d.id2 < accent) a = mix(a, accentCol, 0.65);
    a = mix(a, vec3(dot(a, vec3(0.2126, 0.7152, 0.0722))), mute * his);
    // in lamplight colours run hot; in shadow they run to violet and blue
    float warmth = clamp(dot(L, vec3(0.5, 0.2, -0.6)), 0.0, 1.0);
    a = mix(a, a * mix(vec3(1.22, 1.03, 0.78), vec3(1.12, 1.08, 0.80), his) + vec3(0.02, 0.0, 0.0) * (1.0 - his), warmth * (0.4 + 0.6 * d.id));
    a = max(a, vec3(0.0));
    float bristle = vnoise(vec2(d.along * 3.0 + d.id * 17.0, d.across * 3.2 + d.id * 5.0));
    vec3 c = a * L * (0.88 + 0.22 * bristle) + sDab * gloss * (0.35 + 0.9 * d.id) * (0.35 + a * 2.2);

    col += (1.0 - alpha) * wgt * c;
    alpha += (1.0 - alpha) * wgt;
    if (alpha > 0.985) break;
  }
  col += (1.0 - alpha) * under;

  // the moon finds the edge of every rounded thing
  if (rim > 0.0) {
    float r = pow(1.0 - max(dot(N, V), 0.0), 2.6);
    col += (uMoonCol * (0.35 + 0.65 * max(dot(N, uMoonDir) * 0.5 + 0.5, 0.0)) + uAmbSky) * (r * rim * 0.9) * (base + 0.08);
  }

  // lit windows spill onto the wall around them and burn through the paint
  col += base * gWarm * halo * 1.6 * uGlow;
  vec3 e = emis * uGlow;

  // the village of the opening frame wakes with the painting
  float l = dot(col, vec3(0.2126, 0.7152, 0.0722));
  col = max(vec3(0.0), mix(vec3(l), col, mix(0.78, mix(1.06, 0.93, his), uAlive)));

  float fogF = pow(smoothstep(uFogRange.x, uFogRange.y, vDist), 1.5);
  col = mix(col, uFogColor, fogF * 0.97);
  col += e * (1.0 - fogF * 0.86);
  gl_FragColor = vec4(col, 1.0);
}
`;function po(e,{dynamic:t=!1,walker:n=!1}={}){let r={uTime:e.uTime,uBend:e.uBend,uBendCenter:e.uBendCenter,uStrokeDist:e.uStrokeDist,uGlow:e.uGlow,uAlive:e.uAlive,uFogColor:e.uFogColor,uFogRange:e.uFogRange,uMoonDir:e.uMoonDir,uMoonCol:e.uMoonCol,uAmbSky:e.uAmbSky,uAmbGround:e.uAmbGround,uWarmCol:e.uWarmCol,uHis:e.uHis,uHeadPos:e.uHeadPos,uHeadDir:e.uHeadDir,uHeadPower:e.uHeadPower,tCanvas:e.tCanvas},i={};return t&&(r.uDynLamp={value:new ge(0,-999,0,0)},i.DYNAMIC=1),n&&(i.WALKER=1,r.uHold={value:new ge(0,0,0,0)}),new F({vertexShader:uo,fragmentShader:fo,uniforms:r,defines:i,side:2})}function mo(e){return new F({vertexShader:`
      uniform float uBend;
      uniform vec3 uBendCenter;
      varying float vDist;
      invariant gl_Position;
      void main() {
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vec2 dxz = wp.xz - uBendCenter.xz;
        wp.y += uBend * dot(dxz, dxz);
        vec4 mv = viewMatrix * wp;
        vDist = length(mv.xyz);
        gl_Position = projectionMatrix * mv;
      }`,fragmentShader:`
      precision highp float;
      uniform vec2 uFogRange;
      varying float vDist;
      void main() {
        if (vDist > uFogRange.y + 4.0) discard;
        gl_FragColor = vec4(0.0);
      }`,uniforms:{uBend:e.uBend,uBendCenter:e.uBendCenter,uFogRange:e.uFogRange},side:2,colorWrite:!1})}var ho=`
attribute vec2 aCorner;
attribute vec4 aGlow;      // size (m), seed, kind, intensity
attribute vec3 color;
uniform float uBend;
uniform vec3 uBendCenter;
uniform float uPixel;      // world size of one pixel at unit distance
uniform vec2 uFogRange;
uniform float uTime;
varying vec2 vCorner;
varying vec3 vColor;
varying vec3 vInfo;        // seed, kind, intensity
void main() {
  vec3 pos = position;
  float size = aGlow.x;
  float kind = aGlow.z;
  float life = 1.0;
  if (kind > 5.5) {
    // smoke: each puff rises from its chimney, leans with the wind, swells and thins
    float t = fract(uTime * 0.085 + aGlow.y);
    pos.y += t * 9.0;
    pos.x += t * t * 4.0 + sin(t * 9.0 + aGlow.y * 20.0) * 0.5;
    pos.z += sin(t * 6.0 + aGlow.y * 9.0) * 0.6;
    size *= 0.5 + t * 1.8;
    life = sin(t * 3.14159) * (1.0 - t * 0.4);
  }
  vec4 wp = modelMatrix * vec4(pos, 1.0);
  vec2 dxz = wp.xz - uBendCenter.xz;
  wp.y += uBend * dot(dxz, dxz);
  vec4 mv = viewMatrix * wp;
  float dist = max(-mv.z, 0.1);
  // never smaller than a couple of pixels: far lights stay steady points
  float minSize = uPixel * dist * 2.2;
  float k = max(size, minSize);
  float dim = (size * size) / (k * k);
  mv.xy += aCorner * k;
  float fogF = pow(smoothstep(uFogRange.x, uFogRange.y, dist), 1.5);
  float inten = aGlow.w * mix(1.0, 0.30, fogF) * mix(dim, 1.0, 0.35) * step(dist, uFogRange.y + 4.0) * life;
  // far-window lights only take over once the painted panes are too small to read
  if (kind > 0.5 && kind < 1.5) inten *= smoothstep(110.0, 240.0, dist);
  // the guiding star is never dimmed by distance
  if (kind > 3.5 && kind < 4.5) inten = aGlow.w;
  vCorner = aCorner;
  vColor = color;
  vInfo = vec3(aGlow.y, kind, inten);
  gl_Position = projectionMatrix * mv;
}
`,go=`
precision highp float;
uniform float uTime;
uniform float uGlow;
uniform float uAlive;
varying vec2 vCorner;
varying vec3 vColor;
varying vec3 vInfo;
${fa}
const float TAU = 6.28318531;
void main() {
  float r = length(vCorner);
  if (r > 1.0) discard;
  float seed = vInfo.x, kind = vInfo.y;
  float a = 0.0;
  if (kind < 0.5) {
    // a lantern: hot heart, then a little star-halo of dashes, like the ones overhead
    float core = exp(-r * r * 26.0) * 1.6;
    float th = atan(vCorner.y, vCorner.x);
    float ring = floor(r * 5.0);
    float n = max(5.0, floor((ring + 0.5) * 4.4));
    float x = (th / TAU + 0.5) * n + hash11(ring + seed * 7.0) * 5.0 + uTime * 0.05 * (1.0 + ring * 0.3) * (seed > 0.5 ? 1.0 : -1.0);
    float fx = fract(x), fy = fract(r * 5.0);
    float dash = smoothstep(0.5, 0.30, abs(fx - 0.5)) * smoothstep(0.5, 0.22, abs(fy - 0.5));
    float fall = pow(max(1.0 - r, 0.0), 2.2);
    a = core + dash * fall * 0.55 * step(0.5, ring) + fall * 0.10;
  } else if (kind < 1.5 || (kind > 2.5 && kind < 3.5)) {
    // a far window, a festive bulb, a spark: just a soft point
    a = exp(-r * r * 5.0) - 0.0067;
  } else if (kind < 2.5) {
    // a stray star: pulsing, with turning rays
    float th = atan(vCorner.y, vCorner.x);
    float rays = pow(abs(cos(th * 2.0 + uTime * 0.6 + seed * 6.0)), 14.0);
    float pulse = 0.8 + 0.2 * sin(uTime * 3.0 + seed * 20.0);
    a = (exp(-r * r * 30.0) * 2.0 + rays * pow(max(1.0 - r, 0.0), 3.0) * 0.8 + pow(max(1.0 - r, 0.0), 3.0) * 0.25) * pulse;
  } else if (kind < 4.5) {
    // the guiding star over the steeple: a hot heart, four long rays, four
    // short ones, and haloes breathing outward like the stars on the canvas
    float th = atan(vCorner.y, vCorner.x);
    float fall = max(1.0 - r, 0.0);
    float rays = pow(abs(cos(th * 2.0)), 70.0) * pow(fall, 1.4);
    float rays2 = pow(abs(cos(th * 2.0 + 1.5708)), 110.0) * pow(max(1.0 - r * 1.9, 0.0), 2.0) * 0.6;
    rays2 += pow(abs(cos(th * 2.0 + 0.7854)), 90.0) * pow(max(1.0 - r * 2.4, 0.0), 2.0) * 0.5;
    float core = exp(-r * r * 120.0) * 3.0 + exp(-r * r * 16.0) * 0.55;
    float ring = smoothstep(0.5, 0.15, abs(fract(r * 5.0 - uTime * 0.22) - 0.5)) * pow(fall, 2.6) * 0.30;
    a = core + rays + rays2 + ring;
  } else if (kind < 5.5) {
    // a trail orb: a small sun with a breathing ring
    float ring = smoothstep(0.09, 0.0, abs(r - 0.60 - 0.06 * sin(uTime * 3.0 + seed * 9.0))) * 0.30;
    a = exp(-r * r * 20.0) * 1.7 + exp(-r * r * 4.0) * 0.30 + ring;
  } else {
    // smoke: a curl of pale strokes
    float th = atan(vCorner.y, vCorner.x);
    float curl = 0.5 + 0.5 * sin(th * 2.0 + r * 9.0 - uTime * 0.7 + seed * 30.0);
    a = pow(max(1.0 - r, 0.0), 1.6) * (0.35 + 0.65 * curl);
  }
  gl_FragColor = vec4(vColor * a * vInfo.z * uGlow * mix(0.25, 1.0, uAlive), 1.0);
}
`;function _o(e){return new F({vertexShader:ho,fragmentShader:go,uniforms:{uTime:e.uTime,uBend:e.uBend,uBendCenter:e.uBendCenter,uPixel:e.uPixel,uFogRange:e.uFogRange,uGlow:e.uGlow,uAlive:e.uAlive},blending:2,depthWrite:!1,transparent:!0})}var vo=new URLSearchParams(location.search),yo=typeof matchMedia==`function`&&matchMedia(`(hover: none), (pointer: coarse)`).matches,bo={touch:vo.has(`touch`)||(navigator.maxTouchPoints||0)>0&&yo,small:!1};bo.small=bo.touch&&Math.min(window.screen.width,window.screen.height)<820;var xo=document.documentElement;xo.classList.toggle(`touch`,bo.touch),bo.touch||window.addEventListener(`touchstart`,()=>{bo.touch=!0,xo.classList.add(`touch`)},{once:!0,passive:!0});var So=2,Co=bo.small?135:195,wo=Co+80,To=class{constructor(e,n,r,i){this.scene=e,this.paintMat=n,this.glowMat=r,this.walkerMat=i,this.W=new Wt(16384),this.chunks=new Map,this.queue=[],this.job=null,this.B=new $e(4e4),this.A=new $e(16384),this.N=new $e(65536),this.G=new gt(1024),this.nearQueue=[],this.njob=null,this.nearAt={x:1e9,z:1e9},this.nearDirty=!1,this.group=new t,e.add(this.group),this.focus={ci:1e9,cj:1e9},this.at={x:0,z:0},this.built=0,this._v=new R,this._c=new R}chunkCentre(e,t){return[(xt(e*So)+xt(e*So+So))/2,(Ft(t*So)+Ft(t*So+So))/2]}collectLamps(e,t,n,r){let i=e*So,a=t*So,o=[],s=(e,t)=>o.push({wx:Bt(e.x,e.z)-n,wy:e.y,wz:G(e.x,e.z)-r,power:t}),c=e=>{for(let t of e.lamps)s(t,1);if(e.arch){let t=(e.arch.a0+e.arch.a1)/2;s(e.axis===`x`?{x:e.c,z:t,y:e.arch.under+.35}:{x:t,z:e.c,y:e.arch.under+.35},.9)}};for(let e=i;e<=i+So;e++)for(let t=a-1;t<=a+So;t++)c(Xe(`x`,e,t));for(let e=a;e<=a+So;e++)for(let t=i-1;t<=i+So;t++)c(Xe(`z`,t,e));for(let e=i-1;e<=i+So;e++)for(let t=a-1;t<=a+So;t++)for(let n of mt(e,t).lamps)s(n,n.power??1.1);return o}startJob(e,t){let[n,r]=this.chunkCentre(e,t),i=Bt(n,r),a=G(n,r);this.B.reset(i,a,n,r),this.A.reset(i,a,n,r),this.G.reset(i,a);let o=this.collectLamps(e,t,i,a);this.B.setLamps(o),this.A.setLamps(o),this.job={ci:e,cj:t,ox:i,oz:a,gx:n,gz:r,step:0,lamps:o}}stepJob(){let e=this.job,t=this.B,n=this.G,r=e.step++;if(r<4){let i=e.ci*So+r%So,a=e.cj*So+Math.floor(r/So),o=mt(i,a);for(let e of o.houses)Ye(this.A,n,e,o);nt(this.A,n,o),at(t,n,o);for(let e of o.trees)Xt(t,e,o);for(let e of o.lamps)Qe(t,n,e,null);tt(t,n,o);for(let e of[Xe(`x`,i,a),Xe(`z`,i,a)]){for(let r of e.lamps)Qe(t,n,r,e);At(t,n,e),st(n,e)}return rt(t,i,a),!1}let i=this.solid(t,e.ox,e.oz),a=this.A.nv>0?this.solid(this.A,e.ox,e.oz):null,o=null;n.n>0&&(o=new P(n.build(),this.glowMat),o.position.copy(i.position),o.frustumCulled=!1,o.matrixAutoUpdate=!1,o.updateMatrix(),o.renderOrder=60);let s={ci:e.ci,cj:e.cj,x:e.ox,z:e.oz,gx:e.gx,gz:e.gz,paint:i,arch:a,glow:o,folk:null,near:[],nearReady:!1,lamps:e.lamps,y:(t.minY+t.maxY)/2};return this.group.add(i),a&&this.group.add(a),this.nearDirty=!0,o&&this.group.add(o),this.chunks.set(e.ci*65536+e.cj,s),this.job=null,this.built++,!0}solid(e,t,n){let r=new P(e.build(),this.paintMat);return r.position.set(t,0,n),r.frustumCulled=!1,r.matrixAutoUpdate=!1,r.updateMatrix(),r.layers.enable(1),r}dropNear(e){for(let t of e.near)this.group.remove(t),t.geometry.dispose();e.folk&&=(this.group.remove(e.folk),e.folk.geometry.dispose(),null),e.people=null,e.near=[],e.nearReady=!1,this.njob&&this.njob.chunk===e&&(this.njob=null)}updateNear(e,t){let n=[];for(let r of this.chunks.values()){let i=Math.hypot(r.gx-e,r.gz-t);i<Co?!r.nearReady&&!(this.njob&&this.njob.chunk===r)&&n.push({c:r,d:i}):i>wo&&(r.nearReady||r.near.length||this.njob&&this.njob.chunk===r)&&this.dropNear(r)}n.sort((e,t)=>e.d-t.d),this.nearQueue=n.map(e=>e.c)}stepNear(e){let t=this.njob,n=this.N,r=this.W,i=t.chunk;t.k===0&&t.fresh&&(r.reset(i.x,i.z,i.gx,i.gz),r.setLamps(i.lamps),r.census=[]),t.fresh&&=(n.reset(i.x,i.z,i.gx,i.gz),n.setLamps(i.lamps),!1);let a=i.ci*So+t.k%So,o=i.cj*So+Math.floor(t.k/So),s=mt(a,o);for(;t.hi<s.houses.length;)if(vt(n,s.houses[t.hi++],s),performance.now()>e)return;if(Et(n,s),pt(n,s),n.nv>0){let e=this.solid(n,i.x,i.z);e.visible=!1,i.near.push(e),this.group.add(e)}for(let e of[Xe(`x`,a,o),Xe(`z`,a,o)])St(r,e);if(Jt(r,s),t.k++,t.hi=0,t.fresh=!0,t.k>=4){if(r.nv>0){let e=new P(r.build(),this.walkerMat);e.position.set(i.x,0,i.z),e.frustumCulled=!1,e.matrixAutoUpdate=!1,e.updateMatrix(),i.folk=e,this.group.add(e)}i.people=r.census||[],r.census=null,i.nearReady=!0,this.njob=null}}rebuild(){for(let e of this.chunks.values())this.group.remove(e.paint),e.paint.geometry.dispose(),e.arch&&(this.group.remove(e.arch),e.arch.geometry.dispose()),this.dropNear(e),e.glow&&(this.group.remove(e.glow),e.glow.geometry.dispose());this.chunks.clear(),this.job=null,this.njob=null,this.queue=[],this.nearQueue=[],this.focus={ci:1e9,cj:1e9};let{x:e,z:t}=this.at;this.retarget(e,t);for(let e=0;e<4e3&&(this.queue.length||this.job);e++)this.work(40);this.retarget(e,t);for(let e=0;e<4e3&&this.pending;e++)this.work(40)}retarget(e,t){this.at.x=e,this.at.z=t,(this.nearDirty||Math.hypot(e-this.nearAt.x,t-this.nearAt.z)>14)&&(this.nearAt.x=e,this.nearAt.z=t,this.nearDirty=!1,this.updateNear(e,t));let n=Math.floor(Ke(e)/So),r=Math.floor(kt(t)/So);if(n===this.focus.ci&&r===this.focus.cj)return;this.focus={ci:n,cj:r};let i=Math.ceil((dt.viewRadius+60)/(dt.pitch*So))+1,a=[],o=new Set,s=dt.viewRadius+dt.pitch*So*.72;for(let c=n-i;c<=n+i;c++)for(let n=r-i;n<=r+i;n++){let[r,i]=this.chunkCentre(c,n),l=Math.hypot(r-e,i-t);if(l>s)continue;let u=c*65536+n;o.add(u),!this.chunks.has(u)&&!(this.job&&this.job.ci===c&&this.job.cj===n)&&a.push({ci:c,cj:n,d:l})}a.sort((e,t)=>e.d-t.d),this.queue=a;for(let[n,r]of this.chunks){if(o.has(n))continue;let[i,a]=this.chunkCentre(r.ci,r.cj);Math.hypot(i-e,a-t)<s+150||(this.group.remove(r.paint),r.paint.geometry.dispose(),r.arch&&(this.group.remove(r.arch),r.arch.geometry.dispose()),this.dropNear(r),r.glow&&(this.group.remove(r.glow),r.glow.geometry.dispose()),this.chunks.delete(n))}}work(e){let t=performance.now()+e;do{if(!this.job){let e=this.queue.shift();if(!e)break;if(this.chunks.has(e.ci*65536+e.cj))continue;this.startJob(e.ci,e.cj)}this.stepJob()}while(performance.now()<t);for(;performance.now()<t;){if(!this.njob){let e=this.nearQueue.shift();if(!e)break;if(e.nearReady||this.chunks.get(e.ci*65536+e.cj)!==e)continue;this.njob={chunk:e,k:0,hi:0,fresh:!0}}this.stepNear(t)}}get pending(){return this.queue.length+ +!!this.job+this.nearQueue.length+ +!!this.njob}cull(e){let t=e.getWorldDirection(this._v),n=Math.hypot(t.x,t.z),r=n<.5,i=t.x/(n||1),a=t.z/(n||1),o=dt.pitch*So*.8,s=!r,c=1;for(let t=0;s&&t<4;t++){let n=this._c.set(t&1?1:-1,t&2?1:-1,.5).applyMatrix4(e.projectionMatrixInverse).transformDirection(e.matrixWorld),r=Math.hypot(n.x,n.z),o=r>1e-4?(n.x*i+n.z*a)/r:0;o<.2?s=!1:o<c&&(c=o)}let l=Math.sqrt(Math.max(0,1-c*c));for(let t of this.chunks.values()){let n=t.x-e.position.x,u=t.z-e.position.z,d=n*i+u*a,f=r||d>-o;f&&s&&Math.abs(n*a-u*i)*c-d*l>o&&(f=!1),t.paint.visible=f,t.arch&&(t.arch.visible=f&&!t.nearReady);for(let e=0;e<t.near.length;e++)t.near[e].visible=f&&t.nearReady;t.glow&&(t.glow.visible=f),t.folk&&(t.folk.visible=f)}}personAt(e,t,n){this.held&&this.held.p===e&&(t=this.held.t);let r=0;if(e.mode===1){let n=Math.max(Math.hypot(e.bx-e.ax,e.bz-e.az),.001)/Math.max(e.speed,.05),i=e.p1,a=Math.abs(e.p2),o=2*n+i+a,s=t/o+e.phase,c=(s-Math.floor(s))*o;r=c<n?c/n:c<n+i?1:c<2*n+i?1-(c-n-i)/n:0}return n.x=e.ax+(e.bx-e.ax)*r,n.y=e.ay+(e.by-e.ay)*r,n.z=e.az+(e.bz-e.az)*r,n}hold(e,t){this.held=e?{p:e,t}:null;let n=this.walkerMat.uniforms.uHold.value;e&&((n.x!==e.ax||n.y!==e.az)&&(n.w=0),n.x=e.ax,n.y=e.az,n.z=t)}easeHold(e){let t=this.walkerMat.uniforms.uHold.value,n=+!!this.held;t.w+=(n-t.w)*(1-Math.exp(-(n?5:3.5)*e)),!n&&t.w<.012&&(t.w=0)}personNear(e,t,n,r,i,a=null){let o=null,s=r,c=this._at||={x:0,y:0,z:0};for(let l of this.chunks.values())if(!(!l.people||Math.hypot(l.x-e,l.z-t)>140))for(let u=0;u<l.people.length;u++){let d=l.people[u];if(!d.kind||d.kind===`boy`||d.kind===`girl`||d.mode===4||d.mode===9||(this.personAt(d,i,c),Math.abs(c.y-n)>2.5))continue;let f=Math.hypot(c.x-e,c.z-t);if(f>=r)continue;let p=`${l.ci}:${l.cj}:${u}`;(!a||a(p,c,f))&&f<s&&(s=f,o={p:d,cid:p,d:f})}return o}nearestLamp(e,t,n){let r=Ke(e),i=kt(t),a=null,o=784,s=n=>{let r=(n.x-e)*(n.x-e)+(n.z-t)*(n.z-t);r<o&&(o=r,a=n)};for(let e=r;e<=r+1;e++)for(let t of Xe(`x`,e,i).lamps)s(t);for(let e=i;e<=i+1;e++)for(let t of Xe(`z`,r,e).lamps)s(t);for(let e of mt(r,i).lamps)s(e);return a?(n.set(Bt(a.x,a.z),a.y,G(a.x,a.z),1),n):(n.set(0,-999,0,0),n)}},Eo=e=>e<=.04045?e/12.92:((e+.055)/1.055)**2.4,Do=e=>[Eo((e>>16&255)/255),Eo((e>>8&255)/255),Eo((e&255)/255)],J={frame:Do(1845842),tire:Do(1053468),rim:Do(9214648),metal:Do(10134710),saddle:Do(3810326),smock:Do(3103936),smockLight:Do(6129372),smockDark:Do(2047884),trousers:Do(10122294),skin:Do(14855042),skinShade:Do(13208166),eye:Do(1710626),eyeWhite:Do(14275782),iris:Do(4157306),hat:Do(15582546),hatShade:Do(13081140),band:Do(2371674),boot:Do(3810324),hair:Do(12870186),leather:Do(8014372),leatherDark:Do(4860948),scarf:Do(14699052),wicker:Do(12093770),petal:Do(15909424),seed:Do(4860944),stem:Do(4090410),feather:Do(16054015),featherGold:Do(16770720),featherBlue:Do(12112127)},Oo=J,ko=.35,Ao=[-.52,ko],jo=[.56,ko],Mo=[0,.3],No=[-.19,.87],Po=[.38,.91],Fo=[.43,.66],Io=.17,Lo=.13,Ro=[-.17,.985],zo=.44,Bo=.47,Vo=[Po[0]-.075,Po[1]+.135,.285],Ho=(e,t,n,r=1)=>e.color(t).data(ht.FIGURE,n,r,0);function Uo(){let e=new $e(4096);e.reset(0,0,0,0);let t=.32599999999999996,n=.024;e.color(J.tire).data(ht.PLAIN,.2,.45,0);let r=[];for(let i=0;i<=26;i++){let a=i/26*Math.PI*2,o=Math.cos(a),s=Math.sin(a),c=[];for(let r=0;r<=7;r++){let i=r/7*Math.PI*2,l=Math.cos(i),u=Math.sin(i);c.push(e.vert(o*(t+l*n),s*(t+l*n),u*n,o*l,s*l,u,a*t,i*n,1))}r.push(c)}for(let t=0;t<26;t++)for(let n=0;n<7;n++){let i=r[t][n],a=r[t][n+1],o=r[t+1][n+1],s=r[t+1][n];e.tri3(i,a,o),e.tri3(i,o,s)}e.color(J.rim).data(ht.PLAIN,.6,.4,0);for(let t=0;t<16;t++){let n=t/16*Math.PI*2;it(e,0,0,t%2?.022:-.022,Math.cos(n)*.30599999999999994,Math.sin(n)*.30599999999999994,0,.008,t*.1)}return e.color(J.metal),it(e,0,0,-.05,0,0,.05,.05),e.build()}function Wo(){let e=new $e(4096);e.reset(0,0,0,0),e.color(J.frame).data(ht.PLAIN,.4,.5,0);let t=.034;it(e,Mo[0],Mo[1],0,No[0],No[1],0,t),it(e,No[0],No[1]-.04,0,Po[0],Po[1]-.03,0,t),it(e,Mo[0],Mo[1],0,Fo[0],Fo[1],0,t*1.1);for(let n of[-.045,.045])it(e,Mo[0],Mo[1],n*.6,Ao[0],Ao[1],n,t*.7),it(e,No[0],No[1]-.06,n*.5,Ao[0],Ao[1],n,t*.65);it(e,No[0],No[1],0,No[0]-.012,No[1]+.035,0,.026),e.color(J.saddle),ct(e,No[0]-.055,No[1]+.048,0,.088,.03,.076,10,5),ct(e,No[0]+.055,No[1]+.044,0,.085,.024,.036,8,5),e.color(J.frame,.8);for(let[t,n,r]of[[Ao[0],.1,.98],[jo[0],.22,.86]])for(let i=0;i<7;i++){let a=Math.PI*(n+(r-n)*i/7),o=Math.PI*(n+(r-n)*(i+1)/7),s=.378;it(e,t+Math.cos(a)*s,ko+Math.sin(a)*s,0,t+Math.cos(o)*s,ko+Math.sin(o)*s,0,.052)}return e.color(J.frame,1.3),it(e,Mo[0]+.02,Mo[1]+.07,.065,Ao[0]+.06,Ao[1]+.05,.065,.045),e.color(J.metal,.7),it(e,No[0]-.02,No[1]-.12,0,Ao[0]-.2,Ao[1]+.4,0,.02),it(e,Ao[0]-.2,Ao[1]+.4,-.07,Ao[0]-.2,Ao[1]+.4,.07,.02),it(e,Ao[0],Ao[1],.05,Ao[0]-.2,Ao[1]+.4,.07,.014),it(e,Ao[0],Ao[1],-.05,Ao[0]-.2,Ao[1]+.4,-.07,.014),e.rgb(1,.12,.05).data(ht.GLOW,0,4.5,0),qe(e,Ao[0]-.385,Ao[1]+.18,0,.03,.05,.05),e.build()}function Go(){let e=new $e(4096);e.reset(0,0,0,0),e.color(J.frame).data(ht.PLAIN,.4,.5,0);let t=Po[0],n=Po[1],r=Fo[0]-t,i=Fo[1]-n,a=jo[0]-t,o=jo[1]-n;it(e,0,.02,0,r,i,0,.046);for(let t of[-.05,.05])it(e,r,i,t*.7,a,o,t,.028);e.color(J.metal),it(e,0,0,0,-.03,.13,0,.026);for(let t of[-1,1])it(e,-.03,.13,0,-.01,.15,t*.17,.022),it(e,-.01,.15,t*.17,-.075,.135,t*.275,.022),e.color(J.saddle),it(e,-.075,.135,t*.275,-.15,.13,t*.29,.032),e.color(J.metal);ct(e,.1,-.12,0,.05,.045,.045,8,5),e.rgb(1,.86,.55).data(ht.GLOW,0,7,0),qe(e,.148,-.12,0,.012,.06,.06),e.color(J.wicker).data(ht.PLAIN,.7,.35,0);let s=(e,t,n)=>({c:[.17,e,0],u:[0,0,t],v:[n,0,0],sq:2.2});W(e,[s(-.07,.1,.075),s(0,.125,.09),s(.085,.145,.105)],12,!0,!1),e.color(J.wicker,.55),W(e,[s(.08,.135,.095),s(.02,.118,.082)],12,!1,!0);for(let[t,n,r,i]of[[.15,.25,-.055,.075],[.215,.215,.05,.068],[.115,.3,.025,.06]]){e.color(J.stem).data(ht.PLAIN,.3,.3,0),it(e,.17,.04,r*.4,t,n,r,.014),Ho(e,J.petal,.9+r,.6);for(let a=0;a<9;a++){let o=a/9*Math.PI*2,s=e.pl(t,n+.012,r),c=e.pl(t+Math.cos(o-.3)*i*.5,n+.01,r+Math.sin(o-.3)*i*.5),l=e.pl(t+Math.cos(o)*i,n-.008,r+Math.sin(o)*i),u=e.pl(t+Math.cos(o+.3)*i*.5,n+.01,r+Math.sin(o+.3)*i*.5);e.quad(s,c,l,u,0,0,i,i)}e.color(J.seed),ct(e,t,n+.012,r,i*.42,.016,i*.42,8,4)}return e.build()}function Ko(){let e=new $e(1024);e.reset(0,0,0,0),e.color(J.metal).data(ht.PLAIN,.5,.4,0),it(e,0,0,-.08,0,0,.08,.03),it(e,0,0,.08,Io,0,.09,.022),it(e,0,0,-.08,-.17,0,-.09,.022);for(let t=0;t<10;t++){let n=t/10*Math.PI*2,r=(t+1)/10*Math.PI*2;it(e,Math.cos(n)*.085,Math.sin(n)*.085,.06,Math.cos(r)*.085,Math.sin(r)*.085,.06,.012)}return e.build()}var qo=(()=>{let e=[.14,1.47],t=[e[0]-Ro[0],e[1]-Ro[1]],n=Math.hypot(t[0],t[1]);return{d:[t[0]/n,t[1]/n],len:n,top:e}})(),Jo=[qo.top[0]+.075,qo.top[1]+.185],Yo=[.097,1.397,.208];function Xo(e,t=0){let n=qo.d,r=[n[1],-n[0]],i=-.032*Math.sin(Math.PI*Math.min(Math.max(e,0),1));return[Ro[0]+n[0]*qo.len*e+r[0]*(t+i),Ro[1]+n[1]*qo.len*e+r[1]*(t+i)]}function Zo(){let e=new $e(8192);e.reset(0,0,0,0);let t=qo.d,n=[t[1],-t[0],0],r=(e,t,r,i,a=1)=>{let o=Xo(e);return{c:[o[0],o[1],0],u:[0,0,t],v:[n[0]*r,n[1]*r,0],back:i/r,sq:a}},i=(e,t,n,r,i,a)=>({c:[e,t,0],u:[0,0,n],v:[Math.cos(a)*r,Math.sin(a)*r,0],back:i/r,sq:1.2});Ho(e,J.smock,.7),W(e,[i(-.19,.988,.196,.128,.126,.56),i(-.19,.995,.224,.152,.146,.56),i(-.16,1.045,.22,.138,.142,.25),r(.13,.186,.122,.132),r(.24,.166,.118,.128),r(.45,.186,.132,.142),r(.66,.206,.138,.152,1.1),r(.84,.226,.118,.136,1.25),r(.93,.176,.094,.108),r(.99,.08,.07,.074),r(1.03,.062,.058,.06)],16,!1,!1,(e,t)=>.86+.14*Math.sin(t*Math.PI*2)+(e<4?-.08:0)+(e<1?-.16:0)),Ho(e,J.smockLight,.3),W(e,[r(.975,.094,.084,.088),r(1.045,.074,.07,.072)],14,!1,!1);for(let t of[-1,1])Ho(e,J.smock,.75+t*.08),ct(e,Yo[0],Yo[1],t*Yo[2],.082,.078,.078,10,6);return e.build()}function Qo(e){let t=new $e(2048);if(t.reset(0,0,0,0),Ho(t,J.leatherDark,.2,.8),!e){for(let e of[-.142,.132]){let n=Xo(.87,e),r=Xo(.12,e*.92);Je(t,[n[0],n[1],.15],[r[0],r[1],-.165],[[0,.021],[1,.021]],6)}return t.build()}let n=[[0,.215,.14,.142],[.13,.186,.122,.132],[.24,.166,.118,.128],[.45,.186,.132,.142],[.66,.206,.138,.152],[.84,.226,.118,.136],[.93,.176,.094,.108],[.99,.08,.07,.074],[1.03,.062,.058,.06]],r=e=>{let t=0;for(;t<n.length-2&&e>n[t+1][0];)t++;let r=n[t],i=n[t+1],a=Math.min(1,Math.max(0,(e-r[0])/(i[0]-r[0])));return[r[1]+(i[1]-r[1])*a,r[2]+(i[2]-r[2])*a,r[3]+(i[3]-r[3])*a]},i=.026,a=[];for(let e=0;e<=40;e++){let t=e/40*Math.PI*2,n=Math.cos(t),o=Math.sin(t),s=.15+.835*((1+n)/2)**.9,[c,l,u]=r(s),d=Xo(s,(o>0?l:u)*o+i*o);a.push([d[0],d[1],(c+i)*n])}for(let e=0;e<40;e++)Je(t,a[e],a[e+1],[[0,.019],[1,.019]],6);return t.build()}var $o=Xo(.3);function es(){let e=new $e(1024);e.reset(0,0,0,0);let t=qo.d,n=[t[1],-t[0],0];Ho(e,J.leather,.45,.8);let r=Xo(.3,-.165),i=(e,i,a)=>({c:[r[0]+t[0]*e,r[1]+t[1]*e,-.035],u:[0,0,i],v:[n[0]*a,n[1]*a,0],sq:2.2});return W(e,[i(-.13,.115,.045),i(-.06,.13,.058),i(.07,.13,.058),i(.125,.118,.046)],12,!0,!0),Ho(e,J.leatherDark,.2,.8),W(e,[i(.035,.134,.062),i(.13,.122,.05)],12,!1,!1),e.build()}var ts=Xo(-.105),ns=-Math.atan2(qo.d[0],qo.d[1]);function rs(){let e=new $e(512);e.reset(0,0,0,0);let t=qo.d,n=Math.cos(-ns),r=Math.sin(-ns),i=e=>[e[0]*n-e[1]*r,e[0]*r+e[1]*n,e[2]],a=(e,t,n,r,a)=>({c:i([e-ts[0],t-ts[1],0]),u:[0,0,n],v:i(r),back:a,sq:1.2});return Ho(e,J.smock,.7),W(e,[a(Ro[0]-.045,Ro[1]-.06,.17,[.1,-.027,0],.85),a(ts[0],ts[1],.192,[t[1]*.132,-t[0]*.132,0],.118/.132)],16,!1,!1,(e,t)=>.86+.14*Math.sin(t*Math.PI*2)-(e<1?.24:.08)),e.build()}var is=.27,as=.25,os=.18;function ss(e){let t=new $e(1024);return t.reset(0,0,0,0),Ho(t,J.smock,e),Je(t,[0,0,0],[is,0,0],[[0,.074],[.45,.068],[1,.058]],10),t.build()}function cs(e){let t=new $e(1024);return t.reset(0,0,0,0),Ho(t,J.smock,e),ct(t,0,0,0,.06,.06,.06,8,5),Je(t,[0,0,0],[.135,0,0],[[0,.058],[.5,.053],[1,.046]],10),Ho(t,J.smockLight,.2),Je(t,[.125,0,0],[.15,0,0],[[0,.05],[1,.05]],9),Ho(t,J.skin,.3,.6),Je(t,[.15,0,0],[.176,0,0],[[0,.034],[1,.035]],8),t.build()}function ls(e,t){let n=new $e(2048);n.reset(0,0,0,0);let r=1.22,i=[-.037*r,-.0125*r,.0125*r,.037*r];if(Ho(n,J.skin,.3,.6),ct(n,.004,0,0,.037,.035,.037,8,5),t){ct(n,.052*r,0,0,.05*r,.019*r,.05*r,10,6);let t=e>0?[.078,.092,.086,.066]:[.066,.086,.092,.078];for(let e=0;e<4;e++)Je(n,[.088*r,.001,i[e]],[(.088+t[e])*r,-.013*r,i[e]*1.1],[[0,.0138*r],[1,.0112*r]],6);Je(n,[.022*r,-.004,-e*.044*r],[.078*r,-.01*r,-e*.094*r],[[0,.0158*r],[1,.0125*r]],6)}else{ct(n,.047*r,.005,0,.05*r,.028*r,.05*r,10,6);for(let e=0;e<4;e++)ct(n,.09*r,.002,i[e],.017*r,.017*r,.0135*r,6,4),Je(n,[.094*r,-.004*r,i[e]],[.086*r,-.05*r,i[e]],[[0,.0138*r],[1,.013*r]],6),Je(n,[.086*r,-.052*r,i[e]],[.046*r,-.058*r,i[e]],[[0,.013*r],[1,.012*r]],6);Je(n,[.02*r,-.014*r,-e*.05*r],[.082*r,-.04*r,-e*.028*r],[[0,.0162*r],[1,.013*r]],6)}return n.build()}function us(){let e=new $e(8192);e.reset(0,0,0,0);let t=Jo[0]-qo.top[0],n=Jo[1]-qo.top[1];Ho(e,J.skin,.3,.7),Je(e,[-.004,-.03,0],[t-.03,n-.09,0],[[0,.054],[1,.048]],10),ct(e,t,n,0,.106,.12,.097,14,10),ct(e,t+.034,n-.058,0,.074,.07,.079,12,8),Ho(e,J.skinShade,.5,.6),ct(e,t+.108,n-.022,0,.026,.032,.02,8,5);for(let r of[-1,1])ct(e,t-.006,n-.012,r*.097,.018,.032,.014,6,5);ct(e,t+.086,n+.034,0,.022,.013,.066,10,5);for(let r of[-1,1]){let i=t+.0935,a=n+.01,o=r*.043;e.color(J.eyeWhite).data(ht.PLAIN,.1,.3,0),ct(e,i,a,o,.0065,.0072,.0135,8,5),e.color(J.iris).data(ht.PLAIN,.1,.3,0),ct(e,i+.0035,a-2e-4,o-r*3e-4,.0048,.0066,.0068,7,5),e.color(J.eye).data(ht.PLAIN,.1,.3,0),ct(e,i+.0066,a-2e-4,o-r*3e-4,.0026,.0034,.0034,6,4),Ho(e,J.skin,.3,.7),ct(e,i-5e-4,a+.0076,o,.0088,.0048,.0152,8,4),ct(e,i-.001,a-.0072,o,.0068,.0024,.0124,8,3)}Ho(e,J.hair,.55,.7);for(let r of[-1,1])ct(e,t+.097,n+.0325,r*.041,.016,.0058,.023,6,3);ct(e,t+.05,n-.086,0,.074,.078,.084,12,8),ct(e,t+.098,n-.05,0,.026,.016,.05,8,4),ct(e,t-.04,n-.01,0,.082,.098,.099,12,8);for(let r of[-1,1])ct(e,t+.02,n-.04,r*.088,.03,.05,.02,6,5);let r=n+.064,i=.07;Ho(e,J.hat,.9,.9),ut(e,[t+.01,r,0],.098,.255,22,.034,i,1),Ho(e,J.hatShade,.6,.9),ut(e,[t+.01,r-.006,0],.098,.25,22,.034,i,.7),Ho(e,J.hat,.9,.9);let a=(e,n)=>({c:[t+.01,r+e,0],u:[n,-n*i,0],v:[0,0,n*.95]});W(e,[a(-.004,.106),a(.05,.102),a(.09,.092),a(.106,.064)],16,!1,!0),Ho(e,J.band,.2,.8),W(e,[a(.002,.109),a(.036,.107)],16,!1,!1),Ho(e,J.scarf,.8,.8);let o=(e,t)=>({c:[.012+e*.3,e-.012,0],u:[t,0,0],v:[0,0,t*1.05]});return W(e,[o(-.03,.094),o(0,.088),o(.035,.078),o(.055,.066)],14,!1,!1),e.build()}function ds(e){let t=new $e(1024);t.reset(0,0,0,0),Ho(t,J.trousers,e);let n=.074,r=[...[90,70,50,30,12].map(e=>{let t=e*Math.PI/180;return[-.094*Math.sin(t),.097*Math.cos(t),Math.sin(t)]}),[0,.097,0],[.06,.097,0],[zo*.3,.095,0],[zo*.75,.082,0],[zo,n,0],[.4733,n*.82,-.5],[.4992,n*.42,-.85]],i=[],a=0;r.forEach(([e,n,o],s)=>{s>0&&(a+=Math.hypot(e-r[s-1][0],n-r[s-1][1]));let c=Math.sqrt(1-o*o),l=[];for(let r=0;r<=12;r++){let i=r/12*Math.PI*2,s=Math.cos(i),u=Math.sin(i);l.push(t.vert(e,s*n,u*n,-o,s*c,u*c,r/12*Math.PI*2*Math.max(n,e<0?.097:0),a,1))}i.push(l)});for(let e=0;e<i.length-1;e++)for(let n=0;n<12;n++){let r=i[e][n],a=i[e][n+1],o=i[e+1][n+1],s=i[e+1][n];t.tri3(r,a,o),t.tri3(r,o,s)}let o=r.length-1,s=t.vert(r[o][0],0,0,1,0,0,0,a,1);for(let e=0;e<12;e++)t.tri3(s,i[o][e],i[o][e+1]);return t.build()}function fs(e){let t=new $e(1024);return t.reset(0,0,0,0),Ho(t,J.trousers,e),ct(t,0,0,0,.078,.078,.076,10,6),Je(t,[0,0,0],[.39999999999999997,0,0],[[0,.072],[.3,.076],[.72,.058],[1,.05]],12),Ho(t,J.boot,.2,.7),Je(t,[.35,0,0],[Bo,0,0],[[0,.056],[1,.052]],10),t.build()}function ps(e=!0){let t=new $e(1024);t.reset(0,0,0,0),Ho(t,J.boot,.2,.7);let n=(e,t,n,r)=>({c:[e,r,0],u:[0,0,t],v:[0,n,0],sq:1.5,back:.75});return W(t,[n(-.085,.034,.04,0),n(-.05,.048,.056,.004),n(.02,.052,.052,0),n(.09,.058,.042,-.006),n(.16,.052,.034,-.012),n(.205,.034,.024,-.016)],12,!0,!0,(e,t)=>t>.5?.6:1),e&&(t.color(J.metal).data(ht.PLAIN,.3,.3,0),qe(t,.03,-.052,0,.095,.02,.105)),t.build()}function ms(){let e=new $e(256);return e.reset(0,0,0,0),e.color(J.metal).data(ht.PLAIN,.3,.3,0),qe(e,Io,0,.135,.095,.02,.105),qe(e,-.17,0,-.135,.095,.02,.105),e.build()}var hs=10;function gs(){let e=new $e(256);e.reset(0,0,0,0),Ho(e,J.scarf,.8,.8);for(let t=0;t<2;t++){let t=e.nv;for(let t=0;t<=hs;t++)e.vert(0,0,0,0,0,1,0,t*.085,1-t/hs*.25),e.vert(0,0,0,0,0,1,.075,t*.085,1-t/hs*.25);for(let n=0;n<hs;n++){let r=t+n*2;e.tri3(r,r+1,r+3),e.tri3(r,r+3,r+2)}}let t=e.build();return t.getAttribute(`position`).setUsage(Ue),t}function _s(e){let t=new $e(4096);t.reset(0,0,0,0);let n=e?-1:1,r=(e,r,i)=>t.pl(e,r,i*n),i=e=>e<.42?[e/.42*-.06,e/.42*.16,e/.42*.62]:[-.06-.2*((e-.42)/.58),.16-.1*((e-.42)/.58),.62+.86*((e-.42)/.58)];Ho(t,J.feather,.5,1.2),Je(t,[0,0,0],[-.06,.16,.62*n],[[0,.045],[1,.034]],8),Je(t,[-.06,.16,.62*n],[-.26,.06,1.48*n],[[0,.034],[1,.016]],8);let a=(e,n,a,o,s,c)=>{let[l,u,d]=i(e),f=Math.hypot(o[0],o[1],o[2]),p=o[0]/f,m=o[1]/f,h=o[2]/f,g=-h,_=p,v=Math.hypot(g,_)||1;g/=v,_/=v,t.color(c);let y=r(l-g*a*.5,u+s,d-_*a*.5),b=r(l+g*a*.5,u+s,d+_*a*.5),x=l+p*n*.7,S=u+s+m*n*.7,C=d+h*n*.7,w=r(x-g*a*.56,S,C-_*a*.56),T=r(x+g*a*.56,S,C+_*a*.56),E=r(l+p*n,u+s+m*n,d+h*n);t.quad(y,b,T,w,0,0,a,n*.7,1,1,.92,.92),t.tri(w,T,E,0,n*.7,a,n*.7,a/2,n,.92,.92,.8)};for(let e=0;e<13;e++){let t=.1+e/12*.9,n=e%3==0?J.featherGold:e%3==1?J.feather:J.featherBlue;a(t,.5+.62*t**.8,.2-.07*t,[-1,-.1-.1*t,.1+1.25*t*t],-.01*e,n)}for(let e=0;e<9;e++){let t=.06+e/8*.86;a(t,.26+.12*t,.19,[-1,-.04,.2+.7*t*t],.02,e%2?J.feather:J.featherBlue)}return t.build()}var vs=()=>new F({uniforms:{uBend:{value:0},uBendCenter:{value:new R},uAlpha:{value:.55}},vertexShader:`
    uniform float uBend; uniform vec3 uBendCenter; varying vec2 vUv;
    void main() {
      vUv = uv;
      vec4 wp = modelMatrix * vec4(position, 1.0);
      vec2 d = wp.xz - uBendCenter.xz;
      wp.y += uBend * dot(d, d);
      gl_Position = projectionMatrix * viewMatrix * wp;
    }`,fragmentShader:`
    precision highp float; uniform float uAlpha; varying vec2 vUv;
    void main() {
      vec2 c = vUv * 2.0 - 1.0;
      float a = smoothstep(1.0, 0.2, length(c)) * uAlpha;
      gl_FragColor = vec4(0.004, 0.006, 0.030, a);
    }`,transparent:!0,depthWrite:!1,polygonOffset:!0,polygonOffsetFactor:-2,polygonOffsetUnits:-2});function ys(n,i,a){let o=new t,s=new t;o.add(s);let c=e=>{let t=new P(e,i);return t.frustumCulled=!1,t},l=.85,u=new t;u.position.y=l,o.remove(s),o.add(u),u.add(s);let d=new t;d.position.set(Po[0],0,0);let f=c(Wo());f.position.x=-Po[0];let p=c(Uo());p.position.set(Ao[0]-Po[0],Ao[1],0);let m=new t;m.position.set(Po[0],Po[1],0);let h=c(Go()),g=c(Uo());g.position.set(jo[0]-Po[0],jo[1]-Po[1],0),m.add(h,g);let _=c(Ko());_.position.set(Mo[0]-Po[0],Mo[1],0);let v=c(ms());v.visible=!1,_.add(v),d.add(f,p,_);let y=new t;y.add(d,m);let b=new t;b.position.set(Ro[0],Ro[1],0);let x=c(Zo());x.position.set(-Ro[0],-Ro[1],0);let S=c(us());S.position.set(qo.top[0]-Ro[0],qo.top[1]-Ro[1],0);let C=c(gs());C.position.copy(x.position);let w=c(rs());w.position.set(ts[0]-Ro[0],ts[1]-Ro[1],0),w.rotation.z=ns;let T=new t,D=c(es());T.add(D),b.add(T);let O=new R(qo.d[0],qo.d[1],0),A=c(Qo(!1)),j=c(Qo(!0));A.position.copy(x.position),j.position.copy(x.position),j.visible=!1,b.add(A,j);let M=new e,N=new k(0,0,0,`YXZ`);b.add(x,S,C),s.add(y,b);let ee=[];for(let e of[-1,1]){let n=c(ss(.75+e*.08)),r=c(cs(.75+e*.08)),i=new t;i.position.x=os;let a=c(ls(e,!1)),o=c(ls(e,!0));o.visible=!1,i.add(a,o),r.add(i),s.add(n,r),ee.push({side:e,upper:n,fore:r,hand:i,fist:a,open:o})}let te=[];for(let e of[-1,1]){let t=c(ds(.4+e*.1)),n=c(fs(.6+e*.1)),r=c(ps()),i=c(ps(!1));i.visible=!1,s.add(t,n,r,i),te.push({side:e,thigh:t,shin:n,foot:r,boot:i})}let ne=[];for(let e of[-1,1]){let n=new t;n.position.set(-.2,1.2,e*.1);let r=c(_s(e<0)),i=new gt(4);i.reset(0,0),i.addLocal(-.26,.06,1.48*e,.3,[.85,.92,1],1.4,3,.4),i.addLocal(-.06,.16,.62*e,.22,[1,.92,.7],1,3,.8);let o=new P(i.build(),a);o.frustumCulled=!1,o.renderOrder=61,n.add(r,o),n.scale.setScalar(1e-4),n.visible=!1,b.add(n),ne.push({side:e,pivot:n})}let F=0,re=new gt(4);re.reset(0,0),re.addLocal(Po[0]+.17,Po[1]-.12,0,.5,[1,.85,.55],1.5,3,.2),re.addLocal(Ao[0]-.4,Ao[1]+.18,0,.17,[1,.1,.04],.85,3,.7);let ie=new P(re.build(),a);ie.frustumCulled=!1,ie.renderOrder=61,y.add(ie);let ae=vs();ae.uniforms.uBend=n.uBend,ae.uniforms.uBendCenter=n.uBendCenter;let oe=new P(new E(2,1).rotateX(-Math.PI/2),ae);oe.frustumCulled=!1,oe.renderOrder=4,o.add(oe);let I=C.geometry.getAttribute(`position`),se=[qo.top[0]-.05,qo.top[1]+.012],ce=0,L=new R,le=new R,ue=new R,de=new R,fe=new R,pe=new R,me=new R,he=new R,ge=new R(1,0,0),_e=new R(0,1,0),ve=new R(0,0,1),ye=new R,be=new R,xe=new r,Se=new R,Ce=new e,we=new e,Te={q:new e().setFromRotationMatrix(new r().makeBasis(new R(.7071,0,.7071),new R(0,1,0),new R(-.7071,0,.7071))),wrist:new R(-.105,.038,-.115)},z={t:0,stand:0,superK:0,noHand:0,whipK:0,cheer:0,hat:0,foot:0,grabL:0,grabR:0,bail:0,look:0,walk:0,hang:0,tuck:0,twist:0,climb:0},Ee=new R;function De(e,t,n,r,i,a=as){de.subVectors(n,t);let o=de.length(),s=is+a-.006;o=Math.min(Math.max(o,.07),s),de.normalize();let c=(is*is-a*a+o*o)/(2*o),l=Math.sqrt(Math.max(is*is-c*c,0));fe.copy(r).addScaledVector(de,-r.dot(de)),fe.lengthSq()<1e-6&&fe.set(0,-1,0),fe.normalize(),ue.copy(t).addScaledVector(de,c).addScaledVector(fe,l),e.upper.position.copy(t),e.upper.quaternion.setFromUnitVectors(ge,pe.subVectors(ue,t).normalize()),pe.copy(t).addScaledVector(de,o).sub(ue).normalize(),e.fore.position.copy(ue),ye.copy(i).addScaledVector(pe,-i.dot(pe)),ye.lengthSq()<.02&&ye.set(-1,0,0).addScaledVector(pe,pe.x),ye.normalize(),be.crossVectors(pe,ye),e.fore.quaternion.setFromRotationMatrix(xe.makeBasis(pe,ye,be))}let Oe={root:o,tilt:s,steer:m,shadow:oe,head:S,eyes:[Jo[0]-qo.top[0]+.0935,Jo[1]-qo.top[1]+.01],pose(e){let t=e.dt||.016,n=e.speed||0,r=e.air>0;z.t+=t,z.stand=K(z.stand,e.sprint&&!r?1:0,7,t),z.superK=K(z.superK,+(e.trickPose===1),13,t),z.noHand=K(z.noHand,+(e.trickPose===2),13,t),z.whipK=K(z.whipK,+(e.trickPose===3||Math.abs(e.whip||0)>.15),13,t),z.cheer=K(z.cheer,+!!e.cheer,e.cheer?10:5,t),z.bail=K(z.bail,+!!e.bail,10,t),z.foot=K(z.foot,+(n<.4&&!r&&!e.walk),6,t),z.walk=e.park&&e.park.snap?+!!e.walk:K(z.walk,+!!e.walk,7,t);let i=z.walk,a=e.stride||0;z.hang=K(z.hang,e.walk&&r?1:0,9,t),z.tuck=K(z.tuck,e.walk&&r?Ut(Math.abs(e.flipV||0)/4.5,0,1):0,11,t),z.twist=K(z.twist,e.walk&&r?Ut(Math.abs(e.spinV||0)/4.5,0,1):0,11,t),z.climb=K(z.climb,e.walk&&e.scramble?1:0,12,t);let o=i*Math.min(1,n/1.2),c=Math.min(.34,.2+.03*n),f=Ut((n-3.2)/2,0,1);z.hat=K(z.hat,+((n>17||(e.hyper||0)>.4)&&!r&&z.cheer<.3&&z.stand<.5),4,t),z.grabL=K(z.grabL,+(e.grab<0),e.grab<0?24:9,t),z.grabR=K(z.grabR,+(e.grab>0),e.grab>0?24:9,t),z.look=K(z.look,Ut(e.look||0,-1.1,1.1),5,t);let h=e.squash||0,x=z.bail*Math.sin(z.t*23)*.35;p.rotation.z=-e.wheel,g.rotation.z=-e.wheel,_.rotation.z=-e.crank,m.rotation.y=(-e.steer*.42+x)*(1-i)+.34*i;let C=Math.sin(e.crank)*.115*z.stand;if(s.rotation.set(e.lean+C-z.foot*.07+x*.2,0,e.pitch,`YZX`),s.position.y=e.bob-l,u.rotation.set(0,-(e.spin||0),e.flip||0,`YZX`),i>.001&&e.park){s.updateWorldMatrix(!0,!1),s.worldToLocal(Ee.set(e.park.x,e.park.y,e.park.z));let t=i*i*(3-2*i);y.position.copy(Ee).multiplyScalar(t),s.getWorldQuaternion(Ce).invert().multiply(M.setFromEuler(N.set(.1,e.park.yaw,0))),y.quaternion.identity().slerp(Ce,t)}else y.position.set(0,0,0),y.quaternion.identity();v.visible=i>.5,j.visible=i>.5,A.visible=!j.visible,d.rotation.y=-(e.whip||0);let w=Ro[0]+.11*z.stand-.27*z.superK+.17*i,E=Ro[1]+.15*z.stand+.3*z.superK-.11*h+.05*z.whipK+i*(-.012-.05*f*(1-z.hang)+.014*o*Math.cos(a*2)-.13*h);b.position.set(w,E,0);let k=Math.sin(e.crank)*.04*Math.min(1,n/4)*(e.flying?.3:1)*(1-z.superK)*(1-i),P=i*(.66-.04*n*(1-z.hang)-.85*z.tuck-.12*z.climb+.06*z.twist),re=(r?.08:0)-Math.abs(k)*.3-.24*z.stand-.82*z.superK+.2*z.cheer+.16*z.noHand-.14*h+.1*z.foot+.05*z.hat+P;{let e=i*i*(3-2*i),t=qo.d;T.position.set($o[0]-Ro[0]-t[0]*.13*e,$o[1]-Ro[1]-t[1]*.13*e,0),T.quaternion.setFromAxisAngle(O,-.42*e),D.position.set(-$o[0]-t[1]*.07*e,-$o[1]+t[0]*.07*e,0)}b.rotation.set(k-e.steer*.1*(1-i)-C*.7,e.steer*.1*(1-i)-z.look*.12*(1-.6*i)+.07*o*Math.sin(a),re,`YZX`);let ie=z.foot*Math.sin(z.t*.6)*.5,ue=-e.steer*(.32-.14*i)-z.look*.75+ie;S.rotation.set(-k*.8+C*.3,0,-e.pitch*.5-re*.75-P*.02-.7*z.tuck*i+(e.flying?.12:0)+.12*z.cheer,`YZX`),Ce.setFromAxisAngle(ve,-P),we.setFromAxisAngle(_e,ue),Ce.multiply(we).multiply(we.setFromAxisAngle(ve,P)),S.quaternion.premultiply(Ce),S.position.set(qo.top[0]-Ro[0]-.035*i,qo.top[1]-Ro[1]+.012*i,0),b.updateMatrix(),he.set(Jo[0]-Ro[0],Jo[1]-Ro[1]+.15,0).applyMatrix4(b.matrix);for(let e of ee){let t=e.side;L.set(Yo[0]-Ro[0],Yo[1]-Ro[1],t*Yo[2]).applyMatrix4(b.matrix),le.set(Vo[0]-Po[0],Vo[1]+.045-Po[1],t*Vo[2]).applyAxisAngle(_e,m.rotation.y),le.x+=Po[0],le.y+=Po[1],me.set(-.25,-.7,t*.75);let r=(e,t,n,r)=>{e>.001&&(le.x+=(t-le.x)*e,le.y+=(n-le.y)*e,le.z+=(r-le.z)*e)};if(r(z.noHand,L.x-.02,L.y+.2,L.z+t*.5),i>.001){let e=-Math.sin(a+(t>0?0:Math.PI))*o;t<0&&e<0&&(e*=.7);let s=.05+.22*f+e*(.34+.05*n),c=.492-.14*f,l=L.x+Math.sin(s)*c,u=L.y-Math.cos(s)*c,d=L.z+t*(t<0?.1:.04),p=(e,t,n,r)=>{l+=(t-l)*e,u+=(n-u)*e,d+=(r-d)*e};p(z.hang,L.x+.07,L.y-.11,L.z+t*.33),p(z.twist,L.x+.17,L.y-.2,t*.04),p(z.tuck,w+.31,E-.19,t*.15),p(z.climb,L.x+.27,L.y+.27+.17*Math.sin(z.t*9+(t>0?0:Math.PI)),L.z+t*.02),r(i,l,u,d)}let s=t<0?z.hat:0;s>.001&&(L.y+=.06*s,L.z+=.015*s),r(s,he.x+Te.wrist.x,he.y+Te.wrist.y,he.z+Te.wrist.z),t>0&&r(z.cheer,L.x+.1,L.y+.41+.055*Math.sin(z.t*11),L.z+.16);let c=t<0?z.grabL:z.grabR;r(c,L.x+.22,L.y+.02,L.z+t*.44),r(z.bail*.8,L.x+.1+.12*Math.sin(z.t*19+t),L.y+.25+.15*Math.sin(z.t*17+t*2),L.z+t*.4);let l=Math.min(1,z.noHand+(t>0?z.cheer:0)+z.bail);l+s>.3?me.set(-.15,-.35,t*.95):i>.5&&me.set(-1+z.twist+.8*z.climb,.15-.75*z.twist-.65*z.climb,t*(.25+.6*z.twist+.6*z.climb)),Se.set(-.9*l+.2*i,(1-l)*(1-i),t*(.45*l+i)).normalize(),De(e,L,le,me,Se,as-.07*s),e.hand.quaternion.identity(),s>.001&&e.hand.quaternion.slerp(we.copy(e.fore.quaternion).invert().multiply(Te.q),s);let u=Math.max(z.noHand,s,c,z.bail,i*z.climb,i*z.hang*(1-z.tuck)*(1-z.twist))>.5;e.open.visible=u,e.fist.visible=!u}for(let t of te){let n=e.crank+(t.side>0?0:Math.PI),r=Mo[0]+Math.cos(-n)*Io,s=Mo[1]+Math.sin(-n)*Io+.085,l=t.side*Lo,u=1,d=w,p=E-.03,m=(e,t,n,i)=>{e>.001&&(r+=(t-r)*e,s+=(n-s)*e,l+=(i-l)*e,u*=1-e)};if(m(z.superK,d-.86,p+.14,t.side*.1),m(z.whipK,d+.34,p-.36,t.side*.22),t.side<0&&m(z.foot,.06,.07,-.33),i>.001){let e=a+(t.side>0?0:Math.PI),n=t.side>0,r=d+Math.sin(e)*c*o,s=.052+Math.max(0,Math.cos(e))*(.1+.1*f)*o,l=t.side*.088,u=(e,t,n,i)=>{r+=(t-r)*e,s+=(n-s)*e,l+=(i-l)*e};u(z.hang,d+(n?.22:-.16),p-(n?.64:.77),t.side*.09),u(z.twist,d+.02,p-.885,t.side*.055),u(z.tuck,d+.25,p-.33,t.side*.1),u(z.climb,d+.31,p-.56+.17*Math.sin(z.t*9+(n?Math.PI:0)),t.side*.1),m(i,r,s,l)}m(z.bail*.6,d+.2+.2*Math.sin(z.t*15+t.side),p-.7,t.side*.3);let h=r-d,g=s-p,_=Math.hypot(h,g),v=.8979999999999999;_>v&&(h*=v/_,g*=v/_,_=v);let y=(zo*zo-Bo*Bo+_*_)/(2*_),b=Math.sqrt(Math.max(zo*zo-y*y,0)),x=d+h*y/_-g*b/_,S=p+g*y/_+h*b/_,C=d+h,T=p+g,D=(t.side*.129+l)/2+t.side*5e-4;t.thigh.position.set(d,p,t.side*.1),t.thigh.rotation.set(0,-Math.atan2(D-t.side*.1,zo),Math.atan2(S-p,x-d),`ZYX`),t.shin.position.set(x,S,D);let O=Math.atan2(T-S,C-x);t.shin.rotation.set(0,-Math.atan2(l-D,Bo),O,`ZYX`),t.foot.position.set(C-.02*u,T-.035*u,l),t.foot.rotation.z=(-.22+.25*Math.sin(-n))*u+(O+1.25)*z.superK,t.boot.visible=i>.5,t.foot.visible=!t.boot.visible,t.boot.position.copy(t.foot.position),t.boot.rotation.z=t.foot.rotation.z}ce+=t*(2.5+n*.9);let de=Math.min(1,n/9),fe=I.array;for(let t=0;t<2;t++){let n=t===0?-1:1;for(let r=0;r<=hs;r++){let i=r/hs,a=r*(.085-t*.012),o=i**1.3*(.05+.1*de),s=ce*(1+t*.17)-r*.85+t*1.9,c=-a*(.25+.75*de),l=-a*(1-de)*.95+a*de*.1,u=se[0]+c,d=se[1]+l+Math.sin(s)*o,f=n*(.035+i*.05)+Math.cos(s*.83+1)*o*.9-e.steer*i*.16*de,p=.036*(1-.35*i),m=(t*11+r)*6,h=Math.sin(s*.6)*.8;fe[m]=u,fe[m+1]=d-Math.cos(h)*p,fe[m+2]=f-Math.sin(h)*p,fe[m+3]=u,fe[m+4]=d+Math.cos(h)*p,fe[m+5]=f+Math.sin(h)*p}}I.needsUpdate=!0;let pe=+!!e.wings;F+=(pe-F)*Math.min(1,t*5);for(let t of ne){t.pivot.visible=F>.002;let n=F<.5?2*F*F:1-(-2*F+2)**2/2;t.pivot.scale.setScalar(Math.max(1e-4,n*(1+.25*Math.sin(Math.min(F,1)*Math.PI))));let r,i;if(e.flying){let t=Math.sin(e.flap||0);r=e.climb?.1+t*.78:.16+t*.1,i=e.climb?-.1+Math.cos(e.flap||0)*.1:-.05}else r=1.12+Math.sin(ce*.5)*.04,i=-.55;t.pivot.rotation.set(-t.side*r,t.side*i,0,`YXZ`)}ae.uniforms.uAlpha.value=.55*Math.max(0,1-e.air*.25);let ge=1+e.air*.12;oe.scale.set(ge*(1-.58*i),1,ge*(1-.25*i))},setLamp(e){i.uniforms.uDynLamp.value.copy(e)},setColors(e){if(!ke){let e=Object.keys(J);ke=[],o.traverse(t=>{if(!t.isMesh||t.material!==i)return;let n=t.geometry.getAttribute(`color`);if(!n)return;let r=new Int8Array(n.count).fill(-1),a=new Float32Array(n.count);for(let t=0;t<n.count;t++){let i=n.getX(t),o=n.getY(t),s=n.getZ(t);for(let n=0;n<e.length;n++){let c=J[e[n]],l=i/c[0];if(l>0&&Math.abs(o/c[1]-l)<.01*l&&Math.abs(s/c[2]-l)<.01*l){r[t]=n,a[t]=l;break}}}ke.push({a:n,key:r,k:a})}),ke.keys=e}let t=ke.keys.map(t=>e[t]||J[t]);for(let{a:e,key:n,k:r}of ke){for(let i=0;i<e.count;i++)if(n[i]>=0){let a=t[n[i]];e.setXYZ(i,a[0]*r[i],a[1]*r[i],a[2]*r[i])}e.needsUpdate=!0}}},ke=null;return Oe}var bs=8.2,xs=15.5,Ss=19,Cs=9.4,ws=1.32,Ts=Math.PI*2,Es=9.4,Ds=8.6,Os=13,ks=8.5,As=[``,`Superman`,`No-hander`,`Tailwhip`],js=[``,``,`Double `,`Triple `,`Quad `],Ms=.34,Ns=.6,Ps=.28,Fs=2.2,Is=6.4,Ls=5.6,Rs={floor:0,blocked:!1,roof:!1,hall:null,ceil:1/0},zs={steer:0,throttle:0,brake:0,trick:0,trickPressed:!1},Bs=class{constructor(){this.reset()}reset(){let e=_t.bike;this.gx=e.gx,this.gz=e.gz,this.heading=e.heading,this.y=this.groundAt(this.gx,this.gz),this.vy=0,this.speed=0,this.steer=0,this.lean=0,this.pitch=0,this.grounded=!0,this.coyote=0,this.airTime=0,this.wheel=0,this.crank=0,this.bob=0,this.squash=0,this.onRoof=!1,this.hall=null,this.bump=0,this.landed=0,this.jumped=!1,this.distance=0,this.auto=!1,this.wings=!1,this.flying=!1,this.climbing=!1,this.flap=0,this.roadT=0,this.wingsFolded=!1,this.spin=0,this.flip=0,this.spinV=0,this.flipV=0,this.whip=0,this.pose=0,this.poseHeld=[0,0,0,0],this.poseCount=0,this.airTop=0,this.airRoof=!1,this.trick=null,this.bail=0,this.gv=0,this.launched=!1,this.lifting=!1,this.hyper=0,this.hyperK=0,this.walking=!1,this.stride=0,this.back=!1,this.scramble=!1,this.climbT=0,this.wallT=0,this.kicks=0,this.flipArm=!1,this.park=null,this.wx=0,this.wz=0,this.fx=0,this.fz=-1,this.syncWorld()}takeOff(e){this.vy=Math.max(this.vy,e),this.grounded=!1,this.lifting=!0}setWalking(e){return e===this.walking||this.auto||!this.grounded||e&&(this.wings||this.bail>0)?!1:(this.syncWorld(),e?(this.park={x:this.wx-this.fz*.55,y:this.y,z:this.wz+this.fx*.55,yaw:-this.worldHeading,snap:!1},this.speed=Math.min(this.speed,2),this.hyper=0,this.back=!1,this.stride=0):(this.park.snap=Math.hypot(this.park.x-this.wx,this.park.z-this.wz)>7||Math.abs(this.park.y-this.y)>1.5,this.speed=0),this.walking=e,this.steer=0,this.lean=0,this.spin=0,this.flip=0,this.whip=0,this.gv=0,this.pose=0,this.scramble=!1,this.climbT=0,this.wallT=0,this.kicks=0,!0)}walk(e,t){this.landed=0,this.bump=0,this.jumped=!1,this.launched=!1,this.sprinting=!1,this.steer=K(this.steer,t.steer,10,e),this.heading+=this.steer*2.9*e*(this.grounded?1:.3),this.hyper>0&&(this.hyper=0),this.bail>0&&(this.bail=Math.max(0,this.bail-e)),this.hyperK=K(this.hyperK,0,2.2,e);let n=t.brake>0&&!(t.throttle>0),r=t.throttle>0?t.trick>0?Ls:3:n?1.5:0;this.grounded&&n!==this.back&&(this.speed>.15?r=0:this.back=n),this.grounded||(r=this.speed);let i=this.speed,a=r>i?9:13;this.speed=Ut(i+Ut(r-i,-a*e,a*e),0,Ls);let o=this.back?-1:1;this.grounded?this.coyote=.12:this.coyote-=e,t.jumpPressed&&this.coyote>0?(this.vy=8.4,this.grounded=!1,this.lifting=!0,this.coyote=0,this.jumped=!0,this.airRoof=this.onRoof,this.flipArm=!1):t.jumpPressed&&!this.grounded&&this.wallT>0&&this.kicks<4&&(this.heading+=Math.PI,this.steer=0,this.vy=8,this.speed=Ls,this.back=!1,this.wallT=0,this.kicks++,this.scramble=!1,this.jumped=!0,this.flipArm=!1),this.scramble&&(this.speed=Math.max(this.speed,3));let s=this.speed*e,c=Math.max(1,Math.ceil(s/.3)),l=Math.cos(this.heading)*s*o/c,u=Math.sin(this.heading)*s*o/c,d=this.grounded?this.onRoof?1.35:Ns:Ps;this.shut(this.gx,this.gz,d)&&this.unstick(d);let f=!1;for(let t=0;t<c;t++)if(!this.shut(this.gx+l,this.gz+u,d))this.gx+=l,this.gz+=u;else if(f=!0,!this.shut(this.gx+l,this.gz,d))this.gx+=l,this.speed*=1-Math.min(.9,4*e);else if(!this.shut(this.gx,this.gz+u,d))this.gz+=u,this.speed*=1-Math.min(.9,4*e);else{this.speed*=.5;break}this.distance+=s,this.grounded?(this.wallT=0,this.climbT=0,this.kicks=0):this.wallT=f&&o>0?.18:Math.max(0,this.wallT-e);let p=this.probe(this.gx,this.gz,this.y,d),m=p.floor,h=p.ceil;if(this.hall=p.hall&&this.y<p.hall.under?p.hall:null,this.onRoof=p.roof&&this.grounded,this.grounded&&(m<this.y-.7?(this.grounded=!1,this.vy=0,this.airRoof=p.roof):(this.y+=(m-this.y)*Math.min(1,22*e),this.vy=0)),this.grounded)this.airTime=0,this.scramble=!1,this.spin=K(this.spin,0,16,e),this.flip=K(this.flip,0,16,e),this.whip=0,this.spinV=0,this.flipV=0,this.pose=0;else{this.lifting&&=(this.y=Math.max(this.y,m),!1);let n=t.jump>0;if(this.scramble=this.wallT>0&&t.throttle>0&&this.climbT<Fs&&this.vy>-9,this.scramble)this.climbT+=e,this.vy=Math.min(Is,Math.max(this.vy,0)+45*e);else{let t=this.vy>0?n?Ss*.55:Ss:n?Ss*.42:Ss*.9;this.vy=Math.max(this.vy-t*e,n?-9:-30)}this.y+=this.vy*e,this.y+1.75>h-.05&&(this.y=h-.05-Ze,this.vy>0&&(this.vy=-.5)),this.airTime+=e,this.airTime<=e*1.5&&(this.airTop=this.y),this.airTop=Math.max(this.airTop,this.y),t.throttle>0||(this.flipArm=!0);let r=!this.scramble&&this.wallT<=0;zs.steer=r?t.steer:0,zs.throttle=r&&this.flipArm?t.throttle:0,zs.brake=r?t.brake:0,this.tricks(e,zs,m),this.y<=m&&(this.landed=-this.vy,this.squash=Math.min(1,this.landed/14),this.y=m,this.vy=0,this.grounded=!0,this.land(m),this.airTime=0,this.scramble=!1)}this.flying=!1,this.climbing=!1,this.wingsFolded=!1,this.gv=0,this.pitch=K(this.pitch,0,10,e),this.lean=K(this.lean,0,8,e),this.squash=K(this.squash,0,7,e),this.bob=-this.squash*.1,this.grounded&&(this.stride+=o*this.speed*e*(Math.PI/2)/Math.min(.34,.2+.03*this.speed)),this.syncWorld()}groundAt(e,t){return Lt(e,t,-1e4,0,Rs).floor}probe(e,t,n,r){let i=ft(e,t,n,r,Ms);return Lt(e,t,n,r,Rs),Rs.blocked=Rs.blocked||i,Rs}shut(e,t,n){return ft(e,t,this.y,n,Ms)}unstick(e){for(let t=.06;t<1.5;t*=1.4)for(let n=0;n<12;n++){let r=this.heading+Math.PI+(n%2?1:-1)*Math.ceil(n/2)*(Math.PI/6),i=this.gx+Math.cos(r)*t,a=this.gz+Math.sin(r)*t;if(!this.shut(i,a,e)){this.gx=i,this.gz=a;return}}}sidestep(e,t,n,r,i,a){let o=Math.abs(e)>Math.abs(t),s=+!o,c=+!!o,l=(o?t:e)>=0?1:-1;for(let o=1;o<=4;o++)for(let u=0;u<2;u++){let d=u?-l:l,f=d*o*.22,p=this.gx+s*f,m=this.gz+c*f;if(this.shut(p,m,i)||this.shut(p+n,m+r,i)||this.shut(p+e*.9,m+t*.9,i))continue;let h=d*Math.min(Math.abs(f),Math.max(a,.04)*1.3);if(!this.shut(this.gx+s*h,this.gz+c*h,i))return this.gx+=s*h,this.gz+=c*h,!0}return!1}update(e,t){if(this.walking&&this.auto&&(this.walking=!1,this.park&&(this.park.snap=!0)),this.walking)return this.walk(e,t);this.landed=0,this.bump=0,this.jumped=!1,this.launched=!1;let n=t.steer;this.auto&&(n=0),this.steer=K(this.steer,n,n===0?7:5.5,e);let r=this.speed,i=(2.5-1.05*yt(4,16,r))*Math.max(Ut(r/2.2,0,1),Math.abs(n)>.1?.28:0);if(this.heading+=this.steer*i*e*(this.grounded?1:this.wings?.9:.3),this.grounded&&Math.abs(n)<.05&&r>1&&!this.onRoof){let t=Math.round(this.heading/(Math.PI/2))*(Math.PI/2),n=Mt(this.heading,t);Math.abs(n)<.5&&(this.heading+=n*Math.min(1,1.6*e)),this.centreInLane(e,t)}this.hyper>0&&(this.hyper=Math.max(0,this.hyper-e)),this.hyperK=K(this.hyperK,+(this.hyper>0),this.hyper>0?5:2.2,e),this.bail>0&&(this.bail=Math.max(0,this.bail-e));let a=1+.8*this.hyperK,o=this.wings&&!this.grounded&&!this.auto,s=!this.grounded&&!this.wings,c=(o?15:bs)*a;t.throttle>0&&!s&&(c=(o?25:xs)*a),t.brake>0&&!s&&(c=o?7:0),s&&!this.auto&&(c=Math.max(r,bs*.8));let l=!!this.hall&&this.hall.theme===`gallery`&&this.grounded&&!this.auto;l&&(c*=.55),this.auto&&(c=this.autoSpeed??0),this.sprinting=this.grounded&&t.throttle>0&&!this.auto&&r>4;let u=this.pitch,d=(c>r?this.grounded?5.2:o?6:1.5:t.brake>0?11:l?9:3.2)*(1+1.2*this.hyperK);this.speed+=Ut(c-r,-d*e,d*e),this.grounded&&(this.speed-=Math.sin(u)*(this.onRoof?2:6.5)*e),this.speed=Ut(this.speed,0,32),this.grounded?this.coyote=.12:this.coyote-=e,t.jumpPressed&&this.coyote>0&&!this.auto&&(this.vy=(this.wings?7.5:Cs)*(1+.12*this.hyperK)*(this.onRoof?ws:1),this.airRoof=this.onRoof,this.grounded=!1,this.lifting=!0,this.coyote=0,this.jumped=!0);let f=this.speed*e,p=Math.max(1,Math.ceil(f/.3)),m=Math.cos(this.heading),h=Math.sin(this.heading),g=m*f/p,_=h*f/p,v=this.grounded?this.onRoof?1.35:Ns:Ps;this.shut(this.gx,this.gz,v)&&this.unstick(v);for(let t=0;t<p;t++){if(!this.shut(this.gx+g,this.gz+_,v)){this.gx+=g,this.gz+=_;continue}let t=!this.shut(this.gx+g,this.gz,v),r=!this.shut(this.gx,this.gz+_,v),i=Math.abs(m)>Math.abs(h);if(!(i?t:r)&&!this.auto&&this.sidestep(m,h,g,_,v,f/p))continue;let a;if(t&&(!r||i))this.gx+=g,a=m>=0?0:Math.PI,this.bump=Math.max(this.bump,Math.abs(h)*this.speed);else if(r)this.gz+=_,a=h>=0?Math.PI/2:-Math.PI/2,this.bump=Math.max(this.bump,Math.abs(m)*this.speed);else{this.bump=Math.max(this.bump,this.speed),this.speed*=.5;let t=Math.abs(n)>.1?Math.sign(n):0;for(let e=1;e<=5&&!t;e++){let n=Math.cos(e*.5236),r=Math.sin(e*.5236),i=!this.shut(this.gx+(m*n-h*r)*.75,this.gz+(h*n+m*r)*.75,v);i===!this.shut(this.gx+(m*n+h*r)*.75,this.gz+(h*n-m*r)*.75,v)?i&&(t=this.turnSide||1):t=i?1:-1}this.turnSide=t||this.turnSide||1,this.heading+=this.turnSide*5.5*e;break}let o=Mt(this.heading,a);this.heading+=o*Math.min(1,9*e),this.speed*=1-Math.min(.9,Math.abs(Math.sin(o))*6*e)}this.distance+=f;let y=this.probe(this.gx,this.gz,this.y,v),b=y.floor,x=y.ceil,S=y.roof;if(this.hall=y.hall&&this.y<y.hall.under?y.hall:null,this.onRoof=y.roof&&this.grounded,this.grounded){let t=this.y+this.gv*e-.5*Ss*e*e;if(b<this.y-.7)this.grounded=!1,this.vy=this.gv>2?this.gv*(S?ws:1):Math.min(this.vy,0),this.airRoof=S;else if(this.gv>2.4&&t-b>.06&&!this.auto)this.grounded=!1,this.vy=S?this.gv*1.12*ws+1.6:this.gv*1.12+.6,this.y=t,this.airRoof=S,this.launched=!0;else{let t=this.y;this.y+=(b-this.y)*Math.min(1,22*e),this.gv=K(this.gv,(this.y-t)/Math.max(e,1e-4),16,e),this.vy=0}}if(this.grounded)this.airTime=0,this.spin=K(this.spin,0,16,e),this.flip=K(this.flip,0,16,e),this.whip=K(this.whip,0,16,e),this.spinV=0,this.flipV=0,this.pose=0;else{this.lifting&&=(this.y=Math.max(this.y,b),!1);let n=t.jump>0&&!this.auto;if(this.wings){let t=this.groundAt(this.gx,this.gz)+85,r=n?26*Ut((t-this.y)/14,0,1):0;this.vy+=(r-9)*e,this.vy=Ut(this.vy,-5.5,10),this.flap+=e*(n?10.5:2.4),this.climbing=n}else{let t=this.vy>0?n?Ss*.55:Ss:n?Ss*.42:Ss*.9;this.vy-=t*e,this.vy=Math.max(this.vy,n?-9:-30)}this.y+=this.vy*e,this.y+1.75>x-.05&&(this.y=x-.05-Ze,this.vy>0&&(this.vy=-.5)),this.airTime+=e,this.airTime<=e*1.5&&(this.airTop=this.y),this.airTop=Math.max(this.airTop,this.y),this.tricks(e,t,b),this.y<=b&&(this.landed=-this.vy,this.squash=Math.min(1,this.landed/14),this.y=b,this.vy=0,this.grounded=!0,this.gv=0,this.land(b),this.airTime=0)}this.wingsFolded=!1,this.wings&&!this.auto&&(this.grounded?(this.roadT+=e,this.roadT>.16&&(this.wings=!1,this.wingsFolded=!0,this.roadT=0)):this.roadT=0),this.flying=this.wings&&!this.grounded,this.flying||(this.climbing=!1);let C=this.probe(this.gx+m*.6,this.gz+h*.6,this.y+.3,.9).floor,w=this.probe(this.gx-m*.6,this.gz-h*.6,this.y+.3,.9).floor,T=this.grounded?Math.atan2(Ut(C-w,-1.2,1.2),1.2):Ut(this.vy*.035,-.5,.45);this.pitch=K(this.pitch,T,this.grounded?10:4,e),this.lean=K(this.lean,this.steer*Ut(this.speed/9,0,1.3)*(this.flying?.62:.42),8,e),this.squash=K(this.squash,0,7,e),this.wheel+=this.speed*e/ko;let E=(this.grounded||this.flying)&&c>=r-.5&&c>.5;E&&(this.crank+=Ut(this.speed*.62,2,9)*e),this.bob=-this.squash*.1+(E?Math.sin(this.crank*2)*.008:0),this.syncWorld()}tricks(e,t,n){let r=!this.auto&&!this.wings&&this.airTime>.1&&(this.y-n>.8||this.airTime>.3),i=(e,t,n)=>{let r=e-Math.round(e/Ts)*Ts;return Ut(-r*16,-n,n)||0},a=this.vy<-1&&this.y-n<-this.vy*.26,o=a?2.2:1,s=r&&!a&&Math.abs(t.steer)>.4?Math.sign(t.steer)*Es:i(this.spin,this.spinV,Es*o),c=r&&!a?+(t.brake>0)-(t.throttle>0):0,l=c===0?i(this.flip,this.flipV,Ds*o):c*Ds;this.spinV=K(this.spinV,s,a?40:16,e),this.flipV=K(this.flipV,l,a?40:16,e),this.spin+=this.spinV*e,this.flip+=this.flipV*e,r&&t.trickPressed&&(this.poseCount++,this.pose=(this.poseCount-1)%3+1),(!r||!t.trick)&&(this.pose!==3||Math.abs(this.whip-Math.round(this.whip/Ts)*Ts)<.2)&&(this.pose=this.pose===3&&t.trick?3:0),this.pose>0&&(this.poseHeld[this.pose]+=e),this.pose===3?this.whip+=Os*e:Math.abs(this.whip-Math.round(this.whip/Ts)*Ts)>.05&&(this.whip+=Math.min(Os*e,Math.ceil(this.whip/Ts)*Ts-this.whip))}peek(){let e=[],t=Math.trunc(this.flip/Ts+Math.sign(this.flip)*.12),n=Math.trunc(this.spin/Ts+Math.sign(this.spin)*.12);t!==0&&e.push(js[Math.min(Math.abs(t),4)]+(t>0?`Backflip`:`Front flip`)),n!==0&&e.push(String(360*Math.abs(n)));for(let t=1;t<=3;t++)(t===3?this.whip>Ts*.9:this.poseHeld[t]>.22)&&e.push(As[t]);return e}land(e){let t=[],n=0,r=!0,i=this.spin/Ts,a=this.flip/Ts,o=Math.round(i),s=Math.round(a),c=Math.abs(i-o)*Ts;if((Math.abs(a-s)*Ts>1||c>1.5)&&(r=!1),s!==0){let e=Math.min(Math.abs(s),4);t.push(js[e]+(s>0?`Backflip`:`Front flip`)),n+=120*e*(1+.25*(e-1))}if(o!==0){let e=Math.abs(o);t.push(String(360*e)),n+=80*e*(1+.2*(e-1))}for(let e=1;e<=3;e++)if(e===3?this.whip>Ts*.9:this.poseHeld[e]>.22){let r=e===3?Math.round(this.whip/Ts):1;t.push((r>1?js[Math.min(r,4)]:``)+As[e]),n+=e===3?100*r:60+50*Math.min(this.poseHeld[e],2)}let l=this.airTop-e;t.length===0&&l>6.5&&this.airTime>1.1&&(t.push(`Big air`),n+=40),t.length&&(n+=Math.max(0,l-3)*6,this.airRoof&&(n*=1.25),n*=1+.3*(t.length-1)),r||(this.bail=1,this.speed*=.45),this.trick=t.length||!r?{names:t,points:r?Math.round(n/10)*10:0,clean:r,combo:t.length,drop:l,roof:this.airRoof}:null,this.spin=(i-o)*Ts,this.flip=(a-s)*Ts,this.whip-=Math.round(this.whip/Ts)*Ts,this.spinV=0,this.flipV=0,this.pose=0,this.poseCount=0,this.poseHeld=[0,0,0,0],this.airRoof=!1}centreInLane(e,t){let n=Ke(this.gx),r=kt(this.gz),i=xt(n),a=xt(n+1),o=Ft(r),s=Ft(r+1),c=this.gx>i+wt(n)&&this.gx<a-wt(n+1),l=this.gz>o+Ht(r)&&this.gz<s-Ht(r+1),u=Math.abs(Math.sin(t))>.5,d=Math.min(1,.55*e*(1+2.2*this.hyperK));if(u&&!c&&l){let e=this.gx<=i+wt(n)?i:a;this.gx+=(e-this.gx)*d*.6}else if(!u&&c&&!l){let e=this.gz<=o+Ht(r)?o:s;this.gz+=(e-this.gz)*d*.6}}syncWorld(){let e=this.gx,t=this.gz;this.wx=Bt(e,t),this.wz=G(e,t);let n=.5,r=Math.cos(this.heading),i=Math.sin(this.heading),a=Bt(e+r*n,t+i*n)-this.wx,o=G(e+r*n,t+i*n)-this.wz,s=Math.hypot(a,o)||1;this.fx=a/s,this.fz=o/s,this.worldHeading=Math.atan2(this.fz,this.fx)}},Vs={floor:0,blocked:!1,roof:!1},Hs=class{constructor(){this.yaw=-Math.PI/2,this.frac=1,this.lift=0,this.y=0,this.pos={x:0,y:0,z:0},this.target={x:0,y:0,z:0},this.fov=70,this.shake=0,this.roll=0,this.clock=0}snap(e){this.yaw=e.heading,this.frac=1,this.lift=0,this.dist=void 0,this.y=e.y+1.6,this.update(.016,e,{lookYaw:0,lookPitch:0})}update(e,t,n){this.yaw+=Mt(this.yaw,t.heading)*Math.min(1,3.4*e);let r=this.yaw+n.lookYaw,i=yt(6,16,t.speed),a=t.grounded?0:Math.max(0,t.y-t.groundAt(t.gx,t.gz)),o=t.flying?Math.min(1,.35+a/25):t.grounded?0:.55*yt(2.5,9,a);this.air=K(this.air||0,o,2.5,e);let s=t.hyperK||0,c=n.zoom||1,l=(4.9+1.3*i+5.5*this.air-1.7*s)*c*(t.walking?.74:1);this.dist=this.dist===void 0?l:K(this.dist,l,6,e);let u=this.dist,d=((t.onRoof?3:2.45)+2.6*this.air-.32*s)*(.45+.55*c)+Math.sin(n.lookPitch)*u,f=Math.cos(r),p=Math.sin(r),m=t.gx,h=t.gz,g=t.y+1.35,_=-f*u,v=-p*u,y=d-1.35,b=e=>{for(let t=2;t<=9;t++){let n=t/9,r=g+(y+e)*n;if(Lt(m+_*n,h+v*n,r-.45,0,Vs),Vs.blocked||Vs.floor>r-.4)return(t-1)/9}return 1},x=0,S=b(0);if(S<.8)for(let e of[2.6,5.2,8.5]){let t=b(e);if(t>S+.15&&(S=t,x=e),t>=.8)break}S=Math.max(S,.25),this.lift=K(this.lift||0,x,x>(this.lift||0)?6:1.4,e),this.frac=S<this.frac?K(this.frac,S,14,e):K(this.frac,S,2.2,e);let C=this.frac,w=m+_*C,T=h+v*C,E=g+(y+this.lift)*C+(1-C)*1.6;Lt(w,T,E,.2,Vs),E=Math.max(E,Vs.floor+.7),this.y=K(this.y,E,7,e),this.shake=K(this.shake,0,6,e),this.pos.x=Bt(w,T),this.pos.z=G(w,T),this.clock+=e,this.pos.y=this.y+this.shake*.12*Math.sin(this.clock*45);let D=3.6,O=t.gx+Math.cos(r)*D,k=t.gz+Math.sin(r)*D;this.target.x=Bt(O,k),this.target.z=G(O,k),this.target.y=t.y+1.7-Math.sin(n.lookPitch)*2-this.lift*.22-this.air*1.9,this.fov=72+12*i+5*this.air+15*s,this.roll=K(this.roll,-t.lean*(.18+.4*s)*(t.grounded?1:.3),5,e)}};function Us(e){let t=new Set,n={steer:0,throttle:0,brake:0,jump:0,jumpPressed:!1,trick:0,trickPressed:!1,lookYaw:0,lookPitch:0,looking:!1,lastLook:-10,zoom:1,zoomTo:1,any:!1},r=!1,i=!1,a=[`KeyA`,`ArrowLeft`],o=[`KeyD`,`ArrowRight`],s=[`KeyW`,`ArrowUp`],c=[`KeyS`,`ArrowDown`],l=[`KeyE`,`ShiftLeft`,`ShiftRight`],u=new Set([...a,...o,...s,...c,`Space`]),d=e=>!!(e.target&&e.target.closest&&e.target.closest(`#board`));window.addEventListener(`keydown`,e=>{e.metaKey||e.ctrlKey||e.altKey||d(e)||(u.has(e.code)&&e.preventDefault(),e.code===`Space`&&!e.repeat&&(r=!0),l.includes(e.code)&&!e.repeat&&(i=!0),t.add(e.code),n.any=!0)}),window.addEventListener(`keyup`,e=>t.delete(e.code)),window.addEventListener(`blur`,()=>t.clear());let f=null;e.addEventListener(`pointerdown`,t=>{t.pointerType!==`touch`&&(f={x:t.clientX,y:t.clientY,yaw:n.lookYaw,pitch:n.lookPitch},n.looking=!0,e.setPointerCapture(t.pointerId))}),e.addEventListener(`pointermove`,e=>{f&&e.pointerType!==`touch`&&(n.lookYaw=f.yaw+(e.clientX-f.x)*.0052,n.lookPitch=Math.max(-.5,Math.min(.9,f.pitch+(e.clientY-f.y)*.004)))});let p=e=>{e.pointerType!==`touch`&&(f=null,n.looking=!1,n.lastLook=performance.now()/1e3)};e.addEventListener(`pointerup`,p),e.addEventListener(`pointercancel`,p),e.addEventListener(`wheel`,e=>{e.preventDefault();let t=Math.max(-120,Math.min(120,e.deltaY*(e.deltaMode===1?32:1)*(e.ctrlKey?4:1)));n.zoomTo=Math.max(.5,Math.min(2.8,n.zoomTo*Math.exp(t*.0016)))},{passive:!1});let m=document.getElementById(`stick`),h=document.getElementById(`stick-knob`),g=null,_=null,v=null,y=0,b=!1,x=!1,S=!1,C=(e,t=0,n=0,r=0,i=0)=>{m&&(m.classList.toggle(`on`,e),e&&(m.style.left=`${t}px`,m.style.top=`${n}px`,h.style.transform=`translate(${r}px, ${i}px)`))},w=(e,t)=>Math.hypot(e.clientX-t.x,e.clientY-t.y);e.addEventListener(`touchstart`,e=>{e.preventDefault(),n.any=!0;for(let t of e.changedTouches)!g&&t.clientX<window.innerWidth*.5?(g={id:t.identifier,x0:t.clientX,y0:t.clientY},document.getElementById(`stick-demo`)?.classList.remove(`on`),C(!0,t.clientX,t.clientY)):_?v||={id:t.identifier,d0:Math.max(30,w(t,_)),zoom0:n.zoomTo}:(_={id:t.identifier,x:t.clientX,y:t.clientY,x0:t.clientX,y0:t.clientY,yaw:n.lookYaw,pitch:n.lookPitch},n.looking=!0)},{passive:!1}),e.addEventListener(`touchmove`,e=>{e.preventDefault();for(let t of e.changedTouches){if(g&&t.identifier===g.id){let e=t.clientX-g.x0,n=t.clientY-g.y0,r=Math.hypot(e,n);r>70&&(e*=70/r,n*=70/r);let i=e/70,a=n/70,o=Math.abs(i),s=o<.22?0:(o-.22)/.78;y=Math.sign(i)*s**2.2,b=a<-.4,x=a>.4,C(!0,g.x0,g.y0,e,n)}else _&&t.identifier===_.id&&(_.x=t.clientX,_.y=t.clientY,v||(n.lookYaw=_.yaw+(t.clientX-_.x0)*.0052,n.lookPitch=Math.max(-.5,Math.min(.9,_.pitch+(t.clientY-_.y0)*.004))));if(v&&_&&(t.identifier===v.id||t.identifier===_.id)){let r=t.identifier===v.id?t:[...e.touches].find(e=>e.identifier===v.id);r&&(n.zoomTo=Math.max(.5,Math.min(2.8,v.zoom0*v.d0/Math.max(30,w(r,_)))))}}},{passive:!1});let T=e=>{e.preventDefault();for(let t of e.changedTouches)g&&t.identifier===g.id&&(g=null,y=0,b=x=!1,C(!1)),v&&t.identifier===v.id&&(v=null),_&&t.identifier===_.id&&(_=null,v=null,n.looking=!1,n.lastLook=performance.now()/1e3)};e.addEventListener(`touchend`,T,{passive:!1}),e.addEventListener(`touchcancel`,T,{passive:!1}),((e,t,r)=>{let i=document.getElementById(e);if(!i)return;let a=e=>{i.classList.contains(`down`)&&(i.classList.remove(`down`),r()),e&&e.preventDefault()};i.addEventListener(`pointerdown`,e=>{e.preventDefault();try{i.setPointerCapture(e.pointerId)}catch{}i.classList.add(`down`),n.any=!0,t()}),i.addEventListener(`pointerup`,a),i.addEventListener(`pointercancel`,a),i.addEventListener(`lostpointercapture`,()=>a()),i.addEventListener(`contextmenu`,e=>e.preventDefault())})(`pad-jump`,()=>{S=!0,r=!0},()=>{S=!1});let E=e=>e.some(e=>t.has(e)),D={steer:0,throttle:!1,brake:!1,jump:!1,trick:!1,prev:[],lastT:0,looking:!1};n.onLeap=null,n.pad=!1,n.xr=null;let O=e=>{window.dispatchEvent(new KeyboardEvent(`keydown`,{code:e,bubbles:!0})),window.dispatchEvent(new KeyboardEvent(`keyup`,{code:e,bubbles:!0}))},k=(e,t=.2)=>Math.abs(e)<t?0:(e-Math.sign(e)*t)/(1-t);function A(e){let t=Math.min(.1,Math.max(0,e-D.lastT));D.lastT=e,D.steer=0,D.throttle=D.brake=D.jump=D.trick=!1;let a=navigator.getGamepads?navigator.getGamepads():[],o=0,s=0,c=0,l=0,u=!1;for(let e of a){if(!e||!e.connected)continue;let a=t=>!!(e.buttons[t]&&(e.buttons[t].pressed||e.buttons[t].value>.35)),d=D.prev[e.index]||(D.prev[e.index]=[]),f=e=>a(e)&&!d[e];o+=k(e.axes[0]||0),s+=k(e.axes[1]||0),c+=k(e.axes[2]||0),l+=k(e.axes[3]||0),a(14)&&--o,a(15)&&(o+=1),a(7)&&(D.throttle=!0),a(6)&&(D.brake=!0),a(0)&&(D.jump=!0),(a(2)||a(5))&&(D.trick=!0),f(0)&&(r=!0,n.onLeap&&n.onLeap()),(f(2)||f(5))&&(i=!0);let p=!!document.querySelector(`#board:not(.hidden)`);f(1)&&O(p?`Escape`:`KeyF`),f(3)&&O(`KeyT`),f(4)&&O(`Tab`),f(9)&&O(`Enter`),f(8)&&O(`Escape`),a(12)&&(n.zoomTo=Math.max(.5,n.zoomTo*Math.exp(-1.2*t))),a(13)&&(n.zoomTo=Math.min(2.8,n.zoomTo*Math.exp(1.2*t)));for(let t=0;t<e.buttons.length;t++)d[t]=a(t),d[t]&&(u=!0);(o||s||c||l)&&(u=!0)}u&&(n.any=!0,n.pad=!0),D.steer=Math.max(-1,Math.min(1,o)),s<-.45&&(D.throttle=!0),s>.45&&(D.brake=!0),c||l?(n.lookYaw+=c*2.6*t,n.lookPitch=Math.max(-.5,Math.min(.9,n.lookPitch+l*1.8*t)),n.looking=D.looking=!0):D.looking&&(D.looking=!1,n.looking=!1,n.lastLook=e)}return n.update=e=>{A(e);let u=n.xr;n.steer=+!!E(o)-!!E(a)+y+D.steer+(u?u.steer:0),n.steer=Math.max(-1,Math.min(1,n.steer)),n.throttle=E(s)||b||D.throttle||u&&u.throttle?1:0,n.brake=E(c)||x||D.brake||u&&u.brake?1:0,n.jump=t.has(`Space`)||S||D.jump||u&&u.jump?1:0,n.jumpPressed=r||!!(u&&u.pressed),r=!1,u&&(u.pressed=!1),n.trick=E(l)||D.trick||u&&u.trick?1:0,n.trickPressed=i,i=!1,n.zoom+=(n.zoomTo-n.zoom)*.16,!n.looking&&e-n.lastLook>1.2&&(n.lookYaw*=.94,n.lookPitch*=.94,Math.abs(n.lookYaw)<.001&&(n.lookYaw=0),Math.abs(n.lookPitch)<.001&&(n.lookPitch=0))},n.clear=()=>{t.clear(),r=!1,i=!1,n.lookYaw=0,n.lookPitch=0},n}var Ws={steeple:{label:`steeple`,color:`#ffd76a`,icon:`M12 2 L8.6 11.5 H15.4 Z M9.9 11.5 V21.5 H14.1 V11.5 M14.1 15 H20.5 V21.5 H14.1`},cafe:{label:`night café`,color:`#ff9166`,icon:`M5 9.5 H17 V14.5 A6 6 0 0 1 5 14.5 Z M17 11 H19 A2.5 2.5 0 0 1 19 16 H16.7 M4.5 21.5 H17.5 M9 6.8 V4.2 M13 6.8 V4.2`},gallery:{label:`gallery`,color:`#a9d4ff`,icon:`M4 4.5 H20 V19.5 H4 Z M7 16.5 L10.5 11.5 L13 14.5 L15 12.5 L17.5 16.5 Z M15.3 8.4 A1.3 1.3 0 1 0 17.9 8.4 A1.3 1.3 0 1 0 15.3 8.4`},square:{label:`market square`,color:`#ffbf66`,icon:`M3.5 20.5 H20.5 M6 20.5 V17 H18 V20.5 M12 17 V8.5 M12 8.5 C9.4 5 6.6 7.6 7.4 11.6 M12 8.5 C14.6 5 17.4 7.6 16.6 11.6`},view:{label:`viewpoint`,color:`#9be7b4`,icon:`M12 2 C8.4 7 7.4 13 9.5 18.5 H14.5 C16.6 13 15.6 7 12 2 Z M12 18.5 V22`}},Gs=[`Saint-Martin`,`Saint-Paul`,`Sainte-Anne`,`Saint-Rémy`,`Notre-Dame`,`Saint-Trophime`,`Sainte-Marthe`,`Saint-Julien`,`Saint-Césaire`,`Sainte-Claire`,`Saint-Roch`,`Saint-Honorat`,`Saint-Vincent`,`Sainte-Lucie`],Ks=[`Café de la Gare`,`Café de l’Alcazar`,`Café du Forum`,`Café des Étoiles`,`Café de Minuit`,`Café du Midi`,`Café Lamartine`,`Café des Amis`,`Café de la Lune`,`Café du Rhône`,`Café des Lanternes`,`Café du Billard`],qs=[`Galerie des Iris`,`Galerie des Tournesols`,`Galerie des Amandiers`,`Galerie des Oliviers`,`Galerie des Cyprès`,`Galerie du Semeur`,`Galerie des Blés`,`Galerie des Vergers`,`Galerie de l’Arlésienne`,`Galerie du Zouave`,`Galerie des Moissons`,`Galerie du Pont`],Js=[`Place du Forum`,`Place Lamartine`,`Place de la République`,`Place des Lices`,`Place du Marché`,`Place aux Herbes`,`Place de la Fontaine`,`Place Voltaire`,`Place des Platanes`,`Place du Midi`,`Place des Étoiles`,`Place du Puits`],Ys=new Map,Xs=[Ke(_t.camGrid.gx),kt(_t.camGrid.gz)];function Zs(e,t,n,r,i,a,o){return{key:`${e}:${t}:${n}`,type:e,name:a,i:t,j:n,gx:r,gz:i,wx:Bt(r,i),wz:G(r,i),y:Pt(r,i),...o}}function Qs(e,t){let n=e*65536+t,r=Ys.get(n);if(r)return r;Ys.size>2e4&&Ys.clear(),r=[];let i=ot(e,t),a=Nt(Tt(e,t,60606)),o=e=>e[Math.floor(a()*e.length)];if(i===`plaza`){let n=mt(e,t),i=e===0&&t===-1;if(n.church){let a=n.church;r.push(Zs(`steeple`,e,t,a.tx,a.tz,i?`The Steeple`:o(Gs),{home:i,top:a.baseY+a.towerH+a.spireH,sx:(a.nave.x0+a.nave.x1)/2,sz:a.tz}))}else{let i=n.solids.find(e=>e.fountain),a=i?(i.x0+i.x1)/2:n.cx,s=i?(i.z0+i.z1)/2:n.cz;r.push(Zs(`square`,e,t,a,s,o(Js),{top:Pt(a,s)+9}))}}else if(i===`town`){let n=e===-1&&t===-1;if(n||Ot(e,t,555)<.24){let i=mt(e,t).hall;if(i){let a=(i.x0+i.x1)/2;r.push(Zs(i.theme,e,t,a,i.zc,n?`Le Café de Nuit`:o(i.theme===`cafe`?Ks:qs),{home:n,top:i.top+5}))}}}else if(e===Xs[0]&&t===Xs[1]){let{gx:n,gz:i}=_t.camGrid;r.push(Zs(`view`,e,t,n,i,`The Painter’s Knoll`,{home:!0,top:Pt(n,i)+10}))}return Ys.set(n,r),r}function $s(e,t,n,r=[]){let i=Ke(e),a=kt(t);for(let e=i-n;e<=i+n;e++)for(let t=a-n;t<=a+n;t++){let n=Qs(e,t);for(let e=0;e<n.length;e++)r.push(n[e])}return r}var ec=160,tc=[1,.84,.36],nc=[1,.93,.7],rc=[1,.92,.62],ic=13,ac=12,oc=[1,.95,.8],sc=[1,.42,.3],cc=[.8,.9,1],lc=[1,.8,.36],uc=new Map;function dc(e){let t=uc.get(e.key);if(t)return t;uc.size>400&&uc.clear(),t=[];let n=Nt(Tt(e.i,e.j,7313)),r=(r,i,a)=>t.push({gx:r,gz:i,y:Pt(r,i)+1.35+a,key:`${e.key}:${t.length}`,phase:n()*6.28,air:a>.5});if(e.type===`cafe`||e.type===`gallery`){let t=mt(e.i,e.j).hall,n=t.x1-t.x0;r(t.x0+n*.2,t.zc+2.7,0),r(t.x0+n*.62,t.zc-2.7,1),r(t.x0+n*.84,t.zc+2.5,0)}else if(e.type===`steeple`){let t=mt(e.i,e.j).church.nave,n=t.x1-t.x0;r(t.x0+n*.3,e.gz+2.5,0),r(t.x0+n*.56,e.gz-2.5,1.1),r(t.x0+n*.82,e.gz+2.5,0)}else{let t=e.type===`square`?4.6:3.8,i=n()*6.28;for(let n=0;n<3;n++){let a=i+n/3*6.28;r(e.gx+Math.cos(a)*t,e.gz+Math.sin(a)*t,n===1?1.1:0)}}return uc.set(e.key,t),t}function fc(e,t){let n=[],r=Nt(Tt(e,t,9917)),i=(i,a,o,s)=>n.push({gx:i,gz:a,y:o,key:`${e}:${t}:${s}`,phase:r()*6.28});for(let[n,r]of[[`x`,`a`],[`z`,`b`]]){let a=Xe(n,e,t);if(a.arch){let e=(a.arch.a0+a.arch.a1)/2,[t,o]=n===`x`?[a.c,e]:[e,a.c];i(t,o,a.arch.top+1.3,r+`arch`)}}let a=mt(e,t);if(Rt(a.kind)&&a.houses.length){let e=r()<.6?1:r()<.5?2:0;for(let t=0;t<e;t++){let e=a.houses[Math.floor(r()*a.houses.length)];if(e.church)continue;let n=(e.x0+e.x1)/2,o=(e.z0+e.z1)/2;i(n,o,et(e,n,o)+1.3,`r`+t)}}return n}function pc(e,t,n,r,i,a){let o=Ke(e),s=kt(t),c=null,l=1e9;for(let a=12;a<=42&&!c;a+=15)for(let u=o-a;u<=o+a;u++)for(let o=s-a;o<=s+a;o++){let a=Qs(u,o);for(let o=0;o<a.length;o++){let s=a[o];if(i.has(s.key)||s.type!==`steeple`)continue;let u=s.gx-e,d=s.gz-t,f=Math.hypot(u,d);if(f<170)continue;let p=(u*n+d*r)/f,m=Math.abs(f-480)/480-p*.5;m<l&&(l=m,c=s)}}return c}function mc(e,t,n,r){if(e.type===`cafe`||e.type===`gallery`)return!!t.hall&&t.hall.key===`${e.i}:${e.j}`&&Math.abs(n-e.gx)<11;let i=Math.hypot(e.gx-n,e.gz-r);return e.type===`steeple`?Math.hypot(n-e.sx,r-e.sz)<2.5&&t.y<e.y+3.5:i<9.5&&!t.onRoof}var hc=e=>{let t=Ke(e+.01);return Math.abs(xt(t)-e)<.5?t:t+1},gc=e=>{let t=kt(e+.01);return Math.abs(Ft(t)-e)<.5?t:t+1};function _c(e,t){let n=e.blk;if(e.type===`steeple`){let r=t>e.gx?n.i+1:n.i;return{entryI:r,ex:xt(r),ez:e.gz,endX:e.sx}}let r=t>e.gx,i=r?n.i+1:n.i,a=e.type===`cafe`||e.type===`gallery`;return{entryI:i,ex:xt(i),ez:a?n.hall.zc:Ut(e.gz,n.z0+3,n.z1-3),endX:a?e.gx:e.gx+(r?3.6:-3.6)}}function vc(e,t,n,r,i){let a=r.blk,{entryI:o,ex:s,ez:c,endX:l}=_c(r,e),u=[],d=Ke(e),f=kt(t),p=xt(d),m=xt(d+1),h=Ft(f),g=Ft(f+1),_=e>p+wt(d)&&e<m-wt(d+1),v=t>h+Ht(f)&&t<g-Ht(f+1),y,b=e,x=t;if(!_&&v)y=`x`,b=e<=p+wt(d)?p:m;else if(_&&!v)y=`z`,x=t<=h+Ht(f)?h:g;else if(!_&&!v)b=e<=p+wt(d)?p:m,x=t<=h+Ht(f)?h:g,y=Math.abs(Math.sin(n))>Math.abs(Math.cos(n))?`x`:`z`;else{let n=e-p,r=m-e,i=t-h,a=g-t,o=Math.min(n,r,i,a);o===n||o===r?(y=`x`,b=o===n?p:m):(y=`z`,x=o===i?h:g)}u.push([b,x]);let S=Math.cos(n),C=Math.sin(n),w,T,E;if(y===`x`){w=hc(b);let e=kt(x),t=Ft(e),n=Ft(e+1),r=Math.abs(C)>.3?C>0:Math.abs(n-c)<Math.abs(t-c);T=r?e+1:e,E=r?1:-1}else{T=gc(x);let e=Ke(b),t=xt(e),n=xt(e+1),r=Math.abs(S)>.3?S>0:Math.abs(n-s)<Math.abs(t-s);w=r?e+1:e,E=r?1:-1}u.push([xt(w),Ft(T)]);let D=o,O=Ft(T)<=c?a.j:a.j+1,k=y===`x`?`z`:`x`;y===`x`&&w===D&&Math.sign(O-T)===-E&&(w+=i()<.5?1:-1,u.push([xt(w),Ft(T)]),k=`x`),y===`z`&&T===O&&Math.sign(D-w)===-E&&(T+=i()<.5?1:-1,u.push([xt(w),Ft(T)]),k=`z`);let A=0;for(;(w!==D||T!==O)&&A++<120;)w===D?k=`x`:T===O&&(k=`z`),k===`z`?(w+=Math.sign(D-w)*Math.min(Math.abs(D-w),1+Math.floor(i()*2)),k=`x`):(T+=Math.sign(O-T)*Math.min(Math.abs(O-T),1+Math.floor(i()*2)),k=`z`),u.push([xt(w),Ft(T)]);u.push([s,c]),u.push([l,c]);let j=[u[0]];for(let e=1;e<u.length;e++){let t=u[e],n=j[j.length-1];Math.hypot(t[0]-n[0],t[1]-n[1])>1&&j.push(t)}return bc(j)}function yc(e,t){let n=e.blk,r=mt(-1,-1).hall,i=xt(0),a=xt(-1),o=Ft(n.j);if(r)return[[i,t],[i,o],[a,o],[a,r.zc],[i,r.zc],[n.church.tower.x0-6,e.gz],[e.sx,e.gz]];let{ex:s,ez:c,endX:l}=_c(e,i);return[[i,t],[i,o],[s,o],[s,c],[l,c]]}function bc(e){for(let t=1;t<e.length-2;t++){let n=e[t-1],r=e[t],i=e[t+1],a=e[t+2];if(Math.abs(r[1]-i[1])>.5||Math.abs(n[0]-r[0])>.5||Math.abs(a[0]-i[0])>.5)continue;let o=hc(r[0]),s=hc(i[0]);if(Math.abs(o-s)!==1)continue;let c=gc(r[1]);for(let e of[c-1,c]){let t=mt(Math.min(o,s),e).hall;if(!t)continue;let c=(n[1]-t.zc)*(t.zc-r[1])>=0&&Math.abs(n[1]-r[1])>1,l=(t.zc-a[1])*(r[1]-a[1])>=0;if(c&&l){r[1]=t.zc,i[1]=t.zc;break}}}return e}function xc(e){let t=[],n=ic*1.6;for(let r=0;r<e.length-1;r++){let[i,a]=e[r],[o,s]=e[r+1],c=Math.hypot(o-i,s-a),l=n;for(;l<c;l+=ic)t.push([i+(o-i)*l/c,a+(s-a)*l/c]);n=l-c}let r=e[e.length-1];t.push([r[0],r[1]]);let i=t;for(let e=0;e<2;e++){let e=i.map(e=>[e[0],e[1]]);for(let t=1;t<i.length-1;t++)e[t][0]=(i[t-1][0]+2*i[t][0]+i[t+1][0])/4,e[t][1]=(i[t-1][1]+2*i[t][1]+i[t+1][1])/4;i=e}let a=[],o=i.length,s=e=>{if(e<1||e>o-2)return 0;let t=i[e][0]-i[e-1][0],n=i[e][1]-i[e-1][1],r=i[e+1][0]-i[e][0],a=i[e+1][1]-i[e][1];return(t*r+n*a)/(Math.hypot(t,n)*Math.hypot(r,a)||1)},c=new Float32Array(o);for(let e=5;e<o-6;e+=6+e*7%3)s(e-1)>.995&&s(e)>.995&&s(e+1)>.995&&s(e+2)>.995&&(c[e]=1.6,c[e+1]=2.5,e+2<o-4&&(c[e+2]=1.6));for(let e=0;e<o;e++){let t=i[Math.max(0,e-1)],n=i[Math.min(o-1,e+1)],r=n[0]-t[0],s=n[1]-t[1],l=Math.hypot(r,s)||1,u=Math.sin(e*.9)*.8*Math.min(1,(o-1-e)/3)*(c[e]?.2:1),d=i[e][0]-s/l*u,f=i[e][1]+r/l*u,p=Pt(d,f)+1.15+c[e],m=c[e]>0,h=mt(Ke(d),kt(f)),g=h.church&&h.church.hall;g&&f>g.z0&&f<g.z1&&d>g.x0&&d<g.x1&&(p=Pt(d,f)+1.15,m=!1);let _=h.hall;if(_&&f>_.z0&&f<_.z1&&d>_.x0&&d<_.x1){p=Pt(d,f)+1.15,m=!1;for(let e of _.obstacles)d>e.x0-3.2&&d<e.x1+3.2&&f>e.z0-1.2&&f<e.z1+1.2&&(d=(e.x0+e.x1)/2,f=(e.z0+e.z1)/2,p=e.top+1.25,m=!0)}a.push({gx:d,gz:f,y:p,air:m,idx:e,taken:!1,phase:e*.7})}return a}function Sc(e){let t=new Map,n=new Set,r=new Set,i=(e,n)=>{let r=e*65536+n,i=t.get(r);return i||(t.size>600&&t.clear(),i=fc(e,n),t.set(r,i)),i},a=new I,o=new Float32Array(1920),s=new Float32Array(1280),c=new Float32Array(2560),l=new Float32Array(1920),u=new Uint16Array(960);for(let e=0;e<ec;e++){for(let t=0;t<4;t++){let n=e*4+t;s[n*2]=t===0||t===3?-1:1,s[n*2+1]=t<2?-1:1}u.set([e*4,e*4+1,e*4+2,e*4,e*4+2,e*4+3],e*6)}let d=new ve(o,3),f=new ve(c,4),p=new ve(l,3);d.setUsage(Ue),f.setUsage(Ue),p.setUsage(Ue),a.setAttribute(`position`,d),a.setAttribute(`aCorner`,new ve(s,2)),a.setAttribute(`aGlow`,f),a.setAttribute(`color`,p),a.setIndex(new ve(u,1));let m=new P(a,e);m.frustumCulled=!1,m.renderOrder=62;let h=0,g=(e,t,n,r,i,a,s,u)=>{if(h>=ec)return;let d=h++;for(let f=0;f<4;f++){let p=d*4+f;o[p*3]=e,o[p*3+1]=t,o[p*3+2]=n,c[p*4]=r,c[p*4+1]=u,c[p*4+2]=s,c[p*4+3]=a,l[p*3]=i[0],l[p*3+1]=i[1],l[p*3+2]=i[2]}},_=[],v=(e,t,n,r,i=3,a=!1)=>{for(let o=0;o<r;o++){let r=Math.random()*6.28,o=Math.random()*2-.3,s=a?.6+Math.random()*1.6:2.5+Math.random()*4,c=a?.16+Math.random()*.16:.34+Math.random()*.26;_.push({x:e,y:t,z:n,vx:Math.cos(r)*s,vy:i+o*(a?1.2:4),vz:Math.sin(r)*s,life:c,life0:c,size:a?.1:.2})}},y={mesh:m,loose:[],burst:v,leg:0,target:null,visited:r,chosen:!1,trail:[],progress:0,lostFor:0,arrivedFor:-1,pendingNext:null,lastDir:[0,-1],info:{dist:0,bearing:0},prisms:[],prismTaken:new Set,prismCount(e){let t=0;for(let n of dc(e))y.prismTaken.has(n.key)&&t++;return t},emit(e,t,n,r=1,i=1){v(e,t,n,r,i,!0)},course:null,cleared:new Set,reset(){n.clear(),r.clear(),_.length=0,y.course=null,y.cleared.clear(),y.prismTaken.clear(),y.leg=0,y.target=null,y.trail=[],y.progress=0,y.arrivedFor=-1,y.lostFor=0,y.chosen=!1},setTarget(e,t,n=!1){let i=y.target;y.target={...e,blk:mt(e.i,e.j),tx:e.gx,tz:e.gz,tipY:e.top,seen:r.has(e.key)};let a=i?i.tx:t.gx,o=i?i.tz:t.gz,s=Math.hypot(e.gx-a,e.gz-o)||1;y.lastDir=[(e.gx-a)/s,(e.gz-o)/s],y.arrivedFor=-1,y.reroute(t,n)},reroute(e,t=!1){let n=Nt(Tt(Math.round(e.gx),Math.round(e.gz),31+y.leg)),r=t?yc(y.target,e.gz):vc(e.gx,e.gz,e.heading,y.target,n);y.trail=xc(r),y.progress=0,y.lostFor=0},start(e){y.leg++,y.arrivedFor=-1,y.chosen=!1;let t=Qs(Cc[0],Cc[1])[0];if(y.leg===1)y.setTarget(t,e,!0),y.lastDir=[0,-1];else{let n=y.target?y.target.type:null;y.setTarget(pc(e.gx,e.gz,y.lastDir[0],y.lastDir[1],r,n)||t,e)}},choose(e,t){return y.target&&y.target.key===e.key&&y.arrivedFor<0?!1:(y.leg===0&&(y.leg=1),y.chosen=!0,y.setTarget(e,t),!0)},update(e,t,o,s){h=0;let c={orbs:0,strays:0,arrived:!1,found:null,side:0,prisms:0,prismAll:null},l=2+3.4*(o.hyperK||0),u=l*l,b=Math.cos(o.heading),x=Math.sin(o.heading);m.position.set(o.wx,0,o.wz);let S=o.gx,C=o.gz,w=o.y+1,T=C,E=Ke(S),D=kt(C);for(let e=E-2;e<=E+2;e++)for(let r=D-2;r<=D+2;r++)for(let a of i(e,r)){if(n.has(a.key))continue;let e=a.gx-S,r=a.gz-C,i=e*e+r*r;if(i>22500)continue;let l=a.y+.16*Math.sin(t*1.7+a.phase);s&&i<3.24&&Math.abs(l-w)<2.3?(n.add(a.key),c.strays++,v(Bt(a.gx,a.gz),l,G(a.gx,a.gz),16)):g(Bt(a.gx,a.gz)-o.wx,l,G(a.gx,a.gz)-o.wz,1.5,nc,2.4,2,a.phase)}let O=y.target;if(O&&y.arrivedFor<0){let n=y.trail,i=1e9;for(let e=y.progress;e<Math.min(n.length,y.progress+8);e++){let t=n[e],r=Math.hypot(t.gx-S,t.gz-C);r<i&&(i=r),r<10&&e>y.progress&&(y.progress=e)}let a=Math.max(0,y.progress-2),d=Math.min(n.length,y.progress+ac);for(let e=a;e<d;e++){let r=n[e];if(r.taken)continue;let i=r.gx-S,a=r.gz-C,d=i*i+a*a,f=r.y+.14*Math.sin(t*2.1+r.phase);if(s&&d<u&&Math.abs(f-w)<(r.air?1.55:2.4)+(l-2)){r.taken=!0,c.orbs++,c.side=b*a-x*i>0?1:-1,e>y.progress&&(y.progress=e),v(Bt(r.gx,r.gz),f,G(r.gx,r.gz),7,2);continue}let p=e-y.progress,m=p<0?.3:1-.55*yt(4,ac,p),h=p>=0&&p<=1?1.12+.12*Math.sin(t*6):1;g(Bt(r.gx,r.gz)-o.wx,f,G(r.gx,r.gz)-o.wz,(r.air?.95:.8)*h,r.air?oc:tc,2*m*h,5,r.phase)}s&&(y.lostFor=i>70?y.lostFor+e:0,y.lostFor>2.5&&y.reroute(o));let f=Math.hypot(O.tx-S,O.tz-C);if(y.info.dist=f,y.info.bearing=Math.atan2(O.wz-o.wz,O.wx-o.wx),s&&mc(O,o,S,C)){c.arrived=!0,y.arrivedFor=0,r.add(O.key);for(let e of n)!e.taken&&Math.hypot(e.gx-O.tx,e.gz-O.tz)<60&&(e.taken=!0,v(Bt(e.gx,e.gz),e.y,G(e.gx,e.gz),5,6));for(let e=2;e<O.tipY-O.y;e+=2.2)v(O.wx,O.y+e,O.wz,5,9)}}else y.arrivedFor>=0&&(y.arrivedFor+=e);y.prisms.length=0;for(let e=E-2;e<=E+2;e++)for(let n=D-2;n<=D+2;n++){let r=Qs(e,n);for(let e=0;e<r.length;e++){let n=r[e],i=dc(n);for(let e=0;e<i.length;e++){let r=i[e];if(y.prismTaken.has(r.key))continue;let a=r.gx-S,l=r.gz-T,u=a*a+l*l,d=r.y+.18*Math.sin(t*1.5+r.phase),f=Bt(r.gx,r.gz),p=G(r.gx,r.gz);s&&u<2.3*2.3&&Math.abs(d-w)<2.2?(y.prismTaken.add(r.key),c.prisms++,c.prismAt=n,v(f,d,p,26,4),y.prismCount(n)===i.length&&(c.prismAll=n)):u>28900||(y.prisms.push({wx:f,y:d,wz:p,phase:r.phase}),g(f-o.wx,d,p-o.wz,2.2,lc,1.25,2,r.phase))}}}if(s)for(let e=E-1;e<=E+1;e++)for(let t=D-1;t<=D+1;t++){let n=Qs(e,t);for(let e=0;e<n.length;e++){let t=n[e];!r.has(t.key)&&mc(t,o,S,C)&&(r.add(t.key),c.found=t,v(t.wx,o.y+2.2,t.wz,14,5))}}let k=s?o.hall:null;if(k&&(!y.course||y.course.hall!==k)){let e=[];if(!y.cleared.has(k.key)){let t=(k.x1-k.x0)/7.6;for(let n=0;n<7;n++){let r=k.x0+t*(n+.8),i=k.obstacles.find(e=>Math.abs(r-(e.x0+e.x1)/2)<t*.55);if(i)e.push({gx:(i.x0+i.x1)/2,gz:(i.z0+i.z1)/2,y:i.top+1.25,air:!0,taken:!1,phase:n});else{let t=k.zc+(k.narrow&&r<k.narrow?0:n%2?2.4:-2.4);e.push({gx:r,gz:t,y:Pt(r,t)+1.15,air:!1,taken:!1,phase:n})}}}y.course={hall:k,orbs:e,got:0},c.course={entered:k.theme,fresh:e.length>0}}else if(!k&&y.course){let e=y.course;e.orbs.length&&(c.course={left:e.hall.theme,got:e.got,total:e.orbs.length}),y.course=null}if(y.course){let e=y.course,n=e.hall.theme===`cafe`?sc:cc;for(let r of e.orbs){if(r.taken)continue;let i=r.gx-S,a=r.gz-C,s=r.y+.12*Math.sin(t*2.4+r.phase);i*i+a*a<4&&Math.abs(s-w)<(r.air?1.6:2.4)?(r.taken=!0,e.got++,c.courseOrbs=(c.courseOrbs||0)+1,v(Bt(r.gx,r.gz),s,G(r.gx,r.gz),9,2),e.got===e.orbs.length&&(y.cleared.add(e.hall.key),c.course={cleared:e.hall.theme})):g(Bt(r.gx,r.gz)-o.wx,s,G(r.gx,r.gz)-o.wz,.9,n,2.3,5,r.phase)}}if(O){let e=O.wx-o.wx,n=O.wz-o.wz,r=Math.hypot(e,n)||1,i=Math.min(1,380/r),a=yt(380,760,r),s=(O.tipY+3.5)*(1-a)+(o.y+150)*a,c=1+.12*Math.sin(t*2.3)+(y.arrivedFor>=0?1.5*Math.exp(-y.arrivedFor*1.2):0);g(e*i,s,n*i,(7+6*a)*c,rc,3.2*c,4,.3)}for(let e of y.loose)g(e.x-o.wx,e.y,e.z-o.wz,.65,tc,2,5,e.phase);for(let t=_.length-1;t>=0;t--){let n=_[t];if(n.life-=e,n.life<=0){_.splice(t,1);continue}n.vy+=7*e,n.x+=n.vx*e,n.y+=n.vy*e,n.z+=n.vz*e,n.vx*=1-2.5*e,n.vz*=1-2.5*e;let r=n.life/n.life0;g(n.x-o.wx,n.y,n.z-o.wz,n.size*(.3+.7*r),tc,2.2*Math.min(1,r*1.5),3,0)}return _.length>220&&_.splice(0,_.length-220),a.setDrawRange(0,h*6),d.needsUpdate=!0,f.needsUpdate=!0,p.needsUpdate=!0,c}};return y}var Cc=[0,-1],wc=e=>440*2**((e-69)/12),Tc=[[38,57,61,64,66],[35,54,57,62,64],[31,54,59,62,66],[33,52,57,61,66]],Ec=[62,64,66,69,71,74,76,78,81,83,86];function Dc(){let e=null,t,n,r,i,a,o,s=!1;try{s=localStorage.getItem(`nightrider-muted`)===`1`}catch{}let c=0,l=0,u=0,d=0,f=null;function p(t){let n=Math.floor(e.sampleRate*t),r=e.createBuffer(2,n,e.sampleRate);for(let e=0;e<2;e++){let t=r.getChannelData(e);for(let e=0;e<n;e++){let r=e/n;t[e]=(Math.random()*2-1)*(1-r)**2.6*(1-Math.exp(-e/400))}}return r}function m(){if(e){e.state===`suspended`&&e.resume();return}let c=window.AudioContext||window.webkitAudioContext;if(!c)return;e=new c,t=e.createGain(),t.gain.value=s?0:.9;let d=e.createDynamicsCompressor();d.threshold.value=-16,d.ratio.value=3,t.connect(d).connect(e.destination);let m=e.createConvolver();m.buffer=p(3.6),n=e.createGain(),n.gain.value=.55,r=e.createGain(),r.gain.value=.75,n.connect(m).connect(t),r.connect(t),i=e.createBiquadFilter(),i.type=`lowpass`,i.frequency.value=1300,i.Q.value=.3,i.connect(n),i.connect(r),f=e.createBuffer(1,e.sampleRate*2,e.sampleRate);let h=f.getChannelData(0),g=0;for(let e=0;e<h.length;e++)g=g*.96+(Math.random()*2-1)*.2,h[e]=g;let _=e.createBufferSource();_.buffer=f,_.loop=!0,o=e.createBiquadFilter(),o.type=`bandpass`,o.frequency.value=500,o.Q.value=.7,a=e.createGain(),a.gain.value=0,_.connect(o).connect(a).connect(r),a.connect(n),_.start(),l=e.currentTime+.1,u=e.currentTime+2.5}function h(t,n,r,a,o=`sine`,s=i,c=2.2){let l=e.createOscillator(),u=e.createGain();l.type=o,l.frequency.value=t,l.detune.value=(Math.random()-.5)*9,u.gain.setValueAtTime(1e-4,n),u.gain.exponentialRampToValueAtTime(a,n+c),u.gain.setValueAtTime(a,n+Math.max(c,r-3.2)),u.gain.exponentialRampToValueAtTime(1e-4,n+r),l.connect(u).connect(s),l.start(n),l.stop(n+r+.1)}function g(t,i=.05,a=0){if(!e)return;let o=e.currentTime+a,s=e.createStereoPanner?e.createStereoPanner():null,c=e.createGain();c.gain.value=1,s?(s.pan.value=Math.random()*1.6-.8,c.connect(s),s.connect(n),s.connect(r)):(c.connect(n),c.connect(r));for(let[n,r,a]of[[1,1,2.6],[2.76,.28,1.2],[5.4,.1,.5]]){let s=e.createOscillator(),l=e.createGain();s.frequency.value=wc(t)*n,l.gain.setValueAtTime(1e-4,o),l.gain.exponentialRampToValueAtTime(i*r,o+.008),l.gain.exponentialRampToValueAtTime(1e-4,o+a),s.connect(l).connect(c),s.start(o),s.stop(o+a+.05)}}function _(t){if(!e)return;let n=e.currentTime,i=e.createOscillator(),a=e.createGain();i.frequency.setValueAtTime(110,n),i.frequency.exponentialRampToValueAtTime(42,n+.16),a.gain.setValueAtTime(Math.min(.5,.12+t*.03),n),a.gain.exponentialRampToValueAtTime(1e-4,n+.22),i.connect(a).connect(r),i.start(n),i.stop(n+.25)}function v(t){let n=e.currentTime,i=e.createBufferSource(),a=e.createBiquadFilter(),o=e.createGain();i.buffer=f,i.playbackRate.value=6,a.type=`highpass`,a.frequency.value=2600,o.gain.setValueAtTime(t,n),o.gain.exponentialRampToValueAtTime(1e-4,n+.02),i.connect(a).connect(o).connect(r),i.start(n,Math.random(),.03)}return{start:m,get muted(){return s},toggle(){s=!s;try{localStorage.setItem(`nightrider-muted`,s?`1`:`0`)}catch{}return e&&t.gain.setTargetAtTime(s?0:.9,e.currentTime,.08),s},update(t,n){if(!e||e.state!==`running`)return;let r=e.currentTime;r>=l&&(Tc[c%Tc.length].forEach((e,t)=>{h(wc(e),r,12.5,t===0?.055:.028,t===0?`sine`:`triangle`),t>0&&h(wc(e+12),r+.4,11.5,.007,`sine`)}),c++,l=r+9),r>=u&&(g(Ec[Math.floor(Math.random()*Ec.length)],.028+Math.random()*.02),Math.random()<.35&&g(Ec[Math.floor(Math.random()*Ec.length)],.02,.22+Math.random()*.3),u=r+1.4+Math.random()*3.4);let i=t.speed,s=Math.min(.045,i*i*16e-5)*n+(t.grounded?0:.01);a.gain.setTargetAtTime(s,r,.25),o.frequency.setTargetAtTime(380+i*42,r,.3),t.grounded&&!t.walking&&i>1.2&&r>=d&&(v(.016),d=r+1/(i*1.9))},orb(e){g(Ec[Math.min(Ec.length-1,(e-1)%10)]+(e>10?12:0),.085)},star(){g(78,.11),g(85,.08,.09),g(90,.06,.2)},arrive(){e&&([50,57,62].forEach((t,i)=>{let a=e.currentTime+i*.42;for(let[i,o,s]of[[1,.22,5.5],[2,.12,4],[2.76,.07,2.6],[5.4,.03,1.4]]){let c=e.createOscillator(),l=e.createGain();c.frequency.value=wc(t)*i,l.gain.setValueAtTime(1e-4,a),l.gain.exponentialRampToValueAtTime(o,a+.012),l.gain.exponentialRampToValueAtTime(1e-4,a+s),c.connect(l),l.connect(n),l.connect(r),c.start(a),c.stop(a+s+.1)}}),[74,78,81,86,90,93].forEach((e,t)=>g(e,.07,1.2+t*.11)))},wings(){[62,66,69,74,78,81,86,90,93,98].forEach((e,t)=>g(e,.075,t*.07))},fold(){[86,81,78,74,69,66].forEach((e,t)=>g(e,.045,t*.055))},flapSound(){if(!e)return;let t=e.currentTime,n=e.createBufferSource(),i=e.createBiquadFilter(),a=e.createGain();n.buffer=f,n.playbackRate.value=.9,i.type=`bandpass`,i.frequency.setValueAtTime(260,t),i.frequency.exponentialRampToValueAtTime(700,t+.22),i.Q.value=.6,a.gain.setValueAtTime(1e-4,t),a.gain.exponentialRampToValueAtTime(.16,t+.07),a.gain.exponentialRampToValueAtTime(1e-4,t+.3),n.connect(i).connect(a).connect(r),n.start(t,Math.random(),.34)},trick(e){let t=Math.min(7,2+Math.floor(e/220));for(let e=0;e<t;e++)g(Ec[Math.min(Ec.length-1,3+e)],.07,e*.055)},bail(){_(9),g(50,.05),g(51,.05,.05)},prism(){[78,83,86,90,95].forEach((e,t)=>g(e,.075,t*.035))},deliver(){[62,66,69,74,78,81,86].forEach((e,t)=>g(e,.08,.5+t*.09))},hyper(){if(!e)return;let t=e.currentTime,a=e.createBufferSource(),o=e.createBiquadFilter(),s=e.createGain();a.buffer=f,a.loop=!0,a.playbackRate.value=1.6,o.type=`bandpass`,o.Q.value=1.1,o.frequency.setValueAtTime(180,t),o.frequency.exponentialRampToValueAtTime(3200,t+.9),s.gain.setValueAtTime(1e-4,t),s.gain.exponentialRampToValueAtTime(.5,t+.5),s.gain.exponentialRampToValueAtTime(1e-4,t+1.6),a.connect(o).connect(s),s.connect(r),s.connect(n),a.start(t),a.stop(t+1.7),[50,57,62,66,69,74].forEach((e,n)=>h(wc(e+12),t+n*.05,3.4,.05,`sawtooth`,i,.25)),[86,90,93,98].forEach((e,t)=>g(e,.07,.45+t*.07))},land(e){e>3&&_(e)},bump(e){e>3.5&&_(e*.5)},jump(){e&&g(57,.03)}}}var Oc={street:`#d6b876`,town:`#0e1945`,house:`#2c4494`,roofLine:`rgba(160, 190, 255, 0.20)`,plaza:`#b29a62`,grove:`#11393a`,field:`#57572a`,meadow:`#184a3f`,knoll:`#17454a`,olive:`#2f7c62`,cypress:`#0a2226`,water:`#8fd0ff`,hall:`#ffcf7a`},kc=205,Ac=340,jc=4,Mc=(e,t,n)=>e+(t-e)*n,Nc=new Map;function Pc(e,t,n,r,i){e.moveTo(Bt(t,n),G(t,n)),e.lineTo(Bt(r,n),G(r,n)),e.lineTo(Bt(r,i),G(r,i)),e.lineTo(Bt(t,i),G(t,i)),e.closePath()}function Fc(e,t){let n=e*65536+t,r=Nc.get(n);if(r)return r;Nc.size>500&&Nc.clear();let i=mt(e,t),a=new Path2D,o=[];for(let e=0;e<6;e++)o.push([Mc(i.x0,i.x1,e/6),i.z0]);for(let e=0;e<6;e++)o.push([i.x1,Mc(i.z0,i.z1,e/6)]);for(let e=0;e<6;e++)o.push([Mc(i.x1,i.x0,e/6),i.z1]);for(let e=0;e<6;e++)o.push([i.x0,Mc(i.z1,i.z0,e/6)]);if(o.forEach(([e,t],n)=>n?a.lineTo(Bt(e,t),G(e,t)):a.moveTo(Bt(e,t),G(e,t))),a.closePath(),r={kind:i.kind,ground:a,houses:null,ridges:null,hall:null,olives:null,cypresses:null,water:null},i.houses.length){r.houses=new Path2D,r.ridges=new Path2D;for(let e of i.houses){Pc(r.houses,e.x0,e.z0,e.x1,e.z1);let t=(e.x0+e.x1)/2,n=(e.z0+e.z1)/2,[i,a,o,s]=e.ridge===`x`?[e.x0+.8,n,e.x1-.8,n]:[t,e.z0+.8,t,e.z1-.8];r.ridges.moveTo(Bt(i,a),G(i,a)),r.ridges.lineTo(Bt(o,s),G(o,s))}}if(i.church){r.houses||(r.houses=new Path2D);let e=i.church.tower,t=i.church.nave;Pc(r.houses,e.x0,e.z0,e.x1,e.z1),r.hall=new Path2D,Pc(r.hall,e.x0-.5,i.church.tz-1.3,t.x1+.5,i.church.tz+1.3)}if(i.hall){let e=i.hall;r.hall=new Path2D,Pc(r.hall,e.x0-.5,e.zc-2.6,e.x1+.5,e.zc+2.6)}for(let e of i.trees){let t=e.kind===`olive`?`olives`:`cypresses`;r[t]||(r[t]=new Path2D);let n=Bt(e.x,e.z),i=G(e.x,e.z),a=e.kind===`olive`?Math.max(2.2,e.r*.95):2;r[t].moveTo(n+a,i),r[t].arc(n,i,a,0,6.2832)}let s=i.solids.find(e=>e.fountain);if(s){r.water=new Path2D;let e=Bt((s.x0+s.x1)/2,(s.z0+s.z1)/2),t=G((s.x0+s.x1)/2,(s.z0+s.z1)/2);r.water.arc(e,t,2.6,0,6.2832)}return Nc.set(n,r),r}var Ic={};for(let e of Object.keys(Ws))Ic[e]=new Path2D(Ws[e].icon);var Lc=e=>`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${Ws[e].icon}"/></svg>`;function Rc(e,{onPick:t,onNext:n}){e.innerHTML=`
    <div id="map-list"><div class="map-head"><span>Highlights</span><span class="map-key"><kbd>Tab</kbd> next</span></div></div>
    <div id="map-disc"><canvas id="map-canvas"></canvas><div id="map-gloss"></div></div>`;let r=e.querySelector(`#map-list`),i=e.querySelector(`#map-disc`),a=e.querySelector(`#map-canvas`),o=a.getContext(`2d`),s=[];for(let e=0;e<jc;e++){let n=document.createElement(`button`);n.type=`button`,n.className=`map-row`,n.innerHTML=`<span class="map-ico"></span><span class="map-text"><span class="map-name"></span><span class="map-kind"></span></span><span class="map-dist"></span><span class="map-arrow">↑</span>`,n.addEventListener(`click`,r=>{r.stopPropagation(),s[e].hl&&t(s[e].hl),n.blur()}),r.appendChild(n),s.push({el:n,hl:null,key:``,dist:``,ico:n.querySelector(`.map-ico`),name:n.querySelector(`.map-name`),kind:n.querySelector(`.map-kind`),distEl:n.querySelector(`.map-dist`),arrow:n.querySelector(`.map-arrow`)})}let c=0,l=1;function u(){let e=i.clientWidth||208,t=Math.min(window.devicePixelRatio||1,2);(e!==c||t!==l)&&(c=e,l=t,a.width=Math.round(e*t),a.height=Math.round(e*t))}window.addEventListener(`resize`,u);let d=kc,f=[],p=[],m=0,h=[],g=[];a.addEventListener(`click`,e=>{let r=a.getBoundingClientRect(),i=e.clientX-r.left,o=e.clientY-r.top,s=null,c=18;for(let e of h){let t=Math.hypot(e.x-i,e.y-o);t<c&&(c=t,s=e.hl)}s?t(s):n&&document.documentElement.classList.contains(`touch`)&&n()});function _(e,t){g.length=0,$s(e.gx,e.gz,11,g);let n=t.target;for(let t of g)t._d=Math.hypot(t.wx-e.wx,t.wz-e.wz);g.sort((e,t)=>e._d-t._d),f=[],n&&f.push(n);for(let e of g){if(f.length>=jc)break;n&&e.key===n.key||t.visited.has(e.key)||f.push(e)}p=g.filter(e=>e._d<1100).slice(0,14),n&&!p.some(e=>e.key===n.key)&&(n._d=Math.hypot(n.wx-e.wx,n.wz-e.wz),p.push(n))}return{el:e,get listed(){return f},cycle(e){if(f.length<2)return null;let t=e.target,n=t?f.findIndex(e=>e.key===t.key):-1;return f[(n+1)%f.length]},show(t){e.classList.toggle(`on`,t)},update(e,t,n,r,i,a,g=null){u(),m-=e,m<=0&&(m=.25,_(n,r)),d=K(d,n.flying?Ac:kc,2.2,e);let v=r.target,y=c,b=y/2,x=b/d,S=Math.hypot(i,a)||1,C=i/S,w=a/S,T=-w*x,E=C*x,D=-C*x,O=-w*x,k=b-(T*n.wx+E*n.wz),A=b-(D*n.wx+O*n.wz),j=(e,t)=>T*e+E*t+k,M=(e,t)=>D*e+O*t+A;o.setTransform(l,0,0,l,0,0),o.clearRect(0,0,y,y),o.save(),o.beginPath(),o.arc(b,b,b,0,6.2832),o.clip(),o.fillStyle=Oc.street,o.fillRect(0,0,y,y),o.setTransform(l*T,l*D,l*E,l*O,l*k,l*A);let N=Math.ceil((d+40)/60),P=Ke(n.gx),ee=kt(n.gz);for(let e=P-N;e<=P+N;e++)for(let t=ee-N;t<=ee+N;t++){let n=Fc(e,t);o.fillStyle=Oc[n.kind],o.fill(n.ground),n.olives&&(o.fillStyle=Oc.olive,o.fill(n.olives)),n.cypresses&&(o.fillStyle=Oc.cypress,o.fill(n.cypresses)),n.houses&&(o.fillStyle=Oc.house,o.fill(n.houses),n.ridges&&(o.strokeStyle=Oc.roofLine,o.lineWidth=.9/x,o.stroke(n.ridges))),n.hall&&(o.fillStyle=Oc.hall,o.fill(n.hall)),n.water&&(o.fillStyle=Oc.water,o.fill(n.water))}if(v&&r.arrivedFor<0&&r.trail.length){o.beginPath(),o.moveTo(n.wx,n.wz);let e=r.trail;for(let t=Math.max(0,r.progress);t<e.length;t++)o.lineTo(Bt(e[t].gx,e[t].gz),G(e[t].gx,e[t].gz));o.lineJoin=`round`,o.lineCap=`round`,o.strokeStyle=`rgba(8, 10, 40, 0.75)`,o.lineWidth=4.6/x,o.setLineDash([]),o.stroke(),o.strokeStyle=`#fff1a6`,o.lineWidth=2.2/x,o.setLineDash([3.2/x,4.2/x]),o.lineDashOffset=-t*9/x,o.stroke(),o.setLineDash([])}o.setTransform(l,0,0,l,0,0);let te=o.createRadialGradient(b,b,b*.35,b,b,b);te.addColorStop(0,`rgba(6, 9, 40, 0)`),te.addColorStop(1,`rgba(6, 9, 40, 0.55)`),o.fillStyle=te,o.fillRect(0,0,y,y),h=[];let ne=(e,n,r,i,a,s=1)=>{let c=Ws[e.type].color,l=(i?10.5:8.5)*s;if(o.globalAlpha=a&&!i?.5:1,i){let e=t*.9%1;o.strokeStyle=c,o.globalAlpha=.9*(1-e),o.lineWidth=1.6,o.beginPath(),o.arc(n,r,l+2+e*11,0,6.2832),o.stroke(),o.globalAlpha=1}o.beginPath(),o.arc(n,r,l,0,6.2832),o.fillStyle=`rgba(7, 10, 38, 0.94)`,o.fill(),o.strokeStyle=c,o.lineWidth=i?2:1.3,o.stroke();let u=l*1.26/24;o.save(),o.translate(n-12*u,r-12*u),o.scale(u,u),o.lineWidth=1.9,o.lineJoin=`round`,o.lineCap=`round`,o.strokeStyle=c,o.stroke(Ic[e.type]),o.restore(),o.globalAlpha=1,h.push({x:n,y:r,hl:e})},F=null;for(let e of p){let t=!!v&&e.key===v.key,n=j(e.wx,e.wz),i=M(e.wx,e.wz);Math.hypot(n-b,i-b)>b-13||(t?F={h:e,x:n,y:i}:ne(e,n,i,!1,r.visited.has(e.key)))}if(F&&ne(F.h,F.x,F.y,!0,!1),g&&g.length){o.lineWidth=1.4,o.strokeStyle=`rgba(8, 10, 40, 0.95)`;for(let e of g){let t=j(e.wx,e.wz),n=M(e.wx,e.wz),r=t-b,i=n-b,a=Math.hypot(r,i),s=b-6,c=a>s;c&&(t=b+r/a*s,n=b+i/a*s),o.globalAlpha=c?.55:1,o.beginPath(),o.arc(t,n,c?3:4,0,6.2832),o.fillStyle=e.color,o.fill(),o.stroke()}o.globalAlpha=1}{let e=Math.atan2(n.fz,n.fx)-Math.atan2(w,C);o.save(),o.translate(b,b),o.rotate(e),o.beginPath(),o.moveTo(0,-8.5),o.lineTo(6,6.5),o.lineTo(0,3.4),o.lineTo(-6,6.5),o.closePath(),o.fillStyle=`#fffbe6`,o.strokeStyle=`rgba(8, 10, 40, 0.95)`,o.lineWidth=1.6,o.lineJoin=`round`,o.shadowColor=`rgba(255, 220, 120, 0.9)`,o.shadowBlur=9,o.fill(),o.shadowBlur=0,o.stroke(),o.restore()}if(F){o.font=`600 10.5px ui-rounded, "SF Pro Rounded", -apple-system, "Segoe UI", system-ui, sans-serif`;let e=o.measureText(F.h.name).width,t=F.y<b+b*.45,n=F.y+(t?19:-19),r=Math.sqrt(Math.max(0,b*b-(n-b)*(n-b)))-6,i=Math.max(b-r,Math.min(b+r-e,F.x-e/2));o.textBaseline=`middle`,o.lineWidth=3.2,o.strokeStyle=`rgba(6, 9, 36, 0.92)`,o.lineJoin=`round`,o.strokeText(F.h.name,i,n),o.fillStyle=`#fff1c4`,o.fillText(F.h.name,i,n)}o.restore();for(let e of p){let t=!!v&&e.key===v.key,n=j(e.wx,e.wz)-b,i=M(e.wx,e.wz)-b,a=Math.hypot(n,i);if(a<=b-13||r.visited.has(e.key)&&!t)continue;let s=n/a,c=i/a;if(t)ne(e,b+s*(b-13),b+c*(b-13),!0,!1);else{let t=b+s*(b-5),n=b+c*(b-5);o.globalAlpha=.95-.5*Math.min(1,e._d/1100),o.fillStyle=Ws[e.type].color,o.beginPath(),o.moveTo(t+s*4.5,n+c*4.5),o.lineTo(t-s*3-c*3.6,n-c*3+s*3.6),o.lineTo(t-s*3+c*3.6,n-c*3-s*3.6),o.closePath(),o.fill(),o.globalAlpha=1}}{let e=Math.hypot(E,O)||1,t=-E/e,n=-O/e;o.font=`700 9.5px ui-rounded, "SF Pro Rounded", -apple-system, "Segoe UI", system-ui, sans-serif`,o.textAlign=`center`,o.textBaseline=`middle`;let r=b+t*(b-9),i=b+n*(b-9);o.fillStyle=`rgba(6, 9, 36, 0.85)`,o.beginPath(),o.arc(r,i,6.5,0,6.2832),o.fill(),o.fillStyle=`#ffe9a8`,o.fillText(`N`,r,i+.5),o.textAlign=`start`}for(let e=0;e<jc;e++){let t=s[e],i=f[e];if(!i){t.hl&&(t.hl=null,t.key=``,t.el.classList.add(`off`));continue}let a=!!v&&i.key===v.key,o=r.prismCount(i),c=`${i.key}${a?`*`:``}${r.visited.has(i.key)?`v`:``}${o}`;if(t.key!==c){t.key=c,t.hl=i,t.el.classList.remove(`off`),t.el.classList.toggle(`dest`,a),t.el.style.setProperty(`--hl`,Ws[i.type].color),t.ico.innerHTML=Lc(i.type),t.name.textContent=i.name,t.kind.textContent=``;let e=document.createElement(`span`);e.className=`map-label`,e.textContent=a?`destination`:Ws[i.type].label,t.kind.appendChild(e);let n=document.createElement(`span`);n.className=`map-pips`;for(let e=0;e<3;e++){let t=document.createElement(`i`);e<o&&(t.className=`got`),n.appendChild(t)}t.kind.appendChild(n)}let l=Math.hypot(i.wx-n.wx,i.wz-n.wz),u=a&&r.arrivedFor>=0?`here`:l<995?`${Math.round(l/5)*5} m`:`${(l/1e3).toFixed(1)} km`;t.dist!==u&&(t.dist=u,t.distEl.textContent=u);let d=Math.atan2(M(i.wx,i.wz)-b,j(i.wx,i.wz)-b)+Math.PI/2;t.arrow.style.transform=`rotate(${d.toFixed(2)}rad)`}}}}function zc(e,n=12){let r=new $e(64);r.reset(0,0,0,0);let i=.46;r.rgb(1,1,1).data(18,.5,1,0).noLamp();let a=[[i,0,0],[0,0,i],[-.46,0,0],[0,0,-.46]];for(let e=0;e<4;e++){let t=a[e],n=a[(e+1)%4];r.tri(r.pl(n[0],0,n[2]),r.pl(t[0],0,t[2]),r.pl(0,.66,0),0,0,1,0,.5,1),r.tri(r.pl(t[0],0,t[2]),r.pl(n[0],0,n[2]),r.pl(0,-.66,0),0,0,1,0,.5,1)}let o=r.build(),s=new t,c=[];for(let t=0;t<n;t++){let t=new P(o,e);t.frustumCulled=!1,t.visible=!1,t.rotation.order=`YXZ`,s.add(t),c.push(t)}return{group:s,update(e,t){for(let n=0;n<c.length;n++){let r=c[n],i=e[n];r.visible=!!i,i&&(r.position.set(i.wx,i.y,i.wz),r.rotation.set(.1,t*1.1+i.phase,.07),r.scale.setScalar(1+.06*Math.sin(t*2.2+i.phase)))}}}}var Bc=15e3;function Vc(e){let t=`/api/presence`,n=Math.random().toString(36).slice(2,12).padEnd(10,`0`)+Date.now().toString(36).slice(-4),r=0,i=[];async function a(){if(!document.hidden||globalThis.__inHeadset)try{let a=await fetch(t,{method:`POST`,headers:{"content-type":`application/json`},body:JSON.stringify({id:n,haul:r}),cache:`no-store`});if(!a.ok)return;let o=await a.json();if(typeof o.count!=`number`)return;i.push(Math.max(1,o.count)),i.length>2&&i.shift(),e({count:Math.max(...i),best:Math.max(o.best||0,r)})}catch{}}return a(),setInterval(a,Bc),document.addEventListener(`visibilitychange`,()=>{document.hidden||a()}),window.addEventListener(`pagehide`,()=>{try{navigator.sendBeacon(t,JSON.stringify({id:n,bye:!0}))}catch{}}),{report(e){e>r&&(r=Math.floor(e),a())}}}var Hc=1/5,Uc=20,Wc=2e3,Gc=.35,Kc=.3,qc=8,Jc=3,Yc=1.7,Xc=1.6,Zc=.55,Qc=new Le,$c={h:0,s:0,l:0},el=(e,t,n)=>(Qc.setHSL(e/360,t,n,Me),[Qc.r,Qc.g,Qc.b]);function tl(e,t,n=1){return Qc.setRGB(e[0],e[1],e[2]).getHSL($c,Me),el(t,Math.min(1,$c.s*n),$c.l)}function nl(e,t){let n=Math.imul(e^2654435769,2246822507)^Math.imul(t+1,3266489909);return n^=n>>>15,n=Math.imul(n,739982445),n^=n>>>12,n=Math.imul(n,695872825),n^=n>>>15,(n>>>0)/4294967296}var rl=[[34,1],[28,.6],[215,.35],[20,.25],[45,.8]];function il(e,t){let n=nl(e,1)*360,r=(n+120+nl(e,2)*120)%360,i=nl(e,3)<.75?38+nl(e,4)*18:20+nl(e,4)*15,[a,o]=rl[Math.floor(nl(e,5)*rl.length)],s=i<36?.55:1;return{frame:el(t,.72,.5),smock:tl(Oo.smock,n),smockLight:tl(Oo.smockLight,n),smockDark:tl(Oo.smockDark,n),scarf:tl(Oo.scarf,r),hat:tl(Oo.hat,i,s),hatShade:tl(Oo.hatShade,i,s),trousers:tl(Oo.trousers,a,o)}}function al({scene:e,shared:t,paintMat:n,glowMat:r,url:i,models:a=8,groundAt:o,lampAt:s,onCount:c,status:l=()=>({}),onLost:u,onKnocked:d,onGot:f,onBump:p,onBumped:m,onSaid:h,onUnsaid:g}){let _={me:null,count:0,others:new Map,dots:[],loose:[],on:!1,update(){},close(){},say(){return!1},where(){return null}},v=new Map;if(!i)return _;let y=null,b=!1,x=1,S=0,C=0,w=!1,T=0;function E(){try{y=new WebSocket(i)}catch{y=null;return}y.onopen=()=>{b=!0,_.on=!0,x=1},y.onclose=()=>{b=!1,_.on=!1,y=null,S=performance.now()/1e3+x,x=Math.min(30,x*2)},y.onerror=()=>{},y.onmessage=e=>{let t;try{t=JSON.parse(e.data)}catch{return}if(t.t===`you`)_.me={id:t.id,hue:t.hue},ae&&O&&performance.now()-ae.t<15e3&&oe(ae.text),ae=null;else if(t.t===`s`)D(t);else if(t.t===`bump`)N(t.a,t.v);else if(t.t===`said`)typeof t.text==`string`&&h?.(t.id,t.hue,t.text,!!_.me&&t.id===_.me.id);else if(t.t===`unsaid`)g?.();else if(t.t===`lost`)u?.(t.n,t.hue);else if(t.t===`knocked`)d?.(t.n,t.hue);else if(t.t===`got`){let e=v.get(t.orb);v.delete(t.orb),f?.(t.v,e||null)}}}function D(e){let t=performance.now()/1e3;if(typeof e.n==`number`&&e.n!==_.count&&(_.count=e.n,(_.onCount||c)?.(e.n)),Array.isArray(e.o)){let t=new Set;for(let[n,r,i,a]of e.o)t.add(n),v.has(n)||v.set(n,{id:n,gx:r,gz:a,x:Bt(r,a),y:o(r,a)+.9,z:G(r,a),phase:n*.618%1,askedT:0});for(let e of v.keys())t.has(e)||v.delete(e);_.loose.length=0;for(let e of v.values())_.loose.push(e)}if(Array.isArray(e.r))for(let n of e.r){if(!Array.isArray(n)||n.length!==16)continue;let[e,r,i]=n;if(_.me&&e===_.me.id||!(i>=0&&i<Wc))continue;let a=_.others.get(e);a||(a={id:e,hue:r,snaps:[],heardT:0,wheel:0,crank:0,stride:0,flap:0,park:null,model:null,d:0},_.others.set(e,a)),a.hue=r,a.heardT=t;let o=t-i/1e3,s=a.snaps[a.snaps.length-1];s&&o<s.t+.05||(a.snaps.push({t:o,s:n.slice(3)}),a.snaps.length>qc&&a.snaps.shift())}}let O=null,k=(e,t,n,r,i)=>(r-e)*-Math.sin(n)+(i-t)*Math.cos(n)>=0?1:-1,A=e=>{let t=e.snaps[e.snaps.length-1].s;return e.gx===void 0?{gx:t[0],gz:t[1],h:t[3]}:{gx:e.gx,gz:e.gz,h:e.h}};function j(e,t,n){let r=A(e);e.shoveT=.5,e.shoveSide=k(r.gx,r.gz,r.h,t,n)}function M(e,t,n){let r=A(e),i=r.gx-t,a=r.gz-n,o=Math.hypot(i,a)||1;e.wobbleT=.9,e.knockT=Zc,e.knockX=i/o,e.knockZ=a/o}function N(e,t){let n=_.me?_.me.id:-1;if(e===n||!O)return;let r=_.others.get(e),i=_.others.get(t);if(t===n){if(!r){m?.(1);return}let e=A(r);j(r,O.gx,O.gz),m?.(k(O.gx,O.gz,O.heading,e.gx,e.gz))}else if(i){let e=A(r||i);r&&j(r,A(i).gx,A(i).gz),M(i,e.gx,e.gz)}}let P=[],ee=new ge;function te(){for(let e of P)if(!e.rider)return e;if(P.length>=a)return null;let i=ys(t,n,r);i.root.visible=!1,e.add(i.root);let o={bike:i,rider:null,who:-1};return P.push(o),o}let ne=Array(13);function F(e,t){let n=e.snaps;if(!n.length)return null;let r=n[0],i=n[0];for(let e=0;e<n.length;e++){if(n[e].t<=t&&(r=n[e]),n[e].t>=t){i=n[e];break}i=n[e]}let a=i.t-r.t,o=a>1e-4?Ut((t-r.t)/a,0,1):1;for(let e=0;e<13;e++){let t=r.s[e],n=i.s[e];e===3||e===8||e===9?ne[e]=t+Mt(t,n)*o:e===7||e===10||e===12?ne[e]=o<.5?t:n:ne[e]=t+(n-t)*o}let s=Math.min(Kc,t-i.t);return s>0&&ne[7]&1&&(ne[0]+=Math.cos(ne[3])*ne[4]*s,ne[1]+=Math.sin(ne[3])*ne[4]*s),ne}function re(e){let t=l(),n=+!!e.grounded|(e.walking?2:0)|(e.wings?4:0)|(e.flying?8:0)|(t.theater?16:0);y.send(JSON.stringify([+e.gx.toFixed(2),+e.gz.toFixed(2),+e.y.toFixed(2),+e.heading.toFixed(3),+e.speed.toFixed(2),+e.steer.toFixed(3),+e.lean.toFixed(3),n,+(e.spin||0).toFixed(3),+(e.flip||0).toFixed(3),e.pose||0,Math.floor(t.carried||0),t.world||0]))}_.update=(e,t,r)=>{let i=performance.now()/1e3;if(O=t,w=r,!y&&w&&i>=S&&(!document.hidden||globalThis.__inHeadset)&&E(),T=r?0:T+e,y&&b&&T>Uc)try{y.close()}catch{}C-=e,b&&C<=0&&(C=Hc,r&&(!document.hidden||globalThis.__inHeadset)?re(t):(y.send(`idle`),C=2));let o=i-Gc,c=[];for(let e of _.others.values()){let n=e.snaps[e.snaps.length-1],a=!n||i-e.heardT>Jc;a||!r?(e.model&&=(e.model.rider=null,e.model.bike.root.visible=!1,null),a&&_.others.delete(e.id)):(e.d=Math.hypot(n.s[0]-t.gx,n.s[1]-t.gz),c.push(e))}c.sort((e,t)=>e.d-t.d),_.dots.length=0;for(let e of c){let t=e.snaps[e.snaps.length-1].s;e.dot||={wx:0,wz:0,color:`hsl(${e.hue}, 80%, 62%)`},e.dot.wx=e.model?e.model.bike.root.position.x:Bt(t[0],t[1]),e.dot.wz=e.model?e.model.bike.root.position.z:G(t[0],t[1]),_.dots.push(e.dot)}for(let e=a;e<c.length;e++){let t=c[e];t.model&&=(t.model.rider=null,t.model.bike.root.visible=!1,null)}for(let n=0;n<Math.min(a,c.length);n++){let r=c[n];if(!r.model){let e=te();if(!e)break;e.rider=r,r.model=e}r.model.who!==r.id&&(r.model.who=r.id,r.model.bike.setColors(il(r.id,r.hue))),ie(r,F(r,o),e,t)}let u=r&&b?l():null;if(u&&!u.theater){let e=!t.grounded&&t.vy<0;for(let n of c){if(n.d>6||i<(n.bumpT||0))continue;let r=F(n,o);if(!r||r[7]&16)continue;let a=Math.hypot(r[0]-t.gx,r[1]-t.gz);if(a>Yc||Math.abs(r[2]-t.y)>2.2)continue;let s=(r[0]-t.gx)/(a||1),c=(r[1]-t.gz)/(a||1),l=(Math.cos(t.heading)*s+Math.sin(t.heading)*c)*t.speed,u=-(Math.cos(r[3])*s+Math.sin(r[3])*c)*r[4];if(!(e||t.speed>3.2&&l+u>3&&l>=u-.5))continue;n.bumpT=i+1.5,re(t),y.send(JSON.stringify({t:`hit`,id:n.id})),M(n,t.gx,t.gz);let d=(t.gx+r[0])/2,f=(t.gz+r[1])/2;p?.(k(t.gx,t.gz,t.heading,r[0],r[1]),{x:Bt(d,f),y:t.y+1,z:G(d,f)})}for(let e of v.values())i-e.askedT<.8||Math.hypot(e.gx-t.gx,e.gz-t.gz)>Xc||Math.abs(e.y-.9-t.y)>2.5||(e.askedT=i,re(t),y.send(JSON.stringify({t:`grab`,orb:e.id})))}P.length&&n.uniforms.uDynLamp.value.copy(s(t.gx,t.gz,ee))};function ie(e,t,n,r){if(!t)return;let[i,a,s,c,l,u,d,f,p,m,h]=t,g=!!(f&1),_=!!(f&2),v=Bt(i,a),y=G(i,a),b=Math.cos(c),x=Math.sin(c),S=Bt(i+b*.5,a+x*.5)-v,C=G(i+b*.5,a+x*.5)-y,w=Math.atan2(C,S);e.wheel+=l*n/ko,!_&&g&&l>.3&&(e.crank+=Ut(l*.62,2,9)*n),_&&g&&(e.stride+=l*n*(Math.PI/2)/Math.min(.34,.2+.03*l)),f&8&&(e.flap+=n*4),_&&!e.park?e.park={x:v-C/Math.hypot(S,C)*.55,y:s,z:y+S/Math.hypot(S,C)*.55,yaw:-w,snap:!0}:_||(e.park=null);let T=e.model.bike;e.gx=i,e.gz=a,e.h=c,e.shoveT=Math.max(0,(e.shoveT||0)-n),e.wobbleT=Math.max(0,(e.wobbleT||0)-n),e.knockT=Math.max(0,(e.knockT||0)-n);let E=e.knockT>0?.75*Math.sin(Math.PI*(1-e.knockT/Zc)):0;T.root.visible=!0,T.root.position.set(v+(e.knockX||0)*E,s,y+(e.knockZ||0)*E),T.root.rotation.y=-w;let D=o(i,a);T.pose({wheel:e.wheel,crank:e.crank,steer:u,lean:d,pitch:0,bob:0,air:+!g,speed:Math.abs(l),dt:n,wings:f&4?1:0,flying:!!(f&8),flap:e.flap,spin:p,flip:m,trickPose:h,grab:e.shoveT>0?e.shoveSide:0,bail:e.wobbleT>0,walk:_,stride:e.stride,park:e.park}),e.park&&(e.park.snap=!1),T.shadow.position.y=g?.03:-(s-D)+.03}let ae=null,oe=e=>{re(O),y.send(JSON.stringify({t:`say`,text:e}))};return _.say=e=>(e=String(e).slice(0,200),b&&O?oe(e):ae={text:e,t:performance.now()},!0),_.where=(e,t)=>{let n=_.others.get(e);if(!n||!n.snaps.length)return null;if(n.model&&n.model.bike.root.visible){let e=n.model.bike.root.position;return t.set(e.x,e.y+2.25,e.z)}let r=n.snaps[n.snaps.length-1].s;return t.set(Bt(r[0],r[1]),r[2]+2.25,G(r[0],r[1]))},_.close=()=>{if(w=!1,y)try{y.close()}catch{}},_}var ol=6.5,sl=10;function cl({box:e,layer:t,camera:n,shared:r,where:i,send:a,onOpen:o,onMute:s}){let c=e.querySelector(`input`),l=new Map,u=new Set,d=new R,f={open:!1,muted:u},p=c.placeholder,m=null;f.show=(t,n=null)=>{t&&(m=n,c.placeholder=n?.hint||p),f.aside=t&&!!n,f.open!==t&&(f.open=t,e.classList.toggle(`on`,t),t?(c.value=``,c.focus({preventScroll:!0})):c.blur(),o?.(t))};for(let e of[`keydown`,`keyup`,`keypress`])c.addEventListener(e,t=>{t.stopPropagation(),e===`keydown`&&t.key===`Escape`&&(t.preventDefault(),f.show(!1))});return e.addEventListener(`submit`,e=>{e.preventDefault();let t=c.value.trim();t&&(m?.send||a)(t),f.show(!1)}),c.addEventListener(`blur`,()=>{f.open&&f.show(!1)}),f.heard=(e,n,r,i=!1,a={})=>{if(u.has(e))return;let o=l.get(e);if(r===null)o&&(o.el.remove(),l.delete(e));else{if(i||=!!a.plain,!o){if(l.size>=sl){let[e,t]=l.entries().next().value;t.el.remove(),l.delete(e)}let n=document.createElement(`button`);n.type=`button`,n.className=`bubble`,i?n.classList.add(`mine`):(n.title=`Click to stop hearing this rider`,n.addEventListener(`click`,()=>{u.add(e),n.remove(),l.delete(e),s?.()})),t.appendChild(n),o={el:n,t:0},l.set(e,o)}if(o.el.textContent!==r){o.el.textContent=r;let e=o.el.style.transform;o.el.style.transform=`none`,o.el.style.width=``;let t=document.createRange();t.selectNodeContents(o.el);let n=t.getBoundingClientRect().width,i=getComputedStyle(o.el);n>0&&(o.el.style.width=`${Math.ceil(n+parseFloat(i.paddingLeft)+parseFloat(i.paddingRight))+1}px`),o.el.style.transform=e}o.el.style.setProperty(`--hue`,n),o.el.classList.remove(`going`),o.el.classList.toggle(`waiting`,!!a.wait),o.kept=!!a.plain&&!a.passing,o.t=a.hold||ol}},f.refused=()=>{},f.update=(e,t,a)=>{for(let[o,s]of l){if(s.t-=e,s.t<=0){s.el.remove(),l.delete(o);continue}s.t<.6&&s.el.classList.add(`going`);let c=i(o,d);if(!c){s.el.style.display=`none`;continue}let u=c.x-n.position.x,f=c.z-n.position.z;c.y+=r.uBend.value*(u*u+f*f);let p=Math.hypot(u,f);if(c.project(n),(c.z>1||c.z<-1||Math.abs(c.x)>1.1||Math.abs(c.y)>1.1)&&!s.kept){s.el.style.display=`none`;continue}s.el.style.display=``;let m=(c.x*.5+.5)*t,h=(-c.y*.5+.5)*a,g=Math.max(.62,Math.min(1,14/Math.max(p,1)));s.kept&&((c.z>1||c.z<-1)&&(m=t/2,h=a*.34),m=Math.max(150,Math.min(t-150,m)),h=Math.max(96,Math.min(a*.72,h)),g=Math.max(g,.9)),s.el.style.transform=`translate(-50%, -100%) translate(${m.toFixed(1)}px, ${h.toFixed(1)}px) scale(${g.toFixed(3)})`}},f.clear=()=>{for(let e of l.values())e.el.remove();l.clear()},f}var ll=6.5,ul=16,dl=12,fl=17,pl=8,ml=2.5,hl=.6,gl=11,_l=`/hails`,vl=30,yl={postman:`the postman`,waiter:`the waiter`,patron:`the café keeper`,painter:`the painter`,zouave:`a soldier`,gent:`a gentleman`,lady:`a lady`,arlesienne:`a lady of Arles`,worker:`a workman`},bl={lamplighting:`the lamplighter`,fiddling:`the fiddler`,selling:`a market seller`},xl=e=>bl[e.doing]||yl[e.kind]||`someone`;function Sl({world:e,time:t,town:n,show:r,seen:i,quiet:a,onNear:o,onError:s,onUnheard:c,url:l=`/api/talk`}){let u={near:null,with:null,busy:!1},d=new Map,f=new Map,p={x:0,y:0,z:0},m=0,h=null,g=null,_=-2.5,v=0,y=0,b=0,x=0,S=!1,C=()=>{S||(S=!0,c?.())},w=new Map,T=e=>`npc:${e}`;u.update=(n,s,c,l=!1)=>{if(b+=n,m-=n,m>0)return;m=.15;let d=t(),f=c&&Math.abs(s.speed)<fl?e.personNear(s.wx,s.wz,s.y,ll,d):null;if(u.with){let t=Math.hypot(e.personAt(u.with.p,d,p).x-s.wx,p.z-s.wz);!c||t>ul||!u.busy&&!l&&b-y>vl?(u.with=null,e.hold(null)):f&&f.cid===u.with.cid||(f=u.engaged()||l||t<ll*1.6?u.with:f)}u.near=f;let x=f?xl(f.p):null;x!==h&&(h=x,o?.(x));let S=!c||Math.abs(s.speed)>=fl?null:e.personNear(s.wx,s.wz,s.y,gl,d,(e,t)=>w.has(e)&&b-w.get(e)<=dl?(w.set(e,b),!1):!i||i(t.x,t.y+1.7,t.z));if(S&&!u.with&&!u.busy&&!l&&b-_>ml&&b>v+hl){f=S,w.delete(f.cid),w.set(f.cid,b),w.size>400&&w.delete(w.keys().next().value),_=b;let e=Zt(Qt(f.p.kind,f.p.seed)),t=T(f.cid);E(t,f.p);let n=Math.max(2.6,Math.min(6,e.text.split(/\s+/).length*.36+1.2));r(t,e.text,{hold:n,passing:!0}),v=b+n-1,a()?C():(D(`${_l}/${e.clip}.mp3`,.9),g.addEventListener(`ended`,()=>{v=Math.min(v,b)},{once:!0}))}},u.engaged=()=>u.busy||b<x,u.facing=n=>u.with?(e.personAt(u.with.p,t(),p),n.x=p.x,n.y=p.y,n.z=p.z,n):null,u.leave=()=>{!u.busy&&b>=x&&u.with&&(u.with=null,e.hold(null))};let E=(e,t)=>{f.set(e,t),f.size>40&&f.delete(f.keys().next().value)};function D(e,t){try{g?.pause()}catch{}g=new Audio(e),g.volume=t,g.play().catch(()=>{})}function O(e,t,n,i){D(`${l}?speak=${encodeURIComponent(e)}`,.95);let a=g;a.addEventListener(`playing`,()=>{r(t,n,{hold:i+6}),y=b+i,x=b+Math.min(i+3,16)},{once:!0}),a.addEventListener(`ended`,()=>{r(t,n,{hold:1.4}),y=b,x=b},{once:!0}),a.addEventListener(`error`,()=>{x=Math.min(x,b+1)},{once:!0})}return u.begin=()=>{let n=u.near;return n?(u.with&&u.with.cid===n.cid||(u.with=n,e.hold(n.p,t())),y=b,!0):!1},u.where=(n,r)=>{let i=f.get(n);return i?(e.personAt(i,t(),p),r.set(p.x,p.y+(i.tall||1.7)+.42,p.z)):null},u.say=async i=>{let o=u.with||u.near;if(!o||u.busy)return!1;u.with&&u.with.cid===o.cid||(u.with=o,e.hold(o.p,t())),u.busy=!0,y=b;let c=T(o.cid);E(c,o.p);let f=d.get(o.cid)||[];r(c,`…`,{hold:12,wait:!0});try{let e=await fetch(l,{method:`POST`,headers:{"content-type":`application/json`},body:JSON.stringify({who:{kind:o.p.kind,seed:o.p.seed,doing:o.p.doing},say:i,history:f,town:n(),voice:!a()})}),t=await e.json().catch(()=>({}));if(!e.ok||!t.text)return r(c,null),s?.(t.message||`They did not seem to hear you.`),!1;for(f.push({by:`rider`,text:i},{by:`villager`,text:t.text});f.length>pl;)f.shift();d.set(o.cid,f),d.size>60&&d.delete(d.keys().next().value);let u=Math.max(4.5,Math.min(16,t.text.split(/\s+/).length*.42+1.5));return r(c,t.text,{hold:u}),y=b+u,x=b+Math.min(u,9),t.speak&&!a()?O(t.speak,c,t.text,u):a()&&C(),!0}catch{return r(c,null),s?.(`They did not seem to hear you.`),!1}finally{u.busy=!1}},u.hush=()=>{try{g?.pause()}catch{}u.with=null,e.hold(null)},u}var Cl=`modulepreload`,wl=function(e){return`/`+e},Tl={},El=function(e){return e.pathname.endsWith(`.css`)},Dl=function(e,t,n){if(t in e)return e[t];let r=n();if(!r){e[t]=void 0;return}let i=r.then(()=>{e[t]=void 0},n=>{throw e[t]=void 0,n});return e[t]=i,i},Ol=function(e,t,n){let r=Promise.resolve();if(t&&t.length>0){let e,i=document.querySelector(`meta[property=csp-nonce]`),a=i?.nonce||i?.getAttribute(`nonce`);function o(e){return Promise.all(e.map(e=>Promise.resolve(e).then(e=>({status:`fulfilled`,value:e}),e=>({status:`rejected`,reason:e}))))}function s(e){return import.meta.resolve?new URL(import.meta.resolve(e)):new URL(e,import.meta.url)}r=o(t.map(t=>{t=wl(t,n);let r=s(t),i=El(r);return Dl(Tl,r.href,()=>{if(e===void 0){e={all:new Set,styles:new Set};let t=document.getElementsByTagName(`link`);for(let n=t.length-1;n>=0;n--){let r=t[n];e.all.add(r.href),r.rel===`stylesheet`&&e.styles.add(r.href)}}if((i?e.styles:e.all).has(r.href))return;let t=document.createElement(`link`);if(t.rel=i?`stylesheet`:Cl,i||(t.as=`script`),t.crossOrigin=``,t.href=r.href,a&&t.setAttribute(`nonce`,a),document.head.appendChild(t),i)return new Promise((e,n)=>{let i=a=>{t.removeEventListener(`load`,i),t.removeEventListener(`error`,i),a.type===`error`?n(Error(`Unable to preload CSS for ${r}`)):e(a)};t.addEventListener(`load`,i),t.addEventListener(`error`,i)})})}).filter(e=>e!==void 0))}function i(e){let t=new Event(`vite:preloadError`,{cancelable:!0});if(t.payload=e,window.dispatchEvent(t),!t.defaultPrevented)throw e}return r.then(t=>{for(let e of t||[])e.status===`rejected`&&i(e.reason);return e().catch(i)})},kl=[{id:`wheat`,title:`Wheatfield with Crows`,year:1890,aspect:2560/1218,game:`Fly with the Crows`,patches:[`plate`,`crows`],small:[`plate`],how:`His crows get up off the canvas and come down the wind at you. Hold <kbd>Space</kbd> to beat your wings and climb; let go and you sink. Gather the orbs, and keep clear of every crow.`,touch:`His crows get up off the canvas and come down the wind at you. Hold a thumb down to beat your wings and climb; let go and you sink. Gather the orbs, and keep clear of every crow.`,load:()=>Ol(()=>import(`./wheat-DL0atyN8.js`),__vite__mapDeps([0,1,2]))},{id:`rhone`,title:`Starry Night Over the Rhône`,year:1888,aspect:2048/1587,game:`Ride the Reflections`,patches:[`ground`,`dark`],small:[`ground`],how:`The lamps’ reflections will bear a bicycle; the dark water will not. <kbd>A</kbd> <kbd>D</kbd> steer, <kbd>Space</kbd> leaps a gap — hold it for a long one — or across to the next streak, <kbd>W</kbd> pedals hard. The orbs know the way over to the town.`,touch:`The lamps’ reflections will bear a bicycle; the dark water will not. Steer with the left thumb; Leap clears a gap — hold it for a long one — or takes you across to the next streak. The orbs know the way over to the town.`,load:()=>Ol(()=>import(`./rhone-DTHJGiQE.js`),__vite__mapDeps([3,1,2]))},{id:`cypress`,title:`Road with Cypress and Star`,year:1890,aspect:1625/2048,game:`The Night Road`,patches:[`sky`,`ground`,`tree`],small:[`sky`,`ground`,`tree`],how:`Up his road past the great cypress, out round the wheat, and back to where he stood. <kbd>A</kbd> <kbd>D</kbd> steer, <kbd>W</kbd> pedals hard, <kbd>S</kbd> brakes, <kbd>Space</kbd> leaps. Everyone else on the road is coming the other way: go round them.`,touch:`Up his road past the great cypress, out round the wheat, and back to where he stood. Steer with the left thumb, push it up to pedal hard, and Leap for the stars. Everyone else on the road is coming the other way: go round them.`,load:()=>Ol(()=>import(`./cypress-DGzi-Ym0.js`),__vite__mapDeps([4,1,2]))},{id:`cafe`,title:`Café Terrace at Night`,year:1888,aspect:1559/2048,game:`A Table on the Terrace`,place:!0,enter:`Take a seat`,patches:[`plate`],small:[`plate`],how:`A table on the café’s terrace and a glass of wine. Drag to look about, and <kbd>Space</kbd> raises your glass.`,touch:`A table on the café’s terrace and a glass of wine. Drag to look about, and Santé raises your glass.`,load:()=>Ol(()=>import(`./cafe-D3RBdeD2.js`),__vite__mapDeps([5,1,2,6]))}],Al=e=>kl.find(t=>t.id===e),jl=new R(0,1,0),Ml=`vec3 dec(vec3 c) { return mix(c / 12.92, pow((c + 0.055) / 1.055, vec3(2.4)), step(vec3(0.04045), c)); }`;function Nl(n){let{scene:i,camera:a,shared:o,post:s,game:c,player:l,bike:u,chase:f,input:p,audio:m,glowMat:h,paintMat:g,walkerMat:_,toast:v,note:y,setProjection:b,rideFocal:x,layout:S,townView:C,award:w}=n,D=e=>document.getElementById(e),O=D(`portal`),A=s.composite.uniforms,j=new re,M={scene:null,world:0,active:!1,PORTALS:kl},N={phase:`off`,t:0,def:null,mod:null,tex:null,realm:null,loaded:!1,failed:!1,hole:null,from:null,earned:0,booted:!1,coverT:-1,keepTex:null,keep:null,result:null,s:0,mix0:0},ee=new Ee,te=new Map,ne=e=>{let t=te.get(e);return t||(t=new Promise((t,n)=>{ee.load(`/`+e,e=>{e.colorSpace=``,e.generateMipmaps=!0,e.minFilter=d,e.magFilter=T,e.anisotropy=4,t(e)},void 0,()=>{te.delete(e),n(Error(`could not load ${e}`))})}),te.set(e,t)),t},ie=po(o,{dynamic:!0}),ae=new Map,oe=new Set,I=new Set,se=new Map,ce=0,L=!1,le=[],ue=()=>{Ws.gallery.label=`gallery · four canvases to step into`;try{localStorage.setItem(`nightrider-portals`,`1`)}catch{}};try{localStorage.getItem(`nightrider-portals`)===`1`&&ue()}catch{}function de(e,t){let n=se.get(e.id);return n||(n=new F({uniforms:{tMap:{value:t},uTime:o.uTime},vertexShader:`varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,fragmentShader:`
          precision highp float;
          uniform sampler2D tMap; uniform float uTime; varying vec2 vUv;
          ${Ml}
          void main() {
            vec2 w = vec2(sin(vUv.y * 13.0 + uTime * 0.7) + sin(vUv.x * 9.0 - uTime * 0.5), cos(vUv.x * 11.0 + uTime * 0.6) + cos(vUv.y * 7.0 + uTime * 0.4));
            vec3 c = dec(texture2D(tMap, vUv + w * 0.003).rgb);
            gl_FragColor = vec4(c * (1.05 + 0.22 * sin(uTime * 1.7)), 1.0);
          }`}),se.set(e.id,n)),n}function fe(e){let t=mt(e.i,e.j).hall;if(t&&t.theme===`gallery`)for(let n of H(t))pe(`${e.key}/${n.n}`,e.key,t,n)}function pe(e,n,r,a){if(ae.has(e)||oe.has(e))return;let o=kl[a.n%kl.length];oe.add(e),ne(`worlds/${o.id}-t.webp`).then(s=>{if(oe.delete(e),ae.has(e)||!I.has(n))return;let c=a.side<0?r.z0+r.wall:r.z1-r.wall,l=Bt(a.x,c),u=G(a.x,c),d=Bt(a.x+.5,c)-Bt(a.x-.5,c),f=G(a.x+.5,c)-G(a.x-.5,c),p=Math.hypot(d,f);d/=p,f/=p;let m=Bt(a.x,r.zc)-l,g=G(a.x,r.zc)-u,_=m*d+g*f;m-=_*d,g-=_*f;let v=Math.hypot(m,g);m/=v,g/=v;let y=new t,b=Pt(a.x,c);y.position.set(l+m*.03,b,u+g*.03),y.rotation.y=Math.atan2(m,g);let x=2.6,S=x*o.aspect;S>4.2&&(S=4.2,x=S/o.aspect);let C=2.45,w=.17,T=.1,D=new Vt(256);D.color(jt.gold).data(ht.PLAIN,2.8,.7,0),D.box(-S/2-w,S/2+w,0,T,C+x/2,C+x/2+w),D.box(-S/2-w,S/2+w,0,T,C-x/2-w,C-x/2),D.box(-S/2-w,-S/2,0,T,C-x/2,C+x/2),D.box(S/2,S/2+w,0,T,C-x/2,C+x/2);let O=zt(D,ie),k=new P(new E(S,x),de(o,s));k.position.set(0,C,.05),k.frustumCulled=!1;let A=O.geometry.attributes.color,j=Float32Array.from(A.array),M=bt(h,12);y.add(O,k),i.add(y,M.mesh),ae.set(e,{key:e,gallery:n,group:y,gilt:O,pic:k,gold:A,gold0:j,motes:M,def:o,h:r,fy:b,ax:l,az:u,tx:d,tz:f,nx:m,nz:g,half:S/2,ph:x,yc:C,seed:a.n/4+.1})}).catch(()=>{oe.delete(e)})}function me(e){let t=ae.get(e);t&&(i.remove(t.group,t.motes.mesh),t.gilt.geometry.dispose(),t.pic.geometry.dispose(),t.motes.mesh.geometry.dispose(),ae.delete(e))}M.town=(e,t=!0)=>{if(!N.booted){N.booted=!0;let e=Al(new URLSearchParams(location.search).get(`portal`));if(e){we(e,null);return}}if(ce-=e,ce<=0){ce=.6,le.length=0,$s(l.gx,l.gz,2,le);let e=le.filter(e=>e.type===`gallery`).sort((e,t)=>Math.hypot(e.wx-l.wx,e.wz-l.wz)-Math.hypot(t.wx-l.wx,t.wz-l.wz)).slice(0,2);I.clear();for(let t of e)I.add(t.key);for(let e of[...ae.values()])I.has(e.gallery)||me(e.key);for(let t of e)fe(t)}let n=null,r=1e9;for(let e of ae.values()){let i=l.wx-e.ax,a=l.wz-e.az,s=i*e.tx+a*e.tz,c=i*e.nx+a*e.nz,u=!!l.hall&&l.hall.key===e.h.key,d=Math.hypot(i,a);d<r&&(r=d,n=e);{let t=.5+.5*Math.sin(o.uTime.value*2.6+e.seed*6),n=1+2.2*t*t*(3-2*t),r=e.gold.array;for(let t=0;t<r.length;t++)r[t]=e.gold0[t]*n;e.gold.needsUpdate=!0}if(e.motes.begin(),e.motes.end(),!(!u||Math.abs(l.y-e.fy)>1.4)&&(!L&&c<9&&Math.abs(s)<9&&(L=!0,ue(),v(`Paintings within the painting — ride into one`,4600)),t&&c<1.3&&c>-.6&&Math.abs(s)<e.half+.1)){we(e.def,{gx:l.gx,gz:l.gz+Math.sign(e.h.zc-l.gz)*1.2,heading:Math.cos(l.heading)>=0?0:Math.PI});return}}n&&ie.uniforms.uDynLamp.value.set(n.ax+n.nx*2.6,n.fy+3.6,n.az+n.nz*2.6,1)};function he(){if(!N.def)return;let e=window.innerWidth,t=window.innerHeight,n=N.def.aspect,r=Ut(t*.3,196,280),i=Math.min(t*.95-r,t*.64),a=i*n;a>e*.86&&(a=e*.86,i=a/n);let o=Ut(Math.min(a,i)*.05,8,26);a-=2*o,i=a/n;let s=i+2*o+r,c=Math.max(t*.03,(t-s)/2),l=e/2,u=c+o+i/2;N.hole={cx:l,cy:u,w:a,h:i,b:o},A.uHole.value.set((l-a/2)/e,1-(u+i/2)/t,(l+a/2)/e,1-(u-i/2)/t);let d=e=>`${e.toFixed(1)}px`,f={l:l-a/2-o,t:u-i/2-o,w:a+2*o,h:i+2*o};for(let e of[D(`p-frame`),D(`p-shadow`)])e.style.left=d(f.l),e.style.top=d(f.t),e.style.width=d(f.w),e.style.height=d(f.h);D(`p-frame`).style.borderWidth=d(o);let p=D(`p-lip`);p.style.left=d(l-a/2),p.style.top=d(u-i/2),p.style.width=d(a),p.style.height=d(i);let m=D(`p-wall`),h=f.l+f.w,g=f.t+f.h;m.style.transformOrigin=`${d(l)} ${d(u)}`,m.style.clipPath=`polygon(evenodd, 0 0, 100% 0, 100% 100%, 0 100%, 0 0, ${d(f.l)} ${d(f.t)}, ${d(f.l)} ${d(g)}, ${d(h)} ${d(g)}, ${d(h)} ${d(f.t)}, ${d(f.l)} ${d(f.t)})`,D(`p-plaque`).style.top=d(g+Ut(t*.022,10,24))}window.addEventListener(`resize`,()=>{N.phase!==`off`&&he()});let ge=e=>{try{return parseInt(localStorage.getItem(`nightrider-best-${e}`)||`0`,10)||0}catch{return 0}},_e=(e,t)=>{try{localStorage.setItem(`nightrider-best-${e}`,String(t))}catch{}},ve=e=>{O.className=e},ye=0,be={points(e){D(`p-points`).textContent=Math.round(e).toLocaleString()},clock(e){D(`p-clock`).textContent=e},lives(e,t=3){D(`p-lives`).innerHTML=`${`<b>●</b>`.repeat(Math.max(0,e))}${`<i>●</i>`.repeat(Math.max(0,t-e))}`},note(e,t=2.2){let n=D(`p-note`);n.textContent=e,n.classList.add(`on`),clearTimeout(ye),ye=setTimeout(()=>n.classList.remove(`on`),t*1e3)},custom:D(`p-custom`),labels:D(`p-labels`)},xe={fog:e=>o.uFogColor.value.setRGB(...e),fogRange:e=>o.uFogRange.value.set(...e),moonDir:e=>o.uMoonDir.value.set(...e).normalize(),moonCol:e=>o.uMoonCol.value.setRGB(...e),ambSky:e=>o.uAmbSky.value.setRGB(...e),ambGround:e=>o.uAmbGround.value.setRGB(...e),warm:e=>o.uWarmCol.value.setRGB(...e),glow:e=>{o.uGlow.value=e},exposure:e=>{A.uExposure.value=e},outline:e=>{A.uOutline.value=e},vignette:e=>{A.uVignette.value=e},ao:e=>{A.uAO.value=e},bloom:e=>{A.uBloom.value=e},reach:e=>{A.uReach.value.set(...e)}};function Se(e){N.keep={fog:o.uFogColor.value.toArray(),fogRange:o.uFogRange.value.toArray(),moonDir:o.uMoonDir.value.toArray(),moonCol:o.uMoonCol.value.toArray(),ambSky:o.uAmbSky.value.toArray(),ambGround:o.uAmbGround.value.toArray(),warm:o.uWarmCol.value.toArray(),glow:o.uGlow.value,exposure:A.uExposure.value,outline:A.uOutline.value,vignette:A.uVignette.value,ao:A.uAO.value,bloom:A.uBloom.value,reach:A.uReach.value.toArray()};for(let t of Object.keys(e||{}))xe[t]&&xe[t](e[t]);o.uHeadPower.value=0}function Ce(){if(N.keep){for(let e of Object.keys(N.keep))xe[e](N.keep[e]);N.keep=null}}function we(e,t){if(N.phase!==`off`||c.state!==`ride`)return;Object.assign(N,{phase:`cover`,t:0,def:e,from:t,mod:null,tex:null,loaded:!1,failed:!1,earned:0,coverT:-1,result:null}),c.state=`realm`,M.active=!0,M.world=kl.indexOf(e)+1,p.clear(),l.speed=Math.min(l.speed,3),D(`p-title`).textContent=e.title,D(`p-sub`).innerHTML=`Vincent van Gogh, ${e.year} &middot; <em>${e.game}</em>`,D(`p-how`).innerHTML=bo.touch?e.touch:e.how,D(`p-how`).hidden=!(bo.touch?e.touch:e.how);let n=ge(e.id);D(`p-best`).textContent=!e.place&&n>0?`Your best here: ${n.toLocaleString()}`:``,O.toggleAttribute(`data-place`,!!e.place),D(`p-play`).disabled=!0,D(`p-play`).textContent=`Opening…`,N.keepTex=A.tPainting.value,he(),document.getElementById(`hud`).classList.add(`realm`),ve(`leaving`),O.offsetWidth,ve(`card`),m.arrive(),ue(),y(`portal`,{world:e.id}),ne(`worlds/${e.id}-t.webp`).then(t=>{N.def===e&&!N.tex&&(A.tPainting.value=t,N.coverT<0&&(N.coverT=N.t))}).catch(()=>{}),Promise.all([ne(`worlds/${e.id}${bo.small?`-s`:``}.webp`),e.load(),ne(`worlds/${e.id}-f.png`),...(e.patches||[]).map(t=>ne(`worlds/p-${e.id}-${t}${bo.small&&(e.small||[]).includes(t)?`-s`:``}.webp`))]).then(([t,n,r,...i])=>{N.def===e&&(N.tex=t,N.mod=n,N.flow=r,N.loaded=!0,N.patch={},(e.patches||[]).forEach((e,t)=>{N.patch[e]=i[t]}),A.tPainting.value=t,N.coverT<0&&(N.coverT=N.t))}).catch(()=>{N.def===e&&(N.failed=!0)})}function Te(){let e=N.def,t={def:e,tex:N.tex,flow:N.flow,patch:N.patch||{},camera:a,shared:o,bike:u,audio:m,device:bo,input:p,glowMat:h,paintMat:g,walkerMat:_,hud:be,dynMat:()=>po(o,{dynamic:!0}),walkMat:()=>po(o,{walker:!0}),view:()=>c.view,tone:{uExposure:A.uExposure,uSaturation:A.uSaturation,uContrast:A.uContrast,uHdrPeak:A.uHdrPeak},res:()=>({w:s.width,h:s.height}),tune:e=>{for(let t of Object.keys(e))xe[t]&&xe[t](e[t])}};be.points(0),be.clock(``),D(`p-lives`).innerHTML=``,be.custom.innerHTML=``,be.labels.innerHTML=``,N.realm=N.mod.default(t),j.add(N.realm.group),j.add(u.root),Se(N.realm.look),M.scene=j,N.realm.start(),D(`p-play`).disabled=!1,D(`p-play`).textContent=e.enter||`Play`,O.toggleAttribute(`data-fly`,!!N.realm.frame)}function z(){N.phase===`card`&&N.realm&&(N.phase=`open`,N.t=0,p.clear(),ve(`opening`),m.wings())}function De(){N.phase===`result`&&(N.realm.start(),N.phase=`play`,N.t=0,p.clear(),ve(`play`))}function Oe(){N.phase!==`off`&&N.phase!==`close`&&N.phase!==`uncover`&&N.phase!==`cover`&&(N.realm&&N.realm.frame&&(Ve(),he()),N.phase=`close`,N.t=0,N.mix0=c.titleMix,p.clear(),ve(`closing`))}function ke(e){N.result=e,N.phase=`result`,N.t=0;let t=N.def,n=Math.max(0,Math.round(e.score)),r=ge(t.id),i=n>r;i&&_e(t.id,n);let a=Math.min(1500,Math.round(n/20)*10);N.earned=Math.max(N.earned,a),D(`p-r-title`).textContent=e.title||t.game,D(`p-r-score`).textContent=n.toLocaleString(),D(`p-r-lines`).innerHTML=(e.lines||[]).map(e=>`<span>${e}</span>`).join(``),D(`p-r-best`).textContent=i&&r>0?`A new best — it was ${r.toLocaleString()}`:i?`Your first score here`:`Your best here: ${r.toLocaleString()}`,D(`p-r-reward`).textContent=N.earned>0?`${N.earned.toLocaleString()} orbs go back to the town with you`:``,ve(`result`),p.clear(),i?m.deliver():m.arrive(),y(`portal_score`,{world:t.id,score:n})}function Ae(){N.realm&&=(j.remove(N.realm.group),N.realm.dispose?.(),null),i.add(u.root),Ce(),M.scene=null,N.from&&(l.gx=N.from.gx,l.gz=N.from.gz,l.heading=N.from.heading),l.speed=0,l.vy=0,l.steer=0,l.lean=0,l.syncWorld(),f.snap(l),be.custom.innerHTML=``,be.labels.innerHTML=``}function je(){let e=N.def,t=N.earned;A.tPainting.value=N.keepTex,c.titleMix=0,S(),document.getElementById(`hud`).classList.remove(`realm`),ve(`hidden`),O.removeAttribute(`data-place`),O.removeAttribute(`data-fly`),Object.assign(N,{phase:`off`,def:null,mod:null,tex:null,loaded:!1,result:null}),M.active=!1,M.world=0,c.state=`ride`,p.clear(),t>0&&w(t,e)}D(`p-play`).addEventListener(`click`,z),D(`p-back`).addEventListener(`click`,Oe),D(`p-again`).addEventListener(`click`,De),D(`p-done`).addEventListener(`click`,Oe),D(`p-leave`).addEventListener(`click`,e=>{Oe(),e.currentTarget.blur()}),M.key=e=>{if(!M.active||e.repeat)return!1;let t=e.code===`Enter`||e.code===`Space`;return e.code===`Escape`?(Oe(),!0):t&&N.phase===`card`?(z(),!0):t&&N.phase===`result`&&N.t>.7?(De(),!0):!1};let Me=new e,Ne=new e,Pe=new r,Fe=new k(0,0,0,`YXZ`),Ie=new R,Le=new e,Re=new R(0,0,1),ze=[`p-wall`,`p-frame`,`p-lip`,`p-shadow`];function Be(e,t,n){let r=N.hole,i=window.innerWidth,a=window.innerHeight,o=r.w*e,s=r.h*e;A.uHole.value.set((r.cx-o/2)/i,1-(t+s/2)/a,(r.cx+o/2)/i,1-(t-s/2)/a);for(let n of ze)D(n).style.transform=`translate(0px, ${(t-r.cy).toFixed(2)}px) scale(${e.toFixed(4)})`;D(`p-card`).style.opacity=N.covers?``:String(1-Dt(.72,1,n))}function Ve(){for(let e of ze)D(e).style.transform=``;D(`p-card`).style.opacity=``}function He(e,t){let n=N.realm,r=n.pose,i=c.view.H,o=window.innerWidth,s=Math.tan(r.vfov/2),l=N.hole.h/2/s,u=n.fit?Math.min(i/2/s,o/2/(s*N.def.aspect)):Math.max(i/2/s,o/2/(s*N.def.aspect)),d=x(n.cam.fov),f=Math.exp(It(Math.log(l),Math.log(u),e)),p=It(N.hole.cy,i/2,e);Me.setFromEuler(Fe.set(r.pitch,-r.yaw,0)),Pe.lookAt(n.cam.pos,n.cam.look,jl),Ne.setFromRotationMatrix(Pe),n.cam.roll&&Ne.multiply(Le.setFromAxisAngle(Re,n.cam.roll)),a.position.copy(Ie.set(r.pos[0],r.pos[1],r.pos[2]).lerp(n.cam.pos,t)),a.quaternion.copy(Me).slerp(Ne,t),b(Math.exp(It(Math.log(f),Math.log(d),t)),p),N.s=t,N.covers=!n.fit,N.phase===`open`&&Be(f/l,p,e)}function Ue(e){let t=N.realm,n=t.pose,r=c.view.H;Me.setFromEuler(Fe.set(n.pitch,-n.yaw,0));let i=N.hole.h/2/Math.tan(n.vfov/2);if(N.s=e,e<=0){a.position.set(n.pos[0],n.pos[1],n.pos[2]),a.quaternion.copy(Me),b(i,N.hole.cy),t.frame&&N.phase===`open`&&Be(1,N.hole.cy,0);return}Pe.lookAt(t.cam.pos,t.cam.look,jl),Ne.setFromRotationMatrix(Pe),t.cam.roll&&Ne.multiply(Le.setFromAxisAngle(Re,t.cam.roll)),a.position.copy(Ie.set(n.pos[0],n.pos[1],n.pos[2]).lerp(t.cam.pos,e)),a.quaternion.copy(Me).slerp(Ne,e);let o=x(t.cam.fov),s=Math.exp(It(Math.log(i),Math.log(o),e)),l=It(N.hole.cy,r/2,e);b(s,l),t.frame&&N.phase===`open`&&(N.covers=N.hole.h*(o/i)>=r-1&&N.hole.w*(o/i)>=window.innerWidth-1,Be(s/i,l,e))}return M.step=e=>{N.t+=e;let t=N.realm;if(N.phase===`cover`){if(C(e),c.titleMix=N.coverT<0?0:Dt(0,.6,N.t-N.coverT),N.failed){v(`That painting would not open — try it again`,3600),N.earned=0,je();return}N.loaded&&c.titleMix>=1&&N.t>.8&&(Te(),N.phase=`card`,N.t=0)}else if(N.phase===`card`)c.titleMix=1,t.update(e,p,!1,0),Ue(0);else if(N.phase===`open`){c.titleMix=1-Dt(.25,1.65,N.t),t.update(e,p,!1,Dt(1,t.frame===`then`?t.leave?4.4:3.6:2.8,N.t));let n=t.frame===`then`,r=t.leave||[2.5,4.4];n?He(Dt(.3,1.9,N.t),Dt(r[0],r[1],N.t)):Ue(Dt(1,3.4,N.t)),N.t>=(n?r[1]:3.4)&&(N.phase=`play`,N.t=0,ve(`play`),p.clear())}else if(N.phase===`play`){c.titleMix=0;let n=t.update(e,p,!0,1);Ue(1),n&&ke(n)}else N.phase===`result`?(c.titleMix=0,t.update(e,p,!1,1),Ue(1)):N.phase===`close`?(c.titleMix=Math.max(N.mix0,Dt(0,.45,N.t)),t&&(t.update(e,p,!1,1),Ue(N.s)),N.t>=.55&&(Ae(),N.phase=`uncover`,N.t=0,ve(`leaving`),C(e))):N.phase===`uncover`&&(C(e),c.titleMix=1-Dt(.1,.8,N.t),N.t>=.85&&je())},M.frames=ae,M.begin=e=>{let t=Al(e);t&&we(t,null)},M.state=N,M}var Pl=()=>{window.va||(window.va=function(...e){window.vaq||(window.vaq=[]),window.vaq.push(e)})},Fl=`@vercel/analytics`,Il=`2.0.1`;function Ll(){return typeof window<`u`}function Rl(){return`production`}function zl(e=`auto`){e===`auto`?window.vam=Rl():window.vam=e}function Bl(){return(Ll()?window.vam:Rl())||`production`}function Vl(){return Bl()===`production`}function Hl(){return Bl()===`development`}function Ul(e,{[e]:t,...n}){return n}function Wl(e,t){if(!e)return;let n=e,r=[];for(let[i,a]of Object.entries(e))typeof a==`object`&&a&&(t.strip?n=Ul(i,n):r.push(i));if(r.length>0&&!t.strip)throw Error(`The following properties are not valid: ${r.join(`, `)}. Only strings, numbers, booleans, and null are allowed.`);return n}function Gl(e){return e.scriptSrc?ql(e.scriptSrc):Hl()?`https://va.vercel-scripts.com/v1/script.debug.js`:e.basePath?ql(`${e.basePath}/insights/script.js`):`/_vercel/insights/script.js`}function Kl(e,t){let n=e;if(t)try{n={...JSON.parse(t)?.analytics,...e}}catch{}zl(n.mode);let r={sdkn:Fl+(n.framework?`/${n.framework}`:``),sdkv:Il};return n.disableAutoTrack&&(r.disableAutoTrack=`1`),n.viewEndpoint&&(r.viewEndpoint=ql(n.viewEndpoint)),n.eventEndpoint&&(r.eventEndpoint=ql(n.eventEndpoint)),n.sessionEndpoint&&(r.sessionEndpoint=ql(n.sessionEndpoint)),Hl()&&n.debug===!1&&(r.debug=`false`),n.dsn&&(r.dsn=n.dsn),n.endpoint?r.endpoint=n.endpoint:n.basePath&&(r.endpoint=ql(`${n.basePath}/insights`)),{beforeSend:n.beforeSend,src:Gl(n),dataset:r}}function ql(e){return e.startsWith(`http://`)||e.startsWith(`https://`)||e.startsWith(`/`)?e:`/${e}`}function Jl(e={debug:!0},t){var n;if(!Ll())return;let{beforeSend:r,src:i,dataset:a}=Kl(e,t);if(Pl(),r&&((n=window.va)==null||n.call(window,`beforeSend`,r)),document.head.querySelector(`script[src*="${i}"]`))return;let o=document.createElement(`script`);o.src=i;for(let[e,t]of Object.entries(a))o.dataset[e]=t;o.defer=!0,o.onerror=()=>{let e=Hl()?`Please check if any ad blockers are enabled and try again.`:`Be sure to enable Web Analytics for your project and deploy again. See https://vercel.com/docs/analytics/quickstart for more information.`;console.log(`[Vercel Web Analytics] Failed to load script from ${i}. ${e}`)},document.head.appendChild(o)}function Yl(e,t,n){var r,i;if(!Ll()){let e="[Vercel Web Analytics] Please import `track` from `@vercel/analytics/server` when using this function in a server environment";if(Vl())console.warn(e);else throw Error(e)}else if(!t)(r=window.va)==null||r.call(window,`event`,{name:e,options:n});else try{let r=Wl(t,{strip:Vl()});(i=window.va)==null||i.call(window,`event`,{name:e,data:r,options:n})}catch(e){e instanceof Error&&Hl()&&console.error(e)}}var Xl=!1;function Zl(){if(!Xl){Xl=!0;try{Jl()}catch{}}}function Ql(e,t){if(Xl)try{Yl(e,t)}catch{}}var $l=`/api/leaderboard`,eu=e=>document.getElementById(e),tu=e=>fetch($l,{method:`POST`,headers:{"content-type":`application/json`},body:JSON.stringify(e),cache:`no-store`}),nu=new Map;function ru(e){let t=document.createElement(`span`);t.className=`pic`,t.textContent=(e.handle.replace(/_/g,``)[0]||`@`).toUpperCase();let n=e.handle.toLowerCase(),r=nu.get(n);if(r===!1)return t;let i=r?[r]:[];r||(e.avatar&&i.push(e.avatar.replace(/_400x400(\.\w+)$/,`_bigger$1`)),i.push(`https://unavatar.io/x/${encodeURIComponent(e.handle)}?fallback=false`));let a=new Image;return a.alt=``,a.decoding=`async`,a.referrerPolicy=`no-referrer`,a.onload=()=>{nu.set(n,a.src),t.appendChild(a)},a.onerror=()=>{let e=i.shift();e?a.src=e:nu.set(n,!1)},a.src=i.shift(),t}function iu({onAgain:e,onResume:t,onTop:n,onPlayers:r}){let i=eu(`board`),a=null,o=0,s=`view`,c=``,l=!1,u=-1e9,d=0;try{eu(`board-handle`).value=localStorage.getItem(`nightrider-handle`)||``}catch{}function f(e,t){let r=eu(`board-list`);r.textContent=``,e.slice(0,25).forEach((e,t)=>{let n=document.createElement(`li`);c&&e.handle.toLowerCase()===c.toLowerCase()&&(n.className=`me`);let i=document.createElement(`a`);i.className=`row-link`,i.href=`https://x.com/${encodeURIComponent(e.handle)}`,i.target=`_blank`,i.rel=`noopener noreferrer`,i.title=`@${e.handle} on X`;let a=document.createElement(`span`);a.className=`rank`,a.textContent=String(t+1);let o=document.createElement(`span`);o.className=`who`,o.textContent=`@${e.handle}`;let s=document.createElement(`span`);s.className=`pts`,s.textContent=Number(e.score).toLocaleString(),i.append(a,ru(e),o,s),n.appendChild(i),r.appendChild(n)}),eu(`board-empty`).classList.toggle(`hidden`,e.length>0),eu(`board-count`).textContent=t>e.length?`${t.toLocaleString()} riders on the board`:``,e.length&&n&&n(Number(e[0].score))}async function p(){if(performance.now()-u<9e4)return!0;try{let e=await fetch($l,{cache:`no-store`});if(!e.ok)return!1;let t=await e.json();return f(t.top||[],t.count||0),typeof t.players==`number`&&r&&r(t.players),!0}catch{return!1}}function m(e,t=!1){let n=eu(`board-msg`);n.textContent=e,n.classList.toggle(`bad`,t)}async function h(){if(l||s!==`finish`)return;let e=eu(`board-handle`).value.trim().replace(/^@+/,``);if(!/^[A-Za-z0-9_]{1,15}$/.test(e))m(`An X handle is 1–15 letters, digits or underscores.`,!0),eu(`board-handle`).focus();else{l=!0,eu(`board-post`).disabled=!0,m(`Posting…`);try{a||await _.start();let t=await tu({handle:e,score:o,token:a}),n=await t.json().catch(()=>({}));if(!t.ok||!n.ok){m(n.message||`The score could not be posted. Try again in a moment.`,!0);return}c=n.handle,u=performance.now(),Ql(`score_posted`,{score:o}),eu(`board-handle`).value=c;try{localStorage.setItem(`nightrider-handle`,c)}catch{}f(n.top||[],n.count||0),m(n.best>o?`Posted. Your best stays ${n.best.toLocaleString()} — number ${n.rank} on the board.`:`Posted — you are number ${n.rank} on the board.`),i.classList.add(`posted`)}catch{m(`The leaderboard could not be reached. Check your connection and try again.`,!0)}finally{l=!1,eu(`board-post`).disabled=!1}}}let g=()=>s===`finish`?t():_.close();eu(`board-form`).addEventListener(`submit`,e=>{e.preventDefault(),h()}),eu(`board-again`).addEventListener(`click`,()=>{_.close(),e()}),eu(`board-back`).addEventListener(`click`,g),i.addEventListener(`click`,e=>{e.target===i&&s===`view`&&_.close()}),eu(`board-handle`).addEventListener(`keydown`,e=>{e.stopPropagation(),e.key===`Escape`&&g()}),eu(`board-handle`).addEventListener(`keyup`,e=>e.stopPropagation());let _={get open(){return!i.classList.contains(`hidden`)},async start(){let e=++d;a=null;for(let t=0;t<4&&e===d;t++){try{let t=!1;try{t=!localStorage.getItem(`nightrider-rode`)}catch{}let n=await tu(t?{action:`start`,first:!0}:{action:`start`});if(n.ok){let i=await n.json(),o=i.token;if(o&&e===d&&(a=o),t&&o)try{localStorage.setItem(`nightrider-rode`,`1`)}catch{}typeof i.players==`number`&&r&&r(i.players)}}catch{}if(a)return;await new Promise(e=>setTimeout(e,4e3))}},refresh:p,show(e,t=0){s=e,o=Math.max(0,Math.floor(t)),i.classList.remove(`hidden`,`posted`),i.classList.toggle(`finish`,s===`finish`),eu(`board-score`).textContent=o.toLocaleString(),eu(`board-title`).textContent=s===`finish`?`Ride complete`:`Leaderboard`,eu(`board-back`).textContent=s===`finish`?`Continue riding`:`Close`,m(``),p(),s===`finish`&&setTimeout(()=>eu(`board-handle`).focus(),60)},close(){i.classList.add(`hidden`)}};return p(),setInterval(()=>{document.hidden||p()},12e4),_}var au=1.25,ou=5.2,su=2.1,cu=`
attribute float aPart;
uniform float uBend;
uniform vec3 uBendCenter;
varying vec2 vUv;
varying float vPart;
varying vec3 vN;
varying vec3 vW;
void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vW = wp.xyz;
  vN = normal;
  vec2 dxz = wp.xz - uBendCenter.xz;
  wp.y += uBend * dot(dxz, dxz);            // (the valley curls up with distance, like everything else in it)
  vUv = uv;
  vPart = aPart;
  gl_Position = projectionMatrix * viewMatrix * wp;
}
`,lu=`
precision highp float;
uniform float uTime;
uniform float uAlive;
uniform float uGain;
varying vec2 vUv;
varying float vPart;
varying vec3 vN;
varying vec3 vW;
void main() {
  vec3 gold = vec3(1.0, 0.66, 0.16);
  float a, cover;
  if (vPart < 0.5) {
    // the shaft: lit dust, brightest where the eye looks through most of it
    vec2 v = normalize(cameraPosition.xz - vW.xz);
    float thick = pow(abs(dot(normalize(vN.xz), v)), 1.25);
    float up = vUv.y;
    float fall = pow(1.0 - up, 0.8) * smoothstep(0.0, 0.03, up);
    float th = vUv.x * 6.2831853;
    float s1 = 0.5 + 0.5 * sin(th * 5.0 + up * 7.0 - uTime * 2.6);
    float s2 = 0.5 + 0.5 * sin(th * 9.0 - up * 11.0 + uTime * 1.7);
    float motes = pow(0.5 + 0.5 * sin(th * 17.0 + up * 31.0 - uTime * 4.0), 8.0);
    float heart = pow(thick, 5.0);                       // a white-hot core down the middle
    a = thick * fall * (0.62 + 0.38 * s1 * s2 + 0.6 * motes);
    gold = mix(gold, vec3(1.0, 0.93, 0.66), 0.75 * heart * fall);
    a *= 1.0 + 1.1 * heart;
    cover = 0.5;
  } else {
    // the rosette on the floor: two rings, eight turning petals, a hot heart
    float r = length(vUv);
    if (r > 1.0) discard;
    float th = atan(vUv.y, vUv.x);
    float ring = smoothstep(0.075, 0.0, abs(r - 0.9)) + 0.8 * smoothstep(0.05, 0.0, abs(r - 0.62 - 0.035 * sin(uTime * 2.2)));
    float petals = pow(abs(cos(th * 4.0 + uTime * 0.45)), 5.0) * smoothstep(0.9, 0.34, r) * smoothstep(0.06, 0.3, r) * 0.7;
    float rays = pow(abs(cos(th * 4.0 - uTime * 0.3 + 0.39)), 30.0) * smoothstep(0.62, 0.2, r) * 0.6;
    float core = exp(-r * r * 5.0) * 1.1;
    float wash = smoothstep(1.0, 0.5, r) * 0.22;         // the pool of light it stands in
    a = ring + petals + rays + core + wash;
    cover = 0.62;
  }
  // (laid over the picture rather than only added to it: on the pale stone of
  // a nave a purely additive light would not read as gold at all)
  float k = mix(0.25, 1.0, uAlive);
  gl_FragColor = vec4(gold * a * 2.1 * uGain * k, clamp(a * cover, 0.0, 0.9) * k);
}
`;function uu(e){let t=[],n=[],r=[],i=[],a=[];for(let e=0;e<=40;e++){let a=e/40*Math.PI*2,o=Math.cos(a),s=Math.sin(a);t.push(o*au,.02,s*au,o*au*.82,ou,s*au*.82),n.push(o,0,s,o,0,s),r.push(e/40,0,e/40,1),i.push(0,0)}for(let e=0;e<40;e++){let t=e*2;a.push(t,t+1,t+2,t+2,t+1,t+3)}let o=t.length/3;for(let[e,a]of[[-1,-1],[1,-1],[1,1],[-1,1]])t.push(e*su,.05,a*su),n.push(0,1,0),r.push(e,a),i.push(1);a.push(o,o+1,o+2,o,o+2,o+3);let s=new I;s.setAttribute(`position`,new j(t,3)),s.setAttribute(`normal`,new j(n,3)),s.setAttribute(`uv`,new j(r,2)),s.setAttribute(`aPart`,new j(i,1)),s.setIndex(a);let c={value:1},l=new F({vertexShader:cu,fragmentShader:lu,uniforms:{uTime:e.uTime,uBend:e.uBend,uBendCenter:e.uBendCenter,uAlive:e.uAlive,uGain:c},blending:5,blendEquation:100,blendSrc:201,blendDst:205,depthWrite:!1,transparent:!0,side:2}),u=new P(s,l);u.frustumCulled=!1,u.renderOrder=61,u.visible=!1;let d=null,f=0,p=0,m=!1,h=0,g=[],_={at:null,entered:!1,near:!1};return{group:u,update(e,t){if(p-=e,p<=0){p=.4,g.length=0,$s(t.gx,t.gz,3,g);let e=null,n=1e9;for(let r of g){if(r.type!==`steeple`)continue;let i=Math.hypot(r.gx-t.gx,r.gz-t.gz);i<n&&(n=i,e=r)}e&&(!d||e.key!==d.key)?(d=e,f=Pt(d.sx,d.sz),u.position.set(Bt(d.sx,d.sz),f,G(d.sx,d.sz)),m=!1):e||(d=null),u.visible=!!d}if(_.at=d,_.entered=!1,_.near=!1,d){let n=t.gx-d.sx,r=t.gz-d.sz,i=t.y<f+3.5,a=n*n+r*r<6.25&&i;_.entered=a&&!m,m=a,_.near=i&&n*n+r*r<49,h=K(h,+!!a,a?12:1.6,e)}return c.value=1+1.3*h,_}}}Zl();var du=new URLSearchParams(location.search),Y=e=>document.getElementById(e),fu=``;function pu(e){let t=Y(`fatal`);t.textContent=e,t.classList.remove(`hidden`),Y(`loading`).classList.add(`done`)}var mu=Y(`gl`),hu;try{hu=new ua({canvas:mu,antialias:!1,alpha:!1,depth:!1,stencil:!1,powerPreference:`high-performance`})}catch(e){throw pu(`This painting needs WebGL 2 — your browser could not start it.`),e}hu.outputColorSpace=b,hu.autoClear=!1,hu.setClearColor(0,1);var gu=da(),_u=new re,vu=new ne(60,1,.25,2600);vu.rotation.order=`YXZ`;var yu=Ea(gu);_u.add(yu.mesh);var bu=Va(gu);_u.add(bu.group),gu.uMoonDir.value.copy(yu.moonDir);var xu=new lo(hu),Su=new Ee,Cu=(e,{mips:t=!0}={})=>new Promise((n,r)=>{Su.load(fu+e,e=>{e.colorSpace=``,e.wrapS=e.wrapT=Ce,e.generateMipmaps=t,e.minFilter=t?d:T,e.magFilter=T,e.anisotropy=t?hu.capabilities.getMaxAnisotropy():1,n(e)},void 0,()=>r(Error(`could not load ${e}`)))}),wu,Tu,Eu,Du,Ou;try{[wu,Tu,Eu,Du,Ou]=await Promise.all([Cu(bo.small?`painting-s.webp`:`painting.webp`),Cu(bo.small?`sky-s.webp`:`sky.webp`),Cu(`flow.png`,{mips:!1}),Cu(`cypress.png`),Cu(`fill.png`)])}catch(e){throw pu(`The canvas could not be loaded. Check your connection and reload.`),e}yu.setCanvas(Tu,Eu,Ou),gu.tCanvas.value=wu,xu.composite.uniforms.tPainting.value=wu;var ku=eo(gu,wu,Du);_u.add(ku);var Au=po(gu),ju=po(gu,{dynamic:!0}),Mu=_o(gu),Nu=po(gu,{walker:!0}),Pu=new To(_u,Au,Mu,Nu);xu.depthMaterial=bo.touch?null:mo(gu);var X=new Bs,Fu=ys(gu,ju,Mu);_u.add(Fu.root);var Iu=null,Lu={first:!1,seat:null},Ru=null,zu=al({scene:_u,shared:gu,glowMat:Mu,paintMat:po(gu,{dynamic:!0}),url:Kt,models:bo.touch?5:8,groundAt:(e,t)=>X.groundAt(e,t),lampAt:(e,t,n)=>Pu.nearestLamp(e,t,n),status:()=>({theater:Z.theater,carried:Q.points,world:Ru?Ru.world:0}),onLost:(e,t)=>{Q.points=Math.max(0,Q.points-e),Yu.burst(X.wx,X.y+1.1,X.wz,16),Sd(`${Ku(t,!0)} rider knocked ${e.toLocaleString()} loose — grab them back!`,3800),Ql(`knocked_loose`,{n:e})},onKnocked:(e,t)=>{$.cheerT=1.2,Sd(`You knocked ${e.toLocaleString()} loose from ${Ku(t).toLowerCase()} rider — grab them!`,3400),Ql(`knock`,{n:e})},onBump:(e,t)=>{$.grabT=.45,$.grabSide=e,qu.shake=Math.max(qu.shake,.5),Xu.bump(9),Yu.burst(t.x,t.y,t.z,9)},onBumped:e=>{X.bail=Math.max(X.bail,.8),X.speed*=.75,X.heading-=e*.16,qu.shake=Math.max(qu.shake,.85),Xu.bail(),Yu.burst(X.wx,X.y+1,X.wz,12)},onSaid:(e,t,n,r)=>{Vu.heard(r?Bu:e,t,n,r),r||Xu.jump()},onUnsaid:()=>Sd(`That line was not passed on`,2600),onGot:(e,t)=>{Q.points+=e;let n=Y(`stars`);n.classList.add(`on`,`bump`),setTimeout(()=>n.classList.remove(`bump`),160),Xu.orb(++Q.streak),Q.streakT=3.4,t&&Yu.burst(t.x,t.y,t.z,7)}}),Bu=-1,Vu=cl({box:Y(`chat`),layer:Y(`bubbles`),camera:vu,shared:gu,where:(e,t)=>e===Bu?t.set(X.wx,X.y+2.25,X.wz):typeof e==`string`?Gu.where(e,t):zu.where(e,t),send:e=>{Z.joined=!0,zu.say(e)?Ql(`chat`):Sd(`The other riders cannot be reached just now`,2600)},onOpen:e=>{if(Y(`hud`).classList.toggle(`chatting`,e),!e)Gu.leave();else{Ju.clear();for(let e of document.querySelectorAll(`#hint kbd.down`))e.classList.remove(`down`)}},onMute:()=>Sd(`You will not hear that rider again this ride`,3e3)}),Hu=[],Uu=new R,Wu=[`north`,`north-east`,`east`,`south-east`,`south`,`south-west`,`west`,`north-west`],Gu=Sl({world:Pu,time:()=>Z.time,quiet:()=>Xu.muted,town:()=>{Hu.length=0,$s(X.gx,X.gz,5,Hu);for(let e of Hu)e._m=Math.hypot(e.wx-X.wx,e.wz-X.wz);return{sights:Hu.sort((e,t)=>e._m-t._m).slice(0,5).map(e=>({name:e.name,type:e.type,m:Math.round(e._m),way:Wu[Math.round(Math.atan2(e.wx-X.wx,-(e.wz-X.wz))/(Math.PI/4)+8)%8]})),going:Yu.target?Yu.target.name:``,carried:Math.round(Q.points),others:Math.max(0,zu.count-1)}},show:(e,t,n={})=>Vu.heard(e,42,t,!1,{...n,plain:!0}),onNear:e=>{Y(`talk-tip`).classList.toggle(`on`,!1),e&&(Y(`talk-who`).textContent=`talk to ${e}`)},onError:e=>Sd(e,3e3),onUnheard:()=>Sd(`Sound is off — press M to hear the townsfolk`,4200),seen:(e,t,n)=>{let r=e-vu.position.x,i=n-vu.position.z;return Uu.set(e,t+gu.uBend.value*(r*r+i*i),n).project(vu),Uu.z>-1&&Uu.z<1&&Math.abs(Uu.x)<.86&&Uu.y>-.9&&Uu.y<.8}});{Y(`btn-chat`).style.display=`none`,document.querySelector(`#hint [data-code="Enter"]`)?.remove();let e=document.querySelector(`#hint [data-code="KeyR"]`);e&&(e.classList.add(`blank`),delete e.dataset.code)}function Ku(e){for(let[t,n]of[[15,`A red`],[40,`An orange`],[65,`A yellow`],[150,`A green`],[190,`A teal`],[250,`A blue`],[290,`A violet`],[335,`A pink`],[360,`A red`]])if(e<t)return n;return`A red`}var qu=new Hs,Ju=Us(mu),Yu=Sc(Mu);_u.add(Yu.mesh);var Xu=Dc(),Zu=zc(ju);_u.add(Zu.group);var Qu=uu(gu);_u.add(Qu.group);var $u=Rc(Y(`map`),{onPick:e=>Wd(e),onNext:()=>{let e=$u.cycle(Yu);e&&Wd(e)}}),Z={state:`title`,doneT:0,time:0,diveT:0,rideT:0,titleMix:1,alive:0,reveal:0,quality:Ut(parseFloat(du.get(`q`)||`1`),.4,2),view:{W:1,H:1,hole:{cx:0,cy:0,w:1,h:1}},loading:!0},ed={pos:new R(_t.camWorld.x,_t.camY,_t.camWorld.z),yaw:0,pitch:qt.pitch};ku.position.copy(ed.pos),ku.rotation.order=`YXZ`,ku.rotation.set(ed.pitch,ed.yaw,0);var td=new R(0,Math.sin(qt.pitch),-Math.cos(qt.pitch)),nd={gx:_t.church.gx,gz:_t.church.gz-60};function rd(){if(Iu&&Iu.on)return;let e=window.innerWidth,t=window.innerHeight;Z.view.W=e,Z.view.H=t;let n=Math.sqrt((bo.touch?17e5:33e5)/(e*t)),r=Math.min(window.devicePixelRatio||1,n,2)*Z.quality;hu.setPixelRatio(r),hu.setSize(e,t,!1),xu.setSize(e*r,t*r);let i=Ut(t*.2+18,146,208),a=Math.min(t*.95-i,t*.78),o=a*qt.aspect;o>e*.86&&(o=e*.86,a=o/qt.aspect);let s=Ut(o*.034,10,34);a-=2*s,o=a*qt.aspect;let c=a+2*s+i,l=Math.max(t*.03,(t-c)/2),u=e/2,d=l+s+a/2;Z.view.hole={cx:u,cy:d,w:o,h:a,b:s},xu.composite.uniforms.uHole.value.set((u-o/2)/e,1-(d+a/2)/t,(u+o/2)/e,1-(d-a/2)/t);let f=e=>`${e.toFixed(1)}px`,p={l:u-o/2-s,t:d-a/2-s,w:o+2*s,h:a+2*s},m=Y(`frame`),h=Y(`frame-shadow`),g=Y(`frame-lip`),_=Y(`wall`),v=Y(`plaque`);for(let e of[m,h])e.style.left=f(p.l),e.style.top=f(p.t),e.style.width=f(p.w),e.style.height=f(p.h);m.style.borderWidth=f(s),g.style.left=f(u-o/2),g.style.top=f(d-a/2),g.style.width=f(o),g.style.height=f(a),_.style.transformOrigin=`${f(u)} ${f(d)}`;let y=p.l+p.w,b=p.t+p.h;_.style.clipPath=`polygon(evenodd, 0 0, 100% 0, 100% 100%, 0 100%, 0 0, ${f(p.l)} ${f(p.t)}, ${f(p.l)} ${f(b)}, ${f(y)} ${f(b)}, ${f(y)} ${f(p.t)}, ${f(p.l)} ${f(p.t)})`,v.style.top=f(b+Ut(t*.026,12,28))}function id(e,t){let{W:n,H:r}=Z.view,i=2*Math.max(t,r-t);vu.fov=2*Math.atan(i/2/e)/Ct,vu.aspect=n/i,Math.abs(i-r)<.5?vu.clearViewOffset():vu.setViewOffset(n,i,0,i/2-t,n,r),vu.updateProjectionMatrix()}var ad=()=>Z.view.hole.h/2/qt.tanV,od=e=>Z.view.H/2/Math.tan(e*Ct/2);window.addEventListener(`resize`,rd),rd();var sd=.15,cd=8.2,ld=12,ud=45;function dd(){if(Z.state!==`title`||Z.loading)return;Z.state=`dive`,Z.diveT=0,Z.joined=!1;let e=Y(`gallery`);e.classList.add(`leaving`),clearTimeout(md),md=setTimeout(()=>{(Z.state===`dive`||Z.state===`ride`)&&e.classList.add(`gone`)},2100),X.reset(),X.auto=!0,X.autoSpeed=0,qu.snap(X),Ju.clear(),Xu.start(),Yd.start(),Ql(`ride_start`,{device:bo.small?`phone`:bo.touch?`tablet`:`desktop`}),wd(),Yu.reset(),Yu.start({gx:X.gx,gz:jd,heading:X.heading}),Y(`guide-label`).textContent=Yu.target.name}var fd=2.1,pd={top:new R,far:!0,speed:0,stage:0},md=0;function hd(){if(Z.state===`ride`||Z.state===`done`||Z.state===`dive`){if(Yd.close(),vd(),Z.theater&&Vd(!1),Y(`hud`).classList.add(`hidden`),clearTimeout(md),Z.state===`dive`)pd.top.copy(ed.pos),pd.far=!1,pd.speed=0;else{let e=X.gx,t=X.gz+62;pd.top.set(Bt(e,t),Math.max(Pt(e,t)+20,X.y+26),G(e,t)),pd.far=!0,pd.speed=Math.min(X.speed,bs),Z.diveT=8.35}pd.stage=0,X.auto=!0,Ju.clear(),Z.state=`rise`}}function gd(){Z.state=`title`,Z.titleMix=1,Z.alive=0,Z.reveal=0,Y(`gallery`).classList.remove(`gone`,`leaving`),X.reset(),X.auto=!0,X.autoSpeed=0,Ju.clear(),Yu.reset(),wd()}function _d(){$.finishT=14,$.briefT=0,Y(`brief`).classList.remove(`on`),Y(`finish-score`).textContent=Q.banked.toLocaleString(),Y(`finish`).classList.add(`on`)}function vd(){$.finishT=0,Y(`finish`).classList.remove(`on`),document.activeElement&&document.activeElement!==document.body&&document.activeElement.blur()}function yd(){Z.state===`ride`&&(Ql(`ride_finish`,{score:Math.round(Q.banked),minutes:Math.round(Z.rideT/6)/10}),Z.state=`done`,Z.doneT=0,X.auto=!0,X.autoSpeed=0,Ju.clear(),vd(),Y(`hud`).classList.add(`hidden`),Xu.arrive(),Yd.show(`finish`,Q.banked))}function bd(){Yd.close(),Z.state===`done`&&(Z.state=`ride`,X.auto=!1,Ju.clear(),Ju.lookYaw=$d.lookYaw,Ju.lookPitch=$d.lookPitch,Ju.lastLook=-10,Y(`hud`).classList.remove(`hidden`))}Y(`finish-yes`).addEventListener(`click`,yd),Y(`finish-no`).addEventListener(`click`,vd),Y(`open-board`).addEventListener(`click`,()=>Yd.show(`view`)),Y(`enter`).addEventListener(`click`,dd),mu.addEventListener(`click`,()=>{Z.state===`title`&&dd()}),Y(`btn-gallery`).addEventListener(`click`,hd),window.addEventListener(`keydown`,e=>{Z.state===`realm`?Ru&&Ru.key(e)&&e.preventDefault():Yd.open?e.code===`Escape`&&(Z.state===`done`?bd():Yd.close()):(e.code===`Enter`&&Z.state===`title`?dd():e.code===`Enter`&&Z.state===`ride`&&$.finishT>0&&yd(),e.code===`Escape`&&(Z.state===`ride`&&$.finishT>0?vd():hd()))});var xd=0;function Sd(e,t=4200,n=!1){if(Z.theater&&!n)return;let r=Y(`toast`);r.textContent=e,r.classList.add(`on`),clearTimeout(xd),xd=setTimeout(()=>r.classList.remove(`on`),t)}var Q={points:0,shown:0,banked:0,bankShown:0,caught:0,streak:0,streakT:0,mult:1,strayToast:!1,meter:0,skyGain:1},$={cheerT:0,grabT:0,grabSide:0,look:0,trickT:0,briefT:0,finishT:0,hints:{}},Cd={fill:``,mult:0,dist:``,hl:``};function wd(){Object.assign(Q,{points:0,shown:0,banked:0,bankShown:0,caught:0,streak:0,streakT:0,mult:1,meter:0}),Y(`star-count`).textContent=`0`,Y(`bank-count`).textContent=`0`,Cd.mult=0;for(let e of[`stars`,`mult`,`guide`,`bank`,`hyper`,`trick`,`brief`,`finish`])Y(e).classList.remove(`on`,`live`);$.finishT=0,Td()}function Td(){let e=Math.min(Q.caught,160);Q.skyGain=1+e*.0045,gu.uGlow.value=1+e*.002}function Ed(e){Q.points+=Math.round(e*(X.hyper>0?2:1));let t=Y(`stars`);t.classList.add(`on`,`bump`),setTimeout(()=>t.classList.remove(`bump`),160)}function Dd(e){X.hyper<=0&&(Q.meter=Math.min(1,Q.meter+e))}function Od(e,t,n=``){let r=Y(`trick`);Y(`trick-name`).textContent=e,Y(`trick-points`).textContent=t,r.className=`on ${n}`,$.trickT=n===`live`?.25:2.6}function kd(e,t){let n=Q.points;Q.banked+=n+t,Q.points=0,Y(`bank`).classList.add(`on`),Xu.deliver(),$.cheerT=1.8,Jd.report(Q.banked);let r=e.home?`the steeple of the Starry Night`:`the steeple of ${e.name}`;Sd(n>0?`${n.toLocaleString()} delivered to ${r}${t?`  +${t}`:``}`:`${r[0].toUpperCase()}${r.slice(1)}${t?`  +${t}`:``}`,5600)}function Ad(){Y(`btn-sound`).classList.toggle(`off`,Xu.muted)}Y(`btn-sound`).addEventListener(`click`,()=>{Xu.toggle(),Ad()}),window.addEventListener(`keydown`,e=>{e.code===`KeyM`&&(Xu.toggle(),Ad())}),window.addEventListener(`keydown`,e=>{e.code===`Enter`&&!e.repeat&&!e.metaKey&&!e.ctrlKey&&!e.altKey&&Z.state===`ride`&&$.finishT<=0&&!Yd.open&&e.preventDefault()}),Y(`btn-chat`).addEventListener(`pointerdown`,e=>e.preventDefault()),window.addEventListener(`keydown`,e=>{e.code!==`KeyR`||e.repeat||e.metaKey||e.ctrlKey||e.altKey||e.preventDefault()}),Y(`talk-tip`).addEventListener(`pointerdown`,e=>e.preventDefault()),Y(`talk-tip`).addEventListener(`click`,()=>void 0),Y(`btn-chat`).addEventListener(`click`,()=>{Vu.open&&Vu.show(!1)});{let e={ArrowUp:`KeyW`,ArrowLeft:`KeyA`,ArrowDown:`KeyS`,ArrowRight:`KeyD`,ShiftLeft:`KeyE`,ShiftRight:`KeyE`},t=new Map;for(let e of document.querySelectorAll(`#hint [data-code]`))t.set(e.dataset.code,e);let n=(n,r)=>{if(r&&Vu.open)return;let i=t.get(e[n.code]||n.code);i&&i.classList.toggle(`down`,r)};window.addEventListener(`keydown`,e=>{n(e,!0),e.code!==`KeyC`&&e.code!==`KeyH`||e.repeat||e.metaKey||e.ctrlKey||e.altKey||Z.state!==`ride`||Vu.open||(clearTimeout(tf),Y(`hint`).classList.toggle(`faded`))}),window.addEventListener(`keyup`,e=>n(e,!1)),window.addEventListener(`blur`,()=>{for(let e of t.values())e.classList.remove(`down`)})}Ad();var jd=10,Md=[],Nd=0;function Pd(){if(Z.state!==`ride`||X.wings||X.walking)return;let e=performance.now();for(Md.push(e);Md.length&&e-Md[0]>1100;)Md.shift();Md.length>=3&&(Md.length=0,X.wings=!0,X.takeOff(11),Xu.wings(),Ql(`wings`),Sd(`Wings!  Hold SPACE to fly`,5200))}window.addEventListener(`keydown`,e=>{e.code===`Space`&&!e.repeat&&Pd()}),Y(`pad-jump`).addEventListener(`pointerdown`,()=>Pd()),Ju.onLeap=()=>{Z.state===`title`&&!Yd.open?dd():Pd()};var Fd=!1;function Id(){Fd||Z.state!==`ride`||(Fd=!0,Ql(`controller`),Sd(`Controller — A leap (×3 fly) · RT pedal · LT brake · X tricks · B walk · Y theater`,6500,!0))}window.addEventListener(`gamepadconnected`,()=>Id());var Ld=new R,Rd=!1;function zd(){Z.state!==`ride`||Yd.open||$.finishT>0||X.setWalking(!X.walking)&&(Y(`btn-walk`).classList.toggle(`on`,X.walking),X.walking&&!Rd&&(Rd=!0,Ql(`on_foot`),Sd(bo.touch?`On foot — the same button to ride again`:`On foot — E runs · leap at a wall and hold W to climb it · F to ride again`,4600)))}window.addEventListener(`keydown`,e=>{e.code!==`KeyF`||e.repeat||e.metaKey||e.ctrlKey||e.altKey||zd()}),Y(`btn-walk`).addEventListener(`click`,e=>{zd(),e.currentTarget.blur()});var Bd=0;function Vd(e){Z.theater=e,Y(`hud`).classList.toggle(`theater`,e),Y(`btn-theater`).classList.toggle(`on`,e),Yu.mesh.visible=Zu.group.visible=Qu.group.visible=!e,e?(vd(),$.briefT=0,Y(`brief`).classList.remove(`on`),Ql(`theater`),Sd(bo.touch?`Theater mode — tap the moon to bring the game back`:`Theater mode — T to bring the game back`,3200,!0)):Y(`toast`).classList.remove(`on`)}function Hd(){Z.state===`ride`&&!Yd.open&&Vd(!Z.theater)}window.addEventListener(`keydown`,e=>{e.code!==`KeyT`||e.repeat||e.metaKey||e.ctrlKey||e.altKey||Yd.open||Hd()}),Y(`btn-theater`).addEventListener(`click`,e=>{Hd(),e.currentTarget.blur()}),window.addEventListener(`mousemove`,()=>{Z.theater&&(Y(`hud`).classList.add(`peek`),clearTimeout(Bd),Bd=setTimeout(()=>Y(`hud`).classList.remove(`peek`),2200))});var Ud=e=>e.type===`steeple`&&!e.home?`the steeple of ${e.name}`:e.name;function Wd(e){Z.state===`ride`&&Yu.choose(e,X)&&(Y(`guide-label`).textContent=e.name,Sd(`To ${Ud(e)} — follow the orbs`,3400),Xu.jump())}window.addEventListener(`keydown`,e=>{if(e.code!==`Tab`||Yd.open||(e.preventDefault(),Z.state!==`ride`||e.repeat))return;let t=$u.cycle(Yu);t&&Wd(t)});function Gd(e){let t=Z.state===`ride`&&!Z.theater,n=Yu.update(e,Z.time,X,t);if(n.orbs){for(let e=0;e<n.orbs;e++)Q.streak++,Q.mult=Math.min(5,1+Math.floor(Q.streak/6)),Ed(10*Q.mult),Xu.orb(Q.streak),Q.streak%12==0&&($.cheerT=.9);Q.caught+=n.orbs,Q.streakT=3.4,Dd(.014*n.orbs),$.grabT=.2,$.grabSide=n.side,Td()}if(n.strays&&(Ed(50*Q.mult*n.strays),Q.caught+=3*n.strays,Q.streak+=2,Q.streakT=3.4,Dd(.07*n.strays),Xu.star(),Td(),Q.strayToast||(Q.strayToast=!0,Sd(`A stray star from the rooftops  +50`))),n.prisms&&(Ed(150*Q.mult*n.prisms),Q.caught+=5*n.prisms,Q.streakT=3.4,Dd(.16*n.prisms),Xu.prism(),$.cheerT=.8,Td(),n.prismAll?(Ed(400),Sd(`${n.prismAll.name} — all three prisms  +400`,4200)):Sd(`A prism  +${150*Q.mult}`,2400)),n.arrived){let e=Yu.target,t=e.seen?0:e.type===`steeple`?500*Math.min(Yu.leg,6):250;Q.caught+=12,Td(),Xu.arrive(),e.type===`steeple`?kd(e,t):(t&&Ed(t),$.cheerT=1.4,Sd(t?`${e.name}  +${t}`:e.name,4600))}if(n.found){let e=n.found;Q.caught+=4,Td(),Xu.star(),e.type===`steeple`?kd(e,250):(Ed(150),e.type!==`cafe`&&e.type!==`gallery`&&Sd(`${e.name} — found  +150`,3600))}let r=Qu.update(e,X);if(t&&r.entered&&(Q.points>0&&kd(r.at,0),Q.banked>0&&_d()),$.finishT>0&&($.finishT-=e,r.near&&($.finishT=Math.max($.finishT,1.5)),($.finishT<=0||!t)&&vd()),n.courseOrbs){for(let e=0;e<n.courseOrbs;e++)Q.streak++,Q.mult=Math.min(5,1+Math.floor(Q.streak/6)),Ed(25*Q.mult),Xu.orb(Q.streak);Q.caught+=n.courseOrbs,Q.streakT=3.4,Dd(.02*n.courseOrbs),Td()}if(n.course){let e=e=>e===`cafe`?`The Night Café`:e===`church`?`The nave`:`The Gallery`;n.course.entered&&n.course.fresh&&!n.arrived?Sd(`${e(n.course.entered)} — interior course unlocked`,3600):n.course.cleared&&(Ed(300),Xu.star(),Sd(`${e(n.course.cleared)} cleared  +300`,4200))}if(Yu.arrivedFor>4.2&&t){Yu.start(X);let e=Yu.target;Y(`guide-label`).textContent=e.name,Sd(`Next: ${Ud(e)} — carry your orbs there`)}if(X.trick&&Z.theater)X.trick.clean?Xu.trick(X.trick.points):Xu.bail(),X.trick=null;else if(X.trick){let e=X.trick;e.clean?(Ed(e.points),Dd(e.points/430+.05*e.combo),Od(e.names.join(` + `),`+${(e.points*(X.hyper>0?2:1)).toLocaleString()}`,e.combo>1?`combo`:``),Xu.trick(e.points),$.cheerT=1.1):(Od(e.names.length?`${e.names.join(` + `)} — bailed`:`Bailed`,``,`bail`),Xu.bail()),X.trick=null}else if(t&&!X.grounded&&!X.wings&&X.airTime>.3){let e=X.peek();e.length&&Od(e.join(` + `),``,`live`)}$.trickT>0&&($.trickT-=e,$.trickT<=0&&Y(`trick`).classList.remove(`on`)),t&&Q.meter>=1&&X.hyper<=0&&X.grounded&&!X.hall&&!X.walking&&(Q.meter=0,X.hyper=ks,Xu.hyper());{let n=Y(`hyper`),r=X.hyper>0;n.classList.toggle(`on`,t&&(r||Q.meter>.03)),n.classList.toggle(`live`,r);let i=`scaleX(${(r?X.hyper/ks:Q.meter).toFixed(3)})`;i!==Cd.fill&&(Cd.fill=i,Y(`hyper-fill`).style.transform=i),r&&X.grounded&&X.speed>6&&Math.random()<e*34&&Yu.emit(X.wx-X.fx*.75,X.y+.12+Math.random()*.3,X.wz-X.fz*.75,1,.3)}if($.cheerT=Math.max(0,$.cheerT-e),$.grabT=Math.max(0,$.grabT-e),$.look=0,t&&Yu.trail.length&&Yu.arrivedFor<0){let e=Yu.trail[Math.min(Yu.trail.length-1,Yu.progress+1)],t=e.gx-X.gx,n=e.gz-X.gz;if(t*t+n*n<2025){let e=Math.atan2(n,t)-X.heading;$.look=Math.atan2(Math.sin(e),Math.cos(e))}}t&&$.briefT>0&&($.briefT-=e,($.briefT<=0||$.briefT<6.5&&(Ju.jumpPressed||Ju.throttle>0))&&($.briefT=0,Y(`brief`).classList.remove(`on`))),Q.streakT>0&&(Q.streakT-=e,Q.streakT<=0&&(Q.streak=0,Q.mult=1));let i=Y(`mult`);if(i.classList.toggle(`on`,Q.mult>1),Q.mult>1&&Q.mult!==Cd.mult&&(Cd.mult=Q.mult,i.textContent=`×${Q.mult}`),Q.shown!==Q.points){let t=Q.points-Q.shown;Q.shown+=t>0?Math.ceil(t*Math.min(1,e*9)):Math.floor(t*Math.min(1,e*5)),Y(`star-count`).textContent=Q.shown.toLocaleString()}Q.bankShown!==Q.banked&&(Q.bankShown+=Math.ceil((Q.banked-Q.bankShown)*Math.min(1,e*5)),Y(`bank-count`).textContent=Q.bankShown.toLocaleString());let a=Y(`guide`);if(a.classList.toggle(`on`,t&&!!Yu.target),t&&Yu.target){vu.getWorldDirection(Ld);let e=Yu.info.bearing-Math.atan2(Ld.z,Ld.x);e=Math.atan2(Math.sin(e),Math.cos(e)),Y(`guide-arrow`).style.transform=`rotate(${e.toFixed(3)}rad)`;let t=Yu.arrivedFor>=0?`reached`:`${Math.round(Yu.info.dist)} m`;t!==Cd.dist&&(Cd.dist=t,Y(`guide-dist`).textContent=t);let n=Ws[Yu.target.type].color;n!==Cd.hl&&(Cd.hl=n,a.style.setProperty(`--hl`,n))}if($u.show(t),t&&(vu.getWorldDirection(Ld),$u.update(e,Z.time,X,Yu,Ld.x,Ld.z,zu.dots)),Zu.update(Yu.prisms,Z.time),Xu.update(X,Z.alive),X.landed&&Xu.land(X.landed),X.bump&&Xu.bump(X.bump),(X.jumped||X.launched)&&Xu.jump(),X.flying&&X.climbing){let e=Math.floor(X.flap/(Math.PI*2));e!==Nd&&(Nd=e,Xu.flapSound())}X.wingsFolded&&Xu.fold()}var Kd={page:0,riding:0};function qd(){let e=Math.max(Kd.page,Kd.riding);e&&(Y(`riders`).classList.add(`on`),Y(`riders-count`).textContent=e.toLocaleString(),Y(`riders-label`).textContent=e===1?`rider in the painting`:`riders in the painting`)}zu.onCount=e=>{Kd.riding=e,qd()};var Jd=Vc(({count:e})=>{Kd.page=e,qd()}),Yd=iu({onAgain:()=>hd(),onResume:()=>bd(),onTop:e=>{Y(`riders-best`).textContent=e>0?`top score ${e.toLocaleString()}`:``},onPlayers:e=>{let t=Y(`lifetime`);t.textContent=e>0?`${e.toLocaleString()} ${e===1?`rider has`:`riders have`} stepped into the painting`:``,t.classList.toggle(`hidden`,!(e>0))}}),Xd={steer:0,throttle:0,brake:1,jump:0,jumpPressed:!1,trick:0,trickPressed:!1},Zd={lookYaw:0,lookPitch:.05,zoom:1,on:!1},Qd={x:0,y:0,z:0},$d={lookYaw:0,lookPitch:.1,zoom:1.2};function ef(e){X.update(e,Xd),X.grounded&&(X.speed*=Math.exp(-7*e)),pf(e),qu.update(e,X,Ju),vu.position.set(qu.pos.x,qu.pos.y,qu.pos.z),vu.lookAt(qu.target.x,qu.target.y,qu.target.z),id(od(qu.fov),Z.view.H/2)}U&&(Ru=Nl({scene:_u,camera:vu,shared:gu,post:xu,game:Z,player:X,bike:Fu,chase:qu,input:Ju,audio:Xu,glowMat:Mu,paintMat:Au,walkerMat:Nu,toast:Sd,note:Ql,setProjection:id,rideFocal:od,layout:rd,townView:ef,award:(e,t)=>{Q.points+=e,Y(`stars`).classList.add(`on`),Xu.star(),Sd(`${e.toLocaleString()} orbs from ${t.title} — carry them to a steeple`,5200,!0)}}));var tf=0;function nf(){if(Y(`hud`).classList.remove(`hidden`),Y(`brief`).classList.add(`on`),$.briefT=11,Y(`hint`).classList.remove(`faded`),Ju.pad&&setTimeout(Id,1500),clearTimeout(tf),tf=setTimeout(()=>{Y(`hint`).classList.add(`faded`)},16e3),bo.touch){let e=0;try{e=Number(localStorage.getItem(`nightrider-stick-shown`))||0}catch{}if(e<3){try{localStorage.setItem(`nightrider-stick-shown`,String(e+1))}catch{}let t=Y(`stick-demo`);clearTimeout(rf),rf=setTimeout(()=>{Z.state===`ride`&&(t.classList.add(`on`),rf=setTimeout(()=>t.classList.remove(`on`),7e3))},900)}}}var rf=0,af=new R,of=new R,sf=new R,cf=new R,lf=new R,uf=new R,df=new ge;function ff(e,t,n,r,i,a){let o=1-a,s=o*o*o,c=3*o*o*a,l=3*o*a*a,u=a*a*a;return e.set(t.x*s+n.x*c+r.x*l+i.x*u,t.y*s+n.y*c+r.y*l+i.y*u,t.z*s+n.z*c+r.z*l+i.z*u)}function pf(e=.016){Fu.root.position.set(X.wx,X.y,X.wz),Fu.root.rotation.y=-X.worldHeading,Fu.pose({wheel:X.wheel,crank:X.crank,steer:X.steer,lean:X.lean,pitch:X.pitch,bob:X.bob,air:X.grounded?0:Math.min(4,X.airTime*3),speed:X.speed,dt:e,wings:X.wings,flying:X.flying,climb:X.climbing,flap:X.flap,sprint:X.sprinting,squash:X.squash,hyper:X.hyperK,spin:X.spin,flip:X.flip,whip:X.whip,trickPose:X.pose,bail:X.bail>0,look:$.look,cheer:$.cheerT>0,grab:$.grabT>0?$.grabSide:0,walk:X.walking,stride:X.stride,park:X.park,flipV:X.flipV,spinV:X.spinV,scramble:X.scramble}),Fu.shadow.position.y=X.grounded?.03:-(X.y-X.groundAt(X.gx,X.gz))+.03,Fu.setLamp(Pu.nearestLamp(X.gx,X.gz,df)),gu.uHeadPos.value.set(X.wx+X.fx*.7,X.y+.85,X.wz+X.fz*.7),gu.uHeadDir.value.set(X.fx,-.16,X.fz).normalize(),gu.uHeadPower.value=2.4*Z.alive}function mf(e){Z.time+=e,gu.uTime.value=Z.time,Ju.update(Z.time);let t=nd.gx,n=nd.gz,r=0;if(Z.state===`title`)vu.position.copy(ed.pos),vu.rotation.set(ed.pitch,ed.yaw,0),id(ad(),Z.view.hole.cy),X.update(e,Ju),pf(e),Yu.update(e,Z.time,X,!1);else if(Z.state===`dive`||Z.state===`rise`){let i=Z.state===`rise`;Z.diveT+=i?-e*fd:e;let a=Math.max(Z.diveT,0);Z.titleMix=1-Dt(0,1.4,a),Z.alive=Dt(.1,2.4,a);let o=Dt(0,1,(a-sd)/cd);Z.reveal=Dt(.5,4.6,a),r=dt.bend*yt(.2,.95,o),X.autoSpeed=i?pd.speed:a>2.2?bs*.9:0,X.update(e,Ju),pf(e),Gd(e),qu.update(e,X,Ju);let s=i?pd.top:ed.pos,c=cf.set(qu.pos.x,qu.pos.y,qu.pos.z);uf.set(qu.target.x,qu.target.y,qu.target.z);let l=af.subVectors(c,uf);l.y=0,l.normalize();let u=sf.copy(c).addScaledVector(l,20);u.y+=8.5;let d=of.set(s.x+2.6,s.y-2.2,s.z-30);ff(vu.position,s,d,u,c,o),lf.copy(s).addScaledVector(td,300);let f=lf.lerp(uf,Dt(.05,.92,o));vu.lookAt(f);let p=Math.log(ad()),m=Math.log(od(qu.fov));id(Math.exp(It(p,m,o)),It(Z.view.hole.cy,Z.view.H/2,o));let h=i&&pd.far;if(t=h?X.gx:It(nd.gx,X.gx,o),n=h?X.gz:It(nd.gz,X.gz,o),i){let e=Y(`gallery`);pd.stage===0&&a<1.95*fd?(e.classList.remove(`gone`),pd.stage=1):pd.stage===1&&(e.offsetWidth,e.classList.remove(`leaving`),pd.stage=2),Z.diveT<=0&&gd()}else a>=8.35&&(Z.state=`ride`,Z.rideT=0,X.auto=!1,nf())}else if(Z.state===`ride`){Z.rideT+=e,Z.titleMix=0,Z.alive=1,Z.reveal=1,r=dt.bend,du.has(`wings`)&&Z.rideT<.05&&!X.wings&&(X.wings=!0,X.vy=9,X.grounded=!1);let i=Vu.aside||Gu.engaged();if(X.update(e,i?Xd:Ju),i&&X.grounded&&(X.speed*=Math.exp(-7*e)),pf(e),Gd(e),Ru&&Ru.town(e,!Z.theater&&!Yd.open&&$.finishT<=0&&!i),Pu.easeHold(e),i&&Gu.facing(Qd)){let t=Mt(X.worldHeading,Math.atan2(Qd.z-X.wz,Qd.x-X.wx));X.grounded&&Math.abs(t)>.3&&(X.heading+=Ut(t-Math.sign(t)*.3,-2.4*e,2.4*e)),$.look=Ut(t,-1.1,1.1),Zd.lookYaw=K(Zd.lookYaw,t*.55,4,e),Zd.on=!0}else Zd.on?(Zd.lookYaw=K(Zd.lookYaw,0,3,e),(Math.abs(Zd.lookYaw)<.02||Ju.looking)&&(Zd.on=!1)):Zd.lookYaw=Ju.lookYaw;Zd.zoom=Ju.zoom,qu.update(e,X,Zd.on?Zd:Ju),X.landed>6&&(qu.shake=Math.min(1,X.landed/14)),vu.position.set(qu.pos.x,qu.pos.y,qu.pos.z),vu.lookAt(qu.target.x,qu.target.y,qu.target.z),vu.rotateZ(qu.roll),id(od(qu.fov),Z.view.H/2),t=X.gx,n=X.gz}else if(Z.state===`done`)Z.doneT+=e,Z.titleMix=0,Z.alive=1,Z.reveal=1,r=dt.bend,X.update(e,Xd),pf(e),Gd(e),$d.lookYaw=.55*Math.sin(Z.doneT*.22),qu.update(e,X,$d),vu.position.set(qu.pos.x,qu.pos.y,qu.pos.z),vu.lookAt(qu.target.x,qu.target.y,qu.target.z),id(od(qu.fov),Z.view.H/2),t=X.gx,n=X.gz;else if(Z.state===`realm`)Z.alive=1,Z.reveal=1,Ru.step(e),r=Ru.scene?0:dt.bend,t=X.gx,n=X.gz;else if(Z.state===`free`){let e=Z.free;vu.position.set(e.x,e.y,e.z),vu.rotation.set(e.pitch*Ct,e.yaw*Ct,0),id(od(e.fov),Z.view.H/2),r=e.bend,t=e.gx??e.x,n=e.gz??e.z,pf()}Z.director&&Z.director(e),Iu&&Iu.on&&Iu.place(e);let i=Z.state===`ride`?X.hyperK:0;xu.composite.uniforms.uRush.value=i*yt(7,19,X.speed),xu.composite.uniforms.uBloom.value=.7+.3*i,xu.composite.uniforms.uSaturation.value=1.18+.14*i,yu.material.uniforms.uStarGain.value=Q.skyGain*(1+.5*i),Z.state===`ride`&&!Z.joined&&(Z.joined=Z.rideT>ld||Math.hypot(X.gx-_t.bike.gx,X.gz-_t.bike.gz)>ud),zu.update(e,X,Z.state===`ride`&&Z.joined),Z.state!==`ride`&&Vu.open&&Vu.show(!1),Gu.update(e,X,Z.state===`ride`&&!Z.theater&&!X.flying,Vu.open),Vu.update(e,window.innerWidth,window.innerHeight),Yu.loose=Z.theater?[]:zu.loose,gu.uBend.value=r,gu.uAlive.value=Z.alive,gu.uHillReveal.value=Z.reveal,bu.setReveal(Z.reveal),xu.composite.uniforms.uTitleMix.value=Iu&&Iu.on?0:Z.titleMix,gu.uSkyLift.value=Math.atan(r*dt.hillRadius-Math.max(0,vu.position.y-ed.pos.y)/dt.hillRadius),gu.uBendCenter.value.copy(vu.position),gu.uPixel.value=2*Math.tan(vu.fov*Ct/2)/(xu.height*(vu.view&&vu.view.enabled?vu.view.fullHeight/vu.view.height:1));let a=Ru?Ru.scene:null;gu.uHis.value=a?0:Gt,a||(Pu.retarget(t,n),Pu.work(Z.loading?30:Z.manual?12:bo.touch?3:4.5),Pu.cull(vu)),vu.updateMatrixWorld(),yu.update(vu);let o=Z.state===`title`&&Z.titleMix>=.999&&!Z.loading;Iu&&Iu.on?Iu.render(a||_u,Z.time):Z.blind||xu.render(a||_u,vu,Z.time,o)}var hf=performance.now(),gf={acc:0,n:0,beat:1/30,calm:0,wait:4,tried:!1,relayout:!1};function _f(e){requestAnimationFrame(_f);let t=(e-hf)/1e3;if(hf=e,!(t<=0||Z.manual)&&!(Iu&&Iu.on)&&(gf.relayout&&(gf.relayout=!1,rd()),mf(Math.min(t,.05)),Z.state===`ride`&&!document.hidden&&t<.25&&(gf.acc+=t,gf.n++,gf.n>=90))){let e=gf.acc/gf.n;gf.acc=0,gf.n=0,gf.beat=Math.max(1/240,Math.min(gf.beat,e));let t=e<Math.max(gf.beat*1.12,.0125);gf.tried&&!t?(Z.quality=Math.max(.55,Z.quality-.06),gf.wait=Math.min(gf.wait*2,64),gf.calm=0,gf.tried=!1,gf.relayout=!0):e>.02&&Z.quality>.55?(Z.quality=Math.max(.55,Z.quality-.12),gf.calm=0,gf.tried=!1,gf.relayout=!0):t&&Z.quality<1&&!du.has(`q`)?(gf.tried=!1,++gf.calm>=gf.wait&&(Z.quality=Math.min(1,Z.quality+.06),gf.calm=0,gf.tried=!0,gf.relayout=!0)):(gf.calm=0,gf.tried=!1)}}if(du.has(`cam`)){let[e,t,n,r,i,a,o]=du.get(`cam`).split(`,`).map(Number);Z.state=`free`,Z.free={x:e,y:t,z:n,yaw:r||0,pitch:i||0,fov:a||75,bend:Number.isFinite(o)?o:dt.bend},Z.titleMix=0,Z.alive=1,Z.reveal=1,Y(`gallery`).classList.add(`gone`)}for(du.has(`mix`)&&(Z.titleMix=parseFloat(du.get(`mix`))),du.has(`alive`)&&(Z.alive=parseFloat(du.get(`alive`))),du.has(`nogallery`)&&Y(`gallery`).classList.add(`gone`),navigator.xr&&navigator.xr.isSessionSupported&&navigator.xr.isSessionSupported(`immersive-vr`).then(e=>e?Ol(()=>import(`./xr-zUFpdOti.js`),__vite__mapDeps([7,1])):null).then(e=>{if(!e)return;Iu=e.createXR({renderer:hu,post:xu,sky:yu,camera:vu,game:Z,input:Ju,bike:Fu,step:mf,firstPerson:()=>{if(Z.state===`ride`||Z.state===`done`)return Lu.first=!0;let e=Z.state===`realm`&&Ru?Ru.state.phase:``;return e===`close`?Lu.first:Lu.first=e===`cover`||e===`uncover`||e===`play`&&Fu.root.visible},seatOf:()=>{let e=Z.state===`realm`&&Ru?Ru.state.phase:``,t=e?Ru.state.realm:null;return e===`close`?Lu.seat:Lu.seat=t&&t.xrSeat&&(e===`play`||e===`result`)?t.xrSeat:null},getScene:()=>Ru&&Ru.scene||_u,PAINTING:qt,titlePose:ed,getPortals:()=>Ru,guide:()=>{if(!Yu.target)return null;let e=Yu.info.bearing-X.worldHeading;return{angle:Math.atan2(Math.sin(e),Math.cos(e)),label:Y(`guide-label`).textContent,dist:Y(`guide-dist`).textContent}},onStart:null,onEnd:()=>{rd(),hf=performance.now()}});let t=Y(`enter-vr`);t.classList.remove(`hidden`),t.addEventListener(`click`,()=>{Iu.enter()})}).catch(()=>{}),X.auto=!0,X.autoSpeed=0,mf(.001);Pu.pending>0;)Pu.work(40),await new Promise(e=>setTimeout(e,0));mf(.001),Z.loading=!1,Y(`loading`).classList.add(`done`),du.has(`ride`)&&(dd(),Z.diveT=8.34),hf=performance.now(),requestAnimationFrame(_f);