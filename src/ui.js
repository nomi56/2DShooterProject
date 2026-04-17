import { BUILD } from './version.js';

const CANVAS_W = 480;
const CANVAS_H = 640;

export function drawHUD(ctx, player, boss = null) {
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 14px monospace';
  ctx.textAlign = 'left';
  ctx.fillText(`SCORE: ${player.score}`, 10, 30);

  ctx.fillStyle = '#4af';
  ctx.font = '13px monospace';
  ctx.fillText('LIVES:', 10, 50);
  for (let i = 0; i < player.lives; i++) {
    _drawMiniShip(ctx, 70 + i * 22, 44);
  }

  ctx.font = '11px monospace';
  const MAX = 10;
  ctx.fillStyle = '#ff0';
  ctx.fillText(`PWR:${'■'.repeat(player.powerLevel)}${'□'.repeat(MAX - player.powerLevel)}`, 10, 66);
  ctx.fillStyle = '#0ff';
  ctx.fillText(`RTE:${'■'.repeat(player.fireRateLevel)}${'□'.repeat(MAX - player.fireRateLevel)}`, 10, 80);
  ctx.fillStyle = '#f80';
  ctx.fillText(`SPD:${'■'.repeat(player.bulletSpeedLevel)}${'□'.repeat(MAX - player.bulletSpeedLevel)}`, 10, 94);

  if (boss) {
    const barW  = CANVAS_W - 40;
    const ratio = boss.hp / boss.maxHp;
    ctx.fillStyle = '#111';
    ctx.fillRect(20, 12, barW, 10);
    const grad = ctx.createLinearGradient(20, 0, 20 + barW * ratio, 0);
    grad.addColorStop(0, '#f00');
    grad.addColorStop(1, '#ff0');
    ctx.fillStyle = grad;
    ctx.fillRect(20, 12, barW * ratio, 10);
    ctx.strokeStyle = '#555';
    ctx.lineWidth = 1;
    ctx.strokeRect(20, 12, barW, 10);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 9px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('BOSS', 22, 21);
  }
}

function _drawMiniShip(ctx, x, y) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = '#4af';
  ctx.beginPath();
  ctx.moveTo(0, -8);
  ctx.lineTo(7, 8);
  ctx.lineTo(0, 3);
  ctx.lineTo(-7, 8);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

export function drawTitle(ctx) {
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  ctx.textAlign = 'center';
  ctx.shadowColor = '#0ff';
  ctx.shadowBlur = 20;
  ctx.fillStyle = '#0ff';
  ctx.font = 'bold 48px monospace';
  ctx.fillText('2D SHOOTER', CANVAS_W / 2, 200);

  ctx.shadowBlur = 0;
  ctx.fillStyle = '#aaa';
  ctx.font = '16px monospace';
  ctx.fillText('MOVE: Mouse / Arrow keys / Swipe', CANVAS_W / 2, 280);
  ctx.fillText('SHOOT: Auto', CANVAS_W / 2, 305);

  ctx.fillStyle = '#ff0';
  ctx.font = 'bold 18px monospace';
  ctx.fillText('SPACE / Click / Tap to Start', CANVAS_W / 2, 380);

  ctx.fillStyle = '#555';
  ctx.font = '11px monospace';
  ctx.fillText(`build: ${BUILD}`, CANVAS_W / 2, CANVAS_H - 12);
}

export function drawGameOver(ctx, score) {
  ctx.fillStyle = 'rgba(0,0,0,0.65)';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  ctx.textAlign = 'center';
  ctx.shadowColor = '#f00';
  ctx.shadowBlur = 20;
  ctx.fillStyle = '#f44';
  ctx.font = 'bold 52px monospace';
  ctx.fillText('GAME OVER', CANVAS_W / 2, 240);

  ctx.shadowBlur = 0;
  ctx.fillStyle = '#fff';
  ctx.font = '20px monospace';
  ctx.fillText(`SCORE: ${score}`, CANVAS_W / 2, 300);

  ctx.fillStyle = '#ff0';
  ctx.font = 'bold 18px monospace';
  ctx.fillText('SPACE / Click / Tap to Retry', CANVAS_W / 2, 380);
}

export function drawStageClear(ctx, score) {
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  ctx.textAlign = 'center';
  ctx.shadowColor = '#0f0';
  ctx.shadowBlur = 20;
  ctx.fillStyle = '#0f8';
  ctx.font = 'bold 44px monospace';
  ctx.fillText('STAGE CLEAR!', CANVAS_W / 2, 240);

  ctx.shadowBlur = 0;
  ctx.fillStyle = '#fff';
  ctx.font = '20px monospace';
  ctx.fillText(`FINAL SCORE: ${score}`, CANVAS_W / 2, 300);

  ctx.fillStyle = '#ff0';
  ctx.font = 'bold 18px monospace';
  ctx.fillText('SPACE / Click / Tap to Retry', CANVAS_W / 2, 380);
}
