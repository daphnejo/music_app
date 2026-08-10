// Solfedjio, 1-sinf — klient ilovasi (build-siz, tashqi bog'liqliksiz).
// 2-versiya: JWT (Bearer token) bilan alohida backend'ga (Render) so'rov yuboradi.

// ---------- Utilitalar ----------

const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const $ = (sel, root = document) => root.querySelector(sel);
const main = () => $('#main');

// API_BASE_URL config.js orqali beriladi (Vercel muhit o'zgaruvchisidan generatsiya qilinadi).
// Lokal ishga tushirishda backend bilan bitta originda bo'lsa, bo'sh qoldirish mumkin.
const API_BASE = (window.__SOLFEDJIO_CONFIG__ && window.__SOLFEDJIO_CONFIG__.apiBaseUrl) || '';

const TOKEN_KEY = 'solfedjio.refreshToken.v1';

const state = {
  user: null,
  accessToken: null, // faqat xotirada — XSS xavfini kamaytirish uchun localStorage'da saqlanmaydi
  course: null,
  online: navigator.onLine,
};

class HttpError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

function getRefreshToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}
function setRefreshToken(token) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* localStorage yo'q bo'lishi mumkin (private mode) — sessiya shunda ham xotirada ishlaydi */
  }
}

/** Refresh token orqali yangi access token olish */
async function tryRefresh() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;
  try {
    const res = await fetch(`${API_BASE}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) throw new Error();
    const data = await res.json();
    state.user = data.user;
    state.accessToken = data.accessToken;
    setRefreshToken(data.refreshToken);
    return true;
  } catch {
    setRefreshToken(null);
    state.user = null;
    state.accessToken = null;
    return false;
  }
}

async function api(path, { method = 'GET', body, headers = {}, _retried = false } = {}) {
  const opts = { method, headers: { ...headers } };
  if (body !== undefined) {
    opts.headers['content-type'] = 'application/json';
    opts.body = JSON.stringify(body);
  }
  if (state.accessToken) opts.headers['authorization'] = `Bearer ${state.accessToken}`;

  let res;
  try {
    res = await fetch(`${API_BASE}${path}`, opts);
  } catch {
    throw new HttpError(0, 'network', 'Tarmoq bilan aloqa yo\u2018q');
  }

  // Access token eskirgan bo'lishi mumkin — bir marta yangilab qayta urinamiz
  if (res.status === 401 && !_retried && (await tryRefresh())) {
    return api(path, { method, body, headers, _retried: true });
  }

  if (res.status === 204) return null;
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const err = data?.error ?? {};
    throw new HttpError(res.status, err.code ?? 'error', err.message ?? `Xatolik ${res.status}`);
  }
  return data;
}

// ---------- Офлайн-очередь отправок ----------

const QUEUE_KEY = 'solfedjio.outbox.v1';

const outbox = {
  all: () => {
    try {
      return JSON.parse(localStorage.getItem(QUEUE_KEY) ?? '[]');
    } catch {
      return [];
    }
  },
  add(item) {
    const items = outbox.all();
    items.push(item);
    localStorage.setItem(QUEUE_KEY, JSON.stringify(items));
    renderOfflinePill();
  },
  clear() {
    localStorage.removeItem(QUEUE_KEY);
    renderOfflinePill();
  },
};

async function flushOutbox() {
  const items = outbox.all();
  if (!items.length || !navigator.onLine || !state.user) return;
  try {
    // Idempotency-Key у каждого элемента гарантирует, что повторная синхронизация
    // не создаст вторую попытку по тому же ответу.
    await api('/api/attempts/sync', { method: 'POST', body: { items } });
    outbox.clear();
  } catch {
    /* попробуем позже */
  }
}

function renderOfflinePill() {
  const pill = $('#offline-pill');
  const n = outbox.all().length;
  if (!navigator.onLine) {
    pill.hidden = false;
    pill.textContent = n ? `Oflayn rejim · ${n} ta javob navbatda` : 'Oflayn rejim';
  } else if (n) {
    pill.hidden = false;
    pill.textContent = `${n} ta javob yuborilmoqda…`;
  } else {
    pill.hidden = true;
  }
}

window.addEventListener('online', () => {
  state.online = true;
  renderOfflinePill();
  flushOutbox();
});
window.addEventListener('offline', () => {
  state.online = false;
  renderOfflinePill();
});

// ---------- Общие компоненты ----------

const loading = (text = 'Yuklanmoqda…') => `<div class="state"><div class="spinner"></div>${esc(text)}</div>`;

const empty = (text) => `<div class="state">${esc(text)}</div>`;

const errorState = (err, retryHash) => `
  <div class="card">
    <div class="banner err">${esc(err.message)}</div>
    ${retryHash ? `<button class="btn secondary" data-action="retry">Qayta urinish</button>` : ''}
  </div>`;

function renderTopbar() {
  const bar = $('#topbar');
  if (!state.user) {
    bar.hidden = true;
    return;
  }
  const r = state.user.role;
  const links = [['#/course', 'Kurs'], ['#/progress', 'Natijalar']];
  if (r === 'teacher' || r === 'admin') links.push(['#/teacher', 'O‘qituvchi']);
  if (r === 'content_editor' || r === 'admin') links.push(['#/admin', 'Boshqaruv']);

  const here = location.hash || '#/course';
  bar.hidden = false;
  bar.innerHTML = `
    <a class="brand" href="#/course">Solfedjio · 1-sinf</a>
    <nav aria-label="Asosiy menyu">
      ${links
        .map(
          ([href, label]) =>
            `<a class="navlink" href="${href}"${here.startsWith(href) ? ' aria-current="page"' : ''}>${esc(label)}</a>`,
        )
        .join('')}
    </nav>
    <span class="spacer"></span>
    <span class="who">${esc(state.user.fullName)} · ${esc(roleLabel(r))}</span>
    <button class="btn ghost small" data-action="logout">Chiqish</button>`;
}

const roleLabel = (r) =>
  ({ student: 'o‘quvchi', teacher: 'o‘qituvchi', content_editor: 'metodist', admin: 'admin' }[r] ?? r);

const typeLabel = (t) =>
  ({
    theory: 'Nazariya',
    single_choice: 'Test',
    audio_single_choice: 'Eshitib javob berish',
    image_choice: 'Rasmli test',
    sequence_order: 'Tartiblash',
    missing_fragment: 'Yetishmagan qism',
    notation_input: 'Nota yozish',
    practice_acknowledgement: 'Amaliy mashq',
  }[t] ?? t);

/** Плеер без autoplay, с состояниями загрузки и ошибки */
function playerHtml(asset, index) {
  const id = `pl-${asset.id}-${index}`;
  if (asset.kind === 'audio') {
    return `
      <div class="player">
        <span class="label">🎵 ${esc(asset.caption ?? 'Audio misol')}</span>
        <audio id="${id}" controls preload="none" src="${esc(asset.url)}"
               aria-label="${esc(asset.caption ?? 'Audio misol')}"></audio>
        <button class="btn ghost small" data-replay="${id}">Qaytadan</button>
        <span class="muted" data-status-for="${id}"></span>
      </div>`;
  }
  return `
    <div class="player">
      <video id="${id}" controls preload="metadata" playsinline src="${esc(asset.url)}"
             aria-label="${esc(asset.caption ?? 'Video misol')}"></video>
      <span class="muted" data-status-for="${id}"></span>
    </div>`;
}

function wirePlayers(root) {
  root.querySelectorAll('audio, video').forEach((el) => {
    const status = root.querySelector(`[data-status-for="${el.id}"]`);
    el.addEventListener('waiting', () => status && (status.textContent = 'Yuklanmoqda…'));
    el.addEventListener('playing', () => status && (status.textContent = ''));
    el.addEventListener('error', () => {
      if (status) status.innerHTML = '<span class="badge err">Fayl yuklanmadi</span>';
    });
  });
  root.querySelectorAll('[data-replay]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const el = root.querySelector(`#${CSS.escape(btn.dataset.replay)}`);
      if (!el) return;
      el.currentTime = 0;
      el.play().catch(() => {});
    });
  });
}

