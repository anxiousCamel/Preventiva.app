// src/routes/equipamentoRoutes.js

import express from 'express';
import { listarEquipamentos, cadastrarEquipamento, listarEquipamentosPorLojaETipo } from '../controllers/equipamentoController.js';


const router = express.Router();

// Rota para cadastrar um novo equipamento
router.post('/', cadastrarEquipamento);

// Rota para lista equipamentos por loja e tipo
router.get('/:loja/:tipo', listarEquipamentosPorLojaETipo);

export default router;
