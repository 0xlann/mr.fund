"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { TextGeometry } from "three/addons/geometries/TextGeometry.js";
import { FontLoader } from "three/addons/loaders/FontLoader.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { OutlinePass } from "three/addons/postprocessing/OutlinePass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import wordmarkTypeface from "./assets/wordmark.typeface.json";
import { officeFraming } from "./officeViewport";
import { createRealisticCharacterMotion } from "./realisticCharacter";
import { fitRoomFurniture } from "./roomFurniture";
import { pickRoomTarget } from "./roomInteractions";
import { createRoomJourney, type RoomVisit } from "./roomJourney";
import { createSafeDoorMotion } from "./safeDoor";

export type Station = "office" | "guardian" | "activity" | "chat";
export type GuardianLamp = "inactive" | "active" | "paused" | "deactivated";
type Vec = [number, number, number];

type WorldProps = {
  /** Engine-derived mood: calm, concerned, pleased or thinking. Never model-driven. */
  mood: string;
  /** Increment to play the wave clip. */
  wave: number;
  station: Station;
  guardian: GuardianLamp;
  /** Simulated health in basis points, or null when unavailable. */
  healthBps: number | null;
  activityCount: number;
  onWave: () => void;
  onInteract: (panel: "chat" | "guardian" | "activity" | "position") => void;
  visit: RoomVisit | null;
  panelOpen: boolean;
  onVisitReady: (id: number) => void;
  onStateChange: (state: "loading" | "ready" | "fallback") => void;
};

// Camera stations; officeFraming reserves the visible tool panel width at every breakpoint.
const STATIONS: Record<Station, { pos: Vec; target: Vec }> = {
  chat: { pos: [3.45, 2.8, 3.0], target: [3.45, 2.35, -2.15] },
  office: { pos: [0.4, 2.65, 7.8], target: [0.1, 2.25, 0.5] },
  guardian: { pos: [-1.1, 2.8, 5.3], target: [-3.35, 1.9, -0.8] },
  activity: { pos: [3.4, 2.9, 4.8], target: [4.8, 2.7, -3.4] },
};
const LAMP: Record<GuardianLamp, { color: string; level: number }> = {
  inactive: { color: "#6b7280", level: 0.15 },
  active: { color: "#dbf884", level: 0.45 },
  paused: { color: "#ffb35c", level: 0.25 },
  deactivated: { color: "#ff6a55", level: 0.18 },
};
const SEGMENTS = 10;
const ROWS = 6;

function litSegments(health: number | null) {
  if (health === null) return 0;
  return THREE.MathUtils.clamp(Math.floor((health - 9000) / 1500) + 1, 0, SEGMENTS);
}

