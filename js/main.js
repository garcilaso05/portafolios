/* =========================================================
   PCB CANVAS
   ========================================================= */
(function() {
  const canvas = document.getElementById('pcb-canvas');
  const ctx = canvas?.getContext('2d');
  if (!canvas || !ctx) return;

  let W;
  let H;
  let nodes = [];

  function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  function init() {
    resize();
    const count = Math.min(Math.floor((W * H) / 14000), 80);
    nodes = [];
    for (let i = 0; i < count; i++) {
      nodes.push({
        x: Math.random() * W,
        y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.15,
        vy: (Math.random() - 0.5) * 0.15,
        r: Math.random() * 1.8 + 0.8,
        pulse: Math.random() * Math.PI * 2,
      });
    }
  }

  let mouseX = -999;
  let mouseY = -999;
  window.addEventListener('mousemove', e => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });

  function draw() {
    ctx.clearRect(0, 0, W, H);

    for (const n of nodes) {
      n.x += n.vx;
      n.y += n.vy;
      if (n.x < 0) n.x = W;
      if (n.x > W) n.x = 0;
      if (n.y < 0) n.y = H;
      if (n.y > H) n.y = 0;
      n.pulse += 0.02;
    }

    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i];
        const b = nodes[j];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 180) continue;

        const mdx = mouseX - a.x;
        const mdy = mouseY - a.y;
        const hover = Math.sqrt(mdx * mdx + mdy * mdy) < 200;

        const alpha = (1 - dist / 180) * (hover ? 0.55 : 0.18);
        ctx.strokeStyle = hover ? `rgba(0,200,255,${alpha})` : `rgba(0,140,200,${alpha})`;
        ctx.lineWidth = hover ? 0.8 : 0.5;

        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        if (Math.abs(dx) > Math.abs(dy)) {
          ctx.lineTo(a.x + dx * 0.5, a.y);
          ctx.lineTo(b.x, b.y);
        } else {
          ctx.lineTo(a.x, a.y + dy * 0.5);
          ctx.lineTo(b.x, b.y);
        }
        ctx.stroke();

        if (hover && dist < 100) {
          ctx.beginPath();
          ctx.arc(a.x + dx * 0.5, a.y + (Math.abs(dx) > Math.abs(dy) ? 0 : dy * 0.5), 1.5, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(0,200,255,${alpha * 1.5})`;
          ctx.fill();
        }
      }
    }

    for (const n of nodes) {
      const mdx = mouseX - n.x;
      const mdy = mouseY - n.y;
      const hover = Math.sqrt(mdx * mdx + mdy * mdy) < 160;
      const glow = hover ? 0.9 : 0.4 + Math.sin(n.pulse) * 0.15;

      ctx.beginPath();
      ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(0,200,255,${glow})`;
      ctx.fill();

      if (hover) {
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r + 3, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(0,200,255,0.3)';
        ctx.lineWidth = 0.8;
        ctx.stroke();
      }
    }

    requestAnimationFrame(draw);
  }

  window.addEventListener('resize', init);
  init();
  draw();
})();

/* =========================================================
   I18N STATE
   ========================================================= */
const SUPPORTED_LANGS = ['es', 'en', 'ca'];
const DEFAULT_LANG = 'es';

const i18nState = {
  lang: DEFAULT_LANG,
  messages: {},
  reposLoaded: false,
  reposCache: null,
  featuredConfigCache: null,
};

const GLITCH_PRE_MS = 90;
const GLITCH_POST_MS = 130;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function getGlitchTargets() {
  return document.querySelectorAll(
    'header .logo-text, header nav a, .section-title-text, .section-tag, .bio-text p, .bio-text h1, .bio-stat, .social-item span, .bc-title, .bc-body, .tl-institution, .tl-period, .tl-degree, .tl-desc, .chip, .tl-stat, .tl-badge, .tl-btn, .job-name, .job-field .label, .job-field .value, .job-tag, .cv-btn, .recog-category, .recog-title, .recog-item, .recog-btn, .repos-status-bar, .repos-section-header, .fc-name, .fc-desc, .fc-btn, .rm-name, .rm-desc, .rm-btn, .term-title, .term-line, .term-prompt, .term-run-btn, .term-qb, footer'
  );
}

