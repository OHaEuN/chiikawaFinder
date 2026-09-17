import * as THREE from 'three';

/**
 * 세 캐릭터를 기본 도형으로 조립한다. 외부 모델 파일은 쓰지 않는다.
 *
 * 비율이 핵심이다. 머리가 전체 높이의 6할을 차지하고 몸은 그 아래 작게 붙는다.
 * 얼굴은 머리 한가운데가 아니라 아래쪽에 모여 있고, 눈은 점이 아니라
 * 짙은 테두리 안에 흰 하이라이트가 있는 고리다. 눈썹은 눈과 떨어진 가는 활이다.
 */

export type CharacterKey = 'chiikawa' | 'hachiware' | 'usagi';

const CREAM = 0xfffefb;
const INK = 0x4a3b33;
const BLUSH = 0xf5a8b8;
const HACHIWARE_BLUE = 0x7cb2e0;
const USAGI_BODY = 0xfbe3b0;
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
  tears: THREE.Group;
}

const HEAD_RADIUS = 1;
const HEAD_Y = 0.42;
const TORSO_RADIUS = 0.6;
const TORSO_Y = -0.72;

const soft = (color: number) => new THREE.MeshStandardMaterial({ color, roughness: 0.92, metalness: 0 });

const ball = (radius: number, color: number) =>
  new THREE.Mesh(new THREE.SphereGeometry(radius, 32, 24), soft(color));

/** 머리 표면에 딱 붙도록 z 를 구면 위로 올린다. */
const onFace = (x: number, y: number, extra = 0) => {
  const inside = Math.min(0.97, Math.hypot(x, y) / HEAD_RADIUS);
  return Math.sqrt(Math.max(0, 1 - inside * inside)) * HEAD_RADIUS * 0.93 + extra;
};

/** 눈: 짙은 고리 + 위쪽에 흰 하이라이트 */
function buildEye(x: number, y: number): THREE.Group {
  const eye = new THREE.Group();

  const outline = ball(0.17, INK);
  outline.scale.set(1, 1.06, 0.42);
  eye.add(outline);

  const highlight = ball(0.088, 0xffffff);
  highlight.scale.set(1, 1, 0.5);
  highlight.position.set(-0.012, 0.042, 0.055);
  eye.add(highlight);

  eye.position.set(x, y, onFace(x, y, 0.02));
  return eye;
}

/** 눈썹: 눈 위에 떠 있는 가는 활 */
function buildBrow(x: number, y: number, flip: number): THREE.Mesh {
  const brow = new THREE.Mesh(
    new THREE.TorusGeometry(0.28, 0.021, 8, 28, Math.PI * 0.55),
    soft(INK),
  );
  brow.position.set(x, y, onFace(x, y, 0.01));
  brow.rotation.z = flip > 0 ? Math.PI * 0.19 : Math.PI * 0.19 + Math.PI * 0.62 * 0 - Math.PI * 0.0;
  if (flip < 0) brow.rotation.y = Math.PI;
  brow.scale.set(1, 0.6, 1);
  return brow;
}

/** 볼: 분홍 타원에 빗금 네 줄 */
function buildBlush(x: number, y: number): THREE.Group {
  const blush = new THREE.Group();

  const pad = ball(0.23, BLUSH);
  pad.scale.set(1, 0.72, 0.22);
  blush.add(pad);

  const barGeometry = new THREE.BoxGeometry(0.022, 0.13, 0.02);
  const barMaterial = soft(INK);
  for (let i = 0; i < 4; i++) {
    const bar = new THREE.Mesh(barGeometry, barMaterial);
    bar.position.set(-0.075 + i * 0.05, 0, 0.055);
    bar.rotation.z = -0.32;
    blush.add(bar);
  }

  blush.position.set(x, y, onFace(x, y, 0.015));
  return blush;
}

/** 입: 작은 w 모양 */
function buildMouth(y: number): THREE.Group {
  const mouth = new THREE.Group();
  const material = soft(INK);
  for (const side of [-1, 1]) {
    const curve = new THREE.Mesh(new THREE.TorusGeometry(0.075, 0.024, 8, 20, Math.PI), material);
    curve.position.x = side * 0.072;
    curve.rotation.z = Math.PI;
    mouth.add(curve);
  }
  mouth.position.set(0, y, onFace(0, y, 0.02));
  return mouth;
}

