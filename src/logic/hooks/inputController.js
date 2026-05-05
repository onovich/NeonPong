export function bindInputControls(target, { onPointerMove }) {
  const handleMouseMove = (event) => {
    onPointerMove(event.clientX);
  };

  const handleTouchMove = (event) => {
    event.preventDefault();
    onPointerMove(event.touches[0].clientX);
  };

  target.addEventListener('mousemove', handleMouseMove);
  target.addEventListener('touchmove', handleTouchMove, { passive: false });

  return () => {
    target.removeEventListener('mousemove', handleMouseMove);
    target.removeEventListener('touchmove', handleTouchMove);
  };
}