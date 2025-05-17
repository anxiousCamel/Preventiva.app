import {
  debounce, fileToDataURL, previewImage, captureSignatures,
  toggleAllCheckboxes, parseEquipamentosData
} from "./utils.js";
import { generateEquipmentFieldset } from "./equipmentFieldsetGenerator.js";
import { generateChecklistHTML } from "./checklistGenerator.js";
import { setItem } from "./storage.js";
import { saveSlideState } from "./stateManager.js";
import { createChecklistFieldset } from "./checklistFieldsetBuilder.js";
import { checklists } from './config.js';

const equipamentosData = localStorage.getItem("equipamentosData");
const carouselContainer = document.getElementById("carouselContainer");

const equipamentos = equipamentosData ? parseEquipamentosData(equipamentosData) : null;

if (equipamentos) {
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
    form.dataset.tipo = equipamento.tipo;

    const checklist = checklists[equipamento.tipo] || [];
    const checklistHTML = createChecklistFieldset(checklist, sortedIdx).outerHTML;

    let html = `
      ${generateEquipmentFieldset(equipamento, sortedIdx)}

      <fieldset><legend>Fotos Antes</legend>
        <input type="file" id="fotoAntes_${sortedIdx}" name="fotoAntes" accept="image/*" capture="environment">
        <img id="previewFotoAntes_${sortedIdx}" alt="Prévia" style="max-width:100%; display:none; margin-top:10px;">
      </fieldset>

      ${checklistHTML}

      <fieldset><label for="current_${sortedIdx}">Corrente Elétrica:</label>
        <select id="current_${sortedIdx}" name="current" required>
          <option value="" disabled>Selecione a tensão</option>
          <option value="110">110 V</option>
          <option value="220" selected>220 V</option>
        </select>
      </fieldset>

      <fieldset><legend>Fotos Depois</legend>
        <input type="file" id="fotoDepois_${sortedIdx}" name="fotoDepois" accept="image/*" capture="environment">
        <img id="previewFotoDepois_${sortedIdx}" alt="Prévia" style="max-width:100%; display:none; margin-top:10px;">
      </fieldset>

      <fieldset><legend>Observações</legend>
        <textarea id="observacoes_${sortedIdx}" name="observacoes" rows="4" style="width:100%;" placeholder="Digite observações..."></textarea>
      </fieldset>
    `;

    if (sortedIdx === 0 || thisSector !== lastSector) {
      html += `
        <fieldset><legend>Assinatura Responsável pelo Setor</legend>
          <label for="nomeResponsavel_${sortedIdx}">Nome:</label>
          <input type="text" id="nomeResponsavel_${sortedIdx}" name="nomeResponsavel" placeholder="Nome do responsável">
          <label for="cargoResponsavel_${sortedIdx}">Cargo:</label>
          <select id="cargoResponsavel_${sortedIdx}" name="cargoResponsavel">
            <option>Responsável de Setor</option>
            <option>Gerente</option>
            <option>Supervisor</option>
          </select>
          <p>Assinatura:</p>
          <canvas id="signatureCanvasResponsavel_${sortedIdx}" class="signature-canvas"></canvas><br>
          <button type="button" class="btn-clear-signature" onclick="clearSignature('Responsavel', ${sortedIdx})">
            <i class="fa-solid fa-eraser"></i> Limpar
          </button>
          <input type="hidden" id="assinaturaInputResponsavel_${sortedIdx}" name="assinaturaResponsavel" value="">
        </fieldset>

        <fieldset><legend>Assinatura Técnico de TI</legend>
          <label for="nomeTi_${sortedIdx}">Nome:</label>
          <input type="text" id="nomeTi_${sortedIdx}" name="nomeTi" placeholder="Nome do técnico">
          <p>Assinatura:</p>
          <canvas id="signatureCanvasTi_${sortedIdx}" class="signature-canvas"></canvas><br>
          <button type="button" class="btn-clear-signature" onclick="clearSignature('Ti', ${sortedIdx})">
            <i class="fa-solid fa-eraser"></i> Limpar
          </button>
          <input type="hidden" id="assinaturaInputTi_${sortedIdx}" name="assinaturaTi" value="">
        </fieldset>
      `;
    }

    lastSector = thisSector;

    form.innerHTML = html;
    slide.appendChild(form);

    const nextButton = document.createElement("button");
    nextButton.type = "button";
    nextButton.innerHTML = 'Próximo <i class="fa-solid fa-forward"></i>';
    nextButton.style.marginLeft = "auto";
    nextButton.style.display = "block";
    nextButton.onclick = () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
      const nextSlide = carouselContainer.children[sortedIdx + 1];
      if (nextSlide) nextSlide.scrollIntoView({ behavior: "smooth" });
    };

    form.appendChild(nextButton);
    carouselContainer.appendChild(slide);

    const debouncedSave = debounce(() => saveSlideState(form, sortedIdx), 1000);

    form.querySelectorAll('input[type="text"], select, textarea').forEach(el => {
      el.addEventListener("input", debouncedSave);
    });

    form.querySelectorAll('input[type="checkbox"]').forEach(el => {
      el.addEventListener("change", debouncedSave);
    });

    form.querySelectorAll('input[type="file"]').forEach(input => {
      input.addEventListener("change", async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const type = input.name === "fotoAntes" ? "Antes" : "Depois";
        const preview = document.getElementById(`previewFoto${type}_${sortedIdx}`);
        previewImage(e.target, preview);
        await saveSlideState(form, sortedIdx);
      });
    });

    ["Responsavel", "Ti"].forEach(role => {
      const canvas = document.getElementById(`signatureCanvas${role}_${sortedIdx}`);
      if (!canvas) return;
      ["mouseup", "touchend"].forEach(evt => {
        canvas.addEventListener(evt, () => saveSlideState(form, sortedIdx));
      });
    });
  });
} else {
  alert("Dados do equipamento não encontrados. Inicie a preventiva novamente.");
}

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll('input[type="checkbox"][id^="checkAll_"]').forEach((checkbox) => {
    checkbox.addEventListener("click", (event) => {
      const slideIndex = event.target.getAttribute("data-slide-index");
      toggleAllCheckboxes(slideIndex);
    });
  });
});
