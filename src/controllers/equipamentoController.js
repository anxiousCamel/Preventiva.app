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
