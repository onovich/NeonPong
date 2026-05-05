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
    pointerTarget: 0,
    flashUntil: 0,
    player: {
      x: 0,
      w: config.paddleWidth,
    },
    enemy: {
      x: 0,
      w: config.paddleWidth,
      targetX: 0,
    },
    ball: createBallState(),
  };
}