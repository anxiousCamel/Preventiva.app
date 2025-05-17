// public/js/checklistGenerator.js

/**
 * Gera o HTML de um conjunto de itens de checklist com base em opções fornecidas.
 * @param {{ idSuffix: string, labelText: string }[]} options - Lista de opções para o checklist
 * @param {number} slideIndex - Índice do slide para garantir IDs únicos
 * @returns {string} Bloco de HTML contendo todos os itens de checklist
 */
export function generateChecklistHTML(options, slideIndex) {
  return options
    .map(opt => createChecklistItem(opt.idSuffix, opt.labelText, slideIndex))
    .join('');
}

/**
 * Gera o HTML de um item do checklist.
 * @param {string} idSuffix - Sufixo único para o ID do checkbox
 * @param {string} labelText - Texto que será exibido ao lado do checkbox
 * @param {number} slideIndex - Índice do slide para gerar IDs únicos
 * @returns {string} Bloco de HTML de um único item de checklist
 */
export function createChecklistItem(idSuffix, labelText, slideIndex) {
  const fieldId = `${idSuffix}_${slideIndex}`;
  return `
    <div class="checklist-item" style="display:flex; align-items:center; margin-bottom:8px;">
      <div class="cbx">
        <input type="checkbox" id="${fieldId}" name="checklist" value="${idSuffix}">
        <label for="${fieldId}"></label>
        <svg width="15" height="14" viewBox="0 0 15 14" fill="none">
          <path d="M2 8.36364L6.23077 12L13 2" />
        </svg>
      </div>
      <label for="${fieldId}" style="user-select:none; cursor:pointer;">
        ${labelText}
      </label>
    </div>
  `;
}