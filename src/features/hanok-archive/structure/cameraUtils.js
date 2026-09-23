import * as THREE from 'three';

export const toRad = (deg) => (deg * Math.PI) / 180;

export const clamp01 = (v) => Math.min(1, Math.max(0, v));




export const materialsOf = (material) => (Array.isArray(material) ? material : [material]);








export function frameCamera(
  { height, radius },
  aspect,
  {
    fov = 46,
    azimuthDeg = 118,
    elevationDeg = 3,
    baseScreenY = 0.12,
    roofScreenY = 0.7,
    widthFill = 0.82,
    dolly = 0,
    offsetX = 0,
    offsetY = 0,
  } = {},
) {
  const forHeight = (0.5 * height) / (roofScreenY - baseScreenY);
  const forWidth = radius / (widthFill * Math.max(aspect, 0.1));
  const halfExtent = Math.max(forHeight, forWidth);

  const targetY = 2 * halfExtent * (0.5 - baseScreenY) + offsetY;
  const distance = Math.max(halfExtent / Math.tan(toRad(fov) / 2) + dolly, 1);

  const azimuth = toRad(azimuthDeg);
  const elevation = toRad(elevationDeg);
  const ground = distance * Math.cos(elevation);

  const target = [-offsetX, targetY, 0];
  const position = [
    Math.sin(azimuth) * ground,
    targetY + distance * Math.sin(elevation),
    Math.cos(azimuth) * ground,
  ];

  const dummy = new THREE.Object3D();
  dummy.position.set(...position);
  dummy.lookAt(...target);

  return {
    target,
    position,
    rotation: [dummy.rotation.x, dummy.rotation.y, dummy.rotation.z],
    near: Math.max(0.01, distance / 200),
    far: distance * 6,
  };
}
