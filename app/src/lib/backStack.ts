/**
 * Android back button handling for overlays. Sheets and dialogs push a handler
 * while open; the global back listener calls the newest one first.
 */
const stack: (() => void)[] = [];

export function pushBackHandler(fn: () => void): () => void {
  stack.push(fn);
  return () => {
    const i = stack.lastIndexOf(fn);
    if (i >= 0) stack.splice(i, 1);
  };
}

/** Returns true if an overlay consumed the back press. */
export function handleOverlayBack(): boolean {
  const fn = stack[stack.length - 1];
  if (!fn) return false;
  fn();
  return true;
}
