// ssrc/models/equipamentoModel.js
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const file = path.join(__dirname, '/db.json');
const adapter = new JSONFile(file);
const db = new Low(adapter, { lojas: {} });

async function initDB() {
  // Cria o arquivo db.json caso não exista
  if (!fs.existsSync(file)) {
    fs.writeFileSync(file, JSON.stringify({ lojas: {} }, null, 2));
  }

  await db.read();

  // Caso o banco de dados não tenha a estrutura necessária, inicializa
  if (!db.data || !db.data.lojas) {
    db.data = { lojas: {} };
    await db.write();
  }
}

// Função para adicionar um novo equipamento
async function addEquipamento(loja, setor, tipo, numero, serie, patrimonio) {
  await initDB();

  if (!db.data.lojas[loja]) {
    db.data.lojas[loja] = {};
  }

  if (!db.data.lojas[loja][setor]) {
    db.data.lojas[loja][setor] = [];
  }

  const novoEquipamento = {
    id: Date.now(), // Gerar um ID único baseado no timestamp
    setor,
    tipo,
    numero,
    serie,
    patrimonio
  };

  // Adiciona o novo equipamento ao setor
  db.data.lojas[loja][setor].push(novoEquipamento);

  // Escreve no arquivo db.json
  await db.write();

  return novoEquipamento;
}

// Função para obter todos os equipamentos
async function getAllEquipamentos() {
  await initDB();
  return db.data.lojas || {};
}


async function getEquipamentosPorLojaETipo(loja, tipo) {
  await initDB();

  if (!db.data.lojas[loja]) {
    return [];
  }

  let equipamentosEncontrados = [];

  Object.values(db.data.lojas[loja]).forEach(setor => {
    setor.forEach(equipamento => {
      if (equipamento.tipo === tipo) {
        equipamentosEncontrados.push(equipamento);
      }
    });
  });

  return equipamentosEncontrados;
}

export default {
  addEquipamento,
  getAllEquipamentos,
  getEquipamentosPorLojaETipo
};
