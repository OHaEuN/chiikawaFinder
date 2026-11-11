/**
 * 캐릭터별 시그니처 동작.
 *
 * 프레임마다 각 부위가 어디에 있어야 하는지만 계산한다. three.js 에 의존하지 않아
 * 값만 놓고 검증할 수 있다.
 *
 * 몸은 한 덩어리로 움직인다. 눌리거나 늘어나지 않는다. 고무공처럼 튀기면
 * 다른 작품의 캐릭터가 된다.
 */

import type { CharacterKey } from './characters';

export interface Pose {
  /** 바닥에서 뜬 높이 */
  hop: number;
  /** 몸 좌우 기울기 (라디안) */
  tilt: number;
  /** 몸 회전 (라디안) */
  spin: number;
  /** 팔 올린 각도 (라디안). 양수면 위로 */
  armLift: number;
  /** 귀가 앞뒤로 눕는 각도 (라디안). 양수면 앞으로 */
  earSwing: number;
  /** 눈물이 보이는지 */
  crying: boolean;
}

const TAU = Math.PI * 2;

/**
 * 기본 동작과 반응이 겹쳤을 때 올라갈 수 있는 최대 높이.
 * 화면에 셋을 맞출 때 이만큼 위를 비워 둬야 점프한 캐릭터가 잘리지 않는다.
 * motions.test 가 실제 값이 이 값을 넘지 않는지 확인한다.
 */
export const MAX_LIFT = 0.9;

/**
 * 한 주기 중 앞 6할만 뛰고 나머지는 땅에 서 있는다.
 * 사인파로 계속 오르내리면 공이 튀는 것처럼 보인다.
 */
const AIR_PART = 0.6;
const hopOf = (cycle: number, height: number) =>
  cycle < AIR_PART ? Math.sin((cycle / AIR_PART) * Math.PI) * height : 0;

/**
 * 귀는 제 힘으로 흔들리지 않고 몸보다 한 박자 늦게 따라온다.
 * 몸이 오르면 뒤로 눕고 내려오면 앞으로 쏠린다. 따로 박자를 주면 금속 더듬이처럼 보인다.
 */
const EAR_LAG = 0.08;
const wrap = (cycle: number) => ((cycle % 1) + 1) % 1;
const earFollow = (cycle: number, height: number) =>
  (hopOf(wrap(cycle - EAR_LAG), height) - hopOf(cycle, height)) * 1.2;

/**
 * 치이카와: 겁먹고 부들부들 떨다가 울음을 터뜨린다.
 * 잔진동을 크게, 이동은 거의 없게 둬야 '떨림'으로 읽힌다.
 */
function chiikawaPose(t: number): Pose {
  const tremble = Math.sin(t * 22) * 0.04;
  const crying = Math.sin(t * 1.4) > 0.45;
  return {
    hop: 0,
    tilt: tremble,
    spin: Math.sin(t * 0.6) * 0.08,
    armLift: crying ? 0.7 + Math.sin(t * 18) * 0.08 : 0.05,
    earSwing: tremble * 2,
    crying,
  };
}

/** 하치와레: 제자리에서 가볍게 들썩이며 팔을 살짝 벌린다. */
function hachiwarePose(t: number): Pose {
  const cycle = (t * 1.3) % 1;
  const hop = hopOf(cycle, 0.14);
  return {
    hop,
    tilt: Math.sin(t * 1.3) * 0.06,
    spin: Math.sin(t * 0.8) * 0.15,
    armLift: 0.12 + hop * 1.2,
    earSwing: earFollow(cycle, 0.14),
    crying: false,
  };
}

/** 우사기: "우라!" 하고 폴짝폴짝 뛴다. 셋 중 가장 부산하다. */
function usagiPose(t: number): Pose {
  const cycle = (t * 1.15) % 1;
  const hop = hopOf(cycle, 0.5);
  return {
    hop,
    tilt: Math.sin(t * 3.2) * 0.08,
    // 뒤통수에는 얼굴이 없다. 한 바퀴 돌리지 않고 좌우로 틀었다 돌아온다.
    spin: Math.sin(cycle * TAU) * 0.2,
    armLift: 0.45 + Math.sin(t * 7) * 0.12,
    earSwing: earFollow(cycle, 0.5),
    crying: false,
  };
}

const POSES: Record<CharacterKey, (t: number) => Pose> = {
  chiikawa: chiikawaPose,
  hachiware: hachiwarePose,
  usagi: usagiPose,
};

export const poseAt = (key: CharacterKey, time: number): Pose => POSES[key](Math.max(0, time));

/** 눌렀을 때 덧붙는 반응. 0.9초 동안 뛰었다가 잦아든다. */
export const REACTION_SECONDS = 0.9;

export interface Reaction {
  hop: number;
  spin: number;
  armLift: number;
}

export function reactionAt(elapsed: number): Reaction {
  if (elapsed < 0 || elapsed > REACTION_SECONDS) return { hop: 0, spin: 0, armLift: 0 };
  const t = elapsed / REACTION_SECONDS;
  // 뒤로 갈수록 잦아들게 감쇠를 곱한다.
  const decay = 1 - t;
  return {
    hop: Math.sin(t * Math.PI) * 0.3,
    spin: Math.sin(t * Math.PI * 2) * 0.2 * decay,
    armLift: Math.sin(t * Math.PI) * 0.6,
  };
}

/** 움직임을 줄여 달라고 설정한 사람에게 보여줄 정지 자세 */
export const restingPose = (): Pose => ({
  hop: 0,
  tilt: 0,
  spin: 0,
  armLift: 0.08,
  earSwing: 0,
  crying: false,
});
