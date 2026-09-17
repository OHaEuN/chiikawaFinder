'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { buildCharacter, type CharacterKey, type CharacterRig } from './characters';
import { poseAt, reactionAt, REACTION_SECONDS, restingPose } from './motions';
import { track } from '@/lib/analytics';

const ORDER: CharacterKey[] = ['chiikawa', 'hachiware', 'usagi'];
const SPACING = 2.7;
/** 캐릭터마다 동작이 겹치지 않게 시작 시점을 어긋나게 둔다. */
const PHASE: Record<CharacterKey, number> = { chiikawa: 0, hachiware: 0.45, usagi: 0.9 };

const NAME: Record<CharacterKey, string> = { chiikawa: '치이카와', hachiware: '하치와레', usagi: '우사기' };
const LINE: Record<CharacterKey, string> = {
  chiikawa: '와아…',
  hachiware: '어떻게든 되겠지!',
  usagi: '우라!',
};

interface Bubble {
  key: CharacterKey;
  x: number;
  y: number;
}

export default function HeroSceneInner() {
  const hostRef = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);
  const [bubble, setBubble] = useState<Bubble | null>(null);
  const [hovered, setHovered] = useState<CharacterKey | null>(null);

  const clearBubble = useCallback(() => setBubble(null), []);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch {
      setFailed(true);
      return;
    }

    // ?still 을 붙이면 정지 정면으로 그린다. 참조 사진과 대조할 때 쓴다.
    const still = new URLSearchParams(window.location.search).has('still');
    const reduceMotion = still || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.NoToneMapping;
    host.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
    camera.position.set(0, 0.35, 7.9);
    camera.lookAt(0, -0.1, 0);

    // 은은한 확산광을 주로 쓰고 직사광을 약하게 둬야 천처럼 보인다.
    scene.add(new THREE.HemisphereLight(0xffffff, 0xfff2e6, 1.55));
    const key = new THREE.DirectionalLight(0xfffaf2, 1.0);
    key.position.set(3.2, 6, 5);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.camera.near = 1;
    key.shadow.camera.far = 22;
    // 그림자 경계를 흐려 인형 같은 부드러움을 남긴다.
    key.shadow.radius = 6;
    key.shadow.bias = -0.0015;
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xf4f8ff, 0.4);
    fill.position.set(-4, 2.4, 3);
    scene.add(fill);
    // 뒤에서 옅게 비춰 테두리에 잔털이 선 듯한 빛을 남긴다.
    const rim = new THREE.DirectionalLight(0xffffff, 0.45);
    rim.position.set(-1.5, 2.2, -4);
    scene.add(rim);

    // 캐릭터가 떠 보이지 않게 그림자만 받는 바닥을 깐다.
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), new THREE.ShadowMaterial({ opacity: 0.12 }));
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -1.9;
    ground.receiveShadow = true;
    scene.add(ground);

    interface Entry {
      name: CharacterKey;
      rig: CharacterRig;
      /** 눌린 시각. 반응 애니메이션의 기준이 된다. */
      reactionStart: number;
    }

    const entries: Entry[] = ORDER.map((name, index) => {
      const rig = buildCharacter(name);
      rig.root.position.x = (index - 1) * SPACING;
      rig.root.traverse((object) => {
        if (object instanceof THREE.Mesh) object.castShadow = true;
      });
      scene.add(rig.root);
      return { name, rig, reactionStart: -Infinity };
    });

    // 포인터가 어느 캐릭터 위에 있는지 찾는다. 머리만 맞혀도 충분하다.
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2(0, 0);
    let pointerInside = false;
    let hoveredEntry: Entry | null = null;

    const pick = (): Entry | null => {
      if (!pointerInside) return null;
      raycaster.setFromCamera(pointer, camera);
      for (const entry of entries) {
        if (raycaster.intersectObject(entry.rig.root, true).length > 0) return entry;
      }
      return null;
    };

    const toLocal = (event: PointerEvent) => {
      const rect = host.getBoundingClientRect();
      pointer.set(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1);
    };

    const onPointerMove = (event: PointerEvent) => {
      pointerInside = true;
      toLocal(event);
    };
    const onPointerLeave = () => {
      pointerInside = false;
      hoveredEntry = null;
      setHovered(null);
    };
    const onPointerDown = (event: PointerEvent) => {
      toLocal(event);
      pointerInside = true;
      const entry = pick();
      if (!entry) return;
      entry.reactionStart = clock.getElapsedTime();
      const screen = entry.rig.root.position.clone();
      screen.y = 1.9;
      screen.project(camera);
      setBubble({
        key: entry.name,
        x: ((screen.x + 1) / 2) * 100,
        y: ((1 - screen.y) / 2) * 100,
      });
      track('hero_character_tap', { character: entry.name });
    };

    host.addEventListener('pointermove', onPointerMove);
    host.addEventListener('pointerleave', onPointerLeave);
    host.addEventListener('pointerdown', onPointerDown);

    /** 커서를 향해 고개를 조금 돌린다. 크게 돌리면 목이 꺾인 것처럼 보인다. */
    const lookTarget = new THREE.Vector3();
    const applyPose = (entry: Entry, time: number) => {
      const { name, rig } = entry;
      const base = reduceMotion ? restingPose() : poseAt(name, time + PHASE[name]);
      const burst = reduceMotion ? null : reactionAt(time - entry.reactionStart);

      const hop = base.hop + (burst?.hop ?? 0);
      const squash = base.squash + (burst?.squash ?? 0);
      const armLift = base.armLift + (burst?.armLift ?? 0);

      rig.body.position.y = hop;
      rig.body.rotation.z = base.tilt;
      rig.body.rotation.y = base.spin + (burst?.spin ?? 0);
      rig.body.scale.set(2 - squash, squash, 2 - squash);
      rig.leftArm.rotation.z = 0.32 + armLift;
      rig.rightArm.rotation.z = -0.32 - armLift;
      rig.leftEar.rotation.z = base.earSwing;
      rig.rightEar.rotation.z = -base.earSwing;
      rig.setCrying(base.crying);

      if (pointerInside && !reduceMotion) {
        raycaster.setFromCamera(pointer, camera);
        lookTarget.copy(raycaster.ray.direction).multiplyScalar(6).add(camera.position);
        const dx = lookTarget.x - rig.root.position.x;
        const dy = lookTarget.y - (rig.root.position.y + 1);
        rig.head.rotation.y = THREE.MathUtils.clamp(dx * 0.06, -0.3, 0.3);
        rig.head.rotation.x = THREE.MathUtils.clamp(-dy * 0.05, -0.16, 0.16);
      } else {
        rig.head.rotation.y *= 0.9;
        rig.head.rotation.x *= 0.9;
      }
      rig.head.rotation.z = base.tilt * -0.55;
    };

    const resize = () => {
      const { clientWidth, clientHeight } = host;
      if (!clientWidth || !clientHeight) return;
      renderer.setSize(clientWidth, clientHeight, false);
      camera.aspect = clientWidth / clientHeight;
      // 화면이 좁아지면 셋이 잘리므로 카메라를 뒤로 뺀다.
      camera.position.z = clientWidth < 520 ? 11 : 7.9;
      camera.updateProjectionMatrix();
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(host);

    const clock = new THREE.Clock();
    let frame = 0;
    const loop = () => {
      const time = clock.getElapsedTime();
      const next = pick();
      if (next !== hoveredEntry) {
        hoveredEntry = next;
        setHovered(next ? next.name : null);
      }
      entries.forEach((entry) => applyPose(entry, time));
      renderer.render(scene, camera);
      frame = requestAnimationFrame(loop);
    };
    loop();

    // 탭이 안 보이면 계속 그릴 이유가 없다.
    const onVisibility = () => {
      if (document.hidden) cancelAnimationFrame(frame);
      else loop();
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener('visibilitychange', onVisibility);
      host.removeEventListener('pointermove', onPointerMove);
      host.removeEventListener('pointerleave', onPointerLeave);
      host.removeEventListener('pointerdown', onPointerDown);
      observer.disconnect();
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
          const material = object.material;
          if (Array.isArray(material)) material.forEach((m) => m.dispose());
          else material.dispose();
        }
      });
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  useEffect(() => {
    if (!bubble) return;
    const timer = setTimeout(clearBubble, REACTION_SECONDS * 1000 + 900);
    return () => clearTimeout(timer);
  }, [bubble, clearBubble]);

  if (failed) return null;
  return (
    <div className={`hero-scene${hovered ? ' is-hover' : ''}`} ref={hostRef}>
      {bubble && (
        <span className="hero-bubble" style={{ left: `${bubble.x}%`, top: `${bubble.y}%` }}>
          {LINE[bubble.key]}
        </span>
      )}
      <span className="hero-hint" aria-live="polite">
        {hovered ? `${NAME[hovered]}를 눌러 보세요` : '눌러 보세요'}
      </span>
    </div>
  );
}
