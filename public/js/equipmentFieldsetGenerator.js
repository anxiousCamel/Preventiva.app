// public/js/equipmentFieldsetGenerator.js

/**
 * Gera o HTML do bloco de dados básicos do equipamento.
 * @param {{ numero: string, setor: string, serie: string, patrimonio: string }} equipment - Objeto com as informações do equipamento
 * @param {number} slideIndex - Índice do slide para IDs únicos
 * @returns {string} Bloco de HTML contendo o fieldset de dados do equipamento
 */
export function generateEquipmentFieldset(equipment, slideIndex) {
  const { numero = '', setor = '', serie = '', patrimonio = '' } = equipment;

  return `
    <fieldset>
      <legend>Dados da Balança ${slideIndex + 1}</legend>
      <div>
        <label for="numero_${slideIndex}">Número:</label>
        <input type="text" id="numero_${slideIndex}" name="numero" readonly value="${numero}">
      </div>
      <div>
        <label for="setor_${slideIndex}">Setor:</label>
        <input type="text" id="setor_${slideIndex}" name="setor" readonly value="${setor}">
      </div>
      <div>
        <label for="serie_${slideIndex}">Série:</label>
        <input type="text" id="serie_${slideIndex}" name="serie" readonly value="${serie}">
      </div>
      <div>
        <label for="patrimonio_${slideIndex}">Patrimônio:</label>
        <input type="text" id="patrimonio_${slideIndex}" name="patrimonio" readonly value="${patrimonio}">
      </div>
    </fieldset>
  `;
}
