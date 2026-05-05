export function createGameScreen(root) {
  root.innerHTML = `
    <canvas class="game-canvas"></canvas>
    <div class="ui-layer">
      <div class="feedback-strip">
        <div class="feedback-message hidden"></div>
      </div>
      <div class="score-board">
        <div class="score-enemy">0</div>
        <div class="score-player">0</div>
      </div>
      <div class="flash-layer hidden"></div>
      <div class="overlay">
        <h1 class="overlay-title">NEON PONG 3D</h1>
        <p class="overlay-subtitle">Use WASD or arrow keys for left, right, and depth. On mobile, drag to steer the paddle directly.</p>
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
    message: root.querySelector('.feedback-message'),
    flash: root.querySelector('.flash-layer'),
    scorePlayer: root.querySelector('.score-player'),
    scoreEnemy: root.querySelector('.score-enemy'),
  };
}