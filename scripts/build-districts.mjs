
















import { writeFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';

const SOURCE =
  'https://raw.githubusercontent.com/southkorea/southkorea-maps/master/kostat/2018/json/skorea-municipalities-2018-topo-simple.json';
const OUT = 'public/data/districts.json';
const PRECISION = 3;


function decodeArc(topo, index) {
  const [sx, sy] = topo.transform.scale;
  const [tx, ty] = topo.transform.translate;

  let x = 0;
  let y = 0;

  return topo.arcs[index].map(([dx, dy]) => {
    x += dx;
    y += dy;
    return [x * sx + tx, y * sy + ty];
  });
}


function buildRing(topo, arcIndexes) {
  const points = [];

  for (const index of arcIndexes) {
    const reversed = index < 0;
    const arc = decodeArc(topo, reversed ? ~index : index);
    const piece = reversed ? [...arc].reverse() : arc;


    points.push(...(points.length > 0 ? piece.slice(1) : piece));
  }

  return points;
}

function round(value) {
  return Number(value.toFixed(PRECISION));
}


function compact(ring) {
  const out = [];

  for (const [lng, lat] of ring) {
    const point = [round(lng), round(lat)];
    const last = out[out.length - 1];
    if (last && last[0] === point[0] && last[1] === point[1]) continue;
    out.push(point);
  }

  return out;
}

const response = await fetch(SOURCE);
if (!response.ok) throw new Error(`경계 데이터를 받지 못함: HTTP ${response.status}`);

const topo = await response.json();
const collection = topo.objects[Object.keys(topo.objects)[0]];

const features = [];

for (const geometry of collection.geometries) {

  const polygons =
    geometry.type === 'MultiPolygon' ? geometry.arcs : geometry.arcs ? [geometry.arcs] : [];

  const rings = [];
  let minLng = Infinity;
  let minLat = Infinity;
  let maxLng = -Infinity;
  let maxLat = -Infinity;

  for (const polygon of polygons) {
    const ring = compact(buildRing(topo, polygon[0]));

    if (ring.length < 4) continue;

    rings.push(ring);

    for (const [lng, lat] of ring) {
      if (lng < minLng) minLng = lng;
      if (lat < minLat) minLat = lat;
      if (lng > maxLng) maxLng = lng;
      if (lat > maxLat) maxLat = lat;
    }
  }

  if (rings.length === 0) continue;

  features.push({
    name: geometry.properties?.name ?? '',
    code: geometry.properties?.code ?? '',
    bbox: [minLng, minLat, maxLng, maxLat],
    rings,
  });
}

const payload = JSON.stringify({ source: 'kostat 2018 · southkorea-maps', features });

await mkdir(dirname(OUT), { recursive: true });
await writeFile(OUT, payload);

const points = features.reduce((sum, f) => sum + f.rings.reduce((s, r) => s + r.length, 0), 0);
console.log(`시군구 ${features.length}개 · 링 좌표 ${points.toLocaleString()}개`);
console.log(`${OUT} — ${(payload.length / 1024).toFixed(0)}KB`);
