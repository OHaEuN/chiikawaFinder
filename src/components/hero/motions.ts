/**
 * 캐릭터별 시그니처 동작.
 *
 * 프레임마다 각 부위가 어디에 있어야 하는지만 계산한다. three.js 에 의존하지 않아
 * 값만 놓고 검증할 수 있다.
 */

import type { CharacterKey } from './characters';

export interface Pose {
  /** 바닥에서 뜬 높이 */
  hop: number;
  /** 몸 좌우 기울기 (라디안) */
  tilt: number;
  /** 몸 회전 (라디안) */
  spin: number;
  /** 세로로 눌리고 늘어나는 정도. 1이 기본 */
  squash: number;
  /** 팔 올린 각도 (라디안). 양수면 위로 */
  armLift: number;
  /** 귀가 흔들리는 각도 (라디안) */
  earSwing: number;
  /** 눈물이 보이는지 */
  crying: boolean;
}

const TAU = Math.PI * 2;

/**
 * 치이카와: 겁먹고 부들부들 떨다가 울음을 터뜨린다.
 * 잔진동을 크게, 이동은 거의 없게 둬야 '떨림'으로 읽힌다.
 */
function chiikawaPose(t: number): Pose {
  const tremble = Math.sin(t * 22) * 0.028;
  const sob = Math.sin(t * 1.4);
  const crying = sob > 0.45;
  return {
    hop: Math.abs(Math.sin(t * 1.4)) * 0.06,
    tilt: tremble,
    spin: Math.sin(t * 0.6) * 0.12,
    squash: 1 + Math.sin(t * 2.8) * 0.035,
    armLift: crying ? 0.9 + Math.sin(t * 18) * 0.12 : 0.15,
    earSwing: tremble * 2.2,
    crying,
  };
}

/**
 * 하치와레: 신나서 가볍게 폴짝거리며 팔을 벌린다.
 * 착지에서 눌리고 뜰 때 늘어나야 통통 튀어 보인다.
 */
function hachiwarePose(t: number): Pose {
  const cycle = (t * 1.6) % 1;
  const hop = Math.sin(cycle * Math.PI) * 0.42;
  const landing = cycle > 0.88 || cycle < 0.12;
  return {
    hop,
    tilt: Math.sin(t * 1.6) * 0.14,
    spin: Math.sin(t * 0.8) * 0.3,
    squash: landing ? 0.9 : 1 + hop * 0.12,
    armLift: 0.55 + hop * 1.1,
    earSwing: Math.sin(t * 6) * 0.09,
    crying: false,
  };
}

/**
 * 우사기: "우라!" 하고 크게 뛰며 한 바퀴 돈다. 셋 중 가장 격렬하다.
 */
function usagiPose(t: number): Pose {
  const cycle = (t * 1.15) % 1;
  const hop = Math.sin(cycle * Math.PI) * 0.78;
  const landing = cycle > 0.9 || cycle < 0.1;
  return {
    hop,
    tilt: Math.sin(t * 3.2) * 0.2,
    // 뒤통수에는 얼굴이 없다. 한 바퀴 돌리지 않고 좌우로 크게 틀었다 돌아온다.
    spin: Math.sin(cycle * TAU) * 0.55,
    squash: landing ? 0.82 : 1 + hop * 0.14,
    armLift: 1.35 + Math.sin(t * 9) * 0.25,
    earSwing: Math.sin(t * 11) * 0.3,
    crying: false,
  };
}

const POSES: Record<CharacterKey, (t: number) => Pose> = {
  chiikawa: chiikawaPose,
  hachiware: hachiwarePose,
  usagi: usagiPose,
};

export const poseAt = (key: CharacterKey, time: number): Pose => POSES[key](Math.max(0, time));

/** 움직임을 줄여 달라고 설정한 사람에게 보여줄 정지 자세 */
export const restingPose = (): Pose => ({
  hop: 0,
  tilt: 0,
  spin: 0,
  squash: 1,
  armLift: 0.2,
  earSwing: 0,
  crying: false,
});