function startGlitchTransition() {
  document.body.classList.add('lang-glitching');
  getGlitchTargets().forEach(el => el.classList.add('glitch-anim'));
}

function endGlitchTransition() {
  getGlitchTargets().forEach(el => el.classList.remove('glitch-anim'));
  document.body.classList.remove('lang-glitching');
}

function getByPath(obj, path) {
  return path.split('.').reduce((acc, key) => {
    if (acc && Object.prototype.hasOwnProperty.call(acc, key)) return acc[key];
    return undefined;
  }, obj);
}

function t(key, fallback = '') {
  const value = getByPath(i18nState.messages, key);
  return typeof value === 'string' ? value : fallback;
}

function tArray(key, fallback = []) {
  const value = getByPath(i18nState.messages, key);
  return Array.isArray(value) ? value : fallback;
}

function tObj(key, fallback = {}) {
  const value = getByPath(i18nState.messages, key);
  return value && typeof value === 'object' && !Array.isArray(value) ? value : fallback;
}

function formatI18n(template, vars = {}) {
  return template.replace(/\{(\w+)\}/g, (_, name) => (vars[name] ?? `{${name}}`));
}

async function loadLocale(lang) {
  const response = await fetch(`i18n/${lang}.json`);
  if (!response.ok) throw new Error(`Cannot load i18n/${lang}.json`);
  return response.json();
}

function pickInitialLanguage() {
  const fromStorage = localStorage.getItem('portfolio_lang');
  if (fromStorage && SUPPORTED_LANGS.includes(fromStorage)) return fromStorage;

  const browserLang = (navigator.language || '').slice(0, 2).toLowerCase();
  if (SUPPORTED_LANGS.includes(browserLang)) return browserLang;

  return DEFAULT_LANG;
}

function setTextContent(selector, value) {
  const el = document.querySelector(selector);
  if (el && value !== undefined) el.textContent = value;
}

function setHTML(selector, value) {
  const el = document.querySelector(selector);
  if (el && value !== undefined) el.innerHTML = value;
}

function setAttribute(selector, attr, value) {
  const el = document.querySelector(selector);
  if (el && value !== undefined) el.setAttribute(attr, value);
}

function setNodeListText(selector, values = []) {
  const nodes = document.querySelectorAll(selector);
  nodes.forEach((node, i) => {
    if (values[i] !== undefined) node.textContent = values[i];
  });
}

function setLinkTextPreservingIcon(anchor, text) {
  if (!anchor || text === undefined) return;
  const icon = anchor.querySelector('svg');
  anchor.textContent = '';
  if (icon) {
    anchor.appendChild(icon);
    anchor.appendChild(document.createTextNode(` ${text}`));
  } else {
    anchor.textContent = text;
  }
}

/* =========================================================
   NAVIGATION
   ========================================================= */
const views = {
  bio: document.getElementById('view-bio'),
  studies: document.getElementById('view-studies'),
  experience: document.getElementById('view-experience'),
  recognitions: document.getElementById('view-recognitions'),
  repos: document.getElementById('view-repos'),
  terminal: document.getElementById('view-terminal'),
};

let activeRoute = 'bio';

function navigate(route) {
  if (!views[route] || route === activeRoute) return;
  views[activeRoute]?.classList.remove('active');
  activeRoute = route;
  views[route]?.classList.add('active');

  document.querySelectorAll('nav a').forEach(a => {
    a.classList.toggle('active', a.dataset.route === route);
  });

  if (route === 'repos' && !i18nState.reposLoaded) loadRepos();
}

