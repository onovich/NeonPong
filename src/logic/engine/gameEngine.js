import { createInitialState } from './gameState.js';

function clampPaddleX(config, value) {
  const edge = 1 - config.paddleWidth / 2;
  return Math.max(-edge, Math.min(edge, value));
}

function clampPlayerZ(config, value) {
  return Math.max(config.playerMinZ, Math.min(config.playerMaxZ, value));
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

  const hitBall = (paddleX, paddleZ, now, isEnemy = false) => {
    const ball = state.ball;
    const owner = isEnemy ? 'enemy' : 'player';

    ball.vz *= -config.speedMultiplier;
    ball.vy = 1.2 + random() * 0.4;
    ball.vx = (ball.x - paddleX) * 3.5;
    state.hitEffect = {
      owner,
      x: ball.x,
      y: Math.max(ball.y, 0.08),
      z: paddleZ,
      until: now + config.hitFlashDuration,
    };

    if (isEnemy) {
      state.enemy.hitUntil = now + config.hitFlashDuration;
      ball.z = config.enemyZ - 0.02;
      ball.vz = Math.max(ball.vz, -config.baseSpeedZ * 3);
      return;
    }

    state.player.hitUntil = now + config.hitFlashDuration;
    ball.z = paddleZ + 0.02;
    ball.vz = Math.min(ball.vz, config.baseSpeedZ * 3);
  };

  const handleOutOfBoundsLanding = (ball, now) => {
    if (ball.y >= 0) {
      return false;
    }

    if (ball.z < 0 && ball.vz < 0) {
      score(false, now);
      return true;
    }

    if (ball.z > 1 && ball.vz > 0) {
      score(true, now);
      return true;
    }

    return false;
  };

  return {
    getState() {
      const now = performance.now();
      const hitEffect = state.hitEffect && state.hitEffect.until > now ? {
        ...state.hitEffect,
        progress: 1 - ((state.hitEffect.until - now) / config.hitFlashDuration),
      } : null;

      return {
        ...state,
        flashActive: state.flashUntil > now,
        hitEffect,
        player: {
          ...state.player,
          hitActive: state.player.hitUntil > now,
        },
        enemy: {
          ...state.enemy,
          hitActive: state.enemy.hitUntil > now,
        },
      };
    },
    setPointerTarget(normalizedX, normalizedDepth) {
      state.pointerTarget.x = normalizedX * 1.5;
      state.pointerTarget.z = clampPlayerZ(
        config,
        config.playerMinZ + normalizedDepth * (config.playerMaxZ - config.playerMinZ),
      );
    },
    startMatch() {
      const fresh = createInitialState(config);
      state.status = 'playing';
      state.winner = null;
      state.scorePlayer = fresh.scorePlayer;
      state.scoreEnemy = fresh.scoreEnemy;
      state.pointerTarget.x = fresh.pointerTarget.x;
      state.pointerTarget.z = fresh.pointerTarget.z;
      state.player.x = fresh.player.x;
      state.player.z = fresh.player.z;
      state.player.hitUntil = 0;
      state.enemy.x = fresh.enemy.x;
      state.enemy.z = fresh.enemy.z;
      state.enemy.targetX = fresh.enemy.targetX;
      state.enemy.hitUntil = 0;
      state.flashUntil = 0;
      state.hitEffect = null;
      resetBall(false);
    },
    update(dt, now) {
      if (state.status !== 'playing') {
        return;
      }

      state.player.x += (state.pointerTarget.x - state.player.x) * config.playerFollowSpeed * dt;
      state.player.x = clampPaddleX(config, state.player.x);
      state.player.z += (state.pointerTarget.z - state.player.z) * config.playerDepthFollowSpeed * dt;
      state.player.z = clampPlayerZ(config, state.player.z);

      const ball = state.ball;
      const previousZ = ball.z;
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

      if (handleOutOfBoundsLanding(ball, now)) {
        return;
      }

      if (ball.y < 0) {
        ball.y = 0;
        if (ball.vy < 0 && ball.z >= 0 && ball.z <= 1) {
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

      if (ball.vz < 0 && previousZ >= state.player.z && ball.z <= state.player.z) {
        if (Math.abs(ball.x - state.player.x) < config.paddleWidth / 2 + 0.1) {
          hitBall(state.player.x, state.player.z, now);
        }
      }

      if (ball.vz > 0 && previousZ <= state.enemy.z && ball.z >= state.enemy.z) {
        if (Math.abs(ball.x - state.enemy.x) < config.paddleWidth / 2 + 0.1) {
          hitBall(state.enemy.x, state.enemy.z, now, true);
        }
      }
    },
  };
}