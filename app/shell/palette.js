/**
 * Command palette (Ctrl/Cmd+P) and command hotkeys. Lists every registered
 * command, so a feature absent from a target leaves no entry behind.
 */

import { h } from './dom.js';

export function createPalette(registry) {
  const input = h('input', { class: 'palette-input', type: 'search', placeholder: 'Type a command…', 'aria-label': 'Command' });
  const list = h('ul', { class: 'palette-list', role: 'listbox' });
  const element = h('div', { class: 'palette', hidden: true, onclick: (e) => { if (e.target === element) close(); } },
    h('div', { class: 'palette-box' }, input, list));

  let matches = [];
  let selected = 0;

  function render() {
    const q = input.value.trim().toLowerCase();
    matches = registry.commands().filter((c) => c.title.toLowerCase().includes(q));
    selected = Math.min(selected, Math.max(matches.length - 1, 0));
    list.replaceChildren(...matches.map((c, i) => h('li', {
      class: i === selected ? 'selected' : '', role: 'option', onclick: () => run(c),
    }, c.title, c.keys ? h('kbd', {}, c.keys) : null)));
  }

  async function run(command) {
    close();
    await command.run();
  }

  function open() {
    element.hidden = false;
    input.value = '';
    selected = 0;
    render();
    input.focus();
  }

  function close() {
    element.hidden = true;
  }

  input.addEventListener('input', () => { selected = 0; render(); });
  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') { selected = Math.min(selected + 1, matches.length - 1); render(); e.preventDefault(); }
    else if (e.key === 'ArrowUp') { selected = Math.max(selected - 1, 0); render(); e.preventDefault(); }
    else if (e.key === 'Enter' && matches[selected]) run(matches[selected]);
    else if (e.key === 'Escape') close();
  });

  function bindKeys() {
    window.addEventListener('keydown', (e) => {
      const mod = e.ctrlKey || e.metaKey;
      if (mod && e.key.toLowerCase() === 'p') { e.preventDefault(); open(); return; }
      if (!element.hidden || isTyping(e.target)) return;
      const combo = `${mod ? 'Mod+' : ''}${e.key}`;
      const command = registry.commands().find((c) => c.keys === combo);
      if (command) { e.preventDefault(); command.run(); }
    });
  }

  return { element, open, close, bindKeys };
}

function isTyping(target) {
  return target instanceof HTMLElement && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName));
}