document.querySelectorAll('nav a').forEach(a => {
  a.addEventListener('click', e => {
    e.preventDefault();
    navigate(a.dataset.route);
  });
});

/* =========================================================
   CAROUSELS
   ========================================================= */
function startCarousel(containerId, intervalMs = 3200) {
  const el = document.getElementById(containerId);
  if (!el) return;
  const imgs = el.querySelectorAll('img');
  if (imgs.length < 2) return;

  let idx = 0;
  setInterval(() => {
    imgs[idx].classList.remove('active');
    idx = (idx + 1) % imgs.length;
    imgs[idx].classList.add('active');
  }, intervalMs);
}

['c-rdt', 'c-musica', 'c-mar', 'c-urv', 'c-vela', 'c-eco', 'c-insti', 'c-concurso', 'c-tdr', 'c-univ'].forEach(id => startCarousel(id));

/* =========================================================
   GITHUB REPOS
   ========================================================= */
const GITHUB_USER = 'garcilaso05';

async function loadFeaturedReposConfig() {
  if (i18nState.featuredConfigCache) return i18nState.featuredConfigCache;

  try {
    const res = await fetch('featured-repos.json');
    if (!res.ok) throw new Error('featured-repos.json not found');
    const config = await res.json();
    i18nState.featuredConfigCache = Array.isArray(config) ? config : [];
  } catch (_err) {
    i18nState.featuredConfigCache = [];
  }

  return i18nState.featuredConfigCache;
}

function setReposStatusConnecting() {
  const status = t('repos.status.connecting', 'Conectando con api.github.com...');
  setTextContent('#repos-status-text', status);
}

