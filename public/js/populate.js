// js/populate.js
import { lojas, setores, tipos } from './config.js';

/**
 * Preenche um <select> com uma lista de {value,label}.
 * @param {HTMLSelectElement} sel 
 * @param {Array<{value:string,label:string}>} items 
 * @param {string} placeholder 
 */
export function populateSelect(sel, items, placeholder = 'Selecione...') {
  sel.innerHTML = '';                              // limpa
  sel.add(new Option(placeholder, '', true, true)); // opção padrão
  items.forEach(({value, label}) => {
    sel.add(new Option(label, value));
  });
}

// Ao rodar o script, popula todos selects conhecidos:
window.addEventListener('DOMContentLoaded', () => {
  const map = [
    { id: 'loja',  list: lojas },
    { id: 'tipo', list: tipos },
    { id: 'setor', list: setores },
  ];
  map.forEach(({id, list}) => {
    const sel = document.getElementById(id);
    if (sel) populateSelect(sel, list);
  });
});
