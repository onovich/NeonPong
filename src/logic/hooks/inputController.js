const KEY_BINDINGS = {
  ArrowLeft: 'left',
  ArrowRight: 'right',
  ArrowUp: 'forward',
  ArrowDown: 'backward',
  KeyW: 'raise',
  KeyS: 'lower',
};

export function bindInputControls(target, { onPointerMove, onControlChange }) {
  const handleTouchMove = (event) => {
    event.preventDefault();
    onPointerMove(event.touches[0].clientY);
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

  target.addEventListener('touchmove', handleTouchMove, { passive: false });
  target.addEventListener('keydown', handleKeyDown);
  target.addEventListener('keyup', handleKeyUp);

  return () => {
    target.removeEventListener('touchmove', handleTouchMove);
    target.removeEventListener('keydown', handleKeyDown);
    target.removeEventListener('keyup', handleKeyUp);
  };
}