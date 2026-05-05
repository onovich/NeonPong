const KEY_BINDINGS = {
  ArrowLeft: 'left',
  KeyA: 'left',
  ArrowRight: 'right',
  KeyD: 'right',
  ArrowUp: 'forward',
  KeyW: 'forward',
  ArrowDown: 'backward',
  KeyS: 'backward',
  Space: 'jump',
};

function clearDirectionalControls(onControlChange) {
  onControlChange('left', false);
  onControlChange('right', false);
  onControlChange('forward', false);
  onControlChange('backward', false);
}

export function bindInputControls(target, {
  onControlChange,
  onMoveInput,
  onPointerTarget,
  onPointerRelease,
  onTriggerAirCatch,
  config,
}) {
  let touchStartX = 0;
  let touchStartY = 0;
  let touchMoved = false;
  let touchStartTime = 0;
  let touchActive = false;
  const tapDuration = 220;
  const tapMoveThreshold = 14;

  const emitTouchVector = (horizontal, depth) => {
    if (onMoveInput) {
      onMoveInput(horizontal, depth);
    }
  };

  const resetTouchInput = () => {
    emitTouchVector(0, 0);
    clearDirectionalControls(onControlChange);
    if (onPointerRelease) {
      onPointerRelease();
    }
  };

  const mapTouchToTable = (clientX, clientY) => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const bottomY = height * config.tableYBottom;
    const topY = height * config.tableYTop;
    const unclampedZ = (clientY - bottomY) / (topY - bottomY);
    const z = Math.max(config.playerMinZ, Math.min(config.playerMaxZ, unclampedZ));
    const bottomWidth = width * config.tableWidthBottom;
    const topWidth = width * config.tableWidthTop;
    const currentWidth = bottomWidth + (topWidth - bottomWidth) * z;
    const x = (clientX - width / 2) / (currentWidth / 2);

    return {
      x,
      z,
    };
  };

  const applyTouchPosition = (clientX, clientY) => {
    const tablePoint = mapTouchToTable(clientX, clientY);
    emitTouchVector(0, 0);
    clearDirectionalControls(onControlChange);
    if (onPointerTarget) {
      onPointerTarget(tablePoint.x, tablePoint.z);
    }
  };

  const handleTouchStart = (event) => {
    const touch = event.touches[0];
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
    touchStartTime = performance.now();
    touchMoved = false;
    touchActive = true;
    applyTouchPosition(touch.clientX, touch.clientY);
  };

  const handleTouchMove = (event) => {
    event.preventDefault();

    if (!touchActive) {
      return;
    }

    const touch = event.touches[0];
    const distance = Math.hypot(touch.clientX - touchStartX, touch.clientY - touchStartY);
    if (distance > tapMoveThreshold) {
      touchMoved = true;
    }
    applyTouchPosition(touch.clientX, touch.clientY);
  };

  const handleTouchEnd = () => {
    const isTap = !touchMoved && performance.now() - touchStartTime <= tapDuration;
    touchActive = false;
    resetTouchInput();
    if (isTap && onTriggerAirCatch) {
      onTriggerAirCatch();
    }
  };

  const updateControl = (event, pressed) => {
    const control = KEY_BINDINGS[event.code];
    if (!control) {
      return;
    }

    event.preventDefault();
    onControlChange(control, pressed);
  };

  const handleKeyDown = (event) => {
    updateControl(event, true);
  };

  const handleKeyUp = (event) => {
    updateControl(event, false);
  };

  target.addEventListener('touchstart', handleTouchStart, { passive: true });
  target.addEventListener('touchmove', handleTouchMove, { passive: false });
  target.addEventListener('touchend', handleTouchEnd);
  target.addEventListener('touchcancel', handleTouchEnd);
  target.addEventListener('keydown', handleKeyDown);
  target.addEventListener('keyup', handleKeyUp);

  return () => {
    target.removeEventListener('touchstart', handleTouchStart);
    target.removeEventListener('touchmove', handleTouchMove);
    target.removeEventListener('touchend', handleTouchEnd);
    target.removeEventListener('touchcancel', handleTouchEnd);
    target.removeEventListener('keydown', handleKeyDown);
    target.removeEventListener('keyup', handleKeyUp);
  };
}