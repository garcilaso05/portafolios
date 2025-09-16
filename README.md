# Portfolio Web - Roger García Doncel

Bienvenido/a a mi portafolio web. Aquí encontrarás una muestra de mis estudios, reconocimientos y experiencia laboral. Este repositorio contiene el código fuente de mi página web.

---

## Características

- **Diseño moderno y responsivo**: Adaptado para verse perfectamente en dispositivos móviles, tabletas y escritorios.
- **Fácil navegación**: Organización clara para explorar proyectos y obtener información sobre mí.
- **Interactividad**: Animaciones ligeras y efectos visuales para mejorar la experiencia del usuario.
- **Optimizado para rendimiento**: Carga rápida y buena puntuación en herramientas como Google Lighthouse.

---

## Tecnologías utilizadas

- **Frontend**:
  - HTML5
  - CSS3
  - JavaScript

---

## Estructura del proyecto

```plaintext
/
├── index.html          # Archivo principal de la página
├── /css                # Estilos CSS
├── /js                 # Scripts de JavaScript
├── /assets             # Imágenes y otros recursos
└── README.md           # Este archivo
```

---

## Capturas de pantalla

![2025-01-19-174201_hyprshot](https://github.com/user-attachments/assets/4b340991-b006-4a4f-aaa4-4e14a1bf7084)


---

## Cómo usar este proyecto

1. **Clona el repositorio**:

   ```bash
   git clone https://github.com/tu-usuario/tu-portafolio.git
   ```

2. **Abre el archivo `index.html`**:

   Este proyecto ahora está modularizado: cada pestaña (Bio, Estudios, Experiencia, Reconocimientos) se carga dinámicamente desde archivos HTML parciales en `pages/<idioma>/<seccion>.html`.

   Debido a que el contenido se carga con `fetch`, es recomendable usar un servidor estático local (algunos navegadores bloquean `file://` + fetch):

   - Opción rápida con Python 3:
     - Ejecuta en la carpeta del proyecto: `python3 -m http.server 8080`
     - Abre en el navegador: `http://localhost:8080`
   - O usa la extensión “Live Server” de VS Code.

   La URL mantiene el idioma y la ruta actual en el hash, por ejemplo: `#lang=es&route=bio`.

---


## Copiar.sh

Este pequeño archivo shell permite copiar todos los archivos de la carpeta del proyecto (donde se ha clonado el repositorio) a la carpeta `/srv/http`.

Este pequeño atajo está pensado para facilitar el test de la web en localhost con httpd.

## Traducción

Se ha añadido un botón lateral para poder cambiar entre 3 lenguas:

- Castellano
- Catalán
- Inglés

El idioma actual también se refleja en el botón (ES/EN/CA) y en el atributo `lang` del documento. Al cambiar de idioma se recarga la ruta actual en el nuevo idioma.

## Contacto

Si deseas ponerte en contacto conmigo:

- **Email**: rogergarciadoncel@gmail.com

Gracias por visitar mi portafolio. ¡Espero que te guste!

