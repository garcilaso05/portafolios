document.addEventListener('DOMContentLoaded', () => {
  const menuLinks = document.querySelectorAll('nav a');
  const content = document.getElementById('content');

  // 0: ES, 1: EN, 2: CA
  let languageIndex = 0;
  const languages = ['es', 'en', 'ca'];
  const routes = ['bio', 'studies', 'experience', 'recognitions'];

  // Persist language and last route in URL hash and localStorage
  const getInitialState = () => {
    const hash = window.location.hash.replace('#', '');
    const params = new URLSearchParams(hash);
    const langParam = params.get('lang');
    const routeParam = params.get('route');

    const storedLang = localStorage.getItem('lang');
    const storedRoute = localStorage.getItem('route');

    const lang = langParam || storedLang || 'es';
    const route = routeParam || storedRoute || 'bio';

    languageIndex = Math.max(0, languages.indexOf(lang));
    return { lang, route };
  };

  const setHash = (lang, route) => {
    const params = new URLSearchParams();
    params.set('lang', lang);
    params.set('route', route);
    window.location.hash = params.toString();
  };

  const updateActiveMenu = (route) => {
    menuLinks.forEach(link => link.classList.remove('active'));
    const active = document.querySelector(`nav a[data-route="${route}"]`);
    if (active) active.classList.add('active');
  };

  const triggerTypewriter = () => {
    const typewriterTitle = content.querySelector('.typewriter');
    if (!typewriterTitle) return;
    typewriterTitle.style.animation = 'none';
    // Force reflow then restore
    void typewriterTitle.offsetWidth;
    typewriterTitle.style.animation = '';
  };

  const handleCarousels = () => {
    // Primary carousels
    document.querySelectorAll('.carousel').forEach(carousel => {
      const images = carousel.querySelectorAll('.carousel-image');
      if (!images.length) return;
      let currentIndex = 0;
      images[0].classList.add('active');
      setInterval(() => {
        images[currentIndex].classList.remove('active');
        currentIndex = (currentIndex + 1) % images.length;
        images[currentIndex].classList.add('active');
      }, 5000);
    });

    // Secondary/tall carousels
    document.querySelectorAll('.carousel2').forEach(carousel => {
      const images = carousel.querySelectorAll('.carousel2-image');
      if (!images.length) return;
      let currentIndex = 0;
      images[0].classList.add('active');
      setInterval(() => {
        images[currentIndex].classList.remove('active');
        currentIndex = (currentIndex + 1) % images.length;
        images[currentIndex].classList.add('active');
      }, 5000);
    });
  };

  const revealPhotos = () => {
    const photos = document.querySelectorAll('.photo-gallery img');
    photos.forEach(photo => {
      const rect = photo.getBoundingClientRect();
      if (rect.top < window.innerHeight - 100) {
        photo.classList.add('visible');
      }
    });
  };

  const translateLabels = () => {
    const labels = {
      es: ['Biografía', 'Estudios', 'Experiencia', 'Reconocimientos'],
      en: ['Biography', 'Studies', 'Work Experience', 'Recognitions'],
      ca: ['Biografia', 'Estudis', 'Experiència', 'Reconeixements']
    };
    const lang = languages[languageIndex];
    menuLinks.forEach((link, i) => {
      const route = link.dataset.route;
      const idx = Math.max(0, routes.indexOf(route));
      if (labels[lang] && labels[lang][idx]) link.textContent = labels[lang][idx];
    });
    // Update document language and translate button labels
    document.documentElement.lang = lang;
    translateButton.textContent = lang.toUpperCase();
    const btnTitles = {
      es: 'Cambiar idioma',
      en: 'Change language',
      ca: 'Canviar idioma'
    };
    const title = btnTitles[lang] || 'Change language';
    translateButton.setAttribute('aria-label', title);
    translateButton.setAttribute('title', title);
  };

  const loadRoute = async (route) => {
    const lang = languages[languageIndex];
    try {
      const res = await fetch(`pages/${lang}/${route}.html`, { cache: 'no-store' });
      if (!res.ok) throw new Error(`No se pudo cargar ${route} (${lang})`);
      const html = await res.text();
      content.innerHTML = html;
      triggerTypewriter();
      handleCarousels();
      revealPhotos();
      updateActiveMenu(route);
      localStorage.setItem('lang', lang);
      localStorage.setItem('route', route);
      setHash(lang, route);
    } catch (e) {
      content.innerHTML = `<p style="color:#f88">Error cargando contenido: ${e.message}</p>`;
      // Fallback: try ES bio
      if (route !== 'bio' || languages[languageIndex] !== 'es') {
        languageIndex = 0;
        loadRoute('bio');
      }
    }
  };

  // Menu navigation
  menuLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const route = link.dataset.route;
      loadRoute(route);
    });
  });

  // Translate button
  const translateButton = document.createElement('button');
  translateButton.id = 'translateButton';
  document.body.appendChild(translateButton);
  translateButton.addEventListener('click', () => {
    languageIndex = (languageIndex + 1) % languages.length;
    translateLabels();
    // Reload current route in new language
    const current = document.querySelector('nav a.active')?.dataset.route || 'bio';
    loadRoute(current);
  });

  // Init
  window.addEventListener('scroll', revealPhotos);
  const initial = getInitialState();
  translateLabels();
  loadRoute(initial.route);
});

// Legacy helpers kept in case future manual galleries are used
function nextImage(button) {
  const galleryContainer = button.parentElement.querySelector('.gallery-container');
  if (!galleryContainer) return;
  const images = galleryContainer.querySelectorAll('.gallery-image');
  if (!images.length) return;
  let activeIndex = Array.from(images).findIndex(image => image.classList.contains('active'));
  images[activeIndex].classList.remove('active');
  activeIndex = (activeIndex + 1) % images.length;
  images[activeIndex].classList.add('active');
}

function prevImage(button) {
  const galleryContainer = button.parentElement.querySelector('.gallery-container');
  if (!galleryContainer) return;
  const images = galleryContainer.querySelectorAll('.gallery-image');
  if (!images.length) return;
  let activeIndex = Array.from(images).findIndex(image => image.classList.contains('active'));
  images[activeIndex].classList.remove('active');
  activeIndex = (activeIndex - 1 + images.length) % images.length;
  images[activeIndex].classList.add('active');
}
