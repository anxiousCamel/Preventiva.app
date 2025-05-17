import { captureSignatures } from "./utils.js";
import { setItem } from "./storage.js";

export async function saveSlideState(form, idx) {
  if (!form) return;

  // 📌 Recupera o tipo do equipamento do atributo data-tipo
  const tipo = form.dataset.tipo || "desconhecido";
  const key = `preventiva_state_${tipo}_${idx}`;

  const state = {
    text: {},
    textarea: {},
    check: {},
    images: {},
    signatures: {},
  };

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
    if (img && img.src) {
      state.images[`foto${type}_${idx}`] = img.src;
    }
  });

  state.signatures = captureSignatures(idx, ["Responsavel", "Ti"]);

  await setItem(key, state);
}