function buildFace(head: THREE.Group): THREE.Group {
  // 얼굴은 머리 한가운데가 아니라 아래쪽에 모여 있다.
  const eyeY = -0.12;
  const eyeX = 0.315;

  head.add(buildEye(-eyeX, eyeY), buildEye(eyeX, eyeY));
  head.add(buildBrow(-eyeX - 0.02, eyeY + 0.42, 1), buildBrow(eyeX + 0.02, eyeY + 0.42, -1));
  head.add(buildBlush(-0.63, eyeY - 0.13), buildBlush(0.63, eyeY - 0.13));
  head.add(buildMouth(eyeY - 0.3));

  const tears = new THREE.Group();
  const tearMaterial = new THREE.MeshStandardMaterial({ color: 0xa9d8f0, roughness: 0.25, transparent: true, opacity: 0.92 });
  for (const side of [-1, 1]) {
    const drop = new THREE.Mesh(new THREE.SphereGeometry(0.085, 14, 12), tearMaterial);
    drop.position.set(side * eyeX, eyeY - 0.26, onFace(side * eyeX, eyeY, 0.06));
    drop.scale.set(0.85, 1.4, 0.85);
    drop.visible = false;
    tears.add(drop);
  }
  head.add(tears);
  return tears;
}

function buildTorso(color: number) {
  const group = new THREE.Group();

  const torso = ball(TORSO_RADIUS, color);
  torso.scale.set(1.12, 1.02, 0.95);
  torso.position.y = TORSO_Y;
  group.add(torso);

  // 발은 가운데에 붙어 있는 작은 공 두 개
  for (const side of [-1, 1]) {
    const foot = ball(0.2, color);
    foot.scale.set(1.05, 0.88, 1.2);
    foot.position.set(side * 0.2, TORSO_Y - 0.56, 0.12);
    group.add(foot);
  }

  const makeArm = (side: number) => {
    const pivot = new THREE.Group();
    const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.155, 0.3, 8, 16), soft(color));
    arm.position.y = -0.2;
    pivot.add(arm);
    pivot.position.set(side * 0.72, TORSO_Y + 0.14, 0.06);
    return pivot;
  };

  return { group, leftArm: makeArm(-1), rightArm: makeArm(1) };
}

function assemble(bodyColor: number) {
  const root = new THREE.Group();
  const body = new THREE.Group();

  const head = new THREE.Group();
  const skull = ball(HEAD_RADIUS, bodyColor);
  skull.scale.set(1.06, 1, 0.96);
  head.add(skull);
  head.position.y = HEAD_Y;
  const tears = buildFace(head);

  const torso = buildTorso(bodyColor);
  body.add(torso.group, torso.leftArm, torso.rightArm, head);
  root.add(body);

  return { root, body, head, tears, leftArm: torso.leftArm, rightArm: torso.rightArm };
}

function buildChiikawa(): CharacterRig {
  const base = assemble(CREAM);
  const ears: THREE.Group[] = [];
  for (const side of [-1, 1]) {
    const pivot = new THREE.Group();
    const ear = ball(0.27, CREAM);
    ear.scale.set(1, 1.02, 0.8);
    pivot.add(ear);
    pivot.position.set(side * 0.66, 0.86, -0.04);
    base.head.add(pivot);
    ears.push(pivot);
  }
  return { ...base, leftEar: ears[0], rightEar: ears[1] };
}

function buildHachiware(): CharacterRig {
  const base = assemble(CREAM);

  // 정수리를 덮는 파란 부분. 가운데가 V 자로 갈라져 이름이 됐다.
  const capMaterial = soft(HACHIWARE_BLUE);
  for (const side of [-1, 1]) {
    const cap = new THREE.Mesh(new THREE.SphereGeometry(HEAD_RADIUS * 1.02, 32, 24, 0, Math.PI * 2, 0, Math.PI * 0.3), capMaterial);
    cap.scale.set(1.06, 1, 0.96);
    // 양쪽을 바깥으로 기울여 가운데가 V 자로 갈라지게 만든다.
    cap.rotation.z = side * 0.22;
    base.head.add(cap);
  }

  const ears: THREE.Group[] = [];
  for (const side of [-1, 1]) {
    const pivot = new THREE.Group();
    const ear = new THREE.Mesh(new THREE.ConeGeometry(0.26, 0.42, 18), capMaterial);
    ear.scale.z = 0.72;
    ear.rotation.z = side * 0.1;
    pivot.add(ear);
    pivot.position.set(side * 0.55, 0.96, -0.02);
    base.head.add(pivot);
    ears.push(pivot);
  }
  return { ...base, leftEar: ears[0], rightEar: ears[1] };
}

function buildUsagi(): CharacterRig {
  const base = assemble(USAGI_BODY);
  const ears: THREE.Group[] = [];
  for (const side of [-1, 1]) {
    const pivot = new THREE.Group();

    const outer = new THREE.Mesh(new THREE.CapsuleGeometry(0.21, 0.66, 8, 18), soft(USAGI_BODY));
    outer.position.y = 0.44;
    outer.scale.z = 0.62;
    pivot.add(outer);

    const inner = new THREE.Mesh(new THREE.CapsuleGeometry(0.115, 0.44, 8, 14), soft(USAGI_EAR));
    inner.position.set(0, 0.44, 0.11);
    inner.scale.z = 0.4;
    pivot.add(inner);

    // 귀는 머리 위 가운데에 거의 붙어서 나란히 선다.
    pivot.position.set(side * 0.26, 0.82, -0.02);
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
