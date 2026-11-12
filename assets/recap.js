(() => {
  for (const component of document.querySelectorAll('[data-half-dominance]')) {
    const board = component.querySelector('.half-board');
    const readout = component.querySelector('.half-pace');
    const cards = [...board.querySelectorAll('[data-half]')];
    const panels = [...component.querySelectorAll('[data-pace]')];
    let hovered = null;
    let selected = null;

    function update() {
      const active = hovered ?? selected;
      board.toggleAttribute('data-active', active !== null);
      readout.toggleAttribute('data-active', active !== null);
      for (const card of cards) {
        card.toggleAttribute('data-active', card === active);
        card.setAttribute('aria-pressed', String(card === selected));
      }
      for (const panel of panels) {
        panel.setAttribute('aria-hidden', String(panel.dataset.pace !== (active?.dataset.half ?? 'summary')));
      }
    }

    for (const card of cards) {
      card.addEventListener('pointerenter', event => {
        if (event.pointerType !== 'mouse') return;
        hovered = card;
        update();
      });
      card.addEventListener('pointerleave', event => {
        if (event.pointerType !== 'mouse') return;
        hovered = null;
        update();
      });
      card.addEventListener('click', () => {
        hovered = null;
        selected = selected === card ? null : card;
        update();
      });
    }
  }
})();
