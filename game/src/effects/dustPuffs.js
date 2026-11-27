// Pooled soft dust / smoke puffs (one Points object, per-particle size, colour and alpha).
import * as THREE from 'three';

const N = 560;
export function createDust(scene) {
  const pos = new Float32Array(N * 3), col = new Float32Array(N * 3), size = new Float32Array(N), alpha = new Float32Array(N);
  const vel = new Float32Array(N * 3), life = new Float32Array(N), max = new Float32Array(N), grow = new Float32Array(N), base = new Float32Array(N);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('aColor', new THREE.BufferAttribute(col, 3));
  g.setAttribute('size', new THREE.BufferAttribute(size, 1));
  g.setAttribute('alpha', new THREE.BufferAttribute(alpha, 1));
  const uniforms = { scale: { value: 600 } };
  const m = new THREE.ShaderMaterial({
    uniforms, transparent: true, depthWrite: false,
    vertexShader: `attribute float size; attribute float alpha; attribute vec3 aColor; varying float vA; varying vec3 vC; uniform float scale;
      void main(){ vA=alpha; vC=aColor; vec4 mv=modelViewMatrix*vec4(position,1.0); gl_PointSize=size*scale/max(-mv.z,1.0); gl_Position=projectionMatrix*mv; }`,
    fragmentShader: `varying float vA; varying vec3 vC;
      float h(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
      float vn(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f); return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y); }
      void main(){
        vec2 q=gl_PointCoord-0.5; float d=length(q)*2.0;
        float n=vn(q*5.0+vC.rg*17.0)*0.6+vn(q*11.0+vC.gb*9.0)*0.4;
        float a=smoothstep(0.98,0.74,d+(n-0.5)*0.55)*smoothstep(1.0,0.82,d)*vA; if(a<0.02) discard;
        float lit=0.8+0.35*(0.5-q.y)+0.25*(n-0.5);
        gl_FragColor=vec4(vC*lit,min(a*1.25,0.92));
        #include <colorspace_fragment>
      }`,
  });
  const pts = new THREE.Points(g, m); pts.frustumCulled = false; pts.renderOrder = 5;
  scene.add(pts);
  let head = 0;
  const tmp = new THREE.Color();
  function emit(x, y, z, vx, vy, vz, sz, lifeS, color, a = 0.55, gr = 3, age = 0) {
    const i = head++ % N; tmp.set(color);
    pos.set([x, y, z], i * 3); vel.set([vx, vy, vz], i * 3); col.set([tmp.r, tmp.g, tmp.b], i * 3);
    size[i] = sz; max[i] = lifeS; life[i] = lifeS * (1 - age); grow[i] = gr; base[i] = a; alpha[i] = a;
  }
  return {
    emit,
    burst(x, y, z, n, o = {}) {
      const { spread = 5, up = 2, size = 7, life = 2.2, color = 0xe6bd8c, alpha = 0.55, aged = true } = o;
      for (let i = 0; i < n; i++) {
        const a = Math.random() * 6.283, s = Math.random() * spread;
        emit(x + Math.cos(a) * 1.5, y + Math.random(), z + Math.sin(a) * 1.5, Math.cos(a) * s, up * (0.3 + Math.random()), Math.sin(a) * s,
          size * (0.6 + Math.random() * 0.8), life * (0.6 + Math.random() * 0.6), color, alpha, 3, aged ? Math.random() * 0.5 : 0);
      }
    },
    update(dt, camera, height) {
      uniforms.scale.value = height * 0.5 / Math.tan(camera.fov * Math.PI / 360);
      for (let i = 0; i < N; i++) {
        if (life[i] <= 0) { alpha[i] = 0; size[i] = Math.max(size[i], 0); continue; }
        life[i] -= dt;
        const k = Math.max(life[i], 0) / max[i];
        pos[i * 3] += vel[i * 3] * dt; pos[i * 3 + 1] += vel[i * 3 + 1] * dt; pos[i * 3 + 2] += vel[i * 3 + 2] * dt;
        vel[i * 3] *= 0.97; vel[i * 3 + 2] *= 0.97; vel[i * 3 + 1] *= 0.98;
        size[i] += grow[i] * dt;
        alpha[i] = base[i] * Math.min(1, k * 2.2) * Math.min(1, (1 - k) * 8 + 0.2);
      }
      g.attributes.aColor.needsUpdate = g.attributes.position.needsUpdate = g.attributes.size.needsUpdate = g.attributes.alpha.needsUpdate = true;
    },
  };
}
