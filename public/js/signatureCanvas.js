//public/js/signatureCanvas.js
// Função para habilitar a área de assinatura em um canvas
function enableSignatureCanvas(canvas, index, tipo) {
  const ctx = canvas.getContext("2d");
  let drawing = false;

  canvas.addEventListener("mousedown", (e) => {
    drawing = true;
    ctx.beginPath();
    ctx.moveTo(e.offsetX, e.offsetY);
  });

  canvas.addEventListener("mousemove", (e) => {
    if (!drawing) return;
    ctx.lineTo(e.offsetX, e.offsetY);
    ctx.stroke();
  });

  canvas.addEventListener("mouseup", () => (drawing = false));
  canvas.addEventListener("mouseout", () => (drawing = false));

  canvas.addEventListener("touchstart", (e) => {
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    ctx.beginPath();
    ctx.moveTo(touch.clientX - rect.left, touch.clientY - rect.top);
    drawing = true;
  });

  canvas.addEventListener("touchmove", (e) => {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    if (!drawing) return;
    ctx.lineTo(touch.clientX - rect.left, touch.clientY - rect.top);
    ctx.stroke();
  });

  canvas.addEventListener("touchend", () => (drawing = false));

  // salvar assinatura ao submeter o formulário
  const form = document.getElementById(`preventiveForm_${index}`);
  if (form) {
    form.addEventListener("submit", () => {
      const dataURL = canvas.toDataURL();
      document.getElementById(`assinaturaInput${tipo}_${index}`).value =
        dataURL;
    });
  }
}

// limpa o canvas e o hidden input correspondente
function clearSignature(role, index) {
  const canvasId = `signatureCanvas${role}_${index}`;
  const inputId = `assinaturaInput${role}_${index}`;

  const canvas = document.getElementById(canvasId);
  if (canvas) {
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  const input = document.getElementById(inputId);
  if (input) {
    input.value = "";
  }
}

// Inicializa a função de assinatura para cada canvas de assinatura
window.addEventListener("load", () => {
  // Seleciona todos os <canvas> cujo id começa com "signatureCanvas"
  document
    .querySelectorAll("canvas[id^='signatureCanvas']")
    .forEach((canvas) => {
      // Usa regex para extrair o papel ("Responsavel" ou "Ti") e o índice do id
      // Exemplo de id: "signatureCanvasResponsavel_16" ou "signatureCanvasTi_0"
      const match = canvas.id.match(/^signatureCanvas(Responsavel|Ti)_(\d+)$/);
      if (!match) return; // pula qualquer canvas que não casou o padrão

      const role = match[1]; // "Responsavel" ou "Ti"
      const index = Number(match[2]); // 0, 16, etc.

      // Associa todos os eventos de mouse/touch ao canvas correto
      enableSignatureCanvas(canvas, index, role);
    });
});
