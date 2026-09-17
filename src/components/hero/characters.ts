import * as THREE from 'three';
import { createFaceTexture, type BrowStyle, type FacePhoto } from './faceTexture';

/**
 * 세 캐릭터를 기본 도형으로 조립한다. 외부 모델 파일은 쓰지 않는다.
 *
 * 비율이 핵심이다. 머리가 전체 높이의 6할을 차지하고 몸은 그 아래 작게 붙는다.
 * 얼굴은 3D 조각이 아니라 텍스처로 머리에 그린다. 조각으로 붙이면 표면에서 떠 보인다.
 */

export type CharacterKey = 'chiikawa' | 'hachiware' | 'usagi';

const CREAM = '#ffffff';
const HACHIWARE_BLUE = '#7cb2e0';
const USAGI_BODY = '#fde9bd';
const USAGI_EAR = 0xf2a8b4;

export interface CharacterRig {
  root: THREE.Group;
  /** 몸 전체. 점프와 회전은 여기에 준다. */
  body: THREE.Group;
  head: THREE.Group;
  leftArm: THREE.Group;
  rightArm: THREE.Group;
  leftEar: THREE.Group;
  rightEar: THREE.Group;
  /** 우는 표정으로 바꾼다. 치이카와만 쓴다. */
  setCrying: (crying: boolean) => void;
}

const HEAD_RADIUS = 1;
const HEAD_Y = 0.38;
/** 참조 인형은 몸통 너비가 머리의 9할쯤 된다. 좁게 잡으면 사탕처럼 보인다. */
const TORSO_Y = -1.04;

/** 눈썹은 캐릭터마다 길이와 높이가 다르다. */
const BROWS: Record<CharacterKey, BrowStyle> = {
  // 치이카와: 눈 위에 짧게 걸친다.
  chiikawa: { width: 0.26, apexY: 0.13, thickness: 0.03, offsetX: 0.01 },
  // 하치와레: 파란 머리 밑에 점처럼 짧게 찍힌다.
  hachiware: { width: 0.085, apexY: 0.15, thickness: 0.034, offsetX: -0.02 },
  // 우사기: 이마를 가로지르는 길고 시원한 활.
  usagi: { width: 0.42, apexY: 0.185, thickness: 0.021, offsetX: 0.1 },
};

const BODY_COLOR: Record<CharacterKey, string> = {
  chiikawa: CREAM,
  hachiware: CREAM,
  usagi: USAGI_BODY,
};

/** 머리에 색이 덮이는 캐릭터. 하치와레만 해당한다. */
const CAP_COLOR: Partial<Record<CharacterKey, string>> = { hachiware: HACHIWARE_BLUE };

/**
 * 공식 인형 사진에서 얼굴만 오려 쓴다. 손으로 그리는 것보다 원본에 가깝다.
 * head 는 사진 속 머리의 경계, crop 은 눈썹 위부터 입 아래까지다.
 */
const FACE_PHOTO: Record<CharacterKey, FacePhoto> = {
  chiikawa: {
    src: '/images/hero/chiikawa.jpg',
    eyes: { leftX: 506, rightX: 710, y: 490 },
    crop: { x: 330, y: 335, w: 560, h: 275 },
  },
  hachiware: {
    src: '/images/hero/hachiware.jpg',
    eyes: { leftX: 486, rightX: 690, y: 470 },
    crop: { x: 320, y: 360, w: 560, h: 245 },
  },
  usagi: {
    src: '/images/hero/usagi.jpg',
    eyes: { leftX: 492, rightX: 696, y: 564 },
    crop: { x: 330, y: 385, w: 560, h: 300 },
  },
};

/**
 * 인형 재질. 일반 재질은 아무리 거칠게 해도 플라스틱처럼 보인다.
 * sheen 을 주면 잔털이 빛을 비스듬히 받아 테두리가 뽀얗게 떠서 천처럼 읽힌다.
 */
const soft = (color: number | string) =>
  new THREE.MeshPhysicalMaterial({
    color,
    roughness: 1,
    metalness: 0,
    sheen: 0.8,
    sheenRoughness: 0.8,
    sheenColor: new THREE.Color(0xfff4ec),
  });

const ball = (radius: number, color: number | string) =>
  new THREE.Mesh(new THREE.SphereGeometry(radius, 48, 36), soft(color));

function buildTorso(color: number | string) {
  const group = new THREE.Group();

  // 몸통은 공이 아니라 가로로 넉넉하고 세로로 짧다. 위쪽은 머리가 덮는다.
  const torso = ball(1, color);
  torso.scale.set(0.85, 0.62, 0.74);
  torso.position.y = TORSO_Y;
  group.add(torso);

  // 발은 몸 아래 가운데에 붙은 작고 납작한 타원 두 개
  for (const side of [-1, 1]) {
    const foot = ball(1, color);
    foot.scale.set(0.28, 0.17, 0.3);
    foot.position.set(side * 0.24, -1.58, 0.12);
    group.add(foot);
  }

  // 팔은 옆으로 뻗은 혹이 아니라 몸 옆에 붙어 아래로 늘어진 짧은 팔이다.
  const makeArm = (side: number) => {
    const pivot = new THREE.Group();
    const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.17, 0.34, 8, 18), soft(color));
    arm.position.y = -0.26;
    arm.scale.z = 0.82;
    pivot.add(arm);
    // 몸통 반너비가 0.85 라 그보다 바깥에 둬야 팔이 파묻히지 않는다.
    pivot.position.set(side * 0.82, -0.72, 0.1);
    pivot.rotation.z = side * -0.05;
    return pivot;
  };

  return { group, leftArm: makeArm(-1), rightArm: makeArm(1) };
}

