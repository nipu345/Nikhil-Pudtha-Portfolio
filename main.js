/* =========================================================
   Nikhil Pudtha — Portfolio interactions
   ========================================================= */

/* ---------- Hero skill graph ----------
   Skill nodes sit on a ring around the profile photo (the hub).
   Data packets flow along the edges into the hub; nodes drift
   gently and lean toward the cursor. Hovering a node lights up
   its connections. */
(() => {
  const graph = document.querySelector('.graph');
  if (!graph) return;

  const NS = 'http://www.w3.org/2000/svg';
  const svg = graph.querySelector('svg');
  const hub = graph.querySelector('.graph-hub');
  const ring = graph.querySelector('.graph-hub-ring');
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // [id, label, color slot 1-4]. Order matters: neighbors on the ring get wired together.
  const skills = [
    ['python', 'Python', 1],
    ['ml', 'scikit-learn', 3],
    ['rag', 'RAG / LLMs', 2],
    ['fastapi', 'FastAPI', 4],
    ['postgres', 'PostgreSQL', 1],
    ['supabase', 'Supabase', 3],
    ['react', 'React', 2],
    ['node', 'Node.js', 4],
  ];

  const HUB = { x: 50, y: 50 };
  const nodes = skills.map(([id, label, tag], i) => {
    const angle = (i / skills.length) * Math.PI * 2 - Math.PI / 2 + Math.PI / skills.length;
    const el = document.createElement('span');
    el.className = 'graph-node';
    el.dataset.tag = tag;
    el.textContent = label;
    graph.appendChild(el);
    const bx = 50 + Math.cos(angle) * 37;
    const by = 50 + Math.sin(angle) * 39;
    return { id, el, bx, by, x: bx, y: by, phase: i * 1.7, edges: [] };
  });

  // Spokes (skill -> hub) plus a ring connecting neighbors.
  const edges = [];
  const addEdge = (a, b) => {
    const line = document.createElementNS(NS, 'line');
    line.setAttribute('class', 'graph-edge');
    svg.appendChild(line);
    const edge = { a, b, line };
    edges.push(edge);
    a.edges.push(edge);
    if (b !== HUB) b.edges.push(edge);
  };
  nodes.forEach((n, i) => addEdge(n, nodes[(i + 1) % nodes.length]));
  nodes.forEach(n => addEdge(n, HUB));

  const placeAll = () => {
    nodes.forEach(n => {
      n.el.style.left = n.x + '%';
      n.el.style.top = n.y + '%';
    });
    edges.forEach(({ a, b, line }) => {
      line.setAttribute('x1', a.x); line.setAttribute('y1', a.y);
      line.setAttribute('x2', b.x); line.setAttribute('y2', b.y);
    });
  };

  // Hover highlighting
  const setActive = node => {
    graph.classList.toggle('has-active', !!node);
    nodes.forEach(n => n.el.classList.remove('is-active', 'is-near'));
    edges.forEach(e => e.line.classList.remove('is-active'));
    if (!node) return;
    node.el.classList.add('is-active');
    node.edges.forEach(e => {
      e.line.classList.add('is-active');
      [e.a, e.b].forEach(n => n !== node && n !== HUB && n.el.classList.add('is-near'));
    });
  };
  let active = null;
  nodes.forEach(n => {
    n.el.addEventListener('pointerenter', () => setActive(active = n));
    n.el.addEventListener('pointerleave', () => setActive(active = null));
  });

  placeAll();
  if (reduceMotion) return;

  let mouse = null;
  graph.addEventListener('pointermove', e => {
    const r = graph.getBoundingClientRect();
    mouse = { x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 };
  });
  graph.addEventListener('pointerleave', () => { mouse = null; });

  // Packets
  const packets = [];
  const spawn = () => {
    const pool = active && Math.random() < 0.7 ? active.edges : edges;
    const edge = pool[Math.floor(Math.random() * pool.length)];
    // Spokes always flow into the hub; ring edges go either way.
    const reverse = edge.b !== HUB && Math.random() < 0.5;
    const el = document.createElementNS(NS, 'circle');
    el.setAttribute('class', 'graph-packet');
    el.setAttribute('r', 1.1);
    svg.appendChild(el);
    packets.push({ edge, reverse, t: 0, speed: 0.00045 + Math.random() * 0.0003, el });
  };

  let lastPing = 0;
  const ping = now => {
    if (now - lastPing < 350) return;
    lastPing = now;
    ring.animate(
      [{ transform: 'scale(1)', opacity: 0.7 }, { transform: 'scale(1.22)', opacity: 0 }],
      { duration: 700, easing: 'cubic-bezier(.2,.7,.3,1)' }
    );
  };

  let last = performance.now();
  let spawnClock = 0;
  const frame = now => {
    const dt = Math.min(now - last, 50);
    last = now;

    nodes.forEach(n => {
      let x = n.bx + Math.sin(now * 0.0005 + n.phase) * 1.4;
      let y = n.by + Math.cos(now * 0.0004 + n.phase) * 1.4;
      if (mouse) {
        const dx = mouse.x - x, dy = mouse.y - y, d = Math.hypot(dx, dy);
        if (d > 0.01 && d < 24) {
          const pull = (1 - d / 24) * 3.5;
          x += (dx / d) * pull;
          y += (dy / d) * pull;
        }
      }
      n.x = x; n.y = y;
    });
    placeAll();

    spawnClock += dt;
    const interval = active ? 140 : 320;
    while (spawnClock > interval) { spawnClock -= interval; spawn(); }

    for (let i = packets.length - 1; i >= 0; i--) {
      const p = packets[i];
      p.t += dt * p.speed;
      if (p.t >= 1) {
        if (p.edge.b === HUB) ping(now);
        p.el.remove();
        packets.splice(i, 1);
        continue;
      }
      const from = p.reverse ? p.edge.b : p.edge.a;
      const to = p.reverse ? p.edge.a : p.edge.b;
      p.el.setAttribute('cx', from.x + (to.x - from.x) * p.t);
      p.el.setAttribute('cy', from.y + (to.y - from.y) * p.t);
    }

    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
})();
