// public>js>cadastroEquipamento.js
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("form").addEventListener("submit", async (event) => {
    event.preventDefault();

    // Pegando os valores dos inputs, garantindo que não sejam 'null'
    const loja = document.getElementById("loja")?.value;
    const setor = document.getElementById("setor")?.value;
    const tipo = document.getElementById("tipo")?.value;
    const numero = document.getElementById("numero_equipamento")?.value;
    const serie = document.getElementById("serie")?.value;
    const patrimonio = document.getElementById("patrimonio")?.value;

    // Validação para evitar envios vazios
    if (!loja || !setor || !tipo || !numero || !serie || !patrimonio) {
      alert("Preencha todos os campos!");
      return;
    }

    const equipamento = { loja, setor, tipo, numero, serie, patrimonio };

    try {
      const response = await fetch("/equipamentos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(equipamento),
      });

      if (response.ok) {
        alert("Equipamento cadastrado com sucesso!");
      } else {
        alert("Erro ao cadastrar equipamento");
      }
    } catch (error) {
      console.error("Erro ao enviar requisição:", error);
      alert("Erro ao conectar ao servidor!");
    }
  });
});
