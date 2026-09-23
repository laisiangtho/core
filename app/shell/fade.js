/**
 * Scroll fades: a scrollable area that has more above or below says so, by
 * fading its own edge rather than by drawing a line.
 *
 * The stylesheet does the fading from two variables; this sets them. A pane is
 * hidden until its tab is chosen, so it measures zero at wiring time and
 * nothing inside it has changed when it appears — hence the observers rather
 * than a single measurement.
 */

const WIRED = new WeakSet();

export function wireFade(node) {
  if (!node || WIRED.has(node)) return;
  WIRED.add(node);

  node.classList.add('fade-scroll');
  let queued = false;
  const update = () => {
    queued = false;
    if (!node.isConnected) return;
    const max = node.scrollHeight - node.clientHeight;
    const live = max > 2;
    node.style.setProperty('--fade-top', live && node.scrollTop > 2 ? '20px' : '0px');
    node.style.setProperty('--fade-bottom', live && node.scrollTop < max - 2 ? '26px' : '0px');
  };
  const schedule = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(update);
  };

  node.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule);
  try { new ResizeObserver(schedule).observe(node); } catch { /* older engine: scroll and resize still fire */ }
  // Panes repaint their contents without scrolling, so watch the subtree too.
  try { new MutationObserver(schedule).observe(node, { childList: true, subtree: true, characterData: true }); } catch { /* as above */ }
  schedule();
}

/** Wire every scrollable area inside a root that is not wired yet. */
export function wireFades(root) {
  for (const node of root.querySelectorAll('.pane-body, .leaf-scroll, .np-grid, .modal-list')) wireFade(node);
}
