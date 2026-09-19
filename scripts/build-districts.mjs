/**
 * 시군구 행정경계 데이터 빌드
 *
 * 출처: southkorea/southkorea-maps (통계청 2018 기준, kostat)
 *   https://github.com/southkorea/southkorea-maps  · Public Domain
 *
 * 원본 GeoJSON은 18MB라 배포에 실을 수 없다. 같은 저장소의 간소화 TopoJSON(553KB)을
 * 받아 GeoJSON으로 풀고, 온기 히트맵에 필요한 것만 남겨 public/data/districts.json에 쓴다.
 *
 * 남기는 것: 이름 · 코드 · 바깥 링 좌표 · 바운딩 박스
 * 버리는 것: 구멍(내부 링) · 소수점 3자리 미만 · 반올림 후 겹치는 점
 *   3자리는 약 110m다. 시군구 한 덩어리를 칠하는 용도라 이보다 정밀할 이유가 없고,
 *   좌표 수가 줄어 파일과 렌더링 비용이 함께 내려간다.
 *
 * 실행: node scripts/build-districts.mjs
 */

import { writeFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';

const SOURCE =
  'https://raw.githubusercontent.com/southkorea/southkorea-maps/master/kostat/2018/json/skorea-municipalities-2018-topo-simple.json';
const OUT = 'public/data/districts.json';
const PRECISION = 3;

/** TopoJSON 델타 인코딩을 실제 좌표로 되돌린다. */
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

/** 링 하나는 arc 여러 개를 이어 붙인 것이다. 음수 인덱스는 뒤집어 쓴다. */
function buildRing(topo, arcIndexes) {
  const points = [];

  for (const index of arcIndexes) {
    const reversed = index < 0;
    const arc = decodeArc(topo, reversed ? ~index : index);
    const piece = reversed ? [...arc].reverse() : arc;

    // 이어 붙이는 지점은 앞 arc의 끝과 같은 점이라 한 번만 넣는다.
    points.push(...(points.length > 0 ? piece.slice(1) : piece));
  }

  return points;
}

function round(value) {
  return Number(value.toFixed(PRECISION));
}

/** 반올림 뒤 같은 자리에 겹친 점을 걷어낸다. */
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
  // MultiPolygon은 [[바깥링, 구멍...], ...], Polygon은 [바깥링, 구멍...]
  const polygons =
    geometry.type === 'MultiPolygon' ? geometry.arcs : geometry.arcs ? [geometry.arcs] : [];

  const rings = [];
  let minLng = Infinity;
  let minLat = Infinity;
  let maxLng = -Infinity;
  let maxLat = -Infinity;

  for (const polygon of polygons) {
    const ring = compact(buildRing(topo, polygon[0]));
    // 점 셋으로는 면이 되지 않는다. 반올림에 뭉개진 섬들이 여기서 걸러진다.
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
