// autoTitle.js
import { tipos } from './config.js';

// Obtém o nome do arquivo atual, removendo parâmetros e extensões
const path = window.location.pathname;
const fileName = path.substring(path.lastIndexOf('/') + 1).split('?')[0].split('#')[0];
const baseName = fileName.replace('.html', '');

// Extrai o tipo do nome do arquivo, assumindo o formato 'preventiva[tipo]'
const tipoValueRaw = baseName.replace('preventiva', '');
const tipoValue = tipoValueRaw.toLowerCase().replace(/[^a-z0-9_]/g, '');

// Encontra o objeto correspondente no array 'tipos'
const tipoObj = tipos.find(t => t.value === tipoValue);

// Define o tipo com base no objeto encontrado ou usa um padrão
const tipo = tipoObj ? tipoObj.label : 'Equipamentos';

// Atualiza o título da página
document.title = `Preventiva - ${tipo}`;

// Atualiza o conteúdo do <h1>
const h1 = document.querySelector('h1');
if (h1) h1.textContent = `Preventiva - ${tipo}`;
