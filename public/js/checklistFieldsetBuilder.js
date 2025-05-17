// public/js/checklistFieldsetBuilder.js
import { generateChecklistHTML } from "./checklistGenerator.js";

export function createChecklistFieldset(options, idx) {
  const fieldset = document.createElement("fieldset");
  fieldset.innerHTML = `
    <legend>Checklist</legend>
    <div style="margin-bottom:8px;">
      <label>
        <input type="checkbox" id="checkAll_${idx}" data-slide-index="${idx}">
        Marcar todos
      </label>
    </div>
    ${generateChecklistHTML(options, idx)}
  `;
  return fieldset;
}
