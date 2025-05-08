// public/js/stateRestorer.js
import { getItem } from "./storage.js";

window.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll("form[id^='preventiveForm_']")
    .forEach(async (form) => {
      const idx = form.id.split("_")[1];
      const state = await getItem(`preventiva_state_${idx}`);
      if (!state) return;

      // Restaura texto e selects
      Object.entries(state.text).forEach(([id, val]) => {
        const el = document.getElementById(id);
        if (el) el.value = val;
      });
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
          img.onload = () => ctx.drawImage(img, 0, 0);
          img.src = dataUrl;
        }
      });
    });
});