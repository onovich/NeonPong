export function createGameScreen(root) {
  root.innerHTML = `
    <canvas class="game-canvas"></canvas>
    <div class="ui-layer">
      <div class="score-board">
        <div class="score-enemy">0</div>
        <div class="score-player">0</div>
      </div>
      <div class="overlay">
        <h1 class="overlay-title">NEON PONG 3D</h1>
        <p class="overlay-subtitle">Move your mouse or swipe to control the bottom paddle. Return the ball past the opponent to score.</p>
        <button class="overlay-button" type="button">Start Game</button>
      </div>
    </div>
  `;

  return {
    canvas: root.querySelector('.game-canvas'),
    overlay: root.querySelector('.overlay'),
    title: root.querySelector('.overlay-title'),
    subtitle: root.querySelector('.overlay-subtitle'),
    button: root.querySelector('.overlay-button'),
    scorePlayer: root.querySelector('.score-player'),
    scoreEnemy: root.querySelector('.score-enemy'),
  };
}