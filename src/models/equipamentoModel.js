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


// src/models/equipamentoModel.js  (ou ssrc/... mas PADRONIZE p/ src/)
async function getEquipamentosPorLojaETipo(loja, tipo) {
  await initDB();
  if (!db.data.lojas[loja]) return [];

  const equipamentosEncontrados = [];
  Object.entries(db.data.lojas[loja]).forEach(([setorKey, arr]) => {
    (arr || []).forEach((equip) => {
      if (equip?.tipo === tipo) {
        equipamentosEncontrados.push({ ...equip, loja, setor: setorKey });
      }
    });
  });
  return equipamentosEncontrados;
}

/**
 * Remove um equipamento pelo ID (loja e setor são iterados para achar o item).
 * @param {number} id 
 * @returns {boolean} true se excluiu, false se não encontrou
 */
export async function removeEquipamentoById(id) {
  await initDB();
  let removed = false;

  Object.entries(db.data.lojas).forEach(([storeKey, sectors]) => {
    Object.entries(sectors).forEach(([sectorKey, items]) => {
      const index = items.findIndex(item => item.id === id);
      if (index !== -1) {
        items.splice(index, 1);
        removed = true;
      }
    });
  });

  if (removed) await db.write();
  return removed;
}

/**
 * Atualiza um equipamento existente pelo ID.
 * Só sobrescreve os campos informados em `updatedFields`.
 * @param {number} id 
 * @param {object} updatedFields 
 * @returns {object|null} equipamento atualizado ou null se não encontrado
 */
export async function updateEquipamentoById(id, updatedFields) {
  await initDB();
  let updatedEquip = null;

  // 1) Encontrar localização original
  let origStore, origSector, origIndex;
  Object.entries(db.data.lojas).forEach(([storeKey, sectors]) => {
    Object.entries(sectors).forEach(([sectorKey, items]) => {
      const idx = items.findIndex(item => item.id === id);
      if (idx !== -1) {
        origStore = storeKey;
        origSector = sectorKey;
        origIndex = idx;
      }
    });
  });

  if (origStore == null) {
    // não achou o equipamento
    return null;
  }

  // 2) Remove do array original
  const [item] = db.data.lojas[origStore][origSector].splice(origIndex, 1);

  // 3) Atualiza os campos
  const merged = { ...item, ...updatedFields };

  // 4) Determina targetStore e targetSector
  const newStore  = updatedFields.loja   ?? origStore;
  const newSector = updatedFields.setor  ?? origSector;

  // 5) Garante que exista o array destino
  if (!db.data.lojas[newStore]) {
    db.data.lojas[newStore] = {};
  }
  if (!db.data.lojas[newStore][newSector]) {
    db.data.lojas[newStore][newSector] = [];
  }

  // 6) Insere no destino
  db.data.lojas[newStore][newSector].push(merged);

  // 7) Persiste
  updatedEquip = merged;
  await db.write();

  return updatedEquip;
}

async function getEquipamentosPorLojaETipoAgrupado(loja, tipo) {
  await initDB();
  if (!db.data.lojas[loja]) return {};

  const agrupado = {};
  Object.entries(db.data.lojas[loja]).forEach(([setorKey, arr]) => {
    (arr || []).forEach((equip) => {
      if (equip?.tipo === tipo) {
        const label = equip.setor ?? setorKey ?? "SemSetor";
        (agrupado[label] ??= []).push({ ...equip, loja, setor: label });
      }
    });
  });
  return agrupado;
}

export default {
  addEquipamento,
  getAllEquipamentos,
  getEquipamentosPorLojaETipo,
  getEquipamentosPorLojaETipoAgrupado,
  removeEquipamentoById,
  updateEquipamentoById
};
