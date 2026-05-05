import { createInitialState } from './gameState.js';

function clampPaddleX(config, value) {
  const edge = 1 - config.paddleWidth / 2;
  return Math.max(-edge, Math.min(edge, value));
}

export function createGameEngine(config, random = Math.random) {
  const state = createInitialState(config);

  const resetBall = (serveToPlayer) => {
    state.ball.x = 0;
    state.ball.y = 1;
    state.ball.z = 0.5;
    state.ball.trail = [];
    state.ball.vz = config.baseSpeedZ * (serveToPlayer ? -1 : 1);
    state.ball.vy = 0;
    state.ball.vx = (random() - 0.5) * 1.5;
  };

  const score = (playerScored, now) => {
    if (playerScored) {
      state.scorePlayer += 1;
    } else {
      state.scoreEnemy += 1;
    }

    state.flashUntil = now + 100;

    if (state.scorePlayer >= config.maxScore || state.scoreEnemy >= config.maxScore) {
      state.status = 'gameover';
      state.winner = playerScored ? 'player' : 'enemy';
      return;
    }

    resetBall(playerScored);
  };

  const hitBall = (paddleX, isEnemy = false) => {
    const ball = state.ball;

    ball.vz *= -config.speedMultiplier;
    ball.vy = 1.2 + random() * 0.4;
    ball.vx = (ball.x - paddleX) * 3.5;

    if (isEnemy) {
      ball.z = 0.98;
      ball.vz = Math.max(ball.vz, -config.baseSpeedZ * 3);
      return;
    }

    ball.z = 0.02;
    ball.vz = Math.min(ball.vz, config.baseSpeedZ * 3);
  };

  return {
    getState() {
      return {
        ...state,
        flashActive: state.flashUntil > performance.now(),
      };
    },
    setPointerTarget(normalizedX) {
      state.pointerTarget = normalizedX * 1.5;
    },
    startMatch() {
      const fresh = createInitialState(config);
      state.status = 'playing';
      state.winner = null;
      state.scorePlayer = fresh.scorePlayer;
      state.scoreEnemy = fresh.scoreEnemy;
      state.pointerTarget = fresh.pointerTarget;
      state.player.x = fresh.player.x;
      state.enemy.x = fresh.enemy.x;
      state.enemy.targetX = fresh.enemy.targetX;
      state.flashUntil = 0;
      resetBall(false);
    },
    update(dt, now) {
      if (state.status !== 'playing') {
        return;
      }

      state.player.x += (state.pointerTarget - state.player.x) * config.playerFollowSpeed * dt;
      state.player.x = clampPaddleX(config, state.player.x);

      const ball = state.ball;
      let targetX = ball.vz > 0 ? ball.x + ball.vx * (1 - ball.z) : 0;
      targetX = clampPaddleX(config, targetX);
      state.enemy.targetX = targetX;

      if (state.enemy.x < targetX) {
        state.enemy.x = Math.min(targetX, state.enemy.x + config.aiSpeed * dt);
      }
      if (state.enemy.x > targetX) {
        state.enemy.x = Math.max(targetX, state.enemy.x - config.aiSpeed * dt);
      }

      ball.trail.push({ x: ball.x, y: ball.y, z: ball.z });
      if (ball.trail.length > ball.maxTrail) {
        ball.trail.shift();
      }

      ball.x += ball.vx * dt;
      ball.y += ball.vy * dt;
      ball.z += ball.vz * dt;
      ball.vy -= config.gravity * dt;

      if (ball.y < 0) {
        ball.y = 0;
        if (ball.vy < 0) {
          ball.vy = -ball.vy * config.bounceDamping;
          if (ball.vy < 0.2) {
            ball.vy = 0;
          }
        }
      }

      if (ball.x < -1 || ball.x > 1) {
        ball.vx *= -1;
        ball.x = ball.x < -1 ? -1 : 1;
      }

      if (ball.z <= 0.02 && ball.vz < 0) {
        if (Math.abs(ball.x - state.player.x) < config.paddleWidth / 2 + 0.1) {
          hitBall(state.player.x);
        } else if (ball.z < -0.1) {
          score(false, now);
        }
      }

      if (ball.z >= 0.98 && ball.vz > 0) {
        if (Math.abs(ball.x - state.enemy.x) < config.paddleWidth / 2 + 0.1) {
          hitBall(state.enemy.x, true);
        } else if (ball.z > 1.1) {
          score(true, now);
        }
      }
    },
  };
}