function assemble(key: CharacterKey) {
  const color = BODY_COLOR[key];
  const root = new THREE.Group();
  const body = new THREE.Group();

  const head = new THREE.Group();
  const skull = ball(HEAD_RADIUS, color);
  // 머리는 세로보다 가로가 조금 넓다.
  skull.scale.set(1.16, 1, 1);

  const material = skull.material as THREE.MeshPhysicalMaterial;
  const calm = createFaceTexture(color, BROWS[key], false, CAP_COLOR[key], FACE_PHOTO[key]);
  material.map = calm;
  // 텍스처가 색을 결정하므로 재질 색은 흰색으로 둔다.
  material.color.set(0xffffff);
  material.needsUpdate = true;

  let crying: THREE.CanvasTexture | null = null;
  const setCrying = (on: boolean) => {
    if (on && !crying) crying = createFaceTexture(color, BROWS[key], true, CAP_COLOR[key], FACE_PHOTO[key]);
    const next = on && crying ? crying : calm;
    if (material.map !== next) {
      material.map = next;
      material.needsUpdate = true;
    }
  };

  head.add(skull);
  head.position.y = HEAD_Y;

  const torso = buildTorso(color);
  body.add(torso.group, torso.leftArm, torso.rightArm, head);
  root.add(body);

  return { root, body, head, setCrying, leftArm: torso.leftArm, rightArm: torso.rightArm };
}

function buildChiikawa(): CharacterRig {
  const base = assemble('chiikawa');
  const ears: THREE.Group[] = [];
  for (const side of [-1, 1]) {
    const pivot = new THREE.Group();
    const ear = ball(0.27, CREAM);
    ear.scale.set(1, 1.02, 0.8);
    // 축은 머리에 닿는 밑동에 두고 귀는 그 위로 올린다. 그래야 흔들려도 붙어 보인다.
    ear.position.y = 0.16;
    pivot.add(ear);
    pivot.position.set(side * 0.62, 0.72, -0.04);
    base.head.add(pivot);
    ears.push(pivot);
  }
  return { ...base, leftEar: ears[0], rightEar: ears[1] };
}

/**
 * 고양이 귀. 원뿔로 만들면 끝이 바늘처럼 뾰족해 뿔처럼 보인다.
 * 밑동은 넓고 끝으로 갈수록 좁아지되 끝이 둥근 옆모습을 돌려 만든다.
 */
function catEarGeometry(): THREE.LatheGeometry {
  // 밑면을 막지 않으면 기울였을 때 안이 들여다보여 머리에서 떨어진 것처럼 보인다.
  const profile: THREE.Vector2[] = [new THREE.Vector2(0.001, 0)];
  const steps = 16;
  const height = 0.66;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const radius = 0.28 * Math.cos((t * Math.PI) / 2) ** 0.6;
    profile.push(new THREE.Vector2(Math.max(0.004, radius), t * height));
  }
  return new THREE.LatheGeometry(profile, 28);
}

function buildHachiware(): CharacterRig {
  const base = assemble('hachiware');

  // 파란 머리는 텍스처로 그린다. 귀만 도형으로 세운다.
  const capMaterial = soft(HACHIWARE_BLUE);
  const ears: THREE.Group[] = [];
  for (const side of [-1, 1]) {
    const pivot = new THREE.Group();
    const ear = new THREE.Mesh(catEarGeometry(), capMaterial);
    // 고양이 귀라 앞뒤로 납작하다.
    ear.scale.z = 0.62;
    ear.rotation.z = side * 0.1;
    pivot.add(ear);
    pivot.position.set(side * 0.55, 0.52, -0.02);
    base.head.add(pivot);
    ears.push(pivot);
  }
  return { ...base, leftEar: ears[0], rightEar: ears[1] };
}

function buildUsagi(): CharacterRig {
  const base = assemble('usagi');
  const ears: THREE.Group[] = [];
  for (const side of [-1, 1]) {
    const pivot = new THREE.Group();

    const outer = new THREE.Mesh(new THREE.CapsuleGeometry(0.21, 0.66, 8, 18), soft(USAGI_BODY));
    outer.position.y = 0.4;
    outer.scale.z = 0.62;
    pivot.add(outer);

    const inner = new THREE.Mesh(new THREE.CapsuleGeometry(0.115, 0.44, 8, 14), soft(USAGI_EAR));
    inner.position.set(0, 0.4, 0.11);
    inner.scale.z = 0.4;
    pivot.add(inner);

    // 귀는 머리 위 가운데에 거의 붙어서 나란히 선다.
    pivot.position.set(side * 0.26, 0.74, -0.02);
    pivot.rotation.z = side * 0.12;
    base.head.add(pivot);
    ears.push(pivot);
  }
  return { ...base, leftEar: ears[0], rightEar: ears[1] };
}

const BUILDERS: Record<CharacterKey, () => CharacterRig> = {
  chiikawa: buildChiikawa,
  hachiware: buildHachiware,
  usagi: buildUsagi,
};

export const buildCharacter = (key: CharacterKey): CharacterRig => BUILDERS[key]();
