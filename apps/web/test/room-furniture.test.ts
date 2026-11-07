import { Box3, BoxGeometry, Group, Mesh, MeshStandardMaterial, Vector3 } from "three";
import { describe, expect, it } from "vitest";
import { fitRoomFurniture } from "../src/play/roomFurniture";

describe("imported room furniture", () => {
  it("centres rotated, off-pivot furniture on the floor without stretching it", () => {
    const source = new Group();
    const desk = new Mesh(new BoxGeometry(100, 80, 300), new MeshStandardMaterial());
    desk.position.set(30, 20, -90);
    source.add(desk);
    const fit = fitRoomFurniture(source, 1.5, -Math.PI / 2);
    const box = new Box3().setFromObject(fit.group);
    const size = box.getSize(new Vector3());
    expect(box.min.y).toBeCloseTo(0);
    expect(box.getCenter(new Vector3()).x).toBeCloseTo(0);
    expect(box.getCenter(new Vector3()).z).toBeCloseTo(0);
    expect(size.y).toBeCloseTo(1.5);
    expect(size.x / size.z).toBeCloseTo(3);
  });
  it("anchors an open safe by its body so the door does not shift the whole cabinet", () => {
    const source = new Group();
    const body = new Mesh(new BoxGeometry(50, 60, 40), new MeshStandardMaterial());
    body.name = "body";
    body.position.y = 30;
    source.add(body);
    const door = new Mesh(new BoxGeometry(50, 55, 3), new MeshStandardMaterial());
    door.position.set(45, 30, 55);
    source.add(door);
    const fit = fitRoomFurniture(source, 3, 0, "body");
    fit.group.updateMatrixWorld(true);
    const bounds = new Box3().setFromObject(body);
    expect(bounds.min.y).toBeCloseTo(0);
    expect(bounds.getCenter(new Vector3()).x).toBeCloseTo(0);
    expect(bounds.getCenter(new Vector3()).z).toBeCloseTo(0);
    expect(fit.depth).toBeCloseTo(2);
    expect(new Box3().setFromObject(fit.group).max.z).toBeGreaterThan(2);
  });
});