// ---------- Экран входа ----------

function viewLogin() {
  renderTopbar();
  main().innerHTML = `
    <div class="card" style="max-width:420px;margin:8vh auto">
      <h1>Solfedjio, 1-sinf</h1>
      <p class="muted">Bolalar musiqa va san’at maktablari uchun</p>
      <form id="login-form" novalidate>
        <div class="field">
          <label for="email">Email</label>
          <input id="email" name="email" type="email" autocomplete="username" required>
        </div>
        <div class="field">
          <label for="password">Parol</label>
          <input id="password" name="password" type="password" autocomplete="current-password" required>
        </div>
        <div id="login-error" role="alert"></div>
        <button class="btn" type="submit">Kirish</button>
      </form>
      <details style="margin-top:24px">
        <summary class="muted">Demo hisoblar</summary>
        <table style="margin-top:8px">
          <tr><td>student@example.com</td><td class="mono">student12345</td></tr>
          <tr><td>teacher@example.com</td><td class="mono">teacher12345</td></tr>
          <tr><td>editor@example.com</td><td class="mono">editor12345</td></tr>
          <tr><td>admin@example.com</td><td class="mono">admin12345</td></tr>
        </table>
      </details>
    </div>`;

  $('#login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = $('#login-form button');
    const box = $('#login-error');
    btn.disabled = true;
    box.innerHTML = '';
    try {
      const data = await api('/api/auth/login', {
        method: 'POST',
        body: { email: $('#email').value.trim(), password: $('#password').value },
      });
      state.user = data.user;
      state.accessToken = data.accessToken;
      setRefreshToken(data.refreshToken);
      location.hash = '#/course';
      await flushOutbox();
      route();
    } catch (err) {
      box.innerHTML = `<div class="banner err">${esc(err.message)}</div>`;
      btn.disabled = false;
    }
  });
  $('#email').focus();
}

