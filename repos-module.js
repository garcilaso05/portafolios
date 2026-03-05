/**
 * MÓDULO DE REPOSITORIOS DE GITHUB
 * ================================
 * Este script debe ejecutarse después de cargar el HTML del módulo
 */

window.initReposModule = function() {
  'use strict';

  console.log('Init Repos Module');

  // =============================
  // CONFIGURACIÓN
  // =============================
  const GITHUB_USERNAME = 'garcilaso05';
  const GITHUB_API_URL = `https://api.github.com/users/${GITHUB_USERNAME}/repos`;
  const FEATURED_JSON_URL = 'featured-repos.json';
  
  // Contenedores DOM
  const featuredGrid = document.getElementById('featured-repos-grid');
  const allReposGrid = document.getElementById('all-repos-grid');
  const statusDiv = document.getElementById('repos-status');
  const featuredContainer = document.getElementById('featured-repos-container');
  const allReposContainer = document.getElementById('all-repos-container');

  console.log('🔍 DOM Elements Check:', {
    featuredGrid: !!featuredGrid,
    allReposGrid: !!allReposGrid,
    statusDiv: !!statusDiv,
    featuredContainer: !!featuredContainer,
    allReposContainer: !!allReposContainer
  });

  if (!featuredGrid || !allReposGrid || !statusDiv) {
    console.error('Critical DOM elements not found!');
    return;
  }

  // =============================
  // UTILIDADES
  // =============================
  
  function showStatus(message, type = 'info') {
    if (!statusDiv) {
      console.error('statusDiv no encontrado');
      return;
    }
    console.log('Status:', message, type);
    statusDiv.textContent = message;
    statusDiv.className = `repos-status repos-status-${type}`;
    statusDiv.style.display = 'block';
  }

  function hideStatus() {
    if (!statusDiv) return;
    statusDiv.style.display = 'none';
  }

  // =============================
  // OBTENCIÓN DE DATOS
  // =============================

  async function fetchGithubRepos() {
    console.log('Fetching from:', GITHUB_API_URL);
    try {
      const response = await fetch(GITHUB_API_URL);
      console.log('Response status:', response.status, response.ok);
      if (!response.ok) throw new Error('Error al obtener repositorios de GitHub');
      const repos = await response.json();
      console.log('Repos received:', repos.length);
      const publicRepos = repos.filter(repo => !repo.private);
      console.log('Public repos:', publicRepos.length);
      return publicRepos;
    } catch (error) {
      console.error('Error fetching GitHub repos:', error);
      return [];
    }
  }

  async function fetchFeaturedConfig() {
    console.log('Fetching featured config from:', FEATURED_JSON_URL);
    try {
      const response = await fetch(FEATURED_JSON_URL);
      console.log('Featured config response:', response.status, response.ok);
      if (!response.ok) return [];
      const config = await response.json();
      console.log('Featured config loaded:', config.length, 'items');
      return config.sort((a, b) => a.position - b.position);
    } catch (error) {
      console.warn('No se pudo cargar featured-repos.json:', error);
      return [];
    }
  }

  function mergeRepoData(apiRepos, featuredConfig) {
    console.log('Merging data - API repos:', apiRepos.length, 'Featured config:', featuredConfig.length);
    const featured = [];
    const featuredNames = new Set();

    featuredConfig.forEach(config => {
      const apiRepo = apiRepos.find(r => r.name === config.repo);
      if (apiRepo) {
        console.log('Found featured repo:', config.repo);
        featured.push({
          ...apiRepo,
          customTitle: config.customTitle || null,
          customDescription: config.customDescription || null,
          image: config.image || null,
          extraLinks: config.extraLinks || []
        });
        featuredNames.add(config.repo);
      } else {
        console.warn('Featured repo not found in API:', config.repo);
      }
    });

    const normal = apiRepos.filter(repo => !featuredNames.has(repo.name));
    console.log('Merge result - Featured:', featured.length, 'Normal:', normal.length);

    return { featured, normal };
  }

  // =============================
  // RENDERIZADO
  // =============================

  function createButtons(repo, extraLinks = []) {
    let buttonsHTML = '';

    buttonsHTML += `
      <a href="${repo.html_url}" target="_blank" rel="noopener noreferrer" class="repo-btn repo-btn-github">
        <span>GitHub</span>
      </a>
    `;

    if (repo.homepage) {
      buttonsHTML += `
        <a href="${repo.homepage}" target="_blank" rel="noopener noreferrer" class="repo-btn repo-btn-live">
          <span>Live Demo</span>
        </a>
      `;
    }

    extraLinks.forEach(link => {
      buttonsHTML += `
        <a href="${link.url}" target="_blank" rel="noopener noreferrer" class="repo-btn repo-btn-extra">
          <span>${link.label}</span>
        </a>
      `;
    });

    return buttonsHTML;
  }

  function renderFeaturedRepo(repo) {
    const title = repo.customTitle || repo.name;
    const description = repo.customDescription || repo.description || 'Sin descripción';
    const imageHTML = repo.image 
      ? `<div class="featured-repo-image">
           <img src="${repo.image}" alt="${title}" class="zoom-image">
         </div>`
      : '';

    return `
      <div class="featured-repo-card">
        ${imageHTML}
        <div class="featured-repo-content">
          <h4 class="featured-repo-title">${title}</h4>
          <p class="featured-repo-description">${description}</p>
          <div class="featured-repo-buttons">
            ${createButtons(repo, repo.extraLinks)}
          </div>
        </div>
      </div>
    `;
  }

  function renderNormalRepo(repo) {
    const description = repo.description || 'Sin descripción';
    
    return `
      <div class="normal-repo-card">
        <div class="normal-repo-header">
          <h5 class="normal-repo-title">${repo.name}</h5>
        </div>
        <p class="normal-repo-description">${description}</p>
        <div class="normal-repo-buttons">
          ${createButtons(repo)}
        </div>
      </div>
    `;
  }

  // =============================
  // INICIALIZACIÓN
  // =============================

  async function init() {
    console.log('Starting repos fetch');
    showStatus('Cargando repositorios...', 'info');

    const [apiRepos, featuredConfig] = await Promise.all([
      fetchGithubRepos(),
      fetchFeaturedConfig()
    ]);

    console.log('Data fetched - API:', apiRepos.length, 'Featured:', featuredConfig.length);

    if (apiRepos.length === 0) {
      showStatus('No se pudieron cargar los repositorios', 'error');
      return;
    }

    const { featured, normal } = mergeRepoData(apiRepos, featuredConfig);
    
    console.log('Starting render');
    
    if (featured.length > 0) {
      const featuredHTML = featured.map(renderFeaturedRepo).join('');
      featuredGrid.innerHTML = featuredHTML;
      featuredContainer.style.display = 'block';
      console.log('Featured rendered:', featured.length);
    } else {
      featuredContainer.style.display = 'none';
    }

    if (normal.length > 0) {
      const normalHTML = normal.map(renderNormalRepo).join('');
      allReposGrid.innerHTML = normalHTML;
      allReposContainer.style.display = 'block';
      console.log('Normal rendered:', normal.length);
    } else if (featured.length === 0) {
      showStatus('No se encontraron repositorios públicos', 'warning');
      return;
    }

    hideStatus();
    console.log('Repos module complete');
  }

  // Ejecutar
  init();
};