export function WorldScene(props: WorldProps) {
  const host = useRef<HTMLDivElement>(null);
  const live = useRef(props);
  live.current = props;
  const [assetError, setAssetError] = useState("");
  const [state, setState] = useState<"loading" | "ready" | "fallback">("loading");
  useEffect(() => props.onStateChange(state), [state, props.onStateChange]);

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    let disposed = false;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: false,
        powerPreference: "high-performance",
      });
    } catch {
      setState("fallback");
      return;
    }
    const pixelRatio = Math.min(window.devicePixelRatio, 2);
    renderer.setPixelRatio(pixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.NeutralToneMapping;
    renderer.toneMappingExposure = 0.92;
    el.appendChild(renderer.domElement);
    renderer.domElement.className = "block h-full w-full";

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#1c2331");
    const pmrem = new THREE.PMREMGenerator(renderer);
    const envMap = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envMap;
    scene.environmentIntensity = 0.28;

    const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 80);
    const world = new THREE.Group();
    scene.add(world);

    scene.add(new THREE.HemisphereLight(0xffffff, 0x7a6559, 0.65));
    const sun = new THREE.DirectionalLight(0xfff8ed, 2.0);
    sun.position.set(-4, 9, 8);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.left = -10;
    sun.shadow.camera.right = 10;
    sun.shadow.camera.top = 9;
    sun.shadow.camera.bottom = -4;
    sun.shadow.camera.far = 40;
    sun.shadow.normalBias = 0.04;
    scene.add(sun);
    const fill = new THREE.DirectionalLight(0xb6caff, 0.65);
    fill.position.set(4, 5, 5);
    scene.add(fill);

    const mat = (color: string, roughness = 0.55, metalness = 0, emissive?: string, level = 0) =>
      new THREE.MeshStandardMaterial({
        color,
        roughness,
        metalness,
        ...(emissive ? { emissive: new THREE.Color(emissive), emissiveIntensity: level } : {}),
      });
    const cream = mat("#fff0ce");
    const floorMat = mat("#bd8562", 0.9);
    const ink = mat("#202945", 0.5);
    const blue = mat("#2047df", 0.5);
    const lime = mat("#d8f568", 0.45);
    const orange = mat("#ff643b", 0.7);
    const gold = mat("#f7cf62", 0.25, 0.6);

    function add<T extends THREE.Object3D>(obj: T, parent: THREE.Object3D = world) {
      obj.traverse((o) => {
        if (o instanceof THREE.Mesh) {
          o.castShadow = true;
          o.receiveShadow = true;
        }
      });
      parent.add(obj);
      return obj;
    }
    function box(
      w: number,
      h: number,
      d: number,
      material: THREE.Material,
      x: number,
      y: number,
      z: number,
      radius = 0.05,
      parent: THREE.Object3D = world,
    ) {
      const mesh = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 3, radius), material);
      mesh.position.set(x, y, z);
      return add(mesh, parent);
    }
    function cylinder(
      rt: number,
      rb: number,
      h: number,
      material: THREE.Material,
      x: number,
      y: number,
      z: number,
      parent: THREE.Object3D = world,
    ) {
      const mesh = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, 48), material);
      mesh.position.set(x, y, z);
      return add(mesh, parent);
    }

    function groupInteractive(startIndex: number, panel: "chat" | "position" | "activity") {
      const group = new THREE.Group();
      group.userData.panel = panel;
      for (const object of world.children.slice(startIndex)) group.add(object);
      world.add(group);
      return group;
    }

    const labelTextures: THREE.CanvasTexture[] = [];
    function surfaceLabel(
      text: string,
      color: string,
      width: number,
      position: Vec,
      parent: THREE.Object3D,
      panel?: "guardian" | "position" | "activity",
    ) {
      const labelCanvas = document.createElement("canvas");
      labelCanvas.width = 1024;
      labelCanvas.height = 160;
      const context = labelCanvas.getContext("2d");
      const texture = new THREE.CanvasTexture(labelCanvas);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
      labelTextures.push(texture);
      function draw() {
        if (!context || disposed) return;
        const font =
          getComputedStyle(el as HTMLDivElement)
            .getPropertyValue("--font-display")
            .trim() || "sans-serif";
        context.clearRect(0, 0, 1024, 160);
        context.fillStyle = color;
        context.font = `800 100px ${font}`;
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.fillText(text, 512, 86, 940);
        texture.needsUpdate = true;
      }
      draw();
      void document.fonts.ready.then(draw);
      const label = new THREE.Mesh(
        new THREE.PlaneGeometry(width, (width * 160) / 1024),
        new THREE.MeshBasicMaterial({
          map: texture,
          transparent: true,
          toneMapped: false,
          depthWrite: false,
        }),
      );
      label.position.set(...position);
      if (panel) label.userData.panel = panel;
      else label.userData.pointerPassthrough = true;
      add(label, parent);
      label.castShadow = false;
      label.receiveShadow = false;
    }

    // Room shell
    box(12, 0.4, 11, floorMat, 0, -0.2, 0.5, 0.02);
    const wallMaterial = mat("#244d57", 0.85);
    box(12, 7.5, 0.3, wallMaterial, 0, 3.75, -3.75, 0.02);
    // Left wall surrounds a tall side window, leaving the opening clear.
    box(0.3, 0.65, 11, wallMaterial, -6, 0.325, 0.5, 0.02);
    box(0.3, 2.15, 11, wallMaterial, -6, 6.425, 0.5, 0.02);
    box(0.3, 4.7, 5.4, wallMaterial, -6, 3, 3.3, 0.02);
    box(0.3, 4.7, 2, wallMaterial, -6, 3, -4, 0.02);
    box(0.3, 7.5, 11, wallMaterial, 6, 3.75, 0.5, 0.02);
    box(12, 0.25, 0.3, cream, 0, 0.12, -3.5, 0.02);
    const rug = cylinder(2.7, 2.7, 0.05, blue, 0.2, 0.03, 0.4);
    rug.scale.z = 0.7;
    const rugInner = cylinder(2.2, 2.2, 0.06, mat("#3a5ef0", 0.8), 0.2, 0.04, 0.4);
    rugInner.scale.z = 0.7;

    // Wide wooden boards and lower wall panels give the room a tangible scale.
    const boardColors = ["#c89673", "#d09e7d", "#c28e69", "#d8a887"];
    for (let i = 0; i < 15; i++) {
      box(
        0.78,
        0.025,
        11,
        mat(boardColors[i % boardColors.length] ?? "#c89673", 0.95),
        -5.6 + i * 0.8,
        0.015,
        0.5,
        0.005,
      );
    }
    box(12, 1.05, 0.06, mat("#f4d8b6", 0.9), 0, 0.58, -3.55, 0.01);
    box(12, 0.08, 0.12, cream, 0, 1.14, -3.48, 0.01);
    for (let x = -5.6; x < 6; x += 1.4) box(0.055, 0.9, 0.045, cream, x, 0.59, -3.49, 0.005);
    // A few personal objects make this an office, not an empty showroom.
    const shelfWood = mat("#bf764e", 0.8);
    for (let level = 0; level < 2; level++) {
      box(2.1, 0.12, 0.48, shelfWood, -4.15, 3.2 + level * 0.8, -3.2, 0.025);
      for (let book = 0; book < 5; book++) {
        const bookMaterial = [blue, lime, cream, orange, ink][book % 5] ?? blue;
        box(
          0.18,
          0.38 + (book % 3) * 0.08,
          0.28,
          bookMaterial,
          -4.9 + book * 0.28,
          3.45 + level * 0.8,
          -3.2,
          0.015,
        );
      }
    }
    // The side window gives the front view a visible left-hand room corner.
    const sideWindow = new THREE.Group();
    sideWindow.position.set(-5.82, 3, -1.2);
    sideWindow.rotation.y = Math.PI / 2;
    world.add(sideWindow);
    const glass = box(3.6, 4.7, 0.06, mat("#78bdcd", 0.85), 0, 0, 0, 0.01, sideWindow);
    glass.castShadow = false;
    new THREE.TextureLoader().load(
      "/play/window-garden.webp",
      (texture) => {
        if (disposed) {
          texture.dispose();
          return;
        }
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
        const image = texture.image as HTMLImageElement;
        const sourceAspect = image.width / image.height;
        const windowAspect = 3.6 / 4.7;
        if (sourceAspect > windowAspect) {
          texture.repeat.x = windowAspect / sourceAspect;
          texture.offset.x = (1 - texture.repeat.x) / 2;
        } else {
          texture.repeat.y = sourceAspect / windowAspect;
          texture.offset.y = (1 - texture.repeat.y) / 2;
        }
        const scenery = new THREE.Mesh(
          new THREE.PlaneGeometry(3.6, 4.7),
          new THREE.MeshBasicMaterial({ map: texture, toneMapped: false }),
        );
        scenery.position.z = 0.045;
        sideWindow.add(scenery);
      },
      undefined,
      () => {
        if (!disposed) setAssetError("Couldn't load the garden view. Reload to retry.");
      },
    );
    for (const x of [-1.84, 1.84]) box(0.13, 4.85, 0.18, cream, x, 0, 0.09, 0.015, sideWindow);
    for (const y of [-2.4, 2.4]) box(3.8, 0.13, 0.2, cream, 0, y, 0.09, 0.015, sideWindow);
    box(0.09, 4.7, 0.16, cream, 0, 0, 0.1, 0.01, sideWindow);
    box(3.6, 0.09, 0.16, cream, 0, -0.25, 0.1, 0.01, sideWindow);
    for (let i = 0; i < 5; i++)
      box(3.7, 0.09, 0.28, shelfWood, 0, 2.18 - i * 0.15, 0.2, 0.015, sideWindow);

    // Framed financial artwork sits behind the character rather than another rear window.
    const artX = -0.9;
    const artY = 3.7;
    box(2.8, 2.0, 0.08, mat("#78bdcd", 0.85), artX, artY, -3.58, 0.01);
    [0.65, 1.2, 0.9, 1.45, 1.7, 1.1].forEach((height, i) => {
      box(0.32, height, 0.06, ink, artX - 1.12 + i * 0.45, artY - 1 + height / 2, -3.52, 0.01);
    });
    for (const y of [artY - 1.06, artY + 1.06]) box(2.96, 0.12, 0.16, cream, artX, y, -3.52, 0.02);
    for (const x of [artX - 1.45, artX + 1.45]) box(0.12, 2.2, 0.16, cream, x, artY, -3.52, 0.02);

    // Raised lettering above the vault, using the same display font as the UI.
    const wordmarkFont = new FontLoader().parse(wordmarkTypeface);
    const lettering = new THREE.Group();
    const letterMaterials = [mat("#fff8e7", 0.42, 0.12), mat("#b0c77c", 0.6, 0.12)];
    const textOptions = {
      font: wordmarkFont,
      depth: 0.18,
      curveSegments: 8,
      bevelEnabled: true,
      bevelThickness: 0.015,
      bevelSize: 0.012,
      bevelSegments: 2,
    };
    const wordmarkGeometry = new TextGeometry("mr.fund", { ...textOptions, size: 1 });
    wordmarkGeometry.computeBoundingBox();
    const wordmark = new THREE.Mesh(wordmarkGeometry, letterMaterials);
    lettering.add(wordmark);
    const registration = new THREE.Mesh(
      new TextGeometry("®", { ...textOptions, size: 0.18 }),
      letterMaterials,
    );
    registration.position.set((wordmarkGeometry.boundingBox?.max.x ?? 4) + 0.08, 0.57, 0);
    lettering.add(registration);
    const letterBounds = new THREE.Box3().setFromObject(lettering);
    const letterCenter = letterBounds.getCenter(new THREE.Vector3());
    const letterScale = 2.8 / (letterBounds.max.x - letterBounds.min.x);
    lettering.scale.setScalar(letterScale);
    lettering.position.set(
      -4.0 - letterCenter.x * letterScale,
      5.2 - letterCenter.y * letterScale,
      -3.57,
    );
    lettering.userData.pointerPassthrough = true;
    add(lettering);

    // Health wall chart (lit by the simulated health)
    const chartStart = world.children.length;
    const healthFrame = box(2.7, 1.95, 0.12, ink, 2.1, 3.7, -3.55, 0.04);
    healthFrame.userData.panel = "position";
    surfaceLabel("POSITION", "#dbf884", 1.85, [2.1, 4.37, -3.482], world, "position");
    const segments: THREE.MeshStandardMaterial[] = [];
    for (let i = 0; i < SEGMENTS; i++) {
      const segMat = mat("#3a4250", 0.6);
      segments.push(segMat);
      const height = 0.3 + i * 0.1;
      box(0.16, height, 0.06, segMat, 1.0 + 0.24 + i * 0.22, 2.95 + height / 2, -3.46, 0.02);
    }
    box(2.4, 0.04, 0.05, mat("#ff8d70", 0.65), 2.1, 3.2, -3.44, 0.01);

    const chartGroup = groupInteractive(chartStart, "position");

    // Ledger board (lights one row per recorded demo event)
    const ledgerStart = world.children.length;
    const ledgerFrame = box(2.3, 2.9, 0.12, cream, 4.8, 3.3, -3.55, 0.05);
    ledgerFrame.userData.panel = "activity";
    box(2.0, 0.34, 0.08, blue, 4.8, 4.45, -3.48, 0.03);
    surfaceLabel("ACTIVITY", "#fff8e7", 1.7, [4.8, 4.45, -3.432], world, "activity");
    const rows: THREE.MeshStandardMaterial[] = [];
    for (let i = 0; i < ROWS; i++) {
      const rowMat = mat("#e3dac2", 0.7);
      rows.push(rowMat);
      box(1.8, 0.2, 0.05, rowMat, 4.8, 3.95 - i * 0.37, -3.47, 0.02);
    }

    const ledgerGroup = groupInteractive(ledgerStart, "activity");

    // Imported furniture keeps the user's original textures and proportions.
    const furnitureLoader = new GLTFLoader();
    function loadFurniture(
      url: string,
      label: string,
      parent: THREE.Object3D,
      height: number,
      position: Vec,
      rotationY = 0,
      ready?: (fit: ReturnType<typeof fitRoomFurniture>) => void,
      referenceName?: string,
    ) {
      furnitureLoader.load(
        url,
        (gltf) => {
          if (disposed) {
            gltf.scene.traverse((object) => {
              if (!(object instanceof THREE.Mesh)) return;
              object.geometry.dispose();
              for (const material of Array.isArray(object.material)
                ? object.material
                : [object.material]) {
                for (const value of Object.values(material))
                  if (value instanceof THREE.Texture) value.dispose();
                material.dispose();
              }
            });
            return;
          }
          try {
            const fit = fitRoomFurniture(gltf.scene, height, rotationY, referenceName);
            fit.group.position.set(...position);
            fit.group.traverse((object) => {
              if (!(object instanceof THREE.Mesh)) return;
              object.castShadow = true;
              object.receiveShadow = true;
              for (const material of Array.isArray(object.material)
                ? object.material
                : [object.material]) {
                if (material instanceof THREE.MeshStandardMaterial && material.map)
                  material.map.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
              }
            });
            parent.add(fit.group);
            ready?.(fit);
          } catch {
            setAssetError(`Couldn't place the ${label}. Reload to retry.`);
          }
        },
        undefined,
        () => {
          if (!disposed) setAssetError(`Couldn't load the ${label}. Reload to retry.`);
        },
      );
    }
    const vault = new THREE.Group();
    let safeDoorMotion: ReturnType<typeof createSafeDoorMotion> | null = null;
    vault.position.set(-4.0, 0.05, -1.65);
    vault.rotation.y = 0.2;
    vault.userData.panel = "guardian";
    world.add(vault);
    const lampMat = mat("#6b7280", 0.4, 0, "#6b7280", 0.15);
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.085, 20, 14), lampMat);
    lamp.visible = false;
    add(lamp, vault);
    const safeHeight = 2.4;
    loadFurniture(
      "/brankas/simple_safe.glb",
      "safe",
      vault,
      safeHeight,
      [0, 0, 0],
      0,
      (fit) => {
        safeDoorMotion = createSafeDoorMotion(fit.group);
        surfaceLabel(
          "GUARDIAN",
          "#dbf884",
          Math.min(1.68, fit.width * 0.7),
          [0, safeHeight - 0.17, fit.depth / 2 + 0.012],
          vault,
          "guardian",
        );
        lamp.position.set(fit.width / 2 - 0.17, safeHeight - 0.16, fit.depth / 2 + 0.04);
        lamp.scale.setScalar(safeHeight / 2.9);
        lamp.visible = true;
      },
      "Object_5",
    );

    // The complete workstation remains one clickable Chat target.
    const deskGroup = new THREE.Group();
    deskGroup.userData.panel = "chat";
    world.add(deskGroup);
    loadFurniture(
      "/office%20table/office_desk.glb",
      "desk",
      deskGroup,
      1.5,
      [3.6, 0.05, -1.0],
      -Math.PI / 2,
    );
    loadFurniture(
      "/office%20chair/office_chair.glb",
      "chair",
      deskGroup,
      2.25,
      [3.45, 0.05, -2.3],
      -0.12,
    );
    const laptop = box(0.9, 0.58, 0.05, ink, 3.35, 1.89, -0.65, 0.02, deskGroup);
    laptop.rotation.x = -0.15;
    const screenMat = mat("#284bdf", 0.7, 0, "#284bdf", 0.1);
    const laptopScreen = box(0.78, 0.46, 0.015, screenMat, 3.35, 1.89, -0.62, 0.005, deskGroup);
    laptopScreen.rotation.x = -0.15;
    const keyboard = box(0.94, 0.04, 0.6, ink, 3.35, 1.57, -0.4, 0.02, deskGroup);
    const logo = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.018, 8, 32), lime);
    logo.position.set(3.35, 1.89, -0.59);
    add(logo, deskGroup);
    const laptopRig = new THREE.Group();
    laptopRig.position.set(3.35, 0, -0.65);
    deskGroup.add(laptopRig);
    for (const part of [laptop, laptopScreen, keyboard, logo]) laptopRig.attach(part);
    laptopRig.rotation.y = Math.PI;

    cylinder(0.12, 0.1, 0.23, orange, 4.6, 1.67, -0.3, deskGroup);
    const handle = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.022, 8, 20), orange);
    handle.position.set(4.72, 1.68, -0.3);
    add(handle, deskGroup);

    // Plant and coin stack
    cylinder(0.34, 0.26, 0.55, ink, -2.1, 0.28, -2.6);
    const stem = cylinder(0.025, 0.025, 1.3, lime, -2.1, 1.2, -2.6);
    stem.rotation.z = 0.1;
    for (let i = 0; i < 7; i++) {
      const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 10), lime);
      const sign = i % 2 ? -1 : 1;
      leaf.scale.set(1.3, 0.38, 0.65);
      leaf.rotation.z = sign * 0.5;
      leaf.position.set(-2.1 + sign * 0.2, 0.95 + i * 0.14, -2.6);
      add(leaf);
    }
    for (let i = 0; i < 4; i++) cylinder(0.25, 0.25, 0.1, gold, 1.0, 0.1 + i * 0.11, 1.5);

    // Character
    let characterMotion: ReturnType<typeof createRealisticCharacterMotion> = null;
    let character: THREE.Object3D | undefined;
    const journey = createRoomJourney();
    let seatedDrop = 0;
    let characterCenterX = 0;
    let baseY = 0;
    const characterManager = new THREE.LoadingManager();
    characterManager.onError = () => {
      if (!disposed) setAssetError("A character texture could not load. Please reload the page.");
    };
    new GLTFLoader(characterManager).load(
      "/play/jungle-jim/businessman.glb",
      (gltf) => {
        const model = gltf.scene;
        if (disposed) {
          model.traverse((obj) => {
            if (!(obj instanceof THREE.Mesh)) return;
            obj.geometry.dispose();
            for (const material of Array.isArray(obj.material) ? obj.material : [obj.material]) {
              for (const value of Object.values(material))
                if (value instanceof THREE.Texture) value.dispose();
              material.dispose();
            }
            if (obj instanceof THREE.SkinnedMesh) obj.skeleton.dispose();
          });
          return;
        }
        character = model;
        try {
          characterMotion = createRealisticCharacterMotion(character);
          if (!characterMotion) throw new Error("Missing Businessman skeleton");
        } catch {
          setAssetError("Mr.Fund's animation controls could not load. Please reload the page.");
        }
        character.updateMatrixWorld(true);
        character.traverse((obj) => {
          if (!(obj instanceof THREE.Mesh)) return;
          obj.castShadow = true;
          obj.receiveShadow = true;
          if (obj instanceof THREE.SkinnedMesh) {
            obj.computeBoundingBox();
            obj.computeBoundingSphere();
            obj.frustumCulled = false;
          }
          for (const material of Array.isArray(obj.material) ? obj.material : [obj.material]) {
            if (!(material instanceof THREE.MeshStandardMaterial)) continue;
            // Preserve the original skin, fabric and normal textures.
            if (material.map)
              material.map.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
            if (material.transparent) {
              material.alphaTest = 0.35;
              material.depthWrite = true;
            }
          }
        });
        const bounds = new THREE.Box3().setFromObject(character, true);
        const scale = 3.9 / (bounds.max.y - bounds.min.y);
        character.scale.setScalar(scale);
        baseY = 0.05 - bounds.min.y * scale;
        characterCenterX = (-(bounds.min.x + bounds.max.x) * scale) / 2;
        character.position.set(characterCenterX, baseY, 1.6);
        world.add(character);
        character.updateMatrixWorld(true);
        const hip = character.getObjectByName("Hips");
        if (hip) seatedDrop = Math.max(0, hip.getWorldPosition(new THREE.Vector3()).y - 1.1);
        setState("ready");
      },
      undefined,
      () => {
        if (!disposed) setState("fallback");
      },
    );

    // Wall tools get a crisp frame edge as well as the silhouette pass.
    const boardAccents = new Map<
      THREE.Object3D,
      { material: THREE.MeshStandardMaterial; edge: THREE.LineSegments }
    >();
    function boardAccent(root: THREE.Object3D, frame: THREE.Mesh) {
      const original = frame.material;
      if (!(original instanceof THREE.MeshStandardMaterial)) return;
      const material = original.clone();
      frame.material = material;
      const edge = new THREE.LineSegments(
        new THREE.EdgesGeometry(frame.geometry, 35),
        new THREE.LineBasicMaterial({
          color: "#dbf884",
          transparent: true,
          opacity: 1,
          depthTest: false,
          toneMapped: false,
        }),
      );
      edge.visible = false;
      edge.renderOrder = 1000;
      // An accent line is visual feedback, never another pointer target.
      edge.raycast = () => {};
      frame.add(edge);
      boardAccents.set(root, { material, edge });
    }
    boardAccent(chartGroup, healthFrame);
    boardAccent(ledgerGroup, ledgerFrame);

    // Only hovered silhouettes receive the outline glow. No scene-wide bloom is used.
    const hoverTarget = new THREE.WebGLRenderTarget(1, 1, {
      type: THREE.HalfFloatType,
      samples: 4,
    });
    const hoverComposer = new EffectComposer(renderer, hoverTarget);
    hoverComposer.setPixelRatio(pixelRatio);
    const scenePass = new RenderPass(scene, camera);
    const outline = new OutlinePass(new THREE.Vector2(1, 1), scene, camera);
    outline.visibleEdgeColor.set("#dbf884");
    outline.hiddenEdgeColor.set("#000000");
    outline.edgeStrength = 4;
    outline.edgeThickness = 1.8;
    outline.edgeGlow = 0.55;
    outline.pulsePeriod = 0;
    const output = new OutputPass();
    hoverComposer.addPass(scenePass);
    hoverComposer.addPass(outline);
    hoverComposer.addPass(output);

    let width = 1;
    let height = 1;
    const resize = new ResizeObserver(() => {
      width = Math.max(el.clientWidth, 1);
      height = Math.max(el.clientHeight, 1);
      camera.aspect = width / height;
      renderer.setSize(width, height, false);
      hoverComposer.setSize(width, height);
      camera.updateProjectionMatrix();
    });
    resize.observe(el);

    let visible = true;
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry?.isIntersecting ?? true;
    });
    observer.observe(el);

    // Hover and clicks share one occlusion-aware hit test, including all prop parts.
    const pointer = new THREE.Vector2();
    const smoothPointer = new THREE.Vector2();
    const still = new THREE.Vector2();
    const raycaster = new THREE.Raycaster();
    const ndc = new THREE.Vector2();
    const propRoots = {
      guardian: vault,
      position: chartGroup,
      activity: ledgerGroup,
      chat: deskGroup,
    };
    const pointerTargets: THREE.Object3D[] = Object.values(propRoots);
    let overCanvas = false;
    let hovered: THREE.Object3D | null = null;
    function hitInteractive() {
      raycaster.setFromCamera(ndc, camera);
      if (character && pointerTargets.length === 4) pointerTargets.push(character);
      return pickRoomTarget(raycaster.intersectObjects(pointerTargets, true), propRoots, character);
    }
    function selectHover(root: THREE.Object3D | null) {
      if (root === hovered) return;
      const previousAccent = hovered ? boardAccents.get(hovered) : undefined;
      if (previousAccent) {
        previousAccent.edge.visible = false;
        previousAccent.material.emissive.set("#000000");
        previousAccent.material.emissiveIntensity = 0;
      }
      hovered = root;
      const nextAccent = root ? boardAccents.get(root) : undefined;
      if (nextAccent) {
        nextAccent.edge.visible = true;
        nextAccent.material.emissive.set("#a6d94b");
        nextAccent.material.emissiveIntensity = 0.3;
      }
      outline.selectedObjects = root ? [root] : [];
      renderer.domElement.style.cursor = root ? "pointer" : "";
    }
    const clearHover = () => {
      overCanvas = false;
      selectHover(null);
    };
    const onMove = (event: PointerEvent) => {
      pointer.set(
        (event.clientX / window.innerWidth) * 2 - 1,
        -(event.clientY / window.innerHeight) * 2 + 1,
      );
      ndc.copy(pointer);
      overCanvas = event.target === renderer.domElement && event.pointerType !== "touch";
      if (!overCanvas) selectHover(null);
    };
    const onDown = (event: PointerEvent) => {
      if (event.target !== renderer.domElement) return;
      ndc.set(
        (event.clientX / window.innerWidth) * 2 - 1,
        -(event.clientY / window.innerHeight) * 2 + 1,
      );
      const hit = hitInteractive();
      if (hit?.action === "wave") live.current.onWave();
      else if (hit) live.current.onInteract(hit.action);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("blur", clearHover);
    renderer.domElement.addEventListener("pointerleave", clearHover);

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const camPos = new THREE.Vector3(...STATIONS.office.pos);
    const camLook = new THREE.Vector3(...STATIONS.office.target);
    const wantPos = new THREE.Vector3();
    const wantLook = new THREE.Vector3();
    const offset = new THREE.Vector3();
    const stationVec = new THREE.Vector3();
    let shift = 0;
    let frame = 0;
    let previous = 0;
    let elapsed = 0;
    let lastLit = -1;
    let lastRows = -1;
    let lastLamp = "";

    function render(time: number) {
      frame = requestAnimationFrame(render);
      const delta = Math.min((time - previous) / 1000, 0.05);
      previous = time;
      if (!visible || document.hidden) return;
      const p = live.current;
      const calm = reduced.matches;
      elapsed += delta;

      // Camera glides between stations; narrow screens pull back to fit the character
      const walkingToChat =
        p.station === "chat" &&
        (journey.frame.phase === "walking" ||
          journey.frame.phase === "standing" ||
          journey.frame.phase === "idle");
      const stationName = walkingToChat ? "office" : p.station;
      const station = STATIONS[stationName];
      wantLook.set(...station.target);
      if (height <= 600 && stationName === "office") wantLook.y -= 0.25;
      stationVec.set(...station.pos).sub(wantLook);
      const viewHeight =
        2 * stationVec.length() * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
      const framing = officeFraming(width, height, p.panelOpen, stationName, viewHeight);
      stationVec.multiplyScalar(framing.pull);
      wantPos.copy(wantLook).add(stationVec);
      const k = calm ? 1 : 1 - Math.exp(-delta * 3);
      camPos.lerp(wantPos, k);
      camLook.lerp(wantLook, k);
      smoothPointer.lerp(calm ? still : pointer, 1 - Math.exp(-delta * 4));
      offset.set(smoothPointer.x * 0.5, smoothPointer.y * 0.22, 0);
      camera.position.copy(camPos).add(offset);
      camera.lookAt(camLook);
      const wantShift = framing.shift;
      shift += (wantShift - shift) * k;
      if (Math.abs(shift) > 0.001)
        camera.setViewOffset(width, height, shift * width, 0, width, height);
      else camera.clearViewOffset();

      // Data-driven set dressing
      const lit = litSegments(p.healthBps);
      if (lit !== lastLit) {
        lastLit = lit;
        segments.forEach((segment, i) => {
          const on = i < lit;
          const color = i < 3 ? "#ff7a5c" : i < 6 ? "#ffc95c" : "#dbf884";
          segment.color.set(on ? color : "#3a4250");
          segment.emissive.set(on ? color : "#000000");
          segment.emissiveIntensity = on ? 0.12 : 0;
        });
      }
      const rowCount = Math.min(p.activityCount, ROWS);
      if (rowCount !== lastRows) {
        lastRows = rowCount;
        rows.forEach((row, i) => {
          const on = i < rowCount;
          row.color.set(on ? "#dbf884" : "#e3dac2");
          row.emissive.set(on ? "#b7e64a" : "#000000");
          row.emissiveIntensity = on ? 0.08 : 0;
        });
      }
      const lampStyle = LAMP[p.guardian];
      if (p.guardian !== lastLamp) {
        lastLamp = p.guardian;
        lampMat.color.set(lampStyle.color);
        lampMat.emissive.set(lampStyle.color);
      }
      lampMat.emissiveIntensity =
        p.guardian === "active" && !calm
          ? lampStyle.level + Math.sin(elapsed * 3) * 0.08
          : lampStyle.level;

      if (character) {
        const completed = journey.update(delta, p.visit, calm);
        const travel = journey.frame;
        characterMotion?.update(
          delta,
          p.wave,
          calm,
          p.mood,
          travel.phase === "idle" ? smoothPointer.x : 0,
          travel,
        );
        character.position.set(
          characterCenterX + travel.x,
          baseY - seatedDrop * travel.sit,
          travel.z,
        );
        character.rotation.set(0, travel.yaw, 0);
        safeDoorMotion?.setOpen(travel.door);
        if (completed !== null) p.onVisitReady(completed);
      }
      if (overCanvas) selectHover(hitInteractive()?.root ?? null);
      if (hovered) hoverComposer.render(delta);
      else renderer.render(scene, camera);
    }
    frame = requestAnimationFrame(render);

    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      resize.disconnect();
      observer.disconnect();
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("blur", clearHover);
      renderer.domElement.removeEventListener("pointerleave", clearHover);
      outline.dispose();
      output.dispose();
      scenePass.dispose();
      hoverComposer.dispose();
      const importedTextures = new Set<THREE.Texture>();
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose();
          if (obj instanceof THREE.SkinnedMesh) obj.skeleton.dispose();
          for (const material of Array.isArray(obj.material) ? obj.material : [obj.material]) {
            for (const value of Object.values(material))
              if (value instanceof THREE.Texture) importedTextures.add(value);
            material.dispose();
          }
        }
      });
      for (const texture of importedTextures) texture.dispose();
      for (const accent of boardAccents.values()) {
        accent.edge.geometry.dispose();
        const material = accent.edge.material;
        for (const item of Array.isArray(material) ? material : [material]) item.dispose();
      }
      for (const texture of labelTextures) texture.dispose();
      envMap.dispose();
      pmrem.dispose();

      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return (
    <div
      ref={host}
      role="img"
      aria-label="Interactive 3D office. Mr.Fund stands beside his desk; a vault shows the Guardian status, a wall chart shows position health and a board counts demo activity. Click Mr.Fund to wave."
      className="fixed inset-0 z-0 overflow-hidden bg-[#f3bca0]"
    >
      {assetError && (
        <span
          role="alert"
          className="absolute bottom-[170px] left-4 z-10 max-w-[280px] rounded-xl border border-[#d9b59f] bg-[#fff2df] px-4 py-3 text-xs text-[#81583e]"
        >
          {assetError}
        </span>
      )}
      {state === "loading" && (
        <span className="absolute bottom-[36%] left-0 w-full animate-pulse text-center text-[11px] font-semibold text-[#dcdfe6]">
          Mr.Fund is getting ready…
        </span>
      )}
      {state === "fallback" && (
        <div className="absolute inset-0">
          <Image
            fill
            priority
            sizes="100vw"
            src="/play/jungle-jim/preview.jpg"
            alt="Mr.Fund, a 3D character wearing a business suit"
            className="object-cover"
          />
          <span className="absolute bottom-[14px] left-[16px] rounded-[6px] bg-[#1c2331cc] px-[10px] py-[6px] text-[10px] text-white">
            3D preview unavailable on this device
          </span>
        </div>
      )}
    </div>
  );
}
