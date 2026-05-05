import { gameConfig } from './data/gameConfig.js';
import { createGameEngine } from './logic/engine/gameEngine.js';
import { bindInputControls } from './logic/hooks/inputController.js';
import { createCanvasRenderer } from './view/components/canvasRenderer.js';
import { createGameScreen } from './view/screens/gameScreen.js';

const START_COPY = {
  title: 'NEON PONG 3D',
  subtitle: 'Move or swipe in two dimensions to position the paddle. Meet the ball in depth and send it past the opponent to score.',
  button: 'Start Game',
};

const GAMEOVER_COPY = {
  winTitle: 'YOU WIN!',
  loseTitle: 'YOU LOSE',
  subtitle: 'Press the button to restart the rally.',
  button: 'Play Again',
};

export function createApp(root) {
  const screen = createGameScreen(root);
  const engine = createGameEngine(gameConfig);
  const renderer = createCanvasRenderer(screen.canvas, gameConfig);

  const syncUi = () => {
    const state = engine.getState();

    screen.scorePlayer.textContent = String(state.scorePlayer);
    screen.scoreEnemy.textContent = String(state.scoreEnemy);
    screen.canvas.style.opacity = state.flashActive ? '0.5' : '1';

    if (state.status === 'playing') {
      screen.overlay.classList.add('hidden');
      return;
    }

    screen.overlay.classList.remove('hidden');

    if (state.status === 'gameover') {
      const playerWon = state.winner === 'player';
      screen.title.textContent = playerWon ? GAMEOVER_COPY.winTitle : GAMEOVER_COPY.loseTitle;
      screen.title.style.color = playerWon ? gameConfig.playerColor : gameConfig.enemyColor;
      screen.subtitle.textContent = GAMEOVER_COPY.subtitle;
      screen.button.textContent = GAMEOVER_COPY.button;
      return;
    }

    screen.title.textContent = START_COPY.title;
    screen.title.style.color = '#ffffff';
    screen.subtitle.textContent = START_COPY.subtitle;
    screen.button.textContent = START_COPY.button;
  };

  const updatePointer = (clientX, clientY) => {
    const rect = screen.canvas.getBoundingClientRect();
    const relativeX = clientX - rect.left;
    const relativeY = clientY - rect.top;
    const normalized = (relativeX / rect.width) * 2 - 1;
    const normalizedDepth = 1 - Math.min(Math.max(relativeY / rect.height, 0), 1);
    engine.setPointerTarget(normalized, normalizedDepth);
  };

  const cleanupInput = bindInputControls(window, {
    onPointerMove: updatePointer,
  });

  let lastTime = performance.now();

  const frame = (currentTime) => {
    const dt = Math.min((currentTime - lastTime) / 1000, 0.05);
    lastTime = currentTime;

    engine.update(dt, currentTime);
    syncUi();
    renderer.render(engine.getState());

    requestAnimationFrame(frame);
  };

  screen.button.addEventListener('click', () => {
    engine.startMatch();
    lastTime = performance.now();
    syncUi();
  });

  window.addEventListener('resize', () => {
    renderer.resize();
    renderer.render(engine.getState());
  });

  syncUi();
  renderer.resize();
  renderer.render(engine.getState());
  requestAnimationFrame(frame);

  return () => {
    cleanupInput();
  };
}