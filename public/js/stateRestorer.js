import { getItem } from "./storage.js";

window.addEventListener("DOMContentLoaded", () => {
  document
    .querySelectorAll("form[id^='preventiveForm_']")
    .forEach(async (form) => {
      const idx = form.id.split("_")[1];
      const tipo = form.dataset.tipo || "desconhecido"; // <-- corrigido
      const key = `preventiva_state_${tipo}_${idx}`;

      const state = await getItem(key);
      if (!state) return;

      // Restaura texto e selects
      Object.entries(state.text).forEach(([id, val]) => {
        const el = document.getElementById(id);
        if (el) el.value = val;
      });

      // Restaura textareas
      Object.entries(state.textarea).forEach(([id, val]) => {
        const el = document.getElementById(id);
        if (el) el.value = val;
      });

      // Restaura checkboxes
      Object.entries(state.check).forEach(([id, checked]) => {
        const el = document.getElementById(id);
        if (el) el.checked = checked;
      });

      // Restaura imagens
      Object.entries(state.images).forEach(([id, src]) => {
        const preview = document.getElementById(
          `preview${id.replace("foto", "Foto")}`
        );
        if (preview) {
          preview.src = src;
          preview.style.display = "block";
        }
      });

      // Restaura assinaturas
      Object.entries(state.signatures).forEach(([canvasId, dataUrl]) => {
        const canvas = document.getElementById(canvasId);
        if (canvas) {
          const ctx = canvas.getContext("2d");
          const img = new Image();
          img.onload = () => {
            const dpr = window.devicePixelRatio || 1;
            ctx.setTransform(1, 0, 0, 1, 0, 0); // reset escala
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, canvas.width / dpr, canvas.height / dpr);
            ctx.scale(dpr, dpr); // reaplica escala para desenho manual posterior
          };
          img.src = dataUrl;
        }
      });
    });
});
