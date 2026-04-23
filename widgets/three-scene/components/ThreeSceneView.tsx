import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import type { Payload, SceneHandle } from "../types.js";

interface Props {
  data: Payload;
}

function disposeScene(scene: THREE.Scene): void {
  scene.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (mesh.geometry && typeof mesh.geometry.dispose === "function") {
      mesh.geometry.dispose();
    }
    const material = mesh.material as THREE.Material | THREE.Material[] | undefined;
    if (Array.isArray(material)) {
      for (const m of material) m.dispose();
    } else if (material && typeof material.dispose === "function") {
      material.dispose();
    }
  });
  scene.clear();
}

export function ThreeSceneView({ data }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [runtimeError, setRuntimeError] = useState<string | null>(null);
  const signature = JSON.stringify(data);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    setRuntimeError(null);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(data.background ?? "#f5f5f4");

    const width = Math.max(container.clientWidth || 1, 1);
    const height = Math.max(container.clientHeight || 1, 1);

    const camera = new THREE.PerspectiveCamera(data.cameraFov ?? 50, width / height, 0.1, 2000);
    const [cx, cy, cz] = data.cameraPosition ?? [0, 0, 5];
    camera.position.set(cx, cy, cz);
    const [lx, ly, lz] = data.cameraLookAt ?? [0, 0, 0];
    camera.lookAt(lx, ly, lz);

    // Default 5-light rig tuned for three.js r155+ physically-correct lighting.
    // clearLights skips this for particle / additive / unlit scenes where the
    // lights would either be ignored or wash out the effect.
    if (!data.clearLights) {
      scene.add(new THREE.HemisphereLight(0xffffff, 0xd4d4d4, 1.2));
      scene.add(new THREE.AmbientLight(0xffffff, 0.8));
      const key = new THREE.DirectionalLight(0xffffff, 2.4);
      key.position.set(4, 6, 4);
      scene.add(key);
      const fill = new THREE.DirectionalLight(0xffffff, 1.2);
      fill.position.set(-5, 2, -3);
      scene.add(fill);
      const rim = new THREE.DirectionalLight(0xffffff, 0.8);
      rim.position.set(0, -4, -2);
      scene.add(rim);
    }

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    renderer.setSize(width, height, false);
    const canvas = renderer.domElement;
    canvas.style.display = "block";
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    container.appendChild(canvas);

    let handle: SceneHandle | void = undefined;
    try {
      const fn = new Function("THREE", "scene", "camera", "renderer", data.code) as (
        THREE_: typeof THREE,
        scene: THREE.Scene,
        camera: THREE.PerspectiveCamera,
        renderer: THREE.WebGLRenderer,
      ) => SceneHandle | void;
      handle = fn(THREE, scene, camera, renderer);
    } catch (err) {
      setRuntimeError(err instanceof Error ? err.message : String(err));
    }

    const autoRotate = data.autoRotate !== false;
    const rotAxis = data.autoRotateAxis ?? "y";
    const rotSpeed = data.autoRotateSpeed ?? 0.4;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.1);
      last = now;
      if (autoRotate) {
        scene.rotation[rotAxis] += dt * rotSpeed;
      }
      try {
        if (handle && typeof handle === "object" && typeof handle.tick === "function") {
          handle.tick(dt);
        }
      } catch (err) {
        setRuntimeError(err instanceof Error ? err.message : String(err));
      }
      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    const ro = new ResizeObserver(() => {
      const w = Math.max(container.clientWidth || 1, 1);
      const h = Math.max(container.clientHeight || 1, 1);
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    });
    ro.observe(container);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      try {
        if (handle && typeof handle === "object" && typeof handle.dispose === "function") {
          handle.dispose();
        }
      } catch {
        // ignore user dispose errors during teardown
      }
      disposeScene(scene);
      renderer.dispose();
      if (canvas.parentNode === container) {
        container.removeChild(canvas);
      }
    };
    // Re-init on any payload change — arrays would break referential deps,
    // and the scene init is cheap enough that JSON signature is fine.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature]);

  return (
    <div className="flex h-full min-h-[300px] w-full flex-col gap-2 p-3">
      {data.title && (
        <div className="text-sm font-medium text-ink/80 dark:text-white/80">{data.title}</div>
      )}
      <div
        ref={containerRef}
        className="relative min-h-[280px] w-full flex-1 overflow-hidden rounded-brand bg-neutral-100 dark:bg-neutral-900"
      />
      {runtimeError && (
        <div className="whitespace-pre-wrap rounded-brand border border-red-300 bg-red-50 p-2 font-mono text-xs text-red-700 dark:border-red-500/40 dark:bg-red-950/40 dark:text-red-300">
          {runtimeError}
        </div>
      )}
    </div>
  );
}
