// public/js/preventivaCarrosel.js
import { debounce, previewImage, toggleAllCheckboxes } from "./utils.js";
import { captureSignatures } from "./utils.js";
import { saveSlideState } from "./stateManager.js";
import { generateEquipmentFieldset } from "./equipmentFieldsetGenerator.js";
import { createChecklistFieldset } from "./checklistFieldsetBuilder.js";
import { checklists } from "./config.js";

const qs = new URLSearchParams(location.search);
const cacheKey = qs.get("cacheKey");
const carouselContainer = document.getElementById("carouselContainer");
if (!cacheKey || !carouselContainer) {
  alert("Dados do equipamento não encontrados. Inicie a preventiva novamente.");
}

/** normalizador para slug de setor */
const norm = (s) =>
  (s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s+/g, "-");

/** carrega objeto AGRUPADO do localStorage */
function loadGrouped() {
  const raw = localStorage.getItem(cacheKey);
  try {
    const obj = JSON.parse(raw);
    return obj && typeof obj === "object" ? obj : {};
  } catch {
    return {};
  }
}

/** achata preservando o rótulo do grupo */
function flattenWithGroup(grouped) {
  const out = [];
  for (const [sectorLabel, arr] of Object.entries(grouped)) {
    const sectorSlug = norm(sectorLabel);
    (arr || []).forEach((item) => {
      out.push({ item, sectorLabel, sectorSlug });
      if (item.setor && item.setor !== sectorLabel) {
        console.warn("Divergência setor item vs grupo:", {
          id: item.id,
          itemSetor: item.setor,
          group: sectorLabel,
        });
      }
    });
  }
  return out;
}