function renderRepos(repos, featuredConfig = []) {
  const statusTemplate = t('repos.status.loaded', '{count} repositorios encontrados - github.com/{user}');
  setTextContent('#repos-status-text', formatI18n(statusTemplate, { count: repos.length, user: GITHUB_USER }));

  const reposByName = new Map(repos.map(repo => [repo.name.toLowerCase(), repo]));
  const sortedFeaturedConfig = [...featuredConfig].sort((a, b) => (a.position ?? 9999) - (b.position ?? 9999));

  const featured = sortedFeaturedConfig.map(entry => {
    const repoName = typeof entry.repo === 'string' ? entry.repo : '';
    const repoData = reposByName.get(repoName.toLowerCase()) || null;
    return { entry, repoData };
  });

  const featuredNames = new Set(
    sortedFeaturedConfig
      .map(entry => (typeof entry.repo === 'string' ? entry.repo.toLowerCase() : ''))
      .filter(Boolean)
  );

  const others = repos.filter(r => !featuredNames.has(r.name.toLowerCase()));

  const noDescription = t('repos.noDescription', 'Sin descripcion');
  const githubLabel = t('repos.cta.github', 'GitHub');
  const demoLabel = t('repos.cta.demo', 'Demo');
  const extraLabel = t('repos.cta.extra', 'Enlace');

  const featuredGrid = document.getElementById('featured-repos-grid');
  if (featuredGrid) {
    featuredGrid.innerHTML = '';

    featured.forEach(({ entry, repoData }) => {
      const repoName = entry.customTitle || entry.repo || repoData?.name || 'Repository';
      const repoDescription = entry.customDescription || repoData?.description || noDescription;
      const repoLink = repoData?.html_url || `https://github.com/${GITHUB_USER}/${entry.repo}`;
      const imagePath = entry.image || '';

      const extraLinks = Array.isArray(entry.extraLinks) ? entry.extraLinks : [];
      const renderedExtraLinks = extraLinks.map((link, idx) => {
        if (typeof link === 'string') {
          return `<a href="${link}" target="_blank" class="fc-btn" rel="noopener noreferrer">${extraLabel} ${idx + 1}</a>`;
        }

        if (link && typeof link === 'object' && link.url) {
          return `<a href="${link.url}" target="_blank" class="fc-btn" rel="noopener noreferrer">${link.label || `${extraLabel} ${idx + 1}`}</a>`;
        }

        return '';
      }).join('');

      const card = document.createElement('div');
      card.className = 'featured-card';
      card.innerHTML = `
        <div class="fc-img">
          ${imagePath
            ? `<img src="${imagePath}" alt="${repoName}" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">`
            : ''}
          <div class="fc-img-placeholder" style="display:${imagePath ? 'none' : 'flex'};">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" width="32" height="32" opacity="0.3"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/></svg>
            <span style="font-size:10px;letter-spacing:0.08em">${repoName}</span>
          </div>
        </div>
        <div class="fc-body">
          <div class="fc-name">${repoName}</div>
          <p class="fc-desc">${repoDescription}</p>
          <div class="fc-actions">
            <a href="${repoLink}" target="_blank" class="fc-btn" rel="noopener noreferrer">
              <svg viewBox="0 0 16 16" fill="currentColor" width="12" height="12"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8z"/></svg>
              ${githubLabel}
            </a>
            ${repoData?.homepage ? `<a href="${repoData.homepage}" target="_blank" class="fc-btn" rel="noopener noreferrer">${demoLabel}</a>` : ''}
            ${renderedExtraLinks}
          </div>
        </div>`;
      featuredGrid.appendChild(card);
    });
  }

  const allGrid = document.getElementById('all-repos-grid');
  if (allGrid) {
    allGrid.innerHTML = '';

    others.forEach(r => {
      const card = document.createElement('div');
      card.className = 'repo-mini';
      card.innerHTML = `
        <div class="rm-name">${r.name}</div>
        <p class="rm-desc">${r.description || noDescription}</p>
        <div class="rm-actions">
          <a href="${r.html_url}" target="_blank" class="rm-btn" rel="noopener noreferrer">
            <svg viewBox="0 0 16 16" fill="currentColor" width="10" height="10"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8z"/></svg>
            ${githubLabel}
          </a>
          ${r.homepage ? `<a href="${r.homepage}" target="_blank" class="rm-btn" rel="noopener noreferrer">${demoLabel}</a>` : ''}
        </div>`;
      allGrid.appendChild(card);
    });
  }
}

async function loadRepos() {
  i18nState.reposLoaded = true;
  setReposStatusConnecting();

  if (i18nState.reposCache) {
    const featuredConfig = await loadFeaturedReposConfig();
    renderRepos(i18nState.reposCache, featuredConfig);
    return;
  }

  try {
    const [res, featuredConfig] = await Promise.all([
      fetch(`https://api.github.com/users/${GITHUB_USER}/repos?per_page=100&sort=updated`),
      loadFeaturedReposConfig(),
    ]);
    if (!res.ok) throw new Error('API error');

    const repos = await res.json();
    i18nState.reposCache = repos;
    renderRepos(repos, featuredConfig);
  } catch (_err) {
    const errorText = t('repos.status.error', 'Error al conectar con GitHub API.');
    setTextContent('#repos-status-text', errorText);

    const fallback = t('repos.errorFallback', 'No se pudieron cargar los repositorios. Visita github.com/{user}');
    const html = `<div style="font-family:var(--mono);font-size:12px;color:var(--red);padding:20px;">${formatI18n(fallback, { user: GITHUB_USER })} <a href="https://github.com/${GITHUB_USER}" target="_blank" style="color:var(--cyan)">github.com/${GITHUB_USER}</a></div>`;
    setHTML('#featured-repos-grid', html);
  }
}

/* =========================================================
   TERMINAL
   ========================================================= */
const termOutput = document.getElementById('term-output');
const termInput = document.getElementById('term-input');
const termRun = document.getElementById('term-run');

function getTerminalDB() {
  return tObj('terminal.db', {});
}

