export function createGestureEventBus() {
  const listeners = new Set();

  return {
    emit(event) {
      listeners.forEach((listener) => listener(event));
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    clear() {
      listeners.clear();
    }
  };
}
