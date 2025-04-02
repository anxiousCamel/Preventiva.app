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

    // Acessa as lojas diretamente do JSON importado
    if (!db.lojas[loja]) {
      return res.status(404).json({ error: "Loja não encontrada!" });
    }

    let equipamentosEncontrados = [];

    // Percorre os setores da loja para encontrar os equipamentos do tipo desejado
    Object.values(db.lojas[loja]).forEach(setor => {
      setor.forEach(equipamento => {
        if (equipamento.tipo === tipo) {
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