function renderTerminalIntro() {
  if (!termOutput) return;
  termOutput.innerHTML = '';

  const introLine = document.createElement('div');
  introLine.className = 'term-line out-green';
  const intro = t('terminal.intro', "Sistema inicializado. Escribe <span style='color:var(--cyan)'>'help'</span> para ver los comandos disponibles.");
  introLine.innerHTML = intro;
  termOutput.appendChild(introLine);

  const br = document.createElement('div');
  br.className = 'term-line';
  br.innerHTML = '&nbsp;';
  termOutput.appendChild(br);
}

function termWrite(cmd) {
  if (!termOutput) return;

  const cmdLine = document.createElement('div');
  cmdLine.className = 'term-line cmd';
  cmdLine.textContent = cmd;
  termOutput.appendChild(cmdLine);

  const normalized = cmd.trim().toLowerCase();
  if (normalized === 'clear') {
    termOutput.innerHTML = '';
    return;
  }

  const db = getTerminalDB();
  const data = db[normalized];

  if (Array.isArray(data)) {
    data.forEach((line, i) => {
      setTimeout(() => {
        const div = document.createElement('div');
        div.className = `term-line ${line.cls || ''}`.trim();
        div.textContent = line.t;
        termOutput.appendChild(div);
        termOutput.scrollTop = termOutput.scrollHeight;
      }, i * 30);
    });

    setTimeout(() => {
      const br = document.createElement('div');
      br.className = 'term-line';
      br.innerHTML = '&nbsp;';
      termOutput.appendChild(br);
    }, data.length * 30 + 50);
  } else {
    const err = document.createElement('div');
    err.className = 'term-line out-red';
    err.textContent = formatI18n(t('terminal.errors.commandNotFound', "comando no encontrado: {cmd} - escribe 'help' para ayuda"), {
      cmd: normalized,
    });
    termOutput.appendChild(err);

    const br = document.createElement('div');
    br.className = 'term-line';
    br.innerHTML = '&nbsp;';
    termOutput.appendChild(br);
  }

  termOutput.scrollTop = termOutput.scrollHeight;
}

termRun?.addEventListener('click', () => {
  const value = termInput?.value.trim();
  if (!value) return;
  termWrite(value);
  termInput.value = '';
});

termInput?.addEventListener('keydown', e => {
  if (e.key !== 'Enter') return;
  const value = termInput.value.trim();
  if (!value) return;
  termWrite(value);
  termInput.value = '';
});

document.querySelectorAll('.term-qb').forEach(btn => {
  btn.addEventListener('click', () => termWrite(btn.dataset.cmd || ''));
});

/* =========================================================
   TRANSLATION APPLIERS
   ========================================================= */
function applyHeaderTranslations() {
  document.title = t('meta.title', 'Roger Garcia Doncel - Ingeniero Informatico');

  const langTitle = t('header.langSelectorTitle', 'Seleccionar idioma');
  setAttribute('#lang-select', 'title', langTitle);
  setAttribute('#lang-select', 'aria-label', langTitle);

  const select = document.getElementById('lang-select');
  if (select) {
    const options = {
      es: t('languages.es', 'Espanol'),
      en: t('languages.en', 'English'),
      ca: t('languages.ca', 'Catala'),
    };
    Object.entries(options).forEach(([value, label]) => {
      const option = select.querySelector(`option[value="${value}"]`);
      if (option) option.textContent = label;
    });
  }

  setTextContent('nav a[data-route="bio"]', t('nav.bio', './bio'));
  setTextContent('nav a[data-route="studies"]', t('nav.studies', './estudios'));
  setTextContent('nav a[data-route="experience"]', t('nav.experience', './experiencia'));
  setTextContent('nav a[data-route="recognitions"]', t('nav.recognitions', './reconocimientos'));
  setTextContent('nav a[data-route="repos"]', t('nav.repos', './repositorios'));
  setTextContent('nav a[data-route="terminal"]', t('nav.terminal', './terminal'));

  setNodeListText('.section-title-text', [
    t('sections.bio', 'PERFIL_USUARIO'),
    t('sections.studies', 'TRAYECTORIA_ACADEMICA'),
    t('sections.experience', 'EXPERIENCIA_LABORAL'),
    t('sections.recognitions', 'RECONOCIMIENTOS'),
    t('sections.repos', 'REPOSITORIOS_GITHUB'),
    t('sections.terminal', 'TERMINAL_INTERACTIVA'),
  ]);
}

