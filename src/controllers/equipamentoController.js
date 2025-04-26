// src/controllers/equipamentoController.js
import EquipamentoModel from "../models/equipamentoModel.js";
import db from "../models/db.json" assert { type: "json" };

export const listarEquipamentos = async (req, res) => {
  try {
    const equipamentos = await EquipamentoModel.getAllEquipamentos();
    res.json(equipamentos);
  } catch (error) {
    console.error("Erro ao listar equipamentos:", error);
    res.status(500).json({ error: "Erro interno no servidor" });
  }
};

export const cadastrarEquipamento = async (req, res) => {
  try {
    const { loja, setor, tipo, numero, serie, patrimonio } = req.body;

    // Validação para garantir que todos os campos sejam fornecidos
    if (!loja || !setor || !tipo || !numero || !serie || !patrimonio) {
      return res.status(400).json({ error: "Preencha todos os campos!" });
    }

    // Adiciona o novo equipamento
    const novoEquipamento = await EquipamentoModel.addEquipamento(loja, setor, tipo, numero, serie, patrimonio);

    // Retorna uma resposta positiva
    res.status(201).json({ message: "Equipamento cadastrado com sucesso!", equipamento: novoEquipamento });
  } catch (error) {
    console.error("Erro ao cadastrar equipamento:", error);
    res.status(500).json({ error: "Erro interno no servidor" });
  }
};

export const listarEquipamentosPorLojaETipo = async (req, res) => {
  try {
    const { loja, tipo } = req.params;

    // Verifica se a loja existe
    if (!db.lojas[loja]) {
      return res.status(404).json({ error: "Loja não encontrada!" });
    }

    let equipamentosEncontrados = [];

    // Usa Object.entries para iterar com a chave do setor
    Object.entries(db.lojas[loja]).forEach(([setorKey, equipamentosArray]) => {
      equipamentosArray.forEach(equipamento => {
        if (equipamento.tipo === tipo) {
          // Garante que o equipamento tenha o campo "setor" preenchido
          equipamento.setor = setorKey;
          equipamentosEncontrados.push(equipamento);
        }
      });
    });

    console.log("Equipamentos encontrados:", equipamentosEncontrados);
    res.json(equipamentosEncontrados);
  } catch (error) {
    console.error("Erro ao listar equipamentos:", error);
    res.status(500).json({ error: "Erro interno no servidor" });
  }
};

export const filterEquipments = async (req, res) => {
  try {
    const { loja, tipo, setor } = req.query;

    // Busca todos os equipamentos de todas as lojas
    const allStores = await EquipamentoModel.getAllEquipamentos();
    let equipments = [];

    // Converte objeto { loja: { setor: [...] } } em array plano de equipamentos
    Object.entries(allStores).forEach(([storeKey, sectorsObj]) => {
      Object.entries(sectorsObj).forEach(([sectorKey, items]) => {
        items.forEach(item => {
          equipments.push({
            ...item,
            loja: storeKey,
            setor: sectorKey
          });
        });
      });
    });

    // Aplica filtros somente se vierem preenchidos
    if (loja) {
      equipments = equipments.filter(e => e.loja === loja);
    }
    if (tipo) {
      equipments = equipments.filter(e => e.tipo === tipo);
    }
    if (setor) {
      equipments = equipments.filter(e => e.setor === setor);
    }

    return res.json(equipments);
  } catch (error) {
    console.error("Error filtering equipments:", error);
    return res.status(500).json({ error: "Erro interno no servidor" });
  }
};

/**
 * Deleta um equipamento pelo ID
 */
export const deleteEquipment = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const success = await EquipamentoModel.removeEquipamentoById(id);
    if (!success) {
      return res.status(404).json({ error: "Equipamento não encontrado." });
    }
    return res.json({ message: "Equipamento excluído com sucesso." });
  } catch (error) {
    console.error("Erro ao excluir equipamento:", error);
    return res.status(500).json({ error: "Erro interno no servidor" });
  }
};

/**
 * Edita (atualiza) um equipamento existente pelo ID
 */
export const editEquipment = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { loja, setor, tipo, numero, serie, patrimonio } = req.body;
    const updatedFields = { loja, setor, tipo, numero, serie, patrimonio };
    const updated = await EquipamentoModel.updateEquipamentoById(id, updatedFields);
    if (!updated) {
      return res.status(404).json({ error: "Equipamento não encontrado." });
    }
    return res.json({ message: "Equipamento atualizado com sucesso.", equipamento: updated });
  } catch (error) {
    console.error("Erro ao editar equipamento:", error);
    return res.status(500).json({ error: "Erro interno no servidor" });
  }
};
