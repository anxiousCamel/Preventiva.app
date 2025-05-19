// public/js/listarEquipamentos.js
import { checklists } from "./config.js";

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("form").addEventListener("submit", async (event) => {
    event.preventDefault();

    const loja = document.getElementById("loja").value;
    const tipo = document.getElementById("tipo").value;

    try {
      const response = await fetch(`/equipamentos/${loja}/${tipo}`);
      const equipamentos = await response.json();

      if (!Array.isArray(equipamentos) || equipamentos.length === 0) {
        alert("Nenhum equipamento encontrado!");
        return;
      }

      localStorage.setItem("equipamentosData", JSON.stringify(equipamentos));

      // 🔄 Gera o mapeamento dinamicamente: preventiva + NomeComPrimeiraLetraMaiúscula
      const pageMapping = Object.fromEntries(
        Object.keys(checklists).map((tipo) => [
          tipo,
          `preventiva${toPascalCase(tipo)}.html`,
        ])
      );

      const targetPage = pageMapping[tipo];
      if (!targetPage) {
        alert("Tipo de equipamento não mapeado para uma página!");
        return;
      }

      window.location.href = targetPage;
    } catch (error) {
      console.error("Erro ao buscar equipamentos:", error);
      alert("Erro ao carregar os equipamentos.");
    }
  });
});

/**
 * Transforma string snake_case para PascalCase
 * Ex: 'balanca_setor' => 'BalancaSetor'
 */
function toPascalCase(str) {
  return str
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join("");
}
