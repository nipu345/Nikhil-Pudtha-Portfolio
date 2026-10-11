/* =========================================================
   Nikhil Pudtha — Portfolio interactions
   ========================================================= */

/* ---------- Hero skill graph ----------
   Skill nodes sit on a ring around the profile photo (the hub).
   Data packets flow along the edges into the hub; nodes drift
   gently and lean toward the cursor. Hovering a node lights up
   its connections; clicking one opens Projects filtered to it. */
(() => {
  const graph = document.querySelector('.graph');
  if (!graph) return;

  const NS = 'http://www.w3.org/2000/svg';
  const svg = graph.querySelector('svg');
  const hub = graph.querySelector('.graph-hub');
  const ring = graph.querySelector('.graph-hub-ring');
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // [id, label, color slot 1-4, project tag to filter by].
  // Order matters: neighbors on the ring get wired together.
  const skills = [
    ['python', 'Python', 1, 'Python'],
    ['ml', 'scikit-learn', 3, 'scikit-learn'],
    ['rag', 'RAG / LLMs', 2, 'RAG'],
    ['fastapi', 'FastAPI', 4, 'FastAPI'],
    ['postgres', 'PostgreSQL', 1, 'PostgreSQL'],
    ['supabase', 'Supabase', 3, 'Supabase'],
    ['react', 'React', 2, 'React'],
    ['node', 'Node.js', 4, 'Node.js'],
  ];

  const HUB = { x: 50, y: 50 };
  const nodes = skills.map(([id, label, tag, stack], i) => {
    const angle = (i / skills.length) * Math.PI * 2 - Math.PI / 2 + Math.PI / skills.length;
    const el = document.createElement('a');
    el.className = 'graph-node';
    el.href = 'projects.html?stack=' + encodeURIComponent(stack);
    el.title = 'See ' + label + ' projects';
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
    n.el.addEventListener('focus', () => setActive(active = n));
    n.el.addEventListener('blur', () => setActive(active = null));
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

/* ---------- Project pipelines ----------
   Each <div class="pipeline" data-stages="A|B|C"> becomes a row of
   stages with packets flowing between them. Packets only run while
   the card is near the middle of the screen. */
(() => {
  const pipelines = document.querySelectorAll('.pipeline[data-stages]');
  if (!pipelines.length) return;

  pipelines.forEach(p => {
    const stages = p.dataset.stages.split('|');
    p.setAttribute('role', 'img');
    p.setAttribute('aria-label', 'Pipeline: ' + stages.join(' to '));
    stages.forEach((label, i) => {
      if (i) {
        const link = document.createElement('span');
        link.className = 'pipe-link';
        link.style.setProperty('--i', i);
        p.append(link);
      }
      const stage = document.createElement('span');
      stage.className = 'pipe-stage';
      stage.textContent = label;
      p.append(stage);
    });
  });

  const cards = document.querySelectorAll('.project-card');
  if (!('IntersectionObserver' in window)) {
    cards.forEach(c => c.classList.add('is-live'));
    return;
  }
  const io = new IntersectionObserver(
    entries => entries.forEach(e => e.target.classList.toggle('is-live', e.isIntersecting)),
    { rootMargin: '-30% 0px -30% 0px' }
  );
  cards.forEach(c => io.observe(c));
})();

/* ---------- Stack filter ----------
   Builds filter chips from every .tag on the Projects page. Picking
   one dims projects that don't use it. Tags inside cards are
   clickable too, and ?stack=React in the URL preselects a filter. */
(() => {
  const bar = document.querySelector('.stack-filter');
  if (!bar) return;

  const cards = [...document.querySelectorAll('.project-card')];
  const tagsOf = card => [...card.querySelectorAll('.tag')];
  const stackOf = card => tagsOf(card).map(t => t.textContent.trim());

  // Most-used tech first, then alphabetical.
  const counts = {};
  cards.flatMap(stackOf).forEach(s => { counts[s] = (counts[s] || 0) + 1; });
  const stacks = Object.keys(counts).sort((a, b) => counts[b] - counts[a] || a.localeCompare(b));

  const makeChip = (label, value) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'chip';
    b.dataset.stack = value;
    b.textContent = label;
    bar.append(b);
    return b;
  };
  const chips = [makeChip('all', ''), ...stacks.map(s => makeChip(s, s))];
  const count = document.createElement('span');
  count.className = 'stack-count';
  count.setAttribute('aria-live', 'polite');
  bar.after(count);

  let current = '';
  const apply = stack => {
    current = stacks.includes(stack) ? stack : '';
    chips.forEach(c => c.setAttribute('aria-pressed', c.dataset.stack === current));
    let shown = 0;
    cards.forEach(card => {
      const match = !current || stackOf(card).includes(current);
      card.classList.toggle('is-dimmed', !match);
      if (match) shown++;
      tagsOf(card).forEach(t => t.classList.toggle('is-match', !!current && t.textContent.trim() === current));
    });
    count.textContent = current
      ? `// ${shown} of ${cards.length} use ${current}`
      : `// ${cards.length} projects`;
    try {
      const url = new URL(location.href);
      current ? url.searchParams.set('stack', current) : url.searchParams.delete('stack');
      history.replaceState(null, '', url);
    } catch (_) { /* file:// pages can refuse URL updates; filtering still works */ }
  };

  chips.forEach(c => c.addEventListener('click', () => apply(c.dataset.stack === current ? '' : c.dataset.stack)));
  cards.forEach(card => tagsOf(card).forEach(t => {
    t.addEventListener('click', () => apply(t.textContent.trim() === current ? '' : t.textContent.trim()));
  }));

  apply(new URLSearchParams(location.search).get('stack') || '');
})();

/* ---------- Card tilt + glow ----------
   Cards tilt toward the cursor and a soft spotlight follows it.
   Mouse/trackpad only, and off for reduced-motion visitors. */
(() => {
  if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  document.querySelectorAll('.project-card, .hobby-card').forEach(card => {
    card.classList.add('has-glow');
    card.addEventListener('pointermove', e => {
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width;
      const py = (e.clientY - r.top) / r.height;
      // Wide cards tilt less so they don't swing too far.
      const max = 6 * Math.min(1, 380 / r.width);
      card.style.setProperty('--mx', px * 100 + '%');
      card.style.setProperty('--my', py * 100 + '%');
      card.style.transform = `perspective(900px) rotateX(${(0.5 - py) * max}deg) rotateY(${(px - 0.5) * max}deg)`;
    });
    card.addEventListener('pointerleave', () => { card.style.transform = ''; });
  });
})();

/* ---------- Scroll reveals ----------
   Sections fade up as they scroll into view, staggered when
   several arrive at once. */
(() => {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (!('IntersectionObserver' in window)) return;

  const targets = document.querySelectorAll(
    '.hero > div > *, .hero .graph, .page-head, .stack-filter, .project-card, .hobby-card, .resume-card > *'
  );
  const io = new IntersectionObserver(entries => {
    entries.filter(e => e.isIntersecting).forEach((e, i) => {
      const el = e.target;
      const delay = i * 60;
      io.unobserve(el);
      el.style.transitionDelay = delay + 'ms';
      el.classList.add('is-in');
      // Hand the element back to its normal transitions once it has arrived.
      setTimeout(() => {
        el.style.transitionDelay = '';
        el.classList.remove('reveal', 'is-in');
      }, 800 + delay);
    });
  }, { rootMargin: '0px 0px -8% 0px' });

  targets.forEach(el => {
    el.classList.add('reveal');
    io.observe(el);
  });
})();

/* ---------- Experience timeline ----------
   Draws each experience entry as a bar on a shared month axis so
   overlapping roles are easy to see. Hovering a bar highlights its
   entry (and vice versa); clicking a bar scrolls to the entry.
   Entries without data-end run up to today. */
(() => {
  const host = document.querySelector('.timeline');
  if (!host) return;

  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const toMonth = s => { const [y, m] = s.split('-').map(Number); return y * 12 + m - 1; };
  const today = new Date();
  const now = today.getFullYear() * 12 + today.getMonth() + (today.getDate() - 1) / 31;

  const items = [...document.querySelectorAll('.r-entry[data-start]')].map(entry => ({
    entry,
    start: toMonth(entry.dataset.start),
    end: entry.dataset.end ? toMonth(entry.dataset.end) + 1 : now,
    live: !entry.dataset.end,
  }));
  if (!items.length) return;

  const min = Math.min(...items.map(i => i.start));
  const max = Math.max(now, ...items.map(i => i.end)) + 1;
  const pct = m => ((m - min) / (max - min)) * 100 + '%';
  const make = (cls, parent, tag = 'div') => {
    const el = document.createElement(tag);
    el.className = cls;
    parent.append(el);
    return el;
  };

  const setActive = item => {
    host.classList.toggle('has-active', !!item);
    items.forEach(i => [i.entry, i.bar, i.label].forEach(el => el.classList.toggle('is-active', i === item)));
  };

  items.forEach((item, row) => {
    item.label = make('tl-label', host, 'span');
    item.label.textContent = item.entry.dataset.short;
    item.label.style.gridRow = row + 1;
    const track = make('tl-track', host);
    track.style.gridRow = row + 1;
    item.bar = make('tl-bar', track);
    item.bar.dataset.tag = item.entry.dataset.tag;
    item.bar.classList.toggle('is-live', item.live);
    item.bar.style.left = pct(item.start);
    item.bar.style.width = `calc(${pct(item.end)} - ${pct(item.start)})`;
    item.bar.style.transitionDelay = row * 120 + 'ms';

    item.bar.addEventListener('pointerenter', () => setActive(item));
    item.bar.addEventListener('pointerleave', () => setActive(null));
    item.bar.addEventListener('click', () => item.entry.scrollIntoView({ behavior: 'smooth', block: 'center' }));
    item.entry.addEventListener('pointerenter', () => setActive(item));
    item.entry.addEventListener('pointerleave', () => setActive(null));
  });

  // Quarterly gridlines + labels, and a marker for today.
  const overlay = make('tl-overlay', host);
  overlay.style.gridRow = `1 / ${items.length + 1}`;
  const axis = make('tl-axis', host);
  axis.style.gridRow = items.length + 1;
  for (let m = Math.ceil(min / 3) * 3; m < max; m += 3) {
    make('tl-gridline', overlay).style.left = pct(m);
    const tick = make('tl-tick', axis);
    tick.style.left = pct(m);
    tick.textContent = `${MONTHS[m % 12]} '${String(Math.floor(m / 12)).slice(2)}`;
  }
  make('tl-now', overlay).style.left = pct(now);

  if (!('IntersectionObserver' in window)) return host.classList.add('is-visible');
  const io = new IntersectionObserver(([e]) => {
    if (!e.isIntersecting) return;
    host.classList.add('is-visible');
    io.disconnect();
  }, { threshold: 0.4 });
  io.observe(host);
})();

/* ---------- Live GitHub activity ----------
   Pulls public repos from GitHub's API for the Coding hobby card:
   repo count, last push, language mix, and the latest repos.
   Cached for an hour per visitor to stay under GitHub's rate limit. */
(() => {
  const host = document.querySelector('.gh-activity[data-user]');
  if (!host) return;
  const user = host.dataset.user;
  const cacheKey = 'gh-repos:' + user;
  const COLORS = ['--tag1-text', '--tag2-text', '--tag3-text', '--tag4-text'];

  const ago = iso => {
    const s = (Date.now() - new Date(iso)) / 1000;
    const steps = [[31536000, 'y'], [2592000, 'mo'], [604800, 'w'], [86400, 'd'], [3600, 'h'], [60, 'm']];
    for (const [secs, unit] of steps) if (s >= secs) return Math.floor(s / secs) + unit + ' ago';
    return 'just now';
  };
  const esc = str => String(str).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  const render = all => {
    const repos = all.filter(r => !r.fork).sort((a, b) => new Date(b.pushed_at) - new Date(a.pushed_at));
    if (!repos.length) return;

    const counts = {};
    repos.forEach(r => { if (r.language) counts[r.language] = (counts[r.language] || 0) + 1; });
    const langs = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 4);
    const total = langs.reduce((n, [, c]) => n + c, 0);

    host.innerHTML = `
      <div class="gh-head"><span class="live-dot"></span>
        <span><strong>${repos.length}</strong> repos &middot; pushed ${ago(repos[0].pushed_at)}</span></div>
      <div class="gh-langs">${langs.map(([, c], i) =>
        `<span style="flex:${c};background:var(${COLORS[i]});animation-delay:${i * 100}ms"></span>`).join('')}</div>
      <div class="gh-legend">${langs.map(([l, c], i) =>
        `<span><i style="background:var(${COLORS[i]})"></i>${esc(l)} ${Math.round((c / total) * 100)}%</span>`).join('')}</div>
      <ul class="gh-repos">${repos.slice(0, 3).map(r =>
        `<li><a href="${esc(r.html_url)}" target="_blank" rel="noopener noreferrer">${esc(r.name)}</a>
         <time datetime="${esc(r.pushed_at)}">${ago(r.pushed_at)}</time></li>`).join('')}</ul>`;
    host.hidden = false;
  };

  try {
    const cached = JSON.parse(sessionStorage.getItem(cacheKey) || 'null');
    if (cached && Date.now() - cached.at < 3600e3) return render(cached.repos);
  } catch (_) { /* storage unavailable; just fetch */ }

  fetch(`https://api.github.com/users/${encodeURIComponent(user)}/repos?per_page=100&sort=pushed`)
    .then(r => (r.ok ? r.json() : Promise.reject(r.status)))
    .then(repos => {
      render(repos);
      try { sessionStorage.setItem(cacheKey, JSON.stringify({ at: Date.now(), repos })); } catch (_) {}
    })
    .catch(() => { /* offline or rate-limited: leave the card as it was */ });
})();