// ---------- Карта курса ----------

async function viewCourse() {
  main().innerHTML = loading();
  let data;
  try {
    data = await api('/api/course');
  } catch (err) {
    main().innerHTML = errorState(err, true);
    return;
  }
  state.course = data;

  if (!data.course) {
    main().innerHTML = `<div class="card">${empty(data.message ?? 'Kurs tayinlanmagan')}</div>`;
    return;
  }

  const totalBlocks = data.lessons.reduce((a, l) => a + l.blockCount, 0);
  const doneBlocks = data.lessons.reduce((a, l) => a + l.completed, 0);
  const pct = totalBlocks ? Math.round((doneBlocks / totalBlocks) * 100) : 0;

  main().innerHTML = `
    <h1>${esc(data.course.title)}</h1>
    <p class="muted">${esc(data.course.subtitle ?? '')} · versiya ${data.course.version}</p>

    <div class="card">
      <div class="row">
        <div style="flex:1">
          <strong>Umumiy o‘zlashtirish</strong>
          <div class="bar" style="margin-top:8px"><i style="width:${pct}%"></i></div>
        </div>
        <div class="stat"><div class="value">${pct}%</div><div class="label">${doneBlocks} / ${totalBlocks}</div></div>
      </div>
      ${
        data.lastBlockId
          ? `<div style="margin-top:16px"><a class="btn" href="#/block/${data.lastBlockId}">Davom ettirish</a></div>`
          : data.lessons[0]?.blocks[0]?.id
            ? `<div style="margin-top:16px"><a class="btn" href="#/block/${data.lessons[0].blocks[0].id}">Boshlash</a></div>`
            : ''
      }
    </div>

    ${data.lessons
      .map(
        (l) => `
      <div class="card tight">
        <div class="lesson-row">
          <div class="num">${l.declaredNumber || '—'}</div>
          <div class="info">
            <div class="title">${esc(l.title)}</div>
            <div class="meta">${l.completed} / ${l.blockCount} bo‘lim bajarildi</div>
          </div>
          <button class="btn secondary small" data-toggle="lesson-${l.id}" aria-expanded="false"
                  aria-controls="lesson-${l.id}">Ochish</button>
        </div>
        <ul class="block-list" id="lesson-${l.id}" hidden>
          ${l.blocks
            .map(
              (b) => `<li><a href="#/block/${b.id}">
                <span class="dot ${esc(b.state)}"></span>
                <span style="flex:1">${esc(b.title)}</span>
                <span class="badge">${esc(typeLabel(b.type))}</span>
                ${b.needsReview ? '<span class="badge warn" title="Metodist tasdig‘i kutilmoqda">tekshiruvda</span>' : ''}
              </a></li>`,
            )
            .join('')}
        </ul>
      </div>`,
      )
      .join('')}`;

  main()
    .querySelectorAll('[data-toggle]')
    .forEach((btn) => {
      btn.addEventListener('click', () => {
        const panel = document.getElementById(btn.dataset.toggle);
        const open = !panel.hidden;
        panel.hidden = open;
        btn.setAttribute('aria-expanded', String(!open));
        btn.textContent = open ? 'Ochish' : 'Yopish';
      });
    });
}

// ---------- Экран блока (урока) ----------

