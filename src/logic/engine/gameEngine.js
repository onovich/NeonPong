import { createInitialState } from './gameState.js';

function clampPaddleX(config, value) {
  const edge = 1 - config.paddleWidth / 2;
  return Math.max(-edge, Math.min(edge, value));
}

function clampPlayerZ(config, value) {
  return Math.max(config.playerMinZ, Math.min(config.playerMaxZ, value));
}

function clampBallSpeed(config, speed) {
  return Math.max(config.minBallSpeed, Math.min(config.maxBallSpeed, speed));
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

  const isOverTable = (x, z) => x >= -1 && x <= 1 && z >= 0 && z <= 1;

  const resetBall = (serveToPlayer) => {
    state.ball.x = 0;
    state.ball.y = config.serveStartY;
    state.ball.z = 0.5;
    state.ball.trail = [];
    state.ball.vz = config.baseSpeedZ * (serveToPlayer ? -1 : 1);
    state.ball.vy = config.serveDropVelocityY;
    state.ball.vx = (random() - 0.5) * config.serveSpreadX;
    state.lastHitBy = serveToPlayer ? 'enemy' : 'player';
    state.pendingScore = null;
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

  const explodeOutOfBounds = (now) => {
    const playerScored = state.lastHitBy === 'enemy';

    spawnParticles(state, config, random, {
      owner: playerScored ? 'player' : 'enemy',
      x: state.ball.x,
      y: Math.max(state.ball.y, 0.02),
      z: state.ball.z,
      now,
      count: config.explosionParticleCount,
      color: playerScored ? config.playerColor : config.enemyColor,
      spread: 2.2,
    });
    state.pendingScore = {
      playerScored,
      resolveAt: now + config.outOfBoundsExplosionHold,
    };
    state.ball.vx = 0;
    state.ball.vy = 0;
    state.ball.vz = 0;
    state.flashUntil = now + config.missFlashDuration;
    state.flashKind = playerScored ? 'positive' : 'negative';
    applyShake(state, config, 'miss', now);
  };

  const hitBall = (paddleX, paddleZ, paddleVx, paddleVz, now, isEnemy = false) => {
    const ball = state.ball;
    const owner = isEnemy ? 'enemy' : 'player';
    const paddleY = isEnemy ? state.enemy.y : state.player.y;
    const incomingSpeed = Math.hypot(ball.vx, ball.vz);
    const paddleSpeed = Math.hypot(paddleVx, paddleVz);
    const speedAdjustment = (paddleSpeed - config.paddleReferenceSpeed) * config.paddleSpeedInfluence;
    const outgoingSpeed = clampBallSpeed(config, incomingSpeed * config.speedMultiplier + speedAdjustment);
    const horizontalVelocity = (ball.x - paddleX) * 3.2 + paddleVx * config.paddleLateralInfluence;
    const horizontalClamped = Math.max(-outgoingSpeed * 0.72, Math.min(outgoingSpeed * 0.72, horizontalVelocity));
    const depthVelocity = Math.sqrt(Math.max(outgoingSpeed ** 2 - horizontalClamped ** 2, config.minBallSpeed ** 2 * 0.5));

    ball.vx = horizontalClamped;
    ball.vy = config.returnLiftVelocityY + random() * 0.18;
    state.hitEffect = {
      owner,
      x: ball.x,
      y: Math.max(ball.y, paddleY),
      z: paddleZ,
      until: now + config.hitFlashDuration,
    };
    state.lastHitBy = owner;
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
      ball.vz = -depthVelocity;
      return;
    }

    state.player.hitUntil = now + config.hitFlashDuration;
    setMessage(state, config, 'Clean Return!', 'positive', now);
    ball.z = paddleZ + 0.02;
    ball.vz = depthVelocity;
  };

  const handleOutOfBoundsLanding = (ball, now) => {
    if (isOverTable(ball.x, ball.z)) {
      return false;
    }

    explodeOutOfBounds(now);
    return true;
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
        ballVisible: !state.pendingScore,
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
      state.player.vx = 0;
      state.player.vz = 0;
      state.player.hitUntil = 0;
      state.enemy.x = fresh.enemy.x;
      state.enemy.z = fresh.enemy.z;
      state.enemy.y = fresh.enemy.y;
      state.enemy.vx = 0;
      state.enemy.vz = 0;
      state.enemy.targetX = fresh.enemy.targetX;
      state.enemy.hitUntil = 0;
      state.flashUntil = 0;
      state.flashKind = null;
      state.hitEffect = null;
      state.particles = [];
      state.message = null;
      state.shake = null;
      state.pendingScore = null;
      resetBall(true);
    },
    update(dt, now) {
      if (state.status !== 'playing') {
        return;
      }

      if (state.pendingScore) {
        state.particles = state.particles
          .filter((particle) => particle.until > now)
          .map((particle) => ({
            ...particle,
            x: particle.x + particle.vx * dt,
            y: particle.y + particle.vy * dt,
            z: particle.z + particle.vz * dt,
            vy: particle.vy - config.gravity * 0.3 * dt,
          }));

        if (now >= state.pendingScore.resolveAt) {
          const { playerScored } = state.pendingScore;
          score(playerScored, now);
        }

        return;
      }

      const horizontalIntent = (state.controls.right ? 1 : 0) - (state.controls.left ? 1 : 0);
      const depthIntent = (state.controls.forward ? 1 : 0) - (state.controls.backward ? 1 : 0);
      const previousPlayerX = state.player.x;
      const previousPlayerZ = state.player.z;
      const previousEnemyX = state.enemy.x;
      const previousEnemyZ = state.enemy.z;

      state.player.x += horizontalIntent * config.playerMoveSpeed * dt;
      state.player.x = clampPaddleX(config, state.player.x);
      state.player.z += depthIntent * config.playerDepthMoveSpeed * dt;
      state.player.z = clampPlayerZ(config, state.player.z);
      state.player.y = config.playerY;
      state.player.vx = (state.player.x - previousPlayerX) / Math.max(dt, 0.0001);
      state.player.vz = (state.player.z - previousPlayerZ) / Math.max(dt, 0.0001);

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
      state.enemy.vx = (state.enemy.x - previousEnemyX) / Math.max(dt, 0.0001);
      state.enemy.vz = (state.enemy.z - previousEnemyZ) / Math.max(dt, 0.0001);

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

      if (ball.y < 0 && isOverTable(ball.x, ball.z)) {
        ball.y = 0;
        if (ball.vy < 0) {
          ball.vy = -ball.vy * config.bounceDamping;
          if (ball.vy < config.minBounceVelocity) {
            ball.vy = config.minBounceVelocity;
          }
        }
      }

      const playerDepthAligned = ball.vz < 0
        && previousZ >= state.player.z - config.paddleHitTolerance
        && ball.z <= state.player.z + config.paddleHitTolerance;

      if (playerDepthAligned) {
        const horizontalHit = Math.abs(ball.x - state.player.x) <= (config.paddleWidth / 2 + config.paddleHitTolerance);
        const verticalHit = ball.y <= state.player.y + config.paddleVerticalTolerance;

        if (horizontalHit && verticalHit) {
          hitBall(state.player.x, state.player.z, state.player.vx, state.player.vz, now);
        }
      }

      if (ball.vz > 0 && previousZ <= state.enemy.z && ball.z >= state.enemy.z) {
        if (Math.abs(ball.x - state.enemy.x) <= config.paddleWidth / 2 + config.paddleHitTolerance) {
          hitBall(state.enemy.x, state.enemy.z, state.enemy.vx, state.enemy.vz, now, true);
        }
      }

      if (handleOutOfBoundsLanding(ball, now)) {
        return;
      }
    },
  };
}