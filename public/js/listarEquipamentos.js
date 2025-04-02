// public>js>listarEquipamentos.js

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("form").addEventListener("submit", async (event) => {
    event.preventDefault();

    const loja = document.getElementById("loja").value;
    const tipo = document.getElementById("tipo").value;
    const listaEquipamentos = document.getElementById("equipamentosLista");

    listaEquipamentos.innerHTML = "<p>Carregando...</p>";

    try {
      const response = await fetch(`/equipamentos/${loja}/${tipo}`);
      const equipamentos = await response.json();

      if (equipamentos.length === 0) {
        listaEquipamentos.innerHTML = "<p>Nenhum equipamento encontrado.</p>";
        return;
      }

      if (!Array.isArray(equipamentos)) {
        console.error("Resposta inesperada do servidor:", equipamentos);
        listaEquipamentos.innerHTML = "<p>Erro ao carregar os equipamentos.</p>";
        return;
    }
    

      listaEquipamentos.innerHTML = equipamentos
        .map(
          (equipamento) => `
          <li>
            <strong>Número:</strong> ${equipamento.numero} - 
            <strong>Série:</strong> ${equipamento.serie} - 
            <strong>Patrimônio:</strong> ${equipamento.patrimonio}
          </li>
        `
        )
        .join("");
    } catch (error) {
      console.error("Erro ao buscar equipamentos:", error);
      listaEquipamentos.innerHTML = "<p>Erro ao carregar os equipamentos.</p>";
    }
  });
});
