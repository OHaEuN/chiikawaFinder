import * as THREE from 'three';
import { createFaceTexture, type BrowStyle, type FacePhoto } from './faceTexture';
import { asset } from '@/lib/asset';

/**
 * 세 캐릭터를 기본 도형으로 조립한다. 외부 모델 파일은 쓰지 않는다.
 *
 * 비율이 핵심이다. 머리가 전체 높이의 7할을 차지하고 몸은 그 아래 작게 붙는다.
 * 얼굴은 3D 조각이 아니라 텍스처로 머리에 그린다. 조각으로 붙이면 표면에서 떠 보인다.
 */

export type CharacterKey = 'chiikawa' | 'hachiware' | 'usagi';

const CREAM = '#ffffff';
const HACHIWARE_BLUE = '#7cb2e0';
const USAGI_BODY = '#fdecc4';
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
/**
 * 공식 피규어(GPSBOX 우사기 시리즈)·공식몰 기본 인형·극장판 일러스트의 실루엣을
 * 픽셀로 재어 머리 너비 기준으로 맞췄다.
 *
 *            머리 가로/세로   몸 윗너비/머리너비   몸 아랫너비/머리너비   보이는 몸높이/머리높이
 *   피규어       1.40             0.62                0.42                 0.45
 *   인형         1.46             0.75                0.56                 0.46
 *   일러스트     1.36
 *
 * 몸은 머리와 맞닿는 자리가 가장 넓고 바닥으로 갈수록 좁아지는 ∩ 모양이다.
 * 아래가 불룩하면 배 나온 다른 캐릭터가 되고, 위가 좁으면 머리가 꽂힌 사탕이 된다.
 */
const HEAD_WIDTH = 1.3;
const TORSO_Y = -0.78;
/**
 * 팔·발은 넨도로이드 공식 사진(정면·반측면·옆)과 기본 일러스트를 머리 너비 기준으로 잰 값이다.
 *
 *              팔 너비    팔 길이(몸 높이 대비)   발 너비   두 발 간격(발 너비 대비)
 *   넨도로이드    0.09        0.58                 0.11        0.7
 *   일러스트      0.11        약 0.5               0.12
 *
 * 팔은 머리 밑 몸 윗모서리(어깨)에만 붙어 바깥 아래로 뻗고, 아래쪽은 몸에서 떨어져 틈이 보인다.
 * 몸 옆에 묻으면 구슬을 붙인 것처럼 된다. 인형은 솜 때문에 이보다 훨씬 통통하니 기준으로 쓰지 않는다.
 */
const ARM_TILT = 0.4;
/** 팔 반 길이. 팔 윗끝이 어깨 축에 오도록 중심을 이만큼 내린다. */
const ARM_REACH = 0.21;

