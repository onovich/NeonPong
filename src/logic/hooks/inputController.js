export function bindInputControls(target, { onPointerMove }) {
  const handleMouseMove = (event) => {
    onPointerMove(event.clientX, event.clientY);
  };

  const handleTouchMove = (event) => {
    event.preventDefault();
    onPointerMove(event.touches[0].clientX, event.touches[0].clientY);
  };

  target.addEventListener('mousemove', handleMouseMove);
  target.addEventListener('touchmove', handleTouchMove, { passive: false });

  return () => {
    target.removeEventListener('mousemove', handleMouseMove);
    target.removeEventListener('touchmove', handleTouchMove);
  };
}