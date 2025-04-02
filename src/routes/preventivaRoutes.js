// src>routes>preventivaRoutes.js
import express from 'express';
const router = express.Router();

// Exemplo de rota
router.get('/', (req, res) => {
    res.send('Rota de preventivas funcionando!');
});

// ✅ Exporte corretamente como "default"
export default router;
