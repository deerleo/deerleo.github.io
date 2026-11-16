import * as THREE from 'three';
import {$} from './util.js';

export const canvas=$('#c');
export const renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});
/** mutable render settings shared with the adaptive-quality code */
export const gfx={pixelRatio:Math.min(devicePixelRatio||1,2),composer:null,bloomOn:false};
renderer.setPixelRatio(gfx.pixelRatio);
renderer.setSize(innerWidth,innerHeight);
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.0;
export const scene=new THREE.Scene();
scene.fog=new THREE.FogExp2(0x0a0d18,.016);
export const camera=new THREE.PerspectiveCamera(56,innerWidth/innerHeight,.1,600);
camera.position.set(0,3,-8);

// optional bloom — the game runs without it if the addon fails to load
try{
  const [{EffectComposer},{RenderPass},{UnrealBloomPass},{OutputPass}]=await Promise.all([
    import('three/addons/postprocessing/EffectComposer.js'),import('three/addons/postprocessing/RenderPass.js'),
    import('three/addons/postprocessing/UnrealBloomPass.js'),import('three/addons/postprocessing/OutputPass.js')]);
  const rt=new THREE.WebGLRenderTarget(innerWidth,innerHeight,{type:THREE.HalfFloatType,samples:4});
  const composer=new EffectComposer(renderer,rt);
  composer.addPass(new RenderPass(scene,camera));
  composer.addPass(new UnrealBloomPass(new THREE.Vector2(innerWidth,innerHeight),.5,.55,.9));
  composer.addPass(new OutputPass());
  gfx.composer=composer;gfx.bloomOn=true;
}catch(e){console.warn('bloom unavailable',e);}

addEventListener('resize',()=>{
  renderer.setSize(innerWidth,innerHeight);gfx.composer&&gfx.composer.setSize(innerWidth,innerHeight);
  camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();
});

/** free a subtree's GPU resources (geometries, materials and their textures) */
export function disposeTree(obj){
  obj.traverse(o=>{
    if(o.geometry)o.geometry.dispose();
    if(o.material)for(const m of [].concat(o.material)){if(m.map)m.map.dispose();if(m.bumpMap)m.bumpMap.dispose();m.dispose();}
  });
}
