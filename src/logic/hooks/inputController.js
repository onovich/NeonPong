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

export function bindInputControls(target, { onControlChange, onMoveInput }) {
  let touchAnchorX = 0;
  let touchAnchorY = 0;
  let touchActive = false;
  const touchDeadZone = 12;
  const touchRadius = 70;

  const emitTouchVector = (horizontal, depth) => {
    if (onMoveInput) {
      onMoveInput(horizontal, depth);
    }
  };

  const resetTouchInput = () => {
    emitTouchVector(0, 0);
    clearDirectionalControls(onControlChange);
  };

  const applyTouchDirection = (deltaX, deltaY) => {
    const rawHorizontal = Math.abs(deltaX) > touchDeadZone ? deltaX / touchRadius : 0;
    const rawDepth = Math.abs(deltaY) > touchDeadZone ? deltaY / touchRadius : 0;
    const horizontal = Math.max(-1, Math.min(1, rawHorizontal));
    const depth = Math.max(-1, Math.min(1, rawDepth));

    emitTouchVector(horizontal, depth);

    clearDirectionalControls(onControlChange);

    if (horizontal < -0.2) {
      onControlChange('left', true);
    } else if (horizontal > 0.2) {
      onControlChange('right', true);
    }

    if (depth < -0.2) {
      onControlChange('forward', true);
    } else if (depth > 0.2) {
      onControlChange('backward', true);
    }
  };

  const handleTouchStart = (event) => {
    const touch = event.touches[0];
    touchAnchorX = touch.clientX;
    touchAnchorY = touch.clientY;
    touchActive = true;
    resetTouchInput();
  };

  const handleTouchMove = (event) => {
    event.preventDefault();

    if (!touchActive) {
      return;
    }

    const touch = event.touches[0];
    applyTouchDirection(touch.clientX - touchAnchorX, touch.clientY - touchAnchorY);
  };

  const handleTouchEnd = () => {
    touchActive = false;
    resetTouchInput();
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