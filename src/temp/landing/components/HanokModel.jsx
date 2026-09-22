'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

import { usePrefersReducedMotion } from './LandingSectionFrame';

export const MODEL_URL = '/anchae.glb';
useGLTF.preload(MODEL_URL);

const WIRE_OPACITY = 0.85;
const GLOW_OPACITY = 0.25;
const GLOW_SCALE = 1.002;
const TILT_MAX = 0.26;
const TILT_LERP = 0.05;

const createWireframeMaterials = () => ({
  line: new THREE.MeshBasicMaterial({
    color: '#F5A623',
    wireframe: true,
    transparent: true,
    opacity: WIRE_OPACITY,
  }),
  glow: new THREE.MeshBasicMaterial({
    color: '#FFCC40',
    wireframe: true,
    transparent: true,
    opacity: GLOW_OPACITY,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  }),
});


const materialsOf = (material) => (Array.isArray(material) ? material : [material]);








const wire = createWireframeMaterials();












export default function HanokModel({ wireframe = { on: false, drawn: 1, scale: 1 } }) {
  const { scene } = useGLTF(MODEL_URL);
  const reduced = usePrefersReducedMotion();

  const shakeRef = useRef(null);
  const tiltRef = useRef(null);
  const pointer = useRef(new THREE.Vector2());

  const { root, glow, offset, states } = useMemo(() => {
    const cloned = scene.clone(true);
    const collected = [];

    cloned.traverse((o) => {
      if (o.isMesh) {
        o.castShadow = true;
        o.receiveShadow = true;


        const origMat = Array.isArray(o.material)
          ? o.material.map((m) => {
              const c = m.clone();
              c.transparent = false;
              c.opacity = 1;
              return c;
            })
          : (() => {
              const c = o.material.clone();
              c.transparent = false;
              c.opacity = 1;
              return c;
            })();

        o.material = origMat;

        collected.push({
          mesh: o,
          original: origMat,
          states: materialsOf(origMat).map((material) => ({
            material,
            transparent: false,
            opacity: 1,
          })),
        });
      }
    });




    const shell = cloned.clone(true);
    shell.traverse((o) => {
      if (o.isMesh) {
        o.material = wire.glow;
        o.castShadow = false;
        o.receiveShadow = false;
      }
    });

    const bbox = new THREE.Box3().setFromObject(cloned);
    const center = new THREE.Vector3();
    bbox.getCenter(center);

    return {
      root: cloned,
      glow: shell,
      offset: [-center.x, -bbox.min.y, -center.z],
      states: collected,
    };
  }, [scene]);

  useEffect(() => {
    if (wireframe.on) {
      states.forEach((entry) => {
        entry.mesh.material = wire.line;
      });
      return undefined;
    }

    states.forEach((entry) => {
      entry.mesh.material = entry.original;
      materialsOf(entry.original).forEach((mat) => {
        mat.transparent = false;
        mat.opacity = 1;
        mat.needsUpdate = true;
      });
    });

    return undefined;
  }, [wireframe.on, states]);







  useEffect(() => {
    if (!wireframe.on || reduced) return undefined;

    const read = (event) => {
      pointer.current.set(
        (event.clientX / window.innerWidth) * 2 - 1,
        -((event.clientY / window.innerHeight) * 2 - 1),
      );
    };

    window.addEventListener('pointermove', read, { passive: true });
    return () => window.removeEventListener('pointermove', read);
  }, [wireframe.on, reduced]);





  useFrame(() => {






    if (wireframe.on) {
      wire.line.opacity = WIRE_OPACITY * wireframe.drawn;
      wire.glow.opacity = GLOW_OPACITY * wireframe.drawn;
    }

    const group = tiltRef.current;
    if (!group) return;

    const active = wireframe.on && !reduced;
    const targetY = active ? pointer.current.x * TILT_MAX : 0;
    const targetX = active ? -pointer.current.y * TILT_MAX : 0;

    group.rotation.y += (targetY - group.rotation.y) * TILT_LERP;
    group.rotation.x += (targetX - group.rotation.x) * TILT_LERP;
  });








  return (
    <group ref={shakeRef}>
      <group ref={tiltRef}>
        <group position={offset} scale={wireframe.on ? wireframe.scale : 1}>
          <primitive object={root} />

          {wireframe.on && <primitive object={glow} scale={GLOW_SCALE} />}
        </group>
      </group>
    </group>
  );
}

useGLTF.preload(MODEL_URL);