function applyBioTranslations() {
  const bio = tObj('bio');

  setAttribute('.bio-photo-wrap img', 'alt', bio.photoAlt);
  const badgeEls = document.querySelectorAll('.bio-badge-row .hw-badge');
  badgeEls.forEach((badge, i) => {
    if (bio.badges?.[i] === undefined) return;
    const icon = badge.querySelector('svg');
    if (icon) {
      badge.textContent = '';
      badge.appendChild(icon);
      badge.appendChild(document.createTextNode(` ${bio.badges[i]}`));
    } else {
      badge.textContent = bio.badges[i];
    }
  });
  setTextContent('.bio-greeting', bio.greeting);
  setHTML('.bio-name', bio.nameHtml);
  setTextContent('.bio-role', bio.role);

  const bioStats = bio.stats || [];
  const statValues = [];
  const statLabels = [];
  bioStats.forEach(s => {
    statValues.push(s.value);
    statLabels.push(s.label);
  });
  setNodeListText('.bio-stats-row .bio-stat .val', statValues);
  setNodeListText('.bio-stats-row .bio-stat .lbl', statLabels);

  setNodeListText('.social-grid .social-item span', bio.social || []);

  const cards = bio.cards || [];
  const cardEls = document.querySelectorAll('.bio-card-new');
  cardEls.forEach((card, i) => {
    const data = cards[i];
    if (!data) return;
    const title = card.querySelector('.bc-title');
    const body = card.querySelector('.bc-body');
    if (title) title.textContent = data.title;
    if (body) body.innerHTML = data.bodyHtml;
  });

  setAttribute('.philosophy-gif', 'alt', bio.memeAlt);
  const quoteEl = document.querySelector('.philosophy-block blockquote');
  if (quoteEl && bio.quote !== undefined) {
    const quoteTextNode = Array.from(quoteEl.childNodes).find(node => node.nodeType === Node.TEXT_NODE && node.textContent.trim().length > 0);
    if (quoteTextNode) {
      quoteTextNode.textContent = `\n          ${bio.quote}\n          `;
    }
  }
  setTextContent('.philosophy-block cite', bio.quoteAuthor);
}

function applyStudiesTranslations() {
  const studies = tArray('studies.items', []);
  const cards = document.querySelectorAll('#view-studies .tl-item');

  cards.forEach((card, index) => {
    const data = studies[index];
    if (!data) return;

    const institution = card.querySelector('.tl-institution');
    const period = card.querySelector('.tl-period');
    const degree = card.querySelector('.tl-degree');
    const desc = card.querySelector('.tl-desc');

    if (institution) institution.textContent = data.institution;
    if (period) period.textContent = data.period;
    if (degree) degree.textContent = data.degree;
    if (desc) desc.textContent = data.description;

    const chips = card.querySelectorAll('.chip');
    chips.forEach((chip, i) => {
      if (data.chips?.[i] !== undefined) chip.textContent = data.chips[i];
    });

    const statValues = card.querySelectorAll('.tl-stat .v');
    const statLabels = card.querySelectorAll('.tl-stat .l');
    statValues.forEach((el, i) => {
      if (data.stats?.[i]?.value !== undefined) el.textContent = data.stats[i].value;
    });
    statLabels.forEach((el, i) => {
      if (data.stats?.[i]?.label !== undefined) el.textContent = data.stats[i].label;
    });

    const badges = card.querySelectorAll('.tl-badge');
    badges.forEach((badge, i) => {
      if (data.badges?.[i] !== undefined) badge.textContent = data.badges[i];
    });

    const actions = card.querySelectorAll('.tl-actions .tl-btn');
    actions.forEach((a, i) => {
      if (data.actions?.[i] !== undefined) setLinkTextPreservingIcon(a, data.actions[i]);
    });
  });
}

