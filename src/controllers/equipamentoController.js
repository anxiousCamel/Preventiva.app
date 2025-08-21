// src/controllers/equipamentoController.js
import EquipamentoModel from "../models/equipamentoModel.js";

/** =========================
 *  Utils internas (1 coisa por função)
 * ========================= */

/** Normaliza rótulos de setor para comparação estável (slug). */
function toSectorSlug(s) {
  return (s || "")
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, "-");
}

/** Clona um equipamento e injeta loja/setor sem mutar o db. */
function cloneWithStoreAndSector(item, loja, setor) {
  return { ...item, loja, setor };
}

/** Achata toda a estrutura {loja:{setor:[...]}} em array plano. */
function buildFlatFromAllStores(allStores) {
  const out = [];
  Object.entries(allStores || {}).forEach(([lojaKey, setoresObj]) => {
    Object.entries(setoresObj || {}).forEach(([setorKey, arr]) => {
      (arr || []).forEach((it) => out.push(cloneWithStoreAndSector(it, lojaKey, setorKey)));
    });
  });
  return out;
}

/** Agrupa um array plano por setor (rótulo preservado). */
function groupBySector(flat) {
  const grouped = {};
  for (const e of flat) {
    const label = e.setor || "SemSetor";
    (grouped[label] ??= []).push(e);
  }
  return grouped;
}

/** Cache TTL simples em memória. */
const cache = new Map(); // key => {expires, data}
const DEFAULT_TTL_MS = 30_000;
const makeKey = (base, params) => `${base}:${JSON.stringify(params)}`;
const cacheGet = (k) => {
  const hit = cache.get(k);
  if (!hit) return null;
  if (Date.now() > hit.expires) { cache.delete(k); return null; }
  return hit.data;
};
const cacheSet = (k, data, ttl = DEFAULT_TTL_MS) => cache.set(k, { expires: Date.now() + ttl, data });

/** =========================
 *  Controllers
 * ========================= */

/**
 * @function listarEquipamentos
 * @description Retorna todos os equipamentos (sem filtros).
 */
export const listarEquipamentos = async (req, res) => {
  try {
    const equipamentos = await EquipamentoModel.getAllEquipamentos();
    res.json(equipamentos);
  } catch (error) {
    console.error("Erro ao listar equipamentos:", error);
    res.status(500).json({ error: "Erro interno no servidor" });
  }
};

/**
 * @function cadastrarEquipamento
 * @description Cadastra um novo equipamento.
 */
export const cadastrarEquipamento = async (req, res) => {
  try {
    const { loja, setor, tipo, numero, serie, patrimonio } = req.body;

    if (!loja || !setor || !tipo || !numero || !serie || !patrimonio) {
      return res.status(400).json({ error: "Preencha todos os campos!" });
    }

    const novoEquipamento = await EquipamentoModel.addEquipamento(
      loja, setor, tipo, numero, serie, patrimonio
    );

    // limpa cache grosseiramente
    cache.clear();

    res.status(201).json({ message: "Equipamento cadastrado com sucesso!", equipamento: novoEquipamento });
  } catch (error) {
    console.error("Erro ao cadastrar equipamento:", error);
    res.status(500).json({ error: "Erro interno no servidor" });
  }
};

/**
 * @function listarEquipamentosPorLojaETipo
 * @description GET /equipamentos/:loja/:tipo[?groupBy=setor&setor=...]
 * - Por padrão retorna FLAT (array).
 * - Se groupBy=setor, retorna objeto agrupado por rótulo de setor.
 * - Filtro setor aceita label ou slug.
 */
export const listarEquipamentosPorLojaETipo = async (req, res) => {
  try {
    const { loja, tipo } = req.params;
    const { groupBy = "", setor = "" } = req.query;

    // cache
    const cacheKey = makeKey("LEGACY_LIST", { loja, tipo, groupBy, setor });
    const cached = cacheGet(cacheKey);
    if (cached) return res.json(cached);

    if (groupBy.toLowerCase() === "setor") {
      // AGRUPADO NO MODEL
      const grouped = await EquipamentoModel.getEquipamentosPorLojaETipoAgrupado(loja, tipo);

      // filtro opcional por setor (aceita label ou slug)
      if (setor) {
        const qSlug = toSectorSlug(setor);
        const only = {};
        for (const [label, arr] of Object.entries(grouped)) {
          if (label === setor || toSectorSlug(label) === qSlug) only[label] = arr;
        }
        cacheSet(cacheKey, only);
        return res.json(only);
      }

      cacheSet(cacheKey, grouped);
      return res.json(grouped);
    }

    // FLAT (já com setor/loja vindos do model — ver item 2 do model)
    let flat = await EquipamentoModel.getEquipamentosPorLojaETipo(loja, tipo);

    // filtro opcional por setor (aceita label/slug)
    if (setor) {
      const qSlug = toSectorSlug(setor);
      flat = flat.filter(e => e.setor === setor || toSectorSlug(e.setor) === qSlug);
    }

    cacheSet(cacheKey, flat);
    return res.json(flat);
  } catch (error) {
    console.error("Erro ao listar equipamentos:", error);
    res.status(500).json({ error: "Erro interno no servidor" });
  }
};


/**
 * @function filterEquipments
 * @description GET /equipamentos?loja=&tipo=&setor=&groupBy=setor
 * - Busca todas as lojas via model, achata e filtra.
 * - Se groupBy=setor, retorna agrupado.
 */
export const filterEquipments = async (req, res) => {
  try {
    const loja   = String(req.query.loja || "").trim();
    const tipo   = String(req.query.tipo || "").trim();
    const setorQ = String(req.query.setor || "").trim();
    const groupBy = String(req.query.groupBy || "").trim();

    const cacheKey = makeKey("FILTER", { loja, tipo, setorQ, groupBy });
    const cached = cacheGet(cacheKey);
    if (cached) return res.json(cached);

    const allStores = await EquipamentoModel.getAllEquipamentos(); // { loja: { setor: [...] } }
    let flat = buildFlatFromAllStores(allStores);

    if (loja) flat = flat.filter((e) => e.loja === loja);
    if (tipo) flat = flat.filter((e) => e.tipo === tipo);
    if (setorQ) {
      const qSlug = toSectorSlug(setorQ);
      flat = flat.filter((e) => e.setor === setorQ || toSectorSlug(e.setor) === qSlug);
    }

    if (groupBy.toLowerCase() === "setor") {
      const grouped = groupBySector(flat);
      cacheSet(cacheKey, grouped);
      return res.json(grouped);
    }

    cacheSet(cacheKey, flat);
    return res.json(flat);
  } catch (error) {
    console.error("Error filtering equipments:", error);
    return res.status(500).json({ error: "Erro interno no servidor" });
  }
};

/**
 * @function deleteEquipment
 * @description DELETE /equipamentos/:id
 */
export const deleteEquipment = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const success = await EquipamentoModel.removeEquipamentoById(id);
    cache.clear();
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
 * @function editEquipment
 * @description PUT /equipamentos/:id
 */
export const editEquipment = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { loja, setor, tipo, numero, serie, patrimonio } = req.body;
    const updatedFields = { loja, setor, tipo, numero, serie, patrimonio };
    const updated = await EquipamentoModel.updateEquipamentoById(id, updatedFields);
    cache.clear();
    if (!updated) {
      return res.status(404).json({ error: "Equipamento não encontrado." });
    }
    return res.json({ message: "Equipamento atualizado com sucesso.", equipamento: updated });
  } catch (error) {
    console.error("Erro ao editar equipamento:", error);
    return res.status(500).json({ error: "Erro interno no servidor" });
  }
};
