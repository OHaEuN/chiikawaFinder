import { test } from 'node:test';
import assert from 'node:assert/strict';
import { poseAt, restingPose } from './motions.ts';
import type { CharacterKey } from './characters.ts';

const KEYS: CharacterKey[] = ['chiikawa', 'hachiware', 'usagi'];
const sample = (key: CharacterKey, steps = 240) =>
  Array.from({ length: steps }, (_, i) => poseAt(key, (i / steps) * 6));

test('어떤 시점에도 값이 숫자로 나온다', () => {
  for (const key of KEYS) {
    for (const pose of sample(key)) {
      for (const [field, value] of Object.entries(pose)) {
        if (field === 'crying') continue;
        assert.ok(Number.isFinite(value as number), `${key}.${field} 가 숫자가 아니다`);
      }
    }
  }
});

test('발이 바닥을 뚫지 않는다', () => {
  for (const key of KEYS) {
    for (const pose of sample(key)) {
      assert.ok(pose.hop >= 0, `${key} 가 바닥 아래로 내려갔다`);
      assert.ok(pose.squash > 0.5 && pose.squash < 1.6, `${key} 의 찌그러짐이 과하다`);
    }
  }
});

test('우사기가 가장 높이 뛴다', () => {
  const peak = (key: CharacterKey) => Math.max(...sample(key).map((p) => p.hop));
  assert.ok(peak('usagi') > peak('hachiware'));
  assert.ok(peak('hachiware') > peak('chiikawa'));
});

test('치이카와만 운다', () => {
  assert.ok(sample('chiikawa').some((p) => p.crying));
  assert.ok(sample('hachiware').every((p) => !p.crying));
  assert.ok(sample('usagi').every((p) => !p.crying));
});

test('치이카와는 제자리에서 떨고 우사기는 크게 움직인다', () => {
  const spread = (key: CharacterKey) => {
    const hops = sample(key).map((p) => p.hop);
    return Math.max(...hops) - Math.min(...hops);
  };
  assert.ok(spread('chiikawa') < 0.1);
  assert.ok(spread('usagi') > 0.7);
});

test('뒤통수가 보이지 않게 회전을 제한한다', () => {
  for (const key of KEYS) {
    for (const pose of sample(key)) {
      assert.ok(Math.abs(pose.spin) < 0.9, `${key} 가 너무 많이 돌아 뒤통수가 보인다`);
    }
  }
});

test('우사기가 가장 크게 몸을 튼다', () => {
  const swing = (key: CharacterKey) => Math.max(...sample(key).map((p) => Math.abs(p.spin)));
  assert.ok(swing('usagi') > swing('chiikawa'));
});

test('시간이 음수여도 깨지지 않는다', () => {
  for (const key of KEYS) {
    const pose = poseAt(key, -5);
    assert.ok(Number.isFinite(pose.hop));
    assert.equal(pose.hop, poseAt(key, 0).hop);
  }
});

test('정지 자세는 움직임이 없다', () => {
  const pose = restingPose();
  assert.equal(pose.hop, 0);
  assert.equal(pose.spin, 0);
  assert.equal(pose.crying, false);
});
