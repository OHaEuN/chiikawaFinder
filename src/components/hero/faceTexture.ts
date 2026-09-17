import * as THREE from 'three';

/**
 * 얼굴을 머리 표면에 그린다.
 *
 * 눈·눈썹·볼을 따로 만든 3D 조각으로 붙이면 표면에서 떠 보인다. 자수처럼 보이려면
 * 텍스처로 그려서 구에 입혀야 한다. 구의 UV는 위아래로 갈수록 가로가 좁아지므로
 * 그 왜곡을 좌표마다 되돌려 준다.
 */

const TEX_H = 1024;
const TEX_W = TEX_H * 2;

/** 머리 반지름 1 기준의 얼굴 좌표. 공식 인형 사진에서 잰 비율이다. */
export const FACE = {
  eyeX: 0.32,
  eyeY: -0.12,
  eyeRadius: 0.175,
  blushX: 0.58,
  blushY: -0.46,
  blushRadius: 0.22,
  mouthY: -0.5,
};

export interface BrowStyle {
  /** 활의 가로 길이 */
  width: number;
  /** 활 꼭대기의 높이 */
  apexY: number;
  thickness: number;
  /** 눈 중심에서 좌우로 얼마나 벗어나는지 */
  offsetX: number;
}

const INK = '#4a3b33';
const BLUSH = '#f5a8b8';

/**
 * 구 표면의 점 (fx, fy) 이 텍스처의 어디에 오는지.
 * three.js 구는 앞면(+Z)이 u=0.25 에 있고, v 는 위에서 아래로 theta 를 따른다.
 */
function project(fx: number, fy: number) {
  const theta = Math.acos(THREE.MathUtils.clamp(fy, -1, 1));
  const sinTheta = Math.max(1e-4, Math.sin(theta));
  const phi = Math.acos(THREE.MathUtils.clamp(-fx / sinTheta, -1, 1));
  return {
    x: (phi / (Math.PI * 2)) * TEX_W,
    y: (theta / Math.PI) * TEX_H,
    // 가로는 위아래로 갈수록 좁아진다. 그만큼 늘려 그려야 원래 크기로 보인다.
    scaleX: TEX_W / (Math.PI * 2 * sinTheta),
    scaleY: TEX_H / Math.PI,
  };
}

/** 해당 지점으로 좌표계를 옮기고, 그 안에서는 머리 반지름 1 단위로 그린다. */
function at(ctx: CanvasRenderingContext2D, fx: number, fy: number, draw: () => void) {
  const { x, y, scaleX, scaleY } = project(fx, fy);
  ctx.save();
  ctx.translate(x, y);
  // 아래로 갈수록 theta 가 커지므로 세로를 뒤집어야 위가 위가 된다.
  ctx.scale(scaleX, -scaleY);
  draw();
  ctx.restore();
}

/**
 * 눈은 짙은 고리 안에 흰자가 차고, 그 아래에 짙은 초승달이 하나 더 있다.
 * 흰 덩어리를 위아래로 둘 나누면 눈이 갈라져 보인다.
 */
