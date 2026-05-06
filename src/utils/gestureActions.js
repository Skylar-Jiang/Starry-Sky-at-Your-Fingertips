export function createGestureActionDispatcher({ onPinch, onFold }) {
  return function dispatchGestureAction(gestureName) {
    if (gestureName === "pinch") {
      onPinch?.();
      return true;
    }

    if (gestureName === "fiveFingerClose") {
      onFold?.();
      return true;
    }

    return false;
  };
}
