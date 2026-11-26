// Harmattan sky dome (pale ochre / peach / dusty ivory, white-gold sun), dust fog and the lights.
import * as THREE from 'three';
import { WORLD } from '../core/config.js';

export function createSky(scene) {
  const sunDir = new THREE.Vector3(...WORLD.sunDir).normalize();
  const horizon = new THREE.Color(WORLD.horizonColor), zenith = new THREE.Color(WORLD.zenithColor);
  const haze = new THREE.Color(WORLD.hazeColor), fogC = new THREE.Color(WORLD.fogColor);
  scene.fog = new THREE.FogExp2(fogC.getHex(), WORLD.fogDensity);
  scene.background = fogC.clone();

  const uniforms = {
    sunDir: { value: sunDir }, uHorizon: { value: horizon.clone() }, uZenith: { value: zenith.clone() },
    uHaze: { value: haze.clone() }, uDust: { value: 0 },
  };
  const mat = new THREE.ShaderMaterial({
    uniforms, side: THREE.BackSide, depthWrite: false, fog: false,
    vertexShader: 'varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
    fragmentShader: `
      varying vec3 vDir; uniform vec3 sunDir,uHorizon,uZenith,uHaze; uniform float uDust;
      void main(){
        vec3 d = normalize(vDir); float h = clamp(d.y,0.0,1.0);
        vec3 col = mix(uHorizon, uZenith, pow(h,0.5));
        col = mix(col, uHaze, smoothstep(0.35,0.0,h)*0.55);
        col = mix(col, uHorizon, uDust);
        float s = max(dot(d,sunDir),0.0);
        col += vec3(1.0,0.82,0.52)*pow(s,5.0)*0.30*(1.0-uDust) + vec3(1.0,0.93,0.74)*pow(s,40.0)*0.45;
        col += vec3(1.0,0.97,0.88)*smoothstep(0.9985,0.9993,s)*(1.0-uDust*0.8);
        if (d.y < 0.0) col = uHorizon;
        gl_FragColor = vec4(col,1.0);
        #include <colorspace_fragment>
      }`,
  });
  const dome = new THREE.Mesh(new THREE.SphereGeometry(8000, 24, 16), mat);
  dome.frustumCulled = false; dome.renderOrder = -10;
  scene.add(dome);

  const hemi = new THREE.HemisphereLight(0xfff0d4, 0xc27240, 1.75);
  const sun = new THREE.DirectionalLight(0xffefd2, 2.5);
  sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
  const sc = sun.shadow.camera; sc.left = -70; sc.right = 70; sc.top = 70; sc.bottom = -70; sc.near = 1; sc.far = 600;
  sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.15;
  scene.add(hemi, sun, sun.target);

  return {
    sunDir,
    // dust 0..1: 0 = clear harmattan, 1 = whiteout
    setDust(d, density) {
      uniforms.uDust.value = d;
      scene.fog.density = density;
    },
    update(camera, focus) {
      dome.position.copy(camera.position);
      sun.target.position.set(focus.x, focus.y, focus.z);
      sun.position.copy(sun.target.position).addScaledVector(sunDir, 300);
      sun.target.updateMatrixWorld();
    },
  };
}