function applyExperienceTranslations() {
  const exp = tObj('experience');
  const jobs = exp.jobs || [];
  const cards = document.querySelectorAll('#view-experience .job-card');

  cards.forEach((card, index) => {
    const data = jobs[index];
    if (!data) return;

    const jobName = card.querySelector('.job-name');
    if (jobName) jobName.textContent = data.name;

    const labels = card.querySelectorAll('.job-field .label');
    labels.forEach((label, i) => {
      if (data.fields?.[i]?.label !== undefined) label.textContent = data.fields[i].label;
    });

    const values = card.querySelectorAll('.job-field .value');
    values.forEach((value, i) => {
      const field = data.fields?.[i];
      if (!field) return;

      if (field.links) {
        const anchors = value.querySelectorAll('a');
        anchors.forEach((a, linkIndex) => {
          if (field.links[linkIndex]) a.textContent = field.links[linkIndex];
        });
      } else if (field.value !== undefined) {
        value.textContent = field.value;
      }
    });

    const tags = card.querySelectorAll('.job-tags .job-tag');
    tags.forEach((tag, i) => {
      if (data.tags?.[i] !== undefined) tag.textContent = data.tags[i];
    });
  });

  setLinkTextPreservingIcon(document.querySelector('.cv-btn'), exp.cvButton);
}

function applyRecognitionsTranslations() {
  const recognitions = tArray('recognitions.cards', []);
  const cards = document.querySelectorAll('#view-recognitions .recog-card');

  cards.forEach((card, index) => {
    const data = recognitions[index];
    if (!data) return;

    const category = card.querySelector('.recog-category');
    const title = card.querySelector('.recog-title');
    if (category) category.textContent = data.category;
    if (title) title.textContent = data.title;

    const items = card.querySelectorAll('.recog-item');
    items.forEach((item, i) => {
      if (data.items?.[i] !== undefined) item.textContent = data.items[i];
    });

    const actions = card.querySelectorAll('.recog-actions .recog-btn');
    actions.forEach((action, i) => {
      if (data.actions?.[i] !== undefined) setLinkTextPreservingIcon(action, data.actions[i]);
    });
  });
}

function applyReposTranslations() {
  setTextContent('#repos-status-text', t('repos.status.connecting', 'Conectando con api.github.com...'));
  setTextContent('#view-repos .featured-section .repos-section-header', t('repos.featuredTitle', 'PROYECTOS_DESTACADOS'));
  setTextContent('#view-repos .all-section .repos-section-header', t('repos.allTitle', 'TODOS_LOS_REPOSITORIOS'));
  setTextContent('#repos-loader', t('repos.loading', 'Cargando repositorios...'));

  if (i18nState.reposCache) {
    renderRepos(i18nState.reposCache);
  }
}

function applyTerminalTranslations() {
  setTextContent('.term-title', t('terminal.topbarTitle', 'roger@portfolio:~$'));
  setTextContent('.term-prompt', t('terminal.prompt', 'roger@portfolio:~$'));
  setAttribute('#term-input', 'placeholder', t('terminal.inputPlaceholder', 'escribe un comando...'));
  setTextContent('#term-run', t('terminal.exec', 'EXEC'));

  const quickButtons = tArray('terminal.quickButtons', []);
  setNodeListText('.term-qb', quickButtons);

  renderTerminalIntro();
}

function applyFooterTranslations() {
  setTextContent('footer span', t('footer.prefix', 'roger@portfolio:~$ echo'));
  const footerNode = document.querySelector('footer');
  if (!footerNode) return;

  const suffix = t('footer.suffix', '"© 2024 Roger Garcia Doncel - Todos los derechos reservados"');
  const span = footerNode.querySelector('span');
  if (span) {
    footerNode.childNodes.forEach(node => {
      if (node !== span) footerNode.removeChild(node);
    });
    footerNode.appendChild(document.createTextNode(` ${suffix}`));
  }
}

