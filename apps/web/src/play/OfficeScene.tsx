"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

export function OfficeScene({ mood, wave }: { mood: string; wave: number }) {
  const host = useRef<HTMLDivElement>(null);
  const moodRef = useRef(mood);
  const waveRef = useRef(wave);
  const [state, setState] = useState("loading");
  useEffect(() => {
    moodRef.current = mood;
  }, [mood]);
  useEffect(() => {
    waveRef.current = wave;
  }, [wave]);
  useEffect(() => {
    const el = host.current;
    if (!el) return;
    let disposed = false;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: "low-power",
      });
    } catch {
      setState("fallback");
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.7));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.3;
    renderer.setClearColor(0x000000, 0);
    el.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-4, 4, 3, -3, 0.1, 100);
    camera.position.set(5.5, 4.5, 9);
    camera.lookAt(0, 1.45, 0);
    const studio = new THREE.Group();
    scene.add(studio);
    scene.add(new THREE.AmbientLight(0xffeee2, 2.2));
    const sun = new THREE.DirectionalLight(0xffffff, 4);
    sun.position.set(-3, 8, 6);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.camera.left = -5;
    sun.shadow.camera.right = 5;
    sun.shadow.camera.top = 6;
    sun.shadow.camera.bottom = -4;
    sun.shadow.normalBias = 0.04;
    scene.add(sun);
    const fill = new THREE.DirectionalLight(0xbac7ff, 2);
    fill.position.set(5, 3, -2);
    scene.add(fill);
    const mat = (color: string, roughness = 0.5, metalness = 0) =>
      new THREE.MeshStandardMaterial({ color, roughness, metalness });
    const cream = mat("#fff0ce"),
      ink = mat("#202945"),
      blue = mat("#2047df"),
      lime = mat("#d8f568"),
      orange = mat("#ff8b51"),
      gold = mat("#f7cf62", 0.25, 0.5);
    function box(
      w: number,
      h: number,
      d: number,
      material: THREE.Material,
      x: number,
      y: number,
      z: number,
      radius = 0.08,
    ) {
      const obj = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 3, radius), material);
      obj.position.set(x, y, z);
      obj.castShadow = true;
      obj.receiveShadow = true;
      studio.add(obj);
      return obj;
    }
    function cylinder(
      rt: number,
      rb: number,
      h: number,
      material: THREE.Material,
      x: number,
      y: number,
      z: number,
    ) {
      const obj = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, 48), material);
      obj.position.set(x, y, z);
      obj.castShadow = true;
      obj.receiveShadow = true;
      studio.add(obj);
      return obj;
    }
    const platform = cylinder(2.6, 2.6, 0.28, cream, 0, 0, 0);
    platform.scale.z = 0.8;
    cylinder(2.4, 2.4, 0.18, orange, 0, -0.2, 0).scale.z = 0.8;
    box(2.1, 0.18, 1.12, cream, 1.15, 1.35, 0.35);
    box(0.14, 1.15, 0.8, blue, 0.4, 0.7, 0.35);
    box(0.14, 1.15, 0.8, blue, 1.9, 0.7, 0.35);
    const laptop = box(0.82, 0.53, 0.05, ink, 1.18, 1.72, 0.45);
    laptop.rotation.x = -0.15;
    box(0.72, 0.43, 0.015, blue, 1.18, 1.72, 0.485).rotation.x = -0.15;
    box(0.86, 0.04, 0.6, ink, 1.18, 1.46, 0.72);
    const logo = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.018, 8, 32), lime);
    logo.position.set(1.18, 1.73, 0.51);
    studio.add(logo);
    cylinder(0.12, 0.1, 0.23, orange, 1.94, 1.56, 0.7);
    const mugHandle = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.022, 8, 20), orange);
    mugHandle.position.set(2.06, 1.57, 0.7);
    studio.add(mugHandle);
    cylinder(0.32, 0.24, 0.5, ink, -1.83, 0.4, -0.3);
    const stem = cylinder(0.025, 0.025, 1.15, lime, -1.83, 1.15, -0.3);
    stem.rotation.z = 0.1;
    for (let i = 0; i < 6; i++) {
      const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 10), lime);
      const sign = i % 2 ? -1 : 1;
      leaf.scale.set(1.3, 0.38, 0.65);
      leaf.rotation.z = sign * 0.5;
      leaf.position.set(-1.83 + sign * 0.18, 0.9 + i * 0.13, -0.3);
      leaf.castShadow = true;
      studio.add(leaf);
    }
    for (let i = 0; i < 3; i++) cylinder(0.23, 0.23, 0.095, gold, 0.3, 0.24 + i * 0.105, 1.15);
    const floatingCoin = cylinder(0.36, 0.36, 0.12, gold, -1.8, 2.7, 0.1);
    floatingCoin.rotation.x = Math.PI / 2;
    floatingCoin.rotation.z = -0.3;
    const coinMark = box(0.07, 0.35, 0.02, cream, -1.8, 2.7, 0.18, 0.01);
    coinMark.rotation.z = -0.3;
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.11, 12, 60), lime);
    ring.position.set(1.7, 2.6, -0.4);
    ring.rotation.set(0.3, 0.5, -0.2);
    studio.add(ring);
    let mixer: THREE.AnimationMixer | undefined;
    let idle: THREE.AnimationAction | undefined;
    let greeting: THREE.AnimationAction | undefined;
    let character: THREE.Object3D | undefined;
    const loader = new GLTFLoader();
    loader.load(
      "/play/business-man.glb",
      (gltf) => {
        if (disposed) return;
        character = gltf.scene;
        const bounds = new THREE.Box3().setFromObject(character);
        const height = bounds.max.y - bounds.min.y;
        const size = 3.25 / height;
        character.scale.setScalar(size);
        character.position.set(-0.55, 0.14 - bounds.min.y * size, -0.2);
        character.rotation.y = 0.25;
        character.traverse((obj) => {
          if (obj instanceof THREE.Mesh) {
            obj.castShadow = true;
            obj.receiveShadow = true;
            const materials = Array.isArray(obj.material) ? obj.material : [obj.material];
            for (const m of materials) {
              if (m instanceof THREE.MeshStandardMaterial) {
                m.roughness = 0.72;
                if (m.name === "Suit") m.color.set("#172550");
                if (m.name === "Tie") m.color.set("#dcf66b");
                if (m.name === "White") m.color.set("#fff8e8");
                if (m.name === "Skin") m.color.set("#e9aa7c");
              }
            }
          }
        });
        studio.add(character);
        mixer = new THREE.AnimationMixer(character);
        const idleClip =
          gltf.animations.find((a) => a.name.endsWith("|Idle_Neutral")) ??
          gltf.animations.find((a) => a.name.endsWith("|Idle"));
        const waveClip = gltf.animations.find((a) => a.name.endsWith("|Wave"));
        if (idleClip) {
          idle = mixer.clipAction(idleClip);
          idle.play();
        }
        if (waveClip) {
          greeting = mixer.clipAction(waveClip);
          greeting.setLoop(THREE.LoopOnce, 1);
          greeting.clampWhenFinished = true;
        }
        setState("ready");
      },
      undefined,
      () => {
        if (!disposed) setState("fallback");
      },
    );
    const resize = new ResizeObserver(() => {
      const w = el.clientWidth,
        h = el.clientHeight;
      const aspect = w / Math.max(h, 1),
        half = 2.3;
      camera.left = -half * aspect;
      camera.right = half * aspect;
      camera.top = half;
      camera.bottom = -half;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
    });
    resize.observe(el);
    let visible = true;
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry?.isIntersecting ?? true;
    });
    observer.observe(el);
    let dragging = false,
      previousX = 0,
      targetRotation = -0.12;
    const down = (e: PointerEvent) => {
      dragging = true;
      previousX = e.clientX;
      el.setPointerCapture(e.pointerId);
    };
    const move = (e: PointerEvent) => {
      if (dragging) {
        targetRotation = THREE.MathUtils.clamp(
          targetRotation + (e.clientX - previousX) * 0.004,
          -0.6,
          0.5,
        );
        previousX = e.clientX;
      }
    };
    const up = () => {
      dragging = false;
    };
    el.addEventListener("pointerdown", down);
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0,
      previous = 0,
      elapsed = 0,
      lastWave = 0,
      waveUntil = 0;
    function render(time: number) {
      frame = requestAnimationFrame(render);
      const delta = Math.min((time - previous) / 1000, 0.05);
      previous = time;
      if (!visible || document.hidden) return;
      elapsed += delta;
      studio.rotation.y += (targetRotation - studio.rotation.y) * 0.08;
      if (!reduced.matches) {
        mixer?.update(delta);
        ring.position.y = 2.6 + Math.sin(elapsed * 1.5) * 0.07;
        ring.rotation.y = elapsed * 0.2;
        floatingCoin.position.y = 2.7 + Math.sin(elapsed * 1.5 + 1) * 0.07;
        coinMark.position.y = floatingCoin.position.y;
        if (character)
          character.rotation.y =
            0.25 + Math.sin(elapsed * 0.6) * (moodRef.current === "thinking" ? 0.08 : 0.025);
        if (waveRef.current !== lastWave && greeting && idle) {
          lastWave = waveRef.current;
          greeting.reset().play();
          idle.crossFadeTo(greeting, 0.25, false);
          waveUntil = elapsed + greeting.getClip().duration - 0.25;
        }
        if (waveUntil && elapsed >= waveUntil && greeting && idle) {
          idle.reset().play();
          greeting.crossFadeTo(idle, 0.25, false);
          waveUntil = 0;
        }
      }
      renderer.render(scene, camera);
    }
    frame = requestAnimationFrame(render);
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      resize.disconnect();
      observer.disconnect();
      mixer?.stopAllAction();
      el.removeEventListener("pointerdown", down);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up);
      el.removeEventListener("pointercancel", up);
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose();
          for (const material of Array.isArray(obj.material) ? obj.material : [obj.material])
            material.dispose();
        }
      });
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);
  return (
    <div
      className="office-scene absolute inset-[119px_-15px_7px] cursor-grab touch-pan-y [&:active]:cursor-grabbing [&_canvas]:w-full [&_canvas]:h-full [&_canvas]:block min-[1500px]:inset-[130px_-10px_10px] max-[820px]:inset-[113px_-70px_15px] max-[620px]:inset-[110px_-30px_5px]"
      ref={host}
      role="img"
      aria-label="Interactive 3D Mr.Fund in a navy suit, standing in his miniature office. Drag to rotate."
    >
      {state === "loading" && (
        <span className="scene-loading absolute top-[50%] w-full text-center text-[11px] text-[#713825]">
          Mr.Fund is straightening his tie<span className="loading-dots animate-pulse">...</span>
        </span>
      )}
      {state === "fallback" && (
        <div className="scene-fallback absolute inset-[30px_90px_70px] rounded-[15px] overflow-hidden [&_img]:w-full [&_img]:h-full [&_img]:object-cover [&_span]:absolute [&_span]:bottom-[7px] [&_span]:left-[10px] [&_span]:text-white [&_span]:text-[9px]">
          <Image
            width={709}
            height={418}
            src="/play/business-man-poster.webp"
            alt="Mr.Fund, a 3D character wearing a business suit"
          />
          <span>3D preview unavailable on this device</span>
        </div>
      )}
    </div>
  );
}
