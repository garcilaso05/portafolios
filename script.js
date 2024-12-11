document.addEventListener('DOMContentLoaded', () => {
  const menuLinks = document.querySelectorAll('nav a');
  const sections = document.querySelectorAll('.section');
  const photos = document.querySelectorAll('.photo-gallery img');

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
    photos.forEach(photo => {
      const rect = photo.getBoundingClientRect();
      if (rect.top < window.innerHeight - 100) {
        photo.classList.add('visible'); // Añade la clase para hacer visibles las fotos
      }
    });
  };

  menuLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = e.target.dataset.target;
      sections.forEach(section => {
        section.classList.remove('active');
      });
      const targetSection = document.getElementById(targetId);
      if (targetSection) {
        targetSection.classList.add('active');
        triggerTypewriter(targetId);
      }
      updateActiveMenu(targetId);
      revealPhotos(); // Revela las fotos de la sección activa
    });
  });

  window.addEventListener('scroll', revealPhotos); // Revela fotos al hacer scroll
  revealPhotos(); // Revela fotos visibles al cargar la página

  const defaultSection = 'bio';
  document.getElementById(defaultSection).classList.add('active');
  updateActiveMenu(defaultSection);
  triggerTypewriter(defaultSection);
});