async function viewBlock(blockId) {
  main().innerHTML = loading();
  let data;
  try {
    data = await api(`/api/blocks/${blockId}`);
  } catch (err) {
    main().innerHTML = errorState(err, true);
    return;
  }

  const { block, assets, question, navigation, progress, draftPayload } = data;
  const audio = assets.filter((a) => a.kind === 'audio');
  const video = assets.filter((a) => a.kind === 'video');
  const images = assets.filter((a) => a.kind === 'image');

  main().innerHTML = `
    <nav class="row muted" style="margin-bottom:12px" aria-label="Navigatsiya">
      <a href="#/course">← Kurs xaritasi</a>
      <span class="right">${navigation.position} / ${navigation.total}</span>
    </nav>

    <div class="card">
      <div class="row" style="margin-bottom:8px">
        <span class="badge">${esc(typeLabel(block.type))}</span>
        ${progress.state === 'completed' ? '<span class="badge ok">bajarildi</span>' : ''}
        ${block.sourceSlide ? `<span class="muted right">manba: slayd ${block.sourceSlide}</span>` : ''}
      </div>
      <h1>${esc(block.title)}</h1>
      <p class="muted">${esc(block.lesson.title)}</p>

      ${
        block.needsReview
          ? `<div class="banner warn"><strong>Metodist tekshiruvi kutilmoqda.</strong> ${esc(block.reviewNote ?? '')}</div>`
          : ''
      }

      <div class="lesson-body">
        ${block.body.map((p) => `<p>${esc(p)}</p>`).join('')}
        ${video.map((a, i) => playerHtml(a, i)).join('')}
        ${audio.map((a, i) => playerHtml(a, i)).join('')}
        ${images
          .map(
            (a) =>
              `<div class="figure"><img src="${esc(a.url)}" alt="${esc(a.caption ?? 'Darsdagi nota yoki rasm')}" loading="lazy"></div>`,
          )
          .join('')}
      </div>

      <div id="task"></div>
    </div>

    <div class="row">
      ${navigation.prevBlockId ? `<a class="btn secondary" href="#/block/${navigation.prevBlockId}">← Oldingi</a>` : ''}
      ${navigation.nextBlockId ? `<a class="btn secondary right" href="#/block/${navigation.nextBlockId}">Keyingi →</a>` : ''}
    </div>`;

  wirePlayers(main());
  renderTask(block, question, draftPayload, navigation);
}

function renderTask(block, question, draftPayload, navigation) {
  const host = $('#task');

  if (!question) {
    if (block.type === 'theory') {
      host.innerHTML = `<button class="btn" data-action="complete">O‘qib chiqdim</button>`;
    } else {
      host.innerHTML = `
        <div class="banner info">Bu amaliy mashq: kuylang yoki chalib ko‘ring, so‘ng belgilang.</div>
        <button class="btn" data-action="ack">Mashqni bajardim</button>`;
    }
    host.querySelector('[data-action]')?.addEventListener('click', (e) => {
      const isAck = e.currentTarget.dataset.action === 'ack';
      completeOrAck(block.id, isAck, navigation);
    });
    return;
  }

  let selected = draftPayload?.optionId ?? null;

  const draw = () => {
    host.innerHTML = `
      <hr style="border:0;border-top:1px solid var(--line);margin:24px 0">
      <h2>${esc(question.prompt)}</h2>
      <div class="options" role="group" aria-label="Javob variantlari">
        ${question.options
          .map(
            (o) => `
          <button type="button" class="option" data-option="${o.id}"
                  aria-pressed="${selected === o.id}">
            <span>
              ${o.text ? esc(o.text) : ''}
              ${o.imageUrl ? `<img src="${esc(o.imageUrl)}" alt="Javob varianti ${o.ordinal + 1}">` : ''}
            </span>
          </button>`,
          )
          .join('')}
      </div>
      <div class="row">
        <button class="btn" data-action="submit" ${selected === null ? 'disabled' : ''}>Javobni yuborish</button>
        <span class="muted" id="draft-note">${draftPayload ? 'Qoralama saqlangan' : ''}</span>
      </div>
      <div id="result" role="status" aria-live="polite"></div>`;

    host.querySelectorAll('[data-option]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        selected = btn.dataset.option;
        draw();
        try {
          await api(`/api/blocks/${block.id}/draft`, { method: 'POST', body: { optionId: selected } });
          const note = $('#draft-note');
          if (note) note.textContent = 'Qoralama saqlangan';
        } catch {
          /* черновик не критичен */
        }
      });
      // Навигация стрелками между вариантами
      btn.addEventListener('keydown', (e) => {
        const all = [...host.querySelectorAll('[data-option]')];
        const i = all.indexOf(btn);
        if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
          e.preventDefault();
          all[(i + 1) % all.length].focus();
        }
        if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
          e.preventDefault();
          all[(i - 1 + all.length) % all.length].focus();
        }
      });
    });

    host.querySelector('[data-action="submit"]')?.addEventListener('click', () => submitAnswer(block, question, selected, navigation));
  };

  draw();
}

