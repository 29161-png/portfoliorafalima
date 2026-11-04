(function () {
  var root = document.documentElement;
  var $ = function (s) { return document.querySelector(s); };

  // Tema claro/escuro
  var label = $('#themeLabel');
  function paintTheme() { label.textContent = root.dataset.theme === 'light' ? 'claro' : 'escuro'; }
  paintTheme();
  $('#themeBtn').addEventListener('click', function () {
    var next = root.dataset.theme === 'light' ? 'dark' : 'light';
    root.dataset.theme = next;
    try { localStorage.setItem('theme', next); } catch (e) {}
    paintTheme();
    drawGrid();
  });

  // Menu mobile
  var burger = $('#burger'), menu = $('#menu');
  function closeMenu() { menu.classList.remove('open'); burger.setAttribute('aria-expanded', 'false'); }
  burger.addEventListener('click', function () {
    var open = menu.classList.toggle('open');
    burger.setAttribute('aria-expanded', String(open));
  });
  menu.addEventListener('click', function (e) { if (e.target.tagName === 'A') closeMenu(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeMenu(); });

  // Seção ativa
  var links = {};
  document.querySelectorAll('#menu a').forEach(function (a) { links[a.getAttribute('href').slice(1)] = a; });
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (en.isIntersecting) {
        Object.keys(links).forEach(function (k) { links[k].classList.toggle('on', k === en.target.id); });
      }
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  document.querySelectorAll('main section[id]').forEach(function (s) { io.observe(s); });

  // Voltar ao topo
  var totop = $('#toTop');
  window.addEventListener('scroll', function () { totop.classList.toggle('show', window.scrollY > 700); }, { passive: true });

  // Relógio (horário de Brasília) e ano
  var clock = $('#clock');
  function tick() {
    clock.textContent = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' }) + ' BRT';
  }
  tick(); setInterval(tick, 30000);
  $('#year').textContent = new Date().getFullYear();

  // Grade de pontos que reage ao cursor
  var cv = $('#grid'), ctx = cv.getContext('2d'), mx = -999, my = -999, raf = 0, GAP = 30;
  var still = matchMedia('(prefers-reduced-motion: reduce)').matches || matchMedia('(hover: none)').matches;
  function drawGrid() {
    var w = cv.clientWidth, h = cv.clientHeight, d = window.devicePixelRatio || 1;
    if (cv.width !== w * d) { cv.width = w * d; cv.height = h * d; }
    ctx.setTransform(d, 0, 0, d, 0, 0); ctx.clearRect(0, 0, w, h);
    var cs = getComputedStyle(root), base = cs.getPropertyValue('--line').trim(), acc = cs.getPropertyValue('--acc').trim();
    for (var x = GAP / 2; x < w; x += GAP) {
      for (var y = GAP / 2; y < h; y += GAP) {
        var dist = Math.hypot(x - mx, y - my), near = Math.max(0, 1 - dist / 150);
        ctx.fillStyle = near > 0 ? acc : base;
        ctx.globalAlpha = near > 0 ? 0.25 + near * 0.75 : 1;
        ctx.beginPath(); ctx.arc(x, y, 1.2 + near * 2.2, 0, 6.283); ctx.fill();
      }
    }
    ctx.globalAlpha = 1; raf = 0;
  }
  function queue() { if (!raf) raf = requestAnimationFrame(drawGrid); }
  drawGrid();
  window.addEventListener('resize', queue);
  if (!still) {
    $('#inicio').addEventListener('pointermove', function (e) {
      var r = cv.getBoundingClientRect(); mx = e.clientX - r.left; my = e.clientY - r.top; queue();
    });
    $('#inicio').addEventListener('pointerleave', function () { mx = my = -999; queue(); });
  }

  // Formulário
  var form = $('#form'), fb = $('#feedback'), send = $('#send');
  var rules = {
    nome: function (v) { return v.trim().length >= 2 || 'Informe seu nome.'; },
    email: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) || 'Informe um e-mail válido, como nome@exemplo.com.'; },
    assunto: function (v) { return v.trim().length >= 3 || 'Informe o assunto com pelo menos 3 caracteres.'; },
    mensagem: function (v) { return v.trim().length >= 10 || 'Escreva uma mensagem com pelo menos 10 caracteres.'; }
  };
  function check(name) {
    var el = form.elements[name], r = rules[name](el.value), box = el.closest('.field');
    box.classList.toggle('bad', r !== true);
    box.querySelector('.err').textContent = r === true ? '' : r;
    el.setAttribute('aria-invalid', r === true ? 'false' : 'true');
    return r === true;
  }
  Object.keys(rules).forEach(function (n) {
    form.elements[n].addEventListener('blur', function () { check(n); });
    form.elements[n].addEventListener('input', function () { if (form.elements[n].closest('.bad')) check(n); });
  });
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    fb.className = 'feedback'; fb.textContent = '';
    var ok = Object.keys(rules).map(check).every(Boolean);
    if (!ok) { var bad = form.querySelector('.bad input, .bad textarea'); if (bad) bad.focus(); return; }
    send.disabled = true; send.textContent = 'Enviando...';
    var data = {}; new FormData(form).forEach(function (v, k) { data[k] = v; });
    fetch('/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
      .then(function (r) { if (!r.ok) throw new Error(); form.reset(); fb.className = 'feedback ok'; fb.textContent = 'Mensagem enviada. Responderei em breve.'; })
      .catch(function () { fb.className = 'feedback fail'; fb.textContent = 'Não foi possível enviar agora. Tente de novo ou escreva para rafaeloliveiralima2304@gmail.com.'; })
      .finally(function () { send.disabled = false; send.textContent = 'Enviar mensagem'; });
  });
})();