/** cria o slide de um equipamento */
function createSlide({ item, sectorLabel, sectorSlug, isFirstOfSector }, idx) {
  const slide = document.createElement("div");
  slide.classList.add("slide");
  slide.setAttribute("data-sector", sectorSlug);

  const form = document.createElement("form");
  form.id = `preventiveForm_${idx}`;
  form.action = "/savePreventiva";
  form.method = "post";
  form.enctype = "multipart/form-data";
  form.dataset.tipo = item.tipo;

  const checklist = checklists[item.tipo] || [];
  const checklistHTML = createChecklistFieldset(checklist, idx).outerHTML;

  let html = `
    ${generateEquipmentFieldset({ ...item, setor: sectorLabel }, idx)}

    <fieldset><legend>Fotos Antes</legend>
      <input type="file" id="fotoAntes_${idx}" name="fotoAntes" accept="image/*" capture="environment">
      <img id="previewFotoAntes_${idx}" alt="Prévia" style="max-width:100%; display:none; margin-top:10px;">
    </fieldset>

    ${checklistHTML}

    <fieldset><label for="current_${idx}">Corrente Elétrica:</label>
      <select id="current_${idx}" name="current" required>
        <option value="" disabled>Selecione a tensão</option>
        <option value="110">110 V</option>
        <option value="220" selected>220 V</option>
      </select>
    </fieldset>

    <fieldset><legend>Fotos Depois</legend>
      <input type="file" id="fotoDepois_${idx}" name="fotoDepois" accept="image/*" capture="environment">
      <img id="previewFotoDepois_${idx}" alt="Prévia" style="max-width:100%; display:none; margin-top:10px;">
    </fieldset>

    <fieldset><legend>Observações</legend>
      <textarea id="observacoes_${idx}" name="observacoes" rows="4" style="width:100%;" placeholder="Digite observações..."></textarea>
    </fieldset>
  `;

  // Assinaturas: só no primeiro item do setor
  if (isFirstOfSector) {
    html += `
      <fieldset><legend>Assinatura Responsável pelo Setor</legend>
        <label for="nomeResponsavel_${idx}">Nome:</label>
        <input type="text" id="nomeResponsavel_${idx}" name="nomeResponsavel" placeholder="Nome do responsável">
        <label for="cargoResponsavel_${idx}">Cargo:</label>
        <select id="cargoResponsavel_${idx}" name="cargoResponsavel">
          <option>Responsável de Setor</option>
          <option>Gerente</option>
          <option>Supervisor</option>
        </select>
        <p>Assinatura:</p>
        <canvas id="signatureCanvasResponsavel_${idx}" class="signature-canvas" width="500" height="180"></canvas><br>
        <button type="button" class="btn-clear-signature" onclick="clearSignature('Responsavel', ${idx})">
          <i class="fa-solid fa-eraser"></i> Limpar
        </button>
        <input type="hidden" id="assinaturaInputResponsavel_${idx}" name="assinaturaResponsavel" value="">
      </fieldset>

      <fieldset><legend>Assinatura Técnico de TI</legend>
        <label for="nomeTi_${idx}">Nome:</label>
        <input type="text" id="nomeTi_${idx}" name="nomeTi" placeholder="Nome do técnico">
        <p>Assinatura:</p>
        <canvas id="signatureCanvasTi_${idx}" class="signature-canvas" width="500" height="180"></canvas><br>
        <button type="button" class="btn-clear-signature" onclick="clearSignature('Ti', ${idx})">
          <i class="fa-solid fa-eraser"></i> Limpar
        </button>
        <input type="hidden" id="assinaturaInputTi_${idx}" name="assinaturaTi" value="">
      </fieldset>
    `;
  }

  form.innerHTML = html;

  // autosave de inputs
  const debouncedSave = debounce(() => saveSlideState(form, idx), 800);
  form.querySelectorAll('input[type="text"], select, textarea')
      .forEach((el) => el.addEventListener("input", debouncedSave));
  form.querySelectorAll('input[type="checkbox"]')
      .forEach((el) => el.addEventListener("change", debouncedSave));
  form.querySelectorAll('input[type="file"]')
      .forEach((input) => {
        input.addEventListener("change", async (e) => {
          const type = input.name === "fotoAntes" ? "Antes" : "Depois";
          const preview = document.getElementById(`previewFoto${type}_${idx}`);
          try { await previewImage(e.target, preview); await saveSlideState(form, idx); }
          catch (err) { console.error("Erro ao carregar imagem:", err); }
        });
      });

  // inicializa assinaturas (UTIL CORRETO: espera um ARRAY de roles)
  if (isFirstOfSector) {
    // >>> ESTA É A CHAMADA CERTA PARA O SEU utils.js (evita "roles.forEach is not a function")
    captureSignatures(idx, ["Responsavel", "Ti"]);

    // salva ao soltar mouse/dedo
    ["Responsavel", "Ti"].forEach((role) => {
      const canvas = document.getElementById(`signatureCanvas${role}_${idx}`);
      if (!canvas) return;
      ["mouseup", "touchend"].forEach((evt) => {
        canvas.addEventListener(evt, () => saveSlideState(form, idx));
      });
    });
  }

  // Botão Próximo
  const nextButton = document.createElement("button");
  nextButton.type = "button";
  nextButton.innerHTML = 'Próximo <i class="fa-solid fa-forward"></i>';
  nextButton.style.marginLeft = "auto";
  nextButton.style.display = "block";
  nextButton.onclick = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    const nextSlide = document.querySelectorAll(".slide")[idx + 1];
    if (nextSlide) nextSlide.scrollIntoView({ behavior: "smooth" });
  };
  form.appendChild(nextButton);

  slide.appendChild(form);
  return slide;
}

// ------- boot -------
const grouped = loadGrouped();
const flat = flattenWithGroup(grouped);

// ordena por setor e número E MARCA o primeiro de cada setor
flat.sort(
  (a, b) =>
    a.sectorLabel.localeCompare(b.sectorLabel) ||
    String(a.item.numero ?? "").localeCompare(String(b.item.numero ?? ""))
);
let last = null;
const withFlag = flat.map((x, i) => {
  const first = i === 0 || x.sectorLabel !== last;
  last = x.sectorLabel;
  return { ...x, isFirstOfSector: first };
});

carouselContainer.innerHTML = "";
withFlag.forEach((sd, i) => {
  const slide = createSlide(sd, i);
  carouselContainer.appendChild(slide);
});

// “Marcar todos”
document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll('input[type="checkbox"][id^="checkAll_"]').forEach((checkbox) => {
    checkbox.addEventListener("click", (event) => {
      const slideIndex = event.target.getAttribute("data-slide-index");
      toggleAllCheckboxes(slideIndex);
    });
  });
});

// Função global para os botões “Limpar”
window.clearSignature = function clearSignature(role, idx) {
  const canvas = document.getElementById(`signatureCanvas${role}_${idx}`);
  const hidden = document.getElementById(`assinaturaInput${role}_${idx}`);
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (hidden) hidden.value = "";
  const form = canvas.closest("form");
  if (form) saveSlideState(form, idx);
};
