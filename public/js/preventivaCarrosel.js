// public/js/preventivaCarrosel.js
// Recupera os dados dos equipamentos armazenados no sessionStorage
const equipamentosData = sessionStorage.getItem("equipamentosData");
const carouselContainer = document.getElementById("carouselContainer");

/**
 * Cria uma função debounced que aguarda 'wait' ms antes de chamar 'fn'.
 * Se chamada novamente antes do tempo, reinicia o timer.
 * @param {Function} fn – função a ser executada (e.g. saveSlideState)
 * @param {number} wait – atraso em milissegundos
 * @returns {Function}
 */
function debounce(fn, wait) {
  let timeoutId;
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(this, args), wait);
  };
}

/**
 * Mostra a pré-visualização da imagem.
 * @param {HTMLInputElement} fileInput - O input de arquivo
 * @param {HTMLImageElement} previewImg - Elemento <img> para exibir a prévia
 */
function previewImage(fileInput, previewImg) {
  const file = fileInput.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      previewImg.src = e.target.result;
      previewImg.style.display = "block";
    };
    reader.readAsDataURL(file);
  } else {
    previewImg.style.display = "none";
  }
}

// checklist options: idSuffix e labelText
const CHECKLIST_OPTIONS = [
  { idSuffix: "limparCabecote", labelText: "Limpar cabeçote" },
  { idSuffix: "testeDeImpressao", labelText: "Teste de impressão" },
  { idSuffix: "peso", labelText: "Peso da balança" },
  { idSuffix: "teclado", labelText: "Teclado" },
  { idSuffix: "display", labelText: "Display" },
  { idSuffix: "nivelarBalanca", labelText: "Nivelar balança" },
  { idSuffix: "cabos", labelText: "Cabos" },
  { idSuffix: "retirarAdesivos", labelText: "Retirar adesivo e outros" },
  { idSuffix: "tampas", labelText: "Tampas" },
  { idSuffix: "limpezaBalanca", labelText: "Limpeza da balança" },
];

/**
 * Gera o HTML de um item do checklist com Gooey Checkbox.
 * @param {number} slideIndex – índice do slide para ID único
 * @param {string} idSuffix – sufixo único para o ID
 * @param {string} labelText – texto exibido
 * @returns {string} bloco de HTML
 */
