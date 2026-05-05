import { createInitialState } from './gameState.js';

function clampPaddleX(config, value) {
  const edge = 1 - config.paddleWidth / 2;
  return Math.max(-edge, Math.min(edge, value));
}

function clampPlayerZ(config, value) {
  return Math.max(config.playerMinZ, Math.min(config.playerMaxZ, value));
}

function spawnParticles(state, config, random, options) {
  const { owner, x, y, z, now, count, color, spread = 1 } = options;

  for (let index = 0; index < count; index += 1) {
    state.particles.push({
      owner,
      x,
      y,
      z,
      vx: (random() - 0.5) * 1.8 * spread,
      vy: random() * 1.5 * spread,
      vz: (random() - 0.5) * 0.8 * spread,
      size: 0.018 + random() * 0.025,
      color,
      until: now + config.particleLifetime * (0.75 + random() * 0.5),
    });
  }
}

function applyShake(state, config, kind, now) {
  if (kind === 'hit') {
    state.shake = {
      until: now + config.hitShakeDuration,
      power: config.hitShakePower,
    };
    return;
  }

  state.shake = {
    until: now + config.missShakeDuration,
    power: config.missShakePower,
  };
}

function setMessage(state, config, text, tone, now) {
  state.message = {
    text,
    tone,
    until: now + config.messageDuration,
  };
}

export function createGameEngine(config, random = Math.random) {
  const state = createInitialState(config);

  const resetBall = (serveToPlayer) => {
    state.ball.x = 0;
    state.ball.y = config.serveStartY;
    state.ball.z = 0.5;
    state.ball.trail = [];
    state.ball.vz = config.baseSpeedZ * (serveToPlayer ? -1 : 1);
    state.ball.vy = config.serveDropVelocityY;
    state.ball.vx = (random() - 0.5) * config.serveSpreadX;
  };

  const score = (playerScored, now) => {
    if (playerScored) {
      state.scorePlayer += 1;
      setMessage(state, config, 'Point Claimed', 'positive', now);
    } else {
      state.scoreEnemy += 1;
      setMessage(state, config, 'Ball Lost', 'negative', now);
    }

    state.flashUntil = now + config.missFlashDuration;
    state.flashKind = playerScored ? 'positive' : 'negative';
    applyShake(state, config, 'miss', now);
    spawnParticles(state, config, random, {
      owner: playerScored ? 'enemy' : 'player',
      x: state.ball.x,
      y: Math.max(state.ball.y, 0.02),
      z: Math.min(1.05, Math.max(-0.05, state.ball.z)),
      now,
      count: config.missParticleCount,
      color: playerScored ? config.playerColor : config.enemyColor,
      spread: 1.4,
    });

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
    const paddleY = isEnemy ? state.enemy.y : state.player.y;

    ball.vz *= -config.speedMultiplier;
    ball.vy = config.returnLiftVelocityY + random() * 0.18;
    ball.vx = (ball.x - paddleX) * 3.5;
    state.hitEffect = {
      owner,
      x: ball.x,
      y: Math.max(ball.y, paddleY),
      z: paddleZ,
      until: now + config.hitFlashDuration,
    };
    state.flashUntil = now + 70;
    state.flashKind = owner;
    applyShake(state, config, 'hit', now);
    spawnParticles(state, config, random, {
      owner,
      x: ball.x,
      y: Math.max(ball.y, paddleY),
      z: paddleZ,
      now,
      count: config.hitParticleCount,
      color: owner === 'player' ? config.playerColor : config.enemyColor,
    });

    if (isEnemy) {
      state.enemy.hitUntil = now + config.hitFlashDuration;
      setMessage(state, config, 'Opponent Return', 'warning', now);
      ball.z = config.enemyZ - 0.02;
      ball.vz = Math.max(ball.vz, -config.baseSpeedZ * 3);
      return;
    }

    state.player.hitUntil = now + config.hitFlashDuration;
    setMessage(state, config, 'Clean Return!', 'positive', now);
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
      const message = state.message && state.message.until > now ? state.message : null;
      const shake = state.shake && state.shake.until > now
        ? { ...state.shake, amount: state.shake.power * ((state.shake.until - now) / (state.shake.power === config.hitShakePower ? config.hitShakeDuration : config.missShakeDuration)) }
        : null;

      return {
        ...state,
        flashActive: state.flashUntil > now,
        flashKind: state.flashUntil > now ? state.flashKind : null,
        hitEffect,
        message,
        shake,
        particles: state.particles,
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
    setControlState(control, pressed) {
      if (!(control in state.controls)) {
        return;
      }

      state.controls[control] = pressed;
    },
    startMatch() {
      const fresh = createInitialState(config);
      state.status = 'playing';
      state.winner = null;
      state.scorePlayer = fresh.scorePlayer;
      state.scoreEnemy = fresh.scoreEnemy;
      state.controls = { ...fresh.controls };
      state.player.x = fresh.player.x;
      state.player.z = fresh.player.z;
      state.player.y = fresh.player.y;
      state.player.hitUntil = 0;
      state.enemy.x = fresh.enemy.x;
      state.enemy.z = fresh.enemy.z;
      state.enemy.y = fresh.enemy.y;
      state.enemy.targetX = fresh.enemy.targetX;
      state.enemy.hitUntil = 0;
      state.flashUntil = 0;
      state.flashKind = null;
      state.hitEffect = null;
      state.particles = [];
      state.message = null;
      state.shake = null;
      resetBall(true);
    },
    update(dt, now) {
      if (state.status !== 'playing') {
        return;
      }

      const horizontalIntent = (state.controls.right ? 1 : 0) - (state.controls.left ? 1 : 0);
      const depthIntent = (state.controls.forward ? 1 : 0) - (state.controls.backward ? 1 : 0);

      state.player.x += horizontalIntent * config.playerMoveSpeed * dt;
      state.player.x = clampPaddleX(config, state.player.x);
      state.player.z += depthIntent * config.playerDepthMoveSpeed * dt;
      state.player.z = clampPlayerZ(config, state.player.z);
      state.player.y = config.playerY;

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

      state.particles = state.particles
        .filter((particle) => particle.until > now)
        .map((particle) => ({
          ...particle,
          x: particle.x + particle.vx * dt,
          y: particle.y + particle.vy * dt,
          z: particle.z + particle.vz * dt,
          vy: particle.vy - config.gravity * 0.3 * dt,
        }));

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

      const playerDepthAligned = ball.vz < 0
        && previousZ >= state.player.z - config.paddleHitTolerance
        && ball.z <= state.player.z + config.paddleHitTolerance;

      if (playerDepthAligned) {
        const horizontalHit = Math.abs(ball.x - state.player.x) < (config.paddleRadius + config.paddleHitTolerance);
        const verticalHit = ball.y <= state.player.y + config.paddleVerticalTolerance;

        if (horizontalHit && verticalHit) {
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