/** 눈썹은 캐릭터마다 길이와 높이가 다르다. */
const BROWS: Record<CharacterKey, BrowStyle> = {
  // 치이카와: 눈 위에 짧게 걸친다.
  chiikawa: { width: 0.26, apexY: 0.13, thickness: 0.03, offsetX: 0.01 },
  // 하치와레: 파란 머리 밑에 점처럼 짧게 찍힌다.
  // 공식 일러스트에서 잰 값이다. 낮게 두면 눈에 겹쳐 눈이 깨져 보인다.
  hachiware: { width: 0.048, apexY: 0.277, thickness: 0.027, offsetX: -0.04 },
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
 * 극장판 공식 일러스트에서 미리 잘라 둔 얼굴 그림. scripts/hero-face.py 가 만든다.
 * eyeSpan 과 eyeY 는 그 스크립트가 찍어 주는 값이다.
 */
const FACE_PHOTO: Record<CharacterKey, FacePhoto> = {
  chiikawa: { src: asset('/images/hero/face-chiikawa.png'), eyeSpan: 163, eyeY: 82 },
  // 눈썹이 파란 앞머리 선에 붙어 있어 그림에서 떼어 낼 수 없다. 코드로 찍는다.
  hachiware: { src: asset('/images/hero/face-hachiware.png'), eyeSpan: 168, eyeY: 65, drawnBrows: true },
  usagi: { src: asset('/images/hero/face-usagi.png'), eyeSpan: 163, eyeY: 139 },
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

/**
 * 몸통 옆모습을 돌려 만든다. 구를 눌러 쓰면 가운데가 불룩해져 다른 캐릭터가 된다.
 * 머리 밑에서 가장 넓게 시작해 곧게 좁아지다 바닥에서 둥글게 마감하는 빵 모양이다.
 */
function torsoGeometry(): THREE.LatheGeometry {
  // 아래에서 위 순서로 적어야 면이 바깥을 향한다. 뒤집으면 안쪽만 보여 치마처럼 된다.
  // y 0.40 에서 머리 실루엣과 만난다. 그 위는 머리 안에 숨어 이음새를 가린다.
  const profile: [number, number][] = [
    [0.001, -0.51],
    [0.27, -0.5],
    [0.45, -0.46],
    [0.57, -0.39],
    [0.64, -0.29],
    [0.69, -0.14],
    [0.74, 0.06],
    [0.79, 0.25],
    [0.83, 0.4],
    [0.8, 0.52],
    [0.66, 0.62],
    [0.4, 0.7],
    [0.001, 0.73],
  ];
  return new THREE.LatheGeometry(
    profile.map(([r, y]) => new THREE.Vector2(r, y)),
    36,
  );
}

function buildTorso(color: number | string) {
  const group = new THREE.Group();

  const torso = new THREE.Mesh(torsoGeometry(), soft(color));
  torso.position.y = TORSO_Y;
  // 옆에서 보면 머리가 몸 앞으로 조금 나와 있다. 몸은 좌우보다 앞뒤가 얇다.
  torso.scale.z = 0.88;
  group.add(torso);

  // 발은 몸 바닥 가운데 앞쪽에 거의 붙어 선 짧은 막대 두 개. 윗부분은 몸 안에 묻힌다.
  for (const side of [-1, 1]) {
    const foot = new THREE.Mesh(new THREE.CapsuleGeometry(0.14, 0.12, 6, 16), soft(color));
    foot.position.set(side * 0.25, -1.25, 0.25);
    group.add(foot);
  }

  // 축은 어깨(머리 밑 몸 윗모서리)에 두고 팔만 기울여 둔다. 축을 돌리면 어깨에서 벌어지며 올라간다.
  const makeArm = (side: number) => {
    const pivot = new THREE.Group();
    const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.13, 0.16, 6, 16), soft(color));
    arm.rotation.z = side * ARM_TILT;
    arm.position.set(side * ARM_REACH * Math.sin(ARM_TILT), -ARM_REACH * Math.cos(ARM_TILT), 0);
    pivot.add(arm);
    pivot.position.set(side * 0.8, -0.45, 0.05);
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
  // 옆에서 보면 둥글고 앞에서 보면 가로로 넓은 머리다. 얼굴 그림은 구면 각도로 그려서
  // 가로로 늘려도 머리와 같은 비율로 따라온다.
  skull.scale.set(HEAD_WIDTH, 1, 1);

  const material = skull.material as THREE.MeshPhysicalMaterial;
  const calm = createFaceTexture(color, BROWS[key], false, CAP_COLOR[key], FACE_PHOTO[key], HEAD_WIDTH);
  material.map = calm;
  // 텍스처가 색을 결정하므로 재질 색은 흰색으로 둔다.
  material.color.set(0xffffff);
  material.needsUpdate = true;

  let crying: THREE.CanvasTexture | null = null;
  const setCrying = (on: boolean) => {
    if (on && !crying) crying = createFaceTexture(color, BROWS[key], true, CAP_COLOR[key], FACE_PHOTO[key], HEAD_WIDTH);
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
    // 공식 일러스트에서 재면 귀 지름이 머리 너비의 18%, 중심이 반너비의 45% 자리다.
    const ear = ball(0.09 * HEAD_WIDTH * 2, CREAM);
    ear.scale.set(1, 1.04, 0.82);
    // 축은 머리에 닿는 밑동에 두고 귀는 그 위로 올린다. 그래야 흔들려도 붙어 보인다.
    ear.position.y = 0.14;
    pivot.add(ear);
    pivot.position.set(side * 0.45 * HEAD_WIDTH, 0.77, -0.04);
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
  const height = 0.64;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const radius = 0.26 * Math.cos((t * Math.PI) / 2) ** 0.5;
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
    ear.scale.z = 0.58;
    ear.rotation.z = side * 0.2;
    pivot.add(ear);
    pivot.position.set(side * 0.475 * HEAD_WIDTH, 0.58, -0.02);
    base.head.add(pivot);
    ears.push(pivot);
  }
  return { ...base, leftEar: ears[0], rightEar: ears[1] };
}

function buildUsagi(): CharacterRig {
  const base = assemble('usagi');
  const ears: THREE.Group[] = [];
  for (const side of [-1, 1]) {
    // 축은 머리 속 밑동에 둔다. 흔들림은 축에, 고정 기울기는 그 안쪽 lean 에 준다.
    // 둘을 한 곳에 주면 프레임마다 흔들림 값이 기울기를 덮어쓴다.
    const pivot = new THREE.Group();
    const lean = new THREE.Group();

    /*
     * 우사기 자료 20여 종(넨도로이드 정면·반측면·옆, GPSBOX 피규어 6종, 공식 인형 4종,
     * 기본·극장판 일러스트, 뒷모습 사진)을 머리 너비 기준으로 잰 합의값이다.
     *
     *                 귀 너비     머리 위 높이    두 귀 간격(귀 너비 대비)   속살 너비(귀 너비 대비)
     *   피규어·일러스트  0.10~0.13   0.42~0.54      0.0~0.7                 0.40~0.55
     *   인형            0.16~0.21   0.38~0.43      0.0~0.1                 0.35~0.47
     *
     * 두 귀는 거의 평행(한쪽 0~3°)이고 옆에서 보면 뒤로 10° 남짓 기운다. 앞뒤 두께는 너비의 4할.
     * 속살은 앞면에만 있어 뒤에서는 보이지 않는다. 인형은 솜 때문에 굵으니 피규어 쪽을 따른다.
     * 밑동은 머리 안에 깊이 묻는다. 얕으면 앞뒤로 눕힐 때 틈이 보인다.
     */
    const outer = new THREE.Mesh(new THREE.CapsuleGeometry(0.18, 1.22, 8, 18), soft(USAGI_BODY));
    outer.position.y = 0.76;
    outer.scale.z = 0.4;
    lean.add(outer);

    const inner = new THREE.Mesh(new THREE.CapsuleGeometry(0.09, 1.06, 8, 14), soft(USAGI_EAR));
    inner.position.set(0, 0.84, 0.08);
    inner.scale.z = 0.3;
    lean.add(inner);

    lean.rotation.x = -0.2;
    pivot.add(lean);
    // 앞면을 바깥으로 아주 조금만 튼다. 정면에서는 속살이 가운데 가깝게, 반측면에서도 보인다.
    pivot.position.set(side * 0.25, 0.75, -0.02);
    pivot.rotation.set(0, side * 0.15, side * 0.035);
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
