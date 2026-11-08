import { BufferAttribute, type BufferGeometry } from "three";

export const mouthLine = (x: number) => 1.549 + 0.003 * Math.min(1, (x / 0.037) ** 2);
export type LipSeam = { upper: number; lower: number };

/** Split crossing lip triangles into matching upper/lower edges. The source head is closed:
 * moving its original shared vertices alone cannot create an opening.
 * UVs, normals and skin attributes are preserved on both sides of the new seam.
 */
export function splitMouthSeam(geometry: BufferGeometry): LipSeam[] {
  const position = geometry.getAttribute("position");
  const indices = geometry.index;
  if (!position || !indices) return [];
  const original = Array.from(indices.array);
  const attributes = Object.entries(geometry.attributes).map(([name, attribute]) => ({
    name,
    size: attribute.itemSize,
    values: Array.from({ length: attribute.count * attribute.itemSize }, (_, offset) => {
      const vertex = Math.floor(offset / attribute.itemSize),
        component = offset % attribute.itemSize;
      return component === 0
        ? attribute.getX(vertex)
        : component === 1
          ? attribute.getY(vertex)
          : component === 2
            ? attribute.getZ(vertex)
            : attribute.getW(vertex);
    }),
  }));
  const cache = new Map<string, number>();
  const pairs = new Map<string, Partial<LipSeam>>();
  const output: number[] = [];
  let count = position.count;
  const distance = (index: number) => position.getY(index) - mouthLine(position.getX(index));
  const intersection = (a: number, b: number, lower: boolean) => {
    const edge = `${Math.min(a, b)}:${Math.max(a, b)}`;
    const key = `${edge}:${lower ? "lower" : "upper"}`;
    const existing = cache.get(key);
    if (existing !== undefined) return existing;
    const weight = distance(a) / (distance(a) - distance(b));
    const index = count++;
    for (const attribute of attributes) {
      const categorical = attribute.name === "skinIndex" || attribute.name === "skinWeight";
      for (let component = 0; component < attribute.size; component++) {
        const av = attribute.values[a * attribute.size + component] ?? 0;
        const bv = attribute.values[b * attribute.size + component] ?? 0;
        attribute.values.push(categorical ? (weight < 0.5 ? av : bv) : av + (bv - av) * weight);
      }
    }
    cache.set(key, index);
    const pair = pairs.get(edge) ?? {};
    if (lower) pair.lower = index;
    else pair.upper = index;
    pairs.set(edge, pair);
    return index;
  };
  const clip = (triangle: number[], lower: boolean) => {
    const polygon: number[] = [];
    let previous = triangle[triangle.length - 1] ?? 0;
    let previousInside = lower ? distance(previous) <= 0 : distance(previous) >= 0;
    for (const vertex of triangle) {
      const inside = lower ? distance(vertex) <= 0 : distance(vertex) >= 0;
      if (inside !== previousInside) polygon.push(intersection(previous, vertex, lower));
      if (inside) polygon.push(vertex);
      previous = vertex;
      previousInside = inside;
    }
    for (let i = 1; i < polygon.length - 1; i++) {
      const a = polygon[0],
        b = polygon[i],
        c = polygon[i + 1];
      if (a !== undefined && b !== undefined && c !== undefined && a !== b && b !== c && a !== c)
        output.push(a, b, c);
    }
  };
  for (let i = 0; i < original.length; i += 3) {
    const triangle = original.slice(i, i + 3);
    const isMouth =
      triangle.every((vertex) => position.getZ(vertex) > 0.052) &&
      triangle.some((vertex) => Math.abs(position.getX(vertex)) < 0.04) &&
      triangle.some((vertex) => distance(vertex) < 0) &&
      triangle.some((vertex) => distance(vertex) > 0);
    if (isMouth) {
      clip(triangle, false);
      clip(triangle, true);
    } else output.push(...triangle);
  }
  for (const attribute of attributes) {
    geometry.setAttribute(
      attribute.name,
      new BufferAttribute(
        attribute.name === "skinIndex"
          ? new Uint16Array(attribute.values)
          : new Float32Array(attribute.values),
        attribute.size,
      ),
    );
  }
  geometry.setIndex(output);
  geometry.computeBoundingBox();
  return Array.from(pairs.values()).flatMap((pair) =>
    pair.upper !== undefined && pair.lower !== undefined
      ? [{ upper: pair.upper, lower: pair.lower }]
      : [],
  );
}
