// File: public/js/pdfGenerator.js

/**
 * @file pdfGenerator.js
 * @description Gera PDF preenchido com dados e imagens (PNG ou JPEG), agrupando por setor. 
 * Remove a primeira página (template) após o preenchimento.
 * @requires pdf-lib
 */

// ========================
// Funções utilitárias
// ========================

/**
 * Converte um File em string Base64
 * @param {File} file
 * @returns {Promise<string>}
 */
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
}

/**
 * Verifica o MIME type de uma imagem base64.
 * @param {string} base64 - A string base64 da imagem.
 * @returns {string|null} - MIME type da imagem, ou null se não detectado.
 */
function getImageMime(base64) {
  const match = base64.match(/^data:(image\/\w+);base64,/);
  return match ? match[1] : null;
}

/**
 * Converte qualquer imagem base64 para PNG via <canvas>.
 * @param {string} base64Input - Imagem em base64 com prefixo (data:image/...).
 * @returns {Promise<string>} - Imagem convertida em base64 PNG.
 */
async function convertToPngBase64(base64Input) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.src = base64Input;

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      const result = canvas.toDataURL('image/png');
      resolve(result);
    };

    img.onerror = (e) => reject(new Error("Falha ao carregar imagem: " + e.message));
  });
}

/**
 * Tenta embutir uma imagem no PDF, convertendo para PNG se necessário.
 * @param {PDFDocument} pdfDoc
 * @param {string} imageBase64
 * @returns {Promise<PDFImage>}
 */
async function embedImageSmart(pdfDoc, imageBase64) {
  try {
    const mimeType = getImageMime(imageBase64);
    const imageBytes = await fetch(imageBase64).then(res => res.arrayBuffer());

    if (mimeType === 'image/png') {
      return await pdfDoc.embedPng(imageBytes);
    } else if (mimeType === 'image/jpeg' || mimeType === 'image/jpg') {
      return await pdfDoc.embedJpg(imageBytes);
    } else {
      throw new Error('Formato de imagem não suportado');
    }
  } catch (err) {
    console.warn("Erro ao embutir imagem, convertendo para PNG:", err.message);
    const fallbackPng = await convertToPngBase64(imageBase64);
    const fallbackBytes = await fetch(fallbackPng).then(res => res.arrayBuffer());
    return await pdfDoc.embedPng(fallbackBytes);
  }
}

// ========================
// Geração do PDF
// ========================

