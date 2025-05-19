// public/js/utils.js

/**
 * Cria uma função debounced que aguarda 'wait' ms antes de chamar 'fn'.
 * Se chamada novamente antes do tempo, reinicia o timer.
 * @param {Function} fn – função a ser executada (e.g. saveSlideState)
 * @param {number} wait – atraso em milissegundos
 * @returns {Function}
 */
export function debounce(fn, wait) {
  let timeoutId;
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(this, args), wait);
  };
}

/**
 * Converte um File em DataURL (base64).
 * @param {File} file
 * @returns {Promise<string>} – DataURL
 */
export function fileToDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Mostra a pré-visualização da imagem num elemento <img>.
 * @param {HTMLInputElement} fileInput – input de arquivo
 * @param {HTMLImageElement} previewImg – elemento img para exibir a prévia
 */
export function previewImage(fileInput, previewImg) {
  return new Promise((resolve, reject) => {
    const file = fileInput.files[0];
    if (!file) {
      previewImg.style.display = "none";
      return resolve();
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      previewImg.onload = () => resolve(); // espera renderizar imagem
      previewImg.onerror = () => reject(new Error("Erro ao carregar imagem"));
      previewImg.src = e.target.result;
      previewImg.style.display = "block";
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Captura as assinaturas do canvas e retorna um objeto role → dataURL.
 * @param {number} idx – índice do slide
 * @param {string[]} roles – ex.: ['Responsavel','Ti']
 * @returns {{[canvasId:string]:string}}
 */
export function captureSignatures(idx, roles) {
  const sigs = {};
  roles.forEach((role) => {
    const canvasId = `signatureCanvas${role}_${idx}`;
    const canvas = document.getElementById(canvasId);
    if (canvas) {
      sigs[canvasId] = canvas.toDataURL();
    }
  });
  return sigs;
}

/**
 * Marca ou desmarca todos os checkboxes de um slide.
 * @param {number} slideIndex
 */
export function toggleAllCheckboxes(slideIndex) {
  const checkboxes = document.querySelectorAll(
    `#preventiveForm_${slideIndex} input[type="checkbox"]:not(#checkAll_${slideIndex})`
  );
  const checkAllCheckbox = document.getElementById(`checkAll_${slideIndex}`);

  const allChecked = Array.from(checkboxes).every((cb) => cb.checked);
  checkboxes.forEach((cb) => (cb.checked = !allChecked));
  checkAllCheckbox.checked = !allChecked;
}

export function parseEquipamentosData(data) {
  try {
    return JSON.parse(data);
  } catch (e) {
    alert("Erro ao carregar os dados dos equipamentos.");
    return null;
  }
}
