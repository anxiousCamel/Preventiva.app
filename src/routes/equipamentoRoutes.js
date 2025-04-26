import express from 'express';
import {
  filterEquipments,   // novo controlador para filtros genéricos
  cadastrarEquipamento,
  listarEquipamentosPorLojaETipo,
  deleteEquipment, 
  editEquipment     
} from '../controllers/equipamentoController.js';

const router = express.Router();

// Rota geral de listagem/filtros: GET /equipamentos?loja=&tipo=&setor=
router.get('/', filterEquipments);

// Rotas legadas
router.get('/:loja/:tipo', listarEquipamentosPorLojaETipo);
router.post('/', cadastrarEquipamento);

// NOVAS rotas para delete e edit
router.delete('/:id', deleteEquipment);
router.put('/:id',    editEquipment);


export default router;
