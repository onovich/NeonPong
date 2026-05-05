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
  getPlayerAnchor,
  config,
}) {
  let primaryTouchId = null;
  let primaryTouchStartX = 0;
  let primaryTouchStartY = 0;
  let primaryTouchMoved = false;
  let primaryTouchStartTime = 0;
  let primaryAnchorX = 0;
  let primaryAnchorZ = config.playerMinZ;
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

  const getTouchById = (touchList, touchId) => {
    for (let index = 0; index < touchList.length; index += 1) {
      if (touchList[index].identifier === touchId) {
        return touchList[index];
      }
    }

    return null;
  };

  const updatePointerFromOffset = (clientX, clientY) => {
    const tableHalfWidth = (window.innerWidth * config.tableWidthBottom) / 2;
    const tableDepthPixels = window.innerHeight * (config.tableYBottom - config.tableYTop);
    const deltaX = clientX - primaryTouchStartX;
    const deltaY = clientY - primaryTouchStartY;
    const worldX = primaryAnchorX + (deltaX / Math.max(tableHalfWidth, 1)) * config.mobileDragHorizontalScale;
    const worldZ = primaryAnchorZ + (deltaY / Math.max(tableDepthPixels, 1))
      * (config.playerMaxZ - config.playerMinZ)
      * config.mobileDragDepthScale;

    emitTouchVector(0, 0);
    clearDirectionalControls(onControlChange);
    if (onPointerTarget) {
      onPointerTarget(worldX, worldZ);
    }
  };

  const beginPrimaryTouch = (touch) => {
    const anchor = getPlayerAnchor ? getPlayerAnchor() : { x: 0, z: config.playerMinZ };
    primaryTouchId = touch.identifier;
    primaryTouchStartX = touch.clientX;
    primaryTouchStartY = touch.clientY;
    primaryTouchStartTime = performance.now();
    primaryTouchMoved = false;
    primaryAnchorX = anchor.x;
    primaryAnchorZ = anchor.z;
    updatePointerFromOffset(touch.clientX, touch.clientY);
  };

  const handleTouchStart = (event) => {
    for (let index = 0; index < event.changedTouches.length; index += 1) {
      const touch = event.changedTouches[index];
      if (primaryTouchId === null) {
        beginPrimaryTouch(touch);
        continue;
      }

      if (onTriggerAirCatch) {
        onTriggerAirCatch();
      }
    }
  };

  const handleTouchMove = (event) => {
    event.preventDefault();

    if (primaryTouchId === null) {
      return;
    }

    const touch = getTouchById(event.touches, primaryTouchId);
    if (!touch) {
      return;
    }

    const distance = Math.hypot(touch.clientX - primaryTouchStartX, touch.clientY - primaryTouchStartY);
    if (distance > tapMoveThreshold) {
      primaryTouchMoved = true;
    }
    updatePointerFromOffset(touch.clientX, touch.clientY);
  };

  const handleTouchEnd = (event) => {
    if (primaryTouchId === null) {
      return;
    }

    const primaryEnded = getTouchById(event.changedTouches, primaryTouchId);
    if (!primaryEnded) {
      return;
    }

    const isTap = !primaryTouchMoved && performance.now() - primaryTouchStartTime <= tapDuration;
    if (isTap && onTriggerAirCatch) {
      onTriggerAirCatch();
    }

    if (event.touches.length > 0) {
      beginPrimaryTouch(event.touches[0]);
      return;
    }

    primaryTouchId = null;
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