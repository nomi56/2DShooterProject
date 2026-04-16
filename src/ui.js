const CANVAS_W = 480;
const CANVAS_H = 640;

export function drawHUD(ctx, player) {
  // Score
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 14px monospace';
  ctx.textAlign = 'left';
  ctx.fillText(`SCORE: ${player.score}`, 10, 30);

  // Lives (ship icons)
  ctx.fillStyle = '#4af';
  ctx.font = '13px monospace';
  ctx.fillText('LIVES:', 10, 50);
  for (let i = 0; i < player.lives; i++) {
    _drawMiniShip(ctx, 70 + i * 22, 44);
  }

  // Power level
  ctx.fillStyle = '#ff0';
  ctx.font = '12px monospace';
  ctx.fillText(`PWR: ${'■'.repeat(player.powerLevel)}${'□'.repeat(3 - player.powerLevel)}`, 10, 66);
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
  // Dim overlay
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  ctx.textAlign = 'center';

  // Title
  ctx.shadowColor = '#0ff';
  ctx.shadowBlur = 20;
  ctx.fillStyle = '#0ff';
  ctx.font = 'bold 48px monospace';
  ctx.fillText('2D SHOOTER', CANVAS_W / 2, 200);

  ctx.shadowBlur = 0;
  ctx.fillStyle = '#aaa';
  ctx.font = '16px monospace';
  ctx.fillText('MOVE: Mouse / Arrow keys', CANVAS_W / 2, 280);
  ctx.fillText('SHOOT: Auto (keyboard) / Click', CANVAS_W / 2, 305);

  ctx.fillStyle = '#ff0';
  ctx.font = 'bold 18px monospace';
  ctx.fillText('Press SPACE or Click to Start', CANVAS_W / 2, 380);
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
  ctx.fillText('Press SPACE or Click to Retry', CANVAS_W / 2, 380);
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
  ctx.fillText('Press SPACE or Click to Retry', CANVAS_W / 2, 380);
}
