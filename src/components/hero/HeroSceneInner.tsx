'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { buildCharacter, type CharacterKey, type CharacterRig } from './characters';
import { MAX_LIFT, poseAt, reactionAt, REACTION_SECONDS, restingPose } from './motions';
import { track } from '@/lib/analytics';

const ORDER: CharacterKey[] = ['chiikawa', 'hachiware', 'usagi'];
const FOV = 40;
/** 좌우 간격. 좁은 화면에서는 붙여 세워야 얼굴이 작아지지 않는다. */
const SPACING = 2.7;
const NARROW_SPACING = 2.15;
const NARROW_PX = 560;
/** 몸이 늘어나면서 머리가 조금 더 올라간다. 점프 높이와 별개로 잡는다. */
const STRETCH_MARGIN = 0.12;
/** 테두리에 닿지 않게 남기는 여백 */
const FIT_MARGIN = 1.08;

const spacingFor = (width: number) => (width < NARROW_PX ? NARROW_SPACING : SPACING);

/**
 * 셋이 딱 들어가는 카메라 거리를 구한다.
 * 거리를 상수로 박아 두면 좁은 화면에서 얼굴이 뭉갤 만큼 작아진다.
 */
function fitDistance(aspect: number, groupWidth: number, groupHeight: number): number {
  const half = Math.tan((FOV * Math.PI) / 360);
  const byHeight = groupHeight / 2 / half;
  const byWidth = groupWidth / 2 / (half * aspect);
  return Math.max(byHeight, byWidth) * FIT_MARGIN;
}
/** 캐릭터마다 동작이 겹치지 않게 시작 시점을 어긋나게 둔다. */
const PHASE: Record<CharacterKey, number> = { chiikawa: 0, hachiware: 0.45, usagi: 0.9 };

const NAME: Record<CharacterKey, string> = { chiikawa: '치이카와', hachiware: '하치와레', usagi: '우사기' };
/**
 * 누를 때마다 다른 말이 나오도록 여러 개 둔다.
 * 일본어 위키백과 「ちいかわ」에 실린, 작중에서 실제로 나오는 말만 넣는다.
 * 치이카와와 우사기는 말수가 거의 없고 짧은 소리를 낸다. 하치와레만 문장으로 말한다.
 */
const LINES: Record<CharacterKey, string[]> = {
  // ワッ / ヤー / ヤダー！
  chiikawa: ['왓', '야ー', '야다ー!'],
  // なんとかなれッ
  hachiware: ['어떻게든 되라앗'],
  // ウラ / ヤハ / ウララララァ
  usagi: ['우라', '야하', '우라라라라아'],
};

interface Bubble {
  key: CharacterKey;
  line: string;
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
    const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 100);

    // 은은한 확산광을 주로 쓰고 직사광을 약하게 둬야 천처럼 보인다.
    scene.add(new THREE.HemisphereLight(0xffffff, 0xfffaf2, 1.75));
    const key = new THREE.DirectionalLight(0xfffdf8, 1.05);
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
    ground.position.y = -1.82;
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

    /*
     * 정지 자세에서 셋이 차지하는 크기를 직접 잰다.
     * 손으로 적어 두면 귀 길이나 몸 비율을 고칠 때마다 어긋난다.
     */
    const restBox = new THREE.Box3();
    entries.forEach((entry) => restBox.expandByObject(entry.rig.root));
    const bodyWidth = restBox.max.x - restBox.min.x - SPACING * 2;
    // 위로만 뛴다. 여백도 위에만 준다. 위아래로 나눠 주면 발밑이 쓸데없이 비어 보인다.
    const topY = restBox.max.y + (reduceMotion ? 0 : MAX_LIFT + STRETCH_MARGIN);
    const groupHeight = topY - restBox.min.y;
    const centerY = (topY + restBox.min.y) / 2;

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
      const lines = LINES[entry.name];
      setBubble({
        key: entry.name,
        line: lines[Math.floor(Math.random() * lines.length)],
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
      rig.leftArm.rotation.z = armLift * 0.85;
      rig.rightArm.rotation.z = -armLift * 0.85;
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
      const spacing = spacingFor(clientWidth);
      entries.forEach((entry, index) => {
        entry.rig.root.position.x = (index - 1) * spacing;
      });
      camera.aspect = clientWidth / clientHeight;
      camera.position.set(0, centerY, fitDistance(camera.aspect, spacing * 2 + bodyWidth, groupHeight));
      camera.lookAt(0, centerY, 0);
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
          {bubble.line}
        </span>
      )}
      <span className="hero-hint" aria-live="polite">
        {hovered ? `${NAME[hovered]} 쓰다듬기` : '쓰다듬어 보세요'}
      </span>
    </div>
  );
}
