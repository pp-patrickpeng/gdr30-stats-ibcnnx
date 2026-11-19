(() => {
  const select = document.querySelector('[data-insight-sort]');
  const grid = document.querySelector('#pcards');
  if (!select || !grid) return;

  function sortPlayers() {
    const metric = `insight${select.value[0].toUpperCase()}${select.value.slice(1)}`;
    const cards = [...grid.children];
    cards.sort((a, b) => Number(b.dataset[metric]) - Number(a.dataset[metric])
      || Number(a.dataset.num) - Number(b.dataset.num));
    grid.append(...cards);
  }

  select.addEventListener('change', sortPlayers);
  sortPlayers();
})();
