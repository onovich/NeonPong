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

  const drawPaddle = (x, z, color) => {
    const leftBottom = project(x - config.paddleWidth / 2, 0, z);
    const rightBottom = project(x + config.paddleWidth / 2, 0, z);
    const leftTop = project(x - config.paddleWidth / 2, config.paddleHeight, z);
    const rightTop = project(x + config.paddleWidth / 2, config.paddleHeight, z);

    context.beginPath();
    context.moveTo(leftBottom.sx, leftBottom.sy);
    context.lineTo(rightBottom.sx, rightBottom.sy);
    context.lineTo(rightTop.sx, rightTop.sy);
    context.lineTo(leftTop.sx, leftTop.sy);
    context.closePath();
    context.fillStyle = 'rgba(0, 0, 0, 0.8)';
    context.fill();
    context.strokeStyle = color;
    context.lineWidth = 3 * leftBottom.scale;
    context.shadowBlur = 15;
    context.shadowColor = color;
    context.stroke();
    context.shadowBlur = 0;
    context.fillStyle = hexToRgba(color, 0.25);
    context.fill();
  };

  const drawBall = (ball) => {
    const projection = project(ball.x, ball.y, ball.z);
    const shadow = project(ball.x, 0, ball.z);

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

    for (let index = 0; index < ball.trail.length; index += 1) {
      const trailPoint = ball.trail[index];
      const trailProjection = project(trailPoint.x, trailPoint.y, trailPoint.z);
      const alpha = (index / ball.trail.length) * 0.6;
      const radius = config.ballRadius * trailProjection.scale * (0.3 + 0.7 * (index / ball.trail.length));

      context.beginPath();
      context.arc(trailProjection.sx, trailProjection.sy, radius, 0, Math.PI * 2);
      context.fillStyle = `rgba(255, 0, 85, ${alpha})`;
      context.fill();
    }

    context.beginPath();
    context.arc(projection.sx, projection.sy, config.ballRadius * projection.scale, 0, Math.PI * 2);
    context.fillStyle = '#ffffff';
    context.shadowBlur = 20 * projection.scale;
    context.shadowColor = config.ballColor;
    context.fill();

    context.beginPath();
    context.arc(projection.sx, projection.sy, config.ballRadius * projection.scale * 0.6, 0, Math.PI * 2);
    context.fillStyle = config.ballColor;
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

    drawPaddle(state.enemy.x, 1, config.enemyColor);
    drawBall(state.ball);
    drawPaddle(state.player.x, 0, config.playerColor);
  };

  resize();

  return {
    resize,
    render,
  };
}