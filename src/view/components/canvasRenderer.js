import { projectPoint } from '../../logic/engine/projection.js';

function hexToRgba(hex, alpha) {
  const normalized = hex.replace('#', '');
  const value = normalized.length === 3
    ? normalized.split('').map((part) => part + part).join('')
    : normalized;
  const red = Number.parseInt(value.slice(0, 2), 16);
  const green = Number.parseInt(value.slice(2, 4), 16);
  const blue = Number.parseInt(value.slice(4, 6), 16);
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

export function createCanvasRenderer(canvas, config) {
  const context = canvas.getContext('2d');
  const dimensions = {
    width: window.innerWidth,
    height: window.innerHeight,
  };

  const resize = () => {
    dimensions.width = canvas.width = window.innerWidth;
    dimensions.height = canvas.height = window.innerHeight;
  };

  const project = (x, y, z) => projectPoint(dimensions, config, x, y, z);

  const drawLine = (x1, y1, x2, y2, color, lineWidth, blur = 5) => {
    context.beginPath();
    context.moveTo(x1, y1);
    context.lineTo(x2, y2);
    context.strokeStyle = color;
    context.lineWidth = lineWidth;
    context.shadowBlur = blur;
    context.shadowColor = color;
    context.stroke();
    context.shadowBlur = 0;
  };

  const drawPaddleLine = (x, y, z, color, hitActive = false) => {
    const left = project(x - config.paddleWidth / 2, y, z);
    const right = project(x + config.paddleWidth / 2, y, z);
    const glow = hitActive ? 26 : 14;
    const thickness = Math.max(3, (hitActive ? 9 : 6) * left.scale);

    drawLine(left.sx, left.sy, right.sx, right.sy, color, thickness, glow);
    drawLine(left.sx, left.sy, right.sx, right.sy, '#ffffff', Math.max(1.5, thickness * 0.3), 0);
  };

  const drawHitEffect = (effect) => {
    const projection = project(effect.x, effect.y, effect.z);
    const radius = (config.ballRadius * 1.2 + effect.progress * config.ballRadius * 2.4) * projection.scale;
    const alpha = Math.max(0, 0.65 - effect.progress * 0.65);
    const color = effect.owner === 'player' ? config.playerColor : config.enemyColor;

    context.beginPath();
    context.arc(projection.sx, projection.sy, radius, 0, Math.PI * 2);
    context.strokeStyle = hexToRgba(color, alpha);
    context.lineWidth = Math.max(1.5, 4 * projection.scale);
    context.shadowBlur = 18;
    context.shadowColor = color;
    context.stroke();
    context.shadowBlur = 0;
  };

  const drawParticles = (particles) => {
    particles.forEach((particle) => {
      const projection = project(particle.x, Math.max(0.01, particle.y), particle.z);
      const radius = Math.max(1.5, config.ballRadius * particle.size * projection.scale);
      context.beginPath();
      context.arc(projection.sx, projection.sy, radius, 0, Math.PI * 2);
      context.fillStyle = hexToRgba(particle.color, 0.78);
      context.shadowBlur = 10;
      context.shadowColor = particle.color;
      context.fill();
      context.shadowBlur = 0;
    });
  };

  const drawBall = (ball) => {
    const projection = project(ball.x, ball.y, ball.z);
    const shadow = project(ball.x, 0, ball.z);
    const planarSpeed = Math.hypot(ball.vx, ball.vz);
    const onFire = planarSpeed >= config.fireSpeedThreshold;
    const coreColor = onFire ? '#ffb347' : config.ballColor;
    const auraColor = onFire ? '#ff5a1f' : config.ballColor;
    const shadowVisible = ball.x >= -1 && ball.x <= 1 && ball.z >= 0 && ball.z <= 1;

    if (shadowVisible) {
      context.beginPath();
      context.ellipse(
        shadow.sx,
        shadow.baseSy,
        config.ballRadius * shadow.scale,
        (config.ballRadius / 3) * shadow.scale,
        0,
        0,
        Math.PI * 2,
      );
      context.fillStyle = 'rgba(0, 0, 0, 0.6)';
      context.fill();
    }

    for (let index = 0; index < ball.trail.length; index += 1) {
      const trailPoint = ball.trail[index];
      const trailProjection = project(trailPoint.x, trailPoint.y, trailPoint.z);
      const alpha = (index / ball.trail.length) * 0.6;
      const radius = config.ballRadius * trailProjection.scale * (0.3 + 0.7 * (index / ball.trail.length));

      context.beginPath();
      context.arc(trailProjection.sx, trailProjection.sy, radius, 0, Math.PI * 2);
      context.fillStyle = onFire ? `rgba(255, 130, 32, ${alpha})` : `rgba(255, 0, 85, ${alpha})`;
      context.fill();
    }

    if (onFire) {
      for (let index = 0; index < 3; index += 1) {
        const flameOffset = (index + 1) * config.ballRadius * projection.scale * 0.7;
        context.beginPath();
        context.ellipse(
          projection.sx,
          projection.sy + flameOffset * 0.45,
          config.ballRadius * projection.scale * (0.55 - index * 0.08),
          config.ballRadius * projection.scale * (0.95 - index * 0.12),
          0,
          0,
          Math.PI * 2,
        );
        context.fillStyle = `rgba(255, ${150 - index * 25}, ${40 + index * 10}, ${0.28 - index * 0.05})`;
        context.fill();
      }
    }

    context.beginPath();
    context.arc(projection.sx, projection.sy, config.ballRadius * projection.scale, 0, Math.PI * 2);
    context.fillStyle = '#ffffff';
    context.shadowBlur = (onFire ? 32 : 20) * projection.scale;
    context.shadowColor = auraColor;
    context.fill();

    context.beginPath();
    context.arc(projection.sx, projection.sy, config.ballRadius * projection.scale * 0.6, 0, Math.PI * 2);
    context.fillStyle = coreColor;
    context.fill();
    context.shadowBlur = 0;
  };

  const render = (state) => {
    context.fillStyle = 'rgba(13, 13, 18, 0.4)';
    context.fillRect(0, 0, dimensions.width, dimensions.height);

    const topLeft = project(-1, 0, 1);
    const topRight = project(1, 0, 1);
    const bottomLeft = project(-1, 0, 0);
    const bottomRight = project(1, 0, 0);

    context.beginPath();
    context.moveTo(topLeft.sx, topLeft.sy);
    context.lineTo(topRight.sx, topRight.sy);
    context.lineTo(bottomRight.sx, bottomRight.sy);
    context.lineTo(bottomLeft.sx, bottomLeft.sy);
    context.closePath();

    const tableGradient = context.createLinearGradient(0, bottomRight.sy, 0, topLeft.sy);
    tableGradient.addColorStop(0, 'rgba(0, 255, 255, 0.15)');
    tableGradient.addColorStop(1, 'rgba(0, 255, 255, 0.02)');
    context.fillStyle = tableGradient;
    context.fill();

    context.lineJoin = 'round';
    drawLine(bottomLeft.sx, bottomLeft.sy, topLeft.sx, topLeft.sy, config.lineColor, 3, 10);
    drawLine(bottomRight.sx, bottomRight.sy, topRight.sx, topRight.sy, config.lineColor, 3, 10);
    drawLine(topLeft.sx, topLeft.sy, topRight.sx, topRight.sy, config.lineColor, 2, 5);
    drawLine(bottomLeft.sx, bottomLeft.sy, bottomRight.sx, bottomRight.sy, config.lineColor, 4, 15);

    const netLeft = project(-1, 0, 0.5);
    const netRight = project(1, 0, 0.5);
    const centerBottom = project(0, 0, 0);
    const centerTop = project(0, 0, 1);
    context.setLineDash([10, 15]);
    drawLine(centerBottom.sx, centerBottom.sy, centerTop.sx, centerTop.sy, 'rgba(0, 255, 255, 0.5)', 2, 0);
    context.setLineDash([]);
    drawLine(netLeft.sx, netLeft.sy, netRight.sx, netRight.sy, 'rgba(255, 255, 255, 0.3)', 2, 5);
    const netTopLeft = project(-1, 0.15, 0.5);
    const netTopRight = project(1, 0.15, 0.5);
    drawLine(netTopLeft.sx, netTopLeft.sy, netTopRight.sx, netTopRight.sy, 'rgba(255, 255, 255, 0.6)', 1, 5);
    context.fillStyle = 'rgba(255, 255, 255, 0.1)';
    context.beginPath();
    context.moveTo(netLeft.sx, netLeft.sy);
    context.lineTo(netRight.sx, netRight.sy);
    context.lineTo(netTopRight.sx, netTopRight.sy);
    context.lineTo(netTopLeft.sx, netTopLeft.sy);
    context.fill();

    drawPaddleLine(state.enemy.x, state.enemy.y, state.enemy.z, config.enemyColor, state.enemy.hitActive);
    drawParticles(state.particles);
    drawBall(state.ball);
    drawPaddleLine(state.player.x, state.player.y, state.player.z, config.playerColor, state.player.hitActive);

    if (state.hitEffect) {
      drawHitEffect(state.hitEffect);
    }
  };

  resize();

  return {
    resize,
    render,
  };
}