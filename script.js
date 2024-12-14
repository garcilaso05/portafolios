document.addEventListener('DOMContentLoaded', () => {
  const menuLinks = document.querySelectorAll('nav a');
  const sections = document.querySelectorAll('.section');
  const photos = document.querySelectorAll('.photo-gallery img');

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
    photos.forEach(photo => {
      const rect = photo.getBoundingClientRect();
      if (rect.top < window.innerHeight - 100) {
        photo.classList.add('visible'); // Añade la clase para hacer visibles las fotos
      }
    });
  };

  document.querySelectorAll('.carousel').forEach(carousel => {
    const images = carousel.querySelectorAll('.carousel-image');
    let currentIndex = 0;
  
    setInterval(() => {
      // Oculta la imagen actual
      images[currentIndex].classList.remove('active');
      // Cambia al siguiente índice
      currentIndex = (currentIndex + 1) % images.length;
      // Muestra la nueva imagen con la animación
      images[currentIndex].classList.add('active');
    }, 5000); // Cambia de imagen cada 5 segundos
  });

  document.querySelectorAll('.carousel2').forEach(carousel2 => {
    const images = carousel2.querySelectorAll('.carousel2-image');
    let currentIndex = 0;
  
    setInterval(() => {
      // Oculta la imagen actual
      images[currentIndex].classList.remove('active');
      // Cambia al siguiente índice
      currentIndex = (currentIndex + 1) % images.length;
      // Muestra la nueva imagen con la animación
      images[currentIndex].classList.add('active');
    }, 5000); // Cambia de imagen cada 5 segundos
  });



// 2. Partículas Aleatorias (más sutiles)
function createParticle() {
  const particle = document.createElement("div");
  particle.className = "sparkle";
  document.body.appendChild(particle);

  const size = Math.random() * 5 + 2; // Tamaño más pequeño (2px a 7px)
  particle.style.width = `${size}px`;
  particle.style.height = `${size}px`;
  particle.style.left = `${Math.random() * window.innerWidth}px`;
  particle.style.top = `${Math.random() * window.innerHeight}px`;

  setTimeout(() => {
    particle.remove();
  }, 1200); // Duran menos tiempo (1.2s)
}

// Generar partículas aleatorias
setInterval(() => {
  createParticle();
}, Math.random() * 400); // Tiempo aleatorio entre 1.5s y 2.5s


  





  

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