async function submitAnswer(block, question, optionId, navigation) {
  const btn = $('[data-action="submit"]');
  const result = $('#result');
  btn.disabled = true;
  result.innerHTML = loading('Tekshirilmoqda…');

  const idempotencyKey = (crypto.randomUUID?.() ?? String(Date.now()) + Math.random()).replace(/-/g, '');

  try {
    const data = await api(`/api/blocks/${block.id}/submit`, {
      method: 'POST',
      body: { optionId },
      headers: { 'idempotency-key': idempotencyKey },
    });
    showResult(data, question, navigation);
  } catch (err) {
    if (err.status === 0) {
      // Офлайн: кладём в очередь, отправим при появлении сети
      outbox.add({ blockId: block.id, idempotencyKey, payload: { optionId } });
      result.innerHTML = `<div class="banner warn">Tarmoq yo‘q. Javob saqlandi va aloqa tiklanganda yuboriladi.</div>`;
    } else {
      result.innerHTML = `<div class="banner err">${esc(err.message)}</div>`;
      btn.disabled = false;
    }
  }
}

function showResult(data, question, navigation) {
  const result = $('#result');
  document.querySelectorAll('[data-option]').forEach((el) => {
    el.disabled = true;
    const id = el.dataset.option;
    if (data.correctOptionIds?.includes(id)) el.classList.add('correct');
    else if (el.getAttribute('aria-pressed') === 'true') el.classList.add('incorrect');
  });

  result.innerHTML = `
    <div class="banner ${data.correct ? 'ok' : 'err'}">
      <strong>${data.correct ? 'Barakalla! To‘g‘ri.' : 'Noto‘g‘ri. Qayta urinib ko‘ring.'}</strong>
      ${data.explanation ? `<div style="margin-top:6px">${esc(data.explanation)}</div>` : ''}
    </div>
    <div class="row">
      <button class="btn secondary" data-action="again">Qayta urinish</button>
      ${navigation.nextBlockId ? `<a class="btn right" href="#/block/${navigation.nextBlockId}">Keyingi bo‘lim →</a>` : ''}
    </div>`;

  result.querySelector('[data-action="again"]').addEventListener('click', () => route(true));
}

async function completeOrAck(blockId, isAck, navigation) {
  const host = $('#task');
  try {
    if (isAck) {
      const key = (crypto.randomUUID?.() ?? String(Date.now())).replace(/-/g, '');
      await api(`/api/blocks/${blockId}/submit`, {
        method: 'POST',
        body: { acknowledged: true },
        headers: { 'idempotency-key': key },
      });
    } else {
      await api(`/api/blocks/${blockId}/complete`, { method: 'POST', body: {} });
    }
    host.innerHTML = `
      <div class="banner ok">Bajarildi.</div>
      ${navigation.nextBlockId ? `<a class="btn" href="#/block/${navigation.nextBlockId}">Keyingi bo‘lim →</a>` : ''}`;
  } catch (err) {
    host.innerHTML = `<div class="banner err">${esc(err.message)}</div>`;
  }
}

// ---------- Прогресс ученика ----------

async function viewProgress() {
  main().innerHTML = loading();
  let data;
  try {
    data = await api('/api/progress');
  } catch (err) {
    main().innerHTML = errorState(err, true);
    return;
  }
  if (!data.summary) {
    main().innerHTML = `<div class="card">${empty('Hozircha ma’lumot yo‘q')}</div>`;
    return;
  }
  const s = data.summary;
  main().innerHTML = `
    <h1>Natijalar</h1>
    <div class="grid cols-3">
      <div class="card stat"><div class="value">${s.completedBlocks}</div><div class="label">bajarilgan bo‘lim (jami ${s.totalBlocks})</div></div>
      <div class="card stat"><div class="value">${s.answeredQuestions}</div><div class="label">javob berilgan savol</div></div>
      <div class="card stat"><div class="value">${s.correctAnswers}</div><div class="label">to‘g‘ri javob</div></div>
    </div>
    <div class="card">
      <h2>Darslar bo‘yicha</h2>
      <table>
        <thead><tr><th>Dars</th><th>Bajarildi</th><th></th></tr></thead>
        <tbody>
          ${data.perLesson
            .map((l) => {
              const pct = l.total ? Math.round(((l.done ?? 0) / l.total) * 100) : 0;
              return `<tr>
                <td>${esc(l.lesson)}</td>
                <td>${l.done ?? 0} / ${l.total}</td>
                <td style="width:40%"><div class="bar"><i style="width:${pct}%"></i></div></td>
              </tr>`;
            })
            .join('')}
        </tbody>
      </table>
    </div>`;
}

