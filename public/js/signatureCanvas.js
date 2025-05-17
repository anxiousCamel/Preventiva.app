// public/js/signatureCanvas.js

// Corrige resolução do canvas com base no devicePixelRatio
function setupCanvasResolution(canvas) {
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();

  // Aumenta resolução interna do canvas para evitar pixelização
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;

  // Mantém o tamanho visual original
  canvas.style.width = `${rect.width}px`;
  canvas.style.height = `${rect.height}px`;

  const ctx = canvas.getContext("2d");
  ctx.scale(dpr, dpr); // ajusta sistema de coordenadas para corresponder ao visual
  return ctx;
}

// Habilita assinatura no canvas para um equipamento/preventiva
function enableSignatureCanvas(canvas, index, tipo) {
  const ctx = setupCanvasResolution(canvas);

  // Configura traço suave
  ctx.lineWidth = 1.8;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = "#000";

  let drawing = false;

  // Eventos de mouse
  canvas.addEventListener("mousedown", (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    drawing = true;
    ctx.beginPath();
    ctx.moveTo(x, y);
  });

  canvas.addEventListener("mousemove", (e) => {
    if (!drawing) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  });

  canvas.addEventListener("mouseup", () => (drawing = false));
  canvas.addEventListener("mouseout", () => (drawing = false));

  // Eventos de toque (mobile)
  canvas.addEventListener("touchstart", (e) => {
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    drawing = true;
  });

  canvas.addEventListener("touchmove", (e) => {
    e.preventDefault(); // evita scroll ao desenhar
    if (!drawing) return;

    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  }, { passive: false });

  canvas.addEventListener("touchend", () => (drawing = false));

  // Salvar a assinatura no hidden input ao enviar formulário
  const form = document.getElementById(`preventiveForm_${index}`);
  if (form) {
    form.addEventListener("submit", () => {
      const dataURL = canvas.toDataURL();
      document.getElementById(`assinaturaInput${tipo}_${index}`).value = dataURL;
    }, { once: true });
  }
}

// Limpa a assinatura e o campo oculto
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

// Inicializa todos os canvases de assinatura na página
window.addEventListener("load", () => {
  document
    .querySelectorAll("canvas[id^='signatureCanvas']")
    .forEach((canvas) => {
      const match = canvas.id.match(/^signatureCanvas(Responsavel|Ti)_(\d+)$/);
      if (!match) return;

      const role = match[1]; // "Responsavel" ou "Ti"
      const index = Number(match[2]);

      enableSignatureCanvas(canvas, index, role);
    });
});
