document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("form").addEventListener("submit", async (event) => {
    event.preventDefault();

    // Obtém os valores dos campos do formulário
    const loja = document.getElementById("loja").value;
    const tipo = document.getElementById("tipo").value;

    try {
      // Realiza a busca dos equipamentos conforme os parâmetros
      const response = await fetch(`/equipamentos/${loja}/${tipo}`);
      const equipamentos = await response.json();

      // Verifica se foram encontrados equipamentos
      if (!Array.isArray(equipamentos) || equipamentos.length === 0) {
        alert("Nenhum equipamento encontrado!");
        return;
      }
      
      // Armazena os dados dos equipamentos no sessionStorage para passar para a nova página
      sessionStorage.setItem("equipamentosData", JSON.stringify(equipamentos));

      // Mapeamento do tipo de equipamento para a página de preventiva correspondente
      const pageMapping = {
        "balanca_setor": "preventivaBalancaSetor.html",
        "balanca_checkout": "preventivaBalancaCheckout.html",
        "impressora": "preventivaImpressora.html",
        "teclado": "preventivaTeclado.html",
        "gabinete": "preventivaGabinete.html",
        "gaveta": "preventivaGaveta.html",
        "scanner": "preventivaScanner.html"
      };

      const targetPage = pageMapping[tipo];
      if (!targetPage) {
        alert("Tipo de equipamento não mapeado para uma página!");
        return;
      }

      // Redireciona para a página correspondente
      window.location.href = targetPage;
    } catch (error) {
      console.error("Erro ao buscar equipamentos:", error);
      alert("Erro ao carregar os equipamentos.");
    }
  });
});