// ---------- Кабинет преподавателя ----------

async function viewTeacher() {
  main().innerHTML = loading();
  try {
    const { classes } = await api('/api/teacher/classes');
    main().innerHTML = `
      <h1>O‘qituvchi kabineti</h1>
      ${
        classes.length
          ? `<div class="grid cols-2">${classes
              .map(
                (c) => `<div class="card">
                  <h3>${esc(c.name)}</h3>
                  <p class="muted">${c.students} o‘quvchi</p>
                  <a class="btn secondary" href="#/teacher/class/${c.id}">Progressni ko‘rish</a>
                </div>`,
              )
              .join('')}</div>`
          : `<div class="card">${empty('Sizga sinf biriktirilmagan')}</div>`
      }`;
  } catch (err) {
    main().innerHTML = errorState(err, true);
  }
}

async function viewTeacherClass(classId) {
  main().innerHTML = loading();
  try {
    const data = await api(`/api/teacher/classes/${classId}/progress`);
    main().innerHTML = `
      <nav class="muted" style="margin-bottom:12px"><a href="#/teacher">← Sinflar</a></nav>
      <h1>Sinf progressi</h1>
      <div class="card">
        <table>
          <thead><tr><th>O‘quvchi</th><th>Bo‘limlar</th><th>Javoblar</th><th>To‘g‘ri</th><th></th></tr></thead>
          <tbody>
            ${data.students
              .map(
                (s) => `<tr>
                  <td>${esc(s.fullName)}<div class="muted mono">${esc(s.email)}</div></td>
                  <td>${s.completedBlocks} / ${s.totalBlocks}</td>
                  <td>${s.answeredQuestions}</td>
                  <td>${s.correctAnswers}</td>
                  <td><a class="btn ghost small" href="#/teacher/student/${s.id}">Urinishlar</a></td>
                </tr>`,
              )
              .join('')}
          </tbody>
        </table>
      </div>`;
  } catch (err) {
    main().innerHTML = errorState(err, true);
  }
}

async function viewTeacherStudent(studentId) {
  main().innerHTML = loading();
  try {
    const data = await api(`/api/teacher/students/${studentId}/attempts`);
    main().innerHTML = `
      <nav class="muted" style="margin-bottom:12px"><a href="#/teacher">← Sinflar</a></nav>
      <h1>O‘quvchi urinishlari</h1>
      <div class="card">
        ${
          data.attempts.length
            ? `<table>
          <thead><tr><th>Dars / bo‘lim</th><th>Natija</th><th>Vaqt</th><th></th></tr></thead>
          <tbody>
            ${data.attempts
              .map(
                (a) => `<tr>
                  <td>${esc(a.blockTitle)}<div class="muted">${esc(a.lessonTitle)}</div></td>
                  <td>${a.isCorrect === null ? '—' : a.isCorrect ? '<span class="badge ok">to‘g‘ri</span>' : '<span class="badge err">noto‘g‘ri</span>'}</td>
                  <td class="muted">${esc(a.submittedAt ?? '')}</td>
                  <td><button class="btn ghost small" data-comment="${a.id}">Izoh</button></td>
                </tr>`,
              )
              .join('')}
          </tbody></table>`
            : empty('Hozircha urinishlar yo‘q')
        }
      </div>`;

    main()
      .querySelectorAll('[data-comment]')
      .forEach((btn) =>
        btn.addEventListener('click', async () => {
          const text = prompt('Izoh matni:');
          if (!text) return;
          try {
            await api(`/api/teacher/attempts/${btn.dataset.comment}/comment`, { method: 'POST', body: { body: text } });
            btn.textContent = 'Yuborildi';
            btn.disabled = true;
          } catch (err) {
            alert(err.message);
          }
        }),
      );
  } catch (err) {
    main().innerHTML = errorState(err, true);
  }
}

// ---------- Админ / методист ----------

