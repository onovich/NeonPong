const KEY_BINDINGS = {
  ArrowLeft: 'left',
  KeyA: 'left',
  ArrowRight: 'right',
  KeyD: 'right',
  ArrowUp: 'forward',
  KeyW: 'forward',
  ArrowDown: 'backward',
  KeyS: 'backward',
};

function clearDirectionalControls(onControlChange) {
  onControlChange('left', false);
  onControlChange('right', false);
  onControlChange('forward', false);
  onControlChange('backward', false);
}

export function bindInputControls(target, { onControlChange }) {
  let touchStartX = 0;
  let touchStartY = 0;
  let touchActive = false;
  const touchThreshold = 18;

  const applyTouchDirection = (deltaX, deltaY) => {
    const horizontal = Math.abs(deltaX) > touchThreshold ? (deltaX > 0 ? 'right' : 'left') : null;
    const vertical = Math.abs(deltaY) > touchThreshold ? (deltaY > 0 ? 'backward' : 'forward') : null;

    clearDirectionalControls(onControlChange);

    if (horizontal) {
      onControlChange(horizontal, true);
    }

    if (vertical) {
      onControlChange(vertical, true);
    }
  };

  const handleTouchStart = (event) => {
    const touch = event.touches[0];
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
    touchActive = true;
    clearDirectionalControls(onControlChange);
  };

  const handleTouchMove = (event) => {
    event.preventDefault();

    if (!touchActive) {
      return;
    }

    const touch = event.touches[0];
    applyTouchDirection(touch.clientX - touchStartX, touch.clientY - touchStartY);
  };

  const handleTouchEnd = () => {
    touchActive = false;
    clearDirectionalControls(onControlChange);
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