function applyAllTranslations() {
  document.documentElement.lang = i18nState.lang;

  applyHeaderTranslations();
  applyBioTranslations();
  applyStudiesTranslations();
  applyExperienceTranslations();
  applyRecognitionsTranslations();
  applyReposTranslations();
  applyTerminalTranslations();
  applyFooterTranslations();
}

/* =========================================================
   BOOT SEQUENCE
   ========================================================= */
function startBootSequence() {
  const bootEl = document.getElementById('boot-screen');
  const linesEl = document.getElementById('boot-lines');
  const fill = document.getElementById('boot-fill');
  const pctEl = document.getElementById('boot-pct');
  const site = document.getElementById('site');

  if (!bootEl || !linesEl || !fill || !pctEl || !site) return;

  const lines = tArray('boot.lines', [
    'BIOS v2.04 - Roger Garcia System',
    'Initializing hardware components......',
    'Loading kernel modules......',
    'Mounting filesystem [/dev/portfolio]...',
    'Checking memory integrity [8192MB OK]...',
    'Loading user profile [garcia_doncel]...',
    'Starting network services......',
    'Importing knowledge base [CS - Music - Nautical]...',
    'Configuring GUI renderer......',
    'User initialized. Welcome.',
  ]);

  linesEl.innerHTML = '';
  let pct = 0;

  lines.forEach((text, i) => {
    setTimeout(() => {
      const div = document.createElement('div');
      const cls = i === 0 ? 'info' : i === lines.length - 1 ? 'out-green' : 'ok';
      div.className = `boot-line ${cls}`;
      div.textContent = text;
      div.style.animationDuration = `${Math.max(0.3, text.length * 0.025)}s`;
      linesEl.appendChild(div);

      pct = Math.round(((i + 1) / lines.length) * 100);
      fill.style.width = `${pct}%`;
      pctEl.textContent = `${pct}%`;
    }, 200 + i * 130);
  });

  setTimeout(() => {
    bootEl.classList.add('hide');
    setTimeout(() => {
      bootEl.style.display = 'none';
      site.classList.add('visible');
    }, 650);
  }, 1900);
}

/* =========================================================
   LANGUAGE SWITCHER
   ========================================================= */
async function setLanguage(lang, options = {}) {
  const safeLang = SUPPORTED_LANGS.includes(lang) ? lang : DEFAULT_LANG;
  const withGlitch = options.withGlitch ?? true;

  try {
    if (withGlitch) {
      startGlitchTransition();
      await sleep(GLITCH_PRE_MS);
    }

    i18nState.messages = await loadLocale(safeLang);
    i18nState.lang = safeLang;

    if (!options.skipPersist) {
      localStorage.setItem('portfolio_lang', safeLang);
    }

    const selector = document.getElementById('lang-select');
    if (selector) selector.value = safeLang;

    applyAllTranslations();

    if (withGlitch) {
      await sleep(GLITCH_POST_MS);
      endGlitchTransition();
    }
  } catch (_err) {
    if (withGlitch) {
      endGlitchTransition();
    }

    if (safeLang !== DEFAULT_LANG) {
      await setLanguage(DEFAULT_LANG, options);
    }
  }
}

document.getElementById('lang-select')?.addEventListener('change', async e => {
  await setLanguage(e.target.value);
});

/* =========================================================
   TERMINAL NAV SHORTCUT
   ========================================================= */
document.querySelector('[data-route="terminal"]')?.addEventListener('click', () => {
  setTimeout(() => termInput?.focus(), 100);
});

/* =========================================================
   INIT
   ========================================================= */
(async function initApp() {
  await setLanguage(pickInitialLanguage(), { withGlitch: false });
  startBootSequence();
})();
