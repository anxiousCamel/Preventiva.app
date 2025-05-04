// js/sectorFilter.js

/**
 * Module to filter carousel slides by sector.
 * Módulo para filtrar slides do carrossel por setor.
 */
(function() {
    const filterSelect = document.getElementById('sectorFilter');
    const carouselContainer = document.getElementById('carouselContainer');
  
    if (!filterSelect || !carouselContainer) return;
  
    /**
     * Applies filter based on the selected sector.
     * Aplica o filtro baseado no setor selecionado.
     */
    function applyFilter() {
      const selectedSector = filterSelect.value.toLowerCase(); // "all" or sector name
      const slides = carouselContainer.querySelectorAll('.slide');
  
      slides.forEach(slide => {
        const slideSector = slide.getAttribute('data-sector');
        // mostra slide se "all" ou se o setor combinar
        if (selectedSector === 'all' || slideSector === selectedSector) {
          slide.style.display = 'block';
        } else {
          slide.style.display = 'none';
        }
      });
  
      // opcional: rolar para o primeiro slide visível
      const firstVisible = carouselContainer.querySelector('.slide[style*="display: block"]');
      if (firstVisible) {
        firstVisible.scrollIntoView({ behavior: 'smooth' });
      }
    }
  
    // Preenche o select com opções únicas de setor
    function populateFilterOptions() {
      const slides = carouselContainer.querySelectorAll('.slide');
      const sectors = new Set();
  
      slides.forEach(slide => {
        const sector = slide.getAttribute('data-sector');
        if (sector) sectors.add(sector);
      });
  
      // limpa opções (exceto a primeira "Todos os setores")
      Array.from(filterSelect.options)
        .slice(1)
        .forEach(opt => filterSelect.removeChild(opt));
  
      // adiciona opções em ordem alfabética
      Array.from(sectors)
        .sort()
        .forEach(sec => {
          const option = document.createElement('option');
          option.value = sec;
          option.textContent = sec.charAt(0).toUpperCase() + sec.slice(1);
          filterSelect.appendChild(option);
        });
    }
  
    // Eventos
    document.addEventListener('DOMContentLoaded', () => {
      populateFilterOptions();
      filterSelect.addEventListener('change', applyFilter);
      applyFilter(); // aplica filtro inicial
    });
  })();
  