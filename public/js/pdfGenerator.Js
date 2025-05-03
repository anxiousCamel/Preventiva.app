//public/js/pdfGenerator.js
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
 * Gera o PDF preenchido agrupando preventivas por setor (até 2 por página).
 * Se o setor mudar, sempre inicia nova página.
 */
async function generateFilledPDF() {
  const { PDFDocument, StandardFonts } = PDFLib;

  // 1) Carrega template
  const templateUrl = "CHEK LIST PREVENTIVA BALANÇAS.pdf";
  const templateBytes = await fetch(templateUrl).then((r) => r.arrayBuffer());
  const pdfDoc = await PDFDocument.load(templateBytes);
  const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBoldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const form = pdfDoc.getForm();

  const perPage = 2;
  const deltaX = 355;

  // Pages dinâmicas: começa com uma cópia da página template
  let pages = [];
  const [firstPage] = await pdfDoc.copyPages(pdfDoc, [0]);
  pdfDoc.addPage(firstPage);
  pages.push(firstPage);

  // Helper: obtém retângulo de um campo (null se não existir)
  function getFieldRectangle(fieldName) {
    try {
      const field = form.getField(fieldName);
      const widget = field.acroField.getWidgets()[0];
      return widget.getRectangle();
    } catch {
      return null;
    }
  }

  // Desenha texto no slot da página
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

  // Desenha 'X' para checkbox
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

  // Desenha imagem (antes/depois) no slot
  async function drawImageSlot(
    page,
    fieldName,
    base64WithPrefix,
    defaultPos,
    slotIndex
  ) {
    if (!base64WithPrefix) return;
    const [, data] = base64WithPrefix.split(",");
    let embedded;
    if (base64WithPrefix.includes("jpeg") || base64WithPrefix.includes("jpg")) {
      embedded = await pdfDoc.embedJpg(data);
    } else {
      embedded = await pdfDoc.embedPng(data);
    }

    let pos = defaultPos;
    const rect = getFieldRectangle(fieldName);
    if (rect) pos = rect;

    page.drawImage(embedded, {
      x: pos.x + slotIndex * deltaX,
      y: pos.y,
      width: pos.width,
      height: pos.height,
    });
  }

  // Desenha assinatura em PNG (setor ou TI)
  async function drawSignature(page, fieldName, base64Png, slotIndex) {
    if (!base64Png) return;
    const image = await pdfDoc.embedPng(base64Png);
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

  // Recupera dados de hoje para preencher datas
  const today = new Date();
  const day = String(today.getDate()).padStart(2, "0");
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const year = String(today.getFullYear());

  // Coleta todos os formulários no DOM
  const forms = Array.from(
    document.querySelectorAll("form[id^='preventiveForm_']")
  );

  // Agrupa índices por setor, mantendo ordem original
  const sectorGroups = {};
  forms.forEach((_, idx) => {
    const sector = document.getElementById(`setor_${idx}`)?.value || "";
    if (!sectorGroups[sector]) sectorGroups[sector] = [];
    sectorGroups[sector].push(idx);
  });

  // Monta sequência de índices respeitando ordem de aparição
  const orderedIndices = [];
  Object.values(sectorGroups).forEach((group) => orderedIndices.push(...group));

  // Variáveis de controle de página/slot
  let currentPageIndex = 0;
  let slotIndex = 0;
  let previousSector = null;

  for (const idx of orderedIndices) {
    const sectorValue = document.getElementById(`setor_${idx}`)?.value || "";

    // Se mudou de setor e slot atual não está vazio, inicia nova página
    if (sectorValue !== previousSector && slotIndex !== 0) {
      const [clone] = await pdfDoc.copyPages(pdfDoc, [0]);
      pdfDoc.addPage(clone);
      pages.push(clone);
      currentPageIndex = pages.length - 1;
      slotIndex = 0;
    }

    // Se slot cheio (>= perPage), inicia nova página
    if (slotIndex >= perPage) {
      const [clone] = await pdfDoc.copyPages(pdfDoc, [0]);
      pdfDoc.addPage(clone);
      pages.push(clone);
      currentPageIndex = pages.length - 1;
      slotIndex = 0;
    }

    const page = pages[currentPageIndex];

    // Valores textuais
    const numberValue = document.getElementById(`numero_${idx}`)?.value || "";
    const serialValue = document.getElementById(`serie_${idx}`)?.value || "";
    const patrimonyValue =
      document.getElementById(`patrimonio_${idx}`)?.value || "";
    const obsValue = document.getElementById(`observacoes_${idx}`)?.value || "";
    const nameSectorValue =
      document.getElementById(`nomeResponsavel_${idx}`)?.value || "";
    const nameTiValue = document.getElementById(`nomeTi_${idx}`)?.value || "";
    const roleValue =
      document.getElementById(`cargoResponsavel_${idx}`)?.value || "";

    // Desenha campos de texto
    drawTextFieldDirect(page, "equipment_number", numberValue, slotIndex);
    drawTextFieldDirect(page, "equipment_sector", sectorValue, slotIndex);
    drawTextFieldDirect(page, "equipment_serial", serialValue, slotIndex);
    drawTextFieldDirect(
      page,
      "equipment_patrimonio",
      patrimonyValue,
      slotIndex
    );
    drawTextFieldDirect(page, "equipment_obs", obsValue, slotIndex);
    drawTextFieldDirect(page, "nameSector", nameSectorValue, slotIndex);
    drawTextFieldDirect(page, "nameTi", nameTiValue, slotIndex);
    drawTextFieldDirect(page, "cargoResponsavel", roleValue, slotIndex);
    // Datas
    [
      "diaTi",
      "mesTi",
      "anoTi",
      "diaResponsavel",
      "mesResponsavel",
      "anoResponsavel",
    ].forEach((field) => {
      const text = field.includes("dia")
        ? day
        : field.includes("mes")
        ? month
        : year;
      drawTextFieldDirect(page, field, text, slotIndex);
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
      const checked = document.getElementById(
        `${name.replace(/([A-Z])/g, (m) => m)}_${idx}`
      )?.checked;
      drawCheckboxFieldDirect(page, `checkbox_${name}`, checked, slotIndex);
    });

    // Imagens antes/depois
    // Imagens antes/depois: pega o Data URL do <img> de preview (que vem do localStorage)
    const previewAntes = document.getElementById(`previewFotoAntes_${idx}`);
    const before64 = previewAntes && previewAntes.src ? previewAntes.src : null;

    const previewDepois = document.getElementById(`previewFotoDepois_${idx}`);
    const after64 =
      previewDepois && previewDepois.src ? previewDepois.src : null;

    // Desenha as imagens no PDF usando os Data URLs
    await drawImageSlot(
      page,
      "before_cleaning",
      before64,
      { x: 50, y: 400, width: 200, height: 150 },
      slotIndex
    );

    await drawImageSlot(
      page,
      "after_cleaning",
      after64,
      { x: 300, y: 400, width: 200, height: 150 },
      slotIndex
    );

    // Assinaturas
    const canvasResp = document.getElementById(
      `signatureCanvasResponsavel_${idx}`
    );
    const canvasTi = document.getElementById(`signatureCanvasTi_${idx}`);
    const respData =
      canvasResp && canvasResp.toDataURL() !== "data:,"
        ? canvasResp.toDataURL().split(",")[1]
        : null;
    const tiData =
      canvasTi && canvasTi.toDataURL() !== "data:,"
        ? canvasTi.toDataURL().split(",")[1]
        : null;
    await drawSignature(page, "signatureSector", respData, slotIndex);
    await drawSignature(page, "signatureTi", tiData, slotIndex);

    // Atualiza controles
    slotIndex += 1;
    previousSector = sectorValue;
  }

  // Finaliza: fixa campos e dispara download
  form.flatten();
  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "preventivas_preenchidas.pdf";
  a.click();
  clearSavedState();
}

function clearSavedState() {
  document.querySelectorAll("form[id^='preventiveForm_']").forEach((form) => {
    const idx = form.id.split("_")[1];
    localStorage.removeItem(`preventiva_state_${idx}`);
  });
}