async function viewAdmin() {
  main().className = 'wide';
  main().innerHTML = loading();
  try {
    const [tree, queue, assets, analytics] = await Promise.all([
      api('/api/admin/content/tree'),
      api('/api/admin/review-queue'),
      api('/api/admin/assets'),
      api('/api/admin/analytics').catch(() => null),
    ]);

    const rights = Object.fromEntries(assets.summary.map((s) => [s.rightsStatus, s.n]));

    main().innerHTML = `
      <h1>Kontent va boshqaruv</h1>

      <div class="grid cols-3">
        <div class="card stat"><div class="value">${queue.blocksNeedingReview.length}</div><div class="label">metodist tekshiruvini kutayotgan bo‘lim</div></div>
        <div class="card stat"><div class="value">${queue.assetsWithUnknownRights}</div><div class="label">huquqi tasdiqlanmagan media</div></div>
        <div class="card stat"><div class="value">${rights.cleared ?? 0}</div><div class="label">huquqi tasdiqlangan media</div></div>
      </div>

      <div class="card">
        <h2>Kurs versiyalari</h2>
        <table>
          <thead><tr><th>Versiya</th><th>Status</th><th>Darslar</th><th>Bo‘limlar</th><th>Tekshiruvda</th><th></th></tr></thead>
          <tbody>
            ${tree.versions
              .map(
                (v) => `<tr>
                <td>v${v.version}</td>
                <td><span class="badge ${v.status === 'published' ? 'ok' : v.status === 'archived' ? '' : 'warn'}">${esc(v.status)}</span></td>
                <td>${v.lessons}</td><td>${v.blocks}</td><td>${v.needsReview}</td>
                <td class="row">
                  <button class="btn ghost small" data-clone="${v.id}">Nusxa (qoralama)</button>
                  ${v.status === 'draft' ? `<button class="btn ghost small" data-status="review" data-id="${v.id}">Review’ga</button>` : ''}
                  ${v.status === 'review' ? `<button class="btn ghost small" data-status="published" data-id="${v.id}">Nashr etish</button>` : ''}
                </td>
              </tr>`,
              )
              .join('')}
          </tbody>
        </table>
        <p class="muted" style="margin-top:8px">Nashr atomik: eski versiya arxivga o‘tadi, eski urinishlar o‘z versiyasida qoladi.</p>
      </div>

      <div class="card">
        <h2>Metodist navbati</h2>
        <div class="banner warn">${esc(queue.note)}</div>
        <table>
          <thead><tr><th>Bo‘lim</th><th>Dars</th><th>Slayd</th><th>Izoh</th></tr></thead>
          <tbody>
            ${queue.blocksNeedingReview
              .slice(0, 30)
              .map(
                (b) => `<tr>
                  <td>${esc(b.title)}<div class="muted">${esc(typeLabel(b.type))}</div></td>
                  <td>${esc(b.lesson)}</td><td>${b.sourceSlide ?? '—'}</td>
                  <td class="muted">${esc(b.reviewNote ?? '')}</td>
                </tr>`,
              )
              .join('')}
          </tbody>
        </table>
      </div>

      <div class="card">
        <h2>Media kutubxonasi</h2>
        <p class="muted">Jami ${assets.assets.length} fayl. Huquqi tasdiqlanmagan fayllar nashrga chiqmaydi.</p>
        <table>
          <thead><tr><th>Fayl</th><th>Tur</th><th>Hajm</th><th>Huquq</th><th></th></tr></thead>
          <tbody>
            ${assets.assets
              .slice(0, 40)
              .map(
                (a) => `<tr>
                  <td class="mono">${esc(a.file)}</td>
                  <td>${esc(a.kind)}</td>
                  <td>${(a.bytes / 1024).toFixed(0)} KB</td>
                  <td><span class="badge ${a.rightsStatus === 'cleared' ? 'ok' : a.rightsStatus === 'restricted' ? 'err' : 'warn'}">${esc(a.rightsStatus)}</span></td>
                  <td><button class="btn ghost small" data-clear-rights="${a.id}">Tasdiqlash</button></td>
                </tr>`,
              )
              .join('')}
          </tbody>
        </table>
        ${assets.assets.length > 40 ? '<p class="muted">Ro‘yxatning birinchi 40 tasi ko‘rsatildi.</p>' : ''}
      </div>

      ${
        analytics
          ? `<div class="card">
              <h2>Analitika</h2>
              <p class="muted">${esc(analytics.retentionPolicy)}</p>
              <table>
                <thead><tr><th>Eng qiyin bo‘limlar</th><th>Urinishlar</th><th>To‘g‘ri ulushi</th></tr></thead>
                <tbody>
                  ${analytics.hardestBlocks
                    .map(
                      (b) => `<tr><td>${esc(b.title)}</td><td>${b.attempts}</td><td>${Math.round((b.correctRate ?? 0) * 100)}%</td></tr>`,
                    )
                    .join('') || '<tr><td colspan="3" class="muted">Hozircha ma’lumot yo‘q</td></tr>'}
                </tbody>
              </table>
            </div>`
          : ''
      }

      ${state.user.role === 'admin' ? '<div class="card"><h2>Audit jurnali</h2><div id="audit">' + loading() + '</div></div>' : ''}`;

    wireAdminActions();
    if (state.user.role === 'admin') loadAudit();
  } catch (err) {
    main().innerHTML = errorState(err, true);
  }
}

