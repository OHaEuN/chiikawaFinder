'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { buildCharacter, type CharacterKey, type CharacterRig } from './characters';
import { poseAt, restingPose } from './motions';

const ORDER: CharacterKey[] = ['chiikawa', 'hachiware', 'usagi'];
const SPACING = 2.7;
/** 캐릭터마다 동작이 겹치지 않게 시작 시점을 어긋나게 둔다. */
const PHASE: Record<CharacterKey, number> = { chiikawa: 0, hachiware: 0.45, usagi: 0.9 };

export default function HeroSceneInner() {
  const hostRef = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);

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

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    host.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
    camera.position.set(0, 0.35, 7.9);
    camera.lookAt(0, -0.1, 0);

    // 은은한 확산광을 주로 쓰고 직사광을 약하게 둬야 천처럼 보인다.
    scene.add(new THREE.HemisphereLight(0xfffaf4, 0xf0ddc9, 1.35));
    const key = new THREE.DirectionalLight(0xfff6ea, 1.25);
    key.position.set(3.2, 6, 5);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.camera.near = 1;
    key.shadow.camera.far = 22;
    // 그림자 경계를 흐려 인형 같은 부드러움을 남긴다.
    key.shadow.radius = 6;
    key.shadow.bias = -0.0015;
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xeaf2fb, 0.35);
    fill.position.set(-4, 2.4, 3);
    scene.add(fill);
    // 뒤에서 옅게 비춰 테두리에 잔털이 선 듯한 빛을 남긴다.
    const rim = new THREE.DirectionalLight(0xffffff, 0.35);
    rim.position.set(-1.5, 2.2, -4);
    scene.add(rim);

    // 캐릭터가 떠 보이지 않게 그림자만 받는 바닥을 깐다.
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(40, 40),
      new THREE.ShadowMaterial({ opacity: 0.12 }),
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -1.55;
    ground.receiveShadow = true;
    scene.add(ground);

    const rigs = ORDER.map((name, index) => {
      const rig = buildCharacter(name);
      rig.root.position.x = (index - 1) * SPACING;
      rig.root.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.castShadow = true;
        }
      });
      scene.add(rig.root);
      return { name, rig };
    });

    const applyPose = ({ name, rig }: { name: CharacterKey; rig: CharacterRig }, time: number) => {
      const pose = reduceMotion ? restingPose() : poseAt(name, time + PHASE[name]);
      rig.body.position.y = pose.hop;
      rig.body.rotation.z = pose.tilt;
      rig.body.rotation.y = pose.spin;
      rig.body.scale.set(2 - pose.squash, pose.squash, 2 - pose.squash);
      // 머리가 크고 무거우니 점프할 때 살짝 늦게 따라온다.
      rig.head.rotation.z = pose.tilt * -0.55;
      rig.leftArm.rotation.z = 0.32 + pose.armLift;
      rig.rightArm.rotation.z = -0.32 - pose.armLift;
      rig.leftEar.rotation.z = pose.earSwing;
      rig.rightEar.rotation.z = -pose.earSwing;
      rig.tears.children.forEach((drop) => {
        drop.visible = pose.crying;
      });
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
      rigs.forEach((entry) => applyPose(entry, time));
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

  if (failed) return null;
  return <div className="hero-scene" ref={hostRef} aria-hidden />;
}
