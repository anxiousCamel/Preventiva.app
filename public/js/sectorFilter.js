// js/sectorFilter.js

/**
 * Module to filter carousel slides by sector.
 * Módulo para filtrar slides do carrossel por setor.
 */
(function() {
  const filterSelect = document.getElementById('sectorFilter');
  const carouselContainer = document.getElementById('carouselContainer');
  if (!filterSelect || !carouselContainer) return;

  const norm = (s) => (s || "")
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, "-");

  function applyFilter() {
    const selected = norm(filterSelect.value); // "all" ou slug do setor
    const slides = carouselContainer.querySelectorAll('.slide');

    slides.forEach(slide => {
      const slideSectorRaw = slide.getAttribute('data-sector'); // espere SLUG aqui
      const slideSector = norm(slideSectorRaw);
      slide.style.display = (selected === 'all' || slideSector === selected) ? 'block' : 'none';
    });

    const firstVisible = carouselContainer.querySelector('.slide[style*="display: block"]');
    if (firstVisible) firstVisible.scrollIntoView({ behavior: 'smooth' });
  }

  function populateFilterOptions() {
    const slides = carouselContainer.querySelectorAll('.slide');
    const sectors = new Map(); // slug -> label original

    slides.forEach(slide => {
      const raw = slide.getAttribute('data-sector');
      if (!raw) return;
      const slug = norm(raw);
      if (!sectors.has(slug)) sectors.set(slug, raw);
    });

    // remove opções extras mantendo a primeira ("Todos os setores")
    Array.from(filterSelect.options).slice(1).forEach(opt => filterSelect.removeChild(opt));

    // adiciona em ordem pelo label normalizado
    Array.from(sectors.entries())
      .sort((a, b) => a[1].localeCompare(b[1]))
      .forEach(([slug, label]) => {
        const option = document.createElement('option');
        option.value = slug;                         // value = SLUG
        option.textContent = label;                  // label exibida original
        filterSelect.appendChild(option);
      });
  }

  document.addEventListener('DOMContentLoaded', () => {
    populateFilterOptions();
    filterSelect.addEventListener('change', applyFilter);
    applyFilter();
  });
})();
