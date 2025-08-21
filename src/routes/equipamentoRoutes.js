/** @file src/routes/equipamentos.routes.js
 * Rotas REST para equipamentos.
 * - GET /equipamentos?loja=&tipo=&setor=&groupBy=setor
 * - GET /equipamentos/:loja/:tipo[?groupBy=setor]
 */

import express from "express";
import {
  filterEquipments,             // GET /equipamentos
  cadastrarEquipamento,         // POST /equipamentos
  listarEquipamentosPorLojaETipo, // GET /equipamentos/:loja/:tipo
  deleteEquipment,              // DELETE /equipamentos/:id
  editEquipment                 // PUT /equipamentos/:id
} from "../controllers/equipamentoController.js";

const router = express.Router();

/** Rota nova e genérica com filtros via querystring. */
router.get("/", filterEquipments);

/** Rotas legadas: mantém compatibilidade, mas já aceitam ?groupBy=setor */
router.get("/:loja/:tipo", listarEquipamentosPorLojaETipo);

router.post("/", cadastrarEquipamento);
router.delete("/:id", deleteEquipment);
router.put("/:id",    editEquipment);

export default router;
