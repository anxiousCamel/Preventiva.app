// server.js

import express from 'express';

const app = express();
const port = 3000;

import equipamentoRoutes from './src/routes/equipamentoRoutes.js';
import preventivaRoutes from './src/routes/preventivaRoutes.js';

app.use(express.json());
app.use(express.static('public')); // Servir arquivos HTML, CSS e JS

// Definição das rotas
app.use('/equipamentos', equipamentoRoutes);
app.use('/preventivas', preventivaRoutes);

app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});