async function generateFilledPDF() {
  const { PDFDocument, StandardFonts } = PDFLib;

  const templateUrl = "CHEK LIST PREVENTIVA BALANÇAS.pdf";
  const templateBytes = await fetch(templateUrl).then(r => r.arrayBuffer());
  const pdfDoc = await PDFDocument.load(templateBytes);
  const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBoldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const form = pdfDoc.getForm();

  const perPage = 2;
  const deltaX = 355;

  const pages = [];
  const [firstPage] = await pdfDoc.copyPages(pdfDoc, [0]);
  pdfDoc.addPage(firstPage);
  pages.push(firstPage);

  function getFieldRectangle(fieldName) {
    try {
      const field = form.getField(fieldName);
      const widget = field.acroField.getWidgets()[0];
      return widget.getRectangle();
    } catch {
      return null;
    }
  }

  function drawTextFieldDirect(page, fieldName, text, slotIndex) {
    if (!text) return;
    const rect = getFieldRectangle(fieldName);
    if (!rect) return;
    const { x, y, height } = rect;
    page.drawText(text, {
      x: x + slotIndex * deltaX,
      y: y + height - 12,
      size: 12,
      font: helveticaBoldFont,
    });
  }

  function drawCheckboxFieldDirect(page, fieldName, checked, slotIndex) {
    if (!checked) return;
    const rect = getFieldRectangle(fieldName);
    if (!rect) return;
    const { x, y, height } = rect;
    page.drawText("X", {
      x: x + slotIndex * deltaX + 2,
      y: y + height / 2 - 4,
      size: height,
      font: helveticaFont,
    });
  }

  async function drawImageSlot(page, fieldName, base64WithPrefix, defaultPos, slotIndex) {
    if (!base64WithPrefix) return;
    const image = await embedImageSmart(pdfDoc, base64WithPrefix);

    let pos = defaultPos;
    const rect = getFieldRectangle(fieldName);
    if (rect) pos = rect;

    page.drawImage(image, {
      x: pos.x + slotIndex * deltaX,
      y: pos.y,
      width: pos.width,
      height: pos.height,
    });
  }

  async function drawSignature(page, fieldName, base64Png, slotIndex) {
    if (!base64Png) return;
    const image = await pdfDoc.embedPng("data:image/png;base64," + base64Png);
    const field = form.getField(fieldName);
    const widget = field.acroField.getWidgets()[0];
    const { x, y, width, height } = widget.getRectangle();
    page.drawImage(image, {
      x: x + slotIndex * deltaX,
      y: y,
      width,
      height,
    });
  }

  const today = new Date();
  const day = String(today.getDate()).padStart(2, "0");
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const year = String(today.getFullYear());

  const forms = Array.from(document.querySelectorAll("form[id^='preventiveForm_']"));

  const sectorGroups = {};
  forms.forEach((_, idx) => {
    const sector = document.getElementById(`setor_${idx}`)?.value || "";
    if (!sectorGroups[sector]) sectorGroups[sector] = [];
    sectorGroups[sector].push(idx);
  });

  const orderedIndices = [];
  Object.values(sectorGroups).forEach(group => orderedIndices.push(...group));

  let currentPageIndex = 0;
  let slotIndex = 0;
  let previousSector = null;

  for (const idx of orderedIndices) {
    const sectorValue = document.getElementById(`setor_${idx}`)?.value || "";

    if (sectorValue !== previousSector && slotIndex !== 0) {
      const [clone] = await pdfDoc.copyPages(pdfDoc, [0]);
      pdfDoc.addPage(clone);
      pages.push(clone);
      currentPageIndex = pages.length - 1;
      slotIndex = 0;
    }

    if (slotIndex >= perPage) {
      const [clone] = await pdfDoc.copyPages(pdfDoc, [0]);
      pdfDoc.addPage(clone);
      pages.push(clone);
      currentPageIndex = pages.length - 1;
      slotIndex = 0;
    }

    const page = pages[currentPageIndex];

    // Campos de texto
    const get = (id) => document.getElementById(id)?.value || "";
    drawTextFieldDirect(page, "equipment_number", get(`numero_${idx}`), slotIndex);
    drawTextFieldDirect(page, "equipment_sector", sectorValue, slotIndex);
    drawTextFieldDirect(page, "equipment_serial", get(`serie_${idx}`), slotIndex);
    drawTextFieldDirect(page, "equipment_electricCurrent", get(`current_${idx}`), slotIndex);
    drawTextFieldDirect(page, "equipment_patrimonio", get(`patrimonio_${idx}`), slotIndex);
    drawTextFieldDirect(page, "equipment_obs", get(`observacoes_${idx}`), slotIndex);
    drawTextFieldDirect(page, "nameSector", get(`nomeResponsavel_${idx}`), slotIndex);
    drawTextFieldDirect(page, "nameTi", get(`nomeTi_${idx}`), slotIndex);
    drawTextFieldDirect(page, "cargoResponsavel", get(`cargoResponsavel_${idx}`), slotIndex);

    ["diaTi", "mesTi", "anoTi", "diaResponsavel", "mesResponsavel", "anoResponsavel"].forEach((f) => {
      const text = f.includes("dia") ? day : f.includes("mes") ? month : year;
      drawTextFieldDirect(page, f, text, slotIndex);
    });

    // Checkboxes
    const checkboxes = [
      "limparCabecote",
      "testeDeImpressao",
      "peso",
      "teclado",
      "display",
      "nivelarBalanca",
      "cabos",
      "retirarAdesivos",
      "tampas",
      "limpezaBalanca",
    ];
    checkboxes.forEach((name) => {
      const id = `${name.replace(/([A-Z])/g, (m) => m)}_${idx}`;
      const checked = document.getElementById(id)?.checked;
      drawCheckboxFieldDirect(page, `checkbox_${name}`, checked, slotIndex);
    });

    // Imagens
    const before64 = document.getElementById(`previewFotoAntes_${idx}`)?.src || null;
    const after64 = document.getElementById(`previewFotoDepois_${idx}`)?.src || null;
    await drawImageSlot(page, "before_cleaning", before64, { x: 50, y: 400, width: 200, height: 150 }, slotIndex);
    await drawImageSlot(page, "after_cleaning", after64, { x: 300, y: 400, width: 200, height: 150 }, slotIndex);

    // Assinaturas
    const canvasResp = document.getElementById(`signatureCanvasResponsavel_${idx}`);
    const canvasTi = document.getElementById(`signatureCanvasTi_${idx}`);
    const respData = canvasResp && canvasResp.toDataURL() !== "data:," ? canvasResp.toDataURL().split(",")[1] : null;
    const tiData = canvasTi && canvasTi.toDataURL() !== "data:," ? canvasTi.toDataURL().split(",")[1] : null;
    await drawSignature(page, "signatureSector", respData, slotIndex);
    await drawSignature(page, "signatureTi", tiData, slotIndex);

    slotIndex += 1;
    previousSector = sectorValue;
  }

  // Finaliza, salva e reabre para remover página inicial
  form.flatten();
  const finalBytesWithTemplate = await pdfDoc.save();
  const cleanedPdfDoc = await PDFDocument.load(finalBytesWithTemplate);
  cleanedPdfDoc.removePage(0);
  const cleanedBytes = await cleanedPdfDoc.save();

  const blob = new Blob([cleanedBytes], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "preventivas_preenchidas.pdf";
  a.click();

  clearSavedState();
}

/**
 * Remove todos os dados de formulário salvos localmente.
 */
function clearSavedState() {
  document.querySelectorAll("form[id^='preventiveForm_']").forEach((form) => {
    const idx = form.id.split("_")[1];
    localStorage.removeItem(`preventiva_state_${idx}`);
  });
}