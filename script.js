document.addEventListener('DOMContentLoaded', () => {
  const menuLinks = document.querySelectorAll('nav a');
  const sections = document.querySelectorAll('.section');
  let languageIndex = 0; // 0: Spanish, 1: English, 2: Catalan

  const handleCarousels = () => {
    document.querySelectorAll('.carousel').forEach(carousel => {
      const images = carousel.querySelectorAll('.carousel-image');
      let currentIndex = 0;
    
      setInterval(() => {
        images[currentIndex].classList.remove('active');
        currentIndex = (currentIndex + 1) % images.length;
        images[currentIndex].classList.add('active');
      }, 5000);
    });
  };

  handleCarousels();

  const updateActiveMenu = (targetId) => {
    menuLinks.forEach(link => {
      link.classList.remove('active');
    });
    const activeLink = document.querySelector(`nav a[data-target="${targetId}"]`);
    if (activeLink) activeLink.classList.add('active');
  };

  const triggerTypewriter = (sectionId) => {
    const section = document.getElementById(sectionId);
    const typewriterTitle = section.querySelector('.typewriter');
    typewriterTitle.style.animation = 'none'; // Reinicia la animación
    setTimeout(() => {
      typewriterTitle.style.animation = ''; // Reanuda la animación
    }, 10);
  };

  const revealPhotos = () => {
    const photos = document.querySelectorAll('.photo-gallery img');
    photos.forEach(photo => {
      const rect = photo.getBoundingClientRect();
      if (rect.top < window.innerHeight - 100) {
        photo.classList.add('visible'); // Añade la clase para hacer visibles las fotos
      }
    });
  };

  const updateMenuLinks = () => {
    menuLinks.forEach(link => {
      const targetId = link.dataset.target;
      if (languageIndex === 0) {
        link.dataset.target = targetId.replace('-en', '').replace('-ca', '');
        link.textContent = link.textContent.replace('Biography', 'Biografía')
                                           .replace('Studies', 'Estudios')
                                           .replace('Work Experience', 'Experiencia')
                                           .replace('Recognitions', 'Reconocimientos')
                                           .replace('Biografia', 'Biografía')
                                           .replace('Estudis', 'Estudios')
                                           .replace('Experiència', 'Experiencia')
                                           .replace('Reconeixements', 'Reconocimientos');
      } else if (languageIndex === 1) {
        link.dataset.target = `${targetId.replace('-ca', '')}-en`;
        link.textContent = link.textContent.replace('Biografía', 'Biography')
                                           .replace('Estudios', 'Studies')
                                           .replace('Experiencia', 'Work Experience')
                                           .replace('Reconocimientos', 'Recognitions')
                                           .replace('Biografia', 'Biography')
                                           .replace('Estudis', 'Studies')
                                           .replace('Experiència', 'Work Experience')
                                           .replace('Reconeixements', 'Recognitions');
      } else {
        link.dataset.target = `${targetId.replace('-en', '')}-ca`;
        link.textContent = link.textContent.replace('Biografía', 'Biografia')
                                           .replace('Estudios', 'Estudis')
                                           .replace('Experiencia', 'Experiència')
                                           .replace('Reconocimientos', 'Reconeixements')
                                           .replace('Biography', 'Biografia')
                                           .replace('Studies', 'Estudis')
                                           .replace('Work Experience', 'Experiència')
                                           .replace('Recognitions', 'Reconeixements');
      }
    });
  };

  const showSection = (targetId) => {
    sections.forEach(section => {
      section.classList.remove('active');
      section.style.display = 'none';
    });
    const targetSection = document.getElementById(targetId);
    if (targetSection) {
      targetSection.classList.add('active');
      targetSection.style.display = 'block';
      triggerTypewriter(targetId);
    }
  };

  // Initial translation
  document.querySelectorAll('.section-es').forEach(section => {
    section.style.display = 'block';
  });
  document.querySelectorAll('.section-en, .section-ca').forEach(section => {
    section.style.display = 'none';
  });

  menuLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = e.target.dataset.target;
      showSection(targetId);
      updateActiveMenu(targetId);
      revealPhotos(); // Revela las fotos de la sección activa
    });
  });

  const translateButton = document.createElement('button');
  translateButton.id = 'translateButton';
  translateButton.textContent = 'ES';
  document.body.appendChild(translateButton);

  translateButton.addEventListener('click', () => {
    languageIndex = (languageIndex + 1) % 3;
    translateButton.textContent = languageIndex === 0 ? 'ES' : languageIndex === 1 ? 'EN' : 'CA';
    document.querySelectorAll('.section-es').forEach(section => {
      section.classList.toggle('active', languageIndex === 0);
      section.style.display = languageIndex === 0 ? 'block' : 'none';
    });
    document.querySelectorAll('.section-en').forEach(section => {
      section.classList.toggle('active', languageIndex === 1);
      section.style.display = languageIndex === 1 ? 'block' : 'none';
    });
    document.querySelectorAll('.section-ca').forEach(section => {
      section.classList.toggle('active', languageIndex === 2);
      section.style.display = languageIndex === 2 ? 'block' : 'none';
    });
    updateMenuLinks();
    const bioSectionId = languageIndex === 0 ? 'bio' : languageIndex === 1 ? 'bio-en' : 'bio-ca';
    showSection(bioSectionId);
    updateActiveMenu(bioSectionId);
  });

  window.addEventListener('scroll', revealPhotos); // Revela fotos al hacer scroll
  revealPhotos(); // Revela fotos visibles al cargar la página

  const defaultSection = 'bio';
  showSection(defaultSection);
  updateActiveMenu(defaultSection);
});


function nextImage(button) {
  const galleryContainer = button.parentElement.querySelector('.gallery-container');
  const images = galleryContainer.querySelectorAll('.gallery-image');
  let activeIndex = Array.from(images).findIndex(image => image.classList.contains('active'));
  
  images[activeIndex].classList.remove('active');
  activeIndex = (activeIndex + 1) % images.length; // Siguiente imagen
  images[activeIndex].classList.add('active');
}

function prevImage(button) {
  const galleryContainer = button.parentElement.querySelector('.gallery-container');
  const images = galleryContainer.querySelectorAll('.gallery-image');
  let activeIndex = Array.from(images).findIndex(image => image.classList.contains('active'));
  
  images[activeIndex].classList.remove('active');
  activeIndex = (activeIndex - 1 + images.length) % images.length; // Imagen anterior
  images[activeIndex].classList.add('active');
}
