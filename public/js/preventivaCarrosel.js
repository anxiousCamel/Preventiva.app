// public/js/preventivaCarrosel.js
import {debounce,fileToDataURL,previewImage,captureSignatures,toggleAllCheckboxes} from "./utils.js";
import { generateEquipmentFieldset } from "./equipmentFieldsetGenerator.js";
import { generateChecklistHTML } from "./checklistGenerator.js";
import { setItem } from "./storage.js";
// Recupera os dados dos equipamentos armazenados no sessionStorage
const equipamentosData = localStorage.getItem("equipamentosData");
const carouselContainer = document.getElementById("carouselContainer");

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
            ${generateEquipmentFieldset(equipamento, sortedIdx)}
    
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
              ${generateChecklistHTML(CHECKLIST_OPTIONS, sortedIdx)}
            </fieldset>
            
            <fieldset>
                <label for="current_${sortedIdx}">Corrente Elétrica:</label>
                <select id="current_${sortedIdx}" name="current" required>
                  <option value="" disabled>Selecione a tensão</option>
                  <option value="110">110 V</option>
                  <option value="220" selected>220 V</option>
                </select>
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
     * Salva todo o estado do slide no IndexedDB.
     * @param {number} idx
     */
    async function saveSlideState(idx) {
      const form = document.getElementById(`preventiveForm_${idx}`);
      if (!form) return;

      const state = {
        text: {},
        textarea: {},
        check: {},
        images: {},
        signatures: {},
      };

      // Coleta valores…
      form.querySelectorAll('input[type="text"], select').forEach((el) => {
        state.text[el.id] = el.value;
      });
      form.querySelectorAll("textarea").forEach((el) => {
        state.textarea[el.id] = el.value;
      });
      form.querySelectorAll('input[type="checkbox"]').forEach((el) => {
        state.check[el.id] = el.checked;
      });
      ["Antes", "Depois"].forEach((type) => {
        const img = document.getElementById(`previewFoto${type}_${idx}`);
        if (img && img.src) state.images[`foto${type}_${idx}`] = img.src;
      });
      state.signatures = captureSignatures(idx, ["Responsavel", "Ti"]);

      // Grava no IndexedDB
      await setItem(`preventiva_state_${idx}`, state);
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
    form
      .querySelectorAll('input[type="text"], select, textarea')
      .forEach((el) =>
        el.addEventListener("input", () => debouncedSave(sortedIdx))
      );

    // Eventos de checkbox
    form
      .querySelectorAll('input[type="checkbox"]')
      .forEach((el) =>
        el.addEventListener("change", () => debouncedSave(sortedIdx))
      );

    /// Para inputs de arquivo
    form.querySelectorAll('input[type="file"]').forEach((input) =>
      input.addEventListener("change", async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const dataUrl = await fileToDataURL(file); // converte o arquivo
        const type = input.name === "fotoAntes" ? "Antes" : "Depois";
        const preview = document.getElementById(`previewFoto${type}_${idx}`);
        preview.src = dataUrl;
        preview.style.display = "block";
        await saveSlideState(idx); // salva logo após
      })
    );

    // Para canvas de assinatura (após evento mouseup/touchend)
    ["Responsavel", "Ti"].forEach((role) => {
      const canvas = document.getElementById(`signatureCanvas${role}_${idx}`);
      if (!canvas) return;
      ["mouseup", "touchend"].forEach((evt) => {
        canvas.addEventListener(evt, async () => {
          await saveSlideState(idx);
        });
      });
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
