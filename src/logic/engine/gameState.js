export function createBallState() {
  return {
    x: 0,
    y: 1,
    z: 0.5,
    vx: 0,
    vy: 0,
    vz: 0,
    trail: [],
    maxTrail: 15,
  };
}

export function createInitialState(config) {
  return {
    status: 'start',
    winner: null,
    scorePlayer: 0,
    scoreEnemy: 0,
    flashUntil: 0,
    flashKind: null,
    hitEffect: null,
    particles: [],
    message: null,
    shake: null,
    controls: {
      left: false,
      right: false,
      forward: false,
      backward: false,
    },
    player: {
      x: 0,
      z: config.playerMinZ,
      y: config.playerY,
      w: config.paddleWidth,
      hitUntil: 0,
    },
    enemy: {
      x: 0,
      z: config.enemyZ,
      y: config.enemyY,
      w: config.paddleWidth,
      targetX: 0,
      hitUntil: 0,
    },
    ball: createBallState(),
  };
}