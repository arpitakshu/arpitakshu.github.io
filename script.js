(() => {
  'use strict';
  // ====== CONFIG: change the password by replacing this SHA-256 hash (lowercase, trimmed). Default word: "anika" ======
  const PASS_HASH = '9f3d54452618d612f32ad783e752629c63921d6adda451052416bf7aa16aee35';
  const HINT = 'Hint: it\u2019s the name of the birthday girl, in lowercase 💕';
  const $ = id => document.getElementById(id);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const store = {
    get(k){ try { return sessionStorage.getItem(k); } catch { return null; } },
    set(k,v){ try { sessionStorage.setItem(k,v); } catch {} },
    lget(k){ try { return localStorage.getItem(k); } catch { return null; } },
    lset(k,v){ try { localStorage.setItem(k,v); } catch {} }
  };

  /* ---- theme ---- */
  const root = document.documentElement, tbtn = $('themeBtn');
  const isDark = () => root.dataset.theme ? root.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
  const paintBtn = () => tbtn.textContent = isDark() ? '☀️' : '🌙';
  const saved = store.lget('theme'); if (saved) root.dataset.theme = saved;
  paintBtn();
  tbtn.onclick = () => { const n = isDark() ? 'light' : 'dark'; root.dataset.theme = n; store.lset('theme', n); paintBtn(); };

  /* ---- floating petals / hearts background ---- */
  const bg = $('bg'), bx = bg.getContext('2d');
  let W, H, DPR, bits = [];
  const GLYPHS = ['🌸','💖','✨','🦋','🌷','💫'];
  function size(){ DPR = Math.min(devicePixelRatio || 1, 2); W = innerWidth; H = innerHeight;
    for (const c of [bg, $('fx')]) { c.width = W * DPR; c.height = H * DPR; c.getContext('2d').setTransform(DPR,0,0,DPR,0,0); } }
  size(); addEventListener('resize', size);
  const make = (fresh) => ({ x: Math.random()*W, y: fresh ? H + 20 : Math.random()*H, s: 12 + Math.random()*16, v: .25 + Math.random()*.6,
    a: Math.random()*6.28, w: .01 + Math.random()*.02, g: GLYPHS[Math.random()*GLYPHS.length|0], o: .25 + Math.random()*.4 });
  const N = W < 600 ? 14 : 28; for (let i=0;i<N;i++) bits.push(make(false));
  function drawBg(){
    bx.clearRect(0,0,W,H);
    for (const b of bits){ b.y -= b.v; b.a += b.w; b.x += Math.sin(b.a) * .5;
      if (b.y < -30) Object.assign(b, make(true));
      bx.globalAlpha = b.o; bx.font = b.s + 'px serif'; bx.fillText(b.g, b.x, b.y); }
    bx.globalAlpha = 1; if (!reduce) requestAnimationFrame(drawBg);
  }
  drawBg();

  /* ---- confetti ---- */
  const fx = $('fx'), fc = fx.getContext('2d'); let parts = [], running = false;
  const COLORS = ['#ff7eb6','#ffc08a','#c9b6ff','#7ad7e8','#ffd24a','#ffffff'];
  function burst(x, y, n = 120){
    if (reduce) return;
    for (let i=0;i<n;i++){ const a = Math.random()*Math.PI*2, v = 4 + Math.random()*9;
      parts.push({ x, y, vx: Math.cos(a)*v, vy: Math.sin(a)*v - 6, r: 4 + Math.random()*5, c: COLORS[i % COLORS.length], rot: Math.random()*6, vr: (Math.random()-.5)*.4, life: 140 + Math.random()*60 }); }
    if (!running){ running = true; requestAnimationFrame(tick); }
  }
  function tick(){
    fc.clearRect(0,0,W,H);
    parts = parts.filter(p => p.life > 0 && p.y < H + 30);
    for (const p of parts){ p.vy += .24; p.vx *= .99; p.x += p.vx; p.y += p.vy; p.rot += p.vr; p.life--;
      fc.save(); fc.translate(p.x,p.y); fc.rotate(p.rot); fc.fillStyle = p.c; fc.globalAlpha = Math.min(1, p.life/40);
      fc.fillRect(-p.r, -p.r/2, p.r*2, p.r); fc.restore(); }
    if (parts.length) requestAnimationFrame(tick); else { running = false; fc.clearRect(0,0,W,H); }
  }

  /* ---- password gate ---- */
  async function sha256(s){
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
    return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2,'0')).join('');
  }
  let tries = 0;
  function showSite(animate){
    $('gate').hidden = true; $('site').hidden = false; scrollTo(0,0);
    const t = $('title'), txt = t.textContent; t.textContent = '';
    [...txt].forEach((c,i) => { const s = document.createElement('span'); s.className = 'ch'; s.textContent = c === ' ' ? '\u00a0' : c; s.style.animationDelay = (i*60) + 'ms'; s.setAttribute('aria-hidden','true'); t.appendChild(s); });
    if (animate) setTimeout(() => burst(W/2, H*.35, 160), 500);
    observe();
  }
  $('pwForm').addEventListener('submit', async e => {
    e.preventDefault();
    const form = e.currentTarget, msg = $('msg'), val = $('pw').value.trim().toLowerCase();
    let ok = false;
    try { ok = (await sha256(val)) === PASS_HASH; } catch { ok = false; }
    if (ok){
      msg.className = ''; msg.textContent = 'Opening your surprise… 💖';
      store.set('unlocked','1');
      $('env').classList.add('open');
      setTimeout(() => $('gate').classList.add('leaving'), 1500);
      setTimeout(() => showSite(true), 2300);
    } else {
      tries++; msg.className = 'err'; msg.textContent = 'Hmm, that\u2019s not it. Try again 🌸';
      form.classList.remove('shake'); void form.offsetWidth; form.classList.add('shake');
      $('pw').select();
      if (tries >= 3) $('hintBtn').hidden = false;
    }
  });
  $('hintBtn').onclick = () => { $('msg').className = ''; $('msg').textContent = HINT; };

  /* ---- cake ---- */
  $('cake').addEventListener('click', () => {
    const c = $('cake'); if (c.classList.contains('out')) return;
    c.classList.add('out');
    const r = c.getBoundingClientRect(); burst(r.left + r.width/2, r.top + 20, 140);
    $('cakeHint').textContent = 'Wish made! 🎉 I hope it comes true.';
    $('scroll').classList.add('on');
  });

  /* ---- reveal on scroll ---- */
  function observe(){
    const els = document.querySelectorAll('.rv');
    if (!('IntersectionObserver' in window)) { els.forEach(e => e.classList.add('in')); return; }
    const io = new IntersectionObserver(es => es.forEach(en => { if (en.isIntersecting){ en.target.classList.add('in'); io.unobserve(en.target); } }), { threshold: .3 });
    els.forEach((e,i) => { e.style.transitionDelay = (i % 3) * 120 + 'ms'; io.observe(e); });
  }

  /* ---- surprise ---- */
  $('surpriseBtn').addEventListener('click', e => {
    const m = $('surpriseMessage'), open = m.classList.toggle('hidden') === false;
    e.currentTarget.setAttribute('aria-expanded', open);
    e.currentTarget.textContent = open ? 'Hide the surprise 🙈' : 'One more surprise 🎁';
    if (open){ const r = e.currentTarget.getBoundingClientRect(); burst(r.left + r.width/2, r.top, 110);
      setTimeout(() => m.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' }), 250); }
  });

  /* ---- resume if already unlocked this session ---- */
  if (store.get('unlocked') === '1') showSite(false);
})();