function createChecklistItem(slideIndex, idSuffix, labelText) {
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

if (equipamentosData) {
  const equipamentos = JSON.parse(equipamentosData);

  // Ordena índices por setor (alfabético)
  const sortedIndices = equipamentos
    .map((_, idx) => idx)
    .sort((a, b) => {
      const sectorA = (equipamentos[a].setor || "").toLowerCase();
      const sectorB = (equipamentos[b].setor || "").toLowerCase();
      return sectorA.localeCompare(sectorB) || a - b;
    });

  let lastSector = null;
  sortedIndices.forEach((originalIdx, sortedIdx) => {
    const equipamento = equipamentos[originalIdx];
    const thisSector = (equipamento.setor || "").toLowerCase();
    const slide = document.createElement("div");
    slide.classList.add("slide");
    slide.setAttribute("data-sector", thisSector);

    const form = document.createElement("form");
    form.id = `preventiveForm_${sortedIdx}`;
    form.action = "/savePreventiva";
    form.method = "post";
    form.enctype = "multipart/form-data";

    // HTML base
    let html = `
            <fieldset>
              <legend>Dados da Balança ${sortedIdx + 1}</legend>
              <div><label for="numero_${sortedIdx}">Número:</label>
                   <input type="text" id="numero_${sortedIdx}" name="numero" readonly value="${equipamento.numero || ""
      }"></div>
              <div><label for="setor_${sortedIdx}">Setor:</label>
                   <input type="text" id="setor_${sortedIdx}" name="setor" readonly value="${equipamento.setor || ""
      }"></div>
              <div><label for="serie_${sortedIdx}">Série:</label>
                   <input type="text" id="serie_${sortedIdx}" name="serie" readonly value="${equipamento.serie || ""
      }"></div>
              <div><label for="patrimonio_${sortedIdx}">Patrimônio:</label>
                   <input type="text" id="patrimonio_${sortedIdx}" name="patrimonio" readonly value="${equipamento.patrimonio || ""
      }"></div>
            </fieldset>
    
            <fieldset>
              <legend>Fotos Antes</legend>
              <input type="file" id="fotoAntes_${sortedIdx}" name="fotoAntes" accept="image/*" capture="environment">
              <img id="previewFotoAntes_${sortedIdx}" alt="Prévia" style="max-width:100%; display:none; margin-top:10px;">
            </fieldset>
    
            <fieldset>
              <legend>Checklist</legend>
              <div style="margin-bottom:8px;">
                <label>
                  <input type="checkbox" id="checkAll_${sortedIdx}" data-slide-index="${sortedIdx}">
                  Marcar todos
                </label>
              </div>
              ${CHECKLIST_OPTIONS.map((opt) =>
        createChecklistItem(sortedIdx, opt.idSuffix, opt.labelText)
      ).join("")}
            </fieldset>

    
            <fieldset>
              <legend>Fotos Depois</legend>
              <input type="file" id="fotoDepois_${sortedIdx}" name="fotoDepois" accept="image/*" capture="environment">
              <img id="previewFotoDepois_${sortedIdx}" alt="Prévia" style="max-width:100%; display:none; margin-top:10px;">
            </fieldset>
    
            <fieldset>
              <legend>Observações</legend>
              <textarea id="observacoes_${sortedIdx}" name="observacoes" rows="4" style="width:100%;" placeholder="Digite observações..."></textarea>
            </fieldset>
          `;

    // Adiciona assinaturas apenas no primeiro slide de cada setor
    if (sortedIdx === 0 || thisSector !== lastSector) {
      html += `
              <fieldset>
                <legend>Assinatura Responsável pelo Setor</legend>
                <label for="nomeResponsavel_${sortedIdx}">Nome:</label>
                <input type="text" id="nomeResponsavel_${sortedIdx}" name="nomeResponsavel" placeholder="Nome do responsável">
                <label for="cargoResponsavel_${sortedIdx}">Cargo:</label>
                <select id="cargoResponsavel_${sortedIdx}" name="cargoResponsavel">
                  <option>Responsável de Setor</option>
                  <option>Gerente</option>
                  <option>Supervisor</option>
                </select>
                <p>Assinatura:</p>
                <canvas id="signatureCanvasResponsavel_${sortedIdx}" class="signature-canvas" "></canvas><br>
                <button type="button" class="btn-clear-signature" onclick="clearSignature('Responsavel', ${sortedIdx})"> <i class="fa-solid fa-eraser"></i> Limpar</button>
                <input type="hidden" id="assinaturaInputResponsavel_${sortedIdx}" name="assinaturaResponsavel"   value="">
              </fieldset>
    
              <fieldset>
                <legend>Assinatura Técnico de TI</legend>
                <label for="nomeTi_${sortedIdx}">Nome:</label>
                <input type="text" id="nomeTi_${sortedIdx}" name="nomeTi" placeholder="Nome do técnico">
                <p>Assinatura:</p>
                <canvas id="signatureCanvasTi_${sortedIdx}" class="signature-canvas" "></canvas><br>
                <button type="button" class="btn-clear-signature" onclick="clearSignature('Ti', ${sortedIdx})"><i class="fa-solid fa-eraser"></i> Limpar</button>
                <input type="hidden" id="assinaturaInputTi_${sortedIdx}"  name="assinaturaTi" value="">
              </fieldset>
            `;
    }
    lastSector = thisSector;

    /**
     * Salva o estado do slide `idx` no localStorage
     */
    function saveSlideState(idx) {
      const form = document.getElementById(`preventiveForm_${idx}`);
      if (!form) return;

      // Objeto que vai conter todos os valores
      const state = {
        text: {},
        check: {},
        images: {},
        textarea: {},
        signatures: {},
      };

      // Campos de texto e select
      form.querySelectorAll('input[type="text"], select').forEach((el) => {
        state.text[el.id] = el.value;
      });

      // Textareas
      form.querySelectorAll("textarea").forEach((el) => {
        state.textarea[el.id] = el.value;
      });

      // Checkboxes
      form.querySelectorAll('input[type="checkbox"]').forEach((el) => {
        state.check[el.id] = el.checked;
      });

      // Imagens (usar prévia já carregada)
      ["Antes", "Depois"].forEach((type) => {
        const preview = document.getElementById(`previewFoto${type}_${idx}`);
        if (preview && preview.src) {
          state.images[`foto${type}_${idx}`] = preview.src;
        }
      });

      // Assinaturas (canvas -> DataURL)
      ["Responsavel", "Ti"].forEach((role) => {
        const canvas = document.getElementById(`signatureCanvas${role}_${idx}`);
        if (canvas) {
          state.signatures[canvas.id] = canvas.toDataURL();
        }
      });

      // Grava no localStorage
      localStorage.setItem(`preventiva_state_${idx}`, JSON.stringify(state));
    }

    form.innerHTML = html;

    slide.appendChild(form);

    // Adiciona botão para navegação ao próximo grupo
    const nextButton = document.createElement("button");
    nextButton.type = "button";
    nextButton.innerHTML = 'Próximo <i class="fa-solid fa-forward"></i>';
    nextButton.style.marginLeft = "auto";
    nextButton.style.display = "block";
    nextButton.onclick = () => {
      // Rolando a página para o topo
      window.scrollTo({ top: 0, behavior: "smooth" });

      // Mostrando o próximo slide
      const nextSlide = carouselContainer.children[sortedIdx + 1];
      if (nextSlide) {
        nextSlide.scrollIntoView({ behavior: "smooth" });
      }
    };
    form.appendChild(nextButton);

    carouselContainer.appendChild(slide);

    // Associa listeners
    const idx = form.id.split("_")[1];
    const debouncedSave = debounce((idx) => saveSlideState(idx), 1000);

    // Eventos de texto/select/textarea
    form.querySelectorAll('input[type="text"], select, textarea')
      .forEach(el => el.addEventListener('input', () => debouncedSave(sortedIdx)));

    // Eventos de checkbox
    form.querySelectorAll('input[type="checkbox"]')
      .forEach(el => el.addEventListener('change', () => debouncedSave(sortedIdx)));

    // Eventos de arquivo (após converter p/ DataURL)
    form.querySelectorAll('input[type="file"]')
      .forEach(el => el.addEventListener('change', async () => {
        // ... lógica de fileToBase64()
        debouncedSave(sortedIdx);
      }));

    // Eventos de assinatura (canvas)
    ['mouseup', 'touchend'].forEach(evt => {
      const canvas = document.getElementById(`signatureCanvasResponsavel_${sortedIdx}`);
      if (canvas) canvas.addEventListener(evt, () => debouncedSave(sortedIdx));
      const canvasTi = document.getElementById(`signatureCanvasTi_${sortedIdx}`);
      if (canvasTi) canvasTi.addEventListener(evt, () => debouncedSave(sortedIdx));
    });

    // configura previews
    form
      .querySelector(`#fotoAntes_${sortedIdx}`)
      .addEventListener("change", (e) =>
        previewImage(
          e.target,
          form.querySelector(`#previewFotoAntes_${sortedIdx}`)
        )
      );
    form
      .querySelector(`#fotoDepois_${sortedIdx}`)
      .addEventListener("change", (e) =>
        previewImage(
          e.target,
          form.querySelector(`#previewFotoDepois_${sortedIdx}`)
        )
      );
  });
} else {
  alert("Dados do equipamento não encontrados. Inicie a preventiva novamente.");
}

// Função para marcar/desmarcar todos os checkboxes
function toggleAllCheckboxes(slideIndex) {
  const checkboxes = document.querySelectorAll(
    `#preventiveForm_${slideIndex} input[type="checkbox"]:not(#checkAll_${slideIndex})`
  );
  const checkAllCheckbox = document.getElementById(`checkAll_${slideIndex}`);

  // Verifica se todos os checkboxes estão marcados
  const allChecked = Array.from(checkboxes).every(
    (checkbox) => checkbox.checked
  );

  // Marca/desmarca todos os checkboxes
  checkboxes.forEach((checkbox) => {
    checkbox.checked = !allChecked;
  });

  // Atualiza o estado do "Marcar todos"
  checkAllCheckbox.checked = !allChecked;
}

// Adiciona o evento ao "Marcar todos"
document.addEventListener("DOMContentLoaded", () => {
  const checkAllCheckboxes = document.querySelectorAll(
    'input[type="checkbox"][id^="checkAll_"]'
  );
  checkAllCheckboxes.forEach((checkbox) => {
    checkbox.addEventListener("click", (event) => {
      const slideIndex = event.target.getAttribute("data-slide-index");
      toggleAllCheckboxes(slideIndex);
    });
  });
});