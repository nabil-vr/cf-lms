(() => {
  const root = document.documentElement;
  const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
  const toggle = document.getElementById('calmToggle');
  let calm = mq.matches;
  try { const s = localStorage.getItem('cf-calm'); if (s !== null) calm = s === '1'; } catch (_) {}

  const applyCalm = () => {
    root.classList.toggle('calm-on', calm);
    toggle.setAttribute('aria-pressed', String(calm));
  };
  toggle.addEventListener('click', () => {
    calm = !calm;
    try { localStorage.setItem('cf-calm', calm ? '1' : '0'); } catch (_) {}
    applyCalm();
    setCounters();
  });
  applyCalm();

  document.getElementById('year').textContent = new Date().getFullYear();

  // Pecah judul jadi kata-kata untuk animasi masuk
  const title = document.getElementById('heroTitle');
  let i = 0;
  const build = (node) => {
    [...node.childNodes].forEach((n) => {
      if (n.nodeType === 3) {
        const frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach((p) => {
          if (!p.trim()) { frag.append(p); return; }
          const w = document.createElement('span'); w.className = 'w';
          const s = document.createElement('span'); s.style.setProperty('--i', i++); s.textContent = p;
          w.append(s); frag.append(w);
        });
        n.replaceWith(frag);
      }
    });
  };
  build(title);

  // Scroll reveal dengan stagger
  const io = new IntersectionObserver((es) => es.forEach((e) => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }), { threshold: .15 });
  document.querySelectorAll('.reveal').forEach((el, k) => {
    el.style.setProperty('--d', (k % 6) * 70 + 'ms');
    io.observe(el);
  });

  // Counter animasi
  const nums = document.querySelectorAll('.num');
  function setCounters() {
    nums.forEach((n) => { if (calm) n.textContent = n.dataset.to; });
  }
  const cio = new IntersectionObserver((es) => es.forEach((e) => {
    if (!e.isIntersecting) return;
    cio.unobserve(e.target);
    const to = +e.target.dataset.to;
    if (calm || to === 0) { e.target.textContent = to; return; }
    const t0 = performance.now();
    const tick = (t) => {
      const p = Math.min((t - t0) / 1200, 1);
      e.target.textContent = Math.round(to * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }), { threshold: .6 });
  nums.forEach((n) => cio.observe(n));

  // Progress bar + gambar garis alur sesuai scroll
  const bar = document.getElementById('progressBar');
  const line = document.getElementById('pathLine');
  const wrap = document.getElementById('pathWrap');
  const len = line.getTotalLength();
  line.style.strokeDasharray = len;
  const onScroll = () => {
    const max = root.scrollHeight - innerHeight;
    bar.style.width = (max > 0 ? scrollY / max * 100 : 0) + '%';
    const r = wrap.getBoundingClientRect();
    const p = calm ? 1 : Math.min(Math.max((innerHeight * .65 - r.top) / r.height, 0), 1);
    line.style.strokeDashoffset = len * (1 - p);
  };
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll);
  onScroll();

  // Spotlight kartu + tilt 3D
  document.querySelectorAll('.spot').forEach((c) => {
    c.addEventListener('pointermove', (e) => {
      const r = c.getBoundingClientRect();
      const x = e.clientX - r.left, y = e.clientY - r.top;
      c.style.setProperty('--mx', x + 'px'); c.style.setProperty('--my', y + 'px');
      if (calm) return;
      const rx = ((y / r.height) - .5) * -8, ry = ((x / r.width) - .5) * 8;
      c.style.transform = `perspective(800px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-4px)`;
    });
    c.addEventListener('pointerleave', () => { c.style.transform = ''; });
  });

  // Tombol magnetik
  document.querySelectorAll('.magnetic').forEach((b) => {
    b.addEventListener('pointermove', (e) => {
      if (calm) return;
      const r = b.getBoundingClientRect();
      b.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * .25}px, ${(e.clientY - r.top - r.height / 2) * .35}px)`;
    });
    b.addEventListener('pointerleave', () => { b.style.transform = ''; });
  });

  // Kursor kustom
  const cur = document.getElementById('cursor');
  addEventListener('pointermove', (e) => {
    if (calm || e.pointerType === 'touch') return;
    cur.classList.add('on');
    cur.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
  });
  document.querySelectorAll('a, button, .card').forEach((el) => {
    el.addEventListener('pointerenter', () => cur.classList.add('big'));
    el.addEventListener('pointerleave', () => cur.classList.remove('big'));
  });

  // Jaringan neuron interaktif di hero
  const cv = document.getElementById('net');
  const ctx = cv.getContext('2d');
  let W, H, pts = [];
  const mouse = { x: -999, y: -999 };
  const dpr = Math.min(devicePixelRatio || 1, 2);
  const init = () => {
    W = cv.clientWidth; H = cv.clientHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const n = Math.min(Math.floor(W * H / 14000), 110);
    pts = Array.from({ length: n }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      vx: (Math.random() - .5) * .35, vy: (Math.random() - .5) * .35,
    }));
  };
  cv.parentElement.addEventListener('pointermove', (e) => {
    const r = cv.getBoundingClientRect();
    mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
  });
  cv.parentElement.addEventListener('pointerleave', () => { mouse.x = mouse.y = -999; });
  let visible = true;
  new IntersectionObserver((es) => { visible = es[0].isIntersecting; }).observe(cv);

  const frame = () => {
    requestAnimationFrame(frame);
    if (!visible) return;
    ctx.clearRect(0, 0, W, H);
    for (const p of pts) {
      if (!calm) {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > W) p.vx *= -1;
        if (p.y < 0 || p.y > H) p.vy *= -1;
        const dx = p.x - mouse.x, dy = p.y - mouse.y, d = Math.hypot(dx, dy);
        if (d < 140 && d > 0) { p.x += dx / d * 1.2; p.y += dy / d * 1.2; }
      }
    }
    for (let a = 0; a < pts.length; a++) {
      for (let b = a + 1; b < pts.length; b++) {
        const d = Math.hypot(pts[a].x - pts[b].x, pts[a].y - pts[b].y);
        if (d < 130) {
          ctx.strokeStyle = `rgba(124,156,255,${(1 - d / 130) * .35})`;
          ctx.beginPath(); ctx.moveTo(pts[a].x, pts[a].y); ctx.lineTo(pts[b].x, pts[b].y); ctx.stroke();
        }
      }
      const dm = Math.hypot(pts[a].x - mouse.x, pts[a].y - mouse.y);
      if (dm < 180) {
        ctx.strokeStyle = `rgba(94,234,212,${(1 - dm / 180) * .6})`;
        ctx.beginPath(); ctx.moveTo(pts[a].x, pts[a].y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke();
      }
      ctx.fillStyle = dm < 180 ? '#5eead4' : '#7c9cff';
      ctx.beginPath(); ctx.arc(pts[a].x, pts[a].y, 2, 0, 6.283); ctx.fill();
    }
  };
  addEventListener('resize', init);
  init();
  requestAnimationFrame(frame);
})();
