(() => {
  for (const map of document.querySelectorAll('[data-shot-map]')) {
    const columns = map.querySelector('.shot-map__columns');
    const buttons = [...columns.querySelectorAll('[data-shot]')];
    const details = [...map.querySelectorAll('[data-shot-detail]')];
    let selected = buttons.find(button => button.getAttribute('aria-pressed') === 'true');

    function show(button) {
      for (const item of buttons) item.toggleAttribute('data-active', item === button);
      for (const detail of details) detail.hidden = detail.dataset.shotDetail !== button.dataset.shot;
    }

    for (const button of buttons) {
      button.addEventListener('pointerenter', event => {
        if (event.pointerType === 'mouse') show(button);
      });
      button.addEventListener('pointerleave', event => {
        if (event.pointerType === 'mouse') show(selected);
      });
      button.addEventListener('focus', () => show(button));
      button.addEventListener('blur', () => show(selected));
      button.addEventListener('click', () => {
        selected = button;
        for (const item of buttons) item.setAttribute('aria-pressed', String(item === selected));
        show(selected);
      });
    }

    function placeBadges() {
      const badges = [...columns.querySelectorAll('.shot-map__badge')];
      for (const badge of badges) {
        badge.style.removeProperty('--badge-offset-x');
        badge.style.removeProperty('--badge-offset-y');
      }

      const bounds = columns.getBoundingClientRect();
      const placed = [];
      for (const badge of badges) {
        if (!badge.getClientRects().length) continue;
        const rect = badge.getBoundingClientRect();
        const plot = badge.parentElement.getBoundingClientRect();
        const offsetX = Math.max(bounds.left - rect.left, Math.min(0, bounds.right - rect.right));
        const left = rect.left + offsetX;
        const right = rect.right + offsetX;
        const neighbours = placed.filter(other => left < other.right && right > other.left);
        const candidates = [0];
        for (const other of neighbours) candidates.push(other.top - rect.bottom - 5, other.bottom - rect.top + 5);
        const shift = candidates.sort((a, b) => Math.abs(a) - Math.abs(b)).find(offset =>
          rect.top + offset >= plot.top && rect.bottom + offset <= plot.bottom &&
          neighbours.every(other => rect.bottom + offset <= other.top - 5 || rect.top + offset >= other.bottom + 5)
        ) ?? 0;
        badge.style.setProperty('--badge-offset-x', `${offsetX}px`);
        badge.style.setProperty('--badge-offset-y', `${shift}px`);
        placed.push({ left, right, top: rect.top + shift, bottom: rect.bottom + shift });
      }
    }

    new ResizeObserver(placeBadges).observe(columns);
  }
})();
