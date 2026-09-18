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
  eyeY: 0.04,
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
  /*
   * 앞머리 아랫선. 확대한 사진에서 세 지점을 재서 만든다.
   *  - 가운데: 크림색이 뾰족하게 솟는다. 가르마다.
   *  - 그 양옆: 파란 부분이 가장 낮게 내려온다.
   *  - 맨 바깥: 귀 쪽으로 가며 다시 올라간다.
   * 가운데 솟는 폭이 좁아야 가르마로 읽힌다. 넓으면 바가지머리가 된다.
   */
  const thetaLow = 1.17;
  const thetaEdge = 0.95;
  const thetaPeak = 0.73;
  const PEAK_WIDTH = 0.072;

  const boundary = (t: number) => {
    const fromCenter = Math.abs(2 * t - 1);
    const sides = (thetaLow - thetaEdge) * fromCenter ** 1.6;
    const parting = (thetaLow - thetaPeak) * Math.exp(-(((t - 0.5) / PEAK_WIDTH) ** 2));
    return thetaLow - sides - parting;
  };

  const baseY = y(thetaLow);
  ctx.fillStyle = capColor;
  ctx.fillRect(0, 0, TEX_W, baseY);

  // 앞쪽 반구에서 파란 부분을 도려내 가르마와 옆선을 만든다.
  ctx.fillStyle = bodyColor;
  ctx.beginPath();
  ctx.moveTo(0, baseY);
  const steps = 160;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    ctx.lineTo(t * TEX_W * 0.5, y(boundary(t)));
  }
  ctx.lineTo(TEX_W * 0.5, baseY);
  ctx.closePath();
  ctx.fill();
}

/**
 * 공식 인형 사진에서 얼굴 부분만 잘라 쓰기 위한 좌표.
 * head 는 사진 속 머리의 경계, crop 은 오려 낼 얼굴 영역이다. 모두 픽셀 단위.
 */
/**
 * 머리에 입힐 얼굴 그림.
 *
 * scripts/hero-face.py 가 극장판 공식 일러스트에서 미리 잘라 둔 투명 PNG다.
 * 예전에는 인형 사진을 받아 브라우저에서 얼굴만 골라냈는데,
 * 털 결과 조명이 같이 남아 얼룩이 생겼고 브라우저마다 결과가 달랐다.
 */
export interface FacePhoto {
  src: string;
  /** 그림 속 두 눈 사이 거리(px). 머리 크기에 맞출 배율을 여기서 구한다. */
  eyeSpan: number;
  /** 그림 위쪽에서 눈까지의 거리(px) */
  eyeY: number;
  /** 눈썹을 따로 그려야 하는지. 앞머리 선과 붙어 있어 그림에서 떼어 낼 수 없을 때 쓴다. */
  drawnBrows?: boolean;
}

function drawPhotoFace(ctx: CanvasRenderingContext2D, image: HTMLImageElement, photo: FacePhoto): void {
  const { eyeSpan, eyeY } = photo;
  const unitPerPx = (FACE.eyeX * 2) / eyeSpan;
  const width = image.naturalWidth * unitPerPx;
  const height = image.naturalHeight * unitPerPx;
  // 눈 중점이 가로 가운데 오도록 잘라 둔 그림이라 좌우는 그냥 가운데에 맞춘다.
  const centerY = FACE.eyeY - (image.naturalHeight / 2 - eyeY) * unitPerPx;

  at(ctx, 0, centerY, () => {
    // at() 안은 세로가 뒤집힌 좌표계라 이미지도 뒤집힌다. 한 번 더 뒤집어 되돌린다.
    ctx.scale(1, -1);
    ctx.drawImage(image, -width / 2, -height / 2, width, height);
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
    /*
     * 얼굴은 요소만 오려 붙이므로 바탕은 사진 색을 따를 필요가 없다.
     * 사진에서 뽑으면 그 지점의 그늘까지 딸려 와 얼굴이 칙칙해진다. 밝은 색을 직접 쓴다.
     */
    ctx.fillStyle = bodyColor;
    ctx.fillRect(0, 0, TEX_W, TEX_H);

    if (image && photo) {
      drawPhotoFace(ctx, image, photo);
      if (photo.drawnBrows) {
        drawBrow(ctx, -1, brow);
        drawBrow(ctx, 1, brow);
      }
    } else {
      // 그림을 못 받아 왔을 때만 손으로 그린다.
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
