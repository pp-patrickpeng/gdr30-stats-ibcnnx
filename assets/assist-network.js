(() => {
  function svgElement(tag, attributes, label) {
    const element = document.createElementNS('http://www.w3.org/2000/svg', tag);
    for (const [name, value] of Object.entries(attributes)) element.setAttribute(name, value);
    if (label !== undefined) element.textContent = label;
    return element;
  }

  for (const network of document.querySelectorAll('[data-assist-network]')) {
    const controls = network.querySelector('[data-assist-controls]');
    const allLines = network.querySelector('[data-assist-lines]');
    const reciprocal = network.querySelector('[data-assist-reciprocal]');
    const clear = network.querySelector('[data-assist-clear]');
    const players = [...network.querySelectorAll('[data-assist-player]')];
    const graph = network.querySelector('.assist-network__graph');
    const edges = [...network.querySelectorAll('[data-edge]')];
    const rankedEdges = [...edges].sort((a, b) => Number(a.dataset.edge) - Number(b.dataset.edge));
    const badges = [...network.querySelectorAll('[data-assist-badge]')];
    const edgesById = new Map(edges.map(edge => [edge.dataset.edge, edge]));
    const pairs = [...network.querySelectorAll('[data-pair]')];
    const empty = network.querySelector('[data-assist-empty]');
    const focus = network.querySelector('[data-assist-focus]');
    const mobile = network.querySelector('[data-assist-mobile]');
    const mobileGraph = mobile.querySelector('[data-mobile-graph]');
    const mobileRoutes = mobile.querySelector('[data-mobile-routes]');
    const mobileEmpty = mobile.querySelector('[data-mobile-empty]');
    const roster = new Map(players.map(node => [
      node.dataset.assistPlayer,
      {name: node.querySelector('strong').textContent, jersey: node.querySelector('small').textContent}
    ]));
    const connections = new Map(players.map(node => [node.dataset.assistPlayer, 0]));
    for (const {dataset: {from, to}} of edges) {
      connections.set(from, connections.get(from) + 1);
      connections.set(to, connections.get(to) + 1);
    }
    const preferred = [...roster].find(([, {jersey}]) => jersey === '#74')?.[0] ?? null;
    const suggested = preferred ?? [...connections.keys()].reduce((best, name) =>
      connections.get(name) > connections.get(best) ? name : best);
    let mode = 'focus';
    let player = preferred;
    let pair = null;
    let hovered = null;
    let previewPair = null;

    function belongs(element, name) {
      return name === element.dataset.from || name === element.dataset.to;
    }

    function mobileNode(name, x, y, focused = false) {
      const {name: display, jersey} = roster.get(name);
      const group = svgElement('g', {class: 'assist-network__mobile-node', transform: `translate(${x} ${y})`});
      if (focused) group.setAttribute('data-focused', '');
      else group.dataset.mobileTeammate = name;
      group.append(
        svgElement('rect', {x: -36, y: -21, width: 72, height: 42, rx: 9}),
        svgElement('text', {y: -4, class: 'assist-network__mobile-jersey'}, jersey),
        svgElement('text', {y: 13}, display)
      );
      return group;
    }

    function renderMobile() {
      const name = player ?? suggested;
      const teammates = new Map();
      for (const edge of rankedEdges) {
        if (!belongs(edge, name) || (mode === 'reciprocal' && !edge.hasAttribute('data-reciprocal'))) continue;
        const direction = edge.dataset.from === name ? 'out' : 'in';
        const other = direction === 'out' ? edge.dataset.to : edge.dataset.from;
        if (!teammates.has(other)) teammates.set(other, []);
        teammates.get(other).push({direction, edge});
      }
      mobileGraph.toggleAttribute('hidden', !teammates.size);
      mobileEmpty.hidden = teammates.size > 0;
      const height = Math.max(94, 24 + teammates.size * 59);
      const middle = height / 2;
      const elements = [];
      const nodes = [mobileNode(name, 43, middle, true)];
      let index = 0;
      for (const [other, routes] of teammates) {
        const y = teammates.size === 1 ? middle : 42 + index * 59;
        nodes.push(mobileNode(other, 257, y));
        for (const {direction, edge} of routes) {
          const incoming = direction === 'in';
          const sign = incoming ? 1 : -1;
          const lane = y + (routes.length === 2 ? 11 * sign : 0);
          const origin = middle + (index - (teammates.size - 1) / 2) * 5 + (routes.length === 2 ? 2 * sign : 0);
          const path = incoming
            ? `M221 ${lane} H136 C109 ${lane} 111 ${origin} 79 ${origin}`
            : `M79 ${origin} C111 ${origin} 109 ${lane} 136 ${lane} H221`;
          // Keep arrowheads beside the teammate while the stream follows the full route.
          const arrow = incoming ? `M220 ${lane} H211` : `M210 ${lane} H219`;
          const line = svgElement('g', {'data-mobile-pair': edge.dataset.edge, 'data-direction': direction});
          line.toggleAttribute('data-selected', pair === edge.dataset.edge);
          line.append(
            svgElement('path', {d: path, class: 'assist-network__mobile-path'}),
            svgElement('path', {d: path, class: 'assist-network__mobile-stream'}),
            svgElement('path', {d: arrow, class: 'assist-network__mobile-arrow', 'marker-end': `url(#${mobileGraph.dataset.marker}-${direction})`}),
            svgElement('path', {d: path, class: 'assist-network__mobile-hit'}),
            svgElement('rect', {x: 140, y: lane - 9, width: 65, height: 18, rx: 9}),
            svgElement('text', {x: 172.5, y: lane + 4}, edge.dataset.routeLabel)
          );
          elements.push(line);
        }
        index++;
      }
      mobileGraph.setAttribute('viewBox', `0 0 300 ${height}`);
      mobileRoutes.replaceChildren(...elements, ...nodes);
    }

    function placeBadges() {
      const {left, top, width, height} = graph.getBoundingClientRect();
      if (!width || !height) return;
      const view = graph.viewBox.baseVal;
      const used = players.map(node => {
        const rect = node.getBoundingClientRect();
        return {
          x: (rect.left - left) * view.width / width,
          y: (rect.top - top) * view.height / height,
          right: (rect.right - left) * view.width / width,
          bottom: (rect.bottom - top) * view.height / height
        };
      });
      for (const badge of badges) {
        const edge = edgesById.get(badge.dataset.assistBadge);
        const direction = edge.dataset.direction;
        badge.setAttribute('hidden', '');
        if (!direction || edge.hasAttribute('hidden')) continue;
        const line = edge.querySelector('.assist-network__line');
        const length = line.getTotalLength();
        const anchors = [.45, .57, .33, .69, .21, .81, .12, .9].map(fraction => {
          const at = fraction * length;
          const point = line.getPointAtLength(at);
          const next = line.getPointAtLength(at + 1);
          const distance = Math.hypot(next.x - point.x, next.y - point.y) || 1;
          return {point, dx: (point.y - next.y) / distance, dy: (next.x - point.x) / distance};
        });
        search:
        for (const offset of [0, 18, -18, 35, -35, 55, -55]) {
          for (const {point, dx, dy} of anchors) {
            const x = point.x + dx * offset;
            const y = point.y + dy * offset;
            const rect = {x: x - 51, y: y - 17, right: x + 51, bottom: y + 17};
            if (rect.x < 3 || rect.y < 3 || rect.right > view.width - 3 || rect.bottom > view.height - 3 ||
              used.some(box => rect.x < box.right && rect.right > box.x && rect.y < box.bottom && rect.bottom > box.y)) continue;
            badge.setAttribute('transform', `translate(${x} ${y})`);
            const leader = badge.querySelector('line');
            leader.setAttribute('x1', point.x - x);
            leader.setAttribute('y1', point.y - y);
            badge.dataset.direction = direction;
            badge.removeAttribute('hidden');
            used.push(rect);
            break search;
          }
        }
      }
    }

    function draw() {
      const focusedPlayer = player ?? hovered;
      const focusedPair = previewPair ?? pair;
      const related = new Set(focusedPlayer ? [focusedPlayer] : []);
      for (const edge of edges) {
        const exact = edge.dataset.edge === focusedPair;
        const outgoing = focusedPlayer === edge.dataset.from;
        const incoming = focusedPlayer === edge.dataset.to;
        const relevant = focusedPair !== null ? exact : outgoing || incoming;
        edge.toggleAttribute('hidden', (mode === 'reciprocal' && !edge.hasAttribute('data-reciprocal')) ||
          (mode === 'focus' && !relevant));
        edge.toggleAttribute('data-muted', (focusedPair !== null || focusedPlayer !== null) && !relevant);
        edge.dataset.direction = relevant ? (incoming && !exact ? 'in' : 'out') : '';
        const marker = `url(#${graph.dataset.marker}-${edge.dataset.direction || 'all'})`;
        edge.querySelector('.assist-network__line').setAttribute('marker-end', marker);
        if (relevant && !edge.hasAttribute('hidden')) {
          related.add(edge.dataset.from);
          related.add(edge.dataset.to);
        }
      }
      for (const node of players) {
        const card = node.closest('[data-assist-card]');
        const active = related.has(node.dataset.assistPlayer);
        card.toggleAttribute('data-selected', node.dataset.assistPlayer === player);
        card.toggleAttribute('data-related', active);
        card.toggleAttribute('data-muted', related.size > 0 && !active);
      }
      placeBadges();
    }

    function update() {
      allLines.setAttribute('aria-pressed', String(mode === 'all'));
      reciprocal.setAttribute('aria-pressed', String(mode === 'reciprocal'));
      clear.hidden = player === null && pair === null;
      focus.value = player ?? '';
      let shown = 0;
      for (const row of pairs) {
        row.hidden = (mode === 'reciprocal' && !row.hasAttribute('data-reciprocal')) ||
          (player !== null && !belongs(row, player));
        row.open = !row.hidden && row.dataset.pair === pair;
        if (!row.hidden) shown++;
      }
      if (empty) empty.hidden = shown !== 0;
      draw();
      renderMobile();
    }

    function togglePair(id) {
      pair = pair === id ? null : id;
      update();
    }

    function revealPair(id) {
      const row = pairs.find(item => item.dataset.pair === id);
      if (row?.hidden) player = null;
      togglePair(id);
      if (row?.open) {
        row.querySelector('summary').focus({preventScroll: true});
        row.scrollIntoView({block: 'nearest'});
      }
    }

    allLines.addEventListener('click', () => {
      mode = mode === 'all' ? 'focus' : 'all';
      update();
    });
    reciprocal.addEventListener('click', () => {
      mode = mode === 'reciprocal' ? 'focus' : 'reciprocal';
      if (mode === 'reciprocal' && !edgesById.get(pair)?.hasAttribute('data-reciprocal')) pair = null;
      update();
    });
    clear.addEventListener('click', () => {
      player = pair = hovered = previewPair = null;
      update();
      focus.focus();
    });
    focus.addEventListener('change', () => {
      player = focus.value || null;
      pair = null;
      update();
    });
    mobileGraph.addEventListener('click', event => {
      const teammate = event.target.closest('[data-mobile-teammate]');
      const route = event.target.closest('[data-mobile-pair]');
      if (teammate) {
        player = teammate.dataset.mobileTeammate;
        pair = null;
        update();
      } else if (route) {
        revealPair(route.dataset.mobilePair);
      }
    });
    for (const node of players) {
      const name = node.dataset.assistPlayer;
      const card = node.closest('[data-assist-card]');
      card.addEventListener('pointerenter', event => {
        if (event.pointerType !== 'mouse') return;
        hovered = name;
        draw();
      });
      card.addEventListener('pointerleave', () => {
        hovered = null;
        draw();
      });
      node.addEventListener('focus', () => {
        hovered = name;
        draw();
      });
      node.addEventListener('blur', () => {
        hovered = null;
        draw();
      });
    }
    for (const row of pairs) {
      row.querySelector('summary').addEventListener('click', event => {
        event.preventDefault();
        togglePair(row.dataset.pair);
      });
    }
    graph.addEventListener('click', event => {
      const target = event.target.closest('[data-edge], [data-assist-badge]');
      if (!target) return;
      revealPair(target.dataset.edge ?? target.dataset.assistBadge);
    });
    for (const row of pairs) {
      row.addEventListener('pointerenter', event => {
        if (event.pointerType !== 'mouse') return;
        previewPair = row.dataset.pair;
        draw();
      });
      row.addEventListener('pointerleave', () => {
        previewPair = null;
        draw();
      });
    }
    controls.hidden = false;
    focus.closest('label').hidden = false;
    mobile.hidden = false;
    update();
    new ResizeObserver(placeBadges).observe(graph);
  }
})();
