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

export function bindInputControls(target, { onPointerMove, onControlChange }) {
  const handleMouseMove = (event) => {
    onPointerMove(event.clientY);
  };

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

  target.addEventListener('mousemove', handleMouseMove);
  target.addEventListener('touchmove', handleTouchMove, { passive: false });
  target.addEventListener('keydown', handleKeyDown);
  target.addEventListener('keyup', handleKeyUp);

  return () => {
    target.removeEventListener('mousemove', handleMouseMove);
    target.removeEventListener('touchmove', handleTouchMove);
    target.removeEventListener('keydown', handleKeyDown);
    target.removeEventListener('keyup', handleKeyUp);
  };
}