function wireAdminActions() {
  main()
    .querySelectorAll('[data-clone]')
    .forEach((b) =>
      b.addEventListener('click', async () => {
        try {
          await api(`/api/admin/versions/${b.dataset.clone}/clone`, { method: 'POST', body: {} });
          viewAdmin();
        } catch (err) {
          alert(err.message);
        }
      }),
    );
  main()
    .querySelectorAll('[data-status]')
    .forEach((b) =>
      b.addEventListener('click', async () => {
        try {
          await api(`/api/admin/versions/${b.dataset.id}/status`, { method: 'POST', body: { status: b.dataset.status } });
          viewAdmin();
        } catch (err) {
          alert(err.message);
        }
      }),
    );
  main()
    .querySelectorAll('[data-clear-rights]')
    .forEach((b) =>
      b.addEventListener('click', async () => {
        const note = prompt('Huquq manbasi (kim tasdiqladi, qanday litsenziya):');
        if (!note) return;
        try {
          await api(`/api/admin/assets/${b.dataset.clearRights}`, {
            method: 'PATCH',
            body: { rightsStatus: 'cleared', rightsNote: note },
          });
          viewAdmin();
        } catch (err) {
          alert(err.message);
        }
      }),
    );
}

async function loadAudit() {
  try {
    const { entries } = await api('/api/admin/audit');
    $('#audit').innerHTML = `<table>
      <thead><tr><th>Vaqt</th><th>Kim</th><th>Amal</th><th>Obyekt</th></tr></thead>
      <tbody>${entries
        .slice(0, 50)
        .map(
          (e) => `<tr><td class="muted mono">${esc(e.createdAt)}</td><td>${esc(e.actor ?? 'tizim')}</td>
            <td class="mono">${esc(e.action)}</td><td class="muted">${esc(e.entity ?? '')} ${esc(e.entityId ?? '')}</td></tr>`,
        )
        .join('')}</tbody></table>`;
  } catch (err) {
    $('#audit').innerHTML = `<div class="banner err">${esc(err.message)}</div>`;
  }
}

// ---------- Роутер ----------

async function route(force = false) {
  const hash = location.hash || '#/course';
  main().className = '';

  if (!state.user) {
    viewLogin();
    return;
  }
  renderTopbar();

  const m = (re) => re.exec(hash);
  let match;

  if (hash.startsWith('#/course')) await viewCourse();
  else if ((match = m(/^#\/block\/([a-f0-9]{24})$/))) await viewBlock(match[1]);
  else if (hash.startsWith('#/progress')) await viewProgress();
  else if ((match = m(/^#\/teacher\/class\/([a-f0-9]{24})$/))) await viewTeacherClass(match[1]);
  else if ((match = m(/^#\/teacher\/student\/([a-f0-9]{24})$/))) await viewTeacherStudent(match[1]);
  else if (hash.startsWith('#/teacher')) await viewTeacher();
  else if (hash.startsWith('#/admin')) await viewAdmin();
  else location.hash = '#/course';

  if (force) main().focus();
}

document.addEventListener('click', async (e) => {
  const btn = e.target.closest('[data-action]');
  if (!btn) return;
  if (btn.dataset.action === 'logout') {
    await api('/api/auth/logout', { method: 'POST', body: { refreshToken: getRefreshToken() } }).catch(() => {});
    state.user = null;
    state.accessToken = null;
    setRefreshToken(null);
    location.hash = '#/';
    route();
  }
  if (btn.dataset.action === 'retry') route(true);
});

window.addEventListener('hashchange', () => route());

// ---------- Старт ----------

(async function init() {
  renderOfflinePill();
  // Sahifa yangilanganda access token xotiradan yo'qoladi — refresh token orqali tiklaymiz
  const ok = await tryRefresh();
  if (ok) {
    try {
      const data = await api('/api/auth/me');
      state.user = data.user;
    } catch {
      state.user = null;
    }
  }
  flushOutbox();
  route();

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  }
})();