function drawEye(ctx: CanvasRenderingContext2D, side: number) {
  at(ctx, side * FACE.eyeX, FACE.eyeY, () => {
    const r = FACE.eyeRadius;

    ctx.fillStyle = INK;
    ctx.beginPath();
    ctx.ellipse(0, 0, r, r * 1.04, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(0, r * 0.08, r * 0.62, r * 0.68, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = INK;
    ctx.beginPath();
    ctx.ellipse(0, -r * 0.44, r * 0.54, r * 0.26, 0, 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawBrow(ctx: CanvasRenderingContext2D, side: number, brow: BrowStyle) {
  at(ctx, side * (FACE.eyeX + brow.offsetX), brow.apexY, () => {
    const half = brow.width / 2;
    ctx.strokeStyle = INK;
    ctx.lineWidth = brow.thickness;
    ctx.lineCap = 'round';
    ctx.beginPath();
    // 가운데가 솟은 완만한 활
    ctx.moveTo(-half, -brow.width * 0.13);
    ctx.quadraticCurveTo(0, brow.width * 0.2, half, -brow.width * 0.13);
    ctx.stroke();
  });
}

function drawBlush(ctx: CanvasRenderingContext2D, side: number) {
  at(ctx, side * FACE.blushX, FACE.blushY, () => {
    const r = FACE.blushRadius;
    ctx.fillStyle = BLUSH;
    ctx.beginPath();
    ctx.ellipse(0, 0, r, r * 0.64, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = INK;
    ctx.lineWidth = 0.018;
    ctx.lineCap = 'round';
    for (let i = 0; i < 4; i++) {
      const x = -r * 0.34 + i * r * 0.22;
      ctx.beginPath();
      ctx.moveTo(x - 0.02, -r * 0.26);
      ctx.lineTo(x + 0.03, r * 0.26);
      ctx.stroke();
    }
  });
}

/** 입은 작고 야무진 w 모양이다. 넓게 그리면 물결처럼 보인다. */
function drawMouth(ctx: CanvasRenderingContext2D) {
  at(ctx, 0, FACE.mouthY, () => {
    ctx.strokeStyle = INK;
    ctx.lineWidth = 0.024;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    const w = 0.085;
    ctx.beginPath();
    ctx.moveTo(-w, 0.028);
    ctx.quadraticCurveTo(-w * 0.5, -0.042, 0, 0.022);
    ctx.quadraticCurveTo(w * 0.5, -0.042, w, 0.028);
    ctx.stroke();
  });
}

function drawTears(ctx: CanvasRenderingContext2D) {
  for (const side of [-1, 1]) {
    at(ctx, side * FACE.eyeX, FACE.eyeY - 0.17, () => {
      ctx.fillStyle = '#a9d8f0';
      ctx.beginPath();
      ctx.ellipse(0, 0, 0.055, 0.1, 0, 0, Math.PI * 2);
      ctx.fill();
    });
  }
}

/**
 * 하치와레의 파란 머리.
 *
 * 도형 두 개를 겹쳐 만들면 면이 맞닿아 지글거린다. 텍스처로 그리면 갈라진 모양도
 * 정확히 잡을 수 있다. 이름 그대로 가운데가 八 자로 갈라져 크림색이 솟는다.
 */
function drawCap(ctx: CanvasRenderingContext2D, capColor: string, bodyColor: string) {
  // theta 는 정수리에서 잰 각도다. 값이 클수록 아래로 내려온다.
  const y = (theta: number) => (theta / Math.PI) * TEX_H;
  // 참조 사진에서 잰 값이다. 가운데가 뾰족하게 솟고 그 양옆이 가장 깊게 파인다.
  const sideY = y(1.294);
  const dipY = y(1.443);
  const peakY = y(1.139);
  const frontX = TEX_W * 0.25;
  const span = TEX_W * 0.135;
  const dipX = span * 0.52;

  ctx.fillStyle = capColor;
  ctx.fillRect(0, 0, TEX_W, sideY);

  ctx.beginPath();
  ctx.moveTo(frontX - span, sideY);
  ctx.quadraticCurveTo(frontX - dipX * 1.5, dipY, frontX - dipX, dipY);
  ctx.quadraticCurveTo(frontX - dipX * 0.42, dipY, frontX, peakY);
  ctx.quadraticCurveTo(frontX + dipX * 0.42, dipY, frontX + dipX, dipY);
  ctx.quadraticCurveTo(frontX + dipX * 1.5, dipY, frontX + span, sideY);
  ctx.closePath();
  ctx.fill();
}

/**
 * 공식 인형 사진에서 얼굴 부분만 잘라 쓰기 위한 좌표.
 * head 는 사진 속 머리의 경계, crop 은 오려 낼 얼굴 영역이다. 모두 픽셀 단위.
 */
export interface FacePhoto {
  src: string;
  /** 사진 속 두 눈의 중심. 이걸 기준으로 배율과 위치를 맞춘다. */
  eyes: { leftX: number; rightX: number; y: number };
  crop: { x: number; y: number; w: number; h: number };
}

/**
 * 사진에서 오려 낸 얼굴을 머리 표면에 올린다.
 *
 * 손으로 그린 얼굴보다 자수 결과 잔털이 그대로 남아 인형에 가깝다.
 * 사진 속 머리 크기를 기준으로 실제 머리 반지름에 맞춰 축척을 맞춘다.
 */
function drawPhotoFace(ctx: CanvasRenderingContext2D, image: HTMLImageElement, photo: FacePhoto) {
  const { eyes, crop } = photo;
  // 머리 경계를 눈대중으로 재면 사진마다 달라져 얼굴이 늘어나거나 눌린다.
  // 두 눈 사이를 기준으로 가로세로 같은 배율을 쓰면 세 캐릭터가 같은 크기로 맞는다.
  const unitPerPx = (FACE.eyeX * 2) / (eyes.rightX - eyes.leftX);

  const eyeMidX = (eyes.leftX + eyes.rightX) / 2;
  const centerX = (crop.x + crop.w / 2 - eyeMidX) * unitPerPx;
  const centerY = FACE.eyeY - (crop.y + crop.h / 2 - eyes.y) * unitPerPx;
  const width = crop.w * unitPerPx;
  const height = crop.h * unitPerPx;

  // 그대로 붙이면 잘라 낸 네모가 그대로 드러난다. 가장자리를 둥글게 지워 둔다.
  const patch = document.createElement('canvas');
  patch.width = crop.w;
  patch.height = crop.h;
  const patchCtx = patch.getContext('2d');
  if (!patchCtx) return;
  patchCtx.drawImage(image, crop.x, crop.y, crop.w, crop.h, 0, 0, crop.w, crop.h);

  // 자수 눈썹이 연해서 멀리서 잘 안 보인다. 어두운 곳만 더 어둡게 눌러 준다.
  patchCtx.globalCompositeOperation = 'multiply';
  patchCtx.globalAlpha = 0.45;
  patchCtx.drawImage(patch, 0, 0);
  patchCtx.globalAlpha = 1;
  patchCtx.globalCompositeOperation = 'source-over';

  // 네모로 잘린 자국이 남지 않게 타원으로 넉넉히 흐린다.
  const radius = crop.w / 2;
  const fade = patchCtx.createRadialGradient(0, 0, radius * 0.24, 0, 0, radius);
  fade.addColorStop(0, 'rgba(0,0,0,1)');
  fade.addColorStop(0.46, 'rgba(0,0,0,1)');
  fade.addColorStop(0.74, 'rgba(0,0,0,0.55)');
  fade.addColorStop(1, 'rgba(0,0,0,0)');

  patchCtx.globalCompositeOperation = 'destination-in';
  patchCtx.save();
  patchCtx.translate(crop.w / 2, crop.h / 2);
  patchCtx.scale(1, crop.h / crop.w);
  patchCtx.fillStyle = fade;
  patchCtx.fillRect(-radius, -radius, radius * 2, radius * 2);
  patchCtx.restore();

  at(ctx, centerX, centerY, () => {
    // at() 안은 세로가 뒤집힌 좌표계라 이미지도 뒤집힌다. 한 번 더 뒤집어 되돌린다.
    ctx.scale(1, -1);
    ctx.drawImage(patch, -width / 2, -height / 2, width, height);
  });
}

/** 머리에 입힐 얼굴 텍스처를 만든다. crying 을 켜면 눈물까지 그린다. */
export function createFaceTexture(
  bodyColor: string,
  brow: BrowStyle,
  crying = false,
  capColor?: string,
  photo?: FacePhoto,
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = TEX_W;
  canvas.height = TEX_H;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('캔버스를 만들 수 없다');

  const paint = (image?: HTMLImageElement) => {
    ctx.clearRect(0, 0, TEX_W, TEX_H);
    ctx.fillStyle = bodyColor;
    ctx.fillRect(0, 0, TEX_W, TEX_H);

    if (image && photo) {
      drawPhotoFace(ctx, image, photo);
    } else {
      drawBlush(ctx, -1);
      drawBlush(ctx, 1);
      drawEye(ctx, -1);
      drawEye(ctx, 1);
      drawBrow(ctx, -1, brow);
      drawBrow(ctx, 1, brow);
      drawMouth(ctx);
    }
    // 앞머리는 얼굴 위에 덮는다. 먼저 그리면 사진에 딸려 온 파란 부분과 두 겹이 된다.
    if (capColor) drawCap(ctx, capColor, bodyColor);
    if (crying) drawTears(ctx);
  };

  // 사진이 오기 전에는 그린 얼굴을 보여 주고, 도착하면 갈아 끼운다.
  paint();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;

  if (photo) {
    const image = new Image();
    image.onload = () => {
      paint(image);
      texture.needsUpdate = true;
    };
    image.src = photo.src;
  }

  return texture;
}
