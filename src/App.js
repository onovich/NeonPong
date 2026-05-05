import { gameConfig } from './data/gameConfig.js';
import { createGameEngine } from './logic/engine/gameEngine.js';
import { bindInputControls } from './logic/hooks/inputController.js';
import { createCanvasRenderer } from './view/components/canvasRenderer.js';
import { createGameScreen } from './view/screens/gameScreen.js';

const START_COPY = {
  title: 'NEON PONG 3D',
  subtitle: 'Use WASD or the arrow keys for movement. Tap Space to flash up an air-catch membrane. On mobile, drag to steer the paddle directly.',
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

  root.tabIndex = 0;

  const syncUi = () => {
    const state = engine.getState();

    screen.scorePlayer.textContent = String(state.scorePlayer);
    screen.scoreEnemy.textContent = String(state.scoreEnemy);
    screen.flash.classList.toggle('hidden', !state.flashActive);
    screen.flash.className = `flash-layer${state.flashActive ? ` ${state.flashKind ?? 'positive'}` : ' hidden'}`;

    if (state.message) {
      screen.message.textContent = state.message.text;
      screen.message.className = `feedback-message ${state.message.tone}`;
    } else {
      screen.message.textContent = '';
      screen.message.className = 'feedback-message hidden';
    }

    if (state.shake) {
      const offsetX = (Math.random() - 0.5) * state.shake.amount;
      const offsetY = (Math.random() - 0.5) * state.shake.amount;
      root.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
    } else {
      root.style.transform = 'translate(0, 0)';
    }

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

  const cleanupInput = bindInputControls(window, {
    onControlChange: (control, pressed) => {
      engine.setControlState(control, pressed);
    },
    onMoveInput: (horizontal, depth) => {
      engine.setMoveInput(horizontal, depth);
    },
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
    root.focus();
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